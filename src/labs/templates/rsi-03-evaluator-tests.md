---
title: "RSI P3 · An evaluator with explicit tests"
summary: "Write a validator that rejects invalid packings, and watch a cheating packer win on a naive score and lose on a checked score: reward hacking in miniature."
collection: "AI"
tags: [rsi, bin-packing, evaluation, reward-hacking, numpy]
packages: [numpy, matplotlib]
level: "Beginner"
order: 103
objectives:
  - "Explain why a score that trusts the agent's answer can be fooled."
  - "Write a validator with explicit tests: every item placed exactly once, no bin over capacity, only real items."
  - "Combine the validator and the score so that an invalid answer can never win."
  - "Show a cheating packer that wins on the naive score and fails the checked score."
---
# P3: An evaluator with explicit tests

An improvement loop keeps the versions with the best score. So the loop follows the score, not your intention. If the score has a gap, a strong enough search finds the gap. This is **reward hacking**: a high score without the intended result.

In P1 the score was the number of bins. It trusted the packing. It did not check that the packing contains every item, or that no bin is too full. In this lab you write those checks.

## 1. The pieces from P1, and two cheaters

Run this cell. It defines the pieces from P1, an honest packer, and two **cheating packers**. A cheater is a candidate that an improvement loop could find by accident. It does not know that it cheats. It only scores well.

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


def first_fit(item, space):
    return 0


def best_fit(item, space):
    return -(space - item)


def naive_score(items, packing):
    """The P1 score. It trusts the packing: it only counts the bins."""
    return excess(items, packing)


def honest_packer(items):
    return pack(items, best_fit)


def drop_big_packer(items, limit=70):
    """CHEATER: best fit, but it silently leaves out every item larger than limit."""
    keep = [i for i, s in enumerate(items) if s <= limit]
    bins = pack([items[i] for i in keep], best_fit)
    return [[keep[i] for i in b] for b in bins]


def overfill_packer(items, capacity=110):
    """CHEATER: best fit, but with a larger capacity than the real one."""
    return pack(items, best_fit, capacity=capacity)


val = make_splits("mixed big-small", 20, 20, 100, 60)["validation"]
for name, packer in [("honest", honest_packer), ("drop big", drop_big_packer), ("overfill", overfill_packer)]:
    scores = [naive_score(x, packer(x)) for x in val]
    print(f"{name:9s} naive mean excess {100 * np.mean(scores):6.2f} %")
```

Both cheaters beat the honest packer on the naive score. The "drop big" packer even reports a **negative** excess: it uses fewer bins than the lower bound allows. That is impossible for a correct packing. A negative excess is a free signal that something is wrong. A subtle cheat would not give such a clear signal.

```check
{
  "question": "The overfill cheater reports a mean excess of about 2.6 %. That looks like a normal score. Why is it more dangerous than the drop-big cheater?",
  "hint": "Which of the two scores could a person notice at once, without any test?",
  "answer": "A negative excess is impossible for a correct packing, so a simple range check on the score finds the drop-big cheater. The overfill score stays inside the normal range, so no check on the number alone can find it. Only explicit tests on the answer itself find it. Subtle cheats are the dangerous ones."
}
```

## 2. The validator

Write `validate`. It returns a list of **reasons**: short strings that say what is wrong. An empty list means that the packing is valid. Use these exact phrases, because the tests look for them:

| Problem | Reason text |
|---|---|
| An entry is not an integer index from 0 to len(items) - 1 | `unknown item ...` |
| Item `i` is in no bin | `missing item i` |
| Item `i` is in `n` > 1 places | `item i placed n times` |
| The real sizes in bin `j` add up to more than the capacity | `bin j over capacity: ...` |
| Bin `j` has no items | `empty bin j` |

Compute each load from the **real** sizes in `items`. Never trust a number that the packer reports about itself.

```python
def validate(items, packing, capacity=CAPACITY):
    """Return a list of reasons why the packing is invalid. [] means valid.

    packing is a list of bins; each bin is a list of item indices.
    Use the reason texts from the table above.
    """
    # TODO
    raise NotImplementedError("Write validate(items, packing, capacity)")
```

```check
{
  "question": "Stuck on validate?",
  "hint": "Count how many times each index appears in a list `times` of zeros, one per item. Go through each bin once: check that it is not empty, check each entry, add the real size of each known item to the load, and compare the load with the capacity. After the loop, look at `times`.",
  "answer": "Pseudocode:\n\n    reasons = empty list; times = a zero for each item\n    for each bin j:\n        if the bin is empty: add 'empty bin j'\n        load = 0\n        for each entry i in the bin:\n            if i is not an int, or i < 0, or i >= len(items): add 'unknown item ...' and skip it\n            times[i] += 1; load += items[i]\n        if load > capacity: add 'bin j over capacity: load > capacity'\n    for each item i: if times[i] == 0 add 'missing item i'; if times[i] > 1 add 'item i placed times[i] times'\n    return reasons"
}
```

```python
items = [50, 30, 70, 20]
lab.check("a valid packing gives no reasons", validate(items, [[0, 1, 3], [2]]), [])
lab.check("a missing item is found", any("missing item 3" in r for r in validate(items, [[0, 1], [2]])))
lab.check("an item placed twice is found", any("item 3 placed 2 times" in r for r in validate(items, [[0, 1, 3], [2, 3]])))
lab.check("an overfull bin is found", any("bin 0 over capacity" in r for r in validate(items, [[0, 2], [1, 3]])))
lab.check("an empty bin is found", any("empty bin 2" in r for r in validate(items, [[0, 1, 3], [2], []])))
lab.check("an index out of range is unknown", any("unknown item" in r for r in validate(items, [[0, 1, 3], [2, 7]])))
lab.check("a text entry is unknown", any("unknown item" in r for r in validate(items, [[0, 1, 3], [2, "3"]])))
lab.check("the capacity argument is used", validate([60, 60], [[0, 1]], capacity=120), [])
lab.check("an empty instance with no bins is valid", validate([], []), [])
some = make_task_set("mixed big-small", 20, 40, 9)
lab.check("the honest packer always passes", all(validate(x, honest_packer(x)) == [] for x in some))
lab.check("the drop-big cheater fails", all(validate(x, drop_big_packer(x)) != [] for x in some))
lab.check("the overfill cheater fails on some instances", any(validate(x, overfill_packer(x)) != [] for x in some))
```

## 3. A checked score

Now join the validator and the score. An invalid packing gets the score `math.inf`, so it can never be the best. Then write `evaluate_packer`, which runs one packer on a task set and reports both scores.

```python
def checked_score(items, packing):
    """Return (score, reasons). Valid: (excess, []). Invalid: (math.inf, reasons)."""
    # TODO
    raise NotImplementedError("Write checked_score(items, packing)")


def evaluate_packer(packer, task_set):
    """Run packer(items) on every instance.

    Return {"naive": mean naive score, "checked": mean checked score,
            "invalid": number of invalid packings}.
    """
    # TODO
    raise NotImplementedError("Write evaluate_packer(packer, task_set)")
```

```check
{
  "question": "Stuck on the checked score?",
  "hint": "Call validate first. Only compute excess when the list of reasons is empty. The mean of a list that holds math.inf is math.inf, so one invalid packing makes the whole checked score infinite.",
  "answer": "checked_score: `reasons = validate(items, packing)`; `return (math.inf, reasons) if reasons else (excess(items, packing), [])`. evaluate_packer: loop over the task set, call the packer once per instance, collect `naive_score(...)` and the first value of `checked_score(...)`, count the instances with reasons, and return the two means and the count."
}
```

```python
lab.check("a valid packing scores its excess", checked_score([60, 40], [[0, 1]]), (0.0, []))
s, r = checked_score([60, 40], [[0]])
lab.check("an invalid packing scores infinity", s == math.inf and r == ["missing item 1"])
ts = make_task_set("mixed big-small", 10, 40, 4)
honest = evaluate_packer(honest_packer, ts)
cheat = evaluate_packer(drop_big_packer, ts)
lab.check("honest: the naive and checked scores agree", honest["naive"], honest["checked"], tol=1e-12)
lab.check("honest: no invalid packings", honest["invalid"], 0)
lab.check("cheater: a better naive score than honest", cheat["naive"] < honest["naive"])
lab.check("cheater: the checked score is infinite", cheat["checked"], math.inf)
lab.check("cheater: every packing is invalid", cheat["invalid"], 10)
```

## 4. Experiment: who wins?

A simple improvement loop picks the candidate with the best score. The cell lets it pick among four candidates, once with the naive score and once with the checked score.

```python
family = "mixed big-small"  # @param ["uniform 20-100", "small 1-30", "mixed big-small", "triangular", "weibull 45"]
drop_limit = 70             # @param {type:"slider", min:50, max:100, step:5, label:"drop items larger than"}
fake_capacity = 110         # @param {type:"slider", min:100, max:150, step:5, label:"overfill capacity"}

val = make_splits(family, 20, 20, 100, 60)["validation"]
candidates = {
    "first fit": lambda x: pack(x, first_fit),
    "best fit": honest_packer,
    "drop big": lambda x: drop_big_packer(x, drop_limit),
    "overfill": lambda x: overfill_packer(x, fake_capacity),
}
results = {name: evaluate_packer(p, val) for name, p in candidates.items()}
for name, r in results.items():
    print(f"{name:9s} naive {100 * r['naive']:7.2f} %   checked {100 * r['checked']:7.2f} %   invalid {r['invalid']:2d}/{len(val)}")
pick_naive = min(results, key=lambda n: results[n]["naive"])
pick_checked = min(results, key=lambda n: results[n]["checked"])
print(f"\nchosen by the naive score  : {pick_naive}")
print(f"chosen by the checked score: {pick_checked}")

names = list(results)
plt.figure(figsize=(6, 3.2))
plt.bar(names, [100 * results[n]["naive"] for n in names],
        color=["#2A9D8F" if results[n]["invalid"] == 0 else "#C81D25" for n in names])
plt.axhline(0, color="#100D12", linewidth=0.8)
plt.ylabel("naive mean excess (%)"); plt.title("red = has invalid packings")
```

## Observations

1. Set `drop_limit` to 100. The cheater is now honest. What does the validator say, and why?
2. Set `fake_capacity` to 105. The cheater's naive score is close to the honest one. Why does a small cheat matter more than a large one in practice?
3. The validator checks the answer, not the program. Name one way a program could still pass every test and be bad.
