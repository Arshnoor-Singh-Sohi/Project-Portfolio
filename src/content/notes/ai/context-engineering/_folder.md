---
title: "LLM Context Engineering"
order: 1
summary: "From tokens to memory: how to fill a model's context window with the right information, and how to prove that it works."
---

## Goal

Design, build, measure and defend the context layer of a production LLM application or agent. The path goes from tokens and attention to retrieval, tools, compression, multi-agent isolation, memory and production evaluation.

A model can only use the tokens in its context window. Context engineering decides which tokens go into that window, in which order and in which format, on every call.

## Finish line

I master the subject when all 12 items are true, with no notes and no AI.

- [ ] Explain how a model reads its window: tokens, statelessness, attention cost, KV cache, prompt caching.
- [ ] Compute the cost of a 50-turn conversation per call and in total, with and without caching. Do it by hand and in code.
- [ ] Explain the position effect, the length effect and stale context. Name the evidence for each. Run a needle test.
- [ ] Map the six elements of context to the API fields of two providers. Audit a failing chatbot with them.
- [ ] Write a system prompt at the right altitude and a CLAUDE.md for a real repo. Improve both against a test set.
- [ ] Build retrieval from scratch: chunker, cosine search, BM25, RRF, MMR. Measure Recall@k and MRR.
- [ ] Write the raw tool-call loop with ReAct guards. Build and secure an MCP server with the current SDK.
- [ ] Implement compaction, tool-result clearing and priority trimming without breaking the message structure. Measure retention.
- [ ] Design a multi-agent system with contracts. Argue when one agent is better.
- [ ] Build three-layer memory (buffer, summary, SQLite facts) with decay, conflicts and user isolation.
- [ ] Run the PRP workflow on a real feature, with validation gates and an eval suite in CI (ground truth set, calibrated judge, Cohen's kappa).
- [ ] Ship the capstone. Debug it from its traces.

## Folders

| Folder | Content |
|---|---|
| [00 Progress](/notes/ai/context-engineering/00-progress) | Session log, mistakes, weak areas, media queue |
| [Course plan](/notes/ai/context-engineering/course-plan) | The map of all parts, and how each session works |
| [Glossary](/notes/ai/context-engineering/glossary) | Every term, with a plain meaning |
| [Sources and corrections](/notes/ai/context-engineering/sources-and-corrections) | Primary sources, and every place where the handbook is wrong or out of date |
| [01 Foundations](/notes/ai/context-engineering/01-foundations) | Tokens, the API call, attention cost, position and length effects, conversation cost, prompt caching |
| [02 Paradigm shift](/notes/ai/context-engineering/02-paradigm-shift) | Definitions, the LLM OS model, the six elements, the quality curve, the context audit |
| [03 System layer](/notes/ai/context-engineering/03-system-layer) | System prompts, the right altitude, rules files, the context stack, few-shot examples |
| [04 Write and RAG](/notes/ai/context-engineering/04-write-and-rag) | The four strategies, WRITE, the RAG pipeline, chunking, embeddings, vector search |
| [05 Retrieval quality](/notes/ai/context-engineering/05-retrieval-quality) | BM25, hybrid search, rerankers, query transformation, MMR, budgets, evaluation |
| [06 Tools and MCP](/notes/ai/context-engineering/06-tools-and-mcp) | The tool-call loop, schemas, many tools, ReAct, MCP, tool security |
| [07 Compress and isolate](/notes/ai/context-engineering/07-compress-and-isolate) | Compaction, tool-result clearing, trimming, budgets, sub-agents, contracts, metrics |
| [08 Memory](/notes/ai/context-engineering/08-memory) | Memory types, scoring and decay, tiers, strategies, persistence, ACE, a memory agent |
| [09 Production](/notes/ai/context-engineering/09-production) | Context as code, the PRP workflow, validation, Claude Code mechanisms, evaluation, observability |
| [10 Capstone](/notes/ai/context-engineering/10-capstone) | A research assistant agent, built in eight milestones |
| [11 Research track](/notes/ai/context-engineering/11-research-track) | Nine optional experiments with measurements |

## Sources

- **Main map:** "LLM Context Engineering Handbook", Dr. Sreedath Panat, Vizuara AI Labs, March 2026. 390 pages: 7 sessions, each with lecture notes and a 50-question FAQ. Copy: `C:\Users\ASohi\Downloads\LLM-Context-Engineering-Handbook_compressed.pdf`.
- **Workshop lab:** `C:\Users\ASohi\Downloads\Session_1_LLM_Context_Engineering.ipynb` (Session 1 labs).
- **Research topics:** `C:\Users\ASohi\Downloads\LLM context engineering research bootcamp topics.pdf`.
- **Primary sources:** papers, specifications and official documentation. The list is in [Sources and corrections](/notes/ai/context-engineering/sources-and-corrections).

> [!trap] The handbook is a map, not a source of exact facts
> Many numbers, attributions and code listings in the handbook are wrong or out of date. Each lesson teaches the corrected version and names its primary source. The [Sources and corrections](/notes/ai/context-engineering/sources-and-corrections) page lists every correction.

## Conventions

### Color legend

Every diagram, video and figure in this subject uses these colors.

| Element | Color |
|---|---|
| System instructions | purple `#6A4C93` |
| User input | blue `#1E6091` |
| Conversation history | gray `#8A8A8A` |
| Retrieved knowledge | gold `#B8860B` |
| Tools: definitions and results | teal `#2A9D8F` |
| State and memory | green `#2D6A4F` |
| Output reserve (free space for the answer) | white with an outline |
| Warning, waste, rot | red `#C81D25` |

The `plot` graphs can use only the site colors: red `#C81D25`, blue `#1E6091`, gold `#B8860B`, ink `#100D12` and purple `#6A4C93`. Each graph title names its colors.

### Source labels

Each claim from the handbook has one of three labels:

| Label | Meaning |
|---|---|
| **Confirmed** | A primary source supports the claim. The lesson names the source. |
| **Corrected** | A primary source contradicts the claim. The lesson gives the correct version and the source. |
| **Rule of thumb** | No source supports or contradicts the claim. Use it as a starting point, then measure. |

### Units and numbers

1. Token counts name the tokenizer, for example "tiktoken `o200k_base`".
2. Prices are in US dollars per million tokens, written "USD 3 / MTok". The dollar sign starts math on this site, so the notes do not use it.
3. "MTok" means one million tokens. "K" means one thousand tokens.
4. Every price, model name, SDK version and product feature carries a "checked on" date. These facts change often.

### Media

All media for this subject is in `/notes/media/context-engineering/`.

| Folder | What it holds | Made by |
|---|---|---|
| `figures/` | SVG diagrams | Claude in chat. Each SVG is rendered to PNG and checked before it is saved. |
| `manim/` | Videos | Claude Code (Manim), from a prompt that Claude writes |
| `paperbanana/` | Polished figures | Claude Code (PaperBanana), from a prompt that Claude writes |

The [media queue](/notes/ai/context-engineering/00-progress/media-queue) tracks every file.

### Code

1. I write all the lab code myself. The lab repository is `C:\Users\ASohi\Downloads\AI\context-engineering-lab`: notebooks in `notebooks/`, reusable modules in `src/`, tests in `tests/`, the capstone in `capstone/`.
2. Hints come in three levels, in chat only: idea, pseudocode, partial code.
3. The labs use one provider adapter. Anthropic is the first provider. OpenAI-compatible APIs are the second.
4. Retrieval labs use local embedding models, so they cost nothing.
5. Package versions are pinned.
