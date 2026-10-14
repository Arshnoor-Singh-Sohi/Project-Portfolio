---
title: "L1: The OpenAI chat shape"
order: 1
summary: "The Chat Completions wire format that OpenAI-compatible endpoints such as Databricks serving endpoints accept: five roles, assistant tool_calls with arguments as a JSON string that can be invalid, tool messages with tool_call_id, the ordering rule, finish_reason, tool_choice, parallel_tool_calls, and streaming chunks with tool_calls fragments and a usage chunk. A side-by-side table with the Anthropic shape."
status: not-started
tags: [openai-format, chat-completions, tool-calls, streaming, databricks]
---

## 1. The question this idea answers

The LangChain harness calls Claude through a Databricks serving endpoint. `ChatDatabricks` sends the OpenAI chat shape there ([lesson 1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format)). One day a request fails, or a tool runs with strange input. The only truth is the raw request and the raw response, and they are in the OpenAI chat shape.

To read them, you must know this shape as well as the Anthropic shape. Which roles exist? Where does a tool call go, and why is its input a string? Where does the result go, and in what order? How does a streamed tool call arrive? This lesson gives each rule with its source. The sources are the type files of the official `openai` Python package (version 3.29.0) and the OpenAI function-calling guide, both checked on 2026-10-13.

## 2. Mental model

> [!analogy] Meeting minutes with a clerk
> Think of the conversation as meeting minutes. Every entry has a speaker label: "chair's instructions" (`developer` or `system`), "user", "assistant" and "clerk" (`tool`). When the assistant needs data, it writes a numbered request slip into its own entry: "request call_7: count_orders, details: {...}". The clerk then adds one entry per slip: "answer to call_7: 412".
>
> The request slip is written by hand. The details field is free text that should look like JSON. Usually it is. Sometimes the assistant writes a broken line.
>
> **Where it stops working:** real minutes allow a clerk to answer much later. Here the clerk's entries must answer a request from the assistant entry before them, one entry for each slip. And in the minutes, the assistant's words and its request slips are two separate boxes. So you cannot tell whether it spoke before or after it wrote a slip.

## 3. Terms

| Term | Plain meaning |
|---|---|
| Chat Completions | OpenAI's chat endpoint and its wire format. Many other providers accept the same shape. |
| developer message | A message with role `developer`: instructions from the developer. It replaces the `system` role on newer OpenAI models. |
| assistant message | A message with role `assistant`: text from the model, tool calls from the model, or both. |
| `tool_calls` | A list in an assistant message. Each item asks the application to run one function. |
| tool call id | The `id` of one item in `tool_calls`, for example `call_DdmO9pD3xa9XTPNJ32zg2hcA`. |
| `arguments` | The function input as a string of JSON text that the model wrote. It can be invalid JSON. |
| tool message | A message with role `tool`, a `tool_call_id` and a `content`. It returns one result. |
| `finish_reason` | The field of a choice that says why the model stopped: `stop`, `length`, `tool_calls` or `content_filter`. |
| `tool_choice` | The request field that controls whether the model may or must call a tool. |
| `parallel_tool_calls` | The request field that allows or blocks several tool calls in one assistant message. |
| chunk | One streamed object of type `chat.completion.chunk`. |
| delta | The part of a chunk that holds new content for one choice. |
| usage chunk | An extra last chunk with token usage and an empty `choices` list, sent when `include_usage` is true. |

## 4. Method and math

### 4.1 A request

```json
{
  "model": "databricks-claude-sonnet-5",
  "messages": [
    { "role": "system", "content": "You answer questions about production data. Never guess a number." },
    { "role": "user", "content": "How many orders shipped on 2026-10-11?" }
  ],
  "tools": [
    { "type": "function",
      "function": {
        "name": "count_orders",
        "description": "Count the orders that shipped on one date.",
        "parameters": { "type": "object", "properties": { "date": { "type": "string" } }, "required": ["date"] }
      } }
  ],
  "tool_choice": "auto"
}
```

The model name in this example is a placeholder for a serving endpoint name. A tool definition wraps the function in `{"type": "function", "function": {...}}`. The function `name` "Must be a-z, A-Z, 0-9, or contain underscores and dashes, with a maximum length of 64." The input schema is called `parameters`, not `input_schema`. The optional `strict: true` asks the model to "follow the exact schema defined in the `parameters` field".

### 4.2 The roles

The `openai` 3.29.0 package defines six roles: `developer`, `system`, `user`, `assistant`, `tool` and `function`.

| Role | Docstring (quoted) | Notes |
|---|---|---|
| `developer` | "Developer-provided instructions that the model should follow, regardless of messages sent by the user. With o1 models and newer, `developer` messages replace the previous `system` messages." | OpenAI's preferred role for instructions. |
| `system` | "With o1 models and newer, use `developer` messages for this purpose instead." | Databricks: "The `system` role can only be used once, as the first message in a conversation." `ChatDatabricks` maps a `SystemMessage` to `system`. |
| `user` | "Messages sent by an end user, containing prompts or additional context information." | Content is a string or a list of parts: text, image, audio, file. |
| `assistant` | "Messages sent by the model in response to user messages." | Its `content` is "Required unless `tool_calls` or `function_call` is specified." |
| `tool` | `tool_call_id`: "Tool call that this message is responding to." | Content is a string or a list of text parts only. |
| `function` | Deprecated, "replaced by `tool_calls`". | `ChatDatabricks` raises an error for it: "Function messages are not supported by Databricks." |

Which role to use for instructions depends on the endpoint, not on the client library. A Databricks endpoint documents `system`. So for a Databricks endpoint, send one `system` message first.

### 4.3 Assistant tool calls

The model asks for a tool inside an assistant message:

```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    { "id": "call_A", "type": "function",
      "function": { "name": "count_orders", "arguments": "{\"date\": \"2026-10-11\"}" } }
  ]
}
```

| Field | Rule |
|---|---|
| `content` | Can be `null` when `tool_calls` is present. In the official response type it is a string or `null`. |
| `tool_calls[].id` | Created by the server. Copy it into the tool message. |
| `tool_calls[].type` | "Currently, only `function` is supported." The package also defines a separate type for custom tool calls. |
| `function.arguments` | A string. The docstring: "The arguments to call the function with, as generated by the model in JSON format. Note that the model does not always generate valid JSON, and may hallucinate parameters not defined by your function schema. Validate the arguments in your code before calling your function." |

> [!example] Worked example: invalid arguments in LangChain
> The sandbox passed an assistant message with `"arguments": "{\"date\": \"2026-10-11\""` (the closing brace is missing) to the response converter of `ChatDatabricks` (databricks-langchain 0.21.0). The real result, with the end of the error text shortened:
>
> ```text
> invalid args -> tool_calls: [] invalid_tool_calls: [{'type': 'invalid_tool_call', 'id': 'call_1', 'name': 'count_orders', 'args': '{"date": "2026-10-11"', 'error': 'Function count_orders arguments:\n\n{"date": "2026-10-11"\n\nare not valid JSON. Received JSONDecodeError Expecting \',\' delimiter: line 1 column 22 (char 21)\n...'}]
> ```
>
> LangChain did not raise an exception. It moved the call into `invalid_tool_calls` and left `tool_calls` empty. An agent loop that checks only `tool_calls` sees "no tool call" and can treat the turn as a final answer. Always check both lists.

### 4.4 Tool messages and the ordering rule

Each tool call gets its own tool message:

```json
[
  { "role": "assistant", "content": null, "tool_calls": [
      { "id": "call_A", "type": "function", "function": { "name": "count_orders", "arguments": "{\"date\": \"2026-10-10\"}" } },
      { "id": "call_B", "type": "function", "function": { "name": "count_orders", "arguments": "{\"date\": \"2026-10-11\"}" } }
  ] },
  { "role": "tool", "tool_call_id": "call_A", "content": "390" },
  { "role": "tool", "tool_call_id": "call_B", "content": "412" }
]
```

The OpenAI cookbook states the ordering rule: "messages with role 'tool' must be a response to a preceding message with 'tool_calls'". The function-calling guide adds that model responses "can include zero, one, or multiple calls, it is best practice to assume there are several."

> [!key] The safe ordering rule
> Put the tool messages directly after the assistant message with `tool_calls`, one tool message for each call id, before any new user message. This order satisfies the documented rule, and it maps one-to-one to the Anthropic rules R1 to R4 of [lesson 1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result).

Two differences from the Anthropic shape matter here:

1. **No error flag.** A tool message has only `role`, `tool_call_id` and `content`. A failed tool must say so in its text, for example `"ERROR: timeout after 30 s"`.
2. **No grouping.** A parallel call gets several tool messages, not one message with several results.

### 4.5 finish_reason

The response holds `choices`, and each choice has a `message` and a `finish_reason`. The docstring: "This will be `stop` if the model hit a natural stop point or a provided stop sequence, `length` if the maximum number of tokens specified in the request was reached, `content_filter` if content was omitted due to a flag from our content filters, `tool_calls` if the model called a tool, or `function_call` (deprecated) if the model called a function."

| `finish_reason` | Nearest Anthropic `stop_reason` | What the loop does |
|---|---|---|
| `stop` | `end_turn` or `stop_sequence` | Show the answer. |
| `length` | `max_tokens` | The answer is cut. Do not parse it as complete. |
| `tool_calls` | `tool_use` | Run the tools, add tool messages, call again. |
| `content_filter` | `refusal` (nearest) | Show a safe message and log the case. |

The Anthropic values `pause_turn` and `model_context_window_exceeded` have no standard OpenAI value. What an OpenAI-compatible endpoint returns in those cases is not documented in the sources above.

### 4.6 tool_choice and parallel_tool_calls

The docstring of `tool_choice`: "`none` means the model will not call any tool and instead generates a message. `auto` means the model can pick between generating a message or calling one or more tools. `required` means the model must call one or more tools. Specifying a particular tool via `{"type": "function", "function": {"name": "my_function"}}` forces the model to call that tool." And: "`none` is the default when no tools are present. `auto` is the default if tools are present."

| OpenAI `tool_choice` | Anthropic `tool_choice` |
|---|---|
| `"auto"` | `{"type": "auto"}` |
| `"required"` | `{"type": "any"}` |
| `{"type": "function", "function": {"name": "count_orders"}}` | `{"type": "tool", "name": "count_orders"}` |
| `"none"` | `{"type": "none"}` |
| `parallel_tool_calls: false` | `"disable_parallel_tool_use": true` inside `tool_choice` |

The guide says that `parallel_tool_calls: false` "ensures exactly zero or one tool is called." Note the Anthropic limit from lesson 1.2: on Opus 5.5, Sonnet 5.5, Fable 5.1 and Mythos 5.1, the values `any` and `tool` return 400. If an OpenAI-compatible endpoint translates `required` to `any` for such a model, the request can fail. This translation is not documented, so test it on your endpoint.

### 4.7 Streaming chunks

With `"stream": true`, the response is a series of chunks. Each chunk is an object of type `chat.completion.chunk` with `choices[].delta`. A delta can hold `role`, `content`, `refusal` or `tool_calls`.

A streamed tool call arrives in fragments. The guide shows this sequence of `delta.tool_calls` values:

```text
[{"index": 0, "id": "call_DdmO9pD3xa9XTPNJ32zg2hcA", "function": {"arguments": "", "name": "get_weather"}, "type": "function"}]
[{"index": 0, "id": null, "function": {"arguments": "{\"", "name": null}, "type": null}]
[{"index": 0, "id": null, "function": {"arguments": "location", "name": null}, "type": null}]
[{"index": 0, "id": null, "function": {"arguments": "\":\"", "name": null}, "type": null}]
[{"index": 0, "id": null, "function": {"arguments": "Paris", "name": null}, "type": null}]
[{"index": 0, "id": null, "function": {"arguments": ",", "name": null}, "type": null}]
[{"index": 0, "id": null, "function": {"arguments": " France", "name": null}, "type": null}]
[{"index": 0, "id": null, "function": {"arguments": "\"}", "name": null}, "type": null}]
null
```

The first fragment of a call carries `id`, `type` and `function.name`. Later fragments carry only `index` and a piece of `arguments`. The sandbox accumulated these fragments by `index` and got `"arguments": "{\"location\":\"Paris, France\"}"`, which parses to `{'location': 'Paris, France'}`.

| | OpenAI chunk | Anthropic event |
|---|---|---|
| What `index` counts | The position of the call in `tool_calls` | The position of the block in `content` |
| Where the call id appears | The first fragment of that index | `content_block_start` |
| Tool input fragments | `function.arguments` pieces | `input_json_delta.partial_json` pieces |
| End of the tool input | No separate stop event. The call is complete when the message ends with `finish_reason`. | `content_block_stop` for that index |
| Text fragments | `delta.content` | `text_delta` |

With `stream_options: {"include_usage": true}`, the docstring says: "an additional chunk will be streamed before the `data: [DONE]` message. The `usage` field on this chunk shows the token usage statistics for the entire request, and the `choices` field will always be an empty array." It also warns: "If the stream is interrupted, you may not receive the final usage chunk which contains the total token usage for the request." `ChatDatabricks` has `stream_usage: bool = True` (databricks-langchain 0.21.0), so it asks for usage on streams by default.

> [!trap] A loop over choices crashes on the usage chunk
> Code that reads `chunk.choices[0]` on every chunk raises an index error on the usage chunk, because its `choices` list is empty. Check the length first.

### 4.8 Usage fields

| OpenAI field | Meaning (docstring) | Nearest Anthropic field |
|---|---|---|
| `prompt_tokens` | "Number of tokens in the prompt." | `input_tokens` + `cache_creation_input_tokens` + `cache_read_input_tokens` |
| `prompt_tokens_details.cached_tokens` | "Cached tokens present in the prompt." | `cache_read_input_tokens` |
| `prompt_tokens_details.cache_write_tokens` | "The unadjusted number of prompt tokens written to cache." | `cache_creation_input_tokens` |
| `completion_tokens` | "Number of tokens in the generated completion." | `output_tokens` |
| `completion_tokens_details.reasoning_tokens` | "Tokens generated by the model for reasoning." | `output_tokens_details.thinking_tokens` |
| `total_tokens` | "Total number of tokens used in the request (prompt + completion)." | no field. Compute it. |

The left column describes `cached_tokens` as tokens "present in the prompt", so they are part of `prompt_tokens`. On Anthropic, `input_tokens` excludes cache reads and writes. A dashboard that mixes both providers must normalize this. How an OpenAI-compatible endpoint fills these fields for a Claude model is not documented in the sources above. Compare its numbers with a known request before you trust them.

### 4.9 The two shapes side by side

| Concept | OpenAI chat shape | Anthropic Messages shape |
|---|---|---|
| Instructions | `developer` or `system` message | top-level `system` |
| Tool definition | `{"type": "function", "function": {name, description, parameters, strict}}` | `{name, description, input_schema}` |
| Tool name limit | a-z, A-Z, 0-9, `_`, `-`, at most 64 characters | `^[a-zA-Z0-9_-]{1,128}$` |
| Tool call | `tool_calls[]` item with `id` and `function.arguments` (string) | `tool_use` block with `id` and `input` (object) |
| Tool result | `tool` message with `tool_call_id` | `tool_result` block in a `user` message |
| Tool failure | text only | `is_error: true` |
| Assistant output | `content` (string or `null`) and `tool_calls`, separate | one ordered `content` list of blocks |
| Thinking | no standard field | `thinking` and `redacted_thinking` blocks |
| Stop signal | `finish_reason` per choice | `stop_reason` on the message |
| Several answers | `n` choices possible | one message |
| Stream units | chunks with `delta`, then `data: [DONE]` | named events from `message_start` to `message_stop` |

### 4.10 Production view

| Concern | What to do |
|---|---|
| Correctness | Parse `arguments` with a JSON parser, then validate it against the tool schema. Handle invalid JSON as a tool error, not as a crash. |
| Agent loops | In LangChain, check `invalid_tool_calls` as well as `tool_calls`. |
| Ordering | Put all tool messages directly after their assistant message, one per call id, before any user message. |
| Errors | Mark tool failures in the text of the tool message. The shape has no error flag. |
| Streaming | Accumulate tool call fragments by `index`. Skip chunks with an empty `choices` list. |
| Cost | Read `prompt_tokens_details` for cache numbers. Do not compare `prompt_tokens` directly with Anthropic `input_tokens`. |
| Compatibility | An OpenAI-compatible endpoint can differ from OpenAI. Test each field that you depend on against your endpoint. |

## 5. Code

These exercises go in `llm-apis/06-openai-shape.ipynb`. They need no API key.

**Exercise 1.1: an ordering validator.** Write `check_openai_order(messages)`. It returns a list of error strings.

Acceptance tests:

- The list of section 4.4 returns no errors.
- A tool message whose `tool_call_id` matches no earlier call returns an error.
- An assistant message with two calls and only one tool message after it returns an error that names the missing id.
- A user message between the assistant message and its tool messages returns an error.

**Exercise 1.2: accumulate streamed tool calls.** Write `accumulate_tool_calls(deltas)` for a list of `delta.tool_calls` values, as in section 4.7.

Acceptance tests:

- The documented fragments give one call with id `call_DdmO9pD3xa9XTPNJ32zg2hcA`, name `get_weather` and arguments that parse to `{"location": "Paris, France"}`.
- Fragments for index 0 and index 1 that alternate give two separate calls with correct arguments.
- A `None` value in the list is skipped.

**Exercise 1.3: safe arguments.** Write `parse_arguments(raw, schema)`. It returns `(args, None)` or `(None, error_text)`. Use `jsonschema` for the schema check.

Acceptance tests:

- `'{"date": "2026-10-11"}'` returns the dictionary.
- `'{"date": "2026-10-11"'` returns an error text that contains "not valid JSON".
- `'{"day": "2026-10-11"}'` returns an error that names the missing `date`.
- `'[1, 2]'` returns an error, because the input must be an object.

## 6. Common mistakes

1. **Treating `arguments` as a dictionary.** It is a string, and it can be invalid. Parse and validate it.
2. **One tool message for several calls.** Each call id gets its own tool message.
3. **A user message between the tool calls and their tool messages.** Put the tool messages first.
4. **Checking only `tool_calls` in LangChain.** Invalid calls go into `invalid_tool_calls`.
5. **Reading `choices[0]` on every chunk.** The usage chunk has an empty `choices` list.
6. **Comparing `prompt_tokens` with Anthropic `input_tokens`.** One includes cached tokens, the other does not.
7. **Sending `developer` to an endpoint that documents `system`.** The endpoint decides the roles it accepts.

## 7. One-minute explanation

The OpenAI chat shape is a list of messages with roles: `developer` or `system` for instructions, `user`, `assistant`, and `tool` for tool results. When the model wants a tool, the assistant message carries a `tool_calls` list. Each call has an id, a function name and `arguments`, a string of JSON text that can be invalid. The application answers each call with its own `tool` message that names the `tool_call_id`, and these messages must come right after the assistant message. A tool message has no error flag, so a failure must be in its text. The response says why the model stopped in `finish_reason`: `stop`, `length`, `tool_calls` or `content_filter`. In a stream, tool calls arrive as fragments addressed by `index`, and an optional last chunk carries usage with an empty `choices` list. Compared with the Anthropic shape, the system prompt is a message and the tool input is a string. Results are separate messages, and thinking has no standard place.

## 8. Check questions

```check
{
  "question": "An assistant message has tool_calls with ids call_A and call_B. Write the minimum list of messages that must follow it before the next model call.",
  "answer": "Two tool messages, directly after the assistant message: {role: tool, tool_call_id: call_A, content: ...} and {role: tool, tool_call_id: call_B, content: ...}. One per call id, before any new user message."
}
```

```check
{
  "question": "A LangChain agent on ChatDatabricks sometimes ends a turn with no answer and no tool run. The raw response shows finish_reason tool_calls and an arguments string with a missing brace. Explain what happened.",
  "hint": "Where does LangChain put a call whose arguments do not parse?",
  "answer": "The model wrote invalid JSON in arguments. The ChatDatabricks converter put the call into invalid_tool_calls and left tool_calls empty. A loop that checks only tool_calls sees no tool call and stops. The fix is to check invalid_tool_calls too and return an error result to the model, or to retry."
}
```

```check
{
  "question": "In a stream, which fields does the first tool_calls fragment of a call carry, and which do later fragments carry? How do you know when the arguments are complete?",
  "answer": "The first fragment carries index, id, type and function.name, with empty arguments. Later fragments carry index and a piece of function.arguments, with id, name and type set to null. There is no stop event per call. The arguments are complete when the choice ends with a finish_reason such as tool_calls."
}
```

```check
{
  "question": "A response reports prompt_tokens = 20,000 and cached_tokens = 18,000. A teammate adds 20,000 + 18,000 and reports 38,000 input tokens. What is wrong?",
  "answer": "cached_tokens is a detail of prompt_tokens: the docstring says they are cached tokens present in the prompt. So the input is 20,000 tokens, of which 18,000 came from the cache. Adding them double-counts. On Anthropic the rule is different: input_tokens excludes cache reads, so there you do add the fields."
}
```

## 9. Links

- Previous part: [L2.2: Thinking blocks and signatures](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures)
- Next: [L2: Converting between formats](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats)
- Why this shape appears at all: [L1.3: The API sets the format, not the model](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format)
- The Anthropic pairing rules: [L1.2: tool_use and tool_result](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result)
- The Anthropic stream: [L2.1: Stream events](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events)
- The client: [ChatDatabricks](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks)
- [Glossary](/notes/ai/llm-apis/glossary)
