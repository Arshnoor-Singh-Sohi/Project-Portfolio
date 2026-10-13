---
title: "E5: Stale and contradictory context"
order: 5
summary: "When the window holds an old and a new version of a fact, which one does the model use? Test date labels, a freshness score in ranking and filtering in code, and measure whether the model flags a contradiction that it cannot resolve. Covers bootcamp topic 9."
status: not-started
tags: [research, stale-context, freshness, contradictions, versioning]
---

## 1. Research question

The window holds two versions of one fact: an old one and a new one. Which version does the model state? Three remedies compete:

1. **Labels:** each source carries its date, and the instructions say to prefer the newest.
2. **Ranking:** a freshness score lowers old sources in retrieval, so they leave the top $k$.
3. **Filtering:** code removes superseded versions before the call.

A second question: when two sources disagree and nothing shows which is newer, does the model say so, or does it pick one in silence?

## 2. Why it matters

Stale context is the third effect of lesson [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects), and a larger window does not fix it. In the capstone, the index of M2 deletes the old chunks of a changed document. So stale text arrives through other paths: old facts in memory (M5), old values in the rolling summary (M4) and tool results from earlier turns. The production decisions are:

1. Does the context builder show dates on sources and memories?
2. Does retrieval and memory scoring include a freshness term, and with what weight?
3. Which superseded content does code remove, and where does the history of old values stay?

The experiment builds on four lessons:

- [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag): incremental sync.
- [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay): decay and half-life.
- [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory): corrections and history.
- [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent): freshness as a production signal.

## 3. Hypothesis

- **H1.** Take no dates, and the old version after the new one in the window. The model then states the old value in at least 20% of current-value trials.
- **H2.** Date labels plus the instruction to prefer the newest source cut that rate below 5%.
- **H3.** Filtering in code gives a stale-answer rate of at most 2%. On history questions, it loses at least 30 points of accuracy against date labels, because the old value is gone.
- **H4.** With two undated, contradicting sources and no instruction about conflicts, the model flags the conflict in fewer than 50% of trials.

Each hypothesis is wrong if its measured rate is on the other side of its threshold.

## 4. Background

- **Stale knowledge and instruction drift** are sources of stale context. Only removal, replacement or summary fixes them (lesson 1.5).
- **Index sync.** "If the index keeps old chunks, the model can answer from a policy that no longer applies." Lesson 5.9 calls this a correctness problem, not only a freshness problem.
- **Corrections need history.** Last-write-wins loses the old value, so a question about the past cannot be answered. Keep the current value and a history table (lesson 8.6).
- **Recency in retrieval.** Generative Agents score recency as $0.995^h$ per game hour since the last retrieval (Park et al., UIST 2023, lesson 8.3). Half-life math converts a decay factor to a time (lesson 8.3).
- **Provenance.** Each snippet should carry its source, its version and the date that someone checked it (lesson [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches)).
- **Freshness as a signal.** Lesson 8.8 lists the mean age of injected memories as a production metric.

## 5. Method

**Dataset.** Synthetic, so that the model cannot know the values from training. Generate 40 versioned facts with a fixed seed. Each fact has an old and a new version, with invented values and dates, inside short documents with 3 distractor sentences each.

| Example fact | Old version | New version |
|---|---|---|
| API rate limit of the "orders" service | 100 requests per second, updated 2025-03-01 | 60 requests per second, updated 2026-06-15 |
| Retention of trace files | 45 days, updated 2025-09-10 | 21 days, updated 2026-08-02 |

The work-domain variant uses revisions of standard operating procedures in a bakery plant. An example is a proof time of 45 minutes in revision C (2025-11-02) and 52 minutes in revision D (2026-08-20). All values are invented.

Questions: 40 current-value questions ("What is the rate limit now?") and 20 history questions ("What was the limit before the last change?").

**The freshness score.** For condition S8, a source's retrieval score mixes relevance with freshness:

$$
f(d) = 2^{-a(d)/h} \qquad s(d) = (1 - w)\,\widehat{\text{rel}}(d) + w\,f(d)
$$

The symbols mean:

- $a(d)$ is the age of source $d$ in days, from its `updated` date to the day of the trial.
- $h$ is the half-life in days: after $h$ days, freshness is 0.5.
- $\widehat{\text{rel}}(d)$ is the min-max normalized relevance among the candidates (lesson 8.3).
- $w$ is the freshness weight, between 0 and 1.

> [!example] Worked example: the better match is the older version
> Take $h = 90$ days and $w = 0.3$. The old version matches the query best: $\widehat{\text{rel}} = 1.0$, age 400 days. The new version has $\widehat{\text{rel}} = 0.9$, age 30 days.
>
> - Old: $f = 2^{-400/90} \approx 0.046$. Score: $0.7 \times 1.0 + 0.3 \times 0.046 \approx 0.714$.
> - New: $f = 2^{-30/90} \approx 0.794$. Score: $0.7 \times 0.9 + 0.3 \times 0.794 \approx 0.868$.
>
> The new version ranks first, although its text matches the query a little less.

```plot
{
  "title": "Freshness f(a) = 2^(-a/h): half-life 90 days (blue) and 365 days (gold)",
  "xAxis": { "label": "age a in days", "domain": [0, 730] },
  "yAxis": { "label": "freshness f", "domain": [0, 1.05] },
  "disableZoom": true,
  "data": [
    { "fn": "2^(-x/90)", "color": "#1E6091" },
    { "fn": "2^(-x/365)", "color": "#B8860B" }
  ]
}
```

With $h = 90$, a source of 180 days has a freshness of 0.25. With $h = 365$, it has about 0.71. The half-life sets how fast an old source loses to a new one. Choose it per kind of content: a price list ages faster than a design principle.

**Conditions.**

| Code | Window content |
|---|---|
| S0 | New version only (the reference for current values) |
| S1 | Old version only (a check that the model uses the context) |
| S2 | Both, no dates, new first |
| S3 | Both, no dates, old first, so the old version is closer to the question |
| S4 | Both, with `updated` dates in the labels, random order |
| S5 | S4, plus: "If sources disagree, use the most recent one, and say that an older version exists." |
| S6 | Code filtering: only the newest version per fact key |
| S8 | Freshness-ranked: the top 3 of 6 candidates by $s(d)$ with $h = 90$ and $w = 0.3$ |

A separate set of 40 contradiction items has two undated sources with different values: S7a with no instruction about conflicts, and S7b with "If sources disagree and you cannot tell which is newer, say so."

**Models.** Claude Haiku 5.5, and Claude Sonnet 5.5 for comparison.

**Trials and randomization.** 60 questions × 8 conditions × 3 repeats = 1,440 trials, plus 40 items × 2 conditions × 3 repeats = 240. Total 1,680. Shuffle the order and the source IDs with a fixed seed.

**Cost estimate.** About 1,600 input and 150 output tokens per trial. On Claude Haiku 5.5 (USD 0.10 / 0.50 per MTok, checked on 2026-10-12): $1{,}680 \times (0.10 \times 1{,}600 + 0.50 \times 150)/10^6 \approx 0.39$ USD. On Claude Sonnet 5.5 (USD 2 / 10): about 7.90 USD.

## 6. Metrics

- **Stale-answer rate:** $\text{SAR} = \frac{\text{current-value answers that state the old value}}{\text{current-value trials}}$. The values are invented and distinct, so a regex decides it.
- **Current accuracy** and **history accuracy:** the share of correct answers for each question type.
- **Conflict-flag rate:** $\text{CFR} = \frac{\text{answers that state the disagreement}}{\text{contradiction trials}}$. Use a regex for words such as "conflict", "disagree" or "two sources", and check 30 answers by hand.
- **Stale in top $k$** (S8): the share of trials in which the old version reaches the top 3.
- **Mean age of the injected sources**, in days (lesson 8.8).

Compare conditions with the paired test of [E1](/notes/ai/context-engineering/11-research-track/e1-context-utilization).

## 7. Report

**Result table.** One row per condition and model. Columns: SAR with its 95% interval, current accuracy, history accuracy, stale in top $k$ (S8 only), mean age of injected sources, mean input tokens.

**Contradiction table.** S7a and S7b: CFR, the share of answers that state the first source's value, and the share that state the second's.

**Plot.** SAR per condition as points with error bars, in the order of the conditions table.

**Decision lines.** Three decisions for the capstone. Do source labels and memories show dates? Does memory scoring get a freshness term? Where do history questions find old values?

## 8. Threats to validity

1. **Synthetic clarity.** Real documents rarely state "this replaces version C". Synthetic versions make staleness easier to detect than in real data.
2. **Date parsing.** The model must compare dates in text. Use one date format, ISO 8601, in all labels.
3. **Position.** S2 and S3 separate order from dates. Without them, a date effect could be a position effect.
4. **Question wording.** "Now" and "currently" signal that time matters. Write half of the current-value questions without such a word.
5. **Freshness parameters.** S8 tests one pair of $h$ and $w$. Other values can rank differently. Treat S8 as one point of a curve.

## 9. Extensions

1. **Stale memory against a fresh document:** M5 stores an old fact, and retrieval brings the new document. Which one wins?
2. **More than two versions:** three or four revisions, with the newest not the most relevant.
3. **A sweep of $h$ and $w$** for S8, with stale in top $k$ and current accuracy as the two axes of the trade-off.
4. **Conflicts over turns:** a tool result at turn 3 and a newer one at turn 9 for the same value, in the history.

## 10. Check questions

```check
{
  "question": "A source is 180 days old. What is its freshness with a half-life of 90 days, and what freshness weight w makes it lose to a new source (freshness 1.0) whose normalized relevance is 0.8, when the old source has relevance 1.0?",
  "hint": "Set (1 − w) × 1.0 + w × f_old below (1 − w) × 0.8 + w × 1.0.",
  "answer": "f = 2^(−180/90) = 0.25. The old score is (1 − w) + 0.25w = 1 − 0.75w. The new score is 0.8(1 − w) + w = 0.8 + 0.2w. The new source wins when 0.8 + 0.2w > 1 − 0.75w, so 0.95w > 0.2 and w > 0.21."
}
```

```check
{
  "question": "Why does the design include S1, a condition with only the old version?",
  "answer": "S1 checks that the model takes the value from the context and not from elsewhere. With only the old version, the correct answer is the old value. If the model gives some other value in S1, the experiment measures guessing, not the choice between versions. Invented values make S1 easy to pass, which is the point of the check."
}
```

```check
{
  "question": "Why does the dataset use invented values instead of real facts, such as a real API limit?",
  "answer": "A model may know real facts from training. Then a correct answer in S2 or S3 can come from the weights, not from a choice between the two sources, and the stale-answer rate looks lower than it is. Invented values make the context the only source of the answer, so the metric measures what the experiment is about."
}
```

## 11. Links

- Previous: [E4: Repeated instructions](/notes/ai/context-engineering/11-research-track/e4-repeated-instructions)
- Next: [E6: Source trust and attribution](/notes/ai/context-engineering/11-research-track/e6-source-trust)
- [Lesson 1.5: Position and length effects](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects)
- [Lesson 8.3: Retrieval, scoring and decay](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay)
- Capstone: [M5: Memory](/notes/ai/context-engineering/10-capstone/m5-memory)
- [Glossary](/notes/ai/context-engineering/glossary)
