// Newsletter signup API route — stores the subscriber in the Resend audience (used by the Telegram agent's
// newsletters) and notifies Luis. Without RESEND_API_KEY it does nothing, so local dev works.
import {Resend} from 'resend';

export async function POST(req: Request) {
  const {email} = ((await req.json().catch(() => null)) ?? {}) as {email?: unknown};
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ok: false}, {status: 400});
  }
  if (!process.env.RESEND_API_KEY) return Response.json({ok: true});

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    if (process.env.RESEND_AUDIENCE_ID) {
      const r = await resend.contacts.create({audienceId: process.env.RESEND_AUDIENCE_ID, email, unsubscribed: false});
      if (r.error) throw new Error(r.error.message);
    }
    await resend.emails.send({from: 'journal@luistorrescatas.com', to: 'luis@luistorrescatas.com', subject: 'New Journal Signup', text: email});
    return Response.json({ok: true});
  } catch (e) {
    console.error('newsletter signup failed', e);
    return Response.json({ok: false}, {status: 502});
  }
}
