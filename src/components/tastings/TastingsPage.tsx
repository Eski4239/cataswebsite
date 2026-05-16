'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {FadeUp} from '@/components/motion/fade-up';
import {TastingModal} from '@/components/tastings/TastingModal';

export function TastingsPage() {
  const t = useTranslations('tastings');
  const [modalOpen, setModalOpen] = useState(false);

  const tasting = {
    title: t('title'),
    city: t('city'),
    date: t('date'),
    time: t('time'),
    description: t('description'),
    longDescription: t('longDescription'),
    price: 85,
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200',
  };

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
        <FadeUp>
          <h1 className="font-heading text-5xl font-light text-charcoal md:text-7xl">
            {t('heading')}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            {t('subheading')}
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          <article
            onClick={() => setModalOpen(true)}
            className="mt-12 max-w-lg cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface transition-shadow duration-300 hover:shadow-lg"
          >
            <img
              src={tasting.image}
              alt={tasting.title}
              className="h-56 w-full object-cover"
            />
            <div className="p-6">
              <p className="meta-label">{tasting.date} · {tasting.city}</p>
              <h3 className="mt-3 font-heading text-3xl text-charcoal">{tasting.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{tasting.description}</p>
              <p className="mt-4 text-sm font-medium text-burgundy">€{tasting.price} {t('perPerson')}</p>
              <button className="mt-4 border border-burgundy px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-burgundy transition-colors duration-300 hover:bg-burgundy hover:text-ivory">
                {t('viewDetails')}
              </button>
            </div>
          </article>
        </FadeUp>
      </section>

      {modalOpen && (
        <TastingModal tasting={tasting} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
