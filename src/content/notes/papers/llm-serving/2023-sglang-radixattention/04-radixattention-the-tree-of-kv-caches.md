---
title: "04 RadixAttention: the tree of KV caches"
order: 4
summary: "How RadixAttention keeps the KV cache of finished requests and reuses it: a radix tree of token runs on the CPU, whose nodes hold slot numbers into a GPU pool with pages of one token. What a node stores and costs, the life of a request (match, lock, compute the suffix, insert, unlock), the nine-step running example with every number, how attention gathers scattered slots, what SGLang 0.5.22 does differently, and a small RadixCache in Python."
status: not-started
tags: [radixattention, sglang, kv-cache, radix-tree, prefix-caching, kv-pool, page-size]
---

## 1. The question this page answers

Page 03 asked a question. Can a runtime keep the KV cache of every finished call, and reuse it for any later call with the same first tokens? RadixAttention is the paper's answer (§3 and Appendix A). The paper describes a radix tree that maps token sequences to their KV cache tensors.

That one sentence hides many details, and an interviewer will ask about each of them:

1. What exactly does the system keep when a request finishes?
2. Where do the tree and the KV live? What does one node store, and what does it cost?
3. What happens, step by step, from the arrival of a request to its end?
4. How does the tree change over many requests, when the pool is full?
5. How does attention read KV from slots that are scattered in memory?
6. What does SGLang 0.5.22 do differently from the paper's description?

Eviction and reference counts get their own page (05). Scheduling gets page 06. This page builds the data structure and follows it through a long example.

## 2. Mental model

> [!analogy] A folder tree that refers to a warehouse
> Picture a cabinet of folders. Each folder name is a run of words, and a path of folders from the top spells a full text. A folder does not hold paper. It holds a list of shelf numbers in a large warehouse, one shelf per word, where the expensive finished work for that word sits. To serve a new text, a clerk walks down the folders while the words agree, and collects the shelf numbers on the way. Only the words after the last matching folder need new work, on free shelves. When the text is done, the clerk adds one folder for its new words, so that the next clerk finds them too.
>
> **Where it stops working:** the work on a shelf is valid only after the exact parent folders. The work for a word depends on every earlier word. A clerk can also stop in the middle of a folder name, and must then cut that folder in two. And the warehouse also holds the work in progress. When few shelves are free, the clerk empties the bottom folders that nobody opened for the longest time.

## 3. Terms

| Term | Plain meaning |
|---|---|
| radix tree | A tree whose edges hold runs of tokens. A path from the root spells a token sequence. |
| node | One element of the tree. It holds one edge and the slot numbers of the KV of its tokens. |
| edge | The run of tokens stored at a node. It can have any length. |
| root | The top node. It holds no tokens. Every stored sequence starts at the root. |
| leaf | A node without children. |
| match | Walk down the tree with the tokens of a request, as long as they agree with the edges. |
| matched prefix length | The number of first tokens of a request that the tree already holds. |
| split | Cut one node into two at a token position, so that a match or an insert ends exactly there. |
| insert | Add a sequence to the tree: walk its matched part, then append one new node for the rest. |
| KV pool | The GPU memory for KV: one large array of token slots, shared by cached tokens and running requests. |
| slot | The place in the KV pool for the key and value of one token, in every layer. |
| slot number | The index of a slot in the KV pool. The value of a node is a list of slot numbers. |
| page size | The number of tokens in one page of the KV pool. The paper uses 1. |
| request-to-token table | A table with one row per running request. A row lists the slot number of each token of the request. |
| reference count | The number of running requests that use a node. The paper calls it the "reference counter", and SGLang 0.5.22 calls it `lock_ref`. |
| evict | Release the slots of a cached node and remove the node from the tree. |
| extend | Prefill with a cached prefix: compute only the new tokens, which also attend to the cached ones. |
| hit rate | The paper's measure: cached prompt tokens divided by all prompt tokens. |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. The core idea: keep, index, match

### 4.1 What engines did before

The paper describes the engines of its time. "In existing inference engines, the KV cache of a request is discarded after processing is completed." A chat turn computes the KV of the whole history, generates a reply, and frees all of it. The next turn computes the same history again, plus one message.

### 4.2 Three moves

RadixAttention changes this with three moves:

1. **Keep.** When a request finishes, its KV stays in GPU memory. This covers the prompt and the generated tokens.
2. **Index.** The token sequence of the request is inserted into a radix tree. The paper calls a radix tree "a space-efficient alternative to a classical trie (prefix tree)". Its edges hold runs of tokens of any length, not single tokens (page 01).
3. **Match.** Every new request walks the tree and takes the KV of its longest cached prefix. Prefill computes only the rest.

No program declares which prefix to share. The runtime finds every shared prefix by itself, which is why the paper calls the reuse automatic.

### 4.3 Why reuse is exact, for prompts and for outputs

The paper's argument (Appendix A.1): "the computation of the KV cache only depends on all previous tokens". So if a new request starts with the tokens of a cached sequence, the cached keys and values equal what prefill would compute. Page 02 shows this from causal attention.

The argument holds for generated tokens too. The KV of a token depends on the token ids, not on how the sampler chose them. So the reply of turn 1 is as reusable as its prompt. This is why the tree stores the output of every request: the next turn of a chat starts with that output.

> [!key] RadixAttention in one sentence
> Keep the KV of every finished request in the GPU pool. Index it by its tokens in a radix tree on the CPU. Give every new request the KV of its longest cached prefix.

## 5. What is stored where

### 5.1 Three structures

RadixAttention needs three structures. The paper describes the first two. The third is how SGLang connects a running request to its slots.

| Structure | Where | What it holds | Name in SGLang 0.5.22 |
|---|---|---|---|
| Radix tree | CPU memory (the paper). In SGLang 0.5.22 the node objects and token ids are in CPU memory, and each node's tensor of slot numbers is on the GPU. | Nodes with token ids, slot numbers, reference counts and access times. No K or V numbers. | `RadixCache` and `TreeNode` in `radix_cache.py` |
| KV pool | GPU memory | For every layer, one K array and one V array with one row per slot. | the KV buffers in `memory_pool.py`, with `token_to_kv_pool_allocator` for free slots |
| Request-to-token table | GPU memory | One row per running request, with the slot number of each of its tokens. | `req_to_token_pool`, of class `ReqToTokenPool`: "A memory pool that maps a request to its token locations." |

The paper states where the first two live. The KV is "stored in a non-contiguous, paged layout, where the size of each page is equivalent to one token". And "The tree structure is stored on the CPU with negligible maintenance overhead."

Interpretation of these notes: the request-to-token table is the block table of PagedAttention with a block size of 1 ([05 The KV cache manager](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager)). One cached sequence can appear in the rows of many requests at the same time.

![Alt text: CPU tree nodes SYS, C1.1, C1.2 and C2.1 with arrows to their slot ranges in an 80-slot GPU pool, and one request row](/notes/media/papers/2023-sglang-radixattention/figures/04-cpu-tree-gpu-pool.svg)

The figure shows the state after step 4 of the running example (section 7). The program of section 9 prints the same slot numbers. The row of chat 2, turn 1 is the slots of its path, SYS and then C2.1: $[0..7, 45..52]$.

### 5.2 A node, field by field

| What the paper needs | `TreeNode` field in SGLang 0.5.22 | Content |
|---|---|---|
| The edge | `key` | A `RadixKey`: the token ids of the edge, plus optional namespace keys (page 10). |
| The KV of the edge | `value` | A tensor of KV pool indices, one per token. A node counts as evicted when `value` is `None`. |
| The children | `children` | A dictionary keyed by the first token of each child edge. With a page size above 1, the key is the first page of tokens. |
| The parent | `parent` | The node above. Lock and unlock walk these links to the root. |
| The reference counter | `lock_ref` | The number of running requests that use the node. |
| Recency for LRU | `last_access_time` | Refreshed on every node of the path at each match and insert. |
| Other eviction policies | `hit_count`, `creation_time`, `priority` | Used by LFU, FIFO and priority eviction (page 05). |

Why does a dictionary keyed by the first token work? Two children of one node never start with the same token. If they did, they would share that token, and the tree would hold it once in a common node above them. So the first token of the next part of a request selects at most one child, with one dictionary access.

> [!key] Numbers on the CPU, bytes on the GPU
> The tree is an index: each node holds token ids and slot numbers. The K and V bytes live in one GPU pool with pages of one token, which cached tokens and running requests share.

> [!note] Which SGLang class these notes read
> These notes read `RadixCache` in `radix_cache.py`, the single-component implementation of the algorithm. In SGLang 0.5.22 the default server class is `UnifiedRadixCache`. It runs the same algorithm over several kinds of state with a Rust tree core ([page 10](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today), section 4.2).

> [!trap] The tree holds numbers, not tensors
> A node's `value` is a list of slot numbers, not the keys and values. The K and V numbers stay in the GPU pool. Evicting a node calls `free_segment(x.value)`, which returns the slots to the allocator. Interpretation of these notes: the old K and V bytes stay in GPU memory until a new token writes into the same slot.

### 5.3 What one node costs

> [!example] Worked example: the 8-token node SYS for Llama-3.1-8B
> 1. KV per token: $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes $= 128$ KiB. The factors: K and V, 32 layers, 8 KV heads, 128 numbers, 2 bytes ([L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)).
> 2. GPU side: 8 slots × 128 KiB $= 1{,}048{,}576$ bytes $= 1$ MiB.
> 3. Index side: 8 token ids and 8 slot numbers. SGLang 0.5.22 keeps token ids in an `array("q")` in CPU memory. It keeps slot numbers in a `torch.int64` tensor on the GPU. Both use 8 bytes per number. That is $16 \times 8 = 128$ bytes of numbers, plus the fixed size of the Python objects.
> 4. Ratio: $1{,}048{,}576 / 128 = 8{,}192$. The KV bytes of the node are 8,192 times larger than its index numbers.
>
> So the tree is small, as the paper claims. Its real cost is CPU time for each match and insert, not memory (page 11).

### 5.4 Why one token per page, and what it costs

The paper chose a page size of one token. Interpretation of these notes: this choice gives three properties.

1. **A match can end at any token.** A 12-token prompt that shares 8 tokens reuses 8. With 16-token blocks, it would reuse 0 (the block-alignment effect of [L9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse), section 5.3).
2. **A split can happen at any token.** A node cuts into two lists of slot numbers, and no page holds tokens of two nodes.
3. **No partial page exists.** Each slot belongs to exactly one token, so a cached node never ends in a half-filled page.

The costs are real too:

> [!example] Worked example: the extra bytes of one index per token
> Llama-3.1-8B, one layer. SGLang 0.5.22 stores the request-to-token table as `int32`, so one index takes 4 bytes.
>
> 1. K and V of one token in one layer: $2 \times 8 \times 128 \times 2 = 4{,}096$ bytes.
> 2. Index read for that token: 4 bytes.
> 3. Extra bytes: $4 / 4{,}096 \approx 0.098\%$.
> 4. With 16-token blocks, one 4-byte entry serves 16 tokens: $4 / 65{,}536 \approx 0.0061\%$ ([PagedAttention 04](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm), section 9.1).
>
> One index per token reads 16 times more index bytes than 16-token blocks. Both are small next to the K and V bytes.

Bytes are not the main cost. In the default layout of SGLang 0.5.22 (called NHD in the source), one slot is one row of shape (KV heads, head size) per layer. For Llama-3.1-8B, the K of one token is $8 \times 128 \times 2 = 2{,}048$ contiguous bytes. Interpretation of these notes: a kernel reads such a row efficiently, but the next token can be anywhere. Fast attention kernels and KV transfer between memory tiers prefer long contiguous pages. The HiCache docs say it directly: larger pages reduce metadata but can lower hit rates on partial matches.

So the default depends on the hardware. In SGLang 0.5.22, `--page-size` resolves to 1 on NVIDIA GPUs by default, and some backends force 64 or 128 (checked on 2026-10-19). With a page size above 1, a match is rounded down to whole pages. [Page 10](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today) works through that case.

## 6. The life of a request

### 6.1 Six steps

![Alt text: six panels for chat 1 turn 2: match 16 tokens, lock, allocate 29 slots, compute, insert a 29-token leaf, unlock](/notes/media/papers/2023-sglang-radixattention/figures/04-request-lifecycle.svg)

Every request follows the same six steps. The figure uses step 3 of the running example: a prompt of 20 tokens and an output of 25 tokens.

1. **Match.** Walk the tree with the prompt. The result is the matched prefix length $m$, the last matched node, and the slot numbers of the $m$ matched tokens.
2. **Lock.** Add 1 to the reference count of every node from the last matched node up to the root.
3. **Allocate.** Take free slots for the new tokens. If too few slots are free, evict unlocked leaves first (page 05). These notes take the slots for the whole output in this step, to keep the trace short. A real engine takes one slot per decode step, because it does not know the output length in advance.
4. **Compute.** Prefill only the unmatched suffix (extend), then decode the output.
5. **Insert.** Insert the prompt and the output, with all their slot numbers, into the tree.
6. **Unlock.** Subtract 1 from the reference count of the locked path.

> [!key] Match, lock, compute the suffix, insert, unlock
> Every request reuses the KV of its longest cached prefix and protects that path while it runs. When it ends, it leaves its prompt and its output in the tree for the next request.

### 6.2 Match: walk, compare, split

The match starts at the root. At each node, it does three things:

1. **Choose the child.** The next token of the request selects at most one child, through the dictionary of section 5.2.
2. **Compare the edge.** It compares the edge with the next tokens of the request, one token at a time. It stops at the first difference or at the end of either.
3. **Decide.** If the whole edge matches and the request has more tokens, it moves down to the child. If the comparison stops inside the edge, it splits the node there and stops. If no child starts with the next token, it stops.

> [!example] Worked example: the match of step 4, with a split
> 1. The tree holds one edge below the root: SYS+C1.1, 16 tokens, slots 0 to 15. Its child is C1.2.
> 2. The request is chat 2, turn 1: SYS (8 tokens) plus "User: What can you do?" (4 tokens), so 12 tokens.
> 3. The first token of SYS selects the edge SYS+C1.1.
> 4. Tokens 0 to 7 agree. Token 8 differs: the edge continues with C1.1, the request with C2.1.
> 5. Split at 8: a new node SYS (8 tokens, slots 0 to 7) takes the place of the edge. Its only child is the rest, C1.1 (8 tokens, slots 8 to 15), which keeps its child C1.2.
> 6. Result: matched prefix length 8, last node SYS, matched slots $[0..7]$.
>
> In these notes, every token of C1.1 differs from the tokens of C2.1. A real tokenizer gives both user messages the same first tokens, such as "User" and ":". The real split then happens a few tokens later. The mechanism is the same.

The split copies no KV. It cuts one list of slot numbers into two lists. SGLang 0.5.22 splits during the match, and its docstring explains why: "If the lookup ends inside a stored segment the node is split once to expose a precise boundary; this structural refinement improves subsequent match efficiency and does not duplicate data."

In SGLang 0.5.22, `_match_prefix_helper` runs this loop. It stamps `last_access_time` on every node of the path, which is the recency that LRU eviction uses (page 05). It counts the agreeing tokens with `RadixKey.match_at`, a galloping search: it compares windows of doubling size, then halves the window that holds the first difference. When the count is shorter than the edge, it calls `_split_node` and stops. Page 10 walks through this code line by line. A match costs one dictionary access per node on the path, plus token comparisons up to the matched length (page 01).

### 6.3 Lock

A locked path cannot be evicted. The paper: each node keeps a reference counter of "how many running requests are using it", and a node can be evicted only when its counter is zero.

The lock covers the whole path, not only the last node. The request reads the KV of every node from the root to its last matched node. If an ancestor disappeared, the request would read freed slots. SGLang 0.5.22 does this in `inc_lock_ref`: it walks from the node to the root and adds 1 to `lock_ref` on each node. Page 05 explains the counters `evictable_size_` and `protected_size_` that this walk updates.

### 6.4 Allocate and compute

The request needs $(\text{prompt} - m) + \text{output}$ new slots. In step 3, that is $(20 - 16) + 25 = 29$. If the pool has fewer free slots, the scheduler evicts unlocked leaves, least recently used first, until enough slots are free (page 05).

Then the model runs. Prefill processes only the 4 unmatched prompt tokens, and their queries also read the 16 cached keys and values (section 8). Decode then generates 25 tokens. Each step writes the K and V of one token into one new slot.

### 6.5 Insert

When the request finishes, the system inserts its prompt and its output into the tree, with their slot numbers. Insert walks the tree like a match, and splits a node if the sequence differs inside an edge. Then it appends one new leaf for the tokens that the tree does not hold yet.

In step 3, the sequence has $20 + 25 = 45$ tokens. The first 16 are the node SYS+C1.1. The new leaf C1.2 holds the other 29 tokens and their 29 slots. So the tree now holds the reply of turn 2, and a third turn of chat 1 could match all 45 tokens.

Two requests in one batch can compute the same new tokens. Then the second insert finds tokens that the first insert already added. SGLang 0.5.22 releases the second copy in `_insert_cache`. Its docstring says that it inserts the key "and free the duplicates it exposed". Exercise 2 builds this. The frontend hint of page 07 avoids the double computation in the first place.

### 6.6 Unlock

The last step subtracts 1 from each reference count on the path. A node with count 0 becomes evictable when it is a leaf, or later when its children are evicted.

The paper's Algorithm 1 handles a finished request in this order: decrease its reference counter, then insert it into the tree. SGLang 0.5.22 inserts first and then unlocks (`release_kv_cache` in `mem_cache/common.py`). Interpretation of these notes: both orders are correct, because no eviction runs between the two operations.

### 6.7 What SGLang 0.5.22 does differently

The paper describes the mechanism. The code of SGLang 0.5.22 adds details that an interviewer may ask about:

1. **The prompt enters the tree right after its prefill.** After a prefill step of an unfinished request, the scheduler calls `checkpoint_kv_cache`. Its docstring: "Publish what the running request has computed so far". So a second request can hit a prompt while the first request still decodes. The paper's Algorithm 1 inserts only finished requests.
2. **The final insert splits at the prompt boundary.** `checkpoint` passes `split_prompt=True`. The source comment: "Split the leaf at the prompt boundary so eviction can drop the output KV without the prompt". So LRU can evict a reply before its prompt.
3. **A match covers at most the prompt length minus 1.** `Req._compute_max_prefix_len` says: "the matched length is at most 1 less than the input length to enable logprob computation". The last prompt token always runs, because the first output token needs its logits, and the tree stores KV, not logits. vLLM always computes the last token again too ([L9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse), section 5.5).
4. **Only tokens with computed KV enter the tree.** The last sampled token was never an input of the model, so it has no KV. `owned_kv_len` counts only committed KV (`kv_committed_len`).
5. **Duplicate slots are freed on insert** (section 6.5).

Where each step lives in SGLang 0.5.22: the match is in `Req.init_next_round_input` (`managers/schedule_batch.py`). The lock is in `PrefillAdder._commit_prefill_admission` (`managers/schedule_policy.py`). The inserts and the unlock are in `checkpoint_kv_cache` and `release_kv_cache` (`mem_cache/common.py`). Page 10 walks through this code.

## 7. The running example: nine steps

### 7.1 The setup

The paper's Figure 3 shows a radix tree at nine time points. These notes rebuild it with exact sizes. **The order of events follows the paper's Figure 3. The token counts and the pool capacity are choices of these notes.** The paper names its nodes with letters. These notes use their own names and do not reuse the letters.

| Name | Content | Tokens |
|---|---|---|
| SYS | "You are a helpful assistant." | 8 |
| C1.1 | chat 1, turn 1: "User: Hello!" (4) + "Assistant: Hi!" (4) | 8 |
| C1.2 | chat 1, turn 2: "User: Solve this problem ..." (4) + answer (25) | 29 |
| C2.1 | chat 2, turn 1: "User: What can you do?" (4) + "Assistant: I can ..." (4) | 8 |
| C2.2 | chat 2, turn 2: "User: Write a story ..." (4) + story (24) | 28 |
| FS | few-shot examples "Question 1: ... Answer 3: ..." | 12 |
| QA, QB, QC | one few-shot question (4) + one answer token (1) | 5 each |
| C1.2+3 | chat 1, turns 2 and 3, computed in step 8: 29 + "User: How about ...?" (4) + "Assistant: It is a ..." (4) | 37 |
| SCQ | the self-consistency question | 3 |
| S1 to S4 | four sampled answers | 3 each |

The rules:

1. One KV pool of **80 slots**, shared by cached tokens and running requests. Page size 1.
2. A request's prompt and output are inserted into the tree when it finishes.
3. Eviction removes the least recently used unlocked leaf, again and again, until enough slots are free.
4. The requests of one step run in one batch, and all of them lock their paths before any eviction.

### 7.2 Step by step

![Alt text: a grid of nine radix trees, one after each step, with hits, new nodes, evictions and a pool bar](/notes/media/papers/2023-sglang-radixattention/figures/04-nine-steps.svg)

**Step 1: start.** The tree holds only the root. All 80 slots are free.

**Step 2: chat 1, turn 1.** The prompt is SYS + "User: Hello!": 12 tokens. Nothing matches. The request needs $12 + 4 = 16$ slots, and 64 stay free. The prompt and the reply "Assistant: Hi!" form one edge of 16 tokens below the root.

```text
root
└── SYS+C1.1  16    new
```

**Step 3: chat 1, turn 2.** The prompt is the whole first turn (16 tokens) plus "User: Solve this problem ..." (4 tokens): 20 tokens. The match covers the whole edge, including the reply: 16 tokens. New slots: $4 + 25 = 29$, and 35 stay free. A new leaf C1.2 holds the message and the answer.

```text
root
└── SYS+C1.1  16    hit
    └── C1.2  29    new
```

**Step 4: chat 2, turn 1.** The prompt is SYS + "User: What can you do?": 12 tokens. The match stops after 8 tokens, inside the edge SYS+C1.1, so the node splits (section 6.2). New slots: $4 + 4 = 8$, and 27 stay free. Both chats now share the node SYS.

```text
root
└── SYS  8          hit (split from SYS+C1.1)
    ├── C1.1  8
    │   └── C1.2  29
    └── C2.1  8     new
```

**Step 5: chat 2, turn 2.** The prompt is SYS + C2.1 + "User: Write a story ...": 20 tokens. It matches 16. It needs $4 + 24 = 28$ slots, but only $80 - 53 = 27$ are free.

- The request locks SYS and C2.1, so they cannot be evicted.
- The only unlocked leaf is C1.2, last used in step 3. It is evicted: $27 + 29 = 56$ slots are free.
- C1.1 is now a leaf too, last used in step 3. But $56 \ge 28$, so eviction stops.
- After the step, 52 tokens are cached and 28 slots are free.

```text
root
└── SYS  8          hit
    ├── C1.1  8
    │   └── C1.2  29    evicted
    └── C2.1  8     hit
        └── C2.2  28    new
```

**Step 6: few-shot question QA.** The prompt is FS + QA's question: $12 + 4 = 16$ tokens. No child of the root starts with the first token of FS, so nothing matches. New slots: $16 + 1 = 17$, which fit in 28 and leave 11 free. The root gets a second child. The paper's narrative calls this a split of the root. In these notes, the root simply gets a new branch, because the root has no edge to cut.

```text
root
├── SYS  8
│   ├── C1.1  8
│   └── C2.1  8
│       └── C2.2  28
└── FS+QA  17       new
```

**Step 7: few-shot questions QB and QC, in one batch.** Each prompt is FS + a new question: 16 tokens. Each matches the 12 tokens of FS. The first match splits FS+QA into FS (12) and QA (5). New slots: $2 \times (4 + 1) = 10$, which fit in 11 and leave 1 free.

```text
root
├── SYS  8
│   ├── C1.1  8
│   └── C2.1  8
│       └── C2.2  28
└── FS  12          hit (split from FS+QA)
    ├── QA  5
    ├── QB  5       new
    └── QC  5       new
```

**Step 8: chat 1, turn 3.** The prompt is the whole history of chat 1 plus a new message: $8 + 8 + 29 + 4 = 49$ tokens. Only SYS and C1.1 are still cached, so the match covers 16 tokens. The 29 tokens of turn 2 must be computed again, because step 5 evicted them. New slots: $(49 - 16) + 4 = 37$, but only 1 is free.

- The request locks SYS and C1.1.
- Unlocked leaves and their last use: C2.2 (step 5), QA (step 6), QB and QC (step 7).
- Evict C2.2: $1 + 28 = 29$ free, still below 37.
- C2.1 is now a leaf, last used in step 5. Evict it: $29 + 8 = 37$ free. Eviction stops.
- The few-shot leaves survive, because steps 6 and 7 are more recent than step 5.
- The new leaf C1.2+3 takes all 37 slots: 80 cached, 0 free.

```text
root
├── SYS  8          hit
│   ├── C1.1  8     hit
│   │   └── C1.2+3  37   new (29 computed again + 8)
│   └── C2.1  8     evicted second
│       └── C2.2  28    evicted first
└── FS  12
    ├── QA  5
    ├── QB  5
    └── QC  5
```

**Step 9: self-consistency.** The program samples four answers to one question SCQ that follows the few-shot examples. It runs in two parts.

- **9a, the frontend hint.** The frontend first sends the shared prefix FS + SCQ alone: 15 tokens, no output (page 07). It matches 12 and needs 3 slots, with 0 free. The request locks FS. The unlocked leaves are C1.2+3 (step 8), QA (step 6), QB and QC (step 7). Evict QA: 5 free, enough. SCQ (3) is inserted below FS, and 2 slots stay free.
- **9b, the four samples.** Each prompt is FS + SCQ, and each matches all 15 tokens. Each generates 3 tokens, so the batch needs $4 \times 3 = 12$ slots, with 2 free. FS and SCQ are locked. Evict QB and QC: $2 + 5 + 5 = 12$ free. The leaves S1 to S4 are inserted below SCQ. FS survives because the hint and the samples lock it. The pool is full again: 80 cached, 0 free.

```text
root
├── SYS  8
│   └── C1.1  8
│       └── C1.2+3  37
└── FS  12          hit
    ├── QA  5       evicted in 9a
    ├── QB  5       evicted in 9b
    ├── QC  5       evicted in 9b
    └── SCQ  3      new in 9a, hit in 9b
        ├── S1  3   new
        ├── S2  3   new
        ├── S3  3   new
        └── S4  3   new
```

### 7.3 The trace in one table

| Step | Request(s) | Prompt | Matched | Output | Evicted (LRU) | Cached after |
|---|---|---|---|---|---|---|
| 1 | none | | | | | 0 |
| 2 | chat 1 turn 1 | 12 | 0 | 4 | none | 16 |
| 3 | chat 1 turn 2 | 20 | 16 | 25 | none | 45 |
| 4 | chat 2 turn 1 | 12 | 8 | 4 | none | 53 |
| 5 | chat 2 turn 2 | 20 | 16 | 24 | C1.2 (29) | 52 |
| 6 | few-shot QA | 16 | 0 | 1 | none | 69 |
| 7 | few-shot QB, QC | 16 each | 12 each | 1 each | none | 79 |
| 8 | chat 1 turn 3 | 49 | 16 | 4 | C2.2 (28), then C2.1 (8) | 80 |
| 9a | hint FS+SCQ | 15 | 12 | 0 | QA (5) | 78 |
| 9b | four samples | 15 each | 15 each | 3 each | QB (5), QC (5) | 80 |

> [!example] Worked example: the hit rate of the nine steps
> The paper defines the hit rate as "number of cached prompt tokens / number of prompt tokens".
>
> 1. Prompt tokens: $12 + 20 + 12 + 20 + 16 + 32 + 49 + 15 + 60 = 236$.
> 2. Matched tokens: $0 + 16 + 8 + 16 + 0 + 24 + 16 + 12 + 60 = 152$.
> 3. Hit rate: $152 / 236 \approx 0.644$, so about 64.4%.
>
> Without a cache, all 236 prompt tokens would run in prefill. With the tree, 84 run. The largest single loss is step 8: the 29 tokens of C1.2 are computed again, because step 5 evicted them. The simulator of these notes and exercise 1 of section 9 both give these numbers.

```video
{"src": "/notes/media/papers/2023-sglang-radixattention/manim/r02-nine-steps.mp4", "caption": "The nine steps of the running example: the radix tree grows, splits and loses its least recently used leaves, while a bar of 80 KV pool slots fills and empties."}
```

### 7.4 The paper's own narrative

The paper tells the same story in words, with letters for nodes. Without the letters, its nine time points are:

1. The tree is empty.
2. A "Hello" request arrives with a system prompt, and the model replies "Hi". The system prompt, the user message and the reply become one edge to a new node.
3. The next turn of the same chat reuses the first turn and adds one node.
4. A second chat session starts. A node splits, so that both sessions share the system prompt.
5. Memory reaches its limit. A node of the first chat is evicted, and the new turn of the second chat is appended.
6. A few-shot query arrives that shares no prefix with the tree. The paper describes this as a split of the root.
7. More few-shot queries share the examples, so that node splits.
8. The first chat sends a new message. The two nodes of the second chat are evicted as least recently used.
9. Self-consistency requests reuse the few-shot node, and three nodes are evicted.

The paper's Figure 3 uses its own colors: green for new nodes, blue for nodes accessed at that time, red for evicted nodes. These notes use the legend of this folder: gold for new, blue for a hit, green for cached but untouched, red for evicted.

> [!key] What the nine steps show
> The tree grows by new leaves and splits wherever two sequences differ. Under memory pressure, it loses its least recently used unlocked leaves. Shared nodes such as SYS and FS survive, because requests keep using them.

> [!trap] A fully cached prompt still runs one token in SGLang 0.5.22
> The trace counts all 15 prompt tokens of each sample in step 9b as matched. SGLang 0.5.22 caps every match at the prompt length minus 1 (section 6.7). Each sample would then match 14 tokens, split SCQ after 2 tokens, and compute $1 + 3 = 4$ tokens. The batch would need 16 slots, not 12. A simulator run of these notes with that cap evicts QB and QC, and then also C1.2+3 (37 tokens). So the rule about one token changes which long node survives.

## 8. The attention side: gathering scattered slots

### 8.1 The same idea as PagedAttention, with blocks of one token

A running request needs the K and V of all its tokens, in token order. Its row of the request-to-token table lists their slot numbers. First come the slots of the nodes on its matched path, root first. Then come its new slots. SGLang 0.5.22 reads the path part with `prefix_device_indices`, which calls `path_device_indices`. That function collects `node.value` from the node up to the root and reverses the list. Allocation then writes these slot numbers into the request's row.

Attention then reads the K and V rows at those slot numbers. This is PagedAttention with a block size of 1: the block table becomes a token table. The result is exact for the same reason as in [PagedAttention 04](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm), section 6.5. The slots only change where each key and value is read from, not the sum.

Each key already carries its position. In SGLang 0.5.22, the Llama model applies the rotary embedding before attention (`q, k = self.rotary_emb(positions, q, k)` comes before `self.attn(q, k, v, forward_batch)` in `models/llama.py`). So the stored key of a token is valid only at its own position. This is one more reason why a match must be a prefix.

### 8.2 Extend: prefill with a cached prefix

Normal prefill computes queries, keys and values for every prompt token. With a cached prefix, the model runs only on the new tokens. Their queries attend to the cached keys and values and to the new ones, with the causal mask. SGLang calls this mode "extend". The v1 paper of December 2023 introduced a new "extend" CUDA kernel for it. The v2 paper says that the implementation uses custom CUDA kernels from FlashInfer and Triton.

> [!example] Worked example: the extend of step 3
> The prompt has 20 tokens. Positions 0 to 15 are cached, and positions 16 to 19 are new.
>
> 1. The linear layers (Q, K and V projections, the MLP) run on 4 tokens instead of 20: 20% of the token work.
> 2. Attention scores, per head and layer: the new query at position $p$ attends to positions 0 to $p$. So $17 + 18 + 19 + 20 = 74$ scores.
> 3. A full causal prefill of 20 tokens needs $20 \times 21 / 2 = 210$ scores.
> 4. The 16 cached keys are read from the pool, not computed.
>
> The new tokens see exactly the keys and values that a full prefill would give them.

The simplest attention backend of SGLang 0.5.22 shows the gather in plain PyTorch. Excerpt from `sglang/srt/layers/attention/torch_native_backend.py`, `_run_sdpa_forward_extend`:

```python
per_req_query_redudant[:, prefill_seq_len_q:, :] = per_req_query

# get key and value from cache. per_req_tokens contains the kv cache
# index for each token in the sequence.
req_pool_idx = req_pool_indices[seq_idx]
per_req_tokens = req_to_token[req_pool_idx, start_kv:end_kv]
per_req_key = k_cache[per_req_tokens].movedim(0, query.dim() - 2)
per_req_value = v_cache[per_req_tokens].movedim(0, query.dim() - 2)
...
output[start_q:end_q, :, :] = per_req_out_redudant[prefill_seq_len_q:, :, :]
```

1. `per_req_query_redudant` has one row per position of the whole sequence. Only the rows from `prefill_seq_len_q` on receive the new queries. (The spelling "redudant" is the source's own.)
2. `req_to_token[req_pool_idx, start_kv:end_kv]` is the request's row: one slot number per token, cached and new.
3. `k_cache[per_req_tokens]` gathers the K rows at those slot numbers. The V rows come the same way.
4. The last line keeps only the outputs of the new positions.

This backend computes the full square of scores and then discards the rows of the cached positions. Its own comment calls its loop "inefficient". Interpretation of these notes: fast backends do the same gather inside one kernel and compute only the rows of the new queries.

> [!key] Attention does not change
> A request's KV is gathered by slot numbers, like PagedAttention with blocks of one token. Extend computes only the new tokens, and the result equals a full prefill.

## 9. A RadixCache in Python

### 9.1 The program

The next program models RadixAttention with slot numbers. It has a tiny `KVPool` with a free list, a `RadixCache` with `match_prefix`, `insert`, split and lock, and the six steps of section 6. It runs steps 1 to 5 of the example. It is a model of the mechanism, not SGLang's code. Its `evict` is the shortest correct version: page 05 builds the real one with a heap.

```python
class KVPool:                                    # slot s: K and V of one token, all layers
    def __init__(self, size):
        self.free = list(range(size))            # free slot numbers
    def alloc(self, n):
        assert n <= len(self.free), "pool full: evict first"
        out, self.free = self.free[:n], self.free[n:]
        return out
    def release(self, slots):
        self.free += slots

class Node:
    def __init__(self, key=(), value=(), parent=None):
        self.key = list(key)        # the edge: a run of token ids
        self.value = list(value)    # one pool slot per token of the edge
        self.children = {}          # first token of a child edge -> child
        self.parent = parent
        self.ref = 0                # reference count (lock_ref in SGLang)
        self.last = 0               # time of the last access

class RadixCache:
    def __init__(self, pool):
        self.root, self.pool, self.now = Node(), pool, 0

    def match_prefix(self, tokens):
        node, i, slots = self.root, 0, []
        while i < len(tokens) and tokens[i] in node.children:
            child = node.children[tokens[i]]
            n = 0
            while n < len(child.key) and i + n < len(tokens) and child.key[n] == tokens[i + n]:
                n += 1
            if n < len(child.key):               # the match ends inside this edge
                child = self._split(child, n)
            child.last = self.now
            slots += child.value
            node, i = child, i + n
        return slots, node                       # matched slots, last matched node

    def _split(self, child, n):
        mid = Node(child.key[:n], child.value[:n], child.parent)
        mid.ref, mid.last = child.ref, child.last
        mid.children[child.key[n]] = child
        child.parent.children[child.key[0]] = mid
        child.key, child.value, child.parent = child.key[n:], child.value[n:], mid
        return mid

    def insert(self, tokens, slots):
        matched, node = self.match_prefix(tokens)
        k = len(matched)
        if k < len(tokens):                      # one new leaf for the unmatched tail
            leaf = Node(tokens[k:], slots[k:], node)
            leaf.last = self.now
            node.children[tokens[k]] = leaf

    def lock(self, node, delta):                 # +1 or -1 on the whole path
        while node is not self.root:
            node.ref += delta
            node = node.parent

    def evict(self, n):                          # minimal LRU leaf eviction (page 05)
        gone = []
        while n > 0:
            leaves = [x for x in self.nodes() if not x.children and x.ref == 0]
            x = min(leaves, key=lambda x: x.last)
            self.pool.release(x.value)
            del x.parent.children[x.key[0]]
            n -= len(x.value)
            gone.append(x)
        return gone

    def nodes(self, node=None):
        for c in (node or self.root).children.values():
            yield c
            yield from self.nodes(c)

def run_step(cache, t, requests):
    """All requests of one step run in one batch. A request is (prompt, output)."""
    cache.now = t
    jobs, stats = [], []
    for prompt, output in requests:
        slots, node = cache.match_prefix(prompt)            # 1. match
        cache.lock(node, +1)                                # 2. lock the path
        jobs.append((prompt, output, slots, node))
    need = sum(len(p) - len(s) + len(o) for p, o, s, _ in jobs)
    if need > len(cache.pool.free):                         # 3. evict if needed
        for x in cache.evict(need - len(cache.pool.free)):
            print(f"   evicted {label(x)} ({len(x.value)} slots)")
    for prompt, output, slots, node in jobs:
        new = cache.pool.alloc(len(prompt) - len(slots) + len(output))
        # 4. the model would prefill the suffix and decode the output here,
        #    writing the K and V of every new token into the slots in `new`
        cache.insert(prompt + output, slots + new)          # 5. insert
        cache.lock(node, -1)                                # 6. unlock
        print(f"   prompt {len(prompt)}, matched {len(slots)}, new slots {len(new)}")
        stats.append((len(prompt), len(slots)))
    return stats

# ---- helpers to name tokens and print the tree ----
def toks(group, n, start=0):      # n distinct token ids, for example "SYS:0"
    return [f"{group}:{i}" for i in range(start, start + n)]

def label(node):                  # name a node by the token groups on its edge
    return "+".join(dict.fromkeys(tok.split(":")[0] for tok in node.key))

def ranges(s):                    # [0, 1, 2, 7] -> "0-2,7"
    runs = []
    for x in s:
        if runs and x == runs[-1][1] + 1:
            runs[-1][1] = x
        else:
            runs.append([x, x])
    return ",".join(f"{a}-{b}" if b > a else f"{a}" for a, b in runs)

def show(cache, node=None, depth=1):
    for c in (node or cache.root).children.values():
        print("   " + "  " * depth + f"{label(c)}: {len(c.key)} tokens, slots {ranges(c.value)}")
        show(cache, c, depth + 1)

# ---- steps 1 to 5 of the running example ----
SYS = toks("SYS", 8)                                  # system prompt
U1, A1 = toks("C1.1", 4), toks("C1.1", 4, 4)          # chat 1, turn 1
U2, A2 = toks("C1.2", 4), toks("C1.2", 25, 4)         # chat 1, turn 2
V1, B1 = toks("C2.1", 4), toks("C2.1", 4, 4)          # chat 2, turn 1
V2, B2 = toks("C2.2", 4), toks("C2.2", 24, 4)         # chat 2, turn 2

cache = RadixCache(KVPool(80))
print("step 1: empty tree, free slots 80")
for t, prompt, output in [(2, SYS + U1, A1), (3, SYS + U1 + A1 + U2, A2),
                          (4, SYS + V1, B1), (5, SYS + V1 + B1 + V2, B2)]:
    print(f"step {t}:")
    run_step(cache, t, [(prompt, output)])
    show(cache)
    print(f"   free slots {len(cache.pool.free)}")
```

### 9.2 The output

```text
step 1: empty tree, free slots 80
step 2:
   prompt 12, matched 0, new slots 16
     SYS+C1.1: 16 tokens, slots 0-15
   free slots 64
step 3:
   prompt 20, matched 16, new slots 29
     SYS+C1.1: 16 tokens, slots 0-15
       C1.2: 29 tokens, slots 16-44
   free slots 35
step 4:
   prompt 12, matched 8, new slots 8
     SYS: 8 tokens, slots 0-7
       C1.1: 8 tokens, slots 8-15
         C1.2: 29 tokens, slots 16-44
       C2.1: 8 tokens, slots 45-52
   free slots 27
step 5:
   evicted C1.2 (29 slots)
   prompt 20, matched 16, new slots 28
     SYS: 8 tokens, slots 0-7
       C1.1: 8 tokens, slots 8-15
       C2.1: 8 tokens, slots 45-52
         C2.2: 28 tokens, slots 53-79,16
   free slots 28
```

Compare with section 7.2: the matched lengths, the new slots, the eviction of C1.2 in step 5 and the free counts are the same. The program adds the slot numbers. In step 5, C2.2 receives slots 53 to 79 and slot 16. Slot 16 is the first slot that C1.2 returned. So one node can hold slots from anywhere in the pool, and attention does not care.

### 9.3 The important lines

1. `KVPool.alloc` takes slots from the front of the free list, and `release` appends freed slots at the end. The order of the free list does not matter for correctness.
2. `child = node.children[tokens[i]]` is the dictionary access by the first token of the next part.
3. The inner `while` counts the agreeing tokens $n$ on one edge.
4. `if n < len(child.key): child = self._split(child, n)` splits when the match ends inside the edge. After the split, the loop finds no child for the next token and stops.
5. `_split` creates `mid` with the first $n$ tokens and slots. `mid.ref = child.ref` copies the reference count, because every request that locked the old node also uses its first part.
6. `insert` reuses `match_prefix`, so it splits in the same way. Then it appends one leaf with `slots[k:]`, the request's own slots for the new tokens.
7. `lock` walks the parent links to the root. The same walk with $-1$ unlocks.
8. `run_step` locks all requests of the batch before it evicts. So a request of the same batch never loses its own prefix.
9. `need` is the prompt suffix plus the output, as in section 6.4.

### Exercises

1. **Run all nine steps.** Extend the program to steps 6 to 9, with 9a and 9b as two batches. Print for every step the matched tokens, the evicted nodes and the cached tokens, and compute the total hit rate. Acceptance test: the numbers equal the table of section 7.3, and the hit rate is $152/236 \approx 0.644$.
   - Hint 1: Name the new token groups FS, QA, QB, QC, C1.3, SCQ and S1 to S4. Each answer token of a question belongs to the group of its question.
   - Hint 2: Return `(prompt length, matched length)` pairs from `run_step` and add them up.
2. **Free duplicate slots on insert.** Two requests run in one batch on an empty pool of 40 slots. They have the same 10-token prompt and different 2-token outputs. Both compute the prompt. Change the insert so that it releases the slots of tokens that the tree already holds, as `_insert_cache` does in SGLang 0.5.22. Acceptance test: without the change, the tree holds 14 tokens, 16 slots are free and 10 slots are lost. With the change, 26 slots are free and none are lost.
   - Hint 1: Insert must know how many tokens the tree held before this request inserted, and how many the request matched at its start.
   - Hint 2: The duplicates are the request's slots between those two lengths.
3. **Gather and attend.** After step 5, chat 2 has 44 tokens in the tree. Write random K and V rows for them into a NumPy pool, at the slot numbers of their path. Implement `path_slots(node)`. Gather the rows and compute attention for one new query. Acceptance test: the result equals attention over the rows in token order (`np.allclose`). A row with the slots of C1.1 instead of C2.1 gives a different result.
   - Hint 1: `match_prefix(sequence)` returns the last node of the path.
   - Hint 2: Collect `node.value` from the node up to the root, then reverse the order of the lists.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/04-radixattention-the-tree-of-kv-caches)

## 10. Common mistakes

1. **"The radix tree stores the KV tensors."** It stores token ids and slot numbers. The K and V numbers live in the GPU pool. In the worked example of section 5.3, the KV bytes of one node are 8,192 times larger than its index numbers.
2. **"A match must end at a node boundary."** It can end anywhere inside an edge. The node is then split, and the split copies no KV.
3. **"Only prompts are cached."** The output is inserted too. Its KV is as exact as the KV of the prompt, so the next chat turn matches it.
4. **"The cache has its own reserved memory."** Cached tokens and running requests share one pool. In step 8, the cache gives 36 slots to one request.
5. **"Any cached node can be evicted."** Only leaves with reference count 0 can be evicted. In step 5, C2.1 is a leaf candidate in shape, but the running request locks it.
6. **"A fully cached prompt runs no prefill at all."** In SGLang 0.5.22, the last prompt token always runs, because the first output token needs its logits. Decode work never changes.
7. **"RadixAttention changes the attention math."** Attention reads the same keys and values from scattered slots. The result is the result of normal attention.

## 11. One-minute explanation

RadixAttention keeps the KV cache of every finished request instead of discarding it, and reuses it for any later request with the same first tokens. It indexes the cached sequences in a radix tree on the CPU, whose edges hold runs of tokens of any length. A node does not hold tensors: it holds the slot numbers of its tokens in a GPU KV pool with pages of one token. A new request walks the tree to find its longest cached prefix, and splits a node if the match ends inside an edge. It locks that path with reference counts, computes only the unmatched suffix, and decodes. At the end, it inserts its prompt and its output as a new leaf, and unlocks. Cached tokens and running requests share one pool, so when memory is short, the least recently used unlocked leaves are evicted. In the nine-step example with 80 slots, the tree matches 152 of 236 prompt tokens, about 64%. Attention gathers the K and V rows by slot number, which is PagedAttention with a block size of one token, and the result is exact. SGLang 0.5.22 adds details: prompts enter the tree after prefill, a match stops before the last token, and insert frees duplicate slots.

## 12. Check questions

```check
{
  "question": "Name the three structures that RadixAttention uses, where each one lives, and what one node of the tree stores.",
  "hint": "One on the CPU, two on the GPU.",
  "answer": "1. The radix tree, on the CPU. Each node stores its edge (token ids) and its value (one KV pool slot number per token). It also stores its children in a dictionary keyed by the first token of each child edge. Then a parent link, a reference count (`lock_ref` in SGLang 0.5.22) and a last access time. It stores no K or V numbers.\n2. The KV pool, on the GPU: for each layer, a K array and a V array with one row per slot. The page size is one token, so one slot holds one token.\n3. The request-to-token table, on the GPU: one row per running request with the slot number of each of its tokens (`req_to_token_pool` in SGLang 0.5.22). It plays the role of PagedAttention's block table with a block size of 1.\n\nThe paper: \"The tree structure is stored on the CPU with negligible maintenance overhead.\""
}
```

```check
{
  "question": "Trace the match of step 4 of the running example. Which node splits, where, and what does the tree look like afterwards?",
  "hint": "The tree holds one 16-token edge SYS+C1.1. The request is SYS plus a new 4-token message.",
  "answer": "The request (12 tokens) selects the edge SYS+C1.1 by its first token. Tokens 0 to 7 agree, token 8 differs. The match ends inside the edge, so the node splits at 8. A new node SYS (8 tokens, slots 0 to 7) takes its place. The rest, C1.1 (8 tokens, slots 8 to 15), becomes its child, with C1.2 still below C1.1. The match returns length 8, last node SYS and slots 0 to 7. The request then computes $4 + 4 = 8$ new tokens and inserts C2.1 as a second child of SYS. The split copies no KV. It only cuts one list of slot numbers into two."
}
```

```check
{
  "question": "In step 5, the request needs 28 slots and 27 are free. Why is C1.2 evicted, and not C2.1 or C1.1? Why does eviction stop after one node?",
  "answer": "Only unlocked leaves can be evicted. The request matched SYS and C2.1, so it locked both: reference count 1. C1.1 is not a leaf, because C1.2 is its child. So the only candidate is C1.2 (last used in step 3). Evicting it frees 29 slots: $27 + 29 = 56 \\ge 28$, so eviction stops. C1.1 became an unlocked leaf at that moment, but it is not needed. Chat 1 pays the price in step 8: it must compute its 29 turn-2 tokens again."
}
```

```check
{
  "question": "Interview follow-up: Why does RadixAttention use a page size of one token? What does that cost, and what do engines do today?",
  "answer": "Benefits (interpretation of these notes): a match can end at any token, a node can split at any token, and no partial page exists. A 12-token prompt that shares 8 tokens reuses 8. With 16-token blocks it would reuse 0.\n\nCosts: one index per token. For Llama-3.1-8B, one layer reads $4{,}096$ bytes of K and V per token and one 4-byte index. That is about 0.098% extra, 16 times the 0.0061% of 16-token blocks. The larger cost is kernel and transfer design. One slot row of K is only $8 \\times 128 \\times 2 = 2{,}048$ contiguous bytes, while fast kernels and tier transfers prefer long pages. The HiCache docs: larger pages reduce metadata but can lower hit rates on partial matches.\n\nToday: in SGLang 0.5.22, `--page-size` resolves to 1 on NVIDIA GPUs by default, and some backends force 64 or 128 (checked on 2026-10-19). With pages above 1, the match is rounded down to whole pages (`page_aligned`, page 10). vLLM hashes full 16-token blocks."
}
```

```check
{
  "question": "Interview follow-up: Why does the tree store the generated output of a request, and not only its prompt? Is reusing the KV of sampled tokens exact?",
  "answer": "The next call of an LM program often starts with the previous output. Examples: the next chat turn, the next step of an agent, a child in tree-of-thought search. If the tree stored only prompts, the next turn would match only the old prompt and recompute the reply. In step 3, the tree holds the reply \"Hi!\", so turn 2 matches all 16 tokens of turn 1.\n\nIt is exact. The KV of a token depends only on the token ids before it and at its position (\"the computation of the KV cache only depends on all previous tokens\", Appendix A.1). How the sampler chose the token does not matter. One detail: the last sampled token was never an input of the model, so it has no KV yet. SGLang 0.5.22 inserts only tokens with committed KV (`kv_committed_len`)."
}
```

```check
{
  "question": "Interview follow-up: A prompt is fully cached. Does the request skip prefill? Give the SGLang 0.5.22 rule and its effect on step 9b.",
  "hint": "The first output token needs logits. What does the tree store?",
  "answer": "No. The first output token needs the logits of the last prompt token, and the tree stores KV, not logits. SGLang 0.5.22 caps every match at the prompt length minus 1: `Req._compute_max_prefix_len` says \"the matched length is at most 1 less than the input length to enable logprob computation\". vLLM always computes the last token again too.\n\nIn step 9b, each sample would match 14 of 15 tokens. The match would split SCQ after 2 tokens, and each sample would compute $1 + 3 = 4$ tokens. The batch would need 16 slots instead of 12. A simulator run of these notes with that cap evicts QB and QC, and then also C1.2+3 (37 tokens). The trace of section 7 counts a full match of 15 to stay close to the paper's figure."
}
```

```check
{
  "question": "Interview follow-up: Two requests in the same batch share a new 500-token prefix that is not in the tree. What happens to compute and memory, and what do SGLang and its frontend do about it?",
  "answer": "Both requests match nothing, so both compute the 500 tokens and write them into their own slots. That is 500 tokens of duplicate compute and 500 duplicate slots during the run. When they finish, the first insert adds the prefix to the tree. The second insert finds it already there. SGLang 0.5.22 then frees the second copy in `_insert_cache` (\"free the duplicates it exposed\"), so no slots leak (exercise 2).\n\nTwo mechanisms avoid the duplicate compute itself. The frontend hint: during `fork`, \"the frontend sends the prefix first as a hint, ensuring the prefix is correctly inserted into the tree. It then sends the remaining prompts.\" (page 07, step 9a of the example). And the in-batch prefix caching of the SGLang 0.5.22 scheduler, with a cache-aware policy such as `lpm`. It deprioritizes a waiting request that shares 32 tokens or more with another waiting request. So only one of them computes the shared prefix first (page 06)."
}
```

```check
{
  "question": "Interview follow-up: The slots of one request are scattered across the pool. How does attention read them, is the result exact, and what does it cost?",
  "answer": "The request's row in the request-to-token table lists one slot number per token. First come the slots of the matched path (root first, from `path_device_indices`), then its new slots. Attention gathers the K and V rows at those slot numbers, as the native backend does with `k_cache[per_req_tokens]`. This is PagedAttention with a block size of 1, so the result is exact: the slots change where each key is read, not the sum.\n\nCost: one 4-byte index per token per layer, about 0.1% of the $4{,}096$ bytes of K and V for Llama-3.1-8B. Each slot row is still contiguous inside ($2{,}048$ bytes of K for 8 heads). With a cached prefix, prefill runs in extend mode. In step 3, the linear layers run on 4 tokens instead of 20. Attention needs $17 + 18 + 19 + 20 = 74$ scores instead of 210."
}
```

```check
{
  "question": "Exercise 1: show a reference solution",
  "answer": "Append this code to the program of section 9.1 and run it.\n\n```python\n# Exercise 1: append to the program of section 9.1. A new cache runs all nine steps.\nFS = toks(\"FS\", 12)                                                    # few-shot examples\nQ = {k: (toks(\"Q\" + k, 4), toks(\"Q\" + k, 1, 4)) for k in \"ABC\"}        # question, answer\nU3, A3 = toks(\"C1.3\", 4), toks(\"C1.3\", 4, 4)                           # chat 1, turn 3\nSCQ = toks(\"SCQ\", 3)                                                   # self-consistency question\nS = [toks(f\"S{k}\", 3) for k in range(1, 5)]                            # four samples\n\nsteps = [(2, [(SYS + U1, A1)]), (3, [(SYS + U1 + A1 + U2, A2)]),\n         (4, [(SYS + V1, B1)]), (5, [(SYS + V1 + B1 + V2, B2)]),\n         (6, [(FS + Q[\"A\"][0], Q[\"A\"][1])]),\n         (7, [(FS + Q[\"B\"][0], Q[\"B\"][1]), (FS + Q[\"C\"][0], Q[\"C\"][1])]),\n         (8, [(SYS + U1 + A1 + U2 + A2 + U3, A3)]),\n         (9.0, [(FS + SCQ, [])]),                                      # frontend hint\n         (9.5, [(FS + SCQ, s) for s in S])]                           # four samples\ncache = RadixCache(KVPool(80))\ntotal_prompt = total_matched = 0\nfor t, reqs in steps:\n    print(f\"step {t}:\")\n    for p, m in run_step(cache, t, reqs):\n        total_prompt, total_matched = total_prompt + p, total_matched + m\n    print(f\"   cached {sum(len(x.key) for x in cache.nodes())}, free {len(cache.pool.free)}\")\nprint(f\"hit rate {total_matched}/{total_prompt} = {total_matched / total_prompt:.3f}\")\nshow(cache)\n```\n\nOutput (after the output of section 9.2):\n\n```text\nstep 2:\n   prompt 12, matched 0, new slots 16\n   cached 16, free 64\nstep 3:\n   prompt 20, matched 16, new slots 29\n   cached 45, free 35\nstep 4:\n   prompt 12, matched 8, new slots 8\n   cached 53, free 27\nstep 5:\n   evicted C1.2 (29 slots)\n   prompt 20, matched 16, new slots 28\n   cached 52, free 28\nstep 6:\n   prompt 16, matched 0, new slots 17\n   cached 69, free 11\nstep 7:\n   prompt 16, matched 12, new slots 5\n   prompt 16, matched 12, new slots 5\n   cached 79, free 1\nstep 8:\n   evicted C2.2 (28 slots)\n   evicted C2.1 (8 slots)\n   prompt 49, matched 16, new slots 37\n   cached 80, free 0\nstep 9.0:\n   evicted QA (5 slots)\n   prompt 15, matched 12, new slots 3\n   cached 78, free 2\nstep 9.5:\n   evicted QB (5 slots)\n   evicted QC (5 slots)\n   prompt 15, matched 15, new slots 3\n   prompt 15, matched 15, new slots 3\n   prompt 15, matched 15, new slots 3\n   prompt 15, matched 15, new slots 3\n   cached 80, free 0\nhit rate 152/236 = 0.644\n     SYS: 8 tokens, slots 0-7\n       C1.1: 8 tokens, slots 8-15\n         C1.2+C1.3: 37 tokens, slots 44,53-79,16,45-52\n     FS: 12 tokens, slots 17-28\n       SCQ: 3 tokens, slots 29-31\n         S1: 3 tokens, slots 32-34\n         S2: 3 tokens, slots 35-37\n         S3: 3 tokens, slots 38-40\n         S4: 3 tokens, slots 41-43\n```\n\nEvery number equals the trace table of section 7.3. The final tree shows the scattered slots of C1.2+3: 44, 53 to 79, 16 and 45 to 52. These are slots that steps 5 and 8 released and reused. Steps 9.0 and 9.5 are 9a and 9b."
}
```

```check
{
  "question": "Exercise 2: show a reference solution",
  "answer": "Append this code to the program of section 9.1 and run it.\n\n```python\n# Exercise 2: append to the program of section 9.1.\ndef insert_dedup(cache, tokens, slots, matched_before):\n    \"\"\"Insert, then release the request's own slots for tokens that another\n    request inserted first (like _insert_cache in SGLang 0.5.22).\"\"\"\n    in_tree, node = cache.match_prefix(tokens)\n    k = len(in_tree)                                  # tokens the tree already holds\n    if k < len(tokens):\n        leaf = Node(tokens[k:], slots[k:], node)\n        leaf.last = cache.now\n        node.children[tokens[k]] = leaf\n    cache.pool.release(slots[matched_before:k])      # duplicates computed by this request\n\ndef run_step_dedup(cache, t, requests):\n    cache.now = t\n    jobs = []\n    for prompt, output in requests:\n        slots, node = cache.match_prefix(prompt)\n        cache.lock(node, +1)\n        jobs.append((prompt, output, slots, node))\n    for prompt, output, slots, node in jobs:\n        new = cache.pool.alloc(len(prompt) - len(slots) + len(output))\n        insert_dedup(cache, prompt + output, slots + new, len(slots))\n        cache.lock(node, -1)\n\nP = toks(\"P\", 10)\nfor name, step in ((\"without dedup\", run_step), (\"with dedup\", run_step_dedup)):\n    c = RadixCache(KVPool(40))\n    step(c, 1, [(P, toks(\"X\", 2)), (P, toks(\"Y\", 2))])     # same prompt, two outputs\n    cached = sum(len(x.key) for x in c.nodes())\n    print(f\"{name:14s} cached {cached}, free {len(c.pool.free)}, lost {40 - cached - len(c.pool.free)}\")\n```\n\nOutput (after the output of section 9.2):\n\n```text\n   prompt 10, matched 0, new slots 12\n   prompt 10, matched 0, new slots 12\nwithout dedup  cached 14, free 16, lost 10\nwith dedup     cached 14, free 26, lost 0\n```\n\nBoth requests miss and allocate $10 + 2 = 12$ slots each. The first insert adds 12 tokens. The second insert matches the 10 prompt tokens, splits the leaf and adds its 2 output tokens: the tree holds 14 tokens. Without the change, the second request's 10 prompt slots are in no node and on no free list: this model loses them for good. `insert_dedup` releases `slots[matched_before:k]`: here `slots[0:10]`. SGLang 0.5.22 does the same with `free_segment(kv_indices[req.kv.cache_protected_len : result.prefix_len], ...)` in `_insert_cache`."
}
```

```check
{
  "question": "Exercise 3: show a reference solution",
  "answer": "Append this code to the program of section 9.1 and run it.\n\n```python\n# Exercise 3: append to the program of section 9.1 (the cache holds the step-5 tree).\nimport numpy as np\n\ndef path_slots(cache, node):                   # like path_device_indices in SGLang\n    out = []\n    while node is not cache.root:\n        out = node.value + out\n        node = node.parent\n    return out\n\nrng = np.random.default_rng(0)\nd = 8\nseq = SYS + V1 + B1 + V2 + B2                  # chat 2: both turns, 44 tokens\nK_true = rng.normal(size=(len(seq), d))        # stand-ins for the real K and V rows\nV_true = rng.normal(size=(len(seq), d))\n\n_, leaf = cache.match_prefix(seq)\nrow = path_slots(cache, leaf)                  # the request's row of slot numbers\nk_pool, v_pool = np.zeros((80, d)), np.zeros((80, d))\nk_pool[row], v_pool[row] = K_true, V_true      # what prefill and decode wrote\n\ndef attend(q, K, V):\n    s = K @ q / np.sqrt(len(q))\n    w = np.exp(s - s.max())\n    return (w / w.sum()) @ V\n\nq = rng.normal(size=d)                          # query of the next token\ngathered = attend(q, k_pool[row], v_pool[row])  # read 44 scattered slots\nprint(\"row length\", len(row), \"slots\", ranges(row))\nprint(\"equal to contiguous:\", np.allclose(gathered, attend(q, K_true, V_true)))\nmoved = row[:8] + row[16:] + row[8:16]         # same slots, another order\nprint(\"same slots, other order:\", np.allclose(attend(q, k_pool[moved], v_pool[moved]), gathered))\nwrong = row[:8] + list(range(8, 16)) + row[16:] # C1.1's slots instead of C2.1's\nprint(\"wrong slots:\", np.allclose(attend(q, k_pool[wrong], v_pool[wrong]), gathered))\n```\n\nOutput (after the output of section 9.2):\n\n```text\nrow length 44 slots 0-7,45-79,16\nequal to contiguous: True\nsame slots, other order: True\nwrong slots: False\n```\n\nThe row of chat 2 has 44 slots: SYS (0 to 7), C2.1 (45 to 52) and C2.2 (53 to 79 and 16). Gathered attention equals attention over the rows in token order. Reordering the same slots together with their values gives the same output for a query that reads all of them. The softmax sum does not depend on order, and each stored key already carries its position. Wrong slots give a wrong result. So a correct row is about the right slot for each token."
}
```

## 13. Links

- Previous: [03 The question](/notes/papers/llm-serving/2023-sglang-radixattention/03-the-question)
- Next: [05 Eviction and reference counts](/notes/papers/llm-serving/2023-sglang-radixattention/05-eviction-and-reference-counts)
- The data structure from zero: [01 Background: tries and radix trees](/notes/papers/llm-serving/2023-sglang-radixattention/01-background-tries-and-radix-trees)
- Why reuse is exact: [02 Background: prefix sharing in LM programs](/notes/papers/llm-serving/2023-sglang-radixattention/02-background-prefix-sharing-in-lm-programs)
- The order of requests: [06 Cache-aware scheduling and the DFS theorem](/notes/papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling)
- The frontend hint of step 9: [07 Frontend hints and multi-GPU RadixAttention](/notes/papers/llm-serving/2023-sglang-radixattention/07-frontend-hints-and-multi-gpu)
- The real code and larger pages: [10 RadixAttention in SGLang today](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today)
- Rebuild it: [12 Reproduce it](/notes/papers/llm-serving/2023-sglang-radixattention/12-reproduce-it)
- PagedAttention: [04 PagedAttention: the algorithm](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm), [05 The KV cache manager](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager), [10 Limits and later work](/notes/papers/llm-serving/2023-pagedattention/10-limits-and-later-work)
- The KV cache: [L2: Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode), [L3: The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula), [L4: Implementing a KV cache](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache)
- The vLLM side: [L9: Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)
- The paper folder: [SGLang and RadixAttention (2023)](/notes/papers/llm-serving/2023-sglang-radixattention), [Glossary](/notes/papers/glossary)

### Sources

- Zheng et al., "SGLang: Efficient Execution of Structured Language Model Programs", NeurIPS 2024, arXiv 2312.07104 v2 (§3, Figure 3, Algorithm 1, Appendix A.1 and A.2): https://arxiv.org/abs/2312.07104 (checked on 2026-10-19)
- First version, arXiv 2312.07104 v1, 2023-12-12 (the "extend" kernel): https://arxiv.org/abs/2312.07104v1 (checked on 2026-10-19)
- SGLang 0.5.22 on PyPI (released 2026-10-16), source files `srt/mem_cache/radix_cache.py`, `srt/mem_cache/memory_pool.py`, `srt/mem_cache/common.py`, `srt/managers/schedule_batch.py`, `srt/managers/schedule_policy.py`, `srt/layers/attention/torch_native_backend.py` and `srt/models/llama.py`: https://pypi.org/project/sglang/0.5.22/ (checked on 2026-10-19)
- SGLang repository: https://github.com/sgl-project/sglang (checked on 2026-10-19)
- SGLang HiCache design docs (page size and partial matches): https://docs.sglang.io (checked on 2026-10-19)
