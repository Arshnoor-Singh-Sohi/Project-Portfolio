// api/_lib/labs/auth.js
// ============================================================
// Owner sign-in for Labs.
//
// One owner, one password (LABS_PASSWORD). A correct password gives
// a signed session cookie:
//
//   labs_session = base64url(JSON payload) "." base64url(HMAC-SHA256)
//   payload      = { v: 1, u: userId, iat, exp, pw }
//
// `pw` is a short fingerprint of the password, so changing
// LABS_PASSWORD signs out every old session. Changing
// LABS_SESSION_SECRET does the same.
//
// The rest of the API only needs `getUser(req)`. To add real
// multi-user sign-in later (for example GitHub OAuth), replace this
// file and keep that function: storage keys already contain the id.
// ============================================================

import crypto from 'node:crypto';
import { HttpError, header, parseCookies, serializeCookie, isHttps } from './http.js';

export const COOKIE_NAME = 'labs_session';
export const COOKIE_PATH = '/api/labs';
export const SESSION_SECONDS = 30 * 24 * 60 * 60;
export const OWNER_ID = 'owner';
export const MIN_SECRET_LENGTH = 32;
export const MIN_PASSWORD_LENGTH = 12;
export const LOGIN_WINDOW_SECONDS = 15 * 60;
export const LOGIN_MAX_FAILURES = 10;

// Reads the sign-in settings from the environment. `problems` lists
// what is missing, for the "not configured" message.
export function readAuthConfig(env = process.env) {
  const password = env.LABS_PASSWORD || '';
  const secret = env.LABS_SESSION_SECRET || '';
  const problems = [];
  if (!password) problems.push('LABS_PASSWORD is not set.');
  else if (password.length < MIN_PASSWORD_LENGTH) problems.push(`LABS_PASSWORD must have at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (!secret) problems.push('LABS_SESSION_SECRET is not set.');
  else if (secret.length < MIN_SECRET_LENGTH) problems.push(`LABS_SESSION_SECRET must have at least ${MIN_SECRET_LENGTH} characters.`);
  return { configured: problems.length === 0, password, secret, problems };
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function hmac(secret, text) {
  return crypto.createHmac('sha256', secret).update(text).digest();
}

function passwordFingerprint(config) {
  return b64url(hmac(config.secret, `pw:${config.password}`)).slice(0, 12);
}

export function checkPassword(config, attempt) {
  if (typeof attempt !== 'string' || !attempt) return false;
  // Compare fixed-length digests, so the time does not depend on
  // where the strings differ or on their lengths.
  const a = hmac(config.secret, `cmp:${attempt}`);
  const b = hmac(config.secret, `cmp:${config.password}`);
  return crypto.timingSafeEqual(a, b);
}

export function createSessionToken(config, userId, now = Date.now()) {
  const payload = {
    v: 1,
    u: userId,
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + SESSION_SECONDS,
    pw: passwordFingerprint(config),
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${b64url(hmac(config.secret, body))}`;
}

export function verifySessionToken(config, token, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 1024) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let given;
  try {
    given = Buffer.from(sig, 'base64url');
  } catch {
    return null;
  }
  const expected = hmac(config.secret, body);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload || payload.v !== 1 || typeof payload.u !== 'string') return null;
  if (!Number.isFinite(payload.exp) || payload.exp * 1000 <= now) return null;
  if (payload.pw !== passwordFingerprint(config)) return null;
  return { id: payload.u, expiresAt: new Date(payload.exp * 1000).toISOString() };
}

export function sessionCookie(req, token) {
  return serializeCookie(COOKIE_NAME, token, { maxAge: SESSION_SECONDS, path: COOKIE_PATH, secure: isHttps(req) });
}

export function clearSessionCookie(req) {
  return serializeCookie(COOKIE_NAME, '', { maxAge: 0, path: COOKIE_PATH, secure: isHttps(req) });
}

export function getUserFromRequest(config, req) {
  if (!config.configured) return null;
  const cookies = parseCookies(header(req, 'cookie'));
  return verifySessionToken(config, cookies[COOKIE_NAME]);
}

// Writes need the X-Labs-Request header. A page on another site
// cannot send a custom header without a CORS preflight, and this API
// answers no preflight, so the browser blocks such requests. When the
// browser sends Origin, it must be this site.
export function assertSameOriginWrite(req) {
  if (header(req, 'x-labs-request') !== '1') {
    throw new HttpError(403, 'Missing X-Labs-Request header.', 'csrf');
  }
  const origin = header(req, 'origin');
  if (!origin) return;
  const host = header(req, 'x-forwarded-host') || header(req, 'host');
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, 'Bad Origin header.', 'csrf');
  }
  if (!host || originHost !== host.split(',')[0].trim()) {
    throw new HttpError(403, 'Cross-site requests are not allowed.', 'csrf');
  }
}
