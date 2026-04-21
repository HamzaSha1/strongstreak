import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const RIR_VALUES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0.5, 0];

/**
 * Full-screen overlay RIR picker.
 * User swipes/scrolls horizontally between 0–10, then confirms or skips.
 */
export default function RIRPicker({ initialValue, onConfirm, onSkip }) {
  const [selected, setSelected] = useState(initialValue != null && initialValue !== '' ? Number(initialValue) : null);
  const scrollRef = useRef(null);

  // Scroll to the initially selected value (or middle) on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = selected != null ? RIR_VALUES.indexOf(selected) : 5;
    const itemWidth = 72; // w-16 (64) + gap-2 (8)
    const containerWidth = el.offsetWidth;
    el.scrollLeft = idx * itemWidth - containerWidth / 2 + itemWidth / 2;
  }, []);

  const handleItemClick = (val) => {
    setSelected(val);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="bg-card border border-border rounded-3xl w-full max-w-sm p-6 flex flex-col gap-5">
        {/* Title */}
        <div className="text-center">
          <p className="font-heading font-bold text-lg">Effort Level (RIR)</p>
          <p className="text-xs text-muted-foreground mt-0.5">Swipe left → harder effort · 10 = Very Easy · 0 = Failure</p>
        </div>

        {/* Horizontal scroll picker */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto py-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {RIR_VALUES.map((val) => (
            <button
              key={val}
              onClick={() => handleItemClick(val)}
              className={cn(
                'w-16 h-16 rounded-2xl border-2 flex-shrink-0 flex flex-col items-center justify-center transition-all font-heading font-bold text-xl',
                selected === val
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_16px_hsl(35_96%_58%/0.5)] scale-105'
                  : 'border-border text-muted-foreground bg-muted/30 hover:border-primary/50'
              )}
            >
              {val}
              {val === 0 && <span className="text-[9px] font-normal leading-none mt-0.5 opacity-70">fail</span>}
              {val === 0.5 && <span className="text-[9px] font-normal leading-none mt-0.5 opacity-70">hard</span>}
              {val === 10 && <span className="text-[9px] font-normal leading-none mt-0.5 opacity-70">easy</span>}
            </button>
          ))}
        </div>

        {/* Selected label */}
        <div className="text-center text-sm text-muted-foreground min-h-[20px]">
          {selected != null
            ? selected === 0
              ? 'Failure — 0 reps in reserve 💪'
              : selected <= 2
              ? `${selected} RIR — very hard`
              : selected <= 5
              ? `${selected} RIR — moderate effort`
              : selected <= 8
              ? `${selected} RIR — still plenty left`
              : 'Very Easy — 10+ reps in reserve'
            : 'Select your RIR (0 = Max Effort, 10 = Very Easy)'}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 h-12 rounded-2xl border border-border text-muted-foreground text-sm font-semibold flex items-center justify-center gap-1.5 hover:border-primary/50 transition-colors"
          >
            <X size={15} /> Skip
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={selected == null}
            className={cn(
              'flex-2 h-12 px-8 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all',
              selected != null
                ? 'bg-primary text-primary-foreground shadow-[0_0_12px_hsl(35_96%_58%/0.4)]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <Check size={16} /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}