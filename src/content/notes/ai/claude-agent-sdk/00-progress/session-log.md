---
title: "Session log"
order: 1
summary: "What happened in each session, newest first."
status: in-progress
---

## Notes update: 2026-10-13

**Topic:** the remaining lessons of this subject are written. No study session happened.

- New lessons: 2.1, 2.2, 3.1, 4.4, 5.2, 6.1, 6.2, 7.1, 7.2, 8.1 and 8.2. Each one has the status `not-started`.
- Each lesson marks a fact that it could not confirm as "not confirmed" or "not documented".
- The SQL and Python examples ran in a sandbox where that was possible. A lesson labels each example that did not run.
- New videos: M04, M05, M06 and M07. The [media queue](/notes/ai/claude-agent-sdk/00-progress/media-queue) gives the status.

### Findings to remember

- Lesson 2.1: `allowed_tools` does not limit which tools exist. `tools` and deny rules decide what the model sees.
- Lesson 3.1: the `create_sdk_mcp_server` docstring uses bare names in `allowed_tools`. A test showed that bare names are denied.
- Lesson 5.2: an input generator that fails before its first yield gives zero messages and no `ResultMessage`.
- Lesson 6.1: Claude Code assumes a 200K window for a Foundry deployment name that it cannot match.
- The notebooks of parts 6 to 8 are numbered 13 to 18, after the notebooks of parts 1 to 5.

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
