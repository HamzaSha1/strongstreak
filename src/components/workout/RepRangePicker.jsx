import { useState } from 'react';
import { cn } from '@/lib/utils';

const REPS_OPTIONS = ['4', '5', '6', '8', '10', '12', '15', '20', 'AMRAP'];
const TIME_OPTIONS = ['20s', '30s', '45s', '60s', '90s', '2min', '3min'];

export default function RepRangePicker({ exId, repMode, targetReps, onRepRangeChange, onRepModeChange }) {
  // rangeStart tracks the first tap while awaiting a second tap
  const [rangeStart, setRangeStart] = useState(null);

  const isTime = repMode === 'time';
  const options = isTime ? TIME_OPTIONS : REPS_OPTIONS;

  // Parse current range
  const parts = (targetReps || '').split('-');
  const currentFrom = parts[0] || null;
  const currentTo = parts[1] || null;

  const isNumeric = (v) => !isNaN(parseInt(v));

  const handleSelect = (value) => {
    if (isTime) {
      // Time presets are single values
      onRepRangeChange(exId, value);
      setRangeStart(null);
      return;
    }

    if (value === 'AMRAP') {
      onRepRangeChange(exId, 'AMRAP');
      setRangeStart(null);
      return;
    }

    if (rangeStart === null) {
      // First tap — set as start and wait for second
      setRangeStart(value);
    } else if (rangeStart === value) {
      // Tapped same — treat as single value
      onRepRangeChange(exId, value);
      setRangeStart(null);
    } else {
      // Second tap — build range (low-high order)
      const a = parseInt(rangeStart);
      const b = parseInt(value);
      const from = Math.min(a, b);
      const to = Math.max(a, b);
      onRepRangeChange(exId, `${from}-${to}`);
      setRangeStart(null);
    }
  };

  const isInRange = (value) => {
    if (!isNumeric(value)) return false;
    const v = parseInt(value);
    if (rangeStart !== null) {
      // Hover/preview highlight between rangeStart and value
      const a = parseInt(rangeStart);
      return v >= Math.min(a, v) && v <= Math.max(a, v);
    }
    if (currentFrom && currentTo && isNumeric(currentFrom) && isNumeric(currentTo)) {
      const f = parseInt(currentFrom);
      const t = parseInt(currentTo);
      return v >= f && v <= t;
    }
    return false;
  };

  const isEndpoint = (value) => {
    if (rangeStart !== null) return value === rangeStart;
    return value === currentFrom || value === targetReps;
  };

  const isCurrentTo = (value) => {
    if (rangeStart === null && currentTo) return value === currentTo;
    return false;
  };

  return (
    <div className="mb-3">
      {/* Mode toggle */}
      <div className="flex gap-1.5 mb-2">
        <button
          onClick={() => { onRepModeChange(exId, 'reps'); setRangeStart(null); }}
          className={cn(
            'flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-colors',
            (!repMode || repMode === 'reps') ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
          )}
        >
          Reps
        </button>
        <button
          onClick={() => { onRepModeChange(exId, 'time'); setRangeStart(null); }}
          className={cn(
            'flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-colors',
            repMode === 'time' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
          )}
        >
          Time
        </button>
      </div>

      {/* Instruction hint */}
      {!isTime && (
        <p className="text-[10px] text-muted-foreground mb-1.5">
          {rangeStart
            ? `Start: ${rangeStart} — now tap an end value`
            : 'Tap one number for a single rep target, or tap two to make a range'}
        </p>
      )}

      {/* Option buttons */}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const endpoint = isEndpoint(opt);
          const inRange = !endpoint && isInRange(opt);
          const isTo = isCurrentTo(opt);

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={cn(
                'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                endpoint || isTo
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_8px_hsl(35_96%_58%/0.5)]'
                  : inRange
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Current selection display */}
      {targetReps && !rangeStart && (
        <p className="text-xs text-primary font-semibold mt-1.5">Selected: {targetReps}</p>
      )}
    </div>
  );
}