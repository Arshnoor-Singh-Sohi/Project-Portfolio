// src/lib/labs/worker-csp.js
// The Content-Security-Policy of the Python worker
// (public/labs-runtime/python-worker.mjs). The same value is in
// vercel.json (production) and is sent by
// plugins/vite-plugin-labs-api.js (npm run dev); a test checks that
// they match.
//
// - script-src: Pyodide and its modules come from jsDelivr; WebAssembly
//   compilation needs 'wasm-unsafe-eval'.
// - connect-src: Pyodide files and packages (jsDelivr), micropip
//   (PyPI), and raw GitHub files for datasets. NOT this site: lab code
//   cannot call /api/labs with the owner's cookie.
// To let lab code fetch from another host, add it to connect-src in
// both places (see LABS_GUIDE.md).
export function workerCsp(extraOrigins = []) {
  const extra = extraOrigins.length ? ` ${extraOrigins.join(' ')}` : '';
  return [
    "default-src 'none'",
    `script-src https://cdn.jsdelivr.net${extra} 'wasm-unsafe-eval'`,
    `connect-src https://cdn.jsdelivr.net https://pypi.org https://files.pythonhosted.org https://raw.githubusercontent.com${extra}`,
  ].join('; ');
}

export const WORKER_CSP = workerCsp();
