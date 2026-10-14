---
title: "Course plan"
order: 1
summary: "The map of all parts of LangChain and LangGraph, and the order of study."
---

## The map

```mermaid
flowchart TD
    P1[Part 1: Foundations]
    P2[Part 2: Middleware]
    P3[Part 3: Context management]
    P4[Part 4: Persistence]
    P5[Part 5: Streaming]
    P6[Part 6: Legacy API]
    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
    P5 --> P6
```

## Parts

| Part | Folder | Lessons | Pages written | Content |
|---|---|---|---|---|
| 1 | [01 Foundations](/notes/ai/langchain-langgraph/01-foundations) | 3 | 3 | LangChain messages, create_agent, ChatDatabricks |
| 2 | [02 Middleware](/notes/ai/langchain-langgraph/02-middleware) | 2 | 2 | The seven hooks and the built-in middleware |
| 3 | [03 Context management](/notes/ai/langchain-langgraph/03-context-management) | 3 | 3 | Summarization, context editing, trimming and removal |
| 4 | [04 Persistence](/notes/ai/langchain-langgraph/04-persistence) | 2 | 2 | State, reducers, checkpointers and threads |
| 5 | [05 Streaming](/notes/ai/langchain-langgraph/05-streaming) | 1 | 1 | Stream modes and get_stream_writer |
| 6 | [06 Legacy API](/notes/ai/langchain-langgraph/06-legacy-api) | 1 | 1 | create_react_agent, pre_model_hook, SummarizationNode |

A **lesson** is one idea. A **session** is one sitting. A lesson page can exist before I study it. Its status stays `not-started` until I pass its gate.

## How each session works

1. **Recall.** One or two questions on old lessons that are due.
2. **Problem.** The question that the idea answers, and why it matters in a real agent.
3. **Intuition.** A picture or an analogy, and the point where the analogy stops working.
4. **Visual.** A diagram, a figure or a Manim video.
5. **Mechanism.** The exact technical details. Every claim has a source.
6. **Experiment.** A small test that proves the claim: a fake model, a local file, a local database.
7. **Code.** I write the code myself. Hints come in three levels: idea, pseudocode, partial code.
8. **Check and explain back.** Check questions, then I teach the idea back.
9. **Close.** Session report in chat, then a notes update.

> [!key] Gate rule
> A gate passes only when I answer the check questions correctly in my own words. "I understand" does not pass a gate. A correct answer with a wrong reason does not pass.
