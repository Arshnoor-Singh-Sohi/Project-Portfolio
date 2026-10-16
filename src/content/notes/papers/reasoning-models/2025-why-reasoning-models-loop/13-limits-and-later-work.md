---
title: "13 Limits and later work"
order: 13
summary: "What the paper does well, which claims are measured, proved or only hypothesized, its limits, the older work it builds on, and the later work of 2026 on circular reasoning, early loop detection and loops in quantized models, with what agrees and what does not."
status: not-started
tags: [critique, later-work, reasoning-models, looping, evaluation]
---

## 1. The question this page answers

How far can you trust each claim of the paper? Which claims are measurements, which are proofs, and which are only hypotheses? What did later papers find, and do they agree?

## 2. Mental model

> [!analogy] A wind tunnel
> Engineers test a small model of a wing in a wind tunnel. The tunnel removes rain, turbulence and the rest of the plane, so one force becomes easy to see. The star-graph task is the paper's wind tunnel: it isolates two forces that can cause loops. The open-model study is the test flight: it shows that real models loop, but it cannot show which force causes each loop.
>
> **Where it stops working:** a wind tunnel model follows the same laws of physics as the real wing. Nobody has shown that a reasoning model follows the same mechanism as the small Transformer on the star graph. The link between the two is an analogy plus behavioral probes, not a proof.

## 3. Terms

| Term | Plain meaning |
|---|---|
| threat to validity | A reason why a result could be wrong, or could fail to hold in another setting. |
| external validity | How well a result in one setting carries to other settings, for example from a toy task to real models. |
| causal test | An experiment that changes one cause and measures the effect, with everything else fixed. |
| ablation | An experiment that removes or changes one part of a method to see its effect. |
| LLM-as-a-judge | Using a language model to grade outputs, here GPT-5 to decide if a continuation contains an insight. |
| hypothesis | A proposed explanation that the paper does not test. |
| conjecture | A claim that the authors believe but leave for future work. |
| semantic loop | A loop that repeats the same idea in different words. An exact n-gram rule can miss it. |
| hidden state | The vector that a Transformer layer computes for one token. |
| linear probe | A small linear classifier trained on hidden states to predict a property, for example "a loop starts soon". |
| change-point detection | A method that finds the moment when a stream of numbers changes its behavior. |
| CUSUM | Cumulative sum: a change-point method that adds the excess of each new score over a reference value and raises an alarm above a threshold. |
| attention sink | One of the first tokens that gets strong attention whatever its meaning. |
| LoopBench | A benchmark of 700 samples for loops in reasoning models, from later work (Duan et al. 2026). |
| first-step analysis | A method that computes an expected value of a random walk from one equation per state about its first move. |
| standard error | The typical size of the error of an average computed from random samples. |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. What the paper does well

1. **Two levels of evidence.** A study of real open models finds the pattern. A controlled synthetic task tests a mechanism for it.
2. **A clear proof.** Proposition 1 has a short, complete proof (Appendix C). Page 08 checks it numerically.
3. **Two separate mechanisms.** Risk aversion (§3) and temporally correlated errors (§4) are shown in separate setups. Appendix D shows them together.
4. **A useful diagnostic.** The paper compares the response length at high temperature with a perfect learner. This turns "temperature is a stopgap" into numbers: 105.5 against 24.8, and 44.7 against 27.7.
5. **Robustness checks.** Table 1 varies $n$ and $k$ of the looping rule. Appendix A.2 repeats the study on GPQA Diamond.
6. **Probes of real traces.** The teacher continues from the student's looped prefix, and the paper counts insights in 50 sampled continuations.
7. **Honest labels.** The paper marks many of its explanations as "plausible", "possible" or "we hypothesize". The next section keeps those labels.

## 5. Which kind of statement is each claim?

| Claim | Kind | Where |
|---|---|---|
| All tested open reasoning models loop at temperature 0 | Measured | §2, Figure 2 |
| Larger models loop less inside a family | Measured, in two families with three sizes each | §2, Figure 2 |
| Distilled students loop more than their teacher | Measured, OpenThinker3 against QwQ-32B, on AIME and GPQA | Figure 2, Figure 11 |
| Errors in learning are "a key cause" | An argument from the observations, then shown in the synthetic task | §2, §3, §4 |
| A learner that ignores the context gives $p$ to the easy action and $(1-p)/n$ to each hard action | Proved | Proposition 1, Appendix C |
| A hard first edge plus an easy reset gives low-temperature loops in a Transformer | Measured in the synthetic task | §3.2, Figure 4 |
| The reset is overestimated because it is frequent and easy | Hypothesis: "We hypothesize" | §3.2 |
| Limited capacity explains why smaller models loop more | "a plausible explanation" | §3.3 |
| Instruct models loop less because cyclic actions are rare in their data | "a plausible explanation" | §3.3 |
| RL can cause the same mechanism, as training on a best-of-k version of the model | A framing: "which can possibly cause this mechanism" | §3.3 |
| Transformer errors at a repeated decision point are temporally correlated | Measured in the synthetic task: 96.7% and 76.7% | §4.1 |
| Temperature is a stopgap, not a holistic fix | Measured in the synthetic task, consistent with Figure 1b | §3.3, §4.1, §5 |
| Confidence grows inside a loop | Observed in two traces, then produced on purpose in the synthetic task | Appendix E |
| Pretraining data with repeated sequences causes this confidence growth | "One possible explanation" | §4.1, Appendix E.1 |
| For any model size, some problem is hard enough to cause looping | Conjecture, left "to future work" | §2 |
| Phi-4-reasoning loops more on easy problems because it repeats after it finds the answer | "a preliminary attempt at explaining" | Appendix A |

> [!key] Read the verbs
> "We observe" and the numbers in tables are measurements. "Proposition" with a proof is a theorem about a model of learning. "Plausible", "possible" and "we hypothesize" mark ideas that the paper does not test. Keep these three kinds apart when you repeat the paper's claims.

## 6. Limits

| Limit | Why it matters |
|---|---|
| The synthetic task is far simpler than language | $G(5,5)$ has 22 nodes, and an action is one node. The authors say their aim is "not to capture the full complexity of an actual reasoning model" (§3.1). |
| No causal test inside real reasoning models | The paper does not retrain a real student with a fix and measure less looping. The link to real models rests on behavior and analogy. |
| Few benchmarks | AIME 2024 and 2025 give 60 competition math problems. GPQA Diamond (198 questions) was run for two families only, with 4 responses at temperatures 0, 0.4 and 0.8. No code, no agent tasks. |
| Difficulty comes from the same model | Each model's own accuracy at temperature 0.8 defines its hard and easy problems, 20 of each. |
| The looping rule counts exact repeats only | Semantic loops can pass the 30-gram rule. The paper does not say if the n-gram counts tokens or words. |
| GPT-5 as the judge | The insight counts (for example 1/50 against 34/50) come from one prefix per probe. The paper reports no check of the judge against human labels. |
| Two example traces, one model | Both traces and Figure 15 come from OpenThinker3-1.5B on two AIME 2025 problems. |
| The models differ in more than size | Training data, RL and default top_k and top_p differ by model. Phi-4-reasoning was fine-tuned on OpenAI o4-mini data (Appendix A). |
| Only temperature is varied | No repetition penalty (by design), no sweep of top-p or other sampling rules. |
| RL evidence is thin | One family, one lightly RL-tuned variant (Phi-4-reasoning-plus). |
| No error bars in the synthetic figures | The paper does not report the number of training runs per setting. The curves of Figures 4, 5 and 14 are single lines. |
| The perfect-learner lengths are not fully specified | The paper does not define the unit of "response length" or say if 24.8 and 27.7 are exact or simulated. See the note below. |
| No released code | The PMLR page lists no code repository (checked on 2026-10-14). |

> [!note] Interpretation of these notes: a check of the perfect-learner lengths
> These notes computed the exact expected length of each training walk on $G(5,5)$ with first-step analysis. Count moves (transitions) first. Each try of the uniform walk of §4 costs 5 moves to a leaf. The expected number of tries is 5, and the 4 failed tries add 4 resets. So the walk needs $5 \times 5 + 4 = 29$ moves on average, which is $29 + 1 = 30$ nodes with the start and the goal. The paper reports 27.7, which matches neither count. The exploration walk of §3.2 needs 23.5 moves, which is 24.5 nodes. The paper reports 24.8, which fits the node count within noise. Pages [08](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/08-why-1-risk-aversion) and [09](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/09-why-2-temporally-correlated-errors) use the node counts. For a mean of 500 sampled walks, the standard error of the uniform walk is about $26.8 / \sqrt{500} \approx 1.2$. So 27.7 lies about 1.9 standard errors below 30.

## 7. The older work that the paper builds on

These are the works that the paper cites. The one-line descriptions come from the paper and from the abstracts (checked on 2026-10-14).

| Year | Work | What it adds |
|---|---|---|
| 2019 | Keskar et al., CTRL | An inference-time rule that discourages repetition. The paper says such rules are "in a similar vein" as its margin mitigation. |
| 2020 | Holtzman et al., "The Curious Case of Neural Text Degeneration" (ICLR) | Named "neural text degeneration": low-temperature sampling and beam search give generic, repetitive text. Proposed nucleus (top-p) sampling. |
| 2020 | Welleck et al., unlikelihood training (ICLR) | A training loss that "forces unlikely generations to be assigned lower probability", which reduces repetition. |
| 2021 | Chiang and Chen | The paper cites them for the observation that loops are often preceded by less natural text. |
| 2022 | Su et al., contrastive framework (NeurIPS) | Blames the "anisotropic distribution" of token representations. Proposes SimCTG training and contrastive search decoding. |
| 2022 | Xu et al., "Learning to break the loop" (NeurIPS) | The paper cites it, with Holtzman 2020 and Chiang and Chen 2021, for confidence that grows during repetition. |
| 2023 | Li et al., "Repetition In Repetition Out" (NeurIPS) | Finds "a strong correlation between the degeneration issue and the presence of repetitions in training data". |
| 2023 | Su and Collier (TMLR) | The anisotropy of GPT-2 largely disappears in later families such as OPT. |
| 2024 | Bachmann and Nagarajan, "The pitfalls of next-token prediction" (ICML) | Teacher-forced training can fail to learn an accurate predictor on a minimal planning task, the star graph. |
| 2025 | Hu et al., "The Belief State Transformer" (ICLR) | An architecture that solves problems that "conventional forward-only transformers struggle with". The paper cites it twice. First, for the result that the star-graph first edge is as hard as learning parity. Second, as an architecture that can help. |
| 2025 | Ahn et al., joint prediction of multiple future tokens | Cited by the paper as another architecture that can help with star-graph hardness. |

## 8. Later work

Each row gives the arXiv id, the first submission date, and whether the later paper cites this paper. All rows were checked at the arXiv pages on 2026-10-14.

| Date | Work | What it adds | Cites this paper? |
|---|---|---|---|
| 2025-11-01 | Xie et al., "Word Salad Chopper" (arXiv 2511.00536, EMNLP 2025) | Reasoning models waste many tokens on useless self-repetition. A single-layer linear classifier on the hidden states of the "\n\n" tokens detects it during generation. Then a cut and a short regeneration prompt save length. | No. It appeared six weeks earlier. This paper does not cite it either. |
| 2026-01-09 | Duan et al., "Circular Reasoning" (arXiv 2601.05693) | LoopBench, loop onset at a reasoning impasse, a self-reinforcing attention pattern, and early detection with CUSUM. Section 8.1 gives the details. | No |
| 2026-02-27 | Silvestri and Cetin, "Learning from Partial Chain-of-Thought via Truncated-Reasoning Self-Distillation" (arXiv 2603.13274) | A student learns to give the teacher's answer distribution from a truncated reasoning prefix. The trained models write shorter traces. | Yes, for reasoning that consumes compute "without meaningful progress". |
| 2026-05-29 | Lotfi et al., "Quantized Reasoning Models Think They Need to Think Longer, but They Do Not" (arXiv 2606.00206) | Aggressive quantization lowers accuracy and makes chains longer. Quantized models over-sample "wait", "but" and "alternatively". A logit penalty on such markers cuts chain length by 12 to 23%. | Yes, in related work: looping "particularly in smaller and distilled models". |
| 2026-06-01 | Alimaskina et al., "Extreme Low-Bit Inference in Reasoning Models" (arXiv 2606.02011) | 2-bit Qwen3 models produce repetitive loops and reach the budget. "Loop rescue" flags a 20-gram that appears at least 4 times in the last 1,024 tokens. On MATH-500 it raises Qwen3-8B from 17.2% to 74.2%. | No |
| 2026-07-23 | Oladri et al., "Token Budget Saturation and Mechanistic Early Detection of Reasoning Non-Convergence" (arXiv 2607.21433) | R1-Distill-Qwen-7B with greedy decoding converges in 62.0% of runs. Converged runs reach 90.3% accuracy, the others 6.6%. Linear probes predict non-convergence early, but weakly: AUC 0.608, permutation test p = 0.063. | Yes, three times. |

### 8.1 Duan et al. 2026 in more detail

Duan et al. call the failure "Circular Reasoning": "a self-reinforcing trap where generated content acts as a logical premise for its own recurrence". Their findings (checked on 2026-10-14):

1. **LoopBench.** 700 samples, 100 for each of seven sub-tasks. Three sub-tasks are high-precision arithmetic (square root, long division, Newton's iteration). Four are recursive reasoning (Tower of Hanoi, truth-teller puzzles, path planning, logical paradoxes). They count two loop types: numerical loops and statement loops.
2. **Meaning repeats before text repeats.** "semantic circularity precedes explicit textual repetition".
3. **Onset.** A reasoning impasse usually comes before the loop. For statement loops, high-entropy tokens such as "But" and "Wait" mark the onset.
4. **Self-reinforcement.** Attention concentrates on the first tokens (attention sinks) and on the most recent tokens. They call this a V-shaped pattern. When repetition starts, attention to the repeated tokens grows.
5. **Early detection.** A linear probe on last-layer hidden states gives a score per sentence. CUSUM accumulates the score and raises an alarm. "On average, we detect the warning signal over 40 sentences (or 1500 tokens) before repetition starts."
6. **Temperature.** Higher randomness "reduces repetition frequency" but "offers no complete cure". Numerical loops "persist even at T = 1.0".
7. **Scale and distillation.** "Crucially, we observe no significant correlation between repetition susceptibility and model scale or distillation status".

### 8.2 Where later work agrees and where it does not

| Topic | This paper | Later work | Interpretation of these notes |
|---|---|---|---|
| Temperature | A stopgap: fewer loops, still long chains | Duan: "no complete cure" | Agreement. |
| Where loops start | At a hard decision, the model prefers an easy cyclic action | Duan: at a "reasoning impasse", with "But" and "Wait" | A reasoning impasse looks like a point where the progress-making action is hard. Compatible, not proven equal. |
| Why loops last | Confidence grows inside a loop (Appendix E) | Duan: attention to repeated tokens grows | Two views of the same self-reinforcement: one in output probabilities, one in attention. |
| Exact text or meaning | Example 1 loops "semantically" before exact repetition | Duan: meaning repeats first | Agreement. Both favor semantic detectors for early warning. |
| Size and distillation | Inside families, larger models and teachers loop less | Duan: "no significant correlation" | A real tension. Duan uses other tasks, sampling at temperatures 0.1 to 1.0 with a repetition penalty of 1.1, and other loop rules. The paper uses AIME and greedy decoding. One statement over many families can also hide a trend inside one family. Neither design settles the other. |
| Detection | Measures loops after the fact | Duan, Xie, Oladri: hidden states predict loops early | Later work adds online tools. Oladri's weak AUC shows that early prediction is not solved. |

> [!trap] Citing is not confirming
> Oladri et al. write that this paper shows looping "is distillation-specific". The paper does not say that: its teachers loop too (QwQ-32B at 0.04), and its mechanisms apply to RL as well (§3.3). Read the source, not the citation.

## 9. What is true in 2026

These statements come from the later work above, not from this paper.

1. Loops are still a live failure mode of reasoning models in 2026. This includes quantized models (Lotfi et al., Alimaskina et al.) and models on new benchmarks (Duan et al.).
2. Sampling at a higher temperature reduces loops but does not remove them (this paper, and Duan et al.).
3. A model's hidden states carry an early signal of a coming loop (Xie et al., Duan et al.). How strong the signal is depends on the setup (Oladri et al.: AUC 0.608).
4. Whether larger and non-distilled models loop less is contested (this paper against Duan et al.).

## 10. Open questions

1. Does a training-time fix, such as hints at high-loss positions, reduce looping in a real distilled student?
2. Can one benchmark separate risk aversion from temporally correlated errors in real traces?
3. How much of real looping comes from error accumulation in the prefix, as the second loop of Appendix B suggests?
4. Is randomness a necessary resource for good reasoning models, or can a deterministic decoder reason as well (§1)?
5. Do agents loop at the level of actions, for example repeated identical tool calls, through the same mechanisms?

## 11. Common mistakes

1. **"The star graph shows how DeepSeek-R1 loops."** It shows two mechanisms that can cause loops in a small Transformer. The link to real models is by analogy and behavior.
2. **"The paper proves that capacity causes looping."** It proves Proposition 1 for a learner that ignores the context. Capacity as the cause of the size trend is "a plausible explanation".
3. **"Papers about looped language models study this kind of loop."** Blayney et al. (2026, arXiv 2604.11791) study "looping an LLM's layers in the latent dimension", which is recurrent depth. That is a design choice, not repeated text.
4. **"Later work confirms everything."** Later work agrees on temperature and on self-reinforcement. It disagrees on scale and distillation.

## 12. One-minute explanation

The paper combines a study of open models with a controlled synthetic task, a proved proposition, and a length diagnostic for temperature. Its toy task is far simpler than language, and there is no causal test inside real models. Most results use 60 AIME problems and an exact-text looping rule. The GPT-5 judgments use one prefix per probe, and the paper gives no error bars or code. Several explanations are labeled as plausible or hypothetical, and these notes keep those labels. Later work in 2026 agrees that temperature is no complete cure and that loops reinforce themselves. Duan et al. add LoopBench, show that meaning repeats before text, and detect loops early with CUSUM on hidden states. Work on quantized models shows that a cheaper approximation of a model can loop more. One tension remains: Duan et al. find no link between looping and scale or distillation. So use the paper's mechanisms as hypotheses to test on your own models.

## 13. Check questions

```check
{
  "question": "Classify each claim as measured, proved, or hypothesis: (a) OpenThinker3-1.5B loops in 30% of greedy responses. (b) The overestimation of the reset comes from its prevalence and ease of learning. (c) A learner that ignores the context gives (1 - p)/n to each hard action.",
  "answer": "(a) Measured (Figure 2, exact bar label 0.30). (b) Hypothesis: the paper writes \"We hypothesize\". (c) Proved: Proposition 1 with the proof in Appendix C."
}
```

```check
{
  "question": "Name three limits of the paper and say what experiment would address each one.",
  "answer": "Any three, for example: (1) No causal test in real models: retrain a real student with hints at high-loss positions and compare looping. (2) Exact-text looping rule: add a semantic loop measure. (3) GPT-5 judge on one prefix: use several prefixes and check the judge against human labels. (4) Mostly AIME: add code and agent tasks. (5) No error bars: repeat the synthetic training with several seeds."
}
```

```check
{
  "question": "Duan et al. (2026) find no significant correlation between looping and model scale or distillation. This paper finds that larger models and teachers loop less. Give two reasons why both can be true.",
  "answer": "Any two, for example: (1) The tasks differ: AIME competition math against LoopBench arithmetic and recursive tasks, which count numerical loops in long periodic outputs as one of two loop types. (2) The decoding differs: greedy decoding without a repetition penalty against sampling at temperatures 0.1 to 1.0 with a repetition penalty of 1.1. (3) The loop rules differ: a 30-gram, 20-copy rule against numerical and statement loop rules. (4) One statement over many model families can hide a trend inside one family, which is what this paper measures."
}
```

```check
{
  "question": "What does Duan et al.'s CUSUM detector add over the paper's 30-gram rule, and what is its cost?",
  "answer": "It warns before exact repetition starts, on average over 40 sentences (about 1,500 tokens) early, so a service can stop or steer sooner. The cost: it needs the model's hidden states and a trained probe, so it works only for self-hosted models, and it has false alarms."
}
```

## 14. Sources

All links were checked on 2026-10-14.

- [The paper, arXiv 2512.12895v1](https://arxiv.org/abs/2512.12895v1)
- [The paper in PMLR volume 306 (ICML 2026)](https://proceedings.mlr.press/v306/pipis26a.html)
- [OpenReview page](https://openreview.net/forum?id=oZWE7mSqlk)
- [Duan et al., Circular Reasoning, arXiv 2601.05693](https://arxiv.org/abs/2601.05693)
- [Xie et al., Word Salad Chopper, arXiv 2511.00536](https://arxiv.org/abs/2511.00536v1)
- [Silvestri and Cetin, Truncated-Reasoning Self-Distillation, arXiv 2603.13274](https://arxiv.org/abs/2603.13274)
- [Lotfi et al., Quantized Reasoning Models, arXiv 2606.00206](https://arxiv.org/abs/2606.00206)
- [Alimaskina et al., Extreme Low-Bit Inference, arXiv 2606.02011](https://arxiv.org/abs/2606.02011)
- [Oladri et al., Token Budget Saturation, arXiv 2607.21433](https://arxiv.org/abs/2607.21433)
- [Blayney et al., Looped Reasoning Language Models, arXiv 2604.11791](https://arxiv.org/abs/2604.11791)
- [Holtzman et al., arXiv 1904.09751](https://arxiv.org/abs/1904.09751)
- [Welleck et al., arXiv 1908.04319](https://arxiv.org/abs/1908.04319)
- [Su et al., arXiv 2202.06417](https://arxiv.org/abs/2202.06417)
- [Li et al., arXiv 2310.10226](https://arxiv.org/abs/2310.10226)
- [Bachmann and Nagarajan, arXiv 2403.06963](https://arxiv.org/abs/2403.06963)
- [Hu et al., The Belief State Transformer (ICLR 2025)](https://proceedings.iclr.cc/paper_files/paper/2025/hash/01b3dea1871f7cea1e0e6be1f2f085bc-Abstract-Conference.html)

## 15. Links

- Previous: [12 Engineering takeaways](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/12-engineering-takeaways)
- Next: [14 Reproduce it](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/14-reproduce-it)
- The paper card: [Why do reasoning models loop?](/notes/papers/reasoning-models/2025-why-reasoning-models-loop)
- The question: [05 The question](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/05-the-question)
- The experiment design: [06 Experiment design](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/06-experiment-design)
- How to read a paper: [Reading method](/notes/papers/reading-method)
- The same critique for another paper: [Lost in the Middle: limits and later work](/notes/papers/long-context/2023-lost-in-the-middle/10-limits-and-later-work)
