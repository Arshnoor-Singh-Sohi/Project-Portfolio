---
title: "L1: Functions, objectives and search spaces"
order: 1
summary: "How to write an improvement problem as mathematics: variables, functions, objectives, constraints, expected scores and several objectives at once."
status: not-started
tags: [rsi, mathematics, objective, search-space, pareto, scalarization]
---

## Learning objectives

After this lesson you can:

- Write an improvement problem in the form "choose a version $s$ from a set $S$ to make $J(s)$ as large as possible, subject to constraints".
- Read the notation $f: X \to Y$, $\operatorname{argmax}$, the feasible set and an expectation over tasks.
- Compute the size of a search space and explain why exhaustive search fails.
- Compute an expected score and its estimate from a sample of tasks.
- Compute the utility of SICA, a self-improving coding agent, and explain what its mixing coefficients do.
- Find the Pareto front of a small set of versions, and explain how GEPA uses a Pareto rule to choose parents.

## Prerequisites

- [L4: Optimization and search](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search)
- [L7: What "improvement" means, and how to measure it](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement)
- [L1: The components of a self-improving system](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components)

## 1. The question this idea answers

A cook wants a better soup. Before the cook can improve anything, three questions need answers:

1. What can I change? The amounts of salt, garlic and water.
2. How do I know that a soup is better? The family gives each soup a score from 1 to 10.
3. What is not allowed? The soup must cost less than 5 units and must be ready in one hour.

Every improvement problem has these three parts: the things that can change, the number that says "better", and the limits. A self-improving agent has them too. Its prompts, code or weights can change. The number is a score on a benchmark. The limits are a budget of money, time and evaluations.

Papers often describe these parts in words, and words hide choices. Which tasks count? How much is one dollar worth against one percentage point? Mathematics forces you to write each choice down. This lesson gives you the notation that the rest of Part 4 uses.

## 2. Mental model, and where it stops working

> [!analogy] A walk over hills in fog
> Imagine a large area of land in thick fog. Each point on the ground is one version of an agent, and its height is the score of that version. You want the highest point. You can only stand at a point and read your altimeter, and each reading costs time and money. A search method is a rule for where to stand next.
>
> - **Where it stops working (1):** real ground has a natural idea of "near". Prompts and programs do not. Two prompts that differ by one word can have very different scores. "Near" means "reachable by one change of the proposer".
> - **Where it stops working (2):** the height is not fixed. It is an average over tasks, so a different sample of tasks gives a different height. Lesson L3 treats this noise.

## 3. Terms

| Term | Plain meaning |
|---|---|
| variable | A name for a value that can change, for example $x$ or the text of a prompt. |
| function | A rule that gives exactly one output for each allowed input. Notation: $f: X \to Y$. |
| domain | The set $X$ of allowed inputs of a function. |
| codomain | The set $Y$ in which the outputs of a function lie. |
| version | One complete state of the thing that is improved, written $s$. |
| search space | The set $S$ of all versions that the improver can reach. |
| objective | The function $J: S \to \mathbb{R}$ that the improvement process tries to make larger or smaller. |
| maximize, minimize | Make the objective as large as possible, or as small as possible. |
| argmax | The input at which a function has its largest value. $\max$ gives the value. $\operatorname{argmax}$ gives the input. |
| constraint | A condition that a version must meet, for example "cost per task at most USD 1". |
| feasible set | The versions in $S$ that meet every constraint. |
| global optimum | The best feasible version in the whole search space. |
| local optimum | A version that is better than all its neighbors, but not the best overall. |
| neighbor | A version that one change of the proposer can reach from the current version. |
| landscape | A picture of the objective as height over the search space. |
| discrete space | A search space whose versions can be listed one by one, for example all prompts. |
| continuous space | A search space of real numbers, for example all weight vectors of a model. |
| task distribution | The probabilities with which different tasks appear, written $\mathcal{D}$. |
| expected score | The average score of a version over the task distribution. |
| estimate | A number computed from a sample that stands in for an unknown quantity. |
| scalarization | Turning several objectives into one number, usually by a weighted sum. |
| mixing coefficient | The number that sets how much one objective counts in a weighted sum. Papers often call it a "weight", but in this course "weights" means the learned numbers of a model. |
| Pareto dominance | Version $a$ dominates version $b$ if $a$ is at least as good on every objective and strictly better on one. |
| Pareto front | The set of versions that no other version dominates. |

## 4. Method and math

### 4.1 Variables and functions

A **variable** is a name for a value that can change. In school algebra, $x$ is a variable that holds a number. In this course a variable can also hold a text, a program or a vector of weights.

A **function** is a rule that gives exactly one output for each allowed input. Mathematicians write $f: X \to Y$. Read it as "$f$ takes an element of $X$ and returns an element of $Y$". $X$ is the domain and $Y$ is the codomain.

For example, $f(x) = x^2$ with $X = Y = \mathbb{R}$, the real numbers, gives $f(3) = 9$. A benchmark evaluator is also a function. It maps a pair (version, task) to a number between 0 and 1.

> [!key] Term: a function with randomness
> - **Name:** random function, or a function of a random input.
> - **Meaning:** an agent that samples its output with a temperature above 0 can give different outputs for the same task. Its output depends on the task and on a random seed.
> - **Problem it solves:** we can still write $\text{score}(s, t)$ and treat it as a random number.
> - **Example:** an agent solves task $t$ in 6 of 10 runs. So one run's score is 1 with probability 0.6.
> - **Link to recursive self-improvement (RSI):** every score in a self-improving loop is a random number, so every comparison between versions is uncertain.
> - **Limits:** we then need averages and error bars, which L3 teaches.

### 4.2 The search space and its size

A **version** $s$ is one complete state of the improved thing: a prompt, a code base, a set of weights, or all three. The **search space** $S$ is the set of all versions that the improver can reach. The search space depends on the system boundary. If only the prompt can change, $S$ is a set of texts. If the agent's code can change, $S$ is a set of programs. See [L3: The system boundary, the "self" and persistence](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence).

**The idea.** A version has $\ell$ positions, and each position can take one of $V$ values. Each position multiplies the number of options by $V$.

$$
\lvert S \rvert = V^{\ell}
$$

**Symbols.**

- $\lvert S \rvert$ is the number of versions in the search space.
- $V$ is the number of choices at each position, for example the vocabulary size of a tokenizer.
- $\ell$ is the number of positions, for example the number of tokens in a prompt.

**In plain English.** The count of versions grows by a factor of $V$ for each added position. So it grows exponentially with the length.

**Worked example.** Take a prompt of $\ell = 100$ tokens over a vocabulary of $V = 50{,}000$ tokens.

1. Take the base-10 logarithm: $\log_{10} \lvert S \rvert = 100 \times \log_{10} 50{,}000$.
2. $\log_{10} 50{,}000 \approx 4.69897$.
3. So $\log_{10} \lvert S \rvert \approx 469.897$, and $\lvert S \rvert \approx 7.9 \times 10^{469}$.
4. Suppose a computer evaluates one million prompts per second. One year has $31{,}536{,}000$ seconds.
5. In one year it evaluates about $3.2 \times 10^{13}$ prompts. That is a fraction of about $4 \times 10^{-457}$ of the space.

**Assumptions.** Every position is free and independent. Real constraints, such as "the prompt must be valid English", remove most options. The count is still astronomically large.

**When it is useful.** It explains why no self-improving system searches exhaustively. Every real system uses a proposer that makes a few promising candidates. In this course, the proposer is usually a large language model (LLM).

**What it does not prove.** A large space does not mean that the problem is hard. Most of the space can be useless, and a good proposer can go straight to the useful part. Size says nothing about how many good versions exist.

**Discrete and continuous spaces.** Prompts and programs form a **discrete** space: you can list the versions one by one. Model weights form a **continuous** space: a model with $d$ weights is a point in $\mathbb{R}^d$. The difference matters. In a continuous space with a smooth loss, a gradient tells you which direction improves the score. In a discrete space there is no gradient, so the improver only gets scores of candidates. This is black-box search ([L4: Optimization and search](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search)).

**Neighbors are defined by the proposer.** In a discrete space, the neighbors of a version are the candidates that one change can produce. If the proposer can only replace one word, then two prompts with 10 different words are far apart. If an LLM rewrites the whole prompt, they can be neighbors. So a "local optimum" is not a property of the space alone. It is a property of the space together with the proposer.

### 4.3 The objective and the optimization problem

**The idea.** An improvement problem asks for the best version among the allowed ones. "Best" means the largest value of the objective $J$. "Allowed" means that the version meets every constraint.

$$
s^{*} = \operatorname{argmax}_{s \in F} J(s), \qquad F = \{\, s \in S : g_j(s) \le b_j \text{ for } j = 1, \dots, m \,\}
$$

**Symbols.**

- $s^{*}$ is the best feasible version, the global optimum.
- $S$ is the search space and $s$ is one version in it.
- $J(s)$ is the objective: a real number for each version.
- $\operatorname{argmax}_{s \in F}$ means "the $s$ in $F$ at which $J$ is largest".
- $F$ is the feasible set.
- $g_j(s)$ is the measured amount of resource $j$ that version $s$ uses, for example its cost per task.
- $b_j$ is the limit for resource $j$, and $m$ is the number of constraints.

**In plain English.** Among the versions that stay inside every limit, pick the one with the highest objective.

**Worked example.** Four prompt versions have these scores and costs. The constraint is "cost per task at most USD 1.00".

| Version | Score $J(s)$ | Cost per task (USD) | Feasible? |
|---|---|---|---|
| P1 | 0.62 | 0.40 | yes |
| P2 | 0.71 | 1.30 | no |
| P3 | 0.68 | 0.90 | yes |
| P4 | 0.55 | 0.20 | yes |

1. Remove the versions that break the constraint. P2 costs 1.30, which is more than 1.00. So $F = \{P1, P3, P4\}$.
2. Compare the scores in $F$: 0.62, 0.68 and 0.55.
3. The largest is 0.68, so $s^{*} = P3$ and $\max_{s \in F} J(s) = 0.68$.
4. Without the constraint, the answer would be P2. So the constraint changes the answer.

**Assumptions.** $J$ is known exactly for each version. In practice $J$ is estimated from a sample of tasks, so the "best" version can be wrong because of noise (L3). The constraints are measured exactly too, which is also rarely true.

**When it is useful.** Use this form to write down any improvement method before you study it. Ask: what is $S$, what is $J$, and what are the $g_j$ and $b_j$?

**What it does not prove.** The notation does not say that the improver can find $s^{*}$. It also does not say that $J$ measures what you care about. Part 8 shows how optimizers exploit the gap between a score and the real goal ([L1: Measured score versus real capability](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability)).

**Maximize or minimize.** Some problems minimize a loss instead of maximizing a score. The two forms are the same problem: $\operatorname{argmin}_s L(s) = \operatorname{argmax}_s (-L(s))$. Lesson L2 uses this fact.

**Local and global optima.** A version is a **local optimum** if no neighbor has a higher objective. The landscape in section 5 has the height function

$$
f(x) = 3\,e^{-(x-2)^2/1.5} + 5\,e^{-(x-7)^2/2}
$$

on the integer points $x = 0, 1, \dots, 10$.

- $x$ is the version, here an integer position.
- $f(x)$ is its objective.
- The neighbors of $x$ are $x - 1$ and $x + 1$.

In plain English, there are two hills. The low one is at $x = 2$ with height 3.0. The high one is at $x = 7$ with height 5.0.

Run greedy hill climbing: move to the better neighbor while it is better than the current point.

1. Start at $x = 1$, $f(1) = 1.540$. The neighbors are $f(0) = 0.208$ and $f(2) = 3.000$. Move to 2.
2. At $x = 2$, the neighbors are $f(1) = 1.540$ and $f(3) = 1.542$. Both are lower. Stop.
3. Start instead at $x = 5$, $f(5) = 0.684$. Move to 6 ($f = 3.033$), then to 7 ($f = 5.000$). At 7 both neighbors give 3.033. Stop.

The first run stops at the local optimum $x = 2$. The second run reaches the global optimum $x = 7$. So the result depends on the start point.

The example assumes a fixed neighbor rule of one step. With a proposer that can jump 5 positions, $x = 2$ is no longer a trap. The example does not prove that real agent landscapes have this shape. It only shows why a single greedy line of versions can stop early. The Darwin Gödel Machine (DGM) keeps an archive of versions for this reason ([L3: Archives: why keep more than the best version](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions)).

### 4.4 The objective as an expected score over tasks

A benchmark does not define one task. It defines many. A version can be strong on some tasks and weak on others. So the objective of a version is an average over the tasks that matter.

**The idea.** Weight each task by how often it appears in real use, and average the score.

$$
J(s) = \mathbb{E}_{t \sim \mathcal{D}}\big[\text{score}(s, t)\big] = \sum_{t} \mathcal{D}(t)\, \text{score}(s, t)
$$

**Symbols.**

- $t$ is one task.
- $\mathcal{D}$ is the task distribution, and $\mathcal{D}(t)$ is the probability of task $t$.
- $t \sim \mathcal{D}$ reads "$t$ is drawn from $\mathcal{D}$".
- $\text{score}(s, t)$ is the score of version $s$ on task $t$. If the agent is random, use its average over runs.
- $\mathbb{E}$ is the expectation: the probability-weighted average.
- The sum form holds when there are finitely many task types.

**In plain English.** The objective is the average score that the version would get on tasks drawn the same way as in real use.

**Worked example.** A coding agent meets four kinds of tasks.

| Task type | Probability $\mathcal{D}(t)$ | Pass rate of version $s$ | Product |
|---|---|---|---|
| Small bug fix | 0.4 | 0.9 | 0.36 |
| Feature in one file | 0.3 | 0.6 | 0.18 |
| Change across files | 0.2 | 0.3 | 0.06 |
| Large refactor | 0.1 | 0.0 | 0.00 |

1. Multiply each probability by the pass rate: 0.36, 0.18, 0.06 and 0.00.
2. Add the products: $J(s) = 0.36 + 0.18 + 0.06 + 0.00 = 0.60$.

The true objective is unknown in practice, because nobody knows $\mathcal{D}$ exactly. So we estimate it from a sample of $n$ tasks:

$$
\hat{J}_n(s) = \frac{1}{n} \sum_{i=1}^{n} \text{score}(s, t_i), \qquad t_1, \dots, t_n \sim \mathcal{D}
$$

- $\hat{J}_n(s)$ is the estimate from $n$ tasks. The hat means "estimated".
- $t_i$ is the $i$-th sampled task.

In plain English, the estimate is the plain average score on the tasks you actually ran.

Continue the example. You draw 10 tasks and the version solves 7. Then $\hat{J}_{10}(s) = 7/10 = 0.70$, while the true value is 0.60. The gap of 0.10 is sampling noise. With other 10 tasks you could get 0.5 or 0.8.

**Assumptions.**

1. The benchmark tasks are a fair sample of the tasks you care about.
2. The tasks are drawn independently.
3. The scoring rule stays fixed during the comparison.

**When it is useful.** It makes "better" precise. It also shows that a benchmark choice is a choice of $\mathcal{D}$. The DGM headline numbers on SWE-bench Verified use a 200-task subset of the 500 tasks (Zhang et al., 2025, [arXiv:2505.22954](https://arxiv.org/abs/2505.22954), Section 4). That subset defines the $\mathcal{D}$ that the reported number estimates.

**What it does not prove.** A high $\hat{J}_n$ does not prove a high $J$ for a different distribution. Benchmarks can be contaminated, or their tests can be weak. Then the estimate measures memory or test gaps, not skill ([L3: Evaluation failures](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures)).

> [!note] The same formula one level up
> STOP, the Self-Taught Optimizer, scores an improver instead of a solution. Its expected utility is an expectation over downstream tasks, in exactly this form (Zelikman et al., 2023, [arXiv:2310.02304](https://arxiv.org/abs/2310.02304), Section 3). Lesson L5 works through it.

### 4.5 Several objectives at once: scalarization

A real agent has more than one objective. You want a high score, a low cost and a short time. These goals conflict: more LLM calls often raise the score and also raise the cost.

**Scalarization** turns several objectives into one number. The most common form is a weighted sum. SICA uses one (Robeyns, Szummer and Aitchison, 2025, [arXiv:2504.15228](https://arxiv.org/abs/2504.15228), Section 3, Eqs. 1–2).

**The idea.** Give the score half of the credit. Give a quarter to low cost and a quarter to low time. Cap each penalty so that a very expensive or very slow run cannot go below zero on that term.

$$
U = w_{\text{score}}\, p_{\text{score}} + w_{\text{cost}} \left(1 - \min\left(1, \frac{p_{\text{cost}}}{10}\right)\right) + w_{\text{time}} \left(1 - \min\left(1, \frac{p_{\text{time}}}{300}\right)\right)
$$

$$
U_{\text{final}} = \begin{cases} U \cdot (1 - \tau) & \text{if the agent timed out} \\ U & \text{otherwise} \end{cases}
$$

**Symbols.**

- $U$ is the utility before the timeout rule.
- $p_{\text{score}} \in [0, 1]$ is the normalized benchmark performance.
- $p_{\text{cost}}$ is the cost per problem in USD. The cost penalty reaches its cap at USD 10.
- $p_{\text{time}}$ is the wall-clock time per problem in seconds. The time penalty reaches its cap at 300 s, the timeout.
- $w_{\text{score}} = 0.5$, $w_{\text{cost}} = 0.25$ and $w_{\text{time}} = 0.25$ are the mixing coefficients.
- $\tau = 0.5$ is the timeout penalty. It gives "partial credit for work done before the timeout" (Robeyns et al., 2025, Section 3).
- $\min(1, z)$ returns the smaller of 1 and $z$.

**In plain English.** Half of the utility comes from the score. A quarter rewards cost below USD 10. A quarter rewards time below 300 seconds. A timeout halves the result.

**Worked example 1: three rows of SICA's Table 1.** We put the averages of each table row into the formula. The paper does not report utilities for these rows, so these numbers are our illustration.

| Quantity | Iteration 0 | Iteration 14 | Iteration 15 |
|---|---|---|---|
| SWE-bench Verified score (50 tasks) | 0.17 | 0.53 | 0.51 |
| Cost per problem (USD) | 1.91 | 2.20 | 1.70 |
| Time per problem (s) | 130.2 | 117.1 | 114.5 |

For iteration 14:

1. Score term: $0.5 \times 0.53 = 0.265$.
2. Cost term: $2.20 / 10 = 0.22$, so $0.25 \times (1 - 0.22) = 0.195$.
3. Time term: $117.1 / 300 = 0.3903$, so $0.25 \times (1 - 0.3903) = 0.1524$.
4. Sum: $U = 0.265 + 0.195 + 0.1524 = 0.6124$.

The same steps give $U = 0.4288$ for iteration 0 and $U = 0.6171$ for iteration 15. So iteration 15 has a higher utility than iteration 14, although its score is lower. The cheaper and faster runs compensate for the lower score. A scalarized objective can rank versions differently from the headline score.

**Worked example 2: a timeout.** A run fails ($p_{\text{score}} = 0$), costs USD 4.00 and hits the 300 s limit. The terms are 0, $0.25 \times (1 - 0.4) = 0.15$ and $0.25 \times (1 - 1) = 0$. So $U = 0.15$, and the timeout rule gives $U_{\text{final}} = 0.15 \times 0.5 = 0.075$.

**Worked example 3: what the coefficients imply.** **Our interpretation:** this is arithmetic on the formula as published. It is not a failure that the SICA paper reports.

1. A version solves every problem but uses USD 10 and 300 s each: $U = 0.5 + 0 + 0 = 0.5$.
2. A version gives up at once, with almost zero cost and time: $U \approx 0 + 0.25 + 0.25 = 0.5$.

The two utilities are equal. A weighted sum states a price for each objective, and these prices can reward behavior that nobody wants. Before you trust a scalarized objective, test its extreme cases.

**Assumptions.** The objectives can be traded at fixed rates. One point of score is always worth the same amount of money and time. The caps (USD 10 and 300 s) are meaningful limits for the task.

**When it is useful.** Use a weighted sum when you know the exchange rates, for example a fixed budget per task. It turns a multi-objective problem into the single-objective form of section 4.3. Then any search method from L2 can run on it.

**What it does not prove.** The weights are a design choice, not a fact. A different choice gives a different "best" version. The utility also does not prove that a cheap version is as useful as an accurate one in real use.

### 4.6 Pareto dominance and the Pareto front

Sometimes you do not want to fix exchange rates in advance. Then you keep every version that is not clearly worse than another one.

**The idea.** Version $a$ **dominates** version $b$ if $a$ is at least as good on every objective and strictly better on at least one. A version that no other version dominates is **Pareto-optimal**. The set of Pareto-optimal versions is the **Pareto front**.

$$
a \succ b \iff \big(J_k(a) \ge J_k(b) \text{ for all } k\big) \text{ and } \big(J_k(a) > J_k(b) \text{ for some } k\big)
$$

**Symbols.**

- $a \succ b$ reads "$a$ dominates $b$".
- $J_k$ is objective number $k$, oriented so that larger is better. For cost, use $J_k = -\text{cost}$.
- $\iff$ reads "if and only if".

**In plain English.** One version beats another only if it is never worse and sometimes better.

**Worked example.** Five agent versions have a score (higher is better) and a cost per task in USD (lower is better).

| Version | Score | Cost (USD) | Dominated by | On the front? |
|---|---|---|---|---|
| A | 0.40 | 1.0 | none | yes |
| B | 0.50 | 2.5 | none | yes |
| C | 0.45 | 3.0 | B | no |
| D | 0.55 | 6.0 | none | yes |
| E | 0.50 | 4.0 | B | no |

1. Compare C with B. B has a higher score (0.50 against 0.45) and a lower cost (2.5 against 3.0). So B dominates C.
2. Compare E with B. The scores are equal (0.50), and B is cheaper (2.5 against 4.0). So B dominates E.
3. A is the cheapest version, so nothing dominates it. D has the highest score, so nothing dominates it. Nothing dominates B either.
4. The Pareto front is $\{A, B, D\}$.

A weighted sum picks one point of the front. Use $J = \text{score} - \lambda \cdot \text{cost}$, where $\lambda$ is the price of one USD in score points. With $\lambda = 0.01$, D wins with 0.49. With $\lambda = 0.05$, B wins with 0.375. With $\lambda = 0.10$, A wins with 0.30. A dominated version such as C never wins for any $\lambda \ge 0$.

**Assumptions.** Each objective is measured without noise. With noise, a version can look dominated by luck.

**When it is useful.** The front shows all sensible trade-offs at once. A human can then choose. It also keeps diverse versions alive in a search, which helps against local optima.

**What it does not prove.** The front can be very large when there are many objectives. Then almost every version is on the front, and the rule no longer selects much.

**GEPA: one objective per validation task.** GEPA (Genetic-Pareto) is a prompt optimizer. It uses the Pareto idea in a special way. Each validation task is its own objective (Agrawal et al., 2025, [arXiv:2507.19457](https://arxiv.org/abs/2507.19457), Algorithms 1–2). The paper says that greedy selection of the best candidate "often traps the optimizer in a local optimum". Its parent rule has four steps:

1. For each validation task $i$, find the highest score of any candidate.
2. Keep the candidates that reach this best score on at least one task.
3. Remove dominated candidates.
4. Sample a parent with probability proportional to the number of tasks on which it is best.

Take five candidates and five validation tasks:

| Candidate | Task 1 | Task 2 | Task 3 | Task 4 | Task 5 | Average | Best on | Parent probability |
|---|---|---|---|---|---|---|---|---|
| P1 | **0.9** | 0.2 | 0.4 | 0.3 | 0.5 | 0.46 | 1 task | 0.2 |
| P2 | 0.6 | **0.8** | 0.7 | 0.2 | **0.9** | 0.64 | 2 tasks | 0.4 |
| P3 | 0.5 | 0.3 | **0.8** | 0.1 | 0.4 | 0.42 | 1 task | 0.2 |
| P4 | 0.4 | 0.1 | 0.2 | **0.6** | 0.3 | 0.32 | 1 task | 0.2 |
| P5 | 0.7 | 0.7 | 0.6 | 0.5 | 0.8 | 0.66 | 0 tasks | 0 |

1. The best score per task is 0.9, 0.8, 0.8, 0.6 and 0.9 (bold).
2. P1 is best on task 1, P2 on tasks 2 and 5, P3 on task 3, and P4 on task 4. P5 is best on no task.
3. The counts are 1, 2, 1, 1 and 0. Their total is 5.
4. So the parent probabilities are $1/5$, $2/5$, $1/5$, $1/5$ and 0.

Look at P5. It has the highest average (0.66), yet the rule never picks it as a parent. The rule prefers "specialists" that solve some task better than anyone. **Our interpretation:** specialists can carry an idea that later combines with others, like the stepping stones of an archive. At the end of the run, GEPA returns the candidate with the best average score on its Pareto set (Agrawal et al., 2025, Algorithm 1). So in this table P5 would be the final answer, although it is never a parent.

> [!example] Exercise 1: expected score with a constraint
> A support agent gets two kinds of tickets. Billing tickets are 70% of traffic and technical tickets are 30%. Three prompt versions have these pass rates and costs. The constraint is a cost of at most USD 0.05 per ticket.
>
> - Q1: billing 0.80, technical 0.40, cost USD 0.03.
> - Q2: billing 0.60, technical 0.90, cost USD 0.06.
> - Q3: billing 0.75, technical 0.55, cost USD 0.04.
>
> Compute $J$ for each version, find the feasible set and the best feasible version. Then repeat with a 50/50 traffic mix.

```check
{
  "question": "Solve Exercise 1. Which version is best with the 70/30 mix, and which with the 50/50 mix?",
  "hint": "$J = 0.7 \\times \\text{billing} + 0.3 \\times \\text{technical}$. Remove Q2 first, because it costs too much.",
  "answer": "70/30 mix: Q1 gives $0.56 + 0.12 = 0.68$. Q2 gives $0.42 + 0.27 = 0.69$. Q3 gives $0.525 + 0.165 = 0.69$. Q2 costs USD 0.06, so it is not feasible. The feasible set is Q1 and Q3, and Q3 wins with 0.69.\n\n50/50 mix: Q1 gives 0.60, Q3 gives 0.65, and Q2 gives 0.75 but is still not feasible. Q3 wins again, now by 0.05.\n\nNote the size of the gap. With the 70/30 mix, Q3 beats Q1 by only 0.01. An estimate from a few hundred tickets has more noise than that, as L3 shows."
}
```

## 5. Graphs

The landscape of section 4.3. Greedy hill climbing with one-step neighbors stops on the hill where it starts.

```plot
{
  "title": "Landscape f(x) in blue. Hill climbing from x = 1 stops at the local optimum x = 2 (red). From x = 5 it reaches the global optimum x = 7 (gold).",
  "xAxis": {"domain": [0, 10], "label": "version x"},
  "yAxis": {"domain": [0, 6], "label": "objective f(x)"},
  "disableZoom": true,
  "data": [
    {"fn": "3*exp(-(x-2)^2/1.5) + 5*exp(-(x-7)^2/2)", "color": "#1E6091"},
    {"points": [[1, 1.54], [2, 3.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[1, 1.54], [2, 3.0]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true},
    {"points": [[5, 0.684], [6, 3.033], [7, 5.0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[5, 0.684], [6, 3.033], [7, 5.0]], "fnType": "points", "graphType": "scatter", "color": "#B8860B", "skipTip": true}
  ]
}
```

The five versions of section 4.6. The Pareto front is A, B and D. The dominated versions C and E lie below and to the right of B.

```plot
{
  "title": "Pareto front A, B, D in blue. Dominated versions C and E in red. Up is a higher score, left is a lower cost.",
  "xAxis": {"domain": [0, 7], "label": "cost per task (USD)"},
  "yAxis": {"domain": [0.3, 0.6], "label": "score"},
  "disableZoom": true,
  "data": [
    {"points": [[1.0, 0.40], [2.5, 0.50], [6.0, 0.55]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[1.0, 0.40], [2.5, 0.50], [6.0, 0.55]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true},
    {"points": [[3.0, 0.45]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[3.0, 0.45], [4.0, 0.50]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true}
  ]
}
```

## 6. Video and animation

- [Ken Stanley's talk on Why Greatness Cannot Be Planned](https://www.youtube.com/watch?v=VDuF4onPmuE) (Kenneth Stanley). It argues that direct pursuit of an objective often fails and that stepping stones lead further. Watch it with section 4.3 on local optima.
- [Beating RL With Reflection: GEPA and Optimize Anything](https://www.youtube.com/watch?v=OA-Mc60Rboo) (AI Engineer, Lakshya A. Agrawal). The GEPA lead author explains the Pareto pool of candidates. Watch it with section 4.6.

## 7. Code

A short Python check of the two computations of this lesson. It uses only the standard library.

```python
def sica_utility(score, cost_usd, time_s, timed_out=False):
    u = (0.5 * score
         + 0.25 * (1 - min(1, cost_usd / 10))
         + 0.25 * (1 - min(1, time_s / 300)))
    return u * 0.5 if timed_out else u

def pareto_front(versions):
    # versions: dict name -> (score, cost); higher score and lower cost are better
    def dominates(a, b):
        return (a[0] >= b[0] and a[1] <= b[1]) and (a[0] > b[0] or a[1] < b[1])
    return [n for n, v in versions.items()
            if not any(dominates(w, v) for m, w in versions.items() if m != n)]

print(round(sica_utility(0.53, 2.20, 117.1), 4))   # 0.6124
print(pareto_front({"A": (0.40, 1.0), "B": (0.50, 2.5), "C": (0.45, 3.0),
                    "D": (0.55, 6.0), "E": (0.50, 4.0)}))   # ['A', 'B', 'D']
```

## 8. Common mistakes

1. **"The objective is the benchmark score."** The benchmark score is an estimate $\hat{J}_n$ of the objective on one sample of tasks. The objective is an expectation over the tasks that matter.
2. **"A local optimum is a property of the problem."** It depends on the neighbor rule, which the proposer defines. A proposer with bigger changes can escape it.
3. **"A large search space makes improvement impossible."** Size alone says little. A good proposer samples from the small useful part.
4. **"A weighted sum is neutral."** The mixing coefficients are prices. In SICA's formula, "solve everything at the cost cap" and "give up at once" both get 0.5.
5. **"The best average is always the best parent."** GEPA's parent rule ignores a candidate that is best on no single task. Its average does not matter.
6. **"Constraints are details."** In section 4.3, removing the cost constraint changed the answer from P3 to P2.

## 9. One-minute explanation

An improvement problem is "choose $s$ in the feasible set $F$ to maximize $J(s)$", with versions that can change, a score and limits. The objective $J$ is an average score over the tasks that matter, and a benchmark only estimates it from a sample. Prompt and program spaces are astronomically large and have no gradient, so the improver proposes a few candidates and scores them. Hills in the score create local optima, where a greedy search stops. Several objectives need a trade-off: fixed prices in a weighted sum, as in SICA, or a Pareto front, as in GEPA's parent rule. Each choice of tasks, prices and limits changes which version counts as best.

## 10. Check questions

```check
{
  "question": "Why is a local optimum not a property of the search space alone? Give an example from section 4.3.",
  "hint": "What decides which versions count as neighbors?",
  "answer": "A local optimum is a version that beats all its neighbors. The proposer defines the neighbors. In section 4.3, with one-step neighbors, $x = 2$ is a local optimum because $f(1)$ and $f(3)$ are lower than $f(2) = 3.0$. A proposer that can jump 5 positions reaches $x = 7$ from $x = 2$, so $x = 2$ is no longer a trap. The same space gives different local optima for different proposers."
}
```

```check
{
  "question": "Compute the SICA utility for a version with score 0.40, cost USD 3.00 per problem and time 150 s per problem. Then compute it again for a run that timed out with the same numbers.",
  "hint": "Score term is $0.5 \\times 0.40$. Cost term is $0.25 \\times (1 - 3/10)$. Time term is $0.25 \\times (1 - 150/300)$.",
  "answer": "Score term: $0.5 \\times 0.40 = 0.20$. Cost term: $0.25 \\times 0.7 = 0.175$. Time term: $0.25 \\times 0.5 = 0.125$. Sum: $U = 0.50$.\n\nWith a timeout the rule multiplies by $1 - \\tau = 0.5$, so $U_{\\text{final}} = 0.25$."
}
```

```check
{
  "question": "Four versions have a score and a cost in USD. W is (0.70, 5.0). X is (0.60, 2.0). Y is (0.60, 3.0). Z is (0.50, 2.5). Which versions are on the Pareto front? Which version wins the weighted sum score minus 0.05 times cost?",
  "hint": "Check each pair. Higher score and lower cost are better.",
  "answer": "X dominates Y: equal score, lower cost. X dominates Z: higher score and lower cost. Nothing dominates W, because it has the highest score. Nothing dominates X, because it has the lowest cost among versions with score 0.60 or more. The front is $\\{W, X\\}$.\n\nWeighted sum with $\\lambda = 0.05$: W gives $0.70 - 0.25 = 0.45$. X gives $0.60 - 0.10 = 0.50$. Y gives $0.45$. Z gives $0.375$. X wins."
}
```

```check
{
  "question": "A paper reports that a self-improved agent scores 0.62 on a 50-task benchmark subset chosen by the authors. A reader concludes that the objective $J$ of the agent is 0.62. Name two separate reasons why this conclusion is too strong.",
  "hint": "Think about the estimate and about the distribution.",
  "answer": "First, 0.62 is an estimate $\\hat{J}_{50}$ from 50 tasks. It contains sampling noise, so the true value on the same task distribution can differ by many points. L3 computes how many.\n\nSecond, the 50 tasks define their own distribution. If the authors chose them, they may not represent the tasks that matter to the reader. The number then estimates $J$ for a different $\\mathcal{D}$. A third reason is possible: if the version was selected because it scored high on these tasks, the number is biased upward."
}
```

## 11. Summary and links

- An improvement problem is "choose $s \in F$ to maximize $J(s)$", where $F$ is the feasible set defined by constraints.
- Search spaces of prompts and programs are astronomically large, discrete and without gradients. The proposer defines which versions are neighbors.
- Greedy search stops at a local optimum. The start point and the neighbor rule decide which one.
- The objective is an expected score over a task distribution. A benchmark gives only an estimate from a sample.
- Several objectives need a trade-off. A weighted sum fixes prices, and its extreme cases need a check. A Pareto front keeps all non-dominated versions.

Next, lesson L2 asks how a system moves from one version to the next. It writes every improvement method as an update rule and runs six rules by hand.

- Previous: [L4: The improver, meta-levels and the frozen core](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels)
- Next: [L2: Loss, reward and update rules](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules)
- Related: [L3: Evaluation under noise](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise), [2025: SICA, a Self-Improving Coding Agent](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent), [L3: Prompt and instruction optimization](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization)

## References

- Maxime Robeyns, Martin Szummer, Laurence Aitchison. "A Self-Improving Coding Agent". 2025. ICLR 2025 Workshop on Scaling Self-Improving Foundation Models. arXiv:2504.15228. https://arxiv.org/abs/2504.15228. Code: https://github.com/MaximeRobeyns/self_improving_coding_agent
- Lakshya A Agrawal, Shangyin Tan, Dilara Soylu, et al. "GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning". 2025. ICLR 2026. arXiv:2507.19457. https://arxiv.org/abs/2507.19457. Code: https://github.com/gepa-ai/gepa
- Jenny Zhang, Shengran Hu, Cong Lu, Robert Lange, Jeff Clune. "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents". 2025. ICLR 2026. arXiv:2505.22954. https://arxiv.org/abs/2505.22954
- Eric Zelikman, Eliana Lorch, Lester Mackey, Adam Tauman Kalai. "Self-Taught Optimizer (STOP): Recursively Self-Improving Code Generation". 2023. arXiv:2310.02304. https://arxiv.org/abs/2310.02304
