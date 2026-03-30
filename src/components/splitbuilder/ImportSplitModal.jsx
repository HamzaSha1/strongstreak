import { useState, useRef } from 'react';
import { X, Sparkles, ImagePlus, Loader2, SkipForward, ChevronRight, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { DAYS } from './exerciseData';

const emptyDay = (dayName, i) => ({
  day: dayName,
  session_type: 'Rest',
  exercises: [],
  open: false,
  order_index: i,
});

export default function ImportSplitModal({ onImport, onClose }) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [builtDays, setBuiltDays] = useState([]);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [splitName, setSplitName] = useState('Imported Split');
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  const currentDay = DAYS[currentDayIndex];
  const isLastDay = currentDayIndex === DAYS.length - 1;

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
    setError(null);
  };

  const advance = (dayData) => {
    const updated = [...builtDays, dayData];
    setBuiltDays(updated);

    if (isLastDay) {
      // Fill any remaining days (shouldn't happen, but safety)
      const final = DAYS.map((d, i) => updated[i] || emptyDay(d, i));
      onImport({ name: splitName, days: final });
    } else {
      setCurrentDayIndex((prev) => prev + 1);
      setImage(null);
      setImageUrl(null);
      setError(null);
    }
  };

  const handleSkip = () => {
    advance(emptyDay(currentDay, currentDayIndex));
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: image });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a fitness expert. Analyze this workout screenshot for ${currentDay}'s training session.

Extract all exercises and return JSON with this exact structure:
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
      "notes": "any extra notes or tempo info"
    }
  ]
}

Rules:
- target_reps must be a string like "8-12", "10", "AMRAP", "15-20".
- rpe: if not stated, infer from rep range (15+ reps → 7, 8-12 → 7.5, 4-6 → 8.5). Default 7.
- rest_seconds: if not stated, infer (compound → 120-180, isolation → 60-90, cardio → 30-60).
- exercise_type: "cardio" only for cardio, everything else "strength".
- Extract every exercise visible in the image.`,
        file_urls: [file_url],
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

      // Update split name from first day that has one
      if (result.split_name && splitName === 'Imported Split') {
        setSplitName(result.split_name);
      }

      const dayData = {
        day: currentDay,
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
        open: false,
        order_index: currentDayIndex,
      };

      advance(dayData);
    } catch (err) {
      setError('Could not read the screenshot. Please try a clearer image.');
    } finally {
      setLoading(false);
    }
  };

  const progressPct = Math.round((currentDayIndex / DAYS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md flex flex-col gap-4 p-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h2 className="font-heading font-bold text-base">Import Split with AI</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground p-1">
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Day {currentDayIndex + 1} of {DAYS.length}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* Day pills */}
          <div className="flex gap-1 mt-1 flex-wrap">
            {DAYS.map((d, i) => (
              <span
                key={d}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  i < currentDayIndex
                    ? 'bg-primary/20 text-primary'
                    : i === currentDayIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {d.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>

        {/* Instruction */}
        <div className="bg-muted/50 rounded-xl px-4 py-3">
          <p className="text-sm font-medium">
            📅 Upload your <span className="text-primary font-bold">{currentDay}</span> workout screenshot
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            If {currentDay} is a rest day, tap "Skip (Rest Day)" below.
          </p>
        </div>

        {/* Upload area */}
        <div
          className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 p-5 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => e.preventDefault()}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="Preview" className="max-h-44 rounded-lg object-contain" />
          ) : (
            <>
              <ImagePlus size={28} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Tap to upload <span className="font-medium text-foreground">{currentDay}</span>'s workout
              </p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {imageUrl && (
          <button onClick={() => { setImage(null); setImageUrl(null); }} className="text-xs text-muted-foreground underline text-center -mt-2">
            Remove image
          </button>
        )}

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 border border-border text-muted-foreground py-2.5 rounded-xl text-sm font-medium hover:border-foreground/30 transition-colors disabled:opacity-40"
          >
            <SkipForward size={15} />
            Skip (Rest Day)
          </button>

          <button
            onClick={handleAnalyze}
            disabled={!image || loading}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-opacity"
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Analyzing...</>
            ) : isLastDay ? (
              <><Check size={15} /> Finish</>
            ) : (
              <><ChevronRight size={15} /> Next Day</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}