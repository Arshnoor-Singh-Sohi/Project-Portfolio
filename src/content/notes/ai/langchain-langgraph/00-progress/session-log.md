---
title: "Session log"
order: 1
summary: "What happened in each session, newest first."
status: in-progress
---

## Notes update: 2026-10-13

**Topic:** the remaining lessons of this subject are written. No study session happened.

- New lessons: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1 and 6.1. Each one has the status `not-started`.
- Each lesson marks a fact that it could not confirm as "not confirmed" or "not documented".
- The SQL and Python examples ran in a sandbox where that was possible. A lesson labels each example that did not run.
- New videos: M01, M02, M03 and M04. The [media queue](/notes/ai/langchain-langgraph/00-progress/media-queue) gives the status.

### Findings to remember

- Lessons 1.2 and 4.1: the docs give a default recursion limit of 1000. The langgraph 1.2.14 source gives 10007, and `create_agent` sets 9999. The lessons follow the code.
- Lesson 1.3: `databricks-langchain==0.21.0` did not install in the sandbox, because pip resolution timed out. The lesson ran `ChatDatabricks` from the wheel source against a fake endpoint.
- Lesson 5.1: the docs say that the `tasks` stream mode requires a checkpointer. In a test it worked without one.

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
