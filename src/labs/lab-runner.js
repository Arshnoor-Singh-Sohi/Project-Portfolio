// src/labs/lab-runner.js
// ============================================================
// Runs the code cells of one open lab, one at a time, through the
// lab's runtime session (src/labs/runtimes). Outputs go straight into
// the LabDocument, so they are saved like any other edit.
//
//   run([ids])       queue cells; Run all stops at the first error
//   requestRun(id)   for # @param controls: if the cell is running,
//                    run it once more when it ends (no pile-up)
//   stop()           ends the run (the runtime restarts)
//   restart()        fresh runtime, all variables cleared
// ============================================================

import { getRuntime } from './runtimes/index.js';

export class LabRunner {
  constructor({ doc, runtimeId = 'python', packages = [], getSettings = () => ({}), onFirstRun = () => {} }) {
    this.doc = doc;
    this.runtime = getRuntime(runtimeId);
    this.packages = packages;
    this.getSettings = getSettings;
    this.onFirstRun = onFirstRun;
    this.session = null;
    this.queue = [];
    this.again = new Set();
    this.stopOnError = false;
    this.processing = false;
    this.listeners = new Set();
    this.snapshot = {
      runtime: { state: 'off', message: 'Python starts when you run a cell.' },
      running: null,
      queued: [],
      startedAt: null,
      progress: '',
    };
  }

  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.snapshot;

  set(patch) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const fn of this.listeners) fn();
  }

  ensureSession() {
    if (!this.session) {
      this.session = this.runtime.createSession({
        packages: this.packages,
        onStateChange: (runtime) => this.set({ runtime }),
      });
    }
    return this.session;
  }

  // Start the runtime early, so the first run is fast.
  warmUp() {
    this.ensureSession().start();
  }

  run(ids, { stopOnError = true } = {}) {
    const cells = this.doc.cells;
    for (const id of ids) {
      const cell = cells.find((c) => c.id === id);
      if (cell && cell.type === 'code' && !this.queue.includes(id) && this.snapshot.running !== id) this.queue.push(id);
    }
    this.stopOnError = stopOnError;
    this.set({ queued: [...this.queue] });
    this.process();
  }

  runAll() {
    this.run(this.doc.cells.filter((c) => c.type === 'code').map((c) => c.id), { stopOnError: true });
  }

  // Every code cell above `id`, then `id` itself.
  runUpTo(id) {
    const cells = this.doc.cells;
    const end = cells.findIndex((c) => c.id === id);
    this.run(cells.slice(0, end + 1).filter((c) => c.type === 'code').map((c) => c.id), { stopOnError: true });
  }

  requestRun(id) {
    if (this.snapshot.running === id) {
      this.again.add(id);
      return;
    }
    if (!this.queue.includes(id)) this.run([id], { stopOnError: false });
  }

  async process() {
    if (this.processing) return;
    this.processing = true;
    try {
      while (this.queue.length) {
        const id = this.queue.shift();
        const cell = this.doc.cells.find((c) => c.id === id);
        if (!cell || cell.type !== 'code') continue;
        this.set({ running: id, queued: [...this.queue], startedAt: Date.now(), progress: '' });
        this.onFirstRun();
        this.doc.updateCell(id, (c) => ({ ...c, outputs: [] }), { lastCellId: id });

        const session = this.ensureSession();
        const timeoutMs = (this.getSettings().timeoutSeconds || 120) * 1000;
        const result = await session.run(cell.source, {
          timeoutMs,
          onOutput: (item) => this.doc.updateCell(id, (c) => ({ ...c, outputs: [...(c.outputs || []), item] })),
          onProgress: (message) => this.set({ progress: message }),
        });
        this.doc.updateCell(
          id,
          (c) => ({
            ...c,
            execution: { status: result.status, count: result.count, durationMs: result.durationMs, finishedAt: new Date().toISOString() },
          }),
          { lastCellId: id },
        );
        if (result.status === 'interrupted') {
          this.queue = [];
          this.again.clear();
        } else if (result.status === 'error' && this.stopOnError) {
          this.queue = [];
        }
        if (this.again.has(id)) {
          this.again.delete(id);
          this.queue.unshift(id);
        }
      }
    } finally {
      this.processing = false;
      this.set({ running: null, queued: [], startedAt: null, progress: '' });
    }
  }

  stop() {
    this.queue = [];
    this.again.clear();
    this.set({ queued: [] });
    if (this.session) this.session.stop('user');
  }

  restart() {
    this.queue = [];
    this.again.clear();
    this.set({ queued: [] });
    return this.ensureSession().restart();
  }

  dispose() {
    this.queue = [];
    if (this.session) this.session.dispose();
    this.session = null;
    this.listeners.clear();
  }
}
