import { useState, useEffect } from 'react';
import { SkipForward, ChevronDown, ChevronUp, Edit2, Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import SnakeGame from './SnakeGame';
import { motion, AnimatePresence } from 'framer-motion';

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimer({ seconds, total, onDone, onSkip, isMinimized, onToggleMinimize, gameState, onGameStateChange, notification }) {
  const [remaining, setRemaining] = useState(seconds);
  const [showGame, setShowGame] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(seconds);
  const [showNotification, setShowNotification] = useState(!!notification);

  useEffect(() => {
    if (!notification) return;
    setShowNotification(true);
    const t = setTimeout(() => setShowNotification(false), 5000);
    return () => clearTimeout(t);
  }, [notification]);

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

  if (showGame) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <div className="flex flex-col items-center gap-4 bg-card border border-border rounded-3xl p-6 w-full max-w-sm">
          <div className="flex items-center justify-between w-full">
            <p className="text-muted-foreground text-sm font-medium">Play Snake</p>
            <button onClick={() => setShowGame(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <ChevronUp size={18} />
            </button>
          </div>
          <p className="text-lg font-heading font-bold text-primary">{remaining}s remaining</p>
          <SnakeGame isActive={true} onGameEnd={() => {}} gameState={gameState} onGameStateChange={onGameStateChange} />
        </div>
      </div>
    );
  }

  const isPR = notification?.type === 'pr';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 bg-card border border-border rounded-3xl p-8 mx-6 w-full max-w-sm">
        <div className="flex items-center justify-between w-full">
          <p className="text-muted-foreground text-sm font-medium">Rest Time</p>
          <button onClick={() => onToggleMinimize?.()} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ChevronDown size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {showNotification && notification ? (
            <motion.div
              key="notification"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              onClick={() => setShowNotification(false)}
              className={cn(
                'w-full rounded-2xl px-5 py-4 flex flex-col items-center gap-2 border cursor-pointer',
                isPR
                  ? 'bg-gradient-to-r from-yellow-500/20 via-primary/20 to-yellow-500/20 border-yellow-500/50 shadow-[0_0_30px_hsl(35_96%_58%/0.5)]'
                  : notification.color
              )}
            >
              {isPR ? (
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
                  <Star size={20} className="text-yellow-400 fill-yellow-400" />
                </div>
              ) : (
                <span className="text-3xl">{notification.emoji}</span>
              )}
              <p className={cn('font-heading font-bold text-base', isPR ? 'text-yellow-300' : '')}>
                {isPR ? '🏆 New Personal Record!' : notification.title}
              </p>
              <p className={cn('text-xs opacity-90 text-center leading-relaxed', isPR ? 'text-yellow-200/80' : '')}>
                {notification.message}
              </p>
              <p className="text-[10px] opacity-50 mt-1">Tap to dismiss · timer running</p>
            </motion.div>
          ) : isEditing ? (
            <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(Math.max(0, parseInt(e.target.value) || 0))}
                autoFocus
                className="w-20 text-center text-2xl font-heading font-bold bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
              />
              <span className="text-lg text-muted-foreground">s</span>
              <button onClick={() => { setRemaining(editValue); setIsEditing(false); }} className="text-primary hover:text-primary/80 transition-colors p-1">
                <Check size={20} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="timer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-32 h-32 cursor-pointer transition-transform active:scale-95"
              onClick={() => setShowGame(true)}
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {!showNotification && !isEditing && (
          <p className="text-xs text-muted-foreground text-center">Tap to play Snake while waiting</p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setIsEditing(true); setEditValue(remaining); }}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            <Edit2 size={15} /> Edit
          </button>
          <button onClick={onSkip} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
            <SkipForward size={15} /> Skip
          </button>
        </div>
      </div>
    </div>
  );
}