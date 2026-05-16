import createMiddleware from 'next-intl/middleware';
import {defaultLocale, locales} from '@/lib/i18n/routing';

export default createMiddleware({
  locales,
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always'
});

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)']
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
export default createMiddleware({locales: [...locales], defaultLocale});

export const config = {
  matcher: ['/', '/(en|es)/:path*']
};
