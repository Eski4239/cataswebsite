// Content loader — reads the JSON files in /content (edited by the Telegram agent or by hand).
// Replaces the old Sanity queries; function names and return shapes are kept the same.
import {z} from 'zod';
import {aboutSchema, reelSchema} from './schema';
import reelsData from '../../../content/reels.json';
import aboutData from '../../../content/about.json';

const reels = z.array(reelSchema).parse(reelsData);
const about = aboutSchema.parse(aboutData);

type Locale = 'en' | 'es';
const pick = (l: {en: string; es: string}, locale: string) => l[locale as Locale] ?? l.en;

export type Reel = {
  title: string;
  description: string;
  instagramUrl: string;
  category: string;
  featured: boolean;
  publishedAt: string;
};

export async function getReels(locale: string): Promise<Reel[]> {
  return [...reels]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map((r) => ({
      title: pick(r.title, locale),
      description: pick(r.description, locale),
      instagramUrl: r.instagramUrl,
      category: r.category,
      featured: r.featured,
      publishedAt: r.publishedAt
    }));
}

export async function getAboutContent(locale: string) {
  return {
    portrait: about.portrait,
    philosophy: pick(about.philosophy, locale),
    timeline: about.timeline.map((t) => pick(t, locale)),
    quote: pick(about.quote, locale)
  };
}
