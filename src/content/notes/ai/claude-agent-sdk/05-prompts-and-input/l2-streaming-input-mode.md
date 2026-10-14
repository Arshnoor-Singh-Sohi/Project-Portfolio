---
title: "L2: Streaming input mode"
order: 2
summary: "The SDK always talks to the CLI in stream-json. A string prompt is one user message, and an async iterable is a stream of user messages with images, queued turns and, with ClaudeSDKClient, interrupts. What the input stream accepts, why old assistant turns cannot be replayed into a new session, what that means for Flow 2, and how a failing generator behaves in the source versus the docs."
status: not-started
tags: [agent-sdk, streaming-input, prompts, flow-2, async-generator]
---

## 1. The question this idea answers

[Sessions L3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) introduced Flow 2. When the session file is missing, the service starts a new session. It puts the earlier turns from its database into the prompt as text. That costs structure: tool calls, results and thinking blocks become plain text.

So why not send the earlier turns as real messages, one user message and one assistant message after the other? To answer, you must know three things: what the SDK sends to the CLI, what each input mode supports, and what the input stream accepts.

This lesson also covers the practical side of the same pipe: images, several questions in a row, and interrupts. It also shows what happens when your input generator raises an exception. The docs and the source disagree on that last point.

## 2. Mental model

> [!analogy] A posted letter and an open phone line
> A string prompt is a letter. You write it once and post it, and the slot closes behind it: the SDK ends the CLI's input, so no second letter can follow. One reply comes.
>
> Streaming input is an open phone line. You can say more while the other side works, you can show a photo, and with `ClaudeSDKClient` you can interrupt and say "stop".
>
> **Where it stops working:** on the phone line you speak only as yourself. There is no documented way to play a recording of the other side's earlier words as if they spoke them now. A test showed that the line accepts such a recording with no error. But the recording plays when it arrives, not when you meant it to play. And every sentence that you speak as yourself gets its own answer.

## 3. Terms

| Term | Plain meaning |
|---|---|
| single message input | The docs' name for a one-shot prompt. In Python: `query(prompt="...")`. |
| streaming input mode | The docs' name for a long-lived input stream of user messages. In Python: `query()` with an async iterable, or `ClaudeSDKClient`. |
| input message | One dict that the SDK writes to the CLI's stdin, with `"type": "user"`. |
| async iterable | An object that you read with `async for`. The `prompt` argument accepts one. |
| async generator | An `async def` function with `yield`. The usual way to build an async iterable ([async generators](/notes/software-engineering/python/01-asyncio/l2-async-generators)). |
| `stream-json` | The format on the pipe: one JSON object per line. The SDK always uses it for input. |
| queued message | A user message that arrives while the CLI is still working on an earlier one. |
| turn | Here: the work for one user message, from the `init` message to its `ResultMessage`. |
| interrupt | A signal that stops the current turn. Only `ClaudeSDKClient` can send it. |
| end of input | The moment when the SDK closes the CLI's stdin. After it, no new message can arrive. |
| Flow 2 | A new session that receives the earlier turns from your database as text in the prompt. |
| `verbatim_prompts` | An option that makes the CLI deliver every prompt exactly as written. |
| `@path` mention | Text such as `@/srv/data/plants.csv` in a prompt. The CLI reads the named file into the context. |
| image block | A content block `{"type": "image", "source": {...}}` with base64 data. |

## 4. Method and math

### 4.1 The two modes in the docs

The streaming input page says (checked on 2026-10-13):

> "**Streaming Input Mode**: a persistent, interactive session"
>
> "**Single Message Input**: one-shot queries that use session state and resuming"

Streaming input mode is "the **preferred** way to use the Claude Agent SDK". Its listed benefits: "Image uploads", "Queued messages", "Tool integration", "Real-time feedback" and "Context persistence". The page says that single message input does not support "Direct image attachments in messages", "Dynamic message queueing", "Real-time interruption" and "Natural multi-turn conversations".

In Python, the modes map to three calls:

| Call | Mode | Can send more messages later | Images | Interrupt |
|---|---|---|---|---|
| `query(prompt="text")` | single message | no | no, text only | no |
| `query(prompt=async_iterable)` | streaming | yes, while the iterable yields | yes | no |
| `ClaudeSDKClient` with `query()` and `receive_response()` | streaming | yes, any time | yes | yes |

The `query()` docstring calls its iterable form "Streaming mode (still unidirectional)". You give it all input at the start, and you cannot react to the answers. [Foundations L3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) compares the two entry points.

### 4.2 How a string prompt is really sent

The CLI never receives a prompt as a command-line argument. The last flag of every command is `--input-format stream-json` ([L2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options)). The source comment says: "Always use streaming mode with stdin (matching TypeScript SDK)".

For a string, `_internal/client.py` writes one input message after the `initialize` request:

```python
            if isinstance(prompt, str):
                # For string prompts, write user message to stdin after initialize
                # (matching TypeScript SDK behavior)
                user_message = {
                    "type": "user",
                    "session_id": "",
                    "message": {"role": "user", "content": prompt},
                    "parent_tool_use_id": None,
                }
```

Then it starts `wait_for_result_and_end_input()`. Despite its name, this function waits only when the run has in-process MCP servers, hooks or a `can_use_tool` callback. Then it keeps stdin open until the whole run ends, because the CLI must still send control requests ([L3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools)). Without them, it closes stdin at once. The CLI still answers the message that it already read.

> [!key] The wire is the same, the timing differs
> A string prompt and a streamed message cross the pipe in the same `stream-json` format. The difference is how many user messages you can send, and when the SDK ends the input.

### 4.3 The input message format

The `query()` docstring gives the shape:

```json
{
  "type": "user",
  "message": {"role": "user", "content": "..."},
  "parent_tool_use_id": null,
  "session_id": "..."
}
```

| Key | Meaning |
|---|---|
| `type` | `"user"` in every documented example |
| `message.content` | A string, or a list of content blocks: text and images |
| `parent_tool_use_id` | `None` for your own messages |
| `session_id` | Optional. `ClaudeSDKClient.query()` sets `"default"` when the key is missing. |
| `client_composed` | Optional. `True` delivers the text as written. `verbatim_prompts=True` sets it on every message. |
| `origin` | Optional. The `MessageOrigin` docstring says that only `{"kind": "human"}` "is honored from an SDK host". |

An image goes in as a content block. This is the shape from the docs example:

```python
{"type": "user", "message": {"role": "user", "content": [
    {"type": "text", "text": "Which line has the most downtime in this chart?"},
    {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": image_b64}},
]}}
```

The page warns: "If an image block's `source` is missing or isn't an object, the SDK doesn't report an error." The model then receives a text note such as `[Image could not be processed: image block has no source object]`.

### 4.4 Queued messages: one turn for each user message

A test (CLI 2.1.296, local fake model server) yielded two user messages at once: "First question about plants." and "Second question about lines.". The stream showed two complete turns (output shortened):

```text
[0.9s] System init
[1.0s] Assistant Echo: First question about plants.
[1.0s] Result success turns=1
[1.0s] System init
[1.1s] Assistant Echo: Second question about lines.
[1.1s] Result success turns=1
model call 1 saw: user "First question about plants."
model call 2 saw: user "First question...", assistant "Echo: First question...", user "Second question..."
```

Each user message started its own turn with its own `ResultMessage`, and the second turn saw the first answer. The Python reference says the same: "Claude Code starts responding to the first yielded message as soon as it arrives, without waiting for the iterable to finish". Its advice: "Put everything Claude should read before answering into one message".

Two documented details matter for limits and errors. A queued message that waits when a turn ends at `max_turns` "stays queued", and "the max-turns count starts over for that turn". And after an error result, "A streaming input session stays alive, and you can keep sending messages, except after a session crash".

### 4.5 Interrupts

Only `ClaudeSDKClient.interrupt()` can stop a turn. The `query()` docstring lists "No interrupts". After an interrupt, read `receive_response()` to its end before the next prompt, because the buffer still holds the old messages ([Foundations L3, section 4.6](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient)). The `ResultMessage` of a stopped turn has `terminal_reason` `"aborted_streaming"` or `"aborted_tools"`.

### 4.6 What the input stream accepts

**The SDK source.** `stream_input()` in `_internal/query.py` writes every item of your iterable as it is:

```python
            async for message in stream:
                if self._closed:
                    break
                ...
                await self.transport.write(
                    json.dumps(stamp_user_message(message, self._verbatim_prompts))
                    + "\n"
                )
```

The type hint is `AsyncIterable[dict[str, Any]]`. The SDK does not check the `type` key. It never rejects a dict with `"type": "assistant"`. The decision belongs to the CLI.

**The docs.** Every input example has `"type": "user"`. The TypeScript example types the generator as `AsyncGenerator<SDKUserMessage>`. No page describes an assistant message as input.

**The CLI, in a test.** A generator yielded three dicts at once: user "My plant is Plant B.", then `{"type": "assistant", ...}` with the text "Plant B makes bagels.", then user "What does my plant make?". There was no error and no model call for the assistant line. The fake model server recorded:

```text
model call 1 saw: assistant "Plant B makes bagels." | user "My plant is Plant B."
model call 2 saw: assistant "Plant B makes bagels." | user "My plant is Plant B." | assistant "Echo: My plant is Plant B." | user "What does my plant make?"
```

The assistant line landed before the user message that was sent first. In a second test, with pauses between the lines, it landed after the first answer: two assistant messages in a row.

> [!key] Old assistant turns cannot be replayed reliably
> The only documented input is a user message. The CLI 2.1.296 accepted an assistant line with no error, but its position depended on timing, and the roles stopped alternating. Each user line also starts a new turn, so replaying old user messages makes the model answer them again. So a new session cannot receive the earlier turns as real messages. Flow 2 puts them into the text of one user message.

### 4.7 Consequences for rebuilding context

> [!example] Worked example: replay versus text
> A chat has 3 earlier turns and a new question. The session file is gone.
>
> - **Replay as queued user messages:** 3 old questions plus 1 new question = 4 turns, so at least 4 model calls. The model answers the 3 old questions again, and each call resends a longer history.
> - **Flow 2:** 1 user message holds the 3 old turns as text and the new question. That is 1 turn, and 1 model call for a direct answer.

A Flow 2 message can carry the transcript and the question as two text blocks of one user message. In a test, both blocks reached the model in one message. The price stays the one from [L3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks): tool calls, results and thinking blocks become text, and the cache prefix is new.

Rebuilt text also brings two risks, because it holds words that the current user did not type now.

1. **`@path` mentions.** A test sent a rebuilt transcript that contained `@/<lab folder>/plant.cfg`, with `tools=[]`. Without `verbatim_prompts`, the file content reached the model. With `verbatim_prompts=True`, it did not. The CLI reads the file itself: no tool is involved.
2. **Slash commands.** A streamed message `/clear` ran as a command: the stream showed a `ConversationResetMessage`, and the next turn had a new session id ([L2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types)).

The docstring of `verbatim_prompts` covers both: the CLI "delivers the text exactly as given: no `@path` file-mention expansion and no slash-command dispatch". It names the Flow 2 case directly: "Use this when the prompt text is assembled from content the end user did not type (prior turns, tool results, third-party text)". The Python reference says that it requires Python SDK 0.2.158 or later and Claude Code 2.1.248 or later. The docstring also says that such a turn "skips the turn-start attachment pass", for example nested `CLAUDE.md` files and skill listings.

> [!trap] Rebuilt history can read files on the server
> Without `verbatim_prompts`, an `@/path` that a user typed weeks ago can make the CLI read a server file into today's prompt, also with `tools=[]`. Set `verbatim_prompts=True`, or `"client_composed": True` on each Flow 2 message.

### 4.8 When your generator raises

The docs and the source disagree.

**The docs** (streaming input page, checked on 2026-10-13): "In the Python SDK, a generator exception is logged at debug level and the session stalls without raising, so if a streaming session hangs with no output, enable debug logging and check your generator."

**The source** (`stream_input()` in `_internal/query.py`, commit b6e9d12):

```python
        except Exception as e:
            # A user-supplied prompt iterable (or the write) failed. Don't
            # leave stdin open — the CLI would wait for input forever and the
            # consumer's `async for` would never finish — fall through and
            # close it like a normal end of input.
            logger.error("Prompt stream failed; closing stdin: %s", e)
```

After this, the code ends the input as at a normal end of the iterable. If no message was written, it closes stdin at once. Three tests confirmed the source. Each generator raised `FileNotFoundError("diagram.png")`.

| Case | Log | What the loop received | Exception in your code |
|---|---|---|---|
| `query()`, the generator raises after one message | ERROR "Prompt stream failed; closing stdin: diagram.png" | the full first turn, then the end | none |
| `query()`, the generator raises before its first message | the same ERROR line | no messages at all, no `ResultMessage` | none |
| `ClaudeSDKClient.query(generator)` raises after one message | none from the SDK | the first turn, through `receive_response()` | `FileNotFoundError` from `await client.query(...)` |

The code follows the source: the error is logged at ERROR level, stdin closes, and `query()` ends. Nothing stalls. `ClaudeSDKClient.query()` behaves differently, because it reads your iterable in your own task (`client.py`, lines 299 to 306) and has no `try` around it. `ClaudeSDKClient.connect(prompt=generator)` uses `stream_input()`, like `query()`.

> [!trap] An empty run that looks successful
> In the second row, the `async for` loop ends normally with zero messages. No answer, no error, no result. After every run, check that a `ResultMessage` arrived. If not, treat the run as failed.

### 4.9 Production view

| Concern | What to do |
|---|---|
| Correctness | One user message for each answer that you want. Never stream assistant messages. |
| Flow 2 | One user message: marked transcript plus the new question. Set `verbatim_prompts=True`. |
| Security | Rebuilt text must never trigger `@path` reads or slash commands. |
| Reliability | Catch errors inside your own generator. After each run, assert that a `ResultMessage` arrived. |
| UI control | Use `ClaudeSDKClient` when the user needs a stop button. Drain after an interrupt. |
| Cost | Do not queue several questions when one message can hold them. Each queued message is a turn. |

## 5. Code

These exercises go in `claude-agent-sdk/12-streaming-input.ipynb`. Exercises 2.2 and 2.3 need no model call.

**Exercise 2.1: string versus stream.** Send the same question as a string and as a generator with one message. Then send a generator with two questions.

Acceptance tests:

- The first two runs yield the same message classes in the same order.
- The two-question generator yields two `init` messages and two `ResultMessage` objects.

**Exercise 2.2: a Flow 2 message builder.** Write `build_flow2_message(turns, new_text, max_chars)`. `turns` is a list of `(role, text)` from your database. It returns one input message dict.

Acceptance tests:

- `type` is `"user"`, the role is `"user"`, and `client_composed` is `True`.
- The content has two text blocks: a clearly marked transcript first, the new question last.
- The total text never exceeds `max_chars`. The newest turns are kept.
- A turn that contains `@/etc/hosts` or starts with `/clear` appears in the transcript as plain text.

**Exercise 2.3: no silent empty runs.** Write `run_checked(prompt_iterable, options)`. It runs `query()`, and it raises `EmptyRunError` when no `ResultMessage` arrived. Wrap the caller's generator so that an exception inside it is recorded and raised again after the loop.

Acceptance tests (use a fake transport or the fake model server):

- A generator that raises before its first `yield` makes `run_checked` raise, not return quietly.
- A generator that raises after one message returns the first answer and then raises the original error.
- A normal generator returns all messages and raises nothing.

**Exercise 2.4: see the replay problem.** Use your fake model server. Stream user, assistant, user with no pauses. Then repeat with a 2-second pause before each line. Record the order of the messages that the model received.

Acceptance test: you record both orders and explain in two sentences why Flow 2 does not depend on this behavior.

## 6. Common mistakes

1. **"A string prompt is sent as a command-line argument."** It is one user message on stdin in `stream-json` format.
2. **Streaming old assistant turns into a new session.** It is not documented, the order depends on timing, and roles may not alternate.
3. **Streaming old user turns as messages.** Each one starts a turn and gets a new answer.
4. **Flow 2 without `verbatim_prompts`.** Old text can trigger `@path` file reads and slash commands.
5. **Trusting the docs on generator errors.** In the source, `query()` logs at ERROR level and closes stdin, and `ClaudeSDKClient.query()` raises in your task.
6. **Assuming every run yields a `ResultMessage`.** A generator that fails before its first message gives zero messages.
7. **Expecting interrupts from `query()`.** Only `ClaudeSDKClient` has `interrupt()`.

## 7. One-minute explanation

The SDK always gives the CLI its input as JSON lines on stdin. A string prompt becomes one user message, and then the SDK ends the input. An async iterable is streaming input: several user messages, each with its own turn, plus images and, with `ClaudeSDKClient`, interrupts. The SDK writes whatever dict you yield, but the only documented input is a user message. A test showed that the CLI accepts an assistant line, but places it by timing, not by intent. So a new session cannot receive old assistant turns as real messages. Flow 2 puts the earlier turns into the text of one user message. That text needs `verbatim_prompts=True`, because otherwise an old `@path` or `/clear` can act. When your generator raises, the source logs an error and closes stdin, unlike the docs, which describe a stall. A generator that fails before its first message gives an empty run with no result, so always check that a `ResultMessage` arrived.

## 8. Check questions

```check
{
  "question": "Your Flow 2 code streams the old chat as alternating user and assistant dicts, then the new question. Name two concrete problems.",
  "answer": "First, only user messages are documented as input. In a test the CLI accepted an assistant line, but placed it by arrival time. It appeared before an earlier user message, and roles stopped alternating. Second, each user dict starts a turn, so the model answers every old question again: extra model calls and extra cost. Put the old turns into the text of one user message instead."
}
```

```check
{
  "question": "query(prompt=gen()) returns with zero messages, and no exception is raised. What is the most likely cause, and how do you detect it in code?",
  "hint": "What does stream_input do when nothing was written?",
  "answer": "The generator raised before its first yield. stream_input caught the exception and logged 'Prompt stream failed; closing stdin' at ERROR level. No message was written, so it closed stdin at once, and no turn ran. Detect it by checking after the loop that a ResultMessage arrived, and by catching errors inside your own generator."
}
```

```check
{
  "question": "A rebuilt Flow 2 prompt contains an old user line \"compare with @/srv/app/.env\". The agent runs with tools=[]. Can the model see the file? What setting prevents it?",
  "answer": "Yes. The CLI expands @path mentions in the prompt itself, before the model call, so no tool is needed. In a test with tools=[], the file content reached the model. verbatim_prompts=True, or client_composed True on the message, makes the CLI deliver the text as written: no @path expansion, no slash-command dispatch."
}
```

```check
{
  "question": "What is the difference on the pipe between query(prompt=\"How many orders shipped?\") and a generator that yields one user message with the same text?",
  "answer": "There is almost none. Both reach the CLI as one user message in stream-json format on stdin, and the CLI always runs with --input-format stream-json. The difference is around the message. For a string, the SDK builds the dict itself and ends the input right after it. For a generator, it writes each yielded dict and ends the input when the generator ends. In both cases, in-process tools, hooks or can_use_tool keep stdin open until the run ends."
}
```

## 9. Links

- Previous: [L1: System prompts and snapshot](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot)
- Flow 1 and Flow 2: [Sessions L3: Session files on temporary disks](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks)
- The two entry points: [Foundations L3: query() vs ClaudeSDKClient](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient)
- What a reset looks like in the stream: [L2.2: Message and block types](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types)
- Building the rebuilt history from stored parts: [From stored parts to model input](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input)
- Async generators: [Python: async generators](/notes/software-engineering/python/01-asyncio/l2-async-generators)
- [Glossary](/notes/ai/claude-agent-sdk/glossary)
