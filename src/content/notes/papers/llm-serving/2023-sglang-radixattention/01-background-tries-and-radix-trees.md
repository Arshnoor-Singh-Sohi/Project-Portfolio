---
title: "01 Background: tries and radix trees"
order: 1
summary: "The data structure under RadixAttention, from zero. Why a dictionary of whole prompts finds only exact repeats, how a trie stores one token per edge, how a radix tree merges single-child chains into runs of tokens, and the three operations match, insert with split, and delete a leaf, with step tables, costs, a comparison with a 16-token hash chain, what SGLang 0.5.22 does in its code, and a runnable radix tree with KV slot values."
status: not-started
tags: [radixattention, sglang, radix-tree, trie, prefix-matching, data-structures]
---

## 1. The question this page answers

A serving engine keeps the KV cache of old requests. A new request arrives with a list of token IDs. The engine must answer one question before it runs the prefill:

**Which stored sequence shares the longest beginning with this new one, and how long is that shared beginning?**

Every matched token is a token that the GPU does not need to compute again.

The question looks simple, but the obvious tools fail. A Python dictionary keyed by the whole prompt finds only exact repeats. A scan over all stored sequences is slow when there are thousands of them. RadixAttention answers the question with a **radix tree**. This page builds that data structure from zero, so that pages 04 to 06 can use it.

An interviewer will ask these questions, and this page answers each of them:

1. Why is a dictionary of prompts not enough? What is a trie, and what is a radix tree?
2. How does a match work, and what happens when it ends in the middle of an edge?
3. How does an insert split an edge? What happens to the KV slots of that edge?
4. When a leaf is deleted, does the parent merge with its last child? What does SGLang 0.5.22 do?
5. What does a match cost? How does it compare with vLLM's hash chain over 16-token blocks?

## 2. Mental model

> [!analogy] Hiking trails that start at one trailhead
> Every hike starts at the same trailhead, the root. Many hikes share their first kilometers and then fork. A **trie** puts a signpost after every single step, even where the trail does not fork. A **radix tree** keeps a signpost only where the trail forks, and it writes the whole stretch between two forks on one sign. To learn how far a new hike follows known trails, you start at the trailhead. At each fork you read the signpost that names the first step of each branch. Then you compare the stretch step by step until the trail and your hike differ.
>
> **Where it stops working:** a real trail stretch is useful on its own. A stretch of tokens in the KV cache is useful only together with every stretch before it. Each key and value depends on all earlier tokens (page 02). So the engine can remove only a stretch at the end of a trail, a leaf, and never a stretch in the middle. Also, a hike can stop in the middle of a stretch. A real trail has no signpost there, but the radix tree then adds one: it **splits** the stretch.

## 3. Terms

| Term | Plain meaning |
|---|---|
| token sequence | A list of token IDs, the input of the model. Example: [1, 2, 3, 4, 5, 6]. |
| prefix | The first $k$ tokens of a sequence, for any $k$ from 0 to its length. |
| longest common prefix | The longest prefix that two sequences share. [1, 2, 3, 4, 5, 6] and [1, 2, 9] share [1, 2]. |
| trie (prefix tree) | A tree with exactly one token on each edge. The path from the root to a node spells one prefix. |
| radix tree | A trie in which each chain of single-child nodes becomes one edge that holds a run of tokens. |
| root | The top node. It represents the empty sequence and holds no tokens. |
| node | One element of the tree. In these notes, a node owns the edge that leads to it from its parent. |
| edge | The run of tokens stored at a node: the tokens between its parent and itself. |
| leaf | A node without children. |
| child key | The dictionary key under which a parent stores a child: the first token of the child's edge. |
| match | Walk from the root along a query and count how many leading tokens the tree already holds. |
| matched prefix length | The result of a match: the number of leading query tokens found in the tree. |
| split | Cut one edge into two nodes at a position, so that a branch or a match can end there. |
| insert | Add a sequence: match it, split one edge if needed, and append one new leaf for the unmatched tail. |
| delete a leaf | Remove a leaf from its parent's child map. Eviction (page 05) uses this operation. |
| KV pool | The GPU memory of token slots that the running requests and the cache share. |
| slot | One token's KV entry in the KV pool. |
| value | The list of slot numbers of a node, one slot per token of its edge. |
| galloping search | Compare windows of doubling length to find the first different token, then binary search inside the window. |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. Why a dictionary of whole prompts is not enough

### 4.1 Exact keys find only exact repeats

The simplest cache is a Python dictionary: the key is the whole prompt, the value is its KV cache. Two prompts that differ in their last token are two different keys. The dictionary cannot tell that they share 2,000 tokens.

```python
system = list(range(1000, 3000))           # a 2,000-token system prompt
a = system + [7]                            # request A ends with token 7
b = system + [8]                            # request B ends with token 8
cache = {tuple(a): "KV of A"}               # a plain dictionary keyed by the whole prompt
print("B found in the dictionary:", tuple(b) in cache)
shared = next(i for i, (x, y) in enumerate(zip(a, b)) if x != y)
print("tokens that A and B share at the start:", shared)
keys = [tuple(a[:k]) for k in range(1, len(a) + 1)]   # store every prefix as its own key
print("prefix keys:", len(keys), "token ids inside them:", sum(len(k) for k in keys))
```

```text
B found in the dictionary: False
tokens that A and B share at the start: 2000
prefix keys: 2001 token ids inside them: 2003001
```

1. `tuple(b) in cache` hashes all 2,001 tokens of B and finds no equal key. The lookup is all or nothing.
2. The `next(...)` line finds the first position where A and B differ: position 2,000. So 2,000 of B's 2,001 tokens have reusable KV, but the dictionary reuses 0.
3. The last line tries the first fix: one key for every prefix. One prompt then needs 2,001 keys that hold 2,003,001 token IDs.

### 4.2 Two obvious fixes and their costs

| Fix | How it works | Cost for one 2,001-token prompt |
|---|---|---|
| Every prefix as a key | Store `prefix → KV` for each $k$. Find the longest prefix of the query that is a key. | Keys hold $\sum_{k=1}^{2001} k = 2{,}003{,}001$ token IDs. Memory and hashing grow with the square of the length. |
| Scan all stored sequences | Compare the query with each stored sequence, token by token, and keep the best. | With 10,000 stored sequences: up to $10{,}000 \times 2{,}000 = 2 \times 10^7$ token comparisons per request. |

Both fixes fail at scale. The first stores the same tokens again in every key. The second does work for every stored sequence, also for the thousands that share nothing with the query.

We need a structure that answers the question of section 1 fast. Its work must grow with the **length of the query**, not with the number of stored sequences. Each shared token must be stored **once**. A tree of prefixes does both.

## 5. The trie: one token per edge

### 5.1 The idea

A trie (also called a prefix tree) is a tree of prefixes:

1. The root represents the empty sequence.
2. Each edge holds one token.
3. The path from the root to a node spells one prefix. Two sequences with the same first $k$ tokens share the same first $k$ nodes.
4. Each node keeps a dictionary of its children, keyed by the token on the child edge.

A classic trie of words also marks the nodes where a stored word ends. A KV cache does not need that mark. Every prefix of a stored sequence has usable KV, because the KV of token $i$ depends only on tokens 1 to $i$ (page 02). So in a KV cache, every node is a valid end of a match.

### 5.2 Build a trie by hand

Insert the three sequences of [L9 section 7.1](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse): `[1,2,3,4,5,6]`, `[1,2,3,4,7,8]` and `[1,2,9]`.

| Step | Sequence | Walk from the root | New nodes | Nodes after the step |
|---|---|---|---|---|
| 1 | [1, 2, 3, 4, 5, 6] | No child with token 1, so nothing matches. | 1, 2, 3, 4, 5, 6 | 6 |
| 2 | [1, 2, 3, 4, 7, 8] | Follow 1, 2, 3, 4. Node 4 has no child 7. | 7, 8 (under 4) | 8 |
| 3 | [1, 2, 9] | Follow 1, 2. Node 2 has no child 9. | 9 (under 2) | 9 |

The trie has **9 nodes** plus the root. Each node holds one token, so it stores $6 + 2 + 1 = 9$ tokens. The three sequences have $6 + 6 + 3 = 15$ tokens in total. The trie stores $15 - 9 = 6$ tokens fewer. The tokens 1 and 2 are stored once instead of three times (4 saved), and 3 and 4 once instead of twice (2 saved).

### 5.3 What a trie costs

A trie answers the question of section 4.2. A lookup walks one node per matched token: one dictionary lookup per token. It never visits a stored sequence that does not share the current prefix.

The problem is the number of nodes. A trie has one node per **distinct prefix token**. A 2,000-token system prompt is a chain of 2,000 nodes, and each node is an object with its own dictionary. A walk along it does 2,000 dictionary lookups, although nothing branches there.

> [!example] Worked example: 100 requests with one shared system prompt
> 100 requests share a 2,000-token system prompt and then each add 50 unique tokens.
>
> 1. Input tokens: $100 \times 2{,}050 = 205{,}000$.
> 2. Trie nodes: $2{,}000$ for the shared prompt plus $100 \times 50 = 5{,}000$ for the tails, so $7{,}000$ nodes.
> 3. Tokens stored: $7{,}000$, one per node.
> 4. Measured in these notes (CPython 3.13, `tracemalloc`, the node class of section 9): the trie used 2,734,568 bytes, about 391 bytes per node. The radix tree of the same input used 83,136 bytes.

## 6. The radix tree: one run of tokens per edge

### 6.1 Merge the single-child chains

A radix tree removes the waste of single-child chains. The rule: **merge every chain of single-child nodes into one edge.** That edge holds a run of tokens. The SGLang paper describes the radix tree as "a space-efficient alternative to a classical trie (prefix tree)". The paper adds that its edges can carry runs of elements of different lengths, not only single elements (§3). Other books call it a compressed trie or a compact prefix tree.

### 6.2 The same three sequences

![Alt text: the three sequences drawn as a trie with nine nodes and as a radix tree with five nodes, both storing nine tokens](/notes/media/papers/2023-sglang-radixattention/figures/01-trie-vs-radix-tree.svg)

In the trie, the chains 1→2, 3→4, 5→6, 7→8 and the single node 9 have no branch inside them. Each chain becomes one node. The radix tree is `[1,2] → {[3,4] → {[5,6], [7,8]}, [9]}`, as the figure shows.

| Structure | Nodes (without the root) | Tokens stored | Input tokens |
|---|---|---|---|
| Trie | 9 | 9 | 15 |
| Radix tree | 5 | 9 | 15 |

> [!key] What "space-efficient" means here
> A radix tree stores **the same tokens** as a trie. It saves **nodes**: the objects, dictionaries and pointers around the tokens. In the 100-request example of section 5.3, the trie has 7,000 nodes and the radix tree has 101 (one shared node plus 100 tails). Both store 7,000 tokens.

A bound helps in interviews. In a fully merged radix tree, every node except the root and the leaves has at least two children. A tree with $n$ leaves then has at most $2n - 1$ nodes without the root. The node count depends on the **number of sequences**, not on their length. The example has $n = 3$ leaves and $2 \times 3 - 1 = 5$ nodes, the maximum.

```video
{"src": "/notes/media/papers/2023-sglang-radixattention/manim/r01-trie-to-radix-tree.mp4", "caption": "A trie of three token sequences collapses into a radix tree of five nodes, and the insert of [1, 2, 9] splits the edge [1, 2, 3, 4] and its slot list at position 2."}
```

### 6.3 Extra node boundaries in a KV cache tree

The tree of a KV cache is not always fully merged. Three events leave a node with exactly one child:

1. **A later request extends an earlier one.** Chat turn 1 inserts [SYS, turn 1]. Turn 2 inserts [SYS, turn 1, turn 2]. The insert walks the whole first node and appends turn 2 as a **child**. It does not grow the old node. Page 04's step 3 shows this case.
2. **A match ends inside an edge.** SGLang 0.5.22 splits the node at that point, also when no new branch follows (section 7.1).
3. **A leaf is deleted.** SGLang 0.5.22 does not merge the parent with its last child (section 7.3).

These boundaries do not change which tokens are cached. They change only how many nodes hold them. Interpretation of these notes: a boundary where a request ended is also useful for eviction. The engine can then evict the newest turn of a chat and keep the older turns.

### 6.4 How a node finds its child

Each node keeps a hash map of its children. The key is the **first token of the child's edge**. To continue a walk at position $i$ of the query, the node reads `children[query[i]]`: one dictionary lookup, whatever the number of children.

Why can two siblings never start with the same token? Suppose that two children of one node started with the same token $t$. Then the second sequence shared at least the token $t$ with the first child's edge. The insert of the second sequence would have followed the first child and split it after the shared tokens. It would not have created a second child. So the insert keeps the invariant: **the first tokens of siblings are always different.** This invariant makes the first token a correct dictionary key.

SGLang 0.5.22 stores the children in `TreeNode.children`, keyed by a `child_key` (SGLang 0.5.22 source, `radix_cache.py`, `RadixKey.child_key_at`):

```python
        plain = (
            t[offset] if page_size == 1 else tuple(t[offset : offset + page_size])
        )
        if self.cache_salt is not None:
            return ((self.extra_key, self.cache_salt), plain)
        return plain if self.extra_key is None else (self.extra_key, plain)
```

1. With `page_size == 1`, the key is the first token, as in this page.
2. With a larger page, the key is the tuple of the **first page** of tokens. Matches are then rounded down to whole pages. Two siblings can share their first tokens, but never their whole first page. Page 10 explains page sizes.
3. `extra_key` (for example a LoRA adapter) and `cache_salt` become part of the key. So the same tokens under different namespaces never share a node. Page 10 and page 11 cover them.

## 7. The three operations, step by step

### 7.1 Match

A match walks down from the root and returns the matched prefix length. It can stop in three ways: no child has the next token, the edge differs from the query, or the query ends.

```text
match(query):
    node = root, i = 0
    while i < len(query) and query[i] is a child key of node:
        child = node.children[query[i]]
        n = number of leading tokens where child.edge equals query[i:]
        i = i + n
        if n < len(child.edge): stop        # the match ends inside this edge
        node = child
    return i                                 # the matched prefix length
```

Walk the query `[1,2,3,4,7,8,10]` on the tree of section 6.2:

| Step | Node | Lookup key | Child found | Edge | Tokens compared | Matched so far |
|---|---|---|---|---|---|---|
| 1 | root | 1 | yes | [1, 2] | 2 equal | 2 |
| 2 | [1, 2] | 3 | yes | [3, 4] | 2 equal | 4 |
| 3 | [3, 4] | 7 | yes | [7, 8] | 2 equal | 6 |
| 4 | [7, 8] | 10 | no | none | 0 | 6, stop |

Result: 6 tokens, after 4 dictionary lookups and 6 token comparisons.

Now the query `[1,2,3,9]`:

| Step | Node | Lookup key | Child found | Edge | Tokens compared | Matched so far |
|---|---|---|---|---|---|---|
| 1 | root | 1 | yes | [1, 2] | 2 equal | 2 |
| 2 | [1, 2] | 3 | yes | [3, 4] | 1 equal, then 9 differs from 4 | 3, stop inside the edge |

Result: 3 tokens, after 2 dictionary lookups and 4 token comparisons. **The match ends inside the edge [3, 4], at offset 1.** The token 3 is reusable, the token 4 is not. A 16-token block scheme would reuse 0 tokens of this query ([L9 section 7.1](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)).

What should the match return when it ends inside an edge? A caller needs a node that it can keep, for example to protect the matched path from eviction (page 05). There are two designs:

1. **Return the node and the offset inside its edge.** The tree does not change. The caller must remember that only part of the edge belongs to the match. Exercise 1 implements this design.
2. **Split the node at the offset and return the new node.** Then the matched prefix is exactly the path from the root to a node.

SGLang 0.5.22 chooses the second design. Its `match_prefix` docstring says: "If the lookup ends inside a stored segment the node is split once to expose a precise boundary". The helper also refreshes `last_access_time` on every node that the walk visits, so LRU eviction sees the hit (SGLang 0.5.22 source, `radix_cache.py`, `_match_prefix_helper`).

> [!trap] A match can change the tree
> In SGLang, a match is not read-only. A match that ends inside an edge splits that node. The split moves no KV data. It cuts the token run and the list of slot indices. Section 7.2 shows the cut.

### 7.2 Insert

An insert walks like a match. At the place where the walk stops, three cases are possible:

| Case | Where the walk stops | What the insert does |
|---|---|---|
| A | At a node, and no child starts with the next query token | Append one new leaf with the rest of the query. |
| B | Inside an edge, at the first different token | Split the edge at that position, then append one new leaf under the new middle node. |
| C | The query ends (at a node or inside an edge) | Nothing new to store. SGLang still splits the edge if the query ends inside it. |

Insert the three sequences into an empty tree, in order:

| Step | Insert | Walk | Case | Tree after the step |
|---|---|---|---|---|
| 1 | [1, 2, 3, 4, 5, 6] | Root has no child 1. | A | root → [1,2,3,4,5,6] |
| 2 | [1, 2, 3, 4, 7, 8] | Child 1: 4 equal tokens, then 7 differs from 5. | B, split after 4 | root → [1,2,3,4] → {[5,6], [7,8]} |
| 3 | [1, 2, 9] | Child 1: 2 equal tokens, then 9 differs from 3. | B, split after 2 | root → [1,2] → {[3,4] → {[5,6], [7,8]}, [9]} |

A split of the edge of node `c` after $n$ tokens does four things:

1. Create a middle node `mid` with the first $n$ tokens of `c`'s edge.
2. Put `mid` into the parent's child map. The key does not change, because `mid` starts with the same token as `c` did.
3. Keep the rest of the edge in `c`, and make `c` a child of `mid` under its new first token.
4. Cut the node's **value**, the list of KV slots, at the same position $n$.

The fourth step matters for the KV cache. Each node stores one slot number per token of its edge. When the edge splits, the slot list must split at the same position, or a token would refer to the KV of another token.

![Alt text: inserting the sequence 1 2 9 splits one edge and its slot list in two, and the new leaf gets slot 8](/notes/media/papers/2023-sglang-radixattention/figures/01-split-on-insert.svg)

> [!example] Worked example: the slot lists during the three inserts
> A KV pool has 12 slots, 0 to 11. Each request reuses the slots of its matched prefix and takes new slots only for its unmatched tail.
>
> 1. Insert [1, 2, 3, 4, 5, 6]: matched 0, new slots [0, 1, 2, 3, 4, 5]. One node holds all 6 slots.
> 2. Insert [1, 2, 3, 4, 7, 8]: matched 4, reused slots [0, 1, 2, 3], new slots [6, 7]. The split cuts [0, 1, 2, 3, 4, 5] at position 4 into [0, 1, 2, 3] and [4, 5].
> 3. Insert [1, 2, 9]: matched 2, reused slots [0, 1], new slot [8]. The split cuts [0, 1, 2, 3] at position 2 into [0, 1] and [2, 3].
> 4. Slots in use: 9 of 12, one per stored token. The input had 15 tokens.

SGLang 0.5.22 does the same cut in `_split_node` (SGLang 0.5.22 source, `radix_cache.py`). The middle node gets `child.key[:split_len]` and `child.value[:split_len].clone()`, and the old node keeps `child.key[split_len:]` and `child.value[split_len:].clone()`. The `clone()` calls copy small tensors of slot indices, not K or V data. The split also copies `lock_ref` and `hit_count` to the middle node, because the middle node lies on every path through the old node. Page 05 explains `lock_ref`, the reference count.

SGLang's insert returns the length that was **already** in the tree. A caller can use it to free duplicate slots. Two requests in one batch can compute the same prefix, and only one copy can stay in the tree. The docstring of `_insert_cache` says: "Insert the page-aligned key ... and free the duplicates it exposed". Page 10 walks through that code.

### 7.3 Delete a leaf

Eviction removes cached tokens to release KV slots (page 05). The tree operation under it is **delete a leaf**:

1. Check that the node has no children and is not the root.
2. Remove the node from its parent's child map, with the node's child key.
3. Return the node's slots to the KV pool.

Only a leaf can go. An internal node holds the first tokens of every sequence below it. If it disappeared, its children would hold the KV of tokens whose earlier tokens are no longer cached. No match could ever reach them.

Should the parent merge with its last child? Take the tree of section 6.2 and delete the leaf [9]:

| Design | Tree after the delete | Nodes |
|---|---|---|
| Fully merged radix tree | root → [1,2,3,4] → {[5,6], [7,8]} | 4 |
| SGLang 0.5.22 | root → [1,2] → [3,4] → {[5,6], [7,8]} | 5 |

What the code does (SGLang 0.5.22 source, `radix_cache.py`):

```python
    def _delete_leaf(self, node):
        key = node.key.child_key(self.page_size)
        v = node.parent.children.pop(key, None)
        assert v == node, f"parent does not have child key, {key}"

        self.evictable_size_ -= len(node.key)
        if node in self.evictable_leaves:
            self.evictable_leaves.remove(node)
        self._update_leaf_status(node.parent)
```

1. `children.pop(key, None)` removes the leaf from its parent's map. The `assert` checks that the map really held this node.
2. `evictable_size_` drops by the leaf's token count. Page 05 explains this counter.
3. `_update_leaf_status(node.parent)` checks whether the parent is now an evictable leaf. The eviction loop then can delete the parent next.
4. **No line merges the parent with a single remaining child.** After the delete of [9], the node [1, 2] keeps its one child [3, 4].

Interpretation of these notes: the missing merge costs only one extra node visit per match on that path. A merge would need to join two slot tensors and two sets of metadata. The two nodes can differ in `lock_ref` and `last_access_time`, for example when a running request uses [1, 2] but not [3, 4]. A merge would lose that difference. The boundary also often returns soon, because many requests branch at the same place, for example after a system prompt.

## 8. Cost

### 8.1 Match, insert and delete

Let $L$ be the length of the query and $d$ the number of nodes on the matched path.

| Operation | Token comparisons | Dictionary operations | Other work |
|---|---|---|---|
| Match | At most $L$ equal tokens plus one that differs | At most $d + 1$ lookups | SGLang: at most one split, and a timestamp update per visited node |
| Insert | Same as match | Same as match, plus one write for the new leaf | At most one split and one new node |
| Delete a leaf | None | One `pop` from the parent's map | Free the leaf's slots |

The cost of a match does not depend on the number of stored sequences. A tree with 10,000 cached requests costs the same walk as a tree with 10, if the query matches the same path. Compare with the $2 \times 10^7$ comparisons of the scan in section 4.2.

Why at most one split? The walk stops at the first different token. A split happens only at that point. After the split, the next query token differs from the old node's rest, so the walk ends.

### 8.2 SGLang's galloping comparison

A long edge, for example a 2,000-token system prompt, needs many token comparisons. A Python loop over 2,000 tokens is slow. SGLang 0.5.22 compares slices instead, in `RadixKey.match_at`. Its comment says: "Exponential search for the first diverging token: gallop in doubling windows (one C-level slice compare each), then binary-search the window holding the divergence -- no per-token Python loop on long shared prefixes."

1. Compare the windows [0, 1), [1, 3), [3, 7), [7, 15) and so on. Each window is twice as long as the one before. One slice comparison checks a whole window in C.
2. At the first window that differs, binary search inside it. Each step compares the left half of the window.
3. The result is rounded down to a multiple of `page_size`.

> [!example] Worked example: one 2,000-token edge
> Computed in these notes with a copy of the loop of `match_at` and counters.
>
> 1. The query differs from the edge at position 1,500. The gallop compares windows up to [1023, 2000), which holds the difference: 11 slice comparisons.
> 2. The binary search inside that window needs 10 more slice comparisons. Total: 21 Python-level steps, not about 1,500.
> 3. The slices hold 2,975 tokens in total, about twice the 1,500 matched tokens. That work runs in C.
> 4. When the query equals the whole edge: 11 slice comparisons over exactly 2,000 tokens.

So the asymptotic work stays $O(L)$ token comparisons. Only the constant changes: the comparisons move from Python into C.

### 8.3 Radix tree versus hash chain

vLLM indexes its prefix cache with a chain of block hashes. Each full block of 16 tokens gets a hash of its parent's hash, its own tokens and extra keys. [L9 section 5](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) explains it in depth.

| Aspect | Radix tree (SGLang, page size 1) | Hash chain over 16-token blocks (vLLM) |
|---|---|---|
| Granularity | One token. A match can end anywhere. | One full block. The match is rounded down to 16 tokens, and the partial last block is never cached. |
| Index | A tree in CPU memory. Each node has a child map. | A flat map: block hash → block. |
| Cost of a match | A walk: at most $L + 1$ token comparisons and $d + 1$ dictionary lookups. | Hash every full block of the prompt, then one map lookup per block until the first miss. |
| Cost of an update | At most one split and one new node per insert. A match can also split. | One new map entry per new full block. The structure never splits. |
| Unit of eviction | A leaf node of any length. | One block, LRU, tail blocks first. |
| Tokens lost at the edge of a match | None. | Up to 15 per request. A 40-token shared prompt gives 32 reused tokens. |
| Sharing across machines | Needs the token sequences, or a router-side copy of the tree (page 07). | Easy: equal content gives an equal hash with a fixed seed. |

Interpretation of these notes: both are a prefix index over the same paged KV memory. The radix tree finds the longest prefix to the exact token. The hash chain finds it to the nearest block boundary, but it costs less to update and to share between machines. SGLang today also supports pages larger than one token, and then its matches are rounded to pages too (page 10).

## 9. A radix tree in Python

### 9.1 The tree

This class has the three operations of section 7 and a pretty print. It is a teaching model, not SGLang's code. It gives the same output as the minimal tree of [L9 section 7.1](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) for the same inputs.

```python
class Node:
    def __init__(self, tokens=(), parent=None):
        self.tokens = list(tokens)      # the edge: the run of tokens stored at this node
        self.children = {}              # first token of a child's edge -> child node
        self.parent = parent

class RadixTree:
    def __init__(self):
        self.root = Node()

    @staticmethod
    def _common(edge, seq, i):
        """Number of leading tokens of edge that equal seq[i:]."""
        n = 0
        while n < len(edge) and i + n < len(seq) and edge[n] == seq[i + n]:
            n += 1
        return n

    def match(self, seq):
        """Matched prefix length: how many leading tokens of seq are in the tree."""
        node, i = self.root, 0
        while i < len(seq) and seq[i] in node.children:
            child = node.children[seq[i]]          # one dictionary lookup per node
            n = self._common(child.tokens, seq, i)  # token comparisons along the edge
            i += n
            if n < len(child.tokens):              # the match ends inside this edge
                break
            node = child
        return i

    def _split(self, child, n):
        """Cut child's edge after n tokens. Return the new middle node."""
        mid = Node(child.tokens[:n], child.parent)
        mid.parent.children[mid.tokens[0]] = mid   # same first token, same dict key
        child.tokens = child.tokens[n:]
        child.parent = mid
        mid.children[child.tokens[0]] = child
        return mid

    def insert(self, seq):
        """Add seq. Return the node where seq ends."""
        node, i = self.root, 0
        while i < len(seq):
            child = node.children.get(seq[i])
            if child is None:                      # case A: no child starts with seq[i]
                node.children[seq[i]] = Node(seq[i:], node)
                return node.children[seq[i]]
            n = self._common(child.tokens, seq, i)
            if n < len(child.tokens):              # case B or C: stop inside the edge
                child = self._split(child, n)
            node, i = child, i + n                 # the edge is matched: go down
        return node

    def delete_leaf(self, node):
        assert not node.children and node is not self.root
        del node.parent.children[node.tokens[0]]   # no merge of the parent (as in SGLang)

    def show(self, node=None, depth=0):
        node = node or self.root
        for child in node.children.values():
            slots = ("slots", child.value) if hasattr(child, "value") else ()
            print("  " * depth + "-", child.tokens, *slots)
            self.show(child, depth + 1)

t = RadixTree()
for seq in ([1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 7, 8], [1, 2, 9]):
    last = t.insert(seq)                           # after the loop: the leaf [9]
t.show()
print("match [1,2,3,4,7,8,10]:", t.match([1, 2, 3, 4, 7, 8, 10]))
print("match [1,2,3,9]:", t.match([1, 2, 3, 9]))
print("match [5,6]:", t.match([5, 6]))
t.delete_leaf(last)
print("after deleting the leaf [9]:")
t.show()
```

```text
- [1, 2]
  - [3, 4]
    - [5, 6]
    - [7, 8]
  - [9]
match [1,2,3,4,7,8,10]: 6
match [1,2,3,9]: 3
match [5,6]: 0
after deleting the leaf [9]:
- [1, 2]
  - [3, 4]
    - [5, 6]
    - [7, 8]
```

The important lines:

1. `self.children = {}` with the first token as key: section 6.4. A child is found with one dictionary lookup.
2. `_common` counts equal tokens along one edge. It stops at the end of the edge, at the end of the query, or at the first different token.
3. In `match`, `if n < len(child.tokens): break` is the case where the match ends inside an edge. The query [1, 2, 3, 9] stops there with 3 tokens.
4. In `_split`, `mid.parent.children[mid.tokens[0]] = mid` replaces the old child under the **same** key, because `mid` starts with the same token.
5. In `insert`, the cases of section 7.2: `child is None` is case A. `n < len(child.tokens)` is case B, or case C when the query ends inside the edge. The loop end is case C at a node. `insert` returns the node where the sequence ends.
6. `delete_leaf` removes one dictionary entry and merges nothing, like SGLang 0.5.22. The output shows [1, 2] and [3, 4] still apart after the delete.
7. `match [5,6]: 0` shows that only a **prefix** can match. The tokens 5 and 6 are in the tree, but not at position 0.
8. `show` prints the slots when a node has a `value`. Section 9.2 uses that.

### 9.2 Slot values and the split

Now each node also stores its **value**: one KV pool slot per token of its edge. Append this block to the first one and run the file. The output below shows only the lines that this block prints.

```python
class SlotTree(RadixTree):
    """Each node also stores value: one KV pool slot per token of its edge."""
    def __init__(self):
        super().__init__()
        self.root.value = []

    def _split(self, child, n):
        mid = super()._split(child, n)
        mid.value, child.value = child.value[:n], child.value[n:]   # cut at the same n
        return mid

    def match_slots(self, seq):
        """Matched prefix length, and the slots that hold the KV of that prefix."""
        node, i, slots = self.root, 0, []
        while i < len(seq) and seq[i] in node.children:
            child = node.children[seq[i]]
            n = self._common(child.tokens, seq, i)
            slots += child.value[:n]               # the first n slots of this edge
            i += n
            if n < len(child.tokens):
                break
            node = child
        return i, slots

    def insert(self, seq, slots):
        """Store seq with one slot per token. Return the prefix length already cached."""
        matched = self.match(seq)
        end = super().insert(seq)                  # may split one edge, may add one leaf
        if matched < len(seq):
            end.value = list(slots[matched:])      # the new leaf keeps only the tail
        return matched

free = list(range(12))                             # the free slots of a tiny KV pool
tree = SlotTree()
for seq in ([1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 7, 8], [1, 2, 9]):
    m, reused = tree.match_slots(seq)
    new = [free.pop(0) for _ in range(len(seq) - m)]   # prefill only the unmatched tail
    tree.insert(seq, reused + new)
    print(f"insert {seq}: matched {m}, reused {reused}, new {new}")
    tree.show()
print("insert [1..6] again with slots [20..25]: matched",
      tree.insert([1, 2, 3, 4, 5, 6], list(range(20, 26))))
leaf = tree.root.children[1].children[9]           # the leaf [9] under [1, 2]
tree.delete_leaf(leaf)
free += leaf.value                                 # the leaf's slots return to the pool
print("delete the leaf [9]: free slots", free)
```

```text
insert [1, 2, 3, 4, 5, 6]: matched 0, reused [], new [0, 1, 2, 3, 4, 5]
- [1, 2, 3, 4, 5, 6] slots [0, 1, 2, 3, 4, 5]
insert [1, 2, 3, 4, 7, 8]: matched 4, reused [0, 1, 2, 3], new [6, 7]
- [1, 2, 3, 4] slots [0, 1, 2, 3]
  - [5, 6] slots [4, 5]
  - [7, 8] slots [6, 7]
insert [1, 2, 9]: matched 2, reused [0, 1], new [8]
- [1, 2] slots [0, 1]
  - [3, 4] slots [2, 3]
    - [5, 6] slots [4, 5]
    - [7, 8] slots [6, 7]
  - [9] slots [8]
insert [1..6] again with slots [20..25]: matched 6
delete the leaf [9]: free slots [9, 10, 11, 8]
```

The important lines:

1. `mid.value, child.value = child.value[:n], child.value[n:]` cuts the slot list at the same $n$ as the token run. In the output, [0, 1, 2, 3, 4, 5] becomes [0, 1, 2, 3] and [4, 5]. Then [0, 1, 2, 3] becomes [0, 1] and [2, 3].
2. `match_slots` collects `child.value[:n]`: only the first $n$ slots of the last edge belong to the match.
3. The demo loop is the request lifecycle in miniature: match, take new slots only for the tail, insert. Page 04 adds prefill, decode and locking.
4. `insert` returns the matched length. The repeated insert of [1..6] returns 6: all of the caller's 6 slots are duplicates, and a real engine frees them.
5. `delete_leaf` plus `free += leaf.value` returns the slots of [9] to the pool. Slot 8 is free again.

### Exercises

1. **Match with an offset.** Write `match_with_offset(root, seq)` that returns `(node, offset, length)` and does not change the tree. `offset` is the number of tokens of `node`'s edge that the match uses. Then write `split_at(node, offset)` that splits only when `offset` is inside the edge and returns the node where the match ends. Acceptance test: on the tree of section 6.2, `[1,2,3,9]` gives edge [3, 4], offset 1, length 3. `[1,2,3,4,7,8,10]` gives edge [7, 8], offset 2, length 6. `[1]` gives edge [1, 2], offset 1, length 1. `[5]` gives the root, offset 0, length 0. The tree still has 5 nodes. After `split_at` for `[1,2,3,9]`, the end node is [3] and the tree has 6 nodes.
   - Hint 1: Keep the last child and its `n` from the loop of `match`. Do not break before you store them.
   - Hint 2: `split_at` is the `_split` of section 9.1. Return the node unchanged when `offset == len(node.tokens)`.
2. **Insert with split and slot values.** Write `SlotRadixTree.insert(seq, slots)` from scratch. It returns the length that was already cached and also handles a query that ends inside an edge (split, no new leaf, like SGLang). Acceptance test: insert [1..6] with slots [0..5] returns 0. [1, 2, 3, 4, 7, 8] with [0, 1, 2, 3, 6, 7] returns 4. [1, 2, 9] with [0, 1, 8] returns 2, and the nodes [1, 2], [3, 4], [9] hold [0, 1], [2, 3], [8]. Then [1, 2, 3] returns 3, creates the nodes [3] and [4] with slots [2] and [3], and the tree has 6 nodes. [1..6] again returns 6. Every node has as many slots as tokens.
   - Hint 1: Only two places create or change nodes: the new leaf (case A) and the split (case B).
   - Hint 2: In case C, the loop simply ends. Return the loop index.
3. **Count nodes and tokens.** Write `stats(seqs)` that returns `(trie_nodes, radix_nodes, tokens_stored, tokens_total)`, where `radix_nodes` counts the fully merged form. Acceptance test: the three sequences give `(9, 5, 9, 15)`. The 100 requests of section 5.3 give `(7000, 101, 7000, 205000)`. `[[1, 2], [1, 2, 3]]` gives `(3, 1, 3, 5)`, while the insert of section 9.1 builds 2 nodes for it (section 6.3).
   - Hint 1: Build a trie of nested dictionaries. Do not use recursion: a 2,000-token chain is deeper than Python's default recursion limit of 1,000.
   - Hint 2: In the trie, a node starts a new radix edge if its parent is the root or has more than one child.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/01-background-tries-and-radix-trees)

## 10. Common mistakes

1. **"A radix tree stores fewer tokens than a trie."** It stores the same tokens. It has fewer nodes, so less memory around the tokens: 9 tokens in both structures of section 6.2, but 5 nodes instead of 9.
2. **"A match always ends at a node."** It can end inside an edge. The query [1, 2, 3, 9] matches 3 tokens and stops at offset 1 of the edge [3, 4]. SGLang then splits the node.
3. **"A match is read-only."** In SGLang 0.5.22, a match can split a node and always refreshes `last_access_time` on its path.
4. **"Two children of a node may start with the same token."** The insert would have followed and split the first child instead. The first tokens of siblings are always different, so the first token works as a dictionary key.
5. **"Deleting a leaf merges the parent with its last child."** A textbook radix tree does that. SGLang 0.5.22 `_delete_leaf` only pops the leaf and updates the leaf status of the parent.
6. **"Any node with refcount 0 can be deleted."** Only a leaf can be deleted. An internal node holds the first tokens of all sequences below it.
7. **"The cost of a match grows with the number of cached requests."** A match costs at most $L + 1$ token comparisons and $d + 1$ dictionary lookups, whatever the number of stored sequences.
8. **"A split copies KV data."** It cuts the token run and the list of slot numbers. The K and V tensors stay in their slots in the KV pool.

## 11. One-minute explanation

A serving engine must find, for each new request, the stored sequence that shares the longest beginning with it. A dictionary of whole prompts finds only exact repeats, and a scan over all stored sequences costs work for every sequence. A trie solves this with one token per edge: the path from the root spells a prefix, and shared prefixes share nodes. A radix tree merges every chain of single-child nodes into one edge that holds a run of tokens. So it stores the same tokens with far fewer nodes, at most $2n - 1$ for $n$ leaves. A node finds its child with a dictionary keyed by the first token of the child's edge, because siblings never share a first token. A match walks down and can end inside an edge, and SGLang then splits that node so the matched prefix is a path. An insert splits at most one edge, cuts the slot list of that edge at the same position, and appends one leaf. Only leaves can be deleted, and SGLang 0.5.22 does not merge a parent with its last child afterwards. Compared with vLLM's hash chain, the tree matches to the exact token but costs more to update and to share across machines.

## 12. Check questions

```check
{"question": "Insert [10, 11, 12, 13, 14], [10, 11, 12, 20] and [10, 30, 31] into an empty radix tree. Draw the tree. How many nodes do the trie and the radix tree have, and how many tokens does each store?", "hint": "Find the branch points first: where do the sequences stop agreeing?", "answer": "The tree is `[10] → {[11, 12] → {[13, 14], [20]}, [30, 31]}`.\n\n| Structure | Nodes | Tokens stored | Input tokens |\n|---|---|---|---|\n| Trie | 8 | 8 | 12 |\n| Radix tree | 5 | 8 | 12 |\n\nThe trie has one node per distinct prefix token. The first sequence adds 5, the token 20 adds 1, and the tokens 30 and 31 add 2. The radix tree has one node per branch point or leaf. It has 3 leaves and $2 \\times 3 - 1 = 5$ nodes, the maximum. Both store the same 8 tokens. Another insert order gives the same tree, with the children in another order."}
```

```check
{"question": "On the tree of the question above, match the query [10, 11, 12, 13, 99]. Give the matched prefix length, the edge where the match ends, and what SGLang 0.5.22 does at that point.", "answer": "1. Root, key 10: the edge [10] matches fully. Matched: 1.\n2. Node [10], key 11: the edge [11, 12] matches fully. Matched: 3.\n3. Node [11, 12], key 13: the edge [13, 14]. The token 13 matches, 99 differs from 14. Matched: 4.\n\nThe matched prefix length is 4, and the match ends inside the edge [13, 14] at offset 1. SGLang's `match_prefix` splits that node once: [13, 14] becomes [13] with the child [14]. It returns the node [13], so the matched prefix is exactly the path root → [10] → [11, 12] → [13]. It also refreshes `last_access_time` on the visited nodes."}
```

```check
{"question": "Why must a split cut the slot list at the same position as the token run? Show what goes wrong with the edge [1, 2, 3, 4] and the slots [0, 1, 2, 3] if it does not.", "answer": "Each slot holds the key and value vectors of exactly one token at one position. The slot list of a node is aligned with its token run: the $j$-th token uses the $j$-th slot. A split after 2 tokens must give [1, 2] the slots [0, 1] and [3, 4] the slots [2, 3].\n\nSuppose the cut were wrong, for example [1, 2] with [0] and [3, 4] with [1, 2, 3]. A later query [1, 2, 9] matches 2 tokens but gets only 1 slot. The engine would attend to too few keys, or it would read slot 1 as the KV of token 3. Both give wrong attention results, with no error message. So the invariant is: every node has exactly as many slots as tokens, in the same order. Exercise 2 tests it."}
```

```check
{"question": "Interview follow-up: SGLang indexes its prefix cache with a radix tree, vLLM with a hash chain over 16-token blocks. Compare the two with concrete numbers. When would you prefer each?", "hint": "Think about granularity, the cost of a lookup and of an update, and sharing between machines.", "answer": "| Aspect | Radix tree (page size 1) | Hash chain (16-token blocks) |\n|---|---|---|\n| Granularity | Any token | Full blocks only |\n| A 40-token shared prompt | 40 tokens reused | 32 tokens reused, 8 recomputed |\n| The query [1, 2, 3, 9] against [1, 2, 3, 4, ...] | 3 tokens reused | 0 tokens reused |\n| Lookup | Walk: at most $L + 1$ token comparisons and $d + 1$ dictionary lookups | Hash every full block, then one map lookup per block until the first miss |\n| Update | At most one split and one new node | One map entry per new full block, no structural change |\n| Sharing across machines | Needs tokens or a router-side tree | Easy: equal content gives an equal hash |\n\nPrefer the radix tree when prefixes often end at arbitrary token positions and the cache lives on one engine: few-shot prompts, chat histories, branching programs. Prefer the hash chain when the cache must be shared or routed across many machines, or when a flat map is simpler to make concurrent. Interpretation of these notes: the designs converge. SGLang can use pages larger than one token, and then its matches are also rounded down to whole pages (page 10)."}
```

```check
{"question": "Interview follow-up: After an eviction, SGLang 0.5.22 can leave a parent with a single child. Is the tree still correct? What does it cost, and why might the code not merge the two nodes?", "answer": "**Correct:** yes. The path from the root still spells the same prefixes, and every node still holds one slot per token. A match simply visits one more node.\n\n**Cost:** one more dictionary lookup and one more timestamp update per match on that path, plus one more node object.\n\n**What the code does:** `_delete_leaf` pops the leaf from `node.parent.children`, subtracts its length from `evictable_size_`, removes it from `evictable_leaves` and calls `_update_leaf_status(node.parent)`. No line merges the parent with its remaining child.\n\n**Why not merge (interpretation of these notes):** a merge must join two slot tensors and choose one `lock_ref`, one `last_access_time` and one `hit_count`. The two nodes can differ: a running request can lock [1, 2] but not [3, 4]. A merge would lose that information. The boundary also tends to return, because many requests branch at the same place, for example after a system prompt. The other single-child boundaries follow the same design. A new chat turn is appended as a child, and a match splits a node where it ends."}
```

```check
{"question": "Interview follow-up: How much does a match cost in a tree with one million cached requests? When is a match expensive, and where does that cost matter in SGLang?", "answer": "Let $L$ be the query length and $d$ the number of nodes on the matched path. A match costs at most $L + 1$ token comparisons and $d + 1$ dictionary lookups. The number of cached requests does not appear. The walk never visits a branch that the query does not follow.\n\nThe expensive cases:\n\n1. **A long match.** A 100,000-token prompt that matches fully costs 100,000 token comparisons. SGLang 0.5.22 moves them into C with galloping slice comparisons (`RadixKey.match_at`). Take a 2,000-token edge that differs at position 1,500. The match then needs 21 slice comparisons over 2,975 tokens, not about 1,500 Python steps (computed in these notes).\n2. **Many short nodes on one path.** Splits and appended chat turns can make $d$ large. Each node adds a dictionary lookup and a timestamp update.\n3. **Many matches per scheduling round.** A cache-aware scheduler matches every waiting request again in each round. SGLang 0.5.22 therefore uses FCFS for a round when the waiting queue holds more than 128 requests (`WAITING_QUEUE_PREFIX_MATCH_MAX = 128`). Page 06 explains it."}
```

```check
{"question": "Interview follow-up: How does SGLang 0.5.22 keep the cache entries of two LoRA adapters apart, when their prompts have the same tokens?", "answer": "Through the key of the tree. A `RadixKey` carries `extra_key` (for example the adapter) and `cache_salt` besides the token IDs. `child_key_at` puts them into every child key: it returns `(extra_key, first_token)` when `extra_key` is set, and `((extra_key, cache_salt), first_token)` when a salt is set. So two requests with the same first token but different adapters use different keys at the root, and their paths never share a node. `match_at` also calls `_check_compatible`, which raises a `ValueError` when two keys have different `extra_key` or `cache_salt` values. The `match_prefix` docstring states the goal: entries with identical token IDs but different `extra_key` values \"are intentionally kept disjoint and never share prefix nodes\". This is required for correctness: another adapter gives other keys and values for the same tokens."}
```

```check
{"question": "With `page_size = 4`, SGLang stores [1, 2, 3, 4, 5, 6, 7, 8] and then receives [1, 2, 3, 9, 10, 11, 12, 13]. What are the child keys at the root, and what is the matched prefix length of the second sequence?", "answer": "With a page size above 1, `child_key` is the tuple of the first page. The first sequence is stored under the key `(1, 2, 3, 4)`. The second sequence's first page is `(1, 2, 3, 9)`, a different key. So the root has two children, and the matched prefix length is 0. The first 3 tokens are equal, but a match is rounded down to whole pages: $\\lfloor 3/4 \\rfloor \\times 4 = 0$. Siblings can share first tokens with pages, but never a whole first page. This is the cost of pages larger than one token: partial-page sharing is lost (page 10)."}
```

```check
{"question": "Exercise 1: show a reference solution", "answer": "```python\nclass Node:\n    def __init__(self, tokens=(), parent=None):\n        self.tokens, self.children, self.parent = list(tokens), {}, parent\n\ndef build(seqs):\n    \"\"\"A small radix tree builder (insert with split), for the tests.\"\"\"\n    root = Node()\n    for seq in seqs:\n        node, i = root, 0\n        while i < len(seq):\n            child = node.children.get(seq[i])\n            if child is None:\n                node.children[seq[i]] = Node(seq[i:], node)\n                break\n            n = 0\n            while n < len(child.tokens) and i + n < len(seq) and child.tokens[n] == seq[i + n]:\n                n += 1\n            if n < len(child.tokens):\n                mid = Node(child.tokens[:n], node)\n                node.children[seq[i]] = mid\n                child.tokens, child.parent = child.tokens[n:], mid\n                mid.children[child.tokens[0]] = child\n                child = mid\n            node, i = child, i + n\n    return root\n\ndef match_with_offset(root, seq):\n    \"\"\"Return (node, offset, length). The match uses `offset` tokens of `node`'s edge.\n    No token matched: (root, 0, 0). The tree is not changed.\"\"\"\n    node, offset, i = root, 0, 0\n    while i < len(seq) and seq[i] in node.children:\n        child = node.children[seq[i]]\n        n = 0\n        while n < len(child.tokens) and i + n < len(seq) and child.tokens[n] == seq[i + n]:\n            n += 1\n        node, offset, i = child, n, i + n\n        if n < len(child.tokens):          # the match ends inside this edge\n            break\n    return node, offset, i\n\ndef split_at(node, offset):\n    \"\"\"Make the match end exactly at a node (what SGLang's match_prefix does).\"\"\"\n    if offset == len(node.tokens) or node.parent is None:\n        return node\n    mid = Node(node.tokens[:offset], node.parent)\n    node.parent.children[mid.tokens[0]] = mid\n    node.tokens, node.parent = node.tokens[offset:], mid\n    mid.children[node.tokens[0]] = node\n    return mid\n\ndef count(root):\n    st, n = [root], -1\n    while st:\n        x = st.pop(); n += 1; st.extend(x.children.values())\n    return n\n\nroot = build([[1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 7, 8], [1, 2, 9]])\ntests = {(1, 2, 3, 9): ([3, 4], 1, 3), (1, 2, 3, 4, 7, 8, 10): ([7, 8], 2, 6),\n         (1, 2): ([1, 2], 2, 2), (1,): ([1, 2], 1, 1), (5,): ([], 0, 0)}\nfor q, (edge, off, length) in tests.items():\n    node, o, L = match_with_offset(root, list(q))\n    assert (node.tokens, o, L) == (edge, off, length), (q, node.tokens, o, L)\n    print(list(q), \"-> edge\", node.tokens, \"offset\", o, \"length\", L)\nassert count(root) == 5                       # a match does not change the tree\nnode, o, L = match_with_offset(root, [1, 2, 3, 9])\nend = split_at(node, o)\nprint(\"after split_at: end node\", end.tokens, \"nodes\", count(root))\nassert end.tokens == [3] and count(root) == 6\nassert match_with_offset(root, [1, 2, 3, 9])[2] == 3\n```\n\nOutput:\n\n```text\n[1, 2, 3, 9] -> edge [3, 4] offset 1 length 3\n[1, 2, 3, 4, 7, 8, 10] -> edge [7, 8] offset 2 length 6\n[1, 2] -> edge [1, 2] offset 2 length 2\n[1] -> edge [1, 2] offset 1 length 1\n[5] -> edge [] offset 0 length 0\nafter split_at: end node [3] nodes 6\n```\n\n`match_with_offset` stores the last child and its `n` before it checks for the end inside an edge. So it can report the offset without a split. `split_at` is the SGLang design: it makes the end of the match a real node, so that a caller can lock exactly the matched path. The root has an empty edge, so the miss case prints `edge []`."}
```

```check
{"question": "Exercise 2: show a reference solution", "answer": "```python\nclass Node:\n    def __init__(self, tokens=(), value=(), parent=None):\n        self.tokens, self.value = list(tokens), list(value)   # one slot per token\n        self.children, self.parent = {}, parent\n\nclass SlotRadixTree:\n    def __init__(self):\n        self.root = Node()\n\n    def _split(self, child, n):\n        mid = Node(child.tokens[:n], child.value[:n], child.parent)\n        mid.parent.children[mid.tokens[0]] = mid\n        child.tokens, child.value, child.parent = child.tokens[n:], child.value[n:], mid\n        mid.children[child.tokens[0]] = child\n        return mid\n\n    def insert(self, seq, slots):\n        \"\"\"Insert seq with one slot per token. Return the length that was already cached.\n        The caller may free slots[:returned length] if they are its own duplicates.\"\"\"\n        assert len(seq) == len(slots)\n        node, i = self.root, 0\n        while i < len(seq):\n            child = node.children.get(seq[i])\n            if child is None:                            # new branch: the tail becomes a leaf\n                node.children[seq[i]] = Node(seq[i:], slots[i:], node)\n                return i\n            n = 0\n            while n < len(child.tokens) and i + n < len(seq) and child.tokens[n] == seq[i + n]:\n                n += 1\n            if n < len(child.tokens):                    # stop or diverge inside the edge\n                child = self._split(child, n)\n            node, i = child, i + n\n        return i                                         # everything was already cached\n\n    def nodes(self):\n        st, out = [self.root], []\n        while st:\n            x = st.pop()\n            if x is not self.root:\n                out.append(x)\n            st.extend(x.children.values())\n        return out\n\n    def by_tokens(self):\n        return {tuple(x.tokens): x.value for x in self.nodes()}\n\nt = SlotRadixTree()\nassert t.insert([1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 4, 5]) == 0\nassert t.insert([1, 2, 3, 4, 7, 8], [0, 1, 2, 3, 6, 7]) == 4\nassert t.by_tokens()[(5, 6)] == [4, 5]\nassert t.insert([1, 2, 9], [0, 1, 8]) == 2\nd = t.by_tokens()\nassert d[(1, 2)] == [0, 1] and d[(3, 4)] == [2, 3] and d[(9,)] == [8]\nassert t.insert([1, 2, 3], [0, 1, 2]) == 3               # ends inside [3, 4]: split, no leaf\nd = t.by_tokens()\nassert d[(3,)] == [2] and d[(4,)] == [3] and len(t.nodes()) == 6\nassert t.insert([1, 2, 3, 4, 5, 6], [20, 21, 22, 23, 24, 25]) == 6   # all duplicates\nassert all(len(x.tokens) == len(x.value) for x in t.nodes())\nfor x in sorted(t.nodes(), key=lambda x: x.value[0]):\n    print(x.tokens, \"slots\", x.value)\nprint(\"all tests pass\")\n```\n\nOutput:\n\n```text\n[1, 2] slots [0, 1]\n[3] slots [2]\n[4] slots [3]\n[5, 6] slots [4, 5]\n[7, 8] slots [6, 7]\n[9] slots [8]\nall tests pass\n```\n\nThe new leaf takes `slots[i:]`, the slots of the unmatched tail. `_split` cuts the tokens and the slots at the same `n`. When the query ends inside an edge, the loop splits and then ends, which is case C with a split, as in SGLang's `_insert_helper`. The return value is the loop index: the length that was already cached. A caller frees its own slots in that range if they are duplicates."}
```

```check
{"question": "Exercise 3: show a reference solution", "answer": "```python\ndef stats(seqs):\n    \"\"\"Nodes of a trie, nodes of a radix tree, tokens stored, tokens in the input.\"\"\"\n    trie = {}                                    # nested dicts: token -> child dict\n    for s in seqs:\n        d = trie\n        for tok in s:\n            d = d.setdefault(tok, {})\n    trie_nodes, radix_nodes = 0, 0\n    stack = [(trie, True)]                       # (dict, is this the root?)\n    while stack:                                 # no recursion: chains can be 2,000 deep\n        d, is_root = stack.pop()\n        for child in d.values():\n            trie_nodes += 1\n            if is_root or len(d) > 1:            # a child of the root or of a branch point\n                radix_nodes += 1                 # starts a new radix edge\n            stack.append((child, False))\n    return trie_nodes, radix_nodes, trie_nodes, sum(len(s) for s in seqs)\n\nsmall = [[1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 7, 8], [1, 2, 9]]\nprint(stats(small))\nassert stats(small) == (9, 5, 9, 15)\nshared = list(range(100_000, 102_000))           # a 2,000-token system prompt\nreqs = [shared + [200_000 + 1_000 * r + j for j in range(50)] for r in range(100)]\nprint(stats(reqs))\nassert stats(reqs) == (7_000, 101, 7_000, 205_000)\nchat = [[1, 2], [1, 2, 3]]                       # turn 2 extends turn 1\nprint(stats(chat))\nassert stats(chat) == (3, 1, 3, 5)\n```\n\nOutput:\n\n```text\n(9, 5, 9, 15)\n(7000, 101, 7000, 205000)\n(3, 1, 3, 5)\n```\n\nIn a trie, a node starts a new radix edge exactly when its parent is the root or a branch point. Every other node continues the edge of its parent. Tokens stored equal trie nodes, because each trie node holds one token. The last test shows the difference between two forms (section 6.3). The fully merged form has 1 node. The inserts build 2 nodes, [1, 2] → [3]."}
```

## 13. Links

- Previous: [00 The paper on one page](/notes/papers/llm-serving/2023-sglang-radixattention/00-paper-on-one-page)
- Next: [02 Background: prefix sharing in LM programs](/notes/papers/llm-serving/2023-sglang-radixattention/02-background-prefix-sharing-in-lm-programs)
- The tree with KV slots in action: [04 RadixAttention: the tree of KV caches](/notes/papers/llm-serving/2023-sglang-radixattention/04-radixattention-the-tree-of-kv-caches)
- Leaves-first eviction and reference counts: [05 Eviction and reference counts](/notes/papers/llm-serving/2023-sglang-radixattention/05-eviction-and-reference-counts)
- The real code, pages and namespaces: [10 RadixAttention in SGLang today](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today)
- The vLLM hash chain and a minimal radix tree: [L9: Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)
- Blocks, slots and block tables: [PagedAttention 05: The KV cache manager](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager)
- The paper folder: [SGLang and RadixAttention (2023)](/notes/papers/llm-serving/2023-sglang-radixattention), [Glossary](/notes/papers/glossary)

### Sources

- Zheng et al., "SGLang: Efficient Execution of Structured Language Model Programs", NeurIPS 2024, arXiv 2312.07104 v2, §3 (radix tree, quotes on this page): https://arxiv.org/abs/2312.07104 (checked on 2026-10-19)
- SGLang 0.5.22 wheel on PyPI, released 2026-10-16, source file `sglang/srt/mem_cache/radix_cache.py` (`RadixKey.match_at`, `RadixKey.child_key_at`, `match_prefix`, `_split_node`, `_insert_cache`, `_delete_leaf`): https://pypi.org/project/sglang/0.5.22/ (checked on 2026-10-19)
- SGLang repository (Apache License 2.0): https://github.com/sgl-project/sglang (checked on 2026-10-19)
