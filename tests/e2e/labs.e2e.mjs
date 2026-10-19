// tests/e2e/labs.e2e.mjs
// ============================================================
// End-to-end test of Labs in a real browser (Chromium, Playwright).
// It starts: redis-server + a local Upstash REST stand-in, the Vite
// dev server (with the Labs API plugin and password sign-in), and a
// local static server for Pyodide.
//
// Run (needs redis-server, the `playwright` package and Chromium):
//   npm i -D playwright && npx playwright install chromium
//   PYODIDE_DIR=/path/to/pyodide-314.0.7 node tests/e2e/labs.e2e.mjs
// PYODIDE_DIR: an unpacked full Pyodide release
// (github.com/pyodide/pyodide/releases, pyodide-314.0.7.tar.bz2).
// Without it the browser loads Pyodide from jsDelivr.
// SCREENSHOTS=dir saves screenshots of the main screens.
// ============================================================
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { startUpstashShim } from '../labs/support/upstash-shim.mjs';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('The `playwright` package is not installed. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PASSWORD = 'e2e password 12345';
const SHOTS = process.env.SCREENSHOTS || '';
const MIME = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json', '.zip': 'application/zip', '.whl': 'application/zip', '.tar': 'application/x-tar' };

function step(name) {
  console.log(`\n▶ ${name}`);
}

async function startStatic(dir) {
  const server = http.createServer((req, res) => {
    const file = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
      return res.end('not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'max-age=3600' });
    fs.createReadStream(file).pipe(res);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}

const shim = await startUpstashShim();
let pyodideServer = null;
if (process.env.PYODIDE_DIR) {
  pyodideServer = await startStatic(path.resolve(process.env.PYODIDE_DIR));
  process.env.VITE_LABS_PYODIDE_URL = pyodideServer.url;
}
Object.assign(process.env, {
  UPSTASH_REDIS_REST_URL: shim.url,
  UPSTASH_REDIS_REST_TOKEN: shim.token,
  LABS_PASSWORD: PASSWORD,
  LABS_SESSION_SECRET: 'e2e-secret-'.padEnd(48, 'x'),
});

const { createServer } = await import('vite');
const vite = await createServer({ root: ROOT, configFile: path.join(ROOT, 'vite.config.js'), server: { port: 0, host: '127.0.0.1', strictPort: false }, logLevel: 'warn' });
await vite.listen();
const BASE = `http://127.0.0.1:${vite.httpServer.address().port}`;
console.log('dev server', BASE, 'pyodide', process.env.VITE_LABS_PYODIDE_URL || 'jsDelivr');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await context.newPage();
const consoleLines = [];
page.on('console', (m) => consoleLines.push(`${m.type()}: ${m.text()}`));
page.on('worker', (w) => w.on('console', (m) => consoleLines.push(`worker ${m.type()}: ${m.text()}`)));
page.on('pageerror', (e) => consoleLines.push(`pageerror: ${e.message}`));
const shot = async (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });

const cellByIndex = (p, i) => p.locator('article.labs-cell').nth(i);
const codeCells = (p) => p.locator('article.labs-cell-code');
async function setEditor(cell, text) {
  await cell.locator('.cm-content').click();
  await cell.page().keyboard.press('ControlOrMeta+a');
  await cell.page().keyboard.press('Delete');
  await cell.page().keyboard.insertText(text);
}
async function waitSaved(p) {
  await p.locator('.labs-save', { hasText: /^Saved/ }).waitFor({ timeout: 15000 });
}
async function runCell(cell) {
  await cell.locator('button.is-run').click();
  await cell.locator('.labs-gutter-count.is-running').waitFor({ state: 'detached', timeout: 120000 }).catch(() => {});
  await cell.page().waitForFunction((el) => !el.classList.contains('is-running') && !el.classList.contains('is-queued'), await cell.elementHandle(), { timeout: 120000 });
}

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`  ✗ ${name}\n    ${String(err && err.message ? err.message : err).split('\n').slice(0, 6).join('\n    ')}`);
  }
}

try {
  step('Sign in');
  await page.goto(`${BASE}/labs`);
  await check('sign-in page shows for a new visitor', () => page.getByRole('heading', { name: 'Labs are private' }).waitFor({ timeout: 20000 }));
  await page.getByLabel('Password').fill('wrong password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await check('a wrong password is refused', () => page.getByText(/Wrong password/).waitFor());
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await check('empty state after sign-in', () => page.getByRole('heading', { name: 'Your first lab' }).waitFor());
  await shot(page, '01-empty');

  step('Create a lab from the FFT template');
  await page.getByRole('button', { name: /New lab/ }).first().click();
  await page.getByRole('heading', { name: 'New lab' }).waitFor();
  await page.getByRole('radio', { name: /FFT explorer/ }).click();
  await check('title is filled from the template', async () => assert.match(await page.getByLabel('Title', { exact: true }).inputValue(), /FFT explorer/));
  await shot(page, '02-new-lab');
  await page.getByRole('button', { name: 'Create lab' }).click();
  await page.waitForURL(/\/labs\/[A-Za-z0-9]{12}$/);
  const labUrl = page.url();
  await check('workspace opens with the title', () => page.locator('.labs-ws-title', { hasText: 'FFT explorer' }).waitFor());
  await check('objectives are listed', () => page.getByText(/OBJECTIVES · 0 OF 4 DONE/).waitFor());

  step('Python starts and runs the first code cell');
  await check('runtime becomes ready', () => page.getByText('PYTHON · READY').waitFor({ timeout: 120000 }));
  const first = codeCells(page).nth(0);
  await check('controls are shown for # @param lines', async () => assert.equal(await first.locator('.labs-param').count(), 6));
  await runCell(first);
  await check('the cell prints text', () => first.locator('.labs-out-stream', { hasText: 'Bin spacing fs / N = 1.000 Hz' }).waitFor({ timeout: 60000 }));
  await check('the cell draws a matplotlib figure', () => first.locator('img.labs-out-image').waitFor());
  await check('execution count is 1', () => first.locator('.labs-gutter-count', { hasText: '[1]' }).waitFor());
  await shot(page, '03-first-run');

  step('A control rewrites the code and runs the cell again');
  await first.getByLabel('frequency 1 (Hz)').evaluate((el) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '9');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await check('code now says f1 = 9.0', () => first.locator('.cm-content', { hasText: 'f1 = 9.0' }).waitFor());
  await check('the cell ran again (count 2)', () => first.locator('.labs-gutter-count', { hasText: '[2]' }).waitFor({ timeout: 60000 }));

  step('Pin a result and compare');
  await first.getByRole('button', { name: /Pin the result of/ }).click();
  await check('compare panel shows the pinned result', () => first.getByText('COMPARE · NOW vs PINNED').waitFor());
  await check('pin label holds the parameter values', () => first.locator('.labs-pin-label', { hasText: 'f1=9' }).waitFor());

  step('The DFT exercise: first it fails, then the learner implements it');
  const dftCell = codeCells(page).nth(1);
  const tests = codeCells(page).nth(2);
  await runCell(dftCell);
  await runCell(tests);
  await check('the tests fail with NotImplementedError before the code exists', () => tests.locator('.labs-out-error', { hasText: 'NotImplementedError' }).waitFor());
  await setEditor(
    dftCell,
    'def dft(x):\n    x = np.asarray(x, dtype=complex)\n    N = len(x)\n    n = np.arange(N)\n    return np.exp(-2j * np.pi * np.outer(n, n) / max(N, 1)) @ x\n',
  );
  await runCell(dftCell);
  await runCell(tests);
  await check('all 4 checks pass', () => tests.getByText('4 OF 4 CHECKS PASS').waitFor());
  await check('a PASS badge is shown', async () => assert.equal(await tests.locator('.labs-out-check.is-pass').count(), 4));
  await shot(page, '04-checks');

  step('Errors show a clean traceback');
  const binCell = codeCells(page).nth(3);
  await runCell(binCell);
  await check('traceback starts at the cell, not in the runtime', async () => {
    const tb = await binCell.locator('.labs-out-error pre').innerText();
    assert.match(tb, /File "<cell-\d+>", line \d+/);
    assert.doesNotMatch(tb, /_lab_runtime|_pyodide/);
  });

  step('Autosave and reload');
  await check('save status reaches Saved', () => waitSaved(page));
  await page.reload();
  await check('implementation persists after reload', () => codeCells(page).nth(1).locator('.cm-content', { hasText: 'np.outer(n, n)' }).waitFor({ timeout: 20000 }));
  await check('outputs persist after reload', () => codeCells(page).nth(2).getByText('4 OF 4 CHECKS PASS').waitFor());
  await check('the pinned result persists', () => codeCells(page).nth(0).getByText('COMPARE · NOW vs PINNED').waitFor());
  await check('the control value persists', async () => assert.equal(await codeCells(page).nth(0).getByLabel('frequency 1 (Hz)').inputValue(), '9'));

  step('Text cells');
  await page.locator('.labs-insert').last().getByRole('button', { name: '+ Text' }).click();
  const textArea = page.locator('textarea.labs-md-editor').last();
  await textArea.fill('## My observation\n\nLeakage appears at **5.5 Hz**.');
  await textArea.press('Escape');
  await check('markdown renders', () => page.locator('.labs-md h2', { hasText: 'My observation' }).waitFor());

  step('Python state, stop, time limit, input() and the security policy');
  await page.locator('.labs-insert').last().getByRole('button', { name: '+ Code' }).click();
  const scratch = codeCells(page).last();
  await setEditor(scratch, 'x = 41\nx + 1');
  await runCell(scratch);
  await check('last expression is shown', () => scratch.locator('.labs-out-result', { hasText: '42' }).waitFor());
  await setEditor(scratch, 'import time\nwhile True:\n    time.sleep(0.01)');
  await scratch.locator('button.is-run').click();
  await scratch.locator('.labs-gutter-count.is-running').waitFor();
  await page.getByRole('button', { name: /Stop/ }).click();
  await check('Stop ends the run and says Python restarted', () => scratch.getByText(/Stopped\. Python restarted/).waitFor({ timeout: 10000 }));
  await setEditor(scratch, 'x');
  await runCell(scratch);
  await check('variables are gone after a stop', () => scratch.locator('.labs-out-error', { hasText: "NameError" }).waitFor({ timeout: 60000 }));
  await setEditor(scratch, 'input("name? ")');
  await runCell(scratch);
  await check('input() explains the alternative', () => scratch.locator('.labs-out-error', { hasText: '@param' }).waitFor());
  if (process.env.VITE_LABS_PYODIDE_URL) {
    await setEditor(scratch, `from js import fetch\nr = await fetch("${process.env.VITE_LABS_PYODIDE_URL}pyodide-lock.json")\nr.status`);
    await runCell(scratch);
    await check('lab code can fetch from an allowed origin (control)', () => scratch.locator('.labs-out-result', { hasText: '200' }).waitFor());
  }
  await setEditor(scratch, 'from js import fetch\nr = await fetch("/api/labs")\nr.status');
  await runCell(scratch);
  await check('lab code cannot call the Labs API (worker CSP)', async () => {
    await scratch.locator('.labs-out-error').waitFor();
    assert.equal(await scratch.locator('.labs-out-result').count(), 0);
    console.log(`    error shown: ${(await scratch.locator('.labs-out-error-head').innerText()).slice(0, 120)}`);
  });
  await setEditor(scratch, 'import lab\nlab.inspect([1, 2, 3], "numbers")\nlab.check("one plus one", 1 + 1, 2)');
  await runCell(scratch);
  await check('lab.inspect and lab.check render', async () => {
    await scratch.locator('.labs-out-inspect', { hasText: 'numbers' }).waitFor();
    await scratch.locator('.labs-out-check.is-pass').waitFor();
  });
  await setEditor(
    scratch,
    'class Evil:\n    def _repr_html_(self):\n        return "<img src=x onerror=\\"window.__pwned=1\\"><script>window.__pwned=2</script><table><tr><td colspan=2 onclick=alert(1)>ok</td></tr></table>"\nEvil()',
  );
  await runCell(scratch);
  await check('HTML output is sanitized (table kept, script and handlers removed)', async () => {
    await scratch.locator('.labs-out-html td', { hasText: 'ok' }).waitFor();
    assert.equal(await scratch.locator('.labs-out-html img, .labs-out-html script').count(), 0);
    assert.equal(await scratch.locator('.labs-out-html td').getAttribute('onclick'), null);
    assert.equal(await scratch.locator('.labs-out-html td').getAttribute('colspan'), '2');
    assert.equal(await page.evaluate(() => window.__pwned), undefined);
  });
  if (process.env.VITE_LABS_PYODIDE_URL) {
    await setEditor(scratch, 'import pandas as pd\ndf = pd.DataFrame({"freq": [5, 12], "mag": [0.5, 0.25]})\ndf');
    await runCell(scratch);
    await check('a pandas DataFrame renders as a table', () => scratch.locator('.labs-out-html table th', { hasText: 'freq' }).waitFor({ timeout: 90000 }));
    await setEditor(scratch, 'lab.inspect(df, "df")');
    await runCell(scratch);
    await check('a final lab.inspect() does not echo its value', async () => {
      await scratch.locator('.labs-out-inspect', { hasText: 'columns' }).waitFor();
      assert.equal(await scratch.locator('.labs-out-result, .labs-out-html').count(), 0);
    });
  }
  await setEditor(scratch, 'import lab\nlab.check("returns a CheckResult", True)');
  await runCell(scratch);
  await check('a final lab.check() is not echoed as True', async () => {
    await scratch.locator('.labs-out-check.is-pass').waitFor();
    assert.equal(await scratch.locator('.labs-out-result').count(), 0);
  });
  // Time limit: set it to 10 s in the lab settings.
  await page.getByRole('button', { name: 'Lab actions' }).click();
  await page.getByRole('menuitem', { name: /Lab details and settings/ }).click();
  await page.getByLabel('Time limit for one cell (seconds)').fill('10');
  await page.getByRole('button', { name: 'Save details' }).click();
  await page.getByRole('heading', { name: 'Lab details' }).waitFor({ state: 'hidden' });
  await setEditor(scratch, 'while True:\n    pass');
  const t0 = Date.now();
  await scratch.locator('button.is-run').click();
  await check('the time limit stops a runaway loop', () => scratch.getByText(/Stopped after 10 s/).waitFor({ timeout: 30000 }));
  console.log(`    (stopped after ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  await shot(page, '05-workspace');

  step('Versions');
  await waitSaved(page);
  await page.getByRole('button', { name: 'Versions', exact: true }).click();
  await page.getByLabel('Name of the new version').fill('first working DFT');
  await page.getByRole('button', { name: 'Save version' }).click();
  await check('the version is listed', () => page.locator('.labs-version-label', { hasText: 'first working DFT' }).waitFor());
  await setEditor(scratch, 'print("changed after the version")');
  await waitSaved(page);
  await page.locator('.labs-version', { hasText: 'first working DFT' }).getByRole('button', { name: 'Restore' }).click();
  await check('restore brings the old code back', () => codeCells(page).last().locator('.cm-content', { hasText: 'while True' }).waitFor());
  await check('an automatic version keeps the state before restore', () => page.locator('.labs-version-label', { hasText: /Before restoring/ }).waitFor());
  await shot(page, '06-versions');
  await page.getByRole('button', { name: 'Close versions' }).click();

  step('Keyboard, rename, objectives, status, export, reset');
  await setEditor(scratch, 'print("shift enter works")');
  const scratchId = await scratch.getAttribute('data-cell-id');
  await scratch.locator('.cm-content').press('Shift+Enter');
  const ran = page.locator(`article[data-cell-id="${scratchId}"]`);
  await check('Shift+Enter runs the cell', () => ran.locator('.labs-out-stream', { hasText: 'shift enter works' }).waitFor({ timeout: 60000 }));
  await check('Shift+Enter on the last cell adds a new code cell with focus', async () => {
    await page.waitForFunction(() => document.activeElement && document.activeElement.closest('article.labs-cell') === [...document.querySelectorAll('article.labs-cell')].pop());
  });
  await page.locator('body').click({ position: { x: 5, y: 300 } });
  await page.keyboard.press('?');
  await check('? opens the shortcuts', () => page.getByRole('heading', { name: 'Keyboard shortcuts' }).waitFor());
  await page.keyboard.press('Escape');
  await page.locator('.labs-title-button').click();
  await page.getByLabel('Lab title').fill('My FFT lab');
  await page.getByLabel('Lab title').press('Enter');
  await check('rename from the title', () => page.locator('.labs-ws-title', { hasText: 'My FFT lab' }).waitFor());
  await page.getByRole('checkbox', { name: /Compute the frequency in Hz/ }).check();
  await check('ticking an objective updates the count', () => page.getByText('OBJECTIVES · 1 OF 4 DONE').waitFor());
  await page.getByRole('button', { name: 'Lab actions' }).click();
  await page.getByRole('menuitem', { name: 'Mark as done' }).click();
  await check('mark as done', () => page.getByText(/Marked as done/).waitFor());
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    (async () => {
      await page.getByRole('button', { name: 'Lab actions' }).click();
      await page.getByRole('menuitem', { name: /Jupyter notebook/ }).click();
    })(),
  ]);
  const nbPath = await download.path();
  const notebook = JSON.parse(fs.readFileSync(nbPath, 'utf8'));
  await check('export gives a valid nbformat 4 notebook with outputs', async () => {
    assert.equal(notebook.nbformat, 4);
    assert.match(download.suggestedFilename(), /^my-fft-lab\.ipynb$/);
    assert.ok(notebook.cells.some((c) => c.cell_type === 'code' && c.outputs.some((o) => o.output_type === 'stream' && o.text.join('').includes('shift enter works'))));
    assert.ok(notebook.cells.some((c) => c.cell_type === 'markdown'));
  });
  await waitSaved(page);
  const cellsBefore = await page.locator('article.labs-cell').count();
  await page.getByRole('button', { name: 'Lab actions' }).click();
  await page.getByRole('menuitem', { name: /Reset the lab to its starter/ }).click();
  await page.getByRole('button', { name: 'Reset the lab' }).click();
  await check('reset brings back the starter cells', async () => {
    await page.getByText(/back at its starter state/).waitFor();
    assert.ok((await page.locator('article.labs-cell').count()) < cellsBefore);
    await codeCells(page).nth(1).locator('.cm-content', { hasText: 'NotImplementedError' }).waitFor();
  });
  await check('the state before the reset is a version', async () => {
    await page.getByRole('button', { name: 'Versions', exact: true }).click();
    await page.locator('.labs-version-label', { hasText: 'Before reset' }).waitFor();
    await page.getByRole('button', { name: 'Close versions' }).click();
  });
  await check('the title and objectives survive a reset', async () => {
    await page.locator('.labs-ws-title', { hasText: 'My FFT lab' }).waitFor();
    await page.getByText('OBJECTIVES · 1 OF 4 DONE').waitFor();
  });

  step('Save failures are shown and retried');
  await waitSaved(page);
  await page.route('**/api/labs/*/content', (r) => r.abort());
  await setEditor(scratch, 'print("offline edit")');
  await check('a failed save says so', () => page.locator('.labs-save.is-bad', { hasText: /Not saved/ }).waitFor({ timeout: 15000 }));
  await page.unroute('**/api/labs/*/content');
  await page.locator('.labs-save').getByRole('button', { name: 'Retry now' }).click();
  await check('retry saves it', () => waitSaved(page));

  step('Conflict between two tabs');
  const other = await context.newPage();
  await other.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await other.goto(labUrl);
  await codeCells(other).last().locator('.cm-content').waitFor();
  await setEditor(codeCells(other).last(), 'print("from tab B")');
  await waitSaved(other);
  await setEditor(scratch, 'print("from tab A")');
  await check('tab A sees the conflict', () => page.getByText('This lab changed in another tab or on another device.').waitFor({ timeout: 15000 }));
  await page.getByRole('button', { name: 'Keep mine' }).click();
  await check('Keep mine saves tab A', () => waitSaved(page));
  await other.reload();
  await check('tab B now has tab A code', () => codeCells(other).last().locator('.cm-content', { hasText: 'from tab A' }).waitFor({ timeout: 20000 }));
  await other.close();

  step('Labs page: list, search, duplicate, archive, delete');
  await page.goto(`${BASE}/labs`);
  await check('the lab is listed', () => page.locator('.labs-card-title', { hasText: 'My FFT lab' }).waitFor());
  await check('Continue card links to it', () => page.getByText('CONTINUE WHERE YOU STOPPED').waitFor());
  await check('status shows done', () => page.locator('.labs-card .labs-status', { hasText: 'DONE' }).waitFor());
  await page.keyboard.press('/');
  await check('/ focuses the search', async () => assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Search labs'));
  await page.getByLabel('Search labs').fill('zzzz');
  await check('search filters', () => page.getByText('No lab matches.').waitFor());
  await page.getByLabel('Search labs').fill('');
  await page.getByRole('button', { name: /Actions for My FFT lab/ }).click();
  await page.getByRole('menuitem', { name: 'Duplicate' }).click();
  await check('duplicate appears', () => page.locator('.labs-card-title', { hasText: '(copy)' }).waitFor());
  await page.getByRole('button', { name: /Actions for .*\(copy\)/ }).click();
  await page.getByRole('menuitem', { name: 'Archive' }).click();
  await check('archived lab leaves the Active list', async () => {
    await page.getByText(/Archived “/).waitFor();
    assert.equal(await page.locator('.labs-card-title', { hasText: '(copy)' }).count(), 0);
  });
  await page.getByRole('button', { name: 'Archived', exact: true }).click();
  await check('it is in the Archived filter', () => page.locator('.labs-card-title', { hasText: '(copy)' }).waitFor());
  await page.getByRole('button', { name: /Actions for .*\(copy\)/ }).click();
  await page.getByRole('menuitem', { name: /Delete/ }).click();
  await page.getByRole('button', { name: 'Delete forever' }).click();
  await check('deleted lab is gone', async () => {
    await page.getByText(/Deleted “/).waitFor();
    assert.equal(await page.locator('.labs-card-title', { hasText: '(copy)' }).count(), 0);
  });
  await page.getByRole('button', { name: 'Active', exact: true }).click();
  await shot(page, '07-home');

  step('Import a notebook');
  await page.keyboard.press('n');
  await page.getByRole('heading', { name: 'New lab' }).waitFor();
  await page.getByRole('tab', { name: 'File' }).click();
  await page.getByLabel('File to import').setInputFiles({ name: 'exported.ipynb', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(notebook)) });
  await check('the import is summarised', () => page.getByText(/exported\.ipynb: \d+ code cells/).waitFor());
  await page.getByLabel('Title', { exact: true }).fill('Imported notebook');
  await page.getByRole('button', { name: 'Create lab' }).click();
  await page.waitForURL(/\/labs\/[A-Za-z0-9]{12}$/);
  await check('imported cells and outputs appear', async () => {
    await page.locator('.labs-ws-title', { hasText: 'Imported notebook' }).waitFor();
    await page.locator('.labs-out-stream', { hasText: 'shift enter works' }).first().waitFor();
    assert.equal(await codeCells(page).count(), notebook.cells.filter((c) => c.cell_type === 'code').length);
  });

  step('Every template runs in Pyodide until the first exercise');
  const templateIds = fs.readdirSync(path.join(ROOT, 'src/labs/templates')).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
  for (const id of templateIds) {
    await page.goto(`${BASE}/labs/new?template=${id}`);
    await page.getByRole('button', { name: 'Create lab' }).click();
    await page.waitForURL(/\/labs\/[A-Za-z0-9]{12}$/);
    await page.getByText('PYTHON · READY').waitFor({ timeout: 120000 });
    await page.getByRole('button', { name: /Run all/ }).click();
    await page.waitForFunction(() => document.querySelector('.labs-runtime')?.className.includes('is-ready') && !document.querySelector('.labs-cell.is-running, .labs-cell.is-queued'), null, { timeout: 180000 });
    await check(`${id}: runs until the first exercise stub`, async () => {
      const errors = await page.locator('.labs-out-error-head').allInnerTexts();
      assert.equal(errors.length, 1, `errors: ${JSON.stringify(errors)}`);
      assert.match(errors[0], /^NotImplementedError: Write /);
      assert.ok((await page.locator('.labs-cell-code .labs-gutter-count.is-ok').count()) >= 1, 'at least one cell ran without error');
    });
    if (id === 'attention-from-scratch') await shot(page, '10-template-attention');
  }

  step('From a note: Notes still works and links into Labs');
  await page.goto(`${BASE}/notes`);
  await check('notes home renders', () => page.locator('.notes-h1', { hasText: 'Notes' }).waitFor({ timeout: 30000 }));
  await page.goto(`${BASE}/notes/maths/fft-signal-processing`);
  const firstNote = page.locator('.notes-child-row').filter({ hasNot: page.locator('.notes-folder-icon') }).first();
  await firstNote.click();
  await check('a note page renders with OPEN A LAB', () => page.getByRole('link', { name: /OPEN A LAB/ }).waitFor());
  await page.getByRole('link', { name: /OPEN A LAB/ }).click();
  await check('the new-lab dialog opens on the note', () => page.getByRole('tab', { name: 'Study note', selected: true }).waitFor());
  await check('the title is suggested from the note', () => page.waitForFunction(() => /^Lab: /.test(document.querySelector('dialog[open] input[type="text"]')?.value || ''), null, { timeout: 10000 }));
  await page.getByRole('button', { name: 'Create lab' }).click();
  await page.waitForURL(/\/labs\/[A-Za-z0-9]{12}$/);
  await check('the lab links back to the note', () => page.getByRole('link', { name: /Study note/ }).first().waitFor());

  step('Sign out');
  await page.goto(`${BASE}/labs`);
  await page.getByRole('button', { name: 'SIGN OUT' }).click();
  await check('signed out', () => page.getByRole('heading', { name: 'Labs are private' }).waitFor());

  step('Phone layout');
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await phone.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const mp = await phone.newPage();
  await mp.goto(`${BASE}/labs`);
  await mp.getByLabel('Password').fill(PASSWORD);
  await mp.getByRole('button', { name: 'Sign in' }).click();
  await mp.locator('.labs-card').first().waitFor();
  await check('no horizontal scroll on the phone home page', async () => assert.ok(await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)));
  if (SHOTS) await mp.screenshot({ path: path.join(SHOTS, '08-phone-home.png') });
  await mp.goto(labUrl);
  await codeCells(mp).first().locator('.cm-content').waitFor();
  await check('no horizontal scroll on the phone workspace', async () => assert.ok(await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)));
  if (SHOTS) await mp.screenshot({ path: path.join(SHOTS, '09-phone-lab.png') });
  await phone.close();
} catch (err) {
  failures += 1;
  console.error('\nThe test stopped early:', err);
  await shot(page, 'zz-failure').catch(() => {});
} finally {
  const errors = consoleLines.filter((l) => /^(error|pageerror)/.test(l) && !/fonts\.g|ERR_FAILED|Failed to load resource|Refused to connect|net::ERR/.test(l));
  if (errors.length) console.log('\nBrowser console errors:\n  ' + errors.slice(0, 15).join('\n  '));
  const csp = consoleLines.filter((l) => /Content Security Policy|Refused to connect/.test(l));
  console.log(`\nCSP messages seen: ${csp.length}${csp.length ? `\n  ${csp[0].slice(0, 240)}` : ''}`);
  const other = consoleLines.filter((l) => /Content-Security-Policy|violat/i.test(l) && !csp.includes(l));
  if (other.length) console.log(other.slice(0, 5).join('\n'));
  await browser.close();
  await vite.close();
  if (pyodideServer) pyodideServer.server.close();
  await shim.stop();
  console.log(failures ? `\n${failures} check(s) failed.` : '\nAll end-to-end checks passed.');
  process.exit(failures ? 1 : 0);
}
