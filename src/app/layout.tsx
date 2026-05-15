import '@/styles/globals.css';
import {Inter, Cormorant_Garamond} from 'next/font/google';

const inter = Inter({subsets:['latin'], variable:'--font-inter'});
const cormorant = Cormorant_Garamond({subsets:['latin'], variable:'--font-cormorant'});

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en" className={`${inter.variable} ${cormorant.variable}`}><body>{children}</body></html>;
}
