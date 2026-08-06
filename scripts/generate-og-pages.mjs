#!/usr/bin/env node
// scripts/generate-og-pages.mjs
// ============================================================
// Runs automatically after `vite build` (via the "postbuild" npm
// script — no Vercel config needed, npm runs it for you).
//
// Why this exists: Vite builds one SPA shell (dist/index.html) with
// one generic <head>. Chat apps and some social crawlers (iMessage,
// Slack, Discord, and plenty of older/JS-shy bots) don't execute
// JavaScript before generating a link preview — they just read the
// <head> of whatever HTML the URL returns. Without this script, every
// shared link — home page or any blog post — would show the exact
// same generic preview.
//
// What it does: for each real post in src/content/blog, clone the
// already-built dist/index.html and swap in that post's title,
// excerpt, and cover image as real <meta> tags, then write it to
// dist/blog/<slug>/index.html. Vercel serves an existing static file
// before it falls back to the SPA rewrite in vercel.json, so:
//   - a crawler hitting /blog/<slug> gets the real per-post preview
//   - a real visitor still gets the exact same JS/CSS bundle, so the
//     full interactive site loads and takes over immediately
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../src/lib/frontmatter.js';
import { SITE_URL } from '../src/lib/site.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');

const DEFAULT_IMAGE = `${SITE_URL}/assets/images/profile.png`;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
        coverImage: data.coverImage || null,
      };
    })
    .filter(Boolean);
}

// Only handles paths that are knowable without running Vite:
//   - a full https:// URL -> used as-is
//   - an absolute path (e.g. /blog-covers/foo.png, served from public/)
// A relative path (e.g. images/foo.png, an Obsidian attachment inside
// src/content/blog) is hashed by Vite *inside the browser bundle* and
// isn't resolvable from this plain Node script, so it falls back to
// the site default image. Put a dedicated share-preview image in
// public/blog-covers/ and reference it as coverImage: /blog-covers/x.png
// if you want a specific per-post preview image.
function resolveOgImage(coverImage) {
  if (!coverImage) return DEFAULT_IMAGE;
  if (/^https?:\/\//.test(coverImage)) return coverImage;
  if (coverImage.startsWith('/')) return `${SITE_URL}${coverImage}`;
  return DEFAULT_IMAGE;
}

// The source index.html (dist/index.html) already carries the
// homepage's own description/OG/Twitter tags. Strip those out before
// injecting per-page ones below, otherwise both sets end up in the
// document and crawlers may pick up the wrong (first) one.
function stripExistingMeta(html) {
  return html
    .replace(/[ \t]*<meta name="description"[^>]*\/?>\n?/g, '')
    .replace(/[ \t]*<meta property="og:[a-z]+"[^>]*\/?>\n?/g, '')
    .replace(/[ \t]*<meta name="twitter:[a-z]+"[^>]*\/?>\n?/g, '')
    .replace(/[ \t]*<link rel="canonical"[^>]*\/?>\n?/g, '')
    .replace(/[ \t]*<!--[\s\S]*?-->\n?/g, '');
}

function injectHead(template, { title, description, url, image, type }) {
  const cleaned = stripExistingMeta(template);
  const metaBlock = `
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
  </head>`;

  return cleaned
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace('</head>', metaBlock);
}

function writePage(relDir, html) {
  const dir = path.join(DIST, relDir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  console.log(`  wrote dist/${relDir}/index.html`);
}

function main() {
  const templatePath = path.join(DIST, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.warn('[generate-og-pages] dist/index.html not found — skipping (did `vite build` run first?)');
    return;
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  const posts = loadPosts();

  console.log(`[generate-og-pages] generating share previews for /blog + ${posts.length} post(s)`);

  writePage(
    'blog',
    injectHead(template, {
      title: "The Blog — Arshnoor's Portfolio Showcase",
      description: 'Writing on AI systems, data engineering, and building things.',
      url: `${SITE_URL}/blog`,
      image: DEFAULT_IMAGE,
      type: 'website',
    })
  );

  for (const post of posts) {
    writePage(
      `blog/${post.slug}`,
      injectHead(template, {
        title: `${post.title} — Arshnoor Singh Sohi`,
        description: post.excerpt || "Read this post on Arshnoor Singh Sohi's blog.",
        url: `${SITE_URL}/blog/${post.slug}`,
        image: resolveOgImage(post.coverImage),
        type: 'article',
      })
    );
  }
}

main();
