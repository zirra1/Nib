import Link from 'next/link';

/** The mark: a cursor arrow whose tip is the hotspot — the one orange square in the brand. */
export function Mark({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M5 4.5 L5 20 L9.1 16.2 L12 22.4 L14.8 21.1 L12 15 L17.5 15 Z" fill="var(--ink)" />
      <rect x="3" y="2.5" width="4" height="4" fill="var(--accent)" />
    </svg>
  );
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 text-[19px] font-semibold tracking-[-0.04em]" aria-label="Nib home">
      <Mark />
      <span>nib</span>
    </Link>
  );
}
