---
title: "Session log"
order: 1
summary: "What happened in each session, newest first."
status: in-progress
---

## Notes update: 2026-10-13

**Topic:** the remaining lessons of this subject are written. No study session happened.

- New lessons: 1.1, 1.2 and 2.1. Each one has the status `not-started`.
- Each lesson marks a fact that it could not confirm as "not confirmed" or "not documented".
- The SQL and Python examples ran in a sandbox where that was possible. A lesson labels each example that did not run.
- New video: M01. The [media queue](/notes/software-engineering/security-and-operations/00-progress/media-queue) gives the status.

### Findings to remember

- Lesson 1.2: the docs do not say whether the Databricks Apps proxy removes client copies of `X-Forwarded-*` headers. The lesson treats them as untrusted.
- Lesson 2.1: CLI trace export to the Databricks Apps telemetry collector was not tested in a workspace. MLflow was not installed, so its section quotes the docs only.

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
