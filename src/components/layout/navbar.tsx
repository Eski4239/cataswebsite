'use client';
import Link from 'next/link';
import {useEffect, useState} from 'react';
import {usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';

function LanguageSwitcher({locale}: {locale: string}) {
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/(en|es)/, '') || '/';

  return (
    <div className="flex gap-2 text-xs uppercase tracking-[0.22em]">
      <Link
        href={`/en${pathWithoutLocale}`}
        className={locale === 'en' ? 'text-burgundy' : 'text-muted hover:text-charcoal transition-colors'}
      >
        EN
      </Link>
      <span className="text-border">|</span>
      <Link
        href={`/es${pathWithoutLocale}`}
        className={locale === 'es' ? 'text-burgundy' : 'text-muted hover:text-charcoal transition-colors'}
      >
        ES
      </Link>
    </div>
  );
}

export function Navbar({locale}: {locale: string}) {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const items: [string, string][] = [
    ['', t('home')],
    ['/tastings', t('tastings')],
    ['/media', t('media')],
    ['/about', t('about')],
    ['/contact', t('contact')],
  ];

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', on);
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-700 ${scrolled ? 'bg-background/85 backdrop-blur border-b border-border' : 'bg-transparent'}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-xs uppercase tracking-[0.22em]">
        <Link href={`/${locale}`} className="text-gold">Luis Torres Catas</Link>
        <div className="hidden md:flex items-center gap-8">
          {items.map(([href, label]) => (
            <Link key={href} href={`/${locale}${href}`}>{label}</Link>
          ))}
          <LanguageSwitcher locale={locale} />
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>Menu</button>
      </nav>
      {open && (
        <div className="md:hidden min-h-screen bg-background p-10">
          {items.map(([href, label]) => (
            <Link className="block py-5 text-2xl font-heading" key={href} href={`/${locale}${href}`} onClick={() => setOpen(false)}>{label}</Link>
          ))}
          <div className="mt-8 pt-8 border-t border-border">
            <LanguageSwitcher locale={locale} />
          </div>
        </div>
      )}
    </header>
  );
}
