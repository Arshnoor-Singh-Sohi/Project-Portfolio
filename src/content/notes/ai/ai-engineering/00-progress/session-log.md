---
title: "Session log"
order: 1
summary: "What happened in each session, newest first."
status: in-progress
---

## Notes update: 2026-10-19

**Topic:** level 0 (L0, Software engineering fundamentals) of the AI Engineer Roadmap 2026 is written. No study session happened.

### What exists now

- The subject folder `ai/ai-engineering`, with the course plan, the glossary (545 terms), the sources page and this progress folder.
- Part 01 for L0: the [learning roadmap](/notes/ai/ai-engineering/01-software-engineering-fundamentals/roadmap), 10 module folders and 49 lessons. Every lesson has the status `not-started`.
- Parts 02 to 16 for L1 to L15: one folder page each, with the status "planned".

### Decisions

| Question | Choice |
|---|---|
| Where does the AI engineering section live? | A new subject, `ai/ai-engineering`, with one part folder for each roadmap level. |
| How is L0 split? | 10 modules. The site's M0.1 becomes M1 (Python) and M2 (callbacks, threads, generators, asyncio). The streaming topics of M0.3 and the added MCP topics become M5. |
| Which order for the concurrency topics? | The 8 steps that I gave: functions as values and callbacks, lambdas and closures, threads and `queue.Queue`, generators, asyncio, `asyncio.to_thread`, SSE and FastAPI streaming, MCP tools and event channels. M3 (HTTP) and M4 (FastAPI) come between step 6 and step 7, because step 7 needs them. |
| Where do the exercises run? | Pure Python exercises in browser labs. Threads, servers, PostgreSQL, Docker and Git in a local practice project outside the Downloads folder. The browser lab has no threads. |

### My request, in my words

The questions for the case study: "Explain why the query runs in a separate thread and event loop, how `q.put` acts as a callback, how events travel from producer to consumer, why the sentinel is necessary, and how `yield` streams results to the caller."

The rule for MCP tools: "use `async def` when the tool's own operations are asynchronous, such as `httpx.AsyncClient` requests or an async database driver. In that case, the tool does not need a worker thread for those operations."

The answers are in [5.5 Case study: the _run bridge](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l5-case-study-the-run-bridge), section "Questions and answers", and in [5.3 MCP tools](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l3-mcp-tools-and-tool-execution).

- Two independent technical reviews checked modules M1 to M5 against sandbox runs, library source code and the docs. They found 8 serious errors and 21 small ones. All were corrected before the notes were saved.

### Findings to remember

- In the `_run` example, the worker thread starts only at the first `next()`, not when `_run` is called.
- A `CancelledError` inside the agent passes `except Exception`. The stream then ends as if it were complete.
- When the consumer leaves, nothing stops the worker. The agent runs to its end. Under FastAPI, the sync generator was closed only when the garbage collector ran.
- An SDK tool handler runs on the same event loop as `pump`. A blocking call inside it freezes the loop. An async client or `asyncio.to_thread` keeps it free.

### Open

- Start the diagnostic for L0 with lesson 1.1, or with a short placement test if I already know M1.
- Make the local practice project (lesson 1.9) before module 3.
- The current MCP specification version (2026-07-28) was not opened for the tools page. Check it before lesson 5.3 is studied.
