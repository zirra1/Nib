/**
 * Cursor file formats, written from scratch:
 *  - Windows .cur  (ICO container, type 2, hotspot in the directory entry, 32-bit BGRA DIB + AND mask)
 *  - Windows .ani  (RIFF "ACON": anih header + frames, each frame a complete .cur)
 *  - SVG           (pixel-exact; one path per colour, crisp edges)
 *  - Mousecape .cape (macOS; XML property list with PNG representations)
 *  - install.inf   (Windows cursor scheme installer: right-click → Install)
 */
import type { Bitmap } from '../pixels';
import { Writer } from './binary';

export interface Hotspot { x: number; y: number }
export interface CurImage { bmp: Bitmap; hotspot: Hotspot }

// ---------------------------------------------------------------- .cur
export function encodeCur(images: CurImage[]): Uint8Array {
  if (!images.length) throw new Error('No images');
  const dibs = images.map(({ bmp }) => dib(bmp));
  const w = new Writer(256 + dibs.reduce((a, d) => a + d.length, 0));
  w.u16(0).u16(2).u16(images.length);
  let offset = 6 + 16 * images.length;
  images.forEach(({ bmp, hotspot }, i) => {
    w.u8(bmp.w >= 256 ? 0 : bmp.w).u8(bmp.h >= 256 ? 0 : bmp.h).u8(0).u8(0)
      .u16(clamp(hotspot.x, bmp.w)).u16(clamp(hotspot.y, bmp.h)).u32(dibs[i].length).u32(offset);
    offset += dibs[i].length;
  });
  dibs.forEach((d) => w.bytes(d));
  return w.result();
}

const clamp = (v: number, n: number) => Math.max(0, Math.min(n - 1, Math.round(v)));

/** 32 bpp bottom-up DIB with a 1 bpp AND mask (set where the pixel is fully transparent). */
function dib(b: Bitmap): Uint8Array {
  const maskRow = Math.ceil(b.w / 32) * 4;
  const xor = b.w * b.h * 4, and = maskRow * b.h;
  const w = new Writer(40 + xor + and);
  w.u32(40).i32(b.w).i32(b.h * 2).u16(1).u16(32).u32(0).u32(xor + and).i32(0).i32(0).u32(0).u32(0);
  for (let y = b.h - 1; y >= 0; y--) for (let x = 0; x < b.w; x++) {
    const i = (y * b.w + x) * 4;
    w.u8(b.data[i + 2]).u8(b.data[i + 1]).u8(b.data[i]).u8(b.data[i + 3]);
  }
  for (let y = b.h - 1; y >= 0; y--) {
    const row = new Uint8Array(maskRow);
    for (let x = 0; x < b.w; x++) if (b.data[(y * b.w + x) * 4 + 3] === 0) row[x >> 3] |= 0x80 >> (x & 7);
    w.bytes(row);
  }
  return w.result();
}

// ---------------------------------------------------------------- .ani
/** `jiffies`: frame duration in 1/60 s. Each frame is a full .cur (it may hold several sizes). */
export function encodeAni(frames: CurImage[][], jiffies = 6): Uint8Array {
  if (!frames.length) throw new Error('No frames');
  const curs = frames.map(encodeCur);
  const w = new Writer(1024);
  w.ascii('RIFF');
  const riffSize = w.length; w.u32(0);
  w.ascii('ACON');
  w.ascii('anih').u32(36).u32(36).u32(frames.length).u32(frames.length).u32(0).u32(0).u32(0).u32(0).u32(jiffies).u32(1); // AF_ICON
  w.ascii('LIST');
  const listSize = w.length; w.u32(0);
  w.ascii('fram');
  for (const c of curs) {
    w.ascii('icon').u32(c.length).bytes(c);
    if (c.length & 1) w.u8(0);
  }
  w.patchU32(listSize, w.length - listSize - 4);
  w.patchU32(riffSize, w.length - 8);
  return w.result();
}

// ---------------------------------------------------------------- SVG
/** Pixel-exact SVG: horizontal runs of equal colour merged into one path per colour. */
export function encodeSvg(b: Bitmap, title = 'Cursor'): string {
  const paths = new Map<string, string[]>();
  for (let y = 0; y < b.h; y++) {
    let x = 0;
    while (x < b.w) {
      const i = (y * b.w + x) * 4;
      const a = b.data[i + 3];
      if (a === 0) { x++; continue; }
      const key = `${b.data[i]},${b.data[i + 1]},${b.data[i + 2]},${a}`;
      let run = 1;
      while (x + run < b.w) {
        const j = (y * b.w + x + run) * 4;
        if (`${b.data[j]},${b.data[j + 1]},${b.data[j + 2]},${b.data[j + 3]}` !== key) break;
        run++;
      }
      (paths.get(key) ?? paths.set(key, []).get(key)!).push(`M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  }
  const esc = title.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);
  const body = [...paths].map(([k, d]) => {
    const [r, g, bl, a] = k.split(',').map(Number);
    const hex = '#' + [r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('');
    return `<path fill="${hex}"${a < 255 ? ` fill-opacity="${+(a / 255).toFixed(3)}"` : ''} d="${d.join('')}"/>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${b.w}" height="${b.h}" viewBox="0 0 ${b.w} ${b.h}" shape-rendering="crispEdges">\n<title>${esc}</title>\n${body}\n</svg>\n`;
}

// ---------------------------------------------------------------- Mousecape (.cape)
const xml = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!);

/**
 * `reps`: base64 PNGs of the same cursor at 1× and 2× (points = 1× pixel size).
 * Replaces the standard arrow (com.apple.coregraphics.Arrow).
 */
export function encodeCape(o: { name: string; id: string; points: number; hotspot: Hotspot; reps: string[] }): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Author</key>
	<string>Nib</string>
	<key>CapeName</key>
	<string>${xml(o.name)}</string>
	<key>CapeVersion</key>
	<real>1</real>
	<key>Cloud</key>
	<false/>
	<key>Cursors</key>
	<dict>
		<key>com.apple.coregraphics.Arrow</key>
		<dict>
			<key>FrameCount</key>
			<integer>1</integer>
			<key>FrameDuration</key>
			<real>1</real>
			<key>HotSpotX</key>
			<real>${o.hotspot.x}</real>
			<key>HotSpotY</key>
			<real>${o.hotspot.y}</real>
			<key>PointsHigh</key>
			<real>${o.points}</real>
			<key>PointsWide</key>
			<real>${o.points}</real>
			<key>Representations</key>
			<array>
${o.reps.map((r) => `				<data>${r}</data>`).join('\n')}
			</array>
		</dict>
	</dict>
	<key>HiDPI</key>
	<${o.reps.length > 1}/>
	<key>Identifier</key>
	<string>${xml(o.id)}</string>
	<key>MinimumVersion</key>
	<real>2</real>
	<key>Version</key>
	<real>2</real>
</dict>
</plist>
`;
}

// ---------------------------------------------------------------- Windows install.inf
/** Safe for INF strings and folder names: letters, digits, spaces, dashes and underscores only. */
export function infSafe(name: string): string {
  return name.replace(/[^A-Za-z0-9 _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40) || 'My cursor';
}

/**
 * Installs pointer.cur into C:\Windows\Cursors\Nib - <name>, registers a pointer scheme of that name and
 * makes it the normal pointer. Windows asks for administrator approval (it writes to the Windows folder).
 */
export function encodeInstallInf(name: string): string {
  const n = infSafe(name);
  // Scheme value: 17 comma-separated slots; the first is "Normal Select". Empty slots keep Windows' defaults.
  const slots = ['%10%\\%CUR_DIR%\\%pointer%', ...Array(16).fill('')].join(',');
  return [
    '; Nib cursor installer',
    '; Right-click this file and choose "Install" (on Windows 11: Show more options > Install).',
    '',
    '[Version]',
    'signature="$CHICAGO$"',
    '',
    '[DefaultInstall]',
    'CopyFiles = Scheme.Cur',
    'AddReg    = Scheme.Reg',
    '',
    '[DestinationDirs]',
    'Scheme.Cur = 10,"%CUR_DIR%"',
    '',
    '[Scheme.Reg]',
    `HKCU,"Control Panel\\Cursors\\Schemes","%SCHEME_NAME%",,"${slots}"`,
    'HKCU,"Control Panel\\Cursors",,0x00020000,"%SCHEME_NAME%"',
    'HKCU,"Control Panel\\Cursors",Arrow,0x00020000,"%10%\\%CUR_DIR%\\%pointer%"',
    '',
    '[Scheme.Cur]',
    'pointer.cur',
    '',
    '[Strings]',
    `CUR_DIR     = "Cursors\\Nib - ${n}"`,
    `SCHEME_NAME = "Nib - ${n}"`,
    'pointer     = "pointer.cur"',
    '',
  ].join('\r\n');
}

/** Safe file name for downloads. */
export const fileSafe = (name: string) => name.replace(/[^A-Za-z0-9 _-]/g, '').trim().replace(/\s+/g, '-').toLowerCase().slice(0, 40) || 'cursor';
