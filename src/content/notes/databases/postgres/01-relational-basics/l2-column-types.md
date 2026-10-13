---
title: "L2: Column types"
order: 2
summary: "How to choose column types with reasons: identity, bigserial or uuid keys, text, numeric, timestamptz and jsonb. What jsonb does to keys and order, the JSON operators, and why timestamptz stores one instant. Every result ran on PostgreSQL 16."
status: not-started
tags: [postgres, data-types, uuid, identity, jsonb, timestamptz]
---

## 1. The question this idea answers

Every column needs a type. The type decides what values the database accepts, how much space they use, how they sort and compare, and which operators work on them. A wrong type causes quiet bugs: times that shift by hours, money that is off by a fraction, JSON that loses a key.

A chat store needs exactly the hard types: keys that can be made by any server, time stamps that mean one instant, and flexible content (the parts of a message) that still allows queries. This lesson covers those types. Every result below ran on PostgreSQL 16.15.

## 2. Mental model

> [!analogy] Shaped slots in a sorting machine
> Each column is a slot with a shape. A date slot accepts only dates. A uuid slot accepts only 128-bit ids in the right format. The machine refuses a value that does not fit, at the door, before it is stored.
>
> **Where it stops working:** some slots change what you put in. A `jsonb` slot keeps the meaning of a JSON object but not its exact text: it drops spaces, puts the keys in its own order and keeps only the last copy of a repeated key. A `timestamptz` slot keeps the instant but not the time zone that you typed.

## 3. Terms

| Term | Plain meaning |
|---|---|
| data type | The kind of value that a column holds. It sets the valid values and the operators. |
| identity column | An integer column that the database fills from a sequence: 1, 2, 3, and so on. |
| sequence | A database object that gives out increasing numbers. |
| `bigserial` | An older shortcut that makes a `bigint` column with a sequence default. |
| UUID | A 128-bit identifier, written as 36 characters. |
| UUID version 4 | A random UUID. `gen_random_uuid()` makes one. |
| UUID version 7 | A UUID that starts with a time stamp, so new ids sort after old ids. |
| `text` | A string of any length. |
| `numeric` | An exact decimal number. |
| `timestamptz` | `timestamp with time zone`: one instant in time, stored as UTC. |
| `timestamp` | `timestamp without time zone`: a date and a clock time with no time zone. |
| `jsonb` | JSON stored in a parsed binary form. It supports indexes and containment. |
| `json` | JSON stored as the exact input text. |
| containment | The test `a @> b`: does the JSON value `a` contain the JSON value `b`? |
| GIN index | Generalized inverted index: an index type for values with many parts, such as `jsonb`. |

## 4. Method and math

### 4.1 Keys: identity, bigserial or uuid

| Type | How the value is made | Size | Sorts by creation time? | Can a client make it? |
|---|---|---|---|---|
| `bigint GENERATED ALWAYS AS IDENTITY` | The database, from a sequence | 8 bytes | Yes, roughly (gaps are possible) | No |
| `bigserial` | The database, from a sequence | 8 bytes | Yes, roughly | No |
| `uuid DEFAULT gen_random_uuid()` (version 4) | The database or any client, at random | 16 bytes | No | Yes |
| `uuid` version 7 | Any client. Native `uuidv7()` only in PostgreSQL 18 and later. | 16 bytes | Yes | Yes |

The sizes come from `pg_column_size` in the test run: 16 bytes for a uuid and 8 bytes for a bigint.

**Identity vs bigserial.** The PostgreSQL 16 docs describe the serial types as "not true types, but merely a notational convenience for creating unique identifier columns", and they name "the SQL-standard identity column feature" as another way. The docs do not say which one to prefer. The PostgreSQL community wiki does: "For new applications, identity columns should be used instead." Its reason: serial has "weird behaviors that make schema, dependency, and permission management unnecessarily cumbersome." Use identity for new tables.

**Integer vs uuid.** The PostgreSQL docs say about `gen_random_uuid()`: "This function returns a version 4 (random) UUID." It is built in since PostgreSQL 13.

| Choose a uuid when | Choose an integer identity when |
|---|---|
| A client or another service must create the id before the row exists. For example, the browser makes a message id, or the chat id is also the agent session id ([sessions L2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork)). | Only the database creates rows. |
| The id appears in URLs, and nobody should guess the next one. | Small size and readability matter more. |
| Rows from several databases must merge without clashes. | The id must show insert order. |

> [!trap] A random uuid does not give order
> Version 4 uuids are random, so `ORDER BY id` gives a random order. A table whose rows need an order, such as chat messages, needs a separate order column: an identity number, a sequence number inside the parent, or a time stamp. Version 7 uuids do sort by time, but two ids made in the same millisecond on two servers have no defined order.

### 4.2 Text and numbers

| Need | Type | Reason |
|---|---|---|
| Any string | `text` | No length limit to guess. Add a `CHECK (length(x) <= n)` if you need a limit. |
| A string with a hard maximum | `varchar(n)` | A longer value fails: `ERROR: value too long for type character varying(5)` |
| Whole numbers | `integer` (4 bytes) or `bigint` (8 bytes) | Use `bigint` for counters that can grow large. |
| Money and exact decimals | `numeric` | Exact. In the test, `0.1::numeric + 0.2::numeric` gave `0.3`. |
| Measurements where tiny errors are fine | `double precision` | Fast, but `0.1 + 0.2` gave `0.30000000000000004`. |
| Yes or no | `boolean` | |

### 4.3 Time: timestamptz, not timestamp

The PostgreSQL 16 docs explain `timestamptz` like this (§8.5):

> "If no time zone is stated in the input string, then it is assumed to be in the time zone indicated by the system's TimeZone parameter, and is converted to UTC using the offset for the timezone zone."
>
> "In either case, the value is stored internally as UTC, and the originally stated or assumed time zone is not retained."
>
> "When a timestamp with time zone value is output, it is always converted from UTC to the current timezone zone, and displayed as local time in that zone."

For plain `timestamp`, "PostgreSQL will silently ignore any time zone indication."

> [!example] Worked example: one row, read in three time zones
> The session time zone is `America/Toronto`. The test inserts `'2026-10-12 09:00'` into a `timestamp` column and a `timestamptz` column. Toronto is at UTC−4 on that date, so the instant is 13:00 UTC.
>
> | Session time zone when reading | `timestamp` shows | `timestamptz` shows |
> |---|---|---|
> | America/Toronto | 2026-10-12 09:00:00 | 2026-10-12 09:00:00-04 |
> | Asia/Kolkata (UTC+5:30) | 2026-10-12 09:00:00 | 2026-10-12 18:30:00+05:30 |
> | UTC | 2026-10-12 09:00:00 | 2026-10-12 13:00:00+00 |
>
> The `timestamptz` value is one instant, shown in the reader's zone: 13:00 + 5:30 = 18:30 in Kolkata. The `timestamp` value shows "09:00" everywhere, and nobody can tell which 09:00 it was.

> [!key] Store instants as timestamptz
> Use `timestamptz` for every "when did this happen" column: created, updated, sent. The community wiki says: "Don't use timestamp (without time zone) to store UTC times". Use plain `date` for calendar dates with no time, such as a ship date.

### 4.4 JSON: jsonb, not json

The docs compare the two types (§8.14):

> "The `json` data type stores an exact copy of the input text, which processing functions must reparse on each execution; while `jsonb` data is stored in a decomposed binary format that makes it slightly slower to input due to added conversion overhead, but significantly faster to process"
>
> "`jsonb` does not preserve white space, does not preserve the order of object keys, and does not keep duplicate object keys."
>
> "In general, most applications should prefer to store JSON data as `jsonb`, unless there are quite specialized needs, such as legacy assumptions about ordering of object keys."

The test shows the difference on one input with a repeated key:

| Input | As `json` | As `jsonb` |
|---|---|---|
| `{"b": 2, "a": 1, "a": 3}` | `{"b": 2, "a": 1, "a": 3}` | `{"a": 3, "b": 2}` |

`jsonb` put the keys in its own order and kept only the last `"a"`. Its order is not alphabetical: a second test turned `{"bb": 1, "a": 2, "c": 3}` into `{"a": 2, "c": 3, "bb": 1}`. Shorter keys come first, then keys of equal length in byte order. This is an internal detail. Do not depend on it.

> [!trap] jsonb keeps array order, not key order
> `jsonb` changes the order of the keys of an **object**. It keeps the order of the elements of an **array**. So store an ordered list, such as the parts of a message, as a JSON array: `[{"type": "text", ...}, {"type": "tool_use", ...}]`. Never depend on the key order inside one object.

### 4.5 JSON operators

| Operator | Meaning | Test input | Result |
|---|---|---|---|
| `->` | Get a field as `jsonb` | `part -> 'input'` | `{"date": "2026-10-11"}` (type `jsonb`) |
| `->>` | Get a field as `text` | `part ->> 'name'` | `count_orders` (type `text`) |
| `#>>` | Get a value at a path as `text` | `part #>> '{input,date}'` | `2026-10-11` |
| `@>` | Contains | `parts @> '[{"type":"tool_use"}]'` | `t` when any element of the array has `"type": "tool_use"` |

The docs: "Testing *containment* is an important capability of `jsonb`. There is no parallel set of facilities for the `json` type."

A GIN index makes containment fast on a large table. The docs: "The default GIN operator class for `jsonb` supports queries with the key-exists operators `?`, `?|` and `?&`, the containment operator `@>`, and the `jsonpath` match operators `@?` and `@@`."

```sql
CREATE INDEX messages_parts_gin ON messages USING GIN (parts);
-- now fast: all messages that contain a tool call
SELECT id FROM messages WHERE parts @> '[{"type": "tool_use"}]';
```

### 4.6 jsonb column or separate columns?

| Put it in a regular column when | Put it in `jsonb` when |
|---|---|
| Every row has it, and you filter, join or sort on it often: ids, owner, role, created time | The shape varies between rows, for example message parts of different types |
| The database must enforce it with `NOT NULL`, `CHECK` or a foreign key | New fields appear often, and a schema change for each one is too slow |
| It is a number that you add or compare | You store it mostly to read it back whole |

A common design mixes both: fixed columns for the fields that every row has, and one `jsonb` column for the varying content. [Conversation State 2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) uses this design for chat messages.

### 4.7 Production view

| Concern | What the types decide |
|---|---|
| Correctness | `timestamptz` keeps one instant. `numeric` keeps money exact. `jsonb` drops repeated keys and changes key order, which is usually fine for data. |
| Distributed writes | uuids let a client or a second service create ids with no round trip to the database. |
| Order | Random uuids do not sort by time. Add an order column. |
| Size | A uuid is twice the size of a bigint, in the table and in every index that holds it. |
| Queries | `jsonb` supports `@>` and GIN indexes. `json` does not. |

## 5. Code

These exercises use your local PostgreSQL 16 server. Put the SQL in `postgres/02-types.sql`.

**Exercise 2.1: the time zone test.** Repeat the worked example of section 4.3 with your own city and one other city. Predict the three displayed values of the `timestamptz` column before you run the query.

Acceptance test: your predictions match the output. Write the arithmetic for each one.

**Exercise 2.2: jsonb rules.** Insert `{"z": 1, "y": [3, 1, 2], "z": 9}` into a `json` column and a `jsonb` column. Predict both outputs first.

Acceptance tests:

- The `jsonb` output has one key `z` with value 9, and the key `y` before `z`.
- The array keeps the order `[3, 1, 2]` in both columns.

**Exercise 2.3: query message parts.** Create a table with a `jsonb` column `parts`. Insert three rows: one with only a text part, one with a text part and a `tool_use` part, one with two `tool_use` parts. Write one query with `@>` that returns the rows with a `tool_use` part, and one query with `->>` that returns the tool names.

Acceptance test: the first query returns two rows. Add a GIN index and run `EXPLAIN` on the first query. (With three rows, the planner will still scan the table. Record why. [L3](/notes/databases/postgres/01-relational-basics/l3-indexes) explains it.)

## 6. Common mistakes

1. **`timestamp` for event times.** The time zone is lost. Use `timestamptz`.
2. **`ORDER BY` a random uuid to get insert order.** Version 4 uuids are random.
3. **`json` instead of `jsonb`.** No containment, no GIN index, and a reparse on every query.
4. **Depending on key order in a jsonb object.** `jsonb` uses its own key order. Use an array for ordered data.
5. **`double precision` for money.** Use `numeric`.
6. **`bigserial` in a new table.** Use an identity column.

## 7. One-minute explanation

The type of a column decides what it accepts and how it behaves. For keys, use an identity column when only the database makes rows, and a uuid when a client or another service must make the id first. Random uuids do not sort by time, so ordered rows need a separate order column. Use `text` for strings and `numeric` for money. Use `timestamptz` for every event time: it stores one instant in UTC and shows it in the reader's time zone, while plain `timestamp` keeps only a clock time. Use `jsonb` for flexible content: it drops white space, changes the order of object keys and keeps the last copy of a repeated key, but it keeps array order, and it supports the `@>` containment test and GIN indexes.

## 8. Check questions

```check
{
  "question": "A server in Toronto (UTC-4) writes 2026-10-12 21:00 into a timestamptz column. A user reads it with the session time zone set to UTC. What does the user see? What would a timestamp column show?",
  "answer": "21:00 at UTC-4 is 01:00 UTC on the next day, so the timestamptz column shows 2026-10-13 01:00:00+00. A timestamp column would show 2026-10-12 21:00:00, with no way to know the zone."
}
```

```check
{
  "question": "A message's parts are stored as a jsonb object {\"0\": {...}, \"1\": {...}, \"10\": {...}, \"2\": {...}}. Why is this a bad design, and what is better?",
  "answer": "jsonb does not keep the key order of an object. It stores keys in its own internal order, so the application must parse the keys as numbers and sort them to rebuild the order. A plain string sort would even put \"10\" before \"2\". Store the parts as a jsonb array, which keeps element order."
}
```

```check
{
  "question": "The browser creates a message id before it sends the message, so that a retry does not create a duplicate. Which key type fits, and why?",
  "answer": "A uuid. A client can create it with no round trip to the database, and two clients will not create the same value. An identity column can only be filled by the database, so the client could not know the id in advance."
}
```

## 9. Links

- Previous: [L1: Tables, keys and constraints](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints)
- Next: [L3: Indexes](/notes/databases/postgres/01-relational-basics/l3-indexes)
- Message blocks as JSON: [LLM APIs L1: Messages and content blocks](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks)
- [Glossary](/notes/databases/postgres/glossary)
