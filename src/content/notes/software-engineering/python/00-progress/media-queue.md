---
title: "Media queue"
order: 4
summary: "Every planned Manim video and SVG figure of this subject, the lesson that uses it, and its status."
---

## How a video or figure is made

1. Claude writes a prompt for Claude Code. The prompt names the misunderstanding, the scenes in order, the color legend and the output path.
2. I run the prompt in Claude Code in the background, one session at a time on this repository.
3. Claude Code renders the file, watches it, fixes visual problems and reports the duration.
4. Claude changes the status here. The lesson already has the `video` block.

Status values: **planned**, **prompt given**, **rendered**, **in lesson**.

All prompts are in one place: the Manim prompts page that Claude published for this study list (October 2026). Every video is 1920x1080 at 30 fps.

## Manim videos

Output folder: `public/notes/media/python/manim/`.

| Code | File | Video | Misunderstanding it fixes | Lesson | Status |
|---|---|---|---|---|---|
| M01 | `m01-event-loop-one-thread.mp4` | One thread, many tasks: where the event loop switches | "async def code runs in parallel." | 1.1 | prompt given |
| M02 | `m02-async-generator-early-exit.mp4` | Leaving an async generator early: break vs aclosing | "break closes the async generator at once, in the current task." | 1.2 | prompt given |
