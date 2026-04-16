import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, Users, Flame, LogOut, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReportModal from '@/components/moderation/ReportModal';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}



export default function Groups() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('list'); // list | create | join | detail
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['myMemberships', user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_id: user?.email }),
    enabled: !!user,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['allGroups'],
    queryFn: () => base44.entities.Group.list('-created_date', 100),
  });

  const { data: groupMembers = [] } = useQuery({
    queryKey: ['groupMembers', selectedGroup?.id],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: selectedGroup?.id }),
    enabled: !!selectedGroup,
  });

  const myGroups = allGroups.filter((g) =>
    myMemberships.some((m) => m.group_id === g.id)
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const code = generateCode();
      const group = await base44.entities.Group.create({
        name: groupName,
        description: groupDesc,
        created_by: user.email,
        invite_code: code,
      });
      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_id: user.email,
        display_name: user.full_name || user.email,
        streak: 0,
      });
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
      queryClient.invalidateQueries({ queryKey: ['myMemberships'] });
      setGroupName('');
      setGroupDesc('');
      setView('list');
      toast.success('Group created!');
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const group = allGroups.find((g) => g.invite_code === joinCode.toUpperCase());
      if (!group) throw new Error('Invalid invite code');
      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_id: user.email,
        display_name: user.full_name || user.email,
        streak: 0,
      });
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMemberships'] });
      setJoinCode('');
      setView('list');
      toast.success('Joined group!');
    },
    onError: (e) => toast.error(e.message),
  });

  const leaveMutation = useMutation({
    mutationFn: async (groupId) => {
      const membership = myMemberships.find((m) => m.group_id === groupId);
      if (membership) await base44.entities.GroupMember.delete(membership.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMemberships'] });
      setView('list');
      setSelectedGroup(null);
      toast.success('Left group');
    },
  });

  // Fetch all workout logs to determine who completed today
  const { data: allLogs = [] } = useQuery({
    queryKey: ['allLogsForGroup'],
    queryFn: () => base44.entities.WorkoutLog.list('-started_at', 500),
    enabled: !!selectedGroup,
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  // A member "completed today" if they have a WorkoutLog created today
  const memberCompletedToday = (memberId) =>
    allLogs.some((l) => l.user_id === memberId && (l.started_at || l.created_date || '').slice(0, 10) === todayStr);

  const allMembersCompleted = groupMembers.length > 0 && groupMembers.every((m) => memberCompletedToday(m.user_id));

  // Group shared streak = the streak field stored on the group's first member record (same for all)
  const groupStreak = groupMembers[0]?.streak || 0;

  if (view === 'detail' && selectedGroup) {
    return (
      <div className="px-4 pt-6">
        {reportTarget && (
          <ReportModal
            reporterId={user?.email}
            reportedUserId={selectedGroup.created_by}
            contentType="group"
            contentId={selectedGroup.id}
            onClose={() => setReportTarget(null)}
          />
        )}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setView('list')} className="text-muted-foreground text-sm flex-1 text-left">
            ← Back
          </button>
          {user && selectedGroup.created_by !== user.email && (
            <button
              onClick={() => setReportTarget(selectedGroup)}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Flag size={16} />
            </button>
          )}
        </div>
        <h2 className="font-heading font-bold text-xl mb-1">{selectedGroup.name}</h2>
        {selectedGroup.description && (
          <p className="text-muted-foreground text-sm mb-4">{selectedGroup.description}</p>
        )}

        {/* Invite code */}
        <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 mb-6">
          <span className="text-muted-foreground text-sm flex-1">
            Code: <span className="text-foreground font-mono font-bold">{selectedGroup.invite_code}</span>
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(selectedGroup.invite_code)
                .then(() => toast.success('Copied!'))
                .catch(() => toast.error('Could not copy. Please copy it manually.'));
            }}
          >
            <Copy size={15} className="text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>

        {/* Shared Group Streak */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame size={28} className="text-primary flame-glow" />
            <span className="text-5xl font-heading font-bold text-primary streak-pulse">{groupStreak}</span>
          </div>
          <p className="text-muted-foreground text-sm mb-4">Group streak — keep it alive together!</p>
          <div className="flex flex-col gap-2">
            {groupMembers.map((member) => {
              const done = memberCompletedToday(member.user_id);
              return (
                <div key={member.id} className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {member.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="flex-1 text-sm font-medium text-left">{member.display_name}</span>
                  <span className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-full',
                    done ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    {done ? '✓ Done' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
          {allMembersCompleted && (
            <div className="mt-3 text-xs text-primary font-semibold">
              🔥 Everyone's done today — streak grows!
            </div>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 gap-2"
          onClick={() => leaveMutation.mutate(selectedGroup.id)}
        >
          <LogOut size={15} />
          Leave Group
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pb-4">
        <h1 className="text-xl font-heading font-bold mb-4">Groups</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-primary text-primary-foreground gap-1.5 flex-1"
            onClick={() => setView('create')}
          >
            <Plus size={14} /> Create
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-border flex-1 gap-1.5"
            onClick={() => setView('join')}
          >
            <Users size={14} /> Join
          </Button>
        </div>
      </div>

      {view === 'create' && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 slide-up">
          <h3 className="font-heading font-semibold mb-3">Create Group</h3>
          <Input
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="mb-2 bg-input border-border"
          />
          <Input
            placeholder="Description (optional)"
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
            className="mb-3 bg-input border-border"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setView('list')}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-primary text-primary-foreground"
              disabled={!groupName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      {view === 'join' && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 slide-up">
          <h3 className="font-heading font-semibold mb-3">Join with Code</h3>
          <Input
            placeholder="Enter invite code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="mb-3 bg-input border-border font-mono uppercase"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setView('list')}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-primary text-primary-foreground"
              disabled={!joinCode.trim() || joinMutation.isPending}
              onClick={() => joinMutation.mutate()}
            >
              Join
            </Button>
          </div>
        </div>
      )}

      {myGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-4xl">🏆</p>
          <p className="text-muted-foreground text-center text-sm">
            Join or create a group to track shared streaks!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {myGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => { setSelectedGroup(group); setView('detail'); }}
              className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-heading font-semibold">{group.name}</span>
                <div className="flex items-center gap-1">
                  <Flame size={13} className="text-primary" />
                  <span className="text-xs font-bold text-primary">
                    {myMemberships.find((m) => m.group_id === group.id)?.streak || 0}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono ml-2">{group.invite_code}</span>
                </div>
              </div>
              {group.description && (
                <p className="text-muted-foreground text-sm">{group.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}