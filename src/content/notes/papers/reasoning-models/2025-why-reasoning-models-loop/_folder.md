---
title: "Why Reasoning Models Loop (2025)"
order: 2025
summary: "Why reasoning models repeat the same text at low temperature: errors in learning cause loops, and temperature reduces the loops without fixing the errors."
---

## The paper

| Field | Value |
|---|---|
| Title | Wait, Wait, Wait... Why Do Reasoning Models Loop? |
| Authors | Charilaos Pipis, Shivam Garg, Vasilis Kontonis, Vaishnavi Shrivastava, Akshay Krishnamurthy, Dimitris Papailiopoulos. Pipis and Garg made an equal contribution. |
| Institutions | MIT, Microsoft Research, University of Wisconsin-Madison |
| First version | [arXiv 2512.12895](https://arxiv.org/abs/2512.12895), 15 December 2025, category cs.LG |
| Version in these notes | arXiv version 1, 15 December 2025. It was the only version on 14 October 2026. |
| Published | Proceedings of the 43rd International Conference on Machine Learning (ICML 2026), PMLR volume 306, pages 98934–98964. [OpenReview oZWE7mSqlk](https://openreview.net/forum?id=oZWE7mSqlk) |
| Code and data | The paper and its PMLR page give no code repository (checked on 14 October 2026). |

## The result in three sentences

1. On 13 open models and AIME problems, every reasoning model repeats the same text under greedy decoding. Small distilled students loop much more than their teachers, and higher temperatures reduce the loops.
2. On a small graph task with known training data, the authors show two ways in which errors in learning cause loops. They are **risk aversion from hardness of learning** and **temporally correlated errors**.
3. Temperature reduces looping because it makes the model explore, but it does not fix the learned probabilities. So the authors call temperature a **stopgap** and suggest fixes at training time.

![The paper at a glance: the question, the open-model study, the two mechanisms on the star graph, the catalyst, the temperature verdict and the engineering lessons](/notes/media/papers/2025-why-reasoning-models-loop/figures/overview.svg)

## Reading order

| # | Page | The question it answers | Status |
|---|---|---|---|
| 00 | [The paper on one page](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/00-paper-on-one-page) | What must I remember, and how do I teach it in one minute? | not started |
| 01 | [Background: probability and next-token prediction](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/01-background-probability-and-next-token-prediction) | What is a probability, a logarithm, a softmax and a state? | not started |
| 02 | [Background: decoding, greedy, temperature and sampling](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/02-background-decoding-greedy-temperature-sampling) | How does a rule choose the next token, and why can a rule without chance repeat forever? | not started |
| 03 | [Background: training, cross-entropy and distillation](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/03-background-training-cross-entropy-and-distillation) | How does training set the probabilities, and how does a student learn from a teacher? | not started |
| 04 | [Background: reasoning models](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/04-background-reasoning-models) | What is a reasoning model, and which models and benchmarks does the paper use? | not started |
| 05 | [The question](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/05-the-question) | Why do reasoning models loop, and is temperature a cure? | not started |
| 06 | [Experiment design](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/06-experiment-design) | How did the authors measure real models, and how did they build the star-graph task? | not started |
| 07 | [Results: looping in open models](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/07-results-looping-in-open-models) | Which models loop, at which temperatures, and on which problems? | not started |
| 08 | [Why 1: risk aversion from hardness of learning](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/08-why-1-risk-aversion) | Why does a student prefer an easy cyclic action when the progress-making action is hard to learn? | not started |
| 09 | [Why 2: temporally correlated errors](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/09-why-2-temporally-correlated-errors) | How can a model loop when no action is hard? | not started |
| 10 | [The catalyst: confidence that grows inside a loop](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/10-the-catalyst-growing-confidence) | Why does a loop become harder to leave after it starts? | not started |
| 11 | [Temperature: a stopgap, not a cure](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/11-temperature-stopgap-or-cure) | What does temperature fix, what does it not fix, and what could fix the cause? | not started |
| 12 | [Engineering takeaways](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/12-engineering-takeaways) | What do I change in the agents and services that I build on reasoning models? | not started |
| 13 | [Limits and later work](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/13-limits-and-later-work) | How far can I trust each claim, and what did later papers find? | not started |
| 14 | [Reproduce it](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/14-reproduce-it) | How do I rebuild the core results myself? | not started |

If probability, softmax and cross-entropy are new to you, read pages 01 to 03 slowly and do every worked example. Page 08 needs page 03. Page 09 needs the star graph of page 06.

## Conventions

Every figure, plot and new animation for this paper uses these colors.

| Color | In diagrams | In plots |
|---|---|---|
| Blue `#1E6091` | The progress-making action, the correct path | The teacher, or the largest model of a family |
| Red `#C81D25` | The cyclic action (a reset or a restatement), a loop, an error | The smallest student model, for example 1.5B |
| Gold `#B8860B` | The start node, temperature and sampling | The middle model, for example 7B, or a variant |
| Purple `#6A4C93` | The goal node, the perfect learner | The perfect-learner reference, a baseline line |
| Ink `#100D12` | Ordinary nodes and text | A fifth series, if needed |

- A **looping fraction** is a number from 0 to 1: the share of responses that loop. 0.30 means 30% of the responses.
- $T$ is the temperature. $T = 0$ means greedy decoding.
- Numbers from the text, from tables and from the value labels on bars are exact. A value read by eye from a line plot is approximate, and these notes write "approximate" or $\approx$.
- For real models, the plots of the paper give the **response length** in tokens. For the graph task, the paper does not name the unit. These notes read it as a count of nodes (page 06).
- Each page labels three kinds of statements: what the paper measured or proved, what later work found, and the interpretation of these notes.

## Media

| File | What it shows | Page |
|---|---|---|
| `figures/overview.svg` | The paper at a glance: the question, the two parts, the two mechanisms, the catalyst, the temperature verdict and the lessons | this card |
| `figures/star-graph-task.svg` | The star graph $G(5,5)$ with its start node: 22 nodes, 21 edges, the progress-making action and the reset | 06 |
| `manim/m01-greedy-temperature-loop.mp4` | Temperature reshapes four logits, greedy decoding repeats a toy loop, and sampling leaves the loop | 02 |
| `manim/m02-star-graph-random-walk.mp4` | The star graph and a training walk with resets of probability 0.3 | 06 |
| `manim/m03-hard-action-mass-diffuses.mp4` | The hard action's 0.7 spread over five look-alikes, and the greedy loop between the start node and the root | 08 |
| `manim/m04-correlated-errors-loop.mp4` | Small errors at the root that keep the same direction, and the loop that they cause | 09 |
| `manim/m05-confidence-buildup.mp4` | The top-1 probability that climbs inside a loop, and the effect of a tiny looping bias | 10 |
| `manim/m06-temperature-stopgap.mp4` | Temperature breaks the start-root loop, but the walk stays about four times longer than a perfect learner's | 11 |

All media is in `/notes/media/papers/2025-why-reasoning-models-loop/`.

## Source

The paper is on [arXiv](https://arxiv.org/abs/2512.12895v1). These notes do not copy the figures of the paper. The plots rebuild the figures from the numbers in the text, the tables and the bar labels.
