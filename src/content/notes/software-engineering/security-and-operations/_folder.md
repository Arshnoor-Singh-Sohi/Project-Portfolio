---
title: "Security and Operations"
order: 2
summary: "Identity and ownership checks in web services, and tracing for agents in production."
---

## Goal

Find and fix access-control flaws in a chat service. Explain where a real user identity comes from behind a proxy. Trace an agent in production.

## Finish line

I master the subject when all 4 items are true, with no notes and no AI.

- [ ] Explain why a self-asserted user id is not an identity, and show the attack.
- [ ] Add an owner check to every chat read and write.
- [ ] Explain which proxy headers can be trusted, and why.
- [ ] Trace one agent answer end to end and find the slow step.

## Folders

| Folder | Content |
|---|---|
| [00 Progress](/notes/software-engineering/security-and-operations/00-progress) | Session log, mistakes, weak areas |
| [Course plan](/notes/software-engineering/security-and-operations/course-plan) | The map of all parts and the study order |
| [Glossary](/notes/software-engineering/security-and-operations/glossary) | Every term, with a plain meaning |
| [01 Access control](/notes/software-engineering/security-and-operations/01-access-control) | Self-asserted identity, owner checks, identity headers |
| [02 Observability](/notes/software-engineering/security-and-operations/02-observability) | Tracing agents |

## Sources

- The lessons name their sources when they are written.

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
