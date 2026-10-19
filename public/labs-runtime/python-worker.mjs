// public/labs-runtime/python-worker.mjs
// ============================================================
// The Python runtime for Labs: Pyodide (CPython compiled to
// WebAssembly) in a module Web Worker. One worker = one Python
// process for one open lab. Variables live until the page restarts
// the worker.
//
// This file is served as-is (not bundled), with its own strict
// Content-Security-Policy header (vercel.json, and
// plugins/vite-plugin-labs-api.js in dev). That policy lets this
// worker load Pyodide and packages from the CDN and PyPI, and blocks
// requests to this site, so lab code cannot call the Labs API.
//
// Messages in:   { type: 'init', packages, indexURL? }
//                { type: 'run', runId, code, filename }
// Messages out:  { type: 'status', state, message }
//                { type: 'progress', runId, message }
//                { type: 'output', runId, item }
//                { type: 'done', runId, status, durationMs }
//                { type: 'fatal', message }
// Stopping a run = the page terminates this worker.
// ============================================================

// Where Pyodide and its packages come from. The page can pass another
// base URL (VITE_LABS_PYODIDE_URL, for a self-hosted copy); that origin
// must then be in the worker's Content-Security-Policy.
const DEFAULT_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';

const OUTPUT_CHAR_LIMIT = 100_000; // stdout + stderr per run

let pyodide = null;
let runtime = null; // the _lab_runtime Python module
let chain = Promise.resolve();
let currentRunId = null;
let runChars = 0;
let truncatedNotice = false;
const decoders = { stdout: new TextDecoder(), stderr: new TextDecoder() };
const buffers = { stdout: '', stderr: '' };
let flushTimer = null;

function post(message) {
  self.postMessage(message);
}

function flushStreams() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  for (const name of ['stdout', 'stderr']) {
    if (!buffers[name]) continue;
    post({ type: 'output', runId: currentRunId, item: { type: 'stream', name, text: buffers[name] } });
    buffers[name] = '';
  }
}

function writeStream(name, text) {
  if (!text) return;
  if (runChars >= OUTPUT_CHAR_LIMIT) {
    if (!truncatedNotice) {
      truncatedNotice = true;
      flushStreams();
      post({
        type: 'output',
        runId: currentRunId,
        item: { type: 'info', text: `Output stopped at ${OUTPUT_CHAR_LIMIT.toLocaleString('en-US')} characters. The code keeps running; print less to see more.` },
      });
    }
    return;
  }
  const room = OUTPUT_CHAR_LIMIT - runChars;
  const part = text.length > room ? text.slice(0, room) : text;
  runChars += part.length;
  buffers[name] += part;
  // Batch writes: one message every 50 ms keeps the page responsive
  // when code prints in a tight loop.
  if (!flushTimer) flushTimer = setTimeout(flushStreams, 50);
}

function writer(name) {
  return {
    write(buffer) {
      writeStream(name, decoders[name].decode(buffer, { stream: true }));
      return buffer.length;
    },
  };
}

// ---------- Python files written into the in-memory file system ----------

const RUNTIME_PY = String.raw`
"""Lab runtime: runs cells and turns results into output items."""
import ast
import base64
import builtins
import io
import json
import linecache
import os
import sys
import traceback

import _lab_bridge

os.environ.setdefault("MPLBACKEND", "module://lab_backend")

USER_NS = {"__name__": "__main__", "__builtins__": builtins}

# A cell that ends with lab.show(...), lab.inspect(...) or lab.check(...)
# already showed its output; its return value is not shown again.
_HELPERS = {"show", "inspect", "check"}


def _ends_with_helper_call(code):
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return False
    if not tree.body or not isinstance(tree.body[-1], ast.Expr):
        return False
    call = tree.body[-1].value
    return (
        isinstance(call, ast.Call)
        and isinstance(call.func, ast.Attribute)
        and isinstance(call.func.value, ast.Name)
        and call.func.value.id == "lab"
        and call.func.attr in _HELPERS
    )


def emit(item):
    # Flush print() text first, so outputs keep their order.
    sys.stdout.flush()
    sys.stderr.flush()
    _lab_bridge.emit(json.dumps(item))


def _no_input(prompt=""):
    raise RuntimeError(
        "input() is not available in labs. Put the value in the code, "
        "or make it a control with  # @param  (see the lab guide)."
    )


builtins.input = _no_input


def emit_figure(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight")
    width, height = fig.get_size_inches() * 100
    emit({
        "type": "image",
        "mime": "image/png",
        "data": base64.b64encode(buf.getvalue()).decode("ascii"),
        "width": int(width),
        "height": int(height),
    })


def flush_figures():
    if "matplotlib.pyplot" not in sys.modules:
        return
    from matplotlib._pylab_helpers import Gcf
    for manager in list(Gcf.get_all_fig_managers()):
        try:
            emit_figure(manager.canvas.figure)
        finally:
            Gcf.destroy(manager)


def _is_matplotlib_artist(value):
    if "matplotlib.artist" not in sys.modules:
        return False
    from matplotlib.artist import Artist
    if isinstance(value, Artist):
        return True
    if isinstance(value, (list, tuple)) and value and all(isinstance(v, Artist) for v in value):
        return True
    return False


def show(value):
    """Show a value as an output, like the last line of a cell."""
    if value is None:
        return
    if "matplotlib.figure" in sys.modules:
        from matplotlib.figure import Figure
        if isinstance(value, Figure):
            emit_figure(value)
            return
    html = None
    method = getattr(value, "_repr_html_", None)
    if callable(method) and not isinstance(value, type):
        try:
            html = method()
        except Exception:
            html = None
    try:
        text = repr(value)
    except Exception as exc:
        text = f"<repr() failed: {exc!r}>"
    if isinstance(html, str) and html:
        emit({"type": "html", "html": html, "text": text})
    else:
        emit({"type": "result", "text": text})


def _format_error(exc):
    tb = exc.__traceback__
    # Hide the runtime's own frames: start at the first frame of a cell.
    while tb is not None and not tb.tb_frame.f_code.co_filename.startswith("<cell"):
        tb = tb.tb_next
    if isinstance(exc, SyntaxError):
        tb = None
    text = "".join(traceback.format_exception(type(exc), exc, tb))
    if isinstance(exc, ModuleNotFoundError) and exc.name:
        text += (
            f"\nHint: '{exc.name}' is not bundled with Pyodide. If it is a pure-Python "
            f"package, install it in a cell first:  %pip install {exc.name}"
        )
    return {"type": "error", "ename": type(exc).__name__, "evalue": str(exc), "traceback": text}


async def pip_install(names):
    import micropip
    print("Installing " + ", ".join(names) + " ...")
    await micropip.install(names)
    print("Installed " + ", ".join(names) + ".")


USER_NS["_lab_pip_install"] = pip_install


async def run_cell(code, filename):
    from pyodide.code import eval_code_async
    # Register the source, so tracebacks show the lines of the cell.
    linecache.cache[filename] = (len(code), None, code.splitlines(True), filename)
    try:
        result = await eval_code_async(code, globals=USER_NS, filename=filename, return_mode="last_expr")
    except BaseException as exc:  # noqa: BLE001 - every error goes to the learner
        try:
            flush_figures()
        except Exception:
            pass
        sys.stdout.flush()
        sys.stderr.flush()
        emit(_format_error(exc))
        return "error"
    sys.stdout.flush()
    sys.stderr.flush()
    flush_figures()
    if (
        result is not None
        and not _ends_with_helper_call(code)
        and getattr(type(result), "_lab_hide_result", False) is not True
        and not _is_matplotlib_artist(result)
    ):
        show(result)
    return "ok"
`;

const BACKEND_PY = String.raw`
"""matplotlib backend for labs: plt.show() and the end of a cell
turn each open figure into a PNG output, then close it."""
from matplotlib.backend_bases import FigureManagerBase, _Backend
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib._pylab_helpers import Gcf


class FigureManagerLab(FigureManagerBase):
    def show(self):
        import _lab_runtime
        try:
            _lab_runtime.emit_figure(self.canvas.figure)
        finally:
            Gcf.destroy(self)


@_Backend.export
class _BackendLab(_Backend):
    FigureCanvas = FigureCanvasAgg
    FigureManager = FigureManagerLab
    mainloop = None
`;

const LAB_PY = String.raw`
"""Helpers for labs.

    import lab
    lab.check("mean is zero", x.mean(), 0.0, tol=1e-9)   # PASS or FAIL badge
    lab.check("loss went down", loss[-1] < loss[0])     # any condition
    lab.inspect(matrix, "Q")                            # type, shape, dtype, stats
    lab.show(df)                                        # show a value now
"""
import math as _math

from _lab_runtime import emit as _emit
from _lab_runtime import show

__all__ = ["check", "inspect", "show", "CheckResult"]


class CheckResult:
    """What lab.check returns: true when the check passed.
    The badge is already on screen, so the cell does not print it again."""

    __slots__ = ("name", "passed")
    _lab_hide_result = True

    def __init__(self, name, passed):
        self.name = name
        self.passed = passed

    def __bool__(self):
        return self.passed

    def __repr__(self):
        return f"CheckResult({self.name!r}, passed={self.passed})"


def _short(value, limit=400):
    try:
        text = repr(value)
    except Exception as exc:
        text = f"<repr() failed: {exc!r}>"
    return text if len(text) <= limit else text[:limit] + " ..."


def _numpy():
    import sys
    return sys.modules.get("numpy")


def _compare(actual, expected, tol, rtol):
    np = _numpy()
    if np is not None and (isinstance(actual, np.ndarray) or isinstance(expected, np.ndarray)):
        a = np.asarray(actual)
        b = np.asarray(expected)
        if a.shape != b.shape:
            return False, f"shape {a.shape} is not {b.shape}"
        if np.issubdtype(a.dtype, np.number) and np.issubdtype(b.dtype, np.number):
            if tol is not None or rtol is not None or np.issubdtype(a.dtype, np.inexact) or np.issubdtype(b.dtype, np.inexact):
                ok = bool(np.allclose(a, b, atol=1e-8 if tol is None else tol, rtol=1e-5 if rtol is None else rtol))
                diff = float(np.max(np.abs(a - b))) if a.size else 0.0
                return ok, f"largest difference {diff:.3g}"
        return bool(np.array_equal(a, b)), ""
    numbers = (int, float)
    if isinstance(actual, numbers) and isinstance(expected, numbers) and not isinstance(actual, bool) and not isinstance(expected, bool):
        if isinstance(actual, float) or isinstance(expected, float) or tol is not None:
            ok = _math.isclose(actual, expected, rel_tol=1e-9 if rtol is None else rtol, abs_tol=0.0 if tol is None else tol)
            return ok, f"difference {abs(actual - expected):.3g}"
    try:
        result = actual == expected
        if np is not None and isinstance(result, np.ndarray):
            result = bool(result.all())
        return bool(result), ""
    except Exception as exc:
        return False, f"could not compare: {exc!r}"


def check(name, actual, expected=True, *, tol=None, rtol=None):
    """Compare actual with expected and show PASS or FAIL.
    Returns a CheckResult, which is true when the check passed.

    Floats and NumPy arrays are compared with a tolerance (tol = absolute,
    rtol = relative). With one value, check(name, condition) passes when
    the condition is True.
    """
    passed, detail = _compare(actual, expected, tol, rtol)
    _emit({
        "type": "check",
        "name": str(name),
        "passed": bool(passed),
        "expected": _short(expected),
        "actual": _short(actual),
        "detail": detail,
    })
    return CheckResult(str(name), bool(passed))


def inspect(value, name=None):
    """Show what a value is: type, length or shape, dtype and simple statistics.
    Returns the value, so it can wrap an expression."""
    rows = [("type", type(value).__module__ + "." + type(value).__qualname__
             if type(value).__module__ != "builtins" else type(value).__name__)]
    np = _numpy()
    if np is not None and isinstance(value, np.ndarray):
        rows += [("shape", str(value.shape)), ("dtype", str(value.dtype)), ("size", str(value.size))]
        if value.size and np.issubdtype(value.dtype, np.number) and not np.issubdtype(value.dtype, np.complexfloating):
            rows += [("min", f"{value.min():.6g}"), ("max", f"{value.max():.6g}"),
                     ("mean", f"{value.mean():.6g}"), ("std", f"{value.std():.6g}")]
        rows.append(("values", np.array2string(value, threshold=24, edgeitems=3, precision=4)))
    elif hasattr(value, "shape") and hasattr(value, "dtypes"):
        rows += [("shape", str(value.shape)), ("columns", _short(list(value.columns), 300))]
    elif isinstance(value, dict):
        rows += [("len", str(len(value))), ("keys", _short(list(value.keys())[:12], 300))]
    elif isinstance(value, (list, tuple, set, frozenset, str, bytes)):
        rows += [("len", str(len(value))), ("value", _short(value, 300))]
    else:
        rows.append(("value", _short(value, 300)))
    _emit({"type": "inspect", "name": "" if name is None else str(name), "rows": [[k, v] for k, v in rows]})
    return value
`;

// "%pip install a b" and "!pip install a b" become one awaited call
// on the same line, so line numbers in tracebacks do not move.
function rewriteMagics(code) {
  return code.replace(/^([ \t]*)[%!]pip[ \t]+install[ \t]+(.+)$/gm, (_, indent, args) => {
    const names = args
      .split(/\s+/)
      .filter((a) => a && !a.startsWith('-'))
      .map((a) => JSON.stringify(a));
    return `${indent}await _lab_pip_install([${names.join(', ')}])`;
  });
}

async function init(packages, indexURL) {
  post({ type: 'status', state: 'starting', message: 'Downloading Python (about 10 MB the first time)…' });
  const base = typeof indexURL === 'string' && /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(indexURL) ? indexURL.replace(/\/?$/, '/') : DEFAULT_INDEX_URL;
  const { loadPyodide } = await import(`${base}pyodide.mjs`);
  pyodide = await loadPyodide({ indexURL: base });
  pyodide.setStdout(writer('stdout'));
  pyodide.setStderr(writer('stderr'));
  pyodide.registerJsModule('_lab_bridge', {
    emit(json) {
      flushStreams();
      post({ type: 'output', runId: currentRunId, item: JSON.parse(json) });
    },
  });
  post({ type: 'status', state: 'starting', message: 'Starting Python…' });
  pyodide.FS.mkdirTree('/lab');
  pyodide.FS.writeFile('/lab/_lab_runtime.py', RUNTIME_PY);
  pyodide.FS.writeFile('/lab/lab_backend.py', BACKEND_PY);
  pyodide.FS.writeFile('/lab/lab.py', LAB_PY);
  pyodide.runPython('import sys\nif "/lab" not in sys.path: sys.path.insert(0, "/lab")');
  runtime = pyodide.pyimport('_lab_runtime');
  post({ type: 'status', state: 'ready', message: `Python ${pyodide.runPython('import sys; sys.version.split()[0]')} is ready.` });

  if (packages && packages.length) {
    post({ type: 'status', state: 'busy', message: `Loading ${packages.join(', ')}…` });
    try {
      await pyodide.loadPackage(packages, { messageCallback: () => {}, errorCallback: () => {} });
    } catch {
      // A package that fails here is loaded (or reported) on first import.
    }
    post({ type: 'status', state: 'ready', message: 'Python is ready.' });
  }
}

async function run({ runId, code, filename }) {
  currentRunId = runId;
  runChars = 0;
  truncatedNotice = false;
  const started = performance.now();
  let status = 'error';
  try {
    const source = rewriteMagics(code);
    if (source !== code) await pyodide.loadPackage('micropip', { messageCallback: () => {} });
    await pyodide.loadPackagesFromImports(source, {
      messageCallback: (message) => post({ type: 'progress', runId, message }),
      errorCallback: (message) => post({ type: 'progress', runId, message }),
    });
    status = await runtime.run_cell(source, filename);
  } catch (err) {
    flushStreams();
    post({
      type: 'output',
      runId,
      item: { type: 'error', ename: 'LabRuntimeError', evalue: String(err && err.message ? err.message : err), traceback: String(err && err.stack ? err.stack : err) },
    });
    status = 'error';
  }
  flushStreams();
  post({ type: 'done', runId, status, durationMs: Math.round(performance.now() - started) });
  currentRunId = null;
}

self.onmessage = (event) => {
  const message = event.data || {};
  if (message.type === 'init') {
    chain = chain
      .then(() => init(message.packages || [], message.indexURL))
      .catch((err) => {
        post({ type: 'fatal', message: String(err && err.message ? err.message : err) });
        throw err;
      });
  } else if (message.type === 'run') {
    chain = chain.then(() => run(message));
  }
};
