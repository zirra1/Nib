/** Turning a bitmap into something the browser can use as a cursor. */
import type { Bitmap } from './pixels';

export const SIZES = [32, 48, 64, 128] as const;
export type CursorSize = (typeof SIZES)[number];

export interface Hotspot { x: number; y: number }

export function bitmapToCanvas(b: Bitmap): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = b.w;
  c.height = b.h;
  c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(b.data), b.w, b.h), 0, 0);
  return c;
}

export const bitmapToPng = (b: Bitmap) => bitmapToCanvas(b).toDataURL('image/png');

/**
 * CSS `cursor` value. Browsers cap custom cursors at 128×128; the fallback keyword keeps a usable
 * pointer if the image is refused (e.g. some browsers hide large cursors near the window edge).
 */
export function cursorCss(png: string, hs: Hotspot, fallback = 'auto'): string {
  return `url("${png}") ${Math.round(hs.x)} ${Math.round(hs.y)}, ${fallback}`;
}

export async function pngToBitmap(png: string): Promise<Bitmap> {
  const img = new Image();
  img.src = png;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height);
  return { w: c.width, h: c.height, data: d.data };
}

/** Rescales a drawing to a new cursor size. Whole-number enlargements stay pixel-sharp. */
export function resizeBitmap(b: Bitmap, size: number): Bitmap {
  if (b.w === size) return b;
  const src = bitmapToCanvas(b);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = !(size > b.w && size % b.w === 0);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, size, size);
  return { w: size, h: size, data: ctx.getImageData(0, 0, size, size).data };
}
