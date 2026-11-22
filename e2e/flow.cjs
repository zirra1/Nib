/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
// End-to-end check of Nib M1 against a running server (default http://localhost:3100).
// Usage: node e2e/flow.cjs [baseUrl] [screenshotDir]
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:3100';
const SHOTS = process.argv[3];
let failed = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) failed++; };
const shot = (p, name, opts = {}) => SHOTS && p.screenshot({ path: `${SHOTS}/${name}.png`, ...opts });

// The document itself (the actual-size preview image), not the canvas view, which also shows the hover outline.
async function canvasHash(p) {
  return p.evaluate(() => document.querySelector('figure img')?.getAttribute('src') ?? '');
}
async function dragOnCanvas(p, pts) {
  const box = await p.locator('[data-testid=canvas]').boundingBox();
  const at = ([fx, fy]) => [box.x + box.width * fx, box.y + box.height * fy];
  await p.mouse.move(...at(pts[0]));
  await p.mouse.down();
  for (const q of pts.slice(1)) await p.mouse.move(...at(q), { steps: 6 });
  await p.mouse.up();
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));

  // ---- 1. Fastest path: landing → template → wear it. Count the clicks.
  const t0 = Date.now();
  let clicks = 0;
  await p.goto(BASE + '/');
  await p.getByRole('link', { name: 'Start creating' }).first().click(); clicks++;
  await p.getByRole('link', { name: 'Classic', exact: true }).click(); clicks++;
  await p.getByRole('button', { name: /Use it here/ }).click(); clicks++;
  const applied = await p.evaluate(() => ({ attr: document.documentElement.hasAttribute('data-user-cursor'), css: getComputedStyle(document.documentElement).getPropertyValue('--user-cursor') }));
  ok(applied.attr && applied.css.includes('data:image/png'), `cursor applied to the site in ${clicks} clicks (${((Date.now() - t0) / 1000).toFixed(1)} s automated)`);
  ok(/Saved/.test(await p.getByTestId('save-status').innerText()), 'wearing it also saves it');
  const bodyCursor = await p.evaluate(() => getComputedStyle(document.querySelector('header')).cursor);
  ok(bodyCursor.includes('data:image/png'), 'applied cursor is used across the page');
  await shot(p, 'editor-template');

  // ---- 2. Draw, undo, redo, hotspot.
  const before = await canvasHash(p);
  await p.keyboard.press('b');
  await dragOnCanvas(p, [[0.6, 0.15], [0.9, 0.15], [0.9, 0.4]]);
  const drawn = await canvasHash(p);
  ok(drawn !== before, 'pen stroke changes the canvas');
  ok(/Unsaved/.test(await p.getByTestId('save-status').innerText()), 'status shows unsaved changes');
  await p.keyboard.press('Control+z');
  ok((await canvasHash(p)) === before, 'Ctrl+Z undoes the whole stroke in one step');
  await p.keyboard.press('Control+Shift+z');
  ok((await canvasHash(p)) === drawn, 'Ctrl+Shift+Z redoes it');
  await p.keyboard.press('r');
  await dragOnCanvas(p, [[0.55, 0.55], [0.85, 0.85]]);
  await p.keyboard.press('g');
  ok((await p.getByRole('button', { name: 'Fill (G)' }).getAttribute('aria-pressed')) === 'true', 'tool shortcut G selects Fill');
  await p.getByRole('button', { name: 'Pick H' }).click();
  const box = await p.locator('[data-testid=canvas]').boundingBox();
  await p.mouse.click(box.x + box.width * (16.5 / 32), box.y + box.height * (16.5 / 32));
  ok((await p.getByLabel('Hotspot x').inputValue()) === '16' && (await p.getByLabel('Hotspot y').inputValue()) === '16', 'hotspot set by clicking the canvas');
  ok((await p.getByRole('button', { name: 'Fill (G)' }).getAttribute('aria-pressed')) === 'true', 'after picking the hotspot, the previous tool comes back');
  await p.getByLabel('Hex colour').fill('#2bb673');
  await p.getByLabel('Hex colour').press('Enter');
  await p.keyboard.press('b');
  await dragOnCanvas(p, [[0.7, 0.7], [0.72, 0.72]]);
  ok((await p.getByRole('button', { name: 'Recent #2BB673' }).count()) === 1, 'painted colour appears in Recent');
  const zone = p.getByTestId('preview-zone');
  ok((await zone.evaluate((z) => getComputedStyle(z.querySelector('button')).cursor)).includes('data:image/png'), 'preview zone shows the cursor over its button');
  await p.getByLabel('Cursor size').selectOption('64');
  ok((await p.getByLabel('Hotspot x').inputValue()) === '32', 'resizing to 64 px scales the hotspot');
  await p.keyboard.press('Control+z');
  ok((await p.getByLabel('Cursor size').inputValue()) === '32', 'resize is undoable');
  await p.keyboard.press('Control+s');
  await p.waitForTimeout(200);
  ok(/Saved/.test(await p.getByTestId('save-status').innerText()), 'Ctrl+S saves');
  await shot(p, 'editor-edited');

  // ---- 3. Saved designs persist and list.
  await p.getByRole('button', { name: /Use it here/ }).click(); // wear the edited version
  await p.reload();
  await p.locator('[data-testid=canvas]').waitFor();
  ok((await p.getByLabel('Hotspot x').inputValue()) === '16', 'saved design reopens with its hotspot');
  await p.goto(BASE + '/cursors');
  ok((await p.getByRole('link', { name: /^Open / }).count()) === 1, 'My cursors lists the design');
  ok((await p.getByText('Wearing').count()) >= 1, 'My cursors marks the one being worn');
  await shot(p, 'cursors');
  await p.getByRole('button', { name: /^Stop wearing/ }).click();
  ok(!(await p.evaluate(() => document.documentElement.hasAttribute('data-user-cursor'))), 'can go back to the standard cursor');

  // ---- 4. Upload: plain background removed + auto-crop; bad file rejected.
  const png = await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 300; c.height = 200;
    const x = c.getContext('2d'); x.fillStyle = '#fafafa'; x.fillRect(0, 0, 300, 200);
    x.fillStyle = '#e11d48'; x.beginPath(); x.arc(150, 100, 40, 0, Math.PI * 2); x.fill();
    return c.toDataURL('image/png').split(',')[1];
  });
  await p.goto(BASE + '/new');
  await p.getByLabel('Choose an image').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
  ok((await p.getByRole('alert').filter({ hasText: 'isn’t supported' }).count()) === 1, 'non-image upload shows a clear error');
  await shot(p, 'new-upload-error');
  await p.getByLabel('Choose an image').setInputFiles({ name: 'red-dot.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await p.waitForURL(/\/editor\?import=1/);
  await p.locator('[data-testid=canvas]').waitFor();
  ok((await p.getByText('Background removed and cropped to size.').count()) === 1, 'upload: background removed, cropped');
  const corner = await p.locator('[data-testid=canvas]').evaluate(() => 0); // canvas shows checker; check the doc via preview image
  const alpha = await p.evaluate(async () => {
    const img = document.querySelector('figure img');
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const mid = (Math.floor(c.height / 2) * c.width + Math.floor(c.width / 2)) * 4;
    return { corner: d[3], middle: d[mid + 3], w: c.width };
  });
  ok(alpha.corner === 0 && alpha.middle === 255 && alpha.w === 32 && corner === 0, 'upload: corners transparent, subject kept, fitted to 32 px');
  await shot(p, 'editor-upload');

  // ---- 5. Blank grid + error state.
  await p.goto(BASE + '/editor?blank=1&size=48');
  await p.locator('[data-testid=canvas]').waitFor();
  ok((await p.getByLabel('Cursor size').inputValue()) === '48', 'blank grid opens at the chosen size');
  p.once('dialog', (d) => d.accept());
  await p.getByRole('button', { name: /Use it here/ }).click();
  ok((await p.getByText(/Draw something first/).count()) === 1, 'an empty cursor cannot be applied');
  await p.goto(BASE + '/editor?id=doesnotexist');
  ok((await p.getByRole('heading', { name: 'We couldn’t find that cursor' }).count()) === 1, 'unknown design shows a helpful error');
  await shot(p, 'editor-missing');

  ok(errs.length === 0, 'no page errors on desktop ' + errs.join(' | '));
  await ctx.close();

  // ---- 6. Mobile: touch-first editor, no horizontal scroll.
  for (const name of ['iPhone 13', 'Pixel 7']) {
    const m = await b.newContext({ ...devices[name] });
    const mp = await m.newPage();
    const merrs = []; mp.on('pageerror', (e) => merrs.push(e.message));
    for (const path of ['/', '/new', '/cursors']) {
      await mp.goto(BASE + path);
      await mp.waitForTimeout(300);
      ok((await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, `${name} ${path}: no horizontal scroll`);
      if (name === 'iPhone 13') await shot(mp, `m-${path === '/' ? 'landing' : path.slice(1)}`, { fullPage: path === '/' });
    }
    await mp.goto(BASE + '/editor?template=heart');
    await mp.locator('[data-testid=canvas]').waitFor();
    const h0 = await canvasHash(mp);
    const cb = await mp.locator('[data-testid=canvas]').boundingBox();
    await mp.touchscreen.tap(cb.x + cb.width * 0.1, cb.y + cb.height * 0.9);
    ok((await canvasHash(mp)) !== h0, `${name}: drawing works by touch`);
    ok(await mp.getByRole('toolbar', { name: 'Tools' }).isVisible(), `${name}: tools along the bottom`);
    ok(!(await mp.getByRole('button', { name: /Use it here/ }).isVisible()), `${name}: no "use it here" on a touch screen`);
    if (name === 'iPhone 13') await shot(mp, 'm-editor');
    await mp.getByRole('button', { name: 'Preview', exact: true }).tap();
    ok(await mp.getByRole('dialog').getByText(/Cursors are used with a mouse or trackpad/).isVisible(), `${name}: preview explains cursors are applied on a computer`);
    if (name === 'iPhone 13') await shot(mp, 'm-editor-preview');
    ok(merrs.length === 0, `${name}: no page errors ${merrs.join(' | ')}`);
    await m.close();
  }

  await b.close();
  console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('CRASH', e.message.slice(0, 800)); process.exit(1); });
