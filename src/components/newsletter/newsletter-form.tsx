'use client';

import {useState} from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    await fetch('/api/newsletter', {method: 'POST', body: JSON.stringify({email})});
    setStatus('sent');
    setEmail('');
  }

  if (status === 'sent') {
    return <p className="mt-8 text-sm text-burgundy">Thank you — welcome to the journal.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="flex-1 border border-border bg-surface px-4 py-3 text-sm text-charcoal placeholder:text-muted/60 focus:border-burgundy focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="border border-burgundy px-6 py-3 text-sm uppercase tracking-[0.14em] text-burgundy transition-colors duration-300 hover:bg-burgundy hover:text-ivory disabled:opacity-50"
      >
        {status === 'sending' ? 'Joining…' : 'Subscribe'}
      </button>
    </form>
  );
}
