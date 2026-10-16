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

Output folder: `public/notes/media/databricks/manim/`.

| Code | File | Video | Misunderstanding it fixes | Lesson | Status |
|---|---|---|---|---|---|
| M01 | `m01-app-instances-and-affinity.mp4` | Instances, routing and local session files | "The app always finds its local session file on the next message." | 1.3 | prompt given |
| M02 | `m02-config-precedence.mp4` | Where the Python SDK and the CLI take the host and the token from | "WorkspaceClient(profile='prod') uses only the prod profile." | 2.1 | prompt given |
| M03 | `m03-asyncio-run-in-a-running-loop.mp4` | asyncio.run inside a running event loop | "list_tools() is an ordinary blocking call that is safe anywhere." | 4.1 | prompt given |
| M04 | `m04-lakebase-token-rotation.mp4` | LakebasePool token rotation | "When the token expires, every pooled connection stops working." | 5.3 | prompt given |
