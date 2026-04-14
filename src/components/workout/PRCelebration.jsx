import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

export default function PRCelebration({ pr, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!pr) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 3500);
    return () => clearTimeout(t);
  }, [pr]);

  return (
    <AnimatePresence>
      {visible && pr && (
        <motion.div
          key="pr"
          initial={{ opacity: 0, y: -60, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 340, damping: 22 }}
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          className="fixed top-[calc(env(safe-area-inset-top)+56px)] left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-[400px]"
        >
          <div className="relative bg-gradient-to-r from-yellow-500/20 via-primary/20 to-yellow-500/20 border border-yellow-500/50 rounded-2xl px-4 py-3.5 shadow-[0_0_30px_hsl(35_96%_58%/0.5)] flex items-center gap-3 overflow-hidden">
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 0.9, delay: 0.2, ease: 'easeInOut' }}
            />
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center shrink-0">
              <Star size={20} className="text-yellow-400 fill-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-yellow-300">🏆 New Personal Record!</p>
              <p className="text-xs text-yellow-200/80 mt-0.5 leading-snug">{pr.message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}