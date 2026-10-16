---
title: "10 Limits and later work"
order: 10
summary: "What PagedAttention left open and what came after it, each item with a verified date and source: the vLLM V1 engine, automatic prefix caching with block hashes, RadixAttention, chunked prefill, disaggregated prefill and decode (DistServe, Splitwise, Mooncake), paged kernels in FlashAttention and FlashInfer, vAttention, the hybrid KV cache manager, KV offloading with LMCache, and paged KV caches in TensorRT-LLM and other engines."
status: not-started
tags: [critique, later-work, vllm, prefix-caching, chunked-prefill, disaggregation, kv-offloading, interview]
---

## 1. The question this page answers

An interviewer who hears "PagedAttention" often asks the next question at once: "What came after it?" This page answers that question with dates and sources. It also answers the questions before it. What did the paper not solve? Which limits of its evaluation matter? Which later ideas build on paging, and which ideas replace it?

> [!key] The short answer
> Paging solved fragmentation of KV cache memory inside one GPU. Later work kept the paged block as the basic unit and built on it in four directions:
>
> 1. Reuse KV blocks across requests: prefix caching.
> 2. Schedule prefill and decode better: chunked prefill and disaggregation.
> 3. Move KV blocks to other tiers and machines: offloading and KV transfer.
> 4. Serve new model types: the hybrid KV cache manager.
>
> One line of work, vAttention, removes the paged layout from the kernel and asks the GPU driver to do the paging.

## 2. Mental model

> [!analogy] The first operating system with paging
> The first operating systems with paging solved one problem: programs no longer needed one contiguous piece of physical memory. Later operating systems kept the page and added features on top of it. Shared libraries map one physical copy into many processes. Swap moves cold pages to disk. Huge pages reduce the cost of address translation. PagedAttention is the first step for KV cache memory. Prefix caching is the shared library, offloading is the swap, and vAttention is the move back to hardware translation.
>
> **Where it stops working:** an operating system cannot rebuild a page that a program wrote. A serving system can rebuild any KV block from the tokens, by running the model again. So recomputation, chunked prefill and disaggregated prefill have no clean counterpart in an operating system.

## 3. Terms

| Term | Plain meaning |
|---|---|
| automatic prefix caching (APC) | vLLM keeps the KV blocks of finished requests and reuses them when a new prompt starts with the same tokens. |
| block hash | A fingerprint of one full KV block, computed from the parent block's hash, the block's tokens and extra keys. |
| radix tree | A tree whose edges hold sequences of tokens. A path from the root spells a prefix. |
| RadixAttention | SGLang's prefix reuse: a radix tree maps token prefixes to their KV cache. |
| chunked prefill | Splitting a long prompt into chunks that run in several steps, together with decode tokens. |
| token budget | The maximum number of tokens one engine step processes, for example `max_num_batched_tokens`. |
| prefill-decode disaggregation | Running the prefill and the decode of one request on different GPUs, and sending the KV cache between them. |
| goodput | The request rate that a system serves while it meets its latency targets. |
| TTFT | Time to first token: from arrival to the first output token. |
| ITL | Inter-token latency: the time between two output tokens of one request. |
| KV offloading | Copying KV blocks from GPU memory to CPU memory, disk or remote storage, and loading them back on a hit. |
| KV connector | The vLLM interface that sends and receives KV blocks to and from outside the engine. |
| hybrid model | A model that mixes layer types, for example full attention and sliding-window attention, or attention and Mamba. |
| sliding-window attention | Attention that sees only the last $W$ tokens, so a layer needs only $W$ tokens of KV cache. |
| hybrid KV cache manager | The vLLM allocator that gives each layer type its own number of blocks from one shared pool. |
| CUDA virtual memory management | NVIDIA driver functions that reserve virtual addresses first and attach physical memory later. |
| vAttention | A 2024 design that keeps the KV cache contiguous in virtual memory and uses CUDA virtual memory management for paging. |
| FlashInfer | A library of attention kernels for serving, with a block-sparse format for paged KV caches. |
| V1 engine | The re-architected core of vLLM, released as an alpha in January 2025. |
| LRU eviction | When space is needed, remove the item that was used least recently. |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. What the paper solved, and what it left open

### 4.1 What still holds in 2026

These statements were checked in the vLLM 0.31.0 source and docs on 2026-10-15.

1. The KV cache is still divided into blocks of tokens, with a block table per request. `DEFAULT_BLOCK_SIZE = 16` in `vllm/config/cache.py`, the same default as in the paper (§7.2).
2. Blocks still have reference counts. The V1 block type `KVCacheBlock` holds `block_id`, `block_hash` and `ref_cnt` (vLLM prefix caching design doc).
3. Recomputation won over swapping. "In vLLM V1, the default preemption mode is `RECOMPUTE` rather than `SWAP`" (vLLM optimization docs). The paper already found recomputation "never higher than 20%" behind swapping (§7.3).
4. The paper's own kernel is history. The vLLM design page on paged attention says: "This is a historical document based on the original paper for vLLM. It no longer describes the code used in vLLM today." Today vLLM selects among attention backends, for example FlashAttention, through `--attention-backend`.

> [!note] Interpretation of these notes
> The data structure survived, the kernel did not. The block table became a standard interface: kernel libraries accept it as an input, so the serving engine and the kernel can evolve apart.

### 4.2 Limits of the design

Each row gives what the paper states, the consequence, and the later work. The later work is verified with dates in section 5.

| Limit | What the paper states | Consequence | Later work |
|---|---|---|---|
| The kernel is slower and must be rewritten | "20–26% higher attention kernel latency" (§7.1) | Every new attention kernel needs a paged version. | Paged KV in FlashAttention 2.5 and FlashInfer. vAttention avoids the rewrite. |
| Reuse only for prefixes that the provider defines | "reserving a set of physical blocks for a set of predefined shared prefixes" (§4.4) | A new system prompt, a long document or a chat history is not reused automatically. | Automatic prefix caching (block hashes), RadixAttention. |
| No KV cache between chat rounds | "We do not store the KV cache between different conversation rounds" (§6.5) | Every round recomputes the whole history. | Prefix caching, CachedAttention, LMCache. |
| The whole prompt runs in one step | "The prompt phase takes the whole user prompt" (§2.2) | A long prompt makes one step long, and all running decodes wait. | Chunked prefill (SARATHI, Sarathi-Serve, DeepSpeed-FastGen), disaggregation. |
| GPU memory is the only home of the KV cache | Swapping to CPU memory exists only for preemption (§4.5) | Cached prefixes are lost when GPU memory is full. | KV offloading tiers: vLLM offloading, LMCache, Mooncake. |
| One block shape for all layers | All layers of OPT and LLaMA have the same attention | Sliding-window, Mamba or MLA layers waste memory in a uniform layout. | Hybrid KV cache manager, Jenga. |
| First-come-first-serve only | "we adopt the first-come-first-serve (FCFS) scheduling policy for all requests" (§4.5) | No priorities, no latency targets in the scheduler. | Goodput-aware designs such as DistServe. A `priority` policy in vLLM's scheduler config. |

![Alt text: seven limits of PagedAttention on the left, in red, each linked to the later work on the right](/notes/media/papers/2023-pagedattention/figures/10-limits-map.svg)

### 4.3 Limits of the evaluation

1. **Only multi-head attention models.** OPT and LLaMA-1 store one key and one value per head. Most current models use grouped-query attention, which shares one KV head among several query heads ([MHA, MQA, GQA and MLA](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla)).
2. **Short context.** The maximum sequence length of OPT is 2,048 tokens. Current models accept 128K tokens or more.
3. **One GPU type.** All experiments ran on A100 GPUs.
4. **Synthetic arrivals.** The datasets "do not include timestamps" (§6.1), so the arrivals are Poisson, not real traffic with bursts and daily cycles.
5. **One metric.** Mean normalized latency. No separate TTFT, no ITL and no tail percentiles ([page 09](/notes/papers/llm-serving/2023-pagedattention/09-results)).
6. **A rebuilt baseline.** "Since Orca is not publicly available for use, we implement our own version of Orca" (§6.1).

> [!example] Worked example: does GQA or a long context weaken the case for paging?
> This is a computation and an interpretation of these notes.
> 1. OPT-13B stores 819,200 bytes per token. Llama-3.1-8B with GQA stores $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes per token. That is $819{,}200 / 131{,}072 = 6.25$ times less.
> 2. So for short requests, the same GPU holds about 6 times more tokens. Memory limits the batch later, and compute can become the limit first, as for OPT-175B on Alpaca ([page 09](/notes/papers/llm-serving/2023-pagedattention/09-results)).
> 3. But the context window grew far more. A reservation for the maximum length of 131,072 tokens costs $131{,}072 \times 131{,}072 = 17{,}179{,}869{,}184$ bytes $= 16$ GiB per request.
> 4. Take an 80 GB GPU with about 16 GB of weights and a memory fraction of 0.92. About 53.6 GiB remain, and $53.6 / 16 \approx 3.3$. So at most 3 such reservations fit, even if most requests use only 1,000 tokens.
> 5. Conclusion of these notes: GQA reduces the pressure per token, but long windows make any reservation for the maximum length hopeless. Paging matters more in 2026 than in 2023.

## 5. A timeline of later work

Each date is the first public version: the first arXiv submission, the release on PyPI, or the date of the official post. All were checked on 2026-10-15.

| Date | Work | Venue or source | What it adds |
|---|---|---|---|
| 2023-06-20 | vLLM 0.1.0 released, with the first vLLM blog post | PyPI, vLLM blog | Open-source PagedAttention, before the paper |
| 2023-08-31 | SARATHI | arXiv 2308.16369 | Chunked prefills with decodes that "piggyback" on them |
| 2023-09-12 | The PagedAttention paper | arXiv 2309.06180, SOSP 2023 | |
| 2023-10-19 | TensorRT-LLM public release | NVIDIA blog | "In-flight batching and paged attention" |
| 2023-11-30 | Splitwise | arXiv 2311.18677, ISCA 2024 | Prompt and token phases on separate machines |
| 2023-12-12 | SGLang with RadixAttention | arXiv 2312.07104, NeurIPS 2024 | A radix tree of token prefixes for KV reuse |
| 2024-01-09 | DeepSpeed-FastGen | arXiv 2401.08671 | Dynamic SplitFuse, close to chunked prefill |
| 2024-01-18 | DistServe | arXiv 2401.09670, OSDI 2024 | Disaggregation for goodput |
| 2024-01-23 | FlashAttention 2.5.0 | PyPI, README "Paged KV cache" | `block_table` input in `flash_attn_with_kvcache` |
| 2024-03-04 | Sarathi-Serve | arXiv 2403.02310, OSDI 2024 | Chunked prefills and stall-free scheduling |
| 2024-03-23 | CachedAttention | arXiv 2403.19708, USENIX ATC 2024 | KV caches of conversations kept in cheaper tiers |
| 2024-03-31 | vLLM 0.4.0 with automatic prefix caching | PyPI, release notes | "Use the flag `--enable-prefix-caching` to turn it on" |
| 2024-05-07 | vAttention | arXiv 2405.04437, ASPLOS 2025 | Paging by the CUDA driver, contiguous virtual memory |
| 2024-06-24 | Mooncake | arXiv 2407.00079, FAST 2025 (Best Paper) | A KV-cache-centric disaggregated design for Kimi |
| 2025-01-02 | FlashInfer | arXiv 2501.01005, MLSys 2025 (Best Paper) | A block-sparse format for paged KV caches |
| 2025-01-27 | vLLM V1 alpha | vLLM blog | New engine core, prefix caching on by default |
| 2025-03-24 | Jenga | arXiv 2503.18292 | Memory management for heterogeneous layers, built on vLLM |
| 2025-05-07 | vLLM joins the PyTorch Foundation | PyTorch blog | "over 46,500 GitHub stars and over 1000 contributors" |
| 2025-05-20 | llm-d launched | Red Hat developer blog | Distributed vLLM serving on Kubernetes |
| 2025-10-04 | vLLM 0.11.0 | PyPI, release notes | "This release completes the removal of V0 engine." |
| 2025-10-08 | LMCache | arXiv 2510.09665, talk at MLSys 2026 | A KV cache layer outside the engine |
| 2026-10-05 | vLLM 0.31.0 | PyPI | The version whose source these notes checked |

![Alt text: a timeline of the later work from June 2023 to October 2026, in five lanes](/notes/media/papers/2023-pagedattention/figures/10-later-work-timeline.svg)

> [!trap] Dates of papers vs dates of features
> A paper's arXiv date is not the date when a feature reached production. For example, chunked prefill appeared in SARATHI in August 2023, but "In V1, chunked prefill is enabled by default whenever possible" (vLLM docs). Name the date and say what it is the date of.

## 6. vLLM after the paper

### 6.1 Growth

1. **Release before the paper.** vLLM 0.1.0 reached PyPI on 2023-06-20, almost three months before the paper on arXiv. The blog post of that day claimed "up to 24x higher throughput compared to HF and up to 3.5x higher throughput than TGI". The paper does not contain those experiments.
2. **Early production use.** The same post states: "With vLLM, LMSYS was able to cut the number of GPUs used for serving the above traffic by 50%", with "an average of 30K requests daily and a peak of 60K".
3. **Foundation.** On 2025-05-07, the PyTorch Foundation announced vLLM as a hosted project, with "over 46,500 GitHub stars and over 1000 contributors".
4. **Release pace.** PyPI lists vLLM 0.31.0 on 2026-10-05 (checked on 2026-10-15).

### 6.2 The V1 engine

The vLLM blog announced V1 on 2025-01-27: "vLLM V1: A Major Upgrade to vLLM's Core Architecture". Its main changes:

| Change | What the blog says | Why it matters for the KV cache |
|---|---|---|
| Isolated engine loop | "creating an isolated `EngineCore` execution loop" | Tokenization and streaming run in other processes. The GPU waits less for the CPU. |
| One scheduler for all tokens | "treating user-given prompt tokens and model-generated output tokens uniformly" | A step is a token budget per request. Chunked prefill fits naturally. |
| Prefix caching on by default | "less than 1% decrease in throughput even when the cache hit rate is 0%" | Reuse of KV blocks became the normal case, not an option. |
| Persistent batch | Input tensors are cached and updated with differences | Less CPU work per step. |
| FlashAttention 3 | Integrated for mixed prefill and decode batches | The paged KV cache is read by a general kernel, not the paper's kernel. |
| Speed | "up to 1.7x higher throughput compared to V0" | |

The old engine, now called V0, was removed step by step. The 0.10.0 release notes say: "This release begins the cleanup of V0 engine codebase." The 0.11.0 release notes say: "This release completes the removal of V0 engine." PyPI lists 0.11.0 on 2025-10-04.

### 6.3 Current defaults that relate to the paper

| Setting | Value in vLLM 0.31.0 source | Relation to the paper |
|---|---|---|
| `DEFAULT_BLOCK_SIZE` | 16 | The paper's default (§7.2). An attention backend can prefer another size. The log then says "Setting kv cache block size to %d for %s backend(s)." |
| `enable_prefix_caching` | `True` | The paper had only provider-defined prefixes. |
| `enable_chunked_prefill` | `True` (scheduler config) | The paper ran each prompt in one step. |
| Preemption mode | recompute | The paper supported swap and recompute (§4.5). |
| `policy` | `"fcfs"`, with `"priority"` as the other value | The paper used FCFS only. |
| `gpu_memory_utilization` | 0.92 | "The fraction of GPU memory to be used for the model executor". The KV cache receives what remains after the weights and the activations. |

The startup log of vLLM reports the size of the paged cache. The source prints "Available KV cache memory: %s GiB" and "%s KV cache size: %s tokens, Maximum concurrency for %s tokens per request: %.2fx". [Page 11](/notes/papers/llm-serving/2023-pagedattention/11-reproduce-it) uses these lines in exercise E6.

## 7. Reuse across requests

### 7.1 Automatic prefix caching in vLLM

The paper shares blocks inside one request (parallel sampling, beam search) and for prefixes that the provider defines. Automatic prefix caching shares blocks across any requests with the same leading tokens. The vLLM design doc describes it (checked on 2026-10-15):

1. Each full block gets a hash of three parts: the parent block's hash, the tokens of the block, and extra hashes "such as LoRA IDs, multimodal input hashes, and cache salts".
2. "We only cache full blocks." A partial last block is not shared through the cache.
3. A free block keeps its hash and its data until the allocator needs the space. A new request with a matching hash takes the block back and raises its reference count.
4. Eviction is LRU over the free blocks. A finished request returns its blocks in reverse order. Its last block hashes the most tokens and is least likely to be shared, so it leaves first.
5. The default hash function is `sha256`. Other choices are `sha256_cbor`, `xxhash` and `xxhash_cbor` (`--prefix-caching-hash-algo`).

The code below shows the idea in a few lines. It mirrors the vLLM function `hash_block_tokens`, which hashes the tuple `(parent_block_hash, curr_block_token_ids_tuple, extra_keys)`.

```python
import hashlib
import pickle


def block_hash(parent, tokens, extra=None):
    """Hash of one full block: its parent's hash, its tokens, extra keys."""
    data = pickle.dumps((parent, tuple(tokens), extra), protocol=pickle.HIGHEST_PROTOCOL)
    return hashlib.sha256(data).digest()


def full_block_hashes(tokens, block_size, extra=None):
    hashes, parent = [], b"seed"            # vLLM derives the first parent from a seed
    for start in range(0, len(tokens) - block_size + 1, block_size):
        parent = block_hash(parent, tokens[start:start + block_size], extra)
        hashes.append(parent)
    return hashes                            # the partial last block gets no hash


cache = {}                                   # block hash -> physical block id
a = [101, 7, 7, 42, 9, 13, 5, 88, 61, 3]     # request A: 10 tokens
for i, h in enumerate(full_block_hashes(a, 4)):
    cache[h] = i                             # A's 2 full blocks enter the cache

b = [101, 7, 7, 42, 9, 13, 5, 88, 70, 70, 2, 1]   # same first 8 tokens
c = [999, 7, 7, 42, 9, 13, 5, 88]                  # differs only in token 0
for name, req in [("B", b), ("C", c)]:
    hits = 0
    for h in full_block_hashes(req, 4):
        if h not in cache:
            break                            # the prefix match stops at the first miss
        hits += 1
    print(name, "cached tokens:", hits * 4)
print("A with a LoRA key:", full_block_hashes(a, 4, extra=("lora-7",))[0] in cache)
```

Output: `B cached tokens: 8`, `C cached tokens: 0`, `A with a LoRA key: False`.

1. `block_hash` puts the parent hash inside the new hash. So a block's hash depends on every token before it, not only on its own 4 tokens.
2. Request A has 10 tokens: 2 full blocks get hashes. The last 2 tokens form a partial block, which gets no hash.
3. Request B starts with the same 8 tokens, so its first 2 hashes match: 8 cached tokens. B computes only its remaining 4 tokens.
4. Request C differs only in token 0. Its blocks 1 and 2 hold the same tokens as A's, but their parent hashes differ, so nothing matches. This is correct: the keys of a token depend on all earlier tokens.
5. The extra key makes the same tokens with another LoRA adapter a different block, because the adapter changes the keys and values.

> [!trap] Why the hash contains the parent
> A hash of only the block's own tokens would match C's second block with A's second block. But the KV vectors of those tokens differ, because attention mixes in all earlier tokens from the first layer on. The chain of hashes is what makes a cache hit correct.

[Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) covers this mechanism in depth, with hit rates and costs.

### 7.2 RadixAttention in SGLang

SGLang (arXiv 2312.07104, first version 2023-12-12, NeurIPS 2024) uses "a radix tree to manage a mapping between sequences of tokens, and their corresponding KV cache tensors". The tensors are "stored in a non-contiguous, paged layout, where the size of each page is equivalent to one token". The abstract reports "up to 6.4x higher throughput" than other systems on its workloads.

| Aspect | vLLM automatic prefix caching | SGLang RadixAttention (as in the paper) |
|---|---|---|
| Index | Hash map: block hash to physical block | Radix tree of token sequences |
| Unit of sharing | One full block, 16 tokens by default | One token: the page size is 1 |
| Partial block | Not cached | No partial blocks exist |
| In-use protection | Reference count per block | "each node maintains a reference counter" |
| Eviction | LRU over free blocks | "evicts the least recently used leaf first" |
| Scheduling | FCFS by default | "longest-shared-prefix-first order" |

> [!note] Interpretation of these notes
> Both designs are paging plus an index. PagedAttention gave the non-contiguous layout that makes sharing cheap. The index decides which prefix is shared. A radix tree finds the longest prefix to the exact token. A hash chain finds it to the nearest block boundary and costs less to update.

### 7.3 Keeping KV caches outside the GPU

The paper drops a conversation's KV cache after each round (§6.5). Three lines of work keep it.

1. **CachedAttention** (arXiv 2403.19708, USENIX ATC 2024) keeps the KV caches of conversations in a hierarchy of cheaper memory and storage. The abstract reports that it reduces time to first token "by up to 87%", improves prompt prefilling throughput "by up to 7.8" times, and reduces end-to-end cost "by up to 70%".
2. **LMCache** (arXiv 2510.09665, first version 2025-10-08) "extracts and stores KV caches generated by modern LLM engines (vLLM and SGLang)" outside GPU memory. It reports "up to 15x improvement in throughput" with vLLM on workloads such as multi-round question answering. MLSys 2026 lists a talk on it on 2026-05-18.
3. **vLLM's own offloading.** `--kv-offloading-size` is the "Size of the KV cache offloading buffer in GiB", and `kv_offloading_backend` can be `native` or `lmcache` (vLLM 0.31.0 source). The `OffloadingConnector` "extends the prefix cache by offloading completed KV blocks to slower but larger tiers" (vLLM docs).

> [!example] Worked example: is it cheaper to load a KV cache or to compute it?
> Take Llama-3.1-8B and a history of 2,000 tokens. The bandwidth and FLOP values are ideal peak numbers, so real times are longer.
> 1. KV bytes: $2{,}000 \times 131{,}072 = 262{,}144{,}000$ bytes $= 250$ MiB.
> 2. Recompute: prefill needs about $2 \times 8.03 \times 10^9 \times 2{,}000 \approx 3.2 \times 10^{13}$ FLOPs. At 989 TFLOPS (H100, dense BF16), that is about 32.5 ms.
> 3. Load over a 400 Gb/s link, which is 50 GB/s: $262{,}144{,}000 / (50 \times 10^9) \approx 5.2$ ms.
> 4. A load from CPU memory over PCIe follows the same arithmetic with the bandwidth of the PCIe link.
> 5. So loading is several times cheaper than recomputing for this model. The gap grows with the prompt length, because the attention part of prefill grows faster than linearly. Interpretation of these notes: this is why KV offloading and transfer became worth building.

## 8. Better scheduling: chunked prefill and disaggregation

### 8.1 The problem

A step of the engine processes the tokens of all running requests. A prompt of 5,000 tokens makes its step much longer than a decode step. Every running request waits for that step, so their inter-token latency jumps. The paper does not discuss this effect. [Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) explains it from the start.

### 8.2 Chunked prefill

SARATHI (arXiv 2308.16369, 2023-08-31) "splits a prefill request into equal sized chunks" and fills each batch with one chunk plus decodes. Sarathi-Serve (arXiv 2403.02310, OSDI 2024) adds stall-free scheduling: it "adds new requests in a batch without pausing ongoing decodes". The abstract reports, against vLLM, "2.6x higher serving capacity" for Mistral-7B on one A100 and "up to 3.7x higher serving capacity" for Yi-34B on two A100 GPUs, under tail latency limits. DeepSpeed-FastGen (arXiv 2401.08671, 2024-01-09) calls its version Dynamic SplitFuse.

In vLLM V1, "chunked prefill is enabled by default whenever possible". The policy "prioritizes decode requests" and schedules prefill tokens with the rest of the `max_num_batched_tokens` budget (vLLM docs).

> [!example] Worked example: one long prompt under a token budget
> The budget of 2,048 tokens per step is an example value.
> 1. 30 requests are decoding. Each needs 1 token per step: 30 tokens.
> 2. The rest of the budget: $2{,}048 - 30 = 2{,}018$ tokens for prefill.
> 3. A new prompt of 5,000 tokens runs in 3 chunks: 2,018, 2,018 and $5{,}000 - 2 \times 2{,}018 = 964$ tokens.
> 4. Each of the 3 steps holds at most 2,048 tokens. So the 30 decoding requests see 3 moderate steps instead of one step of 5,030 tokens.
> 5. The cost: the new request gets its first token 2 steps later than with one big prefill step.

> [!key] Chunked prefill needs paging
> A chunk writes the KV of its tokens into the request's blocks, and the next chunk attends to them through the block table. A contiguous reservation could also do this. But the paged cache gives each chunk its blocks on demand, and the prefix cache can skip chunks that are already cached. Interpretation of these notes.

### 8.3 Disaggregated prefill and decode

Prefill is compute-bound and decode is memory-bound ([compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)). Disaggregation runs them on different GPUs and sends the KV cache from the prefill GPU to the decode GPU.

| Work | First version | Venue | Main claim (abstract) |
|---|---|---|---|
| Splitwise | 2023-11-30 | ISCA 2024 | "1.4x higher throughput at 20% lower cost", or "2.35x more throughput with the same cost and power budgets" |
| DistServe | 2024-01-18 | OSDI 2024 | "DistServe can serve 7.4x more requests or 12.6x tighter SLO" |
| Mooncake | 2024-06-24 | FAST 2025, Best Paper | "up to a 525% increase in throughput" in simulations, "75% more requests" for Kimi on real workloads |

DistServe measures goodput, "the maximum rate that can be served within both TTFT and TPOT constraints on each GPU". Mooncake "separates the prefill and decoding clusters" and uses "the underutilized CPU, DRAM, and SSD resources" of GPU servers for a disaggregated KV cache.

vLLM supports disaggregated prefilling through KV connectors, for example `NixlConnector`, `LMCacheConnectorV1` and `MooncakeConnector`. Its docs mark the feature "experimental" and state: "Disaggregated prefill DOES NOT improve throughput." The stated benefits are separate tuning of TTFT and ITL, and control of tail ITL.

> [!trap] Disaggregation is about latency targets, not raw throughput
> The research papers report gains in goodput: requests served within latency targets. The vLLM docs say plainly that disaggregation does not improve throughput. Both statements fit. In a mixed system, a strict ITL target can fail many requests. Separating the phases raises the number of requests that meet the target. Interpretation of these notes.

> [!example] Worked example: the price of moving a KV cache
> 1. Llama-3.1-8B, a 2,000-token prompt: 250 MiB of KV cache (section 7.3).
> 2. At 50 GB/s, the transfer takes about 5.2 ms. Ideal prefill on an H100 takes about 32.5 ms.
> 3. OPT-13B with the same prompt: $2{,}000 \times 819{,}200$ bytes $\approx 1.53$ GiB, about 32.8 ms at 50 GB/s, as long as the ideal prefill of the 8B model.
> 4. Interpretation of these notes: GQA cut the bytes per token by 6.25 times, which makes KV transfer cheap enough for disaggregation to pay off.

## 9. Kernels and memory layout

### 9.1 Paged KV in common kernel libraries

The paper wrote its own kernel. Later, general attention libraries accepted a block table.

1. **FlashAttention.** The README entry "2.5: Paged KV cache." says: "Support paged KV cache (i.e., PagedAttention)." PyPI lists `flash-attn` 2.5.0 on 2024-01-23. The function `flash_attn_with_kvcache` takes `block_table` with shape `(batch_size, max_num_blocks_per_seq)` and dtype `torch.int32`. Its docstring says "page_block_size must be a multiple of 256".
2. **FlashInfer.** arXiv 2501.01005, first version 2025-01-02, Best Paper at MLSys 2025 (University of Washington news, 2025-07-01). It uses "a block-sparse format" for heterogeneous KV cache storage. The abstract says it has "been integrated into leading LLM serving frameworks like SGLang, vLLM and MLC-Engine".

> [!note] A block size of 256 in one library, 16 in the engine
> The upstream FlashAttention docstring asks for a page block size that is a multiple of 256. vLLM on CUDA imports its own build, `vllm.vllm_flash_attn`, and writes new keys and values with the custom operation `reshape_and_cache_flash`. In vLLM 0.31.0, its FlashAttention backend declares the supported block sizes as `MultipleOf(16)` in most configurations. So do not claim a single block size for "PagedAttention in practice". The block size depends on the engine and the attention backend. It is 16 in vLLM by default, 128 in TensorRT-LLM's `trtllm-build` flow, and 1 token in SGLang's paper.

### 9.2 PagedAttention and FlashAttention are not rivals

Interviewers often ask how the two ideas relate. They solve different problems, and current engines use both.

| Question | PagedAttention | FlashAttention |
|---|---|---|
| What problem? | Where the KV cache lives in memory, and how much of it is wasted | How attention is computed without writing the $T \times T$ score matrix to HBM |
| Main idea | Fixed-size blocks and a block table per request | Tiles that fit in SRAM, and an online softmax |
| Changes the result? | No. Same attention, different memory layout | No. Exact attention, different order of computation |
| Main gain | Larger batches, so higher throughput | Fewer bytes moved, so faster kernels and less memory for long sequences |
| How they meet | The kernel reads keys and values through the block table | FlashAttention 2.5 accepts a `block_table` input |

In vLLM V1, FlashAttention is one of the attention backends that read the paged cache. The V1 blog says that FlashAttention 3 was integrated for mixed prefill and decode batches. vLLM on CUDA imports its own build, `vllm.vllm_flash_attn`. Interpretation of these notes: a good one-line answer is "paging decides where the KV blocks are, FlashAttention decides how the GPU walks over them". [The cost of attention and FlashAttention](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) explains the tiling and the online softmax.

### 9.3 vAttention: paging by the driver

vAttention (Prabhu et al., arXiv 2405.04437, first version 2024-05-07, ASPLOS 2025) argues against changing the kernel. Its abstract says that PagedAttention changes the layout of the KV cache "from contiguous to non-contiguous", which brings "non-trivial programming and performance overheads".

1. **The idea.** Reserve a large contiguous range of virtual addresses for the KV cache. Attach physical memory pages only when tokens arrive. The CUDA virtual memory management functions `cuMemAddressReserve`, `cuMemCreate` and `cuMemMap` do this.
2. **The benefit.** An unmodified attention kernel sees one contiguous tensor. "vAttention supports FA3 out-of-the-box" (FA3 is FlashAttention-3).
3. **The page size problem.** "cuMemCreate currently allocates memory only at the granularity of large pages", which are 2 MB. The authors modified "the open-source CUDA unified virtual memory driver" to add smaller pages, 64 KB among them.
4. **The measurements** (by the vAttention authors): "vLLM's PagedAttention kernel is up to 2.8× slower than FlashAttention-2" in their tests, and paged kernels of FlashAttention-2 and FlashInfer are "up to 37% and 42% slower than the non-paged kernels" for prefill. vAttention "improves LLM serving throughput by up to 1.23× compared to the use of PagedAttention-based kernels".

> [!example] Worked example: how many tokens fit in one physical page
> An illustration of these notes: assume one page holds the keys of one layer of one request, for Llama-3.1-8B in BF16.
> 1. Keys of one token in one layer: $8 \times 128 \times 2 = 2{,}048$ bytes.
> 2. A 2 MiB page holds $2{,}097{,}152 / 2{,}048 = 1{,}024$ tokens.
> 3. A 64 KiB page holds $65{,}536 / 2{,}048 = 32$ tokens.
> 4. With 2 MiB pages, a short request wastes up to 1,023 token slots per layer for keys alone. That is why vAttention needed smaller pages. A 64 KiB page behaves like a block of 32 tokens.

> [!note] Interpretation of these notes: paging moved, it did not disappear
> vAttention still allocates physical memory in pages on demand. It moves the translation from a software block table in the kernel to the GPU's hardware page tables. The fragmentation argument of PagedAttention still holds.

### 9.4 Hybrid models: one pool, many layer types

Models now mix layer types. The vLLM design doc lists sliding window plus full attention ("gpt-oss, Gemma 2/3, Ministral, cohere"), Mamba plus full attention ("Bamba, Jamba, Minimax") and local chunked attention plus full attention ("Llama4"). A sliding-window layer needs KV only for "the most recent `sliding_window_size` tokens".

The hybrid KV cache manager keeps one memory pool with one page size. It groups layers into KV cache groups. Each group has one attention type, and all groups have the same page size. The doc warns: "This feature is still in its early stage and things may change."

> [!example] Worked example: the doc's own allocation
> The vLLM doc uses a model with 10 full-attention layers and 20 sliding-window layers, block size 16, window 32, and a request of 112 tokens.
> 1. Three groups of 10 layers: one full group, two sliding-window groups. Each block of the pool holds 16 tokens for 10 layers.
> 2. The full group needs $112 / 16 = 7$ blocks. Each sliding-window group needs only the last 32 tokens: 2 blocks.
> 3. Total: $7 + 2 + 2 = 11$ blocks, as the doc states.
> 4. If every layer were treated as full attention: $3 \times 7 = 21$ blocks.
> 5. Saving, computed in these notes: $1 - 11/21 \approx 47.6\%$ for this request.

Jenga (arXiv 2503.18292, 2025-03-24) studies the same problem. Its authors include Woosuk Kwon and Zhuohan Li, two of the PagedAttention authors. It proposes a two-level allocator based on the least common multiple of the embedding sizes. The abstract reports that "Jenga improves GPU memory utilization by up to 79.6%, and increases serving throughput by up to 4.92x (1.80x on average)". The abstract also says that Jenga is implemented on vLLM.

## 10. Paged KV caches beyond vLLM

| Engine or library | What its official source says (checked on 2026-10-15) |
|---|---|
| TensorRT-LLM | The public release post (2023-10-19) lists "In-flight batching and paged attention". The KV cache reuse docs say "KV cache state is stored in blocks, each block holds multiple tokens", "Only full blocks can be shared by multiple requests", and "The block defaults to 128 tokens" in the `trtllm-build` flow. Eviction is LRU, with optional copies to host memory. |
| Hugging Face TGI | "TGI's PagedAttention implementation leverages the custom cuda kernels developed by the vLLM Project." |
| SGLang | A paged layout with a page size of one token, plus RadixAttention (section 7.2). |
| FlashAttention, FlashInfer | Kernels that read a paged KV cache through a block table or a block-sparse index (section 9.1). |
| LMCache, Mooncake | KV caches stored outside the GPU and shared across engines (sections 7.3 and 8.3). |
| llm-d | Distributed vLLM serving on Kubernetes, launched on 2025-05-20. |

[Serving engines](/notes/ai/llm-systems/04-inference/l10-serving-engines) compares the engines in depth.

## 11. Verified facts and interpretations on this page

| Statement | Kind |
|---|---|
| vLLM's default block size is 16, prefix caching and chunked prefill are on by default, preemption recomputes | Verified in the vLLM 0.31.0 source and docs |
| The dates, venues and abstract numbers of every later paper | Verified on arXiv, venue pages and PyPI |
| The data structure of the paper survived and its kernel did not | Interpretation, based on the vLLM doc that calls the kernel page "historical" |
| Paging matters more with long context windows | Interpretation, with the computed 16 GiB reservation |
| GQA makes disaggregation cheaper | Interpretation, with the computed 250 MiB and 1.53 GiB transfers |
| vAttention moves paging to the driver rather than removing it | Interpretation |
| Disaggregation gains are gains in goodput, not raw throughput | Interpretation that reconciles the papers with the vLLM docs |

## 12. Open questions

1. How should one memory pool serve full attention, sliding windows, MLA and Mamba layers without padding waste? The vLLM doc calls its answer "early stage".
2. When is it cheaper to load a KV cache from another machine than to recompute it? The answer depends on the link, the model's bytes per token and the prompt length.
3. Which cached prefixes should a cluster keep, and where? This is cache placement across GPUs, CPUs and storage, combined with routing of requests to the GPU that holds their prefix.
4. Can the GPU hardware page size become small enough that software block tables are no longer needed?

## 13. The interview answer: "What came after PagedAttention?"

> [!example] Worked example: a 60-second answer
> "PagedAttention made KV memory paged, like virtual memory, and vLLM got 2 to 4 times more throughput by batching more requests. After that, the block became the unit for everything. First, reuse: vLLM added automatic prefix caching with chained block hashes in 2024 and turned it on by default in the V1 engine in 2025, and SGLang did the same with a radix tree. Second, scheduling: chunked prefill from SARATHI and Sarathi-Serve splits long prompts so that decodes do not stall, and DistServe, Splitwise and Mooncake put prefill and decode on different GPUs and ship the KV blocks between them. Third, memory tiers: LMCache and vLLM's offloading keep blocks in CPU memory or storage. Fourth, kernels and models: FlashAttention and FlashInfer read paged caches directly, vAttention moves paging into the CUDA driver, and the hybrid KV cache manager serves models with sliding-window or Mamba layers. The block size is still 16 in vLLM, and recomputation is the default preemption."

Follow-up chains to expect:

1. "How does prefix caching know two blocks are equal?" The chained hash of section 7.1, and why the parent hash is necessary.
2. "Why only full blocks?" A partial block still changes. Its hash would change with every new token.
3. "When does disaggregation hurt?" When the KV transfer is slow relative to prefill, or when the load is too low to keep two pools busy.
4. "Why did vLLM switch from swap to recompute?" Small blocks make many small PCIe copies, and with prefix caching, recomputation can often reuse cached blocks. The second reason is an interpretation of these notes: a freed block keeps its hash until it is evicted.

## 14. Common mistakes

1. **"vLLM still uses the kernel from the paper."** The vLLM docs call that kernel page historical. Today vLLM chooses among attention backends, such as FlashAttention, that read the block table.
2. **"Prefix caching was in the PagedAttention paper."** The paper shares blocks inside a request and for prefixes that the provider defines in advance (§4.4). Automatic prefix caching came in vLLM 0.4.0 in March 2024.
3. **"vAttention shows that paging was a mistake."** vAttention still pages physical memory on demand. It moves the translation into the GPU's virtual memory hardware.
4. **"Disaggregated prefill raises throughput."** The vLLM docs say it "DOES NOT improve throughput". Its value is control of TTFT and tail ITL, measured as goodput.
5. **"Prefix caching hashes each block on its own tokens."** The hash contains the parent hash. Two blocks with the same tokens after different prefixes have different KV vectors.
6. **"GQA made PagedAttention unnecessary."** GQA cut the bytes per token, but context windows grew from 2K to 128K tokens. A reservation for the maximum length now costs 16 GiB per request for Llama-3.1-8B.
7. **"The arXiv date is the release date of the feature."** Chunked prefill appeared in a paper in August 2023 and became the vLLM default with V1 in 2025. Say which date you mean.

## 15. One-minute explanation

PagedAttention fixed fragmentation of KV memory inside one GPU, but it left several problems open. Its kernel was 20% to 26% slower and every kernel needed a paged rewrite. It reused KV only inside a request or for provider-defined prefixes, and it dropped chat history between rounds. It ran each prompt in one step, kept the KV cache only in GPU memory, and assumed one layer type. Later work kept the block and built on it. vLLM added automatic prefix caching with chained block hashes in 2024 and made it the default in the V1 engine in 2025. SGLang used a radix tree for the same goal. SARATHI and Sarathi-Serve introduced chunked prefill, and DistServe, Splitwise and Mooncake split prefill and decode across GPUs. FlashAttention 2.5 and FlashInfer read paged caches directly, and vAttention moved paging into the CUDA driver. The hybrid KV cache manager serves models with sliding-window and Mamba layers, and LMCache keeps KV blocks outside the GPU. In vLLM 0.31.0, the block size is still 16 and preemption recomputes.

## 16. Check questions

```check
{
  "question": "Name four limits of the PagedAttention design, each with the paper's own evidence, and the later work that addresses it.",
  "hint": "Read §4.4, §6.5, §7.1 and the description of the prompt phase in §2.2.",
  "answer": "Any four, for example:\n\n| Limit | Evidence in the paper | Later work |\n|---|---|---|\n| Slower kernel that must be rewritten | \"20–26% higher attention kernel latency\" (§7.1) | Paged KV in FlashAttention 2.5 and FlashInfer, vAttention |\n| Reuse only for provider-defined prefixes | \"a set of predefined shared prefixes\" (§4.4) | Automatic prefix caching, RadixAttention |\n| No KV between chat rounds | \"We do not store the KV cache between different conversation rounds\" (§6.5) | Prefix caching, CachedAttention, LMCache |\n| Whole prompt in one step | \"The prompt phase takes the whole user prompt\" (§2.2) | Chunked prefill, disaggregation |\n| KV only in GPU memory | Swap exists only for preemption (§4.5) | KV offloading tiers |\n| One block shape for all layers | OPT and LLaMA have one layer type | Hybrid KV cache manager, Jenga |"
}
```

```check
{
  "question": "Interview follow-up: every request starts with the same system prompt of 1,000 tokens. Block size 16, automatic prefix caching on. How many prompt tokens does a new request reuse? Then the operator edits one token at position 500 (0-based) of the system prompt. How many tokens do new requests reuse now, and why not more?",
  "hint": "Only full blocks are cached, and each hash contains the parent hash.",
  "answer": "1. Full blocks in 1,000 tokens: $\\lfloor 1{,}000 / 16 \\rfloor = 62$ blocks $= 992$ tokens. The last 8 system tokens share a block with the user's text, so that block is not a shared full block.\n2. After the edit, token 500 lies in block $\\lfloor 500 / 16 \\rfloor = 31$. Blocks 0 to 30 still match: $31 \\times 16 = 496$ tokens.\n3. Block 31 has a new hash. Every later block has a new parent hash, so blocks 32 to 61 also miss, even though their tokens did not change. This is correct: their keys and values changed, because attention mixes in all earlier tokens.\nPractical rule: put the stable part of a prompt first and the changing part last."
}
```

```check
{
  "question": "Interview follow-up: explain why vLLM's block hash contains the parent block's hash, and why vLLM caches only full blocks.",
  "answer": "**Parent hash.** The key and value vectors of a token depend on every earlier token. Each layer's attention mixes earlier positions into the hidden state. Two blocks with the same 16 tokens after different prefixes hold different KV vectors. A hash of the block's own tokens would make them collide and give wrong outputs. Chaining the parent hash makes the hash a fingerprint of the whole prefix up to the end of the block.\n\n**Full blocks only.** A partial block still receives tokens. Its content, and so its hash, would change with every step. Only a full block is immutable, so only a full block can be a stable cache entry (\"We only cache full blocks\", vLLM design doc)."
}
```

```check
{
  "question": "Interview follow-up: compare chunked prefill and prefill-decode disaggregation. What problem do both solve, what does each cost, and what do the vLLM docs say about throughput?",
  "answer": "Both solve interference: a long prefill step makes all running decodes wait, so the inter-token latency jumps.\n\n**Chunked prefill** splits a prompt into chunks inside a token budget per step, for example 2,048 tokens, with decodes first. Cost: the new request's first token comes a few steps later, and every step mixes work. No extra GPUs and no KV transfer. vLLM V1 enables it by default.\n\n**Disaggregation** runs prefill and decode on separate GPUs and ships the KV cache. Cost: two pools to size, and a transfer, for example 250 MiB for 2,000 tokens of Llama-3.1-8B, about 5.2 ms at 50 GB/s. Benefit: TTFT and ITL can be tuned apart, with different parallelism per pool.\n\nThe vLLM docs say \"Disaggregated prefill DOES NOT improve throughput\". The research papers report gains in goodput, requests that meet latency targets: DistServe \"7.4x more requests or 12.6x tighter SLO\"."
}
```

```check
{
  "question": "Interview follow-up: vAttention says PagedAttention was the wrong layer for paging. State its argument, its mechanism, its main cost, and why it still depends on the idea of PagedAttention.",
  "answer": "**Argument.** PagedAttention makes the KV cache non-contiguous in virtual memory, so every attention kernel needs a paged version, which costs programming effort and speed. The vAttention authors measured paged prefill kernels up to 37% (FlashAttention-2) and 42% (FlashInfer) slower than non-paged ones.\n\n**Mechanism.** Reserve a contiguous range of virtual addresses per KV tensor with CUDA virtual memory management (`cuMemAddressReserve`), and attach physical pages (`cuMemCreate`, `cuMemMap`) on demand. Unmodified kernels see a contiguous tensor.\n\n**Cost.** The page granularity. A 2 MB page holds 1,024 tokens of keys for one layer of Llama-3.1-8B, so short requests waste much memory. The authors modified the open-source CUDA unified virtual memory driver to add smaller pages, 64 KB among them.\n\n**Dependence.** It still allocates physical memory in pages on demand. It moves the translation from a software block table to the GPU's page tables. The fragmentation argument of PagedAttention is unchanged."
}
```

```check
{
  "question": "A model has 10 full-attention layers and 20 sliding-window layers with a window of 32 tokens. Block size 16, KV cache groups of 10 layers, as in the vLLM doc. Compute the blocks for a request of 256 tokens with the hybrid manager and with a uniform layout, and the saving.",
  "answer": "1. Full group: $256 / 16 = 16$ blocks.\n2. Each of the two sliding-window groups needs the blocks of the last 32 tokens, positions 224 to 255: 2 blocks each.\n3. Hybrid: $16 + 2 + 2 = 20$ blocks. Uniform, as if all 30 layers were full attention: $3 \\times 16 = 48$ blocks.\n4. Saving: $1 - 20/48 \\approx 58.3\\%$. The saving grows with the request length, because the sliding-window groups stay at 2 blocks. For a length that is not a multiple of 16, the last 32 tokens can span 3 blocks."
}
```

```check
{
  "question": "The paper supports both swapping and recomputation. Why is recomputation the default preemption mode in vLLM V1? Separate what sources state from interpretation.",
  "answer": "**Stated.** The paper: swapping \"incurs excessive overhead with small block sizes\" because of \"numerous small data transfers between CPU and GPU\", and recomputation overhead \"is never higher than 20% of swapping's latency\" (§7.3). The vLLM docs: \"In vLLM V1, the default preemption mode is `RECOMPUTE` rather than `SWAP`, as recomputation has lower overhead in the V1 architecture.\"\n\n**Interpretation of these notes.** With prefix caching, a preempted request's freed blocks keep their hashes until they are evicted. When the request resumes, its prefill can hit those blocks and recompute only what was evicted. Chunked prefill also spreads the recomputation over several steps, so it disturbs other requests less."
}
```

```check
{
  "question": "Interview follow-up: an interviewer asks \"Is PagedAttention an alternative to FlashAttention?\" Answer in four sentences.",
  "answer": "No, they solve different problems. PagedAttention is memory management: fixed-size KV blocks found through a block table remove fragmentation, so the server batches more requests. FlashAttention is a computation order: tiles in on-chip SRAM and an online softmax avoid writing the full score matrix to HBM, and the result stays exact. They combine: FlashAttention 2.5 accepts a `block_table`, and vLLM V1 can read its paged cache with FlashAttention kernels."
}
```

## 17. Links

- Previous: [09 Results](/notes/papers/llm-serving/2023-pagedattention/09-results)
- Next: [11 Reproduce it](/notes/papers/llm-serving/2023-pagedattention/11-reproduce-it)
- The paper card: [PagedAttention (SOSP 2023)](/notes/papers/llm-serving/2023-pagedattention)
- The paper on one page: [00 The paper on one page](/notes/papers/llm-serving/2023-pagedattention/00-paper-on-one-page)
- Sharing inside one request: [06 Sharing: parallel sampling, beam search and shared prefixes](/notes/papers/llm-serving/2023-pagedattention/06-decoding-scenarios-and-sharing)
- Preemption: [07 Scheduling, preemption and distributed execution](/notes/papers/llm-serving/2023-pagedattention/07-scheduling-and-preemption)
- The kernels of the paper: [08 Implementation](/notes/papers/llm-serving/2023-pagedattention/08-implementation)
- Prefix caching in depth: [Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)
- Chunked prefill and disaggregation: [Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)
- Engines: [Serving engines](/notes/ai/llm-systems/04-inference/l10-serving-engines)
- Shrinking the cache: [Shrinking the KV cache](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache)
- Provider prompt caching: [Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)
- Interview drill: [From attention to PagedAttention](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention)

### Sources

All sources were checked on 2026-10-15.

- [Kwon et al., PagedAttention, arXiv 2309.06180 (SOSP 2023)](https://arxiv.org/abs/2309.06180)
- [vLLM blog, 2023-06-20: vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention](https://vllm.ai/blog/2023-06-20-vllm)
- [vLLM blog, 2025-01-27: vLLM V1: A Major Upgrade to vLLM's Core Architecture](https://vllm.ai/blog/2025-01-27-v1-alpha-release)
- [vLLM 0.10.0 release notes](https://github.com/vllm-project/vllm/releases/tag/v0.10.0) and [vLLM 0.11.0 release notes](https://github.com/vllm-project/vllm/releases/tag/v0.11.0)
- [vLLM on PyPI](https://pypi.org/project/vllm/): release dates of 0.1.0, 0.4.0, 0.11.0 and 0.31.0, and the 0.31.0 source.
- [vLLM 0.4.0 release notes](https://newreleases.io/project/pypi/vllm/release/0.4.0)
- [vLLM docs: automatic prefix caching design](https://docs.vllm.ai/en/latest/design/prefix_caching.html)
- [vLLM docs: hybrid KV cache manager](https://docs.vllm.ai/en/latest/design/hybrid_kv_cache_manager.html)
- [vLLM docs: engine arguments](https://docs.vllm.ai/en/latest/configuration/engine_args.html)
- [vLLM docs: optimization and tuning (preemption, chunked prefill)](https://docs.vllm.ai/en/latest/configuration/optimization.html)
- [vLLM docs: paged attention design, marked historical](https://docs.vllm.ai/en/latest/design/paged_attention.html)
- [PyTorch Foundation welcomes vLLM, 2025-05-07](https://pytorch.org/blog/pytorch-foundation-welcomes-vllm/)
- [Agrawal et al., SARATHI, arXiv 2308.16369](https://arxiv.org/abs/2308.16369)
- [Agrawal et al., Sarathi-Serve, arXiv 2403.02310](https://arxiv.org/abs/2403.02310) and [OSDI 2024 page](https://www.usenix.org/conference/osdi24/presentation/agrawal)
- [Holmes et al., DeepSpeed-FastGen, arXiv 2401.08671](https://arxiv.org/abs/2401.08671)
- [Patel et al., Splitwise, arXiv 2311.18677](https://arxiv.org/abs/2311.18677) and [Microsoft Research page (ISCA 2024)](https://www.microsoft.com/en-us/research/publication/splitwise-efficient-generative-llm-inference-using-phase-splitting/)
- [Zhong et al., DistServe, arXiv 2401.09670](https://arxiv.org/abs/2401.09670) and [OSDI 2024 page](https://www.usenix.org/conference/osdi24/presentation/zhong-yinmin)
- [Qin et al., Mooncake, arXiv 2407.00079](https://arxiv.org/abs/2407.00079) and [FAST 2025 page](https://www.usenix.org/conference/fast25/presentation/qin)
- [Zheng et al., SGLang, arXiv 2312.07104](https://arxiv.org/abs/2312.07104) and [NeurIPS 2024 proceedings](https://proceedings.neurips.cc/paper_files/paper/2024/hash/724be4472168f31ba1c9ac630f15dec8-Abstract.html)
- [Gao et al., CachedAttention, arXiv 2403.19708](https://arxiv.org/abs/2403.19708) and [USENIX ATC 2024 page](https://usenix.org/conference/atc24/presentation/gao-bin-cost)
- [Liu et al., LMCache, arXiv 2510.09665](https://arxiv.org/abs/2510.09665) and [MLSys 2026 listing](https://mlsys.org/virtual/2026/oral/3646)
- [Prabhu et al., vAttention, arXiv 2405.04437](https://arxiv.org/abs/2405.04437) and [Microsoft Research page (ASPLOS 2025)](https://www.microsoft.com/en-us/research/publication/vattention-dynamic-memory-management-for-serving-llms-without-pagedattention/)
- [Ye et al., FlashInfer, arXiv 2501.01005](https://arxiv.org/abs/2501.01005) and [University of Washington news on the MLSys 2025 Best Paper](https://news.cs.washington.edu/2025/07/01/allen-school-researchers-receive-best-paper-award-for-speeding-up-llm-performance-with-flashinfer)
- [FlashAttention README](https://github.com/Dao-AILab/flash-attention) and [flash-attn on PyPI](https://pypi.org/project/flash-attn/)
- [Zhang et al., Jenga, arXiv 2503.18292](https://arxiv.org/abs/2503.18292)
- [NVIDIA blog, 2023-10-19: TensorRT-LLM now publicly available](https://developer.nvidia.com/blog/optimizing-inference-on-llms-with-tensorrt-llm-now-publicly-available/)
- [TensorRT-LLM docs: KV cache reuse](https://nvidia.github.io/TensorRT-LLM/advanced/kv-cache-reuse.html)
- [Hugging Face TGI docs: PagedAttention](https://huggingface.co/docs/text-generation-inference/conceptual/paged_attention)
- [Red Hat developer blog, 2025-05-20: llm-d](https://developers.redhat.com/articles/2025/05/20/llm-d-kubernetes-native-distributed-inferencing)
