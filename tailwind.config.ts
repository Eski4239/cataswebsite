import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#111111',
        surface: '#1C1A19',
        burgundy: '#6E0F1F',
        gold: '#B08D57',
        ivory: '#F5EFE6',
        muted: '#C8B9A6',
        border: '#2A2725'
      },
      fontFamily: {
        heading: ['var(--font-cormorant)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif']
      },
      boxShadow: {
        cinematic: '0 16px 50px rgba(0,0,0,0.45)'
      }
    }
  },
  plugins: []
};

export default config;
