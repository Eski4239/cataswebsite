import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {locales} from '@/lib/i18n/routing';
import {Navbar} from '@/components/layout/navbar';
import {Footer} from '@/components/layout/footer';

export default async function LocaleLayout({children, params}:{children:React.ReactNode; params: Promise<{locale:string}>}) {
  const {locale} = await params;
  if (!locales.includes(locale as any)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Navbar locale={locale} />
      <main>{children}</main>
      <Footer />
    </NextIntlClientProvider>
  );
}
