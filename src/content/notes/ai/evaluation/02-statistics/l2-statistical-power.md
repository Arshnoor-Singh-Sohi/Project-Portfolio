---
title: "L2: Statistical power"
order: 2
summary: "How many runs a live test needs, computed before the runs. The zero-failure demonstration n ≥ ln(β)/ln(1−p), the sample size to detect a drop from p1 to p2 between two configurations with the normal approximation and an exact Fisher check, tables for common targets, the cost of the runs, and why looking at the results early breaks the error rates."
status: not-started
tags: [evaluation, statistics, power, sample-size, zero-failure, sequential-testing]
---

## 1. The question this idea answers

[L1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) showed what a result such as 20/20 proves after the runs. This lesson asks the question before the runs: how many runs does the test need?

Two situations appear again and again in an agent service:

- **A release gate.** "Show that the citation feature fails less than 5% of the time."
- **A regression check.** "The new system prompt must not lower the pass rate. Detect a drop from 95% to 80%."

With too few runs, a real regression passes the check unnoticed, and the team ships it with confidence. With too many runs, the team pays for live model calls that add nothing. Power analysis computes the number of runs from the error rates that you accept. Each live run costs tokens and minutes, so this number is also a budget.

## 2. Mental model

> [!analogy] A fishing net and its mesh
> A net with large holes catches only large fish. To catch small fish, you need a finer mesh, and a finer net costs more and is slower to pull. You choose the mesh for the smallest fish that you must catch.
>
> The number of runs is the mesh. The size of the drop that you want to detect is the size of the fish. A small drop, such as 95% to 90%, needs a very fine and expensive net.
>
> **Where it stops working:** a net holds a fish or not. A test holds a real drop only with some probability, the power. A power of 0.80 means that 1 real drop in 5 still escapes. And the power is computed for the drop that you assumed. A smaller real drop escapes more often.

## 3. Terms

| Term | Plain meaning |
|---|---|
| significance level $\alpha$ | The accepted probability of a false alarm: the test reports a difference that does not exist. Usually 0.05. |
| false alarm (type I error) | The test reports a regression, but the pass rates are equal. |
| miss (type II error) | The test reports no regression, but a real drop exists. |
| $\beta$ | The accepted probability of a miss. |
| power | $1 - \beta$: the probability that the test detects a real effect of the assumed size. Usually 0.80 or 0.90. |
| effect size | The size of the change that the test must detect, here $p_1 - p_2$. |
| minimum detectable effect | The smallest effect that the test detects with the chosen power. |
| zero-failure demonstration | A gate that passes only if all $n$ runs pass, sized so that a bad feature rarely passes it. |
| normal approximation | A formula that treats the pass counts as normally distributed. It is fast but not exact for small $n$. |
| exact power | The power computed by summing over every possible outcome, with no approximation. |
| peeking | Reading the results during the runs and stopping when they look significant. |
| sequential design | A plan that allows looks during the runs, with adjusted thresholds that keep $\alpha$ correct. |
| test plan | The written plan with $\alpha$, power, effect size, test and $n$, made before the first run. |

## 4. Method and math

### 4.1 Two errors

A test decides between "no difference" and "a difference". Reality also has two states. So there are two ways to be wrong.

| | Reality: no drop | Reality: a drop of the assumed size |
|---|---|---|
| Test reports a drop | False alarm, probability $\alpha$ | Correct detection, probability $1 - \beta$ (the power) |
| Test reports no drop | Correct | Miss, probability $\beta$ |

You choose $\alpha$, the power and the effect size. The number of runs follows from them. If you fix $n$ first, the power follows instead, and it is often low.

### 4.2 The zero-failure demonstration

The gate: run $n$ times, and pass only if all $n$ runs pass. Choose $n$ so that a feature with a true failure rate $p$ passes the gate with probability at most $\beta$.

A feature with failure rate $p$ passes all $n$ runs with probability $(1-p)^n$. Require:

$$
(1-p)^n \le \beta
\quad\Longrightarrow\quad
n \ln(1-p) \le \ln \beta
\quad\Longrightarrow\quad
n \ge \frac{\ln \beta}{\ln(1-p)}
$$

The inequality changes direction in the last step, because $\ln(1-p)$ is negative.

> [!example] Worked example: show a failure rate below 5%
> Target: a feature with failure rate $p = 0.05$ must pass the gate with probability at most $\beta = 0.05$.
>
> 1. $\ln \beta = \ln 0.05 = -2.995732$.
> 2. $\ln(1-p) = \ln 0.95 = -0.051293$.
> 3. $n \ge -2.995732 / -0.051293 = 58.40$, so $n = 59$.
> 4. Check: $0.95^{59} = 0.0485 \le 0.05$. One run fewer: $0.95^{58} = 0.0510 > 0.05$.
>
> So 59 passes in a row show, with 95% confidence, that the failure rate is below 5%. The rule of three of L1 gives about the same: $3/59 = 0.051$.

| Failure rate $p$ to exclude | $\beta = 0.10$ | $\beta = 0.05$ | $\beta = 0.01$ |
|---|---|---|---|
| 0.20 | 11 | 14 | 21 |
| 0.10 | 22 | 29 | 44 |
| 0.05 | 45 | 59 | 90 |
| 0.02 | 114 | 149 | 228 |
| 0.01 | 230 | 299 | 459 |
| 0.001 | 2,302 | 2,995 | 4,603 |

The table shows the main lesson of this section: $n$ grows like $1/p$. Each factor of 10 in the failure rate costs a factor of about 10 in runs.

A gate can allow a few failures. Allow at most $c$ failures, and find the smallest $n$ with $P(\text{at most } c \text{ failures}) \le \beta$. For $p = 0.05$ and $\beta = 0.05$, the test for this lesson found $n = 59$ for $c = 0$, $n = 93$ for $c = 1$ and $n = 124$ for $c = 2$ (with `scipy.stats.binom.cdf`). A gate with one allowed failure costs 34 more runs, but one unlucky run does not block a good feature.

The same formula answers a related question: how likely is a test to show at least one failure? That probability is $1 - (1-p)^n$. Take a bug that fails 1 run in 10. It appears in 3 runs with probability $1 - 0.9^3 = 0.271$, in 10 runs with 0.651, and in 29 runs with 0.953.

```plot
{
  "title": "Chance to see at least one failure in n runs: failure rate 0.10 (red), 0.05 (blue), 0.01 (gold), level 0.95 (purple)",
  "xAxis": { "label": "number of runs n", "domain": [1, 100] },
  "yAxis": { "label": "P(at least one failure)", "domain": [0, 1] },
  "disableZoom": true,
  "data": [
    { "fn": "1-0.9^x", "color": "#C81D25" },
    { "fn": "1-0.95^x", "color": "#1E6091" },
    { "fn": "1-0.99^x", "color": "#B8860B" },
    { "fn": "0.95", "color": "#6A4C93", "skipTip": true }
  ]
}
```

### 4.3 Detecting a drop between two configurations

Configuration A has pass rate $p_1$. You must detect if B has the lower rate $p_2$. Each configuration runs $n$ times, and the analysis is a two-sided test at level $\alpha$. The normal approximation gives:

$$
n = \frac{\left(z_{1-\alpha/2}\sqrt{2\bar p(1-\bar p)} + z_{1-\beta}\sqrt{p_1(1-p_1) + p_2(1-p_2)}\right)^2}{(p_1 - p_2)^2},
\qquad \bar p = \frac{p_1 + p_2}{2}
$$

Here $z_q$ is the $q$ quantile of the standard normal distribution.

> [!example] Worked example: detect a drop from 0.95 to 0.80
> $\alpha = 0.05$ two-sided, power 0.80.
>
> 1. $z_{0.975} = 1.959964$ and $z_{0.80} = 0.841621$.
> 2. $\bar p = (0.95 + 0.80)/2 = 0.875$. $\sqrt{2 \times 0.875 \times 0.125} = \sqrt{0.21875} = 0.467707$.
> 3. $p_1(1-p_1) + p_2(1-p_2) = 0.0475 + 0.16 = 0.2075$. $\sqrt{0.2075} = 0.455522$.
> 4. Numerator: $(1.959964 \times 0.467707 + 0.841621 \times 0.455522)^2 = (0.916689 + 0.383377)^2 = 1.300066^2 = 1.690171$.
> 5. Denominator: $(0.95 - 0.80)^2 = 0.0225$.
> 6. $n = 1.690171 / 0.0225 = 75.12$, so 76 runs per configuration, 152 in total.

statsmodels has a related method: `NormalIndPower().solve_power` with the effect size `proportion_effectsize(0.95, 0.80)`. It uses an arcsine transform (Cohen's $h = 0.4763$) and gives 69.2 runs. The two formulas are different approximations. For small $n$ and rates near 1, check the result exactly.

### 4.4 The exact check

The real analysis uses an exact test, such as Fisher's. Its power at a given $n$ can be computed with no approximation. Sum over every possible pair of pass counts $(a, b)$:

$$
\text{power}(n) = \sum_{a=0}^{n}\sum_{b=0}^{n} \binom{n}{a}p_1^a(1-p_1)^{n-a}\binom{n}{b}p_2^b(1-p_2)^{n-b}\cdot \mathbf{1}\left[\text{Fisher p-value}(a, b) \le \alpha\right]
$$

The test for this lesson computed this sum with `scipy.stats.fisher_exact` (two-sided, scipy 1.18.1).

| $n$ per configuration | Exact Fisher power for 0.95 vs 0.80 |
|---|---|
| 76 (normal approximation) | 0.7667 |
| 80 | 0.7932 |
| 81 | 0.7993 |
| 82 | 0.8053 |
| 90 | 0.8475 |

So the normal approximation is too optimistic here: at 76 runs, the real power is 0.767, not 0.80. A simulation of 20,000 experiments at $n = 76$ gave 0.7647 with a standard error of 0.0030, which agrees with the exact sum. The smallest $n$ that reaches 0.80 is 82.

Why the gap? Fisher's test is conservative: its real false alarm rate is below $\alpha$. In a simulation with both pass rates at 0.90 and 100 runs each, it raised a false alarm in 3.0% of experiments, not 5%. A conservative test needs more runs for the same power.

```plot
{
  "title": "Power to detect 0.95 vs 0.80 (two-sided, alpha 0.05): exact Fisher test (red), normal approximation (blue), target 0.80 (gold)",
  "xAxis": { "label": "runs per configuration n", "domain": [0, 135] },
  "yAxis": { "label": "power", "domain": [0, 1] },
  "disableZoom": true,
  "data": [
    { "points": [[10, 0.0199], [20, 0.1676], [30, 0.2409], [40, 0.4114], [50, 0.5083], [60, 0.6268], [70, 0.7219], [80, 0.7932], [90, 0.8475], [100, 0.8825], [110, 0.9144], [120, 0.9347], [130, 0.9541]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[10, 0.1658], [20, 0.2947], [30, 0.4173], [40, 0.528], [50, 0.624], [60, 0.7048], [70, 0.7712], [80, 0.8246], [90, 0.8668], [100, 0.8998], [110, 0.9252], [120, 0.9446], [130, 0.9593]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "fn": "0.8", "color": "#B8860B", "skipTip": true }
  ]
}
```

> [!trap] Exact power is not smooth in n
> Pass counts are whole numbers, so the exact power can drop slightly when $n$ grows by one. Report the $n$ that you found and its power, and do not assume that every larger $n$ is better by the same amount.

### 4.5 Runs per configuration for common targets

All rows: two-sided test, $\alpha = 0.05$. The exact column is the smallest $n$ with Fisher power at least 0.80, found by an upward search.

| $p_1 \to p_2$ | Normal approx., power 0.80 | Normal approx., power 0.90 | Exact Fisher, power 0.80 |
|---|---|---|---|
| 0.90 → 0.70 | 62 | 82 | 69 |
| 0.95 → 0.80 | 76 | 101 | 82 |
| 0.95 → 0.85 | 141 | 188 | 151 |
| 0.90 → 0.80 | 199 | 266 | 214 |
| 0.99 → 0.95 | 285 | 381 | 302 |
| 0.95 → 0.90 | 435 | 582 | 466 |

> [!key] Decide the smallest drop that matters, then compute n
> The effect size drives the cost. Detecting 0.95 → 0.80 needs 82 runs per configuration. Detecting 0.95 → 0.90 needs 466. If a 5-point drop truly matters, pay for the runs. If it does not, test for the drop that does. Never run "a few" and call the result "no regression".

### 4.6 The cost of the runs

Use the cost from [Part 1, L1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model): USD 0.34 per run. That run makes 4 model calls of 40,000 input and 500 output tokens each. The price is the Claude Sonnet 5 list price: USD 2 and USD 10 per million tokens (checked on 2026-10-13). Assume 60 seconds per run.

| Plan | Runs | Cost | Time, one at a time | Time, 10 in parallel |
|---|---|---|---|---|
| Quick check | 20 | USD 6.80 | 20 min | 2 min |
| Gate: failure rate below 5% | 59 | USD 20.06 | 59 min | 6 min |
| Detect 0.95 → 0.80, exact | 2 × 82 = 164 | USD 55.76 | 2.7 h | 16 min |
| Gate: failure rate below 1% | 299 | USD 101.66 | 5.0 h | 30 min |

Parallel runs need enough rate limit headroom. Overload errors during a batch also change the conditions of the runs ([L1, section 4.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals)).

Four ways to spend less, without weaker conclusions:

1. Move every claim about input to fake tests ([Part 1, L1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model)). They cost nothing.
2. Test the smallest component that shows the behavior, with a short prompt and few tool calls.
3. Use prompt caching for the shared prefix of all runs.
4. Choose the effect size from the product need, not from habit.

### 4.7 Sequential testing: the danger of peeking

A team runs a comparison and reads the p-value after every batch. It stops as soon as $p \le 0.05$. This feels efficient, but each look is another chance for a false alarm.

The test for this lesson simulated it. Both configurations had the same true pass rate, 0.90, so every alarm was false. Each simulated experiment ran up to 100 runs per configuration and stopped at the first look with Fisher $p \le 0.05$. There were 20,000 experiments per plan.

| Plan | False alarm rate | Standard error |
|---|---|---|
| One look, after 100 runs | 0.030 | 0.0012 |
| A look after every 10 runs | 0.077 | 0.0019 |
| A look after every run, from run 5 | 0.103 | 0.0021 |

With a look after every run, the false alarm rate is more than 3 times that of the single look, and twice the nominal 0.05.

The same problem hits a zero-failure gate. A team runs the 59-run gate, sees a failure, and starts again. A feature with a true failure rate of 0.05 passes one attempt with probability $0.95^{59} = 0.0485$. With up to 3 attempts, it passes with $1 - (1 - 0.0485)^3 = 0.139$. With 10 attempts: 0.392. The gate promised 0.05.

> [!trap] "Run until it passes" is not a test
> Every restart and every early look raises the false alarm rate. Methods that allow looks during the runs exist: group sequential designs (Pocock 1977, O'Brien and Fleming 1979) and Wald's sequential probability ratio test (1945). They use stricter thresholds at each look, and they must be in the test plan before the first run. Without such a plan, fix $n$, run it, and analyze once.

### 4.8 Production view

| Concern | What to do |
|---|---|
| Planning | Write the test plan first: $\alpha$, power, smallest drop that matters, test, $n$. |
| Accuracy | Check the normal approximation with exact power for rates near 1 and small $n$. |
| Cost | Price the plan in tokens and minutes before you run it. Move input claims to fake tests. |
| Gates | Size zero-failure gates with $\ln \beta / \ln(1-p)$. Allow a few failures if one bad run must not block a release. |
| Integrity | No restarts and no early stops outside a planned sequential design. Report every attempt. |
| Reporting | Report the planned $n$, the actual $n$, the result with its interval, and the power for the assumed drop. |

## 5. Code

These exercises go in `evaluation/05-power.ipynb` in the lab folder `C:\Users\ASohi\Downloads\AI\agent-harness-lab`. They need no API key.

**Exercise 2.1: the zero-failure gate.** Write `n_zero_failure(p, beta)` and `n_gate(p, beta, c)` for a gate that allows at most `c` failures.

Acceptance tests:

- `n_zero_failure` reproduces every cell of the table in section 4.2.
- For each result, $(1-p)^n \le \beta < (1-p)^{n-1}$.
- `n_gate(0.05, 0.05, 1)` is 93 and `n_gate(0.05, 0.05, 2)` is 124.

**Exercise 2.2: the normal approximation.** Write `n_two_sample(p1, p2, alpha=0.05, power=0.8)` with the formula of section 4.3.

Acceptance tests:

- It returns 75.12 for 0.95 and 0.80, before the result is rounded to the next whole number.
- It reproduces both normal columns of the table in section 4.5.

**Exercise 2.3: exact power.** Write `exact_power(p1, p2, n, alpha=0.05)` with the double sum of section 4.4. Cache the Fisher p-values, because many pairs repeat.

Acceptance tests:

- `exact_power(0.95, 0.80, 76)` is 0.7667 when rounded to 4 places.
- An upward search from 76 returns 82 for a target of 0.80.
- A simulation of 20,000 experiments at $n = 76$ agrees with the exact value within 3 standard errors.

**Exercise 2.4: the cost of peeking.** Simulate the three plans of section 4.7 with a fixed seed.

Acceptance tests:

- The single-look plan gives a false alarm rate below 0.05.
- The plan with a look after every run gives a rate above 0.08.
- Each reported rate comes with its standard error.

## 6. Common mistakes

1. **Choosing n by habit.** Twenty runs detect only large drops. Compute $n$ from the drop that matters.
2. **"No significant difference" as proof of no regression.** With low power, a real drop often gives no significant result.
3. **Trusting the normal approximation near 1.** At 76 runs, the exact power for 0.95 vs 0.80 is 0.767, not 0.80.
4. **Restarting a gate after a failure.** With three attempts at a 59-run gate, a feature with a 5% failure rate passes 13.9% of the time.
5. **Stopping when the p-value first looks good.** Looks after every run raised the false alarm rate to 0.103 in the simulation.
6. **Forgetting the cost.** Price the plan before the runs, and move input claims to fake tests.

## 7. One-minute explanation

Power analysis tells you how many runs a live test needs before you run it. You choose the false alarm rate $\alpha$, the power $1 - \beta$ and the smallest effect that matters. The number of runs follows from them. In a release gate where all runs must pass, a feature with failure rate $p$ passes with probability $(1-p)^n$. So you need $n \ge \ln \beta / \ln(1 - p)$: 59 runs for a failure rate below 5% with 95% confidence, and 299 for 1%. To detect a drop from 0.95 to 0.80, the normal approximation gives 76 runs per configuration. But the exact power of Fisher's test at 76 runs is only 0.767, and 82 runs are needed. Smaller drops cost much more: 0.95 to 0.90 needs 466 runs per configuration. So price the plan in tokens and time, and move input claims to free fake tests. Finally, fix $n$ in advance, because early looks and restarted gates raise the false alarm rate far above the plan.

## 8. Check questions

```check
{
  "question": "How many runs with zero failures does a gate need to show a failure rate below 2% with 95% confidence? Show the computation.",
  "hint": "n ≥ ln(β) / ln(1 − p) with β = 0.05 and p = 0.02.",
  "answer": "ln(0.05) = −2.9957 and ln(0.98) = −0.020203. n ≥ −2.9957 / −0.020203 = 148.3, so n = 149. Check: 0.98^149 = 0.0493 ≤ 0.05, and 0.98^148 = 0.0503 > 0.05. The rule of three gives about 3/0.02 = 150."
}
```

```check
{
  "question": "A team compares two prompts with 20 runs each and finds no significant difference. Why is this weak evidence that the new prompt does not regress from 0.95 to 0.80?",
  "answer": "The power is low. Exact Fisher power for 0.95 vs 0.80 at 20 runs per configuration is only about 0.17, so a real drop of that size gives no significant result most of the time. To detect it with power 0.80 you need about 82 runs per configuration. \"No significant difference\" from an underpowered test does not show \"no difference\"."
}
```

```check
{
  "question": "The normal approximation says 76 runs per configuration for 0.95 vs 0.80 at power 0.80. Why does the exact Fisher computation need 82?",
  "answer": "The approximation treats the counts as continuous and normal, which is poor for small n and rates near 1. Fisher's exact test is also conservative: its real false alarm rate is below 0.05 (0.030 in the simulation), so it detects fewer real drops. At 76 runs, its exact power is 0.767. The first n with power of at least 0.80 is 82."
}
```

```check
{
  "question": "A 29-run zero-failure gate is planned for a failure rate of 10% at β = 0.05. After a failure, the team reruns the gate, up to 3 attempts. What is the real chance that a feature with a 10% failure rate passes?",
  "answer": "One attempt passes with 0.9^29 = 0.0471. With up to 3 attempts, the chance of at least one pass is 1 − (1 − 0.0471)^3 = 0.135. So the real miss rate is about 13.5%, almost three times the planned 5%."
}
```

## 9. Links

- Previous: [L1: Pass rates and confidence intervals](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals)
- Free tests for input claims: [Fake model vs real model](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model)
- Lower the chance pass first: [Random data, controls and strict scoring](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring)
- Cheaper runs: [Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)
- [Glossary](/notes/ai/evaluation/glossary)
