// Per-request context: which Telegram chat the current work belongs to. Lets commits be tagged with the chat
// they came from ("chat: <id>"), so a later deployment notification can be sent back to the right conversation.
import {AsyncLocalStorage} from 'node:async_hooks';

export const requestContext = new AsyncLocalStorage<{chatId: number}>();

/** Adds the "chat: <id>" trailer to a commit message when running inside a chat request. */
export function withChatTrailer(message: string): string {
  const chatId = requestContext.getStore()?.chatId;
  return chatId === undefined ? message : `${message}\n\nchat: ${chatId}`;
}

/** Reads the chat id back out of a commit message made by the agent. */
export function chatFromCommitMessage(message: string): number | undefined {
  const m = message.match(/^chat: (-?\d+)\s*$/m);
  return m ? Number(m[1]) : undefined;
}
