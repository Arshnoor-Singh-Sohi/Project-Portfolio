---
title: "L3: The KV cache size formula"
order: 3
summary: "The KV cache holds 2 x L x H_kv x d_h x s bytes per token. This lesson derives the formula factor by factor, computes it for real models from their configs, and uses it to find how many requests fit on a GPU and when the cache outgrows the weights."
status: not-started
tags: [kv-cache, memory, gqa, mla, capacity, formula]
---

## 1. The question this idea answers

A serving engine must know, before it accepts a request, whether the request's KV cache will fit in GPU memory. A capacity planner must know how many requests one GPU can serve at the same time. An interviewer asks: "Write the formula for the size of the KV cache. Now compute it for Llama-3.1-70B at 128K tokens and batch 8."

This lesson answers with one formula:

$$
\text{KV bytes} = 2 \times L \times H_{kv} \times d_h \times s \times T \times B
$$

It derives every factor, checks the formula against the numbers in the vLLM paper, and computes it for real models from their configuration files. Then it uses the formula for three engineering questions:

1. How many requests fit on one GPU?
2. When does the cache become larger than the model weights?
3. What changes the formula: GQA, MLA, FP8, sliding windows and tensor parallelism?

## 2. Mental model

> [!analogy] A hotel where every guest takes a room on every floor
> Each new guest (token) takes one room on each of $L$ floors (layers). Each room has $H_{kv}$ lockers (KV heads). Each locker holds two folders, the key and the value. Each folder has $d_h$ pages, and each page weighs $s$ bytes. So one guest adds $2 \times L \times H_{kv} \times d_h \times s$ bytes to the hotel. A party of $B$ groups with $T$ guests each multiplies that by $T \times B$.
>
> The hotel is the GPU. The furniture (the model weights) is already inside and never leaves. Only the space left after the furniture can hold guests.
>
> **Where it stops working:** real guests do not arrive with a known length of stay. A request does not announce its output length, so an engine either reserves rooms in advance and wastes them, or allocates rooms as guests arrive. Also, some hotels store a compressed folder per guest (MLA), and some evict old guests (sliding windows). The formula then changes.

## 3. Terms

| Term | Plain meaning |
|---|---|
| byte | 8 bits. The unit of memory. |
| KiB, MiB, GiB | Binary units: $2^{10}$, $2^{20}$ and $2^{30}$ bytes. |
| KB, MB, GB | Decimal units: $10^{3}$, $10^{6}$ and $10^{9}$ bytes. |
| BF16, FP16 | 16-bit number formats: 2 bytes per number. |
| FP8 | An 8-bit number format: 1 byte per number. It needs a scale factor to keep values in range. |
| $L$ | The number of layers. Each layer has its own keys and values. |
| $H$ | The number of query heads in one layer. |
| $H_{kv}$ | The number of KV heads in one layer. Equal to $H$ in MHA, smaller in GQA, 1 in MQA. |
| $d_h$ | The head dimension: the number of entries in one key vector or one value vector. |
| $s$ | Bytes per stored number: 2 for BF16, 1 for FP8. |
| $T$ | The number of tokens in one sequence: prompt plus generated tokens. |
| $B$ | The number of sequences in the batch. |
| MHA | Multi-head attention: every query head has its own KV head. |
| GQA | Grouped-query attention: groups of query heads share one KV head. |
| MLA | Multi-head latent attention: the cache stores one compressed latent vector and one small RoPE key per token and layer. |
| sliding-window attention | Each token attends only to the last $W$ tokens, so older entries can be deleted. |
| block | In vLLM, a fixed group of token slots in the KV cache. The default block size is 16 tokens. |
| `gpu_memory_utilization` | The vLLM setting for the fraction of GPU memory that one engine may use. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. Derive the formula factor by factor

### 4.1 Start from one number

Start from the smallest stored thing and multiply outward. [L1](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists) showed what is stored: per layer, per KV head and per token, one key vector and one value vector.

| Step | What you count | Factor | Llama-3.1-8B in BF16 | Running total |
|---|---|---|---|---|
| 1 | one stored number | $s$ | 2 bytes | 2 B |
| 2 | one key vector of one head | $\times\, d_h$ | 128 | 256 B |
| 3 | all KV heads of one layer | $\times\, H_{kv}$ | 8 | 2,048 B |
| 4 | key and value | $\times\, 2$ | 2 | 4,096 B |
| 5 | all layers | $\times\, L$ | 32 | 131,072 B |
| 6 | all tokens of one sequence | $\times\, T$ | for example 8,192 | 1 GiB |
| 7 | all sequences of the batch | $\times\, B$ | for example 4 | 4 GiB |

Steps 1 to 5 give the size per token:

$$
\text{bytes per token} = 2 \times L \times H_{kv} \times d_h \times s
$$

Steps 6 and 7 multiply by the number of tokens and sequences. If the sequences have different lengths $T_1, \dots, T_B$, use their sum:

$$
\text{KV bytes} = 2 \times L \times H_{kv} \times d_h \times s \times \sum_{b=1}^{B} T_b
$$

> [!key] Read the factors as questions
> - **2**: a key and a value.
> - **$L$**: every layer has its own cache.
> - **$H_{kv} \times d_h$**: the width of the key projection output, 1,024 in Llama-3.1-8B. It is $d$ in a model without GQA.
> - **$s$**: the number format of the cache.
> - **$T \times B$**: the total number of cached tokens on the GPU.
>
> The number of query heads $H$ does not appear. Queries are not cached.

![Alt text: the formula 2 times L times H_kv times d_h times s times T times B with each factor labeled and its Llama-3.1-8B value](/notes/media/llm-systems/figures/03-3-kv-size-formula.svg)

### 4.2 Check it on the toy example

The toy example has $L = 1$ layer, $H_{kv} = 1$ head and $d_h = 2$. One token adds $2 \times 1 \times 1 \times 2 = 4$ numbers.

After "the cat sat down", the cache holds exactly these 16 numbers:

```text
K = [[1, 0], [0, 2], [0, 1], [1, 1]]
V = [[2, 3], [2, 2], [1, 2], [1, 3]]
```

In FP32 ($s = 4$), that is $4 \times 4 \times 4 = 64$ bytes. In BF16 it is 32 bytes. The formula counts exactly what the code of L1 stores.

### 4.3 Check it on the vLLM paper

The paper computes the cache of OPT-13B: "the KV cache of a single token demands 800 KB of space, calculated as 2 (key and value vectors) × 5120 (hidden state size) × 40 (number of layers) × 2 (bytes per FP16)" (Kwon et al., 2023, §3).

OPT-13B has 40 layers, 40 heads and a hidden size of 5,120, so $d_h = 5120 / 40 = 128$, and every head has its own key and value. So $H_{kv} \times d_h = 40 \times 128 = 5{,}120$, and the formula gives the paper's product:

$$
2 \times 40 \times 40 \times 128 \times 2 = 819{,}200 \text{ bytes} = 800 \text{ KiB}
$$

The paper continues: "Since OPT can generate sequences up to 2048 tokens, the memory required to store the KV cache of one request can be as much as 1.6 GB." Check: $819{,}200 \times 2{,}048 = 1{,}677{,}721{,}600$ bytes. That is 1.68 GB in decimal units or 1.5625 GiB in binary units. The paper's "800 KB" is exactly 800 KiB, and its "1.6 GB" is about 1.56 GiB.

### 4.4 Units: KiB and KB are different

This page uses binary units (KiB, MiB, GiB) for cache sizes, because the per-token sizes are powers of two. It uses decimal units (GB) for model weights and bandwidth, because vendors state them that way ([part 01 L4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory)).

| Bytes | Binary | Decimal |
|---|---|---|
| 131,072 | 128 KiB | 131.07 KB |
| 1,073,741,824 | 1 GiB | 1.074 GB |
| 16,060,522,496 (Llama-3.1-8B weights) | 14.96 GiB | 16.06 GB |

> [!trap] Mixing GB and GiB gives a 7% error
> $1 \text{ GiB} = 1.0737 \text{ GB}$. If you divide a budget in GB by a cache size in GiB, your answer is about 7% too high. Convert everything to bytes first.

## 5. The formula for real models

### 5.1 The configurations

Every number below is from the model's `config.json` on Hugging Face or from the model's paper. The config field names are `num_hidden_layers` ($L$), `num_attention_heads` ($H$), `num_key_value_heads` ($H_{kv}$), `hidden_size` ($d$) and `head_dim` ($d_h$). When `head_dim` is absent, $d_h = d / H$. When `num_key_value_heads` is absent, the model uses MHA and $H_{kv} = H$.

| Model | $L$ | $H$ | $H_{kv}$ | $d_h$ | Source |
|---|---|---|---|---|---|
| OPT-13B | 40 | 40 | 40 | 128 | config.json, `hidden_size` 5,120 |
| Llama-2-7B | 32 | 32 | 32 | 128 | Llama 1 paper Table 2 (Llama 2 keeps the architecture, no GQA at 7B) |
| Llama-3.1-8B | 32 | 32 | 8 | 128 | Llama 3 paper Table 3 |
| Mistral-7B-v0.1 | 32 | 32 | 8 | 128 | config.json, `sliding_window` 4,096 |
| Qwen2.5-7B-Instruct | 28 | 28 | 4 | 128 | config.json, `hidden_size` 3,584 |
| Llama-3.1-70B | 80 | 64 | 8 | 128 | Llama 3 paper Table 3 |
| Llama-3.1-405B | 126 | 128 | 8 | 128 | Llama 3 paper Table 3 |
| DeepSeek-V3 (MLA) | 61 | 128 | (latent) | (latent) | config.json: `kv_lora_rank` 512, `qk_rope_head_dim` 64 |

### 5.2 The table

All values are in BF16 or FP16 ($s = 2$), computed in these notes with Python.

| Model | Bytes per token | Per token | 8,192 tokens | 131,072 tokens |
|---|---|---|---|---|
| OPT-13B (MHA) | 819,200 | 800 KiB | 6.25 GiB | 100 GiB |
| Llama-2-7B (MHA) | 524,288 | 512 KiB | 4 GiB | 64 GiB |
| Llama-3.1-8B (GQA 32:8) | 131,072 | 128 KiB | 1 GiB | 16 GiB |
| Mistral-7B-v0.1 (GQA 32:8, window 4,096) | 131,072 | 128 KiB | 0.5 GiB (capped) | 0.5 GiB (capped) |
| Qwen2.5-7B (GQA 28:4) | 57,344 | 56 KiB | 0.44 GiB | 7 GiB |
| Llama-3.1-70B (GQA 64:8) | 327,680 | 320 KiB | 2.5 GiB | 40 GiB |
| Llama-3.1-405B (GQA 128:8) | 516,096 | 504 KiB | 3.94 GiB | 63 GiB |
| DeepSeek-V3 (MLA) | 70,272 | 68.6 KiB | 0.54 GiB | 8.58 GiB |

Notes on the rows:

- **OPT-13B and Llama-2-7B** cannot reach 131,072 tokens. Their maximum lengths are 2,048 and 4,096 tokens. Their 128K column only shows the scale of an MHA cache.
- **Llama-2-7B vs Llama-3.1-8B.** Both have 32 layers, $d = 4{,}096$ and 32 query heads. GQA with 8 KV heads makes the Llama-3.1-8B cache 4 times smaller.
- **Mistral-7B-v0.1** uses sliding-window attention with $W = 4{,}096$ and a "rolling buffer cache". The Mistral paper states: "The cache has a fixed size of W, and the keys and values for the timestep i are stored in position i mod W of the cache." So the cache of one sequence stops growing at $4{,}096 \times 128$ KiB $= 512$ MiB. The paper reports that on 32K-token sequences "this reduces the cache memory usage by 8x". Later versions changed this: the config of Mistral-7B-v0.3 has `sliding_window: null`.
- **Qwen2.5-7B-Instruct** has `max_position_embeddings` 32,768. Its 128K column is beyond its native length.
- **Llama-3.1-405B** has 126 layers but still 8 KV heads. Its cache per token is smaller than OPT-13B's.

### 5.3 The MLA row needs another formula

DeepSeek-V3 does not cache separate keys and values per head. For each token and layer it caches one compressed latent vector $c^{KV}$ and one decoupled RoPE key $k^R$. The DeepSeek-V3 paper states that for MLA only the vectors $c_t^{KV}$ and $k_t^{R}$ "need to be cached during generation" (§2.1.1). Its hyperparameters are: "The KV compression dimension $d_c$ is set to 512" and "we set the per-head dimension $d_h^R$ to 64" (§4.2).

$$
\text{MLA bytes per token} = L \times (d_c + d_h^R) \times s = 61 \times (512 + 64) \times 2 = 70{,}272 \text{ bytes}
$$

There is no factor 2, because one latent serves both keys and values. The DeepSeek-V2 paper gives the same count in elements: $(d_c + d_h^R) \, l \approx \frac{9}{2} d_h l$, against $2 n_h d_h l$ for MHA (Table 1). With MHA and the same 128 heads, DeepSeek-V3 would need $61 \times 128 \times (192 + 128) \times 2 = 4{,}997{,}120$ bytes per token (keys of 192 numbers, values of 128). That is about 71 times more. [L5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) explains how MLA rebuilds keys and values from the latent.

> [!note] A 671B model with a smaller cache than an 8B model
> DeepSeek-V3 has 671B total parameters, with 37B active per token (paper §4.2). Its cache is 68.6 KiB per token. Llama-3.1-8B needs 128 KiB per token. The cache depends on the attention design, not on the parameter count.

## 6. How many requests fit on one GPU

### 6.1 The memory budget

An engine divides GPU memory into four parts:

$$
M_{KV} = M_{GPU} \times u - M_{weights} - M_{other}
$$

- $M_{GPU}$ is the GPU memory. $u$ is the fraction the engine may use: `gpu_memory_utilization` in vLLM.
- $M_{weights}$ is the model weights.
- $M_{other}$ is everything else: the peak activation memory of a forward pass, CUDA graphs, and memory outside PyTorch (for example the CUDA context).
- $M_{KV}$ is what is left for the KV cache.

vLLM measures $M_{other}$ with a profiling run at startup. Its worker code describes the goal: it "Profiles the peak memory usage of the model to determine how much memory can be used for KV cache without OOMs". Then it logs "Available KV cache memory: %s GiB" (vLLM `gpu_worker.py`, main branch, checked on 2026-10-15). The default of `gpu_memory_utilization` in the current vLLM source is 0.92, and the docs say it is "a per-instance limit". Defaults change between releases, so read them for your version.

Then the number of requests of $T$ tokens that fit is:

$$
N_{req} = \left\lfloor \frac{M_{KV}}{2 \, L \, H_{kv} \, d_h \, s \times T} \right\rfloor
$$

### 6.2 Worked example: Llama-3.1-8B on one H100 at 8K tokens

> [!example] Worked example: how many 8,192-token requests fit
> Assumptions, stated so that you can change them: the GPU exposes 80 GiB, $u = 0.90$, and $M_{other} = 4$ GiB. A real card exposes a little less than its nominal size, and the profiling run measures the real $M_{other}$.
>
> 1. Budget: $80 \times 0.90 = 72$ GiB.
> 2. Weights: $2 \times 8{,}030{,}261{,}248 = 16{,}060{,}522{,}496$ bytes $= 14.96$ GiB.
> 3. KV memory: $72 - 14.96 - 4 = 53.04$ GiB.
> 4. In tokens: $53.04 \times 2^{30} / 131{,}072 = 434{,}523$ tokens.
> 5. In vLLM blocks of 16 tokens: $434{,}523 / 16 = 27{,}157$ blocks. One block holds $16 \times 128$ KiB $= 2$ MiB over all 32 layers, 64 KiB per layer.
> 6. Requests of 8,192 tokens: $434{,}523 / 8{,}192 = 53.04$, so **53 requests** at the same time.
>
> With $u = 0.92$, the KV memory is 54.64 GiB and 54 requests fit.

The same budget gives very different answers for other request shapes:

| Request shape | Tokens per request | Requests that fit |
|---|---|---|
| Reserve the full 128K context for each request | 131,072 | 3 |
| Exactly 8,192 tokens each | 8,192 | 53 |
| 2,000 tokens each, allocated as they grow | 2,000 | 217 |

The first row is how earlier systems behaved when they reserved the maximum length for every request. The last row is what block-wise allocation allows when requests are short. That gap is the motivation of PagedAttention ([paper page 03](/notes/papers/llm-serving/2023-pagedattention/03-the-question)).

The code of the worked example:

```python
GiB, KiB = 2 ** 30, 2 ** 10


def max_requests(gpu_gib, util, weights_gib, other_gib, kv_per_token, tokens):
    kv_gib = gpu_gib * util - weights_gib - other_gib
    kv_tokens = int(kv_gib * GiB // kv_per_token)
    return kv_gib, kv_tokens, kv_tokens // tokens


weights = 2 * 8_030_261_248 / GiB                # Llama-3.1-8B in BF16
kv_gib, kv_tokens, n = max_requests(80, 0.90, weights, 4.0, 128 * KiB, 8192)
print(f"KV budget {kv_gib:.2f} GiB = {kv_tokens:,} tokens "
      f"= {kv_tokens // 16:,} blocks of 16 -> {n} requests of 8,192 tokens")
```

Output:

```text
KV budget 53.04 GiB = 434,523 tokens = 27,157 blocks of 16 -> 53 requests of 8,192 tokens
```

![Alt text: two memory bars, an H100 example and a real A100 log, divided into weights, other memory, KV cache and reserve](/notes/media/llm-systems/figures/03-3-memory-budget.svg)

### 6.3 Worked example: a real vLLM startup log

A public vLLM GitHub issue (number 12330) shows the startup log of `meta-llama/Meta-Llama-3-8B` on one A100 40 GB. An older vLLM release wrote this log. Llama 3 8B has the same attention shape as Llama-3.1-8B, so its cache is also 128 KiB per token. The log lines are below, without their timestamp prefixes:

```text
the current vLLM instance can use total_gpu_memory (39.50GiB) x gpu_memory_utilization (0.90) = 35.55GiB
model weights take 14.96GiB; non_torch_memory takes 0.10GiB; PyTorch activation peak memory takes 9.37GiB;
the rest of the memory reserved for KV Cache is 11.12GiB.
# GPU blocks: 5691, # CPU blocks: 2048
Maximum concurrency for 8192 tokens per request: 11.12x
```

> [!example] Worked example: check every number of the log with the formula
> 1. Budget: $39.50 \times 0.90 = 35.55$ GiB. The "40 GB" card exposes 39.50 GiB.
> 2. KV memory: $35.55 - 14.96 - 0.10 - 9.37 = 11.12$ GiB.
> 3. Blocks: $5{,}691$ blocks of 16 tokens $= 91{,}056$ tokens.
> 4. Bytes: $91{,}056 \times 131{,}072 = 11.115$ GiB. This matches the 11.12 GiB of step 2 after rounding.
> 5. Concurrency: $91{,}056 / 8{,}192 = 11.115$, printed as "11.12x".
>
> The activation peak of 9.37 GiB is large here. It is not part of the formula, so measure it on your own setup.

## 7. When the cache outgrows the weights

The weights have a fixed size. The cache grows with every cached token. The crossing point is:

$$
T_{cross} = \frac{M_{weights}}{2 \, L \, H_{kv} \, d_h \, s}
$$

| Model | Weights (BF16) | KV per token | Tokens where the cache equals the weights |
|---|---|---|---|
| Llama-3.1-8B | 16.06 GB | 131,072 B | 122,532 |
| Llama-3.1-70B | 141.1 GB | 327,680 B | 430,626 |
| OPT-13B | 26 GB (paper, Figure 1) | 819,200 B | 31,738 |

The count is over all cached tokens on the GPU, from all requests together. For Llama-3.1-8B, one request at the full 131,072-token context already holds a 16 GiB cache, more than the 14.96 GiB of weights. For OPT-13B, 16 requests of 2,048 tokens hold about as much cache as the model.

```plot
{
  "title": "KV cache in GiB vs tokens in units of 1,024: Llama-3.1-8B (blue), Llama-3.1-70B (purple), Llama-3.1-8B weights 14.96 GiB (ink)",
  "xAxis": {"label": "cached tokens (x 1,024)", "domain": [0, 132]},
  "yAxis": {"label": "GiB", "domain": [0, 45]},
  "disableZoom": true,
  "data": [
    {"fn": "x/8", "color": "#1E6091"},
    {"fn": "0.3125*x", "color": "#6A4C93"},
    {"fn": "14.96", "color": "#100D12"}
  ]
}
```

The blue line crosses the ink line near $x \approx 120$, that is 122,532 tokens. The 70B weights (131.4 GiB) are far above this chart. Its cache equals them only at about 420 units of 1,024 tokens.

```video
{"src": "/notes/media/llm-systems/manim/m12-cache-filling-gpu-memory.mp4", "caption": "Requests arrive and their caches grow until the GPU memory left after the weights is full."}
```

## 8. What changes the formula

| Change | New formula or factor | Llama-3.1-8B effect | Lesson |
|---|---|---|---|
| MHA to GQA | $H_{kv}$ falls from $H$ to $H/g$ | 512 KiB to 128 KiB ($g = 4$) | [L5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| MQA | $H_{kv} = 1$ | would be 16 KiB | [L5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| MLA | $L \times (d_c + d_h^R) \times s$ | not used in Llama | [L5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| FP8 cache | $s = 1$ (plus small scale factors) | 64 KiB per token | [L6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| Sliding window $W$ | $T$ becomes $\min(T, W)$ | not used in Llama-3.1 | [L6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| Tensor parallelism over $P$ GPUs | each GPU holds $H_{kv}/P$ heads | $P = 4$: 32 KiB per token per GPU | [part 04 L8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| Shared prefixes | shared tokens are counted once | depends on the traffic | [part 04 L9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |

Three remarks:

- **FP8.** vLLM accepts `--kv-cache-dtype` values such as `fp8`, `fp8_e4m3` and `fp8_e5m2`. The default `auto` uses the model data type (vLLM engine arguments, checked on 2026-10-15). An FP8 cache halves both the memory and the bytes that each decode step reads.
- **Tensor parallelism.** The split is by KV head. With $P \le H_{kv}$, each GPU stores $H_{kv}/P$ heads for every token. With $P > H_{kv}$, a KV head cannot be split further by this scheme. Interpretation of these notes: then every GPU must hold at least one full KV head, so some heads are stored on several GPUs.
- **Allocation waste.** The formula counts stored data. A block allocator wastes at most $\text{block size} - 1$ slots per sequence: up to 15 slots, 1.875 MiB for Llama-3.1-8B. A system that reserves the maximum length wastes much more ([paper page 05](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager)).

## 9. Code: the formula from a config

The function below reads the standard config fields. It handles MHA, GQA, MLA and a sliding window.

```python
def kv_bytes_per_token(cfg, bytes_per_elem=2):
    """KV cache bytes for one token of one sequence, all layers."""
    L = cfg["num_hidden_layers"]
    if "kv_lora_rank" in cfg:                        # MLA (DeepSeek-V2/V3)
        return L * (cfg["kv_lora_rank"] + cfg["qk_rope_head_dim"]) * bytes_per_elem
    h_kv = cfg.get("num_key_value_heads", cfg["num_attention_heads"])
    d_h = cfg.get("head_dim") or cfg["hidden_size"] // cfg["num_attention_heads"]
    return 2 * L * h_kv * d_h * bytes_per_elem


def kv_bytes(cfg, tokens, batch=1, bytes_per_elem=2):
    window = cfg.get("sliding_window")                 # None means no window
    kept = min(tokens, window) if window else tokens
    return kv_bytes_per_token(cfg, bytes_per_elem) * kept * batch


configs = {
    "OPT-13B": {"num_hidden_layers": 40, "num_attention_heads": 40,
                "hidden_size": 5120},
    "Llama-3.1-8B": {"num_hidden_layers": 32, "num_attention_heads": 32,
                     "num_key_value_heads": 8, "hidden_size": 4096},
    "Mistral-7B-v0.1": {"num_hidden_layers": 32, "num_attention_heads": 32,
                        "num_key_value_heads": 8, "hidden_size": 4096,
                        "sliding_window": 4096},
    "Qwen2.5-7B": {"num_hidden_layers": 28, "num_attention_heads": 28,
                   "num_key_value_heads": 4, "hidden_size": 3584},
    "Llama-3.1-70B": {"num_hidden_layers": 80, "num_attention_heads": 64,
                      "num_key_value_heads": 8, "hidden_size": 8192},
    "DeepSeek-V3": {"num_hidden_layers": 61, "num_attention_heads": 128,
                    "num_key_value_heads": 128, "hidden_size": 7168,
                    "kv_lora_rank": 512, "qk_rope_head_dim": 64},
}
GiB = 2 ** 30
for name, cfg in configs.items():
    per_tok = kv_bytes_per_token(cfg)
    print(f"{name:16s} {per_tok:>9,d} B/token  "
          f"32K tokens: {kv_bytes(cfg, 32768) / GiB:6.2f} GiB")
```

Output:

```text
OPT-13B            819,200 B/token  32K tokens:  25.00 GiB
Llama-3.1-8B       131,072 B/token  32K tokens:   4.00 GiB
Mistral-7B-v0.1    131,072 B/token  32K tokens:   0.50 GiB
Qwen2.5-7B          57,344 B/token  32K tokens:   1.75 GiB
Llama-3.1-70B      327,680 B/token  32K tokens:  10.00 GiB
DeepSeek-V3         70,272 B/token  32K tokens:   2.14 GiB
```

What the important lines do:

- `if "kv_lora_rank" in cfg` detects an MLA model. DeepSeek's config lists `num_key_value_heads: 128`, which would give a wrong answer with the GQA formula. The latent fields come first for that reason.
- `cfg.get("num_key_value_heads", cfg["num_attention_heads"])` handles old MHA configs that have no KV-head field, such as OPT.
- `cfg.get("head_dim") or hidden_size // num_attention_heads` uses an explicit head size when the config has one. Some models set a `head_dim` that differs from $d/H$, so never assume the division.
- `min(tokens, window)` caps the cache of a sliding-window model. Some configs write `sliding_window` and disable it with another field. Qwen2.5-7B-Instruct lists 131,072 but has the window disabled. Check the model's attention code, not only the field.
- The OPT-13B line at 32K tokens is arithmetic only. That model stops at 2,048 tokens.

### Exercises

Write your code in the lab folder `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, in the notebook folder `llm-systems/`.

1. **Read a real config.** Download the `config.json` of a model you use at work. Compute its KV bytes per token and its cache at its `max_position_embeddings`. Acceptance test: your function returns 131,072 for the Llama-3.1-8B dictionary above and 70,272 for DeepSeek-V3.
   - Hint 1: print the five fields $L$, $H$, $H_{kv}$, $d$ and `head_dim` before you compute.
   - Hint 2: search the config for `kv_lora_rank`, `sliding_window` and `head_dim` first.
2. **Size a deployment.** Write `max_requests(...)` and compute how many 32,768-token requests of Llama-3.1-8B fit on one H100 with the assumptions of section 6.2. Then repeat with an FP8 cache. Acceptance test: 13 requests in BF16 and 26 in FP8.
   - Hint 1: a 32,768-token request needs 4 GiB in BF16.
   - Hint 2: an FP8 cache halves the bytes per token, but not the weights.
3. **Read a vLLM log.** Use the lines "# GPU blocks: 5691" and "Maximum concurrency for 8192 tokens per request: 11.12x". Recompute the concurrency and the cache size in GiB for a model with 128 KiB per token. Acceptance test: 91,056 tokens, 11.12x and 11.12 GiB.
   - Hint 1: the default block size is 16 tokens.
   - Hint 2: concurrency is the number of cache tokens divided by the tokens of one request.

## 10. Common mistakes

1. **"The formula uses the number of attention heads."** It uses the number of **KV heads** $H_{kv}$. For Llama-3.1-8B, using $H = 32$ gives 512 KiB instead of 128 KiB, a 4-times error.
2. **"KV cache per token is $2 \times d \times L \times s$."** That is true only for MHA, where $H_{kv} d_h = d$. With GQA, use $H_{kv} d_h$, which is 1,024 for Llama-3.1-8B, not 4,096.
3. **"The factor 2 is for BF16."** There are two factors of 2 in the Llama-3.1-8B product. One is for key and value. The other is $s = 2$ bytes for BF16. With FP8, only the second one becomes 1.
4. **"MLA caches a key and a value, so it has a factor 2."** MLA caches one latent of $d_c$ numbers plus one RoPE key of $d_h^R$ numbers per token and layer, with no factor 2.
5. **"800 KB and 800 KiB are the same."** 800 KiB is 819,200 bytes, and 800 KB is 800,000 bytes. The paper's "800 KB" equals 819,200 bytes, so it uses KB loosely for KiB.
6. **"All GPU memory can hold cache."** Subtract the weights, the activation peak, CUDA graphs and other memory, and the reserve of `gpu_memory_utilization`. In the real A100 log, the activation peak alone was 9.37 GiB.
7. **"A bigger model always has a bigger cache."** DeepSeek-V3 (671B parameters) needs 68.6 KiB per token, and Llama-3.1-8B needs 128 KiB. Llama-3.1-405B needs less than OPT-13B.
8. **"Sliding-window models always cap the cache."** Only when the window is enabled in every layer. Mistral-7B-v0.1 caps it at 4,096 tokens. Mistral-7B-v0.3 has no window.

## 11. One-minute explanation

The KV cache stores one key vector and one value vector for every token, in every layer and every KV head. So its size is $2 \times L \times H_{kv} \times d_h \times s$ bytes per token, times the tokens per sequence and the batch size. The 2 is key plus value, $L$ is the layers, $H_{kv} d_h$ is the width of the key projection, and $s$ is 2 bytes in BF16. For Llama-3.1-8B that is $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes, 128 KiB per token. That is 1 GiB per 8K tokens and 16 GiB at 128K, more than the 16 GB of weights. For Llama-3.1-70B it is 320 KiB per token, so 128K tokens at batch 8 is 320 GiB. To find capacity, take GPU memory times the utilization limit, subtract the weights and the activation memory, and divide by the bytes per request. On an H100 with the 8B model, that is about 53 requests of 8K tokens. GQA shrinks $H_{kv}$, FP8 halves $s$, sliding windows cap $T$, and MLA replaces the formula with a small latent per layer.

## 12. Check questions

```check
{
  "question": "Derive the KV cache size formula factor by factor, and say what each factor means.",
  "hint": "Start from one stored number and multiply outward: head size, heads, key and value, layers, tokens, batch.",
  "answer": "$$\n\\text{KV bytes} = 2 \\times L \\times H_{kv} \\times d_h \\times s \\times T \\times B\n$$\n\n1. $s$: bytes of one stored number (2 for BF16, 1 for FP8).\n2. $d_h$: numbers in one key vector or one value vector of one head.\n3. $H_{kv}$: KV heads per layer (not query heads, because queries are not cached).\n4. $2$: a key and a value.\n5. $L$: every layer has its own keys and values.\n6. $T$: tokens per sequence.\n7. $B$: sequences in the batch. With different lengths, replace $T \\times B$ by the sum of the lengths.\n\nThe first five factors give the bytes per token."
}
```

```check
{
  "question": "Compute the KV cache per token of Llama-3.1-8B in BF16, and the cache of one request at 8,192 and at 131,072 tokens.",
  "hint": "$L = 32$, $H_{kv} = 8$, $d_h = 128$, $s = 2$.",
  "answer": "$2 \\times 32 \\times 8 \\times 128 \\times 2 = 131{,}072$ bytes $= 128$ KiB per token.\n\n- 8,192 tokens: $131{,}072 \\times 8{,}192 = 2^{17} \\times 2^{13} = 2^{30}$ bytes $= 1$ GiB.\n- 131,072 tokens: $2^{17} \\times 2^{17} = 2^{34}$ bytes $= 16$ GiB.\n\nThe BF16 weights are $16.06$ GB $= 14.96$ GiB. So one full-context request holds more cache than the whole model."
}
```

```check
{
  "question": "Interview follow-up: \"Compute the KV cache of Llama-3.1-70B at 128K tokens and batch 8. Does it fit on 8 H100s? What does an FP8 cache change?\"",
  "hint": "$L = 80$, $H_{kv} = 8$, $d_h = 128$. 128K means 131,072 tokens.",
  "answer": "Per token: $2 \\times 80 \\times 8 \\times 128 \\times 2 = 327{,}680$ bytes $= 320$ KiB.\n\nTotal: $327{,}680 \\times 131{,}072 \\times 8 = 343{,}597{,}383{,}680$ bytes $= 320$ GiB $\\approx 343.6$ GB.\n\nFit on 8 H100s (80 GB each, about 640 GB in total) with tensor parallelism of 8:\n\n- Weights: $2 \\times 70{,}553{,}706{,}496 \\approx 141.1$ GB, so about 17.6 GB per GPU.\n- Cache: 8 KV heads over 8 GPUs is 1 KV head per GPU, so $320 / 8 = 40$ GiB $\\approx 42.9$ GB per GPU.\n- About 60.6 GB per GPU before activations and other memory. It fits, with less than 20 GB per GPU for everything else.\n\nFP8 cache: $s = 1$, so 160 GiB in total and 20 GiB ($\\approx 21.5$ GB) per GPU. Every decode step also reads half as many cache bytes, so long-context decode becomes faster. The cost is a possible small loss of quality."
}
```

```check
{
  "question": "Interview follow-up: \"What does GQA change in the formula? Show it on Llama-3.1-70B.\"",
  "hint": "Which factor changes, and by how much?",
  "answer": "Only $H_{kv}$ changes. With MHA, $H_{kv} = H$. With GQA, $g$ query heads share one KV head, so $H_{kv} = H / g$. The cache shrinks by the factor $H / H_{kv}$. The parameter count and the FLOPs of attention hardly change, because every query head still attends.\n\nLlama-3.1-70B: $H = 64$, $H_{kv} = 8$, so the factor is 8.\n\n- MHA (hypothetical): $2 \\times 80 \\times 64 \\times 128 \\times 2 = 2{,}621{,}440$ bytes $= 2.5$ MiB per token.\n- GQA (real): $327{,}680$ bytes $= 320$ KiB per token.\n\nAt 128K tokens, that is 320 GiB vs 40 GiB for one request."
}
```

```check
{
  "question": "Interview follow-up: \"Why does an FP8 KV cache halve the memory? What does it cost, and is it the same as FP8 weights?\"",
  "hint": "Which factor of the formula changes? What happens to the numbers before attention uses them?",
  "answer": "It changes $s$ from 2 bytes to 1 byte. Every other factor stays, so the cache halves: 64 KiB per token for Llama-3.1-8B. The bytes that each decode step reads from the cache also halve, so memory-bound long-context decode gets faster.\n\nCosts: FP8 has 3 or 2 mantissa bits (E4M3 or E5M2), so keys and values lose precision. Engines store scale factors to keep the values in range and convert back to a higher precision for the attention arithmetic. Quality can drop a little, so measure it on your task.\n\nIt is independent of weight quantization. FP8 weights shrink $M_{weights}$. An FP8 cache shrinks $s$. In vLLM, the cache format is the `--kv-cache-dtype` argument (for example `fp8`), and its default `auto` uses the model data type. Details are in L6."
}
```

```check
{
  "question": "Interview follow-up: \"How many concurrent 8K-token requests can one H100 serve with Llama-3.1-8B? State your assumptions.\"",
  "hint": "$M_{KV} = M_{GPU} \\times u - M_{weights} - M_{other}$, then divide by 1 GiB per request.",
  "answer": "Assumptions: 80 GiB exposed, $u = 0.90$, $M_{other} = 4$ GiB for activations, CUDA graphs and the CUDA context.\n\n1. Budget: $80 \\times 0.90 = 72$ GiB.\n2. Weights: 14.96 GiB in BF16.\n3. KV memory: $72 - 14.96 - 4 = 53.04$ GiB.\n4. One 8,192-token request needs 1 GiB, so $\\lfloor 53.04 \\rfloor = 53$ requests (434,523 tokens, 27,157 blocks of 16).\n\nWhat changes the answer: $u = 0.92$ (the current vLLM default) gives 54. An FP8 cache gives 106. Short real requests that grow block by block give many more. If the engine reserved the full 131,072-token context for each request, only 3 would fit. A real activation peak can be much larger than 4 GiB: a public A100 log shows 9.37 GiB."
}
```

```check
{
  "question": "Interview follow-up: \"DeepSeek-V3 has 671B parameters. Compute its KV cache per token. Why is there no factor 2?\"",
  "hint": "MLA caches a latent $c^{KV}$ of $d_c = 512$ numbers and a RoPE key of $d_h^R = 64$ numbers per token and layer. $L = 61$.",
  "answer": "$$\nL \\times (d_c + d_h^R) \\times s = 61 \\times (512 + 64) \\times 2 = 70{,}272 \\text{ bytes} \\approx 68.6 \\text{ KiB}\n$$\n\nThere is no factor 2 because MLA does not store keys and values separately. It stores one latent vector $c^{KV}$ from which the model rebuilds both, plus one small decoupled RoPE key $k^R$ shared by all heads.\n\nFor comparison: with MHA and 128 heads (keys of 192 numbers, values of 128), it would be $61 \\times 128 \\times 320 \\times 2 = 4{,}997{,}120$ bytes, about 71 times more. Llama-3.1-8B needs 131,072 bytes per token. So the 671B model caches less per token than the 8B model. The DeepSeek-V2 paper states the MLA count as $(d_c + d_h^R)\\,l \\approx \\frac{9}{2} d_h l$ elements."
}
```

```check
{
  "question": "Interview follow-up: \"When does the KV cache become larger than the model weights?\"",
  "hint": "Divide the weight bytes by the cache bytes per token.",
  "answer": "$T_{cross} = M_{weights} / (2 L H_{kv} d_h s)$, counted over all cached tokens on the GPU.\n\n- Llama-3.1-8B: $16{,}060{,}522{,}496 / 131{,}072 \\approx 122{,}532$ tokens. One request at the full 131,072-token context is already past it.\n- Llama-3.1-70B: $141{,}107{,}412{,}992 / 327{,}680 \\approx 430{,}626$ tokens, for example 4 requests of 128K.\n- OPT-13B (MHA): $26 \\text{ GB} / 819{,}200 \\approx 31{,}738$ tokens, about 16 requests of 2,048 tokens.\n\nSo for long contexts or large batches, the cache, not the model, decides how much memory a server needs. MHA models reach that point about 4 to 8 times sooner than GQA models of similar width."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\ndef kv_bytes_per_token(cfg, bytes_per_elem=2):\n    L = cfg[\"num_hidden_layers\"]\n    if \"kv_lora_rank\" in cfg:                        # MLA\n        return L * (cfg[\"kv_lora_rank\"] + cfg[\"qk_rope_head_dim\"]) * bytes_per_elem\n    h_kv = cfg.get(\"num_key_value_heads\", cfg[\"num_attention_heads\"])\n    d_h = cfg.get(\"head_dim\") or cfg[\"hidden_size\"] // cfg[\"num_attention_heads\"]\n    return 2 * L * h_kv * d_h * bytes_per_elem\n\n\nllama = {\"num_hidden_layers\": 32, \"num_attention_heads\": 32,\n         \"num_key_value_heads\": 8, \"hidden_size\": 4096}\ndeepseek = {\"num_hidden_layers\": 61, \"num_attention_heads\": 128,\n            \"num_key_value_heads\": 128, \"hidden_size\": 7168,\n            \"kv_lora_rank\": 512, \"qk_rope_head_dim\": 64}\nassert kv_bytes_per_token(llama) == 131_072\nassert kv_bytes_per_token(deepseek) == 70_272\nprint(\"ok\")\n```\n\nFor your own model, load the file with `json.load(open(\"config.json\"))` and pass the dictionary. Multiply by `max_position_embeddings` for the cache of one full-length request."
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\nGiB, KiB = 2 ** 30, 2 ** 10\n\n\ndef max_requests(gpu_gib, util, weights_gib, other_gib, kv_per_token, tokens):\n    kv_gib = gpu_gib * util - weights_gib - other_gib\n    kv_tokens = int(kv_gib * GiB // kv_per_token)\n    return kv_tokens // tokens\n\n\nweights = 2 * 8_030_261_248 / GiB\nprint(max_requests(80, 0.90, weights, 4.0, 128 * KiB, 32768))  # BF16: 13\nprint(max_requests(80, 0.90, weights, 4.0, 64 * KiB, 32768))   # FP8: 26\n```\n\nIn BF16 each 32,768-token request needs 4 GiB, and $53.04 / 4 = 13.26$, so 13 fit. In FP8 each needs 2 GiB, so 26 fit."
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\ngpu_blocks, block_size, max_len = 5691, 16, 8192\nkv_per_token = 128 * 1024                     # Llama 3 8B in BF16\ntokens = gpu_blocks * block_size\nprint(f\"{tokens:,} tokens, {tokens / max_len:.2f}x concurrency, \"\n      f\"{tokens * kv_per_token / 2**30:.2f} GiB of KV cache\")\nbudget = 39.50 * 0.90\nprint(f\"budget {budget:.2f} GiB, rest {budget - 14.96 - 0.10 - 9.37:.2f} GiB\")\n```\n\nOutput:\n\n```text\n91,056 tokens, 11.12x concurrency, 11.12 GiB of KV cache\nbudget 35.55 GiB, rest 11.12 GiB\n```\n\nThe two ways to compute the cache memory agree: from the block count, and from the budget minus weights, other memory and the activation peak."
}
```

## 13. Links

- Previous: [L2: Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode)
- Next: [L4: Implementing a KV cache](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache)
- Bytes and number formats: [part 01 L4: Numbers in memory](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory)
- Heads and GQA: [part 02 L5: Multi-head attention](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) and [L5: MHA, MQA, GQA and MLA](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla)
- Shrinking the cache: [L6: Shrinking the KV cache](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache)
- GPU sizing for deployments: [part 05 L2: Sizing GPUs for a model](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus)
- The paper: [03: Where does KV cache memory go?](/notes/papers/llm-serving/2023-pagedattention/03-the-question) and [05: The KV cache manager](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager)
- Numbers to memorize: [Formula and numbers sheet](/notes/ai/llm-systems/08-interview-drills/l5-formula-sheet)

### Sources

- Kwon et al., "Efficient Memory Management for Large Language Model Serving with PagedAttention", SOSP 2023, §1 (Figure 1) and §3: https://arxiv.org/abs/2309.06180 (checked on 2026-10-15)
- Llama Team, "The Llama 3 Herd of Models", Table 3: https://arxiv.org/abs/2407.21783 (checked on 2026-10-15)
- Touvron et al., "LLaMA: Open and Efficient Foundation Language Models", Table 2: https://arxiv.org/abs/2302.13971 (checked on 2026-10-15)
- Touvron et al., "Llama 2: Open Foundation and Fine-Tuned Chat Models", Table 1 (GQA only for 34B and 70B): https://arxiv.org/abs/2307.09288 (checked on 2026-10-15)
- Jiang et al., "Mistral 7B", Table 1 and the rolling buffer cache: https://arxiv.org/abs/2310.06825 (checked on 2026-10-15)
- DeepSeek-AI, "DeepSeek-V2", Table 1: https://arxiv.org/abs/2405.04434 (checked on 2026-10-15)
- DeepSeek-AI, "DeepSeek-V3 Technical Report", §2.1.1 and §4.2: https://arxiv.org/abs/2412.19437 (checked on 2026-10-15)
- Configs: https://huggingface.co/facebook/opt-13b/blob/main/config.json, https://huggingface.co/mistralai/Mistral-7B-v0.1/blob/main/config.json, https://huggingface.co/mistralai/Mistral-7B-v0.3/blob/main/config.json, https://huggingface.co/Qwen/Qwen2.5-7B-Instruct/blob/main/config.json, https://huggingface.co/deepseek-ai/DeepSeek-V3/blob/main/config.json (checked on 2026-10-15)
- Parameter counts: https://huggingface.co/api/models/meta-llama/Llama-3.1-8B and https://huggingface.co/api/models/meta-llama/Llama-3.1-70B (checked on 2026-10-15)
- vLLM engine arguments (`--gpu-memory-utilization`, `--kv-cache-dtype`, `--block-size`): https://docs.vllm.ai/en/latest/configuration/engine_args.html (checked on 2026-10-15)
- vLLM source, `vllm/config/cache.py` (default `gpu_memory_utilization` 0.92, `DEFAULT_BLOCK_SIZE` 16) and `vllm/v1/worker/gpu_worker.py` (memory profiling): https://github.com/vllm-project/vllm/blob/main/vllm/config/cache.py and https://github.com/vllm-project/vllm/blob/main/vllm/v1/worker/gpu_worker.py (checked on 2026-10-15)
- vLLM issue 12330 (startup log of Meta-Llama-3-8B on an A100 40 GB): https://github.com/vllm-project/vllm/issues/12330 (checked on 2026-10-15)
