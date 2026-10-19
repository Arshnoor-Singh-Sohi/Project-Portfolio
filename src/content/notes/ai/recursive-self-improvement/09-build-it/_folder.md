---
title: "09 Build RSI systems yourself"
order: 19
summary: "Eight small projects, from a fixed agent with a score to a loop that improves its own improver, plus the path to a language-model version."
---

Every project runs in a lab in the browser. It needs no API key and no model. A seeded random proposer stands in for a language model, so each result is exactly repeatable.

| Code | Lesson | Core idea | Status |
|---|---|---|---|
| P1 | [A fixed agent with a score](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) | Build a bin-packing agent with a fixed rule, a task set split into training, validation and test sets, and a score. | not started |
| P2 | [Many candidates, one answer](/notes/ai/recursive-self-improvement/09-build-it/p2-many-candidates-one-answer) | Generate several candidate answers per task, keep the best, and see why nothing persists. | not started |
| P3 | [An evaluator with explicit tests](/notes/ai/recursive-self-improvement/09-build-it/p3-an-evaluator-with-explicit-tests) | Write tests that reject invalid answers, and watch a cheating candidate win on a naive score. | not started |
| P4 | [Propose and test strategy changes](/notes/ai/recursive-self-improvement/09-build-it/p4-propose-and-test-strategy-changes) | Improve the agent's strategy by hill climbing with a validation set, and see overfitting when you select on the training set. | not started |
| P5 | [An agent that edits a program](/notes/ai/recursive-self-improvement/09-build-it/p5-an-agent-that-edits-a-program) | Represent the strategy as Python source, change it with program edits, and run tests on every candidate. | not started |
| P6 | [An acceptance rule with a validation suite](/notes/ai/recursive-self-improvement/09-build-it/p6-a-validation-gate) | Accept a change only when it passes tests and beats the parent by more than the noise. | not started |
| P7 | [Regression tests and an archive](/notes/ai/recursive-self-improvement/09-build-it/p7-regression-tests-and-an-archive) | Protect solved tasks with regression tests and keep an archive of versions with a parent-selection rule. | not started |
| P8 | [Improving the improver](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver) | Score the improver by the gains it produces, improve it, then let it improve itself, and find its limits. | not started |
| P9 | [From the toy to a language-model version](/notes/ai/recursive-self-improvement/09-build-it/p9-from-toy-to-language-model) | How to replace the random proposer with a language model safely, and what changes in cost, noise and risk. | not started |
| 10 | [Reference solutions](/notes/ai/recursive-self-improvement/09-build-it/solutions) | Complete reference solutions for the eight projects. Open them only after you try each project. | not started |
