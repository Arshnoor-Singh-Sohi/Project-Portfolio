// src/labs/hooks.js
// React bindings for the Labs stores and small shared hooks.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { labsApi } from './api';
import { LabDocument } from './lab-document';
import { LabRunner } from './lab-runner';

export function useStore(store) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

// One LabDocument per lab id. Saves pending work when the page or the
// lab closes.
export function useLabDocument(labId) {
  const [doc] = useState(() => new LabDocument(labId, labsApi));
  useEffect(() => {
    doc.load();
    const onPageHide = () => {
      if (doc.dirty) {
        doc.writeDraft();
        doc.saveNow({ keepalive: true });
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onPageHide();
    };
    const onBeforeUnload = (e) => {
      if (doc.dirty || doc.getSnapshot().save.status === 'saving') {
        doc.writeDraft();
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibility);
      if (doc.dirty) doc.saveNow({ keepalive: true });
      doc.dispose();
    };
  }, [doc]);
  return [doc, useStore(doc)];
}

export function useLabRunner(doc, lab) {
  const runnerRef = useRef(null);
  const settingsRef = useRef(lab ? lab.settings : {});
  settingsRef.current = lab ? lab.settings : {};
  if (!runnerRef.current && lab) {
    runnerRef.current = new LabRunner({
      doc,
      runtimeId: lab.runtime,
      packages: lab.packages,
      getSettings: () => settingsRef.current || {},
      onFirstRun: () => {
        const current = doc.getSnapshot().lab;
        if (current && current.status === 'not-started') doc.updateLab({ status: 'in-progress' }).catch(() => {});
      },
    });
  }
  const runner = runnerRef.current;
  useEffect(() => () => runner && runner.dispose(), [runner]);
  const snapshot = useSyncExternalStore(
    runner ? runner.subscribe : noopSubscribe,
    runner ? runner.getSnapshot : nullSnapshot,
    runner ? runner.getSnapshot : nullSnapshot,
  );
  return [runner, snapshot];
}

const noopSubscribe = () => () => {};
const nullSnapshot = () => null;

// Re-render every `ms` while `active` (for "3 minutes ago", run timers).
export function useTicker(ms, active = true) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms, active]);
}

// Sets the document title and robots noindex while mounted.
export function useLabsHead(title) {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    const previous = document.title;
    return () => {
      meta.remove();
      document.title = previous;
    };
  }, []);
  useEffect(() => {
    document.title = title ? `${title} · Labs` : 'Labs';
  }, [title]);
}
