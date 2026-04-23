import { motion } from 'framer-motion';
import { Trophy, Flame, Zap, Target, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function computeAchievements(sets, exercises) {
  const achievements = [];

  // Build exercise name map by id
  const nameById = {};
  (exercises || []).forEach((ex) => { nameById[ex.id] = ex.name; });

  const completedSets = Object.entries(sets).flatMap(([exId, exSets]) =>
    exSets.filter((s) => s.completed).map((s) => ({ ...s, _exName: nameById[exId] || 'Unknown' }))
  );
  const totalSets = completedSets.length;
  const totalReps = completedSets.reduce((acc, s) => acc + (Number(s.reps) || 0), 0);
  const totalVolume = completedSets.reduce((acc, s) => acc + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0), 0);

  // Top volume exercise
  const volumeByExercise = {};
  completedSets.forEach((s) => {
    const key = s._exName;
    volumeByExercise[key] = (volumeByExercise[key] || 0) + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0);
  });
  const topExercise = Object.entries(volumeByExercise).sort((a, b) => b[1] - a[1])[0];

  if (totalSets > 0) achievements.push({ icon: Zap, label: 'Sets Crushed', value: `${totalSets} sets`, color: 'text-yellow-400' });
  if (totalReps > 0) achievements.push({ icon: Target, label: 'Total Reps', value: `${totalReps} reps`, color: 'text-blue-400' });
  if (totalVolume > 0) achievements.push({ icon: TrendingUp, label: 'Total Volume', value: `${Math.round(totalVolume).toLocaleString()} kg`, color: 'text-green-400' });
  if (topExercise) achievements.push({ icon: Trophy, label: 'Top Exercise', value: topExercise[0], color: 'text-primary' });

  return achievements.slice(0, 3);
}

const fadeUp = (delay) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut', delay },
});

export default function WorkoutSummaryScreen({ sets, exercises, streak, durationMinutes, onContinue, onSkip, summaryRef, weightSuggestions = [] }) {
  const achievements = computeAchievements(sets, exercises);

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="flex flex-col items-center justify-center min-h-full p-6">

        {/* Capturable summary card (off-screen, for sharing) */}
        <div ref={summaryRef} className="absolute opacity-0 pointer-events-none w-[340px] bg-background p-6 rounded-3xl border border-border flex flex-col items-center gap-4" style={{ left: -9999, top: -9999 }}>
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Trophy size={32} className="text-primary" />
          </div>
          <p className="font-heading font-bold text-xl text-foreground">Workout Done!</p>
          {durationMinutes > 0 && <p className="text-muted-foreground text-sm">{durationMinutes} min session</p>}
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-2xl px-4 py-2">
            <Flame size={20} className="text-primary" />
            <p className="font-heading font-bold text-primary">{streak} day streak 🔥</p>
          </div>
          {computeAchievements(sets, exercises).map((ach, i) => (
            <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 w-full">
              <ach.icon size={18} className={ach.color} />
              <div>
                <p className="text-xs text-muted-foreground">{ach.label}</p>
                <p className="font-heading font-semibold text-sm text-foreground">{ach.value}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-1">StrongStreak</p>
        </div>

        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        </div>

        {/* Trophy */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.34, 1.4, 0.64, 1], delay: 0.05 }}
          className="mb-4 relative"
        >
          <div className="w-28 h-28 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center shadow-[0_0_40px_hsl(35_96%_58%/0.4)]">
            <Trophy size={52} className="text-primary" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div {...fadeUp(0.3)} className="text-center mb-6">
          <h1 className="font-heading font-bold text-3xl text-foreground">Workout Done!</h1>
          {durationMinutes > 0 && (
            <p className="text-muted-foreground text-sm mt-1">{durationMinutes} min session</p>
          )}
        </motion.div>

        {/* Streak */}
        <motion.div
          {...fadeUp(0.55)}
          className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl px-6 py-3 mb-6"
        >
          <Flame size={28} className="text-primary flame-glow" />
          <div>
            <p className="text-xs text-muted-foreground">Current Streak</p>
            <p className="font-heading font-bold text-2xl text-primary streak-pulse">{streak} days 🔥</p>
          </div>
        </motion.div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <motion.div {...fadeUp(0.75)} className="w-full max-w-sm flex flex-col gap-2 mb-8">
            {achievements.map((ach, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: 0.85 + i * 0.1 }}
                className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3"
              >
                <ach.icon size={20} className={ach.color} />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{ach.label}</p>
                  <p className="font-heading font-semibold text-sm text-foreground">{ach.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Weight suggestions */}
        {weightSuggestions.length > 0 && (
          <motion.div
            {...fadeUp(0.85 + achievements.length * 0.1 + 0.15)}
            className="w-full max-w-sm flex flex-col gap-2 mb-4"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Next Session Tips</p>
            {weightSuggestions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: 1.0 + achievements.length * 0.1 + i * 0.08 }}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 border',
                  s.direction === 'increase'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                )}
              >
                {s.direction === 'increase'
                  ? <ArrowUp size={16} className="shrink-0" />
                  : <ArrowDown size={16} className="shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-xs">{s.exName}</p>
                  <p className="text-xs opacity-80 mt-0.5 leading-snug">{s.message}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* CTA buttons */}
        <motion.div
          {...fadeUp(1.1 + achievements.length * 0.1 + weightSuggestions.length * 0.08)}
          className="w-full max-w-sm flex flex-col gap-2"
        >
          <Button
            onClick={onContinue}
            className="w-full py-5 font-heading font-bold text-base bg-primary text-primary-foreground shadow-[0_0_20px_hsl(35_96%_58%/0.4)]"
          >
            Share Workout 🔥
          </Button>
          <Button
            variant="outline"
            onClick={onSkip}
            className="w-full py-5 font-heading font-bold text-base border-border text-muted-foreground"
          >
            Done
          </Button>
        </motion.div>

      </div>
    </div>
  );
}
