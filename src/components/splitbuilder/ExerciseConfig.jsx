import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, ChevronDown, ChevronUp, Minus, Plus, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REST_OPTIONS } from './exerciseData';
import { Textarea } from '@/components/ui/textarea';

// Step-by-step config: Sets → Reps → RPE → Rest → Notes
const STEPS = ['sets', 'reps', 'rpe', 'rest', 'notes'];

export default function ExerciseConfig({ exercise, onChange, onDelete, allExercises = [] }) {
  const [openStep, setOpenStep] = useState('sets');
  const [uploading, setUploading] = useState(false);

  const toggleStep = (step) => setOpenStep((s) => (s === step ? null : step));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ ...exercise, image_url: file_url });
    setUploading(false);
  };

  const nextStep = (current) => {
    const idx = STEPS.indexOf(current);
    if (idx < STEPS.length - 1) setOpenStep(STEPS[idx + 1]);
    else setOpenStep(null);
  };

  return (
    <div className="bg-secondary/50 border border-border rounded-2xl overflow-hidden mb-3">
      {/* Exercise header */}
      <div className="flex items-center gap-3 p-3">
        <label className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-secondary border-2 border-dashed border-primary flex items-center justify-center">
            {exercise.image_url ? (
              <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-cover" />
            ) : (
              <Camera size={18} className="text-primary" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <span className="text-[9px] text-primary leading-none">photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-sm truncate">{exercise.name}</p>
          <p className="text-xs text-muted-foreground">
            {exercise.target_sets ? `${exercise.target_sets} sets` : '—'}
            {exercise.target_reps ? ` · ${exercise.target_reps} reps` : ''}
            {exercise.rpe ? ` · RPE ${exercise.rpe}` : ''}
          </p>
        </div>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors p-1">
          <X size={16} />
        </button>
      </div>

      {/* Sets */}
      <StepRow label="Sets" open={openStep === 'sets'} onToggle={() => toggleStep('sets')}>
        <div className="flex items-center justify-center gap-6 py-2">
          <button
            onClick={() => onChange({ ...exercise, target_sets: Math.max(1, (exercise.target_sets || 3) - 1) })}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <Minus size={16} />
          </button>
          <span className="text-4xl font-heading font-bold text-foreground w-12 text-center">
            {exercise.target_sets || 3}
          </span>
          <button
            onClick={() => onChange({ ...exercise, target_sets: Math.min(10, (exercise.target_sets || 3) + 1) })}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <Plus size={16} />
          </button>
        </div>
        <button
          onClick={() => nextStep('sets')}
          className="w-full mt-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
        >
          Next
        </button>
      </StepRow>

      {/* Reps */}
      <StepRow label="Reps" open={openStep === 'reps'} onToggle={() => toggleStep('reps')}>
        <div className="flex flex-wrap gap-2 py-2">
          {['6', '8', '10', '12', '15', '20', 'Failure'].map((r) => (
            <button
              key={r}
              onClick={() => onChange({ ...exercise, target_reps: r })}
              className={cn(
                'px-4 py-2 rounded-xl border text-sm transition-colors',
                exercise.target_reps === r
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          onClick={() => nextStep('reps')}
          className="w-full mt-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
        >
          Next
        </button>
      </StepRow>

      {/* RPE */}
      <StepRow label="RPE" open={openStep === 'rpe'} onToggle={() => toggleStep('rpe')}>
        <div className="py-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Easy (6)</span>
            <span className="text-primary font-bold">{exercise.rpe || 7}</span>
            <span>Max (10)</span>
          </div>
          <input
            type="range" min={6} max={10} step={0.5}
            value={exercise.rpe || 7}
            onChange={(e) => onChange({ ...exercise, rpe: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
        <button
          onClick={() => nextStep('rpe')}
          className="w-full mt-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
        >
          Next
        </button>
      </StepRow>

      {/* Notes */}
      <StepRow label="Notes" open={openStep === 'notes'} onToggle={() => toggleStep('notes')}>
        <Textarea
          value={exercise.notes || ''}
          onChange={(e) => onChange({ ...exercise, notes: e.target.value })}
          placeholder="Any cues, form notes, variations..."
          className="bg-input border-border text-sm min-h-[80px] resize-none"
        />
      </StepRow>

      {/* Superset */}
      {allExercises.filter((e) => e.name !== exercise.name).length > 0 && (
        <StepRow label="Superset with" open={openStep === 'superset'} onToggle={() => toggleStep('superset')}>
          <div className="flex flex-col gap-2 py-1">
            <button
              onClick={() => onChange({ ...exercise, superset_group: '' })}
              className={cn(
                'px-4 py-2 rounded-xl border text-sm transition-colors text-left',
                !exercise.superset_group
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              None
            </button>
            {allExercises
              .filter((e) => e.name !== exercise.name)
              .map((e) => {
                const groupId = [exercise.name, e.name].sort().join('__');
                const isSelected = exercise.superset_group === groupId;
                return (
                  <button
                    key={e.name}
                    onClick={() => onChange({ ...exercise, superset_group: isSelected ? '' : groupId })}
                    className={cn(
                      'px-4 py-2 rounded-xl border text-sm transition-colors text-left',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    {e.name}
                  </button>
                );
              })}
          </div>
        </StepRow>
      )}

      {/* Rest */}
      <StepRow label="Rest" open={openStep === 'rest'} onToggle={() => toggleStep('rest')}>
        <div className="flex flex-wrap gap-2 py-2">
          {REST_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => onChange({ ...exercise, rest_seconds: r.value })}
              className={cn(
                'px-4 py-2 rounded-xl border text-sm transition-colors',
                exercise.rest_seconds === r.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setOpenStep(null)}
          className="w-full mt-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
        >
          Done
        </button>
      </StepRow>
    </div>
  );
}

function StepRow({ label, open, onToggle, children }) {
  return (
    <div className="border-t border-border">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground"
      >
        <span>{label}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}