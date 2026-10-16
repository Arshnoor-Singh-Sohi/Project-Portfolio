---
title: "03 The KV cache"
order: 13
summary: "Why the KV cache exists, prefill and decode, the size formula, the implementation, MHA to MLA, and ways to shrink the cache."
---

This part is the center of the interview chain: why the KV cache exists, what it costs, its size formula and how to implement it. It ends with the architecture choices and the serving methods that make the cache smaller. The PagedAttention paper then shows how vLLM stores this cache in blocks. Read [00 The paper on one page](/notes/papers/llm-serving/2023-pagedattention/00-paper-on-one-page), [03 The question](/notes/papers/llm-serving/2023-pagedattention/03-the-question), [04 PagedAttention: the algorithm](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm) and [05 The KV cache manager and block tables](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager).

| Code | Lesson | Core idea | Priority | Status |
|---|---|---|---|---|
| L1 | [Why the KV cache exists](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists) | Past keys and values never change in a causal model, so the decoder stores them once. | Core | not started |
| L2 | [Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) | Prefill is compute-bound matrix-matrix work. Decode is memory-bound matrix-vector work. | Core | not started |
| L3 | [The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) | KV bytes $= 2 L H_{kv} d_h s T B$: 128 KiB per token for Llama-3.1-8B in BF16. | Core | not started |
| L4 | [Implementing a KV cache](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) | Per layer one K tensor and one V tensor, and a two-line append at every step. | Core | not started |
| L5 | [MHA, MQA, GQA and MLA](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) | Shared KV heads (MQA, GQA) or a compressed latent (MLA) store fewer numbers per token. | Core | not started |
| L6 | [Shrinking the KV cache](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) | Quantization, windows, sinks, eviction, offloading and prefix sharing each attack one factor of the formula. | Support | not started |
