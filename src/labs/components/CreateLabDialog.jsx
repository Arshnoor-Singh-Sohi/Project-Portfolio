// src/labs/components/CreateLabDialog.jsx
// New lab: a title, an optional goal, and where to start from — a
// template (or blank), a study note, or a file (.ipynb, .md, .py,
// .lab.json).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Dialog from './Dialog';
import { labsApi } from '../api';
import { TEMPLATES, blankCells, getTemplate, noteCells, toContent } from '../templates';
import { LIMITS, normalizeTags } from '../../lib/labs/schema';
import { parseLabMarkdown, parseCellsFromPython } from '../../lib/labs/lab-format';
import { notebookToCells } from '../../lib/labs/ipynb';
import { readFileText } from '../util';

const BLANK = { id: 'blank', title: 'Blank lab', summary: 'An empty Python lab with a goal, a code cell and an observations cell.', tags: [], objectives: [], packages: ['numpy'], level: '', codeCellCount: 1 };

async function parseImport(file) {
  const text = await readFileText(file);
  const name = file.name.toLowerCase();
  if (name.endsWith('.ipynb')) {
    const nb = notebookToCells(JSON.parse(text));
    return { title: nb.title, description: nb.description, tags: nb.tags, cells: nb.cells };
  }
  if (name.endsWith('.json')) {
    const data = JSON.parse(text);
    if (data.format !== 'portfolio-lab' || !data.content || !Array.isArray(data.content.cells)) throw new Error('This JSON file is not a lab file (.lab.json).');
    const l = data.lab || {};
    return { title: l.title, description: l.description, tags: l.tags, collection: l.collection, objectives: l.objectives, packages: l.packages, cells: data.content.cells };
  }
  if (name.endsWith('.md') || name.endsWith('.markdown')) {
    const { data, cells } = parseLabMarkdown(text);
    return { title: data.title, description: data.summary, tags: data.tags, collection: data.collection, objectives: data.objectives, packages: data.packages, cells };
  }
  if (name.endsWith('.py')) {
    return { title: file.name.replace(/\.py$/i, ''), cells: parseCellsFromPython(text) };
  }
  throw new Error('Use a .ipynb, .md, .py or .lab.json file.');
}

function NotePicker({ selected, onSelect }) {
  const [index, setIndex] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    let alive = true;
    import('virtual:notes-index')
      .then((m) => alive && setIndex(m.default))
      .catch(() => alive && setError('The notes list could not be loaded.'));
    return () => {
      alive = false;
    };
  }, []);
  const results = useMemo(() => {
    if (!index) return [];
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return index.notes
      .filter((n) => !/\/00-progress\//.test(n.path) && !/(^|\/)(glossary|course-plan)$/.test(n.path))
      .filter((n) => terms.every((t) => `${n.title} ${n.summary} ${n.path}`.toLowerCase().includes(t)))
      .slice(0, 40);
  }, [index, query]);

  if (error) return <p className="labs-error-text">{error}</p>;
  if (!index) return <p className="labs-muted">Loading the notes…</p>;
  const area = (path) => index.folders[path.split('/')[0]] || path.split('/')[0];
  const subject = (path) => index.folders[path.split('/').slice(0, 2).join('/')] || '';
  return (
    <div className="labs-note-picker">
      <input type="search" aria-label="Search the notes" placeholder="Search the notes, for example: kv cache" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul className="labs-pick-list" role="listbox" aria-label="Notes">
        {results.map((n) => (
          <li key={n.path}>
            <button
              type="button"
              role="option"
              aria-selected={selected && selected.path === n.path}
              className={`labs-pick${selected && selected.path === n.path ? ' is-selected' : ''}`}
              onClick={() => onSelect({ ...n, area: area(n.path), subject: subject(n.path) })}
            >
              <span className="labs-pick-title">{n.title}</span>
              <span className="labs-pick-meta">
                {area(n.path)}
                {subject(n.path) ? ` / ${subject(n.path)}` : ''}
              </span>
            </button>
          </li>
        ))}
        {results.length === 0 && <li className="labs-muted">No note matches.</li>}
      </ul>
    </div>
  );
}

function TemplateGrid({ selected, onSelect }) {
  const list = [BLANK, ...TEMPLATES];
  return (
    <div className="labs-template-grid" role="radiogroup" aria-label="Templates">
      {list.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={selected === t.id}
          className={`labs-template${selected === t.id ? ' is-selected' : ''}`}
          onClick={() => onSelect(t.id)}
        >
          <span className="labs-template-title">{t.title}</span>
          <span className="labs-template-summary">{t.summary}</span>
          <span className="labs-template-meta c-mono">
            {[t.collection, t.level, t.id === 'blank' ? null : `${t.codeCellCount} code cells`].filter(Boolean).join(' · ')}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function CreateLabDialog({ open, onClose, onCreated, collections = [], initialNote = null, initialTemplate = null }) {
  const [mode, setMode] = useState('template');
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [templateId, setTemplateId] = useState('blank');
  const [note, setNote] = useState(null);
  const [imported, setImported] = useState(null);
  const [collection, setCollection] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const titleTouched = useRef(false);

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    titleTouched.current = false;
    setError('');
    setBusy(false);
    setObjective('');
    setImported(null);
    setTitle('');
    setCollection('');
    setTags('');
    setNote(null);
    setTemplateId(initialTemplate && getTemplate(initialTemplate) ? initialTemplate : 'blank');
    setMode(initialNote ? 'note' : 'template');
    if (initialTemplate && getTemplate(initialTemplate)) {
      const t = getTemplate(initialTemplate);
      setTitle(t.title);
      setCollection(t.collection || '');
      setTags((t.tags || []).join(', '));
    }
    if (initialNote) {
      import('virtual:notes-index').then((m) => {
        const index = m.default;
        const n = index.notes.find((x) => x.path === initialNote);
        if (n) {
          const area = index.folders[n.path.split('/')[0]] || '';
          const subject = index.folders[n.path.split('/').slice(0, 2).join('/')] || '';
          pickNote({ ...n, area, subject });
        }
      });
    }
    // pickNote only sets state; it is safe to leave out of the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialNote, initialTemplate]);

  const suggestTitle = (value) => {
    if (!titleTouched.current) setTitle(value.slice(0, LIMITS.titleMax));
  };

  const pickTemplate = (id) => {
    setTemplateId(id);
    const t = id === 'blank' ? null : getTemplate(id);
    suggestTitle(t ? t.title : '');
    setCollection(t ? t.collection || '' : '');
    setTags(t ? (t.tags || []).join(', ') : '');
  };

  const pickNote = (n) => {
    setNote(n);
    suggestTitle(`Lab: ${n.title.replace(/^L\d+[a-z]?:\s*/i, '')}`);
    setCollection(n.area || '');
    setTags(n.path.split('/')[1] || '');
  };

  const pickFile = async (file) => {
    setError('');
    setImported(null);
    if (!file) return;
    try {
      const data = await parseImport(file);
      if (!data.cells.length) throw new Error('The file has no cells.');
      setImported({ ...data, fileName: file.name });
      suggestTitle(data.title || file.name.replace(/\.[^.]+$/, ''));
      if (data.collection) setCollection(data.collection);
      if (data.tags && data.tags.length) setTags(data.tags.join(', '));
    } catch (err) {
      setError(`Cannot import ${file.name}: ${err.message}`);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const name = title.trim();
    if (!name) {
      setError('Give the lab a title.');
      return;
    }
    let input = { title: name, collection: collection.trim(), runtime: 'python' };
    try {
      input.tags = normalizeTags(tags);
    } catch (err) {
      setError(err.message);
      return;
    }
    const goal = objective.trim();
    if (mode === 'template') {
      const t = templateId === 'blank' ? null : getTemplate(templateId);
      if (t) {
        input = { ...input, template: t.id, description: t.summary, objectives: [...(goal ? [goal] : []), ...t.objectives].slice(0, LIMITS.objectivesMax), packages: t.packages, content: toContent(t.cells) };
      } else {
        input = { ...input, description: goal, objectives: goal ? [goal] : [], packages: ['numpy'], content: toContent(blankCells({ title: name, objective: goal })) };
      }
    } else if (mode === 'note') {
      if (!note) {
        setError('Choose a note.');
        return;
      }
      input = { ...input, sourceNote: note.path, description: note.summary, objectives: goal ? [goal] : [], packages: ['numpy'], content: toContent(noteCells({ title: name, note, objective: goal })) };
    } else {
      if (!imported) {
        setError('Choose a file to import.');
        return;
      }
      input = {
        ...input,
        description: imported.description || goal,
        objectives: [...(goal ? [goal] : []), ...(imported.objectives || [])].slice(0, LIMITS.objectivesMax),
        packages: imported.packages || [],
        content: toContent(imported.cells),
      };
    }
    input.description = (input.description || '').slice(0, LIMITS.descriptionMax);
    setBusy(true);
    try {
      const { lab } = await labsApi.create(input);
      onCreated(lab);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const tabs = [
    ['template', 'Template'],
    ['note', 'Study note'],
    ['import', 'File'],
  ];

  return (
    <Dialog open={open} title="New lab" onClose={onClose} wide>
      <form className="labs-form" onSubmit={submit}>
        <label className="labs-field">
          <span className="labs-field-label">Title</span>
          <input
            type="text"
            required
            maxLength={LIMITS.titleMax}
            value={title}
            autoFocus
            placeholder="For example: Build the DFT"
            onChange={(e) => {
              titleTouched.current = true;
              setTitle(e.target.value);
            }}
          />
        </label>
        <label className="labs-field">
          <span className="labs-field-label">What do you want to understand? (optional)</span>
          <input type="text" maxLength={LIMITS.objectiveMax} value={objective} placeholder="For example: why the FFT needs a window" onChange={(e) => setObjective(e.target.value)} />
        </label>

        <fieldset className="labs-fieldset">
          <legend className="labs-field-label">Start from</legend>
          <div className="labs-tabs" role="tablist" aria-label="Start from">
            {tabs.map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={mode === id} className={`labs-tab${mode === id ? ' is-selected' : ''}`} onClick={() => setMode(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="labs-tab-panel" role="tabpanel">
            {mode === 'template' && <TemplateGrid selected={templateId} onSelect={pickTemplate} />}
            {mode === 'note' && (
              <>
                <p className="labs-help">The lab links to the note and starts with its goal. You write the code.</p>
                <NotePicker selected={note} onSelect={pickNote} />
              </>
            )}
            {mode === 'import' && (
              <div className="labs-import">
                <p className="labs-help">A Jupyter notebook (.ipynb), a lab template (.md), a Python file (.py, cells split at “# %%”), or a lab file (.lab.json).</p>
                <input type="file" accept=".ipynb,.md,.markdown,.py,.json" aria-label="File to import" onChange={(e) => pickFile(e.target.files && e.target.files[0])} />
                {imported && (
                  <p className="labs-import-summary">
                    {imported.fileName}: {imported.cells.filter((c) => c.type === 'code').length} code cells, {imported.cells.filter((c) => c.type === 'markdown').length} text cells.
                  </p>
                )}
              </div>
            )}
          </div>
        </fieldset>

        <div className="labs-field-row">
          <label className="labs-field">
            <span className="labs-field-label">Collection</span>
            <input type="text" list="labs-new-collections" maxLength={LIMITS.collectionMax} value={collection} placeholder="For example: Maths" onChange={(e) => setCollection(e.target.value)} />
            <datalist id="labs-new-collections">
              {collections.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="labs-field">
            <span className="labs-field-label">Tags (comma between tags)</span>
            <input type="text" value={tags} placeholder="fft, numpy" onChange={(e) => setTags(e.target.value)} />
          </label>
        </div>
        {error && (
          <p className="labs-error-text" role="alert">
            {error}
          </p>
        )}
        <div className="labs-dialog-footer">
          <button type="button" className="labs-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="labs-button is-primary" disabled={busy}>
            {busy ? 'Creating…' : 'Create lab'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
