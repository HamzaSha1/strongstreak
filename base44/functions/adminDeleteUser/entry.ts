import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 });

  const targetUser = await base44.asServiceRole.entities.User.get(userId);
  if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });

  const email = targetUser.email;
  const db = base44.asServiceRole.entities;

  // Fetch all associated data
  const [
    profiles,
    posts,
    workoutLogs,
    setLogs,
    splitDays,
    splitExercises,
    weights,
    postLikes,
    followsAsFollower,
    followsAsFollowing,
    followRequestsAsRequester,
    followRequestsAsTarget,
    blocksAsBlocker,
    blocksAsBlocked,
    reports,
    groupMembers,
  ] = await Promise.all([
    db.Profile.filter({ user_id: email }),
    db.Post.filter({ user_id: email }),
    db.WorkoutLog.filter({ user_id: email }),
    db.SetLog.filter({ user_id: email }),
    db.SplitDay.filter({ user_id: email }),
    db.SplitExercise.filter({ user_id: email }),
    db.Weight.filter({ user_id: email }),
    db.PostLike.filter({ user_id: email }),
    db.Follow.filter({ follower_id: email }),
    db.Follow.filter({ following_id: email }),
    db.FollowRequest.filter({ requester_id: email }),
    db.FollowRequest.filter({ target_id: email }),
    db.Block.filter({ blocker_id: email }),
    db.Block.filter({ blocked_id: email }),
    db.Report.filter({ reporter_id: email }),
    db.GroupMember.filter({ user_id: email }),
  ]);

  // Delete each group explicitly with the correct entity
  await Promise.all([
    ...profiles.map((r) => db.Profile.delete(r.id)),
    ...posts.map((r) => db.Post.delete(r.id)),
    ...workoutLogs.map((r) => db.WorkoutLog.delete(r.id)),
    ...setLogs.map((r) => db.SetLog.delete(r.id)),
    ...splitDays.map((r) => db.SplitDay.delete(r.id)),
    ...splitExercises.map((r) => db.SplitExercise.delete(r.id)),
    ...weights.map((r) => db.Weight.delete(r.id)),
    ...postLikes.map((r) => db.PostLike.delete(r.id)),
    ...followsAsFollower.map((r) => db.Follow.delete(r.id)),
    ...followsAsFollowing.map((r) => db.Follow.delete(r.id)),
    ...followRequestsAsRequester.map((r) => db.FollowRequest.delete(r.id)),
    ...followRequestsAsTarget.map((r) => db.FollowRequest.delete(r.id)),
    ...blocksAsBlocker.map((r) => db.Block.delete(r.id)),
    ...blocksAsBlocked.map((r) => db.Block.delete(r.id)),
    ...reports.map((r) => db.Report.delete(r.id)),
    ...groupMembers.map((r) => db.GroupMember.delete(r.id)),
  ]);

  // Finally delete the user
  await db.User.delete(userId);

  return Response.json({ success: true });
});