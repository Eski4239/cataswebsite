'use client';
import Link from 'next/link';
import {useEffect, useState} from 'react';
import {usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';

function LanguageSwitcher({locale}: {locale: string}) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/(en|es)/, '') || '/';
  const cls = (active: boolean) => (active ? 'text-burgundy' : 'text-muted transition-colors hover:text-charcoal');

  return (
    <div className="flex gap-2 text-xs uppercase tracking-[0.22em]" role="group" aria-label={t('language')}>
      <Link
        href={`/en${pathWithoutLocale}`}
        hrefLang="en"
        lang="en"
        aria-current={locale === 'en' ? 'true' : undefined}
        className={cls(locale === 'en')}
      >
        EN
      </Link>
      <span className="text-border" aria-hidden="true">
        |
      </span>
      <Link
        href={`/es${pathWithoutLocale}`}
        hrefLang="es"
        lang="es"
        aria-current={locale === 'es' ? 'true' : undefined}
        className={cls(locale === 'es')}
      >
        ES
      </Link>
    </div>
  );
}

export function Navbar({locale}: {locale: string}) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const items: [string, string][] = [
    ['', t('home')],
    ['/tastings', t('tastings')],
    ['/media', t('media')],
    ['/about', t('about')],
    ['/contact', t('contact')]
  ];

  const isActive = (href: string) => {
    const path = pathname.replace(/^\/(en|es)/, '') || '/';
    return href === '' ? path === '/' : path.startsWith(href);
  };

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', on);
    return () => window.removeEventListener('scroll', on);
  }, []);

  // Close the mobile menu when the page changes.
  useEffect(() => setOpen(false), [pathname]);

  // While the mobile menu is open: Escape closes it and the page behind it does not scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-700 ${scrolled || open ? 'border-b border-border bg-background/85 backdrop-blur' : 'bg-transparent'}`}
    >
      <nav
        aria-label={t('label')}
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-xs uppercase tracking-[0.22em]"
      >
        <Link href={`/${locale}`} className="text-gold-deep">
          Catas Luis de Torres
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {items.map(([href, label]) => (
            <Link
              key={href}
              href={`/${locale}${href}`}
              aria-current={isActive(href) ? 'page' : undefined}
              className={
                isActive(href)
                  ? 'text-burgundy underline decoration-burgundy/40 underline-offset-8'
                  : 'transition-colors hover:text-burgundy'
              }
            >
              {label}
            </Link>
          ))}
          <LanguageSwitcher locale={locale} />
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu">
          {open ? t('close') : t('menu')}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="min-h-screen bg-background p-10 md:hidden">
          {items.map(([href, label]) => (
            <Link
              className={`block py-5 font-heading text-2xl ${isActive(href) ? 'text-burgundy' : ''}`}
              key={href}
              href={`/${locale}${href}`}
              aria-current={isActive(href) ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
          <div className="mt-8 border-t border-border pt-8">
            <LanguageSwitcher locale={locale} />
          </div>
        </div>
      )}
    </header>
  );
}
