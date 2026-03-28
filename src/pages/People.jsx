import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, UserCheck, Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function calcStreak(logs) {
  if (!logs?.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const logDates = [...new Set(logs.map((l) => {
    const d = new Date(l.started_at || l.created_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }))].sort((a, b) => b - a);
  let streak = 0;
  let check = today.getTime();
  for (const ts of logDates) {
    if (ts === check || ts === check - 86400000) {
      streak++;
      check = ts - 86400000;
    } else break;
  }
  return streak;
}

export default function People() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
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

  // Fetch all workout logs so we can compute per-user streaks
  const { data: allLogs = [] } = useQuery({
    queryKey: ['allWorkoutLogs'],
    queryFn: () => base44.entities.WorkoutLog.list('-started_at', 500),
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

  const filtered = allUsers.filter((u) => {
    if (u.email === user?.email) return false;
    if (!search.trim()) return true;
    const name = (u.full_name || u.email || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="pb-4">
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
          <div className="py-20 text-center text-muted-foreground text-sm">No users found</div>
        ) : (
          filtered.map((u) => (
            <div key={u.email} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading font-bold">
                {(u.full_name || u.email)?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{u.full_name || u.email?.split('@')[0]}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              {(() => {
                const userLogs = allLogs.filter((l) => l.user_id === u.email);
                const s = calcStreak(userLogs);
                return s > 0 ? (
                  <div className="flex items-center gap-1 mr-1">
                    <Flame size={13} className="text-primary flame-glow" />
                    <span className="text-primary text-xs font-bold">{s}</span>
                  </div>
                ) : null;
              })()}
              <button
                onClick={() => followMutation.mutate(u)}
                className={cn(
                  'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors',
                  isFollowing(u.email)
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
                )}
              >
                {isFollowing(u.email) ? <UserCheck size={13} /> : <UserPlus size={13} />}
                {isFollowing(u.email) ? 'Following' : 'Follow'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}