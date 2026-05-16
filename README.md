# Luis Torres Catas — Cinematic Wine Storytelling

A luxury editorial website for Luis Torres Catas, presenting wine through history, culture, and cinematic storytelling. Built as a bilingual (EN/ES) platform with a warm, magazine-like aesthetic.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components)
- **Styling:** Tailwind CSS with custom warm ivory/burgundy palette
- **Fonts:** Cormorant Garamond (headings) + Inter (body) via next/font
- **Animations:** Framer Motion (scroll-triggered fade-ins)
- **CMS:** Sanity v3 (headless, hosted at luistorrescatas.sanity.studio)
- **i18n:** next-intl (English + Spanish)
- **Email:** Resend (contact form + newsletter signups)
- **Deployment:** Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/en` or `/es` based on browser language.

## Sanity Studio

The CMS is deployed at **https://luistorrescatas.sanity.studio/**

To run the studio locally:
```bash
npx sanity dev
```

To deploy studio changes:
```bash
npx sanity deploy
```

## Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── [locale]/           # Locale-scoped pages (en, es)
│   │   ├── page.tsx        # Home page
│   │   ├── media/          # Instagram reels archive
│   │   ├── tastings/       # Tasting experiences + ticket modal
│   │   ├── about/          # About page
│   │   ├── contact/        # Contact form
│   │   └── layout.tsx      # Shared navbar + footer + i18n provider
│   ├── api/                # API routes (contact, newsletter)
│   ├── layout.tsx          # Root layout (fonts, global CSS)
│   └── page.tsx            # Root redirect (/ → /en or /es)
├── components/
│   ├── layout/             # Navbar, Footer
│   ├── media/              # ReelsGrid (Instagram embeds)
│   ├── motion/             # FadeUp animation wrapper
│   ├── newsletter/         # Newsletter signup form
│   └── tastings/           # TastingsPage, TastingModal
├── i18n/                   # next-intl request config
├── lib/
│   ├── i18n/               # Locale routing config
│   ├── sanity/             # Sanity client + GROQ queries
│   └── seo/                # Metadata + JSON-LD generators
└── messages/               # Translation files (en.json, es.json)

sanity/
└── schemas/                # Sanity schema definitions (reel, tasting, bottle, about)
```

## Environment Variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=wzudpmcs
NEXT_PUBLIC_SANITY_DATASET=production
RESEND_API_KEY=your_resend_api_key
```

## Deployment

The site deploys automatically to Vercel on push to `main`. Make sure environment variables are configured in the Vercel project settings.

To build locally:
```bash
npm run build
```
