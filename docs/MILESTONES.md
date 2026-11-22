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

## Milestone 2: Apply everywhere ✅
**Built**
- **Apply screen** (`/apply`): one screen, one decision. Detects the computer and browser and preselects the right option (Mac, Windows, browser, or files on a phone), with a 3-step illustrated guide for each.
- **Use in my browser**: a Chrome extension (Manifest V3) that applies your cursor to every website in one click from the Apply screen. Permission: `storage` plus a content script; it adds one style rule, keeps the text cursor in text fields, never reads pages and makes no network requests. Only the Nib website can hand it a cursor. The popup can switch it off or remove it.
- **Download for Windows**: `pointer.cur` (32/48/64/128 px versions as needed, hotspot in each), `install.inf` (right-click › Install registers a "Nib - name" pointer scheme) and a read-me.
- **Download for Mac**: a Mousecape `.cape` (1× and 2× images, hotspot) plus a read-me.
- **PNG / SVG**: pixel-exact SVG, PNG, and a copyable CSS `cursor:` line for websites.
- `.ani` encoder (animated Windows cursors) is built and tested, ready for animation frames.
- File formats written from scratch (no dependencies): `.cur`, `.ani`, `.cape` plist, `.inf`, SVG, ZIP.

**Tested**
- 25 unit tests, including reading every format back with independent readers (Pillow for .cur/.png, Python's plistlib and zipfile).
- `e2e/apply.cjs` (26 checks): downloads validated, Mac/Windows/phone detection, and the real extension loaded in Chromium: applied in 4 clicks from the landing page, seen on another website, switched off from the popup, ignores messages from other sites.
- `e2e/flow.cjs` (41 checks): Milestone 1 flow, now through the Apply screen.

**Honest limits**
- The Windows installer and the Mac `.cape` follow the documented formats and pass format checks, but haven't been tried on a real Windows PC or Mac here. Please try both once and tell me what you see.
- Mousecape is a third-party app (free, open source); it isn't maintained by Nib, and very new macOS versions may need its latest build.
- The extension isn't in the Chrome Web Store yet (that needs a developer account in your name, a one-time $5 fee), so it's installed via Developer mode. Before publishing, add the live site's address to `extension/config.js`.
- Chrome blocks extensions on its own pages (Settings, Web Store, new-tab page).

## Milestone 3: Nib Plus subscription (requested)
Accounts, a subscription with a payment provider, and upload of your own pictures/diagrams as a Plus feature. Details to confirm with you first.

## Milestone 4: richer creation (proposed)
Effects (outline, shadow, glow), text tool, graphics library, animation frames and timeline, vector drawing mode.

## Milestone 5: sets and sharing (proposed)
Optional account and sync, full cursor sets (normal, pointer, text, loading), share links.
