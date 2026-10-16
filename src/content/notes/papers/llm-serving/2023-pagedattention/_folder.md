---
title: "PagedAttention (2023)"
order: 2023
summary: "How vLLM stores the KV cache in fixed-size blocks with a block table per request, like pages in an operating system, and so serves 2 to 4 times more requests at the same latency."
---

## The paper

| Field | Value |
|---|---|
| Title | Efficient Memory Management for Large Language Model Serving with PagedAttention |
| Authors | Woosuk Kwon, Zhuohan Li, Siyuan Zhuang, Ying Sheng, Lianmin Zheng, Cody Hao Yu, Joseph E. Gonzalez, Hao Zhang, Ion Stoica. Kwon and Li made an equal contribution. |
| Institutions | UC Berkeley, Stanford University, Independent Researcher, UC San Diego |
| First version | [arXiv 2309.06180](https://arxiv.org/abs/2309.06180), 12 September 2023, categories cs.LG and cs.DC |
| Version in these notes | arXiv version 1, 12 September 2023. It was the only version on 15 October 2026. |
| Published | SOSP '23, the ACM Symposium on Operating Systems Principles, October 23 to 26, 2023, Koblenz, Germany. DOI [10.1145/3600006.3613165](https://doi.org/10.1145/3600006.3613165) |
| Code | [github.com/vllm-project/vllm](https://github.com/vllm-project/vllm), Apache-2.0 license (checked on 15 October 2026). These notes examine vLLM v0.2.0 (2023-09-28), the release of the same period, and vLLM v0.31.0 (2026-10-05). |

## The result in three sentences

1. Earlier serving systems kept the KV cache of each request in one contiguous chunk, reserved for the maximum length. Only 20.4% to 38.2% of their KV cache memory held token states (Figure 2).
2. PagedAttention stores the KV cache in fixed-size **blocks** anywhere in GPU memory, with a **block table** per request. The blocks and the tables work like pages and page tables in an operating system. vLLM allocates blocks on demand, shares them with reference counts and copy-on-write, and preempts whole requests when no block is free.
3. The waste falls to under 4%, so about 2.2 to 4.3 times more requests run in one batch on OPT-13B. vLLM serves 2 to 4 times the throughput of FasterTransformer and Orca at the same latency.

![The paper at a glance: the problem, the idea, the mechanisms, the result and the later work](/notes/media/papers/2023-pagedattention/figures/overview.svg)

## Reading order

| # | Page | The question it answers | Status |
|---|---|---|---|
| 00 | [The paper on one page](/notes/papers/llm-serving/2023-pagedattention/00-paper-on-one-page) | What must I remember, and how do I present the paper in an interview? | not started |
| 01 | [Background: virtual memory and paging](/notes/papers/llm-serving/2023-pagedattention/01-background-virtual-memory-and-paging) | What do pages, frames and a page table do in an operating system, and why is the method called "paged"? | not started |
| 02 | [Background: LLM serving before vLLM](/notes/papers/llm-serving/2023-pagedattention/02-background-llm-serving-before-vllm) | How did FasterTransformer and Orca batch requests and store the KV cache? | not started |
| 03 | [The question: where does KV cache memory go?](/notes/papers/llm-serving/2023-pagedattention/03-the-question) | How large is the KV cache, where is it wasted, and why does the waste limit throughput? | not started |
| 04 | [PagedAttention: the algorithm](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm) | How does attention read keys and values from scattered blocks, and why is the result exact? | not started |
| 05 | [The KV cache manager and block tables](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager) | How does vLLM map logical blocks to physical blocks, allocate them on demand and free them? | not started |
| 06 | [Sharing: parallel sampling, beam search and shared prefixes](/notes/papers/llm-serving/2023-pagedattention/06-decoding-scenarios-and-sharing) | How do reference counts and copy-on-write let several sequences share blocks? | not started |
| 07 | [Scheduling, preemption and distributed execution](/notes/papers/llm-serving/2023-pagedattention/07-scheduling-and-preemption) | What happens when no block is free, and how does one block manager serve many GPUs? | not started |
| 08 | [Implementation: the vLLM system and its kernels](/notes/papers/llm-serving/2023-pagedattention/08-implementation) | Which parts are Python and which are CUDA kernels, and why is the block size 16? | not started |
| 09 | [Results](/notes/papers/llm-serving/2023-pagedattention/09-results) | What did the paper measure, and what is the source of each number of the 2-4× claim? | not started |
| 10 | [Limits and later work](/notes/papers/llm-serving/2023-pagedattention/10-limits-and-later-work) | What did the paper leave open, and what came after it? | not started |
| 11 | [Reproduce it](/notes/papers/llm-serving/2023-pagedattention/11-reproduce-it) | How do I rebuild the core of PagedAttention myself? | not started |

Pages 01 and 02 give the background on operating systems and on serving. These notes do not repeat the background on attention and the KV cache. Page 04 and part 03 of the LLM Systems Deep Dive subject explain it. If these ideas are new to you, read [L3: Scaled dot-product attention, step by step](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) and [03 The KV cache](/notes/ai/llm-systems/03-kv-cache) before page 04. Page 05 needs page 01. Page 09 needs the baselines of page 02.

## Conventions

Every figure and new animation for this paper uses these colors.

| Color | In figures and diagrams |
|---|---|
| Blue `#1E6091` | Query vectors and the requesting side: a client, a request |
| Gold `#B8860B` | Key vectors, compute and hardware: the GPU |
| Purple `#6A4C93` | Value vectors and the serving side |
| Green `#2D6A4F` | Stored state: KV blocks, block tables, the KV cache. Only in figures and videos, never in plots. |
| Red `#C81D25` | Waste, fragmentation, errors, eviction, and a recomputation that costs time |
| Gray `#8A8A8A`, dashed outlines | Free blocks, unused memory and transient things |
| Ink `#100D12` | Ordinary text, tensors and arrows |

A plot has no legend. So each plot names the meaning of its colors in its title. Plots use only blue, red, gold, purple and ink.

- **Units.** These notes write KiB, MiB and GiB for binary units ($2^{10}$, $2^{20}$, $2^{30}$ bytes) and KB, MB and GB for decimal units. The paper writes "KB" and "GB" for both.
- **"800 KB" is 800 KiB.** One token of OPT-13B needs $2 \times 5120 \times 40 \times 2 = 819{,}200$ bytes, which is exactly 800 KiB.
- **"1.6 GB" is 1.5625 GiB.** A 2048-token request of OPT-13B needs $1{,}677{,}721{,}600$ bytes, which is exactly 1.5625 GiB or about 1.68 GB.
- **"GB" in Table 1 is GiB.** 12 GiB of KV memory gives the printed 15.7K slots. $12 \times 10^9$ bytes would give 14.6K (page 03).
- **Exact and approximate.** Numbers from the text, the tables and the value labels of bars are exact. Some labels of Figure 2 are assigned to their bars by their printed order (page 03). A rounded or estimated number has "about" or $\approx$. The line plots of Figure 12 print no values, so these notes give no readings from them.
- **Equation numbers.** These notes use the printed numbers: Equation 3 is attention for one token, and Equation 4 is the block-wise form. The paper's text calls the per-token formula "Eq. 4" in §2.1 and §4.1 (page 04).
- **Positions.** The paper counts token positions from 1. Code, and pages 01 and 05, count them from 0. Page 04 uses the paper's numbering.
- **§ signs** refer to the sections of the paper. $B$ is the block size, 16 by default.
- Each page labels three kinds of statements. They are what the paper states, what the vLLM code or documentation states (with a version), and the interpretation of these notes.

## Media

| File | What it shows | Page |
|---|---|---|
| `figures/overview.svg` | The paper at a glance: the problem, the idea, the mechanisms, the result and the later work | this card |
| `figures/01-page-table-translation.svg` | A page table changes the page number of a virtual address into a frame number and keeps the offset | 01 |
| `figures/01-os-to-pagedattention-map.svg` | Each operating system idea next to its PagedAttention counterpart, for example a page and a KV block | 01 |
| `figures/02-static-vs-iteration-level.svg` | Four batch slots under static batching and under iteration-level scheduling | 02 |
| `figures/03-memory-budget-and-waste.svg` | The 40 GB budget of the 13B model, and the useful share of KV memory in four systems | 03 |
| `figures/03-three-kinds-of-waste.svg` | A 32-slot pool with reservation, internal and external fragmentation, and 4-slot blocks that fit a new request | 03 |
| `figures/04-blockwise-computation.svg` | The query of "down" scored against two blocks, and the block parts that add to the normal output | 04 |
| `figures/04-block-table-and-pool.svg` | A block table that maps two logical blocks to physical blocks 4 and 1 in a pool of six blocks | 04 |
| `figures/05-block-table.svg` | Request A after step 3: its logical blocks, its block table, and data in physical blocks 7, 1 and 3 | 05 |
| `figures/05-two-requests.svg` | Two requests in one pool: A in blocks 7, 1 and 3, B in blocks 5 and 2, and four free blocks | 05 |
| `figures/06-copy-on-write.svg` | Two samples share blocks 7 and 1, A1 copies block 1 to block 3, and A2 writes in place | 06 |
| `figures/06-beam-search.svg` | The block tree of four beam candidates before and after one step, with the freed and the new blocks | 06 |
| `figures/07-swap-vs-recompute.svg` | Swapping over PCIe to CPU memory, against dropping the blocks and rebuilding them with one prefill | 07 |
| `figures/07-distributed.svg` | One central scheduler sends token IDs and block tables to eight workers that use the same block IDs | 07 |
| `figures/08-architecture.svg` | The vLLM system: clients, the FastAPI frontend, the engine with the scheduler and the KV cache manager, and the GPU workers | 08 |
| `figures/08-kv-layout.svg` | The layout of one key block and one value block for one head, with the index formulas of the block write | 08 |
| `figures/09-batched-requests.svg` | The average number of batched requests of OPT-13B for three Orca variants and vLLM on two traces (Figure 13 labels) | 09 |
| `figures/09-results-summary.svg` | The speedups that the paper states, from 1.3× to 22×, and the kernel overhead of 20% to 26% | 09 |
| `figures/10-limits-map.svg` | Seven limits of the design, each linked to the later work that addresses it | 10 |
| `figures/10-later-work-timeline.svg` | The later work from June 2023 to October 2026, in five lanes | 10 |
| `figures/11-exercise-map.svg` | Ten physical blocks of four slots, a shared block after a fork, and one copy-on-write | 11 |
| `manim/p01-contiguous-allocation-waste.mp4` | Contiguous chunks reserved for the maximum length, their three kinds of waste, and 4-slot blocks that fit the same requests | 03 |
| `manim/p02-attention-block-by-block.mp4` | The query of "down" visits two scattered blocks, adds their totals into one denominator, and gets the normal output | 04 |
| `manim/p03-block-table-filling.mp4` | The block table of request A fills step by step, then request B takes blocks from the same pool | 05 |
| `manim/p04-copy-on-write.mp4` | Two samples share the prompt blocks, the first write copies one block, and the second sample writes in place | 06 |
| `manim/p05-slower-kernel-higher-throughput.mp4` | Why a 20% to 26% slower attention kernel still gives 2 to 4 times the throughput | 09 |

All media is in `/notes/media/papers/2023-pagedattention/`.

## Source

The paper is on [arXiv](https://arxiv.org/abs/2309.06180). The SOSP version has the DOI [10.1145/3600006.3613165](https://doi.org/10.1145/3600006.3613165). These notes do not copy the figures of the paper. Their numbers are from the text, the tables and the bar labels of the paper, or they are computed in these notes.
