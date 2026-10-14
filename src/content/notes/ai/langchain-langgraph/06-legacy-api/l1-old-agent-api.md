---
title: "L1: The old agent API"
order: 1
summary: "Older examples build agents with langgraph.prebuilt.create_react_agent, trim history with pre_model_hook, and summarize with the langmem SummarizationNode. What each one did, the real deprecation warning, the difference between returning messages and llm_input_messages, and a migration table from every old name to its create_agent equivalent."
status: not-started
tags: [langgraph, create-react-agent, pre-model-hook, langmem, migration, legacy]
---

## 1. The question this idea answers

Many blog posts, notebooks and older answers on the web build agents with `create_react_agent` from `langgraph.prebuilt`. They manage long histories with a `pre_model_hook`, and some summarize with `SummarizationNode` from the `langmem` package.

The agent backends in this course use `create_agent` and middleware instead. So you will not write the old API. But you will read it, often, and you must translate it without bugs. The most dangerous detail is small. One key name in a hook result decides the fate of old messages. They are either deleted from the saved state, or hidden from one model call only.

This lesson is for recognition only (stage "Know only"). It uses langgraph 1.2.14, langgraph-prebuilt 1.1.0 and langmem 0.0.30 (checked on 2026-10-13).

## 2. Mental model

> [!analogy] An old street map
> A city renames streets and moves a few bus stops. Your old map still shows the old names. Most streets are still there under a new name. A few stops moved to a different street, and one old bus line still runs but no longer stops at the main station.
>
> `create_react_agent` is the old map. Most parameters have a new name in `create_agent`. The hooks moved to middleware. `SummarizationNode` still runs, but it does not work inside `create_agent`.
>
> **Where it stops working:** a street rename changes nothing about the street. Here one rename hides a change of behavior: the old hook chose between a persistent and a transient change by the key name it returned. The new API chooses by the hook type.

## 3. Terms

| Term | Plain meaning |
|---|---|
| `create_react_agent` | The old agent factory in `langgraph.prebuilt`. It is deprecated. |
| `LangGraphDeprecatedSinceV10` | The warning class for APIs deprecated in LangGraph 1.0 with removal planned for 2.0. |
| `pre_model_hook` | An old parameter: a node that runs before each model call. |
| `post_model_hook` | An old parameter: a node that runs after each model call. |
| `llm_input_messages` | A key that a `pre_model_hook` can return. The model receives these messages, and the state does not change. |
| `prompt` | The old name of the system prompt parameter. |
| `agent` node | The old name of the node that calls the model. The new name is `model`. |
| langmem | A LangChain package with memory utilities. Version 0.0.30 was checked. |
| `SummarizationNode` | A langmem node that summarizes old messages for the model input. |
| `RunningSummary` | A langmem object that holds the summary text and the ids of the messages it covers. |

## 4. Method and math

### 4.1 The deprecation

The decorator in `langgraph/prebuilt/chat_agent_executor.py` (langgraph-prebuilt 1.1.0):

```python
@deprecated(
    "create_react_agent has been moved to `langchain.agents`. Please update your import to `from langchain.agents import create_agent`.",
    category=LangGraphDeprecatedSinceV10,
)
def create_react_agent(...)
```

The warning class sets `since=(1, 0), expected_removal=(2, 0)`. The real warning at import and call:

```text
WARNING: LangGraphDeprecatedSinceV10 - create_react_agent has been moved to `langchain.agents`. Please update your import to `from langchain.agents import create_agent`. Deprecated in LangGraph V1.0 to be removed in V2.0.
```

The old function still works in langgraph 1.2.14. Its graph, printed from a real build:

```text
nodes: ['__start__', 'agent', 'tools', '__end__']
```

Compare the `create_agent` graph: `['__start__', 'model', 'tools', '__end__']` ([create_agent](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent)). A stream filter that waits for the node `agent` receives nothing from a new agent. The migration guide says: "rename `"agent"` to `"model"`" (checked on 2026-10-13).

### 4.2 The old prompt parameter

The old docstring lists four forms of `prompt`: a `str`, a `SystemMessage`, a `Callable` that takes the full state, or a `Runnable`. A real test with `prompt="You answer production questions."`:

```text
model input: ['SystemMessage', 'HumanMessage'] | state: ['HumanMessage', 'AIMessage']
```

So the old string prompt, like the new `system_prompt`, reaches the model but is not stored in the state. The callable and runnable forms map to `@dynamic_prompt` in the new API ([the middleware hooks](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks)).

### 4.3 pre_model_hook: two keys, two kinds of change

A `pre_model_hook` was a graph node in front of the `agent` node. The docstring defines its result:

```python
# At least one of `messages` or `llm_input_messages` MUST be provided
{
    # If provided, will UPDATE the `messages` in the state
    "messages": [RemoveMessage(id=REMOVE_ALL_MESSAGES), ...],
    # If provided, will be used as the input to the LLM,
    # and will NOT UPDATE `messages` in the state
    "llm_input_messages": [...],
    # Any other state keys that need to be propagated
    ...
}
```

So the key name chose the kind of change ([transient vs persistent context](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context)):

| Returned key | The model receives | The saved state | Kind |
|---|---|---|---|
| `llm_input_messages` | the returned list | unchanged | transient |
| `messages` | the returned list | replaced by the returned list (through the reducer) | persistent |

A real test sent 5 old user messages. Both hooks kept the last 2 for the model:

```python
def transient_hook(state):
    return {"llm_input_messages": state["messages"][-2:]}

def persistent_hook(state):
    return {"messages": [RemoveMessage(id=REMOVE_ALL_MESSAGES), *state["messages"][-2:]]}
```

```text
pre_model_hook returns 'llm_input_messages': model saw ['HumanMessage', 'HumanMessage'], state after run has 6 messages
pre_model_hook returns 'messages': model saw ['HumanMessage', 'HumanMessage'], state after run has 3 messages
```

The model input was the same. The saved state was not: 6 messages (5 old plus the answer) against 3 (2 kept plus the answer). The other 3 user messages were deleted from the state for every later turn.

> [!example] Worked example: translating both hooks
> The transient hook keeps the state and changes one call. In the new API that is `wrap_model_call` with `handler(request.override(messages=request.messages[-2:]))`.
>
> The persistent hook rewrites the state. In the new API that is `before_model` returning `{"messages": [RemoveMessage(id=REMOVE_ALL_MESSAGES), *kept]}`.
>
> Check the result with the two-question test: after one run, is the state different? The `llm_input_messages` version and the `wrap_model_call` version must both leave 6 messages. The `messages` version and the `before_model` version must both leave 3.

> [!trap] The migration guide maps every pre_model_hook to before_model
> The guide says: "Pre-model hooks are now implemented as middleware with the `before_model` method." That is right for a hook that returns `messages`. A hook that returns `llm_input_messages` is transient, and `before_model` is persistent. Translate such a hook to `wrap_model_call`, or the migrated agent deletes history that the old agent kept.

`post_model_hook` maps to `after_model`. The old docstring notes that it is "Only available with `version="v2"`". In `version="v2"` (the default), tool calls are distributed with `Send`, as in `create_agent`.

### 4.4 The langmem SummarizationNode

`SummarizationNode` is a node for a hand-built `StateGraph`. Its constructor in langmem 0.0.30:

```python
SummarizationNode(
    *,
    model,
    max_tokens,
    max_tokens_before_summary=None,
    max_summary_tokens=256,
    token_counter=count_tokens_approximately,
    initial_summary_prompt=..., existing_summary_prompt=..., final_prompt=...,
    input_messages_key="messages",
    output_messages_key="summarized_messages",
    name="summarization",
)
```

Its docstring describes the behavior: "once the cumulative number of message tokens reaches `max_tokens_before_summary`, all messages within `max_tokens_before_summary` are summarized (excluding the system message, if any) and replaced with a new summary message."

It returns `{"summarized_messages": [...], "context": {"running_summary": RunningSummary}}`. `RunningSummary` holds `summary`, `summarized_message_ids` and `last_summarized_message_id`, so the next run does not summarize the same messages again.

The default output key differs from the input key. The docstring warns: "By default, the `output_messages_key` **is different** from the `input_messages_key`. This is done to decouple summarized messages from the main list of messages in the graph state". So by default the `messages` list keeps every message, and the model reads `summarized_messages`. Setting both keys to `messages` overwrites the history.

| | langmem `SummarizationNode` | `SummarizationMiddleware` |
|---|---|---|
| Runs in | a hand-built `StateGraph`, or an old `pre_model_hook` | `create_agent`, as middleware |
| Default effect on `messages` | unchanged (writes `summarized_messages`) | replaced by a summary and the kept messages |
| Memory of earlier summaries | `context["running_summary"]` | the summary message in the state |
| Status (checked on 2026-10-13) | no deprecation marker in the 0.0.30 source | current |

[SummarizationMiddleware](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) covers the new class in depth.

### 4.5 The migration table

The left column is what you find in old code. The right column is what you write instead. Sources: the LangChain v1 migration guide and the installed source (checked on 2026-10-13).

| Old | New |
|---|---|
| `from langgraph.prebuilt import create_react_agent` | `from langchain.agents import create_agent` |
| `prompt="..."` | `system_prompt="..."` |
| `prompt=callable` or a `Runnable` | `@dynamic_prompt` middleware |
| `pre_model_hook` returning `messages` | `before_model` middleware |
| `pre_model_hook` returning `llm_input_messages` | `wrap_model_call` with `request.override(messages=...)` |
| `post_model_hook` | `after_model` middleware |
| `state_modifier=` | middleware |
| node name `"agent"` in stream filters | `"model"` |
| Pydantic or dataclass `state_schema` | a `TypedDict` that extends `AgentState` |
| a model with tools already bound | the plain model and `tools=[...]` |
| a callable `model` for dynamic model choice | `wrap_model_call` with `request.override(model=...)` |
| `response_format=("prompt...", Schema)` | `ToolStrategy` or `ProviderStrategy`. The prompted form is removed. |
| a separate structured-output node | structured output inside the main loop |
| langmem `SummarizationNode` in a pre-model hook | `SummarizationMiddleware`, after you decide transient or persistent |

> [!key] Translate by behavior, not by name
> Most of the old API maps one to one: a new import, `system_prompt`, the node name `model`, and middleware for hooks. The one trap is the old hook result: `llm_input_messages` was transient and `messages` was persistent. Before you migrate any hook, run the two-question test on the old and the new version, and compare the saved state after one run.

### 4.6 Production view

| Concern | What to do |
|---|---|
| Correctness | Compare the saved state of the old and new agent after the same run before you switch. |
| Streaming | Search all stream consumers for the node name `agent`. |
| Maintenance | Plan the migration from `create_react_agent` before LangGraph 2.0. |
| Code review | Reject a new import from `langgraph.prebuilt` for agents. |

## 5. Common mistakes

1. **"create_react_agent is gone."** It still works in langgraph 1.2.14, with a deprecation warning. Removal is expected in 2.0.
2. **Mapping every `pre_model_hook` to `before_model`.** A hook that returned `llm_input_messages` was transient. Use `wrap_model_call`.
3. **Keeping stream filters on the node `agent`.** The new node is `model`. The old filter receives nothing.
4. **Thinking the old string prompt was stored in the state.** It was added in front of the model input only, as in the new API.
5. **Assuming `SummarizationNode` deletes history.** By default it writes `summarized_messages` and leaves `messages` unchanged.

## 6. One-minute explanation

`create_react_agent` from `langgraph.prebuilt` was the agent factory before LangChain v1. It still runs in langgraph 1.2.14 but warns that it moved to `langchain.agents` as `create_agent`, with removal expected in LangGraph 2.0. Its model node was named `agent`, which is `model` now, and its `prompt` parameter is `system_prompt` now. Its `pre_model_hook` could return two keys: `llm_input_messages` changed only the model input, which is transient, while `messages` rewrote the saved history, which is persistent. In a test, both gave the model the same 2 messages, but one left 6 messages in the state and the other left 3. So translate a `messages` hook to `before_model` and an `llm_input_messages` hook to `wrap_model_call`. The langmem `SummarizationNode` is not deprecated, but it is a node for hand-built graphs, and by default it writes a separate `summarized_messages` key. Inside `create_agent` you use `SummarizationMiddleware` instead.

## 7. Check questions

```check
{
  "question": "An old pre_model_hook returns {\"llm_input_messages\": trim(state[\"messages\"])}. A colleague migrates it to a before_model hook that returns {\"messages\": [RemoveMessage(id=REMOVE_ALL_MESSAGES), *trim(state[\"messages\"])]}. What changes for the users of the agent?",
  "hint": "Ask the two questions: is the saved state different, and does it run again from the full state?",
  "answer": "The old hook was transient: the saved history stayed complete, and only the model input was trimmed. The new hook is persistent: the trimmed messages are deleted from the state for every later turn. The correct translation is wrap_model_call with request.override(messages=trim(request.messages))."
}
```

```check
{
  "question": "A dashboard shows streamed tokens only when the node name is agent. After the move to create_agent it shows nothing. Why?",
  "answer": "create_agent names the model node model, not agent. The migration guide says to rename agent to model in stream filters."
}
```

```check
{
  "question": "With default settings, does the langmem SummarizationNode remove old messages from the messages key? Where does the model read the summary?",
  "answer": "No. By default output_messages_key is summarized_messages, different from the input key messages. The messages list keeps every message. The model node reads summarized_messages, which holds the summary message and the remaining messages. The running summary is stored in context[\"running_summary\"]."
}
```

## 8. Links

- Previous part: [Stream modes and get_stream_writer](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer)
- Next: none. This is the last lesson of the course plan.
- The new factory: [create_agent](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent)
- The new hooks: [The middleware hooks](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks)
- The new summarizer: [SummarizationMiddleware](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware)
- The two kinds of change: [Transient vs persistent context](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context)
- [Glossary](/notes/ai/langchain-langgraph/glossary)
