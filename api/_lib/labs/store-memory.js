// api/_lib/labs/store-memory.js
// In-memory Labs storage with the same behaviour as store-redis.js.
// Used by the tests and by `npm run dev` when no Upstash variables
// are set. Data is lost when the process stops — never used in
// production (api/labs.js only creates the Redis store).

export function createMemoryStore() {
  const users = new Map();
  const limits = new Map();

  function user(userId) {
    if (!users.has(userId)) users.set(userId, { labs: new Map() });
    return users.get(userId);
  }

  const copy = (v) => (v === null || v === undefined ? v : JSON.parse(JSON.stringify(v)));

  return {
    kind: 'memory',

    async listLabs(userId) {
      return [...user(userId).labs.values()].map((l) => ({ meta: copy(l.meta), stats: copy(l.stats), openedAt: l.openedAt }));
    },

    async getLab(userId, id) {
      const l = user(userId).labs.get(id);
      return l ? { meta: copy(l.meta), stats: copy(l.stats), openedAt: l.openedAt } : null;
    },

    async getContent(userId, id) {
      const l = user(userId).labs.get(id);
      return l ? { content: JSON.parse(l.contentJson), revision: l.revision } : null;
    },

    async getStarter(userId, id) {
      const l = user(userId).labs.get(id);
      return l ? JSON.parse(l.starterJson) : null;
    },

    async createLab(userId, { meta, stats, contentJson, starterJson }) {
      user(userId).labs.set(meta.id, {
        meta: copy(meta),
        stats: { ...copy(stats), revision: 1 },
        openedAt: null,
        contentJson,
        starterJson,
        revision: 1,
        versions: new Map(),
      });
      return 1;
    },

    async putMeta(userId, id, meta) {
      const l = user(userId).labs.get(id);
      if (l) l.meta = copy(meta);
    },

    async touchOpened(userId, id, iso) {
      const l = user(userId).labs.get(id);
      if (l) l.openedAt = iso;
    },

    async saveContent(userId, id, { baseRevision, contentJson, stats, force = false }) {
      const l = user(userId).labs.get(id);
      if (!l) return { status: 'missing' };
      if (!force && l.revision !== Number(baseRevision)) return { status: 'conflict', revision: l.revision };
      l.revision += 1;
      l.contentJson = contentJson;
      l.stats = { ...copy(stats), revision: l.revision };
      return { status: 'ok', revision: l.revision };
    },

    async deleteLab(userId, id) {
      return user(userId).labs.delete(id);
    },

    async listVersions(userId, id) {
      const l = user(userId).labs.get(id);
      if (!l) return [];
      return [...l.versions.values()].map((v) => copy(v.summary)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },

    async getVersion(userId, id, versionId) {
      const v = user(userId).labs.get(id)?.versions.get(versionId);
      return v ? { summary: copy(v.summary), content: JSON.parse(v.contentJson) } : null;
    },

    async addVersion(userId, id, summary, contentJson, max) {
      const l = user(userId).labs.get(id);
      if (!l) return [];
      l.versions.set(summary.id, { summary: copy(summary), contentJson });
      const list = await this.listVersions(userId, id);
      const extra = list.slice(max);
      for (const v of extra) l.versions.delete(v.id);
      return extra.map((v) => v.id);
    },

    async deleteVersion(userId, id, versionId) {
      const l = user(userId).labs.get(id);
      return l ? l.versions.delete(versionId) : false;
    },

    async hitRateLimit(key, windowSeconds) {
      const now = Date.now();
      const entry = limits.get(key);
      if (!entry || entry.until <= now) {
        limits.set(key, { count: 1, until: now + windowSeconds * 1000 });
        return 1;
      }
      entry.count += 1;
      return entry.count;
    },

    async getRateLimit(key) {
      const entry = limits.get(key);
      return entry && entry.until > Date.now() ? entry.count : 0;
    },

    async clearRateLimit(key) {
      limits.delete(key);
    },
  };
}
