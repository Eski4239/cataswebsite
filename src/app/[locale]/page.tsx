import {setRequestLocale, getTranslations} from 'next-intl/server';
import type {Locale} from '@/lib/i18n/routing';
import {pageMetadata} from '@/lib/seo/metadata';
import Image from 'next/image';
import Link from 'next/link';
import {FadeUp} from '@/components/motion/fade-up';
import {getBottleOfWeek, getTastings} from '@/lib/content';

// Re-render periodically so scheduled reels appear and past tastings drop off
export const revalidate = 900;

type Props = {
  params: Promise<{locale: Locale}>;
};

export async function generateMetadata({params}: Props) {
  const {locale} = await params;
  return pageMetadata(locale, 'home');
}

export default async function Home({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const hero = await getTranslations('hero');
  const philosophy = await getTranslations('philosophy');
  const bottle = await getTranslations('bottle');
  const tastingsHome = await getTranslations('tastingsHome');
  const bottleContent = await getBottleOfWeek(locale);
  const upcoming = (await getTastings(locale)).slice(0, 2);

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ivory">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none">
          <span className="font-heading text-[28rem] leading-none text-burgundy/[0.04]">W</span>
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <FadeUp>
            <h1 className="font-heading text-5xl font-light leading-[1.1] text-charcoal md:text-7xl lg:text-8xl">{hero('heading')}</h1>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted md:text-xl">{hero('subheading')}</p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <Link
              href={`/${locale}/media`}
              className="mt-10 inline-block border border-burgundy px-8 py-3.5 text-sm uppercase tracking-[0.18em] text-burgundy transition-colors duration-300 hover:bg-burgundy hover:text-ivory"
            >
              {hero('cta')}
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="section-shell">
        <div className="mx-auto max-w-3xl text-center">
          <FadeUp>
            <h2 className="font-heading text-4xl font-light text-charcoal md:text-5xl">{philosophy('heading')}</h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-8 text-lg leading-relaxed text-muted">{philosophy('body')}</p>
          </FadeUp>
        </div>
      </section>

      {/* BOTTLE OF THE WEEK */}
      <section className="section-shell">
        <FadeUp>
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 h-px w-16 bg-burgundy" />
            <h2 className="font-heading text-4xl font-light text-charcoal md:text-5xl">{bottle('heading')}</h2>
            <article className="mt-10 rounded-2xl border border-border bg-surface p-8 md:p-12">
              {bottleContent.image && (
                <div className="relative mb-8 h-64 w-full overflow-hidden rounded-xl">
                  <Image
                    src={bottleContent.image}
                    alt={bottleContent.wineName}
                    fill
                    sizes="(min-width: 768px) 672px, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <p className="meta-label text-burgundy">{bottleContent.region}</p>
              <h3 className="mt-3 font-heading text-3xl text-charcoal md:text-4xl">{bottleContent.wineName}</h3>
              <p className="mt-2 text-sm text-muted">{bottleContent.winery}</p>
              <div className="mt-6 space-y-4 text-muted">
                <p>
                  <span className="meta-label mr-2 text-charcoal">{bottle('tastingNotesLabel')}</span>
                  <br />
                  {bottleContent.tastingNotes}
                </p>
                <p className="border-l-2 border-gold pl-4 italic">{bottleContent.story}</p>
              </div>
            </article>
          </div>
        </FadeUp>
      </section>

      {/* UPCOMING TASTINGS */}
      <section className="section-shell">
        <FadeUp>
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-heading text-4xl font-light text-charcoal md:text-5xl">{tastingsHome('heading')}</h2>
            {upcoming.length === 0 ? (
              <p className="mt-12 text-center font-heading text-2xl italic text-muted">{tastingsHome('empty')}</p>
            ) : (
              <div className="mt-12 grid gap-8 md:grid-cols-2">
                {upcoming.map((tasting) => (
                  <article key={tasting.id} className="rounded-2xl border border-border bg-surface p-8">
                    <p className="meta-label">
                      {tasting.dateLabel} · {tasting.city}
                    </p>
                    <h3 className="mt-3 font-heading text-2xl text-charcoal md:text-3xl">{tasting.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{tasting.description}</p>
                    <Link
                      href={`/${locale}/contact`}
                      className="mt-6 inline-block border border-burgundy px-6 py-2.5 text-xs uppercase tracking-[0.16em] text-burgundy transition-colors duration-300 hover:bg-burgundy hover:text-ivory"
                    >
                      {tastingsHome('requestInvitation')}
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </FadeUp>
      </section>
    </>
  );
}
