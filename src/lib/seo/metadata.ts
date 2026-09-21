// SEO — page metadata (title, description, canonical, hreflang, social cards) and structured data (JSON-LD).
import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {madridLocalToIso} from '@/lib/agent/time';
import type {Tasting} from '@/lib/content';
import {locales, type Locale} from '@/lib/i18n/routing';

// Set NEXT_PUBLIC_SITE_URL in Vercel once the site has its own domain (e.g. https://luistorrescatas.com).
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cataswebsite.vercel.app').replace(/\/$/, '');
export const SITE_NAME = 'Catas Luis de Torres';
const INSTAGRAM = 'https://www.instagram.com/luistorrescatas/';

export type PageKey = 'home' | 'tastings' | 'media' | 'about' | 'contact';
const PATHS: Record<PageKey, string> = {home: '', tastings: '/tastings', media: '/media', about: '/about', contact: '/contact'};
export const pagePaths = Object.values(PATHS);

/** Title, description, canonical and language alternates for a page, in the given language. */
export async function pageMetadata(locale: Locale, page: PageKey): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'meta'});
  const title = t(`${page}.title`);
  const description = t(`${page}.description`);
  const path = PATHS[page];
  const other = locales.find((l) => l !== locale);
  // Nested pages do not inherit the segment's generated image once they set their own openGraph, so attach it explicitly.
  const image = `/${locale}/opengraph-image`;

  return {
    title: page === 'home' ? {absolute: title} : title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {en: `/en${path}`, es: `/es${path}`, 'x-default': `/en${path}`}
    },
    openGraph: {
      title,
      description,
      url: `/${locale}${path}`,
      siteName: SITE_NAME,
      type: 'website',
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      alternateLocale: other === 'es' ? 'es_ES' : 'en_US',
      images: [{url: image, width: 1200, height: 630, alt: SITE_NAME}]
    },
    twitter: {card: 'summary_large_image', title, description, images: [image]}
  };
}

/** Site-wide structured data: the website and the person behind it. */
export function buildJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {'@type': 'WebSite', '@id': `${siteUrl}/#website`, name: SITE_NAME, url: `${siteUrl}/${locale}`, inLanguage: locale},
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: 'Luis de Torres',
        jobTitle: locale === 'es' ? 'Historiador del arte y narrador del vino' : 'Art historian and wine storyteller',
        url: `${siteUrl}/${locale}/about`,
        sameAs: [INSTAGRAM]
      }
    ]
  };
}

/** Structured data for the upcoming tastings (Google event listings). `<` is escaped so it can sit inside a script tag. */
export function buildEventsJsonLd(locale: Locale, tastings: Tasting[]) {
  if (tastings.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@graph': tastings.map((t) => ({
      '@type': 'Event',
      name: t.title,
      description: t.description,
      startDate: t.time ? madridLocalToIso(`${t.isoDate}T${t.time}`) : t.isoDate,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {'@type': 'Place', name: t.city, address: {'@type': 'PostalAddress', addressLocality: t.city}},
      image: t.image.startsWith('http') ? t.image : `${siteUrl}${t.image}`,
      organizer: {'@id': `${siteUrl}/#person`},
      ...(t.price !== undefined
        ? {
            offers: {
              '@type': 'Offer',
              price: t.price,
              priceCurrency: 'EUR',
              url: `${siteUrl}/${locale}/tastings`,
              availability: 'https://schema.org/InStock'
            }
          }
        : {})
    }))
  };
}

export const jsonLdScript = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
