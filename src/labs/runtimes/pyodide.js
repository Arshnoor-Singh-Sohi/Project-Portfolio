// src/labs/runtimes/pyodide.js
// ============================================================
// Page-side client for the Python worker
// (public/labs-runtime/python-worker.mjs). A runtime session has
// this interface, so another runtime (JavaScript in a sandboxed
// iframe, a remote sandbox) can plug into the same workspace:
//
//   session.state          'off' | 'starting' | 'ready' | 'busy' | 'error'
//   session.start()        -> Promise (resolves when ready)
//   session.run(code, { onOutput, onProgress, timeoutMs })
//                          -> Promise<{ status: 'ok'|'error'|'interrupted', durationMs, count }>
//   session.stop(reason)   stops the current run (here: ends the worker)
//   session.restart()      fresh process, all variables gone
//   session.dispose()
//   onStateChange({ state, message }) is called on every change.
// ============================================================

export const PYODIDE_VERSION = '314.0.7';
export const WORKER_URL = '/labs-runtime/python-worker.mjs';

export class PyodideSession {
  constructor({ packages = [], indexURL, onStateChange = () => {} } = {}) {
    this.packages = packages;
    this.indexURL = indexURL;
    this.onStateChange = onStateChange;
    this.worker = null;
    this.state = 'off';
    this.message = 'Python starts when you run a cell.';
    this.ready = null;
    this.active = null; // { runId, resolve, onOutput, onProgress, timer, started }
    this.executionCount = 0;
    this.nextRunId = 1;
  }

  setState(state, message) {
    this.state = state;
    if (message !== undefined) this.message = message;
    this.onStateChange({ state: this.state, message: this.message });
  }

  start() {
    if (this.ready) return this.ready;
    let resolveReady;
    let rejectReady;
    this.ready = new Promise((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    // Avoid "unhandled rejection" noise when nobody waits yet.
    this.ready.catch(() => {});
    this.setState('starting', 'Starting Python…');
    let worker;
    try {
      worker = new Worker(WORKER_URL, { type: 'module', name: 'lab-python' });
    } catch (err) {
      this.setState('error', `This browser cannot start the Python worker: ${err.message}`);
      rejectReady(err);
      return this.ready;
    }
    this.worker = worker;
    let isReady = false;

    worker.onmessage = (event) => {
      const msg = event.data || {};
      if (worker !== this.worker) return;
      switch (msg.type) {
        case 'status':
          if (msg.state === 'ready' && !isReady) {
            isReady = true;
            resolveReady();
          }
          // While a cell runs, the page shows "busy" whatever the worker
          // is doing (loading packages, running).
          this.setState(this.active ? 'busy' : msg.state === 'ready' ? 'ready' : 'starting', msg.message);
          break;
        case 'progress':
          if (this.active && msg.runId === this.active.runId) this.active.onProgress?.(msg.message);
          break;
        case 'output':
          if (this.active && msg.runId === this.active.runId) this.active.onOutput?.(msg.item);
          break;
        case 'done':
          if (this.active && msg.runId === this.active.runId) this.finishRun({ status: msg.status === 'ok' ? 'ok' : 'error', durationMs: msg.durationMs });
          break;
        case 'fatal':
          this.fail(`Python could not start: ${msg.message}`);
          if (!isReady) rejectReady(new Error(msg.message));
          break;
        default:
          break;
      }
    };
    worker.onerror = (event) => {
      if (worker !== this.worker) return;
      event.preventDefault?.();
      const text = event.message || 'The Python worker stopped unexpectedly (often: the browser ran out of memory).';
      this.fail(text);
      if (!isReady) rejectReady(new Error(text));
    };
    worker.postMessage({ type: 'init', packages: this.packages, indexURL: this.indexURL });
    return this.ready;
  }

  // The worker died or could not start: report it and end the run.
  fail(message) {
    this.terminateWorker();
    if (this.active) {
      this.active.onOutput?.({ type: 'error', ename: 'RuntimeStopped', evalue: message, traceback: message });
      this.finishRun({ status: 'error', durationMs: performance.now() - this.active.started });
    }
    this.setState('error', message);
  }

  finishRun(result) {
    const active = this.active;
    if (!active) return;
    clearTimeout(active.timer);
    this.active = null;
    if (this.worker) this.setState('ready', 'Python is ready.');
    active.resolve({ ...result, count: active.count, durationMs: Math.round(result.durationMs || 0) });
  }

  async run(code, { onOutput, onProgress, timeoutMs = 120_000 } = {}) {
    if (this.active) throw new Error('A cell is already running.');
    if (this.state === 'error' || this.state === 'off' || !this.worker) {
      this.ready = null;
      this.start();
    }
    const runId = this.nextRunId++;
    const count = ++this.executionCount;
    const started = performance.now();
    return new Promise((resolve) => {
      this.active = { runId, resolve, onOutput, onProgress, started, count, timer: null };
      this.setState('busy', 'Running…');
      this.ready.then(
        () => {
          if (!this.active || this.active.runId !== runId) return;
          // The time limit counts from the moment Python is ready.
          this.active.timer = setTimeout(() => this.stop('timeout', timeoutMs), timeoutMs);
          this.worker.postMessage({ type: 'run', runId, code, filename: `<cell-${count}>` });
        },
        (err) => {
          if (this.active && this.active.runId === runId) {
            onOutput?.({ type: 'error', ename: 'RuntimeError', evalue: err.message, traceback: `Python could not start: ${err.message}` });
            this.finishRun({ status: 'error', durationMs: performance.now() - started });
          }
        },
      );
    });
  }

  // Ending the worker is the only way to stop Python code that is
  // running without cross-origin isolation (see LABS_ARCHITECTURE.md).
  stop(reason = 'user', timeoutMs = 0) {
    const active = this.active;
    this.terminateWorker();
    if (active) {
      const text =
        reason === 'timeout'
          ? `Stopped after ${Math.round(timeoutMs / 1000)} s (the time limit of this lab). Python restarted, so variables from earlier cells are gone: run them again.`
          : 'Stopped. Python restarted, so variables from earlier cells are gone: run them again.';
      active.onOutput?.({ type: 'info', text });
      this.active = null;
      clearTimeout(active.timer);
      active.resolve({ status: 'interrupted', count: active.count, durationMs: Math.round(performance.now() - active.started) });
    }
    this.setState('off', 'Python stopped. It starts again when you run a cell.');
  }

  restart() {
    this.stop('restart');
    return this.start();
  }

  terminateWorker() {
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.terminate();
    }
    this.worker = null;
    this.ready = null;
    // A new process starts counting again, like a Jupyter kernel restart.
    this.executionCount = 0;
  }

  dispose() {
    this.stop('dispose');
    this.onStateChange = () => {};
  }
}
