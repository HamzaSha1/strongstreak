import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

/**
 * Shows the user's history for a specific exercise.
 * Groups set logs by workout session and displays up to N recent sessions.
 */
export default function ExerciseHistory({ exerciseName, userId, weightUnit = 'kg', toDisplay = (v) => v }) {
  const [expanded, setExpanded] = useState(false);

  const { data: logs = [] } = useQuery({
    queryKey: ['exerciseHistory', userId, exerciseName],
    queryFn: () =>
      base44.entities.SetLog.filter(
        { user_id: userId, exercise_name: exerciseName, completed: true },
        '-created_date',
        100
      ),
    enabled: !!userId && !!exerciseName && expanded,
  });

  // Group by workout_log_id
  const sessions = [];
  const seen = new Map();
  for (const log of logs) {
    if (!seen.has(log.workout_log_id)) {
      seen.set(log.workout_log_id, { workout_log_id: log.workout_log_id, date: log.created_date, sets: [] });
      sessions.push(seen.get(log.workout_log_id));
    }
    seen.get(log.workout_log_id).sets.push(log);
  }
  // Sort sets within each session
  sessions.forEach((s) => s.sets.sort((a, b) => a.set_number - b.set_number));

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide history' : 'View history'}
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-2 max-h-48 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No history yet</p>
          ) : (
            sessions.map((session) => (
              <div key={session.workout_log_id} className="bg-muted/40 rounded-xl p-2.5">
                <p className="text-[10px] text-muted-foreground mb-1.5">
                  {session.date ? format(new Date(session.date), 'MMM d, yyyy') : 'Past session'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {session.sets.map((s, i) => (
                    <span key={i} className="text-xs bg-muted rounded-lg px-2 py-0.5 font-mono">
                      {s.reps}×{toDisplay(s.weight_kg)}{weightUnit}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}