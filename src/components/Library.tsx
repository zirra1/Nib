'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cursorCss } from '@/lib/cursor';
import { deleteDesign, getApplied, listDesigns, saveDesign, type SavedDesign } from '@/lib/storage';
import { applyCursor } from './AppliedCursor';
import { IconCursor, IconPlus, IconTrash } from './Icons';
import { Mark } from './Logo';
import { toast } from './Toast';
import { ButtonLink, Eyebrow } from './ui';

function ago(t: number) {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function Library() {
  const [items, setItems] = useState<SavedDesign[] | null>(null);
  const [wearing, setWearing] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser storage after mount
    setItems(listDesigns());
    setWearing(getApplied()?.png ?? null);
  }, []);

  function remove(d: SavedDesign) {
    deleteDesign(d.id);
    setItems(listDesigns());
    toast(`Deleted “${d.name}”.`, { action: { label: 'Undo', run: () => { saveDesign(d); setItems(listDesigns()); } } });
  }
  function wear(d: SavedDesign) {
    const on = wearing === d.png;
    applyCursor(on ? null : { png: d.png, hotspot: d.hotspot });
    setWearing(on ? null : d.png);
    toast(on ? 'Back to the standard cursor.' : `You’re wearing “${d.name}”.`, { tone: on ? 'plain' : 'ok' });
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 pt-10 pb-20 md:px-8 md:pt-14">
      <div className="ruler flex flex-wrap items-end justify-between gap-4 pb-5">
        <div>
          <Eyebrow className="mb-3">Saved on this device</Eyebrow>
          <h1 className="text-[40px] leading-none font-medium tracking-[-0.04em] md:text-[52px]">My cursors</h1>
        </div>
        {!!items?.length && <ButtonLink href="/new" variant="primary"><IconPlus size={16} /> New cursor</ButtonLink>}
      </div>

      {items === null ? (
        <ul aria-busy className="mt-8 grid grid-cols-2 border-t border-l border-line sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => <li key={i} className="aspect-[4/5] animate-pulse border-r border-b border-line bg-surface" />)}
        </ul>
      ) : items.length === 0 ? (
        <div className="mt-8 grid place-items-center border border-dashed border-line-2 px-6 py-20 text-center">
          <Mark size={40} />
          <h2 className="mt-6 text-2xl font-medium tracking-[-0.03em]">No cursors yet</h2>
          <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink-2">Designs you save appear here. They stay in this browser, so nothing is uploaded and no account is needed.</p>
          <ButtonLink href="/new" variant="primary" size="lg" className="mt-7">Make your first cursor</ButtonLink>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 border-t border-l border-line sm:grid-cols-3 lg:grid-cols-5">
          {items.map((d) => {
            const on = wearing === d.png;
            return (
              <li key={d.id} className="group relative flex flex-col border-r border-b border-line bg-surface">
                <Link href={`/editor?id=${d.id}`} data-own-cursor style={{ cursor: cursorCss(d.png, d.hotspot) }}
                  className="grid aspect-square place-items-center checker" aria-label={`Open ${d.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- stored data URL */}
                  <img src={d.png} alt="" width={d.size} height={d.size}
                    style={{ width: Math.max(48, Math.min(96, d.size * 2)), height: Math.max(48, Math.min(96, d.size * 2)) }}
                    className={d.size <= 48 ? '[image-rendering:pixelated]' : ''} />
                </Link>
                {on && <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-sm bg-ink px-2 py-1 text-[11px] text-paper"><span className="size-1.5 bg-accent" /> Wearing</span>}
                <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="tnum text-xs text-ink-2">{d.size} px · {ago(d.updatedAt)}</p>
                  </div>
                  <button type="button" onClick={() => wear(d)} aria-pressed={on} aria-label={on ? `Stop wearing ${d.name}` : `Use ${d.name} here`} title={on ? 'Stop wearing' : 'Use it here'}
                    className={`grid size-8 place-items-center rounded-sm ${on ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-sunk hover:text-ink'}`}><IconCursor size={16} /></button>
                  <button type="button" onClick={() => remove(d)} aria-label={`Delete ${d.name}`} title="Delete"
                    className="grid size-8 place-items-center rounded-sm text-ink-2 hover:bg-sunk hover:text-danger"><IconTrash size={16} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
