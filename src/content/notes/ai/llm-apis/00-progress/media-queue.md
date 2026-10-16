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

Output folder: `public/notes/media/llm-apis/manim/`.

| Code | File | Video | Misunderstanding it fixes | Lesson | Status |
|---|---|---|---|---|---|
| M01 | `m01-tool-pairing.mp4` | Tool calls and results paired by id | "Each result can go anywhere in the history." | 1.2 | in lesson (0:55) |
| M02 | `m02-stream-assembly.mp4` | Building a message from stream events | "Each stream event is a usable piece of the answer." | 2.1 | prompt given |
| M03 | `m03-agent-loop-cache-share.mp4` | Why most agent input tokens are cache reads | "Prompt caching helps little in an agent loop." | 4.2 | prompt given |
