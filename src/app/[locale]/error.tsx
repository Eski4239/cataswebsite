'use client';

import {useTranslations} from 'next-intl';

// Shown if a page fails while rendering; lets the visitor retry instead of seeing a blank screen.
export default function ErrorPage({reset}: {error: Error; reset: () => void}) {
  const t = useTranslations('errorPage');

  return (
    <section className="section-shell pt-40">
      <h1 className="font-heading text-5xl font-light text-charcoal md:text-6xl">{t('title')}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">{t('body')}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-10 inline-block border border-burgundy px-8 py-3.5 text-sm uppercase tracking-[0.18em] text-burgundy transition-colors duration-300 hover:bg-burgundy hover:text-ivory"
      >
        {t('retry')}
      </button>
    </section>
  );
}
