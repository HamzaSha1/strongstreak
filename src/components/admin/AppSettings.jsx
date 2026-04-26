import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { UserPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppSettings() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (e) {
      toast.error(e.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4">

      {/* Invite Users */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
        <div>
          <p className="font-semibold text-sm mb-0.5 flex items-center gap-2"><UserPlus size={15} /> Invite Users</p>
          <p className="text-xs text-muted-foreground">Send an invitation email to a new user.</p>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email address"
            className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary flex-1"
            >
              <option value="user">Regular User</option>
              <option value="admin">Admin</option>
            </select>
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="flex-1"
            >
              {inviting ? <RefreshCw size={14} className="animate-spin" /> : 'Send Invite'}
            </Button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
        <p className="font-semibold text-sm">Platform Info</p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted-foreground">Platform</span>
            <span className="font-medium">Base44</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted-foreground">Auth</span>
            <span className="font-medium">Built-in</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Database</span>
            <span className="font-medium">Managed</span>
          </div>
        </div>
      </div>

      {/* Moderation Settings */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
        <p className="font-semibold text-sm">Moderation</p>
        <p className="text-xs text-muted-foreground">
          Use the <strong>Reports</strong> tab to review flagged content. Admins can mark reports as reviewed, dismiss them, or delete flagged posts directly.
        </p>
        <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground flex flex-col gap-1.5">
          <p>✅ Users can report posts, profiles, and groups</p>
          <p>✅ Admins can review and dismiss reports</p>
          <p>✅ Admins can delete flagged content</p>
          <p>✅ Users can block others</p>
        </div>
      </div>
    </div>
  );
}