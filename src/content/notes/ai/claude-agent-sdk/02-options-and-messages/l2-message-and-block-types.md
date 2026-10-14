---
title: "L2: Message and block types"
order: 2
summary: "The seven message classes that the SDK yields, their fields, and the six content block classes inside them. Why one model response arrives as several AssistantMessage objects with one message_id, what StreamEvent adds, which messages can follow the ResultMessage, what the parser silently drops, and a dispatcher that turns the stream into UI events."
status: not-started
tags: [agent-sdk, messages, content-blocks, stream-event, dispatcher, message-id]
---

## 1. The question this idea answers

A chat service reads the SDK stream and does two jobs at once. It sends UI events to the browser: text as it arrives, a status line for each tool, and the final answer. It also stores the conversation that the user saw.

Both jobs fail in quiet ways when the code guesses the stream:

- The same sentence appears twice in the UI, once from the deltas and once from the complete message.
- The store saves one model response as three separate messages.
- The code stops at the `ResultMessage` and misses an error notice that arrives after it.
- A tool status line never turns to "done", because the result arrived in a subagent message.

This lesson lists every class that the SDK yields, with its fields, and shows a real trace from CLI 2.1.296. It ends with a dispatcher design that you build and test in the exercises.

## 2. Mental model

> [!analogy] A parcel order with a tracking feed
> One model response is one order. It ships as several parcels, one for each content block, and every parcel carries the same order number: the `message_id`. If you subscribe to live tracking (`include_partial_messages=True`), you also receive scan events, the `StreamEvent` objects, before each parcel arrives. Items that return from the warehouse, the tool results, arrive as `UserMessage` objects. Depot notices, the `SystemMessage` objects, arrive in between. The invoice, the `ResultMessage`, closes the order.
>
> **Where it stops working:** a real invoice is the last letter of an order. Here, a few notices can arrive after the invoice. And the sorting office silently discards parcel types that it does not know. A content block of an unknown type is dropped with no notice.

## 3. Terms

| Term | Plain meaning |
|---|---|
| `Message` | The union of the seven classes that the SDK yields: `UserMessage`, `AssistantMessage`, `SystemMessage`, `ResultMessage`, `StreamEvent`, `RateLimitEvent`, `ConversationResetMessage`. |
| content block | One typed part of a message: text, thinking, a tool call or a tool result. |
| `message_id` | The API id of the model response. All `AssistantMessage` objects of one response share it. |
| `StreamEvent` | A wrapper around one raw API stream event. It arrives only with `include_partial_messages=True`. |
| raw API event | One server-sent event of the Messages API, for example `content_block_delta`. |
| `parent_tool_use_id` | The id of the `Agent` tool call that started a subagent. `None` for messages of the main agent. |
| subtype | The `subtype` field of a `SystemMessage` or `ResultMessage`. It says which kind of event this is. |
| `SystemMessage` subclass | A typed class for some subtypes, for example `TaskStartedMessage`. It is still a `SystemMessage`. |
| trailing event | A message that arrives after the `ResultMessage` of a turn. |
| `RateLimitEvent` | A notice that the rate limit status changed. |
| `ConversationResetMessage` | A notice that the conversation was replaced, for example after `/clear`. |
| forward compatibility | Old SDK code keeps working when a newer CLI sends new types. |
| dispatcher | Your function that maps each SDK message to zero or more UI events. |
| UI event | One small message to the browser, for example a text delta or a tool status change. |

## 4. Method and math

### 4.1 The seven message classes

From `types.py` (SDK 0.2.165, checked on 2026-10-13):

```python
Message = (
    UserMessage
    | AssistantMessage
    | SystemMessage
    | ResultMessage
    | StreamEvent
    | RateLimitEvent
    | ConversationResetMessage
)
```

| Class | `type` on the wire | When it arrives |
|---|---|---|
| `SystemMessage` | `system` | At the start of each turn (`init`), and for status, permission, task, hook and compaction events |
| `AssistantMessage` | `assistant` | Once for each completed content block of a model response |
| `UserMessage` | `user` | After each tool run, with the results. Also for user input that you stream. |
| `StreamEvent` | `stream_event` | For each raw API event, only with `include_partial_messages=True` |
| `ResultMessage` | `result` | At the end of each turn |
| `RateLimitEvent` | `rate_limit_event` | When the rate limit status changes |
| `ConversationResetMessage` | `conversation_reset` | When the conversation is replaced without ending the connection |

### 4.2 Fields of UserMessage and AssistantMessage

| `UserMessage` field | Meaning |
|---|---|
| `content` | A string, or a list of content blocks. Inside the loop it holds `ToolResultBlock` objects. |
| `uuid` | The id of the entry in the session file |
| `parent_tool_use_id` | The id of the subagent's `Agent` call, or `None` |
| `tool_use_result` | The raw tool result, copied from the CLI unchanged |
| `origin` | Who caused this message, for example `{"kind": "task-notification"}`. `None` when the CLI did not attribute it. |

| `AssistantMessage` field | Meaning |
|---|---|
| `content` | A list with the content block of this message |
| `model` | The model that produced it |
| `message_id` | The API message id. The reference says: "Multiple messages from one turn share the same ID". |
| `stop_reason` | The reference says "Stop reason from the API". See the trap in section 4.4. |
| `usage` | Token usage of this response |
| `error` | `authentication_failed`, `billing_error`, `rate_limit`, `invalid_request`, `server_error`, `unknown`, or `None` |
| `parent_tool_use_id`, `session_id`, `uuid` | As above |

### 4.3 Content blocks and what the parser drops

The parser in `_internal/message_parser.py` maps each block `type` to a class.

| Wire `type` | Class | Fields | Accepted in |
|---|---|---|---|
| `text` | `TextBlock` | `text` | assistant and user content |
| `thinking` | `ThinkingBlock` | `thinking`, `signature` | assistant content |
| `tool_use` | `ToolUseBlock` | `id`, `name`, `input` | assistant and user content |
| `tool_result` | `ToolResultBlock` | `tool_use_id`, `content`, `is_error` | assistant and user content |
| `server_tool_use` | `ServerToolUseBlock` | `id`, `name`, `input` | assistant content |
| `advisor_tool_result` | `ServerToolResultBlock` | `tool_use_id`, `content` | assistant content |

The `match` statements in the parser have no default branch for blocks. A block of any other type is skipped with no log line. This test ran the SDK parser on two hand-made messages:

```text
assistant content: redacted_thinking, text, web_search_tool_result
assistant blocks kept: ['TextBlock']
user content: image, text
user blocks kept: ['TextBlock']
```

> [!trap] The SDK objects are not a complete record
> A `redacted_thinking` block, a web search result block and an image in a user message do not reach your code. If you rebuild API messages from the SDK objects, these blocks are missing. The session file still holds them. Treat the SDK objects as a view for the UI, not as the exact model history.

### 4.4 One response, several AssistantMessage objects

The streaming page says (checked on 2026-10-13): "Claude Code emits an `AssistantMessage` as each non-empty content block completes, so a response with a text block and a tool call yields two `AssistantMessage` objects. Each one carries only its own content block, and both share the same message ID".

This is a real trace. The CLI 2.1.296 ran against a local fake Messages API that answers with a text block and a tool call, then with text. `include_partial_messages` was `False`.

```text
SystemMessage init         tools=['mcp__data__count_orders']
AssistantMessage           message_id=msg_fake_001  stop_reason=None  [TextBlock "I will count the orders."]
AssistantMessage           message_id=msg_fake_001  stop_reason=None  [ToolUseBlock mcp__data__count_orders {"date": "2026-10-11"}]
SystemMessage informational
UserMessage                [ToolResultBlock tool_use_id=toolu_fake_001 content=[{"type": "text", "text": "412"}]]
AssistantMessage           message_id=msg_fake_002  stop_reason=None  [TextBlock "The tool says: 412"]
ResultMessage success      num_turns=2  stop_reason=end_turn  terminal_reason=completed
```

> [!example] Worked example: group by message_id
> The trace has three `AssistantMessage` objects. Group them by `message_id`, in arrival order:
>
> | Group | Objects | Rebuilt API message |
> |---|---|---|
> | `msg_fake_001` | 2 | `assistant [text, tool_use]` |
> | `msg_fake_002` | 1 | `assistant [text]` |
>
> So 3 objects form 2 API messages. With the `UserMessage` between them, the conversation has the valid shape `assistant [text, tool_use]`, `user [tool_result]`, `assistant [text]` ([LLM APIs L2](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result)).

> [!trap] stop_reason was None on every AssistantMessage
> In this trace, all three objects had `stop_reason=None`. Each object leaves the CLI when its block completes, before the API sends `message_delta` with the stop reason. The `ResultMessage` carried `stop_reason="end_turn"`. Do not depend on `AssistantMessage.stop_reason`. Use the `ResultMessage`.

### 4.5 StreamEvent: raw API events

With `include_partial_messages=True`, the same run yields this sequence. The text deltas are counted, not printed.

```text
SystemMessage init
SystemMessage status                        {"status": "requesting"}
StreamEvent message_start
StreamEvent content_block_start   text
StreamEvent content_block_delta   text_delta        (x5)
AssistantMessage  msg_fake_003  [TextBlock]
StreamEvent content_block_stop
StreamEvent content_block_start   tool_use
StreamEvent content_block_delta   input_json_delta  (x3)
AssistantMessage  msg_fake_003  [ToolUseBlock]
StreamEvent content_block_stop
StreamEvent message_delta
SystemMessage informational
StreamEvent message_stop
UserMessage [ToolResultBlock]
SystemMessage status                        {"status": "requesting"}
StreamEvent message_start ... (second response, 4 text deltas)
ResultMessage success
```

Four facts come from this trace and the docs.

1. **`event` is the raw API event.** The `StreamEvent.event` dict has the same shape as an event of the Messages API stream ([LLM APIs: Stream events](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events)). The streaming page says: "Both contain raw Claude API events, not accumulated text. You need to extract and accumulate text deltas yourself."
2. **Each `AssistantMessage` arrives before its `content_block_stop`.** The docs state the same order.
3. **Tool input arrives as partial JSON strings** in `input_json_delta` events. Parse it only after the block ends, or take the complete input from the `ToolUseBlock`.
4. **A cut stream still ends.** The streaming page says that after an interrupt or a dropped connection "you still receive that message's `message_stop`". A cut tool call gets no `content_block_stop`, so "treat that call's input as incomplete". This needs CLI 2.1.290 or later, which the Python SDK bundles from 0.2.164.

> [!trap] The same text arrives twice
> With partial messages enabled, every text block arrives as deltas and then again as a complete `TextBlock`. The final text also arrives a third time, in `ResultMessage.result`. Display the deltas. Store the complete blocks. Never display both.

The reference says about `StreamEvent.parent_tool_use_id`: "Always `None`. Stream events are emitted for the main session only." So token deltas never come from a subagent.

### 4.6 SystemMessage: subtypes and subclasses

`SystemMessage` has only two fields: `subtype` and `data`, the full raw dict. The parser creates a subclass for some subtypes. Every subclass is still a `SystemMessage`.

| Subtype | Class | Notes |
|---|---|---|
| `init` | `SystemMessage` | Session metadata. `data` keys include `session_id`, `cwd`, `tools`, `mcp_servers`, `model`, `permissionMode`, `claude_code_version`. Emitted "at the start of each turn" (docstring of `SystemInitData`). |
| `status` | `SystemMessage` | Seen in the trace with `{"status": "requesting"}` before each model call |
| `informational` | `SystemMessage` | "plain-text status banners from the loop" (agent-loop page) |
| `permission_denied` | `SystemMessage` | Seen in tests with `tool_name`, `tool_use_id`, `decision_reason_type` and `message` |
| `compact_boundary` | `SystemMessage` | "fires after compaction" |
| `session_state_changed` | `SystemMessage` | Only with `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS=1`. It "can follow that result" (Python reference). |
| `task_started`, `task_progress`, `task_notification`, `task_updated` | `TaskStartedMessage`, `TaskProgressMessage`, `TaskNotificationMessage`, `TaskUpdatedMessage` | Background tasks and subagents |
| `hook_started`, `hook_response` | `HookEventMessage` | Only with `include_hook_events=True` |
| `mirror_error` | `MirrorErrorMessage` | Created by the SDK, never by the CLI. A source comment says: "SDK-synthesized via report_mirror_error". |
| anything else | `SystemMessage` | Forward compatible |

> [!trap] Test the subclass before the base class
> `isinstance(m, SystemMessage)` is true for a `MirrorErrorMessage` and for every task message. In an `if` chain or a `match` statement, put the subclasses first. Otherwise the base branch catches them, and a store error looks like an ordinary status message.

### 4.7 Subagent messages

A subagent runs in its own context ([lesson 8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents)). The docstring of `forward_subagent_text` says: "By default only `tool_use` / `tool_result` blocks from subagents (spawned via the Agent tool) are emitted, as `AssistantMessage` / `UserMessage` objects whose `parent_tool_use_id` is the spawning Agent `tool_use` id". With `forward_subagent_text=True`, the subagent's text and thinking blocks arrive the same way.

So a dispatcher must check `parent_tool_use_id` first. A message with a value belongs to a nested activity, not to the main answer.

### 4.8 ResultMessage, and what can follow it

| Field | Meaning |
|---|---|
| `subtype` | `success`, `error_max_turns`, `error_max_budget_usd`, `error_during_execution`, `error_max_structured_output_retries` |
| `is_error`, `terminal_reason`, `api_error_status` | Check `terminal_reason` before `subtype` ([Foundations L2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop)) |
| `result` | The final text on `success`. `None` on error subtypes. |
| `num_turns`, `duration_ms`, `duration_api_ms` | Size and time of the turn |
| `session_id` | Present on every result |
| `stop_reason` | Of the final model response, for example `end_turn` or `refusal` |
| `total_cost_usd`, `usage`, `model_usage` | Optional in Python. `usage` covers the main loop only. `model_usage` covers every model and subagent ([lesson 7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields)). |
| `permission_denials` | One entry for each denied tool call, with `tool_name`, `tool_use_id`, `tool_input` |
| `errors`, `structured_output`, `deferred_tool_use`, `origin`, `uuid` | Error strings, structured output, a deferred call, the origin of the turn, the entry id |

The agent-loop page says: "A small number of trailing system events, such as `prompt_suggestion`, can arrive after it, so iterate the stream to completion rather than breaking on the result."

In a session-store test of [L4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors), a `MirrorErrorMessage` arrived 1.0 s after the `ResultMessage` of the same run. A loop that stops at the result never sees that a batch of the transcript was lost.

Two more classes carry no turn content:

- **`RateLimitEvent`** holds `rate_limit_info` with `status` (`allowed`, `allowed_warning`, `rejected`), `resets_at`, `rate_limit_type`, `utilization` and a `raw` dict. The parser converts the camelCase wire keys, for example `resetsAt`, to these snake_case names.
- **`ConversationResetMessage`** holds `new_conversation_id`, `uuid` and `session_id`. In a test, a streamed `/clear` produced this message. The next `init` message carried a new session id, which differed from `new_conversation_id`. The reference says the same: "Messages after the reset carry a new `session_id`".

### 4.9 Forward compatibility

| Input from the CLI | What the parser does |
|---|---|
| Unknown message `type` | Returns `None`, logs "Skipping unknown message type" at debug level, and the SDK yields nothing |
| Unknown `SystemMessage` subtype | Returns a plain `SystemMessage` |
| Unknown content block type | Drops the block silently |
| A message with no `type` | Raises `MessageParseError("Message missing 'type' field")` |
| A `system` message with no `subtype` | Raises `MessageParseError` ("Missing required field in system message: 'subtype'") |

The source comment explains the first row: "Forward-compatible: skip unrecognized message types so newer CLI versions don't crash older SDK versions." Your dispatcher needs the same rule: an unknown class or subtype produces no UI event and no error.

### 4.10 A dispatcher for a chat UI

The dispatcher turns each SDK message into zero or more UI events. A design with four event types:

| SDK input | UI event |
|---|---|
| `StreamEvent`, `content_block_delta` with `text_delta`, main agent | `{"type": "text_delta", "text": ...}` |
| `content_block_start` with a `tool_use` block, or a `ToolUseBlock` when partial messages are disabled | `{"type": "tool", "id": ..., "name": ..., "state": "running"}` |
| `ToolResultBlock` in a `UserMessage` | the same tool id with `"state": "done"` or `"error"` |
| `SystemMessage` subtype `permission_denied` | the same tool id with `"state": "denied"` |
| `ResultMessage` | `{"type": "final", "session_id": ..., "ok": ..., "cost_usd": ...}` with no text, because the deltas already showed it |
| `ConversationResetMessage` | `{"type": "reset"}` |
| `MirrorErrorMessage` | no UI event. Log it and count it. |
| anything else | nothing |

A denied call produces two messages: a `permission_denied` system message, then a `ToolResultBlock` with `is_error`. Keep exactly one terminal state for each tool id.

A short sketch shows the shape. It is not a full solution.

```python
def dispatch(m, partial: bool) -> list[dict]:
    match m:
        case MirrorErrorMessage():          # subclass before SystemMessage
            log.error("mirror error %s", m.error)
            return []
        case StreamEvent(event={"type": "content_block_delta", "delta": {"type": "text_delta", "text": t}}):
            return [{"type": "text_delta", "text": t}]
        case _:
            return []                       # forward compatible
```

Two rules keep the UI correct. When `partial` is true, ignore `TextBlock` objects for display. And never let a message with a `parent_tool_use_id` add text to the main answer.

### 4.11 Production view

| Concern | What to do |
|---|---|
| Correctness | Group `AssistantMessage` objects by `message_id` before you store them. Pair each `ToolUseBlock` with its `ToolResultBlock` by id. |
| UI | Display deltas or complete blocks, never both. Route messages with a `parent_tool_use_id` to a nested area. |
| Reliability | Read the stream to its end. Treat `MirrorErrorMessage` and `ResultMessage.permission_denials` as metrics. |
| Upgrades | Ignore unknown classes and subtypes. Do not depend on `AssistantMessage.stop_reason`. |
| Storage | Store what the user saw from the event stream. The SDK objects drop some block types, so they are not the model history. |
| Testing | Record traces as JSON fixtures and run the dispatcher on them with no model call. |

## 5. Code

These exercises go in `claude-agent-sdk/09-messages.ipynb`. Exercise 2.1 needs one model run or the fake model server. The others need neither.

**Exercise 2.1: record a trace.** Run one `query()` with one in-process tool and `include_partial_messages=True`. Save each message as one JSON line: the class name plus `dataclasses.asdict(message)`. Write `load_trace(path)` that rebuilds the dataclass objects.

Acceptance tests:

- `load_trace` returns objects of the same classes in the same order.
- The trace contains at least two `AssistantMessage` objects with the same `message_id`.

**Exercise 2.2: the dispatcher.** Write `dispatch(message, partial)` with the event table of section 4.10. Test it on your recorded trace and on the trace of section 4.5, built by hand.

Acceptance tests:

- The joined `text_delta` events equal `ResultMessage.result` exactly.
- Each tool id produces exactly one `running` event and exactly one terminal event (`done`, `error` or `denied`).
- With `partial=True`, no text reaches the UI from a `TextBlock`. With `partial=False`, the complete blocks produce the text.
- A message with `parent_tool_use_id` set produces no text in the main answer.

**Exercise 2.3: rebuild API messages.** Write `to_api_messages(messages)`. It groups `AssistantMessage` objects by `message_id`, keeps `UserMessage` objects with tool results, and returns a list of `{"role", "content"}` dicts.

Acceptance tests:

- The trace of section 4.4 gives exactly three API messages: assistant with 2 blocks, user with 1 block, assistant with 1 block.
- With the user prompt added first, the output passes the pairing check of [LLM APIs L2, exercise 2.1](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result).

**Exercise 2.4: forward compatibility.** Add these inputs to a test:

- a `SystemMessage` with subtype `"brand_new"`
- a `MirrorErrorMessage`
- a `RateLimitEvent`
- a `ConversationResetMessage`
- a `SystemMessage` that arrives after the `ResultMessage`

Acceptance tests:

- The dispatcher raises no exception for any input.
- The unknown subtype produces no event. The reset produces exactly one `reset` event.
- The `MirrorErrorMessage` is logged and is not handled by the `SystemMessage` branch.

## 6. Common mistakes

1. **One `AssistantMessage` is one API message.** One response arrives as one object per content block. Group by `message_id`.
2. **Displaying deltas and complete blocks.** The user sees each sentence twice.
3. **Stopping at the `ResultMessage`.** Trailing events, such as a mirror error, can follow it.
4. **`isinstance(m, SystemMessage)` first.** The base branch also catches every subclass.
5. **Trusting `AssistantMessage.stop_reason`.** It was `None` in every test trace. Read the `ResultMessage`.
6. **Rebuilding the exact model history from SDK objects.** The parser drops unknown block types, for example `redacted_thinking` and images in user content.
7. **Raising on unknown types.** A newer CLI can add types at any time. Ignore what you do not know.

## 7. One-minute explanation

The SDK yields seven classes: system messages, assistant messages, user messages, result messages, stream events, rate limit events and conversation resets. A model response does not arrive as one object. The CLI emits one `AssistantMessage` for each completed content block. The blocks of one response share a `message_id`, so group by that id to rebuild an API message. Tool results arrive as `UserMessage` objects. With `include_partial_messages`, raw API stream events also arrive, before each complete block. So a UI must show either the deltas or the complete blocks, never both. Messages from subagents carry a `parent_tool_use_id`. The `ResultMessage` ends a turn, but trailing events such as a mirror error can follow, so read the stream to its end. The parser skips unknown message types and silently drops unknown content blocks, so the SDK objects are a view, not a complete record.

## 8. Check questions

```check
{
  "question": "A trace has five AssistantMessage objects with the message ids A, A, A, B, B. How many model responses happened, and how many content blocks did response A have?",
  "answer": "Two model responses, A and B. The CLI emits one AssistantMessage for each completed content block, so response A had three blocks and response B had two."
}
```

```check
{
  "question": "With include_partial_messages=True, a UI shows every sentence twice. What causes it, and what is the fix?",
  "hint": "Count how many times one text block reaches your code.",
  "answer": "Each text block arrives first as text_delta stream events and then again as a complete TextBlock in an AssistantMessage. The UI displays both. The fix is to display only the deltas when partial messages are enabled, and to use the complete blocks only for storage. The final text in ResultMessage.result must not be displayed again either."
}
```

```check
{
  "question": "Your loop does `if isinstance(m, SystemMessage): handle_status(m)` before any other check. Which messages does this branch catch by mistake?",
  "answer": "Every SystemMessage subclass: MirrorErrorMessage, TaskStartedMessage, TaskProgressMessage, TaskNotificationMessage, TaskUpdatedMessage and HookEventMessage. Put the subclass checks before the base class check."
}
```

```check
{
  "question": "Why is a list of SDK message objects not an exact copy of what the model saw?",
  "answer": "The parser keeps only known block types. It silently drops other blocks, for example redacted_thinking, web search result blocks and images in user content. It also skips unknown message types. The session file, or your own transcript, is the complete record."
}
```

## 9. Links

- Previous: [L1: ClaudeAgentOptions](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options)
- Next part: [L3.1: In-process MCP tools](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools)
- The raw events inside `StreamEvent`: [LLM APIs: Stream events](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events)
- The loop that produces the messages: [Foundations L2: The agent loop](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop)
- Sending UI events to a browser: [FastAPI streaming and SSE](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse)
- What to store: [Chats, messages and parts](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts)
- [Glossary](/notes/ai/claude-agent-sdk/glossary)
