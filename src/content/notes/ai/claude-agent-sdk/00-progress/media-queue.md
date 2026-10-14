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

The prompts are in the repository file `Claude outputs/agent-harness-manim-prompts.md`, and on the Manim prompts page that Claude published for this study list (October 2026). This subject is group 2. To make its videos, paste one line into Claude Code: `Read "Claude outputs/agent-harness-manim-prompts.md" and follow its run rules. Make group 2 only.` Claude Code skips every video whose file already exists. Every video is 1920x1080 at 30 fps.

## Manim videos

Output folder: `public/notes/media/claude-agent-sdk/manim/`.

| Code | File | Video | Misunderstanding it fixes | Lesson | Status |
|---|---|---|---|---|---|
| M01 | `m01-agent-loop.mp4` | One answer with two tool-use turns | "An agent is one model call." | 1.2 | in lesson (0:59) |
| M02 | `m02-resume-continue-fork.mp4` | resume, fork and continue on a session timeline | "continue means this chat." | 4.2 | in lesson (0:49) |
| M03 | `m03-system-prompt-snapshot.mp4` | The recorded system prompt on resume | "A new append text applies on the next message." | 5.1 | in lesson (0:49) |
| M04 | `m04-tools-vs-allowed-tools.mp4` | Two gates: what exists and what runs | "allowed_tools limits the agent to the listed tools." | 2.1 | prompt given |
| M05 | `m05-in-process-tool-round-trip.mp4` | An in-process tool call: name, path and the shared event loop | "The tool runs inside the CLI, and a slow tool only slows itself." | 3.1 | prompt given |
| M06 | `m06-auto-compaction.mp4` | Auto-compaction in a 1M window | "With a 1M window the conversation stays complete until 1,000,000 tokens." | 6.1 | prompt given |
| M07 | `m07-subagent-context-isolation.mp4` | Subagents keep large tool outputs out of the main context | "A subagent shares the main conversation." | 8.2 | prompt given |

## SVG figures

Output folder: `public/notes/media/claude-agent-sdk/figures/`.

| Code | File | Figure | Lesson | Status |
|---|---|---|---|---|
| F01 | `sdk-architecture.svg` | The architecture: Python process, CLI subprocess, model API, session file | 1.1 | in lesson |
