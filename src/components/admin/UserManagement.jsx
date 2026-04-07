import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Shield, ShieldOff, Trash2, Crown, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import UserProfileSheet from '@/components/people/UserProfileSheet';

export default function UserManagement({ currentUser }) {
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => base44.functions.invoke('adminGetUsers', {}),
    select: (res) => res.data.users,
  });

  const users = data || [];

  const updateMutation = useMutation({
    mutationFn: ({ userId, updates }) =>
      base44.functions.invoke('adminUpdateUser', { userId, updates }),
    onSuccess: (_, { updates }) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success(updates.role ? `Role changed to ${updates.role}` : 'User updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ userId }) => base44.functions.invoke('adminDeleteUser', { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User and all their data deleted');
      setConfirmDelete(null);
    },
    onError: (err) => {
      toast.error('Failed to delete user: ' + (err?.response?.data?.error || err.message));
    },
  });

  const filtered = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      {selectedProfile && (
        <UserProfileSheet
          person={selectedProfile}
          currentUser={currentUser}
          following={[]}
          onClose={() => setSelectedProfile(null)}
        />
      )}
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full bg-secondary rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-foreground">{users.length}</p>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-primary">{users.filter((u) => u.role === 'admin').length}</p>
          <p className="text-xs text-muted-foreground">Admins</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-foreground">{users.filter((u) => u.role !== 'admin').length}</p>
          <p className="text-xs text-muted-foreground">Regular Users</p>
        </div>
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((u) => (
            <div key={u.id} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 overflow-hidden">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (u.display_name?.[0] || '?').toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedProfile({ email: u.email, full_name: u.display_name, display_name: u.display_name, avatar_url: u.avatar_url })}
                      className="font-semibold text-sm truncate hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {u.display_name}
                      <ExternalLink size={11} className="text-muted-foreground" />
                    </button>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                      {u.role === 'admin' ? <><Crown size={10} className="mr-1" />Admin</> : 'User'}
                    </Badge>
                    {u.id === currentUser?.id && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">You</Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  {u.created_date && (
                    <p className="text-[11px] text-muted-foreground/60">
                      Joined {formatDistanceToNow(new Date(u.created_date), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions — skip for self */}
              {u.id !== currentUser?.id && (
                <div className="flex gap-2 pt-1 border-t border-border flex-wrap">
                  {/* Toggle role */}
                  <button
                    onClick={() => updateMutation.mutate({ userId: u.id, updates: { role: u.role === 'admin' ? 'user' : 'admin' } })}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors"
                  >
                    {u.role === 'admin' ? <><ShieldOff size={12} /> Remove Admin</> : <><Shield size={12} /> Make Admin</>}
                  </button>

                  {/* Delete */}
                  {confirmDelete === u.id ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs text-destructive">Sure?</span>
                      <button
                        onClick={() => deleteMutation.mutate({ userId: u.id })}
                        className="text-xs px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(u.id)}
                      className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-destructive hover:text-destructive transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-10">No users found</p>
          )}
        </div>
      )}
    </div>
  );
}