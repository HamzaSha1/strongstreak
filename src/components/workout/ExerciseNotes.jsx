import { useState } from 'react';
import { Camera, ImageIcon, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/lib/uploadImage';

export default function ExerciseNotes({ ex, onNotesChange, onNoteImagesChange }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showPhotoSection, setShowPhotoSection] = useState(false);
  const [viewingIdx, setViewingIdx] = useState(null);
  const [replacing, setReplacing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const noteImages = (() => {
    try { return JSON.parse(ex.note_images || '[]'); } catch { return []; }
  })();

  const hasNote = !!ex.notes;
  const hasPhotos = noteImages.length > 0;

  const handleUpload = async (file, replaceIdx = null) => {
    if (!file) return;
    setUploading(true);
    setReplacing(false);
    setShowAddOptions(false);
    try {
      const file_url = await uploadImage(file);
      const updated = replaceIdx !== null
        ? noteImages.map((url, i) => i === replaceIdx ? file_url : url)
        : [...noteImages, file_url];
      onNoteImagesChange(ex.id, updated);
      if (replaceIdx !== null) setViewingIdx(replaceIdx);
    } catch (err) {
      toast.error(err?.message || 'Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (idx) => {
    onNoteImagesChange(ex.id, noteImages.filter((_, i) => i !== idx));
    setViewingIdx(null);
  };

  // Collapsed — show a subtle trigger only if no existing content
  if (!expanded && !hasNote && !hasPhotos) {
    return (
      <div className="mb-3">
        <button
          onClick={() => { setExpanded(true); setEditing(true); }}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <Pencil size={11} />
          <span>Add note</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-3 flex flex-col gap-2">
      {/* Text note */}
      {editing ? (
        <textarea
          autoFocus
          value={ex.notes || ''}
          onChange={(e) => onNotesChange(ex.id, e.target.value)}
          onBlur={() => { setEditing(false); if (!ex.notes) { setExpanded(false); setShowPhotoSection(false); } }}
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

      {/* Photo section */}
      {noteImages.length === 0 && !showPhotoSection ? (
        <button
          onClick={() => setShowPhotoSection(true)}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <Camera size={11} />
          <span>Add photo</span>
        </button>
      ) : (
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
      )}

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