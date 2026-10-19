// src/lib/labs/schema.js
// ============================================================
// The shape of a lab, and the rules that keep it valid. Pure
// JavaScript with no browser-only or Node-only APIs, so the page
// (src/labs/) and the API (api/_lib/labs/) use the same rules.
//
//   Lab metadata  : title, description, tags, collection, status,
//                   objectives, settings ... (see normalizeMeta)
//   Lab content   : { schemaVersion, cells: Cell[] }
//   Cell          : { id, type: 'markdown' | 'code', source,
//                     outputs?, execution?, pins? }
//   Output item   : see OUTPUT_TYPES and normalizeOutput
//
// Normalizers return a clean copy that holds only known fields.
// They shorten text that is too long (and say so in the text), and
// they throw LabValidationError for input that cannot be repaired.
// The page runs the same normalizer before it saves, so the API
// normally receives content that is already valid.
// ============================================================

export const SCHEMA_VERSION = 1;

export const LIMITS = Object.freeze({
  titleMax: 120,
  descriptionMax: 600,
  tagsMax: 12,
  tagMax: 32,
  collectionMax: 60,
  objectivesMax: 12,
  objectiveMax: 240,
  packagesMax: 20,
  sourceNoteMax: 300,
  cellsMax: 300,
  sourceMax: 200_000,
  outputsPerCellMax: 60,
  streamTextMax: 20_000,
  resultTextMax: 20_000,
  htmlMax: 200_000,
  imageDataMax: 1_500_000, // base64 characters
  imagesPerCellMax: 8,
  pinsPerCellMax: 3,
  pinLabelMax: 120,
  contentBytesMax: 3_500_000, // UTF-8 bytes of the JSON body
  versionLabelMax: 120,
  versionsMax: 30,
  timeoutMinSeconds: 10,
  timeoutMaxSeconds: 1800,
  timeoutDefaultSeconds: 120,
});

export const RUNTIME_IDS = ['python'];
export const DEFAULT_RUNTIME = 'python';
export const LAB_STATUSES = ['not-started', 'in-progress', 'done'];
export const CELL_TYPES = ['markdown', 'code'];
export const OUTPUT_TYPES = ['stream', 'result', 'html', 'image', 'error', 'check', 'inspect', 'info'];
export const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/svg+xml'];
export const VERSION_REASONS = ['manual', 'before-restore', 'before-reset', 'before-import', 'before-conflict'];

const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const LAB_ID_RE = /^[A-Za-z0-9_-]{6,40}$/;
const NOTE_PATH_RE = /^[a-z0-9][a-z0-9/_.-]*$/i;
const PACKAGE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export class LabValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'LabValidationError';
    this.field = field;
  }
}

function fail(message, field) {
  throw new LabValidationError(message, field);
}

// ---------- ids ----------

const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Random URL-safe id. globalThis.crypto exists in browsers and in
// Node 19+ (the API runs on Node 20 or later).
export function createId(length = 12) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let id = '';
  // 248 = 62 * 4, so the modulo below has no bias.
  for (let i = 0; id.length < length; i++) {
    if (i >= bytes.length) {
      globalThis.crypto.getRandomValues(bytes);
      i = 0;
    }
    if (bytes[i] < 248) id += ID_ALPHABET[bytes[i] % 62];
  }
  return id;
}

export function isLabId(value) {
  return typeof value === 'string' && LAB_ID_RE.test(value);
}

export function isCellId(value) {
  return typeof value === 'string' && ID_RE.test(value);
}

// ---------- small helpers ----------

export function byteLength(text) {
  return new TextEncoder().encode(text).length;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function str(value, field, max, { required = false, trim = true } = {}) {
  if (value === undefined || value === null) {
    if (required) fail(`${field} is required.`, field);
    return '';
  }
  if (typeof value !== 'string') fail(`${field} must be text.`, field);
  const text = trim ? value.trim() : value;
  if (required && !text) fail(`${field} is required.`, field);
  if (text.length > max) fail(`${field} is longer than ${max} characters.`, field);
  return text;
}

// Long output text is cut, not refused: a print loop must not stop
// the save of the code that produced it.
function clip(text, max) {
  if (typeof text !== 'string') return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n… [output shortened: ${text.length - max} more characters not saved]`;
}

function bool(value) {
  return value === true;
}

function isoOrNull(value) {
  return typeof value === 'string' && ISO_RE.test(value) ? value : null;
}

export function normalizeTag(tag) {
  return String(tag)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._+#-]/g, '')
    .slice(0, LIMITS.tagMax);
}

export function normalizeTags(value) {
  if (value === undefined || value === null) return [];
  const list = typeof value === 'string' ? value.split(',') : value;
  if (!Array.isArray(list)) fail('tags must be a list.', 'tags');
  const out = [];
  for (const raw of list) {
    if (typeof raw !== 'string') continue;
    const tag = normalizeTag(raw);
    if (tag && !out.includes(tag)) out.push(tag);
  }
  if (out.length > LIMITS.tagsMax) fail(`Use at most ${LIMITS.tagsMax} tags.`, 'tags');
  return out;
}

function normalizeObjectives(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail('objectives must be a list.', 'objectives');
  const out = value
    .filter((v) => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);
  if (out.length > LIMITS.objectivesMax) fail(`Use at most ${LIMITS.objectivesMax} objectives.`, 'objectives');
  for (const o of out) {
    if (o.length > LIMITS.objectiveMax) fail(`An objective is longer than ${LIMITS.objectiveMax} characters.`, 'objectives');
  }
  return out;
}

function normalizeObjectivesDone(value, count) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const v of value) {
    if (Number.isInteger(v) && v >= 0 && v < count && !out.includes(v)) out.push(v);
  }
  return out.sort((a, b) => a - b);
}

function normalizePackages(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail('packages must be a list.', 'packages');
  const out = [];
  for (const p of value) {
    if (typeof p !== 'string' || !PACKAGE_RE.test(p.trim())) fail(`"${p}" is not a valid package name.`, 'packages');
    if (!out.includes(p.trim())) out.push(p.trim());
  }
  if (out.length > LIMITS.packagesMax) fail(`Use at most ${LIMITS.packagesMax} packages.`, 'packages');
  return out;
}

function normalizeSourceNote(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > LIMITS.sourceNoteMax || !NOTE_PATH_RE.test(value) || value.includes('..')) {
    fail('sourceNote must be a notes path such as "maths/fft-signal-processing/l1".', 'sourceNote');
  }
  return value;
}

export function normalizeSettings(value) {
  const input = isPlainObject(value) ? value : {};
  let timeout = Number(input.timeoutSeconds);
  if (!Number.isFinite(timeout)) timeout = LIMITS.timeoutDefaultSeconds;
  timeout = Math.round(Math.min(LIMITS.timeoutMaxSeconds, Math.max(LIMITS.timeoutMinSeconds, timeout)));
  return {
    timeoutSeconds: timeout,
    // Re-run a cell when one of its # @param controls changes.
    autoRunParams: input.autoRunParams !== false,
  };
}

// ---------- outputs ----------

export function normalizeOutput(item) {
  if (!isPlainObject(item) || !OUTPUT_TYPES.includes(item.type)) return null;
  switch (item.type) {
    case 'stream':
      return { type: 'stream', name: item.name === 'stderr' ? 'stderr' : 'stdout', text: clip(item.text, LIMITS.streamTextMax) };
    case 'result':
      return { type: 'result', text: clip(item.text, LIMITS.resultTextMax) };
    case 'html': {
      const html = typeof item.html === 'string' ? item.html : '';
      if (html.length > LIMITS.htmlMax) {
        return { type: 'result', text: clip(typeof item.text === 'string' ? item.text : '', LIMITS.resultTextMax) };
      }
      return { type: 'html', html, text: clip(typeof item.text === 'string' ? item.text : '', LIMITS.resultTextMax) };
    }
    case 'image': {
      const mime = IMAGE_MIMES.includes(item.mime) ? item.mime : null;
      const data = typeof item.data === 'string' ? item.data : '';
      if (!mime || !/^[A-Za-z0-9+/=\s]*$/.test(data)) return null;
      if (data.length > LIMITS.imageDataMax) {
        return { type: 'info', text: 'An image was larger than 1.5 MB, so it was not saved. Run the cell again to see it.' };
      }
      const out = { type: 'image', mime, data };
      if (Number.isFinite(item.width) && item.width > 0) out.width = Math.round(item.width);
      if (Number.isFinite(item.height) && item.height > 0) out.height = Math.round(item.height);
      return out;
    }
    case 'error':
      return {
        type: 'error',
        ename: clip(typeof item.ename === 'string' ? item.ename : 'Error', 200),
        evalue: clip(typeof item.evalue === 'string' ? item.evalue : '', 4000),
        traceback: clip(typeof item.traceback === 'string' ? item.traceback : '', LIMITS.streamTextMax),
      };
    case 'check':
      return {
        type: 'check',
        name: clip(typeof item.name === 'string' ? item.name : 'check', 200),
        passed: item.passed === true,
        expected: clip(typeof item.expected === 'string' ? item.expected : '', 4000),
        actual: clip(typeof item.actual === 'string' ? item.actual : '', 4000),
        detail: clip(typeof item.detail === 'string' ? item.detail : '', 2000),
      };
    case 'inspect': {
      const rows = Array.isArray(item.rows) ? item.rows.slice(0, 40) : [];
      return {
        type: 'inspect',
        name: clip(typeof item.name === 'string' ? item.name : '', 200),
        rows: rows
          .filter((r) => Array.isArray(r) && r.length === 2)
          .map(([k, v]) => [clip(String(k), 100), clip(String(v), 4000)]),
      };
    }
    case 'info':
      return { type: 'info', text: clip(item.text, 2000) };
    default:
      return null;
  }
}

export function normalizeOutputs(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  let images = 0;
  let dropped = 0;
  for (const raw of list) {
    const item = normalizeOutput(raw);
    if (!item) continue;
    if (item.type === 'image') {
      images += 1;
      if (images > LIMITS.imagesPerCellMax) {
        dropped += 1;
        continue;
      }
    }
    // Merge neighbouring stream chunks of the same name.
    const last = out[out.length - 1];
    if (item.type === 'stream' && last && last.type === 'stream' && last.name === item.name) {
      last.text = clip(last.text + item.text, LIMITS.streamTextMax);
      continue;
    }
    out.push(item);
  }
  if (dropped) out.push({ type: 'info', text: `${dropped} more image(s) were not saved. A cell saves at most ${LIMITS.imagesPerCellMax}.` });
  if (out.length > LIMITS.outputsPerCellMax) {
    const extra = out.length - LIMITS.outputsPerCellMax;
    out.length = LIMITS.outputsPerCellMax;
    out.push({ type: 'info', text: `${extra} more output item(s) were not saved.` });
  }
  return out;
}

function normalizeExecution(value) {
  if (!isPlainObject(value)) return null;
  const status = ['ok', 'error', 'interrupted'].includes(value.status) ? value.status : 'ok';
  const out = { status };
  if (Number.isInteger(value.count) && value.count >= 0) out.count = value.count;
  if (Number.isFinite(value.durationMs) && value.durationMs >= 0) out.durationMs = Math.round(value.durationMs);
  const finishedAt = isoOrNull(value.finishedAt);
  if (finishedAt) out.finishedAt = finishedAt;
  return out;
}

function normalizePins(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const pin of value.slice(0, LIMITS.pinsPerCellMax)) {
    if (!isPlainObject(pin) || !isCellId(pin.id)) continue;
    out.push({
      id: pin.id,
      label: clip(typeof pin.label === 'string' ? pin.label : 'Pinned result', LIMITS.pinLabelMax),
      createdAt: isoOrNull(pin.createdAt) || new Date(0).toISOString(),
      outputs: normalizeOutputs(pin.outputs),
    });
  }
  return out;
}

// ---------- cells and content ----------

export function normalizeCell(cell, { keepOutputs = true } = {}) {
  if (!isPlainObject(cell)) fail('Each cell must be an object.', 'cells');
  if (!isCellId(cell.id)) fail('A cell has a missing or invalid id.', 'cells');
  if (!CELL_TYPES.includes(cell.type)) fail(`Cell ${cell.id} has an unknown type.`, 'cells');
  const source = typeof cell.source === 'string' ? cell.source : '';
  if (source.length > LIMITS.sourceMax) fail(`Cell ${cell.id} is longer than ${LIMITS.sourceMax} characters.`, 'cells');
  const out = { id: cell.id, type: cell.type, source };
  if (cell.type === 'code') {
    out.language = RUNTIME_IDS.includes(cell.language) ? cell.language : DEFAULT_RUNTIME;
    if (keepOutputs) {
      out.outputs = normalizeOutputs(cell.outputs);
      const execution = normalizeExecution(cell.execution);
      if (execution) out.execution = execution;
      const pins = normalizePins(cell.pins);
      if (pins.length) out.pins = pins;
    } else {
      out.outputs = [];
    }
  }
  if (cell.collapsed === true) out.collapsed = true;
  return out;
}

export function normalizeContent(content, { keepOutputs = true } = {}) {
  if (!isPlainObject(content)) fail('content must be an object.', 'content');
  if (!Array.isArray(content.cells)) fail('content.cells must be a list.', 'content');
  if (content.cells.length > LIMITS.cellsMax) fail(`A lab can have at most ${LIMITS.cellsMax} cells.`, 'content');
  const seen = new Set();
  const cells = content.cells.map((c) => {
    const cell = normalizeCell(c, { keepOutputs });
    if (seen.has(cell.id)) fail(`Two cells have the same id (${cell.id}).`, 'content');
    seen.add(cell.id);
    return cell;
  });
  return { schemaVersion: SCHEMA_VERSION, cells };
}

export function stripOutputs(content) {
  return normalizeContent(content, { keepOutputs: false });
}

// Throws when the JSON form is too large to store. Returns the JSON.
export function serializeContent(content) {
  const json = JSON.stringify(content);
  const bytes = byteLength(json);
  if (bytes > LIMITS.contentBytesMax) {
    const mb = (bytes / 1_000_000).toFixed(1);
    const err = new LabValidationError(
      `This lab is ${mb} MB, and the limit is ${LIMITS.contentBytesMax / 1_000_000} MB. Clear large outputs (images, long prints) and try again.`,
      'content',
    );
    err.status = 413;
    throw err;
  }
  return json;
}

export function contentStats(content) {
  const cells = content.cells || [];
  return {
    cellCount: cells.length,
    codeCellCount: cells.filter((c) => c.type === 'code').length,
  };
}

// ---------- metadata ----------

// Fields the owner can change with PATCH.
export const EDITABLE_META_FIELDS = [
  'title',
  'description',
  'tags',
  'collection',
  'status',
  'archived',
  'sourceNote',
  'objectives',
  'objectivesDone',
  'packages',
  'settings',
];

// Validates a full metadata record (create) or a patch (update).
export function normalizeMetaInput(input, { partial = false } = {}) {
  if (!isPlainObject(input)) fail('The request body must be a JSON object.');
  const out = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(input, k);

  if (!partial || has('title')) out.title = str(input.title, 'title', LIMITS.titleMax, { required: true });
  if (!partial || has('description')) out.description = str(input.description, 'description', LIMITS.descriptionMax);
  if (!partial || has('tags')) out.tags = normalizeTags(input.tags);
  if (!partial || has('collection')) out.collection = str(input.collection, 'collection', LIMITS.collectionMax);
  if (!partial || has('status')) {
    if (input.status !== undefined && !LAB_STATUSES.includes(input.status)) fail('status is not valid.', 'status');
    out.status = input.status || 'not-started';
  }
  if (!partial || has('archived')) out.archived = bool(input.archived);
  if (!partial || has('sourceNote')) out.sourceNote = normalizeSourceNote(input.sourceNote);
  if (!partial || has('objectives')) out.objectives = normalizeObjectives(input.objectives);
  if (has('objectivesDone')) out.objectivesDone = Array.isArray(input.objectivesDone) ? input.objectivesDone : [];
  else if (!partial) out.objectivesDone = [];
  if (!partial || has('packages')) out.packages = normalizePackages(input.packages);
  if (!partial || has('settings')) out.settings = normalizeSettings(input.settings);

  if (!partial) {
    out.runtime = RUNTIME_IDS.includes(input.runtime) ? input.runtime : DEFAULT_RUNTIME;
    out.template = typeof input.template === 'string' && ID_RE.test(input.template) ? input.template : null;
  }
  return out;
}

// Applies a validated patch to stored metadata and returns the result.
export function applyMetaPatch(meta, patch, now) {
  const next = { ...meta, ...patch, metaUpdatedAt: now };
  if (patch.settings) next.settings = normalizeSettings({ ...meta.settings, ...patch.settings });
  next.objectivesDone = normalizeObjectivesDone(next.objectivesDone, (next.objectives || []).length);
  return next;
}

export function newMeta({ id, input, now }) {
  const meta = normalizeMetaInput(input);
  return {
    id,
    schemaVersion: SCHEMA_VERSION,
    ...meta,
    objectivesDone: normalizeObjectivesDone(meta.objectivesDone, meta.objectives.length),
    createdAt: now,
    metaUpdatedAt: now,
  };
}

// The record the API returns for a lab: metadata plus save statistics.
export function toPublicLab(meta, stats, openedAt) {
  const s = stats || {};
  const updatedAt = [s.updatedAt, meta.metaUpdatedAt, meta.createdAt].filter(Boolean).sort().pop() || null;
  return {
    ...meta,
    settings: normalizeSettings(meta.settings),
    revision: Number.isInteger(s.revision) ? s.revision : 0,
    cellCount: s.cellCount || 0,
    codeCellCount: s.codeCellCount || 0,
    lastCellId: s.lastCellId || null,
    bytes: s.bytes || 0,
    contentUpdatedAt: s.updatedAt || meta.createdAt,
    updatedAt,
    openedAt: openedAt || null,
  };
}

export function normalizeVersionLabel(value) {
  return str(value, 'label', LIMITS.versionLabelMax) || 'Saved version';
}
