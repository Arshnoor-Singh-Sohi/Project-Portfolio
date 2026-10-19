---
title: "Sources and verification"
order: 3
summary: "The tested versions, the official sources of each module, the facts that sandbox runs measured, and the facts that are not verified."
---

## 1. How the facts in this subject were checked

Every lesson keeps three kinds of statements apart.

| Kind | What it means | How a lesson marks it |
|---|---|---|
| Measured | A sandbox run printed it. | A `text` block with the real output, and the versions. |
| From the docs | An official page, a specification or the library source says it. | The source name and "checked on 2026-10-19". |
| Design advice | The interpretation of these notes. | Words such as "use", "prefer", "a design choice". |

A fact that could not be verified says so in its lesson. Section 5 lists these facts.

## 2. Tested versions

The sandbox runs of 2026-10-19 used these versions.

| Software | Version | Used in |
|---|---|---|
| CPython | 3.13.16, and 3.15.0b4 for the basic generator, closure, queue, asyncio and annotation checks | All Python modules |
| FastAPI | 0.149.0 | M4, M5 |
| Starlette | 1.9.0 | M4, M5 |
| uvicorn | 0.54.0 | M4, M5, M9 |
| AnyIO | 4.15.1 | M4, M5 |
| httpx | 0.28.1 | M2 to M5 |
| Pydantic | 2.14.1 | M1, M4, M5 |
| claude-agent-sdk | 0.2.168 | M5 |
| mcp (Python SDK) | 2.3.0 | M5 |
| mypy | 2.4.0 | M1 |
| pytest | 9.1.1 | M1 |
| uv | 0.13.1 (installed in the test environment) | M1 |
| PostgreSQL | 16.15 | M6 |
| psycopg | 3.3.6 | M6 |
| Git | 2.43.0 | M7 |
| Docker Engine | 29.8.2 | M9 |

> [!note] Versions that differ from the current release
> PostgreSQL 18 is the current major version, but the sandbox had 16.15. The behavior that M6 teaches is the same in versions 16 to 18. The Docker runs in M9 used locally built base images, because the sandbox could not reach the public registries. Each lesson says so where it matters.

## 3. Official sources by module

| Module | Sources |
|---|---|
| M1 Python foundations | [Python docs: json](https://docs.python.org/3/library/json.html), [contextlib](https://docs.python.org/3/library/contextlib.html), [pathlib](https://docs.python.org/3/library/pathlib.html), [csv](https://docs.python.org/3/library/csv.html), [errors tutorial](https://docs.python.org/3/tutorial/errors.html), [modules tutorial](https://docs.python.org/3/tutorial/modules.html), [logging HOWTO](https://docs.python.org/3/howto/logging.html), [pdb](https://docs.python.org/3/library/pdb.html), [What's New in 3.14](https://docs.python.org/3.14/whatsnew/3.14.html), [Pydantic models](https://pydantic.dev/docs/validation/latest/concepts/models/), [uv init](https://docs.astral.sh/uv/concepts/projects/init/), [pytest](https://docs.pytest.org), [mypy](https://mypy.readthedocs.io) |
| M2 Callbacks, threads, generators, asyncio | [queue](https://docs.python.org/3/library/queue.html), [threading](https://docs.python.org/3/library/threading.html), [asyncio queues](https://docs.python.org/3/library/asyncio-queue.html), [yield expressions](https://docs.python.org/3/reference/expressions.html#yield-expressions), [Coroutines and tasks](https://docs.python.org/3/library/asyncio-task.html), [Runners](https://docs.python.org/3/library/asyncio-runner.html), [functools.partial](https://docs.python.org/3/library/functools.html#functools.partial), [Programming FAQ](https://docs.python.org/3/faq/programming.html), [PEP 779](https://peps.python.org/pep-0779/), [Pyodide compatibility](https://pyodide.org/en/latest/usage/wasm-constraints.html) |
| M3 HTTP, REST and JSON | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), [MDN status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status), [MDN methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods), [MDN idempotent](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent) |
| M4 FastAPI services | [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/), [handling errors](https://fastapi.tiangolo.com/tutorial/handling-errors/), [lifespan events](https://fastapi.tiangolo.com/advanced/events/), [async and await](https://fastapi.tiangolo.com/async/), [testing](https://fastapi.tiangolo.com/tutorial/testing/), [Starlette release notes](https://starlette.dev/release-notes/) |
| M5 Streaming, MCP tools, event channels | [WHATWG server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html), [MDN using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), [FastAPI server-sent events](https://fastapi.tiangolo.com/tutorial/server-sent-events/), [Agent SDK Python reference](https://code.claude.com/docs/en/agent-sdk/python), [Agent SDK streaming output](https://code.claude.com/docs/en/agent-sdk/streaming-output), [Claude API streaming](https://platform.claude.com/docs/en/build-with-claude/streaming), [MCP tools (spec 2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/server/tools), [MCP tools (spec 2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/server/tools), [SEP-1303](https://modelcontextprotocol.io/community/seps/1303-input-validation-errors-as-tool-execution-errors), [codecs](https://docs.python.org/3/library/codecs.html), and the source code of claude-agent-sdk 0.2.168, Starlette 1.9.0 and FastAPI 0.149.0 |
| M6 PostgreSQL | [Data definition](https://www.postgresql.org/docs/current/ddl.html), [Queries](https://www.postgresql.org/docs/current/queries.html), [Joins tutorial](https://www.postgresql.org/docs/current/tutorial-join.html), [Indexes](https://www.postgresql.org/docs/current/indexes.html), [Multicolumn indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html), [Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), [psycopg usage](https://www.psycopg.org/psycopg3/docs/basic/usage.html), [psycopg parameters](https://www.psycopg.org/psycopg3/docs/basic/params.html) |
| M7 Git | [Pro Git: branches](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell), [branching and merging](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging), [recording changes](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository), [contributing](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project), [git bisect](https://git-scm.com/docs/git-bisect), [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets), [removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) |
| M8 AI-assisted development | [Claude Code features overview](https://code.claude.com/docs/en/features-overview), [how Claude Code works](https://code.claude.com/docs/en/how-claude-code-works), [best practices](https://code.claude.com/docs/en/best-practices), [memory](https://code.claude.com/docs/en/memory), [Skills](https://code.claude.com/docs/en/skills), [subagents](https://code.claude.com/docs/en/sub-agents), [hooks guide](https://code.claude.com/docs/en/hooks-guide), [plugins](https://code.claude.com/docs/en/plugins), [Agent Skills](https://agentskills.io), [AGENTS.md](https://agents.md) |
| M9 Docker and deployment | [Docker build best practices](https://docs.docker.com/build/building/best-practices/), [what is an image](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/), [Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/), [Docker Desktop WSL 2](https://docs.docker.com/desktop/features/wsl/), [uv in Docker](https://docs.astral.sh/uv/guides/integration/docker/), [FastAPI in containers](https://fastapi.tiangolo.com/deployment/docker/), [Databricks Apps](https://docs.databricks.com/aws/en/dev-tools/databricks-apps/), [The Twelve-Factor App: config](https://12factor.net/config) |
| M10 Capstone | [Roadmap level 0](https://ai-engineer-roadmap-2026.vercel.app/level/0/) |

## 4. Measured results that matter most

These results changed what the lessons say, or they correct a common belief.

| Result | Lesson |
|---|---|
| Calling a generator function starts no code. The `_run` thread started only at the first `next()`. | [2.5](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l5-generators-and-yield), [5.5](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l5-case-study-the-run-bridge) |
| `None` as a sentinel lost a real item. `object()` lost nothing. | [2.4](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l4-queues-and-producer-consumer) |
| Four threads that read, pause and write a shared counter gave about 1,000 instead of 4,000. A `Lock` gave 4,000. | [2.3](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l3-threads) |
| A blocking `time.sleep(1.0)` inside `async def` froze the event loop for 1.05 s. `asyncio.to_thread` kept the longest gap at 0.05 s. | [2.7](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l7-blocking-calls-and-to-thread) |
| A `CancelledError` inside the agent ended the `_run` stream as if it were complete. | [5.5](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l5-case-study-the-run-bridge) |
| When the consumer left, the worker thread ran the agent to its end. Under FastAPI, the sync generator was closed only when the garbage collector ran. | [5.2](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l2-fastapi-streaming-responses), [5.5](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l5-case-study-the-run-bridge) |
| An async generator endpoint received `CancelledError` at the moment the client left. | [5.2](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l2-fastapi-streaming-responses) |
| In an SDK tool handler, a blocking call froze the loop for 0.85 s. `asyncio.to_thread` and an async client kept it at 0.05 s. | [5.3](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l3-mcp-tools-and-tool-execution) |
| An unknown tool, invalid tool arguments and an exception in a tool handler all came back to the model as `isError` tool results, not as protocol errors or Python exceptions. | [5.3](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l3-mcp-tools-and-tool-execution) |
| A handler for FastAPI's `HTTPException` did not catch routing 404 and 405 errors. A handler for Starlette's class did. | [4.2](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l2-validation-and-error-responses) |
| A plain async endpoint was not cancelled when its client left. | [4.4](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l4-def-vs-async-def-endpoints) |
| 40 parallel requests to a blocking `def` endpoint took 1.19 s, and 41 took 2.04 s: the AnyIO pool has 40 threads. | [4.4](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l4-def-vs-async-def-endpoints) |
| `httpx.MockTransport` does not apply httpx timeouts. | [3.5](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m03-http-rest-json/l5-inspecting-apis-with-curl-and-httpx) |
| A composite index cut a query from 10.112 ms to 0.090 ms. Three extra indexes made an insert of 100,000 rows slower. | [6.3](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql/l3-indexes-and-explain) |
| String formatting of SQL returned 4 rows to an injected input. A parameterized query returned 0. | [6.4](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql/l4-connecting-python-to-postgres) |
| A docker build after a code-only change took 1.01 s instead of 13.45 s, because the dependency layer was cached. | [9.2](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m09-docker-and-deployment/l2-dockerfiles-layers-and-uv) |
| A shell-form `CMD` took 10.18 s to stop and exited with 137. The exec form stopped in 0.52 s with exit 0. | [9.2](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m09-docker-and-deployment/l2-dockerfiles-layers-and-uv) |

## 5. Facts that are not verified

| Fact | Status | Lesson |
|---|---|---|
| The current MCP specification is 2026-07-28. | The tools page of that version was not opened. Lesson 5.3 uses the 2025-11-25 tools page, where input validation errors are tool execution errors (SEP-1303), and the 2025-06-18 page for comparison. Check the current version before you teach it. | [5.3](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l3-mcp-tools-and-tool-execution) |
| `build_server`, `_options`, `foundry_token` and `WORK_DIR` in the `_run` example | Assumptions from their names and their use. The example does not show them. | [5.5](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l5-case-study-the-run-bridge) |
| The order between an SDK message and a tool event from two different tasks | Not guaranteed by any document. The lessons tell you not to depend on it. | [5.4](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l4-user-visible-event-channels) |
| The RFC 9110 text on safe and idempotent methods | The fetches of the RFC sections were cut off. The definitions are quoted from MDN, which follows RFC 9110. | [3.2](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m03-http-rest-json/l2-methods-status-codes-and-retries) |
| The model API request headers in 3.1 | Shown as the shape from the provider documentation. Not fetched on 2026-10-19. | [3.1](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m03-http-rest-json/l1-the-request-response-cycle) |
| The setting `strict_content_type` (bodies with no `Content-Type` header) was added in FastAPI 0.132.0 | The version is from the roadmap research of 2026-10-18. The behavior of 0.149.0 was measured: it changes only bodies with no header, and a `text/plain` body fails in both settings. | [3.3](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m03-http-rest-json/l3-headers-parameters-bodies-and-auth) |
| Lakebase is a managed PostgreSQL, and the FastAPI SQL tutorial uses SQLModel | From the roadmap research of 2026-10-18. | [6.4](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql/l4-connecting-python-to-postgres) |
| Some Python doc pages in M1 (pathlib, csv, logging, pdb, modules) | Linked, not fetched on 2026-10-19. The behavior that the lessons show was measured. | M1 |
| The table of exit code 2 per hook event | From a summary of the hooks reference, not the raw page. The blocking behavior of a `PreToolUse` script was measured with sample JSON. | [8.4](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m08-ai-assisted-development/l4-hooks-plugins-and-portable-habits) |
| Start times and sizes of containers and virtual machines | Typical values, labeled as typical. | [9.1](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m09-docker-and-deployment/l1-images-and-containers) |

## 6. Where the experiments ran

All experiments ran in an isolated Linux sandbox on 2026-10-19, with no model, no API key and no access to company systems. The Agent SDK experiments used fakes for `query()` and called real SDK tool servers through an in-memory MCP client. A real model run can differ in timing. The order of events and the error paths do not depend on the model.
