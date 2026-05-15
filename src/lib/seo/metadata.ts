import type {Metadata} from 'next';
import type {Locale} from '@/types/content';

const siteUrl = 'https://luistorrescatas.com';

export function buildMetadata(locale: Locale, path = '', title?: string, description?: string): Metadata {
  const canonical = `${siteUrl}/${locale}${path}`;
  const defaultTitle = 'Luis Torres Catas | Cinematic Wine Storytelling';
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
      {'@type': 'Person', name: 'Luis Torres Catas', jobTitle: 'Wine Storyteller', url: `${siteUrl}/${locale}`},
      {'@type': 'Organization', name: 'Luis Torres Catas', url: `${siteUrl}/${locale}`}
    ]
  };
}
