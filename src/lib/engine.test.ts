import { describe, expect, it } from 'vitest';
import {
  createBitmap, drawEllipse, drawLine, drawRect, floodFill, getPixel, hexToRgba, isEmpty, isValidHex,
  linePoints, removePlainBackground, rgbaToHex, setPixel, shift, contentBounds, flipH, sameBitmap, cloneBitmap, type RGBA,
} from './pixels';
import { commit, initHistory, redo, undo, LIMIT } from './history';
import { TEMPLATES, rasterPixelTemplate, templateHotspot } from './templates';
import { listDesigns, saveDesign, deleteDesign, getDesign, type KV, type SavedDesign } from './storage';
import { checkFile, ImportError } from './importImage';

const RED: RGBA = [255, 0, 0, 255];
const BLUE: RGBA = [0, 0, 255, 255];
const count = (b: ReturnType<typeof createBitmap>, c: RGBA) => {
  let n = 0;
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) if (getPixel(b, x, y).every((v, i) => v === c[i])) n++;
  return n;
};

describe('pixels', () => {
  it('lines are gap-free and include both endpoints', () => {
    const pts = linePoints(0, 0, 7, 3);
    expect(pts[0]).toEqual([0, 0]);
    expect(pts.at(-1)).toEqual([7, 3]);
    for (let i = 1; i < pts.length; i++) {
      expect(Math.abs(pts[i][0] - pts[i - 1][0])).toBeLessThanOrEqual(1);
      expect(Math.abs(pts[i][1] - pts[i - 1][1])).toBeLessThanOrEqual(1);
    }
  });
  it('brush size stamps a square', () => {
    const b = createBitmap(8);
    drawLine(b, 4, 4, 4, 4, RED, 3);
    expect(count(b, RED)).toBe(9);
  });
  it('rect outline and fill', () => {
    const b = createBitmap(10);
    drawRect(b, 1, 1, 4, 3, RED, false);
    expect(count(b, RED)).toBe(10); // 4×3 box perimeter
    drawRect(b, 6, 6, 8, 8, BLUE, true);
    expect(count(b, BLUE)).toBe(9);
  });
  it('ellipse outline is closed (fill inside stays inside)', () => {
    const b = createBitmap(20);
    drawEllipse(b, 2, 2, 17, 13, RED, false);
    floodFill(b, 10, 8, BLUE);
    expect(getPixel(b, 0, 0)).toEqual([0, 0, 0, 0]); // outside untouched → no leak
    expect(count(b, BLUE)).toBeGreaterThan(50);
  });
  it('flood fill respects boundaries and is a no-op on same colour', () => {
    const b = createBitmap(6);
    drawLine(b, 3, 0, 3, 5, RED);
    expect(floodFill(b, 0, 0, BLUE)).toBe(18);
    expect(getPixel(b, 5, 5)).toEqual([0, 0, 0, 0]);
    expect(floodFill(b, 0, 0, BLUE)).toBe(0);
  });
  it('shift, flip, bounds, empty', () => {
    const b = createBitmap(4);
    expect(isEmpty(b)).toBe(true);
    setPixel(b, 0, 0, RED);
    expect(getPixel(shift(b, 2, 1), 2, 1)).toEqual(RED);
    expect(getPixel(flipH(b), 3, 0)).toEqual(RED);
    expect(contentBounds(b)).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    expect(sameBitmap(b, cloneBitmap(b))).toBe(true);
  });
  it('removes a plain background but keeps the subject, including enclosed areas', () => {
    const b = createBitmap(10);
    for (let i = 0; i < 100; i++) setPixel(b, i % 10, Math.floor(i / 10), [250, 250, 250, 255]);
    drawRect(b, 3, 3, 6, 6, RED, false); // red ring with a white hole inside
    expect(removePlainBackground(b)).toBe(true);
    expect(getPixel(b, 0, 0)[3]).toBe(0);
    expect(getPixel(b, 3, 3)).toEqual(RED);
    expect(getPixel(b, 4, 4)[3]).toBe(255); // enclosed white survives (not connected to the edge)
  });
  it('refuses background removal when corners disagree', () => {
    const b = createBitmap(4);
    for (let i = 0; i < 16; i++) setPixel(b, i % 4, Math.floor(i / 4), [255, 255, 255, 255]);
    setPixel(b, 3, 3, [0, 0, 0, 255]);
    expect(removePlainBackground(b)).toBe(false);
  });
  it('colour helpers', () => {
    expect(hexToRgba('#ff4f1a')).toEqual([255, 79, 26, 255]);
    expect(hexToRgba('#abc')).toEqual([170, 187, 204, 255]);
    expect(rgbaToHex([255, 79, 26, 255])).toBe('#FF4F1A');
    expect(isValidHex('12ab9f')).toBe(true);
    expect(isValidHex('#12ab9')).toBe(false);
  });
});

describe('history', () => {
  it('undo/redo, redo cleared by new commit, skip identical, bounded', () => {
    let h = initHistory(0);
    h = commit(h, 1);
    h = commit(h, 2);
    h = undo(h);
    expect(h.present).toBe(1);
    h = redo(h);
    expect(h.present).toBe(2);
    h = undo(h);
    h = commit(h, 5);
    expect(h.future).toHaveLength(0);
    expect(commit(h, 5, (a, b) => a === b)).toBe(h);
    for (let i = 0; i < LIMIT + 20; i++) h = commit(h, i + 10);
    expect(h.past.length).toBe(LIMIT);
  });
});

describe('templates', () => {
  it('ids are unique and hotspots land inside the cursor at every size', () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    for (const t of TEMPLATES) for (const s of [32, 48, 64, 128]) {
      const hs = templateHotspot(t, s);
      expect(hs.x).toBeGreaterThanOrEqual(0);
      expect(hs.y).toBeLessThan(s);
    }
  });
  it('pixel templates: rows are rectangular, fit in 32 px, and the hotspot is on a painted pixel', () => {
    for (const t of TEMPLATES) {
      if (t.kind !== 'pixel') continue;
      const w = t.rows[0].length;
      expect(t.rows.every((r) => r.length === w), t.id).toBe(true);
      const cell = t.cell ?? 1;
      expect(t.offset[0] + w * cell, t.id).toBeLessThanOrEqual(32);
      expect(t.offset[1] + t.rows.length * cell, t.id).toBeLessThanOrEqual(32);
      for (const s of [32, 64, 128]) {
        const b = rasterPixelTemplate(t, s);
        const hs = templateHotspot(t, s);
        expect(getPixel(b, hs.x, hs.y)[3], `${t.id}@${s}`).toBe(255);
      }
    }
  });
});

describe('storage', () => {
  const mem = (): KV => { const m = new Map<string, string>(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) }; };
  const d = (id: string, t: number): SavedDesign => ({ id, name: id, size: 32, png: 'data:image/png;base64,AAAA', hotspot: { x: 1, y: 1 }, createdAt: t, updatedAt: t });
  it('saves, lists newest first, updates in place, deletes', () => {
    const kv = mem();
    saveDesign(d('a', 1), kv);
    saveDesign(d('b', 2), kv);
    expect(listDesigns(kv).map((x) => x.id)).toEqual(['b', 'a']);
    saveDesign({ ...d('a', 3), name: 'renamed' }, kv);
    expect(listDesigns(kv)).toHaveLength(2);
    expect(getDesign('a', kv)?.name).toBe('renamed');
    deleteDesign('a', kv);
    expect(listDesigns(kv).map((x) => x.id)).toEqual(['b']);
  });
  it('ignores corrupt data instead of crashing', () => {
    const kv = mem();
    kv.setItem('nib:designs:v1', '{not json');
    expect(listDesigns(kv)).toEqual([]);
    kv.setItem('nib:designs:v1', JSON.stringify([{ id: 1 }, d('ok', 1), { ...d('evil', 1), png: 'javascript:alert(1)' }]));
    expect(listDesigns(kv).map((x) => x.id)).toEqual(['ok']);
  });
});

describe('upload validation', () => {
  it('accepts images, rejects other types, huge and empty files', () => {
    expect(() => checkFile({ type: 'image/png', size: 1000 })).not.toThrow();
    expect(() => checkFile({ type: 'application/pdf', size: 1000 })).toThrow(ImportError);
    expect(() => checkFile({ type: 'image/png', size: 11 * 1024 * 1024 })).toThrow(/10 MB/);
    expect(() => checkFile({ type: 'image/png', size: 0 })).toThrow(/empty/);
  });
});
