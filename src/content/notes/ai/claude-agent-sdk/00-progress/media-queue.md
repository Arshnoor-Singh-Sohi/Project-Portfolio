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

Output folder: `public/notes/media/claude-agent-sdk/manim/`.

| Code | File | Video | Misunderstanding it fixes | Lesson | Status |
|---|---|---|---|---|---|
| M01 | `m01-agent-loop.mp4` | One answer with two tool-use turns | "An agent is one model call." | 1.2 | in lesson (0:59) |
| M02 | `m02-resume-continue-fork.mp4` | resume, fork and continue on a session timeline | "continue means this chat." | 4.2 | in lesson (0:49) |
| M03 | `m03-system-prompt-snapshot.mp4` | The recorded system prompt on resume | "A new append text applies on the next message." | 5.1 | in lesson (0:49) |

## SVG figures

Output folder: `public/notes/media/claude-agent-sdk/figures/`.

| Code | File | Figure | Lesson | Status |
|---|---|---|---|---|
| F01 | `sdk-architecture.svg` | The architecture: Python process, CLI subprocess, model API, session file | 1.1 | in lesson |
