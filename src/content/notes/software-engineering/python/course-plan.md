---
title: "Course plan"
order: 1
summary: "The map of all parts of Python for AI Services, and the order of study."
---

## The map

```mermaid
flowchart TD
    P1[Part 1: asyncio]
    P2[Part 2: Web streaming]
    P3[Part 3: Tooling]
    P1 --> P2
    P2 --> P3
```

## Parts

| Part | Folder | Lessons | Pages written | Content |
|---|---|---|---|---|
| 1 | [01 asyncio](/notes/software-engineering/python/01-asyncio) | 3 | 3 | Event loop, coroutines, async generators, sync and async bridges |
| 2 | [02 Web streaming](/notes/software-engineering/python/02-web-streaming) | 1 | 1 | FastAPI StreamingResponse and server-sent events |
| 3 | [03 Tooling](/notes/software-engineering/python/03-tooling) | 2 | 2 | uv, pyproject.toml, pytest |

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
