import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Check, Flag, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import RestTimer from '@/components/workout/RestTimer';
import PostWorkoutModal from '@/components/workout/PostWorkoutModal';
import WorkoutExerciseEditor from '@/components/workout/WorkoutExerciseEditor.jsx';

const SET_TYPES = ['normal', 'dropset', 'superset'];

const CARDIO_UNITS = { distance: 'km', time: 'min', calories: 'kcal' };

function ExerciseNotes({ ex, onNotesChange }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="mb-3">
      {editing ? (
        <textarea
          autoFocus
          value={ex.notes || ''}
          onChange={(e) => onNotesChange(ex.id, e.target.value)}
          onBlur={() => setEditing(false)}
          placeholder="Add a note for this exercise..."
          className="w-full bg-muted/40 rounded-xl px-3 py-2 text-xs text-muted-foreground resize-none min-h-[60px] border border-border focus:outline-none focus:border-primary"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full text-left bg-muted/40 rounded-xl px-3 py-2 text-xs text-muted-foreground italic hover:bg-muted/60 transition-colors"
        >
          {ex.notes || '+ Add note'}
        </button>
      )}
    </div>
  );
}

function ExerciseCard({ ex, exSets, isOpen, prevSets, onToggle, onUpdateSet, onCompleteSet, onAddSet, onNotesChange, divider }) {
  const isCardio = ex.exercise_type === 'cardio';
  const cardioUnit = CARDIO_UNITS[ex.cardio_metric] || 'km';

  // Group sets: normal first, then dropsets side-by-side
  const renderSets = () => {
    const rows = [];
    const normalSets = exSets.filter((s) => s.set_type !== 'dropset');
    const dropsets = exSets.filter((s) => s.set_type === 'dropset');

    // Render normal sets
    normalSets.forEach((s, normalIdx) => {
      const actualIdx = exSets.indexOf(s);
      rows.push(
        <div
          key={actualIdx}
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2 transition-colors',
            s.completed ? 'bg-primary/10 opacity-70' : 'bg-muted/30'
          )}
        >
          <span className="text-xs text-muted-foreground w-5">{s.set_number}</span>
          {isCardio ? (
            <>
              <Input
                type="number"
                placeholder={ex.target_reps || cardioUnit}
                value={s.reps}
                onChange={(e) => onUpdateSet(ex.id, actualIdx, { reps: e.target.value })}
                disabled={s.completed}
                className="flex-1 h-8 text-center bg-input border-border text-sm"
              />
              <span className="text-xs text-muted-foreground w-8">{cardioUnit}</span>
            </>
          ) : (
            <>
              <Input
                type="number"
                placeholder={prevSets[normalIdx]?.reps?.toString() || 'Reps'}
                value={s.reps}
                onChange={(e) => onUpdateSet(ex.id, actualIdx, { reps: e.target.value })}
                disabled={s.completed}
                className="w-16 h-8 text-center bg-input border-border text-sm"
              />
              <Input
                type="number"
                placeholder={prevSets[normalIdx]?.weight_kg?.toString() || 'kg'}
                value={s.weight_kg}
                onChange={(e) => onUpdateSet(ex.id, actualIdx, { weight_kg: e.target.value })}
                disabled={s.completed}
                className="w-16 h-8 text-center bg-input border-border text-sm"
              />
              {!s.completed && (
                <button
                  onClick={() => onUpdateSet(ex.id, actualIdx, { set_type: s.set_type === 'dropset' ? 'normal' : 'dropset' })}
                  className={cn(
                    'text-[10px] px-2 py-1 rounded-full border transition-colors whitespace-nowrap',
                    s.set_type === 'dropset' 
                      ? 'bg-primary/20 text-primary border-primary/50' 
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {s.set_type === 'dropset' ? 'Drop Set' : 'Make Drop Set'}
                </button>
              )}
            </>
          )}
          <button
            onClick={() => !s.completed && onCompleteSet(ex, actualIdx)}
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center transition-colors ml-auto flex-shrink-0',
              s.completed ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'
            )}
          >
            <Check size={13} />
          </button>
        </div>
      );
    });

    // Render dropsets side-by-side if any
    if (dropsets.length > 0) {
      rows.push(
        <div key="dropsets" className="flex flex-col gap-1">
          <span className="text-[10px] text-primary font-semibold px-1">Dropsets</span>
          <div className="flex gap-1.5 flex-wrap">
            {dropsets.map((ds) => {
              const actualIdx = exSets.indexOf(ds);
              const dropsetNum = dropsets.indexOf(ds) + 1;
              return (
                <div
                  key={actualIdx}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-2 py-2 transition-colors flex-1 min-w-0',
                    ds.completed ? 'bg-primary/10 opacity-70' : 'bg-muted/30'
                  )}
                >
                  <span className="text-[10px] text-muted-foreground">D{dropsetNum}</span>
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={ds.reps}
                    onChange={(e) => onUpdateSet(ex.id, actualIdx, { reps: e.target.value })}
                    disabled={ds.completed}
                    className="w-14 h-7 text-center bg-input border-border text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="kg"
                    value={ds.weight_kg}
                    onChange={(e) => onUpdateSet(ex.id, actualIdx, { weight_kg: e.target.value })}
                    disabled={ds.completed}
                    className="w-14 h-7 text-center bg-input border-border text-xs"
                  />
                  <button
                    onClick={() => !ds.completed && onCompleteSet(ex, actualIdx)}
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                      ds.completed ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'
                    )}
                  >
                    <Check size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return rows;
  };

  return (
    <>
      {divider && <div className="border-t border-border/50" />}
      <button
        className="w-full flex items-center justify-between px-4 py-3"
        onClick={onToggle}
      >
        <div>
          <p className="font-heading font-semibold text-sm text-left">{ex.name}</p>
          <p className="text-muted-foreground text-xs">
            {isCardio
              ? `${ex.cardio_metric || 'distance'} · target: ${ex.target_reps || '—'} ${cardioUnit}`
              : `${ex.target_sets} × ${ex.target_reps} · ${ex.rest_seconds}s rest`}
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
          <ExerciseNotes ex={ex} onUpdateSet={onUpdateSet} onNotesChange={onNotesChange} />
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
          <div className="flex flex-col gap-1.5">{renderSets()}</div>
          <button
            onClick={() => onAddSet(ex.id)}
            className="w-full mt-2 flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-primary border border-dashed border-border rounded-xl transition-colors"
          >
            <Plus size={12} /> Add set
          </button>
        </div>
      )}
    </>
  );
}

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
  const [timerMinimized, setTimerMinimized] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [exerciseOrder, setExerciseOrder] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [localExercises, setLocalExercises] = useState(null); // null = use server exercises
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

  // The active exercise list: prefer local edits, fall back to server data
  const activeExercises = localExercises ?? exercises;

  // Initialize sets and order
  useEffect(() => {
    if (exercises.length && !exerciseOrder.length) {
      setExerciseOrder(exercises.map((e) => e.id));
    }
  }, [exercises]);

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

  // Handlers for WorkoutExerciseEditor
  const handleEditorReorder = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= activeExercises.length) return;
    const next = [...activeExercises];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setLocalExercises(next);
    setExerciseOrder(next.map((e) => e.id));
  };

  const handleEditorRemove = (exId) => {
    const next = activeExercises.filter((e) => e.id !== exId);
    setLocalExercises(next);
    setExerciseOrder(next.map((e) => e.id));
    setSets((prev) => { const copy = { ...prev }; delete copy[exId]; return copy; });
    setExpanded((prev) => { const copy = { ...prev }; delete copy[exId]; return copy; });
  };

  const handleEditorAdd = (ex) => {
    const next = [...activeExercises, ex];
    setLocalExercises(next);
    setExerciseOrder(next.map((e) => e.id));
    setSets((prev) => ({
      ...prev,
      [ex.id]: Array.from({ length: ex.target_sets || 3 }, (_, i) => ({
        set_number: i + 1, reps: '', weight_kg: '', rpe: 7, set_type: 'normal', completed: false,
      })),
    }));
    setExpanded((prev) => ({ ...prev, [ex.id]: true }));
  };

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
      setTimerMinimized(false);
    }
  };

  const updateExerciseNotes = (exId, notes) => {
    const update = (list) => list.map((e) => e.id === exId ? { ...e, notes } : e);
    setLocalExercises((prev) => update(prev ?? exercises));
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditor(true)}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-muted-foreground"
            >
              <Pencil size={12} />
              Edit
            </button>
            <div className="text-xs text-muted-foreground">{completedSets}/{totalSets}</div>
          </div>
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
        {(() => {
          const orderedExercises = exerciseOrder.length
            ? exerciseOrder.map((id) => activeExercises.find((e) => e.id === id)).filter(Boolean)
            : activeExercises;

          // Group exercises: supersets grouped, others individual
          const rendered = [];
          const usedIds = new Set();

          orderedExercises.forEach((ex) => {
            if (usedIds.has(ex.id)) return;

            if (ex.superset_group) {
              // Find all exercises in this superset group
              const group = orderedExercises.filter((e) => e.superset_group === ex.superset_group);
              group.forEach((e) => usedIds.add(e.id));
              rendered.push({ type: 'superset', exercises: group });
            } else {
              usedIds.add(ex.id);
              rendered.push({ type: 'single', exercises: [ex] });
            }
          });

          return rendered.map((item, itemIdx) => {
            if (item.type === 'superset') {
              const group = item.exercises;
              return (
                <div key={itemIdx} className="border border-primary/30 rounded-2xl overflow-hidden">
                  <div className="bg-primary/10 px-4 py-1.5 text-[10px] text-primary font-semibold uppercase tracking-wider">
                    Superset
                  </div>
                  {group.map((ex, gi) => (
                    <ExerciseCard
                      key={ex.id}
                      ex={ex}
                      exSets={sets[ex.id] || []}
                      isOpen={expanded[ex.id]}
                      prevSets={getPrevSets(ex.name)}
                      onToggle={() => setExpanded((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
                      onUpdateSet={updateSet}
                      onCompleteSet={completeSet}
                      onAddSet={addSet}
                      onNotesChange={updateExerciseNotes}
                      divider={gi < group.length - 1}
                    />
                  ))}
                </div>
              );
            }

            const ex = item.exercises[0];
            return (
              <div key={ex.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <ExerciseCard
                  ex={ex}
                  exSets={sets[ex.id] || []}
                  isOpen={expanded[ex.id]}
                  prevSets={getPrevSets(ex.name)}
                  onToggle={() => setExpanded((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
                  onUpdateSet={updateSet}
                  onCompleteSet={completeSet}
                  onAddSet={addSet}
                  onNotesChange={updateExerciseNotes}
                  divider={false}
                />
              </div>
            );
          });
        })()}
      </div>

      {/* Exercise editor panel */}
      {showEditor && (
        <WorkoutExerciseEditor
          exercises={activeExercises}
          sessionType={day?.session_type || 'Custom'}
          onClose={() => setShowEditor(false)}
          onReorder={handleEditorReorder}
          onRemove={handleEditorRemove}
          onAdd={handleEditorAdd}
          onUpdateExercise={(exId, updates) => {
            const updated = activeExercises.map((e) => e.id === exId ? { ...e, ...updates } : e);
            setLocalExercises(updated);
          }}
        />
      )}

      {/* Rest timer */}
      {restTimer && (
        <RestTimer
          seconds={restTimer.seconds}
          total={restTimer.total}
          onDone={() => setRestTimer(null)}
          onSkip={() => setRestTimer(null)}
          isMinimized={timerMinimized}
          onToggleMinimize={() => setTimerMinimized(!timerMinimized)}
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