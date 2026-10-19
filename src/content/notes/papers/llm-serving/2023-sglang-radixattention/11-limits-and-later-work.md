---
title: "11 Limits and later work"
order: 11
summary: "What RadixAttention leaves open and what came after it, with verified dates. The paper's own limits, six limits found later, a timeline from cascade inference to T-LRU, and the exact log-sum-exp merge of shared-prefix attention in NumPy."
status: not-started
tags: [radixattention, sglang, later-work, critique, hydragen, prefix-caching, security, interview]
---

## 1. The question this page answers

An interviewer who hears "RadixAttention" soon asks two questions. What does it not solve? What came after it? This page answers both, with a date and a source for every later work.

It also prepares the next level of questions. Why does a limit exist? What does it cost in numbers? What does the real code do about it today?

> [!key] The short answer
> RadixAttention reuses the KV cache of an **exact token prefix**, in the **GPU memory** of **one server**, to save **prefill**. Each part of that sentence is a limit, and later work attacked each one:
>
> 1. **Exact token prefix.** A moved document is a miss. CacheBlend reuses chunks at other positions with partial recomputation. Hybrid models make even exact reuse harder, and Marconi addresses them.
> 2. **GPU memory.** An evicted prefix is lost. HiCache, Mooncake and LMCache keep KV caches in CPU memory and storage.
> 3. **One server.** Each replica has its own radix tree. Preble and the SGLang router send a request to the replica that holds its prefix.
> 4. **Prefill only.** In decode, every sequence still reads the shared prefix on its own. Cascade inference and Hydragen read it once for the whole batch.
>
> Two more limits sit beside these. The greedy scheduler can starve requests, and a shared cache leaks timing information.

## 2. Mental model

> [!analogy] A bakery that keeps half-made dough
> A bakery follows recipes step by step. Many orders start with the same steps, so the bakery keeps the half-made dough of earlier orders on a shelf. A new order takes the dough that matches its first steps and continues from there. That is RadixAttention.
>
> Now the limits. The dough fits only if the steps match exactly and in the same order. The shelf is small, so old dough goes in the bin. Each branch of the chain has its own shelf, so an order at the wrong branch starts from flour. Some recipes stir everything into one pot, and you cannot take out the dough of step 3 after step 7. A curious customer who times the orders can guess what other customers ordered.
>
> Later work added a cold store, a dispatcher between branches, pots that keep samples at fixed steps, and private shelves.
>
> **Where it stops working:** dough is a physical thing. A KV cache is data. It can move to a slower tier without loss, and the engine can rebuild it exactly from the tokens at any time. So every miss costs compute, never correctness.

## 3. Terms

| Term | Plain meaning |
|---|---|
| exact-prefix match | A cache hit needs the same tokens, in the same order, from position 0 on. |
| fuzzy semantic matching | Reuse for text that means the same thing but has other tokens. The paper names it as future work. |
| starvation | A waiting request that the scheduler never chooses, because other requests always look better. |
| memory hierarchy | GPU memory, CPU memory, local disk and remote storage. Each level is larger and slower. |
| fleet | Many replicas of one model server behind a router or load balancer. |
| cache-aware routing | Sending a request to the replica that most likely holds its prefix in its radix tree. |
| page size | The number of tokens in one page of the KV pool. It is 1 in the paper. |
| hybrid model | A model that mixes attention layers with other layer types, such as state space model (SSM) layers or sliding-window layers. |
| SSM state | A fixed-size summary of all earlier tokens. An SSM layer updates it in place, token by token. |
| sliding-window attention | Attention that sees only the last $W$ tokens. |
| timing side channel | A leak of secret data through the time that an operation takes. |
| cache salt | A secret string in a request that puts its cache entries in a separate namespace. |
| shared-prefix attention | Attention of many sequences over one common prefix, for example the samples of one prompt. |
| log-sum-exp (LSE) | $\log \sum_j e^{s_j}$ over a set of attention scores: the log of a softmax denominator. |
| attention state | The pair of a partial attention output and its LSE. Two states merge into the state of the union of their keys. |
| inter-sequence batching | Putting the queries of all sequences into one matrix, so that the shared prefix is read once. |
| cascade inference | FlashInfer's name for computing a shared prefix and the unique suffixes apart, then merging them by LSE. |
| tail latency | A high percentile of a latency, for example the 90th percentile (P90) of time to first token. |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. Limits that the paper states

### 4.1 Starvation, fairness and the online case

The scheduler of [page 06](/notes/papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling) prefers the waiting request with the longest matched prefix length. The paper says plainly: "While greedy cache-aware scheduling can achieve high throughput, it can lead to starvation." It leaves the integration with fair scheduling to future work. For latency-sensitive settings, it adds: "we may still be able to tolerate limited batch re-ordering to improve cache reuse."

Three more limits sit in the proof and the measurements:

1. **The optimality needs a large enough cache.** Theorem 3.1 holds "with a cache size ≥ the maximum request length". [Lab 4 of page 12](/notes/papers/llm-serving/2023-sglang-radixattention/12-reproduce-it) shows a batch where a smaller cache breaks the DFS order.
2. **The optimality is offline.** New requests disrupt the DFS order, and the online schedule only approximates it (Appendix A.3). The measured hit rate reaches about 96% of the optimal hit rate on average (Figure 13).
3. **Output lengths are unknown.** Footnote 2 says, in paraphrase, that the real computation differs from the proof. An unpredictable number of output tokens can force recomputation of the KV cache.

> [!note] SGLang 0.5.22 today
> The default `--schedule-policy` is `fcfs`, not the paper's longest-prefix-match order. With `lpm`, the scheduler uses FCFS for a round when the waiting queue holds more than 128 requests (`schedule_policy.py`, checked on 2026-10-19). Interpretation of these notes: a production default must bound both starvation and the CPU cost of sorting.

### 4.2 The future directions of Section 8

The paper's Section 8 names six directions. In paraphrase:

| Direction (paraphrase of Section 8) | About the KV cache? | What later work did |
|---|---|---|
| Support more output modalities | No | Outside the scope of this page |
| Run RadixAttention across several levels of the memory hierarchy | Yes | HiCache in SGLang, CachedAttention, Mooncake, LMCache |
| Fuzzy semantic matching inside RadixAttention | Yes | Still open for exact KV reuse. CacheBlend reuses non-prefix chunks with partial recomputation. |
| Higher-level primitives on top of SGLang | No | Outside the scope of this page |
| Fix starvation in cache-aware scheduling | Yes | SGLang defaults to `fcfs`, `lpm` is an option |
| Advanced static optimizations in the compiler | No | Outside the scope of this page |

Appendix A.4 adds one more open problem: the trade-off between data locality and parallel efficiency when several workers serve one model ([page 07](/notes/papers/llm-serving/2023-sglang-radixattention/07-frontend-hints-and-multi-gpu)).

### 4.3 Limits of the evaluation

[Page 09](/notes/papers/llm-serving/2023-sglang-radixattention/09-results) treats them in depth. In short:

1. **The vLLM baseline is v0.2.5.** That version has no automatic prefix caching. vLLM added it in 0.4.0 on 2024-03-31. The paper explains its choice: RadixAttention "has been partially integrated as an optional experimental feature" into later vLLM.
2. **Older hardware.** Most runs use NVIDIA A10G GPUs with 24 GB.
3. **No printed bar values.** The throughput figures print no number per bar, so these notes do not guess them.
4. **No fairness or tail-latency study.** Interpretation of these notes: the starvation risk of section 4.1 is stated but not measured.

## 5. Limits found later or reasoned by these notes

Each subsection states the limit, shows it with numbers, and names the later work. A statement without a named source is an interpretation of these notes.

![Alt text: ten limits of RadixAttention in red on the left, each with an arrow to the later work on the right](/notes/media/papers/2023-sglang-radixattention/figures/11-limits-map.svg)

### 5.1 Exact prefixes only

A key and a value of token $i$ depend on all tokens before $i$ ([page 02](/notes/papers/llm-serving/2023-sglang-radixattention/02-background-prefix-sharing-in-lm-programs)). So the same document after another earlier text has other keys and values. The radix tree matches tokens from position 0, and it stops at the first difference.

> [!example] Worked example: the same three chunks in another order
> A RAG request has a 500-token system prompt, three retrieved chunks A, B and C of 300 tokens each, and a 50-token question. Computed in these notes.
>
> 1. Prompt length: $500 + 3 \times 300 + 50 = 1{,}450$ tokens.
> 2. Request 1 sends S, A, B, C, Q1. Request 2 sends S, B, A, C, Q2. The match stops after S: 500 tokens. The hit rate of request 2 is $500 / 1{,}450 \approx 34.5\%$.
> 3. If the application sorts the chunks, request 2 sends S, A, B, C, Q2. The match covers $500 + 900 = 1{,}400$ tokens: $1{,}400 / 1{,}450 \approx 96.6\%$.
> 4. The unsorted order recomputes 900 tokens. For Llama-3.1-8B that is $900 \times 128$ KiB $= 112.5$ MiB of KV and about $2 \times 8.03 \times 10^9 \times 900 \approx 1.45 \times 10^{13}$ FLOPs, about 14.6 ms at the ideal H100 peak.

The cheapest fix is in the application: put stable parts first and keep a fixed order ([prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) lists more rules). Research went further. CacheBlend (arXiv 2405.16444, EuroSys 2025) starts from the problem that "the reused text chunks are not always the input prefix". Its abstract says that it "selectively recomputes the KV values of a small subset of tokens". It reports 2.2 to 3.3 times lower time to first token than a full recompute. Interpretation of these notes: the result is close to exact attention, not equal to it, while RadixAttention never trades exactness.

### 5.2 The CPU cost of the tree

The paper measured the overhead without reuse: 0.2 s of 74.3 s for 100 ShareGPT requests, "less than 0.3%". The tree is "stored on the CPU with negligible maintenance overhead". That holds for one request at a time. The scheduler of [page 06](/notes/papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling) does more: it matches every waiting request in every round, then sorts them.

> [!example] Worked example: the work of one scheduling round
> Interpretation of these notes, with assumed sizes.
>
> 1. 128 waiting requests with prompts of 8,000 tokens each.
> 2. A round of longest-prefix-match matches all of them: up to $128 \times 8{,}000 = 1{,}024{,}000$ token comparisons, plus one sort of 128 keys.
> 3. A decode step of an 8B model at batch 1 lasts about 5 ms ([compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) derives about 200 tokens per second).
> 4. So the CPU work per round grows with the queue length times the prompt length, while the GPU step stays short. At some queue length, the CPU becomes the limit.

SGLang 0.5.22 contains three answers to this cost (source read on 2026-10-19):

1. **A bounded queue for sorting.** `WAITING_QUEUE_PREFIX_MATCH_MAX = 128` in `schedule_policy.py`, with the comment "Turn off the expensive prefix matching and sorting when the #queue is large."
2. **Fewer Python steps per match.** `RadixKey.match_at` compares slices with a galloping search and a binary search. Its comment says: "no per-token Python loop on long shared prefixes".
3. **A tree in Rust.** The default prefix cache that the scheduler builds is `UnifiedRadixCache` (`mem_cache/registry.py`, `default_radix_cache_factory`). The variable `SGLANG_UNIFIED_RADIX_TREE_CORE_BACKEND` chooses its tree core, and its default is `"rust"`. When the Rust core cannot run, the code logs "Using the Python TreeCore" with the reason.

> [!trap] radix_cache.py is not the whole story in 0.5.22
> The classic `RadixCache` class in `radix_cache.py` is the clearest code to read, and [page 10](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today) walks through it. But the default selection chain of 0.5.22 returns `UnifiedRadixCache`. The classic class still serves the temporary tree of in-batch prefix caching (`RadixCache.create_simulated()` in `schedule_policy.py`) and is the base class of `PureSWARadixCache`. Say this in an interview if the conversation reaches the code.

### 5.3 Page size 1 against kernel efficiency

The paper stores the KV cache in pages of one token, so a match can end at any token. A kernel then gathers keys and values through one index per token. Larger pages give fewer indices and longer runs of contiguous memory, but a partial page cannot match. SGLang 0.5.22 truncates every key to a multiple of the page size (`page_aligned`). `--page-size` resolves to 1 on NVIDIA GPUs by default, and some backends force 64 or 128 ([page 10](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today) shows the code).

> [!example] Worked example: the price of a larger page
> A system prompt of 1,000 tokens is shared by every request. The user part differs from token 1,000 on. Computed in these notes for Llama-3.1-8B at 100 requests per second.
>
> | Page size | Matched tokens | Lost per request | Extra prefill tokens per second | Share of the ideal H100 peak |
> |---|---|---|---|---|
> | 1 | 1,000 | 0 | 0 | 0% |
> | 16 | $\lfloor 1{,}000/16 \rfloor \times 16 = 992$ | 8 | 800 | 1.3% |
> | 64 | $\lfloor 1{,}000/64 \rfloor \times 64 = 960$ | 40 | 4,000 | 6.5% |
> | 128 | $\lfloor 1{,}000/128 \rfloor \times 128 = 896$ | 104 | 10,400 | 16.9% |
>
> The last column: $10{,}400 \times 2 \times 8.03 \times 10^9 \approx 1.67 \times 10^{14}$ FLOP/s, divided by about $989.5 \times 10^{12}$.

When the shared length is random, the expected loss per request is about $(P - 1)/2$ tokens for a page size $P$. [Lab 5 of page 12](/notes/papers/llm-serving/2023-sglang-radixattention/12-reproduce-it) measures it for $P = 16$. The kernel side of the trade-off, paged kernels against contiguous memory, is in [PagedAttention page 10](/notes/papers/llm-serving/2023-pagedattention/10-limits-and-later-work).

### 5.4 One cache per server

Each replica keeps its own radix tree in its own GPU memory. A load balancer that ignores the trees scatters the turns of one chat over the replicas. The paper's data-parallel design already had a router with a meta-tree and lazy updates ("weakly consistent", [page 07](/notes/papers/llm-serving/2023-sglang-radixattention/07-frontend-hints-and-multi-gpu)).

> [!example] Worked example: 8 replicas and one chat of 10 turns
> Every replica already holds the 1,000-token system prompt. Each turn adds a 100-token user message and a 300-token answer. A replica holds the history up to the last turn that it served. Computed in these notes, exactly and with a simulation of 20,000 chats.
>
> 1. Turn $t$ has a prompt of $1{,}000 + 400(t - 1) + 100$ tokens. Over 10 turns: $29{,}000$ prompt tokens.
> 2. **Sticky routing**, every turn to the same replica: turn $t$ matches $1{,}000 + 400(t - 1)$ tokens. The sum is 28,000, a hit rate of $28{,}000 / 29{,}000 \approx 96.6\%$.
> 3. **Random routing** over 8 replicas: the previous turn's replica is chosen with probability $1/8$. The expected matched tokens sum to about 16,507, a hit rate of about 56.9%.
> 4. So random routing prefills about $29{,}000 - 16{,}507 \approx 12{,}493$ tokens instead of 1,000: about 12.5 times more prefill.

Later work built this into routers. The SGLang v0.4 cache-aware router (LMSYS blog, 2024-12-04) keeps an approximate radix tree per worker. The blog reports up to 1.9 times the throughput and 3.8 times the hit rate. Preble (arXiv 2407.00023, ICLR 2025) schedules for both KV reuse and load balance across GPUs. HiCache makes the third tier, distributed storage, the only tier that instances share. [Autoscaling and routing](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) covers the operations side.

### 5.5 Hybrid and sliding-window models

An attention layer keeps one KV entry per token. So any prefix of a cached sequence is reusable: take the first $n$ slots. An SSM layer keeps one state for the whole prefix and updates it in place. The state after token 1,000 cannot give the state after token 600. So a hybrid model can reuse a prefix only at a position where the cache saved the SSM state.

Marconi (arXiv 2411.19379, MLSys 2025) states the problem: in-place state updates prevent a rollback for partial overlaps, so only exact-match cache hits work. Its admission and eviction policies weigh the reuse likelihood and the compute saved per byte. The abstract reports up to 34.4 times higher token hit rates and 71.1% (617 ms) lower time to first token than state-of-the-art prefix caching systems.

> [!example] Worked example: where can a hybrid model reuse?
> Request A had 1,000 tokens. Request B shares the first 600 tokens with A, then differs. Interpretation of these notes.
>
> 1. **Pure attention model:** B reuses 600 tokens.
> 2. **Hybrid model, SSM state saved only at the end of A:** no saved state at a position $\leq 600$, so B reuses 0 tokens. The SSM layers need their state at token 600, and the attention layers between them need the hidden states that those SSM layers produce.
> 3. **Hybrid model, SSM state saved every 256 tokens:** the last saved position $\leq 600$ is $\lfloor 600/256 \rfloor \times 256 = 512$. B reuses 512 tokens and recomputes 88.
> 4. The price of step 3: one saved state per 256 tokens per request. An SSM state has a fixed size, whatever the prefix length.

SGLang 0.5.22 handles hybrid models in its Unified Radix Cache (source README of `mem_cache/unified_cache/components`, checked on 2026-10-19). One radix tree carries components for full attention, sliding-window attention and Mamba. A match advances only where every component accepts the node. The sliding-window component needs the last `sliding_window_size` tokens present, and it can keep a node as a "tombstone" without its data. The Mamba component locks one node only, because "mamba state is per-leaf, not per-path". vLLM's answer for its paged pool is the hybrid KV cache manager ([PagedAttention page 10](/notes/papers/llm-serving/2023-pagedattention/10-limits-and-later-work)).

### 5.6 Security: the cache is a timing side channel

A cache hit makes the first token arrive sooner. The Early Bird paper (arXiv 2409.20002, first version 2024-09-30) targets "the Key-Value (KV) cache and semantic cache" of LLM serving systems. It detects hits from timing measurements with classifiers, and it proposes a "token-by-token search algorithm" that recovers shared prompt prefixes from the caches. The abstract proposes no specific defense and calls for mitigation.

> [!example] Worked example: why fine pages help the attacker
> Interpretation of these notes. An attacker guesses a secret prefix of 32 tokens, with 10 candidates per token from a language model.
>
> 1. **Page size 1, as in the paper:** a probe reveals whether one more token matches. At most $10 \times 32 = 320$ guesses, each repeated a few times against timing noise.
> 2. **Full blocks of 16 tokens, as in vLLM:** a hit needs all 16 tokens of a block right at once. Blind guessing needs up to $10^{16}$ candidates per block.
> 3. So a fine page size is good for hit rates and also good for this attack. Isolation needs namespaces, not coarse blocks.

The defense in SGLang 0.5.22 is a namespace. `RadixKey` carries a `cache_salt`, and its comment says that it "Namespaces the tree, storage and KV events". The child key of a node then contains the salt, so requests with different salts never share a node. The OpenAI-compatible request has a `cache_salt` field ("Cache salt for request caching"). Use one secret salt per tenant: users of one tenant still share their system prompt, and nobody outside can probe it. The vLLM side, with its salted first block, is in [prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse), section 9.

### 5.7 The limits at a glance

| Limit | Source of the limit | Consequence | Later work or current feature |
|---|---|---|---|
| Starvation under greedy LPM | The paper, §3 | A request with no shared prefix can wait forever | `fcfs` default, LPM fallback above 128 waiting requests |
| One memory tier | The paper, §8 | Evicted prefixes are recomputed | HiCache, CachedAttention, Mooncake, LMCache |
| Exact prefixes only | The paper, §8, and §5.1 here | Moved chunks miss | Stable prompt order, CacheBlend |
| CPU cost of the tree | §5.2 here | Sorting cost grows with the queue | Fallback to FCFS, galloping match, Rust tree core |
| Page size 1 | §5.3 here | Index per token, kernel cost | Larger pages, at a cost in hits |
| One cache per server | The paper, App. A.4, and §5.4 here | Random routing loses hits | SGLang router, Preble, shared storage tier |
| Hybrid and window models | §5.5 here | Only some positions can match | Marconi, Unified Radix Cache |
| Timing side channel | Early Bird | Prompts can leak | `cache_salt` |
| Decode re-reads the prefix | §6 here | Memory traffic grows with the batch | Cascade inference, Hydragen |
| LRU ignores tail latency | T-LRU | Long chats miss at the worst time | `tlru` eviction policy |

## 6. Shared-prefix attention: Hydragen and cascade inference

### 6.1 What RadixAttention leaves in decode

RadixAttention stores one copy of a shared prefix, so prefill runs once and memory holds one copy. But decode attention is per sequence. In a decode step, each sequence has one query row.

The kernel of each sequence reads the keys and values of the whole prefix from GPU memory and does a matrix-vector product. With $N$ sequences, the same prefix bytes cross the memory bus $N$ times. [Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) shows that decode attention of Llama-3.1-8B does 4 FLOPs per byte, whatever the batch size. A shared prefix is the one case where a batch can share KV bytes.

> [!key] The idea of Hydragen and cascade inference
> Split attention into two parts: the shared prefix and the unique suffix of each sequence. Stack the $N$ query rows into one matrix and multiply it with the prefix keys once: a matrix-matrix product that reads the prefix once. Compute each suffix part on its own. Then merge the two parts exactly with their log-sum-exp values.

### 6.2 How much inter-sequence batching saves

> [!example] Worked example: 64 sequences that share a 2,000-token prefix
> Llama-3.1-8B in BF16: 32 layers, 32 query heads, 8 KV heads, head size 128. Ideal H100 SXM: 3.35 TB/s and about 989.5 TFLOP/s. Computed in these notes.
>
> 1. Prefix KV bytes per token per layer: $2 \times 8 \times 128 \times 2 = 4{,}096$. For 2,000 tokens and 32 layers: $4{,}096 \times 2{,}000 \times 32 = 262{,}144{,}000$ bytes $= 250$ MiB.
> 2. One query row per sequence and per kernel: $64 \times 262{,}144{,}000 = 16{,}777{,}216{,}000$ bytes, about 15.6 GiB per decode step. At 3.35 TB/s this takes about 5.0 ms.
> 3. One matrix of 64 query rows: the prefix is read once, 250 MiB, about 0.078 ms.
> 4. FLOPs: $4 \times 128 \times 32 = 16{,}384$ per cached token, per layer, per sequence. In total $16{,}384 \times 2{,}000 \times 64 \times 32 \approx 6.71 \times 10^{10}$ FLOPs, about 0.068 ms at the peak.
> 5. Intensity: $\frac{6.71 \times 10^{10}}{1.68 \times 10^{10}} = 4$ FLOP/byte one sequence at a time, and $\frac{6.71 \times 10^{10}}{2.62 \times 10^{8}} = 256$ FLOP/byte batched. The ridge point is about 295.
> 6. So in this ideal model, the prefix part of the step falls from about 5.0 ms to about 0.078 ms. The factor is 64, the number of sequences. Above about $295 / 4 \approx 74$ sequences, the batched part becomes compute-bound.

### 6.3 The log-sum-exp merge

Take one query $q$ and split its keys into two disjoint sets: $I$ (the prefix) and $J$ (the suffix). The scores are $s_j = q \cdot k_j / \sqrt{d}$. For a set $I$, define its LSE and its partial output:

$$
\ell(I) = \log \sum_{j \in I} e^{s_j}, \qquad o(I) = \sum_{j \in I} \frac{e^{s_j}}{e^{\ell(I)}}\, v_j
$$

Multiply the second formula by $e^{\ell(I)}$: you get $e^{\ell(I)}\, o(I) = \sum_{j \in I} e^{s_j} v_j$. That unnormalized sum adds over disjoint sets. So the output of the union is:

$$
o(I \cup J) = \frac{e^{\ell(I)}\, o(I) + e^{\ell(J)}\, o(J)}{e^{\ell(I)} + e^{\ell(J)}}, \qquad \ell(I \cup J) = \log\left(e^{\ell(I)} + e^{\ell(J)}\right)
$$

Each part is a weighted average, and the weight of a part is its share of the total softmax denominator. The merge is exact, not an approximation. It is also commutative and associative, so many parts merge in any order. In code, subtract $m = \max(\ell(I), \ell(J))$ before the exponentials, so that no number overflows.

> [!example] Worked example: a cached prefix and a new suffix, by hand
> The toy sentence of [PagedAttention page 11](/notes/papers/llm-serving/2023-pagedattention/11-reproduce-it): keys $[1,0], [0,2], [0,1], [1,1]$, values $[2,3], [2,2], [1,2], [1,3]$, query $q = [1, 2]$, $d = 2$. The prefix is "the cat", the suffix is "sat down".
>
> 1. Scores $q \cdot k / \sqrt{2}$: prefix $[0.7071, 2.8284]$, suffix $[1.4142, 2.1213]$.
> 2. Exponentials: prefix $[2.0281, 16.9188]$, sum $18.9469$, so $\ell = 2.9416$. Suffix $[4.1133, 8.3421]$, sum $12.4554$, so $\ell = 2.5222$.
> 3. Partial outputs: prefix weights $[0.1070, 0.8930]$ give $o = [2, 2.1070]$. Suffix weights $[0.3302, 0.6698]$ give $o = [1, 2.6698]$.
> 4. Merge weights: $18.9469 / 31.4023 = 0.6034$ and $12.4554 / 31.4023 = 0.3966$.
> 5. Output: $0.6034 \times [2, 2.1070] + 0.3966 \times [1, 2.6698] = [1.6034, 2.3302]$. That is exactly the full attention output of the toy example.

The same computation in NumPy, run in these notes:

```python
import numpy as np

def attention_state(q, K, V):
    """Attention of one query over one part of the keys: (output, log-sum-exp)."""
    s = K @ q / np.sqrt(q.shape[0])
    m = s.max()
    p = np.exp(s - m)                    # shift by the max: no overflow
    return (p / p.sum()) @ V, m + np.log(p.sum())

def merge(o_a, lse_a, o_b, lse_b):
    """Weight each part by exp(lse). Shift by the larger lse first."""
    m = max(lse_a, lse_b)
    w_a, w_b = np.exp(lse_a - m), np.exp(lse_b - m)
    return (w_a * o_a + w_b * o_b) / (w_a + w_b), m + np.log(w_a + w_b)

K = np.array([[1, 0], [0, 2], [0, 1], [1, 1]], dtype=float)   # the, cat, sat, down
V = np.array([[2, 3], [2, 2], [1, 2], [1, 3]], dtype=float)
q = np.array([1.0, 2.0])
o_p, lse_p = attention_state(q, K[:2], V[:2])    # cached prefix
o_s, lse_s = attention_state(q, K[2:], V[2:])    # new suffix
o, lse = merge(o_p, lse_p, o_s, lse_s)
o_full, lse_full = attention_state(q, K, V)
print("prefix:", np.round(o_p, 4), round(lse_p, 4))
print("suffix:", np.round(o_s, 4), round(lse_s, 4))
print("merged:", np.round(o, 4), "full:", np.round(o_full, 4))
print("max difference:", np.abs(o - o_full).max(), abs(lse - lse_full))
```

```text
prefix: [2.    2.107] 2.9416
suffix: [1.     2.6698] 2.5222
merged: [1.6034 2.3302] full: [1.6034 2.3302]
max difference: 0.0 0.0
```

1. `attention_state` returns two things, not one. The LSE is what makes a later merge possible.
2. `m + np.log(p.sum())` is the LSE of the original scores, because the shift by `m` cancels.
3. `merge` never needs the scores again. It needs only two outputs and two numbers per query row.
4. The difference is 0.0 here, and below $10^{-12}$ in the random tests of Lab 6 on page 12.

### 6.4 The same merge inside SGLang 0.5.22

RadixAttention's own prefill can use this merge. When a request has a cached prefix, its new tokens attend to two key sets. The first set is the new tokens themselves, with a causal mask. The second set is the cached prefix, without a mask.

In its ragged extend path, the FlashInfer backend computes the two parts and merges them. Its other extend path runs one paged kernel over both sets. The excerpt is from SGLang 0.5.22, `sglang/srt/layers/attention/flashinfer_backend.py`, with arguments shortened. It needs a GPU, so it does not run here:

```python
o1, s1 = self.prefill_wrapper_ragged.forward_return_lse(
    q.view(-1, layer.tp_q_head_num, layer.head_dim),
    k.view(-1, layer.tp_k_head_num, layer.head_dim),
    v.view(-1, layer.tp_v_head_num, layer.head_dim),
    causal=causal,
    ...
)
o2, s2 = prefill_wrapper_paged.forward_return_lse(
    q.view(-1, layer.tp_q_head_num, layer.head_dim),
    kv_cache,
    causal=False,
    ...
)
o, _ = _safe_merge_state(o1, s1, o2, s2)
```

1. `prefill_wrapper_ragged` handles the new tokens, stored contiguously. `causal=causal` stops a new token from seeing later new tokens.
2. `prefill_wrapper_paged` reads the cached prefix through the KV pool. `causal=False` is correct, because every cached token comes before every new token.
3. `_safe_merge_state` calls FlashInfer's `merge_state`, or an in-tree Triton version when one CUDA block cannot hold all heads. The FlashInfer docs describe `merge_state` as "Merge the attention output V and the logsumexp value S from the two KV-segments."

Lab 6 of [page 12](/notes/papers/llm-serving/2023-sglang-radixattention/12-reproduce-it) rebuilds exactly this split in NumPy.

### 6.5 What the two works report

1. **Cascade inference** (FlashInfer blog, 2024-02-02). It "simply decouples attention of shared prefix and unique suffixes".
    1. The prefix part runs in a multi-query (prefill) kernel, which keeps the shared KV in fast on-chip shared memory. A decode kernel computes the suffixes.
    2. On an H100 SXM 80GB, the post reports "up to 31x speedup compared to the baseline vLLM PageAttention implementation". The setting: a shared prompt of 32,768 tokens, a batch of 128 or more, and unique parts of 256 tokens or fewer.
    3. The post names RadixAttention: its attention "can be further accelerated with multiple-level Cascade Inference." FlashInfer exposes the method as `MultiLevelCascadeAttentionWrapper` and `merge_state`.
2. **Hydragen** (arXiv 2402.05099, first version 2024-02-07, ICML 2024). It is "a hardware-aware exact implementation of attention with shared prefixes". It reports up to 32 times higher end-to-end throughput for CodeLlama-13b against its baselines. For tree-shaped sharing it reports 55% less inference time on competitive programming problems.

> [!note] Interpretation of these notes
> RadixAttention and Hydragen remove two different redundancies. RadixAttention removes repeated prefill compute and repeated KV storage. Hydragen and cascade inference remove repeated KV reads in decode. A system can use both: the radix tree finds which sequences share a prefix, and the kernel reads that prefix once for all of them.

## 7. A timeline of later work

Each date is the first public version: the first arXiv submission, the PyPI release, or the date of the official post. Items marked "PagedAttention page 10" were checked there on 2026-10-15. All other items were checked on 2026-10-19.

| Date | Work | Venue or source | What it adds to RadixAttention |
|---|---|---|---|
| 2023-12-12 | SGLang v1 with RadixAttention | arXiv 2312.07104 v1 | The radix tree of KV caches, LRU leaf eviction, reference counts |
| 2024-02-02 | Cascade inference | FlashInfer blog | Shared prefix and suffixes computed apart and merged by LSE |
| 2024-02-07 | Hydragen | arXiv 2402.05099, ICML 2024 | One matrix-matrix product over the prefix for all sequences |
| 2024-03-23 | CachedAttention | arXiv 2403.19708, USENIX ATC 2024 (PagedAttention page 10) | Conversation KV caches in cheaper tiers |
| 2024-03-31 | vLLM 0.4.0 automatic prefix caching | PyPI, release notes (PagedAttention page 10) | The same reuse with a hash chain over 16-token blocks |
| 2024-05-08 | Preble | arXiv 2407.00023, ICLR 2025 | Distributed scheduling for KV reuse and load balance |
| 2024-05-26 | CacheBlend | arXiv 2405.16444, EuroSys 2025 | Reuse of non-prefix chunks with partial recomputation |
| 2024-06-06 | SGLang v2, final title | arXiv 2312.07104 v2, NeurIPS 2024 | The final evaluation, with up to 6.4x throughput |
| 2024-06-24 | Mooncake | arXiv 2407.00079, FAST 2025 (PagedAttention page 10) | A KV-cache-centric design with a distributed KV store, a HiCache backend today |
| 2024-09-30 | The Early Bird Catches the Leak | arXiv 2409.20002 | Timing attacks on shared KV caches |
| 2024-11-28 | Marconi | arXiv 2411.19379, MLSys 2025 | Prefix caching for hybrid attention and SSM models |
| 2024-12-04 | SGLang v0.4 cache-aware router | LMSYS blog | An approximate radix tree per worker inside the router |
| 2025-01-27 | vLLM V1 alpha | vLLM blog (PagedAttention page 10) | Prefix caching on by default in vLLM |
| 2025-09-10 | SGLang HiCache | LMSYS blog | GPU, CPU and storage tiers under one HiRadixTree |
| 2025-10-08 | LMCache | arXiv 2510.09665 (PagedAttention page 10) | A KV cache layer outside the engine, for vLLM and SGLang |
| 2025-10-16 | Tail-Optimized LRU | arXiv 2510.15152 | Eviction that targets the tail time to first token |
| 2026-10-16 | SGLang 0.5.22 | PyPI | The version whose source these notes checked |

![Alt text: a timeline of later work from December 2023 to October 2026 in six lanes, from SGLang itself to security](/notes/media/papers/2023-sglang-radixattention/figures/11-later-work-timeline.svg)

> [!trap] Dates of papers vs dates of features
> SGLang's arXiv v1 (2023-12-12) came about three and a half months before vLLM 0.4.0 (2024-03-31). But automatic prefix caching was an option in vLLM 0.4.0 and became the default only with the V1 engine in 2025. And SGLang 0.5.22 defaults to `fcfs`, not to the paper's scheduler. Always say what a date is the date of.

### 7.1 Notes on four items

1. **HiCache** (LMSYS blog, 2025-09-10, by Zhiqiang Xie, one of the paper's authors). It adds "a HiRadixTree that acts as a page table for referencing KV caches residing locally in GPU and CPU memory". The blog reports "up to 6× throughput improvement and up to 80% reduction in TTFT" without tying them to one configuration. [Page 10](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today) covers its tiers and policies.
2. **Tail-Optimized LRU** (arXiv 2510.15152, 2025-10-16). Its abstract says that LRU "can perform arbitrarily poor" on tail latency because it ignores the length of conversations. It reports up to 27.5% lower P90 time to first token on WildChat data. SGLang 0.5.22 implements it as `--radix-eviction-policy tlru`, with the parameters `threshold` and `next_prompt_estimate` in tokens, and requires the Unified Radix Cache for it.
3. **Preble** (arXiv 2407.00023, ICLR 2025). It reports 1.5 to 14.5 times lower average latency and 2 to 10 times lower p99 latency than state-of-the-art serving systems. The SGLang paper itself calls Preble concurrent work built on an early SGLang.
4. **vLLM automatic prefix caching**. The same idea with another index: a chain of block hashes ([prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse), section 7.2, compares the two).

## 8. Verified facts and interpretations on this page

| Statement | Kind |
|---|---|
| Starvation quote, latency-sensitive quote, Section 8 directions | The paper: §3 quoted, Section 8 in paraphrase |
| Default `fcfs`, LPM fallback above 128, galloping `match_at`, Rust tree core default, `cache_salt`, Unified Radix Cache, the FlashInfer merge in extend | SGLang 0.5.22 source, read on 2026-10-19 |
| Dates, venues and abstract numbers of later work | arXiv, venue pages, official blogs, checked on 2026-10-19 or on PagedAttention page 10 |
| RAG reorder, page size, routing, Hydragen bytes and FLOPs | Computed in these notes |
| CPU cost grows with queue length times prompt length | Interpretation of these notes |
| Fine pages make the side channel easier | Interpretation of these notes |
| RadixAttention and Hydragen remove different redundancies | Interpretation of these notes |

## 9. The interview answer: "What came after RadixAttention?"

> [!example] Worked example: a 60-second answer
> "RadixAttention keeps the KV cache of finished requests in a radix tree, so a request with the same token prefix skips that prefill. First, reuse moved beyond one GPU: HiCache, Mooncake and LMCache keep KV caches in CPU memory and storage, and vLLM added hash-based reuse in 2024. Second, beyond one server: the SGLang router and Preble route requests to the replica that holds their prefix, while they watch the load. Third, kernels: cascade inference and Hydragen read a shared prefix once for the whole batch and merge the parts exactly with log-sum-exp. Fourth, new models and policies: Marconi caches hybrid attention-SSM models, and Tail-Optimized LRU evicts with tail latency in mind. Two problems stay open: reuse is exact-prefix only, so a moved document misses, and a shared cache leaks timing, so tenants need a cache salt. In SGLang 0.5.22 the default scheduler is FCFS, not the paper's order, and the tree core is written in Rust."

Follow-up chains to expect:

1. "How do you merge two attention parts exactly?" Section 6.3: weights $e^{\ell}$, normalized.
2. "Why does Hydragen help if the prefix is stored once?" Section 6.2: storage once is not reads once.
3. "Why is the default not LPM?" Starvation and sorting cost (sections 4.1 and 5.2).
4. "How would you serve RAG with many shared documents?" A stable chunk order first. Then partial-recompute methods such as CacheBlend, which are not exact.

## 10. Practice

### Exercises

1. **Merge three parts.** Write `merge(o_a, lse_a, o_b, lse_b)` for many query rows at once. Split 30 keys into three parts and merge them in two different orders.
   - Acceptance test: both orders equal full attention within $10^{-12}$, and the toy numbers give $[1.6034, 2.3302]$.
   - Hint 1: the merged LSE is $\log(e^{\ell_a} + e^{\ell_b})$, so a merged pair is again a state.
   - Hint 2: subtract the larger LSE before the exponentials.
2. **The cost of chunk order.** Simulate the RAG example of section 5.1 with a radix tree: one request inserted, then the second request matched.
   - Acceptance test: 500 matched tokens for the swapped order and 1,400 for the sorted order, of 1,450.
   - Hint 1: any token ids work if the chunks have distinct ids.
   - Hint 2: the match is the longest common prefix with the inserted sequence.
3. **Hybrid reuse.** Write `reusable(matched, saved_positions)`: the largest saved SSM position that is not larger than the matched prefix length.
   - Acceptance test: matched 600 gives 600 for pure attention, 0 with a state only at 1,000, and 512 with states every 256 tokens.
   - Hint 1: position 0 is always a valid start, with an empty state.
   - Hint 2: `max(p for p in saved if p <= matched)`.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/11-limits-and-later-work)

```check
{
  "question": "Exercise 1: show a reference solution",
  "answer": "Attention states for many query rows, the merge, the toy check and three parts in two orders.\n\n```python\nimport numpy as np\n\n\ndef attention_state(Q, K, V):\n    \"\"\"Rows of Q against one part of the keys: outputs [n, dv] and LSE [n].\"\"\"\n    S = Q @ K.T / np.sqrt(Q.shape[1])\n    m = S.max(axis=1, keepdims=True)\n    P = np.exp(S - m)\n    return (P / P.sum(axis=1, keepdims=True)) @ V, m[:, 0] + np.log(P.sum(axis=1))\n\n\ndef merge(O_a, lse_a, O_b, lse_b):\n    m = np.maximum(lse_a, lse_b)                       # shift by the larger LSE\n    w_a, w_b = np.exp(lse_a - m)[:, None], np.exp(lse_b - m)[:, None]\n    return (w_a * O_a + w_b * O_b) / (w_a + w_b), m + np.log(w_a[:, 0] + w_b[:, 0])\n\n\n# the toy numbers: prefix \"the cat\", suffix \"sat down\", query of \"down\"\nKt = np.array([[1, 0], [0, 2], [0, 1], [1, 1]], dtype=float)\nVt = np.array([[2, 3], [2, 2], [1, 2], [1, 3]], dtype=float)\nqt = np.array([[1.0, 2.0]])\nO_toy, _ = merge(*attention_state(qt, Kt[:2], Vt[:2]), *attention_state(qt, Kt[2:], Vt[2:]))\nassert np.allclose(np.round(O_toy, 4), [[1.6034, 2.3302]])\n\n# three parts of 30 keys, merged in two orders\nrng = np.random.default_rng(0)\nQ, K, V = rng.normal(size=(5, 8)), rng.normal(size=(30, 8)), rng.normal(size=(30, 8))\na, b, c = (attention_state(Q, K[i:j], V[i:j]) for i, j in [(0, 4), (4, 21), (21, 30)])\nfull, lse_full = attention_state(Q, K, V)\none = merge(*merge(*a, *b), *c)\ntwo = merge(*c, *merge(*b, *a))\nfor O, lse in (one, two):\n    assert np.abs(O - full).max() < 1e-12 and np.abs(lse - lse_full).max() < 1e-12\nprint(\"toy:\", np.round(O_toy, 4))\nprint(\"largest difference over both orders:\", max(np.abs(o - full).max() for o, _ in (one, two)))\n```\n\nOutput:\n\n```text\ntoy: [[1.6034 2.3302]]\nlargest difference over both orders: 2.220446049250313e-16\n```\n\nThe merged LSE of a pair is again a valid LSE, so the result of one merge is a state that can merge again. That is why the order does not matter. The difference of about $2 \\times 10^{-16}$ is rounding in the last bit of a float64."
}
```

```check
{
  "question": "Exercise 2: show a reference solution",
  "answer": "A radix tree returns the longest prefix that any cached sequence shares with the prompt. With one cached sequence, that is a longest common prefix.\n\n```python\ndef match(cached, prompt):\n    \"\"\"Longest prefix of prompt that a radix tree of the cached sequences matches.\"\"\"\n    best = 0\n    for seq in cached:\n        n = 0\n        while n < min(len(seq), len(prompt)) and seq[n] == prompt[n]:\n            n += 1\n        best = max(best, n)\n    return best\n\n\nS = list(range(0, 500))                                  # system prompt\nA, B, C = (list(range(k, k + 300)) for k in (1000, 2000, 3000))   # three chunks\nQ1, Q2 = list(range(5000, 5050)), list(range(6000, 6050))          # two questions\ncached = [S + A + B + C + Q1]                            # request 1 ran first\nswapped = S + B + A + C + Q2\nin_order = S + A + B + C + Q2\nfor name, prompt in [(\"swapped\", swapped), (\"sorted\", in_order)]:\n    m = match(cached, prompt)\n    print(f\"{name}: {m} of {len(prompt)} tokens matched, hit rate {m / len(prompt):.1%}\")\nassert match(cached, swapped) == 500 and match(cached, in_order) == 1400\n```\n\nOutput:\n\n```text\nswapped: 500 of 1450 tokens matched, hit rate 34.5%\nsorted: 1400 of 1450 tokens matched, hit rate 96.6%\n```\n\nThe token ids of the three chunks are identical in both prompts. Only their positions differ, and that is enough to stop the match after the system prompt."
}
```

```check
{
  "question": "Exercise 3: show a reference solution",
  "answer": "```python\ndef reusable(matched, saved):\n    \"\"\"Largest saved SSM position that is not beyond the matched prefix (0 = empty state).\"\"\"\n    return max([0] + [p for p in saved if p <= matched])\n\n\nmatched = 600                                  # B shares 600 tokens with the cached A (1,000 tokens)\nprint(\"pure attention:\", reusable(matched, range(0, 1001)))       # every position has its KV\nprint(\"state only at the end of A:\", reusable(matched, [1000]))\nprint(\"state every 256 tokens:\", reusable(matched, range(0, 1001, 256)))\nassert reusable(matched, range(0, 1001)) == 600\nassert reusable(matched, [1000]) == 0\nassert reusable(matched, range(0, 1001, 256)) == 512\n```\n\nOutput:\n\n```text\npure attention: 600\nstate only at the end of A: 0\nstate every 256 tokens: 512\n```\n\nFor a pure attention model every position is a valid restart point, because each token has its own KV entry. For a hybrid model only the saved SSM positions are. Position 0 always works: it is the empty state, and it means no reuse."
}
```

## 11. Common mistakes

1. **"RadixAttention reuses any repeated text."** It reuses an exact token prefix from position 0. The same document after other text has other keys and values.
2. **"Storing the prefix once makes decode cheap too."** Each sequence's decode kernel still reads the whole prefix. Hydragen and cascade inference read it once per batch.
3. **"The log-sum-exp merge is an approximation."** It is exact. It splits the softmax denominator into two partial sums, and addition does not care about grouping.
4. **"SGLang schedules by longest prefix match by default."** In 0.5.22 the default is `fcfs`. `lpm` is an option, and it uses FCFS for a round when more than 128 requests wait.
5. **"A larger page is free."** Every request loses the partial last page of its match. That is about $(P-1)/2$ tokens on average, and 104 tokens for a 1,000-token prompt at page size 128.
6. **"A hybrid model caches like a pure attention model."** An SSM state exists only where the cache saved it, so most prefix lengths cannot match.
7. **"The prefix cache is invisible to other users."** Its timing is visible. Use a cache salt per tenant.
8. **"Every SGLang server uses the class in radix_cache.py."** In 0.5.22 the default factory builds `UnifiedRadixCache`, with a Rust tree core by default.

## 12. One-minute explanation

RadixAttention reuses the KV cache of an exact token prefix, in the GPU memory of one server, and it saves prefill. The paper names three limits: greedy cache-aware scheduling can starve requests, the cache lives in one memory tier, and fuzzy matching is future work. Later analysis adds three more: a moved document is a miss, the tree costs CPU time, and larger pages lose partial pages. Each replica also has its own cache, hybrid models can match only at saved SSM states, and a shared cache leaks timing. HiCache, Mooncake and LMCache add memory tiers, while the SGLang router and Preble route requests by prefix. Marconi handles hybrid models, Tail-Optimized LRU evicts for tail latency, and a cache salt isolates tenants. Hydragen and cascade inference remove the repeated reads of a shared prefix in decode with an exact log-sum-exp merge. SGLang 0.5.22 uses that same merge in one path of its prefill, defaults to FCFS, and runs its tree core in Rust.

## 13. Check questions

```check
{
  "question": "Which limits does the paper itself state about RadixAttention and its scheduler? Name the six future directions of Section 8 and say which concern the KV cache.",
  "hint": "Read §3 (scheduling), Appendix A.3 (the proof), Appendix A.4 (data parallelism) and Section 8.",
  "answer": "**Stated limits.**\n\n1. Greedy cache-aware scheduling \"can lead to starvation\". Fair scheduling is future work.\n2. Theorem 3.1 needs a cache size of at least the maximum request length, and it is an offline result. Online, the schedule only approximates DFS, and Figure 13 shows about 96% of the optimal hit rate on average.\n3. Footnote 2, in paraphrase: unknown output lengths can force recomputation, so practice differs from the proof.\n4. Appendix A.4: the trade-off between data locality and parallel efficiency is future work.\n\n**Section 8, in paraphrase.**\n\n| Direction | About the KV cache? |\n|---|---|\n| More output modalities | No |\n| RadixAttention across several levels of the memory hierarchy | Yes |\n| Fuzzy semantic matching | Yes |\n| Higher-level primitives | No |\n| Fixing starvation in cache-aware scheduling | Yes |\n| Static optimizations in the compiler | No |"
}
```

```check
{
  "question": "Interview follow-up: your RAG service sends the same three retrieved chunks to many users, but in a ranking order that changes per query. The prefix cache hit rate is low. Explain exactly why. Compute the hit for a 500-token system prompt, three chunks of 300 tokens and a 50-token question, and give two fixes with their costs.",
  "hint": "The key and value of a token depend on every earlier token and on its position.",
  "answer": "**Why.** A key or value of token $i$ depends on all tokens before $i$, through attention in every layer. It also depends on its position, through the position encoding. So chunk B after chunk A has other KV entries than chunk B right after the system prompt. The radix tree matches tokens from position 0 and stops at the first difference.\n\n**Numbers.** Prompt: $500 + 900 + 50 = 1{,}450$ tokens. With a swapped order the match stops after the system prompt: $500 / 1{,}450 \\approx 34.5\\%$. The 900 chunk tokens are recomputed: 112.5 MiB of KV for Llama-3.1-8B, about 14.6 ms of ideal H100 compute.\n\n**Fix 1: a canonical order.** Sort the chunks, for example by document id: $1{,}400 / 1{,}450 \\approx 96.6\\%$. Cost: the model sees the documents in another order than the ranking. Position affects accuracy ([Lost in the middle](/notes/papers/long-context/2023-lost-in-the-middle)), so evaluate the quality.\n\n**Fix 2: partial recomputation.** CacheBlend (arXiv 2405.16444, EuroSys 2025) reuses the KV of a chunk at another position. It recomputes the KV of a small subset of tokens. It reports 2.2 to 3.3 times lower time to first token than a full recompute. Cost: the result is close to exact attention, not equal to it, and it needs an engine integration. Interpretation of these notes: RadixAttention alone never trades exactness."
}
```

```check
{
  "question": "Interview follow-up: derive the log-sum-exp merge of two attention parts. Why must each part return its LSE? Show with the toy numbers what goes wrong if you average the two normalized outputs.",
  "hint": "Multiply a normalized partial output by its own softmax denominator.",
  "answer": "**Derivation.** For scores $s_j$ and a set $I$: $\\ell(I) = \\log \\sum_{j \\in I} e^{s_j}$ and $o(I) = \\sum_{j \\in I} e^{s_j - \\ell(I)} v_j$. So $e^{\\ell(I)} o(I) = \\sum_{j \\in I} e^{s_j} v_j$, an unnormalized sum. Unnormalized sums of disjoint sets add, and so do the denominators:\n\n$$\no(I \\cup J) = \\frac{e^{\\ell(I)} o(I) + e^{\\ell(J)} o(J)}{e^{\\ell(I)} + e^{\\ell(J)}}\n$$\n\n**Why the LSE.** A normalized output has lost its denominator. Without $\\ell$, the merge cannot know how much weight each part deserves.\n\n**The toy numbers.** The prefix gives $[2, 2.1070]$ with $\\ell = 2.9416$, and the suffix gives $[1, 2.6698]$ with $\\ell = 2.5222$. A plain average gives $[1.5, 2.3884]$, which is wrong. The weights $e^{\\ell}$ are 18.9469 and 12.4554, so the prefix deserves 0.6034 of the weight, not 0.5. The correct result is $[1.6034, 2.3302]$, equal to full attention."
}
```

```check
{
  "question": "Interview follow-up: RadixAttention already stores a shared prefix once. Why does Hydragen still speed up decoding? Give the arithmetic intensity of prefix attention for N sequences of Llama-3.1-8B, and say when the gain disappears.",
  "answer": "**Stored once is not read once.** In a decode step each sequence has one query row. Its kernel reads the whole prefix from GPU memory. $N$ sequences read the same bytes $N$ times.\n\n**Intensity.** Per cached token, per layer, per sequence: $4 \\times 128 \\times 32 = 16{,}384$ FLOPs and $2 \\times 8 \\times 128 \\times 2 = 4{,}096$ bytes, so 4 FLOP/byte. Hydragen stacks the $N$ query rows into one matrix: the FLOPs stay, the bytes are read once, so the intensity becomes $4N$. For $N = 64$: 256 FLOP/byte, near the H100 ridge of about 295. For a 2,000-token prefix the reads fall from about 15.6 GiB to 250 MiB per step.\n\n**When the gain disappears.**\n\n1. $N = 1$, or sequences that share nothing.\n2. A short prefix with long unique suffixes: the suffix part, which is not batched, dominates.\n3. Above about 74 sequences the batched prefix part is compute-bound, so more sequences add no further gain in this part.\n4. Prefill of one request already reads its prefix once for all its new tokens. The gain is a decode effect."
}
```

```check
{
  "question": "Interview follow-up: a chat product runs 8 SGLang replicas behind a round-robin load balancer. The hit rate is low. Explain the loss with a chat of 10 turns: a 1,000-token system prompt, 100-token user messages and 300-token answers. Then name two fixes and their trade-off.",
  "hint": "Only the replica that served the previous turn holds the whole history.",
  "answer": "**The loss.** Prompts over 10 turns: $\\sum_{t=1}^{10} (1{,}000 + 400(t-1) + 100) = 29{,}000$ tokens. With one replica for every turn, turn $t$ matches $1{,}000 + 400(t-1)$, in total 28,000: about 96.6%. Round-robin or random routing hits the previous turn's replica with probability $1/8$. The expected matched tokens are about 16,507, a hit rate of about 56.9%, computed in these notes. Prefill grows from 1,000 tokens to about 12,493: about 12.5 times more.\n\n**Fix 1: session affinity.** Route by conversation id. Simple, but a hot conversation or tenant can overload one replica.\n\n**Fix 2: a cache-aware router.** The SGLang router keeps an approximate radix tree per worker. The v0.4 blog (2024-12-04) reports up to 1.9 times the throughput and 3.8 times the hit rate. Its default policy, `cache_aware`, routes by prefix match while the load is balanced and switches to the shortest queue when it is not. [Page 07](/notes/papers/llm-serving/2023-sglang-radixattention/07-frontend-hints-and-multi-gpu) gives the thresholds, which changed over time.\n\n**The trade-off.** Data locality against load balance, the same open problem that the paper names in Appendix A.4. A shared storage tier, such as HiCache's third tier, softens a miss: the replica loads the prefix instead of recomputing it."
}
```

```check
{
  "question": "Why is prefix caching harder for a hybrid model with attention and SSM layers? Use a request B that shares 600 tokens with a cached 1,000-token request A. What does Marconi report, and how does SGLang 0.5.22 organize such a cache?",
  "answer": "**Why.** An attention layer keeps one KV entry per token, so any prefix length is reusable. An SSM layer keeps one fixed-size state and updates it in place. The state after token 1,000 cannot give the state after token 600.\n\n**Request B.** Pure attention: 600 tokens reused. Hybrid with a state saved only at the end of A: 0 tokens. The SSM layers need their state at token 600, and the attention layers between them need their outputs. Hybrid with a state every 256 tokens: 512 tokens reused, 88 recomputed.\n\n**Marconi** (arXiv 2411.19379, MLSys 2025): in-place updates prevent a rollback, so only exact-match hits work. It admits and evicts entries by reuse likelihood and compute saved per byte. It reports up to 34.4 times higher token hit rates and 71.1% (617 ms) lower time to first token.\n\n**SGLang 0.5.22.** One radix tree with components for full attention, sliding-window attention and Mamba (the Unified Radix Cache). A match advances only where every component accepts the node. The Mamba component locks a single node, because its state is per leaf, not per path."
}
```

```check
{
  "question": "Interview follow-up: a security reviewer says that the shared prefix cache leaks other tenants' prompts. Explain the attack, why page size 1 makes it easier than 16-token blocks, the defense in SGLang 0.5.22, and what the defense costs.",
  "answer": "**The attack.** A hit makes the first token arrive sooner. The Early Bird paper (arXiv 2409.20002) detects hits from timing measurements with classifiers and recovers shared prompt prefixes with a token-by-token search.\n\n**Page size 1.** Interpretation of these notes: with one-token pages, each probe tests one more token. A 32-token secret with 10 candidates per token needs at most $10 \\times 32 = 320$ guesses, each repeated against noise. With full 16-token blocks, a hit needs all 16 tokens at once: up to $10^{16}$ candidates per block for blind guessing.\n\n**The defense.** `RadixKey.cache_salt` \"Namespaces the tree, storage and KV events\". The child key of a node contains the salt, so different salts never share a node. Requests carry it in the `cache_salt` field. Use one secret salt per tenant.\n\n**The cost.** No sharing across tenants. If 50 tenants use the same 2,000-token system prompt on Llama-3.1-8B, the cache holds 50 copies. That is $50 \\times 262{,}144{,}000$ bytes $\\approx 12.2$ GiB instead of 250 MiB, and each tenant pays its own first prefill."
}
```

```check
{
  "question": "SGLang 0.5.22 defaults to `--schedule-policy fcfs`, and with `lpm` it uses FCFS for a round when more than 128 requests wait. Explain why, and separate the source facts from the interpretation.",
  "answer": "**Source facts (SGLang 0.5.22, checked on 2026-10-19).** The default is `fcfs`. `WAITING_QUEUE_PREFIX_MATCH_MAX = 128` is set in `schedule_policy.py`. Its comment says: \"Turn off the expensive prefix matching and sorting when the #queue is large.\" The default prefix cache is `UnifiedRadixCache`, with a Rust tree core by default.\n\n**Interpretation of these notes.**\n\n1. **CPU cost.** LPM matches every waiting request in every round and sorts them. The work grows with the queue length times the prompt length. For 128 prompts of 8,000 tokens, that is up to 1,024,000 token comparisons, while a decode step lasts milliseconds.\n2. **Starvation.** The paper admits that greedy LPM can starve requests. FCFS bounds the wait of every request.\n3. **Less need.** Large queues mostly appear under heavy load, where the batch is full anyway. In-batch prefix caching still lets only one of several requests with a shared prefix compute it first."
}
```

```check
{
  "question": "Put these in date order with their dates: vLLM 0.4.0 automatic prefix caching, SGLang arXiv v1, Hydragen, cascade inference, Marconi, the SGLang HiCache blog. Then say what an arXiv date does not tell you.",
  "answer": "1. SGLang arXiv v1: 2023-12-12.\n2. Cascade inference (FlashInfer blog): 2024-02-02.\n3. Hydragen (arXiv v1): 2024-02-07.\n4. vLLM 0.4.0 with automatic prefix caching: 2024-03-31.\n5. Marconi (arXiv v1): 2024-11-28.\n6. SGLang HiCache (LMSYS blog): 2025-09-10.\n\nAn arXiv date is the date of a paper, not of a default in production. Automatic prefix caching was an option in vLLM 0.4.0 and became the default with the V1 engine in 2025. The paper's longest-prefix-match scheduler is not the default in SGLang 0.5.22. Say what each date is the date of."
}
```

## 14. Links

- Previous: [10 RadixAttention in SGLang today](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today)
- Next: [12 Reproduce it](/notes/papers/llm-serving/2023-sglang-radixattention/12-reproduce-it)
- The paper card: [SGLang and RadixAttention](/notes/papers/llm-serving/2023-sglang-radixattention)
- The paper on one page: [00 The paper on one page](/notes/papers/llm-serving/2023-sglang-radixattention/00-paper-on-one-page)
- The data structure: [04 RadixAttention: the tree of KV caches](/notes/papers/llm-serving/2023-sglang-radixattention/04-radixattention-the-tree-of-kv-caches)
- Starvation and Theorem 3.1: [06 Cache-aware scheduling and the DFS theorem](/notes/papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling)
- Routers and data parallelism: [07 Frontend hints and multi-GPU RadixAttention](/notes/papers/llm-serving/2023-sglang-radixattention/07-frontend-hints-and-multi-gpu)
- The evaluation: [09 Results](/notes/papers/llm-serving/2023-sglang-radixattention/09-results)
- The vLLM side: [Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)
- Later work after paging: [PagedAttention 10 Limits and later work](/notes/papers/llm-serving/2023-pagedattention/10-limits-and-later-work)
- Arithmetic intensity: [Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)
- The online softmax: [The cost of attention and FlashAttention](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention)
- Routing in operations: [Autoscaling and routing](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing)
- Provider prompt caching: [Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)

### Sources

All sources were checked on 2026-10-19, except the items marked as checked on PagedAttention page 10 (2026-10-15).

- [Zheng et al., SGLang, arXiv 2312.07104](https://arxiv.org/abs/2312.07104): §3, §8, Appendix A.3 and A.4, Figure 13.
- [SGLang 0.5.22 on PyPI](https://pypi.org/project/sglang/0.5.22/): `schedule_policy.py`, `radix_cache.py`, `mem_cache/registry.py`, `mem_cache/unified_cache/tree_core_registry.py`, `mem_cache/unified_cache/components/README.md`, `mem_cache/evict_policy.py`, `layers/attention/flashinfer_backend.py`, `entrypoints/openai/protocol.py`.
- [FlashInfer blog, 2024-02-02: Cascade Inference](https://flashinfer.ai/2024/02/02/cascade-inference.html) and [FlashInfer docs: merge attention states](https://docs.flashinfer.ai/api/python/cascade.html)
- [Juravsky et al., Hydragen, arXiv 2402.05099](https://arxiv.org/abs/2402.05099) and [ICML 2024 page](https://icml.cc/virtual/2024/39631)
- [Srivatsa et al., Preble, arXiv 2407.00023](https://arxiv.org/abs/2407.00023)
- [Yao et al., CacheBlend, arXiv 2405.16444](https://arxiv.org/abs/2405.16444) and [Microsoft Research page (EuroSys 2025)](https://www.microsoft.com/en-us/research/publication/you-only-prefill-once-combining-cached-knowledge-for-large-language-model-serving-with-cacheblend/)
- [Pan et al., Marconi, arXiv 2411.19379](https://arxiv.org/abs/2411.19379v1) and [MLSys 2025 proceedings](https://proceedings.mlsys.org/paper_files/paper/2025/hash/7c180af017258d239bac6248d1eb26ac-Abstract-Conference.html)
- [Song et al., The Early Bird Catches the Leak, arXiv 2409.20002](https://arxiv.org/abs/2409.20002)
- [Zhang et al., Tail-Optimized Caching for LLM Inference, arXiv 2510.15152](https://arxiv.org/abs/2510.15152)
- [LMSYS blog, 2024-12-04: SGLang v0.4](https://lmsys.org/blog/2024-12-04-sglang-v0-4/)
- [LMSYS blog, 2025-09-10: SGLang HiCache](https://lmsys.org/blog/2025-09-10-sglang-hicache)
- Checked on PagedAttention page 10: vLLM 0.4.0 and the V1 blog, CachedAttention (arXiv 2403.19708), Mooncake (arXiv 2407.00079), LMCache (arXiv 2510.09665).
