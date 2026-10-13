---
title: "E2: Retrieval order"
order: 2
summary: "Does the position of the relevant chunk among the retrieved chunks change accuracy, and which selection policy (similarity, diversity with MMR, or document first) gives the best set at a fixed k? Covers bootcamp topic 2."
status: not-started
tags: [research, retrieval-order, lost-in-the-middle, mmr, selection]
---

## 1. Research question

Two questions about the retrieved chunks in the window:

1. **Order.** With the same set of chunks, does the position of the relevant chunk change answer accuracy and citation accuracy?
2. **Selection.** At a fixed $k = 5$, which selection policy gives the best set: similarity order, diversity with MMR, or a document-first hierarchy?

Bootcamp topic 2 also names recency and trust as ordering keys. They need dates and trust labels, which this corpus does not have. E5 tests recency and E6 tests trust, each with a dataset built for it.

## 2. Why it matters

The capstone has a setting `RA_CHUNK_ORDER` with two values, `rank` and `edges` (M1). Its default should come from a measurement on your model, not from a rule. The selection policy of M2 is similarity top-5 after fusion. MMR is a stretch goal there, and this experiment decides whether it earns its place.

The experiment builds on lessons [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) (position effects), [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) (MMR), [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) (chunk order in the window) and [E1](/notes/ai/context-engineering/11-research-track/e1-context-utilization) (the paired test).

## 3. Hypothesis

- **H1.** Take $k = 20$ chunks, about 5,300 tokens. Accuracy with the relevant chunk in the middle is at least 5 points below accuracy with it in position 1.
- **H2.** On multi-document questions, MMR with $\lambda = 0.5$ raises Recall@5 by at least 0.10 over similarity top-5. On single-document questions, it lowers accuracy by at most 2 points.

H1 is wrong if the paired difference is below 5 points, or if the paired test does not reject "no difference". H2 is wrong if either of its two conditions fails.

The same comparison at $k = 5$ is exploratory. With 40 questions, its 95% interval is too wide to show that a small gap is zero.

## 4. Background

- **Lost in the middle.** Liu et al. (TACL 2024) tested GPT-3.5-Turbo with 20 documents. Accuracy was 75.8% with the answer document first, 53.8% in position 10 and 63.2% in position 20 (lessons 1.5 and 5.6).
- **Question last.** Anthropic's prompting guide says that queries at the end "can improve response quality by up to 30 percent in tests" with long, multi-document inputs (lesson 1.5).
- **A corrected rule.** The handbook (Session 3, FAQ Q24) says "Place the most relevant chunk first, closest to the query". With the question last, the first chunk is the farthest from it. Lesson 5.6 teaches the edges order instead and says to measure it.
- **Order sensitivity in prompts.** Few-shot results change with the order of the examples (Lu et al. 2022), and models tend to repeat answers near the end (Zhao et al. 2021). Both are in lesson [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples).
- **MMR.** Carbonell and Goldstein (SIGIR 1998) trade relevance against similarity to the chunks already chosen. LangChain's defaults are `k=4`, `fetch_k=20` and `lambda_mult=0.5` (lesson 5.5).

## 5. Method

**Dataset.** The capstone corpus and 60 questions from the extended ground truth set of E1: 40 single-document and 20 multi-document. A work-domain variant: a synthetic manual of 30 production-line procedures, each with numbered steps, and questions about one step.

**Part A: order.** Single-document questions only, so each question has exactly one gold chunk.

| Factor | Levels |
|---|---|
| $k$ | 5 and 20 |
| Gold position | 1, the middle ($\lceil k/2 \rceil$), and $k$ |
| Distractors | The top-ranked chunks of hybrid retrieval that do not contain the answer. The same set for all positions of one question. |

**Part B: selection.** All 60 questions, with $k = 5$ from the fused top 20 of M2.

| Policy | Rule |
|---|---|
| Similarity | The top 5 by fused rank |
| MMR | Greedy MMR with $\lambda = 0.5$ over the top 20 |
| Document first | Rank documents by their best chunk. Take the best chunks of the top 2 documents. |
| Random | 5 chunks drawn from the top 20: a control that shows how much selection matters at all |

**Controls.**

1. Source IDs are shuffled per trial, so an ID such as S1 does not reveal the position or the rank.
2. Each distractor is checked with the answer regexes and the overlap rule of M2. A distractor that contains the answer is replaced.
3. The instructions, labels and question position (last) are the same in every trial.

**Models.** Claude Haiku 5.5. Repeat Part A at $k = 20$ with Claude Sonnet 5.5, to see whether a stronger model shows the same effect.

**Trials and randomization.** Part A: 40 questions × 2 values of $k$ × 3 positions × 2 repeats = 480 trials. Part B: 60 questions × 4 policies × 2 repeats = 480 trials. Shuffle the trial order with a fixed seed.

**Cost estimate.** Use the formula of E1, with an output of 150 tokens.

> [!example] Worked example: cost on Claude Haiku 5.5
> Prices: USD 0.10 / MTok input and USD 0.50 / MTok output (prompts up to 100K tokens, checked on 2026-10-12).
>
> - Part A, $k = 5$: $240 \times (0.10 \times 1{,}550 + 0.50 \times 150)/10^6 \approx 0.055$ USD.
> - Part A, $k = 20$: $240 \times (0.10 \times 5{,}300 + 0.50 \times 150)/10^6 \approx 0.145$ USD.
> - Part B: $480 \times (0.10 \times 1{,}550 + 0.50 \times 150)/10^6 \approx 0.110$ USD.
>
> Total about 0.31 USD. All of it on Claude Sonnet 5.5 (USD 2 / 10) would cost about 6.22 USD.

## 6. Metrics

- **Accuracy by position:** $A(p)$, the share of passing trials with the gold chunk at position $p$.
- **Position gap:** $\Delta_{\text{mid}} = A(1) - A(\text{middle})$ and $\Delta_{\text{end}} = A(1) - A(k)$, each with the paired test of E1.
- **Citation accuracy:** the share of passing answers that cite the gold chunk's ID.
- **Recall@5** of a selection, with the overlap rule of M2.
- **Redundancy** of a selection $S$ of size $k$: the mean cosine over all pairs,

$$
\text{Red}(S) = \frac{2}{k(k-1)} \sum_{i < j} \cos(\mathbf{c}_i, \mathbf{c}_j)
$$

The symbols mean:

- $\mathbf{c}_i$ is the unit embedding of chunk $i$ in the selection.
- $\frac{k(k-1)}{2}$ is the number of pairs: 10 for $k = 5$.

## 7. Report

**Table A.** One row per $k$ and gold position. Columns: mean input tokens, accuracy with its 95% interval, citation accuracy, and the paired difference against position 1 with its test result.

**Table B.** One row per policy. Columns: Recall@5 for single-document and for multi-document questions, accuracy for each group, redundancy, and the time to select in milliseconds.

**Plot.** Accuracy against gold position, one line for $k = 5$ and one for $k = 20$, with the closed-book accuracy of E1 as a horizontal line. Name the line colors in the title.

**Decision line.** One sentence that sets the default of `RA_CHUNK_ORDER`, and one that keeps or drops MMR, each with the numbers that justify it.

## 8. Threats to validity

1. **Hidden answers in distractors.** A distractor that paraphrases the answer weakens the position effect. The regex and overlap checks catch only part of it. Read the distractors of 10 questions by hand.
2. **Label effects.** Without shuffled IDs, the model could favor S1. The shuffle removes this, but log the IDs to check it.
3. **Recency in the window.** The last position is also the closest to the question. A "last" advantage can come from proximity, not from the edge as such.
4. **A short middle at $k = 5$.** Five chunks of about 250 tokens leave little middle. Part A at $k = 5$ is exploratory.
5. **One model family.** The position effect differs between models. Report each model apart.

## 9. Extensions

1. Move the gold chunk through all 20 positions to draw the full curve on your model.
2. Compare whole-list orders on retrieved sets. Use rank order, reverse rank order and the edges order 1, 3, 5, 4, 2 of lesson 5.6.
3. Put the question first instead of last, and measure the change on long inputs.
4. Run Part A on the padded 64K inputs of E1, where the middle is long.

## 10. Check questions

```check
{
  "question": "Why does the method shuffle the source IDs in every trial?",
  "answer": "If IDs follow the position, the gold chunk in position 1 is always S1. A model that favors S1, or the first ID, would then look like a model that favors position 1. Shuffling makes the ID independent of the position, so the measured effect belongs to the position alone."
}
```

```check
{
  "question": "Why are the distractors the top-ranked chunks that do not contain the answer, and not random chunks?",
  "answer": "Random chunks are often on other topics, so the model can ignore them, and the test underestimates the problem. In production, the competing chunks are the near misses that retrieval ranks high. Using them makes the test realistic. The check that they do not contain the answer keeps the gold position the only source of the answer."
}
```

```check
{
  "question": "On multi-document questions, MMR raises Recall@5 from 0.70 to 0.84. On single-document questions, accuracy falls from 0.88 to 0.85. Is H2 supported?",
  "answer": "Only half of it. The Recall@5 gain is 0.14, above the 0.10 threshold. But the single-document loss is 3 points, more than the 2 points that H2 allows. So H2 is rejected as stated. A next step could route only multi-part questions to MMR, and test that rule on new questions."
}
```

## 11. Links

- Previous: [E1: Context utilization](/notes/ai/context-engineering/11-research-track/e1-context-utilization)
- Next: [E3: Instruction hierarchy](/notes/ai/context-engineering/11-research-track/e3-instruction-hierarchy)
- [Lesson 5.6: Retrieval budgets and chunk order](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order)
- [Lesson 5.5: Diversity with MMR](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr)
- Capstone: [M1: Context builder](/notes/ai/context-engineering/10-capstone/m1-context-builder)
- [Glossary](/notes/ai/context-engineering/glossary)
