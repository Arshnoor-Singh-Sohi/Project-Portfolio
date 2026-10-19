---
title: "Glossary"
order: 2
summary: "Every term of the course, 743 in all, with a plain meaning and the lesson where it first appears."
---

Each term links to the lesson that introduces it. The meaning here is the short form. The lesson gives the full explanation, an example and the limits.

Terms are in alphabetical order. A term that several lessons define appears once, with the first lesson in the course order.

At the end of the page, two short tables explain the numbering schemes of the course and the benchmarks that the papers use.

## Terms

| Term | Plain meaning | First seen |
|---|---|---|
| 2 SE rule | Accept a child only if its mean gain is larger than two standard errors. | [Part 9 P6](/notes/ai/recursive-self-improvement/09-build-it/p6-a-validation-gate) |
| 95% confidence interval | A range built so that, over many repeats, it contains the true value 95% of the time. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| 95% interval | A range around a score, usually the score ± 1.96 SE. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| ablation | An experiment that removes one part to measure what that part adds. | [Part 6: Voyager](/notes/ai/recursive-self-improvement/06-research-systems/p03-voyager) |
| abort option | A tool that lets an agent stop and ask a human, instead of passing a task by force. | [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) |
| absolute change | The difference between two scores, in percentage points. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| abstract syntax tree (AST) | A tree that represents the structure of a program. Tools use it to find functions and classes. | [Part 6: SICA, a Self-Improving Coding Agent](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent) |
| acceptance rule | The rule that decides if a candidate replaces or joins the current versions. | [Part 3 L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components) |
| action | One thing that the agent does that can change the environment or give it information. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| actor | The Reflexion role that produces text and actions. | [Part 6: Self-Refine and Reflexion](/notes/ai/recursive-self-improvement/06-research-systems/p02-self-refine-and-reflexion) |
| adaptive overfitting | Overfitting that comes from reusing the same holdout set for many choices. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| ADAS | Automated Design of Agentic Systems: the research area of making agent designs automatically. | [Part 6: ADAS and Meta Agent Search](/notes/ai/recursive-self-improvement/06-research-systems/p07-adas-meta-agent-search) |
| adversarial Goodhart | An agent with different goals deliberately breaks the link between proxy and goal. | [Part 8 L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability) |
| agent | A program that observes, decides and acts in a loop to reach a goal. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| agent design | One Python function `forward(self, taskInfo)` that solves a task by calling LLM sub-agents. | [Part 7 L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code) |
| agent improvement | A change to the scaffold, memory or tools of an agent, with the model unchanged. | [Part 10 L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories) |
| agentic system | An agent design: its prompts, model calls, control flow and tools. | [Part 5 L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search) |
| agentic tree search | A search in which an agent grows a tree of experiment attempts and expands the promising ones. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| AI control | Safety measures that work even if the strong model tries to cause harm. | [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) |
| AI research and development (AI R&D) | The work of building better AI systems: ideas, experiments, engineering and training. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| AI-generating algorithm (AI-GA) | Clune's term for an algorithm that itself learns how to produce general AI. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| AL0 to AL5 | A scale of AI automation of work. AL5 means fully autonomous, with no human in the loop. | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| alignment faking | A model behaves as if aligned when it believes it is being trained or watched, and differently otherwise. | [Part 8 L5](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift) |
| alignment tax | Loss of performance on some tasks that comes with training for another goal. | [Part 8 L5](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift) |
| anchor | A fixed evaluator or task set outside the editable part of the system. | [Part 10 L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators) |
| architecture | The structure of a neural network: its layers and their connections. | [Part 5 L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search) |
| archive | The stored set of kept versions, with their scores, from which later parents are chosen. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| argmax | The input at which a function has its largest value. $\max$ gives the value. $\operatorname{argmax}$ gives the input. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| artifact | Extra output of an evaluation, such as an error message, that later prompts can show to the model. | [Part 7 L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code) |
| asynchronous overseer | A language model that runs at the same time as the agent and watches it for loops or drift from the task. | [Part 6: SICA, a Self-Improving Coding Agent](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent) |
| attempt log | The record of every candidate and its result, accepted or rejected. | [Part 3 L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components) |
| audit budget | The fraction of outputs that trusted, high-quality human labor can review. | [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) |
| auditability | How easily a person can read and check what a change did. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| Automated Design of Agentic Systems (ADAS) | The research area, and the repository, about letting a model design agents as code. | [Part 7 L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code) |
| automated optimization | A search for better versions by a fixed procedure outside the system, such as random search or AutoML. | [Part 10 L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories) |
| automated research pipeline | A system that runs the steps of a research project in sequence: idea, experiments, paper, review. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| automated reviewer | A language model that reviews a paper and recommends accept or reject. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| automatic curriculum | A component that chooses the next task for the agent. | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| automation level | A step on the scale AL0 (no AI involvement) to AL5 (fully autonomous, no human in the loop). | [Part 10 L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories) |
| automation level (AL0 to AL5) | A scale from no AI involvement (AL0) to fully autonomous work with no human in the loop (AL5). | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| AutoML | Automated machine learning: search over models, settings or architectures by a program. | [Part 10 L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories) |
| AutoML (automated machine learning) | Methods that automate design choices in machine learning, such as hyperparameters or architectures. | [Part 5 L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search) |
| autonomy level | How much of a process runs without a human decision. | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| axiom system | The fixed set of starting statements from which proofs are built. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| balanced accuracy | The average of the accuracy on good papers and the accuracy on bad papers. It is fair when the two groups differ in size. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| base agent | The current version of the agent, from which the next candidate starts. It is the parent of that candidate. | [Part 3 L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components) |
| base case | The input on which a recursive function stops and returns without calling itself. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| base learner | The procedure that learns one task, for example gradient descent on one dataset. | [Part 5 L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver) |
| baseline | The version that you compare against, measured in the same way. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| basic checks | Cheap tests that a candidate works at all: the change applies, the program imports, it produces output. | [Part 3 L2](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step) |
| beam search | A search that keeps only the best few partial solutions at each step and extends those. | [Part 7 L2](/notes/ai/recursive-self-improvement/07-implementations/l2-stop-in-code) |
| behavior descriptor | A function that maps a candidate to a few numbers that describe how it behaves. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| benchmark | A fixed set of tasks with a fixed scoring rule. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| best fit | The strategy that prefers the bin in which the item leaves the least free space. | [Part 9 P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) |
| best-belief agent | The agent that HGM returns at the end, chosen by its record of successes and failures. | [Part 6: The Huxley-Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine) |
| best-of-K | Make K samples of one instance and keep the one with the fewest bins. | [Part 9 P2](/notes/ai/recursive-self-improvement/09-build-it/p2-many-candidates-one-answer) |
| best-of-n | Generate n candidate answers and keep the best one by some rule. | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| best-shot prompting | A prompt that shows a few good programs, sorted by score, and asks for a better one. | [Part 6: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) |
| Beta distribution | A probability distribution over a rate between 0 and 1. Its shape comes from counts of successes and failures. | [Part 6: The Huxley-Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine) |
| bilevel optimization | An outer optimization whose objective depends on the result of an inner optimization, for example training on one task. | [Part 4 L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver) |
| bin | A container with a capacity of 100. | [Part 9 P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) |
| binary tournament | Pick two candidates at random, and let the better one reproduce. | [Part 5 L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization) |
| BIOPS | Bias-Optimal Proof Search: the first proof searcher of a Gödel machine. | [Part 6: Good's intelligence explosion and the Gödel machine](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine) |
| black-box optimization | Optimization in which you can only evaluate options and get scores, with no slope and no formula. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| bloat | Growth in program size without a gain in fitness. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| Bonferroni correction | Divide the significance level by the number of tests. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| bootstrap confidence interval | An uncertainty range computed by resampling the evaluated questions many times. | [Part 5 L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search) |
| bootstrapping (a compiler) | Using one version of a compiler to compile the source of its next version. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| bootstrapping a compiler | Using an existing version of a compiler to compile the source code of its next version. | [Part 2 L4](/notes/ai/recursive-self-improvement/02-core-idea/l4-examples-and-non-examples) |
| bootstrapping (DSPy) | Running the program on training inputs and keeping the traces of successful runs as demonstrations. | [Part 5 L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization) |
| bounded self-refinement | Improvement against a fixed, external evaluator (Chen et al., 2026). | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| bounded sequence | A sequence whose values stay below some fixed number. | [Part 4 L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules) |
| brevity bias | The tendency of prompt optimization to prefer short, generic instructions. | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| budget | The limit on cost, time or model calls for a run. | [Part 3 L2](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step) |
| budget $B$ | The number of proposals that one run of the improver may make. | [Part 9 P8](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver) |
| BUG? note | An observation from reading that some code looks unintended. A run did not confirm it. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| call graph | The tree of which agent called which sub-agent, with their events. | [Part 6: SICA, a Self-Improving Coding Agent](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent) |
| call stack | The list of function calls that have started and not yet returned. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| canary task | A task that cannot be solved honestly. Any pass shows a shortcut. | [Part 9 P9](/notes/ai/recursive-self-improvement/09-build-it/p9-from-toy-to-language-model) |
| candidate | A proposed new version that is not yet accepted. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| cap set | A set of points in an $n$-dimensional grid with 3 values per coordinate, in which no three points lie on a line. | [Part 6: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) |
| capability | How well a system performs on the full range of real tasks and conditions, including tasks that no benchmark contains. | [Part 8 L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability) |
| capability threshold | A level of capability at which a lab commits to stronger safety measures. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| cascade evaluation | Scoring in stages, where a candidate runs a later, more costly stage only if it passes a threshold. | [Part 7 L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code) |
| catastrophic forgetting | Training on a new task overwrites what a model learned for an old task. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| causal Goodhart | An action changes the causal link, so the proxy no longer depends on the goal. | [Part 8 L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability) |
| ceiling | The value $I_{\max}$ that a saturating score approaches but does not pass. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| central limit theorem | The rule that a mean of many independent values is close to normally distributed. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| chain of thought (CoT) | Written reasoning steps that a model produces before its final answer. | [Part 5 L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement) |
| chain-of-thought (CoT) | A prompt that makes the model write its reasoning step by step before the answer. | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| change | The difference between a candidate and its parent version. | [Part 3 L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components) |
| cheating packer | A candidate that scores well on the naive score with an invalid answer. | [Part 9 P3](/notes/ai/recursive-self-improvement/09-build-it/p3-an-evaluator-with-explicit-tests) |
| checked score | The excess for a valid packing, and infinity for an invalid one. | [Part 9 P3](/notes/ai/recursive-self-improvement/09-build-it/p3-an-evaluator-with-explicit-tests) |
| checkpoint | A saved copy of model weights or of a system state, used to restore it later. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| children count $n_i$ | The number of archive members whose parent is member $i$. | [Part 9 P7](/notes/ai/recursive-self-improvement/09-build-it/p7-regression-tests-and-an-archive) |
| churn | Many accepted changes, a score that moves up and down, and real capability that stays flat. | [Part 8 L5](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift) |
| clade | A version together with all its descendants in the archive tree. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| clade metaproductivity (CMP) | The expected quality of the best final version that will come from a version's clade. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| clade-metaproductivity (CMP) | The expected quality of the best final agent that will come from an agent's clade. | [Part 6: The Huxley-Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine) |
| closed loop | A system that measures the result and uses it to choose the next action. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| clustered standard error | A standard error that accounts for groups of related tasks. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| clustered tasks | Tasks that share a source, such as several questions about one passage. They are not independent. | [Part 8 L3](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures) |
| code reading | A fact taken from reading the repository at the pinned commit, without running it. Notes mark such facts "(code reading)". | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| code-versus-paper difference | A place where the released code does something other than what the paper describes. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| coding agent | An agent that solves programming tasks with tools that read, run and change code. | [Part 6: The Darwin Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p10-darwin-godel-machine) |
| codomain | The set $Y$ in which the outputs of a function lie. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| command-line interface (CLI) | The arguments that a program accepts when you start it from a terminal. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| commit | One saved state of a repository. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| commit hash | The 40-character hexadecimal name of a commit, for example `a565fd2d…`. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| compiled child | The code's word for a child that produced a score, at least one non-empty benchmark patch, and enough submissions. | [Part 7 L4](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code) |
| compounding error | An error that passes from one version to all its descendants and adds to later errors. | [Part 8 L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) |
| confidence interval | A range that, under assumptions, covers the true mean with a stated probability, here 95%. | [Part 7 L5](/notes/ai/recursive-self-improvement/07-implementations/l5-sica-and-godel-agent-in-code) |
| consistent | An axiom system is consistent if it cannot prove a statement and its opposite. | [Part 6: Good's intelligence explosion and the Gödel machine](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine) |
| constraint | A rule that an option must obey, for example "baking time at most 60 minutes". | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| container | A sandbox made with a tool such as Docker. It holds a copy of files and runs programs on them. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| contamination | Benchmark tasks or their solutions are in the data that the model learned from. | [Part 8 L3](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures) |
| context | The text and data that the proposer reads before it proposes a change. | [Part 3 L2](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step) |
| context collapse | Loss of detail when a model rewrites its whole accumulated memory into a short summary. | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| context window | The largest number of tokens that a language model can read at one time. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| continuous space | A search space of real numbers, for example all weight vectors of a model. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| controller | In NAS, a model that outputs candidate architectures. | [Part 5 L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search) |
| cooling schedule | The rule that lowers the temperature over iterations. | [Part 4 L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules) |
| co-optimized evaluator | An evaluator that the improvement loop also changes. | [Part 10 L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators) |
| corrigibility | An agent "tolerates or assists many forms of outside correction". | [Part 8 L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) |
| cost | The work that a method uses. Here we count calls of the priority function. | [Part 9 P2](/notes/ai/recursive-self-improvement/09-build-it/p2-many-candidates-one-answer) |
| cost per task | The money spent per task, for example on model calls. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| cost-matched baseline | A simpler method that gets the same number of model calls as the method under test. | [Part 6: Self-Refine and Reflexion](/notes/ai/recursive-self-improvement/06-research-systems/p02-self-refine-and-reflexion) |
| CoT monitor | A second model that reads a transcript, including the reasoning, and flags bad behavior. | [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) |
| CoT monitoring | A second model reads the chain of thought (CoT), the written reasoning of an agent, and flags bad behavior. | [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) |
| covariance, correlation | Measures of how two random variables move together. Correlation is scaled to lie between −1 and 1. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| CPU-hour | One hour of work by one processor core, a measure of compute cost. | [Part 6: The Huxley-Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine) |
| critic | A component that finds problems in an output and describes them. | [Part 5 L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement) |
| cross-model transfer | Using a design found with one task model on a different task model. | [Part 5 L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search) |
| crossover | Bostrom's term: the point after which a system's own work drives most of its improvement. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| curator | The component that decides what enters, stays in and leaves the memory. | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| current strategy or implementation | The part of the base agent that the loop is allowed to change, in a concrete form: text, a program, or weights. | [Part 3 L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components) |
| Darwin Gödel Machine (DGM) | A system that keeps an archive of coding agents, picks parents, and lets each parent edit its own source, then benchmarks the result. | [Part 7 L4](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code) |
| data | The examples that a model learns from. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| dead code | Code that exists but that no run reaches, or whose result nothing uses. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| dead configuration | A setting that exists in the code but that nothing reads. | [Part 7 L7](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches) |
| debug retry | A follow-up call in which the meta agent sees an error message and tries to fix its code. | [Part 7 L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code) |
| deceptive objective | An objective whose rises point away from the best solution. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| default | The value that an argument or setting has when you do not give one. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| defense in depth | Several independent checks, so that one missing check does not open the whole system. | [Part 9 P3](/notes/ai/recursive-self-improvement/09-build-it/p3-an-evaluator-with-explicit-tests) |
| delay | The time between an action and the measurement of its effect. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| delta update | A small change to a few memory entries, instead of a full rewrite of the memory. | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| diagnosis | A short analysis of why a version failed, written to guide the next change. | [Part 3 L2](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step) |
| diagnosis step | A model call that reads one failure and proposes the next feature to build. | [Part 6: The Darwin Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p10-darwin-godel-machine) |
| differential equation | An equation for the rate of change of a quantity at each moment. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| diminishing returns | Each new unit of effort gives a smaller gain than the last. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| Direct Preference Optimization (DPO) | A training method that changes weights so that the model prefers chosen answers over rejected ones. | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| directional criterion | Zenil's term for an outside standard that gives a recursive loop a direction of improvement. | [Part 10 L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators) |
| discordant pair | A task that one version solves and the other does not. | [Part 10 L5](/notes/ai/recursive-self-improvement/10-advanced/l5-advanced-exercises) |
| discordant task | A task that one version solves and the other does not. | [Part 3 L2](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step) |
| discrete space | A search space whose versions can be listed one by one, for example all prompts. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| distribution shift | A change in the kind of tasks between two sets, which changes scores even without overfitting. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| Docker image, container | An image is a packaged file system with a program. A container is one running copy of an image. | [Part 7 L4](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code) |
| `.dockerignore` | A file that lists paths that Docker must not copy into an image when it builds it. | [Part 7 L4](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code) |
| domain | The set $X$ of allowed inputs of a function. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| doubling time | The time it takes for a quantity that grows exponentially to double. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| downstream task | A pair $(u, s)$: a utility and a starting solution that an improver should improve. | [Part 4 L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver) |
| edit distance | The number of single-character insertions, deletions or replacements that turn one text into another. | [Part 7 L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code) |
| edit weights | How often the improver tries each edit type: constant, operator, variable and grow. | [Part 9 P8](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver) |
| editable boundary | The line between the parts that the self-improving system may change and the parts that it must not reach. | [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) |
| editable improver | An improver whose own code is inside the part that the system can change. | [Part 7 L7](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches) |
| editable part | A part of the system that the improvement loop is allowed to change. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| effect size | The size of the gain that you want to detect, for example 5 percentage points. | [Part 10 L4](/notes/ai/recursive-self-improvement/10-advanced/l4-open-problems-and-how-to-read-new-work) |
| elite archive | OpenEvolve's set of up to 100 strong programs, used for most parent choices. | [Part 7 L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code) |
| elitism | Copy the best candidate unchanged into the next generation. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| embedding | A list of numbers that represents a text, so that similar texts get similar numbers. | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| embodied agent | An agent that acts through a body or avatar in a simulated or real environment. | [Part 6: Voyager](/notes/ai/recursive-self-improvement/06-research-systems/p03-voyager) |
| empirical validation | Checking a change by running it on tests or a benchmark, instead of proving it. | [Part 6: Good's intelligence explosion and the Gödel machine](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine) |
| entry point | The file and the function that start a run. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| environment | Everything outside the agent that the agent acts on and observes. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| episode | One complete run of an agent on one task, from start to stop. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| episodic memory | Notes that an agent stores after an attempt and reads in a later attempt. | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| epoch | One full pass over all training examples. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| equal-budget baseline | A simple method, such as random search or majority vote, given the same compute as the method under test. | [Part 5 L10](/notes/ai/recursive-self-improvement/05-approaches/l10-approaches-compared) |
| equal-compute baseline | A comparison method that uses the same number of model calls as the method under test. | [Part 5 L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement) |
| equal-compute comparison | A test that gives each method the same number of model calls or tokens. | [Part 5 L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement) |
| error | The difference between the set point and the measured value. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| estimate | A number computed from a sample that stands in for an unknown quantity. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| evaluation budget | The total time or money available for evaluating options. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| evaluation cascade | Staged evaluation: cheap tests first, expensive tests only for candidates that pass. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| evaluation environment | The files, programs and settings that compute the score of an agent's work. | [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) |
| evaluation noise | The spread of the scores of one version over repeated runs. | [Part 9 P6](/notes/ai/recursive-self-improvement/09-build-it/p6-a-validation-gate) |
| evaluation step | One run of one agent on one task, which gives one success or one failure. | [Part 6: The Huxley-Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine) |
| evaluator | The component that computes a score for a version or an output. | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| evaluator bottleneck | The limit that the quality of the evaluator puts on any improvement loop. | [Part 3 L4](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels) |
| evaluator ceiling | The point at which the evaluator cannot separate better versions from worse ones any more. | [Part 10 L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement) |
| evaluator exploitation | A gain in score that comes from the evaluator's errors, not from better work. | [Part 10 L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators) |
| Evolution Strategies (ES) | An evolutionary method that changes a model's weights by testing random small changes and moving toward the better ones. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| evolutionary search | Search that keeps a population of options, makes changed copies of good ones, and keeps the best. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| `EVOLVE-BLOCK` markers | Comment lines that mark the part of a program that should evolve. | [Part 7 L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code) |
| exact match | A scoring rule that checks if the answer equals the reference answer. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| example | One input, often with its correct output. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| excerpt | A short, exact copy of code, given with its file path and line range. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| excess | How far a packing is above $L_1$, as a fraction of $L_1$. Lower is better. | [Part 9 P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) |
| `exec` | A Python function that runs a string as Python code inside the current process. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| `exec` and `eval` | Python built-in functions that run a string as Python code. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| exhaustive search | Trying every option in the search space. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| expansion | One self-modification step that creates one new child agent. | [Part 6: The Huxley-Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine) |
| expected score | The average score of a version over the task distribution. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| expected utility of an improver | The average utility of the improver's outputs over the distribution of downstream tasks. | [Part 4 L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver) |
| experiment template | Starting code, written by humans, that the system changes to run its experiments. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| exploitation | Choosing options that are already known to be good. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| exploitation of an evaluation environment | Passing an evaluation by changing or tricking the evaluation, not by solving the task. | [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) |
| exploration | Trying options whose value is still unknown. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| exponential growth | The score rises by the same percentage in each iteration. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| external budget | A limit on time, money or resources that the host or provider enforces, not the agent's own code. | [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) |
| external feedback | Feedback from a source outside the model, for example a test result, a search result or an interpreter error. | [Part 5 L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement) |
| external optimization | Improvement in which the proposer of changes is outside the improved system. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| extremal Goodhart | At extreme scores, the system reaches a region where the old link between proxy and goal no longer holds. | [Part 8 L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability) |
| F1 | A score for text answers that counts the overlap of words between the answer and the reference. | [Part 6: ADAS and Meta Agent Search](/notes/ai/recursive-self-improvement/06-research-systems/p07-adas-meta-agent-search) |
| false positive (of a test) | A wrong program that passes the test. | [Part 5 L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement) |
| false positive (of a test set) | Wrong code that passes its own tests. | [Part 6: Self-Refine and Reflexion](/notes/ai/recursive-self-improvement/06-research-systems/p02-self-refine-and-reflexion) |
| false positive rate | The share of papers that should be rejected but that the reviewer accepts. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| false-negative rate $\beta$ | The chance that the evaluator fails an output that is right. | [Part 10 L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators) |
| false-positive rate $\alpha$ | The chance that the evaluator passes an output that is wrong. | [Part 10 L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators) |
| family guard | The part of the regression check that rejects a change when one family's mean excess gets worse by more than a tolerance. | [Part 9 P7](/notes/ai/recursive-self-improvement/09-build-it/p7-regression-tests-and-an-archive) |
| family of methods | A group of methods that change the same kind of thing in a similar way. | [Part 5 L10](/notes/ai/recursive-self-improvement/05-approaches/l10-approaches-compared) |
| feasible option | An option that obeys every constraint. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| feasible set | The versions in $S$ that meet every constraint. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| feature | A number that describes one property of a bin for the arriving item, for example the gap that stays after the item. | [Part 9 P4](/notes/ai/recursive-self-improvement/09-build-it/p4-propose-and-test-strategy-changes) |
| feature dimension | A property that places a program in the grid, for example code length ("complexity") or difference from others ("diversity"). | [Part 7 L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code) |
| feedback | A measured result that changes the next action. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| feedback loop | A cycle in which an action changes a measured quantity, and the measurement changes the next action. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| feedback signal | The concrete information that comes back to the agent, for example a test result. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| few-shot demonstration | A solved example placed in the prompt. | [Part 5 L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization) |
| few-shot prompt | A prompt that contains a few worked examples of the wanted behavior. | [Part 6: Self-Refine and Reflexion](/notes/ai/recursive-self-improvement/06-research-systems/p02-self-refine-and-reflexion) |
| fine-tuning | Further training of a pretrained model on a smaller set of chosen examples. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| finite-time blow-up | A solution that becomes infinite at a finite time. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| first fit | The strategy that gives every bin the same priority. The tie rule then picks the first bin with room. | [Part 9 P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) |
| first fit and best fit | Two standard rules: put the item in the first bin with room, or in the bin with the least room left that still fits. | [Part 6: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) |
| first-order MAML | A cheaper MAML that drops the second derivatives in the outer gradient. | [Part 4 L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver) |
| fitness | The score that an evaluator gives to one candidate in an evolutionary method. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| fixed external improver | An improver that is outside the improved system and never changes. | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| fixed point | An input that a function maps to itself. Here: an improver that, run on itself, returns no better improver. | [Part 5 L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver) |
| fixed proposer | A part of the loop that suggests changes and that the loop itself can never change. | [Part 7 L7](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches) |
| formal axiom system | A fixed list of starting statements (axioms) and rules. A proof uses only these. | [Part 6: Good's intelligence explosion and the Gödel machine](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine) |
| `forward()` function | In ADAS, the Python function that defines one agent: it takes a task and returns an answer. | [Part 5 L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search) |
| foundation model | A large pretrained model, such as an LLM, that other systems build on. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| foundation model (FM) | A large pretrained model, such as an LLM, that other systems use as a part. | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| free space | The capacity of a bin minus the sizes already in it. | [Part 9 P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) |
| fresh seeds | Random seeds that the meta-search did not use. A score on fresh seeds checks the winner's curse. | [Part 9 P8](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver) |
| frozen | Not changed. A frozen model keeps the same weights for the whole experiment. | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| frozen core | The parts of a system that no iteration may change, such as the evaluator and the outer loop. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| frozen evaluator | An evaluator that the improving system cannot read, edit or call except through a fixed interface. | [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) |
| frozen model | A model whose weights do not change during a run of a system. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| function | A rule that gives exactly one output for each allowed input. Notation: $f: X \to Y$. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| function (mathematics) | A rule that gives exactly one output for each input. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| gain $d_i$ | The parent's excess minus the child's excess on instance $i$. Positive means the child is better. | [Part 9 P6](/notes/ai/recursive-self-improvement/09-build-it/p6-a-validation-gate) |
| Gödel Agent | An agent in one live Python process that reads and replaces its own functions with tool calls. | [Part 7 L5](/notes/ai/recursive-self-improvement/07-implementations/l5-sica-and-godel-agent-in-code) |
| Gödel machine | Schmidhuber's design for a program that rewrites any part of itself, but only after it proves that the rewrite is useful. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| Gödel-base | The constrained version of Gödel Agent, in which GPT-3.5 runs every policy. | [Part 6: Gödel Agent](/notes/ai/recursive-self-improvement/06-research-systems/p08-godel-agent) |
| Gödel-free | The version without constraints, which may call stronger models. | [Part 6: Gödel Agent](/notes/ai/recursive-self-improvement/06-research-systems/p08-godel-agent) |
| generalization | Performing well on inputs that the model has not seen. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| generalization gap | The difference between the score on the selection set and the score on a held-out test set. | [Part 5 L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization) |
| generation | One pass of an evolutionary method: select parents, make new candidates, score them, replace the population. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| generation–verification gap | How much better a model can check answers than produce them. | [Part 10 L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement) |
| genetic algorithm | A search that keeps a population and makes new members by copying, mutating and mixing old ones. | [Part 6: Promptbreeder](/notes/ai/recursive-self-improvement/06-research-systems/p04-promptbreeder) |
| genetic algorithm (GA) | An evolutionary search method with selection, crossover and mutation over a population of encoded candidates. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| global optimum | The best feasible version in the whole search space. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| globally optimal | Schmidhuber's term: a proven rewrite beats waiting for any other rewrite that the machine could find later. | [Part 6: Good's intelligence explosion and the Gödel machine](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine) |
| goal | The condition that the agent tries to reach, for example "all tests pass". | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| goal drift | The goal that a system actually pursues changes over time. | [Part 8 L5](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift) |
| goal-content integrity | An agent's reason to prevent changes to its final goals. The term is Bostrom's. | [Part 8 L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) |
| gold measure | A trusted measurement that the improvement process never uses to choose versions. It checks the proxy. | [Part 8 L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability) |
| Goodhart's law | The observation that a measure tends to stop tracking its goal once people or optimizers push on the measure. | [Part 8 L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability) |
| gradient | The slope of the objective: how fast it changes when a variable changes. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| gradient descent | Repeated small updates of the weights against the gradient, to lower the loss. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| greedy decoding | Generation that always takes the most likely next token, so one prompt gives one fixed answer. | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| greedy hill climbing | Accept a candidate only if its measured score is higher than the current one. | [Part 4 L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules) |
| greedy line | A search that always changes its best version and keeps only better children. | [Part 9 P7](/notes/ai/recursive-self-improvement/09-build-it/p7-regression-tests-and-an-archive) |
| greedy single lineage | A loop that keeps one current version and builds every new candidate on it. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| ground truth (GT) label | The true answer or true success signal for a task. | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| GSM8K | A benchmark of grade-school math word problems with numeric answers. | [Part 7 L5](/notes/ai/recursive-self-improvement/07-implementations/l5-sica-and-godel-agent-in-code) |
| guarded run | Running a candidate so that every error becomes a rejection reason instead of a crash of the loop. | [Part 9 P5](/notes/ai/recursive-self-improvement/09-build-it/p5-an-agent-that-edits-a-program) |
| hard cap | A limit that is enforced outside the system, so the system cannot change it. | [Part 8 L5](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift) |
| headroom | The remaining distance to the ceiling, $I_{\max} - I_t$. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| held | An accepted change holds if the child is better than the parent on the test set. | [Part 9 P6](/notes/ai/recursive-self-improvement/09-build-it/p6-a-validation-gate) |
| held-out evaluation | A test on tasks that the improvement loop never used for selection. | [Part 5 L10](/notes/ai/recursive-self-improvement/05-approaches/l10-approaches-compared) |
| held-out family | A task family that the meta-search never saw. | [Part 9 P8](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver) |
| held-out re-test | A second evaluation of a winning candidate on tasks that played no part in choosing it. | [Part 7 L7](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches) |
| held-out task family | A group of tasks of a kind that the loop never used for selection. | [Part 10 L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators) |
| held-out tasks | Tasks that no decision during improvement ever used. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| held-out test set | Tasks that the loop never uses to make a decision. They are used once, for the final report. | [Part 3 L2](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step) |
| hidden test | A test that the agent never sees. It runs after submission. | [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) |
| hidden tests | Tests that the benchmark keeps and that the agent never sees. | [Part 7 L7](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches) |
| hill climbing | Local search that always moves to a better neighbor and stops when none is better. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| holdout reuse | Using the same held-out tasks again and again for decisions. | [Part 8 L3](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures) |
| holdout set | Tasks kept apart from all choices, to check a result at the end. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| hyper-mutation prompt | In Promptbreeder, the fixed instruction that the system uses to change its mutation-prompts. | [Part 3 L4](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels) |
| hyperparameter | A setting that training does not learn, for example the learning rate. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| IFT and EFT data | Seed examples: instruction-following examples (IFT) and examples of how to judge a response (EFT). | [Part 6: Self-Rewarding Language Models](/notes/ai/recursive-self-improvement/06-research-systems/p06-self-rewarding-language-models) |
| impossible task | A task whose tests contradict its specification. Any pass must come from a shortcut. | [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) |
| improvement mechanism | The parts that propose, evaluate and accept changes. Together they form the improver. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| improver | The procedure that takes a version and returns a candidate that it expects to be better. | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| in-context change | A change that exists only in the text the model sees during one episode. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| increment, gain | The change of the score in one iteration: $I_{t+1} - I_t$. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| independence | Two roles are independent when one role's errors do not predict the other's errors. | [Part 5 L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement) |
| independent evaluator | An evaluator with different errors from the first one, for example a different model family or a human. | [Part 10 L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators) |
| indirect loop | A loop in which a system's output helps to build its next version only through other processes, here human-run model training. | [Part 6: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) |
| indirect RSI | Yampolskiy's term for improvement loops that pass through other agents, for example human and AI teams. | [Part 2 L4](/notes/ai/recursive-self-improvement/02-core-idea/l4-examples-and-non-examples) |
| in-distribution | New tasks of the same kind as the tasks used during improvement. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| inference | Using a trained model to compute outputs. Inference does not change the weights. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| infinite regress | The chain "who improves the improver of the improver?" that never ends by itself. | [Part 5 L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver) |
| `Info` | A named tuple with four fields, `name`, `author`, `content` and `iteration_idx`, that carries messages between sub-agents. | [Part 7 L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code) |
| inner loop | The base learning on one task. | [Part 5 L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver) |
| inoculation prompting | A training prompt that says hacking is acceptable in this context, to stop hacking from spreading into other bad behavior. | [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) |
| input, output | The data that a program receives, and the data that it returns. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| insight | A short rule in plain language, extracted from many trajectories. | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| inspiration | A program shown in the prompt as an example, besides the parent. | [Part 7 L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code) |
| instance | One task: one list of item sizes in arrival order. | [Part 9 P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) |
| instruction | The part of a prompt that tells the model what to do. | [Part 5 L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization) |
| in-task memory | Information that the agent holds only during one episode, for example its context window. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| intelligence explosion | I. J. Good's term: better machines design still better machines, so intelligence grows very fast. | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| internal tests | Tests that the agent writes itself and may see. | [Part 7 L7](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches) |
| intrinsic feedback | Feedback that the model writes about its own output, with no outside source of truth. | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| intrinsic self-correction | Self-correction with no outside help. The model alone finds the error and decides when to stop. | [Part 5 L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement) |
| IO prompting | The simplest baseline: give the LLM the question and take its answer. | [Part 6: ADAS and Meta Agent Search](/notes/ai/recursive-self-improvement/06-research-systems/p07-adas-meta-agent-search) |
| island | A separate part of an archive that evolves on its own most of the time. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| item | One object to pack. Here it is an integer size from 1 to 100. | [Part 9 P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) |
| iteration | One pass through the improvement loop. | [Part 3 L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components) |
| iterative prompting | Write code, run it, return feedback to the LLM, and let it rewrite the code. | [Part 6: Voyager](/notes/ai/recursive-self-improvement/06-research-systems/p03-voyager) |
| `k` | The number of candidates per iteration. | [Part 9 P8](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver) |
| kernel | A small, heavily used routine that runs on an accelerator chip, for example one step of a model's computation. | [Part 6: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) |
| Kolmogorov complexity | The length of the shortest program that outputs an object. It measures information content. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| label | The correct output of an example. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| ladder level | The position of a method on the seven-level ladder of Part 2, from Level 0 (repeat) to Level 6 (build a successor). | [Part 5 L10](/notes/ai/recursive-self-improvement/05-approaches/l10-approaches-compared) |
| landscape | A picture of the objective as height over the search space. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| language model | A model that predicts the next token of text. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| language model (LM) | A model that predicts the next token of text. STOP treats it as a black box that maps a text to a text. | [Part 6: STOP, the Self-Taught Optimizer](/notes/ai/recursive-self-improvement/06-research-systems/p05-stop-self-taught-optimizer) |
| language-model budget | The maximum number of language-model calls that one object may make. | [Part 7 L2](/notes/ai/recursive-self-improvement/07-implementations/l2-stop-in-code) |
| language-model proposer | A proposer that asks a language model to write the candidate. | [Part 9 P9](/notes/ai/recursive-self-improvement/09-build-it/p9-from-toy-to-language-model) |
| large language model (LLM) | A very large language model, with billions of weights. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| large language model (LLM) ensemble | Several language models, one chosen at random by weight for each call. | [Part 7 L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code) |
| Löbian obstacle | A proof-based agent cannot trust a successor that uses the same proof system. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| Löb's theorem | A result in logic: if a theory proves "if I prove $\varphi$, then $\varphi$ is true", then it already proves $\varphi$. | [Part 6: Good's intelligence explosion and the Gödel machine](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine) |
| leakage | Any route by which the answer reaches the system before or during evaluation. Contamination is one kind. | [Part 8 L3](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures) |
| learned optimizer | A neural network that outputs the weight update, in place of a hand-written rule. | [Part 5 L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver) |
| learner | The procedure that updates the policy from feedback. It is an improver. | [Part 3 L4](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels) |
| learning parity with noise (LPN) | A puzzle: find a hidden rule (an XOR of some input bits) from examples whose labels are sometimes flipped. The XOR of some bits is 1 if an odd number of them are 1, and 0 otherwise. | [Part 6: STOP, the Self-Taught Optimizer](/notes/ai/recursive-self-improvement/06-research-systems/p05-stop-self-taught-optimizer) |
| learning rate | The number that sets the size of each gradient descent update. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| least privilege | Give a process only the access that its task needs. | [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) |
| length-controlled (LC) win rate | A win rate that is adjusted so that longer answers do not win only because they are longer. | [Part 6: Self-Rewarding Language Models](/notes/ai/recursive-self-improvement/06-research-systems/p06-self-rewarding-language-models) |
| license | The legal text that says what you may do with the code. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| lineage | The chain of versions from the initial version to a given version. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| linear growth | The score rises by the same amount in each iteration. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| LiveCodeBench | A benchmark of programming problems that keeps adding new problems over time. | [Part 6: SICA, a Self-Improving Coding Agent](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent) |
| LLM agent | An agent whose policy uses a large language model (LLM) inside a scaffold. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| LLM judge | A language model that is asked to score an output. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| `LLMAgentBase` | The framework class that turns one LLM call into a sub-agent with named output fields. | [Part 7 L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code) |
| local optimum | An option that is better than all its neighbors, but not the best overall. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| local search | Moving from option to nearby option, guided by the objective. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| loop | Repeating a block of code with `for` or `while`, without self-calls. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| loop gain | The number by which one cycle multiplies a change. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| loss | A number that says how wrong a model is on some examples. Lower is better. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| loss function | A function that says how wrong a model is on some examples. Lower is better. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| lower bound $L_1$ | A number of bins that no packing can beat, computed from the total size. | [Part 9 P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) |
| low-rank adaptation (LoRA) | A cheap fine-tuning method that trains a small set of added weights and leaves the original weights unchanged. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| main agent | The top agent in SICA. It routes work to sub-agents and combines their results. | [Part 6: SICA, a Self-Improving Coding Agent](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent) |
| main loop | The loop that repeats the steps propose, evaluate, store and select. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| MAML | Model-Agnostic Meta-Learning: learn a starting point of the weights from which a few gradient updates adapt well to a new task. | [Part 4 L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver) |
| MAP-Elites | A quality-diversity method that keeps one elite per cell of a grid of behavior descriptors. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| maximize, minimize | Make the objective as large as possible, or as small as possible. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| McNemar test | A test of a paired pass or fail comparison that uses only the discordant pairs. | [Part 10 L5](/notes/ai/recursive-self-improvement/10-advanced/l5-advanced-exercises) |
| measured score | The score on the tasks and runs that you actually used. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| measurement procedure | The exact tasks, scoring rule, settings and number of runs used to compute a score. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| memory | State that an agent keeps between tasks or episodes. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| meta agent | An agent whose job is to design other agents. | [Part 5 L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search) |
| Meta Agent Search | The paper's algorithm for ADAS. | [Part 6: ADAS and Meta Agent Search](/notes/ai/recursive-self-improvement/06-research-systems/p07-adas-meta-agent-search) |
| meta level | The level that changes the solver of tasks. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| meta-agent | The agent that changes another agent's code. In ADAS it is a separate, fixed agent. | [Part 6: SICA, a Self-Improving Coding Agent](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent) |
| meta-improvement iteration | One pass in which an agent changes the code base to make a new agent version. | [Part 6: SICA, a Self-Improving Coding Agent](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent) |
| meta-improvement step | SICA's step in which an agent runs on agent code to improve it, instead of on a benchmark task. | [Part 7 L5](/notes/ai/recursive-self-improvement/07-implementations/l5-sica-and-godel-agent-in-code) |
| meta-improver | The procedure that changes the settings. | [Part 9 P8](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver) |
| meta-judge | The Meta-Rewarding role that compares two judgments and says which one is better. | [Part 6: Self-Rewarding Language Models](/notes/ai/recursive-self-improvement/06-research-systems/p06-self-rewarding-language-models) |
| meta-knowledge | What the meta level learns about how to learn, for example a start point, a step size or an update rule. | [Part 5 L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver) |
| meta-knowledge $\omega$ | What the outer problem chooses: an initialization, a learning rate, an improver. | [Part 4 L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver) |
| meta-learning | Learning to learn: a learning process that improves another learning process. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| meta-level | One level above a learner. Level 1 is the solver, level 2 improves the solver, level 3 improves that improver. | [Part 5 L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver) |
| meta-level change | A change to the improver, the evaluator, the acceptance rule or the controls, not to the task-solving part. | [Part 8 L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) |
| meta-meta level | The level that changes the procedure that changes the solver. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| meta-objective | The quantity the outer loop tries to make small or large, measured after inner learning. | [Part 5 L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver) |
| metaproductivity | A version's potential to lead to useful further improvements. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| metaproductivity–performance mismatch | The finding that an agent's own score is a poor guide to how good its descendants will be. | [Part 6: The Huxley-Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine) |
| meta-prompt | A prompt that asks a language model to propose a better solution. It usually includes past solutions and their scores. | [Part 4 L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules) |
| meta-utility | A score for an improver: the average score of the solutions that the improver produces on several tasks (STOP). | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| meta-utility $\hat u(\theta)$ | The mean gain that the improver with settings $\theta$ produces within the budget, over training families and seeds. | [Part 9 P8](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver) |
| migration | Copying good candidates from one island to another. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| Minecraft | An open-world video game. The player gathers resources, crafts tools and explores. | [Part 6: Voyager](/notes/ai/recursive-self-improvement/06-research-systems/p03-voyager) |
| Mineflayer | A JavaScript interface for programs that control a Minecraft player. | [Part 6: Voyager](/notes/ai/recursive-self-improvement/06-research-systems/p03-voyager) |
| minibatch | A small random group of training examples used for one update. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| minimum detectable effect | The smallest real gain that a test can reliably detect with a given number of tasks. | [Part 8 L5](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift) |
| mixing coefficient | The number that sets how much one objective counts in a weighted sum. Papers often call it a "weight", but in this course "weights" means the learned numbers of a model. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| MLE-bench | A benchmark of 75 Kaggle machine learning competitions. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| model | A function with learned numbers (weights) that maps an input to an output. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| model collapse | Loss of quality when models are trained, generation after generation, on data made by earlier models. | [Part 2 L4](/notes/ai/recursive-self-improvement/02-core-idea/l4-examples-and-non-examples) |
| model improvement | A change to the weights of a model, for example by fine-tuning. | [Part 10 L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories) |
| monkey patching | Replacing a function or a method of a running program while it runs. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| monotone sequence | A sequence that never goes down (or never goes up). | [Part 4 L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules) |
| Monte Carlo tree search (MCTS) | A search that grows a tree of options. It picks promising branches, tries them, and records the results back up the tree. | [Part 5 L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search) |
| multi-agent debate | Several model instances answer, read each other's answers, and revise. | [Part 5 L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement) |
| Multilingual Grade School Math (MGSM) | A benchmark of grade-school math word problems in 11 languages. | [Part 7 L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code) |
| multiple comparisons | Many tests at once, which raise the chance of at least one false positive. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| mutation | A small change to one candidate. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| mutation operator | The procedure that makes mutations. In LLM-era systems it is a language model. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| mutation-prompt | In Promptbreeder, an instruction that tells the LLM how to change a task prompt. | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| mutual recursion | Two functions that call each other, so control passes back and forth without a loop statement. | [Part 7 L5](/notes/ai/recursive-self-improvement/07-implementations/l5-sica-and-godel-agent-in-code) |
| naive rule | Accept a child if its mean gain is larger than 0. | [Part 9 P6](/notes/ai/recursive-self-improvement/09-build-it/p6-a-validation-gate) |
| naive score | The P1 excess, computed from the number of bins without any check of the packing. | [Part 9 P3](/notes/ai/recursive-self-improvement/09-build-it/p3-an-evaluator-with-explicit-tests) |
| negative feedback | Feedback that acts against the error, so the error shrinks. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| neighbor | An option that one small change can reach from the current option. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| neural architecture search (NAS) | Automatic search for the structure of a neural network. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| node | One element of the syntax tree. | [Part 9 P5](/notes/ai/recursive-self-improvement/09-build-it/p5-an-agent-that-edits-a-program) |
| noise | Random variation in a measurement that does not come from a real change. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| noise level $\sigma$ | The size of the random number added to every priority value. | [Part 9 P2](/notes/ai/recursive-self-improvement/09-build-it/p2-many-candidates-one-answer) |
| noisy priority | A priority function plus $\sigma z$, with a new standard normal draw $z$ at every call. | [Part 9 P2](/notes/ai/recursive-self-improvement/09-build-it/p2-many-candidates-one-answer) |
| novelty check | A search of the literature to see whether an idea is already published. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| novelty search | Search that rewards candidates for behaving differently from earlier ones, and ignores the objective. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| N-way K-shot | A few-shot task with N new classes and K labeled examples per class. | [Part 5 L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver) |
| object level | The level that solves tasks. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| object level, meta level | The level where an agent solves tasks, and the level where an improver changes the agent or its solutions. | [Part 4 L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver) |
| objective | The quantity that an improvement process tries to make larger (or smaller). | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| objective hacking | Raising the score by changing what the evaluator sees, instead of solving the task. | [Part 5 L5](/notes/ai/recursive-self-improvement/05-approaches/l5-code-self-modification) |
| observation | The information that the agent receives from the environment at one moment. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| offline and online | Offline: the agent learns on training tasks first. Online: it learns while it solves the test tasks in order. | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| online bin packing | Items arrive one at a time and must go into a bin at once. The aim is to use few bins. | [Part 6: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) |
| open loop | A system that acts without measuring the result. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| open-ended exploration | Search that keeps a growing archive and keeps branching from many versions, not only the best. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| open-ended RSI | Improvement that also changes the criteria or the machinery of improvement (Chen et al., 2026). | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| open-endedness | Hughes et al.: a system that keeps producing artifacts that are both novel and learnable for an observer. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| OpenEvolve | An open-source evolutionary coding system: a language model proposes edits to a program, and a user evaluator scores them. | [Part 7 L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code) |
| operator (AFlow, MaAS) | A reusable building block of LLM calls, such as "generate", "review and revise" or "ensemble". | [Part 5 L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search) |
| operator overloading | Redefining what an operator such as `==` does for a type. A hack can make equality always true. | [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) |
| optimistic bias | The amount by which the score of the chosen version, on the data used to choose it, is better than its score on new data. | [Part 9 P2](/notes/ai/recursive-self-improvement/09-build-it/p2-many-candidates-one-answer) |
| optimization | Choosing the best option according to a measurable objective. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| optimization power | Bostrom's term: the quality-weighted effort applied to making a system smarter. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| optimization pressure | How hard a process pushes a score up: the number of candidates it tries, the strength of the search, the number of iterations. | [Part 8 L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability) |
| optimizer's curse | The value of the chosen option is expected to be lower than its estimate. Also called the winner's curse. | [Part 8 L3](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures) |
| optimum (global optimum) | The best feasible option in the whole search space. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| oracle feedback | Feedback that uses the correct answer. A deployed system does not have it. | [Part 6: Self-Refine and Reflexion](/notes/ai/recursive-self-improvement/06-research-systems/p02-self-refine-and-reflexion) |
| oracle label | The true answer, used to decide when a loop stops. It is not available in real use. | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| oracle setting | An experiment in which the loop uses oracle labels, for example to stop as soon as the answer is correct. | [Part 5 L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement) |
| outcome | What happened to one proposal: accepted, not better, already tried, no change, or a rejection reason. | [Part 9 P5](/notes/ai/recursive-self-improvement/09-build-it/p5-an-agent-that-edits-a-program) |
| outer loop | The fixed program that runs the iterations: choose a parent, call the improver, evaluate, store. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| output improvement | A better answer to one task. The system is unchanged. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| overfitting | A gap between training error and test error that is too large. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| overseer | In SICA, a language model that runs next to the agent and can warn it or stop it when it goes off task. | [Part 3 L4](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels) |
| packing | The answer for one instance: a list of bins, where each bin is a list of item indices. | [Part 9 P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) |
| paired comparison | Comparing two versions task by task on the same tasks. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| pairwise accuracy | How often a judge picks the same response of a pair as human rankings do. | [Part 6: Self-Rewarding Language Models](/notes/ai/recursive-self-improvement/06-research-systems/p06-self-rewarding-language-models) |
| PaperBench | A benchmark that asks agents to replicate 20 machine learning papers from scratch. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| parent | The version from which a candidate is made by a change. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| parent, child | The agent that was edited, and the new agent that the edit produced. | [Part 7 L4](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code) |
| parent selection | The rule that picks which archived version the next candidate is made from. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| Pareto dominance | Version $a$ dominates version $b$ if $a$ is at least as good on every objective and strictly better on one. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| Pareto front | The set of versions that no other version dominates. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| parsimony pressure | A preference for smaller programs when scores are equal or close. | [Part 8 L5](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift) |
| parsing | Extracting the candidate program from the reply text. | [Part 9 P9](/notes/ai/recursive-self-improvement/09-build-it/p9-from-toy-to-language-model) |
| pass rate | The share of tasks that a version solves. | [Part 3 L2](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step) |
| pass rate (accuracy) | The fraction of tasks that a version solves. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| pass@1 | The share of problems solved with one submitted answer. | [Part 5 L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement) |
| pass@k | The chance that at least one of $k$ attempts at a task passes. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| patch | A text that lists the changes to a set of files, so that the changes can be applied again. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| patch chain | The ordered list of patches from the initial agent to one agent. Applying it rebuilds that agent. | [Part 7 L4](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code) |
| Pearson correlation | A number from −1 to 1 that measures how well two quantities rise and fall together along a straight line. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| persistence | Whether a gain stays for future tasks. | [Part 9 P2](/notes/ai/recursive-self-improvement/09-build-it/p2-many-candidates-one-answer) |
| persistent change | A change that stays for future tasks. | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| pickle | Python's binary format for saved objects. Loading a pickle file can run code. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| pin a commit | Record the exact commit you read, so that every line number and claim refers to one fixed version. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| plateau | A stretch of iterations with almost no gain. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| playbook | ACE's name for a memory made of many small itemized entries ("bullets"). | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| policy | The rule that maps the agent's state to its next action. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| Polyglot | Programming exercises in several languages, checked by tests. | [Part 5 L5](/notes/ai/recursive-self-improvement/05-approaches/l5-code-self-modification) |
| population | In evolutionary methods, the set of versions that the search keeps at one time. | [Part 4 L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules) |
| Population Based Training (PBT) | A method that trains a population of models and copies and changes their hyperparameters during training. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| position bias | An LLM judge prefers an answer because of its position, first or second. | [Part 5 L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement) |
| positive feedback | Feedback that acts in the same direction as the change, so the change grows. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| power | The probability that a test detects a real difference of a given size. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| preference pair | Two outputs for one prompt, one marked chosen and one rejected. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| preference share | The share of comparisons in which an evaluator prefers one output. It is not an accuracy. | [Part 6: Self-Refine and Reflexion](/notes/ai/recursive-self-improvement/06-research-systems/p02-self-refine-and-reflexion) |
| preregistration | A written plan of the metric, the comparison and the analysis, fixed and dated before the experiment runs. | [Part 10 L4](/notes/ai/recursive-self-improvement/10-advanced/l4-open-problems-and-how-to-read-new-work) |
| pretraining | Training a large model to predict the next token of very large amounts of text. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| primary metric | The one score that decides the main claim. | [Part 10 L4](/notes/ai/recursive-self-improvement/10-advanced/l4-open-problems-and-how-to-read-new-work) |
| priority function | The function that FunSearch evolves. It gives a number to each choice, and the skeleton takes the choice with the highest number. | [Part 6: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) |
| probability distribution | A list of probabilities, one for each possible outcome, that add to 1. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| problem description | A plain statement of the task, written by a human. | [Part 6: Promptbreeder](/notes/ai/recursive-self-improvement/06-research-systems/p04-promptbreeder) |
| process improvement | A changed system that produces better answers on future tasks. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| process reward model (PRM) | A trained verifier that scores each step of a reasoning chain. | [Part 5 L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement) |
| process that makes agents | The improver or designer that proposes, tests and accepts new agents. Also called an agent factory. | [Part 10 L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories) |
| program | A list of instructions that a computer runs. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| program edit | One change to the syntax tree: change a constant, swap an operator, replace a sub-expression with a leaf, or grow a sub-expression. | [Part 9 P5](/notes/ai/recursive-self-improvement/09-build-it/p5-an-agent-that-edits-a-program) |
| program search | A search in which each candidate is a program, and the program produces the answer. | [Part 6: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) |
| program size | The number of expression nodes in the tree. `-gap` has size 2. | [Part 9 P5](/notes/ai/recursive-self-improvement/09-build-it/p5-an-agent-that-edits-a-program) |
| program source | The text of a program. Here, one Python expression such as `-gap`. | [Part 9 P5](/notes/ai/recursive-self-improvement/09-build-it/p5-an-agent-that-edits-a-program) |
| programs database | FunSearch's store of correct programs and their scores. | [Part 6: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) |
| prompt | The text that you give to a language model at the start. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| prompt injection | Text that a model reads as data but then follows as an instruction. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| prompting iteration | The paper's unit of agent work. Exploration runs get at most 160 of them. | [Part 6: Voyager](/notes/ai/recursive-self-improvement/06-research-systems/p03-voyager) |
| proof | A finite chain of steps. Each step follows from axioms or earlier steps by a fixed rule. | [Part 6: Good's intelligence explosion and the Gödel machine](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine) |
| proof searcher | The part of a Gödel machine that searches for proofs about the machine itself. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| proposer | The component that makes candidate changes. | [Part 2 L4](/notes/ai/recursive-self-improvement/02-core-idea/l4-examples-and-non-examples) |
| proposer model | The model that writes new candidate instructions. | [Part 5 L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization) |
| proxy | A measurable quantity that we hope tracks what we really want. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| proxy gap | The difference between the measured score and the real objective for one version. | [Part 8 L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability) |
| p-value | The probability of a difference at least this large if the two versions were truly equal. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| quality-diversity | Search that wants good versions of many different kinds, not one best version. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| quality-diversity (QD) | Search that keeps the best candidate for each kind of behavior, not only the single best candidate. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| quine | A program that prints its own source text exactly. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| quota | A fixed allowance of a resource, such as disk space, processes or money. | [Part 8 L5](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift) |
| random agent | An agent that sometimes makes a random choice. Here, with probability $\varepsilon$ it puts the item into a random bin that has room. | [Part 9 P6](/notes/ai/recursive-self-improvement/09-build-it/p6-a-validation-gate) |
| random restart | Starting local search again from a new random option. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| random search | Search that tries options chosen at random. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| random variable | A quantity whose value depends on chance, such as the score of one random task. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| ratchet | An acceptance rule that never lets the kept score fall, for example "accept only if better than the current version". | [Part 7 L2](/notes/ai/recursive-self-improvement/07-implementations/l2-stop-in-code) |
| rationale | The written steps of reasoning before a final answer. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| rationalization | In STaR: give the model the correct answer as a hint, so that it writes a rationale for a problem it failed. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| real objective | What we actually want the system to achieve, for example "fix real software bugs well". It is usually not directly measurable. | [Part 8 L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability) |
| reason | A short text that names one broken rule, for example `missing item 3`. | [Part 9 P3](/notes/ai/recursive-self-improvement/09-build-it/p3-an-evaluator-with-explicit-tests) |
| reasoning model | A language model trained to write long reasoning before it answers, here o3-mini. | [Part 6: SICA, a Self-Improving Coding Agent](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent) |
| RE-Bench | A benchmark of 7 open-ended machine learning research-engineering tasks, with expert human baselines. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| recalcitrance | Bostrom's term: how hard a system is to improve. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| recall | The fraction of real cases that a detector catches. | [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) |
| recurrence | A rule that gives the next value of a sequence from the current value. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| recursion (in code) | A function that calls itself on a smaller or simpler input. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| recursive self-improvement (RSI) | Improvement in which the improved system does the next improvement. This lesson gives the exact definitions. | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| recursive task decomposition | Splitting a task into sub-tasks and solving each with the same method. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| reference packer | First fit decreasing (FFD): sort all items from largest to smallest, then use first fit. It sees the whole list, so an online agent cannot use it. | [Part 9 P7](/notes/ai/recursive-self-improvement/09-build-it/p7-regression-tests-and-an-archive) |
| refine | Rewrite an output with the help of feedback. | [Part 6: Self-Refine and Reflexion](/notes/ai/recursive-self-improvement/06-research-systems/p02-self-refine-and-reflexion) |
| reflection step | A follow-up call in which the meta agent reviews and revises its own new design. | [Part 7 L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code) |
| reflector | ACE's name for a critic that extracts lessons from successes and errors. | [Part 5 L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement) |
| Reflexion | A method in which an agent writes a short verbal reflection after a failed attempt and uses it in the next attempt. | [Part 7 L7](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches) |
| regress | A chain of levels in which each level needs another level above it, without an end. | [Part 3 L4](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels) |
| regression | A task that the old version solved and the new version fails. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| regression check | A rule that rejects a change that causes a regression. | [Part 9 P7](/notes/ai/recursive-self-improvement/09-build-it/p7-regression-tests-and-an-archive) |
| regression suite | A fixed set of tests of behavior that already works. A change must not break it. | [Part 8 L3](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures) |
| regression to the mean | The tendency of an extreme measurement to be followed by a less extreme one. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| regressional Goodhart | The best-scoring option is partly the luckiest, so its real value is predictably lower than its score. | [Part 8 L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability) |
| reinforcement learning from human feedback (RLHF) | Training a model to produce outputs that a model of human preferences scores highly. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| reinforcement learning (RL) | Learning from a reward signal by trial and error. | [Part 5 L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search) |
| relative change | The change divided by the old score, as a ratio or a percent. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| `reliability_guard` | STOP's helper that removes some dangerous functions from the running Python process. | [Part 7 L2](/notes/ai/recursive-self-improvement/07-implementations/l2-stop-in-code) |
| repository | A folder of files under version control, with the full record of saved changes. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| residual | The difference between a measured value and the value that a fitted model predicts. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| restricted namespace | The names that the compiled program can see. Here: no built-in functions except `abs`, `min` and `max`. | [Part 9 P5](/notes/ai/recursive-self-improvement/09-build-it/p5-an-agent-that-edits-a-program) |
| re-test | A second measurement of a chosen candidate on fresh tasks. | [Part 10 L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators) |
| retrieval | Selecting the stored items most similar to the current task, often the top $k$ by embedding similarity. | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| returns exponent $\alpha$ | In $dI/dt = c\,I^{\alpha}$, the number that says how strongly the current level speeds up growth. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| returns parameter $r$ | In the model of Eth and Davidson, the number of times software doubles for each doubling of cumulative research effort. | [Part 10 L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement) |
| returns to software research and development (R&D), $r$ | Software doublings per doubling of cumulative research effort (Eth and Davidson). | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| reversibility | How easily a change can be undone. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| reward | A number that measures how good a result is. Higher is better. | [Part 4 L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules) |
| reward function (RF) | The code or model that turns outcomes into a reward. | [Part 8 L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) |
| reward hacking | Raising a score by exploiting the scoring code instead of doing the task. | [Part 6: STOP, the Self-Taught Optimizer](/notes/ai/recursive-self-improvement/06-research-systems/p05-stop-self-taught-optimizer) |
| reward model | A model trained to predict a quality score for an output. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| reward signal | The number that an update rule uses during learning. It can differ from the score that you report. | [Part 4 L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules) |
| reward tampering | Changing the reward function itself, or the tests that guard it. | [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) |
| RF tampering | The agent changes the implemented reward function. | [Part 8 L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) |
| RF-input tampering | The agent changes the information that the reward function receives, so the reward rests on false facts. | [Part 8 L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) |
| RL² | A recurrent network trained by slow reinforcement learning (RL) so that its activations act as a fast learner. | [Part 5 L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver) |
| RLAIF | Reinforcement learning from AI feedback: an AI model, not a human, supplies the preference labels. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| role | A job inside an improvement loop, defined by its instructions, inputs and outputs. | [Part 5 L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement) |
| role separation | Giving different jobs to different components, prompts, models or tools. | [Part 5 L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement) |
| rollout | One full run of the system on one input. | [Part 5 L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization) |
| rubric | A fixed list of criteria that a judge uses to give a score. Here the judge adds points up to 5. | [Part 6: Self-Rewarding Language Models](/notes/ai/recursive-self-improvement/06-research-systems/p06-self-rewarding-language-models) |
| runtime memory inspection | Reading the functions, classes and variables of a program while it runs. | [Part 6: Gödel Agent](/notes/ai/recursive-self-improvement/06-research-systems/p08-godel-agent) |
| sample | One complete packing of one instance by the noisy packer. | [Part 9 P2](/notes/ai/recursive-self-improvement/09-build-it/p2-many-candidates-one-answer) |
| sampling | Choosing one outcome at random, with the chances given by a probability distribution. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| sampling noise | Variation in a score that comes from which tasks happened to be in the sample. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| sandbox | An isolated environment that limits what code can touch, such as files, network and time. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| sandbox circumvention | Code that turns off or escapes the sandbox that should contain it. | [Part 8 L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) |
| sandbox flag | The argument `use_sandbox` of STOP's sandbox experiment. A candidate that sets it to False runs its code without the guard. | [Part 7 L2](/notes/ai/recursive-self-improvement/07-implementations/l2-stop-in-code) |
| saturating growth | Each gain is a fixed fraction of the remaining distance to a ceiling. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| saturation | The state in which scores sit near the top of a scale, so that further gains are hard to detect. | [Part 6: Self-Rewarding Language Models](/notes/ai/recursive-self-improvement/06-research-systems/p06-self-rewarding-language-models) |
| scaffold | The code around a model that turns it into an agent: prompts, tools, control flow, memory handling. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| scalarization | Turning several objectives into one number, usually by a weighted sum. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| score | The number that an evaluator returns for a version or an output. | [Part 3 L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components) |
| search space | The set of all options that the method can try. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| SEARCH/REPLACE diff | A change written as "find this text, put this text in its place". | [Part 6: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) |
| secret | A credential, such as an application programming interface (API) key, that gives access to a paid or private service. | [Part 7 L7](/notes/ai/recursive-self-improvement/07-implementations/l7-what-the-code-teaches) |
| secret utility | The function that really computes the score. The model never sees its text. | [Part 7 L2](/notes/ai/recursive-self-improvement/07-implementations/l2-stop-in-code) |
| seed | A number that fixes the output of a random generator. The same seed gives the same numbers. | [Part 9 P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) |
| seed improver | The first, hand-written improver that STOP starts from. | [Part 4 L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver) |
| selection | The rule that picks which candidates become parents. | [Part 5 L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods) |
| selection set | The examples used to choose between candidates. It can be part of the training set or a validation set. | [Part 5 L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization) |
| self-confirming error | An error that the system judges as correct and then builds on. | [Part 8 L4](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l4-self-evaluation-failures) |
| self-consistency | Sample many reasoning paths and take the majority answer (Wang et al., 2022). | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| self-correction | A model changes its own output after it reads feedback, while it answers. | [Part 5 L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement) |
| self-critique | A model writes feedback on its own output. | [Part 5 L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement) |
| self-edit | SEAL's term: text that a model writes to specify its own fine-tuning data and settings. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| self-enhancement bias | A judge prefers its own outputs. | [Part 8 L4](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l4-self-evaluation-failures) |
| self-evaluation | The system, or a model like it, judges its own outputs or versions. | [Part 8 L4](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l4-self-evaluation-failures) |
| self-evolving agent | A survey term for an agent whose model, memory, prompts, tools or structure are updated from experience. It is broader than RSI. | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| self-improvement iteration | One pass in which the current improver improves its own code, scored by the meta-utility. | [Part 6: STOP, the Self-Taught Optimizer](/notes/ai/recursive-self-improvement/06-research-systems/p05-stop-self-taught-optimizer) |
| self-improvement round | One application of the improver, with settings $\theta_{t-1}$, to the settings $\theta_{t-1}$. | [Part 9 P8](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver) |
| self-improvement step | One iteration in which the current improver improves its own code. | [Part 4 L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver) |
| Self-Improving Coding Agent (SICA) | A coding agent that benchmarks itself, stores the results in an archive, and runs on its own code base to make the next version. | [Part 7 L5](/notes/ai/recursive-self-improvement/07-implementations/l5-sica-and-godel-agent-in-code) |
| self-modification | A change that a system makes to its own code. | [Part 5 L5](/notes/ai/recursive-self-improvement/05-approaches/l5-code-self-modification) |
| self-play | Training in which a system plays against copies of itself, so its own games become its training data. | [Part 2 L4](/notes/ai/recursive-self-improvement/02-core-idea/l4-examples-and-non-examples) |
| self-preference | Scoring one's own outputs higher than others' outputs of equal quality. | [Part 8 L4](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l4-self-evaluation-failures) |
| self-preference bias | An LLM judge rates outputs that look like its own outputs higher. | [Part 5 L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement) |
| self-reference | A sentence, program or system that refers to itself. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| self-referential | A system that reads or changes its own code, including the code that does the changing. | [Part 3 L4](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels) |
| self-referential agent | An agent that can read and change the code that defines itself, including the code that changes it. | [Part 6: Gödel Agent](/notes/ai/recursive-self-improvement/06-research-systems/p08-godel-agent) |
| self-refinement | One model writes an answer, criticizes it and rewrites it, inside one task. | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| self-reflection | A short text that the agent writes about why an attempt failed and what to do next. | [Part 6: Self-Refine and Reflexion](/notes/ai/recursive-self-improvement/06-research-systems/p02-self-refine-and-reflexion) |
| self-reported measurement | A number that an organization measures and publishes about its own systems or its own work. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| Self-Taught Optimizer (STOP) | A system in which an improver program improves its own source code, scored by how well it improves other programs. | [Part 7 L2](/notes/ai/recursive-self-improvement/07-implementations/l2-stop-in-code) |
| self-training | A loop in which a model generates data, the data is filtered, and the model trains on it. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| self-verification | A check by a model that the task succeeded, based on the observed state. | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| separate process | A second running program with its own memory. A crash in it does not crash the first program. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| set point | The value that a controller tries to reach, for example 21 °C. | [Part 1 L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) |
| settings $\theta$ | The six numbers that control the improver: four edit weights, `k` and `step`. | [Part 9 P8](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver) |
| shallow clone | A copy of a repository that holds only the latest commit, not the older ones. | [Part 7 L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository) |
| shared blind spot | An error that every role misses, because every role uses the same model or the same information. | [Part 5 L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement) |
| sigmoid | An S-shaped function that maps any number to a value between 0 and 1. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| signature | The tuple of a program's scores on each test input. Programs with the same signature form one cluster. | [Part 6: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) |
| significance level ($\alpha$) | The p-value below which you call a difference significant, often 0.05. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| simulated annealing | Accept a worse candidate with a probability that falls as the "temperature" falls. | [Part 4 L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules) |
| skeleton | A fixed program written by the user, with one function left for the search to change. | [Part 6: FunSearch and AlphaEvolve](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve) |
| skill | A program that does one thing in the game, for example "craft a wooden pickaxe". | [Part 6: Voyager](/notes/ai/recursive-self-improvement/06-research-systems/p03-voyager) |
| skill library | A store of verified programs that an agent wrote and can call again later. | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| software intelligence explosion (SIE) | Fast, accelerating progress from software improvements alone, on existing hardware. | [Part 4 L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics) |
| solution | A string, such as a program, that solves one downstream task. Written $s$. | [Part 4 L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver) |
| solve rate $\alpha$ | The share of all validation instances that a version solves. | [Part 9 P7](/notes/ai/recursive-self-improvement/09-build-it/p7-regression-tests-and-an-archive) |
| solved instance | An instance on which the online packer uses no more bins than FFD. | [Part 9 P7](/notes/ai/recursive-self-improvement/09-build-it/p7-regression-tests-and-an-archive) |
| solver | The component that does tasks with the current version. | [Part 5 L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement) |
| soundness | A theory is sound if every statement that it proves is true. | [Part 6: Good's intelligence explosion and the Gödel machine](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine) |
| `__source__` | An attribute that Gödel Agent sets on a patched function to store the source text of its new definition. | [Part 7 L5](/notes/ai/recursive-self-improvement/07-implementations/l5-sica-and-godel-agent-in-code) |
| source code | The text of a program, as a person or a model writes it. | [Part 1 L5](/notes/ai/recursive-self-improvement/01-foundations/l5-recursion-and-self-reference) |
| special-casing | Code that detects the test inputs and returns the expected outputs only for them. | [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) |
| specification | The written objective and scoring rule that a system is optimized against. | [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) |
| specification gaming | Behavior that satisfies the literal specification without the intended outcome. | [Part 8 L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) |
| staged evaluation | Evaluation in steps of growing size and cost, where a candidate continues only if it passes a threshold. | [Part 3 L2](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step) |
| standard deviation | The square root of the variance. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| standard error | The typical size of the error of a measured mean. For a pass rate $p$ on $n$ questions it is about $\sqrt{p(1-p)/n}$. | [Part 7 L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code) |
| standard error (SE) | How much a score would move if you drew a different random sample of tasks. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| state | The information an agent holds at one moment. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| statistical power | The chance that an experiment detects a real effect of a given size. | [Part 10 L4](/notes/ai/recursive-self-improvement/10-advanced/l4-open-problems-and-how-to-read-new-work) |
| `step` | How far the edit "constant" moves a number. | [Part 9 P8](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver) |
| step size $\sigma$ | The standard deviation of the noise that the proposer adds. | [Part 9 P4](/notes/ai/recursive-self-improvement/09-build-it/p4-propose-and-test-strategy-changes) |
| stepping stone | A version that is not good itself, but leads to good versions later. | [Part 3 L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions) |
| stopping condition | The rule that ends an episode: goal reached, step limit, time limit or failure. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| sub-agent | An agent that the main agent calls like a tool. It returns a string. | [Part 6: SICA, a Self-Improving Coding Agent](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent) |
| successor model | A new model that a system designs and trains, to replace or follow itself. | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) |
| supernet | A single structure that contains many possible designs, with a learned probability for each part. | [Part 5 L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search) |
| supervised fine-tuning (SFT) | Fine-tuning on pairs of input and desired output. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| support set and query set | The training split and the validation split inside one task of a meta-learning dataset. | [Part 5 L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver) |
| support set, query set | The data of one task used for the inner update, and the held-out data used to score it. | [Part 4 L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver) |
| sustained improvement | The held-out score keeps rising over many iterations, by more than the noise, with a fixed budget per iteration. | [Part 10 L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement) |
| SWE-bench Lite | A smaller, separate version of SWE-bench that the paper uses to test generalization. | [Part 6: The Huxley-Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine) |
| SWE-bench Verified | Real GitHub issues in Python projects, checked by the projects' own tests. | [Part 5 L5](/notes/ai/recursive-self-improvement/05-approaches/l5-code-self-modification) |
| SWE-Verified-60 | A 60-task subset of SWE-bench Verified that the paper uses. | [Part 6: The Huxley-Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine) |
| switchprog | A program that rewrites the machine's own program. It can rewrite the proof searcher too. | [Part 6: Good's intelligence explosion and the Gödel machine](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine) |
| sycophancy | Agreeing with the user or telling the user what they want to hear, against the truth. | [Part 8 L4](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l4-self-evaluation-failures) |
| syntax tree | The structure that Python builds from source text. Each node is one part: a number, a name, an operation. | [Part 9 P5](/notes/ai/recursive-self-improvement/09-build-it/p5-an-agent-that-edits-a-program) |
| synthetic data | Training data that a model wrote, not a human. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| system boundary | The line that separates the parts that can change from the parts that cannot. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| takeoff | The jump from human-level to far-above-human AI. Bostrom calls it slow, moderate or fast. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| target agent | The agent whose code the meta-agent changes. | [Part 6: SICA, a Self-Improving Coding Agent](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent) |
| target theorem | The statement that a Gödel machine must prove before a rewrite: running this rewrite now is better than not running it. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| task | One problem for the agent to solve. | [Part 3 L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components) |
| task distribution | The probabilities with which different tasks appear, written $\mathcal{D}$. | [Part 4 L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces) |
| task family | A named random rule that makes instances, for example "mixed big-small". | [Part 9 P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) |
| task instance | One benchmark task, named by an ID such as `django__django-10999`. | [Part 7 L4](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code) |
| task model | The model that runs the prompt on the task. Its score is the objective. | [Part 5 L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization) |
| task set | A list of instances from one family, made from one seed. | [Part 9 P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score) |
| task-prompt | In Promptbreeder, the instruction put before each question. | [Part 5 L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization) |
| tech tree | Minecraft's ladder of tools: wooden, then stone, then iron, then diamond. | [Part 6: Voyager](/notes/ai/recursive-self-improvement/06-research-systems/p03-voyager) |
| temperature | A number that makes the next-token distribution sharper (low temperature) or flatter (high temperature). | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| `temp_override` | STOP's helper that writes a code string to a file, imports it, and returns the function. | [Part 7 L2](/notes/ai/recursive-self-improvement/07-implementations/l2-stop-in-code) |
| test data | Questions kept apart and used only to report the final score. | [Part 6: Gödel Agent](/notes/ai/recursive-self-improvement/06-research-systems/p08-godel-agent) |
| test set | Examples kept aside until the end, used once to estimate performance on new data. Also called the held-out test set. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| test split | The separate questions used once, after the search, to score every design. | [Part 7 L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code) |
| test suite | Fixed checks that every candidate must pass before it is scored. | [Part 9 P6](/notes/ai/recursive-self-improvement/09-build-it/p6-a-validation-gate) |
| test-time compute | The computation that a model spends while it answers, not while it trains. | [Part 5 L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement) |
| test-time training | A short weight update for one task at inference time, usually discarded after the task. | [Part 2 L3](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence) |
| test-time training (TTT) | Update the weights at inference time, for one input or task, then usually discard the update. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| textual gradient | Feedback in plain language that says how a piece of text should change to improve the objective. | [Part 5 L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization) |
| thinking-style | A short hint about a way of thinking. The paper lists 39 of them. | [Part 6: Promptbreeder](/notes/ai/recursive-self-improvement/06-research-systems/p04-promptbreeder) |
| Thompson sampling | Draw one random sample from each option's belief distribution, and choose the highest. | [Part 5 L5](/notes/ai/recursive-self-improvement/05-approaches/l5-code-self-modification) |
| threshold | The minimum result that a candidate needs to pass a stage. | [Part 3 L2](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step) |
| tiling agent | An agent that approves building a very similar successor, which approves the next, and so on. | [Part 8 L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) |
| time horizon | The length of human tasks that an AI completes with a given success rate, such as 50%. | [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) |
| time horizon (50%) | The length of tasks, in human working time, that an AI system completes with 50% success. | [Part 6: The AI Scientist and the measurement of automated AI research](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research) |
| time per task | The wall-clock time per task. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| timeout penalty | A factor that halves the utility of an agent that ran out of time. | [Part 6: SICA, a Self-Improving Coding Agent](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent) |
| token | A small piece of text, often a word or part of a word, that a language model reads and writes. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| tool | A function that an agent can call to act or to get information. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| tool call | A structured request from the model: a tool name and its arguments. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| tournament selection | Pick a few versions at random, and let the best of them become a parent. | [Part 4 L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules) |
| training | The process that finds good weights from data. Training changes the weights. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| training set | The examples used to compute gradients and change the weights. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| trajectory | The ordered record of observations and actions in one episode. | [Part 1 L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment) |
| transfer | Performance on tasks of a different kind, or with a different model. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| transfer task | A task that the improver did not see during self-improvement. | [Part 6: STOP, the Self-Taught Optimizer](/notes/ai/recursive-self-improvement/06-research-systems/p05-stop-self-taught-optimizer) |
| trial | One full attempt at a task. Reflexion runs several trials of the same task. | [Part 6: Self-Refine and Reflexion](/notes/ai/recursive-self-improvement/06-research-systems/p02-self-refine-and-reflexion) |
| true score | The score a version would get on average over the whole task distribution and over its own randomness. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| trusted model | A weaker model that we trust not to act against us. | [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) |
| trusted monitor | A separate, weaker model or person that checks the output of the stronger model. | [Part 9 P9](/notes/ai/recursive-self-improvement/09-build-it/p9-from-toy-to-language-model) |
| trusted monitoring | A weaker, trusted model rates a stronger model's outputs, and the most suspicious ones go to human review. | [Part 5 L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement) |
| Turing-complete | Able to express any computation. Python code is Turing-complete. | [Part 6: ADAS and Meta Agent Search](/notes/ai/recursive-self-improvement/06-research-systems/p07-adas-meta-agent-search) |
| ultraintelligent machine | Good's term: a machine that can far surpass every intellectual activity of any human. | [Part 6: Good's intelligence explosion and the Gödel machine](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine) |
| underfitting | Too much error even on the training set. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| unexpected termination | A run that stopped by itself, usually after the agent changed its own improvement code. | [Part 6: Gödel Agent](/notes/ai/recursive-self-improvement/06-research-systems/p08-godel-agent) |
| unhackable proxy | A proxy for which a higher expected proxy value can never mean a lower expected true value. | [Part 8 L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability) |
| unit of evolution | One member of the population: usually 2 task-prompts and 1 mutation-prompt. | [Part 6: Promptbreeder](/notes/ai/recursive-self-improvement/06-research-systems/p04-promptbreeder) |
| unit test | A small program that checks one behavior of code, and passes or fails. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| unmeasured property | A useful property that no evaluator in the loop checks, such as honesty or readability. | [Part 8 L5](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift) |
| untrusted model | A stronger model that might act against us. | [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) |
| update rule | The function $U$ that maps the current state and the feedback to the next state. | [Part 4 L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules) |
| updated system | The version or set of versions that the next iteration starts from. | [Part 3 L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components) |
| utility | One number that combines several objectives with weights. | [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement) |
| utility function | A function that gives a number for how good an outcome is. | [Part 2 L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents) |
| utility indifference | A design in which the agent expects the same utility whether or not a shutdown button is pressed. | [Part 8 L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) |
| validation data | Questions used during improvement to score candidate policies. | [Part 6: Gödel Agent](/notes/ai/recursive-self-improvement/06-research-systems/p08-godel-agent) |
| validation process | The ordered checks and measurements that a candidate passes, from cheap to expensive, before the acceptance rule decides. | [Part 3 L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components) |
| validation set | Examples that training does not use for updates. They are used to choose settings and to decide when to stop. | [Part 1 L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated) |
| validation split | The questions used to score designs during the search. | [Part 7 L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code) |
| validator | A function that checks an answer against explicit rules and returns the reasons why it is invalid. | [Part 9 P3](/notes/ai/recursive-self-improvement/09-build-it/p3-an-evaluator-with-explicit-tests) |
| variable | One thing that you can choose, for example the sugar amount. | [Part 1 L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search) |
| variance | The average squared distance of a random variable from its mean. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| verbal reinforcement | Reflexion's name for learning through written feedback in memory, with no change to the weights. | [Part 4 L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules) |
| verbosity bias | A judge prefers longer answers, even when they add nothing. | [Part 8 L4](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l4-self-evaluation-failures) |
| verdict | The class that the five questions assign to a system, from "not self-improvement" to "full RSI". | [Part 2 L4](/notes/ai/recursive-self-improvement/02-core-idea/l4-examples-and-non-examples) |
| verifiable reward | A reward computed by a verifier, not by a model's opinion. | [Part 5 L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement) |
| verifier | A component that estimates if an answer is correct. | [Part 5 L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement) |
| version | One complete state of the improved thing at one time. | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) |
| visible utility | The text of a simplified utility that the language model sees in its prompt. | [Part 7 L2](/notes/ai/recursive-self-improvement/07-implementations/l2-stop-in-code) |
| vocabulary | The fixed set of all tokens that a language model knows. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| weight vector $w$ | Six numbers that say how much each feature counts. The strategy is $w$. | [Part 9 P4](/notes/ai/recursive-self-improvement/09-build-it/p4-propose-and-test-strategy-changes) |
| weights | The learned numbers inside a model. | [Part 1 L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models) |
| whitelist | A list of the node types, names and operators that a program may use. Everything else is forbidden. | [Part 9 P5](/notes/ai/recursive-self-improvement/09-build-it/p5-an-agent-that-edits-a-program) |
| $\widehat{\mathrm{CMP}}$ estimate | A computable estimate of CMP: the success rate of all evaluations in the clade together. | [Part 6: The Huxley-Gödel Machine](/notes/ai/recursive-self-improvement/06-research-systems/p11-huxley-godel-machine) |
| win rate | The share of comparisons in which an evaluator prefers a model's response to a reference model's response. | [Part 6: Self-Rewarding Language Models](/notes/ai/recursive-self-improvement/06-research-systems/p06-self-rewarding-language-models) |
| winner's curse | The upward bias of the best measured score among several candidates. Smith and Winkler call it the optimizer's curse. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| wireheading | Getting the reward signal without the goal that the reward stands for. | [Part 8 L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) |
| workflow | A reusable sequence of steps for a common sub-goal, with placeholders for task-specific values. | [Part 5 L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience) |
| working-out | A correct step-by-step solution of a training question, used as a few-shot example. | [Part 6: Promptbreeder](/notes/ai/recursive-self-improvement/06-research-systems/p04-promptbreeder) |
| z score | A difference divided by its standard error. | [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) |
| zero-shot generalization | Solving new tasks in a new setting with no extra training or examples. | [Part 6: Voyager](/notes/ai/recursive-self-improvement/06-research-systems/p03-voyager) |

## Numbering schemes

The course uses six kinds of labels. They look alike, but they mean different things.

| Label | Where it is defined | What it means |
|---|---|---|
| L1, L2, ... and P1 to P9 | Every part | The position of a lesson in its part. In Part 9, P1 to P9 are projects. Part 6 pages are named by paper, not by number. |
| Level 0 to Level 6 | [Part 2 L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement) | The ladder of this course: what changes, and whether the improver changes. |
| Verdicts N, O, E, S, P, F | [Part 2 L4](/notes/ai/recursive-self-improvement/02-core-idea/l4-examples-and-non-examples) | The six verdicts of the classification method: not self-improvement, output improvement, external improvement, broad self-improvement, partial RSI, full RSI. |
| Object, meta and meta-meta level | [Part 3 L4](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels) | What a procedure works on: tasks, the agent, or the improver. These are not ladder levels. |
| Duan et al. L1 to L5 | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) | The autonomy levels of Duan et al. (2026): who decides each part of an improvement. These are not lesson numbers. |
| AL0 to AL5 | [Part 2 L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means) | The automation scale that Anthropic uses to measure how much AI research work an AI leads. AL5 means no human in the loop. |

## Benchmarks and measures named in the course

A benchmark is a fixed set of tasks with a fixed scoring rule. The papers of this course report results on these. The short meanings below are general background. Each lesson gives the details that its result needs.

| Name | What it tests |
|---|---|
| AIME | Problems from the American Invitational Mathematics Examination, a high-school math competition. Each answer is a whole number. |
| ALFWorld | Household tasks in a simulated home, done with text commands, for example "put a clean mug in the cabinet". |
| ARC | The Abstraction and Reasoning Corpus: grid puzzles. The solver must find a transformation rule from a few input and output grids. |
| DROP | Reading comprehension that needs counting, adding or sorting facts from a paragraph. |
| Elo rating | A rating computed from game results. A 400-point difference means that the stronger side is expected to score about ten times as many points as the weaker side. |
| GPQA | Hard multiple-choice science questions written by experts. |
| GSM8K | Grade-school math word problems with numeric answers. |
| HotPotQA | Questions whose answers need facts from two or more Wikipedia paragraphs. |
| HumanEval | Python programming problems, each with a description and unit tests. |
| LiveCodeBench | Programming contest problems collected over time, so that older models are less likely to have seen them. |
| MGSM | Grade-school math word problems translated into several languages. |
| MMLU | Multiple-choice questions across many school and professional subjects. |
| pass@k | The chance that at least one of k attempts at a task passes. See [Part 1 L7](/notes/ai/recursive-self-improvement/01-foundations/l7-measuring-improvement). |
| Polyglot | A set of coding exercises in several programming languages, used by the Darwin Gödel Machine. |
| SWE-bench | Real issues from GitHub projects in Python. A fix passes when the project's own tests pass. SWE-bench Verified is a subset that humans checked. |
| WebShop | A simulated shopping website. The agent must find and buy a product that matches an instruction. |
