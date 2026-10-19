---
title: "L2: Memory and learning from experience"
order: 2
summary: "How agents keep skills, insights and workflows between tasks, what this changes, and the evidence for and against it."
status: not-started
tags: [rsi, memory, voyager, expel, agent-workflow-memory, dynamic-cheatsheet, ace]
---

## Learning objectives

After this lesson you can:

- Explain how Voyager, ExpeL, Agent Workflow Memory, Dynamic Cheatsheet and ACE write, store and use memory.
- State for each method who writes the memory, who checks it, what persists and what stays fixed.
- Separate the gain that comes from memory from the gain that comes from a better prompt, with numbers.
- Explain three ways memory fails: wrong self-judgment, context collapse and brevity bias.
- Place memory methods on the ladder, and explain why they stop at Level 2.

## Prerequisites

- [L1: Self-critique and iterative refinement](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement)
- [L2: Agents: actions, state, memory, tools and environment](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment)
- [L2: The ladder: from repeating a task to improving the improver](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement)
- [L3: The system boundary, the "self" and persistence](/notes/ai/recursive-self-improvement/02-core-idea/l3-system-boundary-and-persistence)

## 1. The question this idea answers

A new cook keeps a notebook. After each dinner, she writes what worked and what failed: "Salt the pasta water before it boils." "This oven runs hot, so lower it by 20 degrees." Her hands do not change, but the notebook grows. Next month she cooks better because she reads the notebook first.

A large language model (LLM) agent can do the same. Its weights stay frozen, but it can write notes, rules or small programs and read them in later tasks. This lesson asks: **can an agent improve across tasks by writing memory for its future self, and what decides if that memory helps or harms?**

In [L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement), nothing persisted beyond one task. Here, something persists. That is the step from Level 1 to Level 2 of the ladder.

## 2. Mental model, and where it stops working

> [!analogy] A lab notebook
> A scientist writes each experiment and its result in a notebook, and reads it before the next experiment. Good notes save months of work, and wrong notes waste them.
>
> **Where it stops working:** a careful scientist checks a result before she writes it down. Many agents write notes from their own unchecked opinion. Also, a notebook that grows forever becomes too long to read, and a short summary of it loses detail.

## 3. Terms

| Term | Plain meaning |
|---|---|
| memory | State that an agent keeps between tasks or episodes. |
| skill library | A memory of small programs that solved earlier tasks, which the agent can call again. |
| embedding | A list of numbers that represents a text, so that similar texts get similar numbers. |
| retrieval | Selecting the stored items most similar to the current task, often the top $k$ by embedding similarity. |
| trajectory | The record of one attempt: observations, thoughts and actions in order. |
| insight | A short rule in plain language, extracted from many trajectories. |
| workflow | A reusable sequence of steps for a common sub-goal, with placeholders for task-specific values. |
| automatic curriculum | A component that chooses the next task for the agent. |
| self-verification | A check by a model that the task succeeded, based on the observed state. |
| curator | The component that decides what enters, stays in and leaves the memory. |
| playbook | ACE's name for a memory made of many small itemized entries ("bullets"). |
| delta update | A small change to a few memory entries, instead of a full rewrite of the memory. |
| context collapse | Loss of detail when a model rewrites its whole accumulated memory into a short summary. |
| brevity bias | The tendency of prompt optimization to prefer short, generic instructions. |
| ground truth (GT) label | The true answer or true success signal for a task. |
| offline and online | Offline: the agent learns on training tasks first. Online: it learns while it solves the test tasks in order. |

## 4. Method and math

### 4.1 The memory loop, and who checks it

Every method in this lesson runs the same five-step loop around a frozen model:

1. **Act.** The agent attempts a task. It reads relevant memory first.
2. **Evaluate.** Something decides if the attempt succeeded.
3. **Extract.** A model turns the attempt into a reusable item: a skill, a rule or a workflow.
4. **Store.** The item enters the memory, or changes an existing item.
5. **Retrieve.** On a later task, the agent selects the relevant items.

```mermaid
flowchart LR
    T["Task from environment"] --> A["Agent acts, reads memory"]
    A --> J["Evaluate: did it succeed?"]
    J --> E["Extract skill, rule or workflow"]
    E --> S["Store in memory"]
    S --> R["Retrieve for next task"]
    R --> A
    style T fill:#8A8A8A,color:#fff
    style A fill:#1E6091,color:#fff
    style J fill:#B8860B,color:#fff
    style E fill:#6A4C93,color:#fff
    style S fill:#2D6A4F,color:#fff
    style R fill:#2D6A4F,color:#fff
```

The five questions of L1 still apply. This lesson adds one more: **who writes the memory, and who checks it?** The answer to that question predicts most of the results below. A memory written after a grounded check keeps helping. A memory written after an unchecked self-judgment can store errors, and later tasks then repeat them.

### 4.2 Voyager: a library of skills as code

Voyager is an agent that plays Minecraft for a long time without human help and without fine-tuning (Wang et al., 2023, [arXiv:2305.16291](https://arxiv.org/abs/2305.16291)). It has three parts:

1. An **automatic curriculum**. GPT-4 proposes the next task, aiming at "discovering as many diverse things as possible".
2. A **skill library**. Each successful skill is a JavaScript program. Its key is the embedding of a short description, and retrieval returns the top 5 skills for a new task.
3. **Iterative prompting**. GPT-4 writes a program, the game runs it, and feedback returns. GPT-4 revises, up to 4 times per task.

The feedback has three sources. The environment reports messages, for example "need 2 more planks". The interpreter reports execution errors. A second GPT-4 instance checks success from the game state, such as the inventory, and the paper calls this self-verification.

If the task succeeds, the program enters the library. Failed programs are not stored.

> [!example] One Voyager task (illustration built from the paper's description)
> 1. The curriculum proposes: "craft a wooden pickaxe".
> 2. Retrieval returns stored skills, for example a skill that collects wood.
> 3. GPT-4 writes a program that calls that skill and then crafts.
> 4. The game replies "need 2 more planks". GPT-4 adds a step that crafts planks.
> 5. The checker reads the inventory, sees the pickaxe, and reports success. The new program joins the library.

**Measured:** Voyager discovered "63 unique items within 160 prompting iterations", "3.3× many novel items" compared with the baselines. It reached the iron level of the tech tree in 21 ± 7 iterations, and AutoGPT needed 135 ± 103. The "up to 15.3x" speed-up is AutoGPT's 92 iterations divided by Voyager's 6 for wooden tools (Table 1). Voyager reached diamond tools in only 1 of 3 runs.

**Measured** ablations: a random curriculum gave 93% fewer items. Without self-verification, the agent found 73% fewer items. The authors call self-verification "the most important among all the feedback types". As the code writer, GPT-4 found 5.7 times more unique items than GPT-3.5.

**Measured:** the library transfers. In a new world with an empty inventory and at most 50 iterations, Voyager solved each of four new tasks in 3 of 3 runs. AutoGPT with Voyager's library solved some of them, and AutoGPT without it solved none (Table 2).

Limits:

1. The study has 3 runs per method, with large variance (AutoGPT ± 72 iterations).
2. The authors adapted the baselines to Minecraft themselves.
3. Self-verification can be wrong, and the model hallucinates items such as a "copper sword".
4. GPT-4 costs about 15 times more than GPT-3.5.
5. The model does not improve. Only the library grows, and the paper shows no evidence that it would grow without limit.

### 4.3 ExpeL: rules distilled from many attempts

ExpeL keeps lessons across tasks as rules in plain language (Zhao et al., 2023, [arXiv:2308.10144](https://arxiv.org/abs/2308.10144)). The authors stress that "ExpeL learns without parameter updates". It has three stages:

1. **Gather experience.** On training tasks, a ReAct agent, which alternates reasoning steps and actions, attempts each task. After a failure, it retries with Reflexion, up to 3 times. Successes and failures are stored.
2. **Extract insights.** An LLM compares a failed and a successful attempt at the same task, and also lists of successes. It changes a rule list with four operations: ADD, EDIT, UPVOTE and DOWNVOTE.
3. **Use them at test time.** All insights go into the prompt. Retrieval adds the most similar successful trajectories as examples.

Each rule has an importance counter. A new rule starts at 2. An UPVOTE or an EDIT raises it, and a DOWNVOTE lowers it. At 0, the rule is deleted.

> [!example] One rule's life (illustration, with steps of 1)
> 1. Rule: "Search for the exact title of an entity before you answer." ADD sets importance to 2.
> 2. Another comparison supports it. UPVOTE raises it to 3.
> 3. Three later comparisons contradict it. Three DOWNVOTEs lower it to 2, 1 and 0.
> 4. At 0, the rule is deleted.
> 5. One bad comparison cannot delete a strong rule, so the counter protects memory from single noisy lessons.

**Measured** results with gpt-3.5-turbo acting and gpt-4 writing insights (Tables 2 and 3):

| Benchmark | ReAct | ExpeL | Reflexion after 3 retries on test tasks |
|---|---|---|---|
| HotpotQA | 28.0 | 39.0 | about 40 |
| ALFWorld | 40.0 | 59.0 | 54.4 |

ExpeL makes one attempt per test task. Reflexion retries the test task with feedback. So ExpeL matches or beats a method that gets test-time feedback, without that feedback.

**Measured:** on FEVER, a fact-checking set that ExpeL did not train on, ReAct scored 63 and ExpeL with transferred insights scored 70 (Table 1).

**Measured:** the source of the insights matters. On HotpotQA, insights from gpt-4 gave 39.0, and insights from gpt-3.5-turbo gave 32.0, the same as hand-written insights. So part of the gain is a stronger model that teaches a weaker one, not pure self-improvement.

Limits: training still needs a success signal from the environment. WebShop gains are weak, and evaluation sets are small, 100 to 134 tasks.

### 4.4 Agent Workflow Memory: reusable routines

Agent Workflow Memory (AWM) is for web agents that solve each task from scratch (Wang et al., 2024, [arXiv:2409.07429](https://arxiv.org/abs/2409.07429)). It induces **workflows**: "a goal with a common routine extracted from available action trajectories". Task-specific values become placeholders, for example `[textbox] Origin City or Airport −> TYPE: {your-origin-city}`.

AWM runs in two modes:

1. **Offline:** induce workflows from annotated training examples, then use them at test time.
2. **Online, without labels:** process test queries in order. After each query, an LM-based evaluator gives a success label. Only attempts judged successful become workflows.

Workflows build on each other. "Find a place by its name" becomes a step inside "get the zip code of a place".

**Measured** on WebArena, 812 web tasks on 5 websites, online mode with GPT-4 (Table 1): AWM reached 35.5% success. BrowserGym, a baseline web agent, reached 23.5%, so AWM gained 12.0 points, a 51.1% relative increase. A system with human-written workflows reached 33.0%. The paper's table gives a 7.6% relative gain over it, while its introduction says 7.9%. AWM also used fewer steps per task than the BrowserGym variant that reports steps: 5.9 against 7.9.

**Measured** on Mind2Web, a dataset of tasks on real websites, with GPT-4 offline: step success rose from 36.2 to 45.1. But full-task success stayed very low, at most 4.8%.

The weak point is the online evaluator. The paper does not measure its error rate. The authors warn that wrong self-judgments "can lead to incorrect workflows that degrade model performance". AWM is a clear small example of the loop in section 4.1, and of its main risk: a wrong evaluator writes wrong memory.

### 4.5 Dynamic Cheatsheet: memory curated without labels

Dynamic Cheatsheet (DC) gives a black-box model a memory of strategies, code snippets and insights (Suzgun et al., 2025, [arXiv:2504.07952](https://arxiv.org/abs/2504.07952)). The model curates it "without needing explicit ground-truth labels or human feedback". The queries arrive as a sequence. Two variants exist:

1. **DC-Cu (cumulative):** the model answers with the current memory. Then a curator updates the memory from the query and the answer.
2. **DC-RS (retrieval and synthesis):** retrieve the 3 most similar past queries and answers, update the memory with them, then answer.

The curator "does not have access to ground-truth labels". It decides by itself if an answer is correct. The baselines separate the sources of gain. BL is a minimal prompt. DC-∅ uses DC's prompt structure with an **empty** memory. DR pastes similar past pairs without curation.

**Measured** accuracy in % (Table 1). AIME is a set of hard competition math problems. Game of 24 asks for arithmetic that makes 24 from four numbers.

| Task and model | BL | DC-∅ | DR | DC-Cu | DC-RS |
|---|---|---|---|---|---|
| AIME 2024, Claude 3.5 Sonnet (30 questions) | 23.3 | 36.7 | 43.3 | 50.0 | 46.7 |
| Game of 24, GPT-4o (100) | 10.0 | 19.0 | 6.0 | 93.0 | 99.0 |
| Game of 24, Claude 3.5 Sonnet (100) | 12.0 | 10.0 | 11.0 | 14.0 | 14.0 |
| MMLU-Pro Engineering questions, GPT-4o (250) | 53.2 | 51.6 | 48.8 | 44.0 | 51.2 |

GPT-4o's jump on Game of 24 came after it stored and reused a Python brute-force solver. Claude did not find that solver, so it barely moved. On MMLU-Pro Engineering, GPT-4o got worse with DC-Cu.

> [!example] Worked example: how much of the AIME gain is memory?
> AIME 2024 has 30 questions, so one question is worth 100 / 30 ≈ 3.3 points.
> 1. BL 23.3% is 7 questions. DC-∅ 36.7% is 11 questions. DC-Cu 50.0% is 15 questions.
> 2. The total gain is 8 questions, or 26.7 points.
> 3. The prompt structure alone, with an empty memory, gives 4 questions, or 13.4 points.
> 4. The memory gives the other 4 questions, or 13.3 points. So about half the gain is not memory.
> 5. DC-RS at 46.7% is 14 questions, one question below DC-Cu. One question is too small a difference to rank the two variants.

The standard error formula of [Part 4 L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise) makes the last point exact. At 50% on 30 questions, the standard error is $\sqrt{0.5 \times 0.5 / 30} \approx 0.091$, about 9 points. A one-question gap is far inside that noise.

Other limits: GPT-4o-mini fell on AIME 2024, from 16.7 to 13.3. The memory depends on the order of the queries. The authors write that faulty heuristics can be amplified.

### 4.6 ACE: a playbook with small, checked changes

Agentic Context Engineering (ACE) treats the memory as an evolving "playbook" of many small bullets (Zhang et al., 2025, [arXiv:2510.04618](https://arxiv.org/abs/2510.04618)). It starts from two failures of earlier context-adaptation methods:

1. **Brevity bias:** "the tendency of optimization to collapse toward short, generic prompts". The paper names the prompt optimizer GEPA as an example ([L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization)).
2. **Context collapse:** it happens when an LLM fully rewrites the accumulated memory at each step. In one Dynamic Cheatsheet run on AppWorld, the memory had 18,282 tokens and accuracy 66.7. One step later, it "collapsed to just 122 tokens", and accuracy fell to 57.1. That is below the 63.7 of the agent with no adaptation.

ACE splits the work into three roles:

1. The **Generator** solves tasks with the current playbook, and marks which bullets helped or misled.
2. The **Reflector** critiques attempts to extract lessons "from successes and errors".
3. The **Curator** turns lessons into small delta entries. Plain code, not an LLM, merges them into the playbook.

> [!key] Context collapse
> 1. **Name and meaning:** context collapse is the loss of detail when a model rewrites its whole accumulated memory into a short summary.
> 2. **Problem it explains:** a memory that helped can suddenly stop helping, with no change to the model.
> 3. **Example:** a Dynamic Cheatsheet memory on AppWorld fell from 18,282 to 122 tokens in one step. Accuracy fell from 66.7 to 57.1.
> 4. **Link to RSI:** a self-improvement loop that rewrites its own memory can undo earlier gains. A persistent change is only useful if the update rule protects it.
> 5. **Limits:** ACE shows the problem on one benchmark, and says that it "is not specific to that method". Small delta updates reduce it but make the memory longer.

Each bullet has an ID, a helpful counter, a harmful counter and its content. New bullets are appended. Existing bullets are updated in place. Duplicates are removed by comparing embeddings.

> [!example] Delta update versus full rewrite (illustration)
> 1. Playbook: bullet b1 "Check the API's page size before you count items" (helpful 3, harmful 0). Bullet b2 "Use the first search result" (helpful 1, harmful 2).
> 2. A task fails because b2 picked a wrong result. The Curator emits two deltas: harmful count of b2 plus 1, and a new bullet b3 "Compare the top three results with the task text".
> 3. Plain code applies them. b1 stays exactly as it was.
> 4. A full rewrite by an LLM could instead return "Be careful with APIs", which loses b1's detail. That is context collapse in miniature.

**Measured** on AppWorld, an agent benchmark, with DeepSeek-V3.1 (average of four scores):

| Setting | Method | Labels used | Average |
|---|---|---|---|
| Base | ReAct agent | none | 42.4 |
| Offline | ReAct + GEPA | yes | 46.4 |
| Offline | ReAct + ACE | yes | 59.4 |
| Offline | ReAct + ACE | no | 57.2 |
| Online | ReAct + Dynamic Cheatsheet | no | 51.9 |
| Online | ReAct + ACE | no | 59.5 |

Two caveats change how you read this table. First, the 59.5 online result includes an offline warm-up, and online ACE alone scored 56.1 (v3, Table 3).

Second, feedback quality matters. On FiNER, a finance labeling task, the base model scored 70.7. Online ACE without labels scored 67.3, and Dynamic Cheatsheet without labels scored 68.3. The authors write: "context adaptation depends critically on feedback quality".

**Measured** cost (Table 4): offline adaptation on AppWorld took 9,517 seconds for ACE and 53,898 seconds for GEPA. But a long playbook costs input tokens at use time. ACE used 117.4% more raw input tokens than GEPA. **Claimed:** prompt caching makes this cheaper, and in one study 91.8% of ACE input tokens were cache hits.

The paper also has internal inconsistencies. Its text says that ACE beats two baselines by 12.3% and 11.9%. The table averages give gaps of about 13.4 and 13.0 points. Its limitation section names the weak point: ACE relies on "a reasonably strong Reflector". If the Reflector fails, the playbook "may become noisy or even harmful".

### 4.7 Memory in products

Products now ship memory features. These are **product features**: vendor descriptions, not research results, and no self-improvement benchmark supports them.

- **Agent Skills** (Anthropic, 16 October 2025): "organized folders of instructions, scripts, and resources that agents can discover and load dynamically". Only each skill's name and description sit in the prompt, and the rest loads when relevant. Users can ask the model to capture its successful approaches in a skill. **Speculation:** Anthropic writes, "we hope to enable agents to create, edit, and evaluate Skills on their own".
- **Project memory in Anthropic's coding agent** (documentation checked on 2026-10-19): the user writes instruction files. "Auto memory" adds "notes Claude writes itself based on your corrections and preferences". The model "treats them as context, not enforced configuration".
- **The memory tool and context editing** (Anthropic, 29 September 2025): file-based storage outside the context window. **Claimed:** an internal evaluation showed a 39% gain over baseline. It is not peer reviewed, and the model is not named.
- **ChatGPT memory** (OpenAI, from 13 February 2024): users can view, delete or turn off memories. The page says that OpenAI may use content, including memories, to improve its models. That is ordinary use of training data, not an agent that improves itself at run time.

**Our interpretation:** Agent Skills resemble Voyager's skill library: code plus a description, loaded on demand. The vendor does not make this claim.

### 4.8 What persists, what stays fixed, and where this sits on the ladder

Across all five research methods, one pattern holds:

1. **What changes and persists:** the memory, as skills, rules, workflows, a cheatsheet or a playbook.
2. **What stays fixed:** the model weights, and the procedure that writes the memory. The extraction prompts, the curator prompts, the counters and the merge code are all designed by people.
3. **Who checks the memory:** this varies, and it decides the results. Grounded checks gave large gains. Self-judgment without labels gave smaller gains or losses.

Part 2 places these methods at Level 2: an update of strategy or memory across tasks. Two cases need care.

- **Voyager stores code**, so it looks close to Level 3, a change to the agent's own implementation. **Our interpretation:** the skills are task programs that a fixed control loop calls. The loop, the prompts and the curriculum never change. So Voyager is Level 2, with a step toward Level 3.
- **ExpeL changes its own instructions**, because the rule list sits in its prompt. But the procedure that extracts rules is fixed. So the content of the instructions improves, while the way it learns does not.

None of these methods reaches Level 5. The memory improves the actor, but the reflector, curator or extractor is never a candidate for improvement. **Our interpretation:** call these methods self-improving at the context level, not recursive self-improvement in the strong sense.

### 4.9 Comparison table

| Method | What changes | What stays fixed | Feedback, and who gives it | Who checks memory before storing | What persists | Ladder level |
|---|---|---|---|---|---|---|
| Reflexion (from L1) | Notes for the next attempt | Model, prompts | Environment, exact match or self-written tests | The same evaluator | 1 to 3 notes, one task | Between 1 and 2 |
| Voyager | Skill library, curriculum record | Model, prompts, control loop | Environment, interpreter, GPT-4 check of game state | Success check on game state | Executable skills | 2, with a step toward 3 |
| ExpeL | Rule list, stored successes | Acting model, extraction procedure | Environment success on training tasks | Counters on rules | Rules and examples | 2 |
| AWM | Workflow memory | Model, induction prompt, evaluator | Labels (offline) or an LM evaluator (online) | The LM evaluator, accuracy not measured | Text workflows | 2 |
| Dynamic Cheatsheet | Cheatsheet of strategies and code | Model, curator prompt | The curator's own judgment, no labels | The same model | Curated memory | 2 |
| ACE | Itemized playbook | Model, role prompts, merge code | Labels or execution signals, read by the Reflector | Counters, de-duplication, delta merge | Playbook with counters | 2 |
| Product memory | Skill folders, memory files | Model | User corrections, model judgment | User review, if any | Files and saved memories | 2 (product) |

## 5. Graphs

```plot
{
  "title": "ALFWorld success % by Reflexion retry: ReAct + Reflexion (red), ExpeL retrieval only (gold), ExpeL + Reflexion (blue)",
  "xAxis": { "label": "retry on the test task (R0 = first attempt)", "domain": [-0.2, 3.2] },
  "yAxis": { "label": "success %", "domain": [35, 70] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 40.3], [1, 47.8], [2, 52.2], [3, 54.4]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 40.3], [1, 47.8], [2, 52.2], [3, 54.4]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 54.5], [1, 57.5], [2, 59.7], [3, 60.4]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0, 54.5], [1, 57.5], [2, 59.7], [3, 60.4]], "fnType": "points", "graphType": "scatter", "color": "#B8860B", "skipTip": true },
    { "points": [[0, 59.0], [1, 60.4], [2, 63.4], [3, 64.2]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 59.0], [1, 60.4], [2, 63.4], [3, 64.2]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true }
  ]
}
```

The values come from Zhao et al. (2023, Table 2). Memory across tasks (blue and gold) starts higher than retries within one task (red) can reach after three retries. The two kinds of memory also add: the blue line is highest.

## 6. Video and animation

No verified video covers Voyager, ExpeL, AWM, Dynamic Cheatsheet or ACE directly. Two videos support the background:

- [Reflection Agents](https://www.youtube.com/watch?v=v5ymBTXNqtk) (LangChain). It builds Reflexion's memory of notes (from 04:59), the starting point of section 4.3.
- [LLM Agents: History & Overview](https://www.youtube.com/watch?v=RM6ZArd2nVc) (Shunyu Yao, Berkeley). The speaker co-wrote Reflexion. The lecture explains the reason-act loop that ExpeL and AWM build on.

No animation is planned for this lesson.

## 7. Common mistakes

1. **"The agent learned, so its model got better."** In every method here, the weights stay frozen. Only the memory changes.
2. **"Dynamic Cheatsheet's AIME gain is a memory gain."** About half of it came from the prompt structure with an empty memory.
3. **"Online memory without labels is free improvement."** Without labels, ACE and Dynamic Cheatsheet fell below the base model on FiNER.
4. **"A full rewrite keeps the memory tidy."** Full rewrites caused context collapse: 18,282 tokens became 122, and accuracy fell below the baseline.
5. **"Voyager changes its own code, so it is a self-modifying agent."** It stores task programs. Its control loop, prompts and curriculum never change.
6. **"Memory products are evidence of self-improvement."** They are product features without published self-improvement benchmarks.

## 8. One-minute explanation

Memory methods keep a frozen model and let something persist across tasks. Voyager stores working programs as skills in Minecraft, checked against the game state. ExpeL distills rules with counters, and Agent Workflow Memory stores routines with placeholders. Dynamic Cheatsheet and ACE curate a running memory, and ACE uses small delta updates to avoid context collapse. Memory is only as good as the check before storage: grounded checks gave large gains, and self-judgment without labels gave small gains or losses. In all of these methods, the procedure that writes the memory is fixed, so they stop at Level 2 of the ladder.

## 9. Check questions

```check
{
  "question": "Dynamic Cheatsheet on AIME 2024 with Claude 3.5 Sonnet: BL 23.3%, DC-∅ 36.7%, DC-Cu 50.0%, on 30 questions. How many questions does each score represent, and how many questions of the gain come from the memory itself?",
  "hint": "One question is 100 / 30 ≈ 3.3 points.",
  "answer": "BL = 7 questions, DC-∅ = 11, DC-Cu = 15. The total gain is 8 questions. The empty-memory prompt gives 4 questions, and the memory gives the other 4. So about half of the gain is not memory. With only 30 questions, the standard error near 50% is about 9 points, so even the 4-question memory gain is not far outside the noise."
}
```

```check
{
  "question": "For each method, state what persists after a task ends: (a) Self-Refine, (b) Reflexion, (c) ExpeL, (d) Voyager, (e) Agent Workflow Memory.",
  "answer": "(a) Nothing. (b) 1 to 3 notes, only for the same task. (c) A rule list with importance counters, plus stored successful trajectories, for all later tasks. (d) A library of executable skills and the curriculum's record of tasks. (e) Text workflows with placeholders. In no case do the model weights change."
}
```

```check
{
  "question": "AWM's online mode raised WebArena success from 23.5% to 35.5%. Which fixed part limits this method most, and what failure can it cause?",
  "answer": "The LM evaluator that labels each online attempt as a success. The paper does not measure its error rate. If it labels a failed attempt as a success, AWM turns that attempt into a workflow, and later tasks reuse the wrong routine. The authors warn that incorrect workflows can degrade performance. The agent cannot repair the evaluator, because the evaluator is fixed and outside what the method changes."
}
```

```check
{
  "question": "ACE reports 59.5 average on AppWorld in the online setting without labels. What else must you know before you call this a pure online, label-free result?",
  "answer": "The 59.5 includes an offline warm-up. Online ACE alone scored 56.1 (v3, Table 3). The offline warm-up can use labels, so part of the gain comes from a different setting. You should also check the feedback quality. On FiNER without labels, ACE fell to 67.3, below the base model's 70.7. So the honest summary is 56.1 for online ACE alone, with gains that depend on the task and the feedback signal."
}
```

```check
{
  "question": "ExpeL with gpt-4 insights scored 39.0 on HotpotQA. With gpt-3.5-turbo insights it scored 32.0, the same as hand-written insights. The acting model was gpt-3.5-turbo in both cases. Is the 39.0 result self-improvement? Where does it sit on the ladder?",
  "answer": "Only partly. The gain over 32.0 comes from a stronger model, gpt-4, that writes the rules for a weaker acting model. That is closer to teaching than to self-improvement. ExpeL still sits at Level 2. Its rule list persists across tasks and changes the acting model's prompt. But the extraction procedure is fixed, and no part of the improver improves, so it does not reach Level 5."
}
```

## 10. Summary and links

- Memory methods keep the weights frozen and let skills, rules, workflows or playbooks persist across tasks. That is Level 2 of the ladder.
- Voyager's library of checked programs gave large gains in Minecraft. Removing self-verification cost 73% of the items found.
- ExpeL's rules with counters beat Reflexion's test-time retries without test-time feedback, but stronger-model insights carried part of the gain.
- Dynamic Cheatsheet shows a trap: half of the AIME gain came from the prompt with an empty memory.
- ACE avoids context collapse with small delta updates. Its results depend on labels or execution signals.
- The procedure that writes memory is always fixed. So these methods improve the actor, not the improver.

The next lesson moves the change from memory to the instructions themselves. Prompt optimizers search over instructions with a scored loop, and one of them, Promptbreeder, also changes the instructions that change instructions.

- Previous: [L1: Self-critique and iterative refinement](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement)
- Next: [L3: Prompt and instruction optimization](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization)
- Paper page: [2023: Voyager](/notes/ai/recursive-self-improvement/06-research-systems/p03-voyager)
- Failure modes: [L4: Self-evaluation failures](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l4-self-evaluation-failures) and [L5: Churn, bloat, lost behavior, drift and runaway cost](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift)

## References

- Guanzhi Wang, Yuqi Xie, Yunfan Jiang, et al. "Voyager: An Open-Ended Embodied Agent with Large Language Models". Transactions on Machine Learning Research, 2024. arXiv:2305.16291. https://arxiv.org/abs/2305.16291. Code: https://github.com/MineDojo/Voyager
- Andrew Zhao, Daniel Huang, Quentin Xu, Matthieu Lin, Yong-Jin Liu, Gao Huang. "ExpeL: LLM Agents Are Experiential Learners". AAAI 2024. arXiv:2308.10144. https://arxiv.org/abs/2308.10144. Code: https://github.com/LeapLabTHU/ExpeL
- Zora Zhiruo Wang, Jiayuan Mao, Daniel Fried, Graham Neubig. "Agent Workflow Memory". ICML 2025, PMLR 267. arXiv:2409.07429. https://arxiv.org/abs/2409.07429. Code: https://github.com/zorazrw/agent-workflow-memory
- Mirac Suzgun, Mert Yuksekgonul, Federico Bianchi, Dan Jurafsky, James Zou. "Dynamic Cheatsheet: Test-Time Learning with Adaptive Memory". EACL 2026. arXiv:2504.07952. https://arxiv.org/abs/2504.07952. Code: https://github.com/suzgunmirac/dynamic-cheatsheet
- Qizheng Zhang, Changran Hu, Shubhangi Upasani, et al. "Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models". ICLR 2026. arXiv:2510.04618. https://arxiv.org/abs/2510.04618. Code: https://github.com/ace-agent/ace
- Noah Shinn, Federico Cassano, Edward Berman, Ashwin Gopinath, Karthik Narasimhan, Shunyu Yao. "Reflexion: Language Agents with Verbal Reinforcement Learning". NeurIPS 2023. arXiv:2303.11366. https://arxiv.org/abs/2303.11366
- Barry Zhang, Keith Lazuka, Mahesh Murag. "Equipping agents for the real world with Agent Skills". Anthropic Engineering blog, 16 October 2025. https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Anthropic. "How Claude remembers your project" (documentation, read on 2026-10-19). https://code.claude.com/docs/en/memory
- Anthropic. Article on context management: the memory tool and context editing. 29 September 2025. https://claude.com/resources/articles/context-management
- OpenAI. ChatGPT memory announcement and updates. 13 February 2024, updated 2024–2025. https://openai.com/index/memory-and-new-controls-for-chatgpt/
