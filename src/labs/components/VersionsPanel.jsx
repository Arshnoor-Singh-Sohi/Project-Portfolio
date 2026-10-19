// src/labs/components/VersionsPanel.jsx
// Side panel with the saved versions of a lab. A version keeps the
// cells (code and text) without outputs. Restoring first saves the
// current state as a version, so a restore can always be undone.
import React, { useCallback, useEffect, useState } from 'react';
import { labsApi } from '../api';
import { formatDateTime, timeAgo } from '../util';
import { IconX } from './Icons';

const REASONS = {
  manual: null,
  'before-restore': 'AUTO · BEFORE RESTORE',
  'before-reset': 'AUTO · BEFORE RESET',
  'before-import': 'AUTO · BEFORE IMPORT',
  'before-conflict': 'AUTO · OTHER COPY',
};

export default function VersionsPanel({ labId, open, onClose, onBeforeSnapshot, onRestore, notify }) {
  const [state, setState] = useState({ loading: true, error: null, versions: [] });
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { versions } = await labsApi.versions(labId);
      setState({ loading: false, error: null, versions });
    } catch (err) {
      setState({ loading: false, error: err.message, versions: [] });
    }
  }, [labId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!open) return null;

  const save = async (e) => {
    e.preventDefault();
    setBusy('save');
    try {
      const ok = await onBeforeSnapshot();
      if (!ok) throw new Error('The latest changes are not saved yet, so the version would miss them. Try again in a moment.');
      await labsApi.createVersion(labId, { label: label.trim() || undefined, reason: 'manual' });
      setLabel('');
      notify('Version saved.');
      await load();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const restore = async (v) => {
    setBusy(v.id);
    try {
      await onRestore(v);
      await load();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (v) => {
    setBusy(v.id);
    try {
      await labsApi.deleteVersion(labId, v.id);
      await load();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <aside className="labs-drawer" aria-label="Versions">
      <div className="labs-drawer-head">
        <h2 className="c-heavy">Versions</h2>
        <button type="button" className="labs-icon-button" aria-label="Close versions" onClick={onClose}>
          <IconX />
        </button>
      </div>
      <p className="labs-drawer-help">A version keeps the code and the text of every cell, not the outputs. Run the cells again to see the outputs.</p>
      <form className="labs-version-form" onSubmit={save}>
        <label htmlFor="version-label" className="labs-field-label">
          Name of the new version
        </label>
        <div className="labs-inline-field">
          <input id="version-label" type="text" maxLength={120} value={label} placeholder="For example: before I change the window" onChange={(e) => setLabel(e.target.value)} />
          <button type="submit" className="labs-button is-primary" disabled={busy === 'save'}>
            {busy === 'save' ? 'Saving…' : 'Save version'}
          </button>
        </div>
      </form>
      {state.loading && <p className="labs-muted">Loading versions…</p>}
      {state.error && (
        <p className="labs-error-text">
          {state.error}{' '}
          <button type="button" className="labs-link-button" onClick={load}>
            Try again
          </button>
        </p>
      )}
      {!state.loading && !state.error && state.versions.length === 0 && <p className="labs-muted">No versions yet.</p>}
      <ol className="labs-version-list">
        {state.versions.map((v) => (
          <li key={v.id} className="labs-version">
            <div className="labs-version-main">
              <span className="labs-version-label">{v.label}</span>
              {REASONS[v.reason] && <span className="c-mono labs-badge">{REASONS[v.reason]}</span>}
              <span className="labs-version-meta" title={formatDateTime(v.createdAt)}>
                {timeAgo(v.createdAt)} · {v.cellCount} cell{v.cellCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className="labs-version-actions">
              <button type="button" className="labs-button" disabled={Boolean(busy)} onClick={() => restore(v)}>
                {busy === v.id ? 'Working…' : 'Restore'}
              </button>
              <button type="button" className="labs-icon-button is-danger" aria-label={`Delete version ${v.label}`} disabled={Boolean(busy)} onClick={() => remove(v)}>
                <IconX />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
