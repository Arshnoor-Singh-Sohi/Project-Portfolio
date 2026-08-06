// src/lib/posts.js
// ============================================================
// Loads every markdown post from src/content/blog at build time.
// This is the whole "CMS": drop a .md file with frontmatter into
// src/content/blog, git push, and it shows up on /blog automatically.
//
// Frontmatter fields (all optional except title):
//   title:      "My Post Title"
//   date:       2026-08-05          (YYYY-MM-DD, used for sorting)
//   excerpt:    "One or two sentence summary for the blog list card."
//   tags:       [ai, engineering]   (inline array) or a "- item" list
//   coverImage: images/foo.png      (relative to src/content/blog, OR an
//               absolute /public path like /blog-covers/foo.png, OR a
//               full https:// URL)
//   published:  false               (set to false to keep a draft off the site)
//
// Files whose name starts with "_" (e.g. _template.md) are treated as
// templates/drafts and are always skipped, regardless of frontmatter.
//
// Images referenced *inside* a post's markdown body (e.g. an Obsidian
// attachment dropped in src/content/blog/images/) are resolved the same
// way — see resolvePostImage() below.
// ============================================================

import { parseFrontmatter, estimateReadTime, slugFromPath } from './frontmatter';

const modules = import.meta.glob('../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// Every image dropped anywhere under src/content/blog gets bundled by
// Vite and given a hashed, cache-busted URL. This builds a lookup from
// "the path you'd type in markdown" -> "the real built URL".
const imageModules = import.meta.glob('../content/blog/**/*.{png,jpg,jpeg,gif,webp,svg}', {
  eager: true,
  import: 'default',
});

const imageMap = {};
for (const [path, url] of Object.entries(imageModules)) {
  const rel = path.replace('../content/blog/', '');
  imageMap[rel] = url;
}

export function resolvePostImage(pathStr) {
  if (!pathStr) return null;
  if (/^https?:\/\//.test(pathStr)) return pathStr; // full external URL
  if (pathStr.startsWith('/')) return pathStr; // public/ absolute path
  return imageMap[pathStr] || pathStr; // relative to src/content/blog
}

const allPosts = Object.entries(modules)
  .map(([path, raw]) => {
    const slug = slugFromPath(path);
    if (slug.startsWith('_')) return null; // template / draft convention

    const { data, content } = parseFrontmatter(raw);
    if (data.published === false) return null;

    return {
      slug,
      title: data.title || slug,
      date: data.date || '',
      excerpt: data.excerpt || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      coverImage: resolvePostImage(data.coverImage),
      readTime: data.readTime || estimateReadTime(content),
      content,
    };
  })
  .filter(Boolean)
  .sort((a, b) => (a.date < b.date ? 1 : -1));

// "Issue #" numbering, ascending from the oldest post — matches the
// site's own "DATA STORM #001" comic-issue branding. allPosts is
// sorted newest-first above, so the oldest post gets #1.
allPosts.forEach((post, i) => {
  post.issue = allPosts.length - i;
});

export function getAllPosts() {
  return allPosts;
}

export function getPostBySlug(slug) {
  return allPosts.find((p) => p.slug === slug) || null;
}

export function getAdjacentPosts(slug) {
  const index = allPosts.findIndex((p) => p.slug === slug);
  if (index === -1) return { newer: null, older: null };
  return {
    newer: index > 0 ? allPosts[index - 1] : null, // more recent (appears earlier in the desc-sorted array)
    older: index < allPosts.length - 1 ? allPosts[index + 1] : null,
  };
}

// Posts sharing at least one tag with `slug`, most-shared-tags first,
// then most recent. Backfills with the newest other posts if there
// aren't enough tag matches, so the "related posts" block is never
// empty just because a post's tags are unique.
export function getRelatedPosts(slug, limit = 3) {
  const current = getPostBySlug(slug);
  if (!current) return [];

  const others = allPosts.filter((p) => p.slug !== slug);
  const scored = others
    .map((p) => ({
      post: p,
      shared: p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.shared - a.shared);

  const related = scored.map((entry) => entry.post).slice(0, limit);
  if (related.length < limit) {
    for (const p of others) {
      if (related.length >= limit) break;
      if (!related.includes(p)) related.push(p);
    }
  }
  return related;
}

export function formatIssue(issueNumber) {
  return `ISSUE #${String(issueNumber).padStart(3, '0')}`;
}
