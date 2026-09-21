// TastingsPage — displays tasting cards (from content/tastings.json) with click-to-open ticket modal
'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import type {Tasting} from '@/lib/content';
import {FadeUp} from '@/components/motion/fade-up';
import {TastingModal} from '@/components/tastings/TastingModal';

export function TastingsPage({tastings}: {tastings: Tasting[]}) {
  const t = useTranslations('tastings');
  const [selected, setSelected] = useState<Tasting | null>(null);

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
        <FadeUp>
          <h1 className="font-heading text-5xl font-light text-charcoal md:text-7xl">{t('heading')}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{t('subheading')}</p>
        </FadeUp>

        {tastings.length === 0 ? (
          <p className="mt-16 max-w-xl font-heading text-2xl italic text-muted">{t('empty')}</p>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {tastings.map((tasting, i) => (
              <FadeUp key={tasting.id} delay={0.1 + i * 0.05}>
                <article
                  onClick={() => setSelected(tasting)}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface transition-shadow duration-300 hover:shadow-lg"
                >
                  <img src={tasting.image} alt={tasting.title} className="h-56 w-full object-cover" />
                  <div className="p-6">
                    <p className="meta-label">
                      {tasting.dateLabel} · {tasting.city}
                    </p>
                    <h3 className="mt-3 font-heading text-3xl text-charcoal">{tasting.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{tasting.description}</p>
                    {tasting.price !== undefined && (
                      <p className="mt-4 text-sm font-medium text-burgundy">
                        €{tasting.price} {t('perPerson')}
                      </p>
                    )}
                    <button className="mt-4 border border-burgundy px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-burgundy transition-colors duration-300 hover:bg-burgundy hover:text-ivory">
                      {t('viewDetails')}
                    </button>
                  </div>
                </article>
              </FadeUp>
            ))}
          </div>
        )}
      </section>

      {selected && <TastingModal tasting={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
