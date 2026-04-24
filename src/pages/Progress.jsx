import { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, TrendingUp, Camera, X, Columns2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';
import { uploadImage } from '@/lib/uploadImage';

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ photo, onClose }) {
  if (!photo) return null;
  return (
    <div
      className="fixed inset-0 bg-black flex flex-col"
      style={{ zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="font-heading font-bold text-white text-base">{photo.weight_kg} kg</p>
          <p className="text-white/60 text-xs">{format(parse(photo.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <X size={18} className="text-white" />
        </button>
      </div>
      <div
        className="flex-1 flex items-center justify-center overflow-hidden px-3"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <img
          src={photo.photo_url}
          alt="Progress"
          className="max-h-full max-w-full object-contain rounded-xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

// ─── Compare View ─────────────────────────────────────────────────────────────
function CompareView({ a, b, onClose }) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 1000 }}>
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
      >
        <p className="font-heading font-bold text-white text-base">Compare</p>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <X size={18} className="text-white" />
        </button>
      </div>
      <div
        className="flex-1 flex gap-1 px-1 overflow-hidden"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {[a, b].map((photo, i) => (
          <div key={i} className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="flex-1 overflow-hidden rounded-xl bg-white/5">
              <img src={photo.photo_url} alt="Progress" className="w-full h-full object-cover" />
            </div>
            <div className="text-center pb-1 shrink-0">
              <p className="font-heading font-bold text-white text-sm">{photo.weight_kg} kg</p>
              <p className="text-white/50 text-xs">{format(parse(photo.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tappable photo wrapper ───────────────────────────────────────────────────
// Uses touchstart/touchend to fire reliably inside iOS scroll containers.
// If the finger moved more than 8px we treat it as a scroll, not a tap.
function TappablePhoto({ children, onTap, className }) {
  const touchStartY = useRef(null);
  const touchStartX = useRef(null);

  return (
    <div
      className={className}
      onTouchStart={(e) => {
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
        const dx = Math.abs(e.changedTouches[0].clientX - touchStartX.current);
        if (dy < 8 && dx < 8) {
          e.preventDefault();
          onTap();
        }
      }}
      // also handle regular click for desktop / PWA installs
      onClick={onTap}
    >
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Progress() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ weight_kg: '', date: format(new Date(), 'yyyy-MM-dd'), photo_url: '' });
  const [uploading, setUploading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: weights = [] } = useQuery({
    queryKey: ['weights', user?.email],
    queryFn: () => base44.entities.Weight.filter({ user_id: user?.email }, '-date'),
    enabled: !!user,
  });

  const photosOnly = weights.filter((w) => w.photo_url);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const file_url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, photo_url: file_url }));
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err?.message || 'Failed to upload photo');
    }
    setUploading(false);
  };

  const addWeightMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Weight.create({
        user_id: user.email,
        weight_kg: Number(data.weight_kg),
        date: data.date,
        photo_url: data.photo_url || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights', user?.email] });
      setFormData({ weight_kg: '', date: format(new Date(), 'yyyy-MM-dd'), photo_url: '' });
      setShowForm(false);
      toast.success('Weight logged');
    },
    onError: () => {
      toast.error('Could not save weight. Please try again.');
    },
  });

  const chartData = useMemo(() =>
    weights
      .slice()
      .reverse()
      .map((w) => ({
        date: format(parse(w.date, 'yyyy-MM-dd', new Date()), 'MMM d'),
        weight: w.weight_kg,
      })),
    [weights]
  );

  const currentWeight = weights[0]?.weight_kg;
  const previousWeight = weights[1]?.weight_kg;
  const weightChange = currentWeight && previousWeight ? (currentWeight - previousWeight).toFixed(1) : null;

  const toggleCompareSelect = (w) => {
    setCompareSelected((prev) => {
      const isSelected = prev.some((p) => p.id === w.id);
      if (isSelected) return prev.filter((p) => p.id !== w.id);
      if (prev.length >= 2) return [prev[1], w];
      return [...prev, w];
    });
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setCompareSelected([]);
  };

  return (
    <div className="flex flex-col h-full" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>

      {/* Lightbox & compare — rendered at top level, above everything */}
      {lightboxPhoto && <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />}
      {showCompare && compareSelected.length === 2 && (
        <CompareView a={compareSelected[0]} b={compareSelected[1]} onClose={() => setShowCompare(false)} />
      )}

      {/* ── Static top section ── */}
      <div className="px-4 shrink-0">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Progress</h1>
          <p className="text-muted-foreground text-sm">Track your weight journey</p>
        </div>

        {currentWeight && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Current Weight</p>
                <p className="font-heading font-bold text-3xl text-primary">{currentWeight} kg</p>
              </div>
              {weightChange !== null && (
                <div className={cn('flex items-center gap-1', weightChange > 0 ? 'text-destructive' : 'text-green-500')}>
                  <TrendingUp size={16} style={{ transform: weightChange < 0 ? 'rotate(180deg)' : 'none' }} />
                  <span className="text-sm font-semibold">{Math.abs(weightChange)} kg</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!showForm && (
          <div className="flex gap-2 mb-4">
            <Button onClick={() => setShowForm(true)} className="flex-1 gap-2">
              <Plus size={16} /> Log Weight
            </Button>
            {photosOnly.length >= 2 && (
              <Button
                variant={compareMode ? 'default' : 'outline'}
                onClick={() => compareMode ? exitCompareMode() : setCompareMode(true)}
                className={cn('gap-2', compareMode && 'bg-primary text-primary-foreground')}
              >
                <Columns2 size={16} />
                {compareMode ? 'Cancel' : 'Compare'}
              </Button>
            )}
          </div>
        )}

        {compareMode && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-2 mb-4 flex items-center justify-between">
            <p className="text-primary text-xs font-medium">
              {compareSelected.length === 0 ? 'Tap two photos to compare'
                : compareSelected.length === 1 ? 'Tap one more photo'
                : '2 photos selected'}
            </p>
            {compareSelected.length === 2 && (
              <button
                onClick={() => setShowCompare(true)}
                className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                Compare →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24">

        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-6">
            <div className="relative mb-3">
              <div className="w-full h-10 rounded-xl bg-input border border-border flex items-center justify-center text-center text-sm pointer-events-none leading-none">
                {format(parse(formData.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}
              </div>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min="2000-01-01"
                max={format(new Date(), 'yyyy-MM-dd')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="flex gap-2 mb-3 min-w-0">
              <Input
                type="number"
                step="0.1"
                placeholder="Weight (kg)"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                className="flex-1 min-w-0"
              />
              <span className="text-muted-foreground text-sm flex items-center shrink-0">kg</span>
            </div>

            {formData.photo_url ? (
              <div className="relative mb-3 rounded-xl overflow-hidden">
                <img src={formData.photo_url} alt="Progress" className="w-full h-40 object-cover" />
                <button
                  onClick={() => setFormData((prev) => ({ ...prev, photo_url: '' }))}
                  className="absolute top-2 right-2 w-7 h-7 bg-foreground/50 rounded-full flex items-center justify-center text-background"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className={cn(
                'flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed transition-colors mb-3',
                uploading ? 'border-primary/40 bg-primary/5 cursor-wait' : 'border-border hover:border-primary cursor-pointer'
              )}>
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-primary font-medium">Uploading…</span>
                  </>
                ) : (
                  <>
                    <Camera size={18} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add progress photo</span>
                  </>
                )}
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
              </label>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => {
                  const w = parseFloat(formData.weight_kg);
                  if (!w || w <= 0 || w > 500) { toast.error('Please enter a valid weight between 1 and 500 kg.'); return; }
                  addWeightMutation.mutate(formData);
                }}
                disabled={!formData.weight_kg || addWeightMutation.isPending || uploading}
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </div>
        )}

        {chartData.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <TrendingUp size={36} className="text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No weight entries yet.</p>
            <p className="text-muted-foreground text-xs">Tap "Log Weight" above to start tracking your progress.</p>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">Weight Trend</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tick={{ fill: 'hsl(var(--muted-foreground))' }} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value) => `${value} kg`}
                />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {weights.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">History</p>
            <div className="flex flex-col gap-3">
              {weights.map((w, idx) => {
                const isSelected = compareSelected.some((p) => p.id === w.id);
                return (
                  <div key={w.id} className="border-b border-border/50 last:border-b-0 pb-3 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold">{w.weight_kg} kg</p>
                        <p className="text-xs text-muted-foreground">{format(parse(w.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}</p>
                      </div>
                      {idx > 0 && (
                        <span className={cn('text-xs font-semibold', weights[idx - 1].weight_kg > w.weight_kg ? 'text-green-500' : 'text-destructive')}>
                          {(w.weight_kg - weights[idx - 1].weight_kg).toFixed(1)} kg
                        </span>
                      )}
                    </div>
                    {w.photo_url && (
                      <TappablePhoto
                        className="relative"
                        onTap={() => {
                          if (compareMode) toggleCompareSelect(w);
                          else setLightboxPhoto(w);
                        }}
                      >
                        <img
                          src={w.photo_url}
                          alt="Progress"
                          className={cn(
                            'w-full h-40 object-cover rounded-lg',
                            isSelected && compareMode && 'ring-2 ring-primary ring-offset-2 ring-offset-card'
                          )}
                        />
                        {compareMode && (
                          <div className={cn(
                            'absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all',
                            isSelected ? 'bg-primary border-primary' : 'bg-black/40 border-white/40'
                          )}>
                            {isSelected && <Check size={14} className="text-primary-foreground" />}
                          </div>
                        )}
                        {!compareMode && (
                          <div className="absolute bottom-2 right-2 bg-black/50 rounded-md px-2 py-0.5">
                            <p className="text-white/80 text-[10px]">Tap to view</p>
                          </div>
                        )}
                      </TappablePhoto>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}