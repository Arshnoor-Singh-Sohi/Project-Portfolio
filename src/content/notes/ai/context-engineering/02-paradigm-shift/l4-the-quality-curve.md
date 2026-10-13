---
title: "L4: The quality curve and the five causes of rot"
order: 4
summary: "Too little, a sweet spot, too much: why the handbook's curve is an inverted U and not a power law, the five causes of rot mapped to the three effects of Part 1, minimum viable context, ablation studies with their noise, and proxies for context quality."
status: not-started
tags: [paradigm-shift, quality-curve, context-rot, ablation, evaluation]
---

## 1. The question this idea answers

More context helps a model, up to a point. After that point, more context makes answers worse. Where is that point for my task? Why does it exist? And how do I find it by measurement instead of by guessing?

The handbook draws this as a "power law of context quality" (Session 1, §3.3). The idea is right, but the name and the axis numbers are wrong. This lesson corrects the curve, explains the forces behind it, and gives two measurement methods: minimum viable context and ablation.

## 2. Mental model

> [!analogy] A one-page brief against a 500-page binder
> A manager must decide on a refund case in five minutes.
>
> - **Too little:** a sticky note that says "refund?". The manager guesses.
> - **Sweet spot:** a one-page brief with the order, the defect, the policy clause and the customer's history. The manager decides well.
> - **Too much:** a 500-page binder with every policy version since 2019, all old emails and the full product catalogue. The key clause is on page 312, next to an old version that contradicts it.
>
> The handbook uses the brief-and-binder picture to separate context stuffing from context engineering (Session 1, FAQ Q19).
>
> **Where it stops working:** the right size is not a page count. One 50-token example can matter more than 2,000 tokens of documentation. Also, the curve has a different shape for each model and task, and it moves when the content changes. It is a picture to reason with, not a law to read numbers from.

## 3. Terms

| Term | Plain meaning |
|---|---|
| quality curve | A picture of answer quality against the amount of context: it rises, peaks and then falls. |
| sweet spot | The amount and kind of context where quality is highest for a given task and model. |
| inverted U | A curve that rises to one peak and then falls. |
| power law | A relation of the form $y = a x^k$. For positive $x$ it only rises or only falls, so it has no peak. |
| context stuffing | Putting every possibly relevant item into the window and hoping that the model finds what matters. |
| minimum viable context | The smallest context that gives a correct answer on a test set. You start there and add content only when a measurement justifies it. |
| marginal gain per token | The accuracy gain from one added item, divided by its token count. |
| ablation study | An experiment that removes one part at a time and measures the change in quality. |
| interaction effect | The effect of two parts together differs from the sum of their separate effects. |
| instruction drift | Contradictory instructions collect in the window, for example "answer in JSON" and later "answer in Markdown". |
| conversation bloat | Old turns that no longer matter stay in the window. |
| tool result accumulation | Results of old tool calls stay in the window after their step. |
| format pollution | The model copies the format of earlier turns when the task now needs another format. |
| standard error (SE) | A measure of how much an accuracy measured on a sample of questions would vary from sample to sample. |
| proxy metric | A measurable quantity that represents a quality that you cannot measure directly. |

## 4. Method and math

### 4.1 The handbook's curve, and why it is not a power law

The handbook's ASCII chart plots quality against token count, with ticks at 0, 10K, 50K, 100K, 150K and 200K. Quality rises steeply, peaks at a "Sweet Spot (Maximum ROI)" and then falls where "Context Rot Begins". It names three zones:

| Zone | Handbook description | Cause (this subject) |
|---|---|---|
| Too little | "Model guesses, hallucinates" | Missing facts: the model fills gaps from its weights (lesson [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context)). |
| Sweet spot | "Maximum quality per token spent" | Every needed fact is present, and little else is. |
| Too much | "Model confused, misses key info" | Length effect, distractors, position effects and stale context (lesson [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects)). |

A power law cannot draw this shape. Take

$$
y = a\,x^{k}
$$

The symbols mean:

- $x > 0$ is the input, here the number of context tokens.
- $y$ is the output, here quality.
- $a$ and $k$ are constants.

Its slope is

$$
\frac{dy}{dx} = a\,k\,x^{k-1}
$$

For $x > 0$, the factor $x^{k-1}$ is always positive. So the sign of the slope is the sign of $a k$, and it never changes. A power law only rises or only falls. It has no peak.

> [!example] Worked example: a power law keeps rising
> Take $a = 15$ and $k = 0.5$, so $y = 15\sqrt{x}$ with $x$ in thousands of tokens.
>
> | $x$ | 1 | 4 | 10 | 40 |
> |---|---|---|---|---|
> | $y$ | 15.0 | 30.0 | 47.4 | 94.9 |
>
> The gains get smaller (diminishing returns), but $y$ never falls. The handbook's curve falls after its peak, so it is not a power law.

> [!note] Source check: "the power law of context quality"
> **Corrected.** The handbook (Session 1, §3.3) says that "Context quality follows a power law" and draws a curve that peaks and then falls. That shape is an inverted U. A power law is monotonic for positive inputs and has no peak. The axis ticks (10K to 200K) and the position of the sweet spot are illustrative: the handbook gives no measurement or source for them. Measure the curve for your own task and model.

### 4.2 Why the curve rises and then falls

Two forces act at the same time.

1. **Coverage rises with relevant content, with diminishing returns.** The first relevant facts help a lot. Later ones add less, because most needed facts are already there.
2. **Harm rises with every extra token.** More text brings more distractors and more stale content. It also gives a key fact more chances to sit in the middle (lesson 1.5).

The evidence for the falling side comes from Part 1:

- Liu et al. (TACL 2024): with 20 documents and the answer document in position 10, GPT-3.5-Turbo scored 53.8%. With no documents it scored 56.1%, and with only the answer document it scored 88.3%.
- Chroma's "Context Rot" report (July 2025) tested a memory benchmark. All models did much better on focused prompts of about 300 tokens than on full prompts of about 113,000 tokens.
- Anthropic draws the rule: "Context, therefore, must be treated as a finite resource with diminishing marginal returns."

A **toy model** makes the two forces concrete. It is not fitted to any data. Use it only to reason about what moves the peak.

$$
Q(n) = Q_{\max}\left(1 - e^{-n/\tau}\right) - \lambda\,n
$$

The symbols mean:

- $n$ is the number of context tokens.
- $Q(n)$ is the answer quality on a 0 to 100 scale.
- $Q_{\max}$ is the quality when every needed fact is present and nothing harms.
- $\tau$ (tau) sets how fast relevant content saturates: after $\tau$ tokens, about 63% of the possible gain is reached.
- $\lambda$ (lambda) is the quality lost for each extra token.

Set the slope to zero to find the peak:

$$
\frac{dQ}{dn} = \frac{Q_{\max}}{\tau}\,e^{-n/\tau} - \lambda = 0
\quad\Rightarrow\quad
n^{*} = \tau \ln\frac{Q_{\max}}{\lambda\,\tau}
$$

This peak exists only when $Q_{\max} > \lambda \tau$. Otherwise the curve falls from the start.

> [!example] Worked example: where is the peak?
> Take $Q_{\max} = 100$, $\tau = 2{,}000$ tokens and $\lambda = 0.001$ per token.
>
> 1. $\lambda \tau = 0.001 \times 2{,}000 = 2$.
> 2. $n^{*} = 2{,}000 \times \ln(100 / 2) = 2{,}000 \times \ln 50 = 2{,}000 \times 3.912 \approx 7{,}824$ tokens.
> 3. $Q(n^{*}) = 100\,(1 - e^{-3.912}) - 0.001 \times 7{,}824 = 100\,(1 - 0.02) - 7.82 \approx 90.2$.
> 4. At 40,000 tokens: $Q = 100\,(1 - e^{-20}) - 40 \approx 60$.
>
> Now double the harm per token, $\lambda = 0.002$. Then $n^{*} = 2{,}000 \times \ln 25 \approx 6{,}438$ tokens, and the peak quality drops to about 83.1. Noisier content moves the peak to the left and lowers it.

The toy model teaches two things. First, the peak depends on $\tau$ and $\lambda$, which depend on your task, your content and your model. So no single number, such as a token count or a share of the window, is "the sweet spot". Second, the x-axis hides the kind of tokens. Adding a relevant fact and adding a distractor both increase $n$, but with opposite effects.

### 4.3 Context stuffing against context engineering

The handbook defines the contrast in FAQ Q19. Context stuffing is "concatenating every piece of potentially relevant information into the prompt", for example "full documentation pages, entire codebases, raw database dumps". Context engineering is "selecting, structuring, ordering, and formatting exactly the information the model needs".

| Verb | What it means | Example | Taught in |
|---|---|---|---|
| Select | Include only what this step needs. | 3 relevant chunks, not 40 | [05 Retrieval quality](/notes/ai/context-engineering/05-retrieval-quality) |
| Structure | Label each part so the model knows what it is. | `<policy source="returns-v7">` | [03 System layer](/notes/ai/context-engineering/03-system-layer) |
| Order | Put each part where the model uses it best. | Documents first, question last | Lesson 1.5, [05 Retrieval quality](/notes/ai/context-engineering/05-retrieval-quality) |
| Format | Choose the form: full text, extract, summary or table. | A 600-token extract instead of a 12,000-token manual | Lesson 2.3 |

Liu et al. show the cost of stuffing in one number: 20 documents with the answer in the middle scored lower than no documents.

### 4.4 The five causes of rot, mapped to the three effects

The handbook lists "Five Causes of Context Rot" (Session 1, §3.2.2). Lesson 1.5 separates three effects: the position effect, the length effect (which Chroma calls "context rot") and stale context. Each cause of the handbook feeds one or two of these effects.

| Handbook cause | Handbook example | Effect from lesson 1.5 | First fix | Taught in |
|---|---|---|---|---|
| Stale knowledge | Q2 results are still in the window while the user asks about Q3. | Stale context | Replace retrieved results on each new question. Label each document with its period. | Parts 4, 5 |
| Instruction drift | "Respond in JSON." Later: "Respond in markdown." | Stale context (a conflict) | Keep one current value for each rule, and restate it near the end. | Parts 3, 7 |
| Conversation bloat | At turn 30, 25 turns are unrelated to the question. | Length effect, and stale context | Keep recent turns, and summarize older ones. | Part 7 |
| Tool result accumulation | A database query from turn 5 still uses tokens at turn 20. | Length effect, and stale context | Clear old tool results after their step. | Part 7 |
| Format pollution | The model keeps writing bullets from turn 1 when prose is needed. | Stale context (pattern copying) | State the wanted format near the end. Remove old examples of the wrong format. | Parts 3, 7 |

Two details matter in practice.

**Instruction drift.** The handbook says that "multiple system messages accumulate contradictory rules". On the Anthropic API there is one top-level `system` field and no `system` role inside `messages` (lesson [1.3](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call)). So drift usually arrives through user turns. The user asks for JSON at turn 3 and for Markdown at turn 9. Both requests stay in the history. The handbook's warning still holds: "be brief" followed by "be thorough" gives unpredictable output. The fix is a single source of truth. Keep the current rule, for example `output_format = markdown`, in the state element, and update it when the user changes it.

**Tool result accumulation has a price on every call.**

> [!example] Worked example: one old tool result
> A database query at turn 5 returns 2,500 tokens. Nobody removes it. A conversation runs to turn 20.
>
> - The result is sent again on calls 6 to 20: 15 calls.
> - Extra input: $15 \times 2{,}500 = 37{,}500$ tokens.
> - At USD 2 / MTok (Claude Sonnet 5.5, checked on 2026-10-12): $37{,}500 \times 2 / 10^6 = 0.075$ USD for one conversation.
>
> The money is small for one chat. At 100,000 conversations a day it is 7,500 USD a day. The quality cost comes on top: a stale result can contradict a fresh one.

> [!trap] Two meanings of "context rot"
> The handbook uses "context rot" for all five causes (§3.2) and also for the drop with length (FAQ Q4). This subject keeps the name for the length effect only, as Chroma's report does. When someone says "context rot", ask which effect they mean, because each effect has a different fix.

### 4.5 Minimum viable context

The handbook's method (FAQ Q14) is: "start with the minimum viable context that produces a correct answer, then add elements one at a time and measure whether output quality improves." Anthropic gives the same advice for prompts: "It's best to start by testing a minimal prompt with the best model available to see how it performs on your task, and then add clear instructions and examples to improve performance based on failure modes found during initial testing." Anthropic also warns: "minimal does not necessarily mean short".

The procedure:

1. Write a test set of real questions with known good answers. Without it, nothing below is a measurement.
2. Start with the smallest context that could solve the task: the instructions and the facts that the solvability test says are needed (lesson 2.1).
3. Add one item at a time: a document, an example, a tool, a memory field.
4. Measure the accuracy change and the token cost of each item.
5. Keep an item only if its gain is worth its cost. Stop when gains become small.

Compare items by their marginal gain per 1,000 tokens:

$$
g_i = \frac{\Delta A_i}{T_i / 1{,}000}
$$

The symbols mean:

- $\Delta A_i$ is the accuracy change, in percentage points, when item $i$ is added.
- $T_i$ is the number of tokens of item $i$.
- $g_i$ is the gain in percentage points per 1,000 tokens.

> [!example] Worked example: documentation against one example
> The handbook gives two illustrative cases (FAQ Q14). They are a **rule of thumb**, not measured data. The handbook writes "1%" and "30%", and this example reads them as percentage points:
>
> - 2,000 tokens of documentation give +1 point: $g = 1 / 2 = 0.5$ points per 1,000 tokens.
> - A 50-token example gives +30 points: $g = 30 / 0.05 = 600$ points per 1,000 tokens.
>
> Now the cost at 100,000 calls a day on Claude Sonnet 5.5 (USD 2 / MTok input):
>
> - Documentation: $2{,}000 \times 100{,}000 = 200$M tokens a day, so 400 USD a day for 1 point.
> - Example: $50 \times 100{,}000 = 5$M tokens a day, so 10 USD a day for 30 points.
>
> The example is 1,200 times better per token. The documentation needs a strong reason to stay, for example a rare but expensive failure that it prevents.

### 4.6 Ablation studies

FAQ Q28 gives the opposite direction: "start with everything, remove elements one at a time, and measure what actually impacts output quality." The effect of element $i$ is

$$
\Delta_i = A_{\text{full}} - A_{\text{full} \setminus i}
$$

The symbols mean:

- $A_{\text{full}}$ is the accuracy with all elements.
- $A_{\text{full} \setminus i}$ is the accuracy with element $i$ removed and everything else kept.
- $\Delta_i$ is the accuracy that element $i$ adds, given all the others.

> [!example] Worked example: an ablation of a support bot
> The accuracies below are illustrative, not measured. The test set has 50 questions. User input is never removed, because without it there is no task.
>
> | Configuration | Accuracy | $\Delta_i$ |
> |---|---|---|
> | Full context | 84% | — |
> | Without system instructions | 62% | 22 |
> | Without conversation history | 80% | 4 |
> | Without retrieved knowledge | 48% | 36 |
> | Without tools | 70% | 14 |
> | Without state and memory | 83% | 1 |
> | User input only | 20% | — |
>
> - Sum of the five effects: $22 + 4 + 36 + 14 + 1 = 77$ points.
> - Full against user-only: $84 - 20 = 64$ points.
>
> The effects add to more than the total. The elements **interact**: for example, tools help only when the instructions say when to use them. So $\Delta_i$ measures what an element adds given all the others. It is not a share of the total.

**The cost of the study.** Take six configurations (the full context and the five ablations), 50 questions and 3 repeats. That gives $6 \times 50 \times 3 = 900$ calls. The user-only run is short, so this estimate leaves it out. With 8,000 input tokens and 300 output tokens per call on Claude Sonnet 5.5:

- Input: $900 \times 8{,}000 = 7.2$M tokens, so $7.2 \times 2 = 14.40$ USD.
- Output: $900 \times 300 = 270{,}000$ tokens, so $0.27 \times 10 = 2.70$ USD.
- Total: about 17.10 USD. The ablated configurations are shorter, so this is an upper limit.

**The noise of the study.** An accuracy measured on $N$ questions has a standard error

$$
SE = \sqrt{\frac{p\,(1 - p)}{N}}
$$

The symbols mean:

- $p$ is the measured accuracy, as a fraction.
- $N$ is the number of **distinct** questions.
- A 95% interval is about $p \pm 1.96\,SE$.

> [!example] Worked example: is a 4-point effect real?
> - $p = 0.8$, $N = 50$: $SE = \sqrt{0.8 \times 0.2 / 50} = \sqrt{0.0032} \approx 0.057$. The 95% interval is about $\pm 11.1$ points.
> - $p = 0.8$, $N = 400$: $SE = \sqrt{0.16 / 400} = 0.02$. The interval is about $\pm 3.9$ points.
> - For an interval of $\pm 3$ points at $p = 0.8$: $N = 1.96^2 \times 0.16 / 0.03^2 \approx 683$ questions.
>
> With 50 questions, the effects of history (4 points) and state (1 point) are inside the noise. The study cannot say whether they matter. Repeats on the same questions measure the model's randomness. They do not replace more questions. Compare configurations on the same questions, and see Part 9 for paired tests ([09 Production](/notes/ai/context-engineering/09-production)).

### 4.7 Proxies for context quality

There is no standard "context quality score" (handbook FAQ Q20). The handbook names four proxies. Three work. One does not work with closed models.

| Proxy | How to measure it | Limit |
|---|---|---|
| Task accuracy with and without the context | Ablation (section 4.6) | Needs a labeled test set |
| Token efficiency | Tokens needed to reach a target accuracy | Needs a target, and curves for several budgets |
| Context utilization | The handbook suggests "attention visualization". Use behavioral tests instead (below). | Closed API models do not return attention weights. |
| Hallucination rate | Share of claims in the answer that the window does not support | Needs a human or a calibrated judge (Part 9) |

> [!note] Source check: "attention visualization"
> **Corrected.** The handbook (Session 1, FAQ Q20) suggests "techniques like attention visualization" to see whether the model uses the context. Closed API models, such as the Claude and OpenAI models, return text, a stop reason and token usage. They do not return attention weights, so this is not possible with them. Use behavioral tests. Source: the response formats in the Anthropic Messages API and OpenAI API docs (lesson 1.3), checked on 2026-10-12.

Three behavioral tests answer the engineering question "did the model use this passage?":

1. **Passage ablation.** Remove the passage. If the answer does not change, the model did not need it.
2. **Counterfactual edit.** Change one fact in the passage, for example the return window from 90 to 60 days. If the answer follows the change, the model used the passage. If it still says 90, the answer comes from somewhere else: the weights or another passage.
3. **Citation check.** Ask for a quote of the supporting sentence, and check that the quote is in the window.

### 4.8 Production view

| Concern | What this lesson means for it |
|---|---|
| Quality | There is no universal sweet spot. Find it per task with a test set, and re-measure after each model change. |
| Cost | Rank context items by gain per 1,000 tokens. Cheap, high-gain items such as one good example usually win. |
| Evaluation | Use enough distinct questions. With 50 questions, effects under about 11 points are noise. |
| Observability | Log per-element token counts, so a quality drop can be traced to the element that grew. |
| Reliability | Remove stale tool results and replaced instructions. They hurt quality and cost money on every call. |

## 5. Graphs

```plot
{
  "title": "Toy model, not data: inverted U (red) against the power law 15·√x (blue)",
  "xAxis": { "label": "context tokens (thousands)", "domain": [0, 40] },
  "yAxis": { "label": "quality (0 to 100 scale)", "domain": [0, 105] },
  "disableZoom": true,
  "data": [
    { "fn": "100*(1-exp(-x/2)) - x", "color": "#C81D25" },
    { "fn": "15*sqrt(x)", "color": "#1E6091" }
  ]
}
```

The red curve is the toy model of section 4.2 with $Q_{\max} = 100$, $\tau = 2$ thousand tokens and $\lambda = 1$ point per thousand tokens. It peaks at about 7.8 thousand tokens with a quality of about 90, and falls to 60 at 40 thousand. The blue power law keeps rising. Only the red shape matches the handbook's picture. Neither curve is measured data.

## 6. Code

These exercises go in `notebooks/02-paradigm-shift.ipynb`. Exercises 4.1 to 4.4 call no API.

**Exercise 4.1: power law against inverted U.**

1. Write `power_law(x, a, k)` and `toy_quality(n, q_max, tau, lam)`.
2. Show numerically that the power law is monotonic for $k \in \{-0.5, 0.3, 0.5, 2\}$ on $x \in (0, 100]$.
3. Find the peak of the toy model on a grid of 1-token steps and compare it with the formula for $n^{*}$.

Acceptance tests:

- For the worked example, the grid peak is within 1 token of 7,824.
- With $q_{max} \le \lambda \tau$, your code reports that there is no interior peak.

**Exercise 4.2: an ablation harness.**

1. Write `run_ablation(elements: list[str], evaluate) -> dict[str, float]`, where `evaluate(included: set[str]) -> float` returns an accuracy.
2. Never remove `"user_input"`.
3. Test it with a fake `evaluate` that returns the accuracies of the table in section 4.6.

Acceptance tests:

- The harness returns $\Delta$ = 22, 4, 36, 14 and 1 for the five elements.
- It prints the sum of the effects (77) next to full minus user-only (64), and a warning that the elements interact.

**Exercise 4.3: a noise calculator.**

Write `se(p, n)`, `ci95(p, n)` and `n_for_halfwidth(p, h)`.

Acceptance tests:

- `ci95(0.8, 50)` gives a half-width of about 0.111.
- `n_for_halfwidth(0.8, 0.03)` returns 683 (rounded up).

**Exercise 4.4: a rot detector.**

1. Build a synthetic 30-turn chat as a list of messages with turn numbers and types.
2. Write `detect_rot(messages, current_turn)`. It flags two different output-format instructions and tool results older than 5 turns. It also flags retrieved documents whose period tag differs from the period in the current question.
3. Return a list of findings with the turn number and the cause from section 4.4.

Acceptance tests:

- A chat with "answer in JSON" at turn 3 and "answer in Markdown" at turn 9 gives one instruction-drift finding.
- A tool result at turn 5 is flagged at turn 20 but not at turn 8.

**Exercise 4.5 (optional, costs money): a real ablation.** Use the TechStore bot from lesson 2.6 and 30 test questions. Run the full context and the five ablations once each. Estimate the cost with section 4.6 first. Report each $\Delta_i$ with its 95% interval.

## 7. Common mistakes

1. **"Context quality follows a power law."** A power law has no peak. The handbook's picture is an inverted U, and it is an illustration, not data.
2. **"The sweet spot is a fixed number of tokens or a share of the window."** The peak depends on the task, the content and the model. Lesson 1.5 corrects the "40–60% utilization" claim.
3. **"More relevant documents always help."** Liu et al. measured 20 documents scoring lower than none when the answer sat in the middle.
4. **"The ablation effects add up to the total effect."** Elements interact. Each $\Delta_i$ is an effect given the other elements.
5. **"A 3-point gain on 50 questions proves the change."** With 50 questions, the 95% interval is about ±11 points at 80% accuracy.
6. **"We can watch the attention to see whether the model used our documents."** Closed API models do not return attention weights. Use passage ablation, counterfactual edits and citation checks.

## 8. One-minute explanation

Answer quality first rises with context, then falls. With too little context the model guesses. With too much, distractors, position effects and stale content hurt it. The handbook calls this a power law, but a power law never peaks. The shape is an inverted U, and the handbook's numbers are only an illustration. The peak depends on how fast useful facts saturate and how much each extra token harms, so it differs by task and model. The handbook's five causes of rot are stale knowledge, instruction drift, conversation bloat, old tool results and format pollution. Each one feeds the length effect, stale context, or both. To find the sweet spot, start with a minimum viable context and add items that earn their tokens. Or start full and remove one element at a time. Use enough questions, because small tests are noisy. And use behavioral tests, not attention maps, to check what the model used.

## 9. Check questions

```check
{
  "question": "Can y = 50·x^0.3 have a peak for x > 0? Show it with the slope.",
  "hint": "dy/dx = a·k·x^(k−1).",
  "answer": "No. dy/dx = 50 × 0.3 × x^(−0.7) = 15 / x^0.7, which is positive for every x > 0. The function always rises, more and more slowly. A power law cannot draw a curve that peaks and falls."
}
```

```check
{
  "question": "In the toy model, take Q_max = 100, τ = 1,000 tokens and λ = 0.002 per token. Where is the peak, and what is the quality there?",
  "hint": "n* = τ · ln(Q_max / (λτ)).",
  "answer": "λτ = 2, so n* = 1,000 × ln(50) ≈ 1,000 × 3.912 ≈ 3,912 tokens. Q(n*) = 100 × (1 − 1/50) − 0.002 × 3,912 ≈ 98 − 7.82 ≈ 90.2."
}
```

```check
{
  "question": "Item A is 3,000 tokens of reference text that adds 2 points of accuracy. Item B is a 120-token rule that adds 6 points. Compute the gain per 1,000 tokens for each.",
  "answer": "A: 2 / 3 ≈ 0.67 points per 1,000 tokens. B: 6 / 0.12 = 50 points per 1,000 tokens. B is 75 times more efficient. Keep A only if it prevents a costly failure that the test set shows."
}
```

```check
{
  "question": "A new prompt raises accuracy from 70% to 75% on 100 distinct questions. Is the gain clearly real?",
  "hint": "SE = √(p(1−p)/N), and the 95% interval is about ±1.96 SE.",
  "answer": "At p = 0.7 and N = 100: SE = √(0.21 / 100) ≈ 0.046, so the 95% interval is about ±9 points. A 5-point gain is inside the noise. Use more questions, and compare both prompts on the same questions."
}
```

```check
{
  "question": "At turn 25, a bot answers in JSON although the user asked for plain prose at turn 20. Earlier turns 3 to 10 were all JSON. Which causes of rot are these, and what is the fix?",
  "answer": "Instruction drift (two conflicting format instructions in the history) and format pollution (the model copies the JSON of many earlier turns). Fix: keep one current output_format value in the state element, update it at turn 20, and restate it near the end of the input. Summarize or trim the old JSON turns."
}
```

```check
{
  "question": "The handbook suggests attention visualization to check context utilization. Why does this fail with a closed API model, and what test replaces it?",
  "answer": "Closed API models return text, a stop reason and usage, not attention weights. Replace it with behavioral tests: remove the passage (ablation), change one fact in it (counterfactual edit), or ask for a quote and check that the quote is in the window."
}
```

## 10. Links

- Previous: [L3: The six elements of context](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context)
- Next: [L5: Same task, three approaches](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches)
- [L1.5: Position and length effects](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects): the evidence for the falling side
- Later: [07 Compress and isolate](/notes/ai/context-engineering/07-compress-and-isolate) and [09 Production](/notes/ai/context-engineering/09-production)
- [Glossary](/notes/ai/context-engineering/glossary)
