'use client';
import { create } from 'zustand';
import { commit, initHistory, redo, undo, type History } from './history';
import { createBitmap, hexToRgba, rgbaToHex, sameBitmap, type Bitmap, type RGBA } from './pixels';
import type { Hotspot } from './cursor';

export type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'fill' | 'picker' | 'hotspot' | 'move';

/** Everything that undo/redo covers. Size is the bitmap's width, so resizing is undoable too. */
export interface Doc { bmp: Bitmap; hotspot: Hotspot }
export const sameDoc = (a: Doc, b: Doc) => a.hotspot.x === b.hotspot.x && a.hotspot.y === b.hotspot.y && sameBitmap(a.bmp, b.bmp);

export const PALETTE = [
  '#151515', '#57544E', '#B9B4A9', '#FFFFFF', '#FF4F1A', '#F2385A', '#FF8FB1', '#FFC21A',
  '#C7F464', '#2BB673', '#2BD9C4', '#1F8FFF', '#0E3B66', '#6E4BFF', '#8B5A2B', '#F3D9B1',
];

const RECENT_KEY = 'nib:recent:v1';
function loadRecent(): string[] {
  try {
    const r = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(r) ? r.filter((x) => typeof x === 'string' && /^#[0-9A-F]{6}$/i.test(x)).slice(0, 10) : [];
  } catch { return []; }
}

export type Status = 'loading' | 'ready' | 'missing' | 'error';

interface State {
  status: Status;
  error: string | null;
  id: string | null;
  name: string;
  createdAt: number;
  history: History<Doc>;
  saved: { doc: Doc; name: string } | null;
  tool: Tool;
  prevTool: Tool;
  brush: number;
  fillShapes: boolean;
  color: RGBA;
  recent: string[];
  zoom: number | null; // null = fit to the stage

  load(doc: Doc, meta: { id: string | null; name: string; createdAt?: number; saved: boolean }): void;
  fail(status: Exclude<Status, 'loading' | 'ready'>, error?: string): void;
  apply(doc: Doc): void;
  undo(): void;
  redo(): void;
  setTool(t: Tool): void;
  setBrush(n: number): void;
  setFillShapes(v: boolean): void;
  setColor(c: RGBA): void;
  useColor(): void;
  setName(n: string): void;
  setZoom(z: number | null): void;
  markSaved(id: string, doc: Doc, name: string): void;
}

export const useEditor = create<State>((set, get) => ({
  status: 'loading',
  error: null,
  id: null,
  name: 'Untitled cursor',
  createdAt: 0,
  history: initHistory<Doc>({ bmp: createBitmap(32), hotspot: { x: 0, y: 0 } }),
  saved: null,
  tool: 'pen',
  prevTool: 'pen',
  brush: 1,
  fillShapes: false,
  color: [21, 21, 21, 255],
  recent: [],
  zoom: null,

  load(doc, meta) {
    set({
      status: 'ready', error: null, id: meta.id, name: meta.name, createdAt: meta.createdAt ?? Date.now(),
      history: initHistory(doc), saved: meta.saved ? { doc, name: meta.name } : null, zoom: null, recent: loadRecent(),
    });
  },
  fail(status, error) { set({ status, error: error ?? null }); },
  apply(doc) { set({ history: commit(get().history, doc, sameDoc) }); },
  undo() { set({ history: undo(get().history) }); },
  redo() { set({ history: redo(get().history) }); },
  setTool(t) { const cur = get().tool; set({ tool: t, prevTool: t === 'picker' || t === 'hotspot' ? (cur === 'picker' || cur === 'hotspot' ? get().prevTool : cur) : t }); },
  setBrush(n) { set({ brush: Math.max(1, Math.min(8, n)) }); },
  setFillShapes(v) { set({ fillShapes: v }); },
  setColor(c) { set({ color: c }); },
  /** Called when a colour is actually painted with: it joins the recent list. */
  useColor() {
    const hex = rgbaToHex(get().color);
    const recent = [hex, ...get().recent.filter((h) => h !== hex)].slice(0, 10);
    if (recent.join() === get().recent.join()) return;
    set({ recent });
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch { /* storage full: recents are a nicety */ }
  },
  setName(n) { set({ name: n.slice(0, 60) }); },
  setZoom(z) { set({ zoom: z }); },
  markSaved(id, doc, name) { set({ id, saved: { doc, name } }); },
}));

export const selectDoc = (s: State) => s.history.present;
export const selectDirty = (s: State) => !s.saved || s.saved.doc !== s.history.present || s.saved.name !== s.name;
export const hexColor = (c: RGBA) => rgbaToHex(c);
export const colorFromHex = (h: string, a = 255) => hexToRgba(h, a);
