// TastingModal — accessible details dialog with quantity selector and reservation email link
'use client';

import Image from 'next/image';
import {useEffect, useId, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';

import type {Tasting} from '@/lib/content';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function TastingModal({tasting, onClose}: {tasting: Tasting; onClose: () => void}) {
  const t = useTranslations('tastings.modal');
  const tt = useTranslations('tastings');
  const [quantity, setQuantity] = useState(1);
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    // Escape closes; Tab stays inside the dialog.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      opener?.focus(); // give focus back to the button that opened the dialog
    };
  }, [onClose]);

  const total = (tasting.price ?? 0) * quantity;

  const subject = t('emailSubject', {title: tasting.title});
  const body = t('emailBody', {quantity: String(quantity), title: tasting.title, date: tasting.dateLabel});
  const mailtoHref = `mailto:luis@luistorrescatas.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-ivory shadow-2xl transition-transform duration-300 ${visible ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label={t('close')}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-charcoal transition-colors hover:bg-white"
        >
          <span aria-hidden="true">✕</span>
        </button>

        <div className="relative h-56 sm:h-64">
          <Image src={tasting.image} alt="" fill sizes="(min-width: 512px) 512px, 100vw" className="object-cover" />
        </div>

        <div className="p-6 sm:p-8">
          <h2 id={titleId} className="font-heading text-3xl text-charcoal sm:text-4xl">
            {tasting.title}
          </h2>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            <span>{tasting.dateLabel}</span>
            {tasting.timeLabel && <span>{tasting.timeLabel}</span>}
            <span>{tasting.city}</span>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-muted">{tasting.longDescription}</p>

          <div className="mt-8 border-t border-border pt-6">
            {tasting.price !== undefined && (
              <>
                <p className="text-sm text-muted">
                  €{tasting.price} {tt('perPerson')}
                </p>

                <div className="mt-4 flex items-center gap-4">
                  <span className="text-xs uppercase tracking-[0.16em] text-charcoal">{t('guests')}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      aria-label={t('decrease')}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-charcoal transition-colors hover:border-burgundy"
                    >
                      <span aria-hidden="true">−</span>
                    </button>
                    <span className="w-6 text-center font-heading text-xl text-charcoal" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(4, quantity + 1))}
                      aria-label={t('increase')}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-charcoal transition-colors hover:border-burgundy"
                    >
                      <span aria-hidden="true">+</span>
                    </button>
                  </div>
                </div>

                <p className="mt-4 font-heading text-2xl text-charcoal">
                  {t('total')}: €{total}
                </p>
              </>
            )}

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
