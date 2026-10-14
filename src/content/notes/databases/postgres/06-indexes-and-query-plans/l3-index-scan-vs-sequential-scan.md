---
title: "L3: Index scan vs sequential scan"
order: 3
summary: "How PostgreSQL chooses between reading every page in order and jumping through an index. The four access methods, the cost formulas from the planner source with every default, row estimates from pg_stats, and a measured crossover on one million chat messages: Index Scan up to 5 estimated rows, Bitmap Heap Scan up to 42.7% of the rows, then Seq Scan. Physical row order moves the switch to 72%."
status: not-started
tags: [postgres, query-planner, seq-scan, index-scan, bitmap-scan, index-only-scan, cost-model, statistics]
---

## 1. The question this idea answers

The example chat store has 1,049,965 messages. Three kinds of question reach the same table:

- "The messages of chat C, in order." The unique index on `(chat_id, seq)` serves it.
- "All messages older than date D." A retention job asks this. It can match 100 rows or 600,000 rows.
- "How many messages arrived in the first two weeks?" A dashboard asks this.

For each query, PostgreSQL must choose how to reach the rows. It can read every page of the table in order. Or it can use an index to jump to the matching rows. The right choice depends on how many rows match and where they lie on disk. In the tests below, a wrong choice read up to 44 times more pages.

This lesson shows how the planner makes that choice, with the formulas from the PostgreSQL source and real numbers. All tests ran on PostgreSQL 16.15 and 18.6 in a sandbox (checked on 2026-10-14). PostgreSQL 18 is the current manual. PostgreSQL 19 is a release candidate, and this lesson does not cover it. [Lesson 1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) gave the overview. This lesson explains the mechanics in depth, with a new experiment.

## 2. Mental model

> [!analogy] Collecting parcels in a warehouse
> A warehouse has 23,872 shelves in one long row. Each shelf holds about 44 parcels. You must collect every parcel that arrived before a date. A catalog at the door lists the parcels sorted by arrival date, with a shelf number for each one. A planner picks the method before anyone moves, using only summary statistics.
>
> - **Sequential scan:** walk the whole row once and check every parcel. Walking past a shelf is cheap.
> - **Index scan:** read the catalog in date order and walk to the shelf of each parcel, one parcel at a time. Each parcel can mean a new trip across the warehouse.
> - **Bitmap scan:** copy all shelf numbers from the catalog, sort them, then walk the row once. Stop only at the marked shelves.
> - **Index-only scan:** the catalog itself holds the answer, so you never enter the warehouse. This works only for shelves with a stamp that says "nothing changed here recently".
>
> **Where it stops working:** a real trip has a fixed price. In PostgreSQL, a visit to a page is cheap when the page is already in memory. The planner does not know which pages are in memory. Also, the costs are estimates in an arbitrary unit, not seconds, and they rest on a sample of the rows.

## 3. Terms

| Term | Plain meaning |
|---|---|
| heap | The main data file of a table. A sequence of 8 kB pages that hold the rows, in no useful order. |
| page | The 8 kB unit that PostgreSQL reads, caches and counts as one buffer. Also called a block. |
| TID | Tuple identifier: the address of one row in the heap, as (block number, item offset). |
| sequential scan | Reads every heap page in physical order and tests every row. Plan node `Seq Scan`. |
| index scan | Reads matching index entries in key order and fetches the heap row of each one. Plan node `Index Scan`. |
| bitmap scan | Collects the TIDs of all matching index entries in a bitmap, then reads only the marked heap pages, in page order. |
| index-only scan | Returns values from the index alone and visits the heap only for pages that are not all-visible. |
| visibility map | Two bits per heap page. The all-visible bit says that every row on the page is visible to all transactions. |
| lossy page | A bitmap entry that keeps only the page number, not the rows. Every row on that page is then rechecked. |
| selectivity | The share of rows that a condition matches, as estimated by the planner. |
| cost unit | The arbitrary unit of planner costs. By convention, one sequential page read costs 1.0. |
| `pg_stats` | The view of column statistics that `ANALYZE` collects: null fraction, distinct values, common values, histogram, correlation. |
| correlation | A statistic from −1 to +1. It says how closely the physical row order follows the sort order of a column. |
| crossover point | The estimated row count at which the cheapest access method changes from one method to another. |

## 4. Method and math

### 4.1 Pages, rows and what each scan reads

PostgreSQL stores a table in a file called the heap. The heap is a sequence of 8 kB pages, and each page holds whole rows. An index is a separate file. Each index entry holds a key and a TID. [Lesson 6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) shows the inside of a B-tree.

The manual (PostgreSQL 18 docs §11.9, checked on 2026-10-14): "All indexes in PostgreSQL are *secondary* indexes, meaning that each index is stored separately from the table's main data area (which is called the table's *heap* in PostgreSQL terminology). This means that in an ordinary index scan, each row retrieval requires fetching data from both the index and the heap." It continues: "The heap-access portion of an index scan thus involves a lot of random access into the heap, which can be slow, particularly on traditional rotating media."

The example table has these sizes on both servers, from `pg_class` after the seed's `VACUUM ANALYZE`:

| Object | Pages (`relpages`) | Rows (`reltuples`) | Size |
|---|---|---|---|
| `messages` (heap) | 23,863 | 1,049,965 | 186 MB |
| `messages_chat_seq_key` | 6,960 | 1,049,965 | 54 MB |
| `messages_pkey` | 5,055 | 1,049,965 | 39 MB |

So one heap page holds $1{,}049{,}965 / 23{,}863 = 44.0$ rows on average. Keep this number in mind. It decides most of this lesson.

The planner chooses among four main access methods for one table:

| Access method | What it reads | Order of heap reads | Output order |
|---|---|---|---|
| Seq Scan | Every heap page and every row | Physical, first page to last page | Physical |
| Index Scan | Matching index entries, then the heap row of each entry | Index order, so it jumps between pages | Index key order |
| Bitmap Index Scan, then Bitmap Heap Scan | Matching index entries into a bitmap, then only the marked heap pages | Physical, unmarked pages are skipped | Physical |
| Index Only Scan | Matching index entries, plus the heap only for pages that are not all-visible | Index order | Index key order |

### 4.2 The cost model and its defaults

The planner gives each possible plan an estimated cost and keeps the cheapest. The manual (PostgreSQL 18 docs §19.7.2, checked on 2026-10-14): "The *cost* variables described in this section are measured on an arbitrary scale. Only their relative values matter, hence scaling them all up or down by the same factor will result in no change in the planner's choices." The PostgreSQL 16 manual has the same page as §20.7.2.

| Setting | Default | Manual description (§19.7.2) |
|---|---|---|
| `seq_page_cost` | 1.0 | "the planner's estimate of the cost of a disk page fetch that is part of a series of sequential fetches" |
| `random_page_cost` | 4.0 | "the planner's estimate of the cost of a non-sequentially-fetched disk page" |
| `cpu_tuple_cost` | 0.01 | "the planner's estimate of the cost of processing each row during a query" |
| `cpu_index_tuple_cost` | 0.005 | "the planner's estimate of the cost of processing each index entry during an index scan" |
| `cpu_operator_cost` | 0.0025 | "the planner's estimate of the cost of processing each operator or function executed during a query" |
| `effective_cache_size` | 4GB, which is 524,288 pages of 8 kB | "the planner's assumption about the effective size of the disk cache that is available to a single query" |

The same defaults are in `src/include/optimizer/cost.h` of the 18.6 source, and `SHOW` returned them on both servers. Why is a random page only 4 times the price of a sequential page? The manual explains: "Random access to durable storage is normally much more expensive than four times sequential access. However, a lower default is used (4.0) because the majority of random accesses to storage, such as indexed reads, are assumed to be in cache."

> [!note] What the manual says about lower values of random_page_cost
> The current manual pages for PostgreSQL 16 and 18 give no value for SSDs (checked on 2026-10-14). They say: "if your data is likely to be completely in cache, such as when the database is smaller than the total server memory, or network latency is high, decreasing random_page_cost might be appropriate." A tip adds that a value below `seq_page_cost` "is not physically sensible", but "setting them equal makes sense if the database is entirely cached in RAM".

`effective_cache_size` allocates no memory. The manual: "it is used only for estimation purposes." Section 4.6 shows where the index scan formula uses it.

### 4.3 Sequential scan cost, by hand

The manual computes the cost of a full scan of its test table `tenk1` (§14.1): "The estimated cost is computed as (disk pages read * seq_page_cost) + (rows scanned * cpu_tuple_cost)." The source agrees. `cost_seqscan` in `src/backend/optimizer/path/costsize.c` charges `seq_page_cost` per page, and `cpu_tuple_cost` plus the cost of the `WHERE` clause per row.

Both servers printed the same plan for `EXPLAIN SELECT * FROM messages`:

```text
Seq Scan on messages  (cost=0.00..34362.65 rows=1049965 width=152)
```

> [!example] Worked example: the Seq Scan cost of messages
> Disk: $23{,}863 \times 1.0 = 23{,}863$. CPU: $1{,}049{,}965 \times 0.01 = 10{,}499.65$. Total: $23{,}863 + 10{,}499.65 = 34{,}362.65$. This is the number in the plan.
>
> Now add `WHERE role = 'user'`. Each row also runs one `=` operator: $1{,}049{,}965 \times 0.0025 = 2{,}624.91$. New total: $34{,}362.65 + 2{,}624.91 = 36{,}987.56$. Both servers printed `cost=0.00..36987.56`. The manual describes the same effect for its table: the cost "has gone up a bit (by 10000 * cpu_operator_cost, to be exact)". So the cost of a sequential scan does not depend on how many rows match.

**Parallel Seq Scan.** For a selective filter on a column with no index, the planner can share the scan among worker processes. Both servers chose this plan for `SELECT id, chat_id, seq FROM messages WHERE created_at < '2026-01-01 01:00+00'`. PostgreSQL 16 printed (shortened):

```text
Gather  (cost=1000.00..30342.07 rows=105 width=36) (actual time=81.955..145.122 rows=106 loops=1)
  Workers Planned: 2
  ->  Parallel Seq Scan on messages  (cost=0.00..29331.57 rows=44 width=36) (actual time=42.181..135.891 rows=35 loops=3)
        Filter: (created_at < '2026-01-01 01:00:00+00'::timestamp with time zone)
...
```

> [!example] Worked example: the parallel divisor
> `get_parallel_divisor` in `costsize.c` counts the workers plus a share for the leader process of $1.0 - 0.3 \times \text{workers}$. With 2 workers: $2 + (1 - 0.6) = 2.4$. Only the CPU cost is divided: $1{,}049{,}965 \times 0.0125 / 2.4 = 13{,}124.56 / 2.4 = 5{,}468.57$. The source comment keeps the disk cost whole, because "most operating systems already do aggressive prefetching".
>
> Parallel Seq Scan: $23{,}863 + 5{,}468.57 = 29{,}331.57$. Gather adds `parallel_setup_cost` (1000) and `parallel_tuple_cost` (0.1 per row): $1{,}000 + 29{,}331.57 + 105 \times 0.1 = 30{,}342.07$.

Gather charges 0.1 for every row that it returns. So a query that returns hundreds of thousands of rows rarely gets a parallel plan. The queries in the experiments below return many rows, and the default planner chose no parallel plan for them.

### 4.4 The experiment tables

The example has no index on `messages.created_at`. For the experiments, three copies of `messages` were built in the lesson database `pgidx_l3` on both servers. They hold the same 1,049,965 rows in three physical orders:

```sql
-- Order of the random uuid id: created_at is scattered over all pages.
CREATE TABLE msg_time_shuffled  AS SELECT * FROM messages ORDER BY id;
-- Order of created_at.
CREATE TABLE msg_time_sorted    AS SELECT * FROM messages ORDER BY created_at, id;
-- Order of messages itself: chat by chat.
CREATE TABLE msg_time_chatorder AS SELECT * FROM messages;
CREATE INDEX msg_time_shuffled_created_idx  ON msg_time_shuffled  (created_at);
CREATE INDEX msg_time_sorted_created_idx    ON msg_time_sorted    (created_at);
CREATE INDEX msg_time_chatorder_created_idx ON msg_time_chatorder (created_at);
VACUUM ANALYZE msg_time_shuffled, msg_time_sorted, msg_time_chatorder;
```

`msg_time_shuffled` and `msg_time_sorted` have 23,872 heap pages each, so $1{,}049{,}965 / 23{,}872 = 43.98$ rows per page. Each index has 2,148 pages. `bt_metap` reports `level = 2` for each index: a root, one internal level and the leaves. The `created_at` values range from 2026-01-01 00:04 to 2026-10-05 19:05 UTC. So the query `SELECT * FROM t WHERE created_at < cutoff` matches a share of rows that grows with the cutoff. All timestamps below are UTC.

### 4.5 Statistics: how many rows will match?

Every cost below depends on one estimate: how many rows match the condition. The planner computes it from statistics.

`pg_class.relpages` and `reltuples` give the table size. The manual (§14.2.1): "They are updated by VACUUM, ANALYZE, and a few DDL commands such as CREATE INDEX." The planner also reads the current page count and, "If that is different from relpages then reltuples is scaled accordingly" (§69.1). The view `pg_stats` gives one row per column. `ANALYZE` fills it, and autovacuum runs `ANALYZE` in the default configuration.

| `pg_stats` column | Manual description (§53.29) |
|---|---|
| `null_frac` | "Fraction of column entries that are null" |
| `n_distinct` | "If greater than zero, the estimated number of distinct values in the column. If less than zero, the negative of the number of distinct values divided by the number of rows." |
| `most_common_vals`, `most_common_freqs` | The most common values and "the frequencies of the most common values, i.e., number of occurrences of each divided by total number of rows" |
| `histogram_bounds` | "A list of values that divide the column's values into groups of approximately equal population." It omits the common values. |
| `correlation` | "Statistical correlation between physical row ordering and logical ordering of the column values." |

`ANALYZE` reads a sample, not the whole table. The manual (SQL command `ANALYZE`): "For large tables, ANALYZE takes a random sample of the table contents, rather than examining every row." The source sets the sample size: `stats->minrows = 300 * stats->attstattarget` in `analyze.c`. With `default_statistics_target = 100`, that is 30,000 rows. So the statistics are estimates, and they differ a little between runs.

> [!example] Worked example: an equality estimate from the common values
> `role` has two values. On PostgreSQL 16, `pg_stats` lists `most_common_vals = {user,assistant}` and `most_common_freqs = {0.51103336,0.48896667}`. For `role = 'user'`: $0.51103336 \times 1{,}049{,}965 = 536{,}567$ rows. The PG16 plan printed `rows=536567`.
>
> PostgreSQL 18 sampled other rows and stored 0.5088. Its plan printed $0.5088 \times 1{,}049{,}965 = 534{,}222$ rows. The true count is 537,162. Both estimates are within 0.6% of it.

The sample also explains larger errors. `messages.chat_id` has exactly 50,000 distinct values. `n_distinct` says 40,721 on PG16 and 41,164 on PG18, because a sample of 30,000 rows sees most chats once or never.

For a range condition, the planner uses the histogram. These are the PG16 statistics of `msg_time_shuffled.created_at`:

```text
 null_frac | n_distinct  | most_common_vals | correlation | bounds |                     bounds_6_7
-----------+-------------+------------------+-------------+--------+-----------------------------------------------------
         0 | -0.34603533 |                  | 0.004894499 |    101 | {"2026-01-14 21:16:00+00","2026-01-17 15:36:00+00"}
```

> [!example] Worked example: a range estimate from the histogram
> Condition: `created_at < '2026-01-15 00:00+00'`. The histogram has 101 bounds, so 100 bins with equal shares of the sample. The cutoff lies between bound 6 and bound 7. So 5 full bins lie below it.
>
> Inside a bin, the planner assumes "a linear distribution of values inside each bucket" (§69.1). The bin is 3,980 minutes wide (2026-01-14 21:16 to 2026-01-17 15:36). The cutoff is 164 minutes after the bin start. Fraction: $164 / 3{,}980 = 0.041206$. Histogram share: $(5 + 0.041206) / 100 = 0.05041206$.
>
> For `<` instead of `<=`, `ineq_histogram_selectivity` in `selfuncs.c` subtracts the estimate for one value: $1 / (0.34603533 \times 1{,}049{,}965) = 1 / 363{,}325 = 0.0000027524$. Selectivity: $0.05041206 - 0.0000027524 = 0.05040931$.
>
> Rows: $0.05040931 \times 1{,}049{,}965 = 52{,}928$. The plan printed `rows=52928`. The true count is 52,571.

When the cutoff falls in the first or last bin, the same function replaces that bound. It uses the real minimum or maximum, which it reads from the index (`get_actual_variable_range`). So a hand calculation for a cutoff in the first bin does not match the plan exactly.

### 4.6 Index Scan cost, from the source

`cost_index` in `costsize.c` adds three parts. The index part is computed by `btcostestimate` and `genericcostestimate` in `selfuncs.c`. Symbols: $R$ estimated rows, $N$ table rows, $T$ heap pages, $P_i$ index pages. Also $h$ the B-tree level of the root, $c$ the correlation and $\sigma = R/N$ the selectivity.

**Index part.** Leaf pages in proportion to the matching share, each at `random_page_cost`. Each index entry costs `cpu_index_tuple_cost` plus one `cpu_operator_cost` per index condition. The descent from the root costs CPU only. The source charges about $\log_2 N$ comparisons at `cpu_operator_cost` each, plus 50 times `cpu_operator_cost` for each page on the path.

$$
C_\text{index} = \left\lceil R \cdot \frac{P_i}{N} \right\rceil \cdot 4.0 + R \cdot (0.005 + 0.0025) + \lceil \log_2 N \rceil \cdot 0.0025 + (h + 1) \cdot 50 \cdot 0.0025
$$

**Heap I/O.** The source estimates the heap pages with the Mackert and Lohman formula. The worst case assumes no correlation and a random read per page. The best case assumes perfect correlation: one random read, then sequential reads. The formula mixes them by $c^2$. Each fetched row then costs `cpu_tuple_cost`, plus any condition that the index cannot check.

$$
P_{ML} = \min\left(\frac{2TR}{2T + R},\ T\right), \qquad
IO_{max} = P_{ML} \cdot 4.0, \qquad
IO_{min} = 4.0 + (\lceil \sigma T \rceil - 1) \cdot 1.0
$$

$$
IO = IO_{max} + c^2 \cdot (IO_{min} - IO_{max})
$$

The min form of $P_{ML}$ holds while $T \le b$. Here $b$ is the share of `effective_cache_size` for this table: $b = 524{,}288 \times T / (T + P_i)$. For `msg_time_shuffled`: $524{,}288 \times 23{,}872 / 26{,}020 = 481{,}008$ pages, so $T \le b$. With a smaller cache, the formula counts pages that are read twice. On PG18, `SET effective_cache_size = '8MB'` raised the forced Index Scan cost for two weeks from 96,778.58 to 194,198.51.

> [!example] Worked example: Index Scan on msg_time_shuffled, two weeks (PG16)
> Inputs: $R = 52{,}928$ (section 4.5), $N = 1{,}049{,}965$, $T = 23{,}872$, $P_i = 2{,}148$, $h = 2$, $c = 0.004894499$. `enable_seqscan` and `enable_bitmapscan` were disabled to force the plan.
>
> Index leaf pages: $\lceil 52{,}928 \times 2{,}148 / 1{,}049{,}965 \rceil = \lceil 108.28 \rceil = 109$, so $109 \times 4.0 = 436$. Index entries: $52{,}928 \times 0.0075 = 396.96$.
>
> Descent: $\lceil \log_2 1{,}049{,}965 \rceil = 21$, so $21 \times 0.0025 = 0.0525$. Pages on the path: $(2 + 1) \times 50 \times 0.0025 = 0.375$. These two form the startup cost $0.4275$, printed as `0.43`. Index part: $436 + 396.96 + 0.0525 + 0.375 = 833.39$.
>
> Heap pages: $2 \times 23{,}872 \times 52{,}928 / (47{,}744 + 52{,}928) = 25{,}101.26$. That is more than $T$, so $P_{ML} = 23{,}872$ and $IO_{max} = 23{,}872 \times 4.0 = 95{,}488$. Correlated case: $\lceil 0.05040931 \times 23{,}872 \rceil = \lceil 1{,}203.37 \rceil = 1{,}204$ pages, so $IO_{min} = 4.0 + 1{,}203 = 1{,}207$.
>
> Mix: $c^2 = 0.0000239561$. $IO = 95{,}488 + 0.0000239561 \times (1{,}207 - 95{,}488) = 95{,}488 - 2.26 = 95{,}485.74$.
>
> Rows: $52{,}928 \times 0.01 = 529.28$. Total: $833.39 + 95{,}485.74 + 529.28 = 96{,}848.41$. The plan printed `cost=0.43..96848.41`.

The heap I/O is 98.6% of this cost. With correlation near 0, the planner expects a random read for nearly every heap page.

> [!note] Multicolumn indexes
> `btcost_correlation` in `selfuncs.c` takes the correlation of the first index column. For an index with more than one key column, it multiplies the value by 0.75. So for the two-column indexes of the example, the correlation can reach at most 0.75, and the mixing weight $c^2$ at most $0.75^2 = 0.5625$.

### 4.7 Bitmap scans

The manual (§14.1) explains the two plan levels: "the upper plan node sorts the row locations identified by the index into physical order before reading them, to minimize the cost of separate fetches. The "bitmap" mentioned in the node names is the mechanism that does the sorting." And §11.5: "The table rows are visited in physical order, because that is how the bitmap is laid out; this means that any ordering of the original indexes is lost, and so a separate sort step will be needed if the query has an ORDER BY clause."

The one-day query on `msg_time_shuffled`, PostgreSQL 16:

```text
Bitmap Heap Scan on msg_time_shuffled  (cost=62.57..10310.40 rows=3889 width=152) (actual time=1.274..35.239 rows=3685 loops=1)
  Recheck Cond: (created_at < '2026-01-02 00:00:00+00'::timestamp with time zone)
  Heap Blocks: exact=3414
  Buffers: shared hit=12 read=3412
  ->  Bitmap Index Scan on msg_time_shuffled_created_idx  (cost=0.00..61.60 rows=3889 width=0) (actual time=0.577..0.577 rows=3685 loops=1)
        Index Cond: (created_at < '2026-01-02 00:00:00+00'::timestamp with time zone)
        Buffers: shared hit=10
```

The Bitmap Index Scan read 10 index pages and returned 3,685 TIDs. The Bitmap Heap Scan read the 3,414 heap pages that hold them, each page once, in page order.

`cost_bitmap_heap_scan` and `compute_bitmap_pages` in `costsize.c` estimate it like this:

- **Startup:** the full index part, plus $0.1 \times 0.0025$ per row for the bitmap work. The heap scan cannot return a row before the bitmap is complete.
- **Heap pages:** $P = \min(2TR / (2T + R),\ T)$, rounded up. The source comment calls this the Mackert and Lohman case with no repeated reads.
- **Price per page:** $4.0 - (4.0 - 1.0)\sqrt{P/T}$. A few scattered pages cost 4.0 each. When $P = T$, every page costs 1.0, like a sequential scan.
- **CPU:** $R \times (0.01 + 0.0025)$. The source says: "For the moment, just assume they will be rechecked always."

> [!example] Worked example: Bitmap Heap Scan costs (PG16)
> **One day,** $R = 3{,}889$. Index part: $\lceil 3{,}889 \times 2{,}148 / 1{,}049{,}965 \rceil = 8$ pages, so $8 \times 4.0 + 3{,}889 \times 0.0075 + 0.4275 = 32 + 29.17 + 0.43 = 61.60$. Startup: $61.595 + 0.00025 \times 3{,}889 = 62.57$.
>
> Heap pages: $2 \times 23{,}872 \times 3{,}889 / 51{,}633 = 3{,}596.08$, rounded up to 3,597. Price per page: $4.0 - 3.0\sqrt{3{,}597 / 23{,}872} = 4.0 - 3.0 \times 0.388173 = 2.835480$. Heap I/O: $3{,}597 \times 2.835480 = 10{,}199.22$. CPU: $3{,}889 \times 0.0125 = 48.61$. Total: $62.57 + 10{,}199.22 + 48.61 = 10{,}310.40$. The plan printed `10310.40`.
>
> **Two weeks,** $R = 52{,}928$. Index part 833.39 (section 4.6). Startup: $833.39 + 0.00025 \times 52{,}928 = 846.62$. Heap pages: 25,101.26 is more than $T$, so $P = 23{,}872$ at $4.0 - 3.0 \times 1 = 1.0$ each.
>
> CPU: $52{,}928 \times 0.0125 = 661.60$. Total: $846.62 + 23{,}872 + 661.60 = 25{,}380.22$. The plan printed `cost=846.62..25380.22`.

**Lossy pages.** The bitmap lives in memory, limited by `work_mem`: `nodeBitmapIndexscan.c` calls `tbm_create(work_mem * (Size) 1024, ...)`. The header of `tidbitmap.c` explains the fallback: "we support "lossy" storage, in which we no longer remember individual tuple offsets on a page but only the fact that a particular page needs to be visited." The heap scan then tests every row on a lossy page against the `Recheck Cond`.

With `SET work_mem = '64kB'` and the bitmap plan forced, the two-week query printed on PG16 (shortened):

```text
Bitmap Heap Scan on msg_time_shuffled  (cost=846.62..37575.88 rows=52928 width=152) (actual time=4.900..286.365 rows=52571 loops=1)
  Recheck Cond: (created_at < '2026-01-15 00:00:00+00'::timestamp with time zone)
  Rows Removed by Index Recheck: 858505
  Heap Blocks: exact=682 lossy=20689
...
```

The same 21,371 pages were read ($682 + 20{,}689$), but 858,505 extra rows were tested and rejected. The planner also counts lossy pages in its estimate: the cost rose from 25,380.22 to 37,575.88, above the Seq Scan. Without forcing, PG16 and PG18 chose a Parallel Seq Scan at 64kB. At the default 4MB, the bitmap held all 21,371 pages exactly.

### 4.8 Index-only scans and the visibility map

The manual (§11.9) gives two conditions. The index type must support it ("B-tree indexes always do"), and "The query must reference only columns stored in the index." Then visibility decides the rest: "Visibility information is not stored in index entries, only in heap entries".

PostgreSQL keeps an all-visible bit for each heap page in the visibility map. "If it's set, the row is known visible and so the data can be returned with no further work. If it's not set, the heap entry must be visited to find out whether it's visible". The visibility map page (§66.4) adds who changes the bits: "Visibility map bits are only set by vacuum, but are cleared by any data-modifying operations on a page."

The test on PostgreSQL 16 counted the two-week messages three times on `msg_time_shuffled`:

| Step | Heap Fetches | Buffers |
|---|---|---|
| After `VACUUM ANALYZE` | 0 | 111 |
| After `UPDATE ... SET role = role WHERE created_at < '2026-01-15 00:00+00' AND seq = 3` (2,456 rows) | 9,765 | 9,874 |
| After `VACUUM msg_time_shuffled` | 0 | 111 |

Before the update, the count read 111 pages, all from the index. The bitmap scan for the same rows read 21,481 buffers (section 4.9). The update cleared the all-visible bit of every page that it changed. So every matching index entry on those pages needed a heap visit, plus the entries of the new row versions. One small update made the scan 89 times more expensive in buffers, until `VACUUM` set the bits again. `cost_index` multiplies the heap pages of an index-only scan by $1 - \text{allvisfrac}$, where allvisfrac is `relallvisible / relpages` from `pg_class`.

The example has a natural case. `SELECT seq FROM messages WHERE chat_id = $1` reads only columns of `messages_chat_seq_key`. Both servers chose `Index Only Scan` with `Heap Fetches: 0` and 4 buffers for a chat with 33 messages. Add `role` to the select list, and the plan becomes a Bitmap Heap Scan that also reads 2 heap pages.

> [!trap] SELECT * never gets an index-only scan
> An index-only scan needs every column of the query in the index. `SELECT *` on `messages` needs `parts`, which no index holds. Select only the columns that you need, or add them to the index with `INCLUDE` ([lesson 6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes)).

### 4.9 The crossover experiment

The test ran `SELECT * FROM msg_time_shuffled WHERE created_at < cutoff` for many cutoffs. For each one, it recorded the chosen plan with `EXPLAIN (ANALYZE, BUFFERS)`. Then it forced each of the three plans with `enable_*` settings and `max_parallel_workers_per_gather = 0`. The time is the best of three runs. The table shows PostgreSQL 16. PostgreSQL 18 chose the same plan at every cutoff.

| Cutoff | Matching rows (share) | Planner chose | Cost: Index / Bitmap / Seq | Buffers: Index / Bitmap / Seq | Time in ms: Index / Bitmap / Seq |
|---|---|---|---|---|---|
| 01-01 00:06 | 2 (0.0002%) | Index Scan | 24.51 / 24.31 / 36,996.56 | 5 / 5 / 23,872 | 0.0 / 0.0 / 133.0 |
| 01-01 01:00 | 106 (0.01%) | Bitmap | 615.07 / 579.12 / 36,996.56 | 109 / 109 / 23,872 | 0.1 / 0.1 / 134.8 |
| 01-02 00:00 | 3,685 (0.35%) | Bitmap | 14,488.14 / 10,310.40 / 36,996.56 | 3,695 / 3,424 / 23,872 | 3.4 / 4.7 / 135.7 |
| 01-15 00:00 | 52,571 (5.0%) | Bitmap | 96,848.41 / 25,380.22 / 36,996.56 | 52,676 / 21,481 / 23,872 | 124.6 / 117.2 / 126.4 |
| 02-25 13:20 | 209,121 (19.9%) | Bitmap | 100,878.68 / 29,841.95 / 36,996.56 | 209,539 / 24,290 / 23,872 | 553.8 / 230.2 / 219.8 |
| 04-29 01:20 | 445,625 (42.4%) | Bitmap | 106,968.78 / 36,584.06 / 36,996.56 | 446,514 / 24,774 / 23,872 | 1,444.2 / 236.1 / 168.0 |
| 05-19 21:20 | 524,795 (50.0%) | Seq Scan | 109,005.17 / 38,838.57 / 36,996.56 | 525,838 / 24,935 / 23,872 | 1,595.7 / 241.1 / 164.6 |
| 10-05 20:20 | 1,049,965 (100%) | Seq Scan | 122,453.10 / 53,726.22 / 36,996.56 | 1,052,056 / 26,004 / 23,872 | 3,105.6 / 775.2 / 371.8 |

The Seq Scan cost is $23{,}872 + 1{,}049{,}965 \times 0.0125 = 36{,}996.56$ at every cutoff. The plot shows the estimated costs of all three plans against the estimated share of rows. It adds the Index Scan on `msg_time_sorted` from section 4.10.

```plot
{
  "title": "Estimated cost vs share of rows (PG16): Seq Scan (purple), Bitmap Heap Scan (gold), Index Scan on shuffled rows (red), Index Scan on sorted rows (blue)",
  "xAxis": { "label": "estimated share of matching rows, %", "domain": [0, 100] },
  "yAxis": { "label": "estimated total cost", "domain": [0, 125000] },
  "disableZoom": true,
  "data": [
    { "fn": "36996.56", "color": "#6A4C93", "skipTip": true },
    { "points": [[0.06, 2237.6], [0.37, 10310.4], [0.74, 16368.79], [1.45, 22556.81], [2.56, 25761.62], [5.04, 25380.22], [10.06, 26878.71], [19.99, 29841.95], [30.01, 32832.88], [39.95, 35802.92], [50.13, 38838.57], [75.2, 46326.31], [100, 53726.22]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0.06, 2543.55], [0.37, 14488.14], [0.74, 26988.1], [1.45, 46690.67], [2.56, 69424.6], [5.04, 96848.41], [10.06, 98202.09], [19.99, 100878.68], [30.01, 103580.28], [39.95, 106263.29], [50.13, 109005.17], [75.2, 115768.99], [100, 122453.1]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[0.36, 189.03], [1.43, 733.91], [4.98, 2540.92], [10.18, 5181.04], [20.38, 10366.46], [30.58, 15549.56], [40.48, 20583.74], [50.36, 25606.27], [60.32, 30672.6], [70.23, 35708.33], [80.11, 40732.76], [89.97, 45746.38], [100, 50841.82]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true }
  ]
}
```

A binary search with one-minute steps found the exact switch points. Both servers switched at the same estimated row counts, although their histograms put them at different dates:

| Table | First plan, up to this estimate | Next plan, from this estimate |
|---|---|---|
| `msg_time_shuffled` | Index Scan, 5 rows | Bitmap Heap Scan, 7 rows (PG18) or 8 rows (PG16) |
| `msg_time_shuffled` | Bitmap Heap Scan, 448,683 rows (42.73%) | Seq Scan, 448,686 rows |
| `msg_time_sorted` | Index Scan, 756,389 rows (72.04%) | Seq Scan, 756,391 rows |

**Why the switch is not where the costs are equal.** `add_path` in `pathnode.c` compares costs with `STD_FUZZ_FACTOR 1.01`. The source comment: "fuzz_factor = 1.01 makes the fuzziness limit be 1% of the smaller cost." When two total costs are within 1%, the path with the lower startup cost wins. A Seq Scan starts at 0, so the bitmap must be at least 1% cheaper to win: $36{,}996.56 / 1.01 = 36{,}630.26$. The formula of section 4.7 gives 36,630.258 for 448,683 rows and 36,630.319 for 448,686 rows. The same rule kept the Index Scan at 5 rows: $24.51 / 24.31 = 1.008$, and the Index Scan starts at 0.43.

**Why the bitmap stays cheaper for so long.** One heap page holds 44 rows. If a share $\sigma$ of the rows matches at random, a page has no match with probability $(1 - \sigma)^{44}$.

> [!example] Worked example: pages touched at 5% of the rows
> $\sigma = 52{,}571 / 1{,}049{,}965 = 0.050069$. Chance that a page has no match: $(1 - 0.050069)^{43.98} = 0.1044$. Expected pages with a match: $23{,}872 \times (1 - 0.1044) = 21{,}379$. The plan reported `Heap Blocks: exact=21371`: 89.5% of all pages.
>
> So 5% of the rows lie on 89.5% of the pages. From this point, the bitmap reads almost the same pages as a Seq Scan, in the same order. It still wins on CPU, because it tests only 52,571 rows instead of 1,049,965.

> [!key] Few rows is not the same as few pages
> An index helps when the matching rows lie on few pages, not when they are few rows. At 44 rows per page and random placement, 5% of the rows already touch 90% of the pages. The Index Scan is worse: it visits a page once per row, so it read 52,676 buffers to return 52,571 rows from a 23,872-page table.

**Was the planner right?** At small shares, yes, by large factors: 5 buffers instead of 23,872. Near the switch at 42.4%, the chosen bitmap took 236 to 319 ms and the Seq Scan only 168 ms. The forced Index Scan at 100% read 1,052,056 buffers in 3.1 s, against 0.37 s for the Seq Scan. The operating system cache served most reads, so random reads were cheap here, and the gap grows on cold storage. Sandbox times are small and noisy, so use them for ratios and trust the buffer counts.

### 4.10 Correlation: same rows, different order

The manual describes the statistic (§53.29): "When the value is near -1 or +1, an index scan on the column will be estimated to be cheaper than when it is near zero, due to reduction of random access to the disk." The three tables hold the same rows. The two-week query on each one, PostgreSQL 16:

| Table | Physical order | `correlation` | Plan | Estimated cost | Buffers | Heap pages read | Time (best of 3) |
|---|---|---|---|---|---|---|---|
| `msg_time_shuffled` | Random uuid | 0.0049 | Bitmap Heap Scan | 25,380.22 | 21,481 | 21,371 | 129.5 ms |
| `msg_time_chatorder` | Chat by chat | −0.0003 | Bitmap Heap Scan | 25,379.69 | 2,514 | 2,404 | 20.0 ms |
| `msg_time_sorted` | `created_at` | 1 | Index Scan | 2,540.92 | 1,305 | 1,195 | 11.1 ms |

> [!example] Worked example: the Index Scan on msg_time_sorted
> PG16 estimated $R = 52{,}314$ rows from its own histogram, and $c = 1$, so $c^2 = 1$ and $IO = IO_{min}$. Index part: $\lceil 52{,}314 \times 2{,}148 / 1{,}049{,}965 \rceil = 108$ pages, so $108 \times 4.0 + 52{,}314 \times 0.0075 + 0.4275 = 432 + 392.36 + 0.43 = 824.78$.
>
> Heap: $\lceil (52{,}314 / 1{,}049{,}965) \times 23{,}872 \rceil = \lceil 1{,}189.41 \rceil = 1{,}190$ pages. $IO = 4.0 + 1{,}189 \times 1.0 = 1{,}193$. Rows: $52{,}314 \times 0.01 = 523.14$.
>
> Total: $824.78 + 1{,}193 + 523.14 = 2{,}540.92$. The plan printed `cost=0.43..2540.92`. On the shuffled table, the heap I/O of the same query was 95,485.74. Correlation removed 98.7% of the estimated I/O.
>
> On the sorted table, the Index Scan stays the cheapest plan up to 72% of the rows, and the bitmap scan never wins. The rows of a time range sit on consecutive pages, so the index order and the page order agree.

The chat-order table shows the limit of the statistic. Its correlation is −0.0003, so the planner estimated the same cost as for the shuffled table. But the scan read only 2,404 pages, not 21,371. Each chat was inserted at once, so its 2 to 40 messages sit together and have nearby `created_at` values. Correlation is one number for the whole column. It cannot describe clusters. A chat service sees this effect every day: the rows of one chat arrive together.

### 4.11 LIMIT changes the choice

The cost of a `Limit` node is the startup cost of its input plus a fraction of the run cost: $C_\text{startup} + (C_\text{total} - C_\text{startup}) \cdot \text{limit} / R$. The manual (§14.1) explains its own example: "the Limit node is expected to stop after retrieving only a fifth of those rows, so its total cost is only a fifth as much".

Three queries on `msg_time_shuffled`, PostgreSQL 18 (the PG16 plans were the same):

| Query | Plan | Estimated cost | Buffers |
|---|---|---|---|
| `WHERE created_at < '2026-05-20 00:00+00' LIMIT 20` | Limit, Seq Scan | 0.00..1.42 | 3 |
| `WHERE created_at < '2026-05-20 00:00+00' ORDER BY created_at LIMIT 20` | Limit, Index Scan | 0.43..4.59 | 23 |
| Same, without `LIMIT` | Index Scan, 522,770 rows | 0.43..108,916.84 | not run |

> [!example] Worked example: two Limit costs
> Seq Scan with `LIMIT 20`: $0 + (36{,}996.56 - 0) \times 20 / 522{,}770 = 1.42$. The scan stops after the first 20 matching rows. Index Scan with `ORDER BY created_at LIMIT 20`: $0.4275 + (108{,}916.84 - 0.4275) \times 20 / 522{,}770 = 0.4275 + 4.17 = 4.59$. The index returns the rows already sorted, so no sort of 522,770 rows is needed.

> [!trap] LIMIT assumes the matches are spread evenly
> The query `SELECT * FROM msg_time_shuffled WHERE chat_id = $1 ORDER BY created_at LIMIT 1` has no index on `chat_id`. The planner expected 26 matching rows spread evenly along the `created_at` index, so it planned to stop after 1/26 of the index: $0.43 + (122{,}454.76 - 0.43) / 26 = 4{,}710.21$. On PG18, for the chat whose messages are the oldest, it read 4 buffers in 0.065 ms. For the chat whose messages are the newest, it removed 1,049,900 rows by filter, read 1,051,992 buffers and took 3,744 ms. The same query on `messages` uses `messages_chat_seq_key`: 4 buffers, 0.3 ms. The fix is an index that starts with the equality column.

### 4.12 enable_seqscan = off as a diagnostic tool

The manual (§19.7.1) calls the `enable_*` settings "a crude method of influencing the query plans", and the use of one "a *temporary* solution". It names better ways: the cost constants, `ANALYZE`, and larger statistics targets. Use an `enable_*` setting in one session to see the plan that the planner rejected, and its real cost. Run `SET enable_seqscan = off`, then `EXPLAIN (ANALYZE, BUFFERS)` of the query, then `RESET enable_seqscan`.

At 50% of the rows, the forced bitmap scan took 283.7 ms on PG18. The Seq Scan that the planner chose took 205.7 ms. So the planner was right. A setting like this belongs in a test session, never in the server configuration.

> [!note] Version difference: how a disabled plan appears
> PostgreSQL 16 adds a large constant to the cost of a disabled node. For `SELECT * FROM chats WHERE title = 'Chat 7'` (no index can serve it), PG16 printed `Seq Scan on chats  (cost=10000000000.00..10000001183.00 rows=1 width=56)`. PostgreSQL 18 keeps the normal cost, `cost=0.00..1183.00`, and adds the line `Disabled: true`. The 18.6 source counts disabled nodes before it compares costs: "Number of disabled nodes, if different, trumps all else." The 18 release notes list "Improve handling of disabled optimizer features".

### 4.13 Version differences that touch scans

For the same row estimate and table size, both servers computed the same costs, and the switch points matched to the row. These differences exist (each one checked in the release notes on 2026-10-14):

| Version | Change | Effect on this lesson |
|---|---|---|
| 17 | "sequential reads using streaming I/O" and the new setting `io_combine_limit` | Faster reads at run time. PostgreSQL 17 was not tested here. |
| 18 | An asynchronous I/O subsystem (`io_method`, `worker` on the test server) that "can improve performance of sequential scans, bitmap heap scans, vacuums" | Faster reads at run time. A search of the 18.6 optimizer source finds no use of `effective_io_concurrency` or `io_combine_limit`, so the costs ignore them. |
| 18 | `effective_io_concurrency` default 16 (1 on the PG16 server) | An execution setting. Not part of the cost. |
| 18 | `EXPLAIN ANALYZE` shows buffers by default, `Index Searches`, and fractional rows such as `rows=35.33` | Output format only. [Lesson 6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) covers it. |

### 4.14 Production view

| Concern | What to do |
|---|---|
| Latency | Expect an index to help only when the matching rows lie on few pages. Check `Buffers` and `Heap Blocks`, not only the plan name. |
| Statistics | Run `ANALYZE` after a bulk load. Check `pg_stats` when an estimate is wrong. Raise the target of one column with `ALTER TABLE ... SET STATISTICS` when its common values matter. |
| Cost settings | Change `random_page_cost` only with evidence, for example a database that fits in memory. Test the plans of your main queries before and after. |
| Physical order | Rows written together stay together. Chat messages cluster by chat, and append-only logs follow time. The correlation statistic misses clusters, so the planner can overestimate reads. |
| Index-only scans | Select only indexed columns for counts and lists. Keep autovacuum healthy, or `Heap Fetches` grows after every update. |
| `ORDER BY ... LIMIT` | Give each such query an index that starts with its equality columns and ends with the sort column. Otherwise the plan depends on luck. |
| Diagnostics | Use `enable_*` settings only inside a test session. Compare `EXPLAIN (ANALYZE, BUFFERS)` of both plans, then `RESET`. |
| Memory | A low `work_mem` makes bitmaps lossy. Watch for `lossy=` in `Heap Blocks` and for `Rows Removed by Index Recheck`. |

## 5. Video

```video
{
  "src": "/notes/media/postgres/manim/m05-seq-vs-index-crossover.mp4",
  "caption": "The same query reads 5, 21,481 or 23,872 pages depending on the share of matching rows and the access method, and the physical row order moves the crossover from 42.7% to 72%."
}
```

## 6. Code

These exercises use your local PostgreSQL server and the example chat store. Put the work in `postgres/13-scan-choice.ipynb`. Use `psycopg` to run the SQL and record each result in a table.

**Exercise 3.1: find the crossover.** Build `msg_time_shuffled` and its index as in section 4.4. Write a function that returns the plan type, estimated rows and total cost for a cutoff, from `EXPLAIN (FORMAT JSON)`. Sweep at least 12 cutoffs. Then find both switch points with a binary search on one-minute steps.

Acceptance tests:

- Your table lists cutoff, estimated rows, chosen plan, and the forced cost of each of the three plans.
- You report both switch points as estimated row counts.
- With the formula of section 4.7, you show that the bitmap loses above the Seq Scan cost divided by 1.01.

**Exercise 3.2: correlation.** Build `msg_time_sorted` as in section 4.4. Run the two-week query on both tables with `EXPLAIN (ANALYZE, BUFFERS)`. Then compute the expected number of heap pages touched on the shuffled table with the formula of section 4.9.

Acceptance tests:

- `pg_stats.correlation` is near 0 for one table and 1 for the other.
- The sorted table uses an Index Scan with fewer than one tenth of the buffers of the shuffled table.
- Your expected page count is within 1% of `Heap Blocks: exact`.

**Exercise 3.3: index-only scans and the visibility map.** On your copy of the shuffled table, count the two-week rows with `SELECT count(*)`. Update a small set of matching rows. Count again. Run `VACUUM` on the table. Count a third time.

Acceptance tests:

- The three plans are `Index Only Scan` with `Heap Fetches` of 0, then more than 0, then 0.
- You record `relallvisible` and `relpages` before and after `VACUUM`.
- Two sentences explain the number of heap fetches in the second plan.

## 7. Common mistakes

1. **"An index always makes a query faster."** It helps only when the matching rows lie on few pages. On the shuffled table, 5% of the rows touched 89.5% of the pages.
2. **Reading costs as milliseconds.** Costs are in an arbitrary unit in which one sequential page read is 1.0. Use `EXPLAIN ANALYZE` for times.
3. **Judging a plan by its name.** "Bitmap Heap Scan" can read 2,404 pages or 21,371 pages for the same rows. Read `Buffers` and `Heap Blocks`.
4. **Lowering `random_page_cost` "because we use SSDs".** The current manual ties a lower value to data that is cached in memory, and it gives no SSD value. Measure first.
5. **Leaving `enable_seqscan = off` in a configuration.** It is a diagnostic tool for one session.
6. **Expecting an index-only scan after heavy writes.** Updates clear the all-visible bits, and only vacuum sets them again.
7. **`ORDER BY x LIMIT n` with a filter on another column and no matching index.** The plan can read the whole index when the matching rows sit at its end.

## 8. One-minute explanation

PostgreSQL stores rows in 8 kB heap pages in no useful order, and every index is a separate file that points to those pages. A sequential scan reads every page in order and tests every row. Its cost does not depend on how many rows match. An index scan reads matching index entries and visits a heap page for each row. So its cost grows with the matching rows, at `random_page_cost` 4.0 per page instead of 1.0. A bitmap scan collects the row addresses first and reads each needed page once, in page order. An index-only scan skips the heap for pages that vacuum marked all-visible. The planner estimates the matching rows from `pg_stats`, prices each plan with the cost constants, and keeps the cheapest within a 1% margin. On one million shuffled messages, the Index Scan won only up to 5 rows, the bitmap up to 42.7%, and the Seq Scan beyond that. The same rows in date order kept the Index Scan cheapest up to 72%, because correlation turns random reads into sequential ones.

## 9. Check questions

```check
{
  "question": "The table chats has relpages = 558 and reltuples = 50,000. Compute the Seq Scan cost of SELECT * FROM chats WHERE title <> 'x' with default settings.",
  "hint": "Pages times seq_page_cost, plus rows times (cpu_tuple_cost + one cpu_operator_cost).",
  "answer": "Disk: 558 × 1.0 = 558. CPU: 50,000 × (0.01 + 0.0025) = 625. Total: 558 + 625 = 1,183. Both servers printed cost=0.00..1183.00."
}
```

```check
{
  "question": "On msg_time_shuffled, a two-week query matched 5% of the rows, but its Bitmap Heap Scan read 89.5% of the heap pages. Why?",
  "hint": "How many rows does one page hold, and where are the matches?",
  "answer": "A page holds about 44 rows, and the matching rows are scattered at random. A page has no match with probability (1 − 0.05)^44 ≈ 0.104. So about 89.6% of the 23,872 pages hold at least one match: 21,379 expected, 21,371 measured. Few rows can still mean almost all pages."
}
```

```check
{
  "question": "Two tables hold the same rows. pg_stats.correlation of created_at is 0.0049 in one and 1 in the other. Which part of the Index Scan cost formula changes, and by how much for the two-week query?",
  "answer": "The heap I/O. The formula mixes the uncorrelated cost (pages × random_page_cost) and the correlated cost (one random page, then sequential pages) by correlation squared. On the shuffled table, the I/O was 95,485.74. On the sorted table, c² = 1, so the I/O is the correlated cost: 4.0 + 1,189 × 1.0 = 1,193. The total fell from 96,848.41 to 2,540.92."
}
```

```check
{
  "question": "SELECT count(*) on the two-week range used an Index Only Scan with Heap Fetches: 0 and 111 buffers. After an UPDATE of 2,456 matching rows, it showed Heap Fetches: 9,765. Explain the jump and the fix.",
  "answer": "Any data change clears the all-visible bit of the changed heap page in the visibility map. The scan must then visit the heap for every matching index entry on those pages, and for the new row versions, to check visibility. Only vacuum sets the bits again. After VACUUM, the scan showed Heap Fetches: 0 and 111 buffers."
}
```

## 10. Links

- Previous: [L2: Multicolumn indexes](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes)
- Next: [L4: EXPLAIN and EXPLAIN ANALYZE](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze)
- The overview: [Lesson 1.3: Indexes](/notes/databases/postgres/01-relational-basics/l3-indexes)
- Applied: [Retention and deletion](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion)
- [Glossary](/notes/databases/postgres/glossary)
