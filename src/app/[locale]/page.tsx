import {setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/lib/i18n/routing';
import {buildMetadata} from '@/lib/seo/metadata';

type Props = {
  params: Promise<{locale: Locale}>;
};

export async function generateMetadata({params}: Props) {
  const {locale} = await params;
  return buildMetadata(locale);
}

export default async function Home({params}: Props) {
  const {locale} = await params;

  setRequestLocale(locale);

  return (
    <div>
      <h1>Welcome</h1>
    </div>
  );
}