---
title: "LLM serving"
order: 30
summary: "How to serve large language models fast and cheaply: KV cache memory, KV cache reuse, batching and scheduling."
---

## The main question of this topic

A serving system runs a large language model for many users at the same time. Each running request needs GPU memory for its KV cache. Each GPU step should do work for as many requests as possible, because one read of the model weights can serve the whole batch. The papers in this topic ask four questions:

1. How should a server manage GPU memory, above all the KV cache, so that little of it is wasted?
2. How can it reuse the KV cache that earlier requests already computed?
3. How should it batch requests, so that each step of the GPU produces many tokens?
4. How should it schedule requests, so that throughput is high and each user still gets a low latency?

## Papers

| Paper | Year | Main finding | Status |
|---|---|---|---|
| [PagedAttention](/notes/papers/llm-serving/2023-pagedattention) | 2023 | Earlier systems used only 20.4% to 38.2% of their KV cache memory for token states. Fixed-size KV blocks with a block table per request cut the waste to under 4% and allow sharing. vLLM serves 2 to 4 times the throughput at the same latency. | not started |
| [SGLang and RadixAttention](/notes/papers/llm-serving/2023-sglang-radixattention) | 2023 | The engines of 2023 discarded the KV cache of each request. RadixAttention keeps it in a radix tree of token runs and reuses the longest cached prefix of every new request. LRU leaf eviction, reference counts and a cache-aware order manage the tree. Hit rates of 50% to 99% and up to 6.4 times the throughput on LM programs. | not started |

The [Papers](/notes/papers) page has the reading queue for this topic. The [LLM Systems Deep Dive](/notes/ai/llm-systems) subject teaches the background of this topic: attention, the KV cache, inference and cloud hosting.
