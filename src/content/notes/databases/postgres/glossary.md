---
title: "Glossary"
order: 2
summary: "Every term in PostgreSQL, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| aborted transaction | A transaction in which a statement failed. It accepts no more statements until `ROLLBACK`. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| `ACCESS EXCLUSIVE` | The strongest table lock. It conflicts with every other lock, also with a plain `SELECT`. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| `ACCESS SHARE` | The weakest table lock. A plain `SELECT` takes it. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| actual time | Real milliseconds for one loop of a node: the time to its first row, then the time to its last row. | [6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) |
| adaptation | The conversion between Python objects and PostgreSQL values, in both directions. | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| advisory lock | A lock with a meaning that the application decides. PostgreSQL only records who holds it. | [4.2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) |
| `AFTER ROW` trigger | A trigger that runs once for each changed row, after the statement has changed all its rows. | [6.5](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) |
| `AsyncConnection` | The `asyncio` version of the connection. Its methods are coroutines that you `await`. | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| atomicity | The all-or-nothing property of a transaction. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| `auto_explain` | A module that writes the plans of slow statements to the server log automatically. | [6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) |
| autocommit | A client mode in which each statement commits on its own. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| B-tree | The default index type. A balanced tree of sorted keys. It supports equality, ranges and sorted output. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| backfill | Filling a new column for the old rows, usually in batches. | [4.2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) |
| backward scan | An index scan from the high end to the low end. It returns the reverse order. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| `BEGIN` | Starts a transaction block. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| `bigserial` | An older shortcut that makes a `bigint` column with a sequence default. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| bind mount | A host folder that appears inside the container. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
| bitmap scan | Collects the TIDs of all matching index entries in a bitmap, then reads only the marked heap pages, in page order. | [6.3](/notes/databases/postgres/06-indexes-and-query-plans/l3-index-scan-vs-sequential-scan) |
| `BitmapAnd` | A plan node that combines the row lists of two index scans and keeps only the rows found in both. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| buffer | One 8 kB page in PostgreSQL's shared memory cache. `hit` means that the page was already there. `read` means that PostgreSQL asked the operating system for it. | [6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) |
| cardinality violation | The error when one `ON CONFLICT DO UPDATE` statement would change the same row twice. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| `CASCADE` | Delete the child rows of a deleted parent row, or copy a changed key into them. | [6.5](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) |
| cascade chain | A cascade that causes another cascade: `chats` to `messages` to `message_feedback`. | [6.5](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) |
| `check` | A function that the pool runs on a connection before it lends it. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| checkout | Borrowing a connection from the pool. In psycopg: entering `with pool.connection() as conn:`. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| checksum | A hash of the file content, stored when the file ran, to detect a later edit. | [4.2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) |
| column | One named, typed field of every row. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| `COMMIT` | Ends the transaction and makes all its writes permanent and visible. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| composite index | An index on two or more columns, sorted by the first, then the second inside equal firsts, and so on. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| concurrent transactions | Two or more transactions that are open at the same time. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| connection | One open session with the server. The server runs one backend process for it. | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| connection pool | An object that keeps database connections open and lends them to requests, with a maximum count. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| conninfo | The connection string, as keywords (`host=... dbname=...`) or as a URI (`postgresql://...`). | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| constraint | A rule that the database checks on every write. A write that breaks it fails with an error. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| container | One running instance of an image, with its own file system and processes. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
| containment | The test `a @> b`: does the JSON value `a` contain the JSON value `b`? | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| correlation | A statistic from −1 to +1. It says how closely the physical row order follows the sort order of a column. | [6.3](/notes/databases/postgres/06-indexes-and-query-plans/l3-index-scan-vs-sequential-scan) |
| cost | The planner's estimate of the work of a node and its children, in arbitrary units, written `startup..total`. | [6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) |
| cost unit | The arbitrary unit of planner costs. By convention, one sequential page read costs 1.0. | [6.3](/notes/databases/postgres/06-indexes-and-query-plans/l3-index-scan-vs-sequential-scan) |
| covering index | An index that holds every column a query needs, so the query does not visit the table. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| `CREATE INDEX CONCURRENTLY` | An index build that does not block writes. It cannot run inside a transaction block. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| crossover point | The estimated row count at which the cheapest access method changes from one method to another. | [6.3](/notes/databases/postgres/06-indexes-and-query-plans/l3-index-scan-vs-sequential-scan) |
| cursor | The object that sends one query and holds its result rows. | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| data type | The kind of value that a column holds. It sets the valid values and the operators. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| DDL | Data definition language: statements that define tables, such as `CREATE TABLE`. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| DDL lock | The table lock that a schema change takes. Its mode decides what other sessions can still do. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| deferrable constraint | A constraint whose check can wait until `COMMIT`. | [6.5](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) |
| DML | Data manipulation language: statements that change rows, such as `INSERT`, `UPDATE`, `DELETE`. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| Docker Compose | A tool that starts containers from a YAML file, `compose.yaml`. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
| down migration | A script that undoes one migration. | [4.2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) |
| downlink | An internal item: a separator key plus the block number of a child page. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| driver | The library that speaks the PostgreSQL network protocol for a programming language. | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| durability | After `COMMIT` returns, the writes survive a crash. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| estimated rows | The `rows` value inside the cost parentheses: how many rows the planner expects the node to return. | [6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) |
| `EXCLUDED` | The special table name for the row that `INSERT ... ON CONFLICT DO UPDATE` proposed to insert. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| expand-contract | A way to make an incompatible change in safe steps: add the new form, move to it, then remove the old form. | [4.2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) |
| `EXPLAIN` | A command that shows the plan. `EXPLAIN ANALYZE` also runs the query and shows real times. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| `EXPLAIN ANALYZE` | `EXPLAIN` with the `ANALYZE` option. It runs the statement and adds the real time, rows and loops of each node. | [6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) |
| fan-out | The number of child pages that one internal page refers to. A high fan-out makes a short tree. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| fast default | A default value that PostgreSQL stores once in the catalog, so old rows need no rewrite. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| fillfactor | The percentage to which an index build fills leaf pages. The B-tree default is 90. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| `Filter` | The plan line that lists the conditions checked on each fetched table row. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| `FOR KEY SHARE` | The weakest row lock. The child check takes it on the parent row. It blocks a delete of that row, not a normal update. | [6.5](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) |
| foreign key | A column whose value must match the primary key (or a unique key) of a row in another table. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| forward-only | A policy: a migration is never undone. A mistake is fixed by a new migration. | [4.2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) |
| GIN index | Generalized inverted index: an index type for values with many parts, such as `jsonb`. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| health check | A command that Docker runs again and again to mark a container `healthy` or `unhealthy`. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
| heap | The table file. Rows go into any page with free space, so the heap has no order. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| high key | The first item of a page that has a right sibling. It is an upper bound for all keys on the page. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| idempotency key | An id that the client makes before the first attempt, so that the server can detect a retry and not do the work twice. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| identity column | An integer column that the database fills from a sequence: 1, 2, 3, and so on. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| idle in transaction | A server state: the session has an open transaction and waits for the client. | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| image | A read-only package of a program and its files, for example `postgres:16`. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
| implicit transaction | The transaction that PostgreSQL puts around a single statement when no `BEGIN` was given. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| index | A separate, sorted structure with some column values and a pointer to each row. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| `Index Cond` | The plan line that lists the conditions an index scan applies to index entries. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| index scan | Following the index to the matching rows only. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| index search | One descent from the root page to a leaf page. PostgreSQL 18 reports the count as "Index Searches". | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| index-only scan | Returns values from the index alone and visits the heap only for pages that are not all-visible. | [6.3](/notes/databases/postgres/06-indexes-and-query-plans/l3-index-scan-vs-sequential-scan) |
| init script | A `.sql` or `.sh` file in `/docker-entrypoint-initdb.d` that runs once, on the first start with an empty data directory. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
| internal page | A page above the leaf level. Its items are downlinks. The top internal page is the root page. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| invalid index | An index that a failed concurrent build left behind. Queries ignore it, but writes still update it. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| isolation | The rule for what one transaction can see of other transactions that run at the same time. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| isolation level | The rule that decides which changes of other transactions a transaction can see. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| `json` | JSON stored as the exact input text. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| `jsonb` | JSON stored in a parsed binary form. It supports indexes and containment. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| key column | A column that is part of the sort order of the index. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| keyset pagination | Paging that asks for the rows after the last row of the previous page, instead of skipping N rows. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| leading column | The first key column, or the first few. The index is sorted by it before anything else. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| leaf page | A page on the lowest level. Its items are index keys, each with the TID of a heap row. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| leftmost columns | The first columns of a composite index. A query that filters on them can use the index well. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| lexicographic order | Sort by the first column. Use the second column only to order entries with equal first columns, and so on. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| lock | A mark on a row or table that makes other transactions wait before they change it. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| lock queue | The line of sessions that wait for a lock on the same object. A waiting request blocks later requests that conflict with it. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| `lock_timeout` | A setting that cancels a statement that waits longer than this time for a lock. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| loop | One execution of a node. The inner node of a nested loop join runs one loop for each outer row. | [6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) |
| lossy page | A bitmap entry that keeps only the page number, not the rows. Every row on that page is then rechecked. | [6.3](/notes/databases/postgres/06-indexes-and-query-plans/l3-index-scan-vs-sequential-scan) |
| lost update | A write that disappears because another transaction overwrote it, based on an old read. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| major version | The first number of a PostgreSQL version, for example 16 in 16.15. Features and the data format change between major versions. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
| `MATCH FULL` | A match type that rejects a multicolumn reference with some null and some non-null columns. | [6.5](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) |
| `max_connections` | The server setting that caps the number of sessions. Default typically 100. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| `max_idle` | How long an extra connection, above `min_size`, can stay unused before the pool closes it. Default 10 minutes. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| `max_lifetime` | The age after which the pool closes a connection and opens a new one. Default 1 hour. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| `max_size` | The largest number of connections that the pool opens under load. Default `None`, which means equal to `min_size`. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| `max_waiting` | The longest queue of waiting checkouts. Beyond it, `TooManyRequests`. Default 0, no limit. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| metapage | Block 0 of the index. It stores the block number of the root page. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| migration | One schema change, written as a file that a program can run. | [4.2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) |
| `min_size` | The number of connections that the pool keeps open even when idle. Default 4. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| multicolumn index | An index whose key has two or more columns. Also called a composite index. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| named volume | Storage that Docker manages and names. It lives on after the container is removed. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
| natural key | A primary key with business meaning, for example a plant code. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| `NO ACTION` | The default action. A delete fails if referencing rows still exist when the constraint is checked. | [6.5](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) |
| node | One step of a plan, for example a scan, a join or a sort. The manual calls it a plan node. The nodes form a tree, and rows flow from the lowest nodes to the top node. | [6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) |
| `NOT VALID` | A constraint option: check new rows now, but do not scan the old rows yet. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| `NULL` | The marker for "no value". It is not zero and not an empty string. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| `numeric` | An exact decimal number. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| `ON DELETE` | The rule for referencing rows when the referenced row is deleted. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| operator class | The set of comparison operators and functions that defines the sort order of an indexed column. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| page | The 8 kB unit that PostgreSQL reads, caches and counts as one buffer. Also called a block. | [6.3](/notes/databases/postgres/06-indexes-and-query-plans/l3-index-scan-vs-sequential-scan) |
| page (block) | The unit of storage and caching: 8 kB by default. Tables and indexes are files of pages. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| page split | The operation that moves part of a full page to a new page and adds a downlink in the parent. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| parameter | A value that the driver sends separately from the SQL text. | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| per-loop value | A value that `EXPLAIN ANALYZE` shows as an average over all loops. Multiply it by `loops` to get the total. | [6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) |
| `pg_isready` | A PostgreSQL tool that reports whether a server accepts connections, through its exit code. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
| `pg_stat_statements` | A module that keeps statistics, such as calls and total time, for each normalized statement. | [6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) |
| `pg_stats` | The view of column statistics that `ANALYZE` collects: null fraction, distinct values, common values, histogram, correlation. | [6.3](/notes/databases/postgres/06-indexes-and-query-plans/l3-index-scan-vs-sequential-scan) |
| `PGDATA` | The data directory of the server. In the `postgres:16` image it is `/var/lib/postgresql/data`. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
| placeholder | A marker in the SQL text where a value goes: `%s` or `%(name)s` in psycopg. | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| plan | The steps that PostgreSQL chooses to run one statement. The planner builds it, and the executor runs it. | [6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) |
| port mapping | `-p host_ip:host_port:container_port`: a host port that forwards to a container port. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
| posting list | One leaf item that stores a key once, followed by a sorted array of TIDs. Deduplication creates it. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| primary key | A column, or a set of columns, whose value is unique and not null in every row. It names the row. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| query planner | The part of PostgreSQL that chooses how to run a query, by estimated cost. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| Read Committed | The default isolation level of PostgreSQL. Each statement sees only data that was committed before the statement began. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| read-modify-write | Code that reads a value, computes a new value in the application, and writes the new value. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| `reconnect_timeout` | How long the pool retries a failed connection attempt before it calls `reconnect_failed`. Default 5 minutes. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| redundant index | An index whose work another index already does, for example `(a)` next to `(a, b)`. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| referenced table | The table that the foreign key refers to (the parent). | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| referencing table | The table with the foreign key (the child). | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| referential action | What happens to the child rows when their parent row is deleted or its key changes. | [6.5](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) |
| referential integrity | The rule that every non-null reference in the child table matches a row in the parent table. | [6.5](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) |
| Repeatable Read | An isolation level in which all statements of a transaction see one snapshot, taken at its first statement. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| `RESTRICT` | Like `NO ACTION`, but the check cannot wait until commit, and a new parent row with the same key does not help. | [6.5](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) |
| RI trigger | An internal trigger that PostgreSQL creates for a foreign key. It runs one SQL query to check or apply the rule. | [6.5](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) |
| right-link | The pointer from each page to its right sibling on the same level. A left-link also exists. | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| `ROLLBACK` | Ends the transaction and undoes all its writes. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| row | One record in a table. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| row comparison | A comparison of two lists of values, such as `(a, b) < (1, 2)`, done column by column from the left. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| row factory | The function that decides the Python shape of each row: tuple, dict, named tuple. | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| row lock | A lock on one row. Other writers of that row wait until the lock holder ends its transaction. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| runner | The program that applies the missing migrations, in order, once each. | [4.2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) |
| savepoint | A named point inside a transaction. `ROLLBACK TO` that point undoes only the later writes. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| scanned range | The part of the leaf level that one index scan reads from its start position to its stop position. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| schema | The definition of the tables: their columns, types and constraints. Also the name of a namespace for tables, such as `public`. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| schema drift | A database whose schema differs from what its migrations describe. | [4.2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) |
| `schema_migrations` | The table in each database that records which versions ran, when, and with which checksum. | [4.2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) |
| `SELECT ... FOR UPDATE` | A read that also takes a row lock on every row that it returns. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| selectivity | The share of rows that a condition matches. A selective condition matches few rows. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| sequence | A database object that gives out increasing numbers. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| sequential scan | Reading every row of the table, in storage order. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| Serializable | The strictest isolation level. The result must equal some one-at-a-time order of the transactions, or one transaction fails. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| serialization failure | The error (SQLSTATE `40001`) that Repeatable Read or Serializable raises to prevent a wrong result. The fix is to retry the whole transaction. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| server-side binding | The server receives the SQL with `$1`, `$2` markers and the values separately, and joins them itself. | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| `SET NULL`, `SET DEFAULT` | Set the referencing columns of the child rows to null or to their default value. | [6.5](/notes/databases/postgres/06-indexes-and-query-plans/l5-foreign-keys-and-on-delete-cascade) |
| `SHARE` | The lock of `CREATE INDEX`. It allows reads and blocks writes. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| `SHARE UPDATE EXCLUSIVE` | A lock that allows reads and writes but blocks other schema changes. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| short-lived token | A password that is valid for a short time, for example an OAuth token that expires after one hour. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| skip scan | A PostgreSQL 18 B-tree technique: one search per value of a leading column that the query does not constrain. | [6.2](/notes/databases/postgres/06-indexes-and-query-plans/l2-multicolumn-indexes) |
| snapshot | The set of committed data that a statement or a transaction sees. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| SQL injection | An attack in which a value changes the meaning of the SQL, because the code put the value into the SQL text. | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| SQLSTATE | The five-character error code that the server sends with every error, for example `23505`. | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| stable function | A function that returns the same value within one statement, such as `now()`. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| startup cost | The estimated work before a node can return its first row. | [6.4](/notes/databases/postgres/06-indexes-and-query-plans/l4-explain-and-explain-analyze) |
| surrogate key | A primary key with no business meaning, created by the database, for example 1, 2, 3. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| table | A named set of rows. All rows have the same columns. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| table rewrite | PostgreSQL writes a new copy of every row and every index of the table. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| tag | The name after the colon. It selects a version: `16`, `16.15`, `16-alpine`. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
| `text` | A string of any length. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| TID | Tuple identifier, also called `ctid`: the address of a row as (block number, item offset). | [6.1](/notes/databases/postgres/06-indexes-and-query-plans/l1-b-tree-indexes) |
| `timeout` | How long a checkout waits for a free connection before it raises `PoolTimeout`. Default 30 s. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| `timestamp` | `timestamp without time zone`: a date and a clock time with no time zone. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| `timestamptz` | `timestamp with time zone`: one instant in time, stored as UTC. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| transaction | A group of SQL statements that the database applies as one unit: all of them or none of them. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| transaction status | The state of the connection: `IDLE`, `INTRANS` (in a transaction) or `INERROR` (in a failed transaction). | [3.1](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) |
| transactional DDL | Schema changes that obey `BEGIN` and `ROLLBACK` like data changes. PostgreSQL has it for most statements. | [4.2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) |
| upsert | One statement that inserts a row, or updates it if a row with the same key exists. | [2.2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts) |
| UUID | A 128-bit identifier, written as 36 characters. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| UUID version 4 | A random UUID. `gen_random_uuid()` makes one. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| UUID version 7 | A UUID that starts with a time stamp, so new ids sort after old ids. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| `VALIDATE CONSTRAINT` | The command that scans the old rows later, with a weaker lock. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| version | The number of a migration, for example `0003`. It sets the order. | [4.2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) |
| visibility map | Two bits per heap page. The all-visible bit says that every row on the page is visible to all transactions. | [6.3](/notes/databases/postgres/06-indexes-and-query-plans/l3-index-scan-vs-sequential-scan) |
| volatile function | A function that can return a different value on each call, such as `clock_timestamp()` or `gen_random_uuid()`. | [4.1](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) |
| worker process | One operating-system process of a web server. Each process has its own memory and its own pool. | [3.2](/notes/databases/postgres/03-python-driver/l2-connection-pools) |
| write amplification | One row change causes several writes: the table plus each index. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| WSL 2 | Windows Subsystem for Linux 2: a Linux kernel inside Windows. Docker Desktop on Windows can run its engine there. | [5.1](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker) |
