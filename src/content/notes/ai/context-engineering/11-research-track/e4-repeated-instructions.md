---
title: "E4: Repeated instructions"
order: 4
summary: "Does repeating a critical rule at the start and the end, writing it with emphasis, or placing it just in time next to the data raise adherence in long contexts with many rules? What does each placement cost in tokens and in the adherence of the other rules? Covers bootcamp topic 7."
status: not-started
tags: [research, adherence, repetition, emphasis, jit-instructions]
---

## 1. Research question

A system prompt holds one critical rule among many others. As the context grows, does the model follow that rule less often? Which placement keeps adherence high? The candidates are: once at the start, once at the end, at both ends, with emphasis, or just in time next to its data. And what does each placement cost in tokens and in the adherence of the other rules?

## 2. Why it matters

Every production prompt has rules that must hold, such as the citation format of the capstone. Teams often repeat such rules or write them in capitals, without a measurement. The production decision is where the capstone puts its critical rules, and which rules need a check in code instead.

The experiment builds on these lessons:

- [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt): critical rules at the start and the end, stated there as a hypothesis to measure.
- [6.5](/notes/ai/context-engineering/06-tools-and-mcp/l5-many-tools): many rules in one prompt, and just-in-time instructions.
- [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks): what Anthropic says about emphasis.
- [9.4](/notes/ai/context-engineering/09-production/l4-validation-loops): rules that must hold need a mechanical check.

## 3. Hypothesis

- **H1.** Take 64,000 tokens of context and 40 rules. The rule in the rule list and at the end (P2) gains at least 5 points of adherence over the rule list alone (P0).
- **H2.** Emphasis alone (P3) gains less than half of the H1 gain. It also lowers the mean adherence of the other monitored rules by at least 3 points.
- **H3.** The rule placed just in time, next to the sources (P4), reaches an adherence at least as high as P2.

Each hypothesis is wrong if its measured difference is on the other side of its threshold, with the paired test of [E1](/notes/ai/context-engineering/11-research-track/e1-context-utilization).

## 4. Background

- **Emphasis.** The handbook FAQ claims that words such as IMPORTANT, NEVER and ALWAYS "empirically work", with no source. Anthropic's prompting guide says to "dial back any aggressive language" and warns: "If you emphasize many lines, none of them stands out" (lesson 9.5).
- **Start and end.** Liu et al. (TACL 2024) found the highest accuracy for information at the start or the end of the input. That study moved documents, not rules (lessons 1.5 and 3.1).
- **Many rules.** Shopify describes its system prompt as "an unwieldy collection of special cases, conflicting guidance, and edge case handling". When a tool runs, its rule is one block among many (lesson 6.5).
- **Just-in-time instructions.** Shopify returns instructions with the tool data, "exactly when they're needed". The handbook adds "better adherence", which no source measures (lesson 6.5).
- **Advice is not enforcement.** A rule in a prompt raises the chance that the model follows it. Only code makes it hold (lessons 9.2 and 9.4).

## 5. Method

**Target rules.** Three rules that code can check. Each trial uses one of them.

| Code | Rule | Check |
|---|---|---|
| T1 | "End every answer with a line that starts with Sources: and lists the source IDs that you used." | The last line matches the pattern, and its IDs exist in the context |
| T2 | "Use at most 120 words." | Word count |
| T3 | "Do not use bulleted or numbered lists." | No line starts with a bullet or a number and a period |

**Other rules.** A pool of 39 realistic rules for a research assistant. Three of them are monitor rules that code can check: "Write numbers below ten as words", "Name the document of each source once", and "Never start the answer with the word Sure". With $N$ rules in total, the prompt holds the target, the 3 monitor rules (when $N \ge 10$), and rules drawn from the pool.

**Factors.**

| Factor | Levels |
|---|---|
| Context length $L$ | 2,000, 16,000 and 64,000 tokens of retrieved chunks that fit the question |
| Number of rules $N$ | 1, 10 and 40 |
| Placement $P$ | P0: once, in the middle of the rule list. P1: once, in the last user message before the question. P2: both P0 and P1. P3: P0 with emphasis ("IMPORTANT:" and capitals). P4: in the `instructions` line of the sources block, next to the data. |

**Controls.** The rules text is fixed for each $N$, apart from the target's placement. The question is always last. The filler chunks for one question and one $L$ are the same in every placement.

**Dataset.** 30 questions from the capstone ground truth set. A work-domain variant: a shift-handover assistant with 40 plant rules, where the target rule is "State the line number in every answer."

**Models.** Claude Haiku 5.5. A local open-weight model can run the whole design at no API cost, and it shows whether the effects depend on the model.

**Trials and randomization.** 30 questions × 3 lengths × 3 rule counts × 5 placements × 2 repeats = 2,700 trials. Assign the target rule T1, T2 or T3 to each question with a seeded draw. Shuffle the trial order. Run the 2 repeats of one cell one after the other. Then the second repeat can read the cached prefix of the first.

**Cost estimate.** Each trial has about $L$ + 30 tokens per rule + 300 tokens of other input, and 200 output tokens.

> [!example] Worked example: cost of the full design
> Claude Haiku 5.5 costs USD 0.10 / 0.50 per MTok (checked on 2026-10-12). The sum over the 45 cells of 60 trials each is about 7.87 USD without caching. On Claude Sonnet 5.5 (USD 2 / 10), the same design costs about 157 USD.
>
> Start with a pilot of 10 questions, which costs about 2.62 USD. Run Sonnet 5.5 only on the cells that the pilot shows to matter, for example $L = 64{,}000$ and $N = 40$.

## 6. Metrics

- **Target adherence:** $\text{AR}_T = \frac{\text{trials in which the target rule holds}}{\text{trials}}$, per cell $(L, N, P)$.
- **Monitor adherence:** $\text{AR}_M$, the mean adherence of the 3 monitor rules, per cell with $N \ge 10$. A drop under P3 shows dilution by emphasis.
- **Task accuracy:** the element scoring of M6. A placement that raises adherence but lowers accuracy has a hidden cost.
- **Token overhead:** the input tokens that the placement adds against P0, from `usage`.
- **Gain per 100 added tokens:** $\Delta \text{AR}_T / (\Delta I / 100)$, against P0.

## 7. Report

**Result table.** One row per cell $(L, N, P)$. Columns: $\text{AR}_T$ with its 95% interval, $\text{AR}_M$, task accuracy, added tokens, and the paired difference of $\text{AR}_T$ against P0.

**Hypothesis table.** One row per hypothesis, with the cell that it uses, the difference, the test result and the verdict.

**Plot.** $\text{AR}_T$ against $L$ at $N = 40$, one line per placement P0, P2, P3 and P4. Name the line colors in the title.

**Decision lines.** Where the capstone puts its citation rule. Which rules move into code checks, for example the citation check of M2.

## 8. Threats to validity

1. **Ceiling effects.** If adherence is near 100% at P0, no placement can show a gain. The pilot shows whether $L = 64{,}000$ and $N = 40$ are hard enough.
2. **Rule-specific effects.** A word limit and an end line behave differently. Report each target rule apart before you pool them.
3. **Length confound.** Repetition adds tokens. With 30 tokens against a 64,000-token context, the effect is small, but report it.
4. **Wording of emphasis.** "IMPORTANT" in capitals is one form of emphasis. Other forms can behave differently.
5. **Duplicates as conflicts.** A repeated rule that differs by one word is a conflict, not a repeat. Generate both copies from one string.

## 9. Extensions

1. Repeat the rule in every turn of a 20-turn conversation, and measure adherence by turn.
2. Compare the prompt rule with a code check that rejects and retries a non-compliant answer. Measure the cost of the retries.
3. Test the rule as a few-shot example instead of an instruction (lesson 3.8).
4. Run the design on a second model family.

## 10. Check questions

```check
{
  "question": "Why does the experiment measure the adherence of three monitor rules, and not only the target rule?",
  "answer": "Emphasis and repetition can work by taking attention from other rules. If the target rule gains 5 points and the other rules lose 5 points each, the prompt got worse overall. The monitor rules show this dilution, which Anthropic's warning about emphasizing many lines describes."
}
```

```check
{
  "question": "Repeating a 30-token rule at the end of every request costs input tokens. What does it cost per day at 100,000 calls on Claude Sonnet 5.5 at USD 2 / MTok input, and why can caching not remove this cost?",
  "answer": "30 × 100,000 = 3,000,000 tokens per day, which is 3 × 2 = 6 USD per day. The repeat sits in the last user message, after the changing content, so it lies outside the cached prefix and is billed at the full input price on every call."
}
```

```check
{
  "question": "P2 raises target adherence from 91% to 97%, but task accuracy falls from 84% to 79%. What do you conclude?",
  "answer": "The placement has a hidden cost. The model may spend effort on the format, or the rule may crowd out content, for example a word limit that cuts needed facts. Do not adopt P2 on adherence alone. Check the failed answers, and consider a code check for the rule, which enforces it without changing the prompt."
}
```

## 11. Links

- Previous: [E3: Instruction hierarchy](/notes/ai/context-engineering/11-research-track/e3-instruction-hierarchy)
- Next: [E5: Stale and contradictory context](/notes/ai/context-engineering/11-research-track/e5-stale-context)
- [Lesson 3.1: The five parts of a system prompt](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt)
- [Lesson 6.5: Many tools](/notes/ai/context-engineering/06-tools-and-mcp/l5-many-tools)
- [Lesson 9.5: Commands, skills and hooks](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks)
- [Glossary](/notes/ai/context-engineering/glossary)
