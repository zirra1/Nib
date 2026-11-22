import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { Library } from '@/components/Library';

export const metadata: Metadata = { title: 'My cursors' };

export default function CursorsPage() {
  return (
    <>
      <SiteHeader />
      <Library />
    </>
  );
}
