---
title: "AI Engineering Roadmap 2026"
order: 0
summary: "The AI Engineer Roadmap 2026, level by level: from software engineering fundamentals to interview preparation. Level 0 is written."
---

## Goal

Become an AI engineer who can solve a real AI engineering problem from an empty editor. That means: design the solution, write the code, debug it, test it, explain it, deploy it and defend each decision.

This subject follows the 16 levels of the AI Engineer Roadmap 2026 (https://ai-engineer-roadmap-2026.vercel.app/). Each level is one part folder. The lessons explain the ideas in my own words, from first principles, with measured examples and official sources.

## Finish line

I master the subject when each part's finish line is true, with no notes and no AI. Level 0 has its own list on its [part page](/notes/ai/ai-engineering/01-software-engineering-fundamentals).

- [ ] L0 Software engineering fundamentals: ship a no-AI REST service.
- [ ] L1 to L15: written when each level starts.

## Folders

| Folder | Content | Status |
|---|---|---|
| [00 Progress](/notes/ai/ai-engineering/00-progress) | Session log, mistakes, weak areas | in use |
| [Course plan](/notes/ai/ai-engineering/course-plan) | The map of all 16 levels and the order of study | written |
| [Glossary](/notes/ai/ai-engineering/glossary) | Every term, with a plain meaning | 545 terms (L0) |
| [Sources and verification](/notes/ai/ai-engineering/sources-and-verification) | Every source, the tested versions, and which facts were measured | written |
| [01 L0 Software engineering fundamentals](/notes/ai/ai-engineering/01-software-engineering-fundamentals) | Python, concurrency, HTTP, FastAPI, streaming, MCP events, PostgreSQL, Git, coding agents, Docker, capstone | 49 lessons written |
| 02 to 16 | Levels L1 to L15 | planned |

## Start here

1. Read the [L0 learning roadmap](/notes/ai/ai-engineering/01-software-engineering-fundamentals/roadmap).
2. Open [lesson 1.1](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l1-values-names-and-types).
3. For the concurrency path, follow the 8 steps on the roadmap page in order. They end with the [case study of the `_run` bridge](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events/l5-case-study-the-run-bridge).

## Links to other subjects

Some levels overlap with subjects that already exist. The lessons link to them and do not repeat them.

| Level | Existing subject |
|---|---|
| L0 | [Python for AI Services](/notes/software-engineering/python), [PostgreSQL](/notes/databases/postgres) |
| L1 | [LLM Systems Deep Dive](/notes/ai/llm-systems) |
| L2 | [LLM APIs and Message Formats](/notes/ai/llm-apis), [LangChain and LangGraph](/notes/ai/langchain-langgraph) |
| L3, L4, L6 | [LLM Context Engineering](/notes/ai/context-engineering) |
| L5 | [Claude Agent SDK](/notes/ai/claude-agent-sdk), [LangChain and LangGraph](/notes/ai/langchain-langgraph) |
| L7 | [Evaluating AI Systems](/notes/ai/evaluation) |
| L8 | [Security and Operations](/notes/software-engineering/security-and-operations) |
| L11 | [Databricks Platform](/notes/platforms/databricks) |
| L12 (audio) | [FFT and Signal Processing](/notes/maths/fft-signal-processing) |

## Sources

- AI Engineer Roadmap 2026 (CampusX): https://ai-engineer-roadmap-2026.vercel.app/ (captured on 2026-10-18)
- The verified documentation and versions for each lesson: [Sources and verification](/notes/ai/ai-engineering/sources-and-verification)

## Conventions

### Lesson codes

A lesson code is module.lesson inside its part. For example, 2.4 in part 01 is module 2, lesson 4: [Queues and the producer-consumer pattern](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l4-queues-and-producer-consumer).

### Three kinds of statements

1. **Measured:** a sandbox run printed it. The lesson names the versions.
2. **From the docs:** an official page, a specification or the library source says it. The lesson names the source and the date "checked on".
3. **Design advice:** the interpretation of these notes. The lesson says so.

### Facts that change

Every version, default value and product feature has a "checked on" date. Check it again before you teach it or use it at work.

### Code

1. I write all the exercise code myself.
2. Hints come in three levels, in chat only: idea, pseudocode, partial code.
3. The lessons never show a full solution to an exercise.
4. Pure Python exercises run in a browser lab at `/labs`. Thread, server, database, Docker and Git exercises run in my local practice project.

### Color legend

Diagrams in this subject use these meanings when they use color.

| Element | Color |
|---|---|
| Caller thread, consumer | blue `#1E6091` |
| Worker thread, producer | gold `#B8860B` |
| Event loop and coroutines | purple `#6A4C93` |
| Tool call and tool result | teal `#2A9D8F` |
| Stored state: database row, file | green `#2D6A4F` |
| Error, data loss, bug | red `#C81D25` |
| Normal text and arrows | ink `#100D12` |
