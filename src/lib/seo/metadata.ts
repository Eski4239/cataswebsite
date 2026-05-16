// SEO metadata — generates page metadata, Open Graph, and JSON-LD for all locales
import type {Metadata} from 'next';
import type {Locale} from '@/lib/i18n/routing';

const siteUrl = 'https://luistorrescatas.com';

export function buildMetadata(locale: Locale, path = '', title?: string, description?: string): Metadata {
  const canonical = `${siteUrl}/${locale}${path}`;
  const defaultTitle = 'Catas Luis de Torres | Cinematic Wine Storytelling';
  const defaultDescription = 'A cinematic luxury editorial platform exploring wine through stories, history, travel, and private tasting experiences.';

  return {
    metadataBase: new URL(siteUrl),
    title: title ?? defaultTitle,
    description: description ?? defaultDescription,
    alternates: {canonical, languages: {en: `${siteUrl}/en${path}`, es: `${siteUrl}/es${path}`}},
    openGraph: {title: title ?? defaultTitle, description: description ?? defaultDescription, url: canonical, type: 'website'},
    twitter: {card: 'summary_large_image', title: title ?? defaultTitle, description: description ?? defaultDescription}
  };
}

export function buildJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {'@type': 'Person', name: 'Catas Luis de Torres', jobTitle: 'Wine Storyteller', url: `${siteUrl}/${locale}`},
      {'@type': 'Organization', name: 'Catas Luis de Torres', url: `${siteUrl}/${locale}`}
    ]
  };
}
