import { useState, useRef } from 'react';
import {
  X, Sparkles, ImagePlus, Loader2, SkipForward, ChevronRight,
  Check, Plus, Trash2, AlertCircle, Camera
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { DAYS } from './exerciseData';

// ─── helpers ────────────────────────────────────────────────────────────────
const emptyDay = (dayName, i) => ({
  day: dayName, session_type: 'Rest', exercises: [], open: false, order_index: i,
});

const REST_PRESETS = [30, 60, 90, 120, 180, 240];

const defaultExercise = () => ({
  name: '', exercise_type: 'strength', target_sets: 3,
  target_reps: '8-12', rpe: 7, rest_seconds: 90, notes: '',
});

// ─── Inline editable exercise row ───────────────────────────────────────────
function ExerciseRow({ ex, idx, onChange, onDelete }) {
  return (
    <div className="bg-secondary/60 border border-border rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          value={ex.name}
          onChange={(e) => onChange({ ...ex, name: e.target.value })}
          placeholder="Exercise name"
          className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-sm"
        />
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive p-1">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase">Sets</span>
          <input
            type="number" min={1} max={20}
            value={ex.target_sets}
            onChange={(e) => onChange({ ...ex, target_sets: Number(e.target.value) })}
            className="bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-center"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase">Reps</span>
          <input
            value={ex.target_reps}
            onChange={(e) => onChange({ ...ex, target_reps: e.target.value })}
            placeholder="8-12"
            className="bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-center"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase">RPE</span>
          <input
            type="number" min={5} max={10} step={0.5}
            value={ex.rpe}
            onChange={(e) => onChange({ ...ex, rpe: Number(e.target.value) })}
            className="bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-center"
          />
        </label>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-muted-foreground uppercase">Rest</span>
        <div className="flex gap-1 flex-wrap">
          {REST_PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => onChange({ ...ex, rest_seconds: s })}
              className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                ex.rest_seconds === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {s >= 60 ? `${s / 60}m` : `${s}s`}
            </button>
          ))}
        </div>
      </div>
      {ex.notes ? (
        <p className="text-xs text-muted-foreground italic">{ex.notes}</p>
      ) : null}
    </div>
  );
}

// ─── Main modal ─────────────────────────────────────────────────────────────
export default function ImportSplitModal({ onImport, onClose }) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [builtDays, setBuiltDays] = useState([]);
  const [splitName, setSplitName] = useState('Imported Split');

  // per-day upload state
  const [images, setImages] = useState([]); // array of {file, url}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // review state
  const [reviewing, setReviewing] = useState(false);
  const [reviewData, setReviewData] = useState(null); // {session_type, exercises}
  const [aiCorrections, setAiCorrections] = useState([]); // user feedback log
  const [reanalyzing, setReanalyzing] = useState(false);

  const fileRef = useRef();
  const currentDay = DAYS[currentDayIndex];
  const isLastDay = currentDayIndex === DAYS.length - 1;
  const progressPct = Math.round((currentDayIndex / DAYS.length) * 100);

  // ── image handling ─────────────────────────────────────────────────────────
  const addFiles = (files) => {
    const newImgs = Array.from(files).map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...newImgs]);
    setError(null);
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  // ── analyse all screenshots for this day ──────────────────────────────────
  const analyse = async (corrections = []) => {
    setLoading(true);
    setError(null);
    try {
      // Upload all images in parallel
      const uploadedUrls = await Promise.all(
        images.map((img) => base44.integrations.Core.UploadFile({ file: img.file }).then((r) => r.file_url))
      );

      const correctionNote = corrections.length
        ? `\n\nThe user reviewed your previous extraction and made these corrections:\n${corrections.map((c) => `- ${c}`).join('\n')}\nPlease fix those mistakes.`
        : '';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a fitness expert. Analyse ALL of the provided workout screenshots for ${currentDay}'s training session. There may be multiple screenshots — combine all exercises from all of them into one list.

Extract every exercise and return JSON:
{
  "split_name": "name of the program if visible, otherwise null",
  "session_type": "Push|Pull|Legs|Upper|Lower|Full Body|Cardio|Custom",
  "exercises": [
    {
      "name": "Exercise name",
      "exercise_type": "strength|cardio",
      "target_sets": 3,
      "target_reps": "8-12",
      "rpe": 7,
      "rest_seconds": 90,
      "notes": "any tempo, cues, or extra info"
    }
  ]
}

Rules:
- target_reps: string like "8-12", "10", "AMRAP".
- rpe: infer from rep range if not stated (15+ reps → 7, 8-12 → 7.5, 4-6 → 8.5). Default 7.
- rest_seconds: infer if not stated (compound → 120-180, isolation → 60-90, cardio → 30-60).
- exercise_type: "cardio" only for cardio.
- Do NOT duplicate exercises.${correctionNote}`,
        file_urls: uploadedUrls,
        response_json_schema: {
          type: 'object',
          properties: {
            split_name: { type: 'string' },
            session_type: { type: 'string' },
            exercises: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  exercise_type: { type: 'string' },
                  target_sets: { type: 'number' },
                  target_reps: { type: 'string' },
                  rpe: { type: 'number' },
                  rest_seconds: { type: 'number' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
      });

      if (result.split_name && splitName === 'Imported Split') setSplitName(result.split_name);

      setReviewData({
        session_type: result.session_type || 'Custom',
        exercises: (result.exercises || []).map((ex) => ({
          name: ex.name,
          image_url: null,
          exercise_type: ex.exercise_type || 'strength',
          target_sets: ex.target_sets || 3,
          target_reps: String(ex.target_reps || '8-12'),
          rpe: ex.rpe || 7,
          rest_seconds: ex.rest_seconds || 90,
          notes: ex.notes || '',
        })),
      });
      setReviewing(true);
    } catch {
      setError('Could not read the screenshots. Please try clearer images.');
    } finally {
      setLoading(false);
      setReanalyzing(false);
    }
  };

  // ── review actions ─────────────────────────────────────────────────────────
  const updateReviewExercise = (idx, updated) => {
    setReviewData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e, i) => (i === idx ? updated : e)),
    }));
  };

  const deleteReviewExercise = (idx) => {
    setReviewData((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== idx),
    }));
  };

  const addReviewExercise = () => {
    setReviewData((prev) => ({
      ...prev,
      exercises: [...prev.exercises, defaultExercise()],
    }));
  };

  // User says something is wrong — collect their feedback and re-analyse
  const [correctionInput, setCorrectionInput] = useState('');
  const [showCorrectionBox, setShowCorrectionBox] = useState(false);

  const handleRequestCorrection = async () => {
    const newCorrections = correctionInput.trim()
      ? [...aiCorrections, correctionInput.trim()]
      : aiCorrections;
    setAiCorrections(newCorrections);
    setCorrectionInput('');
    setShowCorrectionBox(false);
    setReviewing(false);
    setReanalyzing(true);
    await analyse(newCorrections);
  };

  // ── advance to next day ────────────────────────────────────────────────────
  const confirmAndAdvance = () => {
    const dayData = {
      day: currentDay,
      session_type: reviewData.session_type,
      exercises: reviewData.exercises,
      open: false,
      order_index: currentDayIndex,
    };
    const updated = [...builtDays, dayData];
    setBuiltDays(updated);

    if (isLastDay) {
      const final = DAYS.map((d, i) => updated[i] || emptyDay(d, i));
      onImport({ name: splitName, days: final });
    } else {
      setCurrentDayIndex((prev) => prev + 1);
      setImages([]);
      setReviewing(false);
      setReviewData(null);
      setAiCorrections([]);
      setError(null);
    }
  };

  const handleSkip = () => {
    const updated = [...builtDays, emptyDay(currentDay, currentDayIndex)];
    setBuiltDays(updated);
    if (isLastDay) {
      const final = DAYS.map((d, i) => updated[i] || emptyDay(d, i));
      onImport({ name: splitName, days: final });
    } else {
      setCurrentDayIndex((prev) => prev + 1);
      setImages([]);
      setReviewing(false);
      setReviewData(null);
      setAiCorrections([]);
      setError(null);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex-1 overflow-y-auto flex flex-col max-w-md mx-auto w-full">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h2 className="font-heading font-bold text-base">Import Split with AI</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground p-1"><X size={18} /></button>
        </div>

        {/* Progress */}
        <div className="px-5 flex flex-col gap-1.5 mb-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Day {currentDayIndex + 1} of {DAYS.length}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex gap-1 mt-1 flex-wrap">
            {DAYS.map((d, i) => (
              <span key={d} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                i < currentDayIndex ? 'bg-primary/20 text-primary'
                : i === currentDayIndex ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
              }`}>
                {d.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 px-5 flex flex-col gap-4 pb-6">

          {/* ── REVIEW SCREEN ── */}
          {reviewing && reviewData ? (
            <>
              <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-primary">
                  ✅ AI extracted <span className="font-bold">{reviewData.exercises.length}</span> exercises for <span className="font-bold">{currentDay}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review below. Edit anything that's wrong, then confirm.
                </p>
              </div>

              {/* Session type */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Session:</span>
                <input
                  value={reviewData.session_type}
                  onChange={(e) => setReviewData((p) => ({ ...p, session_type: e.target.value }))}
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-sm"
                />
              </div>

              {/* Exercises */}
              <div className="flex flex-col gap-2">
                {reviewData.exercises.map((ex, idx) => (
                  <ExerciseRow
                    key={idx}
                    ex={ex}
                    idx={idx}
                    onChange={(updated) => updateReviewExercise(idx, updated)}
                    onDelete={() => deleteReviewExercise(idx)}
                  />
                ))}
                <button
                  onClick={addReviewExercise}
                  className="flex items-center justify-center gap-2 border border-dashed border-border rounded-xl py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Plus size={14} /> Add exercise
                </button>
              </div>

              {/* AI correction box */}
              {showCorrectionBox ? (
                <div className="bg-muted/50 rounded-xl p-3 flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">Describe what the AI got wrong (e.g. "missing Romanian Deadlift", "bench press sets should be 4"):</p>
                  <textarea
                    value={correctionInput}
                    onChange={(e) => setCorrectionInput(e.target.value)}
                    rows={3}
                    placeholder="e.g. You missed incline dumbbell press and the squat reps should be 5-8"
                    className="bg-input border border-border rounded-lg px-3 py-2 text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCorrectionBox(false)}
                      className="flex-1 border border-border rounded-xl py-2 text-sm text-muted-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRequestCorrection}
                      disabled={reanalyzing}
                      className="flex-1 bg-primary text-primary-foreground rounded-xl py-2 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {reanalyzing ? <><Loader2 size={14} className="animate-spin" /> Re-analysing...</> : '✨ Re-analyse'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCorrectionBox(true)}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground border border-dashed border-border rounded-xl py-2.5 hover:border-destructive/50 hover:text-destructive transition-colors"
                >
                  <AlertCircle size={14} /> Something's wrong — ask AI to fix it
                </button>
              )}

              {/* Confirm */}
              <button
                onClick={confirmAndAdvance}
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold"
              >
                <Check size={16} />
                {isLastDay ? 'Confirm & Finish' : `Confirm & Continue to ${DAYS[currentDayIndex + 1]}`}
              </button>
            </>
          ) : (
            /* ── UPLOAD SCREEN ── */
            <>
              <div className="bg-muted/50 rounded-xl px-4 py-3">
                <p className="text-sm font-medium">
                  📅 Upload screenshots for <span className="text-primary font-bold">{currentDay}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You can add multiple screenshots if your workout doesn't fit in one. Tap "Skip" if it's a rest day.
                </p>
              </div>

              {/* Thumbnails */}
              {images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {/* Add more */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              )}

              {/* Upload area (shown when empty) */}
              {images.length === 0 && (
                <div
                  className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 p-8 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                  onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <ImagePlus size={28} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Tap to upload <span className="font-medium text-foreground">{currentDay}</span>'s workout screenshots
                  </p>
                  <p className="text-xs text-muted-foreground">You can select multiple at once</p>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />

              {error && (
                <p className="text-sm text-destructive text-center flex items-center justify-center gap-1">
                  <AlertCircle size={14} /> {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 border border-border text-muted-foreground py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
                >
                  <SkipForward size={15} /> Skip (Rest Day)
                </button>
                <button
                  onClick={() => analyse()}
                  disabled={images.length === 0 || loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Analysing...</>
                    : <><Sparkles size={15} /> Analyse {images.length > 1 ? `${images.length} shots` : 'Screenshot'}</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}