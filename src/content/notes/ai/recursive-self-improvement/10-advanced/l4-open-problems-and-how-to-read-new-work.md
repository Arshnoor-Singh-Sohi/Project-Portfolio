---
title: "L4: Open problems, and how to read new RSI work"
order: 4
summary: "The strongest open questions, the active research directions, a checklist for reading a new paper, and how to design your own experiment."
status: not-started
tags: [rsi, open-problems, research-methods, checklist, experiment-design, advanced]
---

## Learning objectives

After this lesson you can:

- Name ten open problems of recursive self-improvement (RSI) research, and say what evidence would settle each one.
- Describe the active research directions in 2026, including the six lenses of the ICLR 2026 workshop.
- Apply a 16-question checklist to a new RSI paper, and find its weak points.
- Design your own experiment with a preregistered metric, a held-out set, a fixed budget, the right ablations and a cost report.
- Compute how many tasks a paired comparison needs to detect a given gain.

## Prerequisites

- [L1: How to read a research repository](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository)
- [L3: Evaluation under noise](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise)
- [L3: Evaluation failures: leakage, overfitting, noise and regression](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures)
- [L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement), [L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators) and [L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories) of this part

## 1. The question this idea answers

A press release says: "Our agent improved itself and tripled its score." What do you ask first?

A doctor who reads a drug trial asks a fixed set of questions. Which patients? Compared with what? Who measured the outcome, and did they know who got the drug?

How many patients were there, and how sure is the result? Did the researchers fix the outcome before they started, or choose it later? A good reader of recursive self-improvement (RSI) papers needs the same habit.

The field moves fast. Between 2023 and 2026, many papers claimed self-improving agents. Some of their headline numbers changed between versions. Some of their code does something other than the paper describes. And several famous results rest on one run on 50 or 60 tasks. This lesson gives you three tools: a map of what is still open, a checklist for reading, and a method for designing your own experiment.

## 2. Mental model, and where it stops working

> [!analogy] Reading an RSI paper like a drug trial
> A trial report names the patients, the treatment, the control group and the outcome measure. In an RSI paper, these are the tasks, the change, the baseline and the metric. The report also names the measurer (the evaluator) and the plan that was fixed in advance (the preregistration). You trust a trial when three things hold. The outcome was fixed before the data arrived, the measurer could not be influenced, and the control group got equal care.
>
> **Where it stops working:**
>
> - Patients do not rewrite the thermometer. A self-modifying agent sometimes can reach its evaluator.
> - In a drug trial the drug stays the same. In an RSI run, the treatment changes itself during the trial.
> - A trial has one outcome per patient. An RSI run produces a whole curve over iterations, and the reader must ask which point on the curve is reported.

## 3. Terms

| Term | Plain meaning |
|---|---|
| preregistration | A written plan of the metric, the comparison and the analysis, fixed and dated before the experiment runs. |
| primary metric | The one score that decides the main claim. |
| baseline | The version or method that the new system is compared with. |
| equal-compute baseline | A baseline that gets the same budget of calls, tokens or money as the new system. |
| ablation | A run with one part of the system removed, to measure what that part contributes. |
| selection set | The tasks used to choose between versions during the run. |
| held-out test set | Tasks used once, at the end, to report the result. |
| contamination | Benchmark tasks or their solutions are present in the model's training data or in the task text. |
| effect size | The size of the gain that you want to detect, for example 5 percentage points. |
| statistical power | The chance that an experiment detects a real effect of a given size. |
| code-versus-paper difference | A place where the released code does something other than the paper describes. |
| commit hash | The identifier of one exact version of a code repository. |

> [!key] Preregistration
> 1. **Name:** preregistration.
> 2. **Meaning:** you write down, before the run, the metric, the main comparison, the acceptance rule, the stopping rule and the analysis. Then you store it with a date.
> 3. **Problem it solves:** without it, you can choose the metric, the iteration or the subset that looks best after you see the results.
> 4. **Example:** "Primary metric: pass rate on 300 held-out tasks at iteration 40. Compare with the equal-compute baseline. Report all 3 seeds."
> 5. **Link to RSI:** an RSI run produces many versions and many scores. That creates many ways to report a lucky one.
> 6. **Limits:** preregistration does not stop contamination, evaluator gaming or a bad metric. It only stops choices made after looking at the data.

## 4. Method and math

### 4.1 Ten open problems

The table lists the strongest open questions that this course has met. Each row says what we know and what result would settle the question.

| # | Open problem | Evidence so far | What would settle it |
|---|---|---|---|
| 1 | Can an improver improve itself again and again, with gains that compound? | STOP improved its improver in 1 to 3 rounds with GPT-4. Meta-Rewarding's scores saturated. | Many rounds, with the gain per round measured on fresh tasks at equal budget |
| 2 | Does skill at tasks predict skill at self-improvement? | HGM: score signals correlate 0.27 to 0.44 with the success of descendants. | Measured correlations across many systems and domains |
| 3 | Can evaluation stay as strong as the system it checks? | Self-correction without outside feedback fails on reasoning. Judges have biases. | Evaluators whose accuracy is checked against a fixed anchor at every iteration |
| 4 | Can a loop improve with no fixed external anchor? | No system in this course shows it. Chen et al. call such loops open-ended RSI. | Gains on an outside measure that the loop never saw |
| 5 | Do scaffold gains transfer, and survive contamination? | DGM transfer to Claude 3.7 Sonnet: 19.0% to 59.5%. OpenAI stopped reporting SWE-bench Verified. | Gains on new, private or time-split tasks and on other models |
| 6 | Are the returns $r$ to AI research above 1? | Historical estimates of about 1 to 4, or 0.5 to 2 with fixed hardware | Measured $r$ for AI systems that do AI research |
| 7 | Can self-modification be kept safe? | Sandbox removal in STOP, marker removal in the DGM, tampering in 45 of 32,768 samples | Controls that hold under strong optimization pressure, with measured failure rates |
| 8 | How should AI research automation be measured? | METR time horizons, RE-Bench, MLE-bench, PaperBench, Anthropic's index. Anthropic's own threshold "has proven difficult to operationalize". | Metrics that predict real acceleration and resist cheating |
| 9 | Can weight updates and code changes be combined safely? | The DGM names "rewriting its own training script" as future work. SEAL reports forgetting. | A loop that changes both and keeps old skills |
| 10 | Can a system stay open-ended? | Hughes et al. define open-endedness as "novel and learnable" for an observer. The original POET plateaued. | A stream of new, learnable artifacts that does not stop within a long run |

Rows 1, 2 and 9 draw on Zelikman et al. (2023), Wu et al. (2024) and Wang et al. (2025). They also draw on Zhang et al. (2025) and Zweiger et al. (2025). Row 6 from Eth and Davidson (2025). Rows 7 and 8 from the sources of [L7: Controls, oversight and governance](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance). Row 10 from Hughes et al. (2024) and Wang et al. (2020).

### 4.2 Active research directions in 2026

**The ICLR 2026 workshop.** The ICLR 2026 Workshop on AI with Recursive Self-Improvement took place on 26 April 2026 in Rio de Janeiro. Its call for papers organized the field by six lenses ([workshop site](https://recursive-workshop.github.io/)):

1. What changes: parameters, world models, memory, tools and skills, architectures.
2. When changes happen: within an episode, at test time, after deployment.
3. How changes are produced: reward and value learning, imitation, evolutionary search.
4. Where systems operate: web and user interfaces, games, robotics, science, enterprise.
5. Alignment, security and safety: long-horizon stability, regression risk.
6. Evaluation and benchmarks.

The workshop wants "loops that actually get better — and can show it". Its meaning of RSI is broad: it includes loops that "rewrite prompts". (The ICLR virtual page mentions five lenses. The workshop's own site lists six.)

**The surveys.** Four surveys map the field from different angles.

- Gao et al. organize self-evolving agents by what, when, how and where to evolve (Gao et al., 2025, [arXiv:2507.21046](https://arxiv.org/abs/2507.21046)).
- Fang et al. propose three "laws": keep safety, keep or improve performance, then evolve. They say current systems are "far from exhibiting the full capabilities required for safe, robust and open-ended self-evolution" (Fang et al., 2025, [arXiv:2508.07407](https://arxiv.org/abs/2508.07407v2)).
- Chen, Wang and Qu reviewed 1,250 papers from 2024 to 2026. They sort them by what improves and by how closed the loop is. Most of the literature sits at stages 3 to 4 of Anthropic's spectrum. Their Section 6 probes stage 5 (Chen et al., 2026, [arXiv PDF 2607.07663](https://arxiv.org/pdf/2607.07663)).
- Duan et al. define five autonomy levels, L1 to L5. L5 changes "the mechanism that governs later improvement" (Duan et al., 2026, [arXiv:2609.11873](https://arxiv.org/abs/2609.11873)).

**Better selection of what to improve.** The Huxley-Gödel Machine (HGM) chooses parents by the success of their whole clade, not by their own score. With 800 task evaluations it reached 56.7% on a 60-task subset of SWE-bench Verified, against 53.3% for the DGM. It used 517 CPU-hours, against 1,231 for the DGM (Wang et al., 2025, [arXiv:2510.21614](https://arxiv.org/abs/2510.21614)).

**Editable meta levels.** Hyperagents puts the task agent and the meta agent into one editable program. So the procedure that modifies agents can itself be modified. Parent selection and evaluation stay fixed in the main experiments (Zhang et al., 2026, [arXiv:2603.19461](https://arxiv.org/abs/2603.19461)).

**Measurement of AI research automation.** METR's time-horizon metric is the length of human tasks that an AI completes with 50% success. It doubled roughly every seven months since 2019 (Kwa et al., 2025, [arXiv:2503.14499](https://arxiv.org/abs/2503.14499)). With the updated task suite, the doubling time from 2024 onward is 88.6 days ([METR, 2026](https://metr.org/blog/2026-1-29-time-horizon-1-1/)). RE-Bench, MLE-bench and PaperBench measure research engineering directly ([2024–2026: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research)).

**Other active lines.** Several other lines appear in this course:

- SEAL trains a model to write its own fine-tuning data (Zweiger et al., 2025, [arXiv:2506.10943](https://arxiv.org/abs/2506.10943)).
- Absolute Zero proposes and solves its own coding tasks, checked by a Python executor (Zhao et al., 2025, [arXiv:2505.03335](https://arxiv.org/abs/2505.03335)).
- Live-SWE-agent changes its own scaffold while it solves each task. **Claimed:** 77.4% on SWE-bench Verified without test-time scaling (Xia et al., 2025, [arXiv:2511.13646](https://arxiv.org/abs/2511.13646)).

### 4.3 A checklist for reading a new RSI paper

Read with these 16 questions. The last column gives an example from this course where the question mattered.

| # | Question | Red flag | Example from this course |
|---|---|---|---|
| 1 | What exactly changes: weights, prompts, memory, code, or the improver? | The paper says "self-improving" but never names what changes. | ACE calls itself self-improving. Only its context changes. |
| 2 | What is frozen: the model, the evaluator, the outer loop, the selection rule? | Frozen parts are not listed. | The DGM's parent selection and archive rule are fixed. |
| 3 | Who proposes the change, and who evaluates it? Is it the same model? | The proposer also judges success. | Huang et al.: intrinsic self-correction lowered scores. |
| 4 | Is the improver itself improved, and is that measured separately? | Only final task scores are shown. | STOP compares the seed and the improved improver on the same tasks. |
| 5 | Which data choose the winner, and which data report it? | The same tasks select and report. | DSPy passed its dev set as the selection set. EvoPrompt took its dev set from the test set. |
| 6 | How many tasks, runs and seeds? Are there error bars? | One run on 50 tasks, no intervals. | SICA: 50 tasks, so each task is 2 points. |
| 7 | Do the baselines get the same budget? | The new method uses many more calls. | Self-consistency beat multi-agent debate at 6 and 9 responses. |
| 8 | Is there an ablation without self-improvement, and one without the archive? | Only the full system is shown. | DGM: 39.0% without self-improvement, 23.0% without the archive. |
| 9 | Are the baselines strong, and use the same model? | Baselines use a weaker model or a weak prompt. | Promptbreeder compared some baselines on a different model. |
| 10 | Is the benchmark contaminated, saturated or flawed? | A public benchmark with leaked solutions | SWE-Bench+: 32.67% of successful patches used leaked solutions. |
| 11 | Does the gain transfer to held-out tasks, other models and other benchmarks? | No transfer test | AFlow workflows found with one model did worse with another. |
| 12 | Is the cost reported per run, in money, time and tokens? | No cost, or only the cost of the final agent | DGM about USD 22,000 and two weeks per run |
| 13 | Is the code released, at which commit, and does it match the paper? | No code, or code that differs from the paper | The released DGM code does not run its 200-task stage. |
| 14 | What could the agent reach: sandbox, network, keys, evaluator files? Were incidents reported? | "Sandboxed" with no details | STOP removed its sandbox flag in 0.42% of GPT-4 improvements. |
| 15 | Which version of the paper is this, and did the numbers change? | Headline numbers differ between versions. | GEPA's average gain over GRPO went from 10% in v1 to 6% in v2. |
| 16 | Does the language match the evidence? | "Human-level", "recursive", "explosion" without matching numbers | HGM's "human-level" means matching one leaderboard entry on SWE-bench Lite. |

Sources of the examples, in table order:

- ACE and the DGM: Zhang et al. (2025). Self-correction: Huang et al. (2023). STOP: Zelikman et al. (2023).
- DSPy: Khattab et al. (2023). EvoPrompt: Guo et al. (2023). SICA: Robeyns et al. (2025).
- Promptbreeder: Fernando et al. (2023). SWE-Bench+: Aleithan et al. (2024). AFlow: Zhang et al. (2024).
- GEPA: Agrawal et al. (2025). HGM: Wang et al. (2025).
- The DGM code fact comes from reading the released repository at commit `a565fd2` ([L4: The DGM in code](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code)).

Questions 5, 6 and 7 catch most inflated results. Questions 13 and 14 need the code, not only the paper. The code-versus-paper differences found in this course are a good warning:

- The released DGM code computes the threshold for the 200-task stage but never uses it. Its parent selection also does not exclude agents with a perfect score, which the paper says it does.
- The released SICA code has no weighted utility of score, cost and time. It selects by mean benchmark score.
- The ADAS paper says that generated code ran in containers. The released code runs it with plain `exec` in the main process.
- The STOP repository lacks the code that ran and counted the sandbox experiment.
- The Gödel Agent code feeds test-set accuracy back into the agent's context once validation accuracy reaches 0.94.

All five come from reading the released code at fixed commits. [L7: What the code teaches](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches) lists them in full.

### 4.4 Worked example: read a hypothetical paper

The following paper is invented for this exercise. It describes no real system.

> A coding agent edits its own prompts and tools for 30 iterations. Its pass rate on a 40-task subset of a public benchmark rises from 30% to 52%. The 52% is the best of the 30 iterations, measured on the same 40 tasks that accepted each change. There is one run.
>
> - The same model writes the changes, writes tests for them, and decides whether a change succeeded.
> - The paper reports no cost.
> - The code is released without a commit.

Apply the checklist:

1. **Question 6, noise.** With 40 tasks, the standard error is $\sqrt{0.3 \times 0.7 / 40} = 7.2$ points at 30%, and $\sqrt{0.52 \times 0.48 / 40} = 7.9$ points at 52%. The standard error of the difference is $\sqrt{7.2^2 + 7.9^2} \approx 10.7$ points. The gain of 22 points is about 2 standard errors, before any correction.
2. **Question 5, selection.** The 52% is the maximum of 30 noisy scores on the selection set. The winner's curse makes it too high ([L3: Evaluation under noise](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise)). The reported number is not a held-out estimate.
3. **Question 3, self-evaluation.** The model judges its own changes with its own tests. Reflexion's self-written tests had a false-positive rate of 0.16 on MBPP, and that let wrong code pass.
4. **Question 8, ablations.** Without a run with a fixed improver, you cannot tell self-improvement from simple search.
5. **Question 7, equal compute.** Without a baseline that gets the same budget, the gain may come from more model calls.
6. **Questions 10 and 11.** A public benchmark may be contaminated, and there is no transfer test.
7. **Questions 12 and 13.** No cost and no commit, so nobody can check or repeat the run.

**Verdict:** the paper shows that a score rose on 40 reused tasks in one run. It does not show self-improvement, a real gain or transfer. Ask the authors for the held-out score of the final agent, three seeds, the two ablations and the cost.

### 4.5 How to design your own experiment

Use these steps for any RSI experiment, from the bin-packing toy of [Part 9](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver) to a language-model agent.

1. **State the claim.** Name the ladder level and the target: model, agent or process ([L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories)).
2. **Preregister.** Write the primary metric, the main comparison, the acceptance rule, the stopping rule and the analysis. Date the file, and commit it before the first run.
3. **Split the tasks.** Use a training set for feedback and a validation set for selection. Keep a held-out test set for the final report. Add one held-out task family for transfer.
4. **Fix the budget.** Give every arm the same number of iterations, model calls, tokens, money and wall time.
5. **Run the arms.** Run the full system and the ablations in the table below.
6. **Repeat.** Run at least 3 seeds per arm. The DGM's three Polyglot runs had a standard deviation of 2.3 points.
7. **Size the test set.** Use the power analysis of section 4.6.
8. **Protect the evaluator.** Keep it outside the editable code. Make tests read-only, hash protected files and write logs from the harness.
9. **Record the cost.** Log tokens, money, CPU and GPU hours, and wall time per arm.
10. **Report everything.** Show the held-out curve per iteration, all seeds, the failed runs, the confidence intervals and the commit.

| Arm | What it is | What it tests |
|---|---|---|
| A0: no change | The initial agent, scored again on the test set | The starting point and its noise |
| A1: equal-compute baseline | The initial agent with the same budget spent on repeated attempts and a selector that has no oracle | Whether the gain comes only from more compute |
| A2: random proposer | The same loop with random changes instead of a smart proposer | The value of the proposer |
| A3: no self-improvement | A fixed improver that never changes, like the DGM ablation without self-improvement | The value of improving the improver |
| A4: no archive | Always change the latest version, like the DGM ablation without open-ended exploration | The value of stepping stones |
| A5: full system | Everything on | The main claim |

```mermaid
flowchart LR
    R["Preregistered plan"] --> S["Task split: train, validation, test, held-out family"]
    S --> B["Same budget for every arm"]
    B --> A["Arms A0 to A5, 3 or more seeds each"]
    A --> E["Protected evaluator outside the editable code"]
    E --> T["Held-out test, once"]
    T --> P["Report: curves, intervals, cost, commit"]
    style R fill:#6A4C93,color:#fff
    style S fill:#8A8A8A,color:#fff
    style B fill:#8A8A8A,color:#fff
    style A fill:#1E6091,color:#fff
    style E fill:#B8860B,color:#fff
    style T fill:#B8860B,color:#fff
    style P fill:#2D6A4F,color:#fff
```

A preregistration can be short. This one fits on one screen:

```text
Claim:        Level 5. The improver's settings improve, and the improved
              improver produces larger gains on new task families.
Primary metric: mean excess bins on the held-out test set, iteration 40.
Main comparison: A5 against A3, paired on the same test instances.
Acceptance rule: tests pass, size limit holds, paired gain > 2 SE.
Stopping rule:  40 iterations or the budget, whichever comes first.
Budget per arm: 40 iterations, 20 candidates per iteration.
Seeds:          3 per arm, seeds 1, 2, 3.
Analysis:       mean and 95% interval over seeds, all seeds reported.
Date and commit: written before the first run.
```

### 4.6 How many tasks do you need?

**The idea in words.** A comparison of two versions on the same tasks is noisy. The noise shrinks with more tasks and with more correlation between the two versions' results. Before you run, compute how many tasks give a good chance to detect the gain that you care about.

**The equation.**

$$
n = \frac{\left(z_{1-\alpha/2} + z_{1-\beta}\right)^2 \cdot 2\,p(1-p)\,(1-\rho)}{\delta^2}
$$

**The symbols.**

- $n$ is the number of tasks.
- $\delta$ is the true gain that you want to detect, as a fraction (0.05 is 5 points).
- $p$ is the pass rate near which both versions sit.
- $\rho$ is the correlation between the two versions' results on the same task.
- $\alpha$ is the chance of a false alarm, usually 0.05, so $z_{1-\alpha/2} = 1.96$.
- $1 - \beta$ is the power, usually 0.80, so $z_{1-\beta} = 0.84$.

**In plain English.** The numerator is the variance of one task's difference, $2p(1-p)(1-\rho)$, times a safety factor of about $2.80^2 = 7.85$. Divide by the square of the gain. Half the gain needs four times the tasks. A higher correlation $\rho$ means fewer tasks, which is why paired comparisons are cheap.

**The numbers** (with $p = 0.5$):

| Gain $\delta$ | Unpaired-like, $\rho = 0$ | Paired, $\rho = 0.5$ |
|---|---|---|
| 3 points | 4,361 | 2,181 |
| 5 points | 1,570 | 785 |
| 10 points | 393 | 197 |

Step by step for 5 points and $\rho = 0.5$:

1. $2p(1-p)(1-\rho) = 2 \times 0.25 \times 0.5 = 0.25$.
2. $(1.96 + 0.84)^2 = 7.85$.
3. $n = 7.85 \times 0.25 / 0.05^2 = 785$ tasks.

Compare this with the published runs. SICA used 50 tasks. The HGM used 60. The DGM's top stage used 200. None of these can reliably detect a 5-point gain between two single agents.

**The assumptions.** Results are pass or fail, both pass rates are near $p$, tasks are independent, and the normal approximation holds. If questions come in clusters, you need more tasks. Miller reports that on DROP the clustered standard error was 3.05 times the naive one (Miller, 2024, [arXiv:2411.00640](https://arxiv.org/abs/2411.00640)).

**When it is useful.** Use it before you run, to size the test set. Use it when you read a paper, to judge whether its gains can be real.

**What it does NOT prove.** Enough tasks protect you from noise only. They do not protect you from contamination or evaluator gaming. They do not remove the winner's curse of choosing among many versions, or fix a metric that misses what you care about.

## 5. Graphs

```plot
{
  "title": "Tasks needed to detect a gain delta with 80% power at p = 0.5: no correlation (red) and paired with correlation 0.5 (blue)",
  "xAxis": { "label": "gain to detect, delta", "domain": [0.03, 0.2] },
  "yAxis": { "label": "tasks needed", "domain": [0, 2500] },
  "disableZoom": true,
  "data": [
    { "fn": "3.924/(x*x)", "color": "#C81D25" },
    { "fn": "1.962/(x*x)", "color": "#1E6091" }
  ]
}
```

Both curves fall with the square of the gain. Small gains need very large test sets.

## 6. Video and animation

- [How METR measures Long Tasks and Experienced Open Source Dev Productivity](https://www.youtube.com/watch?v=k1t2xyWMUdY) (Joel Becker, METR, AI Engineer, 2026). Time horizons next to a field study in which AI tools did not speed up experienced developers. It shows how a careful measurement can contradict a headline. It supports sections 4.2 and 4.3.
- [Can AIs do AI R&D? Reviewing REBench Results with Neev Parikh of METR](https://www.youtube.com/watch?v=SX8Mxyy_UHY) (Cognitive Revolution, 2024). How agents are compared with human experts, with best-of-k and reward hacking in evaluations. It supports section 4.3, questions 7 and 14.
- [Measuring AI R&D Automation: What Happens When AI Automates AI Research](https://www.youtube.com/watch?v=wRTBKwf45Ak) (Alan Chan, FAR.AI, 2026). The metrics needed to track automated AI research. It supports open problem 8.
- [CMU LLM Inference (8): Self-Refine and Self-Correction Methods](https://www.youtube.com/watch?v=uaxf9yssDy4) (Graham Neubig, 2025). A careful reading of self-correction claims, including when they fail. It supports question 3.

## 7. Code

This function implements the equation of section 4.6. It needs only the standard library.

```python
import math
from statistics import NormalDist


def tasks_needed(delta, rho, p=0.5, alpha=0.05, power=0.80):
    """Tasks for a paired comparison of two pass/fail versions.

    delta: true gain to detect (0.05 = 5 points)
    rho:   correlation of the two versions' per-task results
    p:     pass rate near which both versions sit
    """
    z = NormalDist().inv_cdf(1 - alpha / 2) + NormalDist().inv_cdf(power)
    var_diff = 2 * p * (1 - p) * (1 - rho)   # variance of one task's difference
    return math.ceil(z * z * var_diff / delta ** 2)


for delta in (0.03, 0.05, 0.10):
    print(delta, tasks_needed(delta, rho=0.0), tasks_needed(delta, rho=0.5))
# 0.03 4361 2181
# 0.05 1570 785
# 0.1 393 197
```

To estimate $\rho$, score two versions of your agent on the same 100 tasks and compute the correlation of their pass and fail results.

## 8. Common mistakes

1. **"The paper says self-improving, so the improver improved."** Check question 4. Most systems improve the agent with a fixed improver.
2. **"The best iteration is the result."** The best of many noisy scores is too high. Ask for the held-out score of a version fixed in advance.
3. **"One run is enough if the gain is large."** On 40 tasks, a 22-point gain is only about 2 standard errors, before the winner's curse.
4. **"The paper describes the code."** The DGM, SICA, ADAS, STOP and Gödel Agent all have code-versus-paper differences.
5. **"An ablation of the full system is optional."** Without the runs with no self-improvement and no archive, you cannot say which part caused the gain.
6. **"The number in the abstract is stable."** APE's headline went from 19 of 24 tasks to 24 of 24 between versions. GEPA's average gain over GRPO went from 10% to 6%.
7. **"Preregistration is bureaucracy."** In RSI it is the main defense against choosing the best of many curves after the fact.

## 9. One-minute explanation

The big questions of recursive self-improvement are still open. Nobody has shown an improver that improves itself again and again with compounding gains. Nobody has shown an evaluator that stays reliable without a fixed anchor, or returns to AI research that are surely above 1. To read a new paper, ask 16 questions. The most useful ones ask what changes and what is frozen, and which tasks selected and reported the winner. They also ask how many tasks and seeds were used, whether the baselines had equal compute, and whether the ablations remove self-improvement and the archive.

Check the code at a fixed commit, because code and paper often differ. To run your own experiment, preregister the metric and the analysis, and split the tasks. Then fix the budget, run the six arms with several seeds, protect the evaluator, and report the cost. A paired test needs about 785 tasks to detect a 5-point gain.

## 10. Check questions

```check
{
  "question": "A paper reports that its agent rose from 30% to 52% on 40 tasks, in one run. The 52% is the best of 30 iterations measured on those same tasks. Compute the standard error at each end and of the difference. Then name three checklist questions that this result fails.",
  "answer": "SE at 30%: sqrt(0.3 × 0.7 / 40) = 7.2 points. SE at 52%: sqrt(0.52 × 0.48 / 40) = 7.9 points. SE of the difference: sqrt(7.2^2 + 7.9^2) ≈ 10.7 points, so the 22-point gain is about 2 standard errors. It fails question 5, because the same tasks select and report, so the best of 30 is inflated. It fails question 6: one run, 40 tasks, no intervals. It fails question 8, because there is no ablation without self-improvement. It may also fail question 7 (equal compute) and question 12 (cost)."
}
```

```check
{
  "question": "You want to detect an 8-point gain between parent and child, with pass rates near 50% and a per-task correlation of 0.6. How many tasks do you need at 5% false alarms and 80% power?",
  "hint": "$n = 7.85 \\times 2p(1-p)(1-\\rho) / \\delta^2$.",
  "answer": "2p(1 - p)(1 - ρ) = 2 × 0.25 × 0.4 = 0.2. Then n = 7.85 × 0.2 / 0.08^2 = 1.57 / 0.0064 ≈ 246 tasks. With ρ = 0, you would need 7.85 × 0.5 / 0.0064 ≈ 614 tasks, so pairing saves more than half."
}
```

```check
{
  "question": "Which ablation answers 'Is improving the improver needed?' and which answers 'Is the archive needed?'? Give the DGM's numbers for both on SWE-bench, and say what the ablations do not show.",
  "answer": "The run without self-improvement answers the first question. In it, a fixed base agent stays the meta agent, and it reached 39.0%. The run without open-ended exploration answers the second. It always changes the latest version, and it reached 23.0%. The full DGM reached 50.0%. The ablations are single runs on a 200-task subset, so their differences carry noise. They do not show how much of the gain transfers to new tasks. They also do not test whether the fixed parts, such as parent selection, could be improved."
}
```

```check
{
  "question": "A paper's v1 abstract says its method beats a baseline 'by 10% on average'. The v2 abstract, with more tasks, says 'by 6% on average'. How should you cite and teach it?",
  "answer": "Name the version that you cite, and use the numbers of that version with their units. Say that the claim changed between versions, as GEPA's did (10% in v1, 6% in v2, and 6 percentage points in the ICLR 2026 abstract). Prefer the later version when it adds tasks, because it is the broader test. Never mix numbers from different versions in one comparison."
}
```

```check
{
  "question": "Which of these decisions must be fixed before the first run, and why? (a) the primary metric, (b) the iteration at which to report, (c) the number of seeds, (d) the plots to include, (e) the acceptance rule.",
  "answer": "Fix (a), (b), (c) and (e) before the run. Each one, if chosen after seeing the results, lets you pick the version or the measure that looks best. The metric and the report iteration decide what the claim is. The seed count stops you from adding runs until one looks good. The acceptance rule decides which changes enter the system. (d), the choice of plots, can come later, as long as you report all seeds and the preregistered metric."
}
```

## 11. Summary and links

- Ten problems stay open, from compounding self-improvement of the improver to safe combination of weight and code changes.
- The 2026 directions include the six lenses of the ICLR workshop and the surveys. They also include clade-based parent selection, editable meta levels and the measurement of AI research automation.
- A 16-question checklist catches most inflated claims. The key questions ask what changes, which tasks select and report, how many tasks and seeds, equal compute, and ablations.
- Code and paper often differ, so read the code at a pinned commit.
- A good experiment preregisters, splits the tasks, fixes the budget, runs six arms with several seeds, protects the evaluator and reports the cost.

The next lesson gives advanced exercises that use all of Part 10.

- Previous: [L3: Improving a model, an agent, or the process that makes agents](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories)
- Next: [L5: Advanced exercises](/notes/ai/recursive-self-improvement/10-advanced/l5-advanced-exercises)
- Related: [L7: What the code teaches](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches), [P6: An acceptance rule with a validation suite](/notes/ai/recursive-self-improvement/09-build-it/p6-a-validation-gate), [Sources](/notes/ai/recursive-self-improvement/sources), [Video guide](/notes/ai/recursive-self-improvement/videos)

## References

- Lakshya A Agrawal, Shangyin Tan, Dilara Soylu, et al. "GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning". ICLR 2026. arXiv:2507.19457. https://arxiv.org/abs/2507.19457
- R. Aleithan, H. Xue, M. M. Mohajer, E. Nnorom, G. Uddin, S. Wang. "SWE-Bench+: Enhanced Coding Benchmark for LLMs". 2024. arXiv:2410.06992. https://arxiv.org/abs/2410.06992
- Mingguang Chen, Licheng Wang, Bo Qu. "Recursive Self-Improvement in AI: From Bounded Self-Refinement to Autonomous Research Loops". 2026. arXiv:2607.07663. https://arxiv.org/pdf/2607.07663
- Yi Duan, Ying Liu, Zirui Tang, et al. "The Last AI Built by Humans: Toward Genuine Recursive Self-Improvement". 2026. arXiv:2609.11873. https://arxiv.org/abs/2609.11873
- Daniel Eth, Tom Davidson. "Will AI R&D Automation Cause a Software Intelligence Explosion?". Forethought. 2025. https://forethought.org/research/will-ai-r-and-d-automation-cause-a-software-intelligence-explosion
- Jinyuan Fang, Yanwen Peng, Xi Zhang, et al. "A Comprehensive Survey of Self-Evolving AI Agents". 2025. arXiv:2508.07407. https://arxiv.org/abs/2508.07407v2
- Chrisantha Fernando, Dylan Banarse, Henryk Michalewski, Simon Osindero, Tim Rocktäschel. "Promptbreeder: Self-Referential Self-Improvement Via Prompt Evolution". ICML 2024. arXiv:2309.16797. https://arxiv.org/abs/2309.16797
- Huan-ang Gao, Jiayi Geng, Wenyue Hua, et al. "A Survey of Self-Evolving Agents". 2025. arXiv:2507.21046. https://arxiv.org/abs/2507.21046
- Qingyan Guo, Rui Wang, Junliang Guo, et al. "EvoPrompt: Connecting LLMs with Evolutionary Algorithms Yields Powerful Prompt Optimizers". ICLR 2024. arXiv:2309.08532. https://arxiv.org/abs/2309.08532
- Jie Huang, Xinyun Chen, Swaroop Mishra, et al. "Large Language Models Cannot Self-Correct Reasoning Yet". ICLR 2024. arXiv:2310.01798. https://arxiv.org/abs/2310.01798
- Edward Hughes, Michael Dennis, Jack Parker-Holder, et al. "Open-Endedness is Essential for Artificial Superhuman Intelligence". ICML 2024. arXiv:2406.04268. https://arxiv.org/abs/2406.04268
- ICLR 2026 Workshop on AI with Recursive Self-Improvement. 26 April 2026. https://recursive-workshop.github.io/
- Omar Khattab, Arnav Singhvi, Paridhi Maheshwari, et al. "DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines". ICLR 2024. arXiv:2310.03714. https://arxiv.org/abs/2310.03714
- T. Kwa, B. West, J. Becker, et al. (METR). "Measuring AI Ability to Complete Long Software Tasks". NeurIPS 2025. arXiv:2503.14499. https://arxiv.org/abs/2503.14499
- METR. "Time Horizon 1.1". 29 January 2026. https://metr.org/blog/2026-1-29-time-horizon-1-1/
- E. Miller. "Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations". 2024. arXiv:2411.00640. https://arxiv.org/abs/2411.00640
- Maxime Robeyns, Martin Szummer, Laurence Aitchison. "A Self-Improving Coding Agent". ICLR 2025 Workshop on Scaling Self-Improving Foundation Models. arXiv:2504.15228. https://arxiv.org/abs/2504.15228
- Rui Wang, Joel Lehman, Aditya Rawal, et al. "Enhanced POET: Open-Ended Reinforcement Learning through Unbounded Invention of Learning Challenges and their Solutions". ICML 2020. arXiv:2003.08536. https://arxiv.org/abs/2003.08536
- Wenyi Wang, Piotr Piękos, Li Nanbo, et al. "Huxley-Gödel Machine: Human-Level Coding Agent Development by an Approximation of the Optimal Self-Improving Machine". ICLR 2026. arXiv:2510.21614. https://arxiv.org/abs/2510.21614
- Tianhao Wu, Weizhe Yuan, Olga Golovneva, et al. "Meta-Rewarding Language Models: Self-Improving Alignment with LLM-as-a-Meta-Judge". 2024. arXiv:2407.19594. https://arxiv.org/abs/2407.19594
- Chunqiu Steven Xia, Zhe Wang, Yan Yang, Yuxiang Wei, Lingming Zhang. "Live-SWE-agent: Can Software Engineering Agents Self-Evolve on the Fly?". 2025. arXiv:2511.13646. https://arxiv.org/abs/2511.13646
- Eric Zelikman, Eliana Lorch, Lester Mackey, Adam Tauman Kalai. "Self-Taught Optimizer (STOP): Recursively Self-Improving Code Generation". COLM 2024. arXiv:2310.02304. https://arxiv.org/abs/2310.02304
- Jenny Zhang, Bingchen Zhao, Wannan Yang, et al. "Hyperagents". 2026. arXiv:2603.19461. https://arxiv.org/abs/2603.19461
- Jenny Zhang, Shengran Hu, Cong Lu, Robert Lange, Jeff Clune. "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents". ICLR 2026. arXiv:2505.22954. https://arxiv.org/abs/2505.22954. Code: https://github.com/jennyzzt/dgm
- Jiayi Zhang, Jinyu Xiang, Zhaoyang Yu, et al. "AFlow: Automating Agentic Workflow Generation". ICLR 2025. arXiv:2410.10762. https://arxiv.org/abs/2410.10762
- Qizheng Zhang, Changran Hu, Shubhangi Upasani, et al. "Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models". ICLR 2026. arXiv:2510.04618. https://arxiv.org/abs/2510.04618
- Andrew Zhao, Yiran Wu, Yang Yue, et al. "Absolute Zero: Reinforced Self-play Reasoning with Zero Data". NeurIPS 2025. arXiv:2505.03335. https://arxiv.org/abs/2505.03335
- Adam Zweiger, Jyothish Pari, Han Guo, Ekin Akyürek, Yoon Kim, Pulkit Agrawal. "Self-Adapting Language Models". NeurIPS 2025. arXiv:2506.10943. https://arxiv.org/abs/2506.10943
