'use client';
import { useEffect } from 'react';
import { cursorCss } from '@/lib/cursor';
import { getApplied, setApplied, type Applied } from '@/lib/storage';

const EVENT = 'nib:applied';

function paint(a: Applied | null) {
  const el = document.documentElement;
  if (a) {
    el.style.setProperty('--user-cursor', cursorCss(a.png, a.hotspot));
    el.dataset.userCursor = '';
  } else {
    el.style.removeProperty('--user-cursor');
    delete el.dataset.userCursor;
  }
}

/** Puts the visitor's own cursor on the whole site (and every open tab of it). */
export function applyCursor(a: Applied | null) {
  setApplied(a);
  paint(a);
  window.dispatchEvent(new Event(EVENT));
}

export function AppliedCursor() {
  useEffect(() => {
    paint(getApplied());
    const sync = () => paint(getApplied());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return null;
}

export const APPLIED_EVENT = EVENT;
