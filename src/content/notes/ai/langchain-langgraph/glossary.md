---
title: "Glossary"
order: 2
summary: "Every term in LangChain and LangGraph, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| `add_messages` | The reducer of the `messages` key. It merges a list of updates into the state by message id. | [3.3](/notes/ai/langchain-langgraph/03-context-management/l3-trim-and-remove-messages) |
| `agent` node | The old name of the node that calls the model. The new name is `model`. | [6.1](/notes/ai/langchain-langgraph/06-legacy-api/l1-old-agent-api) |
| agent state | The dict that flows through the graph. The main key is `messages`. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| AI Gateway | Databricks routes for model traffic, for example `/ai-gateway/mlflow/v1` and `/ai-gateway/anthropic/v1/messages`. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| `AIMessage` | A message from the model. Its `type` is `"ai"`. It can hold text and tool calls. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| `AIMessageChunk` | A piece of a model message, with text and, for tool calls, `tool_call_chunks`. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| `allow_partial` | Allow a message to be cut inside its text, at a split point. | [3.3](/notes/ai/langchain-langgraph/03-context-management/l3-trim-and-remove-messages) |
| `Annotated` | The Python typing form that attaches a reducer to a key: `Annotated[list, add_messages]`. | [4.1](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers) |
| approximate token counter | `count_tokens_approximately`: a character-based estimate, about 4 characters per token plus 3 tokens per message. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| artifact | A `ToolMessage` field for data that the application keeps but does not send to the model. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| `as_node` | The argument of `update_state` that names the node the update counts as. | [4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads) |
| backoff | A wait before a retry that grows with each attempt. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| `bind_tools` | The chat model method that attaches tool schemas to every later call. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| built-in middleware | A middleware class in `langchain.agents.middleware`. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| `can_jump_to` | The list of jump targets that a hook declares. Without it, the graph has no edge for the jump. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| channel | LangGraph's internal storage for one state key, with its reducer. | [4.1](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers) |
| `ChatDatabricks` | The LangChain chat model class in `databricks_langchain`. It calls a Databricks serving endpoint. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| checkpoint | A snapshot of the graph state, saved at each super-step. | [4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads) |
| `checkpoint_id` | The id of one checkpoint. A config with it selects an older checkpoint. | [4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads) |
| checkpointer | An object that saves the agent state after each super-step, per thread. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| `CheckpointSaver` | The Databricks class: a `PostgresSaver` that uses a Lakebase connection pool. | [4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads) |
| `clear_at_least` | A minimum number of tokens to reclaim. The edit stops clearing once it reaches it. Default 0. | [3.2](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| `clear_tool_inputs` | When true, the arguments of the matching tool call are also replaced with `{}`. | [3.2](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| `ClearToolUsesEdit` | The only built-in strategy. It replaces old tool results with a placeholder. | [3.2](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| `Command` | A LangGraph object with a state update (`update=...`). | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| `CompiledStateGraph` | The runnable object that `create_agent` returns. It has `invoke`, `stream` and `get_state`. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| conditional edge | A function that reads the state and chooses the next node. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| config profile | A named section in `~/.databrickscfg` with a host and credentials. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| content block | One typed item in a list-valued `content`, for example a text block or an image block. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| `ContextEdit` | The protocol of one edit strategy: a method `apply(messages, count_tokens=...)` that changes a list in place. | [3.2](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| `ContextEditingMiddleware` | A built-in LangChain middleware that edits a copy of the messages before each model call. | [3.2](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| `ContextSize` | A tuple that states one size: `("messages", n)`, `("tokens", n)` or `("fraction", f)`. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| `convert_to_messages` | A function that turns strings, tuples and dicts into message objects. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| `convert_to_openai_messages` | A function that turns messages into OpenAI chat dicts. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| `create_agent` | The LangChain v1 function that builds and compiles an agent graph. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| `create_react_agent` | The old agent factory in `langgraph.prebuilt`. It is deprecated. | [6.1](/notes/ai/langchain-langgraph/06-legacy-api/l1-old-agent-api) |
| `custom` | Any data that code inside a node or tool writes with a stream writer. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| cut point | The index in the message list. Messages before it are summarized. Messages from it onward are preserved. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| `DatabricksOpenAI` | A subclass of the `openai.OpenAI` client from the `databricks-openai` package. It adds Databricks authentication. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| `deepcopy` | A full copy of a Python object, so that changes to the copy never reach the original. | [3.2](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| default reducer | The behavior with no reducer: the update replaces the old value. | [4.1](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers) |
| `delete_thread` | Deletes every checkpoint and write of one thread. | [4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads) |
| durability | When checkpoints are written: `"exit"`, `"async"` or `"sync"`. | [4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads) |
| `dynamic_prompt` | A decorator that turns a function into a `wrap_model_call` hook that sets the system prompt. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| edge | A fixed connection from one node to the next. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| `end_on` | Drop messages from the end until the last one has this type. | [3.3](/notes/ai/langchain-langgraph/03-context-management/l3-trim-and-remove-messages) |
| event streaming | The newer `stream_events(version="v3")` API with typed projections. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| `exclude_tools` | Tool names whose results are never cleared. | [3.2](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| `exit_behavior` | What a limit middleware does at the limit: end the run cleanly, raise an error, or continue. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| `ExtendedModelResponse` | A `ModelResponse` plus a `Command`. It lets `wrap_model_call` update the state. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| `extra_body` | An `openai` client argument that adds extra JSON fields to the request body. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| fallback model | A second model that the agent calls when the first model raises an exception. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| `get_state_history` | Returns all checkpoints of a thread, newest first. | [4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads) |
| `get_stream_writer` | A function from `langgraph.config` that returns the writer of the current run. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| `GraphRecursionError` | The error raised when a run reaches the recursion limit. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| `handler` | The function that a wrap-style hook calls to run the next layer, and finally the model or the tool. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| hook | A method that the agent calls at one fixed point of the loop. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| `HumanMessage` | A message from the user. Its `type` is `"human"`. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| `include_system` | With `"last"`: keep a `SystemMessage` at index 0 and count it against the budget. | [3.3](/notes/ai/langchain-langgraph/03-context-management/l3-trim-and-remove-messages) |
| `InvalidUpdateError` | The error when a key with no reducer receives more than one value in one super-step. | [4.1](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers) |
| jitter | A random change of the wait, here plus or minus 25%, so that clients do not retry at the same moment. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| `jump_to` | A state key that a node-style hook sets to move to `"model"`, `"tools"` or `"end"`. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| keep | How much of the newest history stays word for word after summarization. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| `LangGraphDeprecatedSinceV10` | The warning class for APIs deprecated in LangGraph 1.0 with removal planned for 2.0. | [6.1](/notes/ai/langchain-langgraph/06-legacy-api/l1-old-agent-api) |
| langmem | A LangChain package with memory utilities. Version 0.0.30 was checked. | [6.1](/notes/ai/langchain-langgraph/06-legacy-api/l1-old-agent-api) |
| `llm_input_messages` | A key that a `pre_model_hook` can return. The model receives these messages, and the state does not change. | [6.1](/notes/ai/langchain-langgraph/06-legacy-api/l1-old-agent-api) |
| `max_tokens` | The budget of `trim_messages`, in the unit of the token counter. | [3.3](/notes/ai/langchain-langgraph/03-context-management/l3-trim-and-remove-messages) |
| message | One Python object in the conversation list. Its class tells who wrote it. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| message id | The optional `id` field of a message. The provider, LangChain or the graph can set it. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| `messages` | Tuples of a message chunk and metadata, from every model call in the graph. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| metadata | The dictionary that comes with each `messages` event, with keys such as `langgraph_node` and `langgraph_step`. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| middleware | An object that adds hooks to `create_agent`. A subclass of `AgentMiddleware`, or a function with a hook decorator. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| model node | The node named `model`. It calls the chat model once. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| model profile | Data on a chat model that includes `max_input_tokens`. A `fraction` size needs it. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| `ModelRequest` | The object for one model call: model, messages, system message, tools, tool choice, state, runtime. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| `ModelResponse` | The result of one model call: a list of messages and an optional structured response. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| node | One step function of the graph, for example `model` or `tools`. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| node-style hook | A hook that becomes its own graph node: `before_agent`, `before_model`, `after_model`, `after_agent`. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| `ns` | The namespace of an event: the path of subgraphs it came from. Empty for the top graph. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| OAuth M2M | Machine-to-machine login with a service principal's client id and client secret. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| `on_failure` | What a retry middleware does after the last failed attempt. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| OpenAI chat shape | The request format of OpenAI Chat Completions: `messages` with roles, `tools`, `tool_calls` with string arguments. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| `operator.add` | A reducer that concatenates lists: `old + update`. | [4.1](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers) |
| orphan | A tool result whose tool call is not in the list, or a tool call with no result. | [3.3](/notes/ai/langchain-langgraph/03-context-management/l3-trim-and-remove-messages) |
| `Overwrite` | A wrapper that writes a value directly and bypasses the reducer. | [4.1](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers) |
| partial update | A dictionary with only the keys that a node wants to change. | [4.1](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers) |
| PII | Personally identifiable information, for example an email address. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| placeholder | The text that replaces a cleared tool result. Default `"[cleared]"`. | [3.2](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| `post_model_hook` | An old parameter: a node that runs after each model call. | [6.1](/notes/ai/langchain-langgraph/06-legacy-api/l1-old-agent-api) |
| `PostgresSaver` | The checkpointer that stores checkpoints in PostgreSQL tables. | [4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads) |
| `pre_model_hook` | An old parameter: a node that runs before each model call. | [6.1](/notes/ai/langchain-langgraph/06-legacy-api/l1-old-agent-api) |
| `prompt` | The old name of the system prompt parameter. | [6.1](/notes/ai/langchain-langgraph/06-legacy-api/l1-old-agent-api) |
| prompt cache prefix | The start of the model input that matches an earlier request, so the provider can read it from its cache. | [3.2](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| recursion limit | The maximum number of super-steps in one run. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| redaction strategy | How PII is handled: `block`, `redact`, `mask` or `hash`. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| reducer | A function `(old_value, update) -> new_value` that merges an update into one key. | [4.1](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers) |
| `REMOVE_ALL_MESSAGES` | The special id `"__remove_all__"`. A `RemoveMessage` with it deletes every message before it. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| `RemoveMessage` | A message object that tells the `add_messages` reducer to delete a message by id. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| `request.override` | A method of `ModelRequest` that returns a new request with some fields replaced. The original stays unchanged. | [3.2](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| `response_metadata` | Provider data about one response, for example the model name and the finish reason. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| retry | A new attempt of a failed model or tool call. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| `retry_on` | The rule that decides which exceptions get a retry. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| run limit | A limit for one invocation of the agent. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| `RunningSummary` | A langmem object that holds the summary text and the ids of the messages it covers. | [6.1](/notes/ai/langchain-langgraph/06-legacy-api/l1-old-agent-api) |
| safe cut | A cut point that does not separate an AI message with tool calls from its tool messages. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| `Send` | A LangGraph object that starts one node task with its own input. The agent sends one per tool call. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| server-side context editing | Anthropic's API feature that clears old tool results on the server, before the prompt reaches Claude. | [3.2](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| serving endpoint | A named Databricks model endpoint. `ChatDatabricks(model=...)` takes its name. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| `setup()` | The method that creates or migrates the checkpointer's tables. | [4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads) |
| SSE (server-sent events) | An HTTP response that stays open and sends text events, each with an `event:` line and a `data:` line. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| standard content block | A content block in LangChain's provider-neutral format. The `content_blocks` property returns them. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| `start_on` | With `"last"`: drop messages from the front of the result until the first one has this type. | [3.3](/notes/ai/langchain-langgraph/03-context-management/l3-trim-and-remove-messages) |
| state schema | The type of the state, usually a `TypedDict`. Each key is one field. | [4.1](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers) |
| `state_schema` | A `TypedDict` that adds keys to the agent state. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| `StateGraph` | The LangGraph class that builds a graph whose nodes share one typed state. | [4.1](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers) |
| `StateSnapshot` | The object that `get_state` returns: values, next nodes, config, metadata, time, parent and tasks. | [4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads) |
| store | Long-term memory shared across threads. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| `strategy` | `"last"` keeps the newest messages. `"first"` keeps the oldest messages. | [3.3](/notes/ai/langchain-langgraph/03-context-management/l3-trim-and-remove-messages) |
| stream mode | One kind of event that `stream()` can emit: `values`, `updates`, `messages`, `custom`, `checkpoints`, `tasks` or `debug`. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| `stream_usage` | A `ChatDatabricks` field. When true, the stream ends with a chunk that holds token usage. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| `StreamPart` | The v2 output format: a dictionary with `type`, `ns` and `data`. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| `StreamWriter` | A callable that takes one value and writes it to the `custom` stream. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| `SummarizationMiddleware` | A built-in LangChain middleware that replaces old messages in the agent state with one summary message. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| `SummarizationNode` | A langmem node that summarizes old messages for the model input. | [6.1](/notes/ai/langchain-langgraph/06-legacy-api/l1-old-agent-api) |
| summarizer | The model that writes the summary. By default it is the `model` argument of the middleware. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| summary message | The `HumanMessage` that holds the summary. It starts with "Here is a summary of the conversation to date:". | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| super-step | One round of the graph. All nodes that run in the same round form one super-step. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| `SystemMessage` | Instructions for the model. Its `type` is `"system"`. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| `text_splitter` | The function that splits text for `allow_partial`. The default splits on newlines. | [3.3](/notes/ai/langchain-langgraph/03-context-management/l3-trim-and-remove-messages) |
| thread | All the checkpoints that share one thread id: one conversation of the harness. | [4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads) |
| thread limit | A limit for one conversation thread across invocations. It needs a checkpointer. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| `thread_id` | The key of one conversation in the checkpointer. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| `token_count_method` | `"approximate"` (character estimate) or `"model"` (the chat model's own counter). | [3.2](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| `token_counter` | The function that measures the list: `len` counts messages, `"approximate"` estimates tokens, a chat model uses its own counter. | [3.3](/notes/ai/langchain-langgraph/03-context-management/l3-trim-and-remove-messages) |
| tool call | A dict in `AIMessage.tool_calls` with `name`, `args` (a dict), `id` and `type: "tool_call"`. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| tool selector | A middleware that asks a model which tools to offer before each main model call. | [2.2](/notes/ai/langchain-langgraph/02-middleware/l2-built-in-middleware-map) |
| `tool_call_id` | The field of a `ToolMessage` that names the tool call that it answers. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| `tool_choice` | The request field that controls whether the model may or must call a tool. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| `ToolCallRequest` | The object for one tool call: the tool call dict, the tool, the state and the runtime. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
| `ToolMessage` | The result of one tool call. Its `type` is `"tool"`. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| `ToolRuntime` | An object injected into a tool parameter named `runtime`. It has `stream_writer` and `tool_call_id`. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| tools node | The node named `tools`. It runs tool calls and returns `ToolMessage` objects. | [1.2](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent) |
| trigger | The condition that starts summarization: a number of messages, tokens, or a fraction of the model's window. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| `TriggerClause` | A dictionary of thresholds that must all be met at the same time, for example `{"tokens": 4000, "messages": 10}`. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| `trim_messages` | A function in `langchain_core.messages` that returns the messages that fit a token budget. | [3.3](/notes/ai/langchain-langgraph/03-context-management/l3-trim-and-remove-messages) |
| `trim_tokens_to_summarize` | The token budget for the old messages that the summarizer reads. Default 4,000. | [3.1](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| unified authentication | The Databricks SDK rule that searches code, then environment variables, then a profile for credentials. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| `update_state` | Writes a new checkpoint with changed values, as if a node had returned them. | [4.2](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads) |
| `updates` | The update that each node returned, keyed by node name. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| `usage_metadata` | Token counts of one model response in a standard shape: input, output and total tokens. | [1.1](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages) |
| `values` | The full state after each super-step. | [5.1](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer) |
| `WorkspaceClient` | The main class of the Databricks SDK. It holds the host and the credentials. | [1.3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) |
| wrap-style hook | A hook that runs around one call and receives a `handler`: `wrap_model_call`, `wrap_tool_call`. | [2.1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) |
