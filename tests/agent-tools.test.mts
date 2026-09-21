// Offline tests for the agent's tools against an in-memory fake GitHub. Run: npm run test:agent
import fs from 'fs';
import sharp from 'sharp';
process.env.GITHUB_TOKEN = 'x'; process.env.TELEGRAM_ALLOWED_USERS = 'jajasaluu2,123,@pabsgv,456';

const R = new URL('../', import.meta.url).pathname; // repo root, so the tests work from any checkout
const FIX = R + 'tests/fixtures/';
const files = new Map<string, Buffer>();
for (const f of ['reels', 'tastings', 'bottle', 'about']) files.set(`content/${f}.json`, fs.readFileSync(`${FIX}${f}.json`));
files.set('public/uploads/about/portrait.jpg', await sharp({create: {width: 100, height: 100, channels: 3, background: '#444'}}).jpeg().toBuffer());
const blobs = new Map<string, Buffer>(); const commits: {message: string; before: Map<string, Buffer>}[] = [];
let headMsg = 'human commit'; let n = 0;
const json = (o: unknown) => new Response(JSON.stringify(o), {status: 200});
globalThis.fetch = (async (url: string, init?: RequestInit) => {
  const u = String(url); const m = init?.method ?? 'GET'; const body = init?.body ? JSON.parse(String(init.body)) : {};
  if (u.includes('/contents/')) { const p = u.split('/contents/')[1].split('?')[0]; return json({content: files.get(p)!.toString('base64')}); }
  if (u.includes('/git/ref/heads')) return json({object: {sha: `h${n}`}});
  if (u.match(/\/git\/commits\/h\d+$/)) return json({tree: {sha: `t${n}`}, message: headMsg, parents: [{sha: `h${n - 1}`}]});
  if (u.endsWith('/git/blobs')) { const id = `b${blobs.size}`; blobs.set(id, Buffer.from(body.content, 'base64')); return json({sha: id}); }
  if (u.endsWith('/git/trees')) { const snap = new Map(files); commits.push({message: '', before: snap}); for (const t of body.tree) t.sha === null ? files.delete(t.path) : files.set(t.path, blobs.get(t.sha)!); return json({sha: `t${n + 1}`}); }
  if (u.endsWith('/git/commits') && m === 'POST') { commits[commits.length - 1].message = body.message; headMsg = body.message; n++; return json({sha: `h${n}`}); }
  if (u.includes('/git/commits/h') && m === 'GET') { const i = Number(u.split('/h').pop()); return json({tree: {sha: 't'}, message: headMsg, parents: [{sha: 'p'}]}); }
  if (u.includes('/git/refs/heads') && m === 'PATCH') return json({});
  throw new Error('unmocked ' + m + ' ' + u);
}) as typeof fetch;

const {runTool, runConfirmed} = await import(R + 'src/lib/agent/tools.ts');
const {madridLocalToIso, madridParts} = await import(R + 'src/lib/agent/time.ts');
const {isAllowed, notifyChatIds} = await import(R + 'src/lib/agent/telegram.ts');
const {buildDigest} = await import(R + 'src/lib/agent/digest.ts');
const ok = (c: boolean, msg: string) => { console.log(c ? 'PASS' : 'FAIL', msg); if (!c) process.exitCode = 1; };
const J = (p: string) => JSON.parse(files.get(p)!.toString());
const ctx = () => ({chatId: 1, confirmations: [] as any[], photo: undefined as Buffer | undefined, lastSha: undefined as string | undefined});
const L = (en: string, es: string) => ({en, es});

// time
ok(madridLocalToIso('2026-10-02T18:00') === '2026-10-02T16:00:00.000Z', 'Madrid summer time -> UTC (+2)');
ok(madridLocalToIso('2026-12-02T18:00') === '2026-12-02T17:00:00.000Z', 'Madrid winter time -> UTC (+1)');
ok(madridLocalToIso('2026-10-25T02:30').endsWith('Z'), 'DST edge does not throw');
// auth
ok(isAllowed({id: 5, username: 'JajaSaluu2'}) && isAllowed({id: 123}) && isAllowed({id: 9, username: 'pabsgv'}), 'allowlist: username (case-insens.), id, @-prefixed');
ok(!isAllowed({id: 7, username: 'stranger'}) && !isAllowed(undefined), 'allowlist rejects strangers');
ok(JSON.stringify(notifyChatIds()) === '[123,456]', 'notify ids = numeric entries only');

// reels
const n0 = J('content/reels.json').length; const tn0 = J('content/tastings.json').length;
let c = ctx();
let r: any = await runTool('add_reel', {instagramUrl: 'https://www.instagram.com/reel/ABC123/?igsh=xyz', title: L('Test wine', 'Vino de prueba'), description: L('d', 'd'), category: 'Grapes', publishAt: '2099-01-01T18:00'}, c);
ok(r.scheduled && J('content/reels.json')[0].publishedAt === '2099-01-01T17:00:00.000Z' && J('content/reels.json')[0].instagramUrl === 'https://www.instagram.com/reel/ABC123/', 'scheduled reel saved, URL normalised');
const rid = J('content/reels.json')[0].id;
await runTool('add_reel', {instagramUrl: 'https://instagram.com/reel/ABC123/', title: L('x', 'x'), description: L('x', 'x'), category: 'Grapes'}, ctx()).then(() => ok(false, 'duplicate blocked'), () => ok(true, 'duplicate reel rejected'));
await runTool('add_reel', {instagramUrl: 'https://example.com/foo', title: L('x', 'x'), description: L('x', 'x'), category: 'Grapes'}, ctx()).then(() => ok(false, 'bad url blocked'), () => ok(true, 'non-Instagram URL rejected'));
await runTool('update_reel', {id: rid, publishAt: '2026-01-01T10:00', category: 'History'}, ctx());
ok(J('content/reels.json')[0].category === 'History' && J('content/reels.json')[0].publishedAt < '2027', 'reel rescheduled + edited');
c = ctx(); r = await runTool('delete_reel', {id: rid}, c);
ok(r.status === 'awaiting_confirmation' && c.confirmations[0].data === `del:${rid}` && J('content/reels.json').length === n0 + 1, 'delete_reel only asks for confirmation');
ok(c.confirmations[0].data.length <= 64, 'callback data within Telegram 64-byte limit');
await runConfirmed(c.confirmations[0].data);
ok(J('content/reels.json').length === n0, 'delete happens after confirmation');

// tastings
const jpg = await sharp({create: {width: 3000, height: 2000, channels: 3, background: '#722'}}).jpeg().toBuffer();
c = ctx(); c.photo = jpg;
r = await runTool('add_tasting', {title: L('Ribera Night', 'Noche de Ribera'), city: L('Madrid', 'Madrid'), date: '2099-05-01', time: '20:00', description: L('a', 'a'), price: 60, usePhoto: true}, c);
const t = J('content/tastings.json').at(-1);
const img = files.get('public' + t.image)!;
ok(t.price === 60 && t.image.startsWith('/uploads/tastings/') && (await sharp(img).metadata()).width === 1600, 'tasting added with resized photo (1600px)');
await runTool('add_tasting', {title: L('Bad', 'Mal'), city: L('a', 'a'), date: '1/5/2099', description: L('a', 'a')}, ctx()).then(() => ok(false, 'bad date blocked'), () => ok(true, 'malformed date rejected'));
await runTool('add_tasting', {title: L('P', 'P'), city: L('a', 'a'), date: '2099-05-01', description: L('a', 'a'), usePhoto: true}, ctx()).then(() => ok(false, 'no photo blocked'), () => ok(true, 'usePhoto without photo gives clear error'));
c = ctx(); await runTool('update_tasting', {id: t.id, price: 75}, c);
ok(J('content/tastings.json').at(-1).price === 75 && J('content/tastings.json').at(-1).title.en === 'Ribera Night', 'tasting partial update keeps other fields');
c = ctx(); await runTool('delete_tasting', {id: t.id}, c); await runConfirmed(c.confirmations[0].data);
ok(J('content/tastings.json').length === tn0, 'tasting deleted after confirmation');

// bottle + about portrait replaces old file
c = ctx(); c.photo = jpg;
await runTool('set_bottle', {wineName: 'Pesquera 2018', story: L('story', 'historia'), usePhoto: true}, c);
ok(J('content/bottle.json').wineName === 'Pesquera 2018' && J('content/bottle.json').winery === 'López de Heredia' && J('content/bottle.json').image?.startsWith('/uploads/bottle/'), 'bottle partial update + photo');
c = ctx(); c.photo = jpg; await runTool('set_about_portrait', {}, c);
ok(!files.has('public/uploads/about/portrait.jpg') && J('content/about.json').portrait.startsWith('/uploads/about/portrait-'), 'portrait replaced, old file removed');
await runTool('update_about', {}, ctx()).then(() => ok(false, 'empty about blocked'), () => ok(true, 'empty update_about rejected'));

// newsletter is only offered when Resend is configured
const {tools: offered, newsletterEnabled} = await import(R + 'src/lib/agent/tools.ts');
ok(!newsletterEnabled() && !offered.some((t: any) => t.name === 'draft_newsletter'), 'newsletter tool is not offered while Resend is not configured');
ok(offered.some((t: any) => t.name === 'add_reel'), 'other tools are still offered');

// undo + safety
headMsg = 'human commit';
r = await runConfirmed('undo:h1').then((x: string) => x); ok(/not made by me|Something else/.test(r), 'undo refuses non-agent / stale head: ' + r);
console.log(commits.length, 'commits made; all content valid:', ['reels', 'tastings', 'bottle', 'about'].every((f) => { try { JSON.parse(files.get(`content/${f}.json`)!.toString()); return true; } catch { return false; } }));
const d = await buildDigest(); ok(/Weekly website check-in/.test(d) && /Buenos días/.test(d), 'digest builds (EN + ES)'); console.log('\n' + d);
