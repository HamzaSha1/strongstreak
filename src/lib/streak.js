// Shared streak calculator — computed LIVE from WorkoutLog + SplitDay records
// so the Workouts page, ActiveWorkout celebration, and any future surface
// always agree. Do NOT read GroupMember.streak for display — that field drifts.

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function calculateStreak(workoutLogs, splitDays) {
  if (!workoutLogs?.length && !splitDays?.length) return 0;

  // Set of midnight timestamps that have a finished, non-rest workout
  const completedDayTimestamps = new Set(
    (workoutLogs || [])
      .filter((l) => l.finished_at && !l.is_rest_day)
      .map((l) => {
        const d = new Date(l.created_date || l.started_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
  );

  // Day names that are Rest in ANY split
  const restDayNames = new Set(
    (splitDays || [])
      .filter((d) => !d.session_type || d.session_type === 'Rest')
      .map((d) => d.day_of_week)
  );

  // Day names that are a training day in ANY split
  const trainingDayNames = new Set(
    (splitDays || [])
      .filter((d) => d.session_type && d.session_type !== 'Rest')
      .map((d) => d.day_of_week)
  );

  let count = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    const ts = d.getTime();
    const dayName = DAY_NAMES[d.getDay()];

    if (completedDayTimestamps.has(ts)) {
      // Trained this day — streak continues
      count++;
    } else if (restDayNames.has(dayName) && !trainingDayNames.has(dayName)) {
      // Scheduled pure rest day — skip (don't break, don't count)
      continue;
    } else if (i === 0) {
      // Today — no workout yet but day isn't over, just skip to yesterday
      continue;
    } else {
      // A scheduled training day with no logged workout → streak broken
      break;
    }
  }

  return count;
}
