// Minimal Telegram Bot API client (fetch only, no dependencies).
const token = () => {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  return t;
};

async function call<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  const json = (await res.json()) as {ok: boolean; result: T; description?: string};
  if (!json.ok) throw new Error(`Telegram ${method}: ${json.description}`);
  return json.result;
}

export type InlineButton = {text: string; callback_data: string};

export async function sendMessage(chatId: number, text: string, buttons?: InlineButton[]) {
  // Telegram caps messages at 4096 characters.
  return call('sendMessage', {
    chat_id: chatId,
    text: text.slice(0, 4000),
    ...(buttons?.length ? {reply_markup: {inline_keyboard: buttons.map((b) => [b])}} : {})
  });
}

export const sendTyping = (chatId: number) => call('sendChatAction', {chat_id: chatId, action: 'typing'});

export const answerCallback = (id: string, text?: string) =>
  call('answerCallbackQuery', {callback_query_id: id, text});

export const clearButtons = (chatId: number, messageId: number) =>
  call('editMessageReplyMarkup', {chat_id: chatId, message_id: messageId, reply_markup: {inline_keyboard: []}});

/** Download a file the user sent (bots can fetch up to 20 MB). */
export async function downloadFile(fileId: string): Promise<Buffer> {
  const file = await call<{file_path: string}>('getFile', {file_id: fileId});
  const res = await fetch(`https://api.telegram.org/file/bot${token()}/${file.file_path}`);
  if (!res.ok) throw new Error(`Telegram file download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export type TgUser = {id: number; username?: string; first_name?: string};
export type TgMessage = {
  message_id: number;
  from?: TgUser;
  chat: {id: number};
  text?: string;
  caption?: string;
  photo?: {file_id: string; width: number; height: number}[];
  video?: unknown;
  document?: {file_id: string; mime_type?: string};
  sticker?: unknown;
  voice?: unknown;
  reply_to_message?: {text?: string; caption?: string};
};
export type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  callback_query?: {id: string; from: TgUser; data?: string; message?: {message_id: number; chat: {id: number}}};
};

/** Allowlist entries are numeric Telegram IDs or usernames (with or without @), comma-separated. */
export function isAllowed(user: TgUser | undefined): boolean {
  if (!user) return false;
  const list = (process.env.TELEGRAM_ALLOWED_USERS || '')
    .split(',')
    .map((s) => s.trim().replace(/^@/, '').toLowerCase())
    .filter(Boolean);
  return list.includes(String(user.id)) || (!!user.username && list.includes(user.username.toLowerCase()));
}

export async function sendDocument(chatId: number, data: Buffer, filename: string, caption?: string) {
  const form = new FormData();
  form.set('chat_id', String(chatId));
  if (caption) form.set('caption', caption.slice(0, 1000));
  form.set('document', new Blob([new Uint8Array(data)]), filename);
  const res = await fetch(`https://api.telegram.org/bot${token()}/sendDocument`, {method: 'POST', body: form});
  const json = (await res.json()) as {ok: boolean; description?: string};
  if (!json.ok) throw new Error(`Telegram sendDocument: ${json.description}`);
}

/**
 * Chats that receive scheduled messages (weekly digest, backups). Telegram can only message numeric chat IDs,
 * so these are the numeric entries of TELEGRAM_ALLOWED_USERS plus anything in TELEGRAM_NOTIFY_CHAT_IDS.
 */
export function notifyChatIds(): number[] {
  const raw = `${process.env.TELEGRAM_ALLOWED_USERS || ''},${process.env.TELEGRAM_NOTIFY_CHAT_IDS || ''}`;
  return [...new Set(raw.split(',').map((s) => s.trim()).filter((s) => /^\d+$/.test(s)).map(Number))];
}
