---
title: "E6: Source trust and attribution"
order: 6
summary: "When an official source and a community source disagree in the window, how often does the model adopt the wrong one? Compare trust labels, trust-weighted ranking and filtering, and measure whether each citation points to a chunk that supports its claim. Covers bootcamp topic 11."
status: not-started
tags: [research, trust, attribution, citations, provenance]
---

## 1. Research question

The corpus holds sources of different trust: official documents, team notes and community posts. Some of them disagree. When a trusted and an untrusted source disagree in the window, how often does the model adopt the untrusted claim? Which remedy works best: trust labels, trust-weighted ranking, or filtering in code? And does each citation in the answer point to a chunk that supports the claim next to it?

## 2. Why it matters

The capstone labels each source with its document, section and date (M2), and it checks only that cited IDs exist. The production decisions are:

1. Does the source label carry a trust tier?
2. Does retrieval rank by trust, or does code filter low-trust sources?
3. Does the citation check also test support, and does a failed check block the answer?

The experiment builds on these lessons:

- [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order): source labels and the citation check.
- [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches): provenance rules for retrieved knowledge.
- [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval): faithfulness.
- [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection): untrusted content in the window.

## 3. Hypothesis

- **H1.** Take similarity selection, no trust labels, and both sources in the window. The model then states the community source's wrong value in at least 25% of the trials.
- **H2.** Trust labels alone cut that rate by less than half.
- **H3.** Trust-weighted ranking or filtering cuts it by at least 80%.
- **H4.** In every condition with labels, citation precision is at least 0.90.

Each hypothesis is wrong if its measured value is on the other side of its threshold.

## 4. Background

- **The model can only cite what it can see.** A context without source IDs makes the model cite nothing or invent a source. Lesson 5.6 adds labels and a check in code: every cited ID must exist in the context.
- **Wrong context gives confident, wrong output.** In lesson 2.5, the handbook's own retrieved API reference was wrong, and the code built on it failed. The fix starts with provenance: source, version and the date of the last check.
- **Data has no authority.** OpenAI's Model Spec treats tool outputs, files and quoted text as untrusted data by default (lesson 3.1). Trust here is a different question: not "may this text give orders?" but "is this text true?".
- **Faithfulness is not truth.** RAGAS faithfulness checks that the context supports each claim of the answer (lesson 5.8). An answer can be fully faithful to a wrong source.
- **Confident errors.** Lesson 9.6 calls an agent that gives a confident wrong answer a misbehaving agent, which no error monitor sees.

## 5. Method

**Dataset.** Synthetic, with invented values. Generate 30 facts with a fixed seed. For each fact, write two documents in the **same style and format**:

| Tier | Label | Content |
|---|---|---|
| A | `trust="official"`, for example "Service spec, platform team" | The true value |
| C | `trust="community"`, for example "Forum answer" | A wrong value |

Only the label differs between the two, so any trust effect comes from the label and not from the writing. Add 3 distractor chunks per question. Write 2 questions per fact: one with the fact's own words and one paraphrase. That gives 60 questions.

The work-domain variant: a machine setting that an official SOP (tier A) states correctly and a chat export (tier C) states wrongly, with invented values.

**Trust score.** For T2, retrieval mixes normalized relevance with a trust weight:

$$
s(d) = (1 - \beta)\,\widehat{\text{rel}}(d) + \beta\,\tau(d), \qquad \tau(A) = 1.0,\ \tau(C) = 0.2
$$

The symbols mean:

- $\widehat{\text{rel}}(d)$ is the min-max normalized relevance among the 10 candidates (lesson 8.3).
- $\tau(d)$ is the trust of the source's tier.
- $\beta = 0.4$ is the weight of trust.

**Conditions.**

| Code | Selection | Label | Instruction |
|---|---|---|---|
| T0 | Similarity top 5, both A and C included | No trust attribute | None |
| T1 | As T0 | `trust` attribute | None |
| T2 | Top 5 of 10 candidates by $s(d)$ | `trust` attribute | None |
| T3 | As T0, then code drops a C source when an A source on the same fact is present | `trust` attribute | None |
| T4 | As T1 | `trust` attribute | "Prefer official sources. If sources disagree, say so and cite both." |

In T0, T1 and T4, the construction makes sure that both the A and the C source of the fact are among the 5 chunks. Their positions and IDs are shuffled per trial.

**Models.** Claude Haiku 5.5, and Claude Sonnet 5.5 for comparison.

**Trials and randomization.** 60 questions × 5 conditions × 3 repeats = 900 trials. Shuffle the trial order with a fixed seed.

**Cost estimate.** About 2,000 input and 250 output tokens per trial. On Claude Haiku 5.5 (USD 0.10 / 0.50 per MTok, checked on 2026-10-12): $900 \times (0.10 \times 2{,}000 + 0.50 \times 250)/10^6 \approx 0.29$ USD. On Claude Sonnet 5.5 (USD 2 / 10): about 5.85 USD.

## 6. Metrics

The values are invented numbers, so code can find each stated value and each citation.

- **Accuracy:** the share of answers that state the tier-A value.
- **Wrong-source adoption:** $\text{WSA} = \frac{\text{answers that state the tier-C value}}{\text{trials with the tier-C source in the window}}$.
- **Disclosure rate:** the share of answers that state that the sources disagree.
- **Citation precision:** $\text{CP} = \frac{\text{citations whose chunk contains the value of the claim}}{\text{all citations}}$.
- **Citation recall:** $\text{CR} = \frac{\text{claims with a value that carry a supporting citation}}{\text{claims with a value}}$.
- **Invented citations:** the share of cited IDs that are not in the context.

Compare conditions with the paired test of [E1](/notes/ai/context-engineering/11-research-track/e1-context-utilization).

## 7. Report

**Result table.** One row per condition and model. Columns: accuracy, WSA with its 95% interval, disclosure rate, CP, CR, invented citations, mean input tokens.

**Error table.** One row for each answer that adopted the tier-C value. Columns: the condition, the positions of the A and C sources, and whether the answer cited the C source. This shows whether wrong answers at least cite their wrong source.

**Plot.** WSA per condition, as points with error bars. Name the colors in the title.

**Decision lines.** The trust attribute in the capstone's labels, the ranking weight or the filter, and the strictness of the citation check.

## 8. Threats to validity

1. **Explicit labels.** Real trust is rarely a clean label. A model that obeys a label here may still fail on real sources whose trust is implicit.
2. **Style leakage.** If the official document is better written, the model may trust its style, not its label. The same-style rule controls this. Check 10 document pairs by hand.
3. **Single-value claims.** The code metrics assume one value per claim. Real answers mix claims. A judge is needed there (lesson 9.6).
4. **The trusted source can be stale.** Filtering by trust keeps an official value that may be outdated (E5). This dataset has no stale official sources, so it cannot show that cost.
5. **Two tiers only.** Team notes (tier B) sit between A and C and are the hardest case. They are an extension.

## 9. Extensions

1. **A real dataset from these notes:** each "Source check" callout pairs a handbook claim with a corrected version and its primary source. Make tier-C and tier-A documents from 20 of them.
2. **Tier B:** team notes that agree with tier A on half of the facts and with tier C on the other half.
3. **The model as judge of trust:** ask the model to rate each source's reliability before it answers, and compare with the labels.
4. **Conflict between trust and freshness:** a new community post against an old official document. Combine the scores of E5 and E6.

## 10. Check questions

```check
{
  "question": "Why must the tier-A and tier-C documents have the same style and format?",
  "answer": "The experiment asks whether the trust label changes the model's choice. If the official document were longer, more formal or better structured, the model could prefer it for its style, and a style effect would look like a label effect. With identical style, the label is the only difference between the two sources."
}
```

```check
{
  "question": "An answer makes 4 value claims and has 5 citations. 4 citations point to chunks that contain the cited value. One cites S9, which is not in the context. 3 of the 4 claims have a supporting citation. Compute CP, CR and the invented citation rate.",
  "answer": "CP = 4 / 5 = 0.80. CR = 3 / 4 = 0.75. Invented citations = 1 / 5 = 0.20. The answer fails H4's threshold of 0.90 for citation precision."
}
```

```check
{
  "question": "T3 filters out community sources whenever an official source on the same fact is present. Name a case where this filter makes the answer worse.",
  "answer": "When the official source is out of date. A community post may report a change that the official document has not caught up with, for example a new limit after a release. The filter then removes the only correct value. This is why trust and freshness (E5) need to be weighed together, and why a disclosure of the disagreement can be better than a silent filter."
}
```

## 11. Links

- Previous: [E5: Stale and contradictory context](/notes/ai/context-engineering/11-research-track/e5-stale-context)
- Next: [E7: Structured vs plain context](/notes/ai/context-engineering/11-research-track/e7-structured-vs-plain)
- [Lesson 5.6: Retrieval budgets and chunk order](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order)
- [Lesson 2.5: Same task, three approaches](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches)
- Capstone: [M2: Retrieval](/notes/ai/context-engineering/10-capstone/m2-retrieval)
- [Glossary](/notes/ai/context-engineering/glossary)
