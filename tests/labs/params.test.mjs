import test from 'node:test';
import assert from 'node:assert/strict';
import { parseParams, updateParamInSource, formatPythonValue, parsePythonLiteral, describeParams } from '../../src/lib/labs/params.js';

const SOURCE = [
  'import numpy as np',
  'freq = 5  # @param {type:"slider", min:1, max:50, step:1}',
  'window = "hann"   # @param ["hann", "hamming", "none"]',
  'show_grid = True  #@param {type:"boolean"}',
  'n = 64  # @param {type:"integer"}',
  'rate = 0.01  # @param {type:"number"}',
  "label = 'sig nal'  # @param {type:'string', label:'Plot label'}",
  'gain = 2.5  # @param',
  'phase = np.pi  # @param {type:"number"}',
  'x == 5  # @param',
  '    amp = 0.5  # @param {type:"slider", min:0, max:1, step:0.05}',
].join('\n');

test('parses every supported control', () => {
  const params = parseParams(SOURCE);
  const byName = Object.fromEntries(params.map((p) => [p.name, p]));
  assert.deepEqual(Object.keys(byName), ['freq', 'window', 'show_grid', 'n', 'rate', 'label', 'gain', 'amp']);
  assert.deepEqual([byName.freq.type, byName.freq.min, byName.freq.max, byName.freq.step, byName.freq.integer, byName.freq.value], ['slider', 1, 50, 1, true, 5]);
  assert.deepEqual(byName.window.options, ['hann', 'hamming', 'none']);
  assert.equal(byName.window.value, 'hann');
  assert.equal(byName.show_grid.type, 'boolean');
  assert.equal(byName.n.type, 'integer');
  assert.equal(byName.rate.type, 'number');
  assert.equal(byName.label.value, 'sig nal');
  assert.equal(byName.label.label, 'Plot label');
  assert.equal(byName.gain.type, 'number', 'type comes from the value');
  assert.equal(byName.amp.line, 10);
  assert.equal(byName.amp.integer, false);
});

test('expressions and comparisons are not controls', () => {
  assert.equal(parseParams('phase = np.pi  # @param').length, 0);
  assert.equal(parseParams('x == 5  # @param').length, 0);
  assert.equal(parseParams('x += 5  # @param').length, 0);
  assert.equal(parseParams('no params here').length, 0);
});

test('updates rewrite only the literal and keep the comment', () => {
  const params = parseParams(SOURCE);
  const p = (name) => params.find((q) => q.name === name);
  let src = updateParamInSource(SOURCE, p('freq'), 12);
  assert.match(src, /^freq = 12  # @param \{type:"slider", min:1, max:50, step:1\}$/m);
  src = updateParamInSource(src, p('window'), 'none');
  assert.match(src, /^window = "none"   # @param \["hann", "hamming", "none"\]$/m);
  src = updateParamInSource(src, p('show_grid'), false);
  assert.match(src, /^show_grid = False  #@param/m);
  src = updateParamInSource(src, p('amp'), 0.1 + 0.2);
  assert.match(src, /^ {4}amp = 0\.3  # @param/m, 'slider values are rounded to the step');
  src = updateParamInSource(src, p('label'), 'say "hi"\\');
  assert.match(src, /^label = "say \\"hi\\"\\\\"  # @param/m);
  // Parse again: the new values come back.
  const again = Object.fromEntries(parseParams(src).map((q) => [q.name, q.value]));
  assert.equal(again.freq, 12);
  assert.equal(again.window, 'none');
  assert.equal(again.show_grid, false);
  assert.equal(again.amp, 0.3);
  assert.equal(again.label, 'say "hi"\\');
});

test('a stale param (line changed) leaves the source alone', () => {
  const [p] = parseParams('a = 1  # @param');
  assert.equal(updateParamInSource('b = 1  # @param', p, 2), 'b = 1  # @param');
});

test('number formatting keeps Python types', () => {
  assert.equal(formatPythonValue({ type: 'number', raw: '1' }, 2), '2.0');
  assert.equal(formatPythonValue({ type: 'number', raw: '1' }, 0.001), '0.001');
  assert.equal(formatPythonValue({ type: 'integer', raw: '1' }, 2.6), '3');
  assert.equal(formatPythonValue({ type: 'select', raw: '1' }, 4), '4');
  assert.deepEqual(parsePythonLiteral('-1.5e-3'), { kind: 'number', value: -0.0015 });
  assert.equal(parsePythonLiteral('"a" + "b"'), null);
});

test('describeParams', () => {
  assert.equal(describeParams(parseParams('f = 5  # @param\nw = "hann"  # @param\nb = True  # @param')), 'f=5, w=hann, b=True');
});
