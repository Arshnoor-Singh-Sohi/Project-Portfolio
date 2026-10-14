---
title: "Session log"
order: 1
summary: "What happened in each session, newest first."
status: in-progress
---

## Notes update: 2026-10-13

**Topic:** the remaining lessons of this subject are written. No study session happened.

- New lessons: 1.1, 1.2, 1.3, 2.1, 3.1 and 3.2. Each one has the status `not-started`.
- Each lesson marks a fact that it could not confirm as "not confirmed" or "not documented".
- The SQL and Python examples ran in a sandbox where that was possible. A lesson labels each example that did not run.
- New videos: M01 and M02. The [media queue](/notes/software-engineering/python/00-progress/media-queue) gives the status.

### Findings to remember

- Lesson 2.1: FastAPI 0.135.0 added a native `EventSourceResponse` for SSE.
- Lesson 3.1: since uv 0.12.0, `uv init` creates a packaged `src/` layout. On Databricks Apps, a `requirements.txt` file wins over `uv.lock`.
- Lesson 3.2: pytest-asyncio 1.0 removed the `event_loop` fixture.
- Lessons 1.1 to 1.3: in a notebook, write `await main()`. `asyncio.run` fails there because a loop already runs.

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
