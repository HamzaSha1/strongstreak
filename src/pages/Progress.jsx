import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, TrendingUp, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';

export default function Progress() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ weight_kg: '', date: format(new Date(), 'yyyy-MM-dd'), photo_url: '' });
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: weights = [] } = useQuery({
    queryKey: ['weights', user?.email],
    queryFn: () => base44.entities.Weight.filter({ user_id: user?.email }, '-date'),
    enabled: !!user,
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData((prev) => ({ ...prev, photo_url: file_url }));
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error('Failed to upload photo');
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
  });

  const chartData = weights
    .slice()
    .reverse()
    .map((w) => ({
      date: format(parse(w.date, 'yyyy-MM-dd', new Date()), 'MMM d'),
      weight: w.weight_kg,
    }));

  const currentWeight = weights[0]?.weight_kg;
  const previousWeight = weights[1]?.weight_kg;
  const weightChange = currentWeight && previousWeight ? (currentWeight - previousWeight).toFixed(1) : null;

  return (
    <div className="pb-24 pt-4 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl mb-1">Progress</h1>
        <p className="text-muted-foreground text-sm">Track your weight journey</p>
      </div>

      {/* Current weight card */}
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

      {/* Add weight button/form */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full gap-2 mb-6"
        >
          <Plus size={16} /> Log Weight
        </Button>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="w-full h-10 rounded-xl bg-input border border-border px-3 text-sm mb-3"
          />
          <div className="flex gap-2 mb-3">
            <Input
              type="number"
              step="0.1"
              placeholder="Weight (kg)"
              value={formData.weight_kg}
              onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
              className="flex-1"
            />
            <span className="text-muted-foreground text-sm flex items-center">kg</span>
          </div>

          {/* Photo upload */}
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
            <label className="flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer mb-3">
              <Camera size={18} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add progress photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const w = parseFloat(formData.weight_kg);
                if (!w || w <= 0 || w > 500) {
                  toast.error('Please enter a valid weight between 1 and 500 kg.');
                  return;
                }
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

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">Weight Trend</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value) => `${value} kg`}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weight history */}
      {weights.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">History</p>
          <div className="flex flex-col gap-3">
            {weights.map((w, idx) => (
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
                  <img src={w.photo_url} alt="Progress" className="w-full h-32 object-cover rounded-lg" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}