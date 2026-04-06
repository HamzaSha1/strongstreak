import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId } = await req.json();
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

    const logs = await base44.asServiceRole.entities.WorkoutLog.filter(
      { user_id: userId },
      '-created_date',
      5
    );

    return Response.json({ logs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});