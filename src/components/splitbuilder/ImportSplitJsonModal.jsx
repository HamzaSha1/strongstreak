import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, X, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportSplitJsonModal({ user, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const handleFile = (e) => {
    setError('');
    setPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.split_name || !Array.isArray(data.days)) {
          setError('Invalid split file. Make sure it was exported from this app.');
          return;
        }
        setPreview(data);
      } catch {
        setError('Could not parse file. Please upload a valid JSON split file.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview || !user) return;
    setLoading(true);
    try {
      // Check for name collision and suffix if needed
      const existingDays = await base44.entities.SplitDay.filter({ user_id: user.email });
      const existingNames = new Set(existingDays.map((d) => d.split_name));
      let splitName = preview.split_name;
      if (existingNames.has(splitName)) {
        splitName = `${splitName} (Imported)`;
      }

      for (const day of preview.days) {
        const savedDay = await base44.entities.SplitDay.create({
          user_id: user.email,
          split_name: splitName,
          day_of_week: day.day_of_week,
          session_type: day.session_type,
          order_index: day.order_index,
        });
        for (const ex of (day.exercises || [])) {
          await base44.entities.SplitExercise.create({
            split_day_id: savedDay.id,
            user_id: user.email,
            name: ex.name,
            exercise_type: ex.exercise_type,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            rpe: ex.rpe,
            rest_seconds: ex.rest_seconds,
            cardio_metric: ex.cardio_metric,
            image_url: ex.image_url,
            order_index: ex.order_index,
            notes: ex.notes,
            superset_group: ex.superset_group,
            dropset_count: ex.dropset_count,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['splitDays'] });
      queryClient.invalidateQueries({ queryKey: ['splitExercises'] });
      toast.success(`"${splitName}" imported!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Import failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const trainingDays = preview?.days.filter((d) => d.session_type && d.session_type !== 'Rest').length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card rounded-t-3xl border-t border-border p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-base">Import Split from File</h2>
          <button onClick={onClose} className="text-muted-foreground p-1">
            <X size={18} />
          </button>
        </div>

        {!preview ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl p-8 hover:border-primary/50 transition-colors"
          >
            <Upload size={28} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Tap to select a <span className="text-primary font-semibold">.json</span> split file</p>
          </button>
        ) : (
          <div className="bg-secondary/50 rounded-2xl p-4 flex flex-col gap-2">
            <p className="font-heading font-bold text-sm">{preview.split_name}</p>
            <p className="text-xs text-muted-foreground">{trainingDays} training day{trainingDays !== 1 ? 's' : ''} · {preview.days.length} days total</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {preview.days.filter((d) => d.session_type && d.session_type !== 'Rest').map((d) => (
                <span key={d.day_of_week} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-lg">
                  {d.day_of_week}: {d.session_type}
                </span>
              ))}
            </div>
            <button
              onClick={() => { setPreview(null); setError(''); }}
              className="text-xs text-muted-foreground mt-1 self-start"
            >
              Choose a different file
            </button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />

        <button
          onClick={handleImport}
          disabled={!preview || loading}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Check size={16} />
          )}
          Import Split
        </button>
      </div>
    </div>
  );
}