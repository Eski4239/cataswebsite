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
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <p className="text-center font-heading text-2xl italic text-muted">
          Stories coming soon.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 pb-10 md:px-10">
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
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 md:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((reel) => (
            <FadeUp key={reel.instagramUrl}>
              <article>
                <div className="mx-auto max-w-[400px]">
                  <blockquote
                    className="instagram-media"
                    data-instgrm-permalink={reel.instagramUrl}
                    data-instgrm-version="14"
                    style={{
                      background: '#FFF',
                      border: 0,
                      borderRadius: '12px',
                      margin: 0,
                      maxWidth: '400px',
                      width: '100%',
                      padding: 0,
                    }}
                  />
                </div>
                <div className="mt-4">
                  <p className="meta-label text-burgundy">{reel.category}</p>
                  <h3 className="mt-2 font-heading text-2xl text-charcoal">
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
      </div>
    </>
  );
}
