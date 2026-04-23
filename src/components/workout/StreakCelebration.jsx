import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Lightweight celebration: a single fire emoji pop-in, then a single number
// scale-bump when the streak counts up. Previously used multiple nested
// motion trees with key-based remounts + continuous drop-shadow pulses which
// was dropping frames on iOS. This version uses only two motion elements
// and simple transform/opacity transitions.
export default function StreakCelebration({ newStreak, onDone }) {
  const start = Math.max(0, newStreak - 1);
  const [displayStreak, setDisplayStreak] = useState(start);
  const [bumped, setBumped] = useState(false);

  useEffect(() => {
    // Count up after the fire has settled
    const t1 = setTimeout(() => {
      setDisplayStreak(newStreak);
      setBumped(true);
    }, 900);
    // Auto-close
    const t2 = setTimeout(() => onDone(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background">
      {/* Soft glow backdrop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      </div>

      {/* Fire — single scale-in, no continuous filter animation */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="text-[120px] leading-none mb-4 select-none"
      >
        🔥
      </motion.div>

      {/* Streak number — fade in, then bump when count updates */}
      <motion.p
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: bumped ? 1.15 : 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="font-heading font-bold text-8xl text-primary"
      >
        {displayStreak}
      </motion.p>
      <p className="font-heading font-semibold text-xl text-foreground mt-2">
        Day Streak{bumped ? '! 🔥' : ''}
      </p>
    </div>
  );
}
