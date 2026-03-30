import { useEffect, useState } from 'react';
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
    // Below range
    return {
      type: 'low',
      emoji: '⚖️',
      title: 'Lower the weight',
      message: `You hit ${r} reps — target is ${range.min}–${range.max}. Drop the weight a little to stay in range.`,
      color: 'border-destructive/50 bg-destructive/10 text-destructive',
    };
  }

  if (r >= range.min && r < range.max) {
    // In range (not top)
    return {
      type: 'good',
      emoji: '💪',
      title: 'Perfect!',
      message: `${r} reps — right in your target range. Keep it up!`,
      color: 'border-primary/50 bg-primary/10 text-primary',
    };
  }

  if (r === range.max) {
    // Hit the top of the range
    if (setNumber === 1 && totalSets > 1) {
      return {
        type: 'top',
        emoji: '🔥',
        title: 'Top of range!',
        message: `${r} reps on set 1! Try to hit ${range.max} again on all sets — if you can, increase the weight next session.`,
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
    // Above range
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

export default function RepFeedback({ feedback, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (feedback) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  if (!feedback) return null;

  return (
    <div
      className={cn(
        'fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[480px] z-50',
        'border rounded-2xl px-4 py-3 shadow-lg flex items-start gap-3',
        'transition-all duration-300',
        feedback.color,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
    >
      <span className="text-2xl flex-shrink-0">{feedback.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-sm">{feedback.title}</p>
        <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{feedback.message}</p>
      </div>
    </div>
  );
}