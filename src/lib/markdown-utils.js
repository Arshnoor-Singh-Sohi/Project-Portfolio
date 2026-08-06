// src/lib/markdown-utils.js
// Small shared helpers used by BlogPost.jsx for the table of contents,
// heading anchors, and the code-block copy button. Pure JS, no
// Vite-only APIs, so it stays easy to reuse or test.

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

// Recursively pulls raw text back out of a React children tree —
// used both to build heading ids and to get the plain-text version of
// a syntax-highlighted code block for the copy button.
export function getTextContent(node) {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(getTextContent).join('');
  if (node && node.props && node.props.children != null) {
    return getTextContent(node.props.children);
  }
  return '';
}

// Returns a `next(text)` function that turns heading text into a
// unique slug, appending -2, -3, ... on collisions. Create one fresh
// instance per render pass (see BlogPost.jsx) so ids stay stable and
// match between the precomputed ToC and the actual rendered headings.
export function createHeadingIdAssigner() {
  const seen = new Map();
  return function next(text) {
    const base = slugify(text) || 'section';
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

// Scans raw markdown (before it's parsed) for h2/h3 headings, skipping
// fenced code blocks so a "## " inside an example snippet doesn't get
// picked up. Uses the exact same id-assignment logic as the live
// heading renderer, so ToC links always match the rendered anchors.
export function extractHeadings(markdown) {
  const assigner = createHeadingIdAssigner();
  const headings = [];
  let inCodeBlock = false;

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim();
    if (/^(```|~~~)/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = /^(#{2,3})\s+(.*)$/.exec(line);
    if (match) {
      const depth = match[1].length;
      const text = match[2].trim();
      headings.push({ depth, text, id: assigner(text) });
    }
  }

  return headings;
}
