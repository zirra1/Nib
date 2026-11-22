/** Little-endian byte writer + CRC-32 + a minimal ZIP (stored) writer. No dependencies. */

export class Writer {
  private buf: Uint8Array;
  private view: DataView;
  length = 0;
  constructor(initial = 1024) { this.buf = new Uint8Array(initial); this.view = new DataView(this.buf.buffer); }
  private ensure(n: number) {
    if (this.length + n <= this.buf.length) return;
    const next = new Uint8Array(Math.max(this.buf.length * 2, this.length + n));
    next.set(this.buf);
    this.buf = next;
    this.view = new DataView(this.buf.buffer);
  }
  u8(v: number) { this.ensure(1); this.view.setUint8(this.length, v); this.length += 1; return this; }
  u16(v: number) { this.ensure(2); this.view.setUint16(this.length, v, true); this.length += 2; return this; }
  u32(v: number) { this.ensure(4); this.view.setUint32(this.length, v >>> 0, true); this.length += 4; return this; }
  i32(v: number) { this.ensure(4); this.view.setInt32(this.length, v, true); this.length += 4; return this; }
  ascii(s: string) { for (let i = 0; i < s.length; i++) this.u8(s.charCodeAt(i) & 0x7f); return this; }
  bytes(b: Uint8Array) { this.ensure(b.length); this.buf.set(b, this.length); this.length += b.length; return this; }
  /** Overwrites a u32 at an earlier position (for sizes known only later). */
  patchU32(at: number, v: number) { this.view.setUint32(at, v >>> 0, true); }
  result() { return this.buf.slice(0, this.length); }
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export const utf8 = (s: string) => new TextEncoder().encode(s);

export interface ZipEntry { name: string; data: Uint8Array }

/** ZIP with stored (uncompressed) entries; cursor files are tiny, and every OS unzips this. */
export function zip(entries: ZipEntry[], date = new Date()): Uint8Array {
  const w = new Writer(4096);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const central: { name: Uint8Array; crc: number; size: number; offset: number }[] = [];
  for (const e of entries) {
    const name = utf8(e.name), crc = crc32(e.data), offset = w.length;
    w.u32(0x04034b50).u16(20).u16(0x0800).u16(0).u16(dosTime).u16(dosDate)
      .u32(crc).u32(e.data.length).u32(e.data.length).u16(name.length).u16(0).bytes(name).bytes(e.data);
    central.push({ name, crc, size: e.data.length, offset });
  }
  const cdStart = w.length;
  for (const c of central) {
    w.u32(0x02014b50).u16(20).u16(20).u16(0x0800).u16(0).u16(dosTime).u16(dosDate)
      .u32(c.crc).u32(c.size).u32(c.size).u16(c.name.length).u16(0).u16(0).u16(0).u16(0).u32(0).u32(c.offset).bytes(c.name);
  }
  const cdSize = w.length - cdStart;
  w.u32(0x06054b50).u16(0).u16(0).u16(central.length).u16(central.length).u32(cdSize).u32(cdStart).u16(0);
  return w.result();
}

export function base64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function fromBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
