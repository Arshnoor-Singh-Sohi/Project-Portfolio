---
title: "E8: Context precision and recall"
order: 8
summary: "Measure what retrieval adds: context precision and context recall for 12 retrieval configurations, how well each predicts answer correctness, and whether a judge can measure context recall as well as labels can. Covers bootcamp topic 14."
status: not-started
tags: [research, context-precision, context-recall, ragas, evaluation]
---

## 1. Research question

Retrieval quality has two sides. **Context recall** asks whether the window holds everything that the answer needs. **Context precision** asks whether the relevant chunks rank above the irrelevant ones. For the capstone pipeline:

1. How well does each metric predict whether the answer is correct?
2. Which retrieval configuration maximizes them, at what token cost?
3. Can an LLM judge measure context recall as well as human labels can?

## 2. Why it matters

The capstone gates retrieval on Recall@5 and MRR (M2) and answers on element scoring (M6). Between them is a gap: a case can fail because the context missed a fact, or because the model misused a context that had it. The production decisions are:

1. Which retrieval metric gates pull requests: a cheap label-based one, or a judge-based one.
2. The values of $k$ and of the retrieval mode.
3. Whether the system needs a precision-oriented step, such as a reranker, when recall is already high.

The experiment builds on four lessons:

- [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval): Recall@k, MRR and the RAGAS metrics.
- [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) and [5.3](/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers): the retrieval configurations.
- [9.6](/notes/ai/context-engineering/09-production/l6-evaluation): judge calibration.

## 3. Hypothesis

- **H1.** Correctness tracks context recall. Cases with full context recall are correct in at least 85% of trials. Cases with zero context recall are correct in at most the closed-book rate plus 10 points.
- **H2.** Take the cases with full context recall and $K \le 10$. The top and the bottom thirds by context precision differ in accuracy by less than 5 points.
- **H3.** Judge-based and label-based context recall agree on single claims with a Cohen's kappa of at least 0.6.

Each hypothesis is wrong if its measured value is on the other side of its threshold.

## 4. Background

- **RAGAS.** Es et al. (arXiv 2309.15217) propose "reference-free evaluation of Retrieval Augmented Generation (RAG) pipelines". The current docs (ragas 0.4.3, checked on 2026-10-12) define faithfulness, answer relevancy, context precision@K and context recall (lesson 5.8).
- **Reference-free is only partly true.** Context recall needs a reference answer. Every claim-based metric uses an LLM judge that can be wrong (lesson 5.8, the trap box).
- **Retrieval metrics.** Recall@k, Precision@k, MRR and nDCG measure the ranked list against labels (lesson 5.8).
- **Measured gains.** Anthropic reports top-20 failure rates, defined as 1 minus Recall@20. The rate is 5.7% at baseline and 2.9% with contextual embeddings and contextual BM25. With reranking added, it is 1.9% (lesson 5.2).
- **Distractors.** Chroma's report says that "the impact of distractors and their non-uniformity amplifies as input length grows" (lesson 1.5). Low precision means more distractors.
- **Judges need calibration.** Kappa against human labels, and its uncertainty with few items (lesson 9.6 and capstone M6).

## 5. Method

**Dataset.** Extend the capstone ground truth set to 60 answerable cases. Split each reference answer into 2 to 4 atomic claims. Map each claim to an evidence quote in the corpus. A claim is supported by a chunk when the chunk's span overlaps the claim's evidence span by at least 50% (the rule of M2). The work-domain variant uses the synthetic NL2SQL data dictionary of [E1](/notes/ai/context-engineering/11-research-track/e1-context-utilization).

**Configurations.** 4 retrieval modes × 3 values of $K$ = 12 configurations, all from the capstone's M2 code. The modes are dense, BM25, hybrid, and hybrid with reranker. The values of $K$ are 3, 5 and 10.

**Steps per configuration and case.**

1. Retrieve the top $K$ chunks. Compute the label-based metrics. This step is free.
2. Generate an answer with Claude Haiku 5.5, twice.
3. Ask the judge which reference claims the retrieved context supports. Use a model from another family than the generator, or Claude Sonnet 5.5 when the generator is a local model.
4. Score the answer with the element scoring of M6.

Also run a closed-book baseline: the questions with no context, twice each.

**Randomization.** Shuffle the order of the (configuration, case) pairs with a fixed seed. The judge sees the claims in a shuffled order.

**Trials.** Generation: 12 × 60 × 2 = 1,440 trials. Judge: 12 × 60 = 720 calls. Closed book: 120 trials.

**Cost estimate.** Generation inputs average about 1,050, 1,550 and 2,800 tokens for $K$ = 3, 5 and 10, with 250 output tokens. Judge calls have about 3,000 input and 400 output tokens.

> [!example] Worked example: cost of the full run
> - Generation on Claude Haiku 5.5 (USD 0.10 / 0.50 per MTok, checked on 2026-10-12): about 0.44 USD.
> - Judge on Claude Sonnet 5.5 (USD 2 / 10): $720 \times (2 \times 3{,}000 + 10 \times 400)/10^6 = 7.20$ USD.
> - Closed book: about 0.02 USD.
>
> Total about 7.66 USD. The judge is 94% of it, so calibrate it on a sample before the full run.

## 6. Metrics

**Context precision@K** (RAGAS definition, lesson 5.8):

$$
\text{CP@}K = \frac{\sum_{k=1}^{K} \text{Precision@}k \times v_k}{\text{number of relevant items in the top } K}
$$

**Context recall,** label-based and judge-based:

$$
\text{CR}_{\text{label}} = \frac{\lvert \{c \in C_q : c \text{ has an overlapping chunk in the top } K\} \rvert}{\lvert C_q \rvert} \qquad \text{CR}_{\text{judge}} = \frac{\text{claims that the judge marks as supported}}{\lvert C_q \rvert}
$$

The symbols mean:

- $v_k$ is 1 if the chunk at rank $k$ is relevant, and 0 if it is not.
- $\text{Precision@}k$ is the share of relevant chunks among the first $k$.
- $C_q$ is the set of claims of the reference answer of case $q$.

> [!example] Worked example: context precision of one list
> The relevance flags of a top 5 are $v = (0, 1, 1, 0, 1)$.
>
> - Precision@2 = 1/2. Precision@3 = 2/3. Precision@5 = 3/5.
> - Sum over the relevant positions: $0.5 + 0.667 + 0.6 = 1.767$.
> - Divide by the 3 relevant items: $\text{CP@}5 \approx 0.589$.
>
> The same three relevant chunks at ranks 1 to 3 would give 1.0.

**Other metrics.**

- **Answer accuracy:** the element scoring of M6.
- **Recall@K and MRR:** as in M2.
- **Agreement:** Cohen's kappa between the label and the judge on each claim (supported or not), with the standard error of M6.
- **Diagnosis share:** the share of failed answers with $\text{CR}_{\text{label}} = 1$. These are generation failures, not retrieval failures.

## 7. Report

**Configuration table.** One row per configuration. Columns: Recall@K, MRR, CP@K, CR (label), CR (judge), answer accuracy, mean input tokens, and cost per correct answer.

**Bin table.** Rows: CR (label) equal to 0, between 0 and 1, and equal to 1. Columns: the bottom, middle and top third of CP@K. Each cell: accuracy and the number of trials. This table tests H1 and H2.

**Agreement table.** The 2 × 2 counts of label against judge over all claims, the observed and chance agreement, kappa and its standard error.

**Plot.** Accuracy against CR (label) bins, one line per value of $K$, with the closed-book accuracy as a horizontal line. Name the line colors in the title.

**Decision lines.** The retrieval metric that gates pull requests, and the default $K$ and mode.

## 8. Threats to validity

1. **Claim splitting.** You split the reference answers yourself. Another person may split them differently. Ask a colleague to split 10 answers, and compare.
2. **One evidence quote per claim.** A claim may have support elsewhere in the corpus. Then the label says "not supported" while the judge rightly says "supported". Read the disagreements before you blame the judge.
3. **Prior knowledge.** A model can answer some questions without context. The closed-book baseline shows how many.
4. **$K$ moves both metrics.** A larger $K$ raises recall and usually lowers precision. Compare precision only at equal recall, as the bin table does.
5. **Judge bias.** The judge may favor long contexts or its own model family (lesson 9.6). Calibrate it on 40 claims that you label.

## 9. Extensions

1. **Graded relevance:** label chunks as 0, 1 or 2 and add nDCG@K (lesson 5.8).
2. **Faithfulness:** add the RAGAS faithfulness of each answer, and check how often a faithful answer is wrong because its context was wrong.
3. **Reranker depth:** rerank the top 20, 50 and 150, and plot CP@5 against the depth.
4. **A label-free monitor:** test whether $\text{CR}_{\text{judge}}$ on live traffic, without reference answers, can warn of retrieval drift.

## 10. Check questions

```check
{
  "question": "The relevance flags of a top 5 are v = (1, 0, 0, 1, 1). Compute CP@5.",
  "hint": "Add Precision@k at each relevant position, then divide by the number of relevant items.",
  "answer": "Precision@1 = 1. Precision@4 = 2/4 = 0.5. Precision@5 = 3/5 = 0.6. Sum = 2.1. Three relevant items, so CP@5 = 2.1 / 3 = 0.7."
}
```

```check
{
  "question": "Label-based context recall is 0.5 for a case, and judge-based context recall is 1.0. Name two explanations, and how you decide between them.",
  "answer": "1. The second claim has support in a chunk that the label does not mark, because the label maps each claim to one quote. Then the judge is right. 2. The judge accepts weak or related text as support. Then the label is right. Read the chunk that the judge cites for the claim, and decide by hand. Count both kinds of disagreement in the report."
}
```

```check
{
  "question": "40% of the failed answers have full label-based context recall. What does that tell you about where to work next?",
  "answer": "These failures are not retrieval failures: the window held every needed fact. The model misused the context. Look at position (E2), conflicts in the window (E5, E6), the instructions and the output format. A better retriever would not fix them."
}
```

## 11. Links

- Previous: [E7: Structured vs plain context](/notes/ai/context-engineering/11-research-track/e7-structured-vs-plain)
- Next: [E9: Self-repair](/notes/ai/context-engineering/11-research-track/e9-self-repair)
- [Lesson 5.8: Measure retrieval and answers](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval)
- [Lesson 9.6: Evaluation](/notes/ai/context-engineering/09-production/l6-evaluation)
- Capstone: [M6: Evaluation and traces](/notes/ai/context-engineering/10-capstone/m6-evaluation-and-traces)
- [Glossary](/notes/ai/context-engineering/glossary)
