---
title: "L8: Evaluating RAG"
order: 8
summary: "How to prove that a RAG system works and find which part broke. The evaluation dataset, retrieval metrics on one ranked list (precision, recall, hit rate, MRR, average precision, nDCG with the log discount computed), generation metrics (faithfulness, answer relevance, correctness, context precision and recall), LLM-as-a-judge and its biases, component vs end-to-end tests, and online signals."
status: not-started
tags: [rag, evaluation, ndcg, mrr, ragas, llm-as-a-judge, faithfulness]
---

## 1. The question this idea answers

"How do you evaluate a RAG system?" is one of the most common deep-dive questions. A weak answer is "we tried some questions and the answers looked good". The interviewer then asks: "Which metric? What is its formula? Compute it for this list. How do you know whether retrieval or generation failed? Can you trust an LLM as the judge?"

A RAG answer can fail in two places. Retrieval can miss the right chunk. Or generation can misuse a good chunk, add unsupported claims, or ignore the chunks completely. One end-to-end score hides which part failed, so it cannot tell you what to fix.

This lesson gives a complete method. Build a labeled dataset. Measure retrieval with ranking metrics. Measure generation with grounding and correctness metrics. Use LLM judges carefully. Separate the components with controlled experiments. Then keep measuring in production. The earlier lesson [Measure retrieval and answers](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) introduced the metrics. This lesson goes deeper: average precision, both forms of nDCG, the most common nDCG bug, judge calibration with Cohen's kappa, and significance tests.

## 2. Mental model

> [!analogy] Testing a car factory
> A car factory tests at three levels.
>
> 1. **Bench tests of parts.** The engine runs on a test stand, and the brakes on another. A failed bench test names the broken part. In RAG: retrieval metrics against labeled chunks, and generation tests with perfect chunks given by hand.
> 2. **A road test of the whole car.** A test driver follows a fixed route and scores the drive. In RAG: end-to-end answer quality on a fixed question set.
> 3. **Telemetry from customers' cars.** Sensors report problems that no test route covered. In RAG: online signals such as user feedback, empty results and abstention rates.
>
> **Where it stops working:** car parts have fixed specifications. RAG parts interact. A retriever that finds more relevant chunks can **lower** answer quality if it also adds distractors. Also, the bench-test labels are written by people or by LLMs, and they can be wrong. A "failed" retrieval may have found a relevant chunk that nobody labeled.

## 3. Terms

| Term | Plain meaning |
|---|---|
| evaluation set | A fixed set of test questions with labels: relevant documents, a reference answer, and the question type. Also called a golden dataset. |
| relevance judgment | A label that says how relevant one document is to one question. A set of them is called qrels. |
| graded relevance | Relevance labels with levels, for example 0 (not relevant) to 3 (fully answers). |
| precision@k | The share of the top $k$ results that are relevant. |
| recall@k | The share of all relevant documents that appear in the top $k$. |
| hit rate@k | 1 if at least one relevant document is in the top $k$, else 0, averaged over questions. |
| reciprocal rank | 1 divided by the rank of the first relevant result, or 0 if there is none. |
| MRR | Mean reciprocal rank: the average reciprocal rank over the questions. |
| average precision (AP) | The average of precision@i over the ranks $i$ where a relevant document appears, divided by the number of relevant documents. |
| DCG | Discounted cumulative gain: the sum of each result's gain divided by a discount that grows with its rank. |
| IDCG | The DCG of the ideal ranking: all judged relevant documents sorted by grade. |
| nDCG | DCG divided by IDCG, so 1 is a perfect ranking. |
| faithfulness | The share of the answer's claims that the retrieved context supports. Also called groundedness. |
| answer relevance | How well the answer addresses the question, whether or not it is correct. |
| answer correctness | How well the answer matches a reference answer. |
| context recall | The share of the reference answer's claims that the retrieved context supports. |
| LLM-as-a-judge | Using an LLM with a rubric to grade answers or to check claims. |
| Cohen's kappa | Agreement between two raters, corrected for the agreement expected by chance. |
| oracle context | The correct chunks, given to the generator by hand, to test generation without retrieval errors. |
| online signal | A quality measurement taken from live traffic, such as feedback or the rate of empty results. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. What to measure: a map

### 4.1 Two components, five relations

A RAG call has three texts: the **question**, the retrieved **context** and the **answer**. The evaluation set adds two labels: the **relevant documents** and the **reference answer**. Each metric measures one relation between two of these.

![Alt text: The question, context and answer of one RAG call, with the metric that measures each relation between them and the labels](/notes/media/llm-systems/figures/06-8-rag-eval-map.svg)

| Relation | Metric family | Needs labels? |
|---|---|---|
| Context against relevant-document labels | Retrieval metrics: precision@k, recall@k, MRR, AP, nDCG | Yes: relevance judgments |
| Question against context | Context relevance | No: a judge decides |
| Context against answer | Faithfulness (groundedness) | No: a judge decides |
| Question against answer | Answer relevance | No: a judge decides |
| Answer against reference answer | Answer correctness | Yes: a reference answer |

TruLens calls the three relations without labels the **RAG triad**: context relevance, groundedness and answer relevance. Its documentation says that an application that satisfies all three is "verified to be hallucination free up to the limit of its knowledge base" (checked on 2026-10-15). Note the limit: the triad says nothing about whether the knowledge base itself is complete or correct. Correctness against a reference answer covers that gap.

> [!key] The main idea
> Measure each component against its own labels, with the other component held fixed. Then measure end to end. A single score at the end tells you **that** something broke. Component scores tell you **what** broke.

### 4.2 Diagnose by isolation: three runs

Run the generator on the same questions with three kinds of context:

| Run | Context given to the generator | What it measures |
|---|---|---|
| Closed-book | None | What the model knows from its weights |
| Retrieved | The real pipeline's chunks | The real system |
| Oracle | The labeled relevant chunks | The generator alone, with perfect retrieval |

> [!example] Worked example: 200 questions, three runs
> Correct answers: closed-book 58 (29%), retrieved 142 (71%), oracle 176 (88%).
>
> - **Retrieval loss:** $176 - 142 = 34$ questions fail only because retrieval missed something. Improve retrieval first.
> - **Generation loss:** $200 - 176 = 24$ questions fail even with perfect chunks. Improve the prompt, the order, or the model ([L7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding)).
> - **Closed-book 29%:** the model answers 58 questions without any context. These questions do not test retrieval. If closed-book is high, the evaluation set is too public or too easy. Then a "good" RAG score may only reflect the weights.

## 5. The evaluation set

### 5.1 One row of the set

```json
{
  "id": "q-0142",
  "question": "What is the refund window for digital products?",
  "type": "single-hop",
  "answerable": true,
  "relevant": [
    {"doc_id": "refund-policy.md", "section": "Digital products", "grade": 3},
    {"doc_id": "faq.md", "section": "Refunds", "grade": 1}
  ],
  "reference_answer": "14 days, if the product was not downloaded.",
  "reference_claims": ["The refund window is 14 days.", "The product must not be downloaded."],
  "source": "production log, reviewed"
}
```

The fields that matter:

- `relevant` labels **documents and sections**, not chunk IDs. Chunk IDs change when you change the chunk size. Map sections to the current chunk IDs at test time.
- `grade` allows graded metrics such as nDCG. A 0 to 3 scale works well: 0 not relevant, 1 related, 2 partly answers, 3 fully answers.
- `answerable: false` rows test abstention. Include them on purpose.
- `reference_claims` makes context recall and correctness checks easier and more stable.

### 5.2 Where questions and labels are made

| Source | Strength | Weakness |
|---|---|---|
| Production logs | Real wording, real distribution | Needs labeling and privacy review |
| Domain experts | Hard, realistic questions and correct answers | Slow and expensive |
| Synthetic generation by an LLM | Volume and coverage of every document | Questions often copy the wording of the source chunk, which makes retrieval look too easy |

RAGAS generates synthetic test sets with a knowledge-graph approach (RAGAS docs, checked on 2026-10-15). It splits documents into nodes and links related nodes. Then it writes single-hop and multi-hop questions, each "specific" or "abstract". Review a sample of every synthetic batch by hand. Remove questions that are unanswerable from their own source, and rewrite questions that copy the source sentence.

**Labeling completeness.** Nobody can judge every document for every question. Search evaluation (the TREC tradition) uses **pooling**: label the union of the top results of several different systems. Documents outside the pool count as not relevant. So a new system can find a relevant document that nobody labeled and get a lower score. When a new system "loses", read its top results before you believe the number.

### 5.3 How many questions?

A metric averaged over $n$ questions is an estimate with noise. For a proportion $p$, such as a hit rate, the standard error is:

$$
\text{SE} = \sqrt{\frac{p(1 - p)}{n}}
$$

With $p = 0.8$ and $n = 200$: $\text{SE} = \sqrt{0.16 / 200} = 0.0283$, so a 95% interval is about $\pm 1.96 \times 0.0283 = \pm 0.055$. A change from 0.80 to 0.83 is inside the noise.

Compare two systems on the **same** questions. Count only the **discordant** questions: those that one system gets right and the other gets wrong.

> [!example] Worked example: a sign test on discordant questions
> System B fixes 9 questions that A gets wrong, and breaks 3 that A gets right. The other questions agree. Under the null hypothesis, each of the 12 discordant questions favors B with probability 0.5.
>
> $$
> P(X \ge 9) = \frac{\binom{12}{9} + \binom{12}{10} + \binom{12}{11} + \binom{12}{12}}{2^{12}} = \frac{220 + 66 + 12 + 1}{4{,}096} = \frac{299}{4{,}096} = 0.073
> $$
>
> The two-sided p-value is $2 \times 0.073 = 0.146$. So a net gain of 6 questions is still not convincing. Collect more discordant cases, or accept the change for other reasons, such as lower cost.

The evaluation notes explain confidence intervals and statistical power in more depth ([Pass rates and confidence intervals](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals), [Statistical power](/notes/ai/evaluation/02-statistics/l2-statistical-power)).

## 6. Retrieval metrics on one ranked list

### 6.1 The list

All metrics in this section use one question and one ranked list. The question has four judged relevant documents, with grades: D1 = 3, D2 = 2, D3 = 2, D4 = 1. The retriever returns five documents:

| Rank $i$ | Document | Grade $\text{rel}_i$ | Relevant? |
|---|---|---|---|
| 1 | D7 | 0 | no |
| 2 | D3 | 2 | yes |
| 3 | D1 | 3 | yes |
| 4 | D9 | 0 | no |
| 5 | D4 | 1 | yes |

D2 (grade 2) is relevant but was not retrieved.

### 6.2 Precision, recall and hit rate

$$
\text{P@}k = \frac{\lvert \text{Rel} \cap \text{Top}_k \rvert}{k}, \qquad \text{R@}k = \frac{\lvert \text{Rel} \cap \text{Top}_k \rvert}{\lvert \text{Rel} \rvert}
$$

The symbols mean:

- $\text{Rel}$ is the set of relevant documents (grade above 0).
- $\text{Top}_k$ is the set of the first $k$ results.
- $\lvert X \rvert$ is the number of elements of the set $X$.

> [!example] Worked example: precision, recall and hit rate at 5
> Relevant documents in the top 5: D3, D1, D4. That is 3.
>
> - $\text{P@}5 = 3 / 5 = 0.6$
> - $\text{R@}5 = 3 / 4 = 0.75$, because D2 is missing.
> - Hit rate@5 = 1, because at least one relevant document is in the top 5.
>
> At every cutoff: P@1 to P@5 are 0, 0.5, 0.667, 0.5, 0.6. R@1 to R@5 are 0, 0.25, 0.5, 0.5, 0.75.

For RAG, **recall@k at the $k$ that you send** is the most important retrieval number. The generator reads all $k$ chunks. A relevant chunk at rank 4 of 5 still reaches it. Precision@k measures how much of the context is noise.

### 6.3 Reciprocal rank and MRR

$$
\text{RR} = \frac{1}{\text{rank of the first relevant result}}, \qquad \text{MRR} = \frac{1}{\lvert Q \rvert} \sum_{q \in Q} \text{RR}_q
$$

Here the first relevant result is D3 at rank 2, so $\text{RR} = 1/2 = 0.5$. If two more questions have their first hit at rank 1 ($\text{RR} = 1$) and none at all ($\text{RR} = 0$), then $\text{MRR} = (0.5 + 1 + 0) / 3 = 0.5$.

MRR cares only about the **first** hit. It suits tasks where one result is enough, such as a reranker's top 1 or a "jump to answer" feature.

### 6.4 Average precision

Average precision rewards **every** relevant document near the top:

$$
\text{AP@}k = \frac{1}{\lvert \text{Rel} \rvert} \sum_{i=1}^{k} \text{P@}i \cdot v_i
$$

The symbols mean:

- $v_i$ is 1 if the result at rank $i$ is relevant, else 0.
- $\text{P@}i$ is the precision at rank $i$.
- $\lvert \text{Rel} \rvert$ counts **all** relevant documents of the question, also the ones not retrieved.

> [!example] Worked example: average precision
> Relevant results sit at ranks 2, 3 and 5. Precision there: $\text{P@}2 = 1/2$, $\text{P@}3 = 2/3$, $\text{P@}5 = 3/5$.
>
> $\text{AP@}5 = (0.5 + 0.6667 + 0.6) / 4 = 1.7667 / 4 = 0.4417$.
>
> The mean of AP over the questions is **MAP**. The HyDE paper of [L6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) reports MAP next to nDCG@10.

RAGAS **context precision@K** has the same numerator but a different denominator: the number of relevant items **inside** the top $K$. Here that gives $1.7667 / 3 = 0.5889$. So RAGAS context precision ignores the missed document D2. It measures ranking quality, and context recall must catch the missing document.

### 6.5 nDCG, step by step

**Discounted cumulative gain** gives each result a gain from its grade and divides it by a discount that grows with the rank:

$$
\text{DCG@}k = \sum_{i=1}^{k} \frac{g(\text{rel}_i)}{\log_2(i + 1)}, \qquad \text{nDCG@}k = \frac{\text{DCG@}k}{\text{IDCG@}k}
$$

The symbols mean:

- $\text{rel}_i$ is the grade of the result at rank $i$.
- $g(\cdot)$ is the gain function. Two forms are common. **Linear gain:** $g(r) = r$. **Exponential gain:** $g(r) = 2^r - 1$, which weights high grades much more strongly.
- $\log_2(i + 1)$ is the discount: 1 at rank 1, 1.585 at rank 2, 2 at rank 3, 2.322 at rank 4, 2.585 at rank 5.
- $\text{IDCG@}k$ is the DCG of the ideal list: **all judged relevant documents**, sorted by grade, cut at $k$.

Järvelin and Kekäläinen introduced cumulated-gain metrics (ACM TOIS, 2002). The exponential gain became common in web search evaluation. scikit-learn's `ndcg_score` uses the linear gain. With binary grades the two forms are identical, because $2^1 - 1 = 1$. Always report which form you use.

![Alt text: The nDCG worked example as bars of gain per rank, the discounted contributions, the ideal ranking and the final ratio](/notes/media/llm-systems/figures/06-8-ndcg-worked-example.svg)

> [!example] Worked example: nDCG@5 with linear gain
> **DCG.** Only ranks with a relevant result add something.
>
> | Rank $i$ | Grade | Gain $g$ | Discount $\log_2(i + 1)$ | Contribution $g / \log_2(i + 1)$ |
> |---|---|---|---|---|
> | 1 | 0 | 0 | 1.0000 | 0 |
> | 2 | 2 | 2 | 1.5850 | 1.2619 |
> | 3 | 3 | 3 | 2.0000 | 1.5000 |
> | 4 | 0 | 0 | 2.3219 | 0 |
> | 5 | 1 | 1 | 2.5850 | 0.3869 |
>
> $\text{DCG@}5 = 1.2619 + 1.5 + 0.3869 = 3.1487$.
>
> **IDCG.** The ideal list sorts all four judged documents: grades 3, 2, 2, 1.
>
> $\text{IDCG@}5 = 3/1 + 2/1.585 + 2/2 + 1/2.3219 = 3 + 1.2619 + 1 + 0.4307 = 5.6925$.
>
> **nDCG@5** $= 3.1487 / 5.6925 = 0.5531$.

> [!example] Worked example: the same list with exponential gain
> Gains $2^{\text{rel}} - 1$: ranks 2, 3, 5 give 3, 7, 1.
>
> $\text{DCG@}5 = 3/1.585 + 7/2 + 1/2.585 = 1.8928 + 3.5 + 0.3869 = 5.7796$.
>
> Ideal gains 7, 3, 3, 1: $\text{IDCG@}5 = 7 + 1.8928 + 1.5 + 0.4307 = 10.8235$.
>
> **nDCG@5** $= 5.7796 / 10.8235 = 0.5340$. The best document D1 is at rank 3, not rank 1, and the exponential gain punishes that more.

```video
{"src": "/notes/media/llm-systems/manim/m28-ndcg-step-by-step.mp4", "caption": "nDCG@5 for one ranked list: gains, log discounts, the ideal ranking and the final ratio of 0.5531."}
```

### 6.6 The most common nDCG bug

The ideal list must contain **every judged relevant document**, also the ones that the retriever missed. A frequent bug computes the ideal list from the retrieved results only.

```python
from sklearn.metrics import ndcg_score

# Grades of the five retrieved documents, in rank order, and scores that encode that order.
wrong = ndcg_score([[0, 2, 3, 0, 1]], [[5, 4, 3, 2, 1]], k=5)
# Add the missed relevant document D2 (grade 2) with the lowest score.
right = ndcg_score([[0, 2, 3, 0, 1, 2]], [[6, 5, 4, 3, 2, 1]], k=5)
print(round(wrong, 4), round(right, 4))
```

The output is `0.6612 0.5531`. `ndcg_score` builds the ideal ranking from the true grades that you pass. If you pass only the retrieved documents, the ideal list is 3, 2, 1 and IDCG is $3 + 1.2619 + 0.5 = 4.7619$. The score rises to 0.6612, and the missed document D2 costs nothing. A retriever that finds fewer documents can then look **better**.

> [!trap] nDCG@k is not monotonic in $k$
> In this example, nDCG@1 to nDCG@5 are 0, 0.2961, 0.5249, 0.4852, 0.5531. nDCG@4 is lower than nDCG@3, because rank 4 adds nothing to DCG but the ideal list adds a grade-1 document to IDCG. Compare systems only at the same $k$.

### 6.7 A small metrics module

```python
import math

def precision_at_k(ranked, qrels, k):
    return sum(1 for d in ranked[:k] if qrels.get(d, 0) > 0) / k

def recall_at_k(ranked, qrels, k):
    n_rel = sum(1 for g in qrels.values() if g > 0)
    if n_rel == 0:
        raise ValueError("the question has no relevant documents")
    return sum(1 for d in ranked[:k] if qrels.get(d, 0) > 0) / n_rel

def reciprocal_rank(ranked, qrels):
    for i, d in enumerate(ranked, start=1):
        if qrels.get(d, 0) > 0:
            return 1.0 / i
    return 0.0

def average_precision(ranked, qrels, k):
    hits, total = 0, 0.0
    for i, d in enumerate(ranked[:k], start=1):
        if qrels.get(d, 0) > 0:
            hits += 1
            total += hits / i                     # precision at this relevant rank
    return total / sum(1 for g in qrels.values() if g > 0)

def dcg(gains):
    return sum(g / math.log2(i + 1) for i, g in enumerate(gains, start=1))

def ndcg_at_k(ranked, qrels, k, exponential=False):
    gain = (lambda r: 2 ** r - 1) if exponential else (lambda r: r)
    actual = [gain(qrels.get(d, 0)) for d in ranked[:k]]
    ideal = [gain(r) for r in sorted(qrels.values(), reverse=True)[:k]]   # all judged documents
    return dcg(actual) / dcg(ideal)

ranked = ["D7", "D3", "D1", "D9", "D4"]
qrels = {"D1": 3, "D2": 2, "D3": 2, "D4": 1}
print(precision_at_k(ranked, qrels, 5), recall_at_k(ranked, qrels, 5), reciprocal_rank(ranked, qrels))
print(round(average_precision(ranked, qrels, 5), 4))
print(round(ndcg_at_k(ranked, qrels, 5), 4), round(ndcg_at_k(ranked, qrels, 5, exponential=True), 4))
```

It prints `0.6 0.75 0.5`, then `0.4417`, then `0.5531 0.534`. The important lines:

- `qrels.get(d, 0)` treats every unjudged document as grade 0. That is the pooling assumption of section 5.2.
- `ideal = ... sorted(qrels.values(), ...)` builds IDCG from **all** judged documents, which avoids the bug of section 6.6.
- `recall_at_k` raises an error for a question with no relevant documents. Unanswerable questions belong to the abstention metrics, not to recall.

### 6.8 Which metric at which stage

| Stage | Typical $k$ | Main metric | Why |
|---|---|---|---|
| Candidate retrieval (ANN, BM25, hybrid) | 50 to 200 | Recall@k | The reranker can only reorder what this stage found. |
| After reranking | 5 to 10 | nDCG@k, MRR | Order matters now. |
| Context sent to the generator | the $k$ you send | Recall@k and precision@k | Recall: did the evidence arrive? Precision: how much noise arrived with it? |

Databricks' AI Search retrieval quality guide uses the same split. It gives recall@10 and recall@50, and precision@3 and precision@10, as example metrics (checked on 2026-10-15).

## 7. Generation metrics

### 7.1 Faithfulness

RAGAS defines faithfulness as a ratio of claim counts (RAGAS docs, version 0.4.3, checked on 2026-10-15):

$$
\text{Faithfulness} = \frac{\text{claims supported by the context}}{\text{all claims in the answer}}
$$

The computation has two judge steps: an LLM splits the answer into claims, then checks each claim against the context.

> [!example] Worked example: faithfulness
> Context: S1 "Digital products can be refunded within 14 days if they were not downloaded." S2 "Refunds are paid to the original payment method."
>
> Answer claims:
>
> 1. The refund window for digital products is 14 days. Supported by S1.
> 2. The product must not be downloaded. Supported by S1.
> 3. Refunds go to the original payment method. Supported by S2.
> 4. Refunds arrive within 5 business days. Not supported.
>
> Faithfulness $= 3 / 4 = 0.75$. Claim 4 may be true in the real world. Faithfulness still counts it as a failure, because the user cannot verify it against a source.

Faithfulness needs no reference answer, so it can run on live traffic. The legacy RAGAS API also has a variant that uses Vectara's HHEM-2.1-Open classifier for the verification step, instead of an LLM.

### 7.2 Answer relevance

RAGAS computes answer relevancy without a reference. An LLM writes $N$ questions that the answer would fit, 3 by default. The score is the mean cosine similarity between the embedding of each generated question and the embedding of the user's question:

$$
\text{AnswerRelevancy} = \frac{1}{N} \sum_{i=1}^{N} \cos(E_{g_i}, E_o)
$$

The symbols mean:

- $E_{g_i}$ is the embedding of the $i$-th generated question.
- $E_o$ is the embedding of the original user question.

With toy similarities 0.92, 0.88 and 0.95, the score is $(0.92 + 0.88 + 0.95) / 3 = 0.9167$. The docs state that this metric does not judge factual accuracy. A fluent, on-topic, wrong answer scores high. The current class is `AnswerRelevancy`. The older `ResponseRelevancy` class is deprecated in 0.4 and is scheduled for removal in 1.0.

### 7.3 Answer correctness

Correctness compares the answer with a reference answer. Four methods, from strict to flexible:

| Method | How | Good for |
|---|---|---|
| Exact match | Normalized strings are equal | IDs, numbers, yes or no |
| Token F1 | Overlap of normalized tokens | Short factual answers |
| Semantic similarity | Cosine of the two answer embeddings | Paraphrases. It cannot see a wrong number. |
| Claim-level judge | Split both into claims, count matches and misses | Long answers |

> [!example] Worked example: token F1
> Reference: "30 days from delivery". Answer: "within 30 days of delivery".
>
> After normalization (lowercase, no punctuation, no articles): answer tokens {within, 30, days, of, delivery}, 5 tokens. Reference tokens {30, days, from, delivery}, 4 tokens. Shared: 30, days, delivery, 3 tokens.
>
> Precision $= 3/5 = 0.6$. Recall $= 3/4 = 0.75$. $F_1 = \frac{2 \times 0.6 \times 0.75}{0.6 + 0.75} = 0.667$. Exact match = 0.

### 7.4 Context precision and context recall

These two RAGAS metrics judge the retrieved context with an LLM instead of document labels.

- **Context precision@K** (section 6.4): a judge marks each chunk relevant or not, using the reference answer, and the formula rewards relevant chunks near the top. The variant without a reference, `ContextUtilization`, judges the chunks against the generated answer instead.
- **Context recall:** split the **reference** answer into claims. Count the claims that the retrieved context supports, divided by all reference claims.

> [!example] Worked example: context recall
> Reference claims: (1) the window is 14 days, (2) the product must not be downloaded, (3) card refunds have a 2% processing fee. The context S1 and S2 supports claims 1 and 2, but nothing mentions a fee.
>
> Context recall $= 2/3 = 0.667$. Retrieval missed the fee policy. The generator cannot be blamed for omitting it.

RAGAS also has ID-based versions that compare retrieved IDs with reference IDs, without an LLM: `IDBasedContextPrecision` and `IDBasedContextRecall`.

### 7.5 Abstention

| Metric | Computed on | Good value |
|---|---|---|
| Abstention rate | Unanswerable questions | High |
| False-abstention rate | Answerable questions | Low |

Always report both. A system that refuses every question has a perfect abstention rate.

### 7.6 The same ideas in two frameworks

| Idea | RAGAS 0.4.3 (collections API) | MLflow judges on Databricks |
|---|---|---|
| Faithfulness or groundedness | `Faithfulness` | `RetrievalGroundedness` |
| Answer relevance | `AnswerRelevancy` | `RelevanceToQuery` |
| Context relevance | `ContextPrecision`, `ContextUtilization` | `RetrievalRelevance` |
| Context covers the reference | `ContextRecall` | `RetrievalSufficiency` (needs expectations) |
| Correctness | Not verified in these notes | `Correctness` (needs expectations) |

The MLflow scorers live in `mlflow.genai.scorers`, and Databricks hosts the default judge model (Databricks docs, checked on 2026-10-15). The names differ, but the questions are the same. Learn the relations of section 4.1, and any framework becomes a naming exercise.

## 8. LLM-as-a-judge

### 8.1 How a judge works

A judge is a model call with a rubric and a strict output format. Three styles exist:

1. **Pointwise:** grade one answer on a scale or as pass or fail.
2. **Pairwise:** choose the better of two answers.
3. **Reference-guided:** grade an answer against a reference answer.

```text
You check whether an answer is supported by the documents.
1. List every factual claim of the answer.
2. For each claim, copy the exact document sentence that supports it, or write NONE.
3. A claim is supported only if the copied sentence states it. Do not use outside knowledge.
4. Output only JSON with the fields "claims" and "score".
```

```json
{
  "claims": [
    {"claim": "The refund window is 14 days.", "evidence": "Digital products can be refunded within 14 days if they were not downloaded.", "supported": true},
    {"claim": "Refunds arrive within 5 business days.", "evidence": "NONE", "supported": false}
  ],
  "score": 0.5
}
```

Asking for the evidence sentence first makes the verdict checkable: code can confirm that the copied evidence really appears in the context.

### 8.2 Known biases, with numbers

Zheng et al. ("Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", NeurIPS 2023 Datasets and Benchmarks) measured judge behavior:

| Bias or limit | What the paper reports |
|---|---|
| Position bias | When the two answers swap places, GPT-4 gave consistent verdicts in 65.0% of cases. GPT-3.5 gave 46.2% and Claude-v1 23.8%. |
| Verbosity bias | In a "repetitive list" test that adds no information, Claude-v1 and GPT-3.5 were fooled 91.3% of the time, GPT-4 8.7%. |
| Self-enhancement | GPT-4 favored its own answers by about 10% in win rate, Claude-v1 by about 25%. The authors call the evidence limited. |
| Weak math and reasoning | Judges can be misled by wrong answers even on problems they can solve alone. |
| Agreement | GPT-4 agreed with humans in 85% of non-tied MT-bench votes. Humans agreed with each other in 81%. |

The paper's mitigations: run pairwise judgments in both orders and count a win only if both agree. Give few-shot examples (GPT-4 consistency rose from 65.0% to 77.5%). Let the judge solve the problem first, or give it a reference answer (on math questions, the failure rate fell from 70% to 15%).

### 8.3 Calibrate the judge against humans

Agreement alone can mislead. If 80% of answers pass, a judge that always says "pass" agrees with humans 80% of the time. **Cohen's kappa** corrects for chance:

$$
\kappa = \frac{p_o - p_e}{1 - p_e}
$$

The symbols mean:

- $p_o$ is the observed agreement: the share of items where judge and human agree.
- $p_e$ is the agreement expected by chance, from each rater's own pass rate.

> [!example] Worked example: is this judge good enough?
> 100 answers, graded by a human and by the judge.
>
> | | Human: pass | Human: fail |
> |---|---|---|
> | Judge: pass | 70 | 10 |
> | Judge: fail | 5 | 15 |
>
> - $p_o = (70 + 15) / 100 = 0.85$.
> - The judge passes 80%, the human passes 75%. $p_e = 0.80 \times 0.75 + 0.20 \times 0.25 = 0.60 + 0.05 = 0.65$.
> - $\kappa = (0.85 - 0.65) / (1 - 0.65) = 0.20 / 0.35 = 0.571$.
>
> 85% agreement sounds good, but kappa is only moderate. The detail matters more: of the 25 answers that the human failed, the judge caught only 15. **The judge misses 40% of the real failures.** For a groundedness monitor, that is the number to improve.

ARES (Saad-Falcon et al., arXiv 2311.09476) formalizes this idea. It fine-tunes small judges on synthetic data and corrects their errors with prediction-powered inference, using "only a few hundred human annotations".

### 8.4 Rules for judges in production

1. Pin the judge model and its version, and use temperature 0. A judge upgrade is a metric change. Re-run the human calibration set after every change.
2. Prefer pass or fail, or a short scale with written definitions, over 1 to 10.
3. Ask for evidence before the verdict, and check the evidence in code.
4. Run pairwise judgments in both orders.
5. Do not use the same model as generator and only judge, if you can avoid it.
6. Keep 100 to 200 human-labeled items per judged criterion, and report kappa next to every judge metric. (A rule of thumb of these notes, not a sourced number.)

## 9. Component, end-to-end and online evaluation

### 9.1 Component vs end-to-end

| | Component evaluation | End-to-end evaluation |
|---|---|---|
| Measures | Retriever alone (labels), generator alone (oracle context) | The final answer of the full pipeline |
| Tells you | Which part to fix | Whether users get good answers |
| Speed | Retrieval metrics: seconds, no LLM | Needs generation and a judge per question |
| Risk | Parts can look fine while their combination fails | Hides the cause of a failure |

Run both. Run retrieval metrics on every change, because they are cheap. Run judge metrics on every release or nightly, because they cost model calls.

### 9.2 Online signals

Offline sets age. Users ask new things. Monitor live traffic too (lesson [L9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture)).

| Signal | Definition | A rise or fall means |
|---|---|---|
| Thumbs down rate | Negative feedback per answer | Quality problems, but feedback is sparse and biased toward problems |
| Rephrase rate | The user asks a similar question again within a short time | The first answer did not help |
| Empty or low-score retrieval rate | The best score is below a threshold, or no chunk passes the filters | Coverage gaps or an index problem |
| Abstention rate | Answers that say "not found" | Coverage gaps, or a prompt change |
| Invalid citation rate | Answers with unknown IDs or unsupported numbers | A prompt or model regression |
| Sampled faithfulness | A judge on a random sample of live answers | Grounding regressions |
| Latency per stage | p50, p95 and p99 of each span | Index growth, a slow reranker, an LLM provider issue |

For a big change, such as a new embedding model, use **shadow mode** first. Run the new pipeline next to production, log its results, and compare offline. Then run an **A/B test**: send a share of real traffic to the new pipeline and compare the online signals.

### 9.3 Evaluation as a release gate

Treat the evaluation set like a test suite. Example gates, chosen by the team, not universal values:

- Recall@10 on the evaluation set must not fall by more than 2 points.
- Sampled faithfulness must stay at or above 0.9.
- The abstention rate on unanswerable questions must stay at or above 0.8, and false abstention at or below 0.05.

The context engineering notes show how to run evaluations in CI ([Evals in CI and versioning](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning)).

### Exercises

Use the lab folder `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, notebook folder `llm-systems/`.

1. **Metrics with tests.** Copy the module of section 6.7 into `rag_metrics.py` and write pytest tests. Acceptance test: the list of section 6.1 gives P@5 0.6, R@5 0.75, RR 0.5, AP 0.4417, nDCG@5 0.5531 (linear) and 0.534 (exponential). A list with no relevant result gives RR 0 and nDCG 0 without an error. Hint 1: use `pytest.approx` for floats. Hint 2: nDCG with DCG 0 is 0, but IDCG 0 needs an explicit error.
2. **Bootstrap interval.** Write `bootstrap_ci(per_question_scores, n=1000, seed=0)` that returns a 95% interval for the mean. Acceptance test: 160 ones and 40 zeros give an interval that contains 0.8 and has a width between 0.08 and 0.14. Hint 1: resample the questions with replacement. Hint 2: take the 2.5th and 97.5th percentiles of the resampled means.
3. **Judge calibration.** Write `kappa(judge, human)` for two lists of booleans and `failure_recall(judge, human)`. Acceptance test: the table of section 8.3 gives kappa 0.571 and failure recall 0.6. Hint 1: count the four cells first. Hint 2: chance agreement uses each rater's own pass rate.

## 10. Common mistakes

1. **"One end-to-end score is enough."** It says that something broke, not what. Run the closed-book, retrieved and oracle runs, and measure retrieval against labels.
2. **"Compute IDCG from the retrieved list."** The ideal list must contain every judged relevant document. Otherwise a retriever that misses documents scores higher.
3. **"nDCG has one formula."** Linear and exponential gains give different numbers for graded labels. Report which one you use.
4. **"Faithfulness measures truth."** It measures support by the retrieved context. A true claim from the model's memory lowers faithfulness, and a false chunk can make a false answer faithful.
5. **"Answer relevancy checks correctness."** It checks whether the answer addresses the question. A fluent wrong answer scores high.
6. **"85% agreement means the judge is good."** Correct for chance with kappa, and check how many real failures the judge catches.
7. **"Synthetic questions are as good as real ones."** They often copy the source wording and make retrieval look easy. Review them and mix them with real questions.
8. **"A gain of 3 points on 50 questions is an improvement."** It is usually inside the noise. Count discordant questions and test them.

## 11. One-minute explanation

I evaluate retrieval and generation separately, then end to end, then online. The evaluation set has real and synthetic questions, graded relevant documents labeled by section, reference answers, and unanswerable questions. For retrieval, recall@k at the k that I send is the main number. Precision@k measures noise, MRR measures the first hit, and nDCG measures the whole order with graded labels. nDCG divides each gain by log2 of rank plus one and normalizes by the ideal list of all judged documents, also the missed ones. For generation, faithfulness is the share of answer claims that the context supports. Answer relevance checks that the answer addresses the question, and correctness compares it with a reference. To find which part failed, I run the generator closed-book, with retrieved chunks and with oracle chunks. LLM judges do most of the grading, so I calibrate them against a human-labeled set with Cohen's kappa and watch position and verbosity bias. In production I watch empty results, abstentions, invalid citations and sampled faithfulness, and I gate releases on the evaluation set.

## 12. Check questions

```check
{"question": "Interview follow-up: a retriever returns A, B, C for a question whose judged relevant documents are A (grade 1), C (grade 2) and E (grade 3). E was not retrieved. Compute nDCG@3 with linear gain, showing the log discounts.", "hint": "The ideal list uses all judged documents: 3, 2, 1.", "answer": "Discounts: rank 1: $\\log_2 2 = 1$. Rank 2: $\\log_2 3 = 1.585$. Rank 3: $\\log_2 4 = 2$.\n\nDCG@3 $= 1/1 + 0/1.585 + 2/2 = 1 + 0 + 1 = 2$.\n\nIDCG@3 uses grades 3, 2, 1: $3/1 + 2/1.585 + 1/2 = 3 + 1.2619 + 0.5 = 4.7619$.\n\nnDCG@3 $= 2 / 4.7619 = 0.420$.\n\nAssume that you wrongly built the ideal list from the retrieved documents only (grades 2, 1, 0). Then IDCG would be $2 + 0.6309 = 2.6309$ and nDCG would be 0.760. The missed best document E would cost nothing."}
```

```check
{"question": "Interview follow-up: why does nDCG use the discount log2(i + 1) instead of 1/i? Compare the weight of a relevant result at rank 10 under both, and say which metric uses 1/i.", "answer": "Reciprocal rank uses $1/i$: rank 10 keeps $1/10 = 0.1$ of the weight of rank 1. The nDCG discount $1/\\log_2(i + 1)$ keeps $1/\\log_2 11 = 0.289$ at rank 10. So nDCG falls slowly and still rewards relevant results lower in the list, which fits a list that a reader or a generator consumes as a whole. MRR falls fast and only counts the first hit, which fits tasks where one result is enough. The $+1$ inside the log makes rank 1 undiscounted, because $\\log_2 2 = 1$."}
```

```check
{"question": "Interview follow-up: a dashboard shows faithfulness 0.95 but correctness 0.60 against reference answers. What are the likely causes, and which metric do you check next?", "answer": "High faithfulness means the answers stick to the retrieved context. Low correctness means they still disagree with the references. Likely causes:\n\n1. **Retrieval brings the wrong or stale chunks.** The answer faithfully repeats a wrong source. Check **context recall** (do the chunks contain the reference claims?) and recall@k against labels.\n2. **The reference answers are outdated or wrong.** Read a sample of disagreements.\n3. **The correctness method is too strict**, for example exact match on long answers. Read a sample, and switch to a claim-level judge if needed.\n\nFaithfulness is not truth: it only measures support by the context that the system retrieved."}
```

```check
{"question": "Interview follow-up: humans pass 90% of answers. A lazy judge always says pass. What are its agreement and its Cohen's kappa? What does this show?", "hint": "p_e = (judge pass rate × human pass rate) + (judge fail rate × human fail rate).", "answer": "Agreement $p_o = 0.90$, because the judge matches the human on every passed answer.\n\nChance agreement: the judge passes 100%, the human passes 90%. $p_e = 1.0 \\times 0.9 + 0 \\times 0.1 = 0.9$.\n\n$\\kappa = (0.90 - 0.90) / (1 - 0.90) = 0$.\n\n90% agreement with zero information. The judge catches none of the failures. Report kappa and the failure recall, not raw agreement, especially when one class dominates."}
```

```check
{"question": "For the list of section 6.1, AP@5 is 0.4417 but RAGAS context precision@5 is 0.5889. Explain the difference with the formulas.", "answer": "Both sum precision at the relevant ranks: $0.5 + 0.6667 + 0.6 = 1.7667$. AP divides by **all** relevant documents of the question (4), so the missed document D2 lowers it: $1.7667/4 = 0.4417$. RAGAS context precision divides by the relevant items **inside** the top $K$ (3): $1.7667/3 = 0.5889$. So RAGAS context precision only judges the order of what was retrieved. A missed document must be caught by recall@k or context recall."}
```

```check
{"question": "Interview follow-up: system B fixes 7 questions that system A gets wrong and breaks 1. Is B better at the 5% level with a two-sided sign test?", "answer": "There are 8 discordant questions. Under the null hypothesis each one favors B with probability 0.5.\n\n$P(X \\ge 7) = \\frac{\\binom{8}{7} + \\binom{8}{8}}{2^8} = \\frac{8 + 1}{256} = 0.0352$.\n\nTwo-sided: $2 \\times 0.0352 = 0.0703$. That is above 0.05, so not significant at the 5% level, although the evidence leans toward B. More discordant questions would settle it."}
```

```check
{"question": "You must create an evaluation set in one week for a RAG system over 5,000 internal documents. Describe the plan, with the fields of each row and the checks that you run on the set itself.", "answer": "1. **Collect questions:** 50 to 100 real questions from logs or from the people who will use the system, plus synthetic questions generated per document section to cover the corpus. Include multi-hop, keyword (IDs, codes) and at least 10% unanswerable questions.\n2. **Row fields:** question, type, answerable flag, relevant documents and sections with grades 0 to 3, a short reference answer, and reference claims.\n3. **Label with pooling:** run two or three different retrievers (BM25, dense, hybrid), take the union of their top results, and grade that pool.\n4. **Check the set:** a closed-book run (questions answered without context do not test retrieval), a review of synthetic questions that copy their source sentence, and a count of rows per type.\n5. **Freeze and version** the set, and add every production failure to it later."}
```

```check
{"question": "Exercise 1: show a reference solution", "answer": "```python\nimport math\nimport pytest\n\ndef precision_at_k(ranked, qrels, k):\n    return sum(1 for d in ranked[:k] if qrels.get(d, 0) > 0) / k\n\ndef recall_at_k(ranked, qrels, k):\n    n_rel = sum(1 for g in qrels.values() if g > 0)\n    if n_rel == 0:\n        raise ValueError(\"the question has no relevant documents\")\n    return sum(1 for d in ranked[:k] if qrels.get(d, 0) > 0) / n_rel\n\ndef reciprocal_rank(ranked, qrels):\n    for i, d in enumerate(ranked, start=1):\n        if qrels.get(d, 0) > 0:\n            return 1.0 / i\n    return 0.0\n\ndef average_precision(ranked, qrels, k):\n    hits, total = 0, 0.0\n    for i, d in enumerate(ranked[:k], start=1):\n        if qrels.get(d, 0) > 0:\n            hits += 1\n            total += hits / i\n    return total / sum(1 for g in qrels.values() if g > 0)\n\ndef dcg(gains):\n    return sum(g / math.log2(i + 1) for i, g in enumerate(gains, start=1))\n\ndef ndcg_at_k(ranked, qrels, k, exponential=False):\n    gain = (lambda r: 2 ** r - 1) if exponential else (lambda r: r)\n    ideal = dcg([gain(r) for r in sorted(qrels.values(), reverse=True)[:k]])\n    if ideal == 0:\n        raise ValueError(\"IDCG is 0: no judged relevant documents\")\n    return dcg([gain(qrels.get(d, 0)) for d in ranked[:k]]) / ideal\n\nRANKED = [\"D7\", \"D3\", \"D1\", \"D9\", \"D4\"]\nQRELS = {\"D1\": 3, \"D2\": 2, \"D3\": 2, \"D4\": 1}\n\ndef test_worked_example():\n    assert precision_at_k(RANKED, QRELS, 5) == pytest.approx(0.6)\n    assert recall_at_k(RANKED, QRELS, 5) == pytest.approx(0.75)\n    assert reciprocal_rank(RANKED, QRELS) == pytest.approx(0.5)\n    assert average_precision(RANKED, QRELS, 5) == pytest.approx(0.4417, abs=1e-4)\n    assert ndcg_at_k(RANKED, QRELS, 5) == pytest.approx(0.5531, abs=1e-4)\n    assert ndcg_at_k(RANKED, QRELS, 5, exponential=True) == pytest.approx(0.5340, abs=1e-4)\n\ndef test_no_hit():\n    assert reciprocal_rank([\"X\", \"Y\"], QRELS) == 0.0\n    assert ndcg_at_k([\"X\", \"Y\"], QRELS, 2) == 0.0\n\ndef test_no_relevant_labels():\n    with pytest.raises(ValueError):\n        ndcg_at_k([\"X\"], {\"X\": 0}, 1)\n\ntest_worked_example(); test_no_hit(); test_no_relevant_labels()\nprint(\"all tests passed\")\n```"}
```

```check
{"question": "Exercise 2: show a reference solution", "answer": "```python\nimport numpy as np\n\ndef bootstrap_ci(per_question_scores, n=1000, seed=0):\n    rng = np.random.default_rng(seed)\n    scores = np.asarray(per_question_scores, dtype=float)\n    idx = rng.integers(0, len(scores), size=(n, len(scores)))   # resample questions\n    means = scores[idx].mean(axis=1)\n    return float(np.percentile(means, 2.5)), float(np.percentile(means, 97.5))\n\nlo, hi = bootstrap_ci([1] * 160 + [0] * 40)\nprint(round(lo, 3), round(hi, 3), round(hi - lo, 3))\nassert lo < 0.8 < hi and 0.08 < hi - lo < 0.14\n```"}
```

```check
{"question": "Exercise 3: show a reference solution", "answer": "```python\ndef cells(judge, human):\n    tp = sum(j and h for j, h in zip(judge, human))              # both pass\n    tn = sum((not j) and (not h) for j, h in zip(judge, human))  # both fail\n    fp = sum(j and (not h) for j, h in zip(judge, human))        # judge pass, human fail\n    fn = sum((not j) and h for j, h in zip(judge, human))        # judge fail, human pass\n    return tp, tn, fp, fn\n\ndef kappa(judge, human):\n    tp, tn, fp, fn = cells(judge, human)\n    n = tp + tn + fp + fn\n    p_o = (tp + tn) / n\n    pj, ph = (tp + fp) / n, (tp + fn) / n                        # each rater's pass rate\n    p_e = pj * ph + (1 - pj) * (1 - ph)\n    return (p_o - p_e) / (1 - p_e)\n\ndef failure_recall(judge, human):\n    tp, tn, fp, fn = cells(judge, human)\n    return tn / (tn + fp)                                         # real failures that the judge caught\n\njudge = [True] * 70 + [True] * 10 + [False] * 5 + [False] * 15\nhuman = [True] * 70 + [False] * 10 + [True] * 5 + [False] * 15\nprint(round(kappa(judge, human), 3), failure_recall(judge, human))   # 0.571 0.6\nassert round(kappa(judge, human), 3) == 0.571 and failure_recall(judge, human) == 0.6\n```"}
```

## 13. Links

- Previous: [L7: Generation, grounding and citations](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding)
- Next: [L9: Production RAG architecture](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture)
- Related: [L5: Hybrid search and reranking](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking), [L6: Query-side techniques and agentic RAG](/notes/ai/llm-systems/06-rag/l6-query-side-techniques)
- Evaluation notes: [Evaluation](/notes/ai/evaluation), [Pass rates and confidence intervals](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals), [Statistical power](/notes/ai/evaluation/02-statistics/l2-statistical-power), [Independent audit](/notes/ai/evaluation/01-test-design/l3-independent-audit)
- Earlier notes: [Measure retrieval and answers](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval), [Evaluation in production](/notes/ai/context-engineering/09-production/l6-evaluation), [Context precision and recall](/notes/ai/context-engineering/11-research-track/e8-context-precision-recall)
- Interview drill: [Drill: RAG](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag), [Formula and numbers sheet](/notes/ai/llm-systems/08-interview-drills/l5-formula-sheet)

### Sources

All checked on 2026-10-15.

- RAGAS documentation, metrics: faithfulness, answer relevance, context precision, context recall. https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/ , https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/answer_relevance/ , https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/ , https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_recall/
- RAGAS test data generation for RAG. https://docs.ragas.io/en/stable/concepts/test_data_generation/rag/
- PyPI: ragas (version 0.4.3, released 2026-01-13). https://pypi.org/project/ragas/
- TruLens, the RAG triad. https://www.trulens.org/getting_started/core_concepts/rag_triad
- Zheng et al. Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena. https://arxiv.org/abs/2306.05685
- Saad-Falcon et al. ARES: An Automated Evaluation Framework for Retrieval-Augmented Generation Systems. https://arxiv.org/abs/2311.09476
- Databricks. Built-in LLM judges. https://docs.databricks.com/aws/en/mlflow3/genai/eval-monitor/concepts/judges
- Databricks. AI Search retrieval quality guide. https://docs.databricks.com/aws/en/ai-search/retrieval-quality
- scikit-learn `ndcg_score` (version 1.9.1 used for the computation in section 6.6). https://scikit-learn.org/stable/modules/generated/sklearn.metrics.ndcg_score.html
- Järvelin and Kekäläinen. Cumulated gain-based evaluation of IR techniques. ACM Transactions on Information Systems, 2002.
