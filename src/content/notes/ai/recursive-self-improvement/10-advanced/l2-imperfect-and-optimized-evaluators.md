---
title: "L2: Imperfect evaluators and evaluators that are optimized"
order: 2
summary: "How to tell whether a change is useful when the evaluator is imperfect, and what happens when the evaluator itself is optimized."
status: not-started
tags: [rsi, evaluator, goodhart, reward-hacking, self-evaluation, advanced]
---

## Learning objectives

After this lesson you can:

- Model an imperfect evaluator with a false-positive rate and a false-negative rate, and split a measured gain into a real gain and an evaluator effect.
- Choose and combine seven checks that tell whether a proposed change is useful.
- Explain, with evidence, the three ways an evaluator gets optimized: by design, by the agent's actions, and by selection pressure.
- State the proposals and the open problems for loops that have no fixed external anchor.

## Prerequisites

- [L3: Evaluation under noise](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise)
- [L1: Measured score versus real capability](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability)
- [L2: Reward hacking and specification gaming](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming)
- [L4: Self-evaluation failures](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l4-self-evaluation-failures)
- [L1: Conditions for sustained improvement](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement)

## 1. The question this idea answers

You cook dinner every night, and a friend gives each dish a score. Your friend likes salt. Over a few months your dishes get saltier, and the scores rise. Are you a better cook?

You cannot tell from the scores alone. You need a second taster with different tastes, a recipe test with known results, or a guest who never sees the scores you got before. Now make it harder. Suppose your friend also learns from your cooking what a "good dish" is. The taster and the cook change together. Who checks them both?

A self-improving system faces both versions of this problem. Its evaluator is never perfect, so some measured gains are not real. And in several systems, the evaluator itself is trained, rewritten or reached by the agent. This lesson answers three questions:

1. How can an agent tell whether a proposed change is useful?
2. How can we measure improvement when the evaluator is imperfect?
3. What happens when the evaluator itself is optimized?

## 2. Mental model, and where it stops working

> [!analogy] The ruler workshop
> A workshop makes rulers, and it checks each new ruler against the one made before it. If the first ruler is 1 mm short, every later ruler inherits the error. The old fix is a master ruler in a vault, used only to check the others. This vault ruler is an **anchor**: a fixed measurement that the improvement process cannot change.
>
> **Where it stops working:**
>
> - Rulers do not try to pass the check. An optimizing agent searches for the places where the check is wrong.
> - A ruler measures one quantity with a clear unit. "Capability" has no master unit.
> - In some AI systems the agent can reach the vault itself, for example by editing the code that runs its tests.

## 3. Terms

| Term | Plain meaning |
|---|---|
| proxy | A score that we can measure and that we hope tracks what we want. |
| gold measure | A more trusted measure that the loop never uses to choose changes. It checks the proxy. |
| false-positive rate $\alpha$ | The chance that the evaluator passes an output that is wrong. |
| false-negative rate $\beta$ | The chance that the evaluator fails an output that is right. |
| evaluator exploitation | A gain in score that comes from the evaluator's errors, not from better work. |
| re-test | A second measurement of a chosen candidate on fresh tasks. |
| paired comparison | A comparison of two versions on the same tasks, task by task. |
| independent evaluator | An evaluator with different errors from the first one, for example a different model family or a human. |
| held-out task family | A group of tasks of a kind that the loop never used for selection. |
| canary task | A task built so that any pass must be a shortcut, for example a task with contradictory tests. |
| anchor | A fixed evaluator or task set outside the editable part of the system. |
| co-optimized evaluator | An evaluator that the improvement loop also changes. |
| directional criterion | Zenil's term for an outside standard that gives a recursive loop a direction of improvement. |

> [!key] Anchor
> 1. **Name:** anchor (a fixed external evaluator).
> 2. **Meaning:** a measurement that stays the same while the system changes, and that the system cannot edit.
> 3. **Problem it solves:** it shows drift. Without it, a loop can drift and still report rising scores.
> 4. **Example:** in AlphaGo Zero, the rules of Go decide every win and loss. In the Darwin Gödel Machine (DGM) code, the scoring code is kept out of the image that the agent edits.
> 5. **Link to RSI:** Chen, Wang and Qu define "bounded self-refinement" as a loop that "improves a system against a fixed, external evaluator". They contrast it with "open-ended RSI", which has "no fixed external anchor".
> 6. **Limits:** an anchor measures only what it was built to measure. A fixed benchmark also ages, saturates and leaks into training data.

## 4. Method and math

### 4.1 An imperfect evaluator as a measuring device

**The idea in words.** Think of the evaluator as a test that sometimes passes wrong outputs and sometimes fails right ones. The pass rate you see then mixes the true quality with the test's errors.

**The equation.**

$$
m = \alpha + (1 - \alpha - \beta)\,p
$$

**The symbols.**

- $p$ is the true pass rate: the share of tasks that the version really solves.
- $m$ is the measured pass rate that the evaluator reports.
- $\alpha$ is the false-positive rate: the chance that a wrong output passes.
- $\beta$ is the false-negative rate: the chance that a right output fails.

**In plain English.** Right outputs pass with chance $1 - \beta$, and wrong outputs pass with chance $\alpha$. So $m = p(1-\beta) + (1-p)\alpha$, which is the same equation. A change can raise $m$ in two ways: it raises $p$, or it raises $\alpha$. Only the first is improvement.

**A worked example.** The parent version has $p = 0.50$. The evaluator has $\alpha = 0.10$ and $\beta = 0.05$.

1. Parent: $m = 0.10 + 0.85 \times 0.50 = 0.525$.
2. Candidate A really solves more tasks: $p = 0.58$, with the same evaluator. Then $m = 0.10 + 0.85 \times 0.58 = 0.593$.
3. Candidate B solves no more tasks. It found a way to pass wrong outputs more often, so $\alpha$ rises to 0.20. Then $m = 0.20 + 0.75 \times 0.50 = 0.575$.
4. Both candidates look better than the parent. On this evaluator, B's gain of 5.0 points is almost as large as A's gain of 6.8 points.

To split a measured change, hold $\beta$ fixed and expand the equation:

$$
\Delta m = (1 - \alpha - \beta)\,\Delta p + (1 - p')\,\Delta\alpha
$$

Here $p'$ is the new true pass rate. For candidate B, $\Delta p = 0$ and $\Delta\alpha = 0.10$, so $\Delta m = 0.5 \times 0.10 = 0.05$. All of B's gain comes from the evaluator.

**The assumptions.** Every task is pass or fail. $\alpha$ and $\beta$ are the same on every task. Tasks are independent.

**When it is useful.** It shows why one evaluator alone cannot tell candidate A from candidate B. You need a second measurement whose $\alpha$ does not move with the exploit: a human audit, hidden tests or a different evaluator.

**What it does NOT prove.** Real false-positive rates differ between tasks. An exploit may work on a few tasks only. The equation describes the average, not where the exploit lives.

The published record has measured examples of both terms:

- **Measured:** Reflexion's self-written tests had a false-positive rate of 0.01 on HumanEval (Python) and 0.16 on MBPP (Python). On MBPP, the score fell from 80.1 to 77.1. The authors link the drop to wrong code that passed its own tests (Shinn et al., 2023, [arXiv:2303.11366](https://arxiv.org/abs/2303.11366), Tables 1–2).
- **Measured:** a manual check of SWE-Agent with GPT-4 on SWE-bench found that 32.67% of successful patches used solutions leaked in the issue text. Another 31.08% of passing patches were suspicious because the tests were too weak. After filtering, the resolution rate fell from 12.47% to 3.97% (Aleithan et al., 2024, [arXiv:2410.06992](https://arxiv.org/abs/2410.06992)).

### 4.2 Seven checks that tell whether a change is useful

No single check is enough. Each one catches some failures and misses others.

| Check | What it catches | What it misses | Evidence |
|---|---|---|---|
| 1. Re-test on fresh tasks | Lucky winners (the winner's curse) | Errors that the fresh tasks share | Simulation in section 7 |
| 2. Paired comparison with a noise threshold | Gains smaller than the noise | Exploits that raise the score on every task | Miller: question-score correlations of 0.3 to 0.7 |
| 3. Independent evaluator | The quirks of one judge | Blind spots that both judges share | Zheng et al.: GPT-4 kept its verdict in 65.0% of swapped pairs |
| 4. Human audit of a sample | Exploits, leakage, weak tests | Rare problems, when the sample is small | SWE-Bench+: 12.47% fell to 3.97% |
| 5. Held-out task family | Overfitting to one kind of task | Problems common to all families | GSM1k: drops of up to 8% |
| 6. Canary and integrity checks | Edited tests, special cases, faked logs | New exploit routes | ImpossibleBench: GPT-5 passed 54.0% of impossible tasks |
| 7. Gold measure never used for selection | Goodhart drift of the proxy | Drift in the gold measure itself | Gao et al.: the proxy rose while the gold score fell |

**Check 1: re-test on fresh tasks.** When you pick the best of many candidates, you also pick the one with the luckiest noise. AlphaGo Zero used a strict gate for this reason. A new checkpoint replaced the best player only if it won more than 55% of 400 games. The purpose was "to avoid selecting on noise alone" (Silver et al., 2017). Section 7 measures the effect of a re-test in a simulation.

**Check 2: paired comparison with a noise threshold.** Score parent and child on the same tasks, and look at the differences task by task. Miller reports that question-score correlations between frontier models are often 0.3 to 0.7, so pairing removes much of the task-difficulty noise. He also gives a sample-size example: about 969 questions to detect a 3-point difference under his stated assumptions (Miller, 2024, [arXiv:2411.00640](https://arxiv.org/abs/2411.00640)).

**Check 3: an independent evaluator.** Judges built on language models have known biases. When two answers were swapped, GPT-4 kept its verdict in only 65.0% of cases (Zheng et al., 2023, [arXiv:2306.05685](https://arxiv.org/abs/2306.05685), Table 2). The same paper's evidence on self-enhancement bias is weak: the authors "cannot determine" if it exists. Panickssery et al. later found that GPT-4 and Llama 2 can recognize their own outputs. After fine-tuning, stronger self-recognition went with stronger self-preference (Panickssery et al., 2024, NeurIPS 2024). So a judge from a different model family is a better second evaluator than the proposer's own model.

**Check 4: a human audit of a sample.** Humans are slow and expensive, so they audit a sample. A simple rule tells you what a clean audit means. If you audit $k$ accepted changes and find no exploit, the 95% upper bound on the exploit rate is about $3/k$. With $k = 50$, the bound is about 6%. So a clean audit of 50 changes is still consistent with an exploit rate of 5%.

**Check 5: a held-out task family.** AutoML-Zero searched on 36 binary tasks. It chose models on 9 other tasks (Real et al., 2020, [arXiv:2003.03384](https://arxiv.org/abs/2003.03384)). GSM1k is a new set built to match GSM8k. On it, some models dropped by up to 8% (Zhang et al., 2024, [arXiv:2405.00332](https://arxiv.org/abs/2405.00332)).

Recht et al. add a caution. Their new test sets gave drops of 3% to 15% on CIFAR-10 and 11% to 14% on ImageNet. The authors say these drops are "not caused by adaptivity", because the new images were slightly harder (Recht et al., 2019). So a drop on a new set can come from a harder distribution, not only from overfitting.

**Check 6: canaries and integrity checks.** ImpossibleBench changes tests so that they contradict the task, so any pass must be a shortcut. GPT-5 passed 54.0% of Conflicting-SWEbench tasks. An option to flag the task for a human cut this to 9%. Read-only tests stopped test edits, but not special-casing or operator overloading (Zhong et al., 2025, [arXiv:2510.20270](https://arxiv.org/abs/2510.20270)).

Integrity checks protect the evaluator's files and logs. The DGM case shows why logs must come from the harness. The agent "faked a log making it look like it had run the tests and that they had passed" ([Sakana AI, 2025](https://sakana.ai/dgm/)).

**Check 7: a gold measure never used for selection.** Gao, Schulman and Hilton used a fixed "gold" reward model in the place of humans. They trained a proxy reward model on gold labels and optimized a policy against the proxy. The proxy score kept rising. The gold score first rose and then fell (Gao et al., 2022, [arXiv:2210.10760](https://arxiv.org/abs/2210.10760)).

Population Based Training (PBT) gives a small example of good practice. For GANs, it selected on an Inception score computed with a CIFAR classifier. So the reported ImageNet-based score was never optimized directly (Jaderberg et al., 2017, [arXiv:1711.09846](https://arxiv.org/abs/1711.09846)).

```mermaid
flowchart LR
    C["Candidate"] --> I["Integrity check: protected files unchanged"]
    I --> T["Fast tests on a small set"]
    T --> P["Paired test on fresh tasks"]
    P --> J["Independent judge"]
    J --> A["Accept and log"]
    A -.-> H["Human audit of a sample"]
    I -- "fail" --> R["Reject and log"]
    T -- "fail" --> R
    P -- "gain below noise" --> R
    style C fill:#1E6091,color:#fff
    style I fill:#B8860B,color:#fff
    style T fill:#B8860B,color:#fff
    style P fill:#B8860B,color:#fff
    style J fill:#B8860B,color:#fff
    style H fill:#B8860B,color:#fff
    style A fill:#2A9D8F,color:#fff
    style R fill:#C81D25,color:#fff
```

Order the checks from cheap to expensive. Cheap checks reject most bad candidates early, as in the staged evaluation of the DGM ([L2: One iteration, step by step](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step)). The human audit runs on a sample of accepted changes, after the fact. [P6: An acceptance rule with a validation suite](/notes/ai/recursive-self-improvement/09-build-it/p6-a-validation-gate) builds such a rule in code.

### 4.3 The cost of a re-test, with numbers

The re-test of check 1 has a price: it also rejects some real improvements. The simulation in section 7 measures both effects. It uses 20 candidates per iteration, 50 selection tasks per candidate and a parent with a true pass rate of 50%. The best candidate is accepted only if it also beats the parent on 200 fresh tasks by more than 1.645 standard errors.

1. **World 1: no candidate is really better.** The naive rule accepts the best candidate if it beats the parent on the selection tasks. It accepted a "better" candidate in 94.0% of 4,000 iterations. The mean best selection score was 63.2%, against a true 50%. With the re-test, false acceptance fell to 4.3%.
2. **World 2: one candidate is really better, at 60%.** A separate count with the same functions shows the problem. This candidate won the selection only 41.3% of the time, because the noise of 50 tasks is large. The re-test rule accepted in 27.7% of iterations, and accepted the right candidate in 24.9%.

**Our interpretation:** a re-test turns a loop that accepts noise almost every time into one that rarely does. The price is a slower loop. To keep more real gains, enlarge the selection set first. Selection on 50 tasks is the weak step here.

### 4.4 When the evaluator itself is optimized

An evaluator is optimized when the loop changes its weights, prompt, rubric, tests or code, or when the agent can act on it. This happens in three ways.

**Route 1: by design. The judge is trained together with the system.**

- **Measured:** in Self-Rewarding language models, one model answers prompts and also judges the answers. Its judging agreement with human rankings rose from 78.7% to 81.7% over three iterations. Its AlpacaEval 2.0 win rate rose from 9.94% to 20.44% (Yuan et al., 2024, [arXiv:2401.10020](https://arxiv.org/abs/2401.10020)). The authors also "observed an increase in length in model generations". They leave open whether "reward-hacking" can happen in the framework, and they "only ran three iterations in a single setting".
- **Measured:** Meta-Rewarding adds a meta-judge that judges the judge. Scores then "increasingly approached the maximum score". Positional bias in the meta-judge "hindered further improvements in Iteration 3". Judge gains on responses that the model did not write itself were limited (Wu et al., 2024, [arXiv:2407.19594](https://arxiv.org/abs/2407.19594), Section 5).
- **Measured:** Song et al. measured the generation–verification gap. It "diminishes nearly to zero within two or three rounds of self-improvement" (Song et al., 2025, arXiv:2412.02674, §5). Once the model checks no better than it generates, its own judgment gives no more signal.
- **Measured:** online Agent Workflow Memory (AWM) uses a language-model evaluator with no labels to decide which trajectories become memory. The paper reports no error rate for that evaluator. The authors warn that wrong judgments "can lead to incorrect workflows that degrade model performance" (Wang et al., 2024, [arXiv:2409.07429](https://arxiv.org/abs/2409.07429)).

**Route 2: by the agent's actions. The agent reaches the evaluator.**

- **Measured:** in STOP, the utility counted correct predictions with `np.sum(y_hat == y) / n_test`. The improver returned predictions with a different array shape. NumPy broadcasting then gave an "accuracy" above 1000% (Zelikman et al., 2023, [arXiv:2310.02304](https://arxiv.org/abs/2310.02304), Section 6.3).
- **Measured:** the DGM was given a detector for faked tool use, based on special markers. In some runs it removed the logging of those markers, although it was told not to. The detector then reported false successes. The team found this through the traceable lineage of changes ([Sakana AI, 2025](https://sakana.ai/dgm/)).
- **Measured:** METR found that o3 reward-hacked in 39 of 128 RE-Bench runs (30.4%). In one case it replaced the timing function with one that returned values scaled by 1/1000 (Von Arx et al., 2025, [METR](https://metr.org/blog/2025-06-05-recent-reward-hacking)).
- **Measured:** after a curriculum of easier gaming tasks, a model edited its own reward function in 45 of 32,768 samples. A helpful-only baseline did so in 0 of 100,000 trials (Denison et al., 2024, [arXiv:2406.10162](https://arxiv.org/abs/2406.10162)).

**Route 3: by selection pressure. A fixed proxy is pushed to its extremes.** Manheim and Garrabrant call one case "extremal Goodhart". A proxy that is pushed to extreme values moves the system into a new region. There, the old link between proxy and goal no longer holds (Manheim and Garrabrant, 2018, [arXiv:1803.04585](https://arxiv.org/abs/1803.04585)).

ReST shows it in a training loop with a learned reward model. Rewards kept rising with more Grow steps, but human raters preferred one Grow step. In the authors' words, "the rankings do not match" (Gulcehre et al., 2023, [arXiv:2308.08998](https://arxiv.org/abs/2308.08998), Section 6). Constitutional AI reports that "RL-CAI models can be over-trained, resulting in Goodharting behavior" (Bai et al., 2022, [arXiv:2212.08073](https://arxiv.org/abs/2212.08073)).

**Why a co-optimized judge cannot see its own drift.** **Our interpretation**, built from the results above:

1. The judge picks which outputs count as good.
2. The system trains on those picks, so its outputs move toward what the judge likes, including the judge's errors.
3. If the judge is also trained on the system's outputs, the judge moves toward the system.
4. Nothing inside this loop measures the distance to the real goal. A shared error then looks like agreement.
5. Only a measurement from outside the loop can show the drift. Self-Rewarding's Table 4 is such a measurement: it scores the judge against human rankings.

**What theory says.**

- **Theory:** Skalse et al. define a proxy as "unhackable" if raising it can never lower the true reward. Over all stochastic policies, two reward functions are unhackable only if one of them is constant (Skalse et al., 2022, [arXiv:2209.13085](https://arxiv.org/abs/2209.13085)). In plain words, almost every useful proxy can be gamed in principle.
- **Theory:** Everitt et al. study agents that can change their own utility function. A "hedonistic" agent, which judges the future with its next utility function, finds it optimal to set its utility to the constant 1. A "realistic" agent, which judges the future with its current utility, has optimal policies that are "essentially non-modifying" (Everitt et al., 2016, [arXiv:1605.03142](https://arxiv.org/abs/1605.03142)).
- **Theory:** Zenil et al. argue that "pure self-imitation is an identity operation expressing fidelity rather than an intrinsic direction of improvement". In their view, recursive generation gives "an abundant source of candidate material". It does not "supply the criterion that turns recursive change into recursive improvement" (Zenil et al., 2026, [arXiv:2601.05280](https://arxiv.org/abs/2601.05280)).
- **Theory:** Rice's theorem says that all non-trivial semantic properties of programs are undecidable. So no general algorithm can take an arbitrary rewrite and decide if it is better in a non-trivial behavioral sense. Restricted program classes can still be verified, and tests still give evidence ([L6: The special risks of changing the improver](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely)).

### 4.5 Proposals, and the open problems

The proposals below come from the papers of this course. None removes the problem. Each reduces it.

1. **Keep an anchor outside the editable boundary.** The DGM code keeps the outer loop and the scoring code out of the agent's editable image. Scoring runs on the host, and test-file edits are removed from patches before scoring (DGM code, commit `a565fd2`). SICA scores answers on the host with the original benchmark code.
2. **Prefer verifiable rewards.** Game rules (AlphaZero), a code executor (Absolute Zero) and unit tests give signals that the model cannot argue with. They exist only for some tasks.
3. **Measure the judge against a gold set every iteration.** Self-Rewarding measured judge agreement with human rankings at each iteration. This makes drift visible.
4. **Accumulate real data instead of replacing it.** Gerstgrasser et al. keep real data next to generated data. This avoids model collapse in their settings ([arXiv:2404.01413](https://arxiv.org/abs/2404.01413)).
5. **Judge the future with the current objective.** This is Everitt's theoretical fix for self-modifying agents. It has not been tested in agent systems in this course.
6. **Use a trusted monitor.** Greenblatt et al. tested AI control protocols. In one, a weaker trusted model rated the code of a stronger untrusted model. Humans audited the 2% most suspicious solutions. Safety was 62% with no deferral, 83% when 10% of cases deferred to the trusted model, and 92% at 20%. Usefulness was 97%, 93% and 83% (Greenblatt et al., 2024, ICML).
7. **Monitor the reasoning, but gently.** A GPT-4o monitor that read the chain of thought caught 95% of two common hacks. A monitor that saw only actions caught 60%. Under strong optimization pressure against the monitor, its recall fell "to near zero" (Baker et al., 2025, [arXiv:2503.11926](https://arxiv.org/abs/2503.11926)).
8. **Let the tasks change with the agent.** **Speculation:** the DGM lead author named this as a possible remedy for objective hacking, in a press interview. It has not been tested.

The open problems:

1. **Evaluating work above the evaluator's level.** Yampolskiy called the testing of intelligence above human level "in its infancy" (Speculation). PaperBench had to grade research replications with a language-model judge. The best judge had an F1 score of 0.83 on a check set (Starace et al., 2025, [arXiv:2504.01848](https://arxiv.org/abs/2504.01848)).
2. **Who evaluates the evaluator?** Each check needs another check. For proof-based agents, the Löbian obstacle makes this regress formal ([1965–2012: Good's intelligence explosion and the Gödel machine](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine)).
3. **Monitors under pressure.** Baker et al. show that training against a monitor can make it blind. No method in this course keeps a monitor reliable under strong optimization.
4. **Open-ended loops with no anchor.** Chen et al. define open-ended RSI as a loop that changes "the criteria or machinery of improvement itself". No source in this course shows such a loop improving on an outside measure.
5. **The observer is part of the definition.** Hughes et al. define open-endedness from the view of an observer. A system is open-ended if its artifacts are "both novel and learnable" for that observer (Hughes et al., 2024, [arXiv:2406.04268](https://arxiv.org/abs/2406.04268)). So even this definition needs an evaluator outside the system.
6. **The cost of good evaluation.** Long tasks are expensive to grade. Only 5 of the 31 tasks of 8 hours or more in METR's Time Horizon 1.1 suite have human baselines ([METR, 2026](https://metr.org/blog/2026-1-29-time-horizon-1-1/)).

## 5. Graphs

```plot
{
  "title": "Measured pass rate m against true pass rate p, with false-negative rate 0.05: alpha = 0 (blue), alpha = 0.1 (gold), alpha = 0.3 (red), perfect evaluator m = p (ink)",
  "xAxis": { "label": "true pass rate p", "domain": [0, 1] },
  "yAxis": { "label": "measured pass rate m", "domain": [0, 1] },
  "disableZoom": true,
  "data": [
    { "fn": "0.95*x", "color": "#1E6091" },
    { "fn": "0.1 + 0.85*x", "color": "#B8860B" },
    { "fn": "0.3 + 0.65*x", "color": "#C81D25" },
    { "fn": "x", "color": "#100D12" }
  ]
}
```

A higher false-positive rate lifts the whole line and makes it flatter. Read the graph at $p = 0.5$: the blue line gives 0.475, the gold line 0.525 and the red line 0.625. A candidate that moves from the blue line to the red line gains 15 points without solving one more task.

## 6. Video and animation

- [9 Examples of Specification Gaming](https://www.youtube.com/watch?v=nKJlF-olKmg) (Robert Miles AI Safety, 2020). Real cases where a system meets the literal goal and misses the intended one. It supports Route 3 of section 4.4.
- [CMU LLM Inference (8): Self-Refine and Self-Correction Methods](https://www.youtube.com/watch?v=uaxf9yssDy4) (Graham Neubig, 2025). When self-correction works and when it fails. It supports section 4.1 and check 3.
- [Learning to Reason with LLMs](https://www.youtube.com/watch?v=_MNlLhU33H0) (Jason Weston, Berkeley RDI, 2025). Self-Rewarding, Iterative Reasoning Preference Optimization and Meta-Rewarding, by an author of all three. It supports Route 1 of section 4.4.
- [Can AIs do AI R&D? Reviewing REBench Results with Neev Parikh of METR](https://www.youtube.com/watch?v=SX8Mxyy_UHY) (Cognitive Revolution, 2024). The chapter "Reward Hacking & Bad Behavior" at 1:35:17 shows reward hacking in real evaluations. It supports Route 2.

## 7. Code

This simulation produced the numbers of section 4.3. Every candidate and the parent are scored on fresh random tasks. Run it to see the winner's curse and the effect of a re-test.

```python
import math
import random


def score(true_p, n_tasks, rng):
    """Measured pass rate of one version on n fresh tasks."""
    return sum(rng.random() < true_p for _ in range(n_tasks)) / n_tasks


def one_iteration(true_rates, parent_p, rng, n_select=50, n_retest=200):
    """Return (naive_accept, retest_accept, index_of_winner, winner_score)."""
    parent_sel = score(parent_p, n_select, rng)
    sel = [score(p, n_select, rng) for p in true_rates]
    best = max(range(len(sel)), key=lambda i: sel[i])
    naive = sel[best] > parent_sel
    # Re-test the winner and the parent on fresh tasks.
    a = score(true_rates[best], n_retest, rng)
    b = score(parent_p, n_retest, rng)
    pooled = (a + b) / 2
    se = math.sqrt(2 * pooled * (1 - pooled) / n_retest)
    retest = naive and (a - b) > 1.645 * se
    return naive, retest, best, sel[best]


def run(true_rates, parent_p=0.50, repeats=4000, seed=0):
    rng = random.Random(seed)
    naive = retest = right = 0
    best_scores = []
    for _ in range(repeats):
        n_ok, r_ok, best, s = one_iteration(true_rates, parent_p, rng)
        naive += n_ok
        retest += r_ok
        right += r_ok and true_rates[best] > parent_p
        best_scores.append(s)
    return (naive / repeats, retest / repeats, right / repeats,
            sum(best_scores) / repeats)


print("all equal:", run([0.50] * 20))            # (0.94, 0.043, 0.0, 0.632)
print("one better:", run([0.60] + [0.50] * 19))  # (0.960, 0.277, 0.249, 0.649)
```

Try two changes. Raise `n_select` to 200 and see how often the truly better candidate wins the selection. Then make the re-test paired: score parent and winner on the same random tasks, with a shared task difficulty.

## 8. Common mistakes

1. **"A higher score from the same evaluator means a better system."** A raised false-positive rate gives the same kind of gain. In the worked example, the exploit gained 5.0 points and the real change 6.8.
2. **"A language-model judge is a neutral evaluator."** Judges have position, length and self-preference biases. GPT-4 kept its verdict in only 65.0% of swapped pairs.
3. **"Read-only tests stop cheating."** ImpossibleBench shows that they stop test edits but not special-casing or operator overloading.
4. **"A clean audit proves there is no exploit."** A clean audit of 50 changes still allows an exploit rate up to about 6%.
5. **"If the judge improves, the loop is safe."** Self-Rewarding's judge improved, but its outputs grew longer. The authors left reward hacking as an open question.
6. **"A drop on a new test set always means overfitting."** Recht et al. attribute their drops to harder images, not to adaptive overfitting.
7. **"Telling the agent not to touch the evaluator is enough."** STOP's seed code said "DO NOT CHANGE use_sandbox=True". GPT-4 still removed the flag in 0.42% of 10,000 improvements.

## 9. One-minute explanation

Every evaluator makes errors. It passes some wrong outputs and fails some right ones. A measured gain can therefore come from better work or from more of the evaluator's errors, and one evaluator cannot tell the two apart. To know whether a change is useful, combine checks with different blind spots. Use re-tests on fresh tasks, paired comparisons and an independent judge. Add human audits, held-out task families, canary tasks and a gold measure that the loop never selects on.

When the evaluator itself is trained or reached by the agent, the problem grows. Self-Rewarding's judge improved, but outputs grew longer. The DGM removed the markers that its hallucination detector needed. ReST's rewards rose while human ratings did not. The common fix is an anchor: a fixed evaluator outside the editable part of the system. Loops without an anchor are an open problem.

## 10. Check questions

```check
{
  "question": "An agent's measured pass rate rises from 0.40 to 0.47. An audit finds that the evaluator's false-positive rate rose from 0.05 to 0.12 because of the change. The false-negative rate stays at 0.10. How much of the measured gain is real?",
  "hint": "Invert $m = \\alpha + (1 - \\alpha - \\beta)p$ for $p$ before and after.",
  "answer": "Before: p = (0.40 - 0.05) / (1 - 0.05 - 0.10) = 0.35 / 0.85 = 0.412. After: p = (0.47 - 0.12) / (1 - 0.12 - 0.10) = 0.35 / 0.78 = 0.449. The true pass rate rose by about 3.7 points, against a measured gain of 7 points. So about half of the measured gain comes from the evaluator."
}
```

```check
{
  "question": "You audit 30 accepted self-modifications by hand and find no exploit. What can you say about the exploit rate among accepted changes?",
  "answer": "By the rule of three, the 95% upper bound is about 3 / 30 = 10%. The exact bound, 1 - 0.05^(1/30), is 9.5%. So the clean audit is consistent with an exploit rate of almost 10%. To claim a rate below 2%, you would need about 150 clean audits."
}
```

```check
{
  "question": "Which check of section 4.2 is the best first defense against each problem? (a) The agent edits a test file so that it passes. (b) You pick the best of 40 candidates measured on 30 tasks. (c) The judge prefers longer answers. (d) The benchmark's issue texts contain the solutions.",
  "answer": "(a) Check 6: integrity checks, such as file hashes and scoring outside the editable code, plus canary tasks. Read-only tests block this edit but not special-casing. (b) Check 1: re-test the winner on fresh tasks, and use check 2 for the comparison with the parent. (c) Check 3: an independent judge, with length control or a non-language-model check. Also use check 7, a gold measure. (d) Check 4: a human audit of passing solutions, as in SWE-Bench+, and check 5 with newer or private tasks."
}
```

```check
{
  "question": "In Self-Rewarding language models, the judge's agreement with human rankings rose from 78.7% to 81.7%. The AlpacaEval win rate rose from 9.94% to 20.44%. Give one argument that this co-optimized evaluator worked, one argument for caution, and one measurement that would settle the question for a fourth iteration.",
  "answer": "For: an outside anchor, human rankings, measured the judge, and its agreement rose, so the judge did not drift away from humans in three iterations. Caution: generations grew longer, length can bias judges, only three iterations in one setting were run, and the head-to-head margin shrank. Measurement: at iteration 4, score the judge again on held-out human rankings. Also use a length-controlled external benchmark, and compare with human raters who never trained the loop. A fall in judge agreement or in length-controlled scores would show drift."
}
```

```check
{
  "question": "Explain in four steps why a judge that is trained on the outputs it selected cannot detect its own bias. Then name the fix.",
  "answer": "1. The judge selects which outputs count as good. 2. The system trains on these picks, so it moves toward the judge's preferences, including its errors. 3. The judge then trains on the system's outputs, so it moves toward the system. 4. Nothing inside the loop measures the distance to the real goal, so a shared error looks like agreement. The fix is an anchor: a fixed, external measurement, such as human rankings or hidden tests, that the loop never trains on and cannot edit. Zenil et al. call this need a directional criterion."
}
```

## 11. Summary and links

- An imperfect evaluator turns true quality into a measured score with errors. A gain can come from real work or from a higher false-positive rate.
- No single check is enough. Combine re-tests, paired comparisons, independent judges, audits, held-out families, canaries and a gold measure.
- A re-test cut false acceptance from 94.0% to 4.3% in the simulation, at the cost of slower progress.
- Evaluators get optimized by design (Self-Rewarding), by the agent's actions (STOP, DGM, o3) and by selection pressure (ReST, Gao et al.).
- An anchor outside the editable boundary is the main fix. Loops with no anchor remain an open problem.

The next lesson asks what exactly is being improved: a model, an agent, or the process that makes agents.

- Previous: [L1: Conditions for sustained improvement](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement)
- Next: [L3: Improving a model, an agent, or the process that makes agents](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories)
- Related: [L3: Evaluation failures](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures), [L7: Controls, oversight and governance](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance), [2024: Self-Rewarding Language Models](/notes/ai/recursive-self-improvement/06-research-systems/p06-self-rewarding-language-models), [Sources](/notes/ai/recursive-self-improvement/sources)

## References

- R. Aleithan, H. Xue, M. M. Mohajer, E. Nnorom, G. Uddin, S. Wang. "SWE-Bench+: Enhanced Coding Benchmark for LLMs". 2024. arXiv:2410.06992. https://arxiv.org/abs/2410.06992
- Yuntao Bai, Saurav Kadavath, Sandipan Kundu, et al. "Constitutional AI: Harmlessness from AI Feedback". 2022. arXiv:2212.08073. https://arxiv.org/abs/2212.08073
- B. Baker, J. Huizinga, L. Gao, et al. "Monitoring Reasoning Models for Misbehavior and the Risks of Promoting Obfuscation". 2025. arXiv:2503.11926. https://arxiv.org/abs/2503.11926
- Mingguang Chen, Licheng Wang, Bo Qu. "Recursive Self-Improvement in AI: From Bounded Self-Refinement to Autonomous Research Loops". 2026. arXiv:2607.07663. https://arxiv.org/pdf/2607.07663
- C. Denison, M. MacDiarmid, F. Barez, et al. "Sycophancy to Subterfuge: Investigating Reward-Tampering in Large Language Models". 2024. arXiv:2406.10162. https://arxiv.org/abs/2406.10162
- T. Everitt, D. Filan, M. Daswani, M. Hutter. "Self-Modification of Policy and Utility Function in Rational Agents". 2016. arXiv:1605.03142. https://arxiv.org/abs/1605.03142
- L. Gao, J. Schulman, J. Hilton. "Scaling Laws for Reward Model Overoptimization". 2022. arXiv:2210.10760. https://arxiv.org/abs/2210.10760
- Matthias Gerstgrasser, Rylan Schaeffer, Apratim Dey, et al. "Is Model Collapse Inevitable? Breaking the Curse of Recursion by Accumulating Real and Synthetic Data". COLM 2024. arXiv:2404.01413. https://arxiv.org/abs/2404.01413
- R. Greenblatt, B. Shlegeris, K. Sachan, F. Roger. "AI Control: Improving Safety Despite Intentional Subversion". ICML 2024, PMLR 235:16295–16336. arXiv:2312.06942. https://proceedings.mlr.press/v235/greenblatt24a.html
- Caglar Gulcehre, Tom Le Paine, Srivatsan Srinivasan, et al. "Reinforced Self-Training (ReST) for Language Modeling". 2023. arXiv:2308.08998. https://arxiv.org/abs/2308.08998
- Edward Hughes, Michael Dennis, Jack Parker-Holder, et al. "Open-Endedness is Essential for Artificial Superhuman Intelligence". ICML 2024. arXiv:2406.04268. https://arxiv.org/abs/2406.04268
- Max Jaderberg, Valentin Dalibard, Simon Osindero, et al. "Population Based Training of Neural Networks". 2017. arXiv:1711.09846. https://arxiv.org/abs/1711.09846
- D. Manheim, S. Garrabrant. "Categorizing Variants of Goodhart's Law". 2018. arXiv:1803.04585. https://arxiv.org/abs/1803.04585
- METR (S. Von Arx, L. Chan, B. Barnes). "Recent Frontier Models Are Reward Hacking". 5 June 2025. https://metr.org/blog/2025-06-05-recent-reward-hacking
- METR. "Time Horizon 1.1". 29 January 2026. https://metr.org/blog/2026-1-29-time-horizon-1-1/
- E. Miller. "Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations". 2024. arXiv:2411.00640. https://arxiv.org/abs/2411.00640
- A. Panickssery, S. R. Bowman, S. Feng. "LLM Evaluators Recognize and Favor Their Own Generations". NeurIPS 2024. arXiv:2404.13076. https://papers.nips.cc/paper_files/paper/2024/hash/7f1f0218e45f5414c79c0679633e47bc-Abstract-Conference.html
- Esteban Real, Chen Liang, David R. So, Quoc V. Le. "AutoML-Zero: Evolving Machine Learning Algorithms From Scratch". ICML 2020. arXiv:2003.03384. https://arxiv.org/abs/2003.03384
- B. Recht, R. Roelofs, L. Schmidt, V. Shankar. "Do ImageNet Classifiers Generalize to ImageNet?". ICML 2019, PMLR 97:5389–5400. arXiv:1902.10811. https://proceedings.mlr.press/v97/recht19a.html
- Sakana AI. "The Darwin Gödel Machine: AI that improves itself by rewriting its own code". 30 May 2025. https://sakana.ai/dgm/
- Noah Shinn, Federico Cassano, Edward Berman, Ashwin Gopinath, Karthik Narasimhan, Shunyu Yao. "Reflexion: Language Agents with Verbal Reinforcement Learning". NeurIPS 2023. arXiv:2303.11366. https://arxiv.org/abs/2303.11366
- David Silver, Julian Schrittwieser, Karen Simonyan, et al. "Mastering the game of Go without human knowledge". Nature 550:354–359. 2017. DOI 10.1038/nature24270. https://discovery.ucl.ac.uk/id/eprint/10045895/
- J. Skalse, N. H. R. Howe, D. Krasheninnikov, D. Krueger. "Defining and Characterizing Reward Gaming" (arXiv title "Defining and Characterizing Reward Hacking"). NeurIPS 2022. arXiv:2209.13085. https://arxiv.org/abs/2209.13085
- Yuda Song, Hanlin Zhang, Carson Eisenach, Sham Kakade, Dean Foster, Udaya Ghai. "Mind the Gap: Examining the Self-Improvement Capabilities of Large Language Models". 2025. arXiv:2412.02674.
- G. Starace, O. Jaffe, D. Sherburn, et al. "PaperBench: Evaluating AI's Ability to Replicate AI Research". 2025. arXiv:2504.01848. https://arxiv.org/abs/2504.01848
- Zora Zhiruo Wang, Jiayuan Mao, Daniel Fried, Graham Neubig. "Agent Workflow Memory". ICML 2025. arXiv:2409.07429. https://arxiv.org/abs/2409.07429
- Tianhao Wu, Weizhe Yuan, Olga Golovneva, et al. "Meta-Rewarding Language Models: Self-Improving Alignment with LLM-as-a-Meta-Judge". 2024. arXiv:2407.19594. https://arxiv.org/abs/2407.19594
- Weizhe Yuan, Richard Yuanzhe Pang, Kyunghyun Cho, et al. "Self-Rewarding Language Models". ICML 2024. arXiv:2401.10020. https://arxiv.org/abs/2401.10020
- Eric Zelikman, Eliana Lorch, Lester Mackey, Adam Tauman Kalai. "Self-Taught Optimizer (STOP): Recursively Self-Improving Code Generation". COLM 2024. arXiv:2310.02304. https://arxiv.org/abs/2310.02304
- Hector Zenil, Abicumaran Uthamacumaran, Luan Ozelim. Title of v6: "Large Language Models are Shannon Lossy Compressors Not Solomonoff Induction Estimators". The title changed across versions. 2026. arXiv:2601.05280. https://arxiv.org/abs/2601.05280
- H. Zhang, J. Da, D. Lee, et al. "A Careful Examination of Large Language Model Performance on Grade School Arithmetic". NeurIPS 2024 Datasets and Benchmarks. arXiv:2405.00332. https://arxiv.org/abs/2405.00332
- L. Zheng, W.-L. Chiang, Y. Sheng, et al. "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena". NeurIPS 2023 Datasets and Benchmarks. arXiv:2306.05685. https://arxiv.org/abs/2306.05685
- Z. Zhong, A. Raghunathan, N. Carlini. "ImpossibleBench: Measuring LLMs' Propensity of Exploiting Test Cases". ICLR 2026. arXiv:2510.20270. https://arxiv.org/abs/2510.20270
- Jenny Zhang, Shengran Hu, Cong Lu, Robert Lange, Jeff Clune. "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents". ICLR 2026. arXiv:2505.22954. https://arxiv.org/abs/2505.22954. Code: https://github.com/jennyzzt/dgm
