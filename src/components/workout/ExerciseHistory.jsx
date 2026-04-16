import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, TrendingUp, History } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

function groupBySessions(logs) {
  const seen = new Map();
  const sessions = [];
  for (const log of logs) {
    if (!seen.has(log.workout_log_id)) {
      seen.set(log.workout_log_id, { workout_log_id: log.workout_log_id, date: log.created_date, sets: [] });
      sessions.push(seen.get(log.workout_log_id));
    }
    seen.get(log.workout_log_id).sets.push(log);
  }
  sessions.forEach((s) => s.sets.sort((a, b) => a.set_number - b.set_number));
  // oldest → newest for chart
  return sessions.reverse();
}

export default function ExerciseHistory({ exerciseName, userId, weightUnit = 'kg', toDisplay = (v) => v }) {
  const [open, setOpen] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['exerciseHistory', userId, exerciseName],
    queryFn: () =>
      base44.entities.SetLog.filter(
        { user_id: userId, exercise_name: exerciseName, completed: true },
        '-created_date',
        150
      ),
    enabled: !!userId && !!exerciseName && open,
  });

  const sessions = groupBySessions(logs);

  // Chart data: max weight per session (for trend chart)
  const chartData = sessions.map((s) => ({
    date: s.date ? format(new Date(s.date), 'MMM d') : '?',
    weight: s.sets.length ? Math.max(0, ...s.sets.map((x) => toDisplay(x.weight_kg) || 0)) : 0,
    reps: Math.round(s.sets.reduce((acc, x) => acc + (x.reps || 0), 0) / s.sets.length),
  }));

  // Last session set-by-set chart data
  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const lastSessionChartData = lastSession
    ? lastSession.sets.map((s) => ({
        set: `Set ${s.set_number}`,
        weight: toDisplay(s.weight_kg) || 0,
        reps: s.reps || 0,
      }))
    : [];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/15 transition-colors px-3 py-1.5 rounded-xl mb-2"
      >
        <History size={12} />
        View Progression
      </button>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative bg-card rounded-t-3xl border-t border-border flex flex-col max-h-[85vh]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div>
                <h2 className="font-heading font-bold text-base">{exerciseName}</h2>
                <p className="text-xs text-muted-foreground">Weight & rep progression</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-secondary">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-10">No history yet for this exercise.</p>
              ) : (
                <>
                  {/* Last Session — set-by-set chart */}
                  {lastSession && lastSessionChartData.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <TrendingUp size={12} /> Last Session — Set by Set
                      </p>
                      <p className="text-[10px] text-muted-foreground mb-3">
                        {lastSession.date ? format(new Date(lastSession.date), 'MMM d, yyyy') : ''}
                      </p>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={lastSessionChartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="set" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis yAxisId="weight" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis yAxisId="reps" orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                          />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Line
                            yAxisId="weight"
                            type="monotone"
                            dataKey="weight"
                            name={`Weight (${weightUnit})`}
                            stroke="hsl(var(--primary))"
                            strokeWidth={2.5}
                            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            yAxisId="reps"
                            type="monotone"
                            dataKey="reps"
                            name="Reps"
                            stroke="hsl(210 40% 65%)"
                            strokeWidth={2}
                            strokeDasharray="4 3"
                            dot={{ fill: 'hsl(210 40% 65%)', r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Weight progression trend across sessions */}
                  {chartData.length > 1 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <TrendingUp size={12} /> Max Weight Trend ({weightUnit})
                      </p>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                            formatter={(val) => [`${val} ${weightUnit}`, 'Max Weight']}
                          />
                          <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2.5}
                            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Session history — newest first */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Session History</p>
                    <div className="flex flex-col gap-3">
                      {[...sessions].reverse().map((session, i) => (
                        <div key={session.workout_log_id} className={`rounded-2xl p-3 border ${i === 0 ? 'border-primary/30 bg-primary/10' : 'border-border bg-muted/30'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-semibold text-muted-foreground">
                              {session.date ? format(new Date(session.date), 'MMM d, yyyy') : 'Past session'}
                            </p>
                            {i === 0 && <span className="text-[10px] text-primary font-semibold bg-primary/15 px-2 py-0.5 rounded-full">Last</span>}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {session.sets.map((s, idx) => (
                              <div key={idx} className="flex flex-col items-center bg-muted rounded-xl px-3 py-1.5 min-w-[52px]">
                                <span className="text-[10px] text-muted-foreground">Set {s.set_number}</span>
                                <span className="text-sm font-bold">{s.reps}<span className="text-xs font-normal text-muted-foreground"> reps</span></span>
                                <span className="text-xs font-semibold text-primary">{toDisplay(s.weight_kg)}{weightUnit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}