/**
 * Helper to process and auto-crop user uploaded images into a 1:1 ratio
 * Any image dimension/orientation is automatically center-cropped to 1:1
 * and can be masked into a perfect 1:1 circle with alpha transparency.
 */
export function processUploadedImage(
  file: File, 
  targetSize = 400,
  asCircle = true
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WebP, GIF, HEIC)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // If circular format is requested, clip canvas to 1:1 circle
        if (asCircle) {
          ctx.beginPath();
          ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
        }

        // Calculate center square crop (1:1 aspect ratio) from whatever size/aspect ratio the user uploaded
        const sourceSize = Math.min(img.width, img.height);
        const sourceX = (img.width - sourceSize) / 2;
        const sourceY = (img.height - sourceSize) / 2;

        // Draw center-cropped square into targetSize x targetSize
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          targetSize,
          targetSize
        );

        // Circular images require PNG for transparent corners outside the circle
        const format = asCircle ? 'image/png' : (file.type === 'image/png' ? 'image/png' : 'image/jpeg');
        const compressedDataUrl = canvas.toDataURL(format, 0.92);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('ไม่สามารถประมวลผลไฟล์รูปภาพได้'));
      };

      img.src = result;
    };

    reader.onerror = () => {
      reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    };

    reader.readAsDataURL(file);
  });
}
