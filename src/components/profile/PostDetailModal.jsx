import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, Heart, Pencil, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import EditPostModal from '@/components/profile/EditPostModal';

export default function PostDetailModal({ post, onClose, onUpdated, onDeleted }) {
  const [showEdit, setShowEdit] = useState(false);

  const { data: likes = [] } = useQuery({
    queryKey: ['postLikes', post.id],
    queryFn: () => base44.entities.PostLike.filter({ post_id: post.id }),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsersDetail'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUsers', {});
      return res.data.users || [];
    },
    staleTime: 60_000,
  });

  const getUserName = (email) => {
    const u = allUsers.find((u) => u.email === email);
    return u?.full_name || email?.split('@')[0] || 'User';
  };

  const getUserAvatar = (email) => {
    const u = allUsers.find((u) => u.email === email);
    return u?.avatar_url || null;
  };

  if (showEdit) {
    return (
      <EditPostModal
        post={post}
        onClose={() => setShowEdit(false)}
        onUpdated={(updated) => {
          onUpdated(updated);
          onClose();
        }}
        onDeleted={(id) => {
          onDeleted(id);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground"><X size={20} /></button>
        <h2 className="font-heading font-bold text-lg flex-1">Post</h2>
        <button
          onClick={() => setShowEdit(true)}
          className="flex items-center gap-1.5 text-sm text-primary font-medium px-3 py-1.5 rounded-xl hover:bg-primary/10 transition-colors"
        >
          <Pencil size={14} /> Edit
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Image */}
        {post.image_url && (
          <img src={post.image_url} alt="" className="w-full aspect-square object-cover" />
        )}

        {/* Meta */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-2 text-muted-foreground text-xs">
          <Clock size={11} />
          <span>{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</span>
          <span className="ml-auto capitalize text-xs bg-muted px-2 py-0.5 rounded-full">{post.visibility}</span>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="px-4 py-2 text-sm text-foreground">{post.caption}</p>
        )}

        {/* Likes summary */}
        <div className="px-4 py-3 border-t border-border mt-1">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} className="text-red-500 fill-red-500" />
            <span className="font-heading font-semibold text-sm">{post.likes_count || likes.length} likes</span>
          </div>

          {likes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No likes yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {likes.map((like) => (
                <div key={like.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                    {getUserAvatar(like.user_id)
                      ? <img src={getUserAvatar(like.user_id)} alt="" className="w-full h-full object-cover" />
                      : <span className="text-primary font-heading font-bold text-xs">{getUserName(like.user_id)[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <span className="text-sm font-medium">{getUserName(like.user_id)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}