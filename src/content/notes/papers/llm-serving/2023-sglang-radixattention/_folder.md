---
title: "SGLang and RadixAttention (2023)"
order: 2023
summary: "How SGLang keeps the KV cache of finished LLM calls in a radix tree, reuses it for every later call with the same first tokens, evicts the least recently used leaves, and orders requests so that shared prefixes stay cached. Up to 6.4 times the throughput on LM programs."
---

## The paper

| Field | Value |
|---|---|
| Title | SGLang: Efficient Execution of Structured Language Model Programs |
| Authors | Lianmin Zheng, Liangsheng Yin, Zhiqiang Xie, Chuyue Sun, Jeff Huang, Cody Hao Yu, Shiyi Cao, Christos Kozyrakis, Ion Stoica, Joseph E. Gonzalez, Clark Barrett, Ying Sheng. Zheng and Yin made an equal contribution. |
| Institutions | The paper lists Stanford University, UC Berkeley, Shanghai Jiao Tong University, Texas A&M University and an independent researcher. |
| First version | [arXiv 2312.07104](https://arxiv.org/abs/2312.07104), 12 December 2023, with the title "Efficiently Programming Large Language Models using SGLang" |
| Version in these notes | arXiv version 2, 6 June 2024, the version with the final title |
| Published | Advances in Neural Information Processing Systems 37 (NeurIPS 2024), Main Conference Track, pages 62557 to 62583, DOI 10.52202/079017-2000 ([proceedings page](https://proceedings.neurips.cc/paper_files/paper/2024/hash/724be4472168f31ba1c9ac630f15dec8-Abstract.html)) |
| Code | [github.com/sgl-project/sglang](https://github.com/sgl-project/sglang), Apache License 2.0. These notes read the source of SGLang 0.5.22 (PyPI, 2026-10-16), checked on 2026-10-19. |

## The result in three sentences

1. LM programs call a model many times, and the calls share long prefixes: few-shot examples, chat histories, self-consistency samples, tree-of-thought branches and agent templates. The serving engines of 2023 discarded the KV cache of each request when it finished, so every call computed the shared prefix again.
2. RadixAttention keeps the KV cache of finished requests in a GPU pool with pages of one token. A **radix tree** of token runs on the CPU indexes it. A new request reuses its longest cached prefix. The least recently used **leaves** are evicted when memory is short, and **reference counts** protect the paths of running requests. The scheduler runs the longest shared prefix first, a depth-first order with an optimal hit rate.
3. SGLang adds a frontend language, compressed finite state machines and API speculation. It reaches up to 6.4 times the throughput and up to 3.7 times lower latency than Guidance, vLLM v0.2.5 and LMQL. Its cache hit rates are 50% to 99%.

![The paper at a glance: the problem, the radix tree idea, the five mechanisms, the result and the later work](/notes/media/papers/2023-sglang-radixattention/figures/overview.svg)

## Reading order

| # | Page | The question it answers | Status |
|---|---|---|---|
| 00 | [The paper on one page](/notes/papers/llm-serving/2023-sglang-radixattention/00-paper-on-one-page) | What must I remember, and how do I present the paper in an interview? | not started |
| 01 | [Background: tries and radix trees](/notes/papers/llm-serving/2023-sglang-radixattention/01-background-tries-and-radix-trees) | How does a radix tree find the longest shared beginning of a token sequence, and how do match, insert and split work? | not started |
| 02 | [Background: prefix sharing in LM programs](/notes/papers/llm-serving/2023-sglang-radixattention/02-background-prefix-sharing-in-lm-programs) | Why is the KV cache of a shared prefix reusable exactly, and where do LM programs share prefixes? | not started |
| 03 | [The question](/notes/papers/llm-serving/2023-sglang-radixattention/03-the-question) | Which inefficiencies does the paper attack, and what must an automatic KV reuse system decide? | not started |
| 04 | [RadixAttention: the tree of KV caches](/notes/papers/llm-serving/2023-sglang-radixattention/04-radixattention-the-tree-of-kv-caches) | What is stored where, what happens to one request, and how does the tree evolve over nine steps? | not started |
| 05 | [Eviction and reference counts](/notes/papers/llm-serving/2023-sglang-radixattention/05-eviction-and-reference-counts) | Which cached tokens go when memory is short, and how are the paths of running requests protected? | not started |
| 06 | [Cache-aware scheduling and the DFS theorem](/notes/papers/llm-serving/2023-sglang-radixattention/06-cache-aware-scheduling) | Why does the order of requests change the hit rate, and why is depth-first order optimal? | not started |
| 07 | [Frontend hints and multi-GPU RadixAttention](/notes/papers/llm-serving/2023-sglang-radixattention/07-frontend-hints-and-multi-gpu) | How does the program help the cache, and how does the cache work with tensor and data parallelism? | not started |
| 08 | [The rest of SGLang](/notes/papers/llm-serving/2023-sglang-radixattention/08-the-rest-of-sglang) | What are the language, the compressed finite state machine and API speculative execution? | not started |
| 09 | [Results](/notes/papers/llm-serving/2023-sglang-radixattention/09-results) | What did the paper measure, and what is the source of each number? | not started |
| 10 | [RadixAttention in SGLang today](/notes/papers/llm-serving/2023-sglang-radixattention/10-radixattention-in-sglang-today) | How does the code of SGLang 0.5.22 implement the tree, and what changed since the paper? | not started |
| 11 | [Limits and later work](/notes/papers/llm-serving/2023-sglang-radixattention/11-limits-and-later-work) | What does RadixAttention leave open, and what came after it? | not started |
| 12 | [Reproduce it](/notes/papers/llm-serving/2023-sglang-radixattention/12-reproduce-it) | How do I rebuild the radix cache, its eviction and its scheduler myself? | not started |

Pages 01 and 02 give the background on data structures and on prefix sharing. These notes do not repeat the background on the KV cache and on PagedAttention. If these ideas are new to you, read [03 The KV cache](/notes/ai/llm-systems/03-kv-cache) and [PagedAttention (2023)](/notes/papers/llm-serving/2023-pagedattention) first. [L9: Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) explains vLLM's hash chain, the other common design. Pages 04, 05 and 06 are the core of the paper. Page 10 needs page 04.

## Conventions

Every figure and animation for this paper uses these colors.

| Color | In figures and diagrams |
|---|---|
| Green `#2D6A4F` | A cached node that the current request does not touch: stored KV |
| Blue `#1E6091` | A node that the current request matches and reuses: a cache hit |
| Gold `#B8860B` | A node that is computed and inserted now: new KV, prefill work |
| Red `#C81D25`, dashed | An evicted node, waste, recomputation, starvation, an attack |
| Gray `#8A8A8A`, dashed | Free KV pool slots and transient things |
| Purple `#6A4C93` | The program side: the SGLang language, the frontend, the router |
| Ink `#100D12` | Text, arrows and tensors. A thick ink border and a label `ref=N` mark a node with a reference count above zero. |

The paper's Figure 3 uses other colors (green for new nodes, blue for accessed nodes, red for evicted nodes). These notes use the legend above on every page. A plot has no legend, so each plot names the meaning of its colors in its title.

- **The running example.** Pages 04 to 07 and 12 share one example of nine steps. It has two chats, a few-shot batch and self-consistency samples in a KV pool of 80 token slots. The order of the events follows the paper's Figure 3. The token counts and the pool size are choices of these notes, and a simulator checked every number. Its hit rate is 152 of 236 prompt tokens, about 64.4%.
- **The last prompt token.** The paper's model can match a whole prompt. SGLang 0.5.22 stops every match one token before the end of the prompt. The first output token needs the logits of the last prompt token. Pages 04, 06 and 12 show what this changes in the running example.
- **Exact and approximate.** Numbers from the text and the tables of the paper are exact. The bars of Figures 5 to 8, 12 and 13 print no values, so these notes give no readings from them. A rounded or estimated number has "about" or $\approx$.
- **§ signs** refer to the sections of the paper. "Algorithm 1" and "Theorem 3.1" are the paper's names.
- **Units.** KiB, MiB and GiB are binary units ($2^{10}$, $2^{20}$, $2^{30}$ bytes). KB, MB and GB are decimal units.
- Each page labels three kinds of statements. They are what the paper states, what SGLang 0.5.22 does (with the source file), and the interpretation of these notes.

## Media

| File | What it shows | Page |
|---|---|---|
| `figures/overview.svg` | The paper at a glance: the problem, the radix tree idea, five mechanisms, the result and the later work | this card |
| `figures/01-trie-vs-radix-tree.svg` | Three token sequences as a trie with nine nodes and as a radix tree with five nodes | 01 |
| `figures/01-split-on-insert.svg` | The insert of `[1, 2, 9]` splits one edge and its slot list in two | 01 |
| `figures/02-four-sharing-patterns.svg` | Token bars of the four sharing patterns, with shared parts in blue and unique parts in gold | 02 |
| `figures/02-redundant-prefill.svg` | One bar per pattern: the tokens that need prefill and the redundant tokens | 02 |
| `figures/03-three-inefficiencies.svg` | The three inefficiencies of LM programs and the SGLang technique that answers each | 03 |
| `figures/03-design-questions.svg` | Automatic KV reuse divided into five design questions and seven requirements | 03 |
| `figures/04-cpu-tree-gpu-pool.svg` | Tree nodes on the CPU that refer to their slot ranges in an 80-slot GPU pool | 04 |
| `figures/04-request-lifecycle.svg` | The life of one request: match, lock, allocate, compute, insert, unlock | 04 |
| `figures/04-nine-steps.svg` | The nine trees of the running example, with hits, new nodes, evictions and the pool | 04 |
| `figures/05-leaves-first.svg` | Leaf-first eviction against the orphans that evicting a parent would leave | 05 |
| `figures/05-reference-counts.svg` | A locked path with reference count 4, the lock deltas, and the pool before and after eviction | 05 |
| `figures/05-eviction-heap.svg` | The step-8 eviction heap: C2.2 and then C2.1 are popped, and the free slots grow from 1 to 37 | 05 |
| `figures/06-fcfs-vs-lpm.svg` | Six requests in arrival order and in longest-shared-prefix-first order: hit rate 0 against 400 of 660 | 06 |
| `figures/06-algorithm-1.svg` | Algorithm 1 as a flow chart, with its two printed gaps marked | 06 |
| `figures/06-dfs-order.svg` | A request tree with its DFS visit order, beside the computed tokens of all 24 orders | 06 |
| `figures/07-frontend-hint.svg` | A fork of three without and with the hint: the 500-token prefix computed three times or once | 07 |
| `figures/07-tp-same-tree.svg` | Two tensor-parallel ranks with the same tree, where one slot holds different heads of one token | 07 |
| `figures/07-router-meta-tree.svg` | A router's meta-tree that labels each prefix with its workers and learns of an eviction late | 07 |
| `figures/07-routing-decision.svg` | The cache-aware routing decision with the five cases of the worked example | 07 |
| `figures/08-compressed-fsm.svg` | A character FSM for a JSON prefix and its compressed FSM with three compressed edges | 08 |
| `figures/08-api-speculation.svg` | Three API calls that each resend the context, against one call whose extra output fills all fields | 08 |
| `figures/08-image-key.svg` | The same image gives the same pad values and a long match, another image does not | 08 |
| `figures/09-setup-map.svg` | The eleven workloads, the models and GPUs, the baselines and the metrics | 09 |
| `figures/09-printed-numbers.svg` | Every number that the paper prints, from the 6.4x headline to Table 2 | 09 |
| `figures/10-code-map.svg` | Ten paper concepts and the class, method or field of SGLang 0.5.22 that implements each | 10 |
| `figures/10-page-alignment.svg` | A 50-token prompt with pages of 16 tokens: what is stored, reused and computed | 10 |
| `figures/10-hicache-tiers.svg` | Two server instances with private GPU and host tiers above one shared storage tier | 10 |
| `figures/11-limits-map.svg` | Ten limits of RadixAttention, each with the later work that addresses it | 11 |
| `figures/11-later-work-timeline.svg` | The later work from December 2023 to October 2026 in six lanes | 11 |
| `figures/12-lab-map.svg` | The seven labs and which lab builds on which | 12 |
| `figures/12-hit-rate-vs-cache.svg` | Measured hit rate against cache size for FCFS, LPM and DFS | 12 |
| `manim/r01-trie-to-radix-tree.mp4` | A trie collapses into a radix tree, and an insert splits an edge and its slot list | 01 |
| `manim/r02-nine-steps.mp4` | The nine steps of the running example, with the tree and the 80-slot pool | 04 |
| `manim/r03-lru-leaf-eviction.mp4` | The step-8 eviction: locked path, the heap of leaves, C2.2 and C2.1 evicted | 05 |
| `manim/r04-fcfs-vs-dfs-order.mp4` | The same six requests in arrival order and in longest-shared-prefix-first order | 06 |
| `manim/r05-cache-aware-router.mp4` | A router with one approximate tree per worker, cache affinity and the switch to the shortest queue | 07 |
| `manim/r06-compressed-fsm-jump-forward.mp4` | Singular edges merged into compressed edges, and decoding that jumps over forced text | 08 |

All media is in `/notes/media/papers/2023-sglang-radixattention/`.

## Source

The paper is on [arXiv](https://arxiv.org/abs/2312.07104) and in the [NeurIPS 2024 proceedings](https://proceedings.neurips.cc/paper_files/paper/2024/hash/724be4472168f31ba1c9ac630f15dec8-Abstract.html). These notes do not copy the figures of the paper. Their numbers are from the text and the tables of the paper, from the SGLang 0.5.22 source, or computed in these notes.
