/** Builds the downloadable files from a design (browser only: uses canvas for PNG and resampling). */
import { bitmapToPng, resizeBitmap } from '../cursor';
import type { Bitmap } from '../pixels';
import { fromBase64, utf8, zip } from './binary';
import { encodeCape, encodeCur, encodeInstallInf, encodeSvg, fileSafe, infSafe, type Hotspot } from './formats';

export interface Design { name: string; bmp: Bitmap; hotspot: Hotspot; id: string }

const pngBytes = (b: Bitmap) => fromBase64(bitmapToPng(b).split(',')[1]);
const scaleHs = (h: Hotspot, k: number, n: number) => ({ x: Math.min(n - 1, Math.floor(h.x * k)), y: Math.min(n - 1, Math.floor(h.y * k)) });

export interface Download { filename: string; mime: string; data: Uint8Array | string }

export function pngFile(d: Design): Download {
  return { filename: `${fileSafe(d.name)}-${d.bmp.w}px.png`, mime: 'image/png', data: pngBytes(d.bmp) };
}

export function svgFile(d: Design): Download {
  return { filename: `${fileSafe(d.name)}.svg`, mime: 'image/svg+xml', data: encodeSvg(d.bmp, d.name) };
}

export function cssSnippet(d: Design, kind: 'png' | 'svg'): string {
  const f = kind === 'png' ? pngFile(d).filename : svgFile(d).filename;
  return `cursor: url("${f}") ${d.hotspot.x} ${d.hotspot.y}, auto;`;
}

/**
 * Windows: pointer.cur holds the design plus smaller standard sizes, so Windows can pick the one that
 * matches the pointer-size setting. install.inf registers it as a pointer scheme.
 */
export function windowsPack(d: Design): Download {
  const sizes = [32, 48, 64, 128].filter((s) => s <= d.bmp.w);
  if (!sizes.includes(d.bmp.w)) sizes.push(d.bmp.w);
  const images = sizes.map((s) => ({ bmp: s === d.bmp.w ? d.bmp : resizeBitmap(d.bmp, s), hotspot: scaleHs(d.hotspot, s / d.bmp.w, s) }));
  const name = infSafe(d.name);
  const readme = [
    `Nib cursor for Windows: ${name}`,
    '',
    '1. Unzip this folder.',
    '2. Right-click install.inf and choose Install (Windows 11: Show more options > Install). Allow the change.',
    `3. Open Settings > Bluetooth & devices > Mouse > Additional mouse settings > Pointers, choose the scheme "Nib - ${name}" and press OK.`,
    '',
    'Prefer not to run the installer? In the same Pointers tab select "Normal Select", press Browse, pick pointer.cur, then OK.',
    'Tip: Windows shows the size that matches your pointer-size setting (Settings > Accessibility > Mouse pointer and touch).',
    '',
    'To undo: Pointers tab > Scheme > Windows Default > OK.',
    '',
  ].join('\r\n');
  return {
    filename: `${fileSafe(d.name)}-windows.zip`,
    mime: 'application/zip',
    data: zip([
      { name: 'pointer.cur', data: encodeCur(images) },
      { name: 'install.inf', data: utf8(encodeInstallInf(d.name)) },
      { name: 'README.txt', data: utf8(readme) },
    ]),
  };
}

/** Mac: a Mousecape cape with 1× and 2× (Retina) images of the arrow. */
export function macPack(d: Design): Download {
  const x2 = resizeBitmap(d.bmp, d.bmp.w * 2);
  const reps = [bitmapToPng(d.bmp), bitmapToPng(x2)].map((u) => u.split(',')[1]);
  const cape = encodeCape({ name: d.name, id: `app.nib.${d.id}`, points: d.bmp.w, hotspot: d.hotspot, reps });
  const readme = [
    `Nib cursor for Mac: ${d.name}`,
    '',
    '1. Install Mousecape, a free open-source app: https://github.com/alexzielenski/Mousecape/releases',
    `2. Open Mousecape and choose File > Import Cape, then pick "${fileSafe(d.name)}.cape".`,
    '3. Double-click the cape in the list to apply it.',
    '',
    'To keep it after a restart, choose Mousecape > Install Helper Tool.',
    'To undo: in Mousecape choose Edit > Reset to Default.',
    '',
    'macOS has no built-in way to use your own cursor image, so a helper app is needed.',
    '',
  ].join('\n');
  return {
    filename: `${fileSafe(d.name)}-mac.zip`,
    mime: 'application/zip',
    data: zip([
      { name: `${fileSafe(d.name)}.cape`, data: utf8(cape) },
      { name: 'README.txt', data: utf8(readme) },
    ]),
  };
}

export function triggerDownload(f: Download) {
  const blob = new Blob([typeof f.data === 'string' ? f.data : new Uint8Array(f.data)], { type: f.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = f.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
