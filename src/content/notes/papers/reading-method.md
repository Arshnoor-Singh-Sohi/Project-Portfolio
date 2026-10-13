---
title: "How to read a paper"
order: 1
summary: "The method for every paper in this area, and the set of pages that each paper folder has."
tags: [method, papers]
---

## 1. The question this page answers

A research paper is dense. It assumes knowledge that you may not have. How do you read a paper so that you can explain it, judge it and use it?

## 2. Mental model

> [!analogy] A paper is a lab report
> The authors changed something, kept other things the same, and measured a result. Your job is to rebuild the lab bench in your head. Then you can say what they changed, what they kept the same, what they measured and what they concluded.
>
> **Where it stops working:** some papers are not experiments. A survey paper or a theory paper has no lab bench. For those papers, replace "the experiment" with "the argument".

## 3. Six passes

Read a paper in six passes. Each pass has one goal.

| Pass | Goal | You are done when |
|---|---|---|
| 1. Map | Read the title, the abstract, the figures, the conclusion. | You can state the main claim in one sentence. |
| 2. Background | List every term that you cannot explain. Learn each term. | You can explain each term without jargon. |
| 3. Method | Find what the authors changed, what they kept the same, and what they measured. | You can draw the experiment. |
| 4. Results | For each figure: name the axes, the trend, the size of the effect and the baseline. | You can read each number from a figure and say what it means. |
| 5. Judge | Ask what can make the result wrong. Ask what the result changes in your own systems. | You can name two limits and two engineering rules. |
| 6. Rebuild | Reproduce one small part in code. | Your result matches the trend in the paper, or you can explain why it does not. |

## 4. Questions to ask every paper

- [ ] What problem does the paper solve? Why did the problem exist before?
- [ ] What is the claim, in one sentence?
- [ ] What is the independent variable (what changes)? What stays the same?
- [ ] What is the measure? Is the measure fair?
- [ ] What are the baselines? What is the lowest possible score and the highest?
- [ ] How large is the effect, in absolute numbers?
- [ ] Is a result a measurement, a hypothesis or a proof?
- [ ] What did later work confirm or change?
- [ ] Would I change a production system because of this paper? What exactly would I change?

## 5. The pages of a paper folder

Every paper folder has the same pages. Omit a page that the paper does not need.

| Page | The question it answers |
|---|---|
| `_folder.md` | The paper card: citation, the result in three sentences, the reading order, the color legend, the media list. |
| `00` The paper on one page | What must I remember? How do I teach it in one minute? |
| `01`, `02` Background | Which ideas must I know before I read the paper? |
| The question | What did the authors want to find, and why? |
| Experiment design | What did they change, keep the same and measure? |
| Results (one page for each main result) | What did they find, with which numbers? |
| Why it happens | Which causes did they test? Which ideas are only hypotheses? |
| Engineering takeaways | What do I change in my systems? |
| Limits and later work | How far can I trust the result? What came after? |
| Reproduce it | How do I rebuild a small part of the experiment myself? |

## 6. How a paper session works

The teaching rules of the notes protocol apply to papers too.

1. **Recall.** One or two questions on old pages.
2. **One page.** Read one page. Then answer its check questions in your own words.
3. **Explain back.** Explain the page as if to another engineer.
4. **Gate.** Move to the next page only after correct answers with correct reasons.
5. **Code.** The "Reproduce it" page has exercises. You write the code. Hints come in three levels.

> [!key] A paper is not finished when you have read it
> A paper is finished when you can explain the experiment, read its figures, name its limits and use it in a design decision.

## 7. Check questions

```check
{
  "question": "For any experiment in a paper, which three things must you be able to name?",
  "hint": "Think of the dials on a lab bench and the meter.",
  "answer": "What the authors changed (the independent variable), what they kept the same (the controls), and what they measured (the dependent variable, for example accuracy)."
}
```

```check
{
  "question": "A figure shows accuracy 75.8% at one point and 53.8% at another point. Which two ways can you state the size of the difference?",
  "hint": "One way subtracts. The other way divides.",
  "answer": "Absolute: 75.8 − 53.8 = 22.0 percentage points. Relative: 22.0 / 75.8 ≈ 29% of the higher value. Always say which one you mean."
}
```

## 8. Links

- [Papers](/notes/papers)
- [Glossary](/notes/papers/glossary)
- [00 Progress](/notes/papers/00-progress)
