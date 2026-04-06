import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Clock, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import ReportModal from '@/components/moderation/ReportModal';
import UserProfileSheet from '@/components/people/UserProfileSheet';
import { useAuth } from '@/lib/AuthContext';

export default function Feed() {
  const { user } = useAuth();
  const [reportTarget, setReportTarget] = useState(null); // { postId, postedBy }
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [locallyBlockedIds, setLocallyBlockedIds] = useState(new Set());
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollContainerRef = useRef(null);
  const startYRef = useRef(0);
  const queryClient = useQueryClient();

  // Refetch blocks on component mount to ensure fresh data
  useEffect(() => {
    if (user?.email) {
      queryClient.refetchQueries({ queryKey: ['blocks', user.email] });
    }
  }, [user?.email, queryClient]);

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
    staleTime: 0,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks', user?.email],
    queryFn: () => base44.entities.Block.filter({ blocker_id: user?.email }),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
  const blockedIds = new Set([...blocks.map((b) => b.blocked_id), ...locallyBlockedIds]);

  const { data: following = [] } = useQuery({
    queryKey: ['following', user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_id: user?.email }),
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers', user?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUsers', {});
      return res.data.users || [];
    },
    enabled: !!user,
    staleTime: 30_000,
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

  const getProfileData = (email) => {
    if (email === user?.email) {
      return { email, full_name: user.full_name || email?.split('@')[0], avatar_url: null };
    }
    const found = allUsers.find((u) => u.email === email);
    return found || { email, full_name: email?.split('@')[0] || 'User', avatar_url: null };
  };

  return (
    <>
    {selectedProfile && (
      <UserProfileSheet
        person={selectedProfile}
        currentUser={user}
        following={following}
        onClose={() => setSelectedProfile(null)}
      />
    )}
    {reportTarget && (
      <ReportModal
        reporterId={user?.email}
        reportedUserId={reportTarget.postedBy}
        contentType="post"
        contentId={reportTarget.postId}
        onClose={() => setReportTarget(null)}
        onBlocked={(blockedUserId) => {
          // Immediately hide posts via local state (instant, no cache dependency)
          setLocallyBlockedIds((prev) => new Set([...prev, blockedUserId]));
          // Refetch blocks to sync with server
          queryClient.refetchQueries({ queryKey: ['blocks', user?.email] });
        }}
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
                <button
                  onClick={() => setSelectedProfile(getProfileData(post.created_by))}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left active:opacity-70 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading font-bold text-sm overflow-hidden shrink-0">
                    {(() => {
                      const p = getProfileData(post.created_by);
                      return p?.avatar_url
                        ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        : (p?.full_name?.[0] || post.created_by?.[0] || '?').toUpperCase();
                    })()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{getProfileData(post.created_by)?.full_name || post.created_by?.split('@')[0] || 'User'}</p>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
                    </div>
                  </div>
                </button>

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
                  {user && (post.user_id || post.created_by) !== user.email && (
                    <button
                      onClick={() => {
                        setReportTarget({ postId: post.id, postedBy: post.user_id || post.created_by || '' });
                      }}
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