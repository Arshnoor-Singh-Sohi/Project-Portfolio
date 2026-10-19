---
title: "M5 Streaming, MCP tools and event channels"
order: 5
summary: "Steps 7 and 8 of the learning order: SSE, FastAPI streaming, MCP tools, user-visible events, the _run bridge case study and the meanings of partial."
---

An agent answer can take a minute. During that minute the model writes text, calls tools and makes tables. This module teaches how each piece travels from the agent to the screen of the user while the agent still works. It joins every idea of module 2 into one design: callbacks, closures, threads, queues, generators and the event loop.

**Outcome:** you can stream agent events to a browser with FastAPI. You can write MCP tools that do not block the event loop. You keep tool results for the model apart from events for the user. You can explain every line of a thread-and-queue bridge.

**Before this module:** all of [M2 Callbacks, threads, generators and asyncio](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations), [3.1 The HTTP request-response cycle](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m03-http-rest-json/l1-the-request-response-cycle) and [4.4 def vs async def endpoints](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l4-def-vs-async-def-endpoints). The [roadmap](/notes/ai/ai-engineering/01-software-engineering-fundamentals/roadmap) explains why steps 7 and 8 come after the HTTP and FastAPI modules.

| Code | Lesson | Core idea | Exercise runs in | Status |
|---|---|---|---|---|
| 5.1 | [Streaming over HTTP and server-sent events](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l1-streaming-and-server-sent-events) | Step 7a. An event stream is text: fields, a blank line ends each event, the client reconnects. | Browser lab | not started |
| 5.2 | [FastAPI StreamingResponse, EventSourceResponse and generators](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l2-fastapi-streaming-responses) | Step 7b. A generator is the response body. An async generator stops at once on disconnect. A sync one does not. | Local practice project | not started |
| 5.3 | [MCP tools and how a tool call runs](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l3-mcp-tools-and-tool-execution) | Step 8a. A tool handler runs as a task on your event loop. Await async work. Move only blocking work to a thread. | Local practice project | not started |
| 5.4 | [Tool results vs user-visible events](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l4-user-visible-event-channels) | Step 8b. The model gets a short tool result. The user gets events through an emit callback and one event channel. | Browser lab | not started |
| 5.5 | [Case study: the _run bridge, line by line](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l5-case-study-the-run-bridge) | A worker thread runs the agent loop. A queue carries messages and events. A sentinel ends the stream. yield delivers each item. | Local practice project | not started |
| 5.6 | [What "partial" means in streaming and event-driven systems](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l6-what-partial-means) | Partial outputs, incremental events, incomplete results and partial chunks are four different things. | Browser lab | not started |

## Study order

Study the lessons in the order of the table. Lesson 5.5 uses every idea of lessons 5.1 to 5.4. Lesson 5.6 names the kinds of "partial" data that lessons 5.1 to 5.5 show.

## Deeper notes in other subjects

- [FastAPI StreamingResponse and SSE](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse): proxy buffering through nginx and disconnect tests.
- [Sync code calling async code](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code): other bridges between sync and async code, with measurements.
- [In-process MCP tools](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools): tool names, allowed_tools and the control-request round trip, from runs of the real CLI.
- [Stream events](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events): the raw event stream of the Messages API.
