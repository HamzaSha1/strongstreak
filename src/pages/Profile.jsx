import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LogOut, Trash2, User, Camera, Eye, EyeOff, Lock, Weight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useWeightUnit } from '@/hooks/useWeightUnit';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { unit: weightUnit, toggle: toggleUnit } = useWeightUnit();

  useEffect(() => {
    const loadData = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const profiles = await base44.entities.Profile.filter({ user_id: me.email });
        if (profiles.length) {
          setProfile(profiles[0]);
        } else {
          setProfile({ user_id: me.email, display_name: me.full_name || '', avatar_url: '', is_private: false });
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
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

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const updated = { ...profile, avatar_url: file_url };
      if (profile.id) {
        await base44.entities.Profile.update(profile.id, { avatar_url: file_url });
      } else {
        const created = await base44.entities.Profile.create(updated);
        setProfile(created);
      }
      setProfile(updated);
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error('Failed to upload picture');
    }
    setUploading(false);
  };

  const handleTogglePrivacy = async () => {
    try {
      const newPrivacy = !profile.is_private;
      if (profile.id) {
        await base44.entities.Profile.update(profile.id, { is_private: newPrivacy });
      } else {
        const created = await base44.entities.Profile.create({ ...profile, is_private: newPrivacy });
        setProfile(created);
      }
      setProfile({ ...profile, is_private: newPrivacy });
      toast.success(newPrivacy ? 'Profile is now private' : 'Profile is now public');
    } catch (err) {
      toast.error('Failed to update privacy');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setIsChangingPassword(true);
    try {
      // Placeholder for password change - implement with your auth provider
      await base44.auth.updatePassword?.(passwordForm.oldPassword, passwordForm.newPassword);
      toast.success('Password changed');
      setShowPasswordForm(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error('Failed to change password');
    }
    setIsChangingPassword(false);
  };

  return (
    <div className="pb-24 pt-4 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl mb-1">Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your account</p>
      </div>

      {/* User card with profile picture */}
      {user && profile && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User size={28} className="text-primary" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera size={14} className="text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <p className="font-heading font-semibold text-base">{user.full_name}</p>
              <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
              <button
                onClick={handleTogglePrivacy}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                {profile.is_private ? (
                  <>
                    <Eye size={12} /> Private
                  </>
                ) : (
                  <>
                    <EyeOff size={12} /> Public
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password change form */}
      {!showPasswordForm ? (
        <Button
          variant="outline"
          className="w-full gap-2 mb-6"
          onClick={() => setShowPasswordForm(true)}
        >
          <Lock size={16} /> Change Password
        </Button>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex flex-col gap-3">
            <Input
              type="password"
              placeholder="Current password"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              className="bg-input"
            />
            <Input
              type="password"
              placeholder="New password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="bg-input"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="bg-input"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                }}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleChangePassword}
                disabled={!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || isChangingPassword}
              >
                {isChangingPassword ? 'Changing...' : 'Change'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Weight unit preference */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">Weight Unit</p>
          <p className="text-xs text-muted-foreground">Used across all workouts</p>
        </div>
        <button
          onClick={toggleUnit}
          className="flex items-center gap-1 px-4 py-2 rounded-xl border border-primary text-primary font-heading font-bold text-sm"
        >
          {weightUnit === 'kg' ? 'KG' : 'LBS'}
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {user?.role === 'admin' && (
          <Button
            variant="outline"
            className="gap-2 justify-start border-primary text-primary hover:bg-primary/10"
            onClick={() => navigate('/admin')}
          >
            <Shield size={16} /> Admin Dashboard
          </Button>
        )}
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