---
title: "12 Reproduce it"
order: 12
summary: "Seven labs that rebuild the paper on a CPU: a radix cache with a KV pool, LRU leaf eviction that reproduces the nine-step example exactly, FCFS vs LPM vs DFS hit rates, Theorem 3.1 by brute force, a 16-token hash chain, the log-sum-exp merge in NumPy, and an optional SGLang run."
status: not-started
tags: [exercises, reproduction, radixattention, sglang, radix-tree, lru, numpy, labs]
---

## 1. The question this page answers

Can you build RadixAttention from an empty notebook? Can you make your own code produce the exact trace of the nine-step example? Can you measure how the order of requests changes the hit rate? Can you show that Theorem 3.1 holds under its condition and can fail without it? And can you find the same counters in a real SGLang server?

> [!key] The rule for these labs
> You write the code. Each lab gives the goal, the steps, an acceptance test and two hints. The reference solution of each lab is hidden in a check block. Open it only after your code passes the tests, or after a real attempt. If AI writes any part of your code, you must explain every line, or the lab is not complete.

## 2. Mental model

> [!analogy] A scale model in a wind tunnel
> Aircraft engineers test a small model of a wing in a wind tunnel. The shape is exact, the size is small, and every force can be measured. Only after that does a real aircraft fly. Labs 1 to 6 are the scale model. They have the same radix tree, reference counts, LRU rule and attention math, with token counts small enough to check by hand. Lab 7 is the test flight: a real SGLang server on a GPU, with real counters.
>
> **Where it stops working:** a scale model shows forces, but not the weight of the real aircraft. These labs count tokens, not milliseconds. They have no GPU kernels, no batching cost and no network. So they show hit rates and token counts exactly, but they cannot show throughput or latency.

## 3. Terms

| Term | Plain meaning |
|---|---|
| lab | One exercise with a goal, steps, an acceptance test and a hidden reference solution. |
| acceptance test | A test that your code must pass before you call the lab complete. |
| KV pool | The simulated GPU memory of token slots, shared by cached tokens and running requests. |
| slot | One token's KV entry in the KV pool, named by its index. |
| radix tree | A tree whose edges hold runs of tokens. A path from the root spells a cached prefix. |
| split | Dividing a node's edge in two, with the slot list divided at the same position. |
| reference count | The paper's "reference counter", `lock_ref` in the code: how many running requests use a node. |
| LRU leaf eviction | Removing the leaf that was used least recently, among leaves with reference count 0. |
| hit rate | Cached prompt tokens divided by prompt tokens, as the paper defines it. |
| pool model | Labs 1 and 2: cached tokens and running requests share one KV pool of fixed size. |
| cache-only model | Labs 3 and 4: the cache holds finished tokens only, at most $M$ of them. |
| FCFS | First come, first served: requests run in arrival order. |
| LPM | Longest prefix match: the waiting request with the longest matched prefix length runs first. |
| DFS order | The order of a depth-first walk of the radix tree of all requests. |
| lower bound | The fewest tokens that any order must compute: every token of the tree of requests once. |
| hash chain | vLLM's index: one hash per full block of 16 tokens, each hash including its parent's hash. |
| attention state | A partial attention output and its log-sum-exp, which merge exactly with another state. |
| Prometheus metric | A named number that a server exposes at `/metrics`. A counter only grows, a gauge goes up and down. |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. The plan

![Alt text: seven labs as boxes with arrows that show which lab builds on which, and Lab 7 dashed because it needs a GPU](/notes/media/papers/2023-sglang-radixattention/figures/12-lab-map.svg)

| Lab | You build | It reproduces | Page that explains it |
|---|---|---|---|
| 1 | A radix cache with slot values and a KV pool | Steps 2 to 7 of the nine-step example, without eviction | [04](/notes/papers/llm-serving/2023-sglang-radixattention/04-radixattention-the-tree-of-kv-caches) |
| 2 | Reference counts and LRU leaf eviction | Steps 2 to 9 exactly, with every eviction | [05](/notes/papers/llm-serving/2023-sglang-radixattention/05-eviction-and-reference-counts) |
| 3 | A scheduler simulator: FCFS, LPM, DFS | Hit rate against cache size | [06](/notes/papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling) |
| 4 | A brute-force search over all orders | Theorem 3.1, and a counterexample | [06](/notes/papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling) |
| 5 | A 16-token hash chain beside the radix tree | Tokens lost at block boundaries | [10](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today) |
| 6 | Attention states and the LSE merge in NumPy | Extend attention and shared-prefix decode | [11](/notes/papers/llm-serving/2023-sglang-radixattention/11-limits-and-later-work) |
| 7 | Optional, needs a GPU: a real SGLang server | `cached_tokens` and the cache counters | [10](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today) |

Two simulation models appear, and you must not mix them:

1. **The pool model** (Labs 1 and 2) is the model of the nine-step example. One KV pool of 80 slots holds the cached tokens and the tokens of running requests. A request reserves its new tokens before it runs.
2. **The cache-only model** (Labs 3 and 4) keeps only finished tokens, at most $M$. A running request does not count. After a request finishes, the cache inserts its tokens and then evicts least recently used leaves until at most $M$ tokens remain. This is the model of the proof of Theorem 3.1.

Keep each lab in its own notebook, for example `lab1_radix_cache.ipynb` to `lab7_sglang_counters.ipynb`. Move shared classes into one module, for example `radixlab.py`, and test them with pytest.

### Exercises

1. **Lab 1**: a radix cache with slot values and a KV pool. Test: steps 2 to 7 match 0, 16, 8, 16, 0 and 12 + 12 tokens.
2. **Lab 2**: reference counts and LRU leaf eviction. Test: the exact evictions of steps 5, 8, 9a and 9b, and 152 of 236 prompt tokens matched.
3. **Lab 3**: FCFS vs LPM vs DFS. Test: DFS reaches the infinite-cache hit rate for every cache at least as large as the longest request.
4. **Lab 4**: Theorem 3.1 by brute force. Test: DFS and LPM reach the lower bound in 300 random batches, and a smaller cache breaks DFS.
5. **Lab 5**: radix tree vs 16-token hash chain. Test: the lost tokens equal the sum of the template lengths modulo 16.
6. **Lab 6**: the log-sum-exp merge. Test: extend attention and shared-prefix decode equal full attention within $10^{-12}$.
7. **Lab 7** (optional, needs a GPU): read the cache counters of SGLang 0.5.22. Test, a prediction: the second identical prompt of 1,000 tokens reports 999 cached tokens.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/12-reproduce-it)

## 5. Lab 1: a radix cache with slot values and a KV pool

**Goal.** Build the data structure of [page 04](/notes/papers/llm-serving/2023-sglang-radixattention/04-radixattention-the-tree-of-kv-caches): a radix tree on the CPU whose nodes store slot indices into a KV pool.

**Steps.**

1. `KVPool(capacity)`: a sorted free list of slots. `alloc(n)` returns the `n` smallest free slots or raises `PoolFull`. `release(slots)` returns slots to the free list.
2. `Node` has four fields: `key`, a tuple of tokens, and `value`, a list of slots with one per token. It also has `children`, a dict keyed by the first token of each child edge, and `parent`. Add two fields that Lab 2 uses: `lock_ref = 0` and `last_access`.
3. `RadixCache.match_prefix(tokens, now)`: walk from the root. If the match ends inside an edge, split the node there, so that the matched prefix ends exactly at a node. Return the matched prefix length, the last matched node and the slots of the matched prefix.
4. `RadixCache.insert(tokens, slots, now)`: match first, then add one leaf for the unmatched tail. If part of the sequence is already cached with other slots, release your duplicate slots.
5. `run_batch(cache, requests, now)`: for each `(prompt, output)`, match, allocate `len(prompt) - matched + len(output)` slots, then insert `prompt + output` with the matched slots plus the new slots.
6. Run steps 2 to 7 of the running example with the sizes of [page 04](/notes/papers/llm-serving/2023-sglang-radixattention/04-radixattention-the-tree-of-kv-caches). SYS has 8 tokens. Each turn has a user part and an answer: C1.1 $4 + 4$, C1.2 $4 + 25$, C2.1 $4 + 4$ and C2.2 $4 + 24$. FS has 12 tokens, and QA, QB and QC have $4 + 1$ each.

**Acceptance tests.**

1. With a pool of 1,000 slots, the matched tokens of steps 2 to 7 are `[0]`, `[16]`, `[8]`, `[16]`, `[0]` and `[12, 12]`. The cached tokens after each step are 16, 45, 53, 81, 98 and 108.
2. After step 4, the split node SYS holds slots 0 to 7, C1.1 holds 8 to 15, and C2.1 holds 45 to 52.
3. With a pool of 80 slots, steps 2 to 4 succeed and step 5 raises `PoolFull` with "need 28, free 27". That is the reason for Lab 2.

> [!example] Hint level 1: the idea
> A split creates a new middle node with the first $n$ tokens and the first $n$ slots. The old node keeps the rest and becomes the child of the middle node. The parent's dictionary entry for the first token now refers to the middle node. Nothing else changes.

> [!example] Hint level 2: pseudocode
> 1. `match_prefix`: `while i < len(tokens) and tokens[i] in node.children`: count equal tokens `n` along the child's key. If `n < len(child.key)`: `child = split(child, n)` and stop after this child. Add `child.value` to the slots, `i += n`.
> 2. `insert`: `matched, node, cached = match_prefix(tokens)`. Release `slots[j]` for each `j < matched` where `slots[j] != cached[j]`. If `matched < len(tokens)`, attach `Node(tokens[matched:], slots[matched:])` under `node`.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/12-reproduce-it)

```check
{
  "question": "Lab 1: show a reference solution",
  "answer": "The pool, the node, the cache with split and insert, the running example and the tests.\n\n```python\nclass PoolFull(Exception):\n    \"\"\"Raised when the KV pool has fewer free slots than a request needs.\"\"\"\n\n\nclass KVPool:\n    \"\"\"The GPU memory of token slots, simulated. One slot holds one token's KV.\"\"\"\n\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.free = list(range(capacity))        # sorted: the smallest slot goes first\n\n    def available(self):\n        return len(self.free)\n\n    def alloc(self, n):\n        if n > len(self.free):\n            raise PoolFull(f\"need {n}, free {len(self.free)}\")\n        out, self.free = self.free[:n], self.free[n:]\n        return out\n\n    def release(self, slots):\n        self.free = sorted(self.free + list(slots))\n\n\nclass Node:\n    created = 0                        # a creation counter: Lab 2 breaks LRU ties with it\n\n    def __init__(self, key=(), value=(), parent=None, now=0.0):\n        self.key = tuple(key)          # the edge: a run of token ids\n        self.value = list(value)       # one KV pool slot per token of the edge\n        self.children = {}             # first token of a child edge -> child node\n        self.parent = parent\n        self.lock_ref = 0              # used from Lab 2 on\n        self.last_access = now         # used from Lab 2 on\n        Node.created += 1\n        self.serial = Node.created\n\n\nclass RadixCache:\n    def __init__(self, pool):\n        self.pool = pool\n        self.root = Node()\n\n    def _split(self, child, n):\n        \"\"\"Divide child's edge after n tokens. The slot list divides at the same place.\"\"\"\n        mid = Node(child.key[:n], child.value[:n], child.parent, child.last_access)\n        mid.lock_ref = child.lock_ref              # the new parent is in use by the same requests\n        child.parent.children[mid.key[0]] = mid\n        child.key, child.value = child.key[n:], child.value[n:]\n        child.parent = mid\n        mid.children[child.key[0]] = child\n        return mid\n\n    def match_prefix(self, tokens, now=0.0):\n        \"\"\"Return (matched length, last matched node, slots of the matched prefix).\"\"\"\n        node, i, slots = self.root, 0, []\n        while i < len(tokens) and tokens[i] in node.children:\n            child = node.children[tokens[i]]\n            n = 0\n            while n < len(child.key) and i + n < len(tokens) and child.key[n] == tokens[i + n]:\n                n += 1\n            ends_inside = n < len(child.key)\n            if ends_inside:                            # the match ends inside this edge\n                child = self._split(child, n)\n            child.last_access = now\n            slots += child.value\n            i += n\n            node = child\n            if ends_inside:\n                break\n        return i, node, slots\n\n    def insert(self, tokens, slots, now=0.0):\n        \"\"\"Insert tokens with their slots. Free our slots of any part that is already cached.\"\"\"\n        matched, node, cached_slots = self.match_prefix(tokens, now)\n        dup = [s for s, c in zip(slots[:matched], cached_slots) if s != c]\n        self.pool.release(dup)            # another request inserted these tokens first\n        if matched < len(tokens):\n            leaf = Node(tokens[matched:], slots[matched:], node, now)\n            node.children[leaf.key[0]] = leaf\n        return matched\n\n    def nodes(self):\n        out, stack = [], [self.root]\n        while stack:\n            n = stack.pop()\n            if n is not self.root:\n                out.append(n)\n            stack.extend(n.children.values())\n        return out\n\n    def cached_tokens(self):\n        return sum(len(n.key) for n in self.nodes())\n\n\n# ---- the running example: token names, sizes and the steps -------------------\ndef toks(tag, n):\n    return tuple(f\"{tag}{i}\" for i in range(n))\n\n\nSYS = toks(\"sys\", 8)\nU1, A1, U2, A2 = toks(\"u1_\", 4), toks(\"a1_\", 4), toks(\"u2_\", 4), toks(\"a2_\", 25)\nV1, B1, V2, B2 = toks(\"v1_\", 4), toks(\"b1_\", 4), toks(\"v2_\", 4), toks(\"b2_\", 24)\nFS = toks(\"fs\", 12)\nQ = {k: toks(f\"q{k}_\", 4) for k in \"ABC\"}\nO = {k: toks(f\"o{k}_\", 1) for k in \"ABC\"}\n# the first token of each named part of the notes\nNAMES = {\"sys0\": \"SYS\", \"u1_0\": \"C1.1\", \"u2_0\": \"C1.2\", \"v1_0\": \"C2.1\", \"v2_0\": \"C2.2\",\n         \"fs0\": \"FS\", \"qA_0\": \"QA\", \"qB_0\": \"QB\", \"qC_0\": \"QC\"}\n\n\ndef label(node):\n    return \"+\".join(NAMES[t] for t in node.key if t in NAMES)\n\n\ndef ranges(slots):\n    \"\"\"[0, 1, 2, 7, 8] -> '0-2,7-8'\"\"\"\n    out, start = [], None\n    for i, s in enumerate(slots):\n        if start is None:\n            start = s\n        if i + 1 == len(slots) or slots[i + 1] != s + 1:\n            out.append(f\"{start}-{s}\" if s != start else f\"{s}\")\n            start = None\n    return \",\".join(out)\n\n\ndef show(node, depth=0):\n    for child in sorted(node.children.values(), key=lambda c: min(c.value)):\n        print(\"  \" * depth + f\"- {label(child)} ({len(child.key)}) slots {ranges(child.value)}\")\n        show(child, depth + 1)\n\n\ndef run_batch(cache, requests, now):\n    \"\"\"Lab 1: no eviction. requests: list of (prompt, output).\"\"\"\n    plan = []\n    for prompt, output in requests:\n        matched, _, prefix_slots = cache.match_prefix(prompt, now)\n        plan.append((prompt, output, matched, prefix_slots))\n    need = sum(len(p) - m + len(o) for p, o, m, _ in plan)\n    if need > cache.pool.available():\n        raise PoolFull(f\"need {need}, free {cache.pool.available()}\")\n    for prompt, output, matched, prefix_slots in plan:\n        new = cache.pool.alloc(len(prompt) - matched + len(output))\n        cache.insert(prompt + output, prefix_slots + new, now)\n    return [m for _, _, m, _ in plan]\n\n\nSTEPS_2_TO_7 = [\n    (2, [(SYS + U1, A1)]),\n    (3, [(SYS + U1 + A1 + U2, A2)]),\n    (4, [(SYS + V1, B1)]),\n    (5, [(SYS + V1 + B1 + V2, B2)]),\n    (6, [(FS + Q[\"A\"], O[\"A\"])]),\n    (7, [(FS + Q[\"B\"], O[\"B\"]), (FS + Q[\"C\"], O[\"C\"])]),\n]\n\n\ndef test_lab1():\n    cache = RadixCache(KVPool(1000))             # a large pool: no eviction is needed\n    rows = []\n    for step, reqs in STEPS_2_TO_7:\n        matched = run_batch(cache, reqs, now=step)\n        rows.append((step, matched, cache.cached_tokens()))\n        print(\"step\", step, \"matched\", matched, \"cached\", cache.cached_tokens())\n        if step == 4:                            # the split also divided the slot list\n            sys_node = cache.root.children[\"sys0\"]\n            assert label(sys_node) == \"SYS\" and sys_node.value == list(range(8))\n            assert sys_node.children[\"u1_0\"].value == list(range(8, 16))\n            assert sys_node.children[\"v1_0\"].value == list(range(45, 53))\n    assert [m for _, m, _ in rows] == [[0], [16], [8], [16], [0], [12, 12]]\n    assert [c for *_, c in rows] == [16, 45, 53, 81, 98, 108]\n    show(cache.root)\n    small = RadixCache(KVPool(80))               # the pool of the running example\n    for step, reqs in STEPS_2_TO_7[:3]:\n        run_batch(small, reqs, now=step)\n    try:\n        run_batch(small, STEPS_2_TO_7[3][1], now=5)\n        raise AssertionError(\"step 5 must not fit without eviction\")\n    except PoolFull as e:\n        print(\"pool of 80 slots, step 5:\", e)\n    print(\"Lab 1 passed\")\n\n\ntest_lab1()\n```\n\nOutput:\n\n```text\nstep 2 matched [0] cached 16\nstep 3 matched [16] cached 45\nstep 4 matched [8] cached 53\nstep 5 matched [16] cached 81\nstep 6 matched [0] cached 98\nstep 7 matched [12, 12] cached 108\n- SYS (8) slots 0-7\n  - C1.1 (8) slots 8-15\n    - C1.2 (29) slots 16-44\n  - C2.1 (8) slots 45-52\n    - C2.2 (28) slots 53-80\n- FS (12) slots 81-92\n  - QA (5) slots 93-97\n  - QB (5) slots 98-102\n  - QC (5) slots 103-107\npool of 80 slots, step 5: need 28, free 27\nLab 1 passed\n```\n\nWhy each part:\n\n1. `KVPool.alloc` returns the smallest free slots, so the slot numbers are deterministic and the test can check them.\n2. `_split` gives the middle node the first `n` tokens and the first `n` slots. The lock count and the access time are copied, because the same requests use the new middle node.\n3. `match_prefix` splits at most once, at the end of the match, as SGLang's `match_prefix` does. After that, the matched prefix ends exactly at a node.\n4. `insert` releases our slots for any part that another request inserted first. In this example nothing is released, because each request matches before it allocates.\n5. Step 5 needs $20 - 16 + 24 = 28$ slots, and the pool of 80 has $80 - 53 = 27$ free. Without eviction the request cannot run."
}
```

## 6. Lab 2: reference counts and LRU leaf eviction

**Goal.** Add the memory management of [page 05](/notes/papers/llm-serving/2023-sglang-radixattention/05-eviction-and-reference-counts), then reproduce the full nine-step trace with a pool of 80 slots.

**Steps.**

1. `inc_lock_ref(node)`: walk from the node to the root and add 1 to `lock_ref` on every node. Return the change of the evictable size: minus the length of every node whose count went from 0 to 1. `dec_lock_ref(node)` does the reverse.
2. `evict(num_tokens)`: put every leaf with `lock_ref == 0` into a heap keyed by `(last_access, creation number)`. Pop the oldest, release its slots, delete it. If its parent is now an unlocked leaf, push the parent. Stop when `num_tokens` slots are free.
3. `run_batch_lru`: match and lock every request of the batch first. If the batch needs more slots than are free, evict the difference. Then allocate, insert each request, and unlock it.
4. Add steps 8, 9a and 9b. Step 8 is chat 1 turn 3: C1.2 again, then 4 + 4 new tokens. Step 9a is the frontend hint FS + SCQ (3 tokens) with no output. Step 9b is four samples of 3 tokens each.

**Acceptance tests.**

1. Evictions: step 5 C1.2 (29), step 8 C2.2 (28) then C2.1 (8), step 9a QA (5), step 9b QB (5) then QC (5). No other evictions.
2. Cached tokens after each step: 16, 45, 53, 52, 69, 79, 80, 78, 80.
3. Before the eviction of step 8, with chat 1's path locked: protected size 16, evictable size 63, `inc_lock_ref` returns $-16$, 1 slot free. So Algorithm 1 sees $63 + 1 = 64 \geq 37$ available slots.
4. After every step: no slot appears in two nodes, the slots in the tree plus the free slots equal 80, and every `lock_ref` is 0.
5. Matched prompt tokens: 152 of 236, a hit rate of about 64.4%.

> [!example] Hint level 1: the idea
> Only a leaf can go, because an inner node's KV is the prefix of its children. A locked node is in use by a running request, so it cannot go either. When a leaf goes, its parent can become a leaf. That is why the parent enters the heap again.

> [!example] Hint level 2: pseudocode
> 1. `heap = [(n.last_access, n.serial, n) for leaves with lock_ref == 0]`, then `heapify`.
> 2. While `freed < num_tokens` and the heap is not empty: pop `x`, `pool.release(x.value)`, `freed += len(x.value)`, `del x.parent.children[x.key[0]]`. If `x.parent` is not the root, has no children and is unlocked, push it.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/12-reproduce-it)

```check
{
  "question": "Lab 2: show a reference solution",
  "answer": "This solution extends Lab 1. Run the Lab 1 code first.\n\n```python\nimport heapq\n\n\nclass LRURadixCache(RadixCache):\n    \"\"\"Lab 1's cache plus reference counts and LRU leaf eviction.\"\"\"\n\n    def inc_lock_ref(self, node):\n        \"\"\"Lock the path from node to the root. Return the change of the evictable size.\"\"\"\n        delta = 0\n        while node is not self.root:\n            if node.lock_ref == 0:\n                delta -= len(node.key)       # these tokens stop being evictable\n            node.lock_ref += 1\n            node = node.parent\n        return delta\n\n    def dec_lock_ref(self, node):\n        while node is not self.root:\n            node.lock_ref -= 1\n            node = node.parent\n\n    def evictable_size(self):\n        return sum(len(n.key) for n in self.nodes() if n.lock_ref == 0)\n\n    def protected_size(self):\n        return sum(len(n.key) for n in self.nodes() if n.lock_ref > 0)\n\n    def evict(self, num_tokens):\n        \"\"\"Evict least recently used unlocked leaves until num_tokens slots are free.\"\"\"\n        heap = [(n.last_access, n.serial, n) for n in self.nodes()\n                if not n.children and n.lock_ref == 0]       # older first, then created first\n        heapq.heapify(heap)\n        evicted, freed = [], 0\n        while freed < num_tokens and heap:\n            _, _, x = heapq.heappop(heap)\n            self.pool.release(x.value)\n            freed += len(x.value)\n            del x.parent.children[x.key[0]]\n            evicted.append((label(x), len(x.key)))\n            p = x.parent\n            if p is not self.root and not p.children and p.lock_ref == 0:\n                heapq.heappush(heap, (p.last_access, p.serial, p))   # the parent became a leaf\n        return evicted\n\n\ndef run_batch_lru(cache, requests, now):\n    \"\"\"Match and lock every request, evict if needed, allocate, run, insert, unlock.\"\"\"\n    plan = []\n    for prompt, output in requests:\n        matched, node, prefix_slots = cache.match_prefix(prompt, now)\n        cache.inc_lock_ref(node)\n        plan.append((prompt, output, matched, node, prefix_slots))\n    need = sum(len(p) - m + len(o) for p, o, m, _, _ in plan)\n    evicted = []\n    if need > cache.pool.available():\n        evicted = cache.evict(need - cache.pool.available())\n    new_slots = [cache.pool.alloc(len(p) - m + len(o)) for p, o, m, _, _ in plan]\n    for (prompt, output, matched, node, prefix_slots), new in zip(plan, new_slots):\n        cache.insert(prompt + output, prefix_slots + new, now)   # the request finished\n        cache.dec_lock_ref(node)\n    return [m for _, _, m, _, _ in plan], evicted\n\n\nU3, A3, SCQ = toks(\"u3_\", 4), toks(\"a3_\", 4), toks(\"scq\", 3)\nS = [toks(f\"s{k}_\", 3) for k in range(1, 5)]\nNAMES.update({\"u3_0\": \"3\", \"scq0\": \"SCQ\", **{f\"s{k}_0\": f\"S{k}\" for k in range(1, 5)}})\n\nALL_STEPS = STEPS_2_TO_7 + [\n    (8, [(SYS + U1 + A1 + U2 + A2 + U3, A3)]),\n    (9.0, [(FS + SCQ, ())]),                       # the frontend hint: the prefix first\n    (9.5, [(FS + SCQ, s) for s in S]),             # the four samples\n]\n\n\ndef test_lab2():\n    cache = LRURadixCache(KVPool(80))\n    trace, hits, prompts = [], 0, 0\n    for step, reqs in ALL_STEPS:\n        if step == 8:                              # Algorithm 1's view before step 8\n            m, node, _ = cache.match_prefix(reqs[0][0], now=step)\n            delta = cache.inc_lock_ref(node)\n            print(\"step 8 after lock: protected\", cache.protected_size(), \"evictable\",\n                  cache.evictable_size(), \"delta\", delta, \"free\", cache.pool.available())\n            cache.dec_lock_ref(node)\n        matched, evicted = run_batch_lru(cache, reqs, now=step)\n        hits += sum(matched)\n        prompts += sum(len(p) for p, _ in reqs)\n        trace.append((step, matched, evicted, cache.cached_tokens()))\n        print(f\"step {step}: matched {matched} evicted {evicted} cached {cache.cached_tokens()}\")\n        slots = [s for n in cache.nodes() for s in n.value]\n        assert len(slots) == len(set(slots))                     # no slot in two nodes\n        assert len(slots) + cache.pool.available() == 80          # no slot is lost\n        assert all(n.lock_ref == 0 for n in cache.nodes())        # every request unlocked\n    assert [c for *_, c in trace] == [16, 45, 53, 52, 69, 79, 80, 78, 80]\n    assert [e for _, _, e, _ in trace] == [[], [], [], [(\"C1.2\", 29)], [], [],\n                                           [(\"C2.2\", 28), (\"C2.1\", 8)], [(\"QA\", 5)],\n                                           [(\"QB\", 5), (\"QC\", 5)]]\n    assert (hits, prompts) == (152, 236)\n    print(f\"hit rate {hits}/{prompts} = {hits / prompts:.1%}\")\n    show(cache.root)\n    print(\"Lab 2 passed\")\n\n\ntest_lab2()\n```\n\nOutput of `test_lab2()`:\n\n```text\nstep 2: matched [0] evicted [] cached 16\nstep 3: matched [16] evicted [] cached 45\nstep 4: matched [8] evicted [] cached 53\nstep 5: matched [16] evicted [('C1.2', 29)] cached 52\nstep 6: matched [0] evicted [] cached 69\nstep 7: matched [12, 12] evicted [] cached 79\nstep 8 after lock: protected 16 evictable 63 delta -16 free 1\nstep 8: matched [16] evicted [('C2.2', 28), ('C2.1', 8)] cached 80\nstep 9.0: matched [12] evicted [('QA', 5)] cached 78\nstep 9.5: matched [15, 15, 15, 15] evicted [('QB', 5), ('QC', 5)] cached 80\nhit rate 152/236 = 64.4%\n- SYS (8) slots 0-7\n  - C1.1 (8) slots 8-15\n    - C1.2+3 (37) slots 16-43,45-52,79\n- FS (12) slots 44,53-63\n  - SCQ (3) slots 64-66\n    - S1 (3) slots 67-69\n    - S2 (3) slots 70-72\n    - S3 (3) slots 73-75\n    - S4 (3) slots 76-78\nLab 2 passed\n```\n\nRead the trace:\n\n1. Step 5: C1.2 was last used in step 3, and C2.1 is locked by the running request. Evicting C1.2 frees 29 slots, so $27 + 29 = 56 \\geq 28$.\n2. Step 8: SYS and C1.1 are locked, so 16 tokens are protected and 63 are evictable. C2.2 goes first (last use 5), then its parent C2.1 becomes a leaf and goes too: $1 + 28 + 8 = 37$.\n3. Step 9a: QA (last use 6) goes. Step 9b: QB and QC go, both last used in step 7. The creation number orders the tie: QB was created first.\n4. The slot lists show pages of one token at work: FS holds slot 44 and slots 53 to 63, and C1.2+3 holds three separate runs. Any free slot can hold any token.\n5. `evictable_size` and `protected_size` walk the whole tree here. SGLang keeps them as counters and updates them in `inc_lock_ref`, `dec_lock_ref`, insert and evict."
}
```

> [!trap] The real engine always runs the last prompt token
> In step 9b the trace of these notes matches the whole prompt: 15 of 15 tokens. SGLang 0.5.22 caps the matched prefix length at the input length minus 1 (`_compute_max_prefix_len` in `schedule_batch.py`). Its comment says: "the matched length is at most 1 less than the input length to enable logprob computation". The forward pass needs at least one token to produce logits. Check question 2 shows what this one token changes in step 9b.

## 7. Lab 3: FCFS vs LPM vs DFS against cache size

**Goal.** Measure how the order of requests changes the hit rate when the cache is small, as on [page 06](/notes/papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling). Use the cache-only model.

**Steps.**

1. `CacheOnlyTree(capacity)`: wrap Lab 2's tree. `run(prompt, output)` matches the prompt, inserts `prompt + output`, then evicts LRU leaves until at most `capacity` tokens remain. It returns the matched prefix length.
2. A workload, seed 0, in a random arrival order:
    1. 6 few-shot groups. Each group has 120 tokens of examples and 8 questions of 20 tokens, each with a 2-token answer.
    2. 6 chats with one shared 60-token system prompt. Each chat has 4 turns of 30 user tokens and 40 answer tokens. Turn $t+1$ contains the full history, and it cannot run before turn $t$. The answers are fixed in advance, as in a replayed trace.
3. Three policies. **FCFS**: arrival order. **LPM**: each time, run the ready request with the longest matched prefix length, with arrival order on ties. **DFS**: the pre-order of a depth-first walk of the radix tree of all prompts.
4. The ceiling: the hit rate with an infinite cache.
5. Sweep the capacity over 100, 150, 200, 250, 300, 340, 400, 600, 800, 1,200, 1,600, 2,400 and 3,200 tokens.

**Acceptance tests.**

1. 72 requests, 11,400 prompt tokens, and the longest request has 340 tokens.
2. The ceiling is $8{,}940 / 11{,}400 \approx 0.7842$. Check it by hand: 5,040 few-shot hits and 3,900 chat hits.
3. DFS is never worse than FCFS, and DFS equals the ceiling for every capacity of 340 or more (Theorem 3.1).
4. The DFS order keeps the turns of each chat in order.

> [!example] Hint level 1: the idea
> A pre-order walk visits a node before its children. A chat's turn $t$ has a prompt that is a prefix of turn $t+1$'s prompt, so its node is an ancestor. That is why the DFS order never runs a turn too early.

> [!example] Hint level 2: pseudocode
> 1. Build a dictionary trie of all prompts. At the node where a prompt ends, store the request index.
> 2. `visit(node)`: emit the requests stored at the node, then visit the children in order of their first arrival.
> 3. LPM needs a match that does not change the tree. Write a read-only `match_len(root, tokens)` with no split and no time update.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/12-reproduce-it)

```check
{
  "question": "Lab 3: show a reference solution",
  "answer": "This solution reuses Labs 1 and 2. Run their code first.\n\n```python\nimport random\n\n\nclass NoPool:\n    \"\"\"No slot accounting: Labs 3 and 4 count tokens only.\"\"\"\n\n    def release(self, slots):\n        pass\n\n\nclass CacheOnlyTree:\n    \"\"\"Labs 3 and 4: a radix tree of finished tokens, at most `capacity` tokens.\n    A running request does not count against the capacity.\"\"\"\n\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.cache = LRURadixCache(NoPool())     # Lab 2's tree. Only token counts matter here.\n        self.clock = 0\n\n    def run(self, prompt, output):\n        \"\"\"Process one request. Return its cached prompt tokens (a hit).\"\"\"\n        self.clock += 1\n        hit, node, _ = self.cache.match_prefix(prompt, self.clock)\n        seq = prompt + output\n        self.cache.insert(seq, list(range(len(seq))), self.clock)   # slot numbers do not matter here\n        over = self.cache.cached_tokens() - self.capacity\n        if over > 0:\n            self.cache.evict(over)                  # LRU leaves first; the newest leaf goes last\n        return hit\n\n\ndef make_workload(seed=0, groups=6, per_group=8, chats=6, turns=4):\n    \"\"\"Few-shot groups and chats. Returns requests in arrival order.\n    A request is (name, prompt, output, needs): `needs` must run first.\"\"\"\n    rng = random.Random(seed)\n    streams = []\n    for g in range(groups):\n        prefix = toks(f\"g{g}_ex\", 120)                      # shared few-shot examples\n        streams.append([(f\"g{g}q{i}\", prefix + toks(f\"g{g}q{i}_\", 20), toks(f\"g{g}a{i}_\", 2), None)\n                        for i in range(per_group)])\n    system = toks(\"chat_sys\", 60)                           # one system prompt for all chats\n    for c in range(chats):\n        history, reqs = system, []\n        for t in range(turns):\n            prompt = history + toks(f\"c{c}u{t}_\", 30)\n            answer = toks(f\"c{c}a{t}_\", 40)\n            reqs.append((f\"c{c}t{t}\", prompt, answer, f\"c{c}t{t - 1}\" if t else None))\n            history = prompt + answer\n        streams.append(reqs)\n    order = []                                              # random interleaving, each stream in order\n    while any(streams):\n        s = rng.choice([s for s in streams if s])\n        order.append(s.pop(0))\n    return order\n\n\ndef fcfs_order(reqs):\n    return list(reqs)\n\n\ndef dfs_order(reqs):\n    \"\"\"Pre-order depth-first walk of the radix tree of all prompts.\"\"\"\n    trie = {}\n    for idx, (name, prompt, _, _) in enumerate(reqs):\n        node = trie\n        for t in prompt:\n            node = node.setdefault(t, {})\n        node.setdefault(None, []).append(idx)                # requests that end here\n    out = []\n\n    def first_arrival(node):\n        return min(i for key, child in node.items() for i in\n                   (child if key is None else [first_arrival(child)]))\n\n    def visit(node):\n        out.extend(node.get(None, []))\n        for key in sorted((k for k in node if k is not None), key=lambda k: first_arrival(node[k])):\n            visit(node[key])\n\n    visit(trie)\n    return [reqs[i] for i in out]\n\n\ndef simulate(reqs, policy, capacity):\n    \"\"\"Return (cached prompt tokens, prompt tokens) for one policy and one capacity.\"\"\"\n    tree = CacheOnlyTree(capacity)\n    done, hits, total = set(), 0, 0\n    if policy == \"lpm\":\n        waiting = list(reqs)\n        while waiting:\n            ready = [r for r in waiting if r[3] is None or r[3] in done]\n            # longest matched prefix first, arrival order on ties (match without changing the tree)\n            best = max(ready, key=lambda r: (match_len(tree.cache.root, r[1]), -waiting.index(r)))\n            waiting.remove(best)\n            hits += tree.run(best[1], best[2])\n            total += len(best[1])\n            done.add(best[0])\n        return hits, total\n    order = fcfs_order(reqs) if policy == \"fcfs\" else dfs_order(reqs)\n    for name, prompt, output, needs in order:\n        assert needs is None or needs in done              # the order keeps chat turns in order\n        hits += tree.run(prompt, output)\n        total += len(prompt)\n        done.add(name)\n    return hits, total\n\n\ndef match_len(root, tokens):\n    \"\"\"Read-only match: no split, no change of access times.\"\"\"\n    node, i = root, 0\n    while i < len(tokens) and tokens[i] in node.children:\n        child = node.children[tokens[i]]\n        n = 0\n        while n < len(child.key) and i + n < len(tokens) and child.key[n] == tokens[i + n]:\n            n += 1\n        i += n\n        if n < len(child.key):\n            break\n        node = child\n    return i\n\n\ndef test_lab3():\n    reqs = make_workload()\n    longest = max(len(p) + len(o) for _, p, o, _ in reqs)\n    total_prompt = sum(len(p) for _, p, _, _ in reqs)\n    ceiling = simulate(reqs, \"fcfs\", 10**9)[0] / total_prompt\n    print(f\"{len(reqs)} requests, {total_prompt} prompt tokens, longest request {longest}, \"\n          f\"ceiling {ceiling:.3f}\")\n    sizes = [100, 150, 200, 250, 300, 340, 400, 600, 800, 1200, 1600, 2400, 3200]\n    table = {}\n    for policy in (\"fcfs\", \"lpm\", \"dfs\"):\n        table[policy] = [simulate(reqs, policy, c)[0] / total_prompt for c in sizes]\n        print(f\"{policy:5s}\", \" \".join(f\"{h:.3f}\" for h in table[policy]))\n    for i, c in enumerate(sizes):\n        assert table[\"dfs\"][i] >= table[\"fcfs\"][i] - 1e-12\n        if c >= longest:\n            assert abs(table[\"dfs\"][i] - ceiling) < 1e-12    # Theorem 3.1 holds here\n    print(\"Lab 3 passed\")\n    return sizes, table, ceiling\n\n\nsizes, table, ceiling = test_lab3()\n```\n\nOutput:\n\n```text\n72 requests, 11400 prompt tokens, longest request 340, ceiling 0.784\nfcfs  0.000 0.080 0.096 0.111 0.180 0.180 0.217 0.352 0.397 0.556 0.643 0.763 0.784\nlpm   0.000 0.674 0.747 0.747 0.784 0.784 0.784 0.784 0.784 0.784 0.784 0.784 0.784\ndfs   0.000 0.674 0.747 0.747 0.784 0.784 0.784 0.784 0.784 0.784 0.784 0.784 0.784\nLab 3 passed\n```\n\nNotes on the code:\n\n1. `NoPool` makes the tree count tokens only. Slot numbers do not matter in the cache-only model.\n2. `CacheOnlyTree.run` inserts first and evicts after. The newest leaf has the newest access time, so it goes last.\n3. `match_len` is read-only. LPM must compare candidates without splitting nodes or refreshing their access times.\n4. `dfs_order` stores request indices at the trie node where each prompt ends, and it emits them before the children. A chat turn's prompt is a prefix of the next turn's prompt, so the order respects the chats.\n5. LPM re-evaluates the matches after every request, because each run changes the tree. The paper's Algorithm 1 sorts once per scheduling round."
}
```

The measured numbers of the reference solution, seed 0:

| Cache size (tokens) | 100 | 150 | 200 | 250 | 300 | 340 | 400 | 600 | 800 | 1,200 | 1,600 | 2,400 | 3,200 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FCFS | 0.000 | 0.080 | 0.096 | 0.111 | 0.180 | 0.180 | 0.217 | 0.352 | 0.397 | 0.556 | 0.643 | 0.763 | 0.784 |
| LPM | 0.000 | 0.674 | 0.747 | 0.747 | 0.784 | 0.784 | 0.784 | 0.784 | 0.784 | 0.784 | 0.784 | 0.784 | 0.784 |
| DFS | 0.000 | 0.674 | 0.747 | 0.747 | 0.784 | 0.784 | 0.784 | 0.784 | 0.784 | 0.784 | 0.784 | 0.784 | 0.784 |

```plot
{
  "title": "Hit rate vs cache size: FCFS (red), LPM (gold, under DFS), DFS (blue), infinite-cache ceiling 0.7842 (ink)",
  "xAxis": {"label": "cache size (tokens)", "domain": [0, 3400]},
  "yAxis": {"label": "hit rate", "domain": [0, 0.85]},
  "disableZoom": true,
  "data": [
    {"points": [[100, 0.0], [150, 0.0798], [200, 0.0956], [250, 0.1114], [300, 0.1798], [340, 0.1798], [400, 0.2167], [600, 0.3518], [800, 0.3974], [1200, 0.5561], [1600, 0.643], [2400, 0.7632], [3200, 0.7842]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[100, 0.0], [150, 0.0798], [200, 0.0956], [250, 0.1114], [300, 0.1798], [340, 0.1798], [400, 0.2167], [600, 0.3518], [800, 0.3974], [1200, 0.5561], [1600, 0.643], [2400, 0.7632], [3200, 0.7842]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": false},
    {"points": [[100, 0.0], [150, 0.6737], [200, 0.7474], [250, 0.7474], [300, 0.7842], [340, 0.7842], [400, 0.7842], [600, 0.7842], [800, 0.7842], [1200, 0.7842], [1600, 0.7842], [2400, 0.7842], [3200, 0.7842]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[100, 0.0], [150, 0.6737], [200, 0.7474], [250, 0.7474], [300, 0.7842], [340, 0.7842], [400, 0.7842], [600, 0.7842], [800, 0.7842], [1200, 0.7842], [1600, 0.7842], [2400, 0.7842], [3200, 0.7842]], "fnType": "points", "graphType": "scatter", "color": "#B8860B", "skipTip": false},
    {"points": [[100, 0.0], [150, 0.6737], [200, 0.7474], [250, 0.7474], [300, 0.7842], [340, 0.7842], [400, 0.7842], [600, 0.7842], [800, 0.7842], [1200, 0.7842], [1600, 0.7842], [2400, 0.7842], [3200, 0.7842]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[100, 0.0], [150, 0.6737], [200, 0.7474], [250, 0.7474], [300, 0.7842], [340, 0.7842], [400, 0.7842], [600, 0.7842], [800, 0.7842], [1200, 0.7842], [1600, 0.7842], [2400, 0.7842], [3200, 0.7842]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": false},
    {"fn": "0.7842", "color": "#100D12", "skipTip": true}
  ]
}
```

![Alt text: hit rate against cache size for FCFS in red, LPM in gold and DFS in blue, with the ceiling in ink](/notes/media/papers/2023-sglang-radixattention/figures/12-hit-rate-vs-cache.svg)

Read the result:

1. **At 100 tokens, every policy gets 0.** A few-shot request has 142 tokens and a first chat turn has 130. After the insert, the cache must evict the whole new leaf, so nothing stays.
2. **LPM and DFS are equal at every size.** The paper says that the longest-shared-prefix-first order is equivalent to a DFS order. This workload shows it.
3. **DFS reaches the ceiling already at 300 tokens, below the longest request.** Theorem 3.1 gives a sufficient condition, not a necessary one.
4. **FCFS needs about 3,200 tokens**, almost all unique tokens of the workload, to reach the same hit rate. The order alone is worth a cache about 10 times larger here.

## 8. Lab 4: Theorem 3.1 by brute force

**Goal.** Check the theorem on small batches by trying every order, and find the edge of its condition.

**Steps.**

1. `computed_tokens(prompts, order, capacity)`: run the prompts in the order with `CacheOnlyTree`, without outputs, and return the prefill tokens.
2. `lower_bound(prompts)`: the number of distinct non-empty prefixes, which is the number of tokens in the radix tree of the batch.
3. 300 random batches of 5 prompts, with lengths 2 to 7 over the alphabet `ab`. Capacity = the longest prompt. For each batch, compute the best cost over all $5! = 120$ orders, the DFS cost and the LPM cost.
4. Then search batches with capacity = the longest prompt minus 1 for a batch where DFS is worse than the best order.

**Acceptance tests.**

1. In all 300 batches: the best order computes exactly the lower bound, and DFS and LPM compute the same number.
2. The search finds a counterexample. Explain it by hand.

> [!example] Hint level 1: the idea
> Every token of the tree must be computed at least once, so no order beats the lower bound. DFS reaches it when no edge is evicted while its subtree still needs it. The cache condition protects exactly that.

> [!example] Hint level 2: pseudocode
> 1. `best = min(computed_tokens(p, o, cap) for o in itertools.permutations(range(5)))`.
> 2. Reuse `dfs_order` from Lab 3 with requests `(str(i), prompt, (), None)`.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/12-reproduce-it)

```check
{
  "question": "Lab 4: show a reference solution",
  "answer": "This solution reuses Labs 1 to 3: `CacheOnlyTree`, `match_len` and `dfs_order`. Run their code first.\n\n```python\nimport itertools\nimport random\n\n\ndef computed_tokens(prompts, order, capacity):\n    \"\"\"Prefill tokens of a batch of prompts run one at a time in `order` (cache-only model).\"\"\"\n    tree = CacheOnlyTree(capacity)\n    return sum(len(prompts[i]) - tree.run(prompts[i], ()) for i in order)\n\n\ndef lower_bound(prompts):\n    \"\"\"Every edge of the radix tree of the batch is computed at least once:\n    the number of distinct prefixes = the number of tokens in the tree.\"\"\"\n    return len({p[:k] for p in prompts for k in range(1, len(p) + 1)})\n\n\ndef lpm_order(prompts, capacity):\n    \"\"\"Greedy longest-shared-prefix-first, re-evaluated after every request.\"\"\"\n    tree, left, order = CacheOnlyTree(capacity), list(range(len(prompts))), []\n    while left:\n        best = max(left, key=lambda i: (match_len(tree.cache.root, prompts[i]), -i))\n        left.remove(best)\n        tree.run(prompts[best], ())\n        order.append(best)\n    return order\n\n\ndef random_batch(rng, n=5, alphabet=\"ab\", lo=2, hi=7):\n    return [tuple(rng.choice(alphabet) for _ in range(rng.randint(lo, hi))) for _ in range(n)]\n\n\ndef test_lab4(trials=300, seed=0):\n    rng = random.Random(seed)\n    for _ in range(trials):\n        prompts = random_batch(rng)\n        cap = max(len(p) for p in prompts)            # the condition of Theorem 3.1\n        best = min(computed_tokens(prompts, o, cap) for o in itertools.permutations(range(5)))\n        reqs = [(str(i), p, (), None) for i, p in enumerate(prompts)]\n        dfs = [int(r[0]) for r in dfs_order(reqs)]\n        assert best == lower_bound(prompts)               # the bound is reached\n        assert computed_tokens(prompts, dfs, cap) == best  # DFS reaches it\n        assert computed_tokens(prompts, lpm_order(prompts, cap), cap) == best  # so does LPM\n    print(f\"{trials} random batches: DFS and LPM always reach the lower bound\")\n    # search for a batch where a cache smaller than the longest request breaks DFS\n    for _ in range(5000):\n        prompts = random_batch(rng)\n        cap = max(len(p) for p in prompts) - 1\n        reqs = [(str(i), p, (), None) for i, p in enumerate(prompts)]\n        dfs = [int(r[0]) for r in dfs_order(reqs)]\n        costs = {o: computed_tokens(prompts, o, cap) for o in itertools.permutations(range(5))}\n        best_order = min(costs, key=costs.get)\n        if costs[tuple(dfs)] > costs[best_order]:\n            print(\"counterexample, capacity\", cap)\n            for i, p in enumerate(prompts):\n                print(\"  request\", i, \"\".join(p))\n            print(\"  DFS order\", dfs, \"computes\", costs[tuple(dfs)], \"tokens\")\n            print(\"  best order\", list(best_order), \"computes\", costs[best_order], \"tokens\")\n            print(\"  lower bound\", lower_bound(prompts))\n            break\n    print(\"Lab 4 passed\")\n\n\ntest_lab4()\n```\n\nOutput:\n\n```text\n300 random batches: DFS and LPM always reach the lower bound\ncounterexample, capacity 6\n  request 0 ab\n  request 1 aabb\n  request 2 aaabbaa\n  request 3 baba\n  request 4 aaabaa\n  DFS order [0, 1, 2, 4, 3] computes 18 tokens\n  best order [0, 1, 4, 2, 3] computes 16 tokens\n  lower bound 16\nLab 4 passed\n```\n\n1. `lower_bound` counts distinct prefixes. Each distinct prefix ends at one token of the radix tree of the batch, and that token's KV must be computed at least once.\n2. All 300 batches reach the bound with DFS and with LPM. This is Theorem 3.1 and the equivalence of the two orders, on small batches.\n3. The counterexample has a 7-token request and a capacity of 6. The worked example after this lab explains it step by step."
}
```

> [!example] Worked example: why the counterexample breaks DFS
> Capacity 6 tokens. Prompts: 0 = `ab`, 1 = `aabb`, 2 = `aaabbaa` (7 tokens), 3 = `baba`, 4 = `aaabaa`. Computed in these notes.
>
> 1. Lower bound: the radix tree of the five prompts has 16 tokens.
> 2. DFS runs 0, 1, 2, 4, 3. Prompt 2 has 7 tokens, more than the capacity. After its insert, the cache evicts leaves until 6 or fewer tokens remain. The last leaf to go is prompt 2's own edge `abbaa`, the newest one. Only `aa` stays.
> 3. Prompt 4 then matches only `aa`, although it shares `aaab` with prompt 2. DFS computes $2 + 3 + 5 + 4 + 4 = 18$ tokens.
> 4. The best order runs prompt 4 before prompt 2. Prompt 4 has 6 tokens, so it stays cached, and prompt 2 matches `aaab`. Cost: $2 + 3 + 4 + 3 + 4 = 16$, the lower bound.
> 5. The lesson: SGLang evicts whole nodes. A request longer than the cache loses its whole leaf, including the part that a sibling needs.

## 9. Lab 5: radix tree vs a 16-token hash chain

**Goal.** Measure the tokens that a block-level index loses at block boundaries, compared with the token-level radix tree. [Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) explains the hash chain.

**Steps.**

1. `block_hashes(tokens)`: SHA-256 of `(parent hash, 16 tokens)` for each full block.
2. `chain_hit`: count the leading block hashes that are in the cache set, times 16. Cap it at $\lfloor (\text{len} - 1)/16 \rfloor \times 16$, because the last token must run.
3. `radix_hit`: the matched prefix length in Lab 2's tree, capped at $\text{len} - 1$.
4. Workload, seed 0: 60 templates with random lengths from 20 to 400 tokens, and 400 requests. Each request is a random template plus a unique user part of 10 to 60 tokens. Use an infinite cache for both indexes.

**Acceptance tests.**

1. For every request: `chain_hit <= radix_hit` and `radix_hit - chain_hit <= 15`.
2. For a request whose template was seen before, the radix tree matches the whole template.
3. The total loss equals the sum of `len(template) % 16` over those requests, exactly.

> [!example] Hint level 1: the idea
> A template of $L$ tokens covers $\lfloor L/16 \rfloor$ full blocks. The partial block also holds user tokens, so its hash differs between users. The loss per request is $L \bmod 16$.

> [!example] Hint level 2: pseudocode
> 1. After each request: `radix.insert(prompt, ...)` and `chain.update(block_hashes(prompt))`.
> 2. `expected_loss += len(template) % 16` when the template was seen before.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/12-reproduce-it)

```check
{
  "question": "Lab 5: show a reference solution",
  "answer": "This solution reuses `toks` (Lab 1), `LRURadixCache` (Lab 2), `NoPool` and `match_len` (Lab 3).\n\n```python\nimport hashlib\nimport pickle\nimport random\n\nBLOCK = 16\n\n\ndef block_hashes(tokens):\n    \"\"\"vLLM-style chain: each full block's hash includes its parent's hash.\"\"\"\n    out, parent = [], b\"seed\"\n    for start in range(0, len(tokens) - BLOCK + 1, BLOCK):\n        data = pickle.dumps((parent, tuple(tokens[start:start + BLOCK])))\n        parent = hashlib.sha256(data).digest()\n        out.append(parent)\n    return out\n\n\ndef chain_hit(cache, tokens):\n    \"\"\"Leading full blocks found in the cache, at most len - 1 tokens, block-aligned.\"\"\"\n    hit = 0\n    for h in block_hashes(tokens):\n        if h not in cache:\n            break\n        hit += BLOCK\n    return min(hit, (len(tokens) - 1) // BLOCK * BLOCK)\n\n\ndef radix_hit(cache, tokens):\n    \"\"\"Longest cached prefix, at most len - 1 tokens (the last token must run).\"\"\"\n    return min(match_len(cache.root, tokens), len(tokens) - 1)\n\n\ndef test_lab5(n=400, templates=60, seed=0):\n    rng = random.Random(seed)\n    systems = [toks(f\"t{t}_\", rng.randint(20, 400)) for t in range(templates)]\n    radix, chain = LRURadixCache(NoPool()), set()\n    seen, hits_r, hits_c, prompt_tokens, expected_loss = set(), 0, 0, 0, 0\n    for i in range(n):\n        t = rng.randrange(templates)\n        prompt = systems[t] + toks(f\"r{i}_\", rng.randint(10, 60))   # a unique user part\n        r, c = radix_hit(radix, prompt), chain_hit(chain, prompt)\n        assert c <= r and r - c <= BLOCK - 1          # the chain loses less than one block\n        if t in seen:\n            assert r == len(systems[t])               # the radix tree matches the whole template\n            expected_loss += len(systems[t]) % BLOCK\n        seen.add(t)\n        hits_r, hits_c, prompt_tokens = hits_r + r, hits_c + c, prompt_tokens + len(prompt)\n        radix.insert(prompt, list(range(len(prompt))))\n        chain.update(block_hashes(prompt))\n    assert hits_r - hits_c == expected_loss\n    repeats = n - len(seen)\n    print(f\"radix tree hit rate {hits_r / prompt_tokens:.4f}, 16-token chain {hits_c / prompt_tokens:.4f}\")\n    print(f\"tokens lost at block boundaries: {hits_r - hits_c}, \"\n          f\"{(hits_r - hits_c) / repeats:.2f} per repeated template (about (16 - 1) / 2 = 7.5)\")\n    print(\"Lab 5 passed\")\n\n\ntest_lab5()\n```\n\nOutput:\n\n```text\nradix tree hit rate 0.7355, 16-token chain 0.7088\ntokens lost at block boundaries: 2740, 8.06 per repeated template (about (16 - 1) / 2 = 7.5)\nLab 5 passed\n```\n\n1. Both indexes cap the hit at the prompt length minus 1, because the last prompt token must run to produce logits. The chain also rounds down to a block boundary.\n2. The measured loss per repeated template is 8.06 tokens, not exactly 7.5. The 60 template lengths are random, and their residues modulo 16 are not perfectly even. The exact identity in the test holds anyway.\n3. The loss is a property of the block size, not of hashing. A radix tree with pages of 16 tokens loses the same tokens."
}
```

## 10. Lab 6: the log-sum-exp merge of extend attention

**Goal.** Rebuild in NumPy the attention split of [page 11](/notes/papers/llm-serving/2023-sglang-radixattention/11-limits-and-later-work). New tokens attend causally to each other and fully to the cached prefix, and two attention states merge exactly.

**Steps.**

1. `attention_state(Q, K, V, causal_offset=None)`: outputs `[n, dv]` and the LSE per row `[n]`. With `causal_offset=c`, query row $r$ sees only key columns $\leq r + c$.
2. `merge(O_a, lse_a, O_b, lse_b)`: row by row, with weights $e^{\ell}$, shifted by the larger LSE.
3. **Extend:** $P$ cached tokens and $S$ new tokens. Part 1: the new queries against the new keys, causal. Part 2: the new queries against the prefix keys, with no mask. Merge. Compare with full causal attention over all $P + S$ tokens, rows $P$ to $P + S - 1$.
4. **Shared-prefix decode:** $N = 8$ sequences, one query each, a shared prefix of 64 tokens and their own suffixes. Compute the prefix part for all 8 queries with one matrix product. Count the prefix bytes read.
5. **Order:** merge three parts in two different orders.

**Acceptance tests.**

1. 200 random extend cases: the merge equals full causal attention within $10^{-12}$.
2. Every shared-prefix decode output equals its own full attention within $10^{-12}$, and the batched prefix part reads 8 times fewer bytes.
3. Both merge orders equal full attention within $10^{-12}$.

> [!example] Hint level 1: the idea
> Keep the LSE of each part. A part's output times $e^{\ell}$ is its unnormalized sum, and unnormalized sums add.

> [!example] Hint level 2: pseudocode
> 1. `S = Q @ K.T / sqrt(d)`. For a causal part: `S[cols > rows + c] = -inf`.
> 2. `m = S.max(1)`, `P = exp(S - m)`, `lse = m + log(P.sum(1))`, `O = (P / P.sum(1)) @ V`.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/12-reproduce-it)

```check
{
  "question": "Lab 6: show a reference solution",
  "answer": "NumPy only. No earlier lab is needed.\n\n```python\nimport numpy as np\n\n\ndef attention_state(Q, K, V, causal_offset=None):\n    \"\"\"Attention of the rows of Q over one part of the keys.\n    Returns (O, lse): normalized outputs [n, dv] and log-sum-exp per row [n].\n    causal_offset=c: query row r sees only key columns <= r + c.\"\"\"\n    S = Q @ K.T / np.sqrt(Q.shape[1])\n    if causal_offset is not None:\n        rows, cols = np.indices(S.shape)\n        S = np.where(cols <= rows + causal_offset, S, -np.inf)\n    m = S.max(axis=1, keepdims=True)\n    P = np.exp(S - m)\n    lse = m[:, 0] + np.log(P.sum(axis=1))\n    return (P / P.sum(axis=1, keepdims=True)) @ V, lse\n\n\ndef merge(O_a, lse_a, O_b, lse_b):\n    \"\"\"Merge two attention states, row by row, with weights exp(lse).\"\"\"\n    m = np.maximum(lse_a, lse_b)\n    w_a, w_b = np.exp(lse_a - m)[:, None], np.exp(lse_b - m)[:, None]\n    return (w_a * O_a + w_b * O_b) / (w_a + w_b), m + np.log(w_a[:, 0] + w_b[:, 0])\n\n\ndef test_lab6(seed=0):\n    rng = np.random.default_rng(seed)\n    d = 16\n    # 1. Extend: S new tokens attend to a cached prefix of P tokens and causally to each other\n    for _ in range(200):\n        P, S = int(rng.integers(1, 50)), int(rng.integers(1, 20))\n        Q, K, V = (rng.normal(size=(P + S, d)) * 2 for _ in range(3))\n        ref, _ = attention_state(Q, K, V, causal_offset=0)        # full causal attention\n        O1, l1 = attention_state(Q[P:], K[P:], V[P:], causal_offset=0)  # new tokens, causal\n        O2, l2 = attention_state(Q[P:], K[:P], V[:P])                    # cached prefix, all seen\n        O, _ = merge(O1, l1, O2, l2)\n        assert np.allclose(O, ref[P:], atol=1e-12, rtol=0)\n    # 2. Shared-prefix decode: N sequences, one query each, a shared prefix and own suffixes\n    N, P = 8, 64\n    Kp, Vp = rng.normal(size=(P, d)), rng.normal(size=(P, d))\n    Qd = rng.normal(size=(N, d))                                   # one decode query per sequence\n    suffix = [(rng.normal(size=(L, d)), rng.normal(size=(L, d))) for L in rng.integers(1, 30, N)]\n    O_pre, l_pre = attention_state(Qd, Kp, Vp)                     # ONE matrix-matrix product\n    for i, (Ks, Vs) in enumerate(suffix):\n        O_suf, l_suf = attention_state(Qd[i:i + 1], Ks, Vs)        # per sequence\n        O, _ = merge(O_pre[i:i + 1], l_pre[i:i + 1], O_suf, l_suf)\n        ref, _ = attention_state(Qd[i:i + 1], np.vstack([Kp, Ks]), np.vstack([Vp, Vs]))\n        assert np.allclose(O, ref, atol=1e-12, rtol=0)\n    per_seq = N * 2 * Kp.nbytes                                    # each sequence reads K and V\n    batched = 2 * Kp.nbytes                                        # read once for all N queries\n    print(f\"prefix bytes read: per sequence {per_seq}, batched {batched}, ratio {per_seq // batched}\")\n    # 3. The merge is associative and commutative: three parts in any order\n    Q3, K3, V3 = rng.normal(size=(4, d)), rng.normal(size=(30, d)), rng.normal(size=(30, d))\n    parts = [attention_state(Q3, K3[a:b], V3[a:b]) for a, b in [(0, 7), (7, 19), (19, 30)]]\n    left = merge(*merge(*parts[0], *parts[1]), *parts[2])\n    right = merge(*parts[2], *merge(*parts[1], *parts[0]))\n    full, _ = attention_state(Q3, K3, V3)\n    assert np.allclose(left[0], full, atol=1e-12) and np.allclose(right[0], full, atol=1e-12)\n    print(\"Lab 6 passed\")\n\n\ntest_lab6()\n```\n\nOutput:\n\n```text\nprefix bytes read: per sequence 131072, batched 16384, ratio 8\nLab 6 passed\n```\n\n1. `causal_offset=0` on the new tokens gives each new token its own causal row. The prefix part needs no mask, because every cached token comes before every new token. This is the `causal=causal` and `causal=False` pair of SGLang's FlashInfer extend path.\n2. In part 2, `attention_state(Qd, Kp, Vp)` is one matrix product for all 8 queries. The byte count is 8 times smaller than 8 separate reads, as in Hydragen.\n3. The tolerance $10^{-12}$ holds because the merge is exact. Only float64 rounding remains."
}
```

## 11. Lab 7 (optional): read the cache counters of a real SGLang server

> [!note] Needs a GPU, not run in these notes
> This lab needs an NVIDIA GPU with enough memory for the model. The commands, flags, endpoints, metric names and the log line below were read in the SGLang 0.5.22 source on 2026-10-19. Flags change between versions, so check `sglang serve --help` on your version. Only the parser at the end runs without a GPU.

**Goal.** Find the radix cache of the paper in a running server. Measure the cached tokens of one request, the hit rate of the scheduler and the effect of the scheduling policy.

**Steps.**

1. **Serve with metrics.** `sglang serve` is the recommended entry point in 0.5.22. `python -m sglang.launch_server` still works, with a warning that recommends `sglang serve`.

```bash
sglang serve --model-path meta-llama/Llama-3.1-8B-Instruct --port 30000 --enable-metrics
```

2. **Two identical prompts.** Send the same 1,000 token ids twice to the native endpoint `POST /generate` with `{"input_ids": [...], "sampling_params": {"max_new_tokens": 8, "temperature": 0}}`. Read `meta_info.prompt_tokens` and `meta_info.cached_tokens` in each response.
3. **The scheduler log.** Each prefill batch logs a line that starts with `Prefill batch, #new-seq: ..., #new-token: ..., #cached-token: ...`. `#new-token` counts the prompt tokens that this batch computes, and `#cached-token` the matched ones.
4. **The metrics.** Read `http://127.0.0.1:30000/metrics`: the gauge `sglang:cache_hit_rate` ("The prefix cache hit rate.") and the counters `sglang:cached_tokens_total` (label `cache_source`) and `sglang:prompt_tokens_total`.
5. **Reset between runs.** `POST /flush_cache` empties the radix cache when no request runs or waits.
6. **Policies under pressure.** Restart with a small pool, `--max-total-tokens 20000`, once with `--schedule-policy fcfs` and once with `--schedule-policy lpm`. Then run the shared-prefix benchmark twice: once with all 256 requests at once, and once with `--max-concurrency 64`.

```bash
python -m sglang.benchmark.serving --backend sglang --port 30000 \
  --dataset-name generated-shared-prefix --gsp-num-groups 16 \
  --gsp-prompts-per-group 16 --gsp-system-prompt-len 2048 \
  --gsp-question-len 128 --gsp-output-len 64 --flush-cache
```

7. **Without the cache.** Restart with `--disable-radix-cache` and run the benchmark once more.

**Acceptance tests (predictions to check).**

1. The first request reports `cached_tokens` 0. The second reports 999: the matched prefix length is capped at 1,000 − 1 with page size 1. With a larger page size $P$, expect $\lfloor 999/P \rfloor \times P$.
2. For each prefill log line, $\text{cached} / (\text{new} + \text{cached})$ is the per-batch hit rate that the gauge reports. The gauge does not count the tokens of retracted requests.
3. `sglang:cached_tokens_total` divided by `sglang:prompt_tokens_total` is the hit rate of the paper's definition, over the life of the server.
4. With all 256 requests waiting at once, expect `lpm` to behave like `fcfs`, because the queue holds more than 128 requests. With `--max-concurrency 64`, expect `lpm` to reach a higher hit rate than `fcfs`. These are predictions of these notes, not measurements.
5. With `--disable-radix-cache`, `cached_tokens` stays 0.

> [!example] Hint level 1: the idea
> The `/metrics` page is plain text: a name, optional labels in braces, and a value. A counter's sample name ends with `_total`. Sum one name over all its label sets.

> [!example] Hint level 2: pseudocode
> 1. For each line that does not start with `#`: match `name{labels} value` with a regular expression. Remove a trailing `_total`. Add the value to `out[name]`.
> 2. For the log: `re.search(r"#cached-token: (\d+)", line)` and the same for `#new-token`.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/12-reproduce-it)

```check
{
  "question": "Lab 7: show a reference solution",
  "answer": "The parser runs without a GPU. `run_on_gpu()` needs the server of step 1.\n\n```python\nimport json\nimport re\nimport urllib.request\n\nWATCH = [\"sglang:cache_hit_rate\", \"sglang:cached_tokens\", \"sglang:prompt_tokens\"]\n\n\ndef parse_prometheus(text, names=WATCH):\n    \"\"\"Sum each metric over its label sets. A counter's sample name ends with _total.\"\"\"\n    out = {}\n    for line in text.splitlines():\n        if line.startswith(\"#\") or not line.strip():\n            continue\n        m = re.match(r\"^([a-zA-Z_:][a-zA-Z0-9_:]*)(\\{[^}]*\\})?\\s+(\\S+)\", line)\n        if not m:\n            continue\n        name = m.group(1)\n        base = name[:-6] if name.endswith(\"_total\") else name\n        if base in names:\n            out[base] = out.get(base, 0.0) + float(m.group(3))\n    return out\n\n\ndef parse_prefill_log(line):\n    \"\"\"'Prefill batch, ... #new-token: N, #cached-token: M, ...' -> (N, M, M / (N + M)).\"\"\"\n    new = int(re.search(r\"#new-token: (\\d+)\", line).group(1))\n    hit = int(re.search(r\"#cached-token: (\\d+)\", line).group(1))\n    return new, hit, hit / (new + hit) if new + hit else 0.0\n\n\ndef generate(input_ids, url=\"http://127.0.0.1:30000/generate\"):\n    \"\"\"Send token ids to the native endpoint. Return (prompt_tokens, cached_tokens).\"\"\"\n    body = {\"input_ids\": input_ids, \"sampling_params\": {\"max_new_tokens\": 8, \"temperature\": 0}}\n    req = urllib.request.Request(url, json.dumps(body).encode(), {\"Content-Type\": \"application/json\"})\n    meta = json.loads(urllib.request.urlopen(req, timeout=120).read())[\"meta_info\"]\n    return meta[\"prompt_tokens\"], meta[\"cached_tokens\"]\n\n\ndef run_on_gpu():\n    \"\"\"Needs a running server. Two identical prompts of 1,000 token ids.\"\"\"\n    ids = list(range(1000, 2000))\n    print(\"first:\", generate(ids))\n    print(\"second:\", generate(ids))\n    text = urllib.request.urlopen(\"http://127.0.0.1:30000/metrics\").read().decode()\n    m = parse_prometheus(text)\n    print(m, \"lifetime hit rate:\", m[\"sglang:cached_tokens\"] / m[\"sglang:prompt_tokens\"])\n\n\ndef test_lab7_offline():\n    from prometheus_client import CollectorRegistry, Counter, Gauge, generate_latest\n    reg = CollectorRegistry()\n    labels = [\"model_name\", \"engine_type\", \"tp_rank\"]\n    Gauge(\"sglang:cache_hit_rate\", \"The prefix cache hit rate.\", labels,\n          registry=reg).labels(\"test\", \"test\", \"0\").set(0.998)\n    cached = Counter(\"sglang:cached_tokens_total\", \"Number of cached prompt tokens by source (device/host/storage).\",\n                     labels + [\"cache_source\"], registry=reg)\n    cached.labels(\"test\", \"test\", \"0\", \"device\").inc(999)\n    prompt = Counter(\"sglang:prompt_tokens_total\", \"Number of prefill tokens processed.\",\n                     labels + [\"is_streaming\"], registry=reg)\n    prompt.labels(\"test\", \"test\", \"0\", \"false\").inc(2000)\n    sample = generate_latest(reg).decode()\n    assert \"sglang:cached_tokens_total{\" in sample\n    got = parse_prometheus(sample)\n    assert got == {\"sglang:cache_hit_rate\": 0.998, \"sglang:cached_tokens\": 999.0,\n                   \"sglang:prompt_tokens\": 2000.0}, got\n    line = \"Prefill batch, #new-seq: 1, #new-token: 1, #cached-token: 999, \"\n    assert parse_prefill_log(line) == (1, 999, 0.999)\n    print(\"lifetime hit rate in the sample:\", got[\"sglang:cached_tokens\"] / got[\"sglang:prompt_tokens\"])\n    print(\"Lab 7 offline checks passed\")\n\n\ntest_lab7_offline()\n```\n\nOutput of the offline test:\n\n```text\nlifetime hit rate in the sample: 0.4995\nLab 7 offline checks passed\n```\n\n1. The offline test builds a sample with `prometheus_client`, the library that SGLang's metrics use. The label values `test` are sample values, not values that SGLang writes.\n2. A counter that SGLang names `sglang:cached_tokens_total` appears in the exposition with the `_total` suffix. The parser removes it, so the key is `sglang:cached_tokens`.\n3. `input_ids` gives exact control of the prompt length. A text prompt would pass the chat template and the tokenizer first.\n4. Expected result on a GPU, page size 1: `first: (1000, 0)` and `second: (1000, 999)`. This is a prediction of these notes from `_compute_max_prefix_len`, not a measurement."
}
```

## 12. Questions to answer in your README

1. In Lab 2, why must every request of a batch be locked before the first eviction?
2. In Lab 3, why does FCFS need a cache almost as large as the whole workload?
3. In Lab 4, which part of SGLang's eviction rule creates the counterexample?
4. In Lab 5, what is the expected loss per request when template lengths are spread evenly modulo 16?
5. In Lab 7, why does the second identical request not report 1,000 cached tokens?

## 13. This works. Would you deploy it?

Your cache is correct and small. A production cache needs more. Check each item:

- [ ] Does the tree avoid a Python loop per token? SGLang 0.5.22 uses a galloping slice compare and a Rust tree core by default ([page 11](/notes/papers/llm-serving/2023-sglang-radixattention/11-limits-and-later-work)).
- [ ] Does it keep counters of evictable and protected tokens, instead of a walk of the whole tree as in Lab 2?
- [ ] Does the scheduler bound the cost of sorting the waiting queue?
- [ ] Does the cache namespace tenants and LoRA adapters ([page 10](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today))?
- [ ] Does the server expose hit rates and evictions as metrics?
- [ ] Do the tests run in CI without a GPU?

## 14. Common mistakes

1. **"A split copies the slots."** A split divides one slot list at one position. No KV moves, and no slot is copied.
2. **"Lock only the last node of a request."** The whole path to the root must be locked. Otherwise a parent can be evicted while a child is in use.
3. **"Evict before locking the batch."** The eviction can then remove the prefix that a request of the same batch just matched.
4. **"Evict any node with reference count 0."** Only leaves can go. An inner node holds the prefix of its children.
5. **"FCFS and LPM differ only a little."** In Lab 3, LPM reaches 0.674 at 150 tokens, where FCFS gets 0.080.
6. **"Theorem 3.1 says DFS is always best."** It needs a cache at least as large as the longest request. Lab 4 breaks it with one token less.
7. **"The whole prompt can match."** SGLang 0.5.22 caps the matched prefix length at the input length minus 1.
8. **"Lab 3 reproduces Figure 13 of the paper."** It uses a synthetic workload and no batching. It shows the mechanism, not the paper's numbers.

## 15. One-minute explanation

The labs rebuild RadixAttention from the bottom. Lab 1 is a radix tree on the CPU whose nodes hold slot indices into a KV pool. A split divides the slot list, and a match can end at any token. Lab 2 adds reference counts along the whole path and LRU leaf eviction. It reproduces the nine-step example exactly: 152 of 236 prompt tokens matched, with every eviction in order. Lab 3 shows that order matters: at 150 tokens of cache, LPM and DFS reach a hit rate of 0.674 while FCFS gets 0.080. Lab 4 checks Theorem 3.1 against all 120 orders of 300 random batches, and it breaks DFS with a cache one token too small. Lab 5 shows that a 16-token hash chain loses each template's length modulo 16. Lab 6 proves the log-sum-exp merge in NumPy, which SGLang uses for extend attention. Lab 7 finds the same ideas in a real server: 999 cached tokens of 1,000, because the last token always runs.

## 16. Check questions

```check
{
  "question": "Interview follow-up: in Lab 2, step 8 needs 37 slots and only 1 is free. Walk through the available size of Algorithm 1 and the eviction, node by node. Why do C1.1 and the few-shot leaves survive?",
  "hint": "Lock first, then evict the oldest unlocked leaf, and push its parent if the parent became a leaf.",
  "answer": "1. The request matches SYS and C1.1: 16 tokens. Its prompt has 49 tokens and its output 4, so it needs $49 - 16 + 4 = 37$ new slots.\n2. Locking the path moves 16 tokens from evictable to protected. `inc_lock_ref` returns $-16$. Evictable: $79 - 16 = 63$. Free: $80 - 79 = 1$. Algorithm 1 sees $63 + 1 = 64 \\geq 37$, so the request fits.\n3. The heap of unlocked leaves: C2.2 (last use 5), QA (6), QB (7), QC (7). C1.1 is a leaf too, but it is locked.\n4. Pop C2.2: $1 + 28 = 29 < 37$. Its parent C2.1 is now an unlocked leaf with last use 5, so it enters the heap.\n5. Pop C2.1: $29 + 8 = 37$. Stop.\n\nC1.1 survives because the running request locks it. QA, QB and QC survive because they are newer than C2.1. After the step, the cache holds 80 tokens and 0 slots are free."
}
```

```check
{
  "question": "Interview follow-up: apply SGLang 0.5.22's rule that the matched prefix length is at most the input length minus 1. Which steps of the nine-step trace change, and what happens in step 9b?",
  "hint": "Only a request whose whole prompt is cached is affected.",
  "answer": "Only step 9b changes. In every other step the match is already shorter than the prompt minus 1. In step 9a the hint prompt has 15 tokens and matches 12.\n\nStep 9b, computed in these notes with Lab 2's code and `prompt[:len(prompt) - 1]` as the key:\n\n1. Each sample matches 14 of 15 tokens: FS (12) and the first 2 tokens of SCQ. The match ends inside SCQ, so SCQ splits into 2 + 1 tokens.\n2. Each sample needs $1 + 3 = 4$ new slots, 16 in total. 2 are free.\n3. LRU evicts QB and QC (last use 7): $2 + 10 = 12 < 16$. The next oldest leaf is C1.2+3 (last use 8). It goes: 37 tokens of chat 1's history.\n4. At insert, each sample finds the last SCQ token already cached, so its own copy is a duplicate. 4 duplicate slots are released.\n5. Cached after the step: 43 tokens, not 80. Matched in total: 148 of 236, about 62.7%, not 152.\n\nThe lesson: one token per request changes the memory demand, and LRU then evicts an unrelated chat. Real engines always run the last prompt token, because the forward pass must produce its logits."
}
```

```check
{
  "question": "In Lab 3, why does every policy reach a hit rate of 0 at a cache of 100 tokens? Why does LPM reach 0.674 at 150 tokens while FCFS gets only 0.080?",
  "answer": "**100 tokens.** A few-shot request inserts $120 + 20 + 2 = 142$ tokens and a first chat turn inserts $90 + 40 = 130$. Both are more than 100, and eviction removes whole leaves. So after each insert, the new leaf itself is evicted, and nothing stays to match.\n\n**150 tokens.** One few-shot request fits. LPM then picks the requests of the same group one after the other, because they match 120 tokens. All $6 \\times 7 \\times 120 = 5{,}040$ few-shot hits happen, plus 2,640 chat hits: 7,680 of 11,400, about 0.674. FCFS interleaves groups and chats in arrival order. The next request of a group usually arrives after other requests have evicted its prefix. FCFS gets only 600 few-shot hits and 310 chat hits: 910 in total, about 0.080. Computed in these notes."
}
```

```check
{
  "question": "Interview follow-up: prove that no order can compute fewer tokens than Lab 4's lower bound. Then explain where the DFS proof needs the cache size.",
  "answer": "**The bound.** Take the radix tree of all prompts of the batch. Every token of the tree is the last token of exactly one distinct prefix. The KV of that token depends on that whole prefix, so no other prefix can supply it. The cache starts without it, so some request must compute it at least once. The number of tokens in the tree is therefore a lower bound for every order.\n\n**DFS meets it.** In DFS order, when an edge is computed for the first time, the whole subtree below it runs next. Each request of the subtree then finds the edge cached, and no request after the subtree needs it. So each edge is computed exactly once, if it is not evicted while its subtree runs.\n\n**The cache size.** The edge stays cached if the cache can hold the whole current root-to-leaf path. The paper's condition, a cache size of at least the maximum request length, guarantees this. Lab 4's counterexample breaks it: a 7-token request in a 6-token cache loses its whole leaf, including the part `ab` that its sibling needs. A better order runs the 6-token sibling first."
}
```

```check
{
  "question": "In Lab 5, a template has 1,000 tokens. How many tokens does each repeat lose with 16-token blocks, and with a radix tree whose page size is 64? Why is the expected loss about 7.5 tokens for random template lengths?",
  "answer": "1. Blocks of 16: $1{,}000 \\bmod 16 = 8$ tokens lost per repeat. The chain hits $992$ tokens.\n2. Page size 64: $1{,}000 \\bmod 64 = 40$ tokens lost. The radix tree hits $960$ tokens, because SGLang truncates keys to whole pages.\n3. For random lengths, $L \\bmod 16$ is about evenly spread over $0, 1, \\dots, 15$. Its mean is $(0 + 15)/2 = 7.5$. Lab 5 measured 8.06 per repeat, because 60 random templates do not spread perfectly evenly. For page size $P$, the expected loss is about $(P - 1)/2$."
}
```

```check
{
  "question": "Interview follow-up: in Lab 7, the second identical request of 1,000 tokens should report 999 cached tokens, not 1,000. Explain why. What should a client expect from cached_tokens / prompt_tokens for short prompts and for larger pages?",
  "answer": "**Why 999.** A cache stores keys and values, not logits. The first output token needs the logits of the last prompt token, and only a forward pass produces them. So SGLang 0.5.22 caps the matched prefix length at the input length minus 1 (`_compute_max_prefix_len` in `schedule_batch.py`). The comment says that the cap enables logprob computation. vLLM has the same rule ([prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse), section 5.5).\n\n**Short prompts.** A fully cached prompt of $n$ tokens reports at most $(n - 1)/n$. For $n = 10$ that is 90%, not 100%.\n\n**Larger pages.** With page size $P$, the match is also rounded down to whole pages: $\\lfloor (n - 1)/P \\rfloor \\times P$. For $n = 1{,}000$ and $P = 128$: 896 cached tokens, so 104 tokens run again."
}
```

## 17. Links

- Previous: [11 Limits and later work](/notes/papers/llm-serving/2023-sglang-radixattention/11-limits-and-later-work)
- The paper card: [SGLang and RadixAttention](/notes/papers/llm-serving/2023-sglang-radixattention)
- The paper on one page: [00 The paper on one page](/notes/papers/llm-serving/2023-sglang-radixattention/00-paper-on-one-page)
- Tries and radix trees: [01 Background: tries and radix trees](/notes/papers/llm-serving/2023-sglang-radixattention/01-background-tries-and-radix-trees)
- The data structure for Lab 1: [04 RadixAttention: the tree of KV caches](/notes/papers/llm-serving/2023-sglang-radixattention/04-radixattention-the-tree-of-kv-caches)
- Eviction for Lab 2: [05 Eviction and reference counts](/notes/papers/llm-serving/2023-sglang-radixattention/05-eviction-and-reference-counts)
- Scheduling for Labs 3 and 4: [06 Cache-aware scheduling and the DFS theorem](/notes/papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling)
- The real code for Lab 7: [10 RadixAttention in SGLang today](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today)
- The hash chain for Lab 5: [Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)
- The same kind of page for PagedAttention: [PagedAttention 11 Reproduce it](/notes/papers/llm-serving/2023-pagedattention/11-reproduce-it)
- Metrics: [Latency and throughput metrics](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)

### Sources

All sources were checked on 2026-10-19.

- [Zheng et al., SGLang, arXiv 2312.07104](https://arxiv.org/abs/2312.07104): Algorithm 1, Theorem 3.1, Figure 3.
- [SGLang 0.5.22 on PyPI](https://pypi.org/project/sglang/0.5.22/): the source files that this page cites.
    - `launch_server.py` and `cli/main.py`: the entry points.
    - `srt/arg_groups/fields/`: the flags `--enable-metrics`, `--schedule-policy`, `--max-total-tokens` and `--disable-radix-cache`.
    - `srt/managers/schedule_batch.py`: `_compute_max_prefix_len`.
    - `srt/managers/schedule_policy.py`: the queue limit of 128.
    - `srt/managers/scheduler_components/metrics_reporter.py`: the prefill log line.
    - `srt/observability/metrics_collector.py`: the metric names.
    - `srt/entrypoints/http_server.py`: `/generate` and `/flush_cache`.
    - `benchmark/serving.py` and `benchmark/datasets/generated_shared_prefix.py`: the benchmark flags.
- [Juravsky et al., Hydragen, arXiv 2402.05099](https://arxiv.org/abs/2402.05099): the prefix and suffix split for Lab 6.
- [FlashInfer docs: merge attention states](https://docs.flashinfer.ai/api/python/cascade.html)
