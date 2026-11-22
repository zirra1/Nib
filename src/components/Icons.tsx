/** Nib icon set: 20×20 grid, 1.5 px strokes, square-ish terminals. Drawn for Nib. */
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
});
const mk = (children: React.ReactNode) => function Icon({ size, ...p }: P) {
  return <svg {...base(size)} {...p}>{children}</svg>;
};

export const IconPen = mk(<><path d="M4 16 L5 12 L13.5 3.5 L16.5 6.5 L8 15 Z" /><path d="M11.5 5.5 L14.5 8.5" /></>);
export const IconEraser = mk(<><path d="M8 16 H16" /><path d="M3.5 12.5 L10.5 5.5 L15 10 L9 16 H7 Z" /><path d="M7 9 L11.5 13.5" /></>);
export const IconLine = mk(<path d="M4 16 L16 4" />);
export const IconRect = mk(<rect x="3.75" y="5.75" width="12.5" height="8.5" rx="0.5" />);
export const IconEllipse = mk(<ellipse cx="10" cy="10" rx="6.5" ry="5" />);
export const IconFill = mk(<><path d="M9 3.5 L15.5 10 L10 15.5 L3.5 9 Z" /><path d="M3.5 9 H15.5" /><path d="M16.5 13 C17.3 14.2 17.5 15 17.5 15.5 A1 1 0 0 1 15.5 15.5 C15.5 15 15.7 14.2 16.5 13 Z" fill="currentColor" /></>);
export const IconDropper = mk(<><path d="M12 4.5 L15.5 8 L7 16.5 H3.5 V13 Z" /><path d="M11 3.5 L16.5 9" /></>);
export const IconHotspot = mk(<><rect x="7.5" y="7.5" width="5" height="5" /><path d="M10 2.5 V5 M10 15 V17.5 M2.5 10 H5 M15 10 H17.5" /></>);
export const IconMove = mk(<><path d="M10 2.5 V17.5 M2.5 10 H17.5" /><path d="M8 4.5 L10 2.5 L12 4.5 M8 15.5 L10 17.5 L12 15.5 M4.5 8 L2.5 10 L4.5 12 M15.5 8 L17.5 10 L15.5 12" /></>);
export const IconUndo = mk(<><path d="M7 5 L3.5 8.5 L7 12" /><path d="M3.5 8.5 H12 A4.5 4.5 0 0 1 12 17.5 H9" /></>);
export const IconRedo = mk(<><path d="M13 5 L16.5 8.5 L13 12" /><path d="M16.5 8.5 H8 A4.5 4.5 0 0 0 8 17.5 H11" /></>);
export const IconPlus = mk(<path d="M10 4 V16 M4 10 H16" />);
export const IconMinus = mk(<path d="M4 10 H16" />);
export const IconFit = mk(<path d="M3.5 7.5 V3.5 H7.5 M12.5 3.5 H16.5 V7.5 M16.5 12.5 V16.5 H12.5 M7.5 16.5 H3.5 V12.5" />);
export const IconUpload = mk(<><path d="M10 13 V3.5 M6 7.5 L10 3.5 L14 7.5" /><path d="M3.5 12.5 V16.5 H16.5 V12.5" /></>);
export const IconGrid = mk(<><rect x="3.5" y="3.5" width="5" height="5" /><rect x="11.5" y="3.5" width="5" height="5" /><rect x="3.5" y="11.5" width="5" height="5" /><rect x="11.5" y="11.5" width="5" height="5" /></>);
export const IconCheck = mk(<path d="M4 10.5 L8 14.5 L16 5.5" />);
export const IconTrash = mk(<><path d="M4 6 H16 M8 6 V4 H12 V6" /><path d="M5.5 6 L6.5 16.5 H13.5 L14.5 6" /></>);
export const IconClose = mk(<path d="M5 5 L15 15 M15 5 L5 15" />);
export const IconArrowRight = mk(<path d="M4 10 H16 M11.5 5.5 L16 10 L11.5 14.5" />);
export const IconFlip = mk(<><path d="M10 3 V17" strokeDasharray="1.5 2" /><path d="M7.5 6 L3.5 14 H7.5 Z M12.5 6 L16.5 14 H12.5 Z" /></>);
export const IconCursor = mk(<path d="M5 3 L5 15.5 L8.2 12.6 L10.5 17 L12.6 16 L10.4 11.6 L14.6 11.6 Z" />);
export const IconLock = mk(<><rect x="4.5" y="9" width="11" height="8" rx="1" /><path d="M7 9 V6.5 A3 3 0 0 1 13 6.5 V9" /></>);
export const IconMore = mk(<><circle cx="5" cy="10" r="0.6" fill="currentColor" /><circle cx="10" cy="10" r="0.6" fill="currentColor" /><circle cx="15" cy="10" r="0.6" fill="currentColor" /></>);
export const IconSliders = mk(<><path d="M4 6 H16 M4 14 H16" /><rect x="6" y="4" width="3" height="4" fill="var(--surface)" /><rect x="11" y="12" width="3" height="4" fill="var(--surface)" /></>);
