import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Camera, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REST_OPTIONS } from './exerciseData';

// Step-by-step config: Sets → Reps → RPE → Rest
const STEPS = ['sets', 'reps', 'rpe', 'rest'];

export default function ExerciseConfig({ exercise, onChange, onDelete }) {
  const [openStep, setOpenStep] = useState('sets');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

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
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white flex items-center justify-center">
          {exercise.image_url ? (
            <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-contain p-0.5" />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          <button
            onClick={() => fileRef.current.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera size={14} className="text-white" />
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

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