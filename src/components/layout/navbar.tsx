'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';

const items=[['','Home'],['/tastings','Wine Tastings'],['/media','Media & Videos'],['/about','About'],['/contact','Contact']];
export function Navbar({locale}:{locale:string}){
  const [scrolled,setScrolled]=useState(false);const [open,setOpen]=useState(false);
  useEffect(()=>{const on=()=>setScrolled(window.scrollY>20);window.addEventListener('scroll',on);return()=>window.removeEventListener('scroll',on)},[]);
  return <header className={`fixed top-0 z-50 w-full transition-all duration-700 ${scrolled?'bg-background/85 backdrop-blur border-b border-border':'bg-transparent'}`}>
    <nav className='mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-xs uppercase tracking-[0.22em]'>
      <Link href={`/${locale}`} className='text-gold'>Luis Torres Catas</Link>
      <div className='hidden md:flex gap-8'>{items.map(([href,label])=><Link key={href} href={`/${locale}${href}`}>{label}</Link>)}</div>
      <button className='md:hidden' onClick={()=>setOpen(!open)}>Menu</button>
    </nav>
    {open&&<div className='md:hidden min-h-screen bg-background p-10'>{items.map(([href,label])=><Link className='block py-5 text-2xl font-heading' key={href} href={`/${locale}${href}`} onClick={()=>setOpen(false)}>{label}</Link>)}</div>}
  </header>
}
