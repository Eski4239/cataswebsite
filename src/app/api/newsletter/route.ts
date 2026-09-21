// Newsletter signup API route — stores the subscriber in the Resend audience (used by the Telegram agent's
// newsletters) and notifies Luis. Without RESEND_API_KEY it does nothing, so local dev works.
import {Resend} from 'resend';

export async function POST(req: Request) {
  const {email} = await req.json();
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ok: false}, {status: 400});
  }
  if (!process.env.RESEND_API_KEY) return Response.json({ok: true});

  const resend = new Resend(process.env.RESEND_API_KEY);
  if (process.env.RESEND_AUDIENCE_ID) {
    await resend.contacts.create({audienceId: process.env.RESEND_AUDIENCE_ID, email, unsubscribed: false});
  }
  await resend.emails.send({from: 'journal@luistorrescatas.com', to: 'luis@luistorrescatas.com', subject: 'New Journal Signup', text: email});
  return Response.json({ok: true});
}
