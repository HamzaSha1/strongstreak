import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LogOut, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE MY ACCOUNT') return;
    
    setIsDeleting(true);
    try {
      // Delete user data and account
      await base44.auth.deleteAccount?.();
      toast.success('Account deleted');
      base44.auth.logout('/');
    } catch (err) {
      toast.error('Failed to delete account');
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  return (
    <div className="pb-24 pt-4 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl mb-1">Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your account</p>
      </div>

      {/* User card */}
      {user && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User size={24} className="text-primary" />
            </div>
            <div>
              <p className="font-heading font-semibold">{user.full_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Role: <span className="capitalize">{user.role || 'user'}</span>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          className="gap-2 justify-start"
          onClick={handleLogout}
        >
          <LogOut size={16} /> Logout
        </Button>
        
        <Button
          variant="outline"
          className="gap-2 justify-start border-destructive text-destructive hover:bg-destructive/10"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 size={16} /> Delete Account
        </Button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-[60]">
          <div className="w-full bg-card rounded-t-3xl p-6 border-t border-border mb-20">
            <h2 className="text-lg font-heading font-bold mb-2">Delete Account?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This is permanent and cannot be undone. Type "DELETE MY ACCOUNT" to confirm.
            </p>
            <input
              type="text"
              placeholder="Type DELETE MY ACCOUNT..."
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="w-full h-10 rounded-xl bg-input border border-border px-3 text-sm mb-4"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteInput('');
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE MY ACCOUNT' || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}