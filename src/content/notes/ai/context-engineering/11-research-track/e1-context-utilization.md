---
title: "E1: Context utilization"
order: 1
summary: "How answer accuracy changes with the share of relevant tokens in the window, and whether selective injection of the top k chunks beats dumping the whole corpus, at what cost. Covers bootcamp topics 1 and 6."
status: not-started
tags: [research, utilization, selective-injection, context-rot, cost]
---

## 1. Research question

For a fixed set of questions, how does answer accuracy change when the share of relevant tokens in the window falls? Does **selective injection** of the top $k$ retrieved chunks match or beat **full dumping** of the whole corpus? And what does each cost per correct answer?

This experiment covers two bootcamp topics: context-window utilization efficiency (topic 1) and selective injection against full dumping (topic 6).

## 2. Why it matters

Two production decisions depend on the answer:

1. **Retrieve or dump?** Current models have windows of 1M tokens, and prompt caching makes a repeated prefix cheap (lesson [1.7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)). So "put the whole knowledge base in the prompt" is a real option. Anthropic's contextual retrieval post says that a knowledge base under 200,000 tokens can go into the prompt whole (lesson [4.3](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval)).
2. **How large is the KNOWLEDGE slot?** The capstone sets it to 6,000 tokens and $k = 5$ (M1, M2). This experiment tests that choice.

It builds on lessons [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) (position and length effects), [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) (the quality curve and ablation) and [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) (retrieval budgets).

## 3. Hypothesis

- **H1.** Top-5 selective injection reaches an accuracy within 3 points of the oracle condition (the gold chunks only). It is at least 5 points more accurate than the full-corpus dump.
- **H2.** With the same gold chunks, accuracy falls by at least 5 points when distractors grow the input from 8,000 to 64,000 tokens.

Each hypothesis is wrong if the measured difference has the other sign. It is also not supported if the paired test of section 6 does not reject "no difference" at the 5% level.

## 4. Background

- **Length hurts, even on simple tasks.** Chroma's "Context Rot" report (Hong, Troynikov and Huber, 14 July 2025) tested 18 models. Performance falls as input grows, "often in surprising and non-uniform ways". On LongMemEval, focused prompts of about 300 tokens did far better than full prompts of about 113,000 tokens (lesson 1.5).
- **Claimed windows are longer than effective ones.** RULER (arXiv 2404.06654) found that only half of 17 models stayed satisfactory at 32K tokens. NoLiMa (ICML 2025) used questions that share few words with the answer. At 32K, 11 of 13 models fell below 50% of their short-context score (lesson 1.5).
- **Position matters.** Liu et al. (TACL 2024): with 20 documents, GPT-3.5-Turbo scored 75.8% with the answer first and 53.8% in position 10. The closed-book score was 56.1% (lesson 1.5).
- **The smallest high-signal set.** Anthropic's "Effective context engineering for AI agents" (29 September 2025) calls context "a finite resource with diminishing marginal returns" (lesson 2.4).
- **Measurement method.** Lesson 2.4 gives minimum viable context, ablation and the noise of small test sets.

These sources measure older models and other tasks. This experiment measures your model on your corpus.

## 5. Method

**Dataset.** The corpus is the capstone corpus: the notes of Parts 1 to 9, 82 files, about 472,000 tokens with `o200k_base` (counted on 2026-10-12). Extend the capstone ground truth set to 50 answerable questions with evidence quotes. The gold chunks of a question are the chunks that overlap its evidence (M2, section 3.6).

A work-domain variant, free of confidential data, is a synthetic NL2SQL data dictionary. Generate it with a fixed seed, for example 150 tables of a manufacturing database with 8 described columns each. Ask 50 questions with exact answers from the generator. An example: "Which column holds the planned quantity of a production order?"

**Conditions.**

| Code | Condition | Mean input tokens (estimate) |
|---|---|---|
| C0 | Closed book: question only | 300 |
| C1 | Oracle: the gold chunks only | 900 |
| C2-k | Top $k$ of hybrid retrieval, $k \in \{3, 5, 10, 20\}$ | 1,050 / 1,550 / 2,800 / 5,300 |
| C3-L | Gold chunks plus random distractor chunks, padded to $L \in \{8\text{K}, 32\text{K}, 64\text{K}\}$ tokens | 8,000 / 32,000 / 64,000 |
| C4 | Full dump: the whole corpus | 472,000 |

**Controls.** The instructions, the source labels, the answer format and `max_tokens` are the same in every condition. The question is always last (lesson 1.5). C1 and C3 contain the same gold chunks. In C3, the position of the gold chunks is drawn at random and recorded, so that E2 can reuse the data.

**Models.** Claude Haiku 5.5 for all conditions. Claude Sonnet 5.5 on C1, C2-5, C3-64K and C4, to check that the shape of the result holds for a stronger model. A local open-weight model can run the conditions up to 32K at no API cost.

**Trials and randomization.** 50 questions × 10 conditions × 3 repeats = 1,500 trials per model. Shuffle the order of the (question, condition) pairs with a fixed seed. Draw distractors per trial, and log the seed. Use the API's default sampling settings and record them. Run the C4 trials one after another, so that the cached corpus prefix stays warm.

**Cost estimate** (lesson 1.6 notation):

$$
\text{cost} = \sum_{c} n_c \,\frac{p_{in}\,\bar{I}_c + p_{out}\,\bar{a}_c}{10^6}
$$

The symbols mean:

- $n_c$ is the number of trials of condition $c$: questions × repeats = 150.
- $\bar{I}_c$ and $\bar{a}_c$ are the mean input and output tokens of a trial. Take $\bar{a}_c = 150$.
- $p_{in}$ and $p_{out}$ are the prices in USD per MTok.

> [!example] Worked example: cost on Claude Haiku 5.5
> Prices (checked on 2026-10-12): USD 0.10 / 0.50 per MTok for prompts up to 100K tokens, USD 0.50 / 2.50 above. The cache write costs USD 0.625 and the cache read USD 0.05 per MTok above 100K.
>
> - C0 to C3: from 0.016 USD (C0) to 0.971 USD (C3-64K) per condition. Total about 1.84 USD.
> - C4 without caching: $150 \times (0.50 \times 472{,}000 + 2.50 \times 150)/10^6 \approx 35.46$ USD.
> - C4 with caching: the first trial writes 471,700 tokens of corpus for about 0.295 USD. Each later trial reads them for about 0.024 USD. Total $0.295 + 149 \times 0.024 \approx 3.89$ USD.
>
> Caching cuts the cost of the full dump by about 89%. It does not change what the model reads.

## 6. Metrics

- **Accuracy** of condition $c$: $A_c$ = trials that pass the element scoring of M6 divided by all trials of $c$.
- **Relevant-token share:** $\rho_c = T^{\text{gold}}_c / I_c$, the tokens of the gold chunks divided by the input tokens of the trial.
- **Cost per correct answer:** $\text{cost}_c / (\text{correct trials of } c)$.
- **Marginal gain per 1,000 tokens** between two neighboring conditions: $g = \Delta A / (\Delta I / 1{,}000)$ (lesson 2.4).
- **Standard error** of an accuracy over $N$ distinct questions: $\text{SE} = \sqrt{p\,(1-p)/N}$ (lesson 2.4). Repeats measure the model's randomness. They do not add questions.
- **Paired test** between two conditions X and Y. First take the majority result of the 3 repeats for each question. Let $b$ be the questions right in X and wrong in Y. Let $\bar{b}$ be the questions wrong in X and right in Y. McNemar's statistic is

$$
\chi^2 = \frac{(b - \bar{b})^2}{b + \bar{b}}
$$

It rejects "no difference" at the 5% level when $\chi^2 > 3.84$. When $b + \bar{b} < 20$, use the exact binomial test on $\min(b, \bar{b})$ with $n = b + \bar{b}$ and $p = 0.5$. Questions that both conditions get right, or both get wrong, carry no information about the difference.

## 7. Report

**Result table.** One row per condition and model. Columns: condition, mean input tokens from `usage`, $\rho$, and accuracy with its 95% interval. Then cost per trial, cost per correct answer, and $g$ against the previous row.

**Hypothesis table.** One row for H1 and one for H2. Columns: the two conditions, $b$, $\bar{b}$, the statistic or the exact p-value, and the verdict: supported, rejected or not decided.

**Plot 1.** Accuracy against input tokens on a log scale, one point per condition, with error bars. Two horizontal lines mark the oracle and the closed-book accuracy. Name the colors in the title.

**Plot 2.** For the C3 conditions, accuracy against the relative position of the gold chunks, in five bins from start to end.

## 8. Threats to validity

1. **Prior knowledge.** The model may know some answers without context. The closed-book condition measures this. Report gains above C0, and consider dropping questions that C0 always answers.
2. **Scoring.** Regex scoring can miss a correct paraphrase. Check 50 answers by hand, and report the disagreement rate.
3. **Distractor choice.** Random distractors are easy to ignore. Retrieved but wrong chunks are harder. The slope of H2 depends on this choice, so state it, or run both.
4. **Trap material.** The corpus contains handbook claims next to their corrections. Questions on those topics mix a length effect with a contradiction effect. Tag them, and report them apart (see E5).
5. **Token counts.** Local counts are estimates for Claude. Report input tokens from `usage`.
6. **Multiple comparisons.** Ten conditions give 45 pairs. Test only the pairs that H1 and H2 name. Treat the other pairs as exploration.
7. **Generality.** One corpus, one task type, two models of one family. Do not generalize beyond them without a second corpus or model family.

## 9. Extensions

1. A finer curve: $k$ from 1 to 50, to find where the gain per 1,000 tokens falls below a threshold that you choose.
2. Hard distractors: replace random distractors with the top-ranked chunks that are not gold.
3. The same design with a second model family.
4. Latency: record the time to first token per condition. A cached full dump may be cheap, but it is not fast.

## 10. Check questions

```check
{
  "question": "Why does the analysis use a paired test on the same questions, and not a comparison of two independent accuracies?",
  "answer": "Both conditions answer the same 50 questions, so most of the variation comes from the questions: some are easy in every condition and some are hard in every condition. A paired test looks only at the questions where the conditions disagree (b and b-bar). That removes the shared variation, so it detects a real difference with far fewer questions than a comparison of two independent rates."
}
```

```check
{
  "question": "Prompt caching cuts the cost of the full dump from about 35 USD to about 3.9 USD. Does caching change the accuracy that C4 measures? What else does it not change?",
  "answer": "No. Caching changes how the provider processes and bills the prefix, not what the model reads (lesson 1.7). The model still reads all 472,000 tokens, so length and position effects stay the same. It also does not cut the output price, and it does not shrink the window use. It does cut the time to first token on cache hits, which the latency extension can measure."
}
```

```check
{
  "question": "Closed-book accuracy C0 is 60%, the oracle C1 is 92% and top-5 is 88%. What share of the possible gain from retrieval does top-5 reach?",
  "hint": "Measure gains above the closed-book baseline.",
  "answer": "The possible gain is 92 − 60 = 32 points. Top-5 gains 88 − 60 = 28 points, which is 28 / 32 = 87.5% of it. Reporting only 88% against 92% hides that 60 of the 88 points need no context at all."
}
```

## 11. Links

- Next experiment: [E2: Retrieval order](/notes/ai/context-engineering/11-research-track/e2-retrieval-order)
- [Lesson 1.5: Position and length effects](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects)
- [Lesson 2.4: The quality curve](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve)
- [Lesson 1.7: Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)
- Capstone: [M2: Retrieval](/notes/ai/context-engineering/10-capstone/m2-retrieval)
- [Glossary](/notes/ai/context-engineering/glossary)
