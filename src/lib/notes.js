// src/lib/notes.js
// ============================================================
// Builds the /notes tree from `virtual:notes` (see
// plugins/vite-plugin-notes.js — private notes are already removed
// there in production builds). Content rules live in NOTES_GUIDE.md:
//
//   src/content/notes/_index.md         -> the /notes home page
//   src/content/notes/<dir>/_folder.md  -> title/order/summary + body
//                                          of the folder page
//   src/content/notes/<path>.md         -> a note at /notes/<path>
//
// Siblings sort by `order`, then by file name; items without `order`
// go last. A folder with no visible notes (at any depth) is hidden,
// unless it has its own _folder.md. So a planned part folder with a
// _folder.md shows in the tree before its first note exists.
// ============================================================

import files from 'virtual:notes';

export const STATUSES = ['not-started', 'in-progress', 'mastered', 'review'];

export const STATUS_LABELS = {
  'not-started': 'NOT STARTED',
  'in-progress': 'IN PROGRESS',
  mastered: 'MASTERED',
  review: 'REVIEW',
};

// Reserved URL under /notes — a root-level note named review.md would
// be shadowed by the review page.
export const REVIEW_PATH = 'review';

function toNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function toDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

// "00-progress" -> "00 progress" — fallback title for a folder
// without a _folder.md, or a note without a title.
function prettify(name) {
  return name.replace(/[-_]+/g, ' ').trim();
}

function compareItems(a, b) {
  const ao = a.order === undefined ? Infinity : a.order;
  const bo = b.order === undefined ? Infinity : b.order;
  if (ao !== bo) return ao < bo ? -1 : 1;
  return a.fileName.localeCompare(b.fileName, undefined, { numeric: true });
}

// Rough markdown -> text, only for search matching and snippets.
function plainText(markdown) {
  return markdown
    .replace(/```[\w-]*\n?/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[!(\w+)\]/g, ' ')
    .replace(/[#>*_`|$\\{}"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeFolder(dirPath) {
  const fileName = dirPath ? dirPath.split('/').pop() : '';
  return {
    type: 'folder',
    path: dirPath,
    url: dirPath ? `/notes/${dirPath}` : '/notes',
    fileName,
    title: prettify(fileName) || 'Notes',
    order: undefined,
    summary: '',
    content: '',
    hasPage: false,
    children: [],
    parent: null,
  };
}

function buildTree() {
  const root = makeFolder('');
  const folders = new Map([['', root]]);

  function getFolder(dirPath) {
    if (folders.has(dirPath)) return folders.get(dirPath);
    const folder = makeFolder(dirPath);
    const parentPath = dirPath.includes('/') ? dirPath.slice(0, dirPath.lastIndexOf('/')) : '';
    const parent = getFolder(parentPath);
    folder.parent = parent;
    parent.children.push(folder);
    folders.set(dirPath, folder);
    return folder;
  }

  for (const file of files) {
    const parts = file.path.split('/');
    const name = parts.pop();
    const dirPath = parts.join('/');
    const { data, content } = file;

    if (name === '_index.md' && dirPath === '') {
      root.title = data.title || root.title;
      root.summary = data.summary || '';
      root.content = content;
      continue;
    }

    if (name === '_folder.md') {
      const folder = getFolder(dirPath);
      folder.title = data.title || folder.title;
      folder.order = toNumber(data.order);
      folder.summary = data.summary || '';
      folder.content = content;
      folder.hasPage = true;
      continue;
    }

    const parent = getFolder(dirPath);
    const notePath = file.path.replace(/\.md$/, '');
    const confidence = toNumber(data.confidence);
    parent.children.push({
      type: 'note',
      path: notePath,
      url: `/notes/${notePath}`,
      fileName: name.replace(/\.md$/, ''),
      title: data.title || prettify(name.replace(/\.md$/, '')),
      order: toNumber(data.order),
      summary: data.summary || '',
      status: STATUSES.includes(data.status) ? data.status : undefined,
      confidence: confidence === undefined ? undefined : Math.min(5, Math.max(1, Math.round(confidence))),
      learned: toDate(data.learned),
      reviewDue: toDate(data.reviewDue),
      tags: Array.isArray(data.tags) ? data.tags : [],
      private: data.private === true,
      content,
      // Same text twice: lower case for matching, original case for snippets.
      searchPlain: `${data.title || ''} ${data.summary || ''} ${plainText(content)}`,
      searchText: `${data.title || ''} ${data.summary || ''} ${plainText(content)}`.toLowerCase(),
      parent,
    });
  }

  // Drop folders with no visible notes and no _folder.md, then sort
  // every level.
  function prune(folder) {
    folder.children = folder.children.filter((child) => child.type === 'note' || prune(child));
    folder.children.sort(compareItems);
    return folder.children.length > 0 || folder.hasPage;
  }
  prune(root);

  return root;
}

const root = buildTree();

const notesInOrder = [];
const byPath = new Map();
(function index(folder) {
  byPath.set(folder.path, folder);
  for (const child of folder.children) {
    if (child.type === 'folder') index(child);
    else {
      byPath.set(child.path, child);
      notesInOrder.push(child);
    }
  }
})(root);

export function getNotesRoot() {
  return root;
}

export function getAllNotes() {
  return notesInOrder;
}

// `path` is the URL part after /notes/, e.g. "fft-signal-processing".
export function getNoteItem(path) {
  return byPath.get(path.replace(/^\/+|\/+$/g, '')) || null;
}

// Root first, ending with the item itself.
export function getAncestors(item) {
  const chain = [];
  for (let node = item; node; node = node.parent) chain.unshift(node);
  return chain;
}

export function getAdjacentNotes(note) {
  const i = notesInOrder.indexOf(note);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? notesInOrder[i - 1] : null,
    next: i < notesInOrder.length - 1 ? notesInOrder[i + 1] : null,
  };
}

// Local date as YYYY-MM-DD (not toISOString, which is UTC).
export function todayString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getDueNotes(today = todayString()) {
  return notesInOrder
    .filter((n) => n.reviewDue && n.reviewDue <= today)
    .sort((a, b) => (a.reviewDue === b.reviewDue ? notesInOrder.indexOf(a) - notesInOrder.indexOf(b) : a.reviewDue < b.reviewDue ? -1 : 1));
}

// Raw text of every ```check fence in a note body, in order.
export function extractCheckBlocks(markdown) {
  const blocks = [];
  const re = /^(\s*)(`{3,}|~{3,})check[ \t]*\r?\n([\s\S]*?)\r?\n\1\2[ \t]*$/gm;
  let match;
  while ((match = re.exec(markdown)) !== null) blocks.push(match[3]);
  return blocks;
}

// Every term must appear in the title or text. Returns up to `limit`
// notes with a short snippet around the first match.
export function searchNotes(query, limit = 30) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const results = [];
  for (const note of notesInOrder) {
    if (!terms.every((t) => note.searchText.includes(t))) continue;
    const at = note.searchText.indexOf(terms[0]);
    const start = Math.max(0, at - 40);
    const snippet =
      (start > 0 ? '…' : '') +
      note.searchPlain.slice(start, at + 80).trim() +
      (at + 80 < note.searchPlain.length ? '…' : '');
    results.push({ note, snippet, titleMatch: terms.every((t) => note.title.toLowerCase().includes(t)) });
  }
  results.sort((a, b) => Number(b.titleMatch) - Number(a.titleMatch));
  return results.slice(0, limit);
}
