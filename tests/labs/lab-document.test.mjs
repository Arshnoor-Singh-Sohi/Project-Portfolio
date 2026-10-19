// Autosave, conflicts, retries and drafts of the page-side LabDocument
// (src/labs/lab-document.js), with a fake API and short timers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LabDocument } from '../../src/labs/lab-document.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 2000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (fn()) return;
    await sleep(5);
  }
  assert.fail('condition not reached in time');
}

function apiError(status, code, data) {
  const err = new Error(`HTTP ${status}`);
  err.status = status;
  err.code = code;
  err.data = data;
  err.retryable = status === 0 || status >= 500;
  return err;
}

function fakeApi({ cells = [{ id: 'a', type: 'markdown', source: 'hi' }] } = {}) {
  const api = {
    revision: 3,
    cells,
    saves: [],
    versions: [],
    created: [],
    failNext: [],
    delayMs: 0,
    async get() {
      return { lab: { id: 'lab123456', title: 'T', tags: [], objectives: [], packages: [], settings: {}, lastCellId: null, contentUpdatedAt: 'x' }, content: { cells: api.cells }, revision: api.revision };
    },
    async saveContent(id, payload) {
      api.saves.push(payload);
      if (api.delayMs) await sleep(api.delayMs);
      const failure = api.failNext.shift();
      if (failure) throw failure;
      if (!payload.force && payload.baseRevision !== api.revision) throw apiError(409, 'conflict', { revision: api.revision });
      api.revision += 1;
      api.cells = payload.content.cells;
      return { revision: api.revision, updatedAt: new Date().toISOString() };
    },
    async createVersion(id, body) {
      api.versions.push(body);
      return { version: { id: 'v1', ...body } };
    },
    async create(input) {
      api.created.push(input);
      return { lab: { id: 'copy123456', title: input.title } };
    },
    async update(id, patch) {
      if (api.failUpdate) throw apiError(500, 'server_error');
      return { lab: { id, title: patch.title || 'T', tags: [], objectives: [], settings: {} } };
    },
  };
  return api;
}

const code = (id, source) => ({ id, type: 'code', source, language: 'python', outputs: [] });

test('loads, then saves edits after the debounce with the base revision', async () => {
  const api = fakeApi();
  const doc = new LabDocument('lab123456', api, { debounceMs: 30, maxWaitMs: 500, storage: false });
  await doc.load();
  assert.equal(doc.getSnapshot().phase, 'ready');
  doc.replaceCells([code('b', 'x = 1')]);
  assert.equal(doc.getSnapshot().save.status, 'pending');
  assert.equal(api.saves.length, 0, 'not saved at once');
  await until(() => doc.getSnapshot().save.status === 'saved');
  assert.equal(api.saves.length, 1);
  assert.equal(api.saves[0].baseRevision, 3);
  assert.equal(doc.getSnapshot().lab.revision, 4);
  assert.equal(doc.dirty, false);
});

test('many quick edits make one save; maxWait forces a save while typing', async () => {
  const api = fakeApi();
  const doc = new LabDocument('lab123456', api, { debounceMs: 50, maxWaitMs: 150, storage: false });
  await doc.load();
  for (let i = 0; i < 12; i++) {
    doc.replaceCells([code('b', `x = ${i}`)]);
    await sleep(20);
  }
  assert.ok(api.saves.length >= 1, 'saved during continuous typing');
  await until(() => doc.getSnapshot().save.status === 'saved');
  assert.ok(api.saves.length <= 4, `few saves (${api.saves.length})`);
  assert.equal(api.cells[0].source, 'x = 11', 'the last edit reached the server');
});

test('edits during a save are saved by a second save', async () => {
  const api = fakeApi();
  api.delayMs = 60;
  const doc = new LabDocument('lab123456', api, { debounceMs: 10, maxWaitMs: 100, storage: false });
  await doc.load();
  doc.replaceCells([code('b', 'first')]);
  await until(() => doc.getSnapshot().save.status === 'saving');
  doc.replaceCells([code('b', 'second')]);
  await until(() => doc.getSnapshot().save.status === 'saved' && !doc.dirty, 3000);
  assert.equal(api.saves.length, 2);
  assert.equal(api.saves[1].baseRevision, 4, 'the second save uses the new revision');
  assert.equal(api.cells[0].source, 'second');
});

test('a stale revision shows a conflict and stops saving until the owner chooses', async () => {
  const api = fakeApi();
  const doc = new LabDocument('lab123456', api, { debounceMs: 10, storage: false });
  await doc.load();
  api.revision = 9; // another tab saved
  doc.replaceCells([code('b', 'mine')]);
  await until(() => doc.getSnapshot().save.status === 'conflict');
  assert.equal(doc.getSnapshot().save.conflictRevision, 9);
  doc.replaceCells([code('b', 'mine 2')]);
  await sleep(60);
  assert.equal(api.saves.length, 1, 'no save while in conflict');
  assert.equal(await doc.saveNow(), false);

  await doc.keepMine();
  assert.equal(api.versions[0].reason, 'before-conflict', 'the other copy is kept as a version');
  assert.equal(api.saves.at(-1).force, true);
  assert.equal(api.cells[0].source, 'mine 2');
  assert.equal(doc.getSnapshot().save.status, 'saved');
});

test('"use the other copy" keeps this tab as a new lab, then loads the server copy', async () => {
  const api = fakeApi();
  const doc = new LabDocument('lab123456', api, { debounceMs: 10, storage: false });
  await doc.load();
  api.revision = 9;
  api.cells = [code('z', 'theirs')];
  doc.replaceCells([code('b', 'mine')]);
  await until(() => doc.getSnapshot().save.status === 'conflict');
  const copy = await doc.useTheirs();
  assert.equal(copy.id, 'copy123456');
  assert.equal(api.created[0].content.cells[0].source, 'mine');
  assert.match(api.created[0].title, /unsaved copy/);
  assert.equal(doc.getSnapshot().cells[0].source, 'theirs');
  assert.equal(doc.getSnapshot().save.status, 'saved');
  assert.equal(doc.dirty, false);
});

test('network errors are retried with backoff; refused saves wait for the next edit', async () => {
  const api = fakeApi();
  const doc = new LabDocument('lab123456', api, { debounceMs: 10, maxRetryMs: 50, storage: false });
  await doc.load();
  api.failNext.push(apiError(0, 'network'));
  doc.replaceCells([code('b', 'x')]);
  await until(() => doc.getSnapshot().save.status === 'error');
  assert.ok(doc.getSnapshot().save.retryAt, 'a retry is planned');
  await until(() => doc.getSnapshot().save.status === 'saved', 3000);
  assert.equal(api.saves.length, 2);

  api.failNext.push(apiError(413, 'too_large'));
  doc.replaceCells([code('b', 'huge')]);
  await until(() => doc.getSnapshot().save.status === 'error');
  assert.equal(doc.getSnapshot().save.retryAt, null, 'no automatic retry');
  await sleep(80);
  assert.equal(api.saves.length, 3, 'nothing retried by itself');
  doc.replaceCells([code('b', 'smaller')]);
  await until(() => doc.getSnapshot().save.status === 'saved');
  assert.equal(api.cells[0].source, 'smaller');
});

test('invalid content is not sent and the reason is shown', async () => {
  const api = fakeApi();
  const doc = new LabDocument('lab123456', api, { debounceMs: 10, storage: false });
  await doc.load();
  doc.replaceCells([code('same', 'a'), code('same', 'b')]);
  await until(() => doc.getSnapshot().save.status === 'error');
  assert.match(doc.getSnapshot().save.error, /same id/);
  assert.equal(api.saves.length, 0);
});

test('flush waits until the server has everything', async () => {
  const api = fakeApi();
  api.delayMs = 30;
  const doc = new LabDocument('lab123456', api, { debounceMs: 1000, storage: false });
  await doc.load();
  doc.replaceCells([code('b', 'now')]);
  assert.equal(await doc.flush(), true);
  assert.equal(api.cells[0].source, 'now');
  assert.equal(doc.dirty, false);
});

test('metadata updates are optimistic and roll back on failure', async () => {
  const api = fakeApi();
  const doc = new LabDocument('lab123456', api, { storage: false });
  await doc.load();
  await doc.updateLab({ title: 'New' });
  assert.equal(doc.getSnapshot().lab.title, 'New');
  api.failUpdate = true;
  await assert.rejects(doc.updateLab({ title: 'Broken' }));
  assert.equal(doc.getSnapshot().lab.title, 'New', 'rolled back');
});

test('unsaved cells are kept in localStorage and offered back', async () => {
  const store = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
  };
  try {
    const api = fakeApi();
    api.failNext.push(apiError(500, 'server_error'), apiError(500, 'server_error'), apiError(500, 'server_error'));
    const doc = new LabDocument('lab123456', api, { debounceMs: 10, maxRetryMs: 10_000 });
    await doc.load();
    doc.replaceCells([code('b', 'not saved yet')]);
    await until(() => doc.getSnapshot().save.status === 'error');
    doc.dispose();
    assert.ok(store.has('labs.draft.lab123456'), 'draft written');
    api.failNext = []; // the server works again

    const again = new LabDocument('lab123456', api, { debounceMs: 10 });
    await again.load();
    const offer = again.getSnapshot().draftOffer;
    assert.ok(offer, 'draft offered');
    assert.equal(offer.stale, false);
    await again.restoreDraft();
    await until(() => again.getSnapshot().save.status === 'saved');
    assert.equal(api.cells[0].source, 'not saved yet');
    assert.equal(store.has('labs.draft.lab123456'), false, 'draft removed after the save');
    again.dispose();
  } finally {
    delete globalThis.window;
  }
});
