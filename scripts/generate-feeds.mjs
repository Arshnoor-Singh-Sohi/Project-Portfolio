#!/usr/bin/env node
// scripts/generate-feeds.mjs
// ============================================================
// Runs after `vite build` (chained in the "postbuild" npm script,
// right after generate-og-pages.mjs). Writes:
//   - dist/rss.xml      — subscribe-in-a-feed-reader support
//   - dist/sitemap.xml  — helps Google/Bing actually find every post
//
// Both are generated from the same src/content/blog markdown files
// used everywhere else, so there's nothing extra to maintain — add a
// post, both the feed and the sitemap pick it up on the next build.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../src/lib/frontmatter.js';
import { SITE_URL, SITE_NAME } from '../src/lib/site.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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
      return {
        slug,
        title: data.title || slug,
        excerpt: data.excerpt || '',
        date: data.date || '',
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}

function toRfc822(dateStr) {
  const d = dateStr ? new Date(dateStr) : null;
  if (!d || Number.isNaN(d.getTime())) return new Date(0).toUTCString();
  return d.toUTCString();
}

function toIsoDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : null;
  if (!d || Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function buildRss(posts) {
  const items = posts
    .map(
      (p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <guid>${SITE_URL}/blog/${p.slug}</guid>
      <pubDate>${toRfc822(p.date)}</pubDate>
      <description>${escapeXml(p.excerpt)}</description>
    </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Writing on AI systems, data engineering, and building things.</description>
    <language>en-us</language>${items}
  </channel>
</rss>
`;
}

function buildSitemap(posts) {
  const staticUrls = [
    { loc: `${SITE_URL}/`, priority: '1.0' },
    { loc: `${SITE_URL}/blog`, priority: '0.8' },
  ];
  const postUrls = posts.map((p) => ({
    loc: `${SITE_URL}/blog/${p.slug}`,
    lastmod: toIsoDate(p.date),
    priority: '0.6',
  }));

  const urls = [...staticUrls, ...postUrls]
    .map(
      (u) => `
  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>
`;
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.warn('[generate-feeds] dist/ not found — skipping (did `vite build` run first?)');
    return;
  }

  const posts = loadPosts();
  fs.writeFileSync(path.join(DIST, 'rss.xml'), buildRss(posts), 'utf8');
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), buildSitemap(posts), 'utf8');
  console.log(`[generate-feeds] wrote dist/rss.xml and dist/sitemap.xml (${posts.length} post(s))`);
}

main();
