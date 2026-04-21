import { base44 } from '@/api/base44Client';

const MAX_PX = 1024;   // longest edge in pixels
const QUALITY = 0.8;   // JPEG quality (0–1)
const TIMEOUT_MS = 20000; // 20 seconds before we give up

/**
 * Compress an image File to ≤MAX_PX on the longest edge at QUALITY,
 * then upload it. Rejects after TIMEOUT_MS if the upload hangs.
 *
 * @param {File} file - The raw image file from an <input type="file">
 * @returns {Promise<string>} Resolves to the uploaded file URL
 */
export async function uploadImage(file) {
  const compressed = await compressImage(file);

  const uploadPromise = base44.integrations.Core.UploadFile({ file: compressed })
    .then(({ file_url }) => file_url);

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Upload timed out. Check your connection and try again.')), TIMEOUT_MS)
  );

  return Promise.race([uploadPromise, timeoutPromise]);
}

/**
 * Resize + compress a File using an offscreen Canvas.
 * Returns the original file unchanged if it's not an image or is already small.
 */
async function compressImage(file) {
  // Only compress actual images
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { width, height } = img;
      const longest = Math.max(width, height);

      // Already small enough — skip compression
      if (longest <= MAX_PX) {
        resolve(file);
        return;
      }

      const scale = MAX_PX / longest;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fall back to original on error
    };

    img.src = objectUrl;
  });
}
