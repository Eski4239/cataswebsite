// Content loader — reads the JSON files in /content (edited by the Telegram agent or by hand).
// Replaces the old Sanity queries; function names and return shapes are kept the same.
import {z} from 'zod';
import {aboutSchema, bottleSchema, reelSchema, tastingSchema} from './schema';
import reelsData from '../../../content/reels.json';
import aboutData from '../../../content/about.json';
import tastingsData from '../../../content/tastings.json';
import bottleData from '../../../content/bottle.json';

const reels = z.array(reelSchema).parse(reelsData);
const about = aboutSchema.parse(aboutData);
const tastings = z.array(tastingSchema).parse(tastingsData);
const bottle = bottleSchema.parse(bottleData);

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
  const now = new Date().toISOString(); // reels with a future publishedAt are scheduled and not shown yet
  return reels
    .filter((r) => r.publishedAt <= now)
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

const DEFAULT_TASTING_IMAGE = 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200';

export type Tasting = {
  id: string;
  title: string;
  city: string;
  dateLabel: string;
  timeLabel?: string;
  description: string;
  longDescription: string;
  price?: number;
  image: string;
};

const todayInMadrid = () => new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Madrid'}).format(new Date());

/** Upcoming tastings only (today or later), soonest first. */
export async function getTastings(locale: string): Promise<Tasting[]> {
  const today = todayInMadrid();
  return tastings
    .filter((t) => t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
    .map((t) => ({
      id: t.id,
      title: pick(t.title, locale),
      city: pick(t.city, locale),
      dateLabel: new Intl.DateTimeFormat(locale, {dateStyle: 'long', timeZone: 'UTC'}).format(new Date(`${t.date}T00:00:00Z`)),
      timeLabel: t.time
        ? new Intl.DateTimeFormat(locale, {hour: 'numeric', minute: '2-digit', timeZone: 'UTC'}).format(
            new Date(`2000-01-01T${t.time}:00Z`)
          )
        : undefined,
      description: pick(t.description, locale),
      longDescription: pick(t.longDescription ?? t.description, locale),
      price: t.price,
      image: t.image ?? DEFAULT_TASTING_IMAGE
    }));
}

export async function getBottleOfWeek(locale: string) {
  return {
    wineName: bottle.wineName,
    winery: bottle.winery,
    region: pick(bottle.region, locale),
    tastingNotes: pick(bottle.tastingNotes, locale),
    story: pick(bottle.story, locale),
    image: bottle.image
  };
}
