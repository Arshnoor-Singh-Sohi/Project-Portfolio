---
title: "Glossary"
order: 2
summary: "Every term in Claude Agent SDK, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| agent loop | The cycle that the CLI repeats: call the model, run the requested tools, add the results, call the model again. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| `append` | Extra text that goes after the preset prompt. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| `AssistantMessage` | Output of the model: text, thinking or tool calls. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| async context manager | An object that you use with `async with`. It runs setup code at the start and cleanup code at the end. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| async iterator | An object that you read with `async for`. Each step can wait for new data. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| branch | A session that starts with a copy of another session's history and then differs. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| bundled CLI | A copy of the CLI binary inside the SDK package. The SDK uses it unless you give `cli_path`. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| chain | The list of entries from the first entry to the newest entry, found by following `parentUuid` links. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| Claude Agent SDK | The Python package `claude-agent-sdk`. It starts the CLI and turns its output into Python objects. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| Claude Code CLI | The `claude` program. It runs the agent loop: model calls, tools, permissions, sessions and compaction. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| `claude_code` preset | The full Claude Code system prompt, chosen with `{"type": "preset", "preset": "claude_code"}`. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| `ClaudeSDKClient` | A class. It keeps one CLI process open and sends many prompts to it. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| CLI | Command-line interface: a program that you start with a command and arguments. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| compact summary | An entry with `isCompactSummary: true`. After compaction, it replaces the older entries in the chain. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| `compact_boundary` | A `SystemMessage` subtype. The CLI compacted the conversation at this point. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| config directory | The folder where Claude Code keeps its data: `~/.claude` by default, or the value of `CLAUDE_CONFIG_DIR`. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| `continue_conversation` | An option, `True` or `False`. The new run loads the newest session in the current working directory and adds to it. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| control protocol | The request and response messages on the same pipe that carry settings, hook calls, permission checks and custom tool calls. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| custom prompt | `{"type": "custom", "prompt": "..."}`: your own full prompt, in the form that can set `snapshot`. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| dynamic section | A part of the preset prompt that changes per user or per machine: working directory, auto-memory, git status. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| `effort` | An option for the depth of reasoning: `low`, `medium`, `high`, `xhigh` or `max`. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| encoded cwd | The working directory with every character that is not a letter or a digit replaced by `-`. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| entry | One line of the session file. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| exchange | One prompt and the full answer to it, up to the `ResultMessage`. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| file prompt | `{"type": "file", "path": "..."}`: the CLI reads the prompt from a file. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| Flow 1 | The session file exists. The service resumes the session. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| Flow 2 | The session file does not exist. The service starts a new session and puts the earlier turns from its own database into the prompt. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| `fork_session` | An option, used with `resume`. The new run copies the history into a new session with a new id. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| in-flight | Running now: an answer that has started and has not reached its `ResultMessage`. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| initialize request | The first control request. It sends hooks, agent definitions and some system prompt settings to the CLI. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| instance | One running copy of a service. A platform can run several instances behind one address. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| interrupt | A signal that stops the current answer of a `ClaudeSDKClient`. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| JSONL | JSON Lines: one complete JSON object on each line of a text file. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| leaf | The newest entry of a chain. No other entry names it as its parent. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| long-lived | Lives across many requests. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| `max_budget_usd` | An option that stops the loop when the estimated cost reaches a value in US dollars. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| `max_turns` | An option that stops the loop after a number of tool-use turns. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| minimal prompt | The short prompt that the SDK uses when `system_prompt` is not set. It covers tool calling only. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| `os.environ` | The environment variables of the current Python process. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| `parentUuid` | The field of an entry that names the entry before it. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| per-turn context | Data that is true for one message only, for example the page that the user has open now. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| project directory | The folder `projects/<encoded-cwd>/` inside the config directory. It holds the session files of one working directory. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| `query()` | An async function. It starts a CLI process, sends the prompt, yields the messages and ends the process. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| recorded prompt | The system prompt that a session saved on its first request. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| request-scoped | Lives only for one HTTP request. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| result subtype | The `subtype` field of a `ResultMessage`. It says how the loop ended. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| `ResultMessage` | The last message of one answer: the final text, the cost, the token usage, the number of turns and the session id. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| `resume` | An option with a session id. The new run loads that session and adds to it. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| `resume_session_at` | An option with a message UUID. A resume loads the conversation only up to that message. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| `SDKSessionInfo` | The object that `get_session_info` returns: session id, summary, last change time, file size, working directory, and others. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| session | The conversation history that the CLI collects while the agent works, saved on disk. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| session file (transcript) | The file `<session-id>.jsonl` that holds one session. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| session helpers | The SDK functions `list_sessions`, `get_session_info` and `get_session_messages`, and others. They read session files directly. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| session id | A UUID that names one session, for example `5b3f2c1a-8d4e-4f6b-9a7c-2e1d0f9b8a6c`. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| `session_id` (option) | An option that sets the id of the new session. It must be a valid UUID. | [4.2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) |
| `setting_sources` | The list of settings files that the CLI loads: `user`, `project`, `local`. It also controls CLAUDE.md. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| sidechain | The transcript of a subagent. It lives in its own folder next to the main file. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| `snapshot` | A setting that decides whether a session keeps the system prompt that it recorded on its first request. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| source of truth | The one record that wins when two records disagree. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| stdin, stdout, stderr | The three standard text streams of a process: input, output and error output. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| sticky routing | A load balancer rule that sends all requests of one user to the same server. | [1.3](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) |
| stream-json | The format on the pipe: one JSON object per line, in both directions. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| subprocess | A program that another program starts and controls. Here, the CLI is a subprocess of your Python process. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| system prompt | The instructions before the conversation. On the Messages API, the top-level `system` field. | [5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) |
| `SystemMessage` | A message from the CLI about the session. The subtype `init` starts every run. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| temporary disk (ephemeral disk) | A local disk whose files are deleted when the container stops or is replaced. | [4.3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) |
| `terminal_reason` | A field of `ResultMessage` with the exact reason for the end, for example `completed` or `api_error`. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| transport | The SDK component that starts the subprocess and moves the JSON lines. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
| turn | One round trip inside the loop: the model asks for tools, the CLI runs them, and the results return to the model. The final answer with no tool call is also counted as a turn in the docs example. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| `UserMessage` | Input to the model from the user side. Inside the loop it carries tool results. | [1.2](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) |
| UUID | A 128-bit identifier, written as 36 characters. Two random UUIDs are equal with almost zero probability. | [4.1](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) |
| working directory (`cwd`) | The folder in which the CLI runs. It decides which project files the CLI sees and where its session file goes. | [1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) |
