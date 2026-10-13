---
title: "Glossary"
order: 2
summary: "Every term in PostgreSQL, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| aborted transaction | A transaction in which a statement failed. It accepts no more statements until `ROLLBACK`. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| atomicity | The all-or-nothing property of a transaction. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| autocommit | A client mode in which each statement commits on its own. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| B-tree | The default index type. A balanced tree of sorted keys. It supports equality, ranges and sorted output. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| `BEGIN` | Starts a transaction block. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| `bigserial` | An older shortcut that makes a `bigint` column with a sequence default. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| column | One named, typed field of every row. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| `COMMIT` | Ends the transaction and makes all its writes permanent and visible. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| composite index | An index on two or more columns, sorted by the first, then the second inside equal firsts, and so on. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| constraint | A rule that the database checks on every write. A write that breaks it fails with an error. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| containment | The test `a @> b`: does the JSON value `a` contain the JSON value `b`? | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| data type | The kind of value that a column holds. It sets the valid values and the operators. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| DDL | Data definition language: statements that define tables, such as `CREATE TABLE`. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| DML | Data manipulation language: statements that change rows, such as `INSERT`, `UPDATE`, `DELETE`. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| durability | After `COMMIT` returns, the writes survive a crash. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| `EXPLAIN` | A command that shows the plan. `EXPLAIN ANALYZE` also runs the query and shows real times. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| foreign key | A column whose value must match the primary key (or a unique key) of a row in another table. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| GIN index | Generalized inverted index: an index type for values with many parts, such as `jsonb`. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| identity column | An integer column that the database fills from a sequence: 1, 2, 3, and so on. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| implicit transaction | The transaction that PostgreSQL puts around a single statement when no `BEGIN` was given. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| index | A separate, sorted structure with some column values and a pointer to each row. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| index scan | Following the index to the matching rows only. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| isolation | The rule for what one transaction can see of other transactions that run at the same time. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| `json` | JSON stored as the exact input text. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| `jsonb` | JSON stored in a parsed binary form. It supports indexes and containment. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| leftmost columns | The first columns of a composite index. A query that filters on them can use the index well. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| lock | A mark on a row or table that makes other transactions wait before they change it. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| natural key | A primary key with business meaning, for example a plant code. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| `NULL` | The marker for "no value". It is not zero and not an empty string. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| `numeric` | An exact decimal number. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| `ON DELETE` | The rule for referencing rows when the referenced row is deleted. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| primary key | A column, or a set of columns, whose value is unique and not null in every row. It names the row. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| query planner | The part of PostgreSQL that chooses how to run a query, by estimated cost. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| Read Committed | The default isolation level of PostgreSQL. Each statement sees only data that was committed before the statement began. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| referenced table | The table that the foreign key refers to (the parent). | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| referencing table | The table with the foreign key (the child). | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| `ROLLBACK` | Ends the transaction and undoes all its writes. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| row | One record in a table. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| savepoint | A named point inside a transaction. `ROLLBACK TO` that point undoes only the later writes. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| schema | The definition of the tables: their columns, types and constraints. Also the name of a namespace for tables, such as `public`. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| selectivity | The share of rows that a condition matches. A selective condition matches few rows. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| sequence | A database object that gives out increasing numbers. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| sequential scan | Reading every row of the table, in storage order. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
| surrogate key | A primary key with no business meaning, created by the database, for example 1, 2, 3. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| table | A named set of rows. All rows have the same columns. | [1.1](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) |
| `text` | A string of any length. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| `timestamp` | `timestamp without time zone`: a date and a clock time with no time zone. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| `timestamptz` | `timestamp with time zone`: one instant in time, stored as UTC. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| transaction | A group of SQL statements that the database applies as one unit: all of them or none of them. | [2.1](/notes/databases/postgres/02-transactions/l1-transactions) |
| UUID | A 128-bit identifier, written as 36 characters. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| UUID version 4 | A random UUID. `gen_random_uuid()` makes one. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| UUID version 7 | A UUID that starts with a time stamp, so new ids sort after old ids. | [1.2](/notes/databases/postgres/01-relational-basics/l2-column-types) |
| write amplification | One row change causes several writes: the table plus each index. | [1.3](/notes/databases/postgres/01-relational-basics/l3-indexes) |
