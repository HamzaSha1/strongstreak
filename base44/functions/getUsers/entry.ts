import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const allUsers = await base44.asServiceRole.entities.User.list();
  const profiles = await base44.asServiceRole.entities.Profile.list();

  const profileMap = {};
  for (const p of profiles) profileMap[p.user_id] = p;

  const result = allUsers
    .filter((u) => u.email !== user.email && u.is_verified === true)
    .map((u) => ({
      user_id: u.id,
      email: u.email, // kept for follow logic (follower_id/following_id), not shown in UI
      avatar_url: profileMap[u.email]?.avatar_url || null,
      display_name: profileMap[u.email]?.display_name || u.full_name || u.email.split('@')[0],
    }));

  return Response.json({ users: result });
});