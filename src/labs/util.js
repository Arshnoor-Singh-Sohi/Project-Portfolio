// src/labs/util.js
// Small browser helpers for Labs: safe localStorage, relative times,
// file downloads and the HTML sanitizer for rich Python output.

// ---------- localStorage (can be blocked, full or missing) ----------

export function readLocal(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Returns true when the value was stored.
export function writeLocal(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeLocal(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}

// ---------- time ----------

const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

export function timeAgo(iso, now = Date.now()) {
  if (!iso) return 'never';
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  if (!Number.isFinite(seconds)) return '';
  if (seconds < 45) return 'just now';
  for (const [unit, size] of UNITS) {
    if (seconds >= size) {
      const n = Math.round(seconds / size);
      return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
    }
  }
  return 'just now';
}

export function formatDateTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms)) return '';
  if (ms < 1000) return `${Math.max(1, Math.round(ms))} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
  const m = Math.floor(ms / 60_000);
  return `${m} min ${Math.round((ms % 60_000) / 1000)} s`;
}

// ---------- files ----------

export function slugify(text) {
  return (
    String(text || 'lab')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'lab'
  );
}

export function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileText(file, maxBytes = 4 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(`The file is ${(file.size / 1e6).toFixed(1)} MB. The limit is ${maxBytes / 1e6} MB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.readAsText(file);
  });
}

// ---------- HTML output (pandas tables and similar) ----------

const ALLOWED_TAGS = new Set([
  'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'CAPTION', 'COLGROUP', 'COL',
  'DIV', 'SPAN', 'P', 'BR', 'B', 'I', 'EM', 'STRONG', 'CODE', 'PRE', 'SMALL', 'SUB', 'SUP', 'UL', 'OL', 'LI', 'HR',
]);
const ALLOWED_ATTRS = new Set(['colspan', 'rowspan']);

// Keeps only simple text and table markup, with no attributes except
// colspan and rowspan. Scripts, styles, links, images, event handlers
// and everything else are removed. DOMParser does not run scripts.
export function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  const out = document.createElement('div');

  function copy(node, parent) {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        parent.appendChild(document.createTextNode(child.textContent));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (ALLOWED_TAGS.has(child.tagName)) {
          const el = document.createElement(child.tagName.toLowerCase());
          for (const attr of child.attributes) {
            if (ALLOWED_ATTRS.has(attr.name) && /^\d{1,3}$/.test(attr.value)) el.setAttribute(attr.name, attr.value);
          }
          copy(child, el);
          parent.appendChild(el);
        } else if (!['SCRIPT', 'STYLE', 'TEMPLATE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT'].includes(child.tagName)) {
          copy(child, parent); // drop the tag, keep its text
        }
      }
    }
  }
  copy(doc.body, out);
  return out.innerHTML;
}

// ---------- focus ----------

// Focuses the code editor (or the first text field) inside an element.
export function focusEditorIn(element) {
  if (!element) return false;
  const target = element.querySelector('.cm-content, textarea');
  if (target) target.focus();
  return Boolean(target);
}
