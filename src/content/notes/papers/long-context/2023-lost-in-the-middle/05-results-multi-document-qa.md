---
title: "05 Results: multi-document QA"
order: 5
summary: "The U-shaped curve: accuracy is highest with the answer document first or last, can fall below closed-book in the middle, falls further with more documents, and does not improve with a longer window."
status: not-started
tags: [results, u-curve, primacy, recency, multi-document-qa]
---

## 1. The question this page answers

What happens to accuracy when the answer document moves from the first position to the last? Does a longer context window help? Do the results survive checks for other causes?

## 2. Mental model

> [!analogy] A reader who remembers the edges of the pile
> Give a reader a pile of 20 pages. The reader uses the top page best and the bottom page second best. The pages in the middle get less attention, so a fact there is often missed.
>
> **Where it stops working:** a person forgets because of memory limits. The model has every token in its context at every step. The cause is how the model weighs the tokens, not a loss of the tokens.

## 3. Terms

| Term | Plain meaning |
|---|---|
| U-curve | Accuracy against position that is high at the start, low in the middle and high again at the end. |
| best case, worst case | The highest and the lowest accuracy over all tested positions. |
| position gap | Best case minus worst case, in points. |
| point | One percentage point. 75.8% to 53.8% is a drop of 22.0 points. |
| relative drop | The drop divided by the starting value. 22.0 / 75.8 is a relative drop of 29%. |
| extended-context model | A version of a model with a larger context window, for example GPT-3.5-Turbo (16K). |

## 4. The main result: a U-curve

```plot
{
  "title": "GPT-3.5-Turbo, 20 documents: accuracy (red), closed-book 56.1% (purple), oracle 88.3% (ink)",
  "xAxis": { "label": "position of the answer document", "domain": [0, 21] },
  "yAxis": { "label": "accuracy (%)", "domain": [45, 92] },
  "disableZoom": true,
  "data": [
    { "points": [[1, 75.8], [5, 57.2], [10, 53.8], [15, 55.4], [20, 63.2]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 75.8], [5, 57.2], [10, 53.8], [15, 55.4], [20, 63.2]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "fn": "56.1", "color": "#6A4C93", "skipTip": true },
    { "fn": "88.3", "color": "#100D12", "skipTip": true }
  ]
}
```

| Position of the answer document | 1 | 5 | 10 | 15 | 20 |
|---|---|---|---|---|---|
| GPT-3.5-Turbo accuracy (%) | 75.8 | 57.2 | 53.8 | 55.4 | 63.2 |

1. **Primacy.** Position 1 gives the highest accuracy: 75.8%.
2. **Recency.** Position 20 gives 63.2%, the second highest of the five tested positions.
3. **The middle.** Position 10 gives the lowest: 53.8%.
4. **The gap.** 75.8 − 53.8 = 22.0 points. The relative drop is 29%.

> [!note] All 20 positions
> For this one model and setting, Figure 1 of the paper tests all 20 positions. Positions 2 and 3 give about 66% (approximate, read from the figure). So the fall from the start is gradual over the first few positions.

![The U-curve of GPT-3.5-Turbo with 20 documents, with the primacy end, the recency end, the middle and the closed-book line labeled](/notes/media/papers/2023-lost-in-the-middle/figures/u-curve.svg)

> [!key] Finding 1
> Accuracy is highest when the answer document is at the very start or at the very end of the context. It falls a lot when the model must use a document in the middle.

## 5. Finding 2: documents in the middle can be worse than no documents

GPT-3.5-Turbo gets 56.1% with **no documents** (closed-book). With 20 documents and the answer at position 10, it gets 53.8%. That is 2.3 points **below** closed-book.

With 30 documents, GPT-3.5-Turbo (16K) gets 50.5% at position 10. Its closed-book score is 56.0%. That is 5.5 points below closed-book.

> [!trap] Below closed-book does not mean "the model ignores the documents"
> The documents still reach the model. The paper measures only the net effect, and that net effect is negative. One likely reading: the distractors pull the answer away from what the model already knows, and the answer document in the middle does not pull hard enough.

## 6. Finding 3: more documents push the curve down

```plot
{
  "title": "GPT-3.5-Turbo (16K): 10 documents (red), 20 documents (blue), 30 documents (gold), closed-book 56.0% (purple)",
  "xAxis": { "label": "position of the answer document", "domain": [0, 31] },
  "yAxis": { "label": "accuracy (%)", "domain": [45, 80] },
  "disableZoom": true,
  "data": [
    { "points": [[1, 76.9], [5, 61.0], [10, 62.5]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 76.9], [5, 61.0], [10, 62.5]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 75.7], [5, 57.3], [10, 54.1], [15, 55.4], [20, 63.1]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[1, 75.7], [5, 57.3], [10, 54.1], [15, 55.4], [20, 63.1]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true },
    { "points": [[1, 73.4], [5, 55.1], [10, 50.5], [15, 50.9], [20, 51.8], [25, 54.9], [30, 63.7]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[1, 73.4], [5, 55.1], [10, 50.5], [15, 50.9], [20, 51.8], [25, 54.9], [30, 63.7]], "fnType": "points", "graphType": "scatter", "color": "#B8860B", "skipTip": true },
    { "fn": "56.0", "color": "#6A4C93", "skipTip": true }
  ]
}
```

| Documents | Best | Worst | Gap |
|---|---|---|---|
| 10 | 76.9 (position 1) | 61.0 (position 5) | 15.9 |
| 20 | 75.7 (position 1) | 54.1 (position 10) | 21.6 |
| 30 | 73.4 (position 1) | 50.5 (position 10) | 22.9 |

1. The best case falls a little: 76.9, 75.7, 73.4.
2. The worst case falls a lot: 61.0, 54.1, 50.5.
3. So the gap grows with the length.

> [!note] The shape keeps the U with each length
> With 10 documents, position 10 is the last position, so it is a recency point: 62.5%. With 30 documents, position 10 is in the middle: 50.5%. The same document number is good or bad, depending on whether it is near an edge.

## 7. Finding 4: a longer window does not give better use

Compare each model with its extended-context version, on inputs that fit both windows.

| Position (20 documents) | 1 | 5 | 10 | 15 | 20 |
|---|---|---|---|---|---|
| GPT-3.5-Turbo (4K) | 75.8 | 57.2 | 53.8 | 55.4 | 63.2 |
| GPT-3.5-Turbo (16K) | 75.7 | 57.3 | 54.1 | 55.4 | 63.1 |
| Claude-1.3 (8K) | 59.9 | 55.9 | 56.8 | 57.2 | 60.1 |
| Claude-1.3 (100K) | 59.8 | 55.9 | 57.0 | 57.4 | 60.0 |

The pairs differ by 0.3 points or less at every position. The two curves of each pair are almost on top of each other.

> [!key] Finding 4
> When an input fits both windows, the extended-context model is not better at using it. A larger window lets a model **accept** more tokens. It does not make the model **use** them better.

## 8. Finding 5: models differ in shape

```plot
{
  "title": "20 documents: GPT-3.5-Turbo (red), Claude-1.3 (blue), MPT-30B-Instruct (gold), LongChat-13B 16K (purple)",
  "xAxis": { "label": "position of the answer document", "domain": [0, 21] },
  "yAxis": { "label": "accuracy (%)", "domain": [45, 80] },
  "disableZoom": true,
  "data": [
    { "points": [[1, 75.8], [5, 57.2], [10, 53.8], [15, 55.4], [20, 63.2]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 75.8], [5, 57.2], [10, 53.8], [15, 55.4], [20, 63.2]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 59.9], [5, 55.9], [10, 56.8], [15, 57.2], [20, 60.1]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[1, 59.9], [5, 55.9], [10, 56.8], [15, 57.2], [20, 60.1]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true },
    { "points": [[1, 53.7], [5, 51.8], [10, 52.2], [15, 52.7], [20, 56.3]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[1, 53.7], [5, 51.8], [10, 52.2], [15, 52.7], [20, 56.3]], "fnType": "points", "graphType": "scatter", "color": "#B8860B", "skipTip": true },
    { "points": [[1, 68.6], [5, 57.4], [10, 55.3], [15, 52.5], [20, 55.0]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true },
    { "points": [[1, 68.6], [5, 57.4], [10, 55.3], [15, 52.5], [20, 55.0]], "fnType": "points", "graphType": "scatter", "color": "#6A4C93", "skipTip": true }
  ]
}
```

All values are for 20 documents. "Below closed-book" is the worst case minus the closed-book score.

| Model | Best | Worst | Gap | Closed-book | Worst minus closed-book | Oracle minus best |
|---|---|---|---|---|---|---|
| GPT-3.5-Turbo | 75.8 (1) | 53.8 (10) | 22.0 | 56.1 | −2.3 | 12.5 |
| GPT-3.5-Turbo (16K) | 75.7 (1) | 54.1 (10) | 21.6 | 56.0 | −1.9 | 12.9 |
| Claude-1.3 | 60.1 (20) | 55.9 (5) | 4.2 | 48.3 | +7.6 | 16.0 |
| Claude-1.3 (100K) | 60.0 (20) | 55.9 (5) | 4.1 | 48.2 | +7.7 | 16.4 |
| MPT-30B-Instruct | 56.3 (20) | 51.8 (5) | 4.5 | 31.5 | +20.3 | 25.6 |
| LongChat-13B (16K) | 68.6 (1) | 52.5 (15) | 16.1 | 35.0 | +17.5 | 14.8 |

The number in brackets is the position.

1. **GPT-3.5-Turbo** has the strongest U: a strong start, a weak middle, a good end.
2. **LongChat-13B (16K)** has strong primacy and weak recency: 68.6% at the start, 55.0% at the end.
3. **Claude-1.3** and **MPT-30B-Instruct** have small gaps of about 4 to 5 points. Their best position is the end.

> [!trap] A flat curve is not always a good curve
> MPT-30B-Instruct has a small gap. But its best case (56.3%) is 25.6 points below its oracle (81.9%). It uses the answer document poorly at **every** position. Read the gap together with the level of the curve.

## 9. Finding 6: even the best position loses to the oracle

At position 1, GPT-3.5-Turbo gets 75.8%. With only the answer document (oracle), it gets 88.3%. So 19 distractors cost 12.5 points, even at the best position. Distractors hurt, and the middle position hurts more.

## 10. Robustness checks

The authors test four other explanations. The main conclusion survives all four: the models do not use their whole context robustly. Checks A, C and D still show a U-curve.

| Check | The worry | What they did | Result |
|---|---|---|---|
| Ambiguous questions (Appendix A) | Some distractors may contain a reasonable answer, because Wikipedia changed between the dump and the annotation. Example: the question "what nfl team does robert griffin iii play for". | They used a subset of unambiguous questions (from AmbigQA). | Similar trends and conclusions. |
| Random distractors (Appendix B) | Maybe the model fails only because it cannot find the relevant document among similar ones. | They used random Wikipedia documents as distractors. Now the answer document is easy to find, for example by word overlap. | Higher accuracy for all models, but models still struggle to use the whole context. So the problem is not only finding the relevant document. |
| Order of distractors (Appendix C) | Search results are usually sorted best first. Maybe the model learned to trust the first results. | They shuffled the distractors and told the model that the results are in random order. | Still a U-curve. A little lower at the start, a little higher in the middle and at the end. |
| A stronger model (Appendix D) | Maybe a better model does not have the problem. | They tested GPT-4 (8K) on 500 random questions with 20 documents. | Higher accuracy than every other model, but still a U-curve. |

## 11. Common mistakes

1. **"Performance drops by more than 20 percent" means a relative drop.** For GPT-3.5-Turbo, it is 22.0 **points** absolute, a 29% relative drop.
2. **"The middle is always position 10."** The middle depends on the number of documents. Position 10 is the end with 10 documents.
3. **"The 16K model is better because it has a larger window."** On the same inputs, the two versions are almost identical.
4. **"A small gap means good use."** Check the level too. A low, flat curve means poor use at every position.

## 12. One-minute explanation

The authors moved the answer document through the positions and measured accuracy. For GPT-3.5-Turbo with 20 documents, accuracy is 75.8% at position 1, 53.8% at position 10 and 63.2% at position 20. That is a U-curve: primacy at the start, recency at the end. In the middle, accuracy can fall below the closed-book score: the documents hurt the model. More documents make the middle worse. The 16K and 100K versions of the models have almost the same curves as the shorter versions. The main conclusion survives checks with unambiguous questions, random distractors, shuffled distractors and GPT-4.

## 13. Check questions

```check
{
  "question": "With 30 documents, LongChat-13B (16K) gets 66.9% at position 1 and 51.3% at position 25. What is the position gap in points, and what is the relative drop?",
  "hint": "Subtract for points. Divide the drop by 66.9 for the relative drop.",
  "answer": "Gap: 66.9 − 51.3 = 15.6 points. Relative drop: 15.6 / 66.9 ≈ 23%."
}
```

```check
{
  "question": "GPT-3.5-Turbo (16K) gets 62.5% at position 10 with 10 documents, but 50.5% at position 10 with 30 documents. Explain the difference.",
  "answer": "With 10 documents, position 10 is the last position, so the model has its recency advantage. With 30 documents, position 10 is in the middle, where the model is worst. Also, 30 documents add 20 more distractors, which lowers the whole curve."
}
```

```check
{
  "question": "What does the comparison of GPT-3.5-Turbo (4K) and GPT-3.5-Turbo (16K) on 20 documents show?",
  "answer": "The two curves are almost the same (differences of 0.3 points or less). A larger context window does not make the model use an input of the same length better."
}
```

```check
{
  "question": "The authors replaced the retrieved distractors with random documents. Accuracy went up, but the models still struggled. What does this rule out?",
  "answer": "It rules out the idea that the U-curve comes only from the difficulty of telling the answer document apart from similar distractors. Even when the answer document is easy to identify, the models do not use the whole context well."
}
```

## 14. Links

- Previous: [04 Experiment design](/notes/papers/long-context/2023-lost-in-the-middle/04-experiment-design)
- Next: [06 Results: key-value retrieval](/notes/papers/long-context/2023-lost-in-the-middle/06-results-key-value-retrieval)
- The video of the position sweep is on [00 The paper on one page](/notes/papers/long-context/2023-lost-in-the-middle/00-paper-on-one-page).
