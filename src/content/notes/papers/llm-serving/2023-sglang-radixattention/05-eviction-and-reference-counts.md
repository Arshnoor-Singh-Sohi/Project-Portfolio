---
title: "05 Eviction and reference counts"
order: 5
summary: "Why cached KV and running requests share one pool, how LRU leaf eviction keeps every cached node's prefix intact, how reference counts protect the paths of running requests, and what the eviction loop of SGLang 0.5.22 does line by line. The step-8 eviction of the running example is replayed in Python."
status: not-started
tags: [radixattention, sglang, kv-cache, eviction, lru, reference-count, radix-tree]
---

## 1. The question this page answers

[Page 04](/notes/papers/llm-serving/2023-sglang-radixattention/04-radixattention-the-tree-of-kv-caches) keeps the KV of every finished request in a radix tree. The tree only holds slot numbers. The keys and values themselves sit in the KV pool on the GPU, and the KV pool has a fixed number of slots. Sooner or later a new request needs slots that cached tokens occupy. Then the system must evict some cached KV.

An interviewer who hears "RadixAttention" will probe exactly this part. These are the questions of this page:

1. Why does the cache have no fixed size, and when does eviction run?
2. Which node is evicted first, and why only a leaf?
3. How does the system know that a running request still reads a node?
4. What do `evictable_size`, `protected_size` and a negative "delta" mean?
5. What does the eviction loop of SGLang 0.5.22 do, line by line?
6. Which other eviction policies exist today, and what does one eviction cost?

The paper answers the core in two sentences (§3): "we introduce a simple LRU eviction policy that evicts the least recently used leaf first", and each node keeps a reference counter of "how many running requests are using it". The rest of this page unpacks those two sentences.

## 2. Mental model

> [!analogy] Cleaning a shared folder tree on a full disk
> A team shares one disk. Files sit in nested folders: a project folder holds chapter folders, and those hold drafts. When the disk is full, the admin deletes the draft that nobody opened for the longest time. A folder can go only when it is empty, because the drafts inside need their folder. A folder that someone has open carries a tag with a counter of open users, and the admin never deletes a tagged folder. The shared top folders survive longest, because every draft below them keeps them in use.
>
> **Where it stops working:** a deleted file is lost, but evicted KV can always be computed again from the tokens. So eviction costs time, not data. A folder is useful without its parent folder, but a node's KV is useless without the KV of all its ancestors. The admin can also empty a folder file by file. SGLang frees a whole node at once and never merges a parent with its last child.

## 3. Terms

| Term | Plain meaning |
|---|---|
| KV pool | The GPU memory that holds keys and values, divided into token slots. Cached tokens and running requests share it. |
| slot | One token's key and value entry in the KV pool, in every layer. A tree node stores slot numbers. |
| evict | Remove a node from the radix tree and return its slots to the free list of the KV pool. |
| LRU | Least recently used. The policy that evicts the item whose last use is the oldest. |
| `last_access_time` | The time stamp of a node. A match or an insert that walks through the node refreshes it. |
| leaf | A node without children. Only a leaf can be evicted. |
| evictable leaf | A leaf with reference count 0. SGLang keeps all of them in the set `evictable_leaves`. |
| reference count | The number of running requests whose matched path contains the node. The paper calls it "reference counter", SGLang calls it `lock_ref`. |
| lock, unlock | Add 1 to (or subtract 1 from) the reference count of every node from a node up to the root. SGLang: `inc_lock_ref`, `dec_lock_ref`. |
| evictable size | The number of cached tokens in nodes with reference count 0. Eviction can free at most this many slots. |
| protected size | The number of cached tokens in nodes with reference count above 0. |
| delta | The change of the evictable size that a lock causes. It is 0 or negative. |
| min-heap | A data structure that always returns its smallest item first, in $O(\log n)$ time per removal. |
| eviction policy | The rule that orders the evictable leaves: LRU, LFU, SLRU, priority, TLRU and others. |
| prefix-closed | Property of the cached set: if a node is cached, all its ancestors are cached too. |
| orphan | A node whose parent was removed. No match can reach it, so its slots are wasted. |
| recomputation | Computing an evicted prefix again with prefill when a later request needs it. |
| retraction | SGLang's removal of a running request from the batch when decoding needs more slots than exist. |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. Why eviction is needed

### 4.1 One pool for the cache and the running batch

The paper does not reserve memory for the cache: "we do not preallocate a fixed-size memory pool as a cache" (§3). Cached tokens and running requests use the same KV pool. At any moment, each slot of the pool is in one of four states.

| State of a slot | Who owns it | Can the system take it now? |
|---|---|---|
| free | nobody | yes |
| cached, reference count 0 | a tree node that no running request uses | yes, after it evicts the node |
| cached, reference count above 0 | a tree node on the path of a running request | no |
| running | the new tokens of a running request, not yet in the tree | no |

The paper states the consequence: "When enough waiting requests run, the system will evict all cached tokens in favor of a larger batch size." So the running batch always wins. The cache only uses memory that the running batch does not need at the moment.

> [!key] Cached KV lives in otherwise idle memory
> A cached token costs nothing until a running request needs its slot. Then the cache gives the slot back. There is no cache size to tune, and the cache can grow to the whole pool when the server is quiet.

Interpretation of these notes: a fixed split would waste memory in both directions. Suppose 40 of 80 slots were reserved for the cache. On a busy server the running batch could never use those 40 slots, even if they held only stale prefixes. On a quiet server the cache could never grow past 40 slots, even if 80 were free.

### 4.2 The pool of the running example before step 8

The running example of page 04 uses a KV pool of 80 slots, page size 1, and the nine steps of the paper's Figure 3. The token counts and the pool size are choices of these notes.

> [!example] Worked example: why step 8 needs eviction
> 1. After step 7 the tree holds SYS (8), C1.1 (8), C2.1 (8), C2.2 (28), FS (12), QA, QB, QC (5 each). Cached: $8 + 8 + 8 + 28 + 12 + 3 \times 5 = 79$ tokens.
> 2. Free slots: $80 - 79 = 1$.
> 3. Step 8 is turn 3 of chat 1. Its prompt has 49 tokens. The tree matches SYS and C1.1: 16 tokens.
> 4. New prompt tokens: $49 - 16 = 33$. Output tokens: 4. Slots needed: $33 + 4 = 37$.
> 5. $37 > 1$, so the system must free at least $37 - 1 = 36$ slots by eviction.

C1.2, the 29-token second turn of chat 1, is not in the tree any more. Step 5 evicted it. Section 10 counts what that eviction costs at step 8.

### 4.3 When eviction runs

Eviction is lazy. Nothing is evicted while free slots remain. In the paper, Algorithm 1 calls `T.evict(needed_size)` only when an allocation for the batch fails ([page 06](/notes/papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling) explains the whole algorithm).

SGLang 0.5.22 does the same. The allocator asks the tree for the shortfall only (`mem_cache/allocator/base.py`, `evict_to_free_tokens`):

```python
        shortfall = num_tokens - self.available_size()
        if shortfall > 0:
            tree_cache.evict_for_alloc(EvictParams(num_tokens=shortfall))
```

For a plain radix cache, `evict_for_alloc` calls `evict` (`base_prefix_cache.py`). At step 8 the shortfall is $37 - 1 = 36$ tokens.

## 5. LRU from zero

### 5.1 The question every cache must answer

A cache is a small fast memory that keeps copies of things that may be needed again. When it is full and a new item must enter, the cache must choose a victim. The perfect victim is the item whose next use lies furthest in the future. Nobody knows the future, so every policy is a guess.

### 5.2 Recency as a guess

LRU means "least recently used". It evicts the item whose last use is the oldest. The guess behind it: an item used a moment ago is likely to be used again soon. An item unused for a long time is not. This pattern is called temporal locality.

Interpretation of these notes for LLM serving: the next turn of a chat often arrives seconds after the last answer. The requests of one few-shot batch arrive together. A system prompt that nobody used for an hour is a poor bet. LRU fails on a scan: a burst of one-off prompts makes a valuable but older prefix the oldest item, and LRU evicts it. Section 9 shows the policies that SGLang 0.5.22 offers against that.

### 5.3 A tiny LRU on four items

The next program runs LRU with room for 3 items on the accesses A, B, C, A, D, A. An `OrderedDict` keeps the items from oldest use to newest use.

```python
from collections import OrderedDict

def run_lru(capacity, accesses):
    cache = OrderedDict()                    # oldest use first, newest use last
    hits = 0
    for item in accesses:
        if item in cache:
            cache.move_to_end(item)          # a hit makes the item the newest
            hits += 1
            print(f"{item}: hit               cache = {list(cache)}")
            continue
        victim = None
        if len(cache) == capacity:
            victim, _ = cache.popitem(last=False)   # evict the least recently used
        cache[item] = True
        note = f"evict {victim}" if victim else "no eviction"
        print(f"{item}: miss, {note:12s} cache = {list(cache)}")
    print("hits:", hits, "of", len(accesses))

run_lru(3, ["A", "B", "C", "A", "D", "A"])
```

Output:

```text
A: miss, no eviction  cache = ['A']
B: miss, no eviction  cache = ['A', 'B']
C: miss, no eviction  cache = ['A', 'B', 'C']
A: hit               cache = ['B', 'C', 'A']
D: miss, evict B      cache = ['C', 'A', 'D']
A: hit               cache = ['C', 'D', 'A']
hits: 2 of 6
```

Line by line:

1. `move_to_end(item)` on a hit makes the item the newest. This one line is the difference between LRU and FIFO.
2. `popitem(last=False)` removes the oldest item, which is the least recently used one.
3. At the access to D, the cache holds B, C, A in use order. B is the oldest, so B goes. A survives because its hit at the fourth access refreshed it.
4. The last access hits A. Total: 2 hits of 6.

FIFO (first in, first out) evicts the oldest insert and ignores hits. On the same accesses it evicts A at the access to D and misses A at the end: 1 hit of 6. These notes ran a FIFO version to confirm that count.

### 5.4 What "use" means for a tree node

In SGLang 0.5.22 every node has a `last_access_time`. Two operations refresh it on the whole path they walk (`radix_cache.py`):

1. `_match_prefix_helper`: every node that the match walks gets the current time.
2. `_insert_helper`: every node that the insert walks gets the current time, and a new node starts with it.

So "recently used" means "recently matched or inserted". A match that ends deep in the tree refreshes all ancestors at once.

> [!note] Parents are never older than their children
> Interpretation of these notes: every walk starts at the root, so it refreshes a parent whenever it refreshes a child. In plain LRU a parent therefore has a time at least as new as each child. LRU alone would still allow ties between a parent and its child. Other policies, such as LFU or priority, can rank a parent below its child. So the rule "leaves only" must be a separate structural rule, and section 6 explains why it is needed.

## 6. Why leaves first

### 6.1 A node is useful only with all its ancestors

The key and value of token $i$ depend on tokens 1 to $i$ ([page 02](/notes/papers/llm-serving/2023-sglang-radixattention/02-background-prefix-sharing-in-lm-programs) and [L1: Why the KV cache exists](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists)). A node's KV was computed after the tokens of all its ancestors. A request can reuse a node only if it also reuses every ancestor, because a match always starts at the root and walks down.

From this follows the invariant of the cache:

> [!key] The invariant
> If a node is cached, all its ancestors are cached. The set of cached nodes is prefix-closed.

Evicting a leaf keeps the invariant, because no node has the leaf as an ancestor. Evicting an internal node breaks it.

### 6.2 What goes wrong if a parent goes first

![Alt text: the step-7 tree twice, with leaf-first eviction of C2.2 and C2.1 on the left and orphans after evicting SYS on the right](/notes/media/papers/2023-sglang-radixattention/figures/05-leaves-first.svg)

The right side of the figure evicts SYS first. Its 8 slots return to the pool. But C1.1, C2.1 and C2.2 still hold $8 + 8 + 28 = 44$ slots. A match starts at the root and finds no child that begins with the system prompt, so it can never reach these three nodes. Their slots are a memory leak until some cleanup finds them.

The left side evicts leaves only. It removes C2.2 and then C2.1. SYS and C1.1 stay, and every cached node keeps its whole prefix.

### 6.3 Shared ancestors survive longest

The paper describes the effect: evicting leaves first lets common ancestors stay "until those ancestors become leaves and are also evicted" (§3). A node shared by many requests has many descendants. It becomes a leaf only after all of them are gone.

The running example shows it. SYS is shared by both chats. At step 8 both nodes of chat 2 are evicted, but SYS stays, because C1.1 is still its child. The few-shot node FS behaves the same way at step 9: QA, QB and QC go, FS stays.

### 6.4 The leaf rule in SGLang 0.5.22

> [!note] Which SGLang class this page reads
> The code on this page is from `RadixCache` in `radix_cache.py`, the single-component implementation. The default server class of SGLang 0.5.22 is `UnifiedRadixCache`. It evicts from a heap of evictable leaves with the same strategy objects, and its tree core is compiled Rust ([page 10](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today), section 4.2).

SGLang 0.5.22 keeps the set `evictable_leaves` up to date after every change. Two short helpers do it (`radix_cache.py`):

```python
    def _delete_leaf(self, node):
        key = node.key.child_key(self.page_size)
        v = node.parent.children.pop(key, None)
        assert v == node, f"parent does not have child key, {key}"

        self.evictable_size_ -= len(node.key)
        if node in self.evictable_leaves:
            self.evictable_leaves.remove(node)
        self._update_leaf_status(node.parent)

    def _update_leaf_status(self, node: TreeNode):
        if node.evicted or node.lock_ref > 0:
            if node in self.evictable_leaves:
                self.evictable_leaves.remove(node)
            return

        for child in node.children.values():
            if not child.evicted:
                if node in self.evictable_leaves:
                    self.evictable_leaves.remove(node)
                return

        if node not in self.evictable_leaves:
            self.evictable_leaves.add(node)
```

What the lines do:

1. `_delete_leaf` removes the child entry from the parent's dictionary. The key is the child's first token, or its first page when the page size is above 1.
2. It subtracts the node's length from `evictable_size_`. An evicted node can only have had reference count 0.
3. It calls `_update_leaf_status(node.parent)`, because the parent may have just become a leaf.
4. `_update_leaf_status` removes a node from the set if it is evicted or locked (`lock_ref > 0`).
5. It also removes the node if any child is still cached. So only childless, unlocked, cached nodes stay in the set.

> [!note] No merge after a delete
> `_delete_leaf` never merges a parent with its only remaining child. After step 8, SYS (8) has one child, C1.1 (8). They stay two nodes, not one edge of 16 tokens. Interpretation of these notes: a merge would cost a concatenation of the slot lists. Also, a later request that shares only the system prompt would split the edge again.

## 7. Reference counts

### 7.1 What "in use" means

A running request reads the keys and values of its whole matched prefix in prefill and in every decode step. They sit in the slots of the nodes on its matched path. If eviction freed those slots, the allocator could give them to another request. That request would overwrite them, and the first request would read wrong keys and values without any error.

So the system must know which nodes running requests use. The paper: each node keeps a reference counter of "how many running requests are using it", and a node can be evicted only if its counter is zero (§3). SGLang 0.5.22 names the field `lock_ref`. The rest of these notes say "reference count".

### 7.2 Lock the whole path

At admission, the scheduler adds 1 to the reference count of every node from the request's last matched node up to the root. Algorithm 1 calls this `T.increase_ref_counter(req.prefix_node)`. SGLang 0.5.22 calls it `inc_lock_ref(node)`. When the request finishes, the reverse operation subtracts 1 on the same path.

Why the whole path, and not only the last matched node? Leaf-first eviction would already keep the ancestors while the last node exists, because they are never leaves. Interpretation of these notes, two reasons:

1. **Exact accounting.** The scheduler needs the number of tokens that eviction can really free. With a lock on the last node only, the ancestors would have reference count 0 and would count as evictable. But they can never be evicted while the locked node exists. The scheduler would overestimate the free memory and admit too much.
2. **Splits stay correct.** When a match splits a locked node, the new parent must also be locked. SGLang's `_split_node` copies the count: `new_node.lock_ref = child.lock_ref`. This copy is correct only because every node on a locked path carries the lock.

With the whole path locked, a node's reference count equals the number of running requests whose path contains it.

### 7.3 `inc_lock_ref` in SGLang 0.5.22

```python
    def inc_lock_ref(self, node: TreeNode) -> IncLockRefResult:
        if self.disable:
            return IncLockRefResult(delta=0)

        delta = 0
        while node != self.root_node:
            if node.lock_ref == 0:
                self.evictable_size_ -= len(node.key)
                self.protected_size_ += len(node.key)
                delta -= len(node.key)
            node.lock_ref += 1
            self._update_leaf_status(node)
            node = node.parent
        return IncLockRefResult(delta=delta)
```

Line by line (`radix_cache.py`, SGLang 0.5.22):

1. `while node != self.root_node`: walk up to the root. The root itself is never counted. `reset()` gives the root `lock_ref = 1`, so the root can never become an evictable leaf.
2. `if node.lock_ref == 0`: only the first lock on a node changes the sizes. A second running request on the same node changes nothing.
3. The node's length moves from `evictable_size_` to `protected_size_`.
4. `delta -= len(node.key)`: the delta collects the tokens that stopped being evictable. It is therefore 0 or negative.
5. `node.lock_ref += 1` and `_update_leaf_status(node)`: a locked node leaves the set of evictable leaves.

`dec_lock_ref` is the mirror image. It moves a node's length back to `evictable_size_` when its count goes from 1 to 0, and returns a positive delta.

### 7.4 Why the delta is negative, and who uses it

Algorithm 1 starts a scheduling round with `available_size = T.evictable_size() + P.available_size()`: free slots plus slots that eviction could free. After it admits a request, it adds the delta: `available_size = available_size + delta`. The locked tokens can no longer be evicted, so the available memory shrinks by exactly the newly locked tokens. A request that shares an already locked path adds delta 0. [Page 06](/notes/papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling) runs this loop.

SGLang 0.5.22 gets the same effect without a delta variable. Its admission budget reads `available_size() + evictable_size()` live, so a lock lowers the budget at once (`mem_cache/prefill_budget.py`). During admission it even locks the matched node for a moment. The source comment says: "The temporary pin excludes this prefix from the evictable budget."

> [!example] Worked example: the sizes at step 8
> 1. Before scheduling, no request runs. All 79 cached tokens have reference count 0: evictable 79, protected 0, free 1.
> 2. `inc_lock_ref(C1.1)` visits C1.1: count 0 to 1, evictable $79 - 8 = 71$, protected 8, delta $-8$.
> 3. It visits SYS: count 0 to 1, evictable $71 - 8 = 63$, protected 16, delta $-16$. Then it reaches the root and stops.
> 4. Algorithm 1 view: available $= 79 + 1 = 80$ before the lock, and $80 + (-16) = 64$ after it. The request needs 37, and $37 < 80$, so it was admitted.
> 5. Eviction frees 36 slots from C2.2 and C2.1: evictable $63 - 36 = 27$, free $1 + 36 = 37$.
> 6. The request takes all 37 free slots. When it finishes, its 37 new tokens enter the tree as node C1.2+3: evictable $27 + 37 = 64$.
> 7. `dec_lock_ref(C1.1)` returns delta $+16$: evictable $64 + 16 = 80$, protected 0, free 0.

The four samples of step 9b show the "first lock only" rule:

> [!example] Worked example: four requests on one path (step 9b)
> 1. After step 9a the tree holds 78 tokens and 2 slots are free. The path FS (12) then SCQ (3) is unlocked.
> 2. Sample 1 locks SCQ and FS: both counts go from 0 to 1. Delta $= -(3 + 12) = -15$. Evictable $78 - 15 = 63$, protected 15.
> 3. Samples 2, 3 and 4 lock the same path. The counts go to 2, 3 and 4. Each delta is 0, and the sizes do not move.
> 4. Each sample needs 3 output slots: $4 \times 3 = 12$. The shortfall is $12 - 2 = 10$. Eviction removes QB and QC ($5 + 5 = 10$), the least recently used leaves (last use step 7).
> 5. FS and SCQ survive because they are locked. C1.2+3 (last use step 8) survives because QB and QC are older.

![Alt text: step 9b with FS and SCQ locked at reference count 4, the four lock deltas, and pool bars before and after eviction](/notes/media/papers/2023-sglang-radixattention/figures/05-reference-counts.svg)

### 7.5 Where SGLang 0.5.22 locks and unlocks

| Moment | Code (SGLang 0.5.22) | What happens |
|---|---|---|
| admission | `PrefillAdder._commit_prefill_admission` in `managers/schedule_policy.py` | `req.lock = self.tree_cache.lock(req.last_node)` |
| the lock itself | `BasePrefixCache.lock` in `mem_cache/base_prefix_cache.py` | wraps `inc_lock_ref(node)` and keeps a receipt |
| finish | `release_kv_cache` in `mem_cache/common.py` | inserts the tokens (`checkpoint`), frees the rest of the request's row, then `tree_cache.unlock(req.lock)` |
| the unlock itself | `BasePrefixCache.unlock` | calls `dec_lock_ref` with the receipt |

One detail of the insert differs from the paper's picture of one new node per request. `_insert_cache` can insert the prompt a second time to split the new leaf at the prompt boundary. The source comment: "Split the leaf at the prompt boundary so eviction can drop the output KV without the prompt". The prompt part also gets a priority 1 higher, which matters for the `priority` policy of section 9.

## 8. The eviction loop

### 8.1 `evict` in SGLang 0.5.22

```python
        num_tokens = params.num_tokens
        leaves = list(self.evictable_leaves)
        eviction_heap = [
            (self.eviction_strategy.get_priority(node), node) for node in leaves
        ]
        heapq.heapify(eviction_heap)

        num_evicted = 0
        while num_evicted < num_tokens and len(eviction_heap):
            _priority, x = heapq.heappop(eviction_heap)

            # Tree values are page-aligned copies of a kv row: page-exact segment.
            self.token_to_kv_pool_allocator.free_segment(x.value, start_pos=0)
            num_evicted += len(x.value)
            self._delete_leaf(x)

            if len(x.parent.children) == 0 and x.parent.lock_ref == 0:
                new_priority = self.eviction_strategy.get_priority(x.parent)
                heapq.heappush(eviction_heap, (new_priority, x.parent))

            self.kv_events.record_remove(x)
```

This is the body of `RadixCache.evict` in `radix_cache.py` without its first and last lines (a disabled-cache check, a timer and metrics).

### 8.2 Line by line

1. `leaves = list(self.evictable_leaves)`: the candidates are exactly the evictable leaves. Locked nodes and internal nodes are never candidates.
2. `get_priority(node)` computes the sort key of the policy. For LRU it is `node.last_access_time` (`evict_policy.py`). A smaller key means "evict earlier".
3. `heapq.heapify` builds a min-heap in $O(L)$ time for $L$ candidates. Each `heappop` takes $O(\log L)$.
4. `while num_evicted < num_tokens and len(eviction_heap)`: stop when enough tokens are freed, or when no candidate is left.
5. `free_segment(x.value, ...)`: the node's slot numbers return to the KV pool allocator. No tensor is copied or erased. The slots are simply free for the next allocation.
6. `num_evicted += len(x.value)`: a whole node is evicted, never a part of it.
7. `_delete_leaf(x)`: remove the node from its parent and update the sizes (section 6.4).
8. The `if`: when the parent lost its last child and is unlocked, it is now a leaf. It enters the same heap with its own key. This is how the loop climbs the tree.
9. `record_remove(x)`: an optional event for external KV event consumers.

> [!trap] The heap is built per call, from a maintained set
> SGLang does not keep a global sorted LRU list. It maintains only the set `evictable_leaves`, cheaply, at every lock, unlock, insert and delete. The heap exists only inside `evict`. Interpretation of these notes: most scheduling rounds do not evict at all, so a sorted structure would cost work on every access for little use.

### 8.3 The same loop in Python, on the running example

The next class mirrors the SGLang structures in a few lines. Children are keyed by node name instead of first token, and time is the step number. It is written for these notes.

```python
import heapq

class Node:
    def __init__(self, name, parent=None, slots=(), t=0):
        self.name, self.parent, self.value = name, parent, list(slots)
        self.children = {}                      # SGLang keys children by first token
        self.lock_ref = 0                       # the paper's reference counter
        self.last_access_time = t

    def __lt__(self, other):                    # tie-break inside the heap, as in SGLang
        return self.last_access_time < other.last_access_time


class Cache:
    def __init__(self, capacity):
        self.free = list(range(capacity))       # free slots of the KV pool
        self.root = Node("root")
        self.root.lock_ref = 1                  # SGLang locks the root once: never evicted
        self.evictable_size = 0                 # cached tokens with lock_ref == 0
        self.protected_size = 0                 # cached tokens with lock_ref > 0
        self.evictable_leaves = set()

    def alloc(self, n):                         # take n free slots
        out, self.free = self.free[:n], self.free[n:]
        return out

    def add(self, parent, name, slots, t):      # insert a new leaf with these slots
        x = Node(name, parent, slots, t)
        parent.children[name] = x
        self.evictable_size += len(slots)
        self.update_leaf(parent)
        self.update_leaf(x)
        return x

    def update_leaf(self, x):                   # SGLang: _update_leaf_status
        if x.lock_ref == 0 and not x.children:
            self.evictable_leaves.add(x)
        else:
            self.evictable_leaves.discard(x)

    def inc_lock_ref(self, x):
        delta = 0
        while x is not self.root:
            if x.lock_ref == 0:                 # 0 -> 1: the node stops being evictable
                self.evictable_size -= len(x.value)
                self.protected_size += len(x.value)
                delta -= len(x.value)
            x.lock_ref += 1
            self.update_leaf(x)
            x = x.parent
        return delta

    def dec_lock_ref(self, x):
        delta = 0
        while x is not self.root:
            if x.lock_ref == 1:                 # 1 -> 0: the node is evictable again
                self.evictable_size += len(x.value)
                self.protected_size -= len(x.value)
                delta += len(x.value)
            x.lock_ref -= 1
            self.update_leaf(x)
            x = x.parent
        return delta

    def evict(self, num_tokens):
        heap = [(x.last_access_time, x) for x in self.evictable_leaves]
        heapq.heapify(heap)
        num_evicted, order = 0, []
        while num_evicted < num_tokens and heap:
            _, x = heapq.heappop(heap)          # the least recently used leaf
            self.free += x.value                # return its slots to the pool
            num_evicted += len(x.value)
            del x.parent.children[x.name]       # delete the leaf
            self.evictable_size -= len(x.value)
            self.evictable_leaves.discard(x)
            self.update_leaf(x.parent)
            if not x.parent.children and x.parent.lock_ref == 0:
                heapq.heappush(heap, (x.parent.last_access_time, x.parent))
            order.append(f"{x.name} ({len(x.value)}, t={x.last_access_time})")
        return num_evicted, order
```

The next program runs after the class above. It builds the tree after step 7 and runs step 8. The last access times are the steps of the trace in [page 04](/notes/papers/llm-serving/2023-sglang-radixattention/04-radixattention-the-tree-of-kv-caches).

```python
c = Cache(80)                                   # the KV pool of the running example
SYS = c.add(c.root, "SYS", c.alloc(8), t=5)     # the tree after step 7
C11 = c.add(SYS, "C1.1", c.alloc(8), t=3)
C21 = c.add(SYS, "C2.1", c.alloc(8), t=5)
C22 = c.add(C21, "C2.2", c.alloc(28), t=5)
FS = c.add(c.root, "FS", c.alloc(12), t=7)
for name, t in [("QA", 6), ("QB", 7), ("QC", 7)]:
    c.add(FS, name, c.alloc(5), t)

def sizes(label):
    print(f"{label:24s} free={len(c.free):2d} evictable={c.evictable_size:2d} "
          f"protected={c.protected_size:2d}")

sizes("after step 7")
for x in (SYS, C11):                            # step 8: the match refreshes the path
    x.last_access_time = 8
delta = c.inc_lock_ref(C11)                     # lock SYS and C1.1 (16 tokens)
sizes(f"locked, delta={delta}")
need = (49 - 16) + 4                            # new prompt tokens + output tokens
num, order = c.evict(need - len(c.free))        # evict only the shortfall: 37 - 1
print("evicted", num, "tokens:", ", ".join(order))
sizes("after eviction")
slots = c.alloc(need)                           # the running request takes 37 slots
sizes("request running")
c.add(C11, "C1.2+3", slots, t=8)                # finish: the slots move into the tree
print("unlock delta:", c.dec_lock_ref(C11))
sizes("after step 8")
```

Output:

```text
after step 7             free= 1 evictable=79 protected= 0
locked, delta=-16        free= 1 evictable=63 protected=16
evicted 36 tokens: C2.2 (28, t=5), C2.1 (8, t=5)
after eviction           free=37 evictable=27 protected=16
request running          free= 0 evictable=27 protected=16
unlock delta: 16
after step 8             free= 0 evictable=80 protected= 0
```

What the output shows:

1. Before the lock, all 79 cached tokens are evictable. The lock moves 16 tokens to protected and returns delta $-16$.
2. `evict(36)` builds the heap from four evictable leaves: C2.2 (t=5), QA (t=6), QB (t=7), QC (t=7). C1.1 is a leaf too, but it is locked, so it is not a candidate.
3. It pops C2.2 and frees 28 slots: $28 < 36$. C2.1 has no child now and is unlocked, so it enters the heap with t=5.
4. It pops C2.1 and frees 8 more: $28 + 8 = 36$. The loop stops. The few-shot leaves survive.
5. The request takes the 37 free slots. At the finish, the same 37 slot numbers become the value of the new node C1.2+3. Nothing is copied.
6. The unlock returns $+16$, and all 80 cached tokens are evictable again.

![Alt text: the step-8 eviction heap in three panels, where C2.2 and then C2.1 are popped and the free slots grow from 1 to 37](/notes/media/papers/2023-sglang-radixattention/figures/05-eviction-heap.svg)

```video
{
  "src": "/notes/media/papers/2023-sglang-radixattention/manim/r03-lru-leaf-eviction.mp4",
  "caption": "Step 8 of the running example: the locked path SYS and C1.1 is protected, the heap pops the least recently used leaf C2.2, its parent C2.1 becomes a leaf and goes next, and the pool reaches the 37 free slots the request needs."
}
```

### 8.4 Edge cases an interviewer asks about

1. **Not enough evictable tokens.** If every leaf is locked, the heap empties before `num_evicted` reaches the target. `evict` returns fewer tokens than asked. Algorithm 1 avoids this case, because it admits a request only if the batch fits in free plus evictable slots.
2. **A whole node, even if one slot would do.** At step 5 the shortfall was 1 slot ($28 - 27$). Eviction still freed all 29 slots of C1.2. A node is the smallest unit of eviction.
3. **Ties.** QB and QC both have t=7. The heap then compares the nodes with `TreeNode.__lt__`, which also compares `last_access_time`. The order among equal times is arbitrary, and both go in step 9b anyway.
4. **A leaf that looks old.** Before the step-8 match, C1.1 had t=3, the oldest time in the tree. The match refreshed it to 8 and locked it. The lock, not the time, is the guarantee: a policy that ignores recency still cannot evict a locked node.
5. **Decode reaches the slot limit.** Eviction frees only cached tokens. If a growing running batch still needs more, SGLang 0.5.22 removes running requests from the batch with `retract_decode` (`managers/schedule_batch.py`, docstring: "Retract the decoding requests when there is not enough memory."). This plays the role of preemption in vLLM ([PagedAttention page 07](/notes/papers/llm-serving/2023-pagedattention/07-scheduling-and-preemption)).

## 9. Other eviction policies in SGLang 0.5.22

The paper uses LRU only. SGLang 0.5.22 keeps the same loop and changes only the key of the heap. Each strategy in `evict_policy.py` has one method, `get_priority(node)`. The smallest key is evicted first.

| Policy | Key (smallest first) | On the CLI | When it helps |
|---|---|---|---|
| `lru` | `last_access_time` | yes, the default | general serving |
| `lfu` | `(hit_count, last_access_time)` | yes | a few prompts are reused far more than the rest |
| `slru` | `(is_protected, last_access_time)`, protected when `hit_count >= protected_threshold` (default 2) | yes | a one-off prefix must not displace a proven one |
| `priority` | `(priority, last_access_time)` | yes | priority scheduling, so the cache follows the same ranking |
| `tlru` | `(-1 if the node is "TEL-safe" else 0, last_access_time)` | yes | multi-turn or agent traffic where tail time to first token matters |
| `fifo` | `creation_time` | no | experiments |
| `mru` | `-last_access_time` | no | experiments |
| `filo` | `-creation_time` | no | experiments |

Sources: the keys are from `evict_policy.py` and the registry `_EVICTION_POLICY_FACTORIES` in `mem_cache/utils.py`. The CLI choices are `lru`, `lfu`, `slru`, `priority` and `tlru` (`arg_groups/choices.py`), with `lru` as the default (`arg_groups/fields/memory.py`, checked on 2026-10-19). The column "When it helps" paraphrases the SGLang documentation page on radix eviction policies. That page also says that `fifo`, `mru` and `filo` are not on the command line and serve experiments. It also says that `tlru` requires the unified radix cache (checked on 2026-10-19).

Details that interviewers like:

1. **What `hit_count` counts.** `_insert_helper` increases it when an insert walks through a node and the request inserts tokens beyond its earlier inserts. A match alone does not change it. So `hit_count` counts inserts through the node, not matches.
2. **Tuning.** `--radix-eviction-policy-config` takes a JSON object. For example, `slru` takes `protected_threshold`, and `tlru` takes `threshold` and `next_prompt_estimate` in tokens (help text in `memory.py`).
3. **One model-specific exception.** For Qwen3-VL models on large Hopper GPUs, a profiled override replaces an unset `lru` with `priority` (`arg_groups/model_overrides/qwen3_vl.py`).
4. **The documentation's advice.** It recommends starting with `lru` and changing the policy only against a measured cache hit rate.

TLRU needs one more sentence. Its class docstring cites "Tail-Optimized LRU (Zhang et al., arXiv:2510.15152)". Take a conversation with history length $L$ that expects $\hat{Q}$ new tokens next. To keep its next prefill under the threshold, it must keep only $L + \hat{Q} - \text{threshold}$ tokens cached. Tokens beyond that budget are "TEL-safe", and TLRU evicts them before any other node.

> [!example] Worked example: the TLRU budget
> Take the values of the help text: threshold 4,096 and next prompt estimate 512 tokens. A conversation holds $L = 10{,}000$ tokens.
> 1. Budget to keep: $10{,}000 + 512 - 4{,}096 = 6{,}416$ tokens.
> 2. TEL-safe tail: $10{,}000 - 6{,}416 = 3{,}584$ tokens.
> 3. If only the tail is evicted, the next prefill computes $3{,}584 + 512 = 4{,}096$ tokens, exactly the threshold.
>
> The history length here is a choice of these notes.

> [!key] A policy changes only the order
> Every policy picks among the same candidates: evictable leaves with reference count 0. No policy can evict an internal node or a locked node. The structural rules of sections 6 and 7 hold for all of them.

## 10. What eviction costs

### 10.1 The cost is recomputation

An evicted prefix is not lost. The tokens are known, so a later request that needs the prefix computes its KV again with prefill. The running example shows it at step 8.

> [!example] Worked example: the price of evicting C1.2 at step 5
> 1. Step 8 has a 49-token prompt: SYS (8) + C1.1 (8) + C1.2 (29) + the new user message (4).
> 2. Had C1.2 stayed cached, the match would cover $8 + 8 + 29 = 45$ tokens. It covers 16.
> 3. Extra prefill: 29 tokens. The step-8 hit rate drops from $45/49 \approx 91.8\%$ to $16/49 \approx 32.7\%$.
> 4. With Llama-3.1-8B (about $2 \times 8.03 \times 10^9$ FLOPs per prefill token): $2 \times 8.03 \times 10^9 \times 29 \approx 4.66 \times 10^{11}$ FLOPs. At the H100 dense BF16 peak of about 989 TFLOPS, that is about 0.47 ms. Real prefill runs below peak.
> 5. The KV of those 29 tokens: $29 \times 128$ KiB $= 3{,}712$ KiB $\approx 3.6$ MiB.
> 6. Scaled to a real chat history of 2,000 tokens: about $3.21 \times 10^{13}$ FLOPs (about 32.5 ms at peak) and 250 MiB of KV.

Interpretation of these notes: eviction at step 5 was still the right call. Chat 2 needed the memory then, and chat 1 was idle. LRU bets that the idle chat returns later than the active one needs memory.

### 10.2 Against PagedAttention's swap and recompute

vLLM's preemption ([PagedAttention page 07](/notes/papers/llm-serving/2023-pagedattention/07-scheduling-and-preemption)) and RadixAttention's eviction both free KV memory. They act on different victims.

| | vLLM preemption (PagedAttention paper) | RadixAttention eviction (SGLang paper) |
|---|---|---|
| Victim | a running request (sequence group) | a cached node with reference count 0 |
| When | a running sequence needs a block and none is free | an allocation for new tokens fails |
| Recovery | swap the blocks back from CPU memory, or recompute them | recompute the prefix when a later request needs it |
| Effect on the victim | the request stops until it is resumed | none: no running request reads that node |
| Choice of victim | the latest arrived requests first | the least recently used leaf |

Interpretation of these notes: RadixAttention eviction is the cheaper kind. It only throws away a bet on future reuse. Stopping a running request costs its progress. SGLang 0.5.22 has both, eviction first and retraction (section 8.4) when eviction is not enough. HiCache adds host memory and storage tiers, so evicted KV can stay outside the GPU ([page 10](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today)).

### Exercises

1. **Replay steps 9a and 9b.** Start from the tree after step 8. SYS, C1.1 and C1.2+3 have t=8, FS has t=7, QA has t=6, and QB and QC have t=7. The pool has 80 slots and 0 free. With the `Cache` class, run the hint (FS + SCQ, 3 new tokens, 0 output) and then the four samples (3 output tokens each). Acceptance test: 9a evicts QA and 9b evicts QB and QC. The four deltas of 9b are `[-15, 0, 0, 0]`, FS survives, and the final evictable size is 80.
   - Hint 1: the hint request must lock FS, and the samples must lock SCQ, the node that the hint inserts.
   - Hint 2: compute the shortfall as the slots needed minus the free slots before you call `evict`.
2. **LFU instead of LRU.** Give every node a `hit_count`: SYS 3, C1.1 1, C2.1 2, C2.2 3, FS 3, QA 1, QB 1, QC 1. Write `evict_lfu(cache, num_tokens)` with the key `(hit_count, last_access_time)` and run step 8 with it. Acceptance test: the evicted nodes are QA, QB and QC (any order among them) and then C2.2, 43 tokens in total, and C2.1 survives.
   - Hint 1: copy `evict` and change only the key, also for the pushed parent.
   - Hint 2: after QA, QB and QC go, FS becomes an evictable leaf with key (3, 7), and C2.2 has (3, 5).
3. **An invariant checker.** Write `check(cache, running=0)`. It must assert three things. Every node is reachable from the root. Free slots, cached tokens and running tokens add to the capacity. The evictable size equals the tokens of all nodes with reference count 0. Acceptance test: it passes after step 7, during step 8 (with `running=37`) and after step 8. It fails if you delete SYS from the root and free only SYS's slots.
   - Hint 1: walk the tree from the root with a stack and sum `len(node.value)`.
   - Hint 2: orphans are not reachable, so their slots are missing from the sum.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/05-eviction-and-reference-counts)

## 11. Common mistakes

1. **"The cache has a fixed size that I configure."** The paper preallocates no cache pool. Cached tokens use the slots that running requests do not need, and the running batch can take all of them back.
2. **"LRU evicts the least recently used node."** It evicts the least recently used evictable leaf. An internal node or a locked node is never a candidate, however old.
3. **"Evicting a parent frees the whole subtree."** In SGLang the loop evicts one leaf at a time. A parent becomes a candidate only after its last child is gone. Evicting a parent first would leave unreachable orphans.
4. **"The reference count is on the last matched node only."** It is on every node from that node to the root. Otherwise the evictable size would count tokens that can never be evicted.
5. **"`inc_lock_ref` returns the number of locked tokens."** It returns the change of the evictable size. The delta is negative for the first lock on a node and 0 for a node that another request already locks.
6. **"Eviction erases KV tensors."** It returns slot numbers to the allocator. The data stays until a new request overwrites it, and the tree no longer refers to it.
7. **"Eviction stops running requests."** RadixAttention eviction only touches nodes with reference count 0. Stopping running requests is a separate mechanism, retraction in SGLang and preemption in vLLM.
8. **"An eviction loses data."** The tokens are known. A later request recomputes the KV with prefill. The cost is time.

## 12. One-minute explanation

RadixAttention keeps finished KV in a radix tree that shares one GPU pool with the running requests. There is no reserved cache size, so the cache fills idle memory and gives it back when an allocation fails. It evicts only leaves, because a node's KV is useless without all its ancestors, so the cached set must stay prefix-closed. Among the leaves it picks the least recently used one, and a parent that loses its last child becomes a candidate too. Each node has a reference count, `lock_ref` in SGLang, of the running requests whose path contains it. A request locks its whole path when it is admitted and unlocks it when it finishes. Only leaves with count zero are evictable, and the first lock on a node moves its tokens from the evictable size to the protected size. That is why `inc_lock_ref` returns a negative delta, which the scheduler subtracts from its available memory. SGLang 0.5.22 builds a min-heap of the evictable leaves keyed by the policy, LRU by default, with LFU, SLRU, priority and TLRU as options. An eviction never loses data: it costs one prefill of the prefix if a later request needs it.

## 13. Check questions

```check
{
  "question": "Why does RadixAttention evict only leaves? What exactly goes wrong if it evicts an internal node?",
  "hint": "Where does every match start, and what does a node's KV depend on?",
  "answer": "A node's keys and values were computed after the tokens of all its ancestors, and a match always starts at the root and walks down. So a node is reusable only while all its ancestors are cached. Evicting a leaf keeps this prefix-closed invariant, because no node has the leaf as an ancestor.\n\nEvicting an internal node breaks it. In the step-7 tree, evicting SYS frees 8 slots, but C1.1, C2.1 and C2.2 still hold $8 + 8 + 28 = 44$ slots. No match can reach them, because the walk from the root no longer finds the system prompt. Those slots are wasted until some cleanup finds the orphans. The paper's rule keeps shared ancestors \"until those ancestors become leaves and are also evicted\" (§3)."
}
```
```check
{
  "question": "Interview follow-up: a request matches a path of three nodes. Why does SGLang lock all three nodes and not only the last one? Leaf-first eviction would protect the ancestors anyway.",
  "hint": "Think about the number that the scheduler uses for admission, and about splits.",
  "answer": "Leaf-first eviction would indeed never evict the two ancestors while the locked last node exists. The problem is the accounting.\n\n1. The scheduler admits requests against free slots plus `evictable_size`. With only the last node locked, the two ancestors would keep reference count 0 and count as evictable. But they can never be evicted while their locked descendant exists. The scheduler would overestimate the memory and admit too much.\n2. A match can split a locked node. `_split_node` copies `lock_ref` to the new parent. That copy is correct only if every node on a locked path carries the lock.\n\nWith the whole path locked, each node's count equals the number of running requests whose path contains it, and `protected_size` is exact. This reasoning is the interpretation of these notes. The code facts are from SGLang 0.5.22 `radix_cache.py`."
}
```
```check
{
  "question": "Interview follow-up: at step 9b four samples lock the path FS (12) then SCQ (3). Before the locks, 78 tokens are cached and 2 slots are free. Give the four deltas, the final reference counts and the evictable and protected sizes. Why does only the first lock change the sizes?",
  "hint": "Which condition in inc_lock_ref moves tokens?",
  "answer": "`inc_lock_ref` moves a node's length from `evictable_size_` to `protected_size_` only when its count goes from 0 to 1.\n\n| Lock | FS count | SCQ count | Delta |\n|---|---|---|---|\n| 1st | 0 to 1 | 0 to 1 | $-(12 + 3) = -15$ |\n| 2nd | 1 to 2 | 1 to 2 | 0 |\n| 3rd | 2 to 3 | 2 to 3 | 0 |\n| 4th | 3 to 4 | 3 to 4 | 0 |\n\nProtected: 15. Evictable: $78 - 15 = 63$. Free: 2. The samples need $4 \\times 3 = 12$ slots, so eviction frees the shortfall of 10: QB and QC, 5 each. A second request on an already locked node adds no new protected tokens, so the available memory must not shrink twice. That is why Algorithm 1 can simply add each delta."
}
```
```check
{
  "question": "Interview follow-up: at step 8 the request needs 37 slots and 1 slot is free. The evictable leaves are C2.2 (28 tokens, t=5), QA (5, t=6), QB (5, t=7) and QC (5, t=7). C2.1 (8, t=5) is the parent of C2.2, and C1.1 (t=8) is locked. Trace `evict(36)`.",
  "hint": "When does a parent enter the heap?",
  "answer": "1. The heap holds the four evictable leaves, keyed by `last_access_time`: C2.2 (5), QA (6), QB (7), QC (7). C1.1 is a leaf but locked, so it is not in `evictable_leaves`.\n2. Pop C2.2: free its 28 slots. `num_evicted` = 28, still below 36.\n3. C2.1 now has no children and `lock_ref == 0`, so the loop pushes it with key 5.\n4. Pop C2.1 (key 5 beats QA's 6): 8 more slots, `num_evicted` = 36. The loop stops.\n\nFree slots: $1 + 36 = 37$, exactly the need. SYS keeps its child C1.1, so SYS never becomes a candidate. The few-shot leaves survive."
}
```
```check
{
  "question": "What happens in SGLang 0.5.22 if `evict` is asked for more tokens than the evictable leaves hold?",
  "hint": "Read the loop condition.",
  "answer": "The loop condition is `num_evicted < num_tokens and len(eviction_heap)`. When the heap is empty, the loop stops and `evict` returns fewer tokens than asked. It never touches locked nodes. Algorithm 1 avoids the situation at admission, because it admits a request only if the batch fits into free slots plus the evictable size. If a running batch later needs more slots during decoding, SGLang 0.5.22 removes running requests with `retract_decode` (`managers/schedule_batch.py`)."
}
```
```check
{
  "question": "Interview follow-up: compare RadixAttention eviction with vLLM's preemption by recomputation. Which one is cheaper, and why?",
  "hint": "Who is the victim in each case?",
  "answer": "vLLM's preemption (PagedAttention §4.5) stops a running request and frees its blocks. With recomputation, the request later prefills its prompt and all generated tokens again before it continues. RadixAttention eviction removes a cached node with reference count 0, which no running request reads. Nothing stops. The only cost appears if a later request needs that prefix: one prefill of the evicted tokens.\n\nSo RadixAttention eviction is cheaper: it throws away a bet on future reuse, while preemption throws away progress and delays a live request. In the running example, evicting C1.2 at step 5 cost 29 extra prefill tokens at step 8, about $4.66 \\times 10^{11}$ FLOPs for Llama-3.1-8B. SGLang 0.5.22 uses eviction first and retraction of running requests only when eviction is not enough. This comparison is the interpretation of these notes."
}
```
```check
{
  "question": "Interview follow-up: your server mixes one hot system prompt with a flood of one-off prompts, and the hit rate drops. Which SGLang 0.5.22 eviction policy would you try, what exactly changes, and what stays the same?",
  "hint": "Compare the key of each strategy in evict_policy.py.",
  "answer": "The flood is a scan pattern: one-off prompts become the newest nodes, and plain LRU evicts the older hot prefix when it becomes a leaf. Two options:\n\n- `slru`: key `(is_protected, last_access_time)`. A node with `hit_count >= protected_threshold` (default 2) is in the protected segment and goes only after every probationary node. One-off prefixes are probationary.\n- `lfu`: key `(hit_count, last_access_time)`. Nodes with few inserts go first.\n\nWhat stays the same: the candidates are still the evictable leaves with reference count 0. Parents still enter the heap only when their last child is gone. Only the order changes. Measure the hit rate before and after: the SGLang documentation recommends starting with `lru` and changing only against a measured cache hit rate. Flags: `--radix-eviction-policy slru` and, for tuning, `--radix-eviction-policy-config '{\"protected_threshold\": 4}'`."
}
```
```check
{
  "question": "Interview follow-up: SGLang 0.5.22 splits a finished request's new leaf at the prompt boundary and gives the prompt part a priority 1 higher. Why does this help eviction?",
  "hint": "A node is the smallest unit of eviction.",
  "answer": "Eviction frees whole nodes. Without the split, the prompt tail and the generated answer of a request form one leaf, so eviction keeps both or drops both. With the split, the output becomes its own leaf below the prompt node. LRU or priority eviction can then drop the output KV and keep the prompt KV. The source comment says: \"Split the leaf at the prompt boundary so eviction can drop the output KV without the prompt\".\n\nInterpretation of these notes: other requests or retries often reuse the prompt. An answer is reused only if the client sends exactly those tokens back in the next turn. The higher priority of the prompt part matters for the `priority` policy, where lower priority is evicted first."
}
```
```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "Run this after the `Cache` class of section 8.3.\n\n```python\ndef state_after_step8():\n    c = Cache(80)\n    SYS = c.add(c.root, \"SYS\", c.alloc(8), t=8)\n    C11 = c.add(SYS, \"C1.1\", c.alloc(8), t=8)\n    c.add(C11, \"C1.2+3\", c.alloc(37), t=8)\n    FS = c.add(c.root, \"FS\", c.alloc(12), t=7)\n    for name, t in [(\"QA\", 6), (\"QB\", 7), (\"QC\", 7)]:\n        c.add(FS, name, c.alloc(5), t)\n    return c, FS\n\ndef run(c, node, reqs, t):\n    \"\"\"reqs: list of (new prompt tokens, output tokens). All requests match `node`.\"\"\"\n    x = node\n    while x is not c.root:                         # the match refreshes the path\n        x.last_access_time = t\n        x = x.parent\n    deltas = [c.inc_lock_ref(node) for _ in reqs]\n    need = sum(p + o for p, o in reqs)\n    _, order = c.evict(max(need - len(c.free), 0))\n    print(f\"t={t}: deltas={deltas} lock_ref={node.lock_ref} \"\n          f\"protected={c.protected_size} need={need} evicted={order}\")\n    return deltas, [c.alloc(p + o) for p, o in reqs], order\n\nc, FS = state_after_step8()\n_, [s], ev_a = run(c, FS, [(3, 0)], t=9.0)        # 9a: the hint FS + SCQ\nSCQ = c.add(FS, \"SCQ\", s, t=9.0)\nc.dec_lock_ref(FS)\ndeltas, slots, ev_b = run(c, SCQ, [(0, 3)] * 4, t=9.5)   # 9b: four samples\nfor i, s in enumerate(slots, 1):\n    c.add(SCQ, f\"S{i}\", s, t=9.5)\nfor _ in slots:\n    c.dec_lock_ref(SCQ)\nprint(\"FS cached:\", \"FS\" in c.root.children, \"evictable:\", c.evictable_size, \"free:\", len(c.free))\nassert [e.split()[0] for e in ev_a] == [\"QA\"]\nassert sorted(e.split()[0] for e in ev_b) == [\"QB\", \"QC\"]\nassert deltas == [-15, 0, 0, 0] and c.evictable_size == 80 and \"FS\" in c.root.children\n```\n\nOutput:\n\n```text\nt=9.0: deltas=[-12] lock_ref=1 protected=12 need=3 evicted=['QA (5, t=6)']\nt=9.5: deltas=[-15, 0, 0, 0] lock_ref=4 protected=15 need=12 evicted=['QC (5, t=7)', 'QB (5, t=7)']\nFS cached: True evictable: 80 free: 0\n```"
}
```
```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "Run this after the `Cache` class of section 8.3.\n\n```python\nimport heapq\n\ndef evict_lfu(c, num_tokens):\n    \"\"\"Same loop as Cache.evict, with the LFU key (hit_count, last_access_time).\"\"\"\n    key = lambda x: (x.hit_count, x.last_access_time)\n    heap = [(key(x), x) for x in c.evictable_leaves]\n    heapq.heapify(heap)\n    num_evicted, order = 0, []\n    while num_evicted < num_tokens and heap:\n        _, x = heapq.heappop(heap)\n        c.free += x.value\n        num_evicted += len(x.value)\n        del x.parent.children[x.name]\n        c.evictable_size -= len(x.value)\n        c.evictable_leaves.discard(x)\n        c.update_leaf(x.parent)\n        if not x.parent.children and x.parent.lock_ref == 0:\n            heapq.heappush(heap, (key(x.parent), x.parent))\n        order.append(x.name)\n    return num_evicted, order\n\nc = Cache(80)\nSYS = c.add(c.root, \"SYS\", c.alloc(8), t=5)\nC11 = c.add(SYS, \"C1.1\", c.alloc(8), t=3)\nC21 = c.add(SYS, \"C2.1\", c.alloc(8), t=5)\nC22 = c.add(C21, \"C2.2\", c.alloc(28), t=5)\nFS = c.add(c.root, \"FS\", c.alloc(12), t=7)\nleaves = {n: c.add(FS, n, c.alloc(5), t) for n, t in [(\"QA\", 6), (\"QB\", 7), (\"QC\", 7)]}\nhits = {SYS: 3, C11: 1, C21: 2, C22: 3, FS: 3, leaves[\"QA\"]: 1, leaves[\"QB\"]: 1, leaves[\"QC\"]: 1}\nfor node, h in hits.items():\n    node.hit_count = h\nfor x in (SYS, C11):\n    x.last_access_time = 8\nc.inc_lock_ref(C11)\nnum, order = evict_lfu(c, 37 - len(c.free))\nprint(\"LFU evicted\", num, \"tokens:\", order, \"free:\", len(c.free))\nassert set(order[:3]) == {\"QA\", \"QB\", \"QC\"} and order[3] == \"C2.2\" and num == 43\n```\n\nOutput:\n\n```text\nLFU evicted 43 tokens: ['QA', 'QB', 'QC', 'C2.2'] free: 44\n```"
}
```
```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "Run this after the `Cache` class of section 8.3.\n\n```python\ndef check(c, running=0):\n    \"\"\"Invariants of a radix cache with a KV pool. Raises AssertionError.\"\"\"\n    seen, stack = [], list(c.root.children.values())\n    while stack:                                   # every node reachable from the root\n        x = stack.pop()\n        assert x.parent.children.get(x.name) is x, f\"{x.name} is detached\"\n        seen.append(x)\n        stack.extend(x.children.values())\n    cached = sum(len(x.value) for x in seen)\n    assert len(c.free) + cached + running == c.capacity, \\\n        f\"slots: free {len(c.free)} + cached {cached} + running {running} != {c.capacity}\"\n    assert c.evictable_size + c.protected_size == cached, \"sizes do not add up\"\n    assert c.evictable_size == sum(len(x.value) for x in seen if x.lock_ref == 0)\n    return \"ok\"\n\nclass CheckedCache(Cache):\n    def __init__(self, capacity):\n        super().__init__(capacity)\n        self.capacity = capacity\n\nc = CheckedCache(80)\nSYS = c.add(c.root, \"SYS\", c.alloc(8), t=5)\nC11 = c.add(SYS, \"C1.1\", c.alloc(8), t=3)\nC21 = c.add(SYS, \"C2.1\", c.alloc(8), t=5)\nc.add(C21, \"C2.2\", c.alloc(28), t=5)\nFS = c.add(c.root, \"FS\", c.alloc(12), t=7)\nfor n, t in [(\"QA\", 6), (\"QB\", 7), (\"QC\", 7)]:\n    c.add(FS, n, c.alloc(5), t)\nprint(\"step 7:\", check(c))\nc.inc_lock_ref(C11)\nc.evict(36)\nslots = c.alloc(37)\nprint(\"step 8 running:\", check(c, running=37))\nc.add(C11, \"C1.2+3\", slots, t=8)\nc.dec_lock_ref(C11)\nprint(\"step 8 done:\", check(c))\n# the wrong policy: evict the parent SYS while its children stay\ndel c.root.children[\"SYS\"]\nc.free += SYS.value\nc.evictable_size -= len(SYS.value)\ntry:\n    check(c)\nexcept AssertionError as e:\n    print(\"parent first:\", e)\n```\n\nOutput:\n\n```text\nstep 7: ok\nstep 8 running: ok\nstep 8 done: ok\nparent first: slots: free 8 + cached 27 + running 0 != 80\n```"
}
```

## 14. Links

- Previous: [04 RadixAttention: the tree of KV caches](/notes/papers/llm-serving/2023-sglang-radixattention/04-radixattention-the-tree-of-kv-caches)
- Next: [06 Cache-aware scheduling and the DFS theorem](/notes/papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling)
- Tries, radix trees and leaf deletion: [01 Background: tries and radix trees](/notes/papers/llm-serving/2023-sglang-radixattention/01-background-tries-and-radix-trees)
- Why a node needs all its ancestors: [02 Background: prefix sharing in LM programs](/notes/papers/llm-serving/2023-sglang-radixattention/02-background-prefix-sharing-in-lm-programs)
- The code of today, class by class: [10 RadixAttention in SGLang today](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today)
- Reproduce steps 8 and 9 in a lab: [12 Reproduce it](/notes/papers/llm-serving/2023-sglang-radixattention/12-reproduce-it)
- vLLM's LRU free queue and reference counts: [L9: Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)
- Reference counts on shared blocks: [06 Sharing in PagedAttention](/notes/papers/llm-serving/2023-pagedattention/06-decoding-scenarios-and-sharing)
- Swapping and recomputation of running requests: [07 Scheduling and preemption](/notes/papers/llm-serving/2023-pagedattention/07-scheduling-and-preemption)
- The KV bytes per token: [L3: The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)
- The paper card: [SGLang and RadixAttention (2023)](/notes/papers/llm-serving/2023-sglang-radixattention) and the [Glossary](/notes/papers/glossary)

### Sources

- Zheng et al., "SGLang: Efficient Execution of Structured Language Model Programs", NeurIPS 2024: https://arxiv.org/abs/2312.07104 (§3, Figure 3, Appendix A.2)
- SGLang 0.5.22 on PyPI: https://pypi.org/project/sglang/0.5.22/ (source files `srt/mem_cache/radix_cache.py`, `evict_policy.py`, `utils.py`, `base_prefix_cache.py`, `common.py`, `prefill_budget.py`, `allocator/base.py`, `srt/managers/schedule_policy.py`, `schedule_batch.py`, `srt/arg_groups/fields/memory.py`, `srt/arg_groups/model_overrides/qwen3_vl.py`)
- SGLang repository: https://github.com/sgl-project/sglang
- SGLang documentation, radix eviction policies: https://docs.sglang.io/docs/advanced_features/radix_eviction_policy
- T-LRU: https://arxiv.org/abs/2510.15152

(checked on 2026-10-19)
