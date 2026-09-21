// Branded, translated 404 page.
import Link from 'next/link';
import {getLocale, getTranslations} from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  const locale = await getLocale();

  return (
    <section className="section-shell pt-40">
      <p className="meta-label text-burgundy">404</p>
      <h1 className="mt-4 font-heading text-5xl font-light text-charcoal md:text-6xl">{t('title')}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">{t('body')}</p>
      <Link
        href={`/${locale}`}
        className="mt-10 inline-block border border-burgundy px-8 py-3.5 text-sm uppercase tracking-[0.18em] text-burgundy transition-colors duration-300 hover:bg-burgundy hover:text-ivory"
      >
        {t('home')}
      </Link>
    </section>
  );
}
