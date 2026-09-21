// Offline tests for the SEO helpers (structured data). Run: npm run test:site
const R = new URL('../', import.meta.url).pathname;
const {buildEventsJsonLd, buildJsonLd, jsonLdScript, siteUrl} = await import(R + 'src/lib/seo/metadata.ts');

let failed = false;
const ok = (c: boolean, m: string, extra = '') => {
  console.log(c ? 'PASS' : 'FAIL', m, c ? '' : extra);
  if (!c) failed = true;
};

const tasting = {
  id: 't1',
  title: 'Ribera Night',
  city: 'Madrid',
  isoDate: '2099-07-01',
  time: '20:00',
  dateLabel: '1 July 2099',
  timeLabel: '8:00 PM',
  description: 'A tasting',
  longDescription: 'A longer tasting',
  price: 60,
  image: '/uploads/tastings/x.jpg'
};

ok(buildEventsJsonLd('en', []) === null, 'no tastings -> no event data');
const events = buildEventsJsonLd('en', [
  tasting,
  {...tasting, id: 't2', time: undefined, price: undefined, image: 'https://images.unsplash.com/a.jpg'}
]);
const [a, b] = events!['@graph'];
ok(
  a['@type'] === 'Event' && a.startDate === '2099-07-01T18:00:00.000Z',
  'event start time is converted from Madrid time (summer = UTC+2)',
  a.startDate
);
ok(a.offers?.price === 60 && a.offers.priceCurrency === 'EUR', 'price becomes an EUR offer');
ok(a.image === `${siteUrl}/uploads/tastings/x.jpg`, 'local image path becomes an absolute URL', a.image);
ok(
  b.startDate === '2099-07-01' && b.offers === undefined && b.image.startsWith('https://images.unsplash.com'),
  'no time / no price / remote image handled'
);
ok(!jsonLdScript({x: '</script><script>alert(1)</script>'}).includes('</script>'), 'structured data cannot break out of its script tag');
const site = buildJsonLd('es');
ok(
  site['@graph'][0].inLanguage === 'es' && JSON.stringify(site).includes('instagram.com/luistorrescatas'),
  'site data follows the language and links Instagram'
);

process.exit(failed ? 1 : 0);
