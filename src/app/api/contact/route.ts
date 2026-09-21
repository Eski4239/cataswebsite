// Contact form API route — validates the inquiry and forwards it to Luis via Resend (reply goes to the visitor).
import {Resend} from 'resend';
import {z} from 'zod';

const CATEGORIES = ['Collaborations', 'Private Tastings', 'Media', 'Partnerships', 'General Inquiry'] as const;
const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  category: z.enum(CATEGORIES).default('General Inquiry'),
  message: z.string().trim().min(1).max(5000)
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ok: false, error: 'invalid'}, {status: 400});
  if (!process.env.RESEND_API_KEY) return Response.json({ok: true});

  const {name, email, category, message} = parsed.data;
  const {error} = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: 'contact@luistorrescatas.com',
    to: 'luis@luistorrescatas.com',
    replyTo: email,
    subject: `Contact: ${category} (${name})`,
    text: `Name: ${name}\nEmail: ${email}\nCategory: ${category}\n\n${message}`
  });
  if (error) {
    console.error('contact email failed', error);
    return Response.json({ok: false}, {status: 502});
  }
  return Response.json({ok: true});
}
