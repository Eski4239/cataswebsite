// GitHub webhook — GitHub tells us when Vercel finishes deploying a commit. If that commit was made by the Telegram
// agent, the chat it came from is told whether the change is really live (or the build failed).
// Setup: repo Settings -> Webhooks -> payload URL https://<site>/api/github-webhook, content type application/json,
// secret = GITHUB_WEBHOOK_SECRET, event "Deployment statuses".
import {createHmac, timingSafeEqual} from 'node:crypto';
import {waitUntil} from '@vercel/functions';
import {chatFromCommitMessage} from '@/lib/agent/context';
import {getCommitMessage} from '@/lib/agent/github';
import {sendMessage} from '@/lib/agent/telegram';

export const runtime = 'nodejs';
export const maxDuration = 30;

function validSignature(body: string, header: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

type DeploymentStatusEvent = {
  deployment_status?: {state?: string; target_url?: string};
  deployment?: {sha?: string; environment?: string};
};

async function notify(event: DeploymentStatusEvent) {
  const state = event.deployment_status?.state;
  const sha = event.deployment?.sha;
  if (!sha || !state || !/production/i.test(event.deployment?.environment ?? '')) return;
  if (state !== 'success' && state !== 'failure' && state !== 'error') return; // ignore pending / in progress

  const message = await getCommitMessage(sha);
  if (!message.startsWith('agent:')) return; // only changes made through the bot
  const chatId = chatFromCommitMessage(message);
  if (chatId === undefined) return;

  const what = message.split('\n')[0].replace(/^agent: /, '');
  await sendMessage(
    chatId,
    state === 'success'
      ? `✅ It is live now: ${what}`
      : `❌ The site failed to deploy after: ${what}. The change is saved but is not live. Say "undo" to reverse it, or tell whoever looks after the site.`
  );
}

export async function POST(req: Request) {
  const body = await req.text();
  if (!validSignature(body, req.headers.get('x-hub-signature-256'))) return new Response('forbidden', {status: 403});
  if (req.headers.get('x-github-event') !== 'deployment_status') return Response.json({ok: true});

  let event: DeploymentStatusEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return Response.json({ok: true});
  }
  waitUntil(notify(event).catch((e) => console.error('github webhook notify failed', e)));
  return Response.json({ok: true});
}
