import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Lock, UserPlus, UserCheck, Dumbbell, Clock, Flag, ShieldOff, ShieldBan } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReportModal from '@/components/moderation/ReportModal';
import { useState as useLocalState } from 'react';
import { toast } from 'sonner';

export default function UserProfileSheet({ person, currentUser, following, onClose }) {
  const queryClient = useQueryClient();
  const [showReport, setShowReport] = useLocalState(false);

  // Block state
  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks', currentUser?.email],
    queryFn: () => base44.entities.Block.filter({ blocker_id: currentUser.email }),
    enabled: !!currentUser,
  });
  const isBlocked = blocks.some((b) => b.blocked_id === person.email);

  const blockMutation = useMutation({
    mutationFn: async () => {
      if (isBlocked) {
        const existing = blocks.find((b) => b.blocked_id === person.email);
        if (existing) await base44.entities.Block.delete(existing.id);
      } else {
        await base44.entities.Block.create({ blocker_id: currentUser.email, blocked_id: person.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks', currentUser?.email] });
      if (!isBlocked) {
        toast.success(`${person.display_name} has been blocked.`);
        onClose();
      } else {
        toast.success(`${person.display_name} has been unblocked.`);
      }
    },
  });

  const isFollowing = following.some((f) => f.following_id === person.email);
  const isPrivate = person.is_private;
  const canViewContent = !isPrivate || isFollowing;

  // Check if a pending follow request exists for private accounts
  const { data: followRequests = [] } = useQuery({
    queryKey: ['followRequest', currentUser?.email, person.email],
    queryFn: () => base44.entities.FollowRequest.filter({
      requester_id: currentUser.email,
      target_id: person.email,
    }),
    enabled: !!currentUser && isPrivate && !isFollowing,
  });

  const pendingRequest = followRequests.find((r) => r.status === 'pending');

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', person.email],
    queryFn: () => base44.entities.Post.filter({ user_id: person.email, visibility: 'public' }, '-created_date', 20),
    enabled: canViewContent,
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['userWorkoutLogs', person.email],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUserWorkoutLogs', { userId: person.email });
      return res.data.logs || [];
    },
    enabled: canViewContent,
  });

  // For public accounts: direct follow/unfollow
  // For private accounts: send/cancel follow request
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!isPrivate) {
        // Public account — direct follow/unfollow
        const existing = following.find((f) => f.following_id === person.email);
        if (existing) {
          await base44.entities.Follow.delete(existing.id);
        } else {
          await base44.entities.Follow.create({
            follower_id: currentUser.email,
            following_id: person.email,
          });
        }
      } else {
        // Private account — send or cancel follow request
        if (pendingRequest) {
          await base44.entities.FollowRequest.delete(pendingRequest.id);
        } else if (isFollowing) {
          // Unfollow
          const existing = following.find((f) => f.following_id === person.email);
          if (existing) await base44.entities.Follow.delete(existing.id);
        } else {
          await base44.entities.FollowRequest.create({
            requester_id: currentUser.email,
            target_id: person.email,
            status: 'pending',
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followRequest', currentUser?.email, person.email] });
    },
  });

  const getFollowLabel = () => {
    if (isBlocked) return 'Blocked';
    if (isFollowing) return 'Following';
    if (isPrivate && pendingRequest) return 'Requested';
    return 'Follow';
  };

  const getFollowIcon = () => {
    if (isBlocked) return <ShieldBan size={15} />;
    if (isFollowing) return <UserCheck size={15} />;
    if (isPrivate && pendingRequest) return <Clock size={15} />;
    return <UserPlus size={15} />;
  };

  return (
    <>
    {showReport && (
      <ReportModal
        reporterId={currentUser?.email}
        reportedUserId={person.email}
        contentType="user"
        contentId={person.email}
        onClose={() => setShowReport(false)}
      />
    )}
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground">
          <X size={20} />
        </button>
        <h2 className="font-heading font-bold text-lg flex-1">Profile</h2>
        {currentUser && person.email !== currentUser.email && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowReport(true)}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Report user"
            >
              <Flag size={17} />
            </button>
            <button
              onClick={() => blockMutation.mutate()}
              disabled={blockMutation.isPending}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={isBlocked ? 'Unblock user' : 'Block user'}
            >
              <ShieldOff size={17} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile info */}
        <div className="flex flex-col items-center pt-8 pb-6 px-4 gap-3">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading font-bold text-2xl overflow-hidden">
            {person.avatar_url
              ? <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
              : person.display_name?.[0]?.toUpperCase() || '?'}
          </div>
          <p className="font-heading font-bold text-xl">{person.display_name}</p>
          {person.handle && <p className="text-sm text-primary font-medium">@{person.handle}</p>}

          <button
            onClick={() => followMutation.mutate()}
            disabled={followMutation.isPending || isBlocked}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors',
              isBlocked
                ? 'bg-destructive/10 text-destructive border border-destructive/30'
                : isFollowing
                  ? 'bg-secondary text-secondary-foreground border border-border'
                  : isPrivate && pendingRequest
                    ? 'bg-muted text-muted-foreground border border-border'
                    : 'bg-primary text-primary-foreground'
            )}
          >
            {getFollowIcon()}
            {getFollowLabel()}
          </button>
        </div>

        {/* Blocked user */}
        {isBlocked ? (
          <div className="flex flex-col items-center gap-3 py-16 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldBan size={28} className="text-destructive" />
            </div>
            <p className="font-heading font-semibold text-lg">User blocked</p>
            <p className="text-sm text-muted-foreground">You have blocked this user. Click the shield icon to unblock.</p>
          </div>
        ) : isPrivate && !isFollowing ? (
          <div className="flex flex-col items-center gap-3 py-16 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Lock size={28} className="text-muted-foreground" />
            </div>
            <p className="font-heading font-semibold text-lg">This account is private</p>
            <p className="text-sm text-muted-foreground">
              {pendingRequest
                ? 'Your follow request is pending approval.'
                : 'Send a follow request to see their posts and workouts.'}
            </p>
          </div>
        ) : (
          <div className="px-4 pb-8">
            {/* Recent workouts */}
            {workoutLogs.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-2 tracking-wide">Recent Workouts</p>
                <div className="flex flex-col gap-2">
                  {workoutLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="flex items-center gap-3 bg-card rounded-xl px-3 py-2.5 border border-border">
                      <Dumbbell size={16} className="text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{log.split_day_name || 'Workout'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(log.started_at || log.created_date).toLocaleDateString()}</p>
                      </div>
                      {log.duration_minutes && (
                        <p className="text-xs text-muted-foreground">{log.duration_minutes}m</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts grid */}
            {postsLoading ? (
              <div className="py-10 text-center text-muted-foreground text-sm">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">No posts yet</div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-2 tracking-wide">Posts</p>
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post) => (
                    <div key={post.id} className="aspect-square bg-muted rounded-md overflow-hidden">
                      {post.image_url
                        ? <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-1 text-center">{post.caption || '📝'}</div>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}