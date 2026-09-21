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
