'use client';
import {useTranslations} from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="border-t border-border py-12 text-center text-sm text-muted">
      <div>{t('copyright', {year: new Date().getFullYear()})}</div>
      <a
        href="https://www.instagram.com/luistorrescatas/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 text-gold/70 hover:text-gold transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
        @luistorrescatas
      </a>
    </footer>
  );
}
