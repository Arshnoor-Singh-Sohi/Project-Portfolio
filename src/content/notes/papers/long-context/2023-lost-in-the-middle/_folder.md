---
title: "Lost in the Middle (2023)"
order: 2023
summary: "How language models use long contexts: accuracy is highest when the needed information is at the start or the end, and lowest in the middle."
---

## The paper

| Field | Value |
|---|---|
| Title | Lost in the Middle: How Language Models Use Long Contexts |
| Authors | Nelson F. Liu, Kevin Lin, John Hewitt, Ashwin Paranjape, Michele Bevilacqua, Fabio Petroni, Percy Liang |
| Institutions | Stanford University, University of California Berkeley, Samaya AI |
| First version | [arXiv 2307.03172](https://arxiv.org/abs/2307.03172), July 2023 |
| Version in these notes | arXiv version 3, 20 November 2023 |
| Published | Transactions of the Association for Computational Linguistics (TACL), volume 12, pages 157–173, 2024. [ACL Anthology](https://aclanthology.org/2024.tacl-1.9/) |
| Code and data | [github.com/nelson-liu/lost-in-the-middle](https://github.com/nelson-liu/lost-in-the-middle) (MIT license) |

## The result in three sentences

1. The authors put one useful document among many useless documents, and they moved the useful document from the first position to the last.
2. Accuracy was highest when the useful document was first or last, and lowest when it was in the middle: a **U-shaped curve**.
3. So a model with a long context window does not use all of its context equally well. A system that fills a long context must care about **where** it puts information.

![The paper at a glance: two tasks, two dials (position and length), one U-shaped result, four suspected causes and the engineering lessons](/notes/media/papers/2023-lost-in-the-middle/figures/overview.svg)

## Reading order

| # | Page | The question it answers | Status |
|---|---|---|---|
| 00 | [The paper on one page](/notes/papers/long-context/2023-lost-in-the-middle/00-paper-on-one-page) | What must I remember, and how do I teach it in one minute? | not started |
| 01 | [Background: language models and context](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) | What is a token, a context window, a base model, RAG? | not started |
| 02 | [Background: attention and position](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) | How does a token read other tokens, and how does a model know the order? | not started |
| 03 | [The question](/notes/papers/long-context/2023-lost-in-the-middle/03-the-question) | What did the authors want to find, and why did it matter in 2023? | not started |
| 04 | [Experiment design](/notes/papers/long-context/2023-lost-in-the-middle/04-experiment-design) | How did they build the two tasks, and which models did they test? | not started |
| 05 | [Results: multi-document QA](/notes/papers/long-context/2023-lost-in-the-middle/05-results-multi-document-qa) | What happens to accuracy when the answer document moves? | not started |
| 06 | [Results: key-value retrieval](/notes/papers/long-context/2023-lost-in-the-middle/06-results-key-value-retrieval) | Can a model at least copy an exact match from the middle? | not started |
| 07 | [Why it happens](/notes/papers/long-context/2023-lost-in-the-middle/07-why-it-happens) | Which causes did they test, and what did they find? | not started |
| 08 | [The more-context trade-off](/notes/papers/long-context/2023-lost-in-the-middle/08-more-context-trade-off) | In real RAG, do more retrieved documents help? | not started |
| 09 | [Engineering takeaways](/notes/papers/long-context/2023-lost-in-the-middle/09-engineering-takeaways) | What do I change in my RAG systems and agents? | not started |
| 10 | [Limits and later work](/notes/papers/long-context/2023-lost-in-the-middle/10-limits-and-later-work) | How far can I trust the result today, and what came after? | not started |
| 11 | [Reproduce it](/notes/papers/long-context/2023-lost-in-the-middle/11-reproduce-it) | How do I rebuild the key-value experiment myself? | not started |

If you know transformers well, read page 02 quickly, but do its check questions. Page 07 needs the causal mask from page 02.

## Conventions

Every figure, plot and new animation for this paper uses these colors.

| Color | In diagrams | In plots |
|---|---|---|
| Gold `#B8860B` | The answer document, or the key-value pair to find | MPT-30B-Instruct, or the 30-document setting |
| Ink and grey `#100D12` | Distractor documents | Not used |
| Blue `#1E6091` | The question or the key (the query) | Claude-1.3, or the 20-document setting |
| Red `#C81D25` | A warning | GPT-3.5-Turbo, or the 10-document setting |
| Purple `#6A4C93` | Not used | LongChat-13B (16K), or the closed-book line |

- **Accuracy** is a percent. A difference between two accuracy values is in **points** (percentage points), unless a page says "relative".
- **Position 1** is the first document in the context. The appendix tables of the paper count from **index 0**. Index $n$ is position $n + 1$.
- A plot with values from a table in the paper is exact. A plot with values read by eye from a figure says "approximate" in its title.

## Media

| File | What it shows | Made by |
|---|---|---|
| `figures/prompt-layout.svg` | The parts of a multi-document QA prompt, and how the position changes | Claude (chat) |
| `figures/causal-mask.svg` | Which tokens each token can see in a decoder-only model | Claude (chat) |
| `figures/query-aware.svg` | The causal mask when the question is also before the documents | Claude (chat) |
| `figures/u-curve.svg` | The U-curve of GPT-3.5-Turbo with its labels | Claude (chat) |
| `manim/position-sweep.mp4` | How the U-curve is built, one position at a time | Claude Code (Manim) |
| `manim/causal-attention.mp4` | Why documents are read without the question, and the query-aware fix | Claude Code (Manim) |
| `figures/overview.svg` | The paper at a glance: the question, the two tasks, the dials, the result, the four suspects and the lessons | Claude (chat) |
| `figures/experiment-design.svg` | How the two tasks are built, and the two baselines | Claude (chat) |

All media is in `/notes/media/papers/2023-lost-in-the-middle/`.

## Source

The PDF is on [arXiv](https://arxiv.org/abs/2307.03172). These notes do not copy the figures of the paper. The plots rebuild the figures from the numbers in the appendix tables.
