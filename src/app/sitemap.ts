import type {MetadataRoute} from 'next';
import {locales} from '@/lib/i18n/routing';
import {pagePaths, siteUrl} from '@/lib/seo/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return pagePaths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified,
      changeFrequency: path === '' || path === '/media' || path === '/tastings' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.7,
      alternates: {languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${path}`]))}
    }))
  );
}
