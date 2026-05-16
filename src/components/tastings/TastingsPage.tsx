'use client';

import {useState} from 'react';
import {FadeUp} from '@/components/motion/fade-up';
import {TastingModal} from '@/components/tastings/TastingModal';

const tasting = {
  title: 'Candlelight Rioja Archive',
  city: 'Miami',
  date: 'June 28, 2026',
  time: '7:30 PM',
  description: 'A private vertical tasting with historical context and reflective pacing. Intimate setting, limited to twelve guests.',
  longDescription: 'An evening devoted to the great reserves of Rioja Alta — wines aged patiently in American oak, drawn from cellars that have practiced restraint for over a century. Each pour is paired with its historical moment: the phylloxera recovery, the cooperative movement, the quiet revolution of temperature-controlled fermentation. Candlelight, unhurried conversation, and the kind of silence that only old wine can teach.',
  price: 85,
  image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200',
};

export function TastingsPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
        <FadeUp>
          <h1 className="font-heading text-5xl font-light text-charcoal md:text-7xl">
            Upcoming Experiences
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Intimate, invitation-based gatherings centered on stories, terroir, and cultural context.
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
              <p className="mt-4 text-sm font-medium text-burgundy">€{tasting.price} per person</p>
              <button className="mt-4 border border-burgundy px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-burgundy transition-colors duration-300 hover:bg-burgundy hover:text-ivory">
                View Details
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
