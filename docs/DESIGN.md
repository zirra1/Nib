# Nib: identity, design system, flow

## Identity
- **Name:** Nib, the tip of a pen, and the point of a cursor.
- **Mark:** a cursor arrow whose tip is a small orange square. That square is the *hotspot*, the exact pixel a cursor clicks with, so the logo explains the product.
- **Feel:** a calm drafting table. The canvas is the hero; everything around it is quiet, precise and out of the way.
- **Voice:** short, plain, honest. Never claim something works before it does ("Downloads … are next").

## Design system
| Token | Value | Use |
|---|---|---|
| `--paper` | `#F3F1EC` | Page background |
| `--surface` | `#FFFFFF` | Panels, tiles |
| `--sunk` | `#EBE8E1` | Canvas stage, hover fills |
| `--ink` | `#151515` | Text, primary buttons, active tool |
| `--ink-2` | `#57544E` | Secondary text (AA on paper and white) |
| `--ink-3` | `#8A867E` | Decorative only (numbers, hints) |
| `--line` / `--line-2` | `#E1DDD4` / `#CDC8BD` | Hairlines, control borders |
| `--accent` | `#FF4F1A` | **Only** the hotspot, the key word mark, and the "active" tick |

- **Type:** one typeface, Instrument Sans (400/500/600). Display sizes use tight tracking (−0.045em); numbers are tabular.
- **Shape:** 1 px borders instead of shadows; radii 6 px (controls) and 10 px (rare). Lists and grids are drawn with shared hairlines, not floating cards.
- **Spacing:** 4 px grid.
- **Icons:** custom 20 px set, 1.5 px strokes. Every tool has a tooltip with its shortcut.
- **Cursor as brand:** the site's own cursor is the Nib arrow; over anything clickable its hotspot lights up orange. Once you press *Use it here*, your cursor takes over the whole site.
- **Motion:** short (150–260 ms), no bounce, honours reduced motion.
- **Detail:** a tick-mark "ruler" under section headers; checkerboards mean transparency everywhere.

## User flow (3 steps)
1. **Create** (`/new`): template gallery, upload, or blank grid; pick a size (32 is standard).
2. **Customise** (`/editor`): tools, colour, hotspot, size; a live preview where your real mouse wears the cursor over text, links, buttons and five backgrounds.
3. **Apply** (`/apply`): one screen, one decision. Use in my browser (extension), Download for Mac, Download for Windows, or PNG/SVG. The option for your computer is preselected and marked.

Fastest path measured by the e2e test, with the extension installed: **landing → Start creating → Classic → Apply → Use in my browser = 4 clicks.**

## Keyboard
| Key | Action | Key | Action |
|---|---|---|---|
| B | Pen | G | Fill |
| E | Eraser | I | Eyedropper (or Alt-click) |
| L | Line (Shift: 45°) | V | Move |
| R | Rectangle (Shift: square) | H | Set hotspot |
| O | Ellipse (Shift: circle) | [ / ] | Brush size |
| Ctrl Z / Ctrl ⇧ Z / Ctrl Y | Undo / redo | + / − / 0 | Zoom in / out / fit |
| Ctrl S | Save | | |

## Mobile
Touch-first editor: tools along the bottom, colour/hotspot/size/preview in a bottom sheet, touch drawing. The preview explains that cursors are applied on a computer, and *Use it here* is hidden on touch screens.
