---
title: "PostgreSQL"
order: 1
summary: "Tables, keys, column types, indexes, transactions, the psycopg 3 driver, connection pools and safe schema changes."
---

## Goal

Design, create, query and change PostgreSQL tables from Python, safely. Choose keys and column types with reasons. Group writes into transactions. Use the psycopg 3 driver and a connection pool. Change a live schema without downtime.

## Finish line

I master the subject when all 8 items are true, with no notes and no AI.

- [ ] Write CREATE TABLE statements for two related tables with primary keys, a foreign key, NOT NULL, DEFAULT and CHECK constraints. Justify each one.
- [ ] Choose between identity, bigserial and uuid keys, between json and jsonb, and between timestamp and timestamptz, with reasons.
- [ ] Design an index for a given query and prove with EXPLAIN that the database uses it.
- [ ] Explain atomicity with a failing two-row write. Show the state after COMMIT and after ROLLBACK.
- [ ] Write an idempotent insert with ON CONFLICT.
- [ ] Use psycopg 3 with parameters, a transaction block and a connection pool. Explain why string formatting of SQL is wrong.
- [ ] Add a column to a large table without a table rewrite, and explain the lock.
- [ ] Run a local PostgreSQL 16 server and run my table tests against it.

## Folders

| Folder | Content |
|---|---|
| [00 Progress](/notes/databases/postgres/00-progress) | Session log, mistakes, weak areas, media queue |
| [Course plan](/notes/databases/postgres/course-plan) | The map of all parts and the study order |
| [Glossary](/notes/databases/postgres/glossary) | Every term, with a plain meaning |
| [01 Relational basics](/notes/databases/postgres/01-relational-basics) | Tables, keys, constraints, column types, indexes |
| [02 Transactions](/notes/databases/postgres/02-transactions) | Atomic writes, isolation, upserts |
| [03 Python driver](/notes/databases/postgres/03-python-driver) | psycopg 3 and connection pools |
| [04 Schema changes](/notes/databases/postgres/04-schema-changes) | ALTER TABLE and migrations |
| [05 Local setup](/notes/databases/postgres/05-local-setup) | A local PostgreSQL server |

## Sources

- PostgreSQL 16 documentation: https://www.postgresql.org/docs/16/ (checked on 2026-10-12)
- psycopg 3 documentation: https://www.psycopg.org/psycopg3/docs/ (checked on 2026-10-12)
- Every SQL example in these notes was run on PostgreSQL 16 before it was saved.

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

All media for this subject is in `/notes/media/postgres/`.

| Folder | What it holds | Made by |
|---|---|---|
| `figures/` | SVG diagrams | Claude in chat. Each SVG is rendered to PNG and checked before it is saved. |
| `manim/` | Videos | Claude Code (Manim), from a prompt that Claude writes |

The [media queue](/notes/databases/postgres/00-progress/media-queue) tracks every file.
