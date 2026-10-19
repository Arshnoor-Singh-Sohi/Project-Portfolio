import test from 'node:test';
import assert from 'node:assert/strict';
import { createLabsHandler, segmentsFromRequest } from '../../api/_lib/labs/router.js';
import { createMemoryStore } from '../../api/_lib/labs/store-memory.js';
import { readAuthConfig, createSessionToken, LOGIN_MAX_FAILURES } from '../../api/_lib/labs/auth.js';
import { makeReq, makeRes, client } from './support/http-mock.mjs';

const ENV = { LABS_PASSWORD: 'correct horse battery', LABS_SESSION_SECRET: 's'.repeat(40) };

function setup({ env = ENV, store = createMemoryStore(), devUser = null } = {}) {
  const config = readAuthConfig(env);
  const handler = createLabsHandler({ getStore: () => store, getAuthConfig: () => config, devUser });
  return { handler, store, config };
}

async function signedIn(handler) {
  const c = client(handler);
  const res = await c.call('POST', '/session', { password: ENV.LABS_PASSWORD });
  assert.equal(res.statusCode, 200);
  return c;
}

const CONTENT = { cells: [{ id: 'm1', type: 'markdown', source: '# Hi' }, { id: 'c1', type: 'code', source: 'x = 1' }] };

test('segmentsFromRequest handles the dev URL and the Vercel rewrite', () => {
  assert.deepEqual(segmentsFromRequest({ url: '/api/labs' }), []);
  assert.deepEqual(segmentsFromRequest({ url: '/api/labs/abc123/versions/v1?x=1' }), ['abc123', 'versions', 'v1']);
  assert.deepEqual(segmentsFromRequest({ url: '/api/labs?path=abc123%2Fcontent', query: { path: 'abc123/content' } }), ['abc123', 'content']);
  assert.deepEqual(segmentsFromRequest({ url: '/api/labs', query: { path: ['abc123', 'starter'] } }), ['abc123', 'starter']);
});

test('storage or sign-in not configured gives 503 with the reason', async () => {
  const noStore = createLabsHandler({ getStore: () => null, getAuthConfig: () => readAuthConfig(ENV) });
  let res = makeRes();
  await noStore(makeReq({ url: '/api/labs' }), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.json.code, 'storage_not_configured');

  const { handler } = setup({ env: { LABS_PASSWORD: 'short' } });
  res = makeRes();
  await handler(makeReq({ url: '/api/labs' }), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.json.code, 'auth_not_configured');
  assert.ok(res.json.problems.some((p) => p.includes('LABS_SESSION_SECRET')));

  res = makeRes();
  await handler(makeReq({ url: '/api/labs/session' }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.configured.auth, false);
});

test('sign in, session cookie, sign out', async () => {
  const { handler } = setup();
  const anon = client(handler);
  let res = await anon.call('GET', '');
  assert.equal(res.statusCode, 401);
  res = await anon.call('GET', '/session');
  assert.equal(res.json.authenticated, false);

  res = await anon.call('POST', '/session', { password: 'wrong' });
  assert.equal(res.statusCode, 401);
  assert.match(res.json.error, /attempt\(s\) left/);

  res = await anon.call('POST', '/session', { password: ENV.LABS_PASSWORD });
  assert.equal(res.statusCode, 200);
  const cookie = res.headers['set-cookie'];
  assert.match(cookie, /^labs_session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Path=\/api\/labs/);
  assert.doesNotMatch(cookie, /Secure/, 'no Secure flag on plain http');

  res = await anon.call('GET', '/session');
  assert.equal(res.json.authenticated, true);
  res = await anon.call('GET', '');
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json.labs, []);

  res = await anon.call('DELETE', '/session');
  assert.match(res.headers['set-cookie'], /Max-Age=0/);
  res = await anon.call('GET', '');
  assert.equal(res.statusCode, 401);
});

test('Secure cookie behind https', async () => {
  const { handler } = setup();
  const res = await client(handler).call('POST', '/session', { password: ENV.LABS_PASSWORD }, { 'x-forwarded-proto': 'https' });
  assert.match(res.headers['set-cookie'], /Secure/);
});

test('tampered, expired or old-password sessions are refused', async () => {
  const { handler, config } = setup();
  const good = createSessionToken(config, 'owner');
  const [body, sig] = good.split('.');
  const forged = `${Buffer.from(JSON.stringify({ v: 1, u: 'owner', iat: 0, exp: 9e9, pw: 'x' })).toString('base64url')}.${sig}`;
  for (const token of [forged, `${body}.AAAA`, 'garbage', createSessionToken(config, 'owner', Date.now() - 31 * 864e5)]) {
    const res = await client(handler, { cookie: `labs_session=${token}` }).call('GET', '');
    assert.equal(res.statusCode, 401, token);
  }
  const otherPassword = readAuthConfig({ ...ENV, LABS_PASSWORD: 'a different password' });
  const res = await client(handler, { cookie: `labs_session=${createSessionToken(otherPassword, 'owner')}` }).call('GET', '');
  assert.equal(res.statusCode, 401, 'changing LABS_PASSWORD signs old sessions out');
});

test('failed sign-ins are rate limited per IP', async () => {
  const { handler } = setup();
  const c = client(handler, { ip: '1.2.3.4' });
  for (let i = 0; i < LOGIN_MAX_FAILURES; i++) await c.call('POST', '/session', { password: 'nope' });
  const res = await c.call('POST', '/session', { password: ENV.LABS_PASSWORD });
  assert.equal(res.statusCode, 429);
  const other = await client(handler, { ip: '5.6.7.8' }).call('POST', '/session', { password: ENV.LABS_PASSWORD });
  assert.equal(other.statusCode, 200, 'another IP is not blocked');
});

test('writes need the X-Labs-Request header and a same-site Origin', async () => {
  const { handler } = setup();
  const c = await signedIn(handler);
  let res = await c.call('POST', '', { title: 'x', content: CONTENT }, { 'x-labs-request': '' });
  assert.equal(res.statusCode, 403);
  res = await c.call('POST', '', { title: 'x', content: CONTENT }, { origin: 'https://evil.test' });
  assert.equal(res.statusCode, 403);
  res = await c.call('POST', '/session', { password: ENV.LABS_PASSWORD }, { origin: 'https://evil.test' });
  assert.equal(res.statusCode, 403);
  res = await c.call('POST', '', { title: 'x', content: CONTENT });
  assert.equal(res.statusCode, 201);
});

test('lab lifecycle: create, list, get, patch, save, conflict, starter, duplicate, delete', async () => {
  const { handler } = setup();
  const c = await signedIn(handler);

  let res = await c.call('POST', '', { title: 'FFT lab', tags: ['FFT'], objectives: ['one', 'two'], content: CONTENT, template: 'fft-explorer' });
  assert.equal(res.statusCode, 201);
  const { lab } = res.json;
  assert.equal(lab.title, 'FFT lab');
  assert.deepEqual(lab.tags, ['fft']);
  assert.equal(lab.revision, 1);
  assert.equal(lab.cellCount, 2);
  assert.equal(lab.status, 'not-started');
  assert.equal(lab.template, 'fft-explorer');

  res = await c.call('GET', '');
  assert.equal(res.json.labs.length, 1);

  res = await c.call('GET', `/${lab.id}`);
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.revision, 1);
  assert.equal(res.json.content.cells[1].source, 'x = 1');

  res = await c.call('PATCH', `/${lab.id}`, { title: 'FFT lab v2', objectivesDone: [1], opened: true, status: 'in-progress' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.lab.title, 'FFT lab v2');
  assert.deepEqual(res.json.lab.objectivesDone, [1]);
  assert.ok(res.json.lab.openedAt);
  res = await c.call('PATCH', `/${lab.id}`, {});
  assert.equal(res.statusCode, 400);
  res = await c.call('PATCH', `/${lab.id}`, { title: '' });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.field, 'title');

  const edited = { cells: [...CONTENT.cells, { id: 'c2', type: 'code', source: 'print(x)', outputs: [{ type: 'stream', name: 'stdout', text: '1\n' }] }] };
  res = await c.call('PUT', `/${lab.id}/content`, { baseRevision: 1, content: edited, lastCellId: 'c2' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.revision, 2);

  res = await c.call('PUT', `/${lab.id}/content`, { baseRevision: 1, content: CONTENT });
  assert.equal(res.statusCode, 409);
  assert.equal(res.json.code, 'conflict');
  assert.equal(res.json.revision, 2);

  res = await c.call('PUT', `/${lab.id}/content`, { content: CONTENT });
  assert.equal(res.statusCode, 400, 'baseRevision is required');

  res = await c.call('GET', `/${lab.id}`);
  assert.equal(res.json.content.cells.length, 3, 'the stale save did not win');
  assert.equal(res.json.lab.lastCellId, 'c2');
  assert.equal(res.json.lab.cellCount, 3);
  assert.equal(res.json.lab.title, 'FFT lab v2', 'content save keeps the rename');

  res = await c.call('GET', `/${lab.id}/starter`);
  assert.equal(res.json.content.cells.length, 2);

  res = await c.call('POST', '', { duplicateOf: lab.id });
  assert.equal(res.statusCode, 201);
  const copy = res.json.lab;
  assert.equal(copy.title, 'FFT lab v2 (copy)');
  assert.notEqual(copy.id, lab.id);
  assert.equal(res.json.content.cells[2].outputs[0].text, '1\n', 'duplicate keeps outputs');
  res = await c.call('GET', `/${copy.id}/starter`);
  assert.equal(res.json.content.cells.length, 3, 'the copy starts from the state at duplication');
  assert.deepEqual(res.json.content.cells[2].outputs, []);

  res = await c.call('DELETE', `/${lab.id}`);
  assert.equal(res.statusCode, 204);
  res = await c.call('GET', `/${lab.id}`);
  assert.equal(res.statusCode, 404);
  res = await c.call('DELETE', `/${lab.id}`);
  assert.equal(res.statusCode, 404);
  res = await c.call('GET', '');
  assert.deepEqual(res.json.labs.map((l) => l.id), [copy.id]);
});

test('versions: create from saved content, list, read, delete', async () => {
  const { handler } = setup();
  const c = await signedIn(handler);
  const { lab } = (await c.call('POST', '', { title: 'V', content: CONTENT })).json;
  let res = await c.call('POST', `/${lab.id}/versions`, { label: 'first try', reason: 'manual' });
  assert.equal(res.statusCode, 201);
  const v = res.json.version;
  assert.equal(v.label, 'first try');
  assert.equal(v.cellCount, 2);
  res = await c.call('POST', `/${lab.id}/versions`, { reason: 'weird' });
  assert.equal(res.json.version.reason, 'manual');
  assert.equal(res.json.version.label, 'Saved version');
  res = await c.call('GET', `/${lab.id}/versions`);
  assert.equal(res.json.versions.length, 2);
  res = await c.call('GET', `/${lab.id}/versions/${v.id}`);
  assert.equal(res.json.content.cells[1].source, 'x = 1');
  res = await c.call('DELETE', `/${lab.id}/versions/${v.id}`);
  assert.equal(res.statusCode, 204);
  res = await c.call('GET', `/${lab.id}/versions/${v.id}`);
  assert.equal(res.statusCode, 404);
});

test('validation errors and unknown routes', async () => {
  const { handler } = setup();
  const c = await signedIn(handler);
  let res = await c.call('POST', '', { title: 'x', content: { cells: [{ id: 'a', type: 'code' }, { id: 'a', type: 'code' }] } });
  assert.equal(res.statusCode, 400);
  res = await c.call('POST', '', { content: CONTENT });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.field, 'title');
  const huge = { cells: Array.from({ length: 20 }, (_, i) => ({ id: `c${i}`, type: 'markdown', source: 'x'.repeat(190_000) })) };
  res = await c.call('POST', '', { title: 'big', content: huge });
  assert.equal(res.statusCode, 413);
  assert.equal(res.json.code, 'too_large');
  res = await c.call('GET', '/%2e%2e%2f%2e%2e%2fetc');
  assert.equal(res.statusCode, 404);
  res = await c.call('GET', '/abcdefgh/nothing');
  assert.equal(res.statusCode, 404);
  res = await c.call('PUT', '');
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'GET, POST');
  const req = makeReq({ method: 'POST', url: '/api/labs', headers: { 'x-labs-request': '1', cookie: c.jar.cookie }, body: '{not json' });
  const r = makeRes();
  await handler(req, r);
  assert.equal(r.statusCode, 400);
  assert.equal(r.json.code, 'bad_json');
});

test('one user cannot reach another user\'s labs', async () => {
  const store = createMemoryStore();
  const { handler } = setup({ store });
  await store.createLab('someone-else', { meta: { id: 'secret01', title: 'secret' }, stats: {}, contentJson: '{"cells":[]}', starterJson: '{"cells":[]}' });
  const c = await signedIn(handler);
  assert.deepEqual((await c.call('GET', '')).json.labs, []);
  for (const [m, p] of [['GET', '/secret01'], ['PATCH', '/secret01'], ['DELETE', '/secret01'], ['GET', '/secret01/starter'], ['GET', '/secret01/versions']]) {
    const res = await c.call(m, p, m === 'PATCH' ? { title: 'pwned' } : undefined);
    assert.equal(res.statusCode, 404, `${m} ${p}`);
  }
  const res = await c.call('PUT', '/secret01/content', { baseRevision: 1, content: { cells: [] } });
  assert.equal(res.statusCode, 404);
  assert.equal((await store.getLab('someone-else', 'secret01')).meta.title, 'secret');
});

test('dev mode signs in automatically', async () => {
  const { handler } = setup({ env: {}, devUser: { id: 'dev' } });
  const c = client(handler);
  const res = await c.call('GET', '/session');
  assert.equal(res.json.authenticated, true);
  assert.equal(res.json.mode, 'dev');
  assert.equal((await c.call('POST', '', { title: 'd', content: CONTENT })).statusCode, 201);
});

test('responses are never cached', async () => {
  const { handler } = setup();
  const res = await client(handler).call('GET', '/session');
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('vercel.json routes /api/labs/* to the function and sends the worker CSP', async () => {
  const { readFileSync } = await import('node:fs');
  const { WORKER_CSP } = await import('../../src/lib/labs/worker-csp.js');
  const cfg = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
  const labsRewrite = cfg.rewrites.findIndex((r) => r.source === '/api/labs/:path*' && r.destination === '/api/labs');
  const spaRewrite = cfg.rewrites.findIndex((r) => r.source === '/(.*)');
  assert.ok(labsRewrite !== -1, 'rewrite exists');
  assert.ok(labsRewrite < spaRewrite, 'it comes before the SPA fallback');
  const block = cfg.headers.find((h) => h.source === '/labs-runtime/(.*)');
  const csp = block.headers.find((h) => h.key === 'Content-Security-Policy').value;
  assert.equal(csp, WORKER_CSP, 'vercel.json and src/lib/labs/worker-csp.js must match');
  assert.doesNotMatch(csp, /'self'/, 'the worker must not reach this site');
});
