// api/subscribe.js
// POST { email } -> stores a pending subscriber in Upstash Redis and
// emails a confirmation link via Resend. Nothing is added to the
// "confirmed" set (and therefore nothing gets notify emails) until the
// recipient clicks that link and hits /api/confirm — this is a
// deliberate double opt-in, both for deliverability and because
// silently adding unverified addresses to a mailing list is a good way
// to get flagged as spam.
import crypto from 'crypto';
import { getRedis, parseRecord } from './_lib/kv.js';
import { getResend, FROM_ADDRESS } from './_lib/resend.js';
import { SITE_URL, SITE_NAME } from '../src/lib/site.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { email, company } = body;

  // Honeypot: a hidden field real visitors never fill in. Bots that
  // blindly fill every input trip this — reply success but do nothing.
  if (company) {
    return res.status(200).json({ ok: true, message: 'Check your inbox to confirm.' });
  }

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  const normalized = email.trim().toLowerCase();

  const redis = getRedis();
  const resend = getResend();
  if (!redis || !resend) {
    console.error('[subscribe] Missing UPSTASH_REDIS_REST_URL/TOKEN or RESEND_API_KEY env vars.');
    return res.status(503).json({ error: 'Subscriptions are not set up yet — try again later.' });
  }

  try {
    const existing = parseRecord(await redis.get(`subscriber:${normalized}`));

    if (existing?.status === 'confirmed') {
      return res.status(200).json({ ok: true, message: "You're already subscribed." });
    }

    // New signup, or a still-pending one retrying — reuse the token if
    // one already exists so a repeat click doesn't orphan the old one.
    const token = existing?.token || crypto.randomBytes(24).toString('hex');
    const record = {
      status: 'pending',
      token,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await redis.set(`subscriber:${normalized}`, JSON.stringify(record));
    await redis.set(`token:${token}`, normalized);

    const confirmUrl = `${SITE_URL}/api/confirm?token=${token}`;
    await resend.emails.send({
      from: `${SITE_NAME} <${FROM_ADDRESS}>`,
      to: normalized,
      subject: `Confirm your subscription to ${SITE_NAME}'s blog`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="margin-bottom: 0.5rem;">One more step</h2>
          <p>Click below to confirm you'd like an email whenever a new post goes up on ${SITE_NAME}'s blog.</p>
          <p style="margin: 1.5rem 0;">
            <a href="${confirmUrl}" style="display:inline-block;padding:12px 22px;background:#111;color:#fff;text-decoration:none;border-radius:4px;font-weight:600;">
              Confirm subscription
            </a>
          </p>
          <p style="font-size: 0.85rem; opacity: 0.6;">If you didn't request this, you can safely ignore this email — you won't be subscribed unless you click the link above.</p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true, message: 'Check your inbox to confirm.' });
  } catch (err) {
    console.error('[subscribe] error:', err);
    return res.status(500).json({ error: 'Something went wrong — try again in a moment.' });
  }
}
