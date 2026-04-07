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

  const safeDelete = (entity, id) => entity.delete(id).catch(() => {});

  // Delete each group explicitly with the correct entity, ignoring 404s
  await Promise.all([
    ...profiles.map((r) => safeDelete(db.Profile, r.id)),
    ...posts.map((r) => safeDelete(db.Post, r.id)),
    ...workoutLogs.map((r) => safeDelete(db.WorkoutLog, r.id)),
    ...setLogs.map((r) => safeDelete(db.SetLog, r.id)),
    ...splitDays.map((r) => safeDelete(db.SplitDay, r.id)),
    ...splitExercises.map((r) => safeDelete(db.SplitExercise, r.id)),
    ...weights.map((r) => safeDelete(db.Weight, r.id)),
    ...postLikes.map((r) => safeDelete(db.PostLike, r.id)),
    ...followsAsFollower.map((r) => safeDelete(db.Follow, r.id)),
    ...followsAsFollowing.map((r) => safeDelete(db.Follow, r.id)),
    ...followRequestsAsRequester.map((r) => safeDelete(db.FollowRequest, r.id)),
    ...followRequestsAsTarget.map((r) => safeDelete(db.FollowRequest, r.id)),
    ...blocksAsBlocker.map((r) => safeDelete(db.Block, r.id)),
    ...blocksAsBlocked.map((r) => safeDelete(db.Block, r.id)),
    ...reports.map((r) => safeDelete(db.Report, r.id)),
    ...groupMembers.map((r) => safeDelete(db.GroupMember, r.id)),
  ]);

  // Finally delete the user
  await db.User.delete(userId);

  return Response.json({ success: true });
});