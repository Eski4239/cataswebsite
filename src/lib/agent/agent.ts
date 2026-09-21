// The agent loop: Claude + tools. Stateless per Telegram message (undo and delete use buttons).
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import {runTool, tools, type ToolContext} from './tools';

const client = new Anthropic();
const MODEL = process.env.AGENT_MODEL || 'claude-opus-5';
const MAX_STEPS = 8;

const SYSTEM = `You are the website assistant for Luis Torres Catas, an art historian who presents wine through history, culture and storytelling. You talk to Luis and his brother on Telegram and keep the website up to date for them.

The site is bilingual (English and Spanish). Every piece of text you save must exist in BOTH languages. When the user gives text in one language, translate it faithfully into the other and keep Luis's warm, curious, editorial voice. Never invent facts (dates, vintages, historical claims) that the user did not give you; if something needed is missing, ask a short question instead.

What you can do: add, edit and delete Instagram reels on the Media page (categories: History, Regions, Grapes, Tastings, Beginner Guides), edit the About page text, and replace the About portrait when a photo is attached. If asked for something else (tastings, bottle of the week, gallery, prices, layout), say it is not something you can change yet.

Rules:
- To add a reel you need the Instagram link. If it is missing, ask for it. Pick the most fitting category yourself unless told.
- Deleting always goes through a confirmation button, so tell the user to press it.
- Changes go live about a minute after saving. Say so briefly.
- Reply in the language the user wrote in, in a few short lines, plain text, no markdown. After a change, say exactly what you saved (both language versions when text is involved) so they can check it.`;

export async function runAgent(text: string, ctx: ToolContext, replyTo?: string): Promise<string> {
  const content: Anthropic.ContentBlockParam[] = [];
  if (ctx.photo) {
    const small = await sharp(ctx.photo).rotate().resize({width: 1024, withoutEnlargement: true}).jpeg({quality: 70}).toBuffer();
    content.push({type: 'image', source: {type: 'base64', media_type: 'image/jpeg', data: small.toString('base64')}});
  }
  content.push({
    type: 'text',
    text: (replyTo ? `[Replying to earlier message: "${replyTo.slice(0, 500)}"]\n` : '') + (text || '(photo attached, no caption)')
  });

  const messages: Anthropic.MessageParam[] = [{role: 'user', content}];

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      tools,
      messages,
      thinking: {type: 'adaptive'},
      output_config: {effort: 'medium'}
    });

    if (res.stop_reason === 'refusal') return 'I cannot help with that request.';
    messages.push({role: 'assistant', content: res.content});

    if (res.stop_reason !== 'tool_use') {
      return res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('\n').trim() || 'Done.';
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
  return 'That took too many steps. Please try again with a simpler request.';
}
