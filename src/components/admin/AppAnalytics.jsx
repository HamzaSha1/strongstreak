import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Image, Dumbbell, Flag, UsersRound } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const STAT_CARDS = [
  { key: 'users', label: 'Total Users', icon: Users, color: 'text-blue-400' },
  { key: 'workouts', label: 'Total Workouts', icon: Dumbbell, color: 'text-primary' },
  { key: 'posts', label: 'Total Posts', icon: Image, color: 'text-purple-400' },
  { key: 'groups', label: 'Groups', icon: UsersRound, color: 'text-green-400' },
  { key: 'reports', label: 'Pending Reports', icon: Flag, color: 'text-destructive' },
];

export default function AppAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: () => base44.functions.invoke('adminGetAnalytics', {}),
    select: (res) => res.data,
    refetchInterval: 60000,
  });

  const totals = data?.totals || {};
  const activityChart = (data?.activityChart || []).map((d) => ({
    ...d,
    label: d.date ? format(new Date(d.date), 'MMM d') : d.date,
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-muted ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold">{totals[key] ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-semibold mb-4">Workouts — Last 7 Days</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={activityChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
              cursor={{ fill: 'hsl(var(--primary)/0.1)' }}
            />
            <Bar dataKey="workouts" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}