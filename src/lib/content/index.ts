// Content loader — reads the JSON files in /content (edited by the Telegram agent or by hand).
// Replaces the old Sanity queries; function names and return shapes are kept the same.
import {z} from 'zod';
import reelsData from '../../../content/reels.json';
import aboutData from '../../../content/about.json';

const localized = z.object({en: z.string(), es: z.string()});

const reelSchema = z.object({
  id: z.string(),
  title: localized,
  description: localized,
  instagramUrl: z.string().url(),
  category: z.enum(['History', 'Regions', 'Grapes', 'Tastings', 'Beginner Guides']),
  featured: z.boolean().default(false),
  publishedAt: z.string()
});

const aboutSchema = z.object({
  portrait: z.string().optional(),
  philosophy: localized,
  timeline: z.array(localized).default([]),
  quote: localized
});

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
