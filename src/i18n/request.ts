import {getRequestConfig} from 'next-intl/server';
import {defaultLocale, locales, type Locale} from '@/lib/i18n/routing';

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale: Locale = locales.includes(requested as Locale) ? (requested as Locale) : defaultLocale;

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default
import {defaultLocale, locales} from '@/lib/i18n/routing';

export default getRequestConfig(async ({locale}) => {
  const activeLocale = locales.includes((locale ?? defaultLocale) as (typeof locales)[number])
    ? (locale as (typeof locales)[number])
    : defaultLocale;

  return {
    locale: activeLocale,
    messages: (await import(`@/messages/${activeLocale}.json`)).default
  };
});
