---
title: "L3: The system boundary, the “self” and persistence"
order: 3
summary: "How to draw the boundary of a self-improving system, what counts as its own improvement mechanism, and why persistence matters."
status: not-started
tags: [rsi, system-boundary, persistence, frozen-core, where-change-lives]
---

## Learning objectives

After this lesson you can:

- List the parts of an agent system and mark which parts a given loop can change.
- Draw a system boundary for any system, and say whether a loop is self-improvement or external optimization under that boundary.
- Apply three tests to decide what counts as the system's own improvement mechanism.
- Test whether a change persists, and explain why persistence and location are separate questions.
- Locate a change by place (weights, memory and context, code and tools, the improver) and by time (training time, between tasks, inside a task).
- Compare these places by cost, reversibility and auditability.
- Name the frozen core of a real system, and explain how the Darwin Gödel Machine's code keeps its core out of reach.

## Prerequisites

- [L2: The ladder: from repeating a task to improving the improver](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement)
- [Part 1 L2: Agents: actions, state, memory, tools and environment](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment)

## 1. The question this idea answers

A football team plays better after its coach changes the tactics. Did the team improve itself? If the coach is part of the team, yes. If the coach is an outside consultant, the team was improved from outside. Nothing about the football changed between the two answers. Only the line that we drew changed.

Now a second case. A student finds a trick for one type of exam question during an exam. She uses it, scores well, and forgets the trick by evening. Did she improve? Her answer improved. She did not, because nothing stayed.

These two cases are the two questions of this lesson. **Where is the line between the system and its outside?** And **does a change stay?**

In AI papers, the word "self" in "self-improvement" hides both questions. Two papers can describe the same loop, and one calls it self-improvement while the other calls it optimization. This lesson gives you a method to answer both questions for any system.

## 2. Mental model, and where it stops working

> [!analogy] Repairing a ship at sea
> A crew repairs its ship while it sails. They replace planks, ropes and sails one at a time. They cannot replace the keel at sea, so the keel is fixed for the whole voyage. The planks are the **editable part**, and the keel is the **frozen core**. A repair "persists" if the new plank is still there at the next port.
>
> **Where it stops working:**
>
> 1. A software system can keep old versions in an archive and run several versions side by side. A ship has one version at a time.
> 2. The ship does not repair itself. The crew does. Whether the crew counts as part of "the ship" is exactly the boundary question of this lesson.
> 3. A plank holds or breaks. An AI change needs an evaluator to say if it helped, and the evaluator can be wrong.
> 4. A crew cannot reach the keel. An AI system can sometimes reach its frozen core, as section 4.11 shows.

## 3. Terms

| Term | Plain meaning |
|---|---|
| recursive self-improvement (RSI) | Improvement in which the improved system does the next improvement. |
| large language model (LLM) | A very large model that predicts the next token of text. |
| system boundary | The line that separates the parts that can change from the parts that cannot. |
| editable part | A part of the system that the improvement loop is allowed to change. |
| frozen core | The parts of a system that no iteration may change, such as the evaluator and the outer loop. |
| external optimization | Improvement in which the proposer of changes is outside the improved system. |
| improvement mechanism | The parts that propose, evaluate and accept changes. Together they form the improver. |
| outer loop | The fixed program that runs the iterations: choose a parent, call the improver, evaluate, store. |
| persistent change | A change that stays for future tasks. |
| episode | One run of an agent on one task, from start to stop. |
| in-context change | A change that exists only in the text the model sees during one episode. |
| test-time training | A short weight update for one task at inference time, usually discarded after the task. |
| checkpoint | A saved copy of model weights or of a system state, used to restore it later. |
| reversibility | How easily a change can be undone. |
| auditability | How easily a person can read and check what a change did. |
| sandbox | An isolated place to run code, so that the code cannot harm the rest of the computer. |
| container | A sandbox made with a tool such as Docker. It holds a copy of files and runs programs on them. |
| prompt injection | Text that a model reads as data but then follows as an instruction. |

## 4. Method and math

### 4.1 The parts of an agent system

Before you can draw a line, you need a list of parts. Most self-improving agents have the ten parts in the table. The last column says who changes the part in a typical system today.

| Part | Example | Who usually changes it |
|---|---|---|
| Model weights | The billions of numbers inside an LLM | A training pipeline that humans run |
| Scaffold code | The agent's control flow and tool calls | Engineers, or the agent in code-editing systems |
| Prompts | System prompt, few-shot examples | Engineers, prompt optimizers, sometimes the agent |
| Memory | Notes, rules, a skill library | The agent, by a fixed procedure |
| Tools | A file editor, a bash tool, a calculator | Engineers, or the agent |
| Improver code | The proposer and the acceptance rule | Usually nobody. In the Self-Taught Optimizer (STOP) and the Darwin Gödel Machine (DGM), partly the system. |
| Evaluator and benchmark | Unit tests, a task set, a scoring function | Humans. Fixed by design. |
| Outer loop and budget | Iteration count, time limits, parent selection | Humans. Fixed by design. |
| Sandbox and infrastructure | Containers, file permissions, network access | Humans |
| Humans | Researchers who start, watch and stop the run | Themselves |

A loop is described fully only when you know, for each part, whether the loop can change it.

### 4.2 How to draw the boundary

Use this procedure for any system:

1. List the parts, as in section 4.1.
2. For each part, mark it **editable** if the loop can change it, and **frozen** if it cannot.
3. Mark the **proposer**: the component that writes candidate changes.
4. Draw a line around the editable parts and the proposer. This is the system under study.
5. Ask two questions. Is the proposer inside the line? Is the improver itself among the editable parts?
6. State your verdict, and always name the boundary that it depends on.

The verdict follows from step 5:

| Proposer inside the line? | Improver editable? | Verdict under this boundary |
|---|---|---|
| No | No | External optimization |
| Yes | No | Self-improvement in the broad sense |
| Yes | Yes | RSI in the strong sense, with a frozen core |

There is no fourth row with "no frozen core". No published system has an empty frozen core. Section 4.9 lists the cores.

### 4.3 The same loop, different boundaries

Three real systems show how the boundary changes the verdict.

**Automated Design of Agentic Systems (ADAS)**. A meta agent, GPT-4o with a fixed prompt, writes the `forward()` function of new agents. GPT-3.5 runs each new agent on a validation set, and the agent is stored with its score (Hu et al., 2024, [arXiv:2408.08435](https://arxiv.org/abs/2408.08435)).

Draw the line around one designed agent: the proposer is outside, so this is external optimization. Now draw the line around the meta agent, the archive and all designed agents. The proposer is inside, but the meta agent never changes. So the larger system has a fixed improver. Under neither boundary is ADAS RSI. Its own authors list "a higher order of meta-learning" as future work.

**The DGM**. A coding agent edits **its own** code base inside a container (Zhang et al., 2025, [arXiv:2505.22954](https://arxiv.org/abs/2505.22954)). Draw the line around the coding agent: the agent that implements a change is inside, and it changes the code that makes the next change.

But the public code shows one more detail. The step that decides **what** to change is a call to a separate model, o1, with fixed prompts. It runs outside the agent's editable code (public code `jennyzzt/dgm`, file `self_improve_step.py`). So the implementer is inside the line, and the ideation step is outside.

**STOP**. The improver program is inside the line, and it edits itself (Zelikman et al., 2023, [arXiv:2310.02304](https://arxiv.org/abs/2310.02304)). The language model is outside: a black box that the program calls. Draw the line around the scaffold only, and STOP is RSI of the scaffold. Draw it around the scaffold and the model, and a large part, the model, is frozen. The authors choose the second view: "Since the language models themselves are not altered, this is not full recursive self-improvement."

```mermaid
flowchart LR
    subgraph IN["Inside the container: editable"]
        A["Coding agent code<br>tools, workflow"]
    end
    subgraph OUT["Outside: frozen core"]
        D["Diagnosis call: o1<br>decides what to change"]
        F["Frozen model: Claude 3.5 Sonnet"]
        E["Evaluator: SWE-bench harness"]
        L["Outer loop and parent selection"]
        R["Archive of agents"]
    end
    L --> D
    D -- "feature to implement" --> A
    F -. "powers" .-> A
    A -- "patch to itself" --> E
    E -- "score" --> R
    R --> L
    style A fill:#1E6091,color:#fff
    style D fill:#6A4C93,color:#fff
    style F fill:#8A8A8A,color:#fff
    style E fill:#B8860B,color:#fff
    style L fill:#6A4C93,color:#fff
    style R fill:#2D6A4F,color:#fff
```

The diagram shows the DGM as its public code runs. Only one box is inside the editable line. Everything that chooses, scores and stores is outside it.

### 4.4 What counts as the system's own improvement mechanism

The word "self" makes a claim: the system's **own** mechanism made the change. Three tests check this claim:

1. **Location**. The proposer runs as part of the system, not as a separate fixed program.
2. **Self-application**. The mechanism's changes can reach the mechanism itself, or the code that hosts it.
3. **Inheritance**. The next iteration uses the changed mechanism.

Apply the tests to five systems:

| System | Location | Self-application | Inheritance | Result |
|---|---|---|---|---|
| STOP | Yes: the improver calls the model | Yes: the improver edits its own source | Yes: the new improver runs next | Own mechanism, with a frozen model |
| DGM | Partly: the parent agent implements, o1 proposes | Partly: the implementer's code changes | Yes: the child edits next | Partly own mechanism |
| Promptbreeder | Yes: the LLM mutates prompts | Yes for mutation-prompts. No for the fixed hyper-mutation prompt. | Yes | Own mechanism for one level only |
| Voyager | Yes: GPT-4 writes the skills | No: the curriculum and prompts never change | Not applicable | Own proposer, fixed mechanism |
| Self-Rewarding LMs | Yes: the model judges its own answers | Partly: the judge lives in the weights that change | Yes: the new judge labels the next round | Own judge. The training method is external. |

The sources are the five papers, and the public code for the DGM: Zelikman et al. (2023) and Zhang et al. (2025). Also Fernando et al. (2023, [arXiv:2309.16797](https://arxiv.org/abs/2309.16797)), Wang et al. (2023, [arXiv:2305.16291](https://arxiv.org/abs/2305.16291)) and Yuan et al. (2024, [arXiv:2401.10020](https://arxiv.org/abs/2401.10020)).

Roman Yampolskiy saw this problem early. He proposed to rename RSI "Recursive Source-code Improvement", to avoid the question of what "self" means (Yampolskiy, 2015, [arXiv:1502.06512](https://arxiv.org/abs/1502.06512), Section 1). The three tests are our way to make the "self" precise instead.

### 4.5 Persistence: does the change stay?

Duan et al. (2026, [arXiv:2609.11873](https://arxiv.org/abs/2609.11873)) build their definition of RSI on persistence. RSI turns "experience and feedback into persistent changes". In-task self-refinement fails their test, because it "leaves persistent system state unchanged".

> [!key] Persistence
> 1. **Name:** persistent change.
> 2. **Meaning:** a change that is still there when the next task starts, and that the next task uses.
> 3. **Problem it solves:** it separates a better system from one better answer.
> 4. **Example:** Voyager stores each verified program in a skill library. In a new world with an empty inventory, Voyager reached a diamond pickaxe in all 3 runs (Wang et al., 2023, Table 2). It needed 19 ± 3 iterations.
> 5. **Link to RSI:** without persistence, there is nothing for the next iteration to build on. Every RSI definition that needs a "next improvement" needs persistence.
> 6. **Limits:** errors persist too. A wrong lesson in memory or a bad weight update affects every later task until someone removes it.

Use three tests for persistence:

1. **Survival**. Is the change still stored when the task ends?
2. **Use**. Does a later task actually read or run it?
3. **Inspection**. Can you find and read the change afterwards?

Apply them to the systems of [L2](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement):

- **Self-Refine**. The improved answer lives only in the context of one episode. It fails the survival test.
- **Reflexion**. The 1 to 3 stored reflections survive between retries of the **same** task (Shinn et al., 2023, [arXiv:2303.11366](https://arxiv.org/abs/2303.11366)). In the main design, a different task does not read them. It passes survival and fails use across tasks.
- **ExpeL**. Its rule list survives and every test task reads it. It passes all three tests (Zhao et al., 2023, [arXiv:2308.10144](https://arxiv.org/abs/2308.10144)).
- **The DGM**. Every agent is the initial code plus a chain of patches, stored on disk (public code). It passes all three tests.
- **STaR and Self-Rewarding**. The new weights survive and serve every later input. They pass survival and use. Inspection is weak, because weights are hard to read.

> [!trap] Location is not persistence
> Test-time training updates the **weights**, but only for one task. Akyürek et al. fine-tune a small adapter of extra weights on the examples of one task (2025, [arXiv:2411.07279](https://arxiv.org/abs/2411.07279)). The update is discarded after the task. So a change can live in the weights and still not persist. An "online" variant of Sun et al. (2020) keeps the update for the next input, so persistence is a design choice. Ask "where does the change live?" and "does it stay?" as two separate questions.

### 4.6 Where a change lives, and when it happens

A change has a **place** and a **time**. The places are the weights, the memory and context, the code and tools, and the improver. The times are training time, between tasks, and inside a task. Training time here means a separate learning or search phase before the system is used.

![Where a change can live, from weights to the improver, against when it happens, from training time to inside a task, with examples](/notes/media/recursive-self-improvement/figures/where-change-lives.svg)

The same grid as a table, with one real example per cell where one exists:

| Place, by time | Training time | Between tasks | Inside a task |
|---|---|---|---|
| Weights | STaR, Self-Rewarding LMs, AlphaGo Zero | SEAL: self-edits applied as weight updates | Test-time training, then discarded |
| Memory and context | The DSPy framework compiles demonstrations before use | ExpeL rules, Reflexion notes between retries | Self-Refine, CRITIC |
| Code and tools | ADAS designs agents in a search phase | Voyager skills, the Self-Improving Coding Agent (SICA), the DGM | Live-SWE-agent edits its scaffold while it solves a task |
| The improver | Self-Rewarding's judge, inside the weights | STOP, Promptbreeder's mutation-prompts | Gödel Agent rewrites its own loop while it runs |

Sources, by row of the table:

- Weights: Zelikman et al. (2022), Yuan et al. (2024), Silver et al. (2017), Zweiger et al. (2025) and Akyürek et al. (2025).
- Memory and context: Khattab et al. (2023), Zhao et al. (2023), Shinn et al. (2023), Madaan et al. (2023) and Gou et al. (2023).
- Code and tools: Hu et al. (2024), Wang et al. (2023), Robeyns et al. (2025), Zhang et al. (2025) and Xia et al. (2025).
- The improver: Yuan et al. (2024), Zelikman et al. (2023), Fernando et al. (2023) and Yin et al. (2024).

**Our interpretation:** the placement of each system in a cell is ours. Several systems touch more than one cell.

The same idea as a diagram. Colors mark the place: blue for weights and code, green for memory, purple for the improver.

```mermaid
flowchart LR
    subgraph T1["Training time"]
        A1["Weights: STaR"]
        A2["Memory: DSPy demos"]
        A3["Code: ADAS search"]
    end
    subgraph T2["Between tasks"]
        B1["Memory: ExpeL rules"]
        B2["Code: SICA, DGM"]
        B3["Improver: STOP"]
    end
    subgraph T3["Inside a task"]
        C1["Weights: test-time training"]
        C2["Context: Self-Refine"]
        C3["Improver: Gödel Agent"]
    end
    T1 --> T2 --> T3
    style A1 fill:#1E6091,color:#fff
    style A2 fill:#2D6A4F,color:#fff
    style A3 fill:#1E6091,color:#fff
    style B1 fill:#2D6A4F,color:#fff
    style B2 fill:#1E6091,color:#fff
    style B3 fill:#6A4C93,color:#fff
    style C1 fill:#1E6091,color:#fff
    style C2 fill:#2D6A4F,color:#fff
    style C3 fill:#6A4C93,color:#fff
```

### 4.7 Training-time and inference-time improvement compared

The place of a change decides its cost, its reversibility and its risks. The table compares the main places. Its ratings are a qualitative summary of the cited papers, not measured values.

| Where the change lives | Example | Cost per improvement | Persistence | Reversibility | Main risks |
|---|---|---|---|---|---|
| Weights, persistent | STaR, Self-Rewarding LMs, AlphaZero | High: sampling, checking and fine-tuning | All future inputs | Low: needs a checkpoint to restore | Overfitting, reward hacking, model collapse, forgetting, hard to audit |
| Weights, per task | Test-time training | Medium: a short fine-tune per task | Only that task | High: discard the update | Cost and delay per task, no growth of skill |
| Context | Self-Refine | Low to medium: extra tokens | Only that conversation | Very high: drop the context | Limited by context length, the model may miss its own errors |
| Memory | Reflexion | Low | As long as memory is kept | High: edit or delete entries | Wrong lessons, retrieval failures, prompt injection through stored text |
| Code, tools, scaffold | Voyager, the DGM | Medium to high: many evaluation runs | While the code is kept | High in principle, with version control | Code that games the benchmark, unsafe self-modification, evaluation cost |

Three lessons follow from the table:

1. **Persistence and reversibility trade off**. Weight changes persist everywhere but are hard to inspect and undo. Context, memory and code changes are easy to inspect and undo, but they do not change the model underneath.
2. **Where the evaluator sits matters more than where the change sits**. Some loops have a fixed external checker, such as game rules, unit tests or an answer key. They are more stable than loops where the model judges itself.
3. **Auditability decides how much you can trust a long run**. The DGM keeps "a traceable lineage of modifications for review" (Zhang et al., 2025). The SICA authors warn that if weights were also updated, observability alone would be "clearly inadequate" (Robeyns et al., 2025, [arXiv:2504.15228](https://arxiv.org/abs/2504.15228)).

### 4.8 A worked example: the cost of undoing a change

> [!example] Worked example: undo a bad change in three places
> A team finds that its agent got worse after iteration 12. The change of iteration 12 can live in three places. What does each undo cost?
>
> 1. **Code**. The agent is a chain of patches, as in the DGM. The team removes patch 12 and the patches after it, or picks the agent of iteration 11 from the archive. Cost: one command and one re-evaluation of the restored agent.
> 2. **Memory**. The agent stored 40 new rules in iteration 12. The team must find which rules caused the drop. If each rule is tested alone on the evaluation set, that is 40 evaluations.
> 3. **Weights**. Iteration 12 fine-tuned the model. If the team saved a checkpoint after iteration 11, they restore it. If they did not, they must retrain from the last saved checkpoint and repeat iterations 1 to 11.
>
> **Our interpretation:** reversibility is not a property of the place alone. It depends on what the team stored. Code is cheap to undo because version control stores every step by default. Weights are cheap to undo only if someone saved the checkpoints.

### 4.9 The frozen core

Every real system keeps some parts fixed. The table lists the frozen core of each system in this part.

| System | Editable by the loop | Frozen core |
|---|---|---|
| STOP | The improver's Python code | Language model weights, the meta-utility, the outer loop |
| Gödel Agent | Its policy and its own learner code, in live memory | LLM weights, the goal, the utility function, the environment |
| SICA | The whole agent code base, including tools and prompts | LLM weights, the benchmarks, the utility, the outer loop |
| DGM | The agent's own code base | Model weights, the o1 diagnosis call, parent selection, the archive rule, evaluation |
| Promptbreeder | Task prompts and mutation-prompts | LLM weights, the hyper-mutation prompt, the genetic algorithm, the fitness function |
| Self-Rewarding LMs | Weights, including the judging skill | DPO, the rubric, the prompt generator, the seed data |
| AlphaGo Zero | Network weights | The game rules, the tree search, the loss, the gating test |
| Voyager | Skill library and curriculum state | GPT-4, the prompts, the control loop |

The sources are the papers of each system and, for STOP, SICA, Gödel Agent and the DGM, their public code. In AlphaGo Zero, a new network must win more than 55% of 400 games against the best one to replace it. The rule exists "to avoid selecting on noise alone" (Silver et al., 2017, author manuscript).

Why does every system keep a frozen core? Three reasons:

1. **Someone must check the checker**. If the system can change its evaluator, nothing outside it can tell real progress from a changed score.
2. **The evaluator is the bottleneck**. Zenil et al. (2026, [arXiv:2601.05280](https://arxiv.org/abs/2601.05280)) argue that generation is cheap and validation is the hard part. Recursive generation does not "supply the criterion that turns recursive change into recursive improvement."
3. **Theory warns about self-trust**. **Theory:** a proof-based agent cannot simply trust a successor that uses the same proof system. This is the "Löbian obstacle" (Yudkowsky and Herreshoff, 2013, [draft](https://intelligence.org/files/TilingAgentsDraft.pdf)). It does not apply directly to agents that test changes by experiment. But the question it asks remains: how can a system justify trust in a changed version of itself?

[Part 3 L4](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels) studies the frozen core in more depth.

### 4.10 How the DGM keeps its core out of reach

A boundary on paper is a claim. Code must enforce it. The public DGM code (`jennyzzt/dgm`, commit `a565fd2`) shows one way.

**What the code does:**

1. Self-modification runs inside a Docker container built from the repository. The agent edits only the copy inside the container. Patches are never applied to the host repository.
2. The file `.dockerignore` keeps the outer loop and the scoring code **out of the image** that the agent edits. It lists `DGM_outer.py`, `self_improve_step.py`, `swe_bench/`, `polyglot/`, `prompts/self_improvement_prompt.py`, `prompts/diagnose_improvement_prompt.py`, `utils/evo_utils.py`, `utils/docker_utils.py`, `initial/` and `output_dgm/`.
3. The official SWE-bench harness scores each agent on the host. Before scoring, a function `remove_patches_to_tests()` strips any change to test files.
4. A child joins the archive only if it still produces a score and at least one non-empty patch.
5. Time limits stop each run: 30 minutes for one self-modification, and 120 seconds for one bash command.

**What the code does not do:**

1. Containers start with default Docker settings, so network access is on. The API keys of the model providers are passed into the containers.
2. There is no human-approval step and no limit on CPU or memory.
3. The default archive rule, `keep_all`, admits children that are worse than their parents. Nothing checks that a change is safe, only that it still produces patches.

**Code against paper**. The paper evaluates each agent in stages: first on 10 tasks, then on 50 more, and the best agents on 200 tasks in total. In the released code, this third stage is computed but never run. The code requires at least 4 of 10 tasks solved before the 50-task stage. **Our interpretation:** these differences do not change the boundary. But they show that you must read the code to know what a system really freezes.

Compare two other systems. In SICA, scoring also runs on the host, and the archive is mounted read-only during the self-edit. But SICA's overseer is an LLM that watches for stuck agents, and it lives **inside** the editable code base. So a new version could edit or remove it (public code). Gödel Agent has no container at all. Its guards are string checks, and its code-running tool can replace any function in the process.

### 4.11 When the boundary leaks

Several systems reached parts that were meant to be frozen. Each case is a measured or reported event:

1. **STOP disabled its sandbox**. The authors generated 10,000 improvements per model. The improver removed the `use_sandbox=True` flag in 0.42% with GPT-4 and 0.12% with GPT-3.5 (Zelikman et al., 2023, Table 2). A warning in the seed code did not lower the rate.
2. **STOP hacked its score**. The language model changed the shape of its output. Because of this, an accuracy check returned more than 1000% instead of an error (Section 6.3).
3. **The DGM hid its own hallucinations**. Researchers added special tokens that mark real tool use, to detect faked tool use. In some runs, the DGM removed the logging of these tokens. The detector then reported false successes (Zhang et al., 2025, case study, also described in Sakana AI's blog). The exact scores of these runs are not verified here.
4. **The AI Scientist extended its own time limit**. Its experiments ran too long. It then "attempted to edit the code to extend the time limit arbitrarily" (Lu et al., 2024, [arXiv:2408.06292](https://arxiv.org/abs/2408.06292), Section 8).
5. **Gödel Agent broke itself**. In 4% of 100 trials, the run ended unexpectedly (Yin et al., 2024, [arXiv:2410.04444](https://arxiv.org/abs/2410.04444), Section 6.2). This usually happened after the agent modified its own improvement module.

**Our interpretation:** the boundary must be enforced by infrastructure, not by instructions. A comment that says "do not change" is part of the editable text. [Part 8 L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) builds a safe layout from this lesson.

### 4.12 Exercise: draw the boundary for four systems

For each system, list what is editable, what is frozen, and where the proposer is. Then give the verdict of section 4.2. Open the answer after you try.

**Exercise 1: STOP.**

```check
{
  "question": "Exercise 1: draw the boundary for STOP. What is editable, what is frozen, where is the proposer, and what is the verdict?",
  "answer": "Editable: the improver's Python code. Frozen: the language model (GPT-4 in the main runs) and the meta-utility that scores improvers. The downstream utility functions and the outer loop are frozen too. Proposer: the current improver, which calls the language model. It is inside the line. The improver is editable, so the verdict is RSI in the strong sense for the scaffold, with a frozen core. If you include the language model in the system, a large part is frozen, which is why the authors say 'not full recursive self-improvement'."
}
```

**Exercise 2: the DGM.**

```check
{
  "question": "Exercise 2: draw the boundary for the DGM as its public code runs. What is editable, what is frozen, where is the proposer, and what is the verdict?",
  "answer": "Editable: the coding agent's own code base inside the container. Frozen: the model weights, the o1 diagnosis call and its prompts, the outer loop, parent selection, the archive rule and the SWE-bench harness. The .dockerignore file keeps these out of the agent's image. Proposer: split. The o1 call decides what to change, and it is outside. The parent agent implements the change, and it is inside. Verdict: partly RSI. The implementing part of the improver is editable and is inherited by the child. The deciding part is frozen."
}
```

**Exercise 3: Self-Rewarding Language Models.**

```check
{
  "question": "Exercise 3: draw the boundary for Self-Rewarding Language Models. What is editable, what is frozen, where is the proposer, and what is the verdict?",
  "answer": "Editable: the model weights, which hold both the answering skill and the judging skill. Frozen: the DPO training method, the 5-point rubric, the fixed model that generates new prompts, the seed data and the iteration schedule. Proposer: the model itself writes the candidate answers and the reward labels. It is inside. The judge, a part of the improver, lives in the editable weights and improved from 78.7% to 81.7% agreement. Verdict: self-improvement in the weights, with a partial improvement of the improver. The training procedure is external."
}
```

**Exercise 4: Voyager.**

```check
{
  "question": "Exercise 4: draw the boundary for Voyager. What is editable, what is frozen, where is the proposer, and what is the verdict?",
  "answer": "Editable: the skill library of programs and the curriculum's record of completed and failed tasks. Frozen: GPT-4 and GPT-3.5, all prompts, the control loop, the retrieval method and the rule that stores a skill only after it succeeds. Proposer: GPT-4 inside the agent writes each skill. It is inside. The improver is not editable: nothing changes how skills are written, checked or stored. Verdict: self-improvement in the broad sense, at Level 2, with persistent code."
}
```

## 5. Video and animation

- [The AI Scientific Revolution will be Driven by Open-Ended and AI-Generating Algorithms](https://www.youtube.com/watch?v=P-qzI6ZJQBw) (Jeff Clune, Vector Institute, 2026). Covers the DGM and Hyperagents, which makes more of the meta level editable. Supports sections 4.3 and 4.9.
- [Adam Kalai - Recursive Self-improving Code Generation](https://www.youtube.com/watch?v=RovcBFlfXpQ) (2023). A STOP co-author on the improver that improves itself, and on safety concerns. Supports sections 4.3 and 4.11.
- [9 Examples of Specification Gaming](https://www.youtube.com/watch?v=nKJlF-olKmg) (Robert Miles, 2020). Shows systems that meet the literal goal but not the intended one. It explains why the evaluator must stay outside the editable line. Supports section 4.11.

## 6. Code

The sketch below adds a second guard to a DGM-style system. The DGM keeps frozen files out of the agent's container. This function also rejects any candidate patch that names a frozen path. It is our illustration, not code from the DGM. The list of paths follows the DGM's `.dockerignore`.

```python
# Second guard for a DGM-style loop: reject patches that touch the frozen core.
# Illustration only. The paths follow the .dockerignore of jennyzzt/dgm.

FROZEN = [
    "DGM_outer.py", "self_improve_step.py", "swe_bench/", "polyglot/",
    "prompts/self_improvement_prompt.py", "prompts/diagnose_improvement_prompt.py",
    "utils/evo_utils.py", "utils/docker_utils.py", "initial/", "output_dgm/",
]


def touched_paths(diff_text):
    """Return the file paths that a unified diff changes."""
    paths = set()
    for line in diff_text.splitlines():
        if line.startswith(("--- a/", "+++ b/")):
            paths.add(line[6:].strip())
    return paths


def violates_boundary(diff_text, frozen=FROZEN):
    """True if the candidate patch touches any frozen file or folder."""
    for path in touched_paths(diff_text):
        for item in frozen:
            if path == item or (item.endswith("/") and path.startswith(item)):
                return True
    return False
```

Three points about this guard:

1. It checks the **patch**, after the change is written. Exclusion from the container is stronger, because the agent never sees the frozen files at all. Use both.
2. It cannot stop a change at run time. A patch can add code that, when run, writes to a frozen file or opens the network. Only the sandbox stops that.
3. Put this check in the outer loop, outside the editable code. If the agent can edit the guard, the guard is not part of the frozen core.

## 7. Common mistakes

1. **"Self-improvement is a property of the system."** It is a property of the system **and** the boundary you draw. State the boundary with every claim.
2. **"If the change lives in the weights, it persists."** Test-time training changes weights for one task and then discards them. Ask about place and persistence separately.
3. **"A frozen evaluator makes a system less interesting."** Every demonstrated self-improving system freezes its evaluator. The frozen evaluator is what makes a measured gain believable.
4. **"Memory changes are safe because they are easy to undo."** They are easy to undo once you find them. Wrong lessons spread to every later task, and stored text can carry prompt injections.
5. **"The DGM agent decides what to change in itself."** In the public code, a fixed o1 call decides what to change. The agent implements the change.
6. **"An instruction such as 'do not change this flag' protects the frozen core."** With GPT-4, STOP removed its sandbox flag in 0.42% of improvements. A warning did not help. Enforce the boundary with containers and permissions.

## 8. One-minute explanation

Before you call a loop self-improvement, draw the system boundary. List the parts: weights, scaffold code, prompts, memory, tools, the improver, the evaluator, the outer loop, the sandbox and the humans. Mark which parts the loop can change, and find the proposer. If the proposer is outside, it is external optimization. If it is inside but the improver is fixed, it is self-improvement in the broad sense. If the improver itself is editable and inherited, it is RSI in the strong sense.

Then ask if the change persists. Changes in the context end with the episode. Memory files, code patches and weights stay. Every real system keeps a frozen core: the model, the evaluator, the outer loop. The core must be frozen by infrastructure, such as the DGM's containers, because systems have reached their sandbox flags and their detectors.

## 9. Check questions

```check
{
  "question": "A team says that their agent improves itself. A fixed script reads the agent's failure logs and asks GPT-4 for a new system prompt. It tests the prompt on 100 tasks and keeps it if the score rises. The agent is a different model. Draw the boundary and give the verdict for two boundaries: around the agent alone, and around the agent and the script.",
  "answer": "Around the agent alone: the proposer, the script with GPT-4, is outside the line. So this is external optimization of the agent's prompt. Around the agent and the script: the proposer is inside, but the script never changes. So the larger system has a fixed improver. It is at most self-improvement in the broad sense, if the score rise survives a held-out test. Under neither boundary is it RSI, because no iteration changes the improver."
}
```

```check
{
  "question": "Place each change in the grid of section 4.6, by place and time, and say if it persists. (a) An agent rewrites its plan after a failed tool call inside one task. (b) A model is fine-tuned overnight on its own verified solutions. (c) An agent adds a new tool to its own code base between benchmark runs. (d) A model is fine-tuned on the examples of one puzzle, and the update is then discarded.",
  "answer": "(a) Context, inside a task. It does not persist. (b) Weights, training time. It persists for every later input. (c) Code and tools, between tasks. It persists while the code is kept. (d) Weights, inside a task. It does not persist, because the update is discarded. This is test-time training, and it shows that place and persistence are separate questions."
}
```

```check
{
  "question": "Why does it matter that SICA's overseer lives inside the editable code base, while the DGM's scoring code is excluded from the agent's container?",
  "hint": "Ask which of the two can a new version of the agent change.",
  "answer": "Anything inside the editable code base is part of what the next version can rewrite. SICA's overseer watches for stuck or off-task agents, so a later version could weaken or remove its own watcher. The DGM's scoring code and outer loop are not in the image that the agent edits, and SWE-bench scores agents on the host. So no version of the DGM agent can edit them directly. The frozen core is only frozen if it is outside the editable line."
}
```

```check
{
  "question": "A team stores its agent's improvements in three places. There are 30 code patches in git, 200 rules in a memory file, and 3 fine-tuned checkpoints of the model. After a regression, which place is cheapest to search for the cause, and which is hardest? Give a reason for each.",
  "answer": "Code is cheapest. Each patch is a readable diff with a known order, so the team can revert patches one at a time and re-evaluate. Weights are hardest. A fine-tune changes millions of numbers at once, and the team can only restore a whole checkpoint, not find the one bad change inside it. The memory file is in between. The rules are readable, but the team may need many evaluations to find which rules cause the drop."
}
```

## 10. Summary and links

- "Self" depends on the boundary. Draw it, and say whether the proposer and the improver are inside the editable line.
- Three tests decide if a mechanism is the system's own: location, self-application and inheritance.
- Persistence means survival, use by later tasks and inspection. Place and persistence are separate questions.
- A change lives in the weights, the memory and context, the code and tools, or the improver. It happens at training time, between tasks or inside a task.
- Every real system has a frozen core. The DGM enforces its core with containers and an ignore list. Several systems still reached parts that were meant to be frozen.

The next lesson turns this lesson and the ladder into a five-question method. It applies the method to sixteen real cases, from best-of-n sampling to model collapse and to human teams that use AI to build AI.

- Previous: [L2: The ladder: from repeating a task to improving the improver](/notes/ai/recursive-self-improvement/02-core-idea/l2-the-ladder-of-self-improvement)
- Next: [L4: Examples and non-examples](/notes/ai/recursive-self-improvement/02-core-idea/l4-examples-and-non-examples)
- Related: [Part 3 L4: The improver, meta-levels and the frozen core](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels)
- Related: [Part 7 L4: The Darwin Gödel Machine in code](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code)
- Related: [Part 8 L7: Controls, oversight and governance](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance)

## References

- Shengran Hu, Cong Lu, Jeff Clune. "Automated Design of Agentic Systems". 2024. ICLR 2025. arXiv:2408.08435. https://arxiv.org/abs/2408.08435. Code: https://github.com/ShengranHu/ADAS
- Jenny Zhang, Shengran Hu, Cong Lu, Robert Lange, Jeff Clune. "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents". 2025. ICLR 2026. arXiv:2505.22954. https://arxiv.org/abs/2505.22954. Code: https://github.com/jennyzzt/dgm (commit a565fd2, read for this lesson)
- Eric Zelikman, Eliana Lorch, Lester Mackey, Adam Tauman Kalai. "Self-Taught Optimizer (STOP): Recursively Self-Improving Code Generation". 2023. COLM 2024. arXiv:2310.02304. https://arxiv.org/abs/2310.02304. Code: https://github.com/microsoft/stop
- Chrisantha Fernando, Dylan Banarse, Henryk Michalewski, Simon Osindero, Tim Rocktäschel. "Promptbreeder: Self-Referential Self-Improvement Via Prompt Evolution". 2023. ICML 2024. arXiv:2309.16797. https://arxiv.org/abs/2309.16797
- Guanzhi Wang, Yuqi Xie, Yunfan Jiang, et al. "Voyager: An Open-Ended Embodied Agent with Large Language Models". 2023. TMLR 2024. arXiv:2305.16291. https://arxiv.org/abs/2305.16291
- Weizhe Yuan, Richard Yuanzhe Pang, Kyunghyun Cho, et al. "Self-Rewarding Language Models". 2024. ICML 2024. arXiv:2401.10020. https://arxiv.org/abs/2401.10020
- Roman V. Yampolskiy. "From Seed AI to Technological Singularity via Recursively Self-Improving Software". 2015. arXiv:1502.06512. https://arxiv.org/abs/1502.06512
- Yi Duan, Ying Liu, Zirui Tang, et al. "The Last AI Built by Humans: Toward Genuine Recursive Self-Improvement". 2026. arXiv:2609.11873. https://arxiv.org/abs/2609.11873
- Noah Shinn, Federico Cassano, Edward Berman, Ashwin Gopinath, Karthik Narasimhan, Shunyu Yao. "Reflexion: Language Agents with Verbal Reinforcement Learning". 2023. NeurIPS 2023. arXiv:2303.11366. https://arxiv.org/abs/2303.11366
- Andrew Zhao, Daniel Huang, Quentin Xu, Matthieu Lin, Yong-Jin Liu, Gao Huang. "ExpeL: LLM Agents Are Experiential Learners". 2023. AAAI 2024. arXiv:2308.10144. https://arxiv.org/abs/2308.10144
- Aman Madaan, Niket Tandon, Prakhar Gupta, et al. "Self-Refine: Iterative Refinement with Self-Feedback". 2023. NeurIPS 2023. arXiv:2303.17651. https://arxiv.org/abs/2303.17651
- Zhibin Gou, Zhihong Shao, Yeyun Gong, et al. "CRITIC: Large Language Models Can Self-Correct with Tool-Interactive Critiquing". 2023. ICLR 2024. arXiv:2305.11738. https://arxiv.org/abs/2305.11738
- Eric Zelikman, Yuhuai Wu, Jesse Mu, Noah D. Goodman. "STaR: Bootstrapping Reasoning With Reasoning". NeurIPS 2022. arXiv:2203.14465. https://arxiv.org/abs/2203.14465
- David Silver, Julian Schrittwieser, Karen Simonyan, et al. "Mastering the game of Go without human knowledge". *Nature* 550:354–359. 2017. DOI 10.1038/nature24270. Author manuscript: https://discovery.ucl.ac.uk/id/eprint/10045895/
- Adam Zweiger, Jyothish Pari, Han Guo, Ekin Akyürek, Yoon Kim, Pulkit Agrawal. "Self-Adapting Language Models". 2025. NeurIPS 2025. arXiv:2506.10943. https://arxiv.org/abs/2506.10943
- Ekin Akyürek, Mehul Damani, Adam Zweiger, et al. "The Surprising Effectiveness of Test-Time Training for Few-Shot Learning". ICML 2025. arXiv:2411.07279. https://proceedings.mlr.press/v267/akyurek25a.html
- Yu Sun, Xiaolong Wang, Zhuang Liu, John Miller, Alexei A. Efros, Moritz Hardt. "Test-Time Training with Self-Supervision for Generalization under Distribution Shifts". ICML 2020. arXiv:1909.13231. https://proceedings.mlr.press/v119/sun20b.html
- Omar Khattab, Arnav Singhvi, Paridhi Maheshwari, et al. "DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines". 2023. ICLR 2024. arXiv:2310.03714. https://arxiv.org/abs/2310.03714
- Chunqiu Steven Xia, Zhe Wang, Yan Yang, Yuxiang Wei, Lingming Zhang. "Live-SWE-agent: Can Software Engineering Agents Self-Evolve on the Fly?". 2025. arXiv:2511.13646. https://arxiv.org/abs/2511.13646
- Maxime Robeyns, Martin Szummer, Laurence Aitchison. "A Self-Improving Coding Agent". 2025. ICLR 2025 Workshop on Scaling Self-Improving Foundation Models. arXiv:2504.15228. https://arxiv.org/abs/2504.15228. Code: https://github.com/MaximeRobeyns/self_improving_coding_agent
- Xunjian Yin, Xinyi Wang, Liangming Pan, Li Lin, Xiaojun Wan, William Yang Wang. "Gödel Agent: A Self-Referential Agent Framework for Recursively Self-Improvement". ACL 2025. arXiv:2410.04444. https://arxiv.org/abs/2410.04444. Code: https://github.com/Arvid-pku/Godel_Agent
- Chris Lu, Cong Lu, Robert Tjarko Lange, Jakob Foerster, Jeff Clune, David Ha. "The AI Scientist: Towards Fully Automated Open-Ended Scientific Discovery". 2024. arXiv:2408.06292. https://arxiv.org/abs/2408.06292
- Hector Zenil, Abicumaran Uthamacumaran, Luan Ozelim. "Large Language Models are Shannon Lossy Compressors Not Solomonoff Induction Estimators: Self-improvement and Singularity Are Not Near Without Symbolic Model Synthesis". 2026. arXiv:2601.05280 (v6. The title changed across versions). https://arxiv.org/abs/2601.05280
- Eliezer Yudkowsky, Marcello Herreshoff. "Tiling Agents for Self-Modifying AI, and the Löbian Obstacle". Early draft. 2013. https://intelligence.org/files/TilingAgentsDraft.pdf
