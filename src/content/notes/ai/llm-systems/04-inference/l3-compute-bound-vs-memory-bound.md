---
title: "L3: Compute-bound vs memory-bound"
order: 3
summary: "Why one H100 with about 989 TFLOP/s produces only about 200 tokens per second for one user of an 8B model. Arithmetic intensity, the roofline and its ridge point, the intensity of a linear layer, of decode attention and of prefill, and a step-time model that shows why batching raises throughput, why per-token latency rises, and why long contexts cap throughput."
status: not-started
tags: [inference, roofline, arithmetic-intensity, memory-bandwidth, batching, prefill, decode, gpu]
---

## 1. The question this idea answers

An H100 SXM can do about 989 trillion BF16 operations per second. One output token of Llama-3.1-8B needs about $2 \times 8.03 \times 10^9 \approx 1.6 \times 10^{10}$ operations. Divide one by the other and you expect about 61,600 tokens per second. A single user gets about 200. Where did 99.7% of the GPU go?

The answer is that the GPU waits for memory, not for arithmetic. To answer an interviewer who asks "is LLM inference compute-bound or memory-bound?", you must say: it depends on the phase and on the batch size. Then you must show the numbers. This lesson builds the tool for that: arithmetic intensity and the roofline. It then applies the tool to every part of a transformer step.

## 2. Mental model

> [!analogy] A fast cook and a heavy cookbook in the cellar
> A cook works very fast. But for every round of cooking, the whole cookbook (the weights, 16 GB) must be carried up from the cellar (HBM, the GPU's main memory). The stairs are the bottleneck. If the cook makes one dish per trip, the cook waits most of the time. If the cook makes 64 dishes per trip, the trip cost is shared by 64 dishes, and the kitchen produces far more. At some number of dishes, the cook becomes the bottleneck instead of the stairs.
>
> Each guest also has a personal notebook (the KV cache) that must be carried up for that guest's dish, every round. The notebooks are not shared. With many guests and thick notebooks, the stairs are full of notebooks, and sharing the cookbook no longer helps much.
>
> **Where it stops working:** a GPU can carry and cook at the same time, and it keeps some recent pages near the cook (caches). Real kernels also never reach the full speed of the cook or of the stairs. The model gives bounds, not exact times.

## 3. Terms

| Term | Plain meaning |
|---|---|
| FLOP | One floating-point operation, for example one multiplication or one addition. A multiply-add counts as 2 FLOPs. |
| FLOP/s | FLOPs per second. TFLOP/s means $10^{12}$ FLOPs per second. |
| HBM | High-bandwidth memory: the main memory of a data-center GPU. The H100 SXM has 80 GB of HBM3. |
| memory bandwidth | Bytes per second that can move between HBM and the compute units. 3.35 TB/s on the H100 SXM. |
| arithmetic intensity | FLOPs done per byte moved from or to HBM. Written $I$, in FLOP/byte. |
| roofline | The bound $\text{attainable FLOP/s} = \min(\text{peak FLOP/s}, \ I \times \text{bandwidth})$. |
| ridge point | The intensity where the two limits meet: peak FLOP/s divided by bandwidth. About 295 FLOP/byte on the H100 SXM. |
| memory-bound | Limited by bandwidth: intensity below the ridge. More arithmetic per byte would be free. |
| compute-bound | Limited by peak FLOP/s: intensity above the ridge. Faster memory would not help. |
| GEMM | General matrix-matrix multiplication, for example many tokens times a weight matrix. |
| GEMV | Matrix-vector multiplication, for example one token times a weight matrix. Intensity about 1. |
| batch size | The number of sequences that run together in one decode step, written $B$. |
| context length | The number of tokens whose keys and values a sequence has in the KV cache. |
| GQA group size | Query heads per KV head: $g = H / H_{kv}$. 4 for Llama-3.1-8B, 8 for Llama-3.1-70B. |
| step time | The time of one forward pass over the batch. During decode, it is the TPOT of every running request. |
| MFU | Model FLOPs utilization: achieved useful FLOP/s divided by peak FLOP/s. |
| bandwidth utilization | Achieved bytes per second divided by peak bandwidth. The memory-side twin of MFU. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. Two speed limits

A GPU kernel must do its arithmetic and move its data. Each takes time:

$$
t_{\text{compute}} = \frac{\text{FLOPs}}{\text{peak FLOP/s}}, \qquad t_{\text{memory}} = \frac{\text{bytes moved}}{\text{bandwidth}}
$$

The GPU can overlap the two, so a good kernel takes about the larger of them:

$$
t \gtrsim \max(t_{\text{compute}}, \ t_{\text{memory}})
$$

The datasheet numbers that these notes use (NVIDIA product pages, checked on 2026-10-15):

| GPU | Memory | Bandwidth | BF16 Tensor Core, dense | Ridge point |
|---|---|---|---|---|
| H100 SXM | 80 GB HBM3 | 3.35 TB/s | 989.5 TFLOP/s (the page lists 1,979 "with sparsity") | $989.5 / 3.35 \approx 295$ FLOP/byte |
| A100 80 GB SXM | 80 GB HBM2e | 2,039 GB/s | 312 TFLOP/s (624 with sparsity) | $312 / 2.039 \approx 153$ FLOP/byte |

> [!trap] Divide the datasheet number by 2
> NVIDIA marks the Tensor Core rows of the H100 table with "* With sparsity". That number assumes 2:4 structured sparsity in the weights. Dense LLM weights do not have it. The dense BF16 peak is half: about 989.5 TFLOP/s.

[GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) explains HBM, SRAM and Tensor Cores from zero.

## 5. Arithmetic intensity and the roofline

> [!key] One number decides the bottleneck
> Arithmetic intensity $I$ = FLOPs / bytes moved. If $I$ is below the ridge point (about 295 on an H100), the kernel is memory-bound and its speed is $I \times 3.35$ TB/s. If $I$ is above the ridge, it is compute-bound at about 989.5 TFLOP/s.

Divide both times by the bytes moved and you get the **roofline**:

$$
\text{attainable FLOP/s} = \min\left(\text{peak FLOP/s}, \ I \times \text{bandwidth}\right)
$$

On a log-log plot, this is a sloped line (bandwidth) that meets a flat roof (peak compute) at the ridge point:

$$
I_{\text{ridge}} = \frac{\text{peak FLOP/s}}{\text{bandwidth}} = \frac{989.5 \times 10^{12}}{3.35 \times 10^{12}} \approx 295.4 \text{ FLOP/byte}
$$

![Alt text: the H100 roofline on log-log axes with the ridge at 295 FLOP/byte and points for decode, decode attention and prefill](/notes/media/llm-systems/figures/04-3-roofline.svg)

The rest of this lesson derives the points on the figure. Read them now and return to them later:

- Decode at batch 1 sits at intensity about 1, far left: about 3.35 TFLOP/s attainable, 0.34% of peak.
- Decode attention with GQA group size 4 sits at about 4, no matter the batch size.
- Decode at batch 64 with short contexts sits at about 64.
- Decode at batch 213 with 2,000-token contexts sits at only about 51, because the KV cache reads dilute the intensity.
- Prefill of 2,000 tokens sits at about 1,000, on the flat roof.

```video
{
  "src": "/notes/media/llm-systems/manim/m18-batch-size-on-the-roofline.mp4",
  "caption": "As the decode batch grows, the operating point slides right along the bandwidth slope of the roofline, until long contexts pin it far below the ridge."
}
```

## 6. The intensity of a linear layer

Most FLOPs of a transformer are in linear layers ([matrix multiplication](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication)). Take a weight matrix of shape $d_{in} \times d_{out}$ in BF16 (2 bytes per value), and an input of $b$ tokens.

- **FLOPs.** Each of the $b \times d_{out}$ outputs is a dot product of length $d_{in}$: $d_{in}$ multiplications and $d_{in}$ additions. Total: $2 \, b \, d_{in} \, d_{out}$.
- **Bytes.** Read the weights once: $2 \, d_{in} \, d_{out}$. Read the input: $2 \, b \, d_{in}$. Write the output: $2 \, b \, d_{out}$.

$$
I(b) = \frac{2 \, b \, d_{in} \, d_{out}}{2 \, d_{in} \, d_{out} + 2 \, b \, (d_{in} + d_{out})}
$$

For a square layer, $d_{in} = d_{out} = d$, this simplifies to

$$
I(b) = \frac{b \, d}{d + 2b} = \frac{b}{1 + 2b/d}
$$

When $b$ is much smaller than $d$, the denominator is about 1 and $I(b) \approx b$. **The intensity of a linear layer is about the number of tokens that share one read of the weights.**

> [!example] Worked example: a 4096 × 4096 layer of Llama-3.1-8B
> With $d = 4096$, $I(b) = b / (1 + b / 2048)$.
>
> | Tokens $b$ | $I(b)$ in FLOP/byte | Bound on an H100 |
> |---|---|---|
> | 1 | $1 / 1.0005 \approx 1.0$ | memory |
> | 64 | $64 / 1.03125 \approx 62.1$ | memory |
> | 256 | $256 / 1.125 \approx 227.6$ | memory |
> | 345 | $345 / 1.1685 \approx 295.3$ | at the ridge |
> | 2,000 | $2000 / 1.9766 \approx 1{,}011.9$ | compute |
>
> Solve $b / (1 + b/2048) = 295.37$ for the exact crossing: $b = 295.37 / (1 - 295.37/2048) = 295.37 / 0.85578 \approx 345$ tokens. The activation bytes push the crossing from 295 to about 345 tokens.

```python
def linear_intensity(b, d_in, d_out, bytes_per_value=2):
    flops = 2 * b * d_in * d_out
    moved = bytes_per_value * (d_in * d_out + b * (d_in + d_out))   # weights + input + output
    return flops / moved

for b in (1, 64, 256, 345, 2000):
    print(b, round(linear_intensity(b, 4096, 4096), 1))
```

Output:

```text
1 1.0
64 62.1
256 227.6
345 295.3
2000 1011.9
```

- `flops` counts one multiply and one add per term of each dot product.
- `moved` counts each weight once. This is the key assumption: all $b$ tokens use the weights while they are loaded.
- With $b = 1$ (one token, a GEMV), every weight byte is used for exactly one multiply-add. That is the worst case.

## 7. The whole decode step

### 7.1 Batch 1: the GPU waits for memory

One decode step at batch 1 multiplies one token through every weight matrix. So it must read essentially all weights once.

> [!example] Worked example: the batch-1 speed limit of Llama-3.1-8B on an H100
> - Bytes: about $8.03 \times 10^9$ parameters × 2 bytes = $16.06 \times 10^9$ bytes.
> - Memory time: $16.06 \times 10^9 / 3.35 \times 10^{12} = 4.794$ ms.
> - FLOPs: about $2 \times 8.03 \times 10^9 = 1.606 \times 10^{10}$.
> - Compute time: $1.606 \times 10^{10} / 989.5 \times 10^{12} = 0.0162$ ms.
> - The step takes at least 4.794 ms, so at most $1 / 0.004794 \approx 208.6$ tokens per second for one sequence.
> - Compute is busy $0.0162 / 4.794 \approx 0.34\%$ of the time.

A finer count: the embedding table ($128{,}256 \times 4096$ values, about 525M parameters) is not read in full. A decode step reads only one row of it. Without it, the step reads about 15.01 GB, so the bound becomes about 4.48 ms, or about 223 tokens per second. These notes keep the rounded 16 GB, like [part 03](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode).

### 7.2 Where the bytes go, layer by layer

vLLM stores the query, key and value projections of Llama-3.1-8B as one fused matrix of shape $4096 \times 6144$. It stores the gate and up projections as one matrix of shape $4096 \times 28672$ (vLLM 0.31.0 benchmark file `weight_shapes.py`). With these shapes, one decode step at batch 1 and 2,000 cached tokens moves these bytes:

| Part | Weight shape | Bytes per layer | FLOPs per layer at $B = 1$ | Share of the step's bytes |
|---|---|---|---|---|
| Q, K, V projection (fused) | $4096 \times 6144$ | 50.3 MB | 50.3 M | 10.5% |
| Output projection | $4096 \times 4096$ | 33.6 MB | 33.6 M | 7.0% |
| Gate and up projection (fused) | $4096 \times 28672$ | 234.9 MB | 234.9 M | 49.2% |
| Down projection | $14336 \times 4096$ | 117.4 MB | 117.4 M | 24.6% |
| Attention over the KV cache | 2,000 cached tokens | 8.2 MB | 32.8 M | 1.7% |
| LM head (once, not per layer) | $4096 \times 128256$ | 1,050.7 MB | 1,050.7 M | 6.9% |

- Per layer, the weights are 436.2 MB. Over 32 layers that is 13.96 GB. With the LM head, the weights are about 15.01 GB, and the KV cache adds 0.26 GB. The total is about 15.27 GB per step.
- The MLP alone moves about 74% of the bytes. The attention projections move about 18%. At this context length, the KV cache is under 2%.
- Every linear layer does exactly 1 FLOP per byte at batch 1: 2 FLOPs per weight, 2 bytes per weight.
- Attention does 4 FLOPs per byte, because of GQA (section 7.4).

### 7.3 Batch B: the weight read is shared

With $B$ sequences in one decode step, every weight matrix multiplies $B$ tokens. The weight bytes stay the same, the FLOPs grow $B$ times. Ignoring the KV cache for now:

$$
I_{\text{decode}} \approx \frac{2 P B}{2 P} = B
$$

Here $P$ is the parameter count. So decode at batch $B$ has intensity about $B$. It stays memory-bound until $B$ reaches about the ridge point, 295 on an H100. Up to that point, adding sequences to the batch costs almost no extra time. This is why batching is the most important optimization of LLM serving ([L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)).

### 7.4 Decode attention: the part that batching cannot share

Attention is different. Each sequence reads **its own** KV cache. Nothing is shared between sequences, so batching does not raise the intensity of attention.

Count it per cached token, per layer, for one sequence in a decode step ([GQA](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) has the head layout):

- **Bytes.** Read one key and one value of length $d_h$ for each of the $H_{kv}$ KV heads, in BF16: $2 \times H_{kv} \times d_h \times 2$ bytes.
- **FLOPs.** Each of the $H$ query heads computes one score $q \cdot k$ ($2 d_h$ FLOPs) and adds one weighted value $p \, v$ ($2 d_h$ FLOPs): $4 \, d_h \, H$ FLOPs.

$$
I_{\text{attention}} = \frac{4 \, d_h \, H}{4 \, H_{kv} \, d_h} = \frac{H}{H_{kv}} = g
$$

> [!example] Worked example: decode attention intensity
> | Model | $H$ | $H_{kv}$ | $I = H / H_{kv}$ |
> |---|---|---|---|
> | Multi-head attention (MHA), for example Llama-2-7B | 32 | 32 | 1 |
> | Llama-3.1-8B (GQA) | 32 | 8 | 4 |
> | Llama-3.1-70B (GQA) | 64 | 8 | 8 |
> | Multi-query attention (MQA), 32 heads | 32 | 1 | 32 |
>
> Llama-3.1-8B: FLOPs per cached token per layer $= 4 \times 128 \times 32 = 16{,}384$. Bytes $= 2 \times 8 \times 128 \times 2 = 4{,}096$. Intensity $= 16{,}384 / 4{,}096 = 4$. Even with MQA, 32 FLOP/byte is far below the ridge of 295. Decode attention is always memory-bound on this GPU.

Two consequences:

1. **GQA and MLA raise intensity.** They cut the bytes per cached token while the FLOPs stay. GQA with group size 4 makes attention 4 times more efficient than MHA, at the same speed of memory.
2. **An FP8 KV cache doubles intensity.** It halves the bytes per cached token ([shrinking the KV cache](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache)).

### 7.5 A step-time model

Put the parts together. For $B$ sequences that each have $C$ cached tokens:

$$
t_{\text{memory}} = \frac{2P + B \, C \, s_{kv}}{\text{bandwidth}}, \qquad
t_{\text{compute}} = \frac{2 P B + 4 \, C \, d \, L \, B}{\text{peak FLOP/s}}, \qquad
t_{\text{step}} \approx \max(t_{\text{memory}}, t_{\text{compute}})
$$

- $s_{kv}$: KV cache bytes per token, 131,072 for Llama-3.1-8B in BF16 ([the size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)).
- $4 C d L$: attention FLOPs per sequence. Per layer, $4 d_h H$ per cached token, and $d_h H = d = 4096$.
- The model ignores activation bytes, kernel launch gaps and communication. It gives a lower bound on the step time.

```python
P = 8_030_261_248          # parameters of Llama-3.1-8B
BW, PEAK = 3.35e12, 989.5e12
KV, d, L = 131_072, 4096, 32

def step_time(B, C):
    t_mem = (2 * P + B * C * KV) / BW
    t_cmp = (2 * P * B + 4 * C * d * L * B) / PEAK
    return max(t_mem, t_cmp), t_mem, t_cmp

for C in (0, 2000):
    for B in (1, 64, 213, 512):
        t, m, c = step_time(B, C)
        print(f"C={C:4d} B={B:3d} step={t*1e3:6.2f} ms  memory={m*1e3:6.2f}  compute={c*1e3:5.2f}  tok/s={B/t:8.0f}")
```

Output:

```text
C=   0 B=  1 step=  4.79 ms  memory=  4.79  compute= 0.02  tok/s=     209
C=   0 B= 64 step=  4.79 ms  memory=  4.79  compute= 1.04  tok/s=   13350
C=   0 B=213 step=  4.79 ms  memory=  4.79  compute= 3.46  tok/s=   44429
C=   0 B=512 step=  8.31 ms  memory=  4.79  compute= 8.31  tok/s=   61611
C=2000 B=  1 step=  4.87 ms  memory=  4.87  compute= 0.02  tok/s=     205
C=2000 B= 64 step=  9.80 ms  memory=  9.80  compute= 1.11  tok/s=    6529
C=2000 B=213 step= 21.46 ms  memory= 21.46  compute= 3.68  tok/s=    9925
C=2000 B=512 step= 44.86 ms  memory= 44.86  compute= 8.85  tok/s=   11413
```

![Alt text: per-step bars of weight-read time and KV-read time at 2,000 cached tokens, next to small compute bars](/notes/media/llm-systems/figures/04-3-decode-step-time.svg)

```plot
{
  "title": "Idealized decode throughput of Llama-3.1-8B on one H100 (tokens/s): short contexts (blue) and 2,000-token contexts (red)",
  "xAxis": {"label": "batch size B", "domain": [0, 520]},
  "yAxis": {"label": "output tokens per second", "domain": [0, 66000]},
  "disableZoom": true,
  "data": [
    {"points": [[1, 209], [16, 3337], [32, 6675], [64, 13350], [128, 26699], [192, 40049], [256, 53398], [295, 61533], [320, 61611], [384, 61611], [448, 61611], [512, 61611]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[1, 209], [16, 3337], [32, 6675], [64, 13350], [128, 26699], [192, 40049], [256, 53398], [295, 61533], [320, 61611], [384, 61611], [448, 61611], [512, 61611]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true},
    {"points": [[1, 205], [16, 2646], [32, 4385], [64, 6529], [96, 7801], [128, 8643], [160, 9241], [192, 9688], [213, 9925]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[1, 205], [16, 2646], [32, 4385], [64, 6529], [96, 7801], [128, 8643], [160, 9241], [192, 9688], [213, 9925]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true}
  ]
}
```

Read the two cases:

1. **Short contexts ($C \approx 0$).** The step time stays at 4.79 ms until about $B = 295$. Throughput grows linearly with the batch, from 209 to about 61,600 tokens per second. Above $B \approx 295$, compute is the limit. Throughput stays at $989.5 \times 10^{12} / (2P) \approx 61{,}611$ tokens per second, and each extra sequence makes the step longer.
2. **2,000-token contexts.** At $B = 61$, the KV reads already equal the weight reads: $61.3 \times 2000 \times 131{,}072 \approx 16.06 \times 10^9$ bytes. After that, every new sequence adds about 0.078 ms of KV reading to the step. Throughput saturates near 10,000 tokens per second and never reaches the compute roof. At $B = 213$, compute is busy only $3.68 / 21.46 \approx 17\%$ of the time.

> [!key] Long contexts make decode memory-bound at any batch size
> Batching shares the weights but not the KV cache. With long contexts, the KV reads dominate, so the intensity of a whole step stays far below the ridge. This is why GQA, MLA, FP8 KV caches and PagedAttention's tighter memory packing matter so much for throughput.

### 7.6 Memory capacity sets the largest batch

The batch cannot grow without limit. All KV caches must fit in HBM. With vLLM's default `gpu_memory_utilization` of 0.92 (vLLM 0.31.0, checked on 2026-10-15), an 80 GB H100 gives about $0.92 \times 80 = 73.6$ GB to vLLM. After 16.06 GB of weights, about 57.5 GB remain for the KV cache and everything else.

At 2,000 tokens per sequence (262 MB), that is at most $57.5 / 0.262 \approx 219$ sequences. The figures of this lesson use 213, the value for a utilization of 0.9. Older releases used 0.9 as the default: the docs of vLLM 0.4.1 say "Default: 0.9". Activations and CUDA graphs need some memory too, so the real limit is a little lower. [Sizing GPUs](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) does this budget in detail.

### 7.7 Why per-token latency rises with the batch

During decode, the step time is the TPOT of every running request. The model of section 7.5 gives its slope in each regime:

$$
\text{memory regime:} \quad \frac{\partial\, t_{\text{step}}}{\partial B} = \frac{C \, s_{kv}}{\text{bandwidth}}, \qquad
\text{compute regime:} \quad \frac{\partial\, t_{\text{step}}}{\partial B} = \frac{2P + 4 C d L}{\text{peak FLOP/s}}
$$

> [!example] Worked example: the cost of one more sequence
> Llama-3.1-8B on one H100.
>
> - Memory regime with $C = 2000$: $2000 \times 131{,}072 / 3.35 \times 10^{12} \approx 0.078$ ms per added sequence. From $B = 64$ (9.80 ms) to $B = 128$ (14.81 ms), the step grows by $64 \times 0.078 \approx 5.0$ ms.
> - Memory regime with $C \approx 0$: almost 0 ms per added sequence. The step stays at 4.79 ms up to $B \approx 295$.
> - Compute regime with $C \approx 0$: $2 \times 8.03 \times 10^9 / 989.5 \times 10^{12} \approx 0.016$ ms per added sequence. From $B = 295$ to $B = 512$, the step grows from about 4.79 ms to 8.31 ms.

So per-token latency rises for two different reasons. With long contexts, each sequence brings its own KV bytes. With short contexts and very large batches, each sequence brings its own FLOPs. A scheduler that limits `max_num_seqs` or the token budget protects TPOT in both cases ([L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)).

### 7.8 Small kernels and launch overhead

The roofline assumes that the GPU always works on something. At small batch, a decode step is a long chain of small kernels: several per layer, so hundreds per step for a 32-layer model. Each kernel launch costs CPU time, and the GPU can sit idle between launches. CUDA graphs record the chain of kernels once and replay it with one launch. The vLLM V1 announcement says that V1 "introduces *piecewise CUDA graphs* to alleviate the limitations of CUDA graphs". Interpretation of these notes: when measured bandwidth utilization at batch 1 is low, launch overhead is a common cause.

## 8. Prefill: compute-bound from a few hundred tokens

During prefill, one sequence sends all $T$ prompt tokens through every linear layer at once. So $b = T$ in the formula of section 6. For Llama-3.1-8B on an H100, the linear layers become compute-bound at about 345 prompt tokens.

> [!example] Worked example: prefill of 2,000 tokens
> - Linear-layer intensity: $I(2000) \approx 1{,}012$ FLOP/byte, above the ridge of 295. Compute-bound.
> - FLOPs: $2 \times 8.03 \times 10^9 \times 2000 = 3.212 \times 10^{13}$ for the linear layers, plus about $2 T^2 d L = 1.05 \times 10^{12}$ for causal attention.
> - Ideal time: $3.317 \times 10^{13} / 989.5 \times 10^{12} \approx 33.5$ ms.
> - Per prompt token: $33.5 / 2000 \approx 0.017$ ms. A decode token at batch 1 costs 4.79 ms, about 286 times more.

Sarathi-Serve (OSDI 2024) measured the same effect on A100 GPUs. It reports that "prefill throughput starts saturating around sequence length of 512 tokens". In a footnote it says that the operators were expected to become compute-bound at about 200 tokens on A100s. In practice this happened "at ∼500-600 tokens for higher tensor parallel dimensions due to fixed overheads". The theory of these notes gives a similar number: the A100 ridge is about 153 FLOP/byte, and for $d = 4096$ the crossing is $153 / (1 - 153/2048) \approx 165$ tokens.

The consequence for scheduling: a prompt of a few hundred tokens already fills the GPU's compute. Adding more prompt tokens to a step makes the step longer in proportion. That is why a long prefill delays every decode in the same step, and why [chunked prefill](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) exists.

| Phase | Typical intensity | Bound on an H100 | Optimized by |
|---|---|---|---|
| Prefill, linear layers | about $T$ (hundreds to thousands) | compute | FlashAttention, large chunks, FP8 compute |
| Prefill, attention | grows with $T$ (FlashAttention keeps tiles in SRAM) | compute for long prompts | [FlashAttention](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| Decode, linear layers | about $B$ | memory until $B \approx 295$ | batching, weight quantization |
| Decode, attention | $g = H / H_{kv}$ | always memory | GQA, MLA, FP8 KV cache, shorter contexts |

### 8.1 Prefill attention: FlashAttention moves it to the right

Prefill attention also has an intensity, and the kernel decides it. Count one layer of Llama-3.1-8B for one prompt of $T$ tokens. With a causal mask, a good kernel skips the upper triangle, so the FLOPs are about $2 T^2 d$ ($QK^\top$ and $PV$ at $2 T^2 d$ each, halved).

- **Standard attention** writes the $T \times T$ score matrix $S$ and the probability matrix $P$ of every head to HBM, then reads them back. That is $4 \times 2 T^2$ bytes per head, $256\, T^2$ bytes for 32 heads. Intensity: $2 T^2 \times 4096 / 256 T^2 = 32$ FLOP/byte, for any $T$. Memory-bound on an H100.
- **FlashAttention** keeps $S$ and $P$ in on-chip SRAM, tile by tile. HBM traffic is only $Q$, $K$, $V$ and the output: $2T \times (4096 + 2048 + 4096) = 20{,}480\, T$ bytes. Intensity: $2 T^2 \times 4096 / 20{,}480\, T = 0.4\, T$. At $T = 2000$, that is 800 FLOP/byte: compute-bound. The crossing is at $T \approx 295 / 0.4 \approx 740$ tokens.

So FlashAttention does not reduce FLOPs. It removes the $T^2$ bytes, which moves prefill attention from the bandwidth slope to the compute roof. [The cost of attention and FlashAttention](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) derives the online softmax that makes this possible.

## 9. Use the model on real measurements

The model gives bounds. Comparing a measurement with the bound tells you how much room is left.

> [!example] Worked example: bandwidth utilization from a measured TPOT
> Assume a measurement: Llama-3.1-8B in BF16 on one H100, batch 1, short context, TPOT = 6.0 ms.
>
> - Achieved bandwidth: $16.06 \times 10^9 \text{ bytes} / 0.0060 \text{ s} = 2.68$ TB/s.
> - Bandwidth utilization: $2.68 / 3.35 \approx 80\%$.
>
> 80% is a realistic level for well-tuned kernels. Below about 50%, look for overheads: kernel launch gaps between small kernels (CUDA graphs reduce them), CPU scheduling gaps, or a slow attention kernel.

What each optimization does, in roofline terms:

- **Batching** raises decode intensity of the linear layers. See [L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling).
- **Weight-only quantization** (INT4 or FP8 weights, BF16 arithmetic) cuts the weight bytes. With 4-bit weights, the batch-1 step reads about a quarter of the bytes, so the bound is about 4 times faster. See [quantization](/notes/ai/llm-systems/04-inference/l7-quantization).
- **FP8 weights and FP8 arithmetic** halve the bytes and double the peak (the H100 page lists 3,958 TFLOP/s FP8 "with sparsity", about 1,979 dense). The ridge moves to about 591 FLOP/byte.
- **Speculative decoding** checks several draft tokens per step, so it uses the idle compute of a memory-bound step. See [speculative decoding](/notes/ai/llm-systems/04-inference/l6-speculative-decoding).
- **Tensor parallelism** splits the weights across GPUs. Each GPU reads a quarter of the bytes with TP=4, so the step is about 4 times shorter, minus communication time. The intensity per GPU stays the same. See [parallelism](/notes/ai/llm-systems/04-inference/l8-parallelism).
- **GQA, MLA and KV quantization** cut the KV bytes, so long-context decode gets faster at large batch.

> [!trap] The roofline is a bound, not a prediction
> It ignores caches (a small working set can stay in L2), launch overhead and communication between GPUs. Real kernels reach perhaps 70% to 90% of peak. Some matrix shapes also run Tensor Cores poorly. Use it to find the bottleneck and the best possible case, then measure.

### Exercises

1. **A roofline function.** Write `attainable(intensity, peak, bw)` and `bound(intensity, peak, bw)` that returns `"memory"` or `"compute"`. Acceptance test: for the H100, intensity 4 gives 13.4 TFLOP/s and `"memory"`, intensity 1,000 gives 989.5 TFLOP/s and `"compute"`.
   - Hint 1: the ridge is `peak / bw`.
   - Hint 2: keep units consistent: FLOP/s and bytes/s.
2. **Find the KV crossover.** For Llama-3.1-8B on one H100, write a function of the context length $C$. It returns the batch size at which KV reads equal weight reads. Acceptance test: $C = 2000$ gives about 61, $C = 8000$ gives about 15.
   - Hint 1: solve $B \times C \times 131{,}072 = 2P$.
   - Hint 2: $2P = 16{,}060{,}522{,}496$ bytes.
3. **Weight-only INT4.** Change the step-time model so that weights take 0.5 byte per parameter (ignore the scale factors) while arithmetic stays BF16. At which batch size does short-context decode become compute-bound? Acceptance test: about 74.
   - Hint 1: the weight bytes become $0.5P$, so the intensity is about $4B$.
   - Hint 2: set $4B$ equal to the ridge of 295.

## 10. Common mistakes

1. **"LLM inference is compute-bound because GPUs do trillions of FLOPs."** Decode at small batch is memory-bound: each step reads all weights to do about 2 FLOPs per weight. Only prefill and very large decode batches are compute-bound.
2. **"The datasheet says 1,979 TFLOPS BF16."** That number is "with sparsity". Dense LLM math gets about half, 989.5 TFLOP/s on the H100 SXM.
3. **"Batching makes attention efficient too."** Each sequence reads its own KV cache, so decode attention keeps intensity $H / H_{kv}$ at any batch size.
4. **"Doubling the batch always doubles throughput."** Only while the step is memory-bound on the weights. With long contexts, KV reads grow with the batch. Above the ridge, compute grows with the batch.
5. **"Prefill and decode cost the same per token."** In the worked example, a prefill token costs about 0.017 ms and a batch-1 decode token about 4.79 ms.
6. **"Tensor parallelism raises arithmetic intensity."** It divides both FLOPs and bytes by the number of GPUs. Intensity stays the same. The step gets faster because each GPU moves fewer bytes.
7. **"The roofline gives the real speed."** It gives an upper bound on speed (a lower bound on time). Real kernels reach a fraction of it.

## 11. One-minute explanation

A GPU has two speed limits: peak arithmetic, about 989.5 TFLOP/s dense BF16 on an H100, and memory bandwidth, 3.35 TB/s. Arithmetic intensity, FLOPs per byte moved, tells you which one binds. The ridge point is their ratio, about 295 FLOP/byte. A linear layer with $b$ tokens has intensity about $b$, because all $b$ tokens share one read of the weights. So decode at batch 1 reads 16 GB of Llama-3.1-8B weights per step, about 4.8 ms, for at most about 208 tokens per second. Batching shares the weight read, so throughput grows almost linearly until about 295 sequences. Decode attention cannot be shared: each sequence reads its own KV cache at intensity $H / H_{kv}$, which is 4 for this model. With 2,000-token contexts, KV reads equal weight reads at about 61 sequences, and throughput saturates near 10,000 tokens per second. Prefill sends hundreds of tokens through each layer at once, so it is compute-bound above a few hundred tokens.

## 12. Check questions

```check
{
  "question": "Define arithmetic intensity and the ridge point. Compute the ridge point of an A100 80 GB SXM and say what it means for a kernel with intensity 50.",
  "hint": "Ridge = peak FLOP/s divided by bandwidth. Use the dense BF16 number.",
  "answer": "- **Arithmetic intensity** = FLOPs done / bytes moved between HBM and the compute units.\n- **Ridge point** = peak FLOP/s / bandwidth: the intensity where the bandwidth line meets the compute roof.\n\nA100 80 GB SXM: $312 \\times 10^{12} / 2.039 \\times 10^{12} \\approx 153$ FLOP/byte.\n\nA kernel with intensity 50 is memory-bound on the A100: its best speed is $50 \\times 2.039 \\approx 102$ TFLOP/s, about a third of the 312 TFLOP/s peak. A faster memory would make it faster, more compute would not."
}
```

```check
{
  "question": "Why does adding sequences to a decode batch raise throughput almost for free? Up to which batch size is this true on an H100, and why does it stop?",
  "hint": "Count FLOPs and bytes of the linear layers for $B$ tokens.",
  "answer": "Every sequence in the step multiplies its one new token by the same weight matrices. The weights are read once per step, whatever $B$ is. So the FLOPs grow with $B$ while the weight bytes stay fixed: intensity $\\approx 2PB / 2P = B$. While $B$ is below the ridge point, the weight read sets the step time: about 4.79 ms for Llama-3.1-8B. So each extra sequence adds a token almost without extra time.\n\nIt stops for two reasons:\n\n1. **Compute.** Near $B \\approx 295$ (the H100 ridge), compute becomes the limit. Each further sequence adds about $2P / \\text{peak} \\approx 0.016$ ms.\n2. **KV cache.** Each sequence reads its own KV cache, which batching cannot share. With 2,000-token contexts, KV reads equal the weight reads at about 61 sequences. Throughput then saturates near 10,000 tokens per second, long before the compute limit. Memory capacity also caps the batch (about 213 to 219 sequences of 2,000 tokens on an 80 GB GPU)."
}
```

```check
{
  "question": "Derive the arithmetic intensity of decode attention per cached token in BF16. Why does batching not change it, and what does GQA change?",
  "hint": "Count bytes for $H_{kv}$ keys and values and FLOPs for $H$ query heads.",
  "answer": "Per cached token, per layer, for one sequence:\n\n- Bytes: one key and one value of length $d_h$ for each KV head, 2 bytes each: $2 \\times H_{kv} \\times d_h \\times 2 = 4 H_{kv} d_h$.\n- FLOPs: each query head does $q \\cdot k$ ($2 d_h$) and adds $p \\, v$ ($2 d_h$): $4 d_h H$.\n\n$$\nI = \\frac{4 d_h H}{4 H_{kv} d_h} = \\frac{H}{H_{kv}} = g\n$$\n\nBatching does not change it because each sequence has its own keys and values. Nothing is shared across sequences, so bytes and FLOPs grow together.\n\nGQA lets $g$ query heads share one KV head. That cuts the bytes by $g$ and keeps the FLOPs, so intensity rises from 1 (MHA) to 4 for Llama-3.1-8B and 8 for Llama-3.1-70B. It is still far below the ridge of 295, so decode attention stays memory-bound, just 4 or 8 times faster."
}
```

```check
{
  "question": "Interview follow-up: Llama-3.1-70B (about 70.55B parameters) runs on 4 H100s with tensor parallelism 4. Contexts are 4,000 tokens. Compute the weight bytes per GPU and the KV bytes per sequence per GPU. Then find the batch where KV reads equal weight reads, and the batch-1 TPOT bound (ignore communication).",
  "hint": "BF16 weights are 2 bytes per parameter. The KV cache is 327,680 bytes per token, divided over 4 GPUs by KV heads.",
  "answer": "- **Weights per GPU:** $70.55 \\times 10^9 \\times 2 / 4 \\approx 35.28$ GB.\n- **KV per sequence per GPU:** $4000 \\times 327{,}680 / 4 = 327{,}680{,}000$ bytes, about 328 MB. Each GPU holds 2 of the 8 KV heads.\n- **Crossover:** $35.28 \\times 10^9 / 327.68 \\times 10^6 \\approx 108$ sequences. Above that, KV reads dominate each step.\n- **Batch-1 TPOT bound:** $(35.28 \\times 10^9 + 0.33 \\times 10^9) / 3.35 \\times 10^{12} \\approx 10.6$ ms, so at most about 94 tokens per second for one user.\n\nThe real TPOT is higher, because each layer needs two all-reduce operations across the 4 GPUs ([parallelism](/notes/ai/llm-systems/04-inference/l8-parallelism)). The parameter count uses the fused weight shapes that vLLM's benchmark files list for Llama-3.3-70B. A quantized copy of the Llama-3.1-70B-Instruct config shows the same sizes (hidden 8192, intermediate 28,672, 80 layers, 8 KV heads, untied embeddings). Per layer: $8192 \\times 10240 + 8192^2 + 8192 \\times 57344 + 28672 \\times 8192$, times 80 layers, plus two $128{,}256 \\times 8192$ embedding matrices."
}
```

```check
{
  "question": "Interview follow-up: you measure TPOT = 9.0 ms for Llama-3.1-8B in BF16 on one H100 at batch 32, each sequence with about 1,000 cached tokens. What bandwidth utilization does this imply, and what would you try first to lower TPOT?",
  "hint": "Bytes per step = weights + all KV caches of the batch.",
  "answer": "- Bytes per step: $16.06 \\times 10^9 + 32 \\times 1000 \\times 131{,}072 = 16.06 \\times 10^9 + 4.19 \\times 10^9 = 20.25 \\times 10^9$ bytes.\n- Achieved bandwidth: $20.25 \\times 10^9 / 0.009 = 2.25$ TB/s.\n- Utilization: $2.25 / 3.35 \\approx 67\\%$.\n\nThe step is memory-bound (intensity about $2 \\times 8.03 \\times 10^9 \\times 32 / 20.25 \\times 10^9 \\approx 25$ FLOP/byte). Options in order:\n\n1. Look for overhead first: kernel launch gaps (are CUDA graphs used?), CPU scheduling gaps, a slow attention kernel. 67% leaves room.\n2. Cut the bytes: FP8 or INT4 weights cut the 16 GB part, an FP8 KV cache halves the 4.19 GB part.\n3. Speculative decoding uses the idle compute to produce several tokens per step.\n4. Tensor parallelism over 2 GPUs halves the bytes per GPU, at the cost of all-reduce time."
}
```

```check
{
  "question": "Interview follow-up: for $d = 4096$ in BF16, at which prompt length should prefill become compute-bound on an A100 in theory? Sarathi-Serve observed saturation around 500 to 600 tokens. Why the gap, and what does it mean for chunk sizes?",
  "hint": "Use $b^\\ast = r / (1 - r/2048)$ with $r \\approx 153$.",
  "answer": "Theory: the A100 ridge is $r = 312 / 2.039 \\approx 153$ FLOP/byte. For a square $4096$ layer, $I(b) = b / (1 + b/2048)$, so the crossing is $b^\\ast = 153 / (1 - 153/2048) \\approx 165$ tokens. Sarathi-Serve's footnote says it expected about 200 tokens.\n\nPractice: Sarathi-Serve reports saturation \"at ∼500-600 tokens for higher tensor parallel dimensions due to fixed overheads\". The gap has several causes. Kernel launch and synchronization overheads do not scale with tokens. Tensor parallelism adds all-reduce communication and gives each GPU smaller matrices. GEMM tiles run Tensor Cores efficiently only for larger shapes.\n\nFor chunked prefill this means: a chunk needs a few hundred tokens to keep the GPU busy. A chunk much larger than that only makes the step longer. Sarathi-Serve used token budgets of 512 (strict latency setting) and 2,048 (relaxed setting)."
}
```

```check
{
  "question": "Interview follow-up: does tensor parallelism change arithmetic intensity? With 4-bit weight-only quantization and BF16 arithmetic, at which batch does short-context decode of Llama-3.1-8B reach the H100 ridge? And with FP8 weights and FP8 arithmetic?",
  "hint": "Count bytes and FLOPs per GPU, and change the bytes per weight or the peak.",
  "answer": "- **Tensor parallelism:** each GPU holds $1/N$ of the weights and does $1/N$ of the FLOPs. Intensity is unchanged. Each step is faster because each GPU moves fewer bytes, but all-reduce communication is added.\n- **4-bit weights, BF16 arithmetic:** bytes per step $\\approx 0.5P$, FLOPs $2PB$, so intensity $\\approx 4B$. The ridge stays at about 295, so the crossing is $B \\approx 295 / 4 \\approx 74$. The batch-1 bound becomes about 4 times faster (scale factors add a little).\n- **FP8 weights, FP8 arithmetic:** bytes $\\approx P$, FLOPs $2PB$, intensity $\\approx 2B$. The dense FP8 peak is about 1,979 TFLOP/s, so the ridge is about $1979 / 3.35 \\approx 591$. The crossing is again $B \\approx 591 / 2 \\approx 295$. But each step is about twice as fast in both regions."
}
```

```check
{
  "question": "Exercise 1: show a reference solution for the roofline functions.",
  "hint": "Compare the intensity with `peak / bw`.",
  "answer": "```python\ndef attainable(intensity, peak, bw):\n    return min(peak, intensity * bw)\n\ndef bound(intensity, peak, bw):\n    return \"memory\" if intensity < peak / bw else \"compute\"\n\nH100 = dict(peak=989.5e12, bw=3.35e12)\nprint(attainable(4, **H100) / 1e12, bound(4, **H100))\nprint(attainable(1000, **H100) / 1e12, bound(1000, **H100))\n```\n\nOutput:\n\n```text\n13.4 memory\n989.5 compute\n```\n\nAt exactly the ridge, both limits are equal. The function calls that point compute-bound."
}
```

```check
{
  "question": "Exercise 2: show a reference solution for the KV crossover batch.",
  "hint": "$B = 2P / (C \\times 131{,}072)$.",
  "answer": "```python\nP = 8_030_261_248\nKV_PER_TOKEN = 131_072\n\ndef kv_crossover(context_len):\n    return 2 * P / (context_len * KV_PER_TOKEN)\n\nfor C in (2000, 8000, 32000):\n    print(C, round(kv_crossover(C), 1))\n```\n\nOutput:\n\n```text\n2000 61.3\n8000 15.3\n32000 3.8\n```\n\nAt 32,000 tokens of context, KV reads dominate the step from about 4 sequences on. For long-context serving, the KV cache, not the weights, sets the decode speed."
}
```

```check
{
  "question": "Exercise 3: show a reference solution for weight-only INT4.",
  "hint": "Change only the weight bytes in `t_mem`.",
  "answer": "```python\nP, BW, PEAK = 8_030_261_248, 3.35e12, 989.5e12\n\ndef step_time_int4(B):\n    t_mem = 0.5 * P / BW                 # 4-bit weights, KV cache ignored (short contexts)\n    t_cmp = 2 * P * B / PEAK             # BF16 arithmetic after dequantization\n    return max(t_mem, t_cmp)\n\ncross = next(B for B in range(1, 1000) if 2 * P * B / PEAK >= 0.5 * P / BW)\nprint(cross, round(step_time_int4(1) * 1e3, 3), \"ms at batch 1\")\n```\n\nOutput:\n\n```text\n74 1.199 ms at batch 1\n```\n\nThe batch-1 step falls from 4.79 ms to about 1.20 ms in this model. The crossing moves from about 295 to about 74 sequences, because each byte now feeds 4 FLOPs per sequence instead of 1. Real INT4 kernels also read scale factors and spend time on dequantization, so the gain is smaller."
}
```

## 13. Links

- Previous lesson: [L2: Latency and throughput metrics](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)
- Next lesson: [L4: Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)
- Foundations: [GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth), [Numbers in memory](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory), [Matrices and matrix multiplication](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication)
- KV cache: [Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode), [The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula), [MHA, MQA, GQA and MLA](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla)
- Related: [Quantization](/notes/ai/llm-systems/04-inference/l7-quantization), [Parallelism](/notes/ai/llm-systems/04-inference/l8-parallelism), [Speculative decoding](/notes/ai/llm-systems/04-inference/l6-speculative-decoding), [Sizing GPUs](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus), [The cost of attention and FlashAttention](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention)
- Paper: [The question: where does KV cache memory go?](/notes/papers/llm-serving/2023-pagedattention/03-the-question)

### Sources

- NVIDIA H100 specifications (BF16 1,979 TFLOPS with sparsity, 3.35 TB/s, 80 GB): https://www.nvidia.com/en-eu/data-center/h100 (checked on 2026-10-15)
- NVIDIA A100 specifications (BF16 312 TFLOPS dense, 2,039 GB/s for 80 GB SXM): https://www.nvidia.com/en-us/data-center/a100/ (checked on 2026-10-15)
- Agrawal et al., "Taming Throughput-Latency Tradeoff in LLM Inference with Sarathi-Serve", OSDI 2024: https://arxiv.org/abs/2403.02310 (checked on 2026-10-15)
- vLLM 0.31.0 source: `vllm/config/cache.py` (default `gpu_memory_utilization` 0.92) and `benchmarks/kernels/weight_shapes.py` (fused weight shapes of Llama-3.1-8B and Llama-3.3-70B): https://pypi.org/project/vllm/0.31.0/ (checked on 2026-10-15)
- vLLM 0.4.1 docs, "Engine Arguments" (`--gpu-memory-utilization` default 0.9): https://docs.vllm.ai/en/v0.4.1/models/engine_args.html (checked on 2026-10-15)
- Williams, Waterman and Patterson, "Roofline: An Insightful Visual Performance Model for Multicore Architectures", Communications of the ACM, April 2009. Technical report version: https://www2.eecs.berkeley.edu/Pubs/TechRpts/2008/EECS-2008-134.html (checked on 2026-10-15)
