---
title: "00 The paper on one page"
order: 0
summary: "The claim, the experiment, the key numbers, the causes and the engineering rules of Lost in the Middle, on one page for revision and teaching."
status: not-started
tags: [summary, long-context, rag, u-curve]
---

## 1. The claim

Language models with long context windows do not use their whole context equally well. They use information at the **start** and at the **end** best. When the information is in the **middle**, accuracy falls a lot, sometimes below the score with no documents at all.

## 2. The experiment in four lines

1. **Task 1, multi-document QA:** one real question, one Wikipedia passage with the answer, and $k - 1$ retrieved passages without the answer. $k$ = 10, 20 or 30.
2. **Task 2, key-value retrieval:** a JSON object of random UUID pairs, and one key. Return its value. 75, 140 or 300 pairs.
3. **Dial 1:** move the useful item from the first position to the last. **Dial 2:** add more useless items.
4. **Meter:** accuracy, the percent of outputs that contain a correct answer.

```video
{
  "src": "/notes/media/papers/2023-lost-in-the-middle/manim/position-sweep.mp4",
  "caption": "The answer document moves through 20 positions, and each position adds one point to the accuracy curve."
}
```

## 3. The picture to remember

```plot
{
  "title": "GPT-3.5-Turbo, 20 documents: accuracy (red) and closed-book 56.1% (purple)",
  "xAxis": { "label": "position of the answer document", "domain": [0, 21] },
  "yAxis": { "label": "accuracy (%)", "domain": [45, 80] },
  "disableZoom": true,
  "data": [
    { "points": [[1, 75.8], [5, 57.2], [10, 53.8], [15, 55.4], [20, 63.2]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 75.8], [5, 57.2], [10, 53.8], [15, 55.4], [20, 63.2]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "fn": "56.1", "color": "#6A4C93", "skipTip": true }
  ]
}
```

## 4. Seven numbers

| Number | Meaning |
|---|---|
| 75.8% | GPT-3.5-Turbo, 20 documents, answer document first |
| 53.8% | The same, answer document at position 10: the worst case |
| 56.1% | The same model with no documents (closed-book) |
| 22.0 points | The gap between the best and the worst position |
| 0.3 points | The largest difference between the 4K and 16K versions on the same 20-document inputs |
| 45.6% | GPT-3.5-Turbo (16K), worst case on 300 key-value pairs. With the key before and after the data: perfect. |
| about 1.5 points | The gain of GPT-3.5-Turbo from 50 retrieved documents instead of 20 |

## 5. Why, in four tests

| Suspect | Result |
|---|---|
| Decoder-only architecture | Encoder-decoder models are robust, but only inside their training length. |
| The query comes after the data | Query before and after fixes key-value lookup. It barely changes QA. |
| Instruction fine-tuning | Not necessarily the cause. The base model has the U-curve too. Fine-tuning makes it flatter. |
| Model size | Llama-2 7B shows recency only. 13B and 70B show the full U-curve. |

## 6. What to do as an engineer

1. Measure accuracy at several positions in your own system. Report the worst case.
2. Retrieve many chunks, rerank, and keep few. Choose $k$ by end-to-end accuracy.
3. Put the best evidence first, or at the edges.
4. Put the query before and after long data.
5. Do not choose a model for its window size.

## 7. One-minute explanation

The authors asked: do models with long context windows really use the whole context? They put one useful passage among many hard distractors and moved it from the first position to the last. Accuracy formed a U: highest at the start, high at the end, lowest in the middle. For GPT-3.5-Turbo with 20 documents, accuracy fell from 75.8% to 53.8%, below its 56.1% with no documents. Longer windows did not help on the same inputs. Even exact lookup of a key in a long JSON object failed in the middle for some models. Instruction tuning is not necessarily the cause, and primacy appears only in larger models. For engineers: measure by position, keep contexts short and reranked, put key information at the edges, and repeat the query.

## 8. Check questions

```check
{
  "question": "State the main finding of Lost in the Middle in one sentence, with the shape of the curve.",
  "answer": "Accuracy is highest when the relevant information is at the start or the end of the context and lowest when it is in the middle: a U-shaped curve, even for extended-context models."
}
```

```check
{
  "question": "Why is the 53.8% result for GPT-3.5-Turbo more alarming than a simple drop from 75.8%?",
  "answer": "53.8% is below the closed-book score of 56.1%. With the answer document in the middle, the model does worse than with no documents. The documents hurt."
}
```

```check
{
  "question": "Explain primacy bias and recency bias with the GPT-3.5-Turbo numbers.",
  "answer": "Primacy: position 1 gives the highest accuracy, 75.8%. Recency: position 20 gives 63.2%, the second highest of the five tested positions (1, 5, 10, 15, 20). The middle (position 10) gives 53.8%."
}
```

```check
{
  "question": "Give two engineering rules from this paper for a RAG system, and the evidence for each.",
  "answer": "Any two, for example: (1) Rerank so the best chunks are first: the authors suggest it, and position 1 is the best position for GPT-3.5-Turbo. (2) Keep k small, because 50 documents instead of 20 added only about 1.5 points. (3) Put the query before and after the data, because it fixed key-value lookup. (4) Measure by position, because averages hide a weak middle."
}
```

## 9. Links

- [Lost in the Middle (2023)](/notes/papers/long-context/2023-lost-in-the-middle): the paper card and the reading order
- Start the details: [01 Background: language models and context](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models)
