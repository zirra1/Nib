import type { Metadata, Viewport } from 'next';
import { Instrument_Sans } from 'next/font/google';
import { AppliedCursor } from '@/components/AppliedCursor';
import { Toaster } from '@/components/Toast';
import './globals.css';

const nibFont = Instrument_Sans({ variable: '--font-nib', subsets: ['latin'], weight: ['400', '500', '600'] });

export const metadata: Metadata = {
  title: { default: 'Nib — draw your own cursor', template: '%s · Nib' },
  description: 'Make a custom mouse cursor in one place: start from a template, an image or a blank grid, set the click point, and use it right away.',
  icons: { icon: '/cursors/arrow-active.svg' },
};

export const viewport: Viewport = { themeColor: '#f3f1ec', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nibFont.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <AppliedCursor />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
