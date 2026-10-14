---
title: "Glossary"
order: 2
summary: "Every term in LLM APIs and Message Formats, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| access token | A short-lived string from Entra ID, sent as `Authorization: Bearer <token>`. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| accumulator | Your code that rebuilds the final message from the events. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| adaptive thinking | The mode `{"type": "adaptive"}`. The model decides when to think and how much. | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| agent run | All model calls that answer one user message, until a final answer. | [4.2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops) |
| Anthropic Messages shape | The wire format of `POST /v1/messages`: a top-level `system`, `user` and `assistant` messages with typed content blocks. | [1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) |
| API key | A long-lived secret from the Foundry portal, sent in the `api-key` or `x-api-key` header. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| `arguments` | The function input as a string of JSON text that the model wrote. It can be invalid JSON. | [3.1](/notes/ai/llm-apis/03-openai-format/l1-the-openai-chat-shape) |
| `arguments` string | The tool input in the OpenAI chat shape. It is a JSON text, not a JSON object. | [1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) |
| assistant message | A message with role `assistant`: text from the model, tool calls from the model, or both. | [3.1](/notes/ai/llm-apis/03-openai-format/l1-the-openai-chat-shape) |
| automatic caching | One top-level `cache_control` that moves the breakpoint to the last cacheable block on every call. | [4.2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops) |
| base URL | `https://{resource}.services.ai.azure.com/anthropic/`. Paths such as `v1/messages` follow it. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| block type | The value of the `type` field of a block. It decides which other fields the block has. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| cache read | Input tokens reused from the cache. Field: `cache_read_input_tokens`. | [4.2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops) |
| cache write | Input tokens stored in the cache on this call. Field: `cache_creation_input_tokens`. | [4.2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops) |
| cache-read share | Cache reads divided by all input tokens of a call or a run. | [4.2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops) |
| canonical JSON | One fixed way to write a JSON object as text, so that equal objects give equal strings. | [3.2](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats) |
| Chat Completions | OpenAI's chat endpoint and its wire format. Many other providers accept the same shape. | [3.1](/notes/ai/llm-apis/03-openai-format/l1-the-openai-chat-shape) |
| chunk | One streamed object of type `chat.completion.chunk`. | [3.1](/notes/ai/llm-apis/03-openai-format/l1-the-openai-chat-shape) |
| client tool | A tool that the application runs. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| cold start | A run whose first call finds nothing of the conversation in the cache. | [4.2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops) |
| content block | One typed item inside the `content` of a message, for example a `text` block or a `tool_use` block. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| content block index | The `index` field of a block event. It is the position of the block in the final `content` list. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| converter | Code that converts a conversation in one wire format into the other wire format. | [3.2](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats) |
| cumulative usage | Token counts that give the total so far, not the increase since the last event. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| data URL | A URL that holds the file bytes inline, for example `data:image/png;base64,iVBORw0K`. | [3.2](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats) |
| `DefaultAzureCredential` | An `azure-identity` class that tries several ways to get Azure credentials, for example a managed identity or an `az login` session. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| delta | A small change to one block, for example three more characters of text. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| deployment | One model instance inside a resource. You call a deployment, not a model. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| deployment name | The name of a deployment. It is the value of the `model` field in your requests. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| developer message | A message with role `developer`: instructions from the developer. It replaces the `system` role on newer OpenAI models. | [3.1](/notes/ai/llm-apis/03-openai-format/l1-the-openai-chat-shape) |
| display | The setting `thinking.display`. It decides what the `thinking` field holds: `summarized` or `omitted`. | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| effort | The setting `output_config.effort`: `low`, `medium`, `high`, `xhigh` or `max`. It controls how much work the whole response gets. | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| endpoint | One URL that accepts model requests, for example `https://{resource}.services.ai.azure.com/anthropic/v1/messages`. | [1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) |
| event | One unit of the stream: a name and a JSON object. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| extended thinking | The older manual mode `{"type": "enabled", "budget_tokens": N}` with a fixed token budget. | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| `finish_reason` | The field of a choice that says why the model stopped: `stop`, `length`, `tool_calls` or `content_filter`. | [3.1](/notes/ai/llm-apis/03-openai-format/l1-the-openai-chat-shape) |
| format-neutral store | A chat database whose rows do not follow any provider's wire format. Code converts the rows to a wire format at the last step. | [1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) |
| hosting option | Where inference for a deployment runs: hosted on Azure or hosted on Anthropic. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| input schema | A JSON Schema object that describes the input that the tool accepts. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| `input_json_delta` | A delta that adds a fragment of JSON text to the input of a `tool_use` block. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| interleaved thinking | Thinking blocks between tool calls inside one assistant turn. | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| invalidation | A change early in the input that makes the cached prefix useless from that point on. | [4.2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops) |
| `is_error` | A field of a `tool_result` block. `true` tells the model that the tool failed. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| loss report | A list that a converter returns with every item that it dropped or changed. | [3.2](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats) |
| lossless subset | The part of a conversation that both formats can express exactly. | [3.2](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats) |
| lossy | A conversion that drops information that the target format cannot hold. | [3.2](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats) |
| mapping | The rule that says which item of one format becomes which item of the other. | [3.2](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats) |
| message | One entry in the `messages` list: a `role` and a `content`. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| Messages API | Anthropic's HTTP endpoint for model calls: `POST /v1/messages`. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| Microsoft Entra ID | Azure's identity service. It issues access tokens to users, service principals and managed identities. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| Microsoft Foundry | Microsoft's Azure service for AI models. It offers Claude through an Anthropic-compatible endpoint. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| model call | One request to the Messages API. An agent run makes several. | [4.2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops) |
| normalization | Rewriting equal forms into one form before you compare them, for example a content string into a list with one text block. | [3.2](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats) |
| OpenAI chat shape | The wire format of Chat Completions: a list of messages with roles such as `system`, `user`, `assistant` and `tool`. | [1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) |
| OpenAI-compatible | A server that is not OpenAI but accepts the OpenAI chat shape, so the OpenAI client libraries work with it. | [1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) |
| orphan | A `tool_use` block with no result, or a `tool_result` block with no matching call. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| pairing | The rule that each `tool_use` block has exactly one matching `tool_result` block, in the right place. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| parallel tool use | One assistant message with two or more `tool_use` blocks. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| `parallel_tool_calls` | The request field that allows or blocks several tool calls in one assistant message. | [3.1](/notes/ai/llm-apis/03-openai-format/l1-the-openai-chat-shape) |
| partial JSON | JSON text that is not complete yet, so a normal JSON parser rejects it. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| pass-through | Copying an item that the converter does not understand into the output unchanged. | [3.2](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats) |
| `ping` | An event with no content. It keeps the connection active. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| prefill | A last message with the role `assistant`. The model continues that text. The newest models reject it. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| prefix | The start of the input, in the order tools, system, messages. | [4.2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops) |
| prefix check | A check that the system prompt, the tools and the earlier messages are unchanged since a thinking block was created. | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| provider | The service that hosts the model and its endpoints, for example Anthropic, Microsoft Foundry or Databricks. | [1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) |
| RBAC role | An Azure permission set, for example Foundry User or Cognitive Services User. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| reasoning item | A Databricks extension of the OpenAI chat shape: a content item of type `reasoning` that carries Claude's thinking and its signature. | [1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) |
| `redacted_thinking` | A block with encrypted reasoning in a `data` field and no readable text. | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| request body | The JSON object that the application sends in one call. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| request ids | The response headers `request-id` (Anthropic) and `apim-request-id` (Azure API Management) that support teams need. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| resource | The top level in Foundry. It "contain[s] your security and billing configuration". | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| role | The sender of a message. In `messages` it is `user` or `assistant`. Some newer models also accept `system` (section 4.4). | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| round trip | A conversion to the other format and back again. | [3.2](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats) |
| scope | The service a token is for. For Claude on Foundry: `https://ai.azure.com/.default`. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| server tool | A tool that Anthropic's servers run, for example web search. The application does not send its result. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| server-sent events (SSE) | A text format for a stream over HTTP. Each event is an `event:` line, a `data:` line and a blank line. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| signature | An opaque string in a thinking block: "an encrypted copy of the full reasoning that you pass back unchanged". | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| `signature_delta` | A delta that sets the `signature` of a thinking block. It comes just before the block stops. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| stateless | The server keeps no memory between calls. Each request carries the full conversation. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| stop reason | The `stop_reason` field of a response. It says why the model stopped. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| `StreamEvent` | The Claude Agent SDK message type that carries one raw API stream event. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| streaming | The server sends the response in pieces while the model generates it, instead of one JSON body at the end. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| summarized thinking | A readable summary of the reasoning. It is not the full reasoning. | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| system prompt | Instructions from the developer that apply to the whole conversation. On this API it is the top-level `system` field. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| `text_delta` | A delta that adds text to a `text` block. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| thinking | Reasoning that the model writes before or between its visible output. | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| thinking block | A content block `{"type": "thinking", "thinking": "...", "signature": "..."}` in an assistant message. | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| `thinking_delta` | A delta that adds text to a `thinking` block. | [2.1](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) |
| `ThinkingConfig` | The Agent SDK type for the `thinking` option: adaptive, enabled or disabled. | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| time to live (TTL) | How long a cache entry lives without use: 5 minutes by default, or 1 hour. | [4.2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops) |
| token provider | A function that returns a valid token on each call and refreshes it before it expires. | [4.1](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) |
| tool | A function that the application offers to the model: a name, a description and an input schema. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| tool call id | The `id` of one item in `tool_calls`, for example `call_DdmO9pD3xa9XTPNJ32zg2hcA`. | [3.1](/notes/ai/llm-apis/03-openai-format/l1-the-openai-chat-shape) |
| tool definition | The JSON object in the `tools` list of a request that describes one tool. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| tool message | A message with the role `tool` and a `tool_call_id`. It holds one tool result in the OpenAI chat shape. | [1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) |
| tool use id | The `id` field of a `tool_use` block, for example `toolu_01A`. The API creates it. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| tool-use turn | An assistant message with `tool_use` blocks and the user message with their results. | [2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) |
| `tool_calls` | The list of tool requests in an assistant message of the OpenAI chat shape. | [1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) |
| `tool_choice` | The request field that controls whether the model may, must or must not call a tool. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| `tool_result` block | A block in a `user` message. The application returns the output of one tool call. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| `tool_use` block | A block in an `assistant` message. The model asks the application to run one tool with one input. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| `tool_use_id` | The field of a `tool_result` block that names the `tool_use` block that it answers. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| translation layer | Code that converts one wire format into another. It runs on a server or in your own process. | [1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) |
| turn | One message, or several neighboring messages with the same role, that the model treats as one unit. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| uncached input | Input tokens after the last cache breakpoint. Field: `input_tokens`. | [4.2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops) |
| usage | The `usage` field of a response. It holds the billed token counts. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| usage chunk | An extra last chunk with token usage and an empty `choices` list, sent when `include_usage` is true. | [3.1](/notes/ai/llm-apis/03-openai-format/l1-the-openai-chat-shape) |
| warm start | A run whose first call finds the previous run's input in the cache. | [4.2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops) |
| wire format | The JSON shape of the request and response on one HTTP endpoint: field names, roles, block types. | [1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) |
