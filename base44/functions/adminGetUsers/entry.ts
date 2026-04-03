import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const allUsers = await base44.asServiceRole.entities.User.list();
  const profiles = await base44.asServiceRole.entities.Profile.list();
  const blocks = await base44.asServiceRole.entities.Block.list();

  const profileMap = {};
  for (const p of profiles) profileMap[p.user_id] = p;

  const blockedSet = new Set(blocks.map((b) => b.blocked_id));

  const result = allUsers.map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role || 'user',
    created_date: u.created_date,
    display_name: profileMap[u.email]?.display_name || u.full_name || u.email?.split('@')[0],
    avatar_url: profileMap[u.email]?.avatar_url || null,
    is_blocked: blockedSet.has(u.email),
  }));

  return Response.json({ users: result });
});