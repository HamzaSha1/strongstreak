import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, ImagePlus, Loader2, Check, ChevronRight, Calendar, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * ImportWorkoutModal
 * 
 * Props:
 *  mode: 'split' | 'day' — which import type (can also be 'choose' to show both options)
 *  onImportSplit(parsedData): called with { split_name, days[] } for split mode
 *  onImportDay(parsedData): called with { exercises[] } for day mode
 *  onClose()
 */
export default function ImportWorkoutModal({ mode: initialMode = 'choose', onImportSplit, onImportDay, onClose }) {
  const [mode, setMode] = useState(initialMode === 'choose' ? null : initialMode);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [step, setStep] = useState('choose'); // 'choose' | 'upload' | 'parsing' | 'review'
  const [parsedData, setParsedData] = useState(null);
  const fileRef = useRef();

  const handleModeSelect = (m) => {
    setMode(m);
    setStep('upload');
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleParse = async () => {
    if (!imageFile) return;
    setStep('parsing');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      const res = await base44.functions.invoke('parseWorkoutImage', { image_url: file_url, mode });
      if (res.data?.success) {
        // data may be nested under .response (LLM JSON schema returns)
        const payload = res.data.data?.response ?? res.data.data;
        setParsedData(payload);
        setStep('review');
      } else {
        toast.error('Could not parse the image. Try a clearer screenshot.');
        setStep('upload');
      }
    } catch (err) {
      toast.error('Parse failed: ' + err.message);
      setStep('upload');
    }
  };

  const handleConfirm = () => {
    if (mode === 'split') {
      onImportSplit(parsedData);
    } else {
      onImportDay(parsedData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-t-3xl border-t border-border flex flex-col max-h-[90vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div>
            <h2 className="font-heading font-bold text-base">Import from Screenshot</h2>
            <p className="text-xs text-muted-foreground">Use AI to parse your workout image</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">

          {/* STEP: Choose mode */}
          {step === 'choose' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">What would you like to import?</p>
              <button
                onClick={() => handleModeSelect('split')}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary/50 bg-muted/30 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar size={22} className="text-primary" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm">Import Split</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Parse a full week or multiple days from one screenshot</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground ml-auto shrink-0" />
              </button>
              <button
                onClick={() => handleModeSelect('day')}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary/50 bg-muted/30 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Dumbbell size={22} className="text-blue-400" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm">Import Day</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Parse a single workout session with sets, reps & weights</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground ml-auto shrink-0" />
              </button>
            </div>
          )}

          {/* STEP: Upload image */}
          {step === 'upload' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl px-3 py-2">
                {mode === 'split' ? <Calendar size={13} className="text-primary" /> : <Dumbbell size={13} className="text-blue-400" />}
                <span>{mode === 'split' ? 'Import Split — full week program' : 'Import Day — single workout session'}</span>
              </div>

              <button
                onClick={() => fileRef.current.click()}
                className="w-full aspect-video rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 bg-muted/20 hover:bg-muted/40 transition-colors overflow-hidden relative"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <ImagePlus size={24} className="text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">Tap to upload screenshot</p>
                      <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG supported</p>
                    </div>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

              {imageFile && (
                <div className="bg-muted/30 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Check size={12} className="text-green-400" />
                  {imageFile.name}
                </div>
              )}

              <Button
                onClick={handleParse}
                disabled={!imageFile}
                className="w-full h-12 font-heading font-bold text-sm bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Upload size={16} />
                Parse with AI
              </Button>
            </div>
          )}

          {/* STEP: Parsing */}
          {step === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 size={28} className="text-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-heading font-bold">Analyzing your screenshot…</p>
                <p className="text-xs text-muted-foreground mt-1">AI is reading exercises, sets, reps & weights</p>
              </div>
            </div>
          )}

          {/* STEP: Review */}
          {step === 'review' && parsedData && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-xl px-3 py-2 border border-green-500/20">
                <Check size={13} />
                <span>Parse complete! Review before importing.</span>
              </div>

              {mode === 'day' && parsedData.exercises && (
                <div className="flex flex-col gap-2">
                  {parsedData.exercises.map((ex, i) => (
                    <div key={i} className="bg-muted/30 rounded-2xl p-3 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-heading font-bold text-sm">{ex.exercise_name}</p>
                        <span className="text-xs text-muted-foreground bg-muted rounded-lg px-2 py-0.5">
                          {ex.target_sets} sets × {ex.target_reps || '—'}
                        </span>
                      </div>
                      {ex.sets && ex.sets.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {ex.sets.map((s, si) => (
                            <div key={si} className="bg-muted rounded-xl px-2.5 py-1.5 text-center">
                              <p className="text-[10px] text-muted-foreground">Set {si + 1}</p>
                              <p className="text-xs font-bold">{s.reps ?? '—'} reps</p>
                              {s.weight_kg != null && <p className="text-[10px] text-primary">{s.weight_kg}kg</p>}
                              {s.rir != null && <p className="text-[10px] text-muted-foreground">RIR {s.rir}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {mode === 'split' && parsedData.days && (
                <div className="flex flex-col gap-2">
                  {parsedData.split_name && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{parsedData.split_name}</p>
                  )}
                  {parsedData.days.map((day, i) => (
                    <div key={i} className="bg-muted/30 rounded-2xl p-3 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-heading font-bold text-sm">{day.day_name}</span>
                        <span className="text-[10px] bg-primary/10 text-primary rounded-lg px-2 py-0.5 font-semibold">{day.session_type}</span>
                      </div>
                      {day.exercises?.length > 0 && (
                        <div className="flex flex-col gap-1">
                          {day.exercises.map((ex, ei) => (
                            <div key={ei} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{ex.exercise_name}</span>
                              <span className="text-muted-foreground/60">{ex.target_sets} × {ex.target_reps || '—'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 border-border" onClick={() => setStep('upload')}>
                  Re-scan
                </Button>
                <Button onClick={handleConfirm} className="flex-1 bg-primary text-primary-foreground font-heading font-bold">
                  <Check size={15} />
                  Import
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}