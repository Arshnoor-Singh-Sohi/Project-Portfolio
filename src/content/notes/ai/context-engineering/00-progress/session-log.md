---
title: "Session log"
order: 1
summary: "What happened in each session, newest first."
status: in-progress
---

## Session 0: 2026-10-12

**Topic:** subject setup and course plan.

### Sources read

- The full handbook (390 pages): 7 lecture sessions and 7 FAQs.
- The Session 1 workshop notebook, the research bootcamp topics and the Session 1 quiz.
- Not read: the two workshop slide decks for Sessions 1 and 2. They probably repeat the handbook.

### Decisions

| Question | My choice |
|---|---|
| The plan: 73 lessons in 11 parts, a capstone, a research track, hard-question pages | "Approve as-is (Recommended)" |
| Build mode | "All now, part by part (Recommended)" |
| Capstone | "Research assistant (Recommended)" |
| Lab code location | "New lab folder (Recommended)": `C:\Users\ASohi\Downloads\AI\context-engineering-lab` |

- The notes live in the new area `ai`, folder `ai/context-engineering`.
- Explanations use short sentences and simple words, with full technical depth.
- Each lesson teaches the corrected version of a handbook claim and names its primary source.
- The handbook code with bugs becomes debug exercises.
- Claude Code makes the Manim videos and the PaperBanana figures from prompts that Claude writes.

### Build

- Parts 1 to 9: 73 lessons and 9 hard-question pages. Each part had a second review that recomputed every number and checked every handbook quote.
- Part 10: the capstone overview and 8 milestone specs. Part 11: 9 experiment briefs.
- The corrections table has 222 rows. The glossary has 790 terms.
- Every page passed the format check on 2026-10-12.
- Media: 17 Manim videos and 11 PaperBanana figures have Claude Code prompts. None is rendered yet, so no lesson has a video block yet.

### Open

- Diagnostic: 8 questions, one at a time. It decides which Part 1 lessons need a full session.
- Run the Claude Code prompts one at a time. Tell Claude when a video or figure is ready, so that it goes into its lesson.
