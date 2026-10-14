---
title: "L1: Pass rates and confidence intervals"
order: 1
summary: "Repeated runs of a live test follow the binomial model. The Wilson and Clopper-Pearson 95% intervals for 3/3, 18/20, 20/20 and 0/20, the rule of three, what each result supports and does not support, and how to compare two configurations with an exact test instead of overlapping intervals. Every number was computed with scipy and statsmodels."
status: not-started
tags: [evaluation, statistics, binomial, confidence-interval, wilson, clopper-pearson, rule-of-three]
---

## 1. The question this idea answers

A live test of an agent ran several times. Three reports arrive:

- "The new resume logic passed 3 of 3 runs."
- "The Genie answer test passed 18 of 20 runs."
- "The citation test passed 20 of 20 runs."

What do these numbers prove? Can you ship? Is 20/20 better than 18/20? Teams decide releases on numbers like these, often with no idea of their uncertainty.

The model output varies between runs ([L1.1, section 4.7](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model)). So each run is a random trial, and the pass count is a random number. This lesson gives the model for that number, the interval that shows its uncertainty, and the right way to compare two configurations.

## 2. Mental model

> [!analogy] Spoonfuls from a large pot of soup
> You taste a large pot of soup with a spoon. Each spoonful is salty or not. Three salty spoonfuls tell you that the pot is often salty, but they cannot tell you "always". Twenty salty spoonfuls tell you much more, but still not "every part of the pot". The more spoonfuls you taste, the narrower the range of "how salty the pot can be".
>
> The pot is the true pass rate of the feature. Each spoonful is one run. The range is the confidence interval.
>
> **Where it stops working:** the soup pot does not change while you taste. A model's pass rate can change: a new model version, a new prompt, a different kind of question. The interval is valid only for the conditions that you tested. And the spoonfuls must be independent: if each run reuses a cached answer from the run before, twenty runs are really one.

## 3. Terms

| Term | Plain meaning |
|---|---|
| true pass rate $p$ | The probability that one run passes, under fixed conditions. You never observe it directly. |
| observed pass rate $\hat p$ | The passes divided by the runs: $k/n$. |
| independent runs | Runs where the result of one run does not change the chance of another. |
| binomial distribution | The distribution of the number of passes $k$ in $n$ independent runs with the same $p$. |
| confidence interval | A range computed from $k$ and $n$ by a rule that contains the true $p$ in about 95% of repeated experiments. |
| coverage | The real share of experiments in which an interval rule contains the true $p$. |
| Wald interval | The simple interval $\hat p \pm 1.96\sqrt{\hat p(1-\hat p)/n}$. It fails near 0 and 1. |
| Wilson interval | A score interval with good coverage for small $n$. It never has zero width. |
| Clopper-Pearson interval | The "exact" interval from binomial tail probabilities. Its coverage is at least 95%. |
| one-sided bound | A single limit, for example "the failure rate is below 0.139 with 95% confidence". |
| rule of three | With 0 failures in $n$ runs, $3/n$ is about the one-sided 95% upper bound on the failure rate. |
| Fisher's exact test | A test of whether two pass rates differ, exact for small counts. |
| p-value | The probability of a difference at least this large if the two true pass rates were equal. |

## 4. Method and math

### 4.1 The binomial model

Assume three things: each run passes with the same probability $p$, the runs are independent, and the scorer is correct ([L1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit)). Then the number of passes $K$ in $n$ runs has the binomial distribution:

$$
P(K = k) = \binom{n}{k} p^k (1-p)^{n-k}
$$

The probability that all $n$ runs pass is $p^n$. This one formula already shows the problem.

> [!example] Worked example: 20/20 is common for a feature that fails 1 time in 10
> Assume the true pass rate is $p = 0.9$, so the feature fails 10% of the time.
>
> 1. $P(K = 20) = 0.9^{20} = 0.1216$. So about 1 test in 8 shows a perfect 20/20.
> 2. $P(K \ge 18) = 0.6769$ (computed with `scipy.stats.binom.sf(17, 20, 0.9)`).
> 3. For $p = 0.85$: $P(K = 20) = 0.85^{20} = 0.0388$.
> 4. For 3 runs and $p = 0.5$: $P(K = 3) = 0.5^3 = 0.125$. For $p = 0.7$: $0.343$.
>
> So 3/3 is a common result for a feature that works only half the time.

```plot
{
  "title": "Probability that all n runs pass, as a function of the true pass rate: n = 3 (red), n = 20 (blue), level 0.025 (gold)",
  "xAxis": { "label": "true pass rate p", "domain": [0, 1] },
  "yAxis": { "label": "P(all n runs pass)", "domain": [0, 1] },
  "disableZoom": true,
  "data": [
    { "fn": "x^3", "color": "#C81D25" },
    { "fn": "x^20", "color": "#1E6091" },
    { "fn": "0.025", "color": "#B8860B", "skipTip": true }
  ]
}
```

The gold line marks 0.025. The red curve crosses it at $p = 0.292$, and the blue curve at $p = 0.832$. These crossings are the lower limits of the Clopper-Pearson interval in section 4.4.

> [!trap] The assumptions break in agent tests
> Runs are not independent if they share state: a session file, a cache, a database row from an earlier run. The pass rate is not constant if the runs spread over a model update or a period of overload errors. And 20 runs of one prompt measure that prompt only, not "Genie questions" in general. Use a fresh state for each run, run the batch in a short window, and say which prompts the rate covers.

### 4.2 Why the simple interval fails

The Wald interval is $\hat p \pm z\sqrt{\hat p(1-\hat p)/n}$, with $z = 1.95996$ for 95%. For 20/20, $\hat p = 1$, so $\hat p(1 - \hat p) = 0$, and the interval is $[1, 1]$. It claims certainty after 20 runs. For 18/20 the formula gives $[0.769, 1.031]$, an upper limit above 1. statsmodels clips it to 1.

The coverage of the Wald interval is also poor near 1. The test for this lesson summed the binomial probabilities for $n = 20$ over all outcomes (statsmodels 0.15.0):

| True $p$ | Wald coverage | Wilson coverage | Clopper-Pearson coverage |
|---|---|---|---|
| 0.80 | 0.921 | 0.956 | 0.979 |
| 0.90 | 0.876 | 0.957 | 0.989 |
| 0.95 | 0.639 | 0.925 | 0.984 |
| 0.99 | 0.182 | 0.983 | 0.983 |

Over the grid $p = 0.01, 0.02, \dots, 0.99$, the lowest coverage was 0.182 for Wald, 0.925 for Wilson and 0.959 for Clopper-Pearson.

> [!trap] The statsmodels default is the Wald interval
> The signature in statsmodels 0.15.0 is `proportion_confint(count, nobs, alpha=0.05, method='normal', alternative='two-sided')` (checked on 2026-10-13). `method='normal'` is the Wald interval. So `proportion_confint(20, 20)` returns `(1.0, 1.0)`. Always pass `method="wilson"` or `method="beta"`. In scipy 1.18.1, `binomtest(k, n).proportion_ci()` defaults to `method='exact'`, which is Clopper-Pearson.

### 4.3 The Wilson interval

The Wilson interval comes from E. B. Wilson (1927, Journal of the American Statistical Association). With $z = 1.95996$:

$$
\text{center} = \frac{\hat p + \frac{z^2}{2n}}{1 + \frac{z^2}{n}}, \qquad
\text{half-width} = \frac{z}{1 + \frac{z^2}{n}} \sqrt{\frac{\hat p(1-\hat p)}{n} + \frac{z^2}{4n^2}}
$$

The center moves from $\hat p$ toward 0.5. The term $z^2/(4n^2)$ keeps the width above zero, also at $\hat p = 1$.

> [!example] Worked example: the Wilson interval for 18/20
> $\hat p = 0.9$, $n = 20$, $z^2 = 3.841459$.
>
> 1. $z^2/(2n) = 3.841459/40 = 0.096036$.
> 2. $1 + z^2/n = 1 + 0.192073 = 1.192073$.
> 3. Center: $(0.9 + 0.096036)/1.192073 = 0.996036/1.192073 = 0.835550$.
> 4. $\hat p(1-\hat p)/n = 0.9 \times 0.1/20 = 0.0045$.
> 5. $z^2/(4n^2) = 3.841459/1600 = 0.002401$.
> 6. $\sqrt{0.0045 + 0.002401} = \sqrt{0.006901} = 0.083072$.
> 7. Half-width: $1.95996 \times 0.083072 / 1.192073 = 0.162818/1.192073 = 0.136584$.
> 8. Interval: $[0.835550 - 0.136584,\ 0.835550 + 0.136584] = [0.6990, 0.9721]$.
>
> `proportion_confint(18, 20, method="wilson")` returns the same values.

When all runs pass, $\hat p = 1$, and the formula simplifies. The lower limit is $n/(n + z^2)$. For $n = 20$: $20/23.8415 = 0.8389$.

### 4.4 The Clopper-Pearson interval

Clopper and Pearson (1934, Biometrika) built the interval from the binomial tails. The lower limit is the $p$ where seeing $k$ or more passes has probability 2.5%. The upper limit is the $p$ where seeing $k$ or fewer has probability 2.5%. Both have a closed form with Beta quantiles:

$$
p_{\text{low}} = B\!\left(0.025;\ k,\ n-k+1\right), \qquad p_{\text{high}} = B\!\left(0.975;\ k+1,\ n-k\right)
$$

For 18/20: `scipy.stats.beta.ppf(0.025, 18, 3)` = 0.6830 and `beta.ppf(0.975, 19, 2)` = 0.9877.

When all runs pass, the lower limit solves $p^n = 0.025$, so $p_{\text{low}} = 0.025^{1/n}$. For $n = 3$: $0.025^{1/3} = 0.2924$. For $n = 20$: $0.025^{1/20} = 0.8316$. These are the gold-line crossings of the plot in section 4.1.

Clopper-Pearson guarantees coverage of at least 95% for every $p$. The price is width: it is wider than needed on average. The NIST Dataplot reference summarizes Brown, Cai and DasGupta (2001, Statistical Science): "Specifically, they recommend the Wilson and Jeffreys methods for *n* ≤ 40." Use Wilson for reporting. Use Clopper-Pearson when you need a guarantee, for example for a release gate.

### 4.5 The four results

All values were computed with statsmodels 0.15.0 and checked with scipy 1.18.1.

| Result | $\hat p$ | Wald | Wilson 95% | Clopper-Pearson 95% |
|---|---|---|---|---|
| 3/3 | 1.000 | [1.000, 1.000] | [0.4385, 1.0000] | [0.2924, 1.0000] |
| 18/20 | 0.900 | [0.7685, 1.0000] | [0.6990, 0.9721] | [0.6830, 0.9877] |
| 20/20 | 1.000 | [1.000, 1.000] | [0.8389, 1.0000] | [0.8316, 1.0000] |
| 0/20 | 0.000 | [0.000, 0.000] | [0.0000, 0.1611] | [0.0000, 0.1684] |

```plot
{
  "title": "95% intervals at x = 1 (3/3), 2 (18/20), 3 (20/20), 4 (0/20): Wilson (blue, left), Clopper-Pearson (red, right), observed rate (ink)",
  "xAxis": { "label": "result", "domain": [0.5, 4.5] },
  "yAxis": { "label": "pass rate", "domain": [0, 1.05] },
  "disableZoom": true,
  "data": [
    { "points": [[0.9, 0.4385], [0.9, 1.0]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[1.1, 0.2924], [1.1, 1.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[1.9, 0.6990], [1.9, 0.9721]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[2.1, 0.6830], [2.1, 0.9877]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[2.9, 0.8389], [2.9, 1.0]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[3.1, 0.8316], [3.1, 1.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[3.9, 0.0], [3.9, 0.1611]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[4.1, 0.0], [4.1, 0.1684]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 1.0], [2, 0.9], [3, 1.0], [4, 0.0]], "fnType": "points", "graphType": "scatter", "color": "#100D12" }
  ]
}
```

### 4.6 One-sided bounds and the rule of three

Often the question is one-sided: "How high can the failure rate be?" With 0 failures in $n$ runs, the one-sided 95% upper bound $f$ on the failure rate solves $(1-f)^n = 0.05$:

$$
f = 1 - 0.05^{1/n}
$$

Take logarithms: $n \ln(1-f) = \ln 0.05 = -2.996$. For small $f$, $\ln(1 - f) \approx -f$. So $f \approx 2.996/n \approx 3/n$. This is the **rule of three**, from Hanley and Lippman-Hand, "If nothing goes wrong, is everything all right? Interpreting zero numerators" (JAMA, 1983, vol. 249, no. 13, pp. 1743–1745).

| Runs $n$, all pass | Exact bound $1 - 0.05^{1/n}$ | Rule of three $3/n$ |
|---|---|---|
| 3 | 0.632 | 1.000 (useless) |
| 20 | 0.139 | 0.150 |
| 60 | 0.0487 | 0.0500 |
| 100 | 0.0295 | 0.0300 |
| 300 | 0.00994 | 0.0100 |

> [!trap] Three different "lower limits" for 20/20
> The two-sided Clopper-Pearson lower limit is 0.832. The one-sided 95% lower limit is $0.05^{1/20} = 0.861$. The rule of three gives $1 - 0.15 = 0.85$. All three are correct answers to different questions. Record which one you report, and use the one-sided bound only for a one-sided question that you chose before the runs.

### 4.7 What each result supports

| Result | Supports | Does not support |
|---|---|---|
| 3/3 | The feature can work. The pass rate is probably above 0.29 (Clopper-Pearson) or 0.44 (Wilson). | "It works." A pass rate of 0.5 gives 3/3 in 12.5% of tests. |
| 18/20 | The feature fails sometimes: two real failures show that $p < 1$, if the scorer is correct. The pass rate is probably between 0.70 and 0.97. | "90% reliable" as a precise number. |
| 20/20 | The failure rate is probably below about 14% (one-sided) to 17% (two-sided Clopper-Pearson). | "It never fails" or "it fails less than 1%". That needs about 300 runs with no failure. |
| 0/20 | The pass rate is probably below about 16%. For a negative control, no leak is common. | "The chance pass rate is tiny". Compute that from the nonce, as in [L1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring). |

> [!key] Report k/n with an interval, never a bare percentage
> "18/20, Wilson 95% interval [0.70, 0.97]" carries the evidence. "90%" hides it. A failure in a live test is information about the feature: read its transcript before you add more runs.

### 4.8 Comparing two configurations

Configuration A is the current system prompt, B is a new one. A passed 20/20, B passed 18/20. Is B worse?

Two common answers are wrong. "100% beats 90%" ignores the uncertainty. "The intervals overlap, so there is no difference" uses the wrong tool. Two intervals can overlap while the difference is still significant. For example, the Wilson intervals of 19/20 [0.764, 0.991] and 12/20 [0.387, 0.781] overlap, but Fisher's test gives p = 0.020 (third row below). The right tool is a test on the difference, or an interval for the difference.

| A | B | Difference | Fisher p | Boschloo p | 95% interval of the difference (Newcombe) |
|---|---|---|---|---|---|
| 20/20 | 18/20 | 0.100 | 0.487 | 0.282 | [−0.077, 0.301] |
| 20/20 | 16/20 | 0.200 | 0.106 | 0.045 | [−0.001, 0.416] |
| 19/20 | 12/20 | 0.350 | 0.020 | 0.008 | [0.090, 0.567] |
| 58/60 | 48/60 | 0.167 | 0.008 | 0.004 | [0.052, 0.287] |

The test used `scipy.stats.fisher_exact` and `scipy.stats.boschloo_exact` (two-sided, scipy 1.18.1) and `statsmodels.stats.proportion.confint_proportions_2indep(..., method="newcomb")`. The scipy docs call Boschloo's test "a uniformly more powerful alternative to Fisher's exact test for 2x2 contingency tables" (checked on 2026-10-13).

Read the first row: 20/20 against 18/20 is fully consistent with equal pass rates. The difference could be anything from B being 8 points better to 30 points worse. The second row shows a different trap: the test choice changes the verdict at $p = 0.05$.

> [!trap] Choose the test before you see the counts
> For 20/20 against 16/20, Fisher gives 0.106 and Boschloo gives 0.045. If you pick the test after you see both, you pick the one that agrees with you. Write the test, the level and the number of runs into the test plan first ([L2](/notes/ai/evaluation/02-statistics/l2-statistical-power)).

When both configurations run on the same set of different questions, compare them question by question. Anthropic's research note on model evaluations gives this as recommendation 4: "conducting a paired-differences test lets us eliminate the variance in question difficulty" (checked on 2026-10-13). For a single prompt run many times, the runs are unpaired, and the tests above apply.

### 4.9 Production view

| Concern | What to do |
|---|---|
| Reporting | Report k/n and the Wilson 95% interval. Name the method. |
| Release gates | Use a one-sided Clopper-Pearson bound and a threshold that you chose before the runs. |
| Independence | Give each run a fresh session and fresh random data. Run the batch in a short window. |
| Comparisons | Use Fisher's or Boschloo's exact test and a Newcombe interval for the difference. Never compare overlapping intervals. |
| Library defaults | Pass `method=` explicitly. The statsmodels default is the Wald interval. |
| Scope | State which prompts, model version and configuration the rate covers. |

## 5. Video

```video
{
  "src": "/notes/media/evaluation/manim/m01-what-20-of-20-proves.mp4",
  "caption": "Why 3/3 and 20/20 do not prove 100%: the range of pass rates that each result allows, and why 20/20 and 18/20 cannot be told apart."
}
```

## 6. Code

These exercises go in `evaluation/04-pass-rates.ipynb` in the lab folder `C:\Users\ASohi\Downloads\AI\agent-harness-lab`. They need no API key.

**Exercise 1.1: Wilson by hand.** Write `wilson(k, n, z=1.959964)` with the formula of section 4.3, with no statistics library.

Acceptance tests:

- `wilson(18, 20)` returns (0.6990, 0.9721) when rounded to 4 places.
- For every $k$ from 0 to $n$ and $n$ in {3, 20, 50}, the result differs from `proportion_confint(k, n, method="wilson")` by less than `1e-9`.

**Exercise 1.2: Clopper-Pearson from Beta quantiles.** Write `clopper_pearson(k, n, alpha=0.05)` with `scipy.stats.beta.ppf`. Handle $k = 0$ and $k = n$.

Acceptance tests:

- The lower limit for 20/20 equals $0.025^{1/20}$ within `1e-12`.
- The results equal `binomtest(k, n).proportion_ci(method="exact")` for all $k$ with $n = 20$.

**Exercise 1.3: coverage.** Write `coverage(method, n, p)` that sums the binomial probabilities of the outcomes whose interval contains $p$.

Acceptance tests:

- For $n = 20$ and $p = 0.95$, the results match the table of section 4.2 to 3 places.
- Over the grid $p = 0.01, \dots, 0.99$, the Clopper-Pearson coverage is never below 0.95.

**Exercise 1.4: compare two configurations.** Write `compare(k_a, n_a, k_b, n_b)` that returns the difference, the Fisher p-value, the Boschloo p-value and the Newcombe interval.

Acceptance tests:

- The four rows of the table in section 4.8 are reproduced to 3 places.
- Swapping A and B changes the sign of the difference and of the interval, and leaves both p-values unchanged.

## 7. Common mistakes

1. **"3/3 means it works."** A feature with a pass rate of 0.5 gives 3/3 in 12.5% of tests.
2. **Reporting 20/20 as 100%.** The Wilson interval is [0.84, 1.00]. The failure rate can still be about 15%.
3. **Using the library default.** `proportion_confint` defaults to the Wald interval, which gives [1, 1] for 20/20.
4. **Comparing two configurations by overlapping intervals.** Use a test or an interval for the difference.
5. **Picking the test after seeing the data.** Fisher and Boschloo can disagree at the 0.05 level. Choose first.
6. **Runs that share state.** A cached answer or a reused session makes the runs dependent, and the interval is then too narrow.
7. **Generalizing from one prompt.** Twenty runs of one prompt measure that prompt only.

## 8. One-minute explanation

Each run of a live test is a random trial with an unknown pass rate $p$. So the number of passes in $n$ independent runs is binomial. A perfect score is not proof: $p = 0.9$ gives 20/20 about 12% of the time, and $p = 0.5$ gives 3/3 12.5% of the time. A confidence interval shows the range of $p$ that the result allows. The simple Wald interval returns [1, 1] for 20/20, and it is the statsmodels default, so always name the method. For small $n$, use Wilson: 3/3 gives [0.44, 1.00], 18/20 gives [0.70, 0.97], 20/20 gives [0.84, 1.00], and 0/20 gives [0.00, 0.16]. Clopper-Pearson is wider but guarantees 95% coverage, which suits release gates. With zero failures in $n$ runs, the rule of three says that the failure rate is probably below about $3/n$. To compare two configurations, use an exact test on the difference: 20/20 against 18/20 gives Fisher p = 0.49, so there is no evidence of a difference.

## 9. Check questions

```check
{
  "question": "A test passed 20 of 20 runs. Give the Wilson 95% interval and the one-sided 95% upper bound on the failure rate. Can you claim that the feature fails less than 5% of the time?",
  "hint": "The Wilson lower limit for all passes is n/(n + z^2). The one-sided bound is 1 − 0.05^(1/n).",
  "answer": "Wilson: [20/23.84, 1] = [0.839, 1.000]. One-sided 95% upper bound on the failure rate: 1 − 0.05^(1/20) = 0.139 (the rule of three gives 3/20 = 0.15). So no: the data allow a failure rate up to about 14%. To claim below 5% with 95% confidence, you need about 59 runs with no failure."
}
```

```check
{
  "question": "Your code calls proportion_confint(20, 20) from statsmodels and gets (1.0, 1.0). What went wrong?",
  "answer": "The default method in statsmodels 0.15.0 is method='normal', the Wald interval. For p-hat = 1, its width is zero, so it claims certainty. Pass method=\"wilson\" (or \"beta\" for Clopper-Pearson), which gives [0.839, 1.0] or [0.832, 1.0]."
}
```

```check
{
  "question": "Prompt A passed 20/20 and prompt B passed 18/20. A teammate says: \"A is better, ship A.\" What does the data say?",
  "answer": "Fisher's exact test gives p = 0.487 (Boschloo 0.282), and the Newcombe 95% interval for the difference A − B is [−0.077, 0.301]. The data are consistent with equal pass rates, and also with B being slightly better. There is no evidence that A is better. To detect a real difference of this size you need many more runs (Part 2, L2)."
}
```

```check
{
  "question": "Why can 20 runs of one test give an interval that is too narrow, even with a correct formula?",
  "answer": "The formulas assume independent runs with the same pass rate. If runs share state, such as a session file, a cache or a database row, one result changes the next, and the 20 runs carry less information than 20 independent runs. If the runs spread over a model update or a period of errors, the pass rate is not constant. Use fresh state and fresh random data for each run, and run the batch in a short window."
}
```

## 10. Links

- Previous part: [L3: Independent audit](/notes/ai/evaluation/01-test-design/l3-independent-audit)
- Next: [L2: Statistical power](/notes/ai/evaluation/02-statistics/l2-statistical-power)
- Why runs vary: [Fake model vs real model](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model)
- What a negative control shows: [Random data, controls and strict scoring](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring)
- [Glossary](/notes/ai/evaluation/glossary)
