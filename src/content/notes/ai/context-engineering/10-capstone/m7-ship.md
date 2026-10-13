---
title: "M7: Ship"
order: 8
summary: "Package the research assistant so that someone else can run, judge and change it: a README with an architecture diagram and a scorecard, a Dockerfile, configuration through environment variables, a demo script, a cost-per-task report, the known limits, and a design review that defends every decision with your own numbers."
status: not-started
tags: [capstone, ship, docker, readme, cost, design-review]
---

## 1. Goal

M7 makes a deliverable from a working system. A teammate who clones the repository must be able to run it and check its quality. The teammate must also know what it costs and where it fails, without asking you.

In production terms, shipping is a test of everything before it. A Dockerfile shows whether the configuration really lives in environment variables. A demo from a fresh clone shows whether the setup steps are complete. A cost report shows whether the traces hold the right fields. A design review shows whether each budget and threshold has a reason, or only a habit.

## 2. Builds on

- [Lesson 9.1: Context is the product](/notes/ai/context-engineering/09-production/l1-context-is-the-product): context files are versioned, reviewed and tested.
- [Lesson 9.7: Evals in CI and versioning](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning): versions with scores, and a return to the last known good version.
- [Lesson 9.8: Observability, cost and latency](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency): cost levers in order, the latency budget.
- [Lesson 9.9: The seven anti-patterns](/notes/ai/context-engineering/09-production/l9-seven-anti-patterns): the final checklist against your own system.
- [Lesson 7.7: ISOLATE: one window is not enough](/notes/ai/context-engineering/07-compress-and-isolate/l7-isolate-one-window-is-not-enough): the decision guide for one agent or several.
- [Lesson 5.2: Hybrid search and RRF](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) and [lesson 7.6: Token budgets](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets): the evidence for two of the decisions.

## 3. Spec

### 3.1 The README

`capstone/README.md` has these sections, in this order:

| Section | Required content |
|---|---|
| Summary | What the assistant does, for whom, and what it does not do, in at most 5 sentences |
| Architecture | A Mermaid diagram with the real module names, in the colors of the subject legend, and one paragraph that follows one user turn through it |
| Quick start | The exact commands for PowerShell and for bash: install, build the index, run the demo with the fake provider, then with a real provider |
| Configuration | The table of section 3.2 |
| Commands | Every CLI command of section 3.3 with one example |
| Evaluation | The scorecard of M6 with the date, the model IDs, the corpus hash and the git SHA |
| Cost | The summary of the cost report of section 3.6 |
| Known limits | The list of section 3.7 |
| Security and privacy | What the assistant stores, where, for how long, and how `forget` deletes it |
| Design review | A link to `docs/design-review.md` |

### 3.2 Configuration

All configuration comes from environment variables, read only in `config.py`. `config.py` validates every value at startup and reports all errors in one message.

| Variable | Default | Meaning |
|---|---|---|
| `RA_PROVIDER` | `fake` | `fake`, `anthropic` or `openai` |
| `RA_MODEL` | none | Main model ID |
| `RA_SUMMARIZER_MODEL` | none | Model ID for compaction, extraction and summaries |
| `RA_JUDGE_PROVIDER`, `RA_JUDGE_MODEL` | none | The judge, from another model family |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | none | Keys. Only from the environment, never from a file in the image. |
| `RA_DATA_DIR` | `./data` | Root of corpus, index, memory, summaries, notes and traces |
| `RA_CONTEXT_BUDGET` | 32000 | Total budget of one call |
| `RA_MAX_OUTPUT_TOKENS` | 2000 | `max_tokens` |
| `RA_BUDGET_SAFETY` | 1000 | Buffer for estimation error |
| `RA_RETRIEVAL_MODE` | the winner of M2 | `dense`, `bm25`, `hybrid` or `hybrid_rerank` |
| `RA_CHUNK_ORDER` | `rank` | `rank` or `edges` |
| `RA_COMPACT_TRIGGER`, `RA_COMPACT_TARGET` | 0.80, 0.60 | Compaction thresholds of M4 |
| `RA_MAX_ITERATIONS` | from M6 | Tool rounds per turn |
| `RA_MAX_TURN_INPUT_TOKENS` | 120000 | Token guard of one turn |
| `RA_LOG_LEVEL` | `INFO` | Log level |

### 3.3 The command line

`pyproject.toml` declares one console script, `research-assistant`, with these commands:

| Command | Job |
|---|---|
| `index` | Load the corpus and sync the index. Print the `SyncReport`. |
| `ask --topic T --docs PATHS "question"` | One session with one question |
| `chat --topic T --docs PATHS` | An interactive session. Writes ask for approval. |
| `serve-mcp` | Start the MCP server of M3 over stdio |
| `forget --user ID` | Run the deletion cascade of M5 and print the report |
| `demo` | The demo of section 3.5 |
| `cost-report TRACES` | The report of section 3.6 |

### 3.4 The Dockerfile

Requirements:

1. Base image `python:3.12-slim`. Install uv in the build.
2. Copy `pyproject.toml` and `uv.lock` first. Install the dependencies from the lock file, without dev dependencies and without changes to the lock file. Then copy `src/`. A change in the code then reuses the dependency layer. Find the uv options for this in the uv docs.
3. Download the embedding model during the build, into a cache folder inside the image. At run time, retrieval needs no network.
4. Run as a user that is not root.
5. Declare `/data` as the data folder, and set `RA_DATA_DIR=/data`.
6. No key in a build argument, a layer or a copied file. `.dockerignore` excludes `.env`, `data/`, `.venv/`, the caches and `.git/`.
7. The entry point is `research-assistant`, so `docker run <image> demo` runs the demo.

The run command for the README:

```bash
docker run --rm --env-file .env -v "$(pwd)/data:/data" research-assistant:1.0.0 demo
```

### 3.5 The demo

`research-assistant demo` runs a fixed script. With `RA_PROVIDER=fake`, it needs no key and no network. With a real provider, it shows the real system.

1. Sync the index and print the `SyncReport`.
2. Start session 1 on "rank fusion for hybrid retrieval" and ask 6 scripted questions. Print each answer with its citations and the slot table of each call.
3. Force one compaction and print its log line.
4. Call `save_note`. The demo prints the approval prompt and approves it with a `--yes` flag.
5. Close the session and print the path of the summary file.
6. Start session 2 on "hybrid search" and show that session 1's summary is in its session state.
7. Print the cost report of both sessions.

### 3.6 The cost-per-task report

`research-assistant cost-report data/traces/spans.jsonl` reads the spans and `prices.json`. For each task, a case or a session, it sums the cost of every `chat` span by purpose: agent, compaction, extraction and judge. It also computes the cost of the same usage without caching:

$$
c_{\text{cached}} = \frac{p_{in}\,u_{in} + p_{w}\,u_{w} + p_{r}\,u_{r} + p_{out}\,u_{out}}{10^6} \qquad c_{\text{uncached}} = \frac{p_{in}\,(u_{in} + u_{w} + u_{r}) + p_{out}\,u_{out}}{10^6}
$$

The symbols mean:

- $u_{in}$, $u_{w}$, $u_{r}$ and $u_{out}$ are the uncached input, cache write, cache read and output tokens of a span.
- $p_{in}$, $p_{w}$, $p_{r}$ and $p_{out}$ are their prices in USD per MTok, from `prices.json`.

The uncached cost is a counterfactual: it assumes that the provider had billed every input token at the normal rate.

> [!example] Worked example: one task of three calls on Claude Sonnet 5.5
> Prices (checked on 2026-10-12): input USD 2, 5-minute cache write USD 2.50, cache read USD 0.10, output USD 10, all per MTok.
>
> | Call | Uncached in | Cache write | Cache read | Output | Cached cost (USD) | Uncached cost (USD) |
> |---|---|---|---|---|---|---|
> | 1 | 1,200 | 7,800 | 0 | 300 | 0.02490 | 0.02100 |
> | 2 | 400 | 1,500 | 7,800 | 250 | 0.00783 | 0.02190 |
> | 3 | 300 | 900 | 9,300 | 600 | 0.00978 | 0.02700 |
> | Task | | | | | 0.04251 | 0.06990 |
>
> Call 1 costs more with caching, because it pays the write premium. From call 2 on, caching wins. Over the task, it saves $1 - 0.04251 / 0.0699 \approx 39\%$. Of the 29,200 input tokens, 17,100 came from the cache, a hit rate of about 58.6%.

The report table has one row per task. Columns: task ID, calls, input tokens, cache hit rate, output tokens, cost by purpose, total cached cost and total uncached cost. Below the table come the mean, the median and the 95th percentile of the cost per task over the 20 cases.

### 3.7 Known limits

The README lists at least these limits. Each one has its impact and a workaround.

| Limit | Impact | Workaround |
|---|---|---|
| The token estimate for Claude comes from `o200k_base` and a calibration factor | A new model or tokenizer can shift the estimate | Recalibrate after every model change, or use the provider's count endpoint |
| The embedding model reads at most 256 word pieces, in English | Long passages and other languages retrieve worse | A multilingual model with a longer limit, then rebuild the index |
| One SQLite writer at a time | Several processes that write memory can wait | PostgreSQL with row-level security |
| The 20-case set detects only large changes | A loss of a few points can pass the gate | More cases, and the full suite before a release |
| The judge has a kappa of about 0.6 on 40 items | Some judge labels are wrong | Use it for trends, not for single cases |
| Deletion cannot reach backups or provider-side logs | Erased data can remain outside your stores | Document retention, and keep backups short-lived |
| Prices come from one checked date | Cost reports age | Check `prices.json` before every report |

### 3.8 The design review

`docs/design-review.md`, at most two pages. One row per decision:

| Decision | Alternatives | Your evidence | Lesson | Revisit when |
|---|---|---|---|---|
| Retrieval mode | Dense only, BM25 only, hybrid, hybrid with reranker | The mode table of M2, split by query type | 5.2, 5.8 | The corpus or the query mix changes |
| Budget of 32,000 tokens and its ceilings | A larger budget, the full window | Utilization per call (M1, M4), and the match rate at a larger budget (M6) | 1.5, 7.6 | A new model, or a new task type |
| Compaction at 0.80 down to 0.60 | Other thresholds, provider compaction | Turns between compactions, the retention table, the payback values (M4) | 7.2, 7.5 | Measured thrashing or lost critical facts |
| One agent, no sub-agents | An orchestrator with search sub-agents | Turn latency, the iteration percentiles, the decision guide of lesson 7.7 | 7.7 | Tasks that need wide parallel search across many sources |
| Tools over MCP | In-process functions only | Reuse in Claude Code and Claude Desktop, and the latency cost of stdio (M3) | 6.7, 6.8 | The server must run remotely |
| SQLite for memory | A vector database, a memory product | Store size, search time, the isolation and deletion tests (M5) | 8.6, 8.8 | Many users or many writers |
| Judge model | Same family as the agent | The calibration table (M6) | 9.6 | Any change of the judge prompt or model |

## 4. Acceptance tests

1. **Fresh clone, no Docker:** use a clean machine or a clean user account. The Quick start commands of the README run the demo with the fake provider, unchanged. Record the time from clone to demo output.
2. **Docker:** `docker build` succeeds. `docker run --rm -e RA_PROVIDER=fake <image> demo` completes with no network access after the build.
3. **Non-root:** `docker run --rm --entrypoint id <image> -u` prints a number other than 0.
4. **No secrets:** a scan of `docker history --no-trunc` and of the image file system finds no `.env` file and no key pattern.
5. **One config reader:** a test finds no `os.environ` or `os.getenv` outside `config.py`.
6. **Config validation:** an invalid budget and a missing model ID at startup give one message that lists both errors.
7. **Cost report:** for the evaluation run of M6, the report's total equals the sum of `cost_usd` in `results.json`, within 0.0001 USD. The worked example of section 3.6 is a unit test.
8. **Release gate:** the full suite of M6 passes every gate on the release commit. The scorecard in the README shows these numbers.
9. **Design review:** every row of section 3.8 cites at least one of your own measurements.
10. **Release:** the release commit carries the tag `capstone-v1.0.0`, and the README scorecard names its git SHA.

## 5. Measurements to record

Record these in `notebooks/capstone-m7.ipynb` and copy the scorecard into the README:

- **Scorecard.** One row per metric. The quality rows are match rate, abstention accuracy, invalid citations, Recall@5, MRR and judge kappa. The operations rows are p50 and p95 latency per question, mean and p95 cost per task, and cache hit rate. Two rows cover compression: compactions per 30-turn session and critical retention. Columns: the gate, the measured value, the date, the model IDs and the corpus hash.
- **Ship table.** Image size, build time, time from clone to demo, and the number of README steps.
- **Cost table.** The report of section 3.6 for the 20 cases.

## 6. Production review

This works. Would you deploy it? The last review covers the whole system.

| Concern | Check before you deploy | Evidence to show |
|---|---|---|
| Rollback | Each release has a tag and a score. You can return to the last good version in one command. | The tags and their scorecards |
| Monitoring | Traces leave the machine to a viewer, or a script makes a daily cost and latency table from them. | One day of traces from your own use |
| Cost | The p95 cost per task is known, and the token guard caps each turn. | The cost table |
| Latency | p95 latency per question is known, with its largest part named. | The trace dashboard of M6 |
| Security | Writes need approval, paths stay in their folders, and keys stay in the environment. | Tests of M3 and M7 |
| Privacy | `forget` runs the cascade, and the README states what it cannot reach. | Test 14 of M5 and the known limits |
| Anti-patterns | Walk through the seven anti-patterns of lesson 9.9 against your own traces. | One line per anti-pattern: absent, or present with its fix |

## 7. Stretch goals

1. **An HTTP layer.** Add the FastAPI service of lesson 9.2, with the session summary endpoint of its worked example. Keep the same tests and add API tests.
2. **A remote MCP server.** Serve the tools over Streamable HTTP with authorization, and connect Claude Code to it with `--transport http` (lesson 6.8).
3. **A context bar in a UI.** Show the six slots of the next call as a bar. Draw it relative to the total budget (lesson 9.2, section 4.7).
4. **A second corpus.** Index public documentation of a tool that you use at work. Write 20 new cases for it, and compare the scorecards of the two corpora.

## 8. Check questions

```check
{
  "question": "Why does the Dockerfile download the embedding model during the build instead of at the first run?",
  "answer": "At run time, the container then needs no network for retrieval, and every container uses exactly the model version that the image was built and tested with. A download at the first run adds latency, fails without network, and can fetch a different revision. The cost is a larger image. Record its size in the ship table."
}
```

```check
{
  "question": "A task makes two calls on Claude Sonnet 5.5. Call 1: 1,000 uncached, 6,000 cache write, 0 cache read, 200 output. Call 2: 300 uncached, 800 cache write, 6,000 cache read, 400 output. Compute the cached and the uncached cost.",
  "hint": "Prices per MTok: input 2, cache write 2.50, cache read 0.10, output 10.",
  "answer": "Call 1 cached: (1,000 × 2 + 6,000 × 2.5 + 200 × 10) / 10⁶ = (2,000 + 15,000 + 2,000) / 10⁶ = 0.019 USD. Call 2 cached: (300 × 2 + 800 × 2.5 + 6,000 × 0.1 + 400 × 10) / 10⁶ = (600 + 2,000 + 600 + 4,000) / 10⁶ = 0.0072 USD. Total 0.0262 USD. Uncached: call 1 (7,000 × 2 + 2,000) / 10⁶ = 0.016 USD, call 2 (7,100 × 2 + 4,000) / 10⁶ = 0.0182 USD, total 0.0342 USD."
}
```

```check
{
  "question": "In the design review, defend the single-agent design in three sentences, with the evidence of lesson 7.7.",
  "answer": "Anthropic reports that multi-agent systems use about 15 times the tokens of a chat, against about 4 times for one agent, so isolation multiplies cost. Isolation pays for wide, parallel search that does not fit one window, while this corpus fits the retrieval budget and the turns are mostly sequential. Cognition and Shopify both advise one agent first, and clearing plus compaction already give the token benefit of isolation (lesson 7.7)."
}
```

## 9. Links

- Previous: [M6: Evaluation and traces](/notes/ai/context-engineering/10-capstone/m6-evaluation-and-traces)
- Overview: [Capstone overview](/notes/ai/context-engineering/10-capstone/capstone-overview)
- [Lesson 9.7: Evals in CI and versioning](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning)
- [Lesson 9.9: The seven anti-patterns](/notes/ai/context-engineering/09-production/l9-seven-anti-patterns)
- [Lesson 7.7: ISOLATE: one window is not enough](/notes/ai/context-engineering/07-compress-and-isolate/l7-isolate-one-window-is-not-enough)
- Next part: [11 Research track](/notes/ai/context-engineering/11-research-track)
- [Glossary](/notes/ai/context-engineering/glossary)
