// src/labs/templates.js
// ============================================================
// Lab templates and the other ways to start a lab.
//
// Every *.md file in ./templates is a template (format:
// src/lib/labs/lab-format.js, guide: LABS_GUIDE.md). They are read
// at build time, so adding a template is adding one file; this page
// and the API need no change.
// ============================================================

import { parseLabMarkdown } from '../lib/labs/lab-format';
import { createId } from '../lib/labs/schema';

const files = import.meta.glob('./templates/*.md', { query: '?raw', import: 'default', eager: true });

export const TEMPLATES = Object.entries(files)
  .map(([path, raw]) => {
    const fileId = path.split('/').pop().replace(/\.md$/, '');
    const { data, cells } = parseLabMarkdown(raw);
    return {
      id: data.id || fileId,
      title: data.title || fileId,
      summary: data.summary,
      collection: data.collection,
      tags: data.tags,
      packages: data.packages,
      objectives: data.objectives,
      level: data.level,
      order: data.order ?? 1000,
      runtime: data.runtime,
      cells,
      codeCellCount: cells.filter((c) => c.type === 'code').length,
    };
  })
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}

// { type, source } list -> content with fresh cell ids.
export function toContent(cells) {
  return {
    cells: cells.map((c) => ({
      id: createId(8),
      type: c.type,
      source: c.source,
      ...(c.type === 'code' ? { language: 'python', outputs: c.outputs || [], ...(c.execution ? { execution: c.execution } : {}) } : {}),
    })),
  };
}

const OBSERVATIONS = '## Observations\n\nWhat did you see? What surprised you? What would you test next?';

// A blank lab. With an objective, it opens with the goal and a plan.
export function blankCells({ title, objective }) {
  const goal = objective && objective.trim();
  return [
    {
      type: 'markdown',
      source: goal
        ? `# ${title}\n\n**Goal:** ${goal}\n\n## Plan\n\n1. Write the idea in one sentence, in your own words.\n2. Write the smallest piece of code that tests it.\n3. Change one thing at a time, and write down what happens.`
        : `# ${title}\n\nWrite what you want to understand, then test it in code.`,
    },
    { type: 'code', source: 'import numpy as np\n\n' },
    { type: 'markdown', source: OBSERVATIONS },
  ];
}

// A lab that starts from a study note: a link back to the note and a
// goal. The learner writes the code (no code is copied from the note).
export function noteCells({ title, note, objective }) {
  const goal = (objective && objective.trim()) || 'Build the main idea of this note from scratch, and test it.';
  return [
    {
      type: 'markdown',
      source: `# ${title}\n\nStudy note: [${note.title}](/notes/${note.path})${note.summary ? `\n\n> ${note.summary}` : ''}\n\n**Goal:** ${goal}\n\n## Plan\n\n1. Without the note, explain the idea in two sentences.\n2. Write the code. Test each piece with \`lab.check(...)\`.\n3. Change the inputs, and look for the edge cases.`,
    },
    { type: 'code', source: 'import numpy as np\nimport lab\n\n' },
    { type: 'markdown', source: OBSERVATIONS },
  ];
}
