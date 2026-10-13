---
title: "Session log"
order: 1
summary: "What happened in each paper session, newest first."
status: in-progress
---

## Session 1: 2026-10-12

**Paper:** [Lost in the Middle (2023)](/notes/papers/long-context/2023-lost-in-the-middle)

**Topic:** the Papers area was created, and the notes for the first paper were written.

### My request

> "Manage the resources really properly find best way maybe in papers folder on folder of this paper and section furher in sit however you feel like think of system design percpective as in future we will add more sectioons and keep on expanding the notes."

### Decisions

- A new area `papers/` sits next to `maths/`.
- Inside `papers/`, each topic has a folder. The first topic is `long-context/`.
- Each paper has a folder whose name starts with the year: `2023-lost-in-the-middle/`.
- Every paper folder uses the same set of pages. [How to read a paper](/notes/papers/reading-method) lists them.
- All papers share one glossary and one `00 Progress` folder.
- Media for a paper goes in `/notes/media/papers/<paper folder>/`. It has two sub-folders: `figures/` for images that Claude makes in chat, and `manim/` for videos from Claude Code.
- The plots use exact numbers from the tables in the paper's appendix. A plot that uses numbers read from a figure says "approximate" in its title.

### Change of plan for the figures

PaperBanana could not run in Claude Code: the program was not installed, and no image API key was set. My instruction:

> "Forget banana you create images and store them there"

- Claude made the two figures in chat as SVG: `figures/overview.svg` and `figures/experiment-design.svg`. Every label comes from the notes.
- PaperBanana is no longer part of the notes system.

### Open

- Diagnostic for the background pages: not started.
- Manim videos: the prompt is given for Claude Code. The videos are not made yet.
