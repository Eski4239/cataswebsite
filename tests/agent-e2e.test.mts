// Offline end-to-end test: Telegram webhook -> agent -> (fake) Claude -> tools -> (fake) GitHub -> (fake) Telegram.
// Includes failure cases. Run: npm run test:agent
import fs from 'fs';
import sharp from 'sharp';
Object.assign(process.env, {TELEGRAM_WEBHOOK_SECRET: 's3cret', TELEGRAM_BOT_TOKEN: 'tok', TELEGRAM_ALLOWED_USERS: 'jajasaluu2,pabsgv', ANTHROPIC_API_KEY: 'k', GITHUB_TOKEN: 'gh'});
const R = new URL('../', import.meta.url).pathname; // repo root, so the tests work from any checkout
const FIX = R + 'tests/fixtures/';
const jpg = await sharp({create: {width: 2400, height: 1600, channels: 3, background: '#722'}}).jpeg().toBuffer();

// ---------- fake world ----------
const files = new Map<string, Buffer>(); for (const f of ['reels', 'tastings', 'bottle', 'about']) files.set(`content/${f}.json`, fs.readFileSync(`${FIX}${f}.json`));
const blobs = new Map<string, Buffer>(); let head = 0; let headMsg = 'human'; const commitLog: string[] = [];
const tg: {method: string; body: any}[] = []; const claudeReqs: any[] = []; let claudeScript: ((req: any) => Response | object)[] = []; let patch422Once = false; let claudeCalls = 0;
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), {status, headers: {'content-type': 'application/json'}});
globalThis.fetch = (async (url: string, init?: RequestInit) => {
  const u = String(url), m = init?.method ?? 'GET'; const raw = init?.body;
  if (u.startsWith('https://api.telegram.org/file/')) return new Response(new Uint8Array(jpg));
  if (u.startsWith('https://api.telegram.org/')) { const method = u.split('/').pop()!; const body = raw instanceof FormData ? {} : JSON.parse(String(raw)); tg.push({method, body}); return J({ok: true, result: method === 'getFile' ? {file_path: 'photos/x.jpg'} : {}}); }
  if (u.startsWith('https://api.anthropic.com/')) { claudeCalls++; const body = JSON.parse(String(raw)); claudeReqs.push(body); const step = claudeScript.shift(); if (!step) throw new Error('unscripted claude call'); const r = step(body); return r instanceof Response ? r : J(r); }
  const body = raw ? JSON.parse(String(raw)) : {};
  if (u.includes('/contents/')) return J({content: files.get(u.split('/contents/')[1].split('?')[0])!.toString('base64')});
  if (u.includes('/git/ref/heads')) return J({object: {sha: `h${head}`}});
  if (/\/git\/commits\/h\d+$/.test(u)) return J({tree: {sha: 't'}, message: headMsg, parents: [{sha: 'p'}]});
  if (u.endsWith('/git/blobs')) { const id = `b${blobs.size}`; blobs.set(id, Buffer.from(body.content, 'base64')); return J({sha: id}); }
  if (u.endsWith('/git/trees')) { for (const t of body.tree) t.sha === null ? files.delete(t.path) : files.set(t.path, blobs.get(t.sha)!); return J({sha: 'nt'}); }
  if (u.endsWith('/git/commits') && m === 'POST') { headMsg = body.message; head++; commitLog.push(body.message); return J({sha: `h${head}`}); }
  if (u.includes('/git/refs/heads') && m === 'PATCH') { if (patch422Once) { patch422Once = false; return J({message: 'not a fast forward'}, 422); } return J({}); }
  throw new Error('unmocked ' + m + ' ' + u);
}) as typeof fetch;

const {POST} = await import(R + 'src/app/api/telegram/route.ts');
let uid = 1000; const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const send = (u: any, secret = 's3cret') => POST(new Request('https://x/api/telegram', {method: 'POST', headers: {'x-telegram-bot-api-secret-token': secret}, body: typeof u === 'string' ? u : JSON.stringify(u)}));
const msg = (over: any = {}, from = {id: 5, username: 'pabsgv'}) => ({update_id: ++uid, message: {message_id: uid, from, chat: {id: 5}, ...over}});
const msgText = (text: string) => msg({text});
const sent = () => tg.filter((t) => t.method === 'sendMessage').map((t) => t.body);
const reset = () => { tg.length = 0; claudeReqs.length = 0; claudeScript = []; claudeCalls = 0; };
const ok = (c: boolean, m: string, extra = '') => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : extra); if (!c) process.exitCode = 1; };
const msgResp = (content: any[], stop = 'end_turn') => ({id: 'm', type: 'message', role: 'assistant', model: 'claude-sonnet-5', content, stop_reason: stop, stop_sequence: null, usage: {input_tokens: 1, output_tokens: 1}});
const toolUse = (name: string, input: any) => msgResp([{type: 'tool_use', id: 'tu1', name, input}], 'tool_use');
const say = (text: string) => msgResp([{type: 'text', text}]);
const reels = () => JSON.parse(files.get('content/reels.json')!.toString());
const errResp = (status: number, type: string, message: string) => J({type: 'error', error: {type, message}}, status);

// ---------- 1. security & robustness of the entry point ----------
ok((await send(msgText('hi'), 'wrong')).status === 403, 'wrong secret -> 403');
ok((await POST(new Request('https://x', {method: 'POST', body: '{}'}))).status === 403, 'missing secret header -> 403');
ok((await send('not json{{')).status === 200 && claudeCalls === 0, 'malformed JSON body -> 200, nothing happens');
ok((await send({foo: 'bar'})).status === 200 && tg.length === 0, 'unknown payload -> 200, nothing happens');
reset(); const r0 = await send(msg({text: 'add a reel'}, {id: 9, username: 'stranger'})); await wait();
ok(r0.status === 200 && tg.length === 0 && claudeCalls === 0, 'stranger: no reply, no Claude call, no Telegram traffic');
reset(); await send(msg({text: '/id'}, {id: 9, username: 'stranger'})); await wait();
ok(sent().length === 1 && /9/.test(sent()[0].text) && claudeCalls === 0, 'stranger can only learn their own ID');

// ---------- 2. happy path: add a reel ----------
reset(); const commitsBefore = commitLog.length;
claudeScript = [() => toolUse('add_reel', {instagramUrl: 'https://www.instagram.com/reel/NEWREEL1/', title: {en: 'Sherry Secrets', es: 'Secretos del Jerez'}, description: {en: 'How sherry ages', es: 'Cómo envejece el jerez'}, category: 'Regions'}), () => say('Added "Sherry Secrets". Live in about a minute.')];
const t0 = Date.now(); const r1 = await send(msgText('Add this reel https://www.instagram.com/reel/NEWREEL1/ about sherry')); const ackMs = Date.now() - t0; await wait(500);
ok(r1.status === 200, `webhook acknowledges immediately (${ackMs}ms)`);
ok(reels()[0].instagramUrl.endsWith('NEWREEL1/') && reels()[0].title.es === 'Secretos del Jerez' && commitLog.length === commitsBefore + 1 && commitLog.at(-1)!.startsWith('agent:'), 'reel committed with both languages, "agent:" commit message');
const s1 = sent().at(-1); ok(/Sherry Secrets/.test(s1.text) && s1.reply_markup?.inline_keyboard?.[0]?.[0]?.callback_data?.startsWith('undo:'), 'user gets confirmation with an Undo button');
ok(claudeReqs[0].model === 'claude-sonnet-5', 'uses claude-sonnet-5');
ok(/\[Now: .*Madrid time\]/.test(JSON.stringify(claudeReqs[0].messages)), 'current Madrid time is given to the model');

// ---------- 3. duplicate delivery ----------
reset(); const dup = msgText('dup'); claudeScript = [() => say('ok')]; await send(dup); await send(dup); await wait();
ok(claudeCalls === 1 && sent().length === 1, 'same update delivered twice is processed once');

// ---------- 4. memory across messages ----------
reset(); claudeScript = [() => say('What is the Instagram link?'), () => say('Got it.')];
await send(msgText('add a reel about Rioja')); await wait(); await send(msgText('https://www.instagram.com/reel/RIOJA9/')); await wait();
const second = claudeReqs[1].messages; const shape = second.map((m: any) => `${m.role}:${typeof m.content === 'string' ? m.content.slice(0, 40) : '[blocks]'}`);
const i = second.findIndex((m: any) => m.content === 'add a reel about Rioja');
ok(i >= 0 && second[i + 1]?.role === 'assistant' && second[i + 1].content === 'What is the Instagram link?' && second.at(-1).role === 'user' && /RIOJA9/.test(JSON.stringify(second.at(-1).content)), 'follow-up message includes the previous exchange, then the new message', JSON.stringify(shape));
ok(second.every((m: any, k: number) => k === 0 ? m.role === 'user' : m.role !== second[k - 1].role), 'roles strictly alternate (valid for the API)');

// ---------- 5. photos: compressed photo and image sent as a file ----------
reset(); claudeScript = [() => say('Nice photo.')];
await send(msg({photo: [{file_id: 'small', width: 90, height: 90}, {file_id: 'big', width: 1280, height: 960}], caption: 'is this ok?'})); await wait();
ok(tg.some((t) => t.method === 'getFile' && t.body.file_id === 'big') && JSON.stringify(claudeReqs[0].messages.at(-1).content).includes('"type":"image"'), 'photo: largest size downloaded and shown to Claude');
reset(); claudeScript = [() => say('Got the file.')];
await send(msg({document: {file_id: 'doc1', mime_type: 'image/jpeg'}, caption: 'portrait'})); await wait();
ok(tg.some((t) => t.method === 'getFile' && t.body.file_id === 'doc1') && JSON.stringify(claudeReqs[0].messages.at(-1).content).includes('"type":"image"'), 'image sent as a file is accepted');
reset(); await send(msg({document: {file_id: 'pdf', mime_type: 'application/pdf'}})); await wait();
ok(claudeCalls === 0 && /photos/.test(sent()[0].text), 'PDF/other files: polite refusal, no Claude call');
reset(); await send(msg({sticker: {}})); await wait();
ok(claudeCalls === 0 && sent().length === 1, 'sticker / empty message: helpful reply, no Claude call');

// ---------- 6. photo used by a tool (tasting cover) ----------
reset(); claudeScript = [() => toolUse('add_tasting', {title: {en: 'Ribera Night', es: 'Noche de Ribera'}, city: {en: 'Madrid', es: 'Madrid'}, date: '2099-05-01', description: {en: 'd', es: 'd'}, price: 60, usePhoto: true}), () => say('Tasting added.')];
await send(msg({photo: [{file_id: 'p', width: 800, height: 600}], caption: 'add tasting'})); await wait(600);
const tast = JSON.parse(files.get('content/tastings.json')!.toString()).at(-1); ok(tast.price === 60 && tast.image?.startsWith('/uploads/tastings/') && files.has('public' + tast.image), 'tasting with photo saved (JSON + image file)');

// ---------- 7. delete needs a button press ----------
reset(); const rid = reels()[0].id; const nBefore = reels().length;
claudeScript = [() => toolUse('delete_reel', {id: rid}), () => say('Press the button to confirm deletion.')];
await send(msgText('delete the sherry reel')); await wait(500);
const btn = sent().at(-1).reply_markup.inline_keyboard[0][0]; ok(reels().length === nBefore && btn.callback_data === `del:${rid}`, 'delete asks for confirmation and deletes nothing yet');
reset(); await send({update_id: ++uid, callback_query: {id: 'cb1', from: {id: 5, username: 'pabsgv'}, data: btn.callback_data, message: {message_id: 7, chat: {id: 5}}}}); await wait(500);
ok(reels().length === nBefore - 1 && tg.some((t) => t.method === 'answerCallbackQuery'), 'pressing confirm deletes it');
reset(); await send({update_id: ++uid, callback_query: {id: 'cb2', from: {id: 9, username: 'stranger'}, data: btn.callback_data, message: {message_id: 7, chat: {id: 5}}}}); await wait(300);
ok(tg.length === 0, 'stranger pressing a button does nothing');

// ---------- 8. failures ----------
reset(); claudeScript = [() => errResp(401, 'authentication_error', 'invalid x-api-key')]; await send(msgText('anything')); await wait(500);
ok(/API key/.test(sent().at(-1)?.text ?? ''), 'bad Anthropic key -> clear message', sent().at(-1)?.text);
reset(); claudeScript = [() => errResp(400, 'invalid_request_error', 'Your credit balance is too low to access the Anthropic API')]; await send(msgText('anything')); await wait(500);
ok(/credit/.test(sent().at(-1)?.text ?? ''), 'no Anthropic credit -> clear message', sent().at(-1)?.text);
reset(); claudeScript = [() => errResp(429, 'rate_limit_error', 'slow down'), () => errResp(429, 'rate_limit_error', 'slow down'), () => errResp(429, 'rate_limit_error', 'slow down')]; await send(msgText('anything')); await wait(4000);
ok(/busy/.test(sent().at(-1)?.text ?? ''), 'Claude rate-limited -> "busy, try again"', sent().at(-1)?.text);
reset(); claudeScript = [() => toolUse('add_reel', {instagramUrl: 'https://www.instagram.com/reel/RACE1/', title: {en: 'Race', es: 'Carrera'}, description: {en: 'd', es: 'd'}, category: 'Grapes'}), () => say('Added.')];
patch422Once = true; await send(msgText('add race reel')); await wait(700);
ok(reels().some((r: any) => r.instagramUrl.includes('RACE1')) && /Added/.test(sent().at(-1).text), 'concurrent commit (422) is retried and succeeds');
reset(); claudeScript = [() => toolUse('add_reel', {instagramUrl: 'https://example.com/x', title: {en: 'a', es: 'a'}, description: {en: 'a', es: 'a'}, category: 'Grapes'}), () => say('That link is not from Instagram, please send an Instagram link.')];
await send(msgText('add reel')); await wait(500);
ok(claudeReqs[1].messages.at(-1).content[0].is_error === true && /Instagram/.test(claudeReqs[1].messages.at(-1).content[0].content), 'tool error is passed back to Claude so it can explain to the user');
reset(); claudeScript = Array(9).fill(() => toolUse('list_content', {})); await send(msgText('loop forever')); await wait(1500);
ok(/too many steps/.test(sent().at(-1)?.text ?? ''), 'runaway tool loop is stopped after 8 steps');
console.log(`\ncommits made: ${commitLog.length}; content still valid JSON: ${['reels','tastings','bottle','about'].every(f => { try { JSON.parse(files.get(`content/${f}.json`)!.toString()); return true; } catch { return false; } })}`);
setTimeout(() => process.exit(process.exitCode ?? 0), 100);
