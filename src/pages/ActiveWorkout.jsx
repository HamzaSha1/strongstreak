import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { useParams, useNavigate } from 'react-router-dom';
import { format, startOfDay, differenceInCalendarDays, subDays, parseISO } from 'date-fns';

const parseLocalDate = (dateStr) => parseISO(dateStr);
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowLeftRight, Plus, Check, Flag, Pencil, ScanLine, Trash2, X, Camera, ImageIcon, Timer, ChevronDown } from 'lucide-react';
import { EXERCISES_BY_MUSCLE, SESSION_MUSCLE_GROUPS } from '@/components/splitbuilder/exerciseData';
import ImportWorkoutModal from '@/components/import/ImportWorkoutModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import RestTimer from '@/components/workout/RestTimer';
import PostWorkoutModal from '@/components/workout/PostWorkoutModal';
import WorkoutExerciseEditor from '@/components/workout/WorkoutExerciseEditor.jsx';
import { parseRepRange, getRepFeedback, getWeightSuggestion } from '@/components/workout/RepFeedback';
import ExerciseHistory from '@/components/workout/ExerciseHistory';
import RIRPicker from '@/components/workout/RIRPicker';
import RepRangePicker from '@/components/workout/RepRangePicker';
import WorkoutSummaryScreen from '@/components/workout/WorkoutSummaryScreen';
import StreakCelebration from '@/components/workout/StreakCelebration';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { Reorder, useDragControls } from 'framer-motion';
import { calculateStreak } from '@/lib/streak';


const CARDIO_UNITS = { distance: 'km', time: 'min', calories: 'kcal' };

// ── Long-press drag activation for framer-motion Reorder ─────────────────────
// The user holds any exercise card header for 600ms to activate drag; moving
// or releasing before that cancels it. Once active, framer-motion handles
// pointer tracking, displacement, and drop via <Reorder.Item>.
const LONG_PRESS_MS = 600;
const MOVE_CANCEL_PX = 8;

// A card wrapper that activates drag after a 600ms hold on the header.
// framer-motion's Reorder.Item takes over from there: it tracks the pointer
// smoothly, shifts siblings to show the insertion point, and calls the
// parent's onReorder on drop.
function ReorderableCard({ ex, isActive, onLongPressStart, onLongPressEnd, onDragStart, onDragEnd, children }) {
  const controls = useDragControls();
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const savedEventRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    startRef.current = null;
    savedEventRef.current = null;
  };

  const handlePointerDown = (e) => {
    // Don't hijack buttons, inputs, or anywhere outside the drag-handle area
    if (e.target.closest('button, input, textarea, select, a')) return;
    if (!e.target.closest('[data-drag-handle]')) return;

    startRef.current = { x: e.clientX, y: e.clientY };
    // Framer-motion's controls.start wants the original PointerEvent
    savedEventRef.current = e;
    try { navigator.vibrate?.(15); } catch (_) {}
    onLongPressStart?.(ex.id);

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (!startRef.current || !savedEventRef.current) return;
      try { navigator.vibrate?.([40, 20, 40]); } catch (_) {}
      onDragStart?.(ex.id);
      controls.start(savedEventRef.current);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e) => {
    if (!startRef.current || !timerRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
      clearTimer();
      onLongPressEnd?.(ex.id);
    }
  };

  const handlePointerUp = () => {
    clearTimer();
    onLongPressEnd?.(ex.id);
  };

  return (
    <Reorder.Item
      value={ex}
      dragListener={false}
      dragControls={controls}
      onDragEnd={() => onDragEnd?.(ex.id)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      // Keep vertical scroll working when the user is NOT long-pressing
      style={{ touchAction: isActive ? 'none' : 'pan-y' }}
      // Smooth lift feedback
      whileDrag={{ scale: 1.03, boxShadow: '0 20px 40px hsl(0 0% 0% / 0.4)' }}
      layout
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
    >
      {children}
    </Reorder.Item>
  );
}
// ────────────────────────────────────────────────────────────────────────────

function SwapExerciseModal({ ex, sessionType, onSwap, onClose }) {
  const [query, setQuery] = useState('');
  const allExercises = useMemo(() => {
    const groups = SESSION_MUSCLE_GROUPS[sessionType] || SESSION_MUSCLE_GROUPS['Custom'] || [];
    const seen = new Set();
    return groups.flatMap((g) => EXERCISES_BY_MUSCLE[g] || []).filter((e) => {
      if (seen.has(e.name)) return false;
      seen.add(e.name);
      return true;
    });
  }, [sessionType]);
  const filtered = useMemo(() => {
    if (!query) return allExercises.slice(0, 40);
    return allExercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase())).slice(0, 40);
  }, [allExercises, query]);
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full bg-card rounded-t-3xl border-t border-border flex flex-col"
        style={{ maxHeight: '72vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="font-heading font-bold text-base">Swap Exercise</p>
            <p className="text-xs text-muted-foreground">Currently: {ex.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground p-1"><X size={18} /></button>
        </div>
        <div className="px-4 pb-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full h-10 rounded-xl bg-input border border-border px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="overflow-y-auto flex-1 px-4 pb-8">
          {query.trim() && (
            <button
              onClick={() => onSwap(query.trim())}
              className="w-full text-left px-3 py-3 rounded-xl hover:bg-muted/50 text-sm font-semibold text-primary border-b border-border/30 mb-1"
            >
              + Use "{query.trim()}" as custom exercise
            </button>
          )}
          {filtered.map((e) => (
            <button
              key={e.name}
              onClick={() => onSwap(e.name)}
              className={cn(
                'w-full text-left px-3 py-3 rounded-xl hover:bg-muted/50 text-sm border-b border-border/30 last:border-0',
                e.name === ex.name ? 'text-primary font-semibold' : 'text-foreground'
              )}
            >
              {e.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseNotes({ ex, onNotesChange, onNoteImagesChange }) {
  const [editing, setEditing] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [viewingIdx, setViewingIdx] = useState(null);
  const [replacing, setReplacing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const noteImages = (() => {
    try { return JSON.parse(ex.note_images || '[]'); } catch { return []; }
  })();

  const handleUpload = async (file, replaceIdx = null) => {
    if (!file) return;
    setUploading(true);
    setReplacing(false);
    setShowAddOptions(false);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = replaceIdx !== null
      ? noteImages.map((url, i) => i === replaceIdx ? file_url : url)
      : [...noteImages, file_url];
    onNoteImagesChange(ex.id, updated);
    if (replaceIdx !== null) setViewingIdx(replaceIdx);
    setUploading(false);
  };

  const handleDelete = (idx) => {
    onNoteImagesChange(ex.id, noteImages.filter((_, i) => i !== idx));
    setViewingIdx(null);
  };

  return (
    <div className="mb-3 flex flex-col gap-2">
      {/* Text note */}
      {editing ? (
        <textarea
          autoFocus
          value={ex.notes || ''}
          onChange={(e) => onNotesChange(ex.id, e.target.value)}
          onBlur={() => setEditing(false)}
          placeholder="Add a note for this exercise..."
          className="w-full bg-muted/40 rounded-xl px-3 py-2 text-xs text-muted-foreground resize-none min-h-[60px] border border-border focus:outline-none focus:border-primary"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full text-left bg-muted/40 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-muted/60 transition-colors flex items-center gap-2"
        >
          <Pencil size={11} className="shrink-0 opacity-50" />
          <span className={ex.notes ? '' : 'italic opacity-60'}>{ex.notes || 'Add a note...'}</span>
        </button>
      )}

      {/* Photo grid + add button */}
      <div className="flex flex-wrap gap-2 items-center">
        {noteImages.map((url, i) => (
          <button
            key={i}
            onClick={() => { setViewingIdx(i); setReplacing(false); }}
            className="w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0"
          >
            <img src={url} alt={`note-${i}`} className="w-full h-full object-cover" />
          </button>
        ))}
        <button
          onClick={() => setShowAddOptions(true)}
          className="w-16 h-16 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors shrink-0"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
          ) : (
            <>
              <Camera size={14} />
              <span className="text-[9px]">Add</span>
            </>
          )}
        </button>
      </div>

      {/* Add photo options sheet */}
      {showAddOptions && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60" onClick={() => setShowAddOptions(false)}>
          <div className="w-full max-w-sm bg-card rounded-t-3xl p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-1" />
            <p className="font-heading font-bold text-sm text-center">Add Note Photo</p>
            <label className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer">
              <Camera size={16} /> Take Photo
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
            </label>
            <label className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold cursor-pointer">
              <ImageIcon size={16} /> Upload from Library
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
            </label>
            <button onClick={() => setShowAddOptions(false)} className="text-xs text-muted-foreground text-center py-1">Cancel</button>
          </div>
        </div>
      )}

      {/* Photo viewer */}
      {viewingIdx !== null && noteImages[viewingIdx] && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80"
          onClick={() => { setViewingIdx(null); setReplacing(false); }}>
          <div className="relative w-full max-w-sm bg-card rounded-3xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setViewingIdx(null); setReplacing(false); }}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white"
            >
              <X size={18} />
            </button>
            <div className="relative w-full aspect-square bg-secondary">
              <img src={noteImages[viewingIdx]} alt="note" className="w-full h-full object-cover" />
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="px-5 pb-5 pt-4 flex flex-col gap-2">
              {!replacing ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setReplacing(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold"
                  >
                    <Camera size={16} /> Replace
                  </button>
                  <button
                    onClick={() => handleDelete(viewingIdx)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-destructive/10 text-destructive text-sm font-semibold"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer">
                      <Camera size={16} /> Take Photo
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, viewingIdx); e.target.value = ''; }} />
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold cursor-pointer">
                      <ImageIcon size={16} /> Library
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, viewingIdx); e.target.value = ''; }} />
                    </label>
                  </div>
                  <button onClick={() => setReplacing(false)} className="text-xs text-muted-foreground text-center py-1">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseTimer() {
  const [mode, setMode] = useState('open'); // 'open' | 'countdown'
  const [targetInput, setTargetInput] = useState('');
  const [phase, setPhase] = useState('idle'); // 'idle' | 'pre' | 'running' | 'stopped'
  const [displayCount, setDisplayCount] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [removed, setRemoved] = useState(false);
  const intervalRef = useRef(null);

  const parseMmSs = (str) => {
    if (!str) return 0;
    const parts = str.split(':');
    if (parts.length === 2) return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
    return parseInt(str) || 0;
  };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const clear = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

  useEffect(() => () => clear(), []);

  const startRunning = (currentMode, targetSecs) => {
    setPhase('running');
    if (currentMode === 'open') {
      let elapsed = 0;
      setDisplayCount(0);
      intervalRef.current = setInterval(() => { elapsed += 1; setDisplayCount(elapsed); }, 1000);
    } else {
      let remaining = targetSecs;
      setDisplayCount(targetSecs);
      intervalRef.current = setInterval(() => {
        remaining -= 1;
        setDisplayCount(remaining);
        if (remaining <= 0) { clearInterval(intervalRef.current); setPhase('stopped'); }
      }, 1000);
    }
  };

  const handleStart = () => {
    clear();
    const currentMode = mode;
    const targetSecs = parseMmSs(targetInput);
    let pre = 10;
    setPhase('pre');
    setDisplayCount(pre);
    intervalRef.current = setInterval(() => {
      pre -= 1;
      if (pre <= 0) { clear(); startRunning(currentMode, targetSecs); }
      else setDisplayCount(pre);
    }, 1000);
  };

  const handleStop = () => { clear(); setPhase('stopped'); };
  const handleReset = () => { clear(); setPhase('idle'); setDisplayCount(0); };

  if (removed) return null;

  const timeDisplay = phase === 'pre'
    ? String(displayCount)
    : phase === 'idle'
    ? (mode === 'countdown' ? (targetInput || '0:00') : '0:00')
    : fmt(displayCount);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-20 left-4 z-50 px-4 h-10 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm shadow-lg flex items-center gap-2"
      >
        <Timer size={14} /> {timeDisplay}
      </button>
    );
  }

  return (
    <div className="mb-3 bg-muted/40 border border-border rounded-2xl p-3 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Timer size={14} className="text-primary" /> Exercise Timer
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMinimized(true)} className="p-1 text-muted-foreground hover:text-foreground" title="Minimise">
            <ChevronDown size={15} />
          </button>
          <button onClick={() => { clear(); setRemoved(true); }} className="p-1 text-muted-foreground hover:text-destructive" title="Remove">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Mode selector — only when idle or stopped */}
      {(phase === 'idle' || phase === 'stopped') && (
        <div className="flex gap-1.5">
          {[['open', 'Open Timer'], ['countdown', 'Countdown']].map(([id, label]) => (
            <button key={id} onClick={() => { setMode(id); handleReset(); }}
              className={cn('flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-colors',
                mode === id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground')}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Countdown target input */}
      {mode === 'countdown' && (phase === 'idle' || phase === 'stopped') && (
        <input
          type="text" inputMode="numeric" placeholder="mm:ss — e.g. 1:30"
          value={targetInput}
          onChange={(e) => setTargetInput(e.target.value)}
          className="h-9 rounded-xl bg-input border border-border px-3 text-sm text-center"
        />
      )}

      {/* Big time display */}
      <div className="flex flex-col items-center py-1">
        {phase === 'pre' && <p className="text-xs text-muted-foreground mb-1">Get ready...</p>}
        <p className={cn('font-heading font-bold text-primary', phase === 'pre' ? 'text-6xl' : 'text-5xl')}>
          {timeDisplay}
        </p>
        {phase === 'stopped' && <p className="text-xs text-muted-foreground mt-1">Timer stopped</p>}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {(phase === 'idle' || phase === 'stopped') && (
          <>
            <button onClick={handleStart}
              disabled={mode === 'countdown' && !targetInput}
              className="flex-1 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40">
              {phase === 'stopped' ? 'Start Again' : 'Start Timer'}
            </button>
            {phase === 'stopped' && (
              <button onClick={handleReset} className="px-4 py-2.5 rounded-2xl bg-secondary text-foreground text-sm font-semibold">
                Reset
              </button>
            )}
          </>
        )}
        {phase === 'pre' && (
          <button onClick={() => { clear(); setPhase('idle'); setDisplayCount(0); }}
            className="flex-1 py-2.5 rounded-2xl bg-secondary text-foreground text-sm font-bold">
            Cancel
          </button>
        )}
        {phase === 'running' && (
          <button onClick={handleStop} className="flex-1 py-2.5 rounded-2xl bg-destructive text-white text-sm font-bold">
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

function ExerciseCard({ ex, exSets, isOpen, isCollapsed, prevSets, onToggle, onUpdateSet, onCompleteSet, onUncompleteSet, onAddSet, onNotesChange, onNoteImagesChange, onRepRangeChange, onRepModeChange, onDeleteSet, onSwapExercise, onImageChange, sessionType, divider, userId }) {
  const { unit: weightUnit, toggle: toggleUnit, toDisplay, toKg } = useWeightUnit();
  const isCardio = ex.exercise_type === 'cardio';
  const cardioUnit = CARDIO_UNITS[ex.cardio_metric] || 'km';
  const [rirPickerFor, setRirPickerFor] = useState(null);
  const [showSwap, setShowSwap] = useState(false);
  const [swipeOffsets, setSwipeOffsets] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [changingPhoto, setChangingPhoto] = useState(false);
  const cameraInputRef = useRef(null);
  const libraryInputRef = useRef(null);
  const swipeTouchStart = useRef({});

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setChangingPhoto(false);
    setShowPhotoOptions(false);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.SplitExercise.update(ex.id, { image_url: file_url });
    onImageChange && onImageChange(ex.id, file_url);
    setUploadingImage(false);
  };

  const handleSwipeTouchStart = (idx, e) => {
    swipeTouchStart.current[idx] = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      baseOffset: swipeOffsets[idx] || 0,
    };
  };

  const handleSwipeTouchMove = (idx, e) => {
    const start = swipeTouchStart.current[idx];
    if (!start) return;
    const dx = e.touches[0].clientX - start.x;
    const dy = e.touches[0].clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) + 5) {
      const newOffset = Math.min(Math.max(start.baseOffset + dx, -90), 0);
      setSwipeOffsets((prev) => ({ ...prev, [idx]: newOffset }));
    }
  };

  const handleSwipeTouchEnd = (idx) => {
    const offset = swipeOffsets[idx] || 0;
    if (offset < -40) {
      // Snap open to reveal delete button
      setSwipeOffsets((prev) => ({ ...prev, [idx]: -80 }));
    } else {
      // Snap back closed
      setSwipeOffsets((prev) => ({ ...prev, [idx]: 0 }));
    }
    delete swipeTouchStart.current[idx];
  };

  const handleDeleteTap = (idx) => {
    onDeleteSet(ex.id, idx);
    setSwipeOffsets((prev) => { const n = { ...prev }; delete n[idx]; return n; });
  };

  const handleRowTap = (idx) => {
    if ((swipeOffsets[idx] || 0) < 0) {
      setSwipeOffsets((prev) => ({ ...prev, [idx]: 0 }));
    }
  };

  const renderSetRow = (s, actualIdx, label, isDropset = false, prevSet = null) => {
    const swipeOffset = swipeOffsets[actualIdx] || 0;
    return (
      <div
        key={actualIdx}
        className="relative overflow-hidden rounded-2xl"
        onTouchStart={(e) => handleSwipeTouchStart(actualIdx, e)}
        onTouchMove={(e) => handleSwipeTouchMove(actualIdx, e)}
        onTouchEnd={() => handleSwipeTouchEnd(actualIdx)}
        onClick={() => { if ((swipeOffsets[actualIdx] || 0) < 0) setSwipeOffsets((prev) => ({ ...prev, [actualIdx]: 0 })); }}
      >
        <button
          className="absolute inset-y-0 right-0 w-20 bg-destructive flex items-center justify-center"
          style={{
            transform: `translateX(${80 + swipeOffset}px)`,
            transition: swipeTouchStart.current[actualIdx] ? 'none' : 'transform 0.2s ease',
          }}
          onClick={(e) => { e.stopPropagation(); handleDeleteTap(actualIdx); }}
        >
          <Trash2 size={16} className="text-white" />
        </button>
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-2.5 transition-all',
            isDropset ? 'bg-primary/5 ml-3 border-l-2 border-primary/30' : '',
            s.completed ? 'bg-primary/10' : (!isDropset ? 'bg-muted/40' : '')
          )}
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: swipeTouchStart.current[actualIdx] ? 'none' : 'transform 0.2s ease',
          }}
          onClick={() => handleRowTap(actualIdx)}
        >
          <span className={cn(
            'text-xs font-semibold w-5 shrink-0 text-center',
            isDropset ? 'text-primary/70' : (s.completed ? 'text-primary' : 'text-muted-foreground')
          )}>
            {label}
          </span>

          {isCardio ? (
            <>
              <Input
                type="number"
                placeholder={ex.target_reps || cardioUnit}
                value={s.reps}
                min="0"
                onChange={(e) => onUpdateSet(ex.id, actualIdx, { reps: e.target.value === '' ? '' : String(Math.max(0, parseFloat(e.target.value) || 0)) })}
                onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                disabled={s.completed}
                className="flex-1 h-10 text-center bg-background border-border rounded-xl text-sm font-semibold"
              />
              <span className="text-xs text-muted-foreground shrink-0">{cardioUnit}</span>
            </>
          ) : (
            <>
              <div className={cn(
                'w-14 shrink-0 h-10 flex items-center justify-center border rounded-xl text-xs font-semibold',
                isDropset ? 'bg-primary/10 border-primary/20 text-primary/70' : 'bg-muted/60 border-border text-muted-foreground'
              )}>
                {isDropset ? 'DS' : (ex.target_reps || '—')}
              </div>

              <input
                type="number"
                inputMode="decimal"
                placeholder={prevSet?.weight_kg != null ? toDisplay(prevSet.weight_kg).toString() : '—'}
                value={s.weight_display ?? ''}
                min="0"
                onChange={(e) => {
                  const displayVal = e.target.value === '' ? '' : String(Math.max(0, parseFloat(e.target.value) || 0));
                  onUpdateSet(ex.id, actualIdx, { weight_display: displayVal, weight_kg: toKg(displayVal) });
                }}
                onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                disabled={s.completed}
                className="flex-1 h-10 text-center bg-background border border-border rounded-xl text-sm font-bold outline-none focus:border-primary transition-colors disabled:opacity-50 min-w-0 placeholder:text-muted-foreground/40 placeholder:font-normal"
              />

              {ex.rep_mode === 'time' ? (() => {
                // Convert stored value (plain seconds or mm:ss) to mm:ss display
                const toMmSs = (val) => {
                  if (!val) return '';
                  const s = String(val);
                  if (s.includes(':')) return s;
                  const secs = parseInt(s) || 0;
                  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
                };
                const formatMmSs = (raw) => {
                  let v = raw.replace(/[^0-9:]/g, '');
                  const parts = v.split(':');
                  if (parts.length > 2) v = parts[0] + ':' + parts.slice(1).join('');
                  if (v.split(':').length === 2) {
                    const [m, sec] = v.split(':');
                    v = m + ':' + sec.slice(0, 2);
                  }
                  return v;
                };
                return (
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0:00"
                    value={toMmSs(s.reps)}
                    onChange={(e) => onUpdateSet(ex.id, actualIdx, { reps: formatMmSs(e.target.value) })}
                    onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                    disabled={s.completed}
                    className="flex-1 h-10 text-center bg-background border border-border rounded-xl text-sm font-bold outline-none focus:border-primary transition-colors disabled:opacity-50 min-w-0 placeholder:text-muted-foreground/40 placeholder:font-normal"
                  />
                );
              })() : (
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={prevSet?.reps?.toString() || '—'}
                  value={s.reps}
                  min="0"
                  onChange={(e) => onUpdateSet(ex.id, actualIdx, { reps: e.target.value === '' ? '' : String(Math.max(0, parseFloat(e.target.value) || 0)) })}
                  onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                  disabled={s.completed}
                  className="flex-1 h-10 text-center bg-background border border-border rounded-xl text-sm font-bold outline-none focus:border-primary transition-colors disabled:opacity-50 min-w-0 placeholder:text-muted-foreground/40 placeholder:font-normal"
                />
              )}

              <button
                disabled={s.completed}
                onClick={() => !s.completed && setRirPickerFor({ exId: ex.id, setIdx: actualIdx })}
                className={cn(
                  'w-14 h-10 rounded-xl border text-sm font-bold shrink-0 flex items-center justify-center transition-colors',
                  s.rpe !== '' && s.rpe != null
                    ? 'bg-primary/10 text-primary border-primary/40'
                    : 'border-border text-muted-foreground/40 hover:border-primary/50 disabled:opacity-50'
                )}
              >
                {s.rpe !== '' && s.rpe != null ? s.rpe : (prevSet?.rpe != null ? prevSet.rpe : '—')}
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (s.completed) {
                onUncompleteSet(ex, actualIdx);
              } else if (!isCardio) {
                setRirPickerFor({ exId: ex.id, setIdx: actualIdx });
              } else {
                onCompleteSet(ex, actualIdx);
              }
            }}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0',
              s.completed
                ? 'bg-primary text-primary-foreground shadow-[0_0_10px_hsl(35_96%_58%/0.4)]'
                : 'border-2 border-border text-muted-foreground hover:border-primary hover:text-primary'
            )}
          >
            <Check size={14} />
          </button>
        </div>
      </div>
    );
  };

  const renderSets = () => {
    const rows = [];
    const dropsetCount = ex.dropset_count || 0;

    rows.push(
      <div key="headers" className="flex items-center px-1 mb-1">
        <span className="w-6 shrink-0" />
        {isCardio ? (
          <span className="flex-1 text-[10px] text-muted-foreground text-center uppercase tracking-widest">{ex.cardio_metric || 'Distance'}</span>
        ) : (
          <>
            <span className="w-14 text-[10px] text-muted-foreground text-center uppercase tracking-widest shrink-0">Range</span>
            <span className="flex-1 text-[10px] text-muted-foreground text-center uppercase tracking-widest">Weight ({weightUnit})</span>
            <span className="flex-1 text-[10px] text-muted-foreground text-center uppercase tracking-widest">{ex.rep_mode === 'time' ? 'Time' : 'Reps'}</span>
            <span className="w-14 text-[10px] text-muted-foreground text-center uppercase tracking-widest ml-2">RIR</span>
            <span className="w-10 shrink-0" />
          </>
        )}
        {!isCardio && dropsetCount > 0 && (
          <span className="text-[9px] text-primary/60 font-semibold ml-1">+{dropsetCount}DS</span>
        )}
      </div>
    );

    // Group sets: each "normal" set may be followed by its drop sets
    // We track which sets are normal vs dropset by set_type
    const normalSets = exSets.filter((s) => s.set_type !== 'dropset');
    const dropsetSets = exSets.filter((s) => s.set_type === 'dropset');

    // Build a flat ordered list pairing normal sets with their drop sets
    let dropsetIdx = 0;
    normalSets.forEach((s, normalIdx) => {
      const actualIdx = exSets.indexOf(s);
      rows.push(renderSetRow(s, actualIdx, String(s.set_number), false, prevSets[normalIdx]));

      // Inline drop set rows for this normal set
      const myDropsets = dropsetSets.slice(normalIdx * dropsetCount, normalIdx * dropsetCount + dropsetCount);
      myDropsets.forEach((ds, di) => {
        const dsActualIdx = exSets.indexOf(ds);
        rows.push(renderSetRow(ds, dsActualIdx, `D${di + 1}`, true, null));
      });
    });

    return rows;
  };

  const handleRirConfirm = (rirValue) => {
    const { exId, setIdx } = rirPickerFor;
    onUpdateSet(exId, setIdx, { rpe: rirValue != null ? String(rirValue) : '', rpeEdited: true });
    onCompleteSet(ex, setIdx, rirValue != null ? String(rirValue) : undefined);
    setRirPickerFor(null);
  };

  const handleRirSkip = () => {
    const { exId, setIdx } = rirPickerFor;
    onCompleteSet(ex, setIdx);
    setRirPickerFor(null);
  };

  return (
    <>
      {/* Photo viewer modal — shown when exercise already has a photo */}
      {viewingPhoto && ex.image_url && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80" onClick={() => { setViewingPhoto(false); setChangingPhoto(false); }}>
          <div className="relative w-full max-w-sm bg-card rounded-3xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setViewingPhoto(false); setChangingPhoto(false); }}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white"
            >
              <X size={18} />
            </button>
            <div className="relative w-full aspect-square bg-secondary">
              <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" />
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="px-5 pt-4 pb-2">
              <p className="font-heading font-bold text-base truncate">{ex.name}</p>
              <p className="text-xs text-muted-foreground">
                {isCardio ? ex.cardio_metric || 'cardio' : `${ex.target_sets} × ${ex.target_reps}`}
              </p>
            </div>
            <div className="px-5 pb-5 pt-2">
              {!changingPhoto ? (
                <button
                  onClick={() => setChangingPhoto(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold"
                >
                  <Camera size={16} /> Change Photo
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer">
                      <Camera size={16} /> Take Photo
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { handlePhotoChange(e); setViewingPhoto(false); }} />
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold cursor-pointer">
                      <ImageIcon size={16} /> Library
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { handlePhotoChange(e); setViewingPhoto(false); }} />
                    </label>
                  </div>
                  <button onClick={() => setChangingPhoto(false)} className="text-xs text-muted-foreground text-center py-1">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo options sheet — shown when exercise has no photo yet */}
      {showPhotoOptions && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60" onClick={() => setShowPhotoOptions(false)}>
          <div className="w-full max-w-sm bg-card rounded-t-3xl p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-1" />
            <p className="font-heading font-bold text-sm text-center">{ex.name}</p>
            <label className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer">
              <Camera size={16} /> Take Photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { handlePhotoChange(e); setShowPhotoOptions(false); }} />
            </label>
            <label className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold cursor-pointer">
              <ImageIcon size={16} /> Upload from Library
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { handlePhotoChange(e); setShowPhotoOptions(false); }} />
            </label>
            <button onClick={() => setShowPhotoOptions(false)} className="text-xs text-muted-foreground text-center py-1">Cancel</button>
          </div>
        </div>
      )}

      {rirPickerFor && (
        <RIRPicker
          initialValue={exSets[rirPickerFor.setIdx]?.rpe}
          onConfirm={handleRirConfirm}
          onSkip={handleRirSkip}
        />
      )}
      {showSwap && (
        <SwapExerciseModal
          ex={ex}
          sessionType={sessionType || 'Custom'}
          onSwap={(newName) => { onSwapExercise(ex.id, newName); setShowSwap(false); }}
          onClose={() => setShowSwap(false)}
        />
      )}
      {divider && <div className="border-t border-border/50" />}
      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
      <input ref={libraryInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      {isCollapsed ? (
        /* ── Reorder mode: compact name-only strip ── */
        <div
          className="px-4 py-3 flex items-center gap-3"
          data-drag-handle="true"
        >
          <p className="font-heading font-semibold text-sm flex-1 min-w-0 truncate">{ex.name}</p>
          <span className="text-xs text-muted-foreground shrink-0">
            {exSets.filter((s) => s.completed).length}/{exSets.length}
          </span>
        </div>
      ) : (
        <>
          {/* ── Full card header ── */}
          <div
            className="w-full flex items-center justify-between px-4 py-3 min-h-11"
            data-drag-handle="true"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Exercise thumbnail */}
              {ex.image_url ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setViewingPhoto(true); setChangingPhoto(false); }}
                  className="w-10 h-10 rounded-xl overflow-hidden border border-border shrink-0 relative"
                >
                  <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" />
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPhotoOptions(true); }}
                  className="w-10 h-10 rounded-xl border border-dashed border-border flex items-center justify-center shrink-0 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  title="Add photo"
                >
                  {uploadingImage ? (
                    <div className="w-3 h-3 border-2 border-muted border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Camera size={14} />
                  )}
                </button>
              )}
              <div className="min-w-0">
                <p className="font-heading font-semibold text-sm text-left">{ex.name}</p>
                <p className="text-muted-foreground text-xs">
                  {isCardio
                    ? `${ex.cardio_metric || 'distance'} · target: ${ex.target_reps || '—'} ${cardioUnit}`
                    : `${ex.target_sets} × ${ex.target_reps} · ${ex.rest_seconds}s rest`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSwap(true); }}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                title="Swap exercise"
              >
                <ArrowLeftRight size={13} />
              </button>
              {!isCardio && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleUnit(); }}
                  className="text-[10px] px-2 py-0.5 rounded-lg border border-border font-bold text-primary"
                >
                  {weightUnit.toUpperCase()}
                </button>
              )}
              <span className="text-xs text-muted-foreground">
                {exSets.filter((s) => s.completed).length}/{exSets.length}
              </span>
            </div>
          </div>
          {/* ── Sets / notes body ── */}
          {isOpen && (
            <div className="border-t border-border px-4 pb-4 pt-3">
              {ex.rep_mode === 'time' && <ExerciseTimer />}
              <ExerciseNotes ex={ex} onNotesChange={onNotesChange} onNoteImagesChange={onNoteImagesChange} />
              <ExerciseHistory exerciseName={ex.name} userId={userId} weightUnit={weightUnit} toDisplay={toDisplay} />
              {!isCardio && (
                <RepRangePicker
                  exId={ex.id}
                  repMode={ex.rep_mode}
                  targetReps={ex.target_reps}
                  onRepRangeChange={onRepRangeChange}
                  onRepModeChange={onRepModeChange}
                />
              )}
              <div className="flex flex-col gap-1.5">{renderSets()}</div>
              <button
                onClick={() => onAddSet(ex.id)}
                className="w-full mt-2 flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-primary border border-dashed border-border rounded-xl transition-colors min-h-11"
              >
                <Plus size={12} /> Add set
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function ActiveWorkout() {
  const { dayId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [workoutLog, setWorkoutLog] = useState(null);
  const [sets, setSets] = useState({});
  const [expanded, setExpanded] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState(null);
  const [timerMinimized, setTimerMinimized] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [persistedGameState, setPersistedGameState] = useState(null);
  const [exerciseOrder, setExerciseOrder] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [localExercises, setLocalExercises] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [longPressId, setLongPressId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [summaryImageUrl, setSummaryImageUrl] = useState(null);
  const [showImportDay, setShowImportDay] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const summaryRef = useRef(null);
  const startTime = useRef(new Date());
  const timerRef = useRef(null);
  const startingWorkout = useRef(false);
  const streakIncreased = useRef(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const { data: day } = useQuery({
    queryKey: ['splitDay', dayId],
    queryFn: () => base44.entities.SplitDay.filter({ id: dayId }),
    select: (d) => d[0],
    enabled: !!dayId,
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['splitExercises', dayId],
    queryFn: () => base44.entities.SplitExercise.filter({ split_day_id: dayId }, 'order_index'),
    enabled: !!dayId,
  });

  // Must be declared before the prevLogs query which references it
  const activeExercises = localExercises ?? exercises;

  const { data: prevLogs = [] } = useQuery({
    queryKey: ['prevSetLogs', user?.email, activeExercises.map((e) => e.name).join(',')],
    queryFn: async () => {
      if (!activeExercises.length) return [];
      // For each exercise in the current workout, fetch its most recent completed sets
      // across ALL workout days (not restricted to this split_day_id)
      const perExercise = await Promise.all(
        activeExercises.map((ex) =>
          base44.entities.SetLog.filter(
            { user_id: user.email, exercise_name: ex.name, completed: true },
            '-created_date',
            20
          )
        )
      );
      return perExercise.flat();
    },
    enabled: !!user && activeExercises.length > 0,
    staleTime: 0,
  });

  const { data: allTimeLogs = [] } = useQuery({
    queryKey: ['allTimeLogs', user?.email],
    queryFn: () => base44.entities.SetLog.filter({ user_id: user.email, completed: true }, '-weight_kg', 500),
    enabled: !!user,
    staleTime: 60000,
  });

  const allTimeBests = useMemo(() => {
    const bests = {};
    allTimeLogs.forEach((log) => {
      if (!log.exercise_name) return;
      const key = log.exercise_name.toLowerCase();
      const w = Number(log.weight_kg) || 0;
      const r = Number(log.reps) || 0;
      if (!bests[key]) {
        bests[key] = { maxWeight: w, maxRepsAtMaxWeight: r };
      } else {
        if (w > bests[key].maxWeight) {
          bests[key] = { maxWeight: w, maxRepsAtMaxWeight: r };
        } else if (w === bests[key].maxWeight && r > bests[key].maxRepsAtMaxWeight) {
          bests[key].maxRepsAtMaxWeight = r;
        }
      }
    });
    return bests;
  }, [allTimeLogs]);

  // Must be defined before useEffects that use it
  const buildSetsForExerciseEarly = (ex, count) => {
    const dropCount = ex.dropset_count || 0;
    const result = [];
    let setNum = 1;
    for (let i = 0; i < count; i++) {
      result.push({ set_number: setNum++, reps: '', weight_kg: '', weight_display: '', rpe: '', set_type: 'normal', completed: false });
      for (let d = 0; d < dropCount; d++) {
        result.push({ set_number: setNum++, reps: '', weight_kg: '', weight_display: '', rpe: '', set_type: 'dropset', completed: false });
      }
    }
    return result;
  };

  useEffect(() => {
    if (exercises.length && !exerciseOrder.length) {
      setExerciseOrder(exercises.map((e) => e.id));
    }
  }, [exercises]);

  useEffect(() => {
    if (exercises.length && !Object.keys(sets).length) {
      const initial = {};
      const exp = {};
      exercises.forEach((ex) => {
        exp[ex.id] = true;
        initial[ex.id] = buildSetsForExerciseEarly(ex, ex.target_sets || 3);
      });
      setSets(initial);
      setExpanded(exp);
    }
  }, [exercises]);

  const handleEditorReorder = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= activeExercises.length) return;
    const next = [...activeExercises];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setLocalExercises(next);
    setExerciseOrder(next.map((e) => e.id));
  };

  const handleEditorRemove = (exId) => {
    const next = activeExercises.filter((e) => e.id !== exId);
    setLocalExercises(next);
    setExerciseOrder(next.map((e) => e.id));
    setSets((prev) => { const copy = { ...prev }; delete copy[exId]; return copy; });
    setExpanded((prev) => { const copy = { ...prev }; delete copy[exId]; return copy; });
  };

  const handleEditorAdd = (ex) => {
    const next = [...activeExercises, ex];
    setLocalExercises(next);
    setExerciseOrder(next.map((e) => e.id));
    setSets((prev) => ({
      ...prev,
      [ex.id]: buildSetsForExerciseEarly(ex, ex.target_sets || 3),
    }));
    setExpanded((prev) => ({ ...prev, [ex.id]: true }));
  };

  const startWorkout = async () => {
    if (!workoutLog && user && day && !startingWorkout.current) {
      startingWorkout.current = true;
      try {
        const log = await base44.entities.WorkoutLog.create({
          user_id: user.email,
          split_day_id: dayId,
          split_day_name: `${day.day_of_week} — ${day.custom_name || day.session_type}`,
          started_at: startTime.current.toISOString(),
          is_rest_day: false,
        });
        setWorkoutLog(log);
      } catch (err) {
        toast.error('Failed to start workout. Please try again.');
      } finally {
        startingWorkout.current = false;
      }
    }
  };

  useEffect(() => {
    if (user && day) startWorkout();
  }, [user, day]);

  const getPrevSets = (exName) => {
    const prev = prevLogs.filter((s) => s.exercise_name === exName);
    if (!prev.length) return [];
    const sorted = [...prev].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const lastLogId = sorted[0].workout_log_id;
    return prev.filter((s) => s.workout_log_id === lastLogId).sort((a, b) => a.set_number - b.set_number);
  };

  const updateSet = (exId, setIdx, patch) => {
    setSets((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => (i === setIdx ? { ...s, ...patch } : s)),
    }));
  };

  const uncompleteSet = async (ex, setIdx) => {
    const set = sets[ex.id][setIdx];
    updateSet(ex.id, setIdx, { completed: false });
    if (workoutLog) {
      const logs = await base44.entities.SetLog.filter({
        workout_log_id: workoutLog.id,
        exercise_name: ex.name,
        set_number: set.set_number,
        completed: true,
      });
      await Promise.all(logs.map((l) => base44.entities.SetLog.delete(l.id)));
    }
  };

  const completeSet = async (ex, setIdx, rpeOverride) => {
    const set = sets[ex.id][setIdx];
    updateSet(ex.id, setIdx, { completed: true });

    // Build notification: PR takes priority over rep feedback
    let newNotification = null;

    // PR detection (strength only)
    if (ex.exercise_type !== 'cardio' && set.reps && set.weight_kg) {
      const key = ex.name.toLowerCase();
      const best = allTimeBests[key];
      const w = Number(set.weight_kg);
      const r = Number(set.reps);
      let isPR = false;
      let prMsg = '';
      if (!best) {
        isPR = true;
        prMsg = `${ex.name}: ${w}kg × ${r} reps — first time tracked!`;
      } else if (w > best.maxWeight) {
        isPR = true;
        prMsg = `${ex.name}: new max weight ${w}kg (prev: ${best.maxWeight}kg)`;
      } else if (w === best.maxWeight && r > best.maxRepsAtMaxWeight) {
        isPR = true;
        prMsg = `${ex.name}: ${r} reps at ${w}kg (prev best: ${best.maxRepsAtMaxWeight} reps)`;
      }
      if (isPR) {
        newNotification = { type: 'pr', message: prMsg };
      }
    }

    // Rep range feedback (strength only) — only if no PR
    if (!newNotification && ex.exercise_type !== 'cardio' && set.reps) {
      const range = parseRepRange(ex.target_reps);
      const completedNormalSets = (sets[ex.id] || []).filter((s, i) => i <= setIdx && s.set_type !== 'dropset').length;
      const totalNormalSets = (sets[ex.id] || []).filter((s) => s.set_type !== 'dropset').length;
      const feedback = getRepFeedback(set.reps, range, completedNormalSets, totalNormalSets);
      if (feedback) newNotification = { type: 'rep_feedback', ...feedback };
    }

    setNotification(newNotification);

    const rpeValue = rpeOverride !== undefined ? rpeOverride : set.rpe;

    if (workoutLog) {
      await base44.entities.SetLog.create({
        workout_log_id: workoutLog.id,
        user_id: user.email,
        exercise_name: ex.name,
        exercise_order: ex.order_index,
        set_number: set.set_number,
        reps: Number(set.reps),
        weight_kg: Number(set.weight_kg),
        rpe: rpeValue !== '' && rpeValue != null ? Number(rpeValue) : undefined,
        set_type: set.set_type,
        completed: true,
      });
    }

    if (set.set_type !== 'dropset' && ex.rest_seconds) {
      setRestTimer({ seconds: ex.rest_seconds, total: ex.rest_seconds });
      setTimerMinimized(false);
    }
  };

  const notesTimers = useRef({});
  const updateExerciseNotes = (exId, notes) => {
    const update = (list) => list.map((e) => e.id === exId ? { ...e, notes } : e);
    setLocalExercises((prev) => update(prev ?? exercises));
    if (notesTimers.current[exId]) clearTimeout(notesTimers.current[exId]);
    notesTimers.current[exId] = setTimeout(() => {
      base44.entities.SplitExercise.update(exId, { notes }).catch(() => {
        toast.error('Could not save note. Please try again.');
      });
    }, 1000);
  };

  const updateExerciseNoteImages = (exId, imagesArray) => {
    const note_images = JSON.stringify(imagesArray);
    setLocalExercises((prev) => (prev ?? exercises).map((e) => e.id === exId ? { ...e, note_images } : e));
    base44.entities.SplitExercise.update(exId, { note_images }).catch(() => {
      toast.error('Could not save photo. Please try again.');
    });
  };

  const updateRepRange = (exId, target_reps) => {
    const update = (list) => list.map((e) => e.id === exId ? { ...e, target_reps } : e);
    setLocalExercises((prev) => update(prev ?? exercises));
  };

  const updateRepMode = (exId, rep_mode) => {
    const update = (list) => list.map((e) => e.id === exId ? { ...e, rep_mode, target_reps: '' } : e);
    setLocalExercises((prev) => update(prev ?? exercises));
  };

  const deleteSet = (exId, setIdx) => {
    setSets((prev) => {
      const updated = (prev[exId] || [])
        .filter((_, i) => i !== setIdx)
        .map((s, i) => ({ ...s, set_number: i + 1 }));
      return { ...prev, [exId]: updated };
    });
  };

  const swapExercise = (exId, newName) => {
    setLocalExercises((prev) =>
      (prev ?? exercises).map((e) => e.id === exId ? { ...e, name: newName } : e)
    );
  };

  const updateExerciseImage = (exId, image_url) => {
    setLocalExercises((prev) =>
      (prev ?? exercises).map((e) => e.id === exId ? { ...e, image_url } : e)
    );
  };

  // framer-motion Reorder hands us the NEW array order on every drop
  const handleReorder = (nextOrderedExercises) => {
    setLocalExercises(nextOrderedExercises);
    setExerciseOrder(nextOrderedExercises.map((e) => e.id));
  };

  const addSet = (exId) => {
    const ex = activeExercises.find((e) => e.id === exId);
    const dropCount = ex?.dropset_count || 0;
    setSets((prev) => {
      const current = prev[exId] || [];
      const normalCount = current.filter((s) => s.set_type !== 'dropset').length;
      const newSetNum = current.length + 1;
      const toAdd = [
        { set_number: newSetNum, reps: '', weight_kg: '', weight_display: '', rpe: '', set_type: 'normal', completed: false },
      ];
      for (let d = 0; d < dropCount; d++) {
        toAdd.push({ set_number: newSetNum + d + 1, reps: '', weight_kg: '', weight_display: '', rpe: '', set_type: 'dropset', completed: false });
      }
      return { ...prev, [exId]: [...current, ...toAdd] };
    });
  };

  const totalSets = Object.values(sets).flat().length;
  const completedSets = Object.values(sets).flat().filter((s) => s.completed).length;
  const allDone = totalSets > 0 && completedSets === totalSets;

  // Background-only: update the group streak without blocking the UI.
  // Runs fire-and-forget after the celebration is already showing so a slow
  // multi-member network fan-out can never freeze the "Finish Workout" tap.
  const updateGroupStreaksInBackground = (currentUser) => {
    if (!currentUser) return;
    (async () => {
      try {
        const today = startOfDay(new Date());
        const todayStr = format(today, 'yyyy-MM-dd');
        const todayDayName = format(today, 'EEEE');
        const yesterday = format(subDays(today, 1), 'yyyy-MM-dd');

        const memberships = await base44.entities.GroupMember.filter({ user_id: currentUser.email });
        for (const myMembership of memberships) {
          try {
            const groupArr = await base44.entities.Group.filter({ id: myMembership.group_id });
            const groupData = groupArr[0];
            if (!groupData) continue;
            if (groupData.group_streak_date === todayStr) continue;

            const allGroupMembers = await base44.entities.GroupMember.filter({ group_id: myMembership.group_id });
            const memberDone = await Promise.all(
              allGroupMembers.map(async (m) => {
                const mLogs = await base44.entities.WorkoutLog.filter({ user_id: m.user_id }, '-created_date', 20);
                const finishedToday = mLogs.some(
                  (l) => l.finished_at && (l.created_date || '').slice(0, 10) === todayStr
                );
                if (finishedToday) return true;
                const mSplitDays = await base44.entities.SplitDay.filter({ user_id: m.user_id });
                return mSplitDays.some((sd) => sd.day_of_week === todayDayName && sd.session_type === 'Rest');
              })
            );

            const difficulty = groupData.difficulty || 'medium';
            const prevGroupStreak = groupData.group_streak || 0;
            const streakContinues = groupData.group_streak_date === yesterday || groupData.group_streak_date === todayStr;

            let newGroupStreak;
            if (difficulty === 'easy') {
              newGroupStreak = streakContinues ? prevGroupStreak + 1 : 1;
            } else if (difficulty === 'medium') {
              if (!memberDone.some(Boolean)) continue;
              newGroupStreak = streakContinues ? prevGroupStreak + 1 : 1;
            } else {
              if (!memberDone.every(Boolean)) continue;
              newGroupStreak = streakContinues ? prevGroupStreak + 1 : 1;
            }

            await base44.entities.Group.update(groupData.id, {
              group_streak: newGroupStreak,
              group_streak_date: todayStr,
            });
          } catch (_) {
            // Non-fatal — one bad group shouldn't stop the others
          }
        }
      } catch (_) {
        // Non-fatal
      }
    })();
  };

  const finishMutation = useMutation({
    mutationFn: async () => {
      // 1. Persist the workout as finished
      if (workoutLog) {
        await base44.entities.WorkoutLog.update(workoutLog.id, {
          finished_at: new Date().toISOString(),
          duration_minutes: Math.round(elapsed / 60),
        });
      }

      streakIncreased.current = false;

      // Rest days never touch personal streak
      if (!day || day.session_type === 'Rest') {
        setCurrentStreak(0);
        return;
      }

      if (!user) return;

      // 2. Compute newStreak the SAME way the Workouts page does — live from
      //    WorkoutLog + SplitDay. This is the single source of truth so the
      //    celebration and the main page always show identical numbers.
      const [freshLogs, freshSplitDays] = await Promise.all([
        base44.entities.WorkoutLog.filter({ user_id: user.email }, '-started_at', 200),
        base44.entities.SplitDay.filter({ user_id: user.email }),
      ]);

      // Ensure the just-finished log is reflected even if the refetch races
      // ahead of server write-consistency.
      const todayMidnight = startOfDay(new Date()).getTime();
      const mergedLogs = freshLogs.some(
        (l) => l.finished_at && new Date(l.created_date || l.started_at).setHours(0, 0, 0, 0) === todayMidnight
      )
        ? freshLogs
        : [
            ...freshLogs,
            { ...(workoutLog || {}), finished_at: new Date().toISOString(), is_rest_day: false, created_date: new Date().toISOString() },
          ];

      const newStreak = calculateStreak(mergedLogs, freshSplitDays);
      setCurrentStreak(newStreak);

      // Previous streak is one less — this workout is what bumped it up
      streakIncreased.current = newStreak > 0;

      // Keep GroupMember.streak in sync for legacy reads (non-blocking)
      base44.entities.GroupMember.filter({ user_id: user.email })
        .then((members) => {
          if (members[0]) base44.entities.GroupMember.update(members[0].id, { streak: newStreak }).catch(() => {});
        })
        .catch(() => {});

      // 3. Group streak — fire-and-forget, cannot block the UI
      updateGroupStreaksInBackground(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutLogs'] });
      if (streakIncreased.current) {
        setShowStreakCelebration(true);
      } else {
        setShowSummary(true);
      }
    },
    onError: () => {
      toast.error('Workout saved locally but could not sync. Check your connection.');
      setShowSummary(true);
    },
  });

  const handleImportDay = (parsed) => {
    const imported = (parsed.exercises || []).map((ex, i) => ({
      id: `ai-import-${Date.now()}-${i}`,
      name: ex.exercise_name,
      exercise_type: 'strength',
      target_sets: ex.target_sets || (ex.sets?.length) || 3,
      target_reps: ex.target_reps || String(ex.sets?.[0]?.reps || '8-12'),
      rest_seconds: 90,
      order_index: (activeExercises.length) + i,
      notes: '',
    }));
    const importedSets = {};
    imported.forEach((ex, i) => {
      const parsedEx = parsed.exercises[i];
      if (parsedEx.sets && parsedEx.sets.length > 0) {
        importedSets[ex.id] = parsedEx.sets.map((s, si) => ({
          set_number: si + 1,
          reps: s.reps != null ? String(s.reps) : '',
          weight_kg: s.weight_kg != null ? s.weight_kg : '',
          weight_display: s.weight_kg != null ? String(s.weight_kg) : '',
          rpe: s.rir != null ? String(s.rir) : '',
          set_type: 'normal',
          completed: false,
        }));
      } else {
        importedSets[ex.id] = Array.from({ length: ex.target_sets }, (_, si) => ({
          set_number: si + 1, reps: '', weight_kg: '', weight_display: '', rpe: '', set_type: 'normal', completed: false,
        }));
      }
    });
    const next = [...activeExercises, ...imported];
    setLocalExercises(next);
    setExerciseOrder(next.map((e) => e.id));
    setSets((prev) => ({ ...prev, ...importedSets }));
    setExpanded((prev) => {
      const exp = { ...prev };
      imported.forEach((ex) => { exp[ex.id] = true; });
      return exp;
    });
    toast.success(`Imported ${imported.length} exercise${imported.length !== 1 ? 's' : ''} from screenshot`);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}>
      {/* Header — padded to sit below the iOS status bar */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 pb-3" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setShowDiscardConfirm(true)} className="text-muted-foreground">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <p className="font-heading font-semibold text-sm">{day?.day_of_week} — {day?.custom_name || day?.session_type}</p>
            <p className="text-primary font-mono text-lg font-bold">{formatTime(elapsed)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportDay(true)}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg border border-primary/30 bg-primary/5 text-primary"
            >
              <ScanLine size={12} />
              Scan
            </button>
            <button
              onClick={() => setShowEditor(true)}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-muted-foreground"
            >
              <Pencil size={12} />
              Edit
            </button>
            <div className="text-xs text-muted-foreground">{completedSets}/{totalSets}</div>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }}
          />
        </div>
      </div>

      {isReordering ? (
        <div className="mx-4 mt-3 px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl text-xs text-primary font-semibold text-center">
          Drag to reorder · release to confirm
        </div>
      ) : activeExercises.length > 1 && (
        <p className="text-center text-xs text-muted-foreground/50 mt-3 select-none">
          Hold an exercise to reorder
        </p>
      )}

      {(() => {
        const orderedExercises = exerciseOrder.length
          ? exerciseOrder.map((id) => activeExercises.find((e) => e.id === id)).filter(Boolean)
          : activeExercises;

        return (
          <Reorder.Group
            axis="y"
            values={orderedExercises}
            onReorder={handleReorder}
            className="px-4 pt-4 flex flex-col gap-3 list-none"
            as="div"
          >
            {orderedExercises.map((ex) => {
              const isActive = isReordering || draggingId === ex.id;
              return (
                <ReorderableCard
                  key={ex.id}
                  ex={ex}
                  isActive={isActive}
                  onLongPressStart={(id) => setLongPressId(id)}
                  onLongPressEnd={() => setLongPressId(null)}
                  onDragStart={(id) => { setLongPressId(null); setDraggingId(id); setIsReordering(true); }}
                  onDragEnd={() => { setDraggingId(null); setIsReordering(false); }}
                >
                  <div
                    className={cn(
                      'bg-card border border-border rounded-2xl overflow-hidden',
                      longPressId === ex.id && draggingId !== ex.id &&
                        'border-primary/50 shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]'
                    )}
                  >
                    <ExerciseCard
                      ex={ex}
                      exSets={sets[ex.id] || []}
                      isCollapsed={isActive}
                      isOpen={!isActive && !!expanded[ex.id]}
                      prevSets={getPrevSets(ex.name)}
                      onToggle={() => !isActive && setExpanded((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
                      onUpdateSet={updateSet}
                      onCompleteSet={completeSet}
                      onUncompleteSet={uncompleteSet}
                      onAddSet={addSet}
                      onNotesChange={updateExerciseNotes}
                      onNoteImagesChange={updateExerciseNoteImages}
                      onRepRangeChange={updateRepRange}
                      onRepModeChange={updateRepMode}
                      onDeleteSet={deleteSet}
                      onSwapExercise={swapExercise}
                      onImageChange={updateExerciseImage}
                      sessionType={day?.session_type}
                      divider={false}
                      userId={user?.email}
                    />
                  </div>
                </ReorderableCard>
              );
            })}
          </Reorder.Group>
        );
      })()}

      {showImportDay && (
        <ImportWorkoutModal
          mode="day"
          onImportDay={handleImportDay}
          onClose={() => setShowImportDay(false)}
        />
      )}

      {showEditor && (
        <WorkoutExerciseEditor
          exercises={activeExercises}
          sessionType={day?.session_type || 'Custom'}
          onClose={() => setShowEditor(false)}
          onReorder={handleEditorReorder}
          onRemove={handleEditorRemove}
          onAdd={handleEditorAdd}
          onUpdateExercise={(exId, updates) => {
            const updated = activeExercises.map((e) => e.id === exId ? { ...e, ...updates } : e);
            setLocalExercises(updated);
            // If dropset_count changed, rebuild sets for this exercise preserving normal set count
            if ('dropset_count' in updates) {
              const ex = activeExercises.find((e) => e.id === exId);
              if (ex) {
                const newEx = { ...ex, ...updates };
                setSets((prev) => {
                  const current = prev[exId] || [];
                  const normalCount = current.filter((s) => s.set_type !== 'dropset').length || ex.target_sets || 3;
                  return { ...prev, [exId]: buildSetsForExerciseEarly(newEx, normalCount) };
                });
              }
            }
          }}
        />
      )}

      {/* Single rest timer — notification shown inside it */}
      {restTimer && (
        <RestTimer
          seconds={restTimer.seconds}
          total={restTimer.total}
          onDone={() => { setRestTimer(null); setNotification(null); }}
          onSkip={() => { setRestTimer(null); setNotification(null); }}
          isMinimized={timerMinimized}
          onToggleMinimize={() => setTimerMinimized(!timerMinimized)}
          gameState={persistedGameState}
          onGameStateChange={setPersistedGameState}
          notification={notification}
        />
      )}

      {showStreakCelebration && (
        <StreakCelebration
          newStreak={currentStreak}
          onDone={() => { setShowStreakCelebration(false); setShowSummary(true); }}
        />
      )}

      {showSummary && (
        <WorkoutSummaryScreen
          summaryRef={summaryRef}
          sets={sets}
          exercises={activeExercises}
          streak={currentStreak}
          durationMinutes={Math.round(elapsed / 60)}
          onSkip={() => {
            // Hard reload instead of React-Router navigate: the ActiveWorkout
            // page has heavy framer-motion Reorder + overlays, and
            // AnimatePresence's mode="wait" exit animation was getting stuck
            // on the transition home — leaving a blank screen at `/`.
            // A full navigation guarantees a clean Workouts page with fresh data.
            window.location.href = '/';
          }}
          weightSuggestions={activeExercises
            .map((ex) => getWeightSuggestion(ex.name, ex.target_reps, sets[ex.id] || []))
            .filter(Boolean)}
          onContinue={async () => {
            if (summaryRef.current) {
              try {
                const canvas = await html2canvas(summaryRef.current, { backgroundColor: null, scale: 2 });
                const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
                const file = new File([blob], 'workout-summary.png', { type: 'image/png' });
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                setSummaryImageUrl(file_url);
              } catch (e) {}
            }
            setShowSummary(false);
            setShowPostModal(true);
          }}
        />
      )}

      {showPostModal && workoutLog && (
        <PostWorkoutModal
          workoutLog={workoutLog}
          user={user}
          summaryImageUrl={summaryImageUrl}
          onClose={() => { window.location.href = '/'; }}
        />
      )}

      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-card border-t border-border rounded-t-3xl p-6 flex flex-col gap-4" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <div className="text-center">
              <p className="font-heading font-bold text-lg">Discard Workout?</p>
              <p className="text-sm text-muted-foreground mt-1">All progress will be lost and cannot be recovered.</p>
            </div>
            <Button
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-heading font-bold py-5"
              onClick={() => {
                if (workoutLog) base44.entities.WorkoutLog.delete(workoutLog.id).catch(() => {});
                window.location.href = '/';
              }}
            >
              Discard Workout
            </Button>
            <Button
              variant="outline"
              className="w-full font-heading font-bold py-5"
              onClick={() => setShowDiscardConfirm(false)}
            >
              Keep Going
            </Button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 flex gap-2 px-4 pt-3 bg-background/90 backdrop-blur-md border-t border-border" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <Button
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10 font-heading font-bold py-5 px-4 touch-target-44 shrink-0"
          onClick={() => setShowDiscardConfirm(true)}
        >
          Discard
        </Button>
        <Button
          className={cn(
            'flex-1 gap-2 font-heading font-bold text-base py-5 transition-all touch-target-44',
            allDone
              ? 'bg-primary text-primary-foreground shadow-[0_0_20px_hsl(35_96%_58%/0.5)]'
              : 'bg-secondary text-secondary-foreground'
          )}
          onClick={() => finishMutation.mutate()}
          disabled={finishMutation.isPending}
        >
          <Flag size={18} />
          {allDone ? 'Finish Workout!' : `Finish (${totalSets - completedSets} sets left)`}
        </Button>
      </div>
    </div>
  );
}