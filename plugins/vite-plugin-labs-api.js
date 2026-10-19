// plugins/vite-plugin-labs-api.js
// ============================================================
// `npm run dev` only. Vercel runs api/labs.js in production; the Vite
// dev server does not run Vercel Functions, so this plugin serves
// /api/labs/* with the same router (api/_lib/labs/router.js).
//
// Storage and sign-in in dev:
//   - UPSTASH_REDIS_REST_URL + _TOKEN in .env.local -> the real database
//     (set LABS_DEV_STORE=memory to ignore them)
//   - otherwise an in-memory store (lost when the server stops)
//   - LABS_PASSWORD + LABS_SESSION_SECRET in .env.local -> sign in as in
//     production; otherwise you are signed in as user "dev".
// The page shows a banner when it uses the memory store or dev sign-in.
//
// It also sends the worker's Content-Security-Policy header for
// /labs-runtime/*, like vercel.json does in production.
// ============================================================

import { loadEnv } from 'vite';
import { createLabsHandler } from '../api/_lib/labs/router.js';
import { readAuthConfig } from '../api/_lib/labs/auth.js';
import { createMemoryStore } from '../api/_lib/labs/store-memory.js';
import { createRedisStoreFromEnv } from '../api/_lib/labs/store-redis.js';
import { workerCsp } from '../src/lib/labs/worker-csp.js';

const BODY_LIMIT = 4.5 * 1024 * 1024; // the Vercel Functions request limit

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(Object.assign(new Error('Request body is larger than 4.5 MB.'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default function labsApiPlugin() {
  return {
    name: 'portfolio-labs-api',
    apply: 'serve',

    configureServer(server) {
      const env = { ...process.env, ...loadEnv(server.config.mode, server.config.root, '') };
      const redisStore = env.LABS_DEV_STORE === 'memory' ? null : createRedisStoreFromEnv(env);
      const store = redisStore || createMemoryStore();
      const authConfig = readAuthConfig(env);
      const devUser = authConfig.configured ? null : { id: 'dev' };
      const handle = createLabsHandler({ getStore: () => store, getAuthConfig: () => authConfig, devUser });
      // A self-hosted Pyodide (VITE_LABS_PYODIDE_URL) must be allowed by
      // the worker policy too.
      let pyodideOrigin = null;
      try {
        if (env.VITE_LABS_PYODIDE_URL) pyodideOrigin = new URL(env.VITE_LABS_PYODIDE_URL).origin;
      } catch {
        pyodideOrigin = null;
      }
      const csp = workerCsp(pyodideOrigin ? [pyodideOrigin] : []);

      server.config.logger.info(
        `  ➜  Labs API: ${store.kind === 'redis' ? 'Upstash Redis' : 'in-memory store (data is lost on restart)'}, ${
          devUser ? 'automatic dev sign-in' : 'password sign-in'
        }`,
      );

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/labs-runtime/')) {
          res.setHeader('Content-Security-Policy', csp);
          return next();
        }
        if (!/^\/api\/labs(\/|\?|$)/.test(url)) return next();
        try {
          const raw = req.method === 'GET' || req.method === 'HEAD' ? '' : await readBody(req);
          req.body = raw;
          if (raw && /application\/json/.test(req.headers['content-type'] || '')) {
            try {
              req.body = JSON.parse(raw);
            } catch {
              req.body = raw; // the router answers 400 bad_json
            }
          }
        } catch (err) {
          res.statusCode = err.status || 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message, code: err.status === 413 ? 'too_large' : 'bad_request' }));
          return undefined;
        }
        return handle(req, res);
      });
    },
  };
}
