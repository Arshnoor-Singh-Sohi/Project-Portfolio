// api/_lib/resend.js
// Thin wrapper around the Resend email API. Sign up at resend.com,
// verify arshnoorsinghsohi.com as a sending domain (Resend gives you a
// few DNS records to add at your registrar), create an API key, then
// add RESEND_API_KEY as an environment variable in the Vercel project
// (Settings -> Environment Variables). Optionally set NOTIFY_FROM_EMAIL
// too if you want a different "from" address than the default below.
import { Resend } from 'resend';

let cached;

export function getResend() {
  if (cached !== undefined) return cached;
  const key = process.env.RESEND_API_KEY;
  cached = key ? new Resend(key) : null;
  return cached;
}

export const FROM_ADDRESS = process.env.NOTIFY_FROM_EMAIL || 'newsletter@arshnoorsinghsohi.com';
