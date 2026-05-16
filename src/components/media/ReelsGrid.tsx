'use client';

import {useEffect, useState} from 'react';
import type {Reel} from '@/lib/sanity/queries';
import {FadeUp} from '@/components/motion/fade-up';

const categories = ['All', 'History', 'Regions', 'Grapes', 'Tastings', 'Beginner Guides'];

export function ReelsGrid({reels}: {reels: Reel[]}) {
  const [active, setActive] = useState('All');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existing = document.querySelector('script[src*="instagram.com/embed.js"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = '//www.instagram.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      } else if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process();
      }
    }
  }, [active]);

  const filtered = active === 'All' ? reels : reels.filter((r) => r.category === active);

  if (reels.length === 0) {
    return (
      <section className="section-shell pt-0">
        <p className="text-center font-heading text-2xl text-muted italic">
          Stories coming soon.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="section-shell pt-0 pb-16">
        <FadeUp delay={0.1}>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`border px-5 py-2 text-xs uppercase tracking-[0.16em] transition-colors duration-300 ${
                  cat === active
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

      <section className="section-shell pt-0">
        <div className="columns-1 gap-8 md:columns-2 xl:columns-3">
          {filtered.map((reel) => (
            <FadeUp key={reel.instagramUrl}>
              <article className="mb-8 break-inside-avoid">
                <blockquote
                  className="instagram-media"
                  data-instgrm-permalink={reel.instagramUrl}
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
    </>
  );
}
