// src/labs/api.js
// Browser client for /api/labs. Every request sends the
// X-Labs-Request header (the API refuses writes without it) and the
// session cookie. Errors become ApiError with the server's code.

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'error', data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }

  // Worth an automatic retry: no network, or a server/storage hiccup.
  get retryable() {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

async function request(method, path, body, { keepalive = false, signal } = {}) {
  let res;
  try {
    res = await fetch(`/api/labs${path}`, {
      method,
      headers: { 'X-Labs-Request': '1', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
      keepalive,
      signal,
    });
  } catch (err) {
    if (err && err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Check your connection.', { status: 0, code: 'network' });
  }
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message = (data && data.error) || `The server answered ${res.status}.`;
    throw new ApiError(message, { status: res.status, code: (data && data.code) || 'error', data });
  }
  return data;
}

const enc = encodeURIComponent;

export const labsApi = {
  session: () => request('GET', '/session'),
  signIn: (password) => request('POST', '/session', { password }),
  signOut: () => request('DELETE', '/session'),

  list: () => request('GET', ''),
  create: (input) => request('POST', '', input),
  duplicate: (id, title) => request('POST', '', { duplicateOf: id, ...(title ? { title } : {}) }),
  get: (id) => request('GET', `/${enc(id)}`),
  update: (id, patch) => request('PATCH', `/${enc(id)}`, patch),
  remove: (id) => request('DELETE', `/${enc(id)}`),
  saveContent: (id, payload, options) => request('PUT', `/${enc(id)}/content`, payload, options),
  starter: (id) => request('GET', `/${enc(id)}/starter`),

  versions: (id) => request('GET', `/${enc(id)}/versions`),
  createVersion: (id, { label, reason } = {}) => request('POST', `/${enc(id)}/versions`, { label, reason }),
  version: (id, versionId) => request('GET', `/${enc(id)}/versions/${enc(versionId)}`),
  deleteVersion: (id, versionId) => request('DELETE', `/${enc(id)}/versions/${enc(versionId)}`),
};
