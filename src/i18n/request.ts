import {getRequestConfig} from 'next-intl/server';
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
