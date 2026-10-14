---
title: "Databricks Platform"
order: 1
summary: "Databricks Apps, identity and credentials, SQL and Delta, MCP servers and Genie, and Lakebase."
---

## Goal

Explain how code runs in a Databricks App, which identity it uses, and how it reaches models, data tools and a Postgres database. Choose between Lakebase and Delta tables for an application, with reasons.

## Finish line

I master the subject when all 6 items are true, with no notes and no AI.

- [ ] Explain app.yaml, the app service principal and the temporary local disk of an App.
- [ ] Pick a workspace with CLI profiles, and explain the profile file.
- [ ] Explain Unity Catalog service credentials and keyless access to an external model provider.
- [ ] Explain how Databricks MCP servers and Genie reach data, and why some clients must be built outside an event loop.
- [ ] Connect an App to Lakebase with automatic token refresh.
- [ ] Argue for Lakebase over Delta for chat history, in terms that an administrator accepts.

## Folders

| Folder | Content |
|---|---|
| [00 Progress](/notes/platforms/databricks/00-progress) | Session log, mistakes, weak areas, media queue |
| [Course plan](/notes/platforms/databricks/course-plan) | The map of all parts and the study order |
| [Glossary](/notes/platforms/databricks/glossary) | Every term, with a plain meaning |
| [01 Apps](/notes/platforms/databricks/01-apps) | Databricks Apps, resources, secrets, instances |
| [02 Identity and auth](/notes/platforms/databricks/02-identity-and-auth) | CLI profiles, service credentials, user identity |
| [03 SQL and Delta](/notes/platforms/databricks/03-sql-and-delta) | Statement Execution API and Delta tables |
| [04 MCP and Genie](/notes/platforms/databricks/04-mcp-and-genie) | Databricks MCP servers, DatabricksMCPClient, Genie One |
| [05 Lakebase](/notes/platforms/databricks/05-lakebase) | Lakebase projects, App resources, LakebasePool, Lakebase vs Delta |

## Sources

- Databricks Apps: https://docs.databricks.com/aws/en/dev-tools/databricks-apps/resources (checked on 2026-10-12)
- Lakebase: https://docs.databricks.com/aws/oltp (checked on 2026-10-12)
- Lakebase with Apps: https://docs.databricks.com/aws/en/oltp/projects/databricks-apps (checked on 2026-10-12)
- Each lesson names its other sources, with the date of the check. Facts that the documentation does not state are marked "not documented" or "not confirmed" in the lesson.
- Names in the current documentation (checked on 2026-10-13): "Genie Agent" (formerly Genie space), "Declarative Automation Bundles" (older pages say Databricks Asset Bundles) and "AI Search index" (the App resource key is still `vector-search-index`).

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

### Media

All media for this subject is in `/notes/media/databricks/`.

| Folder | What it holds | Made by |
|---|---|---|
| `figures/` | SVG diagrams | Claude in chat. Each SVG is rendered to PNG and checked before it is saved. |
| `manim/` | Videos | Claude Code (Manim), from a prompt that Claude writes |

The [media queue](/notes/platforms/databricks/00-progress/media-queue) tracks every file.
