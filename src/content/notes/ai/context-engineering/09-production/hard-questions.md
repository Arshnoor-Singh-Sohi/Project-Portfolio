---
title: "Hard questions: Production"
order: 99
summary: "Skeptical and interview questions on the PRP workflow, project files, validation, evaluation, judges, CI, cost and anti-patterns, with full answers."
status: not-started
tags: [production, interview, review]
---

Answer each question aloud first. Then read the answer. The lesson code after each idea shows where it comes from.

## 1. Isn't the PRP workflow over-engineered? I type my request into Claude Code and it works.

For small tasks, typing works, and the FAQ (Q46) agrees. Claude Code's best practices give the boundary: "If you could describe the diff in one sentence, skip the plan." (lesson 9.3)

The PRP pays when a feature spans several files, has edge cases, or must follow existing patterns. Its value is not the document. It is the review gate: you check the files to read, the order of changes and the design decisions before any code exists (lesson 9.3). For the middle ground, plan mode gives the same gate inside one session (lesson 9.5).

The FAQ gives two numbers. First, 15 to 30 minutes of spec save 2 to 3 hours. Second, direct typing hits a ceiling at 500 to 1,000 lines of change. Neither number has a source. Record your own times and decide with your data (exercise 3.4).

## 2. Is context engineering just software engineering with a new name?

Much of it is borrowed, and that is a strength. Context files go in git, through review, tests, CI and rollback (lessons 9.1 and 9.7). The FAQ (Q47) gives analogies: token budgets are like memory management, and just-in-time instructions are like lazy loading.

Three things are new, because the runtime is a probabilistic model:

1. **Tests measure rates, not single results.** The same context can give different answers. So you need evaluation sets, chance-corrected agreement (kappa) and sample sizes (lessons 9.6 and 9.7).
2. **Nothing type-checks the context.** Two rules can contradict each other, and only an evaluation or a reviewer notices (lesson 9.9).
3. **Failure modes have no classic equivalent.** Position and length effects (lesson 1.5) and reward hacking (lesson 9.6) do not exist in deterministic code.

## 3. Will better models make context engineering obsolete?

No. Three limits do not depend on model quality:

1. **The model sees only its window and its weights** (lesson 1.1). A better model still cannot use your policy if the policy is not in the window.
2. **Every token costs money and time** (lessons 1.4 and 1.6). A larger window makes careless context more expensive, not cheaper.
3. **Accuracy falls with length on current models** (lesson 1.5). Chroma found this across 18 models.

Some techniques do age. "ultrathink" once raised the thinking budget, and today it only adds an in-context instruction (lesson 9.5). Anthropic now advises against heavy emphasis words. So the discipline stays, and specific tricks need a date and a source.

## 4. What is the minimum for a solo developer?

The FAQ (Q49) keeps four things (lessons 9.2, 9.3 and 9.6):

1. A CLAUDE.md.
2. An `examples/` folder with 2 or 3 real files.
3. A short INITIAL.md for each feature.
4. An evaluation script with about 20 cases.

Add two cheap mechanical checks that the FAQ does not list. First, a PreToolUse hook or a CI diff check that blocks new suppressions, because a prompt cannot enforce "fix, don't disable" (lessons 9.4 and 9.5). Second, a log of `usage` and the context version ID on every call, so that you can debug and price your system (lesson 9.8).

Skip registries, A/B tests and formal team process until a second person or real traffic arrives.

## 5. How do you convince a team that thinks prompt engineering is enough?

The FAQ (Q50) says: "Build a demonstration, not a presentation." Take one real failure from your own system. Measure it on a small GTX, apply one technique, and measure again. Numbers persuade: the match rate before and after, the cost per conversation, the cache hit rate.

Start with changes that need no new process: a CLAUDE.md, an `examples/` folder and about 10 GTX cases in CI. When the GTX catches a regression that normal tests miss, the argument makes itself (lessons 9.6 and 9.7).

## 6. Our evaluations pass, but real users complain. What is wrong?

The FAQ (Q29) names three causes, and each has a test:

1. **The GTX does not represent real use.** Compare the intents in the GTX with the intents in production traffic. Sample new cases from real conversations, and add every real failure as a case (lesson 9.6).
2. **The evaluation measures the wrong thing.** Users may care about tone, speed or actions, while the GTX checks facts. Correlate the scores with satisfaction data, and add dimensions (lesson 9.6).
3. **Drift.** Products, policies and tools changed after the GTX was built. A weekly run and a refresh of the sample catch this (lesson 9.7).

Check two more causes. The judge may have drifted, so recompute its kappa against fresh human labels. And a small suite may hide losses in noise (lesson 9.7). Then open the traces of the complaints. The FAQ's summary is often right: "Often the problem is the context, not the model."

## 7. How do you stop an LLM judge from being gamed?

Combine the FAQ's defenses (Q13) with the known judge biases (Zheng et al. 2023, lesson 9.6):

1. **A judge from another model family.** This counters self-enhancement bias.
2. **A rubric that defines every score level.** It also states that length is not a criterion, against verbosity bias.
3. **Separate scores for separate dimensions.** One number hides trade-offs.
4. **Swapped order in pairwise tests.** This counters position bias.
5. **Partly correct adversarial cases in the GTX.** A weak judge passes them.
6. **Regular calibration against humans with kappa.** Retune when the kappa falls clearly below the human-to-human kappa.
7. **A held-out part of the GTX.** If you tune the agent's prompt on all cases, you overfit to them. Keep some cases that nobody tunes against.

## 8. When should I fine-tune instead of engineering the context?

The FAQ (Q40) puts the line well. Fine-tuning changes the weights. Context engineering changes what is in the window on each call (lesson 1.1).

| Choose fine-tuning when | Choose context engineering when |
|---|---|
| The behavior or format is stable and needed on millions of calls | The facts change often: catalogs, policies, user data |
| Few-shot examples in the window cost too many tokens or too much latency | You need to see and audit what the model was given |
| The task needs a skill that prompting does not reach | You need to change behavior in minutes, not hours or days |

The FAQ's claim that context engineering handles "90%+" of production cases has no source. The two methods combine well: fine-tune for base behavior, then supply task facts in context. Both need the same evaluation discipline, and both can reward-hack: Shopify's hacks appeared during GRPO training, which changes weights (lesson 9.6). Lesson [4.3](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval) compares retrieval, long windows and fine-tuning in detail.

## 9. Do RLHF and constitutional AI replace context engineering?

No. They act at training time and shape general behavior for all users. Context engineering acts at inference time and shapes behavior for your task, your users and your data. The FAQ (Q43) uses an analogy: medical school gives general competence, and a patient's chart gives the facts of this case. A doctor needs both. A model that follows instructions better makes good context more effective, not less needed.

## 10. Our judge reaches a kappa of 0.61 against humans. Can we drop human review?

Not fully. A kappa of 0.61 is just inside the "substantial" band of Landis and Koch, and those bands are a convention (lesson 9.6). First compare it with the human-to-human kappa on the same items. Shopify reached 0.61 against a human baseline of 0.69, so its judge was close to, but below, human agreement.

Keep humans in three places: a calibration sample on a schedule, new intents that the judge has not been checked on, and high-stakes decisions. Recompute the kappa after any change to the judge prompt, the judge model or the rubric.

## 11. CLAUDE.md says "never skip a failing test", and the agent skipped one anyway. Is the model broken?

No. The Claude Code docs say that CLAUDE.md is "context, not enforced configuration". Under pressure to make a check pass, the shortest path is often to disable the check. That is a small form of reward hacking (lessons 9.4 and 9.6).

Prompts advise, and mechanisms enforce. Use three mechanisms (lessons 9.4, 9.5 and 9.7):

1. A PreToolUse hook that blocks the edit.
2. A Stop hook that runs the checks before the turn can end.
3. A CI diff check, set as a required status check.

## 12. The smoke suite dropped from 90% to 85% on my pull request. Should I revert the change?

Not on that number alone. In a 20-case suite, one case is 5 points, and the rough 95% interval at 90% is about ±13 points (lesson 9.7). Read the regression list: which case flipped? If it carries the `critical` tag, block the merge and fix it. If not, the full suite on merge decides. Rollback is for production: when the live version's score falls more than your margin below the last known good version.

## 13. Why not let the agent write and approve its own PRP?

The value of a review gate is an independent check. An agent that approves its own plan shares its own blind spots: the file it did not read, the risk it did not see. A read-only reviewer subagent helps, because it starts from a fresh window (lesson 9.5). But it is still the same kind of model. Humans own the design decisions and the security risks, such as user input, file paths and secrets, in the Known Risks table (lesson 9.3).

## 14. Check questions

```check
{
  "question": "A judge and humans label 100 answers. Both pass 72, both fail 12, and they disagree on 16 (8 each way). Raw agreement is 84%. What is kappa?",
  "hint": "Humans pass 80 and the judge passes 80.",
  "answer": "p_o = 0.84. p_e = 0.80 × 0.80 + 0.20 × 0.20 = 0.64 + 0.04 = 0.68. κ = (0.84 − 0.68) / (1 − 0.68) = 0.16 / 0.32 = 0.50. That is moderate agreement, despite 84% raw agreement."
}
```

```check
{
  "question": "A service sends 10 requests per hour, one every 6 minutes, with the same 3,000-token prefix on Sonnet 5.5. Does a 5-minute prompt cache save money?",
  "answer": "No. The 5-minute cache expires between calls, so every call is a cache write at 1.25 × the input price: 10 × 3,000 × 2.50 / 10^6 = 0.075 USD per hour, against 0.06 USD uncached. A 1-hour cache costs about 0.0147 USD in the first hour: one write at 2 × and nine reads at 0.05 ×. Each hit refreshes the lifetime, so later hours cost only the reads, 0.003 USD per hour."
}
```

```check
{
  "question": "Classify each symptom as context overload, context rot or stale context, as this course uses the words: (a) the prompt names an API endpoint that was renamed, (b) accuracy on the same question falls as you add more unrelated documents, (c) a design that sends all 52 tool definitions and 30 chunks on every call.",
  "answer": "(a) Stale context, in the form of hardcoded context: refresh or remove the fact. (b) Context rot, the length effect of lesson 1.5: send fewer tokens. (c) Context overload, the design mistake that causes rot: load only the needed tools, retrieve fewer chunks, budget each part."
}
```

## 15. Links

- Part overview: [09 Production](/notes/ai/context-engineering/09-production)
- Previous: [L9: The seven anti-patterns](/notes/ai/context-engineering/09-production/l9-seven-anti-patterns)
- [Hard questions: Foundations](/notes/ai/context-engineering/01-foundations/hard-questions)
- [Glossary](/notes/ai/context-engineering/glossary)
