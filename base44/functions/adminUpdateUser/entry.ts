import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, updates } = await req.json();
  if (!userId || !updates) {
    return Response.json({ error: 'Missing userId or updates' }, { status: 400 });
  }

  await base44.asServiceRole.entities.User.update(userId, updates);
  return Response.json({ success: true });
});