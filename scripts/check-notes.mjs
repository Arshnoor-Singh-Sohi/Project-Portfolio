// scripts/check-notes.mjs — syntax check for the /notes Markdown files.
//
// Usage from the repository root:
//   node scripts/check-notes.mjs            -> checks every file in src/content/notes
//   node scripts/check-notes.mjs a.md b.md  -> checks only these files
//
// It checks: frontmatter fields, KaTeX math (also inside check blocks),
// JSON in video/check/plot blocks, mermaid syntax (only when jsdom is
// installed), callout types, table cell counts, and /notes/ links.
// Env NOTES_KNOWN (comma-separated note paths) sets the link targets
// when files are passed by hand. Not part of the site build.
import fs from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';
import katex from 'katex';

const CALLOUT_TYPES = ['key', 'trap', 'mistake', 'analogy', 'example', 'note'];
const STATUSES = ['not-started', 'in-progress', 'mastered', 'review'];
const NOTES_ROOT = path.resolve('src/content/notes');
let KNOWN = (process.env.NOTES_KNOWN || '').split(',').map((s) => s.trim()).filter(Boolean);

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.name.endsWith('.md')) out.push(full);
  }
  return out;
}

// Optional mermaid check (needs jsdom).
let mermaid = null;
try {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  for (const k of ['window', 'document', 'navigator', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'DOMParser', 'CSSStyleSheet', 'MutationObserver']) {
    try { globalThis[k] = k === 'window' ? dom.window : k === 'document' ? dom.window.document : dom.window[k]; } catch { /* read-only global */ }
  }
  mermaid = (await import('mermaid')).default;
  mermaid.initialize({ startOnLoad: false });
} catch (e) {
  console.log('(mermaid check skipped:', e.message, ')');
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    data[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  return { data, content: match[2] };
}

function clipTime(v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? v : NaN;
  if (typeof v !== 'string') return NaN;
  if (/^\d+(\.\d+)?$/.test(v)) return Number(v);
  const m = /^(?:(\d+):)?(\d+):(\d{2})$/.exec(v);
  if (!m) return NaN;
  return (Number(m[1] || 0) * 3600) + Number(m[2]) * 60 + Number(m[3]);
}

function katexCheck(tex, display, where, errors) {
  try {
    katex.renderToString(tex, { throwOnError: true, displayMode: display, strict: 'ignore' });
  } catch (e) {
    errors.push(`${where}: KaTeX error in "${tex.slice(0, 60)}": ${e.message.split('\n')[0]}`);
  }
}

function mathInMarkdown(md, where, errors) {
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(md);
  visit(tree, (n) => {
    if (n.type === 'inlineMath') katexCheck(n.value, false, where, errors);
    if (n.type === 'math') katexCheck(n.value, true, where, errors);
  });
}

// Count table cells on a raw line: split on | that are not escaped and not inside `code` or $math$.
function cellCount(line) {
  let inCode = false, inMath = false, count = 0, prev = '';
  const s = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  for (const ch of s) {
    if (ch === '`' && !inMath) inCode = !inCode;
    else if (ch === '$' && !inCode && prev !== '\\') inMath = !inMath;
    else if (ch === '|' && !inCode && !inMath && prev !== '\\') count += 1;
    prev = ch;
  }
  return count + 1;
}

async function checkFile(file) {
  const errors = [];
  const warnings = [];
  const raw = fs.readFileSync(file, 'utf8');
  const fm = parseFrontmatter(raw);
  if (!fm) {
    errors.push('frontmatter: missing or malformed --- block');
    return { errors, warnings };
  }
  const { data, content } = fm;
  if (!data.title) errors.push('frontmatter: title is missing');
  if (data.order !== undefined && !Number.isFinite(Number(data.order))) errors.push(`frontmatter: order "${data.order}" is not a number`);
  if (data.confidence !== undefined && !/^[1-5]$/.test(data.confidence)) errors.push(`frontmatter: confidence "${data.confidence}" is not 1-5`);
  if (data.status !== undefined && !STATUSES.includes(data.status)) errors.push(`frontmatter: status "${data.status}" is not one of ${STATUSES.join(', ')}`);
  for (const k of ['learned', 'reviewDue']) {
    if (data[k] !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(data[k])) errors.push(`frontmatter: ${k} "${data[k]}" is not YYYY-MM-DD`);
  }
  if (data.private !== undefined && !['true', 'false'].includes(data.private)) errors.push(`frontmatter: private "${data.private}" is not true or false`);
  if (data.tags !== undefined && !/^\[.*\]$/.test(data.tags)) warnings.push('frontmatter: tags is not an inline list [a, b]');

  // Tables: consistent cell counts.
  const lines = content.split(/\r?\n/);
  let inFence = false;
  let tableCols = null;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; tableCols = null; return; }
    if (inFence) return;
    if (/^\s*\|/.test(line)) {
      const n = cellCount(line);
      if (tableCols === null) tableCols = n;
      else if (n !== tableCols) errors.push(`table line ${i + 1}: ${n} cells, header has ${tableCols}`);
    } else {
      tableCols = null;
    }
  });

  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(content);
  const pending = [];
  visit(tree, (node) => {
    if (node.type === 'inlineMath') katexCheck(node.value, false, 'math', errors);
    if (node.type === 'math') katexCheck(node.value, true, 'math block', errors);

    if (node.type === 'code') {
      const lang = (node.lang || '').toLowerCase();
      const where = `\`\`\`${lang} block (line ${node.position.start.line})`;
      if (['video', 'check', 'plot'].includes(lang)) {
        let spec;
        try { spec = JSON.parse(node.value); } catch (e) { errors.push(`${where}: bad JSON: ${e.message}`); return; }
        if (lang === 'video') {
          if (typeof spec.src !== 'string' || !spec.src.startsWith('/notes/media/')) errors.push(`${where}: src must start with /notes/media/`);
          const s = clipTime(spec.start), e = clipTime(spec.end);
          if (Number.isNaN(s)) errors.push(`${where}: bad start ${JSON.stringify(spec.start)}`);
          if (Number.isNaN(e)) errors.push(`${where}: bad end ${JSON.stringify(spec.end)}`);
          if (s !== null && e !== null && !Number.isNaN(s) && !Number.isNaN(e) && e <= s) errors.push(`${where}: end is not later than start`);
        }
        if (lang === 'check') {
          for (const k of ['question', 'answer']) if (typeof spec[k] !== 'string' || !spec[k].trim()) errors.push(`${where}: "${k}" is required`);
          if (spec.hint !== undefined && typeof spec.hint !== 'string') errors.push(`${where}: "hint" must be a string`);
          for (const k of ['question', 'hint', 'answer']) if (typeof spec[k] === 'string') mathInMarkdown(spec[k], `${where} ${k}`, errors);
        }
        if (lang === 'plot') {
          if (!Array.isArray(spec.data) || !spec.data.length) errors.push(`${where}: data must be a non-empty array`);
          else spec.data.forEach((d, j) => { if (!d.fn && !d.points && !d.vector) errors.push(`${where}: data[${j}] has no fn`); });
        }
      }
      if (lang === 'mermaid' && mermaid) {
        pending.push(mermaid.parse(node.value).then(() => null, (e) => `${where}: mermaid parse error: ${String(e.message || e).split('\n')[0]}`));
      }
    }

    if (node.type === 'blockquote') {
      const first = node.children && node.children[0];
      const text = first && first.type === 'paragraph' && first.children && first.children[0];
      if (text && text.type === 'text' && /^\[!/.test(text.value)) {
        const m = /^\[!(\w+)\]/.exec(text.value);
        if (!m || !CALLOUT_TYPES.includes(m[1].toLowerCase())) errors.push(`callout line ${node.position.start.line}: unknown type "${m ? m[1] : text.value.slice(0, 12)}"`);
      }
    }

    if (node.type === 'link' && node.url.startsWith('/notes/') && !node.url.startsWith('/notes/media/') && KNOWN.length) {
      const target = node.url.replace(/^\/notes\//, '').replace(/[#?].*$/, '').replace(/\/$/, '');
      if (!KNOWN.includes(target)) errors.push(`link line ${node.position.start.line}: ${node.url} does not match a note`);
    }
  });
  for (const r of await Promise.all(pending)) if (r) errors.push(r);
  return { errors, warnings };
}

let files = process.argv.slice(2);
if (!files.length) {
  if (!fs.existsSync(NOTES_ROOT)) {
    console.log('No files given and src/content/notes not found. Run from the repository root.');
    process.exit(1);
  }
  files = walk(NOTES_ROOT);
  if (!KNOWN.length) {
    const known = new Set();
    for (const f of files) {
      const rel = path.relative(NOTES_ROOT, f).split(path.sep).join('/');
      const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
      if (dir) dir.split('/').forEach((_, i, parts) => known.add(parts.slice(0, i + 1).join('/')));
      if (!/(^|\/)_(folder|index)\.md$/.test(rel)) known.add(rel.replace(/\.md$/, ''));
    }
    KNOWN = [...known];
  }
}

let total = 0;
for (const f of files) {
  const { errors, warnings } = await checkFile(f);
  total += errors.length;
  console.log(`${errors.length ? 'FAIL' : 'ok  '} ${path.relative(process.cwd(), f).split(path.sep).join('/')}`);
  for (const e of errors) console.log('   - ' + e);
  for (const w of warnings) console.log('   ~ ' + w);
}
console.log(total ? `\n${total} error(s)` : '\nAll files pass.');
process.exit(total ? 1 : 0);
