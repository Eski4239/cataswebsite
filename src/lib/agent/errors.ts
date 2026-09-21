// Turns low-level failures into short messages the owners can act on. Never includes secrets or stack traces.
import Anthropic from '@anthropic-ai/sdk';

const CHECK = ' Say "show content" to check what is live, then try again.';

export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);

  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return 'I cannot reach Claude: the API key looks wrong or not allowed. Please tell whoever set up the bot.';
  }
  if (e instanceof Anthropic.APIError && /credit balance/i.test(msg)) {
    return 'The Anthropic account has run out of credit, so I cannot think right now. Please top it up in the Anthropic console.';
  }
  if (
    e instanceof Anthropic.RateLimitError ||
    e instanceof Anthropic.InternalServerError ||
    e instanceof Anthropic.APIConnectionError ||
    (e instanceof Anthropic.APIError && e.status === 529)
  ) {
    return 'Claude is busy right now. Please try again in a minute.' + CHECK;
  }
  if (/^GitHub .*-> (401|403)/.test(msg)) {
    return 'I cannot save to the website: the GitHub token is missing, expired or lacks write access. Please tell whoever set up the bot.';
  }
  if (/^GitHub /.test(msg)) return 'GitHub had a problem saving the change.' + CHECK;
  if (/^Telegram /.test(msg)) return 'Telegram had a problem.' + CHECK;
  if (/is not set up yet/.test(msg)) return msg;
  return 'Something went wrong, so I may not have finished.' + CHECK;
}
