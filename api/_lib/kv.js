// api/_lib/kv.js
// Thin wrapper around Upstash Redis (via @upstash/redis). Provision the
// store from Vercel's dashboard: Storage tab -> Marketplace Database
// Integrations -> Upstash -> Redis. Once connected to this project,
// Vercel auto-injects UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// as environment variables — nothing else to configure here.
//
// Returns null (rather than throwing) when the env vars aren't set yet,
// so every endpoint can fail soft with a friendly "not configured" error
// instead of crashing — useful while you're still setting things up.
import { Redis } from '@upstash/redis';

let cached;

export function getRedis() {
  if (cached !== undefined) return cached;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  cached = url && token ? new Redis({ url, token }) : null;
  return cached;
}

// Subscriber records are stored as JSON strings under `subscriber:<email>`.
// @upstash/redis's REST client sometimes auto-parses JSON-looking string
// values, so this helper normalizes either shape back to a plain object.
export function parseRecord(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}
