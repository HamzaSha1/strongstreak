import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Check, Flag, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import RestTimer from '@/components/workout/RestTimer';
import PostWorkoutModal from '@/components/workout/PostWorkoutModal';

const SET_TYPES = ['normal', 'dropset', 'superset'];

export default function ActiveWorkout() {
  const { dayId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [workoutLog, setWorkoutLog] = useState(null);
  const [sets, setSets] = useState({});
  const [expanded, setExpanded] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState(null); // { seconds, total }
  const [showPostModal, setShowPostModal] = useState(false);
  const startTime = useRef(new Date());
  const timerRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const { data: day } = useQuery({
    queryKey: ['splitDay', dayId],
    queryFn: () => base44.entities.SplitDay.filter({ id: dayId }),
    select: (d) => d[0],
    enabled: !!dayId,
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['splitExercises', dayId],
    queryFn: () => base44.entities.SplitExercise.filter({ split_day_id: dayId }, 'order_index'),
    enabled: !!dayId,
  });

  const { data: prevLogs = [] } = useQuery({
    queryKey: ['prevSetLogs', user?.email],
    queryFn: () => base44.entities.SetLog.filter({ user_id: user?.email }, '-created_date', 200),
    enabled: !!user,
  });

  // Initialize sets
  useEffect(() => {
    if (exercises.length && !Object.keys(sets).length) {
      const initial = {};
      const exp = {};
      exercises.forEach((ex) => {
        exp[ex.id] = true;
        initial[ex.id] = Array.from({ length: ex.target_sets || 3 }, (_, i) => ({
          set_number: i + 1,
          reps: '',
          weight_kg: '',
          rpe: 7,
          set_type: 'normal',
          completed: false,
        }));
      });
      setSets(initial);
      setExpanded(exp);
    }
  }, [exercises]);

  const startWorkout = async () => {
    if (!workoutLog && user && day) {
      const log = await base44.entities.WorkoutLog.create({
        user_id: user.email,
        split_day_id: dayId,
        split_day_name: `${day.day_of_week} — ${day.session_type}`,
        started_at: startTime.current.toISOString(),
        is_rest_day: false,
      });
      setWorkoutLog(log);
    }
  };

  useEffect(() => {
    if (user && day) startWorkout();
  }, [user, day]);

  const getPrevSets = (exName) => {
    const prev = prevLogs.filter((s) => s.exercise_name === exName && s.completed);
    if (!prev.length) return [];
    const lastLogId = prev[0].workout_log_id;
    return prev.filter((s) => s.workout_log_id === lastLogId).sort((a, b) => a.set_number - b.set_number);
  };

  const updateSet = (exId, setIdx, patch) => {
    setSets((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => (i === setIdx ? { ...s, ...patch } : s)),
    }));
  };

  const completeSet = async (ex, setIdx) => {
    const set = sets[ex.id][setIdx];
    updateSet(ex.id, setIdx, { completed: true });

    if (workoutLog) {
      await base44.entities.SetLog.create({
        workout_log_id: workoutLog.id,
        user_id: user.email,
        exercise_name: ex.name,
        exercise_order: ex.order_index,
        set_number: set.set_number,
        reps: Number(set.reps),
        weight_kg: Number(set.weight_kg),
        rpe: set.rpe,
        set_type: set.set_type,
        completed: true,
      });
    }

    if (set.set_type !== 'dropset' && ex.rest_seconds) {
      setRestTimer({ seconds: ex.rest_seconds, total: ex.rest_seconds });
    }
  };

  const addSet = (exId) => {
    setSets((prev) => ({
      ...prev,
      [exId]: [...prev[exId], {
        set_number: prev[exId].length + 1,
        reps: '',
        weight_kg: '',
        rpe: 7,
        set_type: 'normal',
        completed: false,
      }],
    }));
  };

  const totalSets = Object.values(sets).flat().length;
  const completedSets = Object.values(sets).flat().filter((s) => s.completed).length;
  const allDone = totalSets > 0 && completedSets === totalSets;

  const finishMutation = useMutation({
    mutationFn: async () => {
      if (workoutLog) {
        await base44.entities.WorkoutLog.update(workoutLog.id, {
          finished_at: new Date().toISOString(),
          duration_minutes: Math.round(elapsed / 60),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutLogs'] });
      setShowPostModal(true);
    },
  });

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/')} className="text-muted-foreground">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <p className="font-heading font-semibold text-sm">{day?.day_of_week} — {day?.session_type}</p>
            <p className="text-primary font-mono text-lg font-bold">{formatTime(elapsed)}</p>
          </div>
          <div className="text-xs text-muted-foreground">{completedSets}/{totalSets}</div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {exercises.map((ex) => {
          const exSets = sets[ex.id] || [];
          const isOpen = expanded[ex.id];
          const prevSets = getPrevSets(ex.name);

          return (
            <div key={ex.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3"
                onClick={() => setExpanded((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
              >
                <div>
                  <p className="font-heading font-semibold text-sm text-left">{ex.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {ex.target_sets} × {ex.target_reps} · {ex.rest_seconds}s rest
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {exSets.filter((s) => s.completed).length}/{exSets.length}
                  </span>
                  {isOpen ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  {/* Last session */}
                  {prevSets.length > 0 && (
                    <div className="bg-muted/50 rounded-xl p-2 mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Last session</p>
                      <div className="flex flex-wrap gap-1.5">
                        {prevSets.map((s, i) => (
                          <span key={i} className="text-xs bg-muted rounded-lg px-2 py-0.5">
                            {s.reps}×{s.weight_kg}kg
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Set rows */}
                  <div className="flex flex-col gap-1.5">
                    {exSets.map((s, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-center gap-2 rounded-xl px-3 py-2 transition-colors',
                          s.completed ? 'bg-primary/10 opacity-70' : 'bg-muted/30'
                        )}
                      >
                        <span className="text-xs text-muted-foreground w-5">{s.set_number}</span>
                        <Input
                          type="number"
                          placeholder={prevSets[idx]?.reps?.toString() || 'Reps'}
                          value={s.reps}
                          onChange={(e) => updateSet(ex.id, idx, { reps: e.target.value })}
                          disabled={s.completed}
                          className="w-16 h-8 text-center bg-input border-border text-sm"
                        />
                        <Input
                          type="number"
                          placeholder={prevSets[idx]?.weight_kg?.toString() || 'kg'}
                          value={s.weight_kg}
                          onChange={(e) => updateSet(ex.id, idx, { weight_kg: e.target.value })}
                          disabled={s.completed}
                          className="w-16 h-8 text-center bg-input border-border text-sm"
                        />
                        {/* Set type pills */}
                        <div className="flex gap-1 flex-1">
                          {SET_TYPES.map((t) => (
                            <button
                              key={t}
                              disabled={s.completed}
                              onClick={() => updateSet(ex.id, idx, { set_type: t })}
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-full border capitalize transition-colors',
                                s.set_type === t
                                  ? 'bg-primary/20 text-primary border-primary/50'
                                  : 'border-border text-muted-foreground'
                              )}
                            >
                              {t === 'normal' ? 'N' : t === 'dropset' ? 'D' : 'S'}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => !s.completed && completeSet(ex, idx)}
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                            s.completed
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'
                          )}
                        >
                          <Check size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => addSet(ex.id)}
                    className="w-full mt-2 flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-primary border border-dashed border-border rounded-xl transition-colors"
                  >
                    <Plus size={12} /> Add set
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rest timer */}
      {restTimer && (
        <RestTimer
          seconds={restTimer.seconds}
          total={restTimer.total}
          onDone={() => setRestTimer(null)}
          onSkip={() => setRestTimer(null)}
        />
      )}

      {/* Post workout modal */}
      {showPostModal && workoutLog && (
        <PostWorkoutModal
          workoutLog={workoutLog}
          user={user}
          onClose={() => navigate('/')}
        />
      )}

      {/* Finish button */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[480px]">
        <Button
          className={cn(
            'w-full gap-2 font-heading font-bold text-base py-5 transition-all',
            allDone
              ? 'bg-primary text-primary-foreground shadow-[0_0_20px_hsl(35_96%_58%/0.5)]'
              : 'bg-secondary text-secondary-foreground'
          )}
          onClick={() => finishMutation.mutate()}
          disabled={finishMutation.isPending}
        >
          <Flag size={18} />
          {allDone ? 'Finish Workout!' : `Finish (${totalSets - completedSets} sets left)`}
        </Button>
      </div>
    </div>
  );
}