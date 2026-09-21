// Content schemas — shared by the site loader (index.ts) and the Telegram agent (src/lib/agent).
import {z} from 'zod';

export const localizedSchema = z.object({en: z.string(), es: z.string()});
export type Localized = z.infer<typeof localizedSchema>;

export const REEL_CATEGORIES = ['History', 'Regions', 'Grapes', 'Tastings', 'Beginner Guides'] as const;

export const reelSchema = z.object({
  id: z.string(),
  title: localizedSchema,
  description: localizedSchema,
  instagramUrl: z.string().url(),
  category: z.enum(REEL_CATEGORIES),
  featured: z.boolean().default(false),
  publishedAt: z.string()
});
export type ReelRecord = z.infer<typeof reelSchema>;

export const aboutSchema = z.object({
  portrait: z.string().optional(),
  philosophy: localizedSchema,
  timeline: z.array(localizedSchema).default([]),
  quote: localizedSchema
});
export type AboutRecord = z.infer<typeof aboutSchema>;

export const tastingSchema = z.object({
  id: z.string(),
  title: localizedSchema,
  city: localizedSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(), // 24h HH:MM
  description: localizedSchema,
  longDescription: localizedSchema.optional(),
  price: z.number().nonnegative().optional(), // EUR per person
  image: z.string().optional() // /uploads/... path or https URL
});
export type TastingRecord = z.infer<typeof tastingSchema>;

export const bottleSchema = z.object({
  wineName: z.string(),
  winery: z.string(),
  region: localizedSchema,
  tastingNotes: localizedSchema,
  story: localizedSchema,
  image: z.string().optional()
});
export type BottleRecord = z.infer<typeof bottleSchema>;
