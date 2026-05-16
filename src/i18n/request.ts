import {getRequestConfig} from 'next-intl/server';

import {defaultLocale, locales} from '@/lib/i18n/routing';

export default getRequestConfig(async ({requestLocale}) => {
  const locale =
    locales.includes((await requestLocale) as any)
      ? await requestLocale
      : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});