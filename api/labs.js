// api/labs.js
// The Labs API: one Vercel Function for every /api/labs route.
// vercel.json rewrites /api/labs/<anything> to this file, so the
// project keeps a small function count. The routes, validation,
// sign-in and storage live in api/_lib/labs/ (see
// LABS_ARCHITECTURE.md). Lab code never runs here: Python runs in
// the learner's browser.
import { createLabsHandler, segmentsFromRequest } from './_lib/labs/router.js';
import { createRedisStoreFromEnv } from './_lib/labs/store-redis.js';

let store;

const handle = createLabsHandler({
  // Created on first use and reused while the function instance is warm.
  getStore: () => {
    if (store === undefined) store = createRedisStoreFromEnv();
    return store;
  },
});

export default function handler(req, res) {
  return handle(req, res, segmentsFromRequest(req));
}
