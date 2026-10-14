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

The prompts are in the repository file `Claude outputs/agent-harness-manim-prompts.md`, and on the Manim prompts page that Claude published for this study list (October 2026). This subject is group 8. To make its videos, paste one line into Claude Code: `Read "Claude outputs/agent-harness-manim-prompts.md" and follow its run rules. Make group 8 only.` Claude Code skips every video whose file already exists. Every video is 1920x1080 at 30 fps.

## Manim videos

Output folder: `public/notes/media/evaluation/manim/`.

| Code | File | Video | Misunderstanding it fixes | Lesson | Status |
|---|---|---|---|---|---|
| M01 | `m01-what-20-of-20-proves.mp4` | What 3/3 and 20/20 really prove | "20/20 proves a 100% pass rate." | 2.1 | prompt given |
