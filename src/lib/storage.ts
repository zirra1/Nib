/**
 * "My cursors": designs are saved in this browser (localStorage). No account, nothing uploaded.
 * The store is versioned and validated on read so a corrupt entry can't break the app.
 */
export interface SavedDesign {
  id: string;
  name: string;
  size: number;
  png: string; // data:image/png;base64,…
  hotspot: { x: number; y: number };
  createdAt: number;
  updatedAt: number;
}

const KEY = 'nib:designs:v1';
const MAX_PNG = 400_000; // a 128 px cursor PNG is far below this

export interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void }
const defaultKV = (): KV | null => (typeof localStorage === 'undefined' ? null : localStorage);

function valid(d: unknown): d is SavedDesign {
  if (!d || typeof d !== 'object') return false;
  const x = d as Record<string, unknown>;
  const hs = x.hotspot as Record<string, unknown> | undefined;
  return typeof x.id === 'string' && typeof x.name === 'string' && typeof x.size === 'number'
    && typeof x.png === 'string' && x.png.startsWith('data:image/png;base64,') && x.png.length < MAX_PNG
    && !!hs && typeof hs.x === 'number' && typeof hs.y === 'number'
    && typeof x.createdAt === 'number' && typeof x.updatedAt === 'number';
}

export function listDesigns(kv = defaultKV()): SavedDesign[] {
  if (!kv) return [];
  try {
    const raw = JSON.parse(kv.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter(valid).sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

export function getDesign(id: string, kv = defaultKV()): SavedDesign | undefined {
  return listDesigns(kv).find((d) => d.id === id);
}

export class StorageFullError extends Error {
  constructor() { super('This browser has no room left to save designs. Delete a few in My cursors and try again.'); }
}

export function saveDesign(d: SavedDesign, kv = defaultKV()): void {
  if (!kv) return;
  if (!valid(d)) throw new Error('Invalid design');
  const rest = listDesigns(kv).filter((x) => x.id !== d.id);
  try {
    kv.setItem(KEY, JSON.stringify([d, ...rest]));
  } catch {
    throw new StorageFullError();
  }
}

export function deleteDesign(id: string, kv = defaultKV()): void {
  if (!kv) return;
  kv.setItem(KEY, JSON.stringify(listDesigns(kv).filter((d) => d.id !== id)));
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** The cursor applied to the Nib site itself ("Use it here"), remembered per browser. */
const APPLIED = 'nib:applied:v1';
export interface Applied { png: string; hotspot: { x: number; y: number } }
export function getApplied(kv = defaultKV()): Applied | null {
  try {
    const a = JSON.parse(kv?.getItem(APPLIED) ?? 'null');
    return a && typeof a.png === 'string' && a.png.startsWith('data:image/png') && a.hotspot ? a : null;
  } catch {
    return null;
  }
}
export function setApplied(a: Applied | null, kv = defaultKV()): void {
  kv?.setItem(APPLIED, JSON.stringify(a));
}
