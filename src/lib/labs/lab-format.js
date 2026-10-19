// src/lib/labs/lab-format.js
// ============================================================
// The Markdown lab format, used for templates (src/labs/templates)
// and for import and export.
//
//   ---
//   title: "FFT explorer"
//   summary: "One sentence."
//   collection: "Maths"
//   tags: [fft, signals]
//   packages: [numpy, matplotlib]
//   objectives:
//     - Explain what one FFT bin means.
//   ---
//   Markdown text becomes a text cell.
//
//   ```python
//   # A python fence at the start of a line becomes a code cell.
//   ```
//
//   <!-- cell -->   (on its own line) starts a new text cell.
//
// Other fences (```text, ```mermaid, ~~~ ...) stay inside the text
// cell, and a ```python fence inside them is not a code cell.
// Also: Python files in "percent" format (# %% cell markers).
// ============================================================

import { parseFrontmatter, stripQuotes } from '../frontmatter.js';

const CELL_BREAK_RE = /^<!--\s*cell\s*-->\s*$/i;
const FENCE_OPEN_RE = /^(`{3,}|~{3,})\s*([^\s`]*)?.*$/;
const PYTHON_LANGS = ['python', 'py', 'python3'];

function pushText(cells, lines) {
  const text = lines.join('\n').replace(/^\s*\n/, '').replace(/\s+$/, '');
  if (text.trim()) cells.push({ type: 'markdown', source: text });
}

// Splits a Markdown body into { type, source } cells.
export function parseCellsFromMarkdown(body) {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const cells = [];
  let text = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (CELL_BREAK_RE.test(line)) {
      pushText(cells, text);
      text = [];
      i += 1;
      continue;
    }
    const open = FENCE_OPEN_RE.exec(line);
    if (!open) {
      text.push(line);
      i += 1;
      continue;
    }
    // A fence: find its closing line (same character, at least as long).
    const marker = open[1];
    const lang = (open[2] || '').toLowerCase();
    const closeRe = new RegExp(`^${marker[0] === '`' ? '`' : '~'}{${marker.length},}\\s*$`);
    let end = i + 1;
    while (end < lines.length && !closeRe.test(lines[end])) end += 1;
    const inner = lines.slice(i + 1, end);
    if (PYTHON_LANGS.includes(lang)) {
      pushText(cells, text);
      text = [];
      cells.push({ type: 'code', source: inner.join('\n').replace(/\s+$/, '') });
    } else {
      text.push(...lines.slice(i, Math.min(end + 1, lines.length)));
    }
    i = end + 1;
  }
  pushText(cells, text);
  return cells;
}

function toList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return value.split(',').map((s) => stripQuotes(s.trim())).filter(Boolean);
  return [];
}

// Parses a Markdown lab file. Returns { data, cells } where `data`
// holds the definition fields from the frontmatter.
export function parseLabMarkdown(raw) {
  const { data, content } = parseFrontmatter(String(raw).replace(/^\uFEFF/, ''));
  return {
    data: {
      id: typeof data.id === 'string' ? data.id : undefined,
      title: typeof data.title === 'string' ? data.title : '',
      summary: typeof data.summary === 'string' ? data.summary : '',
      collection: typeof data.collection === 'string' ? data.collection : '',
      tags: toList(data.tags),
      packages: toList(data.packages),
      objectives: toList(data.objectives),
      level: typeof data.level === 'string' ? data.level : '',
      order: Number.isFinite(Number(data.order)) ? Number(data.order) : undefined,
      runtime: typeof data.runtime === 'string' ? data.runtime : 'python',
    },
    cells: parseCellsFromMarkdown(content),
  };
}

function yamlString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function inlineList(list) {
  return `[${list.map((v) => (/^[A-Za-z0-9._+#-]+$/.test(v) ? v : yamlString(v))).join(', ')}]`;
}

function fenceFor(code) {
  let longest = 2;
  for (const m of code.matchAll(/`{3,}/g)) longest = Math.max(longest, m[0].length);
  return '`'.repeat(longest + 1);
}

// Writes a lab in the Markdown lab format. Outputs are not written:
// the file holds the definition and the content, like a template.
export function labToMarkdown(lab, content) {
  const front = ['---', `title: ${yamlString(lab.title || 'Untitled lab')}`];
  if (lab.description) front.push(`summary: ${yamlString(lab.description)}`);
  if (lab.collection) front.push(`collection: ${yamlString(lab.collection)}`);
  if (lab.tags && lab.tags.length) front.push(`tags: ${inlineList(lab.tags)}`);
  if (lab.packages && lab.packages.length) front.push(`packages: ${inlineList(lab.packages)}`);
  if (lab.objectives && lab.objectives.length) {
    front.push('objectives:');
    for (const o of lab.objectives) front.push(`  - ${yamlString(o)}`);
  }
  front.push('---', '');

  const parts = [];
  let previous = null;
  for (const cell of content.cells) {
    if (cell.type === 'code') {
      const fence = fenceFor(cell.source);
      parts.push(`${fence}python\n${cell.source}\n${fence}`);
    } else {
      if (previous === 'markdown') parts.push('<!-- cell -->');
      parts.push(cell.source.trim());
    }
    previous = cell.type;
  }
  return `${front.join('\n')}${parts.join('\n\n')}\n`;
}

// Python "percent" format: "# %%" starts a code cell, "# %% [markdown]"
// a text cell whose lines start with "# ". A file without markers is
// one code cell.
export function parseCellsFromPython(raw) {
  const lines = String(raw).replace(/\r\n?/g, '\n').split('\n');
  if (!lines.some((l) => /^#\s*%%/.test(l))) {
    const source = lines.join('\n').trim();
    return source ? [{ type: 'code', source }] : [];
  }
  const cells = [];
  let current = null;
  const flush = () => {
    if (!current) return;
    let source = current.lines.join('\n').replace(/^\s*\n/, '').replace(/\s+$/, '');
    if (current.type === 'markdown') source = source.replace(/^# ?/gm, '');
    if (source.trim()) cells.push({ type: current.type, source });
  };
  for (const line of lines) {
    const m = /^#\s*%%(.*)$/.exec(line);
    if (m) {
      flush();
      current = { type: /\[\s*(markdown|md)\s*\]/i.test(m[1]) ? 'markdown' : 'code', lines: [] };
    } else {
      if (!current) current = { type: 'code', lines: [] };
      current.lines.push(line);
    }
  }
  flush();
  return cells;
}

// Python percent format, for "Export as .py".
export function labToPython(lab, content) {
  const out = [`# ${lab.title || 'Untitled lab'}`];
  if (lab.description) out.push(`# ${lab.description}`);
  for (const cell of content.cells) {
    out.push('');
    if (cell.type === 'code') {
      out.push('# %%', cell.source);
    } else {
      out.push('# %% [markdown]', cell.source.split('\n').map((l) => (l ? `# ${l}` : '#')).join('\n'));
    }
  }
  return `${out.join('\n')}\n`;
}
