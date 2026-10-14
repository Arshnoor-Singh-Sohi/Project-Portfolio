---
title: "Session log"
order: 1
summary: "What happened in each session, newest first."
status: in-progress
---

## Notes update: 2026-10-14

**Topic:** new part 6, "Indexes and query plans". No study session happened.

- New lessons: 6.1 B-tree indexes, 6.2 Multicolumn indexes, 6.3 Index scan vs sequential scan, 6.4 EXPLAIN and EXPLAIN ANALYZE, 6.5 Foreign keys and ON DELETE CASCADE. Each one has the status `not-started`.
- Every example ran on PostgreSQL 16.15 and 18.6 with the example chat store. The part page holds the seed script, so my numbers can match the lessons.
- New videos: M03 to M07. Their prompts are in `Claude outputs/postgres-indexes-manim-prompts.md`.

### Findings to remember

- Lesson 6.1: with the libc `C.UTF-8` locale, the default index did not serve `LIKE 'user-004%'`. It needs `text_pattern_ops` or `COLLATE "C"`.
- Lesson 6.1: an index that grew by random inserts had 6,960 pages. A fresh build of the same keys had 5,208.
- Lesson 6.2: PostgreSQL 18 skip scan read 26 pages where PostgreSQL 16 read 3,819. On 16 and 17, writing the known values as an `IN` list gets most of that gain.
- Lesson 6.3: 5% of the rows, placed at random, lie on 89.5% of the heap pages. An index wins when the matching rows lie on few pages, not when they are few rows.
- Lesson 6.4: `EXPLAIN ANALYZE` runs the statement. Wrap `INSERT`, `UPDATE` and `DELETE` in `BEGIN` ... `ROLLBACK`. A rollback does not return sequence values.
- Lesson 6.5: deleting 20 chats spent 2,706 ms in the cascade trigger without an index on `messages.chat_id`, and 1.1 ms with it. The `Buffers` lines of the plan do not include trigger work.
- Lesson 6.5: a `RESTRICT` violation has SQLSTATE `23503` on 16.15 and `23001` on 18.6.
- Lesson 1.3 was corrected: for "the messages of one chat in order" without `LIMIT`, PostgreSQL 16 and 18 chose a Bitmap Index Scan on `(chat_id, seq)` plus a small Sort, not an Index Scan.

## Notes update: 2026-10-13

**Topic:** the remaining lessons of this subject are written. No study session happened.

- New lessons: 2.2, 3.1, 3.2, 4.1, 4.2 and 5.1. Each one has the status `not-started`.
- Each lesson marks a fact that it could not confirm as "not confirmed" or "not documented".
- The SQL and Python examples ran in a sandbox where that was possible. A lesson labels each example that did not run.
- New video: M02. The [media queue](/notes/databases/postgres/00-progress/media-queue) gives the status.

### Findings to remember

- Lesson 4.2: two migration runners started at once. A waiting `pg_advisory_lock` deadlocked with `CREATE INDEX CONCURRENTLY` in the other runner. A `pg_try_advisory_lock` loop fixed it.
- Lesson 3.2: the pool replaces a connection past its `max_lifetime` only when the connection returns to the pool or is checked. An idle connection stays.
- Lesson 5.1: the Docker commands did not run in the sandbox. They are labeled "not run here".

## Session 0: 2026-10-12

**Topic:** subject setup.

### Decisions

| Question | My choice |
|---|---|
| Which folder layout should I build? | "Domain roots (Recommended)" |
| How should I build the lessons? | "Priority path first (Recommended)" |

- This subject is one of nine subjects that came from one study list for an agent project. The list has ten sections. Section 1 (the project files) is not taught here. The notes teach the ideas only.
- Every row of the list has a lesson in this subject or in a linked subject. The stage code of each row is in the part tables.
- The priority path is in the [AI area page](/notes/ai).

### Open

- The lab folder `C:\Users\ASohi\Downloads\AI\agent-harness-lab` does not exist yet.
