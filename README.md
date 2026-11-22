# Nib

Draw your own mouse cursor and start using it in as few steps as possible.

**Create → Customise → Apply**, in one place. No account; designs are saved in your browser.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit tests (pixel engine, history, templates, storage, upload checks)
npm run build && npx next start -p 3100
node e2e/flow.cjs http://localhost:3100   # end-to-end flow, desktop + phone emulation
node e2e/apply.cjs http://localhost:3100  # downloads, OS detection, the Chrome extension for real
node scripts/build-extension.cjs          # rebuild public/nib-chrome-extension.zip after changing extension/
```

## Where things are

| Path | What |
|---|---|
| `src/lib/pixels.ts` | Pixel engine: pen, line, rectangle, ellipse, flood fill, move, flip, background removal. Pure, unit-tested. |
| `src/lib/history.ts` | Undo/redo (one step per stroke, 100 steps). |
| `src/lib/templates.ts` | Starter templates (original artwork): vector on a 32 grid, or hand-placed pixels. |
| `src/lib/cursor.ts` | Bitmap → PNG → CSS `cursor`, resizing. |
| `src/lib/storage.ts` | "My cursors" in localStorage, validated on read. |
| `src/lib/importImage.ts` | Upload: validate, decode locally, remove a plain background, crop, fit. |
| `src/components/editor/` | The editor: canvas, tools, colour, hotspot, live preview. |
| `src/lib/export/` | File formats written from scratch: .cur, .ani, Mousecape .cape, install.inf, SVG, ZIP. |
| `src/components/apply/` | The Apply screen and its illustrated install guides. |
| `extension/` | The Chrome extension (Manifest V3). Add the live site's address to `config.js` before publishing. |
| `docs/DESIGN.md` | Identity, design system, user flow. |
| `docs/MILESTONES.md` | What each milestone delivered and what's next. |
