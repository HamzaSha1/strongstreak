import { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, Plus, Edit, Play, BedDouble, Dumbbell, Upload, Trash2 } from 'lucide-react';
import ImportSplitJsonModal from '@/components/splitbuilder/ImportSplitJsonModal';
import StreakCalendar from '@/components/workout/StreakCalendar';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const SESSION_COLORS = {
  Push:        'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Pull:        'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Legs:        'bg-green-500/20 text-green-400 border-green-500/30',
  Upper:       'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Lower:       'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Full Body': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Cardio:      'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Rest:        'bg-muted text-muted-foreground border-border',
  Custom:      'bg-primary/20 text-primary border-primary/30',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Workouts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showImportSplit, setShowImportSplit] = useState(false);
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [swipeOffsets, setSwipeOffsets] = useState({});
  const swipeTouchStart = useRef({});

  const handleSwipeTouchStart = (id, e) => {
    swipeTouchStart.current[id] = { x: e.touches[0].clientX, y: e.touches[0].clientY, base: swipeOffsets[id] || 0 };
  };
  const handleSwipeTouchMove = (id, e) => {
    const s = swipeTouchStart.current[id];
    if (!s) return;
    const dx = e.touches[0].clientX - s.x;
    const dy = e.touches[0].clientY - s.y;
    if (Math.abs(dx) > Math.abs(dy) + 5) {
      setSwipeOffsets((prev) => ({ ...prev, [id]: Math.min(Math.max(s.base + dx, -80), 0) }));
    }
  };
  const handleSwipeTouchEnd = (id) => {
    const offset = swipeOffsets[id] || 0;
    setSwipeOffsets((prev) => ({ ...prev, [id]: offset < -40 ? -72 : 0 }));
    delete swipeTouchStart.current[id];
  };

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: splitDays = [] } = useQuery({
    queryKey: ['splitDays', user?.id],
    queryFn: () => base44.entities.SplitDay.filter({ user_id: user?.email }, 'order_index'),
    enabled: !!user,
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['splitExercises', user?.id],
    queryFn: () => base44.entities.SplitExercise.filter({ user_id: user?.email }),
    enabled: !!user,
  });

  const deleteSplitMutation = useMutation({
    mutationFn: async (splitName) => {
      const daysToDelete = splitDays.filter((d) => d.split_name === splitName);
      for (const day of daysToDelete) {
        const dayExercises = exercises.filter((e) => e.split_day_id === day.id);
        for (const ex of dayExercises) {
          await base44.entities.SplitExercise.delete(ex.id);
        }
        await base44.entities.SplitDay.delete(day.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splitDays'] });
      queryClient.invalidateQueries({ queryKey: ['splitExercises'] });
      setActiveTab(0);
      setDeleteConfirm(false);
      toast.success('Split deleted');
    },
    onError: () => toast.error('Failed to delete split'),
  });

  const duplicateSplitMutation = useMutation({
    mutationFn: async (splitName) => {
      const daysToDuplicate = splitDays.filter((d) => d.split_name === splitName);
      const newSplitName = `${splitName} (Copy)`;
      for (const day of daysToDuplicate) {
        const newDay = await base44.entities.SplitDay.create({
          user_id: user.email,
          split_name: newSplitName,
          day_of_week: day.day_of_week,
          session_type: day.session_type,
          order_index: day.order_index,
        });
        const dayExercises = exercises.filter((e) => e.split_day_id === day.id);
        for (const ex of dayExercises) {
          await base44.entities.SplitExercise.create({
            split_day_id: newDay.id,
            user_id: user.email,
            name: ex.name,
            image_url: ex.image_url,
            exercise_type: ex.exercise_type,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            rpe: ex.rpe,
            rest_seconds: ex.rest_seconds,
            cardio_metric: ex.cardio_metric,
            order_index: ex.order_index,
            notes: ex.notes,
            superset_group: ex.superset_group,
            dropset_count: ex.dropset_count,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splitDays'] });
      queryClient.invalidateQueries({ queryKey: ['splitExercises'] });
      toast.success('Split duplicated');
    },
    onError: () => toast.error('Failed to duplicate split'),
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', user?.email],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: user.email }, '-started_at', 100),
    enabled: !!user,
  });

  const { data: groupMembers = [] } = useQuery({
    queryKey: ['groupMembers', user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_id: user.email }),
    enabled: !!user,
  });

  const streak = useMemo(() => {
    if (groupMembers.length > 0) return groupMembers[0].streak || 0;
    return 0;
  }, [groupMembers]);

  const splitNames = [...new Set(splitDays.map((d) => d.split_name).filter(Boolean))];
  const activeSplitName = splitNames[activeTab] || splitNames[0];
  const activeDays = splitDays.filter((d) => d.split_name === activeSplitName);
  const getExerciseCount = (dayId) => exercises.filter((e) => e.split_day_id === dayId).length;
  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  return (
    <div className="px-4 pb-4" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">StrongStreak</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {user ? `Hey, ${user.full_name?.split(' ')[0] || 'Athlete'} 👋` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={() => setShowStreakCalendar(true)}
          className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-2xl px-3 py-2 active:scale-95 transition-transform"
        >
          <Flame size={20} className="text-primary flame-glow" />
          <span className="text-primary font-heading font-bold text-lg streak-pulse">{streak}</span>
        </button>
      </div>

      {showStreakCalendar && (
        <StreakCalendar
          workoutLogs={workoutLogs}
          streak={streak}
          onClose={() => setShowStreakCalendar(false)}
        />
      )}

      {showImportSplit && (
        <ImportSplitJsonModal
          user={user}
          onClose={() => setShowImportSplit(false)}
        />
      )}

      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <Link to="/split-builder" className="flex-1">
          <Button variant="outline" className="w-full border-border gap-2 text-sm">
            <Edit size={15} />
            {splitDays.length ? 'Edit Splits' : 'Build Split'}
          </Button>
        </Link>
        <Button variant="outline" className="flex-1 border-border gap-2 text-sm text-muted-foreground" onClick={() => setShowImportSplit(true)}>
          <Upload size={15} />
          Import Split
        </Button>
      </div>

      {/* Split Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {(splitNames.length > 0 ? splitNames : ['Split 1']).map((name, i) => (
          <button
            key={name}
            onClick={() => setActiveTab(i)}
            className={cn(
              'flex-shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
              i === activeTab
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            {name || `Split ${i + 1}`}
          </button>
        ))}
        <button
          onClick={() => navigate('/split-builder?newSplit=1')}
          className="flex-shrink-0 w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ml-0.5"
          title="Add new split"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Day Cards */}
      {splitDays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Dumbbell size={28} className="text-primary" />
          </div>
          <p className="text-muted-foreground text-center text-sm max-w-xs">
            You haven't built your workout split yet. Tap below to get started!
          </p>
          <Link to="/split-builder">
            <Button className="bg-primary text-primary-foreground gap-2">
              <Plus size={16} />
              Build My Split
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeDays.map((day, i) => {
            const isToday = day.day_of_week === today;
            const offset = swipeOffsets[day.id] || 0;
            return (
              <div
                key={day.id}
                className="relative overflow-hidden rounded-2xl"
                style={{ animationDelay: `${i * 40}ms` }}
                onTouchStart={(e) => handleSwipeTouchStart(day.id, e)}
                onTouchMove={(e) => handleSwipeTouchMove(day.id, e)}
                onTouchEnd={() => handleSwipeTouchEnd(day.id)}
              >
                {/* Delete button revealed on swipe */}
                <button
                  className="absolute inset-y-0 right-0 w-[72px] bg-destructive flex flex-col items-center justify-center gap-1"
                  style={{
                    transform: `translateX(${72 + offset}px)`,
                    transition: swipeTouchStart.current[day.id] ? 'none' : 'transform 0.2s ease',
                  }}
                  onClick={async () => {
                    const dayExercises = exercises.filter((e) => e.split_day_id === day.id);
                    for (const ex of dayExercises) await base44.entities.SplitExercise.delete(ex.id);
                    await base44.entities.SplitDay.delete(day.id);
                    queryClient.invalidateQueries({ queryKey: ['splitDays'] });
                    queryClient.invalidateQueries({ queryKey: ['splitExercises'] });
                    toast.success('Day deleted');
                  }}
                >
                  <Trash2 size={18} className="text-white" />
                  <span className="text-white text-[10px] font-semibold">Delete</span>
                </button>

                {/* Card content */}
                <div
                  className={cn(
                    'slide-up rounded-2xl border p-4 transition-all',
                    isToday ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'
                  )}
                  style={{
                    transform: `translateX(${offset}px)`,
                    transition: swipeTouchStart.current[day.id] ? 'none' : 'transform 0.2s ease',
                  }}
                  onClick={() => { if (offset < 0) setSwipeOffsets((prev) => ({ ...prev, [day.id]: 0 })); }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold text-base">{day.day_of_week}</span>
                      {isToday && (
                        <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">
                          TODAY
                        </span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs border', SESSION_COLORS[day.session_type] || SESSION_COLORS.Custom)}
                    >
                      {day.session_type || 'Unset'}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground text-sm mb-3">
                    {day.session_type === 'Rest'
                      ? 'Rest & recovery — no workout today'
                      : getExerciseCount(day.id) === 0
                        ? 'No exercises yet — tap Edit to add some'
                        : `${getExerciseCount(day.id)} exercise${getExerciseCount(day.id) !== 1 ? 's' : ''}`}
                  </p>

                  {day.session_type !== 'Rest' && (
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground gap-1.5 w-full"
                      onClick={(e) => { e.stopPropagation(); navigate(`/workout/${day.id}`); }}
                    >
                      <Play size={13} fill="currentColor" />
                      Start Workout
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete/Duplicate section */}
      {splitNames.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteConfirm(true)}
          >
            Delete Split
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => duplicateSplitMutation.mutate(activeSplitName)}
            disabled={duplicateSplitMutation.isPending}
          >
            Duplicate Split
          </Button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-foreground/40 flex items-end z-[60]">
          <div className="w-full bg-card rounded-t-3xl p-6 border-t border-border mb-20">
            <h2 className="text-lg font-heading font-bold mb-2">Delete Split?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete "{activeSplitName}" and all its exercises? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  const splitToDelete = activeSplitName;
                  setDeleteConfirm(false);
                  deleteSplitMutation.mutate(splitToDelete);
                }}
                disabled={deleteSplitMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}