---
title: "L2: Prefill and decode"
order: 2
summary: "Generation has two phases with opposite bottlenecks. Prefill pushes the whole prompt through the model as matrix-matrix work and is compute-bound. Decode produces one token per step as matrix-vector work and is memory-bound, because each step reads all weights and the whole KV cache."
status: not-started
tags: [kv-cache, prefill, decode, inference, latency, roofline]
---

## 1. The question this idea answers

Send a long prompt to a chat model. There is a pause before the first token. Then the tokens stream at a steady pace. Why two different speeds?

The answer is that generation has two phases with opposite bottlenecks:

- **Prefill** runs the whole prompt through the model in one forward pass. It fills the KV cache and produces the first new token. It has a lot of arithmetic and is limited by arithmetic speed.
- **Decode** produces one token per step. Each step has little arithmetic but must read every weight and the whole KV cache from GPU memory. It is limited by memory speed.

The vLLM paper names the two phases "the prompt phase" and "the autoregressive generation phase". It says that the prompt phase "can be parallelized using matrix-matrix multiplication operations". It says that the generation phase "severely underutilizes GPU computation and becomes memory-bound" (Kwon et al., 2023, §2.2). This lesson explains both sentences with exact shapes, FLOP counts, byte counts and times for Llama-3.1-8B on one H100.

## 2. Mental model

> [!analogy] A clerk, a heavy manual and a stack of forms
> A clerk must consult a 16 GB manual (the weights) to process any form. The manual sits on a far shelf, and one trip to fetch it takes 4.8 ms.
>
> **Prefill** is one trip with 2,000 forms. The clerk fetches the manual once and then works through all 2,000 forms. The writing is the slow part, not the trip.
>
> **Decode** is one trip per form, because each form needs the answer of the form before it. The clerk fetches the whole manual, writes one short line, and returns the manual. The trip is the slow part.
>
> **Batching** helps decode: in one trip, the clerk handles the next form of 64 different customers.
>
> **Where it stops working:** each customer also has a personal folder of earlier notes (the KV cache). The clerk must fetch every folder on every trip. Folders are not shared between customers, and they grow by one page per step. So batching shares the manual trips, but not the folder trips.

## 3. Terms

| Term | Plain meaning |
|---|---|
| prefill | The first forward pass over all prompt tokens at once. It writes the KV cache and produces the first new token. The vLLM paper calls it the prompt phase. |
| decode step | One forward pass with one new token per sequence. It reads the KV cache, appends one entry per layer and produces the next token. |
| FLOP/s | Floating-point operations per second: the arithmetic speed of a chip. |
| HBM | High-bandwidth memory: the main GPU memory that holds the weights and the KV cache. |
| memory bandwidth | Bytes per second that move between HBM and the compute units. About 3.35 TB/s on an H100 SXM. |
| arithmetic intensity | FLOPs done per byte moved from memory. |
| ridge point | The arithmetic intensity at which a chip is equally limited by arithmetic and by memory. About 295 FLOPs per byte for an H100 in dense BF16. |
| compute-bound | Limited by arithmetic speed. The intensity is above the ridge point. |
| memory-bound | Limited by memory bandwidth. The intensity is below the ridge point. |
| matrix-matrix product | Many input rows multiplied by one weight matrix at once. Each weight is used once per row. |
| matrix-vector product | One input row multiplied by a weight matrix. Each weight is used once. |
| batch | Several sequences processed in the same forward pass. |
| TTFT | Time to first token: from the arrival of a request to the first output token. Prefill is most of it. |
| TPOT | Time per output token after the first. It is close to the time of one decode step. |
| end-to-end latency | The total time of a request: $\mathrm{TTFT} + \mathrm{TPOT} \times (n - 1)$ for $n$ output tokens. |
| chunked prefill | Splitting a long prompt into pieces and prefilling one piece per step. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. The two phases on the toy example

The toy example of [L1](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists) shows the difference in shape. Its prompt is "the cat sat" and the next token is "down". $d = 4$ and $d_h = 2$.

**Prefill.** The three prompt rows form a matrix $X$ of shape $[3, 4]$. One matrix-matrix product gives all three keys at once:

$$
X W_K = \begin{bmatrix} 1 & 0 & 1 & 0 \\ 0 & 1 & 0 & 1 \\ 1 & 1 & 0 & 0 \end{bmatrix} \begin{bmatrix} 0 & 0 \\ 0 & 1 \\ 1 & 0 \\ 0 & 1 \end{bmatrix} = \begin{bmatrix} 1 & 0 \\ 0 & 2 \\ 0 & 1 \end{bmatrix}
$$

The same is true for $Q$ and $V$. Each weight of $W_K$ is read once and used three times, once per row. Attention then forms a $3 \times 3$ score matrix with the causal mask.

**Decode.** "down" is one row of shape $[1, 4]$. A matrix-vector product gives $k_4 = [1, 1]$. Each weight is read once and used once. The cache supplies the three old rows of $K$ and $V$. Attention forms one row of scores: $[1, 4, 2, 3]$ before scaling.

> [!key] The shape difference is the whole story
> Prefill multiplies a weight matrix by $T$ rows at once, so each weight that crosses the memory bus feeds $T$ multiply-adds. Decode multiplies it by one row per sequence, so each weight feeds one multiply-add per sequence. The weights must cross the memory bus in both cases.

## 5. Shapes in Llama-3.1-8B

Llama-3.1-8B has $d = 4{,}096$, $L = 32$ layers, $H = 32$ query heads, $H_{kv} = 8$ KV heads, $d_h = 128$, an MLP width of 14,336 and a vocabulary of 128,256 tokens. The table follows one layer for a prompt of $T = 2{,}000$ tokens and batch $B = 1$.

| Tensor | Prefill (2,000 prompt tokens) | Decode step (context 2,001) |
|---|---|---|
| input hidden states | $[1, 2000, 4096]$ | $[1, 1, 4096]$ |
| queries after the head split | $[1, 32, 2000, 128]$ | $[1, 32, 1, 128]$ |
| new keys and new values | $[1, 8, 2000, 128]$ each | $[1, 8, 1, 128]$ each |
| keys and values used by attention | $[1, 8, 2000, 128]$ (just computed) | $[1, 8, 2001, 128]$ (cache plus 1) |
| attention scores | $[1, 32, 2000, 2000]$, causal | $[1, 32, 1, 2001]$ |
| MLP gate and up outputs | $[1, 2000, 14336]$ | $[1, 1, 14336]$ |
| logits | $[1, 128256]$ for the last position | $[1, 128256]$ |

Notes on the table:

- A serving engine needs only the logits of the last prompt position to sample the first new token. Training needs the logits of every position.
- The score tensor of prefill has 128 million entries per layer. FlashAttention computes it in tiles and never stores it in HBM ([part 02 L7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention)).
- In decode, each KV head serves $32 / 8 = 4$ query heads. That is grouped-query attention ([L5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla)).

The next program prints these shapes. It uses PyTorch "meta" tensors. A meta tensor has a shape and a data type but no data, so the program uses no memory and does no arithmetic.

```python
import torch

B, T, d, H, H_kv, d_h = 1, 2000, 4096, 32, 8, 128
g = H // H_kv                                  # 4 query heads per KV head
kw = dict(device="meta", dtype=torch.bfloat16)  # shapes only, no data
W_q = torch.empty(d, H * d_h, **kw)
W_k = torch.empty(d, H_kv * d_h, **kw)
W_v = torch.empty(d, H_kv * d_h, **kw)


def project(x):
    b, t, _ = x.shape
    q = (x @ W_q).view(b, t, H, d_h).transpose(1, 2)
    k = (x @ W_k).view(b, t, H_kv, d_h).transpose(1, 2)
    v = (x @ W_v).view(b, t, H_kv, d_h).transpose(1, 2)
    return q, k, v


# Prefill: all 2,000 prompt tokens in one pass
x = torch.empty(B, T, d, **kw)
q, k_cache, v_cache = project(x)
scores = q @ k_cache.repeat_interleave(g, dim=1).transpose(2, 3)
print("prefill x", tuple(x.shape), "q", tuple(q.shape))
print("prefill k", tuple(k_cache.shape), "scores", tuple(scores.shape))

# Decode: one new token, append its key and value
x = torch.empty(B, 1, d, **kw)
q, k_new, v_new = project(x)
k_cache = torch.cat([k_cache, k_new], dim=2)
v_cache = torch.cat([v_cache, v_new], dim=2)
scores = q @ k_cache.repeat_interleave(g, dim=1).transpose(2, 3)
print("decode  x", tuple(x.shape), "q", tuple(q.shape))
print("decode  k", tuple(k_cache.shape), "scores", tuple(scores.shape))
```

Output:

```text
prefill x (1, 2000, 4096) q (1, 32, 2000, 128)
prefill k (1, 8, 2000, 128) scores (1, 32, 2000, 2000)
decode  x (1, 1, 4096) q (1, 32, 1, 128)
decode  k (1, 8, 2001, 128) scores (1, 32, 1, 2001)
```

What the important lines do:

- `.view(b, t, H, d_h).transpose(1, 2)` splits the 4,096 query numbers into 32 heads of 128 and puts the head axis first ([part 01 L3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches)).
- `torch.cat([k_cache, k_new], dim=2)` appends the new key on the token axis. This is the cache append of a decode step. The token axis grows from 2,000 to 2,001.
- `repeat_interleave(g, dim=1)` copies each KV head 4 times so that the shapes match the 32 query heads. Real kernels do not copy. They let 4 query heads read the same KV head.

## 6. Count the work and the bytes

### 6.1 FLOPs

From [L1](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists), section 9.2:

- Every token that passes through the 32 blocks costs $2 N_{blk}$ FLOPs, with $N_{blk} = 6{,}979{,}584{,}000$ block weights.
- The LM head costs $2 N_{head}$ FLOPs per position that needs logits, with $N_{head} = 128{,}256 \times 4{,}096 = 525{,}336{,}576$.
- Attention costs $4 L d\,t$ FLOPs for a query at position $t$, with $L d = 32 \times 4{,}096$.

So:

$$
F_{\text{prefill}}(T) = 2 N_{blk} T + 4 L d \frac{T(T+1)}{2} + 2 N_{head}
$$

$$
F_{\text{decode}}(t) = 2 N_{blk} + 2 N_{head} + 4 L d\,t \quad \text{per sequence}
$$

A rougher rule is "2 FLOPs per parameter per token": $2 \times 8 \times 10^9 \times T$. It counts the 525M embedding weights, which only feed a table lookup. It also counts the LM head for every prompt position and omits the attention term. For a 2,000-token prompt, the rough rule is about 10% too high.

Kaplan et al. (2020, Table 1) give the forward FLOPs per token as $C_{forward} \approx 2N + 2 n_{layer} n_{ctx} d_{attn}$. Interpretation of these notes: their second term equals our attention term $4 L d\,t$ averaged over a causal sequence. The average position $t$ is about $n_{ctx}/2$.

### 6.2 Bytes

- Every forward pass reads all the weights once from HBM: $2 \times 8{,}030{,}261{,}248 = 16{,}060{,}522{,}496$ bytes, about 16.06 GB in BF16.
- Prefill writes $T$ cache entries of 131,072 bytes each.
- A decode step reads the whole cache of each sequence: $t \times 131{,}072$ bytes for a context of $t$ tokens.

> [!note] A small simplification
> These notes count all 16.06 GB of weights per pass. Strictly, a pass reads only the needed rows of the 1.05 GB embedding table, so the true weight bytes are about 15.01 GB. The weight part of the decode bound then becomes about 4.48 ms instead of 4.79 ms. The simple number is the one to remember: "one decode step reads the whole model".

### 6.3 Time

On an H100 SXM, take about 989 TFLOP/s of dense BF16 arithmetic and about 3.35 TB/s of HBM bandwidth ([part 01 L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth)). A step takes at least the longer of its arithmetic time and its memory time:

$$
t_{\text{step}} \ge \max\left(\frac{F}{989 \times 10^{12}}, \frac{\text{bytes}}{3.35 \times 10^{12}}\right)
$$

This is the roofline model ([part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)). The ratio of the two hardware numbers is the ridge point: $989 / 3.35 \approx 295$ FLOPs per byte. A computation with a higher intensity is compute-bound. A computation with a lower intensity is memory-bound. Real kernels reach only part of both peaks, so real times are longer than these bounds.

```python
PEAK = 989e12            # H100 SXM, dense BF16, FLOP/s (about)
BW = 3.35e12             # H100 SXM, HBM3, bytes/s (about)

L, d = 32, 4096          # Llama-3.1-8B layers and width (H * d_h)
N_BLK = 6_979_584_000    # weights inside the 32 blocks
N_HEAD = 525_336_576     # LM head: 128,256 x 4,096
W_BYTES = 2 * 8_030_261_248   # all weights in BF16
KV_TOKEN = 131_072       # bytes of KV cache per token (BF16)


def prefill(T):
    flops = 2 * N_BLK * T + 4 * L * d * T * (T + 1) / 2 + 2 * N_HEAD
    bytes_ = W_BYTES + T * KV_TOKEN          # read weights, write cache
    return flops, bytes_, max(flops / PEAK, bytes_ / BW)


def decode(context, batch=1):
    flops = batch * (2 * N_BLK + 2 * N_HEAD + 4 * L * d * context)
    bytes_ = W_BYTES + batch * context * KV_TOKEN  # weights once, caches each
    return flops, bytes_, max(flops / PEAK, bytes_ / BW)


f, b, t = prefill(2000)
print(f"prefill 2000: {f:.3e} FLOPs, {b / 1e9:.2f} GB, "
      f"{f / b:.0f} FLOP/byte, {t * 1e3:.1f} ms")
f, b, t = decode(2000)
print(f"decode  1 tok: {f:.3e} FLOPs, {b / 1e9:.2f} GB, "
      f"{f / b:.2f} FLOP/byte, {t * 1e3:.2f} ms, {1 / t:.0f} tokens/s")
```

Output:

```text
prefill 2000: 2.897e+13 FLOPs, 16.32 GB, 1775 FLOP/byte, 29.3 ms
decode  1 tok: 1.606e+10 FLOPs, 16.32 GB, 0.98 FLOP/byte, 4.87 ms, 205 tokens/s
```

What the important lines do:

- `prefill` adds the three FLOP terms of section 6.1. Its bytes are the weights read once plus the cache written once.
- `decode` multiplies the per-sequence FLOPs by `batch`. It counts the weights once, because all sequences in the batch share one read. It counts the cache once per sequence, because each sequence has its own cache.
- `max(flops / PEAK, bytes_ / BW)` is the roofline bound.

## 7. Worked example: prefill of a 2,000-token prompt

> [!example] Worked example: prefill FLOPs and time, Llama-3.1-8B on one H100
> 1. Rough rule: $2 \times 8 \times 10^9 \times 2{,}000 = 3.2 \times 10^{13}$ FLOPs.
> 2. Careful count, block weights: $2 \times 6{,}979{,}584{,}000 \times 2{,}000 = 2.792 \times 10^{13}$ FLOPs.
> 3. Attention: $4 \times 32 \times 4{,}096 \times \frac{2000 \times 2001}{2} = 1.049 \times 10^{12}$ FLOPs, about 3.6% of the total.
> 4. LM head for the last position: $2 \times 525{,}336{,}576 \approx 1.05 \times 10^{9}$ FLOPs.
> 5. Total: about $2.897 \times 10^{13}$ FLOPs.
> 6. Arithmetic time: $2.897 \times 10^{13} / 989 \times 10^{12} \approx 29.3$ ms. With the rough rule: about 32.4 ms.
> 7. Memory time: $16.32 \times 10^{9} / 3.35 \times 10^{12} \approx 4.87$ ms.
> 8. Intensity: $2.897 \times 10^{13} / 16.32 \times 10^{9} \approx 1{,}775$ FLOPs per byte. That is about 6 times the ridge point of 295.
>
> So prefill is **compute-bound**, and its ideal time is about 29 ms. A real engine reaches only part of the peak arithmetic rate, so a measured time is longer.

Prefill also writes the cache: $2{,}000 \times 131{,}072 = 262{,}144{,}000$ bytes, about 0.26 GB. The last position's logits give the first new token. The vLLM paper describes the same output. The prompt phase computes the probability of the first new token. It "also generates the key vectors" and the value vectors of the prompt (Kwon et al., 2023, §2.2).

### 7.1 Prefill grows faster than linearly

The attention term grows with $T^2$. The table uses the `prefill` function of section 6.3.

| Prompt tokens | Ideal prefill time | Attention share of FLOPs |
|---|---|---|
| 1,024 | 14.7 ms | 1.9% |
| 8,192 | 133.4 ms | 13.3% |
| 32,768 | 747.1 ms | 38.1% |
| 65,536 | 2.06 s | 55.2% |
| 131,072 | 6.40 s | 71.1% |

```plot
{
  "title": "Ideal prefill time of Llama-3.1-8B on one H100 (red); x is prompt length in units of 1,024 tokens",
  "xAxis": {"label": "prompt length (x 1,024 tokens)", "domain": [0, 130]},
  "yAxis": {"label": "milliseconds", "domain": [0, 6600]},
  "disableZoom": true,
  "data": [{"fn": "14.453*x + 0.27794*x^2", "color": "#C81D25"}]
}
```

At 128K tokens, attention is most of the prefill work. Interpretation of these notes: this is why long-context serving needs FlashAttention for prefill, and why engines split long prompts into chunks.

A very short prompt is different. Below about 340 tokens, the arithmetic of prefill takes less time than one read of the weights. Such a prefill is memory-bound and takes about one decode step: a 50-token prefill needs about 4.80 ms in this model.

## 8. Worked example: one decode step

> [!example] Worked example: decode time per token at batch 1, Llama-3.1-8B on one H100
> The context holds 2,000 tokens.
>
> 1. FLOPs: $2 \times 6{,}979{,}584{,}000 + 2 \times 525{,}336{,}576 + 4 \times 32 \times 4{,}096 \times 2{,}000 \approx 1.606 \times 10^{10}$.
> 2. Bytes: weights $16.06 \times 10^9$ plus cache $2{,}000 \times 131{,}072 = 0.26 \times 10^9$. Total about $16.32 \times 10^9$.
> 3. Arithmetic time: $1.606 \times 10^{10} / 989 \times 10^{12} \approx 0.016$ ms.
> 4. Memory time: $16.32 \times 10^9 / 3.35 \times 10^{12} \approx 4.87$ ms.
> 5. Intensity: about 0.98 FLOPs per byte, 300 times below the ridge point.
>
> So decode is **memory-bound**. The best case is about 4.87 ms per token, or about 205 tokens per second for one sequence. The short rule gives almost the same: $16 / 3.35 \approx 4.8$ ms, so at most about 208 tokens per second.

Interpretation of these notes: by this bound, the arithmetic units are busy for less than 1% of a batch-1 decode step. That is the meaning of "severely underutilizes GPU computation" in the vLLM paper.

### 8.1 The cache's share of each step grows

Each step reads the whole cache. As the context grows, the cache becomes a large part of the bytes.

| Context (tokens) | Cache bytes per step | Total bytes per step | Ideal step time | Tokens/s | Cache share |
|---|---|---|---|---|---|
| 2,000 | 0.26 GB | 16.32 GB | 4.87 ms | 205 | 1.6% |
| 8,192 | 1.07 GB | 17.13 GB | 5.11 ms | 196 | 6.3% |
| 32,768 | 4.29 GB | 20.36 GB | 6.08 ms | 165 | 21.1% |
| 131,072 | 17.18 GB | 33.24 GB | 9.92 ms | 101 | 51.7% |

At 128K tokens, one sequence's cache is larger than the weights, and the step time doubles.

![Alt text: a timeline with one long prefill block, then short decode steps, and a cache bar that grows by one entry per step](/notes/media/llm-systems/figures/03-2-prefill-decode-timeline.svg)

```video
{"src": "/notes/media/llm-systems/manim/m11-prefill-then-decode.mp4", "caption": "One prefill pass fills the cache, then each decode step reads the weights and the cache to add one token."}
```

## 9. Latency: TTFT and TPOT

The two phases give the two latency numbers that users feel ([part 04 L2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)):

- **TTFT** is mostly queueing time plus prefill time.
- **TPOT** is close to one decode step.
- **End-to-end latency** for $n$ output tokens is $\mathrm{TTFT} + \mathrm{TPOT} \times (n - 1)$.

> [!example] Worked example: ideal latency of one request at batch 1
> A 2,000-token prompt and 500 output tokens, Llama-3.1-8B on one H100, no queue.
>
> 1. TTFT: the prefill, about 29.3 ms.
> 2. TPOT: about 4.87 ms at context 2,000, rising to about 4.89 ms at context 2,499.
> 3. End-to-end: $29.3 \text{ ms} + 499 \times 4.88 \text{ ms} \approx 2.47$ s. The sum of the exact step bounds, computed with the functions of section 6.3, is 2.466 s.
>
> Decode is about 99% of the time of this request, even though prefill does far more arithmetic.

```mermaid
flowchart LR
    A[Request arrives] --> B[Queue]
    B --> C["Prefill: 2,000 tokens, about 29 ms"]
    C --> D[First token]
    D --> E["Decode step: about 4.9 ms"]
    E --> F{Stop?}
    F -- no --> E
    F -- yes --> G[Last token]
```

## 10. Why batching helps decode

### 10.1 Weights are shared, caches are not

Put $b$ sequences in one decode step. The step reads the weights once for all $b$ sequences. It still reads each sequence's own cache.

$$
\text{bytes}(b) = W + b \cdot t \cdot 131{,}072, \qquad F(b) = b \cdot F_{\text{decode}}(t)
$$

Here $W$ is the 16.06 GB of weights and $t$ is the context length of each sequence.

> [!example] Worked example: decode throughput vs batch size, ideal bounds on one H100
> | Batch $b$ | Context 100: step | Context 100: tokens/s | Context 2,000: step | Context 2,000: tokens/s |
> |---|---|---|---|---|
> | 1 | 4.80 ms | 208 | 4.87 ms | 205 |
> | 8 | 4.83 ms | 1,658 | 5.42 ms | 1,476 |
> | 32 | 4.92 ms | 6,505 | 7.30 ms | 4,385 |
> | 64 | 5.04 ms | 12,687 | 9.80 ms | 6,529 |
> | 128 | 5.29 ms | 24,174 | 14.81 ms | 8,643 |
>
> All these steps are memory-bound. With short contexts, the step time hardly grows, so throughput grows almost in proportion to $b$. With 2,000-token contexts, the cache reads grow with $b$. At $b = 128$ they are $128 \times 0.26 = 33.6$ GB, twice the weights.

```plot
{
  "title": "Ideal decode throughput of Llama-3.1-8B on one H100: context 100 (blue) vs context 2,000 (red)",
  "xAxis": {"label": "batch size", "domain": [0, 135]},
  "yAxis": {"label": "output tokens per second", "domain": [0, 26000]},
  "disableZoom": true,
  "data": [
    {"points": [[1, 208], [8, 1658], [16, 3294], [32, 6505], [64, 12687], [128, 24174]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[1, 208], [8, 1658], [16, 3294], [32, 6505], [64, 12687], [128, 24174]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true},
    {"points": [[1, 205], [8, 1476], [16, 2646], [32, 4385], [64, 6529], [128, 8643]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[1, 205], [8, 1476], [16, 2646], [32, 4385], [64, 6529], [128, 8643]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true}
  ]
}
```

Each sequence gets slower as the batch grows: at context 2,000 and $b = 128$, one sequence sees 67.5 tokens per second instead of 205. The server as a whole gets about 42 times more tokens per second. Per-token latency and total throughput trade against each other.

### 10.2 The attention part never becomes compute-bound

Batching raises the intensity of the weight multiplications: $b$ sequences share each weight byte. Attention is different, because each sequence reads its own cache. Count one layer of decode attention for one sequence at context $t$ in Llama-3.1-8B:

- FLOPs: 32 query heads, each $4 t d_h$, so $4 \cdot t \cdot 32 \cdot 128$.
- Bytes: keys and values of 8 KV heads in BF16, so $2 \cdot t \cdot 8 \cdot 128 \cdot 2$.

$$
\text{intensity} = \frac{4 \cdot t \cdot 32 \cdot 128}{2 \cdot t \cdot 8 \cdot 128 \cdot 2} = \frac{32}{8} = 4 \text{ FLOPs per byte}
$$

In general, decode attention in BF16 has an intensity of $H / H_{kv}$ FLOPs per byte. That is 1 for a model without GQA and 4 for Llama-3.1-8B. It does not depend on $t$ or on $b$. It is always far below 295. So when the caches dominate the bytes, decode stays memory-bound at any batch size. With context 2,000, the bound in the table never becomes compute-bound. With context 100, it becomes compute-bound only near $b \approx 424$.

> [!key] What batching does and does not share
> Batching shares the **weight reads** among sequences. It does not share the **cache reads**. That is why the size of the KV cache sets the throughput of a decode server, and why PagedAttention, GQA and FP8 caches matter.

### 10.3 Memory sets the largest batch

At context 2,000, each sequence holds 0.26 GB of cache. A batch of 256 would need about 67 GB of cache plus 16 GB of weights, about 83 GB. That does not fit in an 80 GB H100. So the batch size is limited by memory before it is limited by arithmetic. [L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) computes how many requests fit.

![Alt text: a logarithmic intensity axis with decode near 1, decode attention at 4, the H100 ridge at 295 and prefill near 1,775](/notes/media/llm-systems/figures/03-2-intensity-axis.svg)

## 11. Prefill and decode in one server

A server runs prefills of new requests and decode steps of running requests on the same GPU. The two phases compete:

- A long prefill blocks the decode steps of other requests for its whole duration. Their TPOT rises.
- Many decode steps delay new prefills. Their TTFT rises.

Schedulers manage the two phases with three designs. Part 04 treats each one in depth.

| Design | Idea | Lesson |
|---|---|---|
| Continuous batching | The scheduler adds and removes requests after every step. | [part 04 L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| Chunked prefill | A long prompt is prefilled in chunks, mixed with decode steps of other requests. | [part 04 L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| Disaggregated prefill and decode | Different GPUs run the two phases, and the KV cache moves between them. | [part 04 L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |

The Mistral 7B paper already describes chunking: "If the prompt is very large, we can chunk it into smaller pieces, and pre-fill the cache with each chunk" (Jiang et al., 2023, §2). Each chunk attends to the cache of the earlier chunks plus itself, so the result equals a single prefill.

Decode cannot be parallelized across steps for one sequence. Step $t+1$ needs the token that step $t$ sampled. The vLLM paper states that the computation at different iterations "cannot be parallelized due to the data dependency" (§2.2). Speculative decoding works around this limit by guessing several tokens and checking them in one pass ([part 04 L6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding)).

### Exercises

Write your code in the lab folder `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, in the notebook folder `llm-systems/`.

1. **Rebuild the estimator.** Write `prefill(T)` and `decode(context, batch)` from the formulas of section 6 without copying the code. Acceptance test: `prefill(2000)` gives about 29.3 ms, and `decode(2000)` gives about 4.87 ms.
   - Hint 1: return the maximum of the arithmetic time and the memory time.
   - Hint 2: in `decode`, count the weights once and the cache once per sequence.
2. **Llama-3.1-70B on four H100s.** The model has 70,553,706,496 parameters, 80 layers, $d = 8{,}192$ and 320 KiB of KV cache per token. Assume tensor parallelism splits weights and cache evenly over 4 GPUs, and ignore communication. Compute the ideal decode time per token at context 2,000 and batch 1, and the ideal prefill time for 2,000 tokens. Acceptance test: about 10.6 ms per token and about 71 ms for the prefill.
   - Hint 1: each GPU reads one quarter of the weights in parallel with the others.
   - Hint 2: for the prefill, the rough rule $2 \times 70.55 \times 10^9 \times 2{,}000$ divided by the arithmetic of 4 GPUs is close enough.
3. **Find the compute-bound batch.** With your `decode` function, find the smallest batch at which a decode step at context 100 becomes compute-bound. Then try context 2,000. Acceptance test: about 424 for context 100, and no batch size for context 2,000.
   - Hint 1: set the arithmetic time equal to the memory time and solve for $b$.
   - Hint 2: if the cache bytes per sequence cost more time than the FLOPs per sequence, no batch size can make the step compute-bound.

## 12. Common mistakes

1. **"Decode is slow because it has a lot of arithmetic."** A batch-1 decode step of Llama-3.1-8B has about $1.6 \times 10^{10}$ FLOPs, 0.016 ms of H100 arithmetic. It takes about 4.9 ms because it reads 16 GB.
2. **"Prefill is always compute-bound."** A prompt shorter than about 340 tokens is memory-bound for this model on an H100. Its prefill takes about one decode step.
3. **"Batching makes decode compute-bound."** Batching shares the weight reads only. Each sequence still reads its own cache, and decode attention has an intensity of $H/H_{kv}$, which is 4 here. With long contexts, decode stays memory-bound at any batch size.
4. **"TTFT depends on the output length."** TTFT is queueing plus prefill. It depends on the prompt length and the server load, not on how many tokens follow.
5. **"Prefill computes logits for every prompt token."** Only the last position's logits are needed to sample the first new token. Training computes all of them.
6. **"The KV cache makes decode compute-bound."** The cache removes recomputation. The step then becomes a small amount of arithmetic on a large amount of memory, which is memory-bound.
7. **"A bigger batch is free."** Throughput rises, but each sequence gets slower, and each sequence adds its cache to GPU memory.
8. **"Prefill time is linear in the prompt length."** The attention term grows with $T^2$. For Llama-3.1-8B it is 71% of the prefill FLOPs at 131,072 tokens.

## 13. One-minute explanation

Generation has two phases. Prefill runs the whole prompt through the model at once, so every weight matrix multiplies thousands of rows: it is matrix-matrix work and compute-bound. For Llama-3.1-8B, a 2,000-token prompt is about $2.9 \times 10^{13}$ FLOPs, about 29 ms of ideal H100 time, and prefill sets the time to first token. Prefill also writes the KV cache and produces the first token from the last position's logits. Decode then produces one token per step. Each step reads all 16 GB of weights plus the whole cache to do only about $1.6 \times 10^{10}$ FLOPs. So decode is memory-bound: about 4.9 ms per token, at most about 205 tokens per second for one sequence. Batching helps because many sequences share each read of the weights. But each sequence reads its own cache, and decode attention has an intensity of only $H/H_{kv}$ FLOPs per byte. So with long contexts, the KV cache sets the throughput, and the memory it fills sets the batch size.

## 14. Check questions

```check
{
  "question": "What does prefill produce, and what does it leave behind for decode?",
  "hint": "One output token and one data structure.",
  "answer": "Prefill runs all prompt tokens through all layers in one pass. It produces:\n\n1. The key and value vectors of every prompt token, in every layer and every KV head. They are written to the KV cache.\n2. The logits of the last prompt position. The sampler turns them into the first output token.\n\nDecode then starts from that first token and the filled cache."
}
```

```check
{
  "question": "Why is prefill compute-bound and decode memory-bound? Answer with arithmetic intensity and numbers for Llama-3.1-8B on an H100.",
  "hint": "Both phases read about 16 GB of weights. How many FLOPs does each phase do with them?",
  "answer": "Both phases read the 16.06 GB of BF16 weights once per pass.\n\n- Prefill of 2,000 tokens does about $2.9 \\times 10^{13}$ FLOPs with those bytes: about 1,775 FLOPs per byte. That is above the H100 ridge point of $989/3.35 \\approx 295$, so arithmetic is the limit. The ideal time is about 29 ms.\n- A decode step at batch 1 does about $1.6 \\times 10^{10}$ FLOPs with about 16.3 GB: about 1 FLOP per byte. That is far below 295, so memory bandwidth is the limit. The ideal time is about 4.9 ms.\n\nThe cause is the shape: prefill multiplies each weight by 2,000 rows, decode by one row."
}
```

```check
{
  "question": "A user sends an 8,192-token prompt to Llama-3.1-8B on one idle H100. Estimate the ideal TTFT and the ideal time of the first decode step.",
  "hint": "Use $F_{\\text{prefill}}(T)$ with the attention term, and bytes over bandwidth for the decode step.",
  "answer": "**TTFT (prefill):**\n\n- Blocks: $2 \\times 6.98 \\times 10^9 \\times 8{,}192 \\approx 1.144 \\times 10^{14}$ FLOPs.\n- Attention: $4 \\times 32 \\times 4{,}096 \\times \\frac{8192 \\times 8193}{2} \\approx 1.76 \\times 10^{13}$ FLOPs (13.3%).\n- Total about $1.32 \\times 10^{14}$ FLOPs, so $1.32 \\times 10^{14} / 989 \\times 10^{12} \\approx 133$ ms.\n\n**First decode step:** weights 16.06 GB plus cache $8{,}192 \\times 131{,}072 \\approx 1.07$ GB, so about 17.13 GB. Then $17.13 / 3.35 \\approx 5.11$ ms, about 196 tokens per second.\n\nReal engines are slower than these bounds, and a queue adds to TTFT."
}
```

```check
{
  "question": "Interview follow-up: \"Derive the arithmetic intensity of decode attention. Does batching change it?\"",
  "hint": "Count FLOPs and bytes for one sequence, one layer, context $t$.",
  "answer": "For one sequence and one layer at context $t$:\n\n- FLOPs: each of the $H$ query heads computes $t$ dot products of length $d_h$ (scores). Then it adds $t$ weighted value vectors of length $d_h$. That is $4 t d_h$ per head, $4 t H d_h$ in total.\n- Bytes: the keys and values of $H_{kv}$ KV heads, $2 t H_{kv} d_h$ numbers of 2 bytes in BF16.\n\n$$\n\\text{intensity} = \\frac{4 t H d_h}{4 t H_{kv} d_h} = \\frac{H}{H_{kv}}\n$$\n\nIt is 1 FLOP per byte for multi-head attention and 4 for Llama-3.1-8B (32 query heads, 8 KV heads). Neither $t$ nor the batch size appears. Batching adds sequences, and each brings its own cache bytes with its own FLOPs. So batching cannot raise this intensity. It only raises the intensity of the weight multiplications. With an FP8 cache, the bytes halve and the intensity doubles to $2H/H_{kv}$, still far below the ridge point of about 295."
}
```

```check
{
  "question": "Interview follow-up: \"Batching raises throughput. Why does it also raise per-token latency, and what limits the batch size?\"",
  "hint": "Write the bytes of one step as a function of the batch size $b$.",
  "answer": "Bytes per step: $W + b \\cdot t \\cdot 131{,}072$ for Llama-3.1-8B. The weights $W$ are read once for all $b$ sequences, so throughput grows with $b$. But the cache term grows with $b$ too, so each step takes longer, and each sequence waits longer between its tokens.\n\nAt context 2,000 on one H100, the ideal step is 4.87 ms at $b = 1$ and 14.81 ms at $b = 128$. Throughput rises from 205 to 8,643 tokens/s, but each sequence drops from 205 to 67.5 tokens/s.\n\nThe limit is memory first. At 0.26 GB of cache per sequence, $b = 256$ needs about 67 GB of cache plus 16 GB of weights. That is more than the 80 GB of the GPU. A latency target (TPOT) can limit $b$ earlier."
}
```

```check
{
  "question": "Interview follow-up: \"Estimate the TTFT of a 128K-token prompt on Llama-3.1-8B. What dominates, and what do engines do about it?\"",
  "hint": "At $T = 131{,}072$, compare $2 N_{blk} T$ with $2 L d T^2$.",
  "answer": "- Blocks: $2 \\times 6.98 \\times 10^9 \\times 131{,}072 \\approx 1.83 \\times 10^{15}$ FLOPs.\n- Attention: $4 \\times 32 \\times 4{,}096 \\times \\frac{131072 \\times 131073}{2} \\approx 4.50 \\times 10^{15}$ FLOPs.\n- Total about $6.33 \\times 10^{15}$ FLOPs, so about 6.4 s at 989 TFLOP/s, before any queueing.\n\nAttention is 71% of the work. The prefill also writes $131{,}072 \\times 128$ KiB $= 16$ GiB of cache.\n\nWhat engines do: FlashAttention keeps the $T \\times T$ scores out of HBM. Chunked prefill splits the prompt so that decode steps of other requests can run between the chunks. Prefix caching skips the prefill of a prompt prefix that is already cached. Disaggregated serving runs prefill on separate GPUs."
}
```

```check
{
  "question": "Interview follow-up: \"Why can't you parallelize decode over time the way you parallelize prefill over the prompt?\"",
  "hint": "What does step $t+1$ need from step $t$?",
  "answer": "In prefill, all prompt tokens are known before the pass, so the model can process them as one matrix. In decode, the input of step $t+1$ is the token that step $t$ sampled. It does not exist until step $t$ finishes. The vLLM paper states that the computation at different iterations \"cannot be parallelized due to the data dependency\".\n\nTwo ways to get more work per weight read anyway:\n\n1. Batch many independent sequences in one step (continuous batching).\n2. Guess several future tokens cheaply and verify them in one pass of the large model (speculative decoding). Verification is a short prefill-like pass, so it has a higher intensity than a single decode step."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\nPEAK = 989e12            # H100 SXM, dense BF16, FLOP/s (about)\nBW = 3.35e12             # H100 SXM, HBM3, bytes/s (about)\n\nL, d = 32, 4096          # Llama-3.1-8B layers and width (H * d_h)\nN_BLK = 6_979_584_000    # weights inside the 32 blocks\nN_HEAD = 525_336_576     # LM head: 128,256 x 4,096\nW_BYTES = 2 * 8_030_261_248   # all weights in BF16\nKV_TOKEN = 131_072       # bytes of KV cache per token (BF16)\n\n\ndef prefill(T):\n    flops = 2 * N_BLK * T + 4 * L * d * T * (T + 1) / 2 + 2 * N_HEAD\n    bytes_ = W_BYTES + T * KV_TOKEN          # read weights, write cache\n    return flops, bytes_, max(flops / PEAK, bytes_ / BW)\n\n\ndef decode(context, batch=1):\n    flops = batch * (2 * N_BLK + 2 * N_HEAD + 4 * L * d * context)\n    bytes_ = W_BYTES + batch * context * KV_TOKEN  # weights once, caches each\n    return flops, bytes_, max(flops / PEAK, bytes_ / BW)\n\n\nprint(round(prefill(2000)[2] * 1e3, 1), \"ms\")   # 29.3 ms\nprint(round(decode(2000)[2] * 1e3, 2), \"ms\")    # 4.87 ms\n```"
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\nPEAK, BW, GPUS = 989e12, 3.35e12, 4\nN = 70_553_706_496               # Llama-3.1-70B parameters\nW_GPU = 2 * N / GPUS             # BF16 weight bytes on each GPU\nKV_GPU = 327_680 / GPUS          # cache bytes per token on each GPU\n\ndecode = (W_GPU + 2000 * KV_GPU) / BW\nprefill = 2 * N * 2000 / (GPUS * PEAK)\nprint(f\"weights per GPU {W_GPU / 1e9:.2f} GB\")\nprint(f\"decode {decode * 1e3:.2f} ms/token, {1 / decode:.0f} tokens/s\")\nprint(f\"prefill {prefill * 1e3:.1f} ms\")\n```\n\nOutput:\n\n```text\nweights per GPU 35.28 GB\ndecode 10.58 ms/token, 95 tokens/s\nprefill 71.3 ms\n```\n\nThe four GPUs read their quarters of the weights at the same time, so the decode bound is the time to read 35.28 GB. Real tensor parallelism adds two all-reduce operations per layer, so measured times are longer ([part 04 L8](/notes/ai/llm-systems/04-inference/l8-parallelism))."
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\nPEAK, BW = 989e12, 3.35e12\nL, d = 32, 4096\nN_BLK, N_HEAD = 6_979_584_000, 525_336_576\nW_BYTES, KV_TOKEN = 2 * 8_030_261_248, 131_072\n\n\ndef compute_bound_batch(context):\n    t_flops = (2 * N_BLK + 2 * N_HEAD + 4 * L * d * context) / PEAK  # per seq\n    t_cache = context * KV_TOKEN / BW                                 # per seq\n    t_weights = W_BYTES / BW                                          # shared\n    # compute-bound when b * t_flops >= t_weights + b * t_cache\n    if t_flops <= t_cache:\n        return None                    # cache reads always cost more\n    return t_weights / (t_flops - t_cache)\n\n\nfor c in (100, 2000):\n    print(c, compute_bound_batch(c))\n```\n\nOutput:\n\n```text\n100 423.61940392094766\n2000 None\n```\n\nAt context 2,000, one sequence needs about 16 microseconds of arithmetic but about 78 microseconds to read its cache. No batch size can close that gap. Setting the two per-sequence times equal gives the break-even context: about 393 tokens. Above it, decode of this model on an H100 stays memory-bound at every batch size."
}
```

## 15. Links

- Previous: [L1: Why the KV cache exists](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists)
- Next: [L3: The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)
- Hardware numbers: [part 01 L5: GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth)
- The roofline in depth: [part 04 L3: Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)
- Metrics: [part 04 L2: Latency and throughput metrics](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)
- Scheduling: [part 04 L4: Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)
- Attention cost: [part 02 L7: The cost of attention and FlashAttention](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention)
- The paper: [02: LLM serving before vLLM](/notes/papers/llm-serving/2023-pagedattention/02-background-llm-serving-before-vllm) and [03: Where does KV cache memory go?](/notes/papers/llm-serving/2023-pagedattention/03-the-question)
- An earlier, shorter lesson: [context engineering L4: Attention and the cost of length](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length)

### Sources

- Kwon et al., "Efficient Memory Management for Large Language Model Serving with PagedAttention", SOSP 2023, §1 and §2.2: https://arxiv.org/abs/2309.06180 (checked on 2026-10-15)
- Jiang et al., "Mistral 7B", 2023, §2 (pre-fill and chunking): https://arxiv.org/abs/2310.06825 (checked on 2026-10-15)
- Llama Team, "The Llama 3 Herd of Models", Table 3: https://arxiv.org/abs/2407.21783 (checked on 2026-10-15)
- Hugging Face model API for `meta-llama/Llama-3.1-8B` (8,030,261,248 BF16 parameters): https://huggingface.co/api/models/meta-llama/Llama-3.1-8B (checked on 2026-10-15)
- Hugging Face model API for `meta-llama/Llama-3.1-70B` (70,553,706,496 BF16 parameters): https://huggingface.co/api/models/meta-llama/Llama-3.1-70B (checked on 2026-10-15)
- NVIDIA H100 product page (H100 SXM: 80 GB, 3.35 TB/s, 1,979 teraFLOPS BF16 with sparsity): https://www.nvidia.com/en-us/data-center/h100/ (checked on 2026-10-15)
- Kaplan et al., "Scaling Laws for Neural Language Models", Table 1 (forward FLOPs per token $2N + 2 n_{layer} n_{ctx} d_{attn}$): https://arxiv.org/abs/2001.08361 (checked on 2026-10-15)
