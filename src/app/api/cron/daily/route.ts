// Daily cron (see vercel.json) — Mondays: weekly digest to Telegram; 1st of the month: backup.
// Vercel calls this with "Authorization: Bearer $CRON_SECRET". Add ?force=digest or ?force=backup (same auth) to test.
import {createBackup} from '@/lib/agent/backup';
import {buildDigest} from '@/lib/agent/digest';
import {notifyChatIds, sendMessage} from '@/lib/agent/telegram';
import {madridParts} from '@/lib/agent/time';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('forbidden', {status: 403});
  }

  const force = new URL(req.url).searchParams.get('force');
  const {weekday, day} = madridParts();
  const chats = notifyChatIds();
  const done: string[] = [];
  const errors: string[] = [];

  if (chats.length === 0) return Response.json({ok: false, error: 'No numeric Telegram IDs in TELEGRAM_ALLOWED_USERS or TELEGRAM_NOTIFY_CHAT_IDS'});

  if (force === 'digest' || (!force && weekday === 1)) {
    try {
      const text = await buildDigest();
      for (const id of chats) await sendMessage(id, text);
      done.push('digest');
    } catch (e) {
      errors.push(`digest: ${e instanceof Error ? e.message : e}`);
    }
  }
  if (force === 'backup' || (!force && day === 1)) {
    try {
      done.push(`backup ${await createBackup(chats)}`);
    } catch (e) {
      errors.push(`backup: ${e instanceof Error ? e.message : e}`);
    }
  }

  return Response.json({ok: errors.length === 0, done, errors});
}
