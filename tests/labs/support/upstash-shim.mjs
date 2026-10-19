// tests/labs/support/upstash-shim.mjs
// Test helper: a local stand-in for the Upstash REST API, backed by
// a real redis-server. It lets tests/labs/store-redis.test.mjs run
// api/_lib/labs/store-redis.js (with the real @upstash/redis client
// and the real Lua script) against real Redis semantics.
// Supports: POST / (one command), /pipeline and /multi-exec, and the
// "Upstash-Encoding: base64" response encoding.
import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

// ---------- minimal RESP2 client ----------
function encodeCommand(args) {
  let out = `*${args.length}\r\n`;
  for (const a of args) {
    const s = Buffer.from(String(a), 'utf8');
    out += `$${s.length}\r\n${s.toString('utf8')}\r\n`;
  }
  return out;
}

class RespClient {
  constructor(port) {
    this.port = port;
    this.buffer = Buffer.alloc(0);
    this.pending = [];
  }
  async connect() {
    this.socket = net.createConnection({ port: this.port, host: '127.0.0.1' });
    this.socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.drain();
    });
    await once(this.socket, 'connect');
  }
  // Returns [value, nextOffset] or null when the buffer is incomplete.
  parse(offset) {
    const buf = this.buffer;
    if (offset >= buf.length) return null;
    const lineEnd = buf.indexOf('\r\n', offset);
    if (lineEnd === -1) return null;
    const type = String.fromCharCode(buf[offset]);
    const line = buf.toString('utf8', offset + 1, lineEnd);
    const next = lineEnd + 2;
    if (type === '+') return [line, next];
    if (type === '-') return [{ __error: line }, next];
    if (type === ':') return [Number(line), next];
    if (type === '$') {
      const len = Number(line);
      if (len === -1) return [null, next];
      if (buf.length < next + len + 2) return null;
      return [buf.toString('utf8', next, next + len), next + len + 2];
    }
    if (type === '*') {
      const n = Number(line);
      if (n === -1) return [null, next];
      const items = [];
      let pos = next;
      for (let i = 0; i < n; i++) {
        const r = this.parse(pos);
        if (!r) return null;
        items.push(r[0]);
        pos = r[1];
      }
      return [items, pos];
    }
    throw new Error(`Unknown RESP type ${type}`);
  }
  drain() {
    while (this.pending.length) {
      const r = this.parse(0);
      if (!r) return;
      this.buffer = this.buffer.subarray(r[1]);
      this.pending.shift()(r[0]);
    }
  }
  send(args) {
    return new Promise((resolve) => {
      this.pending.push(resolve);
      this.socket.write(encodeCommand(args));
    });
  }
  close() {
    this.socket.destroy();
  }
}

function encodeResult(value, base64) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (Array.isArray(value)) return value.map((v) => encodeResult(v, base64));
  if (typeof value === 'string') return base64 && value !== 'OK' ? Buffer.from(value, 'utf8').toString('base64') : value;
  return value;
}

function toEntry(reply, base64) {
  if (reply && typeof reply === 'object' && !Array.isArray(reply) && reply.__error) return { error: reply.__error };
  return { result: encodeResult(reply, base64) };
}

export async function startUpstashShim() {
  const redisPort = 20000 + Math.floor(Math.random() * 20000);
  const redis = spawn('redis-server', ['--port', String(redisPort), '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
  let client;
  for (let i = 0; i < 50; i++) {
    try {
      client = new RespClient(redisPort);
      await client.connect();
      break;
    } catch {
      client = null;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  if (!client) {
    redis.kill();
    throw new Error('redis-server did not start');
  }
  // One connection per transaction would be needed for concurrency;
  // tests run requests one at a time, so a queue is enough.
  let queue = Promise.resolve();
  const serial = (fn) => {
    const p = queue.then(fn);
    queue = p.catch(() => {});
    return p;
  };

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () =>
      serial(async () => {
        const base64 = (req.headers['upstash-encoding'] || '').toLowerCase() === 'base64';
        const payload = JSON.parse(body || '[]');
        const send = (status, obj) => {
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(obj));
        };
        if (req.url === '/pipeline') {
          const out = [];
          for (const cmd of payload) out.push(toEntry(await client.send(cmd), base64));
          return send(200, out);
        }
        if (req.url === '/multi-exec') {
          await client.send(['MULTI']);
          for (const cmd of payload) await client.send(cmd);
          const replies = await client.send(['EXEC']);
          return send(200, (replies || []).map((r) => toEntry(r, base64)));
        }
        const entry = toEntry(await client.send(payload), base64);
        return entry.error ? send(400, entry) : send(200, entry);
      }),
    );
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    url,
    token: 'test-token',
    flush: () => client.send(['FLUSHALL']),
    async stop() {
      server.close();
      client.close();
      redis.kill();
    },
  };
}
