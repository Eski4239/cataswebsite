// Contact page — no form for now: visitors are pointed to Instagram, where Luis answers messages.
import {getTranslations, setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/lib/i18n/routing';
import {FadeUp} from '@/components/motion/fade-up';
import {pageMetadata} from '@/lib/seo/metadata';

const INSTAGRAM_URL = 'https://www.instagram.com/luistorrescatas/';

export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return pageMetadata(locale, 'contact');
}

export default async function ContactPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');

  return (
    <section className="section-shell pt-40">
      <FadeUp>
        <h1 className="font-heading text-6xl text-charcoal">{t('heading')}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{t('subheading')}</p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-block border border-burgundy px-8 py-3.5 text-sm uppercase tracking-[0.18em] text-burgundy transition-colors duration-300 hover:bg-burgundy hover:text-ivory"
        >
          {t('instagramCta')}
        </a>
        <p className="mt-6 text-sm text-muted">@luistorrescatas</p>
      </FadeUp>
    </section>
  );
}
