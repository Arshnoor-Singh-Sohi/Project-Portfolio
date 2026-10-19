// src/labs/components/LabSettingsDialog.jsx
// Edit the lab's details: title, description, collection, tags,
// objectives and run settings.
import React, { useEffect, useState } from 'react';
import Dialog from './Dialog';
import { LIMITS } from '../../lib/labs/schema';

export default function LabSettingsDialog({ open, lab, collections = [], onSave, onClose }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && lab) {
      setForm({
        title: lab.title,
        description: lab.description || '',
        collection: lab.collection || '',
        tags: (lab.tags || []).join(', '),
        objectives: (lab.objectives || []).join('\n'),
        timeoutSeconds: lab.settings.timeoutSeconds,
        autoRunParams: lab.settings.autoRunParams,
      });
      setError('');
    }
  }, [open, lab]);

  if (!form) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({
        title: form.title,
        description: form.description,
        collection: form.collection,
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        objectives: form.objectives.split('\n').map((s) => s.trim()).filter(Boolean),
        settings: { timeoutSeconds: Number(form.timeoutSeconds), autoRunParams: form.autoRunParams },
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title="Lab details" onClose={onClose} wide>
      <form className="labs-form" onSubmit={submit}>
        <label className="labs-field">
          <span className="labs-field-label">Title</span>
          <input type="text" required maxLength={LIMITS.titleMax} value={form.title} onChange={set('title')} />
        </label>
        <label className="labs-field">
          <span className="labs-field-label">Description</span>
          <textarea rows={2} maxLength={LIMITS.descriptionMax} value={form.description} onChange={set('description')} />
        </label>
        <div className="labs-field-row">
          <label className="labs-field">
            <span className="labs-field-label">Collection</span>
            <input type="text" list="labs-collections" maxLength={LIMITS.collectionMax} value={form.collection} onChange={set('collection')} placeholder="For example: Maths" />
            <datalist id="labs-collections">
              {collections.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="labs-field">
            <span className="labs-field-label">Tags (comma between tags)</span>
            <input type="text" value={form.tags} onChange={set('tags')} placeholder="fft, numpy" />
          </label>
        </div>
        <label className="labs-field">
          <span className="labs-field-label">Objectives (one on each line)</span>
          <textarea rows={4} value={form.objectives} onChange={set('objectives')} placeholder="Explain what one FFT bin measures." />
        </label>
        <div className="labs-field-row">
          <label className="labs-field">
            <span className="labs-field-label">Time limit for one cell (seconds)</span>
            <input type="number" min={LIMITS.timeoutMinSeconds} max={LIMITS.timeoutMaxSeconds} value={form.timeoutSeconds} onChange={set('timeoutSeconds')} />
          </label>
          <label className="labs-field labs-field-check">
            <input type="checkbox" checked={form.autoRunParams} onChange={set('autoRunParams')} />
            <span>Run a cell again when one of its controls changes</span>
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
            {busy ? 'Saving…' : 'Save details'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
