// src/lib/labs/params.js
// ============================================================
// Parameter controls for code cells, written as a comment on an
// assignment line (the same syntax as Google Colab forms):
//
//   freq = 5          # @param {type:"slider", min:1, max:50, step:1}
//   window = "hann"   # @param ["hann", "hamming", "none"]
//   show_grid = True  # @param {type:"boolean"}
//   n = 64            # @param {type:"integer"}
//   rate = 0.01       # @param {type:"number"}
//   label = "signal"  # @param {type:"string"}
//   gain = 2.5        # @param                 (type from the value)
//
// The page shows a control for each line. Moving the control writes
// the new literal back into the code, so the code is always the one
// source of truth: copy the cell anywhere and it still runs.
// Optional extra key: label:"Shown name".
// ============================================================

const LINE_RE = /^(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*)(.*?)(\s*)(#\s*@param\b(.*))$/;
const NUMBER_RE = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

export const PARAM_TYPES = ['slider', 'number', 'integer', 'boolean', 'string', 'select'];

// Lenient JSON: unquoted keys and single-quoted strings are allowed.
function parseLooseJson(text) {
  const t = text.trim();
  if (!t) return undefined;
  const json = t
    .replace(/'((?:[^'\\]|\\.)*)'/g, (_, s) => JSON.stringify(s.replace(/\\'/g, "'")))
    .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false');
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

function parsePythonString(text) {
  const quote = text[0];
  if ((quote !== '"' && quote !== "'") || text[text.length - 1] !== quote || text.length < 2) return undefined;
  const body = text.slice(1, -1);
  let out = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '\\' && i + 1 < body.length) {
      const next = body[++i];
      out += next === 'n' ? '\n' : next === 't' ? '\t' : next;
    } else if (ch === quote) {
      return undefined; // a second string or an expression, not one literal
    } else {
      out += ch;
    }
  }
  return out;
}

// Returns { kind, value } for a Python literal, or null for any
// other expression (such controls are not shown).
export function parsePythonLiteral(text) {
  const t = text.trim();
  if (t === 'True') return { kind: 'boolean', value: true };
  if (t === 'False') return { kind: 'boolean', value: false };
  if (NUMBER_RE.test(t)) {
    const value = Number(t);
    if (!Number.isFinite(value)) return null;
    const isInt = /^[-+]?\d+$/.test(t);
    return { kind: isInt ? 'integer' : 'number', value };
  }
  const s = parsePythonString(t);
  if (s !== undefined) return { kind: 'string', value: s };
  return null;
}

function decimalsOf(n) {
  if (!Number.isFinite(n)) return 0;
  const s = String(n);
  if (s.includes('e-')) return Number(s.split('e-')[1]);
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

export function formatPythonString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`;
}

// Formats a JS value as the Python literal for this control.
export function formatPythonValue(param, value) {
  switch (param.type) {
    case 'boolean':
      return value ? 'True' : 'False';
    case 'string':
      return formatPythonString(value);
    case 'select':
      return typeof value === 'number' ? String(value) : typeof value === 'boolean' ? (value ? 'True' : 'False') : formatPythonString(value);
    case 'integer':
      return String(Math.round(Number(value)));
    case 'slider':
    case 'number': {
      const n = Number(value);
      if (!Number.isFinite(n)) return param.raw;
      if (param.integer) return String(Math.round(n));
      // A slider moves in steps, so round away floating-point noise
      // (0.1 + 0.2). A typed number keeps the precision as typed.
      const rounded =
        param.type === 'slider' ? Number(n.toFixed(Math.min(10, Math.max(decimalsOf(param.step), decimalsOf(param.min))))) : n;
      let text = String(rounded);
      if (!/[.eE]/.test(text)) text += '.0';
      return text;
    }
    default:
      return param.raw;
  }
}

function toNumberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// One control for each "# @param" line that assigns a literal.
export function parseParams(source) {
  if (typeof source !== 'string' || !source.includes('@param')) return [];
  const params = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = LINE_RE.exec(lines[i]);
    if (!m) continue;
    const [, , name, , rawValue, , , specText] = m;
    const literal = parsePythonLiteral(rawValue);
    if (!literal) continue;
    const spec = parseLooseJson(specText);
    const param = { line: i, name, raw: rawValue.trim(), value: literal.value, label: name };

    if (Array.isArray(spec)) {
      const options = spec.filter((o) => ['string', 'number', 'boolean'].includes(typeof o));
      if (!options.length) continue;
      param.type = 'select';
      param.options = options;
    } else {
      const s = spec && typeof spec === 'object' ? spec : {};
      if (typeof s.label === 'string' && s.label.trim()) param.label = s.label.trim().slice(0, 80);
      const declared = PARAM_TYPES.includes(s.type) ? s.type : null;
      if (declared === 'slider' && (literal.kind === 'number' || literal.kind === 'integer')) {
        param.type = 'slider';
        param.min = toNumberOr(s.min, Math.min(0, literal.value));
        param.max = toNumberOr(s.max, Math.max(1, literal.value * 2));
        if (param.max <= param.min) param.max = param.min + 1;
        param.step = toNumberOr(s.step, literal.kind === 'integer' ? 1 : (param.max - param.min) / 100);
        if (param.step <= 0) param.step = 1;
        param.integer = Number.isInteger(param.step) && Number.isInteger(param.min) && literal.kind === 'integer';
      } else if (declared === 'boolean' || (!declared && literal.kind === 'boolean')) {
        if (literal.kind !== 'boolean') continue;
        param.type = 'boolean';
      } else if (declared === 'string' || (!declared && literal.kind === 'string')) {
        if (literal.kind !== 'string') continue;
        param.type = 'string';
      } else if (literal.kind === 'number' || literal.kind === 'integer') {
        param.type = declared === 'integer' || (!declared && literal.kind === 'integer') ? 'integer' : 'number';
        param.integer = param.type === 'integer';
        if (Number.isFinite(Number(s.min))) param.min = Number(s.min);
        if (Number.isFinite(Number(s.max))) param.max = Number(s.max);
        if (Number.isFinite(Number(s.step)) && Number(s.step) > 0) param.step = Number(s.step);
      } else {
        continue;
      }
    }
    params.push(param);
  }
  return params;
}

// Returns the source with the literal of `param` replaced by `value`.
// The rest of the line (spacing, the comment) stays as it was.
export function updateParamInSource(source, param, value) {
  const lines = source.split('\n');
  const line = lines[param.line];
  const m = line === undefined ? null : LINE_RE.exec(line);
  if (!m || m[2] !== param.name) return source;
  const [, indent, name, eq, , gap, comment] = m;
  const literal = formatPythonValue(param, value);
  lines[param.line] = `${indent}${name}${eq}${literal}${gap || '  '}${comment}`;
  return lines.join('\n');
}

// "freq=5, window=hann" — used as the default label of a pinned result.
export function describeParams(params) {
  return params
    .map((p) => `${p.name}=${typeof p.value === 'string' ? p.value : p.type === 'boolean' ? (p.value ? 'True' : 'False') : p.value}`)
    .join(', ');
}
