// Tastings page — upcoming tasting experiences (content/tastings.json) with ticket modal
import {setRequestLocale} from 'next-intl/server';
import {TastingsPage} from '@/components/tastings/TastingsPage';
import {getTastings} from '@/lib/content';
import type {Locale} from '@/lib/i18n/routing';
import {buildEventsJsonLd, jsonLdScript, pageMetadata} from '@/lib/seo/metadata';

// Re-render periodically so tastings drop off automatically once their date has passed
export const revalidate = 900;

type Props = {params: Promise<{locale: Locale}>};

export async function generateMetadata({params}: Props) {
  const {locale} = await params;
  return pageMetadata(locale, 'tastings');
}

export default async function Page({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const tastings = await getTastings(locale);
  const events = buildEventsJsonLd(locale, tastings);

  return (
    <>
      {events && <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLdScript(events)}} />}
      <TastingsPage tastings={tastings} />
    </>
  );
}
