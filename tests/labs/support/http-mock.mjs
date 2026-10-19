// Fake (req, res) pair for calling the Labs handler without a server.
export function makeReq({ method = 'GET', url = '/api/labs', headers = {}, body, query, ip = '10.0.0.1' } = {}) {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { method, url, headers: { host: 'example.test', ...lower }, body, query, socket: { remoteAddress: ip } };
}

export function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    end(chunk) {
      this.body = chunk ? String(chunk) : '';
      this.ended = true;
    },
    get json() {
      return this.body ? JSON.parse(this.body) : null;
    },
  };
  return res;
}

// Calls the handler like a browser on the same site would.
export function client(handler, { cookie = '', ip } = {}) {
  const jar = { cookie };
  async function call(method, path, body, extraHeaders = {}) {
    const headers = { 'x-labs-request': '1', origin: 'https://example.test', ...extraHeaders };
    if (jar.cookie) headers.cookie = jar.cookie;
    const req = makeReq({ method, url: `/api/labs${path}`, headers, body, ip });
    const res = makeRes();
    await handler(req, res);
    const setCookie = res.headers['set-cookie'];
    if (setCookie) {
      const [pair] = setCookie.split(';');
      jar.cookie = pair.endsWith('=') ? '' : pair;
    }
    return res;
  }
  return { call, jar };
}
