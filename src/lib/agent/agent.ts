// The agent loop: Claude + tools. Stateless per Telegram message (undo and delete use buttons).
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import {nowInMadrid} from './time';
import {newsletterEnabled, runTool, tools, type ToolContext} from './tools';

const client = new Anthropic();
const MODEL = process.env.AGENT_MODEL || 'claude-sonnet-5';
const MAX_STEPS = 8;

const SYSTEM = `You are the website assistant for Luis Torres Catas, an art historian who presents wine through history, culture and storytelling. You talk to Luis and his brother on Telegram and keep the website up to date for them.

The site is bilingual (English and Spanish). Every piece of text you save must exist in BOTH languages. When the user gives text in one language, translate it faithfully into the other and keep Luis's warm, curious, editorial voice. Never invent facts (dates, vintages, historical claims) that the user did not give you; if something needed is missing, ask a short question instead.

What you can do:
- Reels on the Media page: add, edit, delete, and schedule for later (categories: History, Regions, Grapes, Tastings, Beginner Guides). Adding needs the Instagram link.
- Tastings (upcoming events): add, edit, delete. They vanish from the site automatically after their date. Ask for date and city if missing; price and time are optional; never invent a price.
- Bottle of the Week on the home page.
- About page text and portrait.
${newsletterEnabled() ? '- Newsletter to the subscriber list: draft it in both languages. Sending only happens when the user presses the Send button.\n' : '- There is no newsletter or contact form on the site yet (visitors are sent to Instagram), so you cannot send newsletters.\n'}- Site statistics, and backups (a zip of the whole site sent to this chat).
If asked for anything else (layout, design, prices of other things, new pages), say it is not something you can change yet.

Photos: a photo attached to the message can become the cover of a tasting, the bottle photo, or the About portrait. Only use it when the user's request makes clear which.

Scheduling: times are Madrid time. The current Madrid date and time is given at the start of each message; use it to resolve words like "Friday". If a reel time is not given, use 18:00.

Rules:
- If required information is missing, ask one short question instead of guessing.
- Deleting always goes through a button, so tell the user to press it.${newsletterEnabled() ? ' For a newsletter, show the subject and both language versions in your reply so they can review it before pressing Send.' : ''}
- Changes go live about a minute after saving. Say so briefly, and if a tool note says a follow-up message will confirm it, say that.
- Reply in the language the user wrote in, in a few short lines, plain text, no markdown. After a change, say exactly what you saved (both language versions when text is involved) so they can check it.`;

/** Rough cost in USD for the default model (Sonnet 5: $2 per million input tokens, $10 per million output; cache reads 10%, writes 125%). */
function estimateCost(u: {input: number; output: number; cacheRead: number; cacheWrite: number}) {
  const usd = (u.input * 2 + u.output * 10 + u.cacheRead * 0.2 + u.cacheWrite * 2.5) / 1_000_000;
  return Math.round(usd * 10000) / 10000;
}

export async function runAgent(
  text: string,
  ctx: ToolContext,
  replyTo?: string,
  history: {user: string; assistant: string}[] = []
): Promise<string> {
  const content: Anthropic.ContentBlockParam[] = [];
  if (ctx.photo) {
    const small = await sharp(ctx.photo).rotate().resize({width: 1024, withoutEnlargement: true}).jpeg({quality: 70}).toBuffer();
    content.push({type: 'image', source: {type: 'base64', media_type: 'image/jpeg', data: small.toString('base64')}});
  }
  content.push({
    type: 'text',
    text:
      `[Now: ${nowInMadrid()} Madrid time]\n` +
      (replyTo ? `[Replying to earlier message: "${replyTo.slice(0, 500)}"]\n` : '') +
      (text || '(photo attached, no caption)')
  });

  const messages: Anthropic.MessageParam[] = [
    ...history.flatMap((h): Anthropic.MessageParam[] => [
      {role: 'user', content: h.user},
      {role: 'assistant', content: h.assistant}
    ]),
    {role: 'user', content}
  ];

  const usage = {input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0};
  const logUsage = () => console.log(JSON.stringify({event: 'agent_usage', model: MODEL, ...usage, approxUsd: estimateCost(usage)}));

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      cache_control: {type: 'ephemeral'}, // the tools and system prompt are identical every call, so re-reads are cheap
      system: SYSTEM,
      tools,
      messages,
      thinking: {type: 'adaptive'},
      output_config: {effort: 'medium'}
    });

    usage.calls++;
    usage.input += res.usage.input_tokens;
    usage.output += res.usage.output_tokens;
    usage.cacheRead += res.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += res.usage.cache_creation_input_tokens ?? 0;

    if (res.stop_reason === 'refusal') {
      logUsage();
      return 'I cannot help with that request.';
    }
    messages.push({role: 'assistant', content: res.content});

    if (res.stop_reason !== 'tool_use') {
      logUsage();
      return (
        res.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
          .trim() || 'Done.'
      );
    }

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== 'tool_use') continue;
      try {
        const out = await runTool(block.name, block.input, ctx);
        results.push({type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(out)});
      } catch (e) {
        results.push({type: 'tool_result', tool_use_id: block.id, is_error: true, content: e instanceof Error ? e.message : String(e)});
      }
    }
    messages.push({role: 'user', content: results});
  }
  logUsage();
  return 'That took too many steps. Please try again with a simpler request.';
}
