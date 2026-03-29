import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Lock, UserPlus, UserCheck, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UserProfileSheet({ person, currentUser, following, onClose }) {
  const queryClient = useQueryClient();

  const isFollowing = following.some((f) => f.following_id === person.email);
  const isPrivate = person.is_private;

  // Fetch posts only if public or following
  const canViewContent = !isPrivate || isFollowing;

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', person.email],
    queryFn: () => base44.entities.Post.filter({ user_id: person.email, visibility: 'public' }, '-created_date', 20),
    enabled: canViewContent,
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['userWorkoutLogs', person.email],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: person.email }, '-created_date', 5),
    enabled: canViewContent,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const existing = following.find((f) => f.following_id === person.email);
      if (existing) {
        await base44.entities.Follow.delete(existing.id);
      } else {
        await base44.entities.Follow.create({
          follower_id: currentUser.email,
          following_id: person.email,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground">
          <X size={20} />
        </button>
        <h2 className="font-heading font-bold text-lg flex-1">Profile</h2>
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

          <button
            onClick={() => followMutation.mutate()}
            disabled={followMutation.isPending}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors',
              isFollowing
                ? 'bg-secondary text-secondary-foreground border border-border'
                : 'bg-primary text-primary-foreground'
            )}
          >
            {isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />}
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Private account lock */}
        {isPrivate && !isFollowing ? (
          <div className="flex flex-col items-center gap-3 py-16 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Lock size={28} className="text-muted-foreground" />
            </div>
            <p className="font-heading font-semibold text-lg">This account is private</p>
            <p className="text-sm text-muted-foreground">Follow this user to see their posts and workouts.</p>
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
  );
}