import {setRequestLocale} from 'next-intl/server';
import {Locale} from 'next-intl';
import {buildMetadata} from '@/lib/metadata';

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