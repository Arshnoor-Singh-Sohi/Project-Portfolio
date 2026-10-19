import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITS,
  LabValidationError,
  applyMetaPatch,
  createId,
  isLabId,
  newMeta,
  normalizeContent,
  normalizeMetaInput,
  normalizeOutputs,
  normalizeTags,
  serializeContent,
  stripOutputs,
  toPublicLab,
} from '../../src/lib/labs/schema.js';

const code = (id, extra = {}) => ({ id, type: 'code', source: 'print(1)', ...extra });

test('createId makes URL-safe ids of the requested length', () => {
  const ids = new Set(Array.from({ length: 500 }, () => createId(12)));
  assert.equal(ids.size, 500);
  for (const id of ids) {
    assert.match(id, /^[A-Za-z0-9]{12}$/);
    assert.ok(isLabId(id));
  }
  assert.equal(isLabId('new'), false, '"new" is a route, never a lab id');
  assert.equal(isLabId('../etc'), false);
});

test('normalizeContent keeps known fields only and checks structure', () => {
  const out = normalizeContent({
    cells: [
      { id: 'a', type: 'markdown', source: '# Hi', outputs: [{ type: 'stream', text: 'x' }], junk: 1 },
      code('b', { language: 'cobol', outputs: [{ type: 'stream', name: 'stdout', text: 'hi' }, { type: 'nope' }], execution: { status: 'ok', count: 3, durationMs: 12.6 } }),
    ],
  });
  assert.deepEqual(out.cells[0], { id: 'a', type: 'markdown', source: '# Hi' });
  assert.equal(out.cells[1].language, 'python', 'unknown languages fall back to the default runtime');
  assert.deepEqual(out.cells[1].outputs, [{ type: 'stream', name: 'stdout', text: 'hi' }]);
  assert.deepEqual(out.cells[1].execution, { status: 'ok', count: 3, durationMs: 13 });
  assert.throws(() => normalizeContent({ cells: [code('a'), code('a')] }), LabValidationError);
  assert.throws(() => normalizeContent({ cells: [{ id: 'bad id!', type: 'code' }] }), /invalid id/);
  assert.throws(() => normalizeContent({ cells: [{ id: 'x', type: 'video' }] }), /unknown type/);
  assert.throws(() => normalizeContent({ cells: 'nope' }), LabValidationError);
  assert.throws(() => normalizeContent({ cells: Array.from({ length: LIMITS.cellsMax + 1 }, (_, i) => code(`c${i}`)) }), /at most/);
});

test('long output is shortened, not refused', () => {
  const [item] = normalizeOutputs([{ type: 'stream', name: 'stdout', text: 'x'.repeat(LIMITS.streamTextMax + 50) }]);
  assert.ok(item.text.length < LIMITS.streamTextMax + 200);
  assert.match(item.text, /output shortened: 50 more characters/);
});

test('neighbouring stream chunks merge; extra images are dropped with a note', () => {
  const imgs = Array.from({ length: LIMITS.imagesPerCellMax + 2 }, () => ({ type: 'image', mime: 'image/png', data: 'AAAA' }));
  const out = normalizeOutputs([{ type: 'stream', name: 'stdout', text: 'a' }, { type: 'stream', name: 'stdout', text: 'b' }, ...imgs]);
  assert.deepEqual(out[0], { type: 'stream', name: 'stdout', text: 'ab' });
  assert.equal(out.filter((o) => o.type === 'image').length, LIMITS.imagesPerCellMax);
  assert.match(out[out.length - 1].text, /2 more image/);
  const [big] = normalizeOutputs([{ type: 'image', mime: 'image/png', data: 'A'.repeat(LIMITS.imageDataMax + 4) }]);
  assert.equal(big.type, 'info');
  assert.deepEqual(normalizeOutputs([{ type: 'image', mime: 'text/html', data: 'AAAA' }]), [], 'only image MIME types');
  assert.deepEqual(normalizeOutputs([{ type: 'image', mime: 'image/png', data: '<script>' }]), [], 'base64 only');
});

test('stripOutputs removes outputs, execution and pins', () => {
  const out = stripOutputs({ cells: [code('a', { outputs: [{ type: 'result', text: '1' }], execution: { status: 'ok' }, pins: [{ id: 'p1', outputs: [] }] })] });
  assert.deepEqual(out.cells[0], { id: 'a', type: 'code', source: 'print(1)', language: 'python', outputs: [] });
});

test('serializeContent refuses content over the size limit with status 413', () => {
  const huge = { schemaVersion: 1, cells: Array.from({ length: 20 }, (_, i) => ({ id: `c${i}`, type: 'markdown', source: 'x'.repeat(190_000) })) };
  try {
    serializeContent(huge);
    assert.fail('should throw');
  } catch (err) {
    assert.ok(err instanceof LabValidationError);
    assert.equal(err.status, 413);
  }
});

test('metadata validation', () => {
  assert.throws(() => normalizeMetaInput({ title: '   ' }), /title is required/);
  assert.throws(() => normalizeMetaInput({ title: 'x'.repeat(LIMITS.titleMax + 1) }), /longer than/);
  assert.throws(() => normalizeMetaInput({ title: 'ok', status: 'finished' }), /status/);
  assert.throws(() => normalizeMetaInput({ title: 'ok', sourceNote: '../secret' }), /sourceNote/);
  assert.throws(() => normalizeMetaInput({ title: 'ok', packages: ['numpy; rm -rf'] }), /package/);
  const m = normalizeMetaInput({ title: ' FFT ', tags: 'Signal Processing, FFT, fft', settings: { timeoutSeconds: 99999 } });
  assert.equal(m.title, 'FFT');
  assert.deepEqual(m.tags, ['signal-processing', 'fft']);
  assert.equal(m.settings.timeoutSeconds, LIMITS.timeoutMaxSeconds);
  assert.equal(m.status, 'not-started');
  assert.equal(m.runtime, 'python');
  const patch = normalizeMetaInput({ archived: true }, { partial: true });
  assert.deepEqual(patch, { archived: true });
});

test('normalizeTags', () => {
  assert.deepEqual(normalizeTags(['  A B ', 'c++', 'c#', 'x/y']), ['a-b', 'c++', 'c#', 'xy']);
  assert.throws(() => normalizeTags(Array.from({ length: 13 }, (_, i) => `t${i}`)), /at most/);
});

test('applyMetaPatch keeps objectivesDone in range', () => {
  const meta = newMeta({ id: 'abcdefgh', input: { title: 'L', objectives: ['a', 'b'] }, now: '2026-10-18T00:00:00.000Z' });
  const next = applyMetaPatch(meta, { objectivesDone: [1, 5, 1, -2] }, '2026-10-18T01:00:00.000Z');
  assert.deepEqual(next.objectivesDone, [1]);
  assert.equal(next.metaUpdatedAt, '2026-10-18T01:00:00.000Z');
  const fewer = applyMetaPatch(next, { objectives: ['only one'] }, '2026-10-18T02:00:00.000Z');
  assert.deepEqual(fewer.objectivesDone, []);
});

test('toPublicLab merges metadata and stats, updatedAt is the latest change', () => {
  const meta = newMeta({ id: 'abcdefgh', input: { title: 'L' }, now: '2026-10-18T00:00:00.000Z' });
  const lab = toPublicLab({ ...meta, metaUpdatedAt: '2026-10-18T05:00:00.000Z' }, { updatedAt: '2026-10-18T03:00:00.000Z', revision: 4, cellCount: 2 }, null);
  assert.equal(lab.updatedAt, '2026-10-18T05:00:00.000Z');
  assert.equal(lab.revision, 4);
  assert.equal(lab.cellCount, 2);
  assert.equal(lab.settings.timeoutSeconds, LIMITS.timeoutDefaultSeconds);
});
