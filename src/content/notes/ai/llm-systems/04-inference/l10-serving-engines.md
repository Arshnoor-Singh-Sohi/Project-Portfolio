---
title: "L10: Serving engines: vLLM, SGLang, TensorRT-LLM and others"
order: 10
summary: "What a serving engine does, how vLLM V1 is built (API server, engine core, GPU workers) and what its important flags and defaults mean, what SGLang, TensorRT-LLM, Hugging Face TGI, llama.cpp and Ollama offer today, the OpenAI-compatible API that they share, a comparison table, how to choose, and how to benchmark engines fairly."
status: not-started
tags: [inference, serving, vllm, sglang, tensorrt-llm, tgi, llama-cpp, ollama, benchmarking, openai-api]
---

## 1. The question this idea answers

You have model weights and some GPUs. Between them and a user stands a program that accepts HTTP requests, batches them, manages the KV cache, runs the kernels and streams tokens back. That program is the **serving engine** (also called an inference engine).

The interviewer asks: "Which engine would you use, why, and how would you configure it?" A good answer names the engines and explains what each optimizes. It knows the flags that decide memory and throughput. It also knows how to compare engines honestly. Every earlier lesson of this part is one component of an engine. This lesson assembles them.

## 2. Mental model

> [!analogy] An operating system for the GPU
> An engine is like an operating system. The **scheduler** decides which requests run in each step, like a process scheduler. The **KV cache manager** hands out memory pages and takes them back, like virtual memory ([01 Background: virtual memory and paging](/notes/papers/llm-serving/2023-pagedattention/01-background-virtual-memory-and-paging)). The **kernels** are the device drivers that make the hardware fast. The **API server** is the system-call interface that programs use. Different engines are like different operating systems: they run the same programs (models), but each one is tuned for different hardware and workloads.
>
> **Where it stops working:** an operating system runs many unrelated programs. An engine runs one model (sometimes a few) with one forward pass per step for the whole batch. Most of its decisions are about one shared resource: GPU memory for the KV cache.

## 3. Terms

| Term | Plain meaning |
|---|---|
| serving engine (inference engine) | The software that turns model weights and GPUs into an API: batching, KV cache, kernels, sampling, streaming. |
| OpenAI-compatible API | HTTP routes and JSON fields that follow the OpenAI API, such as `/v1/chat/completions`. Most engines offer it. |
| API server | The process that receives HTTP requests, tokenizes, and streams results back. |
| engine core | In vLLM V1, the process that runs the scheduler and the KV cache manager. |
| worker | A process that drives one GPU: it loads its weight shard and runs the forward pass. |
| model runner | The part of a worker that prepares inputs and calls the model for one step. |
| CUDA graph | A recorded sequence of GPU kernel launches that can be replayed with one call. It removes CPU launch overhead in decode. |
| attention backend | The kernel library that computes attention over the paged KV cache, such as FlashAttention or FlashInfer. |
| continuous batching | Adding and removing requests at every step instead of waiting for a whole batch ([L4: Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)). TensorRT-LLM calls it in-flight batching. |
| chunked prefill | Splitting a long prompt into chunks that share steps with decode tokens. |
| disaggregated serving | Running prefill and decode on different GPU pools and moving the KV cache between them. |
| GGUF | The single-file model format of llama.cpp ([L7: Quantization](/notes/ai/llm-systems/04-inference/l7-quantization)). |
| benchmark client | A program that sends requests at a chosen rate and measures latency and throughput, such as `vllm bench serve`. |
| request rate | Requests sent per second. Benchmarks often draw arrival times from a Poisson process. |
| goodput | Requests per second that meet the latency target (SLO) ([L2: Latency and throughput metrics](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)). |
| SLO (service level objective) | A latency target, for example "time to first token at most 500 ms for 99% of requests". |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. What every engine contains

| Component | What it does | Lesson |
|---|---|---|
| API server | HTTP, tokenization, chat templates, streaming with server-sent events | [L1: The life of a request](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| Scheduler | Continuous batching, token budget per step, chunked prefill, preemption | [L4: Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| KV cache manager | Paged blocks, block tables, prefix caching, eviction | [05 The KV cache manager](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager), [L9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| Attention kernels | FlashAttention-style kernels that read paged KV | [L7: The cost of attention and FlashAttention](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| Sampler | Temperature, top-k, top-p, penalties, structured output | [L5: Sampling and structured output](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| Speculative decoding | Draft and verify | [L6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| Quantization | FP8, INT4, FP4 kernels and checkpoint loaders | [L7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| Distributed execution | Tensor, pipeline, data and expert parallelism | [L8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| Metrics | Prometheus counters for latency, queue and cache | [L8: Production operations](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |

> [!key] Engines differ in policy and kernels, not in ideas
> All major engines use continuous batching, a paged KV cache, prefix reuse, speculative decoding and quantized kernels. They differ in their defaults, their scheduling policies, the hardware they optimize for, their kernels and their operational features. So compare them on your model, your traffic and your hardware.

## 5. vLLM

### 5.1 Origin and recent changes

vLLM started with the PagedAttention paper (Kwon et al., SOSP 2023, [00 The paper on one page](/notes/papers/llm-serving/2023-pagedattention/00-paper-on-one-page)). The current engine is **V1**. The vLLM blog announced it on January 27, 2025 and claimed "up to 1.7x higher throughput compared to V0" (without multi-step scheduling). The V1 guide states: "We have fully deprecated V0." Main V1 changes from the guide and the blog:

1. A unified scheduler that "treats both prompt and output tokens the same way by using a simple dictionary (e.g., `{request_id: num_tokens}`)", with a fixed token budget per step.
2. Chunked prefill "enabled by default whenever possible".
3. Prefix caching on by default, with "less than 1% decrease in throughput even when the cache hit rate is 0%".
4. An isolated engine core loop for the scheduler and the model executor, so CPU work (tokenization, detokenization, streaming) overlaps with GPU work.
5. Piecewise CUDA graphs.
6. Removed: `best_of`, per-request logits processors, and GPU-to-CPU KV swapping for preemption.

The latest release on PyPI is vLLM 0.31.0 (checked on 2026-10-15). All flags and defaults below are from its source code and the current docs.

### 5.2 The process architecture

The architecture overview describes the processes:

- The **API server** "handles HTTP requests and input processing, including tokenization and multimodal data loading", and streams results back. In the 0.31.0 source, the front-end `AsyncLLM` also owns the `OutputProcessor` with the incremental detokenizer.
- The **engine core** "runs the scheduler, manages KV cache, and coordinates model execution across GPU workers". There is one per data-parallel rank.
- Each **GPU worker** "is dedicated to one GPU". It loads weights, runs forward passes and manages GPU memory.
- With data parallelism above 1, a **DP coordinator** balances load across ranks.
- The API server talks to engine cores over ZMQ sockets.

The total number of processes is $A + DP + N$, plus 1 when $DP > 1$, where $A$ is the number of API servers (default equal to DP) and $N = DP \times PP \times TP$. The docs' examples: `vllm serve -tp=4` gives 6 processes. TP = 2 with DP = 4 on 8 GPUs gives $4 + 4 + 8 + 1 = 17$.

![Alt text: vLLM V1 processes: an API server, an engine core with the scheduler and KV cache manager, and four GPU workers](/notes/media/llm-systems/figures/04-10-vllm-v1-processes.svg)

### 5.3 The flags that matter

Defaults from the vLLM 0.31.0 source and the engine arguments page (checked on 2026-10-15):

| Flag | Default | What it controls |
|---|---|---|
| `--max-model-len` | From the model config | The longest prompt plus output per request. Also accepts `auto` or `-1` to choose the largest length that fits in memory, and suffixes such as `32k`. |
| `--gpu-memory-utilization` | 0.92 | The fraction of GPU memory this vLLM instance may use for weights, activations and the KV cache. "This is a per-instance limit". |
| `--max-num-seqs` | `vllm serve`: 1024 on GPUs with at least 70 GiB that are not A100 (for example H100, H200), and on GPUs with 160 GiB or more. 256 on other GPUs. | The most requests in one step. |
| `--max-num-batched-tokens` | `vllm serve`: 8192 on H100/H200-class GPUs, 16384 on GPUs with 160 GiB or more, 2048 on others | The token budget of one step (prefill chunks plus decode tokens). |
| `--tensor-parallel-size` (`-tp`) | 1 | GPUs per tensor-parallel group ([L8](/notes/ai/llm-systems/04-inference/l8-parallelism)). |
| `--pipeline-parallel-size` (`-pp`) | 1 | Pipeline stages. |
| `--data-parallel-size` (`-dp`) | 1 | Data-parallel replicas inside one deployment. |
| `--enable-expert-parallel` (`-ep`) | off | "Use expert parallelism instead of tensor parallelism for MoE layers." |
| `--enable-prefix-caching` | On when the model supports it | Automatic prefix caching ([L9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)). Disable with `--no-enable-prefix-caching`. |
| `--prefix-caching-hash-algo` | `sha256` | `sha256`, `sha256_cbor`, `xxhash`, `xxhash_cbor`. |
| `--block-size` | 16 for most models | Tokens per KV block. |
| `--kv-cache-dtype` | `auto` (the model's type) | For example `fp8` (= `fp8_e4m3`), `fp8_e5m2`, per-token-head INT8 and INT4 variants, `nvfp4`. |
| `--quantization` (`-q`) | none: read from the checkpoint's `quantization_config` | Weight quantization, for example `fp8` (FP8 checkpoints), `fp8_per_tensor` (online), `awq`, `gptq`, `compressed-tensors`, `modelopt_fp4`. |
| `--speculative-config` | none | JSON with `method`, `num_speculative_tokens` and more ([L6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding)). |
| `--enforce-eager` | off | Disables CUDA graphs and `torch.compile`. Saves memory and start-up time, costs decode speed. |
| `--kv-offloading-size` | none | GiB of CPU memory for KV offloading, with `--kv-offloading-backend` `native` or `lmcache`. |
| `--performance-mode` | `balanced` | `interactivity` favors latency at small batch. `throughput` doubles the default `max_num_seqs` and `max_num_batched_tokens`. |

The source comment explains the special case for A100: "Setting large `max_num_batched_tokens` for A100 reduces throughput". The scheduler's own class defaults (2048 tokens, 128 sequences) apply only when no usage context is known.

> [!trap] Defaults change between versions
> `--gpu-memory-utilization` is 0.92 in vLLM 0.31.0. In the same version, the plain `--quantization fp8` no longer quantizes a BF16 checkpoint online: use `fp8_per_tensor`. Pin the engine version in production, and read the release notes before an upgrade.

### 5.4 How vLLM sizes the KV cache

At start-up, vLLM loads the weights and runs a profiling forward pass to measure peak activation memory. It gives the rest of its budget to the KV cache. In simplified form (interpretation of these notes):

$$
\text{KV memory} \approx \text{GPU memory} \times \text{utilization} - \text{weights} - \text{peak activations and other buffers}
$$

The KV memory is cut into blocks of 16 tokens. vLLM then logs "GPU KV cache size: N tokens" and "Maximum concurrency for M tokens per request: X x", where M is `max_model_len` (0.31.0 source). The concurrency number is how many requests of the **maximum** length fit at once.

```python
GB = 1e9

def kv_capacity(total_gb, util, weights_gb, other_gb, kv_bytes_per_token, block=16, max_model_len=8192):
    kv_bytes = (total_gb * util - weights_gb - other_gb) * GB   # what is left for the KV cache
    blocks = int(kv_bytes // (kv_bytes_per_token * block))      # whole blocks only
    tokens = blocks * block
    return blocks, tokens, tokens / max_model_len

# Llama-3.1-8B, BF16, one H100 80 GB, default utilization 0.92
# other_gb = activations, CUDA graphs and buffers: an assumption (vLLM measures it at start-up)
for max_len in (8_192, 131_072):
    blocks, tokens, conc = kv_capacity(80, 0.92, 16.06, 4.0, 131_072, max_model_len=max_len)
    print(f"max_model_len {max_len:>7,}: {blocks:,} blocks, {tokens:,} tokens, "
          f"max concurrency {conc:.2f}x")
```

Output (computed in these notes, with 4 GB assumed for activations and graphs):

```text
max_model_len   8,192: 25,529 blocks, 408,464 tokens, max concurrency 49.86x
max_model_len 131,072: 25,529 blocks, 408,464 tokens, max concurrency 3.12x
```

The KV capacity does not depend on `max_model_len`. The reported concurrency does. A server with a 128K maximum length can still run hundreds of short requests at once, because each request takes only the blocks it uses.

### 5.5 Two commands

```bash
# Llama-3.1-8B on one H100
vllm serve meta-llama/Llama-3.1-8B-Instruct --max-model-len 16384

# Llama-3.1-70B on 4 H100s with an FP8 KV cache and prefix caching (on by default)
vllm serve meta-llama/Llama-3.1-70B-Instruct --tensor-parallel-size 4 \
  --max-model-len 32768 --kv-cache-dtype fp8 --gpu-memory-utilization 0.92
```

The server listens on port 8000 by default (0.31.0 source). Besides the OpenAI-compatible routes, vLLM 0.31.0 serves `/health`, `/metrics` (Prometheus), `/v1/models`, `/v1/embeddings`, `/v1/responses`, an Anthropic-style `/v1/messages`, and admin routes such as `POST /reset_prefix_cache`.

## 6. SGLang

SGLang started with the paper "SGLang: Efficient Execution of Structured Language Model Programs" (Zheng et al., NeurIPS 2024). It introduced RadixAttention, the radix-tree prefix cache of [L9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse), and reported "up to 6.4× higher throughput compared to state-of-the-art inference systems" on its workloads. An LMSYS blog post of December 2024 announced "SGLang v0.4: Zero-Overhead Batch Scheduler, Cache-Aware Load Balancer, Faster Structured Outputs".

Facts from the SGLang 0.5.21 source and docs (checked on 2026-10-15):

| Item | Value |
|---|---|
| Launch | `python3 -m sglang.launch_server --model-path <model>`. Version 0.5.21 also installs a `sglang serve` command. |
| Default port | 30000 |
| Memory fraction | `--mem-fraction-static`: "The fraction of the memory used for static allocation (model weights and KV cache memory pool)" |
| Tensor parallelism | `--tp-size` (alias `--tensor-parallel-size`), default 1. Also `--pp-size`, `--dp-size`, expert parallelism. |
| Prefix cache | RadixAttention on by default. `--disable-radix-cache` disables it. `--radix-eviction-policy` default `lru`. |
| Scheduling | `--schedule-policy` default `fcfs`, with `lpm` (longest prefix match) among the choices. |
| Chunked prefill | `--chunked-prefill-size` ("Setting this to -1 means disabling chunked prefill") |
| Speculative decoding | `--speculative-algorithm`: built-ins `EAGLE`, `EAGLE3`, `NEXTN`, `STANDALONE`, `NGRAM` and others |
| KV offloading | HiCache (`--enable-hierarchical-cache`) with host memory and storage backends |
| Multi-replica routing | SGLang Model Gateway, default policy `cache_aware` |

SGLang is strong for workloads with heavy prefix sharing (agents, multi-turn chat, many calls with the same few-shot examples) and for structured output. The EAGLE-3 paper also reported its throughput results in SGLang.

## 7. TensorRT-LLM, Dynamo-Triton and Dynamo

**TensorRT-LLM** is NVIDIA's engine. One recent change matters for interviews. The name suggests TensorRT engines, but the docs (version 1.4.0rc0, checked on 2026-10-15) say: "The TensorRT engine backend has been removed." PyTorch is now "the sole execution backend for TensorRT LLM". There is no engine-build step: Hugging Face checkpoints load directly, with `LLM(model="<hf_model>")` in Python or `trtllm-serve <hf_model>` on the command line. The quick start sends requests to `http://localhost:8000/v1/chat/completions`.

| Feature | TensorRT-LLM docs (1.4.0rc0) |
|---|---|
| Batching | In-flight batching and request scheduling |
| KV cache | Paged blocks. "Block reuse across requests is enabled by default". Prioritized LRU eviction. `free_gpu_memory_fraction` default 0.9. Host offloading with `host_cache_size`. |
| Speculative decoding | Config classes for EAGLE, EAGLE3, MTP, N-gram, PARD, DFlash, DSpark and draft-target |
| Quantization | FP8 per-tensor, block and rowwise, NVFP4 and MXFP4 (Blackwell), W4A16 and W4A8 AWQ and GPTQ, FP8 and NVFP4 KV cache. Checkpoints from NVIDIA Model Optimizer. |
| Other | Disaggregated serving, LoRA, guided decoding |

**Dynamo-Triton**: NVIDIA's page says "NVIDIA Dynamo-Triton, formerly NVIDIA Triton Inference Server, enables deployment of AI models across major frameworks". It is a general model server, not LLM-specific.

**NVIDIA Dynamo** is "A Datacenter Scale Distributed Inference Serving Framework" that runs SGLang, TensorRT-LLM or vLLM as backends. Its first feature is disaggregated serving: it "Separates prefill and decode into independently scalable GPU pools". It also offers KV-aware routing and KV block offloading across GPU, CPU, SSD and remote storage (GitHub README, checked on 2026-10-15).

## 8. Hugging Face TGI, llama.cpp and Ollama

### 8.1 Text Generation Inference (TGI)

TGI was Hugging Face's serving engine. Its documentation now says: "text-generation-inference is now in maintenance mode. Going forward, we will accept pull requests for minor bug fixes, documentation improvements and lightweight maintenance tasks." It recommends vLLM, SGLang, and local engines such as llama.cpp or MLX (checked on 2026-10-15). So do not choose TGI for a new deployment, but expect to meet it in older systems.

### 8.2 llama.cpp

llama.cpp is a C/C++ engine that runs GGUF models on CPUs, Apple silicon and GPUs. Its server, `llama-server`, is a "Fast, lightweight, pure C/C++ HTTP server" with "OpenAI API compatible chat completions, responses, and embeddings routes", continuous batching and parallel decoding (README, checked on 2026-10-15). Useful options:

| Option | Meaning (README) |
|---|---|
| `--port` | Port, default 8080. `--host` defaults to 127.0.0.1. |
| `-c`, `--ctx-size` | Context size, default 0 = loaded from the model |
| `-np`, `--parallel` | Number of server slots (concurrent sequences), default -1 = auto |
| `-ngl`, `--gpu-layers` | Layers stored in GPU memory: a number, `auto` or `all`. The rest run on the CPU. |
| `-ctk`, `-ctv` | KV cache types: `f32`, `f16` (default), `bf16`, `q8_0`, `q4_0` and others |
| `--cache-prompt` | Prompt caching, enabled by default |

llama.cpp's strength is running anywhere, including laptops and CPU-only servers, with partial GPU offload. It is not built for multi-GPU throughput at data-center scale.

### 8.3 Ollama

Ollama packages models for local use and serves them over HTTP. Its OpenAI-compatible base URL is `http://localhost:11434/v1/`, with `chat/completions`, `completions`, `models`, `embeddings` and `responses` (the Ollama docs say `responses` arrived in v0.13.3, stateless only). Use it for development on a laptop, not for multi-user production serving (interpretation of these notes).

## 9. The shared interface: the OpenAI-compatible API

Because most engines speak the same API, a client can switch engines by changing a base URL. A chat request:

```json
{
  "model": "meta-llama/Llama-3.1-8B-Instruct",
  "messages": [
    {"role": "system", "content": "You are a concise assistant."},
    {"role": "user", "content": "What does PagedAttention store in blocks?"}
  ],
  "max_tokens": 64,
  "temperature": 0.2,
  "stream": true
}
```

With `"stream": true`, the response is a stream of server-sent events. Each event is a line that starts with `data: ` and holds one JSON chunk. The stream ends with `data: [DONE]` ([L1: The life of a request](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request), [L1: The OpenAI chat shape](/notes/ai/llm-apis/03-openai-format/l1-the-openai-chat-shape)). One chunk:

```json
{"id": "chatcmpl-1", "object": "chat.completion.chunk", "model": "meta-llama/Llama-3.1-8B-Instruct", "choices": [{"index": 0, "delta": {"content": " the"}, "finish_reason": null}]}
```

Engines also accept extra fields outside the OpenAI spec. vLLM, for example, accepts sampling extras such as `top_k`, `min_p` and `repetition_penalty`, and the prefix-cache isolation field `cache_salt` ([L9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)). Such fields make a client less portable.

> [!trap] Compatible is not identical
> Two engines can both accept the same JSON but apply a different chat template, a different default `max_tokens`, different stop tokens or different tokenization. Then "the same request" gives different outputs and different token counts. Pin the chat template and set every sampling field explicitly when you compare engines.

## 10. Comparison and choice

| | vLLM | SGLang | TensorRT-LLM | llama.cpp | Ollama |
|---|---|---|---|---|---|
| Main target | General GPU serving, broad model support | High-throughput serving, heavy prefix reuse | Peak performance on NVIDIA GPUs | Anywhere: CPU, Apple silicon, GPU | Local development |
| KV cache reuse | Hash-chain APC over 16-token blocks, on by default | Radix tree (RadixAttention), on by default | Block reuse in a radix tree, on by default, with priorities | Prompt cache, on by default | Not covered here |
| Multi-GPU | TP, PP, DP, EP, context parallel | TP, PP, DP, EP | TP, PP, EP, disaggregated serving | Single machine, with partial GPU offload | Single machine |
| Quantization (examples) | FP8, AWQ, GPTQ, compressed-tensors, ModelOpt FP4 | FP8, AWQ, GPTQ, GGUF, ModelOpt FP4 | FP8, NVFP4, MXFP4, AWQ, GPTQ (ModelOpt) | GGUF quantization types | Not covered here |
| Default port | 8000 | 30000 | 8000 in the quick start | 8080 | 11434 |
| Status (checked on 2026-10-15) | Active, 0.31.0 | Active, 0.5.21 | Active, docs 1.4.0rc0 | Active | Active |

The "Main target" and "Multi-GPU" rows for llama.cpp and Ollama are the interpretation of these notes. TGI is not in the table because it is in maintenance mode.

How to choose (interpretation of these notes):

1. **Default choice for open models on NVIDIA or AMD GPUs:** vLLM. It has the widest model support, many quantization formats and a large community.
2. **Agents and multi-turn traffic with heavy prefix sharing, or structured output at scale:** test SGLang beside vLLM.
3. **NVIDIA-only fleet, need the last bit of performance, FP4 on Blackwell, or an NVIDIA-supported stack:** TensorRT-LLM, often under Dynamo for large deployments.
4. **Laptop, CPU-only server, edge device:** llama.cpp, or Ollama for convenience.
5. **Managed instead:** the cloud platforms of [L6: Managed platforms](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) often run one of these engines for you.

## 11. How to benchmark engines fairly

### 11.1 The checklist

1. **Same model files and precision.** The same checkpoint, the same weight quantization and the same KV cache dtype. FP8 KV in one engine and BF16 in the other is not a fair test.
2. **Same limits.** The same maximum context length, maximum batch size and memory fraction (`--gpu-memory-utilization` in vLLM, `--mem-fraction-static` in SGLang, `free_gpu_memory_fraction` in TensorRT-LLM).
3. **Same hardware and software.** The same GPU model, driver, CUDA version and interconnect. Record the engine versions.
4. **Realistic data.** Use real prompt and output length distributions, or a fixed synthetic shape such as 1,024 input and 128 output tokens. Force output lengths with `ignore_eos` so that one engine does not "win" by stopping earlier.
5. **Prefix caching on purpose.** Decide whether your traffic shares prefixes. Random prompts measure the no-reuse case. Reset or warm the cache the same way for every engine.
6. **Warm up.** Send some requests first, so that CUDA graph capture, compilation and cache warm-up are not measured.
7. **Sweep the load.** Measure at several request rates or concurrency levels, not at one point. Report the whole latency-throughput curve ([L2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)).
8. **Report tails and goodput.** P50 and P99 of TTFT, TPOT and ITL, and goodput under your SLO, not only peak tokens per second.
9. **Same sampling settings.** The same temperature, top-p and stop rules.
10. **Count tokens the same way.** Use one tokenizer to count input and output tokens for all engines.

### 11.2 vLLM's benchmark client

`vllm bench serve` sends requests to any OpenAI-compatible server. Options from the 0.31.0 source (checked on 2026-10-15):

| Option | Meaning and default |
|---|---|
| `--dataset-name` | `random` by default. Also `sharegpt`, `sonnet`, `hf`, `prefix_repetition`, `spec_bench` and others. |
| `--random-input-len`, `--random-output-len` | 1024 and 128 by default |
| `--num-prompts` | 1000 by default |
| `--request-rate` | Requests per second, default `inf` ("all the requests are sent at time 0"). Otherwise arrivals follow a Poisson process or a gamma distribution. |
| `--burstiness` | 1.0 = Poisson. Lower values make bursty traffic. |
| `--max-concurrency` | A cap on requests in flight |
| `--ignore-eos` | Keep generating until the output length |
| `--percentile-metrics`, `--metric-percentiles` | Which metrics and percentiles to report. Defaults: `ttft,tpot,itl` and `99`. |
| `--goodput` | SLOs as `KEY:VALUE` in ms, for `ttft`, `tpot` or `e2el` |

A sweep point for a fixed shape:

```bash
vllm bench serve --model meta-llama/Llama-3.1-8B-Instruct --base-url http://localhost:8000 \
  --dataset-name random --random-input-len 1024 --random-output-len 128 --ignore-eos \
  --num-prompts 1000 --request-rate 8 --metric-percentiles 50,99 --goodput ttft:500 tpot:50
```

Run it at several `--request-rate` values against each engine. SGLang has its own client, `python -m sglang.bench_serving`, but one client for all engines removes one source of difference.

### 11.3 Sanity checks with Little's law

Little's law says $L = \lambda W$: the average number of requests in the system equals the arrival rate times the average time in the system ([L2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)). At 8 requests per second with a 3-second end-to-end latency, about 24 requests are in flight. If the engine's metrics show 100 running requests, the benchmark or the metrics are wrong. Also check that the measured throughput never exceeds the request rate you sent.

### 11.4 Exercises

Notebook: `C:\Users\ASohi\Downloads\AI\agent-harness-lab\llm-systems\l10-serving-engines.ipynb`.

1. **A toy OpenAI-compatible streaming server and a timing client.** With only the Python standard library, write a server for `POST /v1/chat/completions` with `"stream": true`. It answers with server-sent events, after a fixed delay before the first token and between tokens. Write a client that measures TTFT and the mean inter-token latency.
   - Acceptance test: use a 150 ms first delay and 20 ms per token. The client reports a TTFT of at least 150 ms and a mean ITL of about 20 ms, and it rebuilds the full text.
   - Hint 1: `http.server.ThreadingHTTPServer` and `self.wfile.write(b"data: ...\n\n")` with `flush()`.
   - Hint 2: in the client, read the response line by line and skip `data: [DONE]`.
2. **KV capacity of a tensor-parallel deployment.** Reuse the function of section 5.4 for Llama-3.1-70B with TP = 4 on 80 GB H100s. Use 35.28 GB of weights per GPU, 3 GB of other memory, utilization 0.92 and `max_model_len` 32,768. Compare a BF16 and an FP8 KV cache.
   - Acceptance test: BF16 gives 26,947 blocks (431,152 tokens, about 13.16x at 32K). FP8 gives twice as many blocks and about 26.32x.
   - Hint 1: per GPU, each token stores 2 of the 8 KV heads: $2 \times 80 \times 2 \times 128 \times s$ bytes.
   - Hint 2: the FP8 KV cache has $s = 1$ byte per element.
3. **Goodput from request timings.** You get a list of (TTFT, TPOT) pairs from a 5-second window. Compute throughput, goodput and SLO attainment for TTFT ≤ 500 ms and TPOT ≤ 50 ms.
   - Acceptance test: the 10 example pairs of the reference solution give 2.0 requests per second, 1.4 good requests per second and 70% attainment.
   - Hint 1: a request is good only if it meets both SLOs.
   - Hint 2: divide counts by the window length.

## 12. Common mistakes

1. **"TensorRT-LLM means building TensorRT engines."** The current docs say the TensorRT engine backend has been removed. TensorRT-LLM runs PyTorch models directly from Hugging Face checkpoints.
2. **"TGI is a good default."** It is in maintenance mode, and its own docs recommend vLLM and SGLang.
3. **"`--gpu-memory-utilization 0.92` gives the KV cache 92% of memory."** It is the share for the whole instance: weights, activations, CUDA graphs and the KV cache. The KV cache gets what remains.
4. **"Maximum concurrency 3x means only 3 requests can run."** It counts requests at the **maximum** length. Short requests take only the blocks they use, so many more fit.
5. **"OpenAI-compatible engines give identical outputs."** Chat templates, defaults, tokenizers and kernels differ. Pin them for any comparison.
6. **"Benchmark at the highest request rate and report tokens per second."** Peak throughput hides the latency collapse. Report the curve, P99 latencies and goodput under an SLO.
7. **"Benchmark with prefix caching on random prompts."** Random prompts never share prefixes, so the test says nothing about agents and chats, which share them heavily. Use a dataset that matches your traffic, such as `prefix_repetition`.
8. **"The default flags are fine for production."** Defaults depend on the GPU and change between versions. Set `--max-model-len`, the memory fraction and the batch limits explicitly, and pin the version.

## 13. One-minute explanation

A serving engine turns weights and GPUs into an API. It combines an API server, a continuous-batching scheduler and a paged KV cache manager with prefix caching. It also holds attention kernels, a sampler, speculative decoding, quantized kernels and multi-GPU execution. vLLM V1 splits this into an API server process, an engine core with the scheduler and KV cache manager, and one worker per GPU. Its key flags are `--max-model-len`, `--gpu-memory-utilization` (0.92 in 0.31.0), `--max-num-seqs`, `--max-num-batched-tokens`, `--tensor-parallel-size`, `--enable-prefix-caching`, `--kv-cache-dtype` and `--quantization`. SGLang adds RadixAttention and a cache-aware gateway, so it shines when prefixes are shared. TensorRT-LLM is NVIDIA's engine, now PyTorch-based without TensorRT engines, with broad FP8 and FP4 support. TGI is in maintenance mode, llama.cpp and Ollama cover laptops and CPU-only machines, and all of them speak the OpenAI-compatible API. For a fair comparison, fix the model files, precision, limits and hardware. Then sweep the request rate and report P99 latency and goodput, not only peak tokens per second.

## 14. Check questions

```check
{
  "question": "Name the processes of `vllm serve` with TP = 4 and say what each does.",
  "answer": "Six processes. 1 API server: HTTP routes, tokenization, multimodal input loading, detokenization and streaming. 1 engine core: the scheduler loop and the KV cache manager (block pool, prefix cache), which sends one step at a time to the workers. 4 GPU workers: each loads its weight shard, holds its KV cache shard and runs the forward pass with its model runner. The API server and the engine core talk over ZMQ sockets. The general count is $A + DP + N$ (+1 coordinator when DP > 1)."
}
```

```check
{
  "question": "Interview follow-up: you start vLLM with `--gpu-memory-utilization 0.92` on an 80 GB H100 for Llama-3.1-8B. Estimate the KV capacity in tokens, and explain the log line \"Maximum concurrency for 131,072 tokens per request: 3.12x\".",
  "hint": "Budget minus weights minus activations, divided by 128 KiB per token.",
  "answer": "Budget: $80 \\times 0.92 = 73.6$ GB. Subtract the weights (about 16.06 GB). Subtract about 4 GB for activations and CUDA graphs, an assumption of these notes that vLLM measures at start-up. About 53.5 GB remain for the KV cache. At 131,072 bytes per token and 16-token blocks: 25,529 blocks = 408,464 tokens.\n\nThe log divides that capacity by `max_model_len`: $408{,}464 / 131{,}072 \\approx 3.12$. It means 3 requests of the maximum length fit at once. It does not limit short requests: 400 requests of 1,000 tokens also fit, because each takes only the blocks it uses. (Computed in these notes.)"
}
```

```check
{
  "question": "Interview follow-up: what changed recently in TensorRT-LLM that a candidate who learned it in 2024 might get wrong?",
  "answer": "The TensorRT engine backend has been removed. The current docs (1.4.0rc0) call PyTorch \"the sole execution backend for TensorRT LLM\". There is no `trtllm-build` step and no checkpoint conversion: Hugging Face checkpoints load directly with `LLM(model=...)` or `trtllm-serve <hf_model>`. Code that used `LLM(backend=\"tensorrt\")` now raises an error. Also, Triton Inference Server is now called Dynamo-Triton. NVIDIA Dynamo is the distributed framework that runs SGLang, TensorRT-LLM or vLLM, with disaggregated prefill and decode and KV-aware routing."
}
```

```check
{
  "question": "Interview follow-up: what is the status of Hugging Face TGI, and what would you tell a team that runs it?",
  "answer": "TGI's docs say it \"is now in maintenance mode\": only minor bug fixes, documentation and lightweight maintenance. They recommend vLLM, SGLang, and local engines such as llama.cpp or MLX. A team on TGI can keep running it, but should plan a migration. Because these engines all offer the OpenAI-compatible API, clients change little. The work is in re-benchmarking, re-tuning memory and batch limits, and checking chat templates and outputs."
}
```

```check
{
  "question": "Interview follow-up: list five things that make an engine benchmark unfair, with the fix for each.",
  "answer": "1. Different precision (FP8 KV cache in one engine, BF16 in the other): use the same weights, quantization and KV dtype.\n2. Different output lengths because one engine stops at EOS earlier: use `ignore_eos` and fixed output lengths.\n3. Different memory limits or maximum context: set the memory fraction and `max_model_len` equal.\n4. One load point only: sweep the request rate and report the latency-throughput curve, P99 TTFT and TPOT, and goodput under an SLO.\n5. Cold start inside the measurement (CUDA graph capture, compilation, empty prefix cache): warm up first and reset or warm caches the same way.\n\nAlso: the same hardware, driver and versions, the same chat template and sampling settings, and one tokenizer to count tokens."
}
```

```check
{
  "question": "A benchmark sends 8 requests per second. The average end-to-end latency is 3 seconds. How many requests should the engine report as running on average, and why is this a useful check?",
  "answer": "Little's law: $L = \\lambda W = 8 \\times 3 = 24$ requests in the system on average (running plus waiting). Suppose the engine's metrics show a very different number. Then either the client did not really send at 8 per second (for example it hit `--max-concurrency`), or the measurement is wrong. It is a cheap consistency check between client-side and server-side metrics."
}
```

```check
{
  "question": "Interview follow-up: which engine would you choose in three cases? (a) An agent platform with long shared tool prompts on H100s. (b) A Blackwell fleet that must run NVFP4. (c) A demo on a MacBook. Justify each.",
  "answer": "(a) vLLM or SGLang, both with prefix caching on by default. Benchmark both on real agent traces with a prefix-sharing dataset, and add cache-aware routing across replicas. SGLang's radix cache and cache-aware gateway were designed for this case. vLLM's hash-chain APC is also strong.\n(b) TensorRT-LLM, whose quantization matrix lists NVFP4 and MXFP4 on Blackwell with ModelOpt checkpoints, possibly under NVIDIA Dynamo for a large fleet. vLLM also lists `modelopt_fp4`, so benchmark both.\n(c) llama.cpp or Ollama with a GGUF model, because they run on Apple silicon and CPUs with no server setup.\n\nThese choices are the interpretation of these notes. The right answer always ends with \"then I would benchmark on our traffic\"."
}
```

```check
{
  "question": "Why can the same OpenAI-compatible request give different outputs on two engines that serve the same weights?",
  "answer": "The API shape is shared, but the processing is not. Engines can apply different chat templates, add different stop tokens and use different default `max_tokens` or sampling settings. They can tokenize slightly differently and run kernels whose floating-point rounding differs. Batching can also change numerics ([L5: Sampling and structured output](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output)). Pin the template and every sampling field, and compare distributions or task scores, not single outputs."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\nimport json, threading, time, urllib.request\nfrom http.server import BaseHTTPRequestHandler, ThreadingHTTPServer\n\nTOKENS = [\"Paged\", \" attention\", \" stores\", \" the\", \" KV\", \" cache\", \" in\", \" blocks\", \".\"]\n\nclass FakeEngine(BaseHTTPRequestHandler):\n    def do_POST(self):\n        if self.path != \"/v1/chat/completions\":\n            self.send_error(404); return\n        body = json.loads(self.rfile.read(int(self.headers[\"Content-Length\"])))\n        self.send_response(200)\n        self.send_header(\"Content-Type\", \"text/event-stream\")\n        self.end_headers()\n        time.sleep(0.15)                                  # pretend prefill\n        for tok in TOKENS[: body.get(\"max_tokens\", 16)]:\n            chunk = {\"id\": \"chatcmpl-1\", \"object\": \"chat.completion.chunk\", \"model\": body[\"model\"],\n                     \"choices\": [{\"index\": 0, \"delta\": {\"content\": tok}, \"finish_reason\": None}]}\n            self.wfile.write(f\"data: {json.dumps(chunk)}\\n\\n\".encode()); self.wfile.flush()\n            time.sleep(0.02)                              # pretend one decode step\n        self.wfile.write(b\"data: [DONE]\\n\\n\"); self.wfile.flush()\n\n    def log_message(self, *args):                         # keep the output quiet\n        pass\n\nserver = ThreadingHTTPServer((\"127.0.0.1\", 0), FakeEngine)\nthreading.Thread(target=server.serve_forever, daemon=True).start()\nurl = f\"http://127.0.0.1:{server.server_port}/v1/chat/completions\"\n\nreq = urllib.request.Request(url, method=\"POST\", headers={\"Content-Type\": \"application/json\"},\n    data=json.dumps({\"model\": \"toy\", \"stream\": True, \"max_tokens\": 16,\n                     \"messages\": [{\"role\": \"user\", \"content\": \"What is PagedAttention?\"}]}).encode())\nstart, times, text = time.perf_counter(), [], \"\"\nwith urllib.request.urlopen(req) as resp:\n    for line in resp:\n        line = line.decode().strip()\n        if not line.startswith(\"data: \") or line == \"data: [DONE]\":\n            continue\n        times.append(time.perf_counter())\n        text += json.loads(line[6:])[\"choices\"][0][\"delta\"][\"content\"]\nserver.shutdown()\nitl = [b - a for a, b in zip(times, times[1:])]\nprint(\"text:\", text)\nprint(f\"TTFT {1000 * (times[0] - start):.0f} ms, mean ITL {1000 * sum(itl) / len(itl):.0f} ms, tokens {len(times)}\")\n```\n\nOutput (timings vary by run):\n\n```text\ntext: Paged attention stores the KV cache in blocks.\nTTFT 172 ms, mean ITL 20 ms, tokens 9\n```\n\nThe server sleeps 150 ms before the first token (the fake prefill), so TTFT is a little above 150 ms after the HTTP overhead."
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\nGB = 1e9\n\ndef kv_capacity(total_gb, util, weights_gb, other_gb, kv_bytes_per_token, block=16, max_model_len=8192):\n    kv_bytes = (total_gb * util - weights_gb - other_gb) * GB\n    blocks = int(kv_bytes // (kv_bytes_per_token * block))\n    tokens = blocks * block\n    return blocks, tokens, tokens / max_model_len\n\n# Llama-3.1-70B, TP = 4, per GPU: 35.28 GB of BF16 weights, 2 of 8 KV heads per GPU\nfor name, kv_dtype_bytes in [(\"BF16 KV\", 2), (\"FP8 KV\", 1)]:\n    kv_per_token_per_gpu = 2 * 80 * 2 * 128 * kv_dtype_bytes\n    blocks, tokens, conc = kv_capacity(80, 0.92, 35.28, 3.0, kv_per_token_per_gpu, max_model_len=32_768)\n    print(f\"{name}: {kv_per_token_per_gpu:,} B/token/GPU, {blocks:,} blocks, {tokens:,} tokens, \"\n          f\"max concurrency at 32K: {conc:.2f}x\")\n```\n\nOutput:\n\n```text\nBF16 KV: 81,920 B/token/GPU, 26,947 blocks, 431,152 tokens, max concurrency at 32K: 13.16x\nFP8 KV: 40,960 B/token/GPU, 53,894 blocks, 862,304 tokens, max concurrency at 32K: 26.32x\n```\n\nThe FP8 KV cache doubles the capacity because each element takes 1 byte instead of 2."
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\n# (ttft_ms, tpot_ms) of 10 finished requests in a 5-second window\nresults = [(320, 41), (280, 38), (910, 44), (450, 52), (300, 47),\n           (260, 39), (1200, 61), (390, 45), (480, 49), (350, 36)]\nSLO_TTFT_MS, SLO_TPOT_MS, WINDOW_S = 500, 50, 5.0\n\ngood = [r for r in results if r[0] <= SLO_TTFT_MS and r[1] <= SLO_TPOT_MS]\nprint(f\"throughput {len(results) / WINDOW_S:.1f} req/s, goodput {len(good) / WINDOW_S:.1f} req/s, \"\n      f\"SLO attainment {len(good) / len(results):.0%}\")\n```\n\nOutput: `throughput 2.0 req/s, goodput 1.4 req/s, SLO attainment 70%`."
}
```

## 15. Links

- Previous: [L9: Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)
- Next part: [L1: Ways to host a model](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model)
- The request path inside an engine: [L1: The life of a request](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request)
- Metrics and benchmarks: [L2: Latency and throughput metrics](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)
- Containers and model loading for these engines: [L3: Containers and model loading](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading)
- Kubernetes deployments: [L4: Kubernetes for LLM serving](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving)
- The vLLM system as published: [08 Implementation: the vLLM system and its kernels](/notes/papers/llm-serving/2023-pagedattention/08-implementation) and [10 Limits and later work](/notes/papers/llm-serving/2023-pagedattention/10-limits-and-later-work)
- Interview drill: [L2: Drill: inference and cloud hosting](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud)

### Sources

All checked on 2026-10-15.

- vLLM docs, Architecture Overview: https://docs.vllm.ai/en/latest/design/arch_overview/
- vLLM docs, V1 guide: https://docs.vllm.ai/en/latest/usage/v1_guide/
- vLLM blog, "vLLM V1: A Major Upgrade to vLLM's Core Architecture," January 27, 2025: https://vllm.ai/blog/2025-01-27-v1-alpha-release
- vLLM docs, Engine Arguments: https://docs.vllm.ai/en/latest/configuration/engine_args/
- vLLM 0.31.0 on PyPI and its source: `vllm/engine/arg_utils.py`, `vllm/config/cache.py`, `vllm/config/scheduler.py`, `vllm/config/vllm.py`, `vllm/v1/core/kv_cache_utils.py`, `vllm/benchmarks/serve.py`, `vllm/benchmarks/datasets/datasets.py`, `vllm/entrypoints/`
- SGLang paper: https://arxiv.org/abs/2312.07104 and NeurIPS 2024 proceedings
- SGLang 0.5.21 on PyPI and its source: `sglang/srt/arg_groups/fields/`
- SGLang docs: https://docs.sglang.io/docs/advanced_features/radix_eviction_policy and https://docs.sglang.io/docs/advanced_features/sgl_model_gateway
- TensorRT-LLM docs (1.4.0rc0): https://nvidia.github.io/TensorRT-LLM/ , https://nvidia.github.io/TensorRT-LLM/legacy/tensorrt-backend-removal.html , https://nvidia.github.io/TensorRT-LLM/latest/features/kvcache.html , https://nvidia.github.io/TensorRT-LLM/latest/features/quantization.html
- NVIDIA Dynamo-Triton page: https://developer.nvidia.com/triton-inference-server
- NVIDIA Dynamo: https://github.com/ai-dynamo/dynamo
- Hugging Face TGI docs: https://huggingface.co/docs/text-generation-inference/index
- llama.cpp server README: https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md
- Ollama docs, OpenAI compatibility: https://docs.ollama.com/api/openai-compatibility
