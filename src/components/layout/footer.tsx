'use client';
import {useTranslations} from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="border-t border-border py-12 text-center text-sm text-muted">
      {t('copyright', {year: new Date().getFullYear()})}
    </footer>
  );
}
