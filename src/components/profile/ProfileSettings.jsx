import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LogOut, Trash2, Camera, Eye, EyeOff, Lock, Shield, User, AtSign, Check, X, Loader2, ShieldOff, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function ProfileSettings({ user, profile, setProfile }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { unit: weightUnit, toggle: toggleUnit } = useWeightUnit();

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks', user?.email],
    queryFn: () => base44.entities.Block.filter({ blocker_id: user?.email }),
    enabled: !!user,
    staleTime: 0,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUsers', {});
      return res.data.users || [];
    },
    enabled: !!user,
  });

  const handleUnblock = async (block) => {
    await base44.entities.Block.delete(block.id);
    queryClient.invalidateQueries({ queryKey: ['blocks', user?.email] });
    toast.success('User unblocked');
  };

  const getBlockedUserInfo = (email) => {
    const found = allUsers.find((u) => u.email === email);
    return found || { email, display_name: email.split('@')[0], handle: null, avatar_url: null };
  };
  const [uploading, setUploading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [handleInput, setHandleInput] = useState(profile?.handle || '');
  const [handleStatus, setHandleStatus] = useState('idle'); // idle | checking | available | taken | invalid | same
  const [savingHandle, setSavingHandle] = useState(false);
  const debounceRef = useRef(null);

  const normalizeHandle = (val) => val.toLowerCase().replace(/[^a-z0-9_.]/g, '');

  const handleHandleChange = (e) => {
    const cleaned = normalizeHandle(e.target.value);
    setHandleInput(cleaned);
    setHandleStatus('idle');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (cleaned === profile?.handle) { setHandleStatus('same'); return; }
    if (cleaned.length < 3) { setHandleStatus(cleaned.length > 0 ? 'invalid' : 'idle'); return; }
    setHandleStatus('checking');
    debounceRef.current = setTimeout(async () => {
      const res = await base44.functions.invoke('checkHandle', { handle: cleaned });
      setHandleStatus(res.data.available ? 'available' : 'taken');
    }, 500);
  };

  const saveHandle = async () => {
    if (!['available'].includes(handleStatus)) return;
    setSavingHandle(true);
    await base44.entities.Profile.update(profile.id, { handle: handleInput });
    setProfile({ ...profile, handle: handleInput });
    setHandleStatus('same');
    toast.success('Handle updated!');
    setSavingHandle(false);
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
    } catch {
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
        return;
      }
      setProfile({ ...profile, is_private: newPrivacy });
      toast.success(newPrivacy ? 'Profile is now private' : 'Profile is now public');
    } catch {
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
      await base44.auth.updatePassword?.(passwordForm.oldPassword, passwordForm.newPassword);
      toast.success('Password changed');
      setShowPasswordForm(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to change password');
    }
    setIsChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE MY ACCOUNT') return;
    setIsDeleting(true);
    try {
      await base44.auth.deleteAccount?.();
      toast.success('Account deleted');
      base44.auth.logout('/');
    } catch {
      toast.error('Failed to delete account');
      setIsDeleting(false);
    }
  };

  if (!user || !profile) return null;

  return (
    <div className="px-4 pb-8 pt-4 flex flex-col gap-4">
      {/* User card */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-start gap-4">
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
              <input type="file" accept="image/*" onChange={handleProfilePictureUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
          <div className="flex-1">
            <p className="font-heading font-semibold text-base">{user.full_name}</p>
            <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
            <button
              onClick={handleTogglePrivacy}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              {profile.is_private ? <><Eye size={12} /> Private</> : <><EyeOff size={12} /> Public</>}
            </button>
          </div>
        </div>
      </div>

      {/* Handle */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <p className="font-heading font-semibold text-sm flex items-center gap-1.5"><AtSign size={14} /> Your Handle</p>
          <p className="text-xs text-muted-foreground mt-0.5">This is how you appear on posts and profiles.</p>
        </div>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-muted-foreground font-medium select-none">@</span>
          <Input
            value={handleInput}
            onChange={handleHandleChange}
            placeholder="yourhandle"
            className="pl-8 pr-10"
            maxLength={30}
            autoCapitalize="none"
            autoCorrect="off"
          />
          <div className="absolute right-3">
            {handleStatus === 'checking' && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
            {handleStatus === 'available' && <Check size={16} className="text-green-500" />}
            {handleStatus === 'taken' && <X size={16} className="text-destructive" />}
          </div>
        </div>
        {handleStatus === 'taken' && <p className="text-xs text-destructive">@{handleInput} is already taken</p>}
        {handleStatus === 'available' && <p className="text-xs text-green-500">@{handleInput} is available!</p>}
        {handleStatus === 'invalid' && <p className="text-xs text-destructive">At least 3 characters required</p>}
        <Button onClick={saveHandle} disabled={handleStatus !== 'available' || savingHandle} className="w-full" size="sm">
          {savingHandle ? 'Saving...' : 'Save Handle'}
        </Button>
      </div>

      {/* Password */}
      {!showPasswordForm ? (
        <Button variant="outline" className="w-full gap-2" onClick={() => setShowPasswordForm(true)}>
          <Lock size={16} /> Change Password
        </Button>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
          <Input type="password" placeholder="Current password" value={passwordForm.oldPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} className="bg-input" />
          <Input type="password" placeholder="New password" value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="bg-input" />
          <Input type="password" placeholder="Confirm new password" value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="bg-input" />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setShowPasswordForm(false); setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }} disabled={isChangingPassword}>Cancel</Button>
            <Button className="flex-1" onClick={handleChangePassword} disabled={!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || isChangingPassword}>
              {isChangingPassword ? 'Changing...' : 'Change'}
            </Button>
          </div>
        </div>
      )}

      {/* Background color */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm flex items-center gap-1.5"><Palette size={14} /> App Background</p>
          <p className="text-xs text-muted-foreground">Personalize your app color</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={profile.bg_color || '#0e1117'}
            onChange={async (e) => {
              const color = e.target.value;
              const updated = { ...profile, bg_color: color };
              setProfile(updated);
              if (profile.id) {
                await base44.entities.Profile.update(profile.id, { bg_color: color });
              }
            }}
            className="w-10 h-10 rounded-xl border border-border cursor-pointer bg-transparent p-0.5"
          />
          {profile.bg_color && (
            <button
              onClick={async () => {
                const updated = { ...profile, bg_color: null };
                setProfile(updated);
                if (profile.id) await base44.entities.Profile.update(profile.id, { bg_color: null });
              }}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg border border-border"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Weight unit */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">Weight Unit</p>
          <p className="text-xs text-muted-foreground">Used across all workouts</p>
        </div>
        <button onClick={toggleUnit} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-primary text-primary font-heading font-bold text-sm">
          {weightUnit === 'kg' ? 'KG' : 'LBS'}
        </button>
      </div>

      {/* Blocked Users */}
      {blocks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
          <div>
            <p className="font-heading font-semibold text-sm flex items-center gap-1.5"><ShieldOff size={14} /> Blocked Users</p>
            <p className="text-xs text-muted-foreground mt-0.5">These users can't see your content or interact with you.</p>
          </div>
          <div className="flex flex-col gap-2">
            {blocks.map((block) => {
              const info = getBlockedUserInfo(block.blocked_id);
              return (
                <div key={block.id} className="flex items-center gap-3 py-1">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm overflow-hidden shrink-0">
                    {info.avatar_url
                      ? <img src={info.avatar_url} alt="" className="w-full h-full object-cover" />
                      : (info.handle?.[0] || info.display_name?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {info.handle ? `@${info.handle}` : info.display_name}
                    </p>
                    {info.handle && <p className="text-xs text-muted-foreground truncate">{info.email}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnblock(block)}
                    className="shrink-0 border-primary text-primary hover:bg-primary/10 text-xs"
                  >
                    Unblock
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {user?.role === 'admin' && (
          <Button variant="outline" className="gap-2 justify-start border-primary text-primary hover:bg-primary/10" onClick={() => navigate('/admin')}>
            <Shield size={16} /> Admin Dashboard
          </Button>
        )}
        <Button variant="outline" className="gap-2 justify-start" onClick={() => base44.auth.logout('/')}>
          <LogOut size={16} /> Logout
        </Button>
        <Button variant="outline" className="gap-2 justify-start border-destructive text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 size={16} /> Delete Account
        </Button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-[60]">
          <div className="w-full bg-card rounded-t-3xl p-6 border-t border-border mb-20">
            <h2 className="text-lg font-heading font-bold mb-2">Delete Account?</h2>
            <p className="text-sm text-muted-foreground mb-4">This is permanent and cannot be undone. Type "DELETE MY ACCOUNT" to confirm.</p>
            <input type="text" placeholder='Type DELETE MY ACCOUNT...' value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="w-full h-10 rounded-xl bg-input border border-border px-3 text-sm mb-4" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }} disabled={isDeleting}>Cancel</Button>
              <Button className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteAccount} disabled={deleteInput !== 'DELETE MY ACCOUNT' || isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}