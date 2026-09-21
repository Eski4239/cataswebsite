// Time helpers — the site owners are in Spain, so scheduling is expressed in Europe/Madrid local time.
export const TZ = 'Europe/Madrid';

/** Current date/time in Madrid, e.g. "Monday 21 September 2026, 14:05". Given to the model so it can resolve "next Friday". */
export const nowInMadrid = () =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());

/** Madrid weekday (1 = Monday ... 7 = Sunday) and day of month, for the cron dispatcher. */
export function madridParts(d = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {timeZone: TZ, weekday: 'short', day: 'numeric'}).formatToParts(d).map((x) => [x.type, x.value])
  );
  const weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday) + 1;
  return {weekday, day: Number(p.day)};
}

/** Convert a Madrid wall-clock time ("2026-10-02T18:00") to a UTC ISO string, handling daylight saving. */
export function madridLocalToIso(local: string): string {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) throw new Error('Time must look like 2026-10-02T18:00 (Madrid time).');
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const offsetAt = (t: number) => {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone: TZ,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      })
        .formatToParts(new Date(t))
        .map((x) => [x.type, x.value])
    );
    return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute) - t;
  };
  const guess = asUtc - offsetAt(asUtc);
  return new Date(asUtc - offsetAt(guess)).toISOString();
}
