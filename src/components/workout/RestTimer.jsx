import { useState, useEffect, useRef } from 'react';
import { SkipForward, ChevronDown, ChevronUp, Edit2, Check, Star, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import SnakeGame from './SnakeGame';
import FlappyBirdGame from './FlappyBirdGame';
import BoxBreathingExercise from './BoxBreathingExercise';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestGame } from '@/hooks/useRestGame';
import { playBell } from '@/lib/bellSound';
import { scheduleNotification, cancelNotification, requestNotificationPermission } from '@/lib/notifications';

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const REST_TAG = 'rest-timer';

export default function RestTimer({ seconds, total, onDone, onSkip, isMinimized, onToggleMinimize, gameState, onGameStateChange, notification }) {
  const [remaining, setRemaining] = useState(seconds);
  const [showGame, setShowGame] = useState(false);
  const [showGamePicker, setShowGamePicker] = useState(false);
  const { get: getRestGame, set: setRestGame } = useRestGame();
  const [preferredGame, setPreferredGame] = useState(() => getRestGame());
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(seconds);
  const [showNotification, setShowNotification] = useState(!!notification);

  // Schedule a background notification for when rest ends
  const scheduleRestNotification = (delayMs) => {
    scheduleNotification({
      tag: REST_TAG,
      title: '💪 Rest Complete!',
      body: 'Time to crush your next set!',
      delayMs: Math.max(500, delayMs),
    });
  };

  // On mount: request permission and schedule SW background notification
  useEffect(() => {
    requestNotificationPermission().then((granted) => {
      if (granted) scheduleRestNotification(seconds * 1000);
    });
    // On unmount (skip, done, close): cancel scheduled notification
    return () => cancelNotification(REST_TAG);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notification) return;
    setShowNotification(true);
    const t = setTimeout(() => setShowNotification(false), 5000);
    return () => clearTimeout(t);
  }, [notification]);

  const endTimeRef = useRef(Date.now() + seconds * 1000);

  const adjustTime = (delta) => {
    const newEnd = endTimeRef.current + delta * 1000;
    const minEnd = Date.now() + 1000;
    endTimeRef.current = Math.max(newEnd, minEnd);
    const newRemaining = Math.max(1, Math.round((endTimeRef.current - Date.now()) / 1000));
    setRemaining(newRemaining);
    // Reschedule SW notification with updated time
    scheduleRestNotification(endTimeRef.current - Date.now());
  };

  useEffect(() => {
    endTimeRef.current = Date.now() + remaining * 1000;
    const interval = setInterval(() => {
      const left = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(interval);
        setRemaining(0);
        // Cancel the SW notification (timer ended in-app, no need for push)
        cancelNotification(REST_TAG);
        // Play bell sound + vibrate for in-app experience
        playBell();
        try { navigator.vibrate?.([200, 80, 200, 80, 200]); } catch (_) {}
        onDone();
      } else {
        setRemaining(left);
      }
    }, 500); // tick every 500ms so display is always accurate to within half a second
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only runs once on mount

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

  const GAMES = [
    { id: 'snake',     label: 'Snake' },
    { id: 'flappy',    label: 'Flappy Bird' },
    { id: 'breathing', label: 'Box Breathing' },
  ];

  const handleSelectGame = (id) => {
    setRestGame(id);
    setPreferredGame(id);
    setShowGamePicker(false);
  };

  if (showGame) {
    const gameLabel = GAMES.find((g) => g.id === preferredGame)?.label ?? 'Snake';
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <div className="flex flex-col items-center gap-4 bg-card border border-border rounded-3xl p-6 w-full max-w-sm">
          <div className="flex items-center justify-between w-full">
            <p className="text-muted-foreground text-sm font-medium">{gameLabel}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGamePicker((v) => !v)}
                className="flex items-center gap-1 text-xs text-primary font-semibold px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                title="Change game"
              >
                <Shuffle size={13} /> Change
              </button>
              <button onClick={() => setShowGame(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <ChevronUp size={18} />
              </button>
            </div>
          </div>

          {showGamePicker && (
            <div className="w-full flex flex-col gap-2">
              {GAMES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSelectGame(g.id)}
                  className={cn(
                    'w-full py-2.5 rounded-2xl text-sm font-semibold border transition-colors',
                    preferredGame === g.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}

          <p className="text-lg font-heading font-bold text-primary">{remaining}s remaining</p>
          {preferredGame === 'flappy'
            ? <FlappyBirdGame isActive={true} />
            : preferredGame === 'breathing'
            ? <BoxBreathingExercise isActive={true} />
            : <SnakeGame isActive={true} onGameEnd={() => {}} gameState={gameState} onGameStateChange={onGameStateChange} />
          }
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
                  ? 'bg-card border-yellow-500/50 shadow-[0_0_12px_hsl(45_93%_47%/0.4)]'
                  : notification.color
              )}
            >
              {isPR ? (
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/50 flex items-center justify-center">
                  <Star size={20} className="text-yellow-500 fill-yellow-500" />
                </div>
              ) : (
                <span className="text-3xl">{notification.emoji}</span>
              )}
              <p className={cn('font-heading font-bold text-base', isPR ? 'text-yellow-400' : '')}>
                {isPR ? '🏆 New Personal Record!' : notification.title}
              </p>
              <p className={cn('text-xs text-center leading-relaxed', isPR ? 'text-muted-foreground' : 'opacity-90')}>
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
              <button
                onClick={() => {
                  endTimeRef.current = Date.now() + editValue * 1000;
                  setRemaining(editValue);
                  setIsEditing(false);
                  // Reschedule SW notification for the new time
                  scheduleRestNotification(editValue * 1000);
                }}
                className="text-primary hover:text-primary/80 transition-colors p-1"
              >
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
          <p className="text-xs text-muted-foreground text-center">
            Tap to {preferredGame === 'breathing' ? 'do box breathing' : preferredGame === 'flappy' ? 'play Flappy Bird' : 'play Snake'} while waiting
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustTime(-10)}
            className="px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/80 transition-colors"
          >
            −10s
          </button>
          <button
            onClick={() => adjustTime(10)}
            className="px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/80 transition-colors"
          >
            +10s
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={() => { setIsEditing(true); setEditValue(remaining); }}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            <Edit2 size={15} /> Edit
          </button>
          <button
            onClick={() => { cancelNotification(REST_TAG); onSkip(); }}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            <SkipForward size={15} /> Skip
          </button>
        </div>
      </div>
    </div>
  );
}
