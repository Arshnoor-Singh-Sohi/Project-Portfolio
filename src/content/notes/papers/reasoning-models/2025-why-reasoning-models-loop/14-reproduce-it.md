---
title: "14 Reproduce it"
order: 14
summary: "Exercises with specifications and acceptance tests: Proposition 1 by numeric optimization, the Markovian student, a star-graph data generator with all walk variants, a small Transformer that loops at low temperature on a laptop CPU, an n-gram loop detector, and an optional looping measurement on an open reasoning model."
status: not-started
tags: [exercises, reproduction, reasoning-models, looping, pytorch]
---

## 1. The question this page answers

Can you rebuild the core results of the paper yourself, from empty notebooks? Can you show the loop with your own code, measure it, and detect it?

> [!key] The rule for these exercises
> You write the code. This page gives the specification, the acceptance tests and hints in two levels. Ask in chat for the third level (partial code) only after a real attempt. If AI writes any part, you must explain every line, or the exercise is not complete.

## 2. Mental model

> [!analogy] Test each part on the bench before the engine runs
> A mechanic checks the fuel pump, the spark plugs and the gauges on the bench before starting the engine. A fault is easy to find on the bench, and hard to find inside a running engine. E1 and E2 are the bench tests: their answers are exact, so a wrong result means a bug. E3 is the fuel: wrong data makes every later result wrong. E4 is the engine run. E5 is the gauge that tells you when the engine is in trouble.
>
> **Where it stops working:** a bench test has one correct value. E4 has no exact answer: a small Transformer is random, and you check only the qualitative shape of the paper's results.

## 3. Terms

| Term | Plain meaning |
|---|---|
| acceptance test | A test that your code must pass before you call the exercise complete. |
| seed | A number that fixes a random generator, so that a run repeats exactly. |
| logits | The raw scores that the softmax turns into probabilities. |
| gradient descent | A method that changes the parameters a small step against the gradient of the loss, again and again. |
| Markov chain | A random process where the next state depends only on the current state. |
| first-step analysis | A method that computes an expected value of a Markov chain from equations about the first move from each state. |
| Markovian student | A student whose next-action distribution depends only on the current node, not on the history (§3.1). |
| loss mask | A list of 0 and 1 values that selects which positions count in the loss. The paper counts only the walk. |
| looping count | In §3, the number of root-to-start transitions in a trace. In §4, the visits to the most visited root child. |
| response length | The number of generated walk steps (or tokens) in one trace. Define your unit and keep it. |
| cosine decay | A learning-rate schedule that falls from the start value to near zero along a half cosine curve. |
| rolling window | The last $W$ items of a stream. Older items leave the window when new items arrive. |
| hash | A short number computed from a piece of data. Equal data always gives an equal hash, so a hash is a cheap key for counting. |
| Wilson interval | A confidence interval for a rate measured from a small number of trials. |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. The plan

```mermaid
flowchart LR
    E1[E1: Proposition 1 by optimization] --> E2[E2: Markovian student]
    E2 --> E3[E3: data generator]
    E3 --> E4[E4: small Transformer]
    E4 --> E5[E5: loop detector]
    E5 --> E6[E6: open model, optional]
```

Work in the lab folder `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, in the notebook folder `papers/why-reasoning-models-loop/`. Suggested layout:

```text
papers/why-reasoning-models-loop/
├── README.md                    the question, setup, results, limits
├── e1_proposition_1.ipynb
├── e2_markovian_student.ipynb
├── e3_star_graph_data.ipynb
├── e4_small_transformer.ipynb
├── e5_loop_detector.ipynb
├── e6_open_model_looping.ipynb  optional
├── loopstudy/                   shared code: graph.py, walks.py, decode.py, detect.py
├── tests/                       pytest tests for loopstudy
└── results/                     JSON results and plots, one file per run
```

Keep the notebooks for exploration. Put code that two notebooks share into `loopstudy/`, with tests.

## 5. E1: Proposition 1 by numeric optimization

**The claim (page 08).** Take a learner that cannot tell the $n$ contexts apart. Its minimum of the average cross-entropy is $q_0 = p$ for the easy action and $q_i = (1-p)/n$ for each hard action.

**Specification.** Write `fit_shared_distribution(n, p, steps, lr, seed)`.

1. The parameters are $n + 1$ logits $z_0, \dots, z_n$. The probabilities are $q = \mathrm{softmax}(z)$.
2. The loss is the average cross-entropy over the $n$ equally likely contexts:

$$
\ell(z) = -p \log q_0 - (1-p)\,\frac{1}{n} \sum_{i=1}^{n} \log q_i
$$

3. Start from random logits. Run plain gradient descent. Return $q$ and the final loss.
4. Write the gradient by hand first. Then check it against PyTorch autograd.

**Acceptance tests.**

1. For each $(n, p)$ in $(2, 0.3)$, $(5, 0.3)$, $(10, 0.1)$ and $(20, 0.5)$: $\lvert q_0 - p \rvert < 10^{-4}$, and every $\lvert q_i - (1-p)/n \rvert < 10^{-4}$.
2. The probabilities add to 1 within $10^{-9}$.
3. The final loss for $n = 5$, $p = 0.3$ is $-0.3 \ln 0.3 - 0.7 \ln 0.14 = 1.73747$ within $10^{-5}$.
4. A learner that sees the context reaches $-0.3 \ln 0.3 - 0.7 \ln 0.7 = 0.61086$. The gap is $0.7 \ln 5 = 1.12661$. Your code computes both values.
5. Ten different seeds give the same $q$ within $10^{-4}$.
6. Hand gradient and autograd agree within $10^{-6}$ at five random points.
7. A function `greedy_action(n, p)` returns the easy action exactly when $n > (1-p)/p$. For $p = 0.3$: $n = 2$ gives a hard action, $n = 3$ gives the easy action. For $p = 0.1$ and $n = 9$, both values are 0.1: write and test your tie rule.

> [!example] Hint level 1: the idea
> The average over contexts can be written as one cross-entropy against one target distribution $t$. Find $t$. What minimizes a cross-entropy against a fixed target?

> [!example] Hint level 2: pseudocode
> 1. $t_0 = p$ and $t_i = (1-p)/n$ for $i = 1, \dots, n$.
> 2. Loss $= -\sum_j t_j \log q_j$.
> 3. Gradient with respect to $z_j$: $q_j - t_j$.
> 4. Repeat: $z \leftarrow z - \eta\,(q - t)$.

## 6. E2: the Markovian student on $G(n, \ell)$

**Specification.** Simulate the student of §3.1 on $G(n, \ell)$, with $p = 0.3$. No neural network.

| Node | Student distribution |
|---|---|
| start | root 0.7, start 0.3 |
| root | start 0.3, each of the $n$ children $0.7/n$ |
| other non-leaf nodes, on any spoke | next node 0.7, start 0.3 |
| goal leaf | stop |
| other leaves | start 1.0 |

The last row is your assumption. The §3 training walk never visits a wrong leaf, so the paper does not define it. Record the assumption in the README.

1. Decode at temperature $T$: raise each probability to the power $1/T$ and renormalize. This is the same as dividing the logits by $T$. At $T = 0$, take the most probable action, with a fixed tie rule.
2. Stop at the goal or after a cap of $M$ moves.
3. For each $T$ in 0, 0.2, 0.4, 0.6, 0.8 and 1.0, run $N$ traces. Measure the looping count (root-to-start transitions), the response length in moves, and the accuracy (goal reached before the cap).
4. Compute the exact expected number of moves for each $T > 0$ with first-step analysis: one linear equation per node, solved with `numpy.linalg.solve`.

**Acceptance tests.**

1. $T = 0$, $n = 5$, $\ell = 5$, $M = 500$: the trace alternates start and root, the accuracy is 0, and the looping count is exactly 250.
2. $T = 0$, $n = 2$: since $0.7/2 = 0.35 > 0.3$, the trace has zero root-to-start transitions. The two children tie. Describe what your tie rule does when it chooses the wrong child, and compare this with page 09.
3. $T = 1$, $n = 5$, $\ell = 5$: the exact expected number of moves is 86.5 with the leaf assumption above. The mean of 20,000 simulated runs (with a large cap) is within 2% of it.
4. The same method for the teacher walk (0.7 on the correct child) gives 16.5 moves, which equals $(1 - 0.7^5)/(0.3 \times 0.7^5)$.
5. Simulation and exact values agree within 2% for every $T > 0$. Plot both against $T$.

Then answer in the README: is the expected length a monotone function of $T$? Explain the shape from the two forces: the start-root loop, and the wrong spokes.

## 7. E3: the star-graph data generator

**Specification.** Write `make_instance(n, ell, variant, rng)`. It returns the training string, the token list, the loss mask, and the graph (start, root, goal, spokes).

1. The graph: one start node, one root, and $n$ spokes of $\ell - 1$ nodes each. Draw distinct node labels at random for each instance.
2. The string format of §3.1: the edge list in random order, then the start and the goal, then the walk. For example `11,16|5,42|2,29|...|29,22 / 2,42 = 2,29,22,33,5,2,...,5,42`.
3. The paper names `|`, `/` and `=` as separator tokens, and each node is one token. It does not say if the commas are tokens. Decide, and record your choice.
4. Add an end token after the walk, so that a model can learn to stop.
5. The loss mask is 1 on the walk and the end token, and 0 on everything before.
6. Implement these walk variants:

| Variant | Rule | Source |
|---|---|---|
| reset | At every node, forward with $1 - p$, start with $p = 0.3$. Stop at the goal. | §3.1 |
| exploration | Root: start 0.3, correct child 0.5, the other children 0.2 in total. Other non-leaf nodes: 0.7 forward, 0.3 start. Wrong leaf: start. | §3.2 |
| uniform | Root: each child $1/n$. Other non-leaf nodes: forward. Wrong leaf: start. | §4 |
| margin $m$ | Like uniform. On later root visits, each visited child loses $m$ once, and the removed mass goes evenly to the unvisited children. | §4.1 |
| combined (optional) | Root: correct child 0.5, wrong children 0.5 in total. On $G(10, 5)$, only four of the nine wrong children get mass. | Appendix D |

The paper does not say how the four children of the $G(10, 5)$ variant are chosen. Choose them at random per instance, and record it.

**Acceptance tests.**

1. $G(5, 5)$ has $1 + 1 + 5 \times 4 = 22$ distinct nodes and $1 + 5 \times 4 = 21$ edges.
2. Parse the string back: the edge set and the walk equal the originals.
3. Every step of a walk is an edge of the graph or a jump to the start node.
4. The same seed gives the same string. Different seeds give different labels.
5. Means of the number of moves over 20,000 walks on $G(5, 5)$: reset $16.50 \pm 0.30$, exploration $23.50 \pm 0.45$, uniform $29.0 \pm 0.6$. These are exact values from first-step analysis, with a tolerance of about three standard errors.
6. Margin $m = 0.1$, $n = 5$, two wrong children visited: each visited child has 0.1, each of the three unvisited children has $0.2 + 0.2/3 = 0.2667$, and the sum is 1.
7. The loss mask has exactly as many ones as the walk has tokens, plus one for the end token.

> [!example] Hint level 1: the idea
> Separate the graph from the walk. One function builds the graph and the labels. One function per variant gives the next-node distribution from the current node and the history. One shared loop samples from that function until the goal.

## 8. E4: a small Transformer that loops

**Goal.** Reproduce the shape of Figure 4 for $G(5, 5)$ with the reset walk. Expect a high looping count and a long response at low temperature. Both fall as the temperature rises. Accuracy stays near or below chance.

**Suggested size, for a laptop CPU in under an hour.**

| Setting | Paper (§3.2) | Suggested here |
|---|---|---|
| Layers, heads, width | 12, 8, 768 (about 85M parameters) | 3, 4, 64 (about 0.19M parameters) |
| Optimizer, learning rate | Adam, $10^{-4}$, cosine decay | AdamW, $10^{-3}$, 200 warmup steps, cosine decay |
| Batch, steps | 64, 100k | 64, 4,000 to 8,000 |
| Training data | 2M fixed sequences | Fresh random instances at each step |
| Loss | Next-token cross-entropy on the walk only | The same |

Why these sizes: the task needs at least two layers to look up the edge that starts at the current node and copy its end. The width of 64 keeps one training step cheap. A learning rate of $10^{-3}$ is a common choice for a model this small. Measured for these notes on a 2-thread CPU: one step of this size took about 0.25 seconds. So 4,000 steps took about 17 minutes, and 8,000 steps about 33 minutes. A laptop with more cores is usually faster.

**Specification.**

1. A decoder-only Transformer with a causal mask and learned position embeddings. Write the attention block yourself, or use `torch.nn` layers, but explain each part.
2. Train with the loss mask from E3. Log the training loss every 250 steps.
3. Decode 200 new test instances at $T$ = 0, 0.5 and 1.0, with a cap of 100 and of 200 generated tokens.
4. Measure the looping count of §3, the response length and the share of traces with an invalid move. Also measure the accuracy: only valid moves, the goal reached, then the end token.
5. At every visit to the root, record the probability of the reset, of the correct child and of each wrong child.

**Acceptance tests.**

1. Know your target loss. Assume one token per node, the start node as the first walk token, and one end token. Then a model that learns everything except the root choice has an average loss of about 0.80 nats per walk token. A perfect learner has about 0.54. Compute both values for your own token format.
2. The training loss falls below 1.0. If it stays near 2, train longer before you evaluate.
3. The looping count at $T = 0$ is at least twice the count at $T = 1$.
4. The mean response length falls from $T = 0$ to $T = 1$.
5. At $T = 0$, the reset probability is larger than the correct-child probability at more than 80% of root visits.
6. Compare your mean reset probability at the root with the teacher's 0.3. The paper found an overestimate in its exploration variant (94% of root positions above 0.3, average about 0.35).
7. Report every measure twice: on all traces, and on the traces without an invalid move.
8. Write which results match Figure 4 and which do not, and why. Accuracy below chance usually means invalid moves from an under-trained model.

> [!trap] Long loops leave the training range
> With learned position embeddings, the model sees few long sequences in training. A long loop at test time moves it into positions that it rarely saw. Invalid moves can then appear late in a trace for this reason alone. Keep the cap near the longest training sequence, or compare two caps.

> [!trap] A small model is not the paper's model
> The paper's model has about 450 times more parameters and 12 to 25 times more training steps. Expect the same shape, not the same numbers. Do not compare your accuracy with the paper's curves as if they were the same experiment.

## 9. E5: an n-gram loop detector

**Specification.** Work on lists of token ids.

1. `has_loop(tokens, n, k)`: the paper's offline rule. True if any n-gram appears at least $k$ times.
2. `LoopGuard(n, k, window=None)` with `push(token) -> bool`: the online version. With a window, count only n-grams that start inside the last `window` tokens: a rolling window.
3. Each `push` does a constant amount of work on average. Use a hash of the last $n$ tokens, not a new slice each time.

**Acceptance tests.**

1. A periodic text with period $P$ after a random prefix: the guard fires exactly when the looping text reaches $n + (k - 1)P$ tokens. Test $P$ = 1, 7, 40 and 400.
2. With $n = 20$, $k = 4$, `window=1024`: the guard fires for $P = 300$, and never fires for $P = 400$, because $20 + 3 \times 400 > 1{,}024$.
3. A random text of 30,000 tokens over 1,000 token ids: no fire at $n = 30$, $k = 20$.
4. `has_loop` and a final `LoopGuard` without a window agree on 1,000 random texts with and without loops.
5. 30,000 pushes take less than one second in plain Python.
6. A table-like text that repeats the same row template with different numbers: record the false alarms at $(30, 20)$ and at $(20, 4)$.
7. A loop that repeats one sentence in five different wordings: show that the detector does not fire, and record this limit in the README.

## 10. E6 (optional): looping in a small open reasoning model

You need access to an open reasoning model, on your own GPU or through a hosted endpoint that accepts temperature 0. Newer Claude models do not accept a temperature other than 1.0 (page 12), so use an open model.

1. Take one small model of the paper, for example R1-Distill-Qwen-1.5B or OpenThinker3-1.5B.
2. Take 5 AIME problems. Record where the problem texts come from.
3. Run 10 samples per problem at $T = 0$ and at the recommended temperature. Use the model's default top-k and top-p and no repetition penalty, as the paper did (Appendix A).
4. At $T = 0$, the runs can still differ a little, because serving stacks are not fully deterministic (the paper notes this in §2.1). Record how many distinct outputs you get.
5. Use a token budget that you can afford. With a budget of 8,000 tokens, the paper's rule can still see loops with a period up to $(8{,}000 - 30)/19 \approx 419$ tokens.
6. Mark each response with your E5 detector at $(30, 20)$. Also record the accuracy, the output tokens and the stop reason.

**Acceptance tests.**

1. Report the looping fraction at each temperature with a 95% Wilson interval ([pass rates and confidence intervals](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals)).
2. Report the total tokens and the cost of the run.
3. Compare the direction with the paper (more looping at $T = 0$). With 50 responses per temperature, say if the intervals overlap.
4. Read three looping responses. Classify each loop as exact or semantic, and as restatement of the problem, rechecking of a fact, or repetition of the same mistake.

## 11. Questions to answer in your README

1. Did E1 and E2 match the exact values? If not, what was the bug?
2. In E4, which features of Figure 4 did your small model reproduce, and which not?
3. How large was the reset overestimate at the root in your model?
4. What false-alarm rate did your detector have on legitimate repetition?
5. What would you change in a production agent because of your results?

## 12. This works. Would you deploy it?

Before you call your detector a tool for your team, answer these:

- [ ] Does it run on a stream with constant work per token?
- [ ] Are its thresholds tested on normal outputs from your real tasks?
- [ ] Does it log each detection with the model, the temperature and the position?
- [ ] Is the action after a detection defined and tested: stop, extract, resample, escalate, fall-back message?
- [ ] Do the tests run in CI without a model?

## 13. Common mistakes

1. **"E1 converged, so the code is right."** Check the result against the exact values. A wrong sign or a missing $1/n$ also converges, to the wrong point.
2. **"Temperature 0 means divide by zero."** Treat $T = 0$ as a separate case: take the argmax, with a fixed tie rule.
3. **"The loss must include the edge list."** The paper applies the loss only to the walk. A loss on random edge lists teaches nothing useful and hides the walk loss.
4. **"My small Transformer reached 5% accuracy, so the paper is wrong."** First count the invalid moves. An under-trained model fails for a different reason than the paper's model.
5. **"Looping count means the same thing in every figure."** In §3 it counts root-to-start transitions. In §4 it counts visits to the most visited root child.

## 14. One-minute explanation

The exercises rebuild the paper from the bottom. E1 fits a shared distribution by gradient descent and recovers $p$ and $(1-p)/n$ exactly. E2 simulates the Markovian student and shows the greedy start-root loop, with exact lengths from first-step analysis. E3 generates star-graph data in the paper's string format, with tests on node counts and on walk lengths. E4 trains a small Transformer on a laptop CPU and checks the shape of Figure 4: more loops and longer responses at low temperature. E5 builds an online n-gram detector and measures its delay of $n + (k-1)P$ tokens. E6 measures looping in a real open model at two temperatures, with confidence intervals.

## 15. Check questions

```check
{
  "question": "In E2 at T = 0 with n = 5 and a cap of 500 moves, why is the looping count exactly 250?",
  "answer": "The greedy student moves start to root (0.7 > 0.3), then root to start (0.3 > 0.7/5 = 0.14). Every two moves contain one root-to-start transition, so 500 moves give 500 / 2 = 250."
}
```

```check
{
  "question": "Your E4 model has a training loss of 1.9 per walk token after 1,000 steps. The target levels are 0.80 (all but the root learned) and 0.54 (perfect). What do you conclude, and what do you do?",
  "answer": "The model has not yet learned to follow edges, so its loops and accuracy say nothing about the paper's mechanism. Train longer (thousands of steps), check the learning rate, and evaluate only when the loss is near 0.80."
}
```

```check
{
  "question": "Why does the E5 guard with n = 20, k = 4 and a window of 1,024 tokens miss a loop with a period of 400 tokens?",
  "answer": "It needs 20 + (4 - 1) × 400 = 1,220 tokens of looping text to see four copies of the same 20-gram, but the window holds only 1,024 tokens. The first copies leave the window before the fourth copy arrives."
}
```

## 16. Links

- Previous: [13 Limits and later work](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/13-limits-and-later-work)
- The paper card: [Why do reasoning models loop?](/notes/papers/reasoning-models/2025-why-reasoning-models-loop)
- The task: [06 Experiment design](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/06-experiment-design)
- Proposition 1: [08 Why 1: risk aversion](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/08-why-1-risk-aversion)
- The margin variant: [09 Why 2: temporally correlated errors](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/09-why-2-temporally-correlated-errors)
- The detector rules: [12 Engineering takeaways](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/12-engineering-takeaways)
- The same kind of page for another paper: [Lost in the Middle: reproduce it](/notes/papers/long-context/2023-lost-in-the-middle/11-reproduce-it)
