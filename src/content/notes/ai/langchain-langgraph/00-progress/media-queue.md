---
title: "Media queue"
order: 4
summary: "Every planned Manim video and SVG figure of this subject, the lesson that uses it, and its status."
---

## How a video or figure is made

1. Claude writes a prompt for Claude Code. The prompt names the misunderstanding, the scenes in order, the color legend and the output path.
2. I run the prompt in Claude Code in the background, one session at a time on this repository.
3. Claude Code renders the file, watches it, fixes visual problems and adds a row with the duration to `Claude outputs/agent-harness-manim-report.md`.
4. Claude changes the status here. The lesson already has the `video` block.

Status values: **planned**, **prompt given**, **rendered**, **in lesson**.

The prompts are in the repository file `Claude outputs/agent-harness-manim-prompts.md`, and on the Manim prompts page that Claude published for this study list (October 2026). This subject is group 5. To make its videos, paste one line into Claude Code: `Read "Claude outputs/agent-harness-manim-prompts.md" and follow its run rules. Make group 5 only.` Claude Code skips every video whose file already exists. Every video is 1920x1080 at 30 fps.

## Manim videos

Output folder: `public/notes/media/langchain-langgraph/manim/`.

| Code | File | Video | Misunderstanding it fixes | Lesson | Status |
|---|---|---|---|---|---|
| M01 | `m01-create-agent-loop.mp4` | The create_agent loop, one super-step at a time | "The recursion limit counts tool calls." | 1.2 | prompt given |
| M02 | `m02-middleware-hook-order.mp4` | Two middleware around one agent loop | "All hooks run in list order." | 2.1 | prompt given |
| M03 | `m03-summarization-rewrites-state.mp4` | SummarizationMiddleware rewrites the state | "Summarization only shortens what the model sees." | 3.1 | prompt given |
| M04 | `m04-checkpoints-per-super-step.mp4` | One checkpoint per super-step, one history per thread | "A checkpointer saves one snapshot per user turn." | 4.2 | prompt given |
