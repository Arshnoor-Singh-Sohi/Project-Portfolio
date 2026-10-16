---
title: "00 The paper on one page"
order: 0
summary: "The claim, the two parts of the study, the key numbers, the two mechanisms, the catalyst, the temperature verdict and the engineering rules of the paper, on one page for revision and teaching."
status: not-started
tags: [summary, reasoning-models, looping, temperature, errors-in-learning]
---

## 1. The claim

Reasoning models often **loop**: they repeat the same text until they reach their token budget. The loops are most frequent under greedy decoding and at low temperature. The authors argue that **errors in learning** are "a key cause" (abstract). An error in learning is any mismatch between the training distribution and the learned model. A higher temperature reduces the loops, but it does not remove the errors. So the authors call temperature "a stopgap rather than a holistic solution" (abstract).

## 2. The study in five lines

1. **Part 1, open models (§2):** 9 open reasoning models and 4 instruct models answer the 60 problems of AIME 2024 and 2025. There are 6 temperatures from 0 to 1 and 20 samples for each problem, model and temperature.
2. **The looping rule:** a response loops if some 30-gram appears at least 20 times. For instruct models, at least 10 times. A 30-gram is a run of 30 consecutive units of text. The paper does not say whether a unit is a token or a word.
3. **Part 2, a controlled task (§3, §4):** a small Transformer of about 85M parameters learns to walk on a star graph. Each walk goes from a start node to a goal. The authors choose the training walks exactly, so they know the teacher distribution.
4. **Dial 1:** a progress-making action that is hard to learn (§3). **Dial 2:** no hard action, only small errors (§4).
5. **Meters:** accuracy, looping fraction or looping count, and response length, at each temperature.

![The synthetic task: a start node, the root and five spokes of the star graph G(5,5), with the progress-making action and the reset](/notes/media/papers/2025-why-reasoning-models-loop/figures/star-graph-task.svg)

## 3. The picture to remember

Proposition 1 (§3) is the heart of the first mechanism. The teacher takes the progress-making action with probability $1 - p$ and an easy cyclic action with probability $p$. The student cannot tell the correct action from $n$ look-alikes. Then maximum likelihood gives the easy action $p$ and each look-alike $(1 - p)/n$. The paper proves this result.

```plot
{
  "title": "Proposition 1 with p = 0.3: each look-alike gets 0.7/n (blue), the cyclic action keeps 0.3 (red)",
  "xAxis": { "label": "n, the number of look-alike actions", "domain": [0.5, 8.5] },
  "yAxis": { "label": "probability", "domain": [0, 0.75] },
  "disableZoom": true,
  "data": [
    { "points": [[1, 0.7], [2, 0.35], [3, 0.2333], [4, 0.175], [5, 0.14], [6, 0.1167], [7, 0.1], [8, 0.0875]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[1, 0.7], [2, 0.35], [3, 0.2333], [4, 0.175], [5, 0.14], [6, 0.1167], [7, 0.1], [8, 0.0875]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true },
    { "fn": "0.3", "color": "#C81D25", "skipTip": true }
  ]
}
```

Greedy decoding takes the action with the highest probability. The blue points fall below the red line when $n > (1 - p)/p = 0.7/0.3 \approx 2.33$, so from $n = 3$. Then greedy decoding takes the cyclic action at every visit, and the text loops. On the star graph $G(5, 5)$, $n = 5$ and each child of the root gets $0.7/5 = 0.14 < 0.3$. So greedy decoding resets to the start node again and again.

## 4. Ten numbers

| Number | Meaning |
|---|---|
| 0.76 | Greedy looping fraction of DeepSeek-R1 Distilled Qwen 1.5B, the highest of all models (§2, Figure 2) |
| 0.04 | Greedy looping fraction of QwQ-32B, the teacher of OpenThinker3, the lowest of the reasoning models |
| 0.30 | Greedy looping fraction of OpenThinker3-1.5B, a student of QwQ-32B: 7.5 times its teacher |
| 30 and 20 | The looping rule: a 30-gram that appears at least 20 times |
| 0.14 and 0.3 | On $G(5,5)$ with $p = 0.3$: each child of the root gets $0.7/5 = 0.14$ and the reset keeps 0.3 (§3) |
| about 0.35 | The reset probability that the trained Transformer learned. It is even higher than the 0.3 of the data (§3.2). |
| 96.7% | In §4, the share of consecutive root visits where the trained model keeps the same top-1 child |
| 0.001 | The share of looping traces that the authors add to the training data to test the catalyst (Appendix E) |
| 105.5 and 24.8 | Response length at $T = 1$ on $G(5,5)$ with exploration: learned model and perfect learner. Ratio about 4.25 (§3.3). |
| 44.7 and 27.7 | Response length at $T = 1$ in the §4 setting: learned model and perfect learner. Ratio about 1.6 (§4.1). |

The paper rounds the two ratios to "≈ 4×" and "≈ 1.5×". The values 4.25 and 1.61 are computed in these notes (page 11).

## 5. Why, in two mechanisms and a catalyst

| Force | Setting | What the paper shows |
|---|---|---|
| Risk aversion from hardness of learning (page 08) | The progress-making action is hard to learn, and an easy cyclic action exists. | The student spreads the hard action's probability over $n$ look-alikes. The cyclic action wins under greedy decoding. Proposition 1 proves it for a simple learner. The trained Transformer shows the start-root loop. |
| Temporally correlated errors (page 09) | No action is hard. Each of 5 children should get 0.2. | The model learns about $0.2 \pm 0.05$. Its errors keep the same direction from visit to visit, so greedy decoding takes the same wrong spoke again. |
| The catalyst (page 10) | A loop has already started. | In two real traces, the top-1 probability climbs toward 1 inside the loop. With 0.001 looping traces in its data, the graph model becomes almost certain to continue a loop. |

The authors hypothesize that pretraining data with repeated text causes the catalyst in real models. They do not test this hypothesis in real models.

## 6. Temperature: the verdict

Temperature raises each probability to the power $1/T$ and normalizes again. So it never changes the order of the actions. A higher temperature lets the walk leave a loop, because the cyclic action stops winning at every visit. But the student still gives equal probability to the correct child and its look-alikes. So it needs many wrong tries before it reaches the goal.

The paper's answer is two-sided. Temperature "is a reasonable fix when the errors are small (as in the temporally correlated errors mechanism), but is more of a stopgap when they are large (as in the hardness-based mechanism)" (§5). As fixes at training time, the authors suggest hints at hard points of teacher traces, curricula, new architectures, and traces that favor new actions. These are suggestions. The paper tests only the margin variant of §4.1.

## 7. What to do as an engineer

Interpretation of these notes, from page 12:

1. Do not run a reasoning model with greedy decoding. Use the temperature that the provider recommends.
2. Put a loop detector on the output stream. The 30-gram rule of the paper is a measurement rule. A shorter window detects a loop sooner.
3. When a loop starts, stop and sample again from the start. Do not continue from the looped text.
4. A loop costs the full token budget. Track the share of responses that reach the budget.
5. Measure the looping fraction by temperature and by problem difficulty, with many samples per problem.
6. Expect a small distilled model to loop more than its teacher. Measure again after each distillation, quantization or model change.

## 8. One-minute explanation

Reasoning models often repeat the same text until their budget ends, mostly at low temperature. The authors measured 13 open models on AIME. Every reasoning model loops under greedy decoding, and small distilled students loop much more than their teachers: 0.30 for OpenThinker3-1.5B against 0.04 for QwQ-32B. A perfect student would copy its teacher, so the student must have errors in learning. On a star-graph task, the authors show two ways in which such errors cause loops. First, when the progress-making action is hard to learn, the student spreads its probability over look-alikes, and an easy cyclic action wins: $0.7/5 = 0.14 < 0.3$. Second, even without a hard action, a Transformer makes small errors that keep the same direction, so greedy decoding repeats the same choice. Inside a loop, the model also becomes more and more sure that the loop continues. Temperature breaks the loops, but it keeps the wrong probabilities, so the walks stay about four times longer than necessary in the hard case. The authors call temperature a stopgap and suggest fixes at training time.

## 9. Check questions

```check
{
  "question": "State the main claim of the paper in two sentences: the cause of loops, and the role of temperature.",
  "answer": "Errors in learning, a mismatch between the training distribution and the learned model, are a key cause of looping in reasoning models. Higher temperature reduces looping by exploration, but it does not fix the errors, so it is a stopgap rather than a holistic solution."
}
```

```check
{
  "question": "Why is the result 0.30 for OpenThinker3-1.5B against 0.04 for QwQ-32B evidence for errors in learning?",
  "hint": "What would a perfect student of QwQ-32B do?",
  "answer": "OpenThinker3-1.5B learned from traces of QwQ-32B. A perfect student would reproduce the teacher's distribution and loop about as often as the teacher. It loops 7.5 times as often, so it did not learn the teacher's distribution exactly."
}
```

```check
{
  "question": "With p = 0.3, from which number n of look-alike actions does greedy decoding take the cyclic action? Show the arithmetic.",
  "answer": "Greedy decoding takes the cyclic action when p > (1 - p)/n, that is, when n > (1 - p)/p = 0.7/0.3 ≈ 2.33. So from n = 3. At n = 2 each look-alike gets 0.35, which is still above 0.3. At n = 5 each gets 0.14."
}
```

```check
{
  "question": "Why does temperature not fix risk aversion, although it stops the start-root loop?",
  "answer": "Temperature raises each probability to the power 1/T and normalizes. It changes how often the reset wins, so the walk can leave the loop. But it never changes the order of the actions, and the five children of the root keep equal probability. The walk still tries wrong spokes many times: at T = 1 it is 105.5 long against 24.8 for a perfect learner, about 4.25 times longer."
}
```

## 10. Links

- [Why Reasoning Models Loop (2025)](/notes/papers/reasoning-models/2025-why-reasoning-models-loop): the paper card and the reading order
- Start the details: [01 Background: probability and next-token prediction](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/01-background-probability-and-next-token-prediction)
- The two mechanisms: [08 Why 1: risk aversion](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/08-why-1-risk-aversion) and [09 Why 2: temporally correlated errors](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/09-why-2-temporally-correlated-errors)
- The terms: [Glossary](/notes/papers/glossary)
