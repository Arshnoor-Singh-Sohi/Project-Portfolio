// src/lib/frontmatter.js
// ============================================================
// Pure, dependency-free frontmatter parser. No Vite-only APIs
// (no import.meta.glob) so this same module can be imported both
// from the browser bundle (src/lib/posts.js) and from a plain Node
// script (scripts/generate-og-pages.mjs).
// ============================================================

export function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: raw };
  }

  const [, block, content] = match;
  const lines = block.split(/\r?\n/);
  const data = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Multi-line YAML list:
    //   tags:
    //     - ai
    //     - engineering
    if (value === '') {
      const items = [];
      while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
        i++;
        items.push(stripQuotes(lines[i].trim().replace(/^-\s+/, '')));
      }
      data[key] = items;
      continue;
    }

    // Inline list: tags: [ai, engineering]
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((v) => stripQuotes(v.trim()))
        .filter(Boolean);
      continue;
    }

    if (value === 'true') {
      data[key] = true;
      continue;
    }
    if (value === 'false') {
      data[key] = false;
      continue;
    }

    data[key] = stripQuotes(value);
  }

  return { data, content: content.replace(/^\r?\n/, '') };
}

export function estimateReadTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export function slugFromPath(path) {
  const file = path.split('/').pop();
  return file.replace(/\.md$/, '');
}
