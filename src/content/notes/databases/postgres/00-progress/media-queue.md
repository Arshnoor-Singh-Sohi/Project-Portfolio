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

Output folder: `public/notes/media/postgres/manim/`.

| Code | File | Video | Misunderstanding it fixes | Lesson | Status |
|---|---|---|---|---|---|
| M01 | `m01-transaction-all-or-nothing.mp4` | All or nothing: failure, crash and visibility | "A failed second write undoes nothing." | 2.1 | in lesson (1:08) |
| M02 | `m02-lock-queue.mp4` | The lock queue: a 2 ms ALTER TABLE that stops every read | "ADD COLUMN with a constant default is safe on a live table." | 4.1 | prompt given |
| M03 | `m03-btree-descent.mp4` | Inside a B-tree: 3 index pages and 1 heap page for one row among 1,049,965 | "A bigger index means a slower lookup." | 6.1 | prompt given |
| M04 | `m04-composite-index-order.mp4` | Column order in a two-column index decides how much of it a query reads | "An index on (a, b) serves any query on a or b." | 6.2 | prompt given |
| M05 | `m05-seq-vs-index-crossover.mp4` | Seq Scan, Index Scan, Bitmap Scan: where the crossover lies | "An index scan is always faster than reading the whole table." | 6.3 | prompt given |
| M06 | `m06-reading-explain-analyze.mp4` | Reading EXPLAIN ANALYZE: per-loop numbers, buffer totals, and a DELETE that really runs | "The rows and time of an inner node are totals." | 6.4 | prompt given |
| M07 | `m07-cascade-delete-fk-index.mp4` | ON DELETE CASCADE: one child lookup per deleted parent row | "The foreign key already has an index, because the parent has a primary key." | 6.5 | prompt given |
