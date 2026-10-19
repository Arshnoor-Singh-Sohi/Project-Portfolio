import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parseLabMarkdown, labToMarkdown, parseCellsFromMarkdown, parseCellsFromPython, labToPython } from '../../src/lib/labs/lab-format.js';
import { notebookToCells, contentToNotebook } from '../../src/lib/labs/ipynb.js';
import { normalizeContent } from '../../src/lib/labs/schema.js';

const MD = `---
title: "FFT: explorer"
summary: "See the spectrum."
collection: "Maths"
tags: [fft, signals]
packages: [numpy, matplotlib]
objectives:
  - "Explain one bin."
  - Read a spectrum.
---
# Intro

Some **text**.

\`\`\`python
import numpy as np
x = np.zeros(8)
\`\`\`

More text with a non-python fence:

\`\`\`\`text
\`\`\`python
not_a_cell = 1
\`\`\`
\`\`\`\`

<!-- cell -->

## Observations

\`\`\`py
print("second")
\`\`\`
`;

test('Markdown lab format: frontmatter and cells', () => {
  const { data, cells } = parseLabMarkdown(MD);
  assert.equal(data.title, 'FFT: explorer');
  assert.deepEqual(data.tags, ['fft', 'signals']);
  assert.deepEqual(data.packages, ['numpy', 'matplotlib']);
  assert.deepEqual(data.objectives, ['Explain one bin.', 'Read a spectrum.']);
  assert.deepEqual(cells.map((c) => c.type), ['markdown', 'code', 'markdown', 'markdown', 'code']);
  assert.equal(cells[1].source, 'import numpy as np\nx = np.zeros(8)');
  assert.match(cells[2].source, /not_a_cell = 1/, 'a python fence inside another fence stays text');
  assert.equal(cells[3].source, '## Observations');
});

test('Markdown lab format round trip', () => {
  const { data, cells } = parseLabMarkdown(MD);
  const content = normalizeContent({ cells: cells.map((c, i) => ({ ...c, id: `c${i}` })) });
  const md = labToMarkdown({ title: data.title, description: data.summary, tags: data.tags, packages: data.packages, objectives: data.objectives, collection: data.collection }, content);
  const again = parseLabMarkdown(md);
  assert.equal(again.data.title, data.title);
  assert.deepEqual(again.data.objectives, data.objectives);
  assert.deepEqual(again.cells, cells);
});

test('code that contains a fence gets a longer fence on export', () => {
  const content = { cells: [{ id: 'a', type: 'code', source: 's = """\n```python\n"""' }] };
  const md = labToMarkdown({ title: 'x' }, content);
  assert.deepEqual(parseCellsFromMarkdown(md.split('---\n').slice(2).join('---\n')), [{ type: 'code', source: content.cells[0].source }]);
});

test('Python percent format', () => {
  const cells = parseCellsFromPython('# %% [markdown]\n# # Title\n# text\n\n# %%\nx = 1\n\n# %%\nprint(x)\n');
  assert.deepEqual(cells, [
    { type: 'markdown', source: '# Title\ntext' },
    { type: 'code', source: 'x = 1' },
    { type: 'code', source: 'print(x)' },
  ]);
  assert.deepEqual(parseCellsFromPython('a = 1\nb = 2\n'), [{ type: 'code', source: 'a = 1\nb = 2' }]);
  const back = parseCellsFromPython(labToPython({ title: 'T' }, { cells: [{ type: 'markdown', source: '# Title\ntext' }, { type: 'code', source: 'x = 1' }] }));
  assert.deepEqual(back.slice(1), [{ type: 'markdown', source: '# Title\ntext' }, { type: 'code', source: 'x = 1' }]);
});

test('ipynb export then import keeps cells and outputs', () => {
  const content = normalizeContent({
    cells: [
      { id: 'm1', type: 'markdown', source: '# My lab\n\nText' },
      {
        id: 'c1',
        type: 'code',
        source: 'print("hi")\n1 + 1',
        execution: { status: 'ok', count: 2 },
        outputs: [
          { type: 'stream', name: 'stdout', text: 'hi\n' },
          { type: 'result', text: '2' },
          { type: 'image', mime: 'image/png', data: 'iVBORw0KGgo=' },
          { type: 'html', html: '<table><tr><td>1</td></tr></table>', text: 'df' },
        ],
      },
      { id: 'c2', type: 'code', source: '1/0', outputs: [{ type: 'error', ename: 'ZeroDivisionError', evalue: 'division by zero', traceback: 'Traceback\nZeroDivisionError: division by zero' }] },
    ],
  });
  const nb = contentToNotebook({ title: 'My lab', tags: ['a'] }, content);
  assert.equal(nb.nbformat, 4);
  assert.equal(nb.cells[1].execution_count, 2);
  const json = JSON.parse(JSON.stringify(nb));
  const back = notebookToCells(json);
  assert.equal(back.title, 'My lab');
  assert.deepEqual(back.cells.map((c) => c.type), ['markdown', 'code', 'code']);
  assert.equal(back.cells[1].source, 'print("hi")\n1 + 1');
  assert.deepEqual(back.cells[1].outputs.map((o) => o.type), ['stream', 'result', 'image', 'html']);
  assert.equal(back.cells[1].outputs[0].text, 'hi\n');
  assert.equal(back.cells[2].outputs[0].ename, 'ZeroDivisionError');
  assert.throws(() => notebookToCells({ nbformat: 3, cells: [] }), /format 4/);
  assert.throws(() => notebookToCells({}), /not a Jupyter notebook/);
});

test('ipynb import strips ANSI colour codes from tracebacks', () => {
  const back = notebookToCells({ nbformat: 4, cells: [{ cell_type: 'code', source: ['1/0'], outputs: [{ output_type: 'error', ename: 'E', evalue: 'v', traceback: ['\u001b[0;31mE\u001b[0m: v'] }] }] });
  assert.equal(back.cells[0].outputs[0].traceback, 'E: v');
});

test('every bundled template parses into valid content', () => {
  const dir = new URL('../../src/labs/templates/', import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  assert.ok(files.length >= 3, 'templates exist');
  for (const f of files) {
    const { data, cells } = parseLabMarkdown(readFileSync(new URL(f, dir), 'utf8'));
    assert.ok(data.title, `${f}: title`);
    assert.ok(data.summary, `${f}: summary`);
    assert.ok(cells.some((c) => c.type === 'code'), `${f}: has code`);
    normalizeContent({ cells: cells.map((c, i) => ({ ...c, id: `c${i}` })) });
  }
});
