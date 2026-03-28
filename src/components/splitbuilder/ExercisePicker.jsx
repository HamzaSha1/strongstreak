import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXERCISES_BY_MUSCLE, MUSCLE_GROUP_IMAGES, SESSION_MUSCLE_GROUPS } from './exerciseData';
import { Input } from '@/components/ui/input';

export default function ExercisePicker({ sessionType, addedNames, onAdd, onCustomAdd }) {
  const groups = SESSION_MUSCLE_GROUPS[sessionType] || [];
  const [selectedGroup, setSelectedGroup] = useState(groups[0] || null);
  const [customName, setCustomName] = useState('');

  const exercises = selectedGroup ? (EXERCISES_BY_MUSCLE[selectedGroup] || []) : [];

  const handleCustomAdd = () => {
    if (!customName.trim()) return;
    onCustomAdd(customName.trim());
    setCustomName('');
  };

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Add Exercise</p>

      {/* Muscle group image */}
      {selectedGroup && MUSCLE_GROUP_IMAGES[selectedGroup] && (
        <div className="w-full h-36 rounded-2xl overflow-hidden mb-3">
          <img
            src={MUSCLE_GROUP_IMAGES[selectedGroup]}
            alt={selectedGroup}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Muscle group selector */}
      <div className="flex flex-wrap gap-2 mb-3">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            className={cn(
              'px-4 py-2 rounded-xl border text-sm transition-colors',
              selectedGroup === g
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      {exercises.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {exercises.map((ex) => {
            const alreadyAdded = addedNames.includes(ex.name);
            return (
              <button
                key={ex.name}
                onClick={() => !alreadyAdded && onAdd(ex)}
                disabled={alreadyAdded}
                className={cn(
                  'flex items-center gap-3 bg-secondary/60 rounded-xl px-3 py-2.5 transition-colors',
                  alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-secondary active:bg-secondary/80'
                )}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  <img src={ex.image} alt={ex.name} className="w-full h-full object-cover" />
                </div>
                <span className="flex-1 text-sm font-medium text-left">{ex.name}</span>
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                  alreadyAdded ? 'bg-primary/20' : 'bg-muted'
                )}>
                  <Plus size={14} className={alreadyAdded ? 'text-primary' : 'text-muted-foreground'} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Custom exercise input */}
      <div className="flex gap-2 mt-1">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
            placeholder="Add custom exercise..."
            className="pl-8 bg-input border-border text-sm h-10"
          />
        </div>
        <button
          onClick={handleCustomAdd}
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0"
        >
          <Plus size={18} className="text-primary-foreground" />
        </button>
      </div>
    </div>
  );
}