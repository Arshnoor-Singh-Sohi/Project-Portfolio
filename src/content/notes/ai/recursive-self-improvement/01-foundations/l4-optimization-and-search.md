---
title: "L4: Optimization and search"
order: 4
summary: "How to choose the best option by a measurable objective: search spaces, local search, exploration, black-box search and budgets."
status: not-started
tags: [rsi, foundations, optimization, search, hill-climbing, evolution]
---

## Learning objectives

After this lesson you can:

- Define variables, objective, constraints, search space, feasible option, optimum and local optimum.
- Count the size of a search space, and explain why exhaustive search fails for large spaces.
- Run hill climbing by hand on a small landscape, and explain why it can stop at a local optimum.
- Compute the chance that random restarts or random search find a good option.
- Explain exploration and exploitation, black-box optimization and evolutionary search.
- Describe an improvement loop as a search over versions with a noisy evaluator and a budget.

## Prerequisites

- [L1: Programs, models and language models](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models)
- [L3: Feedback loops](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops)

## 1. The question this idea answers

You want to bake the best possible cake. You can change three things: the amount of sugar, the oven temperature and the baking time. Each cake takes an hour, and a group of friends gives each cake a taste score. You can bake perhaps ten cakes this month. Which ten cakes should you bake?

Or you want the fastest route to work. There are many streets and many turns. You cannot try every route. Each test drive costs a morning.

Both problems have the same parts. There are **choices**. There is a **number** that says how good a choice is. Each test **costs** something. You want the best choice for a limited cost. This is **optimization**, and the method you use to try choices is **search**.

An agent that improves itself faces exactly this problem. Its choices are possible changes to its prompts, tools or code. Its number is a benchmark score. Each test costs time and money. This lesson gives you the words and the methods. Later parts apply them to recursive self-improvement (RSI).

## 2. Mental model, and where it stops working

> [!analogy] A hiker in fog
> - A hiker wants to reach the highest point of a mountain range. Thick fog hides everything except the ground around her feet.
> - She can feel which nearby step goes up. So she always steps uphill. When no step goes up, she stops.
> - Often she stops on a small hill, not on the highest peak. The small hill is a **local optimum**. To find the high peak, she must sometimes walk down, or start again somewhere else.
> - **Where it stops working:** the hiker feels the slope for free. In black-box search over prompts or programs, there is no slope, and each "step" costs money.
> - Also, the hiker's altitude meter is exact. A benchmark score is noisy, so the "ground" seems to move each time you measure it.

## 3. Terms

| Term | Plain meaning |
|---|---|
| optimization | Choosing the best option according to a measurable objective. |
| variable | One thing that you can choose, for example the sugar amount. |
| objective | The quantity that an improvement process tries to make larger (or smaller). |
| constraint | A rule that an option must obey, for example "baking time at most 60 minutes". |
| search space | The set of all options that the method can try. |
| feasible option | An option that obeys every constraint. |
| optimum (global optimum) | The best feasible option in the whole search space. |
| local optimum | An option that is better than all its neighbors, but not the best overall. |
| neighbor | An option that one small change can reach from the current option. |
| exhaustive search | Trying every option in the search space. |
| local search | Moving from option to nearby option, guided by the objective. |
| hill climbing | Local search that always moves to a better neighbor and stops when none is better. |
| random restart | Starting local search again from a new random option. |
| exploration | Trying options whose value is still unknown. |
| exploitation | Choosing options that are already known to be good. |
| gradient | The slope of the objective: how fast it changes when a variable changes. |
| black-box optimization | Optimization in which you can only evaluate options and get scores, with no slope and no formula. |
| evolutionary search | Search that keeps a population of options, makes changed copies of good ones, and keeps the best. |
| random search | Search that tries options chosen at random. |
| evaluation budget | The total time or money available for evaluating options. |
| candidate | A proposed new version that is not yet accepted. |
| parent | The version from which a candidate is made by a change. |
| archive | The stored set of kept versions, with their scores, from which later parents are chosen. |

## 4. Method and math

### 4.1 The parts of an optimization problem

Write the cake problem in parts:

1. **Variables:** sugar from 50 to 150 g, oven temperature from 160 to 220 °C, baking time in minutes.
2. **Objective:** the average taste score of your friends. Higher is better.
3. **Constraint:** baking time at most 60 minutes.
4. **Search space:** all combinations of the three variables.
5. **Feasible options:** the combinations with baking time at most 60 minutes.

The idea of optimization in words: among the feasible options, choose the one with the highest objective.

$$
x^{*} = \arg\max_{x \in F} J(x)
$$

The symbols mean:

- $x$ is one option, for example (100 g, 180 °C, 40 minutes).
- $F$ is the set of feasible options.
- $J(x)$ is the objective of option $x$, for example its taste score.
- $\arg\max$ means "the option that gives the largest value", not the largest value itself.
- $x^{*}$ is the best option, the optimum.

In plain English: try to find the feasible option with the highest score.

**Worked example.** Suppose you baked three feasible cakes with scores $J = 6.1$, $7.4$ and $6.8$. Among these three, $\arg\max$ is the second cake, and $\max$ is 7.4. The true optimum $x^{*}$ may be a cake that you never baked.

- **Assumptions:** $J$ is defined for every feasible option, and a larger $J$ is really better.
- **When it is useful:** to state a problem exactly before you choose a method.
- **What it does NOT prove:** the equation says what you want. It does not say how to find it, or if your measured $J$ matches what you really care about ([Lesson 3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops), section 4.9).

### 4.2 How large search spaces get

The simplest method is **exhaustive search**: try every option. It always finds the optimum. It fails when the space is large.

**Worked example: a prompt.** Suppose a prompt has 10 words, and each word comes from a vocabulary of 1,000 words.

1. The first word has 1,000 choices.
2. For each of them, the second word has 1,000 choices. That gives $1{,}000^2 = 10^6$ pairs.
3. Ten words give $1{,}000^{10} = 10^{30}$ prompts.
4. Suppose you could evaluate one million prompts per second. You would need $10^{30} / 10^{6} = 10^{24}$ seconds.
5. One year has about $3.16 \times 10^{7}$ seconds. So you would need about $3.2 \times 10^{16}$ years.

Real prompts are longer, and real programs are larger still. AutoML-Zero searched for whole learning algorithms built from basic math operations (Real et al., 2020, [arXiv:2003.03384](https://arxiv.org/abs/2003.03384)). Its introduction says: "good algorithms to learn even a trivial task can be as rare as 1 in 10^12".

So almost every real optimization method tries only a tiny part of its space. The question is which part.

### 4.3 A small landscape

To study search methods, use a space small enough to see completely. The variable $x$ is a whole number from 0 to 20. The objective is

$$
J(x) = 6\,e^{-(x-4)^2/8} + 10\,e^{-(x-15)^2/12}
$$

You do not need to understand the formula. It makes two hills: a small hill at $x = 4$ and a large hill at $x = 15$. Here are the values:

| $x$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| $J(x)$ | 0.81 | 1.95 | 3.64 | 5.30 | **6.00** | 5.30 | 3.65 | 2.00 | 0.98 | 0.76 | 1.31 |

| $x$ | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|
| $J(x)$ | 2.65 | 4.73 | 7.17 | 9.20 | **10.00** | 9.20 | 7.17 | 4.72 | 2.64 | 1.25 |

The **global optimum** is $x = 15$ with $J = 10.00$. The point $x = 4$ with $J = 6.00$ is a **local optimum**. Both of its neighbors, 3 and 5, score lower. But it is not the best overall. A picture of $J$ as a curve is a **landscape**.

Exhaustive search needs 21 evaluations here and always finds $x = 15$. In this tiny space, that is cheap. In a space of $10^{30}$ options, it is impossible.

### 4.4 Hill climbing

**Hill climbing** is the hiker's method. Its steps are:

1. Start at some option $x$. Evaluate it.
2. Evaluate all neighbors of $x$. Here the neighbors are $x - 1$ and $x + 1$.
3. If the best neighbor scores higher than $x$, move to it. Go to step 2.
4. Otherwise, stop. The current $x$ is a local optimum.

**Worked trace from $x = 1$.**

| Iteration | Current $x$ | $J(x)$ | Neighbors and scores | Decision |
|---|---|---|---|---|
| 1 | 1 | 1.95 | 0: 0.81, 2: 3.64 | Move to 2 |
| 2 | 2 | 3.64 | 1: 1.95, 3: 5.30 | Move to 3 |
| 3 | 3 | 5.30 | 2: 3.64, 4: 6.00 | Move to 4 |
| 4 | 4 | 6.00 | 3: 5.30, 5: 5.30 | Stop |

Count the evaluations: 1 for the start, then 2 per iteration for 4 iterations. That is 9 evaluations. The result is $x = 4$ with $J = 6.00$. Hill climbing stopped on the small hill. It never saw the large one.

**Worked trace from $x = 11$.** The climb goes 11 (2.65), 12 (4.73), 13 (7.17), 14 (9.20), 15 (10.00). At 15, both neighbors score 9.20, so it stops. This needs 11 evaluations and finds the global optimum.

So the result of hill climbing depends on the start. Every start from 0 to 8 ends at $x = 4$. Every start from 9 to 20 ends at $x = 15$. The set of starts that lead to one optimum is its **basin**. Here the basin of the global optimum has 12 of the 21 starts.

> [!key] Local optimum
> 1. **Name:** local optimum.
> 2. **Meaning:** an option that no single small change can improve, although a better option exists elsewhere.
> 3. **Problem it explains:** why a greedy improvement loop can stop improving long before the best option.
> 4. **Example:** $x = 4$ in the landscape above.
> 5. **Link to RSI:** an agent that only keeps changes that raise its score can reach a version where no small change helps. That looks like a plateau. Keeping weaker versions as stepping stones is one answer ([Part 3, L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions)).
> 6. **Limits:** "local" depends on what counts as a neighbor. With bigger changes, $x = 4$ might not be a local optimum. In a noisy landscape, a version can also look like a local optimum only because of bad luck.

### 4.5 Random restarts

One answer to local optima is to climb again from a new random start. This is a **random restart**.

The idea in words: if each climb succeeds with chance $q$, then $r$ independent climbs all fail with chance $(1 - q)^r$.

$$
P(\text{at least one success in } r \text{ tries}) = 1 - (1 - q)^r
$$

The symbols mean:

- $q$ is the chance that one try succeeds.
- $r$ is the number of independent tries.
- $(1 - q)^r$ is the chance that every try fails.

In plain English: the chance of at least one success is one minus the chance that all tries fail.

**Worked example.** A random start lands in the basin of $x = 15$ with chance $q = 12/21 = 0.571$.

| Restarts $r$ | Chance to find $x = 15$ | Expected evaluations (about 10 per climb) |
|---|---|---|
| 1 | 0.571 | 10 |
| 2 | 0.816 | 20 |
| 3 | 0.921 | 30 |
| 5 | 0.986 | 50 |

Notice the cost. Three restarts cost about 30 evaluations, more than the 21 of exhaustive search. Restarts pay off only when the space is too large for exhaustive search.

- **Assumptions:** the tries are independent, and each has the same chance $q$.
- **When it is useful:** to decide how many tries a budget should buy.
- **What it does NOT prove:** in a real problem you do not know $q$. A space with many small hills can have a very small $q$ for the best one.

### 4.6 Exploration and exploitation

Every search spends its budget on two kinds of choices.

1. **Exploitation:** spend tests near options that are known to be good. You collect the value that you already know about.
2. **Exploration:** spend tests on options whose value is unknown. You may find something much better, or waste the test.

A restaurant example makes this concrete. If you always eat at your favorite restaurant, you exploit. You never find the better place two streets away. If you always try a new place, you explore. You often eat badly. A good strategy mixes both.

Hill climbing is pure exploitation. Random restarts add exploration.

Self-improving systems face the same choice when they pick which version to improve next. The Darwin Gödel Machine (DGM) keeps an archive of agent versions. It picks a parent version with a rule that favors high scores. It also lowers the chance of versions that already have many children (Zhang et al., 2025, [arXiv:2505.22954](https://arxiv.org/abs/2505.22954), Appendix A.2 of v1). In plain words, under-explored branches keep getting chances.

**Measured, single run per setting:** on a 200-task subset of the SWE-bench Verified coding benchmark, the full DGM reached 50.0%. A greedy variant that always picks the best version as parent reached 39.7%. A variant that always changes the latest version, with no archive, reached 23.0% (Zhang et al., 2025, main results and v3 Appendix A.3). These are single runs, so part of each gap may be noise. **Our interpretation:** the direction of the result fits the hiker picture. Pure exploitation got stuck lower.

### 4.7 Evolutionary search

**Evolutionary search** keeps a **population** of options instead of one current option. It repeats three steps:

1. **Selection:** choose good members of the population as parents.
2. **Mutation:** make a changed copy, a child, of each parent.
3. **Replacement:** add the children, and remove some members to keep the population size fixed.

**Worked example on the landscape.** Start with a population of four: $x = 1, 6, 11, 18$.

1. Scores: 1.95, 3.65, 2.65 and 4.72.
2. Selection: keep the best two, 18 and 6.
3. Mutation: each parent makes one child with a random change between −2 and +2. Suppose the changes are −2 and −2. The children are 16 and 4.
4. Scores of the children: 9.20 and 6.00.
5. New population: 18, 6, 16, 4. The best member is now 16, with 9.20.

After one generation, the population already sits near both hills. It explores two regions at once. Hill climbing from one start could not do that.

A classic algorithm of this kind is **regularized evolution**. It was used to search for neural network designs (Real et al., 2019, [arXiv:1802.01548](https://arxiv.org/abs/1802.01548)):

1. Keep a population of $P = 100$ designs, each trained and scored.
2. Sample $S = 25$ designs at random. The best of the sample becomes the parent. This is **tournament selection**.
3. Mutate the parent, train the child and score it. Add it to the population.
4. Remove the **oldest** design, not the worst.

Why remove the oldest? The authors' hypothesis is that evaluation is noisy. Without aging, a design with a lucky score can stay in the population forever. **Claimed**, with support from a small experiment: aging keeps only designs whose good scores repeat when the design is trained again. This is a first lesson about noisy evaluation that returns in [Part 4, L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise).

In 2023–2026 systems, an LLM often plays the role of the mutation step. It reads a program and writes a changed version. FunSearch, AlphaEvolve and OpenEvolve work this way ([Part 5, L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods)).

### 4.8 Gradient descent: search with a slope

Sometimes the objective is a smooth formula that a computer can differentiate. Then the **gradient**, the slope, tells you which direction improves the objective and how steeply. You do not need to test neighbors one by one. You compute the slope and step against it, when you minimize a loss.

This is **gradient descent**, the method that trains neural networks. It is a kind of local search, so it can also stop at a local optimum. [Lesson 6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) works through it with numbers.

### 4.9 Black-box optimization: only scores

In most improvement problems of this course, there is no slope.

1. A prompt is text. You cannot take the derivative of an accuracy score with respect to a word.
2. A program is text with exact syntax. A tiny change can break it completely.
3. The score comes from running the agent on tasks. This process is a "black box": you see the input and the score, nothing inside.

This setting is **black-box optimization**. The search can only propose a candidate, evaluate it and read the score.

OPRO is a clear example of black-box search with an LLM as the proposer (Yang et al., 2023, [arXiv:2309.03409](https://arxiv.org/abs/2309.03409)). It starts from the problem statement: many optimization problems have no gradient. Its loop is:

1. Put the best 20 instructions found so far, with their scores, into a prompt.
2. Ask the LLM for 8 new instructions that should score higher.
3. Score each new instruction on a training subset.
4. Repeat, by default for 200 iterations.

That is 1,600 evaluated instructions per default run. The LLM never sees a gradient. It sees scored examples and guesses a better one.

### 4.10 Random search: the baseline that is hard to beat

The simplest black-box method is **random search**: pick options at random and keep the best one.

Bergstra and Bengio studied it for choosing the settings of machine learning models (Bergstra and Bengio, 2012, JMLR 13:281–305). They report that "randomly chosen trials are more efficient for hyper-parameter optimization than trials on a grid." They also found that on most data sets, "a few of the hyper-parameters really matter, but that different hyper-parameters are important on different data sets."

**Our interpretation** of why this happens: suppose two settings exist, and only one matters. A 3 × 3 grid of 9 trials tests only 3 different values of the setting that matters. Nine random trials test 9 different values of it.

The restart formula of section 4.5 gives a second reason. Suppose the best 5% of options are good enough for you. One random trial lands there with chance $q = 0.05$.

| Random trials $n$ | Chance of at least one top-5% option |
|---|---|
| 1 | 0.050 |
| 10 | 0.401 |
| 30 | 0.785 |
| 60 | 0.954 |
| 100 | 0.994 |

Sixty random trials find a top-5% option with 95% chance, whatever the size of the space. This holds only for "top 5%", not for "the single best option".

Random search is also a strong baseline for more complex methods:

- **Measured:** Li and Talwalkar found that "random search with early-stopping is a competitive NAS baseline" (2019, [arXiv:1902.07638](https://arxiv.org/abs/1902.07638)). NAS means neural architecture search.
- **Measured:** Yu and colleagues report: "On average, the state-of-the-art NAS algorithms perform similarly to the random policy" (2019, [arXiv:1902.08142](https://arxiv.org/abs/1902.08142)).
- **Measured:** in the other direction, AutoML-Zero reports a case where evolution wins (Real et al., 2020, Section 4.1). For linear regression, "evolution is 5 times more efficient than RS". RS means random search.

> [!trap] Always compare with random search at the same budget
> A new search method can look good because it had more evaluations, not because it searched better. A fair test gives random search the same number of evaluations. Many papers in this course do not report such a baseline.

### 4.11 The evaluation budget

In the cake example, each evaluation costs an hour. In agent improvement, each evaluation means running an agent on many tasks with an LLM. Real costs from the research:

| System | Cost | Source and caveat |
|---|---|---|
| DGM, one SWE-bench run | about USD 22,000 and about 2 weeks | DGM paper, v1 appendix and v3 Section 6. One check for this course could not confirm the dollar figure. |
| DGM, one candidate on 60 tasks | about USD 350 | DGM v1 cost table, estimate |
| SICA, 15 iterations | about USD 7,000 | SICA paper. The main agent may take about an hour per iteration. |
| Gödel Agent, one full run | about USD 15, against USD 300 for Meta Agent Search | Gödel Agent paper, Appendix D |

The budget forces a trade-off. You can evaluate **more candidates** on fewer tasks each, or **fewer candidates** on more tasks each.

- More candidates means more exploration. But scores on few tasks are noisy, so you may pick a lucky candidate.
- More tasks per candidate gives reliable scores. But you try fewer ideas.

The DGM's staged evaluation is one answer. It scores each new agent on 10 tasks first. Only agents that do well enough get 50 more tasks (Zhang et al., 2025, Section 4.1). The exact rules differ between the paper and the public code. [Part 3, L2](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step) traces this in detail.

### 4.12 An improvement loop is a search

Now translate every word of this lesson into the language of self-improving systems:

| Optimization word | In an improvement loop |
|---|---|
| Option, variable | A version of the agent: its prompts, tools, code or weights |
| Search space | All versions that the proposer can reach |
| Objective | The benchmark score, or a utility that adds cost and time |
| Neighbor | A candidate made by one change to a parent version |
| Evaluation | Running the candidate on tasks and scoring it |
| Hill climbing | Keep the candidate only if it beats its parent |
| Local optimum | A plateau: no small change helps |
| Population | An archive of kept versions |
| Exploration | Improving weaker or less-tried versions |
| Evaluation budget | API cost and time per run |
| Noise | The chance part of a score on a finite set of tasks |

> [!key] The link to RSI
> An improvement loop is a search over versions, with a noisy evaluator and a budget. In recursive self-improvement, one more thing is true: the search procedure itself is part of what can change. The proposer, the acceptance rule or the parent-selection rule can become a candidate. So the search can change how it searches.

## 5. Graphs

```plot
{
  "title": "Landscape J(x) (ink), hill climbing from x = 1 stops at the local optimum x = 4 (red), climbing from x = 11 reaches x = 15 (blue)",
  "xAxis": { "label": "option x", "domain": [0, 20] },
  "yAxis": { "label": "objective J(x)", "domain": [0, 11] },
  "disableZoom": true,
  "data": [
    { "fn": "6*exp(-(x-4)^2/8)+10*exp(-(x-15)^2/12)", "color": "#100D12" },
    { "points": [[1, 1.95], [2, 3.64], [3, 5.30], [4, 6.00]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 1.95], [2, 3.64], [3, 5.30], [4, 6.00]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "points": [[11, 2.65], [12, 4.73], [13, 7.17], [14, 9.20], [15, 10.00]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[11, 2.65], [12, 4.73], [13, 7.17], [14, 9.20], [15, 10.00]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true }
  ]
}
```

The red climb ends on the small hill. The blue climb ends on the large hill. Both follow the same rule. Only the start differs.

```plot
{
  "title": "Chance of at least one success: random restarts with q = 0.571 (blue), random search for a top-5% option with q = 0.05 (gold)",
  "xAxis": { "label": "number of tries", "domain": [0, 100] },
  "yAxis": { "label": "chance", "domain": [0, 1.05] },
  "disableZoom": true,
  "data": [
    { "fn": "1-(1-0.571)^x", "color": "#1E6091" },
    { "fn": "1-(0.95)^x", "color": "#B8860B" }
  ]
}
```

Both curves use the formula of section 4.5. The blue curve is close to 1 after a few tries, because the good basin is large. The gold curve needs about 60 tries to reach 0.95, because only 5% of options are good enough.

## 6. Video and animation

- [Why Greatness Cannot Be Planned](https://www.youtube.com/watch?v=VDuF4onPmuE) (Kenneth Stanley). Direct pursuit of an objective often fails, and "stepping stones" lead further. This is the idea behind keeping an archive of weaker versions. It supports sections 4.4 and 4.6.
- [The AI Scientific Revolution will be Driven by Open-Ended and AI-Generating Algorithms](https://www.youtube.com/watch?v=P-qzI6ZJQBw) (Jeff Clune, Vector Institute). It connects open-ended search to the DGM and to automated agent design. It supports sections 4.6 and 4.12.

## 7. Code

Hill climbing on the landscape of section 4.3. The function counts every evaluation.

```python
import math

def objective(x):
    return 6 * math.exp(-(x - 4) ** 2 / 8) + 10 * math.exp(-(x - 15) ** 2 / 12)

def hill_climb(x, low=0, high=20):
    evaluations = 1
    while True:
        neighbors = [n for n in (x - 1, x + 1) if low <= n <= high]
        evaluations += len(neighbors)
        best = max(neighbors, key=objective)
        if objective(best) <= objective(x):
            return x, round(objective(x), 2), evaluations
        x = best

for start in [1, 11, 18]:
    print(start, hill_climb(start))
```

Output:

```text
1 (4, 6.0, 9)
11 (15, 10.0, 11)
18 (15, 10.0, 9)
```

Each line shows the start, then the end point, its score and the number of evaluations. Exercise: add random restarts. Run 3 climbs from random starts and keep the best end point. Repeat 1,000 times, and check that about 92% of the runs find $x = 15$.

## 8. Common mistakes

1. **"A loop that stopped improving has found the best option."** It may sit on a local optimum. The climb from $x = 1$ stopped at 6.00 while 10.00 existed.
2. **"Smart search always beats random search."** Several studies found random search competitive with neural architecture search methods. Compare at the same budget.
3. **"More candidates is always better."** With a fixed budget, more candidates means fewer tasks per candidate, so noisier scores. The best-looking candidate may only be lucky.
4. **"Exploration wastes budget."** Pure exploitation got stuck. The greedy DGM variant reached 39.7%, against 50.0% for the version that explores, in single runs.
5. **"A prompt search can use gradient descent."** A prompt is discrete text, and the score comes from a black box. Prompt and code search is black-box search.

## 9. One-minute explanation

Optimization means choosing the best option by a measurable objective, within some constraints. Real search spaces are huge: a 10-word prompt from 1,000 words has $10^{30}$ options, so nobody can try them all. Hill climbing moves to a better neighbor until none is better, but it can stop on a local optimum. Random restarts and populations add exploration.

When there is no slope, as with prompts and programs, you can only evaluate candidates and read scores. That is black-box optimization, and random search is a hard baseline to beat. Every evaluation costs time and money. An improvement loop is exactly such a search over versions, with a noisy evaluator and a budget. In RSI, the search procedure itself can also change.

## 10. Check questions

```check
{
  "question": "A prompt template has 4 slots. Each slot takes one of 50 phrases. How many prompts exist? If one evaluation costs USD 2, what does exhaustive search cost?",
  "answer": "50^4 = 6,250,000 prompts. Exhaustive search costs 6,250,000 × 2 = USD 12,500,000. This is why real systems try only a tiny part of the space."
}
```

```check
{
  "question": "Run hill climbing by hand on the landscape of section 4.3 from x = 7. Write each move and the final point. How many evaluations does it use?",
  "hint": "At x = 7 the neighbors are 6 (3.65) and 8 (0.98).",
  "answer": "From 7 (2.00), the best neighbor is 6 (3.65), so move to 6. From 6, the best neighbor is 5 (5.30), so move to 5. From 5, the best neighbor is 4 (6.00), so move to 4. At 4, both neighbors score 5.30, so stop. The result is the local optimum x = 4. Evaluations: 1 + 2 × 4 = 9."
}
```

```check
{
  "question": "A local search succeeds with chance q = 0.2 per independent start. How many starts do you need for at least a 90% chance of success?",
  "hint": "Solve 1 - 0.8^r ≥ 0.9.",
  "answer": "You need 0.8^r ≤ 0.1. Check values: 0.8^10 = 0.107 (not enough), 0.8^11 = 0.086. So r = 11 starts give a chance of 1 - 0.086 = 0.914."
}
```

```check
{
  "question": "A paper reports that its new LLM-based search found a prompt with 74% accuracy after 500 evaluations. The baseline, a hand-written prompt, scored 68%. Name two things that you must check before you believe that the search method is good.",
  "answer": "1. A random-search baseline with the same 500 evaluations. Random sampling of prompts might also reach 74%. 2. The accuracy of the chosen prompt on a separate test set. The 74% was the best of 500 noisy scores on the selection tasks, so it is probably optimistic. Other useful checks are the number of tasks behind each score and the cost of the search."
}
```

```check
{
  "question": "The DGM variant that always changes the latest version, with no archive, reached 23.0%. The full DGM reached 50.0%. Analyse this result with the words of this lesson, and state one limit of the evidence.",
  "answer": "Always changing the latest version is like a single walker that never goes back. A bad change cannot be undone, and the search cannot explore other branches, so it gets stuck. The full DGM keeps an archive and picks parents with a rule that also gives weaker or less-tried versions a chance. That adds exploration and lets weaker versions serve as stepping stones. Limit: each setting was run once, so part of the gap may be noise. One run per setting cannot show how large the true difference is."
}
```

## 11. Summary and links

- Optimization chooses the best feasible option by a measurable objective. The equation $x^{*} = \arg\max_{x \in F} J(x)$ states the goal, not the method.
- Real search spaces are far too large for exhaustive search.
- Hill climbing is cheap but stops at local optima. Random restarts, populations and archives add exploration.
- Prompts and programs give only scores, not slopes. This is black-box optimization, and random search is a strong baseline.
- Every evaluation costs money and time, and scores are noisy. The budget forces a choice between more candidates and more reliable scores.
- An improvement loop is a search over versions. In RSI, the search procedure itself can change.

**What comes next.** In RSI, the search procedure can become a candidate. That requires a program that reads, writes and runs programs, including itself. [Lesson 5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) shows how.

**Where this idea returns.** The landscape and search spaces are formalized in [Part 4, L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces). Update rules such as greedy acceptance and simulated annealing are in [Part 4, L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules). Archives and parent selection are in [Part 3, L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions). Evolution with LLMs is in [Part 5, L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods). You build a hill-climbing improver in [Part 9, P4](/notes/ai/recursive-self-improvement/09-build-it/p4-propose-and-test-strategy-changes).

- Previous: [L3: Feedback loops](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops)
- Next: [L5: Recursion, self-reference and programs that change programs](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference)
- Related: [Part 5, L4: Workflow and architecture search](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search)

## References

- James Bergstra, Yoshua Bengio. "Random Search for Hyper-Parameter Optimization". Journal of Machine Learning Research 13(10):281–305, 2012. https://www.jmlr.org/papers/v13/bergstra12a.html
- Liam Li, Ameet Talwalkar. "Random Search and Reproducibility for Neural Architecture Search". UAI 2019. arXiv:1902.07638. https://arxiv.org/abs/1902.07638
- Kaicheng Yu, Christian Sciuto, Martin Jaggi, Claudiu Musat, Mathieu Salzmann. "Evaluating the Search Phase of Neural Architecture Search". ICLR 2020. arXiv:1902.08142. https://arxiv.org/abs/1902.08142
- Esteban Real, Alok Aggarwal, Yanping Huang, Quoc V Le. "Regularized Evolution for Image Classifier Architecture Search". AAAI 2019. arXiv:1802.01548. https://arxiv.org/abs/1802.01548
- Esteban Real, Chen Liang, David R. So, Quoc V. Le. "AutoML-Zero: Evolving Machine Learning Algorithms From Scratch". ICML 2020. arXiv:2003.03384. https://arxiv.org/abs/2003.03384
- Chengrun Yang, Xuezhi Wang, Yifeng Lu, et al. "Large Language Models as Optimizers". ICLR 2024. arXiv:2309.03409. https://arxiv.org/abs/2309.03409
- Jenny Zhang, Shengran Hu, Cong Lu, Robert Lange, Jeff Clune. "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents". 2025. ICLR 2026. arXiv:2505.22954. https://arxiv.org/abs/2505.22954
- Maxime Robeyns, Martin Szummer, Laurence Aitchison. "A Self-Improving Coding Agent". 2025. arXiv:2504.15228. https://arxiv.org/abs/2504.15228
- Xunjian Yin, Xinyi Wang, Liangming Pan, Li Lin, Xiaojun Wan, William Yang Wang. "Gödel Agent: A Self-Referential Agent Framework for Recursively Self-Improvement". ACL 2025. arXiv:2410.04444. https://aclanthology.org/2025.acl-long.1354
