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

Output folder: `public/notes/media/conversation-state/manim/`.

| Code | File | Video | Misunderstanding it fixes | Lesson | Status |
|---|---|---|---|---|---|
| M01 | `m01-transient-vs-persistent.mp4` | A view for one call vs a rewrite of the state | "Trimming and summarizing are the same kind of change." | 1.2 | in lesson (0:53) |
| M02 | `m02-save-a-turn.mp4` | One turn saved as two rows in one transaction | "Saving a turn is two independent inserts." | 2.1 | in lesson (0:51) |

## SVG figures

Output folder: `public/notes/media/conversation-state/figures/`.

| Code | File | Figure | Lesson | Status |
|---|---|---|---|---|
| F01 | `three-copies.svg` | Three copies of one conversation | 1.1 | in lesson |
| F02 | `transient-vs-persistent.svg` | Transient vs persistent changes | 1.2 | in lesson |
