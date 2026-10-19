// src/labs/runtimes/index.js
// ============================================================
// Runtime registry. A lab names its runtime (lab.runtime) and each
// code cell names its language. To add a runtime (for example
// JavaScript in a sandboxed iframe), add an entry here whose
// createSession() returns an object with the interface described in
// ./pyodide.js, and add its id to RUNTIME_IDS in
// src/lib/labs/schema.js. LABS_GUIDE.md has the full steps.
// ============================================================

import { PyodideSession, PYODIDE_VERSION } from './pyodide.js';

export const RUNTIMES = {
  python: {
    id: 'python',
    label: 'Python',
    longLabel: `Python 3.14 · Pyodide ${PYODIDE_VERSION}`,
    description:
      'Runs in your browser. NumPy, SciPy, matplotlib, pandas, scikit-learn, NetworkX and SymPy load on import. Pure-Python packages: %pip install name.',
    fileExtension: 'py',
    // VITE_LABS_PYODIDE_URL (optional) serves Pyodide from another place
    // than jsDelivr. See LABS_GUIDE.md, "Self-host Pyodide".
    createSession: (options) => new PyodideSession({ ...options, indexURL: import.meta.env.VITE_LABS_PYODIDE_URL || undefined }),
    // Loaded on demand, so the editor code is not in the main bundle.
    loadEditorLanguage: () => import('@codemirror/lang-python').then((m) => m.python()),
  },
};

export function getRuntime(id) {
  return RUNTIMES[id] || RUNTIMES.python;
}
