import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAF7F2',
        surface: '#FFFFFF',
        burgundy: '#6B2737',
        gold: '#B8976A',
        ivory: '#FAF7F2',
        charcoal: '#2C2C2C',
        muted: '#6B6B6B',
        border: '#E8E2DA'
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
