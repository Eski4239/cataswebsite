// Agent tools — every mutation is validated with the site's zod schemas and committed to GitHub.
import type Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import {z} from 'zod';
import {commitFiles, readJson, undoHead, type FileChange} from './github';
import {REEL_CATEGORIES, aboutSchema, localizedSchema, reelSchema, type AboutRecord, type ReelRecord} from '../content/schema';

const REELS = 'content/reels.json';
const ABOUT = 'content/about.json';
const asJson = (v: unknown) => JSON.stringify(v, null, 2) + '\n';

export type ToolContext = {
  /** Photo attached to the current Telegram message, if any. */
  photo?: Buffer;
  /** Filled by tools: sha of the last commit made this turn (drives the Undo button). */
  lastSha?: string;
  /** Filled by tools: destructive actions that need a button press. */
  confirmations: {label: string; data: string}[];
};

const loc = (desc: string) => ({
  type: 'object',
  description: desc,
  properties: {en: {type: 'string'}, es: {type: 'string'}},
  required: ['en', 'es']
});

export const tools: Anthropic.Tool[] = [
  {
    name: 'list_content',
    description: 'Show everything currently on the website: all reels (id, titles, category, link, date) and the about page.',
    input_schema: {type: 'object', properties: {}}
  },
  {
    name: 'add_reel',
    description:
      'Add an Instagram reel to the Media page. Needs the Instagram link. Provide title and description in BOTH English and Spanish.',
    input_schema: {
      type: 'object',
      properties: {
        instagramUrl: {type: 'string', description: 'Instagram post/reel link'},
        title: loc('Reel title'),
        description: loc('Short description shown under the reel'),
        category: {type: 'string', enum: [...REEL_CATEGORIES]},
        featured: {type: 'boolean'}
      },
      required: ['instagramUrl', 'title', 'description', 'category']
    }
  },
  {
    name: 'update_reel',
    description: 'Change fields of an existing reel. Only pass the fields that change.',
    input_schema: {
      type: 'object',
      properties: {
        id: {type: 'string'},
        instagramUrl: {type: 'string'},
        title: loc('New title'),
        description: loc('New description'),
        category: {type: 'string', enum: [...REEL_CATEGORIES]},
        featured: {type: 'boolean'}
      },
      required: ['id']
    }
  },
  {
    name: 'delete_reel',
    description:
      'Request deletion of a reel. This does NOT delete immediately: the user gets a confirmation button. Tell them to press it.',
    input_schema: {type: 'object', properties: {id: {type: 'string'}}, required: ['id']}
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
    name: 'undo_last_change',
    description: 'Undo the most recent change made by this assistant.',
    input_schema: {type: 'object', properties: {}}
  }
];

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);

function normalizeInstagramUrl(raw: string): string {
  const m = raw.trim().match(/instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  if (!m) throw new Error('That does not look like an Instagram post or reel link.');
  return `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/`;
}

const addSchema = z.object({
  instagramUrl: z.string(),
  title: localizedSchema,
  description: localizedSchema,
  category: z.enum(REEL_CATEGORIES),
  featured: z.boolean().optional()
});
const updateSchema = z.object({
  id: z.string(),
  instagramUrl: z.string().optional(),
  title: localizedSchema.optional(),
  description: localizedSchema.optional(),
  category: z.enum(REEL_CATEGORIES).optional(),
  featured: z.boolean().optional()
});
const aboutUpdateSchema = z.object({
  philosophy: localizedSchema.optional(),
  quote: localizedSchema.optional(),
  timeline: z.array(localizedSchema).optional()
});

export async function runTool(name: string, input: unknown, ctx: ToolContext): Promise<unknown> {
  switch (name) {
    case 'list_content': {
      const [reels, about] = await Promise.all([readJson<ReelRecord[]>(REELS), readJson<AboutRecord>(ABOUT)]);
      return {
        reels: reels.map((r) => ({id: r.id, title: r.title, category: r.category, instagramUrl: r.instagramUrl, publishedAt: r.publishedAt})),
        about
      };
    }

    case 'add_reel': {
      const a = addSchema.parse(input);
      const reels = z.array(reelSchema).parse(await readJson(REELS));
      const url = normalizeInstagramUrl(a.instagramUrl);
      if (reels.some((r) => r.instagramUrl === url)) throw new Error('That reel is already on the site.');
      const reel = reelSchema.parse({
        id: `${slug(a.title.en) || 'reel'}-${Math.random().toString(36).slice(2, 6)}`,
        title: a.title,
        description: a.description,
        instagramUrl: url,
        category: a.category,
        featured: a.featured ?? false,
        publishedAt: new Date().toISOString()
      });
      ctx.lastSha = await commitFiles(`agent: add reel "${a.title.en}"`, [{path: REELS, content: asJson([reel, ...reels])}]);
      return {ok: true, id: reel.id, note: 'Live in about a minute, once the site redeploys.'};
    }

    case 'update_reel': {
      const {id, ...changes} = updateSchema.parse(input);
      const reels = z.array(reelSchema).parse(await readJson(REELS));
      const i = reels.findIndex((r) => r.id === id);
      if (i < 0) throw new Error(`No reel with id ${id}. Use list_content to see ids.`);
      if (changes.instagramUrl) changes.instagramUrl = normalizeInstagramUrl(changes.instagramUrl);
      reels[i] = reelSchema.parse({...reels[i], ...changes});
      ctx.lastSha = await commitFiles(`agent: update reel "${reels[i].title.en}"`, [{path: REELS, content: asJson(reels)}]);
      return {ok: true, note: 'Live in about a minute.'};
    }

    case 'delete_reel': {
      const {id} = z.object({id: z.string()}).parse(input);
      const reels = z.array(reelSchema).parse(await readJson(REELS));
      const reel = reels.find((r) => r.id === id);
      if (!reel) throw new Error(`No reel with id ${id}.`);
      ctx.confirmations.push({label: `🗑 Delete "${reel.title.en}"`, data: `del:${id}`});
      return {status: 'awaiting_confirmation', note: 'A confirm button was sent. Nothing is deleted until the user presses it.'};
    }

    case 'update_about': {
      const c = aboutUpdateSchema.parse(input);
      if (!c.philosophy && !c.quote && !c.timeline) throw new Error('Nothing to change.');
      const about = aboutSchema.parse(await readJson(ABOUT));
      const next = aboutSchema.parse({...about, ...Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined))});
      ctx.lastSha = await commitFiles('agent: update about page', [{path: ABOUT, content: asJson(next)}]);
      return {ok: true, note: 'Live in about a minute.'};
    }

    case 'set_about_portrait': {
      if (!ctx.photo) throw new Error('No photo attached to this message. Ask the user to send the photo with their request.');
      const about = aboutSchema.parse(await readJson(ABOUT));
      const jpg = await sharp(ctx.photo).rotate().resize({width: 1600, withoutEnlargement: true}).jpeg({quality: 82, mozjpeg: true}).toBuffer();
      const path = `public/uploads/about/portrait-${Date.now().toString(36)}.jpg`;
      const files: FileChange[] = [
        {path, content: jpg},
        {path: ABOUT, content: asJson({...about, portrait: `/${path.replace(/^public\//, '')}`})}
      ];
      if (about.portrait?.startsWith('/uploads/')) files.push({path: `public${about.portrait}`, content: null});
      ctx.lastSha = await commitFiles('agent: update about portrait', files);
      return {ok: true, note: 'Live in about a minute.'};
    }

    case 'undo_last_change': {
      const r = await undoHead();
      if (!r.ok) throw new Error(r.reason);
      return {ok: true, undone: r.undone};
    }

    default:
      throw new Error(`Unknown tool ${name}`);
  }
}

/** Executes a confirmed destructive action from a button press. */
export async function runConfirmed(data: string): Promise<string> {
  if (data.startsWith('del:')) {
    const id = data.slice(4);
    const reels = z.array(reelSchema).parse(await readJson(REELS));
    const reel = reels.find((r) => r.id === id);
    if (!reel) return 'That reel was already gone.';
    await commitFiles(`agent: delete reel "${reel.title.en}"`, [{path: REELS, content: asJson(reels.filter((r) => r.id !== id))}]);
    return `Deleted "${reel.title.en}". Say "undo" if that was a mistake.`;
  }
  if (data.startsWith('undo:')) {
    const r = await undoHead(data.slice(5));
    return r.ok ? `Undone: ${r.undone}` : r.reason;
  }
  return 'Unknown action.';
}
