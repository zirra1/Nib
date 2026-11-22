/** Immutable undo/redo stack. `present` is the current state; commit pushes it to `past`. */
export interface History<T> {
  readonly past: readonly T[];
  readonly present: T;
  readonly future: readonly T[];
}

export const LIMIT = 100;

export const initHistory = <T>(present: T): History<T> => ({ past: [], present, future: [] });

export function commit<T>(h: History<T>, next: T, same?: (a: T, b: T) => boolean): History<T> {
  if (same?.(h.present, next)) return h;
  const past = [...h.past, h.present];
  return { past: past.length > LIMIT ? past.slice(past.length - LIMIT) : past, present: next, future: [] };
}

export function undo<T>(h: History<T>): History<T> {
  if (!h.past.length) return h;
  return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] };
}

export function redo<T>(h: History<T>): History<T> {
  if (!h.future.length) return h;
  return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
}
