import type {BottleOfWeek, Reel, Tasting} from '@/types/content';

export const reels: Reel[] = [
  {
    title: 'The Monasteries That Saved Rioja',
    slug: 'monasteries-saved-rioja',
    instagramUrl: 'https://www.instagram.com/reel/demo/embed',
    region: 'Rioja, Spain',
    category: 'Historical Stories',
    description: 'A narrative about monastic cellars, continuity, and living memory in Rioja.',
    featured: true
  },
  {
    title: 'Volcanic Wines of Etna',
    slug: 'volcanic-wines-etna',
    instagramUrl: 'https://www.instagram.com/reel/demo2/embed',
    region: 'Sicily, Italy',
    category: 'Regions',
    description: 'How altitude, lava soils, and tradition define aromatic precision.'
  },
  {
    title: 'A Beginner’s Bordeaux Lens',
    slug: 'beginners-bordeaux-lens',
    instagramUrl: 'https://www.instagram.com/reel/demo3/embed',
    region: 'Bordeaux, France',
    category: 'Beginner Stories',
    description: 'A clear and elegant path to reading Bordeaux through structure and texture.'
  }
];

export const bottleOfWeek: BottleOfWeek = {
  wineName: 'Viña Tondonia Reserva 2011',
  winery: 'López de Heredia',
  region: 'Rioja Alta',
  story: 'A cellar where patience remains an act of cultural preservation.',
  tastingNotes: 'Dried cherry, cedar, tobacco leaf, and energetic acidity.',
  whyThisMatters: 'It captures the continuity of traditional Rioja in a modern era.',
  image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200'
};

export const tastings: Tasting[] = [
  {
    title: 'Candlelight Rioja Archive',
    city: 'Miami',
    date: 'June 28, 2026',
    description: 'A private vertical with historical context and reflective pacing.',
    availability: 'Limited invitations',
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200',
    cta: 'Request Invitation'
  },
  {
    title: 'Andean Altitude Narratives',
    city: 'New York',
    date: 'July 19, 2026',
    description: 'Story-led tasting across altitude, heritage, and table culture.',
    availability: 'By request',
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200',
    cta: 'Express Interest'
  },
  {
    title: 'Old World, New Eyes',
    city: 'Los Angeles',
    date: 'August 8, 2026',
    description: 'A comparative evening across generations and regions.',
    availability: 'Contact for availability',
    image: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=1200',
    cta: 'Contact for Availability'
  }
];
