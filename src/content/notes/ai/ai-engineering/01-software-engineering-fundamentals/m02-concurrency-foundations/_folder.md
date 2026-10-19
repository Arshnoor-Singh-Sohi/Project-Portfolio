---
title: "M2 Callbacks, threads, generators and asyncio"
order: 2
summary: "Steps 1 to 6 of the learning order: callbacks, closures, threads, queues, generators, asyncio and blocking calls."
---

This module teaches the Python tools that move work and data between parts of a program that run at different times. An AI service needs them everywhere. A tool reports progress through a callback. A worker thread runs an async SDK. A queue carries messages to a stream. An event loop runs many model calls at the same time.

**Outcome:** you can explain and write code that passes callbacks, starts threads and moves items and errors through a queue. You can stream with generators and run async work without blocking the event loop.

**Before this module:** [M1 Python foundations](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations), especially [1.4 Mutability, references and scope](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l4-mutability-references-and-scope) and [1.6 Exceptions and context managers](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l6-exceptions-and-context-managers).

The lessons follow steps 1 to 6 of the [learning order](/notes/ai/ai-engineering/01-software-engineering-fundamentals/roadmap). Step 3 has two lessons. Steps 7 and 8 are in [M5](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events), after the HTTP and FastAPI modules.

| Code | Step | Lesson | Core idea | Exercise runs in | Status |
|---|---|---|---|---|---|
| 2.1 | 1 | [Functions as values and callbacks](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l1-functions-as-values-and-callbacks) | A function is a value. `q.put` is a bound method that works as a callback. `emit` publishes events. | Browser lab | not started |
| 2.2 | 2 | [Lambdas and closures](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l2-lambdas-and-closures) | A closure keeps outer variables in cells. Loops bind late. `name=name` stores the value. | Browser lab, one local exercise | not started |
| 2.3 | 3 | [Threads](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l3-threads) | `threading.Thread`, `start`, `join`, daemon threads, the GIL, races, lost exceptions. | Local practice project | not started |
| 2.4 | 3 | [Queues and the producer-consumer pattern](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l4-queues-and-producer-consumer) | `put` and `get` block. A sentinel ends the stream. An exception item carries errors. | Local practice project | not started |
| 2.5 | 4 | [Generators, yield, close() and GeneratorExit](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l5-generators-and-yield) | A generator pauses at each `yield`. `close()` raises `GeneratorExit` there. | Browser lab | not started |
| 2.6 | 5 | [asyncio, async def, await and the event loop](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l6-asyncio-and-the-event-loop) | One thread, many coroutines. `await` gives the loop back. `asyncio.run` makes a loop. | Browser lab | not started |
| 2.7 | 6 | [Blocking calls, asyncio.to_thread and when to use async def](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l7-blocking-calls-and-to-thread) | A blocking call freezes the loop. `to_thread` moves it to a worker thread. | Browser lab and local practice project | not started |

All measured outputs in these lessons come from sandbox runs on 2026-10-19 with Python 3.13.16. The generator, closure, queue and asyncio scripts gave the same results on Python 3.15.0b4. Only the totals of the race test differ, because they change from run to run.

The deeper notes of the subject [Python for AI Services](/notes/software-engineering/python) start where this module ends: [The event loop and coroutines](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines), [Async generators](/notes/software-engineering/python/01-asyncio/l2-async-generators) and [Sync code calling async code](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code).
