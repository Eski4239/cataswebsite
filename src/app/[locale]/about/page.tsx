import {getTranslations} from 'next-intl/server';

export default async function AboutPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'about'});

  return (
    <section className="section-shell pt-40">
      <h1 className="font-heading text-6xl">{t('title')}</h1>
      <p className="mt-6 max-w-3xl text-muted">{t('description')}</p>
    </section>
  );
}
