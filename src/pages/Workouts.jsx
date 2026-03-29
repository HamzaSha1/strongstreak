import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Flame, Plus, Edit, Play, BedDouble, Dumbbell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const SESSION_COLORS = {
  Push: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Pull: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Legs: 'bg-green-500/20 text-green-400 border-green-500/30',
  Upper: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Lower: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Full Body': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Cardio: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Rest: 'bg-muted text-muted-foreground border-border',
  Custom: 'bg-primary/20 text-primary border-primary/30',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Workouts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

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
      setDeleteInput('');
      toast.success('Split deleted');
    },
    onError: () => {
      toast.error('Failed to delete split');
    },
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
    onError: () => {
      toast.error('Failed to duplicate split');
    },
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', user?.email],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: user.email }, '-started_at', 100),
    enabled: !!user,
  });

  const streak = useMemo(() => {
    if (!workoutLogs.length) return 0;
    const loggedDates = new Set(
      workoutLogs
        .filter((l) => !l.is_rest_day)
        .map((l) => new Date(l.started_at).toDateString())
    );
    let count = 0;
    const today = new Date();
    for (let i = 0; ; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (loggedDates.has(d.toDateString())) {
        count++;
      } else if (i > 0) {
        break;
      } else {
        // Today has no log yet, check yesterday before giving up
        continue;
      }
    }
    return count;
  }, [workoutLogs]);

  // Group days by split_name
  const splitNames = [...new Set(splitDays.map((d) => d.split_name).filter(Boolean))];
  const activeSplitName = splitNames[activeTab] || splitNames[0];
  const activeDays = splitDays.filter((d) => d.split_name === activeSplitName);

  const getExerciseCount = (dayId) =>
    exercises.filter((e) => e.split_day_id === dayId).length;

  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">StrongStreak</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {user ? `Hey, ${user.full_name?.split(' ')[0] || 'Athlete'} 👋` : 'Loading...'}
          </p>
        </div>
        {/* Streak */}
        <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-2xl px-3 py-2">
          <Flame size={20} className="text-primary flame-glow" />
          <span className="text-primary font-heading font-bold text-lg streak-pulse">{streak}</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <Link to="/split-builder" className="flex-1">
          <Button variant="outline" className="w-full border-border gap-2 text-sm">
            <Edit size={15} />
            {splitDays.length ? 'Edit Splits' : 'Build Split'}
          </Button>
        </Link>
        <Button
          variant="outline"
          className="flex-1 border-border gap-2 text-sm text-muted-foreground"
        >
          <BedDouble size={15} />
          Log Rest Day
        </Button>
      </div>

      {/* Split Tabs — always visible, Chrome-style */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 scrollbar-hide">
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
        {/* + tab: go to split builder to add a new split */}
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
            return (
              <div
                key={day.id}
                className={cn(
                  'slide-up rounded-2xl border p-4 transition-all',
                  isToday
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card'
                )}
                style={{ animationDelay: `${i * 40}ms` }}
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
                    ? 'Rest & recovery'
                    : `${getExerciseCount(day.id)} exercise${getExerciseCount(day.id) !== 1 ? 's' : ''}`}
                </p>

                {day.session_type !== 'Rest' && (
                  <Link to={`/workout/${day.id}`}>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground gap-1.5 w-full"
                    >
                      <Play size={13} fill="currentColor" />
                      Start Workout
                    </Button>
                  </Link>
                )}
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
        <div className="fixed inset-0 bg-black/50 flex items-end z-[60]">
          <div className="w-full bg-card rounded-t-3xl p-6 border-t border-border mb-20">
            <h2 className="text-lg font-heading font-bold mb-2">Delete Split?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete "{activeSplitName}" and all its exercises. Type DELETE to confirm.
            </p>
            <input
              type="text"
              placeholder="Type DELETE..."
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="w-full h-10 rounded-xl bg-input border border-border px-3 text-sm mb-4"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDeleteConfirm(false);
                  setDeleteInput('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteSplitMutation.mutate(activeSplitName)}
                disabled={deleteInput !== 'DELETE' || deleteSplitMutation.isPending}
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