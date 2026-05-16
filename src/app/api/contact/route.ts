// Contact form API route — receives form data and forwards via Resend email
import {Resend} from 'resend';
export async function POST(req: Request){const body=await req.json();if(!process.env.RESEND_API_KEY)return Response.json({ok:true});const resend=new Resend(process.env.RESEND_API_KEY);await resend.emails.send({from:'contact@luistorrescatas.com',to:'luis@luistorrescatas.com',subject:`Contact: ${body.category}`,text:JSON.stringify(body,null,2)});return Response.json({ok:true});}
