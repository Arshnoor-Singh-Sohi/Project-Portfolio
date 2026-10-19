---
title: "Reference solutions"
order: 10
summary: "Complete reference solutions for the eight projects. Open them only after you try each project."
status: not-started
tags: [rsi, project, solutions]
---

> [!trap] Open a solution only after you try the project
> You learn from the struggle, not from reading a solution. Try each exercise in its lab first. Use the hints in the lab in their order. Come here only when a test still fails after the last hint, or after you finish, to compare your code with one correct version.

## How to use this page

This page belongs to Part 9 of the course on recursive self-improvement (RSI). Each section below holds the reference solution of one project:

1. The code of every exercise function. It replaces the stubs in the lab and runs after the setup cells.
2. A short walkthrough of the key lines.
3. The exact output that the experiment cells printed in our run of this solution, with the default controls.

Your solution can differ and still be correct. The tests in the lab check behaviour, not the exact code. Two things must match for the printed numbers to match. One is the order in which your code uses the random generator. The other is the tie rules in the specifications.

We tested every solution against its lab. All checks passed, and no cell took longer than 3 seconds in our tests. The browser runtime is slower, so expect a few seconds more.

P9 is a design, so it has no solution code. Its check questions hold the answers.

## P1: A fixed agent with a score

Project page: [P1: A fixed agent with a score](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score). Lab: [Lab: RSI P1 · A fixed agent with a score](/labs/new?template=rsi-01-fixed-agent).

### Code

```python
# These functions replace the stubs. They run after the setup cells of the lab.
import math


def pack(items, priority, capacity=CAPACITY):
    free = []                      # free[j] = free space left in bin j
    bins = []                      # bins[j] = indices of the items in bin j
    for i, item in enumerate(items):
        best_j, best_p = -1, -math.inf
        for j, space in enumerate(free):
            if space >= item:      # only bins that have room
                p = priority(item, space)
                if p > best_p:     # strict ">" keeps the lowest index on a tie
                    best_j, best_p = j, p
        if best_j == -1:           # no open bin has room: open a new bin
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


def make_splits(family, n_train, n_val, n_test, n_items):
    k = FAMILIES.index(family)
    return {
        "train": make_task_set(family, n_train, n_items, 1 + 1000 * k),
        "validation": make_task_set(family, n_val, n_items, 2 + 1000 * k),
        "test": make_task_set(family, n_test, n_items, 3 + 1000 * k),
    }
```

### Key lines

1. `free` and `bins` are two lists with the same index. `free[j]` is the free space of bin `j`, and `bins[j]` holds its item indices.
2. `if space >= item` lets an item fill a bin exactly.
3. `if p > best_p` is strict. A later bin with the same priority never replaces an earlier one, so the lowest index wins a tie. First fit depends on this.
4. `best_j == -1` after the scan means that no open bin has room, so a new bin opens.
5. `math.ceil(sum(items) / capacity)` rounds up. Integer division would give 1 for a total of 101.
6. `make_splits` uses `k = FAMILIES.index(family)` and the seeds `1 + 1000 * k`, `2 + 1000 * k` and `3 + 1000 * k`. So each family gets its own three sets.

### Output of our run

All 26 checks of the lab pass with this code.

The experiment cell (family "mixed big-small", 60 items, 20, 20 and 100 instances):

```text
train       first fit  11.99 %   best fit  10.46 %
validation  first fit  12.43 %   best fit  11.60 %
test        first fit  13.31 %   best fit  11.57 %
```

## P2: Many candidates, one answer

Project page: [P2: Many candidates, one answer](/notes/ai/recursive-self-improvement/09-build-it/p2-many-candidates-one-answer). Lab: [Lab: RSI P2 · Many candidates, one answer](/labs/new?template=rsi-02-many-candidates).

### Code

```python
# These functions replace the stubs. They run after the setup cells of the lab.
import numpy as np


def noisy(priority, noise, rng):
    def noisy_priority(item, space):
        return priority(item, space) + noise * rng.normal()
    return noisy_priority


def best_of_k(items, priority, k, noise, seed):
    best, counts = None, []
    for j in range(k):
        rng = np.random.default_rng([seed, j])      # sample j has its own stream
        bins = pack(items, noisy(priority, noise, rng))
        counts.append(len(bins))
        if best is None or len(bins) < len(best):   # strict: keep the first best sample
            best = bins
    return best, counts


def pick_best_version(task_set, priority, noise, n_versions, seed):
    scores = []
    for j in range(n_versions):
        rng = np.random.default_rng([seed, j])      # version j: one stream for the whole set
        p = noisy(priority, noise, rng)
        scores.append(sum(excess(items, pack(items, p)) for items in task_set) / len(task_set))
    best_j = min(range(n_versions), key=lambda j: scores[j])
    return best_j, scores
```

### Key lines

1. `noisy` returns the inner function `noisy_priority`. It calls `rng.normal()` at every call, so each bin gets its own draw.
2. In `best_of_k`, `np.random.default_rng([seed, j])` gives sample `j` its own stream. The first 4 samples of K = 8 are therefore the 4 samples of K = 4.
3. `len(bins) < len(best)` is strict, so the first of several equal packings is kept.
4. In `pick_best_version`, the generator is made once per version, before the loop over instances. The stream continues from one instance to the next, like one long run of one agent.

### Output of our run

All 16 checks of the lab pass with this code.

The gain and the cost ("weibull 45", noise 10):

```text
K =  1: mean excess  7.93 %   priority calls    1221
K =  2: mean excess  7.53 %   priority calls    2411
K =  4: mean excess  7.35 %   priority calls    4807
K =  8: mean excess  6.93 %   priority calls    9627
K = 16: mean excess  6.72 %   priority calls   19292
best fit without noise:  7.75 %
```

Nothing persists (K = 8, noise 10):

```text
reuse the winner of the last instance :  8.79 %
one fresh sample                       :  8.37 %
best of 8 fresh samples               :  7.10 %
```

The optimistic bias (20 versions, 20 training instances):

```text
chosen version 1
its training score (used to choose it):  7.28 %
its test score (fresh instances)      :  8.07 %
mean test score of all versions        :  8.14 %
```

## P3: An evaluator with explicit tests

Project page: [P3: An evaluator with explicit tests](/notes/ai/recursive-self-improvement/09-build-it/p3-an-evaluator-with-explicit-tests). Lab: [Lab: RSI P3 · An evaluator with explicit tests](/labs/new?template=rsi-03-evaluator-tests).

### Code

```python
# These functions replace the stubs. They run after the setup cells of the lab.
import math


def validate(items, packing, capacity=CAPACITY):
    reasons = []
    times = [0] * len(items)
    for j, b in enumerate(packing):
        if len(b) == 0:
            reasons.append(f"empty bin {j}")
        load = 0
        for i in b:
            if not isinstance(i, int) or isinstance(i, bool) or not 0 <= i < len(items):
                reasons.append(f"unknown item {i!r} in bin {j}")
                continue
            times[i] += 1
            load += items[i]                  # the real size, not a size the packer reports
        if load > capacity:
            reasons.append(f"bin {j} over capacity: {load} > {capacity}")
    for i, n in enumerate(times):
        if n == 0:
            reasons.append(f"missing item {i}")
        elif n > 1:
            reasons.append(f"item {i} placed {n} times")
    return reasons


def checked_score(items, packing):
    reasons = validate(items, packing)
    if reasons:
        return math.inf, reasons
    return excess(items, packing), []


def evaluate_packer(packer, task_set):
    naive, checked, invalid = [], [], 0
    for items in task_set:
        packing = packer(items)
        naive.append(naive_score(items, packing))
        score, reasons = checked_score(items, packing)
        checked.append(score)
        invalid += bool(reasons)
    return {"naive": sum(naive) / len(naive),
            "checked": sum(checked) / len(checked),
            "invalid": invalid}
```

### Key lines

1. `times` counts how often each index appears. One pass over the bins fills it.
2. The type test rejects anything that is not an `int`, and also `bool`, because `True` is an `int` in Python.
3. `load += items[i]` adds the real size from the instance. The packer cannot report a false load.
4. The function collects every reason and does not stop at the first one.
5. `checked_score` returns `math.inf` for an invalid packing. The mean of a list with `math.inf` is `math.inf`.
6. `evaluate_packer` adds `bool(reasons)`, which is 1 for an invalid packing, to the count.

### Output of our run

All 19 checks of the lab pass with this code.

The experiment cell ("mixed big-small", drop limit 70, fake capacity 110):

```text
first fit naive   12.43 %   checked   12.43 %   invalid  0/20
best fit  naive   11.60 %   checked   11.60 %   invalid  0/20
drop big  naive  -34.27 %   checked     inf %   invalid 20/20
overfill  naive    2.60 %   checked     inf %   invalid 20/20

chosen by the naive score  : drop big
chosen by the checked score: best fit
```

## P4: Propose and test strategy changes

Project page: [P4: Propose and test strategy changes](/notes/ai/recursive-self-improvement/09-build-it/p4-propose-and-test-strategy-changes). Lab: [Lab: RSI P4 · Propose and test strategy changes](/labs/new?template=rsi-04-propose-and-test).

### Code

```python
# These functions replace the stubs. They run after the setup cells of the lab.
import numpy as np


def propose(w, step, rng):
    w = np.asarray(w, dtype=float)
    return w + step * rng.normal(size=w.shape)


def hill_climb(w0, select_set, iterations, step, seed):
    rng = np.random.default_rng(seed)
    best_w = np.asarray(w0, dtype=float).copy()
    best = mean_excess(select_set, make_priority(best_w))
    history = [best]
    for _ in range(iterations):
        cand = propose(best_w, step, rng)
        score = mean_excess(select_set, make_priority(cand))
        if score < best:                              # strict: a tie keeps the parent
            best_w, best = cand, score
        history.append(best)
    return best_w, best, history
```

### Key lines

1. `propose` returns `w + step * rng.normal(size=w.shape)`. The `+` makes a new array, so the parent does not change.
2. `hill_climb` makes one generator from the seed and one candidate per iteration. The test with a literal weight vector depends on this order.
3. `if score < best` is strict. A tie keeps the parent.
4. `history.append(best)` runs in every iteration, also after a rejection, so the history has `iterations + 1` entries.

### Output of our run

All 18 checks of the lab pass with this code.

The experiment cell ("weibull 45", 30 items, 8 training instances, 4 seeds):

```text
                         train  valid.    test   (mean excess, %)
first fit                 9.32    8.29    8.57
best fit                  9.32    8.02    7.96
A seed 0                  9.32    8.29    8.57
B seed 0                  9.32    8.02    7.96
A seed 1                  9.15   10.09   10.42
B seed 1                  9.32    8.02    7.96
A seed 2                  8.19    8.55    8.64
B seed 2                  9.32    8.02    7.96
A seed 3                  8.19    8.55    8.78
B seed 3                  9.32    8.02    7.96
mean A                    8.71    8.87    9.10
mean B                    9.32    8.02    7.96
```

## P5: An agent that edits a program

Project page: [P5: An agent that edits a program](/notes/ai/recursive-self-improvement/09-build-it/p5-an-agent-that-edits-a-program). Lab: [Lab: RSI P5 · An agent that edits a program](/labs/new?template=rsi-05-program-edits).

### Code

```python
# These functions replace the stubs. They run after the setup cells of the lab.
import ast
import math
import numpy as np


def check_program(src, max_size=None):
    try:
        tree = ast.parse(src, mode="eval")
    except SyntaxError:
        return "syntax error"
    for node in ast.walk(tree):
        if not isinstance(node, ALLOWED_NODES):
            return f"forbidden: {type(node).__name__}"
        if isinstance(node, ast.Call):
            if not (isinstance(node.func, ast.Name) and node.func.id in FUNCS) or node.keywords:
                return "forbidden: call"
        if isinstance(node, ast.Name) and node.id not in VARS + FUNCS:
            return f"forbidden: name {node.id}"
        if isinstance(node, ast.Constant):
            if isinstance(node.value, bool) or not isinstance(node.value, (int, float)):
                return "forbidden: constant"
    limit = MAX_SIZE if max_size is None else max_size
    if program_size(src) > limit:
        return "too large"
    return None


def swap_operator(src, rng):
    tree = ast.parse(src, mode="eval")
    binops = [n for n in ast.walk(tree) if isinstance(n, ast.BinOp)]
    if not binops:
        return src
    node = binops[rng.integers(len(binops))]
    others = [op for op in OPS if not isinstance(node.op, op)]
    node.op = others[rng.integers(len(others))]()
    return ast.unparse(tree)


def try_candidate(src, task_set, packer=None):
    packer = pack if packer is None else packer
    reason = check_program(src)
    if reason is not None:
        return None, reason
    fn = make_function(src)

    def guarded(item, space):
        value = fn(item, space)
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            raise NotFinite()
        return value

    scores = []
    try:
        for items in task_set:
            bins = packer(items, guarded)
            if validate(items, bins):
                return None, "invalid packing"
            scores.append(excess(items, bins))
    except NotFinite:
        return None, "not finite"
    except Exception as exc:  # noqa: BLE001 - any crash of the candidate is a rejection
        return None, f"runtime error: {type(exc).__name__}"
    return sum(scores) / len(scores), "ok"


def edit_loop(seed_src, task_set, iterations, seed):
    rng = np.random.default_rng(seed)
    best_src = seed_src
    best_score, _ = try_candidate(seed_src, task_set)
    tried = {seed_src}
    log = []
    for t in range(iterations):
        edit, cand = mutate(best_src, rng)
        if cand == best_src:
            outcome = "no change"
        elif cand in tried:
            outcome = "already tried"
        else:
            tried.add(cand)
            score, reason = try_candidate(cand, task_set)
            if reason != "ok":
                outcome = reason.split(":")[0]
            elif score < best_score:
                best_src, best_score, outcome = cand, score, "accepted"
            else:
                outcome = "not better"
        log.append({"iteration": t, "edit": edit, "candidate": cand, "outcome": outcome})
    return best_src, best_score, log
```

### Key lines

1. `check_program` tests in a fixed order: parse, then each node type, then calls, names and constants, and the size last. Text such as `__import__('os')` never reaches `make_function`.
2. `max_size=None` reads the global `MAX_SIZE` at call time, so the experiment can change the limit.
3. `swap_operator` lists the three other operator classes and makes a new instance of one of them.
4. In `try_candidate`, the wrapper `guarded` raises `NotFinite` for a value that is not a finite number. One `try` block covers the whole task set, and `NotFinite` is caught before the general `Exception`.
5. `edit_loop` decides the outcome first and logs one entry per iteration. `reason.split(":")[0]` turns `runtime error: ZeroDivisionError` into the outcome `runtime error`.

### Output of our run

All 35 checks of the lab pass with this code.

The experiment cell (seed program `gap`, 300 iterations, size limit 15, seed 0):

```text
outcomes: {'already tried': 115, 'not better': 96, 'no change': 85, 'accepted': 2, 'runtime error': 2}

accepted changes:
  iteration   1  variable  -> item
  iteration  55  grow      -> item - space
validation: program 12.61 %   first fit 13.85 %   best fit 12.61 %
test      : program 11.83 %   first fit 13.08 %   best fit 11.83 %
```

## P6: An acceptance rule with a validation suite

Project page: [P6: An acceptance rule with a validation suite](/notes/ai/recursive-self-improvement/09-build-it/p6-a-validation-gate). Lab: [Lab: RSI P6 · An acceptance rule with a validation suite](/labs/new?template=rsi-06-validation-gate).

### Code

```python
# These functions replace the stubs. They run after the setup cells of the lab.
import math
import numpy as np


def paired_gain(parent_scores, child_scores):
    d = np.asarray(parent_scores, dtype=float) - np.asarray(child_scores, dtype=float)
    n = len(d)
    mean = float(d.mean())
    if n < 2:
        return mean, math.inf
    se = float(d.std(ddof=1) / math.sqrt(n))
    return mean, se


def decide(src, parent_scores, child_scores, rule="2se", max_size=None):
    limit = MAX_SIZE if max_size is None else max_size
    failed = run_tests(src)
    if failed:
        return False, "tests failed: " + ", ".join(failed)
    size = program_size(src)
    if size > limit:
        return False, f"too large: size {size} > {limit}"
    if child_scores is None:
        return False, "evaluation failed"
    gain, se = paired_gain(parent_scores, child_scores)
    if rule == "naive":
        if gain > 0:
            return True, f"accepted: gain {gain:+.4f} > 0"
        return False, f"rejected: gain {gain:+.4f} <= 0"
    if gain > 2 * se:
        return True, f"accepted: gain {gain:+.4f} > 2 SE {2 * se:.4f}"
    return False, f"rejected: gain {gain:+.4f} <= 2 SE {2 * se:.4f}"


def improvement_loop(seed_src, val_set, iterations, rule, eps, seed):
    rng = np.random.default_rng(seed)
    best = seed_src
    tried = {seed_src}
    log = []
    for t in range(iterations):
        edit, cand = mutate(best, rng)
        entry = {"iteration": t, "parent": best, "candidate": cand, "accepted": False,
                 "reason": "", "gain": None, "se": None}
        if cand == best or cand in tried:
            entry["reason"] = "skipped: no change or already tried"
            log.append(entry)
            continue
        tried.add(cand)
        child_scores = parent_scores = None
        if not run_tests(cand) and program_size(cand) <= MAX_SIZE:
            try:
                child_scores = evaluate(cand, val_set, eps, [seed, t, 0])
                parent_scores = evaluate(best, val_set, eps, [seed, t, 1])
            except Exception:  # noqa: BLE001
                child_scores = None
        accepted, reason = decide(cand, parent_scores, child_scores, rule)
        if child_scores is not None:
            entry["gain"], entry["se"] = paired_gain(parent_scores, child_scores)
        entry["accepted"], entry["reason"] = accepted, reason
        if accepted:
            best = cand
        log.append(entry)
    return best, log
```

### Key lines

1. `paired_gain` uses `d.std(ddof=1)`, the sample standard deviation. With fewer than 2 values the standard error (SE) is `math.inf`.
2. `decide` returns at the first rule that rejects: tests, size, evaluation, gain. Every reason carries its numbers.
3. `improvement_loop` evaluates the child with the seed `[seed, t, 0]` and the parent **again** with `[seed, t, 1]`, on the same validation instances.
4. A candidate that fails the tests or the size limit is not evaluated. `decide` still gives the reason for the log.

### Output of our run

All 26 checks of the lab pass with this code.

The noise demo:

```text
first fit: mean 13.87 %, standard deviation 0.19
best fit : mean 12.80 %, standard deviation 0.25
```

The experiment cell ("mixed big-small", eps 0.1, 20 validation instances of 60 items, 200 iterations, seed 0):

```text
--- rule naive: 46 accepted, 3 held on the test set
    reasons: {'rejected': 99, 'accepted': 46, 'skipped': 39, 'too large': 11, 'tests failed': 5}
    final program (size 13): min(42.1, item) / max(item * space, 6) / 16.0
    final test score 11.97 %
--- rule 2se: 2 accepted, 2 held on the test set
    reasons: {'skipped': 126, 'rejected': 70, 'accepted': 2, 'tests failed': 2}
    final program (size 3): item - space
    final test score 11.97 %
```

## P7: Regression tests and an archive

Project page: [P7: Regression tests and an archive](/notes/ai/recursive-self-improvement/09-build-it/p7-regression-tests-and-an-archive). Lab: [Lab: RSI P7 · Regression tests and an archive](/labs/new?template=rsi-07-regression-archive).

### Code

```python
# These functions replace the stubs. They run after the setup cells of the lab.
import math
import numpy as np


def regression_check(parent_res, child_res, tol=0.005, max_breaks=0):
    breaks = 0
    for fam in parent_res:
        p_solved, c_solved = parent_res[fam][1], child_res[fam][1]
        breaks += int(np.sum(p_solved & ~c_solved))        # solved before, not solved now
    if breaks > max_breaks:
        return f"breaks {breaks} solved"
    for fam in parent_res:
        delta = float(child_res[fam][0].mean() - parent_res[fam][0].mean())
        if delta > tol:
            return f"worse on {fam}: {delta:+.4f}"
    return None


def selection_probs(archive):
    weights = []
    for member in archive:
        s = 1 / (1 + math.exp(-10 * (member["alpha"] - 0.5)))   # sigmoid of the score
        h = 1 / (1 + member["children"])                         # bonus for few children
        weights.append(s * h)
    total = sum(weights)
    return [w / total for w in weights]


def archive_search(seed_src, budget, seed, mode="archive", tol=0.005, max_breaks=0):
    rng = np.random.default_rng(seed)
    res = evaluate_families(seed_src, VAL_SETS)
    archive = [{"src": seed_src, "res": res, "alpha": solve_rate(res), "children": 0, "parent": None}]
    tried = {seed_src}
    log = []
    for t in range(budget):
        if mode == "archive":
            pi = int(rng.choice(len(archive), p=selection_probs(archive)))
        else:
            pi = max(range(len(archive)), key=lambda i: archive[i]["alpha"])
        parent = archive[pi]
        _, cand = mutate(parent["src"], rng)
        outcome = None
        if cand in tried:
            outcome = "skipped"
        else:
            tried.add(cand)
            if run_tests(cand):
                outcome = "tests failed"
            elif program_size(cand) > MAX_SIZE:
                outcome = "too large"
            else:
                try:
                    child_res = evaluate_families(cand, VAL_SETS)
                except Exception as exc:  # noqa: BLE001 - the small test suite cannot cover every input
                    outcome = f"runtime error: {type(exc).__name__}"
        if outcome is None:
            alpha = solve_rate(child_res)
            reason = regression_check(parent["res"], child_res, tol, max_breaks)
            if reason is not None:
                outcome = reason
            elif mode == "greedy" and alpha <= parent["alpha"]:
                outcome = "not better"
            else:
                archive.append({"src": cand, "res": child_res, "alpha": alpha, "children": 0, "parent": pi})
                parent["children"] += 1
                outcome = "added"
        log.append({"attempt": t, "parent": pi, "candidate": cand, "outcome": outcome})
    return archive, log
```

### Key lines

1. `regression_check` counts `p_solved & ~c_solved`: instances that the parent solved and the child does not.
2. `selection_probs` computes `1 / (1 + math.exp(-10 * (alpha - 0.5)))` times `1 / (1 + children)` for every member, then divides by the sum of all weights.
3. `archive_search` chooses the parent with `rng.choice(..., p=selection_probs(archive))` in archive mode, and with the highest `alpha` in greedy mode.
4. `evaluate_families` is inside a `try` block, because the small test suite cannot cover every input.
5. Only an added child raises its parent's `children` count. A rejected attempt does not count, as in the code of the Darwin Gödel Machine (DGM).

### Output of our run

All 23 checks of the lab pass with this code.

The setup cell:

```text
worst fit  alpha = 0.283   mean excess per family: {'uniform 20-100': 17.9, 'mixed big-small': 19.8, 'weibull 45': 13.02}
first fit  alpha = 0.483   mean excess per family: {'uniform 20-100': 17.06, 'mixed big-small': 16.27, 'weibull 45': 9.41}
best fit   alpha = 0.517   mean excess per family: {'uniform 20-100': 16.68, 'mixed big-small': 15.22, 'weibull 45': 9.41}
```

The experiment cell (budget 60, 10 seeds, max_breaks 2, tol 0.005):

```text
archive  best validation alpha 0.517   its test alpha 0.552   archive size  38.2   (mean of 10 seeds)
         outcomes: {'added': 372, 'skipped': 133, 'breaks solved': 77, 'tests failed': 10, 'worse on a family': 6, 'runtime error': 1}
greedy   best validation alpha 0.507   its test alpha 0.524   archive size   2.9   (mean of 10 seeds)
         outcomes: {'not better': 277, 'skipped': 217, 'breaks solved': 45, 'worse on a family': 39, 'added': 19, 'tests failed': 3}
reference first fit test alpha 0.450
reference best fit  test alpha 0.556
```

## P8: Improving the improver

Project page: [P8: Improving the improver](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver). Lab: [Lab: RSI P8 · Improving the improver](/labs/new?template=rsi-08-improve-the-improver).

### Code

```python
# These functions replace the stubs. They run after the setup cells of the lab.
import numpy as np


def improve(solution, utility, mutate_fn, settings, budget, rng):
    best, best_u = solution, utility(solution)
    k = int(settings["k"])
    used = 0
    while used + k <= budget:                          # a batch must fit in the budget
        cands = [mutate_fn(best, settings, rng) for _ in range(k)]
        used += k
        scores = [utility(c) for c in cands]
        j = int(np.argmax(scores))                     # the first best on a tie
        if scores[j] > best_u:                         # strict: keep the parent on a tie
            best, best_u = cands[j], scores[j]
    return best, best_u


def meta_utility(settings, families, budget=6, seeds=range(8)):
    gains = []
    for fam in families:
        k = FAMILIES.index(fam)
        start = program_score(SEED_PROGRAM, fam, "validation")

        def utility(src, fam=fam):
            return -program_score(src, fam, "train")

        for s in seeds:
            rng = np.random.default_rng([s, k])
            best, _ = improve(SEED_PROGRAM, utility, mutate_program, settings, budget, rng)
            gains.append(start - program_score(best, fam, "validation"))
    return float(np.mean(gains))


def self_improve(theta0, rounds, meta_budget, seed):
    rng = np.random.default_rng(seed)

    def u_train(theta):
        return meta_utility(theta, TRAIN_FAMILIES)

    theta = dict(theta0)
    history = [(theta, u_train(theta))]
    for _ in range(rounds):
        theta, u = improve(theta, u_train, mutate_settings, theta, meta_budget, rng)   # the improver improves itself
        history.append((theta, u))
    return history
```

### Key lines

1. `improve` reads `k` once. The loop condition `used + k <= budget` counts every proposal, useful or not.
2. `np.argmax` returns the first best candidate, and `scores[j] > best_u` is strict.
3. In `meta_utility`, `utility(src, fam=fam)` binds the family as a default argument. A plain lambda inside the loop would see only the last family.
4. Each run uses `np.random.default_rng([s, k])`, so every setting is scored on the same random streams.
5. `self_improve` passes `theta` as the fourth argument of `improve`. The settings that are being improved also drive the search. With `DEFAULT_SETTINGS` there, it would be a fixed meta-improver.

### Output of our run

All 19 checks of the lab pass with this code.

The meta-optimization cell (meta-budget 12, meta-seed 2):

```text
                    train (seen)  train (fresh)  held-out   (mean gain in percentage points)
default settings            1.75           1.54      1.44
tuned settings              2.67           2.15      1.73
ceiling                     4.44           4.44      2.74
tuned settings: {'constant': 1.0, 'operator': 1.0, 'variable': 2.46, 'grow': 1.0, 'k': 3, 'step': 5.0}
```

The self-improvement cell (5 rounds, meta-budget 12, seed 0):

```text
round  train (seen)    gain  train (fresh)  held-out   settings
    0          1.75                   1.54      1.44   {constant: 1.00, operator: 1.00, variable: 1.00, grow: 1.00, k: 4.00, step: 5.00}
    1          2.22   +0.47           2.17      1.44   {constant: 0.77, operator: 1.00, variable: 1.00, grow: 1.00, k: 4.00, step: 5.00}
    2          2.43   +0.21           1.86      1.73   {constant: 0.55, operator: 1.00, variable: 1.00, grow: 1.11, k: 3.00, step: 5.00}
    3          2.91   +0.48           2.16      1.73   {constant: 0.55, operator: 1.00, variable: 1.48, grow: 1.11, k: 3.00, step: 5.00}
    4          2.91   +0.00           2.16      1.73   {constant: 0.55, operator: 1.00, variable: 1.48, grow: 1.11, k: 3.00, step: 5.00}
    5          2.91   +0.00           2.16      1.73   {constant: 0.55, operator: 1.00, variable: 1.48, grow: 1.11, k: 3.00, step: 5.00}
```

## Check questions

```check
{
  "question": "Your pack function passes every test of P1, but your experiment numbers differ from the numbers on this page. Name two places where your code may differ without being wrong, and one place where it would be wrong.",
  "hint": "Which parts of the specification fix the result exactly, and which parts only fix the behaviour?",
  "answer": "Not wrong: a different data layout, for example a list of bin objects instead of two lists. Not wrong either: a while loop instead of a for loop. Both give the same packings. Wrong: a tie rule that does not pick the lowest index, or a fit test with > instead of >=. Those change the packings, and the tests catch them. If all tests pass and the numbers differ, check the seeds in make_splits first."
}
```

```check
{
  "question": "In the P8 solution, meta_utility defines utility(src, fam=fam). Why not a plain lambda that uses fam directly inside the loop?",
  "hint": "When does a function that is defined inside a loop read the loop variable?",
  "answer": "A Python closure reads the loop variable when the function runs, not when it is defined. Here improve runs inside the same iteration, so a plain lambda would also work. But the default argument fam=fam binds the value at definition time. The function then stays correct even if it is stored and called later, after the loop has moved to the next family."
}
```

```check
{
  "question": "The P6 solution evaluates the parent again in every iteration. Estimate the extra cost in the default experiment, and say what would go wrong without it.",
  "hint": "The 2 SE run had 200 iterations. Count the iterations that reached an evaluation.",
  "answer": "In the 2 SE run, 126 iterations were skipped and 2 failed the tests, so 72 iterations evaluated a child. Each of these also evaluated the parent, so the parent evaluations doubled the evaluation cost: 144 runs of the validation set instead of 72. Without them, the child would be compared with the parent's old, lucky score, so real gains would be rejected more often."
}
```

## Summary and links

- The solutions follow the specifications in the labs exactly, including the order of random draws and the tie rules.
- The printed outputs are the reference for the expected output sections of the project pages.
- Come back to a solution after you finish a project, and compare the design choices, not only the numbers.

**Previous:** [P9: From the toy to a language-model version](/notes/ai/recursive-self-improvement/09-build-it/p9-from-toy-to-language-model)

**Related:** [P1: A fixed agent with a score](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score), [L5: Advanced exercises](/notes/ai/recursive-self-improvement/10-advanced/l5-advanced-exercises)
