/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
// Milestone 2 checks: downloads (validated by independent readers), the Chrome extension end to end,
// and OS detection. Usage: node e2e/apply.cjs [baseUrl] [screenshotDir]
const { chromium, devices } = require('playwright');
const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:3100';
const SHOTS = process.argv[3];
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'nib-apply-'));
let failed = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) failed++; };
const shot = (p, name, o = {}) => SHOTS && p.screenshot({ path: `${SHOTS}/${name}.png`, ...o });
const py = (code, ...args) => JSON.parse(execFileSync('python3', ['-I', '-c', code, ...args], { encoding: 'utf8' }));

async function makeDesign(p, template = 'heart', size = 64) {
  await p.goto(`${BASE}/editor?template=${template}&size=${size}`);
  await p.locator('[data-testid=canvas]').waitFor();
  await p.getByRole('button', { name: /^Apply/ }).click();
  await p.waitForURL(/\/apply\?id=/);
  await p.getByRole('heading', { name: 'Where will you use it?' }).waitFor();
}
async function download(p, button) {
  const [d] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: button }).click()]);
  const file = path.join(TMP, d.suggestedFilename());
  await d.saveAs(file);
  return file;
}

(async () => {
  // A plain "other website" to prove the extension changes the cursor outside Nib.
  fs.writeFileSync(path.join(TMP, 'index.html'), '<!doctype html><title>Some site</title><h1>Some other website</h1><p><a href="#">A link</a></p><input>');
  const site = spawn('python3', ['-m', 'http.server', '3299', '--bind', '127.0.0.1'], { cwd: TMP, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));

  const b = await chromium.launch();

  // ---- Downloads, on a Mac and on Windows (OS detection picks the option for you).
  const mac = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' });
  let p = await mac.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await makeDesign(p, 'heart', 64);
  ok((await p.getByRole('radio', { name: /Download for Mac/ }).getAttribute('aria-checked')) === 'true', 'Mac visitor: "Download for Mac" is preselected');
  ok((await p.getByText('Your computer').count()) === 1, 'Mac visitor: the Mac option is marked as their computer');
  await shot(p, 'apply-mac');
  const macZip = await download(p, 'Download for Mac');
  const cape = py(`
import json, plistlib, sys, zipfile, io
from PIL import Image
z = zipfile.ZipFile(sys.argv[1]); names = z.namelist()
d = plistlib.loads(z.read([n for n in names if n.endswith('.cape')][0]))
a = d["Cursors"]["com.apple.coregraphics.Arrow"]
sizes = [Image.open(io.BytesIO(r)).size for r in a["Representations"]]
print(json.dumps({"names": names, "bad": z.testzip(), "name": d["CapeName"], "hs": [a["HotSpotX"], a["HotSpotY"]], "pts": a["PointsWide"], "sizes": sizes}))`, macZip);
  ok(cape.bad === null && cape.names.includes('README.txt'), `Mac zip is valid (${cape.names.join(', ')})`);
  ok(cape.name === 'My heart' && cape.pts === 64 && JSON.stringify(cape.sizes) === '[[64,64],[128,128]]', 'Mac cape: name, 64 pt, 1× and 2× PNGs');
  ok(cape.hs[0] === 32 && cape.hs[1] === 32, 'Mac cape: hotspot carried over');

  const win = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' });
  p = await win.newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  await makeDesign(p, 'heart', 64);
  ok((await p.getByRole('radio', { name: /Download for Windows/ }).getAttribute('aria-checked')) === 'true', 'Windows visitor: "Download for Windows" is preselected');
  await shot(p, 'apply-windows');
  const winZip = await download(p, 'Download for Windows');
  const w = py(`
import json, sys, zipfile, io, struct
from PIL import Image
z = zipfile.ZipFile(sys.argv[1]); cur = z.read('pointer.cur')
n = struct.unpack('<H', cur[4:6])[0]
entries = [struct.unpack('<BBBBHHII', cur[6+16*i:22+16*i]) for i in range(n)]
im = Image.open(io.BytesIO(cur))
inf = z.read('install.inf').decode()
print(json.dumps({"names": z.namelist(), "bad": z.testzip(), "type": struct.unpack('<H', cur[2:4])[0],
  "sizes": [e[0] for e in entries], "hs": [[e[4], e[5]] for e in entries], "pillow": im.format, "scheme": "Nib - My heart" in inf}))`, winZip);
  ok(w.bad === null && ['pointer.cur', 'install.inf', 'README.txt'].every((n) => w.names.includes(n)), 'Windows zip: pointer.cur, install.inf, README.txt');
  ok(w.type === 2 && w.pillow === 'CUR' && JSON.stringify(w.sizes) === '[32,48,64]', 'Windows .cur: real cursor file with 32, 48 and 64 px images');
  ok(JSON.stringify(w.hs) === '[[16,16],[24,24],[32,32]]', 'Windows .cur: hotspot scaled for every size');
  ok(w.scheme, 'install.inf registers the "Nib - My heart" scheme');

  await p.getByRole('radio', { name: /PNG or SVG/ }).click();
  const pngPath = await download(p, 'Download PNG');
  const svgPath = await download(p, 'Download SVG');
  const img = py(`
import json, sys
from PIL import Image
im = Image.open(sys.argv[1]); print(json.dumps({"fmt": im.format, "size": im.size, "mode": im.mode}))`, pngPath);
  ok(img.fmt === 'PNG' && img.size[0] === 64 && img.mode === 'RGBA', 'PNG: 64 px with transparency');
  const svg = fs.readFileSync(svgPath, 'utf8');
  ok(svg.startsWith('<svg') && svg.includes('viewBox="0 0 64 64"') && svg.includes('<path'), 'SVG: pixel-exact vector file');
  ok((await p.getByTestId('css-snippet').innerText()).includes('cursor: url("my-heart.svg") 32 32, auto;'), 'CSS snippet follows the last file and uses the hotspot');
  await shot(p, 'apply-files');
  await mac.close(); await win.close();

  // ---- The Chrome extension, loaded for real.
  const ext = path.join(__dirname, '..', 'extension');
  const ctx = await chromium.launchPersistentContext(path.join(TMP, 'profile'), {
    headless: true, channel: 'chromium', viewport: { width: 1440, height: 900 }, // extensions need the new headless mode
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  p = ctx.pages()[0] ?? await ctx.newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  let clicks = 0;
  await p.goto(BASE + '/');
  await p.getByRole('link', { name: 'Start creating' }).first().click(); clicks++;
  await p.getByRole('link', { name: 'Classic', exact: true }).click(); clicks++;
  await p.getByRole('button', { name: /^Apply/ }).click(); clicks++;
  await p.waitForURL(/\/apply\?id=/);
  await p.getByRole('heading', { name: 'Where will you use it?' }).waitFor();
  const readyCount = await p.getByText('Extension ready').count();
  ok(readyCount === 1, 'extension detected on the Apply screen (' + readyCount + ')');
  await p.getByRole('button', { name: 'Use in my browser' }).click(); clicks++;
  await p.getByText(/Every website in this browser now uses your cursor/).waitFor();
  ok(true, `cursor applied to the whole browser in ${clicks} clicks`);
  await shot(p, 'apply-chrome-done');
  const other = await ctx.newPage();
  await other.goto('http://127.0.0.1:3299/');
  await other.waitForTimeout(300);
  const c = await other.evaluate(() => ({ h1: getComputedStyle(document.querySelector('h1')).cursor, a: getComputedStyle(document.querySelector('a')).cursor, input: getComputedStyle(document.querySelector('input')).cursor }));
  ok(c.h1.includes('data:image/png') && c.a.includes('data:image/png'), 'another website now uses the cursor (text and links)');
  ok(!c.input.includes('data:image/png'), 'text fields keep the text cursor');
  // Turning it off in the popup removes it everywhere. (The extension has no background worker, so read its id from chrome://extensions.)
  const t = await ctx.newPage();
  await t.goto('chrome://extensions/');
  const idFromPopup = await t.evaluate(() => {
    const list = document.querySelector('extensions-manager')?.shadowRoot?.querySelector('extensions-item-list');
    return list?.shadowRoot?.querySelector('extensions-item')?.id ?? null;
  });
  await t.close();
  ok(!!idFromPopup, 'extension id found');
  if (idFromPopup) {
    const pop = await ctx.newPage();
    await pop.goto(`chrome-extension://${idFromPopup}/popup.html`);
    ok((await pop.locator('#name').innerText()) === 'My classic', 'popup shows the cursor you applied');
    await shot(pop, 'extension-popup', { clip: { x: 0, y: 0, width: 300, height: 260 } });
    await pop.locator('#enabled').click();
    await other.waitForTimeout(300);
    ok(!(await other.evaluate(() => getComputedStyle(document.querySelector('h1')).cursor)).includes('data:image'), 'switching it off in the popup restores the normal cursor on open pages');
    await pop.close();
  }
  // A random site can't push a cursor into the extension.
  await other.evaluate(() => window.postMessage({ type: 'nib:apply', png: 'data:image/png;base64,AAAA', x: 0, y: 0 }, '*'));
  await other.waitForTimeout(200);
  ok((await other.evaluate(() => document.documentElement.dataset.nibExtension)) === undefined, 'the extension only talks to the Nib website');
  await ctx.close();

  // ---- Phone: explains that cursors are applied on a computer; files preselected.
  const ph = await b.newContext({ ...devices['iPhone 13'] });
  p = await ph.newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  await makeDesign(p, 'star', 32);
  ok(await p.getByText(/Cursors are used on a computer/).isVisible(), 'phone: explains cursors are applied on a computer');
  ok((await p.getByRole('radio', { name: /PNG or SVG/ }).getAttribute('aria-checked')) === 'true', 'phone: files option preselected');
  ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, 'phone: no horizontal scroll on Apply');
  await shot(p, 'm-apply', { fullPage: true });
  await ph.close();

  // ---- Missing design.
  const x = await b.newContext();
  p = await x.newPage();
  await p.goto(BASE + '/apply?id=nope');
  ok((await p.getByRole('heading', { name: 'We couldn’t find that cursor' }).count()) === 1, 'unknown design on Apply shows a helpful error');
  ok(errs.length === 0, 'no page errors ' + errs.join(' | '));

  await b.close();
  site.kill();
  console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('CRASH', e.message.slice(0, 1200)); process.exit(1); });
