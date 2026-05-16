import {client} from './client';

export type Reel = {
  title: string;
  description: string;
  instagramUrl: string;
  category: string;
  featured: boolean;
  publishedAt: string;
};

export async function getReels(locale: string): Promise<Reel[]> {
  const query = `*[_type == "reel"] | order(publishedAt desc) {
    "title": title.${locale},
    "description": description.${locale},
    instagramUrl,
    category,
    featured,
    publishedAt
  }`;
  return client.fetch(query);
}
