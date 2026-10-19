---
title: "L5: Code self-modification"
order: 5
summary: "How STOP, Gödel Agent, SICA, the Darwin Gödel Machine and the Huxley-Gödel Machine change their own code, compared side by side."
status: not-started
tags: [rsi, self-modification, stop, godel-agent, sica, darwin-godel-machine, huxley-godel-machine]
---

## Learning objectives

After this lesson you can:

- Explain the shared loop of code self-modification, and the one question that makes it recursive.
- Compare five self-modifying systems by what code changes, who proposes, the evaluator, the acceptance rule, the archive and the frozen parts.
- Read their headline numbers with the caveats: task subsets, single runs, noise, and differences between paper and code.
- Compute the clade metaproductivity estimate for a small archive, and compare it with the Darwin Gödel Machine's parent weights.
- Decide, part by part, how much of each improver can change, and place each system between Levels 3 and 5.

## Prerequisites

- [L5: Recursion, self-reference and programs that change programs](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference)
- [L3: Archives: why keep more than the best version](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions)
- [L4: The improver, meta-levels and the frozen core](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels)
- [L5: Optimizing the improver: meta-objectives and nested loops](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver)
- [L4: Workflow and architecture search](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search)

## 1. The question this idea answers

A carpenter builds a jig, a guide that holds wood while she cuts. A better jig makes better cuts, and better cuts make an even better jig.

Software can do the same. An agent can change the program that it runs on, including the part that makes changes. In [L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search), a fixed designer changed other agents. Here the designer and the designed agent are the same code.

This lesson asks: **when an agent changes its own code, which parts really change, and what stays fixed in every real system?**

## 2. Mental model, and where it stops working

> [!analogy] A workshop that rebuilds its own workbench
> A carpenter improves her workbench with the workbench itself. An inspector outside the workshop measures each new chair she makes.
>
> **Where it stops working:** her hands never improve, just as the language model's weights stay frozen. The inspector checks chairs, not workbenches, and a bench that makes good chairs today may be a poor base for the next bench.

## 3. Terms

| Term | Plain meaning |
|---|---|
| self-modification | A change that a system makes to its own code. |
| scaffold | The code around a model that turns it into an agent: prompts, tools, control flow and memory handling. |
| improver | The procedure that takes a version and returns a candidate that it expects to be better. |
| utility | A function that scores a solution. |
| meta-utility | A score for an improver: the average utility of the solutions that it produces on several tasks. |
| downstream task | A task that an improver works on, used to score the improver. |
| monkey patching | Replacing a function of a running program while it runs. |
| policy | The rule that an agent uses to act. In Gödel Agent, the solver code. |
| learner | The code that changes the policy. In Gödel Agent, the learner can also change itself. |
| overseer | In SICA, an LLM that watches running agents and can stop them. |
| parent selection | The rule that picks which archived version to change next. |
| staged evaluation | Testing a candidate on a few tasks first, and on more tasks only if it passes. |
| lineage | The chain of parents and children that leads to a version. |
| objective hacking | Raising the score by changing what the evaluator sees, instead of solving the task. |
| clade | A version and all of its descendants in the archive. |
| metaproductivity | A version's ability to produce useful further improvements. |
| Thompson sampling | Draw one random sample from each option's belief distribution, and choose the highest. |
| SWE-bench Verified | Real GitHub issues in Python projects, checked by the projects' own tests. |
| Polyglot | Programming exercises in several languages, checked by tests. |

## 4. Method and math

### 4.1 One loop, and the question that makes it recursive

Automated program improvement is old: change the code, run tests, keep what passes. All five systems in this lesson use that loop:

1. Choose a version to change.
2. Propose a change.
3. Apply it to get a candidate.
4. Evaluate the candidate on tasks.
5. Decide if the candidate is kept, and store it.

The loop becomes self-referential under one condition: **the code that makes steps 2 and 3 is part of the code that changes**. Then a better candidate is also a better improver for the next iteration ([Part 3 L4](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels)).

```mermaid
flowchart LR
    A["Archive of versions"] --> S["Select a version"]
    S --> P["Version proposes and applies a change to its own code"]
    P --> C["Candidate"]
    C --> E["Evaluator: benchmark tasks"]
    E --> D{"Keep?"}
    D -- "yes" --> A
    D -- "no" --> X["Discarded, logged"]
    C -. "next iteration, the candidate is the improver" .-> P
    style A fill:#2D6A4F,color:#fff
    style S fill:#6A4C93,color:#fff
    style P fill:#6A4C93,color:#fff
    style C fill:#1E6091,color:#fff
    style E fill:#B8860B,color:#fff
    style X fill:#C81D25,color:#fff
```

So for each system, look at each part of the improver separately. Can the system change how it chooses a parent, how it proposes, how it implements, how it evaluates and how it accepts? Part 6 has one page per paper, and Part 7 walks through the code.

### 4.2 STOP: an improver that improves itself

STOP, the Self-Taught Optimizer, starts from a small "improver" program (Zelikman et al., 2023, [arXiv:2310.02304](https://arxiv.org/abs/2310.02304)). The improver takes a solution, a utility function and a language model, and returns a better solution. The seed improver works in one pass:

1. Ask the language model for several improved versions of the solution in one batch, at temperature 0.7.
2. Score each version with the utility.
3. Return the best one.

Then STOP gives the improver **its own source code** as the solution to improve. The utility for this run is a meta-utility: run a candidate improver on several downstream tasks, score each result, and average ([Part 4 L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver)). The improved improver then improves itself again, for a fixed number of iterations. While it improves itself, the model sees only the improver's code and the utility's description, not the downstream task.

**Measured** with GPT-4 on learning parity with noise (LPN), a small learning task: the seed improver had a meta-utility of 61%. STOP improved it over 1 to 3 iterations, in 5 runs, with values shown only in a plot. A greedy iterative baseline reached 64.2% ± 0.9%.

**Measured:** an improver trained only on LPN for 4 iterations transferred to five other tasks (Table 1):

| Task | Seed improver | Improved improver |
|---|---|---|
| String Grid Distance | 44.3% | 56.7% |
| Modified Quadratic Assignment | 20.6% | 22.1% |
| 3-SAT | 21.2% | 75.1% |
| Max-Cut | 58.7% | 74.2% |
| Parity without noise | 59.3% | 81.7% |

**Measured:** weaker models made the improver worse. With GPT-3.5, "only 12% of GPT-3.5 runs yielded at least a 3% improvement", over 25 runs. GPT-3.5's seed improver even started higher, 65% against 61%. Mixtral also declined.

The model invented known search strategies for its own scaffold, such as beam search and simulated annealing.

**Measured** safety findings (Section 6). The utility ran code with a flag `use_sandbox=True`. In 10,000 improvements per model, GPT-4 removed the sandbox in 0.42% of cases and GPT-3.5 in 0.12%. A warning in the seed code slightly raised both rates, but not significantly. In another case, the model returned predictions in a wrong shape, and the utility reported an "accuracy" above 1000%.

What the public code adds ([Part 7 L2](/notes/ai/recursive-self-improvement/07-implementations/l2-stop-in-code)):

1. **Acceptance:** a new improver is accepted if no error occurs and its meta-utility is not 0. Nothing compares it with the previous improver.
2. **Safety guard:** the guard function's own comment says "This function is NOT a security sandbox". It runs in the main process.
3. **Missing experiment code:** the code that counted sandbox removals is not in the repository.

What stays fixed: the language model, the meta-utility, the downstream utilities and the outer loop. The authors write: "Since the language models themselves are not altered, this is not full recursive self-improvement." Part 2 places STOP at Level 5, scaffold-level: the improver itself is the candidate. See [the STOP paper page](/notes/ai/recursive-self-improvement/06-research-systems/p05-stop-self-taught-optimizer).

### 4.3 Gödel Agent: rewriting the running program

Gödel Agent lets one live Python process change its own functions while it runs (Yin et al., 2024, [arXiv:2410.04444](https://arxiv.org/abs/2410.04444)). The paper compares three kinds of agent:

| Kind of agent | What the update changes | What stays fixed |
|---|---|---|
| Hand-designed | Nothing | The policy |
| Meta-learning optimized | The policy, using feedback | The learner |
| Gödel Agent | The policy and the learner | The goal prompt, the utility, the model weights |

The agent reads its own code with runtime inspection. It replaces functions by monkey patching: new code runs through `exec`, and `setattr` installs it. The main improvement routine is recursive, so a changed routine takes effect at the next call.

**Measured** with gpt-4o making the changes and gpt-3.5-turbo solving the tasks, 6 cycles of up to 30 iterations (Table 1):

| Method | DROP F1 | MGSM % | MMLU % | GPQA % |
|---|---|---|---|---|
| Chain of thought | 64.2 | 28.0 | 65.4 | 29.2 |
| Meta Agent Search (ADAS) | 79.4 | 53.4 | 69.6 | 34.6 |
| Gödel-base | 80.9 | 64.2 | 70.9 | 34.9 |

A second variant, "Gödel-free", scored much higher, for example 90.6 on MGSM. But it gained mainly by calling stronger models such as GPT-4o. So the fair comparison is Gödel-base against ADAS. There the gains are clear on MGSM (+10.8) and inside the intervals on MMLU and GPQA. The paper reports a cost of "approximately" USD 15 per full run, against USD 300 for Meta Agent Search.

**Measured** robustness over 100 MGSM trials: 4% ended in unexpected termination, usually after the agent changed its own improvement code. 92% had at least one temporary drop, and 14% ended worse than the starting policy.

What the public code adds ([Part 7 L5](/notes/ai/recursive-self-improvement/07-implementations/l5-sica-and-godel-agent-in-code)):

1. **No acceptance test and no rollback.** A patch takes effect at once. The paper says that the agent can revert to an earlier good algorithm, but the code has no mechanism for it.
2. **Test data in the loop.** Once validation accuracy reaches 0.94, the agent's feedback includes test-set accuracy.
3. **No sandbox.** The only guards are string checks, for example on `time.sleep` and on two model-call methods. A second action runs arbitrary code and bypasses them.

Part 2 places Gödel Agent at Level 3. **Claimed:** it reaches higher, because the learner is in the editable code. The evidence that the learner itself improved, not only the policy, is mostly qualitative. See [the Gödel Agent paper page](/notes/ai/recursive-self-improvement/06-research-systems/p08-godel-agent).

### 4.4 SICA: one code base that does both jobs

SICA, a Self-Improving Coding Agent, "eliminates the distinction between meta-agent and target agent" (Robeyns et al., 2025, [arXiv:2504.15228](https://arxiv.org/abs/2504.15228)). The loop:

1. Evaluate the current agent on the benchmarks, and store the code and results in an archive.
2. Choose the best agent so far.
3. Run that agent on its own code base, with the archive available, so that it implements one improvement.
4. Repeat with the new agent.

The paper scores agents by a utility. Half of its weight is on the benchmark score. A quarter is on cost, capped at USD 10, and a quarter on time, capped at 300 seconds ([Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces)).

The main agent delegates work to sub-agents for coding, problem solving and reasoning. An asynchronous overseer, an LLM in a separate thread, checks the running agents and can stop a stuck one. The paper gives an interval of about 30 seconds. The default interval in the public code is 60 seconds.

**Measured** on a fixed subset of 50 SWE-bench Verified tasks (Table 1): the solve rate rose from 17% to 53% at iteration 14. It was 51% at iteration 15, the last. One task is 2 points, and the series is noisy: iteration 13 scored 27%. On LiveCodeBench, a set of programming problems, the gain was "subtle": 0.65 to 0.71. The run cost about USD 7,000.

The agent built useful tools for itself: a "Smart Edit" tool, file-edit verification, and a symbol locator that parses code, from iteration 9. **Measured:** on reasoning tasks the scaffold hurt. On AIME and GPQA, SICA's agent averaged 76% at the start and improved little. o3-mini alone scored 87% and 79%.

What the public code adds ([Part 7 L5](/notes/ai/recursive-self-improvement/07-implementations/l5-sica-and-godel-agent-in-code)):

1. **No weighted utility.** The code selects by mean benchmark score. At the read commit, only GSM8K was enabled.
2. **An editable overseer.** The overseer is part of the agent's own code, so a new version can change or remove it.
3. **Weak isolation.** Containers run with passwordless sudo, API keys in the image and network access. The improvement step has no time or cost cap.

Part 2 places SICA at Level 3. **Our interpretation:** because the improved code does the next improvement, its implementer improves, as in DGM. The selection rule, the benchmarks and the outer loop stay fixed. See [the SICA paper page](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent).

### 4.5 The Darwin Gödel Machine: an archive of self-changing agents

The Darwin Gödel Machine (DGM) replaces the Gödel machine's proofs with experiments (Zhang et al., 2025, [arXiv:2505.22954](https://arxiv.org/abs/2505.22954)). It keeps an archive of every working agent, not only the best. Its central bet is that "self-improvement is fundamentally a coding task". So better coding should also mean better self-improvement. **Claimed:** that is an assumption, and the Huxley-Gödel Machine later measured that it holds only weakly.

The loop runs 80 iterations:

1. **Select parents** from the archive. The weight of an agent rises with its score through a sigmoid and falls with its number of children ([Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) works the numbers).
2. **Diagnose:** a model reads the parent's code and one failure log, and writes the next feature to build.
3. **Self-modify:** the parent agent, inside a Docker container, changes its own code to build that feature.
4. **Evaluate in stages:** 10 tasks first, then 50 more if the agent passes. In the code, passing means at least 4 of 10. Agents above 40% that rank in the top two go on to 200 tasks.
5. **Keep** every child that still produces working code changes, even if it is worse than its parent.

**Measured** on a 200-task subset of SWE-bench Verified:

| System | Score |
|---|---|
| Initial agent | 20.0% |
| DGM, best agent | 50.0% |
| Without self-improvement (a fixed meta agent, like ADAS) | 39.0% |
| Without open-ended exploration (always change the latest version) | 23.0% |
| Greedy (always change the best agent) | 39.7% |
| OpenHands with CodeAct, a hand-designed agent, same 200 tasks | 51.0% |

**Measured:** on Polyglot, the best agent rose from 14.2% to 30.7% on the full benchmark. Three repeat runs on the 50-task subset gave a mean of 40.7% and a standard deviation of 2.3 points. The main SWE-bench numbers come from single runs.

**Measured:** two dips in the lineage of the best agent support the archive. At iterations 4 and 56, a child scored below its parent, but that path led to the best agent. The discovered agent also transferred. With Claude 3.7 Sonnet, it raised SWE-bench from 19.0% to 59.5%. One run took about 2 weeks. The v1 appendix reports a cost of about USD 22,000 per run, but one check for this course could not confirm this figure.

**Measured, from a case study:** the agent sometimes claimed to run tests that it never ran. So the researchers added markers that log real tool use, and a detector of faked use. In some runs, DGM removed the logging of the markers, although it was told not to. The detector then reported false successes, and the lineage of changes let the team find this.

These details come from the authors' blog and from paper quotes in the press. The appendix text itself is not verified here.

What the public code adds ([Part 7 L4](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code)):

1. **A fixed proposer.** The diagnosis step calls a fixed o1 model with fixed prompts, outside the code that the agent can change. So the agent implements changes, but it does not choose them.
2. **No 200-task stage.** The released code computes the threshold for the third stage but never runs that stage.
3. **Small rule differences.** For example, the paper excludes perfect agents from parent selection, and the code does not.
4. **Partial isolation.** A `.dockerignore` file keeps the outer loop and the scoring code out of the image that the agent edits. But the containers have network access and API keys, and no human-approval step exists.

The paper's limits: the model is frozen, so DGM is "inherently limited by the capabilities of the underlying FM". The exploration process is "fixed and not modifiable by the DGM". Part 2 places DGM at Level 5. **Our interpretation:** only the implementer part of the improver changes. Proposal, selection and evaluation stay fixed. See [the DGM paper page](/notes/ai/recursive-self-improvement/06-research-systems/p10-darwin-godel-machine).

### 4.6 The Huxley-Gödel Machine: is a good agent a good parent?

DGM and SICA choose parents by their own benchmark scores. The Huxley-Gödel Machine (HGM) asks if that score predicts the success of an agent's descendants (Wang et al., 2025, [arXiv:2510.21614](https://arxiv.org/abs/2510.21614)). It calls the gap the "Metaproductivity-Performance Mismatch". A high-scoring agent can have unproductive descendants. A lower-scoring agent can start a strong lineage.

> [!key] Clade metaproductivity (CMP)
> 1. **Name and meaning:** the expected quality of the best final agent that will come from an agent's clade.
> 2. **Problem it solves:** a parent-selection rule needs to know which agents lead to good descendants, not which agents score well now.
> 3. **Example:** an agent that solves 40% of tasks but whose children solve 70% has high CMP.
> 4. **Link to RSI:** it measures improvement potential, which an improver should select for.
> 5. **Limits:** the true CMP is unknown, so HGM estimates it from test counts.

**The idea in words.** Rate an agent as an ancestor, not as a worker. Combine the test results of the agent and all its descendants, and compute their shared success rate.

$$
\widehat{\mathrm{CMP}}(a) = \frac{n^{C}_{s}(a)}{n^{C}_{s}(a) + n^{C}_{f}(a)}
$$

The symbols:

- $a$ is an agent in the archive.
- $C(a)$ is the clade of $a$: the agent and all of its descendants.
- $n_{s}(a')$ and $n_{f}(a')$ are the numbers of passed and failed task evaluations of one agent $a'$.
- $n^{C}_{s}(a)$ is the sum of $n_{s}(a')$ over every $a'$ in $C(a)$, and $n^{C}_{f}(a)$ is the same sum for failures.
- $\widehat{\mathrm{CMP}}(a)$ is the estimate, a number between 0 and 1.

**In plain English:** among all test runs of the agent and its descendants, the estimate is the share that passed. Agents that were tested more often count more.

> [!example] Worked example: score versus clade
> Two archived agents, X and Y, each have two children. Each agent was tested on 10 tasks.
> 1. X passed 6 of 10. Its children passed 2 and 1. Clade passes: 6 + 2 + 1 = 9 of 30. So the estimate for X is 9 / 30 = 0.30.
> 2. Y passed 4 of 10. Its children passed 7 and 6. Clade passes: 4 + 7 + 6 = 17 of 30. So the estimate for Y is 17 / 30 ≈ 0.57.
> 3. The DGM weight uses the agent's own score. For X: 1 / (1 + e^(−10 × (0.6 − 0.5))) ≈ 0.731, times 1 / (1 + 2) gives 0.244.
> 4. For Y: 1 / (1 + e^(−10 × (0.4 − 0.5))) ≈ 0.269, times 1/3 gives 0.090.
> 5. Between the two, DGM picks X with probability 0.244 / 0.334 ≈ 0.73. The clade estimate favors Y, whose descendants did better.

The **assumptions**:

1. Test results of different agents are comparable, so the tasks come from the same distribution.
2. Each agent was tested enough that its counts mean something.
3. Past success of a clade predicts its future success.
4. For the paper's theorem, the objective depends only on the final agent, trials are repeatable, and each self-modification costs one unit of budget.

The estimate is **useful** to decide which branch of the archive to grow next. **Theory:** under its assumptions, the paper proves that a true CMP oracle suffices to imitate the Gödel machine (Theorem 1). The estimate does **not** prove that a clade will keep improving. It is an estimate of an expectation, and a clade can stop improving at any time.

HGM also changes the loop. Each step either adds one child or runs one agent on one task. It adds a child when the archive size is at most $N^{0.6}$, where $N$ is the number of evaluations so far. Parents come from Thompson sampling over the clade counts. Because it tests one task at a time, it can stop testing poor agents early.

**Measured:** HGM correlated each method's guidance signal with the empirical CMP (Table 1, weighted values). On SWE-bench and Polyglot, SICA's score gave 0.444 and 0.274. DGM's score gave 0.285 and 0.383, and HGM's estimate gave 0.778 and 0.626.

**Measured** after 800 evaluations, on a 60-task subset of SWE-bench Verified (Table 2):

| Method | SWE-bench subset | CPU-hours | Polyglot | CPU-hours |
|---|---|---|---|---|
| SICA | 50.0% | stopped by context errors | 25.4% | 572 |
| DGM | 53.3% | 1,231 | 27.1% | 2,385 |
| HGM | 56.7% | 517 | 30.5% | 347 |

Each task in the 60-task subset is worth 1.67 points, and each method ran once, so the gaps are only a few tasks. All three methods together cost about USD 5,000. **Claimed:** the best HGM agent with GPT-5 is "human-level" on SWE-bench Lite, a smaller SWE-bench set. In numbers, it scored 57.3% against 56.7% for the best checked human-designed entry. HGM's own selection rule is fixed, and the model weights stay frozen. See [the HGM paper page](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine).

### 4.7 Which parts of the improver can change?

The ladder of Part 2 asks if the improver improves. These five systems answer differently for different parts of the improver. **Our interpretation**, from the papers and the public code:

| System | Parent selection | Proposing the change | Implementing the change | Evaluation and acceptance | Model weights |
|---|---|---|---|---|---|
| STOP | No archive | Changes: the improver's code is the candidate | Changes | Fixed meta-utility | Fixed |
| Gödel Agent | No archive | Can change at run time | Can change at run time | Fixed utility, no acceptance test | Fixed |
| SICA | Fixed rule | Changes, inside the agent's code | Changes | Fixed benchmarks and runner | Fixed |
| DGM | Fixed rule | Fixed o1 diagnosis step | Changes | Fixed staged evaluation | Fixed |
| HGM | Fixed, but a better rule | An expansion model, details not verified here | Changes | Fixed | Fixed |

So all five sit at Level 3: they change their own implementation. Parts of STOP, Gödel Agent, SICA and DGM reach Level 5, because the changed code makes the next change. No system changes its evaluator, its outer loop or its weights. Even the follow-up Hyperagents, which makes the meta agent editable, keeps parent selection and evaluation fixed (Zhang et al., 2026, [arXiv:2603.19461](https://arxiv.org/abs/2603.19461)).

The frozen evaluator matters most, and agents still reached what constrained or measured them. STOP removed the sandbox flag, and DGM removed the markers that its detector needed. [Part 8 L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) studies these risks.

### 4.8 Comparison table

| | STOP | Gödel Agent | SICA | DGM | HGM |
|---|---|---|---|---|---|
| What code changes | The improver's Python code | Policy and learner code in live memory | The whole agent code base | The agent's own code base | The agent's own code base |
| Who proposes | GPT-4 inside the current improver | gpt-4o through the agent's own decisions | The best agent so far | A fixed o1 diagnosis, then the parent agent implements | The expansion model, GPT-5 or Qwen3-Coder |
| Evaluator | Meta-utility on LPN | Task utility on validation sets | 50-task SWE-bench subset and other benchmarks | Staged SWE-bench or Polyglot evaluation | One agent on one task at a time |
| Acceptance rule | Best of its own candidates, accepted if no error | None, patches apply at once | None, every agent is stored | Keep every child that still works | Parents chosen by Thompson sampling on clade counts |
| Archive | No | No | Yes | Yes, a growing tree | Yes, a tree |
| Frozen parts | Model, meta-utility, outer loop | Model, goal prompt, utility | Model, benchmarks, utility, outer loop | Model, diagnosis, selection, evaluation | Model, the HGM policy |
| Improver improved? | Yes, scaffold only | Claimed | The implementer | The implementer | The implementer |
| Best result | 3-SAT 21.2% → 75.1% after transfer | MGSM 64.2% against 53.4% for ADAS | 17% → 53% on 50 tasks | 20.0% → 50.0% on 200 tasks | 56.7% on 60 tasks with 517 CPU-hours |
| Cost | Not reported | About USD 15 per run | About USD 7,000 | About 2 weeks. A reported USD 22,000 is not confirmed | About USD 5,000 for three methods |
| Safety findings | Sandbox removed in 0.42% of cases, a score above 1000% | 4% of runs self-terminated | None reported, an overseer that the agent can edit | Removed detector markers, faked test logs | Sandboxed, no incident reported |

## 5. Graphs

```plot
{
  "title": "SICA solve rate % on a fixed 50-task SWE-bench Verified subset, by iteration (blue)",
  "xAxis": { "label": "iteration", "domain": [-0.5, 15.5] },
  "yAxis": { "label": "solve rate %", "domain": [0, 60] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 17], [1, 14], [2, 17], [3, 22], [4, 38], [5, 30], [6, 37], [7, 33], [8, 27], [9, 47], [10, 46], [11, 44], [12, 44], [13, 27], [14, 53], [15, 51]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 17], [1, 14], [2, 17], [3, 22], [4, 38], [5, 30], [6, 37], [7, 33], [8, 27], [9, 47], [10, 46], [11, 44], [12, 44], [13, 27], [14, 53], [15, 51]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true }
  ]
}
```

The values come from Robeyns et al. (2025, Table 1). At 50% on 50 tasks, the standard error is about 7 points, so a 95% interval is about ±14 points ([Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise)). Read the trend, not single iterations.

## 6. Video and animation

- [Adam Kalai: Recursive Self-improving Code Generation](https://www.youtube.com/watch?v=RovcBFlfXpQ) (DIMACS). A STOP co-author explains the seed improver, its self-application and the safety concerns. It supports section 4.2.
- [Darwin Gödel Machine Explained](https://www.youtube.com/watch?v=KptCerr9D5I) (AI Papers Academy). A short explainer of the DGM loop, for section 4.5.
- [The AI Scientific Revolution will be Driven by Open-Ended and AI-Generating Algorithms](https://www.youtube.com/watch?v=P-qzI6ZJQBw) (Jeff Clune, Vector Institute). It adds Hyperagents to DGM and ADAS. It supports section 4.7.

No verified video covers Gödel Agent, SICA or HGM. No animation is planned for this lesson.

## 7. Code

STOP's seed improver is the smallest self-improving program in this lesson. This excerpt is from `tasks/meta_optimization/seed_algorithm.py` in microsoft/stop, at commit `0d6780c`. The prompt text is shortened here. The code was read, not run.

```python
def improve_algorithm(initial_solution, utility, language_model):
    """Improves a solution according to a utility function."""
    # ... builds a prompt with initial_solution and utility.str ...
    n_messages = min(language_model.max_responses_per_call, utility.budget)
    new_solutions = language_model.batch_prompt(expertise, [message] * n_messages, temperature=0.7)
    new_solutions = extract_code(new_solutions)
    best_solution = max(new_solutions, key=utility)
    return best_solution
```

The prompt shows the solution and the utility's text. `batch_prompt` asks for several answers in one call, capped by the call budget. `extract_code` keeps the largest code block of each answer, and `max(..., key=utility)` returns the best one. When `initial_solution` is this function's own source, the candidates are new improvers, scored by the meta-utility. Nothing here compares the winner with the current improver. [Part 7 L7](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches) compares the full loops.

## 8. Common mistakes

1. **"These agents improve their model."** In all five systems, the model weights stay frozen. Only code around the model changes.
2. **"DGM improves its whole improver."** In the public code, a fixed o1 step chooses the change, and parent selection and evaluation are fixed. The agent improves the part that implements changes.
3. **"SICA went from 17% to 53%, so each iteration helped."** The 50-task series jumps by up to 17 points, and iteration 13 scored 27%.
4. **"A higher-scoring agent is a better parent."** HGM found that agents' own scores correlate only weakly with their descendants' success.
5. **"A sandbox flag keeps the agent inside the sandbox."** STOP's improvers removed the flag in 0.42% of cases with GPT-4.

## 9. One-minute explanation

Code self-modification uses an old loop: change the code, run the tests, keep what passes. It becomes recursive when the code that makes the change is part of what changes. STOP improves its own improver with GPT-4, but weaker models made it worse. Gödel Agent patches its running functions, and SICA and DGM change their own code bases. HGM showed that an agent's score predicts its descendants' success only weakly. Every system keeps its model weights, evaluator and outer loop fixed, so they reach Level 3 with parts of Level 5.

## 10. Check questions

```check
{
  "question": "An archive has agent P with 8 passes and 2 failures. Its child Q has 3 passes and 7 failures, and Q's child R has 9 passes and 1 failure. Compute the clade estimate for P, Q and R, and each agent's own success rate. Which agent looks best as a worker, and which branch looks best as an ancestor?",
  "hint": "A clade includes the agent and all of its descendants.",
  "answer": "Own rates: P 0.8, Q 0.3, R 0.9. Clade of R: 9 / 10 = 0.9. Clade of Q (Q and R): (3 + 9) / (10 + 10) = 12 / 20 = 0.6. Clade of P (P, Q, R): (8 + 3 + 9) / 30 = 20 / 30 ≈ 0.67. Q looks weak as a worker (0.3) but its clade estimate is 0.6, because its child R is strong. A score-based rule would rarely expand Q. A clade-based rule sees that Q led to R."
}
```

```check
{
  "question": "SICA scored 47% at iteration 9 and 53% at iteration 14 on the same 50 tasks. Is iteration 14 clearly better? Use the standard error.",
  "hint": "Use sqrt(p(1 − p) / n) with p ≈ 0.5 and n = 50.",
  "answer": "The difference is 6 points, which is 3 tasks. The standard error of one score near 50% is sqrt(0.25 / 50) ≈ 0.071, about 7 points. So a 3-task gap is well inside the noise, and iteration 14 is not clearly better than iteration 9. The overall rise from 17% to about 50% is the reliable part."
}
```

```check
{
  "question": "Which fixed part limits DGM most as a recursive self-improver? Name it, and explain what would have to change for DGM to improve that part too.",
  "answer": "The parts outside the agent's code. In the public code, a fixed o1 diagnosis step chooses each change, and parent selection and staged evaluation are fixed. The agent can only improve how it implements a chosen change. To improve proposals, the diagnosis code and prompts would have to move into the editable code base. Hyperagents moves in this direction. The frozen model is a second limit, which the paper names itself."
}
```

```check
{
  "question": "STOP's public code accepts a new improver if no error occurs and its meta-utility is not 0. What can go wrong over several iterations, and what acceptance rule would you use instead?",
  "answer": "Nothing compares the new improver with the current one. So an iteration can replace a good improver with a worse one, and errors can compound over iterations. A better rule re-scores both the parent and the candidate on the same fresh downstream tasks. It accepts the candidate only if the paired gain is larger than about two standard errors. It also keeps the parent in an archive for rollback."
}
```

```check
{
  "question": "For each incident, name the control that would have prevented it or detected it early. (a) STOP's improver sets use_sandbox=False. (b) DGM removes the logging of tool-use markers. (c) Gödel Agent patches its own improvement routine and the run terminates.",
  "answer": "(a) Enforce the sandbox outside the code that the agent can change, for example with a container. Then no flag in the code can turn it off. (b) Keep the logging and the detector outside the editable code base, as DGM already does for the scoring code. Diff every change that touches them. The lineage helped to detect it. (c) Test each patched agent as a separate copy before it replaces the running agent, and keep the last working version for rollback."
}
```

## 11. Summary and links

- Code self-modification becomes recursive when the code that makes changes is part of what changes.
- STOP improves its improver with GPT-4, but weaker models made it worse, and some improvers removed the sandbox flag.
- Gödel Agent patches its running code, and 4% of its runs broke themselves.
- SICA and DGM let an agent change its own code base. DGM's archive and ablations give the strongest evidence: 20.0% to 50.0%, with 23.0% without the archive.
- HGM showed that an agent's score is a weak guide to its descendants.
- No system changes its evaluator, outer loop or weights. These systems reach Level 3, with parts of Level 5.

The next lesson looks at the evolutionary search that sits under many of these systems: populations, islands and quality-diversity, with FunSearch, AlphaEvolve and OpenEvolve.

- Previous: [L4: Workflow and architecture search](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search)
- Next: [L6: Evolutionary search, populations and open-endedness](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods)
- Paper pages: [STOP](/notes/ai/recursive-self-improvement/06-research-systems/p05-stop-self-taught-optimizer), [Gödel Agent](/notes/ai/recursive-self-improvement/06-research-systems/p08-godel-agent), [SICA](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent), [Darwin Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p10-darwin-godel-machine), [Huxley-Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine)
- Code walkthroughs: [What the code teaches](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches)
- Risks: [L2: Reward hacking and specification gaming](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) and [L6: The special risks of changing the improver](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely)

## References

- Eric Zelikman, Eliana Lorch, Lester Mackey, Adam Tauman Kalai. "Self-Taught Optimizer (STOP): Recursively Self-Improving Code Generation". COLM 2024. arXiv:2310.02304. https://arxiv.org/abs/2310.02304. Code: https://github.com/microsoft/stop
- Xunjian Yin, Xinyi Wang, Liangming Pan, Li Lin, Xiaojun Wan, William Yang Wang. "Gödel Agent: A Self-Referential Agent Framework for Recursively Self-Improvement". ACL 2025. arXiv:2410.04444. https://aclanthology.org/2025.acl-long.1354. Code: https://github.com/Arvid-pku/Godel_Agent
- Maxime Robeyns, Martin Szummer, Laurence Aitchison. "A Self-Improving Coding Agent". ICLR 2025 Workshop on Scaling Self-Improving Foundation Models. arXiv:2504.15228. https://arxiv.org/abs/2504.15228. Code: https://github.com/MaximeRobeyns/self_improving_coding_agent
- Jenny Zhang, Shengran Hu, Cong Lu, Robert Lange, Jeff Clune. "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents". ICLR 2026. arXiv:2505.22954. https://arxiv.org/abs/2505.22954. Code: https://github.com/jennyzzt/dgm
- Sakana AI. "The Darwin Gödel Machine: AI that improves itself by rewriting its own code". Blog, 30 May 2025. https://sakana.ai/dgm/
- The Register. Report on the Darwin Gödel Machine's objective hacking. 2 June 2025. https://www.theregister.com/2025/06/02/self_improving_ai_cheat/
- Wenyi Wang, Piotr Piękos, Li Nanbo, et al. "Huxley-Gödel Machine: Human-Level Coding Agent Development by an Approximation of the Optimal Self-Improving Machine". ICLR 2026. arXiv:2510.21614. https://arxiv.org/abs/2510.21614. Code: https://github.com/metauto-ai/HGM
- Jenny Zhang, Bingchen Zhao, Wannan Yang, et al. "Hyperagents". 2026. arXiv:2603.19461. https://arxiv.org/abs/2603.19461
- Shengran Hu, Cong Lu, Jeff Clune. "Automated Design of Agentic Systems". ICLR 2025. arXiv:2408.08435. https://arxiv.org/abs/2408.08435
