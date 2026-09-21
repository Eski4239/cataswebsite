import Image from 'next/image';
import {getTranslations} from 'next-intl/server';
import {getAboutContent} from '@/lib/content';
import type {Locale} from '@/lib/i18n/routing';
import {pageMetadata} from '@/lib/seo/metadata';

export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return pageMetadata(locale, 'about');
}

export default async function AboutPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'about'});
  const content = await getAboutContent(locale);

  if (!content) {
    return (
      <section className="section-shell pt-40">
        <h1 className="font-heading text-6xl text-charcoal">{t('title')}</h1>
        <p className="mt-6 max-w-3xl text-muted">{t('description')}</p>
      </section>
    );
  }

  return (
    <section className="section-shell pt-40">
      <h1 className="font-heading text-6xl text-charcoal">{t('title')}</h1>

      {/* Photo beside the text on desktop (so the bio is visible without scrolling past a huge portrait), stacked on mobile. */}
      <div className={`mt-10 grid gap-10 ${content.portrait ? 'md:grid-cols-[5fr_7fr] md:gap-16' : ''}`}>
        {content.portrait && (
          <div className="mx-auto w-full max-w-sm md:sticky md:top-28 md:max-w-none md:self-start">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border">
              <Image
                src={content.portrait}
                alt={t('portraitAlt')}
                fill
                sizes="(min-width: 768px) 40vw, (min-width: 384px) 384px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        <div>
          {content.philosophy && <p className="max-w-3xl text-lg leading-relaxed text-muted">{content.philosophy}</p>}

          {content.timeline && content.timeline.length > 0 && (
            <div className="mt-12 max-w-2xl">
              <div className="space-y-6 border-l-2 border-burgundy/30 pl-6">
                {content.timeline.map((item: string, i: number) => (
                  <p key={i} className="text-muted">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          )}

          {content.quote && (
            <blockquote className="mt-12 max-w-2xl border-l-4 border-gold pl-6">
              <p className="font-heading text-3xl italic leading-snug text-charcoal md:text-4xl">&ldquo;{content.quote}&rdquo;</p>
            </blockquote>
          )}
        </div>
      </div>
    </section>
  );
}
