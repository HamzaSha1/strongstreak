import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event?.type !== 'create') return Response.json({ ok: true });

    const { blocker_id, blocked_id } = data || {};
    if (!blocker_id || !blocked_id) return Response.json({ ok: true });

    // Send notification email to developer
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'mohammedal-salih22@icloud.com',
      subject: `⚠️ StrongStreak: User Blocked`,
      body: `A user block event occurred on StrongStreak.\n\nBlocker: ${blocker_id}\nBlocked: ${blocked_id}\n\nPlease review the situation and take action within 24 hours if needed.`,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});