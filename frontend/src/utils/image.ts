import type { DocumentPhoto } from '../types/profile';

/**
 * Helper kompresi gambar client-side (maksimum dimensi 1200px, kualitas ~0.82 JPEG, ~150-250KB).
 */
export function compressImage(file: File): Promise<DocumentPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            name: file.name,
            type: file.type || 'image/jpeg',
            data: e.target?.result as string,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve({
          name: file.name,
          type: 'image/jpeg',
          data: dataUrl,
          size: Math.round((dataUrl.length * 3) / 4),
          uploadedAt: new Date().toISOString(),
        });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
