/**
 * Small, drawn illustrations for the 3-step install guides. They're simplified diagrams of the real
 * screens (not screenshots), so they stay readable at this size and don't go stale with every OS update.
 * The orange square marks the one thing to click, the same role it plays as the hotspot.
 */
import type { ReactNode } from 'react';

const Frame = ({ children }: { children: ReactNode }) => (
  <div aria-hidden className="relative grid h-[92px] place-items-center overflow-hidden rounded-sm border border-line bg-paper text-[10px] text-ink-2">{children}</div>
);
const Click = ({ className = '' }: { className?: string }) => <span className={`absolute size-2 bg-accent ${className}`} />;

export function ArtUnzip({ file }: { file: string }) {
  return (
    <Frame>
      <div className="flex items-center gap-3">
        <span className="flex flex-col items-center gap-1"><span className="grid h-9 w-7 place-items-center rounded-[3px] border border-line-2 bg-surface text-[8px] font-medium">ZIP</span><span className="max-w-20 truncate">{file}</span></span>
        <span className="text-ink-3">→</span>
        <span className="flex flex-col items-center gap-1"><span className="relative h-7 w-9 rounded-[3px] bg-[#e3ddd0]"><span className="absolute -top-1 left-0 h-2 w-4 rounded-t-[2px] bg-[#e3ddd0]" /></span>folder</span>
      </div>
    </Frame>
  );
}

export function ArtChromeDevMode() {
  return (
    <Frame>
      <div className="w-[86%] rounded-[4px] border border-line-2 bg-surface">
        <div className="flex items-center justify-between border-b border-line px-2 py-1"><span className="font-medium text-ink">Extensions</span>
          <span className="relative flex items-center gap-1">Developer mode <span className="h-2.5 w-5 rounded-full bg-ink" /><Click className="-top-1.5 -right-2" /></span></div>
        <div className="px-2 py-1.5 text-ink-3">chrome://extensions</div>
      </div>
    </Frame>
  );
}

export function ArtChromeLoad() {
  return (
    <Frame>
      <div className="w-[86%] rounded-[4px] border border-line-2 bg-surface px-2 py-2">
        <span className="relative inline-block rounded-[3px] border border-line-2 px-2 py-0.5 text-ink">Load unpacked<Click className="-top-1 -right-1" /></span>
        <span className="ml-1.5 inline-block rounded-[3px] border border-line px-2 py-0.5 text-ink-3">Pack</span>
        <div className="mt-1.5 text-ink-3">then pick the unzipped folder</div>
      </div>
    </Frame>
  );
}

export function ArtWinInstall() {
  return (
    <Frame>
      <div className="flex items-start gap-2">
        <span className="mt-1 flex flex-col items-center gap-1"><span className="h-7 w-6 rounded-[2px] border border-line-2 bg-surface" />install.inf</span>
        <div className="w-28 rounded-[4px] border border-line-2 bg-surface py-1 shadow-[0_1px_0_var(--line)]">
          <div className="px-2 py-0.5 text-ink-3">Open</div>
          <div className="relative bg-sunk px-2 py-0.5 font-medium text-ink">Install<Click className="top-1 -right-1" /></div>
          <div className="px-2 py-0.5 text-ink-3">Copy</div>
        </div>
      </div>
    </Frame>
  );
}

export function ArtWinPointers({ scheme }: { scheme: string }) {
  return (
    <Frame>
      <div className="w-[86%] rounded-[4px] border border-line-2 bg-surface">
        <div className="flex gap-2 border-b border-line px-2 py-1"><span className="text-ink-3">Buttons</span><span className="font-medium text-ink underline underline-offset-2">Pointers</span><span className="text-ink-3">Options</span></div>
        <div className="flex items-center gap-2 px-2 py-1.5">Scheme
          <span className="relative flex-1 truncate rounded-[3px] border border-line-2 px-1.5 py-0.5 text-ink">{scheme} ▾<Click className="-top-1 -right-1" /></span>
        </div>
      </div>
    </Frame>
  );
}

export function ArtMousecape() {
  return (
    <Frame>
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-[8px] border border-line-2 bg-surface text-[15px] text-ink">⌖</span>
        <span className="flex flex-col"><span className="font-medium text-ink">Mousecape</span><span>free · open source</span></span>
      </div>
    </Frame>
  );
}

export function ArtMacImport() {
  return (
    <Frame>
      <div className="w-32 rounded-[4px] border border-line-2 bg-surface py-1">
        <div className="px-2 py-0.5 font-medium text-ink">File</div>
        <div className="px-2 py-0.5 text-ink-3">New Cape</div>
        <div className="relative bg-sunk px-2 py-0.5 text-ink">Import Cape…<Click className="top-1 -right-1" /></div>
      </div>
    </Frame>
  );
}

export function ArtMacApply({ name }: { name: string }) {
  return (
    <Frame>
      <div className="w-[86%] rounded-[4px] border border-line-2 bg-surface py-1">
        <div className="px-2 py-0.5 text-ink-3">Default</div>
        <div className="relative bg-sunk px-2 py-0.5 font-medium text-ink truncate">{name}<Click className="top-1 -right-1" /></div>
        <div className="px-2 py-0.5 text-[9px] text-ink-3">double-click to apply</div>
      </div>
    </Frame>
  );
}
