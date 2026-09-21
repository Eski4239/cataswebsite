// Weekly digest — a friendly nudge plus stats, sent to Telegram every Monday by the cron job.
import {readJson} from './github';
import {todayInMadrid} from './time';
import {getSiteStats, statsConfigured} from './stats';
import type {BottleRecord, ReelRecord, TastingRecord} from '../content/schema';

const DAY = 86_400_000;

export async function buildDigest(): Promise<string> {
  const [reels, tastings, bottle] = await Promise.all([
    readJson<ReelRecord[]>('content/reels.json'),
    readJson<TastingRecord[]>('content/tastings.json'),
    readJson<BottleRecord>('content/bottle.json')
  ]);
  const now = Date.now();
  const live = reels.filter((r) => Date.parse(r.publishedAt) <= now).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const scheduled = reels.filter((r) => Date.parse(r.publishedAt) > now);
  const today = todayInMadrid();
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
    const inDays = Math.round((Date.parse(t.date) - Date.parse(today)) / DAY);
    if (inDays <= 14) {
      en.push(`• "${t.title.en}" is in ${inDays} day(s). Time to promote it with a reel?`);
      es.push(`• "${t.title.es}" es en ${inDays} día(s). Momento de promocionarla con un reel.`);
    }
  }

  const bottleAge = bottle.updatedAt ? Math.round((Date.parse(today) - Date.parse(bottle.updatedAt)) / DAY) : null;
  if (bottleAge === null || bottleAge >= 10) {
    en.push(
      `• The Bottle of the Week ("${bottle.wineName}") ${bottleAge === null ? 'has not been updated since I started tracking it' : `has been the same for ${bottleAge} days`}. Fancy a new one?`
    );
    es.push(
      `• La Botella de la Semana ("${bottle.wineName}") ${bottleAge === null ? 'no se ha actualizado desde que llevo la cuenta' : `es la misma desde hace ${bottleAge} días`}. ¿Ponemos una nueva?`
    );
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
