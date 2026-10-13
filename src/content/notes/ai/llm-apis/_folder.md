---
title: "LLM APIs and Message Formats"
order: 2
summary: "The raw requests and responses of model APIs: content blocks, roles, tool calls, streaming events, thinking, the OpenAI shape and providers."
---

## Goal

Read and write the raw requests and responses of the Anthropic Messages API and the OpenAI Chat Completions API. This includes tool calls, streaming events and thinking blocks. Convert a conversation from one format to the other without loss.

Every agent framework sends these requests for you. When a framework fails, the raw request is the only thing that tells the truth. So this subject comes first.

## Finish line

I master the subject when all 7 items are true, with no notes and no AI.

- [ ] Write a Messages API request by hand with a system prompt, three turns and an image block. Name every field of the response.
- [ ] Explain the tool_use and tool_result pairing rules. Find the error in five broken message lists.
- [ ] Draw the stream event sequence for a reply with one thinking block, one text block and one tool call.
- [ ] Explain thinking signatures and why thinking blocks must be sent again unchanged.
- [ ] Convert a conversation with tool calls between the Anthropic shape and the OpenAI shape, in code, both ways.
- [ ] Explain the rule: the API sets the format, not the model. Give an example with one model and two formats.
- [ ] Call Claude through Microsoft Foundry with a key and with an Entra ID token. Explain the token scope.

## Folders

| Folder | Content |
|---|---|
| [00 Progress](/notes/ai/llm-apis/00-progress) | Session log, mistakes, weak areas, media queue |
| [Course plan](/notes/ai/llm-apis/course-plan) | The map of all parts and the study order |
| [Glossary](/notes/ai/llm-apis/glossary) | Every term, with a plain meaning |
| [01 Messages API](/notes/ai/llm-apis/01-messages-api) | Request and response, content blocks, roles, tool_use and tool_result |
| [02 Streaming and thinking](/notes/ai/llm-apis/02-streaming-and-thinking) | Server-sent events, deltas, thinking blocks and signatures |
| [03 OpenAI format](/notes/ai/llm-apis/03-openai-format) | The OpenAI chat shape and conversion |
| [04 Providers and caching](/notes/ai/llm-apis/04-providers-and-caching) | Claude on Microsoft Foundry, prompt caching in agent loops |

## Sources

- Anthropic Messages API reference: https://platform.claude.com/docs/en/api/messages/create (checked on 2026-10-12)
- Anthropic tool use: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview and https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls (checked on 2026-10-12)
- Anthropic streaming: https://platform.claude.com/docs/en/build-with-claude/streaming (checked on 2026-10-12)
- Anthropic thinking: https://platform.claude.com/docs/en/build-with-claude/thinking (checked on 2026-10-12)
- OpenAI Chat Completions reference: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create (checked on 2026-10-12)
- Claude in Microsoft Foundry: https://platform.claude.com/docs/en/build-with-claude/claude-in-microsoft-foundry (checked on 2026-10-12)
- The official SDK type files: github.com/anthropics/anthropic-sdk-python (src/anthropic/types) and github.com/openai/openai-python (src/openai/types/chat).

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

All media for this subject is in `/notes/media/llm-apis/`.

| Folder | What it holds | Made by |
|---|---|---|
| `figures/` | SVG diagrams | Claude in chat. Each SVG is rendered to PNG and checked before it is saved. |
| `manim/` | Videos | Claude Code (Manim), from a prompt that Claude writes |

The [media queue](/notes/ai/llm-apis/00-progress/media-queue) tracks every file.
