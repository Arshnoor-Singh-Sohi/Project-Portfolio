---
title: "01 L0 Software engineering fundamentals"
order: 11
summary: "Level 0 of the roadmap: Python, concurrency, HTTP, FastAPI, streaming, MCP tool events, PostgreSQL, Git, coding agents and Docker, with a no-AI capstone."
---

This part is level 0 (L0) of the AI Engineer Roadmap 2026. It has no AI inside it. It builds the software engineering base that every later level needs.

Many AI engineer interviews test you as a normal software engineer first. Most production failures in AI products are normal software bugs: a blocked event loop, a lost exception, a leaked secret, a missing index. The roadmap site gives this level an interview weight of 9/10 and an on-the-job weight of 10/10.

**Level goal:** build, test, debug and deploy a real Python web service with no AI inside it. You may use a coding agent to help. You must explain and verify everything that it writes.

**Start here:** [the L0 learning roadmap](/notes/ai/ai-engineering/01-software-engineering-fundamentals/roadmap). It gives the order of study, the 8-step order for callbacks, threads, generators, asyncio, streaming and MCP events, and a map of the `_run` example.

## Finish line

I master this level when all items are true, with no notes and no AI.

- [ ] Write a small multi-file Python app with type hints, tests and locked dependencies.
- [ ] Explain how a callback, a closure, a thread, a queue, a generator and an event loop work. Predict the output of a small program that uses them.
- [ ] Explain every line of the `_run` example: the worker thread, the event loop, `q.put` as a callback, the sentinel, `yield`, and the failure paths.
- [ ] Choose between `def`, `async def` and `asyncio.to_thread` for a given piece of work, with a reason.
- [ ] Read unknown API documentation, build a raw HTTP request, and decide whether a failed call is safe to retry.
- [ ] Build a FastAPI service with validated input and output, one error shape, shared clients in lifespan, and tests.
- [ ] Stream server-sent events from FastAPI and say what happens to the producer when the client leaves.
- [ ] Separate a tool result (for the model) from a user-visible event (for the UI) in an agent tool.
- [ ] Explain what "partial" means for deltas, events and results, and how a consumer knows that a result is complete.
- [ ] Model data in PostgreSQL, write joins and aggregates, add an index and prove its effect with `EXPLAIN ANALYZE`.
- [ ] Work with branches, pull requests and merge conflicts, and keep secrets out of Git history.
- [ ] Use a coding agent with a plan, context files, a Skill and a hook, and read every diff before you accept it.
- [ ] Containerize the service, run it with PostgreSQL in Compose, and deploy it to a public URL.
- [ ] Ship the capstone and pass its done-when checklist.

## Modules

| Module | Folder | Lessons | Roadmap module | Content |
|---|---|---|---|---|
| M1 | [Python foundations](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations) | 10 | M0.1 | Values, functions, data structures, mutability, classes, exceptions, files, types, packages, tests |
| M2 | [Callbacks, threads, generators and asyncio](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations) | 7 | M0.1 topic 6, plus added topics | Steps 1 to 6 of the learning order |
| M3 | [HTTP, REST and JSON](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m03-http-rest-json) | 5 | M0.2 | The request-response cycle, methods, status codes, retries, auth, JSON, REST design |
| M4 | [FastAPI services](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services) | 5 | M0.3 | Routes, validation, errors, dependencies, lifespan, def vs async def, tests |
| M5 | [Streaming, MCP tools and event channels](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events) | 6 | added topics | Steps 7 and 8, the `_run` case study, the meanings of "partial" |
| M6 | [PostgreSQL persistence](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql) | 4 | M0.4 | Modeling, SQL, indexes, connecting from Python |
| M7 | [Git and collaboration](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m07-git) | 3 | M0.5 | Commits, branches, pull requests, conflicts, history, review |
| M8 | [AI-assisted development](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m08-ai-assisted-development) | 4 | M0.6 | Coding agents, context files, Skills, subagents, MCP, hooks, plugins |
| M9 | [Docker and deployment](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m09-docker-and-deployment) | 4 | M0.7 | Images, Dockerfiles, Compose, deployment, production config |
| M10 | [Capstone: ship a no-AI REST service](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m10-capstone) | 1 | M0.8 | The level project and its checklist |

Total: 49 lessons. Every lesson has the status `not-started` until I pass its gate.

## Where the exercises run

| Kind of exercise | Where it runs |
|---|---|
| Pure Python, Pydantic, closures, generators, asyncio without threads | A browser lab on this site. Each lesson has a link. |
| Threads, servers, PostgreSQL, Docker, Git, curl | My local practice project: one uv project in one Git repository, outside the Downloads folder. It grows into the capstone repository. |

The browser lab runs Python 3.14 in Pyodide. Pyodide "does not support threading or multiprocessing" (Pyodide docs, checked on 2026-10-19). So no thread exercise runs in a browser lab.

## Databricks angle

These points connect L0 to Databricks work. The facts come from the roadmap research of 2026-10-18. Check them again before a lesson uses them.

- **Databricks Apps** can host the capstone pattern: apps run on serverless compute and integrate with Unity Catalog, Databricks SQL and OAuth. See [Databricks Apps](/notes/platforms/databricks/01-apps/l1-databricks-apps).
- **Lakebase** is a managed PostgreSQL inside Databricks. An app connects to it with any PostgreSQL driver. This maps to module M6.
- **Genie Code Skills** use the same `SKILL.md` format as the Agent Skills standard of module M8.

## Sources

- The roadmap level page: https://ai-engineer-roadmap-2026.vercel.app/level/0/ (captured on 2026-10-18)
- The verified sources and versions of this part: [Sources and verification](/notes/ai/ai-engineering/sources-and-verification)
