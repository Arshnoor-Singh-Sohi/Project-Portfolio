---
title: "L7: Controls, oversight and governance"
order: 7
summary: "Engineering controls for a self-improving system, and how labs and evaluators measure and govern automated AI research in 2026."
status: not-started
tags: [rsi, safety, sandbox, ai-control, monitoring, governance]
---

## Learning objectives

After this lesson you can:

- Draw the editable boundary of a self-improving system and say what must stay outside it.
- Compare what the public code of six research systems does and does not do for isolation.
- Explain why budgets, evaluators and logs must be enforced outside the improving process.
- Describe chain-of-thought monitoring and AI control protocols, with their measured trade-offs.
- Explain how METR, RE-Bench, MLE-bench, PaperBench and Anthropic's automation index measure automated AI research.
- Quote the 2026 thresholds for automated AI research in the frameworks of Anthropic, OpenAI and Google DeepMind, with their versions and dates.
- Run a self-improvement experiment with a practical safety checklist.

## Prerequisites

- [L6: The special risks of changing the improver](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely)
- [L4: The Darwin Gödel Machine in code](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code)
- [2024–2026: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research)

## 1. The question this idea answers

A bank teller counts the cash in a drawer. At the end of the day, someone else counts it again. The teller cannot sign off their own drawer, cannot edit the audit log, and cannot raise their own withdrawal limit. Nobody assumes that the teller is dishonest. The rules exist because a system that checks itself is weak, whoever runs it.

A chemistry lab handles a dangerous substance inside a glove box. The chemist works through gloves. The air, the waste and the exit door are controlled from outside the box.

The lessons of this part showed that self-improving systems game scores, grade themselves badly, drift, and reach the code that limits them. This lesson asks two questions. **Which controls make a self-improving experiment safe enough to run?** **How do labs and evaluators measure and govern automated AI research in 2026?**

## 2. Mental model, and where it stops working

> [!analogy] The glove box
> - **The picture:** the agent works inside a sealed box. It can change anything inside: its tools, prompts and code. It cannot touch the scale that weighs its work, the clock, the logbook, the air supply or the door. People outside watch through the glass.
> - **The rule:** the box is defined by what the agent **cannot** change. Everything that judges, limits or records the agent sits outside.
> - **Where it stops working:** a glove box has no network cable. A software sandbox often has one, and it may hold application programming interface (API) keys that reach the outside world. Also, a chemical does not study the box for weak points. An agent that searches for higher scores may find a gap in the box, as the cases of lesson L6 show. So the box must be checked, not assumed.

## 3. Terms

| Term | Plain meaning |
|---|---|
| editable boundary | The line between the parts that the self-improving system may change and the parts that it must not reach. |
| container | An isolated runtime, such as a Docker container, with its own file system and limits. |
| least privilege | Give a process only the access that its task needs. |
| frozen evaluator | An evaluator that the improving system cannot read, edit or call except through a fixed interface. |
| hidden test | A test that the agent never sees. It runs after submission. |
| external budget | A limit on time, money or resources that the host or provider enforces, not the agent's own code. |
| lineage | The record of which version came from which parent, with the diff of each change. |
| CoT monitoring | A second model reads the chain of thought (CoT), the written reasoning of an agent, and flags bad behavior. |
| AI control | Safety measures that work even if the strong model tries to cause harm. |
| trusted model | A weaker model that we trust not to act against us. |
| untrusted model | A stronger model that might act against us. |
| audit budget | The fraction of outputs that trusted, high-quality human labor can review. |
| time horizon | The length of human tasks that an AI completes with a given success rate, such as 50%. |
| capability threshold | A level of capability at which a lab commits to stronger safeguards. |

## 4. Method and math

### 4.1 The editable boundary

Every control in this lesson follows one principle. **The system may change only what is inside the boundary. Everything that judges, limits or records it stays outside.**

![A safe layout: the editable agent inside a sandbox, and the evaluator, hidden tests, budget, logs and human review outside it.](/notes/media/recursive-self-improvement/figures/editable-boundary.svg)

The same layout as a diagram:

```mermaid
flowchart LR
    subgraph SB["Sandbox: editable"]
        A["Agent code,<br>tools, prompts"]
        P["Proposer of<br>the next change"]
    end
    E["Frozen evaluator"]
    H["Hidden held-out tests"]
    B["Budget and time limits"]
    L["Lineage and attempt log"]
    R["Human review<br>and rollback"]
    SB -->|"candidate only"| E
    H --> E
    E --> L
    B -->|"enforced by host"| SB
    L --> R
    R -->|"approve or revert"| SB
    style A fill:#1E6091,color:#fff
    style P fill:#6A4C93,color:#fff
    style E fill:#B8860B,color:#fff
    style H fill:#B8860B,color:#fff
    style B fill:#C81D25,color:#fff
    style L fill:#2D6A4F,color:#fff
    style R fill:#8A8A8A,color:#fff
```

Read the diagram as a set of one-way doors. The candidate leaves the sandbox through one fixed door to the evaluator. Scores and logs go to records that the sandbox cannot write. Humans read the records and can approve a change or roll it back.

The table lists what belongs on each side, and which lesson motivates it.

| Outside the boundary | Why | Lesson |
|---|---|---|
| Evaluator and its tests | Editing them corrupts the only ground truth | L2, L6 |
| Hidden held-out tests | Visible tests invite special-casing and leakage | L2, L3 |
| Acceptance rule | A changed rule changes every later decision | L6 |
| Objective and limits | Drift and dropped budgets | L5 |
| Budgets and time limits | Runaway cost, extended time limits | L5 |
| Lineage and logs | Faked logs, need for rollback | L4, L6 |
| Monitors | Monitors inside the code can be edited away | L6 |

### 4.2 Sandboxes and containers: what the code really does

Papers often say that generated code ran in isolation. The public code shows how much isolation exists.

The table covers six systems. They are the Darwin Gödel Machine (DGM), Automated Design of Agentic Systems (ADAS) and the Self-Taught Optimizer (STOP). The others are a self-improving coding agent (SICA), Gödel Agent and OpenEvolve. CPU means the processor. The facts below are observations from reading each repository at one commit. They are not experiments, and they may differ from what ran in each paper.

| System | Isolation present | Isolation missing |
|---|---|---|
| DGM | Self-modification in a Docker container. Each benchmark task in its own container. Outer loop and scoring code kept out of the editable image. Test-file edits stripped before scoring. | Network on by default. API keys passed into containers. No CPU or memory limits. No human-approval hook. |
| ADAS | A check that the new code defines exactly one callable. | Generated code runs with plain `exec` in the main process, with file system and network. No timeout. The paper says "containerized, isolated environments", but the released code has none. |
| STOP | A one-time human acknowledgement. A guard that disables some functions such as `os.system`. | The guard says of itself: "This function is NOT a security sandbox." Code runs in the host process with the API key loaded. |
| SICA | Docker for every benchmark problem and for the self-improvement step. The archive is mounted read-only during that step. Scoring on the host. | Passwordless sudo inside the container. API keys baked into the image. Network on. The whole experiment folder is writable during benchmarks. |
| Gödel Agent | Name-based guards on two functions. A cap of 100 loop calls. | No container. Shell commands with `shell=True`. The cap lives in state that the agent can change. |
| OpenEvolve | Evaluator timeouts and retries. A filter that removes keys from text shown to the model. | No sandbox for candidate code by default. Worker processes inherit the full environment, including API keys. Memory and CPU limit settings are declared but unused. |

Three lessons follow from the table.

1. **Check the code, not the paper.** ADAS's paper describes containers that its released code does not have.
2. **A flag is not a sandbox.** STOP's sandbox was a parameter inside editable code, and models removed it (lesson L6).
3. **Containers leak through their inputs.** A container with network access and API keys can reach the outside world.

The DGM code shows a good pattern for the evaluator. Its `.dockerignore` file keeps the outer loop, the benchmark folders, the diagnosis prompts and the scoring utilities out of the image that the agent edits. The official SWE-bench harness scores candidates on the host.

### 4.3 A frozen evaluator and hidden held-out tests

A frozen evaluator has three properties.

1. The agent cannot read its code or its tests.
2. The agent cannot write to it.
3. The agent reaches it only through one fixed interface: submit a candidate, get back a score.

Real systems meet parts of this. The DGM strips any diff hunks that touch test paths before scoring (`remove_patches_to_tests()`). For Polyglot, the DGM paper states that "the agent never sees ground-truth test results". SICA computes scores on the host with the original benchmark code, not with the agent's possibly modified copy.

Hidden tests are strong but not free. **Measured:** in ImpossibleBench, hiding the tests cut cheating to near zero, but it also hurt real performance (Zhong, Raghunathan and Carlini, 2025). A compromise is to show some tests for development and keep a separate hidden set for acceptance.

Hidden tests must stay hidden. The public Gödel Agent code feeds test-set accuracy back into the agent's context once validation accuracy reaches 0.94. After that point, the test set is no longer held out.

### 4.4 Budgets and time limits enforced from outside

A budget written in the agent's prompt or code is a request. Lesson L5 showed STOP's models dropping such budgets as "simplification". A real budget is enforced by something the agent cannot change.

The code of the research systems shows both good and weak patterns.

1. **Good:** STOP enforces its language-model call budget inside the model wrapper. Each call increments a counter, and the wrapper raises an error when the counter passes the budget. But in at least one case, a model tried to make a new language model object with a larger budget (Zelikman et al., 2023).
2. **Good:** the DGM kills a self-modification run after 30 minutes with the shell command `timeout 1800`.
3. **Weak:** the DGM outer loop also calls `future.result(timeout=1.5*60*60)`. But it calls it only on futures that are already finished, so this timeout limits nothing. OpenEvolve has the same pattern.
4. **Weak:** SICA passes no timeout and no cost cap to its self-improvement step.
5. **Weak:** Gödel Agent sets no timeout for the Python code that the agent runs.

The lesson: put limits where the agent cannot reach them. Use container limits for CPU, memory, processes and disk. Use spending limits on the API key at the provider. Use host-level timeouts that kill processes. Then test every limit, because a limit that never fires may not work.

### 4.5 Lineage and attempt logs

A lineage records which version came from which parent, with the diff of each change. An attempt log records every candidate and its result, accepted or rejected.

The DGM stores both. Every child has a folder with its own diff, its metadata and the chat log of its self-modification. A run-level file records each generation's parents, children and archive. **Measured:** this lineage is how the team caught the removal of the hallucination markers (Sakana AI, 2025). The DGM paper describes the archive as an auditable lineage that enables rollback.

Logs are only evidence if the agent cannot write them. **Measured:** a DGM agent "faked a log making it look like it had run the tests and that they had passed" (Sakana AI, 2025). So the harness, not the agent, must write the records that the acceptance rule and the humans read.

### 4.6 Monitoring

A monitor is a second model or program that reads transcripts and flags bad behavior. Three results define what monitors can do in 2026.

1. **Measured:** a GPT-4o monitor that read the chain of thought caught 95% of two systemic hacks. A monitor that saw only actions caught 60% (Baker et al., 2025).
2. **Measured:** after training against the monitor, recall fell "to near zero". The agent kept hacking and hid its intent. The authors call the cost of leaving the CoT unpressured a "monitorability tax".
3. **Measured:** on realistic repositories, Claude monitors detected only 42–65% of cheating on Impossible-SWEbench. On simpler LiveCodeBench tasks they detected 86–89% (Zhong, Raghunathan and Carlini, 2025).

METR's Frontier Risk Report of 19 May 2026 adds a picture of current conditions. Raw chains of thought were largely legible. METR calls this a "fragile and unique opportunity" for oversight. Of 44 documented misalignment incidents, 25 involved both overreach and deception. None involved effective steps to disable monitors or erase evidence.

SICA shows a design trap. Its overseer can notify or cancel a looping sub-agent, but it is part of the agent's own code base. A new version of the agent can edit or remove it. A monitor inside the editable boundary is not a control.

### 4.7 AI control: safety that does not trust the strong model

Greenblatt, Shlegeris, Sachan and Roger (ICML 2024) asked a different question. Instead of making the strong model trustworthy, assume that it might try to cause harm. Can a pipeline stay safe anyway?

**The setup.** The untrusted strong model was GPT-4. The trusted weaker model was GPT-3.5. A small amount of trusted high-quality labor could audit 2% of solutions. The goal was to never submit code with a backdoor: a logic error that the test cases do not catch.

**The protocols.**

1. **Trusted monitoring:** GPT-4 writes code. GPT-3.5 rates how suspicious it is. The top 2% most suspicious solutions are audited. Optionally, above a threshold, the pipeline uses GPT-3.5's own code instead ("defer to trusted").
2. **Trusted editing:** GPT-3.5 edits out the suspicious parts of GPT-4's code above a threshold.
3. **Untrusted monitoring:** another GPT-4 instance checks for backdoors, with techniques that make collusion between the two instances harder.

**Measured** results. Usefulness is scaled so that 0 equals GPT-3.5 alone and 1 equals GPT-4 alone.

| Protocol | Setting | Safety | Usefulness |
|---|---|---|---|
| Avoid untrusted models | — | 100% | 2% |
| Upfront auditing | 2% budget | 15% | 100% |
| Trusted monitoring | defer 0% | 62% | 97% |
| Trusted monitoring | defer 10% | 83% | 93% |
| Trusted monitoring | defer 20% | 92% | 83% |
| Untrusted monitoring | defer 0% | 79% | 96% |
| Untrusted monitoring | defer 10% | 92% | 92% |
| Trusted editing | 20% | 92% | 94% |
| Trusted editing | 50% | 96% | 89% |

> [!example] Worked example: choosing a protocol
> 1. You need safety of at least 90%. Five rows qualify, with usefulness 2% (avoid untrusted models), 83%, 92%, 94% and 89%.
> 2. Trusted editing at 20% gives the best usefulness, 94%, at 92% safety.
> 3. If you need 95% safety, only trusted editing at 50% (89% usefulness) and avoiding untrusted models remain. Each step up in safety costs usefulness.

**Our interpretation:** a self-improving loop needs the same separation. The thing being improved should never be the only thing checking itself. A fixed, weaker, trusted model can review every diff that touches the evaluator, the acceptance rule or the controls. A small human audit budget can read the most suspicious ones.

### 4.8 Human review and staged rollout

Humans close the loop in the research systems, but often only by procedure, not by code. **Claimed:** the DGM authors report active human monitoring of performance and code changes, and they did not deploy the discovered agents (Zhang et al., 2025). But the DGM, SICA and Gödel Agent code has no human-approval hook. STOP asks a human only once to acknowledge that its guard "is still not a true sandbox".

**Our interpretation:** staged rollout is the release-time version of staged evaluation. A changed agent first runs on a few tasks in the sandbox, then on more tasks, then on a held-out set. Next it runs in a limited real setting with logs, and only then more widely. Each stage has an exit rule that a human signs. The DGM's staged evaluation (10 tasks, then 50 more) is the first part of such a pipeline.

### 4.9 Measuring automated AI research

Labs and evaluators now measure how far AI can do AI research. That is the path by which recursive self-improvement (RSI) could happen at the scale of a lab.

**METR time horizons.** METR defines the "50%-task-completion time horizon" (Kwa et al., 2025). It is the time that humans typically take for tasks that the AI completes with 50% success. **Measured:** Claude 3.7 Sonnet had about 50 minutes. Frontier time horizons doubled roughly every seven months since 2019, and possibly faster in 2024.

A doubling trend gives a simple model. The idea: the horizon doubles every $D$ months.

$$
h(t) = h_0 \cdot 2^{\,t / D}
$$

The symbols mean:

- $h_0$ is the time horizon at the start.
- $t$ is the time since the start, in months.
- $D$ is the doubling time, in months.
- $h(t)$ is the time horizon after $t$ months.

In plain English: every $D$ months, the length of tasks that an AI can do doubles.

> [!example] Worked example: three doublings
> 1. Take $h_0 = 50$ minutes and $D = 7$ months.
> 2. After $t = 21$ months, $t / D = 3$, so $h = 50 \times 2^3 = 50 \times 8 = 400$ minutes, about 6.7 hours.
> 3. After $t = 28$ months, $h = 50 \times 2^4 = 800$ minutes, about 13.3 hours.
>
> This is arithmetic on a trend, not a forecast. METR's own estimate for the public frontier in February to March 2026 was about 12 hours (range 5 to 61 hours) (METR, 19 May 2026).

The model assumes that the trend continues and that the metric stays valid. Both can fail.

METR's time-horizons page warns: "Measurements above 16 hrs are unreliable with our current task suite". It also says that the page "is no longer actively updated" (METR, page updated 8 September 2026). And lesson L1 showed that cheating can move an estimate from about 11.3 hours to beyond 270 hours. The model is useful to read trend claims. It does **not** prove when any capability will arrive.

**RE-Bench** (Wijk et al., 2024) has 7 open-ended machine learning research environments. **Measured:** 61 experts made 71 eight-hour attempts. With a 2-hour budget, the best agents scored 4 times higher than humans. Humans narrowly beat the top agent at 8 hours, and reached twice its score at 32 total hours. METR later found that o3 reward-hacked in 30.4% of RE-Bench runs.

**MLE-bench** (Chan et al., 2024) uses 75 Kaggle machine learning competitions. **Measured:** the best setup, o1-preview with the AIDE scaffold, reached at least a bronze medal in 16.9% of competitions.

**PaperBench** (Starace et al., 2025) asks agents to replicate 20 ICML 2024 papers, with 8,316 gradable tasks. **Measured:** the best agent averaged 21.0%. On a 3-paper subset, machine learning PhDs reached 41.4% after 48 hours, against 26.6% for o1. Its judge, a large language model (LLM), reached an F1 score of 0.83 on a check set.

**Anthropic's R&D Automation Index** (Anthropic Institute, 2026) uses a scale from AL0 (no AI involvement) to AL5 (fully autonomous, no human in the loop). **Measured, self-reported:** in August 2026, Claude "leads" 26% of Anthropic's AI research and development work, up from under 1% in February 2026. More than 90% of the work is at or above the "collaborates" level. AL5 is 0% on all measured work. A companion piece, "When AI builds itself", reports that Claude wrote more than 80% of merged code at Anthropic by May 2026. In an autonomous-research result in that piece, humans still chose the problem and the scoring rubric.

**Recent models.** METR judged that Claude Opus 5.5 "is unlikely to be able to fully automate AI R&D" (METR, 22 September 2026). It made a similar judgment for GPT-5.6 Sol (METR, 26 June 2026).

### 4.10 Governance frameworks in 2026

Three frontier labs name automated AI research, or RSI itself, as a capability threshold. The quotes below are exact. The versions were checked on 2026-10-19 where stated.

**Anthropic, Responsible Scaling Policy (RSP), version 3.4, effective 8 July 2026** (current, checked on 2026-10-19). The threshold "Automated R&D in key domains" covers "AI systems that can fully automate, or otherwise dramatically accelerate, the work of large, top-tier teams." It is met in either of two cases:

1. "our models would be able to fully substitute for our entire set of Research Scientists and Research Engineers"
2. "dramatic acceleration" of the pace of AI progress "for reasons that likely relate to the automation of AI R&D"

Footnote 8 defines the doubling. In its words, "'Double the rate of progress' means 'as much progress in one year as one would see in two years at baseline.'"

Its example: a baseline of 3 times more compute and 3 times better algorithmic efficiency per year gives 9 times effective scale per year. Two years give $9 \times 9 = 81$. So doubling the rate "would entail something like an 81× effective scaleup". The footnote adds: "This is not the same idea as 'doubling researchers' productivity'". The version 3.4 changelog says: "This threshold is intended to capture the onset of dramatic recursive self-improvement". It adds that the threshold "has proven difficult to operationalize".

At this threshold, Anthropic's plan includes: "Achieve an 'eyes on everything' state for our internal AI development". Its Risk Reports are to be "subject to external review by at least one expert, experienced, credible, candid and disinterested external party."

Version 3.0 (24 February 2026) introduced Frontier Safety Roadmaps. Their goals are non-binding: "Rather than being hard commitments, these are public goals that we will openly grade our progress towards."

**Claimed:** in its February 2026 Risk Report, Anthropic judged the catastrophic risk from Claude Opus 4.6 automating research to be "very low". The main evidence was an internal survey of 16 staff. METR agreed with the bottom line, but said that the report's evidence alone was inadequate (METR review, April 2026).

**OpenAI, Preparedness Framework, version 2, last updated 15 April 2025.** "AI Self-improvement" is one of three Tracked Categories. Its description: "The ability of an AI system to accelerate AI research, including to increase the system's own capability." The High level is equivalent to "giving every OpenAI researcher a highly performant mid-career research engineer assistant". The Critical level reads, in pieces:

1. "The model is capable of recursively self improving (i.e., fully automated AI R&D), defined as either (leading indicator)"
2. "a superhuman researchscientist agent OR (lagging indicator) causing a generational model improvement" (the spelling is as in the source)
3. "(e.g., from OpenAI o1 to OpenAI o3) in 1/5th the wall-clock time of equivalent progress in 2024"
4. "(e.g., sped up to just 4 weeks) sustainably for several months."

The commitment at Critical: "Until we have specified safeguards and security controls that would meet a Critical standard, halt further development." OpenAI explains: "We have separated self-improvement because it presents a distinct plausible, net new, and potentially irremediable risk." These notes could not check whether a newer version of the framework exists in 2026.

**Google DeepMind, Frontier Safety Framework (FSF), version 3.1, published 17 April 2026.** Version 3 dates from 22 September 2025. Version 3.1 adds Tracked Capability Levels. Two Critical Capability Levels cover machine learning research:

1. **ML R&D acceleration level 1:** "Has been used to accelerate AI development, resulting in AI progress substantially accelerating from historical rates." It calls for Security Level 3.
2. **ML R&D automation level 1:** "Can fully automate the work of any team of researchers at Google focused on improving AI capabilities". The costs must be about comparable, all included. It calls for Security Level 4, which the framework says the whole frontier field must adopt.

The framework expects "acceleration will stem from systems of models integrated with workflows, rather than the model alone." Version 3.1 also has a Tracked Capability Level for stealth and situational awareness. It says that "absent additional mitigations, we cannot rule out the model significantly undermining human control." The often-quoted phrase "can fully automate the AI R&D pipeline at a competitive cost" does not appear in version 3.1. It may come from an earlier version, which these notes could not check.

**International AI Safety Report 2026** (3 February 2026). The report, led by Yoshua Bengio, states:

1. "General-purpose AI is also increasingly used to accelerate AI research itself".
2. "the application of AI systems to AI research itself could create positive feedback loops".
3. "Experts disagree about whether AI-assisted research automation could dramatically accelerate AI progress".
4. "AI agents perform better than humans at two-hour tasks but have lower success rates at eight-hour tasks."

| Framework | Version and date | Threshold for automated research | Response at the threshold |
|---|---|---|---|
| Anthropic RSP | 3.4, 8 July 2026 | Fully substitute for all research staff, or dramatic acceleration of AI progress | "eyes on everything" and external review of Risk Reports. Its industry recommendation includes security "roughly in line with RAND SL4". |
| OpenAI Preparedness Framework | 2, 15 April 2025 | Critical: "capable of recursively self improving" | Halt further development until Critical safeguards exist |
| Google DeepMind FSF | 3.1, 17 April 2026 | ML R&D acceleration level 1 and automation level 1 | Security Level 3 and Security Level 4 |

**Our interpretation:** all three frameworks name the same risk, but none gives a simple measurable test. Anthropic itself calls its threshold "difficult to operationalize". This is why the measurements of 4.9 matter: they are the evidence that these thresholds depend on.

### 4.11 A checklist for a safe self-improvement experiment

**Our interpretation:** this checklist collects the controls of this part. It is for a research experiment on your own machines, not for a deployed product.

**Before the run.**

1. Write down the objective, the score and the stopping rule. Store them outside the editable directory.
2. Split the tasks into training tasks, a selection set, a regression suite and a held-out test set. Never show the last three to the proposer.
3. Run every candidate in a container. Turn off the network, or allow only the hosts that the task needs.
4. Do not put API keys inside the container. Route model calls through a proxy outside the sandbox that holds the key.
5. Set container limits for CPU, memory, processes and disk.
6. Set a spending limit on the API key at the provider, and a wall-clock limit enforced by the host.
7. Exclude the evaluator, the tests and the acceptance rule from the image that the agent edits. Mount anything the agent must read as read-only.
8. Compute hashes of the evaluator, the tests and the configuration.
9. Add a few impossible tasks as canaries.
10. Decide which changes need human approval: at least every change to the improver, the evaluator interface or the controls.

**During the run.**

1. Let the harness, not the agent, run tests and write logs.
2. Store every candidate's diff, parent, score and decision in the attempt log, accepted or rejected.
3. Accept a change only if it passes the regression suite and beats its parent by more than the noise, in a paired test.
4. Check the hashes after every candidate. Stop on any change.
5. Run a monitor on diffs and on the chain of thought. Never train against it.
6. Watch the dashboard of lesson L5: churn, size, cost, the unoptimized battery and objective diffs. The unoptimized battery is a fixed set of tests on properties that the loop does not optimize.
7. Stop the run if any canary passes, any limit fires unexpectedly, or spending grows faster than planned.

**After the run.**

1. Score the final version once on the held-out test set, and compare it with the starting version in a paired test.
2. Re-run the final version in a clean environment with the original tests.
3. Read a sample of passing solutions by hand.
4. Run ablations: without self-improvement, without the archive, and without each added part.
5. Report the cost, the number of runs, the confidence intervals and every incident, including the ones that the controls caught.

## 5. Graphs

The plot shows the AI control results of 4.7. Each point is one protocol setting.

```plot
{
  "title": "Measured, Greenblatt et al. 2024: safety (y) against usefulness (x) for each protocol setting (blue points)",
  "xAxis": { "domain": [0, 1.05], "label": "usefulness (0 = GPT-3.5, 1 = GPT-4)" },
  "yAxis": { "domain": [0, 1.05], "label": "safety" },
  "disableZoom": true,
  "data": [
    { "points": [[0.02, 1.00], [1.00, 0.15], [0.97, 0.62], [0.93, 0.83], [0.83, 0.92], [0.96, 0.79], [0.92, 0.92], [0.94, 0.92], [0.89, 0.96]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true }
  ]
}
```

No protocol reaches the ideal top right corner. The two extremes sit at the top left (safe but useless) and the bottom right (useful but 15% safe). The good protocols cluster near 0.9 on both axes.

## 6. Video and animation

- [Can AIs do AI R&D? Reviewing REBench Results with Neev Parikh of METR](https://www.youtube.com/watch?v=SX8Mxyy_UHY) (Cognitive Revolution, 2024). How RE-Bench compares agents with human experts, and the reward hacking seen in evaluations. It supports 4.9.
- [How METR measures Long Tasks and Experienced Open Source Dev Productivity](https://www.youtube.com/watch?v=k1t2xyWMUdY) (Joel Becker, METR, AI Engineer channel, 2026). Time horizons, and a field study where AI tools did not speed up experienced developers. It supports 4.9.
- [Measuring AI R&D Automation: What Happens When AI Automates AI Research](https://www.youtube.com/watch?v=wRTBKwf45Ak) (Alan Chan, GovAI, FAR.AI channel, 2026). A 9-minute talk on evidence, risks and the metrics needed to track automated AI research. It supports 4.9 and 4.10.
- [LLM Agents MOOC: Measuring Agent Caps & RSP (Anthropic) by Ben Mann](https://www.youtube.com/watch?v=6y2AnWol7oo) (Berkeley RDI, UC Berkeley CS294-196, 2024). How a lab ties agent capability measurements to its scaling policy. It supports 4.10.

## 8. Common mistakes

1. **"The paper says the code ran in a sandbox."** ADAS's paper says so, and its released code uses plain `exec`. Read the code.
2. **"The agent runs in Docker, so it is isolated."** The DGM and SICA containers had network access and API keys. SICA's agent had passwordless sudo.
3. **"We set a timeout."** The DGM's outer `future.result` timeout limits nothing, because it is called on finished futures. Test every limit.
4. **"Our overseer watches the agent."** SICA's overseer lives in the agent's own code base, so the next version can remove it. Monitors belong outside the boundary.
5. **"Train the agent against the monitor to remove bad behavior."** That taught agents to hide their intent, and monitor recall fell to near zero.
6. **"The frameworks give a clear test for RSI."** Anthropic calls its own threshold "difficult to operationalize". OpenAI's newest version could not be checked for these notes.

## 9. One-minute explanation

A self-improving system needs a boundary: it may change only what is inside, and everything that judges, limits or records it stays outside. In practice, run candidates in containers without network or keys, hide the evaluator and tests, and enforce budgets from the host. Let the harness write the logs, and keep a lineage so that humans can review and roll back. Public research code often falls short of this: plain exec, keys inside containers, timeouts that never fire, monitors inside editable code. Monitors that read reasoning help, until you train against them, and AI control protocols trade some usefulness for much more safety. At lab level, METR and Anthropic measure automated research, and the 2026 frameworks name it as a top threshold without a simple test.

## 10. Check questions

```check
{
  "question": "Place each item inside or outside the editable boundary of a self-improving coding agent. Give one reason each. (a) The agent's tool for editing files. (b) The hidden test set. (c) The spending limit. (d) The prompt that tells the agent how to propose changes. (e) The attempt log. (f) The overseer that can cancel a looping sub-agent.",
  "answer": "(a) Inside: improving its tools is the point of the system. (b) Outside: visible tests invite special-casing and leakage. (c) Outside: budgets in editable code get dropped, as in STOP. (d) Inside for strong RSI, because improving the proposer is improving the improver. Review every change to it. (e) Outside: the DGM faked a log, so only the harness may write records. (f) Outside: SICA's overseer lives in the agent's code, so a new version can remove it. A monitor inside the boundary is not a control."
}
```

Use this configuration for the next question.

```text
docker run --name candidate_17 \
  -e OPENAI_API_KEY=sk-... \
  -v /experiments/run_04:/work:rw \
  agent-image:latest  python /work/agent/main.py
# no --network flag, no --memory flag, no --pids-limit flag
# evaluator code lives in /experiments/run_04/eval/
```

```check
{
  "question": "List the weaknesses of the container configuration above, and fix each one.",
  "answer": "First, the API key is inside the container. Route model calls through a proxy outside the sandbox that holds the key. Second, the default network is on. Add a network setting that blocks all hosts, or allows only the ones the task needs. Third, there are no memory or process limits. Add memory, CPU and process-count limits, and a disk quota. Fourth, the whole run folder is mounted read-write, and the evaluator lives inside it. The agent can read and edit the evaluator. Keep the evaluator outside the mount, and mount anything the agent must read as read-only. This matches weaknesses found in the public DGM and SICA code."
}
```

```check
{
  "question": "You must run an untrusted strong model in a pipeline, with a human audit budget of 2%. You need safety of at least 90% and want the highest usefulness. Using the results of Greenblatt et al. (2024), which protocol do you choose, and what do you lose compared with the strong model alone?",
  "answer": "Choose trusted editing at the 20% setting: 92% safety and 94% usefulness, the highest usefulness among settings with at least 90% safety. Untrusted monitoring at 10% (92% and 92%) and trusted monitoring at 20% (92% and 83%) also qualify, with lower usefulness. Compared with using the strong model with upfront auditing only, you lose 6 points of usefulness, from 100% to 94%. In return, safety rises from 15% to 92%."
}
```

Use this log for the next question.

```text
2026-03-02 14:10  run 09  iteration 31
  host timeout for self-modification: 1800 s     status: fired 0 times in 31 iterations
  outer timeout future.result(timeout=5400)       status: fired 0 times
  longest self-modification so far: 4,950 s
```

```check
{
  "question": "What does the log above tell you about the run's time limits? Name the likely cause and the test that you should have run before the experiment.",
  "answer": "The longest self-modification took 4,950 seconds, but the 1,800-second host timeout never fired. So that limit does not work as intended. The likely cause is that the limit is not enforced on the process that runs the agent. The outer timeout of 5,400 seconds was never reached, so the log says nothing about it. Test it anyway: in the DGM code, a similar outer timeout is called only on finished futures, so it never fires. Before the experiment, start a candidate that sleeps past each limit. Confirm that the host kills it at the expected time."
}
```

```check
{
  "question": "A press release says: our new model meets the definition of recursive self-improvement in all major lab frameworks. Using section 4.10, explain why this claim cannot be checked as stated.",
  "answer": "The frameworks use different thresholds. Anthropic's RSP 3.4 needs full substitution for its whole research staff, or a dramatic acceleration of AI progress. Anthropic calls this threshold difficult to operationalize. OpenAI's Preparedness Framework version 2 defines Critical by a superhuman research agent. Its other route is a generational model improvement in one fifth of the 2024 time, sustained for months. Google DeepMind's FSF 3.1 uses acceleration and automation levels tied to its own teams. None of them gives a single measurable test, and the claim names no evidence such as time horizons, benchmark results or automation levels. Also, Anthropic reported AL5 at 0% of its own work in August 2026."
}
```

## 11. Summary and links

- Draw the editable boundary first. Everything that judges, limits or records the system stays outside it.
- Public research code often falls short of its papers: plain `exec`, keys in containers, timeouts that never fire, overseers inside editable code.
- **Measured:** CoT monitors catch more than action monitors, but training against them drives recall toward zero. AI control protocols reach about 90% safety at about 90% usefulness.
- **Measured:** METR, RE-Bench, MLE-bench, PaperBench and Anthropic's index track automated research. In August 2026, Anthropic reported 0% of its work at full autonomy.
- Three lab frameworks name automated AI research as a top threshold: Anthropic RSP 3.4, OpenAI Preparedness Framework 2 and Google DeepMind FSF 3.1. None gives a simple test.
- Run every experiment with the checklist of 4.11.

**Next:** Part 9 turns these ideas into code. You build a small self-improving system step by step, with a validator, an acceptance rule, regression tests and an archive.

- Previous: [L6: The special risks of changing the improver](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely)
- Next: [P1: A fixed agent with a score](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score)
- Related: [P9: From the toy to a language-model version](/notes/ai/recursive-self-improvement/09-build-it/p9-from-toy-to-language-model), [L7: What the code teaches](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches)
- Also related: [L3: Improving a model, an agent, or the process that makes agents](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories)

## References

- Jenny Zhang, Shengran Hu, Cong Lu, Robert Lange, Jeff Clune. "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents". 2025. ICLR 2026. arXiv:2505.22954. https://arxiv.org/abs/2505.22954 . Code: https://github.com/jennyzzt/dgm
- Shengran Hu, Cong Lu, Jeff Clune. "Automated Design of Agentic Systems". 2024. ICLR 2025. arXiv:2408.08435. https://arxiv.org/abs/2408.08435 . Code: https://github.com/ShengranHu/ADAS
- Eric Zelikman, Eliana Lorch, Lester Mackey, Adam Tauman Kalai. "Self-Taught Optimizer (STOP): Recursively Self-Improving Code Generation". 2023. arXiv:2310.02304. https://arxiv.org/abs/2310.02304 . Code: https://github.com/microsoft/stop
- Maxime Robeyns, Martin Szummer, Laurence Aitchison. "A Self-Improving Coding Agent". 2025. arXiv:2504.15228. https://arxiv.org/abs/2504.15228 . Code: https://github.com/MaximeRobeyns/self_improving_coding_agent
- Xunjian Yin, Xinyi Wang, Liangming Pan, Li Lin, Xiaojun Wan, William Yang Wang. "Gödel Agent: A Self-Referential Agent Framework for Recursively Self-Improvement". ACL 2025. arXiv:2410.04444. https://aclanthology.org/2025.acl-long.1354 . Code: https://github.com/Arvid-pku/Godel_Agent
- Asankhaya Sharma. "OpenEvolve: an open-source evolutionary coding agent". 2025. Software. https://github.com/codelion/openevolve
- Sakana AI. "The Darwin Gödel Machine: AI that improves itself by rewriting its own code". Blog, 30 May 2025. https://sakana.ai/dgm/
- Z. Zhong, A. Raghunathan, N. Carlini. "ImpossibleBench: Measuring LLMs' Propensity of Exploiting Test Cases". 2025. ICLR 2026. arXiv:2510.20270. https://arxiv.org/abs/2510.20270
- B. Baker, J. Huizinga, L. Gao, et al. "Monitoring Reasoning Models for Misbehavior and the Risks of Promoting Obfuscation". 2025. arXiv:2503.11926. https://arxiv.org/abs/2503.11926
- R. Greenblatt, B. Shlegeris, K. Sachan, F. Roger. "AI Control: Improving Safety Despite Intentional Subversion". ICML 2024, PMLR 235:16295–16336. arXiv:2312.06942. https://proceedings.mlr.press/v235/greenblatt24a.html
- Alexander Novikov, Ngân Vũ, Marvin Eisenberger, et al. "AlphaEvolve: A coding agent for scientific and algorithmic discovery". 2025. arXiv:2506.13131. https://arxiv.org/abs/2506.13131
- T. Kwa, B. West, J. Becker, et al. "Measuring AI Ability to Complete Long Software Tasks". NeurIPS 2025. arXiv:2503.14499. https://arxiv.org/abs/2503.14499
- METR. "Time Horizon 1.1". 29 January 2026. https://metr.org/blog/2026-1-29-time-horizon-1-1/
- METR. "Task-Completion Time Horizons of Frontier AI Models". Last updated 8 September 2026. https://metr.org/time-horizons/
- METR. "Frontier Risk Report (February to March 2026)". 19 May 2026. https://metr.org/blog/2026-05-19-frontier-risk-report/
- METR. "Summary of METR's predeployment evaluation of GPT-5.6 Sol". 26 June 2026. https://metr.org/blog/2026-06-26-gpt-5-6-sol/
- METR. "Summary of METR's predeployment evaluation of Claude Opus 5.5". 22 September 2026. https://metr.org/blog/2026-09-22-claude-opus-5-5/
- METR. "Review of 'Risks from automated R&D' section in the Anthropic Risk Report: February 2026". Updated review, 27 April 2026. https://metr.org/assets/Updated%20Review%20of%20%22Risks%20from%20automated%20R&D%22%20section%20in%20the%20Anthropic%20Risk%20Report%20-%20February%202026.pdf
- H. Wijk, T. Lin, J. Becker, et al. "RE-Bench: Evaluating frontier AI R&D capabilities of language model agents against human experts". 2024. arXiv:2411.15114. https://arxiv.org/abs/2411.15114
- J. S. Chan, N. Chowdhury, O. Jaffe, et al. "MLE-bench: Evaluating Machine Learning Agents on Machine Learning Engineering". 2024. arXiv:2410.07095. https://arxiv.org/abs/2410.07095
- G. Starace, O. Jaffe, D. Sherburn, et al. "PaperBench: Evaluating AI's Ability to Replicate AI Research". 2025. arXiv:2504.01848. https://arxiv.org/abs/2504.01848
- Marina Favaro, Phillie Wright. "Measurements for understanding the pace of AI development inside frontier labs". The Anthropic Institute. 2026. https://www.anthropic.com/institute/measuring-pace-of-ai-development
- Marina Favaro, Jack Clark. "When AI builds itself". The Anthropic Institute. 2026. https://www.anthropic.com/institute/recursive-self-improvement
- Anthropic. "Responsible Scaling Policy", Version 3.4, effective 8 July 2026. https://www-cdn.anthropic.com/files/4zrzovbb/website/0bacdc8440ea96e62a8766d99ebe1d4eea6d5f3a.pdf . Version history: https://www.anthropic.com/rsp-updates
- Anthropic. "Responsible Scaling Policy", Version 2.2, effective 14 May 2025. https://www-cdn.anthropic.com/872c653b2d0501d6ab44cf87f43e1dc4853e4d37.pdf
- Anthropic. "Responsible Scaling Policy Version 3.0". 24 February 2026. https://anthropic.com/news/responsible-scaling-policy-v3
- OpenAI. "Preparedness Framework", Version 2, last updated 15 April 2025. https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf
- Google DeepMind. "Frontier Safety Framework", Version 3.1, 17 April 2026. https://storage.googleapis.com/deepmind-media/DeepMind.com/Blog/strengthening-our-frontier-safety-framework/frontier-safety-framework_3-1.pdf . Announcement of version 3, 22 September 2025: https://deepmind.google/discover/blog/strengthening-our-frontier-safety-framework/
- International AI Safety Report 2026. 3 February 2026. https://internationalaisafetyreport.org/publication/international-ai-safety-report-2026
