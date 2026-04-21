import { useState, useRef } from 'react';
import { Trash2, Plus, Clock, GripVertical, ArrowUp, ArrowDown, Camera, ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SESSION_MUSCLE_GROUPS, EXERCISES_BY_MUSCLE } from '@/components/splitbuilder/exerciseData';
import { useExerciseLibrary } from '@/hooks/useExerciseLibrary';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';

// Parent usage: onReorder should do a splice-based move, not a swap:
//   const handleReorder = (srcIndex, destIndex) => {
//     setExercises(prev => {
//       const next = [...prev];
//       const [moved] = next.splice(srcIndex, 1);
//       next.splice(destIndex, 0, moved);
//       return next;
//     });
//   };

export default function WorkoutExerciseEditor({ exercises, sessionType, onClose, onReorder, onRemove, onAdd, onUpdateExercise }) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [customName, setCustomName] = useState('');
  const [editingSupersetId, setEditingSupersetId] = useState(null);
  const [editingRestId, setEditingRestId] = useState(null);
  const [viewingImageEx, setViewingImageEx] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const cameraInputRef = useRef(null);
  const libraryInputRef = useRef(null);

  const muscleGroups = SESSION_MUSCLE_GROUPS[sessionType] ||
    SESSION_MUSCLE_GROUPS['Custom'] || [];

  const existingNames = new Set(exercises.map((e) => e.name));

  const { libraryExercises, ensureExercise } = useExerciseLibrary();

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src !== dst) onReorder(src, dst);
  };

  const handleImageUpload = async (file, exId) => {
    if (!file || !onUpdateExercise) return;
    setUploadingId(exId);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onUpdateExercise(exId, { image_url: file_url });
      // Keep viewer open but update its exercise reference with new image
      setViewingImageEx((prev) => prev ? { ...prev, image_url: file_url } : null);
    } finally {
      setUploadingId(null);
    }
  };

  const handleAdd = async (name, isCardio = false, muscleGroup = '') => {
    await ensureExercise({ display_name: name, exercise_type: isCardio ? 'cardio' : 'strength', muscle_group: muscleGroup });
    const ex = {
      id: `temp_${Date.now()}_${Math.random()}`,
      name,
      exercise_type: isCardio ? 'cardio' : 'strength',
      target_sets: 3,
      target_reps: '10',
      rest_seconds: 90,
      order_index: exercises.length,
    };
    onAdd(ex);
    setShowPicker(false);
    setCustomName('');
  };

  const handleCustomAdd = () => {
    if (!customName.trim()) return;
    handleAdd(customName.trim());
  };

  // Library search
  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length > 0;
  const searchLower = searchQuery.trim().toLowerCase();
  const libraryMatches = isSearching
    ? libraryExercises.filter((e) => e.name.includes(searchLower) && !existingNames.has(e.display_name))
    : [];

  // Sync viewingImageEx with latest exercise data so image_url updates are reflected
  const viewingExLive = viewingImageEx
    ? (exercises.find((e) => e.id === viewingImageEx.id) ?? viewingImageEx)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel — transform creates a strict positioning context for DnD coordinate calculations */}
      <div
        className="relative bg-card rounded-t-3xl border-t border-border max-h-[80vh] flex flex-col"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-heading font-bold text-base">Edit Exercises</h2>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Done
          </button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="workout-exercises">
            {(provided) => (
              /* Droppable IS the scroll container so the library correctly tracks scroll offsets */
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="overflow-y-auto flex-1 p-4 flex flex-col gap-2"
              >
                {exercises.map((ex, idx) => (
                  <Draggable key={String(ex.id)} draggableId={String(ex.id)} index={idx}>
                    {(drag, snapshot) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        className={cn(
                          "rounded-2xl transition-all",
                          snapshot.isDragging && "shadow-2xl z-50 bg-card scale-[1.02] border border-primary/50 relative"
                        )}
                      >
                        <div className="flex items-center gap-2 bg-secondary/50 rounded-2xl px-3 py-2.5">
                          {/* Drag handle — touch-none prevents mobile scroll conflicts */}
                          <div
                            {...drag.dragHandleProps}
                            className="text-muted-foreground touch-none cursor-grab active:cursor-grabbing shrink-0 p-1"
                          >
                            <GripVertical size={16} />
                          </div>

                          {/* Photo thumbnail */}
                          <button
                            onClick={() => setViewingImageEx(ex)}
                            className="relative shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-secondary border border-border flex items-center justify-center"
                          >
                            {ex.image_url ? (
                              <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" />
                            ) : (
                              <Camera size={16} className="text-muted-foreground" />
                            )}
                            {uploadingId === ex.id && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{ex.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ex.exercise_type === 'cardio'
                                ? ex.cardio_metric || 'cardio'
                                : `${ex.target_sets} × ${ex.target_reps}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Arrow buttons — manual reorder fallback */}
                            <button
                              onClick={() => idx > 0 && onReorder(idx, idx - 1)}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg bg-secondary text-muted-foreground disabled:opacity-30 hover:bg-secondary/80 touch-target-44"
                              title="Move up"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              onClick={() => idx < exercises.length - 1 && onReorder(idx, idx + 1)}
                              disabled={idx === exercises.length - 1}
                              className="p-1.5 rounded-lg bg-secondary text-muted-foreground disabled:opacity-30 hover:bg-secondary/80 touch-target-44"
                              title="Move down"
                            >
                              <ArrowDown size={13} />
                            </button>

                            {ex.exercise_type === 'strength' && (
                              <>
                                {ex.dropset_count > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => onUpdateExercise && onUpdateExercise(ex.id, { dropset_count: Math.max(0, (ex.dropset_count || 1) - 1) })}
                                      className="w-7 h-7 rounded-lg bg-primary/20 text-primary font-bold text-base flex items-center justify-center"
                                    >
                                      −
                                    </button>
                                    <span className="text-xs font-bold text-primary min-w-[28px] text-center">×{ex.dropset_count}</span>
                                    <button
                                      onClick={() => onUpdateExercise && onUpdateExercise(ex.id, { dropset_count: (ex.dropset_count || 1) + 1 })}
                                      className="w-7 h-7 rounded-lg bg-primary/20 text-primary font-bold text-base flex items-center justify-center"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : null}
                                <button
                                  onClick={() => onUpdateExercise && onUpdateExercise(ex.id, { dropset_count: ex.dropset_count > 0 ? 0 : 1 })}
                                  className={cn(
                                    'px-2 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap touch-target-44 transition-colors',
                                    ex.dropset_count > 0
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                  )}
                                  title="Toggle drop set"
                                >
                                  DROP SET
                                </button>
                                <button
                                  onClick={() => setEditingRestId(editingRestId === ex.id ? null : ex.id)}
                                  className="p-2 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 touch-target-44"
                                  title="Edit rest time"
                                >
                                  <Clock size={13} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => onRemove(ex.id)}
                              className="p-2 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center touch-target-44"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Rest time editor */}
                        {editingRestId === ex.id && onUpdateExercise && ex.exercise_type === 'strength' && (
                          <div className="bg-primary/10 border border-primary/30 rounded-xl mt-2 p-3 flex items-center gap-2">
                            <span className="text-xs text-primary font-semibold">Rest:</span>
                            <input
                              type="number"
                              value={ex.rest_seconds || 90}
                              onChange={(e) => onUpdateExercise(ex.id, { rest_seconds: Math.max(0, parseInt(e.target.value) || 0) })}
                              className="w-16 h-8 bg-input border border-primary rounded-lg px-2 text-sm text-center"
                              min="0"
                              step="5"
                            />
                            <span className="text-xs text-primary">seconds</span>
                          </div>
                        )}

                        {/* Superset config */}
                        {editingSupersetId === ex.id && onUpdateExercise && (
                          <div className="bg-primary/10 border border-primary/30 rounded-xl mt-2 p-3">
                            <p className="text-xs text-primary font-semibold mb-2">Superset with:</p>
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => {
                                  onUpdateExercise(ex.id, { superset_group: '' });
                                  setEditingSupersetId(null);
                                }}
                                className={cn(
                                  'px-3 py-1.5 rounded-lg text-xs border text-left transition-colors',
                                  !ex.superset_group
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'border-border text-muted-foreground hover:border-primary/50'
                                )}
                              >
                                None
                              </button>
                              {exercises
                                .filter((e) => e.name !== ex.name)
                                .map((e) => {
                                  const groupId = [ex.name, e.name].sort().join('__');
                                  const isSelected = ex.superset_group === groupId;
                                  return (
                                    <button
                                      key={e.name}
                                      onClick={() => {
                                        onUpdateExercise(ex.id, { superset_group: isSelected ? '' : groupId });
                                        setEditingSupersetId(null);
                                      }}
                                      className={cn(
                                        'px-3 py-1.5 rounded-lg text-xs border text-left transition-colors',
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
                          </div>
                        )}

                        {/* Superset button */}
                        {ex.exercise_type === 'strength' && (
                          <button
                            onClick={() => setEditingSupersetId(editingSupersetId === ex.id ? null : ex.id)}
                            className="w-full mt-1 text-xs py-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary/50 transition-colors"
                          >
                            {ex.superset_group ? '✓ Superset' : 'Add Superset'}
                          </button>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {/* Add exercise */}
                {!showPicker ? (
                  <button
                    onClick={() => setShowPicker(true)}
                    className="flex items-center justify-center gap-2 py-3 border border-dashed border-border rounded-2xl text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                  >
                    <Plus size={16} /> Add Exercise
                  </button>
                ) : (
                  <div className="bg-secondary/50 rounded-2xl p-3 flex flex-col gap-3">
                    {/* Search / custom input */}
                    <div className="flex gap-2">
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) handleAdd(searchQuery.trim(), false, selectedMuscle || ''); }}
                        placeholder="Search or type exercise name..."
                        className="flex-1 h-9 rounded-xl bg-input border border-border px-3 text-sm"
                        autoFocus
                      />
                      {searchQuery.trim() && (
                        <button
                          onClick={() => handleAdd(searchQuery.trim(), false, selectedMuscle || '')}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded-xl text-sm font-semibold whitespace-nowrap"
                        >
                          Add
                        </button>
                      )}
                    </div>

                    {/* Library search results */}
                    {isSearching && libraryMatches.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] text-muted-foreground uppercase">From library</p>
                        {libraryMatches.map((e) => (
                          <button
                            key={e.id}
                            onClick={() => handleAdd(e.display_name, e.exercise_type === 'cardio', e.muscle_group || '')}
                            className="text-left px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            {e.display_name}
                            {e.muscle_group && <span className="text-muted-foreground text-xs ml-1">· {e.muscle_group}</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Muscle group tabs */}
                    {!isSearching && (
                      <div className="flex flex-wrap gap-1.5">
                        {muscleGroups.map((mg) => (
                          <button
                            key={mg}
                            onClick={() => setSelectedMuscle(mg === selectedMuscle ? null : mg)}
                            className={cn(
                              'px-3 py-1 rounded-xl text-xs border transition-colors',
                              selectedMuscle === mg
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border text-muted-foreground hover:border-primary/50'
                            )}
                          >
                            {mg}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Exercise list for selected muscle */}
                    {!isSearching && selectedMuscle && (
                      <div className="flex flex-col gap-1">
                        {(EXERCISES_BY_MUSCLE[selectedMuscle] || []).map((e) => (
                          <button
                            key={e.name}
                            disabled={existingNames.has(e.name)}
                            onClick={() => handleAdd(e.name, selectedMuscle === 'Cardio', selectedMuscle)}
                            className={cn(
                              'text-left px-3 py-2 rounded-xl text-sm transition-colors',
                              existingNames.has(e.name)
                                ? 'text-muted-foreground/40 cursor-not-allowed'
                                : 'hover:bg-primary/10 hover:text-primary'
                            )}
                          >
                            {e.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => { setShowPicker(false); setSearchQuery(''); }}
                      className="text-xs text-muted-foreground text-center"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Image viewer modal */}
      {viewingExLive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-black/80">
          <div className="relative w-full max-w-sm bg-card rounded-3xl overflow-hidden flex flex-col">
            {/* Close */}
            <button
              onClick={() => setViewingImageEx(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white"
            >
              <X size={18} />
            </button>

            {/* Image area */}
            <div className="relative w-full aspect-square bg-secondary flex items-center justify-center">
              {viewingExLive.image_url ? (
                <img
                  src={viewingExLive.image_url}
                  alt={viewingExLive.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Camera size={40} />
                  <span className="text-sm">No photo yet</span>
                </div>
              )}
              {uploadingId === viewingExLive.id && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Exercise name */}
            <div className="px-5 pt-4 pb-2">
              <p className="font-heading font-bold text-base truncate">{viewingExLive.name}</p>
              <p className="text-xs text-muted-foreground">
                {viewingExLive.exercise_type === 'cardio'
                  ? viewingExLive.cardio_metric || 'cardio'
                  : `${viewingExLive.target_sets} × ${viewingExLive.target_reps}`}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 px-5 pb-5 pt-3">
              {/* Take Photo — opens native camera */}
              <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer">
                <Camera size={16} />
                Take Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, viewingExLive.id);
                    e.target.value = '';
                  }}
                />
              </label>

              {/* Upload from Library */}
              <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold cursor-pointer">
                <ImageIcon size={16} />
                Library
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, viewingExLive.id);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
