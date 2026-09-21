// Contact page — inquiry form with category selection, sends via /api/contact (Resend)
'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';

// Values are English because Luis reads the resulting email; the labels shown are translated.
const categories = [
  {value: 'Collaborations', key: 'collaborations'},
  {value: 'Private Tastings', key: 'privateTastings'},
  {value: 'Media', key: 'media'},
  {value: 'Partnerships', key: 'partnerships'},
  {value: 'General Inquiry', key: 'general'}
] as const;

const field = 'border border-border bg-surface px-4 py-3 text-sm text-charcoal placeholder:text-muted/60 focus:border-burgundy focus:outline-none';

export default function ContactPage() {
  const t = useTranslations('contact');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="section-shell pt-40">
      <h1 className="font-heading text-6xl text-charcoal">{t('heading')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{t('subheading')}</p>

      <form onSubmit={onSubmit} className="mt-8 grid max-w-2xl gap-4">
        <input name="name" required maxLength={120} placeholder={t('name')} aria-label={t('name')} className={field} />
        <input name="email" type="email" required maxLength={200} placeholder={t('email')} aria-label={t('email')} className={field} />
        <select name="category" className={field} aria-label="Category">
          {categories.map((c) => (
            <option key={c.key} value={c.value}>
              {t(`categories.${c.key}`)}
            </option>
          ))}
        </select>
        <textarea name="message" required maxLength={5000} placeholder={t('message')} aria-label={t('message')} className={`min-h-40 ${field}`} />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-fit border border-burgundy px-6 py-3 text-xs uppercase tracking-[0.16em] text-burgundy transition-colors duration-300 hover:bg-burgundy hover:text-ivory disabled:opacity-50"
        >
          {status === 'sending' ? t('sending') : t('submit')}
        </button>
        <div aria-live="polite">
          {status === 'sent' && <p className="text-sm text-burgundy">{t('success')}</p>}
          {status === 'error' && <p className="text-sm text-red-700">{t('error')}</p>}
        </div>
      </form>
    </section>
  );
}
