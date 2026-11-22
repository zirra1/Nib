'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { SIZES, bitmapToPng, cursorCss, type CursorSize } from '@/lib/cursor';
import { ACCEPTED, ImportError, importImage } from '@/lib/importImage';
import { CATEGORIES, TEMPLATES, type Category } from '@/lib/templates';
import { IconGrid, IconPen, IconUpload } from './Icons';
import { Eyebrow, Segmented } from './ui';
import { useTemplateArt } from './useTemplateArt';

export const IMPORT_KEY = 'nib:import';

export function StartScreen() {
  const router = useRouter();
  const [size, setSize] = useState<CursorSize>(32);
  const [cat, setCat] = useState<Category | 'All'>('All');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const art = useTemplateArt(64);
  const shown = TEMPLATES.filter((t) => cat === 'All' || t.category === cat);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setError(null);
    setBusy(true);
    try {
      const { bitmap, backgroundRemoved } = await importImage(f, size);
      sessionStorage.setItem(IMPORT_KEY, JSON.stringify({ png: bitmapToPng(bitmap), backgroundRemoved, name: f.name.replace(/\.[^.]+$/, '').slice(0, 40) }));
      router.push(`/editor?import=1&size=${size}`);
    } catch (e) {
      setError(e instanceof ImportError ? e.message : 'Something went wrong reading that image. Try another one.');
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 pt-10 pb-20 md:px-8 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow className="mb-3">Step 1 of 3</Eyebrow>
          <h1 className="text-[40px] leading-none font-medium tracking-[-0.04em] md:text-[52px]">Start a cursor</h1>
        </div>
        <div className="flex items-center gap-3">
          <span id="size-label" className="text-sm text-ink-2">Size</span>
          <Segmented label="Cursor size in pixels" value={size} onChange={setSize} options={SIZES.map((s) => ({ value: s, label: s }))} />
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-2">{size === 32 ? '32 px is the standard cursor size on most computers.' : `${size} px. Bigger cursors are easier to see. You can change this later.`}</p>

      {/* Three ways in */}
      <div className="mt-10 grid border border-line-2 bg-surface md:grid-cols-3">
        <a href="#templates" className="group flex flex-col gap-3 border-b border-line-2 p-6 transition-colors hover:bg-paper md:border-r md:border-b-0">
          <IconGrid size={22} />
          <span className="text-lg font-medium tracking-[-0.02em]">Start from a template</span>
          <span className="text-sm leading-relaxed text-ink-2">Arrows, hands, shapes, tools and characters. Pick one below and make it yours.</span>
        </a>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
          className={`relative flex flex-col gap-3 border-b border-line-2 p-6 transition-colors md:border-r md:border-b-0 ${drag ? 'bg-paper outline-2 -outline-offset-8 outline-ink outline-dashed' : 'hover:bg-paper'}`}
        >
          <IconUpload size={22} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="text-left text-lg font-medium tracking-[-0.02em] after:absolute after:inset-0 after:content-['']">
            {busy ? 'Preparing your image…' : 'Upload an image'}
          </button>
          <span className="text-sm leading-relaxed text-ink-2">Drop a PNG, JPG, WebP, GIF or SVG. A plain background is removed and it’s cropped to size, all on your device.</span>
          <input ref={fileRef} type="file" accept={ACCEPTED.join(',')} className="sr-only" tabIndex={-1} aria-label="Choose an image" onChange={(e) => onFile(e.target.files?.[0])} />
          {error && <p role="alert" className="relative z-10 text-sm text-danger">{error}</p>}
        </div>
        <Link href={`/editor?blank=1&size=${size}`} className="group flex flex-col gap-3 p-6 transition-colors hover:bg-paper">
          <IconPen size={22} />
          <span className="text-lg font-medium tracking-[-0.02em]">Draw your own</span>
          <span className="text-sm leading-relaxed text-ink-2">A blank {size} × {size} grid. Every pixel is yours.</span>
        </Link>
      </div>

      {/* Template gallery */}
      <section id="templates" className="mt-16 scroll-mt-20">
        <div className="ruler flex flex-wrap items-end justify-between gap-4 pb-4">
          <h2 className="text-2xl font-medium tracking-[-0.03em]">Templates</h2>
          <div role="tablist" aria-label="Template categories" className="-mx-1 flex flex-wrap gap-1">
            {(['All', ...CATEGORIES] as const).map((c) => (
              <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
                className={`rounded-sm px-2.5 py-1 text-sm transition-colors ${cat === c ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-6 grid grid-cols-3 border-t border-l border-line bg-surface sm:grid-cols-4 lg:grid-cols-6">
          {shown.map((t) => {
            const a = art?.[t.id];
            return (
              <li key={t.id} className="border-r border-b border-line">
                <Link
                  href={`/editor?template=${t.id}&size=${size}`}
                  data-own-cursor
                  style={a ? { cursor: cursorCss(a.png, a.hotspot) } : undefined}
                  className="group flex flex-col items-center gap-3 p-4 pt-6 transition-colors hover:bg-paper"
                >
                  <span className="relative grid size-20 place-items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
                    {a && <img src={a.png} alt="" width={64} height={64} className="size-16 transition-transform duration-200 group-hover:-translate-y-0.5" />}
                  </span>
                  <span className="text-sm">{t.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[13px] text-ink-2">Hover a template to try it as your cursor. Click to open it in the editor.</p>
      </section>
    </main>
  );
}
