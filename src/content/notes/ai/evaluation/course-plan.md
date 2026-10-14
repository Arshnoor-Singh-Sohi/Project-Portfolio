---
title: "Course plan"
order: 1
summary: "The map of all parts of Evaluating AI Systems, and the order of study."
---

## The map

```mermaid
flowchart TD
    P1[Part 1: Test design]
    P2[Part 2: Statistics]
    P1 --> P2
```

## Parts

| Part | Folder | Lessons | Pages written | Content |
|---|---|---|---|---|
| 1 | [01 Test design](/notes/ai/evaluation/01-test-design) | 3 | 3 | Fake vs real model, random data, controls, strict scoring, audits |
| 2 | [02 Statistics](/notes/ai/evaluation/02-statistics) | 2 | 2 | Pass rates, confidence intervals, power |

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
