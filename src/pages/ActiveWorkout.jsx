import { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Check, Flag, Pencil, GripVertical, ScanLine } from 'lucide-react';
import ImportWorkoutModal from '@/components/import/ImportWorkoutModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import RestTimer from '@/components/workout/RestTimer';
import PostWorkoutModal from '@/components/workout/PostWorkoutModal';
import WorkoutExerciseEditor from '@/components/workout/WorkoutExerciseEditor.jsx';
import RepFeedback, { parseRepRange, getRepFeedback } from '@/components/workout/RepFeedback';
import ExerciseHistory from '@/components/workout/ExerciseHistory';
import RIRPicker from '@/components/workout/RIRPicker';
import WorkoutSummaryScreen from '@/components/workout/WorkoutSummaryScreen';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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
          className="w-full text-left bg-muted/40 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-muted/60 transition-colors flex items-center gap-2"
        >
          <Pencil size={11} className="shrink-0 opacity-50" />
          <span className={ex.notes ? '' : 'italic opacity-60'}>{ex.notes || 'Add a note...'}</span>
        </button>
      )}
    </div>
  );
}

function ExerciseCard({ ex, exSets, isOpen, prevSets, onToggle, onUpdateSet, onCompleteSet, onAddSet, onNotesChange, onRepRangeChange, onRepModeChange, divider, userId }) {
  // prevSets is available in renderSets via closure
  const { unit: weightUnit, toggle: toggleUnit, toDisplay, toKg } = useWeightUnit();
  const isCardio = ex.exercise_type === 'cardio';
  const cardioUnit = CARDIO_UNITS[ex.cardio_metric] || 'km';
  // RIR picker state: { exId, setIdx } when open
  const [rirPickerFor, setRirPickerFor] = useState(null);

  // Group sets: normal first, then dropsets side-by-side
  const renderSets = () => {
    const rows = [];
    const normalSets = exSets;

    // Column headers
    rows.push(
      <div key="headers" className="flex items-center px-1 mb-1">
        <span className="w-6 shrink-0" />
        {isCardio ? (
          <span className="flex-1 text-[10px] text-muted-foreground text-center uppercase tracking-widest">{ex.cardio_metric || 'Distance'}</span>
        ) : (
          <>
            <span className="w-14 text-[10px] text-muted-foreground text-center uppercase tracking-widest shrink-0">Range</span>
            <span className="flex-1 text-[10px] text-muted-foreground text-center uppercase tracking-widest">Reps</span>
            <span className="flex-1 text-[10px] text-muted-foreground text-center uppercase tracking-widest">Weight ({weightUnit})</span>
            <span className="w-14 text-[10px] text-muted-foreground text-center uppercase tracking-widest ml-2">RIR</span>
            <span className="w-10 shrink-0" />
          </>
        )}
      </div>
    );

    // Render normal sets
    normalSets.forEach((s, normalIdx) => {
      const actualIdx = exSets.indexOf(s);
      rows.push(
        <div
          key={actualIdx}
          className={cn(
            'flex items-center gap-1.5 rounded-2xl px-3 py-2.5 transition-all',
            s.completed ? 'bg-primary/10' : 'bg-muted/40'
          )}
        >
          {/* Set number */}
          <span className={cn('text-xs font-semibold w-5 shrink-0 text-center', s.completed ? 'text-primary' : 'text-muted-foreground')}>
            {s.set_number}
          </span>

          {isCardio ? (
            <>
              <Input
                type="number"
                placeholder={ex.target_reps || cardioUnit}
                value={s.reps}
                onChange={(e) => onUpdateSet(ex.id, actualIdx, { reps: e.target.value })}
                onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                disabled={s.completed}
                className="flex-1 h-10 text-center bg-background border-border rounded-xl text-sm font-semibold"
              />
              <span className="text-xs text-muted-foreground shrink-0">{cardioUnit}</span>
            </>
          ) : (
            <>
              {/* Rep range badge */}
              <div className="w-14 shrink-0 h-10 flex items-center justify-center bg-muted/60 border border-border rounded-xl text-xs font-semibold text-muted-foreground">
                {ex.target_reps || '—'}
              </div>

              {/* Reps input */}
              <input
                type="number"
                inputMode="decimal"
                placeholder={prevSets[normalIdx]?.reps?.toString() || '—'}
                value={s.reps}
                onChange={(e) => onUpdateSet(ex.id, actualIdx, { reps: e.target.value })}
                onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                disabled={s.completed}
                className="flex-1 h-10 text-center bg-background border border-border rounded-xl text-sm font-bold outline-none focus:border-primary transition-colors disabled:opacity-50 min-w-0 placeholder:text-muted-foreground/40 placeholder:font-normal"
              />

              {/* Weight input */}
              <input
                type="number"
                inputMode="decimal"
                placeholder={prevSets[normalIdx]?.weight_kg != null ? toDisplay(prevSets[normalIdx].weight_kg).toString() : '—'}
                value={s.weight_display ?? ''}
                onChange={(e) => {
                  const displayVal = e.target.value;
                  onUpdateSet(ex.id, actualIdx, { weight_display: displayVal, weight_kg: toKg(displayVal) });
                }}
                onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                disabled={s.completed}
                className="flex-1 h-10 text-center bg-background border border-border rounded-xl text-sm font-bold outline-none focus:border-primary transition-colors disabled:opacity-50 min-w-0 placeholder:text-muted-foreground/40 placeholder:font-normal"
              />

              {/* RIR badge — tap to open picker */}
              <button
                disabled={s.completed}
                onClick={() => !s.completed && setRirPickerFor({ exId: ex.id, setIdx: actualIdx })}
                className={cn(
                  'w-14 h-10 rounded-xl border text-sm font-bold shrink-0 flex items-center justify-center transition-colors',
                  s.rpe !== '' && s.rpe != null
                    ? 'bg-primary/10 text-primary border-primary/40'
                    : prevSets[normalIdx]?.rpe != null && prevSets[normalIdx]?.rpe !== ''
                    ? 'border-border text-muted-foreground/40 hover:border-primary/50 disabled:opacity-50'
                    : 'border-border text-muted-foreground/40 hover:border-primary/50 disabled:opacity-50'
                )}
              >
                {s.rpe !== '' && s.rpe != null
                  ? s.rpe
                  : prevSets[normalIdx]?.rpe != null
                  ? prevSets[normalIdx].rpe
                  : '—'}
              </button>


            </>
          )}

          {/* Complete button — opens RIR picker for strength sets */}
          <button
            onClick={() => {
              if (s.completed) return;
              if (!isCardio) {
                setRirPickerFor({ exId: ex.id, setIdx: actualIdx });
              } else {
                onCompleteSet(ex, actualIdx);
              }
            }}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0',
              s.completed
                ? 'bg-primary text-primary-foreground shadow-[0_0_10px_hsl(35_96%_58%/0.4)]'
                : 'border-2 border-border text-muted-foreground hover:border-primary hover:text-primary'
            )}
          >
            <Check size={14} />
          </button>
        </div>
      );
    });

    return rows;
  };

  const handleRirConfirm = (rirValue) => {
    const { exId, setIdx } = rirPickerFor;
    onUpdateSet(exId, setIdx, { rpe: rirValue != null ? String(rirValue) : '', rpeEdited: true });
    onCompleteSet(ex, setIdx, rirValue != null ? String(rirValue) : undefined);
    setRirPickerFor(null);
  };

  const handleRirSkip = () => {
    const { exId, setIdx } = rirPickerFor;
    onCompleteSet(ex, setIdx);
    setRirPickerFor(null);
  };

  return (
    <>
      {rirPickerFor && (
        <RIRPicker
          initialValue={exSets[rirPickerFor.setIdx]?.rpe}
          onConfirm={handleRirConfirm}
          onSkip={handleRirSkip}
        />
      )}
      {divider && <div className="border-t border-border/50" />}
      <button
        className="w-full flex items-center justify-between px-4 py-3 min-h-11"
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
          {!isCardio && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleUnit(); }}
              className="text-[10px] px-2 py-0.5 rounded-lg border border-border font-bold text-primary"
            >
              {weightUnit.toUpperCase()}
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            {exSets.filter((s) => s.completed).length}/{exSets.length}
          </span>
          {isOpen ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <ExerciseNotes ex={ex} onUpdateSet={onUpdateSet} onNotesChange={onNotesChange} />
          <ExerciseHistory exerciseName={ex.name} userId={userId} weightUnit={weightUnit} toDisplay={toDisplay} />

          {/* Reps / Time mode toggle + quick presets */}
          {!isCardio && (
            <div className="mb-3">
              <div className="flex gap-1.5 mb-2">
                <button
                  onClick={() => onRepModeChange(ex.id, 'reps')}
                  className={cn(
                    'flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-colors',
                    (ex.rep_mode || 'reps') === 'reps'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  Reps
                </button>
                <button
                  onClick={() => onRepModeChange(ex.id, 'time')}
                  className={cn(
                    'flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-colors',
                    ex.rep_mode === 'time'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  Time
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(ex.rep_mode === 'time'
                  ? ['20s', '30s', '45s', '60s', '90s', '2min', '3min']
                  : ['6', '8', '10', '12', '15', '20', 'AMRAP']
                ).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => onRepRangeChange(ex.id, preset)}
                    className={cn(
                      'px-3 py-1 rounded-xl border text-xs transition-colors',
                      ex.target_reps === preset
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1.5">{renderSets()}</div>
          <button
            onClick={() => onAddSet(ex.id)}
            className="w-full mt-2 flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-primary border border-dashed border-border rounded-xl transition-colors min-h-11"
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
  const [showSummary, setShowSummary] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [persistedGameState, setPersistedGameState] = useState(null);
  const [exerciseOrder, setExerciseOrder] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [localExercises, setLocalExercises] = useState(null); // null = use server exercises
  const [repFeedback, setRepFeedback] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [summaryImageUrl, setSummaryImageUrl] = useState(null);
  const [showImportDay, setShowImportDay] = useState(false);
  const summaryRef = useRef(null);
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
    queryKey: ['prevSetLogs', user?.email, dayId],
    queryFn: async () => {
      // Get workout logs for this specific split day
      const dayLogs = await base44.entities.WorkoutLog.filter({ user_id: user?.email, split_day_id: dayId }, '-created_date', 10);
      if (!dayLogs.length) return [];
      // Get set logs from those sessions (skip the current one if it exists)
      const pastLogIds = dayLogs
        .filter((l) => l.id !== workoutLog?.id)
        .slice(0, 5)
        .map((l) => l.id);
      if (!pastLogIds.length) return [];
      const allSets = await Promise.all(
        pastLogIds.map((id) => base44.entities.SetLog.filter({ workout_log_id: id, completed: true }))
      );
      return allSets.flat();
    },
    enabled: !!user && !!dayId,
    staleTime: 0,
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
          weight_display: '',
          rpe: '',
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
        set_number: i + 1, reps: '', weight_kg: '', weight_display: '', rpe: '', set_type: 'normal', completed: false,
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
    const prev = prevLogs.filter((s) => s.exercise_name === exName);
    if (!prev.length) return [];
    // Sort by created_date descending to find the most recent session for this exercise
    const sorted = [...prev].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const lastLogId = sorted[0].workout_log_id;
    return prev.filter((s) => s.workout_log_id === lastLogId).sort((a, b) => a.set_number - b.set_number);
  };

  const updateSet = (exId, setIdx, patch) => {
    setSets((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => (i === setIdx ? { ...s, ...patch } : s)),
    }));
  };

  const completeSet = async (ex, setIdx, rpeOverride) => {
    const set = sets[ex.id][setIdx];
    // Optimistic update
    updateSet(ex.id, setIdx, { completed: true });

    // Rep range feedback (strength only)
    if (ex.exercise_type !== 'cardio' && set.reps) {
      const range = parseRepRange(ex.target_reps);
      const completedNormalSets = (sets[ex.id] || []).filter((s, i) => i <= setIdx && s.set_type !== 'dropset').length;
      const totalNormalSets = (sets[ex.id] || []).filter((s) => s.set_type !== 'dropset').length;
      const feedback = getRepFeedback(set.reps, range, completedNormalSets, totalNormalSets);
      if (feedback) setRepFeedback(feedback);
    }

    // Use rpeOverride if provided (avoids stale state issue), else fall back to set.rpe
    const rpeValue = rpeOverride !== undefined ? rpeOverride : set.rpe;

    if (workoutLog) {
      await base44.entities.SetLog.create({
        workout_log_id: workoutLog.id,
        user_id: user.email,
        exercise_name: ex.name,
        exercise_order: ex.order_index,
        set_number: set.set_number,
        reps: Number(set.reps),
        weight_kg: Number(set.weight_kg),
        rpe: rpeValue !== '' && rpeValue != null ? Number(rpeValue) : undefined,
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

  const updateRepRange = (exId, target_reps) => {
    const update = (list) => list.map((e) => e.id === exId ? { ...e, target_reps } : e);
    setLocalExercises((prev) => update(prev ?? exercises));
  };

  const updateRepMode = (exId, rep_mode) => {
    const update = (list) => list.map((e) => e.id === exId ? { ...e, rep_mode, target_reps: '' } : e);
    setLocalExercises((prev) => update(prev ?? exercises));
  };

  const handleDragEnd = (result) => {
    setIsReordering(false);
    if (!result.destination) return;
    const orderedExercises = exerciseOrder.length
      ? exerciseOrder.map((id) => activeExercises.find((e) => e.id === id)).filter(Boolean)
      : activeExercises;
    const next = [...orderedExercises];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setLocalExercises(next);
    setExerciseOrder(next.map((e) => e.id));
  };

  const addSet = (exId) => {
    setSets((prev) => ({
      ...prev,
      [exId]: [...prev[exId], {
        set_number: prev[exId].length + 1,
        reps: '',
        weight_kg: '',
        weight_display: '',
        rpe: '',
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
      // Fetch & increment streak
      if (user) {
        const members = await base44.entities.GroupMember.filter({ user_id: user.email });
        const newStreak = (members[0]?.streak || 0) + 1;
        if (members[0]) {
          await base44.entities.GroupMember.update(members[0].id, { streak: newStreak });
        }
        setCurrentStreak(newStreak);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutLogs'] });
      setShowSummary(true);
    },
    onError: () => {
      // Still show summary even if saving failed
      setShowSummary(true);
    },
  });

  const handleImportDay = (parsed) => {
    // Add imported exercises as new local exercises with their set data pre-filled
    const imported = (parsed.exercises || []).map((ex, i) => ({
      id: `ai-import-${Date.now()}-${i}`,
      name: ex.exercise_name,
      exercise_type: 'strength',
      target_sets: ex.target_sets || (ex.sets?.length) || 3,
      target_reps: ex.target_reps || String(ex.sets?.[0]?.reps || '8-12'),
      rest_seconds: 90,
      order_index: (activeExercises.length) + i,
      notes: '',
    }));
    const importedSets = {};
    imported.forEach((ex, i) => {
      const parsedEx = parsed.exercises[i];
      if (parsedEx.sets && parsedEx.sets.length > 0) {
        importedSets[ex.id] = parsedEx.sets.map((s, si) => ({
          set_number: si + 1,
          reps: s.reps != null ? String(s.reps) : '',
          weight_kg: s.weight_kg != null ? s.weight_kg : '',
          weight_display: s.weight_kg != null ? String(s.weight_kg) : '',
          rpe: s.rir != null ? String(s.rir) : '',
          set_type: 'normal',
          completed: false,
        }));
      } else {
        importedSets[ex.id] = Array.from({ length: ex.target_sets }, (_, si) => ({
          set_number: si + 1, reps: '', weight_kg: '', weight_display: '', rpe: '', set_type: 'normal', completed: false,
        }));
      }
    });
    const next = [...activeExercises, ...imported];
    setLocalExercises(next);
    setExerciseOrder(next.map((e) => e.id));
    setSets((prev) => ({ ...prev, ...importedSets }));
    setExpanded((prev) => {
      const exp = { ...prev };
      imported.forEach((ex) => { exp[ex.id] = true; });
      return exp;
    });
    toast.success(`Imported ${imported.length} exercise${imported.length !== 1 ? 's' : ''} from screenshot`);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}>
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
              onClick={() => setShowImportDay(true)}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg border border-primary/30 bg-primary/5 text-primary"
            >
              <ScanLine size={12} />
              Scan
            </button>
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

      {/* Reorder mode banner */}
      {isReordering && (
        <div className="mx-4 mt-3 px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl text-xs text-primary font-semibold text-center">
          Drag to reorder · release to confirm
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd} onDragStart={() => { setIsReordering(true); setExpanded({}); }}>
        <Droppable droppableId="exercises">
          {(provided) => (
            <div
              className="px-4 pt-4 flex flex-col gap-3"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {(() => {
                const orderedExercises = exerciseOrder.length
                  ? exerciseOrder.map((id) => activeExercises.find((e) => e.id === id)).filter(Boolean)
                  : activeExercises;

                return orderedExercises.map((ex, idx) => (
                  <Draggable key={ex.id} draggableId={ex.id} index={idx}>
                    {(drag, snapshot) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        className={cn(
                          'bg-card border border-border rounded-2xl overflow-hidden transition-shadow',
                          snapshot.isDragging && 'shadow-2xl border-primary/50 scale-[1.02]'
                        )}
                      >
                        {/* Drag handle — long-press activates drag on mobile */}
                        <div className="flex items-center">
                          <div
                            {...drag.dragHandleProps}
                            className="px-3 py-4 text-muted-foreground touch-none flex items-center self-stretch"
                            onTouchStart={() => {
                              // Collapse all when drag starts
                              setExpanded({});
                            }}
                          >
                            <GripVertical size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <ExerciseCard
                              ex={ex}
                              exSets={sets[ex.id] || []}
                              isOpen={!isReordering && expanded[ex.id]}
                              prevSets={getPrevSets(ex.name)}
                              onToggle={() => !isReordering && setExpanded((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
                              onUpdateSet={updateSet}
                              onCompleteSet={completeSet}
                              onAddSet={addSet}
                              onNotesChange={updateExerciseNotes}
                              onRepRangeChange={updateRepRange}
                              onRepModeChange={updateRepMode}
                              divider={false}
                              userId={user?.email}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ));
              })()}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* AI Import Day modal */}
      {showImportDay && (
        <ImportWorkoutModal
          mode="day"
          onImportDay={handleImportDay}
          onClose={() => setShowImportDay(false)}
        />
      )}

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

      {/* Rep range feedback */}
      <RepFeedback feedback={repFeedback} onDismiss={() => setRepFeedback(null)} />

      {/* Rest timer */}
      {restTimer && (
        <RestTimer
          seconds={restTimer.seconds}
          total={restTimer.total}
          onDone={() => setRestTimer(null)}
          onSkip={() => setRestTimer(null)}
          isMinimized={timerMinimized}
          onToggleMinimize={() => setTimerMinimized(!timerMinimized)}
          gameState={persistedGameState}
          onGameStateChange={setPersistedGameState}
        />
      )}

      {/* Workout summary screen */}
      {showSummary && (
        <WorkoutSummaryScreen
          summaryRef={summaryRef}
          sets={sets}
          exercises={activeExercises}
          streak={currentStreak}
          durationMinutes={Math.round(elapsed / 60)}
          onContinue={async () => {
            // Capture summary as image for sharing
            if (summaryRef.current) {
              try {
                const canvas = await html2canvas(summaryRef.current, { backgroundColor: null, scale: 2 });
                const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
                const file = new File([blob], 'workout-summary.png', { type: 'image/png' });
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                setSummaryImageUrl(file_url);
              } catch (e) {
                // If capture fails, proceed without image
              }
            }
            setShowSummary(false);
            setShowPostModal(true);
          }}
        />
      )}

      {/* Post workout modal */}
      {showPostModal && workoutLog && (
        <PostWorkoutModal
          workoutLog={workoutLog}
          user={user}
          summaryImageUrl={summaryImageUrl}
          onClose={() => navigate('/')}
        />
      )}

      {/* Finish / Discard buttons */}
      <div className="fixed bottom-0 left-0 right-0 flex gap-2 px-4 pt-3 bg-background/90 backdrop-blur-md border-t border-border" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <Button
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10 font-heading font-bold py-5 px-4 touch-target-44 shrink-0"
          onClick={() => {
            if (confirm('Discard this workout? All progress will be lost.')) {
              if (workoutLog) base44.entities.WorkoutLog.delete(workoutLog.id).catch(() => {});
              navigate('/');
            }
          }}
        >
          Discard
        </Button>
        <Button
        className={cn(
        'flex-1 gap-2 font-heading font-bold text-base py-5 transition-all touch-target-44',
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