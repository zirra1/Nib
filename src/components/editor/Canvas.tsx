'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  TRANSPARENT, cloneBitmap, drawEllipse, drawLine, drawRect, floodFill, getPixel, sameBitmap, shift, stamp, type Bitmap,
} from '@/lib/pixels';
import { useEditor, type Tool } from '@/lib/editorStore';
import { toast } from '../Toast';

export const ZOOMS = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40];
const DRAW_CURSOR = 'crosshair';
const TOOL_CURSOR: Partial<Record<Tool, string>> = { move: 'move', picker: 'copy', hotspot: 'cell' };

interface Op { tool: Tool; base: Bitmap; work: Bitmap; sx: number; sy: number; lx: number; ly: number; hs: { x: number; y: number } }

/**
 * The drawing surface. Pixels are drawn on an offscreen canvas and scaled up with smoothing off,
 * so what you see is exactly what the cursor will be. In-progress strokes live in a ref and are
 * committed to history once, on pointer-up (one undo step per stroke).
 */
export function Canvas({ fitRef }: { fitRef: React.RefObject<(() => number) | null> }) {
  const doc = useEditor((s) => s.history.present);
  const tool = useEditor((s) => s.tool);
  const zoomState = useEditor((s) => s.zoom);
  const brush = useEditor((s) => s.brush);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const op = useRef<Op | null>(null);
  const hover = useRef<{ x: number; y: number } | null>(null);
  const [fit, setFit] = useState(8);
  const size = doc.bmp.w;
  const zoom = zoomState ?? fit;

  // Fit: the largest whole-number zoom that leaves breathing room around the canvas.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const pad = window.innerWidth < 1024 ? 32 : 96;
      const avail = Math.min(el.clientWidth - pad, el.clientHeight - pad);
      const z = Math.max(1, Math.min(40, Math.floor(avail / size)));
      setFit(z);
      return z;
    };
    fitRef.current = measure;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size, fitRef]);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const px = size * zoom;
    if (c.width !== Math.round(px * dpr)) { c.width = c.height = Math.round(px * dpr); }
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Checkerboard = transparent. Cell size tracks zoom so it reads as "nothing here" at any scale.
    const cell = Math.max(4, Math.min(zoom * 2, 12));
    for (let y = 0; y < px; y += cell) for (let x = 0; x < px; x += cell) {
      ctx.fillStyle = ((x / cell + y / cell) & 1) === 0 ? '#ffffff' : '#ecE9e2';
      ctx.fillRect(x, y, cell, cell);
    }
    const bmp = op.current?.work ?? doc.bmp;
    const off = document.createElement('canvas');
    off.width = off.height = size;
    off.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(bmp.data), size, size), 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, px, px);
    // Pixel grid once pixels are big enough to aim at; every 8th line slightly stronger.
    if (zoom >= 6) {
      ctx.lineWidth = 1 / dpr;
      for (let i = 1; i < size; i++) {
        ctx.strokeStyle = i % 8 === 0 ? 'rgba(21,21,21,0.16)' : 'rgba(21,21,21,0.07)';
        const p = Math.round(i * zoom * dpr) / dpr + 0.5 / dpr;
        ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, px); ctx.moveTo(0, p); ctx.lineTo(px, p); ctx.stroke();
      }
    }
    // Hover footprint of the brush.
    const h = hover.current;
    if (h && !op.current) {
      const n = tool === 'pen' || tool === 'eraser' || tool === 'line' || tool === 'rect' || tool === 'ellipse' ? brush : 1;
      const o = Math.floor((n - 1) / 2);
      ctx.strokeStyle = tool === 'hotspot' ? '#FF4F1A' : 'rgba(21,21,21,0.85)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect((h.x - o) * zoom + 0.75, (h.y - o) * zoom + 0.75, n * zoom - 1.5, n * zoom - 1.5);
    }
    // Hotspot: the one orange thing on the canvas. A square on the pixel, with ticks on the edges.
    const hs = op.current?.tool === 'move' ? op.current.hs : doc.hotspot;
    const m = Math.max(zoom, 6), cx = (hs.x + 0.5) * zoom, cy = (hs.y + 0.5) * zoom;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(cx - m / 2 - 1, cy - m / 2 - 1, m + 2, m + 2);
    ctx.strokeStyle = '#FF4F1A';
    ctx.strokeRect(cx - m / 2, cy - m / 2, m, m);
    ctx.fillStyle = '#FF4F1A';
    ctx.fillRect(cx - 1, 0, 2, 6);
    ctx.fillRect(0, cy - 1, 6, 2);
  }, [doc, size, zoom, tool, brush]);

  useEffect(() => { draw(); }, [draw]);

  const toPixel = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: Math.floor(((e.clientX - r.left) / r.width) * size), y: Math.floor(((e.clientY - r.top) / r.height) * size) };
  };
  const inside = (p: { x: number; y: number }) => p.x >= 0 && p.y >= 0 && p.x < size && p.y < size;

  function onDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    const s = useEditor.getState();
    const p = toPixel(e);
    if (!inside(p)) return;
    const t: Tool = e.altKey && (s.tool === 'pen' || s.tool === 'fill') ? 'picker' : s.tool;
    const cur = s.history.present;
    if (t === 'picker') {
      const c = getPixel(cur.bmp, p.x, p.y);
      if (c[3] === 0) toast('That pixel is transparent. Pick a painted one.');
      else { s.setColor([c[0], c[1], c[2], c[3]]); if (s.tool === 'picker') s.setTool(s.prevTool); }
      return;
    }
    if (t === 'hotspot') { s.apply({ bmp: cur.bmp, hotspot: p }); s.setTool(s.prevTool); return; }
    if (t === 'fill') {
      const work = cloneBitmap(cur.bmp);
      if (floodFill(work, p.x, p.y, s.color) > 0) { s.apply({ ...cur, bmp: work }); s.useColor(); }
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    const work = cloneBitmap(cur.bmp);
    op.current = { tool: t, base: cur.bmp, work, sx: p.x, sy: p.y, lx: p.x, ly: p.y, hs: cur.hotspot };
    if (t === 'pen' || t === 'eraser') stamp(work, p.x, p.y, t === 'eraser' ? TRANSPARENT : s.color, s.brush);
    else if (t !== 'move') shape(op.current, p.x, p.y, e.shiftKey);
    draw();
  }

  function shape(o: Op, x: number, y: number, constrain: boolean) {
    const s = useEditor.getState();
    o.work = cloneBitmap(o.base);
    let ex = x, ey = y;
    if (constrain) {
      const d = Math.max(Math.abs(x - o.sx), Math.abs(y - o.sy));
      if (o.tool === 'line') {
        // Snap to 0°, 45°, 90°.
        const ax = Math.abs(x - o.sx), ay = Math.abs(y - o.sy);
        if (ax > ay * 2) ey = o.sy; else if (ay > ax * 2) ex = o.sx; else { ex = o.sx + Math.sign(x - o.sx) * d; ey = o.sy + Math.sign(y - o.sy) * d; }
      } else { ex = o.sx + Math.sign(x - o.sx || 1) * d; ey = o.sy + Math.sign(y - o.sy || 1) * d; }
    }
    if (o.tool === 'line') drawLine(o.work, o.sx, o.sy, ex, ey, s.color, s.brush);
    if (o.tool === 'rect') drawRect(o.work, o.sx, o.sy, ex, ey, s.color, s.fillShapes, s.brush);
    if (o.tool === 'ellipse') drawEllipse(o.work, o.sx, o.sy, ex, ey, s.color, s.fillShapes, s.brush);
  }

  function onMove(e: React.PointerEvent) {
    const p = toPixel(e);
    const prev = hover.current;
    hover.current = inside(p) ? p : null;
    const o = op.current;
    if (!o) { if (prev?.x !== hover.current?.x || prev?.y !== hover.current?.y) draw(); return; }
    const s = useEditor.getState();
    if (o.tool === 'pen' || o.tool === 'eraser') {
      // Coalesced events keep fast strokes continuous.
      const evs = e.nativeEvent.getCoalescedEvents?.() ?? [];
      const pts = evs.length ? evs.map((ce) => toPixel({ clientX: ce.clientX, clientY: ce.clientY } as React.PointerEvent)) : [p];
      for (const q of pts) { drawLine(o.work, o.lx, o.ly, q.x, q.y, o.tool === 'eraser' ? TRANSPARENT : s.color, s.brush); o.lx = q.x; o.ly = q.y; }
    } else if (o.tool === 'move') {
      const dx = p.x - o.sx, dy = p.y - o.sy;
      o.work = shift(o.base, dx, dy);
      const hs0 = s.history.present.hotspot;
      o.hs = { x: Math.max(0, Math.min(size - 1, hs0.x + dx)), y: Math.max(0, Math.min(size - 1, hs0.y + dy)) };
    } else shape(o, p.x, p.y, e.shiftKey);
    draw();
  }

  function onUp() {
    const o = op.current;
    if (!o) return;
    op.current = null;
    const s = useEditor.getState();
    if (!sameBitmap(o.work, o.base)) {
      s.apply({ bmp: o.work, hotspot: o.tool === 'move' ? o.hs : s.history.present.hotspot });
      if (o.tool !== 'eraser' && o.tool !== 'move') s.useColor();
    } else draw();
  }

  return (
    <div ref={stageRef} className="relative min-h-0 flex-1 overflow-auto" style={{ background: 'radial-gradient(var(--line-2) 1px, transparent 1px) 0 0 / 16px 16px, var(--sunk)' }}>
      <div className="flex min-h-full min-w-full items-center justify-center p-4 lg:p-12" style={{ width: 'max-content', height: 'max-content' }}>
        <canvas
          ref={canvasRef}
          data-own-cursor
          data-testid="canvas"
          role="img"
          aria-label={`Drawing canvas, ${size} by ${size} pixels. Hotspot at ${doc.hotspot.x}, ${doc.hotspot.y}.`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={() => { if (!op.current) { hover.current = null; draw(); } }}
          style={{ width: size * zoom, height: size * zoom, cursor: TOOL_CURSOR[tool] ?? DRAW_CURSOR, touchAction: 'none', boxShadow: '0 0 0 1px var(--line-2)' }}
          className="block shrink-0 bg-white"
        />
      </div>
    </div>
  );
}
