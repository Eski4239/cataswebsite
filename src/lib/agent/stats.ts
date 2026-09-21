// Site stats from the Vercel Web Analytics REST API (needs VERCEL_API_TOKEN).
const TEAM = process.env.VERCEL_TEAM_ID || 'team_pXHpvXw8jq4GL99HMSSqhEYK';
const PROJECT = process.env.VERCEL_PROJECT_ID || 'prj_gZAEsuw7nw42Uq0zLLYayqic8HoO';

async function query<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) throw new Error('Site stats are not set up yet: VERCEL_API_TOKEN is missing.');
  const qs = new URLSearchParams({
    projectId: PROJECT,
    teamId: TEAM,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  });
  const res = await fetch(`https://api.vercel.com/v1/query/web-analytics/${path}?${qs}`, {
    headers: {Authorization: `Bearer ${token}`},
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Vercel analytics ${path} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

type Row = Record<string, string | number>;

async function top(by: string, since: number, until: number, limit = 5): Promise<string> {
  const r = await query<{data: Row[]}>('visits/aggregate', {by, since, until, limit});
  const rows = r.data ?? [];
  if (!rows.length) return '  (no data yet)';
  return rows
    .map((row) => {
      const label = String(row[by] ?? Object.values(row).find((v) => typeof v === 'string') ?? '?') || '(direct)';
      const views = row.pageviews ?? row.count ?? row.visitors ?? '';
      return `  ${label} — ${views}`;
    })
    .join('\n');
}

export function statsConfigured() {
  return !!process.env.VERCEL_API_TOKEN;
}

/** Human-readable stats for the last `days` days. Throws if analytics is not configured or the API refuses. */
export async function getSiteStats(days = 7): Promise<string> {
  const until = Date.now();
  const since = until - days * 86_400_000;
  const total = await query<{data: {pageviews?: number; visitors?: number}}>('visits/count', {since, until});
  const [pages, sources, countries] = await Promise.all([
    top('requestPath', since, until),
    top('referrerHostname', since, until),
    top('country', since, until)
  ]);
  return `Last ${days} days: ${total.data?.visitors ?? '?'} visitors, ${total.data?.pageviews ?? '?'} page views\n\nTop pages:\n${pages}\n\nTop sources:\n${sources}\n\nTop countries:\n${countries}`;
}
