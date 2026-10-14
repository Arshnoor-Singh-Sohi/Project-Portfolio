---
title: "Glossary"
order: 2
summary: "Every term in Claude Agent SDK, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| adapter | Your class that implements `SessionStore` for one backend, for example PostgreSQL. | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| `additionalContext` | Text that the CLI inserts into the conversation, as a system reminder, at the point where the hook fired. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| agent loop | The cycle that the CLI repeats: call the model, run the requested tools, add the results, call the model again. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| `Agent` tool | The built-in tool that starts a subagent. The `init` message lists it as `Task`. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| `AgentDefinition` | The dataclass that defines a subagent: description, prompt, tools, model and other fields. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| allow rule | An entry that approves matching tool calls without asking. `allowed_tools` adds allow rules. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| `append` | Extra text that goes after the preset prompt. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| `AssistantMessage` | Output of the model: text, thinking or tool calls. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| async context manager | An object that you use with `async with`. It runs setup code at the start and cleanup code at the end. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| async generator | An `async def` function with `yield`. The usual way to build an async iterable ([async generators](/notes/software-engineering/python/01-asyncio/l2-async-generators)). | [5.2](/notes/ai/claude-agent-sdk/05-prompts-and-input/l2-streaming-input-mode) |
| async iterable | An object that you read with `async for`. The `prompt` argument accepts one. | [5.2](/notes/ai/claude-agent-sdk/05-prompts-and-input/l2-streaming-input-mode) |
| async iterator | An object that you read with `async for`. Each step can wait for new data. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| auto-compact window | The context size, in tokens, that Claude Code lets the conversation reach before auto-compaction. | [6.2](/notes/ai/claude-agent-sdk/06-context-window/l2-compaction-controls) |
| auto-compaction | Claude Code's automatic step that shrinks its copy of the conversation when it nears the limit. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| availability layer | The checks that decide which tools appear in the request to the model. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| background subagent | A subagent that runs while the main agent continues. It is the default. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| bare name | A rule with only a tool name, for example `"Read"` or `"mcp__data__count_orders"`. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| batch | A list of transcript entries that the SDK sends in one `append` call. | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| blocking call | A call that holds the thread until it ends, for example `time.sleep` or a synchronous database driver. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| branch | A session that starts with a copy of another session's history and then differs. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| built-in tool | A tool that the CLI implements itself, for example `Read`, `Bash` or `WebFetch`. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| bundled CLI | A copy of the CLI binary inside the SDK package. The SDK uses it unless you give `cli_path`. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| `cache_creation_input_tokens` | Input tokens written to the prompt cache, at a higher price. | [7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields) |
| `cache_read_input_tokens` | Input tokens read from the prompt cache, at a lower price. | [7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields) |
| callback id | A name such as `hook_0` that the SDK gives each callback in the `initialize` request. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| `can_use_tool` | A Python callback that decides tool calls that would otherwise ask for approval. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| CCU | Claude Consumption Unit: the unit in which Microsoft Foundry bills Claude, USD 0.01 each. | [7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields) |
| chain | The list of entries from the first entry to the newest entry, found by following `parentUuid` links. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| clamp | To move a value that is outside a range to the nearest end of the range. | [6.2](/notes/ai/claude-agent-sdk/06-context-window/l2-compaction-controls) |
| Claude Agent SDK | The Python package `claude-agent-sdk`. It starts the CLI and turns its output into Python objects. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| Claude Code CLI | The `claude` program. It runs the agent loop: model calls, tools, permissions, sessions and compaction. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | An environment variable that sets, in percent, how full the auto-compact window gets before compaction. It can only lower the point. | [6.2](/notes/ai/claude-agent-sdk/06-context-window/l2-compaction-controls) |
| `claude_code` preset | The full Claude Code system prompt, chosen with `{"type": "preset", "preset": "claude_code"}`. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | An environment variable that sets the auto-compact window, from 100,000 to 1,000,000 tokens. | [6.2](/notes/ai/claude-agent-sdk/06-context-window/l2-compaction-controls) |
| `CLAUDE_CODE_DISABLE_1M_CONTEXT` | An environment variable that holds native-1M models to a 200K window. | [6.2](/notes/ai/claude-agent-sdk/06-context-window/l2-compaction-controls) |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | An environment variable that sets the output limit of most requests. A larger value lowers the compaction point. | [6.2](/notes/ai/claude-agent-sdk/06-context-window/l2-compaction-controls) |
| `ClaudeAgentOptions` | The dataclass that holds all settings of one run. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| `ClaudeSDKClient` | A class. It keeps one CLI process open and sends many prompts to it. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| `ClaudeSDKError` | The base class of all SDK errors. | [7.1](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors) |
| CLI | Command-line interface: a program that you start with a command and arguments. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| CLI flag | A command-line argument that the SDK passes to the CLI, for example `--max-turns 12`. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| `CLIConnectionError` | The SDK could not start or talk to the CLI process. | [7.1](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors) |
| client-side estimate | A cost that the CLI computes from token counts and a price table built into it. | [7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields) |
| `CLIJSONDecodeError` | A line on the CLI's stdout was not valid JSON, or was longer than `max_buffer_size`. | [7.1](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors) |
| `CLINotFoundError` | A subclass of `CLIConnectionError`. The SDK maps every `FileNotFoundError` at process start to it, unless the working directory is missing. | [7.1](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors) |
| closure | A function that keeps access to variables of the function that created it. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| cold call | A request whose prefix is not in the prompt cache, for example after a pause longer than the cache lifetime. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| compact summary | An entry with `isCompactSummary: true`. After compaction, it replaces the older entries in the chain. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| `compact_boundary` | A `SystemMessage` subtype. The CLI compacted the conversation at this point. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| compaction point | The context size at which auto-compaction runs. About 967K tokens on native-1M models by default. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| config directory | The folder where Claude Code keeps its data: `~/.claude` by default, or the value of `CLAUDE_CONFIG_DIR`. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| conformance suite | The test function `run_session_store_conformance` that checks an adapter against the contract. | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| content block | One typed part of a message: text, thinking, a tool call or a tool result. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| context editing | An API feature that removes old tool results on the server for one request. Your own message list stays complete. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| context isolation | The subagent's tool calls and results stay in its own context. Only its final message returns to the parent. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| context window | The maximum number of tokens that one model request can hold: the input and the output of that request together. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| `continue_conversation` | An option, `True` or `False`. The new run loads the newest session in the current working directory and adds to it. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| control protocol | The request and response messages on the same pipe that carry settings, hook calls, permission checks and custom tool calls. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| control request | A message on the CLI pipe that asks your process to do something, here to run a tool. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| `ConversationResetMessage` | A notice that the conversation was replaced, for example after `/clear`. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| `create_sdk_mcp_server` | The SDK function that puts tools into an in-process server and returns its config. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| custom prompt | `{"type": "custom", "prompt": "..."}`: your own full prompt, in the form that can set `snapshot`. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| data residency multiplier | A 1.1 factor on all token prices for US-only inference. | [7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields) |
| `decision: "block"` | A top-level output that blocks the action of some events, with a `reason`. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| deny rule | An entry that blocks matching tool calls. `disallowed_tools` adds deny rules. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| `DISABLE_AUTO_COMPACT` | An environment variable that disables automatic compaction. Manual `/compact` still works. | [6.2](/notes/ai/claude-agent-sdk/06-context-window/l2-compaction-controls) |
| `DISABLE_COMPACT` | An environment variable that disables all compaction, also manual `/compact`. | [6.2](/notes/ai/claude-agent-sdk/06-context-window/l2-compaction-controls) |
| dispatcher | Your function that maps each SDK message to zero or more UI events. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| dual write | The CLI writes each batch to the local file first, then the SDK sends the same batch to the store. | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| dynamic section | A part of the preset prompt that changes per user or per machine: working directory, auto-memory, git status. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| `effort` | An option for the depth of reasoning: `low`, `medium`, `high`, `xhigh` or `max`. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| ELF loader | The program interpreter that a dynamically linked Linux binary needs, for example `/lib64/ld-linux-x86-64.so.2`. | [7.1](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors) |
| encoded cwd | The working directory with every character that is not a letter or a digit replaced by `-`. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| end of input | The moment when the SDK closes the CLI's stdin. After it, no new message can arrive. | [5.2](/notes/ai/claude-agent-sdk/05-prompts-and-input/l2-streaming-input-mode) |
| ENOENT, ENOEXEC, EACCES | "No such file or directory" (2), "Exec format error" (8), "Permission denied" (13) on Linux. | [7.1](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors) |
| entry | One line of the session file. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| `errno` | The number of an operating system error, for example 2 for ENOENT. | [7.1](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors) |
| event loop | The asyncio scheduler that runs all coroutines of your process on one thread. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| exception chaining | `raise B from A` stores the original exception `A` in `B.__cause__`. | [7.1](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors) |
| exchange | One prompt and the full answer to it, up to the `ResultMessage`. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| external server | An MCP server outside your process: a child process (`stdio`) or a remote service (`sse`, `http`). | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| file prompt | `{"type": "file", "path": "..."}`: the CLI reads the prompt from a file. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| final message | The subagent's last response, which becomes the `tool_result` of the `Agent` tool call. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| Flow 1 | The session file exists. The service resumes the session. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| Flow 2 | The session file does not exist. The service starts a new session and puts the earlier turns from its own database into the prompt. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| flush | The moment when the SDK sends the pending entries to the store. | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| flush mode | `batched` (once per turn, or when the buffer is large) or `eager` (after every frame). | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| `fork_session` | An option, used with `resume`. The new run copies the history into a new session with a new id. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| forward compatibility | Old SDK code keeps working when a newer CLI sends new types. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| `forward_subagent_text` | An option that also forwards a subagent's text and thinking blocks into the stream. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| full tool name | The name that the model and the rules use: `mcp__<server key>__<tool name>`. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| hook | A Python function that the CLI calls at a named point of the agent loop. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| hook event | The named point, for example `PreToolUse` or `Stop`. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| hook input | The dict that the callback receives: event name, session id, transcript path, and event fields. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| hook output | The dict that the callback returns. `{}` means "continue with no change". | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| `hook_callback` | The control request that the CLI sends to the SDK to run one callback. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| `HookMatcher` | A dataclass that groups callbacks with an optional matcher and a timeout. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| `hookSpecificOutput` | The part of the output with event-specific controls, such as `permissionDecision`. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| idempotency key | A value that marks an entry as already stored, so a repeated write does not duplicate it. Here, the entry `uuid`. | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| image block | A content block `{"type": "image", "source": {...}}` with base64 data. | [5.2](/notes/ai/claude-agent-sdk/05-prompts-and-input/l2-streaming-input-mode) |
| in-flight | Running now: an answer that has started and has not reached its `ResultMessage`. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| in-process server | An MCP server that runs inside your Python process. The SDK calls it an SDK server, config type `"sdk"`. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| initialize request | The first control request. It sends hooks, agent definitions and some system prompt settings to the CLI. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| input message | One dict that the SDK writes to the CLI's stdin, with `"type": "user"`. | [5.2](/notes/ai/claude-agent-sdk/05-prompts-and-input/l2-streaming-input-mode) |
| input schema | The JSON Schema that describes the arguments of a tool. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| input tokens | Everything the request sends: system prompt, tool definitions, messages, tool results. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| `input_tokens` | Input tokens that were neither written to nor read from the prompt cache. | [7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields) |
| instance | One running copy of a service. A platform can run several instances behind one address. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| interrupt | A signal that stops the current answer of a `ClaudeSDKClient`. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| `is_error` | A flag in the tool result. `True` tells the model that the call failed. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| JSONL | JSON Lines: one complete JSON object on each line of a text file. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| leaf | The newest entry of a chain. No other entry names it as its parent. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| list price | The public per-token price on the pricing page. | [7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields) |
| long-lived | Lives across many requests. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| manual compaction | Compaction that you start by sending `/compact` as a prompt. | [6.2](/notes/ai/claude-agent-sdk/06-context-window/l2-compaction-controls) |
| matcher | A string that filters which events reach the callbacks. For tool events it matches the tool name. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| materialize | Load a session from the store and write it into a temporary config directory, so that the CLI can resume it. | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| max output | The largest `max_tokens` value a model accepts: 128K on current models. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| `max_budget_usd` | An option that stops the loop when the estimated cost reaches a value in US dollars. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| `max_buffer_size` | The largest stdout line, in bytes, that the SDK accepts. The default is 1,048,576 bytes. | [7.1](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors) |
| `max_tokens` | The request field that limits the output tokens of one request. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| `max_turns` | An option that stops the loop after a number of tool-use turns. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| MCP | Model Context Protocol: an open protocol that connects an application to tools and data with JSON-RPC 2.0 messages. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| MCP server | A program or object that lists tools and runs them when a client sends `tools/call`. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| `Message` | The union of the seven classes that the SDK yields: `UserMessage`, `AssistantMessage`, `SystemMessage`, `ResultMessage`, `StreamEvent`, `RateLimitEvent`, `ConversationResetMessage`. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| `message_id` | The API id of the model response. All `AssistantMessage` objects of one response share it. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| middleware | LangChain's mechanism for code that runs around model and tool calls inside the agent graph. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| minimal prompt | The short prompt that the SDK uses when `system_prompt` is not set. It covers tool calling only. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| mirror | The copy of the transcript in the store. The local file stays the primary copy. | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| `MirrorErrorMessage` | A `SystemMessage` with subtype `mirror_error`. The SDK yields it when a batch could not be stored. | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| `model_usage` | A dict on `ResultMessage` that maps each model name to its token counts and estimated cost, for the whole tree of calls. | [7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields) |
| `ModelUsage` | One entry of `model_usage`, with camelCase keys such as `inputTokens` and `costUSD`. | [7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields) |
| native-1M model | A model that Claude Code runs with the 1M window by default, with no `[1m]` suffix. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| `os.environ` | The environment variables of the current Python process. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| output tokens | The tokens the model generates in one request, including thinking. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| `parent_tool_use_id` | The id of the `Agent` tool call that started a subagent. `None` for messages of the main agent. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| `parentUuid` | The field of an entry that names the entry before it. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| `@path` mention | Text such as `@/srv/data/plants.csv` in a prompt. The CLI reads the named file into the context. | [5.2](/notes/ai/claude-agent-sdk/05-prompts-and-input/l2-streaming-input-mode) |
| per-step usage | The `usage` of each `AssistantMessage`: one model response. | [7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields) |
| per-turn context | Data that is true for one message only, for example the page that the user has open now. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| permission layer | The checks that decide what happens when the model calls a tool: run, ask or deny. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| permission mode | The global policy for tool calls that no rule decides: `default`, `dontAsk`, `auto`, and others. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| `permissionDecision` | A `PreToolUse` output: `allow`, `deny`, `ask` or `defer`. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| `PreCompact` hook | A callback that runs before each compaction. It can archive the transcript or block the compaction. | [6.2](/notes/ai/claude-agent-sdk/06-context-window/l2-compaction-controls) |
| `ProcessError` | The CLI process ended with a non-zero exit code. | [7.1](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors) |
| project directory | The folder `projects/<encoded-cwd>/` inside the config directory. It holds the session files of one working directory. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| `project_key` | The working directory, encoded like a project directory name. | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| prompt cache | A provider-side store of an input prefix. A cached prefix is cheaper and faster to read. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| `query()` | An async function. It starts a CLI process, sends the prompt, yields the messages and ends the process. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| queued message | A user message that arrives while the CLI is still working on an earlier one. | [5.2](/notes/ai/claude-agent-sdk/05-prompts-and-input/l2-streaming-input-mode) |
| `RateLimitEvent` | A notice that the rate limit status changed. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| raw API event | One server-sent event of the Messages API, for example `content_block_delta`. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| recorded prompt | The system prompt that a session saved on its first request. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| request-scoped | Lives only for one HTTP request. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| result subtype | The `subtype` field of a `ResultMessage`. It says how the loop ended. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| `ResultError` | A subclass of `ProcessError`. The CLI reported an error result, then exited. It carries the result's fields. | [7.1](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors) |
| `ResultMessage` | The last message of one answer: the final text, the cost, the token usage, the number of turns and the session id. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| `resume` | An option with a session id. The new run loads that session and adds to it. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| `resume_session_at` | An option with a message UUID. A resume loads the conversation only up to that message. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| scoped rule | A rule with a pattern in parentheses, for example `"Bash(rm *)"`. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| `SDKSessionInfo` | The object that `get_session_info` returns: session id, summary, last change time, file size, working directory, and others. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| server compaction | An API feature that summarizes the conversation on the server and returns a compaction block. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| server key | The dict key under which you put a server in `mcp_servers`. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| session | The conversation history that the CLI collects while the agent works, saved on disk. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| session file (transcript) | The file `<session-id>.jsonl` that holds one session. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| session helpers | The SDK functions `list_sessions`, `get_session_info` and `get_session_messages`, and others. They read session files directly. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| session id | A UUID that names one session, for example `5b3f2c1a-8d4e-4f6b-9a7c-2e1d0f9b8a6c`. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| `session_id` (option) | An option that sets the id of the new session. It must be a valid UUID. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| `SessionKey` | The address of one transcript in the store: `project_key`, `session_id` and an optional `subpath`. | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| `SessionStore` | The protocol for an adapter that receives a copy of the session transcript. Two methods are required: `append` and `load`. | [4.4](/notes/ai/claude-agent-sdk/04-sessions/l4-session-store-and-mirror-errors) |
| setting source | One layer of settings files on disk: `user`, `project` or `local`. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| `setting_sources` | The list of settings files that the CLI loads: `user`, `project`, `local`. It also controls CLAUDE.md. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| shebang | The first line of a script, such as `#!/usr/bin/python3`. It names the interpreter that runs the script. | [7.1](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors) |
| sidechain | The transcript of a subagent. It lives in its own folder next to the main file. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| single message input | The docs' name for a one-shot prompt. In Python: `query(prompt="...")`. | [5.2](/notes/ai/claude-agent-sdk/05-prompts-and-input/l2-streaming-input-mode) |
| `snapshot` | A setting that decides whether a session keeps the system prompt that it recorded on its first request. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| source of truth | The one record that wins when two records disagree. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| spawn depth | How many layers of subagents can start subagents of their own. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| `stderr` callback | A Python function that receives each line of the CLI's error output. | [2.1](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) |
| stdin, stdout, stderr | The three standard text streams of a process: input, output and error output. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| sticky routing | A load balancer rule that sends all requests of one user to the same server. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| stream-json | The format on the pipe: one JSON object per line, in both directions. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| `StreamEvent` | A wrapper around one raw API stream event. It arrives only with `include_partial_messages=True`. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| streaming input mode | The docs' name for a long-lived input stream of user messages. In Python: `query()` with an async iterable, or `ClaudeSDKClient`. | [5.2](/notes/ai/claude-agent-sdk/05-prompts-and-input/l2-streaming-input-mode) |
| subagent | A separate agent instance that the main agent starts for a subtask, with its own conversation and context window. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| subagent transcript | The JSONL file of one subagent, in the folder `<session-id>/subagents/` next to the main session file. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| `subagent_type` | The input field of the `Agent` tool that names the subagent definition to use. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| subprocess | A program that another program starts and controls. Here, the CLI is a subprocess of your Python process. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| subtype | The `subtype` field of a `SystemMessage` or `ResultMessage`. It says which kind of event this is. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| system prompt | The instructions before the conversation. On the Messages API, the top-level `system` field. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| `SystemMessage` | A message from the CLI about the session. The subtype `init` starts every run. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| `SystemMessage` subclass | A typed class for some subtypes, for example `TaskStartedMessage`. It is still a `SystemMessage`. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| `TaskNotificationMessage` | A `SystemMessage` subclass that reports that a task completed, failed or was stopped. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| `TaskProgressMessage` | A `SystemMessage` subclass with periodic progress and token usage of a running task. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| `TaskStartedMessage` | A `SystemMessage` subclass that the SDK yields when a background task, such as a subagent, starts. | [8.2](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l2-subagents) |
| temporary disk (ephemeral disk) | A local disk whose files are deleted when the container stops or is replaced. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| `terminal_reason` | A field of `ResultMessage` with the exact reason for the end, for example `completed` or `api_error`. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| `@tool` | The SDK decorator that turns an async function into an `SdkMcpTool`. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| tool output clearing | The first step of compaction: Claude Code removes old tool outputs from its copy of the conversation. | [6.1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) |
| tool result | The dict that your function returns: `content` and, optionally, `is_error`. | [3.1](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) |
| `total_cost_usd` | The estimated cost of the run in US dollars, including subagents. | [7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields) |
| trailing event | A message that arrives after the `ResultMessage` of a turn. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| `transcript_path` | A field of every hook input: the path of the session file. | [6.2](/notes/ai/claude-agent-sdk/06-context-window/l2-compaction-controls) |
| transport | The SDK component that starts the subprocess and moves the JSON lines. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| turn | One round trip inside the loop: the model asks for tools, the CLI runs them, and the results return to the model. The final answer with no tool call is also counted as a turn in the docs example. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| UI event | One small message to the browser, for example a text delta or a tool status change. | [2.2](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) |
| `updatedInput` | A `PreToolUse` output that replaces the tool's input. | [8.1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) |
| `usage` | A dict on `ResultMessage` with the token counts of the main agent loop only. | [7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields) |
| `UserMessage` | Input to the model from the user side. Inside the loop it carries tool results. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| UUID | A 128-bit identifier, written as 36 characters. Two random UUIDs are equal with almost zero probability. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| `verbatim_prompts` | An option that makes the CLI deliver every prompt exactly as written. | [5.2](/notes/ai/claude-agent-sdk/05-prompts-and-input/l2-streaming-input-mode) |
| working directory (`cwd`) | The folder in which the CLI runs. It decides which project files the CLI sees and where its session file goes. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
