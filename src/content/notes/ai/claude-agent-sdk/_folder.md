---
title: "Claude Agent SDK"
order: 3
summary: "Everything between query() and the final ResultMessage: the CLI subprocess, the agent loop, options, messages, tools, sessions, system prompts, compaction and errors."
---

## Goal

Explain and control everything that happens between a call to `query()` and the final `ResultMessage`. This includes the CLI subprocess, the agent loop, the options, the message types, custom tools, sessions, system prompts, context compaction and errors.

The SDK is a thin Python layer over a large program: the Claude Code command-line interface (CLI). Most surprises come from that program and from its files on the local disk. This subject shows where each behavior lives.

## Finish line

I master the subject when all 9 items are true, with no notes and no AI.

- [ ] Draw the architecture: my Python process, the SDK, the CLI subprocess, the model API and the session file. Name what crosses each arrow.
- [ ] Walk through one agent loop turn by turn, with the message types that the SDK yields at each step.
- [ ] Choose between query() and ClaudeSDKClient for three designs, with reasons.
- [ ] Explain what a session is on disk. Resume, continue and fork a session, and predict the session ids.
- [ ] Decide between resuming a session and rebuilding the context from my own database. Explain why CLAUDE_CONFIG_DIR must be in os.environ for the session helpers.
- [ ] Explain the four system prompt types and snapshot. Explain why dynamic data in the system prompt of a resumed session can be ignored.
- [ ] Build an in-process MCP tool and call it with the correct mcp__ name.
- [ ] Explain auto-compaction on a 1M-window model and its effect on the session file.
- [ ] Diagnose a CLINotFoundError that hides a different operating system error.

## Folders

| Folder | Content |
|---|---|
| [00 Progress](/notes/ai/claude-agent-sdk/00-progress) | Session log, mistakes, weak areas, media queue |
| [Course plan](/notes/ai/claude-agent-sdk/course-plan) | The map of all parts and the study order |
| [Glossary](/notes/ai/claude-agent-sdk/glossary) | Every term, with a plain meaning |
| [01 Foundations](/notes/ai/claude-agent-sdk/01-foundations) | What the SDK is, the agent loop, query() vs ClaudeSDKClient |
| [02 Options and messages](/notes/ai/claude-agent-sdk/02-options-and-messages) | ClaudeAgentOptions, message and block types, partial messages |
| [03 Custom tools](/notes/ai/claude-agent-sdk/03-custom-tools) | In-process MCP tools |
| [04 Sessions](/notes/ai/claude-agent-sdk/04-sessions) | Session files, resume, continue, fork, temporary disks, SessionStore |
| [05 Prompts and input](/notes/ai/claude-agent-sdk/05-prompts-and-input) | System prompt types and snapshot, streaming input mode |
| [06 Context window](/notes/ai/claude-agent-sdk/06-context-window) | Window size and auto-compaction |
| [07 Errors and cost](/notes/ai/claude-agent-sdk/07-errors-and-cost) | SDK errors, usage and cost fields |
| [08 Hooks and subagents](/notes/ai/claude-agent-sdk/08-hooks-and-subagents) | Hooks and subagents |

## Sources

- Agent SDK Python reference: https://code.claude.com/docs/en/agent-sdk/python (checked on 2026-10-12)
- The agent loop: https://code.claude.com/docs/en/agent-sdk/agent-loop (checked on 2026-10-12)
- Sessions: https://code.claude.com/docs/en/agent-sdk/sessions (checked on 2026-10-12)
- Session storage: https://code.claude.com/docs/en/agent-sdk/session-storage (checked on 2026-10-12)
- Modifying system prompts: https://code.claude.com/docs/en/agent-sdk/modifying-system-prompts (checked on 2026-10-12)
- Streaming input: https://code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode (checked on 2026-10-12)
- Context window and model configuration: https://code.claude.com/docs/en/context-window and https://code.claude.com/docs/en/model-config (checked on 2026-10-12)
- Source code: github.com/anthropics/claude-agent-sdk-python, main branch, commit b6e9d12 (2026-10-09). Package version 0.2.165, bundled CLI version 2.1.296.

## Conventions

### Color legend

Every diagram, figure and video in this subject uses these colors.

| Element | Color |
|---|---|
| System prompt and instructions | purple `#6A4C93` |
| User message | blue `#1E6091` |
| Assistant message (model output) | ink `#100D12` |
| Tool call and tool result | teal `#2A9D8F` |
| Stored state: database row, session file, checkpoint | green `#2D6A4F` |
| Model provider and API | gold `#B8860B` |
| Transient view (exists for one call only) | gray, dashed `#8A8A8A` |
| Error, data loss, bug | red `#C81D25` |

The `plot` graphs can use only the site colors: red `#C81D25`, blue `#1E6091`, gold `#B8860B`, ink `#100D12` and purple `#6A4C93`. Each graph title names its colors.

### Project stage codes

Each lesson row has a stage code. The codes come from the project plan that this study supports. They tell when the project needs the idea.

| Code | Meaning |
|---|---|
| Now | The current step of the project needs it. |
| A, B, D, E | A later, named step of the project needs it. |
| Later | The project needs it after the main steps. |
| Know only | Know what it is and why the project does not use it. No exercise. |

### Facts that change

1. Every SDK version, model name, default value and product feature has a "checked on" date. These facts change often.
2. Each lesson names its primary source: official documentation, a specification, or the source code of the library.
3. When the documentation and the source code disagree, the lesson shows both and says which one the code follows.

### Code

1. I write all the exercise code myself. The lab folder is `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, with one notebook folder for each subject.
2. Hints come in three levels, in chat only: idea, pseudocode, partial code.
3. The lessons never show a full solution to an exercise before I try it.

### Media

All media for this subject is in `/notes/media/claude-agent-sdk/`.

| Folder | What it holds | Made by |
|---|---|---|
| `figures/` | SVG diagrams | Claude in chat. Each SVG is rendered to PNG and checked before it is saved. |
| `manim/` | Videos | Claude Code (Manim), from a prompt that Claude writes |

The [media queue](/notes/ai/claude-agent-sdk/00-progress/media-queue) tracks every file.
