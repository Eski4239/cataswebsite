import {sanityClient as client} from './client';

export type Reel = {
  title: string;
  description: string;
  instagramUrl: string;
  category: string;
  featured: boolean;
  publishedAt: string;
};

export async function getReels(locale: string) {
  return client.fetch(
    `*[_type == "reel"] | order(publishedAt desc) {
      "title": title[$locale],
      "description": description[$locale],
      instagramUrl,
      category,
      featured,
      publishedAt
    }`,
    {locale}
  );
}

export async function getAboutContent(locale: string) {
  return client.fetch(
    `*[_type == "aboutContent"][0] {
      portrait,
      "philosophy": philosophy[$locale],
      "timeline": timeline[][$locale],
      "quote": quote[$locale]
    }`,
    {locale}
  );
}

export async function getTastings(locale: string) {
  return client.fetch(
    `*[_type == "tasting"] | order(date asc) {
      "title": title[$locale],
      "city": city[$locale],
      date,
      "description": description[$locale],
      "availability": availability[$locale],
      coverImage,
      "contactCTA": contactCTA[$locale]
    }`,
    {locale}
  );
}

export async function getBottleOfWeek(locale: string) {
  return client.fetch(
    `*[_type == "bottleOfWeek" && featured == true][0] {
      wineName,
      winery,
      "region": region[$locale],
      "story": story[$locale],
      "tastingNotes": tastingNotes[$locale],
      image
    }`,
    {locale}
  );
}
