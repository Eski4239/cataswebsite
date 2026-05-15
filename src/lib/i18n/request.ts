import {getRequestConfig} from 'next-intl/server';
import {locales, defaultLocale} from './routing';

export default getRequestConfig(async ({locale}) => {
  const safeLocale = locales.includes((locale ?? defaultLocale) as any) ? locale! : defaultLocale;
  return {messages: (await import(`@/messages/${safeLocale}.json`)).default, locale: safeLocale};
});
