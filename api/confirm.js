// api/confirm.js
// GET /api/confirm?token=... — the link from the confirmation email.
// Marks the matching subscriber as confirmed and adds them to the
// `subscribers:confirmed` Redis set (what scripts/notify-subscribers.mjs
// reads from when a new post goes live), then redirects to a friendly
// landing page. The same token doubles as the unsubscribe token later.
import { getRedis, parseRecord } from './_lib/kv.js';
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
    if (!email) {
      res.writeHead(302, { Location: `${SITE_URL}/subscribe/invalid` });
      return res.end();
    }

    const record = parseRecord(await redis.get(`subscriber:${email}`)) || { token };
    record.status = 'confirmed';
    record.confirmedAt = new Date().toISOString();

    await redis.set(`subscriber:${email}`, JSON.stringify(record));
    await redis.sadd('subscribers:confirmed', email);

    res.writeHead(302, { Location: `${SITE_URL}/subscribe/confirmed` });
    return res.end();
  } catch (err) {
    console.error('[confirm] error:', err);
    res.writeHead(302, { Location: `${SITE_URL}/subscribe/invalid` });
    return res.end();
  }
}
