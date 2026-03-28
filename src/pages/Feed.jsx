import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Feed() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 50),
  });

  const { data: myLikes = [] } = useQuery({
    queryKey: ['myLikes', user?.email],
    queryFn: () => base44.entities.PostLike.filter({ user_id: user?.email }),
    enabled: !!user,
  });

  const likeMutation = useMutation({
    mutationFn: async (post) => {
      const existing = myLikes.find((l) => l.post_id === post.id);
      if (existing) {
        await base44.entities.PostLike.delete(existing.id);
        await base44.entities.Post.update(post.id, { likes_count: Math.max(0, (post.likes_count || 0) - 1) });
      } else {
        await base44.entities.PostLike.create({ user_id: user.email, post_id: post.id });
        await base44.entities.Post.update(post.id, { likes_count: (post.likes_count || 0) + 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['myLikes'] });
    },
  });

  const isLiked = (postId) => myLikes.some((l) => l.post_id === postId);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4">
        <h1 className="text-xl font-heading font-bold">Feed</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.filter((p) => p.visibility === 'public').length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 gap-3">
          <p className="text-4xl">🏋️</p>
          <p className="text-muted-foreground text-center text-sm">
            No posts yet. Complete a workout and share your progress!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {posts
            .filter((p) => p.visibility === 'public')
            .map((post) => (
              <div key={post.id} className="border-b border-border">
                {/* User row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading font-bold text-sm">
                    {post.created_by?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{post.created_by?.split('@')[0] || 'User'}</p>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {/* Image */}
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full aspect-square object-cover"
                  />
                )}

                {/* Actions */}
                <div className="px-4 pt-3 pb-1 flex items-center gap-3">
                  <button
                    onClick={() => user && likeMutation.mutate(post)}
                    className={cn(
                      'flex items-center gap-1.5 transition-colors',
                      isLiked(post.id) ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Heart
                      size={20}
                      className={cn(isLiked(post.id) && 'fill-red-500')}
                    />
                    <span className="text-sm font-medium">{post.likes_count || 0}</span>
                  </button>
                </div>

                {/* Caption */}
                {post.caption && (
                  <p className="px-4 pb-4 text-sm text-foreground">{post.caption}</p>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}