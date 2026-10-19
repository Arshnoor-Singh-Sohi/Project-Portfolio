// src/labs/lab-document.js
// ============================================================
// One open lab: its metadata, its cells, and the work of keeping the
// server copy up to date. Plain JavaScript (no React), so the save
// rules can be tested on their own; React reads it through
// useSyncExternalStore (see ./hooks.js).
//
// Save rules
//   - Every edit marks the lab dirty. A save starts 1 s after the last
//     edit, and at the latest 8 s after the first unsaved edit.
//   - One save at a time. Edits during a save start another save.
//   - The server checks the revision. A stale save gets 409: the page
//     shows a conflict and saves nothing until the owner chooses.
//   - A failed save is retried after 2, 4, 8 ... 30 s. A refused save
//     (too large, invalid) waits for the next edit.
//   - Unsaved cells are also kept in localStorage, so a crash or a
//     closed tab does not lose them. The page offers them back.
//   - The status shown is the truth: "Saved" only after the server
//     confirmed the save.
// ============================================================

import { normalizeContent, LabValidationError } from '../lib/labs/schema.js';
import { readLocal, writeLocal, removeLocal } from './util.js';

const draftKey = (labId) => `labs.draft.${labId}`;

function sameCells(a, b) {
  try {
    return JSON.stringify(normalizeContent({ cells: a }).cells) === JSON.stringify(normalizeContent({ cells: b }).cells);
  } catch {
    return false;
  }
}

function withoutOutputs(cells) {
  return cells.map((c) => (c.type === 'code' ? { ...c, outputs: [], pins: undefined } : c));
}

export class LabDocument {
  constructor(labId, api, { debounceMs = 1000, maxWaitMs = 8000, maxRetryMs = 30_000, storage = true } = {}) {
    this.labId = labId;
    this.api = api;
    this.options = { debounceMs, maxWaitMs, maxRetryMs, storage };
    this.listeners = new Set();
    this.editSeq = 0;
    this.savedSeq = 0;
    this.baseRevision = 0;
    this.firstPendingAt = null;
    this.lastCellId = null;
    this.savePromise = null;
    this.saveTimer = null;
    this.draftTimer = null;
    this.retryAttempt = 0;
    this.errorSeq = -1;
    this.disposed = false;
    this.snapshot = {
      phase: 'loading', // loading | ready | error
      loadError: null,
      lab: null,
      cells: [],
      save: { status: 'saved', error: null, lastSavedAt: null, retryAt: null, conflictRevision: null },
      draftOffer: null,
    };
  }

  // ---------- store protocol ----------
  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.snapshot;

  set(patch) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const fn of this.listeners) fn();
  }

  setSave(patch) {
    this.set({ save: { ...this.snapshot.save, ...patch } });
  }

  get cells() {
    return this.snapshot.cells;
  }

  get dirty() {
    return this.editSeq !== this.savedSeq;
  }

  // ---------- load ----------
  async load() {
    // React StrictMode mounts, disposes and mounts again in dev.
    this.disposed = false;
    this.set({ phase: 'loading', loadError: null });
    try {
      const { lab, content, revision } = await this.api.get(this.labId);
      if (this.disposed) return;
      this.baseRevision = revision;
      this.lastCellId = lab.lastCellId || null;
      let draftOffer = null;
      const draft = this.options.storage ? readLocal(draftKey(this.labId)) : null;
      if (draft && Array.isArray(draft.cells) && !sameCells(draft.cells, content.cells)) {
        draftOffer = { savedAt: draft.savedAt, baseRevision: draft.baseRevision, stale: draft.baseRevision !== revision, cells: draft.cells };
      } else if (draft) {
        removeLocal(draftKey(this.labId));
      }
      this.set({
        phase: 'ready',
        lab,
        cells: content.cells,
        draftOffer,
        save: { status: 'saved', error: null, lastSavedAt: lab.contentUpdatedAt || lab.updatedAt, retryAt: null, conflictRevision: null },
      });
    } catch (err) {
      if (!this.disposed) this.set({ phase: 'error', loadError: err });
    }
  }

  // ---------- edits ----------

  // updater: (cells) => newCells. Unchanged cells must keep their
  // object identity (React re-renders only the changed ones).
  edit(updater, { lastCellId } = {}) {
    if (this.snapshot.phase !== 'ready') return;
    const next = updater(this.snapshot.cells);
    if (next === this.snapshot.cells) return;
    if (lastCellId) this.lastCellId = lastCellId;
    this.editSeq += 1;
    if (this.firstPendingAt === null) this.firstPendingAt = Date.now();
    const status = this.snapshot.save.status;
    this.set({ cells: next });
    if (status !== 'conflict' && status !== 'saving') this.setSave({ status: status === 'error' ? 'error' : 'pending' });
    this.scheduleSave();
    this.scheduleDraft();
  }

  updateCell(id, fn, options) {
    this.edit((cells) => {
      const i = cells.findIndex((c) => c.id === id);
      if (i === -1) return cells;
      const updated = fn(cells[i]);
      if (updated === cells[i]) return cells;
      const copy = cells.slice();
      copy[i] = updated;
      return copy;
    }, options);
  }

  replaceCells(cells) {
    this.edit(() => cells);
  }

  setLastCell(id) {
    this.lastCellId = id;
  }

  // ---------- saving ----------
  scheduleSave(delay) {
    clearTimeout(this.saveTimer);
    if (this.disposed || !this.dirty || this.savePromise) return;
    const status = this.snapshot.save.status;
    if (status === 'conflict') return;
    let wait = delay;
    if (wait === undefined) {
      if (status === 'error' && this.snapshot.save.retryAt) {
        wait = Math.max(0, this.snapshot.save.retryAt - Date.now());
      } else if (status === 'error' && this.editSeq <= this.errorSeq) {
        return; // refused save: wait for the next edit
      } else {
        const sinceFirst = Date.now() - (this.firstPendingAt ?? Date.now());
        wait = Math.max(0, Math.min(this.options.debounceMs, this.options.maxWaitMs - sinceFirst));
      }
    }
    this.saveTimer = setTimeout(() => this.saveNow(), wait);
  }

  // Resolves true when the server has everything up to this moment.
  saveNow({ force = false, keepalive = false } = {}) {
    clearTimeout(this.saveTimer);
    if (this.savePromise) return this.savePromise.then(() => (this.dirty ? this.saveNow({ force, keepalive }) : true));
    if (this.snapshot.phase !== 'ready') return Promise.resolve(false);
    if (!this.dirty && !force) return Promise.resolve(true);
    if (this.snapshot.save.status === 'conflict' && !force) return Promise.resolve(false);

    const seq = this.editSeq;
    let content;
    try {
      content = normalizeContent({ cells: this.snapshot.cells });
    } catch (err) {
      this.errorSeq = seq;
      this.setSave({ status: 'error', error: err instanceof LabValidationError ? err.message : String(err), retryAt: null });
      return Promise.resolve(false);
    }

    this.setSave({ status: 'saving' });
    const payload = { baseRevision: this.baseRevision, content, lastCellId: this.lastCellId, ...(force ? { force: true } : {}) };
    // keepalive requests are limited to 64 KB; larger ones use a normal request.
    const useKeepalive = keepalive && JSON.stringify(payload).length < 60_000;

    this.savePromise = this.api
      .saveContent(this.labId, payload, { keepalive: useKeepalive })
      .then((res) => {
        this.savedSeq = seq;
        this.baseRevision = res.revision;
        this.retryAttempt = 0;
        this.errorSeq = -1;
        if (!this.dirty) {
          this.firstPendingAt = null;
          if (this.options.storage) removeLocal(draftKey(this.labId));
        }
        this.set({ lab: { ...this.snapshot.lab, revision: res.revision, updatedAt: res.updatedAt, contentUpdatedAt: res.updatedAt } });
        this.setSave({ status: this.dirty ? 'pending' : 'saved', error: null, lastSavedAt: res.updatedAt, retryAt: null, conflictRevision: null });
        return true;
      })
      .catch((err) => {
        if (err && err.status === 409) {
          this.setSave({ status: 'conflict', error: err.message, retryAt: null, conflictRevision: err.data?.revision ?? null });
          return false;
        }
        if (err && err.status === 401) {
          this.errorSeq = seq;
          this.setSave({
            status: 'error',
            error: 'You are signed out. Sign in to Labs in another tab, then click Retry now. Your changes are kept in this browser.',
            retryAt: null,
          });
          return false;
        }
        if (err && err.retryable) {
          this.retryAttempt += 1;
          const wait = Math.min(this.options.maxRetryMs, 1000 * 2 ** this.retryAttempt);
          this.setSave({ status: 'error', error: err.message, retryAt: Date.now() + wait });
        } else {
          this.errorSeq = seq;
          this.setSave({ status: 'error', error: err ? err.message : 'Save failed.', retryAt: null });
        }
        return false;
      })
      .finally(() => {
        this.savePromise = null;
        if (!this.disposed) this.scheduleSave();
      });
    return this.savePromise;
  }

  // Save now and wait. Used before versions, reset, export, leaving.
  async flush() {
    if (!this.dirty && !this.savePromise) return true;
    const ok = await this.saveNow();
    return ok && !this.dirty;
  }

  retryNow() {
    this.setSave({ retryAt: null });
    this.errorSeq = -1;
    return this.saveNow();
  }

  // ---------- local draft ----------
  scheduleDraft() {
    if (!this.options.storage) return;
    clearTimeout(this.draftTimer);
    this.draftTimer = setTimeout(() => this.writeDraft(), 400);
  }

  writeDraft() {
    if (!this.dirty || this.snapshot.phase !== 'ready') return;
    const draft = { savedAt: new Date().toISOString(), baseRevision: this.baseRevision, cells: this.snapshot.cells };
    // Outputs can be large (images). Keep the code if they do not fit.
    if (!writeLocal(draftKey(this.labId), draft)) {
      writeLocal(draftKey(this.labId), { ...draft, cells: withoutOutputs(draft.cells) });
    }
  }

  async restoreDraft() {
    const offer = this.snapshot.draftOffer;
    if (!offer) return;
    if (offer.stale) {
      // The server copy changed after the draft: keep it as a version.
      await this.api.createVersion(this.labId, { label: 'Before restoring a browser draft', reason: 'before-restore' });
    }
    this.set({ draftOffer: null });
    this.replaceCells(offer.cells);
  }

  dismissDraft() {
    if (this.options.storage) removeLocal(draftKey(this.labId));
    this.set({ draftOffer: null });
  }

  // ---------- conflicts ----------

  // Keep this tab's cells: the other copy is saved as a version first.
  async keepMine() {
    await this.api.createVersion(this.labId, { label: 'Other copy, before it was replaced', reason: 'before-conflict' });
    this.setSave({ status: 'pending', conflictRevision: null });
    return this.saveNow({ force: true });
  }

  // Load the other copy. This tab's cells become a new lab first, so
  // nothing is lost. Returns the new lab.
  async useTheirs() {
    const lab = this.snapshot.lab;
    const { lab: copy } = await this.api.create({
      title: `${lab.title} (unsaved copy)`.slice(0, 120),
      description: lab.description,
      tags: lab.tags,
      collection: lab.collection,
      objectives: lab.objectives,
      packages: lab.packages,
      runtime: lab.runtime,
      content: normalizeContent({ cells: this.snapshot.cells }),
    });
    const { lab: fresh, content, revision } = await this.api.get(this.labId);
    this.baseRevision = revision;
    this.savedSeq = this.editSeq;
    this.firstPendingAt = null;
    if (this.options.storage) removeLocal(draftKey(this.labId));
    this.set({ lab: fresh, cells: content.cells });
    this.setSave({ status: 'saved', error: null, conflictRevision: null, lastSavedAt: fresh.contentUpdatedAt });
    return copy;
  }

  // ---------- metadata ----------
  async updateLab(patch) {
    const before = this.snapshot.lab;
    const { opened: _opened, ...visible } = patch;
    this.set({ lab: { ...before, ...visible } });
    try {
      const { lab } = await this.api.update(this.labId, patch);
      // Keep fields that content saves own (revision, counts).
      this.set({ lab: { ...lab, revision: this.snapshot.lab.revision, cellCount: this.snapshot.cells.length } });
      return lab;
    } catch (err) {
      this.set({ lab: before });
      throw err;
    }
  }

  dispose() {
    this.disposed = true;
    clearTimeout(this.saveTimer);
    clearTimeout(this.draftTimer);
    if (this.dirty) this.writeDraft();
    this.listeners.clear();
  }
}
