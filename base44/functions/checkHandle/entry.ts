import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { handle } = await req.json();
    if (!handle) return Response.json({ error: 'handle required' }, { status: 400 });

    const normalized = handle.toLowerCase().replace(/[^a-z0-9_.]/g, '');

    // Check if any profile already has this handle (excluding the current user)
    const profiles = await base44.asServiceRole.entities.Profile.filter({ handle: normalized });
    const taken = profiles.some((p) => p.user_id !== user.email);

    return Response.json({ available: !taken, handle: normalized });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});