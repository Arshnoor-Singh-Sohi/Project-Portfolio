---
title: "07 Results: looping in open models"
order: 7
summary: "What the paper measured on 13 open models: every reasoning model loops under greedy decoding, smaller models and distilled students loop more, harder problems cause more looping, reasoning models loop more than their instruct counterparts, and light RL changes little. With the (n, k) ablation, GPQA, the Phi-4 exception and a probe of one looping trace."
status: not-started
tags: [results, looping-fraction, distillation, temperature, aime, gpqa]
---

## 1. The question this page answers

What did the authors find when they measured real open models? Which models loop, at which temperatures, and on which problems? Do the findings survive a different looping rule and a different benchmark? What happens inside one loop?

## 2. Mental model

> [!analogy] Learner drivers at a large roundabout
> A driving school teaches a route through a large roundabout. One exit is correct, and one more lap is always possible. The instructor takes the correct exit almost every time. A learner who is not sure of the exit takes another lap, because a lap is easy and safe. A learner who always takes the safest-looking choice can circle many times. Weaker learners and harder routes give more laps. If the learner sometimes chooses at random, the laps stop sooner, but the trip is still longer than the instructor's.
>
> **Where it stops working:** the analogy already contains the paper's explanation, risk aversion. The results on this page are measurements. They show which models loop and when, not why. The synthetic task on pages 08 and 09 tests the "why".

## 3. Terms

| Term | Plain meaning |
|---|---|
| model family | Models from the same group, for example DeepSeek-R1 Distilled Qwen 1.5B, 7B and 32B. |
| capacity | How much a model can represent. More parameters usually give more capacity. |
| greedy looping fraction | The looping fraction at temperature 0. |
| instruct counterpart | An instruction-tuned model in the same group of Figure 2 as a reasoning model. |
| hard problems | Per model, the 5 problems of each AIME paper with the lowest accuracy at temperature 0.8. 20 in total. |
| easy problems | Per model, the 5 problems of each AIME paper with the highest accuracy at temperature 0.8. 20 in total. |
| ablation | A test that changes one part of the method to see if the result still holds. |
| GPQA Diamond | A set of 198 hard questions from biology, physics and chemistry. |
| RL post-training | Training with reinforcement learning after the main training. Phi-4-reasoning-plus has a light version of it. |
| semantic loop | A loop that repeats the same idea in slightly different words. |
| continuation | Text that a model generates after a given prefix. |
| structural insight | A key idea that moves a solution forward. The authors gave GPT-5 a list of them for one problem. |
| risk aversion | A preference for easy cyclic actions over a hard progress-making action (page 08). |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. Result 1: every reasoning model loops under greedy decoding

Figure 2 of the paper shows the greedy looping fraction of every model, averaged over AIME 2024 and 2025. The bar labels are exact.

| Family | Model | Kind | Greedy looping fraction |
|---|---|---|---|
| Qwen 2.5 | DeepSeek-R1 Distilled Qwen 1.5B | reasoning, student | 0.76 |
| Qwen 2.5 | DeepSeek-R1 Distilled Qwen 7B | reasoning, student | 0.49 |
| Qwen 2.5 | DeepSeek-R1 Distilled Qwen 32B | reasoning, student | 0.37 |
| Qwen 2.5 | Qwen2.5-Math-1.5B-Instruct | instruct | 0.05 |
| OpenThinker 3 | OpenThinker3-1.5B | reasoning, student | 0.30 |
| OpenThinker 3 | OpenThinker3-7B | reasoning, student | 0.10 |
| OpenThinker 3 | QwQ-32B | reasoning, teacher | 0.04 |
| OpenThinker 3 | Qwen2.5-1.5B-Instruct | instruct | 0.19 |
| Llama 3.1 | DeepSeek-R1 Distilled Llama 8B | reasoning, student | 0.54 |
| Llama 3.1 | Llama-3.1-8B-Instruct | instruct | 0.47 |
| Phi-4 | Phi-4-reasoning | reasoning | 0.43 |
| Phi-4 | Phi-4-reasoning-plus | reasoning, light RL | 0.45 |
| Phi-4 | Phi-4 | instruct | 0.01 |

> [!key] Result 1
> "All open reasoning models we tested loop at low temperature, with looping decreasing as temperature increases" (§2). Even the teacher QwQ-32B loops in 0.04 of greedy responses. The worst model, DeepSeek-R1 Distilled Qwen 1.5B, loops in 0.76.

> [!example] Worked example: what 0.76 means in responses
> At one temperature, each model writes $60 \times 20 = 1{,}200$ responses (page 06). A looping fraction of 0.76 means about $0.76 \times 1{,}200 \approx 912$ looping responses. Each one contains some 30-gram at least 20 times. If the repeats do not overlap, that is at least $30 \times 20 = 600$ tokens of repeated text per response.

## 5. Result 2: looping falls as temperature rises

### 5.1 The OpenThinker family (Figure 1)

Figure 1 shows the OpenThinker family across temperatures. The values at $T = 0$ are the exact bar labels of Figure 2. The other values are read by eye from line plots, so they are approximate.

```plot
{
  "title": "Approximate looping fraction vs temperature: OpenThinker3-1.5B (red), OpenThinker3-7B (gold), QwQ-32B teacher (blue)",
  "xAxis": { "label": "temperature", "domain": [-0.05, 1.05] },
  "yAxis": { "label": "looping fraction", "domain": [0, 0.32] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0.30], [0.2, 0.23], [0.4, 0.10], [0.6, 0.05], [0.8, 0.01], [1.0, 0.01]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 0.30], [0.2, 0.23], [0.4, 0.10], [0.6, 0.05], [0.8, 0.01], [1.0, 0.01]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 0.10], [0.2, 0.05], [0.4, 0.045], [0.6, 0.03], [0.8, 0.01], [1.0, 0.006]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0, 0.10], [0.2, 0.05], [0.4, 0.045], [0.6, 0.03], [0.8, 0.01], [1.0, 0.006]], "fnType": "points", "graphType": "scatter", "color": "#B8860B", "skipTip": true },
    { "points": [[0, 0.04], [0.2, 0.013], [0.4, 0.003], [0.6, 0.003], [0.8, 0.002], [1.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0.04], [0.2, 0.013], [0.4, 0.003], [0.6, 0.003], [0.8, 0.002], [1.0, 0.0]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true }
  ]
}
```

```plot
{
  "title": "Approximate average chain-of-thought length vs temperature: OpenThinker3-1.5B (red), OpenThinker3-7B (gold), QwQ-32B teacher (blue)",
  "xAxis": { "label": "temperature", "domain": [-0.05, 1.05] },
  "yAxis": { "label": "tokens", "domain": [13000, 21500] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 20800], [0.2, 20300], [0.4, 19550], [0.6, 18900], [0.8, 19000], [1.0, 19000]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 20800], [0.2, 20300], [0.4, 19550], [0.6, 18900], [0.8, 19000], [1.0, 19000]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 16350], [0.2, 16500], [0.4, 16700], [0.6, 16500], [0.8, 16450], [1.0, 16350]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0, 16350], [0.2, 16500], [0.4, 16700], [0.6, 16500], [0.8, 16450], [1.0, 16350]], "fnType": "points", "graphType": "scatter", "color": "#B8860B", "skipTip": true },
    { "points": [[0, 14350], [0.2, 14000], [0.4, 14100], [0.6, 14200], [0.8, 14400], [1.0, 14850]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 14350], [0.2, 14000], [0.4, 14100], [0.6, 14200], [0.8, 14400], [1.0, 14850]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true }
  ]
}
```

1. **Looping.** The student OpenThinker3-1.5B falls from 0.30 at $T = 0$ to about 0.01 at $T = 0.8$. All three models are close to 0 at $T = 1$.
2. **Length.** The students stay longer than the teacher at every temperature. At $T = 1$: about 19,000 tokens for 1.5B, about 16,350 for 7B and about 14,850 for QwQ-32B.

> [!example] Worked example: the length gap at T = 1 (approximate)
> 1. Student 1.5B minus teacher: $19{,}000 - 14{,}850 \approx 4{,}150$ tokens.
> 2. Ratio: $19{,}000 / 14{,}850 \approx 1.28$.
> 3. So at $T = 1$, the small student almost never loops, but it still writes about 28% more tokens than its teacher.

The paper reads this as a sign that the errors remain: "While looping largely disappears at higher temperatures, higher-capacity models still produce shorter responses ... this phenomenon is closely related to looping" (§2). Page 11 develops this argument.

### 5.2 All families (Appendix A)

Appendix A plots accuracy, looping fraction and length for each family (Figures 6 to 9). The $T = 0$ looping values are exact from Figure 2. All other values are approximate readings.

| Model | Looping at 0 | Looping at 0.6 | Looping at 1.0 | Length at 0 | Length at 1.0 | Accuracy at 0 | Accuracy at 1.0 |
|---|---|---|---|---|---|---|---|
| Distill Qwen 1.5B | 0.76 | ≈0.10 | ≈0.00 | ≈24,000 | ≈14,400 | ≈0.18 | ≈0.25 |
| Distill Qwen 7B | 0.49 | ≈0.03 | ≈0.00 | ≈18,300 | ≈12,500 | ≈0.38 | ≈0.48 |
| Distill Qwen 32B | 0.37 | ≈0.07 | ≈0.00 | ≈15,900 | ≈11,200 | ≈0.52 | ≈0.63 |
| OpenThinker3-1.5B | 0.30 | ≈0.05 | ≈0.01 | ≈20,800 | ≈19,000 | ≈0.38 | ≈0.48 |
| OpenThinker3-7B | 0.10 | ≈0.03 | ≈0.01 | ≈16,400 | ≈16,400 | ≈0.57 | ≈0.63 |
| QwQ-32B | 0.04 | ≈0.00 | ≈0.00 | ≈14,400 | ≈14,900 | ≈0.71 | ≈0.73 |
| Distill Llama 8B | 0.54 | ≈0.07 | ≈0.00 | ≈20,100 | ≈12,700 | ≈0.32 | ≈0.42 |
| Phi-4-reasoning | 0.43 | ≈0.13 | ≈0.08 | ≈16,800 | ≈11,100 | ≈0.29 | ≈0.55 |
| Phi-4-reasoning-plus | 0.45 | ≈0.09 | ≈0.03 | ≈21,900 | ≈15,300 | ≈0.32 | ≈0.69 |

Three patterns appear in this table:

1. Looping falls with temperature in every family.
2. Accuracy rises from $T = 0$ to $T = 1$ in every model.
3. In the Qwen and OpenThinker families, the larger model is shorter at $T = 1$. For example, about 14,400, 12,500 and 11,200 tokens for Distill Qwen 1.5B, 7B and 32B.

> [!trap] No loops does not mean no errors
> At $T = 1$, looping is near 0 for most models. That does not show that the models now reason as well as possible. The students are still longer than their teachers or larger siblings. The paper argues that temperature hides the loops but leaves the errors in learning (page 11).

## 6. Result 3: larger models loop less, and students loop more than their teacher

"Low temperature looping decreases with model capacity" (§2). Inside each family, the greedy looping fraction falls as the size grows:

1. DeepSeek-R1 Distilled Qwen: 1.5B 0.76 > 7B 0.49 > 32B 0.37.
2. OpenThinker 3: 1.5B 0.30 > 7B 0.10 > QwQ-32B 0.04.

The second family also shows the student and teacher gap. "When distilling from a high-capacity teacher to a low-capacity student, the student can loop significantly more than the teacher" (§2).

> [!example] Worked example: student and teacher ratios
> 1. OpenThinker3-1.5B against QwQ-32B: $0.30 / 0.04 = 7.5$.
> 2. OpenThinker3-7B against QwQ-32B: $0.10 / 0.04 = 2.5$.
> 3. The larger student is closer to its teacher, as expected if capacity limits learning.

> [!note] Size is not the only factor
> DeepSeek-R1 Distilled Qwen 32B (0.37) and QwQ-32B (0.04) are both 32B models in name. Their greedy looping fractions differ by a factor of about 9. The paper does not compare these two models directly. Interpretation of these notes: training data and method also matter, not only size.

## 7. Result 4: harder problems cause more looping

Figure 10 shows the greedy looping fraction on the 20 hard and the 20 easy problems of each model (page 06 explains the split). The bar labels are exact.

| Model | Hard problems | Easy problems | Hard minus easy |
|---|---|---|---|
| Distill Qwen 1.5B | 0.97 | 0.33 | 0.64 |
| Distill Qwen 7B | 0.89 | 0.03 | 0.86 |
| Distill Qwen 32B | 0.73 | 0.01 | 0.72 |
| OpenThinker3-1.5B | 0.51 | 0.13 | 0.38 |
| OpenThinker3-7B | 0.28 | 0.03 | 0.25 |
| QwQ-32B | 0.07 | 0.01 | 0.06 |
| Distill Llama 8B | 0.79 | 0.12 | 0.67 |
| Phi-4-reasoning | 0.29 | 0.62 | −0.33 |
| Phi-4-reasoning-plus | 0.13 | 0.63 | −0.50 |

1. Seven of the nine models loop more on hard problems.
2. Distill Qwen 1.5B loops on 0.97 of hard-problem responses: almost always.
3. Even the teacher QwQ-32B loops more on hard problems: 0.07 against 0.01.

The authors state a conjecture: "no matter how large a model is, there may always exist problems that are hard enough to induce looping" (§2). They "leave a more thorough investigation of this conjecture to future work" (§2).

> [!trap] Read "significantly" with care
> The paper says that looping is "significantly higher" on hard problems. It shows no error bars and no statistical test. Interpretation of these notes: at $T = 0$, the 20 responses to one problem are often near copies. So the effective sample size is closer to 20 problems than to 400 responses. The large gaps, such as 0.89 against 0.03, are still far too big to be noise. The small gap of QwQ-32B (0.07 against 0.01) is less certain. See [pass rates and confidence intervals](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals).

### 7.1 The Phi-4 exception

Both Phi-4 reasoning models loop more on easy problems. The authors inspected the responses by hand (Appendix A). The model "finds the answer during the CoT, then proceeds to present it, and then it gets stuck indefinitely repeating things like 'We'll produce answer in plain text.'" On easy problems it reaches the answer more often, so it enters this loop more often.

The authors note a second difference: Phi-4-reasoning was fine-tuned on OpenAI o4-mini data, "as opposed to DeepSeek-R1 or Qwen" (Appendix A). They call their explanation "only a preliminary attempt" (Appendix A).

## 8. Result 5: reasoning models loop more than their instruct counterparts

| Reasoning model | Greedy looping | Instruct model in the same group | Greedy looping |
|---|---|---|---|
| Distill Qwen 1.5B | 0.76 | Qwen2.5-Math-1.5B-Instruct | 0.05 |
| OpenThinker3-1.5B | 0.30 | Qwen2.5-1.5B-Instruct | 0.19 |
| Distill Llama 8B | 0.54 | Llama-3.1-8B-Instruct | 0.47 |
| Phi-4-reasoning | 0.43 | Phi-4 | 0.01 |

For the Qwen and Phi-4 families, "the base instruction-tuned models loop very little, while their reasoning counterparts loop a lot" (§2). Llama-3.1-8B-Instruct (0.47) and Qwen2.5-1.5B-Instruct (0.19) do loop. Even there, the paper observes "an increase in the looping percentage for the corresponding reasoning models" (§2).

> [!trap] The two kinds of model use different settings
> Instruct models count as looping at $k = 10$, not $k = 20$. Some have smaller token budgets: 3k for Qwen2.5-Math-1.5B-Instruct and 14k for Phi-4 (Appendix A). Interpretation of these notes: the looser $k$ makes a loop easier to count, and the smaller budget gives less room to repeat. So the comparison is useful but not exact.

The authors' explanation: "The amount a model loops is likely a function of cyclic actions like restatement or backtracking in the training data" (§2). They cite Li et al. (2023) as support. Section 3.3 states the reason in terms of the mechanism of page 08, which needs both a hard action and an easy cyclic action. If cyclic actions are rare in the training traces, "extensive looping is less likely" (§3.3). This is a hypothesis of the authors, not a measurement.

## 9. Result 6: light RL changes little

Phi-4-reasoning is distilled. Phi-4-reasoning-plus is "a version that has been lightly tuned with RL" (§2). Their greedy looping fractions are 0.43 and 0.45. "The looping counts remain roughly the same across the two models" (§2).

The Appendix A curves (Figure 8, approximate) add detail. At temperatures from 0.2 to 1.0, the plus model loops a little less and is more accurate. For example, its accuracy is about 0.70 against about 0.57 at $T = 0.8$. It also writes longer responses at every temperature.

Section 3.3 gives the authors' view. RL is like "training the model on best-of-k version of itself" (§3.3). So RL also has a gap between the data generator and the learner, and the same mechanism can act. Interpretation of these notes: this is one family only, so the evidence is limited.

## 10. Robustness checks

### 10.1 Other looping rules (Table 1)

Appendix A.1 changes $n$ or $k$ and recomputes the greedy looping fraction. Table 1 is exact.

| Model | (20,20) | (30,20) | (30,30) | (30,60) | (40,20) |
|---|---|---|---|---|---|
| R1-Distill-Qwen-1.5B | 0.76 | 0.76 | 0.75 | 0.72 | 0.75 |
| R1-Distill-Qwen-7B | 0.51 | 0.49 | 0.48 | 0.41 | 0.49 |
| R1-Distill-Qwen-32B | 0.40 | 0.37 | 0.33 | 0.22 | 0.36 |
| OpenThinker3-1.5B | 0.33 | 0.30 | 0.28 | 0.27 | 0.29 |
| OpenThinker3-7B | 0.12 | 0.10 | 0.09 | 0.09 | 0.09 |
| QwQ-32B | 0.04 | 0.04 | 0.03 | 0.03 | 0.03 |
| R1-Distill-Llama-8B | 0.56 | 0.54 | 0.51 | 0.41 | 0.53 |
| Phi-4-reasoning | 0.46 | 0.43 | 0.42 | 0.41 | 0.42 |
| Phi-4-reasoning-plus | 0.49 | 0.45 | 0.44 | 0.42 | 0.44 |

The (30,20) column is the main rule. It equals Figure 2. The paper states: "the relative ordering of all models remains the same in all cases" (Appendix A.1).

> [!note] A closer reading of the ordering claim
> Interpretation of these notes: the claim holds inside each family in every column. Across families, some pairs swap at (30,60). For example, R1-Distill-Qwen-32B is above OpenThinker3-1.5B at (30,20) (0.37 against 0.30), but below it at (30,60) (0.22 against 0.27). The conclusions of §2 compare models inside a family, so they still hold.

> [!example] Worked example: loops of moderate length
> A response that loops by (30,60) also loops by (30,20), because 60 repeats include 20 repeats. So the difference of the two columns is the share of responses with a 30-gram that repeats from 20 to 59 times.
>
> 1. R1-Distill-Qwen-32B: $0.37 - 0.22 = 0.15$.
> 2. R1-Distill-Llama-8B: $0.54 - 0.41 = 0.13$.
> 3. QwQ-32B: $0.04 - 0.03 = 0.01$.
>
> Interpretation of these notes: some models often loop for a shorter time, or start to loop late in the budget.

### 10.2 A second benchmark: GPQA Diamond (Figure 11)

Appendix A.2 repeats the greedy measurement on GPQA Diamond for two families. The bar labels are exact. The AIME column repeats Figure 2 for comparison.

| Model | GPQA greedy looping | AIME greedy looping |
|---|---|---|
| Distill Qwen 1.5B | 0.78 | 0.76 |
| Distill Qwen 7B | 0.42 | 0.49 |
| Distill Qwen 32B | 0.27 | 0.37 |
| OpenThinker3-1.5B | 0.75 | 0.30 |
| OpenThinker3-7B | 0.27 | 0.10 |
| QwQ-32B | 0.07 | 0.04 |

"Lower-capacity models loop more and student models loop significantly more than teacher" (Appendix A.2). The order inside each family is the same as on AIME. OpenThinker3-1.5B loops much more on GPQA (0.75) than on AIME (0.30). The paper does not discuss this difference. Each GPQA bar rests on only 4 responses per question.

## 11. Inside one loop: Example 1

### 11.1 The trace

Section 2.1 gives a greedy trace of OpenThinker3-1.5B on Problem I-7 of AIME 2025. Twelve letters, A to L, are grouped at random into six pairs. Each pair forms a two-letter word in alphabetical order, and the six words are listed alphabetically. The problem asks for the probability that the last word contains G.

The trace has four stages:

1. **A good start.** The model restates the problem and derives the number of ways to pair the letters correctly.
2. **A semantic loop.** It explains, again and again, how a two-letter word is arranged in alphabetical order.
3. **A second loop.** It leaves briefly, then restates the goal of the problem "without adding new structure" (§2.1). The paper marks it "[repeated 2 more times]".
4. **The final loop.** It starts to reason about pairs that include G. Then it repeats that a word is the sorted pair, "and never gets out of it" (§2.1).

> [!example] Worked example: the number of pairings in stage 1
> The model writes the count as $12!$ divided by $2^6 \times 6!$. Here is why.
>
> 1. Put the 12 letters in a row: $12! = 479{,}001{,}600$ orders. Read pairs from positions 1-2, 3-4, and so on.
> 2. The order inside each pair does not matter: divide by 2 for each of 6 pairs, $2^6 = 64$.
> 3. The order of the 6 pairs does not matter: divide by $6! = 720$.
> 4. Result: $479{,}001{,}600 / (64 \times 720) = 479{,}001{,}600 / 46{,}080 = 10{,}395$.
>
> So the model was correct before it looped. Interpretation of these notes: the loop is not a lack of basic counting skill.

The paper reads the trace as risk aversion: "the model repeatedly takes easy cyclic actions ... instead of progress-making actions" (§2.1). One missing insight is "that for the last word to contain G, no pair should be formed with both letters coming from H-L" (§2.1).

### 11.2 The probe: would the teacher make progress?

The authors truncate the trace where the final loop begins. That is right after "Wait, so actually, the word is always the two letters in alphabetical order, so the word is the pair sorted." Then they let each model continue (§2.1).

| Test from the same prefix | Student OpenThinker3-1.5B | Teacher QwQ-32B |
|---|---|---|
| 5 greedy continuations | All 5 loop. | 2 distinct traces. Both avoid looping and make significant progress. One is correct, one misses a case. |
| 50 samples of 2,000 tokens at $T = 0.7$, marked by GPT-5 | 1/50 (2%) | 34/50 (68%) |
| 50 samples of 2,000 tokens at $T = 1$, marked by GPT-5 | 8/50 (16%) | 32/50 (64%) |

GPT-5 marks a continuation if it contains at least one key structural insight. The paper concludes: "the student puts much less mass on progress-making actions than the teacher" (§2.1).

> [!example] Worked example: is the gap more than sampling noise?
> The paper gives only the counts. These notes add 95% Wilson intervals, computed with statsmodels.
>
> | Count | Wilson 95% interval |
> |---|---|
> | Student 1/50 at $T = 0.7$ | 0.4% to 10.5% |
> | Teacher 34/50 at $T = 0.7$ | 54.2% to 79.2% |
> | Student 8/50 at $T = 1$ | 8.3% to 28.5% |
> | Teacher 32/50 at $T = 1$ | 50.1% to 75.9% |
>
> At each temperature, the student and teacher intervals do not overlap. So sampling noise alone cannot explain the gap. The intervals cover only sampling noise, not errors of the GPT-5 judge.

> [!key] What the probe shows
> From the same prefix, the teacher makes progress and the student loops. When sampled, the teacher produces a key insight in 64% to 68% of continuations, and the student in 2% to 16%. This is the student-teacher gap of page 05, measured at one decision point inside one real trace.

Appendix B gives a second trace with a different pattern: the student repeats the same mistake after each restart. Page 09 covers it.

## 12. What the authors conclude from these results

| Observation | What it suggests, according to the paper |
|---|---|
| Students loop far more than their teacher. | "If a student perfectly learned its teacher distribution, we would not expect it to loop substantially more than the teacher" (§2). So errors in learning exist. |
| Larger models loop less. | Limited capacity is "a plausible explanation for why smaller models loop more" (§3.3). |
| Harder problems cause more looping. | This "also aligns with this view" (§2). |
| Reasoning models loop more than instruct models. | Cyclic actions in the training data give material for loops (§2, §3.3). |

The authors write that "the gap thus points to imperfect learning ... as a key cause" (§2). This is an inference from correlations. The mechanisms are shown in the synthetic task on pages 08 and 09.

## 13. Common mistakes

1. **"Only small models loop."** QwQ-32B loops in 0.04 of greedy responses and in 0.07 on hard problems.
2. **"At T = 1 the problem is solved."** Looping is near 0 for most models, but the students still write longer chains than their teachers.
3. **"Hard problems loop more for every model."** The two Phi-4 reasoning models loop more on easy problems, mainly through a loop after they find the answer.
4. **"Light RL removes looping."** Phi-4-reasoning-plus (0.45) loops about as much as Phi-4-reasoning (0.43) under greedy decoding.
5. **"Table 1 keeps the order of all models in every column."** The order holds inside each family. Some pairs from different families swap at (30,60).
6. **"Instruct models never loop."** Llama-3.1-8B-Instruct loops in 0.47 of greedy responses.

## 14. One-minute explanation

The authors measured 9 open reasoning models and 4 instruct models on AIME at six temperatures. Under greedy decoding, every reasoning model loops: from 0.04 for QwQ-32B to 0.76 for DeepSeek-R1 Distilled Qwen 1.5B. Inside each family, larger models loop less, and the student OpenThinker3-1.5B loops 7.5 times as often as its teacher QwQ-32B. Looping falls close to 0 at temperature 1, but the students still write longer chains than the teacher. Harder problems cause much more looping for seven of nine models, and the Phi-4 exception is caused by a loop after the answer. Reasoning models loop more than their instruct counterparts, and light RL changes little. The results hold with other looping rules and on GPQA. A probe of one trace starts both models from the same prefix. The teacher makes progress in about two thirds of samples, and the student rarely does. The authors conclude that errors in learning are a key cause of looping.

## 15. Check questions

```check
{
  "question": "Using the exact greedy looping fractions of Figure 2, show two separate signs that capacity matters inside a family.",
  "answer": "DeepSeek-R1 Distilled Qwen: 1.5B 0.76 > 7B 0.49 > 32B 0.37. OpenThinker 3: 1.5B 0.30 > 7B 0.10 > QwQ-32B 0.04. In both families, looping falls as the model grows."
}
```

```check
{
  "question": "At temperature 1, OpenThinker3-1.5B almost never loops. Why do the authors still say that its errors in learning remain?",
  "hint": "Read Figure 1b, not Figure 1a.",
  "answer": "Its chains are still much longer than the teacher's: about 19,000 tokens against about 14,850 for QwQ-32B (approximate values from Figure 1b), about 28% more. Temperature removed the loops, but the student still makes more unproductive steps than the teacher."
}
```

```check
{
  "question": "Phi-4-reasoning loops in 0.29 of responses on hard problems and 0.62 on easy problems. What explanation do the authors give?",
  "answer": "By manual inspection, the model often finds the answer, starts to present it, and then repeats lines like 'We'll produce answer in plain text.' forever. It reaches the answer more often on easy problems, so it enters this loop more often there. The authors also note that Phi-4-reasoning was fine-tuned on OpenAI o4-mini data, and call their explanation preliminary."
}
```

```check
{
  "question": "In the probe of Example 1 at temperature 0.7, the student succeeds in 1/50 samples and the teacher in 34/50. Their 95% Wilson intervals are 0.4% to 10.5% and 54.2% to 79.2%. What can you conclude, and what can you not conclude?",
  "answer": "The intervals do not overlap, so the gap is not sampling noise: the teacher puts much more probability on progress-making continuations from this prefix. You cannot conclude the exact probabilities, because the intervals ignore errors of the GPT-5 judge, and the result is for one prefix of one problem."
}
```

## 16. Links

- Previous: [06 Experiment design](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/06-experiment-design)
- Next: [08 Why 1: risk aversion from hardness of learning](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/08-why-1-risk-aversion)
- The paper card: [Why do reasoning models loop? (2025)](/notes/papers/reasoning-models/2025-why-reasoning-models-loop)
- The models and benchmarks: [04 Background: reasoning models](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/04-background-reasoning-models)
- The second trace: [09 Why 2: temporally correlated errors](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/09-why-2-temporally-correlated-errors)
- Temperature and length: [11 Temperature: a stopgap, not a cure](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/11-temperature-stopgap-or-cure)
- Statistics for repeated runs: [Pass rates and confidence intervals](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals)
- What to do in a service: [12 Engineering takeaways](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/12-engineering-takeaways)
