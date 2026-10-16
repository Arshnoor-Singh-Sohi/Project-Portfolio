---
title: "00 The paper on one page"
order: 0
summary: "The claim, the system, the key numbers, the mechanisms, the later work and the interview answer of the PagedAttention paper, on one page for revision and teaching."
status: not-started
tags: [summary, pagedattention, vllm, kv-cache, llm-serving, interview]
---

## 1. The claim

An LLM server keeps the key and value vectors of every earlier token in GPU memory: the **KV cache**. Earlier serving systems stored the KV cache of each request in one contiguous chunk, reserved for the maximum length. The paper measured that "only 20.4% - 38.2% of the KV cache memory is used to store the actual token states in the existing systems" (§1). PagedAttention is "an attention algorithm inspired by the classical virtual memory and paging techniques in operating systems" (Abstract). On top of it, vLLM gets "near-zero waste in KV cache memory" and "flexible sharing of KV cache within and across requests" (Abstract). The result: vLLM "improves the throughput of popular LLMs by 2-4× with the same level of latency" (Abstract).

## 2. The system in five lines

1. **Blocks (§4.1).** The KV cache of each sequence is cut into KV blocks of $B$ tokens, 16 by default. A block can be anywhere in a pool of GPU memory.
2. **Block tables (§4.2).** Each request has a block table that maps its logical blocks to physical blocks, with the number of filled slots. The attention kernel reads the blocks through the table.
3. **Allocation on demand (§4.3).** At prefill, vLLM allocates only the blocks of the prompt. In decode, it takes a new block only when the last block is full.
4. **Sharing (§4.4).** Each physical block has a reference count. Samples, beams and shared prefixes map to the same blocks, and a shared partial block is copied before a write (copy-on-write).
5. **Preemption and many GPUs (§4.5, §4.6).** When no block is free, vLLM evicts all blocks of the latest request. It swaps them to CPU memory or recomputes them later. One central KV cache manager sends the same block tables to every GPU worker.

![Request A after step 3: its logical blocks, its block table and nine physical blocks, with data only in blocks 7, 1 and 3](/notes/media/papers/2023-pagedattention/figures/05-block-table.svg)

## 3. The picture to remember

The figure above is the block table of the paper's example (§4.3, Figure 6). The block size is 4, and the prompt "Four score and seven years ago our" has 7 tokens. Its two logical blocks map to physical blocks 7 and 1. The ninth token, "brought", needs a third block, and the manager gives it physical block 3. The address of any token follows the arithmetic of a page table:

$$
\text{slot} = \text{table}\left[\lfloor p / B \rfloor\right] \times B + (p \bmod B)
$$

For position $p = 8$ (counted from 0): logical block $\lfloor 8/4 \rfloor = 2$, physical block 3, slot $3 \times 4 + 0 = 12$.

Now compare the memory that one request holds over its life. The request below has a 161-token prompt and 338 output tokens, about the ShareGPT means. The numbers are computed in these notes (page 03).

```plot
{
  "title": "One request with a 161-token prompt and 338 output tokens: slots that hold tokens (blue), slots held in 16-token blocks (gold), slots reserved by Orca (Max) (red)",
  "xAxis": { "label": "output tokens generated so far", "domain": [0, 350] },
  "yAxis": { "label": "KV cache slots", "domain": [0, 2200] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 2048], [338, 2048]], "fnType": "points", "graphType": "polyline", "color": "#C81D25" },
    { "points": [[0, 2048], [338, 2048]], "fnType": "points", "graphType": "scatter", "color": "#C81D25" },
    { "points": [[0, 176], [50, 224], [100, 272], [150, 320], [200, 368], [250, 416], [300, 464], [338, 512]], "fnType": "points", "graphType": "polyline", "color": "#B8860B" },
    { "points": [[0, 176], [50, 224], [100, 272], [150, 320], [200, 368], [250, 416], [300, 464], [338, 512]], "fnType": "points", "graphType": "scatter", "color": "#B8860B" },
    { "points": [[0, 161], [50, 211], [100, 261], [150, 311], [200, 361], [250, 411], [300, 461], [338, 499]], "fnType": "points", "graphType": "polyline", "color": "#1E6091" },
    { "points": [[0, 161], [50, 211], [100, 261], [150, 311], [200, 361], [250, 411], [300, 461], [338, 499]], "fnType": "points", "graphType": "scatter", "color": "#1E6091" }
  ]
}
```

The red line is a reservation for the maximum length of 2048 tokens: it is held from the first step to the last. The gold line grows one block at a time, and it is never more than 15 slots above the blue line. The space between red and blue is the waste that PagedAttention removes.

## 4. Ten numbers

| Number | Meaning |
|---|---|
| 800 KiB | KV cache of one OPT-13B token: $2 \times 5120 \times 40 \times 2 = 819{,}200$ bytes (§3). The paper writes "800 KB". |
| 1.5625 GiB | KV cache of one 2048-token OPT-13B request. The paper writes "1.6 GB" (§3). |
| 15.7K | KV cache slots of OPT-13B on one A100 40 GB, with 12 GiB for the KV cache (Table 1). Only 7 reservations of 2048 slots fit. |
| 20.4% to 38.2% | Share of KV memory that holds token states in the three Orca versions (§1, Figure 2) |
| 96.3% | The same share for vLLM, so the waste is under 4% (Figure 2) |
| 16 | The default block size $B$. On ShareGPT, sizes 16 to 128 performed best (§7.2). |
| 30.42, 13.62, 7.00 | Mean batched requests of OPT-13B on ShareGPT at 2 req/s: vLLM, Orca (Oracle), Orca (Max) (Figure 13) |
| 2-4× | Throughput at the same latency against FasterTransformer and Orca (Abstract). On ShareGPT: 1.7×–2.7× against Orca (Oracle), 2.7×–8× against Orca (Max), up to 22× against FasterTransformer (§6.2). |
| 20–26% | Higher latency of the attention kernel than the FasterTransformer kernel (§7.1) |
| 6.1% to 9.8% and 37.6% to 55.2% | Memory saved by sharing on Alpaca with OPT-13B: parallel sampling and beam search with 2 to 6 sequences (Figure 15) |

The 1.5625 GiB and the "7 reservations" are computed in these notes (page 03). Orca (Oracle) knows every output length in advance, which no real system can do. So the 1.7×–2.7× against it is the fairest comparison (page 09).

## 5. The mechanisms

| Mechanism | What it does | Paper | Page |
|---|---|---|---|
| Block-wise attention | Computes Equation 4: attention as a sum over blocks, with one softmax denominator over all blocks. The result is exact. | §4.1 | [04](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm) |
| Block table | Maps logical blocks to physical blocks, with "# filled". The slot of position $p$ is table$[\lfloor p/B \rfloor] \times B + p \bmod B$. | §4.2 | [05](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager) |
| Allocation on demand | A new block only when the last block is full. At most $B - 1$ empty slots per sequence. | §4.3 | [05](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager) |
| Reference counts and copy-on-write | Sequences share blocks. A write into a shared partial block copies that one block first. | §4.4 | [06](/notes/papers/llm-serving/2023-pagedattention/06-decoding-scenarios-and-sharing) |
| All-or-nothing preemption | First-come-first-serve. The latest request loses all its blocks, which are swapped to CPU memory or recomputed later. | §4.5 | [07](/notes/papers/llm-serving/2023-pagedattention/07-scheduling-and-preemption) |
| One central manager | Every GPU worker stores the same block IDs for its own attention heads, so one block table serves all workers. | §4.6 | [07](/notes/papers/llm-serving/2023-pagedattention/07-scheduling-and-preemption) |
| Three custom kernels | A fused reshape and block write, the paged attention kernel with one warp per block, and a fused block copy. | §5.1 | [08](/notes/papers/llm-serving/2023-pagedattention/08-implementation) |
| fork, append, free | The three methods that express parallel sampling, beam search and shared prefixes. | §5.2 | [08](/notes/papers/llm-serving/2023-pagedattention/08-implementation) |

> [!note] Prefill and decode use different attention kernels
> In the paper, the prompt does not use PagedAttention. "In the prefill step, vLLM generates the KV cache of the prompts and the first output token with a conventional self-attention algorithm (e.g., [13])" (§4.3). Reference [13] is FlashAttention. The decode steps then read the cache with PagedAttention: "vLLM generates the new token with the PagedAttention algorithm on physical blocks 7 and 1" (§4.3). The vLLM v0.2.0 code of that time used xFormers for the prompt step (page 08). Later kernels, for example FlashAttention 2.5 and FlashInfer, read paged caches in prefill and in decode (page 10).

## 6. What came after

Page 10 gives every item with its date and source. In short:

| Year | Work | What it adds |
|---|---|---|
| 2023 | SGLang with RadixAttention | A radix tree of token prefixes for KV reuse across requests |
| 2023, 2024 | Splitwise, DistServe, Mooncake | Prefill and decode on different GPUs, with the KV cache sent between them |
| 2024 | Sarathi-Serve | Chunked prefills: long prompts run in chunks, so running decodes do not stall |
| 2024 | Automatic prefix caching in vLLM 0.4.0 | Chained block hashes find cached full blocks for any request |
| 2024 | FlashAttention 2.5, and FlashInfer in 2025 | General attention kernels that read paged KV caches |
| 2024 | vAttention | Paging by the CUDA driver, so the kernel sees contiguous virtual memory |
| 2025 | vLLM V1 engine | A new engine core, prefix caching on by default |
| 2025 | LMCache | A KV cache layer outside the engine, in CPU memory or storage |

In vLLM 0.31.0 (checked on 2026-10-15), the default block size is still 16, prefix caching and chunked prefill are on by default, and preemption recomputes. The paper's own kernel is history: the vLLM documentation calls its design page "a historical document".

## 7. What to say in an interview

The interviewer asks: "Tell me about a paper you read." Then he asks in depth about the KV cache, its formula, its implementation and attention. Prepare two versions. End each one at a point that opens those topics.

### 7.1 The 2-minute version

> I read "Efficient Memory Management for Large Language Model Serving with PagedAttention". Kwon and colleagues from UC Berkeley, Stanford and UC San Diego published it at SOSP 2023. It is the paper behind vLLM.
>
> The problem is GPU memory during serving. To generate a token, every layer compares the new token's query with the keys of all earlier tokens and mixes their values. So a server keeps those keys and values in GPU memory: the KV cache. It is large. For OPT-13B it is 800 KiB per token, so a 2048-token request can need about 1.6 GB.
>
> Before vLLM, systems such as FasterTransformer and Orca reserved one contiguous chunk per request for the maximum length, because the output length is unknown. The paper measured that only 20.4% to 38.2% of the KV memory held real tokens. The rest was reservation and fragmentation. Decode is memory-bound, so throughput grows with the batch size, and this waste limited the batch.
>
> The fix is an idea from operating systems. PagedAttention cuts the KV cache into blocks of 16 tokens that can sit anywhere in GPU memory. Each request has a block table, like a page table. The attention kernel reads the blocks through the table, and the result is exactly normal attention. A new block is allocated only when the last one is full, so each request wastes less than one block. Blocks are shared with reference counts and copy-on-write, for parallel sampling, beam search and shared prompts. When memory is full, vLLM preempts the newest request and swaps or recomputes its blocks.
>
> The result: the waste falls under 4%, and batches are about 2 to 4 times larger. Throughput is 2 to 4 times higher than FasterTransformer and Orca at the same latency. Paged KV caches are now standard in vLLM, SGLang, TensorRT-LLM and FlashAttention.

### 7.2 The 30-second version

> PagedAttention is the SOSP 2023 paper behind vLLM. A server keeps a KV cache, the keys and values of all earlier tokens, in GPU memory. Older systems reserved one contiguous chunk per request for the maximum length, and only 20% to 38% of that memory held tokens. PagedAttention stores the cache in blocks of 16 tokens with a block table per request, like paging in an operating system. The waste falls under 4%, batches grow, and throughput rises 2 to 4 times at the same latency.

### 7.3 Bridge sentences for the follow-up questions

Each follow-up has a first sentence that links the question to the paper. Say it, then continue with the page in the last column.

| Follow-up | Bridge sentence | Study next |
|---|---|---|
| "What is the KV cache?" | "In a decode step, the keys and values of earlier tokens do not change, so the model stores them once per layer and computes only the new token's key and value. That store is the KV cache, and PagedAttention manages its memory." | [L1: Why the KV cache exists](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists), [L2: Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) |
| "What is its formula?" | "Per token, it is 2 times layers times KV heads times head size times bytes per number. For OPT-13B that is 819,200 bytes, the paper's 800 KB." | [L3: The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula), [03](/notes/papers/llm-serving/2023-pagedattention/03-the-question) |
| "How is it implemented?" | "A simple cache is a preallocated tensor per layer with a write at position $t$. vLLM replaces it with a pool of blocks per layer, a block table per request, and a slot mapping for each new token." | [L4: Implementing a KV cache](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache), [05](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager), [08](/notes/papers/llm-serving/2023-pagedattention/08-implementation) |
| "What is attention?" | "Attention scores the query against every key, applies softmax to the scores divided by the square root of the head size, and mixes the values with those weights. PagedAttention computes the same sum block by block." | [L3: Scaled dot-product attention, step by step](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention), [04](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm) |
| "Why does memory limit throughput?" | "A decode step reads all weights once for the whole batch, so more requests per step give more tokens per second. The KV cache decides how many requests fit." | [L3: Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound), [09](/notes/papers/llm-serving/2023-pagedattention/09-results) |
| "What came after?" | "The block became the unit for everything after it: prefix caching, chunked prefill, disaggregation and offloading all move or reuse blocks." | [10](/notes/papers/llm-serving/2023-pagedattention/10-limits-and-later-work), [L9: Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |

> [!example] Worked example: the numbers to say for "What is attention?"
> Use the toy example of the guide. The decode step for "down" has the query $q_4 = [1, 2]$ and four cached keys. The raw scores are $[1, 4, 2, 3]$, and after division by $\sqrt{2}$ and softmax the weights are $[0.0646, 0.5388, 0.1310, 0.2657]$. The output is $o_4 = [1.6034, 2.3302]$. With two blocks of 2 tokens, the block totals of the exponentials are 18.9469 and 12.4554. Their sum, 31.4023, is the shared denominator, and the output is again $[1.6034, 2.3302]$ (page 04).

## 8. One-minute explanation

An LLM server stores the keys and values of all earlier tokens of each request in GPU memory, the KV cache. For OPT-13B, that is 800 KiB per token, so the cache decides how many requests fit at once. Earlier systems reserved one contiguous chunk per request for the maximum length, and only 20.4% to 38.2% of their KV memory held real tokens. PagedAttention borrows paging from operating systems. The cache is split into blocks of 16 tokens, and a block table per request maps logical blocks to physical blocks anywhere in memory. The attention kernel reads the blocks through the table and computes exactly normal attention. The prompt itself runs with a conventional kernel, and PagedAttention serves the decode steps. Blocks are allocated only when needed, shared with reference counts and copy-on-write, and evicted per request when memory is full. The waste falls under 4%, and the mean batch on OPT-13B grows to about 30 requests, against 7 to 14 for Orca. Throughput rises 2 to 4 times at the same latency. The kernel is 20% to 26% slower, but the larger batch more than pays for it.

## 9. Check questions

```check
{
  "question": "State the problem of the paper and its fix in two or three sentences.",
  "answer": "Earlier serving systems reserved one contiguous chunk of KV cache memory per request, sized for the maximum length. Only 20.4% to 38.2% of that memory held token states. PagedAttention stores the KV cache in fixed-size blocks anywhere in GPU memory, with a block table per request. It allocates a block only when the last block is full. The waste falls to under 4%, more requests fit in one batch, and throughput rises 2 to 4 times at the same latency."
}
```

```check
{
  "question": "Why is the method called *paged* attention? Map four operating system ideas to their counterparts in vLLM.",
  "hint": "Blocks, tokens and requests. Which OS object matches each one?",
  "answer": "The paper takes the idea of virtual memory and paging from operating systems. In its words: \"one can think of blocks as pages, tokens as bytes, and requests as processes\" (§1).\n\n| Operating system | vLLM |\n|---|---|\n| page | logical KV block of $B$ tokens |\n| frame | physical KV block in GPU memory |\n| page table | block table of a request |\n| allocation on demand | a new block only when the last block is full |\n| copy-on-write after `fork` | copy-on-write of a shared block, with reference counts |\n| swap to disk | swap blocks to CPU memory |\n\nTwo differences: the attention kernel translates in software, not in hardware. And a dropped KV block can be recomputed from the tokens, which an operating system cannot do with a page."
}
```

```check
{
  "question": "OPT-13B on one A100 40 GB has 12 GiB for the KV cache. How many token slots is that, and how many 2048-token reservations fit? Show the arithmetic.",
  "hint": "Key and value, hidden size, layers, bytes per FP16 number.",
  "answer": "Bytes per token: $2 \\times 5120 \\times 40 \\times 2 = 819{,}200$ (800 KiB). Slots: $12 \\times 2^{30} / 819{,}200 = 15{,}728.6$, the 15.7K of Table 1. Reservations of 2048 slots: $15{,}728.6 / 2048 \\approx 7.68$, so only 7 whole requests. This matches the 7.00 batched requests of Orca (Max) in Figure 13."
}
```

```check
{
  "question": "Interview follow-up: Derive the KV cache size formula per token. Compute it for OPT-13B and for Llama-3.1-8B, and say why the two results differ by a factor of 6.25.",
  "hint": "Two vectors per layer per token. How many numbers in each, and how many bytes per number?",
  "answer": "Each layer stores one key vector and one value vector per token. Each vector has $H_{kv} \\times d_h$ numbers of $s$ bytes. So:\n\n$$\\text{bytes per token} = 2 \\times L \\times H_{kv} \\times d_h \\times s$$\n\nOPT-13B: $2 \\times 40 \\times 40 \\times 128 \\times 2 = 819{,}200$ bytes (800 KiB). Llama-3.1-8B: $2 \\times 32 \\times 8 \\times 128 \\times 2 = 131{,}072$ bytes (128 KiB). Ratio: $819{,}200 / 131{,}072 = 6.25$. Llama-3.1-8B has fewer layers (32 against 40) and grouped-query attention: 8 KV heads instead of 40. The cache of one request is the bytes per token times its length. 2048 tokens of OPT-13B need $1{,}677{,}721{,}600$ bytes, which is 1.5625 GiB: the paper's \"1.6 GB\"."
}
```

```check
{
  "question": "Interview follow-up: A request has the block table [7, 1, 3] and the block size is 4. Where are the key and value of position 8 (counted from 0)? What happens to the block table at the next token, and at position 12?",
  "hint": "Divide by the block size, read the table, multiply back.",
  "answer": "Logical block $\\lfloor 8/4 \\rfloor = 2$, offset $8 \\bmod 4 = 0$. The table maps logical block 2 to physical block 3. Slot $= 3 \\times 4 + 0 = 12$. The kernel reads the key and value of position 8 from physical block 3, slot 0, in every layer.\n\nPositions 9, 10 and 11 fill slots 1 to 3 of block 3, and only \"# filled\" changes. Position 12 starts logical block 3. Block 3 is full, so the KV cache manager takes the next free physical block and adds a fourth row to the table. So a request never holds more than $B - 1 = 3$ empty slots."
}
```

```check
{
  "question": "Interview follow-up: Is PagedAttention an approximation of attention? Write the block-wise form, and say which attention vLLM runs for the prompt in the paper.",
  "hint": "What is shared by all blocks in the softmax?",
  "answer": "It is exact. Equation 4 of §4.1 groups the same sum by blocks:\n\n$$A_{ij} = \\frac{\\exp(q_i^\\top K_j/\\sqrt{d})}{\\sum_{t=1}^{\\lceil i/B\\rceil} \\exp(q_i^\\top K_t \\mathbf{1}/\\sqrt{d})}, \\qquad o_i = \\sum_{j=1}^{\\lceil i/B\\rceil} V_j A_{ij}^\\top$$\n\nThe denominator is one total over all blocks, so each weight equals the normal softmax weight. Take the decode of \"down\" with $B = 2$. The block totals are 18.9469 and 12.4554, and the denominator is 31.4023. The output is $[1.6034, 2.3302]$, the normal result.\n\nFor the prompt, vLLM uses \"a conventional self-attention algorithm (e.g., [13])\" (§4.3), where [13] is FlashAttention. PagedAttention reads the cache in the decode steps."
}
```

```check
{
  "question": "Interview follow-up: The PagedAttention kernel is 20% to 26% slower than the FasterTransformer kernel. Why is vLLM still 2 to 4 times faster?",
  "answer": "The overhead comes from reading the block table, extra branches and variable sequence lengths (§7.1). It affects only the attention operator, not the linear layers. Decode is memory-bound: one step reads all weights once for the whole batch. So the tokens per step grow almost in proportion to the batch size. Paging lets vLLM batch 30.42 requests on OPT-13B with ShareGPT, against 13.62 for Orca (Oracle) and 7.00 for Orca (Max) (Figure 13). A slightly slower step that carries 2.2 to 4.3 times more requests gives far more tokens per second."
}
```

```check
{
  "question": "Name four later works or features that build on PagedAttention, with the year and what each one adds.",
  "answer": "Any four, for example:\n\n1. SGLang with RadixAttention (2023): a radix tree of token prefixes for KV reuse across requests.\n2. Automatic prefix caching in vLLM 0.4.0 (2024): chained block hashes find cached full blocks.\n3. Sarathi-Serve (2024) and chunked prefill: long prompts run in chunks, so decodes do not stall.\n4. DistServe (2024), Splitwise (2023) and Mooncake (2024): prefill and decode on different GPUs, with KV transfer.\n5. vAttention (2024): paging by the CUDA driver, so the kernel sees contiguous memory.\n6. vLLM V1 (2025): a new engine core with prefix caching on by default.\n7. FlashAttention 2.5 (2024) and FlashInfer (2025): kernels that read paged KV caches."
}
```


## 10. Links

- [PagedAttention (2023)](/notes/papers/llm-serving/2023-pagedattention): the paper card and the reading order
- Start the details: [01 Background: virtual memory and paging](/notes/papers/llm-serving/2023-pagedattention/01-background-virtual-memory-and-paging)
- The problem in numbers: [03 The question: where does KV cache memory go?](/notes/papers/llm-serving/2023-pagedattention/03-the-question)
- The algorithm: [04 PagedAttention: the algorithm](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm)
- The interview chain: [L1: Drill: from attention to PagedAttention](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention)
- The background in the subject: [L3: Scaled dot-product attention, step by step](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) and [03 The KV cache](/notes/ai/llm-systems/03-kv-cache)
- The terms: [Glossary](/notes/papers/glossary)

### Sources

- Kwon et al., "Efficient Memory Management for Large Language Model Serving with PagedAttention", SOSP 2023, arXiv 2309.06180: https://arxiv.org/abs/2309.06180 (Abstract, §1, §3, §4, §5, §6, §7, Table 1, Figures 2, 6, 13 and 15, checked on 2026-10-15)
- vLLM repository and documentation: https://github.com/vllm-project/vllm (checked on 2026-10-15)
