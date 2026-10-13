---
title: "LangChain and LangGraph"
order: 4
summary: "create_agent, middleware hooks, summarization and context editing, message removal, state, checkpointers and streaming."
---

## Goal

Explain what `create_agent` builds, where each middleware hook runs, and which hooks change the saved state. Control the context with summarization, context editing and trimming without losing stored messages. Explain checkpointers and threads.

LangChain is a second harness for the same kind of agent. Its middleware makes the difference between transient and persistent context visible in code.

## Finish line

I master the subject when all 7 items are true, with no notes and no AI.

- [ ] Draw the graph that create_agent builds, with the position of every middleware hook.
- [ ] For each of the seven hooks, say when it runs and whether its change is transient or persistent.
- [ ] Explain why SummarizationMiddleware must never decide what the application stores.
- [ ] Show that ContextEditingMiddleware changes only the model input, with a test.
- [ ] Use trim_messages, RemoveMessage and REMOVE_ALL_MESSAGES correctly, and predict the state after each one.
- [ ] Explain checkpoints, threads and the add_messages reducer. Choose a checkpointer for production.
- [ ] Stream custom progress events from a tool with get_stream_writer.

## Folders

| Folder | Content |
|---|---|
| [00 Progress](/notes/ai/langchain-langgraph/00-progress) | Session log, mistakes, weak areas |
| [Course plan](/notes/ai/langchain-langgraph/course-plan) | The map of all parts and the study order |
| [Glossary](/notes/ai/langchain-langgraph/glossary) | Every term, with a plain meaning |
| [01 Foundations](/notes/ai/langchain-langgraph/01-foundations) | LangChain messages, create_agent, ChatDatabricks |
| [02 Middleware](/notes/ai/langchain-langgraph/02-middleware) | The seven hooks and the built-in middleware |
| [03 Context management](/notes/ai/langchain-langgraph/03-context-management) | Summarization, context editing, trimming and removal |
| [04 Persistence](/notes/ai/langchain-langgraph/04-persistence) | State, reducers, checkpointers and threads |
| [05 Streaming](/notes/ai/langchain-langgraph/05-streaming) | Stream modes and get_stream_writer |
| [06 Legacy API](/notes/ai/langchain-langgraph/06-legacy-api) | create_react_agent, pre_model_hook, SummarizationNode |

## Sources

- Context engineering in agents: https://docs.langchain.com/oss/python/langchain/context-engineering (checked on 2026-10-12)
- Short-term memory: https://docs.langchain.com/oss/python/langchain/short-term-memory (checked on 2026-10-12)
- Middleware: https://docs.langchain.com/oss/python/langchain/middleware/overview and https://docs.langchain.com/oss/python/langchain/middleware/built-in (checked on 2026-10-12)
- Checkpointers: https://docs.langchain.com/oss/python/langgraph/checkpointers (checked on 2026-10-12)
- Source code: langchain 1.4.5, langchain-core 1.6.10, langgraph 1.2.14, databricks-langchain 0.21.0.

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
