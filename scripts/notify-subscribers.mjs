#!/usr/bin/env node
// scripts/notify-subscribers.mjs
// ============================================================
// Runs last in the "postbuild" chain (after generate-og-pages.mjs and
// generate-feeds.mjs). Compares published posts against a "last
// notified" marker stored in Upstash Redis, and — if there's anything
// newer — emails every confirmed subscriber via Resend.
//
// Safe to run with no setup at all: if UPSTASH_REDIS_REST_URL/TOKEN or
// RESEND_API_KEY aren't set (e.g. a local `npm run build`, or before
// you've provisioned Upstash/Resend), it logs a note and exits cleanly
// rather than failing the build.
//
// First-run behavior: on the very first build where Redis has no
// marker yet, this deliberately does NOT email anyone for the entire
// backlog of existing posts — it just records "now" as the baseline.
// Only posts published after that point trigger a notification.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import { parseFrontmatter } from '../src/lib/frontmatter.js';
import { SITE_URL, SITE_NAME } from '../src/lib/site.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');
const LAST_NOTIFIED_KEY = 'meta:lastNotifiedAt';
const CONFIRMED_SET_KEY = 'subscribers:confirmed';
const FROM_ADDRESS = process.env.NOTIFY_FROM_EMAIL || 'newsletter@arshnoorsinghsohi.com';
const BATCH_SIZE = 100; // Resend's batch-send endpoint caps at 100 per call

function loadPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const { data } = parseFrontmatter(raw);
      if (data.published === false) return null;
      if (!data.date) return null;
      return {
        slug,
        title: data.title || slug,
        excerpt: data.excerpt || '',
        date: data.date,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? -1 : 1)); // oldest first
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function notificationHtml(post, unsubscribeUrl) {
  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <p style="text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.75rem; color: #b3261e; margin-bottom: 0.25rem;">New post</p>
      <h2 style="margin: 0 0 0.75rem;">${post.title}</h2>
      ${post.excerpt ? `<p style="margin: 0 0 1.25rem; opacity: 0.85;">${post.excerpt}</p>` : ''}
      <p style="margin: 1.5rem 0;">
        <a href="${postUrl}" style="display:inline-block;padding:12px 22px;background:#111;color:#fff;text-decoration:none;border-radius:4px;font-weight:600;">
          Read it
        </a>
      </p>
      <p style="font-size: 0.75rem; opacity: 0.55; margin-top: 2rem;">
        You're getting this because you subscribed to ${SITE_NAME}'s blog.
        <a href="${unsubscribeUrl}" style="color: inherit;">Unsubscribe</a>
      </p>
    </div>
  `;
}

async function main() {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;

  if (!upstashUrl || !upstashToken || !resendKey) {
    console.log('[notify-subscribers] Skipping — Upstash/Resend env vars not set yet (see BLOG_GUIDE.md).');
    return;
  }

  const redis = new Redis({ url: upstashUrl, token: upstashToken });
  const resend = new Resend(resendKey);

  const posts = loadPosts();
  const lastNotifiedAt = await redis.get(LAST_NOTIFIED_KEY);

  if (!lastNotifiedAt) {
    // First run ever — establish a baseline, don't blast the backlog.
    await redis.set(LAST_NOTIFIED_KEY, new Date().toISOString());
    console.log('[notify-subscribers] First run — recorded baseline, no emails sent for existing posts.');
    return;
  }

  const newPosts = posts.filter((p) => new Date(p.date).toISOString() > lastNotifiedAt);
  if (newPosts.length === 0) {
    console.log('[notify-subscribers] No new posts since last notification — nothing to send.');
    return;
  }

  const subscriberEmails = await redis.smembers(CONFIRMED_SET_KEY);
  if (subscriberEmails.length === 0) {
    console.log(`[notify-subscribers] ${newPosts.length} new post(s), but no confirmed subscribers yet.`);
    await redis.set(LAST_NOTIFIED_KEY, new Date().toISOString());
    return;
  }

  // Look up each subscriber's token so the unsubscribe link is per-person.
  const records = await Promise.all(
    subscriberEmails.map(async (email) => {
      const raw = await redis.get(`subscriber:${email}`);
      const record = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return record?.token ? { email, token: record.token } : null;
    })
  );
  const subscribers = records.filter(Boolean);

  let sentCount = 0;
  for (const post of newPosts) {
    const emails = subscribers.map(({ email, token }) => ({
      from: `${SITE_NAME} <${FROM_ADDRESS}>`,
      to: email,
      subject: `New post: ${post.title}`,
      html: notificationHtml(post, `${SITE_URL}/api/unsubscribe?token=${token}`),
    }));

    for (const batch of chunk(emails, BATCH_SIZE)) {
      try {
        await resend.batch.send(batch);
        sentCount += batch.length;
      } catch (err) {
        console.error(`[notify-subscribers] Failed to send a batch for "${post.title}":`, err.message || err);
      }
    }
  }

  await redis.set(LAST_NOTIFIED_KEY, new Date().toISOString());
  console.log(
    `[notify-subscribers] Notified ${subscribers.length} subscriber(s) about ${newPosts.length} new post(s) (${sentCount} emails sent).`
  );
}

main().catch((err) => {
  // Never fail the build over a notification hiccup.
  console.error('[notify-subscribers] Unexpected error (non-fatal):', err);
});
