/**
 * Uploading an image: validate it, decode it locally, optionally remove a plain background,
 * crop to the visible content and fit it into the cursor square. Nothing leaves the device.
 */
import { contentBounds, removePlainBackground, type Bitmap } from './pixels';

export const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
export const MAX_BYTES = 10 * 1024 * 1024;

export class ImportError extends Error {}

export function checkFile(f: { type: string; size: number }): void {
  if (!ACCEPTED.includes(f.type)) throw new ImportError('That file type isn’t supported. Use PNG, JPG, WebP, GIF or SVG.');
  if (f.size > MAX_BYTES) throw new ImportError('That image is over 10 MB. Try a smaller one.');
  if (f.size === 0) throw new ImportError('That file is empty.');
}

export interface ImportResult { bitmap: Bitmap; backgroundRemoved: boolean }

export async function importImage(file: File, size: number, removeBg = true): Promise<ImportResult> {
  checkFile(file);
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    try { await img.decode(); } catch { throw new ImportError('That image couldn’t be opened. It may be damaged.'); }
    // 1. Draw at a working resolution (keeps detail for background removal and cropping).
    const work = 256;
    const k = Math.min(1, work / Math.max(img.naturalWidth || work, img.naturalHeight || work));
    const w = Math.max(1, Math.round((img.naturalWidth || work) * k)), h = Math.max(1, Math.round((img.naturalHeight || work) * k));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    const full: Bitmap = { w, h, data: ctx.getImageData(0, 0, w, h).data };
    // 2. Plain background → transparent (only if the corners agree on one colour).
    const backgroundRemoved = removeBg ? removePlainBackground(full) : false;
    if (backgroundRemoved) ctx.putImageData(new ImageData(new Uint8ClampedArray(full.data), w, h), 0, 0);
    // 3. Auto-crop to visible pixels, then fit (contain) into the cursor square with a 1 px margin.
    const bb = contentBounds(full, 8);
    if (!bb) throw new ImportError('That image is completely transparent.');
    const out = document.createElement('canvas');
    out.width = out.height = size;
    const o = out.getContext('2d')!;
    o.imageSmoothingQuality = 'high';
    const room = size - 2, s = room / Math.max(bb.w, bb.h);
    const dw = bb.w * s, dh = bb.h * s;
    o.drawImage(c, bb.x, bb.y, bb.w, bb.h, (size - dw) / 2, (size - dh) / 2, dw, dh);
    return { bitmap: { w: size, h: size, data: o.getImageData(0, 0, size, size).data }, backgroundRemoved };
  } finally {
    URL.revokeObjectURL(url);
  }
}
