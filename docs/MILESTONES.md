# Milestones

## Milestone 1: foundation, create and customise ✅
**Built**
- Design system (tokens, type, icons, brand cursor) and the Nib identity.
- Landing page with a live try-on sheet: hover a square and your real cursor becomes that design.
- Start screen: template gallery (16 original templates in 5 categories), image upload, blank grid, size choice.
- Upload: type/size checks, local decoding, plain-background removal, auto-crop, fit to size. Nothing is uploaded to a server.
- Editor: pixel canvas with zoom and grid; pen, eraser, line, rectangle, ellipse (outline/filled), fill, eyedropper, move, flip, hotspot; brush sizes 1–4; colour picker, hex, opacity, 16-colour palette, recent colours; sizes 32/48/64/128 (undoable); undo/redo; keyboard shortcuts with tooltips.
- Live preview: your mouse wears the cursor over text, a link, a button and a field, on Light/Dark/Colour/Desktop/Web backgrounds; actual-size swatches.
- Use it here: applies the cursor to the whole Nib site (with Undo) and saves it.
- My cursors: local library, open, wear/stop wearing, delete with Undo; empty/loading states.
- Mobile: touch-first editor layout; no horizontal scroll.
- Errors: unsupported/huge/empty uploads, transparent images, unknown design links, full storage, leaving with unsaved changes.

**Tested**
- 15 unit tests (`npm test`).
- `e2e/flow.cjs`: 42 checks across desktop, iPhone 13 and Pixel 7 emulation, all passing. Fastest path to a working cursor: 3 clicks.

**Honest limits**
- Pixel mode only. The smooth vector drawing mode is not built yet.
- No downloads yet (Mac/Windows packs, .cur/.ani, PNG/SVG) and no Chrome extension, so the cursor only works on the Nib site for now.
- No text tool, graphics library (stickers/emojis), effects (outline, shadow, glow) or animation frames yet.
- Background removal handles plain backgrounds only, not busy photos.
- Not tested on physical phones; emulation only.

## Milestone 2: Apply everywhere (proposed)
Apply/export screen with OS detection; PNG and SVG; Windows `.cur` (with hotspot) and `.ani`, plus an install file and a 3-step guide; Mac pack for Mousecape with a guide; Chrome extension (Manifest V3, minimal permissions) with "Use in my browser".

## Milestone 3: richer creation (proposed)
Effects (outline, shadow, glow), text tool, graphics library, animation frames and timeline, vector drawing mode.

## Milestone 4: sets and sharing (proposed)
Optional account and sync, full cursor sets (normal, pointer, text, loading), share links.
