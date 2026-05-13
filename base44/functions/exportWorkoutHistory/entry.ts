import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = user.email;

  // Fetch all data in parallel
  const [splitDays, splitExercises, workoutLogs, setLogs] = await Promise.all([
    base44.entities.SplitDay.filter({ user_id: uid }),
    base44.entities.SplitExercise.filter({ user_id: uid }),
    base44.entities.WorkoutLog.filter({ user_id: uid }, '-started_at', 1000),
    base44.entities.SetLog.filter({ user_id: uid }, '-created_date', 5000),
  ]);

  // Build lookup maps
  const exercisesByDayId = {};
  for (const ex of splitExercises) {
    if (!exercisesByDayId[ex.split_day_id]) exercisesByDayId[ex.split_day_id] = [];
    exercisesByDayId[ex.split_day_id].push(ex);
  }

  const setsByLogId = {};
  for (const s of setLogs) {
    if (!setsByLogId[s.workout_log_id]) setsByLogId[s.workout_log_id] = [];
    setsByLogId[s.workout_log_id].push(s);
  }

  // Structure split plan
  const splitPlan = splitDays.map((day) => ({
    id: day.id,
    day_of_week: day.day_of_week,
    split_name: day.split_name,
    session_type: day.session_type,
    custom_name: day.custom_name || null,
    order_index: day.order_index,
    exercises: (exercisesByDayId[day.id] || [])
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((ex) => ({
        name: ex.name,
        exercise_type: ex.exercise_type,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        rpe: ex.rpe,
        rest_seconds: ex.rest_seconds,
        cardio_metric: ex.cardio_metric || null,
        notes: ex.notes || null,
      })),
  }));

  // Structure workout history
  const history = workoutLogs.map((log) => ({
    id: log.id,
    split_day_name: log.split_day_name,
    started_at: log.started_at,
    finished_at: log.finished_at || null,
    duration_minutes: log.duration_minutes || null,
    is_rest_day: log.is_rest_day || false,
    sets: (setsByLogId[log.id] || [])
      .sort((a, b) => (a.set_number ?? 0) - (b.set_number ?? 0))
      .map((s) => ({
        exercise_name: s.exercise_name,
        set_number: s.set_number,
        set_type: s.set_type,
        reps: s.reps,
        weight_kg: s.weight_kg,
        rpe: s.rpe ?? null,
        completed: s.completed,
      })),
  }));

  const output = {
    exported_at: new Date().toISOString(),
    user: uid,
    split_plan: splitPlan,
    workout_history: history,
  };

  return new Response(JSON.stringify(output, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="workout_history_${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
});