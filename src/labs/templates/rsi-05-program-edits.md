---
title: "RSI P5 · An agent that edits a program"
summary: "Write the strategy as the source of a Python expression, change it with edits on its syntax tree, and pass every candidate through compile, a whitelist, a size limit, a guarded run and the validator, while you count the reasons for rejection."
collection: "AI"
tags: [rsi, bin-packing, program-search, ast, sandbox]
packages: [numpy, matplotlib]
level: "Intermediate"
order: 105
objectives:
  - "Represent a strategy as program source, and read its syntax tree."
  - "Write a whitelist check that rejects syntax errors, forbidden code and programs that are too large."
  - "Write one program edit: swap a binary operator in the syntax tree."
  - "Run a candidate under guards: runtime errors, values that are not finite numbers, and the validator."
  - "Run an edit loop and count the reasons for rejection."
---
# P5: An agent that edits a program

In P4 the strategy was a vector of six numbers. A vector can only express what its features allow. Systems such as FunSearch and the Darwin Gödel Machine change **program source** instead. A program can express much more. It can also crash, run forever, read files, or cheat. So every candidate program must pass checks before it runs.

In this lab the strategy is the source text of one Python **expression**, for example `-gap`. The packer computes it for each open bin with three variables:

| Variable | Meaning |
|---|---|
| `item` | the size of the arriving item |
| `space` | the free space of the bin |
| `gap` | `space - item`, the free space that stays after the item |

`0` is first fit. `-gap` is best fit. `gap` is worst fit.

> [!note] Here the program is changed from outside
> A seeded random proposer edits the program. In a real system a language model writes the change. P9 explains that version. The checks in this lab are the same in both cases.

## 1. The pieces from P1 and P3

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


def mean_excess(task_set, priority):
    return sum(excess(items, pack(items, priority)) for items in task_set) / len(task_set)


def first_fit(item, space):
    return 0


def best_fit(item, space):
    return -(space - item)


def validate(items, packing, capacity=CAPACITY):
    """From P3: the reasons why a packing is invalid. [] means valid."""
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


print("Ready.")
```

## 2. Programs as syntax trees

Python can parse source text into a **syntax tree** (the `ast` module). Each node of the tree is one part of the expression: a number, a name, an operation. A program edit is safer on the tree than on the text: the result is always well-formed.

The next cell defines the program language and the tools for this lab:

1. The **whitelist**: the node types, names and operators that a program may use.
2. `program_size(src)`: the number of expression nodes in the tree. We use it as the size of a program.
3. `make_function(src)`: turns checked source into a function `f(item, space)`. It runs the code with **no built-in functions**, only `abs`, `min` and `max`. This is a second layer of protection, not a sandbox. Only the whitelist check makes it safe enough for this toy.
4. Three of the four program edits. You write the fourth one.

```python
VARS = ("item", "space", "gap")
FUNCS = ("abs", "min", "max")
OPS = [ast.Add, ast.Sub, ast.Mult, ast.Div]
ALLOWED_NODES = (ast.Expression, ast.BinOp, ast.UnaryOp, ast.Name, ast.Constant, ast.Call, ast.Load,
                 ast.Add, ast.Sub, ast.Mult, ast.Div, ast.USub)
MAX_SIZE = 15


class NotFinite(Exception):
    """Raised when a program returns a value that is not a finite number."""


def program_size(src):
    """The number of expression nodes (numbers, names, operations, calls) in the program."""
    return sum(isinstance(n, ast.expr) for n in ast.walk(ast.parse(src, mode="eval")))


def make_function(src):
    """Compile CHECKED source into f(item, space). Never call it on unchecked text."""
    code = compile("lambda item, space: (lambda gap: (" + src + "))(space - item)", "<candidate>", "eval")
    return eval(code, {"__builtins__": {}, "abs": abs, "min": min, "max": max})


def expression_nodes(tree):
    """All nodes that a proposer may change (function names in calls are not included)."""
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
    """Edit 'constant': move one number by a random amount. No number: no change."""
    tree = ast.parse(src, mode="eval")
    nums = [n for n in ast.walk(tree) if isinstance(n, ast.Constant)]
    if not nums:
        return src
    node = nums[rng.integers(len(nums))]
    node.value = round(node.value + step * float(rng.normal()), 1)
    return ast.unparse(tree)


def replace_with_leaf(src, rng):
    """Edit 'variable': replace one sub-expression with a variable or a number."""
    tree = ast.parse(src, mode="eval")
    nodes = expression_nodes(tree)
    old = nodes[rng.integers(len(nodes))]
    return ast.unparse(replace_node(tree, old, random_leaf(rng)))


def grow(src, rng):
    """Edit 'grow': combine one sub-expression X with a new leaf: X op leaf, abs(X), min(X, leaf) or max(X, leaf)."""
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


def mutate(src, rng, probs=None):
    """The proposer: choose an edit type, apply it once. Returns (edit name, new source).
    'operator' calls YOUR swap_operator (exercise 2)."""
    edits = {"constant": change_constant, "operator": swap_operator, "variable": replace_with_leaf, "grow": grow}
    name = EDIT_NAMES[rng.choice(len(EDIT_NAMES), p=probs)]
    return name, edits[name](src, rng)


print("Ready.")
```

Explore before you build. Pick a program, look at its tree, its size and its score. Then see what the three given edits do to it.

```python
program = "min(gap, 30) - space / 3"  # @param ["0", "-gap", "gap", "item - space", "min(gap, 30) - space / 3", "abs(gap - 25)"]
seed = 0                              # @param {type:"integer"}

val = make_splits("mixed big-small", 20, 20, 100, 40)["validation"]
print("source :", program)
print("size   :", program_size(program))
print("tree   :", ast.dump(ast.parse(program, mode="eval").body, indent=1)[:600])
print(f"score  : {100 * mean_excess(val, make_function(program)):.2f} % mean excess on the validation set")
rng = np.random.default_rng(seed)
for name, edit in [("constant", change_constant), ("variable", replace_with_leaf), ("grow", grow)]:
    print(f"{name:9s}:", [edit(program, rng) for _ in range(3)])
```

## 3. The whitelist check

`check_program(src, max_size=None)` must return `None` for a good program, or one reason. `max_size=None` means: use the global `MAX_SIZE`, read at call time.

1. `"syntax error"` when `ast.parse(src, mode="eval")` fails.
2. `"forbidden: ..."` when the tree holds a node type that is not in `ALLOWED_NODES`, a name that is not in `VARS + FUNCS`, a call whose function is not a name in `FUNCS` or that uses keyword arguments, or a constant that is not an `int` or `float` (a `bool` is forbidden too).
3. `"too large"` when `program_size(src) > max_size`.

Check them in this order. Text such as `__import__('os')` must never reach `make_function`.

```python
def check_program(src, max_size=None):
    """Return None if src is an allowed program, else "syntax error", "forbidden: ..." or "too large".

    max_size=None means: use the global MAX_SIZE.
    """
    # TODO
    raise NotImplementedError("Write check_program(src, max_size)")
```

```check
{
  "question": "Stuck on check_program?",
  "hint": "Parse inside try/except SyntaxError. Then visit every node with ast.walk(tree) and test it with isinstance(node, ALLOWED_NODES). Add special tests for ast.Call, ast.Name and ast.Constant nodes. Check the size last.",
  "answer": "Pseudocode:\n\n    try: tree = parse src in 'eval' mode\n    except SyntaxError: return 'syntax error'\n    for node in every node of tree:\n        if node type not allowed: return 'forbidden: <type name>'\n        if node is a Call: its func must be a Name in FUNCS, with no keywords, else 'forbidden: call'\n        if node is a Name: its id must be in VARS + FUNCS, else 'forbidden: name <id>'\n        if node is a Constant: its value must be int or float and not bool, else 'forbidden: constant'\n    limit = MAX_SIZE if max_size is None else max_size\n    if program_size(src) > limit: return 'too large'\n    return None"
}
```

```python
lab.check("best fit is allowed", check_program("-gap"), None)
lab.check("a larger program is allowed", check_program("min(gap, 20) - space / 3"), None)
lab.check("broken text is a syntax error", check_program("item +"), "syntax error")
lab.check("an import is forbidden", str(check_program("__import__('os').system('echo hi')")).startswith("forbidden"))
lab.check("attribute access is forbidden", str(check_program("item.__class__")).startswith("forbidden"))
lab.check("a comprehension is forbidden", str(check_program("[x for x in (1, 2)]")).startswith("forbidden"))
lab.check("an unknown function is forbidden", str(check_program("open('notes.txt')")).startswith("forbidden"))
lab.check("keyword arguments are forbidden", str(check_program("max(item, space, key=abs)")).startswith("forbidden"))
lab.check("a lambda is forbidden", str(check_program("(lambda: 1)()")).startswith("forbidden"))
lab.check("a string constant is forbidden", str(check_program("'text'")).startswith("forbidden"))
lab.check("a bool constant is forbidden", str(check_program("True")).startswith("forbidden"))
lab.check("an unknown variable is forbidden", str(check_program("items")).startswith("forbidden"))
lab.check("a long program is too large", check_program(" + ".join(["item"] * 10)), "too large")
lab.check("the size limit is a parameter", check_program("item + space", max_size=2), "too large")
```

## 4. One program edit: swap an operator

Write the edit `swap_operator`. Find all `ast.BinOp` nodes. Choose one with `rng.integers(...)`. Replace its operator with a **different** operator from `OPS`, also chosen with `rng.integers(...)`. Return the new source with `ast.unparse(tree)`. If the program has no binary operation, return it unchanged.

```python
def swap_operator(src, rng):
    """Edit 'operator': replace the operator of one random BinOp with a different one from OPS."""
    # TODO
    raise NotImplementedError("Write swap_operator(src, rng)")
```

```check
{
  "question": "Stuck on swap_operator?",
  "hint": "OPS holds operator classes, for example ast.Add. A node's operator is an instance, so test it with isinstance(node.op, op). Make a list of the other three classes, choose one, and set node.op to a new instance of it.",
  "answer": "Pseudocode:\n\n    tree = parse src in 'eval' mode\n    binops = every BinOp node in tree\n    if binops is empty: return src\n    node = binops[rng.integers(len(binops))]\n    others = the classes in OPS that node.op is not an instance of\n    node.op = others[rng.integers(len(others))]()\n    return ast.unparse(tree)"
}
```

```python
rng = np.random.default_rng(0)
out = [swap_operator("item - space", rng) for _ in range(60)]
lab.check("the result is never the input", "item - space" not in out)
lab.check("only the operator changes", set(out) <= {"item + space", "item * space", "item / space"})
lab.check("all three other operators appear", set(out), {"item + space", "item * space", "item / space"})
lab.check("no operator: no change", swap_operator("abs(gap)", rng), "abs(gap)")
lab.check("the result is a valid program", all(check_program(swap_operator("min(gap, 30) - space / 3", rng)) is None for _ in range(30)))
nested = {swap_operator("(item - space) * gap", np.random.default_rng(s)) for s in range(40)}
lab.check("any BinOp can be chosen", any(x.endswith("* gap") for x in nested) and any(not x.endswith("* gap") for x in nested))
```

## 5. Run a candidate under guards

`try_candidate(src, task_set, packer)` runs one candidate and returns `(score, "ok")` or `(None, reason)`:

1. Run `check_program`. If it gives a reason, return it.
2. Make the function with `make_function`. Wrap it: if a value is a `bool` or not an `int`/`float`, or not finite (`math.isfinite`), raise `NotFinite`.
3. Pack every instance with `packer` (default: `pack`) and the wrapped function. A `NotFinite` gives `"not finite"`. Any other exception gives `"runtime error: <exception class name>"`.
4. Run `validate` on every packing. Any reason gives `"invalid packing"`. The packer is fixed and correct, so this check should never fire. It is there in case the packer is wrong.
5. Return the mean excess and `"ok"`.

```python
def try_candidate(src, task_set, packer=None):
    """Return (mean excess, "ok") or (None, reason). packer=None means: use pack."""
    # TODO
    raise NotImplementedError("Write try_candidate(src, task_set, packer)")
```

```check
{
  "question": "Stuck on try_candidate?",
  "hint": "Define the wrapper inside try_candidate, so that it can use the compiled function. Put the whole loop over the task set inside one try block, and catch NotFinite before the general Exception.",
  "answer": "Pseudocode:\n\n    reason = check_program(src); if reason: return None, reason\n    fn = make_function(src)\n    guarded(item, space): v = fn(item, space); if v is bool or not a number or not finite: raise NotFinite; return v\n    try:\n        for items in task_set:\n            bins = packer(items, guarded)\n            if validate(items, bins): return None, 'invalid packing'\n            collect excess(items, bins)\n    except NotFinite: return None, 'not finite'\n    except Exception as e: return None, 'runtime error: ' + the class name of e\n    return mean of the excess values, 'ok'"
}
```

```python
ts = [[60, 40], [50, 30, 70, 20], [90, 10, 45, 45]]
s, r = try_candidate("-gap", ts)
lab.check("best fit runs and scores like best_fit", (round(s, 12), r), (round(mean_excess(ts, best_fit), 12), "ok"))
lab.check("a forbidden program is not run", try_candidate("item.__class__", ts)[1].startswith("forbidden"))
lab.check("division by zero is caught", try_candidate("1 / gap", ts), (None, "runtime error: ZeroDivisionError"))
lab.check("a wrong call is caught", try_candidate("min(gap)", ts), (None, "runtime error: TypeError"))
lab.check("an infinite value is caught", try_candidate("gap * 1e308 * 10", ts), (None, "not finite"))


def broken_packer(items, priority):
    return pack(items, priority)[:-1]          # loses the last bin


lab.check("the validator catches a broken packer", try_candidate("-gap", ts, packer=broken_packer), (None, "invalid packing"))
lab.check("a syntax error is reported", try_candidate("gap -", ts), (None, "syntax error"))
```

## 6. The edit loop

Write the loop. It is hill climbing, as in P4, but every candidate is a program and every outcome is recorded:

1. `rng = np.random.default_rng(seed)`. The start score is `try_candidate(seed_src, task_set)[0]`.
2. Keep a set `tried` of every source already evaluated (start with `seed_src`).
3. In each iteration: `edit, cand = mutate(best_src, rng)`. The outcome is `"no change"` if `cand == best_src`, else `"already tried"` if `cand` is in `tried`. Otherwise add it to `tried` and run `try_candidate`. A rejection gives the part of the reason before the first `:` (for example `"runtime error"`). An accepted candidate must have a strictly lower score: `"accepted"`. Else `"not better"`.
4. Log one dict per iteration: `{"iteration": t, "edit": edit, "candidate": cand, "outcome": outcome}`.
5. Return `(best_src, best_score, log)`.

```python
def edit_loop(seed_src, task_set, iterations, seed):
    """Hill climbing over programs. Return (best_src, best_score, log)."""
    # TODO
    raise NotImplementedError("Write edit_loop(seed_src, task_set, iterations, seed)")
```

```check
{
  "question": "Stuck on edit_loop?",
  "hint": "It is the hill_climb of P4 with three extra outcomes before the evaluation: no change, already tried, and rejection. Decide the outcome first, then append one log entry at the end of every iteration.",
  "answer": "Pseudocode:\n\n    rng = generator(seed); best_src = seed_src; best = score of seed_src; tried = {seed_src}; log = []\n    for t in 0 .. iterations-1:\n        edit, cand = mutate(best_src, rng)\n        if cand == best_src: outcome = 'no change'\n        elif cand in tried: outcome = 'already tried'\n        else:\n            add cand to tried; score, reason = try_candidate(cand, task_set)\n            if reason != 'ok': outcome = the text of reason before ':'\n            elif score < best: best_src, best, outcome = cand, score, 'accepted'\n            else: outcome = 'not better'\n        append {iteration, edit, candidate, outcome} to log\n    return best_src, best, log"
}
```

```python
small = make_task_set("mixed big-small", 6, 30, 21)
b0, s0, log0 = edit_loop("gap", small, 0, 0)
lab.check("0 iterations return the seed program", (b0, len(log0)), ("gap", 0))
best_src, best_score, log = edit_loop("gap", small, 80, 1)
outcomes = Counter(e["outcome"] for e in log)
lab.check("one log entry per iteration", len(log), 80)
lab.check("only known outcomes", set(outcomes) <= {"no change", "already tried", "syntax error", "forbidden", "too large",
                                                  "runtime error", "not finite", "invalid packing", "accepted", "not better"})
lab.check("the best program is allowed", check_program(best_src), None)
lab.check("the best score belongs to the best program", best_score, try_candidate(best_src, small)[0], tol=1e-12)
lab.check("the loop beat worst fit", best_score < try_candidate("gap", small)[0])
accepted = [e["candidate"] for e in log if e["outcome"] == "accepted"]
lab.check("the last accepted candidate is the best program", accepted[-1], best_src)
lab.check("the run repeats", edit_loop("gap", small, 80, 1)[0], best_src)
```

## 7. Experiment: where do the candidates go?

Start from worst fit (`gap`). Run the loop on the training set and count the outcomes. Then score the final program once on the validation and test sets.

```python
family = "mixed big-small"  # @param ["uniform 20-100", "small 1-30", "mixed big-small", "triangular", "weibull 45"]
seed_program = "gap"        # @param ["gap", "0", "item - space", "abs(gap - 25)"]
iterations = 300            # @param {type:"slider", min:20, max:600, step:20}
max_size = 15               # @param {type:"slider", min:3, max:30, step:1}
seed = 0                    # @param {type:"integer"}

MAX_SIZE = max_size         # check_program reads the global MAX_SIZE at call time
splits = make_splits(family, 20, 20, 100, 40)
best_src, best_score, log = edit_loop(seed_program, splits["train"], iterations, seed)
outcomes = Counter(e["outcome"] for e in log)
print("outcomes:", dict(outcomes.most_common()))
print("\naccepted changes:")
for e in log:
    if e["outcome"] == "accepted":
        print(f"  iteration {e['iteration']:3d}  {e['edit']:9s} -> {e['candidate']}")
for name in ["validation", "test"]:
    print(f"{name:10s}: program {100 * try_candidate(best_src, splits[name])[0]:5.2f} %   "
          f"first fit {100 * mean_excess(splits[name], first_fit):5.2f} %   best fit {100 * mean_excess(splits[name], best_fit):5.2f} %")
plt.figure(figsize=(7, 3.2))
keys = [k for k, _ in outcomes.most_common()]
plt.barh(keys, [outcomes[k] for k in keys],
         color=["#2A9D8F" if k == "accepted" else "#8A8A8A" if k in ("not better", "already tried", "no change") else "#C81D25" for k in keys])
plt.xlabel("candidates"); plt.title("what happened to each candidate")
```

## Observations

1. Most candidates were not better, or were repeats. Why does a random proposer waste so much work once it reaches a good program?
2. Set `max_size` to 5. Which outcome grows? What does a size limit protect against, and what can it block?
3. The whitelist allowed `abs`, `min` and `max`, and nothing else. Why is a list of allowed things safer than a list of forbidden things?
