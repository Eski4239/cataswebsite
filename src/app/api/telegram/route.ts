// Telegram webhook — receives messages from Luis and his brother and lets the agent update the site.
import {waitUntil} from '@vercel/functions';
import {runAgent} from '@/lib/agent/agent';
import {friendlyError} from '@/lib/agent/errors';
import {alreadyHandled, getHistory, remember} from '@/lib/agent/history';
import {runConfirmed, type ToolContext} from '@/lib/agent/tools';
import {
  answerCallback,
  clearButtons,
  downloadFile,
  isAllowed,
  sendMessage,
  sendTyping,
  type TgMessage,
  type TgUpdate
} from '@/lib/agent/telegram';

export const runtime = 'nodejs';
export const maxDuration = 60;

const HELP =
  'I can update the website for you.\n\n' +
  '• Reels: send an Instagram link and tell me about it. I write it up in English and Spanish. Say "schedule it for Friday 6pm" to publish later.\n' +
  '• Tastings: tell me the date, city and details (and send a photo for the cover).\n' +
  '• Bottle of the week: tell me the wine and its story (a photo is optional).\n' +
  '• About page text and portrait photo.\n' +
  '• Newsletter: tell me what to announce. I draft it and you press Send.\n' +
  '• "stats" for visitor numbers, "backup" for a full copy, "show content" to see what is live, "undo" to reverse my last change.';

async function handleMessage(msg: TgMessage) {
  const chatId = msg.chat.id;
  const text = (msg.text ?? msg.caption ?? '').trim();

  // Anyone can ask for their own numeric ID (needed to set up the allowlist); nothing else works for strangers.
  if (text.startsWith('/id')) {
    await sendMessage(chatId, `Your Telegram ID is ${msg.from?.id}`);
    return;
  }
  if (!isAllowed(msg.from)) return;

  if (text === '/start' || text === '/help') {
    await sendMessage(chatId, HELP);
    return;
  }
  const imageDoc = msg.document?.mime_type?.startsWith('image/') ? msg.document : undefined;
  if (msg.video || msg.voice || (msg.document && !imageDoc)) {
    await sendMessage(chatId, 'I can only handle text and photos for now. For videos, post the reel on Instagram and send me the link.');
    return;
  }
  if (!text && !msg.photo?.length && !imageDoc) {
    await sendMessage(chatId, 'I can only read text and photos. Tell me what you would like to change on the website, or send /help.');
    return;
  }

  await sendTyping(chatId);
  const ctx: ToolContext = {chatId, confirmations: []};
  const photoId = msg.photo?.length ? msg.photo[msg.photo.length - 1].file_id : imageDoc?.file_id;
  if (photoId) ctx.photo = await downloadFile(photoId);

  const userText = text.slice(0, 8000);
  const reply = await runAgent(userText, ctx, msg.reply_to_message?.text ?? msg.reply_to_message?.caption, getHistory(chatId));
  remember(chatId, (ctx.photo ? '[sent a photo] ' : '') + userText, reply);

  const buttons = [
    ...ctx.confirmations.map((c) => ({text: c.label, callback_data: c.data})),
    ...(ctx.lastSha ? [{text: '↩️ Undo', callback_data: `undo:${ctx.lastSha.slice(0, 12)}`}] : [])
  ];
  await sendMessage(chatId, reply, buttons);
}

async function handleCallback(cb: NonNullable<TgUpdate['callback_query']>) {
  if (!isAllowed(cb.from) || !cb.data || !cb.message) return;
  await answerCallback(cb.id);
  await clearButtons(cb.message.chat.id, cb.message.message_id).catch(() => {});
  await sendMessage(cb.message.chat.id, await runConfirmed(cb.data));
}

async function processUpdate(update: TgUpdate) {
  const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
  const from = update.message?.from ?? update.callback_query?.from;
  try {
    if (update.message) await handleMessage(update.message);
    else if (update.callback_query) await handleCallback(update.callback_query);
  } catch (e) {
    console.error('telegram agent error', e);
    if (chatId && isAllowed(from)) await sendMessage(chatId, friendlyError(e)).catch(() => {});
  }
}

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return new Response('forbidden', {status: 403});
  }

  const update = (await req.json().catch(() => null)) as TgUpdate | null;
  if (!update || typeof update.update_id !== 'number' || alreadyHandled(update.update_id)) return Response.json({ok: true});

  // Answer Telegram immediately (so it never retries and repeats an action) and keep working in the background.
  waitUntil(processUpdate(update));
  return Response.json({ok: true});
}
