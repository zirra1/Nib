import Link from 'next/link';
import { Logo } from './Logo';
import { ButtonLink } from './ui';

export function SiteHeader({ cta = true }: { cta?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5 md:px-8">
        <Logo />
        <nav className="flex items-center gap-1 text-sm md:gap-2" aria-label="Main">
          <Link href="/cursors" className="rounded-sm px-3 py-2 text-ink-2 hover:text-ink">My cursors</Link>
          {cta && <ButtonLink href="/new" variant="primary" size="sm">Start creating</ButtonLink>}
        </nav>
      </div>
    </header>
  );
}
