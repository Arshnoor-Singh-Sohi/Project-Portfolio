---
title: "L1: uv and pyproject.toml"
order: 1
summary: "uv replaces pip, virtualenv, pip-tools, pipx, pyenv and more with one tool. uv init, add, lock, sync and run, what uv.lock holds, the [project] table and dependency groups, Python version pins, uv pip versus project mode, and how Databricks Apps chooses between requirements.txt and uv.lock. Every command ran with uv 0.13.0."
status: not-started
tags: [python, uv, pyproject, lockfile, dependency-groups, virtualenv, databricks-apps]
---

## 1. The question this idea answers

An agent service depends on many packages: FastAPI, an SDK, a database driver, and their dependencies. The service must run with the same versions on a laptop, in CI and on Databricks Apps. Without a lock, two installs one week apart can resolve different versions, and a bug appears only in production.

Three questions decide if an install is reproducible:

1. Which file **declares** what the project needs?
2. Which file **pins** the exact versions that were tested?
3. Which command makes the environment **match** the pins, and only the pins?

uv answers all three with one tool and two files: `pyproject.toml` and `uv.lock`. This lesson runs each command and shows what it changes.

## 2. Mental model

> [!analogy] A recipe, a receipt and a pantry
> `pyproject.toml` is the recipe: "flour, any brand, at least type 550". `uv.lock` is the receipt from the shop: the exact brand, batch and weight, with a checksum. The `.venv` folder is the pantry.
>
> `uv lock` reads the recipe and writes the receipt. `uv sync` makes the pantry match the receipt exactly: it adds what is missing and removes what is not on the receipt. `uv run` checks the receipt and the pantry, fixes them if needed, and then cooks.
>
> **Where it stops working:** a real receipt is for one shop on one day. `uv.lock` is universal: it holds the choices for every operating system and every allowed Python version at once. And the pantry is not shared: each project has its own `.venv`.

## 3. Terms

| Term | Plain meaning |
|---|---|
| uv | A Python package and project manager, written in Rust. One binary. |
| project | A folder with a `pyproject.toml`. uv uses this file to find the project root. |
| `[project]` table | The standard part of `pyproject.toml`: name, version, `requires-python`, `dependencies`. |
| `requires-python` | The range of Python versions that the project supports, for example `>=3.13`. |
| dependency specifier | A package name with a version range, for example `fastapi>=0.143.0`. |
| `[dependency-groups]` | A standard table (PEP 735) for local-only groups, such as `dev` or `lint`. They are not published. |
| `dev` group | The group that uv installs by default. `uv add --dev` writes to it. |
| `uv.lock` | uv's lockfile: the exact resolved version, source and hash of every package, for all platforms. |
| project environment | The `.venv` folder next to `pyproject.toml`. uv creates and updates it. |
| lock | Resolve the declared dependencies into `uv.lock`. |
| sync | Install from `uv.lock` into `.venv`. `uv sync` is exact: it also removes packages that are not in the lock. |
| `.python-version` | A file with the default Python version for the project. `uv python pin` writes it. |
| build backend | The tool that builds the project into a package. `uv init` now uses `uv_build`. |
| `uv pip` | uv's low-level, pip-like commands. They change an environment directly and do not read `uv.lock`. |

## 4. Method and math

### 4.1 What uv replaces

The uv docs (checked on 2026-10-13): "A single tool to replace `pip`, `pip-tools`, `pipx`, `poetry`, `pyenv`, `twine`, `virtualenv`, and more."

| Old tool | Job | uv command |
|---|---|---|
| `python -m venv`, virtualenv | Create an environment | `uv venv`, or automatic in a project |
| pip + requirements.txt | Install packages | `uv add`, `uv sync` |
| pip-tools (`pip-compile`) | Pin exact versions | `uv lock` |
| pyenv | Install Python versions | `uv python install`, `uv python pin` |
| pipx | Run a CLI tool in isolation | `uvx` |
| poetry | All of the above for a project | The project commands of uv |

The test used uv 0.13.0, the latest release on PyPI (released 2026-10-09, checked on 2026-10-13). The sandbox paths are shortened to `/work` below.

### 4.2 uv init

```bash
$ uv init plant-agent --author-from none
Initialized project `plant-agent` at `/work/plant-agent`
```

The files: `.gitignore`, `.python-version`, `README.md`, `pyproject.toml` and `src/plant_agent/__init__.py`, plus a `.git` folder. The `pyproject.toml`:

```toml
[project]
name = "plant-agent"
version = "0.1.0"
description = "Add your description here"
readme = "README.md"
requires-python = ">=3.13"
dependencies = []

[project.scripts]
plant-agent = "plant_agent:main"

[build-system]
requires = ["uv_build>=0.13.0,<0.14.0"]
build-backend = "uv_build"
```

`requires-python = ">=3.13"` came from the interpreter that uv found (CPython 3.13.16). `.python-version` holds `3.13`. `[project.scripts]` defines a command `plant-agent` that calls `main()` in `src/plant_agent/__init__.py`.

> [!trap] uv init changed in 0.12.0
> The uv 0.12.0 changelog (released 2026-07-28) says: "Projects created with `uv init` now declare a build system and are packaged by default." Before that, `uv init` made a `main.py` and no build system. The sandbox also had uv 0.11.32, and its `uv init old-layout` created `main.py` and a `pyproject.toml` with no `[build-system]` table. Many tutorials still show that old layout. `uv init --no-package` creates it with new versions.

### 4.3 uv run

```bash
$ uv run plant-agent
Using CPython 3.13.16 interpreter at: /usr/bin/python3.13
Creating virtual environment at: .venv
   Building plant-agent @ file:///work/plant-agent
      Built plant-agent @ file:///work/plant-agent
Installed 1 package in 1ms
Hello from plant-agent!
```

One command created `.venv`, wrote `uv.lock`, built the project, installed it and ran it. The docs: "When `uv run` is invoked, it will create the project environment if it does not exist yet or ensure it is up-to-date if it exists." You do not need to activate `.venv`.

Later runs were fast. Three runs of `uv run python -c "pass"` took 0.085 s, 0.114 s and 0.105 s. After `rm -rf .venv`, `uv sync` rebuilt the environment from the warm cache: "Installed 23 packages in 62ms", 0.131 s for the whole command.

### 4.4 uv add and the [project] table

```bash
$ uv add fastapi httpx
Resolved 16 packages in 1.53s
...
 + fastapi==0.143.0
 + httpx==0.28.1
 + opentelemetry-api==1.45.1
 ...
$ uv add --dev pytest
$ uv add --group lint ruff
```

(Output shortened at "...".)

The `pyproject.toml` after the three commands (only the changed parts):

```toml
dependencies = [
    "fastapi>=0.143.0",
    "httpx>=0.28.1",
]

[dependency-groups]
dev = [
    "pytest>=9.1.1",
]
lint = [
    "ruff>=0.17.0",
]
```

The docs: "The dependency will include a constraint, e.g., `>=0.27.2`, for the most recent, compatible version of the package." So `pyproject.toml` holds ranges, not exact versions. The exact versions are in `uv.lock`.

Development dependencies "are local-only and will _not_ be included in the project requirements when published to PyPI". uv stores them in `[dependency-groups]`, and "The `dev` group is special-cased and synced by default."

### 4.5 What uv.lock holds

After all the commands of this lesson, the lock had 390 lines for 25 packages. Two entries:

```toml
[[package]]
name = "httpx"
version = "0.28.1"
source = { registry = "https://pypi.org/simple" }
dependencies = [
    { name = "anyio" },
    { name = "certifi" },
    { name = "httpcore" },
    { name = "idna" },
]
sdist = { url = "https://files.pythonhosted.org/.../httpx-0.28.1.tar.gz", hash = "sha256:75e98c5f...", size = 141406, upload-time = "2024-12-06T15:37:23.222Z" }
wheels = [
    { url = "https://files.pythonhosted.org/.../httpx-0.28.1-py3-none-any.whl", hash = "sha256:d909fccc...", size = 73517, upload-time = "2024-12-06T15:37:21.509Z" },
]

[[package]]
name = "plant-agent"
version = "0.1.0"
source = { editable = "." }
dependencies = [
    { name = "fastapi" },
    { name = "httpx" },
]

[package.dev-dependencies]
dev = [
    { name = "pytest" },
]
lint = [
    { name = "ruff" },
]
```

(URLs and hashes are shortened.) The docs: "`uv.lock` is a _universal_ or _cross-platform_ lockfile that captures the packages that would be installed across all possible Python markers such as operating system, architecture, and Python version." It "should be checked into version control" and "should not be edited manually".

### 4.6 Lock, sync and the exact environment

The docs: "Locking and syncing are _automatic_ in uv." `uv run` locks and syncs before it runs. Three flags control this:

| Flag | Meaning (docs) | Use it in |
|---|---|---|
| `--locked` | "If the lockfile is not up-to-date, uv will raise an error instead of updating the lockfile." | CI, deploy scripts |
| `--frozen` | "use the lockfile without checking if it is up-to-date" | Fast reruns when you know the lock is right |
| `uv lock --check` | Exits with an error if the lock is out of date | CI checks |

The test added `"uvicorn>=0.50"` to `pyproject.toml` by hand, without `uv add`:

```bash
$ uv lock --check
Resolved 25 packages in 1.16s
error: The lockfile at `uv.lock` needs to be updated, but `--check` was provided.

hint: To update the lockfile, run `uv lock`.
$ uv sync --locked
error: The lockfile at `uv.lock` needs to be updated, but `--locked` was provided.
$ uv run --frozen python -c "import uvicorn"
ModuleNotFoundError: No module named 'uvicorn'
$ uv lock
Added click v8.5.0
Added uvicorn v0.54.0
```

(Some lines about resolving and building, the hint lines and the traceback head are omitted.)

`--frozen` ran with the old lock and failed at the import. `--locked` failed early with a clear message. That is why CI should use `--locked`.

`uv sync` is exact. The `lint` group is not a default group, so a plain `uv sync` removed ruff:

```bash
$ uv sync
 - ruff==0.17.0
$ uv sync --group lint
 + ruff==0.17.0
$ uv sync --no-dev
 - iniconfig==2.3.1
 - packaging==26.3
 - pluggy==1.6.0
 - pygments==2.21.0
 - pytest==9.1.1
 - ruff==0.17.0
```

(The "Resolved", "Installed" and "Uninstalled" summary lines are omitted.)

> [!note] New releases do not change the lock
> The docs: "uv will not consider lockfiles outdated when new versions of packages are released". Upgrade on purpose with `uv lock --upgrade-package httpx` or `uv lock --upgrade`, then run the tests.

### 4.7 Python version pins

Two settings work together. `requires-python` in `pyproject.toml` is the allowed range. `.python-version` is the version that uv picks inside that range. The docs: "The first Python version that is compatible with the requirement will be used, unless a version is otherwise requested, e.g., via a `.python-version` file or the `--python` flag."

```bash
$ uv python pin 3.12
error: The requested Python version `3.12` is incompatible with the project `requires-python` value of `>=3.13`.
$ uv run --no-project --python 3.12 python --version
Python 3.12.3
```

> [!trap] The default download is now Python 3.15
> The uv 0.13.0 changelog (2026-10-09): "The default stable Python version has changed from 3.14 to 3.15. This affects Python downloads when no version is requested or pinned". A new machine without Python downloads 3.15 for an unpinned project. Pin the version that you tested with `uv python pin`.

### 4.8 uv pip versus project mode

The docs: "uv does not rely on or invoke pip." The `uv pip` commands "work directly with the virtual environment, in contrast to uv's primary interfaces where the virtual environment is managed automatically." And: "It is _not_ recommended to modify the project environment manually, e.g., with `uv pip install`."

The test installed a package that the project does not declare:

```bash
$ uv pip install six
 + six==1.17.0
$ uv run python -c "import six; print('six', six.__version__)"
six 1.17.0
$ uv sync
 - six==1.17.0
$ uv run python -c "import six"
ModuleNotFoundError: No module named 'six'
```

(The "Resolved" lines and the traceback head are omitted.)

`uv run` keeps extra packages ("inexact" sync, docs). `uv sync` removes them. Outside a project and a venv, `uv pip install six` failed:

```text
error: No virtual environment found; run `uv venv` to create an environment, or pass `--system` to install into a non-virtual environment
```

| Need | Command |
|---|---|
| A new project dependency | `uv add pkg` (writes `pyproject.toml` and `uv.lock`) |
| A tool for one run only | `uv run --with pkg ...` or `uvx tool` |
| A plain environment with no project | `uv venv`, then `uv pip install -r requirements.txt` |
| A requirements file for another tool | `uv export` |

### 4.9 How Databricks Apps installs Python packages

The Databricks Apps docs (page "Manage dependencies", checked on 2026-10-13) define the order:

- "If `requirements.txt` exists, the app uses `pip` to install dependencies" and "`requirements.txt` always takes precedence."
- "If `requirements.txt` doesn't exist and both `pyproject.toml` and `uv.lock` exist, the app uses `uv` to install dependencies from the lock file."
- "`uv`-based apps don't include pre-installed libraries, so you must declare all dependencies in your `pyproject.toml`."
- "You can also specify any Python version using the `requires-python` field, unlike `pip`-based apps, which use Python 3.11."

> [!example] Worked example: which installer runs?
> | Files in the app folder | Installer | Python |
> |---|---|---|
> | `requirements.txt` only | pip | 3.11 |
> | `pyproject.toml` + `uv.lock` | uv, from the lock | from `requires-python` |
> | `pyproject.toml` + `uv.lock` + an old `requirements.txt` | pip | 3.11 |
> | `pyproject.toml` only | Not described. The docs: "To use `uv`, you must include a `uv.lock` file alongside your `pyproject.toml`." | — |
>
> The third row is the trap. One forgotten `requirements.txt` switches the app back to pip and Python 3.11, and the lock is ignored.

> [!key] Declare in pyproject.toml, pin in uv.lock, install with --locked
> Change dependencies only with `uv add` and `uv remove`. Commit `uv.lock`. Make every automatic install fail when the lock and `pyproject.toml` disagree.

### 4.10 Production view

| Concern | What to do |
|---|---|
| Reproducibility | Commit `uv.lock`. Use `uv sync --locked` or `uv run --locked` in CI and deploy scripts. |
| Python version | Set `requires-python` and commit `.python-version`. |
| Deploy | For Databricks Apps, ship `pyproject.toml` and `uv.lock`, and no `requirements.txt`. |
| Upgrades | Upgrade with `uv lock --upgrade-package`, one package at a time for risky ones, then run the tests. |
| Supply chain | The lock holds a sha256 hash for each file. Review lock diffs in code review. |
| Speed | The global cache makes rebuilds fast: 23 packages in 62 ms from a warm cache in the test. |

## 5. Code

uv is a command-line tool. Run the commands in a terminal inside `C:\Users\ASohi\Downloads\AI\agent-harness-lab\python\uv-lab`, and record the commands and outputs in `python/05-uv-and-pyproject.ipynb`. On Windows, the environment's Python is `.venv\Scripts\python.exe`.

**Exercise 5.1: a project from zero.** Create a project `shift-report` with `uv init`, add `fastapi` and `httpx`, and add `pytest` to the `dev` group.

Acceptance tests:

- `uv run shift-report` prints the greeting.
- `pyproject.toml` lists `fastapi` and `httpx` in `[project].dependencies`, and `pytest` only in `[dependency-groups].dev`.
- `uv lock --check` exits with code 0.

**Exercise 5.2: groups and exact sync.** Add `ruff` to a `lint` group. Then run `uv sync`, `uv sync --group lint` and `uv sync --no-dev`.

Acceptance tests:

- Your notebook shows which packages each command added or removed.
- You explain in one sentence why a plain `uv sync` removes `ruff`.

**Exercise 5.3: catch drift.** Add a dependency to `pyproject.toml` by hand, without `uv add`.

Acceptance tests:

- `uv sync --locked` fails with "needs to be updated", and you record the exit code.
- `uv run --frozen` runs, and the import of the new package fails.
- After `uv lock`, `uv sync --locked` succeeds.

**Exercise 5.4: an app folder check.** Write a small Python function `installer_for(folder)` that returns `"pip"`, `"uv"` or `"unknown"` by the rules of section 4.9.

Acceptance tests:

- It returns `"pip"` for a folder with `requirements.txt`, also when `uv.lock` exists.
- It returns `"uv"` for `pyproject.toml` + `uv.lock` without `requirements.txt`.
- It returns `"unknown"` for `pyproject.toml` alone.

## 6. Common mistakes

1. **Editing the environment with `uv pip install` in a project.** The next `uv sync` removes the package. Use `uv add`.
2. **Not committing `uv.lock`.** Each install resolves again and can differ.
3. **`--frozen` in CI.** It hides a stale lock. Use `--locked`.
4. **An old `requirements.txt` next to `uv.lock` in a Databricks App.** pip and Python 3.11 win.
5. **No Python pin.** uv 0.13.0 downloads Python 3.15 when nothing is pinned and no Python is installed.
6. **Following an old tutorial for `uv init`.** Since 0.12.0 the default is a packaged `src/` layout.

## 7. One-minute explanation

uv is one tool for environments, dependencies, locks, Python versions and command-line tools. A project has two files. `pyproject.toml` declares what the project needs: the `[project]` table holds the name, `requires-python` and version ranges, and `[dependency-groups]` holds local-only groups such as `dev`. `uv.lock` pins the exact version, source and hash of every package for every platform, and you commit it. `uv add` changes both files, `uv lock` rewrites the lock, `uv sync` makes `.venv` match the lock exactly, and `uv run` locks, syncs and runs in one step. In CI and deploys, use `--locked` so that a stale lock fails loudly. `.python-version` and `requires-python` fix the Python version, which matters because uv 0.13.0 downloads Python 3.15 by default. `uv pip` is a separate low-level interface that changes an environment directly and ignores the lock. On Databricks Apps, `pyproject.toml` plus `uv.lock` makes the platform install with uv, unless a `requirements.txt` exists, which always wins.

## 8. Check questions

```check
{
  "question": "A teammate runs uv pip install pandas in the project and the code works. CI runs uv sync --locked and the tests fail with ModuleNotFoundError. Explain both results.",
  "answer": "uv pip install changes .venv directly and does not write pyproject.toml or uv.lock. uv run keeps extra packages, so the local run works. CI installs only what uv.lock lists, and uv sync is exact, so pandas is missing there. The fix is uv add pandas, which records it in both files."
}
```

```check
{
  "question": "What is the difference between uv sync --locked and uv sync --frozen when pyproject.toml has a new dependency that uv.lock does not have?",
  "answer": "--locked checks that the lock matches pyproject.toml and fails with \"The lockfile at uv.lock needs to be updated, but --locked was provided\". --frozen does not check: it installs the old lock as it is, so the new dependency is missing and the failure appears later, at import time."
}
```

```check
{
  "question": "A Databricks App folder holds pyproject.toml with requires-python = \">=3.12\", uv.lock, and an old requirements.txt. Which installer and which Python version does the app use, according to the docs?",
  "answer": "pip, because requirements.txt always takes precedence, and pip-based apps use Python 3.11. The uv.lock and requires-python are ignored. Delete requirements.txt to make the platform install from uv.lock with a Python version from requires-python."
}
```

```check
{
  "question": "pyproject.toml says fastapi>=0.143.0. A new FastAPI version is released tomorrow. Does uv run install it automatically? Why or why not?",
  "answer": "No. uv run installs the exact version in uv.lock, and the docs say uv does not consider a lockfile outdated when new versions are released. The range in pyproject.toml only allows newer versions. To take the new release, run uv lock --upgrade-package fastapi, then run the tests and commit the new lock."
}
```

## 9. Links

- Previous part: [FastAPI StreamingResponse and SSE](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse)
- Next: [L2: pytest fixtures and monkeypatch](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch)
- Deploying the app: [Databricks Apps](/notes/platforms/databricks/01-apps/l1-databricks-apps)
- [Glossary](/notes/software-engineering/python/glossary)
