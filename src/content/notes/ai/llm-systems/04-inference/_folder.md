---
title: "04 Inference"
order: 14
summary: "The life of a request, latency and throughput metrics, the roofline, batching and scheduling, sampling, speculative decoding, quantization, parallelism, prefix caching and serving engines."
---

This part follows one request through a serving engine and explains each method that makes generation faster or cheaper. It uses the prefill and decode model of part 03 everywhere. Three pages of the PagedAttention paper connect to it: [07 Scheduling, preemption and distributed execution](/notes/papers/llm-serving/2023-pagedattention/07-scheduling-and-preemption), [08 Implementation](/notes/papers/llm-serving/2023-pagedattention/08-implementation) and [10 Limits and later work](/notes/papers/llm-serving/2023-pagedattention/10-limits-and-later-work). Part 05 then puts the engine into the cloud.

| Code | Lesson | Core idea | Priority | Status |
|---|---|---|---|---|
| L1 | [The life of a request](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) | A server runs a step loop, and each step gives every active request one forward pass. | Core | not started |
| L2 | [Latency and throughput metrics](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) | TTFT, TPOT, ITL, percentiles and goodput describe a service, and Little's law sizes it. | Core | not started |
| L3 | [Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) | Arithmetic intensity shows why batching raises throughput and why long contexts limit it. | Core | not started |
| L4 | [Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) | Continuous batching and chunked prefill keep the GPU full while requests arrive and leave. | Core | not started |
| L5 | [Sampling and structured output](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) | The logit processors run in a fixed order, and a token mask enforces a JSON schema. | Support | not started |
| L6 | [Speculative decoding](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) | A draft proposes tokens and one target pass checks them, with the exact target distribution. | Support | not started |
| L7 | [Quantization](/notes/ai/llm-systems/04-inference/l7-quantization) | 8-bit and 4-bit numbers with scale factors shrink the weights and accelerate memory-bound decode. | Support | not started |
| L8 | [Parallelism: tensor, pipeline, data and expert](/notes/ai/llm-systems/04-inference/l8-parallelism) | Tensor, pipeline, data and expert parallelism split a model over GPUs at different communication costs. | Support | not started |
| L9 | [Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) | Requests with a shared prefix reuse its KV blocks, found through a hash chain over full blocks. | Core | not started |
| L10 | [Serving engines: vLLM, SGLang, TensorRT-LLM and others](/notes/ai/llm-systems/04-inference/l10-serving-engines) | vLLM, SGLang, TensorRT-LLM and others combine these parts behind an OpenAI-compatible API. | Support | not started |
