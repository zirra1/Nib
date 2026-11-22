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
| `docs/DESIGN.md` | Identity, design system, user flow. |
| `docs/MILESTONES.md` | What each milestone delivered and what's next. |
