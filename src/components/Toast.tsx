'use client';
import { useEffect, useState } from 'react';

export interface ToastMsg { id: number; text: string; tone?: 'ok' | 'error' | 'plain'; action?: { label: string; run: () => void } }
type Listener = (t: ToastMsg) => void;
const listeners = new Set<Listener>();
let seq = 0;

export function toast(text: string, opts: Omit<ToastMsg, 'id' | 'text'> = {}) {
  const t = { id: ++seq, text, ...opts };
  listeners.forEach((l) => l(t));
}

/** One quiet message at a time, bottom centre. Announced to screen readers. */
export function Toaster() {
  const [t, setT] = useState<ToastMsg | null>(null);
  useEffect(() => {
    const l: Listener = (m) => setT(m);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setT((c) => (c?.id === t.id ? null : c)), t.action ? 7000 : 3800);
    return () => clearTimeout(h);
  }, [t]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 max-lg:bottom-24">
      {t && (
        <div key={t.id} role="status" className="rise pointer-events-auto flex items-center gap-4 rounded-md bg-ink px-4 py-3 text-sm text-paper">
          {t.tone === 'ok' && <span aria-hidden className="size-2 bg-accent" />}
          {t.tone === 'error' && <span aria-hidden className="size-2 rounded-full bg-[#ff8a7a]" />}
          <span>{t.text}</span>
          {t.action && (
            <button onClick={() => { t.action!.run(); setT(null); }} className="font-medium underline underline-offset-4">
              {t.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
