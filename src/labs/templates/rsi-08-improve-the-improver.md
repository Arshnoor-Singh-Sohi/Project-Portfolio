---
title: "RSI P8 · Improving the improver"
summary: "Give the improver its own settings, score it by the gains it produces within a fixed budget (a meta-utility), optimize it, test it on held-out task families, then let it improve its own settings as STOP does, and find where the gains stop."
collection: "AI"
tags: [rsi, meta-optimization, stop, improver, bin-packing]
packages: [numpy, matplotlib]
level: "Advanced"
order: 108
objectives:
  - "Write a generic improver whose behaviour depends on its settings: edit probabilities, candidates per iteration and step size."
  - "Define and compute a meta-utility: the mean gain that the improver produces within a fixed budget on training task families."
  - "Optimize the improver's settings with a fixed meta-improver, and test the result on held-out families and fresh seeds."
  - "Let the improver improve its own settings for several rounds, and measure the gain of each round."
  - "List what stays fixed, and explain why the gains stop."
---
# P8: Improving the improver

Until now the **improver** was fixed. Its settings were chosen by hand: which edits to try, how many candidates per iteration, how far to move a number. In this lab the improver itself becomes the thing that improves.

The idea comes from the Self-Taught Optimizer (STOP). STOP scores an improver by a **meta-utility**: run the improver on several downstream tasks and average the utility of what it produces. Then it lets the improver improve its **own** code, scored by that meta-utility. This lab builds the same structure at toy scale. The improver's "code" is a small dictionary of settings.

| Level | What changes | Scored by |
|---|---|---|
| Object level | the packing program, for example `-gap` | mean excess on a family's tasks |
| Meta level | the improver's settings | the meta-utility: the mean gain the improver produces |
| Self-improvement | the meta level, changed by the improver itself | the same meta-utility |

## 1. The pieces from earlier projects

The packer, the program language, the edits and the tests are from P5 to P7. New in this cell: five task families with a small training set and a validation set each, a cached `program_score`, and the settings of the improver.

```python
import ast
import math
from collections import Counter
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


def validate(items, packing, capacity=CAPACITY):
    reasons, times = [], [0] * len(items)
    for j, b in enumerate(packing):
        if not b:
            reasons.append(f"empty bin {j}")
        load = 0
        for i in b:
            if not isinstance(i, int) or isinstance(i, bool) or not 0 <= i < len(items):
                reasons.append(f"unknown item {i!r} in bin {j}")
                continue
            times[i] += 1
            load += items[i]
        if load > capacity:
            reasons.append(f"bin {j} over capacity: {load} > {capacity}")
    for i, n in enumerate(times):
        if n == 0:
            reasons.append(f"missing item {i}")
        elif n > 1:
            reasons.append(f"item {i} placed {n} times")
    return reasons


VARS = ("item", "space", "gap")
FUNCS = ("abs", "min", "max")
OPS = [ast.Add, ast.Sub, ast.Mult, ast.Div]
ALLOWED_NODES = (ast.Expression, ast.BinOp, ast.UnaryOp, ast.Name, ast.Constant, ast.Call, ast.Load,
                 ast.Add, ast.Sub, ast.Mult, ast.Div, ast.USub)
MAX_SIZE = 15


def program_size(src):
    return sum(isinstance(n, ast.expr) for n in ast.walk(ast.parse(src, mode="eval")))


def check_program(src, max_size=None):
    try:
        tree = ast.parse(src, mode="eval")
    except SyntaxError:
        return "syntax error"
    for node in ast.walk(tree):
        if not isinstance(node, ALLOWED_NODES):
            return f"forbidden: {type(node).__name__}"
        if isinstance(node, ast.Call) and (not (isinstance(node.func, ast.Name) and node.func.id in FUNCS) or node.keywords):
            return "forbidden: call"
        if isinstance(node, ast.Name) and node.id not in VARS + FUNCS:
            return f"forbidden: name {node.id}"
        if isinstance(node, ast.Constant) and (isinstance(node.value, bool) or not isinstance(node.value, (int, float))):
            return "forbidden: constant"
    limit = MAX_SIZE if max_size is None else max_size
    if program_size(src) > limit:
        return "too large"
    return None


def make_function(src):
    code = compile("lambda item, space: (lambda gap: (" + src + "))(space - item)", "<candidate>", "eval")
    return eval(code, {"__builtins__": {}, "abs": abs, "min": min, "max": max})


def expression_nodes(tree):
    calls = {id(n.func) for n in ast.walk(tree) if isinstance(n, ast.Call)}
    return [n for n in ast.walk(tree) if isinstance(n, ast.expr) and id(n) not in calls and not isinstance(n, ast.Expression)]


def replace_node(tree, old, new):
    class Replace(ast.NodeTransformer):
        def visit(self, node):
            return new if node is old else super().visit(node)
    return ast.fix_missing_locations(Replace().visit(tree))


def random_leaf(rng):
    if rng.random() < 0.6:
        return ast.Name(id=VARS[rng.integers(len(VARS))], ctx=ast.Load())
    return ast.Constant(value=int(rng.integers(1, 51)))


def change_constant(src, rng, step=5.0):
    tree = ast.parse(src, mode="eval")
    nums = [n for n in ast.walk(tree) if isinstance(n, ast.Constant)]
    if not nums:
        return src
    node = nums[rng.integers(len(nums))]
    node.value = round(node.value + step * float(rng.normal()), 1)
    return ast.unparse(tree)


def swap_operator(src, rng):
    tree = ast.parse(src, mode="eval")
    binops = [n for n in ast.walk(tree) if isinstance(n, ast.BinOp)]
    if not binops:
        return src
    node = binops[rng.integers(len(binops))]
    others = [op for op in OPS if not isinstance(node.op, op)]
    node.op = others[rng.integers(len(others))]()
    return ast.unparse(tree)


def replace_with_leaf(src, rng):
    tree = ast.parse(src, mode="eval")
    nodes = expression_nodes(tree)
    old = nodes[rng.integers(len(nodes))]
    return ast.unparse(replace_node(tree, old, random_leaf(rng)))


def grow(src, rng):
    tree = ast.parse(src, mode="eval")
    nodes = expression_nodes(tree)
    old = nodes[rng.integers(len(nodes))]
    k = rng.integers(7)
    if k < 4:
        new = ast.BinOp(left=old, op=OPS[k](), right=random_leaf(rng))
    elif k == 4:
        new = ast.Call(func=ast.Name(id="abs", ctx=ast.Load()), args=[old], keywords=[])
    else:
        new = ast.Call(func=ast.Name(id=FUNCS[k - 4], ctx=ast.Load()), args=[old, random_leaf(rng)], keywords=[])
    return ast.unparse(replace_node(tree, old, new))


EDITS = {"constant": change_constant, "operator": swap_operator, "variable": replace_with_leaf, "grow": grow}
TEST_POINTS = [(i, s) for i in (1, 10, 35, 50, 99, 100) for s in sorted({i, min(100, i + 1), min(100, i + 20), 100})]
TINY_INSTANCES = [[100], [60, 40], [50, 50, 50], [30, 80, 15, 75]]


def run_tests(src):
    reason = check_program(src, max_size=10_000)
    if reason:
        return [f"whitelist ({reason})"]
    fn = make_function(src)
    try:
        values = [fn(i, s) for i, s in TEST_POINTS]
        packings_bad = any(validate(x, pack(x, fn)) for x in TINY_INSTANCES)
    except Exception as exc:  # noqa: BLE001
        return [f"runs without error ({type(exc).__name__})"]
    if not all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in values):
        return ["finite values"]
    if packings_bad:
        return ["valid packings"]
    return []


# ---------- new in P8 ----------
TRAIN_FAMILIES = ["mixed big-small", "weibull 45", "uniform 20-100"]
HELD_OUT_FAMILIES = ["triangular", "small 1-30"]
SEED_PROGRAM = "space + item"          # a worst-fit-like start: there is room to improve
DATA = {}
for fam in TRAIN_FAMILIES + HELD_OUT_FAMILIES:
    k = FAMILIES.index(fam)
    DATA[fam] = {"train": make_task_set(fam, 6, 25, 1 + 1000 * k),
                 "validation": make_task_set(fam, 20, 25, 2 + 1000 * k)}

_SCORE_CACHE = {}


def program_score(src, fam, split):
    """Mean excess of a program on DATA[fam][split]. A program that fails the tests,
    is too large or crashes scores math.inf. Results are cached: the packer is deterministic."""
    key = (src, fam, split)
    if key not in _SCORE_CACHE:
        score = math.inf
        if not run_tests(src) and program_size(src) <= MAX_SIZE:
            try:
                fn = make_function(src)
                insts = DATA[fam][split]
                score = sum(excess(x, pack(x, fn)) for x in insts) / len(insts)
            except Exception:  # noqa: BLE001
                score = math.inf
        _SCORE_CACHE[key] = score
    return _SCORE_CACHE[key]


EDIT_KEYS = ["constant", "operator", "variable", "grow"]
SETTING_KEYS = EDIT_KEYS + ["k", "step"]
DEFAULT_SETTINGS = {"constant": 1.0, "operator": 1.0, "variable": 1.0, "grow": 1.0, "k": 4, "step": 5.0}


def mutate_program(src, settings, rng):
    """The object-level proposer. It chooses an edit type with probability proportional to
    settings[edit], and moves constants by settings["step"]."""
    w = np.array([settings[e] for e in EDIT_KEYS], dtype=float)
    edit = EDIT_KEYS[rng.choice(len(EDIT_KEYS), p=w / w.sum())]
    if edit == "constant":
        return change_constant(src, rng, settings["step"])
    return EDITS[edit](src, rng)


def mutate_settings(theta, improver_settings, rng):
    """The meta-level proposer. It changes ONE setting of theta. How far it moves a number
    depends on the step size of the improver that calls it (improver_settings["step"] / 10)."""
    new = dict(theta)
    key = SETTING_KEYS[rng.integers(len(SETTING_KEYS))]
    scale = improver_settings["step"] / 10
    if key == "k":
        new["k"] = int(np.clip(theta["k"] + (1 if rng.random() < 0.5 else -1), 1, 8))
    elif key == "step":
        new["step"] = float(np.clip(theta["step"] * math.exp(scale * rng.normal()), 0.5, 50))
    else:
        new[key] = float(np.clip(theta[key] * math.exp(scale * rng.normal()), 0.01, 100))
    return new


for fam in TRAIN_FAMILIES + HELD_OUT_FAMILIES:
    print(f"{fam:16s} seed program {100 * program_score(SEED_PROGRAM, fam, 'validation'):5.2f} %   "
          f"best fit {100 * program_score('-gap', fam, 'validation'):5.2f} %  (validation mean excess)")
```

Explore the settings before you write the improver. The cell draws 200 proposals from the seed program with your settings and counts what they are. A proposal equal to its parent is wasted work.

```python
w_constant = 1.0  # @param {type:"slider", min:0, max:5, step:0.25, label:"weight: change a constant"}
w_operator = 1.0  # @param {type:"slider", min:0, max:5, step:0.25, label:"weight: swap an operator"}
w_variable = 1.0  # @param {type:"slider", min:0, max:5, step:0.25, label:"weight: replace with a leaf"}
w_grow = 1.0      # @param {type:"slider", min:0, max:5, step:0.25, label:"weight: grow"}

settings = {"constant": w_constant, "operator": w_operator, "variable": w_variable, "grow": w_grow, "k": 4, "step": 5.0}
rng = np.random.default_rng(0)
props = [mutate_program(SEED_PROGRAM, settings, rng) for _ in range(200)]
same = sum(p == SEED_PROGRAM for p in props)
better = sum(program_score(p, "mixed big-small", "train") < program_score(SEED_PROGRAM, "mixed big-small", "train") for p in props)
print(f"unchanged: {same}/200   better on mixed big-small (train): {better}/200   distinct: {len(set(props))}")
print("examples:", Counter(props).most_common(6))
```

1. The seed program has no number in it. What does the edit "change a constant" do to it?
2. Which edit type makes most of the better proposals? Why?

## 2. A generic improver

Write `improve(solution, utility, mutate_fn, settings, budget, rng)`. It works for **any** kind of solution: a program, or a dictionary of settings. It is hill climbing with a batch of `k = settings["k"]` candidates per iteration:

1. Start with `best = solution` and `best_u = utility(solution)`. Higher utility is better.
2. While one more batch fits in the budget (`used + k <= budget`): make `k` candidates with `mutate_fn(best, settings, rng)`, add `k` to `used`, and score each one.
3. Keep the candidate with the highest utility (the first one on a tie) if it is strictly better than `best_u`.
4. Return `(best, best_u)`.

The **budget** counts proposals. A proposal costs the same whether it is good, bad or unchanged.

```python
def improve(solution, utility, mutate_fn, settings, budget, rng):
    """Batch hill climbing. Return (best, best_u). Higher utility is better."""
    # TODO
    raise NotImplementedError("Write improve(solution, utility, mutate_fn, settings, budget, rng)")
```

```check
{
  "question": "Stuck on improve?",
  "hint": "Read k once at the start. The loop condition is used + k <= budget, so a budget of 6 with k = 4 makes only one batch. np.argmax gives the index of the first maximum.",
  "answer": "Pseudocode:\n\n    best, best_u = solution, utility(solution); k = int(settings['k']); used = 0\n    while used + k <= budget:\n        cands = [mutate_fn(best, settings, rng) for each of k]\n        used += k\n        scores = [utility(c) for c in cands]\n        j = index of the highest score (the first one on a tie)\n        if scores[j] > best_u: best, best_u = cands[j], scores[j]\n    return best, best_u"
}
```

```python
calls = []


def toy_utility(x):                      # a toy problem: the best x is 3
    calls.append(x)
    return -(x - 3.0) ** 2


def toy_mutate(x, settings, rng):
    return x + settings["step"] * rng.normal()


best, best_u = improve(0.0, toy_utility, toy_mutate, {"k": 4, "step": 0.5}, 40, np.random.default_rng(0))
lab.check("the result is better than the start", best_u > toy_utility(0.0))
lab.check("the toy optimum is found", best, 3.0, tol=0.2)
calls.clear()
improve(0.0, toy_utility, toy_mutate, {"k": 4, "step": 0.5}, 10, np.random.default_rng(0))
lab.check("budget 10, k = 4: two batches, so 1 + 8 utility calls", len(calls), 9)
calls.clear()
lab.check("a budget smaller than k changes nothing", improve(0.0, toy_utility, toy_mutate, {"k": 4, "step": 0.5}, 3, np.random.default_rng(0)), (0.0, -9.0))
lab.check("the utility never gets worse", all(improve(0.0, toy_utility, toy_mutate, {"k": k, "step": 2.0}, 12, np.random.default_rng(s))[1] >= -9.0
                                              for k in (1, 3) for s in range(5)))
lab.check("the run repeats", improve(0.0, toy_utility, toy_mutate, {"k": 2, "step": 1.0}, 20, np.random.default_rng(7)),
          improve(0.0, toy_utility, toy_mutate, {"k": 2, "step": 1.0}, 20, np.random.default_rng(7)))
prog, u = improve(SEED_PROGRAM, lambda s: -program_score(s, "mixed big-small", "train"), mutate_program, DEFAULT_SETTINGS, 24, np.random.default_rng(1))
lab.check("on programs it beats the seed program", -u < program_score(SEED_PROGRAM, "mixed big-small", "train"))
```

## 3. The meta-utility

The meta-utility scores a setting $\theta$ by what the improver achieves with it:

$$
\hat u(\theta) = \frac{1}{|F|\,|S|} \sum_{f \in F} \sum_{s \in S}
\Big( e_f^{\text{val}}(\text{seed program}) - e_f^{\text{val}}\big(\text{improve}_\theta(\text{seed program};\, f,\, s)\big) \Big)
$$

- $F$ is a list of task families, and $S$ is a list of random seeds.
- $\text{improve}_\theta(\cdot\,; f, s)$ runs your `improve` with settings $\theta$, budget $B$, the utility $-e_f^{\text{train}}$ (minus the mean excess on the family's training set), and the generator `np.random.default_rng([s, k])` with `k = FAMILIES.index(f)`.
- $e_f^{\text{val}}$ is the mean excess on the family's **validation** set. So the gain is measured on instances that the improver did not use.

In words: run the improver once per family and seed, and average how much it lowered the validation excess. Every setting gets the same seeds, so two settings are compared on the same random streams.

```python
def meta_utility(settings, families, budget=6, seeds=range(8)):
    """Mean validation gain of improve() with these settings, over families and seeds.

    For each family f (k = FAMILIES.index(f)) and seed s: run
    improve(SEED_PROGRAM, utility, mutate_program, settings, budget, np.random.default_rng([s, k]))
    with utility(src) = -program_score(src, f, "train"). The gain is
    program_score(SEED_PROGRAM, f, "validation") - program_score(best, f, "validation").
    """
    # TODO
    raise NotImplementedError("Write meta_utility(settings, families, budget, seeds)")
```

```check
{
  "question": "Stuck on meta_utility?",
  "hint": "Two nested loops: families outside, seeds inside. Define the utility inside the family loop, so that it uses the right family. A lambda inside a loop must bind the family as a default argument, or define a small function.",
  "answer": "Pseudocode:\n\n    gains = []\n    for f in families:\n        k = FAMILIES.index(f); start = program_score(SEED_PROGRAM, f, 'validation')\n        utility = a function src -> -program_score(src, f, 'train')\n        for s in seeds:\n            best, _ = improve(SEED_PROGRAM, utility, mutate_program, settings, budget, generator([s, k]))\n            append start - program_score(best, f, 'validation') to gains\n    return the mean of gains as a float"
}
```

```python
only_constant = {"constant": 1.0, "operator": 0.0, "variable": 0.0, "grow": 0.0, "k": 4, "step": 5.0}
lab.check("an improver that only changes constants gains nothing here", meta_utility(only_constant, TRAIN_FAMILIES), 0.0)
lab.check("a zero budget gains nothing", meta_utility(DEFAULT_SETTINGS, TRAIN_FAMILIES, budget=0), 0.0)
lab.check("the default settings gain something", meta_utility(DEFAULT_SETTINGS, TRAIN_FAMILIES) > 0)
lab.check("the meta-utility repeats exactly", meta_utility(DEFAULT_SETTINGS, TRAIN_FAMILIES), meta_utility(DEFAULT_SETTINGS, TRAIN_FAMILIES))
lab.check("value for the default settings", meta_utility(DEFAULT_SETTINGS, TRAIN_FAMILIES), 0.01753084878084878, tol=1e-12)
```

## 4. Experiment: optimize the improver with a fixed meta-improver

Now treat the settings as the solution. A **fixed meta-improver** changes them: your `improve`, driven by `DEFAULT_SETTINGS` that never change, with `mutate_settings` as the proposer and the meta-utility on the training families as the utility. Then the cell checks the result three ways:

1. on the **training families** with the seeds used for the search (the score the search saw),
2. on the **training families** with **fresh seeds** 100 to 107,
3. on the **held-out families**, which the search never saw.

The **ceiling** is the gain if every run had ended at best fit. Best fit is the strongest simple program in this toy, so the ceiling is a rough upper mark for any settings. It is not a proof: a program could beat best fit on a validation set by a little.

```python
meta_budget = 12   # @param {type:"slider", min:4, max:40, step:4}
meta_seed = 2      # @param {type:"integer"}


def ceiling(families):
    return float(np.mean([program_score(SEED_PROGRAM, f, "validation") - program_score("-gap", f, "validation") for f in families]))


def u_train(theta):
    return meta_utility(theta, TRAIN_FAMILIES)


tuned, tuned_u = improve(DEFAULT_SETTINGS, u_train, mutate_settings, DEFAULT_SETTINGS, meta_budget, np.random.default_rng(meta_seed))
fresh = range(100, 108)
rows = [("default settings", DEFAULT_SETTINGS), ("tuned settings", tuned)]
print(f"{'':18s}{'train (seen)':>14s}{'train (fresh)':>15s}{'held-out':>10s}   (mean gain in percentage points)")
for name, th in rows:
    print(f"{name:18s}{100 * meta_utility(th, TRAIN_FAMILIES):14.2f}{100 * meta_utility(th, TRAIN_FAMILIES, seeds=fresh):15.2f}"
          f"{100 * meta_utility(th, HELD_OUT_FAMILIES):10.2f}")
print(f"{'ceiling':18s}{100 * ceiling(TRAIN_FAMILIES):14.2f}{100 * ceiling(TRAIN_FAMILIES):15.2f}{100 * ceiling(HELD_OUT_FAMILIES):10.2f}")
print("tuned settings:", {k: round(v, 2) for k, v in tuned.items()})
```

## 5. The improver improves itself

In STOP, the improver is applied to its own code: $I_t = I_{t-1}(\hat u, I_{t-1}, L)$. Here the same happens to the settings. In round $t$, the improver **with settings** $\theta_{t-1}$ improves the settings $\theta_{t-1}$:

$$
\theta_t = \text{improve}\big(\theta_{t-1},\ \hat u_{\text{train}},\ \text{mutate\_settings},\ \text{settings} = \theta_{t-1},\ \text{budget} = B_{\text{meta}}\big)
$$

So the settings decide how the settings get improved: `k` sets the batch size of the meta-search, and `step` sets how far `mutate_settings` moves a number. A better improver may also be a better improver of itself. Or it may not. That is what you measure.

Write `self_improve(theta0, rounds, meta_budget, seed)`. Make one generator `np.random.default_rng(seed)` for all rounds. Return the history: a list of `(theta, meta-utility on the training families)`, starting with `(theta0, its meta-utility)`, one entry per round after it.

```python
def self_improve(theta0, rounds, meta_budget, seed):
    """Return [(theta_0, u_0), (theta_1, u_1), ...] with rounds + 1 entries."""
    # TODO
    raise NotImplementedError("Write self_improve(theta0, rounds, meta_budget, seed)")
```

```check
{
  "question": "Stuck on self_improve?",
  "hint": "It is one line inside a loop. The fourth argument of improve is the settings that drive the search. In self-improvement you pass the current theta there, not DEFAULT_SETTINGS.",
  "answer": "Pseudocode:\n\n    rng = generator(seed); u_train = a function theta -> meta_utility(theta, TRAIN_FAMILIES)\n    theta = copy of theta0; history = [(theta, u_train(theta))]\n    repeat rounds times:\n        theta, u = improve(theta, u_train, mutate_settings, theta, meta_budget, rng)\n        append (theta, u) to history\n    return history"
}
```

```python
h0 = self_improve(DEFAULT_SETTINGS, 0, 12, 0)
lab.check("0 rounds: only the start", len(h0), 1)
lab.check("the start is scored by the meta-utility", h0[0][1], meta_utility(DEFAULT_SETTINGS, TRAIN_FAMILIES), tol=1e-12)
h = self_improve(DEFAULT_SETTINGS, 3, 12, 0)
lab.check("one entry per round, plus the start", len(h), 4)
lab.check("the meta-utility never falls", all(b[1] >= a[1] for a, b in zip(h, h[1:])))
lab.check("each u belongs to its theta", all(abs(u - meta_utility(th, TRAIN_FAMILIES)) < 1e-12 for th, u in h))
lab.check("theta0 is not changed in place", DEFAULT_SETTINGS, {"constant": 1.0, "operator": 1.0, "variable": 1.0, "grow": 1.0, "k": 4, "step": 5.0})
lab.check("the run repeats", [u for _, u in self_improve(DEFAULT_SETTINGS, 3, 12, 0)], [u for _, u in h])
```

## 6. Experiment: diminishing returns, and what stays fixed

Run several rounds. The table shows the gain of each round, the held-out score, and the score on fresh seeds.

```python
rounds = 5         # @param {type:"slider", min:1, max:10, step:1}
meta_budget = 12   # @param {type:"slider", min:4, max:40, step:4}
seed = 0           # @param {type:"integer"}

history = self_improve(DEFAULT_SETTINGS, rounds, meta_budget, seed)
print(f"{'round':>5s}{'train (seen)':>14s}{'gain':>8s}{'train (fresh)':>15s}{'held-out':>10s}   settings")
prev = None
for t, (th, u) in enumerate(history):
    gain = "" if prev is None else f"{100 * (u - prev):+8.2f}"
    print(f"{t:5d}{100 * u:14.2f}{gain:>8s}{100 * meta_utility(th, TRAIN_FAMILIES, seeds=range(100, 108)):15.2f}"
          f"{100 * meta_utility(th, HELD_OUT_FAMILIES):10.2f}   {{" + ", ".join(f"{k}: {v:.2f}" for k, v in th.items()) + "}")
    prev = u
plt.figure(figsize=(7, 3.2))
plt.plot([100 * u for _, u in history], "o-", color="#6A4C93", label="meta-utility, training families (seen seeds)")
plt.plot([100 * meta_utility(th, HELD_OUT_FAMILIES) for th, _ in history], "o-", color="#B8860B", label="held-out families")
plt.axhline(100 * ceiling(TRAIN_FAMILIES), color="#100D12", linestyle="--", linewidth=1, label="ceiling, training families")
plt.xlabel("self-improvement round"); plt.ylabel("mean gain (percentage points)"); plt.legend(fontsize=8)
```

What stayed fixed during all rounds? Nothing in this list can change, however many rounds you run:

1. The packer, the scoring rule, the validator and the tests.
2. The task families, their training and validation sets, and the seeds of the meta-utility.
3. The definition of the meta-utility and the budgets $B$ and $B_{\text{meta}}$.
4. The code of `improve`, `mutate_program` and `mutate_settings`. Only the six numbers of $\theta$ change.
5. The program language: the variables, the operators and the size limit.

## Observations

1. The gains stopped after a few rounds, below the ceiling. Name two fixed things in the list above that limit the meta-utility, and explain how each one limits it.
2. Compare "train (seen)" with "train (fresh)" for the final settings. Why is the seen score higher?
3. The held-out families improved less than the training families. What does that say about tuning an improver on a few task families?
