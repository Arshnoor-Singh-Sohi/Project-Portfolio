---
title: "RSI P7 · Regression tests and an archive"
summary: "Protect solved instances with a regression check, guard every task family against a loss, and keep an archive of versions with the Darwin Gödel Machine parent-selection rule; compare it with a single greedy line."
collection: "AI"
tags: [rsi, bin-packing, regression-tests, archive, open-endedness]
packages: [numpy, matplotlib]
level: "Advanced"
order: 107
objectives:
  - "Define a solved instance and a regression, and write a check that rejects a change that breaks solved instances or makes a task family worse."
  - "Compute DGM-style selection probabilities: a sigmoid of the score times 1 / (1 + number of children)."
  - "Run a search that keeps an archive of versions, and a search that keeps only one greedy line."
  - "Compare the two searches over many seeds, and explain what the comparison does and does not show."
---
# P7: Regression tests and an archive

Two new problems appear when a loop runs for a long time on several kinds of tasks.

1. **Regression.** A change can raise the mean score and still break tasks that worked before. A mean hides this.
2. **Getting stuck.** A loop that always builds on its single best version cannot use a weaker version as a **stepping stone** to a better one later.

The Darwin Gödel Machine (DGM) answers the second problem with an **archive**: it keeps many versions and chooses a parent at random, with more weight for good versions and for versions with few children. In this lab you build a small version of both ideas.

## 1. Task families, a reference packer and solved instances

We use three **task families**. Each has its own validation set and test set. Instances are small (20 items), so a packer often reaches the best result that we can check.

An instance is **solved** when the online packer uses no more bins than **first fit decreasing** (FFD). FFD sorts all items from largest to smallest, then uses first fit. It sees the whole list in advance, which an online agent cannot. We use it only as a **reference** for what is achievable. The **solve rate** $\alpha$ of a version is the share of its validation instances that are solved. It plays the role of the share of benchmark tasks that a DGM agent resolves.

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


# ---------- the program language, proposer and tests (from P5 and P6) ----------
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


# ---------- new in P7: families, the reference packer and the solve rate ----------
TASK_FAMILIES = ["uniform 20-100", "mixed big-small", "weibull 45"]
N_ITEMS = 20


def ffd_bins(items, capacity=CAPACITY):
    """First fit decreasing: an OFFLINE reference. It sorts all items first."""
    free = []
    for item in sorted(items, reverse=True):
        for j, space in enumerate(free):
            if space >= item:
                free[j] -= item
                break
        else:
            free.append(capacity - item)
    return len(free)


def family_sets(n_instances, split_seed):
    """{family: (instances, FFD bins of each instance)} for the three task families."""
    out = {}
    for fam in TASK_FAMILIES:
        insts = make_task_set(fam, n_instances, N_ITEMS, split_seed + 1000 * FAMILIES.index(fam))
        out[fam] = (insts, [ffd_bins(x) for x in insts])
    return out


VAL_SETS = family_sets(20, 2)
TEST_SETS = family_sets(60, 3)


def evaluate_families(src, sets):
    """{family: (excess of each instance, solved flag of each instance)} for one program."""
    fn = make_function(src)
    res = {}
    for fam, (insts, refs) in sets.items():
        used = [len(pack(x, fn)) for x in insts]
        res[fam] = (np.array([(u - lower_bound(x)) / lower_bound(x) for x, u in zip(insts, used)]),
                    np.array([u <= r for u, r in zip(used, refs)]))
    return res


def solve_rate(res):
    """alpha: the share of all instances that are solved."""
    return float(np.mean(np.concatenate([solved for _, solved in res.values()])))


for name, src in [("worst fit", "gap"), ("first fit", "0"), ("best fit", "-gap")]:
    r = evaluate_families(src, VAL_SETS)
    print(f"{name:10s} alpha = {solve_rate(r):.3f}   mean excess per family:",
          {f: round(100 * float(e.mean()), 2) for f, (e, _) in r.items()})
```

```check
{
  "question": "Why do we compare with FFD and not with the lower bound L1 to decide that an instance is solved?",
  "hint": "Look at the family uniform 20-100. Can two items larger than 50 share a bin?",
  "answer": "L1 only uses the total size. In uniform 20-100 many items are larger than 50, and no two of them can share a bin, so even an optimal packing often uses more than L1 bins. Then almost no instance would count as solved, and the solve rate would be near 0 for every version. FFD gives a reachable reference. It is still only a reference: FFD is not always optimal, and an online packer can sometimes beat it."
}
```

## 2. The regression check

A **regression** is a loss on something that worked before. Here, a change is rejected when:

1. it breaks more than `max_breaks` instances that the parent solved (solved before, not solved now), or
2. its mean excess on any family is worse than the parent's by more than `tol`.

The check uses the results of the parent and the child on the validation sets: `{family: (excess array, solved array)}`. Return `None` when the change passes, or a reason: `"breaks <k> solved"` or `"worse on <family>: <+delta>"`. Check the breaks first, then the families in the order of the dict.

```python
def regression_check(parent_res, child_res, tol=0.005, max_breaks=0):
    """Return None if the child keeps the parent's solved instances and no family gets worse by more than tol."""
    # TODO
    raise NotImplementedError("Write regression_check(parent_res, child_res, tol, max_breaks)")
```

```check
{
  "question": "Stuck on regression_check?",
  "hint": "The solved flags are NumPy bool arrays. `p & ~c` is True where the parent solved an instance and the child did not. `np.sum` counts the True values.",
  "answer": "Pseudocode:\n\n    breaks = 0\n    for each family f: breaks += count of (parent solved[f] and not child solved[f])\n    if breaks > max_breaks: return 'breaks <breaks> solved'\n    for each family f:\n        delta = mean(child excess[f]) - mean(parent excess[f])\n        if delta > tol: return 'worse on f: <delta with sign>'\n    return None"
}
```

```python
P = {"A": (np.array([0.10, 0.00]), np.array([False, True])), "B": (np.array([0.20, 0.10]), np.array([False, False]))}
better = {"A": (np.array([0.00, 0.00]), np.array([True, True])), "B": (np.array([0.20, 0.10]), np.array([False, False]))}
broken = {"A": (np.array([0.00, 0.10]), np.array([True, False])), "B": (np.array([0.20, 0.10]), np.array([False, False]))}
worse_b = {"A": (np.array([0.10, 0.00]), np.array([False, True])), "B": (np.array([0.25, 0.10]), np.array([False, False]))}
lab.check("a pure improvement passes", regression_check(P, better), None)
lab.check("breaking a solved instance is rejected", regression_check(P, broken), "breaks 1 solved")
lab.check("max_breaks allows some breaks", regression_check(P, broken, max_breaks=1), None)
lab.check("a worse family is rejected", str(regression_check(P, worse_b)).startswith("worse on B"))
lab.check("tol allows a small loss", regression_check(P, worse_b, tol=0.05), None)
lab.check("no change passes", regression_check(P, P), None)
real_parent = evaluate_families("abs(gap - 25)", VAL_SETS)
real_child = evaluate_families("0", VAL_SETS)
lab.check("a real case: first fit has a higher solve rate...", solve_rate(real_child) > solve_rate(real_parent))
lab.check("...but it breaks a solved instance", regression_check(real_parent, real_child), "breaks 1 solved")
```

The last two checks show a real case. First fit solves more instances than the program `abs(gap - 25)`, but it breaks one instance that `abs(gap - 25)` solved. A rule with `max_breaks = 0` rejects this change, although the mean got better. Keep this in mind for the experiment.

## 3. The DGM parent-selection rule

The DGM chooses parents from its archive with these weights. For archive member $i$ with score $\alpha_i \in [0, 1]$ and $n_i$ children:

$$
s_i = \frac{1}{1 + e^{-\lambda(\alpha_i - \alpha_0)}}, \qquad
h_i = \frac{1}{1 + n_i}, \qquad
p_i = \frac{s_i h_i}{\sum_j s_j h_j}
$$

- $\lambda = 10$ and $\alpha_0 = 0.5$ set how steep the sigmoid is and where its middle is.
- $s_i$ rises with the score. $h_i$ falls as a member gets more children.
- $p_i$ is the probability to choose member $i$ as the next parent.

Every member keeps a probability above zero. So weak members still get chances, and a member with many children gets fewer new ones.

```python
def selection_probs(archive):
    """archive: a list of dicts with the keys "alpha" and "children".
    Return the list of probabilities p_i (lambda = 10, alpha_0 = 0.5)."""
    # TODO
    raise NotImplementedError("Write selection_probs(archive)")
```

```check
{
  "question": "Stuck on selection_probs?",
  "hint": "Compute the weight s_i * h_i of every member first, then divide each weight by the sum of all weights.",
  "answer": "Key lines: `s = 1 / (1 + math.exp(-10 * (m[\"alpha\"] - 0.5)))`, `h = 1 / (1 + m[\"children\"])`, weight = `s * h`; then `p = [w / sum(weights) for w in weights]`."
}
```

```python
arch = [{"alpha": 0.5, "children": 0}, {"alpha": 0.5, "children": 1}, {"alpha": 0.9, "children": 0}, {"alpha": 0.1, "children": 0}]
p = selection_probs(arch)
lab.check("the probabilities add up to 1", sum(p), 1.0, tol=1e-12)
lab.check("one child halves the weight", p[1], p[0] / 2, tol=1e-12)
lab.check("a better score gets more weight", p[2] > p[0])
lab.check("a weak member keeps a chance", p[3] > 0)
lab.check("values computed by hand", np.array(p), np.array([0.2857142857, 0.1428571429, 0.5611507371, 0.0102778343]), tol=1e-8)
lab.check("one member gets probability 1", selection_probs([{"alpha": 0.2, "children": 5}]), [1.0])
```

## 4. Two searches

Write `archive_search(seed_src, budget, seed, mode, tol, max_breaks)`. It makes `budget` attempts:

1. `rng = np.random.default_rng(seed)`. The archive starts with the seed program: a dict with `src`, `res` (from `evaluate_families(src, VAL_SETS)`), `alpha` (from `solve_rate`), `children` = 0 and `parent` = `None`.
2. Choose the parent. Mode `"archive"`: `int(rng.choice(len(archive), p=selection_probs(archive)))`. Mode `"greedy"`: the member with the highest `alpha` (the first one on a tie).
3. `_, cand = mutate(parent_src, rng)`. Keep a set of tried sources (start with the seed). The outcome is the first that applies: `"skipped"` (tried before), `"tests failed"` (`run_tests`), `"too large"` (`program_size > MAX_SIZE`), `"runtime error: <class name>"` (when `evaluate_families` raises: the small test suite cannot cover every input), the reason from `regression_check(parent_res, child_res, tol, max_breaks)`, and in greedy mode `"not better"` when the child's alpha is not higher than the parent's. Otherwise `"added"`: append the child (with `parent` = the parent's index) and add 1 to the parent's `children`.
4. Log `{"attempt": t, "parent": index, "candidate": cand, "outcome": outcome}`. Return `(archive, log)`.

In archive mode a child does not need to beat its parent. The DGM code keeps every child that still works by default. Here every child that passes the tests and the regression check joins the archive.

```python
def archive_search(seed_src, budget, seed, mode="archive", tol=0.005, max_breaks=0):
    """Return (archive, log). mode is "archive" (DGM-style parent selection) or "greedy" (one line)."""
    # TODO
    raise NotImplementedError("Write archive_search(seed_src, budget, seed, mode, tol, max_breaks)")
```

```check
{
  "question": "Stuck on archive_search?",
  "hint": "Write the loop once and branch on mode in only two places: how to choose the parent, and the extra 'not better' rule for greedy mode.",
  "answer": "Pseudocode:\n\n    rng = generator(seed); archive = [member for seed_src]; tried = {seed_src}; log = []\n    for t in 0 .. budget-1:\n        pi = rng.choice with selection_probs (archive mode) or index of max alpha (greedy mode)\n        parent = archive[pi]; _, cand = mutate(parent src, rng)\n        if cand in tried: outcome = 'skipped'\n        else:\n            add to tried\n            if run_tests(cand): outcome = 'tests failed'\n            elif program_size(cand) > MAX_SIZE: outcome = 'too large'\n            else:\n                try: res = evaluate_families(cand, VAL_SETS)\n                except: outcome = 'runtime error: ...'; append the log entry; continue\n                reason = regression_check(parent res, res, tol, max_breaks)\n                if reason: outcome = reason\n                elif greedy and solve_rate(res) <= parent alpha: outcome = 'not better'\n                else: append child with parent = pi; parent children += 1; outcome = 'added'\n        append the log entry\n    return archive, log"
}
```

```python
arch_a, log_a = archive_search("gap", 40, 3, "archive", max_breaks=2)
lab.check("one log entry per attempt", len(log_a), 40)
lab.check("the seed program comes first", (arch_a[0]["src"], arch_a[0]["parent"]), ("gap", None))
lab.check("the archive grows by the added children", len(arch_a), 1 + sum(e["outcome"] == "added" for e in log_a))
lab.check("children counts match the parent links",
          all(m["children"] == sum(1 for c in arch_a if c["parent"] == i) for i, m in enumerate(arch_a)))
lab.check("every parent comes before its child", all(c["parent"] < i for i, c in enumerate(arch_a) if i > 0))
lab.check("every member passes the tests", all(run_tests(m["src"]) == [] for m in arch_a))
arch_g, log_g = archive_search("gap", 40, 3, "greedy", max_breaks=2)
lab.check("greedy: each new member beats its parent", all(c["alpha"] > arch_g[c["parent"]]["alpha"] for c in arch_g[1:]))
lab.check("greedy: the line is a chain", all(c["parent"] == i for i, c in enumerate(arch_g[1:])))
lab.check("the search repeats", [m["src"] for m in archive_search("gap", 40, 3, "archive", max_breaks=2)[0]], [m["src"] for m in arch_a])
```

## 5. Experiment: an archive against a greedy line

Both searches start from worst fit with the same budget. The cell runs several seeds, because one run of a random search proves little. It reports the best member of each final archive, chosen by its **validation** alpha and then scored once on the **test** sets.

```python
budget = 60       # @param {type:"slider", min:10, max:200, step:10}
n_seeds = 10      # @param {type:"slider", min:2, max:30, step:1}
max_breaks = 2    # @param {type:"slider", min:0, max:10, step:1}
tol = 0.005       # @param {type:"slider", min:0, max:0.05, step:0.005}

summary = {}
for mode in ["archive", "greedy"]:
    best_val, best_test, sizes, curves, outcomes = [], [], [], [], Counter()
    for s in range(n_seeds):
        archive, log = archive_search("gap", budget, s, mode, tol, max_breaks)
        best = max(archive, key=lambda m: m["alpha"])
        best_val.append(best["alpha"])
        best_test.append(solve_rate(evaluate_families(best["src"], TEST_SETS)))
        sizes.append(len(archive))
        outcomes.update("breaks solved" if e["outcome"].startswith("breaks") else
                        "worse on a family" if e["outcome"].startswith("worse") else
                        e["outcome"].split(":")[0] for e in log)
        running, curve = archive[0]["alpha"], []
        members = iter(archive[1:])
        for e in log:
            if e["outcome"] == "added":
                running = max(running, next(members)["alpha"])
            curve.append(running)
        curves.append(curve)
    summary[mode] = np.mean(curves, axis=0)
    print(f"{mode:8s} best validation alpha {np.mean(best_val):.3f}   its test alpha {np.mean(best_test):.3f}   "
          f"archive size {np.mean(sizes):5.1f}   (mean of {n_seeds} seeds)")
    print("         outcomes:", dict(outcomes.most_common(6)))
for name, src in [("first fit", "0"), ("best fit", "-gap")]:
    print(f"reference {name:9s} test alpha {solve_rate(evaluate_families(src, TEST_SETS)):.3f}")
plt.figure(figsize=(7, 3.2))
plt.plot(summary["archive"], color="#2D6A4F", label="archive (DGM selection)")
plt.plot(summary["greedy"], color="#C81D25", label="greedy line")
plt.xlabel("attempt"); plt.ylabel("best validation alpha so far"); plt.legend()
plt.title(f"mean over {n_seeds} seeds")
```

## Observations

1. Set `max_breaks` to 0. Which outcome grows, and why does the strict rule block even the step from first fit to best fit?
2. Compare the two curves at a small budget and at a large budget. What does the archive pay for, and when can that pay off?
3. Each final archive member was chosen by its validation alpha. Why is it still necessary to score it on the test sets?
