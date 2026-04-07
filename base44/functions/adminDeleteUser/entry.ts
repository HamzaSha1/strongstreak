import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 });

  // Look up the target user to get their email (used as user_id in most entities)
  const targetUser = await base44.asServiceRole.entities.User.get(userId);
  if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });

  const email = targetUser.email;
  const db = base44.asServiceRole.entities;

  // Delete all associated data in parallel
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

  const allRecords = [
    ...profiles,
    ...posts,
    ...workoutLogs,
    ...setLogs,
    ...splitDays,
    ...splitExercises,
    ...weights,
    ...postLikes,
    ...followsAsFollower,
    ...followsAsFollowing,
    ...followRequestsAsRequester,
    ...followRequestsAsTarget,
    ...blocksAsBlocker,
    ...blocksAsBlocked,
    ...reports,
    ...groupMembers,
  ];

  // Delete all records
  await Promise.all(allRecords.map((r) => {
    const entityName = r.entity_name;
    return db[entityName].delete(r.id);
  }));

  // Finally delete the user account
  await db.User.delete(userId);

  return Response.json({ success: true, deleted_records: allRecords.length });
});