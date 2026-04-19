import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = [
  { label: 'Inhale', duration: 4, color: 'hsl(var(--primary))' },
  { label: 'Hold', duration: 4, color: 'hsl(45 93% 58%)' },
  { label: 'Exhale', duration: 4, color: 'hsl(199 92% 60%)' },
  { label: 'Hold', duration: 4, color: 'hsl(45 93% 58%)' },
];

export default function BoxBreathingExercise({ isActive }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef(null);

  const phase = PHASES[phaseIdx];
  const progress = tick / phase.duration;

  useEffect(() => {
    if (!isActive) return;
    intervalRef.current = setInterval(() => {
      setTick((t) => {
        if (t + 1 >= phase.duration) {
          setPhaseIdx((p) => (p + 1) % PHASES.length);
          return 0;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isActive, phase.duration, phaseIdx]);

  // Reset tick when phase changes
  useEffect(() => { setTick(0); }, [phaseIdx]);

  const size = 140;
  const cx = size / 2;
  const circumference = 2 * Math.PI * 48;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Box Breathing</p>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cx} r={48} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle
            cx={cx} cy={cx} r={48}
            fill="none"
            stroke={phase.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={phaseIdx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.25 }}
              className="font-heading font-bold text-base"
              style={{ color: phase.color }}
            >
              {phase.label}
            </motion.p>
          </AnimatePresence>
          <p className="text-2xl font-heading font-bold text-foreground">{phase.duration - tick}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {PHASES.map((p, i) => (
          <div
            key={i}
            className="h-1.5 w-8 rounded-full transition-all"
            style={{ background: i === phaseIdx ? phase.color : 'hsl(var(--muted))' }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-[200px] leading-relaxed">
        4 seconds each phase · breathe deeply and slowly
      </p>
    </div>
  );
}