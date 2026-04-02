import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXERCISES_BY_MUSCLE, SESSION_MUSCLE_GROUPS } from './exerciseData';
import { Input } from '@/components/ui/input';
import ExerciseIllustration from './ExerciseIllustration';
import { useExerciseLibrary } from '@/hooks/useExerciseLibrary';

export default function ExercisePicker({ sessionType, addedNames, onAdd, onCustomAdd }) {
  const groups = SESSION_MUSCLE_GROUPS[sessionType] || [];
  const [selectedGroup, setSelectedGroup] = useState(groups[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const { libraryExercises, ensureExercise } = useExerciseLibrary();

  // Built-in exercises for selected group
  const builtInExercises = selectedGroup ? (EXERCISES_BY_MUSCLE[selectedGroup] || []) : [];

  // Search mode: show matching exercises from library + built-in
  const isSearching = searchQuery.trim().length > 0;
  const query = searchQuery.trim().toLowerCase();

  const libraryMatches = isSearching
    ? libraryExercises.filter((e) => e.name.includes(query) && !addedNames.includes(e.display_name))
    : [];

  const builtInMatches = isSearching
    ? builtInExercises.filter((e) => e.name.toLowerCase().includes(query) && !addedNames.includes(e.name))
    : builtInExercises;

  const handleAddBuiltIn = async (ex) => {
    await ensureExercise({ display_name: ex.name, exercise_type: 'strength', muscle_group: selectedGroup || '' });
    onAdd({ ...ex, muscle: selectedGroup });
  };

  const handleAddLibrary = (libEx) => {
    onAdd({ name: libEx.display_name, exercise_type: libEx.exercise_type || 'strength', muscle: libEx.muscle_group });
  };

  const handleCustomAdd = async () => {
    const name = searchQuery.trim();
    if (!name) return;
    await ensureExercise({ display_name: name, exercise_type: 'strength', muscle_group: selectedGroup || '' });
    onCustomAdd(name);
    setSearchQuery('');
  };

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Add Exercise</p>

      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && isSearching && handleCustomAdd()}
            placeholder="Search or add exercise..."
            className="pl-8 bg-input border-border text-sm h-10"
          />
        </div>
        {isSearching && (
          <button
            onClick={handleCustomAdd}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0"
          >
            <Plus size={18} className="text-primary-foreground" />
          </button>
        )}
      </div>

      {/* If searching: show library + built-in matches */}
      {isSearching ? (
        <div className="flex flex-col gap-2 mb-3">
          {libraryMatches.map((ex) => (
            <button
              key={ex.id}
              onClick={() => handleAddLibrary(ex)}
              className="flex items-center gap-3 bg-secondary/60 rounded-xl px-3 py-2.5 hover:bg-secondary active:bg-secondary/80 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-secondary flex items-center justify-center">
                <ExerciseIllustration muscle={ex.muscle_group || 'Chest'} size="sm" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium">{ex.display_name}</span>
                {ex.muscle_group && <p className="text-[10px] text-muted-foreground">{ex.muscle_group}</p>}
              </div>
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Plus size={14} className="text-muted-foreground" />
              </div>
            </button>
          ))}
          {builtInMatches.map((ex) => {
            const alreadyAdded = addedNames.includes(ex.name);
            return (
              <button
                key={ex.name}
                onClick={() => !alreadyAdded && handleAddBuiltIn(ex)}
                disabled={alreadyAdded}
                className={cn(
                  'flex items-center gap-3 bg-secondary/60 rounded-xl px-3 py-2.5 transition-colors',
                  alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-secondary active:bg-secondary/80'
                )}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-secondary flex items-center justify-center">
                  <ExerciseIllustration muscle={selectedGroup || 'Chest'} size="sm" />
                </div>
                <span className="flex-1 text-sm font-medium text-left">{ex.name}</span>
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', alreadyAdded ? 'bg-primary/20' : 'bg-muted')}>
                  <Plus size={14} className={alreadyAdded ? 'text-primary' : 'text-muted-foreground'} />
                </div>
              </button>
            );
          })}
          {libraryMatches.length === 0 && builtInMatches.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">
              No matches — press + or Enter to add "<span className="text-foreground">{searchQuery.trim()}</span>"
            </p>
          )}
        </div>
      ) : (
        <>
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
          {builtInExercises.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {builtInExercises.map((ex) => {
                const alreadyAdded = addedNames.includes(ex.name);
                return (
                  <button
                    key={ex.name}
                    onClick={() => !alreadyAdded && handleAddBuiltIn(ex)}
                    disabled={alreadyAdded}
                    className={cn(
                      'flex items-center gap-3 bg-secondary/60 rounded-xl px-3 py-2.5 transition-colors',
                      alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-secondary active:bg-secondary/80'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-secondary flex items-center justify-center">
                      <ExerciseIllustration muscle={selectedGroup} size="sm" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-left">{ex.name}</span>
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', alreadyAdded ? 'bg-primary/20' : 'bg-muted')}>
                      <Plus size={14} className={alreadyAdded ? 'text-primary' : 'text-muted-foreground'} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}