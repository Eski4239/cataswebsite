// Tastings page — upcoming tasting experiences (content/tastings.json) with ticket modal
import {setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/lib/i18n/routing';
import {getTastings} from '@/lib/content';
import {TastingsPage} from '@/components/tastings/TastingsPage';

// Re-render periodically so tastings drop off automatically once their date has passed
export const revalidate = 900;

export default async function Page({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <TastingsPage tastings={await getTastings(locale)} />;
}
