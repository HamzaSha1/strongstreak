import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Flag, CheckCircle, XCircle, Trash2, RefreshCw, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ReportCard from '@/components/admin/ReportCard';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setAuthChecked(true);
    }).catch(() => setAuthChecked(true));
  }, []);

  if (!authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
        <Shield size={48} className="text-destructive" />
        <h1 className="font-heading font-bold text-xl">Access Denied</h1>
        <p className="text-muted-foreground text-sm">This page is only accessible to administrators.</p>
      </div>
    );
  }

  return <AdminContent statusFilter={statusFilter} setStatusFilter={setStatusFilter} user={user} />;
}

function AdminContent({ statusFilter, setStatusFilter, user }) {
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['adminReports'],
    queryFn: () => base44.entities.Report.list('-created_date', 200),
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Report.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      toast.success('Report updated');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async ({ postId, reportId }) => {
      await base44.entities.Post.delete(postId);
      await base44.entities.Report.update(reportId, { status: 'reviewed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted and report marked as reviewed');
    },
  });

  const filtered = statusFilter === 'all'
    ? reports
    : reports.filter((r) => r.status === statusFilter);

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    reviewed: reports.filter((r) => r.status === 'reviewed').length,
    dismissed: reports.filter((r) => r.status === 'dismissed').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-primary" />
          <h1 className="font-heading font-bold text-lg">Moderation Dashboard</h1>
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'reviewed', label: 'Reviewed' },
          { key: 'dismissed', label: 'Dismissed' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Flag size={36} className="text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No reports found</p>
          </div>
        ) : (
          filtered.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onMarkReviewed={() => updateReportMutation.mutate({ id: report.id, status: 'reviewed' })}
              onDismiss={() => updateReportMutation.mutate({ id: report.id, status: 'dismissed' })}
              onDeletePost={() => deletePostMutation.mutate({ postId: report.content_id, reportId: report.id })}
            />
          ))
        )}
      </div>
    </div>
  );
}