---
title: "Python for AI Services"
order: 1
summary: "asyncio, async generators, calling async code from sync code, FastAPI streaming responses, uv and pytest."
---

## Goal

Explain and use the Python runtime features that an agent service needs: the asyncio event loop, async generators, the bridge between sync and async code, server-sent events with FastAPI, uv projects and pytest tests.

## Finish line

I master the subject when all 6 items are true, with no notes and no AI.

- [ ] Explain the event loop, coroutines and tasks. Predict the order of output of a small async program.
- [ ] Write an async generator and consume it.
- [ ] Call an async SDK from sync code in a worker thread, and explain why asyncio.run fails inside a running loop.
- [ ] Stream server-sent events from FastAPI with StreamingResponse.
- [ ] Create a uv project, add dependencies and run a script.
- [ ] Write pytest tests with fixtures, monkeypatch and conftest.py.

## Folders

| Folder | Content |
|---|---|
| [00 Progress](/notes/software-engineering/python/00-progress) | Session log, mistakes, weak areas |
| [Course plan](/notes/software-engineering/python/course-plan) | The map of all parts and the study order |
| [Glossary](/notes/software-engineering/python/glossary) | Every term, with a plain meaning |
| [01 asyncio](/notes/software-engineering/python/01-asyncio) | Event loop, coroutines, async generators, sync and async bridges |
| [02 Web streaming](/notes/software-engineering/python/02-web-streaming) | FastAPI StreamingResponse and server-sent events |
| [03 Tooling](/notes/software-engineering/python/03-tooling) | uv, pyproject.toml, pytest |

## Sources

- Python asyncio documentation: https://docs.python.org/3/library/asyncio.html (checked on 2026-10-12)
- FastAPI documentation: https://fastapi.tiangolo.com (checked on 2026-10-12)
- uv documentation: https://docs.astral.sh/uv/ (checked on 2026-10-12)
- pytest documentation: https://docs.pytest.org (checked on 2026-10-12)

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
