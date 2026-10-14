---
title: "L1: Stream modes and get_stream_writer"
order: 1
summary: "A running LangGraph agent emits events through stream modes: values, updates, messages, custom, checkpoints, tasks and debug. Several modes at once give (mode, data) tuples or v2 StreamPart dicts. A tool emits its own progress events with get_stream_writer or ToolRuntime. Sync and async streaming, and how each event maps to a server-sent event for a chat UI. Every example ran."
status: not-started
tags: [langgraph, streaming, stream-mode, get-stream-writer, sse, tool-progress]
---

## 1. The question this idea answers

A user asks "What was the downtime at plant 3 yesterday?". The agent calls a SQL tool that takes 20 seconds, then writes the answer. Without streaming, the user sees nothing for 25 seconds. With streaming, the user can see "query started", then "rows ready: 42", then the answer word by word.

How do these events leave a running agent? LangGraph has **stream modes**. Each mode is a different view of the same run. You pick one or several, and you can add your own events from inside a tool. This lesson runs every mode on a `create_agent` agent with a fake model (langgraph 1.2.14, langchain 1.4.5, checked on 2026-10-13). It ends with the mapping from each event to a server-sent event for a web UI.

## 2. Mental model

> [!analogy] One kitchen, several feeds
> A restaurant kitchen sends several feeds to the manager's tablet. "values" is a photo of the whole kitchen after each round. "updates" is a note of what each cook just added. "messages" is the waiter's words, sent as he speaks them. "custom" is a note that a cook pins to the board: "oven on", "sauce ready".
>
> The run is the kitchen. A stream mode is a feed. `get_stream_writer` is the pin board.
>
> **Where it stops working:** the feeds are not separate connections. When you ask for several modes, all events arrive in **one** iterator, interleaved in the order the work happened. Your code must sort them by their mode label, and a slow consumer slows every feed.

## 3. Terms

| Term | Plain meaning |
|---|---|
| stream mode | One kind of event that `stream()` can emit: `values`, `updates`, `messages`, `custom`, `checkpoints`, `tasks` or `debug`. |
| `values` | The full state after each super-step. |
| `updates` | The update that each node returned, keyed by node name. |
| `messages` | Tuples of a message chunk and metadata, from every model call in the graph. |
| `custom` | Any data that code inside a node or tool writes with a stream writer. |
| `StreamWriter` | A callable that takes one value and writes it to the `custom` stream. |
| `get_stream_writer` | A function from `langgraph.config` that returns the writer of the current run. |
| `ToolRuntime` | An object injected into a tool parameter named `runtime`. It has `stream_writer` and `tool_call_id`. |
| `AIMessageChunk` | A piece of a model message, with text and, for tool calls, `tool_call_chunks`. |
| metadata | The dictionary that comes with each `messages` event, with keys such as `langgraph_node` and `langgraph_step`. |
| `StreamPart` | The v2 output format: a dictionary with `type`, `ns` and `data`. |
| `ns` | The namespace of an event: the path of subgraphs it came from. Empty for the top graph. |
| SSE (server-sent events) | An HTTP response that stays open and sends text events, each with an `event:` line and a `data:` line. |
| event streaming | The newer `stream_events(version="v3")` API with typed projections. |

## 4. Method and math

### 4.1 The modes

The installed source defines the modes as a `Literal` (`langgraph/types.py`, langgraph 1.2.14):

```python
StreamMode = Literal[
    "values", "updates", "checkpoints", "tasks", "debug", "messages", "custom"
]
```

The descriptions from the LangGraph streaming page (checked on 2026-10-13):

| Mode | Docs |
|---|---|
| `values` | "Full state after each step." |
| `updates` | "State updates after each step. Multiple updates in the same step are streamed separately." |
| `messages` | "2-tuples of (LLM token, metadata) from LLM calls." |
| `custom` | "Custom data emitted from nodes via `get_stream_writer`." |
| `checkpoints` | "Checkpoint events (same format as `get_state()`). Requires a checkpointer." |
| `tasks` | "Task start/finish events with results and errors. Requires a checkpointer." |
| `debug` | "All available info — combines `checkpoints` and `tasks` with extra metadata." |

The test agent has one tool, `downtime_query(plant)`. Its fake model first calls the tool and then answers "Plant 3 had 95 minutes of downtime.". So one turn has three super-steps: `model`, `tools`, `model`.

### 4.2 updates and values

`stream_mode="updates"` (real output, messages shortened):

```text
{'model': {'messages': ["AIMessage(content='', tool_calls=['downtime_query'])"]}}
{'tools': {'messages': ["ToolMessage(content='plant 3: 95 min')"]}}
{'model': {'messages': ["AIMessage(content='Plant 3 had 95 minutes of downtime.')"]}}
```

`stream_mode="values"` (message types of the full state each time):

```text
['human']
['human', 'ai']
['human', 'ai', 'tool']
['human', 'ai', 'tool', 'ai']
```

`updates` is small and tells you which node did what. `values` repeats the whole state on every step, so its size grows with the conversation. For a UI, `updates` is usually the better choice of the two.

### 4.3 messages

`stream_mode="messages"` gives `(chunk, metadata)` tuples from every model call (real output):

```text
node=model  step=1 AIMessageChunk(content='', tool_call_chunks=[('downtime_query', '{"plant": 3}', 'call_1')])
node=model  step=1 AIMessageChunk(content='')
node=tools  step=2 ToolMessage(content='plant 3: 95 min')
node=model  step=3 AIMessageChunk(content='Plant')
node=model  step=3 AIMessageChunk(content=' ')
node=model  step=3 AIMessageChunk(content='3')
...
node=model  step=3 AIMessageChunk(content='downtime.')
node=model  step=3 AIMessageChunk(content='')
```

The metadata keys in this run were `checkpoint_ns`, `langgraph_checkpoint_ns`, `langgraph_node`, `langgraph_path`, `langgraph_step`, `langgraph_triggers`, `lc_versions`, `ls_integration`, `ls_model_type` and `ls_provider`.

Three facts from this output:

1. The tool call streams as `tool_call_chunks`. With a real model, the arguments arrive as partial JSON strings that you join ([Stream events](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events)).
2. The `ToolMessage` also appears, as a whole message from the node `tools`, because the tool node returned it.
3. Every model call in the graph streams here, not only the agent's answer. [L3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) showed that the summarizer's tokens arrive from the node `SummarizationMiddleware.before_model`.

> [!trap] Filter by node
> The docs say that you can "filter the outputs by the `langgraph_node` field in the streamed metadata". Show text to the user only when `metadata["langgraph_node"] == "model"`. Otherwise summaries, routers and any other internal model call appear in the chat as if they were the answer.

### 4.4 custom and get_stream_writer

A tool emits its own events with the writer of the current run. This is a sketch of the test tool. The test replaced the slow query with a 50 ms sleep and returned a fixed text:

```python
from langgraph.config import get_stream_writer

@tool
def downtime_query(plant: int) -> str:
    """Total downtime minutes for one plant yesterday."""
    writer = get_stream_writer()
    writer({"stage": "query started", "plant": plant})
    rows = run_slow_sql(plant)                 # the long data query
    writer({"stage": "rows ready", "rows": len(rows)})
    return format_rows(rows)
```

With `stream_mode="custom"`, the test printed exactly the two dictionaries:

```text
{'stage': 'query started', 'plant': 3}
{'stage': 'rows ready', 'rows': 42}
```

Four more facts, all from runs:

| Situation | Result |
|---|---|
| `agent.invoke(...)` with the same tool | Works. The events are dropped. The `StreamWriter` docstring: "it's a no-op when not using `stream_mode="custom"`". |
| The tool called directly, `downtime_query.invoke({"plant": 3})`, outside a graph | `KeyError: '__pregel_runtime'` |
| A tool with a parameter `runtime: ToolRuntime` that calls `runtime.stream_writer({...})` | Works. `runtime.tool_call_id` gave `'call_7'`, and the model's tool schema still had only `plant`. |
| An `async def` tool with `get_stream_writer` under `astream` on Python 3.13 | Works. |

The `ToolRuntime` form is better for a UI. Put `tool_call_id` in every progress event. Then the UI can attach "rows ready" to the right tool card when two tools run in parallel. It is also easier to test, because a test can call the tool's function with a fake runtime object.

> [!trap] Async streaming before Python 3.11
> The docs warn: "In async code running on Python < 3.11, get_stream_writer will not work." The reason is that it depends on context variables, which asyncio tasks propagate only from 3.11 on. On older versions, take the `writer` as a node argument instead.

### 4.5 Several modes at once

Pass a list. The default output format (v1) is a `(mode, data)` tuple:

```text
tuple updates {'model': {'messages': ["AIMessage(content='', tool_calls=['downtime_query'])"]}}
tuple custom {'stage': 'query started', 'plant': 3}
tuple custom {'stage': 'rows ready', 'rows': 42}
tuple updates {'tools': {'messages': ["ToolMessage(content='plant 3: 95 min')"]}}
tuple updates {'model': {'messages': ["AIMessage(content='Plant 3 had 95 minutes of downtime.')"]}}
```

With `version="v2"`, every event is a `StreamPart` dictionary with the same shape, also for a single mode: `{"type": ..., "ns": ..., "data": ...}`. The docs: "Every chunk is a `StreamPart` dict with a consistent shape." The LangChain streaming page says that v2 "Requires LangGraph 1.1 or later". The start of a real v2 run with `["messages", "custom", "updates"]`:

```text
{'type': 'messages', 'ns': (), 'data': ('AIMessageChunk(... tool_call_chunks=[...])', {'langgraph_node': 'model'})}
{'type': 'messages', 'ns': (), 'data': ("AIMessageChunk(content='')", {'langgraph_node': 'model'})}
{'type': 'updates', 'ns': (), 'data': {'model': {...}}}
{'type': 'custom', 'ns': (), 'data': {'stage': 'query started', 'plant': 3}}
{'type': 'custom', 'ns': (), 'data': {'stage': 'rows ready', 'rows': 42}}
{'type': 'messages', 'ns': (), 'data': ("ToolMessage(content='plant 3: 95 min')", {'langgraph_node': 'tools'})}
{'type': 'updates', 'ns': (), 'data': {'tools': {...}}}
```

The order follows the work. The model's chunks come first, then the `updates` event of the same node when it finishes. The `custom` events come while the tool runs, before the tool's update. The default is still v1: the streaming page says "v1 (default)".

### 4.6 checkpoints, tasks and debug

The test counted the events of one turn:

| Mode | No checkpointer | With `InMemorySaver` |
|---|---|---|
| `checkpoints` | 0 events | 5 events, keys `config`, `metadata`, `next`, `parent_config`, `tasks`, `values` |
| `tasks` | 6 events | 6 events, start keys `id`, `input`, `metadata`, `name`, `triggers` |
| `debug` | 6 events | 11 events: `checkpoint`, `task` and `task_result` types |

> [!example] Worked example: 6 tasks and 11 debug events
> 1. The turn ran three tasks: `model`, `tools`, `model`.
> 2. Each task gives a start event and a result event: 3 × 2 = **6** task events.
> 3. With a checkpointer, the turn wrote 5 checkpoints: input, start, and one after each of the 3 super-steps ([L4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads)).
> 4. `debug` combines both: 6 + 5 = **11** events.

The docs say that `tasks` "Requires a checkpointer". In this run it emitted 6 events without one. Only `checkpoints` was empty without a checkpointer. These three modes are for debugging and tooling, not for a chat UI.

### 4.7 Sync and async

| | Sync | Async |
|---|---|---|
| Call | `for ev in agent.stream(inp, stream_mode=...)` | `async for ev in agent.astream(inp, stream_mode=...)` |
| Sync tools | Run normally | Work. The writer worked in the test on Python 3.13. |
| Async tools | `NotImplementedError: StructuredTool does not support sync invocation.` | Run normally |
| Use in | Scripts, notebooks, sync web handlers | Async web servers, for example FastAPI with `async def` endpoints |

The async run of the test gave the same events in the same order as the sync run. In an async web server, use `astream`, so one slow agent does not block the event loop ([Async generators](/notes/software-engineering/python/01-asyncio/l2-async-generators)).

### 4.8 From stream events to server-sent events

A chat UI needs a small, stable set of event types. It should not depend on LangGraph's internal shapes. So the web layer maps each stream event to an SSE event of its own:

| Stream event | Condition | SSE event |
|---|---|---|
| `messages`: `AIMessageChunk` | node is `model`, content not empty | `text-delta` with the text |
| `updates`: AI message with `tool_calls` | node is `model` | `tool-call` with id, name, arguments |
| `custom` | always | `tool-progress` with the data |
| `updates`: `ToolMessage` | node is `tools` | `tool-result` with the tool call id and content |
| end of the stream | | `done` |

The test ran this mapping in a FastAPI `StreamingResponse` with `media_type="text/event-stream"` and read it with `TestClient` ([FastAPI StreamingResponse and SSE](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse)). The generator body, shortened:

```python
for part in agent.stream({"messages": [HumanMessage(text)]},
                         stream_mode=["messages", "custom", "updates"], version="v2"):
    if part["type"] == "messages":
        chunk, meta = part["data"]
        if meta["langgraph_node"] == "model" and isinstance(chunk, AIMessageChunk) and chunk.content:
            yield sse("text-delta", {"delta": chunk.content})
    elif part["type"] == "custom":
        yield sse("tool-progress", part["data"])
    elif part["type"] == "updates":
        ...   # tool-call from AI messages with tool_calls, tool-result from ToolMessages
yield sse("done", {})
```

`sse(event, data)` returns `f"event: {event}\ndata: {json.dumps(data)}\n\n"`. The real response started like this:

```text
event: tool-call
data: {"id": "call_1", "name": "downtime_query", "args": {"plant": 3}}

event: tool-progress
data: {"stage": "query started", "plant": 3}

event: tool-progress
data: {"stage": "rows ready", "rows": 42}

event: tool-result
data: {"id": "call_1", "content": "plant 3: 95 min"}

event: text-delta
data: {"delta": "Plant"}
```

The status was 200 with `content-type: text/event-stream; charset=utf-8`. The same events are the input for the transcript. The application saves the user message, the tool calls and results, and the final text from these events, not from the state ([Three copies of a conversation](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation)).

> [!key] Stream modes are views, your SSE events are a contract
> `updates`, `messages` and `custom` together carry everything a chat UI needs: tool calls, tool progress, tool results and text deltas. Filter by node, map each kind to one SSE event type that you define, and keep that mapping in one function. The UI then depends on your contract, not on LangGraph's shapes.

### 4.9 Event streaming (v3)

The streaming page says: "For new applications, we recommend event streaming—the typed-projection API introduced in LangGraph v1.2" (checked on 2026-10-13). It is called as `graph.stream_events(input, version="v3")` and returns a run object with projections such as `messages`, `values`, `output`, `tool_calls` and `subgraphs`. The test called it on the same agent. It worked, and it printed this warning:

```text
LangChainBetaWarning: The v3 streaming protocol on Pregel is experimental.
```

The docs recommend it, and the installed code marks it experimental. This lesson uses `stream()` with stream modes, because they are the stable base layer. The event-streaming page itself calls stream modes the "low-level access" under event streaming.

### 4.10 Production view

| Concern | What to do |
|---|---|
| Correctness | Show text only from `langgraph_node == "model"`. Other model calls also stream. |
| UI contract | Map stream events to your own SSE event types in one function. Pin `version="v2"` so the shape does not change with the mode list. |
| Tool progress | Use `ToolRuntime.stream_writer` and include `tool_call_id`. Send small dictionaries, not row data. |
| Latency | Use `astream` in async servers. Never run a sync `stream()` loop on the event loop thread. |
| Payload size | Prefer `updates` over `values`. `values` resends the whole state on every step. |
| Testing | Tools that call `get_stream_writer` fail outside a graph with `KeyError`. Test them inside a graph, or use `ToolRuntime` and inject a fake. |
| Storage | Build the stored transcript from the same events that the UI receives. |
| Versions | Treat `stream_events(version="v3")` as experimental until the warning disappears. |

## 5. Code

These exercises go in `langchain-langgraph/11-streaming.ipynb`. They need no API key. Use a fake model that streams its text word by word and streams tool calls as `tool_call_chunks`.

**Exercise 1.1: one turn, four views.** Build the agent of section 4.1. Stream one turn with `updates`, `values`, `messages` and `custom`, one mode at a time.

Acceptance tests:

- `updates` gives three events: `model`, `tools`, `model`.
- `values` gives four states with 1, 2, 3 and 4 messages.
- `custom` gives exactly your two progress dictionaries.

**Exercise 1.2: progress with ids.** Change the tool to use `runtime: ToolRuntime` and include `tool_call_id` in every progress event. Make the fake model call the tool twice in parallel, for plants 3 and 7.

Acceptance tests:

- Every `custom` event has a `tool_call_id` that matches one of the two calls.
- The model's tool schema has no `runtime` parameter.

**Exercise 1.3: the SSE contract.** Write `to_sse(part)` that maps one v2 `StreamPart` to zero or more SSE strings, with the table of section 4.8. Serve it with FastAPI and read it with `TestClient`.

Acceptance tests:

- The response has `content-type` `text/event-stream`.
- The event order is `tool-call`, `tool-progress`, `tool-progress`, `tool-result`, `text-delta` events, `done`.
- With `SummarizationMiddleware` added and a long input, no summary text appears in any `text-delta` event.

## 6. Common mistakes

1. **Printing every `AIMessageChunk`.** Summaries and other internal model calls also stream. Filter by `langgraph_node`.
2. **Using `values` for a chat UI.** It resends the full state on every step.
3. **Expecting custom events from `invoke()`.** The writer is a no-op without `stream_mode="custom"`.
4. **Unit-testing a tool that calls `get_stream_writer` directly.** Outside a graph it raises `KeyError: '__pregel_runtime'`.
5. **Progress events with no tool call id.** With parallel tools, the UI cannot tell which tool is "rows ready".
6. **Letting the UI parse LangGraph shapes.** Map them to your own SSE event types.

## 7. One-minute explanation

`stream()` emits events in one or more modes. `values` is the full state after each super-step, and `updates` is what each node returned. `messages` is `(chunk, metadata)` from every model call, and `custom` is whatever a node or tool writes with a stream writer. `checkpoints`, `tasks` and `debug` serve debugging. A list of modes gives `(mode, data)` tuples, or with `version="v2"`, dictionaries with `type`, `ns` and `data`. A tool gets the writer from `get_stream_writer()` or from `ToolRuntime`, and the `ToolRuntime` form also gives the tool call id for the UI. In an async server you use `astream`, and on Python before 3.11 the writer must be passed explicitly. For a web UI, filter text by the `model` node and map tool calls, progress, results and text to your own SSE event types. Store the transcript from the same events.

## 8. Check questions

```check
{
  "question": "A chat UI prints every AIMessageChunk from stream_mode=\"messages\". After a long conversation, users see a strange paragraph that starts like a meeting summary before the answer. Why, and what is the fix?",
  "answer": "SummarizationMiddleware calls the summarizer model inside the graph, and the messages mode streams every model call, so the summary tokens arrive from the node SummarizationMiddleware.before_model. The fix is to show text only when metadata[\"langgraph_node\"] == \"model\"."
}
```

```check
{
  "question": "With stream_mode=[\"updates\", \"custom\"] and the default version, what is the type of each item, and how does the item for a tool progress event look?",
  "answer": "Each item is a tuple (mode, data). A tool progress event is (\"custom\", data). The data is exactly the value the tool passed to the writer, for example (\"custom\", {\"stage\": \"rows ready\", \"rows\": 42})."
}
```

```check
{
  "question": "A test calls downtime_query.invoke({\"plant\": 3}) directly and gets KeyError: '__pregel_runtime'. Why, and give two ways to test the tool.",
  "answer": "get_stream_writer reads the runtime of the current graph run, and there is no graph run, so the lookup fails. Way 1: test the tool inside a small graph or agent run. Way 2: write the tool with a runtime: ToolRuntime parameter and call it with a fake runtime whose stream_writer records the events."
}
```

```check
{
  "question": "One turn has the steps model, tools, model. With a checkpointer, how many events does stream_mode=\"debug\" emit? Show the arithmetic.",
  "answer": "11. Three tasks give 3 x 2 = 6 task events (start and result). The turn writes 5 checkpoints: the input checkpoint, the start checkpoint, and one after each of the 3 super-steps. 6 + 5 = 11."
}
```

## 9. Links

- Previous part: [L4.2: Checkpointers and threads](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads)
- Next part: [L6.1: The old agent API](/notes/ai/langchain-langgraph/06-legacy-api/l1-old-agent-api)
- The web layer: [FastAPI StreamingResponse and SSE](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse)
- Provider stream events: [Stream events](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events)
- What to store from the events: [Three copies of a conversation](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation)
- [Glossary](/notes/ai/langchain-langgraph/glossary)
