/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
// Builds the Chrome extension: draws its icons from the Nib mark, then zips extension/ into
// public/nib-chrome-extension.zip (served by the site for "Get the extension").
// Usage: node scripts/build-extension.cjs   (needs Playwright's Chromium and the `zip` CLI)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXT = path.join(ROOT, 'extension');
const OUT = path.join(ROOT, 'public', 'nib-chrome-extension.zip');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const s of [16, 32, 48, 128]) {
    const png = await p.evaluate((s) => {
      const c = document.createElement('canvas');
      c.width = c.height = s;
      const x = c.getContext('2d');
      x.fillStyle = '#f3f1ec';
      x.beginPath(); x.roundRect(0, 0, s, s, s * 0.22); x.fill();
      x.scale(s / 24, s / 24);
      x.fillStyle = '#151515';
      x.fill(new Path2D('M7 5.5 L7 20 L10.6 16.6 L13.1 22 L15.6 20.9 L13.1 15.5 L18 15.5 Z'));
      x.fillStyle = '#ff4f1a';
      x.fillRect(5.2, 3.6, 3.6, 3.6);
      return c.toDataURL('image/png').split(',')[1];
    }, s);
    fs.writeFileSync(path.join(EXT, 'icons', `${s}.png`), Buffer.from(png, 'base64'));
  }
  await b.close();
  fs.rmSync(OUT, { force: true });
  execFileSync('zip', ['-r', '-X', '-q', OUT, '.', '-x', '.*'], { cwd: EXT });
  console.log('wrote', path.relative(ROOT, OUT), fs.statSync(OUT).size, 'bytes');
})().catch((e) => { console.error(e); process.exit(1); });
