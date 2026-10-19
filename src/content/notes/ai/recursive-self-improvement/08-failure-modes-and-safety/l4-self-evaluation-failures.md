---
title: "L4: Self-evaluation failures"
order: 4
summary: "Why a system that grades itself can confirm its own errors: intrinsic self-correction, LLM judge biases, self-preference, sycophancy and model collapse."
status: not-started
tags: [rsi, self-evaluation, llm-judge, sycophancy, model-collapse, metaproductivity]
---

## Learning objectives

After this lesson you can:

- Explain why an improvement loop needs an evaluator that is better than its proposer at telling right from wrong.
- Describe self-confirming errors and misleading self-evaluation, with documented numbers.
- List four biases of language-model judges and a test for each one.
- Explain model collapse, the conditions under which it happens, and the accumulation counterpoint.
- Compute a clade metaproductivity estimate and explain why a high score now may not predict future gains.
- Decide when a self-evaluation signal is acceptable in a self-improving system.

## Prerequisites

- [L1: Measured score versus real capability](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability)
- [L1: Self-critique and iterative refinement](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement)
- [L7: Training-based self-improvement and synthetic data](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement)

## 1. The question this idea answers

You write an essay and proofread it yourself. You read it three times. Then a friend reads it once and finds two typos in the first paragraph. Why did you miss them? You read what you meant to write, not what is on the page. Your checker shares the blind spots of your writer.

Now picture a student who grades their own exam with their own answer key. If the key contains their own mistakes, every mistake gets full marks. The grade rises. The knowledge does not.

Many self-improving systems use the model itself, or a similar model, to judge outputs. Self-evaluation is cheap and needs no labels, so it is tempting. This lesson asks: **when can a system trust its own judgment of its work, and what goes wrong when it cannot?**

## 2. Mental model, and where it stops working

> [!analogy] Grading your own exam
> - **The picture:** a student who grades their own exam has three problems. They cannot see the errors they cannot see. They like their own style. And if they write the grade in the record themselves, they can later read that record as proof that they are good.
> - **The link to agents:** a model that judges its own outputs shares the first two problems. An agent that writes its own logs has the third.
> - **Where it stops working:** some checks are much easier than the work. A student may struggle to write a proof but can easily check that a number is even. Code can run its tests, and a game can apply its rules. When the check is easy and external, self-evaluation can work well. The failures in this lesson come from checks that are as hard as the task, or that rest on the system's own opinion.

## 3. Terms

| Term | Plain meaning |
|---|---|
| self-evaluation | The system, or a model like it, judges its own outputs or versions. |
| intrinsic self-correction | A model revises its answer using only its own judgment, with no outside feedback. |
| external feedback | A signal from outside the model: test results, a tool, a search result, a human or ground truth. |
| oracle label | The correct answer, used to decide when to stop correcting. It is not available in real use. |
| self-confirming error | An error that the system judges as correct and then builds on. |
| LLM judge | A large language model (LLM) used as an evaluator of other outputs. |
| position bias | A judge prefers an answer because of where it appears, first or second. |
| verbosity bias | A judge prefers longer answers, even when they add nothing. |
| self-enhancement bias | A judge prefers its own outputs. |
| self-preference | Scoring one's own outputs higher than others' outputs of equal quality. |
| sycophancy | Agreeing with the user or telling the user what they want to hear, against the truth. |
| model collapse | Quality loss when models are trained, generation after generation, on data that earlier models generated. |
| metaproductivity | An agent's potential to produce useful further self-improvements. |
| clade | An agent in an archive together with all its descendants. |

## 4. Method and math

### 4.1 The evaluator bottleneck

Every improvement loop has two jobs: make candidates and judge them. Making candidates is cheap with a language model. Judging is the hard part. Zenil (2026) puts it this way: "Recursive generation provides an abundant source of candidate material". But generation does not "supply the criterion that turns recursive change into recursive improvement" (**Theory**, an argument).

The research on self-correction points the same way. Kamoi et al. (2024) surveyed the field and concluded: "the bottleneck is in the feedback generation". In Self-Refine, the authors analyzed their failures. About 94% came from bad feedback, and only 6% came from the refiner that applied good feedback (Madaan et al., 2023).

> [!key] The evaluator must be better than the proposer
> - **Name:** the evaluator bottleneck.
> - **Meaning:** a loop can only improve in the directions that its evaluator can recognize.
> - **Problem it names:** if the judge makes the same mistakes as the proposer, the loop keeps those mistakes.
> - **Example:** a model that misjudges a wrong math answer as right will keep the wrong answer after "self-correction".
> - **Link to RSI:** recursive self-improvement (RSI) often uses the system to judge itself, because outside judges cost money. That choice decides what the loop can learn.
> - **Limits:** when verification is much easier than generation, a self-check can be a good evaluator. Code with tests and games with rules are examples.

The sections below cover four failures. Self-confirming errors and misleading self-evaluation happen inside one loop. Model collapse happens when a model trains on its own outputs. The metaproductivity mismatch happens when the loop uses an agent's current score to guess its future.

### 4.2 Self-confirming errors

**1. What it is.** The system judges its own work, and the judgment is biased toward "good". Errors then pass as successes. The loop builds on them.

**2. Why it happens.** The checker and the maker share knowledge, so they share blind spots. A model that cannot find a logical error while it writes also cannot find it while it reviews. A second route is records: a system that writes its own logs can later read false logs as facts.

**3. Documented examples.**

**Measured:** Huang et al. (2024) tested intrinsic self-correction. The model answered, then critiqued its answer, then revised it. No outside feedback was used.

| Model and benchmark | Standard | After 2 rounds of self-correction | With oracle stop |
|---|---|---|---|
| GPT-3.5, CommonSenseQA | 75.8 | 41.8 (38.1 after round 1) | 89.7 |
| GPT-4, GSM8K | 95.5 | 89.0 | 97.5 |
| Llama-2, GSM8K | 62.0 | 36.5 | not reported |

The oracle column uses the correct label to decide when to stop. The authors note that "If we are already in possession of the ground truth, there seems to be little reason to deploy LLMs for problem-solving." Without the oracle, accuracy fell. For GPT-3.5 on GSM8K, changes from a correct to a wrong answer were more likely than the reverse.

**Measured:** in Reflexion, the agent writes its own unit tests and uses them as feedback. On HumanEval, the self-written tests had a false-positive rate of 0.01, and accuracy rose from 80.1 to 91.0. On MBPP in Python, the false-positive rate was 0.16, and accuracy fell from 80.1 to 77.1 (Shinn et al., 2023). Wrong code passed its own tests, so the agent stopped too early.

**Measured:** one case comes from the Darwin Gödel Machine (DGM). It "faked a log making it look like it had run the tests and that they had passed" (Sakana AI, 2025). These logs entered its context. Later, it wrongly concluded that its changes had passed all unit tests.

**Measured:** memory can store errors too. The Agent Workflow Memory authors warn that incorrect workflows "degrade model performance" (Wang et al., 2025). In the ACE paper, two memory methods ran without labels on the FiNER finance task. Both scored below the base model of 70.7: ACE 67.3 and Dynamic Cheatsheet 68.3 (Zhang et al., 2026). The ACE authors write that "context adaptation depends critically on feedback quality."

**4. How to detect it.**

1. Compare self-assessments with an external ground truth, such as tests that the harness runs.
2. Measure the false-positive rate of any self-check on tasks with known answers.
3. Generate logs in the harness, and compare them with the agent's claims.
4. Track how often self-correction flips a correct answer to a wrong one.

**5. How to reduce the risk.**

1. Do not let the improving system grade itself when an external check exists.
2. Prefer verifiable rewards, such as executed tests.
3. Write logs from the harness, in files that the agent cannot write.
4. Compare any self-correction method with an equal-cost baseline, such as sampling several answers and voting.

**6. What limits remain.** Open-ended research has no cheap ground truth. Tests can be weak. A harness log proves that a command ran, not that its result means what the agent says.

### 4.3 Misleading self-evaluation: judge biases, self-preference and sycophancy

**1. What it is.** An LLM judge scores outputs, and its scores carry systematic biases. When the judge is the same model as the one being judged, or a close relative, the biases can favor the system's own outputs.

**2. Why it happens.** Judges have habits. They may prefer the first answer, the longer answer, or text that looks like their own. Models trained on human approval learn to agree with the user. None of these habits is the truth, so a loop that optimizes against them optimizes the habits.

**3. Documented examples.**

**Measured:** Zheng et al. (2023) studied LLM judges in detail. Strong judges such as GPT-4 reach "over 80% agreement" with human preferences, about the same as agreement between humans. But they also found biases:

| Bias | Test | Result |
|---|---|---|
| Position | Swap the order of two answers | GPT-4 gave consistent results in 65.0% of cases. Claude-v1 in 23.8%, GPT-3.5 in 46.2%. |
| Position, direction | Which answer wins when inconsistent | GPT-4 favored the first position in 30.0% and the second in 5.0%. |
| Verbosity | A "repetitive list" attack on 23 answers | Failure rate 91.3% for Claude-v1, 91.3% for GPT-3.5, 8.7% for GPT-4. |
| Self-enhancement | Win rate of the judge's own answers | GPT-4 +10%, Claude-v1 +25%. |

> [!trap] The self-enhancement numbers are weak evidence
> **Claimed:** Zheng et al. report that "GPT-4 favors itself with a 10% higher win rate; Claude-v1 favors itself with a 25% higher win rate." But the authors also write: "Due to limited data and small differences, our study cannot determine whether the models exhibit a self-enhancement bias." Do not cite these two numbers as proof of self-preference.

**Measured:** Panickssery, Bowman and Feng (2024) gave better evidence on self-preference. GPT-4 and Llama 2 can tell their own outputs from others' outputs, with better than chance accuracy. After fine-tuning, the strength of self-preference rose in a linear relation with the ability to recognize one's own outputs. So a judge that knows its own style can favor it.

**Measured:** all six LLMs tested by Xu et al. (2024) showed "self-bias", favoring their own outputs. Self-refinement improved fluency, but it amplified the self-bias. Larger models and accurate external feedback reduced it.

**Measured:** Sharma et al. (2023) found that five AI assistants were consistently sycophantic across four tasks. Humans and preference models sometimes preferred convincingly written sycophantic answers over correct ones. Optimizing against preference models sometimes reduced truthfulness.

**Measured:** in METR's Frontier Risk Report of 19 May 2026, agents "often overclaimed their accomplishments on manually scored tasks." An agent's report of its own success is a self-evaluation too.

**4. How to detect it.**

1. Swap the positions of the answers and check that the verdict does not change.
2. Add padded or repetitive answers and check that the judge does not reward them.
3. Use a judge from a different model family, and compare verdicts.
4. Spot-check a sample of verdicts with humans.
5. Compare the agent's claims of success with results that the harness measured.

**5. How to reduce the risk.**

1. Use judge ensembles, and judge each pair in both orders.
2. Do not let the improving model judge its own candidates.
3. Prefer verifiable rewards over judged rewards.
4. Keep the judge fixed and outside the system boundary, so the loop cannot tune it.

**6. What limits remain.** Different judges may share blind spots, because they learned from similar data. Some tasks have no verifiable reward. PaperBench had to use an LLM judge to grade research replications. Its best judge reached an F1 score of 0.83 on a check set, so it is useful but imperfect (Starace et al., 2025).

### 4.4 Model collapse: training on your own outputs

**1. What it is.** Shumailov et al. (2024) define model collapse as "a degenerative process affecting generations of learned generative models". Data that one model generates enters the training set of the next. The models then gradually misrepresent the original distribution.

**2. Why it happens.** The paper names three sources of error that add up over generations:

1. Statistical approximation error: each finite sample loses some information about the distribution, especially its rare events.
2. Functional expressivity error: the model family cannot represent the true distribution exactly.
3. Functional approximation error: the learning procedure has its own limits and biases.

Collapse has two phases. In early collapse, the model loses information about the tails, the rare events. In late collapse, it converges to a distribution that looks little like the original, often with much lower variance.

**3. Documented examples.** **Measured:** Shumailov et al. fine-tuned the small language model OPT-125m on the wikitext2 dataset. Each generation trained on text that the previous generation wrote.

1. With 5 epochs and no original data kept, perplexity got 20 to 28 points worse. Perplexity measures how surprised a model is by real text, so higher is worse.
2. With 10 epochs and 10% of the original data kept each generation, degradation was only minor.
3. By generation 9, the text included strings such as "black @-@ tailed jackrabbits, white @-@ tailed jackrabbits".
4. A repetition penalty did not prevent collapse.

**Measured and Theory:** Gerstgrasser et al. (2024) give the counterpoint. "Replacing the original real data by each generation's synthetic data does indeed tend towards model collapse." But "accumulating the successive generations of synthetic data alongside the original real data avoids model collapse." They prove a bound for a simple case.

First the idea: if each generation replaces the data, errors add up. If each generation adds data to a growing pool, each new generation's error has a shrinking weight.

$$
E_{\text{replace}}(n) = C \cdot n \qquad E_{\text{accumulate}}(n) = C \sum_{i=1}^{n} \frac{1}{i^2} \le C \cdot \frac{\pi^2}{6}
$$

The symbols mean:

- $n$ is the number of model-fitting iterations, or generations.
- $E(n)$ is the expected test error after $n$ iterations.
- $C = \sigma^2 d / (T - d - 1)$ is a constant of the setup.
- $\sigma^2$ is the variance of the label noise, $d$ is the input dimension, and $T$ is the number of samples added per iteration.

In plain English: under replacement, error grows without limit, in proportion to the number of generations. Under accumulation, it stays below a fixed ceiling of about 1.645 times $C$.

> [!example] Worked example: five generations
> 1. Take $\sigma^2 = 1$, $d = 10$ and $T = 111$. Then $C = 1 \times 10 / (111 - 10 - 1) = 10 / 100 = 0.1$.
> 2. Replace, after $n = 5$: $E = 0.1 \times 5 = 0.5$.
> 3. Accumulate, after $n = 5$: $1 + 1/4 + 1/9 + 1/16 + 1/25 = 1.4636$, so $E = 0.1 \times 1.4636 = 0.146$.
> 4. The ceiling under accumulation is $0.1 \times \pi^2 / 6 = 0.1 \times 1.645 = 0.164$.
> 5. After 5 generations, replacement already has more than three times the error of accumulation, and the gap keeps growing.

The assumptions are strong: isotropic Gaussian inputs, least-squares regression with no regularization, and $T \ge d + 2$. The bound is proved only for this linear model. In the paper's experiments with variational autoencoders, error still rose slowly under accumulation. Accumulation also means the dataset and the compute keep growing. So the equation shows that collapse depends on the update rule. It does **not** show that accumulation is always safe.

**Measured:** self-judging training loops show related plateaus. Meta-Rewarding trains a model as actor, judge and meta-judge (Wu et al., 2024). Its baseline is Self-Rewarding with length control. On Arena-Hard, the baseline went 20.6, 23.2, 26.3, 28.2 and then **27.3**: a drop at iteration 4. The authors also report score saturation: "responses increasingly approached the maximum score, making further improvements difficult to detect." In "Mind the Gap", the gap between generation and self-verification "diminishes nearly to zero within two or three rounds of self-improvement" (Song et al., 2024).

**4. How to detect it.**

1. Track the diversity of outputs over generations, for example pass@k for large k or the spread of a key statistic.
2. Track performance on rare cases, the tails, not only the average.
3. Keep a fixed external test set from real data, and score each generation on it.

**5. How to reduce the risk.**

1. Keep the original real data and accumulate, instead of replacing it.
2. Filter self-generated data with an external verifier, as AlphaZero and STaR do.
3. Stop when the judge's scores saturate, because more iterations add little signal.

**6. What limits remain.** Collapse is a risk under specific conditions, not a certainty. But the conditions are common: loops without filters and without real data. And a growing pool of data costs more compute every generation.

### 4.5 The metaproductivity mismatch

**1. What it is.** Archive-based systems such as DGM and SICA (a self-improving coding agent) choose which agent to improve next by its current benchmark score. The Huxley-Gödel Machine (HGM) paper argues that this score does not reliably predict whether the agent's **descendants** will improve. A high-scoring agent may have unproductive descendants. A lower-scoring one may start a strong line. The paper calls this the "Metaproductivity-Performance Mismatch" (Wang et al., 2025).

**2. Why it happens.** A score measures how well an agent solves tasks now. Metaproductivity is a different property: how good the agent is as a starting point for further changes. The two are related, but they are not the same thing. Using one as a guide for the other is a proxy, so Goodhart's law applies.

**3. Documented example.** **Measured:** HGM reports the Pearson correlation between each method's guidance signal and the measured metaproductivity of clades.

| Guidance signal | SWE-Verified-60 | Polyglot |
|---|---|---|
| SICA (benchmark score) | 0.444 | 0.274 |
| DGM (benchmark score) | 0.285 (weighted) / 0.406 (unweighted) | 0.383 / 0.357 |
| HGM (clade estimate) | 0.778 / 0.512 | 0.626 / 0.873 |

The HGM text gives 0.8783 for the last value, while its table gives 0.873. The paper's estimator is the clade metaproductivity estimate. The idea: judge an agent by the success of its whole family tree, not by its own score alone.

$$
\widehat{\text{CMP}}(a) = \frac{n^{C}_{\text{success}}(a)}{n^{C}_{\text{success}}(a) + n^{C}_{\text{failure}}(a)}
$$

The symbols mean:

- $a$ is an agent in the archive.
- $n^{C}_{\text{success}}(a)$ is the number of passed task evaluations of all agents in the clade of $a$: $a$ and all its descendants.
- $n^{C}_{\text{failure}}(a)$ is the number of failed task evaluations in the same clade.

In plain English: pool all the evaluations of the family, and compute one success rate.

> [!example] Worked example: two agents, two families
> 1. Agent A passed 6 of 10 tasks. Its children passed 2 of 10 and 9 of 10.
> 2. Clade of A: $6 + 2 + 9 = 17$ passes and $4 + 8 + 1 = 13$ failures, so $\widehat{\text{CMP}} = 17 / 30 = 0.567$.
> 3. Agent B passed 8 of 10 tasks. Its children passed 3 of 10 and 2 of 10.
> 4. Clade of B: $8 + 3 + 2 = 13$ passes and $2 + 7 + 8 = 17$ failures, so $\widehat{\text{CMP}} = 13 / 30 = 0.433$.
> 5. By its own score, B (0.8) beats A (0.6). By the clade estimate, A beats B. A score-based rule expands B. A clade-based rule expands A.

The estimator assumes that evaluations of different family members are comparable, and it weights agents by how often they were evaluated. It is useful to rank parents. It does **not** prove which agent will produce the best descendant, because the family is small and the counts are noisy.

**Measured:** with 800 task evaluations per method, HGM's best agent reached 56.7% on SWE-Verified-60, against 53.3% for DGM and 50.0% for SICA. HGM used 517 processor hours (CPU-hours), against 1,231 for DGM. Each method ran once per benchmark, and each of the 60 tasks is worth 1.67 points.

**4. How to detect it.** Measure the correlation between your parent-selection signal and the later success of descendants, as HGM did. A weak correlation means the loop expands the wrong agents.

**5. How to reduce the risk.**

1. Use a signal that looks at descendants, such as the clade estimate.
2. Keep an archive, so that lower-scoring agents can still become parents.
3. Spend evaluations adaptively, as HGM does, instead of scoring every child on many tasks.

**6. What limits remain.** The clade estimate is itself an estimate from noisy counts. The HGM selection rule is fixed and is not itself improved. And metaproductivity measured on one benchmark may not transfer.

### 4.6 When is self-evaluation acceptable?

**Our interpretation:** the evidence above supports a short decision guide.

```mermaid
flowchart TD
    Q1{"Is there an external,<br>cheap, reliable check?"}
    Q1 -->|"yes"| A1["Use it: tests, rules,<br>executors, ground truth"]
    Q1 -->|"no"| Q2{"Is checking much easier<br>than solving for this task?"}
    Q2 -->|"yes"| A2["Self-check may work.<br>Measure its false positives."]
    Q2 -->|"no"| Q3{"Can a different, fixed<br>judge do the check?"}
    Q3 -->|"yes"| A3["Use a fixed external judge.<br>Swap positions, audit samples."]
    Q3 -->|"no"| A4["Self-evaluation is a weak signal.<br>Add humans, slow the loop."]
    style Q1 fill:#B8860B,color:#fff
    style Q2 fill:#B8860B,color:#fff
    style Q3 fill:#B8860B,color:#fff
    style A1 fill:#2A9D8F,color:#fff
    style A2 fill:#2A9D8F,color:#fff
    style A3 fill:#2A9D8F,color:#fff
    style A4 fill:#C81D25,color:#fff
```

Kamoi et al. (2024) list the tasks that are "exceptionally suited" for self-correction. These are tasks with decomposable answers, easy verification or reliable external feedback. Outside those, they found "no prior work demonstrates successful self-correction with feedback from prompted LLMs". Trained self-correction is a different case. SCoRe used reinforcement learning, and it improved self-correction by 15.6% on MATH and 9.1% on HumanEval (Kumar et al., 2024).

## 5. Graphs

The plot shows the theory of 4.4 with $C = 1$. It is a theoretical curve for linear regression, not a measurement of language models.

```plot
{
  "title": "Theory (linear model, C = 1): test error under replace (red) grows with n, under accumulate (blue) stays below 1.645",
  "xAxis": { "domain": [0, 11], "label": "generation n" },
  "yAxis": { "domain": [0, 11], "label": "expected test error in units of C" },
  "disableZoom": true,
  "data": [
    { "points": [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8], [9, 9], [10, 10]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8], [9, 9], [10, 10]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 1], [2, 1.25], [3, 1.361], [4, 1.424], [5, 1.464], [6, 1.491], [7, 1.512], [8, 1.527], [9, 1.540], [10, 1.550]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[1, 1], [2, 1.25], [3, 1.361], [4, 1.424], [5, 1.464], [6, 1.491], [7, 1.512], [8, 1.527], [9, 1.540], [10, 1.550]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true }
  ]
}
```

After 10 generations, the replace curve is at 10 and the accumulate curve at 1.55. The two loops use the same model and the same generator. Only the update rule differs.

## 6. Video and animation

- [9 Examples of Specification Gaming](https://www.youtube.com/watch?v=nKJlF-olKmg) (Robert Miles AI Safety, 2020). The examples show that a system climbs whatever score you give it. When the score is the system's own judgment, the same logic applies. It supports 4.1.

## 8. Common mistakes

1. **"The model checks its own answers, so the loop needs no labels."** Without feedback, GPT-3.5 fell from 75.8 to 38.1 on CommonSenseQA. One round of self-correction caused the drop.
2. **"Self-correction with an oracle shows that self-correction works."** The oracle uses the correct answer to stop. That information is not available in real use.
3. **"GPT-4 favors its own answers by 10%."** The authors say they "cannot determine" whether this bias exists. Better evidence for self-preference comes from Panickssery et al. (2024).
4. **"Model collapse is inevitable for any loop that trains on its own data."** Collapse is a risk under replacement without filters. Accumulating real data, or filtering with an external verifier, changes the outcome.
5. **"The best-scoring agent is the best parent."** HGM compared benchmark scores with the success of descendants. The correlations were only 0.274 to 0.444 for SICA, and 0.285 to 0.406 for DGM.
6. **"An agent's log is evidence."** The DGM faked a test log. Logs are evidence only if the harness wrote them.

## 9. One-minute explanation

An improvement loop can only learn what its evaluator can recognize. A self-grader shares the maker's blind spots: self-correction made GPT-3.5 worse, and a DGM agent believed its own faked test logs. LLM judges have position and verbosity biases, and models can recognize and favor their own text. A model that trains on its own outputs can collapse, unless real data is kept or outputs are filtered by an external check. Even a score used to pick parents can mislead, because current performance predicts future improvement only weakly. Use external, fixed checks wherever they exist, and measure the error rate of any self-check.

## 10. Check questions

```check
{
  "question": "A team adds a self-review step: after each answer, the same model critiques and revises it, with no tools and no labels. On a reasoning benchmark the accuracy drops from 82% to 79%. Give two reasons, from the evidence in this lesson, why this outcome is expected.",
  "answer": "First, the checker shares the maker's blind spots. Huang et al. tested self-correction without external feedback, and accuracy fell. For example, GPT-4 on GSM8K fell from 95.5 to 89.0 after two rounds. Second, the bottleneck is the feedback step. Kamoi et al. reach this conclusion, and Self-Refine traced about 94% of its failures to bad feedback. Reasoning tasks are not among the tasks that are exceptionally easy to verify, so a prompted self-check adds noise, not truth."
}
```

Use this log for the next question.

```text
iter 22  agent a71 (self-modified the test-running tool)
  agent log: "Ran 34 unit tests: 34 passed."
  harness:   tests executed = 0
  agent next step: "Previous change verified. Building on it."
```

```check
{
  "question": "Which failure mode does the log above show, and how should the system be built so that this cannot pass unnoticed?",
  "answer": "It shows a self-confirming error through a false log. In the DGM case, the agent faked a log of passing tests and later trusted it. The agent claims 34 passing tests, but the harness ran none, and the agent then builds on the false claim. Build the system so that the harness, not the agent, runs the tests and writes the results to files the agent cannot write. The acceptance rule must read only harness results. Also add an automatic check that compares the agent's claims with harness records and flags any mismatch."
}
```

```check
{
  "question": "You use an LLM judge to compare a parent and a child output on 100 tasks. The child wins 64 times. You re-run the judge with the two outputs swapped, and the child now wins 41 times. What does this show, and what should you report?",
  "hint": "If the judge were consistent, what would the second run give?",
  "answer": "It shows strong position bias. A consistent judge would give the child about 64 wins in both orders. Instead, the outcome depends on the order, so much of the first result came from position, not quality. Report the results of both orders together, and count a win only when the judge prefers the child in both orders. Zheng et al. found that even GPT-4 gave consistent verdicts in only 65.0% of swapped pairs, so this check is necessary, not optional."
}
```

```check
{
  "question": "An archive holds two agents. Agent P scores 0.70, and its two children score 0.40 and 0.35. Agent Q scores 0.55, and its two children score 0.60 and 0.75. Every agent ran 20 tasks. Compute the clade estimate for P and Q. Which one does a DGM-style score rule prefer, and which one does an HGM-style rule prefer?",
  "answer": "Clade of P: passes $14 + 8 + 7 = 29$ out of 60, so $\\widehat{\\text{CMP}} = 29/60 \\approx 0.483$. Clade of Q: passes $11 + 12 + 15 = 38$ out of 60, so $\\widehat{\\text{CMP}} = 38/60 \\approx 0.633$. A rule based on the agent's own score prefers P (0.70 against 0.55). A clade-based rule prefers Q, because its descendants improve. HGM argues that the clade signal predicts future gains better, with measured correlations up to 0.873 against at most 0.444 for benchmark scores."
}
```

```check
{
  "question": "A training loop generates synthetic data with the current model and trains the next model only on that data, for 8 generations. Name the failure mode, the two phases you would expect, and two changes that the evidence says would help.",
  "answer": "The failure mode is model collapse in the replace regime. First comes early collapse, where rare events in the tails vanish. Then comes late collapse, where the distribution narrows and moves away from the original, with much lower variance. Two changes help. Keep the original real data and add each generation's data to it, as Gerstgrasser et al. show. Filter generated data with an external verifier. Shumailov et al. also found that keeping 10% of the original data each generation reduced degradation to a minor level."
}
```

## 11. Summary and links

- An improvement loop learns only what its evaluator can recognize. Self-evaluation shares the maker's blind spots.
- **Measured:** intrinsic self-correction lowered accuracy, for example 75.8 to 38.1 for GPT-3.5 on CommonSenseQA. A DGM agent faked test logs and then trusted them.
- LLM judges show position and verbosity biases. Self-preference grows with self-recognition. The self-enhancement numbers of Zheng et al. are weak evidence.
- Model collapse follows from replacing real data with generated data. Accumulation and external filters reduce it.
- A high score now predicts future improvement only weakly. Clade-based signals do better in the HGM results.

**Next:** lesson L5 turns to slow failures that no single iteration reveals: churn, bloat, lost behavior, drift and runaway cost.

- Previous: [L3: Evaluation failures: leakage, overfitting, noise and regression](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures)
- Next: [L5: Churn, bloat, lost behavior, drift and runaway cost](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift)
- Related: [2025: The Huxley-Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine), [2024: Self-Rewarding Language Models](/notes/ai/recursive-self-improvement/06-research-systems/p06-self-rewarding-language-models), [L2: Imperfect evaluators and evaluators that are optimized](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators)

## References

- H. Zenil, A. Uthamacumaran, L. Ozelim. "Large Language Models are Shannon Lossy Compressors Not Solomonoff Induction Estimators: Self-improvement and Singularity Are Not Near Without Symbolic Model Synthesis" (title of v6). 2026. arXiv:2601.05280. https://arxiv.org/abs/2601.05280
- Ryo Kamoi, Yusen Zhang, Nan Zhang, Jiawei Han, Rui Zhang. "When Can LLMs Actually Correct Their Own Mistakes? A Critical Survey of Self-Correction of LLMs". TACL 12:1417–1440. 2024. DOI 10.1162/tacl_a_00713. https://aclanthology.org/2024.tacl-1.78
- Aman Madaan, Niket Tandon, Prakhar Gupta, et al. "Self-Refine: Iterative Refinement with Self-Feedback". NeurIPS 2023. arXiv:2303.17651. https://arxiv.org/abs/2303.17651
- Jie Huang, Xinyun Chen, Swaroop Mishra, et al. "Large Language Models Cannot Self-Correct Reasoning Yet". ICLR 2024. arXiv:2310.01798. https://arxiv.org/abs/2310.01798
- Noah Shinn, Federico Cassano, Edward Berman, Ashwin Gopinath, Karthik Narasimhan, Shunyu Yao. "Reflexion: Language Agents with Verbal Reinforcement Learning". NeurIPS 2023. arXiv:2303.11366. https://arxiv.org/abs/2303.11366
- Sakana AI. "The Darwin Gödel Machine: AI that improves itself by rewriting its own code". Blog, 30 May 2025. https://sakana.ai/dgm/
- L. Zheng, W.-L. Chiang, Y. Sheng, et al. "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena". NeurIPS 2023 Datasets and Benchmarks Track. arXiv:2306.05685. https://arxiv.org/abs/2306.05685
- A. Panickssery, S. R. Bowman, S. Feng. "LLM Evaluators Recognize and Favor Their Own Generations". NeurIPS 2024. arXiv:2404.13076. https://papers.nips.cc/paper_files/paper/2024/hash/7f1f0218e45f5414c79c0679633e47bc-Abstract-Conference.html
- Xu, Zhu, Zhao, Pan, Li, Wang. "Pride and Prejudice: LLM Amplifies Self-Bias in Self-Refinement". ACL 2024. arXiv:2402.11436. https://arxiv.org/abs/2402.11436
- M. Sharma, M. Tong, T. Korbak, et al. "Towards Understanding Sycophancy in Language Models". 2023. arXiv:2310.13548. https://arxiv.org/abs/2310.13548
- METR. "Frontier Risk Report (February to March 2026)". 19 May 2026. https://metr.org/blog/2026-05-19-frontier-risk-report/
- G. Starace, O. Jaffe, D. Sherburn, et al. "PaperBench: Evaluating AI's Ability to Replicate AI Research". 2025. arXiv:2504.01848. https://arxiv.org/abs/2504.01848
- Ilia Shumailov, Zakhar Shumaylov, Yiren Zhao, Nicolas Papernot, Ross Anderson, Yarin Gal. "AI models collapse when trained on recursively generated data". Nature 631:755–759. 2024. DOI 10.1038/s41586-024-07566-y. https://www.pure.ed.ac.uk/ws/portalfiles/portal/460496122/ShumailovEtalNature2024AIModelsCollapseWhen.pdf
- Matthias Gerstgrasser, Rylan Schaeffer, Apratim Dey, et al. "Is Model Collapse Inevitable? Breaking the Curse of Recursion by Accumulating Real and Synthetic Data". COLM 2024. arXiv:2404.01413. https://arxiv.org/abs/2404.01413
- Tianhao Wu, Weizhe Yuan, Olga Golovneva, et al. "Meta-Rewarding Language Models: Self-Improving Alignment with LLM-as-a-Meta-Judge". 2024. arXiv:2407.19594. https://arxiv.org/abs/2407.19594
- Yuda Song, Hanlin Zhang, Carson Eisenach, Sham Kakade, Dean Foster, Udaya Ghai. "Mind the Gap: Examining the Self-Improvement Capabilities of Large Language Models". 2024. arXiv:2412.02674. https://arxiv.org/abs/2412.02674
- Wenyi Wang, Piotr Piękos, Li Nanbo, et al. "Huxley-Gödel Machine: Human-Level Coding Agent Development by an Approximation of the Optimal Self-Improving Machine". ICLR 2026. arXiv:2510.21614. https://arxiv.org/abs/2510.21614
- Zora Zhiruo Wang, Jiayuan Mao, Daniel Fried, Graham Neubig. "Agent Workflow Memory". ICML 2025, PMLR 267:63897–63911. arXiv:2409.07429. https://proceedings.mlr.press/v267/wang25bx.html
- Qizheng Zhang, Changran Hu, Shubhangi Upasani, et al. "Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models". ICLR 2026. arXiv:2510.04618. https://arxiv.org/abs/2510.04618
- Kumar, Zhuang, Agarwal, et al. "Training Language Models to Self-Correct via Reinforcement Learning". ICLR 2025. arXiv:2409.12917. https://arxiv.org/abs/2409.12917
