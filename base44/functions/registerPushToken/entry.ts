import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { token, platform } = await req.json();
    if (!token || !platform) {
      return Response.json({ error: 'Missing token or platform' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;

    // Avoid storing duplicate tokens for the same device
    const existing = await db.DeviceToken.filter({ user_id: user.email, token });
    if (existing.length > 0) {
      return Response.json({ ok: true, action: 'already_registered' });
    }

    await db.DeviceToken.create({ user_id: user.email, token, platform });
    return Response.json({ ok: true, action: 'registered' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
