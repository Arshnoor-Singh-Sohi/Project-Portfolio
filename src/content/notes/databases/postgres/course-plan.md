---
title: "Course plan"
order: 1
summary: "The map of all parts of PostgreSQL, and the order of study."
---

## The map

```mermaid
flowchart TD
    P1[Part 1: Relational basics]
    P2[Part 2: Transactions]
    P3[Part 3: Python driver]
    P4[Part 4: Schema changes]
    P5[Part 5: Local setup]
    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
```

## Parts

| Part | Folder | Lessons | Pages written | Content |
|---|---|---|---|---|
| 1 | [01 Relational basics](/notes/databases/postgres/01-relational-basics) | 3 | 3 | Tables, keys, constraints, column types, indexes |
| 2 | [02 Transactions](/notes/databases/postgres/02-transactions) | 2 | 1 | Atomic writes, isolation, upserts |
| 3 | [03 Python driver](/notes/databases/postgres/03-python-driver) | 2 | 0 | psycopg 3 and connection pools |
| 4 | [04 Schema changes](/notes/databases/postgres/04-schema-changes) | 2 | 0 | ALTER TABLE and migrations |
| 5 | [05 Local setup](/notes/databases/postgres/05-local-setup) | 1 | 0 | A local PostgreSQL server |

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
