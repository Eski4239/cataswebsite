// Agent tools — every mutation is validated with the site's zod schemas and committed to GitHub.
import type Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import {z} from 'zod';
import {createBackup, listBackups} from './backup';
import {commitFiles, readJson, undoHead, type FileChange} from './github';
import {createDraft, discardDraft, sendDraft} from './newsletter';
import {getSiteStats} from './stats';
import {madridLocalToIso} from './time';
import {
  REEL_CATEGORIES,
  aboutSchema,
  bottleSchema,
  localizedSchema,
  reelSchema,
  tastingSchema,
  type AboutRecord,
  type BottleRecord,
  type ReelRecord,
  type TastingRecord
} from '../content/schema';

const REELS = 'content/reels.json';
const TASTINGS = 'content/tastings.json';
const BOTTLE = 'content/bottle.json';
const ABOUT = 'content/about.json';
const asJson = (v: unknown) => JSON.stringify(v, null, 2) + '\n';

export type ToolContext = {
  chatId: number;
  /** Photo attached to the current Telegram message, if any. */
  photo?: Buffer;
  /** Filled by tools: sha of the last commit made this turn (drives the Undo button). */
  lastSha?: string;
  /** Filled by tools: actions that need a button press (deletes, sending the newsletter). */
  confirmations: {label: string; data: string}[];
};

// ---------- tool definitions ----------

const loc = (desc: string) => ({
  type: 'object',
  description: desc,
  properties: {en: {type: 'string'}, es: {type: 'string'}},
  required: ['en', 'es']
});
const category = {type: 'string', enum: [...REEL_CATEGORIES]};
const usePhoto = {type: 'boolean', description: 'Use the photo attached to this message as the image'};
const idOnly = {type: 'object' as const, properties: {id: {type: 'string'}}, required: ['id']};

/** The newsletter tool is only offered once Resend is configured (RESEND_API_KEY + RESEND_AUDIENCE_ID). */
export const newsletterEnabled = () => !!process.env.RESEND_API_KEY && !!process.env.RESEND_AUDIENCE_ID;

const allTools: Anthropic.Tool[] = [
  {
    name: 'list_content',
    description: 'Show everything currently on the website: reels (live and scheduled), tastings, bottle of the week and the about page.',
    input_schema: {type: 'object', properties: {}}
  },
  {
    name: 'add_reel',
    description:
      'Add an Instagram reel to the Media page. Needs the Instagram link. Title and description in BOTH languages. Pass publishAt to schedule it for later instead of publishing now.',
    input_schema: {
      type: 'object',
      properties: {
        instagramUrl: {type: 'string'},
        title: loc('Reel title'),
        description: loc('Short description shown under the reel'),
        category,
        featured: {type: 'boolean'},
        publishAt: {type: 'string', description: 'Optional. Madrid local time like 2026-10-02T18:00 to schedule the reel'}
      },
      required: ['instagramUrl', 'title', 'description', 'category']
    }
  },
  {
    name: 'update_reel',
    description: 'Change fields of an existing reel (including rescheduling with publishAt). Only pass what changes.',
    input_schema: {
      type: 'object',
      properties: {
        id: {type: 'string'},
        instagramUrl: {type: 'string'},
        title: loc('New title'),
        description: loc('New description'),
        category,
        featured: {type: 'boolean'},
        publishAt: {type: 'string', description: 'Madrid local time like 2026-10-02T18:00'}
      },
      required: ['id']
    }
  },
  {
    name: 'delete_reel',
    description: 'Request deletion of a reel. Needs a confirmation button press; nothing is deleted until then.',
    input_schema: idOnly
  },
  {
    name: 'add_tasting',
    description:
      'Add an upcoming tasting event. Text in BOTH languages. Price is EUR per person (omit if unknown). Attach a photo and set usePhoto for the cover image.',
    input_schema: {
      type: 'object',
      properties: {
        title: loc('Event title'),
        city: loc('City (e.g. Madrid / Madrid, New York / Nueva York)'),
        date: {type: 'string', description: 'YYYY-MM-DD'},
        time: {type: 'string', description: '24h HH:MM, optional'},
        description: loc('One or two sentences for the card'),
        longDescription: loc('Longer description for the details window, optional'),
        price: {type: 'number'},
        usePhoto
      },
      required: ['title', 'city', 'date', 'description']
    }
  },
  {
    name: 'update_tasting',
    description: 'Change an existing tasting. Only pass what changes.',
    input_schema: {
      type: 'object',
      properties: {
        id: {type: 'string'},
        title: loc('Event title'),
        city: loc('City'),
        date: {type: 'string', description: 'YYYY-MM-DD'},
        time: {type: 'string', description: '24h HH:MM'},
        description: loc('Card description'),
        longDescription: loc('Details description'),
        price: {type: 'number'},
        usePhoto
      },
      required: ['id']
    }
  },
  {name: 'delete_tasting', description: 'Request deletion of a tasting. Needs a confirmation button press.', input_schema: idOnly},
  {
    name: 'set_bottle',
    description:
      'Set or edit the Bottle of the Week on the home page. Only pass what changes (all fields for a new bottle). Text fields in BOTH languages; wine and winery names are plain strings.',
    input_schema: {
      type: 'object',
      properties: {
        wineName: {type: 'string'},
        winery: {type: 'string'},
        region: loc('Region, e.g. Rioja Alta, Spain'),
        tastingNotes: loc('Tasting notes'),
        story: loc('The story behind the bottle'),
        usePhoto
      }
    }
  },
  {
    name: 'update_about',
    description: 'Edit the About page text. Only pass what changes. philosophy = the main bio text.',
    input_schema: {
      type: 'object',
      properties: {
        philosophy: loc('Main bio text'),
        quote: loc('Pull quote'),
        timeline: {type: 'array', items: loc('Timeline entry'), description: 'Replaces the whole timeline'}
      }
    }
  },
  {
    name: 'set_about_portrait',
    description: 'Use the photo attached to the current message as the About page portrait.',
    input_schema: {type: 'object', properties: {}}
  },
  {
    name: 'draft_newsletter',
    description:
      'Prepare a bilingual newsletter for the subscriber list. This only creates a draft and shows a Send button; nothing is emailed until the user presses it. Plain text bodies, blank line between paragraphs.',
    input_schema: {
      type: 'object',
      properties: {subject: loc('Subject line'), body: loc('Email body')},
      required: ['subject', 'body']
    }
  },
  {
    name: 'site_stats',
    description: 'Website visitor statistics (visitors, page views, top pages, sources, countries) for the last N days.',
    input_schema: {type: 'object', properties: {days: {type: 'number', description: 'Default 7, max 90'}}}
  },
  {
    name: 'create_backup',
    description: 'Create a restore point (git tag) and send a zip backup of the whole site to this chat.',
    input_schema: {type: 'object', properties: {}}
  },
  {name: 'list_backups', description: 'List existing backup restore points.', input_schema: {type: 'object', properties: {}}},
  {
    name: 'undo_last_change',
    description: 'Undo the most recent change made by this assistant.',
    input_schema: {type: 'object', properties: {}}
  }
];

export const tools: Anthropic.Tool[] = allTools.filter((t) => t.name !== 'draft_newsletter' || newsletterEnabled());

// ---------- helpers ----------

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);
const newId = (label: string, fallback: string) => `${slug(label) || fallback}-${Math.random().toString(36).slice(2, 6)}`;

function normalizeInstagramUrl(raw: string): string {
  const m = raw.trim().match(/instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  if (!m) throw new Error('That does not look like an Instagram post or reel link.');
  return `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/`;
}

/** Resize the attached photo and return the file to commit plus its public URL path. */
async function savePhoto(ctx: ToolContext, folder: string, name: string): Promise<{file: FileChange; url: string}> {
  if (!ctx.photo) throw new Error('No photo is attached to this message. Ask the user to send the photo together with their request.');
  const jpg = await sharp(ctx.photo).rotate().resize({width: 1600, withoutEnlargement: true}).jpeg({quality: 82, mozjpeg: true}).toBuffer();
  const url = `/uploads/${folder}/${name}-${Date.now().toString(36)}.jpg`;
  return {file: {path: `public${url}`, content: jpg}, url};
}

/** Old local images are removed when replaced (remote URLs are left alone). */
const dropOld = (old?: string): FileChange[] => (old?.startsWith('/uploads/') ? [{path: `public${old}`, content: null}] : []);

const publishIso = (publishAt?: string) => (publishAt ? madridLocalToIso(publishAt) : undefined);
const optional = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

const idSchema = z.object({id: z.string()});
const reelFields = {
  instagramUrl: z.string(),
  title: localizedSchema,
  description: localizedSchema,
  category: z.enum(REEL_CATEGORIES),
  featured: z.boolean(),
  publishAt: z.string()
};
const addReelSchema = z.object({...reelFields, featured: reelFields.featured.optional(), publishAt: reelFields.publishAt.optional()});
const updateReelSchema = z.object({id: z.string()}).extend(z.object(reelFields).partial().shape);

const tastingFields = {
  title: localizedSchema,
  city: localizedSchema,
  date: z.string(),
  time: z.string(),
  description: localizedSchema,
  longDescription: localizedSchema,
  price: z.number(),
  usePhoto: z.boolean()
};
const addTastingSchema = z.object({
  ...tastingFields,
  time: tastingFields.time.optional(),
  longDescription: tastingFields.longDescription.optional(),
  price: tastingFields.price.optional(),
  usePhoto: tastingFields.usePhoto.optional()
});
const updateTastingSchema = z.object({id: z.string()}).extend(z.object(tastingFields).partial().shape);

const bottleUpdateSchema = z.object({
  wineName: z.string().optional(),
  winery: z.string().optional(),
  region: localizedSchema.optional(),
  tastingNotes: localizedSchema.optional(),
  story: localizedSchema.optional(),
  usePhoto: z.boolean().optional()
});
const aboutUpdateSchema = z.object({
  philosophy: localizedSchema.optional(),
  quote: localizedSchema.optional(),
  timeline: z.array(localizedSchema).optional()
});
const newsletterSchema = z.object({subject: localizedSchema, body: localizedSchema});

const LIVE_SOON = 'Live in about a minute, once the site redeploys.';

// ---------- dispatcher ----------

export async function runTool(name: string, input: unknown, ctx: ToolContext): Promise<unknown> {
  switch (name) {
    case 'list_content': {
      const [reels, tastings, bottle, about] = await Promise.all([
        readJson<ReelRecord[]>(REELS),
        readJson<TastingRecord[]>(TASTINGS),
        readJson<BottleRecord>(BOTTLE),
        readJson<AboutRecord>(ABOUT)
      ]);
      const now = new Date().toISOString();
      return {
        reels: reels.map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          instagramUrl: r.instagramUrl,
          publishedAt: r.publishedAt,
          status: r.publishedAt > now ? 'scheduled' : 'live'
        })),
        tastings: tastings.map((t) => ({id: t.id, title: t.title, city: t.city, date: t.date, time: t.time, price: t.price})),
        bottle,
        about
      };
    }

    // --- reels
    case 'add_reel': {
      const a = addReelSchema.parse(input);
      const reels = z.array(reelSchema).parse(await readJson(REELS));
      const url = normalizeInstagramUrl(a.instagramUrl);
      if (reels.some((r) => r.instagramUrl === url)) throw new Error('That reel is already on the site.');
      const publishedAt = publishIso(a.publishAt) ?? new Date().toISOString();
      const reel = reelSchema.parse({
        id: newId(a.title.en, 'reel'),
        title: a.title,
        description: a.description,
        instagramUrl: url,
        category: a.category,
        featured: a.featured ?? false,
        publishedAt
      });
      const scheduled = publishedAt > new Date().toISOString();
      ctx.lastSha = await commitFiles(`agent: ${scheduled ? 'schedule' : 'add'} reel "${a.title.en}"`, [
        {path: REELS, content: asJson([reel, ...reels])}
      ]);
      return {
        ok: true,
        id: reel.id,
        scheduled,
        publishedAt,
        note: scheduled ? 'It will appear automatically at that time (within about 15 minutes of it).' : LIVE_SOON
      };
    }
    case 'update_reel': {
      const {id, publishAt, ...changes} = updateReelSchema.parse(input);
      const reels = z.array(reelSchema).parse(await readJson(REELS));
      const i = reels.findIndex((r) => r.id === id);
      if (i < 0) throw new Error(`No reel with id ${id}. Use list_content to see ids.`);
      if (changes.instagramUrl) changes.instagramUrl = normalizeInstagramUrl(changes.instagramUrl);
      reels[i] = reelSchema.parse({...reels[i], ...optional(changes), ...(publishAt ? {publishedAt: publishIso(publishAt)} : {})});
      ctx.lastSha = await commitFiles(`agent: update reel "${reels[i].title.en}"`, [{path: REELS, content: asJson(reels)}]);
      return {ok: true, note: LIVE_SOON};
    }
    case 'delete_reel': {
      const {id} = idSchema.parse(input);
      const reel = z
        .array(reelSchema)
        .parse(await readJson(REELS))
        .find((r) => r.id === id);
      if (!reel) throw new Error(`No reel with id ${id}.`);
      ctx.confirmations.push({label: `🗑 Delete reel "${reel.title.en}"`, data: `del:${id}`});
      return {status: 'awaiting_confirmation', note: 'A confirm button was sent. Nothing is deleted until the user presses it.'};
    }

    // --- tastings
    case 'add_tasting': {
      const {usePhoto: withPhoto, ...a} = addTastingSchema.parse(input);
      const tastings = z.array(tastingSchema).parse(await readJson(TASTINGS));
      const id = newId(a.title.en, 'tasting');
      const photo = withPhoto ? await savePhoto(ctx, 'tastings', slug(a.title.en) || 'tasting') : undefined;
      const tasting = tastingSchema.parse({id, ...a, ...(photo ? {image: photo.url} : {})});
      ctx.lastSha = await commitFiles(`agent: add tasting "${a.title.en}"`, [
        {path: TASTINGS, content: asJson([...tastings, tasting])},
        ...(photo ? [photo.file] : [])
      ]);
      return {ok: true, id, note: `${LIVE_SOON} Tastings disappear from the site automatically after their date.`};
    }
    case 'update_tasting': {
      const {id, usePhoto: withPhoto, ...changes} = updateTastingSchema.parse(input);
      const tastings = z.array(tastingSchema).parse(await readJson(TASTINGS));
      const i = tastings.findIndex((t) => t.id === id);
      if (i < 0) throw new Error(`No tasting with id ${id}. Use list_content to see ids.`);
      const photo = withPhoto ? await savePhoto(ctx, 'tastings', slug(tastings[i].title.en) || 'tasting') : undefined;
      const files: FileChange[] = photo ? [photo.file, ...dropOld(tastings[i].image)] : [];
      tastings[i] = tastingSchema.parse({...tastings[i], ...optional(changes), ...(photo ? {image: photo.url} : {})});
      ctx.lastSha = await commitFiles(`agent: update tasting "${tastings[i].title.en}"`, [
        {path: TASTINGS, content: asJson(tastings)},
        ...files
      ]);
      return {ok: true, note: LIVE_SOON};
    }
    case 'delete_tasting': {
      const {id} = idSchema.parse(input);
      const tasting = z
        .array(tastingSchema)
        .parse(await readJson(TASTINGS))
        .find((t) => t.id === id);
      if (!tasting) throw new Error(`No tasting with id ${id}.`);
      ctx.confirmations.push({label: `🗑 Delete tasting "${tasting.title.en}"`, data: `delt:${id}`});
      return {status: 'awaiting_confirmation', note: 'A confirm button was sent. Nothing is deleted until the user presses it.'};
    }

    // --- bottle of the week
    case 'set_bottle': {
      const {usePhoto: withPhoto, ...changes} = bottleUpdateSchema.parse(input);
      const current = (await readJson<Partial<BottleRecord>>(BOTTLE)) ?? {};
      const photo = withPhoto ? await savePhoto(ctx, 'bottle', 'bottle') : undefined;
      const next = bottleSchema.parse({...current, ...optional(changes), ...(photo ? {image: photo.url} : {})});
      ctx.lastSha = await commitFiles(`agent: set bottle of the week "${next.wineName}"`, [
        {path: BOTTLE, content: asJson(next)},
        ...(photo ? [photo.file, ...dropOld(current.image)] : [])
      ]);
      return {ok: true, note: LIVE_SOON};
    }

    // --- about
    case 'update_about': {
      const c = aboutUpdateSchema.parse(input);
      if (!c.philosophy && !c.quote && !c.timeline) throw new Error('Nothing to change.');
      const about = aboutSchema.parse(await readJson(ABOUT));
      const next = aboutSchema.parse({...about, ...optional(c)});
      ctx.lastSha = await commitFiles('agent: update about page', [{path: ABOUT, content: asJson(next)}]);
      return {ok: true, note: LIVE_SOON};
    }
    case 'set_about_portrait': {
      const about = aboutSchema.parse(await readJson(ABOUT));
      const photo = await savePhoto(ctx, 'about', 'portrait');
      ctx.lastSha = await commitFiles('agent: update about portrait', [
        photo.file,
        {path: ABOUT, content: asJson({...about, portrait: photo.url})},
        ...dropOld(about.portrait)
      ]);
      return {ok: true, note: LIVE_SOON};
    }

    // --- newsletter, stats, backups
    case 'draft_newsletter': {
      const {subject, body} = newsletterSchema.parse(input);
      const draft = await createDraft(subject, body);
      ctx.confirmations.push(
        {label: `✅ Send to ${draft.subscribers} subscriber${draft.subscribers === 1 ? '' : 's'}`, data: `nl:${draft.id}`},
        {label: '✖ Discard draft', data: `nlx:${draft.id}`}
      );
      return {
        status: 'awaiting_confirmation',
        subscribers: draft.subscribers,
        note: 'Show the user the full subject and both language versions so they can review, then tell them to press Send or Discard. Nothing has been emailed.'
      };
    }
    case 'site_stats': {
      const {days} = z.object({days: z.number().optional()}).parse(input);
      return {stats: await getSiteStats(Math.min(Math.max(Math.round(days ?? 7), 1), 90))};
    }
    case 'create_backup': {
      const tag = await createBackup([ctx.chatId]);
      return {ok: true, tag, note: 'A zip of the whole site was sent to this chat.'};
    }
    case 'list_backups':
      return {backups: await listBackups()};

    case 'undo_last_change': {
      const r = await undoHead();
      if (!r.ok) throw new Error(r.reason);
      return {ok: true, undone: r.undone};
    }

    default:
      throw new Error(`Unknown tool ${name}`);
  }
}

/** Executes a button press (delete confirmations, newsletter send/discard, undo). Returns the reply text. */
export async function runConfirmed(data: string): Promise<string> {
  const [kind, ...rest] = data.split(':');
  const arg = rest.join(':');

  if (kind === 'del') {
    const reels = z.array(reelSchema).parse(await readJson(REELS));
    const reel = reels.find((r) => r.id === arg);
    if (!reel) return 'That reel was already gone.';
    await commitFiles(`agent: delete reel "${reel.title.en}"`, [{path: REELS, content: asJson(reels.filter((r) => r.id !== arg))}]);
    return `Deleted reel "${reel.title.en}". Say "undo" if that was a mistake.`;
  }
  if (kind === 'delt') {
    const tastings = z.array(tastingSchema).parse(await readJson(TASTINGS));
    const tasting = tastings.find((t) => t.id === arg);
    if (!tasting) return 'That tasting was already gone.';
    await commitFiles(`agent: delete tasting "${tasting.title.en}"`, [
      {path: TASTINGS, content: asJson(tastings.filter((t) => t.id !== arg))}
    ]);
    return `Deleted tasting "${tasting.title.en}". Say "undo" if that was a mistake.`;
  }
  if (kind === 'nl') return sendDraft(arg);
  if (kind === 'nlx') return discardDraft(arg);
  if (kind === 'undo') {
    const r = await undoHead(arg);
    return r.ok ? `Undone: ${r.undone}` : r.reason;
  }
  return 'Unknown action.';
}
