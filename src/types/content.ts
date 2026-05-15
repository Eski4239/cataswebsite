export type Locale = 'en' | 'es';

export type ReelCategory = 'Historical Stories' | 'Regions' | 'Rare Wines' | 'Travel' | 'Beginner Stories';

export interface Reel {
  title: string;
  slug: string;
  instagramUrl: string;
  region: string;
  category: ReelCategory;
  description: string;
  featured?: boolean;
}

export interface Tasting {
  title: string;
  city: string;
  date: string;
  description: string;
  availability: string;
  image: string;
  cta: string;
}

export interface BottleOfWeek {
  wineName: string;
  winery: string;
  region: string;
  story: string;
  tastingNotes: string;
  whyThisMatters: string;
  image: string;
}
