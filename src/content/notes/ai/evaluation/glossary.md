---
title: "Glossary"
order: 2
summary: "Every term in Evaluating AI Systems, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| $\beta$ | The accepted probability of a miss. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
| accidental pass (false pass) | A test passes although the feature it tests is broken. | [1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) |
| adjudication | A decision by hand, against the spec, of which scorer is right for one disagreeing run. | [1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit) |
| agreement table | A 2 × 2 table that counts runs by (primary result, audit result). | [1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit) |
| base URL | The address that a client sends its API requests to. | [1.1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) |
| binomial distribution | The distribution of the number of passes $k$ in $n$ independent runs with the same $p$. | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| chance agreement $p_e$ | The agreement that two scorers would reach by chance, given how often each one passes. | [1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit) |
| chance pass probability $q$ | The probability that one run passes when the feature is broken. | [1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) |
| claim about behavior | A claim about what the model does with its input. Only the real model can prove it. | [1.1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) |
| claim about input | A claim about the exact request that the model receives. A fake can prove it. | [1.1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) |
| Clopper-Pearson interval | The "exact" interval from binomial tail probabilities. Its coverage is at least 95%. | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| Cohen's kappa $\kappa$ | Agreement corrected for chance agreement: $(p_o - p_e) / (1 - p_e)$. | [1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit) |
| common-mode failure | One cause that makes two components fail in the same way at the same time, for example a shared helper function. | [1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit) |
| confidence interval | A range computed from $k$ and $n$ by a rule that contains the true $p$ in about 95% of repeated experiments. | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| coverage | The real share of experiments in which an interval rule contains the true $p$. | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| differential testing | Running two implementations on the same input and treating any difference in output as a bug in at least one of them. | [1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit) |
| effect size | The size of the change that the test must detect, here $p_1 - p_2$. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
| exact power | The power computed by summing over every possible outcome, with no approximation. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
| fake model server | A small HTTP server that answers like the Messages API but returns replies from a script, not from a model. | [1.1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) |
| false alarm (type I error) | The test reports a regression, but the pass rates are equal. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
| fault injection | A test that makes the fake fail on purpose, for example with HTTP 529 or a cut stream. | [1.1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) |
| Fisher's exact test | A test of whether two pass rates differ, exact for small counts. | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| flaky test | A test that passes on some runs and fails on others with no code change. | [1.1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) |
| guessing model | A model of a broken system that answers without the information, for example by picking a likely value. | [1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) |
| independent audit | A second scorer, built separately from the written rule, that re-scores the same saved data. | [1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit) |
| independent runs | Runs where the result of one run does not change the chance of another. | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| leak | A path by which the expected value reaches the model or the scorer, other than the path under test. | [1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) |
| lenient scoring | A scoring rule that accepts answers that "look right", for example a substring or a loose pattern. | [1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) |
| live test | A test that calls the real model through the real endpoint. | [1.1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) |
| minimum detectable effect | The smallest effect that the test detects with the chosen power. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
| miss (type II error) | The test reports no regression, but a real drop exists. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
| negative control | A run in which the information is withheld. It must fail. It proves that the test can fail. | [1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) |
| nonce | A random value made for one test run only, for example `K7P2QX`. The model cannot know it in advance. | [1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) |
| normal approximation | A formula that treats the pass counts as normally distributed. It is fast but not exact for small $n$. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
| observed pass rate $\hat p$ | The passes divided by the runs: $k/n$. | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| one-sided bound | A single limit, for example "the failure rate is below 0.139 with 95% confidence". | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| p-value | The probability of a difference at least this large if the two true pass rates were equal. | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| peeking | Reading the results during the runs and stopping when they look significant. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
| percent agreement $p_o$ | The share of runs where both scorers give the same result. | [1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit) |
| positive control | A run in which the information is clearly available. It must pass. It proves that the test can pass. | [1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) |
| power | $1 - \beta$: the probability that the test detects a real effect of the assumed size. Usually 0.80 or 0.90. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
| primary scorer | The scorer that the test runner uses to produce its report. | [1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit) |
| random data | Test data with random values, so that the model cannot guess the expected answer. | [1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) |
| raw transcript | The saved, unprocessed record of a run: the recorded requests and replies, or the session file. | [1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit) |
| re-scoring | Scoring saved transcripts again, with no new model calls. | [1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit) |
| request recorder | The part of the fake that saves every request it receives: method, path, headers and JSON body. | [1.1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) |
| rule of three | With 0 failures in $n$ runs, $3/n$ is about the one-sided 95% upper bound on the failure rate. | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| scoring rule | The exact rule that decides if one run passes. | [1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) |
| scoring spec | The written scoring rule. Both scorers follow it, and it decides every disagreement. | [1.3](/notes/ai/evaluation/01-test-design/l3-independent-audit) |
| scripted reply | The reply that the fake chooses from rules, for example "return a tool call when the request has tools and no tool result yet". | [1.1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) |
| sequential design | A plan that allows looks during the runs, with adjusted thresholds that keep $\alpha$ correct. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
| server-sent events (SSE) | A streaming format: the server sends named events as text, each with a `data:` line of JSON. | [1.1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) |
| significance level $\alpha$ | The accepted probability of a false alarm: the test reports a difference that does not exist. Usually 0.05. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
| smoke run | A small live run that confirms that the real API accepts the request shape. | [1.1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) |
| stream event | One SSE event of a streamed Messages API reply, for example `message_start` or `content_block_delta`. | [1.1](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) |
| strict scoring | A scoring rule that accepts only the exact expected value, in the agreed form, in the agreed place. | [1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) |
| test plan | The written plan with $\alpha$, power, effect size, test and $n$, made before the first run. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
| true pass rate $p$ | The probability that one run passes, under fixed conditions. You never observe it directly. | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| Wald interval | The simple interval $\hat p \pm 1.96\sqrt{\hat p(1-\hat p)/n}$. It fails near 0 and 1. | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| Wilson interval | A score interval with good coverage for small $n$. It never has zero width. | [2.1](/notes/ai/evaluation/02-statistics/l1-pass-rates-and-confidence-intervals) |
| word boundary | The edge of a token. A strict rule does not match `4831` inside `14831`. | [1.2](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) |
| zero-failure demonstration | A gate that passes only if all $n$ runs pass, sized so that a bad feature rarely passes it. | [2.2](/notes/ai/evaluation/02-statistics/l2-statistical-power) |
