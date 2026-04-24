import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StreakCelebration({ newStreak, onDone }) {
  const [displayStreak, setDisplayStreak] = useState(newStreak - 1);
  const [showNumber, setShowNumber] = useState(false);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    // Show fire first, then count up
    const t1 = setTimeout(() => setShowNumber(true), 600);
    const t2 = setTimeout(() => {
      setCounting(true);
      setDisplayStreak(newStreak);
    }, 1200);
    const t3 = setTimeout(() => onDone(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background">
      {/* Background glow — radial gradient, no blur filter */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 45%, hsl(35 96% 58% / 0.18) 0%, transparent 65%)' }}
      />

      {/* Fire emoji — big and bouncy, no filter on the animated element */}
      <motion.div
        initial={{ scale: 0, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.1 }}
        className="text-[120px] leading-none mb-4 select-none"
        style={{ willChange: 'transform' }}
      >
        🔥
      </motion.div>

      {/* Streak number */}
      <AnimatePresence mode="wait">
        {showNumber && (
          <motion.div
            key="streak"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
            className="text-center"
            style={{ willChange: 'transform, opacity' }}
          >
            <motion.p
              key={displayStreak}
              initial={{ scale: counting ? 1.4 : 1, color: counting ? 'hsl(35 96% 70%)' : 'hsl(35 96% 58%)' }}
              animate={{ scale: 1, color: 'hsl(35 96% 58%)' }}
              transition={{ duration: 0.4 }}
              className="font-heading font-bold text-8xl text-primary streak-pulse"
            >
              {displayStreak}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-heading font-semibold text-xl text-foreground mt-2"
            >
              {counting ? 'Day Streak! 🔥' : 'Day Streak'}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground text-sm mt-1"
            >
              {counting ? 'Keep it up!' : ''}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}