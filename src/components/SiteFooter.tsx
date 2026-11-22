import Link from 'next/link';
import { Mark } from './Logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-[13px] text-ink-2 md:px-8">
        <span className="flex items-center gap-2"><Mark size={16} /> Nib. Draw your own cursor.</span>
        <nav className="flex gap-5" aria-label="Footer">
          <Link href="/new" className="hover:text-ink">Start creating</Link>
          <Link href="/cursors" className="hover:text-ink">My cursors</Link>
        </nav>
      </div>
    </footer>
  );
}
