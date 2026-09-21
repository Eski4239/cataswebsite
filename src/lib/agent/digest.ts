// Weekly digest — a friendly nudge plus stats, sent to Telegram every Monday by the cron job.
import {readJson} from './github';
import {getSiteStats, statsConfigured} from './stats';
import type {ReelRecord, TastingRecord} from '../content/schema';

const DAY = 86_400_000;

export async function buildDigest(): Promise<string> {
  const [reels, tastings] = await Promise.all([readJson<ReelRecord[]>('content/reels.json'), readJson<TastingRecord[]>('content/tastings.json')]);
  const now = Date.now();
  const live = reels.filter((r) => Date.parse(r.publishedAt) <= now).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const scheduled = reels.filter((r) => Date.parse(r.publishedAt) > now);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = tastings.filter((t) => t.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  const en: string[] = ['Good morning! Weekly website check-in.'];
  const es: string[] = ['¡Buenos días! Resumen semanal de la web.'];

  const daysSince = live[0] ? Math.floor((now - Date.parse(live[0].publishedAt)) / DAY) : null;
  if (daysSince === null || daysSince >= 14) {
    en.push(`• No new reel for ${daysSince ?? 'a long'} days. Got one to share? Just send me the Instagram link.`);
    es.push(`• Hace ${daysSince ?? 'mucho'} días que no hay un reel nuevo. ¿Tienes alguno? Envíame el enlace de Instagram.`);
  } else {
    en.push(`• Last reel went up ${daysSince} day(s) ago. Nice rhythm!`);
    es.push(`• El último reel se subió hace ${daysSince} día(s). ¡Buen ritmo!`);
  }
  if (scheduled.length) {
    en.push(`• ${scheduled.length} reel(s) scheduled to publish.`);
    es.push(`• ${scheduled.length} reel(s) programado(s).`);
  }
  if (upcoming.length === 0) {
    en.push('• No upcoming tastings on the site. Send me the details of the next one when it is planned.');
    es.push('• No hay catas próximas en la web. Envíame los detalles de la siguiente cuando esté planeada.');
  } else {
    const t = upcoming[0];
    const inDays = Math.ceil((Date.parse(t.date) - now) / DAY);
    if (inDays <= 14) {
      en.push(`• "${t.title.en}" is in ${inDays} day(s). Time to promote it: a reel or a newsletter?`);
      es.push(`• "${t.title.es}" es en ${inDays} día(s). Momento de promocionarla: ¿un reel o una newsletter?`);
    }
  }

  let stats = '';
  if (statsConfigured()) {
    try {
      stats = '\n\n' + (await getSiteStats(7));
    } catch (e) {
      console.error('digest stats failed', e);
    }
  }
  return `${en.join('\n')}\n\n${es.join('\n')}${stats}`;
}
