import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Trash2, Save, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function EditPostModal({ post, onClose, onUpdated, onDeleted }) {
  const [caption, setCaption] = useState(post.caption || '');
  const [visibility, setVisibility] = useState(post.visibility || 'public');
  const [imageUrl, setImageUrl] = useState(post.image_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Post.update(post.id, { caption, visibility, image_url: imageUrl });
    toast.success('Post updated');
    onUpdated({ ...post, caption, visibility, image_url: imageUrl });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.Post.delete(post.id);
    toast.success('Post deleted');
    onDeleted(post.id);
    setDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground"><X size={20} /></button>
        <h2 className="font-heading font-bold text-lg flex-1">Edit Post</h2>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Image preview + replace */}
        <div className="relative w-full aspect-square bg-muted rounded-2xl overflow-hidden">
          {imageUrl
            ? <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">📷</div>
          }
          <label className="absolute bottom-3 right-3 bg-black/60 text-white rounded-full p-2 cursor-pointer hover:bg-black/80 transition-colors">
            {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={16} />}
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
          </label>
        </div>

        {/* Caption */}
        <div>
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1 block">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            rows={3}
            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2 block">Visibility</label>
          <div className="flex gap-2">
            {['public', 'private'].map((v) => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors capitalize ${
                  visibility === v
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving || uploading} className="w-full gap-2">
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/60 flex items-end z-10">
          <div className="w-full bg-card rounded-t-3xl p-6 border-t border-border">
            <h3 className="font-heading font-bold text-lg mb-1">Delete Post?</h3>
            <p className="text-sm text-muted-foreground mb-4">This cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</Button>
              <Button className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}