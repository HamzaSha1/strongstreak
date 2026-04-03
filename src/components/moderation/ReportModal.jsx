import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'fake_account', label: 'Fake account' },
  { value: 'other', label: 'Other' },
];

export default function ReportModal({ reporterId, reportedUserId, contentType, contentId, onClose }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    await base44.entities.Report.create({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      content_type: contentType,
      content_id: contentId,
      reason,
    });
    toast.success('Report submitted. Thank you for keeping the community safe.');
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full bg-card rounded-t-3xl border-t border-border p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-destructive" />
            <h2 className="font-heading font-bold text-base">Report Content</h2>
          </div>
          <button onClick={onClose} className="p-1"><X size={18} /></button>
        </div>
        <p className="text-sm text-muted-foreground">Why are you reporting this?</p>
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