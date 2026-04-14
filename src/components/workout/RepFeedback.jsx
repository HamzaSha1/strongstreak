import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * parseRepRange("8-12")  → { min: 8, max: 12 }
 * parseRepRange("10")    → { min: 10, max: 10 }
 * parseRepRange("AMRAP") → null (skip feedback)
 */
export function parseRepRange(target) {
  if (!target) return null;
  const str = String(target).trim().toUpperCase();
  if (str === 'AMRAP' || str === 'FAILURE') return null;
  const match = str.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
  const single = str.match(/^(\d+)$/);
  if (single) { const n = parseInt(single[1]); return { min: n, max: n }; }
  return null;
}

/**
 * Returns feedback config based on reps vs range.
 * setNumber: 1-based index of the set just completed
 * completedSetsCount: how many sets done so far (including this one)
 * totalSets: total sets planned
 */
export function getRepFeedback(reps, range, setNumber, totalSets) {
  if (!range || !reps) return null;
  const r = Number(reps);
  if (isNaN(r) || r === 0) return null;

  if (r < range.min) {
    return {
      type: 'low',
      emoji: '⚖️',
      title: 'Below range',
      message: `You hit ${r} reps — target is ${range.min}–${range.max}. Drop the weight a little.`,
      color: 'border-destructive/50 bg-destructive/10 text-destructive',
    };
  }

  if (r >= range.min && r < range.max) {
    return {
      type: 'good',
      emoji: '💪',
      title: 'Perfect!',
      message: `${r} reps — right in your target range. Keep it up!`,
      color: 'border-primary/50 bg-primary/10 text-primary',
    };
  }

  if (r === range.max) {
    if (setNumber === 1 && totalSets > 1) {
      return {
        type: 'top',
        emoji: '🔥',
        title: 'Top of range!',
        message: `${r} reps on set 1! Try to hit ${range.max} on all sets — if you can, go heavier next session.`,
        color: 'border-primary/50 bg-primary/10 text-primary',
      };
    }
    return {
      type: 'top',
      emoji: '🔥',
      title: 'Top of range!',
      message: `${r} reps — you're maxing the range. Consider going heavier next time!`,
      color: 'border-primary/50 bg-primary/10 text-primary',
    };
  }

  if (r > range.max) {
    return {
      type: 'above',
      emoji: '🚀',
      title: 'Crush it! Increase weight',
      message: `${r} reps smashes the top of ${range.max}. Go heavier next session!`,
      color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500',
    };
  }

  return null;
}

/**
 * Analyse all completed sets for an exercise and return a weight suggestion.
 * Returns null | { direction: 'increase' | 'decrease', message: string }
 */
export function getWeightSuggestion(exName, targetReps, exSets) {
  const range = parseRepRange(targetReps);
  if (!range) return null;

  const completed = exSets.filter((s) => s.completed && s.reps !== '' && s.reps != null);
  if (!completed.length) return null;

  const repsArr = completed.map((s) => Number(s.reps));
  const avgReps = repsArr.reduce((a, b) => a + b, 0) / repsArr.length;

  // RIR: use average of sets that have an RIR value
  const rirArr = completed.map((s) => s.rpe !== '' && s.rpe != null ? Number(s.rpe) : null).filter((v) => v !== null);
  const avgRir = rirArr.length ? rirArr.reduce((a, b) => a + b, 0) / rirArr.length : null;

  const hitTop = avgReps >= range.max;
  const lowRir = avgRir !== null && avgRir <= 2; // very low RIR = close to failure
  const failedRange = avgReps < range.min;

  if (failedRange) {
    return {
      direction: 'decrease',
      exName,
      message: `Avg ${Math.round(avgReps)} reps (target ${range.min}–${range.max}) — consider dropping weight slightly.`,
    };
  }

  if (hitTop && lowRir) {
    return {
      direction: 'increase',
      exName,
      message: `Avg ${Math.round(avgReps)} reps at top of range with low RIR — ready to increase weight!`,
    };
  }

  if (hitTop && avgRir === null) {
    // No RIR data — suggest increase only if clearly above range
    if (avgReps > range.max) {
      return {
        direction: 'increase',
        exName,
        message: `Avg ${Math.round(avgReps)} reps exceeds range (${range.min}–${range.max}) — try going heavier.`,
      };
    }
  }

  return null;
}

// ─── Per-set toast (fires during workout) ────────────────────────────────────
export default function RepFeedback({ feedback, onDismiss }) {
  // Keep a local copy so we can fade out before unmounting
  const [displayed, setDisplayed] = useState(null);
  const [visible, setVisible] = useState(false);
  const dismissTimer = useRef(null);

  useEffect(() => {
    if (!feedback) return;
    // Cancel any pending dismiss
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setDisplayed(feedback);
    setVisible(true);

    dismissTimer.current = setTimeout(() => {
      setVisible(false);
      // Wait for CSS transition, then clear
      setTimeout(() => {
        setDisplayed(null);
        onDismiss();
      }, 350);
    }, 3800);

    return () => clearTimeout(dismissTimer.current);
  }, [feedback]);

  if (!displayed) return null;

  return (
    <div
      className={cn(
        'fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[480px] z-50',
        'border rounded-2xl px-4 py-3 shadow-lg flex items-start gap-3 cursor-pointer',
        'transition-all duration-300',
        displayed.color,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      onClick={() => {
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        setVisible(false);
        setTimeout(() => { setDisplayed(null); onDismiss(); }, 350);
      }}
    >
      <span className="text-2xl flex-shrink-0">{displayed.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-sm">{displayed.title}</p>
        <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{displayed.message}</p>
      </div>
    </div>
  );
}