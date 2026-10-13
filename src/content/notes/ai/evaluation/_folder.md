---
title: "Evaluating AI Systems"
order: 6
summary: "How to prove that an AI system works: fake and real models, controls, strict scoring, independent audits and the statistics of pass rates."
---

## Goal

Design tests that prove a claim about an AI system and cannot pass by accident. Know what a fake model can prove and what only the real model can prove. Read a pass rate with its confidence interval.

## Finish line

I master the subject when all 5 items are true, with no notes and no AI.

- [ ] Say for five claims whether a fake model or the real model must test it, with the reason.
- [ ] Design a live test with random data, a control and strict scoring.
- [ ] Write an independent audit that checks the scoring of another test.
- [ ] Compute a 95% confidence interval for 3/3, 18/20 and 20/20, and say what each result proves.
- [ ] Compute the number of runs that a test needs to detect a given failure rate.

## Folders

| Folder | Content |
|---|---|
| [00 Progress](/notes/ai/evaluation/00-progress) | Session log, mistakes, weak areas |
| [Course plan](/notes/ai/evaluation/course-plan) | The map of all parts and the study order |
| [Glossary](/notes/ai/evaluation/glossary) | Every term, with a plain meaning |
| [01 Test design](/notes/ai/evaluation/01-test-design) | Fake vs real model, random data, controls, strict scoring, audits |
| [02 Statistics](/notes/ai/evaluation/02-statistics) | Pass rates, confidence intervals, power |

## Sources

- Statistics texts on the binomial confidence interval (Wilson and Clopper-Pearson intervals).
- The lessons name further sources when they are written.

## Conventions

### Color legend

Every diagram, figure and video in this subject uses these colors.

| Element | Color |
|---|---|
| System prompt and instructions | purple `#6A4C93` |
| User message | blue `#1E6091` |
| Assistant message (model output) | ink `#100D12` |
| Tool call and tool result | teal `#2A9D8F` |
| Stored state: database row, session file, checkpoint | green `#2D6A4F` |
| Model provider and API | gold `#B8860B` |
| Transient view (exists for one call only) | gray, dashed `#8A8A8A` |
| Error, data loss, bug | red `#C81D25` |

The `plot` graphs can use only the site colors: red `#C81D25`, blue `#1E6091`, gold `#B8860B`, ink `#100D12` and purple `#6A4C93`. Each graph title names its colors.

### Project stage codes

Each lesson row has a stage code. The codes come from the project plan that this study supports. They tell when the project needs the idea.

| Code | Meaning |
|---|---|
| Now | The current step of the project needs it. |
| A, B, D, E | A later, named step of the project needs it. |
| Later | The project needs it after the main steps. |
| Know only | Know what it is and why the project does not use it. No exercise. |

### Facts that change

1. Every SDK version, model name, default value and product feature has a "checked on" date. These facts change often.
2. Each lesson names its primary source: official documentation, a specification, or the source code of the library.
3. When the documentation and the source code disagree, the lesson shows both and says which one the code follows.

### Code

1. I write all the exercise code myself. The lab folder is `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, with one notebook folder for each subject.
2. Hints come in three levels, in chat only: idea, pseudocode, partial code.
3. The lessons never show a full solution to an exercise before I try it.
