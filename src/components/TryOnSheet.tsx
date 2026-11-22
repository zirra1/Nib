'use client';
import Link from 'next/link';
import { useState } from 'react';
import { cursorCss } from '@/lib/cursor';
import { templateById } from '@/lib/templates';
import { useTemplateArt } from './useTemplateArt';

const IDS = ['classic', 'dart', 'pixel-hand', 'heart', 'crosshair', 'pencil', 'ghost', 'star'];

/**
 * A specimen sheet of cursors. Hovering a cell swaps the visitor's real cursor for that design,
 * so the product is demonstrated with the one thing everyone already has in their hand.
 */
export function TryOnSheet() {
  const art = useTemplateArt(32);
  const big = useTemplateArt(64); // drawn at 2× for display; the cursor itself is the 32 px version
  const [hover, setHover] = useState<string | null>(null);
  const active = hover ? templateById(hover) : null;
  return (
    <figure className="w-full">
      <div className="grid grid-cols-4 border-t border-l border-line-2 bg-surface">
        {IDS.map((id, i) => {
          const t = templateById(id)!;
          const a = art?.[id];
          return (
            <Link
              key={id}
              href={`/editor?template=${id}`}
              data-own-cursor
              onPointerEnter={() => setHover(id)}
              onPointerLeave={() => setHover((h) => (h === id ? null : h))}
              onFocus={() => setHover(id)}
              onBlur={() => setHover(null)}
              style={a ? { cursor: cursorCss(a.png, a.hotspot) } : undefined}
              className="group relative grid aspect-square place-items-center border-r border-b border-line-2 transition-colors hover:bg-paper"
              aria-label={`${t.name} cursor. Open it in the editor`}
            >
              <span className="absolute top-2 left-2.5 text-[11px] text-ink-3 tnum">{String(i + 1).padStart(2, '0')}</span>
              {a && big ? (
                // eslint-disable-next-line @next/next/no-img-element -- generated data URL
                <img src={big[id].png} alt="" width={64} height={64} className="size-12 transition-transform duration-200 group-hover:scale-110 md:size-16" />
              ) : (
                <span className="size-12 md:size-16" />
              )}
            </Link>
          );
        })}
      </div>
      <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-[13px] text-ink-2">
        <span>{active ? <>Wearing <b className="font-medium text-ink">{active.name}</b>. That’s your real cursor.</> : 'Hover a square to try it on.'}</span>
        <span className="tnum hidden text-ink-3 sm:inline">{active && art ? `hotspot ${art[active.id].hotspot.x}, ${art[active.id].hotspot.y}` : '32 × 32 px'}</span>
      </figcaption>
    </figure>
  );
}
