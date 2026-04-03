import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [users, posts, workoutLogs, reports, groups] = await Promise.all([
    base44.asServiceRole.entities.User.list(),
    base44.asServiceRole.entities.Post.list('-created_date', 500),
    base44.asServiceRole.entities.WorkoutLog.list('-created_date', 500),
    base44.asServiceRole.entities.Report.list('-created_date', 200),
    base44.asServiceRole.entities.Group.list(),
  ]);

  // Last 7 days workout activity
  const now = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const workoutsByDay = {};
  last7Days.forEach((d) => (workoutsByDay[d] = 0));
  workoutLogs.forEach((w) => {
    const day = w.created_date?.split('T')[0];
    if (workoutsByDay[day] !== undefined) workoutsByDay[day]++;
  });

  const activityChart = last7Days.map((d) => ({
    date: d,
    workouts: workoutsByDay[d],
  }));

  return Response.json({
    totals: {
      users: users.length,
      posts: posts.length,
      workouts: workoutLogs.length,
      reports: reports.filter((r) => r.status === 'pending').length,
      groups: groups.length,
    },
    activityChart,
  });
});