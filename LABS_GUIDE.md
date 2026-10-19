# Labs guide

Labs is the hands-on part of the study site. A lab is a page of text cells and Python cells. The learner reads a short explanation, writes the code, runs it in the browser, and tests it. Labs are private and save online.

- Page: `/labs` (sign-in needed). One lab: `/labs/<id>`.
- Why it works this way: `LABS_ARCHITECTURE.md`.
- This file: how to use Labs, how to add a lab template, how to add a new kind of output or runtime, and how to deploy.

## 1. Use Labs

### Make a lab

Click **New lab** (or press `N` on the Labs page). Give a title. Optionally write what you want to understand. Then start from one of these:

| Start from | What you get |
|---|---|
| Blank lab | A goal cell, one code cell and an Observations cell |
| A template | A complete lab: explanations, demos with controls, exercises with tests |
| Study note | A lab that links to the note and starts with its goal. You write the code. Also from a note page: **▶ OPEN A LAB**. |
| File | A Jupyter notebook (`.ipynb`), a lab template (`.md`), a Python file (`.py`, cells split at `# %%`), or a lab file (`.lab.json`) |

### Work in a lab

| Action | How |
|---|---|
| Run a cell and go to the next | `Shift + Enter`, or the ▶ button |
| Run and stay | `Ctrl/⌘ + Enter` |
| Run and add a cell below | `Alt + Enter` |
| Run every cell | **Run all** (stops at the first error) |
| Run the cells above, then this one | Cell menu ⋯ |
| Stop a run | **Stop**. Python restarts, so run the earlier cells again. |
| Clear all variables | ↻ (Restart Python) |
| Edit a text cell | Double-click it, or **Edit**. `Esc` or `Shift + Enter` shows the formatted text. |
| Add a cell | Hover between two cells, then **+ Code** or **+ Text** |
| Undo a deleted cell | **Undo** in the message at the bottom |
| Save | Automatic, about one second after you stop typing. `Ctrl/⌘ + S` saves now. |
| All shortcuts | Press `?` |

The status next to the title tells the truth: **Saved** appears only after the server confirmed the save. If a save fails, the status says **Not saved** and the page tries again. Unsaved work is also kept in this browser; when you open the lab again, the page offers it back.

### Learn with the lab tools

| Tool | Use |
|---|---|
| Controls | A line such as `freq = 5  # @param {type:"slider", min:1, max:50, step:1}` shows a slider. Move it: the number in the code changes and the cell runs again. |
| `lab.check(name, actual, expected)` | Shows ✓ PASS or ✗ FAIL with the expected and the actual value. Floats and arrays use a tolerance (`tol=`, `rtol=`). `lab.check(name, condition)` passes when the condition is true. |
| `lab.inspect(value, name)` | Shows the type, shape, dtype, min, max, mean and std of a value. Returns the value. |
| `lab.show(value)` | Shows a value now (a table, a figure, a repr), not only at the end of the cell. |
| Pin | The pin button on a code cell keeps its current output. Change a control, run again, and compare **Now** with the pinned result side by side. Up to 3 pins. |
| Objectives | The checklist at the top. Tick an objective when you can do it without help. |
| Versions | The Versions button (clock icon) saves a named version (code and text, no outputs). **Restore** brings it back; the state before the restore is saved as a version first. |
| Reset | Cell menu: **Reset to the starter code**. Lab menu: **Reset the lab to its starter**. A version is saved first. |
| Status | Lab menu: **Mark as done**. A lab becomes **In progress** when you first run a cell. |
| Export | Lab menu: `.ipynb` (for GitHub), `.py`, `.md` (a template), `.lab.json` (everything). |
| Archive | Hides a lab from the main list and keeps it. **Delete** removes the lab and its versions forever. |

### What the Python runtime can do

- Python 3.14 (Pyodide 314.0.7), running in a Web Worker in your browser. Nothing runs on the server.
- These packages load on the first `import`: NumPy, SciPy, matplotlib, pandas, scikit-learn, NetworkX, SymPy, pydantic and the other [Pyodide packages](https://pyodide.org/en/stable/usage/packages-in-pyodide.html).
- Pure-Python packages from PyPI: `%pip install name` on its own line.
- matplotlib figures appear after `plt.show()` or at the end of the cell.
- Top-level `await` works.
- `input()` does not work. Use a `# @param` control.
- Network: only jsDelivr, PyPI and `raw.githubusercontent.com` (for example a CSV file). Not this site.
- Files: an in-memory disk. It is empty after a restart.
- Time limit: 120 s for one cell (lab menu → **Lab details and settings**, 10 s to 30 min). At the limit the page stops Python.
- The first start downloads about 10 MB. After that the browser cache makes it fast.

## 2. Add a lab template

A template is one Markdown file in `src/labs/templates/`. The Labs page finds every file there at build time. Nothing else changes.

### Steps

1. Copy a template, for example `src/labs/templates/fft-explorer.md`, to `src/labs/templates/<id>.md`. Use lowercase words and hyphens for `<id>`.
2. Change the frontmatter (table below).
3. Write the cells (rules below).
4. Run `npm test`. The test parses every template and checks the cells.
5. Run `npm run dev`, open `/labs/new?template=<id>`, make the lab, and click **Run all**. It must run until the first exercise and stop there with `NotImplementedError`.
6. Solve the exercises once in the lab, to check that the tests can pass. Do not save the solution in the template.

### Frontmatter

```yaml
---
title: "FFT explorer: from samples to a spectrum"
summary: "One sentence. It shows on the template card and becomes the lab description."
collection: "Maths"
tags: [fft, signal-processing, numpy]
packages: [numpy, matplotlib]
level: "Beginner"
order: 10
objectives:
  - "Compute the frequency in Hz of FFT bin k from fs and N."
  - "Write the DFT and match np.fft.fft."
---
```

| Field | Rule |
|---|---|
| `title` | Required. In double quotes. |
| `summary` | Required. One sentence. |
| `collection` | The group on the Labs page, for example `Maths`, `AI`, `Machine Learning`, `Algorithms`. |
| `tags` | Inline list. Lowercase. |
| `packages` | Pyodide packages to load when the lab opens, so the first run is fast. Optional. |
| `level` | `Beginner`, `Intermediate` or `Advanced`. Shown on the card. |
| `order` | Position in the template list. |
| `objectives` | What the learner can do at the end. One testable skill each. Up to 12. |
| `id`, `runtime` | Optional. `id` defaults to the file name. `runtime` defaults to `python`. |

The parser is the notes parser: one `key: value` per line, no nested YAML.

### Cells

- A fence ` ```python ` at the start of a line becomes a **code cell**.
- All other text becomes a **text cell**: Markdown, `$math$`, `$$` blocks, tables, ` ```mermaid `, ` ```plot `, ` ```check ` and callouts work, as in the notes (`NOTES_GUIDE.md`).
- A line `<!-- cell -->` starts a new text cell.
- A ` ```python ` fence inside another fence (for example inside ` ````text `) stays text.

### How to write a good template

1. **Explore first, then build.** Start with a working demo with controls, so the learner sees the idea move. Then give the exercises.
2. **The learner writes the code.** An exercise is a function stub with a docstring and `raise NotImplementedError("Write name(args)")`, followed by a cell of `lab.check` tests. Never put the solution in the template.
3. **Hints in three levels.** Put them in a ` ```check ` block after the stub: `question` = "Stuck?", `hint` = the idea, `answer` = pseudocode or the key line. The learner opens them only when needed.
4. **Tests test behaviour.** Check shapes, edge cases (empty input, large numbers, zero vectors) and known values computed outside the lab. Do not compute the expected value with the same formula the learner must write.
5. **Use the learner's code in the last demo.** A final cell with controls that calls the learner's functions turns the exercise into an experiment.
6. **End with Observations.** Two or three questions that ask "why", in a text cell.
7. **Write simply.** Short sentences, one idea each, every term explained, like the notes.

### Controls syntax

| Line | Control |
|---|---|
| `n = 64  # @param {type:"slider", min:16, max:512, step:16}` | Slider |
| `rate = 0.01  # @param {type:"number"}` | Number field |
| `k = 3  # @param {type:"integer"}` | Whole-number field |
| `show = True  # @param {type:"boolean"}` | Checkbox |
| `name = "hann"  # @param ["none", "hann", "hamming"]` | Dropdown |
| `text = "hello"  # @param {type:"string"}` | Text field |
| `gain = 2.5  # @param` | Type from the value |

Add `label:"shown name"` to show a different name. The value must be a literal (a number, `True`/`False`, or a string), not an expression.

## 3. Extend Labs

### A new kind of output

1. Add the type to `OUTPUT_TYPES` and a case to `normalizeOutput` in `src/lib/labs/schema.js` (this limits sizes and removes unknown fields).
2. Add a renderer to `RENDERERS` in `src/labs/components/Outputs.jsx`.
3. Emit it from Python with `emit({...})` in `RUNTIME_PY` in `public/labs-runtime/python-worker.mjs`, and add a helper to `LAB_PY` (the `lab` module) if learners should call it.
4. Add a case to `outputToJupyter` in `src/lib/labs/ipynb.js`, so export keeps it.
5. Add a test in `tests/labs/`.

### A new runtime (for example JavaScript)

1. Write a session class with the interface at the top of `src/labs/runtimes/pyodide.js`: `start()`, `run(code, { onOutput, onProgress, timeoutMs })`, `stop()`, `restart()`, `dispose()`, and `onStateChange`. It must send the same output items.
2. For JavaScript, run the code in `<iframe sandbox="allow-scripts" srcdoc="...">` (no `allow-same-origin`), talk to it with `postMessage`, and remove the iframe to stop it.
3. Register it in `src/labs/runtimes/index.js` with `createSession` and `loadEditorLanguage` (for example `@codemirror/lang-javascript`).
4. Add its id to `RUNTIME_IDS` in `src/lib/labs/schema.js`.
5. Templates select it with `runtime: javascript` in the frontmatter.

### A remote runtime (real processes, network servers)

For labs that need things a browser cannot do (an MCP server over stdio, a LangGraph agent that calls a model with an API key), add a `remote-python` runtime:

1. A new API route that creates a [Vercel Sandbox](https://vercel.com/docs/sandbox) microVM per session, runs the cell, and streams the output back. It must check the Labs session, set a time limit and a memory limit, and never pass the site's own secrets into the sandbox.
2. A session class (as above) that calls that route.
3. A monthly budget. The Hobby plan includes 5 active CPU hours a month and 45-minute sessions.

## 4. Deploy

Labs needs the Upstash Redis database that the site already uses for blog subscriptions, and two new variables.

1. In the Vercel project, open **Settings → Environment Variables**.
2. Check that `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` exist (Storage → Upstash adds them).
3. Add `LABS_PASSWORD`: the owner password. At least 12 characters; use 16 or more random characters.
4. Add `LABS_SESSION_SECRET`: 32 or more random characters. One way to make it:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

5. Deploy. Open `/labs` and sign in.

| Variable | Required | Purpose |
|---|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Yes | Storage (already set for subscriptions) |
| `LABS_PASSWORD` | Yes | The password for `/labs`. Changing it signs every session out. |
| `LABS_SESSION_SECRET` | Yes | Signs the session cookie. Changing it signs every session out. |
| `VITE_LABS_PYODIDE_URL` | No | Load Pyodide from another place than jsDelivr (section 6) |

There is no migration: Labs uses new keys that start with `labs:v1:`. Without the variables, `/labs` shows "not set up" and the rest of the site is unchanged.

`vercel.json` holds two Labs entries. Keep them:

1. The rewrite `/api/labs/:path*` → `/api/labs`. It must stay before the `/(.*)` rewrite.
2. The `Content-Security-Policy` header for `/labs-runtime/(.*)`. It must match `src/lib/labs/worker-csp.js` (a test checks this). To let lab code fetch from another host, add the host to `connect-src` in both places.

## 5. Develop and test

```bash
npm install
npm run dev      # /labs works; the API runs inside the dev server
npm test         # unit and integration tests (node --test)
npm run lint
```

In `npm run dev`:

- With no Labs variables, the data is in memory (lost when the server stops) and you are signed in as user `dev`. A banner says so.
- With `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.local`, the real database is used (`LABS_DEV_STORE=memory` forces the memory store).
- With `LABS_PASSWORD` and `LABS_SESSION_SECRET` in `.env.local`, sign-in works as in production.

`npm test` also runs the Redis store against a real Redis when `redis-server` is installed (through a local Upstash REST stand-in). Without it, that test is skipped.

End-to-end test in a real browser:

```bash
npm i -D playwright && npx playwright install chromium
PYODIDE_DIR=/path/to/pyodide-314.0.7 npm run test:e2e            # macOS, Linux
$env:PYODIDE_DIR="C:\path\to\pyodide"; npm run test:e2e      # Windows PowerShell
```

It needs `redis-server`. `PYODIDE_DIR` is an unpacked full Pyodide release; without it the browser loads Pyodide from jsDelivr.

## 6. Troubleshooting

| Problem | Cause and fix |
|---|---|
| "Labs is not set up on this server yet" | A variable of section 4 is missing. The page lists which. |
| "Python could not start" | The browser cannot reach `cdn.jsdelivr.net` (for example a company network). Self-host Pyodide: unpack the full release (`pyodide-314.0.7.tar.bz2` from GitHub) on a static host with CORS, set `VITE_LABS_PYODIDE_URL` to its URL (ending with `/`), add that origin to `script-src` and `connect-src` in `vercel.json` and `src/lib/labs/worker-csp.js`, and deploy. |
| "This lab changed in another tab or on another device" | Two copies were edited. **Keep mine** saves this tab and keeps the other copy as a version. **Use the other copy** loads it and saves this tab as a new lab. Nothing is lost either way. |
| "This lab is … MB, and the limit is 3.5 MB" | Outputs (images, long prints) are too large. Lab menu → **Clear all outputs**, or print less. |
| A cell stops after the time limit | Raise it in **Lab details and settings**, or make the code faster. |
| `ModuleNotFoundError` | The package is not in Pyodide. For a pure-Python package, run `%pip install name` first. |

## 7. Files

| Path | What it is |
|---|---|
| `src/pages/LabsPage.jsx` | `/labs/*` route, sign-in, "not set up" |
| `src/labs/components/` | Labs page, workspace, cells, editor, outputs, controls, versions, dialogs |
| `src/labs/lab-document.js` | One open lab: edits, autosave, conflicts, drafts |
| `src/labs/lab-runner.js` | Runs cells through the runtime |
| `src/labs/runtimes/` | Runtime registry and the Pyodide session |
| `src/labs/templates/*.md` | Templates |
| `src/lib/labs/` | Shared with the API: validation (`schema.js`), controls (`params.js`), Markdown and `.py` format, `.ipynb`, worker CSP |
| `public/labs-runtime/python-worker.mjs` | The Python worker and the `lab` helper module |
| `api/labs.js`, `api/_lib/labs/` | The API: routes, sign-in, Redis store, memory store |
| `plugins/vite-plugin-labs-api.js` | The API inside `npm run dev` |
| `tests/labs/`, `tests/e2e/` | Tests |
