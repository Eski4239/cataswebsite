// Newsletter — drafts a bilingual broadcast in Resend; it is only sent after a button press in Telegram.
import {Resend} from 'resend';
import type {Localized} from '../content/schema';

const FROM = 'Luis Torres Catas <journal@luistorrescatas.com>';

function client() {
  const key = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audienceId) throw new Error('Newsletter is not set up yet: RESEND_API_KEY and RESEND_AUDIENCE_ID are needed.');
  return {resend: new Resend(key), audienceId};
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paragraphs = (s: string) =>
  s
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');

export function renderNewsletter(subject: Localized, body: Localized) {
  const html = `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#2a2523">
<h2 style="font-weight:400">${esc(subject.en)}</h2>${paragraphs(body.en)}
<hr style="border:none;border-top:1px solid #d9d2c8;margin:32px 0">
<h2 style="font-weight:400">${esc(subject.es)}</h2>${paragraphs(body.es)}
<p style="margin-top:40px;font-size:12px;color:#8a817a"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#8a817a">Unsubscribe / Darse de baja</a></p></div>`;
  return {subject: `${subject.en} · ${subject.es}`, html};
}

/** Creates an unsent broadcast. Returns its id and how many people it would reach. */
export async function createDraft(subject: Localized, body: Localized) {
  const {resend, audienceId} = client();
  const {subject: subj, html} = renderNewsletter(subject, body);
  const contacts = await resend.contacts.list({audienceId});
  const subscribers = contacts.data?.data.filter((c) => !c.unsubscribed).length ?? 0;
  if (subscribers === 0) throw new Error('There are no subscribers yet, so there is nobody to send to.');
  const created = await resend.broadcasts.create({
    audienceId,
    from: FROM,
    subject: subj,
    html,
    name: `agent ${new Date().toISOString().slice(0, 10)}`
  });
  if (created.error || !created.data) throw new Error(`Could not create draft: ${created.error?.message}`);
  return {id: created.data.id, subscribers};
}

export async function sendDraft(id: string): Promise<string> {
  const {resend} = client();
  const r = await resend.broadcasts.send(id);
  if (r.error) return `Could not send: ${r.error.message}`;
  return 'Newsletter sent. ✉️';
}

export async function discardDraft(id: string): Promise<string> {
  const {resend} = client();
  await resend.broadcasts.remove(id);
  return 'Newsletter draft discarded. Nothing was sent.';
}
