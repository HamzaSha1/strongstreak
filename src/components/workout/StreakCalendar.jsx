import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Flame } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isFuture, subMonths, addMonths } from 'date-fns';

export default function StreakCalendar({ workoutLogs, streak, onClose }) {
  const [viewDate, setViewDate] = useState(new Date());

  // Build a Set of date strings for worked-out days (non-rest, finished)
  const workedOutDays = useMemo(() => {
    const s = new Set();
    workoutLogs
      .filter((l) => !l.is_rest_day && l.started_at)
      .forEach((l) => s.add(format(new Date(l.started_at), 'yyyy-MM-dd')));
    return s;
  }, [workoutLogs]);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad to align with Mon (0) as first col
  // getDay returns 0=Sun..6=Sat; we want Mon=0..Sun=6
  const startPad = (getDay(monthStart) + 6) % 7;

  const prev = () => setViewDate((d) => subMonths(d, 1));
  const next = () => setViewDate((d) => addMonths(d, 1));
  const canGoNext = !isSameDay(startOfMonth(viewDate), startOfMonth(new Date())) &&
    startOfMonth(addMonths(viewDate, 1)) <= startOfMonth(new Date());

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-end bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full bg-card border-t border-border rounded-t-3xl px-5 pt-5 pb-10"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={20} className="text-primary flame-glow" />
              <span className="font-heading font-bold text-base">{streak} Day Streak</span>
            </div>
            <button onClick={onClose} className="text-muted-foreground p-1">
              <X size={18} />
            </button>
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prev} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
              <ChevronLeft size={18} />
            </button>
            <span className="font-heading font-semibold text-sm">{format(viewDate, 'MMMM yyyy')}</span>
            <button
              onClick={next}
              disabled={!canGoNext}
              className={cn('p-1.5 rounded-lg transition-colors', canGoNext ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30')}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 mb-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] text-muted-foreground font-semibold py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {/* Leading empty cells */}
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const worked = workedOutDays.has(key);
              const isToday = isSameDay(day, new Date());
              const future = isFuture(day) && !isToday;
              return (
                <div key={key} className="flex items-center justify-center py-0.5">
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center relative text-sm font-medium transition-colors',
                    isToday && !worked && 'ring-2 ring-primary/40',
                    worked ? 'bg-primary/20 text-primary font-bold' : future ? 'text-muted-foreground/30' : 'text-muted-foreground'
                  )}>
                    {format(day, 'd')}
                    {worked && (
                      <span className="absolute -top-0.5 -right-0.5 text-[10px]">✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 justify-center">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center relative">
              <span className="text-[8px] font-bold text-primary">1</span>
              <span className="absolute -top-0.5 -right-0.5 text-[8px]">✓</span>
            </div>
            <span className="text-xs text-muted-foreground">= Workout completed</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}