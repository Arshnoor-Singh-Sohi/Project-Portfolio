---
title: "04 Schema changes"
order: 14
summary: "How to change a table that already holds data."
---

This part covers safe changes to a live schema.

| Code | Lesson | Core idea | Stage | Status |
|---|---|---|---|---|
| L1 | ALTER TABLE ADD COLUMN | No table rewrite with a constant default, since PostgreSQL 11. | A | planned |
| L2 | Migrations as code | Each change is a numbered file that runs once. | Later | planned |
