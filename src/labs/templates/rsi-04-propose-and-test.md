---
title: "RSI P4 · Propose and test strategy changes"
summary: "Improve the agent's priority weights by hill climbing, compare acceptance on the training set with acceptance on the validation set, and see overfitting on the held-out test set."
collection: "AI"
tags: [rsi, bin-packing, hill-climbing, overfitting, numpy]
packages: [numpy, matplotlib]
level: "Intermediate"
order: 104
objectives:
  - "Describe a strategy as a vector of weights over features of a bin."
  - "Write a proposer that makes a small random change to the weights."
  - "Write a hill-climbing loop that accepts a candidate only when it scores better."
  - "Compare acceptance on a small training set with acceptance on a validation set."
  - "Explain overfitting with numbers: a better selection score and a worse test score."
---
# P4: Propose and test strategy changes

In P1 to P3 the agent never changed. Now an outer loop changes it. This is the first **improvement loop** of the course:

1. Take the current version of the agent.
2. A **proposer** makes a **candidate**: a copy with a small random change.
3. An **evaluator** scores the candidate on a task set.
4. An **acceptance rule** decides: keep the candidate if its score is better, or keep the parent.
5. Repeat.

The loop is outside the agent. The agent does not change itself, so this is not yet self-improvement. But every later project uses this loop.

The key question of this lab: **which task set should the acceptance rule look at?**

## 1. The pieces from P1, and a family of strategies

The strategy is now a vector of six **weights** $w$. For one open bin, six **features** describe the fit, and the priority is the weighted sum

$$
\text{priority}(\text{item}, \text{space}) = \sum_{k=1}^{6} w_k \, f_k(\text{item}, \text{space})
$$

| k | Feature $f_k$ | Meaning |
|---|---|---|
| 1 | $-g$ | tight fit. $g = (\text{space} - \text{item}) / 100$ is the gap that stays after the item. |
| 2 | $g^2$ | squared gap |
| 3 | $(\text{item}/100) \cdot g$ | the gap, scaled by the item size |
| 4 | 1 if $g = 0$, else 0 | exact fit |
| 5 | 1 if $0 < \text{space} - \text{item} < 20$, else 0 | a small gap that few items can fill |
| 6 | $(\text{item}/100) \cdot f_5$ | the small gap, scaled by the item size |

All zeros give first fit, because every bin ties. The vector `[1, 0, 0, 0, 0, 0]` gives best fit.

```python
import math
import numpy as np
import matplotlib.pyplot as plt
import lab

CAPACITY = 100
FAMILIES = ["uniform 20-100", "small 1-30", "mixed big-small", "triangular", "weibull 45"]


def make_instance(rng, family, n_items):
    if family == "uniform 20-100":
        sizes = rng.integers(20, 101, n_items)
    elif family == "small 1-30":
        sizes = rng.integers(1, 31, n_items)
    elif family == "mixed big-small":
        big = rng.random(n_items) < 0.5
        sizes = np.where(big, rng.integers(55, 86, n_items), rng.integers(10, 46, n_items))
    elif family == "triangular":
        sizes = np.rint(rng.triangular(1, 40, 100, n_items))
    elif family == "weibull 45":
        sizes = np.rint(45 * rng.weibull(3.0, n_items))
    else:
        raise ValueError(f"unknown family {family!r}")
    return [int(s) for s in np.clip(sizes, 1, 100)]


def make_task_set(family, n_instances, n_items, seed):
    rng = np.random.default_rng(seed)
    return [make_instance(rng, family, n_items) for _ in range(n_instances)]


def make_splits(family, n_train, n_val, n_test, n_items):
    k = FAMILIES.index(family)
    return {"train": make_task_set(family, n_train, n_items, 1 + 1000 * k),
            "validation": make_task_set(family, n_val, n_items, 2 + 1000 * k),
            "test": make_task_set(family, n_test, n_items, 3 + 1000 * k)}


def pack(items, priority, capacity=CAPACITY):
    free, bins = [], []
    for i, item in enumerate(items):
        best_j, best_p = -1, -math.inf
        for j, space in enumerate(free):
            if space >= item:
                p = priority(item, space)
                if p > best_p:
                    best_j, best_p = j, p
        if best_j == -1:
            free.append(capacity - item)
            bins.append([i])
        else:
            free[best_j] -= item
            bins[best_j].append(i)
    return bins


def lower_bound(items, capacity=CAPACITY):
    return math.ceil(sum(items) / capacity)


def excess(items, bins, capacity=CAPACITY):
    l1 = lower_bound(items, capacity)
    return (len(bins) - l1) / l1


def mean_excess(task_set, priority):
    return sum(excess(items, pack(items, priority)) for items in task_set) / len(task_set)


def first_fit(item, space):
    return 0


def best_fit(item, space):
    return -(space - item)


FEATURES = ["tight fit", "squared gap", "item x gap", "exact fit", "small gap", "item x small gap"]


def make_priority(w):
    """Turn a weight vector into a priority function."""
    w = [float(x) for x in w]

    def priority(item, space):
        gap = (space - item) / 100
        size = item / 100
        small = 1.0 if 0 < space - item < 20 else 0.0
        return (w[0] * -gap + w[1] * gap * gap + w[2] * size * gap
                + w[3] * (space == item) + w[4] * small + w[5] * size * small)

    return priority


print("Ready.")
```

Explore the family first. Move the weights and watch the score on the validation set. Keep the test set closed for now.

```python
w1 = 1.0  # @param {type:"slider", min:-3, max:3, step:0.25, label:"tight fit"}
w2 = 0.0  # @param {type:"slider", min:-3, max:3, step:0.25, label:"squared gap"}
w3 = 0.0  # @param {type:"slider", min:-3, max:3, step:0.25, label:"item x gap"}
w4 = 0.0  # @param {type:"slider", min:-3, max:3, step:0.25, label:"exact fit"}
w5 = 0.0  # @param {type:"slider", min:-3, max:3, step:0.25, label:"small gap"}
w6 = 0.0  # @param {type:"slider", min:-3, max:3, step:0.25, label:"item x small gap"}

splits = make_splits("weibull 45", 8, 30, 200, 30)
val = splits["validation"]
mine = mean_excess(val, make_priority([w1, w2, w3, w4, w5, w6]))
print(f"your weights : {100 * mine:5.2f} % mean excess on the validation set")
print(f"first fit    : {100 * mean_excess(val, first_fit):5.2f} %")
print(f"best fit     : {100 * mean_excess(val, best_fit):5.2f} %")
```

1. Set "tight fit" to -1. This is worst fit: it prefers the emptiest bin. How much worse is it?
2. Multiply every weight by 2. The score does not change. Why? (Hint: which bin wins depends only on the order of the priorities.)

## 2. The proposer

The proposer adds a small random change to **every** weight: $w' = w + \sigma z$, where $z$ holds one standard normal draw per weight and $\sigma$ is the **step size**. It must return a new array and leave the parent unchanged. The archive of later projects keeps parents, so a proposer that edits its parent in place would corrupt them.

```python
def propose(w, step, rng):
    """Return a new float array: w + step * (one standard normal draw per weight).

    Do not change w itself.
    """
    # TODO
    raise NotImplementedError("Write propose(w, step, rng)")
```

```check
{
  "question": "Stuck on propose?",
  "hint": "rng.normal(size=n) gives n standard normal draws at once. Convert w to a float array first, so that a list also works.",
  "answer": "Key line: `return np.asarray(w, dtype=float) + step * rng.normal(size=len(w))`. The + makes a new array, so the parent does not change."
}
```

```python
w = np.zeros(6)
c = propose(w, 1.0, np.random.default_rng(0))
lab.check("the candidate has 6 weights", c.shape, (6,))
lab.check("the parent does not change", w, np.zeros(6))
lab.check("a list works too", propose([0, 0, 0, 0, 0, 0], 1.0, np.random.default_rng(0)), c)
lab.check("step 0 gives a copy", propose(np.ones(6), 0.0, np.random.default_rng(1)), np.ones(6))
lab.check("the same seed gives the same candidate", propose(w, 1.0, np.random.default_rng(5)), propose(w, 1.0, np.random.default_rng(5)))
rng = np.random.default_rng(2)
many = np.array([propose(w, 0.5, rng) for _ in range(2000)])
lab.check("the changes have mean 0", float(many.mean()), 0.0, tol=0.03)
lab.check("the changes have the size of the step", float(many.std()), 0.5, tol=0.03)
lab.check("every weight changes", bool(np.all(many[0] != 0)))
```

## 3. The hill-climbing loop

**Hill climbing** keeps one current version and accepts a candidate only if it is strictly better. Lower mean excess is better here.

```python
def hill_climb(w0, select_set, iterations, step, seed):
    """Improve the weights w0 by hill climbing on select_set.

    rng = np.random.default_rng(seed). In each iteration, make ONE candidate
    with propose(best_w, step, rng), score it with mean_excess on select_set,
    and accept it only if its score is strictly lower than the best so far.
    Return (best_w, best_score, history). history[0] is the start score and
    history[t] is the best score after iteration t, so len(history) = iterations + 1.
    """
    # TODO
    raise NotImplementedError("Write hill_climb(w0, select_set, iterations, step, seed)")
```

```check
{
  "question": "Stuck on hill_climb?",
  "hint": "Keep two variables: the best weights and their score. Score a candidate with mean_excess(select_set, make_priority(candidate)). Append the best score to the history after every iteration, also when you reject.",
  "answer": "Pseudocode:\n\n    rng = the generator for seed\n    best_w = w0 as a float array; best = its mean excess on select_set\n    history = [best]\n    repeat iterations times:\n        cand = propose(best_w, step, rng)\n        score = mean excess of cand on select_set\n        if score < best: best_w, best = cand, score\n        append best to history\n    return best_w, best, history"
}
```

```python
tiny = make_task_set("mixed big-small", 5, 30, 77)
w_a, s_a, h_a = hill_climb(np.zeros(6), tiny, 0, 1.0, 0)
lab.check("0 iterations return the start weights", w_a, np.zeros(6))
lab.check("0 iterations return the start score", s_a, mean_excess(tiny, first_fit), tol=1e-12)
lab.check("0 iterations give one history entry", len(h_a), 1)
w_b, s_b, h_b = hill_climb(np.zeros(6), tiny, 40, 1.0, 3)
lab.check("one history entry per iteration, plus the start", len(h_b), 41)
lab.check("the best score never gets worse", all(b <= a for a, b in zip(h_b, h_b[1:])))
lab.check("the returned score is the last history entry", s_b, h_b[-1])
lab.check("the returned score belongs to the returned weights", s_b, mean_excess(tiny, make_priority(w_b)), tol=1e-12)
lab.check("the run repeats with the same seed", hill_climb(np.zeros(6), tiny, 40, 1.0, 3)[1], s_b)
lab.check("this run found an improvement", s_b < h_b[0])
lab.check("one candidate per iteration, from one generator", np.round(w_b, 6),
          np.array([0.957759, -0.199802, 0.02426, 1.545821, 0.545106, -0.505229]), tol=1e-6)
```

## 4. Experiment: accept on the training set or on the validation set?

Two loops start from first fit (all zeros). Loop A accepts candidates by their score on a small **training set**. Loop B accepts by the score on a larger **validation set**. Both are then scored once on the **test set**, which neither loop saw.

```python
family = "weibull 45"  # @param ["uniform 20-100", "small 1-30", "mixed big-small", "triangular", "weibull 45"]
n_items = 30           # @param {type:"slider", min:10, max:80, step:10}
n_train = 8            # @param {type:"slider", min:2, max:60, step:1}
n_val = 30             # @param {type:"slider", min:5, max:60, step:5}
iterations = 120       # @param {type:"slider", min:10, max:300, step:10}
step = 1.0             # @param {type:"slider", min:0.1, max:3, step:0.1}
n_seeds = 4            # @param {type:"slider", min:1, max:8, step:1}

splits = make_splits(family, n_train, n_val, 200, n_items)
names = ["train", "validation", "test"]


def scores_of(priority):
    return [100 * mean_excess(splits[n], priority) for n in names]


print(f"{'':22s}{'train':>8s}{'valid.':>8s}{'test':>8s}   (mean excess, %)")
print(f"{'first fit':22s}" + "".join(f"{v:8.2f}" for v in scores_of(first_fit)))
print(f"{'best fit':22s}" + "".join(f"{v:8.2f}" for v in scores_of(best_fit)))
results = {"A: accept on train": [], "B: accept on validation": []}
histories = {}
for seed in range(n_seeds):
    for label, select in [("A: accept on train", "train"), ("B: accept on validation", "validation")]:
        w_end, _, hist = hill_climb(np.zeros(6), splits[select], iterations, step, seed)
        row = scores_of(make_priority(w_end))
        results[label].append(row)
        histories.setdefault(label, hist)
        print(f"{label[:1]} seed {seed:<15d}" + "".join(f"{v:8.2f}" for v in row))
for label, rows in results.items():
    print(f"{'mean ' + label[:1]:22s}" + "".join(f"{v:8.2f}" for v in np.mean(rows, axis=0)))

fig, (a1, a2) = plt.subplots(1, 2, figsize=(10, 3.4))
for label, color in [("A: accept on train", "#C81D25"), ("B: accept on validation", "#2A9D8F")]:
    a1.plot(100 * np.array(histories[label]), color=color, label=label)
a1.set(xlabel="iteration", ylabel="selection score (%)", title="what each loop sees (seed 0)")
a1.legend()
bars = {"first fit": scores_of(first_fit)[2], "best fit": scores_of(best_fit)[2],
        "A": np.mean(results["A: accept on train"], axis=0)[2], "B": np.mean(results["B: accept on validation"], axis=0)[2]}
a2.bar(list(bars), list(bars.values()), color=["#8A8A8A", "#8A8A8A", "#C81D25", "#2A9D8F"])
a2.set(ylabel="test score (%)", title="what really happened (mean over seeds)")
fig.tight_layout()
```

## Observations

1. Loop A improved its training score below the training score of best fit. Did its test score follow? Why not?
2. Set `n_train` to 40 and run again. What happens to the gap between loop A and loop B? Why?
3. Loop B also chose by a score that it saw many times. Why can its validation score also be a little too optimistic?
