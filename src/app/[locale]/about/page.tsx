import {getTranslations} from 'next-intl/server';
import Image from 'next/image';
import {getAboutContent} from '@/lib/sanity/queries';
import {urlFor} from '@/lib/sanity/client';

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

      {content.portrait && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-border">
          <Image
            src={urlFor(content.portrait).width(900).height(600).url()}
            alt="Luis Torres"
            width={900}
            height={600}
            className="h-auto w-full object-cover"
            priority
          />
        </div>
      )}

      {content.philosophy && (
        <p className="mt-12 max-w-3xl text-lg leading-relaxed text-muted">
          {content.philosophy}
        </p>
      )}

      {content.timeline && content.timeline.length > 0 && (
        <div className="mt-16 max-w-2xl">
          <div className="space-y-6 border-l-2 border-burgundy/30 pl-6">
            {content.timeline.map((item: string, i: number) => (
              <p key={i} className="text-muted">{item}</p>
            ))}
          </div>
        </div>
      )}

      {content.quote && (
        <blockquote className="mt-16 max-w-2xl border-l-4 border-gold pl-6">
          <p className="font-heading text-3xl italic leading-snug text-charcoal md:text-4xl">
            &ldquo;{content.quote}&rdquo;
          </p>
        </blockquote>
      )}
    </section>
  );
}
