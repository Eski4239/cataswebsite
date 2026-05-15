import {reels} from '@/lib/utils/mock-data';
import {FadeUp} from '@/components/motion/fade-up';
import {SectionHeading} from '@/components/ui/section-heading';

function ReelFrame({title, src}: {title: string; src: string}) {
  return <iframe loading='lazy' title={title} src={src} className='aspect-[9/16] w-full rounded-2xl border border-border bg-black' />;
}

export function FeaturedReel() {
  const reel = reels.find((item) => item.featured) ?? reels[0];
  return (
    <section className='section-shell'>
      <FadeUp>
        <div className='grid gap-8 rounded-3xl border border-gold/60 bg-surface/70 p-6 shadow-cinematic md:grid-cols-2'>
          <ReelFrame title={reel.title} src={reel.instagramUrl} />
          <article>
            <p className='meta-label'>{reel.category}</p>
            <h2 className='mt-4 font-heading text-4xl md:text-5xl'>{reel.title}</h2>
            <p className='mt-4 text-muted'>{reel.description}</p>
            <p className='mt-6 text-sm uppercase tracking-[0.2em] text-gold'>{reel.region}</p>
          </article>
        </div>
      </FadeUp>
    </section>
  );
}

export function MediaHighlights() {
  return (
    <section className='section-shell pt-0'>
      <SectionHeading title='Media Highlights' description='A curated reel selection across history, regions, and rare bottles.' />
      <div className='columns-1 gap-6 md:columns-2 xl:columns-3'>
        {reels.map((reel) => (
          <article key={reel.slug} className='mb-6 break-inside-avoid rounded-2xl border border-border bg-surface p-5 transition duration-500 hover:-translate-y-1 hover:border-gold/70'>
            <ReelFrame title={reel.title} src={reel.instagramUrl} />
            <p className='meta-label mt-4'>{reel.category}</p>
            <h3 className='mt-2 font-heading text-3xl'>{reel.title}</h3>
            <p className='mt-2 text-sm text-muted'>{reel.description}</p>
            <p className='mt-4 text-xs uppercase tracking-[0.2em] text-gold'>{reel.region}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
