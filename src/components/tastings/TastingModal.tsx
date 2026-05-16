// TastingModal — ticket reservation modal with quantity selector and mailto CTA
'use client';

import {useState, useEffect} from 'react';
import {useTranslations} from 'next-intl';

type Tasting = {
  title: string;
  city: string;
  date: string;
  time: string;
  longDescription: string;
  price: number;
  image: string;
};

export function TastingModal({tasting, onClose}: {tasting: Tasting; onClose: () => void}) {
  const t = useTranslations('tastings.modal');
  const [quantity, setQuantity] = useState(1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const total = tasting.price * quantity;

  const subject = t('emailSubject', {title: tasting.title});
  const body = t('emailBody', {quantity: String(quantity), title: tasting.title, date: tasting.date});
  const mailtoHref = `mailto:luis@luistorrescatas.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div
        className={`relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-ivory shadow-2xl transition-transform duration-300 ${visible ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-charcoal transition-colors hover:bg-white"
        >
          ✕
        </button>

        <img
          src={tasting.image}
          alt={tasting.title}
          className="h-56 w-full object-cover sm:h-64"
        />

        <div className="p-6 sm:p-8">
          <h2 className="font-heading text-3xl text-charcoal sm:text-4xl">
            {tasting.title}
          </h2>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            <span>{tasting.date}</span>
            <span>{tasting.time}</span>
            <span>{tasting.city}</span>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-muted">
            {tasting.longDescription}
          </p>

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-sm text-muted">€{tasting.price} per person</p>

            <div className="mt-4 flex items-center gap-4">
              <span className="text-xs uppercase tracking-[0.16em] text-charcoal">{t('guests')}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-charcoal transition-colors hover:border-burgundy"
                >
                  −
                </button>
                <span className="w-6 text-center font-heading text-xl text-charcoal">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(4, quantity + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-charcoal transition-colors hover:border-burgundy"
                >
                  +
                </button>
              </div>
            </div>

            <p className="mt-4 font-heading text-2xl text-charcoal">
              {t('total')}: €{total}
            </p>

            <a
              href={mailtoHref}
              className="mt-6 block w-full border border-burgundy bg-burgundy py-3.5 text-center text-xs uppercase tracking-[0.18em] text-ivory transition-colors duration-300 hover:bg-burgundy/90"
            >
              {t('reserve')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
