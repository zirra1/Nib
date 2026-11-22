'use client';
import type { Tool } from '@/lib/editorStore';
import { useEditor } from '@/lib/editorStore';
import {
  IconDropper, IconEllipse, IconEraser, IconFill, IconFlip, IconHotspot, IconLine, IconMove, IconPen, IconRect,
} from '../Icons';
import { IconButton } from '../ui';
import { flipH } from '@/lib/pixels';

export const TOOLS: { id: Tool; label: string; key: string; Icon: typeof IconPen }[] = [
  { id: 'pen', label: 'Pen', key: 'B', Icon: IconPen },
  { id: 'eraser', label: 'Eraser', key: 'E', Icon: IconEraser },
  { id: 'line', label: 'Line', key: 'L', Icon: IconLine },
  { id: 'rect', label: 'Rectangle', key: 'R', Icon: IconRect },
  { id: 'ellipse', label: 'Ellipse', key: 'O', Icon: IconEllipse },
  { id: 'fill', label: 'Fill', key: 'G', Icon: IconFill },
  { id: 'picker', label: 'Eyedropper', key: 'I', Icon: IconDropper },
  { id: 'move', label: 'Move', key: 'V', Icon: IconMove },
  { id: 'hotspot', label: 'Set hotspot', key: 'H', Icon: IconHotspot },
];

export function ToolRail({ orientation = 'vertical' }: { orientation?: 'vertical' | 'horizontal' }) {
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const vertical = orientation === 'vertical';
  return (
    <div role="toolbar" aria-label="Tools" aria-orientation={orientation} className={vertical ? 'flex flex-col gap-1' : 'flex gap-1'}>
      {TOOLS.map(({ id, label, key, Icon }, i) => (
        <div key={id} className={vertical ? 'contents' : 'contents'}>
          {(i === 2 || i === 5 || i === 8) && <span aria-hidden className={vertical ? 'mx-2 my-1 h-px bg-line' : 'mx-1 my-2 w-px self-stretch bg-line'} />}
          <IconButton label={label} shortcut={key} active={tool === id} onClick={() => setTool(id)} tipSide={vertical ? 'right' : 'top'}
            className={id === 'hotspot' && tool !== id ? 'text-accent-ink' : ''}>
            <Icon />
          </IconButton>
        </div>
      ))}
    </div>
  );
}

const HINT: Record<Tool, string> = {
  pen: 'Click or drag to paint. Hold Alt to pick a colour.',
  eraser: 'Drag to clear pixels.',
  line: 'Drag to draw. Shift snaps to 45°.',
  rect: 'Drag to draw. Shift makes a square.',
  ellipse: 'Drag to draw. Shift makes a circle.',
  fill: 'Click an area to fill it.',
  picker: 'Click a pixel to take its colour.',
  move: 'Drag to move the drawing. The hotspot moves with it.',
  hotspot: 'Click the pixel that should do the clicking.',
};

/** Contextual options for the active tool, above the canvas. */
export function OptionsBar() {
  const tool = useEditor((s) => s.tool);
  const brush = useEditor((s) => s.brush);
  const setBrush = useEditor((s) => s.setBrush);
  const fillShapes = useEditor((s) => s.fillShapes);
  const setFillShapes = useEditor((s) => s.setFillShapes);
  const hasBrush = tool === 'pen' || tool === 'eraser' || tool === 'line' || ((tool === 'rect' || tool === 'ellipse') && !fillShapes);
  return (
    <div className="flex h-11 shrink-0 items-center gap-4 overflow-x-auto border-b border-line bg-surface px-3 text-[13px] lg:px-4">
      <span className="font-medium whitespace-nowrap">{TOOLS.find((t) => t.id === tool)?.label}</span>
      {hasBrush && (
        <label className="flex items-center gap-2 whitespace-nowrap text-ink-2">
          Size
          <span className="inline-flex rounded-sm border border-line-2">
            {[1, 2, 3, 4].map((n) => (
              <button key={n} type="button" aria-pressed={brush === n} onClick={() => setBrush(n)}
                className={`tnum h-7 w-7 ${brush === n ? 'bg-ink text-paper' : 'hover:text-ink'}`}>{n}</button>
            ))}
          </span>
          <kbd className="hidden text-[11px] text-ink-3 xl:inline">[ ]</kbd>
        </label>
      )}
      {(tool === 'rect' || tool === 'ellipse') && (
        <label className="flex items-center gap-2 whitespace-nowrap text-ink-2">
          <input type="checkbox" checked={fillShapes} onChange={(e) => setFillShapes(e.target.checked)} className="size-4 accent-[var(--ink)]" />
          Filled
        </label>
      )}
      {tool === 'move' && <FlipButton />}
      <span className="ml-auto hidden whitespace-nowrap text-ink-2 md:inline">{HINT[tool]}</span>
    </div>
  );
}

function FlipButton() {
  return (
    <button type="button" className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-ink-2 hover:bg-sunk hover:text-ink"
      onClick={() => {
        const s = useEditor.getState(), d = s.history.present;
        s.apply({ bmp: flipH(d.bmp), hotspot: { x: d.bmp.w - 1 - d.hotspot.x, y: d.hotspot.y } });
      }}>
      <IconFlip size={16} /> Flip horizontally
    </button>
  );
}
