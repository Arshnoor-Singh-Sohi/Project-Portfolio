---
title: "L3: Indexes"
order: 3
summary: "An index is a sorted copy of some columns with pointers to the rows. A B-tree index on (parent_id, order_column) serves 'the newest N rows of one parent' without a full scan. A measured example: 30.5 ms to 0.066 ms on one million rows. Leftmost columns, EXPLAIN, and the write cost of every index."
status: not-started
tags: [postgres, index, b-tree, explain, performance]
---

## 1. The question this idea answers

A chat application asks one question again and again: "Give me the messages of chat C, in order." A shipping report asks: "Give me the 20 newest shipments of plant 42." With a few rows, any query is fast. With millions of rows, the database must not read the whole table for each request.

An **index** solves this. It is a second structure, kept sorted, that lets the database jump to the right rows. This lesson shows how a B-tree index works, how to design one for a given query, how to prove with `EXPLAIN` that the database uses it, and what each index costs. The numbers come from a test on PostgreSQL 16.15 in a sandbox. Your numbers will differ, but the ratios hold.

## 2. Mental model

> [!analogy] The index at the back of a book
> To find "transactions" in a 600-page book, you do not read all 600 pages. You open the index at the back, where the terms are sorted, find "transactions: pages 212, 240", and go to those pages.
>
> A database index is the same: the values of some columns, kept sorted, each with a pointer to its row. A composite index on (plant, date) is like an index sorted by plant first and by date inside each plant.
>
> **Where it stops working:** a book index costs nothing after printing. A database index must change on every insert, update and delete of the table, and it takes disk space. Each index makes writes slower.

## 3. Terms

| Term | Plain meaning |
|---|---|
| index | A separate, sorted structure with some column values and a pointer to each row. |
| B-tree | The default index type. A balanced tree of sorted keys. It supports equality, ranges and sorted output. |
| sequential scan | Reading every row of the table, in storage order. |
| index scan | Following the index to the matching rows only. |
| composite index | An index on two or more columns, sorted by the first, then the second inside equal firsts, and so on. |
| leftmost columns | The first columns of a composite index. A query that filters on them can use the index well. |
| query planner | The part of PostgreSQL that chooses how to run a query, by estimated cost. |
| `EXPLAIN` | A command that shows the plan. `EXPLAIN ANALYZE` also runs the query and shows real times. |
| selectivity | The share of rows that a condition matches. A selective condition matches few rows. |
| write amplification | One row change causes several writes: the table plus each index. |

## 4. Method and math

### 4.1 What a B-tree gives you

The PostgreSQL 16 docs (§11.2, checked on 2026-10-12): "By default, the CREATE INDEX command creates B-tree indexes, which fit the most common situations." And: "B-trees can handle equality and range queries on data that can be sorted into some ordering." And: "B-tree indexes can also be used to retrieve data in sorted order."

The cost of a lookup in a B-tree grows with the logarithm of the row count, not with the row count:

$$
\text{steps} \approx \log_{f} N
$$

Here $N$ is the number of rows and $f$ is the fan-out: how many keys one index page holds, often in the hundreds. With $f = 300$:

| Rows $N$ | $\log_{300} N$ (pages read from the top to a leaf) |
|---|---|
| 1,000,000 | $\ln(10^6) / \ln(300) = 13.82 / 5.70 \approx 2.4$, so 3 levels |
| 1,000,000,000 | $20.72 / 5.70 \approx 3.6$, so 4 levels |

A thousand times more rows adds about one level. A sequential scan, in contrast, reads a thousand times more pages. The fan-out of 300 is an assumption for the example. The real value depends on the key size.

### 4.2 A measured example

The test table has one million shipments for 500 plants:

```sql
CREATE TABLE ship_big (
    shipment_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plant_id    bigint NOT NULL,
    shipped_on  date NOT NULL,
    quantity    integer NOT NULL
);
-- 1,000,000 random rows, then ANALYZE
```

The query: the 20 newest shipments of plant 42.

```sql
SELECT * FROM ship_big WHERE plant_id = 42 ORDER BY shipped_on DESC LIMIT 20;
```

**Without an index** (on `plant_id`), `EXPLAIN ANALYZE` showed (shortened):

```text
Limit (actual time=26.269..30.518 rows=20 loops=1)
  ->  Gather Merge
        Workers Planned: 2
        ->  Sort
              Sort Key: shipped_on DESC
              ->  Parallel Seq Scan on ship_big
                    Filter: (plant_id = 42)
                    Rows Removed by Filter: 332641
Execution Time: 30.540 ms
```

Three parallel workers read every row. Each one removed about 332,641 rows. Then the database sorted about 2,079 matches (693 per worker) to keep 20.

**With a composite index:**

```sql
CREATE INDEX ship_big_plant_date ON ship_big (plant_id, shipped_on);
```

```text
Limit (actual time=0.030..0.054 rows=20 loops=1)
  ->  Index Scan Backward using ship_big_plant_date on ship_big
        Index Cond: (plant_id = 42)
Execution Time: 0.066 ms
```

> [!example] Worked example: the speed-up
> 30.540 ms / 0.066 ms ≈ 463. The index made this query about 460 times faster.
>
> The reason is in the plan. "Index Scan Backward" means the database went to the end of plant 42's part of the index, where the newest dates are, and read 20 entries backward. It read 20 rows instead of one million, and it did not sort anything, because the index is already in date order inside plant 42.

### 4.3 Design an index from the query

The docs (§11.3): "A multicolumn B-tree index can be used with query conditions that involve any subset of the index's columns, but the index is most efficient when there are constraints on the leading (leftmost) columns." The exact rule: "equality constraints on leading columns, plus any inequality constraints on the first column that does not have an equality constraint, will be used to limit the portion of the index that is scanned."

So build the index from the query:

1. Columns with `=` in the `WHERE` clause come first.
2. Then the column of a range condition, or the column of the `ORDER BY`.

| Query | Good index | Why |
|---|---|---|
| `WHERE plant_id = ? ORDER BY shipped_on DESC LIMIT 20` | `(plant_id, shipped_on)` | Equality first, then the sort column. A backward scan gives `DESC`. |
| `WHERE chat_id = ? ORDER BY seq` | `(chat_id, seq)` | The same shape. This is the main query of a chat store. |
| `WHERE plant_id = ? AND shipped_on >= ?` | `(plant_id, shipped_on)` | Equality, then a range. |
| `WHERE shipped_on = ?` | `(shipped_on)`, a separate index | `shipped_on` is not the leftmost column of `(plant_id, shipped_on)`. |

The test confirms the last row. With only the composite index, the query `WHERE shipped_on = '2025-06-01'` used a parallel sequential scan and took 32.7 ms.

> [!note] Direction
> The docs (§11.4): an index is ascending by default, and it "can be scanned backward" to serve `ORDER BY x DESC`. You need a special order, such as `(x ASC, y DESC)`, only when one query sorts two columns in opposite directions.

### 4.4 The primary key and unique constraints already have indexes

[L1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) showed that a primary key and a unique constraint each create a unique B-tree index. A foreign key does not. So the usual list of indexes for a child table is:

1. The primary key (automatic).
2. The foreign key column, usually as the first column of a composite index that also serves the main query.
3. Any unique constraint (automatic).

One composite index `(chat_id, seq)` serves both the foreign key (lookups and cascade deletes by `chat_id`) and the ordered read. You do not need a second index on `chat_id` alone.

### 4.5 When the planner ignores an index

The planner chooses by estimated cost. It skips an index when a scan is cheaper:

| Case | Why a scan wins |
|---|---|
| A tiny table | The test table with 3 rows used `Seq Scan on tiny`, also with a primary key. One page is cheaper to read than an index plus a page. |
| A condition that matches most rows | The docs (§11.4): "Indexes are more useful when only a few rows need be fetched." If 60% of rows match, reading the table is cheaper than jumping. |
| Old statistics | The planner uses statistics from `ANALYZE`. After a large load, run `ANALYZE` (or let autovacuum do it). |
| A function on the column | `WHERE lower(code) = 'bra'` cannot use an index on `code`. It needs an index on `lower(code)`. |

So test with realistic data. A test with 3 rows proves nothing about indexes.

### 4.6 The cost of an index

**Space.** In the test, the table took 50 MB, the primary key index 21 MB and the composite index 20 MB.

**Writes.** Every insert must also insert into every index. In the same sandbox, inserting 500,000 rows took about 0.9 s into a table with only a primary key, and about 3.7 s into a table with a primary key plus three more indexes. That is about 4 times slower. This is one measurement on one machine. The direction is always the same: more indexes, slower writes.

> [!key] Index for your real queries
> Add an index for each frequent query that must be fast, and no more. Check each one with `EXPLAIN ANALYZE` on realistic data. Remove indexes that no query uses.

### 4.7 Production view

| Concern | What to do |
|---|---|
| Read speed | One composite index per main access path, with equality columns first. |
| Write speed | Each index slows every write. Chat stores write on every turn, so keep the list short. |
| Proof | `EXPLAIN ANALYZE` on production-like data. Look for "Index Scan" and the absence of "Sort". |
| Large tables | `CREATE INDEX` blocks writes while it runs. `CREATE INDEX CONCURRENTLY` does not, but it takes longer ([planned part 4](/notes/databases/postgres/04-schema-changes)). |
| Maintenance | Run `ANALYZE` after big loads. Watch for unused indexes. |

## 5. Code

These exercises use your local PostgreSQL 16 server. Put the SQL in `postgres/03-indexes.sql`.

**Exercise 3.1: reproduce the measurement.** Create `ship_big` with one million rows, as in section 4.2. Use `generate_series` and `random()`. Run `EXPLAIN ANALYZE` on the query before and after the composite index.

Acceptance tests:

- Before: the plan has "Seq Scan" and "Sort".
- After: the plan has "Index Scan Backward" and no "Sort".
- Write your two execution times and the ratio.

**Exercise 3.2: the wrong order.** Drop the index. Create `(shipped_on, plant_id)` instead. Run the same query.

Acceptance test: record the plan, and explain in two sentences why this index serves the query badly, with the word "leftmost".

**Exercise 3.3: a chat query.** Create a `messages` table with `chat_id uuid`, `seq integer` and `content text`. Load 100 chats with 2,000 messages each. Design the index for "messages of one chat in order" and prove it with `EXPLAIN ANALYZE`.

Acceptance test: the plan uses your index, has no "Sort", and runs in under 1 ms on your machine.

## 6. Common mistakes

1. **Testing indexes on tiny tables.** The planner scans tiny tables. Test with realistic sizes.
2. **The sort column first.** Put the equality columns first, then the sort or range column.
3. **One index per column.** A composite index usually serves the real query better than two single-column indexes.
4. **Forgetting the foreign key column.** It has no automatic index.
5. **Indexes "just in case".** Each one slows every write and uses space.
6. **No ANALYZE after a big load.** The planner uses old statistics.

## 7. One-minute explanation

An index is a sorted copy of some columns with a pointer to each row, like the index at the back of a book. The default type, the B-tree, supports equality, ranges and sorted output, and a lookup costs a few page reads even for a billion rows. Design the index from the query: equality columns first, then the range or sort column. For "the newest rows of one parent", that is `(parent_id, order_column)`, and the database reads only the rows it returns, with no sort. In a test with one million rows, this took the query from 30.5 ms to 0.066 ms. Prove it with `EXPLAIN ANALYZE`. Every index costs space and slows every write, so index only your real, frequent queries.

## 8. Check questions

```check
{
  "question": "The main query of a chat store is SELECT * FROM messages WHERE chat_id = $1 ORDER BY seq. Which index do you create, and what should EXPLAIN show?",
  "answer": "A composite B-tree index on (chat_id, seq). EXPLAIN should show an Index Scan on that index with the condition chat_id = $1, and no Sort node, because the index already holds the rows of one chat in seq order."
}
```

```check
{
  "question": "A table has an index on (plant_id, shipped_on). Can the query WHERE shipped_on = '2026-10-11' use it well? Why?",
  "answer": "Not well. shipped_on is not the leftmost column. The index is sorted by plant_id first, so the rows of one date are spread across every plant's part of the index. The test showed a sequential scan. A separate index on shipped_on serves this query."
}
```

```check
{
  "question": "With fan-out 300, how many levels does a B-tree need for 27,000,000 rows? Show the calculation.",
  "hint": "Compute the logarithm with base 300.",
  "answer": "log base 300 of 27,000,000 = ln(2.7 × 10^7) / ln(300) = 17.11 / 5.70 ≈ 3.0. So about 3 levels, plus or minus one with real page sizes."
}
```

```check
{
  "question": "Why can an index make a busy chat service slower?",
  "answer": "Every insert must also insert into every index of the table. A chat service writes rows on every turn. Each extra index adds work and disk space to every write. In the sandbox test, three extra indexes made a bulk insert about 4 times slower."
}
```

## 9. Links

- Previous: [L2: Column types](/notes/databases/postgres/01-relational-basics/l2-column-types)
- Next: [Transactions](/notes/databases/postgres/02-transactions/l1-transactions)
- Applied: [Chats, messages and parts](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts)
- [Glossary](/notes/databases/postgres/glossary)
