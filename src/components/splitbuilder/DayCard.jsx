import { useRef, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Check as CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SESSION_TYPES } from './exerciseData';
import ExercisePicker from './ExercisePicker';
import ExerciseConfig from './ExerciseConfig';

export default function DayCard({ day, dayIndex, onUpdate }) {
  const isRest = day.session_type === 'Rest';
  const hasSessionType = !!day.session_type && day.session_type !== '';
  const [lastAddedIdx, setLastAddedIdx] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(day.custom_name || '');
  const newExerciseRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (editingName && nameInputRef.current) nameInputRef.current.focus();
  }, [editingName]);

  const commitName = () => {
    setEditingName(false);
    onUpdate({ custom_name: nameValue.trim() || undefined });
  };

  useEffect(() => {
    if (lastAddedIdx !== null && newExerciseRef.current) {
      setTimeout(() => {
        newExerciseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      setLastAddedIdx(null);
    }
  }, [lastAddedIdx, day.exercises.length]);

  const addExercise = (ex) => {
    const newEx = {
      name: ex.name,
      image_url: ex.image || null,
      exercise_type: 'strength',
      target_sets: 3,
      target_reps: '8',
      rpe: 7,
      rest_seconds: 90,
    };
    const newIdx = day.exercises.length;
    onUpdate({ exercises: [...day.exercises, newEx] });
    setLastAddedIdx(newIdx);
  };

  const addCustomExercise = (name) => {
    const newEx = {
      name,
      image_url: null,
      exercise_type: 'strength',
      target_sets: 3,
      target_reps: '8',
      rpe: 7,
      rest_seconds: 90,
    };
    const newIdx = day.exercises.length;
    onUpdate({ exercises: [...day.exercises, newEx] });
    setLastAddedIdx(newIdx);
  };

  const updateExercise = (idx, updated) => {
    let exercises = day.exercises.map((e, i) => (i === idx ? updated : e));
    // Sync superset_group to partner exercise
    if (updated.superset_group) {
      exercises = exercises.map((e, i) => {
        if (i === idx) return e;
        const partnerGroupId = [updated.name, e.name].sort().join('__');
        if (partnerGroupId === updated.superset_group) {
          return { ...e, superset_group: updated.superset_group };
        }
        return e;
      });
    }
    onUpdate({ exercises });
  };

  const deleteExercise = (idx) => {
    onUpdate({ exercises: day.exercises.filter((_, i) => i !== idx) });
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3.5"
        onClick={() => onUpdate({ open: !day.open })}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="font-heading font-bold text-base shrink-0">{day.day}</span>
          {hasSessionType && (
            <span className={cn(
              'text-xs px-2.5 py-1 rounded-full font-medium shrink-0',
              isRest ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'
            )}>
              {day.custom_name || day.session_type}
            </span>
          )}
          {day.exercises.length > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">
              {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {day.open
          ? <ChevronUp size={16} className="text-muted-foreground" />
          : <ChevronDown size={16} className="text-muted-foreground" />
        }
      </button>

      {/* Body */}
      {day.open && (
        <div className="border-t border-border px-4 pb-5 pt-4">
          {/* Custom name */}
          <p className="text-xs text-muted-foreground mb-2">Custom Name (optional)</p>
          <div className="flex items-center gap-2 mb-4">
            {editingName ? (
              <>
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitName(); }}
                  placeholder={day.session_type || 'e.g. Full Body'}
                  className="flex-1 h-9 rounded-xl bg-input border border-primary px-3 text-sm outline-none"
                />
                <button onClick={commitName} className="p-2 rounded-xl bg-primary text-primary-foreground">
                  <CheckIcon size={14} />
                </button>
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
                className="flex items-center gap-2 h-9 px-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors w-full text-left"
              >
                <Pencil size={13} />
                {nameValue || <span className="italic opacity-60">Tap to add custom name...</span>}
              </button>
            )}
          </div>

          {/* Session type picker */}
          <p className="text-xs text-muted-foreground mb-2">Session Type</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {SESSION_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => onUpdate({ session_type: t, exercises: [] })}
                className={cn(
                  'px-3.5 py-1.5 rounded-full border text-sm transition-colors',
                  day.session_type === t
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/40'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Exercise section (only if not Rest) */}
          {!isRest && hasSessionType && (
            <>
              {/* Added exercises */}
              {day.exercises.map((ex, idx) => (
                <div key={idx} ref={idx === lastAddedIdx ? newExerciseRef : null}>
                  <ExerciseConfig
                    exercise={ex}
                    onChange={(updated) => updateExercise(idx, updated)}
                    onDelete={() => deleteExercise(idx)}
                    allExercises={day.exercises}
                  />
                </div>
              ))}

              {/* Exercise picker */}
              <div className="mt-2 border-t border-dashed border-border pt-4">
                <ExercisePicker
                  sessionType={day.session_type}
                  addedNames={day.exercises.map((e) => e.name)}
                  onAdd={addExercise}
                  onCustomAdd={addCustomExercise}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}