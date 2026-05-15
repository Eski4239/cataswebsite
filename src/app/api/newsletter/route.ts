import {Resend} from 'resend';
export async function POST(req: Request){const {email}=await req.json();if(!process.env.RESEND_API_KEY)return Response.json({ok:true});const resend=new Resend(process.env.RESEND_API_KEY);await resend.emails.send({from:'journal@luistorrescatas.com',to:'luis@luistorrescatas.com',subject:'New Journal Signup',text:email});return Response.json({ok:true});}
