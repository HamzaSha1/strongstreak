import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, X, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function PostWorkoutModal({ workoutLog, user, onClose, summaryImageUrl }) {
  const [image, setImage] = useState(summaryImageUrl || null);
  const [imageUrl, setImageUrl] = useState(summaryImageUrl || '');
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [uploading, setUploading] = useState(false);
  const [moderating, setModerating] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    setImage(URL.createObjectURL(file));
    setUploading(false);
  };

  const handlePost = async () => {
    setModerating(true);
    // AI moderation check on caption and/or image
    const res = await base44.functions.invoke('moderateContent', {
      text: caption || '',
      image_url: imageUrl || null,
    });
    setModerating(false);
    if (res.data?.safe === false) {
      toast.error(`Post blocked: ${res.data.reason || 'Content violates community guidelines.'}`);
      return;
    }

    await base44.entities.Post.create({
      user_id: user.email,
      workout_log_id: workoutLog.id,
      image_url: imageUrl,
      caption,
      visibility,
      likes_count: 0,
    });
    toast.success('Post shared!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm">
      <div className="w-full max-w-[512px] bg-card border-t border-border rounded-t-3xl p-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg">Share Workout 🔥</h3>
          <button onClick={onClose}><X size={20} className="text-muted-foreground" /></button>
        </div>

        {/* Photo upload */}
        <button
          onClick={() => fileRef.current.click()}
          className="w-full aspect-video rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 mb-4 overflow-hidden relative"
        >
          {image ? (
            <img src={image} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <Camera size={28} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploading ? 'Uploading...' : 'Add a photo'}
              </span>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        <Textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="bg-input border-border mb-3 resize-none text-sm"
          rows={2}
        />

        {/* Visibility */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setVisibility('public')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm transition-colors ${
              visibility === 'public' ? 'bg-primary/20 border-primary/50 text-primary' : 'border-border text-muted-foreground'
            }`}
          >
            <Globe size={14} /> Public
          </button>
          <button
            onClick={() => setVisibility('private')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm transition-colors ${
              visibility === 'private' ? 'bg-primary/20 border-primary/50 text-primary' : 'border-border text-muted-foreground'
            }`}
          >
            <Lock size={14} /> Just Me
          </button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 border-border" onClick={onClose}>
            Skip
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground"
            onClick={handlePost}
            disabled={uploading || moderating}
          >
            {moderating ? 'Checking...' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  );
}