import {setRequestLocale} from 'next-intl/server';
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

  const reels = await getReels(locale);

  return (
    <div className="pt-28">
      <section className="section-shell pb-12">
        <FadeUp>
          <h1 className="font-heading text-5xl font-light text-charcoal md:text-7xl">
            Stories in Motion
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Wine history told through cinematic reels.
          </p>
        </FadeUp>
      </section>

      <ReelsGrid reels={reels} />
    </div>
  );
}
