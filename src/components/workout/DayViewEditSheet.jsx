import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const REST_PRESETS = [15, 30, 45, 60, 90, 120, 150, 180, 240, 300];

function formatRest(s) {
  if (!s) return '90s';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function stepRest(current, dir) {
  const idx = REST_PRESETS.indexOf(current);
  if (dir === 'up') {
    return idx >= 0 && idx < REST_PRESETS.length - 1 ? REST_PRESETS[idx + 1] : Math.min(600, current + 15);
  }
  return idx > 0 ? REST_PRESETS[idx - 1] : Math.max(0, current - 15);
}

export default function DayViewEditSheet({ day, exercises: initialExercises, onClose, onSaved }) {
  const [exercises, setExercises] = useState(() => initialExercises.map((e) => ({ ...e })));
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const update = (id, changes) => {
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)));
    setIsDirty(true);
  };

  const handleCloseRequest = () => {
    if (isDirty) setShowDiscardConfirm(true);
    else onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const ex of exercises) {
        await base44.entities.SplitExercise.update(ex.id, {
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          rest_seconds: ex.rest_seconds,
          rpe: ex.rpe,
        });
      }
      toast.success('Changes saved');
      setIsDirty(false);
      setShowSaveConfirm(false);
      onSaved?.();
      onClose();
    } catch {
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleCloseRequest} />

      {/* Sheet */}
      <div className="relative bg-card rounded-t-3xl border-t border-border flex flex-col" style={{ maxHeight: '88vh' }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <button
            onClick={handleCloseRequest}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground"
          >
            <X size={18} />
          </button>

          <div className="text-center">
            <p className="font-heading font-bold text-base">{day.day_of_week}</p>
            <p className="text-xs text-muted-foreground">{day.custom_name || day.session_type}</p>
          </div>

          <button
            onClick={() => isDirty ? setShowSaveConfirm(true) : onClose()}
            disabled={saving}
            className={cn(
              'px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors',
              isDirty
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            )}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Exercise list */}
        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-3" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>

          {exercises.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-12">No exercises on this day yet.</p>
          )}

          {exercises.map((ex) => {
            const isCardio = ex.exercise_type === 'cardio';
            const cardioUnit = ex.cardio_metric === 'time' ? 'min' : ex.cardio_metric === 'calories' ? 'kcal' : 'km';

            return (
              <div key={ex.id} className="bg-secondary/50 rounded-2xl p-4 flex flex-col gap-3">

                {/* Exercise name row */}
                <div className="flex items-center gap-3">
                  {ex.image_url && (
                    <img src={ex.image_url} alt={ex.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                      {isCardio ? (ex.cardio_metric || 'cardio') : 'strength'}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                {isCardio ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground capitalize shrink-0">{ex.cardio_metric || 'distance'}:</span>
                    <input
                      type="text"
                      value={ex.target_reps || ''}
                      onChange={(e) => update(ex.id, { target_reps: e.target.value })}
                      placeholder="e.g. 5"
                      className="flex-1 h-9 bg-input border border-border rounded-xl px-3 text-sm text-center"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">{cardioUnit}</span>
                  </div>
                ) : (
                  <div className="flex items-stretch gap-3">

                    {/* Sets */}
                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Sets</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => update(ex.id, { target_sets: Math.max(1, (ex.target_sets || 3) - 1) })}
                          className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                        >
                          <Minus size={12} className="text-muted-foreground" />
                        </button>
                        <span className="text-lg font-bold text-foreground w-8 text-center">{ex.target_sets || 3}</span>
                        <button
                          onClick={() => update(ex.id, { target_sets: Math.min(20, (ex.target_sets || 3) + 1) })}
                          className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                        >
                          <Plus size={12} className="text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    <div className="w-px bg-border self-stretch" />

                    {/* Reps */}
                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Reps</span>
                      <input
                        type="text"
                        value={ex.target_reps || ''}
                        onChange={(e) => update(ex.id, { target_reps: e.target.value })}
                        placeholder="10"
                        className="w-full h-9 bg-input border border-border rounded-xl px-2 text-sm text-center font-bold"
                      />
                    </div>

                    <div className="w-px bg-border self-stretch" />

                    {/* Rest */}
                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Rest</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => update(ex.id, { rest_seconds: stepRest(ex.rest_seconds || 90, 'down') })}
                          className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                        >
                          <Minus size={12} className="text-muted-foreground" />
                        </button>
                        <span className="text-xs font-bold text-foreground w-10 text-center leading-tight">
                          {formatRest(ex.rest_seconds || 90)}
                        </span>
                        <button
                          onClick={() => update(ex.id, { rest_seconds: stepRest(ex.rest_seconds || 90, 'up') })}
                          className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                        >
                          <Plus size={12} className="text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* RPE slider — shown if the exercise already has one set */}
                {ex.rpe != null && (
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide shrink-0">RPE</span>
                    <input
                      type="range"
                      min={6} max={10} step={0.5}
                      value={ex.rpe}
                      onChange={(e) => update(ex.id, { rpe: Number(e.target.value) })}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-xs font-bold text-primary w-7 text-right">{ex.rpe}</span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* ── Save confirmation ── */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSaveConfirm(false)} />
          <div
            className="relative w-full bg-card rounded-t-3xl p-6 border-t border-border"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            <h2 className="font-heading font-bold text-base mb-1">Save Changes?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              This will update the exercise targets for {day.day_of_week} — {day.custom_name || day.session_type}.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Discard confirmation ── */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDiscardConfirm(false)} />
          <div
            className="relative w-full bg-card rounded-t-3xl p-6 border-t border-border"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            <h2 className="font-heading font-bold text-base mb-1">Discard Changes?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              You have unsaved changes. If you close now they'll be lost.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold"
              >
                Keep Editing
              </button>
              <button
                onClick={() => { setShowDiscardConfirm(false); onClose(); }}
                className="flex-1 py-3 rounded-2xl bg-destructive text-white text-sm font-semibold"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
