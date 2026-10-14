---
title: "Conversation State and Chat History"
order: 5
summary: "Where the state of a conversation lives, transient vs persistent context, and how to store chat history so that nothing is lost."
---

## Goal

Decide where each copy of a conversation lives and which copy is the source of truth. Keep what the user sees separate from what the model sees. Design, save and load chat history so that no message is lost and no turn is half saved.

This subject joins the other subjects. It uses the message formats of [LLM APIs](/notes/ai/llm-apis), the sessions of the [Claude Agent SDK](/notes/ai/claude-agent-sdk), the middleware of [LangChain](/notes/ai/langchain-langgraph) and the tables and transactions of [PostgreSQL](/notes/databases/postgres).

## Finish line

I master the subject when all 7 items are true, with no notes and no AI.

- [ ] Name the three copies of a conversation in an agent application, who writes each one, and which one is the source of truth.
- [ ] Classify ten context operations as transient or persistent, with the reason.
- [ ] Design the chats and messages tables with parts, with every column type and key justified.
- [ ] Save one turn as two rows in one transaction. Prove with a test that a crash saves nothing.
- [ ] Rebuild the model input from stored parts for two harnesses.
- [ ] Explain the risks of a chat id that any user can read, and the fix.
- [ ] Design retention: which chats move, which ones are deleted, and when.

## Folders

| Folder | Content |
|---|---|
| [00 Progress](/notes/ai/conversation-state/00-progress) | Session log, mistakes, weak areas, media queue |
| [Course plan](/notes/ai/conversation-state/course-plan) | The map of all parts and the study order |
| [Glossary](/notes/ai/conversation-state/glossary) | Every term, with a plain meaning |
| [01 Where state lives](/notes/ai/conversation-state/01-where-state-lives) | Three copies of a conversation, transient vs persistent context |
| [02 Chat history model](/notes/ai/conversation-state/02-chat-history-model) | The chats + messages model with parts, rebuilding model input |
| [03 Lifecycle](/notes/ai/conversation-state/03-lifecycle) | Ownership, retention, deletion, moving old chats |

## Sources

- LangChain context engineering (transient and persistent context): https://docs.langchain.com/oss/python/langchain/context-engineering (checked on 2026-10-12)
- Vercel chatbot message parts: https://chatbot.ai-sdk.dev/docs/migration-guides/message-parts (checked on 2026-10-12)
- AI SDK UIMessage and message persistence: https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message and https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence (checked on 2026-10-12)
- Chat persistence recipe: https://fullstackrecipes.com/recipes/ai-chat-persistence (checked on 2026-10-12)
- OWASP Top 10 for LLM Applications 2025, LLM01 (prompt injection), for the ownership lesson.
- PostgreSQL 16 documentation: routine maintenance (VACUUM) and row security policies.
- Databricks documentation: Delta `VACUUM` and Lakebase restore.
- The sources of the linked subjects.

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

All media for this subject is in `/notes/media/conversation-state/`.

| Folder | What it holds | Made by |
|---|---|---|
| `figures/` | SVG diagrams | Claude in chat. Each SVG is rendered to PNG and checked before it is saved. |
| `manim/` | Videos | Claude Code (Manim), from a prompt that Claude writes |

The [media queue](/notes/ai/conversation-state/00-progress/media-queue) tracks every file.
