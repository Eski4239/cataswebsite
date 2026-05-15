import Image from 'next/image';
import {tastings} from '@/lib/utils/mock-data';
import {SectionHeading} from '@/components/ui/section-heading';

export function UpcomingTastings() {
  return (
    <section className='section-shell'>
      <SectionHeading title='Upcoming Tastings' description='Intimate, invitation-based gatherings centered on stories, terroir, and cultural context.' />
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {tastings.map((tasting) => (
          <article key={tasting.title} className='overflow-hidden rounded-2xl border border-border bg-surface'>
            <Image loading='lazy' src={tasting.image} alt={tasting.title} width={640} height={420} className='h-48 w-full object-cover' />
            <div className='p-5'>
              <p className='meta-label'>{tasting.date} · {tasting.city}</p>
              <h3 className='mt-3 font-heading text-3xl'>{tasting.title}</h3>
              <p className='mt-2 text-sm text-muted'>{tasting.description}</p>
              <p className='mt-3 text-gold'>{tasting.availability}</p>
              <button className='mt-4 border border-gold px-4 py-2 text-sm uppercase tracking-[0.12em]'>{tasting.cta}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
