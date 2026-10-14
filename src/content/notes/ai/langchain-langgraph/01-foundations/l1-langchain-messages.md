---
title: "L1: LangChain messages"
order: 1
summary: "The four message classes that every LangChain agent passes around: HumanMessage, AIMessage, ToolMessage and SystemMessage. Tool calls with dict arguments, ids, usage and response metadata, standard content blocks, and the two converters convert_to_messages and convert_to_openai_messages, with real outputs and the mapping to the Anthropic and OpenAI shapes."
status: not-started
tags: [langchain, messages, tool-calls, content-blocks, openai-format, anthropic-format]
---

## 1. The question this idea answers

An agent backend talks to a model through a client library. The model provider has its own wire format. The Anthropic Messages API wants `tool_use` blocks. An OpenAI-compatible endpoint wants `tool_calls` with a JSON string. A Databricks serving endpoint speaks the OpenAI shape, even when a Claude model runs behind it.

LangChain puts one set of Python objects between your code and all these formats. Your harness, your middleware and your checkpointer see only these objects. The model client converts them to the wire format on each call.

So two questions matter in a real agent service. What exactly is inside each message object? And what survives, and what is lost, when a converter changes the objects into a provider shape? This lesson answers both, with output from langchain-core 1.6.10 (checked on 2026-10-13).

## 2. Mental model

> [!analogy] A standard shipping container
> A port can load any ship because all cargo travels in standard containers. The container has a fixed size and a label. Each ship line has its own cranes, but every crane can lift a standard container.
>
> A LangChain message is the container. Its class and fields are the fixed size and the label. A model client, for example `ChatAnthropic` or `ChatDatabricks`, is the crane: it lifts the container onto one provider's ship, in that provider's format.
>
> **Where it stops working:** some cargo does not fit the standard size. A thinking block with a signature, or the error flag of a tool result, has no standard place in every provider shape. A crane for another ship line can drop it or pack it in a different way. So you must check what each converter keeps.

## 3. Terms

| Term | Plain meaning |
|---|---|
| message | One Python object in the conversation list. Its class tells who wrote it. |
| `HumanMessage` | A message from the user. Its `type` is `"human"`. |
| `AIMessage` | A message from the model. Its `type` is `"ai"`. It can hold text and tool calls. |
| `ToolMessage` | The result of one tool call. Its `type` is `"tool"`. |
| `SystemMessage` | Instructions for the model. Its `type` is `"system"`. |
| tool call | A dict in `AIMessage.tool_calls` with `name`, `args` (a dict), `id` and `type: "tool_call"`. |
| `tool_call_id` | The field of a `ToolMessage` that names the tool call that it answers. |
| message id | The optional `id` field of a message. The provider, LangChain or the graph can set it. |
| `usage_metadata` | Token counts of one model response in a standard shape: input, output and total tokens. |
| `response_metadata` | Provider data about one response, for example the model name and the finish reason. |
| content block | One typed item in a list-valued `content`, for example a text block or an image block. |
| standard content block | A content block in LangChain's provider-neutral format. The `content_blocks` property returns them. |
| artifact | A `ToolMessage` field for data that the application keeps but does not send to the model. |
| `convert_to_messages` | A function that turns strings, tuples and dicts into message objects. |
| `convert_to_openai_messages` | A function that turns messages into OpenAI chat dicts. |

## 4. Method and math

### 4.1 The four message classes

Every class inherits from `BaseMessage`. The base class has these fields (source: `langchain_core/messages/base.py`): `content`, `additional_kwargs`, `response_metadata`, `type`, `name` and `id`. `content` is a string or a list of strings and dicts.

This code builds one message of each class. The data comes from a production question about downtime.

```python
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage

s = SystemMessage("You answer production questions.")
h = HumanMessage("How much downtime did plant 3 have on 2026-10-12?")
a = AIMessage(content="", tool_calls=[{"name": "get_downtime",
              "args": {"plant_id": 3, "date": "2026-10-12"}, "id": "call_1"}])
t = ToolMessage(content="47 minutes", tool_call_id="call_1")
```

The real output of `repr(a)`, `repr(t)`, `t.status`, `t.artifact`, the four ids and the four `type` values:

```text
AIMessage(content='', additional_kwargs={}, response_metadata={}, tool_calls=[{'name': 'get_downtime', 'args': {'plant_id': 3, 'date': '2026-10-12'}, 'id': 'call_1', 'type': 'tool_call'}], invalid_tool_calls=[])
ToolMessage(content='47 minutes', tool_call_id='call_1')
status success artifact None
ids None None None None
types human ai tool system
```

Three facts appear in this output:

1. The tool call input had no `type` key. The `AIMessage` validator added `'type': 'tool_call'`.
2. `args` is a Python dict, not a JSON string. This is different from the OpenAI wire format.
3. A message that you build by hand has `id=None`. Section 4.4 explains who sets ids.

| Class | `type` | Main fields beyond the base | OpenAI role |
|---|---|---|---|
| `SystemMessage` | `system` | none | `system` (or `developer`) |
| `HumanMessage` | `human` | none | `user` |
| `AIMessage` | `ai` | `tool_calls`, `invalid_tool_calls`, `usage_metadata` | `assistant` |
| `ToolMessage` | `tool` | `tool_call_id`, `status`, `artifact` | `tool` |

### 4.2 AIMessage: what a model call returns

A model client fills more fields than a hand-built message. This test uses a fake chat model (`FakeMessagesListChatModel`) that returns a prepared message, so no API key is needed:

```text
AIMessage(content='Plant 3 had 47 minutes of downtime.', additional_kwargs={}, response_metadata={'model_name': 'fake-claude', 'finish_reason': 'stop'}, id='lc_run--01a13577-6a4f-7073-acdf-1ca8b272017a-0', tool_calls=[], invalid_tool_calls=[], usage_metadata={'input_tokens': 120, 'output_tokens': 9, 'total_tokens': 129})
```

| Field | Meaning | Source text (langchain-core 1.6.10) |
|---|---|---|
| `content` | Text, or a list of content blocks | "The contents of the message." |
| `tool_calls` | Parsed tool calls with dict `args` | `list[ToolCall]` |
| `invalid_tool_calls` | Tool calls whose arguments did not parse | `list[InvalidToolCall]` |
| `usage_metadata` | Standard token counts | `input_tokens`: "Count of input (or prompt) tokens. Sum of all input token types." |
| `response_metadata` | Provider data | "Examples: response headers, logprobs, token counts, model name." |
| `id` | Message id | "This should ideally be provided by the provider/model which created the message." |

`UsageMetadata` has three required keys: `input_tokens`, `output_tokens` and `total_tokens`. It has two optional keys: `input_token_details` (for example `cache_read`, `cache_creation`) and `output_token_details` (for example `reasoning`). The docstring says that the details do "*not* need to sum to full input token count."

> [!trap] Usage is not always standard in practice
> `usage_metadata` is standard only if the model client fills it correctly. [L3](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks) shows a client where `input_tokens` includes cache reads but `total_tokens` does not. Test the numbers of your own client before you build cost reports on them.

### 4.3 ToolMessage: the result of one call

`ToolMessage` has four fields that matter (source: `langchain_core/messages/tool.py`):

| Field | Default | Docstring |
|---|---|---|
| `tool_call_id` | required | "Tool call that this message is responding to." |
| `status` | `"success"` | "Status of the tool invocation." Values: `"success"` or `"error"`. |
| `artifact` | `None` | "Artifact of the Tool execution which is not meant to be sent to the model." |
| `name` | `None` | The tool name. The tools node fills it. |

The `artifact` field is useful for a chart or a full result table. The model sees only `content`. The application can read the artifact from the state. [Middleware L1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) uses it to capture a chart.

The pairing rule of the APIs still applies: every tool call needs exactly one `ToolMessage` with the same id ([tool_use and tool_result](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result)).

### 4.4 Message ids: three sources

| Who sets the id | When | Example from a run |
|---|---|---|
| The provider | The response carries an id and the client copies it | depends on the client |
| LangChain | The model returned no id. The chat model base class sets one from the run id. | `lc_run--01a13577-...-0` |
| The graph reducer | A message enters the agent state with no id | `9bdbee8c-1de4-4e0c-976b-9e22ff6af35b` |

The LangChain id has a double dash. The source shows why. `LC_ID_PREFIX = "lc_run-"`, and the chat model sets `f"{LC_ID_PREFIX}-{run_manager.run_id}-{idx}"`. So the prefix, a dash and the run id join to `lc_run--`. The final `-0` is the index of the generation.

Ids matter in an agent for one reason. The `add_messages` reducer replaces a message that has the same id. It also deletes a message that a `RemoveMessage` names ([state and reducers](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers)). A message without a stable id cannot be replaced or deleted later.

> [!note] Ids are not tool call ids
> `message.id` names the whole message. `tool_calls[i]["id"]` names one tool call inside it. A `ToolMessage` refers to the tool call id, never to the message id.

### 4.5 Standard content blocks

LangChain 1.0 added a provider-neutral block format. The property `message.content_blocks` reads `content` and returns standard blocks. The docs say: "Content blocks are not a replacement for the content property" (messages page, checked on 2026-10-13).

The known block types in langchain-core 1.6.10 (`KNOWN_BLOCK_TYPES` in `content.py`):

| Group | Types |
|---|---|
| Text | `text`, `reasoning` |
| Tools | `tool_call`, `invalid_tool_call`, `tool_call_chunk` |
| Multimodal | `image`, `audio`, `file`, `text-plain`, `video` |
| Server-side tools | `server_tool_call`, `server_tool_call_chunk`, `server_tool_result` |
| Catch-all | `non_standard` |

This `AIMessage` has the content that an Anthropic client produces: a thinking block, a text block and a `tool_use` block. With `response_metadata={"model_provider": "anthropic"}`, `content_blocks` uses the Anthropic translator. The real output:

```text
content_blocks:
   {'type': 'reasoning', 'reasoning': 'Need downtime data.', 'extras': {'signature': 'EqQB...'}}
   {'type': 'text', 'text': 'I will check plant 3.'}
   {'type': 'tool_call', 'name': 'get_downtime', 'args': {'plant_id': 3}, 'id': 'toolu_01A'}
text: 'I will check plant 3.'
```

The Anthropic `thinking` block became a standard `reasoning` block, and the signature moved into `extras`. `message.text` joins only the text blocks.

`content_blocks` is computed on each read. The stored `content` stays in the provider format. To store standard blocks in `content` itself, the docs say: "set the `LC_OUTPUT_VERSION` environment variable to `v1`" or "initialize any chat model with `output_version="v1"`" (checked on 2026-10-13). The default in the source is `None` (`from_env("LC_OUTPUT_VERSION", default=None)`).

### 4.6 convert_to_messages: many inputs, one list

`convert_to_messages(messages)` accepts an iterable of "message-like" items or a `PromptValue`. The type alias in `utils.py` is `BaseMessage | list[str] | tuple[str, str | list[...]] | str | dict[str, Any]`. The agent uses it when you pass `{"messages": [{"role": "user", ...}]}`.

| Input | Result |
|---|---|
| A message object | The same object |
| A string | `HumanMessage` |
| A tuple `(role, content)` | The class for that role |
| A dict with `role` (or `type`) and `content` | The class for that role, plus `tool_calls`, `tool_call_id`, `id`, `name` |
| An OpenAI tool call dict with `function.arguments` as a string | A LangChain tool call. The string is parsed with `json.loads`. |

Accepted role strings: `human`, `user`, `ai`, `assistant`, `function`, `tool`, `system`, `developer`. `developer` becomes a `SystemMessage` with `additional_kwargs["__openai_role__"] = "developer"`.

A real run with seven mixed inputs:

```text
HumanMessage 'Plant 3 downtime yesterday?' None None {}
SystemMessage 'You answer production questions.' None None {}
HumanMessage 'And plant 4?' None None {}
AIMessage '' [{'name': 'get_downtime', 'args': {'plant_id': 4}, 'id': 'call_2', 'type': 'tool_call'}] None {}
ToolMessage '12 minutes' None call_2 {}
AIMessage 'Plant 4 had 12 minutes.' [] None {}
SystemMessage 'Be brief.' None None {'__openai_role__': 'developer'}
```

The two errors, as raised:

```text
ValueError: Unexpected message type: 'robot'. Use one of 'human', 'user', 'ai', 'assistant', 'function', 'tool', 'system', or 'developer'.
ValueError: Message dict must contain 'role' and 'content' keys, got {'text': 'x'}
```

Both errors also carry a second line: "For troubleshooting, visit: https://docs.langchain.com/oss/python/langchain/errors/MESSAGE_COERCION_FAILURE".

### 4.7 convert_to_openai_messages: one list, the OpenAI shape

The signature in langchain-core 1.6.10:

```python
convert_to_openai_messages(
    messages,                       # one message-like item, or a sequence
    *,
    text_format="string",           # or "block"
    include_id=False,
    pass_through_unknown_blocks=True,
)
```

A single message returns one dict. A sequence returns a list. The function calls `convert_to_messages` first, so it also accepts dicts and tuples.

| Parameter | Effect |
|---|---|
| `text_format="string"` | String content stays a string. A list of only text blocks joins with `"\n"`. |
| `text_format="block"` | String content becomes `[{"type": "text", "text": ...}]`. |
| `include_id=True` | Adds `"id"` when the message has one. The default omits ids. |
| `pass_through_unknown_blocks=True` | Unknown blocks stay in `content`. `False` raises `ValueError`. |

The seven messages of section 4.6, converted. Two entries of the real output:

```json
{
  "role": "assistant",
  "tool_calls": [{"type": "function", "id": "call_2",
                  "function": {"name": "get_downtime", "arguments": "{\"plant_id\": 4}"}}],
  "content": ""
}
```

```json
{"role": "developer", "content": "Be brief."}
```

The `args` dict became a JSON string again, with `json.dumps(..., ensure_ascii=False)`.

Now the hard cases. Each line below is real output:

| Input | OpenAI output | What changed |
|---|---|---|
| `ToolMessage("Timeout after 30 s", tool_call_id="call_9", status="error")` | `{"role": "tool", "tool_call_id": "call_9", "content": "Timeout after 30 s"}` | `status` is gone. The OpenAI shape has no error flag. |
| `HumanMessage` holding an Anthropic `tool_result` block | `{"role": "tool", "tool_call_id": "toolu_01A", "content": "47 minutes"}` | The block became a separate tool message. The empty user message was dropped. |
| `AIMessage` with `thinking`, `text` and `tool_use` blocks | `content` keeps the `thinking` block and the text block. `tool_use` moved to `tool_calls`. | The thinking block passes through unchanged. The OpenAI chat shape defines no such block, so an endpoint can reject it. |
| `HumanMessage("hi", id="msg-1")`, `include_id=True`, `text_format="block"` | `{'role': 'user', 'id': 'msg-1', 'content': [{'type': 'text', 'text': 'hi'}]}` | The id appears only on request. |

> [!trap] The OpenAI shape loses the error flag
> A `ToolMessage` with `status="error"` becomes a plain tool message. The model sees only the text. Put the word "Error" and the cause into the `content` itself, so that the model knows the call failed on every provider.

### 4.8 The mapping to the Anthropic and OpenAI shapes

The same five messages, converted two ways. The Anthropic side is the output of `_format_messages` in langchain-anthropic 1.7.6, a private function that `ChatAnthropic` calls (checked on 2026-10-13). The OpenAI side is `convert_to_openai_messages`.

```python
[SystemMessage("You answer production questions."),
 HumanMessage("Compare downtime at plants 3 and 4 on 2026-10-12."),
 AIMessage("", tool_calls=[A, B]),                          # ids toolu_A and toolu_B
 ToolMessage("47", tool_call_id="toolu_A"),
 ToolMessage("Timeout after 30 s", tool_call_id="toolu_B", status="error")]
```

| LangChain | Anthropic Messages shape (real output) | OpenAI chat shape (real output) |
|---|---|---|
| `SystemMessage` | Top-level `system = "You answer production questions."`, not in `messages` | `{"role": "system", ...}` first in `messages` |
| `HumanMessage` | `{"role": "user", "content": "Compare..."}` | `{"role": "user", "content": "Compare..."}` |
| `AIMessage.tool_calls` | `assistant` content: two `tool_use` blocks with `input` as an object | `assistant` with `tool_calls`, `arguments` as a JSON string, `content: ""` |
| Two `ToolMessage` objects | ONE `user` message with two `tool_result` blocks | TWO messages with `role: "tool"` |
| `status="error"` | `"is_error": true` on the second block | no field, lost |
| `tool_call_id` | `tool_use_id` | `tool_call_id` |

The Anthropic converter merges the two tool results into one user message. This follows the "all together" rule of the Messages API. The OpenAI shape keeps one message per result. The id values stay the same on both sides. [Converting between formats](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats) covers the full block map.

> [!key] One object model, many wire formats
> Your harness works only with LangChain message objects. The model client converts them on every call, and each converter keeps a different subset. Tool call ids, arguments and text survive everywhere. Message ids, error flags, thinking blocks and artifacts do not always survive. Check what your client keeps.

### 4.9 Production view

| Concern | What to do |
|---|---|
| Correctness | Copy tool call ids exactly. Never create new ids for tool calls. |
| Reliability | Write the error cause into the `ToolMessage` content. Do not depend on `status` alone. |
| Storage | Store the message type, content, tool calls with ids, and `tool_call_id`. You can rebuild the objects with `convert_to_messages`. |
| Cost | Read `usage_metadata`, but test it against the provider's numbers once. |
| Security | Put large or sensitive tool data in `artifact`. The model never receives it. |
| Observability | Log `response_metadata["finish_reason"]` (or the provider's stop reason) for each model call. |

## 5. Code

These exercises go in `langchain-langgraph/01-messages.ipynb`. They need no API key.

**Exercise 1.1: a round trip.** Write `to_rows(messages)` that turns a list of LangChain messages into plain dicts for a database table (type, content, tool calls, tool call id, status). Write `from_rows(rows)` that rebuilds the objects with `convert_to_messages`.

Acceptance tests:

- For a list with one message of each class, `from_rows(to_rows(x))` has the same classes, contents, tool call ids and `args` dicts.
- A `ToolMessage` with `status="error"` keeps `status="error"` after the round trip.
- No row holds a Python object. `json.dumps(rows)` works.

**Exercise 1.2: what each converter keeps.** Build the five-message list of section 4.8. Convert it with `convert_to_openai_messages`. Write a function that lists every field of the input that has no place in the output.

Acceptance tests:

- The function reports the lost `status` of the second tool message.
- It reports no loss for tool call ids.
- With `include_id=True` and messages that have ids, it reports no loss for message ids.

**Exercise 1.3: a pairing check on objects.** Write `check_tool_pairs(messages)` for LangChain objects. It returns the tool call ids that have no `ToolMessage`, and the `ToolMessage` ids that have no tool call.

Acceptance tests:

- The list of section 4.8 returns two empty lists.
- Removing the last `ToolMessage` returns `["toolu_B"]` as unanswered.
- A list that starts with a `ToolMessage` reports it as an orphan.

## 6. Common mistakes

1. **"args is a JSON string."** In LangChain, `tool_calls[i]["args"]` is a dict. Only the OpenAI wire format uses a string.
2. **Using the message id as the tool call id.** A `ToolMessage` names the tool call id, for example `toolu_A`. It never names the `AIMessage` id.
3. **Trusting `status="error"` to reach the model.** The OpenAI shape drops it. Write the error into the content.
4. **Reading `content_blocks` as stored data.** It is computed on each read. `content` is what the client sends, unless `output_version="v1"` is set.
5. **Expecting every message to have an id.** Hand-built messages have `id=None` until a model or the graph sets one.
6. **Passing a dict without `content`.** `convert_to_messages` raises `ValueError`. A dict needs `role` (or `type`) and `content`.

## 7. One-minute explanation

LangChain represents a conversation as a list of message objects. `SystemMessage` holds instructions, `HumanMessage` the user text, `AIMessage` the model output, and `ToolMessage` one tool result. An `AIMessage` holds text in `content` and tool calls in `tool_calls`, where each call has a name, a dict of arguments and an id. A `ToolMessage` answers one call by its `tool_call_id`, and it can carry a `status` and an `artifact` that the model never sees. Ids come from the provider, from LangChain's run id, or from the graph reducer, and the reducer needs them to replace or delete messages. `convert_to_messages` turns strings, tuples and dicts into objects, and `convert_to_openai_messages` turns objects into the OpenAI chat shape. Each provider converter keeps a different subset. The OpenAI shape loses the error flag and keeps thinking blocks that it cannot use. The Anthropic converter merges tool results into one user message with `is_error`. So check what your model client keeps before you rely on a field.

## 8. Check questions

```check
{
  "question": "An AIMessage has tool_calls = [{\"name\": \"get_downtime\", \"args\": {\"plant_id\": 3}, \"id\": \"toolu_A\"}]. What does convert_to_openai_messages produce for this call, and what changes in the type of the arguments?",
  "hint": "Compare the dict in LangChain with the wire format.",
  "answer": "An assistant message with tool_calls = [{\"type\": \"function\", \"id\": \"toolu_A\", \"function\": {\"name\": \"get_downtime\", \"arguments\": \"{\\\"plant_id\\\": 3}\"}}]. The args dict becomes a JSON string, made with json.dumps. The id stays the same."
}
```

```check
{
  "question": "Two ToolMessage objects answer two parallel tool calls. How many messages do they become in the Anthropic shape, and how many in the OpenAI shape?",
  "answer": "Anthropic: one user message with two tool_result blocks, because the converter merges them. OpenAI: two separate messages with role tool, one per result. In both shapes each result keeps its tool call id."
}
```

```check
{
  "question": "A tool fails and your code returns ToolMessage(\"timeout\", tool_call_id=\"c1\", status=\"error\"). The agent runs on an OpenAI-compatible endpoint. What does the model receive, and how do you make the failure clear?",
  "answer": "The model receives {\"role\": \"tool\", \"tool_call_id\": \"c1\", \"content\": \"timeout\"}. The status field has no place in the OpenAI shape, so it is lost. Write the failure into the content, for example \"Error: the downtime query exceeded its 30 s timeout\"."
}
```

```check
{
  "question": "Why does an AIMessage returned by a fake model have an id like lc_run--01a1...-0, and why does that id matter inside an agent?",
  "answer": "The model returned no id, so the chat model base class set one from the run id: the prefix lc_run-, a dash, the run id and the generation index. Inside an agent, the add_messages reducer uses message ids to replace or delete messages. Without a stable id, a later update cannot target that message."
}
```

## 9. Links

- Next: [L2: create_agent](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent)
- The pairing rule: [tool_use and tool_result](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result)
- The OpenAI shape: [The OpenAI chat shape](/notes/ai/llm-apis/03-openai-format/l1-the-openai-chat-shape)
- The full block map: [Converting between formats](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats)
- Ids and the reducer: [State and reducers](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers)
- [Glossary](/notes/ai/langchain-langgraph/glossary)
