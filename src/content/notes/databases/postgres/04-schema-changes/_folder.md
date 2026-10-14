---
title: "04 Schema changes"
order: 14
summary: "How to change a table that already holds data."
---

This part covers safe changes to a live schema.

| Code | Lesson | Core idea | Stage | Status |
|---|---|---|---|---|
| L1 | [ALTER TABLE ADD COLUMN](/notes/databases/postgres/04-schema-changes/l1-alter-table-add-column) | No table rewrite with a constant default, since PostgreSQL 11. | A | not started |
| L2 | [Migrations as code](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) | Each change is a numbered file that runs once. | Later | not started |
