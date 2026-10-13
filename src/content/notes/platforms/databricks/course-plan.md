---
title: "Course plan"
order: 1
summary: "The map of all parts of Databricks Platform, and the order of study."
---

## The map

```mermaid
flowchart TD
    P1[Part 1: Apps]
    P2[Part 2: Identity and auth]
    P3[Part 3: SQL and Delta]
    P4[Part 4: MCP and Genie]
    P5[Part 5: Lakebase]
    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
```

## Parts

| Part | Folder | Lessons | Pages written | Content |
|---|---|---|---|---|
| 1 | [01 Apps](/notes/platforms/databricks/01-apps) | 3 | 0 | Databricks Apps, resources, secrets, instances |
| 2 | [02 Identity and auth](/notes/platforms/databricks/02-identity-and-auth) | 3 | 0 | CLI profiles, service credentials, user identity |
| 3 | [03 SQL and Delta](/notes/platforms/databricks/03-sql-and-delta) | 1 | 0 | Statement Execution API and Delta tables |
| 4 | [04 MCP and Genie](/notes/platforms/databricks/04-mcp-and-genie) | 2 | 0 | Databricks MCP servers, DatabricksMCPClient, Genie One |
| 5 | [05 Lakebase](/notes/platforms/databricks/05-lakebase) | 4 | 0 | Lakebase projects, App resources, LakebasePool, Lakebase vs Delta |

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
