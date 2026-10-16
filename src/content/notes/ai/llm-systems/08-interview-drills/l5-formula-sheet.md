---
title: "L5: Formula and numbers sheet"
order: 5
summary: "Every formula of the course on one page, from attention and the KV cache to roofline time, serving metrics, cost, retrieval scores and vector indexes. Each formula has its symbols, one worked number and a link to the lesson. Then the numbers to remember (models, GPUs, the paper, vLLM, MCP) and the JSON shapes to write from memory."
status: not-started
tags: [interview, formulas, numbers, kv-cache, roofline, cost, rag, mcp]
---

## 1. The question this idea answers

In a deep-dive interview, the interviewer gives you a whiteboard and a number. "Llama-3.1-8B on one H100. How many requests fit? How fast is one token? What does a million tokens cost?" You cannot open the lessons. You must write the formula, name every symbol and compute a number in two minutes.

The lessons of parts 01 to 07 derive about forty formulas. They are spread over thirty pages. This page collects them in the order that an answer needs them: memory first, then time, then cost, then retrieval quality.

The question of this page: **can you write every formula from memory, say what each symbol means and compute one real number with it**?

How to use this page:

1. Read the name of a formula and cover the rest. Write the formula on paper.
2. Name every symbol. Then compute the worked number without a calculator, to two digits.
3. Open the lesson link for every formula that you could not write. Write the gap on the [mistakes page](/notes/ai/llm-systems/00-progress/mistakes).
4. Repeat the numbers tables of section 11 until you can say each row aloud.

## 2. Mental model

> [!analogy] The pilot's kneeboard card
> A pilot does not derive the stall speed during the approach. He reads it from a small card on his knee. The card has a few formulas and the numbers of his aircraft: weights, speeds and fuel. A long test campaign produced each number. In the air he needs only the result and the rule that uses it. This page is your kneeboard card. Each formula is one line, and each worked number is one aircraft: Llama-3.1-8B on one H100.
>
> **Where it stops working:** the pilot's card holds the numbers of one aircraft only. An interviewer changes the aircraft: another model, another GPU, another price. So you must also know the derivation behind each line. Every formula on this page links to the lesson that derives it.

## 3. Terms

| Term | Plain meaning |
|---|---|
| arithmetic intensity | FLOPs of a task divided by the bytes it moves between GPU memory and the chip. |
| ridge point | The intensity where a GPU changes from memory-bound to compute-bound: peak FLOP/s divided by bandwidth. |
| roofline | The rule that attainable FLOP/s is the smaller of the peak and intensity times bandwidth. |
| bytes per token | The KV cache memory that one token holds over all layers. |
| `gpu_memory_utilization` | The fraction of GPU memory that one vLLM instance may use. 0.92 in vLLM 0.31.0. |
| TTFT | Time to first token: from sending the request to receiving the first output token. |
| TPOT | Time per output token: (E2E latency minus TTFT) divided by (output tokens minus 1). |
| Little's law | Average concurrency equals arrival rate times average time in the system. |
| acceptance rate $\alpha$ | The probability that the target model accepts one draft token in speculative decoding. |
| speculation length $\gamma$ | The number of draft tokens proposed per target pass. |
| quantization scale | The number $s$ that maps a real value to an integer code and back. |
| MFU | Model FLOPs utilization: the share of the peak arithmetic that the model really uses. |
| USD per MTok | The price of one million tokens. |
| RRF | Reciprocal rank fusion: a sum of $1/(k + \text{rank})$ over ranked lists. |
| nDCG | Normalized discounted cumulative gain: a graded ranking score between 0 and 1. |
| InfoNCE | The contrastive loss that trains embedding models with in-batch negatives. |
| product quantization (PQ) | A vector compression that stores one centroid code per sub-vector. |
| `efSearch` | The candidate list size of an HNSW query. Larger gives higher recall and slower queries. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. The map of this sheet

![Alt text: six panels of key formulas with one worked number each, and a strip of MCP versions and error codes.](/notes/media/llm-systems/figures/08-5-formula-map.svg)

> [!key] The chain behind every sizing answer
> Memory decides how many tokens fit. Bytes moved decide how long a decode step takes. The step time and the batch decide tokens per second. Tokens per second and the price per hour decide the cost per token. Learn the formulas in this order, and each answer gives the input of the next one.

Every entry below has the same parts: the formula, its symbols, one worked number and the lesson that derives it. The default example is Llama-3.1-8B in BF16 on one H100 SXM. Its numbers: $L = 32$ layers, $H = 32$ query heads, $H_{kv} = 8$ KV heads, $d_h = 128$, $d = 4{,}096$ and 8,030,261,248 parameters. The H100 SXM has about 989 TFLOP/s of dense BF16 compute and about 3.35 TB/s of bandwidth.

## 5. Attention

### 5.1 Scaled dot-product attention

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V, \qquad Q = XW_Q, \quad K = XW_K, \quad V = XW_V
$$

- $X$: the hidden states, one row per token.
- $Q$, $K$, $V$: queries, keys and values, one row per token.
- $d_k$: the width of one query and one key (the head dimension $d_h$).
- The softmax runs over each row, so each row of weights sums to 1.

> [!example] Worked example: row 1 of the toy example
> Scores before scaling, with $d_k = 2$: $[1, 2, 1]$. Scaled: $[0.7071, 1.4142, 0.7071]$. Softmax: $[0.2483, 0.5035, 0.2483]$. Output row: $[1.7517, 2.2483]$.

Lesson: [part 02 L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention).

### 5.2 Why the scale is $1/\sqrt{d_k}$

$$
\mathrm{Var}(q \cdot k) = \sum_{i=1}^{d_k} \mathrm{Var}(q_i k_i) = d_k, \qquad \mathrm{Var}\!\left(\frac{q \cdot k}{\sqrt{d_k}}\right) = 1
$$

- Assumption: the entries of $q$ and $k$ are independent, with mean 0 and variance 1.
- Each term $q_i k_i$ then has mean 0 and variance 1.
- Dividing by a constant $c$ divides the variance by $c^2$.

> [!example] Worked example: $d_k = 128$
> The standard deviation of a raw score is $\sqrt{128} \approx 11.31$. Without the scale, the softmax saturates: one weight is near 1 and the gradients of the others are near 0. After division by 11.31, the scores have variance 1 for every head width.

Lesson: [part 02 L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention).

### 5.3 Softmax and its stable form

$$
p_j = \frac{e^{s_j - m}}{\ell}, \qquad m = \max_j s_j, \qquad \ell = \sum_j e^{s_j - m}, \qquad \frac{\partial p_i}{\partial s_j} = p_i(\delta_{ij} - p_j)
$$

- $s_j$: the scaled scores of one row.
- $m$: the row maximum. Subtracting it changes nothing in exact arithmetic and prevents overflow.
- $\ell$: the normalizer.

> [!example] Worked example: the same row
> $m = 1.4142$. Terms: $e^{-0.7071} = 0.4931$, $e^{0} = 1$, $0.4931$. $\ell = 1.9862$. So $p = [0.2483, 0.5035, 0.2483]$, as in 5.1.

Lessons: [part 02 L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) and [part 02 L7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention).

### 5.4 Online softmax (FlashAttention)

$$
m_{new} = \max\big(m,\ \max_j s_j\big), \qquad \alpha = e^{m - m_{new}}
$$

$$
\ell \leftarrow \alpha\,\ell + \sum_j e^{s_j - m_{new}}, \qquad \tilde o \leftarrow \alpha\,\tilde o + \sum_j e^{s_j - m_{new}}\, v_j
$$

$$
o = \tilde o / \ell \text{ after the last tile}
$$

- A tile is a block of keys and values that fits in on-chip SRAM.
- $\alpha$ rescales the old sums when the running maximum grows. Here $\alpha$ is a rescale factor, not the acceptance rate of section 8.
- $\tilde o$: the output before division by $\ell$.

> [!example] Worked example: the row of "down", larger score second
> Tile 1 gives $m = 2.1213$, $\ell = 1.4931$, $\tilde o = [1.4931, 3.9861]$. Tile 2 has the maximum 2.8284, so $\alpha = e^{2.1213 - 2.8284} = 0.4931$. Then $\ell = 0.4931 \times 1.4931 + 0.1199 + 1 = 1.8561$ and $\tilde o = [2.9759, 4.3251]$. Output: $[2.9759 / 1.8561,\ 4.3251 / 1.8561] = [1.6034, 2.3302]$, exactly the direct softmax result.

Lesson: [part 02 L7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention).

### 5.5 Attention cost

$$
F_{attn} = 4 d L \cdot \frac{T(T+1)}{2} \text{ (causal)}, \qquad \text{bytes of one } T \times T \text{ matrix in BF16} = 2T^2
$$

- $T$: the context length. $d = H d_h$: the model width. $L$: the number of layers.

> [!example] Worked example: Llama-3.1-8B prefill
> $T = 8{,}192$: about 17.6 TFLOPs, so at least about 17.8 ms at 989 TFLOP/s. One score matrix per head: $2 \times 8{,}192^2$ bytes $= 128$ MiB. At $T = 131{,}072$ one head needs 32 GiB. FlashAttention keeps the $O(T^2 d)$ arithmetic and removes the $T \times T$ matrix from GPU memory.

Lesson: [part 02 L7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention).

### 5.6 The paged address of a token

$$
\text{logical block} = \lfloor t / B \rfloor, \qquad \text{offset} = t \bmod B
$$

$$
\text{slot} = \text{block\_table}[\lfloor t / B \rfloor] \cdot B + \text{offset}
$$

$$
\text{empty slots of one sequence} = \left\lceil \frac{n}{B} \right\rceil B - n \le B - 1
$$

- $t$: the token position. $B$: the block size in tokens (16 in vLLM). $n$: the stored tokens of the sequence.

> [!example] Worked example: two numbers
> Toy cache with $B = 2$ and block table $[5, 2]$: "down" at $t = 3$ is logical block 1, offset 1, physical block 2, slot $2 \times 2 + 1 = 5$.
>
> OPT-13B with $B = 16$: a sequence of 300 tokens takes $\lceil 300 / 16 \rceil = 19$ blocks $= 304$ slots. The 4 empty slots hold $4 \times 819{,}200 = 3{,}276{,}800$ bytes, about 3.3 MB.

Lessons: [part 02 L7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention), [paper page 04](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm) and [paper page 05](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager).

## 6. Memory

### 6.1 Weights

$$
\text{weights} = P \times s_w
$$

- $P$: the parameter count. $s_w$: bytes per parameter (2 for BF16, 1 for FP8).

> [!example] Worked example: Llama-3.1-8B in BF16
> $8{,}030{,}261{,}248 \times 2 = 16{,}060{,}522{,}496$ bytes $= 16.06$ GB $= 14.96$ GiB.

Lesson: [part 05 L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus).

### 6.2 KV cache size

$$
\text{KV bytes} = 2 \times L \times H_{kv} \times d_h \times s \times \sum_{b=1}^{B} T_b
$$

- 2: one key and one value.
- $L$: layers. $H_{kv}$: KV heads (not query heads). $d_h$: head dimension.
- $s$: bytes per element (2 for BF16, 1 for an FP8 cache).
- $T_b$: the tokens of sequence $b$. $B$: the number of sequences.

> [!example] Worked example: bytes per token
> Llama-3.1-8B: $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes $= 128$ KiB.
>
> OPT-13B (no GQA): $2 \times 40 \times 40 \times 128 \times 2 = 819{,}200$ bytes $= 800$ KiB. A 2,048-token request holds $819{,}200 \times 2{,}048 = 1{,}677{,}721{,}600$ bytes $= 1.5625$ GiB.

Two variants:

$$
\text{MLA bytes per token} = L \times (d_c + d_h^R) \times s
$$

$$
\text{per GPU with tensor parallelism } T{:}\quad 2 L \max\!\left(1, \left\lfloor H_{kv}/T \right\rfloor\right) d_h s
$$

> [!example] Worked example: DeepSeek-V3 and Llama-3.1-70B on 4 GPUs
> DeepSeek-V3: $61 \times (512 + 64) \times 2 = 70{,}272$ bytes. There is no factor 2, because one latent serves keys and values.
>
> Llama-3.1-70B with $T = 4$: $2 \times 80 \times 2 \times 128 \times 2 = 81{,}920$ bytes per token on each GPU.

Lessons: [part 03 L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula), [part 03 L5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) and [part 05 L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus).

### 6.3 Where the cache equals the weights

$$
T_{cross} = \frac{M_{weights}}{2 \, L \, H_{kv} \, d_h \, s}
$$

> [!example] Worked example: Llama-3.1-8B
> $16{,}060{,}522{,}496 / 131{,}072 \approx 122{,}532$ tokens, counted over all requests on the GPU. One request at the full 131,072-token context already holds 16 GiB of cache, more than the 14.96 GiB of weights.

Lesson: [part 03 L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula).

### 6.4 The GPU memory budget

$$
M_{KV} = M_{GPU} \times u - M_{weights} - M_{other}, \qquad \text{tokens} = \left\lfloor \frac{M_{KV}}{\text{bytes per token}} \right\rfloor
$$

- $u$: `gpu_memory_utilization`.
- $M_{other}$: peak activations, non-torch memory and CUDA graphs. The vLLM profiling run measures it at startup.

> [!example] Worked example: Llama-3.1-8B on one H100, two sets of assumptions
> Part 05: $u = 0.92$, $M_{other} = 3$ GiB. $80 \times 0.92 - 14.96 - 3 = 55.64$ GiB, so $55.64 \times 2^{30} / 131{,}072 = 455{,}823$ tokens. That is about 111 requests of 4,096 tokens.
>
> Part 03: $u = 0.90$, $M_{other} = 4$ GiB. $72 - 14.96 - 4 = 53.04$ GiB $= 434{,}523$ tokens, so 53 requests of 8,192 tokens.
>
> Say your assumptions aloud. The answer moves by about 5% when $u$ and $M_{other}$ change.

Lessons: [part 05 L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) and [part 03 L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula).

## 7. Time

### 7.1 The roofline

$$
t \ge \max\left(\frac{\text{FLOPs}}{\pi}, \frac{\text{bytes}}{\beta}\right), \qquad P(I) = \min(\pi,\ I \beta), \qquad I^{*} = \frac{\pi}{\beta}
$$

- $\pi$: peak FLOP/s. $\beta$: memory bandwidth in bytes per second.
- $I = \text{FLOPs} / \text{bytes}$: the arithmetic intensity of the task.
- $I^{*}$: the ridge point. Below it a task is memory-bound. Above it a task is compute-bound.

> [!example] Worked example: two ridge points
> H100 SXM: $989.5 / 3.35 \approx 295$ FLOP/byte. A100 80 GB SXM: $312 / 2.039 \approx 153$ FLOP/byte.

Lessons: [part 01 L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) and [part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound).

### 7.2 Intensity of the main operations

$$
I_{linear}(b) = \frac{b\, d}{d + 2b} \approx b, \qquad I_{decode} \approx \frac{2PB}{2P} = B, \qquad I_{attention} = \frac{H}{H_{kv}}
$$

- $b$: tokens that share one read of a weight matrix. $B$: the decode batch.
- Decode attention reads each sequence's own cache, so its intensity does not grow with the batch.

> [!example] Worked example: Llama-3.1-8B
> Decode at batch 1: $I \approx 1$, far below 295. Decode attention: $32 / 8 = 4$ FLOP/byte at any batch size. A prefill of 2,000 tokens: about 1,775 FLOP/byte, so it is compute-bound.

Lessons: [part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) and [part 03 L2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode).

### 7.3 Prefill FLOPs

$$
F_{prefill}(T) = 2 N_{blk} T + 4 L d \frac{T(T+1)}{2} + 2 N_{head}, \qquad \text{rough rule: } 2 P T
$$

- $N_{blk} = 6{,}979{,}584{,}000$: the weights inside the 32 blocks.
- $N_{head} = 128{,}256 \times 4{,}096 = 525{,}336{,}576$: the LM head, used once for the last position.

> [!example] Worked example: a 2,000-token prompt
> $F \approx 2.897 \times 10^{13}$ FLOPs. At 989 TFLOP/s: about 29.3 ms. The rough rule gives $2 \times 8.03 \times 10^9 \times 2{,}000 = 3.21 \times 10^{13}$ FLOPs, about 32.4 ms, about 10% too high.

Lessons: [part 03 L2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) and [part 05 L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus).

### 7.4 The decode step bound

$$
t_{step} \approx \max\left(\frac{W + B\,C\,s_{kv}}{\beta},\ \frac{2PB + 4CdLB}{\pi}\right), \qquad \text{tokens per second} \approx \frac{B}{t_{step}}
$$

- $W$: weight bytes. $B$: sequences in the batch. $C$: cached tokens per sequence.
- $s_{kv}$: KV bytes per token (131,072). The step time is also the TPOT that each user sees.

> [!example] Worked example: batch 1 and batch 64
> Batch 1, empty cache: $16.06 \times 10^9 / 3.35 \times 10^{12} \approx 4.79$ ms, so at most about 208.6 tokens per second.
>
> Batch 64, context 2,048: KV bytes $64 \times 2{,}048 \times 131{,}072 = 17.18$ GB. Total $16.06 + 17.18 = 33.24$ GB, so 9.92 ms per step and about 6,450 tokens per second. Compute: about 1.04 ms, so the step is memory-bound.

Lessons: [part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound), [part 05 L7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) and [part 03 L2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode).

## 8. Serving metrics, capacity and speed tricks

### 8.1 TTFT, TPOT and E2E

$$
\mathrm{TTFT} = t_1 - t_0, \qquad \mathrm{E2E} = t_n - t_0, \qquad \mathrm{TPOT} = \frac{\mathrm{E2E} - \mathrm{TTFT}}{n - 1}, \qquad \mathrm{E2E} = \mathrm{TTFT} + \mathrm{TPOT}\,(n - 1)
$$

- $t_0$: the send time. $t_1, \dots, t_n$: the arrival times of the $n$ output tokens.
- The first token belongs to TTFT, so the factor is $n - 1$.

> [!example] Worked example: two requests
> TTFT 100 ms, E2E 260 ms, 5 tokens: $\mathrm{TPOT} = 160 / 4 = 40$ ms.
>
> Llama-3.1-8B, 2,000-token prompt, 500 output tokens: $29.3 + 499 \times 4.88 \approx 2{,}464$ ms, about 2.47 s.

Lessons: [part 04 L2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) and [part 03 L2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode).

### 8.2 Little's law

$$
L = \lambda W, \qquad \lambda_{max} = \frac{L_{max}}{W}
$$

- $L$: average requests in the system, not the number of layers. $\lambda$: arrival rate. $W$: average time in the system (E2E).

> [!example] Worked example: replicas
> $\lambda = 5$ requests per second, $W = 8$ s: $L = 40$. One replica meets the SLO with at most 32 concurrent requests, so $\lceil 40 / 32 \rceil = 2$ replicas, plus headroom. Backward: $32 / 8 = 4$ requests per second per replica.

Lesson: [part 04 L2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics).

### 8.3 The HPA rule and the burn rate

$$
\text{desiredReplicas} = \left\lceil \text{currentReplicas} \times \frac{\text{currentMetricValue}}{\text{desiredMetricValue}} \right\rceil, \qquad \text{burn rate} = \frac{\text{error rate}}{100\% - \text{SLO}}
$$

- The HPA skips a change when the ratio is within the tolerance of 0.1.
- A burn rate of 1 spends the error budget in exactly one period.

> [!example] Worked example: queue and errors
> Two replicas with 13 waiting requests each, target 5: $\lceil 2 \times 2.6 \rceil = 6$ replicas.
>
> SLO 99.9%, errors 1.44%: burn rate $1.44 / 0.1 = 14.4$. A 30-day budget is gone in $30 / 14.4 \approx 2.08$ days.

Lessons: [part 05 L5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) and [part 05 L8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations).

### 8.4 Speculative decoding

$$
E[\text{tokens per target pass}] = \frac{1 - \alpha^{\gamma + 1}}{1 - \alpha}
$$

$$
\text{speedup} = \frac{1 - \alpha^{\gamma + 1}}{(1 - \alpha)(\gamma c + 1)}
$$

$$
\beta = \sum_x \min(p(x), q(x))
$$

- $\alpha$: the acceptance rate. $\gamma$: the speculation length. $c$: the cost of one draft pass relative to one target pass.
- $\beta$: the acceptance probability in one context, with target distribution $p$ and draft distribution $q$. It is not the bandwidth $\beta$ of section 7.1.
- The limit for long drafts is $1 / (1 - \alpha)$.

> [!example] Worked example: $\alpha = 0.8$, $\gamma = 4$, $c = 0.05$
> $E = (1 - 0.8^5) / 0.2 = 0.67232 / 0.2 = 3.3616$ tokens. Speedup $= 3.3616 / 1.2 \approx 2.80$. The best $\gamma$ for these values is 8, with a speedup of 3.09. The limit is 5 tokens per pass.

Lesson: [part 04 L6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding).

### 8.5 Quantization

$$
s = \frac{\max_i \lvert x_i \rvert}{q_{max}}, \qquad q_i = \mathrm{clamp}\left(\mathrm{round}\left(\frac{x_i}{s}\right), -q_{max}, q_{max}\right)
$$

$$
\hat{x}_i = s \cdot q_i, \qquad \text{bits per weight} = 4 + \frac{16}{g}
$$

- $q_{max} = 127$ for INT8. The error of each value is at most $s/2$.
- $g$: the group size of a 4-bit format with one FP16 scale per group.

> [!example] Worked example: INT8 absmax
> $x = [0.52, -1.30, 3.10, 0.02, -2.60, 0.95]$. $s = 3.10 / 127 \approx 0.024409$. Codes: $[21, -53, 127, 1, -107, 39]$. The largest error is 0.0118, below $s/2 \approx 0.0122$. A 4-bit group of 128 costs $4 + 16/128 = 4.125$ bits per weight.

Lesson: [part 04 L7](/notes/ai/llm-systems/04-inference/l7-quantization).

## 9. Cost

### 9.1 From a GPU hour to a token

$$
\text{USD per MTok} = \frac{\text{USD per hour}}{r \times 3600} \times 10^6, \qquad \text{effective USD per MTok} = \frac{\text{USD per MTok at full load}}{u}
$$

- $r$: tokens per second at the operating point. $u$: the average utilization of the replica.

> [!example] Worked example: two prices
> One 8-GPU VM at USD 98.32 per hour and 10,000 tokens per second: $98.32 / 36{,}000{,}000 \times 10^6 \approx$ USD 2.73 per MTok.
>
> One H100 at USD 12.29 per hour and 6,450 tokens per second (batch 64, section 7.4): about USD 0.529 per MTok at the bound.

Lesson: [part 05 L7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math).

### 9.2 Input tokens and the break-even point

$$
r_{prefill} \approx \frac{\text{MFU} \times \text{peak FLOPS}}{2N}, \qquad r_{break\text{-}even} = \frac{\text{USD per hour}}{p \times 3600} \times 10^6
$$

- $N$: the parameter count. $p$: the API price in USD per MTok.

> [!example] Worked example: input price and break-even
> MFU 50%: $0.5 \times 989 \times 10^{12} / 16.06 \times 10^9 \approx 30{,}791$ tokens per second, so about USD 0.111 per MTok at USD 12.29 per hour.
>
> API at USD 0.71 per MTok against a VM at USD 98.32 per hour: $98.32 / (0.71 \times 3{,}600) \times 10^6 \approx 38{,}466$ tokens per second. Below that throughput, every month, the API is cheaper.

Lesson: [part 05 L7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math).

## 10. Retrieval

### 10.1 InfoNCE

$$
\mathcal{L}_i = -\log \frac{\exp(S_{ii} / \tau)}{\sum_{j=1}^{B} \exp(S_{ij} / \tau)}, \qquad \mathcal{L}_{min} = \log\big(1 + (B - 1)\, e^{-1/\tau}\big)
$$

- $S_{ij}$: the cosine of query $i$ and passage $j$. The diagonal holds the positives.
- $\tau$: the temperature, for example 0.05. $B$: the batch size.

> [!example] Worked example: batch 3, then the floor
> The cosine matrix of the lesson gives a mean loss of 0.8578 at $\tau = 1$ and 0.1053 at $\tau = 0.05$. For $B = 1{,}024$ and $\tau = 1$, even a perfect model has a loss of $\log(1 + 1{,}023\, e^{-1}) = 5.933$.

Lesson: [part 06 L2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth).

### 10.2 Reciprocal rank fusion

$$
\text{RRF}(d) = \sum_{r \in R} \frac{1}{k + r(d)}, \qquad k = 60
$$

- $R$: the ranked lists, for example dense and BM25. $r(d)$: the rank of $d$ in list $r$, from 1. A list without $d$ adds nothing.

> [!example] Worked example: two documents
> C7, dense rank 1 and BM25 rank 4: $1/61 + 1/64 = 0.032018$. C4, ranks 5 and 1: $1/65 + 1/61 = 0.031778$. Both beat any document that appears in one list only.

Lesson: [part 06 L5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking).

### 10.3 nDCG and the standard error

$$
\text{DCG@}k = \sum_{i=1}^{k} \frac{g(\text{rel}_i)}{\log_2(i + 1)}, \qquad \text{nDCG@}k = \frac{\text{DCG@}k}{\text{IDCG@}k}, \qquad \text{SE} = \sqrt{\frac{p(1 - p)}{n}}
$$

- $g$: the gain, linear ($g(r) = r$) or exponential ($g(r) = 2^r - 1$). Always say which.
- IDCG: the DCG of the ideal order of all judged documents.
- $p$: a measured rate. $n$: the number of questions.

> [!example] Worked example: nDCG@5 and a noisy change
> Grades by rank $[0, 2, 3, 0, 1]$, linear gain: DCG $= 1.2619 + 1.5 + 0.3869 = 3.1487$. Ideal grades $[3, 2, 2, 1]$: IDCG $= 5.6925$. nDCG@5 $= 0.5531$.
>
> $p = 0.8$, $n = 200$: SE $= 0.0283$, so a 95% interval is about $\pm 0.055$. A change from 0.80 to 0.83 is inside the noise.

Lesson: [part 06 L8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag).

### 10.4 Exact search and IVF

$$
\text{FLOPs} = 2Nd, \qquad \text{bytes read} = N d b, \qquad \text{IVF comparisons} \approx \text{nlist} + \text{nprobe} \cdot \frac{N}{\text{nlist}}, \qquad \text{nlist}^{*} = \sqrt{\text{nprobe} \cdot N}
$$

- $N$: the vectors. $d$: dimensions. $b$: bytes per value (4 for float32).

> [!example] Worked example: 10 million vectors of 1,024 dimensions
> Exact search reads about 41 GB per query. IVF with nprobe 16: $\text{nlist}^{*} = \sqrt{16 \times 10^7} = 12{,}649$, so about 25,298 comparisons, 0.25% of exact search.

Lesson: [part 06 L4](/notes/ai/llm-systems/06-rag/l4-vector-indexes).

### 10.5 HNSW

$$
l = \lfloor -\ln(U) \cdot m_L \rfloor, \qquad m_L = \frac{1}{\ln M}, \qquad P(l \ge j) = M^{-j}
$$

$$
\text{link bytes per node} \approx 4 \cdot 2M + \frac{4M}{M - 1}
$$

- $M$: links per node. `efConstruction`: the candidate list at build time. `efSearch`: the candidate list at query time.

> [!example] Worked example: $M = 16$
> 10 million nodes: about 625,000 in layer 1, and the top layer is near $\log_{16}(10^7) = 5.81$. Links: $128 + 4.27 = 132.3$ bytes per node next to 4,096 bytes of float32 vector. Measured in the lesson on 100,000 vectors: `efSearch` 16 gives recall@10 0.724, and `efSearch` 64 gives 0.954 with 682 distances.

Lesson: [part 06 L4](/notes/ai/llm-systems/06-rag/l4-vector-indexes).

### 10.6 Product quantization

$$
\text{code bytes} = \left\lceil \frac{m \cdot \text{nbits}}{8} \right\rceil, \qquad \text{compression} = \frac{4d}{\text{code bytes}}, \qquad \tilde{d}(x, y)^2 = \sum_{j=1}^{m} T_j\big[\text{code}_j(y)\big]
$$

- $m$: sub-vectors per vector. nbits: 8 for $k^{*} = 256$ centroids per sub-space.
- $T_j$: the lookup table of the query for sub-space $j$, built once per query.

> [!example] Worked example: $d = 1{,}024$, $m = 64$
> Code: 64 bytes instead of 4,096, so 64 times smaller. Codebooks: $64 \times 256 \times 16 \times 4 = 1$ MiB. One distance: 64 lookups and additions instead of 1,024 multiply-adds. IVF-PQ adds an 8-byte ID: 72 bytes per vector.

Lesson: [part 06 L4](/notes/ai/llm-systems/06-rag/l4-vector-indexes).

## 11. Numbers to remember

### 11.1 Models

From the model configs and papers, as used in the lessons. Bytes per token assume a BF16 cache.

| Model | $L$ | $H$ | $H_{kv}$ | $d_h$ | KV bytes per token | Weights |
|---|---|---|---|---|---|---|
| Llama-3.1-8B | 32 | 32 | 8 | 128 | 131,072 (128 KiB) | 8,030,261,248 parameters, 16.06 GB in BF16 |
| Llama-3.1-70B | 80 | 64 | 8 | 128 | 327,680 (320 KiB) | 70,553,706,496 parameters, 141.1 GB in BF16, 72.66 GB as FP8 checkpoint |
| Llama-3.1-405B | 126 | 128 | 8 | 128 | 516,096 (504 KiB) | not used in these lessons |
| Llama-2-7B (MHA) | 32 | 32 | 32 | 128 | 524,288 (512 KiB) | not used in these lessons |
| Qwen2.5-7B | 28 | 28 | 4 | 128 | 57,344 (56 KiB) | not used in these lessons |
| OPT-13B (MHA) | 40 | 40 | 40 | 128 | 819,200 (800 KiB) | about 26 GB (paper) |
| DeepSeek-V3 (MLA) | 61 | 128 | latent | latent | 70,272 | not used in these lessons |

Lessons: [part 03 L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) and [part 05 L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus).

### 11.2 GPUs

Dense BF16 is half of the "with sparsity" number that NVIDIA lists (checked on 2026-10-15).

| GPU | Memory | Bandwidth | Dense BF16 | Ridge point |
|---|---|---|---|---|
| L4 | 24 GB GDDR6 | 300 GB/s | about 121 TFLOPS | about 403 |
| L40S | 48 GB GDDR6 | 864 GB/s | 362.05 TFLOPS | about 419 |
| A100 80 GB SXM | 80 GB HBM2e | 2,039 GB/s | 312 TFLOPS | about 153 |
| H100 SXM | 80 GB HBM3 | 3.35 TB/s | about 989 TFLOPS | about 295 |
| H100 NVL | 94 GB | 3.9 TB/s | about 836 TFLOPS | about 214 |
| H200 SXM | 141 GB HBM3e | 4.8 TB/s | about 989 TFLOPS | about 206 |
| B200 | about 180 GB HBM3e | about 8 TB/s | about 2,250 TFLOPS | about 281 |

Links on the H100 SXM datasheet: NVLink 900 GB/s and PCIe Gen5 128 GB/s. Interpretation of these notes: both are sums of the two directions. Batch-1 decode speed of 16.06 GB of weights, at most: about 18.7 tokens per second (L4), 127.0 (A100) and 208.6 (H100).

Lessons: [part 01 L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth), [part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) and [part 04 L8](/notes/ai/llm-systems/04-inference/l8-parallelism).

### 11.3 The PagedAttention paper

| Number | Meaning |
|---|---|
| 20.4% to 38.2% | Share of KV memory that holds real token states in earlier systems (Orca Max to Orca Oracle) |
| 96.3% | The same share for vLLM (Figure 2) |
| 2 to 4 times | Throughput at the same latency, against FasterTransformer and Orca |
| 1.7 to 2.7 times, 2.7 to 8 times, up to 22 times | Request rate against Orca (Oracle), Orca (Max) and FasterTransformer |
| 30.42, 13.62, 7.00 | Average batched requests on ShareGPT at 2 requests per second: vLLM, Orca (Oracle), Orca (Max) |
| 20% to 26% | Higher attention kernel latency of PagedAttention |
| 6.1% to 9.8%, 37.6% to 55.2% | Memory saved by sharing on Alpaca: parallel sampling, beam search |
| 16.2% to 30.5%, 44.3% to 66.3% | The same on ShareGPT |
| 1.67 and 3.58 times | Throughput against Orca (Oracle) with a shared one-shot and five-shot prefix |
| 161.31 and 337.99 | ShareGPT mean input and output tokens. Alpaca: 19.31 and 58.45 |
| 800 KiB, 12 GiB, 7 | OPT-13B KV per token, its KV region on an A100 40 GB, and the requests that fit with 2,048-token reservations |

Interpretation of these notes: the paper's "800 KB" and "12 GB" are binary units. Some numbers are bar labels of figures, not text. Lessons: [paper page 03](/notes/papers/llm-serving/2023-pagedattention/03-the-question), [paper page 06](/notes/papers/llm-serving/2023-pagedattention/06-decoding-scenarios-and-sharing) and [paper page 09](/notes/papers/llm-serving/2023-pagedattention/09-results).

### 11.4 vLLM 0.31.0 (checked on 2026-10-15)

| Setting | Value |
|---|---|
| `--gpu-memory-utilization` | 0.92 |
| `--block-size` | 16 for most models |
| `--enable-prefix-caching` | on when the model supports it, hash `sha256` |
| `--max-num-batched-tokens` | 8,192 on H100 and H200, 16,384 on GPUs with 160 GiB or more, 2,048 on others |
| `--max-num-seqs` | 1,024 on H100, H200 and GPUs with 160 GiB or more, 256 on other GPUs such as L4, L40S and A100 |
| Server port | 8000 |

Lessons: [part 04 L10](/notes/ai/llm-systems/04-inference/l10-serving-engines) and [part 05 L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus).

### 11.5 MCP versions, dates and error codes

| Date | Event |
|---|---|
| 2024-11-05 | First revision: `initialize`, tools, resources, prompts, stdio and HTTP+SSE |
| 2024-11-25 | Anthropic open-sources MCP |
| 2025-03-26 | OAuth 2.1, Streamable HTTP, tool annotations, batching |
| 2025-06-18 | Batching removed, structured tool output, RFC 8707, elicitation |
| 2025-11-25 | Experimental tasks, URL elicitation, CIMD, JSON Schema 2020-12 |
| 2025-12-09 | MCP joins the Agentic AI Foundation under the Linux Foundation |
| 2026-05-21 | The 2026-07-28 release candidate is locked |
| 2026-07-28 | Stateless core: no `initialize`, `_meta` on every request, `server/discover`, MRTR |

| Code | Meaning |
|---|---|
| -32700, -32600, -32601, -32602, -32603 | JSON-RPC: parse error, invalid request, method not found, invalid params, internal error |
| -32002 | Resource not found in 2025-11-25 and earlier. Since 2026-07-28: -32602 |
| -32020, -32021, -32022 | New in 2026-07-28: HeaderMismatch, MissingRequiredClientCapability, UnsupportedProtocolVersion (HTTP 400) |

The MCP Python SDK is at version 2.3.0 (checked on 2026-10-15). Lessons: [part 07 L12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history), [part 07 L2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) and [part 07 L10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors).

### 11.6 Retrieval defaults

| Setting | Value |
|---|---|
| RRF constant $k$ | 60 |
| HNSW `M` | 16 in pgvector and Qdrant |
| `efConstruction` | FAISS 40, pgvector 64, Qdrant 100 |
| `efSearch` | FAISS 16, pgvector 40 |
| Temperature | `scale` 20.0 in sentence-transformers equals $\tau = 0.05$. E5 uses $\tau = 0.01$. |
| Post-filter trap | pgvector: a condition that matches 10% of rows returns about 4 of 40 candidates |

Lessons: [part 06 L2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth), [part 06 L4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) and [part 06 L5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking).

## 12. JSON shapes to remember

### 12.1 A tool definition with `inputSchema`

`name` and `inputSchema` are required. The root of `inputSchema` must be `"type": "object"`. This definition validates against the official 2026-07-28 schema (measured in the lesson):

```json
{
  "name": "search_orders",
  "title": "Search orders",
  "description": "Search the orders of one customer, newest first. Returns at most `limit` orders with ID, status and total in cents, and a `next_page_token` when more exist. Use it when the user asks about a customer's orders and the customer ID is known. It cannot change orders.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "pattern": "^CUS-[0-9]{4}$",
        "description": "Customer ID, format CUS-NNNN, for example CUS-0042."
      },
      "status": {
        "type": "string",
        "enum": ["pending", "shipped", "cancelled"],
        "description": "Only orders with this status. Omit for all statuses."
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 50,
        "default": 20,
        "description": "Orders per page, 1 to 50. Default 20."
      },
      "page_token": {
        "type": "string",
        "description": "Opaque token from the previous result. Omit on the first call."
      }
    },
    "required": ["customer_id"],
    "additionalProperties": false
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "orders": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "order_id": {"type": "string"},
            "status": {"type": "string", "enum": ["pending", "shipped", "cancelled"]},
            "total_cents": {"type": "integer"}
          },
          "required": ["order_id", "status", "total_cents"]
        }
      },
      "next_page_token": {"type": ["string", "null"]}
    },
    "required": ["orders", "next_page_token"]
  },
  "annotations": {"title": "Search orders", "readOnlyHint": true, "openWorldHint": false}
}
```

Remember three rules. `default: 20` is an annotation, so the server code applies it. `additionalProperties: false` rejects a typo such as `limt`. The model sees the name, the description and the input schema. It sees the output schema only if the host includes it. Lessons: [part 07 L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) and [part 07 L7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments).

### 12.2 A `tools/call` request in 2026-07-28

`params` requires `name` and `_meta`. The three `io.modelcontextprotocol/` keys travel on every request:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "search_orders",
    "arguments": {"customer_id": "CUS-0042", "status": "shipped", "limit": 2},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"elicitation": {"form": {}}},
      "io.modelcontextprotocol/clientInfo": {"name": "orders-agent", "version": "1.4.0"},
      "progressToken": "p-7",
      "traceparent": "00-0af7651916cd43dd8448eb211c80319c-00f067aa0ba902b7-01"
    }
  }
}
```

On Streamable HTTP the POST also carries `Mcp-Method: tools/call`, `Mcp-Name: search_orders` and `MCP-Protocol-Version: 2026-07-28`. Lesson: [part 07 L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth).

### 12.3 The result

`content` and `resultType` are required in 2026-07-28. `isError` is false when absent:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "complete",
    "content": [
      {
        "type": "text",
        "text": "{\"orders\": [{\"order_id\": \"ORD-1001\", \"status\": \"shipped\", \"total_cents\": 8997}, {\"order_id\": \"ORD-0987\", \"status\": \"shipped\", \"total_cents\": 2450}], \"next_page_token\": \"t2\"}"
      }
    ],
    "structuredContent": {
      "orders": [
        {"order_id": "ORD-1001", "status": "shipped", "total_cents": 8997},
        {"order_id": "ORD-0987", "status": "shipped", "total_cents": 2450}
      ],
      "next_page_token": "t2"
    },
    "isError": false,
    "_meta": {"io.modelcontextprotocol/serverInfo": {"name": "orders-server", "version": "2.0.1"}}
  }
}
```

### 12.4 The same call in 2025-11-25

The session holds the version and the capabilities, so the request has no `_meta` and the result has no `resultType`. One message per line:

```json
{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "search_orders", "arguments": {"customer_id": "CUS-0042"}}}
```

```json
{"jsonrpc": "2.0", "id": 3, "result": {"content": [{"type": "text", "text": "2 orders found."}], "isError": false}}
```

### 12.5 A Multi Round-Trip Request

Round 1 returns questions and a sealed state. The retry is a new request with a new `id`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "confirm": {
        "method": "elicitation/create",
        "params": {
          "mode": "form",
          "message": "Cancel order ORD-1001? This cannot be undone.",
          "requestedSchema": {
            "type": "object",
            "properties": {"confirm": {"type": "boolean", "title": "Confirm"}},
            "required": ["confirm"]
          }
        }
      }
    },
    "requestState": "v1.Kq3...sealed-by-the-server"
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "cancel_order",
    "arguments": {"order_id": "ORD-1001"},
    "inputResponses": {"confirm": {"action": "accept", "content": {"confirm": true}}},
    "requestState": "v1.Kq3...sealed-by-the-server",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"elicitation": {"form": {}}},
      "io.modelcontextprotocol/clientInfo": {"name": "orders-agent", "version": "1.4.0"}
    }
  }
}
```

A protocol error has an `error` member instead of `result`. The Python SDK 2.3.0 answered a forged `requestState` with this error object (measured in the lesson):

```json
{"code": -32602, "message": "Invalid or expired requestState", "data": {"reason": "invalid_request_state"}}
```

Lessons: [part 07 L9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots), [part 07 L5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless), [part 07 L11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) and [part 07 L2](/notes/ai/llm-systems/07-mcp/l2-json-rpc).

## 13. Common mistakes

1. **"The H100 does 1,979 TFLOPS of BF16."** That number assumes 2:4 structured sparsity. Dense LLM weights do not have it. Use about 989 TFLOPS, so the ridge point is about 295, not 590.
2. **"KV bytes per token use the number of attention heads."** They use the KV heads. With $H = 32$ instead of $H_{kv} = 8$, the Llama-3.1-8B cache looks four times larger than it is.
3. **"E2E = TTFT + TPOT × n."** The first token belongs to TTFT. The exact relation uses $n - 1$.
4. **"Decode time depends on the FLOPs."** At small batch, decode reads all weights once per step and does about one FLOP per byte. Bytes decide the time: 4.79 ms per step for 16.06 GB on an H100.
5. **"Longer drafts always help speculative decoding."** The expected tokens per pass approach $1/(1 - \alpha)$. With $\alpha = 0.5$, even infinite drafts give at most 2 tokens per pass, and each draft token costs $c$.
6. **"nDCG has one formula."** Linear and exponential gain give different numbers for graded labels. Say which one you use.
7. **"The paper's 800 KB and 12 GB are decimal units."** Interpretation of these notes: they are 800 KiB and 12 GiB. $2 \times 40 \times 40 \times 128 \times 2$ is exactly $819{,}200$ bytes $= 800 \times 1{,}024$.
8. **"`arguments` in `tools/call` may be a JSON string."** It is an object. Some model APIs return arguments as a string, and the host must parse it before it sends the request.

## 14. One-minute explanation

My sizing answers follow one chain. First, memory: the weights are parameters times bytes, and the KV cache is $2 L H_{kv} d_h s$ bytes per token, 131,072 for Llama-3.1-8B. The budget is GPU memory times `gpu_memory_utilization`, minus weights and overhead, which gives about 455,823 tokens on one H100. Second, time: decode is memory-bound, so a step takes about the bytes read divided by 3.35 TB/s, 4.79 ms at batch 1. Prefill is compute-bound, about 29.3 ms for 2,000 tokens at 989 TFLOPS. The ridge point, 295 FLOPs per byte, tells which regime a task is in. Third, serving: E2E is TTFT plus TPOT times $n - 1$, and Little's law $L = \lambda W$ gives the concurrency and the replicas. Fourth, cost: USD per hour divided by tokens per hour, times a million. For retrieval I use RRF with $k = 60$, nDCG with a stated gain and recall against exact search. I always say my assumptions aloud, because the answer moves when they change.

## 15. Check questions

```check
{
  "question": "Write the KV cache formula from memory, name every factor, and compute bytes per token for Llama-3.1-70B in BF16. At how many cached tokens does the cache equal the weights?",
  "hint": "Six factors. The 70B model has 80 layers, 64 query heads and 8 KV heads.",
  "answer": "$$\n\\text{KV bytes} = 2 \\times L \\times H_{kv} \\times d_h \\times s \\times \\sum_b T_b\n$$\n\n- 2: a key and a value. $L = 80$ layers. $H_{kv} = 8$ KV heads. $d_h = 128$. $s = 2$ bytes.\n- Bytes per token: $2 \\times 80 \\times 8 \\times 128 \\times 2 = 327{,}680$ bytes $= 320$ KiB.\n- Crossing point: $T_{cross} = 141.1 \\text{ GB} / 327{,}680 \\approx 430{,}626$ tokens, counted over all requests on the GPUs.\n\nWith an FP8 cache ($s = 1$) the bytes per token halve to 163,840. Source lessons: [part 03 L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) and [part 05 L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus)."
}
```

```check
{
  "question": "Interview follow-up: \"Why do we divide by the square root of d_k?\" Derive it in three lines and give the number for d_k = 128.",
  "hint": "Compute the variance of one product term first.",
  "answer": "1. Assume the entries of $q$ and $k$ are independent, with mean 0 and variance 1. Then $E[q_i k_i] = 0$ and $\\mathrm{Var}(q_i k_i) = E[q_i^2]\\,E[k_i^2] = 1$.\n2. The dot product sums $d_k$ independent terms: $\\mathrm{Var}(q \\cdot k) = d_k$. So the standard deviation is $\\sqrt{d_k}$, about 11.31 for $d_k = 128$.\n3. Dividing by a constant $c$ divides the variance by $c^2$. So $\\mathrm{Var}(q \\cdot k / \\sqrt{d_k}) = 1$ for every head width.\n\n**Why it matters:** with scores of standard deviation 11.31, the softmax saturates. One weight is near 1, and the gradient $p_i(\\delta_{ij} - p_j)$ of the others is near 0. Source lesson: [part 02 L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention)."
}
```

```check
{
  "question": "Interview follow-up: \"How fast can Llama-3.1-8B decode at batch 1 on an H100? And on an L4?\"",
  "hint": "Divide the weight bytes by the bandwidth.",
  "answer": "**Formula:** at batch 1, a decode step reads all weights once. $t \\ge W / \\beta$.\n\n- H100 SXM: $16.06 \\times 10^9 / 3.35 \\times 10^{12} \\approx 4.79$ ms, so at most about 208.6 tokens per second.\n- L4: 300 GB/s, so at most about 18.7 tokens per second. The 16.06 GB of BF16 weights also need most of its 24 GB.\n\n**Why bytes and not FLOPs:** the step does about $2P$ FLOPs on $2P$ bytes, an intensity of about 1. The H100 ridge point is about 295, so the step is memory-bound. Compute alone would take about 0.02 ms.\n\nThese are upper bounds. Real kernels reach only part of the bandwidth. Source lessons: [part 01 L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) and [part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)."
}
```

```check
{
  "question": "Interview follow-up: \"The H100 datasheet says 1,979 TFLOPS. Where is its ridge point, and which operations are below it?\" (Trap question.)",
  "hint": "Read the footnote of the datasheet row.",
  "answer": "**The trap:** 1,979 TFLOPS is \"with sparsity\". It assumes 2:4 structured sparsity, which dense LLM weights do not have. The dense BF16 peak is about 989.5 TFLOPS.\n\n**Ridge point:** $I^{*} = 989.5 \\times 10^{12} / 3.35 \\times 10^{12} \\approx 295$ FLOP/byte.\n\n| Operation | Intensity | Regime |\n|---|---|---|\n| Decode, batch $B$ | about $B$ | memory-bound until $B$ nears 295 |\n| Decode attention, Llama-3.1-8B | $H / H_{kv} = 4$, at any batch | always memory-bound |\n| Prefill of 2,000 tokens | about 1,775 | compute-bound |\n\nSource lessons: [part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) and [part 03 L2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode)."
}
```

```check
{
  "question": "Interview follow-up: \"Use Little's law. Peak traffic is 5 requests per second, average E2E at the SLO is 8 seconds, and one replica meets the SLO with 32 concurrent requests. How many replicas?\"",
  "hint": "Concurrency first, then divide by the concurrency per replica.",
  "answer": "1. $L = \\lambda W = 5 \\times 8 = 40$ requests in the system on average.\n2. Replicas: $\\lceil 40 / 32 \\rceil = 2$. Add headroom for bursts and for one failed replica.\n3. Output rate check: 400 output tokens each gives $5 \\times 400 = 2{,}000$ tokens per second, about 1,000 per replica.\n4. Memory check: $2{,}400 \\times 131{,}072 \\approx 315$ MB per request, so 20 requests per replica need about 6.3 GB. Latency limits the replica, not memory.\n\n**Trap:** $W$ grows with $L$, because more concurrency makes each decode step slower. Little's law links the averages at one operating point only. Measure $W$ at the planned load. Source lesson: [part 04 L2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)."
}
```

```check
{
  "question": "Interview follow-up: \"A draft model has an acceptance rate of 0.8. How many tokens does one target pass give with 4 draft tokens, and what is the speedup if a draft pass costs 5% of a target pass?\"",
  "hint": "A geometric series of acceptances, then divide by the cost of one round.",
  "answer": "$$\nE = \\frac{1 - \\alpha^{\\gamma + 1}}{1 - \\alpha} = \\frac{1 - 0.8^5}{0.2} = \\frac{0.67232}{0.2} = 3.3616\n$$\n\nCheck with the sum: $1 + 0.8 + 0.64 + 0.512 + 0.4096 = 3.3616$.\n\n$$\n\\text{speedup} = \\frac{E}{\\gamma c + 1} = \\frac{3.3616}{4 \\times 0.05 + 1} = \\frac{3.3616}{1.2} \\approx 2.80\n$$\n\nThe best $\\gamma$ for $\\alpha = 0.8$ and $c = 0.05$ is 8, with a speedup of about 3.09. The limit for long drafts is $1/(1 - 0.8) = 5$ tokens per pass. The formula assumes a memory-bound target, where verifying 5 tokens costs about as much as 1. Source lesson: [part 04 L6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding)."
}
```

```check
{
  "question": "Interview follow-up: \"An 8-GPU VM costs USD 98.32 per hour. An API sells Llama 3.3 70B at USD 0.71 per million tokens. What throughput must the VM sustain to be cheaper?\"",
  "hint": "Run the cost formula backward.",
  "answer": "$$\nr_{break\\text{-}even} = \\frac{\\text{USD per hour}}{p \\times 3600} \\times 10^6 = \\frac{98.32}{0.71 \\times 3{,}600} \\times 10^6 \\approx 38{,}466 \\text{ tokens per second}\n$$\n\nWith a 1-year reservation (about USD 62.92 per hour) it is about 24,618 tokens per second. On spot (about USD 18.17) it is about 7,109.\n\n**Production point:** the VM must sustain this rate every hour that you pay for, not only at peak. With average utilization $u$, the effective price per MTok is the full-load price divided by $u$. Prices are examples checked on 2026-10-15. Source lesson: [part 05 L7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math)."
}
```

```check
{
  "question": "Compute RRF with k = 60 for document C7 (dense rank 1, BM25 rank 4) and C4 (dense rank 5, BM25 rank 1). Which one wins, and why does RRF need no score normalization?",
  "hint": "Add one fraction per list.",
  "answer": "- C7: $1/61 + 1/64 = 0.016393 + 0.015625 = 0.032018$.\n- C4: $1/65 + 1/61 = 0.015385 + 0.016393 = 0.031778$.\n\nC7 wins by a small margin. Both beat every document that only one list found, because one list gives at most $1/61 = 0.016393$.\n\n**No normalization:** RRF uses only ranks. Cosine scores and BM25 scores have different scales, so a weighted sum of raw scores needs min-max normalization first. RRF avoids that. With $k = 60$, a document at rank $r$ in both lists beats a rank-1 document in one list while $r < k + 2 = 62$. Source lesson: [part 06 L5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking)."
}
```

```check
{
  "question": "Interview follow-up: \"Compress 1,024-dimensional float32 vectors with product quantization, m = 64 and 256 centroids per sub-space. Give the code size, the compression, the codebook size and the cost of one distance.\"",
  "hint": "One byte per sub-vector when there are 256 centroids.",
  "answer": "- Code: 64 sub-vectors × 8 bits $= 64$ bytes, instead of $1{,}024 \\times 4 = 4{,}096$ bytes. Compression: $4{,}096 / 64 = 64$ times.\n- Codebooks: $64 \\times 256 \\times 16 \\times 4 = 1{,}048{,}576$ bytes $= 1$ MiB, shared by all vectors. Each sub-vector has $1{,}024 / 64 = 16$ dimensions.\n- Per query: a table of $64 \\times 256 = 16{,}384$ entries, built with $256 \\times 1{,}024 = 262{,}144$ multiply-adds once.\n- One distance: 64 lookups and additions instead of 1,024 multiply-adds.\n\n**Production pattern:** codes alone rank poorly at high compression. Re-rank the code-based top 100 with full vectors. In the lesson's FAISS run, 32 times compression gave recall@10 0.418 from codes and 0.976 after re-ranking. Source lesson: [part 06 L4](/notes/ai/llm-systems/06-rag/l4-vector-indexes)."
}
```

```check
{
  "question": "Write a 2026-07-28 `tools/call` request from memory. Which fields of `params` are required, and which fields does a retry after `input_required` add?",
  "hint": "Three keys in `_meta` travel on every request.",
  "answer": "```json\n{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 7,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"search_orders\",\n    \"arguments\": {\"customer_id\": \"CUS-0042\"},\n    \"_meta\": {\n      \"io.modelcontextprotocol/protocolVersion\": \"2026-07-28\",\n      \"io.modelcontextprotocol/clientCapabilities\": {\"elicitation\": {\"form\": {}}},\n      \"io.modelcontextprotocol/clientInfo\": {\"name\": \"orders-agent\", \"version\": \"1.4.0\"}\n    }\n  }\n}\n```\n\n- Required: `name` and `_meta` (in 2025-11-25, `_meta` was optional and the session held the version). `arguments` is optional and is an object, never a string.\n- A retry adds `inputResponses` (a map with the keys of `inputRequests`) and `requestState` (echoed exactly). The retry MUST use a new `id`.\n- The result requires `content` and `resultType`.\n\nSource lessons: [part 07 L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) and [part 07 L9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots)."
}
```

```check
{
  "question": "Interview follow-up: \"Your faithfulness score went from 0.80 to 0.83 on 200 questions. Did the change help?\"",
  "hint": "Compare the change with two standard errors.",
  "answer": "Not shown yet. Compute the standard error of a rate:\n\n$$\n\\text{SE} = \\sqrt{\\frac{p(1 - p)}{n}} = \\sqrt{\\frac{0.8 \\times 0.2}{200}} = 0.0283\n$$\n\nA 95% interval is about $\\pm 1.96 \\times 0.0283 = \\pm 0.055$. A change of 0.03 is inside the noise.\n\nWhat to do: compare the two versions on the **same** questions. Count only the discordant questions, which one version gets right and the other gets wrong. Then apply a sign test, or grow the test set. Source lesson: [part 06 L8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag)."
}
```

## 16. Links

- Previous lesson: [L4: Drill: MCP](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp)
- Next lesson: [L6: A full mock interview](/notes/ai/llm-systems/08-interview-drills/l6-mock-interview)
- Drills that use these formulas: [L1](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention), [L2](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud), [L3](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag)
- Attention and memory: [part 02 L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention), [part 02 L7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention), [part 03 L2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode), [part 03 L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)
- Inference and cost: [part 04 L2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics), [part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound), [part 04 L6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding), [part 04 L7](/notes/ai/llm-systems/04-inference/l7-quantization), [part 05 L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus), [part 05 L7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math)
- Retrieval: [part 06 L2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth), [part 06 L4](/notes/ai/llm-systems/06-rag/l4-vector-indexes), [part 06 L5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking), [part 06 L8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag)
- MCP shapes: [part 07 L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth), [part 07 L7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments), [part 07 L9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots)
- The paper: [PagedAttention, results](/notes/papers/llm-serving/2023-pagedattention/09-results)
- [Glossary](/notes/ai/llm-systems/glossary) and [mistakes](/notes/ai/llm-systems/00-progress/mistakes)

### Sources

Every formula and number on this page is taken from the lessons that it links. The primary sources behind those lessons (checked on 2026-10-15):

- Attention Is All You Need: https://arxiv.org/abs/1706.03762
- Efficient Memory Management for Large Language Model Serving with PagedAttention: https://arxiv.org/abs/2309.06180
- NVIDIA H100 product page: https://www.nvidia.com/en-us/data-center/h100/
- Fast Inference from Transformers via Speculative Decoding: https://arxiv.org/abs/2211.17192
- vLLM documentation: https://docs.vllm.ai/en/latest/
- Reciprocal Rank Fusion: https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf
- Product quantization for nearest neighbor search: https://hal.univ-grenoble-alpes.fr/inria-00514462v1
- MCP specification 2026-07-28: https://modelcontextprotocol.io/specification/2026-07-28
