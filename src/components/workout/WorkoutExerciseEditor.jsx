import { useState } from 'react';
import { X, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SESSION_MUSCLE_GROUPS, EXERCISES_BY_MUSCLE } from '@/components/splitbuilder/exerciseData';

export default function WorkoutExerciseEditor({ exercises, sessionType, onClose, onReorder, onRemove, onAdd }) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [customName, setCustomName] = useState('');

  const muscleGroups = SESSION_MUSCLE_GROUPS[sessionType] ||
    SESSION_MUSCLE_GROUPS['Custom'];

  const existingNames = new Set(exercises.map((e) => e.name));

  const handleAdd = (name, isCardio = false) => {
    const ex = {
      id: `temp_${Date.now()}_${Math.random()}`,
      name,
      exercise_type: isCardio ? 'cardio' : 'strength',
      target_sets: 3,
      target_reps: '10',
      rest_seconds: 90,
      order_index: exercises.length,
    };
    onAdd(ex);
    setShowPicker(false);
    setCustomName('');
  };

  const handleCustomAdd = () => {
    if (!customName.trim()) return;
    handleAdd(customName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-card rounded-t-3xl border-t border-border max-h-[80vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-heading font-bold text-base">Edit Exercises</h2>
          <button onClick={onClose} className="text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-2">
          {/* Exercise list */}
          {exercises.map((ex, idx) => (
            <div key={ex.id} className="flex items-center gap-3 bg-secondary/50 rounded-2xl px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{ex.name}</p>
                <p className="text-xs text-muted-foreground">
                  {ex.exercise_type === 'cardio'
                    ? ex.cardio_metric || 'cardio'
                    : `${ex.target_sets} × ${ex.target_reps}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onReorder(idx, idx - 1)}
                  disabled={idx === 0}
                  className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center disabled:opacity-30"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  onClick={() => onReorder(idx, idx + 1)}
                  disabled={idx === exercises.length - 1}
                  className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center disabled:opacity-30"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  onClick={() => onRemove(ex.id)}
                  className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {/* Add exercise */}
          {!showPicker ? (
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center justify-center gap-2 py-3 border border-dashed border-border rounded-2xl text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              <Plus size={16} /> Add Exercise
            </button>
          ) : (
            <div className="bg-secondary/50 rounded-2xl p-3 flex flex-col gap-3">
              {/* Muscle group tabs */}
              <div className="flex flex-wrap gap-1.5">
                {muscleGroups.map((mg) => (
                  <button
                    key={mg}
                    onClick={() => setSelectedMuscle(mg === selectedMuscle ? null : mg)}
                    className={cn(
                      'px-3 py-1 rounded-xl text-xs border transition-colors',
                      selectedMuscle === mg
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    {mg}
                  </button>
                ))}
              </div>

              {/* Exercise list for selected muscle */}
              {selectedMuscle && (
                <div className="flex flex-col gap-1">
                  {(EXERCISES_BY_MUSCLE[selectedMuscle] || []).map((e) => (
                    <button
                      key={e.name}
                      disabled={existingNames.has(e.name)}
                      onClick={() => handleAdd(e.name, selectedMuscle === 'Cardio')}
                      className={cn(
                        'text-left px-3 py-2 rounded-xl text-sm transition-colors',
                        existingNames.has(e.name)
                          ? 'text-muted-foreground/40 cursor-not-allowed'
                          : 'hover:bg-primary/10 hover:text-primary'
                      )}
                    >
                      {e.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom exercise */}
              <div className="flex gap-2">
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
                  placeholder="Custom exercise name..."
                  className="flex-1 h-9 rounded-xl bg-input border border-border px-3 text-sm"
                />
                <button
                  onClick={handleCustomAdd}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
                >
                  Add
                </button>
              </div>

              <button
                onClick={() => setShowPicker(false)}
                className="text-xs text-muted-foreground text-center"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}