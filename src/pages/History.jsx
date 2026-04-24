import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { ChevronDown, ChevronUp, Clock, Dumbbell } from 'lucide-react';
import { format, formatDistanceStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function History() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(null);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollContainerRef = useRef(null);
  const startYRef = useRef(0);
  const queryClient = useQueryClient();

  const handleTouchStart = (e) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (scrollContainerRef.current?.scrollTop === 0 && startYRef.current) {
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0) {
        setPullProgress(Math.min(diff / 80, 1));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullProgress >= 1 && !isRefreshing) {
      setIsRefreshing(true);
      await queryClient.refetchQueries({ queryKey: ['workoutLogs'] });
      setIsRefreshing(false);
    }
    setPullProgress(0);
    startYRef.current = 0;
  };

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['workoutLogs', user?.email],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: user?.email }, '-created_date', 50),
    enabled: !!user,
    throwOnError: false,
    meta: { onError: () => toast.error('Could not load workout history.') },
  });

  const { data: setLogs = [] } = useQuery({
    queryKey: ['setLogs', user?.email],
    queryFn: () => base44.entities.SetLog.filter({ user_id: user?.email }, '-created_date', 500),
    enabled: !!user,
    throwOnError: false,
  });

  const getSetsForLog = (logId) => setLogs.filter((s) => s.workout_log_id === logId);

  const getDuration = (log) => {
    if (log.started_at && log.finished_at) {
      return formatDistanceStrict(new Date(log.finished_at), new Date(log.started_at));
    }
    if (log.duration_minutes) return `${log.duration_minutes}m`;
    return '—';
  };

  return (
    <div
      ref={scrollContainerRef}
      className="pb-4 h-screen overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullProgress > 0 && (
        <div className="flex justify-center pt-4 px-4">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary transition-transform"
              style={{ transform: `rotate(${pullProgress * 360}deg)` }}
            />
            <div className="text-xs text-primary font-bold">{Math.round(pullProgress * 100)}%</div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 pb-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <h1 className="text-xl font-heading font-bold">History</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 gap-3">
          <p className="text-4xl">📋</p>
          <p className="text-muted-foreground text-center text-sm">
            No workouts logged yet. Start your first session!
          </p>
        </div>
      ) : (
        <div className="px-4 pt-4 flex flex-col gap-3">
          {logs.map((log) => {
            const sets = getSetsForLog(log.id);
            const isOpen = expanded === log.id;
            const exercises = [...new Set(sets.map((s) => s.exercise_name))];

            return (
              <div
                key={log.id}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <button
                  className="w-full text-left px-4 py-4"
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-heading font-semibold text-base">
                        {log.is_rest_day ? '😴 Rest Day' : log.split_day_name || 'Workout'}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {log.created_date && !isNaN(new Date(log.created_date))
                          ? format(new Date(log.created_date), 'EEE, MMM d · h:mm a')
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock size={12} />
                        {getDuration(log)}
                      </div>
                      {!log.is_rest_day && (
                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Dumbbell size={12} />
                          {exercises.length}
                        </div>
                      )}
                      {isOpen ? (
                        <ChevronUp size={16} className="text-muted-foreground" />
                      ) : (
                        <ChevronDown size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && !log.is_rest_day && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    {exercises.map((exName) => {
                      const exSets = sets.filter((s) => s.exercise_name === exName);
                      return (
                        <div key={exName} className="mb-3 last:mb-0">
                          <p className="text-sm font-medium mb-1">{exName}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {exSets.map((s, i) => (
                              <span
                                key={i}
                                className="text-xs bg-muted text-muted-foreground rounded-lg px-2 py-1"
                              >
                                {s.reps} × {s.weight_kg}kg
                                {s.rpe ? ` @${s.rpe}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}