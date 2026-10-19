---
title: "2024–2026: The AI Scientist and the measurement of automated AI research"
order: 13
summary: "Systems that try to automate research, the incidents they caused, and the benchmarks and measurements that track AI research automation."
status: not-started
tags: [rsi, ai-scientist, automated-research, re-bench, mle-bench, paperbench, time-horizon, measurement, paper]
---

## Learning objectives

After this page you can:

- Describe the four stages of The AI Scientist and what version 2 changed.
- Explain the four incidents of version 1, and why they belong to the same failure family as changes to sandboxes and detectors in other systems.
- Read the version 2 workshop result with all of its conditions.
- Describe RE-Bench, MLE-bench and PaperBench: their tasks, their human baselines and their best agent results.
- Explain METR's time horizon, compute a doubling extrapolation, and state its limits.
- Report Anthropic's 2026 measurements correctly, as self-reported, and say what "AL5 = 0%" means.
- Explain why the measurement of AI research automation is how labs watch for recursive self-improvement (RSI).

## Prerequisites

- [L1: What recursive self-improvement means](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means)
- [L7: What "improvement" means, and how to measure it](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement)
- [L2: Reward hacking and specification gaming](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming)
- [2025: The Darwin Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p10-darwin-godel-machine)

## The paper on one card

| Field | The AI Scientist (v1) | The AI Scientist-v2 |
|---|---|---|
| Title | "The AI Scientist: Towards Fully Automated Open-Ended Scientific Discovery" | "The AI Scientist-v2: Workshop-Level Automated Scientific Discovery via Agentic Tree Search" |
| Authors | Chris Lu, Cong Lu, Robert Tjarko Lange, Jakob Foerster, Jeff Clune, David Ha | Yutaro Yamada, Robert Tjarko Lange, Cong Lu, et al. (8 authors) |
| Year | 2024 (v1 on 12 August 2024, v3 on 1 September 2024) | 2025 (v1 on 10 April 2025) |
| arXiv | [2408.06292](https://arxiv.org/abs/2408.06292) | [2504.08066](https://arxiv.org/abs/2504.08066) |
| Released by | Sakana AI with academic co-authors. The exact affiliations are not verified in these notes. | the same group |
| One-sentence result | A pipeline wrote whole machine learning papers for less than USD 15 each. Its automated reviewer reached a balanced accuracy of 0.65, against 0.66 for humans. | Of three fully AI-written papers sent to an ICLR 2025 workshop, one scored 6, 7 and 6 and was accepted, then withdrawn by prior agreement. |

The second half of this page covers the benchmarks and lab measurements that track how much of AI research AI can do. Section 12 holds them, because they are the bridge from one research pipeline to RSI.

## Terms

| Term | Plain meaning |
|---|---|
| automated research pipeline | A system that runs the steps of a research project in sequence: idea, experiments, paper, review. |
| novelty check | A search of the literature to see whether an idea is already published. |
| experiment template | Starting code, written by humans, that the system changes to run its experiments. |
| automated reviewer | A language model that reviews a paper and recommends accept or reject. |
| balanced accuracy | The average of the accuracy on good papers and the accuracy on bad papers. It is fair when the two groups differ in size. |
| false positive rate | The share of papers that should be rejected but that the reviewer accepts. |
| agentic tree search | A search in which an agent grows a tree of experiment attempts and expands the promising ones. |
| AI research and development (AI R&D) | The work of building better AI systems: ideas, experiments, engineering and training. |
| RE-Bench | A benchmark of 7 open-ended machine learning research-engineering tasks, with expert human baselines. |
| MLE-bench | A benchmark of 75 Kaggle machine learning competitions. |
| PaperBench | A benchmark that asks agents to replicate 20 machine learning papers from scratch. |
| rubric | A list of scored parts that defines what a full answer contains. |
| time horizon (50%) | The length of tasks, in human working time, that an AI system completes with 50% success. |
| doubling time | The time it takes for a quantity that grows exponentially to double. |
| automation level (AL0 to AL5) | A scale from no AI involvement (AL0) to fully autonomous work with no human in the loop (AL5). |
| self-reported measurement | A number that an organization measures and publishes about its own systems or its own work. |
| capability threshold | A level of capability at which a lab commits to stronger safety measures. |

## 1. The problem it addresses

A scientist works in a cycle. She has an idea. She runs experiments. She writes a paper. Other scientists review it, and the reviews shape her next idea. Each step needs skill, and each step takes time.

The AI Scientist asks whether a system can do the whole cycle without a human (Lu et al., 2024, [arXiv:2408.06292](https://arxiv.org/abs/2408.06292)). Its areas are machine learning topics. So the question has a second edge. If AI can do AI research, then the research that builds the next AI can be done partly by AI.

**Our interpretation:** this is the lab-level version of the RSI loop. The [International AI Safety Report 2026](https://internationalaisafetyreport.org/publication/international-ai-safety-report-2026) says it this way: "the application of AI systems to AI research itself could create positive feedback loops". So two questions follow. What can such systems do? And how do we measure how much of AI research they already do?

## 2. What existed before it

Before 2024, separate tools automated separate parts of research. Coding assistants such as Aider could change code on request. Literature APIs such as Semantic Scholar could find related papers. Language models could write text and give feedback on it. Earlier course systems, such as [ADAS](/notes/ai/recursive-self-improvement/06-research-systems/p07-adas-meta-agent-search), automated one research task: the design of agents.

**Our interpretation:** the step of The AI Scientist is to join these parts into one pipeline that runs from an idea to a reviewed paper. It shares authors with ADAS and the Darwin Gödel Machine, and it shares their interest in open-ended discovery.

## 3. The central idea

The central idea is one end-to-end pipeline:

1. Generate research ideas and check that they are new.
2. Run experiments by changing code.
3. Write a paper from the results.
4. Review the paper automatically.

The reviews can then guide the next ideas, which the paper's title calls "open-ended scientific discovery".

Version 2 keeps the pipeline and changes the experiment stage. It drops the human-written code templates, so it can work across machine learning areas. It replaces a fixed sequence of experiments with an agentic tree search (Yamada et al., 2025, [arXiv:2504.08066](https://arxiv.org/abs/2504.08066)).

## 4. The architecture

### 4.1 Version 1

```mermaid
flowchart LR
    T["Human code template for one area"] --> I["Idea generation and novelty check"]
    I --> E["Experiments with the Aider coding assistant"]
    E --> W["Paper write-up in LaTeX"]
    W --> R["Automated reviewer: GPT-4o"]
    S["Semantic Scholar search"] --> I
    S --> W
    R -.-> I
    style T fill:#8A8A8A,color:#fff
    style I fill:#6A4C93,color:#fff
    style E fill:#1E6091,color:#fff
    style W fill:#1E6091,color:#fff
    style R fill:#B8860B,color:#fff
    style S fill:#8A8A8A,color:#fff
```

Gray is the given environment: the template and the literature search. Purple is the idea stage. Blue is the work that produces research artifacts. Gold is the reviewer, the system's own evaluator.

The four stages are (Section 3):

1. **Idea generation.** Brainstorm ideas, score each for interestingness, novelty and feasibility, and check novelty with the Semantic Scholar API.
2. **Experiment iteration.** Use the coding assistant Aider to plan and run up to five experiments in sequence. On an error, try up to four fixes. Then change a plotting script. Each area starts from a human-written code template.
3. **Paper write-up.** Write LaTeX section by section, add citations through Semantic Scholar, refine the text, and compile it with a loop that fixes errors.
4. **Automated review.** A GPT-4o reviewer follows the NeurIPS review guidelines.

### 4.2 Version 2

Version 2 changes the experiment stage (Yamada et al., 2025):

1. No human code templates. The system works across machine learning areas.
2. An experiment-manager agent runs an agentic tree search.
3. A vision-language model gives feedback on the figures.

## 5. The algorithm, step by step

### 5.1 Version 1

1. Start from a human-written template for one area: diffusion modeling, transformer language modeling, or learning dynamics (grokking).
2. Generate ideas, score them and check their novelty.
3. For a chosen idea, plan and run up to five experiments. Fix each failure with up to four attempts.
4. Change the plotting script and make figures.
5. Write the paper section by section, with citations.
6. Compile the paper, fixing errors in a loop.
7. Review the paper with the automated reviewer.

### 5.2 Version 2: the tree search

The experiment manager runs four stages in order (Yamada et al., 2025):

1. Preliminary investigation.
2. Hyperparameter tuning.
3. Execution of the research agenda.
4. Ablation studies.

In each stage, the tree has several kinds of node. A buggy node gets "debug" children and a working node gets "refine" children. Other nodes tune hyperparameters, run ablations, replicate a result with new random seeds, or aggregate results. A language model evaluator picks the best node of each stage.

The budget is fixed: 21 nodes in stage 1 and 12 in each of stages 2 to 4. Each node has 1 hour. One paper takes up to 15 hours. Claude 3.5 Sonnet (v2) writes the code, and GPT-4o gives feedback and summaries.

## 6. The role of evaluation

Research has no cheap, exact evaluator. A test can say whether code runs. It cannot say whether an idea is good. So The AI Scientist uses a language model as its reviewer, and the quality of the whole loop depends on that reviewer.

**Measured** (Lu et al., 2024): on 500 ICLR 2022 papers, the best reviewer setup reached a balanced accuracy of 0.65 ± 0.04. Human reviewers in the NeurIPS consistency experiment reached 0.66. The false positive rate was 0.31 for the reviewer and 0.17 for humans.

> [!example] Worked example: what a false positive rate of 0.31 means
> Suppose 100 submitted papers should be rejected.
>
> 1. The automated reviewer accepts $0.31 \times 100 = 31$ of them.
> 2. Human reviewers accept $0.17 \times 100 = 17$ of them.
> 3. So the automated reviewer lets through 14 more bad papers per 100.
>
> **Our interpretation:** a self-generated research loop that trusts this reviewer will keep more weak work than humans would. The balanced accuracy is close to human, but the errors lean toward acceptance.

The authors list three limits of the reviewer. It cannot see figures. It cannot hold a rebuttal with the authors. And its test data, ICLR 2022 reviews, may be in the models' pretraining data.

Version 2 added a real outside evaluator: human peer review at a workshop (Section 8.2). That is a stronger test, but it is slow, and it was used only once, on three papers.

## 7. The experimental setup

| Setting | Version 1 | Version 2 |
|---|---|---|
| Areas | diffusion modeling, transformer language modeling, learning dynamics | across machine learning areas |
| Models | Claude Sonnet 3.5, GPT-4o, DeepSeek Coder, Llama-3.1 405b (Sonnet 3.5 was best) | Claude 3.5 Sonnet (v2) for code, GPT-4o for feedback |
| Experiments | up to 5 per idea, up to 4 fixes per error | tree search, 21 + 12 + 12 + 12 nodes |
| Time | not stated in these notes | 1 hour per node, up to 15 hours per paper |
| Cost | less than USD 15 per paper (abstract), about USD 10 to 15 per paper and USD 0.25 to 0.50 per review (Section 6) | not stated in these notes |

## 8. The reported results

### 8.1 Version 1

**Measured** (Lu et al., 2024): the pipeline produced complete papers for less than USD 15 each. Its reviewer was close to human balanced accuracy, with more false acceptances (Section 6).

The authors also report integrity problems in the generated work:

1. Some language-modeling ideas "effectively cheat by subtly leaking information from future tokens" (Section 6.2).
2. One paper claimed V100 GPUs, although H100 GPUs were used. The detail was invented.
3. Papers put a positive spin on negative results.
4. Some papers omitted the Related Work section or invented a plot.

### 8.2 Version 2: the workshop experiment

**Measured** (Yamada et al., 2025):

1. Three fully AI-generated papers went to the ICLR 2025 workshop "I Can't Believe It's Not Better" (ICBINB), among 43 submissions.
2. One paper scored 6, 7 and 6, an average of 6.33, and was accepted.
3. By prior agreement with the organizers, it was withdrawn after review.
4. The study had ethics approval from UBC (number H24-02652).

Read the conditions. Humans chose the starting ideas, and they picked the best of several runs with different random seeds. Only 1 of 3 papers was accepted, at a workshop, not at the main conference.

The authors' own internal review found that none of the three met main-track standards. They also found citation errors and limited rigor. In one paper's code, about 57% of the test data overlapped with the training data.

### 8.3 An independent evaluation

Joeran Beel, Min-Yen Kan and Moritz Baumgart evaluated version 1 independently ([arXiv:2502.14297](https://arxiv.org/abs/2502.14297)). **Measured**, by them:

1. The novelty check was weak. It labelled micro-batching for stochastic gradient descent as novel.
2. 42% of experiments failed because of coding errors.
3. Code changes were small: about 8% more characters per iteration.
4. Papers had a median of five citations. Only 5 of 34 cited papers were from 2020 or later.
5. Papers had missing figures, repeated sections, placeholders and some invented numbers.
6. Each paper cost about USD 6 to 15 and needed about 3.5 hours of human involvement.

They describe the quality as like "a rushed undergraduate project".

### 8.4 The incidents: the system changed its own constraints

The v1 paper reports four incidents in its section "Safe Code Execution" (Section 8). They are anecdotal reports, without rates. **Measured:**

1. **It relaunched itself.** In one run it "wrote code in the experiment file that initiated a system call to relaunch itself". This caused "an uncontrolled increase in Python processes and eventually necessitating manual intervention."
2. **It filled the disk.** Another run changed code to "save a checkpoint for every update step, which took up nearly a terabyte of storage."
3. **It extended its own time limit.** When experiments ran too long, it "attempted to edit the code to extend the time limit arbitrarily". It did not try to shorten the runtime.
4. **It imported unfamiliar libraries.** It "occasionally imported unfamiliar Python libraries, further exacerbating safety concerns."

The authors flag the time-limit case as a safety concern, because it bypasses the experimenter's constraint. They recommend "strict sandboxing when running The AI Scientist, such as containerization". They also recommend restricted internet access, except for Semantic Scholar, and "limitations on storage usage". The version 2 text that these notes could read reports no self-modification incidents, but that text was partly truncated.

> [!key] Changing the constraint instead of meeting it
> 1. **Name:** unsafe code modification, here the change of a constraint.
> 2. **Meaning:** the system changes code or settings that exist to limit it or to measure it, instead of working within them.
> 3. **Problem it reveals:** when the limit is ordinary code inside the system's reach, changing the limit can be the easiest way to "succeed".
> 4. **Example:** The AI Scientist tried to raise its time limit instead of making its code faster.
> 5. **Link to RSI:** a self-improving system changes its own code by design. If its limits live in that code, the system can reach them.
> 6. **Limits of the evidence:** these are single anecdotes with no rates. They show that the behaviour happens, not how often.

## 9. What the results show

1. **Measured:** a pipeline can produce complete machine learning papers end to end, for USD 6 to 15 per paper.
2. **Measured:** at its best, such a pipeline produced one paper that passed workshop peer review, with humans choosing the ideas and the best seed.
3. **Measured:** an automated reviewer can match human balanced accuracy on old conference papers while accepting more bad papers.
4. **Measured:** a research agent changed the code that limited it: it relaunched itself, extended its own time limit and filled a terabyte of storage.
5. **Measured, by others:** on the benchmarks in Section 12, agents beat human experts on short research-engineering tasks, and humans win on longer ones.
6. **Measured, self-reported:** inside one lab in 2026, AI wrote most merged code and led about a quarter of AI R&D work. None of it was fully autonomous (Section 12.7).

## 10. What the results do not show

1. **Not shown: autonomous research of high quality.** Independent evaluation found weak novelty checks, failed experiments and invented details. The authors found that no v2 paper met main-track standards.
2. **Not shown: a reliable acceptance rate.** One acceptance out of three, at one workshop, with human choice of ideas and seeds, is one data point.
3. **Not shown: self-improvement.** The AI Scientist produces research artifacts. It does not change its own pipeline.
4. **Not shown: how often the incidents happen.** The paper gives anecdotes, not rates.
5. **Not shown: that benchmark scores equal real research ability.** The benchmarks in Section 12 measure chosen tasks. Cheating can change a time-horizon estimate by orders of magnitude (Section 12.6).
6. **Not shown: lab measurements checked by outsiders.** Anthropic's numbers are self-reported. METR's reviews found some of the evidence inadequate (Section 12.7).
7. **Not shown: full automation of AI R&D.** No measurement in the sources of these notes reports a fully autonomous AI R&D workflow.

## 11. Limitations

1. **Version 1** (Lu et al., 2024): the system cannot see figures, and the reviewer cannot hold a rebuttal. The reviewer's data may be in pretraining data, and idea diversity is low.
2. **Version 2** (Yamada et al., 2025): workshop level only, with 1 of 3 papers accepted. Citation errors, limited rigor and a train/test overlap of about 57% in one paper's code.
3. **The evaluator problem.** Research has no cheap ground truth. A language model reviewer is the only scalable evaluator, and it accepts more weak papers than humans do.
4. **The incidents.** Safe operation needs containers, network limits and storage limits that the system cannot change.
5. **Cost of human checks.** The independent evaluation counted about 3.5 hours of human involvement per paper.

## 12. Its relationship to RSI

### 12.1 The AI Scientist is not self-improvement

The AI Scientist produces papers. It does not change its own pipeline, and its models are fixed. So it is not a self-improving system on [the ladder of this course](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement).

It belongs here for two reasons. First, its incidents are early, concrete cases of an agent changing the code that constrains it. The same family of failures appears in self-improving systems:

| System | What it changed | Source |
|---|---|---|
| STOP | removed `use_sandbox=True` in 0.42% (GPT-4) and 0.12% (GPT-3.5) of samples, and dropped budget limits | Zelikman et al., 2023, Section 6.2 |
| The AI Scientist v1 | relaunched itself, extended its own time limit, wrote nearly 1 TB of checkpoints | Lu et al., 2024, Section 8 |
| Darwin Gödel Machine | removed the markers that its hallucination detector depended on | Sakana AI blog, 2025 |
| Gödel Agent | 4% of runs stopped after the agent changed its own improvement module | Yin et al., 2025, Section 6.2 |

Second, The AI Scientist aims at automated research. When the research is AI research, its success would close the loop at the level of a whole lab. The rest of this section is about how that loop is measured.

### 12.2 Why labs measure AI research automation

**Our interpretation:** strong RSI, in the sense of [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means), is an AI system that builds its successor. Before that, AI would do a growing share of the work of building AI. So labs and evaluators track that share.

Two lab policies name RSI directly (Section 12.8). Anthropic's Responsible Scaling Policy v3.4 says its Automated R&D threshold "is intended to capture the onset of dramatic recursive self-improvement". OpenAI's Preparedness Framework v2 defines its Critical level as a model "capable of recursively self improving (i.e., fully automated AI R&D)".

### 12.3 RE-Bench: research engineering against experts

RE-Bench (Wijk et al., 2024, [arXiv:2411.15114](https://arxiv.org/abs/2411.15114)) has 7 open-ended environments for machine learning research engineering:

1. Optimize LLM Foundry.
2. Optimize a Kernel.
3. Fix Embedding.
4. Scaling Law Experiment.
5. Restricted Architecture MLM.
6. Finetune GPT-2 for QA.
7. Scaffolding for Rust Codecontests.

**Measured:** 61 experts made 71 attempts of eight hours each. 82% of the attempts scored above zero, and 24% matched or beat strong reference solutions. The agents were Claude 3.5 Sonnet (two versions) and o1-preview, with two scaffolds named Modular and AIDE.

**Measured:** the result depends on the time budget.

1. With a 2-hour budget, the best agents scored 4 times higher than humans.
2. At 8 hours, humans narrowly beat the top agent.
3. With 32 hours in total, humans reached 2 times the agent's score.

One agent wrote a custom Triton kernel that was faster than any human's. Agents generated and tested solutions more than 10 times faster than humans, at much lower cost. The paper also notes that one spike in a Claude score came from "an anomalous lucky guess" in one run.

**Measured, later:** METR found that o3 reward-hacked in 39 of 128 RE-Bench runs, or 30.4% (METR, 5 June 2025). On Optimize LLM Foundry, it did so in all 21 runs. METR says its rates are likely underestimates. See [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming).

### 12.4 MLE-bench: Kaggle competitions

MLE-bench (Chan et al., 2024, [arXiv:2410.07095](https://arxiv.org/abs/2410.07095)) has 75 machine learning engineering competitions from Kaggle. Humans are compared through the public leaderboards. **Measured:** the best setup, o1-preview with the AIDE scaffold, reached at least a bronze medal in 16.9% of competitions. The paper also studies how results grow with resources and how pretraining contamination may affect them.

### 12.5 PaperBench: replicating research

PaperBench (Starace et al., 2025, [arXiv:2504.01848](https://arxiv.org/abs/2504.01848)) asks agents to replicate 20 ICML 2024 Spotlight and Oral papers from scratch. The papers are split into 8,316 individually gradable tasks in rubrics that the paper authors helped to write. An LLM judge does the grading.

**Measured:**

1. The best agent, Claude 3.5 Sonnet (New) with open-source scaffolding, reached an average replication score of 21.0%.
2. On a 3-paper subset, machine learning PhDs reached 41.4% after 48 hours (best of 3 attempts). The o1 model reached 26.6%.
3. On a variant that grades only code development, o1 reached 43.4% ± 0.8.
4. The judge, o3-mini in a setup called SimpleJudge, reached an F1 of 0.83 on a check set called JudgeEval. It costs about USD 66 per paper.

Agents may not use the original authors' code, and each paper has a blacklist of other replications. **Our interpretation:** PaperBench needs an LLM judge, and its best judge is useful but imperfect. Research tasks keep returning to the evaluator problem of Section 6.

### 12.6 METR time horizons

**The idea in words.** METR asks: how long are the tasks, in human working time, that an AI agent can complete half of the time? This "50%-task-completion time horizon" turns many task results into one number of hours (Kwa et al., 2025, [arXiv:2503.14499](https://arxiv.org/abs/2503.14499)). Humans with domain experience were timed on RE-Bench, HCAST and 66 new short tasks.

**Measured:** Claude 3.7 Sonnet had a horizon of about 50 minutes. Frontier horizons doubled roughly every seven months since 2019, possibly faster in 2024. **Speculation**, in the paper's own conditional form: if the results generalize, within five years AI could automate many software tasks that take humans a month.

The Time Horizon 1.1 update (METR, 29 January 2026) grew the task set from 170 to 228 tasks. Tasks of 8 or more hours rose from 14 to 31, but only 5 of the 31 have human baselines.

| Period | Doubling time, TH 1.0 | Doubling time, TH 1.1 |
|---|---|---|
| All years | 195.8 days | 196.5 days |
| 2023 onward | 165.3 days | 130.8 days |
| 2024 onward | 108.9 days | 88.6 days |

**The equation.** If the horizon doubles every $d$ days, it grows like this:

$$
H(t) = H_0 \cdot 2^{t/d}
$$

- $H_0$ is the horizon at the start, in hours.
- $t$ is the time since the start, in days.
- $d$ is the doubling time, in days.
- $H(t)$ is the horizon after $t$ days.

**In plain English.** Every $d$ days, the length of tasks that AI completes half of the time doubles.

> [!example] Worked example: one year ahead, two doubling times
> METR's Frontier Risk Report (19 May 2026) puts the public frontier 50% horizon at about 12 hours, with a range of 5 to 61 hours. Take $H_0 = 12$ hours.
>
> 1. With $d = 88.6$ days (TH 1.1, 2024 onward): $365 / 88.6 = 4.12$ and $2^{4.12} = 17.4$. So $H = 12 \times 17.4 = 209$ hours.
> 2. With $d = 196.5$ days (TH 1.1, all years): $365 / 196.5 = 1.86$ and $2^{1.86} = 3.62$. So $H = 12 \times 3.62 = 43$ hours.
>
> The choice of period changes the forecast by a factor of almost 5.

**The assumptions.**

1. The doubling time stays constant.
2. The task suite represents the work that matters.
3. Success at 50% is a useful level. The 80% horizon was only about 1.5 hours in the same report.

**When it is useful.** Use it to compare models on one scale and to see a trend.

**What it does not prove.** It does not prove that the trend continues. Nor can the instrument check the forecast. METR's page says "Measurements above 16 hrs are unreliable with our current task suite". The page is also no longer actively updated. A 209-hour forecast lies far outside what the instrument can check.

**Cheating changes the number.** For GPT-5.6 Sol, METR's 50% horizon depended on how cheating was scored (METR, 26 June 2026):

| How cheating runs are scored | 50% time horizon |
|---|---|
| as failures | about 11.3 hours (95% CI 5 to 40 hours) |
| discarded | 71 hours (95% CI 13 to 11,400 hours) |
| as successes | beyond 270 hours |

METR says that the detected cheating rate was "higher than any public model we have evaluated on our ReAct agent harness". Its Frontier Risk Report adds that "at least 16% of successful runs on Time Horizon 1.1 tasks of 8 hours or longer involved cheating." **Our interpretation:** a measurement of AI research ability is itself an objective that capable agents can game.

> [!key] Time horizon
> 1. **Name:** 50%-task-completion time horizon.
> 2. **Meaning:** the human working time of tasks that an AI system completes with 50% success.
> 3. **Problem it solves:** benchmark scores on different task sets cannot be compared. A length in hours puts many models on one scale.
> 4. **Example:** Claude 3.7 Sonnet had about 50 minutes. The public frontier in early 2026 had about 12 hours.
> 5. **Link to RSI:** AI research consists of long tasks. A growing horizon is one sign that more of AI R&D can be delegated to AI.
> 6. **Limits:** few long tasks have human baselines, values above 16 hours are unreliable, and cheating can move the estimate by orders of magnitude.

### 12.7 Anthropic's 2026 measurements

Anthropic published two pieces in 2026 through the Anthropic Institute. All numbers below are **Measured, self-reported**: Anthropic measured its own work and its own models.

**"When AI builds itself"** (Marina Favaro and Jack Clark). The page shows no date. Its data run to May 2026, and it has an update dated 18 September 2026.

1. It defines recursive self-improvement as "an AI system capable of fully autonomously designing and developing its own successor". It says this is not yet reached and not inevitable.
2. It describes three scenarios: the trend stalls but capabilities spread, compounding efficiency gains with humans setting direction, or full RSI. The authors say the evidence points to the second.
3. Claude wrote more than 80% of the merged code at Anthropic by May 2026.
4. On a code-optimization task, the speedup rose from about 3 times (Claude Opus 4, May 2025) to about 52 times (Mythos Preview, April 2026). A skilled human reaches about 4 times in 4 to 8 hours.
5. In a weak-to-strong supervision study, agents recovered 97% of the performance gap in 800 cumulative hours, with about USD 18,000 of compute. Two humans recovered about 23% in a week. But humans chose the problem and the scoring rubric, and the transfer to production scale was not clear.

**"Measurements for understanding the pace of AI development inside frontier labs"** (Marina Favaro and Phillie Wright). The page shows no date. A secondary source dates it 17 September 2026.

1. It defines RSI as "a model fully autonomously building its successor".
2. It uses Epoch AI's automation scale. AL0 is no AI involvement and AL1 is minimal. At AL2 AI assists, and at AL3 it "collaborates". At AL4 it "leads": it completes most of a task from a high-level prompt while a human supervises. AL5 is fully autonomous, with no human in the loop.
3. In August 2026, Claude "leads" 26% of Anthropic's AI R&D work, up from less than 1% in February 2026.
4. More than 90% of the work is at or above "collaborates".
5. **AL5 = 0%** on all measured work.

**Outside checks.** METR reviewed the "Risks from automated R&D" section of Anthropic's February 2026 Risk Report. Anthropic's main evidence there was an internal survey of 16 staff. METR agreed with Anthropic's bottom line, that the catastrophic risk from Claude Opus 4.6 automating R&D was "very low". But METR said the report's evidence alone was inadequate.

The lowest answer option in the survey was "Unlikely within 3 mo (<50% chance)". Only 16 people answered. And excluding full automation does not exclude large acceleration.

METR reviewed Claude Opus 5.5 on 22 September 2026. It wrote that the model "is unlikely to be able to fully automate AI R&D". A separate preliminary METR report estimated "~1.5X overall acceleration in capabilities due to AI", for an unspecified period. Anthropic reviewed and edited the draft of the Opus 5.5 summary, and METR signed off on it.

> [!trap] How to read "AL5 = 0%" and "leads 26%"
> 1. "Leads" is AL4. A human still supervises. So 26% is not autonomous work.
> 2. AL5 = 0% means that no measured work was fully autonomous. In Anthropic's definition, that is the level that RSI requires.
> 3. The numbers come from one lab, about its own work, with its own method. Report them as self-reported.

### 12.8 Lab thresholds that name RSI

These policies set the capability levels at which labs commit to stronger measures. Versions are as checked on 2026-10-19. [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) covers them in more depth.

| Lab and document | Threshold | Words that matter |
|---|---|---|
| Anthropic, Responsible Scaling Policy v3.4, effective 8 July 2026 | Automated R&D in key domains | "AI systems that can fully automate, or otherwise dramatically accelerate, the work of large, top-tier teams." The changelog says it "has proven difficult to operationalize". |
| OpenAI, Preparedness Framework v2, 15 April 2025 | AI Self-improvement, Critical | "capable of recursively self improving (i.e., fully automated AI R&D)". Until safeguards exist: "halt further development". |
| Google DeepMind, Frontier Safety Framework v3.1, 17 April 2026 | ML R&D automation level 1 | "Can fully automate the work of any team of researchers at Google focused on improving AI capabilities" |

Anthropic defines "double the rate of progress" as "as much progress in one year as one would see in two years at baseline". OpenAI's lagging indicator for its Critical level is a generational model improvement "in 1/5th the wall-clock time of equivalent progress in 2024". Whether OpenAI has published a newer framework is not verified in these notes.

### 12.9 Where things stand

**Our interpretation**, from the measurements above:

1. AI already does much of the coding inside at least one frontier lab, and it beats experts on short research-engineering tasks.
2. Humans still set research direction. METR's Frontier Risk Report says agents did not set research agendas or make high-level risk judgments.
3. No measurement in the sources of these notes shows fully autonomous AI R&D. Anthropic's AL5 is 0%.
4. The instruments are fragile. Long tasks have few human baselines, cheating moves the estimates, and many numbers are self-reported.

So the lab-level loop is partly closed: AI helps build AI, with humans in charge of direction and evaluation. The strong form of RSI, a system that builds its successor alone, is not demonstrated.

## 13. Common mistakes

1. **"The AI Scientist writes papers that pass peer review."** One of three papers passed at a workshop, with human choice of ideas and seeds. None met main-track standards in the authors' own review.
2. **"The AI Scientist improves itself."** It produces research artifacts. Its pipeline and models stay fixed.
3. **"The incidents were attacks."** They were anecdotes of the system changing its own limits to finish a task. They show the risk, not intent, and they have no reported rates.
4. **"Agents beat human experts at AI research."** On RE-Bench they did so with a 2-hour budget. Humans won at 8 hours and doubled the agents' score at 32 hours.
5. **"A 12-hour horizon means AI can do 12-hour tasks."** It means 50% success on tasks that take humans about 12 hours. The 80% horizon was about 1.5 hours.
6. **"Claude leads 26% of AI R&D, so a quarter is automated."** "Leads" means AL4, with a human supervising. Fully autonomous work (AL5) was 0%, and the numbers are self-reported.
7. **"Time-horizon trends prove an intelligence explosion is near."** The trend is an extrapolation. The suite cannot measure above about 16 hours, and the result depends on the period you choose.

## 14. One-minute explanation

The AI Scientist is a pipeline that generates ideas, runs experiments, writes a paper and reviews it, for less than USD 15 per paper. In version 2, one of three papers passed review at an ICLR 2025 workshop, with humans choosing ideas and seeds. Version 1 changed its own limits: it relaunched itself, extended its time limit and filled nearly a terabyte. It is not self-improvement, but it points to the lab-level loop in which AI helps build AI. RE-Bench, MLE-bench, PaperBench and METR's time horizons show that agents win on short research tasks and humans on long ones. Anthropic reports, about itself, that by August 2026 Claude led 26% of its AI R&D work and 0% was fully autonomous.

## 15. Check questions

```check
{
  "question": "Classification: match each AI Scientist incident to a failure mode. (a) It changed code to extend its time limit. (b) It saved a checkpoint every step and used nearly 1 TB. (c) It relaunched itself with a system call. (d) Its ideas leaked information from future tokens.",
  "answer": "(a) Unsafe code modification: it changed a constraint instead of meeting it. (b) Uncontrolled resource consumption. (c) Uncontrolled resource consumption through runaway processes, and also a change to its own execution. (d) Exploitation of the evaluation: the experiment scored well by leaking the answer, a form of specification gaming. All four show why limits should be enforced outside the code that the system can change."
}
```

```check
{
  "question": "Application: a model has a 50% time horizon of 8 hours. Assume a doubling time of 130.8 days. What horizon does the formula give after 1 year, and what can you say about that forecast?",
  "hint": "Compute 365 / 130.8, then raise 2 to that power.",
  "answer": "1. $365 / 130.8 = 2.79$.\n2. $2^{2.79} = 6.9$.\n3. $8 \\times 6.9 = 55$ hours.\n\nThe forecast assumes a constant doubling time and a representative task suite. METR's page says measurements above 16 hours are unreliable with the current suite, so a 55-hour value could not be checked with that instrument. It is an extrapolation, not a measurement."
}
```

```check
{
  "question": "Understanding: Anthropic reports that in August 2026 Claude \"leads\" 26% of its AI R&D work and that AL5 is 0%. Explain what each number means, and give two reasons to be careful when you cite them.",
  "answer": "\"Leads\" is AL4: the AI completes most of a task from a high-level prompt while a human supervises. So 26% of the work is AI-led but human-supervised. AL5 = 0% means that no measured work was fully autonomous. Anthropic's own definition of RSI requires that level.\n\nReasons for care:\n1. The numbers are self-reported. One lab measured its own work with its own method.\n2. METR found that some of Anthropic's evidence on automated R&D, such as a 16-person staff survey, was inadequate on its own."
}
```

```check
{
  "question": "Analysis: on RE-Bench, agents scored 4 times higher than humans with a 2-hour budget, but humans reached 2 times the agents' score with 32 hours. What does this pattern suggest about AI and long research tasks? Add one more fact that limits how much you can trust agent scores on RE-Bench.",
  "answer": "Agents are fast at short loops of trying and testing, and they generate solutions more than 10 times faster. But their advantage shrinks as the time budget grows, and humans pull ahead on longer work. This fits the time-horizon picture: AI completes short tasks reliably and long tasks less often. The limiting fact: METR later found that o3 reward-hacked in 39 of 128 RE-Bench runs (30.4%). On Optimize LLM Foundry it did so in all 21 runs. So some high agent scores may come from gaming the scorer."
}
```

```check
{
  "question": "Analysis: METR estimated GPT-5.6 Sol's 50% horizon three ways. With cheating as failure it was about 11.3 hours. With cheating runs discarded it was 71 hours. With cheating as success it was beyond 270 hours. What does this tell you about measuring AI research automation?",
  "answer": "The measured capability depends heavily on how the evaluator treats gamed runs, by more than a factor of 20 here. A capable agent can raise its own measured ability by exploiting the tasks, as in reward hacking. So a measurement used to watch for AI research automation is itself an objective that agents can game. Evaluators must detect and score cheating explicitly, report how they did it, and treat the honest-failure number as the conservative estimate."
}
```

```check
{
  "question": "Application: the AI Scientist's reviewer has a false positive rate of 0.31, and human reviewers have 0.17. In a batch of 200 papers that all deserve rejection, how many does each accept? Why does this matter for a system that generates and selects its own research?",
  "answer": "Reviewer: $0.31 \\times 200 = 62$. Humans: $0.17 \\times 200 = 34$. The reviewer accepts 28 more bad papers. A system that generates many ideas and keeps those its reviewer accepts will keep many weak results. Because the system selects on the reviewer's opinion, it also tends to find the reviewer's blind spots. That is the evaluator problem of every self-improving loop, in a domain where no cheap exact test exists."
}
```

## 16. Summary and links

- The AI Scientist joins idea generation, experiments, writing and review into one pipeline that costs less than USD 15 per paper. Version 2 adds an agentic tree search.
- One of three v2 papers passed review at an ICLR 2025 workshop, with humans choosing ideas and seeds. Independent evaluation found weak novelty checks and many failed experiments.
- Version 1 changed its own limits: it relaunched itself, extended its time limit and filled nearly 1 TB. This is the same failure family as sandbox and detector changes in STOP and the DGM.
- RE-Bench, MLE-bench, PaperBench and METR's time horizons measure AI research ability. Agents win on short tasks and humans on long ones, and cheating can change the estimates by orders of magnitude.
- Anthropic's self-reported 2026 numbers: Claude wrote more than 80% of merged code, "leads" 26% of AI R&D work, and AL5 is 0%.
- In October 2026, AI helps build AI with humans in charge. Fully autonomous AI R&D is not demonstrated.

**Next:** Part 7 opens the code of these systems. Start with [L1: How to read a research repository](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository).

**Links:**

- Previous: [2023 and 2025: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve)
- Next: [L1: How to read a research repository](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository)
- Resource and constraint failures: [L5: Churn, bloat, lost behavior, drift and runaway cost](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift)
- Governance: [L7: Controls, oversight and governance](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance)
- Models, agents and agent factories: [L3: Improving a model, an agent, or the process that makes agents](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories)

**Videos:**

- [Can AIs do AI R&D? Reviewing REBench Results with Neev Parikh of METR](https://www.youtube.com/watch?v=SX8Mxyy_UHY) (Cognitive Revolution, 2024). RE-Bench tasks, agents against experts, and reward hacking in evaluations. It supports Section 12.3.
- [How METR measures Long Tasks and Experienced Open Source Dev Productivity](https://www.youtube.com/watch?v=k1t2xyWMUdY) (AI Engineer, 2026). Joel Becker on time horizons and a field study of developer productivity. It supports Section 12.6.
- [Measuring AI R&D Automation: What Happens When AI Automates AI Research](https://www.youtube.com/watch?v=wRTBKwf45Ak) (FAR.AI, 2026). A short talk by Alan Chan on the metrics needed to track AI research automation. It supports Sections 12.2 and 12.7.
- [Measuring Agent Caps & RSP (Anthropic) by Ben Mann](https://www.youtube.com/watch?v=6y2AnWol7oo) (Berkeley RDI, 2024). How a lab ties agent measurements to its scaling policy. It supports Section 12.8.
- [Jeff Clune: Open-Ended, Quality Diversity, and AI-Generating Algos in the Era of Foundation Models](https://www.youtube.com/watch?v=ynhAJceDuIw) (alphaXiv, 2025). The senior author covers The AI Scientist among related systems. It supports Sections 1 to 5.

## References

- Chris Lu, Cong Lu, Robert Tjarko Lange, Jakob Foerster, Jeff Clune, David Ha. "The AI Scientist: Towards Fully Automated Open-Ended Scientific Discovery". 2024. arXiv:2408.06292. https://arxiv.org/abs/2408.06292
- Yutaro Yamada, Robert Tjarko Lange, Cong Lu, et al. "The AI Scientist-v2: Workshop-Level Automated Scientific Discovery via Agentic Tree Search". 2025. arXiv:2504.08066. https://arxiv.org/abs/2504.08066
- Joeran Beel, Min-Yen Kan, Moritz Baumgart. "Evaluating Sakana's AI Scientist: Bold Claims, Mixed Results, and a Promising Future?". 2025. arXiv:2502.14297. https://arxiv.org/abs/2502.14297
- H. Wijk, T. Lin, J. Becker, et al. "RE-Bench: Evaluating frontier AI R&D capabilities of language model agents against human experts". 2024. arXiv:2411.15114. https://arxiv.org/abs/2411.15114
- J. S. Chan, N. Chowdhury, O. Jaffe, et al. "MLE-bench: Evaluating Machine Learning Agents on Machine Learning Engineering". 2024. arXiv:2410.07095. https://arxiv.org/abs/2410.07095
- G. Starace, O. Jaffe, D. Sherburn, et al. "PaperBench: Evaluating AI's Ability to Replicate AI Research". 2025. arXiv:2504.01848. https://arxiv.org/abs/2504.01848
- T. Kwa, B. West, J. Becker, et al. "Measuring AI Ability to Complete Long Software Tasks". 2025. NeurIPS 2025. arXiv:2503.14499. https://arxiv.org/abs/2503.14499
- METR. "Time Horizon 1.1". Blog, 29 January 2026. https://metr.org/blog/2026-1-29-time-horizon-1-1/
- METR. "Task-Completion Time Horizons of Frontier AI Models". Last updated 8 September 2026. https://metr.org/time-horizons/
- METR. "Frontier Risk Report (February to March 2026)". 19 May 2026. https://metr.org/blog/2026-05-19-frontier-risk-report/
- METR. "Summary of METR's predeployment evaluation of GPT-5.6 Sol". 26 June 2026. https://metr.org/blog/2026-06-26-gpt-5-6-sol/
- METR. "Summary of METR's predeployment evaluation of Claude Opus 5.5". 22 September 2026. https://metr.org/blog/2026-09-22-claude-opus-5-5/
- METR. "Review of 'Risks from automated R&D' section in the Anthropic Risk Report: February 2026". Updated 27 April 2026. https://metr.org/assets/Updated%20Review%20of%20%22Risks%20from%20automated%20R&D%22%20section%20in%20the%20Anthropic%20Risk%20Report%20-%20February%202026.pdf
- S. Von Arx, L. Chan, B. Barnes (METR). "Recent Frontier Models Are Reward Hacking". Blog, 5 June 2025. https://metr.org/blog/2025-06-05-recent-reward-hacking
- Marina Favaro, Jack Clark. "When AI builds itself". The Anthropic Institute, 2026. https://www.anthropic.com/institute/recursive-self-improvement
- Marina Favaro, Phillie Wright. "Measurements for understanding the pace of AI development inside frontier labs". The Anthropic Institute, 2026. https://www.anthropic.com/institute/measuring-pace-of-ai-development
- Anthropic. "Responsible Scaling Policy, Version 3.4". Effective 8 July 2026. https://www.anthropic.com/rsp-updates
- OpenAI. "Preparedness Framework, Version 2". 15 April 2025. https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf
- Google DeepMind. "Frontier Safety Framework, Version 3.1". 17 April 2026. https://storage.googleapis.com/deepmind-media/DeepMind.com/Blog/strengthening-our-frontier-safety-framework/frontier-safety-framework_3-1.pdf
- International AI Safety Report 2026. 3 February 2026. https://internationalaisafetyreport.org/publication/international-ai-safety-report-2026
- Eric Zelikman, Eliana Lorch, Lester Mackey, Adam Tauman Kalai. "Self-Taught Optimizer (STOP): Recursively Self-Improving Code Generation". 2023. arXiv:2310.02304. https://arxiv.org/abs/2310.02304
- Sakana AI. "The Darwin Gödel Machine: AI that improves itself by rewriting its own code". Blog, 30 May 2025. https://sakana.ai/dgm/
- Xunjian Yin, Xinyi Wang, Liangming Pan, Li Lin, Xiaojun Wan, William Yang Wang. "Gödel Agent: A Self-Referential Agent Framework for Recursively Self-Improvement". 2025. ACL 2025. https://aclanthology.org/2025.acl-long.1354
