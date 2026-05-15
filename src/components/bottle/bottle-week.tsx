import Image from 'next/image';
import {bottleOfWeek} from '@/lib/utils/mock-data';
import {SectionHeading} from '@/components/ui/section-heading';

export function BottleOfWeek() {
  return (
    <section className='section-shell grid gap-10 lg:grid-cols-[1.2fr_1fr]'>
      <Image src={bottleOfWeek.image} alt={bottleOfWeek.wineName} width={900} height={1200} className='h-full w-full rounded-3xl object-cover' />
      <article>
        <SectionHeading label='Collectible Selection' title={bottleOfWeek.wineName} description={`${bottleOfWeek.winery} · ${bottleOfWeek.region}`} />
        <p className='text-muted'>{bottleOfWeek.story}</p>
        <p className='mt-6'><span className='meta-label'>Tasting Notes</span><br />{bottleOfWeek.tastingNotes}</p>
        <p className='mt-6 border-l border-gold pl-4 text-muted'>Why this bottle matters: {bottleOfWeek.whyThisMatters}</p>
      </article>
    </section>
  );
}
