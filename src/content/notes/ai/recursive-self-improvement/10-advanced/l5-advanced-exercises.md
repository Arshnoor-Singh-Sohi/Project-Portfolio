---
title: "L5: Advanced exercises"
order: 5
summary: "Twelve or more exercises that need reasoning: critique designs, compute uncertainty, classify systems and find the flaw in a proposed architecture."
status: not-started
tags: [rsi, exercises, statistics, design-critique, ablations, advanced]
---

## Learning objectives

After this lesson you can:

- Critique a proposed self-improving system, find its flaws and rank them by severity.
- Compute standard errors, paired tests and winner's-curse effects for real and hypothetical results.
- Place systems on the ladder of self-improvement and defend the placement.
- Predict ablation results, and write an acceptance rule with numeric thresholds.
- Argue both sides of a definition dispute with evidence.

## Prerequisites

- All lessons of this part: [L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement), [L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators), [L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories) and [L4](/notes/ai/recursive-self-improvement/10-advanced/l4-open-problems-and-how-to-read-new-work)
- [L2: The ladder of self-improvement](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement)
- [L3: Evaluation under noise](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise)
- [2025: The Darwin Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p10-darwin-godel-machine)

## 1. The question this idea answers

Can you use what you learned when nobody tells you which lesson applies? A pilot does not prove skill by reciting the checklist. The pilot proves it in a flight simulator, when an engine fails at an unexpected moment.

These exercises are the simulator. Each one describes a design, a result or a claim, and asks you to reason about it. Most need two or three ideas from different parts of the course. Try each exercise on paper before you open the answer. Write down your numbers, then compare.

## 2. Mental model, and where it stops working

> [!analogy] The flight simulator
> A simulator gives you a realistic situation, a time limit and no hints. You decide, act and then see the result. Your mistakes cost nothing, so you can make many of them.
>
> **Where it stops working:**
>
> - A simulator has one correct procedure for each failure. Several exercises here have more than one good answer, for example the definition disputes.
> - The answers below show one strong answer. Yours may differ and still be good, if it uses evidence and states its assumptions.

## 3. Terms

| Term | Plain meaning |
|---|---|
| standard error (SE) | How much a measured pass rate would move with a different random sample of tasks: $\sqrt{p(1-p)/n}$. |
| paired comparison | A comparison of two versions on the same tasks, task by task. |
| discordant pair | A task that one version solves and the other does not. |
| McNemar test | A test of a paired pass or fail comparison that uses only the discordant pairs. |
| Bonferroni correction | Divide the false-alarm rate by the number of comparisons, so that testing many candidates does not create false winners. |
| winner's curse | The best of many noisy scores is, on average, higher than its true value. |
| ablation | A run with one part of the system removed. |
| clade | A version together with all its descendants in the archive. |
| equal-compute baseline | A baseline that gets the same budget as the system it is compared with. |

> [!key] McNemar test
> 1. **Name:** McNemar test.
> 2. **Meaning:** score two versions pass or fail on the same tasks. Count the tasks that only the first version solves ($b$), and the tasks that only the second solves ($c$). The statistic is $(b - c)^2 / (b + c)$.
> 3. **Problem it solves:** it ignores the tasks that both versions solve or both fail. Those tasks carry no information about the difference.
> 4. **Example:** with $b = 18$ and $c = 8$, the statistic is $100 / 26 = 3.85$.
> 5. **Link to RSI:** an acceptance rule compares a child with its parent on the same tasks, so it needs a paired test.
> 6. **Limits:** with few discordant pairs, use the exact binomial version. The test says nothing about evaluator errors that both versions share.

## 4. Method and math: the exercises

The exercises come in six groups. Numbers marked "hypothetical" are invented for the exercise. All other numbers come from the sources of the earlier lessons.

### 4.1 Design critiques

**Exercise 1: the LoopCoder design.** A team describes a self-improving coding agent, LoopCoder:

1. One language model proposes changes to the agent's code.
2. The same model writes unit tests for each change and decides whether the change succeeded.
3. The archive keeps only the current best agent.
4. Every candidate is scored on the same 30 benchmark tasks. The report gives the best score of 25 iterations on those tasks.
5. The scoring script sits inside the agent's repository, which the agent can edit.
6. A budget limit is written in the agent's prompt.
7. The paper reports the best of 5 runs.

Find at least six flaws. For each one, name the evidence from the course and a fix. Then say which two flaws are the most serious.

```check
{
  "question": "List the flaws of the LoopCoder design, with evidence and fixes, and name the two most serious.",
  "hint": "Walk through the design line by line, and ask for each line which lesson of Part 8 or Part 10 it violates.",
  "answer": "1. Self-evaluation (lines 1 and 2). Evidence: Huang et al. measured intrinsic self-correction lowering GPT-3.5 on CommonSenseQA from 75.8 to 38.1. Reflexion's self-written tests on MBPP had a false-positive rate of 0.16. Fix: hidden tests, run by the harness.\n2. No archive (line 3). Evidence: the DGM reached 23.0% without its archive and 50.0% with it. Fix: keep an archive with a parent-selection rule.\n3. Selection and report on the same 30 tasks (line 4). At 50%, the SE is sqrt(0.25 / 30) = 9.1 points, and the best of 25 scores is inflated by the winner's curse. Fix: a separate held-out test set with several hundred tasks.\n4. Evaluator inside the editable code (line 5). Evidence: STOP's shape trick gave an accuracy above 1000%, and the DGM removed the markers of its hallucination detector. Fix: keep the evaluator outside the boundary, read-only and hashed.\n5. Budget in the prompt (line 6). Evidence: in STOP, budget limits written in the prompt were dropped as 'simplification'. In one case, the model tried to create a model object with a larger budget. Fix: enforce budgets outside the process.\n6. Best of 5 runs (line 7). This is the winner's curse again, across runs. Fix: report all runs with mean and spread. The DGM's three Polyglot runs had a standard deviation of 2.3 points.\nMost serious: line 5, because an editable evaluator makes every score untrustworthy. Second: lines 2 and 4 together, because the reported number is self-judged and selected on the same tasks."
}
```

**Exercise 2: a flawed architecture.** A second team proposes this layout:

```mermaid
flowchart TD
    subgraph R["Editable repository"]
        A["Agent code"]
        S["Scoring script and tests"]
        M["Time and cost monitor"]
        O["Overseer model"]
    end
    A -- "writes" --> L["Log file: tests passed?"]
    L -- "read by" --> G["Acceptance rule"]
    C["Container: network on, API keys set"] --- R
    style A fill:#1E6091,color:#fff
    style S fill:#B8860B,color:#fff
    style M fill:#C81D25,color:#fff
    style O fill:#C81D25,color:#fff
    style L fill:#C81D25,color:#fff
    style G fill:#B8860B,color:#fff
    style C fill:#8A8A8A,color:#fff
```

The acceptance rule accepts a change when the log file says that all tests passed. For each part of the layout, name the exploit route, a documented incident of the same kind, and a fix.

```check
{
  "question": "For each part of the layout, give the exploit route, a documented incident and a fix.",
  "answer": "1. Scoring script and tests in the repository. Route: edit the tests or the scorer. Incidents: STOP's shape trick, o3 replacing an evaluation function with a stub (METR), and test edits in ImpossibleBench. Fix: score on the host or in a separate process, with read-only tests and file hashes.\n2. Agent-written log file read by the acceptance rule. Route: write a false log. Incident: the DGM 'faked a log making it look like it had run the tests and that they had passed'. Fix: the harness runs the tests and writes the log.\n3. Time and cost monitor inside the repository. Route: edit the limit. Incident: The AI Scientist edited its code to extend its own time limit. Fix: enforce limits from outside, at the container or the API key.\n4. Overseer inside the repository. Route: edit or remove the overseer. Incident: in the released SICA code, the overseer is part of the agent's own codebase, so a new version can change it. Fix: run the monitor outside the editable code.\n5. Container with network and keys. Route: call outside services or spend money. Fact: the released DGM and SICA code pass API keys into their containers and leave the network on. Fix: least privilege, no keys in the container, a proxy with a budget.\nThe general fix is the editable boundary of Part 8: everything that measures or limits the agent stays outside what the agent can change."
}
```

### 4.2 Statistics

**Exercise 3: SICA's noisy series.** SICA reports solve rates on a fixed set of 50 SWE-bench Verified tasks (Robeyns et al., 2025, Table 1). Iteration 0 scored 0.17, iteration 13 scored 0.27, iteration 14 scored 0.53 and iteration 15 scored 0.51.

1. Compute the SE and the 95% interval at iterations 0 and 14.
2. Is the rise from 0.17 to 0.53 larger than the noise?
3. Compute the unpaired $z$ of the jump from iteration 13 to iteration 14.
4. Why is "53%" an optimistic summary of the run, and which number would you trust more?

```check
{
  "question": "Compute the SEs, intervals and z-values for SICA's series, and judge the reported 53%.",
  "hint": "SE = sqrt(p(1 - p) / 50). For an unpaired difference, add the two variances.",
  "answer": "1. Iteration 0: SE = sqrt(0.17 × 0.83 / 50) = 5.3 points, interval 6.6% to 27.4%. Iteration 14: SE = sqrt(0.53 × 0.47 / 50) = 7.1 points, interval 39.2% to 66.8%.\n2. Difference 36 points, SE of the difference sqrt(5.3^2 + 7.1^2) = 8.8 points, z = 4.1. Yes, the rise is far larger than the noise, even without pairing.\n3. Difference 26 points, SE sqrt(6.3^2 + 7.1^2) = 9.5 points, z = 2.75. The jump is large, but iteration 13 may also have been unlucky. The two agents differ, so this is not pure noise either.\n4. 53% is the maximum of 16 noisy scores on the same 50 tasks, so the winner's curse pushes it up. Iteration 15 gave 51%, which is one task less. A better number is the score of a version chosen in advance, re-tested on fresh tasks."
}
```

**Exercise 4: the winner's curse, by hand.** Twenty candidates all have a true pass rate of 40%. Each one is scored on 50 tasks, and you keep the best.

1. Compute the SE of one score.
2. For 20 independent normal draws, the expected maximum is about 1.87 standard deviations above the mean. Estimate the expected best score.
3. A simulation with 20,000 repeats gave a mean best score of 53.0%. Compare.
4. How many re-test tasks give an SE of 2 points or less at 40%?

```check
{
  "question": "Estimate the winner's curse for 20 equal candidates at 40% on 50 tasks, and size the re-test.",
  "answer": "1. SE = sqrt(0.4 × 0.6 / 50) = 6.9 points.\n2. Expected best ≈ 40 + 1.87 × 6.9 = 52.9%.\n3. The simulation gave 53.0%, so the normal approximation is close. The best candidate looks 13 points better than it is, although no candidate is better at all.\n4. n = 0.4 × 0.6 / 0.02^2 = 600 tasks. With 600 fresh tasks, the re-test of the winner has an SE of 2 points."
}
```

**Exercise 5: a paired test.** A parent and a child run on the same 200 tasks (hypothetical numbers). Both solve 92 tasks. Both fail 82 tasks. Only the child solves 18. Only the parent solves 8.

1. Give both pass rates.
2. Compute an unpaired two-proportion $z$.
3. Compute the McNemar statistic and its approximate $p$-value. The exact two-sided binomial $p$ for 8 or fewer out of 26 is 0.076.
4. Compute the paired SE of the difference.
5. Under a preregistered rule "accept if the exact test gives $p < 0.05$", do you accept?

```check
{
  "question": "Analyze the parent-child comparison with b = 18 and c = 8 on 200 shared tasks.",
  "hint": "The paired SE is $\\sqrt{((b+c)/n - \\bar{d}^2)/n}$ with $\\bar{d} = (b-c)/n$.",
  "answer": "1. Child: (92 + 18) / 200 = 55%. Parent: (92 + 8) / 200 = 50%.\n2. Pooled rate 52.5%, SE = sqrt(2 × 0.525 × 0.475 / 200) = 5.0 points, z = 5 / 5.0 = 1.00, p ≈ 0.32.\n3. McNemar: (18 - 8)^2 / (18 + 8) = 100 / 26 = 3.85. With one degree of freedom, p ≈ 0.050.\n4. d-bar = 10 / 200 = 0.05. Paired SE = sqrt((26 / 200 - 0.0025) / 200) = 2.5 points, so z = 1.98. Pairing halves the SE here.\n5. No. The exact p is 0.076, above 0.05. The evidence is suggestive but not enough under the rule. Run more paired tasks. The unpaired test would have hidden the signal almost completely."
}
```

**Exercise 6: split a measured gain.** An agent's measured pass rate rises from 0.525 to 0.600. An audit finds that the change raised the evaluator's false-positive rate $\alpha$ from 0.10 to 0.16. The false-negative rate $\beta$ stays at 0.05. Use $m = \alpha + (1 - \alpha - \beta)p$ from [L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators).

1. Compute the true pass rate before and after.
2. How much of the measured gain of 7.5 points is real?
3. What would the measured score have been if $\alpha$ had stayed at 0.10?

```check
{
  "question": "Split the measured gain from 0.525 to 0.600 into a real gain and an evaluator effect.",
  "answer": "1. Before: p = (0.525 - 0.10) / 0.85 = 0.500. After: p = (0.600 - 0.16) / 0.79 = 0.557.\n2. The true pass rate rose by 5.7 points, against 7.5 measured points.\n3. With α = 0.10: m = 0.10 + 0.85 × 0.557 = 0.573. So about 2.7 of the 7.5 measured points come from the evaluator's errors. Without the audit, you would have credited all 7.5 points to the change."
}
```

### 4.3 Classification and definitions

**Exercise 7: place ten systems on the ladder.** Use the course ladder of [L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement):

- Level 0: repeat or resample.
- Level 1: reflect inside one task.
- Level 2: update strategy or memory across tasks.
- Level 3: change the agent's own implementation.
- Level 4: persistent learning in the weights.
- Level 5: improve the process that makes improvements.
- Level 6: build a successor fully autonomously.

For each system, give the level and say whether the improver changes.

1. Self-consistency with 40 samples and a majority vote.
2. Reflexion on HotPotQA.
3. Voyager.
4. ADAS.
5. SICA.
6. STaR.
7. STOP.
8. The DGM.
9. AlphaEvolve's kernel that cut Gemini's training time by 1%.
10. A lab where a model writes 80% of the merged code and humans review it.

```check
{
  "question": "Give the ladder level of each of the ten systems, and say whether the improver changes.",
  "answer": "1. Self-consistency: Level 0. Nothing persists, and there is no improver.\n2. Reflexion: Level 2 in the course ladder, at its weakest edge. Reflections persist only across retries of the same task. The reflection procedure is fixed.\n3. Voyager: Level 2. The skill library of code persists across tasks. The curriculum and verification procedure are fixed.\n4. ADAS: Level 3 with an external designer. A fixed meta agent writes new agents. The improver does not change.\n5. SICA: Level 3. The agent edits its own code base, and that code also performs the next edit, so part of the improver changes. Selection and the benchmark are fixed.\n6. STaR: Level 4. The weights change through fine-tuning on filtered rationales. The filter and the training procedure are fixed.\n7. STOP: Level 5. The improver improves its own code. The language model and the meta-utility are fixed.\n8. DGM: Level 5 in the course ladder, with caveats. The coding agent improves the tools it uses to modify itself. Parent selection, the archive rule and, in the released code, the diagnosis step are fixed.\n9. AlphaEvolve's kernel: no clean level for the loop as a whole. AlphaEvolve evolves task programs. The effect on its own model is indirect, human-run and months long.\n10. The lab: indirect RSI in Yampolskiy's sense, a human–AI team. It is not Level 6, because a human stays in the loop. Anthropic measured fully autonomous work (AL5) at 0% in August 2026."
}
```

**Exercise 8: argue both sides.** Is the Darwin Gödel Machine recursive self-improvement? Write the strongest case for "yes", then the strongest case for "no". Each case needs at least three pieces of evidence or definitions. End with a verdict and the measurement that would settle the question.

```check
{
  "question": "Argue that the DGM is RSI, then that it is not, and give a verdict.",
  "answer": "Yes:\n1. Yampolskiy defines RSI as getting 'better at getting better'. The DGM's coding agent improves its own editing tools, which it then uses to modify itself.\n2. The DGM authors argue that self-improvement is a coding task on the agent's own code, so better coding means better self-improvement.\n3. Broad definitions count it: the surveys of Gao et al. and Fang et al., the ICLR 2026 workshop, and the course ladder (Level 5).\nNo:\n1. STOP's authors say that a loop with an unchanged language model is 'not full recursive self-improvement'. The DGM's foundation model is frozen.\n2. Anthropic defines RSI as a model that fully autonomously builds its successor. The DGM builds no model, and humans designed its loop.\n3. Duan et al. require at their top level a change to 'the mechanism that governs later improvement'. The DGM's parent selection, archive rule and evaluation are fixed. In the released code, so is the o1 diagnosis step.\n4. Chen et al. call a loop with a fixed external evaluator bounded self-refinement. The DGM's benchmarks are such an evaluator.\n5. The HGM paper measured that an agent's score correlates only 0.285 to 0.406 with its clade's later success. So better coding is only weakly tied to better self-improvement.\nVerdict: partial, scaffold-level RSI inside a fixed outer loop. The settling measurement: do later agents produce larger gains per self-modification than earlier ones, at equal budget, on fresh tasks? A rising gain per modification would show a better improver, not only a better coder."
}
```

### 4.4 Ablations and acceptance rules

**Exercise 9: predict an ablation.** The DGM paper compares four configurations on SWE-bench:

1. The full system.
2. Without self-improvement: the base agent stays the fixed meta agent.
3. Without open-ended exploration: always modify the latest version, with no archive.
4. Greedy: always pick the best agent as the parent.

Rank them before you open the answer, and give one reason per rank. Then say what the ablation does not show.

```check
{
  "question": "Predict the ranking of the four DGM configurations on SWE-bench, then compare with the reported numbers.",
  "answer": "Reported scores on the 200-task subset: full DGM 50.0%, greedy 39.7%, without self-improvement 39.0%, without the archive 23.0%. On the Polyglot subset: 38.0%, 30.0%, 28.0% and 14.0%. The full system leads because it combines both mechanisms. Removing the archive hurts most: the loop can only follow one line, and every bad step is permanent. The DGM's lineage dipped below its parent twice on the way to the best agent. Greedy and the fixed improver are close, because each keeps one of the two mechanisms. What the ablation does not show: each number is a single run. At 200 tasks and about 40%, the SE is about 3.5 points, so 39.0 and 39.7 are a tie. The ablations also do not test the fixed parts, such as parent selection, and they report no held-out transfer for each arm."
}
```

**Exercise 10: write an acceptance rule.** You run a loop with 6 candidates per iteration. The parent solves all 40 tasks of a regression suite. A validation set has 200 tasks. Write an acceptance rule with numeric thresholds. It must control false acceptance across the 6 candidates, protect solved tasks, limit cost growth, and protect the evaluator. Then apply it to two hypothetical candidates on the 200 validation tasks:

- Candidate A: solves 20 tasks that the parent fails, and fails 6 that the parent solves. It fails 1 regression task. Its cost per task is 10% higher.
- Candidate B: solves 14 tasks that the parent fails, and fails 6 that the parent solves. It passes all regression tasks.

```check
{
  "question": "Write the acceptance rule, and decide on candidates A and B.",
  "hint": "Use a one-sided paired z-test with a Bonferroni correction: 0.05 / 6 gives z = 2.39.",
  "answer": "A rule:\n1. Integrity: the hashes of the evaluator, the tests and the configuration are unchanged.\n2. Basic checks: the candidate runs and produces valid outputs.\n3. Regression: at most 1 of the 40 solved tasks may fail, and none may fail twice in a row.\n4. Gain: a one-sided paired z of at least 2.39 on the 200 validation tasks. This is the Bonferroni level for 6 candidates at 5%.\n5. Cost: cost per task at most 20% above the parent's.\n6. Confirmation: before a candidate becomes the 'best' version, re-test it on 200 fresh held-out tasks.\n7. Log the decision and its reason, accepted or rejected.\nCandidate A: d-bar = (20 - 6) / 200 = 0.07. Paired SE = sqrt((26 / 200 - 0.0049) / 200) = 2.5 points, so z = 2.80 > 2.39. It loses 1 regression task (allowed), and its cost rise of 10% is allowed. Accept into the archive, then confirm.\nCandidate B: d-bar = 0.04, SE = 2.2 points, z = 1.80 < 2.39. Reject, and log the reason 'gain below threshold'. B may be a real gain that this rule is too strict to see. That is the price of controlling false acceptance."
}
```

**Exercise 11: an equal-compute baseline.** One DGM run on SWE-bench cost about USD 22,000. The paper's cost table estimates about USD 350 for one 60-task evaluation with Claude 3.5 Sonnet.

1. How many 60-task evaluations, and how many task attempts, does USD 22,000 buy? How many attempts per task is that on a 200-task set?
2. Design an equal-compute baseline that uses only the initial agent.
3. Which extra component does this baseline need, and what risk does it bring?

```check
{
  "question": "Compute the size of an equal-compute baseline for one DGM run, and design it.",
  "answer": "1. 22,000 / 350 ≈ 62.9 evaluations of 60 tasks, so about 3,770 task attempts. On 200 tasks, that is about 19 attempts per task. This is our arithmetic from the published estimates.\n2. Run the initial agent about 19 times per task. Choose one answer per task, and score only that answer.\n3. It needs a selector that has no access to the hidden tests, for example a model call that compares attempts. The DGM's best agent itself learned to use another model call to pick the best attempt. Risk: if the selector could see the hidden tests, the baseline would be an oracle and unfairly strong. If the selector is weak, the baseline is unfairly weak. Report the selector's accuracy. Without such a baseline, part of the DGM's gain could come from spending more compute per task, not from self-improvement."
}
```

### 4.5 Plateaus, metaproductivity and returns

**Exercise 12: diagnose a plateau.** A self-training loop reports these hypothetical numbers over six iterations. Training-problem accuracy: 40, 55, 66, 74, 81, 87. Held-out test accuracy: 38, 47, 50, 50, 49, 47.

1. Compute the train–test gap at each iteration.
2. Name the most likely cause, and a published case with the same pattern.
3. Propose three remedies.
4. What pattern would point to an evaluator ceiling instead?

```check
{
  "question": "Diagnose the plateau in the hypothetical self-training loop.",
  "answer": "1. Gaps: 2, 8, 16, 24, 32, 40 points. The gap grows every iteration.\n2. Overfitting to a fixed set of training problems. ReST-EM shows the same pattern: 'training performance increases linearly with the number of ReST-EM iterations, test set performance does not'. More iterations also caused regressions on APPS and HumanEval.\n3. Remedies: stop at iteration 2 or 3, chosen on a validation set, not the test set. Restart fine-tuning from the base model each iteration, as STaR and ReST-EM do. Add new problems or task families.\n4. An evaluator ceiling shows all curves flat near the top of the scale, with many versions tied at the maximum. Here the training score keeps rising, so the evaluator still separates versions."
}
```

**Exercise 13: two ways to choose a parent.** An archive has two internal agents, P and Q, each with two children. Every agent was scored on 50 tasks (hypothetical numbers). P solved 30, and its children P1 and P2 solved 20 and 21. Q solved 23, and its children Q1 and Q2 solved 29 and 28.

1. Compute the DGM selection weight $w = s \cdot h$ of P and Q, with $s = 1 / (1 + e^{-10(\alpha - 0.5)})$ and $h = 1 / (1 + n_{\text{children}})$.
2. Compute the HGM clade estimate of P and Q: clade successes divided by clade evaluations.
3. Which of P and Q does each method prefer, and why?
4. Over all six agents, the DGM's selection probabilities are: P 10.6%, P1 11.7%, P2 13.5%. Then Q 5.8%, Q1 30.1% and Q2 28.2%. What does this add?

```check
{
  "question": "Compare the DGM weight and the HGM clade estimate for P and Q.",
  "answer": "1. P: α = 0.60, s = 1 / (1 + e^(-1)) = 0.731, h = 1/3, w = 0.244. Q: α = 0.46, s = 1 / (1 + e^(0.4)) = 0.401, h = 1/3, w = 0.134. The DGM prefers P.\n2. P's clade: (30 + 20 + 21) / 150 = 0.473. Q's clade: (23 + 29 + 28) / 150 = 0.533. The clade estimate prefers Q.\n3. The DGM looks at each agent's own score, and P scores higher. The clade estimate looks at what the agent's line produced, and Q's children are much better than P's. The HGM paper found that clade-based signals predict later success better: 0.778 against 0.285 to 0.444 on SWE-Verified-60.\n4. The DGM still sends most selections into Q's clade, through the high-scoring children Q1 and Q2 (58.3% together). So the two methods disagree on internal nodes more than on leaves. The clade signal enters the DGM only indirectly, through each child's own score."
}
```

**Exercise 14: the returns model.** Use the model of [L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement): doubling $j$ takes $T_0 \cdot 2^{\,j(1/r - 1)}$. Take $T_0 = 1$ year. Use $r = 0.8$ (the estimate for computer chess) and $r = 1.4$ (the median for computer vision).

1. Give the times of doublings 0 to 4 for each value.
2. Give the total time for these five doublings.
3. Give two reasons why this is not a forecast for AI.

```check
{
  "question": "Compute five doubling times for r = 0.8 and r = 1.4, and explain why this is not a forecast.",
  "answer": "1. For r = 0.8, the factor is 1.189. The times are 1.000, 1.189, 1.414, 1.682 and 2.000 years. For r = 1.4, the factor is 0.820. The times are 1.000, 0.820, 0.673, 0.552 and 0.453 years.\n2. r = 0.8: 7.29 years. r = 1.4: 3.50 years. All doublings together would take 5.57 years for r = 1.4, and forever for r = 0.8.\n3. Reasons: the r values come from other fields, with wide intervals. The computer-vision median of 1.4 has a 5th to 95th percentile range of 0.8 to 2.4. The model also assumes that research effort grows with software capability, that hardware is not a bottleneck, and that r stays constant. Eth and Davidson lower their estimate to about 0.5 to 2 with fixed hardware. They also say that r must fall toward 0 near physical limits."
}
```

### 4.6 Design your own test

**Exercise 15: test a strong claim.** A team claims that its improver improves itself. It also claims that the improved improver produces larger gains on new task families than the original. Design the experiment. Give the arms, the split, the budget, the seeds, the metric and the one comparison that tests the claim. Estimate the number of test tasks for a 5-point difference in gain.

```check
{
  "question": "Design the experiment for the claim that the improved improver produces larger gains on new task families.",
  "answer": "1. Split: training task families for the self-improvement phase. Then held-out task families, never seen, for the test phase.\n2. Phase 1: run the self-improvement loop to get the improved improver. Keep the original improver as well.\n3. Phase 2, the key comparison: start from the same initial agent on each held-out family. Run the original improver and the improved improver with the same budget of iterations, calls and money. Measure the gain that each produces on held-out test tasks of that family. This is the design of STOP's Table 1 and of the imp@50 metric of Hyperagents.\n4. Arms in phase 2: no change, an equal-compute baseline, a random proposer, the original improver and the improved improver.\n5. Seeds: at least 3 per arm. Report all seeds.\n6. Metric: the gain over the initial agent, paired on the same test tasks, preregistered.\n7. Size: to detect a 5-point difference at a per-task correlation of 0.5, you need about 785 paired test tasks. Spread them across families.\nThe claim holds only if the improved improver's gain beats the original's gain by more than the noise. This must hold on families that the self-improvement phase never saw."
}
```

## 6. Video and animation

- [Darwin Gödel Machine Explained: Self-Improving AI Agents](https://www.youtube.com/watch?v=KptCerr9D5I) (AI Papers Academy, 2025). A short explainer of the DGM's loop and results. Watch it before Exercises 8, 9 and 13.
- [Adv. LLM Agents MOOC | UC Berkeley Sp25 | Inference-Time Techniques for LLM Reasoning by Xinyun Chen](https://www.youtube.com/watch?v=g0Dwtf3BH-0) (Xinyun Chen, Berkeley RDI, 2025). Part 3 covers self-correction and its limits. It supports Exercises 1 and 6.

## 8. Common mistakes

1. **"A large gain needs no statistics."** SICA's iteration 13 scored 27% and iteration 14 scored 53%. Single numbers on 50 tasks swing by many points.
2. **"Unpaired and paired tests give the same answer."** In Exercise 5, the unpaired $z$ was 1.00 and the paired $z$ was 1.98.
3. **"One evaluator is enough to measure a gain."** In Exercise 6, about 2.7 of 7.5 measured points came from the evaluator.
4. **"A higher own score means a better parent."** In Exercise 13, P scored higher than Q, but Q's line was more productive.
5. **"A ladder level is a grade of quality."** The levels describe what changes and where. A Level 2 system can beat a Level 5 system on a benchmark.
6. **"A definition dispute has one right answer."** It has a right method: state the definition, then check the evidence against it.

## 9. One-minute explanation

The advanced exercises train five skills that every serious reader of recursive self-improvement needs. You critique designs by walking line by line through who proposes, who evaluates, what is editable and what is reported. You compute uncertainty with standard errors, paired tests and the winner's curse, because most published results use 50 to 200 tasks.

You place systems on the ladder by asking what changes and whether the improver changes. You predict ablations and write acceptance rules with numeric thresholds. And you argue definitions from evidence, not from labels.

## 10. Check questions

```check
{
  "question": "Across the exercises, which single design choice protects best against the largest number of failures, and why?",
  "answer": "Keeping the evaluator outside the editable boundary, with hidden tests and harness-written logs. It blocks the exploits of Exercises 1 and 2, the evaluator effect of Exercise 6 and the self-evaluation problem. It does not solve noise, so it must be combined with paired tests on enough tasks (Exercises 3 to 5) and a held-out test set."
}
```

```check
{
  "question": "Exercises 4 and 10 both fight false acceptance. Name the two different mechanisms they use, and the cost of each.",
  "answer": "Exercise 4 uses a re-test of the winner on fresh tasks. Its cost is extra evaluation, here 600 tasks for an SE of 2 points. Exercise 10 uses a stricter threshold, a Bonferroni correction for 6 candidates, on a paired test. Its cost is lower power: candidate B, a possibly real 4-point gain, was rejected. Good loops use both."
}
```

```check
{
  "question": "Why does Exercise 15 compare gains produced by two improvers, and not the final scores of two agents?",
  "answer": "The claim is about the improver, not about one agent. A better final agent can come from luck, more compute or a better starting point. Starting both improvers from the same agent, with the same budget, on new task families, isolates the effect of the improver. Only then does a larger gain show a better process for making agents."
}
```

## 11. Summary and links

- Design critique means walking line by line through proposer, evaluator, boundary, selection and reporting.
- Results on 50 tasks have standard errors of 5 to 7 points. Pairing can halve the uncertainty, and the best of many scores is always too high.
- Ladder placement asks what changes and whether the improver changes. It is not a quality grade.
- Acceptance rules need integrity checks, regression protection, a corrected paired test, a cost limit and confirmation on fresh tasks.
- Definition disputes are settled by stating the definition and checking the evidence. For the DGM, the honest verdict is partial, scaffold-level RSI inside a fixed outer loop.

This is the last lesson of the course. Return to the [Course plan](/notes/ai/recursive-self-improvement/course-plan) to choose what to review, and use [Sources](/notes/ai/recursive-self-improvement/sources) and the [Video guide](/notes/ai/recursive-self-improvement/videos) for further study.

- Previous: [L4: Open problems, and how to read new RSI work](/notes/ai/recursive-self-improvement/10-advanced/l4-open-problems-and-how-to-read-new-work)
- Related: [P6: An acceptance rule with a validation suite](/notes/ai/recursive-self-improvement/09-build-it/p6-a-validation-gate), [P7: Regression tests and an archive](/notes/ai/recursive-self-improvement/09-build-it/p7-regression-tests-and-an-archive), [L7: Controls, oversight and governance](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance), [Glossary](/notes/ai/recursive-self-improvement/glossary)

## References

- Anthropic Institute (Marina Favaro, Phillie Wright). "Measurements for understanding the pace of AI development inside frontier labs". 2026. https://www.anthropic.com/institute/measuring-pace-of-ai-development
- Mingguang Chen, Licheng Wang, Bo Qu. "Recursive Self-Improvement in AI: From Bounded Self-Refinement to Autonomous Research Loops". 2026. arXiv:2607.07663. https://arxiv.org/pdf/2607.07663
- Yi Duan, Ying Liu, Zirui Tang, et al. "The Last AI Built by Humans: Toward Genuine Recursive Self-Improvement". 2026. arXiv:2609.11873. https://arxiv.org/abs/2609.11873
- Daniel Eth, Tom Davidson. "Will AI R&D Automation Cause a Software Intelligence Explosion?". Forethought. 2025. https://forethought.org/research/will-ai-r-and-d-automation-cause-a-software-intelligence-explosion
- Huan-ang Gao, Jiayi Geng, Wenyue Hua, et al. "A Survey of Self-Evolving Agents". 2025. arXiv:2507.21046. https://arxiv.org/abs/2507.21046
- Jinyuan Fang, Yanwen Peng, Xi Zhang, et al. "A Comprehensive Survey of Self-Evolving AI Agents". 2025. arXiv:2508.07407. https://arxiv.org/abs/2508.07407v2
- Shengran Hu, Cong Lu, Jeff Clune. "Automated Design of Agentic Systems". ICLR 2025. arXiv:2408.08435. https://arxiv.org/abs/2408.08435
- Jie Huang, Xinyun Chen, Swaroop Mishra, et al. "Large Language Models Cannot Self-Correct Reasoning Yet". ICLR 2024. arXiv:2310.01798. https://arxiv.org/abs/2310.01798
- Alexander Novikov, Ngân Vũ, Marvin Eisenberger, et al. "AlphaEvolve: A coding agent for scientific and algorithmic discovery". 2025. arXiv:2506.13131. https://arxiv.org/abs/2506.13131
- METR (S. Von Arx, L. Chan, B. Barnes). "Recent Frontier Models Are Reward Hacking". 5 June 2025. https://metr.org/blog/2025-06-05-recent-reward-hacking
- Chris Lu, Cong Lu, Robert Tjarko Lange, Jakob Foerster, Jeff Clune, David Ha. "The AI Scientist: Towards Fully Automated Open-Ended Scientific Discovery". 2024. arXiv:2408.06292. https://arxiv.org/abs/2408.06292
- Maxime Robeyns, Martin Szummer, Laurence Aitchison. "A Self-Improving Coding Agent". ICLR 2025 Workshop on Scaling Self-Improving Foundation Models. arXiv:2504.15228. https://arxiv.org/abs/2504.15228. Code: https://github.com/MaximeRobeyns/self_improving_coding_agent
- Sakana AI. "The Darwin Gödel Machine: AI that improves itself by rewriting its own code". 30 May 2025. https://sakana.ai/dgm/
- Noah Shinn, Federico Cassano, Edward Berman, Ashwin Gopinath, Karthik Narasimhan, Shunyu Yao. "Reflexion: Language Agents with Verbal Reinforcement Learning". NeurIPS 2023. arXiv:2303.11366. https://arxiv.org/abs/2303.11366
- Avi Singh, John D. Co-Reyes, Rishabh Agarwal, et al. "Beyond Human Data: Scaling Self-Training for Problem-Solving with Language Models". TMLR 2024. arXiv:2312.06585. https://arxiv.org/abs/2312.06585
- Guanzhi Wang, Yuqi Xie, Yunfan Jiang, et al. "Voyager: An Open-Ended Embodied Agent with Large Language Models". TMLR 2024. arXiv:2305.16291. https://arxiv.org/abs/2305.16291
- Xuezhi Wang, Jason Wei, Dale Schuurmans, et al. "Self-Consistency Improves Chain of Thought Reasoning in Language Models". ICLR 2023. arXiv:2203.11171. https://arxiv.org/abs/2203.11171
- Wenyi Wang, Piotr Piękos, Li Nanbo, et al. "Huxley-Gödel Machine: Human-Level Coding Agent Development by an Approximation of the Optimal Self-Improving Machine". ICLR 2026. arXiv:2510.21614. https://arxiv.org/abs/2510.21614
- Roman V. Yampolskiy. "From Seed AI to Technological Singularity via Recursively Self-Improving Software". 2015. arXiv:1502.06512. https://arxiv.org/abs/1502.06512
- Eric Zelikman, Eliana Lorch, Lester Mackey, Adam Tauman Kalai. "Self-Taught Optimizer (STOP): Recursively Self-Improving Code Generation". COLM 2024. arXiv:2310.02304. https://arxiv.org/abs/2310.02304
- Eric Zelikman, Yuhuai Wu, Jesse Mu, Noah D. Goodman. "STaR: Bootstrapping Reasoning With Reasoning". NeurIPS 2022. arXiv:2203.14465. https://arxiv.org/abs/2203.14465
- Jenny Zhang, Bingchen Zhao, Wannan Yang, et al. "Hyperagents". 2026. arXiv:2603.19461. https://arxiv.org/abs/2603.19461
- Jenny Zhang, Shengran Hu, Cong Lu, Robert Lange, Jeff Clune. "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents". ICLR 2026. arXiv:2505.22954. https://arxiv.org/abs/2505.22954. Code: https://github.com/jennyzzt/dgm
- Z. Zhong, A. Raghunathan, N. Carlini. "ImpossibleBench: Measuring LLMs' Propensity of Exploiting Test Cases". ICLR 2026. arXiv:2510.20270. https://arxiv.org/abs/2510.20270
