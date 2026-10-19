---
title: "RSI P1 · A fixed agent with a score"
summary: "Build an online bin-packing agent with a fixed priority rule, score it against a lower bound, split the tasks into training, validation and test sets, and compare first fit with best fit."
collection: "AI"
tags: [rsi, bin-packing, evaluation, agents, numpy]
packages: [numpy, matplotlib]
level: "Beginner"
order: 101
objectives:
  - "Explain online bin packing: items arrive one at a time and never move later."
  - "Write a packer that puts each item into the open bin with the highest priority."
  - "Compute the lower bound L1 and the excess score of a packing."
  - "Make training, validation and test sets with fixed seeds, and say why each set exists."
  - "Compare first fit and best fit on the three sets, and explain the differences."
---
# P1: A fixed agent with a score

This lab starts Part 9 of the course on recursive self-improvement (RSI). Every later project improves the agent that you build here. So the agent, the score and the data split must be correct and exact.

The agent is fixed in this lab. Nothing changes it. You first need a reliable way to measure an agent. Only then can you ask if a change makes it better.

Everything runs in your browser. There is no language model and no network. All random numbers come from fixed seeds, so every run gives the same numbers.

## 1. The task: online bin packing

1. Items arrive one at a time. Each item has an integer **size** from 1 to 100.
2. Each **bin** has a **capacity** of 100. The sizes in one bin must add up to 100 or less.
3. When an item arrives, the agent must put it at once into an open bin that has room, or open a new bin.
4. The agent cannot move an item later. This is why the problem is called **online**.
5. Fewer bins is better.

| Term | Plain meaning |
|---|---|
| instance | One task: one list of item sizes, in arrival order. |
| packing | The answer for one instance: a list of bins. Each bin is a list of item indices. |
| free space | The capacity of a bin minus the sizes already in it. |
| family | A named random rule that makes instances, for example "mixed big-small". |
| task set | A list of instances from one family, made with one seed. |

Run the cell below. It makes one instance and packs it with **next fit**, a very simple rule: keep only the newest bin open, and open a new bin when the item does not fit. Next fit is not the packer that you write later. It only lets you see the problem.

```python
import math
import numpy as np
import matplotlib.pyplot as plt

CAPACITY = 100
FAMILIES = ["uniform 20-100", "small 1-30", "mixed big-small", "triangular", "weibull 45"]


def make_instance(rng, family, n_items):
    """One instance: a list of n_items integer sizes from 1 to 100."""
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
    """A task set: n_instances instances of one family, made from one seed."""
    rng = np.random.default_rng(seed)
    return [make_instance(rng, family, n_items) for _ in range(n_instances)]


def next_fit(items, capacity=CAPACITY):
    """Demo only: keep one bin open. Open a new bin when the item does not fit."""
    bins, load = [], capacity + 1
    for i, item in enumerate(items):
        if load + item > capacity:
            bins.append([])
            load = 0
        bins[-1].append(i)
        load += item
    return bins


def draw_packing(items, bins, title):
    """Draw each bin as a stack of items. The dashed line is the capacity."""
    fig, ax = plt.subplots(figsize=(min(12, 1 + 0.35 * len(bins)), 3.2))
    for j, b in enumerate(bins):
        bottom = 0
        for i in b:
            ax.bar(j, items[i], bottom=bottom, color="#1E6091" if items[i] > 50 else "#6A4C93", edgecolor="white")
            bottom += items[i]
    ax.axhline(CAPACITY, color="#C81D25", linestyle="--", linewidth=1)
    ax.set(title=title, xlabel="bin", ylabel="load", ylim=(0, 110))
    return fig


family = "mixed big-small"  # @param ["uniform 20-100", "small 1-30", "mixed big-small", "triangular", "weibull 45"]
n_items = 30                # @param {type:"slider", min:5, max:60, step:5}
seed = 0                    # @param {type:"integer"}

demo_items = make_instance(np.random.default_rng(seed), family, n_items)
demo_bins = next_fit(demo_items)
print("sizes in arrival order:", demo_items)
print(f"total size {sum(demo_items)}, next fit used {len(demo_bins)} bins")
draw_packing(demo_items, demo_bins, f"next fit on one '{family}' instance")
```

Try these changes and write what you see in the Observations cell.

1. Set **family** to `small 1-30`. Next fit wastes little space. Why?
2. Set **family** to `uniform 20-100`. Many bins hold only one item. Which items can never share a bin?
3. Compare the number of bins with the total size divided by 100.

```check
{
  "question": "An instance has sizes [60, 60, 60]. What is the smallest possible number of bins? Can any packer do better than that?",
  "hint": "Two items of size 60 add up to 120. That is more than the capacity.",
  "answer": "Three bins. No two items can share a bin, so every packer needs 3 bins. The total size is 180, and 180 / 100 = 1.8, so a bound from the total size says only 'at least 2'. A bound can be lower than the real optimum."
}
```

## 2. The packer

The agent's **strategy** is a **priority function** `priority(item, space)`. It returns a number for one open bin, where `space` is the free space of that bin. The packer does this for each item:

1. Look at every open bin that has room: `space >= item`.
2. Ask the priority function for a number for each of these bins.
3. Put the item into the bin with the highest number. On a tie, use the bin with the lowest index.
4. If no open bin has room, open a new bin at the end of the list.

Two fixed strategies are below. **First fit** gives every bin the same number, so the tie rule picks the first bin that has room. **Best fit** prefers the bin that the item fills most tightly: it gives a high number when the space left after the item, `space - item`, is small.

```python
def first_fit(item, space):
    return 0


def best_fit(item, space):
    return -(space - item)
```

Write `pack`. A packing is a list of bins, and each bin is a list of **item indices** (positions in `items`), in the order in which the items went in.

```python
def pack(items, priority, capacity=CAPACITY):
    """Pack the items online, in order. Return a list of bins.

    Each bin is a list of item indices. For each item, consider only the open
    bins with free space >= item. Choose the one with the highest
    priority(item, space). On a tie, choose the lowest bin index.
    If no open bin has room, open a new bin.
    """
    # TODO
    raise NotImplementedError("Write pack(items, priority, capacity)")
```

```check
{
  "question": "Stuck on pack? Open the hints in order.",
  "hint": "Keep two lists side by side: free[j] is the free space of bin j, and bins[j] is the list of item indices in bin j. For each item, scan j = 0, 1, 2, ... and remember the best bin so far. A strict comparison p > best_p keeps the first bin on a tie.",
  "answer": "Pseudocode:\n\n    free, bins = [], []\n    for i, item in enumerate(items):\n        best_j, best_p = -1, -infinity\n        for j, space in enumerate(free):\n            if space >= item:\n                p = priority(item, space)\n                if p > best_p: best_j, best_p = j, p\n        if best_j == -1: free.append(capacity - item); bins.append([i])\n        else: free[best_j] -= item; bins[best_j].append(i)\n    return bins"
}
```

```python
import lab


def worst_fit(item, space):        # prefers the emptiest bin
    return space - item


def is_valid(items, bins, capacity=CAPACITY):
    """Test helper: every index exactly once, and no bin over capacity."""
    placed = sorted(i for b in bins for i in b)
    loads_ok = all(sum(items[i] for i in b) <= capacity for b in bins)
    return placed == list(range(len(items))) and loads_ok


lab.check("no items give no bins", pack([], first_fit), [])
lab.check("an item that fills the free space exactly fits", pack([60, 40], first_fit), [[0, 1]])
lab.check("three items of 60 need three bins", pack([60, 60, 60], first_fit), [[0], [1], [2]])
lab.check("first fit takes the first bin with room", pack([50, 70, 30], first_fit), [[0, 2], [1]])
lab.check("best fit takes the tightest bin", pack([50, 70, 30], best_fit), [[0], [1, 2]])
lab.check("a tie goes to the lowest bin index", pack([70, 70, 20], best_fit), [[0, 2], [1]])
lab.check("the packer follows the priority (worst fit)", pack([30, 80, 15], worst_fit), [[0, 2], [1]])
lab.check("the packer follows the priority (best fit)", pack([30, 80, 15], best_fit), [[0], [1, 2]])
sample = make_instance(np.random.default_rng(7), "mixed big-small", 40)
lab.check("a random instance gives a valid packing", is_valid(sample, pack(sample, best_fit)))
```

## 3. The score

Different instances need different numbers of bins, so the raw count is not a fair score. We compare each packing with a **lower bound**: a number of bins that no packer can beat. The total size must fit into the bins, so

$$
L_1 = \left\lceil \frac{\sum_i s_i}{C} \right\rceil
$$

- $s_i$ is the size of item $i$.
- $C$ is the capacity, 100 here.
- $\lceil x \rceil$ rounds $x$ up to the next whole number.

The **excess** of a packing that uses $B$ bins is

$$
\text{excess} = \frac{B - L_1}{L_1}
$$

Lower is better. An excess of 0 means that the packing is optimal. The score of a strategy on a task set is the **mean excess** over its instances.

```python
def lower_bound(items, capacity=CAPACITY):
    """Return L1 = ceil(total size / capacity). An empty list gives 0."""
    # TODO
    raise NotImplementedError("Write lower_bound(items, capacity)")


def excess(items, bins, capacity=CAPACITY):
    """Return (number of bins - L1) / L1 for a packing of a non-empty instance."""
    # TODO
    raise NotImplementedError("Write excess(items, bins, capacity)")


def mean_excess(task_set, priority):
    """Pack every instance with the priority function. Return the mean excess."""
    # TODO
    raise NotImplementedError("Write mean_excess(task_set, priority)")
```

```check
{
  "question": "Stuck on the score?",
  "hint": "Use math.ceil for L1. Do not use integer division: 101 // 100 is 1, but you need 2 bins for a total size of 101.",
  "answer": "lower_bound: `return math.ceil(sum(items) / capacity)`. excess: `l1 = lower_bound(items, capacity)`, then `return (len(bins) - l1) / l1`. mean_excess: for each instance, `excess(items, pack(items, priority))`, then divide the sum by `len(task_set)`."
}
```

```python
lab.check("L1 of [50, 50] is 1", lower_bound([50, 50]), 1)
lab.check("L1 of [60, 60] is 2", lower_bound([60, 60]), 2)
lab.check("a total of 101 needs 2 bins", lower_bound([30, 30, 30, 11]), 2)
lab.check("L1 of an empty list is 0", lower_bound([]), 0)
lab.check("L1 uses the capacity argument", lower_bound([50, 50, 50], capacity=150), 1)
lab.check("an optimal packing has excess 0", excess([60, 40], [[0, 1]]), 0.0)
lab.check("two bins for [50, 50] give excess 1", excess([50, 50], [[0], [1]]), 1.0)
lab.check("three bins against L1 = 2 give excess 0.5", excess([60, 60, 60], [[0], [1], [2]]), 0.5)
lab.check("mean excess of one optimal instance", mean_excess([[60, 40], [50, 50]], first_fit), 0.0)
lab.check("mean excess averages over instances", mean_excess([[60, 40], [60, 60, 60]], first_fit), 0.25)
```

## 4. The data split

A score on the same instances that you use to make choices is too optimistic. Later projects choose between versions of the agent, so we need three separate task sets:

1. **Training set**: the improvement loop may look at it as often as it wants.
2. **Validation set**: used to decide which version to keep.
3. **Test set**: used only once, at the end, to report the result. No choice may depend on it.

Write `make_splits`. Use one fixed seed per set. Use `k = FAMILIES.index(family)` and the seeds `1 + 1000 * k` (training), `2 + 1000 * k` (validation) and `3 + 1000 * k` (test). Different seeds give different instances. Fixed seeds give the same instances every time.

```python
def make_splits(family, n_train, n_val, n_test, n_items):
    """Return {"train": ..., "validation": ..., "test": ...}: three task sets of one family.

    Use make_task_set with the seeds 1 + 1000*k, 2 + 1000*k and 3 + 1000*k,
    where k = FAMILIES.index(family).
    """
    # TODO
    raise NotImplementedError("Write make_splits(family, n_train, n_val, n_test, n_items)")
```

```check
{
  "question": "Stuck on make_splits?",
  "hint": "Find k with FAMILIES.index(family). Call make_task_set three times, once per set, each with its own seed.",
  "answer": "`k = FAMILIES.index(family)`, then return a dict: `\"train\": make_task_set(family, n_train, n_items, 1 + 1000 * k)`, and the same for validation (seed `2 + 1000 * k`) and test (seed `3 + 1000 * k`)."
}
```

```python
s1 = make_splits("mixed big-small", 5, 4, 3, 10)
s2 = make_splits("mixed big-small", 5, 4, 3, 10)
lab.check("three named sets", sorted(s1), ["test", "train", "validation"])
lab.check("set sizes", [len(s1["train"]), len(s1["validation"]), len(s1["test"])], [5, 4, 3])
lab.check("every instance has n_items sizes from 1 to 100",
          all(len(x) == 10 and all(1 <= v <= 100 for v in x) for part in s1.values() for x in part))
lab.check("fixed seeds give the same sets again", s1 == s2)
seen = [tuple(x) for x in s1["train"]] + [tuple(x) for x in s1["validation"]] + [tuple(x) for x in s1["test"]]
lab.check("no instance is in two sets", len(set(seen)) == len(seen))
lab.check("another family gives other instances", make_splits("weibull 45", 5, 4, 3, 10)["train"] != s1["train"])
lab.check("the training seed is 1 + 1000*k", s1["train"][0], [58, 85, 71, 27, 72, 58, 25, 40, 58, 30])
```

## 5. Experiment: first fit against best fit

This cell uses your functions. Change the controls and compare the three sets.

```python
family = "mixed big-small"  # @param ["uniform 20-100", "small 1-30", "mixed big-small", "triangular", "weibull 45"]
n_items = 60                # @param {type:"slider", min:10, max:120, step:10}
n_train = 20                # @param {type:"slider", min:2, max:60, step:2}
n_val = 20                  # @param {type:"slider", min:2, max:60, step:2}
n_test = 100                # @param {type:"slider", min:10, max:200, step:10}

splits = make_splits(family, n_train, n_val, n_test, n_items)
rows = {}
for name, task_set in splits.items():
    rows[name] = (mean_excess(task_set, first_fit), mean_excess(task_set, best_fit))
    print(f"{name:10s}  first fit {100 * rows[name][0]:6.2f} %   best fit {100 * rows[name][1]:6.2f} %")

x = np.arange(3)
fig, ax = plt.subplots(figsize=(6, 3.2))
ax.bar(x - 0.2, [100 * rows[n][0] for n in splits], 0.4, color="#8A8A8A", label="first fit")
ax.bar(x + 0.2, [100 * rows[n][1] for n in splits], 0.4, color="#1E6091", label="best fit")
ax.set_xticks(x, list(splits))
ax.set(ylabel="mean excess (%)", title=f"{family}, {n_items} items per instance")
ax.legend()
```

## Observations

1. Best fit beats first fit on most families. Why does it lose nothing on `small 1-30`?
2. With `n_val` = 2, the two strategies can tie on the validation set but differ on the test set. Why can a small set fail to separate two strategies?
3. Why must no choice in later projects depend on the test set?
