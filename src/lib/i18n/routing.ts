// Locale configuration — supported languages and default locale
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const isLocale = (value: unknown): value is Locale => (locales as readonly unknown[]).includes(value);
