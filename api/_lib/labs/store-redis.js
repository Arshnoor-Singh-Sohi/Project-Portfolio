// api/_lib/labs/store-redis.js
// ============================================================
// Labs storage on Upstash Redis (the database the site already uses
// for blog subscriptions). All keys start with labs:v1:<userId>:
//
//   index              hash   <labId>        -> metadata JSON (owner edits)
//                             <labId>:stats  -> save statistics JSON (content saves)
//                             <labId>:opened -> ISO time of the last open
//   content:<labId>    string content JSON (cells and outputs)
//   starter:<labId>    string starter content JSON (no outputs)
//   rev:<labId>        string revision number
//   versions:<labId>   hash   <versionId> -> version summary JSON
//   version:<labId>:<versionId>  string  version content JSON
//
// Each index field has one kind of writer, so a rename and a content
// save at the same moment cannot overwrite each other. A content save
// is one Lua script, so the revision check and the writes are atomic.
// ============================================================

import { Redis } from '@upstash/redis';

const USER_RE = /^[A-Za-z0-9_-]{1,64}$/;

function keysFor(userId) {
  if (!USER_RE.test(userId)) throw new Error('Invalid user id.');
  const p = `labs:v1:${userId}:`;
  return {
    index: `${p}index`,
    content: (id) => `${p}content:${id}`,
    starter: (id) => `${p}starter:${id}`,
    rev: (id) => `${p}rev:${id}`,
    versions: (id) => `${p}versions:${id}`,
    version: (id, vid) => `${p}version:${id}:${vid}`,
  };
}

// KEYS: rev, content, index. ARGV: baseRevision, contentJson,
// statsField, statsJsonWithoutClosingBrace, force ("1" or "0").
// Returns {1, newRevision}, {-2, currentRevision} or {-1, 0}.
const SAVE_SCRIPT = `
local cur = redis.call('GET', KEYS[1])
if not cur then return {-1, 0} end
cur = tonumber(cur)
if ARGV[5] ~= '1' and cur ~= tonumber(ARGV[1]) then return {-2, cur} end
local nextRev = cur + 1
redis.call('SET', KEYS[2], ARGV[2])
redis.call('SET', KEYS[1], tostring(nextRev))
redis.call('HSET', KEYS[3], ARGV[3], ARGV[4] .. ',"revision":' .. nextRev .. '}')
return {1, nextRev}
`;

function parse(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// HGETALL comes back as a flat [field, value, ...] list when
// automaticDeserialization is off, and as an object otherwise.
function hashEntries(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    const out = [];
    for (let i = 0; i + 1 < raw.length; i += 2) out.push([raw[i], raw[i + 1]]);
    return out;
  }
  return Object.entries(raw);
}

// JSON of `stats` without its closing brace, for the Lua script.
function statsPrefix(stats) {
  const json = JSON.stringify({ ...stats, revision: undefined });
  return json === '{}' ? '{"_":0' : json.slice(0, -1);
}

export function createRedisStoreFromEnv(env = process.env) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  // automaticDeserialization: false — values come back as the exact
  // strings that were stored; this module parses them itself.
  return createRedisStore(new Redis({ url, token, automaticDeserialization: false }));
}

export function createRedisStore(redis) {
  return {
    kind: 'redis',

    async listLabs(userId) {
      const k = keysFor(userId);
      const labs = new Map();
      for (const [field, raw] of hashEntries(await redis.hgetall(k.index))) {
        const [id, part] = field.split(':');
        if (!labs.has(id)) labs.set(id, { meta: null, stats: null, openedAt: null });
        const entry = labs.get(id);
        if (!part) entry.meta = parse(raw);
        else if (part === 'stats') entry.stats = parse(raw);
        else if (part === 'opened') entry.openedAt = typeof raw === 'string' ? raw : null;
      }
      return [...labs.values()].filter((e) => e.meta);
    },

    async getLab(userId, id) {
      const k = keysFor(userId);
      const [meta, stats, opened] = await redis.hmget(k.index, id, `${id}:stats`, `${id}:opened`).then((r) => {
        if (Array.isArray(r)) return r;
        if (r && typeof r === 'object') return [r[id], r[`${id}:stats`], r[`${id}:opened`]];
        return [null, null, null];
      });
      if (!meta) return null;
      return { meta: parse(meta), stats: parse(stats), openedAt: typeof opened === 'string' ? opened : null };
    },

    async getContent(userId, id) {
      const k = keysFor(userId);
      const [content, rev] = await redis.mget(k.content(id), k.rev(id));
      if (content === null || content === undefined) return null;
      return { content: parse(content), revision: Number(rev) || 0 };
    },

    async getStarter(userId, id) {
      const k = keysFor(userId);
      return parse(await redis.get(k.starter(id)));
    },

    async createLab(userId, { meta, stats, contentJson, starterJson }) {
      const k = keysFor(userId);
      const tx = redis.multi();
      tx.set(k.content(meta.id), contentJson);
      tx.set(k.starter(meta.id), starterJson);
      tx.set(k.rev(meta.id), '1');
      tx.hset(k.index, { [meta.id]: JSON.stringify(meta), [`${meta.id}:stats`]: JSON.stringify({ ...stats, revision: 1 }) });
      await tx.exec();
      return 1;
    },

    async putMeta(userId, id, meta) {
      const k = keysFor(userId);
      await redis.hset(k.index, { [id]: JSON.stringify(meta) });
    },

    async touchOpened(userId, id, iso) {
      const k = keysFor(userId);
      await redis.hset(k.index, { [`${id}:opened`]: iso });
    },

    async saveContent(userId, id, { baseRevision, contentJson, stats, force = false }) {
      const k = keysFor(userId);
      const result = await redis.eval(
        SAVE_SCRIPT,
        [k.rev(id), k.content(id), k.index],
        [String(baseRevision), contentJson, `${id}:stats`, statsPrefix(stats), force ? '1' : '0'],
      );
      const [code, revision] = Array.isArray(result) ? result.map(Number) : [-1, 0];
      if (code === 1) return { status: 'ok', revision };
      if (code === -2) return { status: 'conflict', revision };
      return { status: 'missing' };
    },

    async deleteLab(userId, id) {
      const k = keysFor(userId);
      const versionIds = hashEntries(await redis.hgetall(k.versions(id))).map(([field]) => field);
      const tx = redis.multi();
      tx.hdel(k.index, id, `${id}:stats`, `${id}:opened`);
      tx.del(k.content(id), k.starter(id), k.rev(id), k.versions(id), ...versionIds.map((v) => k.version(id, v)));
      const [removed] = await tx.exec();
      return Number(removed) > 0;
    },

    async listVersions(userId, id) {
      const k = keysFor(userId);
      return hashEntries(await redis.hgetall(k.versions(id)))
        .map(([, raw]) => parse(raw))
        .filter(Boolean)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },

    async getVersion(userId, id, versionId) {
      const k = keysFor(userId);
      const [summary, content] = await Promise.all([redis.hget(k.versions(id), versionId), redis.get(k.version(id, versionId))]);
      if (!summary || !content) return null;
      return { summary: parse(summary), content: parse(content) };
    },

    async addVersion(userId, id, summary, contentJson, max) {
      const k = keysFor(userId);
      const tx = redis.multi();
      tx.set(k.version(id, summary.id), contentJson);
      tx.hset(k.versions(id), { [summary.id]: JSON.stringify(summary) });
      await tx.exec();
      // Keep the newest `max` versions.
      const list = await this.listVersions(userId, id);
      const extra = list.slice(max);
      if (extra.length) {
        const prune = redis.multi();
        prune.hdel(k.versions(id), ...extra.map((v) => v.id));
        prune.del(...extra.map((v) => k.version(id, v.id)));
        await prune.exec();
      }
      return extra.map((v) => v.id);
    },

    async deleteVersion(userId, id, versionId) {
      const k = keysFor(userId);
      const tx = redis.multi();
      tx.hdel(k.versions(id), versionId);
      tx.del(k.version(id, versionId));
      const [removed] = await tx.exec();
      return Number(removed) > 0;
    },

    // Fixed-window counter for failed sign-ins.
    async hitRateLimit(key, windowSeconds) {
      const full = `labs:v1:ratelimit:${key}`;
      const count = Number(await redis.incr(full));
      if (count === 1) await redis.expire(full, windowSeconds);
      return count;
    },

    async getRateLimit(key) {
      return Number(await redis.get(`labs:v1:ratelimit:${key}`)) || 0;
    },

    async clearRateLimit(key) {
      await redis.del(`labs:v1:ratelimit:${key}`);
    },
  };
}
