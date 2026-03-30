import { useState, useRef } from 'react';
import { X, Upload, Sparkles, ImagePlus, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { DAYS } from './exerciseData';

export default function ImportSplitModal({ onImport, onClose }) {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      // Upload image first
      const { file_url } = await base44.integrations.Core.UploadFile({ file: image });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a fitness expert. Analyze this workout split screenshot and extract the complete training program.

Return a JSON object with this exact structure:
{
  "split_name": "string (name of the split if visible, otherwise 'Imported Split')",
  "days": [
    {
      "day": "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday",
      "session_type": "Push|Pull|Legs|Upper|Lower|Full Body|Cardio|Rest|Custom",
      "exercises": [
        {
          "name": "Exercise name",
          "exercise_type": "strength|cardio",
          "target_sets": 3,
          "target_reps": "8-12",
          "rpe": 7,
          "rest_seconds": 90,
          "notes": "any extra notes"
        }
      ]
    }
  ]
}

Rules:
- Only include days that are clearly shown. For days not shown or labeled as rest, use session_type "Rest" with empty exercises array.
- target_reps should be a string like "8-12", "10", "12-15", "AMRAP" etc.
- rpe: if not specified, infer from rep ranges (12-15 reps → RPE 7, 8-12 → RPE 7.5, 4-6 → RPE 8.5). Default to 7 if unclear.
- rest_seconds: if not specified, infer from exercise type (compound lifts → 120-180s, isolation → 60-90s, cardio → 30-60s).
- exercise_type: "cardio" only for cardio exercises, everything else is "strength".
- If the screenshot shows a specific day assignment (e.g., "Day 1: Chest"), map to the correct day of the week starting Monday.
- If days aren't labeled by weekday, assign them starting Monday.
- Be thorough — extract every exercise visible.`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            split_name: { type: 'string' },
            days: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'string' },
                  session_type: { type: 'string' },
                  exercises: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        exercise_type: { type: 'string' },
                        target_sets: { type: 'number' },
                        target_reps: { type: 'string' },
                        rpe: { type: 'number' },
                        rest_seconds: { type: 'number' },
                        notes: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Build the full 7-day split, filling in missing days as Rest
      const importedDays = DAYS.map((dayName, i) => {
        const found = result.days?.find((d) => d.day === dayName);
        if (found) {
          return {
            day: dayName,
            session_type: found.session_type || 'Rest',
            exercises: (found.exercises || []).map((ex) => ({
              name: ex.name,
              image_url: null,
              exercise_type: ex.exercise_type || 'strength',
              target_sets: ex.target_sets || 3,
              target_reps: String(ex.target_reps || '8-12'),
              rpe: ex.rpe || 7,
              rest_seconds: ex.rest_seconds || 90,
              notes: ex.notes || '',
            })),
            open: false,
            order_index: i,
          };
        }
        return { day: dayName, session_type: 'Rest', exercises: [], open: false, order_index: i };
      });

      onImport({ name: result.split_name || 'Imported Split', days: importedDays });
    } catch (err) {
      setError('Could not read the screenshot. Please try a clearer image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h2 className="font-heading font-bold text-base">Import Split from Screenshot</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground p-1">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Upload a screenshot of your workout program — the AI will extract exercises, sets, reps, rest times and build your split automatically.
        </p>

        {/* Upload area */}
        <div
          className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 p-6 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="Preview" className="max-h-48 rounded-lg object-contain" />
          ) : (
            <>
              <ImagePlus size={32} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">Tap to upload or drag & drop<br />your workout screenshot here</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {imageUrl && (
          <button
            onClick={() => { setImage(null); setImageUrl(null); }}
            className="text-xs text-muted-foreground underline text-center"
          >
            Remove image
          </button>
        )}

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <button
          onClick={handleAnalyze}
          disabled={!image || loading}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-medium disabled:opacity-50 transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing screenshot...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Import Split with AI
            </>
          )}
        </button>
      </div>
    </div>
  );
}