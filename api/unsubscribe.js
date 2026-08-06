// api/unsubscribe.js
// GET /api/unsubscribe?token=... — the link included in the footer of
// every new-post notification email. Removes the subscriber entirely
// rather than just flagging them inactive, since there's no admin UI
// here to distinguish "unsubscribed" from "never subscribed" anyway.
import { getRedis } from './_lib/kv.js';
import { SITE_URL } from '../src/lib/site.js';

export default async function handler(req, res) {
  const token = req.query?.token;
  const redis = getRedis();

  if (!token || !redis) {
    res.writeHead(302, { Location: `${SITE_URL}/subscribe/invalid` });
    return res.end();
  }

  try {
    const email = await redis.get(`token:${token}`);
    if (email) {
      await redis.del(`subscriber:${email}`);
      await redis.del(`token:${token}`);
      await redis.srem('subscribers:confirmed', email);
    }
    res.writeHead(302, { Location: `${SITE_URL}/subscribe/unsubscribed` });
    return res.end();
  } catch (err) {
    console.error('[unsubscribe] error:', err);
    res.writeHead(302, { Location: `${SITE_URL}/subscribe/invalid` });
    return res.end();
  }
}
