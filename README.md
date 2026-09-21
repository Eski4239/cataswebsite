# Luis Torres Catas — Cinematic Wine Storytelling

A luxury editorial website for Luis Torres Catas, presenting wine through history, culture, and cinematic storytelling. Built as a bilingual (EN/ES) platform with a warm, magazine-like aesthetic.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components)
- **Styling:** Tailwind CSS with custom warm ivory/burgundy palette
- **Fonts:** Cormorant Garamond (headings) + Inter (body) via next/font
- **Animations:** Framer Motion (scroll-triggered fade-ins)
- **Content:** JSON files in `content/` + images in `public/uploads/` (edited by the Telegram agent or by hand)
- **i18n:** next-intl (English + Spanish)
- **Email:** Resend (contact form + newsletter signups)
- **Deployment:** Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/en` or `/es` based on browser language.

## Content

All editable content lives in `content/` (`reels.json`, `about.json`) and is validated with zod in `src/lib/content/index.ts`. Images go in `public/uploads/`. Every change is a git commit, so it can be reverted with `git revert`. Pushing to `main` redeploys the site on Vercel.

## Telegram content agent

Luis and his brother update the site by chatting with a Telegram bot. Claude (Sonnet 5) reads each message (text and photos), calls tools that edit `content/*.json` and `public/uploads/`, and commits to `main` through the GitHub API; Vercel then redeploys. Every change has an ↩️ Undo button; deletes and newsletters need a button press.

**What it can do:** add/edit/delete reels (and schedule them for later), tastings and the Bottle of the Week; edit the About text and portrait; draft and send a bilingual newsletter; show site stats; make backups.

- Webhook: `src/app/api/telegram/route.ts`; agent loop `src/lib/agent/agent.ts`; tools `src/lib/agent/tools.ts`
- Daily cron: `src/app/api/cron/daily/route.ts` (see `vercel.json`). Mondays: weekly digest with a nudge and stats. 1st of the month: backup (git tag `backup-YYYY-MM-DD` + zip sent to Telegram). Test with `GET /api/cron/daily?force=digest` (or `backup`) and header `Authorization: Bearer $CRON_SECRET`.
- Scheduled reels have a future `publishedAt`; pages re-render every 15 minutes and show them once the time passes. Tastings drop off automatically after their date.
- Group chats: in a group the bot only reacts to commands, @mentions of the bot, and replies to its own messages (ordinary chat is ignored). Only allowlisted members can instruct it, whoever else is in the group. `/id@<botname>` in the group shows the group's chat ID for `TELEGRAM_NOTIFY_CHAT_IDS`.
- Access: only usernames/IDs in `TELEGRAM_ALLOWED_USERS`; the webhook rejects calls without `TELEGRAM_WEBHOOK_SECRET`.
- Newsletter subscribers are stored in the Resend audience `RESEND_AUDIENCE_ID` by the signup form (`/api/newsletter`).
- Setup: create the bot with @BotFather, set the env vars from `.env.example` in `.env.local` and in Vercel, deploy, then run `node --env-file=.env.local scripts/set-telegram-webhook.mjs https://<your-site>`

## Tests

`npm run test:agent` runs 66 offline checks (no network, no real keys): the agent's tools against an in-memory fake GitHub, and the whole Telegram webhook -> agent -> Claude -> tools -> GitHub -> Telegram pipeline with scripted fakes, including failures (bad key, no credit, rate limits, commit races, strangers, duplicate deliveries). Fixtures live in `tests/fixtures/`.

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
│   ├── content/            # Content loader (reads /content JSON)
│   └── seo/                # Metadata + JSON-LD generators
└── messages/               # Translation files (en.json, es.json)

content/                   # reels, tastings, bottle, about (.json, localized {en, es} fields)
public/uploads/            # Uploaded images
```

## Environment Variables

Create a `.env.local` file in the project root:

```
RESEND_API_KEY=your_resend_api_key
# plus the Telegram agent variables listed in .env.example
```

## Deployment

The site deploys automatically to Vercel on push to `main`. Make sure environment variables are configured in the Vercel project settings.

To build locally:
```bash
npm run build
```
