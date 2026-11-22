'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SIZES, bitmapToPng, pngToBitmap, resizeBitmap, type CursorSize } from '@/lib/cursor';
import { selectDirty, useEditor, type Doc, type Tool } from '@/lib/editorStore';
import { createBitmap, isEmpty, tipPixel } from '@/lib/pixels';
import { getDesign, newId, saveDesign, StorageFullError } from '@/lib/storage';
import { rasterTemplate, templateById, templateHotspot } from '@/lib/templates';
import { IconArrowRight, IconCheck, IconFit, IconMinus, IconPlus, IconRedo, IconSliders, IconUndo } from '../Icons';
import { Mark } from '../Logo';
import { toast } from '../Toast';
import { Button, ButtonLink, IconButton } from '../ui';
import { IMPORT_KEY } from '../StartScreen';
import { Canvas, ZOOMS } from './Canvas';
import { ColorPanel, HotspotPanel, PreviewPanel } from './panels';
import { OptionsBar, TOOLS, ToolRail } from './tools';

const KEYMAP: Record<string, Tool> = Object.fromEntries(TOOLS.map((t) => [t.key.toLowerCase(), t.id]));

/** Reads the URL once and loads the right document: a saved design, a template, an upload or a blank grid. */
async function loadFromUrl(): Promise<void> {
  const s = useEditor.getState();
  const q = new URLSearchParams(window.location.search);
  const sizeParam = Number(q.get('size'));
  const size: CursorSize = (SIZES as readonly number[]).includes(sizeParam) ? (sizeParam as CursorSize) : 32;
  const id = q.get('id');
  try {
    if (id) {
      const d = getDesign(id);
      if (!d) return s.fail('missing');
      const bmp = await pngToBitmap(d.png);
      return s.load({ bmp, hotspot: d.hotspot }, { id: d.id, name: d.name, createdAt: d.createdAt, saved: true });
    }
    const tid = q.get('template');
    if (tid) {
      const t = templateById(tid);
      if (!t) return s.fail('missing', 'That template doesn’t exist.');
      return s.load({ bmp: rasterTemplate(t, size), hotspot: templateHotspot(t, size) }, { id: null, name: `My ${t.name.toLowerCase()}`, saved: false });
    }
    if (q.get('import')) {
      const raw = sessionStorage.getItem(IMPORT_KEY);
      if (!raw) return s.fail('missing', 'The uploaded image is no longer here. Please upload it again.');
      const { png, backgroundRemoved, name } = JSON.parse(raw);
      const bmp = await pngToBitmap(png);
      s.load({ bmp, hotspot: tipPixel(bmp) ?? { x: 0, y: 0 } }, { id: null, name: name || 'My upload', saved: false });
      sessionStorage.removeItem(IMPORT_KEY);
      toast(backgroundRemoved ? 'Background removed and cropped to size.' : 'Cropped to size. The background wasn’t one plain colour, so it was kept.', { tone: 'ok' });
      return;
    }
    s.load({ bmp: createBitmap(size), hotspot: { x: 0, y: 0 } }, { id: null, name: 'Untitled cursor', saved: false });
  } catch {
    s.fail('error', 'This cursor couldn’t be opened.');
  }
}

export function Editor() {
  const router = useRouter();
  const status = useEditor((s) => s.status);
  const error = useEditor((s) => s.error);
  const doc = useEditor((s) => s.history.present);
  const canUndo = useEditor((s) => s.history.past.length > 0);
  const canRedo = useEditor((s) => s.history.future.length > 0);
  const dirty = useEditor(selectDirty);
  const id = useEditor((s) => s.id);
  const name = useEditor((s) => s.name);
  const zoomState = useEditor((s) => s.zoom);
  const color = useEditor((s) => s.color);
  const fitRef = useRef<(() => number) | null>(null);
  const [sheet, setSheet] = useState<null | 'colour' | 'hotspot' | 'preview'>(null);

  useEffect(() => {
    useEditor.setState({ status: 'loading' });
    loadFromUrl();
  }, []);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty || status !== 'ready') return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty, status]);

  const size = doc.bmp.w;
  const currentZoom = () => useEditor.getState().zoom ?? fitRef.current?.() ?? 8;
  const zoomBy = (dir: 1 | -1) => {
    const z = currentZoom();
    const next = dir > 0 ? ZOOMS.find((v) => v > z) ?? z : [...ZOOMS].reverse().find((v) => v < z) ?? z;
    useEditor.getState().setZoom(next);
  };

  function save(): Doc | null {
    const s = useEditor.getState();
    const d = s.history.present;
    const designId = s.id ?? newId();
    try {
      saveDesign({ id: designId, name: s.name.trim() || 'Untitled cursor', size: d.bmp.w, png: bitmapToPng(d.bmp), hotspot: d.hotspot, createdAt: s.createdAt, updatedAt: Date.now() });
    } catch (e) {
      toast(e instanceof StorageFullError ? e.message : 'Couldn’t save. Please try again.', { tone: 'error' });
      return null;
    }
    s.markSaved(designId, d, s.name);
    if (!s.id) window.history.replaceState(null, '', `/editor?id=${designId}`);
    return d;
  }

  function goApply() {
    const d = useEditor.getState().history.present;
    if (isEmpty(d.bmp)) { toast('Draw something first. An empty cursor would be invisible.'); return; }
    if (!save()) return;
    router.push(`/apply?id=${useEditor.getState().id}`);
  }

  function resize(n: CursorSize) {
    const s = useEditor.getState(), d = s.history.present;
    if (n === d.bmp.w) return;
    const k = n / d.bmp.w;
    s.apply({ bmp: resizeBitmap(d.bmp, n), hotspot: { x: Math.min(n - 1, Math.floor(d.hotspot.x * k)), y: Math.min(n - 1, Math.floor(d.hotspot.y * k)) } });
    s.setZoom(null);
  }

  // Keyboard shortcuts (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable]')) return;
      const s = useEditor.getState();
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) s.redo(); else s.undo(); return; }
      if (mod && k === 'y') { e.preventDefault(); s.redo(); return; }
      if (mod && k === 's') { e.preventDefault(); if (save()) toast('Saved to My cursors.', { tone: 'ok' }); return; }
      if (mod) return;
      if (KEYMAP[k]) { s.setTool(KEYMAP[k]); return; }
      if (k === '[') s.setBrush(s.brush - 1);
      else if (k === ']') s.setBrush(s.brush + 1);
      else if (k === '=' || k === '+') zoomBy(1);
      else if (k === '-') zoomBy(-1);
      else if (k === '0') s.setZoom(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers read live state from the store
  }, []);

  if (status === 'missing' || status === 'error') {
    return (
      <main className="grid flex-1 place-items-center px-6">
        <div className="max-w-sm text-center">
          <Mark size={36} className="mx-auto" />
          <h1 className="mt-6 text-2xl font-medium tracking-[-0.03em]">{status === 'missing' ? 'We couldn’t find that cursor' : 'Something went wrong'}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{error ?? 'It may have been deleted, or saved in a different browser. Designs are kept on the device where you made them.'}</p>
          <div className="mt-6 flex justify-center gap-2">
            <ButtonLink href="/cursors">My cursors</ButtonLink>
            <ButtonLink href="/new" variant="primary">Start a new one</ButtonLink>
          </div>
        </div>
      </main>
    );
  }

  const leave = (e: React.MouseEvent) => {
    if (dirty && !window.confirm('Leave without saving? Your changes will be lost.')) e.preventDefault();
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-2 lg:gap-3 lg:px-3">
        <Link href="/" onClick={leave} aria-label="Nib home" className="grid size-9 place-items-center rounded-sm hover:bg-sunk"><Mark /></Link>
        <span aria-hidden className="hidden h-5 w-px bg-line lg:block" />
        <div className="flex min-w-0 flex-1 flex-col justify-center lg:flex-none">
          <input
            value={name}
            onChange={(e) => useEditor.getState().setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            aria-label="Cursor name"
            className="w-full min-w-0 truncate rounded-sm bg-transparent px-1.5 py-0.5 text-[15px] font-medium tracking-[-0.01em] hover:bg-sunk focus:bg-sunk focus:outline-none lg:w-56"
          />
          <span data-testid="save-status" className="px-1.5 text-[11px] text-ink-2">
            {status === 'loading' ? 'Opening…' : !id ? 'Not saved yet' : dirty ? 'Unsaved changes' : <span className="inline-flex items-center gap-1"><IconCheck size={12} /> Saved on this device</span>}
          </span>
        </div>
        <div className="flex items-center gap-0.5 lg:mx-auto">
          <IconButton label="Undo" shortcut="Ctrl Z" disabled={!canUndo} onClick={() => useEditor.getState().undo()} tipSide="bottom"><IconUndo /></IconButton>
          <IconButton label="Redo" shortcut="Ctrl ⇧ Z" disabled={!canRedo} onClick={() => useEditor.getState().redo()} tipSide="bottom"><IconRedo /></IconButton>
        </div>
        <div className="flex items-center gap-2">
          <label className="hidden items-center gap-2 text-[13px] text-ink-2 md:flex">
            Size
            <select value={size} onChange={(e) => resize(Number(e.target.value) as CursorSize)} aria-label="Cursor size"
              className="tnum h-8 rounded-sm border border-line-2 bg-surface px-2 text-[13px] text-ink">
              {SIZES.map((s) => <option key={s} value={s}>{s} px</option>)}
            </select>
          </label>
          <Button size="sm" onClick={() => save() && toast('Saved to My cursors.', { tone: 'ok' })} disabled={status !== 'ready'}>Save</Button>
          <Button size="sm" variant="primary" onClick={goApply} disabled={status !== 'ready'}>
            Apply <IconArrowRight size={16} />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Tool rail (desktop) */}
        <aside className="hidden w-14 shrink-0 flex-col items-center border-r border-line bg-surface py-2 lg:flex">
          <ToolRail />
        </aside>

        {/* Stage */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          <OptionsBar />
          {status === 'ready' ? <Canvas fitRef={fitRef} /> : (
            <div className="grid flex-1 place-items-center bg-sunk text-sm text-ink-2" role="status">Opening your cursor…</div>
          )}
          <div className={`pointer-events-none absolute bottom-3 left-3 items-center gap-0.5 rounded-sm border border-line-2 bg-surface p-0.5 [&>*]:pointer-events-auto ${sheet ? 'hidden lg:flex' : 'flex'}`}>
            <IconButton label="Zoom out" shortcut="−" onClick={() => zoomBy(-1)} tipSide="top" className="size-8"><IconMinus size={16} /></IconButton>
            <span className="tnum w-12 text-center text-xs text-ink-2" aria-live="polite">{zoomState ? `${zoomState * 100}%` : 'Fit'}</span>
            <IconButton label="Zoom in" shortcut="+" onClick={() => zoomBy(1)} tipSide="top" className="size-8"><IconPlus size={16} /></IconButton>
            <IconButton label="Fit to screen" shortcut="0" onClick={() => useEditor.getState().setZoom(null)} tipSide="top" className="size-8"><IconFit size={16} /></IconButton>
          </div>
        </main>

        {/* Properties (desktop) */}
        <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-line bg-surface lg:block" aria-label="Properties">
          {status === 'ready' && (<><ColorPanel /><HotspotPanel /><PreviewPanel /></>)}
        </aside>
      </div>

      {/* Touch layout: tools along the bottom, properties in a sheet */}
      <div className="shrink-0 border-t border-line bg-surface lg:hidden">
        {sheet && status === 'ready' && (
          <div className="max-h-[52dvh] overflow-y-auto border-b border-line" role="dialog" aria-label={sheet}>
            <div className="flex items-center justify-between px-4 pt-3">
              <span className="text-sm font-medium capitalize">{sheet}</span>
              <button type="button" onClick={() => setSheet(null)} className="text-sm text-ink-2">Done</button>
            </div>
            {sheet === 'colour' && <ColorPanel />}
            {sheet === 'hotspot' && (<><HotspotPanel /><SizePicker size={size} onPick={resize} /></>)}
            {sheet === 'preview' && <PreviewPanel compact />}
          </div>
        )}
        <div className="flex items-center gap-2 overflow-x-auto px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => setSheet(sheet === 'colour' ? null : 'colour')} aria-label="Colour"
            className="size-9 shrink-0 rounded-sm border border-line-2" style={{ background: `rgba(${color[0]},${color[1]},${color[2]},${color[3] / 255})` }} />
          <ToolRail orientation="horizontal" />
          <span aria-hidden className="mx-1 w-px self-stretch bg-line" />
          <IconButton label="Hotspot and size" onClick={() => setSheet(sheet === 'hotspot' ? null : 'hotspot')} active={sheet === 'hotspot'} tipSide="top"><IconSliders /></IconButton>
          <Button size="sm" onClick={() => setSheet(sheet === 'preview' ? null : 'preview')}>Preview</Button>
        </div>
      </div>
    </div>
  );
}

function SizePicker({ size, onPick }: { size: number; onPick: (n: CursorSize) => void }) {
  return (
    <section className="px-4 py-4">
      <h2 className="mb-3 text-xs font-medium tracking-[0.12em] text-ink-2 uppercase">Size</h2>
      <div className="grid grid-cols-4 gap-2">
        {SIZES.map((s) => (
          <button key={s} type="button" aria-pressed={s === size} onClick={() => onPick(s)}
            className={`tnum h-9 rounded-sm border text-sm ${s === size ? 'border-ink bg-ink text-paper' : 'border-line-2'}`}>{s}</button>
        ))}
      </div>
    </section>
  );
}

export { selectDirty };
