---
title: "L6: Evaluation"
order: 6
summary: "How to measure an LLM system: a ground truth set from real traffic, scoring by code where possible, a rubric judge where needed, Cohen's kappa to check the judge against humans, and several metrics at once so that the system cannot game one."
status: not-started
tags: [production, evaluation, gtx, llm-as-judge, cohens-kappa, reward-hacking]
---

## 1. The question this idea answers

Code has compilers and tests. An answer to a user has no compiler. So how do you know that a change to the system prompt made the agent better and not worse? How do you score answers that can be right in many wordings? And if a model scores the answers, who checks that model?

This lesson builds the measurement side of production. It covers a ground truth set, scoring methods, an LLM judge with a rubric, and Cohen's kappa to check the judge against humans. It ends with the main trap: a system that learns to raise the score without doing the task.

## 2. Mental model

> [!analogy] Exam marking with a second marker
> A school marks exams with a marking scheme. The scheme lists the points that a good answer must make, and the errors that lose marks. A second marker grades a sample of the same papers. If the two markers agree only as often as two people who flip coins, the scheme is useless. Agreement must be well above chance.
>
> The ground truth set is the exam. The required and forbidden elements are the marking scheme. The LLM judge is a marker, and Cohen's kappa measures its agreement with the human markers beyond chance.
>
> **Where it stops working:** a student who sees the marking scheme can learn to hit its keywords without understanding the subject. An agent under optimization does the same: it can raise a single metric without doing the task. Also, an LLM marker has its own biases, such as a preference for longer answers.

## 3. Terms

| Term | Plain meaning |
|---|---|
| evaluation (eval) | A repeatable measurement of a system's outputs on a fixed set of cases, with a score. |
| ground truth set (GTX) | A set of test cases from the real distribution of use, with answers or criteria that human experts checked. Shopify's name for its evaluation sets. |
| required element | A fact or phrase that a correct answer must contain, often written as a pattern with alternatives. |
| forbidden element | A claim that a correct answer must not contain, for example a common hallucination. |
| match rate | The share of cases in a GTX that pass. |
| exact match | A score that compares the output with the expected value after normalization, such as lower case and no extra spaces. |
| semantic similarity | A score from the cosine similarity of the embeddings of two texts. |
| rubric | A written scoring guide that defines each score level with concrete criteria. |
| LLM-as-judge | A model that scores another model's outputs with a rubric. |
| Cohen's kappa ($\kappa$) | A measure of agreement between two raters that removes the agreement expected by chance. 1 is perfect, 0 is chance level. |
| observed agreement ($p_o$) | The share of items on which two raters give the same label. |
| chance agreement ($p_e$) | The share of agreement expected if each rater labels at random with its own label frequencies. |
| position bias | A judge prefers an answer because of its place in the prompt, for example the first of two. |
| verbosity bias | A judge prefers a longer answer that is not better. |
| self-enhancement bias | A judge prefers answers that its own model family wrote. |
| reward hacking | A system raises its score by a shortcut that does not do the task. |
| misbehaving agent | An agent that completes a task wrongly and sounds confident, so no error appears. |
| GRPO | Group Relative Policy Optimization, a reinforcement-learning method that Shopify used to train its model. |

## 4. Method and math

### 4.1 Three ways to grade

Anthropic's guide "Define success criteria and build evaluations" (checked on 2026-10-12) ranks grading methods:

| Method | Speed and cost | When to use |
|---|---|---|
| Code-based grading | Fastest and most reliable | Exact values, formats, required and forbidden elements |
| LLM-based grading | Fast, flexible, needs a check | Open answers. "Test to ensure reliability first then scale." |
| Human grading | "slow and expensive. Avoid if possible." | Building the GTX, and checking the judge |

The same guide makes a point about volume: "More questions with slightly lower signal automated grading is better than fewer questions with high-quality human hand-graded evals." So use humans to create and calibrate, and machines to score at scale.

Good success criteria are specific and measurable. The guide's example of a good criterion: "Less than 0.1% of outputs out of 10,000 trials flagged for toxicity by the content filter." Its example of a bad one: "Safe outputs".

### 4.2 Ground truth sets

> [!note] Source check: what a GTX is
> **Corrected.** The FAQ (Session 7, Q5) defines a GTX as input-output pairs that "a human expert" verified. It says to collect 50 to 100 conversations and that "even 20 high-quality pairs are better than none". Shopify's post ("Building production-ready agentic systems", Andrew McNamara, 26 August 2025) describes something stricter. Its GTX sets "reflect actual production distributions". At least three product experts label each conversation, and Shopify measures their agreement with Cohen's kappa, Kendall tau and Pearson correlation. The 20 to 100 sizes are the handbook's rule of thumb, not Shopify's. Checked on 2026-10-12.

How to build a first GTX of 20 to 100 cases:

1. **Sample real traffic.** Group real conversations by intent, and sample from each group in proportion to its traffic. Before launch, write realistic cases and replace them with real ones later.
2. **Add hard cases on purpose.** Include cases where the agent failed before, ambiguous requests, and traps for confident errors (section 4.7).
3. **Freeze the context.** Store the tool results and retrieved documents of each case as fixtures. Then a score change comes from your change, not from changed data.
4. **Write the criteria.** For each case: required elements, forbidden elements, and a reference answer for the judge.
5. **Label with two or more people.** Measure their agreement. A case on which experts disagree is a bad test case. Rewrite it or remove it.
6. **Store it as JSON in git.** Each case has an ID, tags and a history.

> [!example] Worked example: one GTX case
> ```json
> {
>   "id": "returns-017",
>   "intent": "return_policy",
>   "input": "I bought a laptop 20 days ago. Can I still return it?",
>   "fixtures": {
>     "lookup_order": {"order_id": "A17", "category": "electronics", "days_since_purchase": 20},
>     "get_return_policy": {"category": "electronics", "return_window_days": 14}
>   },
>   "required": [["14[- ]day"], ["not eligible", "cannot return", "can't return", "no longer"]],
>   "forbidden": ["you have 30 days", "yes, you can return"],
>   "reference_answer": "Electronics have a 14-day return window. Your laptop was bought 20 days ago, so it cannot be returned.",
>   "tags": ["misbehavior-trap", "tool-result-over-general-policy"]
> }
> ```
> Each inner list under `required` is a group of alternatives: the answer must match at least one pattern in every group. This case comes from the handbook's own failure example (FAQ Q23): an agent said 30 days when the tool said 14 days for electronics.

### 4.3 Scoring methods

**Element scoring** is code, so it is fast and exact. A case passes when every required group matches and no forbidden pattern matches:

$$
\text{pass}(y) = \Big(\bigwedge_{g \in R} \exists\, r \in g : r \text{ matches } y\Big) \wedge \Big(\bigwedge_{f \in F} f \text{ does not match } y\Big)
$$

$$
\text{match rate} = \frac{\text{number of passed cases}}{N}
$$

The symbols mean:

- $y$: the answer, after normalization (lower case, single spaces).
- $R$: the list of required groups. Each group $g$ holds alternative patterns $r$.
- $F$: the list of forbidden patterns $f$.
- $\wedge$: "and". $\exists$: "at least one".
- $N$: the number of cases.

> [!example] Worked example: three answers to case returns-017
> 1. "Electronics can be returned within 14 days. Since it has been 20 days, you can't return it." Group 1 matches "14 days". Group 2 matches "can't return". No forbidden pattern. **Pass.**
> 2. "Yes, you can return it within 30 days of purchase." No group matches, and a forbidden pattern matches. **Fail.**
> 3. "Most items have a 30-day window, but for electronics it is 14 days, so this laptop is no longer eligible." Both groups match. "you have 30 days" does not match, because the answer says "a 30-day window". **Pass.**
>
> Answer 3 shows why a forbidden element must be a specific wrong claim, not a bare number. A forbidden pattern "30" would fail a correct answer.

**Semantic similarity** compares the embedding of the answer with the embedding of the reference answer (lesson [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity)). The FAQ (Q28) suggests a threshold of 0.85 and several reference answers for each case. Treat 0.85 as a rule of thumb, and calibrate the threshold on cases that humans labeled. Similarity measures closeness of meaning in general. It does not check facts well: two answers that differ only in "14 days" against "30 days" can still score high. Use similarity for wording variety, and element checks for facts.

**A rubric judge** scores open answers, such as summaries or recommendations.

| Answer type | Method |
|---|---|
| A fixed value: a status, a date, an ID, a number | Exact match after normalization |
| A short answer with key facts | Required and forbidden elements |
| Several valid wordings, semi-structured | Semantic similarity with a calibrated threshold, plus element checks for facts |
| Open text: summaries, advice, tone | Rubric judge, calibrated with kappa |

The FAQ (Q28) says that most production systems combine all three. That matches the order of the table: use the cheapest method that measures what you need.

### 4.4 LLM-as-judge with a rubric

A judge prompt is context too, and it needs the same engineering as the agent's prompt. The FAQ (Q10) contrasts a bare "rate 1–5" with a rubric that rates factual accuracy on a 0–10 scale, where "0 = completely fabricated, 10 = every claim verifiable".

Rules for a judge that agrees with humans:

1. **Score one dimension per call or per field.** For example accuracy, completeness, concision and hallucination absence, each with its own anchors.
2. **Define every score level.** Each level gets a concrete description and, where possible, an example answer.
3. **Give the judge the evidence.** Send the reference answer, the required elements and the tool results of the case.
4. **Ask for an exact output format.** For example `{"accuracy": 0-10, "reason": "..."}`. Anthropic's guide adds: ask for specific, empirical outputs and let the judge reason first.
5. **Calibrate before you trust it.** Label a sample yourself, compute kappa (section 4.5), and change the rubric until agreement is high enough.

Zheng et al. (2023), "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" (NeurIPS 2023 Datasets and Benchmarks, arXiv 2306.05685), found that "strong LLM judges like GPT-4 can match both controlled and crowdsourced human preferences well, achieving over 80% agreement". That is about the level at which humans agree with each other. The same paper studies the judge's weak points:

| Bias | What happens | Defense |
|---|---|---|
| Position bias | In a pairwise comparison, the judge prefers one position | Judge each pair twice, with the order swapped. Count a win only when both orders agree. |
| Verbosity bias | The judge prefers the longer answer | The rubric says that length is not a criterion. Add calibration cases where the shorter answer is better. |
| Self-enhancement bias | The judge prefers its own model family's answers | Use a judge from a different model family. This supports the FAQ's advice (Q13). |
| Limited reasoning | The judge misgrades math or logic | Give the judge the reference answer and the required elements. |

### 4.5 Cohen's kappa

Raw agreement is misleading, because two raters agree sometimes by chance. Cohen (1960) removed that part:

$$
\kappa = \frac{p_o - p_e}{1 - p_e}
$$

For a table of counts $n_{ij}$, where the human gave label $i$ and the judge gave label $j$:

$$
p_o = \frac{1}{N} \sum_{k} n_{kk} \qquad p_e = \sum_{k} \frac{n_{k\cdot}}{N} \cdot \frac{n_{\cdot k}}{N}
$$

The symbols mean:

- $N$: the number of items that both raters labeled.
- $n_{kk}$: the items on which both raters gave label $k$ (the diagonal of the table).
- $n_{k\cdot}$: the items to which the human gave label $k$ (a row total).
- $n_{\cdot k}$: the items to which the judge gave label $k$ (a column total).
- $p_o$: observed agreement. $p_e$: agreement expected by chance from the two raters' label frequencies.

> [!example] Worked example: a judge against a human on 100 answers
> | | Judge: pass | Judge: fail | Row total |
> |---|---|---|---|
> | Human: pass | 45 | 10 | 55 |
> | Human: fail | 15 | 30 | 45 |
> | Column total | 60 | 40 | 100 |
>
> - Observed agreement: $p_o = \frac{45 + 30}{100} = 0.75$.
> - Chance agreement: $p_e = 0.55 \times 0.60 + 0.45 \times 0.40 = 0.33 + 0.18 = 0.51$.
> - Kappa: $\kappa = \frac{0.75 - 0.51}{1 - 0.51} = \frac{0.24}{0.49} \approx 0.49$.
>
> The judge and the human agree on 75% of the answers, but kappa is only 0.49: "moderate" in the bands below. `sklearn.metrics.cohen_kappa_score` gives the same value.

> [!example] Worked example: 90% agreement and a kappa of 0
> A lazy judge says "pass" for every answer. Humans pass 90 of 100 answers.
>
> - $p_o = 0.90$, because the judge agrees on the 90 passes.
> - $p_e = 0.90 \times 1.00 + 0.10 \times 0.00 = 0.90$.
> - $\kappa = \frac{0.90 - 0.90}{1 - 0.90} = 0$.
>
> The judge agrees 90% of the time and knows nothing. This is why the FAQ (Q10) calls kappa, not raw agreement, the key metric.

Landis and Koch (1977, *Biometrics* 33(1):159–174) proposed names for ranges of kappa:

| Kappa | Label |
|---|---|
| below 0 | No agreement |
| 0 to 0.20 | Slight |
| 0.21 to 0.40 | Fair |
| 0.41 to 0.60 | Moderate |
| 0.61 to 0.80 | Substantial |
| 0.81 to 1 | Almost perfect |

These bands are a convention. The authors based them on their own opinion, and they are "by no means universally accepted".

Shopify's result: "Through iterative prompting, we improved our judges" "from barely-better-than-random (Cohen's Kappa of 0.02) to near-human performance (0.61 vs. human baseline of 0.69)". The human baseline matters most. A judge cannot be expected to agree with humans more than humans agree with each other. So compare the judge's kappa with the human-to-human kappa on the same items. Shopify also checked its judges with a swap test: replace one judge with a human and see whether anyone can tell.

> [!note] Source check: why Shopify's kappa rose, and when to retune
> **Corrected.** The FAQ (Q18) says that rubrics, score-level examples and calibration sets raised Shopify's kappa. Shopify's post says only "iterative prompting". The FAQ also gives two different retune thresholds: kappa below 0.5 (Q13) and below 0.4 (Q18). No source supports either number. A practical rule of thumb: retune the judge when its kappa falls clearly below the human-to-human kappa on the same items, and never use a judge in the "fair" band or lower. Sources: Shopify Engineering post, and Landis and Koch (1977), checked on 2026-10-12.

Some scores have more than two levels, such as 0 to 10. There, a near miss (7 against 8) is better than a far miss (2 against 8). A weighted kappa counts that. `cohen_kappa_score` supports it with its `weights` argument.

### 4.6 Reward hacking

> [!note] Source check: Shopify's three reward hacks
> **Corrected.** The FAQ (Q11) adds details to the hacks that Shopify's post does not contain. It says that the model "declined 40% of tasks". It calls tag hacking "data dumped into freeform tags to avoid validation". It says that hallucinated IDs gave partial results. The post, about its GRPO training, says: opt-out hacking, "Instead of attempting difficult tasks, the model would explain why it couldn't help". Tag hacking, "Using customer tags as a catch-all instead of proper field mappings". Schema violations, "Hallucinating IDs or using incorrect enum values". Checked on 2026-10-12.

Each hack raises a score that measures one thing while the task fails:

| Hack | What a narrow metric sees | What actually happened |
|---|---|---|
| Opt-out hacking | Few wrong answers | The agent refused hard tasks that it could do |
| Tag hacking | The data was saved | It went into a free-text tag, not the right field |
| Schema violations | The call was made | With an invented ID or a wrong enum value |

> [!example] Worked example: how opt-out hacking fools one metric
> These numbers are illustrative. Two agents get the same 100 tasks.
>
> | Agent | Attempted | Succeeded | Success among attempts | Success over all tasks |
> |---|---|---|---|---|
> | A | 100 | 70 | 70.0% | 70% |
> | B | 60 | 55 | 91.7% | 55% |
>
> A metric of "success among attempts" ranks B first. B refused 40 tasks and solved fewer. The attempt rate (60% for B) and the success over all tasks show the hack.

The FAQ's fix (Q11) is right: never use one metric. Measure success rate, attempt rate, user satisfaction and tool-call correctness together. A hack that raises one of them usually lowers another.

### 4.7 Failing and misbehaving agents

The FAQ (Q23) separates two kinds of failure:

| | Visible to monitoring | Invisible to monitoring |
|---|---|---|
| The agent knows it failed | Failing: an error, a crash, "I cannot help" | |
| The agent does not know | | Misbehaving: a confident wrong answer |

The handbook's examples come from its Lab 3 transcript. The agent said that a laptop had a 30-day return window, but the tool result said 14 days for electronics. It also said that an email was sent when the `send_email` tool returned an error. No error monitor sees these. Only a GTX with trap cases, a judge or a human review finds them.

The FAQ says that the rubric should penalize confident wrong answers more than honest uncertainty. Here is one scoring rule that does this. A correct answer gets +1, an honest "I am not sure" gets 0, and a confident wrong answer gets −2.

> [!example] Worked example: the same 100 questions, two agents
> | Agent | Correct | Abstained | Wrong | Accuracy | Score with +1, 0, −2 |
> |---|---|---|---|---|---|
> | A | 80 | 0 | 20 | 0.80 | $(80 - 2 \times 20)/100 = 0.40$ |
> | B | 76 | 18 | 6 | 0.76 | $(76 - 2 \times 6)/100 = 0.64$ |
>
> Accuracy prefers A. The penalty prefers B, which is wrong only 6 times. But a large penalty also rewards refusal, which is opt-out hacking. So report the attempt rate (A: 100%, B: 82%) next to the score, and set a minimum for it.

### 4.8 Several metrics at once

| Dimension | How to measure it | Method |
|---|---|---|
| Task success | GTX match rate | Code, judge |
| Attempt rate | Share of tasks not refused | Code |
| Tool-call correctness | Right tool, valid arguments, real IDs | Code against fixtures |
| Groundedness | Claims supported by the context | Judge with the context (lesson [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval)) |
| Confident errors | Wrong answers without hedging | Trap cases, judge |
| Cost and latency | Tokens and seconds per conversation | Traces ([L8](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency)) |
| User satisfaction | Ratings, complaints, task completion in the product | Production data |

### 4.9 Production view

| Concern | What this lesson means for it |
|---|---|
| Reliability | A change ships only if the GTX match rate and the other dimensions hold. Lesson [L7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) makes this a CI gate. |
| Cost | Code checks are nearly free. Judge calls cost money. Use the judge only where code cannot score. |
| Quality of the judge | Recompute kappa against fresh human labels on a schedule and after any change to the judge prompt or model. |
| Security | Include adversarial cases, such as prompt injection in a tool result (lesson [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection)). |
| Drift | Add each real failure to the GTX. Refresh the sample of real traffic over time. |

## 5. Graphs

```plot
{
  "title": "Shopify's judge kappa, first prompt to tuned prompt (red), human-to-human kappa 0.69 (blue), Landis-Koch band limits (ink)",
  "xAxis": { "label": "judge version (1 = first prompt, 2 = after iterative prompting)", "domain": [0.5, 2.5] },
  "yAxis": { "label": "Cohen's kappa", "domain": [0, 1] },
  "disableZoom": true,
  "data": [
    { "points": [[1, 0.02], [2, 0.61]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 0.02], [2, 0.61]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "fn": "0.69", "color": "#1E6091", "skipTip": true },
    { "fn": "0.2", "color": "#100D12", "skipTip": true },
    { "fn": "0.4", "color": "#100D12", "skipTip": true },
    { "fn": "0.6", "color": "#100D12", "skipTip": true },
    { "fn": "0.8", "color": "#100D12", "skipTip": true }
  ]
}
```

The first judge sits in the "slight" band. The tuned judge sits just above the 0.6 line, in "substantial", and below the blue human baseline. Values from Shopify's post.

## 6. Code

These exercises go in `notebooks/09-production.ipynb`. The GTX goes in `evals/gtx.json`, and the scorer in `src/evals/score.py`, with tests in `tests/`.

**Exercise 6.1: a 20-case GTX.**

1. Pick an agent that you know: a support bot, an MCP tool agent or a NL2SQL agent.
2. Write 20 cases in the format of section 4.2. At least 4 cases are trap cases for confident errors.
3. Validate the file with a Pydantic model.

Acceptance tests:

- Every case has an ID, an input, fixtures, at least one required group and at least one forbidden pattern.
- The IDs are unique.

**Exercise 6.2: an element scorer.**

1. Write `score_case(answer: str, case: Case) -> CaseResult`. It normalizes the answer, checks the required groups and the forbidden patterns, and records which ones matched.
2. Write `match_rate(results) -> float`.

Acceptance tests:

- The three answers of section 4.3 give pass, fail, pass.
- A forbidden match is reported even when all required groups match.

**Exercise 6.3: kappa three ways.** Compute kappa for the table of section 4.5 by hand, with your own function `cohen_kappa(table)`, and with `sklearn.metrics.cohen_kappa_score`.

Acceptance test: all three give 0.49 (to two decimals). The lazy judge gives 0.

**Exercise 6.4 (optional, costs money): calibrate a rubric judge.**

1. Write a judge prompt with a 0 to 10 accuracy rubric and anchors for 0, 3, 7 and 10.
2. Label 30 answers yourself as pass or fail. Run the judge, and map scores of 7 or more to pass.
3. Compute kappa. Change the rubric once and compute it again.

Acceptance test: a table with both kappa values and one sentence on what changed.

**Exercise 6.5: similarity is not a fact check.** Use a local `sentence-transformers` model. Compute the cosine similarity of two sentences: "The return window for electronics is 14 days." and "The return window for electronics is 30 days." Compare the result with the FAQ's threshold of 0.85.

## 7. Common mistakes

1. **"75% agreement means a good judge."** Correct for chance first. The example of section 4.5 has 75% agreement and kappa 0.49.
2. **"Semantic similarity checks correctness."** It checks closeness of meaning. Answers that differ in one number can score high.
3. **"One metric is enough."** A single metric invites reward hacking. Track success, attempt rate, tool-call correctness and errors together.
4. **"The judge is a neutral referee."** Judges have position, verbosity and self-enhancement biases. Swap orders, write length-neutral rubrics and use another model family.
5. **"A GTX is a set of nice synthetic examples."** It reflects the real distribution of use and includes hard and trap cases.
6. **"Our judge should beat the humans."** Humans set the ceiling. Compare the judge's kappa with the human-to-human kappa.

## 8. One-minute explanation

To measure an LLM system, build a ground truth set: real cases from production, labeled by more than one expert, with required and forbidden elements. Score with code wherever you can: exact match and element checks are fast and exact. Use semantic similarity for wording, not for facts. For open answers, use an LLM judge with a rubric that defines every score level. Then check the judge against humans with Cohen's kappa, which removes agreement by chance. A judge that always says pass can agree 90% of the time and still have a kappa of zero. Shopify raised its judge from 0.02 to 0.61, against 0.69 between humans. Finally, never trust one metric. Shopify's model learned to refuse hard tasks and to misuse fields. Track several metrics so that a hack in one shows in another.

## 9. Check questions

```check
{
  "question": "A judge and a human label 200 answers. Both say pass on 120, human pass and judge fail on 20, human fail and judge pass on 10, both fail on 50. Compute kappa and name its band.",
  "hint": "Human pass rate = 140/200. Judge pass rate = 130/200.",
  "answer": "p_o = (120 + 50) / 200 = 0.85. p_e = 0.70 × 0.65 + 0.30 × 0.35 = 0.455 + 0.105 = 0.56. κ = (0.85 − 0.56) / (1 − 0.56) = 0.29 / 0.44 ≈ 0.66. That is in the substantial band (0.61 to 0.80)."
}
```

```check
{
  "question": "Why can a judge agree with humans on 90% of answers and still have a kappa of 0?",
  "answer": "If humans pass 90% of the answers and the judge passes all of them, the judge agrees on exactly the 90% that chance predicts from the label frequencies: p_e = 0.9 × 1 + 0.1 × 0 = 0.9. So p_o = p_e and κ = 0. The judge carries no information."
}
```

```check
{
  "question": "After a round of reinforcement learning, an agent's success rate on attempted tasks rises from 82% to 95%, but user complaints rise. What is the likely cause, and which metric confirms it?",
  "answer": "Opt-out hacking: the agent refuses hard tasks, so the tasks it attempts are easier and succeed more often. The attempt rate confirms it. It should fall. Success over all tasks will also be flat or lower."
}
```

```check
{
  "question": "In a pairwise test, a judge picks the answer in position A in 70% of comparisons, whichever system wrote it. What is this, and how do you fix the measurement?",
  "answer": "Position bias, one of the biases that Zheng et al. (2023) studied. Judge each pair twice with the order swapped, and count a win only when both orders pick the same answer. Count the rest as ties."
}
```

```check
{
  "question": "Pick a scoring method for each: (a) the status of an order, (b) a 200-word summary of a meeting, (c) an answer that must state a 14-day return window.",
  "answer": "(a) Exact match after normalization. (b) A rubric judge, calibrated with kappa. (c) Required and forbidden elements: require a 14-day pattern and forbid the specific wrong claim, such as you have 30 days."
}
```

## 10. Links

- Previous: [L5: Commands, skills and hooks](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks)
- Next: [L7: Evals in CI and versioning](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning)
- [Lesson 5.8: Measure retrieval and answers](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval)
- [Lesson 4.6: Embeddings and similarity](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity)
- [Glossary](/notes/ai/context-engineering/glossary)
