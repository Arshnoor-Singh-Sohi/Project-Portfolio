---
title: "L4: Workflow and architecture search"
order: 4
summary: "From neural architecture search to automated agent design: what ADAS, AFlow and MaAS search over and what the critiques found."
status: not-started
tags: [rsi, automl, neural-architecture-search, adas, aflow, maas, agent-design]
---

## Learning objectives

After this lesson you can:

- Describe classic AutoML methods (random search, NAS with reinforcement learning, regularized evolution, AutoML-Zero, Population Based Training) by what they search and what stays fixed.
- Explain how ADAS, AFlow and MaAS represent agent designs and search over them.
- Read their results with the right caveats: small validation sets, transfer agents chosen by test accuracy, and relative versus absolute gains.
- Summarize what the independent critiques found.
- Explain why the designer is fixed in all of these systems, and place them on the ladder.

## Prerequisites

- [L4: Optimization and search](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search)
- [L3: Archives: why keep more than the best version](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions)
- [L3: Evaluation under noise](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise)
- [L3: Prompt and instruction optimization](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization)

## 1. The question this idea answers

An architect designs houses by hand. Now imagine a robot that proposes house plans, tests each plan in a simulator, and keeps the plans that score well. The robot designs houses, but people designed the robot. Who improves the robot?

Machine learning has asked this question since about 2016. First, programs searched for neural network designs. Since 2024, a large language model (LLM) writes whole agent designs as code. This lesson asks: **what do these design searches really change, how good is the evidence, and does any of them improve its own designer?**

The answer prepares [L5](/notes/ai/recursive-self-improvement/05-approaches/l5-code-self-modification). Once an agent is code, an agent can, in principle, rewrite its own code.

## 2. Mental model, and where it stops working

> [!analogy] A coach who designs set plays
> A coach draws new set plays for her team. She tests each play in a few practice games and keeps the plays that scored. Over a season, the playbook gets better.
>
> **Where it stops working:** the coach never changes how she invents plays. A play that worked in three practice games may fail in a real match. A play built for one team may fail with another team.

## 3. Terms

| Term | Plain meaning |
|---|---|
| AutoML (automated machine learning) | Methods that automate design choices in machine learning, such as hyperparameters or architectures. |
| hyperparameter | A setting chosen before training, such as the learning rate. |
| architecture | The structure of a neural network: its layers and their connections. |
| neural architecture search (NAS) | Automatic search for a good neural network architecture. |
| controller | In NAS, a model that outputs candidate architectures. |
| reinforcement learning (RL) | Learning from a reward signal by trial and error. |
| tournament selection | Pick a random sample of candidates and use the best of them as a parent. |
| agentic system | An agent design: its prompts, model calls, control flow and tools. |
| workflow | An agentic system written as a fixed graph of LLM calls joined by code. |
| meta agent | An agent whose job is to design other agents. |
| `forward()` function | In ADAS, the Python function that defines one agent: it takes a task and returns an answer. |
| Monte Carlo tree search (MCTS) | A search that grows a tree of options. It picks promising branches, tries them, and records the results back up the tree. |
| operator (AFlow, MaAS) | A reusable building block of LLM calls, such as "generate", "review and revise" or "ensemble". |
| supernet | A single structure that contains many possible designs, with a learned probability for each part. |
| cross-model transfer | Using a design found with one task model on a different task model. |
| bootstrap confidence interval | An uncertainty range computed by resampling the evaluated questions many times. |

## 4. Method and math

### 4.1 Machines that design machines

The ADAS paper names three parts of any automated design method (Hu et al., 2024, [arXiv:2408.08435](https://arxiv.org/abs/2408.08435), Figure 2):

1. A **search space**: which designs the method can represent.
2. A **search algorithm**: how it explores that space.
3. An **evaluation function**: how it scores a design, for example accuracy on a validation set.

Every method below defines these three parts differently. One baseline applies to all of them: random search. Bergstra and Bengio (2012) showed that "randomly chosen trials are more efficient for hyper-parameter optimization than trials on a grid". Later NAS studies found that random search stays hard to beat. Li and Talwalkar (2019) found that "random search with early-stopping is a competitive NAS baseline". Yu et al. (2020) found that "On average, the state-of-the-art NAS algorithms perform similarly to the random policy".

### 4.2 Classic AutoML in four methods

Four classic methods show the main ideas before LLMs.

| Method | What it searches | How it proposes | What stays fixed |
|---|---|---|---|
| NAS with RL (Zoph and Le, 2016) | Network architectures | A controller network outputs architectures. Validation accuracy of each child network is the reward. | The controller design and its learning rule |
| Regularized evolution (Real et al., 2018) | Network cells | Mutate the best of 25 random members. Remove the oldest member, not the worst. | The mutation rules and the aging rule |
| AutoML-Zero (Real et al., 2020) | Whole learning algorithms built from 65 basic math operations | Mutations inside regularized evolution | The evolutionary searcher |
| Population Based Training (Jaderberg et al., 2017) | Hyperparameter schedules, with inherited weights | Bottom 20% copy the weights and settings of the top 20%, then perturb the settings | The copy and perturb rules |

**Measured:** NAS with RL used 800 GPUs at once and trained 12,800 architectures for CIFAR-10, an image classification benchmark. The best one reached 3.65% test error. This scale explains why later work cared about cost.

**Measured and Claimed:** regularized evolution reached high accuracy earlier than RL on the same hardware, and both beat random search. The authors explain the aging rule with noise. Evaluation is noisy, so a lucky model can dominate a population that never removes old members. With aging, the population improves only through "architectures that re-train well". A toy experiment supports this claim. It is an early lesson about overfitting to a noisy evaluator.

**Measured:** AutoML-Zero rediscovered two-layer neural networks trained by backpropagation from basic math operations. Good algorithms can be "as rare as 1 in 10^12". It also used clean splits: 36 tasks for search, 9 held-out tasks to choose the final algorithm, and a separate test set.

**Measured:** Population Based Training raised a Transformer's translation score from 22.30 to 22.65 BLEU, a standard translation score. In one experiment, it optimized one image score and reported a different one, so the reported score was never optimized directly. That is a small guard against Goodhart's law. Its stated limit is that all final members descended from one initial member, so diversity collapsed.

In all four, a fixed search algorithm improves a separate model. **Our interpretation:** this is external optimization ([Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence)), not self-improvement. AutoML-Zero is a special case. It learns a learning algorithm, which [L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver) discusses, but its own searcher stays fixed.

### 4.3 ADAS: a meta agent that writes agents as code

ADAS, the Automated Design of Agentic Systems, defines every agent as a Python `forward()` function (Hu et al., 2024). The function lives inside "a simple framework (within 100 lines of code)". Code can express any computation. So the paper argues that this "theoretically enables the learning of any possible agentic system". **Theory:** that is an argument about the search space. It is not evidence that search will find good designs.

> [!key] Meta agent
> 1. **Name and meaning:** a meta agent is an agent whose output is another agent.
> 2. **Problem it solves:** people invent agent designs by hand, and the meta agent searches for designs automatically.
> 3. **Example:** ADAS's gpt-4o meta agent writes a new `forward()` function in each iteration.
> 4. **Link to RSI:** if the meta agent could also redesign itself, the loop would become recursive. In ADAS it cannot, so ADAS improves agents, not itself.
> 5. **Limits:** a meta agent is only as good as its evaluator and its context. El et al. (2025) found that a full archive in its prompt can hurt.

The search algorithm is called Meta Agent Search:

1. Start the archive with seven hand-designed agents, such as chain of thought, self-consistency, Self-Refine and LLM debate. Score each on the validation set.
2. The meta agent, gpt-4o, reads the framework code, the task description and the whole archive with scores.
3. It writes a high-level idea and the code of a new `forward()`.
4. It reflects twice on novelty and correctness. If the code fails, it tries to fix it, up to 5 times in the paper.
5. The new agent runs on the validation set with gpt-3.5-turbo, and its code and score join the archive.
6. Repeat for 25 iterations on ARC and 30 on the reasoning domains. Finally, report test accuracy.

The prompt encourages "interestingly new (e.g., novel or worthwhile) agents".

> [!example] What one archive entry looks like
> 1. Each entry has five fields: `thought`, `name`, `code`, `fitness` and `generation`.
> 2. In the shipped MGSM results file, the last of 36 entries is the "Dynamic Task Allocation and Feedback Agent", from generation 30.
> 3. Its fitness is a string: "(23.4%, 39.1%), Median: 31.2%", a 95% bootstrap confidence interval on the validation set.
> 4. The next meta-agent prompt contains every entry like this one, with its full code.

The data splits are small. ARC, a set of abstract visual puzzles, used 20 validation and 60 test questions. DROP, MGSM and MMLU used 128 validation and 800 test questions. GPQA used 32 and 166.

**Measured** held-out test results with gpt-3.5-turbo (Hu et al., 2024, Table 1). DROP is reading comprehension scored by F1, MGSM is multilingual grade-school math, MMLU is multiple-choice knowledge, and GPQA is hard science questions.

| Agent | DROP F1 | MGSM % | MMLU % | GPQA % |
|---|---|---|---|---|
| Chain of thought | 64.2 | 28.0 | 65.4 | 29.2 |
| Best hand-designed agent, per benchmark | 65.8 | 39.0 | 65.9 | 31.6 |
| Prompt optimization (OPRO) | 69.1 | 30.6 | 67.6 | 32.9 |
| Meta Agent Search | 79.4 | 53.4 | 69.6 | 34.6 |

The gains are large on DROP and MGSM. On MMLU and GPQA, Meta Agent Search beat OPRO by only 2.0 and 1.7 points. Those intervals are about ±3.2 points wide, so the gaps sit inside the noise.

**Measured:** the best MGSM agent also transferred to other math sets: 69.5 against 43.6 for the best baseline on GSM8K. On ARC, the best discovered agent with Claude-Sonnet reached 48.3 ± 5.7%, against 39.3 ± 5.5% for Self-Refine.

That second result has a selection problem. The paper says: "We test the top 3 agents with the best test accuracy evaluated with GPT-3.5 on ARC." So test data chose the agents that were transferred. The transfer table is therefore not a clean held-out estimate.

Two more facts matter. The ADAS paper's own cost in US dollars is not verified here. The Gödel Agent paper reports that Meta Agent Search needs about USD 300 for its experiments ([L5](/notes/ai/recursive-self-improvement/05-approaches/l5-code-self-modification)). And the paper names future work: "to allow the learning of the meta agent and even the meta-meta agent". **Speculation:** this higher-order ADAS was not done.

### 4.4 AFlow: tree search over workflow code

AFlow represents a workflow as LLM-calling nodes joined by edges written as code (Zhang et al., 2024, [arXiv:2410.10762](https://arxiv.org/abs/2410.10762)). The search keeps the model and temperature of each node fixed. It changes prompts and code edges, using operators such as Generate, Review and Revise, Ensemble, Test and Programmer.

The search is a variant of Monte Carlo tree search, with these steps:

1. Split the data: 20% validation and 80% test. Keep validation problems with high score variance.
2. **Select** a workflow from the top 3 so far, or the starting template, with a mix of uniform and score-based probabilities.
3. **Expand:** the proposer LLM, Claude-3.5-sonnet, changes the selected workflow's code. It reads the record of earlier changes and whether each one helped.
4. **Evaluate** the new workflow 5 times on the validation set.
5. **Record** its score and change in the tree. Stop early if the top scores do not improve for 5 iterations, or after 20 iterations.

The paper gives swapped values for two mixing constants in its main text and its appendix. That is a small internal inconsistency.

**Measured** with GPT-4o-mini as the executor (Zhang et al., 2024, Table 1, values from an automated reading of the table):

| Method | HumanEval | MBPP | MATH | Average of six benchmarks |
|---|---|---|---|---|
| Direct answer (IO) | 87.0 | 71.8 | 48.6 | 72.8 |
| Chain of thought with self-consistency | 91.6 | 73.6 | 50.4 | 76.0 |
| ADAS (re-run by the AFlow authors) | 82.4 | 53.4 | 35.4 | 67.2 |
| AFlow | 94.7 | 83.4 | 56.2 | 80.3 |

> [!example] Worked example: relative and absolute gains
> The abstract reports "a 5.7% average improvement over state-of-the-art baselines".
> 1. Absolute gain: 80.3 − 76.0 = 4.3 points.
> 2. Relative gain: 80.3 / 76.0 = 1.057, so 5.7%.
> 3. Against ADAS: 80.3 − 67.2 = 13.1 points absolute, and 80.3 / 67.2 = 1.195, so 19.5% relative.
> 4. Both headline numbers are relative. Always convert them to points before you compare papers.

**Measured:** workflows found with DeepSeek-V2.5 performed notably worse when run with GPT-4o-mini. So, as with prompts, a design can fit one model. The paper does not report the cost of the search itself. The MaAS paper reports USD 22.50 for AFlow's search on MATH.

### 4.5 MaAS: a distribution of designs, chosen per question

MaAS searches for a distribution of designs, not one best workflow (Zhang et al., 2025, [arXiv:2502.04180](https://arxiv.org/abs/2502.04180)). It borrows the idea of a supernet from one-shot NAS. The "agentic supernet" has 4 layers of operators, such as chain of thought, ReAct, debate, self-refine and early exit.

For each query, a controller samples a multi-agent system from the supernet. So easy questions can get short pipelines and hard ones long pipelines. The learning signal rewards performance and penalizes token cost. The operators' prompts change through LLM-written "textual gradients", the idea of [L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization).

**Measured:** the abstract reports that MaAS needs "only 6∼45% of the inference costs" of existing systems and "surpasses them by 0.54%∼11.82%". The search on MATH cost USD 3.38 and 53 minutes, against USD 22.50 and 184 minutes for AFlow. These values come from an automated reading of the paper's tables. The train-to-test split was 1 to 4.

### 4.6 The critiques

Two independent lines of evidence weaken the case for meta agents.

**First, a direct study.** El, Yuksekgonul and Zou (2025) re-ran ADAS-style design ([arXiv:2510.06711](https://arxiv.org/abs/2510.06711)). They used gpt-4o as the meta agent and gpt-3.5 agents, with 30 iterations and 3 runs. They found four problems:

1. **The archive in the prompt hurt.** The ADAS-style cumulative context "performs worse than ignoring prior designs entirely". A context with only the top 7 parents did better.
2. **Low diversity.** The meta agent "typically commits to a single agent at test time", and the designed agents show "low behavioral diversity".
3. **Train-to-test drops.** The agent with the best training score lost on test, for example from 74.7 to 66.2 on MMLU. On GPQA, an evolved agent scored 28.5 on test, below the 30.0 of the initial hand-designed library.
4. **Economics.** Automated design was cheaper than human design on only two of four datasets, and only when deployed on "over 15,000 examples".

**Second, a competitor's re-run.** AFlow ran ADAS with GPT-4o-mini on six benchmarks. ADAS averaged 67.2, below the plain direct answer at 72.8. On MBPP it scored 53.4 against 71.8, and on MATH 35.4 against 48.6. This is a competitor's reimplementation, so treat it with care. But it agrees with the first study.

> [!example] Worked example: how noisy is a 20-question validation set?
> ADAS chose ARC agents with 20 validation questions, so one question is worth 5 points.
> 1. Near 15% accuracy, the standard error is $\sqrt{0.15 \times 0.85 / 20} \approx 0.080$, or 8 points.
> 2. A 95% interval is about ±16 points.
> 3. ADAS ran each agent 5 times on ARC. Repeats reduce the noise from random answers. They do not reduce the noise from which 20 questions were drawn.
> 4. So many of the 25 designs could look best on validation by luck. The held-out 60 test questions are the honest check, and they also have wide intervals: 13.7 ± 3.9% for the best discovered agent.

### 4.7 The designer is fixed

In every system of this lesson, the designer never changes. ADAS's meta agent, its prompt and the evaluation function stay the same from the first iteration to the last. AFlow's proposer LLM and tree-search rules are fixed. MaAS learns its controller and operator prompts, but its learning rule is fixed. The SICA paper calls ADAS "not self-improving" for this reason.

On the ladder of Part 2, what these systems change is an agent's implementation: prompts, control flow and tools as code. That matches Level 3. But the change comes from a separate, fixed designer, so it is not self-modification. **Our interpretation:** call this Level 3 with an external designer. By the boundary test of Part 2 L3, it is external optimization of an agent.

The step to self-modification is small. ADAS showed that an agent can be code that an LLM writes. The Darwin Gödel Machine then let the coding agent change its own code.

Its ablation shows the difference. On SWE-bench, the full system reached 50.0%. In the version "w/o self-improve", the base agent stays fixed as the meta agent, as in ADAS. That version reached 39.0% (Zhang et al., 2025, [arXiv:2505.22954](https://arxiv.org/abs/2505.22954)). [L5](/notes/ai/recursive-self-improvement/05-approaches/l5-code-self-modification) explains that system.

### 4.8 Comparison table

| Method | Search space | Proposer | Evaluator | Selection set | Archive | Designer improved? | Place on the ladder |
|---|---|---|---|---|---|---|---|
| Random search | Hyperparameters | Random sampling | Validation error | Validation set | List of trials | No | External optimization |
| NAS with RL | Architectures | Controller network, trained by RL | Child validation accuracy | 5,000 held-out training images | None, the controller's weights carry memory | Controller weights learn, the rule is fixed | External optimization |
| Regularized evolution | Network cells | Random mutation | Validation accuracy | Held-out part of the training set | Population of 100, aging | No | External optimization |
| AutoML-Zero | Learning algorithms | Random mutation | Accuracy on search tasks | 36 search tasks, 9 selection tasks | Population of 100 to 1,000 | No | External optimization of a learner |
| Population Based Training | Hyperparameter schedules | Perturb or resample | Validation score | Validation set | Population of 10 to 80 | No | External optimization |
| ADAS | Agent code, a `forward()` function | gpt-4o meta agent with the whole archive | Validation accuracy with gpt-3.5 | 20 to 128 questions | Every evaluated agent, never removed | No, named as future work | Level 3, external designer |
| AFlow | Workflow code: prompts and edges | Claude-3.5-sonnet with a record of past changes | Validation score over 5 runs | 20% of the data, high-variance problems | Search tree | No | Level 3, external designer |
| MaAS | Distribution over operator graphs | Controller sampling plus textual gradients | Performance minus a cost penalty | Training split | Supernet weights | No | Level 3, external designer |

## 5. Graphs

```plot
{
  "title": "Held-out test scores with gpt-3.5 on DROP (1), MGSM (2), MMLU (3) and GPQA (4): Meta Agent Search (blue), OPRO (gold), best hand-designed agent (red)",
  "xAxis": { "label": "benchmark: 1 DROP, 2 MGSM, 3 MMLU, 4 GPQA", "domain": [0.7, 4.3] },
  "yAxis": { "label": "score", "domain": [20, 85] },
  "disableZoom": true,
  "data": [
    { "points": [[1, 79.4], [2, 53.4], [3, 69.6], [4, 34.6]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true },
    { "points": [[1, 79.4], [2, 53.4], [3, 69.6], [4, 34.6]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[1, 69.1], [2, 30.6], [3, 67.6], [4, 32.9]], "fnType": "points", "graphType": "scatter", "color": "#B8860B", "skipTip": true },
    { "points": [[1, 69.1], [2, 30.6], [3, 67.6], [4, 32.9]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[1, 65.8], [2, 39.0], [3, 65.9], [4, 31.6]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 65.8], [2, 39.0], [3, 65.9], [4, 31.6]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true }
  ]
}
```

The values come from Hu et al. (2024, Table 1). The lines only join the four benchmarks, so their slopes carry no meaning. The gap between blue and the other lines is wide at points 1 and 2, and narrow at points 3 and 4. On MMLU and GPQA, the gaps are smaller than the ±3.2-point intervals.

## 6. Video and animation

- [Automated Design of Agentic Systems with Shengran Hu](https://www.youtube.com/watch?v=C5EyZAYlW7E) (TWIML podcast). The ADAS first author on agents as code, the archive and the designs found on ARC. It supports section 4.3.
- [Don't invent faster horses](https://www.youtube.com/watch?v=mw5WIDGRLnA) (Jeff Clune, Machine Learning Street Talk). A long interview on open-ended search and AI-generating algorithms, with ADAS from 1:15:10. It gives the authors' motivation, not the critiques.
- [AFlow: Automating Agentic Workflow Generation](https://www.youtube.com/watch?v=07FFbeD3qWM) (YanAITalk). Optional. An independent paper review of AFlow's tree search. It supports section 4.4.

No animation is planned for this lesson.

## 7. Code

The public ADAS code shows how a candidate becomes an agent. This excerpt is from `_mgsm/search.py`, function `evaluate_forward_fn()`, lines 281–289, at commit `2702bee` of the ShengranHu/ADAS repository. The code was read, not run.

```python
    namespace = {}
    exec(forward_str, globals(), namespace)
    names = list(namespace.keys())
    if len(names) != 1:
        raise AssertionError(f"{len(names)} things in namespace. Please only provide 1")
    func = namespace[names[0]]
    if not callable(func):
        raise AssertionError(f"{func} is not callable")
    setattr(AgentSystem, "forward", func)
```

What each part does:

1. `exec(forward_str, globals(), namespace)` runs the model-written code as a string. The new definitions land in `namespace`, but the code can read the search program's globals.
2. The two checks make sure that the code defined exactly one thing, and that it is callable. These are the only guards.
3. `setattr(AgentSystem, "forward", func)` installs the new function as the agent's `forward()` method. This is monkey patching: replacing a function of a running program.

Three facts follow from the code, and they differ from the paper in places:

1. **No sandbox.** The code runs in the main Python process, with the API client, the file system and the network available. The paper says that generated code ran in "containerized" environments. The released code has no container logic, so isolation is the user's job.
2. **No acceptance test.** Every candidate that produces scores joins the archive. Only the meta agent's reading of the fitness values creates selection pressure.
3. **Fewer repairs.** The code allows 3 repair attempts by default, and the paper says 5.

[Part 7 L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code) walks through the full search loop.

## 8. Common mistakes

1. **"ADAS is a self-improving agent."** A fixed meta agent writes other agents. The meta agent never changes.
2. **"Code can express any agent, so the search finds the best agent."** That is a statement about the search space. The critiques found low diversity and train-to-test drops.
3. **"AFlow is 5.7% better, so it gains 5.7 points."** The 5.7% is relative. The absolute gain is 4.3 points.
4. **"The transfer results are held-out evidence."** ADAS chose its transferred ARC agents by test accuracy.
5. **"More archive context helps the meta agent."** El et al. found that the full archive in the prompt was worse than no archive.

## 9. One-minute explanation

Since neural architecture search, a fixed search algorithm proposes designs, a validation score selects them, and random search is a strong baseline. In ADAS, a meta agent writes each agent as a Python function, keeps an archive and scores designs on small validation sets. It beat hand-designed agents clearly on DROP and MGSM, but only slightly on MMLU and GPQA. AFlow searches workflow code with tree search, and MaAS samples a design per question. Independent checks found that ADAS can fall below a direct answer. In all of these systems, the designer is fixed, so they change an agent's implementation from outside.

## 10. Check questions

```check
{
  "question": "AFlow averages 80.3 and plain IO prompting averages 72.8 with GPT-4o-mini. Give the absolute and the relative gain. Which one should you use to compare with another paper that reports points?",
  "answer": "Absolute: 80.3 − 72.8 = 7.5 points. Relative: 80.3 / 72.8 = 1.103, so 10.3%. Use the absolute gain in points when the other paper reports points, because a relative gain depends on the baseline level."
}
```

```check
{
  "question": "ADAS evaluates each GPQA candidate on 32 validation questions. Near 30% accuracy, what is the standard error, and how many questions does one standard error equal?",
  "hint": "Use sqrt(p(1 − p) / n), then multiply by 32.",
  "answer": "sqrt(0.3 × 0.7 / 32) = sqrt(0.00656) ≈ 0.081, or about 8 points. One standard error is about 0.081 × 32 ≈ 2.6 questions. So two candidates that differ by two or three questions on the validation set may have the same real quality. With 30 candidates, the best one is likely lucky."
}
```

```check
{
  "question": "The ADAS paper transferred 'the top 3 agents with the best test accuracy' on ARC to Claude-Sonnet. Why is the transfer result not a clean held-out estimate, and how would you redesign the experiment?",
  "answer": "The test set chose which agents to transfer. So the transferred agents are partly the ones with lucky test scores, and the test set is no longer untouched. A clean design chooses the agents to transfer by validation score only. Then it evaluates them on a test set that played no part in any choice, ideally fresh tasks for the new model."
}
```

```check
{
  "question": "For ADAS, AFlow and MaAS, name the part that does the designing, and state whether the system can change that part. Then place them on the ladder.",
  "answer": "ADAS: the gpt-4o meta agent and its prompt. Fixed. AFlow: the Claude-3.5-sonnet proposer and the tree-search rules. Fixed. MaAS: the controller and operator prompts are learned, but the learning rule and the supernet structure are fixed. All three change an agent's implementation, which matches Level 3. But a separate, fixed designer makes the change, so it is external optimization, not self-modification."
}
```

```check
{
  "question": "Which fixed part limits ADAS most, according to El, Yuksekgonul and Zou (2025)? Use their findings to argue your answer.",
  "answer": "The meta agent and the way it uses the archive. The ADAS-style context, with the whole archive in the prompt, performed worse than ignoring prior designs. A context with the top 7 parents did better. The meta agent also tended to commit to one design, so the archive did not create real diversity. ADAS cannot change any of this, because the meta agent's prompt and the context format are fixed. Small validation sets add a second limit, because they let lucky designs win."
}
```

## 11. Summary and links

- Automated design has three parts: a search space, a search algorithm and an evaluation function. Random search is the baseline for all of them.
- Classic AutoML improved models and hyperparameters with fixed search algorithms, and taught lessons about noise, aging and clean splits.
- ADAS writes agents as code with a fixed meta agent and a growing archive. Its gains are large on DROP and MGSM and within the noise on MMLU and GPQA.
- AFlow uses tree search over workflow code, and MaAS learns a distribution of designs with a cost penalty. Their headline gains are relative.
- Independent checks found train-to-test drops, low diversity and cases where ADAS fell below a direct answer.
- In every system, the designer is fixed. They reach Level 3 by what they change, but with an external designer.

The next lesson removes the separate designer. The agent that solves tasks is also the agent that changes its own code, and the improver itself becomes a candidate.

- Previous: [L3: Prompt and instruction optimization](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization)
- Next: [L5: Code self-modification](/notes/ai/recursive-self-improvement/05-approaches/l5-code-self-modification)
- Paper page: [2024: ADAS and Meta Agent Search](/notes/ai/recursive-self-improvement/06-research-systems/p07-adas-meta-agent-search)
- Code walkthrough: [L3: ADAS in code](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code)
- Failure mode: [L3: Evaluation failures: leakage, overfitting, noise and regression](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures)

## References

- Shengran Hu, Cong Lu, Jeff Clune. "Automated Design of Agentic Systems". ICLR 2025. arXiv:2408.08435. https://arxiv.org/abs/2408.08435. Code: https://github.com/ShengranHu/ADAS
- Jiayi Zhang, Jinyu Xiang, Zhaoyang Yu, et al. "AFlow: Automating Agentic Workflow Generation". ICLR 2025. arXiv:2410.10762. https://arxiv.org/abs/2410.10762. Code: https://github.com/FoundationAgents/AFlow
- Guibin Zhang, Luyang Niu, Junfeng Fang, Kun Wang, Lei Bai, Xiang Wang. "Multi-agent Architecture Search via Agentic Supernet". ICML 2025, PMLR 267:75834–75852. arXiv:2502.04180. https://arxiv.org/abs/2502.04180. Code: https://github.com/bingreeky/MaAS
- Batu El, Mert Yuksekgonul, James Zou. "Inefficiencies of Meta Agents for Agent Design". Findings of EMNLP 2025. arXiv:2510.06711. https://arxiv.org/abs/2510.06711
- Barret Zoph, Quoc V. Le. "Neural Architecture Search with Reinforcement Learning". 2016. arXiv:1611.01578. https://arxiv.org/abs/1611.01578
- Esteban Real, Alok Aggarwal, Yanping Huang, Quoc V Le. "Regularized Evolution for Image Classifier Architecture Search". AAAI 2019. arXiv:1802.01548. https://arxiv.org/abs/1802.01548
- Esteban Real, Chen Liang, David R. So, Quoc V. Le. "AutoML-Zero: Evolving Machine Learning Algorithms From Scratch". ICML 2020. arXiv:2003.03384. https://arxiv.org/abs/2003.03384
- Max Jaderberg, Valentin Dalibard, Simon Osindero, et al. "Population Based Training of Neural Networks". 2017. arXiv:1711.09846. https://arxiv.org/abs/1711.09846
- James Bergstra, Yoshua Bengio. "Random Search for Hyper-Parameter Optimization". Journal of Machine Learning Research 13: 281–305, 2012. https://www.jmlr.org/papers/v13/bergstra12a.html
- Liam Li, Ameet Talwalkar. "Random Search and Reproducibility for Neural Architecture Search". UAI 2019. arXiv:1902.07638. https://arxiv.org/abs/1902.07638
- Kaicheng Yu, Christian Sciuto, Martin Jaggi, Claudiu Musat, Mathieu Salzmann. "Evaluating the Search Phase of Neural Architecture Search". ICLR 2020. arXiv:1902.08142. https://arxiv.org/abs/1902.08142
- Jenny Zhang, Shengran Hu, Cong Lu, Robert Lange, Jeff Clune. "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents". ICLR 2026. arXiv:2505.22954. https://arxiv.org/abs/2505.22954
- Xunjian Yin, Xinyi Wang, Liangming Pan, Li Lin, Xiaojun Wan, William Yang Wang. "Gödel Agent: A Self-Referential Agent Framework for Recursively Self-Improvement". ACL 2025. arXiv:2410.04444. https://aclanthology.org/2025.acl-long.1354
