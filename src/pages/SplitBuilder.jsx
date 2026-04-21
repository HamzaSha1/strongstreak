import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Plus, Trash2, ImagePlus, ScanLine, Share2, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DAYS } from '@/components/splitbuilder/exerciseData';
import { useExerciseLibrary } from '@/hooks/useExerciseLibrary';
import DayCard from '@/components/splitbuilder/DayCard';
import { cn } from '@/lib/utils';
import ImportSplitModal from '@/components/splitbuilder/ImportSplitModal';
import ImportWorkoutModal from '@/components/import/ImportWorkoutModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';

const initialDays = () =>
  DAYS.map((d, i) => ({
    day: d,
    session_type: '',
    exercises: [],
    open: false,
    order_index: i,
  }));

export default function SplitBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [splits, setSplits] = useState([{ name: 'My Split', days: initialDays() }]);
  const [activeTab, setActiveTab] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [pendingNewSplit, setPendingNewSplit] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('newSplit') === '1'
  );
  const [showImport, setShowImport] = useState(false);
  const [showAIImport, setShowAIImport] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const { ensureExercise } = useExerciseLibrary();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: existingSplitDays = [], isSuccess: daysLoaded } = useQuery({
    queryKey: ['splitDays', user?.email],
    queryFn: () => base44.entities.SplitDay.filter({ user_id: user.email }, 'order_index'),
    enabled: !!user,
  });

  const { data: existingExercises = [], isSuccess: exercisesLoaded } = useQuery({
    queryKey: ['splitExercises', user?.email],
    queryFn: () => base44.entities.SplitExercise.filter({ user_id: user.email }),
    enabled: !!user,
  });

  useEffect(() => {
    if (initialized) return;
    if (!user) return;
    // Wait until BOTH queries have actually resolved (not just returned empty defaults)
    if (!daysLoaded || !exercisesLoaded) return;

    const grouped = {};
    for (const d of existingSplitDays) {
      if (!grouped[d.split_name]) grouped[d.split_name] = [];
      grouped[d.split_name].push(d);
    }

    let loadedSplits;
    if (Object.keys(grouped).length === 0) {
      loadedSplits = [{ name: 'My Split', days: initialDays() }];
    } else {
      loadedSplits = Object.entries(grouped).map(([name, dbDays]) => ({
        name,
        days: DAYS.map((dayName, i) => {
          const dbDay = dbDays.find((d) => d.day_of_week === dayName);
          if (!dbDay) return { day: dayName, session_type: '', exercises: [], open: false, order_index: i };
          const exs = existingExercises
            .filter((e) => e.split_day_id === dbDay.id)
            .sort((a, b) => a.order_index - b.order_index)
            .map((e) => ({ ...e }));
          return {
            id: dbDay.id,
            day: dayName,
            session_type: dbDay.session_type || '',
            custom_name: dbDay.custom_name || '',
            exercises: exs,
            open: false,
            order_index: dbDay.order_index ?? i,
          };
        }),
      }));
    }

    if (pendingNewSplit) {
      const newSplit = { name: `Split ${loadedSplits.length + 1}`, days: initialDays() };
      setSplits([...loadedSplits, newSplit]);
      setActiveTab(loadedSplits.length);
      setPendingNewSplit(false);
    } else {
      setSplits(loadedSplits);
    }
    setInitialized(true);
  }, [existingSplitDays, existingExercises, initialized, user, daysLoaded, exercisesLoaded]);

  const activeSplit = splits[activeTab] || splits[0];

  const [isDirty, setIsDirty] = useState(false);

  // Mark dirty whenever splits change after initialization
  useEffect(() => {
    if (initialized) setIsDirty(true);
  }, [splits]);
  // Don't mark dirty on first load
  useEffect(() => {
    if (initialized) setIsDirty(false);
  }, [initialized]);

  const handleBack = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Discard them and go back?');
      if (!confirmed) return;
    }
    navigate('/');
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Fetch existing records upfront so we know what to delete at the end
      const existingDays = await base44.entities.SplitDay.filter({ user_id: user.email });
      const existingExs = await base44.entities.SplitExercise.filter({ user_id: user.email });

      // Track which existing IDs we've touched — anything NOT in these sets gets deleted
      const keptDayIds = new Set();
      const keptExIds = new Set();

      for (const split of splits) {
        for (const d of split.days) {
          const effectiveType = d.session_type || 'Rest';
          const dayPayload = {
            user_id: user.email,
            split_name: split.name,
            day_of_week: d.day,
            session_type: effectiveType,
            custom_name: d.custom_name || '',
            order_index: d.order_index,
          };

          let savedDayId;
          if (d.id) {
            // Day already exists in DB — update it in place (handles renames safely)
            await base44.entities.SplitDay.update(d.id, dayPayload);
            savedDayId = d.id;
            keptDayIds.add(d.id);
          } else {
            // Brand new day — create it
            const saved = await base44.entities.SplitDay.create(dayPayload);
            savedDayId = saved.id;
          }

          // Handle exercises for this day
          for (let i = 0; i < d.exercises.length; i++) {
            const ex = d.exercises[i];
            await ensureExercise({
              display_name: ex.name,
              exercise_type: ex.exercise_type || 'strength',
              muscle_group: ex.muscle || '',
            });
            const exPayload = {
              split_day_id: savedDayId,
              user_id: user.email,
              name: ex.name,
              exercise_type: ex.exercise_type || 'strength',
              target_sets: ex.target_sets,
              target_reps: ex.target_reps,
              rpe: ex.rpe,
              rest_seconds: ex.rest_seconds,
              cardio_metric: ex.cardio_metric,
              image_url: ex.image_url,
              order_index: i,
              notes: ex.notes || '',
              superset_group: ex.superset_group || '',
              dropset_count: ex.dropset_count || 0,
            };
            // AI-imported exercises get temp string IDs like "ai-..." — treat those as new
            const hasRealId = ex.id && typeof ex.id === 'string' && !ex.id.startsWith('ai-');
            if (hasRealId) {
              await base44.entities.SplitExercise.update(ex.id, exPayload);
              keptExIds.add(ex.id);
            } else {
              await base44.entities.SplitExercise.create(exPayload);
            }
          }
        }
      }

      // Only delete records the user explicitly removed — never touch records we updated
      for (const e of existingExs) {
        if (!keptExIds.has(e.id)) await base44.entities.SplitExercise.delete(e.id);
      }
      for (const d of existingDays) {
        if (!keptDayIds.has(d.id)) await base44.entities.SplitDay.delete(d.id);
      }
    },
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['splitDays'] });
      queryClient.invalidateQueries({ queryKey: ['splitExercises'] });
      toast.success('All splits saved!');
      navigate('/');
    },
    onError: () => {
      toast.error('Save failed — please check your connection and try again.');
    },
  });

  const updateDay = (dayIdx, patch) => {
    setSplits((prev) =>
      prev.map((s, si) =>
        si === activeTab
          ? { ...s, days: s.days.map((d, di) => (di === dayIdx ? { ...d, ...patch } : d)) }
          : s
      )
    );
  };

  const addSplit = () => {
    const newSplit = { name: `Split ${splits.length + 1}`, days: initialDays() };
    setSplits((prev) => [...prev, newSplit]);
    setActiveTab(splits.length);
  };

  const deleteSplit = (idx) => {
    if (splits.length === 1) return;
    setSplits((prev) => prev.filter((_, i) => i !== idx));
    setActiveTab((prev) => Math.max(0, prev >= idx ? prev - 1 : prev));
  };

  const renameSplit = (name) => {
    setSplits((prev) => prev.map((s, i) => (i === activeTab ? { ...s, name } : s)));
  };

  const handleImport = ({ name, days }) => {
    const newSplit = { name, days };
    setSplits((prev) => [...prev, newSplit]);
    setActiveTab(splits.length);
    setShowImport(false);
    toast.success(`"${name}" imported successfully!`);
  };

  const handleAIImportSplit = (parsed) => {
    const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const VALID_SESSIONS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'Rest', 'Custom'];
    const days = initialDays().map((blank) => {
      const match = (parsed.days || []).find(
        (d) => VALID_DAYS.some((vd) => d.day_name?.toLowerCase().includes(vd.toLowerCase()) && vd === blank.day)
      );
      if (!match) return blank;
      return {
        ...blank,
        session_type: VALID_SESSIONS.includes(match.session_type) ? match.session_type : 'Custom',
        exercises: (match.exercises || []).map((ex, i) => ({
          name: ex.exercise_name,
          exercise_type: 'strength',
          target_sets: ex.target_sets || 3,
          target_reps: ex.target_reps || '8-12',
          rpe: ex.rpe || null,
          rest_seconds: 90,
          order_index: i,
        })),
      };
    });
    const newSplit = { name: parsed.split_name || 'AI Import', days };
    setSplits((prev) => [...prev, newSplit]);
    setActiveTab(splits.length);
    toast.success('Split imported from screenshot!');
  };

  const handleShareSplit = async () => {
    const exportData = {
      split_name: activeSplit.name,
      days: activeSplit.days.map((d, i) => ({
        day_of_week: d.day,
        session_type: d.session_type || 'Rest',
        order_index: d.order_index ?? i,
        exercises: (d.exercises || []).map((ex, ei) => ({
          name: ex.name,
          exercise_type: ex.exercise_type || 'strength',
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          rpe: ex.rpe,
          rest_seconds: ex.rest_seconds,
          cardio_metric: ex.cardio_metric,
          image_url: ex.image_url,
          order_index: ex.order_index ?? ei,
          notes: ex.notes || '',
          superset_group: ex.superset_group || '',
          dropset_count: ex.dropset_count || 0,
        })),
      })),
    };

    const fileName = `${activeSplit.name.replace(/\s+/g, '_')}.json`;
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    // Use native share sheet on iOS/Android (shows AirDrop, Messages, Files, etc.)
    if (navigator.share) {
      try {
        const file = new File([blob], fileName, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: activeSplit.name });
          return;
        }
        // Share text fallback if file sharing not supported
        await navigator.share({ title: activeSplit.name, text: json });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled — no toast
      }
    }

    // Desktop fallback: trigger a file download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`"${activeSplit.name}" exported!`);
  };

  const handleDaysReorder = (result) => {
    if (!result.destination) return;
    const srcIdx = result.source.index;
    const dstIdx = result.destination.index;
    if (srcIdx === dstIdx) return;
    // Swap only session_type and exercises between the two day slots
    setSplits((prev) =>
      prev.map((s, si) => {
        if (si !== activeTab) return s;
        const days = s.days.map((d) => ({ ...d }));
        // Move the session payload (session_type + exercises) from srcIdx to dstIdx
        const sessions = days.map((d) => ({ session_type: d.session_type, custom_name: d.custom_name, exercises: d.exercises }));
        const [moved] = sessions.splice(srcIdx, 1);
        sessions.splice(dstIdx, 0, moved);
        return {
          ...s,
          days: days.map((d, i) => ({ ...d, session_type: sessions[i].session_type, custom_name: sessions[i].custom_name, exercises: sessions[i].exercises })),
        };
      })
    );
  };

  const trainingDays = activeSplit.days.filter((d) => d.session_type && d.session_type !== 'Rest').length;
  const restDays = activeSplit.days.filter((d) => d.session_type === 'Rest' || !d.session_type).length;

  return (
    <div className="pb-36 min-h-screen bg-background">
      {showImport && (
        <ImportSplitModal onImport={handleImport} onClose={() => setShowImport(false)} />
      )}
      {showAIImport && (
        <ImportWorkoutModal
          mode="split"
          onImportSplit={handleAIImportSplit}
          onClose={() => setShowAIImport(false)}
        />
      )}

      {/* Header — paddingTop baked in so it always covers status bar even when sticky */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">
          <button onClick={handleBack} className="text-muted-foreground shrink-0">
            <ArrowLeft size={20} />
          </button>
          <Input
            value={activeSplit.name}
            onChange={(e) => renameSplit(e.target.value)}
            className="flex-1 bg-transparent border-none text-base font-heading font-bold p-0 h-auto focus-visible:ring-0"
            placeholder="Name this split"
          />
        </div>
        <div className="flex items-center gap-1.5 px-4 pb-2 overflow-x-auto">
          <button
            onClick={() => setIsReordering((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border shrink-0',
              isReordering
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-secondary-foreground border-transparent'
            )}
          >
            <ArrowUpDown size={14} />
            Reorder
          </button>
          <button
            onClick={handleShareSplit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground shrink-0"
          >
            <Share2 size={14} />
            Share
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground shrink-0"
          >
            <ImagePlus size={14} />
            Import
          </button>
          <button
            onClick={() => setShowAIImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-primary/10 text-primary border border-primary/30 shrink-0"
          >
            <ScanLine size={14} />
            AI Scan
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !initialized}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground shrink-0 disabled:opacity-40"
          >
            {saveMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : !initialized ? (
              <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Save
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto">
          {splits.map((s, i) => (
            <div key={i} className="relative flex-shrink-0">
              <button
                onClick={() => setActiveTab(i)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                  i === activeTab
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                {s.name}
              </button>
              {splits.length > 1 && i === activeTab && (
                <button
                  onClick={() => deleteSplit(i)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
                >
                  <Trash2 size={9} className="text-white" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addSplit}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Reorder hint */}
      {isReordering && (
        <div className="mx-4 mt-4 px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl text-xs text-primary font-semibold text-center">
          Drag the handles to move sessions between days
        </div>
      )}

      {/* Day cards */}
      <DragDropContext onDragEnd={handleDaysReorder}>
        <Droppable droppableId="split-days">
          {(provided) => (
            <div
              className="px-4 pt-4 flex flex-col gap-3"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {activeSplit.days.map((day, i) => (
                <Draggable key={`${activeTab}-${day.day}`} draggableId={`${activeTab}-${day.day}`} index={i} isDragDisabled={!isReordering}>
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={cn(
                        'flex items-center gap-2 rounded-2xl transition-shadow',
                        snapshot.isDragging && 'shadow-2xl'
                      )}
                    >
                      {isReordering && (
                        <div
                          {...drag.dragHandleProps}
                          className="pl-1 pr-1 py-4 text-muted-foreground touch-none cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical size={18} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <DayCard
                          day={day}
                          dayIndex={i}
                          onUpdate={(patch) => updateDay(i, patch)}
                        />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Summary bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border px-4 py-3 flex justify-around text-center text-xs z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
        <div>
          <p className="text-primary font-bold text-xl font-heading">{trainingDays}</p>
          <p className="text-muted-foreground">Training</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="font-bold text-xl font-heading">{restDays}</p>
          <p className="text-muted-foreground">Rest</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="font-bold text-xl font-heading text-muted-foreground">{7 - trainingDays - restDays}</p>
          <p className="text-muted-foreground">→ Rest</p>
        </div>
      </div>
    </div>
  );
}