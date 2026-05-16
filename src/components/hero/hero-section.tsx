'use client';

import Link from 'next/link';
import {FadeUp} from '@/components/motion/fade-up';

export function HeroSection({locale}: {locale: string}) {
  return (
    <section className='relative min-h-screen overflow-hidden'>
      <div className='absolute inset-0 bg-[url(https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=1600)] bg-cover bg-center' />
      <div className='absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-background' />
      <div className='section-shell relative flex min-h-screen items-end pb-24 pt-40'>
        <div>
          <FadeUp><p className='meta-label'>Cinematic Archive</p></FadeUp>
          <FadeUp delay={0.1}><h1 className='mt-4 max-w-4xl font-heading text-5xl leading-tight md:text-8xl'>Every bottle tells a story.</h1></FadeUp>
          <FadeUp delay={0.2}><p className='mt-6 max-w-2xl text-lg text-muted'>Exploring wine through history, geography, culture, and human connection.</p></FadeUp>
          <FadeUp delay={0.3}>
            <div className='mt-10 flex flex-wrap gap-4'>
              <Link href={`/${locale}/media`} className='border border-gold bg-gold/10 px-6 py-3 text-sm uppercase tracking-[0.15em]'>Explore Stories</Link>
              <Link href={`/${locale}/contact`} className='border border-border px-6 py-3 text-sm uppercase tracking-[0.15em]'>Request a Tasting Invitation</Link>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
