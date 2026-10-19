// Store contract: memory store always; Redis store when redis-server
// is installed (it runs through tests/labs/support/upstash-shim.mjs).
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { createMemoryStore } from '../../api/_lib/labs/store-memory.js';
import { createRedisStoreFromEnv } from '../../api/_lib/labs/store-redis.js';
import { storeContract } from './support/store-contract.mjs';
import { startUpstashShim } from './support/upstash-shim.mjs';

test('memory store', (t) => storeContract(t, () => createMemoryStore())());

let hasRedis = true;
try {
  execFileSync('redis-server', ['--version'], { stdio: 'ignore' });
} catch {
  hasRedis = false;
}

test('redis store (Upstash REST client against real Redis)', { skip: hasRedis ? false : 'redis-server is not installed' }, async (t) => {
  const shim = await startUpstashShim();
  try {
    await storeContract(t, () => createRedisStoreFromEnv({ UPSTASH_REDIS_REST_URL: shim.url, UPSTASH_REDIS_REST_TOKEN: shim.token }))();
  } finally {
    await shim.stop();
  }
});
