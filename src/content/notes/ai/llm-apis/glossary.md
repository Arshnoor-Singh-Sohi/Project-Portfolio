---
title: "Glossary"
order: 2
summary: "Every term in LLM APIs and Message Formats, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| block type | The value of the `type` field of a block. It decides which other fields the block has. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| client tool | A tool that the application runs. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| content block | One typed item inside the `content` of a message, for example a `text` block or a `tool_use` block. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| input schema | A JSON Schema object that describes the input that the tool accepts. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| `is_error` | A field of a `tool_result` block. `true` tells the model that the tool failed. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| message | One entry in the `messages` list: a `role` and a `content`. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| Messages API | Anthropic's HTTP endpoint for model calls: `POST /v1/messages`. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| orphan | A `tool_use` block with no result, or a `tool_result` block with no matching call. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| pairing | The rule that each `tool_use` block has exactly one matching `tool_result` block, in the right place. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| parallel tool use | One assistant message with two or more `tool_use` blocks. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| prefill | A last message with the role `assistant`. The model continues that text. The newest models reject it. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| request body | The JSON object that the application sends in one call. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| role | The sender of a message. In `messages` it is `user` or `assistant`. Some newer models also accept `system` (section 4.4). | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| server tool | A tool that Anthropic's servers run, for example web search. The application does not send its result. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| stateless | The server keeps no memory between calls. Each request carries the full conversation. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| stop reason | The `stop_reason` field of a response. It says why the model stopped. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| system prompt | Instructions from the developer that apply to the whole conversation. On this API it is the top-level `system` field. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| tool | A function that the application offers to the model: a name, a description and an input schema. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| tool definition | The JSON object in the `tools` list of a request that describes one tool. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| tool use id | The `id` field of a `tool_use` block, for example `toolu_01A`. The API creates it. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| `tool_choice` | The request field that controls whether the model may, must or must not call a tool. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| `tool_result` block | A block in a `user` message. The application returns the output of one tool call. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| `tool_use` block | A block in an `assistant` message. The model asks the application to run one tool with one input. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| `tool_use_id` | The field of a `tool_result` block that names the `tool_use` block that it answers. | [1.2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) |
| turn | One message, or several neighboring messages with the same role, that the model treats as one unit. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
| usage | The `usage` field of a response. It holds the billed token counts. | [1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) |
