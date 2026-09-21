// Best-effort short-term conversation memory so a follow-up ("here is the link") still has context.
// Held in memory per server instance with a short TTL, so it can be lost between requests; every message is
// still fully understandable on its own. Swap for Redis (e.g. Upstash) if durable memory is ever needed.
type Turn = {user: string; assistant: string; at: number};

const TTL_MS = 30 * 60 * 1000;
const MAX_TURNS = 8;
const store = new Map<number, Turn[]>();

export function getHistory(chatId: number): Turn[] {
  const fresh = (store.get(chatId) ?? []).filter((t) => Date.now() - t.at < TTL_MS);
  store.set(chatId, fresh);
  return fresh;
}

export function remember(chatId: number, user: string, assistant: string) {
  const turns = [...getHistory(chatId), {user: user.slice(0, 1500), assistant: assistant.slice(0, 1500), at: Date.now()}];
  store.set(chatId, turns.slice(-MAX_TURNS));
}

/** Skip work for updates Telegram delivered twice to the same instance. */
const seen = new Set<number>();
export function alreadyHandled(updateId: number): boolean {
  if (seen.has(updateId)) return true;
  seen.add(updateId);
  if (seen.size > 500) seen.delete(seen.values().next().value as number);
  return false;
}
