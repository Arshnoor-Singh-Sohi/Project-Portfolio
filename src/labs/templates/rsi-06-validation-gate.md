---
title: "RSI P6 · An acceptance rule with a validation suite"
summary: "Accept a program change only when it passes tests, stays under a size limit, and beats its parent on the validation set by more than two standard errors of the paired difference; keep an attempt log with the reason for every decision."
collection: "AI"
tags: [rsi, bin-packing, statistics, acceptance-rule, evaluation]
packages: [numpy, matplotlib]
level: "Intermediate"
order: 106
objectives:
  - "Explain why a random agent gives a noisy score, and why noise makes a naive acceptance rule accept useless changes."
  - "Compute the mean and the standard error of a paired difference between two versions."
  - "Write an acceptance rule with tests, a size limit and a gain larger than 2 standard errors."
  - "Keep an attempt log with the reason for every decision."
  - "Compare the naive rule and the 2 SE rule by the changes that hold on the test set."
---
# P6: An acceptance rule with a validation suite

In P5 the score of a program was exact. Run it twice, get the same number. Real agents built on language models are not like that. They sample, so the same version gets a different score on each run. Then a candidate can win by luck.

In this lab the agent is random. With probability $\varepsilon$ it puts an item into a random bin that has room, instead of the bin with the highest priority. This is a simple stand-in for a language model that samples with a temperature above zero.

You will write an **acceptance rule** that accepts a change only when:

1. the candidate passes a small suite of **tests**,
2. its size is within a **size limit**,
3. its gain over the parent, on the same validation instances, is larger than **two standard errors** of the paired difference.

Every decision goes into an **attempt log** with its reason.

## 1. The pieces from P1 to P5

This cell is long. It holds the packer, the validator, the program language, the proposer and the checks from P5. Run it and read the last part, which is new: the random packer, `evaluate` and `run_tests`.

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


# ---------- the program language and the proposer (from P5) ----------
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


EDIT_NAMES = ["constant", "operator", "variable", "grow"]
EDITS = {"constant": change_constant, "operator": swap_operator, "variable": replace_with_leaf, "grow": grow}


def mutate(src, rng, probs=None):
    name = EDIT_NAMES[rng.choice(len(EDIT_NAMES), p=probs)]
    return name, EDITS[name](src, rng)


# ---------- new in P6: a random agent, its evaluation, and a test suite ----------
def pack_random(items, priority, eps, rng, capacity=CAPACITY):
    """Like pack, but with probability eps the item goes into a random bin that has room."""
    free, bins = [], []
    for i, item in enumerate(items):
        fits = [j for j, space in enumerate(free) if space >= item]
        if not fits:
            free.append(capacity - item)
            bins.append([i])
            continue
        if eps > 0 and rng.random() < eps:
            j = fits[rng.integers(len(fits))]
        else:
            j = max(fits, key=lambda j: (priority(item, free[j]), -j))
        free[j] -= item
        bins[j].append(i)
    return bins


def evaluate(src, task_set, eps, seed):
    """Score one run of the random agent: an array with the excess of each instance.
    A new seed gives a new run, so the same program can get a different score."""
    fn = make_function(src)
    rng = np.random.default_rng(seed)
    out = []
    for items in task_set:
        bins = pack_random(items, fn, eps, rng)
        if validate(items, bins):
            raise ValueError("invalid packing")
        out.append(excess(items, bins))
    return np.array(out)


TEST_POINTS = [(i, s) for i in (1, 10, 35, 50, 99, 100) for s in sorted({i, min(100, i + 1), min(100, i + 20), 100})]
TINY_INSTANCES = [[100], [60, 40], [50, 50, 50], [30, 80, 15, 75]]


def run_tests(src):
    """The test suite. Return the names of the failed tests ([] = all pass)."""
    reason = check_program(src, max_size=10_000)          # the size limit is a separate rule
    if reason:
        return [f"whitelist ({reason})"]
    fn = make_function(src)
    try:
        values = [fn(i, s) for i, s in TEST_POINTS]       # includes gap = 0
        packings_bad = any(validate(x, pack(x, fn)) for x in TINY_INSTANCES)
    except Exception as exc:                              # noqa: BLE001
        return [f"runs without error ({type(exc).__name__})"]
    if not all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in values):
        return ["finite values"]
    if packings_bad:
        return ["valid packings"]
    return []


val = make_splits("mixed big-small", 20, 20, 100, 40)["validation"]
print("tests for '-gap':", run_tests("-gap"), "  tests for '1 / gap':", run_tests("1 / gap"))
print("two runs of best fit with eps = 0.1:",
      [round(100 * float(evaluate("-gap", val, 0.1, s).mean()), 2) for s in (1, 2)], "% mean excess")
```

## 2. How noisy is one score?

Run the same program many times with new seeds. Each run gives a different mean excess. The spread is the **noise** of the evaluator. Compare it with the difference between first fit (`0`) and best fit (`-gap`).

```python
eps = 0.1    # @param {type:"slider", min:0, max:0.5, step:0.05}
runs = 30    # @param {type:"slider", min:5, max:100, step:5}

a = [100 * evaluate("0", val, eps, [7, r]).mean() for r in range(runs)]
b = [100 * evaluate("-gap", val, eps, [8, r]).mean() for r in range(runs)]
print(f"first fit: mean {np.mean(a):5.2f} %, standard deviation {np.std(a, ddof=1):4.2f}")
print(f"best fit : mean {np.mean(b):5.2f} %, standard deviation {np.std(b, ddof=1):4.2f}")
plt.figure(figsize=(6, 3))
plt.hist(a, bins=12, alpha=0.7, color="#8A8A8A", label="first fit")
plt.hist(b, bins=12, alpha=0.7, color="#1E6091", label="best fit")
plt.xlabel("mean excess of one run (%)"); plt.legend(); plt.title(f"eps = {eps}")
```

With $\varepsilon = 0$ both histograms collapse to one bar. With $\varepsilon = 0.1$ they spread out. If two programs are equal, one of them still wins each comparison, by luck.

## 3. The paired difference and its standard error

Compare parent and child **on the same instances**. For instance $i$, the **gain** is $d_i = e_i^{\text{parent}} - e_i^{\text{child}}$, so a positive gain means the child used fewer bins. With $n$ instances:

$$
\bar d = \frac{1}{n} \sum_{i=1}^n d_i, \qquad
s_d = \sqrt{\frac{1}{n-1} \sum_{i=1}^n (d_i - \bar d)^2}, \qquad
\text{SE} = \frac{s_d}{\sqrt n}
$$

- $\bar d$ is the mean gain.
- $s_d$ is the sample standard deviation of the gains.
- SE is the standard error of the mean gain: the typical size of the error in $\bar d$ that comes from noise and from the choice of instances.

Pairing removes the difference in difficulty between instances, because both versions see the same instances. The rule "accept if $\bar d > 2\,\text{SE}$" asks for a gain that is unlikely to come from noise alone.

```python
def paired_gain(parent_scores, child_scores):
    """Return (mean gain, standard error) of d_i = parent_i - child_i.

    Use the sample standard deviation (divide by n - 1). With fewer than 2 values, SE is math.inf.
    """
    # TODO
    raise NotImplementedError("Write paired_gain(parent_scores, child_scores)")
```

```check
{
  "question": "Stuck on paired_gain?",
  "hint": "Make d with NumPy: np.asarray(parent) - np.asarray(child). d.std(ddof=1) divides by n - 1.",
  "answer": "Key lines: `d = np.asarray(parent_scores, float) - np.asarray(child_scores, float)`; if `len(d) < 2` return `(float(d.mean()), math.inf)`; else return `(float(d.mean()), float(d.std(ddof=1) / math.sqrt(len(d))))`."
}
```

```python
m, se = paired_gain([0.10, 0.10, 0.10], [0.08, 0.10, 0.06])
lab.check("mean gain of [0.02, 0, 0.04] is 0.02", m, 0.02, tol=1e-12)
lab.check("SE = 0.02 / sqrt(3)", se, 0.011547005383792516, tol=1e-12)
lab.check("a worse child gives a negative gain", paired_gain([0.1, 0.2], [0.2, 0.3])[0], -0.1, tol=1e-12)
lab.check("equal scores give gain 0 and SE 0", paired_gain([0.1, 0.2, 0.3], [0.1, 0.2, 0.3]), (0.0, 0.0))
lab.check("one value gives an infinite SE", paired_gain([0.2], [0.1])[1], math.inf)
lab.check("arrays work too", paired_gain(np.array([0.3, 0.1]), np.array([0.1, 0.1]))[0], 0.1, tol=1e-12)
```

## 4. The acceptance rule

`decide(src, parent_scores, child_scores, rule, max_size)` returns `(accepted, reason)`. Check in this order, and return at the first rule that rejects:

| Order | Rule | Reason text when it rejects |
|---|---|---|
| 1 | `run_tests(src)` returns no failures | `tests failed: <names, joined by ", ">` |
| 2 | `program_size(src) <= max_size` (`None` means `MAX_SIZE`) | `too large: size <n> > <limit>` |
| 3 | `child_scores` is not `None` (the evaluation worked) | `evaluation failed` |
| 4 | `rule == "naive"`: gain > 0. `rule == "2se"`: gain > 2 SE | `rejected: gain ...` |

An accepted change gets a reason that starts with `accepted:`. Put the numbers in every reason: a log without numbers cannot be checked later.

```python
def decide(src, parent_scores, child_scores, rule="2se", max_size=None):
    """Return (accepted: bool, reason: str) for one candidate. See the table above."""
    # TODO
    raise NotImplementedError("Write decide(src, parent_scores, child_scores, rule, max_size)")
```

```check
{
  "question": "Stuck on decide?",
  "hint": "Write four if-blocks in the order of the table. Each one returns (False, reason). Only the last block can return True. Use paired_gain for the gain and the SE.",
  "answer": "Pseudocode:\n\n    limit = MAX_SIZE if max_size is None else max_size\n    failed = run_tests(src); if failed: return False, 'tests failed: ' + join(failed)\n    if program_size(src) > limit: return False, 'too large: size n > limit'\n    if child_scores is None: return False, 'evaluation failed'\n    gain, se = paired_gain(parent_scores, child_scores)\n    threshold = 0 if rule == 'naive' else 2 * se\n    if gain > threshold: return True, 'accepted: gain ... > threshold'\n    return False, 'rejected: gain ... <= threshold'"
}
```

```python
p = [0.10, 0.12, 0.08, 0.10]
lab.check("a clear gain is accepted", decide("-gap", p, [0.05, 0.07, 0.03, 0.05])[0])
lab.check("its reason starts with 'accepted'", decide("-gap", p, [0.05, 0.07, 0.03, 0.05])[1].startswith("accepted"))
small_gain = [0.10, 0.12, 0.06, 0.09]            # gains 0, 0, +0.02, +0.01
lab.check("a small noisy gain passes the naive rule", decide("-gap", p, small_gain, rule="naive")[0])
lab.check("the same gain fails the 2 SE rule", decide("-gap", p, small_gain, rule="2se")[0] is False)
lab.check("its reason starts with 'rejected'", decide("-gap", p, small_gain)[1].startswith("rejected"))
lab.check("failed tests come first", decide("1 / gap", p, [0.0] * 4)[1].startswith("tests failed"))
lab.check("a forbidden program fails the tests", decide("item.__class__", p, [0.0] * 4)[0] is False)
big = " + ".join(["gap"] * 9)                     # size 17
lab.check("the size limit applies", decide(big, p, [0.0] * 4)[1].startswith("too large"))
lab.check("the size limit is a parameter", decide(big, p, [0.0] * 4, max_size=20)[0])
lab.check("a failed evaluation is rejected", decide("-gap", p, None), (False, "evaluation failed"))
lab.check("no gain is rejected by both rules", not decide("-gap", p, p, "naive")[0] and not decide("-gap", p, p, "2se")[0])
```

## 5. The improvement loop with an attempt log

Now put it together. Each iteration:

1. `edit, cand = mutate(best, rng)`, with `rng = np.random.default_rng(seed)` made once.
2. If `cand` equals `best` or was tried before: log it with the reason `skipped: no change or already tried` and continue. Otherwise add it to `tried`.
3. If `run_tests(cand)` passes and the size is within `MAX_SIZE`, evaluate the child with seed `[seed, t, 0]` and the parent **again**, with seed `[seed, t, 1]`, on the validation set. If `evaluate` raises, the child scores are `None`. If the tests or the size fail, skip the evaluation and keep `None`.
4. `accepted, reason = decide(cand, parent_scores, child_scores, rule)`.
5. Log a dict with the keys `iteration`, `parent`, `candidate`, `accepted`, `reason`, `gain`, `se` (gain and se from `paired_gain`, or `None` without an evaluation). If accepted, the candidate becomes `best`.

The parent is evaluated again in every iteration. Never reuse the parent's old score: that score was lucky, because it was the score that got the parent accepted.

```python
def improvement_loop(seed_src, val_set, iterations, rule, eps, seed):
    """Return (best_src, log). One log entry per iteration."""
    # TODO
    raise NotImplementedError("Write improvement_loop(seed_src, val_set, iterations, rule, eps, seed)")
```

```check
{
  "question": "Stuck on improvement_loop?",
  "hint": "Start every log entry with the default values (accepted False, gain and se None), then fill it in. Evaluate the parent with the second seed in the same iteration as the child.",
  "answer": "Pseudocode:\n\n    rng = generator(seed); best = seed_src; tried = {seed_src}; log = []\n    for t in 0 .. iterations-1:\n        edit, cand = mutate(best, rng)\n        entry = {iteration t, parent best, candidate cand, accepted False, reason '', gain None, se None}\n        if cand == best or cand in tried: entry reason = 'skipped: ...'; append; continue\n        add cand to tried; child = parent = None\n        if run_tests(cand) is empty and program_size(cand) <= MAX_SIZE:\n            try: child = evaluate(cand, val_set, eps, [seed, t, 0]); parent = evaluate(best, val_set, eps, [seed, t, 1])\n            except: child = None\n        accepted, reason = decide(cand, parent, child, rule)\n        if child is not None: entry gain, se = paired_gain(parent, child)\n        fill entry; if accepted: best = cand\n        append entry\n    return best, log"
}
```

```python
tiny_val = make_task_set("mixed big-small", 8, 30, 31)
best0, log0 = improvement_loop("gap", tiny_val, 0, "2se", 0.1, 0)
lab.check("0 iterations: the seed program and an empty log", (best0, log0), ("gap", []))
best1, log1 = improvement_loop("gap", tiny_val, 60, "2se", 0.1, 4)
lab.check("one log entry per iteration", len(log1), 60)
lab.check("every entry has the seven keys", all(set(e) == {"iteration", "parent", "candidate", "accepted", "reason", "gain", "se"} for e in log1))
lab.check("every entry has a reason", all(e["reason"] for e in log1))
lab.check("accepted entries have reasons that start with 'accepted'", all(e["reason"].startswith("accepted") == e["accepted"] for e in log1))
lab.check("each accepted candidate becomes the next parent",
          all(log1[k + 1]["parent"] == (e["candidate"] if e["accepted"] else e["parent"]) for k, e in enumerate(log1[:-1])))
lab.check("the 2 SE rule held for every acceptance", all(e["gain"] > 2 * e["se"] for e in log1 if e["accepted"]))
lab.check("the final program passes the tests", run_tests(best1), [])
lab.check("the run repeats", improvement_loop("gap", tiny_val, 60, "2se", 0.1, 4)[0], best1)
```

## 6. Experiment: the naive rule against the 2 SE rule

Both loops start from worst fit (`gap`) and see the same random agent. After the run, the cell checks each accepted change on the **test set**, with the same random seed for parent and child. A change **holds** if the child is better on the test set.

```python
family = "mixed big-small"  # @param ["uniform 20-100", "small 1-30", "mixed big-small", "triangular", "weibull 45"]
eps = 0.1                   # @param {type:"slider", min:0, max:0.4, step:0.05}
n_val = 20                  # @param {type:"slider", min:5, max:60, step:5}
n_items = 60                # @param {type:"slider", min:20, max:100, step:10}
iterations = 200            # @param {type:"slider", min:20, max:400, step:20}
seed = 0                    # @param {type:"integer"}

splits = make_splits(family, 20, n_val, 100, n_items)
summary = {}
for rule in ["naive", "2se"]:
    best, log = improvement_loop("gap", splits["validation"], iterations, rule, eps, seed)
    accepted = [e for e in log if e["accepted"]]
    held, curve = 0, [100 * evaluate(accepted[0]["parent"] if accepted else best, splits["test"], eps, 99).mean()]
    for e in accepted:
        before = evaluate(e["parent"], splits["test"], eps, 99)
        after = evaluate(e["candidate"], splits["test"], eps, 99)
        held += after.mean() < before.mean()
        curve.append(100 * after.mean())
    summary[rule] = curve
    reasons = Counter(e["reason"].split(":")[0] for e in log)
    print(f"--- rule {rule}: {len(accepted)} accepted, {held} held on the test set")
    print("    reasons:", dict(reasons.most_common()))
    print(f"    final program (size {program_size(best)}): {best}")
    print(f"    final test score {curve[-1]:.2f} %")
plt.figure(figsize=(7, 3.2))
for rule, color in [("naive", "#C81D25"), ("2se", "#2A9D8F")]:
    plt.plot(summary[rule], "o-", color=color, markersize=3, label=f"{rule} rule")
plt.xlabel("accepted change number"); plt.ylabel("test score (%)"); plt.legend()
plt.title("the true effect of each accepted change")
```

## Observations

1. The naive rule accepted many changes. How many of them held on the test set? What did they do to the size of the program?
2. Set `eps` to 0. The noise is now only the choice of instances. How does the number of naive acceptances change? Why?
3. The 2 SE rule can also reject a real improvement when the gain is small. Set `n_val` to 5, then to 60. Explain the trade-off.
