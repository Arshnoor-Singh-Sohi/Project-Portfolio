---
title: "RSI P2 · Many candidates, one answer"
summary: "Make a random version of the packer, sample K packings per instance, keep the best one, and measure the gain, the cost, what persists and the optimistic bias of reporting the best."
collection: "AI"
tags: [rsi, bin-packing, best-of-k, evaluation, numpy]
packages: [numpy, matplotlib]
level: "Beginner"
order: 102
objectives:
  - "Turn a fixed priority function into a random one with added noise."
  - "Sample K packings per instance and keep the one with the fewest bins."
  - "Measure the gain of best-of-K and its cost in priority calls."
  - "Show that nothing persists: the next instance needs K samples again."
  - "Show the optimistic bias of a version that you choose and score on the same data."
---
# P2: Many candidates, one answer

In P1 the agent had one fixed rule and gave one answer per instance. A language model is different. It samples, so it can give a different answer each time. A common trick is to ask for K answers and keep the best one. In this lab you build that trick for bin packing and measure what it gives and what it costs.

There is an important limit. Best-of-K improves the **answer**, not the **agent**. After the instance, the agent is the same as before. So this is not self-improvement. It is the zero level of the course's ladder of self-improvement.

> [!note] A rule we break on purpose
> A real online packer cannot pack the same item sequence K times and keep the best packing. Here we treat each instance as one task: the agent may try K complete answers before it submits one. This is how sampling K answers from a language model works.

## 1. The pieces from P1

Run this cell. It defines the families, the data split, the packer and the score from P1, and two helpers for this lab.

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


def is_valid(items, bins, capacity=CAPACITY):
    placed = sorted(i for b in bins for i in b)
    return placed == list(range(len(items))) and all(sum(items[i] for i in b) <= capacity for b in bins)


class CallCounter:
    """Wraps a priority function and counts its calls. The count measures the work."""

    def __init__(self, priority):
        self.priority = priority
        self.calls = 0

    def __call__(self, item, space):
        self.calls += 1
        return self.priority(item, space)


print("Ready.")
```

## 2. A random packer

Add random noise to every priority value: $p(\text{item}, \text{space}) + \sigma \, z$, where $z$ is a fresh draw from the standard normal distribution and $\sigma$ is the **noise level**. Bins with almost the same priority now win in a random order. So each run can give a different packing. The noise plays the role of sampling in a language model.

Run the demo. It uses its own small noisy rule, so you can see the effect before you write yours.

```python
noise = 10.0   # @param {type:"slider", min:0, max:40, step:1}
seed = 5       # @param {type:"integer"}
n_items = 120  # @param {type:"slider", min:20, max:200, step:20}
family = "weibull 45"  # @param ["uniform 20-100", "small 1-30", "mixed big-small", "triangular", "weibull 45"]

demo = make_instance(np.random.default_rng(seed), family, n_items)
demo_rng = np.random.default_rng(seed)
counts = [len(pack(demo, lambda item, space: best_fit(item, space) + noise * demo_rng.normal())) for _ in range(30)]
print(f"best fit: {len(pack(demo, best_fit))} bins.  L1 = {lower_bound(demo)}.")
print("30 noisy runs:", counts)
plt.figure(figsize=(6, 3))
plt.hist(counts, bins=np.arange(min(counts) - 0.5, max(counts) + 1.5), color="#1E6091", rwidth=0.9)
plt.axvline(len(pack(demo, best_fit)), color="#B8860B", linestyle="--", label="best fit")
plt.xlabel("bins used"); plt.ylabel("runs"); plt.legend(); plt.title(f"noise level {noise}")
```

1. With noise 0, every run gives the best-fit packing. Why?
2. With noise 10, the count changes from run to run. Sometimes it is lower than best fit. Try other seeds.
3. With noise 40, most runs are worse. What does very high noise turn the agent into?

Now write `noisy`. It takes a priority function and returns a new one.

```python
def noisy(priority, noise, rng):
    """Return a new function f(item, space) = priority(item, space) + noise * rng.normal().

    Draw a new normal value at every call.
    """
    # TODO
    raise NotImplementedError("Write noisy(priority, noise, rng)")
```

```check
{
  "question": "Stuck on noisy?",
  "hint": "A function can define another function inside it and return it. The inner function can use priority, noise and rng from the outer function.",
  "answer": "Key line: the inner function `noisy_priority(item, space)` returns `priority(item, space) + noise * rng.normal()`. The outer function returns `noisy_priority` itself, without calling it."
}
```

```python
p0 = noisy(best_fit, 0.0, np.random.default_rng(0))
lab.check("noise 0 keeps the priority", p0(30, 50), -20.0)
p1 = noisy(best_fit, 5.0, np.random.default_rng(1))
values = [p1(30, 50) for _ in range(2000)]
lab.check("the value changes from call to call", len(set(values)) > 1990)
lab.check("the noise has mean 0", float(np.mean(values)), -20.0, tol=0.5)
lab.check("the noise has the right size", float(np.std(values)), 5.0, tol=0.3)
pa, pb = noisy(best_fit, 5.0, np.random.default_rng(3)), noisy(best_fit, 5.0, np.random.default_rng(3))
lab.check("the same seed gives the same values", [pa(10, 90) for _ in range(5)], [pb(10, 90) for _ in range(5)])
```

## 3. Best of K

For one instance, run the noisy packer K times and keep the packing with the fewest bins. Give sample `j` its own random generator `np.random.default_rng([seed, j])`. Then sample `j` is the same every time, and the first 4 samples of a run with K = 8 are the 4 samples of a run with K = 4.

The score of a packing is exact here: we count bins. So "keep the best" is safe. In P3 you will see what happens when the score can be fooled.

```python
def best_of_k(items, priority, k, noise, seed):
    """Pack the items k times with noisy(priority, noise, rng_j), rng_j = np.random.default_rng([seed, j]).

    Return (best_bins, counts): the packing with the fewest bins (the first one on a tie)
    and the list of the k bin counts, in sample order.
    """
    # TODO
    raise NotImplementedError("Write best_of_k(items, priority, k, noise, seed)")
```

```check
{
  "question": "Stuck on best_of_k?",
  "hint": "Loop j = 0 .. k-1. Make the generator for sample j, wrap the priority with noisy, pack, and remember the packing if it has fewer bins than the best so far.",
  "answer": "Pseudocode:\n\n    best = none; counts = empty list\n    for j in 0 .. k-1:\n        rng = the generator for [seed, j]\n        bins = pack the items with noisy(priority, noise, rng)\n        append the number of bins to counts\n        if best is none or bins has fewer bins than best: best = bins\n    return best, counts"
}
```

```python
items = make_instance(np.random.default_rng(11), "weibull 45", 40)
b1, c1 = best_of_k(items, best_fit, 1, 0.0, 0)
lab.check("k = 1 without noise is the plain packer", b1, pack(items, best_fit))
b8, c8 = best_of_k(items, best_fit, 8, 10.0, 0)
b4, c4 = best_of_k(items, best_fit, 4, 10.0, 0)
lab.check("one count per sample", len(c8), 8)
lab.check("the kept packing has the fewest bins", len(b8), min(c8))
lab.check("the kept packing is valid", is_valid(items, b8))
lab.check("the first 4 of 8 samples are the 4 samples of k = 4", c8[:4], c4)
lab.check("more samples never give more bins", len(b8) <= len(b4))
```

## 4. The gain and the cost

The cell measures the mean excess of best-of-K on the validation set, and the number of priority calls. The calls measure the work. Run it, then change the noise level.

```python
family = "weibull 45"  # @param ["uniform 20-100", "small 1-30", "mixed big-small", "triangular", "weibull 45"]
noise = 10.0           # @param {type:"slider", min:0, max:40, step:1}

splits = make_splits(family, 20, 20, 100, 60)
val = splits["validation"]
ks = [1, 2, 4, 8, 16]
scores, calls = [], []
for k in ks:
    counter = CallCounter(best_fit)
    total = 0.0
    for i, items in enumerate(val):
        bins, _ = best_of_k(items, counter, k, noise, seed=100 + i)
        total += excess(items, bins)
    scores.append(total / len(val))
    calls.append(counter.calls)
plain = mean_excess(val, best_fit)
for k, s, c in zip(ks, scores, calls):
    print(f"K = {k:2d}: mean excess {100 * s:5.2f} %   priority calls {c:7d}")
print(f"best fit without noise: {100 * plain:5.2f} %")

fig, (a1, a2) = plt.subplots(1, 2, figsize=(9, 3.2))
a1.plot(ks, [100 * s for s in scores], "o-", color="#1E6091")
a1.axhline(100 * plain, color="#B8860B", linestyle="--", label="best fit")
a1.set(xscale="log", xlabel="K", ylabel="mean excess (%)", title="gain"); a1.legend()
a2.plot(ks, calls, "o-", color="#C81D25")
a2.set(xscale="log", yscale="log", xlabel="K", ylabel="priority calls", title="cost")
fig.tight_layout()
```

## 5. Nothing persists

After best-of-K, does the agent know more? Try it. For instance `i`, find the winning sample `j*`. Then reuse the same random stream, `[seed_i, j*]`, on the **next** instance. If the win came from skill, it should help there too. If it came from luck, it should not.

```python
k = 8         # @param {type:"slider", min:2, max:32, step:2}
noise = 10.0  # @param {type:"slider", min:1, max:40, step:1}

reused, fresh_one, fresh_best = [], [], []
for i in range(len(val) - 1):
    _, counts_i = best_of_k(val[i], best_fit, k, noise, seed=100 + i)
    j_star = int(np.argmin(counts_i))                      # the lucky stream on instance i
    nxt = val[i + 1]
    lucky = noisy(best_fit, noise, np.random.default_rng([100 + i, j_star]))
    reused.append(excess(nxt, pack(nxt, lucky)))           # reuse it on instance i + 1
    one, _ = best_of_k(nxt, best_fit, 1, noise, seed=500 + i)
    fresh_one.append(excess(nxt, one))
    many, _ = best_of_k(nxt, best_fit, k, noise, seed=500 + i)
    fresh_best.append(excess(nxt, many))
print(f"reuse the winner of the last instance : {100 * np.mean(reused):5.2f} %")
print(f"one fresh sample                       : {100 * np.mean(fresh_one):5.2f} %")
print(f"best of {k} fresh samples               : {100 * np.mean(fresh_best):5.2f} %")
```

The reused winner is about as good as one fresh sample, not as good as best-of-K. The win did not move to the next task. To get the gain again, the agent must pay K samples again. Nothing about the agent changed.

## 6. The optimistic bias of the best

Now treat each random stream as a **version** of the agent: version `j` is the noisy packer with the generator `np.random.default_rng([seed, j])`, used for the whole task set. Choose the version with the best score on a task set. Its score on that same set is too good. The reason: you chose it **because** its noise happened to be lucky on those instances.

```python
def pick_best_version(task_set, priority, noise, n_versions, seed):
    """Score versions j = 0 .. n_versions-1 on the task set.

    Version j packs every instance, in order, with one noisy priority that uses
    the generator np.random.default_rng([seed, j]). Its score is the mean excess.
    Return (best_j, scores): the index with the lowest score (the first on a tie)
    and the list of all scores.
    """
    # TODO
    raise NotImplementedError("Write pick_best_version(task_set, priority, noise, n_versions, seed)")
```

```check
{
  "question": "Stuck on pick_best_version?",
  "hint": "Make one generator and one noisy priority per version, before the loop over instances. Then the stream continues from one instance to the next, like one long run of one agent.",
  "answer": "Pseudocode:\n\n    scores = empty list\n    for j in 0 .. n_versions-1:\n        p = noisy(priority, noise, the generator for [seed, j])\n        append the mean excess of p on the task set to scores\n    best_j = the index of the smallest score (the first one on a tie)\n    return best_j, scores"
}
```

```python
small = make_task_set("weibull 45", 6, 30, 5)
j, sc = pick_best_version(small, best_fit, 10.0, 5, 0)
lab.check("one score per version", len(sc), 5)
lab.check("the chosen version has the lowest score", sc[j], min(sc))
lab.check("the result repeats", pick_best_version(small, best_fit, 10.0, 5, 0), (j, sc))
j0, s0 = pick_best_version(small, best_fit, 0.0, 4, 0)
lab.check("without noise all versions tie, and the first wins", len(set(s0)) == 1 and j0 == 0)
lab.check("version 4 uses the stream [seed, 4]", sc[4], 0.05143467643467644, tol=1e-12)
```

Now the experiment. Choose the best of `n_versions` on the training set. Then score the same version on the test set.

```python
n_versions = 20  # @param {type:"slider", min:2, max:60, step:2}
noise = 10.0     # @param {type:"slider", min:1, max:40, step:1}
n_train = 20     # @param {type:"slider", min:2, max:60, step:2}

splits = make_splits("weibull 45", n_train, 20, 100, 60)
best_j, train_scores = pick_best_version(splits["train"], best_fit, noise, n_versions, seed=0)
_, test_scores = pick_best_version(splits["test"], best_fit, noise, n_versions, seed=0)
print(f"chosen version {best_j}")
print(f"its training score (used to choose it): {100 * train_scores[best_j]:5.2f} %")
print(f"its test score (fresh instances)      : {100 * test_scores[best_j]:5.2f} %")
print(f"mean test score of all versions        : {100 * np.mean(test_scores):5.2f} %")
plt.figure(figsize=(5, 4))
plt.scatter(100 * np.array(train_scores), 100 * np.array(test_scores), color="#1E6091")
plt.scatter([100 * train_scores[best_j]], [100 * test_scores[best_j]], color="#C81D25", s=80, label="chosen")
plt.xlabel("training score (%)"); plt.ylabel("test score (%)"); plt.legend()
plt.title("each point is one version")
```

## Observations

1. Best-of-K gave a lower excess than best fit. Why did the cost grow in proportion to K, but the gain did not?
2. Why did the winner of one instance not help on the next instance?
3. Why is the training score of the chosen version lower than its test score? What changes when you use 60 training instances?
