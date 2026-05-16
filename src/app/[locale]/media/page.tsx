'use client';

import {useEffect} from 'react';
import {FadeUp} from '@/components/motion/fade-up';

const categories = ['All', 'History', 'Regions', 'Grapes', 'Tastings'];

const reels = [
  {
    url: 'https://www.instagram.com/reel/example1/',
    title: 'The Monasteries That Saved Rioja',
    description: 'How monastic cellars preserved winemaking traditions through centuries of upheaval.',
    category: 'History',
  },
  {
    url: 'https://www.instagram.com/reel/example2/',
    title: 'Volcanic Wines of Etna',
    description: 'Altitude, lava soils, and tradition define the aromatic precision of Sicily.',
    category: 'Regions',
  },
  {
    url: 'https://www.instagram.com/reel/example3/',
    title: 'Reading a Glass of Burgundy',
    description: "Structure, texture, and terroir — a beginner’s lens into Pinot Noir.",
    category: 'Grapes',
  },
];

export default function MediaPage() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).instgrm) {
      const script = document.createElement('script');
      script.src = '//www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    } else if ((window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    }
  }, []);

  return (
    <div className="pt-28">
      {/* HERO */}
      <section className="section-shell pb-12">
        <FadeUp>
          <h1 className="font-heading text-5xl font-light text-charcoal md:text-7xl">
            Stories in Motion
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Wine history told through cinematic reels.
          </p>
        </FadeUp>
      </section>

      {/* CATEGORY FILTERS */}
      <section className="section-shell pt-0 pb-16">
        <FadeUp delay={0.1}>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`border px-5 py-2 text-xs uppercase tracking-[0.16em] transition-colors duration-300 ${
                  cat === 'All'
                    ? 'border-burgundy bg-burgundy text-ivory'
                    : 'border-border text-charcoal hover:border-burgundy hover:text-burgundy'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* REEL GRID */}
      <section className="section-shell pt-0">
        <div className="columns-1 gap-8 md:columns-2 xl:columns-3">
          {reels.map((reel) => (
            <FadeUp key={reel.url}>
              <article className="mb-8 break-inside-avoid">
                <blockquote
                  className="instagram-media"
                  data-instgrm-permalink={reel.url}
                  data-instgrm-version="14"
                  style={{
                    background: '#FFF',
                    border: 0,
                    borderRadius: '12px',
                    margin: 0,
                    maxWidth: '540px',
                    width: '100%',
                    padding: 0,
                  }}
                />
                <div className="mt-4">
                  <p className="meta-label text-burgundy">{reel.category}</p>
                  <h3 className="mt-2 font-heading text-2xl text-charcoal md:text-3xl">
                    {reel.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {reel.description}
                  </p>
                </div>
              </article>
            </FadeUp>
          ))}
        </div>
      </section>
    </div>
  );
}
