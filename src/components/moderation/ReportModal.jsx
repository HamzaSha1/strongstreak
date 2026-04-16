import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Flag, ShieldBan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'fake_account', label: 'Fake account' },
  { value: 'other', label: 'Other' },
];

export default function ReportModal({ reporterId, reportedUserId, contentType, contentId, onClose, onBlocked }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await base44.entities.Report.create({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        content_type: contentType,
        content_id: contentId,
        reason,
      });
      toast.success('Report submitted. Thank you for keeping the community safe.');
      onClose();
    } catch {
      toast.error('Could not submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!reportedUserId || reportedUserId === 'unknown') {
      toast.error('Cannot block this user.');
      return;
    }
    setBlocking(true);
    try {
      await base44.entities.Block.create({
        blocker_id: reporterId,
        blocked_id: reportedUserId,
      });
      base44.functions.invoke('notifyBlockEvent', {
        event: { type: 'create' },
        data: { blocker_id: reporterId, blocked_id: reportedUserId },
      }).catch(() => {});
      toast.success('User blocked. Their content has been removed from your feed.');
      onBlocked?.(reportedUserId);
      onClose();
    } catch {
      toast.error('Could not block user. Please try again.');
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full bg-card rounded-t-3xl border-t border-border p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-destructive" />
            <h2 className="font-heading font-bold text-base">Report or Block</h2>
          </div>
          <button onClick={onClose} className="p-1"><X size={18} /></button>
        </div>

        {/* Block section */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-heading font-semibold text-sm text-foreground">Block this user</p>
            <p className="text-xs text-muted-foreground mt-0.5">Removes their content from your feed instantly and notifies our team.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBlock}
            disabled={blocking}
            className="border-destructive text-destructive hover:bg-destructive/10 shrink-0"
          >
            <ShieldBan size={14} />
            {blocking ? 'Blocking...' : 'Block'}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or report content</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <p className="text-sm text-muted-foreground -mt-2">Why are you reporting this?</p>
        <div className="flex flex-col gap-2">
          {REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                reason === r.value
                  ? 'bg-destructive/10 border-destructive/40 text-destructive font-medium'
                  : 'border-border text-foreground hover:border-primary/40'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!reason || loading}
          className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </Button>
      </div>
    </div>
  );
}