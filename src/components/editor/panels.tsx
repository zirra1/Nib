'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { PALETTE, colorFromHex, hexColor, useEditor } from '@/lib/editorStore';
import { isValidHex, tipPixel } from '@/lib/pixels';
import { bitmapToPng, cursorCss } from '@/lib/cursor';
import { Segmented } from '../ui';

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-medium tracking-[0.12em] text-ink-2 uppercase">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Swatch({ hex, active, onPick, label }: { hex: string; active: boolean; onPick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onPick} aria-label={label ?? hex} aria-pressed={active} title={hex}
      className={`relative size-7 rounded-[4px] border transition-transform hover:-translate-y-px ${active ? 'border-ink ring-1 ring-ink ring-offset-2 ring-offset-surface' : 'border-black/10'}`}
      style={{ background: hex }} />
  );
}

export function ColorPanel() {
  const color = useEditor((s) => s.color);
  const recent = useEditor((s) => s.recent);
  const setColor = useEditor((s) => s.setColor);
  const hex = hexColor(color);
  const [draft, setDraft] = useState(hex);
  const [shown, setShown] = useState(hex);
  if (shown !== hex) { setShown(hex); setDraft(hex); } // colour changed elsewhere: refresh the field
  const opacity = Math.round((color[3] / 255) * 100);
  const commitDraft = () => (isValidHex(draft) ? setColor(colorFromHex(draft.startsWith('#') ? draft : '#' + draft, color[3])) : setDraft(hex));
  return (
    <Section title="Colour">
      <div className="flex items-center gap-3">
        <label className="relative block size-11 shrink-0 overflow-hidden rounded-sm border border-line-2 checker" title="Open colour picker">
          <span className="absolute inset-0" style={{ background: hex, opacity: color[3] / 255 }} />
          <input type="color" value={hex.toLowerCase()} onChange={(e) => setColor(colorFromHex(e.target.value, color[3]))}
            className="absolute inset-0 size-full opacity-0" aria-label="Colour picker" />
        </label>
        <div className="grid flex-1 grid-cols-[1fr_auto] gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value.toUpperCase())} onBlur={commitDraft}
            onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
            aria-label="Hex colour" spellCheck={false}
            className="tnum h-9 w-full min-w-0 rounded-sm border border-line-2 bg-surface px-2.5 text-sm uppercase focus:border-ink focus:outline-none" />
          <label className="tnum flex h-9 items-center gap-1 rounded-sm border border-line-2 px-2 text-sm text-ink-2" title="Opacity">
            <input type="number" min={0} max={100} value={opacity} aria-label="Opacity percent"
              onChange={(e) => setColor([color[0], color[1], color[2], Math.round((Math.max(0, Math.min(100, +e.target.value || 0)) / 100) * 255)])}
              className="w-10 bg-transparent text-right text-ink focus:outline-none" />%
          </label>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-8 gap-1.5" role="group" aria-label="Palette">
        {PALETTE.map((h) => <Swatch key={h} hex={h} active={h === hex && color[3] === 255} onPick={() => setColor(colorFromHex(h))} />)}
      </div>
      <p className="mt-4 mb-2 text-xs text-ink-2">Recent</p>
      {recent.length ? (
        <div className="grid grid-cols-8 gap-1.5" role="group" aria-label="Recent colours">
          {recent.slice(0, 8).map((h) => <Swatch key={h} hex={h} active={false} onPick={() => setColor(colorFromHex(h))} label={`Recent ${h}`} />)}
        </div>
      ) : (
        <p className="text-xs text-ink-3">Colours you paint with appear here.</p>
      )}
    </Section>
  );
}

export function HotspotPanel() {
  const doc = useEditor((s) => s.history.present);
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const apply = useEditor((s) => s.apply);
  const size = doc.bmp.w;
  const set = (x: number, y: number) => apply({ bmp: doc.bmp, hotspot: { x: Math.max(0, Math.min(size - 1, x)), y: Math.max(0, Math.min(size - 1, y)) } });
  const field = (axis: 'x' | 'y') => (
    <label className="tnum flex h-9 items-center gap-2 rounded-sm border border-line-2 px-2.5 text-sm">
      <span className="text-ink-2 uppercase">{axis}</span>
      <input type="number" min={0} max={size - 1} value={doc.hotspot[axis]} aria-label={`Hotspot ${axis}`}
        onChange={(e) => (axis === 'x' ? set(+e.target.value, doc.hotspot.y) : set(doc.hotspot.x, +e.target.value))}
        className="w-full min-w-0 bg-transparent focus:outline-none" />
    </label>
  );
  return (
    <Section title="Hotspot" aside={<span aria-hidden className="size-2.5 bg-accent" />}>
      <p className="mb-3 text-[13px] leading-relaxed text-ink-2">The exact pixel that clicks. For arrows it’s the tip; for crosshairs, the centre.</p>
      <div className="grid grid-cols-2 gap-2">{field('x')}{field('y')}</div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[13px]">
        <button type="button" onClick={() => setTool('hotspot')} aria-pressed={tool === 'hotspot'}
          className={`h-8 rounded-sm border ${tool === 'hotspot' ? 'border-ink bg-ink text-paper' : 'border-line-2 hover:border-ink'}`}>Pick <kbd className="text-[11px] opacity-60">H</kbd></button>
        <button type="button" onClick={() => { const t = tipPixel(doc.bmp); if (t) set(t.x, t.y); }} className="h-8 rounded-sm border border-line-2 hover:border-ink">Tip</button>
        <button type="button" onClick={() => set(Math.floor(size / 2), Math.floor(size / 2))} className="h-8 rounded-sm border border-line-2 hover:border-ink">Centre</button>
      </div>
    </Section>
  );
}

type Bg = 'light' | 'dark' | 'colour' | 'desktop' | 'web';
const BGS: { value: Bg; label: string }[] = [
  { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'colour', label: 'Colour' },
  { value: 'desktop', label: 'Desktop' }, { value: 'web', label: 'Web' },
];

/** Live test zone: your real mouse becomes the cursor here, over text, links and buttons. */
export function PreviewPanel({ compact = false }: { compact?: boolean }) {
  const doc = useEditor((s) => s.history.present);
  const [bg, setBg] = useState<Bg>('light');
  const png = useMemo(() => bitmapToPng(doc.bmp), [doc.bmp]);
  const css = cursorCss(png, doc.hotspot);
  const size = doc.bmp.w;
  return (
    <Section title="Preview" aside={<span className="text-xs text-ink-2">{size} px</span>}>
      <Segmented label="Preview background" value={bg} onChange={setBg} options={BGS} className="mb-3 flex w-full [&>button]:flex-1 [&>button]:px-1" />
      <div data-own-cursor data-testid="preview-zone" style={{ cursor: css }} className={`relative overflow-hidden rounded-sm border border-line-2 ${compact ? 'h-44' : 'h-52'}`}>
        <PreviewScene bg={bg} />
      </div>
      <p className="mt-2 text-xs text-ink-2 [@media(pointer:coarse)]:hidden">Move your mouse over the box. That’s your cursor at real size.</p>
      <p className="mt-2 hidden text-xs text-ink-2 [@media(pointer:coarse)]:block">Cursors are used with a mouse or trackpad. Save it here and open Nib on your computer to wear it.</p>
      <div className="mt-4 flex items-end gap-3">
        {[['#ffffff', 'On white'], ['#151515', 'On black']].map(([b, l]) => (
          <figure key={l} className="flex flex-col items-center gap-1">
            <span className="grid place-items-center rounded-sm border border-line-2" style={{ background: b, width: Math.max(48, size + 16), height: Math.max(48, size + 16) }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
              <img src={png} alt="" width={size} height={size} style={{ width: size, height: size }} />
            </span>
            <figcaption className="text-[11px] text-ink-2">{l}</figcaption>
          </figure>
        ))}
        <span className="mb-5 text-[11px] text-ink-3">Actual size</span>
      </div>
    </Section>
  );
}

function PreviewScene({ bg }: { bg: Bg }) {
  const sample = (dark: boolean) => (
    <div className={`flex h-full flex-col justify-center gap-3 px-5 ${dark ? 'text-[#f3f1ec]' : 'text-ink'}`}>
      <p className="text-[13px] leading-relaxed">Point at this text, then the <a href="#" onClick={(e) => e.preventDefault()} className="underline underline-offset-2">link</a>, then the button.</p>
      <span className="flex gap-2">
        <button type="button" className={`rounded-sm px-3 py-1.5 text-xs font-medium ${dark ? 'bg-[#f3f1ec] text-ink' : 'bg-ink text-paper'}`}>Button</button>
        <input aria-label="Sample text field" placeholder="Text field" className={`w-28 rounded-sm border px-2 text-xs ${dark ? 'border-white/20 bg-transparent' : 'border-line-2 bg-white'}`} />
      </span>
    </div>
  );
  if (bg === 'light') return <div className="h-full bg-white">{sample(false)}</div>;
  if (bg === 'dark') return <div className="h-full bg-[#151515]">{sample(true)}</div>;
  if (bg === 'colour') return (
    <div className="grid h-full grid-cols-4">
      {['#FFC21A', '#1F8FFF', '#F2385A', '#2BB673'].map((c) => <span key={c} style={{ background: c }} />)}
    </div>
  );
  if (bg === 'desktop') return (
    <div className="relative h-full bg-[#3d5a6c]">
      <div className="absolute top-3 left-3 grid gap-3">
        {['Documents', 'Photos'].map((n) => (
          <span key={n} className="flex flex-col items-center gap-1 text-[10px] text-white">
            <span className="h-7 w-9 rounded-[3px] bg-[#9cc3dd]" />{n}
          </span>
        ))}
      </div>
      <div className="absolute top-6 right-4 w-[58%] overflow-hidden rounded-[5px] bg-white">
        <div className="flex h-5 items-center gap-1 bg-[#e9e6df] px-2">{[0, 1, 2].map((i) => <span key={i} className="size-1.5 rounded-full bg-[#c9c4b8]" />)}</div>
        <div className="space-y-1.5 p-3">{[90, 70, 80].map((w) => <span key={w} className="block h-1.5 rounded-full bg-[#e3dfd6]" style={{ width: `${w}%` }} />)}</div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-6 bg-black/35" />
    </div>
  );
  return (
    <div className="h-full bg-white">
      <div className="flex h-8 items-center justify-between border-b border-[#ece9e2] px-4 text-[11px]">
        <b className="font-semibold">Journal</b>
        <span className="flex gap-3 text-ink-2"><a href="#" onClick={(e) => e.preventDefault()}>Stories</a><a href="#" onClick={(e) => e.preventDefault()}>About</a></span>
      </div>
      <div className="px-4 pt-3">
        <p className="text-[15px] leading-tight font-medium tracking-[-0.02em]">A small thing you use all day</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-2">Every click starts at a single pixel. Most of us never think about which one. <a href="#" onClick={(e) => e.preventDefault()} className="text-ink underline">Read more</a></p>
        <button type="button" className="mt-2.5 rounded-sm bg-ink px-2.5 py-1 text-[11px] text-paper">Subscribe</button>
      </div>
    </div>
  );
}
