/**
 * Starter templates. All are original artwork made for Nib.
 * Vector templates are drawn on a 32-unit grid and rasterised at the chosen size (crisp at any size);
 * pixel templates are hand-placed pixels, scaled with nearest-neighbour so they stay sharp.
 */
import { createBitmap, hexToRgba, setPixel, type Bitmap } from './pixels';

export type Category = 'Arrows' | 'Hands' | 'Shapes' | 'Tools' | 'Characters';
export const CATEGORIES: Category[] = ['Arrows', 'Hands', 'Shapes', 'Tools', 'Characters'];

interface Layer { d: string; fill?: string; stroke?: string; width?: number }
/** Vector: hotspot on the 32-unit grid. Pixel: hotspot as [column, row] inside the artwork. */
interface Base { id: string; name: string; category: Category; hotspot: [number, number] }
export interface VectorTemplate extends Base { kind: 'vector'; layers: Layer[] }
/** `cell`: art pixels per cursor pixel at 32 px (2 = chunky characters). `offset` is on the 32 grid. */
export interface PixelTemplate extends Base { kind: 'pixel'; rows: string[]; palette: Record<string, string>; offset: [number, number]; cell?: number }
export type Template = VectorTemplate | PixelTemplate;

const INK = '#151515', WHITE = '#FFFFFF';

export const TEMPLATES: Template[] = [
  { id: 'classic', name: 'Classic', category: 'Arrows', kind: 'vector', hotspot: [3, 2],
    layers: [{ d: 'M3 2 L3 25.5 L8.8 20 L13 29.2 L17 27.4 L12.9 18.6 L20.6 18.6 Z', fill: INK, stroke: WHITE, width: 1.6 }] },
  { id: 'inverse', name: 'Inverse', category: 'Arrows', kind: 'vector', hotspot: [3, 2],
    layers: [{ d: 'M3 2 L3 25.5 L8.8 20 L13 29.2 L17 27.4 L12.9 18.6 L20.6 18.6 Z', fill: WHITE, stroke: INK, width: 1.6 }] },
  { id: 'dart', name: 'Dart', category: 'Arrows', kind: 'vector', hotspot: [3, 3],
    layers: [{ d: 'M3 3 L27 12.2 L16.4 15.6 L12.6 26.6 Z', fill: INK, stroke: WHITE, width: 1.6 }] },
  { id: 'paper-plane', name: 'Paper plane', category: 'Arrows', kind: 'vector', hotspot: [3, 3],
    layers: [
      { d: 'M3 3 L28 14 L15 17 L12 28 Z', fill: WHITE, stroke: INK, width: 1.6 },
      { d: 'M3 3 L15 17', stroke: INK, width: 1.4 },
    ] },
  { id: 'pixel-arrow', name: 'Pixel arrow', category: 'Arrows', kind: 'pixel', hotspot: [0, 0], offset: [2, 2],
    palette: { k: INK, w: WHITE },
    rows: [
      'k...........', 'kk..........', 'kwk.........', 'kwwk........', 'kwwwk.......', 'kwwwwk......',
      'kwwwwwk.....', 'kwwwwwwk....', 'kwwwwwwwk...', 'kwwwwwwwwk..', 'kwwwwwwwwwk.', 'kwwwwwwkkkkk',
      'kwwwkwwk....', 'kwwk.kwwk...', 'kwk..kwwk...', 'kk....kwwk..', 'k.....kwwk..', '.......kwwk.', '.......kkk..',
    ] },
  { id: 'pixel-hand', name: 'Pointing hand', category: 'Hands', kind: 'pixel', hotspot: [5, 0], offset: [7, 4],
    palette: { k: INK, w: WHITE },
    rows: [
      '.....kk..........', '....kwwk.........', '....kwwk.........', '....kwwk.........', '....kwwk.........',
      '....kwwkkk.......', '....kwwkwwkkk....', '....kwwkwwkwwkk..', '.kk.kwwkwwkwwkwk.', 'kwwkkwwwwwwwwkwwk',
      'kwwwkwwwwwwwwwwwk', '.kwwwwwwwwwwwwwwk', '..kwwwwwwwwwwwwwk', '..kwwwwwwwwwwwwk.', '...kwwwwwwwwwwwk.',
      '...kwwwwwwwwwwk..', '....kwwwwwwwwwk..', '....kwwwwwwwwk...', '.....kkkkkkkkk...',
    ] },
  { id: 'dot', name: 'Dot', category: 'Shapes', kind: 'vector', hotspot: [16, 16],
    layers: [{ d: 'M16 9.5 A6.5 6.5 0 1 1 15.99 9.5 Z', fill: INK, stroke: WHITE, width: 2 }] },
  { id: 'ring', name: 'Ring', category: 'Shapes', kind: 'vector', hotspot: [16, 16],
    layers: [
      { d: 'M16 5 A11 11 0 1 1 15.99 5 Z', stroke: WHITE, width: 4.4 },
      { d: 'M16 5 A11 11 0 1 1 15.99 5 Z', stroke: INK, width: 2 },
      { d: 'M16 14.5 A1.5 1.5 0 1 1 15.99 14.5 Z', fill: INK },
    ] },
  { id: 'crosshair', name: 'Crosshair', category: 'Shapes', kind: 'vector', hotspot: [16, 16],
    layers: [
      { d: 'M16 3 V12 M16 20 V29 M3 16 H12 M20 16 H29', stroke: WHITE, width: 4.2 },
      { d: 'M16 3 V12 M16 20 V29 M3 16 H12 M20 16 H29', stroke: INK, width: 2 },
    ] },
  { id: 'star', name: 'Star', category: 'Shapes', kind: 'vector', hotspot: [16, 16],
    layers: [{ d: 'M16 3 L19.6 11.6 L28.8 12.3 L21.8 18.3 L24 27.3 L16 22.4 L8 27.3 L10.2 18.3 L3.2 12.3 L12.4 11.6 Z', fill: '#FFC21A', stroke: INK, width: 1.8 }] },
  { id: 'heart', name: 'Heart', category: 'Shapes', kind: 'vector', hotspot: [16, 16],
    layers: [{ d: 'M16 27 C6 20 3 15 3 10.5 C3 6.6 6 4 9.4 4 C12.2 4 14.6 5.6 16 8.2 C17.4 5.6 19.8 4 22.6 4 C26 4 29 6.6 29 10.5 C29 15 26 20 16 27 Z', fill: '#F2385A', stroke: INK, width: 1.8 }] },
  { id: 'bolt', name: 'Bolt', category: 'Shapes', kind: 'vector', hotspot: [13, 3],
    layers: [{ d: 'M13 3 L23 3 L18 13 L25 13 L10 29 L14 17 L8 17 Z', fill: '#FFD60A', stroke: INK, width: 1.8 }] },
  { id: 'pencil', name: 'Pencil', category: 'Tools', kind: 'vector', hotspot: [3, 29],
    layers: [
      { d: 'M3 29 L5 21 L22 4 L28 10 L11 27 Z', fill: '#FFB020', stroke: INK, width: 1.7 },
      { d: 'M3 29 L5 21 L11 27 Z', fill: '#F3D9B1', stroke: INK, width: 1.4 },
      { d: 'M3 29 L4 25 L7 28 Z', fill: INK },
      { d: 'M19 7 L25 13', stroke: INK, width: 1.4 },
    ] },
  { id: 'ibeam', name: 'Text beam', category: 'Tools', kind: 'vector', hotspot: [16, 16],
    layers: [
      { d: 'M11 4 C14 4 16 5 16 7 C16 5 18 4 21 4 M16 7 V25 M11 28 C14 28 16 27 16 25 C16 27 18 28 21 28 M12.5 16 H19.5', stroke: WHITE, width: 4 },
      { d: 'M11 4 C14 4 16 5 16 7 C16 5 18 4 21 4 M16 7 V25 M11 28 C14 28 16 27 16 25 C16 27 18 28 21 28 M12.5 16 H19.5', stroke: INK, width: 1.8 },
    ] },
  { id: 'ghost', name: 'Ghost', category: 'Characters', kind: 'pixel', hotspot: [6, 0], offset: [2, 3], cell: 2,
    palette: { k: INK, w: WHITE, e: INK },
    rows: [
      '....kkkkkk....', '..kkwwwwwwkk..', '.kwwwwwwwwwwk.', '.kwwwwwwwwwwk.', 'kwwweewwweewwk', 'kwwweewwweewwk',
      'kwwwwwwwwwwwwk', 'kwwwwwwwwwwwwk', 'kwwwwwwwwwwwwk', 'kwwwwwwwwwwwwk', 'kwwwwwwwwwwwwk', 'kwkwwkwwkwwkwk', 'kk.kk.kk.kk.kk',
    ] },
  { id: 'robot', name: 'Robot', category: 'Characters', kind: 'pixel', hotspot: [7, 0], offset: [0, 2], cell: 2,
    palette: { k: INK, g: '#9AA3AD', o: '#2BD9C4', w: '#E9EDF0' },
    rows: [
      '.......kk.......', '.......kk.......', '...kkkkkkkkkk...', '..kwwwwwwwwwwk..', '..kwkkkwwkkkwk..', '..kwkookkookwk..',
      '..kwkkkwwkkkwk..', '..kwwwwwwwwwwk..', '..kwwkkkkkkwwk..', '..kwwwwwwwwwwk..', '...kkkkkkkkkk...', '....kggggggk....',
      '...kgkggggkgk...', '...kkkkkkkkkk...',
    ] },
];

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);

/** Hotspot of a template at a given cursor size. */
export function templateHotspot(t: Template, size: number): { x: number; y: number } {
  const k = size / 32;
  const [hx, hy] = t.hotspot;
  if (t.kind === 'pixel') {
    const s = pixelScale(size) * (t.cell ?? 1);
    const off = pixelOffset(t, size);
    return { x: Math.min(size - 1, off[0] + hx * s), y: Math.min(size - 1, off[1] + hy * s) };
  }
  return { x: Math.min(size - 1, Math.round(hx * k)), y: Math.min(size - 1, Math.round(hy * k)) };
}

const pixelScale = (size: number) => Math.max(1, Math.floor(size / 32));
function pixelOffset(t: PixelTemplate, size: number): [number, number] {
  // Keep the art's position relative to the 32-grid, scaled by the integer factor; centre any leftover.
  const s = pixelScale(size), extra = Math.floor((size - 32 * s) / 2);
  return [t.offset[0] * s + extra, t.offset[1] * s + extra];
}

/** Pixel templates rasterise without the DOM (also used in tests). */
export function rasterPixelTemplate(t: PixelTemplate, size: number): Bitmap {
  const b = createBitmap(size);
  const s = pixelScale(size) * (t.cell ?? 1), [ox, oy] = pixelOffset(t, size);
  t.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const hex = t.palette[ch];
    if (!hex) return;
    const c = hexToRgba(hex);
    for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) setPixel(b, ox + x * s + dx, oy + y * s + dy, c);
  }));
  return b;
}

/** Renders a template into a bitmap (vector templates need a canvas, i.e. the browser). */
export function rasterTemplate(t: Template, size: number): Bitmap {
  if (t.kind === 'pixel') return rasterPixelTemplate(t, size);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(size / 32, size / 32);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const l of t.layers) {
    const p = new Path2D(l.d);
    // Outlines are drawn first and doubled so the fill sits on top of a clean outer border.
    if (l.stroke && l.fill) { ctx.strokeStyle = l.stroke; ctx.lineWidth = (l.width ?? 1.5) * 2; ctx.stroke(p); }
    else if (l.stroke) { ctx.strokeStyle = l.stroke; ctx.lineWidth = l.width ?? 1.5; ctx.stroke(p); }
    if (l.fill) { ctx.fillStyle = l.fill; ctx.fill(p); }
  }
  const img = ctx.getImageData(0, 0, size, size);
  return snapToPalette({ w: size, h: size, data: img.data }, t.layers.flatMap((l) => [l.fill, l.stroke]).filter((c): c is string => !!c));
}

/**
 * Makes an anti-aliased render pixel-crisp: each pixel becomes fully opaque or fully clear, in the
 * nearest of the template's own colours. Clean edges matter in a pixel editor (fill leaves no halos).
 */
export function snapToPalette(b: Bitmap, colors: string[]): Bitmap {
  const pal = [...new Set(colors)].map((c) => hexToRgba(c));
  const d = b.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a < 110) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; continue; }
    // Canvas data is un-premultiplied; compare against palette colours.
    let best = pal[0], bd = Infinity;
    for (const p of pal) {
      const dist = (d[i] - p[0]) ** 2 + (d[i + 1] - p[1]) ** 2 + (d[i + 2] - p[2]) ** 2;
      if (dist < bd) { bd = dist; best = p; }
    }
    d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2]; d[i + 3] = 255;
  }
  return b;
}
