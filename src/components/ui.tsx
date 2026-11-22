/** Shared primitives. Buttons are flat ink or hairline; no gradients, no shadows. */
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const styles: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-[#2a2a2a]',
  secondary: 'border border-line-2 bg-surface text-ink hover:border-ink',
  ghost: 'text-ink-2 hover:bg-sunk hover:text-ink',
  danger: 'border border-line-2 bg-surface text-danger hover:border-danger',
};
const sizes = { sm: 'h-8 px-3 text-[13px] gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-5 text-[15px] gap-2.5' };

export function buttonClass(variant: Variant = 'secondary', size: keyof typeof sizes = 'md', extra = '') {
  return `inline-flex select-none items-center justify-center rounded-sm font-medium whitespace-nowrap transition-[background,border-color,color,transform] duration-150 active:translate-y-px disabled:opacity-40 disabled:active:translate-y-0 ${styles[variant]} ${sizes[size]} ${extra}`;
}

export function Button({ variant, size, className = '', ...p }: ComponentProps<'button'> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...p} />;
}

export function ButtonLink({ variant, size, className = '', ...p }: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <Link className={buttonClass(variant, size, className)} {...p} />;
}

/** Icon button with a tooltip that also shows the keyboard shortcut. */
export function IconButton({ label, shortcut, active, children, tipSide = 'right', className = '', ...p }:
  ComponentProps<'button'> & { label: string; shortcut?: string; active?: boolean; tipSide?: 'right' | 'bottom' | 'top' }) {
  const tip = { right: 'left-full top-1/2 ml-2 -translate-y-1/2', bottom: 'top-full left-1/2 mt-2 -translate-x-1/2', top: 'bottom-full left-1/2 mb-2 -translate-x-1/2' }[tipSide];
  return (
    <button
      type="button"
      aria-label={shortcut ? `${label} (${shortcut})` : label}
      aria-pressed={active}
      className={`group relative grid size-9 shrink-0 place-items-center rounded-sm transition-colors duration-100 disabled:opacity-35 ${active ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-sunk hover:text-ink'} ${className}`}
      {...p}
    >
      {children}
      {active && <span aria-hidden className="absolute top-1 left-1 size-1.5 bg-accent" />}
      <span role="tooltip" className={`pointer-events-none absolute z-40 hidden items-center gap-2 rounded-sm bg-ink px-2 py-1 text-xs whitespace-nowrap text-paper opacity-0 transition-opacity delay-300 duration-100 group-hover:opacity-100 group-focus-visible:opacity-100 lg:flex ${tip}`}>
        {label}
        {shortcut && <kbd className="font-sans text-[11px] text-[#b5b1a8]">{shortcut}</kbd>}
      </span>
    </button>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs font-medium tracking-[0.14em] text-ink-2 uppercase ${className}`}>{children}</p>;
}

/** Segmented control (radiogroup). */
export function Segmented<T extends string | number>({ value, options, onChange, label, className = '' }:
  { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex rounded-sm border border-line-2 bg-surface p-0.5 ${className}`}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`tnum h-7 rounded-[4px] px-2.5 text-[13px] transition-colors ${o.value === value ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
