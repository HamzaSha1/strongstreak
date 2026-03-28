import { useState, useEffect } from 'react';
import { SkipForward, ChevronDown, ChevronUp } from 'lucide-react';

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimer({ seconds, total, onDone, onSkip, isMinimized, onToggleMinimize }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onDone(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const progress = remaining / total;
  const dashoffset = CIRCUMFERENCE * (1 - progress);

  if (isMinimized) {
    return (
      <button
        onClick={() => onToggleMinimize?.()}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow font-heading font-bold text-xl"
      >
        {remaining}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 bg-card border border-border rounded-3xl p-8 mx-6">
        <div className="flex items-center justify-between w-full">
          <p className="text-muted-foreground text-sm font-medium">Rest Time</p>
          <button
            onClick={() => onToggleMinimize?.()}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <ChevronDown size={18} />
          </button>
        </div>
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="50" cy="50" r={RADIUS}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-heading font-bold text-primary">{remaining}</span>
          </div>
        </div>
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <SkipForward size={15} /> Skip
        </button>
      </div>
    </div>
  );
}