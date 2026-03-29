import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import UserProfileSheet from '@/components/people/UserProfileSheet';

export default function People() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUsers', {});
      return res.data.users || [];
    },
    enabled: !!user,
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following', user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_id: user?.email }),
    enabled: !!user,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', user?.email],
    queryFn: () => base44.entities.Follow.filter({ following_id: user?.email }),
    enabled: !!user,
  });

  const followMutation = useMutation({
    mutationFn: async (targetUser) => {
      const existing = following.find((f) => f.following_id === targetUser.email);
      if (existing) {
        await base44.entities.Follow.delete(existing.id);
      } else {
        await base44.entities.Follow.create({
          follower_id: user.email,
          following_id: targetUser.email,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  const isFollowing = (email) => following.some((f) => f.following_id === email);

  const filtered = search.trim()
    ? allUsers.filter((p) => {
        const name = (p.display_name + ' ' + p.email).toLowerCase();
        return name.includes(search.toLowerCase());
      })
    : [];

  return (
    <div className="pb-4">
      {selectedUser && (
        <UserProfileSheet
          person={selectedUser}
          currentUser={user}
          following={following}
          onClose={() => setSelectedUser(null)}
        />
      )}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4">
        <h1 className="text-xl font-heading font-bold mb-3">People</h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9 bg-input border-border"
          />
        </div>
      </div>

      {/* Stats */}
      {user && (
        <div className="flex gap-6 px-4 py-4 border-b border-border">
          <div className="text-center">
            <p className="font-heading font-bold text-xl text-primary">{following.length}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
          <div className="text-center">
            <p className="font-heading font-bold text-xl">{followers.length}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
        </div>
      )}

      <div className="flex flex-col divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">
            {search.trim() ? 'No users found' : 'Search for people to follow'}
          </div>
        ) : (
          filtered.map((p) => (
            <div key={p.email} className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setSelectedUser(p)}>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading font-bold overflow-hidden">
                {p.avatar_url
                  ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  : p.display_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.display_name}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); followMutation.mutate({ email: p.email }); }}
                className={cn(
                  'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors',
                  isFollowing(p.email)
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
                )}
              >
                {isFollowing(p.email) ? <UserCheck size={13} /> : <UserPlus size={13} />}
                {isFollowing(p.email) ? 'Following' : 'Follow'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}