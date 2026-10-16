---
title: "L2: Sizing GPUs for a model"
order: 2
summary: "How to choose the GPU type and the number of GPUs for a model: the GPU memory budget (weights, KV cache, activations, CUDA graphs, framework memory and gpu_memory_utilization), how vLLM computes the KV cache size at startup, worked examples for Llama-3.1-8B on an L4 and an H100 and for Llama-3.1-70B in BF16 and FP8, verified cloud instance types, and a throughput estimate from memory bandwidth."
status: not-started
tags: [cloud-hosting, gpu, sizing, kv-cache, vllm, tensor-parallelism, instance-types]
---

## 1. The question this idea answers

"Which GPU would you use for Llama-3.1-8B? How many GPUs for the 70B model? How many users can one GPU serve?" These are the first concrete questions after "how would you host it". A vague answer ("an A100 should be fine") fails the follow-up. A strong answer is a calculation.

Two limits decide the answer:

1. **Memory.** The weights, the KV cache of every running request and some working memory must all fit in GPU memory. If they do not fit, the server does not start, or it serves far fewer users than you planned.
2. **Memory bandwidth.** Decode reads all weights and the whole KV cache of the batch for every generated token ([Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode)). So the bytes per second that the GPU can read set the speed.

Memory decides *whether* and *how many*. Bandwidth decides *how fast*. This lesson does both, with exact numbers.

Two unit reminders from [Numbers in memory](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory):

- 1 GB = $10^9$ bytes. 1 GiB = $2^{30}$ = 1,073,741,824 bytes. vLLM prints memory in GiB. NVIDIA datasheets write "GB". AWS lists GPU memory in GiB.
- BF16 stores one number in 2 bytes. FP8 stores one number in 1 byte.

## 2. Mental model

> [!analogy] A hotel with one building per GPU
> GPU memory is a hotel building. The owner first keeps a small part of the building empty for safety (that is `1 - gpu_memory_utilization`). The **weights** are the staff wing: it has a fixed size, and the hotel cannot open without it. The **activations, CUDA graphs and framework memory** are the kitchen and the machine room: fixed space that the hotel needs to work. **Every room that is left becomes a guest room: the KV cache.** Each request is a guest who needs one room for every 16 tokens. Long stays need many rooms.
>
> So the number of guests is not "memory divided by something simple". It is "memory left after the staff wing, the kitchen and the safety margin, divided by the rooms each guest needs".
>
> **Where it stops working:** a hotel guest books rooms for the whole stay at check-in. vLLM gives a request a new block only when its tokens fill the last one ([PagedAttention](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm)). And with tensor parallelism, one guest takes a part of a room in every building at the same time. Each GPU stores its own share of the KV heads.

## 3. Terms

| Term | Plain meaning |
|---|---|
| GPU memory | The memory on the GPU board (HBM or GDDR). Weights and the KV cache must be here during inference. |
| memory bandwidth | Bytes per second that the GPU can read from its memory, for example about 3.35 TB/s for an H100 SXM. |
| weights memory | Parameters × bytes per parameter. |
| KV cache memory | Keys and values of all tokens of all running requests, in every layer. |
| activations | Temporary tensors of one forward pass. Their peak grows with the number of tokens in one step. |
| CUDA graph | A recorded sequence of GPU kernel launches that the GPU can replay with little CPU work. It needs its own memory. |
| non-torch memory | GPU memory that PyTorch does not track, for example the CUDA context and NCCL communication buffers. |
| `gpu_memory_utilization` | The fraction of the total GPU memory that one vLLM instance may use. Default 0.92 in vLLM 0.31.0. |
| `max_model_len` | The longest request (prompt plus output tokens) that the server accepts. |
| `max_num_seqs` | The largest number of requests in one batch. |
| `max_num_batched_tokens` | The largest number of tokens that one engine step processes. It also sets the size of the memory profiling run. |
| KV cache block | A fixed group of token slots in the paged KV cache. The default block size in vLLM is 16 tokens. |
| tensor parallelism (TP) | Splitting each layer's matrices across several GPUs, so that each GPU holds a part of the weights and of the KV heads. |
| concurrency | The number of requests that the server runs at the same time. |
| instance type | A cloud VM size with a fixed number and model of GPUs, for example `p5.48xlarge`. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. The memory budget

> [!key] One equation decides the KV cache
> $$
> \text{KV cache} = \text{total} \times \text{gpu\_memory\_utilization} - \text{weights} - \text{peak activations} - \text{non-torch memory} - \text{CUDA graphs}
> $$
> Everything that is left after the fixed costs becomes KV cache blocks. The KV cache sets how many requests run at the same time.

![Alt text: one bar per GPU setup, split into weights in gold, overhead in purple, KV cache in green and the safety margin in gray](/notes/media/llm-systems/figures/05-2-gpu-memory-budget.svg)

### 4.1 Weights

Weight memory is the number of parameters times the bytes per parameter:

$$
\text{weights} = P \times s_w
$$

Real numbers from the Hugging Face model pages (checked on 2026-10-15):

| Model | Parameters (from the Hub's safetensors metadata) | Bytes per parameter | Weight bytes | GiB |
|---|---|---|---|---|
| Llama-3.1-8B-Instruct, BF16 | 8,030,261,248 | 2 | 16,060,522,496 | 14.96 |
| Llama-3.1-70B-Instruct, BF16 | 70,553,706,496 | 2 | 141,107,412,992 | 131.42 |
| Llama-3.1-70B-Instruct, FP8 checkpoint | 2,102,666,336 in BF16 + 68,451,041,280 in FP8 | mixed | 72,656,373,952 | 67.67 |

The four safetensors shards of the 8B model total 16,060,556,376 bytes on the Hub. That is 33,880 bytes more than $P \times 2$. Interpretation of these notes: these bytes are the JSON headers of the four files and their 8-byte length fields (the format is in [L3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading)).

> [!note] Why an FP8 checkpoint is not exactly half
> The FP8 checkpoint used here (`RedHatAI/Meta-Llama-3.1-70B-Instruct-FP8`) keeps 2,102,666,336 parameters in BF16. Computed in these notes, they are exactly:
> - the input embedding and the output head: $2 \times 128256 \times 8192 = 2{,}101{,}346{,}304$,
> - the RMSNorm weights: $80 \times 2 \times 8192 + 8192 = 1{,}318{,}912$,
> - and 1,120 extra values. The total parameter count is 1,120 higher than the BF16 model. That matches 2 scale values for each of the 7 linear layers in each of the 80 layers ($80 \times 7 \times 2 = 1120$). Interpretation of these notes: one weight scale and one input scale per linear layer.
>
> So FP8 shrinks the linear layers, not the embeddings. 141.1 GB becomes 72.7 GB, not 70.6 GB. Quantization formats are in [Quantization](/notes/ai/llm-systems/04-inference/l7-quantization).

### 4.2 KV cache per token

The formula from [The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula):

$$
\text{KV bytes per token} = 2 \times L \times H_{kv} \times d_h \times s
$$

| Model | $L$ | $H_{kv}$ | $d_h$ | $s$ | Bytes per token |
|---|---|---|---|---|---|
| Llama-3.1-8B, BF16 cache | 32 | 8 | 128 | 2 | 131,072 = 128 KiB |
| Llama-3.1-70B, BF16 cache | 80 | 8 | 128 | 2 | 327,680 = 320 KiB |
| Llama-3.1-70B, FP8 cache | 80 | 8 | 128 | 1 | 163,840 = 160 KiB |

With tensor parallelism of size $T$, each GPU stores $H_{kv}/T$ of the KV heads for every token. vLLM's code says: "We will replicate the KV heads in the case where the number of KV heads is smaller than the tensor parallel size so each GPU has at least one KV head." So per GPU:

$$
\text{KV bytes per token per GPU} = 2 \times L \times \max\left(1, \left\lfloor H_{kv}/T \right\rfloor\right) \times d_h \times s
$$

For Llama-3.1-70B with $T = 4$: $2 \times 80 \times 2 \times 128 \times 2 = 81{,}920$ bytes per token on each GPU. Every GPU stores a slice of every token, so the number of tokens that fit is the same on all GPUs.

### 4.3 Activations, CUDA graphs and framework memory

These three are the "kitchen and machine room" of the hotel:

1. **Peak activations.** A forward pass creates temporary tensors. Examples: the hidden states, the Q, K and V projections and the MLP outputs of the current step. Their size grows with the number of tokens in one step, so it grows with `max_num_batched_tokens`.
2. **CUDA graphs.** vLLM records the kernel launches for common batch sizes and replays them during decode ([Containers and model loading](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) explains the startup cost). The recorded graphs keep memory pools.
3. **Non-torch memory.** The CUDA context, NCCL buffers for multi-GPU communication and some attention backend buffers. The vLLM source uses "memory used by NCCL" as its example of this category.

You cannot compute these three exactly by hand. vLLM measures them at startup. For planning, these notes **assume** an overhead of 1.5 GiB on a 22 GiB GPU. They assume 3 GiB on an 80 GiB GPU and 4 GiB on a 141 GiB GPU. These are assumptions for the worked examples, not measured values. The real value is in the startup log (section 5.3).

### 4.4 The default token budget depends on the GPU

`max_num_batched_tokens` sets the size of the profiling run, so it changes the activation peak. In vLLM 0.31.0 the default for the OpenAI-compatible server depends on the GPU (read from `vllm/engine/arg_utils.py`):

| GPU memory (as vLLM reads it) | `max_num_batched_tokens` | `max_num_seqs` |
|---|---|---|
| 160 GiB or more, for example B200 | 16,384 | 1,024 |
| 70 GiB or more and not an A100, for example H100, H200 | 8,192 | 1,024 |
| Other GPUs, for example L4, L40S, A100 | 2,048 | 256 |

The code comment explains the A100 exception: "Setting large `max_num_batched_tokens` for A100 reduces throughput".

### 4.5 `gpu_memory_utilization`

The vLLM 0.31.0 docstring: "The fraction of GPU memory to be used for the model executor, which can range from 0 to 1. ... If unspecified, will use the default value of 0.92. This is a per-instance limit, and only applies to the current vLLM instance."

Three facts that interviewers test:

1. It is a fraction of the **total** GPU memory, not of the free memory, and not of the KV cache.
2. The default changed. In vLLM 0.19.0 the default was 0.9. From vLLM 0.20.0 it is 0.92 (read from the source of both versions on PyPI, checked on 2026-10-15). Old tutorials say 0.9.
3. At startup vLLM checks that this much memory is free. If not, it stops with "Free memory on device ... is less than desired GPU memory utilization". The docstring's own example for two instances on one GPU: "you can set the GPU memory utilization to 0.5 for each instance".

## 5. How vLLM turns the budget into KV cache blocks

### 5.1 The startup algorithm

This is the sequence in the vLLM 0.31.0 GPU worker (`determine_available_memory` in `vllm/v1/worker/gpu_worker.py`), simplified:

1. Take a memory snapshot. Compute `requested_memory = ceil(total_memory * gpu_memory_utilization)`.
2. Load the weights. Record their size.
3. Run one forward pass with dummy inputs of `max_num_batched_tokens` tokens. Measure the memory consumed since startup and the transient activation peak.
4. Estimate the memory of the CUDA graphs. The log says this is the default "since v0.21.0". The environment variable `VLLM_MEMORY_PROFILER_ESTIMATE_CUDAGRAPHS=0` disables it.
5. Compute `available_kv_cache_memory = requested_memory - non_kv_cache_memory - cudagraph_memory_estimate`.
6. Divide the available memory into blocks of 16 tokens and allocate them all at once.

A user can skip the profiling with `--kv-cache-memory-bytes`. The docs warn: "kv_cache_memory_bytes (when not-None) ignores gpu_memory_utilization".

![Alt text: a step-by-step subtraction from 80 GiB to 455,823 tokens of KV cache for Llama-3.1-8B on one H100](/notes/media/llm-systems/figures/05-2-kv-budget-steps.svg)

### 5.2 The same calculation in Python

This calculator reproduces the budget for planning. It runs as shown:

```python
GiB = 2**30

def kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_elem=2, tp=1):
    heads_per_gpu = max(1, kv_heads // tp)          # vLLM replicates KV heads if tp > kv_heads
    return 2 * layers * heads_per_gpu * head_dim * bytes_per_elem

def kv_budget(gpu_gib, weight_bytes, overhead_gib, kv_per_token, util=0.92, tp=1):
    requested = gpu_gib * util                      # vLLM: total memory x gpu_memory_utilization
    weights = weight_bytes / tp / GiB               # weights are split across tp GPUs
    kv_gib = requested - weights - overhead_gib     # what is left becomes KV cache blocks
    tokens = int(kv_gib * GiB // kv_per_token)
    return kv_gib, tokens

kv8 = kv_bytes_per_token(32, 8, 128)
kv_gib, tokens = kv_budget(80, 16_060_522_496, 3.0, kv8)
print(f"8B on H100: KV {kv_gib:.2f} GiB, {tokens:,} tokens, {tokens/4096:.1f} requests of 4K")
kv70 = kv_bytes_per_token(80, 8, 128, tp=4)
kv_gib, tokens = kv_budget(80, 141_107_412_992, 3.0, kv70, tp=4)
print(f"70B TP=4 per GPU: KV {kv_gib:.2f} GiB, {tokens:,} tokens")
```

```text
8B on H100: KV 55.64 GiB, 455,823 tokens, 111.3 requests of 4K
70B TP=4 per GPU: KV 37.75 GiB, 494,742 tokens
```

Line by line:

- `max(1, kv_heads // tp)`: the per-GPU share of KV heads, with the replication rule of vLLM.
- `gpu_gib * util`: the requested memory of step 1.
- `weight_bytes / tp`: tensor parallelism splits the weights. This is approximate: small parts such as the norm weights are copied to every GPU.
- `overhead_gib`: the assumed sum of activations, non-torch memory and CUDA graphs.
- `// kv_per_token`: whole tokens only. vLLM then groups them in blocks of 16.

### 5.3 Read the real numbers in the startup log

vLLM prints the result of its own measurement. These log formats are in the vLLM 0.31.0 source:

```text
Available KV cache memory: <X> GiB
GPU KV cache size: <N> tokens, Maximum concurrency for <M> tokens per request: <C>x
```

`M` is `max_model_len`, and `C = N / M`. Always compare these two lines with your plan. If the measured KV memory is lower than planned, your overhead assumption was too small.

### 5.4 When the model does not fit

If even one request of `max_model_len` tokens does not fit, vLLM stops at startup with this message (from `vllm/v1/core/kv_cache_utils.py`):

```text
To serve at least one request with the model's max seq len (<max_model_len>), (<needed> GiB KV cache is needed, which is larger than the available KV cache memory (<available> GiB). Based on the available memory, the estimated maximum model length is <estimate>. Try increasing `gpu_memory_utilization` ... or decreasing `max_model_len` when initializing the engine.
```

If nothing is left for the cache at all, the message is "No available memory for the cache blocks."

## 6. Worked examples

> [!example] Worked example 1: Llama-3.1-8B in BF16 on one L4 (AWS `g6.xlarge`)
> AWS lists 22 GiB of GPU memory for `g6.xlarge`. The NVIDIA datasheet says "24GB" and "300GB/s".
>
> 1. Requested memory: $22 \times 0.92 = 20.24$ GiB.
> 2. Weights: $16{,}060{,}522{,}496 / 2^{30} = 14.96$ GiB.
> 3. Overhead (assumed): 1.5 GiB.
> 4. KV cache: $20.24 - 14.96 - 1.5 = 3.78$ GiB.
> 5. Tokens: $3.78 \times 2^{30} / 131{,}072 \approx 30{,}986$ tokens, which is $30{,}986 / 16 \approx 1{,}936$ blocks.
> 6. Requests of 4,096 tokens: $30{,}986 / 4096 \approx 7.6$, so 7 full-length requests at the same time.
> 7. Requests of 32,768 tokens: one needs $32768 \times 131072 = 4$ GiB, which is more than 3.78 GiB. **Not even one fits.**
>
> The trap: vLLM takes the default `max_model_len` from the model config: 131,072 tokens. One such request needs $131072 \times 131072 = 16$ GiB of cache. So vLLM with default settings **refuses to start** on this GPU with the "To serve at least one request" error. Fix: `--max-model-len 8192` (or less), or quantize the weights, or choose a bigger GPU.

> [!example] Worked example 2: Llama-3.1-8B in BF16 on one H100 80 GB (AWS `p5.4xlarge`)
> 1. Requested: $80 \times 0.92 = 73.6$ GiB.
> 2. Weights: 14.96 GiB. Overhead (assumed): 3 GiB.
> 3. KV cache: $73.6 - 14.96 - 3 = 55.64$ GiB.
> 4. Tokens: $55.64 \times 2^{30} / 131072 \approx 455{,}823$, which is about 28,488 blocks.
> 5. Requests of 4,096 tokens: $455{,}823 / 4096 \approx 111.3$.
> 6. Requests of 32,768 tokens: $455{,}823 / 32768 \approx 13.9$.
> 7. Requests of 131,072 tokens (the default `max_model_len`): about 3.48, so the server starts.
>
> Real requests are rarely full length. With an average of 1,500 tokens in the cache per request, about $455{,}823 / 1500 \approx 304$ requests fit. The `max_num_seqs` default of 1,024 for this GPU does not limit that.

> [!example] Worked example 3: Llama-3.1-70B in BF16 needs at least two 80 GB GPUs, and in practice four
> Weights: 131.42 GiB. One H100 gives 73.6 GiB, so one GPU is impossible.
>
> | Setup | Weights per GPU | KV per GPU, 3 GiB overhead | KV bytes per token per GPU | Tokens | 4K requests | 32K requests |
> |---|---|---|---|---|---|---|
> | TP=2 on 2 × H100 | 65.71 GiB | 4.89 GiB | 163,840 | 32,058 | 7.8 | 0.98 |
> | TP=4 on 4 × H100 | 32.85 GiB | 37.75 GiB | 81,920 | 494,742 | 120.8 | 15.1 |
> | TP=8 on 8 × H100 | 16.43 GiB | 54.17 GiB | 40,960 | 1,420,110 | 346.7 | 43.3 |
>
> TP=2 fits the weights but leaves only about 32,000 tokens of cache: not even one 32K request. So TP=2 is a demo, not a service. TP=4 is the practical minimum for real traffic, and one `p5.48xlarge` (8 × H100) can run two TP=4 replicas. TP=8 gives about 2.9 times the cache of TP=4 for twice the GPUs.
>
> Can you choose TP=3? No. Llama-3.1-70B has 64 query heads, and vLLM checks: "Total number of attention heads (64) must be divisible by tensor parallel size (3)."

> [!example] Worked example 4: Llama-3.1-70B in FP8 on one H200 (AWS `p5e.48xlarge` or `p5en.48xlarge`)
> AWS lists 141 GiB per H200.
>
> 1. Requested: $141 \times 0.92 = 129.72$ GiB.
> 2. Weights of the FP8 checkpoint: 67.67 GiB. Overhead (assumed): 4 GiB.
> 3. KV cache: $129.72 - 67.67 - 4 = 58.05$ GiB.
> 4. With a BF16 cache (320 KiB per token): about 190,229 tokens, so about 46 requests of 4K or 5.8 of 32K.
> 5. With an FP8 cache (`--kv-cache-dtype fp8`, 160 KiB per token): about 380,459 tokens, twice as many.
>
> The same FP8 model on one H100 leaves $73.6 - 67.67 - 3 = 2.93$ GiB, about 9,612 tokens. That works for a test, not for users. One H200 with FP8 weights holds the model that needs four H100s in BF16, with less cache: about 190,000 tokens instead of about 495,000. The quality of FP8 must be checked with your own evaluation ([Quantization](/notes/ai/llm-systems/04-inference/l7-quantization)).

### 6.1 Summary of the examples

| Model and setup | GPUs | KV tokens (approximate) | Full 4K requests | Full 32K requests |
|---|---|---|---|---|
| 8B BF16, L4 | 1 | 30,986 | 7 | 0 |
| 8B BF16, H100 | 1 | 455,823 | 111 | 13 |
| 70B BF16, TP=2, H100 | 2 | 32,058 | 7 | 0 |
| 70B BF16, TP=4, H100 | 4 | 494,742 | 120 | 15 |
| 70B BF16, TP=8, H100 | 8 | 1,420,110 | 346 | 43 |
| 70B FP8, H200, BF16 cache | 1 | 190,229 | 46 | 5 |
| 70B FP8, H200, FP8 cache | 1 | 380,459 | 92 | 11 |

All values depend on the assumed overhead. Treat them as plans and check them against the startup log.

```video
{
  "src": "/notes/media/llm-systems/manim/m22-gpu-memory-budget.mp4",
  "caption": "An 80 GiB H100 fills step by step: the safety margin, the weights, the fixed overhead, and then KV cache blocks until requests stop fitting."
}
```

## 7. Cloud instance types with GPUs

### 7.1 AWS

From the AWS EC2 accelerated computing specifications (checked on 2026-10-15). GPU memory is in GiB, as AWS lists it.

| Instance type | GPUs | GPU model | GPU memory (GiB) |
|---|---|---|---|
| `p6-b200.48xlarge` | 8 | B200 | 1,432 (8 × 179) |
| `p5en.48xlarge` | 8 | H200 | 1,128 (8 × 141) |
| `p5e.48xlarge` | 8 | H200 | 1,128 (8 × 141) |
| `p5.48xlarge` | 8 | H100 | 640 (8 × 80) |
| `p5.4xlarge` | 1 | H100 | 80 |
| `p4de.24xlarge` | 8 | A100 | 640 (8 × 80) |
| `p4d.24xlarge` | 8 | A100 | 320 (8 × 40) |
| `g6e.xlarge` / `g6e.12xlarge` / `g6e.48xlarge` | 1 / 4 / 8 | L40S | 44 / 178 / 357 |
| `g6.xlarge` / `g6.12xlarge` / `g6.48xlarge` | 1 / 4 / 8 | L4 | 22 / 89 / 178 |
| `g5.xlarge` / `g5.12xlarge` / `g5.48xlarge` | 1 / 4 / 8 | A10G | 22 / 89 / 178 |

### 7.2 Azure

From the Azure VM size pages on Microsoft Learn (checked on 2026-10-15):

| Size | GPUs | GPU memory |
|---|---|---|
| `Standard_ND96isr_H100_v5` | 8 × H100 | 80 GB each, NVLink 4.0 inside the VM, 3.2 Tbps InfiniBand per VM |
| `Standard_ND96isr_H200_v5` | 8 | 1,128 GB in total |
| `Standard_NC24ads_A100_v4` | 1 × A100 PCIe | 80 GB |
| `Standard_NC48ads_A100_v4` | 2 × A100 PCIe | 160 GB in total |
| `Standard_NC96ads_A100_v4` | 4 × A100 PCIe | 320 GB in total |
| `Standard_NC40ads_H100_v5` | 1 | 94 GB |
| `Standard_NC80adis_H100_v5` | 2 | 188 GB in total |

94 GB per GPU matches the H100 NVL datasheet value (interpretation of these notes, because the size table does not name the GPU variant).

### 7.3 Google Cloud

Google's accelerator-optimized machine pages list these series and GPU models (checked on 2026-10-15):

| Series | GPU model |
|---|---|
| A4 | B200 |
| A3 Ultra | H200 |
| A3 Mega | H100 |
| A3 High | H100, with 1, 2, 4 or 8 GPUs |
| A2 | A100 |
| G4 | RTX PRO 6000 |
| G2 | L4 |

The official pages did not show readable machine type tables in this check. So the exact machine type names and the memory per type are not listed here. Check them in the console of your project.

### 7.4 GPU facts that change the choice

From the NVIDIA product pages (checked on 2026-10-15). Tensor Core values are dense BF16. NVIDIA prints them "with sparsity", which is twice the dense value.

| GPU | Memory | Bandwidth | Dense BF16 | GPU-to-GPU link |
|---|---|---|---|---|
| L4 | 24 GB GDDR6 | 300 GB/s | about 121 TFLOPS | PCIe Gen4 x16, 64 GB/s |
| L40S | 48 GB GDDR6 | 864 GB/s | 362 TFLOPS | PCIe Gen4 x16, 64 GB/s bidirectional |
| A100 80 GB SXM | 80 GB HBM2e | 2,039 GB/s | 312 TFLOPS (the value NVIDIA prints for the A100 80 GB PCIe) | NVLink (SXM) |
| H100 SXM | 80 GB | 3.35 TB/s | about 989 TFLOPS | NVLink 900 GB/s |
| H100 NVL | 94 GB | 3.9 TB/s | about 835 TFLOPS | NVLink 600 GB/s |
| H200 SXM | 141 GB | 4.8 TB/s | about 989 TFLOPS | NVLink 900 GB/s |

Two consequences:

1. **TP needs a fast link.** Tensor parallelism performs all-reduce operations in every layer ([Parallelism](/notes/ai/llm-systems/04-inference/l8-parallelism)). L4 and L40S cards talk over PCIe. So TP=4 on four L40S works, but each token pays more communication time than on H100s with NVLink.
2. **Bandwidth sets decode speed.** The next section shows the numbers.

## 8. Speed: estimate throughput from bandwidth

### 8.1 The decode step

In one decode step the GPU reads every weight once and reads the KV cache of every sequence in the batch ([Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)). If the step is memory-bound:

$$
t_{\text{step}} \approx \frac{\text{weight bytes} + \text{batch} \times \text{context} \times \text{KV bytes per token}}{\text{bandwidth}}
$$

$$
\text{total tokens per second} \approx \frac{\text{batch}}{t_{\text{step}}}, \qquad \text{tokens per second per sequence} \approx \frac{1}{t_{\text{step}}}
$$

These are **upper bounds**. Real kernels reach only a part of the datasheet bandwidth, and the engine has CPU and scheduling overhead.

> [!example] Worked example 5: decode speed of Llama-3.1-8B in BF16
> Batch 1, context ignored (the weights dominate):
>
> | GPU | Step time | Tokens per second |
> |---|---|---|
> | L4 (300 GB/s) | $16.06 / 300 = 53.5$ ms | 18.7 |
> | L40S (864 GB/s) | 18.6 ms | 53.8 |
> | A100 80 GB SXM (2,039 GB/s) | 7.9 ms | 127.0 |
> | H100 SXM (3.35 TB/s) | 4.8 ms | 208.6 |
> | H200 (4.8 TB/s) | 3.3 ms | 298.9 |
>
> Batch 32 on an H100, 2,048 tokens of context per sequence:
>
> 1. KV bytes read: $32 \times 2048 \times 131072 = 8.59$ GB.
> 2. Step time: $(16.06 + 8.59) / 3350 = 7.36$ ms.
> 3. Total: $32 / 0.00736 \approx 4{,}349$ tokens per second. Per sequence: about 136 tokens per second.
> 4. Compute check: $2 \times 8.03 \times 10^9 \times 32 = 5.1 \times 10^{11}$ FLOPs, which takes $0.52$ ms at 989 TFLOPS. That is far below 7.36 ms, so the step is still memory-bound.
>
> Batch 8 on an L4 with the same context: KV 2.15 GB and a step of 60.7 ms. That gives about 132 tokens per second in total and 16.5 per sequence.

```plot
{
  "title": "Ideal total decode throughput of Llama-3.1-8B on one H100 with 2,048 tokens of context (blue)",
  "xAxis": { "label": "batch size (concurrent sequences)", "domain": [1, 222] },
  "yAxis": { "label": "total tokens per second", "domain": [0, 11000] },
  "disableZoom": true,
  "data": [
    { "fn": "3350*x/(16.06+0.2684*x)", "color": "#1E6091" }
  ]
}
```

```plot
{
  "title": "Ideal decode speed per sequence for the same setup (red)",
  "xAxis": { "label": "batch size (concurrent sequences)", "domain": [1, 222] },
  "yAxis": { "label": "tokens per second per sequence", "domain": [0, 220] },
  "disableZoom": true,
  "data": [
    { "fn": "3350/(16.06+0.2684*x)", "color": "#C81D25" }
  ]
}
```

Both curves use the step-time formula, with 16.06 GB of weights, 0.2684 GB of cache per sequence ($2048 \times 131072$ bytes) and 3,350 GB/s. Computed values: at batch 1, about 205 tokens per second in total and per sequence (the table above ignores the cache and gives 208.6). At batch 32, about 4,349 in total and 136 per sequence. At batch 200, about 9,607 in total and 48 per sequence. The plots stop at batch 222 because the cache of example 2 holds about $455{,}823 / 2048 \approx 222$ sequences of 2,048 tokens. The two curves show the core trade-off: batching raises the total throughput and lowers the speed that each user sees.

### 8.2 Prefill and time to first token

Prefill is compute-bound for long prompts. Its FLOPs are about $2 \times P \times n_{\text{prompt}}$:

$$
2 \times 8.03 \times 10^9 \times 2000 = 3.21 \times 10^{13} \text{ FLOPs}
$$

At an ideal 989 TFLOPS (H100) that is about 32.5 ms. At about 121 TFLOPS (L4) it is about 265 ms. Real kernels reach less than the peak, so measure. The time to first token is this prefill time plus queueing time.

### 8.3 A sizing procedure

1. **Fix the model and the precision.** Compute the weight bytes.
2. **Fix the traffic.** Peak concurrent requests and the average and maximum tokens per request (prompt plus output).
3. **Compute the KV need.** Concurrent requests × average tokens × KV bytes per token (per GPU if TP).
4. **Choose a GPU and a TP size** so that $0.92 \times \text{memory} - \text{weights per GPU} - \text{overhead}$ covers the KV need. TP must divide the number of attention heads.
5. **Check the speed.** Estimate the step time from bandwidth at the planned batch. Compare TPOT with the target.
6. **Choose the number of replicas.** Total throughput need divided by the throughput per replica, plus one replica for failures.
7. **Measure.** Start the server, read the two log lines of section 5.3, and run a benchmark at the planned concurrency ([Latency and throughput metrics](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)).

### Exercises

1. **A fit check.** Write `fits(gpu_gib, n_gpus, params, bytes_per_param, layers, kv_heads, head_dim, kv_bytes, max_model_len, overhead_gib, util=0.92)` that returns `(True, tokens)` if one request of `max_model_len` tokens fits, and `(False, tokens)` if not.
   - Acceptance test: Llama-3.1-8B in BF16 on one 22 GiB GPU with `max_model_len=131072` and overhead 1.5 returns `False`. With `max_model_len=8192` it returns `True` with about 30,986 tokens.
   - Hint 1: reuse `kv_bytes_per_token` and `kv_budget` from section 5.2.
   - Hint 2: compare the token capacity with `max_model_len`, not with the batch.
2. **The smallest TP.** Write `min_tp(...)`. It returns the smallest TP from `[1, 2, 4, 8]` that divides 64 attention heads and gives at least `need_tokens` of cache on 80 GiB GPUs.
   - Acceptance test: Llama-3.1-70B in BF16 with `need_tokens=100_000` and overhead 3 returns 4.
   - Hint 1: TP=1 fails because the weights alone are larger than 73.6 GiB, so the KV value is negative.
   - Hint 2: loop over the candidates in order and return the first that passes.
3. **A decode bound.** Write `decode_bound(weight_bytes, bandwidth_bps, batch, context, kv_per_token)` that returns total and per-sequence tokens per second.
   - Acceptance test: the 8B model on an H100 at batch 32 and context 2,048 gives about 4,349 and 136.
   - Hint 1: add the weight bytes and the KV bytes of the whole batch.
   - Hint 2: one step produces one token for each sequence.

## 9. Common mistakes

1. **"GPU memory minus the weights is the KV cache."** vLLM first takes only `gpu_memory_utilization` (0.92 by default) of the total. Then activations, CUDA graphs and non-torch memory take their share. On a small GPU these fixed costs are a large fraction.
2. **"`gpu_memory_utilization` is the share of memory for the KV cache."** It is the share of the total GPU memory that the whole vLLM instance may use: weights, overhead and cache together.
3. **"If the weights fit, the model fits."** The 70B model fits on 2 × H100 with TP=2, but only about 32,000 tokens of cache remain. A server must also hold the cache of many requests.
4. **"The default context length is harmless."** vLLM takes `max_model_len` from the model config (131,072 for Llama-3.1). On a small GPU the server then refuses to start. Set `--max-model-len` to what the product needs.
5. **"More GPUs in TP always make each token faster."** TP divides the bytes per GPU, but it adds all-reduce communication in every layer. Over PCIe this cost is high.
6. **"The datasheet says 24 GB, so I have 24 GiB."** AWS lists 22 GiB for the L4 instances. Use the cloud's GiB value and the startup log, not the marketing number.
7. **"Bandwidth math gives the real throughput."** It gives an upper bound. Real throughput is lower, so always benchmark.

## 10. One-minute explanation

I size GPUs with a memory budget first and a bandwidth estimate second. vLLM takes `gpu_memory_utilization` of the total memory, 0.92 by default since vLLM 0.20.0. From that it subtracts the weights and the peak activations of a profiling run with `max_num_batched_tokens` tokens. It also subtracts the CUDA graph memory and non-torch memory such as NCCL buffers. Everything that remains becomes KV cache blocks of 16 tokens, and the number of cached tokens sets the concurrency. For Llama-3.1-8B in BF16 on an H100, about 55.6 GiB remain. That is about 456,000 tokens at 128 KiB per token, or about 111 requests of 4K. On an L4 only about 31,000 tokens remain, and the default context of 131,072 tokens does not even fit, so the server refuses to start. The 70B model needs 131 GiB for its weights, so TP=2 on two H100s barely fits and leaves almost no cache. TP=4 is the practical minimum, or FP8 on one H200. For speed, a decode step reads all weights plus the batch's cache. So the step time is about bytes divided by bandwidth: about 4.8 ms for the 8B model on an H100 at batch 1. Batching raises total throughput until the cache is full, and it lowers the speed each user sees. I always confirm the plan with the startup log and a benchmark.

## 11. Check questions

```check
{
  "question": "A teammate sets `--gpu-memory-utilization 0.5` and says: \"Now half of the memory goes to the KV cache.\" Correct the statement and compute the KV cache for Llama-3.1-8B in BF16 on one 80 GiB H100 with this value (overhead 3 GiB).",
  "hint": "The fraction applies to the total memory of the whole instance, before the weights.",
  "answer": "`gpu_memory_utilization` is the fraction of the **total** GPU memory that the whole vLLM instance may use: weights, activations, CUDA graphs, non-torch memory and the KV cache together. The vLLM docstring calls it \"a per-instance limit\".\n\nWith 0.5:\n\n1. Requested: $80 \\times 0.5 = 40$ GiB.\n2. Weights: 14.96 GiB. Overhead (assumed): 3 GiB.\n3. KV cache: $40 - 14.96 - 3 = 22.04$ GiB.\n4. Tokens: $22.04 \\times 2^{30} / 131072 \\approx 180{,}571$.\n\nSo the KV cache is about 55% of the requested 40 GiB, not \"half of the memory\". With the default 0.92 the cache is 55.64 GiB. A value of 0.5 makes sense when two vLLM instances share one GPU."
}
```

```check
{
  "question": "Interview follow-up: you start `vllm serve meta-llama/Llama-3.1-8B-Instruct` on an AWS `g6.xlarge` (one L4) with default flags, and it stops at startup. Explain the error with numbers and give three fixes.",
  "hint": "Where does the default `max_model_len` come from, and how much cache does one such request need?",
  "answer": "1. AWS lists 22 GiB for the L4 in `g6.xlarge`. vLLM requests $22 \\times 0.92 = 20.24$ GiB.\n2. The BF16 weights take 14.96 GiB. With about 1.5 GiB of overhead (assumed), about 3.78 GiB remain for the cache: about 30,986 tokens at 131,072 bytes per token.\n3. The default `max_model_len` comes from the model config: 131,072 tokens. One such request needs $131072 \\times 131072 = 16$ GiB of cache.\n4. vLLM checks that at least one request of `max_model_len` fits. It does not, so it stops with \"To serve at least one request with the model's max seq len (131072), (16.00 GiB KV cache is needed, which is larger than the available KV cache memory ...\".\n\nFixes:\n\n- Set `--max-model-len 8192` (or what the product needs). Then about 7 full-length requests fit.\n- Quantize: FP8 or INT4 weights free GPU memory for the cache (and an FP8 cache halves the bytes per token). Check quality.\n- Choose a GPU with more memory, for example an L40S (`g6e.xlarge`, 44 GiB) or an H100.\n\nRaising `gpu_memory_utilization` to 0.95 adds only $22 \\times 0.03 = 0.66$ GiB, which does not reach 16 GiB."
}
```

```check
{
  "question": "Interview follow-up: compute the KV cache for Llama-3.1-70B at 128K tokens (131,072) and batch 8 in BF16. Can 8 × H100 with TP=8 serve it? What does an FP8 cache change?",
  "hint": "327,680 bytes per token in total. With TP=8 each GPU stores one KV head, so 40,960 bytes per token per GPU.",
  "answer": "Total cache:\n\n$$\n327{,}680 \\times 131{,}072 \\times 8 = 343{,}597{,}383{,}680 \\text{ bytes} = 320 \\text{ GiB}\n$$\n\nPer GPU with TP=8: $320 / 8 = 40$ GiB, because each GPU stores 1 of the 8 KV heads.\n\nBudget per H100 (overhead 3 GiB assumed): $73.6 - 131.42/8 - 3 = 73.6 - 16.43 - 3 = 54.17$ GiB. That holds about 1,420,110 tokens per GPU at 40,960 bytes each.\n\nNeed: $131072 \\times 8 = 1{,}048{,}576$ tokens. 1,420,110 > 1,048,576, so yes, it fits, with about 371,000 tokens to spare.\n\nWith an FP8 cache the bytes per token halve: 20,480 per GPU, so the capacity becomes about 2,840,221 tokens, enough for about 21 such requests instead of 10. The cost: possible quality loss, which you must evaluate."
}
```

```check
{
  "question": "Why can you not run Llama-3.1-70B with `--tensor-parallel-size 3` in vLLM, and what happens with TP=16 for the KV heads?",
  "hint": "Count the query heads and the KV heads of the model.",
  "answer": "Llama-3.1-70B has 64 query heads and 8 KV heads. vLLM checks that the total number of attention heads is divisible by the TP size. $64 / 3$ is not a whole number, so vLLM raises: \"Total number of attention heads (64) must be divisible by tensor parallel size (3).\"\n\nWith TP=16, $64 / 16 = 4$ query heads per GPU is fine, but $8 / 16$ is less than one KV head. vLLM's rule is `max(1, total_num_kv_heads // tensor_parallel_size)`, so each GPU stores 1 KV head: the KV heads are **replicated**, each one on two GPUs. The cache per GPU then stops shrinking: TP=16 stores the same 40,960 bytes per token per GPU as TP=8, and half of the KV memory of the cluster holds copies."
}
```

```check
{
  "question": "Interview follow-up: estimate the decode speed of Llama-3.1-8B at batch 1 on an L4, an L40S and an H100. Why is the L40S faster than the L4 although both are PCIe cards?",
  "hint": "Batch 1 decode reads all weights once per token. Divide bytes by bandwidth.",
  "answer": "Step time ≈ weight bytes / bandwidth, with 16.06 GB of BF16 weights:\n\n| GPU | Bandwidth | Step time | Tokens per second (upper bound) |\n|---|---|---|---|\n| L4 | 300 GB/s | 53.5 ms | 18.7 |\n| L40S | 864 GB/s | 18.6 ms | 53.8 |\n| H100 SXM | 3,350 GB/s | 4.8 ms | 208.6 |\n\nThe L40S is about $864 / 300 = 2.9$ times faster because its memory bandwidth is 2.9 times higher. Decode at small batch is memory-bound, so the TFLOPS do not matter much. PCIe matters only for traffic between GPUs (tensor parallelism) and between the host and the GPU, not for reading weights from the GPU's own memory."
}
```

```check
{
  "question": "Why is the FP8 checkpoint of Llama-3.1-70B 72.7 GB and not 70.6 GB? Which parts stay in BF16?",
  "hint": "Count the embedding and the output head.",
  "answer": "The FP8 checkpoint quantizes only the linear layers inside the transformer blocks. These stay in BF16 (computed in these notes from the Hub's parameter counts):\n\n- input embedding and output head (not tied): $2 \\times 128256 \\times 8192 = 2{,}101{,}346{,}304$ parameters,\n- RMSNorm weights: $80 \\times 2 \\times 8192 + 8192 = 1{,}318{,}912$,\n- 1,120 scale values (2 per linear layer: $80 \\times 7 \\times 2$, interpretation of these notes).\n\nTotal BF16: 2,102,666,336 parameters, which is 4.21 GB. FP8: 68,451,041,280 parameters, which is 68.45 GB. Sum: 72.66 GB. The embedding and the head are large because the vocabulary has 128,256 entries, and quantizing them hurts quality more for little speed gain."
}
```

```check
{
  "question": "A product needs 300 concurrent chats on Llama-3.1-8B with an average of 3,000 tokens in the cache each, and a decode speed of at least 40 tokens per second per user. Using the bandwidth bound, is one H100 enough? How many replicas would you deploy?",
  "hint": "Check memory first (tokens), then speed at that batch.",
  "answer": "Memory: $300 \\times 3000 = 900{,}000$ tokens. One H100 holds about 455,823 tokens (example 2). So one GPU is not enough for memory: at least 2 replicas.\n\nSpeed with 2 replicas, 150 chats each:\n\n1. KV bytes read per step: $150 \\times 3000 \\times 131072 = 58.98$ GB.\n2. Step time: $(16.06 + 58.98) / 3350 = 22.4$ ms.\n3. Per user: $1 / 0.0224 \\approx 44.6$ tokens per second, which meets 40, but only as an upper bound.\n\nReal kernels do not reach the full datasheet bandwidth, so 44.6 is optimistic. A safer plan: 3 replicas (100 chats each: step about 16.5 ms, about 60 tokens per second per user as a bound), plus one more replica so that a failure does not break the target. Then benchmark at the real concurrency."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\nGiB = 2**30\n\ndef kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_elem=2, tp=1):\n    return 2 * layers * max(1, kv_heads // tp) * head_dim * bytes_per_elem\n\ndef kv_budget(gpu_gib, weight_bytes, overhead_gib, kv_per_token, util=0.92, tp=1):\n    kv_gib = gpu_gib * util - weight_bytes / tp / GiB - overhead_gib\n    tokens = int(kv_gib * GiB // kv_per_token) if kv_gib > 0 else 0\n    return kv_gib, tokens\n\ndef fits(gpu_gib, n_gpus, params, bytes_per_param, layers, kv_heads, head_dim,\n         kv_bytes, max_model_len, overhead_gib, util=0.92):\n    kv_pt = kv_bytes_per_token(layers, kv_heads, head_dim, kv_bytes, tp=n_gpus)\n    _, tokens = kv_budget(gpu_gib, params * bytes_per_param, overhead_gib, kv_pt, util, tp=n_gpus)\n    return tokens >= max_model_len, tokens\n\nprint(fits(22, 1, 8_030_261_248, 2, 32, 8, 128, 2, 131072, 1.5))  # (False, 30986)\nprint(fits(22, 1, 8_030_261_248, 2, 32, 8, 128, 2, 8192, 1.5))    # (True, 30986)\n```\n\nThe key line is `tokens >= max_model_len`: vLLM refuses to start when even one request of the maximum length cannot be cached. The guard `if kv_gib > 0` returns 0 tokens when the weights alone do not fit."
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\ndef min_tp(params, bytes_per_param, layers, kv_heads, head_dim, n_heads,\n           need_tokens, overhead_gib, gpu_gib=80, util=0.92):\n    for tp in [1, 2, 4, 8]:\n        if n_heads % tp != 0:\n            continue                      # vLLM rejects a TP that does not divide the heads\n        kv_pt = kv_bytes_per_token(layers, kv_heads, head_dim, 2, tp=tp)\n        _, tokens = kv_budget(gpu_gib, params * bytes_per_param, overhead_gib, kv_pt, util, tp=tp)\n        if tokens >= need_tokens:\n            return tp, tokens\n    return None, 0\n\nprint(min_tp(70_553_706_496, 2, 80, 8, 128, 64, 100_000, 3.0))  # (4, 494742)\n```\n\nIt uses `kv_bytes_per_token` and `kv_budget` from exercise 1. TP=1: the weights (131.42 GiB) exceed 73.6 GiB, so 0 tokens. TP=2: about 32,058 tokens, below 100,000. TP=4: about 494,742 tokens, which passes."
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\ndef decode_bound(weight_bytes, bandwidth_bps, batch, context, kv_per_token):\n    step = (weight_bytes + batch * context * kv_per_token) / bandwidth_bps\n    return batch / step, 1 / step\n\ntotal, per_seq = decode_bound(16_060_522_496, 3.35e12, 32, 2048, 131072)\nprint(round(total), round(per_seq, 1))  # 4349 135.9\n```\n\n- `batch * context * kv_per_token`: every sequence reads its whole cache in every step.\n- `batch / step`: one step produces one token per sequence.\n- The result is an upper bound: it ignores compute time, kernel efficiency and scheduling overhead."
}
```

## 12. Links

- Previous lesson: [Ways to host a model](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model)
- Next lesson: [Containers and model loading](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading)
- Foundations: [Numbers in memory](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory), [GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth), [The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula), [Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode)
- Inference: [Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound), [Quantization](/notes/ai/llm-systems/04-inference/l7-quantization), [Parallelism](/notes/ai/llm-systems/04-inference/l8-parallelism), [Serving engines](/notes/ai/llm-systems/04-inference/l10-serving-engines)
- Cost of the chosen GPUs: [Cost math](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math)
- The paper: [Where does KV cache memory go?](/notes/papers/llm-serving/2023-pagedattention/03-the-question), [The KV cache manager](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager)

### Sources

All checked on 2026-10-15.

- vLLM 0.31.0 source distribution on PyPI (`vllm/config/cache.py`, `vllm/engine/arg_utils.py`, `vllm/v1/worker/gpu_worker.py`, `vllm/utils/mem_utils.py`, `vllm/v1/core/kv_cache_utils.py`, `vllm/config/model.py`): https://pypi.org/project/vllm/0.31.0/
- vLLM 0.19.0 and 0.20.0 source distributions (the default of `gpu_memory_utilization`): https://pypi.org/project/vllm/#history
- vLLM engine arguments: https://docs.vllm.ai/en/latest/configuration/engine_args/
- Hugging Face model API, Llama-3.1-8B-Instruct (parameters and shard sizes): https://huggingface.co/api/models/meta-llama/Llama-3.1-8B-Instruct
- Hugging Face model API, Llama-3.1-70B-Instruct: https://huggingface.co/api/models/meta-llama/Llama-3.1-70B-Instruct
- Hugging Face model API, RedHatAI/Meta-Llama-3.1-70B-Instruct-FP8: https://huggingface.co/api/models/RedHatAI/Meta-Llama-3.1-70B-Instruct-FP8
- AWS EC2 accelerated computing instance specifications: https://docs.aws.amazon.com/ec2/latest/instancetypes/ac.html
- Azure ND H100 v5: https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ndh100v5-series
- Azure NC A100 v4, ND H200 v5 and NCads H100 v5 size tables (Microsoft Learn source): https://github.com/MicrosoftDocs/azure-compute-docs/tree/main/articles/virtual-machines/sizes/gpu-accelerated
- Google Cloud accelerator-optimized machines: https://docs.cloud.google.com/compute/docs/accelerator-optimized-machines
- Google Cloud, understand GPUs (A3 High GPU counts): https://docs.cloud.google.com/ai-hypercomputer/docs/understand-gpus
- NVIDIA L4: https://www.nvidia.com/en-us/data-center/l4/
- NVIDIA L40S: https://www.nvidia.com/en-us/data-center/l40s/
- NVIDIA A100: https://www.nvidia.com/en-us/data-center/a100/
- NVIDIA H100: https://www.nvidia.com/en-us/data-center/h100/
- NVIDIA H200: https://www.nvidia.com/en-us/data-center/h200/
