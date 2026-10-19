---
title: "Recursive Self-Improvement in AI Agents"
order: 8
summary: "From zero background to research level: what recursive self-improvement is, how self-improving agents work, the mathematics, the papers, the code, the failure modes, and eight projects to build."
---

## Start here

This subject teaches recursive self-improvement (RSI) in AI agents from first principles. RSI is improvement in which the improved system does the next improvement. The subject assumes no background. It starts with the question "what is a program?" and ends with open research problems.

The goal is a deep, accurate mental model, not a list of definitions. After this subject you can explain RSI to another engineer and read a new paper critically. You can also follow a real codebase, judge a proposed design, find its failure modes and build a small experiment.

> [!key] The one idea that runs through every part
> There are two kinds of improvement. The first improves an **output**: one answer gets better. The second improves the **process that makes outputs**: every later answer gets better. RSI goes one step further. The process that makes improvements is itself improved, and the improved process makes the next improvement.

## How to use this subject

1. Read the parts in order. Each part uses the ideas of the parts before it. The [course plan](/notes/ai/recursive-self-improvement/course-plan) shows the map and the reading time of every page.
2. In each lesson, read the learning objectives and the prerequisites first. Open a prerequisite when a term is new to you.
3. Answer each check question before you click REVEAL ANSWER. A wrong answer tells you what to read again.
4. Use the [glossary](/notes/ai/recursive-self-improvement/glossary) when a term is not clear.
5. Do the projects of Part 9 in Labs. Write the code yourself. The [reference solutions](/notes/ai/recursive-self-improvement/09-build-it/solutions) are for after an honest attempt.
6. Read `00 Progress` before each study session. It holds the session log, the mistakes and the weak areas.

If you already know machine learning and agents, the course plan gives a shorter path. Do not skip Part 2, Part 3 and Part 8.

## Finish line

I master the subject when all 12 items are true, with no notes and no AI.

- [ ] Explain RSI from first principles in five minutes, with the difference between improving an output and improving the process that makes outputs.
- [ ] Give four definitions of RSI from the literature and say where they disagree.
- [ ] Place any described system on the seven-level ladder, draw its system boundary and name its frozen core.
- [ ] Draw the eleven components of a self-improving system and trace one iteration of the Darwin Gödel Machine through its code.
- [ ] Compute the standard error of a benchmark score and the winner's-curse bias for k candidates, and decide whether a measured gain is real.
- [ ] Write STOP's meta-utility and the Darwin Gödel Machine's parent-selection rule, and compute both for a small example.
- [ ] Compare the major approaches by what changes, what stays fixed, what feedback they use and what evidence supports them.
- [ ] For any RSI paper, say what its results show and what they do not show.
- [ ] Name at least ten failure modes, each with a documented example, a way to detect it and a way to reduce the risk.
- [ ] Build in Labs a self-improvement loop with an acceptance rule, regression tests and an archive, and an improver that improves itself. Explain why it plateaus.
- [ ] Design a safe self-improvement experiment with a frozen evaluator, held-out tests, budgets and ablations.
- [ ] Read a new RSI paper with the critical checklist and write a one-page review of it.

## Folders

| Folder | Content |
|---|---|
| [00 Progress](/notes/ai/recursive-self-improvement/00-progress) | Session log, mistakes, weak areas, media queue |
| [Course plan](/notes/ai/recursive-self-improvement/course-plan) | The map of all parts, study paths and reading times |
| [Glossary](/notes/ai/recursive-self-improvement/glossary) | Every term, with a plain meaning and the lesson that introduces it |
| [Sources and reading list](/notes/ai/recursive-self-improvement/sources) | Every primary source, grouped by topic, and what to read first |
| [Video guide](/notes/ai/recursive-self-improvement/videos) | Verified videos for each part, in study order |
| [01 Foundations](/notes/ai/recursive-self-improvement/01-foundations) | Programs, models, language models, agents, feedback loops, optimization, recursion, training, evaluation, measurement |
| [02 The core idea of RSI](/notes/ai/recursive-self-improvement/02-core-idea) | Definitions, the ladder of levels, the system boundary, examples and non-examples, history |
| [03 How an RSI system works](/notes/ai/recursive-self-improvement/03-anatomy) | The components, one iteration step by step, archives, meta-levels and the frozen core |
| [04 The mathematics of improvement](/notes/ai/recursive-self-improvement/04-mathematics) | Objectives, update rules, evaluation under noise, improvement dynamics, optimizing the improver |
| [05 Major approaches](/notes/ai/recursive-self-improvement/05-approaches) | Self-critique, memory, prompt search, workflow search, code self-modification, evolution, training, meta-learning, roles |
| [06 Research systems and papers](/notes/ai/recursive-self-improvement/06-research-systems) | One page per important paper, from the Gödel machine to the Darwin Gödel Machine |
| [07 Real implementations](/notes/ai/recursive-self-improvement/07-implementations) | Code walkthroughs of STOP, ADAS, DGM, SICA, Gödel Agent and OpenEvolve |
| [08 Failure modes and safety](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety) | Goodhart, reward hacking, evaluation failures, drift, unsafe self-modification, controls and governance |
| [09 Build RSI systems yourself](/notes/ai/recursive-self-improvement/09-build-it) | Eight projects in Labs, from a fixed agent to an improver that improves itself |
| [10 Advanced understanding and research](/notes/ai/recursive-self-improvement/10-advanced) | Conditions for sustained improvement, optimized evaluators, open problems, advanced exercises |

## Conventions

### Evidence labels

The pages keep facts, assumptions, hypotheses and opinions apart. A bold label marks the kind of statement when it is not obvious.

| Label | Meaning |
|---|---|
| **Measured:** | A result of an experiment. The source is next to it. |
| **Claimed:** | What authors state without strong evidence. |
| **Theory:** | A proof or a formal argument. |
| **Speculation:** | An idea with no evidence yet. |
| **Our interpretation:** | A conclusion of these notes, not of a source. |

A number that a research file could not confirm is marked "not verified". A number read by eye from a figure is marked "approximate".

### Sources and dates

1. Every claim about a paper has its source next to it, and every page ends with a References section.
2. The research for this subject was done on 2026-10-19. Facts that change quickly, such as policy versions and model names, carry the note "checked on 2026-10-19".
3. The code walkthroughs name the commit they read. Line numbers refer to that commit.

### One word for one idea

The pages use a fixed vocabulary. For example, a **candidate** is a proposed new version that is not yet accepted. The **improver** is the procedure that makes candidates and chooses among them. The **acceptance rule** decides if a candidate is kept. The **archive** holds the kept versions. The [glossary](/notes/ai/recursive-self-improvement/glossary) lists every term.

### Color legend

Every diagram, figure and video in this subject uses these colors.

| Element | Color |
|---|---|
| The agent or system that is improved (versions, candidates) | blue `#1E6091` |
| Evaluator, tests, benchmark, objective | gold `#B8860B` |
| Proposer and improver (the meta level) | purple `#6A4C93` |
| Archive, memory, persistent state | green `#2D6A4F` |
| Environment and tasks | gray `#8A8A8A` |
| Accepted change | teal `#2A9D8F` |
| Rejected change, failure, risk | red `#C81D25` |
| Text and neutral lines | ink `#100D12` |

The `plot` graphs can use only the site colors: red, blue, gold, ink and purple. A graph has no legend, so its title names its colors.

### Labs

Part 9 has eight Labs templates, `rsi-01-fixed-agent` to `rsi-08-improve-the-improver`. They run Python in the browser. They need no API key and no model, because a seeded random proposer stands in for a language model. So every result repeats exactly.

### Media

All media of this subject is in `/notes/media/recursive-self-improvement/`.

| Folder | What it holds |
|---|---|
| `figures/` | SVG diagrams, one per lesson that lists a figure. |
| `manim/` | Short animations. Each one fixes one named misunderstanding. |

The [media queue](/notes/ai/recursive-self-improvement/00-progress/media-queue) tracks every file.
