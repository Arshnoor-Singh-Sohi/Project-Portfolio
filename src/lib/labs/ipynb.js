// src/lib/labs/ipynb.js
// ============================================================
// Jupyter notebook (nbformat 4) import and export, so lab work can
// go to GitHub as a normal .ipynb file and old notebooks can come in.
// Pure functions: base64 helpers use atob/btoa, which exist in
// browsers and in Node 16+.
// ============================================================

// Terminal colour codes (ESC [ ... m) in Jupyter tracebacks.
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\u001b\[[0-9;]*[A-Za-z]/g;

function joinSource(source) {
  if (Array.isArray(source)) return source.join('');
  return typeof source === 'string' ? source : '';
}

function decodeBase64Utf8(b64) {
  const bin = atob(b64.replace(/\s+/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function outputFromJupyter(out) {
  if (!out || typeof out !== 'object') return [];
  switch (out.output_type) {
    case 'stream':
      return [{ type: 'stream', name: out.name === 'stderr' ? 'stderr' : 'stdout', text: joinSource(out.text) }];
    case 'error':
      return [
        {
          type: 'error',
          ename: String(out.ename || 'Error'),
          evalue: String(out.evalue || ''),
          traceback: (Array.isArray(out.traceback) ? out.traceback.join('\n') : '').replace(ANSI_RE, ''),
        },
      ];
    case 'execute_result':
    case 'display_data': {
      const data = out.data || {};
      if (data['image/png']) return [{ type: 'image', mime: 'image/png', data: joinSource(data['image/png']).replace(/\s+/g, '') }];
      if (data['image/jpeg']) return [{ type: 'image', mime: 'image/jpeg', data: joinSource(data['image/jpeg']).replace(/\s+/g, '') }];
      if (data['image/svg+xml']) return [{ type: 'image', mime: 'image/svg+xml', data: encodeBase64Utf8(joinSource(data['image/svg+xml'])) }];
      const text = joinSource(data['text/plain']);
      if (data['text/html']) return [{ type: 'html', html: joinSource(data['text/html']), text }];
      if (text) return [{ type: 'result', text }];
      return [];
    }
    default:
      return [];
  }
}

// Returns { title, cells } from a parsed notebook object. Cell ids
// are assigned by the caller.
export function notebookToCells(nb) {
  if (!nb || typeof nb !== 'object' || !Array.isArray(nb.cells)) {
    throw new Error('This file is not a Jupyter notebook (no "cells" list).');
  }
  if (Number(nb.nbformat) < 4) throw new Error('Only notebooks in format 4 or later can be imported.');
  const cells = [];
  for (const c of nb.cells) {
    const source = joinSource(c.source).replace(/\s+$/, '');
    if (c.cell_type === 'code') {
      cells.push({
        type: 'code',
        source,
        outputs: (Array.isArray(c.outputs) ? c.outputs : []).flatMap(outputFromJupyter),
        execution: Number.isInteger(c.execution_count) ? { status: 'ok', count: c.execution_count } : undefined,
      });
    } else if (source.trim()) {
      cells.push({ type: 'markdown', source });
    }
  }
  const meta = (nb.metadata && nb.metadata.lab) || {};
  let title = typeof meta.title === 'string' ? meta.title : '';
  if (!title) {
    const heading = cells.find((c) => c.type === 'markdown' && /^#\s+\S/m.test(c.source));
    if (heading) title = /^#\s+(.+)$/m.exec(heading.source)[1].trim();
  }
  return { title, description: typeof meta.description === 'string' ? meta.description : '', tags: Array.isArray(meta.tags) ? meta.tags : [], cells };
}

function splitLines(text) {
  // nbformat stores multi-line strings as a list of lines with "\n".
  const parts = text.split('\n');
  return parts.map((line, i) => (i < parts.length - 1 ? `${line}\n` : line)).filter((l) => l !== '');
}

function outputToJupyter(item, count) {
  switch (item.type) {
    case 'stream':
      return { output_type: 'stream', name: item.name, text: splitLines(item.text) };
    case 'result':
      return { output_type: 'execute_result', execution_count: count ?? null, data: { 'text/plain': splitLines(item.text) }, metadata: {} };
    case 'html':
      return {
        output_type: 'execute_result',
        execution_count: count ?? null,
        data: { 'text/html': splitLines(item.html), 'text/plain': splitLines(item.text || '') },
        metadata: {},
      };
    case 'image':
      if (item.mime === 'image/svg+xml') {
        return { output_type: 'display_data', data: { 'image/svg+xml': splitLines(decodeBase64Utf8(item.data)) }, metadata: {} };
      }
      return { output_type: 'display_data', data: { [item.mime]: item.data }, metadata: {} };
    case 'error':
      return { output_type: 'error', ename: item.ename, evalue: item.evalue, traceback: item.traceback.split('\n') };
    case 'check':
      return {
        output_type: 'display_data',
        data: { 'text/plain': [`${item.passed ? 'PASS' : 'FAIL'} ${item.name}: expected ${item.expected}, got ${item.actual}${item.detail ? ` (${item.detail})` : ''}`] },
        metadata: {},
      };
    case 'inspect':
      return {
        output_type: 'display_data',
        data: { 'text/plain': splitLines(`${item.name ? `${item.name}\n` : ''}${item.rows.map(([k, v]) => `${k}: ${v}`).join('\n')}`) },
        metadata: {},
      };
    case 'info':
      return { output_type: 'stream', name: 'stderr', text: splitLines(`${item.text}\n`) };
    default:
      return null;
  }
}

export function contentToNotebook(lab, content) {
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { name: 'python3', display_name: 'Python 3 (Pyodide)', language: 'python' },
      language_info: { name: 'python', version: '3.14' },
      lab: {
        title: lab.title || '',
        description: lab.description || '',
        tags: lab.tags || [],
        exportedAt: new Date().toISOString(),
      },
    },
    cells: content.cells.map((cell) => {
      if (cell.type === 'markdown') {
        return { id: cell.id, cell_type: 'markdown', metadata: {}, source: splitLines(cell.source) };
      }
      const count = cell.execution && Number.isInteger(cell.execution.count) ? cell.execution.count : null;
      return {
        id: cell.id,
        cell_type: 'code',
        metadata: {},
        execution_count: count,
        source: splitLines(cell.source),
        outputs: (cell.outputs || []).map((o) => outputToJupyter(o, count)).filter(Boolean),
      };
    }),
  };
}
