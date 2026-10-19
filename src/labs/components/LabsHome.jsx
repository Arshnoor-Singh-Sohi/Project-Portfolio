// src/labs/components/LabsHome.jsx
// /labs: every lab, with search, filters, sorting, a "continue" card
// and the new-lab dialog (/labs/new opens it, also with ?note= or
// ?template=).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { labsApi } from '../api';
import { useLabsHead, useTicker } from '../hooks';
import { TEMPLATES } from '../templates';
import { downloadText, readLocal, slugify, timeAgo, writeLocal } from '../util';
import { contentToNotebook } from '../../lib/labs/ipynb';
import CreateLabDialog from './CreateLabDialog';
import Dialog, { ConfirmDialog } from './Dialog';
import Menu from './Menu';
import { IconFlask, IconMore, IconPlus, IconSearch } from './Icons';

const STATUS_LABELS = { 'not-started': 'NOT STARTED', 'in-progress': 'IN PROGRESS', done: 'DONE' };
const FILTERS = [
  ['active', 'Active'],
  ['in-progress', 'In progress'],
  ['done', 'Done'],
  ['archived', 'Archived'],
  ['all', 'All'],
];
const SORTS = [
  ['opened', 'Recently opened'],
  ['updated', 'Recently changed'],
  ['created', 'Newest first'],
  ['title', 'Title A–Z'],
];
const PREFS_KEY = 'labs.home.prefs';

function sortLabs(labs, sort) {
  const by = {
    opened: (l) => l.openedAt || l.updatedAt || '',
    updated: (l) => l.updatedAt || '',
    created: (l) => l.createdAt || '',
  };
  const list = labs.slice();
  if (sort === 'title') return list.sort((a, b) => a.title.localeCompare(b.title));
  const key = by[sort] || by.updated;
  return list.sort((a, b) => (key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0));
}

function RenameDialog({ lab, onClose, onRename }) {
  const [value, setValue] = useState(lab ? lab.title : '');
  const [error, setError] = useState('');
  useEffect(() => setValue(lab ? lab.title : ''), [lab]);
  return (
    <Dialog open={Boolean(lab)} title="Rename the lab" onClose={onClose}>
      <form
        className="labs-form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await onRename(lab, value.trim());
            onClose();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <label className="labs-field">
          <span className="labs-field-label">Title</span>
          <input type="text" required maxLength={120} value={value} autoFocus onChange={(e) => setValue(e.target.value)} />
        </label>
        {error && <p className="labs-error-text">{error}</p>}
        <div className="labs-dialog-footer">
          <button type="button" className="labs-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="labs-button is-primary">
            Rename
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function LabCard({ lab, onAction }) {
  const items = [
    { label: 'Open', onSelect: () => onAction('open', lab) },
    { label: 'Rename…', onSelect: () => onAction('rename', lab) },
    { label: 'Duplicate', onSelect: () => onAction('duplicate', lab) },
    { label: 'Download as .ipynb', onSelect: () => onAction('export', lab) },
    { label: lab.archived ? 'Restore from the archive' : 'Archive', onSelect: () => onAction(lab.archived ? 'unarchive' : 'archive', lab) },
    { separator: true },
    { label: 'Delete…', danger: true, onSelect: () => onAction('delete', lab) },
  ];
  return (
    <li className={`labs-card${lab.archived ? ' is-archived' : ''}`}>
      <Link to={`/labs/${lab.id}`} className="labs-card-link">
        <span className="labs-card-top">
          {lab.collection && <span className="c-mono labs-badge is-collection">{lab.collection}</span>}
          <span className={`c-mono labs-status is-${lab.status}`}>{STATUS_LABELS[lab.status] || lab.status}</span>
          {lab.archived && <span className="c-mono labs-badge">ARCHIVED</span>}
        </span>
        <span className="labs-card-title c-heavy">{lab.title}</span>
        {lab.description && <span className="labs-card-desc">{lab.description}</span>}
        <span className="labs-card-tags">
          {lab.tags.slice(0, 5).map((t) => (
            <span key={t} className="c-mono labs-tag">
              {t}
            </span>
          ))}
        </span>
        <span className="labs-card-meta">
          {lab.codeCellCount} code · {lab.cellCount - lab.codeCellCount} text
          {lab.objectives.length > 0 && ` · ${lab.objectivesDone.length}/${lab.objectives.length} objectives`} · changed {timeAgo(lab.updatedAt)}
        </span>
      </Link>
      <div className="labs-card-menu">
        <Menu label={`Actions for ${lab.title}`} items={items} icon={<IconMore />} />
      </div>
    </li>
  );
}

function EmptyState({ onCreate }) {
  return (
    <section className="labs-empty c-panel">
      <IconFlask size={36} />
      <h2 className="c-heavy">Your first lab</h2>
      <p>A lab is a page of text and Python cells. You read a short explanation, write the code yourself, run it in the browser, and test it. Start from a template or from nothing.</p>
      <div className="labs-empty-templates">
        {TEMPLATES.slice(0, 4).map((t) => (
          <button key={t.id} type="button" className="labs-template" onClick={() => onCreate(t.id)}>
            <span className="labs-template-title">{t.title}</span>
            <span className="labs-template-summary">{t.summary}</span>
          </button>
        ))}
      </div>
      <button type="button" className="labs-button is-primary" onClick={() => onCreate(null)}>
        <IconPlus /> New lab
      </button>
    </section>
  );
}

export default function LabsHome({ session, createOpen }) {
  useLabsHead('');
  useTicker(60_000);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [state, setState] = useState({ loading: true, error: null, labs: [] });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(() => (readLocal(PREFS_KEY, {}) || {}).filter || 'active');
  const [sort, setSort] = useState(() => (readLocal(PREFS_KEY, {}) || {}).sort || 'opened');
  const [tag, setTag] = useState('');
  const [collection, setCollection] = useState('');
  const [renaming, setRenaming] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState(location.state && location.state.message ? location.state.message : '');
  const [busy, setBusy] = useState(false);
  const searchRef = useRef(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { labs } = await labsApi.list();
      setState({ loading: false, error: null, labs });
    } catch (err) {
      setState({ loading: false, error: err, labs: [] });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    writeLocal(PREFS_KEY, { filter, sort });
  }, [filter, sort]);

  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => setMessage(''), 6000);
    return () => clearTimeout(t);
  }, [message]);

  // "/" searches, "n" makes a new lab.
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector('dialog[open]')) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'n') {
        e.preventDefault();
        navigate('/labs/new');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const labs = state.labs;
  const allTags = useMemo(() => [...new Set(labs.flatMap((l) => l.tags))].sort(), [labs]);
  const allCollections = useMemo(() => [...new Set([...labs.map((l) => l.collection).filter(Boolean), ...TEMPLATES.map((t) => t.collection).filter(Boolean)])].sort(), [labs]);

  const visible = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const list = labs.filter((l) => {
      if (filter === 'active' && l.archived) return false;
      if (filter === 'archived' && !l.archived) return false;
      if (filter === 'in-progress' && (l.archived || l.status !== 'in-progress')) return false;
      if (filter === 'done' && (l.archived || l.status !== 'done')) return false;
      if (tag && !l.tags.includes(tag)) return false;
      if (collection && l.collection !== collection) return false;
      const text = `${l.title} ${l.description} ${l.tags.join(' ')} ${l.collection}`.toLowerCase();
      return terms.every((t) => text.includes(t));
    });
    return sortLabs(list, sort);
  }, [labs, query, filter, tag, collection, sort]);

  const resume = useMemo(() => sortLabs(labs.filter((l) => !l.archived && l.openedAt), 'opened')[0] || null, [labs]);

  const replaceLab = (lab) => setState((s) => ({ ...s, labs: s.labs.map((l) => (l.id === lab.id ? lab : l)) }));

  const onAction = async (action, lab) => {
    try {
      if (action === 'open') navigate(`/labs/${lab.id}`);
      if (action === 'rename') setRenaming(lab);
      if (action === 'delete') setDeleting(lab);
      if (action === 'archive' || action === 'unarchive') {
        const { lab: next } = await labsApi.update(lab.id, { archived: action === 'archive' });
        replaceLab(next);
        setMessage(action === 'archive' ? `Archived “${lab.title}”.` : `Restored “${lab.title}”.`);
      }
      if (action === 'duplicate') {
        const { lab: copy } = await labsApi.duplicate(lab.id);
        setState((s) => ({ ...s, labs: [copy, ...s.labs] }));
        setMessage(`Made “${copy.title}”.`);
      }
      if (action === 'export') {
        const { content } = await labsApi.get(lab.id);
        downloadText(`${slugify(lab.title)}.ipynb`, JSON.stringify(contentToNotebook(lab, content), null, 1), 'application/x-ipynb+json');
      }
    } catch (err) {
      setMessage(`Did not work: ${err.message}`);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await labsApi.remove(deleting.id);
      setState((s) => ({ ...s, labs: s.labs.filter((l) => l.id !== deleting.id) }));
      setMessage(`Deleted “${deleting.title}”.`);
      setDeleting(null);
    } catch (err) {
      setMessage(`Did not delete: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const openCreate = (templateId) => navigate(templateId ? `/labs/new?template=${encodeURIComponent(templateId)}` : '/labs/new');
  const filtered = Boolean(query || tag || collection || filter !== 'active');

  return (
    <div className="labs-home">
      <header className="labs-home-head">
        <div>
          <h1 className="c-display labs-h1">Labs</h1>
          <p className="labs-lead">Learn a concept by building it. Each lab is a page of text and Python that runs in your browser and saves online.</p>
        </div>
        <button type="button" className="labs-button is-primary is-big" onClick={() => openCreate(null)}>
          <IconPlus /> New lab <kbd className="labs-kbd">N</kbd>
        </button>
      </header>

      {session && session.storage === 'memory' && (
        <p className="labs-banner is-warn">Development mode: labs are kept in memory and disappear when the dev server stops. Set the Upstash variables in .env.local to use the real database.</p>
      )}
      {message && (
        <p className="labs-banner is-info" role="status">
          {message}
        </p>
      )}

      {resume && filter !== 'archived' && (
        <Link to={`/labs/${resume.id}`} className="labs-resume c-panel">
          <span className="c-mono labs-resume-label">CONTINUE WHERE YOU STOPPED</span>
          <span className="c-heavy labs-resume-title">{resume.title}</span>
          <span className="labs-resume-meta">
            Opened {timeAgo(resume.openedAt)} · {resume.codeCellCount} code cells
            {resume.objectives.length > 0 && ` · ${resume.objectivesDone.length} of ${resume.objectives.length} objectives`}
          </span>
        </Link>
      )}

      <div className="labs-toolbar" role="search">
        <label className="labs-search">
          <IconSearch />
          <input ref={searchRef} type="search" placeholder="Search labs" aria-label="Search labs" value={query} onChange={(e) => setQuery(e.target.value)} />
          <kbd className="labs-kbd">/</kbd>
        </label>
        <div className="labs-chips" role="group" aria-label="Show">
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" className={`labs-chip${filter === id ? ' is-selected' : ''}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="labs-selects">
          {allCollections.length > 0 && (
            <select aria-label="Collection" value={collection} onChange={(e) => setCollection(e.target.value)}>
              <option value="">All collections</option>
              {allCollections.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          {allTags.length > 0 && (
            <select aria-label="Tag" value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.loading && (
        <ul className="labs-grid" aria-busy="true" aria-label="Loading labs">
          {[0, 1, 2].map((i) => (
            <li key={i} className="labs-card is-skeleton" aria-hidden />
          ))}
        </ul>
      )}
      {state.error && (
        <div className="labs-banner is-bad" role="alert">
          <span>The labs did not load: {state.error.message}</span>
          <button type="button" className="labs-button" onClick={load}>
            Try again
          </button>
        </div>
      )}
      {!state.loading && !state.error && labs.length === 0 && <EmptyState onCreate={openCreate} />}
      {!state.loading && !state.error && labs.length > 0 && visible.length === 0 && (
        <p className="labs-muted labs-none">
          No lab matches.{' '}
          {filtered && (
            <button
              type="button"
              className="labs-link-button"
              onClick={() => {
                setQuery('');
                setTag('');
                setCollection('');
                setFilter('active');
              }}
            >
              Clear the filters
            </button>
          )}
        </p>
      )}
      {!state.loading && visible.length > 0 && (
        <ul className="labs-grid" aria-label="Labs">
          {visible.map((lab) => (
            <LabCard key={lab.id} lab={lab} onAction={onAction} />
          ))}
        </ul>
      )}

      <CreateLabDialog
        open={createOpen}
        collections={allCollections}
        initialNote={params.get('note')}
        initialTemplate={params.get('template')}
        onClose={() => navigate('/labs')}
        onCreated={(lab) => navigate(`/labs/${lab.id}`, { replace: true })}
      />
      <RenameDialog
        lab={renaming}
        onClose={() => setRenaming(null)}
        onRename={async (lab, title) => {
          const { lab: next } = await labsApi.update(lab.id, { title });
          replaceLab(next);
        }}
      />
      <ConfirmDialog open={Boolean(deleting)} title="Delete this lab forever?" confirmLabel="Delete forever" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)}>
        <p>{deleting ? `“${deleting.title}” and all its versions will be deleted. This cannot be undone. To hide a lab and keep it, use Archive.` : ''}</p>
      </ConfirmDialog>
    </div>
  );
}
