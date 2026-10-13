---
title: "Media queue"
order: 4
summary: "Every planned Manim video, PaperBanana figure and chat SVG figure, the lesson that uses it, and its status."
---

## How a video or figure is made

1. Claude writes a prompt for Claude Code. The prompt names the misunderstanding, the scenes in order, the color legend and the output path.
2. I run the prompt in Claude Code in the background, one session at a time on this repository.
3. Claude Code renders the file, watches it, fixes visual problems and reports the duration.
4. Claude adds a `video` block or an image to the lesson and changes the status here.

Status values: **planned**, **prompt given**, **rendered**, **in lesson**.

## Manim videos

Output folder: `public/notes/media/context-engineering/manim/`. Prompts: M01–M04 in `part01-manim.md`, M05–M11 in `part04-06-manim.md`, M12–M17 in `part07-09-manim.md`.

| Code | File | Video | Misunderstanding it fixes | Lesson | Status |
|---|---|---|---|---|---|
| M01 | `m01-payload-grows.mp4` | The payload grows on each call | "The model remembers the chat." | 1.3 | in lesson (0:50) |
| M02 | `m02-attention-pairs.mp4` | Attention pairs and the KV cache | "Twice the tokens means twice the work." | 1.4 | in lesson (0:57) |
| M03 | `m03-position-vs-length.mp4` | Position effect vs length effect | "Lost in the middle and context rot are the same thing." | 1.5 | in lesson (1:12) |
| M04 | `m04-prefix-cache.mp4` | Prefix caching: hit, miss, invalidation | "Caching works if the same text appears anywhere." | 1.7 | in lesson (0:57) |
| M05 | `m05-chunking-window.mp4` | Chunking window and overlap | "Overlap is free." | 4.5 | rendered (lesson not written yet) |
| M06 | `m06-cosine-vs-distance.mp4` | Cosine vs distance, and normalization | "Cosine and Euclidean distance always rank differently." | 4.6 | prompt given: only a 480p preview exists in `Downloads\context_engineering_manim`. Render the 1080p final. |
| M07 | `m07-rrf-fusion.mp4` | RRF fuses two ranked lists | "You can add raw scores from two retrievers." | 5.2 | rendered (lesson not written yet) |
| M08 | `m08-mmr-picks.mp4` | MMR picks for λ = 1, 0.7, 0.5, 0.3 | "Top-k is always the best set." | 5.5 | rendered (lesson not written yet) |
| M09 | `m09-tool-loop.mp4` | The tool-call loop and the security boundary | "The model runs the tool." | 6.2 | rendered (lesson not written yet) |
| M10 | `m10-react-fills-window.mp4` | ReAct iterations fill the window | "Agent steps are free." | 6.6 | rendered (lesson not written yet) |
| M11 | `m11-n-by-m.mp4` | N×M integrations become N+M | "MCP is just function calling." | 6.7 | rendered (lesson not written yet) |
| M12 | `m12-compaction-sawtooth.mp4` | Compaction and tool-result clearing | "Compression means deletion." | 7.2, 7.3 | prompt given |
| M13 | `m13-orchestrator.mp4` | Orchestrator and sub-agents | "Multi-agent systems use fewer tokens." | 7.7 | prompt given |
| M14 | `m14-memory-strategies.mp4` | Memory strategies side by side | "A summary keeps everything that matters." | 8.5 | prompt given |
| M15 | `m15-context-collapse.mp4` | Context collapse vs delta updates | "Rewriting a summary again and again is safe." | 8.7 | prompt given |
| M16 | `m16-validation-gates.mp4` | Validation gates in order | "Run all the checks at the end." | 9.4 | prompt given |
| M17 | `m17-cohens-kappa.mp4` | Cohen's kappa from a 2×2 table | "High percent agreement means a good judge." | 9.6 | prompt given |

## PaperBanana figures

Output folder: `public/notes/media/context-engineering/paperbanana/`. Prompt: `paperbanana-figures.md`.

| Code | File | Figure | Lesson | Status |
|---|---|---|---|---|
| F01 | `f01-llm-os.png` | The LLM OS model | 2.2 | prompt given |
| F02 | `f02-six-elements.png` | The six elements in one window | 2.3 | prompt given |
| F03 | `f03-four-strategies.png` | Write, select, compress, isolate | 4.1 | prompt given |
| F04 | `f04-context-stack.png` | The context stack | 3.6 | prompt given |
| F05 | `f05-rag-pipeline.png` | The RAG pipeline: offline and online | 4.4 | prompt given |
| F06 | `f06-hybrid-retrieval.png` | Hybrid retrieval funnel | 5.3 | prompt given |
| F07 | `f07-mcp-architecture.png` | MCP host, clients and servers | 6.7 | prompt given |
| F08 | `f08-memory-architecture.png` | Memory architecture | 8.2 | prompt given |
| F09 | `f09-orchestrator.png` | Orchestrator and sub-agents | 7.7 | prompt given |
| F10 | `f10-prp-workflow.png` | The PRP workflow | 9.3 | prompt given |
| F11 | `f11-capstone-map.png` | Capstone map | 10 | prompt given |

## SVG figures made in chat

Output folder: `public/notes/media/context-engineering/figures/`. Claude makes these in chat, renders each one to PNG, and checks it before saving.

| File | Figure | Lesson | Status |
|---|---|---|---|
| `window-anatomy.svg` | One call: what fills the context window | 1.1 | in lesson |
