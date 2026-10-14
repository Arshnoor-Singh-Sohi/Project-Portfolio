---
title: "06 Indexes and query plans"
order: 16
summary: "How PostgreSQL finds rows: the B-tree page by page, column order in multicolumn indexes, index scans against sequential scans, reading EXPLAIN ANALYZE, and why the referencing columns of a foreign key need an index."
---

This part opens the indexes of [lesson 1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) and goes to production depth. Study the lessons in order. Each one builds on the one before it.

| Code | Lesson | Core idea | Stage | Status |
|---|---|---|---|---|
| L1 | [B-tree indexes](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) | A tree of 8 kB pages. 3 index pages and 1 heap page find one row among 1,049,965. | Now | not started |
| L2 | [Multicolumn indexes](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) | One list, sorted by the first column, then by the second. Equality first, then the range or the sort column. | Now | not started |
| L3 | [Index scan vs sequential scan](/notes/databases/postgres/06-indexes-and-query-plans/l3-index-scan-vs-sequential-scan) | The planner compares estimated costs. Few pages, not few rows, make an index win. | Now | not started |
| L4 | [EXPLAIN and EXPLAIN ANALYZE](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) | Read the plan tree from the inside out. Actual time and rows are per loop. ANALYZE runs the statement. | Now | not started |
| L5 | [Foreign keys and ON DELETE CASCADE](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) | Each deleted parent row runs one query on the child table. Index the referencing columns. | Now | not started |

## Versions

Every example ran on two servers: PostgreSQL 16.15 and PostgreSQL 18.6. The current manual is version 18 (checked on 2026-10-14). Managed services run 16, 17 or 18, so each lesson marks the version differences. The main ones are the B-tree skip scan (18), the `Index Searches` line and automatic `BUFFERS` in `EXPLAIN ANALYZE` (18), faster `IN` lists in B-trees (17), and the `SERIALIZE` and `MEMORY` options of `EXPLAIN` (17).

## The example chat store

All five lessons use the same data: a small chat store with three two-column B-tree indexes.

| Table | Rows | Index | Main query |
|---|---|---|---|
| `chats` | 50,000 (2,000 owners, 25 chats each) | `chats_owner_updated_idx (owner_id, updated_at DESC)` | The newest chats of one user |
| `messages` | 1,049,965 | `messages_chat_seq_key UNIQUE (chat_id, seq)` | The messages of one chat in order. It also serves the foreign key `chat_id`. |
| `message_feedback` | 50,985 | `message_feedback_message_created_idx (message_id, created_at)` | The feedback on one message. It also serves the foreign key `message_id`. |

The script below creates it. It is deterministic: every run creates the same rows, so your page counts can match the lessons. It takes about 35 seconds. The size of `messages` with its indexes is about 280 MB. Run it in an empty database, for example `createdb pgidx`, then `psql -d pgidx -f seed.sql`.

```sql
-- Shared example for the "Indexes and query plans" lessons.
-- A small chat store: chats, messages, message_feedback.
-- Three two-column B-tree indexes:
--   chats_owner_updated_idx               (owner_id, updated_at DESC)
--   messages_chat_seq_key   (unique)      (chat_id, seq)
--   message_feedback_message_created_idx  (message_id, created_at)
-- Deterministic: same rows on every run (ids from md5, values from arithmetic).
-- Scale: 50,000 chats, 2,000 owners (25 chats each), 1,049,965 messages, 50,985 feedback rows.
-- Load time on the sandbox PG16: about 35 s. Size of messages with its indexes: about 280 MB.

DROP TABLE IF EXISTS message_feedback, messages, chats CASCADE;

CREATE TABLE chats (
    id          uuid PRIMARY KEY,
    owner_id    text NOT NULL,
    title       text NOT NULL DEFAULT 'New chat',
    last_seq    integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL,
    updated_at  timestamptz NOT NULL
);
CREATE INDEX chats_owner_updated_idx ON chats (owner_id, updated_at DESC);

CREATE TABLE messages (
    id          uuid PRIMARY KEY,
    chat_id     uuid NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    seq         integer NOT NULL,
    role        text NOT NULL CHECK (role IN ('user', 'assistant')),
    parts       jsonb NOT NULL,
    created_at  timestamptz NOT NULL,
    CONSTRAINT messages_chat_seq_key UNIQUE (chat_id, seq)
);

CREATE TABLE message_feedback (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id  uuid NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    rating      smallint NOT NULL CHECK (rating IN (-1, 1)),
    created_at  timestamptz NOT NULL
);
CREATE INDEX message_feedback_message_created_idx ON message_feedback (message_id, created_at);

-- 50,000 chats. Owner of chat i: user-0001 .. user-2000 (25 chats each).
INSERT INTO chats (id, owner_id, title, last_seq, created_at, updated_at)
SELECT md5('chat' || i)::uuid,
       'user-' || lpad((1 + (i * 7919) % 2000)::text, 4, '0'),
       'Chat ' || i,
       2 + (i % 39),
       timestamptz '2026-01-01 00:00+00' + make_interval(mins => (i * 9973) % 400000),
       timestamptz '2026-01-01 00:00+00' + make_interval(mins => (i * 9973) % 400000 + 2 + (i % 39))
FROM generate_series(1, 50000) AS i;

-- Messages: chat i has 2 + (i % 39) messages (2 to 40) -> 1,049,965 rows.
INSERT INTO messages (id, chat_id, seq, role, parts, created_at)
SELECT md5('msg' || c.i || '-' || s)::uuid,
       md5('chat' || c.i)::uuid,
       s,
       CASE WHEN s % 2 = 1 THEN 'user' ELSE 'assistant' END,
       jsonb_build_array(jsonb_build_object('type', 'text',
           'text', 'Downtime report for line ' || (s % 12) || ': ' || md5(c.i || ':' || s))),
       timestamptz '2026-01-01 00:00+00' + make_interval(mins => (c.i * 9973) % 400000 + s)
FROM generate_series(1, 50000) AS c(i)
CROSS JOIN LATERAL generate_series(1, 2 + (c.i % 39)) AS s;

-- Feedback on about 10% of assistant messages (50,985 rows).
INSERT INTO message_feedback (message_id, rating, created_at)
SELECT m.id, CASE WHEN (hashtext(m.id::text) % 3) = 0 THEN -1 ELSE 1 END, m.created_at + interval '1 minute'
FROM messages m
WHERE m.role = 'assistant' AND abs(hashtext(m.id::text)) % 10 = 0;

VACUUM ANALYZE chats, messages, message_feedback;
```

The script creates the indexes before it loads the rows. So the indexes grow by inserts, and they are larger than a fresh build ([L1, section 4.6](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes)).

## Media

The five videos of this part (M03 to M07 in the [media queue](/notes/databases/postgres/00-progress/media-queue)) have their Claude Code prompts in the repository file `Claude outputs/postgres-indexes-manim-prompts.md`. To make them, paste one line into Claude Code: `Read "Claude outputs/postgres-indexes-manim-prompts.md" and follow its run rules.`
