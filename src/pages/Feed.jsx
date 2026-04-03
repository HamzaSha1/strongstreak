import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Clock, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import TermsModal from '@/components/moderation/TermsModal';
import ReportModal from '@/components/moderation/ReportModal';

export default function Feed() {
  const [user, setUser] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(true); // assume accepted until we know
  const [reportTarget, setReportTarget] = useState(null); // { postId, postedBy }
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollContainerRef = useRef(null);
  const startYRef = useRef(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setTermsAccepted(!!u?.terms_accepted);
    }).catch(() => {});
  }, []);

  const handleTouchStart = (e) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (scrollContainerRef.current?.scrollTop === 0 && startYRef.current) {
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0) {
        setPullProgress(Math.min(diff / 80, 1));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullProgress >= 1 && !isRefreshing) {
      setIsRefreshing(true);
      await queryClient.refetchQueries({ queryKey: ['posts'] });
      setIsRefreshing(false);
    }
    setPullProgress(0);
    startYRef.current = 0;
  };

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 50),
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks', user?.email],
    queryFn: () => base44.entities.Block.filter({ blocker_id: user?.email }),
    enabled: !!user,
  });
  const blockedIds = new Set(blocks.map((b) => b.blocked_id));

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
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey: ['myLikes', user?.email] });
      const prevLikes = queryClient.getQueryData(['myLikes', user?.email]) || [];
      const isLiked = prevLikes.some((l) => l.post_id === post.id);
      
      const newLikes = isLiked
        ? prevLikes.filter((l) => l.post_id !== post.id)
        : [...prevLikes, { user_id: user.email, post_id: post.id }];
      
      queryClient.setQueryData(['myLikes', user?.email], newLikes);
      
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const prevPosts = queryClient.getQueryData(['posts']) || [];
      const updatedPosts = prevPosts.map((p) =>
        p.id === post.id
          ? { ...p, likes_count: isLiked ? Math.max(0, (p.likes_count || 0) - 1) : (p.likes_count || 0) + 1 }
          : p
      );
      queryClient.setQueryData(['posts'], updatedPosts);
      
      return { prevLikes, prevPosts };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['myLikes'] });
    },
    onError: (err, post, context) => {
      if (context?.prevLikes) queryClient.setQueryData(['myLikes', user?.email], context.prevLikes);
      if (context?.prevPosts) queryClient.setQueryData(['posts'], context.prevPosts);
    },
  });

  const isLiked = (postId) => myLikes.some((l) => l.post_id === postId);

  if (user && !termsAccepted) {
    return <TermsModal onAccepted={() => setTermsAccepted(true)} />;
  }

  return (
    <>
    {reportTarget && (
      <ReportModal
        reporterId={user?.email}
        reportedUserId={reportTarget.postedBy}
        contentType="post"
        contentId={reportTarget.postId}
        onClose={() => setReportTarget(null)}
      />
    )}
    <div
      ref={scrollContainerRef}
      className="pb-4 h-screen overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullProgress > 0 && (
        <div className="flex justify-center pt-4 px-4">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary transition-transform"
              style={{ transform: `rotate(${pullProgress * 360}deg)` }}
            />
            <div className="text-xs text-primary font-bold">{Math.round(pullProgress * 100)}%</div>
          </div>
        </div>
      )}

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
            .filter((p) => p.visibility === 'public' && !blockedIds.has(p.created_by))
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
                      'flex items-center gap-1.5 transition-colors min-h-11 min-w-11',
                      isLiked(post.id) ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Heart
                      size={20}
                      className={cn(isLiked(post.id) && 'fill-red-500')}
                    />
                    <span className="text-sm font-medium">{post.likes_count || 0}</span>
                  </button>
                  {user && post.created_by !== user.email && (
                    <button
                      onClick={() => setReportTarget({ postId: post.id, postedBy: post.created_by })}
                      className="ml-auto text-muted-foreground hover:text-destructive transition-colors min-h-11 min-w-11 flex items-center justify-center"
                    >
                      <Flag size={16} />
                    </button>
                  )}
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
    </>
  );
}