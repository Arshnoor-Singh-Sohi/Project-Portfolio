---
title: "Session log"
order: 1
summary: "What happened in each session, newest first."
status: in-progress
---

## Notes update: 2026-10-13

**Topic:** the remaining lessons of this subject are written. No study session happened.

- New lessons: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 4.1, 4.2, 5.1, 5.2, 5.3 and 5.4. Each one has the status `not-started`.
- Each lesson marks a fact that it could not confirm as "not confirmed" or "not documented".
- The SQL and Python examples ran in a sandbox where that was possible. A lesson labels each example that did not run.
- New videos: M01, M02, M03 and M04. The [media queue](/notes/platforms/databricks/00-progress/media-queue) gives the status.

### Findings to remember

- Lesson 5.1: Lakebase Provisioned is retired. Since March 12, 2026, new instances are Autoscaling projects.
- Lesson 4.2: `query_agent` is not in any official source. The documented Genie One MCP tools are `genie_ask`, `genie_poll_response`, `genie_get_query_result`, `genie_cancel_response` and `view_ask`. The old `/api/2.0/mcp/genie` endpoint ends on October 31, 2026.
- Lesson 5.3: `LakebasePool` has three traps. Autocommit is on, there is no `check` callback, and the `database` and `username` arguments raise `TypeError`.
- Lesson 2.1: environment variables win over `WorkspaceClient(profile="prod")`. The profile fills only the empty settings.
- Lesson 3.1 is "Know only". It has no Code section and no notebook.

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
