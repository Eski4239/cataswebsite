// Locale layout — the site's root layout: sets <html lang>, fonts, base metadata, structured data,
// translations, navbar and footer for every page.
import '../globals.css';
import {Analytics} from '@vercel/analytics/next';
import type {Metadata} from 'next';
import {Cormorant_Garamond, Inter} from 'next/font/google';
import {notFound} from 'next/navigation';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations, setRequestLocale} from 'next-intl/server';

import {Footer} from '@/components/layout/footer';
import {Navbar} from '@/components/layout/navbar';
import {isLocale, locales} from '@/lib/i18n/routing';
import {SITE_NAME, buildJsonLd, jsonLdScript, siteUrl} from '@/lib/seo/metadata';

const inter = Inter({subsets: ['latin'], variable: '--font-inter'});

// Only the weights the design uses; real italics instead of browser-faked ones.
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant'
});

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    applicationName: SITE_NAME,
    title: {default: SITE_NAME, template: `%s | ${SITE_NAME}`}
  };
}

export default async function LocaleLayout({children, params}: {children: React.ReactNode; params: Promise<{locale: string}>}) {
  const {locale} = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const nav = await getTranslations({locale, namespace: 'nav'});

  return (
    <html lang={locale} className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        {/* Without JavaScript the scroll animations never run, so show everything. */}
        <noscript>
          <style>{`[data-fade] { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-burgundy focus:px-4 focus:py-2 focus:text-ivory"
        >
          {nav('skip')}
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLdScript(buildJsonLd(locale))}} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar locale={locale} />
          <main id="main">{children}</main>
          <Footer />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
