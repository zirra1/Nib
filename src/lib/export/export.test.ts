import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createBitmap, setPixel, type Bitmap } from '../pixels';
import { crc32, zip, utf8, base64 } from './binary';
import { encodeAni, encodeCape, encodeCur, encodeInstallInf, encodeSvg, fileSafe, infSafe } from './formats';

const dir = mkdtempSync(join(tmpdir(), 'nib-export-'));
const py = (code: string, ...args: string[]) => execFileSync('python3', ['-I', '-c', code, ...args], { encoding: 'utf8' }).trim();

function sample(size: number): Bitmap {
  const b = createBitmap(size);
  for (let y = 0; y < size / 2; y++) for (let x = 0; x <= y; x++) setPixel(b, x + 2, y + 1, [255, 79, 26, 255]); // orange triangle
  setPixel(b, size - 1, size - 1, [0, 0, 255, 128]); // half-transparent blue corner
  return b;
}

describe('.cur', () => {
  const b32 = sample(32), b64 = sample(64);
  const cur = encodeCur([{ bmp: b32, hotspot: { x: 2, y: 1 } }, { bmp: b64, hotspot: { x: 4, y: 2 } }]);
  const file = join(dir, 'p.cur');
  writeFileSync(file, cur);

  it('directory header and hotspots', () => {
    const v = new DataView(cur.buffer);
    expect([v.getUint16(0, true), v.getUint16(2, true), v.getUint16(4, true)]).toEqual([0, 2, 2]);
    expect([cur[6], cur[7], v.getUint16(10, true), v.getUint16(12, true)]).toEqual([32, 32, 2, 1]);
    expect([cur[22], v.getUint16(26, true), v.getUint16(28, true)]).toEqual([64, 4, 2]);
  });

  it('is read correctly by an independent decoder (Pillow): format, sizes, colours', () => {
    const out = JSON.parse(py(`
import json, sys
from PIL import Image
im = Image.open(sys.argv[1]); im.load()
print(json.dumps({"fmt": im.format, "size": im.size, "tip": im.convert("RGB").getpixel((3, 2))}))`, file));
    expect(out.fmt).toBe('CUR');
    expect(out.size).toEqual([64, 64]); // Pillow opens the largest entry
    expect(out.tip).toEqual([255, 79, 26]);
  });

  it('alpha is exact (Pillow reads the same DIB as an icon, where it honours 32-bit alpha)', () => {
    const ico = cur.slice();
    const v = new DataView(ico.buffer);
    v.setUint16(2, 1, true); // type: icon
    for (let i = 0; i < 2; i++) { v.setUint16(6 + i * 16 + 4, 1, true); v.setUint16(6 + i * 16 + 6, 32, true); } // planes, bpp
    const f = join(dir, 'p.ico');
    writeFileSync(f, ico);
    const out = JSON.parse(py(`
import json, sys
from PIL import Image
im = Image.open(sys.argv[1]); im.size = (32, 32); im.load(); r = im.convert('RGBA')
print(json.dumps({"tip": r.getpixel((2, 1)), "empty": r.getpixel((30, 1)), "corner": r.getpixel((31, 31))}))`, f));
    expect(out).toEqual({ tip: [255, 79, 26, 255], empty: [0, 0, 0, 0], corner: [0, 0, 255, 128] });
  });
});

describe('.ani', () => {
  it('RIFF/ACON structure with one icon chunk per frame', () => {
    const f1 = [{ bmp: sample(32), hotspot: { x: 2, y: 1 } }];
    const ani = encodeAni([f1, f1, f1], 10);
    const v = new DataView(ani.buffer);
    const tag = (o: number) => String.fromCharCode(...ani.subarray(o, o + 4));
    expect(tag(0)).toBe('RIFF');
    expect(v.getUint32(4, true)).toBe(ani.length - 8);
    expect(tag(8)).toBe('ACON');
    expect(tag(12)).toBe('anih');
    expect(v.getUint32(20, true)).toBe(36); // cbSize
    expect(v.getUint32(24, true)).toBe(3); // frames
    expect(v.getUint32(48, true)).toBe(10); // jiffies
    expect(v.getUint32(52, true)).toBe(1); // AF_ICON
    expect(tag(56)).toBe('LIST');
    expect(v.getUint32(60, true)).toBe(ani.length - 64);
    expect(tag(64)).toBe('fram');
    let o = 68, icons = 0;
    while (o < ani.length) {
      expect(tag(o)).toBe('icon');
      const n = v.getUint32(o + 4, true);
      expect(v.getUint16(o + 8 + 2, true)).toBe(2); // each frame is a real .cur
      o += 8 + n + (n & 1);
      icons++;
    }
    expect(icons).toBe(3);
  });
});

describe('SVG', () => {
  it('rebuilds the exact pixels', () => {
    const b = sample(32);
    const svg = encodeSvg(b, 'A <test>');
    expect(svg).toContain('<title>A &lt;test&gt;</title>');
    expect(svg).toContain('shape-rendering="crispEdges"');
    const painted = new Set<string>();
    for (const m of svg.matchAll(/<path fill="([^"]+)"(?: fill-opacity="([^"]+)")? d="([^"]+)"/g)) {
      for (const r of m[3].matchAll(/M(\d+) (\d+)h(\d+)/g)) for (let i = 0; i < +r[3]; i++) painted.add(`${+r[1] + i},${r[2]}`);
    }
    let expected = 0;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (b.data[(y * 32 + x) * 4 + 3]) { expected++; expect(painted.has(`${x},${y}`)).toBe(true); }
    expect(painted.size).toBe(expected);
    expect(svg).toContain('fill-opacity="0.502"');
  });
});

describe('Mousecape .cape', () => {
  it('is a valid property list with the arrow cursor, hotspot and PNG data', () => {
    const png = base64(utf8('fake-png-bytes'));
    const cape = encodeCape({ name: 'Mine & yours', id: 'app.nib.abc', points: 32, hotspot: { x: 3, y: 2 }, reps: [png, png] });
    const file = join(dir, 'c.cape');
    writeFileSync(file, cape);
    const out = JSON.parse(py(`
import json, plistlib, sys
d = plistlib.load(open(sys.argv[1], 'rb'))
a = d["Cursors"]["com.apple.coregraphics.Arrow"]
print(json.dumps({"name": d["CapeName"], "hidpi": d["HiDPI"], "x": a["HotSpotX"], "y": a["HotSpotY"], "w": a["PointsWide"], "n": len(a["Representations"]), "rep": a["Representations"][0].decode()}))`, file));
    expect(out).toEqual({ name: 'Mine & yours', hidpi: true, x: 3, y: 2, w: 32, n: 2, rep: 'fake-png-bytes' });
  });
});

describe('ZIP', () => {
  it('is readable by a standard unzip with intact contents', () => {
    const z = zip([{ name: 'a.txt', data: utf8('hello') }, { name: 'dir/b.bin', data: new Uint8Array([0, 1, 2, 255]) }]);
    const file = join(dir, 'z.zip');
    writeFileSync(file, z);
    const out = JSON.parse(py(`
import json, sys, zipfile
z = zipfile.ZipFile(sys.argv[1])
print(json.dumps({"bad": z.testzip(), "names": z.namelist(), "a": z.read("a.txt").decode(), "b": list(z.read("dir/b.bin"))}))`, file));
    expect(out).toEqual({ bad: null, names: ['a.txt', 'dir/b.bin'], a: 'hello', b: [0, 1, 2, 255] });
  });
  it('crc32 matches the standard check value', () => {
    expect(crc32(utf8('123456789'))).toBe(0xcbf43926);
  });
});

describe('Windows installer', () => {
  it('sanitises the name and points the normal pointer at the cursor', () => {
    expect(infSafe('My "evil"\r\n[Strings] name%')).toBe('My evilStrings name');
    const inf = encodeInstallInf('Pointy');
    expect(inf).toContain('[DefaultInstall]');
    expect(inf).toContain('CUR_DIR     = "Cursors\\Nib - Pointy"');
    expect(inf).toContain('HKCU,"Control Panel\\Cursors",Arrow,0x00020000,"%10%\\%CUR_DIR%\\%pointer%"');
    expect(inf.split('\r\n').length).toBeGreaterThan(10); // CRLF line endings for Windows tools
    const scheme = inf.match(/Schemes","%SCHEME_NAME%",,"([^"]*)"/)![1];
    expect(scheme.split(',')).toHaveLength(17);
  });
  it('file names are safe', () => {
    expect(fileSafe('My Heart!! / ../x')).toBe('my-heart-x');
    expect(fileSafe('***')).toBe('cursor');
  });
});
