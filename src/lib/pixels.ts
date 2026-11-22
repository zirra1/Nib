/**
 * Pixel engine: pure functions over an RGBA bitmap. No DOM, so everything here is unit-tested.
 * A cursor is small (32–128 px), so whole-bitmap copies for history are cheap (≤ 64 KB).
 */

export type RGBA = readonly [number, number, number, number];
export interface Bitmap {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8ClampedArray;
}

export const TRANSPARENT: RGBA = [0, 0, 0, 0];

export function createBitmap(w: number, h = w): Bitmap {
  return { w, h, data: new Uint8ClampedArray(w * h * 4) };
}

export function cloneBitmap(b: Bitmap): Bitmap {
  return { w: b.w, h: b.h, data: new Uint8ClampedArray(b.data) };
}

export function sameBitmap(a: Bitmap, b: Bitmap): boolean {
  if (a.w !== b.w || a.h !== b.h) return false;
  for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) return false;
  return true;
}

export function getPixel(b: Bitmap, x: number, y: number): RGBA {
  if (x < 0 || y < 0 || x >= b.w || y >= b.h) return TRANSPARENT;
  const i = (y * b.w + x) * 4;
  return [b.data[i], b.data[i + 1], b.data[i + 2], b.data[i + 3]];
}

/** Writes a pixel (replace, not blend: a pixel editor paints exactly the chosen colour). */
export function setPixel(b: Bitmap, x: number, y: number, c: RGBA): void {
  if (x < 0 || y < 0 || x >= b.w || y >= b.h) return;
  const i = (y * b.w + x) * 4;
  b.data[i] = c[0];
  b.data[i + 1] = c[1];
  b.data[i + 2] = c[2];
  b.data[i + 3] = c[3];
}

/** Square brush of `size` px centred on (x, y) (even sizes extend right/down). */
export function stamp(b: Bitmap, x: number, y: number, c: RGBA, size = 1): void {
  const o = Math.floor((size - 1) / 2);
  for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) setPixel(b, x - o + dx, y - o + dy, c);
}

/** Every integer point on the segment (Bresenham), endpoints included. */
export function linePoints(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const pts: [number, number][] = [];
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  for (;;) {
    pts.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
  return pts;
}

export function drawLine(b: Bitmap, x0: number, y0: number, x1: number, y1: number, c: RGBA, size = 1): void {
  for (const [x, y] of linePoints(x0, y0, x1, y1)) stamp(b, x, y, c, size);
}

export function drawRect(b: Bitmap, x0: number, y0: number, x1: number, y1: number, c: RGBA, fill: boolean, size = 1): void {
  const [l, r] = x0 < x1 ? [x0, x1] : [x1, x0];
  const [t, bo] = y0 < y1 ? [y0, y1] : [y1, y0];
  if (fill) {
    for (let y = t; y <= bo; y++) for (let x = l; x <= r; x++) setPixel(b, x, y, c);
    return;
  }
  drawLine(b, l, t, r, t, c, size);
  drawLine(b, r, t, r, bo, c, size);
  drawLine(b, r, bo, l, bo, c, size);
  drawLine(b, l, bo, l, t, c, size);
}

/** Ellipse inscribed in the drag box. Outline is traced along the boundary so it has no gaps. */
export function drawEllipse(b: Bitmap, x0: number, y0: number, x1: number, y1: number, c: RGBA, fill: boolean, size = 1): void {
  const [l, r] = x0 < x1 ? [x0, x1] : [x1, x0];
  const [t, bo] = y0 < y1 ? [y0, y1] : [y1, y0];
  const cx = (l + r) / 2, cy = (t + bo) / 2;
  const rx = (r - l) / 2 + 0.5, ry = (bo - t) / 2 + 0.5;
  const inside = (x: number, y: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  for (let y = t; y <= bo; y++) {
    for (let x = l; x <= r; x++) {
      if (!inside(x, y)) continue;
      // Boundary pixel: inside, with a 4-neighbour outside.
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      if (fill || edge) stamp(b, x, y, c, fill ? 1 : size);
    }
  }
}

const same = (a: RGBA, b: RGBA) => (a[3] === 0 && b[3] === 0) || (a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]);

/** 4-connected flood fill of the region that has exactly the colour at (x, y). Returns pixels changed. */
export function floodFill(b: Bitmap, x: number, y: number, c: RGBA): number {
  if (x < 0 || y < 0 || x >= b.w || y >= b.h) return 0;
  const target = getPixel(b, x, y);
  if (same(target, c)) return 0;
  const seen = new Uint8Array(b.w * b.h);
  const stack = [y * b.w + x];
  let n = 0;
  while (stack.length) {
    const p = stack.pop()!;
    if (seen[p]) continue;
    seen[p] = 1;
    const px = p % b.w, py = (p - px) / b.w;
    if (!same(getPixel(b, px, py), target)) continue;
    setPixel(b, px, py, c);
    n++;
    if (px > 0) stack.push(p - 1);
    if (px < b.w - 1) stack.push(p + 1);
    if (py > 0) stack.push(p - b.w);
    if (py < b.h - 1) stack.push(p + b.w);
  }
  return n;
}

/** Shifts the whole drawing; pixels pushed off the edge are dropped. */
export function shift(b: Bitmap, dx: number, dy: number): Bitmap {
  const out = createBitmap(b.w, b.h);
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) setPixel(out, x + dx, y + dy, getPixel(b, x, y));
  return out;
}

export function flipH(b: Bitmap): Bitmap {
  const out = createBitmap(b.w, b.h);
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) setPixel(out, b.w - 1 - x, y, getPixel(b, x, y));
  return out;
}

/** Bounding box of non-transparent pixels, or null if empty. */
export function contentBounds(b: Bitmap, alphaMin = 1): { x: number; y: number; w: number; h: number } | null {
  let l = b.w, t = b.h, r = -1, bo = -1;
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (b.data[(y * b.w + x) * 4 + 3] >= alphaMin) {
      if (x < l) l = x;
      if (x > r) r = x;
      if (y < t) t = y;
      if (y > bo) bo = y;
    }
  }
  return r < 0 ? null : { x: l, y: t, w: r - l + 1, h: bo - t + 1 };
}

export function isEmpty(b: Bitmap): boolean {
  for (let i = 3; i < b.data.length; i += 4) if (b.data[i] !== 0) return false;
  return true;
}

/**
 * Removes a plain background: flood-erases from the four edges every pixel within `tolerance`
 * of the colour found at the corners. Works for photos/logos on a flat background, not busy scenes.
 * Returns false (and leaves the bitmap alone) if the corners don't agree on one colour.
 */
export function removePlainBackground(b: Bitmap, tolerance = 40): boolean {
  const corners = [getPixel(b, 0, 0), getPixel(b, b.w - 1, 0), getPixel(b, 0, b.h - 1), getPixel(b, b.w - 1, b.h - 1)];
  const dist = (p: RGBA, q: RGBA) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]);
  const bg = corners[0];
  if (bg[3] === 0) return false; // already transparent
  if (corners.some((c) => c[3] < 250 || dist(c, bg) > tolerance)) return false;
  const seen = new Uint8Array(b.w * b.h);
  const stack: number[] = [];
  for (let x = 0; x < b.w; x++) stack.push(x, (b.h - 1) * b.w + x);
  for (let y = 0; y < b.h; y++) stack.push(y * b.w, y * b.w + b.w - 1);
  while (stack.length) {
    const p = stack.pop()!;
    if (seen[p]) continue;
    seen[p] = 1;
    const x = p % b.w, y = (p - x) / b.w;
    const c = getPixel(b, x, y);
    if (c[3] === 0 || dist(c, bg) > tolerance) continue;
    setPixel(b, x, y, TRANSPARENT);
    if (x > 0) stack.push(p - 1);
    if (x < b.w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - b.w);
    if (y < b.h - 1) stack.push(p + b.w);
  }
  return true;
}

// ---------------------------------------------------------------- colour helpers
export function hexToRgba(hex: string, alpha = 255): RGBA {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  const a = full.length === 8 ? parseInt(full.slice(6, 8), 16) : alpha;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

export function rgbaToHex(c: RGBA): string {
  return '#' + [c[0], c[1], c[2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function isValidHex(s: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim());
}

/** First painted pixel scanning top-to-bottom, left-to-right: the natural "tip" of a pointer. */
export function tipPixel(b: Bitmap, alphaMin = 128): { x: number; y: number } | null {
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) if (b.data[(y * b.w + x) * 4 + 3] >= alphaMin) return { x, y };
  return null;
}
