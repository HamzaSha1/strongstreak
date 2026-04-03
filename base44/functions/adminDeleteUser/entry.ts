import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 });

  await base44.asServiceRole.entities.User.delete(userId);
  return Response.json({ success: true });
});