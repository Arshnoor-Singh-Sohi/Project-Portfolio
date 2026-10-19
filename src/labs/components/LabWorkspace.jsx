// src/labs/components/LabWorkspace.jsx
// The page of one lab (/labs/:labId): toolbar, lab details, cells,
// versions. State: LabDocument (cells, saving) and LabRunner (Python).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { labsApi } from '../api';
import { useLabDocument, useLabRunner, useLabsHead, useTicker } from '../hooks';
import { createId, normalizeContent } from '../../lib/labs/schema';
import { describeParams, updateParamInSource } from '../../lib/labs/params';
import { contentToNotebook } from '../../lib/labs/ipynb';
import { labToMarkdown, labToPython } from '../../lib/labs/lab-format';
import { downloadText, focusEditorIn, formatDuration, slugify, timeAgo } from '../util';
import Cell, { InsertBar } from './Cell';
import Menu from './Menu';
import { ConfirmDialog } from './Dialog';
import Dialog from './Dialog';
import VersionsPanel from './VersionsPanel';
import LabSettingsDialog from './LabSettingsDialog';
import { IconBack, IconHistory, IconMore, IconPlayAll, IconRestart, IconStop } from './Icons';

const RUNTIME_LABELS = { off: 'NOT STARTED', starting: 'STARTING', ready: 'READY', busy: 'RUNNING', error: 'ERROR' };

function SaveStatus({ save, onRetry }) {
  useTicker(1000, save.status === 'error' && Boolean(save.retryAt));
  useTicker(30_000, save.status === 'saved');
  let text;
  let tone = 'ok';
  switch (save.status) {
    case 'saving':
      text = 'Saving…';
      tone = 'busy';
      break;
    case 'pending':
      text = 'Unsaved changes';
      tone = 'busy';
      break;
    case 'conflict':
      text = 'Not saved: changed elsewhere';
      tone = 'bad';
      break;
    case 'error':
      text = save.retryAt ? `Not saved. Retry in ${Math.max(0, Math.ceil((save.retryAt - Date.now()) / 1000))} s` : 'Not saved';
      tone = 'bad';
      break;
    default:
      text = save.lastSavedAt ? `Saved ${timeAgo(save.lastSavedAt)}` : 'Saved';
  }
  return (
    <span className={`labs-save is-${tone}`} role="status" aria-live="polite" title={save.error || undefined}>
      <span className="labs-save-dot" aria-hidden />
      <span>{text}</span>
      {save.status === 'error' && (
        <button type="button" className="labs-link-button" onClick={onRetry}>
          Retry now
        </button>
      )}
    </span>
  );
}

function RuntimeStatus({ run }) {
  useTicker(500, Boolean(run.running));
  const state = run.runtime.state;
  const running = run.running && run.startedAt ? ` · ${formatDuration(Date.now() - run.startedAt)}` : '';
  return (
    <span className={`labs-runtime is-${state}`} role="status" aria-live="polite" title={run.runtime.message}>
      <span className="labs-runtime-dot" aria-hidden />
      <span className="c-mono">
        PYTHON · {RUNTIME_LABELS[state] || state.toUpperCase()}
        {running}
      </span>
      {run.queued.length > 0 && <span className="c-mono labs-runtime-queue">+{run.queued.length} WAITING</span>}
    </span>
  );
}

function Banner({ tone = 'info', children, actions }) {
  return (
    <div className={`labs-banner is-${tone}`} role={tone === 'bad' ? 'alert' : 'status'}>
      <div className="labs-banner-text">{children}</div>
      {actions && <div className="labs-banner-actions">{actions}</div>}
    </div>
  );
}

function Toasts({ toasts, onDismiss }) {
  return (
    <div className="labs-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`labs-toast is-${t.tone}`}>
          <span>{t.text}</span>
          {t.action && (
            <button
              type="button"
              className="labs-link-button"
              onClick={() => {
                t.action.run();
                onDismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
          <button type="button" className="labs-toast-close" aria-label="Close message" onClick={() => onDismiss(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const notify = useCallback(
    (text, tone = 'info', action) => {
      const id = createId(6);
      setToasts((list) => [...list.slice(-2), { id, text, tone, action }]);
      setTimeout(() => dismiss(id), action ? 8000 : tone === 'error' ? 9000 : 4000);
    },
    [dismiss],
  );
  return { toasts, notify, dismiss };
}

function TitleEditor({ title, onRename }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  useEffect(() => setValue(title), [title]);
  if (!editing) {
    return (
      <button type="button" className="labs-title-button" title="Rename the lab" onClick={() => setEditing(true)}>
        <h1 className="c-heavy labs-ws-title">{title}</h1>
      </button>
    );
  }
  const commit = () => {
    setEditing(false);
    const next = value.trim();
    if (next && next !== title) onRename(next);
    else setValue(title);
  };
  return (
    <input
      className="labs-title-input"
      aria-label="Lab title"
      value={value}
      maxLength={120}
      autoFocus
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') {
          setValue(title);
          setEditing(false);
        }
      }}
    />
  );
}

function LabHeader({ lab, onToggleObjective }) {
  const done = new Set(lab.objectivesDone || []);
  return (
    <header className="labs-ws-header">
      {lab.description && <p className="labs-ws-lead">{lab.description}</p>}
      <div className="labs-ws-meta">
        {lab.collection && <span className="c-mono labs-badge is-collection">{lab.collection}</span>}
        {lab.tags.map((t) => (
          <span key={t} className="c-mono labs-tag">
            {t}
          </span>
        ))}
        {lab.sourceNote && (
          <Link className="labs-note-link" to={`/notes/${lab.sourceNote}`}>
            Study note ↗
          </Link>
        )}
      </div>
      {lab.objectives.length > 0 && (
        <section className="labs-objectives" aria-label="Objectives">
          <p className="c-mono labs-objectives-title">
            OBJECTIVES · {done.size} OF {lab.objectives.length} DONE
          </p>
          <ul>
            {lab.objectives.map((o, i) => (
              <li key={i}>
                <label>
                  <input type="checkbox" checked={done.has(i)} onChange={() => onToggleObjective(i)} />
                  <span>{o}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}
    </header>
  );
}

function ShortcutsDialog({ open, onClose }) {
  const rows = [
    ['Shift + Enter', 'Run the cell and go to the next one'],
    ['Ctrl/⌘ + Enter', 'Run the cell and stay'],
    ['Alt + Enter', 'Run the cell and add a code cell below'],
    ['Ctrl/⌘ + S', 'Save now'],
    ['Escape, then Tab', 'Leave the code editor (Tab alone indents)'],
    ['Shift + Enter in a text cell', 'Show the formatted text and go on'],
    ['Escape in a text cell', 'Show the formatted text'],
    ['Ctrl/⌘ + Z', 'Undo in the editor (also undoes a control change)'],
    ['?', 'Show this list'],
  ];
  return (
    <Dialog open={open} title="Keyboard shortcuts" onClose={onClose}>
      <table className="labs-shortcuts">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <th scope="row">
                <kbd>{k}</kbd>
              </th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="labs-dialog-footer">
        <button type="button" className="labs-button is-primary" onClick={onClose}>
          Close
        </button>
      </div>
    </Dialog>
  );
}

export default function LabWorkspace({ labId, session }) {
  const navigate = useNavigate();
  const [doc, snap] = useLabDocument(labId);
  const lab = snap.lab;
  const [runner, run] = useLabRunner(doc, lab);
  const [activeId, setActiveId] = useState(null);
  const [newCellId, setNewCellId] = useState(null);
  const [starter, setStarter] = useState(null);
  const [panel, setPanel] = useState(null); // 'versions' | null
  const [dialog, setDialog] = useState(null); // 'settings' | 'reset' | 'delete' | 'shortcuts'
  const [busy, setBusy] = useState(false);
  const { toasts, notify, dismiss } = useToasts();
  const paramTimers = useRef(new Map());
  const scrolledRef = useRef(false);
  useLabsHead(lab ? lab.title : 'Lab');

  const ready = snap.phase === 'ready';

  // First load: remember the open, fetch the starter, go to the last cell.
  useEffect(() => {
    if (!ready || scrolledRef.current) return;
    scrolledRef.current = true;
    doc.updateLab({ opened: true }).catch(() => {});
    labsApi
      .starter(labId)
      .then(({ content }) => setStarter(new Map(content.cells.map((c) => [c.id, c]))))
      .catch(() => setStarter(new Map()));
    if (doc.cells.some((c) => c.type === 'code')) setTimeout(() => runner && runner.warmUp(), 400);
    const last = lab.lastCellId;
    if (last) {
      setActiveId(last);
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-cell-id="${CSS.escape(last)}"]`);
        if (el) el.scrollIntoView({ block: 'center' });
      });
    }
  }, [ready, doc, labId, lab, runner]);

  const focusCell = useCallback((id) => {
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-cell-id="${CSS.escape(id)}"]`);
      if (!el) return;
      el.scrollIntoView({ block: 'nearest' });
      focusEditorIn(el);
    });
  }, []);

  const insertCell = useCallback(
    (afterId, type) => {
      const cell = { id: createId(8), type, source: '', ...(type === 'code' ? { language: 'python', outputs: [] } : {}) };
      doc.edit((cells) => {
        const i = afterId === null ? -1 : cells.findIndex((c) => c.id === afterId);
        const copy = cells.slice();
        copy.splice(i + 1, 0, cell);
        return copy;
      });
      setNewCellId(cell.id);
      setActiveId(cell.id);
      return cell.id;
    },
    [doc],
  );

  const actions = useMemo(() => {
    const focusNext = (id) => {
      const cells = doc.cells;
      const i = cells.findIndex((c) => c.id === id);
      const next = cells[i + 1];
      if (next) {
        setActiveId(next.id);
        focusCell(next.id);
      } else {
        insertCell(id, 'code');
      }
    };
    return {
      focus: (id) => {
        setActiveId(id);
        doc.setLastCell(id);
      },
      focusNext,
      changeSource: (id, source) => doc.updateCell(id, (c) => (c.source === source ? c : { ...c, source })),
      run: (id) => runner && runner.run([id], { stopOnError: false }),
      runAdvance: (id) => {
        if (runner) runner.run([id], { stopOnError: false });
        focusNext(id);
      },
      runInsert: (id) => {
        if (runner) runner.run([id], { stopOnError: false });
        insertCell(id, 'code');
      },
      runUpTo: (id) => runner && runner.runUpTo(id),
      paramChange: (id, param, value) => {
        doc.updateCell(id, (c) => {
          const source = updateParamInSource(c.source, param, value);
          return source === c.source ? c : { ...c, source };
        });
        const settings = doc.getSnapshot().lab.settings;
        if (!settings.autoRunParams || !runner) return;
        clearTimeout(paramTimers.current.get(id));
        paramTimers.current.set(
          id,
          setTimeout(() => runner.requestRun(id), 250),
        );
      },
      move: (id, dir) =>
        doc.edit((cells) => {
          const i = cells.findIndex((c) => c.id === id);
          const j = i + dir;
          if (i === -1 || j < 0 || j >= cells.length) return cells;
          const copy = cells.slice();
          [copy[i], copy[j]] = [copy[j], copy[i]];
          return copy;
        }),
      remove: (id) => {
        const cells = doc.cells;
        const index = cells.findIndex((c) => c.id === id);
        if (index === -1) return;
        const removed = cells[index];
        doc.edit((list) => list.filter((c) => c.id !== id));
        notify(`${removed.type === 'code' ? 'Code' : 'Text'} cell deleted.`, 'info', {
          label: 'Undo',
          run: () =>
            doc.edit((list) => {
              if (list.some((c) => c.id === removed.id)) return list;
              const copy = list.slice();
              copy.splice(Math.min(index, copy.length), 0, removed);
              return copy;
            }),
        });
      },
      insert: insertCell,
      setType: (id, type) =>
        doc.updateCell(id, (c) =>
          type === 'code' ? { id: c.id, type: 'code', source: c.source, language: 'python', outputs: [] } : { id: c.id, type: 'markdown', source: c.source },
        ),
      pin: (id, params) =>
        doc.updateCell(id, (c) => {
          if (!c.outputs || !c.outputs.length) return c;
          const label = describeParams(params) || `Result at ${new Date().toLocaleTimeString()}`;
          const pin = { id: createId(8), label, createdAt: new Date().toISOString(), outputs: c.outputs };
          return { ...c, pins: [pin, ...(c.pins || [])].slice(0, 3) };
        }),
      unpin: (id, pinId) => doc.updateCell(id, (c) => ({ ...c, pins: (c.pins || []).filter((p) => p.id !== pinId) })),
      clearOutputs: (id) => doc.updateCell(id, (c) => ({ ...c, outputs: [], execution: undefined })),
      toggleCollapsed: (id) => doc.updateCell(id, (c) => ({ ...c, collapsed: !c.collapsed })),
      resetCell: (id) => {
        const original = starter && starter.get(id);
        if (!original) return;
        doc.updateCell(id, (c) =>
          original.type === 'code'
            ? { id: c.id, type: 'code', source: original.source, language: 'python', outputs: [], pins: c.pins }
            : { id: c.id, type: 'markdown', source: original.source },
        );
        notify('Cell reset to the starter. Ctrl+Z in the editor undoes it.');
      },
    };
  }, [doc, runner, insertCell, focusCell, starter, notify]);

  // Keys for the whole page.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        doc.saveNow();
        return;
      }
      const t = e.target;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest?.('.cm-editor'));
      if (!typing && e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setDialog('shortcuts');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc]);

  useEffect(() => () => paramTimers.current.forEach((t) => clearTimeout(t)), []);

  // ---------- lab-level actions ----------
  const updateLab = async (patch, success) => {
    try {
      await doc.updateLab(patch);
      if (success) notify(success);
    } catch (err) {
      notify(`Not saved: ${err.message}`, 'error');
    }
  };

  const snapshotFirst = async (label, reason) => {
    const saved = await doc.flush();
    if (!saved) throw new Error('Your latest changes are not saved yet. Wait for "Saved", then try again.');
    await labsApi.createVersion(labId, { label, reason });
  };

  const restoreVersion = async (v) => {
    await snapshotFirst(`Before restoring “${v.label}”`, 'before-restore');
    const { content } = await labsApi.version(labId, v.id);
    doc.replaceCells(content.cells);
    notify(`Restored “${v.label}”. The state before it is saved as a version.`);
  };

  const resetLab = async () => {
    setBusy(true);
    try {
      await snapshotFirst('Before reset', 'before-reset');
      const { content } = await labsApi.starter(labId);
      doc.replaceCells(content.cells);
      if (runner) runner.restart();
      setDialog(null);
      notify('The lab is back at its starter state. The state before it is in Versions.');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const duplicateLab = async () => {
    setBusy(true);
    try {
      await doc.flush();
      const { lab: copy } = await labsApi.duplicate(labId);
      navigate(`/labs/${copy.id}`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const deleteLab = async () => {
    setBusy(true);
    try {
      await labsApi.remove(labId);
      navigate('/labs', { replace: true, state: { message: `Deleted “${lab.title}”.` } });
    } catch (err) {
      notify(err.message, 'error');
      setBusy(false);
    }
  };

  const exportAs = (kind) => {
    const content = normalizeContent({ cells: doc.cells });
    const base = slugify(lab.title);
    if (kind === 'ipynb') downloadText(`${base}.ipynb`, JSON.stringify(contentToNotebook(lab, content), null, 1), 'application/x-ipynb+json');
    if (kind === 'py') downloadText(`${base}.py`, labToPython(lab, content), 'text/x-python');
    if (kind === 'md') downloadText(`${base}.md`, labToMarkdown(lab, content), 'text/markdown');
    if (kind === 'json') {
      const data = { format: 'portfolio-lab', version: 1, lab: { title: lab.title, description: lab.description, tags: lab.tags, collection: lab.collection, objectives: lab.objectives, packages: lab.packages, runtime: lab.runtime }, content };
      downloadText(`${base}.lab.json`, JSON.stringify(data, null, 2), 'application/json');
    }
  };

  // ---------- render ----------
  if (snap.phase === 'loading') {
    return (
      <div className="labs-ws labs-center">
        <p className="labs-muted" role="status">
          Opening the lab…
        </p>
      </div>
    );
  }
  if (snap.phase === 'error') {
    const missing = snap.loadError && snap.loadError.status === 404;
    return (
      <div className="labs-ws labs-center">
        <div className="c-panel labs-panel">
          <h1 className="c-heavy">{missing ? 'Lab not found' : 'The lab did not open'}</h1>
          <p>{missing ? 'It may have been deleted.' : snap.loadError.message}</p>
          <div className="labs-panel-actions">
            {!missing && (
              <button type="button" className="labs-button is-primary" onClick={() => doc.load()}>
                Try again
              </button>
            )}
            <Link to="/labs" className="labs-button">
              Back to Labs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cells = snap.cells;
  const save = snap.save;
  const isRunning = Boolean(run && run.running);
  const menuItems = [
    { label: 'Lab details and settings…', onSelect: () => setDialog('settings') },
    { label: lab.status === 'done' ? 'Mark as in progress' : 'Mark as done', onSelect: () => updateLab({ status: lab.status === 'done' ? 'in-progress' : 'done' }, lab.status === 'done' ? 'Marked as in progress.' : 'Marked as done. Well built.') },
    { separator: true },
    { label: 'Run all cells', onSelect: () => runner.runAll() },
    { label: 'Clear all outputs', onSelect: () => doc.edit((list) => list.map((c) => (c.type === 'code' && c.outputs && c.outputs.length ? { ...c, outputs: [], execution: undefined } : c))) },
    { label: 'Reset the lab to its starter…', onSelect: () => setDialog('reset') },
    { separator: true },
    { label: 'Duplicate the lab', onSelect: duplicateLab },
    { label: 'Download as Jupyter notebook (.ipynb)', onSelect: () => exportAs('ipynb') },
    { label: 'Download as Python file (.py)', onSelect: () => exportAs('py') },
    { label: 'Download as lab template (.md)', onSelect: () => exportAs('md') },
    { label: 'Download as lab file (.lab.json)', onSelect: () => exportAs('json') },
    { separator: true },
    { label: lab.archived ? 'Restore from the archive' : 'Archive the lab', onSelect: () => updateLab({ archived: !lab.archived }, lab.archived ? 'Restored from the archive.' : 'Archived. It is in the Archived filter on the Labs page.') },
    { label: 'Delete the lab…', danger: true, onSelect: () => setDialog('delete') },
    { separator: true },
    { label: 'Keyboard shortcuts', shortcut: '?', onSelect: () => setDialog('shortcuts') },
  ];

  return (
    <div className={`labs-ws${panel ? ' has-drawer' : ''}`}>
      <div className="labs-ws-bar">
        <Link to="/labs" className="labs-icon-button" aria-label="Back to all labs" title="All labs">
          <IconBack />
        </Link>
        <div className="labs-ws-titlebox">
          <TitleEditor title={lab.title} onRename={(title) => updateLab({ title })} />
        </div>
        <SaveStatus save={save} onRetry={() => doc.retryNow()} />
        <div className="labs-ws-actions">
          {run && <RuntimeStatus run={run} />}
          <button type="button" className="labs-button" onClick={() => runner.runAll()} disabled={!runner} title="Run every code cell from the top">
            <IconPlayAll /> <span className="labs-hide-sm">Run all</span>
          </button>
          <button type="button" className="labs-button" onClick={() => runner.stop()} disabled={!isRunning} title="Stop the running cell (Python restarts)">
            <IconStop /> <span className="labs-hide-sm">Stop</span>
          </button>
          <button
            type="button"
            className="labs-icon-button"
            onClick={() => {
              runner.restart();
              notify('Python restarted. All variables are cleared.');
            }}
            aria-label="Restart Python"
            title="Restart Python (clears all variables)"
          >
            <IconRestart />
          </button>
          <button type="button" className={`labs-icon-button${panel === 'versions' ? ' is-pressed' : ''}`} aria-pressed={panel === 'versions'} aria-label="Versions" title="Versions" onClick={() => setPanel((p) => (p === 'versions' ? null : 'versions'))}>
            <IconHistory />
          </button>
          <Menu label="Lab actions" items={menuItems} icon={<IconMore />} />
        </div>
      </div>

      <div className="labs-ws-body">
        <main className="labs-ws-main" aria-label={`Lab: ${lab.title}`}>
          {session && session.storage === 'memory' && (
            <Banner tone="warn">Development mode: this lab is in memory only and disappears when the dev server stops.</Banner>
          )}
          {lab.archived && (
            <Banner tone="info" actions={<button type="button" className="labs-button" onClick={() => updateLab({ archived: false }, 'Restored from the archive.')}>Restore</button>}>
              This lab is archived. It still saves your changes.
            </Banner>
          )}
          {snap.draftOffer && (
            <Banner
              tone="warn"
              actions={
                <>
                  <button type="button" className="labs-button is-primary" onClick={() => doc.restoreDraft().catch((err) => notify(err.message, 'error'))}>
                    Restore them
                  </button>
                  <button type="button" className="labs-button" onClick={() => doc.dismissDraft()}>
                    Discard
                  </button>
                </>
              }
            >
              This browser has changes from {timeAgo(snap.draftOffer.savedAt)} that did not reach the server.
              {snap.draftOffer.stale && ' The lab was saved somewhere else after that; restoring keeps that copy in Versions.'}
            </Banner>
          )}
          {save.status === 'conflict' && (
            <Banner
              tone="bad"
              actions={
                <>
                  <button type="button" className="labs-button is-primary" onClick={() => doc.keepMine().then(() => notify('Your version is saved. The other copy is in Versions.')).catch((err) => notify(err.message, 'error'))}>
                    Keep mine
                  </button>
                  <button
                    type="button"
                    className="labs-button"
                    onClick={() =>
                      doc
                        .useTheirs()
                        .then((copy) => notify(`Loaded the other copy. Your changes are in a new lab: “${copy.title}”.`, 'info', { label: 'Open it', run: () => navigate(`/labs/${copy.id}`) }))
                        .catch((err) => notify(err.message, 'error'))
                    }
                  >
                    Use the other copy
                  </button>
                </>
              }
            >
              <strong>This lab changed in another tab or on another device.</strong> Nothing is lost: “Keep mine” saves this tab and puts the other copy in Versions. “Use the other copy” loads it and saves this tab as a new lab.
            </Banner>
          )}
          {save.status === 'error' && !save.retryAt && <Banner tone="bad">Your changes are not saved: {save.error}</Banner>}
          {run && run.runtime.state === 'error' && (
            <Banner tone="bad" actions={<button type="button" className="labs-button" onClick={() => runner.restart()}>Restart Python</button>}>
              {run.runtime.message}
            </Banner>
          )}

          <LabHeader
            lab={lab}
            onToggleObjective={(i) => {
              const done = new Set(lab.objectivesDone || []);
              if (done.has(i)) done.delete(i);
              else done.add(i);
              updateLab({ objectivesDone: [...done].sort((a, b) => a - b) });
            }}
          />

          <InsertBar afterId={null} actions={actions} always={cells.length === 0} />
          {cells.map((cell, index) => {
            const original = starter && starter.get(cell.id);
            return (
              <React.Fragment key={cell.id}>
                <Cell
                  cell={cell}
                  index={index}
                  total={cells.length}
                  isActive={activeId === cell.id}
                  runState={run && run.running === cell.id ? 'running' : run && run.queued.includes(cell.id) ? 'queued' : null}
                  startedAt={run && run.running === cell.id ? run.startedAt : null}
                  progress={run && run.running === cell.id ? run.progress : ''}
                  starterDiffers={Boolean(original && (original.source !== cell.source || original.type !== cell.type))}
                  autoFocus={newCellId === cell.id}
                  actions={actions}
                />
                <InsertBar afterId={cell.id} actions={actions} always={index === cells.length - 1} />
              </React.Fragment>
            );
          })}
          <p className="labs-ws-foot c-mono">
            {run ? run.runtime.message : ''} · <button type="button" className="labs-link-button" onClick={() => setDialog('shortcuts')}>Keyboard shortcuts</button>
          </p>
        </main>
        <VersionsPanel
          labId={labId}
          open={panel === 'versions'}
          onClose={() => setPanel(null)}
          onBeforeSnapshot={() => doc.flush()}
          onRestore={restoreVersion}
          notify={notify}
        />
      </div>

      <LabSettingsDialog open={dialog === 'settings'} lab={lab} onClose={() => setDialog(null)} onSave={(patch) => doc.updateLab(patch)} />
      <ConfirmDialog open={dialog === 'reset'} title="Reset the lab?" confirmLabel="Reset the lab" busy={busy} onConfirm={resetLab} onClose={() => setDialog(null)}>
        <p>Every cell goes back to how the lab started. Outputs are cleared and Python restarts.</p>
        <p>The current state is saved as a version first, so you can restore it.</p>
      </ConfirmDialog>
      <ConfirmDialog open={dialog === 'delete'} title="Delete this lab forever?" confirmLabel="Delete forever" danger busy={busy} onConfirm={deleteLab} onClose={() => setDialog(null)}>
        <p>
          “{lab.title}” and all its versions will be deleted. This cannot be undone. To hide a lab and keep it, use <strong>Archive</strong>.
        </p>
      </ConfirmDialog>
      <ShortcutsDialog open={dialog === 'shortcuts'} onClose={() => setDialog(null)} />
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
