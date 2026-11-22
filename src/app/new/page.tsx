import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { StartScreen } from '@/components/StartScreen';

export const metadata: Metadata = { title: 'New cursor' };

export default function NewPage() {
  return (
    <>
      <SiteHeader cta={false} />
      <StartScreen />
    </>
  );
}
