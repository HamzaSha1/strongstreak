import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { AtSign, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function HandleSetupModal({ user, onComplete }) {
  const [handle, setHandle] = useState('');
  const [status, setStatus] = useState('idle'); // idle | checking | available | taken | invalid
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef(null);

  const normalize = (val) => val.toLowerCase().replace(/[^a-z0-9_.]/g, '');

  const handleChange = (e) => {
    const raw = e.target.value;
    const cleaned = normalize(raw);
    setHandle(cleaned);
    setStatus('idle');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (cleaned.length < 3) {
      setStatus(cleaned.length > 0 ? 'invalid' : 'idle');
      return;
    }

    setStatus('checking');
    debounceRef.current = setTimeout(async () => {
      const res = await base44.functions.invoke('checkHandle', { handle: cleaned });
      setStatus(res.data.available ? 'available' : 'taken');
    }, 500);
  };

  const handleSubmit = async () => {
    if (status !== 'available' || handle.length < 3) return;
    setSaving(true);

    // Check if profile exists
    const profiles = await base44.entities.Profile.filter({ user_id: user.email });
    if (profiles.length > 0) {
      await base44.entities.Profile.update(profiles[0].id, { handle });
    } else {
      await base44.entities.Profile.create({
        user_id: user.email,
        display_name: user.full_name || handle,
        handle,
        is_private: false,
      });
    }

    setSaving(false);
    onComplete(handle);
  };

  const statusIcon = () => {
    if (status === 'checking') return <Loader2 size={16} className="animate-spin text-muted-foreground" />;
    if (status === 'available') return <Check size={16} className="text-green-500" />;
    if (status === 'taken') return <X size={16} className="text-destructive" />;
    return null;
  };

  const statusText = () => {
    if (status === 'invalid') return 'Handle must be at least 3 characters';
    if (status === 'taken') return '@' + handle + ' is already taken';
    if (status === 'available') return '@' + handle + ' is available!';
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Icon */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <AtSign size={32} className="text-primary" />
          </div>
          <h1 className="font-heading font-bold text-2xl">Choose your handle</h1>
          <p className="text-sm text-muted-foreground">
            Your handle is your unique identity on StrongStreak. It will appear on your profile and posts.
          </p>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-muted-foreground font-medium select-none">@</span>
            <Input
              value={handle}
              onChange={handleChange}
              placeholder="yourhandle"
              className="pl-8 pr-10"
              maxLength={30}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <div className="absolute right-3">{statusIcon()}</div>
          </div>
          {statusText() && (
            <p className={`text-xs px-1 ${status === 'available' ? 'text-green-500' : 'text-destructive'}`}>
              {statusText()}
            </p>
          )}
          <p className="text-xs text-muted-foreground px-1">Only letters, numbers, underscores, and dots. Min 3 characters.</p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={status !== 'available' || saving}
          className="w-full bg-primary text-primary-foreground"
        >
          {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
          {saving ? 'Saving...' : 'Confirm handle'}
        </Button>
      </div>
    </div>
  );
}