---
title: "M6 PostgreSQL persistence"
order: 6
summary: "Tables, keys, SQL queries, indexes and a safe connection from Python, so that the API keeps its data after a restart."
---

A web service that keeps its data only in Python lists loses everything when the process stops. A relational database stores the data on disk, checks the rules of the data, and answers questions about it with SQL. This module teaches the beginner path: model the data, query it, make the queries fast, and connect a FastAPI service to it safely. Later levels store chat history, usage logs and evaluation results in the same kind of tables.

**Outcome:** your API keeps its data after a restart, with real create, read, update and delete operations backed by PostgreSQL.

**Before this module:** [1.7 Files, paths, environment variables and JSON](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l7-files-paths-env-and-json), [4.3 Dependencies, lifespan, settings and middleware](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l3-dependencies-lifespan-config-and-middleware).

| Code | Lesson | Core idea | Exercise runs in | Status |
|---|---|---|---|---|
| 6.1 | [Relational data modeling](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql/l1-relational-data-modeling) | Tables, keys and constraints describe the data and protect its rules. | Local practice project | not started |
| 6.2 | [SQL queries: SELECT to GROUP BY](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql/l2-sql-queries) | Read, change, join and count rows with SQL. | Local practice project | not started |
| 6.3 | [Indexes and EXPLAIN ANALYZE](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql/l3-indexes-and-explain) | An index lets the database skip rows. EXPLAIN ANALYZE shows if it did. | Local practice project | not started |
| 6.4 | [Connecting Python and FastAPI to PostgreSQL](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql/l4-connecting-python-to-postgres) | Parameters, transactions, a pool and one connection per request. | Local practice project | not started |

## Deeper lessons in the PostgreSQL subject

This module is the first pass. The [PostgreSQL subject](/notes/databases/postgres) goes deeper on each idea:

- [Tables, keys and constraints](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) and [Column types](/notes/databases/postgres/01-relational-basics/l2-column-types)
- [Indexes](/notes/databases/postgres/01-relational-basics/l3-indexes)
- [Transactions](/notes/databases/postgres/02-transactions/l1-transactions) and [Isolation and upserts](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts)
- [psycopg basics](/notes/databases/postgres/03-python-driver/l1-psycopg-basics) and [Connection pools](/notes/databases/postgres/03-python-driver/l2-connection-pools)
- [Local PostgreSQL with Docker](/notes/databases/postgres/05-local-setup/l1-local-postgres-with-docker)

## Facts and versions

The SQL outputs in these lessons come from a sandbox run on 2026-10-19. The run used PostgreSQL 16.15, psycopg 3.3.6 and psycopg-pool 3.3.3. PostgreSQL 18 is the current major version (postgresql.org, checked on 2026-10-19). The behavior that these lessons show is the same in versions 16 to 18. Timings change from machine to machine. Compare the order of size, not the exact milliseconds.
