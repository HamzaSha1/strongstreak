import { useState } from 'react';
import { Flag, CheckCircle, XCircle, Trash2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const REASON_LABELS = {
  spam: 'Spam',
  harassment: 'Harassment or bullying',
  inappropriate_content: 'Inappropriate content',
  fake_account: 'Fake account',
  other: 'Other',
};

const STATUS_COLORS = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  reviewed: 'bg-green-500/15 text-green-400 border-green-500/30',
  dismissed: 'bg-muted text-muted-foreground border-border',
};

export default function ReportCard({ report, onMarkReviewed, onDismiss, onDeletePost }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: post } = useQuery({
    queryKey: ['post', report.content_id],
    queryFn: () => base44.entities.Post.filter({ id: report.content_id }),
    enabled: !!report.content_id && report.content_type === 'post' && expanded,
    select: (data) => data?.[0],
  });

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Top row */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Flag size={14} className="text-destructive shrink-0" />
            <span className="text-sm font-medium truncate">{REASON_LABELS[report.reason] || report.reason}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[report.status]}`}>
              {report.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Reported by <span className="text-foreground font-medium">{report.reporter_id?.split('@')[0]}</span>
            {report.reported_user_id && report.reported_user_id !== 'unknown' && (
              <> · against <span className="text-foreground font-medium">{report.reported_user_id?.split('@')[0]}</span></>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {report.created_date ? formatDistanceToNow(new Date(report.created_date), { addSuffix: true }) : ''}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground ml-2 shrink-0"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-3 flex flex-col gap-3 border-t border-border pt-3">
          {/* Post preview */}
          {report.content_type === 'post' && post && (
            <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
              {post.image_url && (
                <img src={post.image_url} alt="Reported post" className="w-full max-h-48 object-cover" />
              )}
              {post.caption && (
                <p className="text-xs text-foreground px-3 py-2">{post.caption}</p>
              )}
              {!post.image_url && !post.caption && (
                <p className="text-xs text-muted-foreground px-3 py-2 italic">Post has no visible content</p>
              )}
            </div>
          )}
          {report.content_type === 'post' && !post && (
            <p className="text-xs text-muted-foreground italic">Post no longer exists or was already deleted.</p>
          )}

          {/* Actions */}
          {report.status === 'pending' && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={onMarkReviewed}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-medium hover:bg-green-500/20 transition-colors"
              >
                <CheckCircle size={13} /> Mark Reviewed
              </button>
              <button
                onClick={onDismiss}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-muted-foreground border border-border text-xs font-medium hover:bg-secondary transition-colors"
              >
                <XCircle size={13} /> Dismiss
              </button>
              {report.content_type === 'post' && post && (
                confirmDelete ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onDeletePost(); setConfirmDelete(false); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-medium transition-colors"
                    >
                      <Trash2 size={13} /> Confirm Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 size={13} /> Delete Post
                  </button>
                )
              )}
            </div>
          )}
          {report.status !== 'pending' && (
            <p className="text-xs text-muted-foreground italic">This report has already been {report.status}.</p>
          )}
        </div>
      )}
    </div>
  );
}