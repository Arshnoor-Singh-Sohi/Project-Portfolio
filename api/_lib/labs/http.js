// api/_lib/labs/http.js
// Small helpers for plain Node (req, res) handlers. They work on
// Vercel Functions and in the Vite dev server (see
// plugins/vite-plugin-labs-api.js), because they use only the
// standard http.ServerResponse API.

export class HttpError extends Error {
  constructor(status, message, code, extra) {
    super(message);
    this.status = status;
    this.code = code || 'error';
    this.extra = extra;
  }
}

export function sendJson(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(body === undefined ? '' : JSON.stringify(body));
}

export function sendEmpty(res, status = 204, headers = {}) {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end();
}

export function sendError(res, err) {
  const status = err.status || 500;
  const body = { error: err.message || 'Something went wrong.', code: err.code || 'error', ...(err.extra || {}) };
  sendJson(res, status, body, status === 405 && err.allow ? { Allow: err.allow } : {});
}

// Vercel parses JSON bodies into req.body. The dev plugin does the
// same. A string body (other content types) is parsed here.
export function readJsonBody(req) {
  const body = req.body;
  if (body === undefined || body === null || body === '') return {};
  if (typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  try {
    return JSON.parse(Buffer.isBuffer(body) ? body.toString('utf8') : body);
  } catch {
    throw new HttpError(400, 'The request body is not valid JSON.', 'bad_json');
  }
}

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (key && !(key in out)) {
      try {
        out[key] = decodeURIComponent(value);
      } catch {
        out[key] = value;
      }
    }
  }
  return out;
}

export function serializeCookie(name, value, { maxAge, path = '/', httpOnly = true, sameSite = 'Strict', secure = false } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, `SameSite=${sameSite}`];
  if (maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(maxAge))}`);
  if (maxAge === 0) parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  if (httpOnly) parts.push('HttpOnly');
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function header(req, name) {
  const v = req.headers ? req.headers[name.toLowerCase()] : undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function clientIp(req) {
  const fwd = header(req, 'x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return header(req, 'x-real-ip') || (req.socket && req.socket.remoteAddress) || 'unknown';
}

export function isHttps(req) {
  const proto = header(req, 'x-forwarded-proto');
  if (proto) return proto.split(',')[0].trim() === 'https';
  return Boolean(req.socket && req.socket.encrypted);
}
