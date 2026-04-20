import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { useParams, useNavigate } from 'react-router-dom';
import { format, startOfDay, differenceInCalendarDays, subDays, parseISO } from 'date-fns';

const parseLocalDate = (dateStr) => parseISO(dateStr);
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowLeftRight, Plus, Check, Flag, Pencil, GripVertical, ScanLine, Trash2, X, Camera } from 'lucide-react';
import { EXERCISES_BY_MUSCLE, SESSION_MUSCLE_GROUPS } from '@/components/splitbuilder/exerciseData';
import ImportWorkoutModal from '@/components/import/ImportWorkoutModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import RestTimer from '@/components/workout/RestTimer';
import PostWorkoutModal from '@/components/workout/PostWorkoutModal';
import WorkoutExerciseEditor from '@/components/workout/WorkoutExerciseEditor.jsx';
import { parseRepRange, getRepFeedback, getWeightSuggestion } from '@/components/workout/RepFeedback';
import ExerciseHistory from '@/components/workout/ExerciseHistory';
import RIRPicker from '@/components/workout/RIRPicker';
import RepRangePicker from '@/components/workout/RepRangePicker';
import WorkoutSummaryScreen from '@/components/workout/WorkoutSummaryScreen';
import StreakCelebration from '@/components/workout/StreakCelebration';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';


const CARDIO_UNITS = { distance: 'km', time: 'min', calories: 'kcal' };

function SwapExerciseModal({ ex, sessionType, onSwap, onClose }) {
  const [query, setQuery] = useState('');
  const allExercises = useMemo(() => {
    const groups = SESSION_MUSCLE_GROUPS[sessionType] || SESSION_MUSCLE_GROUPS['Custom'] || [];
    const seen = new Set();
    return groups.flatMap((g) => EXERCISES_BY_MUSCLE[g] || []).filter((e) => {
      if (seen.has(e.name)) return false;
      seen.add(e.name);
      return true;
    });
  }, [sessionType]);
  const filtered = useMemo(() => {
    if (!query) return allExercises.slice(0, 40);
    return allExercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase())).slice(0, 40);
  }, [allExercises, query]);
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full bg-card rounded-t-3xl border-t border-border flex flex-col"
        style={{ maxHeight: '72vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="font-heading font-bold text-base">Swap Exercise</p>
            <p className="text-xs text-muted-foreground">Currently: {ex.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground p-1"><X size={18} /></button>
        </div>
        <div className="px-4 pb-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full h-10 rounded-xl bg-input border border-border px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="overflow-y-auto flex-1 px-4 pb-8">
          {query.trim() && (
            <button
              onClick={() => onSwap(query.trim())}
              className="w-full text-left px-3 py-3 rounded-xl hover:bg-muted/50 text-sm font-semibold text-primary border-b border-border/30 mb-1"
            >
              + Use "{query.trim()}" as custom exercise
            </button>
          )}
          {filtered.map((e) => (
            <button
              key={e.name}
              onClick={() => onSwap(e.name)}
              className={cn(
                'w-full text-left px-3 py-3 rounded-xl hover:bg-muted/50 text-sm border-b border-border/30 last:border-0',
                e.name === ex.name ? 'text-primary font-semibold' : 'text-foreground'
              )}
            >
              {e.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

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

function ExerciseCard({ ex, exSets, isOpen, prevSets, onToggle, onUpdateSet, onCompleteSet, onUncompleteSet, onAddSet, onNotesChange, onRepRangeChange, onRepModeChange, onDeleteSet, onSwapExercise, onImageChange, sessionType, divider, userId }) {
  const { unit: weightUnit, toggle: toggleUnit, toDisplay, toKg } = useWeightUnit();
  const isCardio = ex.exercise_type === 'cardio';
  const cardioUnit = CARDIO_UNITS[ex.cardio_metric] || 'km';
  const [rirPickerFor, setRirPickerFor] = useState(null);
  const [showSwap, setShowSwap] = useState(false);
  const [swipeOffsets, setSwipeOffsets] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const photoInputRef = useRef(null);
  const swipeTouchStart = useRef({});

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.SplitExercise.update(ex.id, { image_url: file_url });
    onImageChange && onImageChange(ex.id, file_url);
    setUploadingImage(false);
  };

  const handleSwipeTouchStart = (idx, e) => {
    swipeTouchStart.current[idx] = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      baseOffset: swipeOffsets[idx] || 0,
    };
  };

  const handleSwipeTouchMove = (idx, e) => {
    const start = swipeTouchStart.current[idx];
    if (!start) return;
    const dx = e.touches[0].clientX - start.x;
    const dy = e.touches[0].clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) + 5) {
      const newOffset = Math.min(Math.max(start.baseOffset + dx, -90), 0);
      setSwipeOffsets((prev) => ({ ...prev, [idx]: newOffset }));
    }
  };

  const handleSwipeTouchEnd = (idx) => {
    const offset = swipeOffsets[idx] || 0;
    if (offset < -40) {
      // Snap open to reveal delete button
      setSwipeOffsets((prev) => ({ ...prev, [idx]: -80 }));
    } else {
      // Snap back closed
      setSwipeOffsets((prev) => ({ ...prev, [idx]: 0 }));
    }
    delete swipeTouchStart.current[idx];
  };

  const handleDeleteTap = (idx) => {
    onDeleteSet(ex.id, idx);
    setSwipeOffsets((prev) => { const n = { ...prev }; delete n[idx]; return n; });
  };

  const handleRowTap = (idx) => {
    if ((swipeOffsets[idx] || 0) < 0) {
      setSwipeOffsets((prev) => ({ ...prev, [idx]: 0 }));
    }
  };

  const renderSetRow = (s, actualIdx, label, isDropset = false, prevSet = null) => {
    const swipeOffset = swipeOffsets[actualIdx] || 0;
    return (
      <div
        key={actualIdx}
        className="relative overflow-hidden rounded-2xl"
        onTouchStart={(e) => handleSwipeTouchStart(actualIdx, e)}
        onTouchMove={(e) => handleSwipeTouchMove(actualIdx, e)}
        onTouchEnd={() => handleSwipeTouchEnd(actualIdx)}
        onClick={() => { if ((swipeOffsets[actualIdx] || 0) < 0) setSwipeOffsets((prev) => ({ ...prev, [actualIdx]: 0 })); }}
      >
        <button
          className="absolute inset-y-0 right-0 w-20 bg-destructive flex items-center justify-center"
          style={{
            transform: `translateX(${80 + swipeOffset}px)`,
            transition: swipeTouchStart.current[actualIdx] ? 'none' : 'transform 0.2s ease',
          }}
          onClick={(e) => { e.stopPropagation(); handleDeleteTap(actualIdx); }}
        >
          <Trash2 size={16} className="text-white" />
        </button>
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-2.5 transition-all',
            isDropset ? 'bg-primary/5 ml-3 border-l-2 border-primary/30' : '',
            s.completed ? 'bg-primary/10' : (!isDropset ? 'bg-muted/40' : '')
          )}
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: swipeTouchStart.current[actualIdx] ? 'none' : 'transform 0.2s ease',
          }}
          onClick={() => handleRowTap(actualIdx)}
        >
          <span className={cn(
            'text-xs font-semibold w-5 shrink-0 text-center',
            isDropset ? 'text-primary/70' : (s.completed ? 'text-primary' : 'text-muted-foreground')
          )}>
            {label}
          </span>

          {isCardio ? (
            <>
              <Input
                type="number"
                placeholder={ex.target_reps || cardioUnit}
                value={s.reps}
                min="0"
                onChange={(e) => onUpdateSet(ex.id, actualIdx, { reps: e.target.value === '' ? '' : String(Math.max(0, parseFloat(e.target.value) || 0)) })}
                onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                disabled={s.completed}
                className="flex-1 h-10 text-center bg-background border-border rounded-xl text-sm font-semibold"
              />
              <span className="text-xs text-muted-foreground shrink-0">{cardioUnit}</span>
            </>
          ) : (
            <>
              <div className={cn(
                'w-14 shrink-0 h-10 flex items-center justify-center border rounded-xl text-xs font-semibold',
                isDropset ? 'bg-primary/10 border-primary/20 text-primary/70' : 'bg-muted/60 border-border text-muted-foreground'
              )}>
                {isDropset ? 'DS' : (ex.target_reps || '—')}
              </div>

              <input
                type="number"
                inputMode="decimal"
                placeholder={prevSet?.weight_kg != null ? toDisplay(prevSet.weight_kg).toString() : '—'}
                value={s.weight_display ?? ''}
                min="0"
                onChange={(e) => {
                  const displayVal = e.target.value === '' ? '' : String(Math.max(0, parseFloat(e.target.value) || 0));
                  onUpdateSet(ex.id, actualIdx, { weight_display: displayVal, weight_kg: toKg(displayVal) });
                }}
                onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                disabled={s.completed}
                className="flex-1 h-10 text-center bg-background border border-border rounded-xl text-sm font-bold outline-none focus:border-primary transition-colors disabled:opacity-50 min-w-0 placeholder:text-muted-foreground/40 placeholder:font-normal"
              />

              <input
                type="number"
                inputMode="decimal"
                placeholder={prevSet?.reps?.toString() || '—'}
                value={s.reps}
                min="0"
                onChange={(e) => onUpdateSet(ex.id, actualIdx, { reps: e.target.value === '' ? '' : String(Math.max(0, parseFloat(e.target.value) || 0)) })}
                onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                disabled={s.completed}
                className="flex-1 h-10 text-center bg-background border border-border rounded-xl text-sm font-bold outline-none focus:border-primary transition-colors disabled:opacity-50 min-w-0 placeholder:text-muted-foreground/40 placeholder:font-normal"
              />

              <button
                disabled={s.completed}
                onClick={() => !s.completed && setRirPickerFor({ exId: ex.id, setIdx: actualIdx })}
                className={cn(
                  'w-14 h-10 rounded-xl border text-sm font-bold shrink-0 flex items-center justify-center transition-colors',
                  s.rpe !== '' && s.rpe != null
                    ? 'bg-primary/10 text-primary border-primary/40'
                    : 'border-border text-muted-foreground/40 hover:border-primary/50 disabled:opacity-50'
                )}
              >
                {s.rpe !== '' && s.rpe != null ? s.rpe : (prevSet?.rpe != null ? prevSet.rpe : '—')}
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (s.completed) {
                onUncompleteSet(ex, actualIdx);
              } else if (!isCardio) {
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
      </div>
    );
  };

  const renderSets = () => {
    const rows = [];
    const dropsetCount = ex.dropset_count || 0;

    rows.push(
      <div key="headers" className="flex items-center px-1 mb-1">
        <span className="w-6 shrink-0" />
        {isCardio ? (
          <span className="flex-1 text-[10px] text-muted-foreground text-center uppercase tracking-widest">{ex.cardio_metric || 'Distance'}</span>
        ) : (
          <>
            <span className="w-14 text-[10px] text-muted-foreground text-center uppercase tracking-widest shrink-0">Range</span>
            <span className="flex-1 text-[10px] text-muted-foreground text-center uppercase tracking-widest">Weight ({weightUnit})</span>
            <span className="flex-1 text-[10px] text-muted-foreground text-center uppercase tracking-widest">Reps</span>
            <span className="w-14 text-[10px] text-muted-foreground text-center uppercase tracking-widest ml-2">RIR</span>
            <span className="w-10 shrink-0" />
          </>
        )}
        {!isCardio && dropsetCount > 0 && (
          <span className="text-[9px] text-primary/60 font-semibold ml-1">+{dropsetCount}DS</span>
        )}
      </div>
    );

    // Group sets: each "normal" set may be followed by its drop sets
    // We track which sets are normal vs dropset by set_type
    const normalSets = exSets.filter((s) => s.set_type !== 'dropset');
    const dropsetSets = exSets.filter((s) => s.set_type === 'dropset');

    // Build a flat ordered list pairing normal sets with their drop sets
    let dropsetIdx = 0;
    normalSets.forEach((s, normalIdx) => {
      const actualIdx = exSets.indexOf(s);
      rows.push(renderSetRow(s, actualIdx, String(s.set_number), false, prevSets[normalIdx]));

      // Inline drop set rows for this normal set
      const myDropsets = dropsetSets.slice(normalIdx * dropsetCount, normalIdx * dropsetCount + dropsetCount);
      myDropsets.forEach((ds, di) => {
        const dsActualIdx = exSets.indexOf(ds);
        rows.push(renderSetRow(ds, dsActualIdx, `D${di + 1}`, true, null));
      });
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
      {showSwap && (
        <SwapExerciseModal
          ex={ex}
          sessionType={sessionType || 'Custom'}
          onSwap={(newName) => { onSwapExercise(ex.id, newName); setShowSwap(false); }}
          onClose={() => setShowSwap(false)}
        />
      )}
      {divider && <div className="border-t border-border/50" />}
      {/* Hidden file input for photo */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoChange}
      />
      <div
        className="w-full flex items-center justify-between px-4 py-3 min-h-11"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Exercise thumbnail */}
          {ex.image_url ? (
            <button
              onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}
              className="w-10 h-10 rounded-xl overflow-hidden border border-border shrink-0"
            >
              <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}
              className="w-10 h-10 rounded-xl border border-dashed border-border flex items-center justify-center shrink-0 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              title="Add photo"
            >
              {uploadingImage ? (
                <div className="w-3 h-3 border-2 border-muted border-t-primary rounded-full animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
          )}
          <div className="min-w-0">
            <p className="font-heading font-semibold text-sm text-left">{ex.name}</p>
            <p className="text-muted-foreground text-xs">
              {isCardio
                ? `${ex.cardio_metric || 'distance'} · target: ${ex.target_reps || '—'} ${cardioUnit}`
                : `${ex.target_sets} × ${ex.target_reps} · ${ex.rest_seconds}s rest`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Swap exercise button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowSwap(true); }}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            title="Swap exercise"
          >
            <ArrowLeftRight size={13} />
          </button>
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

        </div>
      </div>
      {isOpen && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <ExerciseNotes ex={ex} onUpdateSet={onUpdateSet} onNotesChange={onNotesChange} />
          <ExerciseHistory exerciseName={ex.name} userId={userId} weightUnit={weightUnit} toDisplay={toDisplay} />

          {!isCardio && (
            <RepRangePicker
              exId={ex.id}
              repMode={ex.rep_mode}
              targetReps={ex.target_reps}
              onRepRangeChange={onRepRangeChange}
              onRepModeChange={onRepModeChange}
            />
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
  const [restTimer, setRestTimer] = useState(null);
  const [timerMinimized, setTimerMinimized] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [persistedGameState, setPersistedGameState] = useState(null);
  const [exerciseOrder, setExerciseOrder] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [localExercises, setLocalExercises] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [pressingHandle, setPressingHandle] = useState(false);
  const [summaryImageUrl, setSummaryImageUrl] = useState(null);
  const [showImportDay, setShowImportDay] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const summaryRef = useRef(null);
  const startTime = useRef(new Date());
  const timerRef = useRef(null);
  const startingWorkout = useRef(false);
  const streakIncreased = useRef(false);

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

  // Must be declared before the prevLogs query which references it
  const activeExercises = localExercises ?? exercises;

  const { data: prevLogs = [] } = useQuery({
    queryKey: ['prevSetLogs', user?.email, activeExercises.map((e) => e.name).join(',')],
    queryFn: async () => {
      if (!activeExercises.length) return [];
      // For each exercise in the current workout, fetch its most recent completed sets
      // across ALL workout days (not restricted to this split_day_id)
      const perExercise = await Promise.all(
        activeExercises.map((ex) =>
          base44.entities.SetLog.filter(
            { user_id: user.email, exercise_name: ex.name, completed: true },
            '-created_date',
            20
          )
        )
      );
      return perExercise.flat();
    },
    enabled: !!user && activeExercises.length > 0,
    staleTime: 0,
  });

  const { data: allTimeLogs = [] } = useQuery({
    queryKey: ['allTimeLogs', user?.email],
    queryFn: () => base44.entities.SetLog.filter({ user_id: user.email, completed: true }, '-weight_kg', 500),
    enabled: !!user,
    staleTime: 60000,
  });

  const allTimeBests = useMemo(() => {
    const bests = {};
    allTimeLogs.forEach((log) => {
      if (!log.exercise_name) return;
      const key = log.exercise_name.toLowerCase();
      const w = Number(log.weight_kg) || 0;
      const r = Number(log.reps) || 0;
      if (!bests[key]) {
        bests[key] = { maxWeight: w, maxRepsAtMaxWeight: r };
      } else {
        if (w > bests[key].maxWeight) {
          bests[key] = { maxWeight: w, maxRepsAtMaxWeight: r };
        } else if (w === bests[key].maxWeight && r > bests[key].maxRepsAtMaxWeight) {
          bests[key].maxRepsAtMaxWeight = r;
        }
      }
    });
    return bests;
  }, [allTimeLogs]);

  // Must be defined before useEffects that use it
  const buildSetsForExerciseEarly = (ex, count) => {
    const dropCount = ex.dropset_count || 0;
    const result = [];
    let setNum = 1;
    for (let i = 0; i < count; i++) {
      result.push({ set_number: setNum++, reps: '', weight_kg: '', weight_display: '', rpe: '', set_type: 'normal', completed: false });
      for (let d = 0; d < dropCount; d++) {
        result.push({ set_number: setNum++, reps: '', weight_kg: '', weight_display: '', rpe: '', set_type: 'dropset', completed: false });
      }
    }
    return result;
  };

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
        initial[ex.id] = buildSetsForExerciseEarly(ex, ex.target_sets || 3);
      });
      setSets(initial);
      setExpanded(exp);
    }
  }, [exercises]);

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
      [ex.id]: buildSetsForExerciseEarly(ex, ex.target_sets || 3),
    }));
    setExpanded((prev) => ({ ...prev, [ex.id]: true }));
  };

  const startWorkout = async () => {
    if (!workoutLog && user && day && !startingWorkout.current) {
      startingWorkout.current = true;
      try {
        const log = await base44.entities.WorkoutLog.create({
          user_id: user.email,
          split_day_id: dayId,
          split_day_name: `${day.day_of_week} — ${day.session_type}`,
          started_at: startTime.current.toISOString(),
          is_rest_day: false,
        });
        setWorkoutLog(log);
      } catch (err) {
        toast.error('Failed to start workout. Please try again.');
      } finally {
        startingWorkout.current = false;
      }
    }
  };

  useEffect(() => {
    if (user && day) startWorkout();
  }, [user, day]);

  const getPrevSets = (exName) => {
    const prev = prevLogs.filter((s) => s.exercise_name === exName);
    if (!prev.length) return [];
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

  const uncompleteSet = async (ex, setIdx) => {
    const set = sets[ex.id][setIdx];
    updateSet(ex.id, setIdx, { completed: false });
    if (workoutLog) {
      const logs = await base44.entities.SetLog.filter({
        workout_log_id: workoutLog.id,
        exercise_name: ex.name,
        set_number: set.set_number,
        completed: true,
      });
      await Promise.all(logs.map((l) => base44.entities.SetLog.delete(l.id)));
    }
  };

  const completeSet = async (ex, setIdx, rpeOverride) => {
    const set = sets[ex.id][setIdx];
    updateSet(ex.id, setIdx, { completed: true });

    // Build notification: PR takes priority over rep feedback
    let newNotification = null;

    // PR detection (strength only)
    if (ex.exercise_type !== 'cardio' && set.reps && set.weight_kg) {
      const key = ex.name.toLowerCase();
      const best = allTimeBests[key];
      const w = Number(set.weight_kg);
      const r = Number(set.reps);
      let isPR = false;
      let prMsg = '';
      if (!best) {
        isPR = true;
        prMsg = `${ex.name}: ${w}kg × ${r} reps — first time tracked!`;
      } else if (w > best.maxWeight) {
        isPR = true;
        prMsg = `${ex.name}: new max weight ${w}kg (prev: ${best.maxWeight}kg)`;
      } else if (w === best.maxWeight && r > best.maxRepsAtMaxWeight) {
        isPR = true;
        prMsg = `${ex.name}: ${r} reps at ${w}kg (prev best: ${best.maxRepsAtMaxWeight} reps)`;
      }
      if (isPR) {
        newNotification = { type: 'pr', message: prMsg };
      }
    }

    // Rep range feedback (strength only) — only if no PR
    if (!newNotification && ex.exercise_type !== 'cardio' && set.reps) {
      const range = parseRepRange(ex.target_reps);
      const completedNormalSets = (sets[ex.id] || []).filter((s, i) => i <= setIdx && s.set_type !== 'dropset').length;
      const totalNormalSets = (sets[ex.id] || []).filter((s) => s.set_type !== 'dropset').length;
      const feedback = getRepFeedback(set.reps, range, completedNormalSets, totalNormalSets);
      if (feedback) newNotification = { type: 'rep_feedback', ...feedback };
    }

    setNotification(newNotification);

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

  const notesTimers = useRef({});
  const updateExerciseNotes = (exId, notes) => {
    const update = (list) => list.map((e) => e.id === exId ? { ...e, notes } : e);
    setLocalExercises((prev) => update(prev ?? exercises));
    // Debounce: save to DB 1 second after the user stops typing
    if (notesTimers.current[exId]) clearTimeout(notesTimers.current[exId]);
    notesTimers.current[exId] = setTimeout(() => {
      base44.entities.SplitExercise.update(exId, { notes }).catch(() => {
        toast.error('Could not save note. Please try again.');
      });
    }, 1000);
  };

  const updateRepRange = (exId, target_reps) => {
    const update = (list) => list.map((e) => e.id === exId ? { ...e, target_reps } : e);
    setLocalExercises((prev) => update(prev ?? exercises));
  };

  const updateRepMode = (exId, rep_mode) => {
    const update = (list) => list.map((e) => e.id === exId ? { ...e, rep_mode, target_reps: '' } : e);
    setLocalExercises((prev) => update(prev ?? exercises));
  };

  const deleteSet = (exId, setIdx) => {
    setSets((prev) => {
      const updated = (prev[exId] || [])
        .filter((_, i) => i !== setIdx)
        .map((s, i) => ({ ...s, set_number: i + 1 }));
      return { ...prev, [exId]: updated };
    });
  };

  const swapExercise = (exId, newName) => {
    setLocalExercises((prev) =>
      (prev ?? exercises).map((e) => e.id === exId ? { ...e, name: newName } : e)
    );
  };

  const updateExerciseImage = (exId, image_url) => {
    setLocalExercises((prev) =>
      (prev ?? exercises).map((e) => e.id === exId ? { ...e, image_url } : e)
    );
  };

  const handleDragEnd = (result) => {
    setPressingHandle(false); // always restore on release
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
    const ex = activeExercises.find((e) => e.id === exId);
    const dropCount = ex?.dropset_count || 0;
    setSets((prev) => {
      const current = prev[exId] || [];
      const normalCount = current.filter((s) => s.set_type !== 'dropset').length;
      const newSetNum = current.length + 1;
      const toAdd = [
        { set_number: newSetNum, reps: '', weight_kg: '', weight_display: '', rpe: '', set_type: 'normal', completed: false },
      ];
      for (let d = 0; d < dropCount; d++) {
        toAdd.push({ set_number: newSetNum + d + 1, reps: '', weight_kg: '', weight_display: '', rpe: '', set_type: 'dropset', completed: false });
      }
      return { ...prev, [exId]: [...current, ...toAdd] };
    });
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

      streakIncreased.current = false;

      // Only count personal streak for real (non-Rest) workout days
      if (!day || day.session_type === 'Rest') {
        setCurrentStreak(0);
        return;
      }

      if (user) {
        const members = await base44.entities.GroupMember.filter({ user_id: user.email });
        const member = members[0];
        const prevStreak = member?.streak || 0;

        // Fetch all past completed workout logs for this user
        const allLogs = await base44.entities.WorkoutLog.filter(
          { user_id: user.email },
          '-created_date',
          100
        );
        const today = startOfDay(new Date());

        // Use finished_at date (not created_date) so midnight workouts count on the right day
        const finishDateOf = (l) => startOfDay(parseLocalDate((l.finished_at || l.created_date).slice(0, 10)));

        // Check if already logged a finished workout today
        const alreadyLoggedToday = allLogs.some((l) => {
          if (l.id === workoutLog?.id || l.is_rest_day) return false;
          return l.finished_at && differenceInCalendarDays(today, finishDateOf(l)) === 0;
        });

        if (alreadyLoggedToday) {
          setCurrentStreak(prevStreak);
          if (member) await base44.entities.GroupMember.update(member.id, { streak: prevStreak });
          return;
        }

        const pastLogs = allLogs
          .filter((l) => l.id !== workoutLog?.id && l.finished_at && !l.is_rest_day)
          .sort((a, b) => new Date(b.finished_at) - new Date(a.finished_at));

        const lastLog = pastLogs[0];

        if (!lastLog) {
          const newStreak = 1;
          streakIncreased.current = true;
          setCurrentStreak(newStreak);
          if (member) await base44.entities.GroupMember.update(member.id, { streak: newStreak });
        } else {
          const lastDay = finishDateOf(lastLog);
          const daysSinceLast = differenceInCalendarDays(today, lastDay);

          if (daysSinceLast === 0) {
            setCurrentStreak(prevStreak);
            if (member) await base44.entities.GroupMember.update(member.id, { streak: prevStreak });
          } else if (daysSinceLast === 1) {
            const newStreak = prevStreak + 1;
            streakIncreased.current = true;
            setCurrentStreak(newStreak);
            if (member) await base44.entities.GroupMember.update(member.id, { streak: newStreak });
          } else {
            // Gap > 1 day — check each gap day to see if it was a scheduled Rest day
            // or simply not in the split at all (treat as a free day, don't break streak)
            const allSplitDays = await base44.entities.SplitDay.filter({ user_id: user.email });
            const loggedDays = new Set(
              allLogs
                .filter((l) => l.finished_at && !l.is_rest_day)
                .map((l) => finishDateOf(l).getTime())
            );
            let streakBroken = false;
            for (let d = 1; d < daysSinceLast; d++) {
              const gapDate = startOfDay(subDays(today, daysSinceLast - d));
              if (loggedDays.has(gapDate.getTime())) continue; // they trained that day
              const dayName = format(gapDate, 'EEEE');
              // Get ALL split days for this day of week (user may have multiple splits)
              const splitDaysForDay = allSplitDays.filter((sd) => sd.day_of_week === dayName);
              // If the day isn't configured in ANY split, treat it as a free day (no break)
              if (splitDaysForDay.length === 0) continue;
              // Only break if EVERY split has this day as a training day (not Rest)
              const hasAnyRest = splitDaysForDay.some((sd) => !sd.session_type || sd.session_type === 'Rest');
              if (!hasAnyRest) { streakBroken = true; break; }
            }
            // Always increment by 1 (you trained once today regardless of gap size)
            const newStreak = streakBroken ? 1 : prevStreak + 1;
            streakIncreased.current = newStreak > prevStreak;
            setCurrentStreak(newStreak);
            if (member) await base44.entities.GroupMember.update(member.id, { streak: newStreak });
          }
        }

        // ── Group streak logic ──────────────────────────────────────────
        // Increments only when ALL members have completed their planned day
        // (finished workout OR planned rest day). Stored on the Group entity.
        const todayStr = format(today, 'yyyy-MM-dd');
        const todayDayName = format(today, 'EEEE');
        const userGroupMemberships = await base44.entities.GroupMember.filter({ user_id: user.email });

        for (const myMembership of userGroupMemberships) {
          try {
            const groupArr = await base44.entities.Group.filter({ id: myMembership.group_id });
            const groupData = groupArr[0];
            if (!groupData) continue;
            if (groupData.group_streak_date === todayStr) continue; // Already updated today

            const allGroupMembers = await base44.entities.GroupMember.filter({ group_id: myMembership.group_id });

            const memberDone = await Promise.all(
              allGroupMembers.map(async (m) => {
                const mLogs = await base44.entities.WorkoutLog.filter({ user_id: m.user_id }, '-created_date', 20);
                const finishedToday = mLogs.some(
                  (l) => l.finished_at && (l.created_date || '').slice(0, 10) === todayStr
                );
                if (finishedToday) return true;
                const mSplitDays = await base44.entities.SplitDay.filter({ user_id: m.user_id });
                return mSplitDays.some((sd) => sd.day_of_week === todayDayName && sd.session_type === 'Rest');
              })
            );

            const difficulty = groupData.difficulty || 'medium';
            const prevGroupStreak = groupData.group_streak || 0;
            const yesterday = format(subDays(today, 1), 'yyyy-MM-dd');
            const streakContinues = groupData.group_streak_date === yesterday || groupData.group_streak_date === todayStr;

            let newGroupStreak;

            if (difficulty === 'easy') {
              // Easy: I worked out → streak grows. Never resets — just keeps climbing.
              // (We only reach this code when the current user finishes a workout)
              newGroupStreak = streakContinues ? prevGroupStreak + 1 : 1;

            } else if (difficulty === 'medium') {
              // Medium: At least ONE member finished a real workout today → streak continues.
              // Everyone stopped → streak resets.
              const anyoneFinished = memberDone.some(Boolean);
              if (!anyoneFinished) continue; // nobody done yet, skip update
              newGroupStreak = streakContinues ? prevGroupStreak + 1 : 1;

            } else {
              // Hard: ALL members must complete their day (workout OR rest day).
              // A single miss → reset to 0.
              if (!memberDone.every(Boolean)) continue; // not everyone done yet
              newGroupStreak = streakContinues ? prevGroupStreak + 1 : 1;
            }

            await base44.entities.Group.update(groupData.id, {
              group_streak: newGroupStreak,
              group_streak_date: todayStr,
            });
          } catch (_e) {
            // Non-fatal
          }
        }
        // ── End group streak logic ───────────────────────────────────────
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutLogs'] });
      // If streak increased, show celebration first
      if (streakIncreased.current) {
        setShowStreakCelebration(true);
      } else {
        setShowSummary(true);
      }
    },
    onError: () => {
      toast.error('Workout saved locally but could not sync. Check your connection.');
      setShowSummary(true);
    },
  });

  const handleImportDay = (parsed) => {
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
    <div style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}>
      {/* Header — padded to sit below the iOS status bar */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 pb-3" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setShowDiscardConfirm(true)} className="text-muted-foreground">
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
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }}
          />
        </div>
      </div>

      {isReordering && (
        <div className="mx-4 mt-3 px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl text-xs text-primary font-semibold text-center">
          Drag to reorder · release to confirm
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd} onDragStart={() => { setIsReordering(true); }}>
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
                        <div className="flex items-center">
                          {/* Single div: dnd handle props + our press/haptic handlers chained together */}
                          <div
                            {...drag.dragHandleProps}
                            className="px-3 py-4 text-muted-foreground touch-none flex items-center self-stretch cursor-grab active:cursor-grabbing select-none"
                            onMouseDown={(e) => {
                              drag.dragHandleProps?.onMouseDown?.(e);
                              setPressingHandle(true);
                            }}
                            onTouchStart={(e) => {
                              drag.dragHandleProps?.onTouchStart?.(e);
                              setPressingHandle(true);
                              try { navigator.vibrate?.(40); } catch (_) {}
                            }}
                            onTouchEnd={() => setPressingHandle(false)}
                            onMouseUp={() => setPressingHandle(false)}
                            onTouchCancel={() => setPressingHandle(false)}
                          >
                            <GripVertical size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <ExerciseCard
                              ex={ex}
                              exSets={sets[ex.id] || []}
                              isOpen={!pressingHandle && !isReordering && !!expanded[ex.id]}
                              prevSets={getPrevSets(ex.name)}
                              onToggle={() => !isReordering && setExpanded((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
                              onUpdateSet={updateSet}
                              onCompleteSet={completeSet}
                              onUncompleteSet={uncompleteSet}
                              onAddSet={addSet}
                              onNotesChange={updateExerciseNotes}
                              onRepRangeChange={updateRepRange}
                              onRepModeChange={updateRepMode}
                              onDeleteSet={deleteSet}
                              onSwapExercise={swapExercise}
                              onImageChange={updateExerciseImage}
                              sessionType={day?.session_type}
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

      {showImportDay && (
        <ImportWorkoutModal
          mode="day"
          onImportDay={handleImportDay}
          onClose={() => setShowImportDay(false)}
        />
      )}

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
            // If dropset_count changed, rebuild sets for this exercise preserving normal set count
            if ('dropset_count' in updates) {
              const ex = activeExercises.find((e) => e.id === exId);
              if (ex) {
                const newEx = { ...ex, ...updates };
                setSets((prev) => {
                  const current = prev[exId] || [];
                  const normalCount = current.filter((s) => s.set_type !== 'dropset').length || ex.target_sets || 3;
                  return { ...prev, [exId]: buildSetsForExerciseEarly(newEx, normalCount) };
                });
              }
            }
          }}
        />
      )}

      {/* Single rest timer — notification shown inside it */}
      {restTimer && (
        <RestTimer
          seconds={restTimer.seconds}
          total={restTimer.total}
          onDone={() => { setRestTimer(null); setNotification(null); }}
          onSkip={() => { setRestTimer(null); setNotification(null); }}
          isMinimized={timerMinimized}
          onToggleMinimize={() => setTimerMinimized(!timerMinimized)}
          gameState={persistedGameState}
          onGameStateChange={setPersistedGameState}
          notification={notification}
        />
      )}

      {showStreakCelebration && (
        <StreakCelebration
          newStreak={currentStreak}
          onDone={() => { setShowStreakCelebration(false); setShowSummary(true); }}
        />
      )}

      {showSummary && (
        <WorkoutSummaryScreen
          summaryRef={summaryRef}
          sets={sets}
          exercises={activeExercises}
          streak={currentStreak}
          durationMinutes={Math.round(elapsed / 60)}
          onSkip={() => navigate('/')}
          weightSuggestions={activeExercises
            .map((ex) => getWeightSuggestion(ex.name, ex.target_reps, sets[ex.id] || []))
            .filter(Boolean)}
          onContinue={async () => {
            if (summaryRef.current) {
              try {
                const canvas = await html2canvas(summaryRef.current, { backgroundColor: null, scale: 2 });
                const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
                const file = new File([blob], 'workout-summary.png', { type: 'image/png' });
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                setSummaryImageUrl(file_url);
              } catch (e) {}
            }
            setShowSummary(false);
            setShowPostModal(true);
          }}
        />
      )}

      {showPostModal && workoutLog && (
        <PostWorkoutModal
          workoutLog={workoutLog}
          user={user}
          summaryImageUrl={summaryImageUrl}
          onClose={() => navigate('/')}
        />
      )}

      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-card border-t border-border rounded-t-3xl p-6 flex flex-col gap-4" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <div className="text-center">
              <p className="font-heading font-bold text-lg">Discard Workout?</p>
              <p className="text-sm text-muted-foreground mt-1">All progress will be lost and cannot be recovered.</p>
            </div>
            <Button
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-heading font-bold py-5"
              onClick={() => {
                if (workoutLog) base44.entities.WorkoutLog.delete(workoutLog.id).catch(() => {});
                navigate('/');
              }}
            >
              Discard Workout
            </Button>
            <Button
              variant="outline"
              className="w-full font-heading font-bold py-5"
              onClick={() => setShowDiscardConfirm(false)}
            >
              Keep Going
            </Button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 flex gap-2 px-4 pt-3 bg-background/90 backdrop-blur-md border-t border-border" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <Button
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10 font-heading font-bold py-5 px-4 touch-target-44 shrink-0"
          onClick={() => setShowDiscardConfirm(true)}
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