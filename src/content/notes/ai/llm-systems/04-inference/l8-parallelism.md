---
title: "L8: Parallelism: tensor, pipeline, data and expert"
order: 8
summary: "How one model is spread over many GPUs. Data parallelism copies the model, tensor parallelism splits every matrix (column-parallel then row-parallel, two all-reduces per layer, needs NVLink), pipeline parallelism splits the layers (and creates a bubble), and expert parallelism spreads mixture-of-experts layers with all-to-all traffic. The lesson proves the tensor-parallel split in NumPy, simulates a ring all-reduce, shows how the KV cache splits by KV heads (and is replicated when there are fewer KV heads than GPUs), and works out Llama-3.1-70B on 4 H100s."
status: not-started
tags: [inference, parallelism, tensor-parallel, pipeline-parallel, expert-parallel, all-reduce, nvlink, kv-cache, vllm]
---

## 1. The question this idea answers

Llama-3.1-70B in BF16 has about 141 GB of weights. One H100 has 80 GB. Even when a model fits, one GPU may be too slow. A decode step of a 141 GB model at 3.35 TB/s would take about 42 ms. That is only about 24 tokens per second for one user.

So the questions are: **how do we split one model over several GPUs? What must the GPUs send to each other? Which split fits which hardware?** An interviewer expects four names: data, tensor, pipeline and expert parallelism. He also expects the exact place of the communication in tensor parallelism and the effect on the KV cache. This lesson covers all of them with numbers.

## 2. Mental model

> [!analogy] Four ways to run a big restaurant
> - **Data parallelism:** open more identical kitchens. Each kitchen cooks whole orders alone. A host at the door sends each order to a free kitchen. The kitchens never talk.
> - **Tensor parallelism:** in one kitchen, four cooks prepare the same dish at the same time, each doing a quarter of every step. After each step they must combine their parts at the pass. They talk constantly, so they need to stand very close (a fast link).
> - **Pipeline parallelism:** an assembly line. Station 1 does the first quarter of the recipe, then hands the plate to station 2. Each station talks only to its neighbor. When the line starts or empties, some stations wait (the bubble).
> - **Expert parallelism:** specialist cooks. A dispatcher reads each order and sends it to the two or eight specialists it needs, then collects the results.
>
> **Where it stops working:** in a real model the "combine at the pass" step is an exact mathematical sum (an all-reduce). And the split must follow the matrix shapes. Also, real deployments mix these methods: tensor parallelism inside a server, pipeline parallelism across servers, data parallelism across replicas.

## 3. Terms

| Term | Plain meaning |
|---|---|
| rank | The number of one GPU process in a group: 0, 1, 2, ... |
| world size | The number of GPU processes in a group. |
| data parallelism (DP) | Several full copies (replicas) of the model. Each serves different requests. |
| tensor parallelism (TP) | Each weight matrix is split over GPUs. All GPUs work on every token. |
| column-parallel linear | A linear layer whose weight columns (outputs) are split over GPUs. Each GPU produces a slice of the output. |
| row-parallel linear | A linear layer whose weight rows (inputs) are split. Each GPU produces a partial sum of the full output. |
| all-reduce | A collective operation: every GPU gives a vector, and every GPU receives the sum of all vectors. |
| all-gather | Every GPU gives a piece, and every GPU receives all pieces joined together. |
| reduce-scatter | Every GPU gives a vector, and each GPU receives the sum of one slice. |
| all-to-all | Every GPU sends a different piece to every other GPU. Used to route tokens to experts. |
| NCCL | NVIDIA Collective Communications Library: the standard library for all-reduce and other collectives on NVIDIA GPUs. |
| NVLink | NVIDIA's fast GPU-to-GPU link inside a server. 900 GB/s on the H100 SXM datasheet. |
| PCIe | The general expansion bus between GPU and CPU. 128 GB/s (Gen5) on the H100 datasheet. |
| pipeline parallelism (PP) | The layers are split into stages on different GPUs. Activations travel from stage to stage. |
| micro-batch | A slice of the batch that moves through the pipeline as one unit. |
| pipeline bubble | Time when a pipeline stage has no work, at the start and the end of a batch. |
| mixture of experts (MoE) | A layer with many MLPs (experts). A router sends each token to a few of them. |
| expert parallelism (EP) | The experts of an MoE layer live on different GPUs, and tokens travel to them. |
| context parallelism | The sequence (time) dimension is split over GPUs, for long prompts or a large KV cache. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. Communication from zero

### 4.1 The collective operations

When a computation is split, GPUs must exchange data. Libraries such as NCCL offer a few standard patterns. With 4 GPUs holding vectors $a_0, a_1, a_2, a_3$:

| Operation | Each GPU gives | Each GPU receives |
|---|---|---|
| all-reduce | its vector $a_r$ | $a_0 + a_1 + a_2 + a_3$ |
| all-gather | its piece $a_r$ | $[a_0, a_1, a_2, a_3]$ joined |
| reduce-scatter | its vector $a_r$ | one quarter of the sum |
| all-to-all | a different piece for each GPU | the pieces addressed to it |
| send and receive | data for one neighbor | data from one neighbor |

### 4.2 The ring all-reduce and its cost

The classic algorithm arranges the GPUs in a ring. Each vector is cut into $N$ chunks. Phase 1 (reduce-scatter): for $N - 1$ steps, each GPU sends one chunk to its right neighbor, which adds it to its own copy. Then each GPU holds one fully summed chunk. Phase 2 (all-gather): for $N - 1$ steps, each GPU passes finished chunks around the ring.

Each step sends $S/N$ bytes, for $2(N-1)$ steps, so each GPU sends

$$
\text{bytes sent per GPU} = \frac{2(N-1)}{N} S
$$

This approaches $2S$ for many GPUs, independent of $N$. That is why the ring is popular.

```python
import numpy as np

def ring_all_reduce(bufs):
    """Sum N equal-length vectors so that every worker ends with the total.
    Phase 1 (reduce-scatter) and phase 2 (all-gather) each take N - 1 steps."""
    n = len(bufs)
    chunks = [np.array_split(b.astype(float), n) for b in bufs]
    sent = [0] * n
    for phase in ("reduce-scatter", "all-gather"):
        for step in range(n - 1):
            msgs = []
            for w in range(n):                       # worker w sends one chunk to w + 1
                c = (w - step + (phase == "all-gather")) % n
                msgs.append((w, (w + 1) % n, c, chunks[w][c].copy()))
                sent[w] += chunks[w][c].nbytes
            for src, dst, c, data in msgs:
                if phase == "reduce-scatter":
                    chunks[dst][c] += data             # add the partial sum
                else:
                    chunks[dst][c] = data              # copy the finished chunk
    return [np.concatenate(c) for c in chunks], sent

n, size = 4, 2048                                  # 4 GPUs, 2048 float64 values = 16 KiB
bufs = [np.random.default_rng(i).normal(size=size) for i in range(n)]
out, sent = ring_all_reduce(bufs)
print("all workers hold the sum:", all(np.allclose(o, sum(bufs)) for o in out))
print("bytes sent per worker:", sent[0], "=", sent[0] / bufs[0].nbytes, "x the buffer size")
print("formula 2 (N - 1) / N =", 2 * (n - 1) / n)
```

Output (measured in these notes):

```text
all workers hold the sum: True
bytes sent per worker: 24576 = 1.5 x the buffer size
formula 2 (N - 1) / N = 1.5
```

### 4.3 The links

The H100 SXM datasheet lists "NVLink: 900GB/s" and "PCIe Gen5: 128GB/s" (checked on 2026-10-15). Both numbers are commonly understood as the sum of the two directions, so about 450 GB/s and 64 GB/s each way (interpretation of these notes). NVLink is about 7 times faster than PCIe. Between servers, traffic uses network adapters such as InfiniBand, which are slower again. The vLLM docs say that efficient tensor parallelism across nodes "requires fast internode communication, preferably through high-speed network adapters such as InfiniBand".

> [!key] The rule that decides every design
> Tensor parallelism communicates twice per layer for every token. Pipeline parallelism communicates once per stage boundary. Data parallelism does not communicate at all. So put tensor parallelism on the fastest links (inside a server), pipeline parallelism across slower links, and data parallelism anywhere.

## 5. Data parallelism: more replicas

For inference, data parallelism means $R$ independent copies of the model behind a load balancer. Each copy runs on its own GPU or GPU group ([L5: Autoscaling and routing](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing)). Each request runs on one replica.

- Throughput grows about linearly with $R$.
- Latency per request does not improve. A single request still runs on one replica.
- There is no communication between replicas during a forward pass.
- Each replica must hold the whole model, so it only works if the model fits in one GPU or one tensor-parallel group.
- Each replica has its own KV cache, so prefix caching works only if related requests reach the same replica ([L9: Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)).

vLLM has `--data-parallel-size` (default 1). In vLLM it also matters for MoE models: "MoE layers will be sharded according to the product of the tensor, prefill-context, and data parallel sizes" (vLLM 0.31.0 source).

## 6. Tensor parallelism

### 6.1 The MLP: column-parallel, then row-parallel

Megatron-LM (Shoeybi et al., 2019, arXiv 1909.08053) introduced the split that every engine uses. Take an MLP $Z = \mathrm{GeLU}(XA)\,B$.

1. **Split $A$ by columns**: $A = [A_1, A_2]$. GPU $r$ computes $Y_r = \mathrm{GeLU}(X A_r)$. The paper explains the choice: splitting by rows "will require a synchronization point before the GeLU function", while the column split "allows the GeLU nonlinearity to be independently applied to the output of each partitioned GEMM". A nonlinear function of a sum is not the sum of the function, so the split must keep each output column whole.
2. **Split $B$ by rows**: $B = \begin{bmatrix} B_1 \\ B_2 \end{bmatrix}$. GPU $r$ computes $Z_r = Y_r B_r$. This needs no communication, because $Y_r$ is already on GPU $r$.
3. **All-reduce**: $Z = Z_1 + Z_2$. This follows from block multiplication: $[Y_1, Y_2] \begin{bmatrix} B_1 \\ B_2 \end{bmatrix} = Y_1 B_1 + Y_2 B_2$.

Llama's MLP is SwiGLU: $\mathrm{down}(\mathrm{SiLU}(x W_{gate}) \odot x W_{up})$ ([L6: The transformer block](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block)). Split $W_{gate}$ and $W_{up}$ by the same columns, so each GPU can multiply its gate slice by its up slice element by element. Split $W_{down}$ by rows.

```python
import numpy as np

rng = np.random.default_rng(0)
d, f, tp = 8, 16, 2                      # hidden size, MLP size, number of GPUs
x = rng.normal(size=(3, d))              # 3 tokens
W_gate = rng.normal(size=(d, f))
W_up = rng.normal(size=(d, f))
W_down = rng.normal(size=(f, d))
silu = lambda z: z / (1 + np.exp(-z))

full = (silu(x @ W_gate) * (x @ W_up)) @ W_down          # one GPU, no split

partials = []
for r in range(tp):                                      # what GPU r computes
    cols = slice(r * f // tp, (r + 1) * f // tp)
    h = silu(x @ W_gate[:, cols]) * (x @ W_up[:, cols])  # column-parallel: [3, f/tp], no talk needed
    partials.append(h @ W_down[cols, :])                 # row-parallel: a partial sum [3, d]
out = sum(partials)                                      # the all-reduce: sum over GPUs

print("each GPU holds", W_gate[:, :f // tp].size * 3, "of", W_gate.size * 3, "MLP weights")
print("partial output shape:", partials[0].shape, "| equal to full:", np.allclose(out, full))
```

Output (measured in these notes):

```text
each GPU holds 192 of 384 MLP weights
partial output shape: (3, 8) | equal to full: True
```

The important lines: `W_gate[:, cols]` and `W_up[:, cols]` are the column-parallel slices. `W_down[cols, :]` is the row-parallel slice, with the **same** index range. `sum(partials)` is what the all-reduce computes on real GPUs.

### 6.2 Attention: split by heads

Attention heads are independent until the output projection ([L5: Multi-head attention](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention)). So the paper splits $W_Q$, $W_K$, $W_V$ "in a column parallel fashion such that the matrix multiply corresponding to each attention head is done locally on one GPU". The output projection $W_O$ "is parallelized along its rows". That is the same column-then-row pattern, with one all-reduce after $W_O$.

With grouped-query attention (GQA), each GPU takes $H/N$ query heads. It also takes the $H_{kv}/N$ KV heads that those query heads use ([L5: MHA, MQA, GQA and MLA](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla)).

```python
import numpy as np

rng = np.random.default_rng(1)
T, d, H, H_kv, dh, tp = 5, 16, 4, 2, 4, 2     # 4 query heads share 2 KV heads (GQA)
x = rng.normal(size=(T, d))
W_q = rng.normal(size=(d, H * dh)); W_k = rng.normal(size=(d, H_kv * dh))
W_v = rng.normal(size=(d, H_kv * dh)); W_o = rng.normal(size=(H * dh, d))
mask = np.triu(np.full((T, T), -np.inf), 1)

def attend(q, k, v):
    s = q @ k.T / np.sqrt(dh) + mask
    p = np.exp(s - s.max(axis=1, keepdims=True))
    return (p / p.sum(axis=1, keepdims=True)) @ v

def heads(x, q_ids, kv_ids):
    """Attention output for some query heads, in head order, shape [T, len(q_ids)*dh]."""
    group = H // H_kv
    outs = []
    for h in q_ids:
        kvh = h // group                      # which KV head this query head uses
        assert kvh in kv_ids                  # the KV head is in this GPU's shard
        q = x @ W_q[:, h * dh:(h + 1) * dh]
        k = x @ W_k[:, kvh * dh:(kvh + 1) * dh]
        v = x @ W_v[:, kvh * dh:(kvh + 1) * dh]
        outs.append(attend(q, k, v))
    return np.concatenate(outs, axis=1)

full = heads(x, range(H), range(H_kv)) @ W_o

partials = []
for r in range(tp):
    q_ids = range(r * H // tp, (r + 1) * H // tp)          # GPU r: 2 query heads
    kv_ids = range(r * H_kv // tp, (r + 1) * H_kv // tp)   # ...and 1 KV head: its KV cache shard
    rows = slice(r * H * dh // tp, (r + 1) * H * dh // tp)
    partials.append(heads(x, q_ids, kv_ids) @ W_o[rows, :])  # row-parallel W_o
print("equal to full:", np.allclose(sum(partials), full))
```

Output (measured in these notes): `equal to full: True`. The `assert kvh in kv_ids` line checks the key fact. Each GPU needs only its own KV heads, so it stores only its own part of the KV cache.

![Alt text: one Llama-3.1-70B layer split over two GPUs, with the heads, the KV cache shards and the MLP columns divided, and two all-reduce bars](/notes/media/llm-systems/figures/04-8-tensor-parallel.svg)

```video
{"src": "/notes/media/llm-systems/manim/m20-tensor-parallelism.mp4", "caption": "One layer split over two GPUs: heads and MLP columns are divided, each GPU computes a partial output, and an all-reduce sums them twice per layer."}
```

### 6.3 Two all-reduces per layer

Count the communication of one transformer layer in the forward pass: one all-reduce after attention, one after the MLP. The Megatron paper: "only two all-reduces in the forward path and two in the backward path". Inference has no backward pass, so **two all-reduces per layer per forward pass**. Each one sums a vector of size $d$ per token.

The other parts:

- The input embedding table is split "along the vocabulary dimension", with an all-reduce after the lookup (Megatron-LM).
- The LM head is a column-parallel layer over the vocabulary. Each GPU computes the logits of its vocabulary slice. Engines then gather the slices to sample (interpretation of these notes, based on the column-parallel layout).
- Normalization layers and residual additions are cheap. Every GPU computes them in full on its own copy of the hidden state.

### 6.4 What tensor parallelism costs and buys, with numbers

> [!example] Worked example: communication of Llama-3.1-70B with TP = 4
> Llama-3.1-70B: hidden size 8192, 80 layers. BF16 activations: 2 bytes per number.
>
> 1. One all-reduce per token sums $8192 \times 2 = 16{,}384$ bytes = 16 KiB.
> 2. Ring with $N = 4$: each GPU sends $2 \times 3/4 \times 16 = 24$ KiB per all-reduce.
> 3. Per token per forward pass: $80 \times 2 = 160$ all-reduces, so $160 \times 24 = 3{,}840$ KiB = 3.75 MiB sent per GPU.
> 4. **Decode, batch 1:** at about 450 GB/s per direction on NVLink, the transfer takes $3{,}932{,}160 / (450 \times 10^9) \approx 8.7$ µs. Over PCIe at about 64 GB/s: about 61 µs.
> 5. **Prefill, 2,000 tokens:** $2{,}000 \times 3.75$ MiB $\approx 7.32$ GiB per GPU. NVLink: about 17.5 ms. PCIe: about 123 ms.
> 6. Compare with the prefill arithmetic: $2 \times 70.55 \times 10^9 \times 2{,}000 / (4 \times 989 \times 10^{12}) \approx 71$ ms at peak on 4 GPUs.
>
> All computed in these notes, with ideal bandwidths. With NVLink, prefill communication is about a quarter of the compute time and can partly overlap. With PCIe it would be larger than the compute. That is why tensor parallelism needs NVLink.

In decode, the bandwidth time is tiny. But each all-reduce also has a fixed start-up delay of a few microseconds, and it repeats 160 times per token (interpretation of these notes). To reduce it, vLLM 0.31.0 ships a custom all-reduce kernel for messages up to 8 MiB. The flag `--disable-custom-all-reduce` makes it "fall back to NCCL" (source, checked on 2026-10-15).

What TP buys is latency. Each GPU reads only $1/N$ of the weights per decode step:

| Setup | Weight bytes per GPU | Ideal decode step (weights only) |
|---|---|---|
| 70B on 1 GPU (hypothetical, does not fit) | about 141 GB | about 42.1 ms |
| 70B with TP = 4 | about 35.3 GB | about 10.5 ms plus communication |

Tensor parallelism is the only one of the four methods that makes a **single** request faster. The Megatron-LM follow-up paper (Narayanan et al., 2021, arXiv 2104.04473) gives the deployment rule: "tensor model parallelism should generally be used up to degree g when using g-GPU servers".

### 6.5 The divisibility rule

The heads must divide evenly. vLLM 0.31.0 checks: "Total number of attention heads (...) must be divisible by tensor parallel size". Llama-3.1-70B has 64 query heads, so TP = 1, 2, 4, 8, 16, 32 or 64 pass this check. TP = 3 or 6 fail. For an odd number of GPUs, the vLLM docs suggest pipeline parallelism, which "supports uneven splits".

## 7. The KV cache under tensor parallelism

### 7.1 Split by KV heads

Each GPU stores the keys and values of its own KV heads, for every layer and every token. The size formula of [L3: The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) becomes, per GPU:

$$
\text{KV bytes per token per GPU} = 2 \times L \times \frac{H_{kv}}{N} \times d_h \times s
$$

> [!example] Worked example: Llama-3.1-70B, $L = 80$, $H_{kv} = 8$, $d_h = 128$, BF16
>
> | TP size $N$ | KV heads per GPU | KV per token per GPU | KV per token, all GPUs together |
> |---|---|---|---|
> | 1 | 8 | 320 KiB | 320 KiB |
> | 2 | 4 | 160 KiB | 320 KiB |
> | 4 | 2 | 80 KiB | 320 KiB |
> | 8 | 1 | 40 KiB | 320 KiB |
> | 16 | 1 (each head stored twice) | 40 KiB | 640 KiB |
>
> Check the TP = 4 row: $2 \times 80 \times 2 \times 128 \times 2 = 81{,}920$ bytes = 80 KiB.

### 7.2 Fewer KV heads than GPUs: replication

With TP = 16 there are only 8 KV heads. A KV head cannot be split, because one query head needs the whole key and value vectors of its KV head. So each KV head is **replicated** on 2 GPUs. vLLM's code says: "We will replicate the KV heads in the case where the number of KV heads is smaller than the tensor parallel size so each GPU has at least one KV head" (0.31.0 source). The per-GPU number stops falling, and the cluster stores the cache twice.

The extreme case is multi-head latent attention (MLA, DeepSeek-V2 and V3). It caches one shared latent vector per token, not per head. vLLM treats it as one KV head: "When using MLA during decode it becomes MQA" (source comment). With TP = 8, every GPU stores the full latent cache, an 8-fold duplication. The vLLM docs give DeepSeek-R1 as the example: with `-tp 8`, the cache is duplicated 8 times.

### 7.3 Decode context parallelism removes the duplication

vLLM's fix is **decode context parallelism** (DCP). It shards the cache along the token dimension instead of the head dimension. GPU 0 stores the keys and values of some tokens, and GPU 1 stores those of other tokens. The docs say that the "dcp size should lie in the range of `[1, tp_size/H]`" and that it "does not increase the number of GPUs we need to launch, but just reduces the KV cache duplication". Their example: Qwen3-235B-A22B has 4 KV heads, so `-tp 8` duplicates each twice, and `-dcp 2` removes it (checked on 2026-10-15). Each GPU then computes attention over its own tokens. The partial results are merged with the same rescaling as the online softmax of FlashAttention ([L7: The cost of attention and FlashAttention](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention)). This description of the merge step is the interpretation of these notes.

### 7.4 The full worked example: Llama-3.1-70B on 4 H100s

> [!example] Worked example: TP = 4 on 4 × H100 80 GB
> 1. Weights: about $70.55 \times 10^9 \times 2 = 141.1$ GB in total, so about 35.3 GB per GPU.
> 2. vLLM budget per GPU with the default `--gpu-memory-utilization` of 0.92 (vLLM 0.31.0): $80 \times 0.92 = 73.6$ GB. Treat 80 GB as $80 \times 10^9$ bytes for this estimate.
> 3. Assume about 3 GB per GPU for activations, CUDA graphs and other buffers (an assumption of these notes. vLLM measures this at start-up).
> 4. KV memory per GPU: $73.6 - 35.3 - 3 \approx 35.3$ GB.
> 5. KV per token per GPU: 80 KiB = 81,920 bytes. Tokens that fit: $35.3 \times 10^9 / 81{,}920 \approx 431{,}000$. Every token uses all 4 GPUs (each stores 2 of the 8 KV heads), so this is the capacity of the whole group.
> 6. Concurrent 8,192-token requests: $431{,}000 / 8{,}192 \approx 52$.
> 7. Decode step at batch 1: about 10.5 ms for the weight reads, plus 160 all-reduces.
>
> All numbers computed in these notes. vLLM prints the real capacity at start-up as "GPU KV cache size: ... tokens" and "Maximum concurrency for ... tokens per request".

The command:

```bash
vllm serve meta-llama/Llama-3.1-70B-Instruct --tensor-parallel-size 4 --max-model-len 8192
```

## 8. Pipeline parallelism

### 8.1 How it works

Split the 80 layers into $p$ stages: with $p = 4$, layers 0 to 19 on GPU 0, 20 to 39 on GPU 1, and so on. A token's hidden state leaves stage 1 and travels to stage 2 by a point-to-point send. For Llama-3.1-70B that is $8192 \times 2 = 16$ KiB per token per stage boundary, or 48 KiB per token for 3 boundaries. Compare with the 3.75 MiB per token per GPU of TP = 4. Pipeline parallelism communicates about 80 times less (computed in these notes), so it works across servers.

### 8.2 The bubble

A pipeline is idle while it fills and drains. Narayanan et al. define $p$ stages and $m$ micro-batches. For the simple schedule, the ideal time is $m(t_f + t_b)$ and the bubble time is $(p - 1)(t_f + t_b)$, so the "bubble time fraction" is $(p - 1)/m$. For inference there is no backward pass ($t_b = 0$). As a share of the **total** time, the idle fraction is

$$
\frac{p - 1}{m + p - 1}
$$

> [!example] Worked example: 4 stages
>
> | Micro-batches $m$ | Bubble $(p-1)/m$ | Idle share of total $(p-1)/(m+p-1)$ |
> |---|---|---|
> | 1 | 3.0 | 75% |
> | 4 | 0.75 | 43% |
> | 8 | 0.375 | 27% |
> | 32 | 0.094 | 8.6% |

An online server keeps many micro-batches in flight. While stage 2 works on micro-batch A, stage 1 already starts micro-batch B. With continuous batching ([L4: Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)) the pipeline stays mostly full.

### 8.3 What PP does and does not do

- It lets a model that is too large for one server run on several servers.
- It increases throughput when the pipeline is full.
- It does **not** reduce the latency of one token: the token still passes through all 80 layers one after another, plus the transfers.
- It needs no NVLink. The vLLM docs recommend pipeline parallelism over tensor parallelism "if the GPUs on the node do not have NVLINK interconnect (e.g. L40S)".

The standard multi-server recipe in the vLLM docs: tensor parallel size = GPUs per node, pipeline parallel size = number of nodes. Their example: "`tensor_parallel_size=8` and `pipeline_parallel_size=2` when using 2 nodes with 8 GPUs per node". By default vLLM uses Ray for multi-node and Python `multiprocessing` for single-node inference.

```bash
vllm serve <model> --tensor-parallel-size 8 --pipeline-parallel-size 2
```

## 9. Expert parallelism for mixture-of-experts models

### 9.1 MoE in one paragraph

In a mixture-of-experts layer, the single MLP is replaced by many expert MLPs and a small **router**. For each token, the router scores the experts and sends the token to the top $k$. The layer's output is the weighted sum of those experts' outputs. So the model has many parameters, but each token uses only a few. DeepSeek-V3 (arXiv 2412.19437) has "671B total parameters with 37B activated for each token". It has 61 layers with hidden size 7168. All FFNs except the first three are MoE layers with 1 shared expert and 256 routed experts. Each expert has intermediate size 2048, and 8 routed experts are active per token.

> [!example] Worked example: DeepSeek-V3 expert weights
> One SwiGLU expert: $3 \times 7168 \times 2048 \approx 44.0$M parameters. Routed experts: $256 \times 58$ MoE layers $\times 44.0$M $\approx 654$B. So about 97% of the 671B parameters are routed experts, while a token uses only 8 of 256 per layer (computed in these notes).

### 9.2 Spreading the experts

Tensor parallelism could split every expert over all GPUs, but each expert is small, so the pieces become tiny and inefficient. **Expert parallelism** instead places whole experts on different GPUs. Each MoE layer then needs two all-to-all exchanges:

1. **Dispatch:** each GPU sends each of its tokens' hidden vectors to the GPUs that own the chosen experts. For DeepSeek-V3 in BF16, one copy is $7168 \times 2 = 14{,}336$ bytes, and each token goes to 8 experts.
2. **Combine:** the experts' outputs travel back to the token's GPU and are summed with the router weights.

The problems are load balance (a popular expert becomes a hot spot) and network traffic. DeepSeek-V3 limits each token to "at most 4 nodes" and uses redundant copies of busy experts. Its serving setup used "32-way Expert Parallelism (EP32)" for prefill. For decode it used EP320, with one expert per GPU, and "64 GPUs are responsible for hosting redundant experts and shared experts" (Section 3.4 of the report).

In vLLM, `--enable-expert-parallel` means "Use expert parallelism instead of tensor parallelism for MoE layers". The attention part is then usually data parallel. The vLLM docs describe "Data Parallel attention with Expert or Tensor Parallel MoE layers". The reason: MLA attention has no heads to split (section 7.2), so splitting it with TP only duplicates the cache.

## 10. Sequence and context parallelism, briefly

For very long prompts, even the activations of one request are large. **Context parallelism** splits the token dimension. vLLM has two forms (docs, checked on 2026-10-15):

- **Prefill context parallelism (PCP):** "split the request into `N` chunks, and each GPU computes one chunk of the query/key/value tensors". Keys and values are then either all-gathered or passed around a ring ("ring attention"). The docs say that "Both approaches are under active development."
- **Decode context parallelism (DCP):** the KV cache sharded along tokens (section 7.3).

Training frameworks also use **sequence parallelism**: they split the normalization and dropout work along the sequence between the tensor-parallel GPUs. That is mainly a training memory technique (interpretation of these notes).

## 11. How to choose

| Situation | Choice |
|---|---|
| The model fits on one GPU with room for the KV cache | No model parallelism. Add data-parallel replicas for throughput. |
| Too large for one GPU, fits in one server with NVLink | Tensor parallelism = number of GPUs needed (a divisor of the head count). |
| Need lower latency per token | More tensor parallelism, inside the NVLink domain. |
| Too large for one server | TP = GPUs per node, PP = number of nodes. |
| GPUs without NVLink (for example L40S) | Pipeline parallelism instead of tensor parallelism. |
| An odd number of GPUs | Pipeline parallelism, which supports uneven splits. |
| A large MoE model | Expert parallelism for the experts, data parallelism for attention. |
| TP larger than the number of KV heads, or MLA | Expect KV duplication. Consider DCP or data-parallel attention. |

> [!trap] More GPUs per replica is not always better
> TP = 8 instead of TP = 4 halves the weights per GPU, but it doubles the number of GPUs per replica and adds communication. If you need throughput, not latency, two TP = 4 replicas often serve more requests than one TP = 8 replica (interpretation of these notes). Measure both ([L10: Serving engines](/notes/ai/llm-systems/04-inference/l10-serving-engines)).

### 11.1 Exercises

Notebook: `C:\Users\ASohi\Downloads\AI\agent-harness-lab\llm-systems\l8-parallelism.ipynb`.

1. **Tensor-parallel MLP for any TP size.** Generalize the code of section 6.1 to `tp` in {1, 2, 4, 8} with $f = 64$.
   - Acceptance test: for every `tp`, the summed partial outputs equal the full output (`np.allclose`), and each GPU holds exactly $1/\mathrm{tp}$ of the MLP weights.
   - Hint 1: the same column range slices $W_{gate}$, $W_{up}$ (columns) and $W_{down}$ (rows).
   - Hint 2: `f // tp` must be an integer.
2. **KV per GPU.** Write `kv_bytes_per_token_per_gpu(L, H_kv, d_h, s, tp)` with replication when `tp > H_kv`, and `kv_replicas(H_kv, tp)`.
   - Acceptance test: Llama-3.1-70B gives 81,920 bytes at TP = 4. It gives 40,960 bytes at TP = 8 and TP = 16, and 2 replicas at TP = 16.
   - Hint 1: KV heads per GPU is `max(1, H_kv // tp)`.
   - Hint 2: replicas are `max(1, tp // H_kv)`.
3. **Pipeline bubble simulator.** Simulate a 4-stage pipeline with unit time per stage and $m$ micro-batches. Count the idle stage-slots.
   - Acceptance test: the idle share equals $(p-1)/(m+p-1)$: 75% for $m = 1$ and about 27% for $m = 8$.
   - Hint 1: micro-batch $j$ is in stage $s$ at time $j + s$.
   - Hint 2: total time is $m + p - 1$ slots, and busy slots are $m \cdot p$.

## 12. Common mistakes

1. **"Tensor parallelism splits the layers between GPUs."** That is pipeline parallelism. Tensor parallelism splits every weight matrix, and every GPU works on every layer.
2. **"Row-parallel first, then column-parallel."** Megatron uses column-parallel first, so the nonlinearity (GeLU or SiLU) runs locally on whole output columns. Then it uses row-parallel, so a single sum finishes the layer.
3. **"Tensor parallelism needs one all-reduce per matrix."** It needs two per transformer layer in the forward pass: after attention and after the MLP.
4. **"Pipeline parallelism reduces latency."** It lets a large model fit and raises throughput. A token still crosses every layer one after another.
5. **"With TP = 16 the KV cache per GPU keeps halving."** With 8 KV heads, it stops at one head per GPU. The heads are replicated, and the cluster stores the cache twice.
6. **"Tensor parallelism across servers is fine."** Each token needs two all-reduces per layer, 160 for a 70B model. Across a slower network that dominates the step. Use PP across servers.
7. **"Data parallelism shares the KV cache between replicas."** Each replica has its own cache. Prefix reuse needs cache-aware routing.
8. **"An MoE model with 671B parameters computes like a 671B dense model."** It activates about 37B per token. Memory scales with all parameters, compute with the active ones.

## 13. One-minute explanation

There are four ways to spread a model over GPUs. Data parallelism makes full copies that serve different requests, with no communication. Tensor parallelism splits each block's first matrix by columns and its second matrix by rows, so one all-reduce finishes the block. That gives two all-reduces per layer: about 3.75 MiB sent per GPU per token for a 70B model with TP = 4. So tensor parallelism stays inside an NVLink server. Attention splits by heads, so each GPU stores the KV cache of its own KV heads. With fewer KV heads than GPUs, or with MLA, the cache is replicated, and decode context parallelism shards it by tokens instead. Pipeline parallelism splits the layers into stages and sends little data, so it crosses servers, but it adds a bubble and no latency gain. Expert parallelism places MoE experts on different GPUs and routes tokens with all-to-all traffic. A typical large deployment uses TP inside a node, PP across nodes and DP replicas on top.

## 14. Check questions

```check
{
  "question": "In a tensor-parallel MLP, why is the first matrix split by columns and the second by rows, and not the other way?",
  "hint": "What happens to a nonlinear function applied to a partial sum?",
  "answer": "The first matrix is followed by a nonlinearity (GeLU, or SiLU in SwiGLU). If it were split by rows, each GPU would hold a partial sum of every output, and $\\mathrm{GeLU}(a + b) \\ne \\mathrm{GeLU}(a) + \\mathrm{GeLU}(b)$. The GPUs would have to sum before the nonlinearity: an extra synchronization. Split by columns, each GPU holds complete output columns and applies the nonlinearity locally. The second matrix is split by rows with the same index range. So each GPU multiplies its own slice and produces a partial sum of the final output. One all-reduce finishes the MLP."
}
```

```check
{
  "question": "Interview follow-up: Llama-3.1-8B (hidden 4096, 32 layers) runs with TP = 2. How many all-reduces per token, and how many bytes does each GPU send per token with a ring all-reduce in BF16?",
  "hint": "Bytes sent per GPU per all-reduce: $2(N-1)/N \\times S$.",
  "answer": "Two all-reduces per layer: $32 \\times 2 = 64$ per token per forward pass. Each sums $4096 \\times 2 = 8{,}192$ bytes = 8 KiB. With $N = 2$, each GPU sends $2 \\times 1/2 \\times 8 = 8$ KiB per all-reduce. Per token: $64 \\times 8 = 512$ KiB per GPU. For a 2,000-token prompt that is about 1 GB per GPU (computed in these notes)."
}
```

```check
{
  "question": "Interview follow-up: Llama-3.1-70B has 8 KV heads. What happens to the KV cache with TP = 4, TP = 8 and TP = 16? What does vLLM offer against the waste?",
  "answer": "Per GPU the cache holds $2 \\times 80 \\times (H_{kv}/N) \\times 128 \\times 2$ bytes per token.\n\n- TP = 4: 2 KV heads per GPU, 80 KiB per token per GPU, 320 KiB per token in total.\n- TP = 8: 1 KV head per GPU, 40 KiB per token per GPU, still 320 KiB in total.\n- TP = 16: only 8 heads for 16 GPUs. A KV head cannot be split, so each is replicated on 2 GPUs: still 40 KiB per GPU, but 640 KiB per token in total. Half of the cache memory is duplicated.\n\nvLLM's decode context parallelism (`-dcp`, size up to $\\mathrm{tp\\_size}/H$) shards the cache along the token dimension instead, which removes the duplication without more GPUs."
}
```

```check
{
  "question": "Interview follow-up: why do DeepSeek-V3 deployments use data-parallel attention with expert-parallel MoE layers, instead of plain tensor parallelism?",
  "answer": "Two reasons. First, MLA caches one shared latent vector per token, not one per head, so there are no KV heads to split. vLLM treats MLA decode as one KV head, and with TP = 8 every GPU would store the full latent cache: an 8-fold duplication. Data-parallel attention gives each GPU its own requests and its own cache, with no duplication. Second, the MoE layers have 256 small routed experts (intermediate size 2048). Splitting each expert over many GPUs makes tiny, inefficient matrix multiplies. Expert parallelism keeps whole experts on GPUs and moves tokens with all-to-all dispatch and combine instead. DeepSeek reports EP32 for prefill and EP320 for decode."
}
```

```check
{
  "question": "A pipeline has 8 stages and 16 micro-batches in flight. What share of the time is idle? How many micro-batches keep the idle share below 10%?",
  "answer": "Idle share $= (p-1)/(m+p-1) = 7/23 \\approx 30.4\\%$. For below 10%: $7/(m + 7) < 0.1$, so $m + 7 > 70$, $m > 63$. At least 64 micro-batches. This is why pipeline parallelism needs a steady stream of work, which continuous batching provides."
}
```

```check
{
  "question": "Interview follow-up: you have 8 GPUs with 48 GB each and no NVLink, and you must serve Llama-3.1-70B in BF16. Which parallelism, and why?",
  "answer": "Weights are about 141 GB, so at least 3 GPUs are needed for weights alone, and more for the KV cache. Without NVLink, tensor parallelism would send 160 all-reduces per token over PCIe: about 3.75 MiB per GPU per token at TP = 4. At about 64 GB/s per direction, prefill communication would then take longer than the compute. The vLLM docs recommend pipeline parallelism for GPUs without NVLink (their example is the L40S). So use PP = 8 (about 17.6 GB of weights per GPU), or PP over fewer GPUs plus data-parallel replicas if memory allows. Another option is an FP8 or INT4 checkpoint, which cuts the GPU count. Expect higher per-token latency than TP over NVLink."
}
```

```check
{
  "question": "Interview follow-up: for throughput, is one TP = 8 replica or two TP = 4 replicas better for a 70B model on 8 H100s? Reason with numbers.",
  "answer": "Two TP = 4 replicas usually serve more requests (interpretation of these notes, to be measured). Per replica, TP = 4 holds 35.3 GB of weights per GPU and leaves about 35 GB per GPU for the KV cache. That is about 431,000 tokens per replica, about 862,000 in total. TP = 8 holds 17.6 GB of weights per GPU and leaves about 53 GB per GPU at 40 KiB per token. That is about 1.29 million tokens, more KV capacity in one pool. But TP = 8 doubles the all-reduce participants and halves the work per GPU, so communication is a larger share of each step. TP = 8 wins on per-token latency and on maximum context. Two TP = 4 replicas avoid the extra communication and give two independent schedulers. The right answer is to benchmark both at your traffic and SLO."
}
```

```check
{
  "question": "What is the difference between the bytes that tensor parallelism and pipeline parallelism send per token for Llama-3.1-70B with 4 GPUs?",
  "answer": "TP = 4: 160 all-reduces of 16 KiB each. A ring all-reduce costs 24 KiB of sends per GPU, so about 3.75 MiB per GPU per token. PP = 4: one 16 KiB hidden state per stage boundary, 3 boundaries: 48 KiB per token in total, sent point-to-point. Pipeline parallelism sends about 80 times less, so it fits slow links. Tensor parallelism sends more but reduces latency."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\nimport numpy as np\n\nrng = np.random.default_rng(0)\nd, f = 8, 64\nx = rng.normal(size=(3, d))\nW_gate, W_up = rng.normal(size=(d, f)), rng.normal(size=(d, f))\nW_down = rng.normal(size=(f, d))\nsilu = lambda z: z / (1 + np.exp(-z))\nfull = (silu(x @ W_gate) * (x @ W_up)) @ W_down\n\nfor tp in [1, 2, 4, 8]:\n    assert f % tp == 0\n    partials, held = [], []\n    for r in range(tp):\n        cols = slice(r * f // tp, (r + 1) * f // tp)\n        h = silu(x @ W_gate[:, cols]) * (x @ W_up[:, cols])\n        partials.append(h @ W_down[cols, :])\n        held.append(W_gate[:, cols].size + W_up[:, cols].size + W_down[cols, :].size)\n    total = W_gate.size + W_up.size + W_down.size\n    print(f\"tp={tp}: equal={np.allclose(sum(partials), full)}, share per GPU={held[0] / total:.4f}\")\n```\n\nOutput:\n\n```text\ntp=1: equal=True, share per GPU=1.0000\ntp=2: equal=True, share per GPU=0.5000\ntp=4: equal=True, share per GPU=0.2500\ntp=8: equal=True, share per GPU=0.1250\n```"
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\ndef kv_bytes_per_token_per_gpu(L, H_kv, d_h, s, tp):\n    heads_per_gpu = max(1, H_kv // tp)          # a KV head cannot be split\n    return 2 * L * heads_per_gpu * d_h * s\n\ndef kv_replicas(H_kv, tp):\n    return max(1, tp // H_kv)                   # copies of each KV head in the group\n\nfor tp in [1, 2, 4, 8, 16]:\n    print(tp, kv_bytes_per_token_per_gpu(80, 8, 128, 2, tp), kv_replicas(8, tp))\n```\n\nOutput (tp, bytes, replicas):\n\n```text\n1 327680 1\n2 163840 1\n4 81920 1\n8 40960 1\n16 40960 2\n```"
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\ndef idle_share(p, m):\n    \"\"\"p stages, m micro-batches, unit time per stage. Micro-batch j is in stage s at time j + s.\"\"\"\n    total_time = m + p - 1\n    busy = {(j + s, s) for j in range(m) for s in range(p)}   # (time, stage) slots with work\n    idle = total_time * p - len(busy)\n    return idle / (total_time * p)\n\nfor m in [1, 4, 8, 32]:\n    print(m, round(idle_share(4, m), 4), round(3 / (m + 3), 4))\n```\n\nOutput (m, simulated, formula):\n\n```text\n1 0.75 0.75\n4 0.4286 0.4286\n8 0.2727 0.2727\n32 0.0857 0.0857\n```"
}
```

## 15. Links

- Previous: [L7: Quantization](/notes/ai/llm-systems/04-inference/l7-quantization)
- Next: [L9: Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)
- Matrix shapes and FLOPs: [L2: Matrices and matrix multiplication](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication)
- NVLink, PCIe and HBM: [L5: GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth)
- Heads and GQA: [L5: Multi-head attention](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) and [L5: MHA, MQA, GQA and MLA](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla)
- How the PagedAttention paper distributes the KV cache: [07 Scheduling, preemption and distributed execution](/notes/papers/llm-serving/2023-pagedattention/07-scheduling-and-preemption)
- GPU sizing in the cloud: [L2: Sizing GPUs for a model](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus)

### Sources

All checked on 2026-10-15.

- Shoeybi et al. "Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism." https://arxiv.org/abs/1909.08053
- Narayanan et al. "Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM." https://arxiv.org/abs/2104.04473
- DeepSeek-AI. "DeepSeek-V3 Technical Report." https://arxiv.org/abs/2412.19437
- NVIDIA H100 datasheet page: https://www.nvidia.com/en-us/data-center/h100/
- vLLM docs, Parallelism and Scaling: https://docs.vllm.ai/en/latest/serving/parallelism_scaling/
- vLLM docs, Context Parallel Deployment: https://docs.vllm.ai/en/latest/serving/context_parallel_deployment/
- vLLM docs, Engine Arguments: https://docs.vllm.ai/en/latest/configuration/engine_args/
- vLLM 0.31.0 source (PyPI wheel): `vllm/config/parallel.py`, `vllm/config/model.py` (`get_num_kv_heads`, `verify_with_parallel_config`), `vllm/model_executor/layers/linear.py`, `vllm/distributed/device_communicators/custom_all_reduce.py`
