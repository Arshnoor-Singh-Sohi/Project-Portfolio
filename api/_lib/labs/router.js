// api/_lib/labs/router.js
// ============================================================
// Every /api/labs route in one place. api/labs.js (Vercel) and
// plugins/vite-plugin-labs-api.js (npm run dev) both call
// createLabsHandler(), so production and development run the same
// code. Route table: LABS_ARCHITECTURE.md, section 4.
//
// Order of checks for lab routes:
//   storage configured (503) -> sign-in configured (503)
//   -> signed in (401) -> same-origin header on writes (403)
//   -> input validation (400 / 413) -> the lab exists (404)
// ============================================================

import {
  LIMITS,
  VERSION_REASONS,
  LabValidationError,
  applyMetaPatch,
  contentStats,
  createId,
  isCellId,
  isLabId,
  newMeta,
  normalizeContent,
  normalizeMetaInput,
  normalizeVersionLabel,
  serializeContent,
  stripOutputs,
  toPublicLab,
} from '../../../src/lib/labs/schema.js';
import { HttpError, readJsonBody, sendEmpty, sendError, sendJson, clientIp } from './http.js';
import {
  LOGIN_MAX_FAILURES,
  LOGIN_WINDOW_SECONDS,
  OWNER_ID,
  assertSameOriginWrite,
  checkPassword,
  clearSessionCookie,
  createSessionToken,
  getUserFromRequest,
  readAuthConfig,
  sessionCookie,
} from './auth.js';

// Path parts after /api/labs. Vercel rewrites /api/labs/:path* to
// this function and passes `path` as a query parameter; the dev
// server keeps the original URL. Both forms are handled.
export function segmentsFromRequest(req) {
  let rest = '';
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const m = /^\/api\/labs(\/.*)?$/.exec(url.pathname);
    rest = m && m[1] ? m[1] : '';
    if (!rest) {
      const q = req.query && req.query.path !== undefined ? req.query.path : url.searchParams.get('path');
      rest = Array.isArray(q) ? q.join('/') : q || '';
    }
  } catch {
    rest = '';
  }
  return rest
    .split('/')
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
}

function methodNotAllowed(allow) {
  const err = new HttpError(405, 'Method not allowed.', 'method_not_allowed');
  err.allow = allow;
  return err;
}

function requireLabId(id) {
  if (!isLabId(id)) throw new HttpError(404, 'Lab not found.', 'not_found');
  return id;
}

export function createLabsHandler({ getStore, getAuthConfig = () => readAuthConfig(), devUser = null, now = () => new Date() }) {
  async function loadLab(store, userId, id) {
    const lab = await store.getLab(userId, requireLabId(id));
    if (!lab) throw new HttpError(404, 'Lab not found.', 'not_found');
    return lab;
  }

  // ---------- /api/labs/session ----------
  async function handleSession(req, res, store, config) {
    const user = devUser || getUserFromRequest(config, req);
    if (req.method === 'GET') {
      return sendJson(res, 200, {
        authenticated: Boolean(user),
        user: user ? { id: user.id } : null,
        mode: devUser ? 'dev' : 'password',
        storage: store ? store.kind : null,
        configured: { storage: Boolean(store), auth: Boolean(devUser) || config.configured },
        problems: [
          ...(store ? [] : ['UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set.']),
          ...(devUser ? [] : config.problems),
        ],
      });
    }
    if (req.method === 'POST') {
      assertSameOriginWrite(req);
      if (devUser) return sendJson(res, 200, { authenticated: true, user: { id: devUser.id } });
      if (!store) throw new HttpError(503, 'Labs storage is not configured.', 'storage_not_configured');
      if (!config.configured) throw new HttpError(503, 'Labs sign-in is not configured.', 'auth_not_configured', { problems: config.problems });
      const key = `login:${clientIp(req)}`;
      if ((await store.getRateLimit(key)) >= LOGIN_MAX_FAILURES) {
        throw new HttpError(429, 'Too many failed attempts. Wait 15 minutes and try again.', 'rate_limited');
      }
      const { password } = readJsonBody(req);
      if (!checkPassword(config, password)) {
        const count = await store.hitRateLimit(key, LOGIN_WINDOW_SECONDS);
        const left = Math.max(0, LOGIN_MAX_FAILURES - count);
        throw new HttpError(401, left ? `Wrong password. ${left} attempt(s) left.` : 'Wrong password. Wait 15 minutes and try again.', 'wrong_password');
      }
      await store.clearRateLimit(key);
      return sendJson(res, 200, { authenticated: true, user: { id: OWNER_ID } }, { 'Set-Cookie': sessionCookie(req, createSessionToken(config, OWNER_ID)) });
    }
    if (req.method === 'DELETE') {
      assertSameOriginWrite(req);
      return sendJson(res, 200, { authenticated: false }, { 'Set-Cookie': clearSessionCookie(req) });
    }
    throw methodNotAllowed('GET, POST, DELETE');
  }

  // ---------- /api/labs ----------
  async function listOrCreate(req, res, store, userId) {
    if (req.method === 'GET') {
      const entries = await store.listLabs(userId);
      const labs = entries
        .map((e) => toPublicLab(e.meta, e.stats, e.openedAt))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      return sendJson(res, 200, { labs });
    }
    if (req.method !== 'POST') throw methodNotAllowed('GET, POST');

    const body = readJsonBody(req);
    const at = now().toISOString();
    const id = createId(12);
    let meta;
    let content;

    if (body.duplicateOf !== undefined) {
      const source = await loadLab(store, userId, body.duplicateOf);
      const sourceContent = await store.getContent(userId, source.meta.id);
      if (!sourceContent) throw new HttpError(404, 'Lab not found.', 'not_found');
      const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : `${source.meta.title} (copy)`;
      meta = {
        ...source.meta,
        ...normalizeMetaInput({ ...source.meta, title: title.slice(0, LIMITS.titleMax), archived: false }),
        id,
        createdAt: at,
        metaUpdatedAt: at,
      };
      content = normalizeContent(sourceContent.content);
    } else {
      meta = newMeta({ id, input: body, now: at });
      content = normalizeContent(body.content || { cells: [] });
    }

    const contentJson = serializeContent(content);
    const starterJson = serializeContent(stripOutputs(content));
    const stats = { updatedAt: at, ...contentStats(content), lastCellId: null, bytes: contentJson.length };
    await store.createLab(userId, { meta, stats, contentJson, starterJson });
    return sendJson(res, 201, { lab: toPublicLab(meta, { ...stats, revision: 1 }, null), content, revision: 1 });
  }

  // ---------- /api/labs/:id ----------
  async function oneLab(req, res, store, userId, id) {
    if (req.method === 'GET') {
      const lab = await loadLab(store, userId, id);
      const saved = await store.getContent(userId, id);
      if (!saved) throw new HttpError(404, 'Lab not found.', 'not_found');
      return sendJson(res, 200, { lab: toPublicLab(lab.meta, lab.stats, lab.openedAt), content: saved.content, revision: saved.revision });
    }
    if (req.method === 'PATCH') {
      const body = readJsonBody(req);
      const patch = normalizeMetaInput(body, { partial: true });
      const opened = body.opened === true;
      if (!Object.keys(patch).length && !opened) throw new HttpError(400, 'Nothing to update.', 'empty_patch');
      const lab = await loadLab(store, userId, id);
      const at = now().toISOString();
      let meta = lab.meta;
      if (Object.keys(patch).length) {
        meta = applyMetaPatch(lab.meta, patch, at);
        await store.putMeta(userId, id, meta);
      }
      if (opened) await store.touchOpened(userId, id, at);
      return sendJson(res, 200, { lab: toPublicLab(meta, lab.stats, opened ? at : lab.openedAt) });
    }
    if (req.method === 'DELETE') {
      requireLabId(id);
      const removed = await store.deleteLab(userId, id);
      if (!removed) throw new HttpError(404, 'Lab not found.', 'not_found');
      return sendEmpty(res, 204);
    }
    throw methodNotAllowed('GET, PATCH, DELETE');
  }

  // ---------- /api/labs/:id/content ----------
  async function saveContent(req, res, store, userId, id) {
    if (req.method !== 'PUT') throw methodNotAllowed('PUT');
    requireLabId(id);
    const body = readJsonBody(req);
    const force = body.force === true;
    if (!force && (!Number.isInteger(body.baseRevision) || body.baseRevision < 0)) {
      throw new HttpError(400, 'baseRevision must be a whole number.', 'bad_revision');
    }
    const content = normalizeContent(body.content);
    const contentJson = serializeContent(content);
    const at = now().toISOString();
    const lastCellId = isCellId(body.lastCellId) && content.cells.some((c) => c.id === body.lastCellId) ? body.lastCellId : null;
    const stats = { updatedAt: at, ...contentStats(content), lastCellId, bytes: contentJson.length };
    const result = await store.saveContent(userId, id, { baseRevision: body.baseRevision, contentJson, stats, force });
    if (result.status === 'missing') throw new HttpError(404, 'Lab not found.', 'not_found');
    if (result.status === 'conflict') {
      throw new HttpError(409, 'This lab was changed in another tab or on another device.', 'conflict', { revision: result.revision });
    }
    return sendJson(res, 200, { revision: result.revision, updatedAt: at });
  }

  async function starter(req, res, store, userId, id) {
    if (req.method !== 'GET') throw methodNotAllowed('GET');
    await loadLab(store, userId, id);
    const content = await store.getStarter(userId, id);
    if (!content) throw new HttpError(404, 'Starter content not found.', 'not_found');
    return sendJson(res, 200, { content });
  }

  // ---------- /api/labs/:id/versions[/:versionId] ----------
  async function versions(req, res, store, userId, id, versionId) {
    await loadLab(store, userId, id);
    if (versionId === undefined) {
      if (req.method === 'GET') return sendJson(res, 200, { versions: await store.listVersions(userId, id) });
      if (req.method !== 'POST') throw methodNotAllowed('GET, POST');
      const body = readJsonBody(req);
      const saved = await store.getContent(userId, id);
      if (!saved) throw new HttpError(404, 'Lab not found.', 'not_found');
      const content = stripOutputs(saved.content);
      const summary = {
        id: createId(10),
        label: normalizeVersionLabel(body.label),
        reason: VERSION_REASONS.includes(body.reason) ? body.reason : 'manual',
        createdAt: now().toISOString(),
        revision: saved.revision,
        cellCount: content.cells.length,
      };
      await store.addVersion(userId, id, summary, serializeContent(content), LIMITS.versionsMax);
      return sendJson(res, 201, { version: summary });
    }
    if (!isLabId(versionId)) throw new HttpError(404, 'Version not found.', 'not_found');
    if (req.method === 'GET') {
      const v = await store.getVersion(userId, id, versionId);
      if (!v) throw new HttpError(404, 'Version not found.', 'not_found');
      return sendJson(res, 200, { version: v.summary, content: v.content });
    }
    if (req.method === 'DELETE') {
      if (!(await store.deleteVersion(userId, id, versionId))) throw new HttpError(404, 'Version not found.', 'not_found');
      return sendEmpty(res, 204);
    }
    throw methodNotAllowed('GET, DELETE');
  }

  return async function handleLabsRequest(req, res, segments = segmentsFromRequest(req)) {
    try {
      const store = getStore();
      const config = getAuthConfig();

      if (segments[0] === 'session' && segments.length === 1) return await handleSession(req, res, store, config);

      if (!store) {
        throw new HttpError(503, 'Labs storage is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.', 'storage_not_configured');
      }
      if (!devUser && !config.configured) {
        throw new HttpError(503, 'Labs sign-in is not configured.', 'auth_not_configured', { problems: config.problems });
      }
      const user = devUser || getUserFromRequest(config, req);
      if (!user) throw new HttpError(401, 'Sign in to use Labs.', 'unauthorized');
      if (req.method !== 'GET' && req.method !== 'HEAD') assertSameOriginWrite(req);

      const [id, sub, subId, ...extra] = segments;
      if (extra.length) throw new HttpError(404, 'Not found.', 'not_found');
      if (id === undefined) return await listOrCreate(req, res, store, user.id);
      if (sub === undefined) return await oneLab(req, res, store, user.id, id);
      if (sub === 'content' && subId === undefined) return await saveContent(req, res, store, user.id, id);
      if (sub === 'starter' && subId === undefined) return await starter(req, res, store, user.id, id);
      if (sub === 'versions') return await versions(req, res, store, user.id, id, subId);
      throw new HttpError(404, 'Not found.', 'not_found');
    } catch (err) {
      if (err instanceof LabValidationError) {
        return sendError(res, new HttpError(err.status || 400, err.message, err.status === 413 ? 'too_large' : 'invalid', err.field ? { field: err.field } : undefined));
      }
      if (err instanceof HttpError) return sendError(res, err);
      console.error('[labs] unexpected error:', err);
      return sendError(res, new HttpError(500, 'Something went wrong on the server. Your work is still in this browser; try again.', 'server_error'));
    }
  };
}
