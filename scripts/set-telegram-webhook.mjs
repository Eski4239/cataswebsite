// Usage: node --env-file=.env.local scripts/set-telegram-webhook.mjs https://your-site.com
// Points the Telegram bot at /api/telegram on the given site and registers the secret token.
const site = process.argv[2]?.replace(/\/$/, '');
const {TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret} = process.env;
if (!site || !token || !secret) {
  console.error('Need a site URL argument plus TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in the env.');
  process.exit(1);
}
const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({url: `${site}/api/telegram`, secret_token: secret, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true})
});
console.log(await res.json());
