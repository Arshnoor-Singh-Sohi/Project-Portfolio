---
title: "L2: pytest fixtures and monkeypatch"
order: 2
summary: "pytest finds tests by name, gives each test the fixtures that it asks for, and undoes every monkeypatch after the test. Discovery, fixture scopes and yield teardown, conftest.py, monkeypatch with CLAUDE_CONFIG_DIR in tmp_path, the where-to-patch rule, parametrize, async tests with pytest-asyncio 1.4 or the anyio plugin, and a fake-model fixture. A real 13-test suite ran with pytest 9.1.1."
status: not-started
tags: [python, pytest, fixtures, monkeypatch, tmp-path, parametrize, pytest-asyncio, anyio]
---

## 1. The question this idea answers

Agent code is hard to test in four ways at once:

1. It reads **environment variables**, for example `CLAUDE_CONFIG_DIR` or an endpoint URL. A test that changes them can break every later test.
2. It writes **files**: session files, logs, exports. A test must not touch the real home folder.
3. It calls **a model**. A real call is slow, costs money and gives a different answer each time.
4. It is **async**. pytest alone cannot run an `async def` test.

pytest has a tool for each one. Fixtures give shared setup and teardown. `monkeypatch` makes changes that pytest undoes. `tmp_path` gives a fresh folder per test. `parametrize` runs many cases, and a plugin runs async tests. This lesson builds a real 13-test suite and shows the output of each tool.

## 2. Mental model

> [!analogy] A stage crew in a theater
> Before each scene, the stage crew puts the props on the stage. After the scene, the crew removes them in the reverse order. Some props, like the backdrop, stay for the whole play. The actors only say which props they need. They never carry the props themselves.
>
> The props are fixtures. "Before and after each scene" is function scope. "The whole play" is session scope. A temporary sign on a door, "Exit is here", is a monkeypatch: the crew puts it up for one scene and takes it away after.
>
> **Where it stops working:** an actor reads the sign on the door in front of them. If the crew hangs the sign on a different door with the same label, the actor never sees it. In Python this is the where-to-patch rule (section 4.5). Also, a theater plays scenes in a fixed order. Good tests must pass in any order.

## 3. Terms

| Term | Plain meaning |
|---|---|
| test discovery | The rules by which pytest finds test files, classes and functions. |
| node id | The unique name of one collected test, for example `tests/test_paths.py::test_uses_env_var`. |
| fixture | A function marked `@pytest.fixture` that prepares a value. A test receives it by naming it as a parameter. |
| fixture scope | How long one fixture value lives: `function`, `class`, `module`, `package` or `session`. |
| yield fixture | A fixture that yields its value. The code after `yield` is the teardown. |
| `conftest.py` | A file whose fixtures every test in its folder and subfolders can use without an import. |
| `monkeypatch` | A built-in fixture that changes attributes, dictionary items and environment variables, and undoes the changes after the test. |
| where-to-patch rule | Patch the name that the code under test reads, not the place where the object was defined. |
| `tmp_path` | A built-in fixture: a new empty `pathlib.Path` folder for each test. |
| `parametrize` | A marker that runs one test function once for each set of arguments. |
| pytest-asyncio | A plugin that runs `async def` tests and fixtures on an asyncio event loop. |
| strict mode | The default mode of pytest-asyncio: it runs only tests marked `@pytest.mark.asyncio`. |
| anyio plugin | The pytest plugin inside the `anyio` package. It runs tests marked `@pytest.mark.anyio`. |
| fake model | A test object with the same interface as the model client. It returns fixed replies and records each request. |

## 4. Method and math

### 4.1 Discovery and configuration

The pytest docs, "Conventions for Python test discovery" (checked on 2026-10-13):

- "If no arguments are specified then collection starts from `testpaths` (if configured) or the current directory."
- "In those directories, search for `test_*.py` or `*_test.py` files".
- From those files: "`test` prefixed test functions or methods outside of class" and "`test` prefixed test functions or methods inside `Test` prefixed test classes (without an `__init__` method)".

The test project is a uv project ([L1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject)) with pytest 9.1.1, pytest-asyncio 1.4.0 and anyio 4.15.1 in the `dev` group:

```text
shiftbot/
├── pyproject.toml
├── src/shiftbot/paths.py      # reads CLAUDE_CONFIG_DIR
├── src/shiftbot/answer.py     # downtime_label() and async answer()
└── tests/
    ├── conftest.py
    ├── test_answer.py
    └── test_paths.py
```

`uv run pytest --collect-only -q` listed the 13 node ids:

```text
tests/test_answer.py::test_downtime_label[0-no downtime]
tests/test_answer.py::test_downtime_label[45-45 min]
tests/test_answer.py::test_downtime_label[60-1 h 0 min]
tests/test_answer.py::test_downtime_label[135-2 h 15 min]
tests/test_answer.py::test_negative_minutes
tests/test_answer.py::test_answer_sends_system_and_question
tests/test_answer.py::test_answer_with_anyio[asyncio]
tests/test_answer.py::test_catalog_a
tests/test_answer.py::test_catalog_b
tests/test_paths.py::test_uses_env_var
tests/test_paths.py::test_session_file_inside_tmp
tests/test_paths.py::test_default_when_unset
tests/test_paths.py::test_env_is_restored

13 tests collected in 0.01s
```

The header said `configfile: pyproject.toml`, although the file had no pytest table. The docs explain: "a `pyproject.toml` file will be considered the `configfile` if no other match was found, in this case even if it does not contain a `[tool.pytest]` table (since version `9.0`)". pytest 9.0 also added the `[tool.pytest]` table with native TOML types. The older `[tool.pytest.ini_options]` table still works.

### 4.2 Fixtures, scopes and teardown

All fixtures of the suite live in `tests/conftest.py`:

```python
class FakeModel:
    """Records every request and returns a fixed reply. No network."""

    def __init__(self, reply: str = "Line 3 had 2 stops."):
        self.reply = reply
        self.calls: list[list[dict]] = []

    async def complete(self, messages: list[dict]) -> str:
        self.calls.append(messages)
        return self.reply


@pytest.fixture
def fake_model():
    return FakeModel()


@pytest.fixture
def config_dir(tmp_path, monkeypatch):
    d = tmp_path / "claude-home"
    d.mkdir()
    monkeypatch.setenv("CLAUDE_CONFIG_DIR", str(d))
    return d


@pytest.fixture(scope="session")
def plant_catalog():
    print("\n[setup] load plant catalog once")
    yield {"P1": "Bakery", "P2": "Bagels"}
    print("\n[teardown] close plant catalog")
```

The docs list the scopes: "`function`: the default scope, the fixture is destroyed at the end of the test." "`session`: the fixture is destroyed at the end of the test session." And for yield fixtures: "Any teardown code for that fixture is placed *after* the `yield`." After the test, pytest runs the teardowns "in the *reverse order*".

`--setup-show` prints each setup and teardown. For the two catalog tests (`-s` shows the prints):

```text
SETUP    S event_loop_policy
[setup] load plant catalog once

SETUP    S plant_catalog
        tests/test_answer.py::test_catalog_a (fixtures used: event_loop_policy, plant_catalog) .
        tests/test_answer.py::test_catalog_b (fixtures used: event_loop_policy, plant_catalog) .
[teardown] close plant catalog

TEARDOWN S plant_catalog
TEARDOWN S event_loop_policy
```

For one test that uses `config_dir`:

```text
SETUP    S event_loop_policy
SETUP    S tmp_path_factory
        SETUP    F tmp_path (fixtures used: tmp_path_factory)
        SETUP    F monkeypatch
        SETUP    F config_dir (fixtures used: monkeypatch, tmp_path)
        tests/test_paths.py::test_uses_env_var (fixtures used: config_dir, event_loop_policy, monkeypatch, request, tmp_path, tmp_path_factory) .
        TEARDOWN F config_dir
        TEARDOWN F monkeypatch
        TEARDOWN F tmp_path
TEARDOWN S tmp_path_factory
TEARDOWN S event_loop_policy
```

`S` is session scope, `F` is function scope. The session fixture ran its setup once for two tests. The function fixtures were removed in reverse order, and the `monkeypatch` teardown restored the environment variable. `event_loop_policy` is a session fixture of pytest-asyncio.

> [!trap] A session fixture cannot request monkeypatch
> A session fixture that asks for `monkeypatch` failed:
>
> ```text
> ScopeMismatch: You tried to access the function scoped fixture monkeypatch with a session scoped request object.
> ```
>
> A fixture can use only fixtures of the same or a wider scope. For a session-wide patch, use `with pytest.MonkeyPatch.context() as mp:` inside the fixture and `yield` inside the `with` block. The test of this form passed. The docstring of `context()`: it "undoes any patching done inside the ``with`` block upon exit".

### 4.3 conftest.py

The docs: "The `conftest.py` file serves as a means of providing fixtures for an entire directory. Fixtures defined in a `conftest.py` can be used by any test in that package without needing to import them (pytest will automatically discover them)." Each subfolder can have its own `conftest.py`, "adding on to the ones provided by the `conftest.py` files in parent directories". Put shared fakes, such as `fake_model`, in the top `tests/conftest.py`.

### 4.4 monkeypatch and tmp_path

The docs list the methods, among them `setattr(obj, name, value, raising=True)`, `setenv(name, value, prepend=None)`, `delenv(name, raising=True)`, `setitem`, `chdir` and `context()`. The key promise: "All modifications will be undone after the requesting test function or fixture has finished."

The code under test, `src/shiftbot/paths.py`:

```python
def claude_config_dir() -> Path:
    """The folder where the Claude CLI keeps its files."""
    value = os.environ.get("CLAUDE_CONFIG_DIR")
    return Path(value) if value else Path.home() / ".claude"


def session_file(project_key: str, session_id: str) -> Path:
    return claude_config_dir() / "projects" / project_key / f"{session_id}.jsonl"
```

The tests, `tests/test_paths.py`:

```python
def test_uses_env_var(config_dir):
    assert claude_config_dir() == config_dir


def test_session_file_inside_tmp(config_dir):
    f = session_file("-app", "S1")
    assert f == config_dir / "projects" / "-app" / "S1.jsonl"


def test_default_when_unset(monkeypatch, tmp_path):
    monkeypatch.delenv("CLAUDE_CONFIG_DIR", raising=False)
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    assert claude_config_dir() == tmp_path / ".claude"


def test_env_is_restored():
    assert "CLAUDE_CONFIG_DIR" not in os.environ
```

`test_env_is_restored` runs after the other three and passes, so each `setenv` was undone. (It assumes that the variable is not set in the shell that starts pytest.) This matters for the Claude Agent SDK: its session helpers read `CLAUDE_CONFIG_DIR` from `os.environ` ([sessions L3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks)). `monkeypatch.setenv` plus `tmp_path` gives each test its own empty config folder.

`tmp_path` is "a temporary directory unique to each test function" (docs). Two tests printed `/tmp/pytest-of-root/pytest-4/test_a0` and `/tmp/pytest-of-root/pytest-4/test_b0`. The docs: "By default, the last 3 temporary directories are kept". After four runs, the folder held `pytest-2`, `pytest-3`, `pytest-4` and the link `pytest-current`.

### 4.5 The where-to-patch rule

The docstring of `MonkeyPatch.setattr` in pytest 9.1.1: "`monkeypatch.setattr` works by (temporarily) changing the object that a name points to with another one. There can be many names pointing to any individual object, so for patching to work you must ensure that you patch the name used by the system under test."

> [!example] Worked example: a real case in FastAPI 0.143.0
> FastAPI sends an SSE keep-alive after `_PING_INTERVAL` seconds. The value is defined in `fastapi/sse.py` as `_PING_INTERVAL: float = 15.0`. A test wanted 1 s.
>
> 1. `fastapi/routing.py` runs `from fastapi.sse import _PING_INTERVAL`. Now two names refer to the float 15.0: `fastapi.sse._PING_INTERVAL` and `fastapi.routing._PING_INTERVAL`.
> 2. The SSE code in `routing.py` reads its own name, `_PING_INTERVAL`, which means `fastapi.routing._PING_INTERVAL`.
> 3. Setting `fastapi.sse._PING_INTERVAL = 1.0` changed only the first name. No ping appeared in 2.5 s of silence.
> 4. Setting `fastapi.routing._PING_INTERVAL = 1.0` changed the name that the code reads. Pings appeared at 1.00 s and 2.00 s ([SSE lesson, section 4.8](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse)).
>
> In a test: `monkeypatch.setattr("fastapi.routing._PING_INTERVAL", 1.0)`. A string target "will be interpreted as a dotted import path, with the last part being the attribute name" (docstring).

### 4.6 parametrize

```python
@pytest.mark.parametrize(
    ("minutes", "label"),
    [(0, "no downtime"), (45, "45 min"), (60, "1 h 0 min"), (135, "2 h 15 min")],
)
def test_downtime_label(minutes, label):
    assert downtime_label(minutes) == label
```

One function became four tests with the ids `[0-no downtime]`, `[45-45 min]`, `[60-1 h 0 min]` and `[135-2 h 15 min]`. Each case passes or fails on its own. Use `pytest.raises` for the error path: `with pytest.raises(ValueError, match="must be >= 0"): downtime_label(-5)`.

### 4.7 Async tests

pytest 9.1.1 alone does not run coroutines. This test has no marker:

```python
async def test_forgot_the_marker():
    assert 1 == 2   # fails if it ever runs
```

With pytest-asyncio installed in its default mode, the output was:

```text
async def functions are not natively supported.
You need to install a suitable plugin for your async framework, for example:
  - anyio
  - pytest-asyncio
  - pytest-tornasync
  - pytest-trio
  - pytest-twisted
```

The plugin was installed. It ignored the test because the mode is strict. The pytest-asyncio docs (checked on 2026-10-13): "If no asyncio mode is specified, the mode defaults to `strict`." In strict mode, it "will only run tests that have the *asyncio* marker and will only evaluate async fixtures decorated with `@pytest_asyncio.fixture`."

| Setup | How a test opts in | Checked behavior |
|---|---|---|
| pytest-asyncio, strict (default) | `@pytest.mark.asyncio`, async fixtures with `@pytest_asyncio.fixture` | The marked test passed. The unmarked test failed with the message above. |
| pytest-asyncio, auto | `asyncio_mode = "auto"` in `[tool.pytest]` | The unmarked test ran and failed with `assert 1 == 2`, which proves that it ran. |
| anyio plugin | `@pytest.mark.anyio` | Ran on every installed backend: `[asyncio]` only, then `[asyncio]` and `[trio]` after `trio` was installed. |

The marked tests of the suite:

```python
@pytest.mark.asyncio
async def test_answer_sends_system_and_question(fake_model):
    reply = await answer("Downtime on line 3?", fake_model)
    assert reply == "Line 3 had 2 stops."
    assert len(fake_model.calls) == 1
    sent = fake_model.calls[0]
    assert sent[0] == {"role": "system", "content": SYSTEM}
    assert sent[-1]["content"] == "Downtime on line 3?"


@pytest.mark.anyio
async def test_answer_with_anyio(fake_model):
    assert await answer("x", fake_model) == fake_model.reply
```

> [!trap] Old tutorials and a hidden warning
> pytest-asyncio 1.0.0 (2025-05-26) removed "The deprecated *event_loop* fixture". Code from older tutorials that requests `event_loop` fails. Also set `asyncio_default_fixture_loop_scope`. When it is unset, pytest-asyncio 1.4.0 issues a `PytestDeprecationWarning` that starts with "The configuration option \"asyncio_default_fixture_loop_scope\" is unset." Python's default warning filters hid it in the test. `python -W default -m pytest` showed it.

> [!note] Docs and source disagree on the anyio fixture scope
> The anyio testing docs say that the plugin "comes with a function scoped fixture" named `anyio_backend`. The anyio 4.15.1 source declares `@pytest.fixture(scope="module", params=get_available_backends())`. The code follows the source: module scope, one parameter for each installed backend. The Claude Agent SDK repository (commit b6e9d12) loads this plugin with `addopts = ["--import-mode=importlib", "-p", "anyio"]`.

### 4.8 The fake model fixture

`test_answer_sends_system_and_question` proves two things without a network call. The code returns the model's reply unchanged. The model received exactly one request, with the system prompt first and the question last. The test takes milliseconds, costs nothing and gives the same result on every run. It cannot prove that a real model answers well: that needs a live test ([fake model vs real model](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model)).

> [!key] Inject the model, patch the environment, isolate the disk
> Give the code its model client as an argument, so a test can pass a fake. Change environment variables only with `monkeypatch`. Point every file path at `tmp_path`. Then each test starts clean and leaves nothing behind.

The full run (`uv run pytest -v`, header shortened):

```text
plugins: asyncio-1.4.0, anyio-4.15.1
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collecting ... collected 13 items

tests/test_answer.py::test_downtime_label[0-no downtime] PASSED          [  7%]
tests/test_answer.py::test_downtime_label[45-45 min] PASSED              [ 15%]
tests/test_answer.py::test_downtime_label[60-1 h 0 min] PASSED           [ 23%]
tests/test_answer.py::test_downtime_label[135-2 h 15 min] PASSED         [ 30%]
tests/test_answer.py::test_negative_minutes PASSED                       [ 38%]
tests/test_answer.py::test_answer_sends_system_and_question PASSED       [ 46%]
tests/test_answer.py::test_answer_with_anyio[asyncio] PASSED             [ 53%]
tests/test_answer.py::test_catalog_a PASSED                              [ 61%]
tests/test_answer.py::test_catalog_b PASSED                              [ 69%]
tests/test_paths.py::test_uses_env_var PASSED                            [ 76%]
tests/test_paths.py::test_session_file_inside_tmp PASSED                 [ 84%]
tests/test_paths.py::test_default_when_unset PASSED                      [ 92%]
tests/test_paths.py::test_env_is_restored PASSED                         [100%]

============================== 13 passed in 0.06s ==============================
```

### 4.9 Production view

| Concern | What to do |
|---|---|
| Isolation | Use `monkeypatch` and `tmp_path` in every test that touches the environment or the disk. |
| Speed | Use session scope only for expensive, read-only setup. Keep mutable state in function scope. |
| Async | Choose one plugin and one mode for the project. Write it in `[tool.pytest]` and set `asyncio_default_fixture_loop_scope`. |
| Determinism | Use fake models in unit tests. Run live model tests in a separate, marked group. |
| CI | Run `uv run --locked pytest`. Fail on warnings that hide lost work, for example with `-W error::RuntimeWarning`. |
| Coverage of cases | Use `parametrize` for edge values: 0, the limits, a negative input. |

## 5. Code

These exercises use a uv project in `C:\Users\ASohi\Downloads\AI\agent-harness-lab\python\pytest-lab`. Run the tests in a terminal with `uv run pytest -v`, and record your notes and outputs in `python/06-pytest-fixtures.ipynb`.

**Exercise 6.1: environment isolation.** Test a function that returns the session folder of a project key under `CLAUDE_CONFIG_DIR`, or under `~/.claude` when the variable is unset.

Acceptance tests:

- One test uses `monkeypatch.setenv` with a folder in `tmp_path`, one uses `monkeypatch.delenv` and a patched `Path.home`.
- `os.environ.get("CLAUDE_CONFIG_DIR")` is the same before and after the whole run.
- The tests pass when you run each file alone and when you run them in reverse order (`pytest tests/test_b.py tests/test_a.py`).

**Exercise 6.2: a session-file fixture.** Write a fixture `session_on_disk` that creates `projects/<key>/<id>.jsonl` inside a `tmp_path` config folder and returns the session id.

Acceptance tests:

- Two tests that use the fixture receive different folders.
- A function `choose_flow(session_id)` returns `"resume"` when the file exists and `"rebuild"` when it does not, and both cases have a test.
- No file appears in your real home folder.

**Exercise 6.3: a scripted fake model.** Extend `FakeModel` to take a list of replies, return them in order, and raise `AssertionError("unexpected model call")` when the list is empty.

Acceptance tests:

- A parametrized async test runs three questions, each with its own expected reply.
- A test proves that a fourth call raises the error.
- The suite runs in strict mode with explicit markers. Then it runs in auto mode with the markers removed. Both runs pass.

**Exercise 6.4: where to patch.** Create module `limits.py` with `TIMEOUT = 30` and module `client.py` with `from limits import TIMEOUT` and a function that returns `TIMEOUT`.

Acceptance tests:

- A test that patches `limits.TIMEOUT` shows that the function still returns 30.
- A test that patches `client.TIMEOUT` shows that the function returns the new value.

## 6. Common mistakes

1. **Setting `os.environ[...]` directly in a test.** The change leaks into every later test. Use `monkeypatch.setenv`.
2. **Patching the definition site.** Patch the name that the code under test reads.
3. **An async test with no marker in strict mode.** It fails with "async def functions are not natively supported", although the plugin is installed.
4. **Requesting `monkeypatch` in a session fixture.** It raises `ScopeMismatch`. Use `pytest.MonkeyPatch.context()`.
5. **Using the old `event_loop` fixture.** pytest-asyncio 1.0.0 removed it.
6. **Calling a real model in unit tests.** The tests become slow, costly and random. Inject a fake.
7. **Mutable data in a session fixture.** One test changes it, and a later test sees the change.

## 7. One-minute explanation

pytest collects `test_*.py` files and the `test` functions in them. A test asks for fixtures by naming them as parameters. pytest builds each fixture before the test, and after the test it runs the code after `yield` in reverse order. The scope decides how long a fixture lives: a function fixture is rebuilt for every test, and a session fixture once per run. Fixtures in `conftest.py` are available to every test in that folder without an import. `monkeypatch` changes attributes and environment variables and undoes every change after the test, so `monkeypatch.setenv("CLAUDE_CONFIG_DIR", str(tmp_path))` gives each test its own empty config folder. Patch the name that the code under test reads: FastAPI's ping interval changed only when the test patched `fastapi.routing`, not `fastapi.sse`. `parametrize` turns one function into many cases. For async tests, pytest-asyncio runs only tests marked `@pytest.mark.asyncio` unless you set auto mode, and the anyio plugin runs tests marked `@pytest.mark.anyio` on each installed backend. A fake model fixture records each request, so a fast test can prove exactly what the model received.

## 8. Check questions

```check
{
  "question": "A test sets os.environ[\"CLAUDE_CONFIG_DIR\"] = str(tmp_path) and passes. Later, an unrelated test fails because it finds session files that it did not create. Explain, and give the fix.",
  "answer": "Assigning to os.environ directly is never undone, so the variable keeps the first test's tmp_path for the rest of the run, and later code reads and writes in that folder. Use monkeypatch.setenv(\"CLAUDE_CONFIG_DIR\", str(tmp_path)): pytest undoes it in the monkeypatch teardown after the test."
}
```

```check
{
  "question": "Module agent_settings defines MAX_TURNS = 20. Module runner does from agent_settings import MAX_TURNS and uses it. A test runs monkeypatch.setattr(agent_settings, \"MAX_TURNS\", 2), but the runner still allows 20 turns. Why, and what is the correct patch?",
  "hint": "Two names, one object.",
  "answer": "The import created a second name, runner.MAX_TURNS, that refers to the int 20. The patch changed only agent_settings.MAX_TURNS, and the runner reads its own name. Patch the name that the code under test reads: monkeypatch.setattr(\"runner.MAX_TURNS\", 2)."
}
```

```check
{
  "question": "pytest-asyncio 1.4.0 is installed with no configuration. An async def test with no marker fails with \"async def functions are not natively supported\". Why, and name two fixes.",
  "answer": "The default mode of pytest-asyncio is strict, so it runs only tests marked @pytest.mark.asyncio and ignores the unmarked coroutine, and pytest itself cannot run it. Fix 1: add @pytest.mark.asyncio (or pytestmark for the module). Fix 2: set asyncio_mode = \"auto\" in the pytest configuration, for example in [tool.pytest] in pyproject.toml."
}
```

```check
{
  "question": "A fixture loads a 2-second plant catalog. Ten tests use it. How long does the setup take in total with function scope and with session scope? When is session scope wrong?",
  "answer": "Function scope: 10 × 2 s = 20 s, because the fixture runs again for each test. Session scope: 2 s once, and --setup-show prints one SETUP S line. Session scope is wrong when a test changes the value, for example adds a plant, because later tests then see the change and the results depend on the order."
}
```

## 9. Links

- Previous: [L1: uv and pyproject.toml](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject)
- Fake model vs real model: [Evaluation L1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model)
- The CLAUDE_CONFIG_DIR rule: [Session files on temporary disks](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks)
- Async code under test: [L1: The event loop and coroutines](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines)
- [Glossary](/notes/software-engineering/python/glossary)
