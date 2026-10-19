---
title: "L6: Evolutionary search, populations and open-endedness"
order: 6
summary: "Genetic algorithms with a language model as the mutation operator: FunSearch, AlphaEvolve and OpenEvolve, plus quality-diversity and open-endedness."
status: not-started
tags: [rsi, evolutionary-search, funsearch, alphaevolve, openevolve, quality-diversity, open-endedness]
---

## Learning objectives

After this lesson you can:

- Run one generation of a genetic algorithm by hand: selection, crossover, mutation and replacement.
- Explain why a large language model (LLM) as the mutation operator changes what evolutionary search can do.
- Describe how FunSearch, AlphaEvolve and OpenEvolve work, and state for each what changes, what stays fixed and what persists.
- Quote AlphaEvolve's self-improvement claim exactly, and explain why it is an indirect, slow and human-mediated loop.
- Compute a novelty score and a MAP-Elites insertion step.
- Explain Population Based Training, POET and OMNI, and the definition of open-endedness by Hughes et al.
- Place each method on the ladder of self-improvement.

## Prerequisites

- [L4: Optimization and search](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search)
- [L2: The ladder: from repeating a task to improving the improver](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement)
- [L3: Archives: why keep more than the best version](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions)
- [L3: Evaluation under noise](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise)

## 1. The question this idea answers

A plant breeder wants a tomato that tastes better. She cannot design the perfect plant on paper. So she grows 50 plants, tastes the fruit, and keeps seeds from the best ten. She crosses some of them and plants the seeds. Small random changes appear in the new plants. After many seasons the tomatoes taste much better, and nobody wrote a design.

The breeder does not need a slope or a formula. She needs three things: a way to make variants, a way to score them, and a rule that keeps the good ones. This is **evolutionary search**.

Now replace the tomato with a program, and the taster with an automatic test. Replace the random changes with changes that a language model writes. This is the idea behind FunSearch, AlphaEvolve and OpenEvolve. These systems found new results in mathematics and saved compute in Google's data centers.

This lesson asks four questions:

1. How does a basic genetic algorithm work, step by step?
2. What changes when a language model makes the mutations?
3. Why do some methods keep many different solutions instead of only the best one?
4. Is any of this recursive self-improvement (RSI), or only search for better solutions?

## 2. Mental model, and where it stops working

> [!analogy] A breeder with a seed bank
> The breeder keeps a seed bank (the **population**). Each season she plants some seeds, scores the fruit (the **fitness**), and keeps seeds from the best plants (**selection**). She crosses two plants (**crossover**) and accepts small random changes (**mutation**). She also keeps some odd plants on a separate shelf, because one of them may lead to a great tomato later (a **stepping stone**).
>
> **Where it stops working:**
>
> 1. A language model does not make random changes. It reads the parent program and writes a change that it expects to help. So the "mutation" carries knowledge, and also the model's blind spots.
> 2. An automatic evaluator measures only what its tests check. Evolution will exploit every gap in those tests.
> 3. The breeder never changes how she breeds. In these systems the breeding procedure is also fixed, so the system improves solutions, not itself.

## 3. Terms

| Term | Plain meaning |
|---|---|
| evolutionary search | A search method that keeps a population of candidates, changes them, scores them, and keeps the better ones. |
| genetic algorithm (GA) | An evolutionary search method with selection, crossover and mutation over a population of encoded candidates. |
| population | The set of candidates that an evolutionary method keeps at one time. |
| fitness | The score that an evaluator gives to one candidate in an evolutionary method. |
| generation | One pass of an evolutionary method: select parents, make new candidates, score them, replace the population. |
| selection | The rule that picks which candidates become parents. |
| tournament selection | Pick a few candidates at random and keep the one with the highest fitness. |
| crossover | Make a new candidate from parts of two parents. |
| mutation | A small change to one candidate. |
| mutation operator | The procedure that makes mutations. In LLM-era systems it is a language model. |
| elitism | Copy the best candidate unchanged into the next generation. |
| island | A sub-population that evolves mostly on its own. |
| migration | Copying good candidates from one island to another. |
| evaluation cascade | Staged evaluation: cheap tests first, expensive tests only for candidates that pass. |
| quality-diversity (QD) | Search that keeps the best candidate for each kind of behavior, not only the single best candidate. |
| behavior descriptor | A function that maps a candidate to a few numbers that describe how it behaves. |
| MAP-Elites | A quality-diversity method that keeps one elite per cell of a grid of behavior descriptors. |
| novelty search | Search that rewards candidates for behaving differently from earlier ones, and ignores the objective. |
| deceptive objective | An objective whose slope points away from the best solution. |
| stepping stone | A candidate that is not good itself but leads to good candidates later. |
| open-endedness | A system keeps producing artifacts that are both novel and learnable for an observer. |
| bloat | Growth in program size without a gain in fitness. |
| Population Based Training (PBT) | A method that trains a population of models and copies and changes their hyperparameters during training. |
| Evolution Strategies (ES) | An evolutionary method that changes a model's weights by testing random small changes and moving toward the better ones. |

> [!key] Key term: the LLM as mutation operator
> - **Name:** language model as mutation operator.
> - **Meaning:** the proposer that makes new candidates is a language model that reads a parent program and writes a changed program.
> - **Problem it solves:** random changes to a program almost always break it. A language model writes changes that usually run and often make sense.
> - **Example:** FunSearch shows the model two scored programs, labelled v0 and v1, and asks it to write v2 (Romera-Paredes et al., 2023).
> - **Connection to RSI:** the same loop (propose code, evaluate, keep) is the core of self-modifying agents such as the Darwin Gödel Machine (DGM). The difference is what the code is: a task solution, or the agent itself.
> - **Limits:** the language model is frozen in FunSearch and AlphaEvolve. Its knowledge limits which changes it can propose. The evaluator limits which changes count as good.

## 4. Method and math

### 4.1 A tiny genetic algorithm, computed

We start with a problem so small that you can check every step. A candidate is a string of 6 bits, for example `101000`. Think of six yes-or-no choices in a recipe. The fitness is the number of 1 bits. The best possible fitness is 6.

The algorithm has these settings:

1. Population size 4.
2. Elitism: the best candidate of the old population goes to the new one unchanged.
3. Three new candidates per generation. Each comes from two parents.
4. Tournament selection of size 2: pick two members at random, keep the fitter one. A tie goes to the first one picked.
5. One-point crossover: cut both parents at the same random position. Take the left part from parent 1 and the right part from parent 2.
6. Mutation: flip each bit with probability 1/6.

The start population is A = `101000` (fitness 2), B = `010011` (3), C = `110100` (3) and D = `000110` (2). The mean fitness is 2.5 and the best is 3. The table shows generation 0 to 1. We took the random draws from one run of the program in section 7 (seed 6).

| New candidate | Tournament 1 | Tournament 2 | Crossover | Mutation | Result | Fitness |
|---|---|---|---|---|---|---|
| 1 | A(2) vs B(3), B wins | C(3) vs A(2), C wins | cut 1: `0` + `10100` = `010100` | flip bits 0 and 5 | `110101` | 4 |
| 2 | D(2) vs A(2), tie, D wins | D(2) vs C(3), C wins | cut 5: `00011` + `0` = `000110` | no flip | `000110` | 2 |
| 3 | A(2) vs B(3), B wins | C(3) vs A(2), C wins | cut 3: `010` + `100` = `010100` | flip bit 3 | `010000` | 1 |

The elite is B. So the new population is B (3), `110101` (4), `000110` (2) and `010000` (1). The best fitness rose from 3 to 4. The mean stayed at 2.5, because one child got worse.

This is normal. Mutation is blind, so many changes hurt. Selection must remove them in later generations.

**Measured (our simulation):** we ran this algorithm 200 times for 12 generations, with different random seeds. The mean best fitness rose from 3.00 to 5.79. We also ran random search with the same budget: 3 random 6-bit strings per generation. Random search was ahead at first (4.05 against 3.77 after one generation). The GA passed it after five generations and ended at 5.79 against 5.39. Section 5 plots both curves.

Two lessons come from this toy:

1. **Compare against random search with the same budget.** On a small space, random search is a strong baseline. [L4: Optimization and search](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) gives the evidence (Bergstra and Bengio, 2012).
2. **Selection does the work, not mutation.** Mutation proposes. Selection decides. If the fitness is noisy, selection keeps lucky candidates. For this reason, regularized evolution (AmoebaNet) removes the oldest member, not the worst. Its authors write: "AE can only improve a population through the inheritance of architectures that re-train well" (Real et al., 2019, [arXiv:1802.01548](https://arxiv.org/abs/1802.01548)). **Claimed:** they support this with a toy experiment.

### 4.2 Why a language model as the mutation operator matters

In the toy, a mutation is a bit flip. For a program, the equivalent is a random change of a character or a token. Almost every such change breaks the program. So classic genetic programming needed special encodings, such as syntax trees, to keep programs valid.

A language model changes this. It reads the parent program, the scores, and sometimes error messages. Then it writes a whole new function or a diff. Most of its changes compile, and many follow a plan. FunSearch describes its method as "pairing a pretrained LLM with a systematic evaluator" (Romera-Paredes et al., 2023, abstract).

The evaluator still decides. The language model does not need to be right. It only needs to propose some good candidates among many bad ones. The evaluator then removes the bad ones. **Our interpretation:** this is why these systems can use a model that makes mistakes. The cost is many evaluations.

The table compares the two generations of this idea, from the AlphaEvolve paper (Novikov et al., 2025, [arXiv:2506.13131](https://arxiv.org/abs/2506.13131), Table 1).

| Property | FunSearch | AlphaEvolve |
|---|---|---|
| What evolves | one function | an entire code file |
| Code size | 10–20 lines | hundreds of lines |
| Language | Python | any language |
| Evaluation time | up to 20 min on 1 CPU | hours, in parallel, on accelerators |
| LLM samples | millions | thousands suffice |
| LLM | small, no benefit from larger | benefits from the best LLMs |
| Context in the prompt | minimal | rich context and feedback |
| Metrics | single | multiple |

### 4.3 FunSearch: evolving one function

FunSearch was published in *Nature* (Romera-Paredes et al., 2023, [Nature 625](https://www.nature.com/articles/s41586-023-06924-6)). It searches for programs that solve mathematical problems. It does not search for the answers directly.

**The parts.** The user gives two things. The first is an `evaluate` function. The second is a skeleton program, for example a greedy algorithm, with one critical function left open. For bin packing, the open function is `heuristic`. For cap sets, it is `priority`. The cap set search starts from a trivial function that returns a constant.

**The loop.** The steps are:

1. Choose an island. Sample two programs from it.
2. Sort them by score and label them v0 and v1. Ask the frozen LLM to write v2. The paper calls this **best-shot prompting**.
3. Run v2 with the evaluator. Discard it if it times out, uses too much memory or gives invalid output.
4. Store the valid program and its score in the program database.
5. Every 4 hours, wipe the half of the islands whose best programs score lowest. Reseed each one with the best program of a random surviving island.

The LLM is Codey, "an LLM built on top of the PaLM2 model family", with no fine-tuning. A typical run used 15 samplers and 150 CPU evaluators. The total number of samples was "on the order of 10^6".

**How a parent cluster is chosen.** Inside an island, programs with the same scores on every input form a cluster. FunSearch picks a cluster with a softmax over cluster scores. The equation comes from the official code, `programs_database.py`, because the paper refers to its supplementary information for the exact form.

The idea in words: a cluster with a higher score is more likely to be picked, but a lower one still has a chance. A temperature controls how strong the preference is.

$$
P(i) = \frac{\exp(s_i / T)}{\sum_j \exp(s_j / T)}, \qquad T = T_0\left(1 - \frac{n \bmod N}{N}\right)
$$

The symbols mean:

- $P(i)$ is the probability that cluster $i$ is chosen.
- $s_i$ is the score of cluster $i$.
- $T$ is the temperature. A small $T$ makes the choice greedy. A large $T$ makes it closer to uniform.
- $T_0 = 0.1$ is the start temperature.
- $n$ is the number of programs registered on the island so far.
- $N = 30{,}000$ is the length of one temperature cycle.
- $n \bmod N$ is the remainder of $n$ divided by $N$.

In plain English: the temperature falls from 0.1 to almost 0 over each block of 30,000 programs. Then it jumps back to 0.1. So the island alternates between exploration and exploitation.

**Worked example.** Three clusters have scores 0.50, 0.55 and 0.60.

1. At $n = 0$: $T = 0.1 \times (1 - 0) = 0.1$.
2. The exponentials are $e^{5.0} = 148.4$, $e^{5.5} = 244.7$ and $e^{6.0} = 403.4$. Their sum is 796.5.
3. The probabilities are $148.4 / 796.5 = 0.186$, $0.307$ and $0.506$.
4. At $n = 15{,}000$: $T = 0.1 \times (1 - 0.5) = 0.05$. The same steps give 0.090, 0.245 and 0.665.
5. At $n = 27{,}000$: $T = 0.01$. The best cluster gets probability 0.993.

The assumptions: scores are on a comparable scale, and the cycle length suits the run length. The equation is useful to see how FunSearch balances old and new parents. It does not prove that this schedule is better than another one. The paper did not test that claim in the parts read for this course.

Inside a cluster, FunSearch prefers shorter programs: $P(\text{program}) \propto \exp(-\tilde{\ell} / T_{\text{program}})$, where $\tilde{\ell}$ is the normalized program length and $T_{\text{program}} = 1$. **Our interpretation:** this is a pressure against bloat (section 4.12).

**Results (Measured).** All results are from the *Nature* paper.

- **Cap sets.** In dimension $n = 8$, FunSearch "found a larger cap set than what was previously known": size 512. Only 4 of 140 experiments found it. The evolved program showed a "reflections" symmetry. The previous record size is not confirmed in this course's sources.
- **Admissible sets.** A lower bound on the cap set capacity rose from 2.2180 to 2.2184. A partial construction gave $C \geq 2.2202$.
- **Online bin packing.** The score is the fraction of excess bins over a lower bound. Lower is better.

| Dataset | First fit | Best fit | FunSearch |
|---|---|---|---|
| OR1 | 6.42% | 5.81% | 5.30% |
| OR4 | 5.23% | 4.94% | 2.47% |
| Weibull 5k | 4.23% | 3.98% | 0.68% |
| Weibull 100k | 4.00% | 3.79% | 0.03% |

Part 9 of this course builds a bin-packing agent with a simpler lower bound, so its numbers are not comparable to this table.

**What stays fixed.** The LLM, the evaluator and the skeleton never change. Only one function evolves. The authors name three conditions for good results:

1. a fast evaluator,
2. a rich score, not only pass or fail,
3. a skeleton with an isolated part to evolve.

**What persists.** The program database. The system itself is the same at the end of the run.

**Ladder.** **Our interpretation:** FunSearch improves an external artifact, a program for a math problem. It does not improve itself. So it is not on the self-improvement ladder of [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement). It is in this course because it is the ancestor of the "propose code, evaluate, keep" loop.

### 4.4 AlphaEvolve: whole files, and an indirect loop

AlphaEvolve was announced on 14 May 2025 and described in a paper a month later (Novikov et al., 2025, [arXiv:2506.13131](https://arxiv.org/abs/2506.13131)). There is no official open-source code.

**The parts** (Section 2):

1. **Task specification.** The user marks the code to evolve with `# EVOLVE-BLOCK-START` and `# EVOLVE-BLOCK-END`. The user also writes an `evaluate` function that returns scores to maximize.
2. **Prompt sampler.** It builds prompts from programs in the database, their scores and context. It uses **meta-prompts that are co-evolved** in a separate database.
3. **LLM ensemble.** Gemini 2.0 Flash proposes many candidates fast. Gemini 2.0 Pro proposes fewer, better ones.
4. **Output format.** The model writes SEARCH/REPLACE diff blocks, or a full rewrite for short code.
5. **Evaluators.** An evaluation cascade runs easy tests first. An optional LLM can add feedback on properties that are hard to test, such as simplicity.
6. **Program database.** It combines MAP-Elites (section 4.8) with islands.

The loop, paraphrased from Sections 2.1–2.6:

```text
DB <- initial program
loop (many workers in parallel):
    parent, inspirations <- sample(DB)
    prompt <- build(parent, inspirations, results, meta-prompt)
    diff <- LLM_ensemble(prompt)
    child <- apply(diff, parent)
    scores <- evaluation_cascade(child)
    DB.add(child, scores)
```

**Results (Measured, as reported by Google).**

- **Data-center scheduling.** A new heuristic "continuously recovers on average 0.7% of Google's fleet-wide compute resources, which would otherwise be stranded" (Section 3.3.1).
- **Gemini kernels.** "an average 23% kernel speedup across all kernels" and a "corresponding 1% reduction in Gemini's overall training time" (Section 3.3.2). The blog describes the 23% differently, as the speedup of one "vital kernel".
- **FlashAttention.** The kernel became 32% faster (paper). The blog says "up to 32.5%".
- **Matrix multiplication.** 4×4 complex-valued matrices with 48 scalar multiplications, "the first improvement, after 56 years, over Strassen's algorithm in this setting" (abstract).
- **Mathematics.** Over 50 open problems: it matched the best known constructions in about 75% and beat them in about 20%. In 11 dimensions, it found a kissing configuration of 593 spheres (previous 592).
- **Ablations.** Removing evolution, the prompt context, meta-prompt evolution, full-file evolution, or the large model each hurt. The paper shows curves only, with no exact numbers.

**The self-improvement statements, exact wording:**

- Abstract: AlphaEvolve "accelerated the training of the LLM underpinning AlphaEvolve itself."
- Section 3.3.2: "This deployment also marks a novel instance where Gemini, through the capabilities of AlphaEvolve, optimizes its own training process."
- Section 6: "Currently, the gains are moderate and the feedback loops for improving the next version of AlphaEvolve are on the order of months."

> [!trap] Why this is a weak and indirect loop
> **Our interpretation, built on the quotes above:**
> 1. What improved is training speed, about 1%, not capability. A faster training run does not by itself make the next model smarter.
> 2. Humans close the loop. Engineers deploy the kernel. A later Gemini is trained. A later AlphaEvolve may use it. The authors call this loop "on the order of months".
> 3. AlphaEvolve does not change its own code. The controller, the database and the evaluators are fixed.
> 4. The authors call the gains "moderate".
>
> So AlphaEvolve is real evidence that AI can contribute to its own infrastructure. It is not an autonomous self-improvement loop.

**What stays fixed.** The LLMs, the evaluators and AlphaEvolve's own code. **What changes:** the user's programs and the meta-prompts. **What persists:** the program database and the meta-prompt database.

**Limitation (Section 6):** "The main limitation of AlphaEvolve is that it handles problems for which it is possible to devise an automated evaluator."

**Ladder.** **Our interpretation:** for its own operation, AlphaEvolve improves external programs, so it is not self-improvement. The co-evolved meta-prompts change part of the proposer's instructions. This is a small step toward Level 5, like Promptbreeder's mutation-prompts (lesson [L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver)). The faster Gemini training is a slow, human-run path toward Level 4 for a future model. [Part 6](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) reads both papers in depth.

### 4.5 OpenEvolve: the same loop in open code

OpenEvolve is an open-source evolutionary coding system by Asankhaya Sharma ([github.com/codelion/openevolve](https://github.com/codelion/openevolve)). Its launch blog (20 May 2025) called it "an open-source implementation of the AlphaEvolve system" ([Hugging Face blog](https://huggingface.co/blog/codelion/openevolve)). The current README no longer names AlphaEvolve. It is independent code, not DeepMind code.

The facts below come from the code at commit `74c7cb0` (version 0.4.0, 19 October 2026). The project changes fast, so details may drift. [Part 7 L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code) walks through the files.

1. **Database.** Five islands by default. Each island has its own MAP-Elites grid over two behavior descriptors, "complexity" (code length) and "diversity" (edit distance), with 10 bins each. A separate elite archive holds up to 100 programs.
2. **Parent choice.** 20% of the time, a random program from the island. 70% of the time, an archive member of that island. 10% of the time, a fitness-weighted choice.
3. **Proposal.** An LLM ensemble writes SEARCH/REPLACE diffs from the parent's code, its scores, the top programs and error artifacts.
4. **Evaluation.** The user's `evaluate()` runs, by default as a cascade with thresholds 0.5, 0.75 and 0.9. The code never uses the third threshold.
5. **Acceptance.** A child takes its grid cell if the cell is empty or if the child is fitter than the incumbent.
6. **Migration.** Every 50 island generations, the top 10% of each island is copied to its two neighbors in a ring.

**Safety facts from the code.** There is no built-in sandbox for candidate programs. In one example, the candidate is imported into the worker process, and the workers inherit the parent's environment, including LLM API keys. Settings for memory and CPU limits exist but are not used anywhere. **Our interpretation:** an evolutionary system runs untrusted, machine-written code by design, so the user must supply the sandbox.

**Claimed:** on circle packing with 26 circles, the blog reports a sum of radii of 2.634 against 2.635 in the AlphaEvolve paper. This is the author's claim, not peer-reviewed.

**Ladder.** The LLM edits only the user's program. The controller, prompt sampler and database are fixed code. So OpenEvolve improves solutions, not itself.

### 4.6 Population Based Training

Population Based Training (PBT) is older and does not use a language model (Jaderberg et al., 2017, [arXiv:1711.09846](https://arxiv.org/abs/1711.09846)). It is an arXiv preprint, and this course found no peer-reviewed venue. It trains many neural networks at the same time and evolves their hyperparameters during training.

Each worker repeats these steps:

1. **Train** its model's weights for some steps with its current hyperparameters.
2. **Evaluate** it, for example by validation BLEU or recent episode returns.
3. **Exploit:** if it is in the bottom 20% of the population, copy the weights and hyperparameters of a random member of the top 20%.
4. **Explore:** multiply each hyperparameter by 0.8 or 1.2, or sample it again from a prior.

> [!example] Worked example: one exploit-and-explore step
> Five workers have learning rates 0.1, 0.03, 0.01, 0.003 and 0.001. Their validation scores are 0.62, 0.71, 0.68, 0.55 and 0.40.
> 1. The bottom 20% is one worker: the one with score 0.40.
> 2. The top 20% is one worker: the one with learning rate 0.03 and score 0.71.
> 3. The weak worker copies the strong worker's weights and its learning rate 0.03.
> 4. Explore: it multiplies 0.03 by 1.2 and gets 0.036. (With 0.8 it would get 0.024.)
>
> The weights persist, so training progress is not lost. The result is a **schedule** of learning rates over time, not one fixed value.

**Results (Measured, as extracted).** Human-normalized score on DeepMind Lab rose from 93% to 106%. Transformer translation BLEU on WMT14 English-German rose from 22.30 to 22.65. These values were read from a large table, so check them against the paper before you quote them.

**A Goodhart guard.** For generative image models, PBT selected on an Inception score computed with a CIFAR classifier. The paper reported the ImageNet Inception score, which PBT therefore did not optimize directly. **Our interpretation:** this is a good habit for any improvement loop. Do not report the number that you selected on.

**Limitations.** PBT is greedy. Small populations get stuck. All final members descended from a single initial member, so diversity collapsed.

**Ladder.** PBT's own rules (bottom 20%, ×0.8 or ×1.2) never change. It is automated optimization with a fixed improver, not RSI. [Part 10 L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories) uses it as a contrast case.

### 4.7 Novelty search: abandon the objective

Some objectives mislead the search. Lehman and Stanley write: "A deceptive objective function will deceive search by actively pointing the wrong way." The source is their 2011 paper in *Evolutionary Computation* (Section 2.1.1). A maze is the standard example. The point closest to the goal, measured in a straight line, may sit behind a wall. A search that follows the distance gets stuck there.

**Novelty search** ignores the objective. It rewards candidates that behave differently from what the search has already seen. Behavior here is a description, such as the final position of a robot in the maze.

The idea in words: a candidate is novel if its behavior is far from its nearest neighbors in the population and the archive.

$$
\rho(x) = \frac{1}{k} \sum_{i=0}^{k} \operatorname{dist}(x, \mu_i)
$$

The symbols mean:

- $x$ is the behavior of the candidate.
- $\mu_i$ is the $i$-th nearest neighbor of $x$ among the population and the archive.
- $\operatorname{dist}$ is a distance between two behaviors, chosen for the domain.
- $k$ is the number of neighbors. The paper uses 15.
- $\rho(x)$ is the novelty score. Candidates with $\rho$ above a threshold enter a permanent archive.

In plain English: average the distances to the closest known behaviors. The paper prints the sum from $i = 0$ to $k$. But the symbol list defines $k$ as the number of neighbors. So the example below averages over the $k$ nearest neighbors (**Our interpretation** of the printed index).

**Worked example** with one-dimensional behaviors and $k = 3$. The known behaviors are 0.0, 1.0, 1.5 and 4.0.

1. Candidate $x = 3.0$. Distances: 3.0, 2.0, 1.5 and 1.0. The three smallest are 1.0, 1.5 and 2.0. Their mean is $4.5 / 3 = 1.5$.
2. Candidate $x = 0.8$. Distances: 0.8, 0.2, 0.7 and 3.2. The three smallest are 0.2, 0.7 and 0.8. Their mean is $1.7 / 3 \approx 0.57$.
3. So $x = 3.0$ is more novel. It explores an empty region.

The assumptions: the behavior descriptor captures what matters, and the distance is meaningful. The equation is useful to drive exploration in deceptive problems. It says nothing about quality. A novel candidate can be useless.

**Results (Measured).** In the hard deceptive maze, novelty search solved 39 of 40 runs. Fitness-based search solved 3 of 40, and random selection 4 of 40. In an open maze with a very large behavior space, novelty search solved 5 of 100 runs and fitness-based search 2 of 100. That difference was not significant.

**Limitations.** No pressure refines a solution once found. A human must design the behavior descriptor. The authors say it "is not a panacea".

**Connection to RSI.** Progress toward a hard goal may need stepping stones that do not look like progress. The DGM keeps an archive for the same reason. Its best agent's lineage "includes two performance dips" (Zhang et al., 2025, [arXiv:2505.22954](https://arxiv.org/abs/2505.22954)). [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) covers this in detail.

### 4.8 MAP-Elites: the best of each kind

MAP-Elites does not look for one best solution. It looks for the best solution in each cell of a grid that the user chooses (Mouret and Clune, 2015, [arXiv:1504.04909](https://arxiv.org/abs/1504.04909)). The paper calls this "illumination".

The algorithm (Figure 2 of the paper):

1. Choose a performance function $f(x)$ and a descriptor $b(x)$ that maps a solution to a cell.
2. Keep two maps: the best performance per cell, and the solution per cell.
3. For a number of steps: make a candidate. At the start it is random. Later it is a mutation or crossover of a random elite.
4. Compute its cell and its performance.
5. If the cell is empty, or the candidate beats the cell's elite, put the candidate in the cell.

> [!example] Worked example: three insertions
> The descriptor is the number of tools an agent uses: 1, 2 or 3. The grid holds: cell 1 with score 0.40, cell 2 with score 0.55, cell 3 empty.
> 1. Candidate c1 uses 2 tools and scores 0.50. Cell 2 holds 0.55, so c1 is rejected.
> 2. Candidate c2 uses 3 tools and scores 0.30. Cell 3 is empty, so c2 is accepted.
> 3. Candidate c3 uses 1 tool and scores 0.45. It beats 0.40, so it replaces the old elite of cell 1.
>
> A greedy search that keeps only the best would hold 0.55 and reject all three. MAP-Elites keeps two of them, including a weak one (0.30) in a new region.

**Results (Measured, preliminary per the authors).** In a neural-network domain, MAP-Elites beat a traditional evolutionary algorithm and two other baselines ($p < 10^{-7}$). It gave higher global performance, reliability, precision and coverage. For soft robots, it gave better reliability and coverage, but no significant gain in global performance.

**Terminology note.** The phrase "quality diversity" does not appear in this paper. Later work calls MAP-Elites a quality-diversity method. **Limitation:** the grid is fixed in advance, so the method is not open-ended in the strict sense.

AlphaEvolve and OpenEvolve both use MAP-Elites grids inside islands.

### 4.9 POET: invent the problems too

The methods so far use a fixed set of problems. When the system has extracted what it can from them, it stops improving. POET attacks this limit. It invents new environments and solves them at the same time (Wang et al., 2019, [arXiv:1901.01753](https://arxiv.org/abs/1901.01753)).

The environments are 2-D obstacle courses for a walking robot, with stumps, gaps and stairs. Each environment is a vector of numbers. Each agent is a neural network controller.

1. Keep a list of environment-agent pairs. Start with one flat course and one random agent.
2. **Mutate environments.** Only environments whose agent scores at least 200 can have children. A child environment is kept only if its first score is between 50 and 300. This is the **minimal criterion**: not too easy, not too hard.
3. **Optimize** each agent in its own environment with Evolution Strategies (ES).
4. **Transfer.** Test agents in other environments. If another agent does better, it replaces the current one.
5. An environment counts as solved at a score of 230 or more.

> [!example] Worked example: the minimal criterion
> Three child environments get first scores of 40, 120 and 320 from the inherited agent.
> 1. Score 40 is below 50: too hard now. Rejected.
> 2. Score 120 is between 50 and 300: kept.
> 3. Score 320 is above 300: too easy. Rejected.

**Results (Measured).** POET solved environments that direct ES from scratch could not solve. In five ES runs on such environments, the best scores were between 13.6 and 39.6, far below 230. Without transfer, no extremely challenging environment was solved. In one transfer back from a child environment, a score rose from 309 to 349. A run took about 10 days on 256 CPU cores, and there were only 3 runs.

**The plateau.** The Enhanced POET paper says: "Original POET runs gradually lose steam and plateau after around 20,000 iterations". The source is its Figure 8 (Wang et al., 2020, [arXiv:2003.08536](https://arxiv.org/abs/2003.08536)). Enhanced POET changed the environment generator to one that can in principle express any terrain. It also added a domain-general novelty test and a metric that counts novel environments created and solved. That count kept rising "almost linearly" and slowed after about 30,000 iterations. A 60,000-iteration run took about 12 days on 750 CPU cores.

**Our interpretation:** the expressiveness of the task generator limits how long improvement continues. The original encoding ran out.

### 4.10 OMNI: what makes a task interesting

In a huge task space, "learnable" is not enough. Many learnable tasks are boring, such as small numeric variants of one task. OMNI adds a model of interestingness (Zhang et al., 2024, [arXiv:2306.01711](https://arxiv.org/abs/2306.01711), ICLR 2024).

1. **Learning progress.** For each task, track the success rate with a fast and a slow moving average. The absolute difference is the learning progress.
2. **Model of interestingness.** A foundation model reads the task list and labels each task "interesting" or "boring". Boring tasks get their sampling weight multiplied by 0.001.
3. Train the reinforcement learning agent on tasks sampled with the combined weights.

| Domain | Measure | Uniform | Learning progress | OMNI |
|---|---|---|---|---|
| Crafter (1,128 tasks) | tasks learned, all / interesting | 4 / 3 | 55 / 9 | 82 / 14 |
| BabyAI (1,364 tasks) | tasks learned | 1 | 4 | 8 |
| AI2-THOR | tasks with success above 0.6 | 0 | 2 | 13 |

**Limitations.** The authors expect Goodhart effects: "we expect that any model will have pathologies uncovered once it is a target metric being optimized against." The foundation model's judgments were not checked against humans. **Speculation:** the authors hope for "a Darwin Complete environment generator".

**Connection to RSI.** The notion of interestingness comes from humans, through the foundation model. It is a fixed prior, not something the system improves.

### 4.11 What open-endedness means

Hughes et al. give a definition with an observer (Hughes et al., 2024, [arXiv:2406.04268](https://arxiv.org/abs/2406.04268), ICML 2024, Section 2.1):

> "From the perspective of an observer, a system is open-ended if and only if the sequence of artifacts it produces is both novel and learnable."

- **Novel:** the artifacts "become increasingly unpredictable with respect to the observer's model at any fixed time t".
- **Learnable:** "conditioning on a longer history makes artifacts more predictable".

Their noisy-TV examples make the two parts clear. A TV with fixed static noise is learnable but stops being novel. A channel that switches to random new distributions is novel but not learnable. Neither is open-ended.

The paper calls AlphaGo "an example of an open-ended system that achieves narrow superhuman intelligence". It calls current foundation models a negative example: "they are not open-ended by our definition". **Speculation:** the authors argue that scaling on passive data "will soon plateau".

**Our interpretation:** this definition makes the observer, a kind of evaluator, part of the concept. A system can be open-ended for a weak observer and not for a strong one. This matches the central lesson of this part: the evaluator decides what counts as progress.

### 4.12 A preview of bloat

Evolution with variable-length programs has a known failure. Bloat is "an excess of code growth without a corresponding improvement in fitness" (Silva and Costa, 2009, [record](https://gpbib.cs.ucl.ac.uk/gp-html/Silva_2009_GPEM.html)). Langdon and Poli explain the cause: for a fixed fitness, there are many more long programs than short ones, so search drifts toward long ones. Their title states the result: "Fitness Causes Bloat" (Langdon and Poli, 1997, [record](https://gpbib.cs.ucl.ac.uk/gp-html/Langdon_1997_bloatTR.html)).

**Speculation:** self-improving agent code may grow in the same way, with tools, prompt text and retries that do not raise held-out scores. No study in this course's sources measures bloat in DGM-like systems. FunSearch's preference for short programs (section 4.3) is one counter-pressure. [Part 8 L5](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift) covers bloat and its controls.

### 4.13 The methods side by side

| Method | What changes | What stays fixed | Feedback | What persists | Ladder |
|---|---|---|---|---|---|
| Classic GA | encoded candidates | operators, fitness | fitness function | population | not self-improvement |
| FunSearch | one function in a skeleton | LLM, evaluator, skeleton | user's `evaluate` | program database with islands | not self-improvement |
| AlphaEvolve | whole code files, meta-prompts | LLMs, evaluators, its own code | evaluation cascade, optional LLM feedback | program and meta-prompt databases | external, plus a slow indirect path |
| OpenEvolve | the user's program | controller, database, prompts | user's evaluator | checkpoints of the database | not self-improvement |
| PBT | weights and hyperparameter schedules | the PBT rules | validation metric | trained models | automated optimization |
| Novelty search | candidates | behavior descriptor | novelty score | novelty archive | not self-improvement |
| MAP-Elites | elites per cell | grid, performance function | performance function | the grid of elites | not self-improvement |
| POET | environments and agents | ES, mutation operators, simulator reward | simulator reward | environment-agent pairs | not self-improvement |
| OMNI | the task curriculum | interestingness from a foundation model | success rates | trained agent | not self-improvement |

The ladder column is **Our interpretation** with the ladder of [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement). None of these methods changes the procedure that makes its own changes. Their value for RSI is different. They supply the archive, the islands, the stepping stones and the open-ended task generation that self-modifying agents use.

## 5. Graphs

```plot
{
  "title": "Mean best fitness over 200 runs of the 6-bit toy: genetic algorithm (blue) and random search with the same number of evaluations (gold)",
  "xAxis": { "label": "generation", "domain": [0, 12] },
  "yAxis": { "label": "best fitness (maximum 6)", "domain": [2.5, 6.2] },
  "disableZoom": true,
  "data": [
    { "points": [[0,3],[1,3.77],[2,4.21],[3,4.54],[4,4.86],[5,5.08],[6,5.26],[7,5.42],[8,5.53],[9,5.66],[10,5.69],[11,5.75],[12,5.79]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0,3],[1,3.77],[2,4.21],[3,4.54],[4,4.86],[5,5.08],[6,5.26],[7,5.42],[8,5.53],[9,5.66],[10,5.69],[11,5.75],[12,5.79]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true },
    { "points": [[0,3],[1,4.05],[2,4.51],[3,4.74],[4,4.92],[5,5.07],[6,5.12],[7,5.23],[8,5.29],[9,5.31],[10,5.34],[11,5.38],[12,5.39]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0,3],[1,4.05],[2,4.51],[3,4.74],[4,4.92],[5,5.07],[6,5.12],[7,5.23],[8,5.29],[9,5.31],[10,5.34],[11,5.38],[12,5.39]], "fnType": "points", "graphType": "scatter", "color": "#B8860B", "skipTip": true }
  ]
}
```

The values come from the program in section 7. Random search leads for the first four generations, because the space has only 64 strings. The GA leads after that, because selection keeps the good bits and crossover combines them. On a larger space the gap would be different. Always measure the baseline on your own problem.

## 6. Video and animation

- [FunSearch from DeepMind explained](https://www.youtube.com/watch?v=EXj5pbH_D3c) (AI Coffee Break with Letitia, about 11 min). A short explainer of the LLM-plus-evaluator loop, with cap sets and bin packing. Watch it before section 4.3.
- [Wild breakthrough on Math after 56 years](https://www.youtube.com/watch?v=vC9nAosXrJw) (Machine Learning Street Talk). Two AlphaEvolve authors explain the loop, the evaluators and the 48-multiplication result. The last chapter asks whether AlphaEvolve's effect on its own training is a form of RSI. Supports section 4.4.
- [Ken Stanley's talk on Why Greatness Cannot Be Planned](https://www.youtube.com/watch?v=VDuF4onPmuE). Why direct pursuit of an objective often fails, and why stepping stones matter. Supports sections 4.7 and 4.8.
- [The AI Paradigm That Nobody Talks About: Tim Rocktäschel](https://www.youtube.com/watch?v=6DrCq8Ry2cw) (Machine Learning Street Talk). Defines open-endedness as novel plus learnable. Supports section 4.11.

## 7. Code

This is the program that produced the numbers of section 4.1 and the plot. It uses only the Python standard library.

```python
import random

def fitness(g):
    return sum(g)                      # number of 1 bits

def tournament(pop, rng):
    i, j = rng.sample(range(len(pop)), 2)
    return pop[i] if fitness(pop[i]) >= fitness(pop[j]) else pop[j]

def crossover(a, b, rng):
    cut = rng.randint(1, len(a) - 1)   # one-point crossover
    return a[:cut] + b[cut:]

def mutate(g, rng, p=1/6):
    return [1 - bit if rng.random() < p else bit for bit in g]

def run(seed, generations=12):
    rng = random.Random(seed)
    pop = [[1,0,1,0,0,0], [0,1,0,0,1,1], [1,1,0,1,0,0], [0,0,0,1,1,0]]
    best = [max(map(fitness, pop))]
    for _ in range(generations):
        new = [max(pop, key=fitness)]  # elitism
        for _ in range(3):
            child = crossover(tournament(pop, rng), tournament(pop, rng), rng)
            new.append(mutate(child, rng))
        pop = new
        best.append(max(map(fitness, pop)))
    return best

curves = [run(s) for s in range(200)]
print([round(sum(c[g] for c in curves) / 200, 2) for g in range(13)])
```

**Exercise 1.** Change the fitness to "number of positions that match the hidden target `110101`". Predict what happens to the curves before you run it.

```check
{
  "question": "In Exercise 1, the fitness counts matches with a hidden target instead of 1 bits. Will the GA curve change? Explain.",
  "hint": "Think about the structure of the problem, not the labels of the bits.",
  "answer": "The curve should look the same up to random variation. Matching a fixed target is the same problem as counting 1 bits after a relabeling. Flip the meaning of each bit where the target has a 0. Selection, crossover and mutation treat every bit position the same way, so they do not care about the labels. The start population has a different fitness under the new rule, so the first point may move."
}
```

## 8. Common mistakes

1. **"Evolutionary search with an LLM is self-improvement."** FunSearch, AlphaEvolve and OpenEvolve improve the user's programs. Their own code, model and evaluator stay fixed.
2. **"AlphaEvolve improves itself recursively."** It sped up the training of its base model family by about 1%. Humans closed the loop, and the authors say it takes "on the order of months".
3. **"Mutation is the creative part."** Mutation proposes. Selection and the evaluator decide what survives. A weak evaluator gives weak or gamed results.
4. **"Keep only the best candidate."** Greedy search loses stepping stones. Novelty search solved 39 of 40 hard mazes against 3 of 40 for fitness-based search.
5. **"A bigger LLM always helps."** The AlphaEvolve paper reports that FunSearch saw "no benefit from larger" models, while AlphaEvolve did benefit. It depends on the setting.
6. **"MAP-Elites is open-ended."** Its grid is fixed in advance, so the set of kinds of solutions is bounded.
7. **"The evaluator is safe to run on candidate code."** OpenEvolve has no built-in sandbox. Evolutionary systems run untrusted, machine-written code by design.

## 9. One-minute explanation

Evolutionary search keeps a population of candidates, changes them, scores them and keeps the better ones. Modern systems let a language model write the changes, and FunSearch used this to find a cap set of size 512 in dimension 8. AlphaEvolve evolves whole files, recovered about 0.7% of Google's compute, and cut Gemini training time by about 1%. So its authors say Gemini "optimizes its own training process", through a human-run loop "on the order of months". In all these systems the model, evaluator and search code stay fixed, so they improve solutions, not themselves. Their value for RSI is their machinery (islands, archives, quality-diversity grids, stepping stones), and open-endedness research shows that fixed task sets eventually run out.

## 10. Check questions

```check
{
  "question": "A GA population is P = (110000 with fitness 2, 011100 with fitness 3, 100111 with fitness 4, 000001 with fitness 1). Tournament 1 picks 110000 and 000001. Tournament 2 picks 011100 and 100111. Crossover cuts at position 2. No mutation happens. What is the child and its fitness?",
  "hint": "Each tournament keeps the fitter member. Take the left 2 bits from parent 1 and the rest from parent 2.",
  "answer": "Tournament 1 keeps 110000 (2 beats 1). Tournament 2 keeps 100111 (4 beats 3). Cut at 2: left part 11 from 110000, right part 0111 from 100111. The child is 110111 with fitness 5, better than both parents."
}
```

```check
{
  "question": "FunSearch has three clusters with scores 0.50, 0.55 and 0.60. Compute the probability of the best cluster when T = 0.1 and when T = 0.05. What does the change tell you about the search?",
  "hint": "Compute exp(s/T) for each cluster and divide by the sum.",
  "answer": "At T = 0.1: exp(6.0) / (exp(5.0) + exp(5.5) + exp(6.0)) = 403.4 / 796.5 ≈ 0.51. At T = 0.05: exp(12) / (exp(10) + exp(11) + exp(12)) ≈ 0.665. A lower temperature makes the search greedier: it uses the best cluster more and explores less. FunSearch lowers T over each block of 30,000 programs and then resets it."
}
```

```check
{
  "question": "Classify each system and give the reason: (a) FunSearch, (b) AlphaEvolve's effect on Gemini training, (c) PBT. Is each one RSI in the strong sense of this course (the improver itself is improved and the improved improver does the next improvement)?",
  "answer": "(a) Not RSI. A frozen LLM and a fixed evaluator improve an external function. Nothing about FunSearch changes. (b) Not RSI in the strong sense. A faster kernel from AlphaEvolve shortened Gemini training by about 1%. But engineers deploy it and train the next model, and the loop takes months. It is an indirect, human-mediated contribution. (c) Not RSI. PBT changes weights and hyperparameters of the models it trains, but its own rules (bottom 20%, ×0.8 or ×1.2) never change."
}
```

```check
{
  "question": "A MAP-Elites grid by code length has cells short, medium and long with elites scoring 0.70, 0.62 and empty. Three candidates arrive: (medium, 0.60), (long, 0.20), (short, 0.71). Which are kept? Then argue why keeping the 0.20 candidate could be useful.",
  "answer": "(medium, 0.60) is rejected because 0.60 < 0.62. (long, 0.20) is kept because the cell is empty. (short, 0.71) replaces the 0.70 elite. The 0.20 candidate may be a stepping stone. A long program may contain a structure that later mutations turn into a strong solution. Greedy search would never explore it. The DGM shows this pattern: its best lineage passed through versions that scored lower than their parents."
}
```

## 11. Summary and links

- A genetic algorithm proposes by mutation and crossover and decides by selection. Always compare it with random search at the same budget.
- A language model as the mutation operator writes meaningful changes. A fixed evaluator still decides what survives.
- FunSearch and AlphaEvolve found real results, but they improve user programs. Their model, evaluator and code stay fixed.
- AlphaEvolve's link to its own training is real but indirect: about 1% faster training, human-mediated, "on the order of months".
- Quality-diversity, novelty search and POET keep stepping stones and invent new tasks. Fixed task sets and fixed encodings eventually plateau.
- Open-endedness means novel and learnable for an observer, so the evaluator is part of the definition.

The next lesson moves the change into the weights: models that make their own training data.

- Previous: [L5: Code self-modification](/notes/ai/recursive-self-improvement/05-approaches/l5-code-self-modification)
- Next: [L7: Training-based self-improvement and synthetic data](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement)
- Related: [2023 and 2025: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve), [L6: OpenEvolve in code](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code), [L3: Archives](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions), [L5: Churn, bloat, lost behavior, drift and runaway cost](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift)

## References

- Bernardino Romera-Paredes, Mohammadamin Barekatain, Alexander Novikov, et al. "Mathematical discoveries from program search with large language models". *Nature* 625(7995):468–475. 2023 (online 14 Dec 2023). DOI 10.1038/s41586-023-06924-6. https://www.nature.com/articles/s41586-023-06924-6. Code: https://github.com/google-deepmind/funsearch
- Alexander Novikov, Ngân Vũ, Marvin Eisenberger, et al. "AlphaEvolve: A coding agent for scientific and algorithmic discovery". 2025. arXiv:2506.13131. https://arxiv.org/abs/2506.13131
- Google DeepMind. "AlphaEvolve: A Gemini-powered coding agent for designing advanced algorithms". Blog, 14 May 2025. https://deepmind.google/discover/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/
- Asankhaya Sharma. "OpenEvolve: an open-source evolutionary coding agent". Software, 2025. https://github.com/codelion/openevolve. Launch blog: https://huggingface.co/blog/codelion/openevolve
- Max Jaderberg, Valentin Dalibard, Simon Osindero, et al. "Population Based Training of Neural Networks". 2017. arXiv:1711.09846. https://arxiv.org/abs/1711.09846
- Esteban Real, Alok Aggarwal, Yanping Huang, Quoc V Le. "Regularized Evolution for Image Classifier Architecture Search". AAAI 2019. arXiv:1802.01548. https://arxiv.org/abs/1802.01548
- Joel Lehman, Kenneth O. Stanley. "Abandoning Objectives: Evolution through the Search for Novelty Alone". *Evolutionary Computation* 19(2):189–223. 2011. DOI 10.1162/EVCO_a_00025.
- Jean-Baptiste Mouret, Jeff Clune. "Illuminating search spaces by mapping elites". 2015. arXiv:1504.04909. https://arxiv.org/abs/1504.04909
- Rui Wang, Joel Lehman, Jeff Clune, Kenneth O. Stanley. "Paired Open-Ended Trailblazer (POET): Endlessly Generating Increasingly Complex and Diverse Learning Environments and Their Solutions". 2019. arXiv:1901.01753. https://arxiv.org/abs/1901.01753
- Rui Wang, Joel Lehman, Aditya Rawal, Jiale Zhi, Yulun Li, Jeff Clune, Kenneth O. Stanley. "Enhanced POET: Open-Ended Reinforcement Learning through Unbounded Invention of Learning Challenges and their Solutions". ICML 2020. arXiv:2003.08536. https://arxiv.org/abs/2003.08536
- Jenny Zhang, Joel Lehman, Kenneth Stanley, Jeff Clune. "OMNI: Open-endedness via Models of human Notions of Interestingness". ICLR 2024. arXiv:2306.01711. https://arxiv.org/abs/2306.01711
- Edward Hughes, Michael Dennis, Jack Parker-Holder, et al. "Open-Endedness is Essential for Artificial Superhuman Intelligence". ICML 2024, PMLR 235. arXiv:2406.04268. https://arxiv.org/abs/2406.04268
- W. B. Langdon, R. Poli. "Fitness Causes Bloat". Technical Report CSRP-97-09, University of Birmingham. 1997. https://gpbib.cs.ucl.ac.uk/gp-html/Langdon_1997_bloatTR.html
- S. Silva, E. Costa. "Dynamic limits for bloat control in genetic programming and a review of past and current bloat theories". *Genetic Programming and Evolvable Machines* 10(2):141–179. 2009. https://gpbib.cs.ucl.ac.uk/gp-html/Silva_2009_GPEM.html
- Jenny Zhang, Shengran Hu, Cong Lu, Robert Lange, Jeff Clune. "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents". ICLR 2026. arXiv:2505.22954. https://arxiv.org/abs/2505.22954
- James Bergstra, Yoshua Bengio. "Random Search for Hyper-Parameter Optimization". *Journal of Machine Learning Research* 13:281–305. 2012. https://www.jmlr.org/papers/v13/bergstra12a.html
