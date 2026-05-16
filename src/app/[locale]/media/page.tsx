// Media page — fetches reels from Sanity and renders the Instagram embed grid
import {setRequestLocale, getTranslations} from 'next-intl/server';
import type {Locale} from '@/lib/i18n/routing';
import {getReels} from '@/lib/sanity/queries';
import {FadeUp} from '@/components/motion/fade-up';
import {ReelsGrid} from '@/components/media/ReelsGrid';

type Props = {
  params: Promise<{locale: Locale}>;
};

export default async function MediaPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('media');
  const reels = await getReels(locale);

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-12 md:px-10">
        <FadeUp>
          <h1 className="font-heading text-5xl font-light text-charcoal md:text-7xl">
            {t('heading')}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            {t('subheading')}
          </p>
        </FadeUp>
      </section>

      <ReelsGrid reels={reels} />
    </div>
  );
}
