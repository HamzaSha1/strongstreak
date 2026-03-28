import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DAYS } from '@/components/splitbuilder/exerciseData';
import DayCard from '@/components/splitbuilder/DayCard';

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
  const [splitName, setSplitName] = useState('');
  const [days, setDays] = useState(initialDays);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existing = await base44.entities.SplitDay.filter({ user_id: user.email });
      for (const d of existing) await base44.entities.SplitDay.delete(d.id);
      const existingEx = await base44.entities.SplitExercise.filter({ user_id: user.email });
      for (const e of existingEx) await base44.entities.SplitExercise.delete(e.id);

      for (const d of days) {
        if (!d.session_type) continue;
        const savedDay = await base44.entities.SplitDay.create({
          user_id: user.email,
          split_name: splitName || 'My Split',
          day_of_week: d.day,
          session_type: d.session_type,
          order_index: d.order_index,
        });
        for (let i = 0; i < d.exercises.length; i++) {
          const ex = d.exercises[i];
          await base44.entities.SplitExercise.create({
            split_day_id: savedDay.id,
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
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splitDays'] });
      queryClient.invalidateQueries({ queryKey: ['splitExercises'] });
      toast.success('Split saved!');
      navigate('/');
    },
  });

  const updateDay = (i, patch) => {
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  };

  const trainingDays = days.filter((d) => d.session_type && d.session_type !== 'Rest').length;
  const restDays = days.filter((d) => d.session_type === 'Rest').length;

  return (
    <div className="pb-28 min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <Input
            value={splitName}
            onChange={(e) => setSplitName(e.target.value)}
            className="bg-transparent border-none text-base font-heading font-bold p-0 h-auto focus-visible:ring-0"
            placeholder="Name your split (e.g. PPL 6-Day, Upper Lower)"
          />
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-xl text-sm font-medium"
        >
          {saveMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
          ) : (
            <Check size={15} />
          )}
          Save
        </button>
      </div>

      {/* Day cards */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        {days.map((day, i) => (
          <DayCard
            key={day.day}
            day={day}
            dayIndex={i}
            onUpdate={(patch) => updateDay(i, patch)}
          />
        ))}
      </div>

      {/* Summary bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[480px] bg-card/95 backdrop-blur border border-border rounded-2xl px-4 py-3 flex justify-around text-center text-xs z-10">
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
          <p className="font-bold text-xl font-heading">{7 - trainingDays - restDays}</p>
          <p className="text-muted-foreground">Unset</p>
        </div>
      </div>
    </div>
  );
}