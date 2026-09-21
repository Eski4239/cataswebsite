// Social share image (WhatsApp, Instagram, Facebook, X): brand colours and tagline, in the page's language.
import {ImageResponse} from 'next/og';
import {isLocale, locales} from '@/lib/i18n/routing';

export const alt = 'Catas Luis de Torres';
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

const TAGLINE = {en: 'Wine is history you can taste.', es: 'El vino es historia que se puede saborear.'};

/** Cormorant Garamond from Google Fonts, subset to the glyphs needed. Falls back to the default font if unreachable. */
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const tagline = TAGLINE[isLocale(locale) ? locale : 'en'];
  const font = await loadFont(`${TAGLINE.en}${TAGLINE.es}Catas Luis de Torres CATAS LUIS DE TORRES @luistorrescatas`);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#6B2737',
        color: '#FAF7F2',
        padding: '72px 88px',
        fontFamily: font ? 'Cormorant' : 'serif'
      }}
    >
      <div style={{display: 'flex', fontSize: 30, letterSpacing: 8, color: '#B8976A'}}>CATAS LUIS DE TORRES</div>
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex', width: 96, height: 3, background: '#B8976A', marginBottom: 36}} />
        <div style={{display: 'flex', fontSize: 92, lineHeight: 1.08, maxWidth: 940}}>{tagline}</div>
      </div>
      <div style={{display: 'flex', fontSize: 30, color: '#B8976A'}}>@luistorrescatas</div>
    </div>,
    {...size, fonts: font ? [{name: 'Cormorant', data: font, style: 'normal', weight: 400}] : undefined}
  );
}
