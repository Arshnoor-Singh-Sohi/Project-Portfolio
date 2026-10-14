---
title: "Glossary"
order: 2
summary: "Every term in Python for AI Services, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| `[dependency-groups]` | A standard table (PEP 735) for local-only groups, such as `dev` or `lint`. They are not published. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| `[project]` table | The standard part of `pyproject.toml`: name, version, `requires-python`, `dependencies`. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| `aclose()` | A method that throws `GeneratorExit` into the generator at its paused `yield`, so its `finally` blocks run. | [1.2](/notes/software-engineering/python/01-asyncio/l2-async-generators) |
| `anext()` | The built-in function that calls `__anext__`. `await anext(g)` returns the next value. | [1.2](/notes/software-engineering/python/01-asyncio/l2-async-generators) |
| anyio plugin | The pytest plugin inside the `anyio` package. It runs tests marked `@pytest.mark.anyio`. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| `async for` | A loop that awaits `__anext__` again and again until `StopAsyncIteration`. | [1.2](/notes/software-engineering/python/01-asyncio/l2-async-generators) |
| async generator function | An `async def` function that contains `yield`. | [1.2](/notes/software-engineering/python/01-asyncio/l2-async-generators) |
| async generator object | The object that a call of an async generator function returns. Its body has not run yet. | [1.2](/notes/software-engineering/python/01-asyncio/l2-async-generators) |
| async iterator | An object with an `__anext__` method that returns an awaitable. Async generators are async iterators. | [1.2](/notes/software-engineering/python/01-asyncio/l2-async-generators) |
| `asyncio.gather` | Runs several awaitables at the same time and returns their results in input order. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| `asyncio.run` | Creates a new event loop, runs one coroutine to the end, then closes the loop. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| `asyncio.TaskGroup` | A context manager that runs tasks and cancels the others when one fails. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| `asyncio.to_thread` | Runs a sync function in the default executor and returns a coroutine that gives its result. | [1.3](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) |
| `await` | The expression that runs an awaitable and gives its result. It can suspend the current task. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| awaitable | An object that `await` accepts: a coroutine object, a task or a future. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| background loop | An event loop that runs forever in its own thread and accepts work from other threads. | [1.3](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) |
| blank line | An empty line. It ends an event, and the client dispatches the event. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| blocking call | A normal function call that waits without a suspension point, for example `time.sleep` or a sync HTTP request. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| bridge | Code that turns an async generator into a sync generator with a thread and a queue. | [1.3](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) |
| build backend | The tool that builds the project into a package. `uv init` now uses `uv_build`. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| `call_soon_threadsafe` | The only safe way to ask a loop in another thread to run a callback. | [1.3](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) |
| cancel scope | An anyio object that must be entered and left in the same task. The Claude Agent SDK uses anyio. | [1.2](/notes/software-engineering/python/01-asyncio/l2-async-generators) |
| cancellation | A request to stop a task. The task receives `asyncio.CancelledError` at its next suspension point. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| chunked transfer encoding | HTTP/1.1 body framing without a known total length. Each piece is sent as it is ready. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| client disconnect | The client closes the connection before the response ends. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| comment line | A line that starts with `:`. The client ignores it. Servers use it as a keep-alive. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| `concurrent.futures.Future` | A thread-safe result holder. `future.result(timeout)` blocks the calling thread until the result is ready. | [1.3](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) |
| `conftest.py` | A file whose fixtures every test in its folder and subfolders can use without an import. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| `contextlib.aclosing` | A context manager that calls `aclose()` when its block ends, also after `break` or an exception. | [1.2](/notes/software-engineering/python/01-asyncio/l2-async-generators) |
| coroutine function | A function defined with `async def`. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| coroutine object | The object that a call of a coroutine function returns. Its body has not run yet. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| debug mode | An event loop mode with extra checks. For example, it logs every step that holds the thread for 100 ms or more. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| default executor | The thread pool of an event loop. `asyncio.to_thread` and `run_in_executor(None, ...)` use it. | [1.3](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) |
| dependency specifier | A package name with a version range, for example `fastapi>=0.143.0`. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| `dev` group | The group that uv installs by default. `uv add --dev` writes to it. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| event loop | The scheduler of `asyncio`. It runs ready tasks one at a time in one thread, and it watches timers and network events. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| event stream | The response body in SSE format. Its media type is `text/event-stream`. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| `EventSource` | The browser API that reads an event stream and reconnects after a drop. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| `EventSourceResponse` | FastAPI's SSE response class (since 0.135.0). It formats yielded items as events. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| fake model | A test object with the same interface as the model client. It returns fixed replies and records each request. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| field | One line of an event: `data`, `event`, `id` or `retry`, then a colon and a value. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| finalizer hook | A function that the event loop registers. It closes an async generator that was garbage collected before it finished. | [1.2](/notes/software-engineering/python/01-asyncio/l2-async-generators) |
| fixture | A function marked `@pytest.fixture` that prepares a value. A test receives it by naming it as a parameter. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| fixture scope | How long one fixture value lives: `function`, `class`, `module`, `package` or `session`. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| keep-alive | A small message that a server sends during silence so that proxies do not close an idle connection. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| `Last-Event-ID` | The request header in which a reconnecting browser sends the last `id` that it received. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| lock | Resolve the declared dependencies into `uv.lock`. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| loop-bound object | An object that remembers the loop where it was first used, for example `asyncio.Lock`. | [1.3](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) |
| `monkeypatch` | A built-in fixture that changes attributes, dictionary items and environment variables, and undoes the changes after the test. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| node id | The unique name of one collected test, for example `tests/test_paths.py::test_uses_env_var`. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| `parametrize` | A marker that runs one test function once for each set of arguments. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| pipeline | A chain of async generators where each one reads from the previous one. | [1.2](/notes/software-engineering/python/01-asyncio/l2-async-generators) |
| project | A folder with a `pyproject.toml`. uv uses this file to find the project root. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| project environment | The `.venv` folder next to `pyproject.toml`. uv creates and updates it. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| proxy buffering | A proxy collects response bytes before it sends them to the client. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| pytest-asyncio | A plugin that runs `async def` tests and fixtures on an asyncio event loop. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| `.python-version` | A file with the default Python version for the project. `uv python pin` writes it. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| `requires-python` | The range of Python versions that the project supports, for example `>=3.13`. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| `run_coroutine_threadsafe` | Sends a coroutine from another thread to a running loop. Returns a `concurrent.futures.Future`. | [1.3](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) |
| running loop | The event loop that runs in the current thread at this moment. `asyncio.get_running_loop()` returns it. | [1.3](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) |
| sentinel | A unique object that marks the end of a stream in a queue. | [1.3](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) |
| server-sent events (SSE) | A standard format for a stream of text events from a server to a client in one HTTP response. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| `shutdown_asyncgens` | An event loop method that closes every open async generator. `asyncio.run` calls it before it closes the loop. | [1.2](/notes/software-engineering/python/01-asyncio/l2-async-generators) |
| `StopAsyncIteration` | The exception that tells `async for` that the stream has ended. | [1.2](/notes/software-engineering/python/01-asyncio/l2-async-generators) |
| `StreamingResponse` | The Starlette response class that sends each item of an iterator as a body chunk. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| strict mode | The default mode of pytest-asyncio: it runs only tests marked `@pytest.mark.asyncio`. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| suspension point | An `await` where the task really gives control to the event loop, for example `await asyncio.sleep(1)` or a network read. Also called an await point. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| sync | Install from `uv.lock` into `.venv`. `uv sync` is exact: it also removes packages that are not in the lock. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| task | A coroutine object that the event loop schedules and runs on its own. `asyncio.create_task` creates one. | [1.1](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) |
| test discovery | The rules by which pytest finds test files, classes and functions. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| thread pool of FastAPI | AnyIO worker threads that run `def` endpoints. The default limit is 40 threads. | [1.3](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) |
| `tmp_path` | A built-in fixture: a new empty `pathlib.Path` folder for each test. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| uv | A Python package and project manager, written in Rust. One binary. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| `uv pip` | uv's low-level, pip-like commands. They change an environment directly and do not read `uv.lock`. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| `uv.lock` | uv's lockfile: the exact resolved version, source and hash of every package, for all platforms. | [3.1](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) |
| where-to-patch rule | Patch the name that the code under test reads, not the place where the object was defined. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
| worker thread | An extra operating system thread that runs a function next to the main thread. | [1.3](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) |
| `X-Accel-Buffering` | A response header that tells nginx to enable or disable buffering for this response. | [2.1](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) |
| yield fixture | A fixture that yields its value. The code after `yield` is the teardown. | [3.2](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) |
