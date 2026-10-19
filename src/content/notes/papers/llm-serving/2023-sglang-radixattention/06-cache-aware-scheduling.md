---
title: "06 Cache-aware scheduling and the DFS theorem"
order: 6
summary: "Why the order of waiting requests decides the hit rate when the KV pool is small, Algorithm 1 line by line with its two printed gaps, depth-first search from zero, Theorem 3.1 with its proof and a brute-force check, the online case, starvation, and what the SGLang 0.5.22 scheduler does today."
status: not-started
tags: [radixattention, sglang, scheduling, dfs, kv-cache, hit-rate, radix-tree]
---

## 1. The question this page answers

Pages [04](/notes/papers/llm-serving/2023-sglang-radixattention/04-radixattention-the-tree-of-kv-caches) and [05](/notes/papers/llm-serving/2023-sglang-radixattention/05-eviction-and-reference-counts) built the radix tree and its eviction. They took the requests in arrival order. But a server keeps a waiting queue, and it can choose which request runs next. When the KV pool is small, that choice decides which prefixes are still cached when a request runs.

The paper's answer is one sentence: the scheduler prioritizes "requests with longer matched prefixes instead of using a first-come, first-served schedule". It calls the order longest-shared-prefix-first, and SGLang calls the policy `lpm`. This page answers the follow-up questions:

1. What exactly is the hit rate?
2. Why does the order change the hit rate, and by how much?
3. What does Algorithm 1 do, line by line, and where is the printed version incomplete?
4. What is depth-first search, and what does Theorem 3.1 prove?
5. Why is the online case only an approximation, and what is starvation?
6. What does SGLang 0.5.22 do today, and why is its default `fcfs`?

## 2. Mental model

> [!analogy] A cook with room for one pot of base sauce
> A cook gets orders for dishes on two base sauces, P and Q. The stove holds one pot of base sauce at a time. The orders arrive as P, Q, P, Q, P, Q. In strict arrival order, every dish needs a fresh pot, because the other sauce replaced the last one. If the cook first makes all P dishes and then all Q dishes, each base is cooked once. The food is the same. Only the order changed.
>
> **Where it stops working:** new orders keep arriving while the cook works, so no grouping is ever final. A guest who ordered a rare sauce can wait forever while P and Q orders keep coming. And the cook knows how long each dish takes, but a server does not know how many tokens each answer will have.

## 3. Terms

| Term | Plain meaning |
|---|---|
| hit rate | Cached prompt tokens divided by all prompt tokens, as the paper defines it. |
| matched prefix length | The number of leading prompt tokens of a request that the radix tree already holds. |
| waiting queue | The requests that arrived but do not run yet. |
| running batch | The requests that the GPU processes in the current step. |
| FCFS | First come, first served: run the requests in arrival order. |
| longest-shared-prefix-first | Run the request with the longest matched prefix first. SGLang's name: `lpm`, longest prefix match. |
| continuous batching | New requests join the running batch at any step, and finished ones leave it ([L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)). |
| Algorithm 1 | The paper's scheduling loop with matching, sorting, admission, locking and eviction (Appendix A.2). |
| request tree | The radix tree of the prompts of one batch of requests. |
| edge sum | The total number of tokens on all edges of the request tree. No order can compute fewer prompt tokens. |
| DFS | Depth-first search: visit a tree by going as deep as possible before you return to an earlier node. |
| DFS order | An order of requests in which the requests below every node of the request tree form one contiguous block. |
| online scheduling | Scheduling while new requests keep arriving, so the request tree keeps growing. |
| starvation | A request waits without limit, because the policy always prefers other requests. |
| aging | A rule that raises a request's priority the longer it waits. |
| HRRN | Highest response ratio next: a policy with aging. SGLang 0.5.22 has a cache-aware version. |
| in-batch prefix caching | SGLang's rule that delays waiting requests whose new prefix another waiting request will compute first. |
| `dfs-weight` | SGLang's policy that orders the waiting queue by a depth-first walk of the cache tree, heaviest subtree first. |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. The hit rate

The paper defines the cache hit rate as "number of cached prompt tokens / number of prompt tokens". With $p_r$ the prompt length of request $r$ and $m_r$ its matched prefix length:

$$
h = \frac{\sum_r m_r}{\sum_r p_r}, \qquad \text{prefill tokens computed} = \sum_r (p_r - m_r) = (1 - h) \sum_r p_r
$$

Only prompt tokens count. Output tokens are always produced by decoding, one step each, whatever the cache holds. So the hit rate measures one thing: the share of prompt tokens whose prefill is skipped.

> [!example] Worked example: the hit rate of the nine steps
> The running example of page 04 (pool of 80 slots, sizes chosen by these notes) gives, per step, matched over prompt tokens:
>
> | Step | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9a | 9b |
> |---|---|---|---|---|---|---|---|---|---|
> | Matched / prompt | 0/12 | 16/20 | 8/12 | 16/20 | 0/16 | 24/32 | 16/49 | 12/15 | 60/60 |
>
> 1. Matched: $0 + 16 + 8 + 16 + 0 + 24 + 16 + 12 + 60 = 152$.
> 2. Prompt: $12 + 20 + 12 + 20 + 16 + 32 + 49 + 15 + 60 = 236$.
> 3. Hit rate: $152 / 236 \approx 0.644$, so about 64.4%.

> [!trap] The last prompt token always runs in SGLang 0.5.22
> The simulator of these notes lets each sample of step 9b match all 15 of its 15 prompt tokens. Real servers cannot do that, because the last prompt token must run to produce the logits of the first output token. SGLang 0.5.22 caps the match in `_compute_max_prefix_len` (`managers/schedule_batch.py`), with the comment "the matched length is at most 1 less than the input length to enable logprob computation". With that cap, step 9b matches $4 \times 14 = 56$ of 60, and the total becomes $148/236 \approx 62.7\%$. vLLM has the same rule ([L9 section 5.5](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)).

## 5. Why the order changes the hit rate

### 5.1 The example

The sizes are choices of these notes. Two prefixes P and Q have 100 tokens each, for example two long system prompts. Six requests wait in the arrival order P1, Q1, P2, Q2, P3, Q3. Each request is its prefix plus 10 new prompt tokens, and each one generates 10 tokens. The KV pool has 150 slots. The server runs one request at a time.

The pool can hold one prefix with some tails, but never both prefixes: $2 \times 100 = 200 > 150$. The longest request needs $110 + 10 = 120$ slots, so every request fits alone.

> [!example] Worked example: FCFS against longest-shared-prefix-first
> **FCFS**
> 1. P1: nothing cached. It computes 110 prompt tokens and stores 120 tokens as one node. Free: $150 - 120 = 30$.
> 2. Q1: matches 0 and needs 120 slots. Free is 30, so eviction removes the only leaf, P1 (120). Q1 stores 120 tokens.
> 3. P2: P is gone. It matches 0 and evicts Q1. The same happens for Q2, P3 and Q3.
> 4. Hit rate: $0 / 660 = 0\%$.
>
> **Longest-shared-prefix-first** (re-sorted before every pick, ties in arrival order)
> 1. P1 runs first: all requests match 0, and P1 arrived first. Free: 30.
> 2. P2 matches 100 and goes next. It needs $10 + 10 = 20$ slots. Free: $30 - 20 = 10$.
> 3. P3 matches 100. It needs 20, so eviction removes the oldest leaf, the 20-token tail of P1.
> 4. Q1 matches 0. It needs 120: eviction removes the tails of P2 and P3 (20 each) and then P (100). Free: $10 + 140 = 150$.
> 5. Q2 and Q3 match 100 each, and Q3 evicts the tail of Q1.
> 6. Hit rate: $4 \times 100 / 660 = 400/660 \approx 60.6\%$.

### 5.2 The best possible

Every prefix must be computed at least once, and every new 10-token part too. So at least $100 + 100 + 6 \times 10 = 260$ prompt tokens are computed, and at most $660 - 260 = 400$ can hit. Longest-shared-prefix-first reaches this bound with 150 slots. FCFS reaches it only with a bigger pool:

| Pool slots | FCFS hit rate | Longest-shared-prefix-first hit rate |
|---|---|---|
| 150 | 0/660 = 0% | 400/660 $\approx$ 60.6% |
| 239 | 0/660 = 0% | 400/660 $\approx$ 60.6% |
| 240 | 400/660 $\approx$ 60.6% | 400/660 $\approx$ 60.6% |

With 240 slots, FCFS can keep P and Q with one tail each: $2 \times (100 + 20) = 240$.

> [!key] A good order replaces memory
> With the right order, a pool of 150 slots reaches the hit rate that FCFS needs 240 slots for. The order matters only when the pool is too small to keep everything that will be reused.

![Alt text: two timelines of six requests, with hit rate 0 for FCFS and 400 of 660 for longest-shared-prefix-first](/notes/media/papers/2023-sglang-radixattention/figures/06-fcfs-vs-lpm.svg)

```video
{
  "src": "/notes/media/papers/2023-sglang-radixattention/manim/r04-fcfs-vs-dfs-order.mp4",
  "caption": "Six requests on two prefixes with a 150-slot pool: in arrival order every prefix is evicted before its next use, while longest-shared-prefix-first computes each prefix once and reaches 400 hit tokens of 660."
}
```

### 5.3 A small simulator

The next class is a radix tree with reference counts, LRU leaf eviction and the split of page 04. It is written for these notes, and sections 6 and 8 use it again.

```python
class Node:
    def __init__(self, tokens=(), parent=None, t=0):
        self.tokens, self.parent, self.children = tuple(tokens), parent, {}
        self.ref, self.last = 0, t              # reference count, last access time

class Tree:                                     # the radix tree T
    def __init__(self):
        self.root = Node()
        self.root.ref = 1                       # the root is never evicted

    def nodes(self, x=None):                    # every node except the root
        for c in list((x or self.root).children.values()):
            yield c
            yield from self.nodes(c)

    def match_prefix(self, seq, t):             # returns (last node, matched length)
        x, i = self.root, 0
        while i < len(seq) and seq[i] in x.children:
            c = x.children[seq[i]]
            n = 0
            while n < len(c.tokens) and i + n < len(seq) and c.tokens[n] == seq[i + n]:
                n += 1
            if n < len(c.tokens):               # the match ends inside an edge: split it
                mid = Node(c.tokens[:n], x, t)
                mid.ref, x.children[seq[i]] = c.ref, mid
                c.tokens, c.parent = c.tokens[n:], mid
                mid.children[c.tokens[0]] = c
                return mid, i + n
            c.last = t
            x, i = c, i + n
        return x, i

    def insert(self, seq, t):
        x, i = self.match_prefix(seq, t)
        if i < len(seq):
            x.children[seq[i]] = Node(seq[i:], x, t)

    def size(self, only_free=False):            # cached tokens (or reference count 0 only)
        return sum(len(x.tokens) for x in self.nodes() if not only_free or x.ref == 0)

    def change_ref(self, x, d):                 # d = +1 or -1 on the path to the root
        delta = 0
        while x is not self.root:
            if (d > 0 and x.ref == 0) or (d < 0 and x.ref == 1):
                delta -= d * len(x.tokens)      # change of the evictable size
            x.ref += d
            x = x.parent
        return delta

    def evict(self, num_tokens):                # least recently used leaf first
        freed = 0
        while freed < num_tokens:
            leaves = [x for x in self.nodes() if not x.children and x.ref == 0]
            if not leaves:
                break
            x = min(leaves, key=lambda n: n.last)
            del x.parent.children[x.tokens[0]]
            freed += len(x.tokens)
        return freed
```

The next functions run requests one at a time with FCFS or longest-shared-prefix-first, on a pool of `capacity` slots:

```python
def toks(p, n):                                          # n distinct token names
    return tuple(f"{p}{i}" for i in range(n))

def serve(requests, capacity, policy):
    """Run requests one at a time. requests: list of (name, prompt, output)."""
    T, free = Tree(), capacity
    waiting, hit, total, log = list(requests), 0, 0, []
    for t in range(1, len(requests) + 1):
        if policy == "lpm":                              # longest matched prefix first
            waiting.sort(key=lambda r: -T.match_prefix(r[1], t)[1])
        name, prompt, out = waiting.pop(0)
        node, m = T.match_prefix(prompt, t)
        T.change_ref(node, +1)                           # lock the matched path
        need = len(prompt) - m + len(out)                # new prompt tokens + output
        if need > free:
            free += T.evict(need - free)                 # LRU leaves, reference count 0
        assert need <= free, "the pool is too small for this request"
        free -= need
        before = T.size()                                # the request finishes:
        T.insert(prompt + out, t)                        # its tokens enter the tree
        free += need - (T.size() - before)               # free duplicates, if any
        T.change_ref(node, -1)
        hit, total = hit + m, total + len(prompt)
        log.append(f"{name}:{m}")
    return hit, total, log

P, Q = toks("p", 100), toks("q", 100)                    # two 100-token prefixes
reqs = []
for i in (1, 2, 3):                                      # arrival order P1 Q1 P2 Q2 P3 Q3
    reqs.append((f"P{i}", P + toks(f"p{i}_", 10), toks(f"po{i}_", 10)))
    reqs.append((f"Q{i}", Q + toks(f"q{i}_", 10), toks(f"qo{i}_", 10)))
for cap in (150, 240):
    for policy in ("fcfs", "lpm"):
        hit, total, log = serve(reqs, cap, policy)
        print(f"pool {cap} {policy:4s}: {' '.join(log)}  hit rate {hit}/{total} = {hit / total:.3f}")
```

Output:

```text
pool 150 fcfs: P1:0 Q1:0 P2:0 Q2:0 P3:0 Q3:0  hit rate 0/660 = 0.000
pool 150 lpm : P1:0 P2:100 P3:100 Q1:0 Q2:100 Q3:100  hit rate 400/660 = 0.606
pool 240 fcfs: P1:0 Q1:0 P2:100 Q2:100 P3:100 Q3:100  hit rate 400/660 = 0.606
pool 240 lpm : P1:0 P2:100 P3:100 Q1:0 Q2:100 Q3:100  hit rate 400/660 = 0.606
```

The important lines:

1. `match_prefix` walks the tree, splits a node when the match ends inside its edge, and refreshes the time of every node it walks. The new middle node keeps the reference count of the old node, as `_split_node` does in SGLang.
2. `change_ref(node, +1)` locks the whole path and returns the delta of the evictable size (page 05).
3. `evict` removes the least recently used leaf with reference count 0, again and again, until enough slots are free.
4. In `serve`, the `lpm` branch re-sorts the waiting queue before every pick. Python's sort is stable, so ties keep the arrival order.
5. `T.insert(prompt + out, t)` stores the prompt and the generated tokens. The log `P2:100` means that P2 matched 100 prompt tokens.

## 6. Algorithm 1, line by line

### 6.1 The algorithm as printed

Appendix A.2 gives Algorithm 1, "Cache-Aware Scheduling for RadixAttention with Continuous Batching". Its inputs are the radix tree $T$, the memory pool $P$, the running batch $B$ and the waiting queue $Q$. Its steps, in paraphrase:

1. `requests` = all requests of $Q$.
2. For each request: `req.prefix_node, req.prefix_len = T.match_prefix(req.input_tokens)`. In SGLang the match also splits nodes and refreshes their times.
3. Sort `requests` by `prefix_len`, longest first. Requests whose prefix is cached now run before that prefix can be evicted.
4. `available_size = T.evictable_size() + P.available_size()`, `current_size = 0`, `new_batch = []`. Eviction can turn every evictable slot into a free one ([page 05](/notes/papers/llm-serving/2023-sglang-radixattention/05-eviction-and-reference-counts)).
5. For each request in that order: if `req.size() + current_size < available_size`, append it to `new_batch`, compute `delta = T.increase_ref_counter(req.prefix_node)`, and set `available_size = available_size + delta`. The lock protects the reused prefix, and the negative delta removes it from the available memory.
6. `Q.remove_requests(new_batch)`, then `B.merge(new_batch)`. This is continuous batching: new requests join the requests that already decode.
7. `needed_size = B.needed_size()`, then `success, buffer = P.alloc(needed_size)`.
8. If not `success`: `T.evict(needed_size)`, then allocate again. Eviction is lazy: it runs only when an allocation fails.
9. `B.run(buffer)`: one forward step, prefill for new requests and decode for the others.
10. For each finished request: decrease its reference counter, insert it into $T$, and return it. Its prompt and output become cache for later requests.

![Alt text: a flow chart of Algorithm 1 from matching to admission, allocation, one run step and insert, with the two printed gaps marked](/notes/media/papers/2023-sglang-radixattention/figures/06-algorithm-1.svg)

### 6.2 The two printed gaps

Two details of the printed pseudocode look incomplete. Two independent reads of the paper agree on them:

1. **The loop never adds to `current_size`.** It starts at 0 and stays 0. So the test of line 5 compares each request alone with the available memory. A batch of many requests can then exceed the memory together.
2. **No branch handles a second failed allocation.** After `T.evict(needed_size)`, the algorithm allocates again and assumes success.

Interpretation of these notes: `current_size` should grow by `req.size()` inside the `if`, and the delta from locking is negative, because locked tokens stop being evictable. With the first fix, the second allocation cannot fail in this simple model, because the admitted batch fits into free plus evictable slots. The next program shows both versions.

### 6.3 Algorithm 1 in Python

The program runs after the classes of section 5.3. The KV pool has 64 slots. Before round 1, the tree holds two edges. One is a 16-token system prompt followed by an 8-token tail A. The other is an unrelated 20-token prompt X. Three requests wait in the order r1, r2, r3. The sizes are choices of these notes.

```python
def schedule(T, pool, Q, t, fixed=True):
    for r in Q:                                          # lines 1-2: match every request
        r["node"], r["prefix"] = T.match_prefix(r["prompt"], t)
    requests = sorted(Q, key=lambda r: -r["prefix"])     # line 3: longest prefix first
    available = T.size(only_free=True) + pool["free"]    # line 4
    current, batch = 0, []
    print(f"round {t}: order {[r['name'] for r in requests]}, available {available}")
    for r in requests:                                   # line 5
        size = len(r["prompt"]) - r["prefix"] + r["out"]
        if size + current < available:
            batch.append(r)
            delta = T.change_ref(r["node"], +1)          # lock the matched path
            available += delta
            if fixed:
                current += size                          # missing in the printed version
            print(f"  admit {r['name']}: size {size}, delta {delta}, "
                  f"available {available}, current {current}")
        else:
            print(f"  skip  {r['name']}: size {size} + current {current} >= {available}")
    Q[:] = [r for r in Q if r not in batch]              # line 6
    needed = sum(len(r["prompt"]) - r["prefix"] + r["out"] for r in batch)
    if needed > pool["free"]:                            # lines 7-8
        pool["free"] += T.evict(needed - pool["free"])
    print(f"  needed {needed}, free after eviction {pool['free']}")
    if needed > pool["free"]:
        raise MemoryError("second allocation failed: Algorithm 1 has no branch here")
    pool["free"] -= needed                               # line 9: run the batch
    for r in batch:                                      # line 10: finish, insert, unlock
        before = T.size()
        T.insert(r["prompt"] + r["gen"], t)
        pool["free"] += (len(r["prompt"]) - r["prefix"] + r["out"]) - (T.size() - before)
        T.change_ref(r["node"], -1)
    print(f"  cached {T.size()}, free {pool['free']}, waiting {[r['name'] for r in Q]}")

def setup():
    T = Tree()
    SYS, A, X = toks("sys", 16), toks("a", 8), toks("x", 20)
    T.insert(SYS + A, 0)                                 # cached before round 1: 44 tokens
    T.insert(X, 0)
    pool = {"free": 64 - T.size()}                       # KV pool of 64 slots
    mk = lambda name, prompt, out: {"name": name, "prompt": prompt,
                                    "out": out, "gen": toks(name + "o", out)}
    Q = [mk("r1", SYS + toks("q1", 6), 4),
         mk("r2", toks("y", 30), 4),
         mk("r3", SYS + A + toks("q3", 4), 4)]
    return T, pool, Q

T, pool, Q = setup()
schedule(T, pool, Q, 1)
schedule(T, pool, Q, 2)
print("--- the printed version: current_size never grows")
T, pool, Q = setup()
try:
    schedule(T, pool, Q, 1, fixed=False)
except MemoryError as e:
    print("  MemoryError:", e)
```

Output:

```text
round 1: order ['r3', 'r1', 'r2'], available 64
  admit r3: size 8, delta -24, available 40, current 8
  admit r1: size 10, delta 0, available 40, current 18
  skip  r2: size 34 + current 18 >= 40
  needed 18, free after eviction 20
  cached 62, free 2, waiting ['r2']
round 2: order ['r2'], available 64
  admit r2: size 34, delta 0, available 64, current 34
  needed 34, free after eviction 38
  cached 60, free 4, waiting []
--- the printed version: current_size never grows
round 1: order ['r3', 'r1', 'r2'], available 64
  admit r3: size 8, delta -24, available 40, current 0
  admit r1: size 10, delta 0, available 40, current 0
  admit r2: size 34, delta 0, available 40, current 0
  needed 52, free after eviction 40
  MemoryError: second allocation failed: Algorithm 1 has no branch here
```

What happens:

1. Matching: r1 matches the 16 system tokens, which splits the 24-token edge into SYS (16) and A (8). r3 matches $16 + 8 = 24$ tokens. r2 matches 0. The sort gives r3, r1, r2.
2. Available memory: $44$ evictable $+ 20$ free $= 64$.
3. r3 needs $(28 - 24) + 4 = 8$ slots: $8 + 0 < 64$, admit. Its lock covers SYS and A, so delta $= -(16 + 8) = -24$ and available becomes 40.
4. r1 needs $6 + 4 = 10$: $10 + 8 < 40$, admit. SYS is already locked, so delta is 0.
5. r2 needs $30 + 4 = 34$: $34 + 18 = 52$, not below 40, skip. It waits for round 2.
6. Round 1 needs 18 slots and 20 are free, so nothing is evicted. In round 2, r2 needs 34 with 2 free. Eviction frees X (20, time 0) and r3's new 8-token tail (time 1). Then A is a leaf with time 1, like r1's tail, and the tie removes A: 36 slots in total.
7. The printed version admits r2 too, because `current_size` stays 0. It then needs $8 + 10 + 34 = 52$ slots. Free 20 plus the only unlocked leaf X (20) gives 40. The second allocation fails, and the printed algorithm has no branch for it.

### 6.4 The same loop in SGLang 0.5.22

SGLang 0.5.22 does not keep a `current_size` variable. The class `PrefillAdder` (`managers/schedule_policy.py`) and a budget object (`mem_cache/prefill_budget.py`) do the same work:

| Algorithm 1 | SGLang 0.5.22 |
|---|---|
| `T.evictable_size() + P.available_size()` | `_available_and_evictable()`: `allocator.available_size()` plus `evictable_size()` |
| `current_size += req.size()` (the fix) | `PrefillBudget.reserve` adds each admitted request to `total_offset`, and `remaining_total` subtracts it |
| `available_size += delta` | `tree_cache.lock(req.last_node)` lowers `evictable_size()`, which the budget reads live |
| `req.size() + current_size < available_size` | `check_prefill`: `total_tokens < self.remaining_total` |
| `req.size()` | new prompt tokens + `min(max_new_tokens - generated, 4096)` + one page of reserve |
| loop over all requests | `for req in self.waiting_queue`, with a `break` at the first request that does not fit |

Two differences matter in an interview:

1. **Running requests reserve their future output.** For each running request the budget adds `min(max_new_tokens - generated, 4096) * new_token_ratio`. The ratio starts at `min(0.7 * schedule_conservativeness, 1.0)` and decays step by step (`scheduler_components/new_token_ratio_tracker.py`). The default conservativeness is 1.0, so the start is 0.7. This is the practical answer to the unknown output length of section 9.
2. **The loop stops at the first misfit.** Algorithm 1 tests every request. SGLang 0.5.22 stops admitting when one request does not fit, so later and smaller requests cannot overtake it in that round.

## 7. Depth-first search from zero

### 7.1 Two ways to visit a tree

A tree traversal visits every node once. Two orders are classic. Depth-first search (DFS) goes from a node to its first child, then to that child's first child, as deep as possible. Only when a subtree is finished does it return to the parent and take the next child. Breadth-first search (BFS) visits all nodes of depth 1, then all of depth 2, and so on.

```python
tree = {"root": ["A", "B"], "A": ["A1", "A2"], "B": ["B1"], "A1": [], "A2": [], "B1": []}

def dfs(node, out):
    out.append(node)                 # visit the node
    for child in tree[node]:         # then go deep into each child, one at a time
        dfs(child, out)
    return out

def bfs(start):
    out, frontier = [], [start]
    while frontier:                  # visit level by level
        node = frontier.pop(0)
        out.append(node)
        frontier.extend(tree[node])
    return out

print("DFS:", dfs("root", []))
print("BFS:", bfs("root"))
```

Output:

```text
DFS: ['root', 'A', 'A1', 'A2', 'B', 'B1']
BFS: ['root', 'A', 'B', 'A1', 'A2', 'B1']
```

DFS finishes the whole subtree of A (A, A1, A2) before it enters B. BFS visits A and B before any of their children. The recursive call in `dfs` is the whole idea: a child's subtree is completed before the loop moves to the next child.

### 7.2 A DFS order of requests

Each request of a batch is one path from the root to a leaf of the request tree. An order of the requests is a DFS order if, for every node, the requests below that node come as one contiguous block. Then the scheduler never leaves a subtree and returns to it later.

A test that needs no tree: take any three positions $a < b < c$ in the order. The common prefix of requests $a$ and $c$ must not be longer than that of $a$ and $b$, or that of $b$ and $c$. If $a$ and $c$ share a node, then $b$, which runs between them, must share it too. The function `is_dfs` in section 8.5 applies exactly this test.

## 8. Theorem 3.1

### 8.1 The statement

The paper states (§3): "For a batch of requests, we can achieve an optimal cache hit rate by visiting the radix tree of the requests in the depth-first search order, with a cache size ≥ the maximum request length." It adds: "The longest-shared-prefix-first order is equivalent to a depth-first search order."

The proof is in Appendix A.3. The next steps follow it in paraphrase. Let $R$ be the requests of the batch and $T$ their radix tree. $|e|$ is the KV size of edge $e$ in tokens, and $C$ is the number of prompt tokens computed.

### 8.2 Step 1: the lower bound

Every edge of $T$ belongs to at least one request, and the cache starts without it. So every edge must be computed at least once, whatever the order:

$$
C \ge \sum_{e \in T} |e|
\qquad\Longrightarrow\qquad
h \le 1 - \frac{\sum_{e \in T} |e|}{\sum_{r \in R} p_r}
$$

In the example of section 5, the edges are P (100), Q (100) and six tails of 10 tokens: $\sum_e |e| = 260$, so $h \le 1 - 260/660 = 400/660$.

### 8.3 Step 2: DFS meets the bound

Follow DFS. The first time the scheduler computes an edge $e$, DFS processes the whole subtree below $e$ next, before anything else. Every request in that subtree contains $e$, so each of them hits $e$. After the subtree, no later request contains $e$, so $e$ is never needed again.

The cache size enters here. If the cache holds at least the longest root-to-leaf path, the current path always fits. Edge $e$ lies on the current path while its subtree runs, so it is never evicted during that time. Then every edge is computed exactly once, $C = \sum_e |e|$, and the hit rate meets the bound of step 1.

### 8.4 Step 3: longest-shared-prefix-first is DFS

By induction over the scheduled requests. Assume the requests so far followed a DFS order. The cache then holds the path of the last request. The next request with the longest matched prefix shares the longest prefix with that cached path. It lies in the deepest subtree that still has unvisited requests, and that is exactly the next step of a DFS.

### 8.5 A brute-force check

Take four requests. S (20 tokens), T (10) and U (15) are shared parts, and a, b, c, d are 2-token tails:

- r1 = S + T + a (32 tokens) and r3 = S + T + c (32 tokens).
- r4 = S + d (22 tokens) and r2 = U + b (17 tokens).

The prompts have $32 + 17 + 32 + 22 = 103$ tokens. The request tree has the edges S (20), T (10), a, c, d (2 each) and U + b (17), so $\sum_e |e| = 53$. The best possible hit rate is $(103 - 53)/103 = 50/103 \approx 48.5\%$. The program tries all $4! = 24$ orders, one request at a time, with the classes of section 5.3:

```python
import itertools

def lcp(a, b):                                           # length of the common prefix
    return next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))

def is_dfs(seqs):                                        # every subtree is one block
    k = len(seqs)
    return all(lcp(seqs[a], seqs[c]) <= min(lcp(seqs[a], seqs[b]), lcp(seqs[b], seqs[c]))
               for a in range(k) for b in range(a + 1, k) for c in range(b + 1, k))

def edge_sum(seqs):                                      # tokens of the batch's radix tree
    return len({s[:i] for s in seqs for i in range(1, len(s) + 1)})

def computed_separate(seqs, M):                          # the cache keeps finished KV only
    T, comp = Tree(), 0
    for t, s in enumerate(seqs, 1):
        node, m = T.match_prefix(s, t)
        comp += len(s) - m
        T.insert(s, t)
        if T.size() > M:
            T.evict(T.size() - M)
    return comp

S, T_, U = toks("s", 20), toks("t", 10), toks("u", 15)
batch = {"r1": S + T_ + toks("a", 2), "r2": U + toks("b", 2),
         "r3": S + T_ + toks("c", 2), "r4": S + toks("d", 2)}
total = sum(len(s) for s in batch.values())
print("prompt tokens", total, "| edge sum (lower bound)", edge_sum(list(batch.values())))
for label, M, separate in [("pool 32", 32, False), ("pool 40", 40, False), ("cache 31", 31, True)]:
    results = []
    for order in itertools.permutations(batch):
        seqs = [batch[n] for n in order]
        if separate:
            comp = computed_separate(seqs, M)
        else:
            hit, _, _ = serve([(n, batch[n], ()) for n in order], M, "fcfs")
            comp = total - hit
        results.append((comp, is_dfs(seqs)))
    best = min(c for c, _ in results)
    print(f"{label}: best {best}, worst {max(c for c, _ in results)}, "
          f"orders at best {sum(c == best for c, _ in results)} "
          f"(DFS {sum(c == best and d for c, d in results)}), "
          f"DFS orders compute {sorted({c for c, d in results if d})}")
hit, _, log = serve([(n, batch[n], ()) for n in batch], 32, "lpm")
print("LPM picks", " ".join(log), "-> computed", total - hit)
```

Output:

```text
prompt tokens 103 | edge sum (lower bound) 53
pool 32: best 53, worst 83, orders at best 8 (DFS 8), DFS orders compute [53]
pool 40: best 53, worst 83, orders at best 14 (DFS 8), DFS orders compute [53]
cache 31: best 63, worst 103, orders at best 4 (DFS 4), DFS orders compute [63, 103]
LPM picks r1:0 r3:30 r4:20 r2:0 -> computed 53
```

![Alt text: the request tree of r1 to r4 with the DFS visit order numbered, beside the computed tokens of all 24 orders](/notes/media/papers/2023-sglang-radixattention/figures/06-dfs-order.svg)

What the output shows:

1. **Pool 32, exactly the longest request.** The best order computes 53 tokens, the bound. Exactly 8 orders reach it, and all 8 are DFS orders. The worst order computes 83.
2. **Pool 40.** The 8 DFS orders still compute 53, and 6 orders that are not DFS orders reach 53 too. The theorem says DFS is sufficient, not that it is the only optimal order.
3. **Longest-shared-prefix-first** picks r1, r3, r4, r2. It matches 0, 30, 20 and 0 tokens, a DFS order, and computes 53. FCFS (r1, r2, r3, r4) computes 83, a hit rate of $20/103 \approx 19.4\%$.
4. **Cache 31, below the longest request.** In the shared pool, a 32-token request cannot run in 31 slots at all. So this case uses a different model, in which the cache only keeps finished KV and a running request computes in its own memory. No order reaches 53, and the best computes 63. The DFS orders split into 63 and 103.

Why 103, no hit at all, for a DFS order such as r1, r3, r4, r2? r1 enters the tree as one 32-token edge. It is larger than the 31-token cache, so eviction removes the whole leaf at once, and no part of S survives. Interpretation of these notes: whole-node eviction makes the cache-size condition sharp. A DFS order that starts the S subtree with the short request r4 keeps S. Then r1's match splits S from r4's tail, and eviction removes only tails.

## 9. The online case

A real server does not see one batch. New requests arrive all the time, and each one extends the tree. The paper (Appendix A.3) says that new requests "disrupt" the DFS order, but the schedule "still approximates the DFS behavior" on the augmented part of the tree.

Footnote 2 of the paper adds a caveat, here in paraphrase. Real computation differs from the proof, because the number of output tokens is unpredictable. That can force the system to recompute KV cache.

Interpretation of these notes: a long answer can push the pool past its limit. Then eviction can remove a prefix that the next requests of the same subtree need. The proof counts prompts and assumes the current path always fits. SGLang 0.5.22 handles the unknown output with the `new_token_ratio` estimate of section 6.4. When the estimate is too low, it retracts running requests (page 05).

The paper measures the gap. On average its cache-aware scheduling reaches about 96% of the optimal hit rate (Figure 13, [page 09](/notes/papers/llm-serving/2023-sglang-radixattention/09-results)).

## 10. Starvation

The paper warns: "While greedy cache-aware scheduling can achieve high throughput, it can lead to starvation." A request whose prefix matches nothing always sorts last. If requests with cached prefixes keep arriving, it may never run.

The next toy makes it concrete. Each round, two new requests on a cached 100-token prefix P arrive. Each needs 10 new prompt tokens and 10 output tokens, 20 slots in total. In round 1 a request R with no shared prefix arrives too: 30 prompt tokens and 10 output tokens, 40 slots. The server admits requests while a budget of 40 slots per round allows, and stops at the first request that does not fit. The `hrrn` key follows the docstring of `_sort_by_hrrn` in SGLang 0.5.22: the waited prefill tokens divided by the uncached prompt tokens. The sizes are choices of these notes.

```python
def simulate(policy, rounds=8, budget=40):
    """Two new P requests arrive per round. R (no shared prefix) arrives in round 1.
    P: 100 cached tokens, 10 new prompt + 10 output tokens = 20 slots.
    R: 30 new prompt + 10 output tokens = 40 slots. Budget: 40 slots per round."""
    queue, admitted_log, n, processed = [], [], 0, 0
    for rnd in range(1, rounds + 1):
        new = [(f"P{n + 1}", 100), (f"P{n + 2}", 100)] + ([("R", 0)] if rnd == 1 else [])
        n += 2
        for name, matched in new:
            queue.append({"name": name, "matched": matched, "arrival": processed,
                          "uncached": 10 if matched else 30, "size": 20 if matched else 40})
        if policy == "lpm":
            queue.sort(key=lambda r: -r["matched"])            # stable sort
        elif policy == "hrrn":                                 # the SGLang hrrn key
            queue.sort(key=lambda r: -(processed - r["arrival"]) / r["uncached"])
        left, admitted = budget, []
        for r in list(queue):
            if r["size"] > left:
                break                                          # stop at the first misfit
            left -= r["size"]
            admitted.append(r["name"])
            queue.remove(r)
            processed += r["uncached"]                         # prefill tokens processed
        admitted_log.append(" ".join(admitted))
        if "R" in admitted:
            return rnd, admitted_log
    return None, admitted_log

for policy in ("fcfs", "lpm", "hrrn"):
    rnd, log = simulate(policy)
    when = f"R runs in round {rnd}" if rnd else "R never runs in 8 rounds"
    rounds = " | ".join(log[:3]) + (" | ..." if len(log) > 3 else "")
    print(f"{policy:4s}: {rounds}  -> {when}")
```

Output:

```text
fcfs: P1 P2 | R  -> R runs in round 2
lpm : P1 P2 | P3 P4 | P5 P6 | ...  -> R never runs in 8 rounds
hrrn: P1 P2 | R  -> R runs in round 2
```

Under longest-shared-prefix-first, the two new P requests match 100 tokens and always sort before R, which matches 0. They fill the 40-slot budget every round, so R never runs. Under FCFS, R is first in round 2. Under the `hrrn` key, R's ratio grows by $20/30$ per round, while every new P request starts at 0. So R also runs in round 2.

The paper leaves fair scheduling as future work. For latency-sensitive settings it notes: "we may still be able to tolerate limited batch re-ordering to improve cache reuse."

> [!key] Cache-aware order trades fairness for throughput
> Longest-shared-prefix-first maximizes reuse inside a batch. It has no notion of waiting time. A production scheduler needs a bound on how long any request can be overtaken, for example aging or a fallback to arrival order.

## 11. SGLang 0.5.22 today

### 11.1 The policies

`--schedule-policy` defaults to `fcfs` (checked on 2026-10-19). Its choices are `lpm`, `random`, `fcfs`, `dfs-weight`, `lof`, `priority`, `routing-key`, `hrrn` and `shortest-prefill-first` (`arg_groups/fields/schedule.py`). `schedule_policy.py` splits the policies into two enums:

| Policy | Kind | Sort key (SGLang 0.5.22 source) |
|---|---|---|
| `fcfs` (default) | not cache-aware | arrival order |
| `lpm` | cache-aware | longest matched prefix first, deprioritized requests last |
| `dfs-weight` | cache-aware | a depth-first walk of the cache tree, heaviest subtree first |
| `hrrn` | cache-aware | highest ratio of waited prefill tokens to uncached prompt tokens first |
| `shortest-prefill-first` | cache-aware | fewest uncached tokens first, marked experimental in its log message |

Three more policies ignore the cache: `lof` (longest `max_new_tokens` first), `random`, and `routing-key` (frequent routing keys of the running batch first). The enums have no member named `priority`. Priority scheduling is a separate switch, `--enable-priority-scheduling` (default off), and the validation in `arg_groups/validation_hook.py` allows it only with `fcfs` or `lof`. If the radix cache is disabled, `_validate_and_adjust_policy` turns `lpm`, `dfs-weight` and `hrrn` into `fcfs` and rejects `shortest-prefill-first`.

### 11.2 The cost guard: more than 128 waiting requests

```python
    def _determine_active_policy(self, waiting_queue: List[Req]) -> Policy:
        if (
            self.policy
            in (
                CacheAwarePolicy.LPM,
                CacheAwarePolicy.HRRN,
            )
            and len(waiting_queue) > WAITING_QUEUE_PREFIX_MATCH_MAX
        ):
            # Turn off the expensive prefix matching and sorting when the #queue is large.
            return CacheAgnosticPolicy.FCFS
        return self.policy
```

`WAITING_QUEUE_PREFIX_MATCH_MAX` is 128. With `lpm` or `hrrn` and more than 128 waiting requests, the scheduler uses arrival order for that round. Matching every waiting request walks the tree on the CPU in every round. Under heavy load that cost grows with the queue, and the code comment calls it expensive. Under FCFS with LRU, SGLang still protects waiting prefixes. Every 32 scheduling passes, `_touch_waiting_prefixes` refreshes the cached prefixes of the first 128 waiting requests. The source comment says: "Head last, so LRU evicts in reverse admission order" (switch `SGLANG_ENABLE_WAITING_PREFIX_REFRESH`, default on).

### 11.3 In-batch prefix caching

Suppose three requests arrive at the same moment with the same new 500-token document. None of them matches anything in the cache. Without a special rule, all three could join one prefill batch, and the same 500 tokens would be computed three times. SGLang 0.5.22 tries to avoid that inside `_compute_prefix_matches`. This step runs only under a cache-aware policy, so not under the default `fcfs`:

1. Take a request that matches 32 tokens or fewer in the cache (`IN_BATCH_PREFIX_CACHING_CHECK_THRESHOLD`, default 32). The scheduler matches it against a temporary radix tree of the waiting queue.
2. If that match is 32 tokens or more (`IN_BATCH_PREFIX_CACHING_DEPRIORITIZE_THRESHOLD`, default 32), the request is deprioritized for this round. Otherwise its tokens are inserted into the temporary tree.
3. The sort keys of `lpm`, `hrrn` and `shortest-prefill-first` put deprioritized requests last.

> [!example] Worked example: three requests on a new document
> Requests A, B and C share a new 500-token prefix and match 0 tokens in the cache.
> 1. A: $0 \le 32$, so check the temporary tree. It is empty: match 0, which is below 32. Insert A.
> 2. B: $0 \le 32$. The temporary tree matches 500 tokens of A. $500 \ge 32$, so B is deprioritized.
> 3. C: the same as B.
> 4. Sort: A first, B and C last. When A's prefill has stored the 500 tokens, B and C match them in a later round.

Interpretation of these notes: the rule only reorders the queue. If the round still has budget after A, the code does not stop B from joining the same batch. The rule helps most when the budget is full. [Page 07](/notes/papers/llm-serving/2023-sglang-radixattention/07-frontend-hints-and-multi-gpu) compares it with the paper's frontend hint, which solves the same problem from the program side.

### 11.4 `dfs-weight`

`dfs-weight` brings Theorem 3.1 back into the server. `_dfs_weight_order` in `mem_cache/base_prefix_cache.py` works in two passes over the cache tree:

1. Each waiting request is attached to its last matched node. A post-order walk gives every node a weight: the number of waiting requests attached to it or to any node below it.
2. A second walk visits the children of each node in order of decreasing weight. It emits the requests of a node after the requests of all its children.

These notes ran a copy of the function on a toy cache tree: root with children S and V, S with children T and U. Five waiting requests q0 to q4 end at V, T, S, T and U. The weights are T 2, U 1, S 4 and V 1. The output order is q1, q3, q4, q2, q0. The heavy subtree S comes first, T comes before U, and S's own request follows its children.

### 11.5 Why the default is FCFS

These notes checked the published wheels. In SGLang 0.1.14 the field was `schedule_heuristic` with the default `lpm`. The default `schedule_policy` was still `lpm` in 0.4.3 (PyPI, 2025-02-14) and is `fcfs` from 0.4.4 (PyPI, 2025-03-13). The rule "more than 128 waiting requests means FCFS" was already in the 0.4.0 wheel.

Interpretation of these notes, four reasons that fit the code:

1. **CPU cost per round.** Matching and sorting every waiting request costs CPU time in every scheduling round, and the scheduler loop must stay fast. The 128 guard already showed that cost.
2. **Fairness and tail latency.** Section 10 shows starvation under greedy LPM. FCFS is predictable, and production services care about the slowest requests.
3. **Reuse does not need the sort.** Every request is still matched against the radix tree under FCFS. The cache works. Only the order is not optimized.
4. **Other layers now do part of the job.** Cache-aware routing across replicas ([page 07](/notes/papers/llm-serving/2023-sglang-radixattention/07-frontend-hints-and-multi-gpu)) reduces the value of reordering. Larger caches such as HiCache ([page 10](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today)) do the same.

To use the paper's policy today, start the server with `--schedule-policy lpm`.

### Exercises

1. **The hit rate of a trace.** Write `hit_rate(steps, cap_last_token=False)`. Each step is (step, number of requests, prompt tokens per request, matched tokens per request). With `cap_last_token=True`, a request matches at most its prompt length minus 1. Acceptance test: the nine-step trace gives $152/236$, and with the cap $148/236$.
   - Hint 1: sum the matched and the prompt tokens separately, then divide once.
   - Hint 2: apply the cap per request, not per step.
2. **`lpm` with in-batch prefix caching.** Write `order_requests(waiting, cache_match)` with the two thresholds of 32. Use a plain list of earlier prompts as the temporary tree, and the length of the longest common prefix as its match. Waiting: A, B and C share a new 500-token prefix, E is an unrelated 100-token prompt, and D matches 40 cached tokens. Acceptance test: the order is D, A, E, B, C.
   - Hint 1: only requests with a cache match of 32 or fewer enter the in-batch check.
   - Hint 2: sort with the key `inf` for deprioritized requests and minus the cache match for the others.
3. **Theorem 3.1 by brute force.** Write `best_orders(batch, M)`. It runs every order with `serve` on a pool of `M` slots and returns the fewest computed prompt tokens and all orders that reach it. Acceptance test: for the batch of section 8.5 and $M = 32$, it returns 53 and 8 orders. The orders include r1, r3, r4, r2 and exclude r1, r2, r3, r4.
   - Hint 1: computed tokens are the prompt tokens minus the hit tokens that `serve` returns.
   - Hint 2: pass the order to `serve` with the policy `fcfs`, so that it keeps your order.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling)

## 12. Common mistakes

1. **"Cache-aware scheduling makes the cache bigger."** It changes only the order. In the P and Q example the same 150 slots give 0% or about 60.6%, depending on the order.
2. **"The hit rate counts output tokens."** The paper counts prompt tokens only: cached prompt tokens over all prompt tokens.
3. **"DFS is the only optimal order."** Theorem 3.1 says a DFS order is optimal when the cache holds the longest request. With a 40-slot pool, 6 orders that are not DFS orders reach the bound too.
4. **"Theorem 3.1 holds for any cache size."** It needs a cache at least as large as the longest request. With 31 slots in the check of section 8.5, no order reaches the bound.
5. **"Algorithm 1 can be copied as printed."** The printed loop never adds to `current_size`, and it has no branch for a second failed allocation. The toy of section 6.3 crashes exactly there.
6. **"The delta of a lock is positive."** It is 0 or negative. Locked tokens leave the evictable size, so the available memory shrinks.
7. **"Longest-shared-prefix-first is fair."** A request without a shared prefix can starve. The paper says so itself and leaves fair scheduling as future work.
8. **"SGLang uses `lpm` by default."** It did up to 0.4.3. Since 0.4.4 the default is `fcfs`, and `lpm` uses arrival order whenever more than 128 requests wait.

## 13. One-minute explanation

The paper's hit rate is cached prompt tokens over all prompt tokens, and with a small KV pool it depends on the request order. If two groups of requests share two long prefixes and arrive interleaved, FCFS can evict each prefix just before its next use. In my example that gives 0%, while grouping the requests gives about 60.6% with the same 150 slots. The scheduler matches every waiting request against the tree and runs the longest matched prefix first. Algorithm 1 admits requests that fit into free plus evictable memory and locks each admitted path, which shrinks the available memory. The printed version never adds admitted requests to its running total, which is the first thing I would fix. Theorem 3.1 says a depth-first order of the batch's radix tree is optimal if the cache holds the longest request. Every edge must be computed once, and DFS computes each edge exactly once because its subtree runs while the edge stays cached. Longest-shared-prefix-first is a DFS order, but online arrivals and unknown output lengths make it approximate, and it can starve unmatched requests. That is part of why SGLang now defaults to FCFS and keeps `lpm`, `dfs-weight` and the aging policy `hrrn` as options.

## 14. Check questions

```check
{
  "question": "Define the paper's cache hit rate. What is it for the nine steps of the running example, and how does SGLang 0.5.22's last-token rule change it?",
  "hint": "Only prompt tokens count. Which request matches its whole prompt?",
  "answer": "The paper: \"number of cached prompt tokens / number of prompt tokens\". Output tokens do not count.\n\nNine steps: matched $0 + 16 + 8 + 16 + 0 + 24 + 16 + 12 + 60 = 152$ of $12 + 20 + 12 + 20 + 16 + 32 + 49 + 15 + 60 = 236$ prompt tokens, so $152/236 \\approx 64.4\\%$.\n\nSGLang 0.5.22 caps a match at the prompt length minus 1 (`_compute_max_prefix_len`). The last prompt token must run to produce the logits of the first output token. Only the four samples of step 9b match their whole 15-token prompt. Each now matches 14, so the total becomes $152 - 4 = 148$ of 236, about 62.7%."
}
```
```check
{
  "question": "Interview follow-up: prove Theorem 3.1. Where exactly does the condition \"cache size ≥ the maximum request length\" enter?",
  "hint": "First a lower bound that holds for every order, then show that DFS meets it.",
  "answer": "1. **Lower bound.** Every edge $e$ of the batch's radix tree belongs to some request and is not cached at the start. So every order computes it at least once: $C \\ge \\sum_e |e|$, and the hit rate is at most $1 - \\sum_e |e| / \\sum_r p_r$.\n2. **DFS meets it.** In DFS order, the first computation of edge $e$ is followed by its whole subtree. Every request there contains $e$ and hits it. No later request contains $e$, so it is never needed again.\n3. **The condition.** Edge $e$ must stay cached while its subtree runs. It lies on the current root-to-leaf path. If the cache holds at least the longest request, the current path always fits, and leaf-first eviction never has to remove it. So each edge is computed exactly once: $C = \\sum_e |e|$.\n4. **LPM is DFS.** By induction: after a DFS prefix of the schedule, the cache holds the last path. The waiting request with the longest matched prefix lies in the deepest subtree with unvisited requests, which is the next DFS step.\n\nThe check of section 8.5 shows the condition at work. With a 32-slot pool (the longest request) the 8 DFS orders compute exactly the bound 53. With a 31-token cache, no order reaches 53."
}
```
```check
{
  "question": "Interview follow-up: the printed Algorithm 1 never adds to `current_size`. Show with the toy of section 6.3 what goes wrong, and say how SGLang 0.5.22 does the same bookkeeping.",
  "hint": "Compare each request alone with the available memory, then the batch together.",
  "answer": "With `current_size` stuck at 0, each request is tested alone. In the toy (pool 64, available 64): r3 needs 8 and locks 24 tokens (available 40). r1 needs 10 (delta 0). r2 needs 34, and $34 + 0 < 40$, so r2 is admitted too. The batch needs $8 + 10 + 34 = 52$ slots. Free 20 plus the only unlocked leaf X (20) gives 40, so the second allocation fails, and the printed algorithm has no branch for that.\n\nWith the fix `current_size += req.size()`, r2 sees $34 + 18 = 52 \\ge 40$ and waits for the next round, where it fits.\n\nSGLang 0.5.22: `PrefillBudget.reserve` adds every admitted request to `total_offset`, and `remaining_total` is `available_size() + evictable_size() - total_offset`. The lock of `_commit_prefill_admission` lowers `evictable_size()` at once, which replaces the explicit delta. The admission test is `total_tokens < self.remaining_total`."
}
```
```check
{
  "question": "In the P and Q example, why does FCFS reach 400 hit tokens with a 240-slot pool but 0 with 239 slots?",
  "hint": "What must stay cached at the moment P2 runs?",
  "answer": "Under FCFS the order is P1, Q1, P2, Q2, P3, Q3. When P2 runs, both P and Q must still be cached, because Q2 comes right after it. After P1 and Q1 the tree holds P with P1's 20-token tail and Q with Q1's tail: $2 \\times (100 + 20) = 240$ tokens.\n\nWith 240 slots everything fits. P2 needs 20 new slots, and eviction takes only the oldest leaf, P1's tail. P survives, and every later request hits its prefix: $4 \\times 100 = 400$.\n\nWith 239 slots, Q1 cannot be stored next to all 120 tokens of P1. P1 is still one 120-token node, and a node is evicted whole, so P disappears. From then on each request evicts the other prefix, and the hit rate is 0. Longest-shared-prefix-first needs only 150 slots for the same 400 hits."
}
```
```check
{
  "question": "Interview follow-up: under greedy longest-shared-prefix-first, a request with no shared prefix can wait forever. Design a fix that keeps most of the cache benefit.",
  "hint": "Think about waiting time as part of the sort key.",
  "answer": "The problem: the sort key ignores waiting time, so a steady flow of requests with cached prefixes always sorts first. Options:\n\n1. **Aging.** Add waiting time to the key. SGLang 0.5.22's `hrrn` sorts by waited prefill tokens divided by uncached prompt tokens. In the toy of section 10, R runs in round 2 instead of never.\n2. **A bound on overtakes.** Allow reordering only within a window, for example the first $k$ requests of the queue. Or let a request be overtaken at most $k$ times. The paper itself suggests that latency-sensitive settings \"may still be able to tolerate limited batch re-ordering to improve cache reuse.\"\n3. **A deadline boost.** Requests waiting longer than a threshold jump to the front.\n4. **Arrival order by default.** Keep FCFS and accept a lower hit rate, as SGLang 0.5.22 does by default. Under FCFS it still refreshes the cached prefixes of the first 128 waiting requests every 32 scheduling passes, so LRU evicts them late.\n\nThe trade-off: every fairness rule sometimes runs a request whose prefix is not cached, which costs hit rate. Measure both the hit rate and the tail latency. This design discussion is the interpretation of these notes."
}
```
```check
{
  "question": "Interview follow-up: SGLang ships the paper's scheduler, but its default is `fcfs`. When did the default change, and why might that be?",
  "hint": "Separate the verified facts from the reasons.",
  "answer": "Facts (checked in the published wheels on 2026-10-19): SGLang 0.1.14 had `schedule_heuristic` with default `lpm`. The default `schedule_policy` was `lpm` up to 0.4.3 (PyPI, 2025-02-14) and is `fcfs` from 0.4.4 (PyPI, 2025-03-13). Already in 0.4.0, `lpm` used arrival order whenever more than 128 requests waited, with the comment \"Turn off the expensive prefix matching and sorting when the #queue is large.\"\n\nReasons, as the interpretation of these notes:\n\n1. Matching and sorting the whole queue costs CPU time in every round.\n2. Greedy LPM can starve requests and hurts tail latency, while FCFS is predictable.\n3. FCFS still matches every request against the radix tree, so reuse still happens. Only the order is not optimized.\n4. Cache-aware routing across replicas and bigger caches (HiCache) reduce the value of reordering.\n\nThe paper's policy is one flag away: `--schedule-policy lpm`."
}
```
```check
{
  "question": "Three requests arrive together with the same new 500-token prefix. What does SGLang 0.5.22 do under `lpm`, what does it do under the default `fcfs`, and what does the rule not guarantee?",
  "hint": "Two thresholds of 32 tokens and a temporary radix tree.",
  "answer": "All three match 0 tokens in the cache, which is at most 32 (`IN_BATCH_PREFIX_CACHING_CHECK_THRESHOLD`). So each is checked against a temporary radix tree of the waiting queue. The first finds nothing and is inserted. The second and third match 500 tokens there, at least 32 (`IN_BATCH_PREFIX_CACHING_DEPRIORITIZE_THRESHOLD`), so they are deprioritized: the sort key puts them last. Once the first request's prefill stores the 500 tokens, they match them in a later round.\n\nUnder the default `fcfs`, this check does not run at all: `_compute_prefix_matches` is called only for cache-aware policies.\n\nWhat it does not guarantee: deprioritizing is only a sort key. If the round still has budget after the first request, nothing in the code stops the others from joining the same batch. Then the prefix is computed more than once. The rule helps most when the budget is full. This limitation is the interpretation of these notes from the source."
}
```
```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\n# (step, requests, prompt tokens per request, matched tokens per request)\ntrace = [(\"2\", 1, 12, 0), (\"3\", 1, 20, 16), (\"4\", 1, 12, 8), (\"5\", 1, 20, 16),\n         (\"6\", 1, 16, 0), (\"7\", 2, 16, 12), (\"8\", 1, 49, 16), (\"9a\", 1, 15, 12),\n         (\"9b\", 4, 15, 15)]\n\ndef hit_rate(steps, cap_last_token=False):\n    \"\"\"With cap_last_token, a request matches at most prompt - 1 tokens (SGLang 0.5.22).\"\"\"\n    hit = total = 0\n    for _, n, prompt, matched in steps:\n        if cap_last_token:\n            matched = min(matched, prompt - 1)        # the last token must run\n        hit, total = hit + n * matched, total + n * prompt\n    return hit, total, round(hit / total, 4)\n\nprint(hit_rate(trace))\nprint(hit_rate(trace, cap_last_token=True))\nassert hit_rate(trace)[:2] == (152, 236)\nassert hit_rate(trace, cap_last_token=True)[:2] == (148, 236)\n```\n\nOutput:\n\n```text\n(152, 236, 0.6441)\n(148, 236, 0.6271)\n```"
}
```
```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\nCHECK, DEPRIORITIZE = 32, 32          # SGLang 0.5.22 defaults of the two thresholds\n\ndef lcp(a, b):\n    n = 0\n    while n < min(len(a), len(b)) and a[n] == b[n]:\n        n += 1\n    return n\n\ndef order_requests(waiting, cache_match):\n    \"\"\"waiting: list of (name, tokens). cache_match: name -> matched tokens in the cache.\n    Returns the LPM order with in-batch prefix caching.\"\"\"\n    seen, deprioritized = [], set()                # seen: the temporary tree, as a list\n    for name, tokens in waiting:\n        if cache_match[name] <= CHECK:\n            best = max((lcp(tokens, s) for s in seen), default=0)\n            if best >= DEPRIORITIZE:\n                deprioritized.add(name)\n            else:\n                seen.append(tokens)\n    key = lambda r: float(\"inf\") if r[0] in deprioritized else -cache_match[r[0]]\n    return [name for name, _ in sorted(waiting, key=key)]\n\nX = tuple(range(500))                              # a new 500-token shared prefix\nwaiting = [(\"A\", X + (1001,)), (\"B\", X + (1002,)), (\"C\", X + (1003,)),\n           (\"E\", tuple(range(7000, 7100))), (\"D\", tuple(range(9000, 9050)))]\ncache_match = {\"A\": 0, \"B\": 0, \"C\": 0, \"E\": 0, \"D\": 40}\nprint(order_requests(waiting, cache_match))\nassert order_requests(waiting, cache_match) == [\"D\", \"A\", \"E\", \"B\", \"C\"]\n```\n\nOutput:\n\n```text\n['D', 'A', 'E', 'B', 'C']\n```"
}
```
```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "Run this after the classes of section 5.3.\n\n```python\nimport itertools\n\ndef best_orders(batch, M):\n    \"\"\"batch: name -> prompt tokens. Returns (fewest computed tokens, best orders).\"\"\"\n    total = sum(len(s) for s in batch.values())\n    results = {}\n    for order in itertools.permutations(batch):\n        hit, _, _ = serve([(n, batch[n], ()) for n in order], M, \"fcfs\")\n        results[order] = total - hit                 # computed prompt tokens\n    best = min(results.values())\n    return best, [o for o, c in results.items() if c == best]\n\nS, T_, U = toks(\"s\", 20), toks(\"t\", 10), toks(\"u\", 15)\nbatch = {\"r1\": S + T_ + toks(\"a\", 2), \"r2\": U + toks(\"b\", 2),\n         \"r3\": S + T_ + toks(\"c\", 2), \"r4\": S + toks(\"d\", 2)}\nbest, orders = best_orders(batch, 32)\nprint(best, len(orders), [\" \".join(o) for o in orders])\nassert best == 53 and len(orders) == 8\nassert (\"r1\", \"r3\", \"r4\", \"r2\") in orders and (\"r1\", \"r2\", \"r3\", \"r4\") not in orders\n```\n\nOutput:\n\n```text\n53 8 ['r1 r3 r4 r2', 'r2 r1 r3 r4', 'r2 r3 r1 r4', 'r2 r4 r1 r3', 'r2 r4 r3 r1', 'r3 r1 r4 r2', 'r4 r1 r3 r2', 'r4 r3 r1 r2']\n```"
}
```

## 15. Links

- Previous: [05 Eviction and reference counts](/notes/papers/llm-serving/2023-sglang-radixattention/05-eviction-and-reference-counts)
- Next: [07 Frontend hints and multi-GPU RadixAttention](/notes/papers/llm-serving/2023-sglang-radixattention/07-frontend-hints-and-multi-gpu)
- The measured hit rates and the ablation "FCFS Schedule": [09 Results](/notes/papers/llm-serving/2023-sglang-radixattention/09-results)
- The scheduler code of today: [10 RadixAttention in SGLang today](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today)
- Starvation and later schedulers: [11 Limits and later work](/notes/papers/llm-serving/2023-sglang-radixattention/11-limits-and-later-work)
- Verify Theorem 3.1 in a lab: [12 Reproduce it](/notes/papers/llm-serving/2023-sglang-radixattention/12-reproduce-it)
- Continuous batching and schedulers in general: [L4: Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)
- Prefix-aware routing across replicas: [L5: Autoscaling and routing](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing)
- The paper card: [SGLang and RadixAttention (2023)](/notes/papers/llm-serving/2023-sglang-radixattention) and the [Glossary](/notes/papers/glossary)

### Sources

- Zheng et al., "SGLang: Efficient Execution of Structured Language Model Programs", NeurIPS 2024: https://arxiv.org/abs/2312.07104 (§3, Theorem 3.1, footnote 2, Appendix A.2 and A.3, Figure 13)
- SGLang 0.5.22 on PyPI: https://pypi.org/project/sglang/0.5.22/ (source files `srt/managers/schedule_policy.py`, `schedule_batch.py`, `scheduler.py`, `scheduler_components/new_token_ratio_tracker.py`, `srt/mem_cache/base_prefix_cache.py`, `prefill_budget.py`, `srt/arg_groups/fields/schedule.py`, `srt/arg_groups/validation_hook.py`, `srt/environ.py`)
- Older SGLang wheels for the default policy: https://pypi.org/project/sglang/0.1.14/, https://pypi.org/project/sglang/0.4.0/, https://pypi.org/project/sglang/0.4.3/, https://pypi.org/project/sglang/0.4.4/
- SGLang repository: https://github.com/sgl-project/sglang

(checked on 2026-10-19)
