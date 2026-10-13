---
title: "M6: Evaluation and traces"
order: 7
summary: "Run the 20-case set end to end with element scoring, citation checks and retrieval metrics. Calibrate a rubric judge against your own labels to a Cohen's kappa of at least 0.6. Record every call as a span with the OpenTelemetry GenAI attribute names, and gate pull requests with a GitHub Actions job."
status: not-started
tags: [capstone, evaluation, llm-as-judge, cohens-kappa, tracing, ci]
---

## 1. Goal

After M6, you can change the system of M1 to M5 safely. After M6, every change gets a score, every failure has a trace, and a broken retriever cannot reach the main branch.

In production terms, three questions decide whether a change ships. Did the answers get better or worse, on the same cases? Why did one case fail: retrieval, the tools, compression or the model? Can a pull request break the system without anyone noticing? The evaluation harness answers the first. The traces answer the second. The CI job answers the third.

## 2. Builds on

- [Lesson 9.6: Evaluation](/notes/ai/context-engineering/09-production/l6-evaluation): element scoring, rubric judges, Cohen's kappa, judge biases, reward hacking.
- [Lesson 9.7: Evals in CI and versioning](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning): smoke and full suites, noise, required checks, secrets.
- [Lesson 9.8: Observability, cost and latency](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency): spans, the OpenTelemetry GenAI conventions, cost per span.
- [Lesson 5.8: Measure retrieval and answers](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval): Recall@k, MRR, abstention tests.
- [Lesson 2.4: The quality curve](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve): ablation and the noise of small test sets.

## 3. Spec

### 3.1 The run

```python
# evals/runner.py

@dataclass(frozen=True)
class RunConfig:
    name: str                    # "full", "no_retrieval", "dense_only", "no_memory"
    provider: str
    model: str
    judge_provider: str | None
    judge_model: str | None
    suite: Literal["smoke", "full"]

@dataclass(frozen=True)
class RunHeader:
    started_at: str
    git_sha: str
    corpus_hash: str             # hash of the index manifest
    context_version: str         # from M1
    prices_checked_on: str       # from prices.json
    config: RunConfig

def run_suite(cases: Sequence[Case], config: RunConfig, *, out: Path) -> SuiteResult:
    """Run every case in a fresh session with a fresh user ID, so that no memory
    leaks between cases. The approver denies every write. Write one JSON file
    with the header and one row per case."""
    ...
```

`scripts/run_evals.py --suite smoke --config full --baseline evals/baseline.json --out results.json` runs the suite and compares it with the baseline. It exits with a non-zero code when a gate fails.

### 3.2 Scoring one case

```python
@dataclass(frozen=True)
class CaseScore:
    case_id: str
    elements_pass: bool          # every required group matches, no forbidden pattern matches
    abstained: bool              # the answer says that the sources do not answer the question
    citations_valid: bool        # every cited ID was in the context
    citation_supports: bool      # a cited chunk contains a required fact
    recall_at_5: float           # from the M2 overlap rule, on this run's retrieval
    reciprocal_rank: float
    judge_label: Literal["pass", "fail"] | None
    iterations: int
    tool_calls: int
    compactions: int
    input_tokens: int
    output_tokens: int
    cost_usd: float
    latency_ms: int

def score_case(case: Case, answer: Answer, trace: Sequence[Span]) -> CaseScore: ...
```

A case **passes** under these rules:

| Case type | Pass rule |
|---|---|
| Answerable | `elements_pass`, `citations_valid` and `citation_supports` are all true. For a case tagged `judge`, the judge label is also `pass`. |
| Unanswerable | `abstained` is true and no forbidden pattern matches. |

The gates of the `full` configuration on the 20-case set:

| Metric | Gate |
|---|---|
| Match rate on answerable cases | at least 0.80 |
| Unanswerable cases | all abstain |
| Invalid citations | 0 |
| Recall@5 on answerable cases | at least 0.80 |
| MRR on answerable cases | at least 0.60 |
| Critical cases | none regresses against the baseline |
| Writes attempted | reported, never executed |

With 17 answerable cases, 14 passes give a match rate of 0.82, and 13 give 0.76. One case moves the rate by about 6 points. So the gate catches large breaks, not small ones (lesson 9.7, section 4.3).

### 3.3 The rubric judge

```python
class JudgeVerdict(BaseModel):
    reasoning: str                    # first, so that the judge reasons before it scores
    groundedness: Literal[0, 1, 2]    # 2: every claim is supported by a cited source
    completeness: Literal[0, 1, 2]    # 2: covers every point of the reference answer
    honesty: Literal[0, 1]            # 1: no confident claim beyond the sources
    label: Literal["pass", "fail"]    # pass if groundedness == 2, completeness >= 1, honesty == 1

def judge(case: Case, answer: Answer, sources: Sequence[KnowledgeItem], *,
          llm: LLMClient, model: str) -> JudgeVerdict:
    """The judge sees the question, the reference answer, the required facts,
    the cited sources and the answer. The rubric defines every level with an example.
    Length is not a criterion."""
    ...

def cohen_kappa(a: Sequence[str], b: Sequence[str]) -> float: ...
```

Rules from lesson 9.6:

1. **Use a judge from another model family** than the agent. Self-enhancement bias favors answers from the judge's own family.
2. **Calibrate before use.** Label 40 answers yourself, blind to the judge: the 20 cases under the `full` configuration and under `no_retrieval`. The weak configuration makes sure that both labels occur often.
3. **Check the balance.** Each label must cover at least 25% of the 40 items. With 90% passes, a judge that always says pass agrees 90% of the time and has a kappa of 0.
4. **Compute kappa twice**, with your own `cohen_kappa` and with `sklearn.metrics.cohen_kappa_score`. The gate is $\kappa \ge 0.6$.
5. **Measure your own consistency.** Label the same 40 answers again after 7 days, and report your test-retest kappa next to the judge's kappa.

With only 40 items, kappa is uncertain. A rough standard error from Cohen (1960) is:

$$
\text{SE}(\kappa) \approx \sqrt{\frac{p_o\,(1 - p_o)}{N\,(1 - p_e)^2}}
$$

The symbols mean:

- $p_o$ is the observed agreement and $p_e$ the chance agreement (lesson 9.6, section 4.5).
- $N$ is the number of items that both raters labeled.

> [!example] Worked example: how sure is a kappa of 0.65?
> A calibration table gives $p_o = 0.825$ and $p_e = 0.5025$ with $N = 40$, so $\kappa \approx 0.648$.
>
> - $\text{SE} \approx \sqrt{0.825 \times 0.175 / (40 \times 0.4975^2)} = \sqrt{0.144375 / 9.900} \approx 0.121$.
> - A rough 95% interval: $0.648 \pm 1.96 \times 0.121$, from about 0.41 to 0.88.
>
> The judge passes the gate, but the data cannot rule out a "moderate" judge. Add items whenever you change the rubric, and keep the full table in the report.

### 3.4 Traces

Module `src/research_assistant/tracing.py`. It replaces the call log of M1 with spans. The attribute names follow the OpenTelemetry GenAI conventions (checked on 2026-10-12). Their status is Development, so names can still change.

| Span name | Kind | Parent | Required attributes |
|---|---|---|---|
| `invoke_agent research-assistant` | INTERNAL | none: one per user turn | `gen_ai.operation.name` = `invoke_agent`, `gen_ai.agent.name` |
| `chat <model id>` | CLIENT | the turn | `gen_ai.operation.name` = `chat`, `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.response.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `gen_ai.usage.cache_read.input_tokens`, `gen_ai.usage.cache_write.input_tokens` |
| `execute_tool <tool name>` | INTERNAL | the turn | `gen_ai.operation.name` = `execute_tool`, `gen_ai.tool.name` |
| `retrieval` | INTERNAL | the tool span or the turn | `gen_ai.operation.name` = `retrieval` |
| `chat <summarizer id>` | CLIENT | the turn | as for `chat`, plus `ra.purpose` = `compaction` or `extraction` |

Your own attributes use the prefix `ra.`: `ra.session_id`, `ra.user_hash`, `ra.context.version`, `ra.context.slot.<slot>` for each of the six slots, `ra.context.utilization`, `ra.stop_reason`, `ra.cost_usd`, `ra.retrieval.chunk_ids` and `ra.guard_tripped`. Keep the provider's raw usage object next to the attributes. Then cost math never depends on a mapping (lesson 9.8).

```python
class Tracer:
    def span(self, name: str, *, kind: Literal["INTERNAL", "CLIENT"],
             attributes: Mapping[str, Any]) -> ContextManager[Span]: ...

class JsonlExporter:
    """Writes one line per finished span to data/traces/spans.jsonl."""
```

One JSONL line:

```json
{"trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "span_id": "00f067aa0ba902b7",
 "parent_span_id": "a2fb4a1d1a96d312", "name": "chat <model id>", "kind": "CLIENT",
 "start": "2026-10-12T09:14:01.120Z", "end": "2026-10-12T09:14:03.430Z", "status": "OK",
 "attributes": {"gen_ai.operation.name": "chat", "gen_ai.provider.name": "anthropic",
   "gen_ai.request.model": "<model id>", "gen_ai.usage.input_tokens": 300,
   "gen_ai.usage.output_tokens": 450, "gen_ai.usage.cache_read.input_tokens": 18000,
   "gen_ai.usage.cache_write.input_tokens": 1200, "ra.context.utilization": 0.67,
   "ra.cost_usd": 0.0099},
 "raw_usage": {"input_tokens": 300, "output_tokens": 450, "cache_read_input_tokens": 18000,
   "cache_creation_input_tokens": 1200}}
```

Use the provider value that the conventions list for `gen_ai.provider.name`. The token values in the example are those of lesson 9.8, section 4.3.

### 3.5 The CI job

File `.github/workflows/capstone.yml` at the root of the lab repository. Every step runs with `working-directory: capstone`.

| Job | Trigger | Secrets | Steps | Fails when |
|---|---|---|---|---|
| `checks` | every pull request and every push | none | `uv sync`, `scripts/check.py`, the retrieval evaluation of M2, the harness tests with the fake client | a check fails, Recall@5 is below 0.80, or MRR is below 0.60 |
| `llm-smoke` | push to `main`, and manual start | the provider keys | the 20-case suite with the real model, the comparison with the baseline | a gate of section 3.2 fails |

Rules, from the GitHub docs (checked on 2026-10-12, lesson 9.7):

1. Make `checks` a required status check. A skipped check counts as passing, so `checks` has no condition that can skip it.
2. Secrets are not passed to workflows from forked repositories. That is why the paid job does not run on pull requests.
3. Never use `pull_request_target` to give untrusted code access to secrets.
4. Upload `results.json` as an artifact on every run, also on failure.
5. Cache the embedding model between runs, so that the job does not download it every time.

The cost of one suite run (lesson 9.7):

$$
C_{\text{run}} = N\,(c_{\text{agent}} + c_{\text{judge}})
$$

> [!example] Worked example: one smoke run
> Assume that each case makes 3 agent calls of 10,000 input and 500 output tokens, with no cache hits. The model is Claude Sonnet 5.5 at USD 2 and USD 10 per MTok (checked on 2026-10-12). Assume one judge call of 3,000 input and 300 output tokens at the same prices.
>
> - Agent: $(30{,}000 \times 2 + 1{,}500 \times 10)/10^6 = 0.075$ USD per case.
> - Judge: $(3{,}000 \times 2 + 300 \times 10)/10^6 = 0.009$ USD per case.
> - Smoke run: $20 \times 0.084 = 1.68$ USD.
>
> Measure the real numbers from your traces. Caching lowers the agent part.

## 4. Acceptance tests

1. `test_score_rules`: five fixture answers give the expected `CaseScore`. They are an answerable pass, a forbidden match, an invalid citation, a correct abstention, and a wrong answer to an unanswerable case.
2. `test_kappa_lesson_tables`: the table of lesson 9.6, section 4.5, gives 0.49, and the lazy judge gives 0. Your function and scikit-learn agree to 4 decimals.
3. **Calibration** (optional, costs money): 40 labeled answers, each label at least 25% of the items, judge kappa of at least 0.6. The report also gives your test-retest kappa and the standard error of section 3.3.
4. **End-to-end run** (optional, costs money): `results.json` has the header of section 3.1 and 20 rows. The `full` configuration meets every gate of section 3.2.
5. `test_run_isolation`: two cases in one run share no memory rows, because each case has its own user ID.
6. `test_trace_tree`: in one scripted turn, every `chat` and `execute_tool` span has the turn span as an ancestor. Every `chat` span has all the attributes of section 3.4.
7. `test_trace_cost_matches_summary`: the sum of `ra.cost_usd` over a session's spans equals `total_cost_usd` in its summary file, within 0.0001 USD.
8. **CI break test:** a branch that sets the RRF depth to 5 and removes BM25 fails the `checks` job on the retrieval gate. A branch that changes only the README passes.
9. **CI secrets test:** the workflow file has no step that uses a secret in the `checks` job, and no `pull_request_target` trigger.

## 5. Measurements to record

Record these in `notebooks/capstone-m6.ipynb`:

- **Case table.** One row per case, with every field of `CaseScore` and the case tags.
- **Configuration table.** One row per configuration: `full`, `no_retrieval`, `dense_only` and `no_memory`. Columns: match rate, abstention accuracy, invalid citation rate, Recall@5, MRR, mean cost per case, p95 latency, mean iterations.
- **Calibration table.** The 2 × 2 counts of you against the judge, $p_o$, $p_e$, $\kappa$, its standard error, and your test-retest kappa. One row per rubric version.
- **Trace dashboard.** Cost per case, p50 and p95 latency, cache hit rate, and the distribution of iterations. Use the 95th percentile of iterations of the passing cases to update `max_iterations` of M3.

## 6. Production review

This works. Would you deploy it?

| Concern | Check before you deploy | Evidence to show |
|---|---|---|
| Cost | The cost of one suite run is known, and the paid job runs only on `main` or by hand. | The worked example with your numbers |
| Reliability | The gates catch a broken retriever and a critical regression. You know what they cannot catch. | The CI break test and the noise note |
| Quality of the judge | The judge is calibrated, from another model family, and recalibrated after any change of its prompt or model. | The calibration table |
| Security | No secret in the `checks` job. Traces hold a user hash, not a name. Request files stay out of CI artifacts. | The workflow file and one artifact |
| Observability | One failed case can be explained from its trace alone. | A written diagnosis of one failure, with span IDs |

## 7. Stretch goals

1. **Export to a trace viewer.** Send the spans over OTLP to a local Arize Phoenix or Langfuse instance (lesson 9.8). Compare the view with your JSONL file.
2. **A nightly full suite with the Batch API.** It costs 50% of the standard price. A batch can take up to 24 hours (checked on 2026-10-12). It suits a scheduled run, not a pull request.
3. **Pairwise comparison.** Compare two configurations with the judge in both orders. Count a win only when both orders agree (lesson 9.6, position bias).
4. **Bootstrap intervals.** Resample the cases 1,000 times. Report a 95% interval for the match rate and for Recall@5 (lesson 5.8).

## 8. Check questions

```check
{
  "question": "You and the judge label 40 answers. Both pass 18, you pass and the judge fails 4, you fail and the judge passes 3, both fail 15. Compute kappa. Does the judge pass the gate?",
  "hint": "Your pass rate is 22/40. The judge's pass rate is 21/40.",
  "answer": "p_o = (18 + 15) / 40 = 0.825. p_e = 0.55 × 0.525 + 0.45 × 0.475 = 0.28875 + 0.21375 = 0.5025. κ = (0.825 − 0.5025) / (1 − 0.5025) = 0.3225 / 0.4975 ≈ 0.648. It passes the gate of 0.6, but its rough 95% interval runs from about 0.41 to 0.88, so report the uncertainty."
}
```

```check
{
  "question": "Why does the calibration set include answers from the no_retrieval configuration?",
  "answer": "The full system may pass most cases. If 90% of the labels are pass, a judge that always says pass agrees 90% of the time and still has a kappa of 0 (lesson 9.6). The weak configuration produces many failing answers, so both labels are frequent and kappa measures whether the judge can tell them apart."
}
```

```check
{
  "question": "A pull request lowers the smoke match rate from 0.88 to 0.82, one case out of 17. No critical case regresses. Do you block the merge?",
  "answer": "Not on this result alone. One case is about 6 points, which is well inside the noise of a 17-case suite (lesson 9.7). Look at the flipped case. If its failure is caused by the change, fix it or add a test. Block only on a critical regression, a gate failure, or a pattern across several cases or several runs."
}
```

## 9. Links

- Previous: [M5: Memory](/notes/ai/context-engineering/10-capstone/m5-memory)
- Next: [M7: Ship](/notes/ai/context-engineering/10-capstone/m7-ship)
- Overview: [Capstone overview](/notes/ai/context-engineering/10-capstone/capstone-overview)
- [Lesson 9.6: Evaluation](/notes/ai/context-engineering/09-production/l6-evaluation)
- [Lesson 9.7: Evals in CI and versioning](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning)
- [Lesson 9.8: Observability, cost and latency](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency)
- Research track: [E8: Context precision and recall](/notes/ai/context-engineering/11-research-track/e8-context-precision-recall)
- [Glossary](/notes/ai/context-engineering/glossary)
