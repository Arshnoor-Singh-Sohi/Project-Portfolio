---
title: "09 Why 2: temporally correlated errors"
order: 9
summary: "Loops without any hard action: a Transformer's small errors at a decision point stay the same from visit to visit, so greedy decoding takes the same path again and again. Also covers the margin variant, the 1.5x length diagnostic, the combined variant of Appendix D and a real trace."
status: not-started
tags: [temporally-correlated-errors, inductive-bias, margin-variant, star-graph, looping]
---

## 1. The question this page answers

Page 08 needed a hard action: a progress-making action that the learner cannot tell apart from others. Can a model loop when no action is hard? Section 4 of the paper says yes: "Transformers can have an inductive bias for looping even in the absence of any hardness in learning." This page shows the mechanism, how the paper measured it, and how it combines with hardness.

## 2. Mental model

> [!analogy] The same slightly loaded die at every junction
> A hiker returns again and again to one junction with five equal trails. The hiker should choose a trail with a fair die. Instead, the hiker carries a five-sided die that is slightly loaded, with each face between 0.15 and 0.25. The hiker keeps the same die for the whole trip. If the hiker always takes the most likely face, the hiker takes the same trail at every visit.
>
> **Where it stops working:** a Transformer has no fixed die. It computes new probabilities at every visit, from the whole text so far, and it can see that it took a trail before. The paper measured that its top-1 child still stays the same in 96.7% of consecutive visits.

## 3. Terms

| Term | Plain meaning |
|---|---|
| inductive bias | A built-in tendency of a model type to prefer some solutions, beyond what the training data asks for. |
| temporally correlated errors | Errors that repeat over time: a child that the model slightly prefers on one visit stays preferred on later visits. |
| estimation error | The small gap between a learned probability and the training probability, for example 0.23 instead of 0.2. |
| uniform walk | The training walk of §4: at the root it picks each of the $n$ children with probability $1/n$. |
| root child | One of the $n$ nodes directly after the root. Each root child starts one spoke. |
| perfect learner | A learner that matches the training distribution exactly. |
| looping count (§4) | For one trace, the visit count of the most visited root child. The paper averages it over 500 test traces. |
| consecutive-visit pair | Two visits to the root, one directly after the other, in the same trace. |
| top-1 child | At one visit, the root child with the highest learned probability. The second child has the second-highest. |
| margin variant | A training walk that lowers the probability of an already visited root child by a fixed margin $m$. |
| Markovian process | A process whose next step depends only on the current state. The margin walk is not Markovian. |
| semantic loop | A loop that repeats the same reasoning, possibly in different words. |
| error accumulation | Errors made during generation that compound over time. |
| combined variant | The walk of Appendix D, where hardness and correlated errors act together. |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. The setup: a walk with no hard action

The paper uses the same star graph as in §3, with the start node. Only the training walk changes:

| Node | What the training walk does |
|---|---|
| start $s$ | Moves to the root (its only outgoing edge). |
| root $r$ | Picks one of its $n$ children, each with probability $1/n$. |
| other internal nodes | Take their unique outgoing edge, with probability 1. |
| goal leaf | The walk stops. |
| non-goal leaf | The walk returns to the start $s$. |

There are no resets from internal nodes in this walk. The paper says that "there is no hardness at the root node here, as the walk simply chooses a child uniformly at random."

Interpretation of these notes, with the rule of page 08: a learner blind to the goal gives each child its average training probability. Every training row at the root is already uniform, so the average is $1/5 = 0.2$ for each child of G(5,5). Blindness costs nothing here. The blind learner and the perfect learner agree.

A perfect learner (§4.1) gives probability 1 to the unique edge at each non-root internal node. It gives probability 1 to the reset at each non-goal leaf, and $1/n$ to each child at the root.

> [!trap] Greedy decoding of the perfect learner has a tie here
> With $1/n$ on every child, greedy decoding has a five-way tie at the root. The result then depends on the tie-break rule. This is an observation of these notes. The paper compares the trained model with the perfect learner at temperature 1, where no tie-break is needed.

## 5. What the trained Transformer does

### 5.1 Small errors that stay in place

The paper trains the same Transformer as in §3 on this walk, on G(5,5). The model deviates slightly at the root: "Instead of learning an exact 1/n split, it makes small errors (e.g., 0.2 ± 0.05 for n=5)." More important, "these errors are correlated across time". In the paper's words: "the root children that are slightly preferred early in the trace tend to remain preferred on later visits to the root."

> [!example] Worked example: small, stable errors under greedy decoding (illustrative numbers)
> The paper gives only "0.2 ± 0.05". The numbers below are invented to show the mechanism, inside that range.
> 1. Visit 1 at the root: children A to E get 0.24, 0.21, 0.19, 0.18, 0.18. The sum is 1.00. Greedy takes A.
> 2. A is not the goal. The walk follows A's spoke to its leaf and returns to the start, then to the root.
> 3. Visit 2: 0.23, 0.21, 0.20, 0.18, 0.18. The order did not change. Greedy takes A again.
> 4. The walk repeats A's spoke at every visit. It reaches the goal only if A is the goal, a chance of $1/5 = 0.2$.

Each error is small, about 0.05 or less. But greedy decoding uses only the order of the probabilities. A stable order gives the same choice every time.

### 5.2 The looping count of §4

> [!trap] This is not the looping count of page 08
> In §4, the looping count of one trace is the visit count of the most visited root child. The paper averages it over 500 test instances. In §3 it was the number of root → start transitions.

Example: a trace visits the root children A, A, B, A, then C, which is the goal. The counts are A = 3, B = 1, C = 1. The looping count of this trace is 3.

### 5.3 Results on G(5,5) (Figure 5, margin 0)

The paper observed:

1. The looping count is high at low temperature and falls as temperature rises.
2. The average response length follows the same trend.
3. Accuracy is near chance at temperature 0 and improves with temperature.

The values below are read from the line plots of Figure 5, so they are approximate. The value 44.7 is exact, from the text. The rows for $m = 0.05$ and $m = 0.1$ belong to the margin variant of section 7.

| Training walk and measure | T = 0 | 0.2 | 0.4 | 0.6 | 0.8 | 1.0 |
|---|---|---|---|---|---|---|
| $m = 0$, accuracy | 0.21 | 0.71 | 0.85 | 0.87 | 0.89 | 0.89 |
| $m = 0$, looping count | 17.1 | 5.5 | 3.7 | 3.3 | 3.3 | 3.1 |
| $m = 0$, response length | 106.9 | 65.2 | 49.2 | 46.3 | 46.4 | 44.7 |
| $m = 0.05$, looping count | 7.7 | 4.1 | 2.9 | 2.5 | 2.4 | 2.3 |
| $m = 0.05$, response length | 58.0 | 43.2 | 36.0 | 32.2 | 32.7 | 30.6 |
| $m = 0.1$, looping count | 4.1 | 2.0 | 1.9 | 1.9 | 2.0 | 2.0 |
| $m = 0.1$, response length | 37.1 | 26.4 | 25.9 | 26.4 | 27.9 | 27.5 |

Accuracy with $m = 0.05$ and $m = 0.1$ is 0.99 to 1.00 at every temperature (approximate).

```plot
{
  "title": "Figure 5b, approximate: looping count against temperature for margin 0 (red), margin 0.05 (gold) and margin 0.1 (ink)",
  "xAxis": { "label": "temperature", "domain": [-0.05, 1.05] },
  "yAxis": { "label": "visits of the most visited root child", "domain": [0, 19] },
  "disableZoom": true,
  "data": [
    { "points": [[0,17.1],[0.2,5.5],[0.4,3.7],[0.6,3.3],[0.8,3.3],[1,3.1]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[0,17.1],[0.2,5.5],[0.4,3.7],[0.6,3.3],[0.8,3.3],[1,3.1]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "points": [[0,7.7],[0.2,4.1],[0.4,2.9],[0.6,2.5],[0.8,2.4],[1,2.3]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0,7.7],[0.2,4.1],[0.4,2.9],[0.6,2.5],[0.8,2.4],[1,2.3]], "fnType": "points", "graphType": "scatter", "color": "#B8860B", "skipTip": true },
    { "points": [[0,4.1],[0.2,2.0],[0.4,1.9],[0.6,1.9],[0.8,2.0],[1,2.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[0,4.1],[0.2,2.0],[0.4,1.9],[0.6,1.9],[0.8,2.0],[1,2.0]], "fnType": "points", "graphType": "scatter", "color": "#100D12", "skipTip": true }
  ]
}
```

## 6. Measuring the temporal correlation directly

The paper probes the root predictions with this procedure (§4.1):

1. Take every generated trace and every pair of consecutive visits to the root.
2. At each visit, find the two children with the highest probabilities.
3. Count the pairs where the top-1 child is the same at both visits.
4. Count the pairs where the second child is the same at both visits.

| Training walk | Top-1 child the same | Second child the same |
|---|---|---|
| $m = 0$ | 96.7% | 76.7% |
| $m = 0.05$ | 77.1% | 53.7% |
| $m = 0.1$ | 61.6% | 48.0% |
| Perfect learner of the margin walk, greedy | 0% | not given |

The paper calls 96.7% and 76.7% "far higher than one would expect if predictions on consecutive visits were uncorrelated." It does not give a number for that case. Interpretation of these notes: suppose that each visit ranked the 5 children in a fresh random order. Then the top-1 child would match with probability $1/5 = 20\%$, and so would the second child.

```video
{
  "src": "/notes/media/papers/2025-why-reasoning-models-loop/manim/m04-correlated-errors-loop.mp4",
  "caption": "Why small errors of about 0.05 at the root still produce loops: the model keeps the same preferred child at every visit, so greedy decoding repeats the same spoke."
}
```

> [!key] The second mechanism in one line
> No action is hard, and every error is small. But the errors keep the same direction from visit to visit, and greedy decoding uses only the order of the probabilities. So the same child wins at every visit, and the walk loops.

## 7. The margin variant

### 7.1 The rule

What if the training data itself discourages revisits? The margin walk works like this (§4.1):

1. At the first visit to the root, the walk picks a child uniformly.
2. At later visits, each child that was already visited loses a fixed margin $m$ of probability.
3. The removed mass goes, in equal shares, to the children not yet visited.
4. "This reduction is applied once per child (its probability does not decrease further with repeated visits)."

With $m = 0$ this is the uniform walk. With $m > 0$ the walk is no longer Markovian, because the next step depends on which children the walk visited before.

> [!example] Worked example: the margin walk on G(5,5) with m = 0.1
> These notes read the rule as: a visited child gets $1/5 - m$, and the unvisited children share the rest.
> 1. Visit 1: each child 0.2.
> 2. After a visit to wrong child A: A gets $0.2 - 0.1 = 0.1$. Each of the 4 others gets $0.2 + 0.1/4 = 0.225$. Check: $0.1 + 4 \times 0.225 = 1.0$.
> 3. After wrong child B too: A and B get 0.1 each. The 3 others share $1 - 0.2 = 0.8$, so $0.8/3 = 0.267$ each.
> 4. After a third wrong child: the 2 others get $(1 - 0.3)/2 = 0.35$ each.

### 7.2 Results and two readings

With $m = 0.05$ and $m = 0.1$, the low-temperature looping count and response length fall. Accuracy is near perfect at all temperatures (Figure 5, table in section 5.3). The correlation also weakens (table in section 6). But it stays substantial. A perfect learner of the margin walk, decoded greedily, never revisits a child, so its top-1 fraction would be 0%. The trained model still shows 61.6% at $m = 0.1$.

The paper gives two readings:

1. **Robustness of the mechanism.** "the student still over-prefers already-visited children even when the training distribution nudges it away."
2. **A possible mitigation.** "biasing traces toward new actions reduces looping." This is a training-time change. The paper notes that existing inference-time methods that discourage repetition are "in a similar vein" (Keskar et al., 2019).

## 8. A real trace with the same pattern (Appendix B)

### 8.1 The trace

Example 2: OpenThinker3-1.5B attempts Problem I-5 of AIME 2025 with greedy decoding. The problem asks for $N$, the number of eight-digit integers that use each digit 1 to 8 once and are divisible by 22, minus 2025. The paper describes these phases:

1. **A good start.** Divisible by 22 means divisible by 2 and by 11. The last digit must be even. The model correctly derives $S_{\text{odd}} \equiv 7 \pmod{11}$ and then $S_{\text{odd}} = 18$.
2. **The first mistake.** It fixes the last digit $E$ and splits the remaining 7 digits. It still requires the three other even positions to sum to 18, "as if the last digit had disappeared". This forces $E = 0$, a contradiction.
3. **The first loop.** It restates the 11-rule, derives $S_{\text{odd}} = 18$ again, and hits the same contradiction. The paper's note: "Semantically loops essentially repeating the same mistake 5 more times".
4. **A new mistake, then a second loop.** It now uses $S_{\text{odd}} + S_{\text{even}} = 36 - E$ and starts a case analysis. For $E = 2$ it must count triples from $\{1, 3, 4, 5, 6, 7, 8\}$ that sum to 17. It writes "7 + 6 + 4 = 17, 7 + 5 + 5 = no" again and again and never leaves this line.

A brute-force count by these notes gives $N = 2304$, so the answer is $2304 - 2025 = 279$. It also confirms the three triples that the model had already found: $3 + 6 + 8$, $4 + 5 + 8$ and $4 + 6 + 7$.

### 8.2 How the trace maps to the two mechanisms

The paper links the first loop to correlated errors: "once the model makes a high-level mistake, it keeps returning to the same wrong reasoning whenever it tries to restart." In the graph, this is the same wrong root child, the same leaf, and a restart. The second loop is a risk-aversion pattern (page 08). The natural progress step was to count the three triples and move to the next $E$. The model rechecks the same triples instead.

### 8.3 The probes

The authors cut the trace at each loop and let the student (OpenThinker3-1.5B) and the teacher (QwQ-32B) continue.

1. **First loop, greedy.** All 5 teacher continuations find the mistake and reach the correct answer. The student gives 2 distinct traces. Both loop 2 to 3 more times, then notice the mistake, then loop again in the case analysis.
2. **Second loop, greedy.** All teacher continuations also become trapped in the same loop.
3. **Sampled continuations.** 50 per model and temperature, judged by GPT-5. For the first loop, 1,000 tokens each, and "success" means the continuation fixes the wrong equation and continues with valid reasoning. For the second loop, 2,000 tokens each, and "progress" means it finishes the count for $E = 2$ correctly.

| Probe | T | Student | Teacher |
|---|---|---|---|
| First loop | 0.7 | 19/50 | 50/50 |
| First loop | 1.0 | 21/50 | 48/50 |
| Second loop | 0.7 | 10/50 | 34/50 |
| Second loop | 1.0 | 27/50 | 42/50 |

Interpretation of these notes: 50 samples give wide intervals. For example, 19/50 has a 95% Wilson interval of 0.26 to 0.52, and 10/50 has 0.11 to 0.33. For the first loop, the intervals of the student and the teacher are still far apart.

The authors give two possible reasons why the teacher also loops at the second point. First, the teacher may carry its own errors in learning. Second, the prefix already contains several semantic loops, so error accumulation may play a role, for example "in-context learning from a 'confused' history". Both are hypotheses. Page 10 discusses error accumulation as a catalyst.

## 9. Comparing the two mechanisms

| Question | Risk aversion (§3, page 08) | Temporally correlated errors (§4) |
|---|---|---|
| Source of the error | Hardness of learning: the progress-making action's mass is divided among look-alikes. | An inductive bias: small errors at a repeated decision point keep the same direction. |
| Size of the error | Large: 0.14 instead of 0.7 for the correct child in the ideal case. | Small: about $0.2 \pm 0.05$ instead of 0.2. |
| Transformer-specific? | No. It "appears for any maximum-likelihood learner" with indistinguishable actions. | It relies on an inductive bias, which the paper shows for Transformers. |
| Response length at $T = 1$ | G(5,5) with exploration: 105.5 against 24.8 for a perfect learner | G(5,5) with $m = 0$: 44.7 against 27.7 for a perfect learner |
| Ratio | $105.5 / 24.8 = 4.25$ (paper: "≈ 4×") | $44.7 / 27.7 = 1.61$ (paper: "≈ 1.5×") |

For the second mechanism, the paper says: "Here the deviations are small, yet sufficient for greedy/low-temperature decoding to loop." Its conclusion on temperature: "temperature is a reasonably effective fix when the learning errors are small". When the errors are large, "more holistic training-time interventions might be better" (§4.1). Page 11 develops this.

> [!note] A check of the perfect-learner value 27.7 (computation of these notes)
> Assumptions: G(5,5) with 4 nodes on each spoke after the root, and the uniform walk at temperature 1. One unit of length is one node token, from the first start token to the goal token.
> 1. One attempt writes $s$, $r$ and the 4 spoke nodes: 6 tokens.
> 2. An attempt succeeds with probability $1/5$, so the expected number of attempts is 5.
> 3. Expected length: $6 \times 5 = 30.0$. A simulation of 200,000 walks gives 29.96.
>
> This does not match 27.7. For a mean of 500 walks the standard error is about 1.2 tokens, so 27.7 lies about 1.9 standard errors below 30.0. A count of transitions instead of nodes gives 29.0, and the paper does not say how it computed 27.7. With 30.0, the ratio is $44.7/30.0 = 1.49$. The same simulation gives an average looping count of about 2.1 for a perfect learner at $T = 1$.

The paper also calls the two mechanisms "two atomic “forces” driving looping". Appendix D shows them acting together.

## 10. Both forces together (Appendix D)

### 10.1 The setup

The walk is the uniform walk of §4 with one change at the root. The walk takes the correct child (on the path to the goal) with probability 0.5. With the other 0.5 it picks one of the 4 wrong children uniformly: $0.5/4 = 0.125$ each. A perfect learner would take the correct child at once under greedy decoding, so its looping count would be 1.

A second version uses G(10,5). The correct child gets 0.5. The other 0.5 goes to only four of the nine wrong children, 0.125 each. The remaining 5 children are never visited.

### 10.2 What the learner can do, step by step

The paper's interpretation: at first, hardness of learning pushes the learner toward roughly equal mass on all root children.

> [!example] Worked example: the first visit (computation of these notes)
> A learner that cannot tell which child is correct gives each child its average training probability.
> 1. G(5,5): each child is correct with probability $1/5$ and wrong with probability $4/5$. Average: $0.5 \times 0.2 + 0.125 \times 0.8 = 0.1 + 0.1 = 0.2$.
> 2. G(10,5): each child is correct with probability $1/10$. If the four explored wrong children are random, each child is one of them with probability $4/10$. Average: $0.5 \times 0.1 + 0.125 \times 0.4 = 0.05 + 0.05 = 0.1$.
>
> So the learner behaves almost like the uniform walk, although the data gives 0.5 to the correct child.

Next, the walk visits one wrong child, reaches its leaf and returns to the root. The paper's simple model assumes that the learner can now tell that the visited child is bad. It still cannot tell the other children apart.

> [!example] Worked example: after one wrong visit (Appendix D)
> **G(5,5).**
> 1. The visited child keeps its training probability: $0.5/4 = 0.125$.
> 2. The other 4 children (the correct one and 3 unseen wrong ones) share the rest: $1 - 0.125 = 0.875$.
> 3. Each gets $0.875/4 = 0.21875 \approx 0.219$. Check: $0.5 + 3 \times 0.125 = 0.875$.
> 4. The visited child drops from 0.2 to 0.125, a margin of $0.2 - 0.125 = 0.075$. The paper calls this very similar to the margin walk with a margin of about 0.075. After one visit the numbers even match: $0.2 + 0.075/4 = 0.21875$.
>
> **G(10,5).**
> 1. The visited child again gets 0.125.
> 2. The other 9 children share 0.875: $0.875/9 = 0.0972 \approx 0.097$ each.
> 3. Now $0.125 > 0.097$, so greedy decoding returns to the visited wrong child.
> 4. The correct child gets about 0.097 instead of 0.5. That is about 5 times too little (a computation of these notes).

On G(5,5), the visited child is only slightly down-weighted. On top of this, the Transformer's correlated errors bias it toward a few children again. The paper reports that the curves of Figure 14 for G(5,5) "look very similar to those for margin m = 0.1". On G(10,5), the visited child is preferred, so the paper expected stronger loops, and Figure 14 confirms them.

### 10.3 Results (Figure 14)

The values below are read from the line plots of Figure 14, so they are approximate.

| Graph and measure | T = 0 | 0.2 | 0.4 | 0.6 | 0.8 | 1.0 |
|---|---|---|---|---|---|---|
| G(5,5), accuracy | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0.99 |
| G(5,5), looping count | 3.5 | 2.3 | 2.0 | 1.9 | 1.8 | 1.9 |
| G(5,5), response length | 32.5 | 26.0 | 25.4 | 25.2 | 24.4 | 26.1 |
| G(10,5), accuracy | 0.24 | 0.55 | 0.68 | 0.72 | 0.73 | 0.69 |
| G(10,5), looping count | 11.5 | 6.4 | 4.6 | 3.8 | 3.3 | 3.1 |
| G(10,5), response length | 94.6 | 79.8 | 69.5 | 65.0 | 61.3 | 60.4 |

The paper's conclusion: looping similar to §4 "can occur even when the teacher distribution places significant mass on the correct progress-making action." A problem need not match the exact setups of §3 or §4 for these mechanisms to appear.

## 11. Common mistakes

1. **"Small errors cancel over many visits, so they cannot cause loops."** They do not cancel if they keep the same direction at every visit. Greedy decoding uses only the order, and the top-1 child stays the same in 96.7% of consecutive visits.
2. **"A loop needs a hard action."** The uniform walk has no hard action. The loops come from temporally correlated errors.
3. **"Both sections use the same looping count."** §3 counts root → start transitions. §4 takes the visit count of the most visited root child.
4. **"The margin variant removes the bias."** It weakens it. At $m = 0.1$ the top-1 child is still the same in 61.6% of consecutive visits, against 0% for a perfect learner.
5. **"If the data gives the correct action 0.5, the model will not loop."** On G(10,5) the learner can give the correct child about 0.097 and the visited wrong child 0.125.

## 12. One-minute explanation

Section 4 trains on a star-graph walk with no hard action: at the root, each of 5 children has probability 0.2. The trained Transformer learns about $0.2 \pm 0.05$ for each child. These small errors are temporally correlated: the child that the model prefers at one visit stays preferred at the next visit in 96.7% of cases. Greedy decoding uses only the order of the probabilities, so the walk takes the same spoke again and again. The looping count of §4, the visit count of the most visited child, is about 17 at temperature 0. A margin variant that discourages revisits in the training data weakens the correlation but does not remove it. Temperature works fairly well here, because the errors are small: the response length at $T = 1$ is 44.7 against 27.7 for a perfect learner. Appendix D combines both mechanisms: on G(10,5), a learner can prefer a visited wrong child, although the data gives 0.5 to the correct child. A real OpenThinker3-1.5B trace shows a similar pattern: it repeats the same mistaken step and the same contradiction several times.

## 13. Check questions

```check
{
  "question": "In the G(10,5) variant, the learner has visited one wrong child. Using the paper's simple model, what probabilities does it give, and what does greedy decoding do?",
  "hint": "The visited child keeps its training probability. The other nine share the rest equally.",
  "answer": "The visited child gets $0.5/4 = 0.125$. The other 9 children share $1 - 0.125 = 0.875$, so each gets $0.875/9 \\approx 0.097$. Since $0.125 > 0.097$, greedy decoding returns to the visited wrong child, and the walk loops."
}
```

```check
{
  "question": "Why is the result 96.7% evidence of temporally correlated errors?",
  "answer": "If the ranking of the 5 children were fresh and random at each visit, the top-1 child would match at consecutive visits only about 20% of the time. The model keeps the same top-1 child in 96.7% of consecutive visits, so its small errors keep the same direction over time."
}
```

```check
{
  "question": "A trace visits the root children B, A, B, B, D, and D is the goal. What is the looping count of §4 for this trace?",
  "answer": "Count the visits: B = 3, A = 1, D = 1. The looping count is the maximum, 3."
}
```

```check
{
  "question": "The response length at T = 1 is 105.5 against 24.8 in §3, and 44.7 against 27.7 in §4. What does the difference tell you about temperature?",
  "answer": "The ratios are about 4.25 and 1.61. Temperature breaks loops in both cases, but it does not fix the learned probabilities. When the errors are small (§4), the cost is modest. When the errors are large (§3), sampled walks stay about four times longer than necessary, so temperature is only a stopgap there."
}
```

## 14. Links

- Previous: [08 Why 1: risk aversion from hardness of learning](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/08-why-1-risk-aversion)
- Next: [10 The catalyst: confidence that grows inside a loop](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/10-the-catalyst-growing-confidence)
- The paper card: [Why do reasoning models loop?](/notes/papers/reasoning-models/2025-why-reasoning-models-loop)
- The star-graph task and both looping counts: [06 Experiment design](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/06-experiment-design)
- The first example trace and the GPT-5 probe of §2.1: [07 Results: looping in open models](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/07-results-looping-in-open-models)
- Temperature as a stopgap: [11 Temperature: a stopgap, not a cure](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/11-temperature-stopgap-or-cure)
- Intervals for small samples such as 19/50: [Pass rates and confidence intervals](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals)
- [Glossary](/notes/papers/glossary)
