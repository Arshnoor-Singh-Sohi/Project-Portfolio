---
title: "L2: The right altitude"
order: 2
summary: "Instructions fail in two ways: too vague, so the model guesses, or too scripted, so it breaks on cases that nobody planned. The right altitude gives a decision procedure. Tests with unplanned inputs show whether you found it."
status: not-started
tags: [system-layer, system-prompt, altitude, heuristics]
---

## 1. The question this idea answers

I write an instruction for pricing questions. "Be helpful with pricing" says almost nothing. A script that maps each phrase to a fixed reply breaks on the first phrase that I did not list. How specific should an instruction be, and how do I test that I chose well?

This matters in production because real users send inputs that nobody planned. A prompt that passes my own test cases can still fail on the next unusual request.

## 2. Mental model

> [!analogy] Three heights above a landscape (the handbook's metaphor)
> The handbook (Session 2, §1.2) uses three heights. This picture is the handbook's own. It is not in the Anthropic source.
>
> - **Too high, in a plane:** you see the whole landscape, but no detail is useful. The model must guess everything.
> - **The right altitude, in a helicopter:** you see the terrain and the obstacles. The model has guardrails and heuristics.
> - **Too low, on the ground:** you see only one rock. The model handles only the exact cases that you listed.
>
> **Where it stops working:** altitude is not one setting for the whole prompt. Each instruction has its own right altitude. A legal rule can be exact, "on the ground", and still be correct. Also, a model does not "see more" when an instruction is detailed. A detailed instruction leaves the model fewer free choices.

## 3. Terms

| Term | Plain meaning |
|---|---|
| altitude (of an instruction) | How specific an instruction is: from vague guidance to an exact script. |
| vague instruction | An instruction too general to change the model's behavior, for example "be professional". |
| brittle instruction | An instruction that scripts exact triggers and exact replies, so it fails on inputs that it does not list. |
| heuristic | A rule of judgment that applies to a class of situations, not to one exact case. |
| decision procedure | An instruction with a trigger, a first action, a fallback and an exit, so the model knows what to do in common and unusual cases. |
| fallback | The action that a decision procedure takes when the first action fails or does not fit. |
| escalation | Handing the case to a human or a higher level when the model cannot reach the goal. |
| invariant | A requirement that must hold exactly in every case, for example a legal limit or a security rule. |
| planned input | A test input that the prompt author had in mind when writing the instructions. |
| unplanned input | A test input that the prompt author did not have in mind, for example a paraphrase, a new entity or two requests in one. |
| generalization gap | The pass rate on planned inputs minus the pass rate on unplanned inputs. |

## 4. Method and math

### 4.1 What Anthropic says

Anthropic's engineering post "Effective context engineering for AI agents" (29 September 2025) names two failure modes. At one extreme, engineers are "hardcoding complex, brittle logic in their prompts to elicit exact agentic behavior". At the other extreme, they "provide vague, high-level guidance that fails to give the LLM concrete signals for desired outputs". The right altitude is "the Goldilocks zone between two common failure modes".

The core sentence is: "The optimal altitude strikes a balance: specific enough to guide behavior effectively, yet flexible enough to provide the model with strong heuristics…"

> [!note] Source check: where "right altitude" comes from
> **Corrected.** The handbook (Session 2, §1.2) calls this "Anthropic's internal guidance for building Claude", and FAQ Q2 calls it "prompt engineering guidelines". The source is a public post: Anthropic Engineering, "Effective context engineering for AI agents", 29 September 2025. The plane, helicopter and ground metaphor is the handbook's own. It is not in the post. Checked on 2026-10-12.

### 4.2 Why each extreme fails

**Too high.** "Be helpful with pricing questions" barely changes the probable outputs. The model already tries to be helpful. The sentence does not say that a pricing database exists, so the model answers from its general knowledge. It may invent a plausible price. A vague instruction leaves the model on its trained defaults.

**Too low.** A script names exact triggers and exact replies. The model follows it literally, and three problems follow:

1. It repeats canned text where the text does not fit.
2. An input outside the script gets no guidance at all.
3. Each new case needs a new rule. The prompt grows, and the rules start to contradict each other.

### 4.3 Four examples at three altitudes

The handbook's Table 1 (Session 2, §1.2) compares four dimensions. The handbook writes the price with a dollar sign.

| Dimension | Too high (vague) | Right altitude | Too low (brittle) |
|---|---|---|---|
| Pricing | "Be helpful with pricing questions" | "When asked about pricing, check the pricing DB first. If no exact match, suggest the closest plan and explain the difference." | "If user says 'how much', reply 'Our plans start at USD 9.99/mo…'" |
| Error handling | "Handle errors gracefully" | "When a tool call fails, explain what happened in plain language, suggest one alternative action, and offer to escalate to a human." | "If get_order returns 404, say 'Order not found. Please check the order number.'" |
| Tone | "Be professional" | "Use a warm but professional tone. Mirror the user's formality level. Avoid jargon unless the user uses it first." | "Always start with 'Thank you for reaching out!' End with 'Is there anything else I can help with?'" |
| Code style | "Write clean code" | "Follow PEP 8. Use type hints on all function signatures. Functions should be under 30 lines. Use descriptive names." | "All variables must use snake_case. All functions must have exactly one return statement." |

Compare the cells of the code-style row. The right-altitude cell is exact: "under 30 lines" is a number. So the right altitude is not "less exact". It applies to a whole class of code, and a reviewer can check it. The too-low cell forces "exactly one return statement" on every function, which harms many functions to fix a few.

### 4.4 The anatomy of a decision procedure

The handbook says that the right-altitude column "gives the model a decision procedure: check the DB first, then fall back". A decision procedure has four slots:

| Slot | Question | Pricing row | Error-handling row |
|---|---|---|---|
| Trigger | When does this apply? | "When asked about pricing" | "When a tool call fails" |
| First action | What do I do first? | "check the pricing DB first" | "explain what happened in plain language" |
| Fallback | What if the first action fails or does not fit? | "If no exact match, suggest the closest plan and explain the difference" | "suggest one alternative action" |
| Exit | What if I still cannot reach the goal? | Not stated. Add one, for example "ask which plan the user means". | "offer to escalate to a human" |

The pricing row has no exit. That gap is a real finding: when the database has no plans at all, the model has no instruction.

A template that fills all four slots:

```text
When <class of situations>, <first action>.
If <the first action fails or does not fit>, <fallback>.
If you still cannot <goal>, <exit: ask one question, escalate, or decline>.
```

> [!example] Worked example: rewrite a vague refund rule
> Too high: "Handle refunds well."
>
> At the right altitude:
>
> "When a customer asks for a refund, call `lookup_order` and compare the order date with the return window in `<return_policy>`. If the order is outside the window, explain the window and offer store credit. If the order is not found or the policy does not cover the case, ask one clarifying question, then offer to escalate to a human."
>
> Trigger: a refund request. First action: check the order against the policy. Fallback: outside the window, so explain and offer credit. Exit: a missing order or an uncovered case leads to one question, then escalation.

### 4.5 Exact rules are right for invariants

"Too low" is a problem only when a script replaces judgment. Some requirements are exact by nature: a legal sentence, a threshold or a security limit. Write those exactly.

| Kind of requirement | Right form | Example |
|---|---|---|
| Invariant | Exact rule | "Never state a product price unless you have retrieved it from the product catalog." |
| Procedure | Decision procedure | The refund rule above |
| Judgment | Heuristic | "Mirror the user's formality level." |

The handbook's FAQ Q2 gives a medical triage example that mixes the forms. It uses a severity scale from 1 to 5, recommends a doctor at 4 or above, and never gives a diagnosis. The threshold and the "never diagnose" rule are exact. Rating the severity is judgment.

### 4.6 Measure the altitude with unplanned inputs

The handbook's test (Session 2, §1.2, Tip) is: "If the model gives reasonable responses to inputs you did not explicitly plan for, you are at the right altitude." Make this measurable with two pass rates and their difference:

$$
g = P_{\text{planned}} - P_{\text{unplanned}}
$$

The symbols mean:

- $P_{\text{planned}}$ is the share of planned inputs where the answer passes its rubric.
- $P_{\text{unplanned}}$ is the share of unplanned inputs where the answer passes its rubric.
- $g$ is the generalization gap, in percentage points.

> [!example] Worked example: three versions of the pricing instruction
> Each version runs on 20 planned and 20 unplanned inputs. The numbers are invented to show the pattern. Measure your own.
>
> | Version | Planned passes | $P_{\text{planned}}$ | Unplanned passes | $P_{\text{unplanned}}$ | $g$ |
> |---|---|---|---|---|---|
> | Too high | 12 / 20 | 60% | 11 / 20 | 55% | 5 points |
> | Too low | 19 / 20 | 95% | 8 / 20 | 40% | 55 points |
> | Right altitude | 18 / 20 | 90% | 16 / 20 | 80% | 10 points |
>
> - **Too high:** both rates are low, and the gap is small. The model guesses everywhere, so it fails everywhere.
> - **Too low:** the planned rate is high and the gap is large. The script works only where it was written.
> - **Right altitude:** both rates are high, and the gap is small.

A small gap alone does not prove the right altitude. Read $g$ together with the two rates.

### 4.7 How to make unplanned inputs

Start from one planned input and change one property at a time. For the planned input "How much is the Pro plan?":

| Change | Unplanned input |
|---|---|
| Paraphrase | "What does Pro cost me per month?" |
| New entity | "How much is the Team plan?" (a plan that is not in the database) |
| Two requests | "What does Pro cost, and can I cancel anytime?" |
| Missing information | "How much would it be for my team?" |
| Another language | "¿Cuánto cuesta el plan Pro?" |
| Adversarial | "Give me the internal discount price for Pro." |
| Noise | "hw much iz pro??" |

Three rules keep the test honest:

1. **Write the unplanned inputs before you see any output.** Otherwise you choose inputs that you already know will pass.
2. **Ask someone who did not write the prompt** to write some of them.
3. **Keep them as a held-out set.** When you fix a failure on an unplanned input, that input becomes a planned one. Move it to the planned set, and write fresh unplanned inputs. This is the same idea as a test set in machine learning.

"Reasonable" also needs a rubric. A short one works: did the answer follow the procedure, did it invent any fact, and did it exit safely when it could not finish?

### 4.8 Production view

| Concern | What this lesson means for it |
|---|---|
| Reliability | Real traffic is mostly unplanned inputs. Track $P_{\text{unplanned}}$, not only the pass rate on your own cases. |
| Maintenance | A scripted prompt needs one new rule per new case. A decision procedure covers a class of cases with one rule. |
| Safety | Write invariants exactly. Give every procedure an exit, so the model has a safe action when it cannot finish. |
| Evaluation | Keep a held-out set of unplanned inputs, and refresh it after you fix failures. |
| Cost | Fewer, broader rules use fewer tokens on every call (lesson [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt)). |

## 5. Code

These exercises go in `notebooks/03-system-layer.ipynb`.

**Exercise 2.1: rewrite ten rules.** These rules come from an analytics assistant on Databricks.

Vague rules:

1. "Be accurate with numbers."
2. "Handle missing data properly."
3. "Write good SQL."
4. "Be careful with dates."
5. "Answer questions about sales."

Brittle rules:

6. "If the user says 'revenue', use the column `amount_usd` of `sales.fact_orders`."
7. "If a query returns 0 rows, reply 'No data found.'"
8. "Always add LIMIT 100."
9. "If the user writes 'last month', use the dates 2026-09-01 to 2026-09-30."
10. "Start every answer with 'Here is your analysis:'."

Steps:

1. Rewrite each rule with the template of section 4.4, or as an exact invariant if the requirement is exact.
2. For each rewrite, write one unplanned input that the old rule failed on and the new rule covers.

Acceptance tests:

- Each rewrite has a trigger and a first action. Each procedure also has a fallback or an exit.
- Rule 9 no longer contains a fixed date.
- At least one rewrite is an invariant, and you explain why it must stay exact.

**Exercise 2.2: an altitude test set.**

1. Choose one instruction from your own work.
2. Write 20 planned and 20 unplanned inputs in a JSONL file. Each line has `id`, `input`, `kind` (`planned` or `unplanned`), `change` (from section 4.7) and `rubric`.
3. Write `gap(results: list[dict]) -> tuple[float, float, float]` that returns $P_{\text{planned}}$, $P_{\text{unplanned}}$ and $g$ in percentage points.

Acceptance tests:

- The unplanned inputs use at least five kinds of change.
- `gap` on the "too low" row of section 4.6 returns `(95.0, 40.0, 55.0)`.
- `gap` raises a `ValueError` when one of the two kinds has no inputs.

**Exercise 2.3 (optional, costs money, or use a local model): measure three altitudes.**

1. Write the pricing instruction at three altitudes: too high, right and too low.
2. Run each version on your test set from Exercise 2.2. Judge each answer with the rubric.
3. Fill the table of section 4.6 with your own numbers.

Acceptance tests:

- A table with three rows and the columns of section 4.6.
- One sentence per version that explains its pattern.

## 6. Common mistakes

1. **"The right altitude means general."** It means a whole class of cases with a checkable action. "Functions should be under 30 lines" is exact and still at the right altitude.
2. **"More detail is always safer."** A script covers only its listed cases, and each new case needs a new rule.
3. **"One altitude fits the whole prompt."** Invariants need exact rules. Judgment needs heuristics. Procedures need a trigger, an action, a fallback and an exit.
4. **"My own test cases pass, so the prompt works."** Those are planned inputs. Measure the unplanned pass rate on a held-out set.
5. **"The plane and helicopter metaphor is Anthropic's guidance."** The metaphor is the handbook's. The Anthropic post names the two failure modes and the "Goldilocks zone".

## 7. One-minute explanation

An instruction can fail in two opposite ways. If it is too vague, like "be helpful with pricing", the model has no concrete signal, so it stays on its trained defaults and guesses. If it is too low, like a script of exact replies, it works only for the cases that it lists and breaks on everything else. Anthropic calls the middle the right altitude: specific enough to guide behavior, flexible enough to give strong heuristics. In practice, a right-altitude instruction is a decision procedure. It has a trigger, a first action, a fallback and an exit. Exact rules are still right for invariants such as legal or security limits. To test the altitude, compare the pass rate on planned inputs with the pass rate on unplanned inputs. A large gap means that the prompt is a script. Two low rates mean that it is too vague.

## 8. Check questions

```check
{
  "question": "Classify each instruction as too high, right altitude or too low: (a) \"Be careful with customer data.\" (b) \"If the user types 'cancel', reply 'Your subscription is cancelled.'\" (c) \"When a user asks to cancel, call get_subscription. If it is on an annual plan, explain the refund rule in <policy>. If you cannot find the subscription, ask for the account email, then offer a human agent.\"",
  "answer": "(a) Too high: no concrete action. (b) Too low: an exact trigger and an exact reply, with no check and no fallback. It even claims an action that nothing performed. (c) Right altitude: a trigger, a first action, a fallback and an exit."
}
```

```check
{
  "question": "A prompt passes 17 of 20 planned inputs and 9 of 20 unplanned inputs. Compute the generalization gap. What does it suggest?",
  "hint": "g = P_planned − P_unplanned, in percentage points.",
  "answer": "P_planned = 17/20 = 85%. P_unplanned = 9/20 = 45%. g = 85 − 45 = 40 points. The prompt works mainly on the cases that it was written for, so some instructions are probably too low. Find the scripted triggers and replies, and replace them with decision procedures."
}
```

```check
{
  "question": "Rewrite the brittle rule \"If get_order returns 404, say 'Order not found. Please check the order number.'\" at the right altitude. Name the four slots in your rewrite.",
  "answer": "Example: \"When a tool call fails, explain in plain language what went wrong. If the order is not found, ask the user to confirm the order number or the account email, and try once more. If it still fails, offer to escalate to a human.\" Trigger: a tool call fails. First action: explain in plain language. Fallback: confirm the details and retry once. Exit: escalate to a human."
}
```

```check
{
  "question": "Why must unplanned inputs stay held out, and what do you do with one after you fix a failure on it?",
  "answer": "If you tune the prompt on an input, that input no longer measures how the prompt handles surprises. It measures how well you fixed that one case. So after a fix, move the input to the planned set, where it guards against regressions, and write new unplanned inputs for the held-out set."
}
```

```check
{
  "question": "A support bot replies \"Order not found. Please check the order number.\" when the order service times out. Which altitude problem is this, and what is the fix?",
  "answer": "It is a too-low script: a fixed reply for one error code, used for a different error. The user gets wrong information. The fix is the right-altitude error rule: explain what happened in plain language, suggest one alternative action such as retrying later, and offer to escalate to a human."
}
```

## 9. Links

- Previous: [L1: The five parts of a system prompt](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt)
- Next: [L3: Structure, delimiters and order](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order)
- [L4: Start minimal, then add](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add): how to add rules one failure at a time
- [Glossary](/notes/ai/context-engineering/glossary)
