'use client';
import {useForm} from 'react-hook-form';
type Input={email:string};
export function JournalForm(){const {register,handleSubmit,formState:{isSubmitting}}=useForm<Input>();
const onSubmit=async(data:Input)=>{await fetch('/api/newsletter',{method:'POST',body:JSON.stringify(data)});};
return <section className='section-shell'><h2 className='font-heading text-5xl'>Join the Journal</h2><p className='mt-3 text-muted'>Letters from vineyards, archives, and private tasting tables.</p><form onSubmit={handleSubmit(onSubmit)} className='mt-7 flex max-w-xl gap-3'><input {...register('email',{required:true})} placeholder='Email address' className='flex-1 border border-border bg-surface px-4 py-3'/><button className='border border-gold px-6'>{isSubmitting?'Sending...':'Join'}</button></form></section>}
