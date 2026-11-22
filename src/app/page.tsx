import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { TryOnSheet } from '@/components/TryOnSheet';
import { ButtonLink, Eyebrow } from '@/components/ui';
import { IconArrowRight, IconCheck, IconLock } from '@/components/Icons';

const OLD_WAY = [
  ['Design it', 'in an image editor like Photoshop or Illustrator.'],
  ['Convert it', 'into a cursor file on a second website.'],
  ['Install it', 'with a third app, and work through its settings.'],
];

const STEPS = [
  { n: '01', title: 'Create', body: 'Start from a template, upload an image, or draw on a blank pixel grid. Plain backgrounds are removed and the image is cropped to cursor size for you.' },
  { n: '02', title: 'Customise', body: 'Pen, shapes, fill, colours and sizes from 32 to 128 px. Then place the hotspot, the exact pixel that clicks, and test it with your own mouse.' },
  { n: '03', title: 'Apply', body: 'One click with the Nib extension for Chrome, or a ready-to-install download for Mac or Windows. PNG and SVG for designers and websites.' },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-[1200px] gap-12 px-5 pt-14 pb-20 md:px-8 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16 lg:pt-24 lg:pb-28">
          <div>
            <Eyebrow className="mb-6">Cursor maker</Eyebrow>
            <h1 className="text-[52px] leading-[0.98] font-medium tracking-[-0.045em] md:text-[76px] lg:text-[88px]">
              Draw{' '}
              <span className="relative inline-block">
                <span aria-hidden className="absolute top-[0.16em] -left-[0.02em] size-[0.14em] bg-accent" />
                your own
              </span>
              <br />
              cursor.
            </h1>
            <p className="mt-7 max-w-[460px] text-[17px] leading-relaxed text-ink-2">
              Nib puts the whole job in one place. Start from a template, an image or a blank grid, choose the exact click point, and wear it straight away.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/new" variant="primary" size="lg">
                Start creating <IconArrowRight size={18} />
              </ButtonLink>
              <span className="text-sm text-ink-2">Free. No sign-up.</span>
            </div>
          </div>
          <TryOnSheet />
        </section>

        {/* The problem */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 md:px-8 lg:grid-cols-2 lg:gap-16 lg:py-24">
            <div>
              <Eyebrow className="mb-4">Today</Eyebrow>
              <h2 className="text-[34px] leading-[1.05] font-medium tracking-[-0.035em] md:text-[44px]">A custom cursor takes three tools.</h2>
              <ol className="mt-8 border-t border-line">
                {OLD_WAY.map(([a, b], i) => (
                  <li key={a} className="flex gap-5 border-b border-line py-4 text-ink-2">
                    <span className="tnum w-5 pt-px text-[13px] text-ink-3">{i + 1}</span>
                    <span><span className="text-ink line-through decoration-line-2 decoration-1">{a}</span> {b}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-sm text-ink-2">Most browser extensions skip the design step, but only offer ready-made packs, and only inside the browser.</p>
            </div>
            <div>
              <Eyebrow className="mb-4">With Nib</Eyebrow>
              <h2 className="text-[34px] leading-[1.05] font-medium tracking-[-0.035em] md:text-[44px]">One place. Three steps.</h2>
              <ol className="mt-8 grid border-t border-line">
                {STEPS.map((s) => (
                  <li key={s.n} className="grid grid-cols-[2.5rem_1fr] border-b border-line py-5">
                    <span className="tnum pt-0.5 text-[13px] text-ink-3">{s.n}</span>
                    <div>
                      <h3 className="text-lg font-medium tracking-[-0.02em]">{s.title}</h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 md:px-8 lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:py-24">
          <div>
            <span className="grid size-10 place-items-center rounded-sm border border-line-2 bg-surface"><IconLock /></span>
            <h2 className="mt-6 text-[34px] leading-[1.05] font-medium tracking-[-0.035em] md:text-[44px]">Your cursor, and nothing else.</h2>
          </div>
          <ul className="grid content-start gap-0 border-t border-line text-[15px]">
            {[
              'No account needed. Your designs are saved in this browser, on this device.',
              'Uploaded images are processed on your device. They are never sent to us.',
              'The Chrome extension only sets your cursor. It doesn’t read the pages you visit, and it never sends anything anywhere.',
            ].map((t) => (
              <li key={t} className="flex gap-4 border-b border-line py-4 leading-relaxed text-ink-2">
                <IconCheck className="mt-0.5 shrink-0 text-ink" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Closing */}
        <section className="border-t border-line">
          <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 px-5 py-16 md:flex-row md:items-center md:px-8">
            <h2 className="text-[34px] leading-[1.05] font-medium tracking-[-0.035em] md:text-[44px]">Make the one you’ll point with.</h2>
            <ButtonLink href="/new" variant="primary" size="lg">Start creating <IconArrowRight size={18} /></ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
