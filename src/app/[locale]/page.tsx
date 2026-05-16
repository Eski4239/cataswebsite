import type {Metadata} from 'next';
import {HeroSection} from '@/components/hero/hero-section';
import {FeaturedReel, MediaHighlights} from '@/components/reels/reel-sections';
import {BottleOfWeek} from '@/components/bottle/bottle-week';
import {UpcomingTastings} from '@/components/tastings/upcoming';
import {JournalForm} from '@/components/newsletter/journal-form';
import {buildJsonLd, buildMetadata} from '@/lib/seo/metadata';
import type {Locale} from '@/types/content';

export async function generateMetadata({params}: {params: {locale: Locale}}): Promise<Metadata> {
  return buildMetadata(params.locale);
}

export default function Home({params}: {params: {locale: Locale}}) {
  const {locale} = params;
export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}): Promise<Metadata> {
  const {locale} = await params;
  return buildMetadata(locale);
}

export default async function Home({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const jsonLd = buildJsonLd(locale);

  return (
    <>
      <script type='application/ld+json' dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} />
      <HeroSection locale={locale} />
      <FeaturedReel />
      <section className='section-shell grid gap-10 lg:grid-cols-2'>
        <div className='h-[500px] rounded-3xl bg-[url(https://images.unsplash.com/photo-1559561853-08451507cbe7?q=80&w=1100)] bg-cover bg-center' />
        <article>
          <p className='meta-label'>Philosophy</p>
          <h2 className='mt-3 font-heading text-5xl'>Wine is one of the few ways we can taste history.</h2>
          <p className='mt-5 text-muted'>Each narrative brings people, places, memory, and human connection into one shared glass.</p>
        </article>
      </section>
      <MediaHighlights />
      <BottleOfWeek />
      <UpcomingTastings />
      <JournalForm />
    </>
  );
}
