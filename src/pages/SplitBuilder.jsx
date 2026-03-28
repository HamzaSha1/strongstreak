import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronDown, ChevronUp, Trash2, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SESSION_TYPES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'Rest', 'Custom'];
const REST_OPTIONS = [
  { label: '30s', value: 30 }, { label: '45s', value: 45 }, { label: '60s', value: 60 },
  { label: '90s', value: 90 }, { label: '2m', value: 120 }, { label: '3m', value: 180 }, { label: '5m', value: 300 },
];

const EXERCISE_LIBRARY = {
  Push: ['Bench Press', 'Incline Bench Press', 'Shoulder Press', 'Lateral Raise', 'Tricep Pushdown', 'Overhead Tricep Extension'],
  Pull: ['Deadlift', 'Pull-Up', 'Barbell Row', 'Cable Row', 'Face Pull', 'Bicep Curl', 'Hammer Curl'],
  Legs: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Leg Extension', 'Calf Raise', 'Bulgarian Split Squat'],
  Upper: ['Bench Press', 'Barbell Row', 'Shoulder Press', 'Pull-Up', 'Lateral Raise', 'Bicep Curl', 'Tricep Pushdown'],
  Lower: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'],
  'Full Body': ['Squat', 'Bench Press', 'Deadlift', 'Pull-Up', 'Shoulder Press'],
  Cardio: ['Treadmill', 'Cycling', 'Rowing', 'Jump Rope', 'Elliptical', 'Stair Climber'],
  Custom: [],
};

function ExerciseRow({ exercise, onChange, onDelete, sessionType }) {
  const library = EXERCISE_LIBRARY[sessionType] || [];
  const isCardio = exercise.exercise_type === 'cardio';

  return (
    <div className="bg-muted/50 rounded-xl p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <Input
          list={`ex-list-${sessionType}`}
          placeholder="Exercise name"
          value={exercise.name}
          onChange={(e) => onChange({ ...exercise, name: e.target.value })}
          className="flex-1 bg-input border-border text-sm h-8"
        />
        <datalist id={`ex-list-${sessionType}`}>
          {library.map((e) => <option key={e} value={e} />)}
        </datalist>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Type toggle */}
      <div className="flex gap-1 mb-2">
        {['strength', 'cardio'].map((t) => (
          <button
            key={t}
            onClick={() => onChange({ ...exercise, exercise_type: t })}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full border transition-colors capitalize',
              exercise.exercise_type === t
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {isCardio ? (
        <div className="grid grid-cols-3 gap-1.5">
          {['time', 'distance', 'calories'].map((m) => (
            <button
              key={m}
              onClick={() => onChange({ ...exercise, cardio_metric: m })}
              className={cn(
                'text-xs py-1.5 rounded-lg border capitalize transition-colors',
                exercise.cardio_metric === m
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'border-border text-muted-foreground'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sets</label>
            <Input
              type="number"
              min={1}
              max={10}
              value={exercise.target_sets || ''}
              onChange={(e) => onChange({ ...exercise, target_sets: Number(e.target.value) })}
              className="bg-input border-border text-sm h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Reps</label>
            <Input
              placeholder="e.g. 8 or Failure"
              value={exercise.target_reps || ''}
              onChange={(e) => onChange({ ...exercise, target_reps: e.target.value })}
              className="bg-input border-border text-sm h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">RPE ({exercise.rpe || 7})</label>
            <input
              type="range"
              min={6}
              max={10}
              step={0.5}
              value={exercise.rpe || 7}
              onChange={(e) => onChange({ ...exercise, rpe: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Rest</label>
            <div className="flex flex-wrap gap-1">
              {REST_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => onChange({ ...exercise, rest_seconds: r.value })}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full border transition-colors',
                    exercise.rest_seconds === r.value
                      ? 'bg-primary/20 text-primary border-primary/50'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SplitBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [splitName, setSplitName] = useState('My Split');
  const [days, setDays] = useState(
    DAYS.map((d, i) => ({ day: d, session_type: 'Rest', exercises: [], open: false, order_index: i }))
  );

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete existing split days for user
      const existing = await base44.entities.SplitDay.filter({ user_id: user.email });
      for (const d of existing) await base44.entities.SplitDay.delete(d.id);
      const existingEx = await base44.entities.SplitExercise.filter({ user_id: user.email });
      for (const e of existingEx) await base44.entities.SplitExercise.delete(e.id);

      for (const d of days) {
        const savedDay = await base44.entities.SplitDay.create({
          user_id: user.email,
          split_name: splitName,
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
            order_index: i,
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

  const addExercise = (i) => {
    setDays((prev) =>
      prev.map((d, idx) =>
        idx === i
          ? { ...d, exercises: [...d.exercises, { name: '', exercise_type: 'strength', target_sets: 3, target_reps: '8', rpe: 7, rest_seconds: 90 }] }
          : d
      )
    );
  };

  const updateExercise = (dayIdx, exIdx, ex) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, exercises: d.exercises.map((e, j) => (j === exIdx ? ex : e)) }
          : d
      )
    );
  };

  const deleteExercise = (dayIdx, exIdx) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) } : d
      )
    );
  };

  const trainingDays = days.filter((d) => d.session_type !== 'Rest').length;
  const restDays = days.filter((d) => d.session_type === 'Rest').length;

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <Input
          value={splitName}
          onChange={(e) => setSplitName(e.target.value)}
          className="flex-1 bg-transparent border-none text-lg font-heading font-bold p-0 h-auto focus-visible:ring-0"
          placeholder="Split name..."
        />
        <Button
          size="sm"
          className="bg-primary text-primary-foreground gap-1"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          <Check size={14} />
          Save
        </Button>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {days.map((day, i) => (
          <div key={day.day} className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Day header */}
            <button
              className="w-full flex items-center justify-between px-4 py-3"
              onClick={() => updateDay(i, { open: !day.open })}
            >
              <div className="flex items-center gap-3">
                <span className="font-heading font-semibold text-sm">{day.day}</span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  day.session_type === 'Rest' ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'
                )}>
                  {day.session_type}
                </span>
              </div>
              {day.open ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
            </button>

            {day.open && (
              <div className="border-t border-border px-4 pb-4 pt-3">
                {/* Session type picker */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {SESSION_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => updateDay(i, { session_type: t })}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-colors',
                        day.session_type === t
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-foreground/50'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {day.session_type !== 'Rest' && (
                  <>
                    {day.exercises.map((ex, j) => (
                      <ExerciseRow
                        key={j}
                        exercise={ex}
                        sessionType={day.session_type}
                        onChange={(updated) => updateExercise(i, j, updated)}
                        onDelete={() => deleteExercise(i, j)}
                      />
                    ))}
                    <button
                      onClick={() => addExercise(i)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-muted-foreground text-sm hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      <Plus size={14} /> Add Exercise
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[480px] bg-card/90 backdrop-blur border border-border rounded-2xl px-4 py-3 flex justify-around text-center text-xs">
        <div>
          <p className="text-primary font-bold text-lg font-heading">{trainingDays}</p>
          <p className="text-muted-foreground">Training</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="font-bold text-lg font-heading">{restDays}</p>
          <p className="text-muted-foreground">Rest</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="font-bold text-lg font-heading">{7 - trainingDays - restDays}</p>
          <p className="text-muted-foreground">Unset</p>
        </div>
      </div>
    </div>
  );
}