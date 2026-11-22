'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cursorCss, pngToBitmap } from '@/lib/cursor';
import { cssSnippet, macPack, pngFile, svgFile, triggerDownload, windowsPack, type Design } from '@/lib/export/packs';
import { infSafe } from '@/lib/export/formats';
import { detectPlatform, type Platform } from '@/lib/platform';
import { getDesign } from '@/lib/storage';
import { applyCursor } from '../AppliedCursor';
import { IconArrowRight, IconCheck, IconCursor, IconLock } from '../Icons';
import { Logo, Mark } from '../Logo';
import { toast } from '../Toast';
import { Button, ButtonLink, Eyebrow } from '../ui';
import { ArtChromeDevMode, ArtChromeLoad, ArtMacApply, ArtMacImport, ArtMousecape, ArtUnzip, ArtWinInstall, ArtWinPointers } from './StepArt';

type Choice = 'chrome' | 'mac' | 'windows' | 'files';
type State = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; design: Design; png: string };

function useDesign(): State {
  const [s, setS] = useState<State>({ status: 'loading' });
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    const d = id ? getDesign(id) : undefined;
    if (!d) { setS({ status: 'missing' }); return; } // eslint-disable-line react-hooks/set-state-in-effect -- reads browser storage once
    pngToBitmap(d.png).then((bmp) => setS({ status: 'ready', png: d.png, design: { id: d.id, name: d.name, bmp, hotspot: d.hotspot } }))
      .catch(() => setS({ status: 'missing' }));
  }, []);
  return s;
}

/** The extension marks the Nib page when it's installed (it runs before the page's own scripts). */
const extensionVersion = () => document.documentElement.dataset.nibExtension ?? null;

function sendToExtension(d: Design, png: string): Promise<boolean> {
  return new Promise((resolve) => {
    const done = (ok: boolean) => { window.removeEventListener('message', on); clearTimeout(t); resolve(ok); };
    const on = (e: MessageEvent) => { if (e.source === window && e.data?.type === 'nib:applied') done(!!e.data.ok); };
    const t = setTimeout(() => done(false), 2500);
    window.addEventListener('message', on);
    window.postMessage({ type: 'nib:apply', png, x: d.hotspot.x, y: d.hotspot.y, name: d.name }, window.location.origin);
  });
}

export function Apply() {
  const state = useDesign();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [ext, setExt] = useState<string | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const p = detectPlatform();
    const e = extensionVersion();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only detection after mount
    setPlatform(p);
    setExt(e);
    setChoice(e ? 'chrome' : p.os === 'mac' ? 'mac' : p.os === 'windows' ? 'windows' : p.os === 'mobile' ? 'files' : p.chromium ? 'chrome' : 'files');
  }, []);

  if (state.status === 'missing') {
    return (
      <main className="grid flex-1 place-items-center px-6">
        <div className="max-w-sm text-center">
          <Mark size={36} className="mx-auto" />
          <h1 className="mt-6 text-2xl font-medium tracking-[-0.03em]">We couldn’t find that cursor</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">It may have been deleted, or saved in a different browser. Designs are kept on the device where you made them.</p>
          <div className="mt-6 flex justify-center gap-2"><ButtonLink href="/cursors">My cursors</ButtonLink><ButtonLink href="/new" variant="primary">Start a new one</ButtonLink></div>
        </div>
      </main>
    );
  }
  if (state.status === 'loading' || !platform || !choice) {
    return <main className="grid flex-1 place-items-center text-sm text-ink-2" role="status">Getting your cursor ready…</main>;
  }

  const { design, png } = state;
  const mobile = platform.os === 'mobile';
  const forYou = (c: Choice) =>
    (c === 'mac' && platform.os === 'mac') || (c === 'windows' && platform.os === 'windows') || (c === 'chrome' && platform.chromium && !mobile);

  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Logo />
          <Link href={`/editor?id=${design.id}`} className="text-sm text-ink-2 hover:text-ink">← Back to editing</Link>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-[1200px] flex-1 gap-10 px-5 pt-10 pb-20 md:px-8 lg:grid-cols-[340px_1fr] lg:gap-16 lg:pt-14">
        <Specimen design={design} png={png} mobile={mobile} />
        <section>
          <Eyebrow className="mb-3">Step 3 of 3</Eyebrow>
          <h1 className="text-[36px] leading-[1.02] font-medium tracking-[-0.04em] md:text-[48px]">Where will you use it?</h1>
          {mobile && (
            <p className="mt-4 max-w-xl border-l-2 border-ink pl-3 text-[15px] leading-relaxed text-ink-2">
              Cursors are used on a computer. You can download the files here and move them across, or open Nib on your computer. Your designs are saved in this browser only.
            </p>
          )}
          <div role="radiogroup" aria-label="How to use your cursor" className="mt-8 border-t border-line">
            <Option id="chrome" choice={choice} onPick={setChoice} title="Use in my browser" sub="Chrome, Edge and other Chromium browsers. Every website, one click."
              badge={ext ? 'Extension ready' : undefined}>
              <ChromePanel ext={ext} applied={applied} onApply={async () => {
                const ok = await sendToExtension(design, png);
                if (!ok) { toast('The extension didn’t answer. Reload this page and try again.', { tone: 'error' }); return; }
                applyCursor({ png, hotspot: design.hotspot });
                setApplied(true);
              }} />
            </Option>
            <Option id="mac" choice={choice} onPick={setChoice} title="Download for Mac" sub="Everywhere on your Mac, with the free Mousecape app." badge={forYou('mac') ? 'Your computer' : undefined}>
              <Guide
                steps={[
                  { title: 'Install Mousecape', body: <>A free, open-source app. <a className="underline underline-offset-2" href="https://github.com/alexzielenski/Mousecape/releases" target="_blank" rel="noopener noreferrer">Get it on GitHub</a>.</>, art: <ArtMousecape /> },
                  { title: 'Import your cape', body: 'Unzip the download, then in Mousecape choose File › Import Cape.', art: <ArtMacImport /> },
                  { title: 'Double-click to apply', body: 'To keep it after a restart: Mousecape › Install Helper Tool.', art: <ArtMacApply name={design.name} /> },
                ]}
                note="macOS has no built-in way to use your own cursor image, so a helper app is needed. Mousecape is made by an independent developer, not by Nib."
                action={<Button variant="primary" size="lg" onClick={() => { const f = macPack(design); triggerDownload(f); toast(`Downloaded ${f.filename}`, { tone: 'ok' }); }}>Download for Mac</Button>}
              />
            </Option>
            <Option id="windows" choice={choice} onPick={setChoice} title="Download for Windows" sub="Everywhere on your PC. A .cur file plus a one-click installer." badge={forYou('windows') ? 'Your computer' : undefined}>
              <Guide
                steps={[
                  { title: 'Unzip the download', body: 'You’ll get pointer.cur, install.inf and a short read-me.', art: <ArtUnzip file={`${design.name}-windows.zip`} /> },
                  { title: 'Right-click install.inf › Install', body: 'On Windows 11, choose Show more options first. Allow the change.', art: <ArtWinInstall /> },
                  { title: 'Pick the scheme', body: `Mouse settings › Additional mouse settings › Pointers › “Nib - ${infSafe(design.name)}” › OK.`, art: <ArtWinPointers scheme={`Nib - ${infSafe(design.name)}`} /> },
                ]}
                note="Windows picks the size that matches your pointer-size setting, so larger designs show when that setting is larger. Animated .ani cursors come with animation frames, in a later update."
                action={<Button variant="primary" size="lg" onClick={() => { const f = windowsPack(design); triggerDownload(f); toast(`Downloaded ${f.filename}`, { tone: 'ok' }); }}>Download for Windows</Button>}
              />
            </Option>
            <Option id="files" choice={choice} onPick={setChoice} title="PNG or SVG" sub="For designers and websites.">
              <FilesPanel design={design} />
            </Option>
          </div>
        </section>
      </main>
    </>
  );
}

function Specimen({ design, png, mobile }: { design: Design; png: string; mobile: boolean }) {
  const size = design.bmp.w;
  const big = Math.min(256, size * Math.max(1, Math.floor(256 / size)));
  const k = big / size;
  return (
    <aside className="lg:sticky lg:top-10 lg:self-start">
      <div className="border border-line-2 bg-surface">
        <div data-own-cursor style={{ cursor: cursorCss(png, design.hotspot) }} className="relative grid aspect-square place-items-center checker">
          <span className="relative" style={{ width: big, height: big }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
            <img src={png} alt={`${design.name}, ${size} pixel cursor`} width={big} height={big} style={{ width: big, height: big, imageRendering: 'pixelated' }} />
            <span aria-hidden className="absolute border-2 border-accent" style={{ left: design.hotspot.x * k - 1, top: design.hotspot.y * k - 1, width: Math.max(6, k) + 2, height: Math.max(6, k) + 2 }} />
          </span>
          {!mobile && <span className="absolute bottom-2 left-3 text-[11px] text-ink-2">Point here to try it at real size</span>}
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <div className="min-w-0"><p className="truncate font-medium">{design.name}</p><p className="tnum text-xs text-ink-2">{size} × {size} px · hotspot {design.hotspot.x}, {design.hotspot.y}</p></div>
        </div>
      </div>
      {!mobile && (
        <button type="button" onClick={() => { applyCursor({ png, hotspot: design.hotspot }); toast('You’re wearing it on Nib.', { tone: 'ok' }); }}
          className="mt-3 flex items-center gap-2 text-sm text-ink-2 hover:text-ink"><IconCursor size={16} /> Or just wear it on Nib for now</button>
      )}
    </aside>
  );
}

function Option({ id, choice, onPick, title, sub, badge, children }: { id: Choice; choice: Choice; onPick: (c: Choice) => void; title: string; sub: string; badge?: string; children: ReactNode }) {
  const on = choice === id;
  return (
    <div className="border-b border-line">
      <button type="button" role="radio" aria-checked={on} onClick={() => onPick(id)} className="flex w-full items-center gap-4 py-5 text-left">
        <span aria-hidden className={`grid size-5 shrink-0 place-items-center rounded-full border ${on ? 'border-ink' : 'border-line-2'}`}>{on && <span className="size-2.5 rounded-full bg-ink" />}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-medium tracking-[-0.02em]">{title}</span>
            {badge && <span className="flex items-center gap-1.5 rounded-sm border border-line-2 px-1.5 py-0.5 text-[11px] text-ink-2"><span className="size-1.5 bg-accent" />{badge}</span>}
          </span>
          <span className="mt-0.5 block text-sm text-ink-2">{sub}</span>
        </span>
      </button>
      {on && <div className="rise pb-8 pl-9">{children}</div>}
    </div>
  );
}

function Guide({ steps, action, note }: { steps: { title: string; body: ReactNode; art: ReactNode }[]; action: ReactNode; note?: string }) {
  return (
    <div>
      {action}
      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title}>
            {s.art}
            <p className="mt-3 text-sm font-medium"><span className="tnum mr-1.5 text-ink-3">{i + 1}</span>{s.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{s.body}</p>
          </li>
        ))}
      </ol>
      {note && <p className="mt-5 max-w-2xl text-[13px] leading-relaxed text-ink-2">{note}</p>}
    </div>
  );
}

function ChromePanel({ ext, applied, onApply }: { ext: string | null; applied: boolean; onApply: () => void }) {
  if (applied) {
    return (
      <div className="rise flex items-start gap-3 rounded-sm border border-ink bg-surface p-4">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-paper"><IconCheck size={14} /></span>
        <div>
          <p className="font-medium">Done. Every website in this browser now uses your cursor.</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">Open any site to see it. Pages that were already open update straight away. Use the Nib button in the toolbar to turn it off or remove it. Chrome doesn’t let extensions change its own pages (Settings, the Web Store, the new-tab page).</p>
        </div>
      </div>
    );
  }
  if (ext) {
    return (
      <div>
        <Button variant="primary" size="lg" onClick={onApply}><IconCursor size={18} /> Use in my browser</Button>
        <p className="mt-3 flex items-center gap-2 text-[13px] text-ink-2"><IconLock size={14} /> The Nib extension only changes your cursor. It doesn’t read pages or send anything anywhere.</p>
      </div>
    );
  }
  return (
    <Guide
      steps={[
        { title: 'Download and unzip', body: 'A small folder with the Nib extension.', art: <ArtUnzip file="nib-chrome-extension.zip" /> },
        { title: 'Turn on Developer mode', body: <>Open <code className="rounded-[3px] bg-sunk px-1">chrome://extensions</code> and switch it on, top right.</>, art: <ArtChromeDevMode /> },
        { title: 'Load unpacked', body: 'Choose the unzipped folder, then come back here and reload.', art: <ArtChromeLoad /> },
      ]}
      note="Nib isn’t in the Chrome Web Store yet, so it’s installed by hand for now. Once it’s listed, this becomes one click. Chrome will say the extension can “read and change your data on all websites”: that’s the permission any extension needs to change the cursor on every site. Nib only uses it to add your cursor, and its code never reads pages or connects to the internet."
      action={
        <div className="flex flex-wrap items-center gap-3">
          <a href="/nib-chrome-extension.zip" download className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-ink px-5 text-[15px] font-medium text-paper hover:bg-[#2a2a2a]">Get the extension</a>
          <Button size="lg" onClick={() => window.location.reload()}>I’ve installed it <IconArrowRight size={16} /></Button>
        </div>
      }
    />
  );
}

function FilesPanel({ design }: { design: Design }) {
  const [kind, setKind] = useState<'png' | 'svg'>('png');
  const css = useMemo(() => cssSnippet(design, kind), [design, kind]);
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" size="lg" onClick={() => { const f = pngFile(design); triggerDownload(f); setKind('png'); toast(`Downloaded ${f.filename}`, { tone: 'ok' }); }}>Download PNG</Button>
        <Button size="lg" onClick={() => { const f = svgFile(design); triggerDownload(f); setKind('svg'); toast(`Downloaded ${f.filename}`, { tone: 'ok' }); }}>Download SVG</Button>
      </div>
      <p className="mt-5 mb-2 text-sm font-medium">Use it on a website</p>
      <div className="flex items-stretch overflow-hidden rounded-sm border border-line-2 bg-surface">
        <code data-testid="css-snippet" className="min-w-0 flex-1 overflow-x-auto px-3 py-2.5 font-mono text-[13px] whitespace-nowrap">{css}</code>
        <button type="button" className="border-l border-line-2 px-3 text-sm hover:bg-sunk"
          onClick={() => navigator.clipboard?.writeText(css).then(() => toast('Copied.', { tone: 'ok' }), () => toast('Couldn’t copy. Select the text instead.'))}>Copy</button>
      </div>
      <p className="mt-2 text-[13px] text-ink-2">The two numbers are your hotspot. Browsers accept cursors up to 128 × 128 px.</p>
    </div>
  );
}

