// src/lib/remark-callouts.js
// Remark plugin for Obsidian-style callouts:
//
//   > [!key] Optional title
//   > Body text, with **markdown** and $math$.
//
// A blockquote whose first line starts with [!key], [!trap],
// [!mistake], [!analogy], [!example] or [!note] gets data-callout (the type) and
// data-callout-title (the rest of that first line, plain text). The
// marker line is removed from the body. Other blockquotes are untouched.
export const CALLOUT_TYPES = ['key', 'trap', 'mistake', 'analogy', 'example', 'note'];

const MARKER = new RegExp(`^\\[!(${CALLOUT_TYPES.join('|')})\\][ \\t]*`, 'i');

function transformBlockquote(node) {
  const first = node.children && node.children[0];
  if (!first || first.type !== 'paragraph' || !first.children || !first.children.length) return;
  const text = first.children[0];
  if (text.type !== 'text') return;
  const match = MARKER.exec(text.value);
  if (!match) return;

  const type = match[1].toLowerCase();
  const rest = text.value.slice(match[0].length);
  const newline = rest.indexOf('\n');
  // Title = rest of the first line, but only when the line is plain text.
  const lineEndsHere = newline !== -1 || first.children.length === 1;
  const title = lineEndsHere ? (newline === -1 ? rest : rest.slice(0, newline)).trim() : '';
  const body = lineEndsHere ? (newline === -1 ? '' : rest.slice(newline + 1)) : rest;

  if (body) {
    text.value = body;
  } else {
    first.children.shift();
    if (first.children[0] && first.children[0].type === 'break') first.children.shift();
  }
  if (!first.children.length) node.children.shift();

  node.data = node.data || {};
  node.data.hProperties = {
    ...(node.data.hProperties || {}),
    'data-callout': type,
    'data-callout-title': title,
  };
}

function walk(node) {
  if (node.type === 'blockquote') transformBlockquote(node);
  if (node.children) node.children.forEach(walk);
}

export default function remarkCallouts() {
  return (tree) => {
    walk(tree);
  };
}
