'use client';
import { useEffect, useState } from 'react';
import { bitmapToPng } from '@/lib/cursor';
import { TEMPLATES, rasterTemplate, templateHotspot } from '@/lib/templates';

export interface Art { id: string; png: string; hotspot: { x: number; y: number } }

/** Renders every template once on the client (vector templates need a canvas). */
export function useTemplateArt(size = 32): Record<string, Art> | null {
  const [art, setArt] = useState<Record<string, Art> | null>(null);
  useEffect(() => {
    const out: Record<string, Art> = {};
    for (const t of TEMPLATES) out[t.id] = { id: t.id, png: bitmapToPng(rasterTemplate(t, size)), hotspot: templateHotspot(t, size) };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off client-only rasterisation
    setArt(out);
  }, [size]);
  return art;
}
