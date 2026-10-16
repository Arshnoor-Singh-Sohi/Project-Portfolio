---
title: "L7: The cost of attention and FlashAttention"
order: 7
summary: "Attention costs O(T^2 d) FLOPs, and a naive kernel also writes a T x T matrix to slow GPU memory. FlashAttention computes the exact same result tile by tile with the online softmax, never stores the T x T matrix, and is faster because it moves far fewer bytes. Also FlashAttention-2, -3 and -4, Flash-Decoding, and how kernels read a paged KV cache through a block table."
status: not-started
tags: [attention, flashattention, online-softmax, gpu, hbm, sram, paged-kv-cache, flash-decoding]
---

## 1. The question this idea answers

The attention of [L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) builds a $T \times T$ matrix of scores for every head. For $T = 131{,}072$ tokens (128K), one such matrix in BF16 takes 32 GiB. Llama-3.1-8B has 32 heads in each of 32 layers, and an H100 has 80 GB of memory. So at long context the plain formula does not fit in GPU memory.

Even at short context, a plain implementation is slow, and the reason is not arithmetic. It writes the $T \times T$ matrix to the GPU's large, slow memory and reads it back several times. FlashAttention (Dao et al., NeurIPS 2022) fixes both problems. It computes **exactly** the same output, never stores the $T \times T$ matrix, and runs several times faster, even though it does the same or more FLOPs.

An interviewer who hears "PagedAttention" or "KV cache" often asks three questions. Is FlashAttention an approximation? Why is it faster if the FLOPs are the same? How much memory does attention need with it? This lesson answers all three with formulas, byte counts and worked examples that you can compute by hand.

## 2. Mental model

> [!analogy] A cook with a small counter and a far pantry
> A cook works at a small counter (fast on-chip memory, SRAM). All ingredients sit in a big pantry at the other end of the kitchen (the GPU's main memory, HBM). The plain recipe says: make the full sauce and carry all of it to the pantry. Carry it back and season it. Carry it to the pantry again, carry it back, and only then plate it. Most of the time goes into walking. FlashAttention cooks in small batches at the counter. It brings a few ingredients, does every step on the counter, and keeps a short running tally on a sticky note. It walks to the pantry only to fetch new ingredients and to store the finished plate.
>
> **Where it stops working:** the running tally is not a simple sum. When a new batch contains a larger score, the cook must rescale everything on the counter so far (the online softmax). The cook also fetches the same key and value ingredients again for every batch of queries. And the total cooking work (the FLOPs) does not shrink. FlashAttention removes walking, not cooking.

## 3. Terms

| Term | Plain meaning |
|---|---|
| HBM | High-bandwidth memory: the large main memory of a GPU (80 GB on an H100 SXM). Large but far from the compute units. |
| SRAM (shared memory) | Small, fast memory inside each streaming multiprocessor (SM) of a GPU. 228 KB per SM on an H100. |
| memory traffic | The bytes that move between HBM and the compute units. |
| memory-bound | Limited by memory traffic, not by arithmetic. |
| compute-bound | Limited by arithmetic speed, not by memory traffic. |
| arithmetic intensity | FLOPs done per byte moved. Compare it with the GPU's ridge point ([part 01 L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth)). |
| kernel | One function that runs on the GPU with many threads. |
| kernel fusion | Doing several steps in one kernel, so the data between the steps never returns to HBM. |
| tile (block) | A small rectangular piece of a matrix that fits in SRAM. |
| online softmax | A way to compute softmax in one pass over the inputs, with a running maximum and a running sum. |
| running max $m$ | The largest score seen so far in a row. |
| running sum $\ell$ | The sum of $e^{s - m}$ over the scores seen so far in a row. |
| logsumexp $L$ | $L = m + \log \ell = \log \sum_j e^{s_j}$. One number per row, kept for the backward pass. |
| recomputation | Computing the attention matrix again in the backward pass instead of storing it. |
| IO-aware | Designed to minimize reads and writes between memory levels, not only FLOPs. |
| exact attention | Gives the same result as the formula, up to floating-point rounding. FlashAttention is exact. |
| Flash-Decoding (split-KV) | For decode, split the keys and values of one sequence into chunks, process the chunks in parallel, then merge the results. |
| block table | A per-sequence list that maps logical KV blocks to physical blocks in GPU memory (PagedAttention). |
| slot mapping | The index of the physical slot where a new token's key and value are written: physical block × block size + offset. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. The cost of attention

### 4.1 FLOPs: $O(T^2 d)$

For one head with $T$ queries and $T$ keys of length $d_h$:

- scores $S = QK^\top$: $[T, d_h] \times [d_h, T]$, so $2T^2 d_h$ FLOPs
- output $O = PV$: $[T, T] \times [T, d_h]$, so $2T^2 d_h$ FLOPs

Over $H$ heads, with $H d_h = d$: $4T^2 d$ per layer. Vaswani et al. (2017, Table 1) give the complexity of a self-attention layer as $O(n^2 \cdot d)$. With a causal mask, only $T(T+1)/2$ pairs are visible, so a kernel that skips the masked half does about half the work.

> [!example] Worked example: attention FLOPs of a Llama-3.1-8B prefill
> $L = 32$, $d = 4096$. Causal FLOPs: $4 d L \cdot \tfrac{T(T+1)}{2}$.
>
> - $T = 8{,}192$: about 17.6 TFLOPs. At about 989 TFLOPS (H100 SXM, dense BF16), at least about 17.8 ms.
> - $T = 131{,}072$: about 4,504 TFLOPs, so at least about 4.55 s on one H100 for the attention products alone.
>
> Compare the weight products of the same prefill, $2 N_{matmul} T$ with $N_{matmul} = 7.505$B ([L6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block)): about 123 TFLOPs at 8K and about 1,967 TFLOPs at 128K. At 8K the attention products are about 14% of the weight work. At 128K they are about 2.3 times the weight work.

### 4.2 Memory: the $T \times T$ matrix

The plain formula materializes $S$ (and then $P$) for every head. In BF16, each entry takes 2 bytes.

| Context $T$ | Entries per head | One head | One layer (32 heads) | All 32 layers |
|---|---|---|---|---|
| 8,192 | 67,108,864 | 128 MiB | 4 GiB | 128 GiB |
| 131,072 | 17,179,869,184 | 32 GiB | 1 TiB | 32 TiB |

A kernel can process one head at a time and free the memory after it, so the last column is an upper bound. But even one head at 128K needs 32 GiB for $S$ alone, plus 32 GiB for $P$.

```plot
{
  "title": "Memory of one T x T score matrix in BF16 versus context length (red curve, ink points at 8K, 32K, 64K, 128K)",
  "xAxis": { "label": "context length T (thousands of tokens)", "domain": [0, 132] },
  "yAxis": { "label": "GiB per head", "domain": [0, 34] },
  "disableZoom": true,
  "data": [
    { "fn": "x^2/512", "color": "#C81D25" },
    { "points": [[8, 0.125], [32, 2], [64, 8], [128, 32]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[8, 0.125], [32, 2], [64, 8], [128, 32]], "fnType": "points", "graphType": "scatter", "color": "#100D12", "skipTip": true }
  ]
}
```

The ink points mark 8K, 32K, 64K and 128K tokens: 0.125, 2, 8 and 32 GiB. Here the x-axis counts units of 1,024 tokens, so $2 \times (1024x)^2$ bytes equals $x^2/512$ GiB.

> [!key] The main idea of this lesson
> Attention needs $O(T^2 d)$ arithmetic. It does not need $O(T^2)$ memory. FlashAttention keeps the arithmetic and removes the $T \times T$ matrix from GPU memory.

## 5. Where the time goes: memory, not math

### 5.1 Two kinds of GPU memory

A GPU has a small, fast memory next to the compute units and a large, slower memory farther away ([part 01 L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth)).

| | A100 (FlashAttention paper) | H100 SXM (NVIDIA) |
|---|---|---|
| HBM size | 40 to 80 GB | 80 GB |
| HBM bandwidth | 1.5 to 2.0 TB/s | about 3.35 TB/s |
| SRAM per SM | 192 KB, 108 SMs | 228 KB |
| SRAM bandwidth | "estimated around 19TB/s" | not stated in the sources of these notes |
| L2 cache | not used in these notes | 50 MB |

A step is **memory-bound** when moving its bytes takes longer than its arithmetic. The FlashAttention paper names softmax as a typical memory-bound operation: softmax reads a number, does a few FLOPs on it, and writes it back.

### 5.2 Standard attention moves the $T \times T$ matrix four times

The FlashAttention paper describes the standard implementation (Algorithm 0):

1. "Load Q, K by blocks from HBM, compute S = QK>, write S to HBM."
2. "Read S from HBM, compute P = softmax(S), write P to HBM."
3. "Load P and V by blocks from HBM, compute O = PV, write O to HBM."
4. "Return O."

Count the elements that cross HBM for one head. $S$ is written and read: $2T^2$. $P$ is written and read: $2T^2$. $Q$, $K$, $V$ and $O$ cross once: $4Td_h$. Total: $4T^2 + 4Td_h$ elements. Each extra element-wise step that runs as its own kernel (scale, mask, dropout) adds another read and write of a $T \times T$ matrix.

> [!example] Worked example: standard attention in a Llama-3.1-8B prefill at 8K
> One head, $T = 8{,}192$, $d_h = 128$, BF16:
>
> - $S$ and $P$: $4 \times 8{,}192^2 \times 2$ bytes $= 512$ MiB
> - $Q$, $K$, $V$, $O$: $4 \times 8{,}192 \times 128 \times 2$ bytes $= 8$ MiB
> - total: 520 MiB per head and layer
>
> 32 heads × 32 layers: $1{,}024 \times 520$ MiB $= 520$ GiB $\approx 558$ GB. At about 3.35 TB/s this takes at least about 167 ms.
>
> Algorithm 0 computes the full matrix, so count the non-causal arithmetic: $4T^2 d L \approx 35.2$ TFLOPs. At 989 TFLOPS that takes at least about 35.6 ms.
>
> Memory traffic takes about 4.7 times longer than the arithmetic. Arithmetic intensity: $4T^2 d_h / 520\text{ MiB} \approx 63$ FLOPs per byte, far below the H100 ridge point of about 295. The standard kernel is memory-bound.

## 6. The online softmax

### 6.1 The problem: softmax needs the whole row

The stable softmax of a row of scores $s_1, \dots, s_n$ ([L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention)) is:

$$
m = \max_j s_j, \qquad \ell = \sum_j e^{s_j - m}, \qquad p_j = \frac{e^{s_j - m}}{\ell}
$$

The maximum $m$ needs every score of the row before the first exponential. The sum $\ell$ needs every exponential before the first division. So the plain algorithm needs the whole row at once: that is why it writes $S$ to HBM.

Milakov and Gimelshein (2018) showed how "to compute classical Softmax with fewer memory accesses": keep a running maximum and a running sum, and correct the sum when the maximum grows.

### 6.2 Merging two pieces of a row

The FlashAttention paper (section 3.1) splits a row $x$ into two pieces, $x = [x^{(1)}\ x^{(2)}]$, and shows:

$$
m(x) = \max\big(m(x^{(1)}),\ m(x^{(2)})\big)
$$

$$
\ell(x) = e^{m(x^{(1)}) - m(x)}\,\ell(x^{(1)}) + e^{m(x^{(2)}) - m(x)}\,\ell(x^{(2)})
$$

"Therefore if we keep track of some extra statistics (m(x), ℓ(x)), we can compute softmax one block at a time."

Attention needs one more thing: the weighted sum of values. Keep an **unnormalized** output $\tilde o = \sum_j e^{s_j - m} v_j$ next to $m$ and $\ell$. When a new tile with scores $s_j$ and values $v_j$ arrives:

$$
m_{new} = \max\big(m,\ \max_j s_j\big), \qquad \alpha = e^{m - m_{new}}
$$

$$
\ell \leftarrow \alpha\,\ell + \sum_j e^{s_j - m_{new}}, \qquad \tilde o \leftarrow \alpha\,\tilde o + \sum_j e^{s_j - m_{new}}\, v_j
$$

After the last tile, $o = \tilde o / \ell$. FlashAttention-2 uses exactly this form: it keeps "an 'un-scaled' version of O" and divides once at the end.

> [!key] Why the online softmax is exact
> After each tile, two statements hold: $\ell = \sum e^{s_j - m}$ and $\tilde o = \sum e^{s_j - m} v_j$, over all tiles seen so far, with the current $m$. When $m$ grows to $m_{new}$, every old term must change from $e^{s_j - m}$ to $e^{s_j - m_{new}} = e^{s_j - m} \cdot e^{m - m_{new}}$. Multiplying the old sums by $\alpha = e^{m - m_{new}}$ does exactly that. So after the last tile, $\tilde o / \ell = \sum_j \frac{e^{s_j - m}}{\sum_k e^{s_k - m}} v_j$, which is the softmax-weighted sum. No term is dropped and nothing is approximated.

### 6.3 Worked example: the row of "down", two tiles

Use the decode step of the toy example ([L4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation)): $q_4 = [1, 2]$, keys $[1,0], [0,2], [0,1], [1,1]$, values $[2,3], [2,2], [1,2], [1,3]$. The scaled scores are $[0.7071, 2.8284, 1.4142, 2.1213]$. The direct softmax gives the weights $[0.0646, 0.5388, 0.1310, 0.2657]$ and the output $[1.6034, 2.3302]$.

> [!example] Worked example: tiles of 2 keys, in order
> Start: $m = -\infty$, $\ell = 0$, $\tilde o = [0, 0]$.
>
> **Tile 1** ("the", "cat"), scores $[0.7071, 2.8284]$:
> 1. $m_{new} = 2.8284$. $\alpha = e^{-\infty} = 0$.
> 2. $p = [e^{0.7071 - 2.8284}, e^{0}] = [e^{-2.1213}, 1] = [0.1199, 1]$.
> 3. $\ell = 0 + 0.1199 + 1 = 1.1199$.
> 4. $\tilde o = 0.1199 \cdot [2, 3] + 1 \cdot [2, 2] = [2.2397, 2.3596]$.
>
> **Tile 2** ("sat", "down"), scores $[1.4142, 2.1213]$:
> 1. $m_{new} = \max(2.8284, 2.1213) = 2.8284$. $\alpha = e^{0} = 1$. The maximum did not change.
> 2. $p = [e^{1.4142 - 2.8284}, e^{2.1213 - 2.8284}] = [0.2431, 0.4931]$.
> 3. $\ell = 1 \cdot 1.1199 + 0.2431 + 0.4931 = 1.8561$.
> 4. $\tilde o = [2.2397, 2.3596] + 0.2431 \cdot [1, 2] + 0.4931 \cdot [1, 3] = [2.9759, 4.3251]$.
>
> **End:** $o = \tilde o / \ell = [2.9759 / 1.8561,\ 4.3251 / 1.8561] = [1.6034, 2.3302]$. This is the direct result.

### 6.4 Worked example: the larger score arrives later

In the first example the maximum came in tile 1, so $\alpha$ was 1. Process the same tiles in the opposite order. The math does not depend on the order, and split-KV kernels (section 10) do process chunks in any order.

> [!example] Worked example: tiles in reverse order, with a rescale
> **Tile 2 first** ("sat", "down"), scores $[1.4142, 2.1213]$:
> 1. $m = 2.1213$. $p = [e^{-0.7071}, 1] = [0.4931, 1]$.
> 2. $\ell = 1.4931$. $\tilde o = 0.4931 \cdot [1, 2] + [1, 3] = [1.4931, 3.9861]$.
>
> **Tile 1 next** ("the", "cat"), scores $[0.7071, 2.8284]$:
> 1. $m_{new} = 2.8284$. The maximum grew, so $\alpha = e^{2.1213 - 2.8284} = e^{-0.7071} = 0.4931$.
> 2. $p = [e^{-2.1213}, 1] = [0.1199, 1]$.
> 3. $\ell = 0.4931 \times 1.4931 + 0.1199 + 1 = 0.7362 + 1.1199 = 1.8561$.
> 4. $\tilde o = 0.4931 \cdot [1.4931, 3.9861] + 0.1199 \cdot [2, 3] + [2, 2] = [0.7362, 1.9655] + [0.2397, 0.3596] + [2, 2] = [2.9759, 4.3251]$.
>
> **End:** $o = [1.6034, 2.3302]$ again (computed without rounding). The old state was multiplied by $\alpha = 0.4931$ because all its terms were computed against the smaller maximum 2.1213.

![Alt text: a causal grid of tiles with skipped tiles above the diagonal, and a table of the running max, running sum and unnormalized output of the toy row down.](/notes/media/llm-systems/figures/02-7-tiling-online-softmax.svg)

```video
{
  "src": "/notes/media/llm-systems/manim/m09-online-softmax-over-tiles.mp4",
  "caption": "The running max, the running sum and the unnormalized output of the toy row change tile by tile and end at the exact softmax result."
}
```

## 7. FlashAttention, the forward pass

### 7.1 The algorithm

FlashAttention cuts $Q$ into row tiles of $B_r$ queries and $K$, $V$ into tiles of $B_c$ keys. The original paper sets "block sizes $B_c = \lceil M/4d \rceil$, $B_r = \min(\lceil M/4d \rceil, d)$", where $M$ is the SRAM size in elements and $d$ is the head dimension. For each query tile, the kernel:

1. loads the query tile $Q_i$ into SRAM once,
2. loops over the key and value tiles $K_j$, $V_j$ and loads each pair into SRAM. It computes the tile of scores $S_{ij} = Q_i K_j^\top / \sqrt{d_h}$ in SRAM, applies the mask, and updates $m$, $\ell$ and $\tilde o$ with the online softmax,
3. writes $O_i = \tilde o / \ell$ and $L_i = m + \log \ell$ to HBM.

$S_{ij}$ and the tile probabilities never leave SRAM. This loop order (outer loop over query tiles) is the order of FlashAttention-2. FlashAttention-2 notes that the outer loop is "embarrassingly parallel": each query tile goes to its own thread block.

### 7.2 NumPy implementation

```python
import numpy as np

def flash_attention(Q, K, V, Br=2, Bc=2, causal=True):
    T, dh = Q.shape
    O = np.zeros_like(Q)
    L = np.zeros(T)                                   # logsumexp per row, kept for backward
    for i0 in range(0, T, Br):                        # outer loop: one tile of queries
        q = Q[i0:i0 + Br]                             # [Br, dh]  ("load to SRAM")
        rows = np.arange(i0, i0 + len(q))
        m = np.full(len(q), -np.inf)                  # running max per row
        l = np.zeros(len(q))                          # running sum per row
        acc = np.zeros((len(q), dh))                  # unnormalized output
        for j0 in range(0, T, Bc):                    # inner loop: tiles of keys/values
            if causal and j0 > rows[-1]:
                break                                 # tile is fully above the diagonal
            k, v = K[j0:j0 + Bc], V[j0:j0 + Bc]
            s = q @ k.T / np.sqrt(dh)                 # [Br, Bc] tile of scores
            if causal:
                cols = np.arange(j0, j0 + len(k))
                s = np.where(cols[None, :] > rows[:, None], -np.inf, s)
            m_new = np.maximum(m, s.max(1))           # new running max
            alpha = np.exp(m - m_new)                 # rescale factor for old state
            p = np.exp(s - m_new[:, None])            # tile probabilities, unnormalized
            l = alpha * l + p.sum(1)
            acc = alpha[:, None] * acc + p @ v
            m = m_new
        O[i0:i0 + Br] = acc / l[:, None]              # normalize once at the end
        L[i0:i0 + Br] = m + np.log(l)
    return O, L

Q = np.array([[1, 1], [0, 1], [0, 1], [1, 2.]])
K = np.array([[1, 0], [0, 2], [0, 1], [1, 1.]])
V = np.array([[2, 3], [2, 2], [1, 2], [1, 3.]])
O, L = flash_attention(Q, K, V)
print(O.round(4))    # [[2. 3.] [2. 2.1956] [1.716 2.14] [1.6034 2.3302]]
print(L.round(4))    # [0.7071 1.6318 1.9659 3.4469]
```

What the important lines do:

1. The outer loop takes one tile of queries. On a GPU, each tile runs in its own thread block, in parallel.
2. `if causal and j0 > rows[-1]: break` skips every key tile that lies fully above the diagonal. The causal mask saves this work, not only these scores.
3. `np.where(cols > rows, -inf, s)` masks the part of a diagonal tile that lies above the diagonal.
4. `alpha = np.exp(m - m_new)` is the rescale factor of section 6.2. On the first tile, $m = -\infty$, so `alpha` is 0 and the empty state stays empty.
5. `acc / l` divides once at the end, as in FlashAttention-2.
6. `L = m + log(l)` is the logsumexp. It is the only per-row value that the backward pass needs.

The output equals the toy outputs of L3 and L4. These notes also tested random inputs with $T = 100$ and $d_h = 16$. For the tile sizes (16, 16), (7, 13), (1, 1) and (100, 100), the maximum difference from the plain formula was below $10^{-15}$.

### 7.3 What crosses HBM now

Per head, FlashAttention reads $Q$, $K$, $V$ and writes $O$ and $L$. It never writes $S$ or $P$. But it reads each $K$ and $V$ tile once for every query tile.

| Count for one head, $T = 8{,}192$, $d_h = 128$, BF16 | Bytes |
|---|---|
| standard attention ($S$, $P$ twice each, plus $Q$, $K$, $V$, $O$) | 520 MiB |
| FlashAttention, if HBM delivers every $K$ and $V$ tile again for each of the $T/128 = 64$ query tiles | about 260 MiB (about 132 MiB with causal skipping) |
| FlashAttention, if $Q$, $K$, $V$, $O$ cross HBM only once | 8 MiB |

The paper proves the asymptotic count (Theorem 2): standard attention "requires Θ(Nd + N²) HBM accesses", while FlashAttention "requires Θ(N²d²M⁻¹) HBM accesses", where $N$ is the sequence length and $M$ the SRAM size. Proposition 3 adds that no exact attention algorithm can do asymptotically better "for all M in the range [d, Nd]".

Interpretation of these notes: the true traffic lies between the last two rows. Many query tiles of the same head run at the same time and read the same $K$ and $V$ tiles. The 50 MB L2 cache of an H100 can serve such repeated reads. With $M \approx 228\text{ KB} / 2$ bytes $\approx 116{,}736$ elements and $d_h = 128$, the ratio $M / d^2 \approx 7$. With $d_h = 64$ it is about 28.

The FlashAttention paper measures the attention of GPT-2 medium in Figure 2. The setup: sequence length 1024, head dimension 64, 16 heads, batch size 64, forward plus backward, on an A100.

| | Standard attention | FlashAttention |
|---|---|---|
| GFLOPs | 66.6 | 75.2 |
| HBM reads and writes (GB) | 40.3 | 4.4 |
| Runtime (ms) | 41.7 | 7.3 |

FlashAttention does about 13% **more** FLOPs, moves about 9.2 times fewer bytes, and runs about 5.7 times faster. The caption states that "HBM access is the primary factor affecting runtime."

![Alt text: standard attention writes and reads S and P in HBM, while FlashAttention keeps tiles of S and P in SRAM and writes only O and L.](/notes/media/llm-systems/figures/02-7-standard-vs-flash-io.svg)

## 8. The backward pass: recompute instead of store

Training needs the gradients of $Q$, $K$ and $V$. The plain backward pass reads the stored $P$ ($T \times T$ per head). FlashAttention stores only "the output O and the softmax normalization statistics (m, ℓ)". In the backward pass it can "recompute the attention matrix S and P easily" from $Q$, $K$ and $V$, tile by tile, in SRAM. FlashAttention-2 simplifies this further: "We do not have to save both the max m(j) and the sum of exponentials ℓ(j)". It stores only the logsumexp $L = m + \log \ell$, because $p_j = e^{s_j - L}$.

This is why the FLOPs in the table of section 7.3 are higher for FlashAttention (75.2 versus 66.6 GFLOPs): the recomputation costs arithmetic. It is still faster, because arithmetic is cheap and HBM traffic is expensive.

> [!note] Inference has no backward pass
> In inference, recomputation does not happen. The forward pass alone already avoids the $T \times T$ matrix, and $L$ is not needed after the forward pass, unless partial results are merged (section 10).

## 9. Memory of attention with FlashAttention

Theorem 1 of the paper: FlashAttention "returns O = softmax(QK>)V with O(N²d) FLOPs" and "requires O(N) additional memory beyond inputs and output".

> [!example] Worked example: extra memory for one head
> The extra memory is the logsumexp vector: one 32-bit float per query row.
>
> - $T = 8{,}192$: $8{,}192 \times 4$ bytes $= 32$ KiB, compared with 128 MiB for $S$ in BF16.
> - $T = 131{,}072$: 512 KiB, compared with 32 GiB.
>
> The tiles in SRAM have a fixed size that does not grow with $T$.

FlashAttention does not shrink the KV cache. The keys and values of all past tokens still sit in HBM. The cache still grows linearly with $T$: 128 KiB per token for Llama-3.1-8B ([part 03 L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)). FlashAttention removes the **quadratic** memory. The **linear** memory of the cache remains.

## 10. Decode is different: Flash-Decoding

### 10.1 Why FlashAttention alone underuses the GPU in decode

In decode, each sequence has one new query. FlashAttention "parallelizes across the batch size and query length dimensions" (Dao et al., Flash-Decoding post, October 2023). With one query per sequence and a small batch, there are too few query tiles to fill the GPU: "With a batch size of 1, FlashAttention will use less than 1% of the GPU!"

Flash-Decoding adds parallelism along the keys:

1. Split the keys and values of the sequence into chunks.
2. Run attention on each chunk in parallel. Each chunk writes its partial output and "the log-sum-exp of the attention values".
3. Combine the chunks by "reducing over all the splits, using the log-sum-exp to scale the contribution of each split".

The post reports "up to 8x faster generation for very long sequences". The merge in step 3 is the same formula as section 6.2, applied to whole chunks.

> [!example] Worked example: split the row of "down" into two chunks and merge
> Chunk A ("the", "cat"): $m_A = 2.8284$, $\ell_A = 1.1199$, $\tilde o_A = [2.2397, 2.3596]$. Its logsumexp is $L_A = 2.8284 + \log 1.1199 = 2.9416$, and its normalized output is $\tilde o_A / \ell_A = [2, 2.1070]$.
>
> Chunk B ("sat", "down"): $m_B = 2.1213$, $\ell_B = 1.4931$, $\tilde o_B = [1.4931, 3.9861]$. $L_B = 2.5222$, normalized output $[1, 2.6698]$.
>
> Merge with the logsumexp values: the weight of chunk A is $\frac{e^{L_A}}{e^{L_A} + e^{L_B}} = \frac{1}{1 + e^{L_B - L_A}} = \frac{1}{1 + e^{-0.4195}} = 0.6034$, and the weight of chunk B is $0.3966$.
>
> $o = 0.6034 \cdot [2, 2.1070] + 0.3966 \cdot [1, 2.6698] = [1.6034, 2.3302]$.
>
> The logsumexp of the whole row is $\log(e^{2.9416} + e^{2.5222}) = 3.4469$, which equals $L$ of the row "down" from the NumPy code.

### 10.2 Decode attention is memory-bound anyway

In decode, the query is one vector, and the kernel must read every cached key and value of the sequence. A key and a value of $d_h$ numbers in BF16 take $4 d_h$ bytes. One query head does about $2 d_h$ FLOPs for the score and $2 d_h$ for the weighted sum. That is about 1 FLOP per byte. With GQA, a kernel can serve the 4 query heads of a group from one read, which gives about 4 FLOPs per byte for Llama-3.1-8B. Batching does not help, because each sequence reads its own cache. So decode attention is limited by the bytes of the KV cache ([part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)). This is why the size of the KV cache, and the way it is laid out in memory, matters so much.

## 11. Reading a paged KV cache through a block table

### 11.1 The layout problem

PagedAttention stores the KV cache in fixed-size blocks that are not next to each other in memory ([paper page 04](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm)). Each sequence has a block table that maps its logical block $j$ to a physical block number ([paper page 05](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager)). An attention kernel must then compute the address of each key from the block table, instead of assuming one contiguous array.

For a token at position $t$ with block size $B$:

$$
\text{logical block} = \lfloor t / B \rfloor, \qquad \text{offset} = t \bmod B, \qquad \text{slot} = \text{block\_table}[\lfloor t / B \rfloor] \cdot B + \text{offset}
$$

> [!example] Worked example: the toy tokens in a paged cache
> Block size $B = 2$. A pool of 8 physical blocks. The block table of the sequence is $[5, 2]$: logical block 0 is physical block 5, logical block 1 is physical block 2.
>
> | Token | $t$ | logical block | offset | physical block | slot |
> |---|---|---|---|---|---|
> | the | 0 | 0 | 0 | 5 | 10 |
> | cat | 1 | 0 | 1 | 5 | 11 |
> | sat | 2 | 1 | 0 | 2 | 4 |
> | down | 3 | 1 | 1 | 2 | 5 |
>
> To compute the attention of "down", the kernel reads physical block 5 (keys of "the" and "cat"), then physical block 2 ("sat" and "down"). Inside each block the two keys are contiguous. Between blocks, the kernel combines the partial results with the online softmax, exactly as in section 6.3. The output is $[1.6034, 2.3302]$.

### 11.2 Code: paged decode attention

```python
import numpy as np

def paged_decode(q, k_pool, v_pool, block_table, seq_len, B):
    m, l, acc = -np.inf, 0.0, np.zeros(v_pool.shape[-1])
    for j in range((seq_len + B - 1) // B):            # logical block j
        phys = block_table[j]                           # physical block number
        n = min(B, seq_len - j * B)                     # filled slots in this block
        k, v = k_pool[phys, :n], v_pool[phys, :n]       # contiguous inside the block
        s = k @ q / np.sqrt(len(q))
        m_new = max(m, s.max())
        alpha = np.exp(m - m_new)
        p = np.exp(s - m_new)
        l = alpha * l + p.sum()
        acc = alpha * acc + p @ v
        m = m_new
    return acc / l

K = np.array([[1, 0], [0, 2], [0, 1], [1, 1.]])
V = np.array([[2, 3], [2, 2], [1, 2], [1, 3.]])
B = 2
k_pool, v_pool = np.zeros((8, B, 2)), np.zeros((8, B, 2))
block_table = [5, 2]
for t in range(4):                                      # write each token into its slot
    phys, off = block_table[t // B], t % B
    k_pool[phys, off], v_pool[phys, off] = K[t], V[t]
print(paged_decode(np.array([1., 2.]), k_pool, v_pool, block_table, 4, B))  # [1.6034 2.3302]
print(paged_decode(np.array([0., 1.]), k_pool, v_pool, block_table, 3, B))  # [1.716  2.14  ]
```

The second call computes the row of "sat" with only 3 tokens. Its last block holds 1 filled slot (`n = 1`), so the kernel reads only the filled part.

### 11.3 How real kernels expose the block table

- **FlashAttention (upstream package).** `flash_attn_with_kvcache` takes `block_table`: "(batch_size, max_num_blocks_per_seq), dtype torch.int32". With a block table, `k_cache` has the shape "(num_blocks, page_block_size, nheads_k, headdim)", and the docstring states that "page_block_size must be a multiple of 256". The changelog lists "2.5: Paged KV cache."
- **vLLM.** Its FlashAttention backend writes the new keys and values with `reshape_and_cache_flash(key, value, key_cache, value_cache, slot_mapping, ...)`. It then calls `flash_attn_varlen_func(..., seqused_k=seqused_k, ..., block_table=block_table, ...)`. The backend declares supported block sizes as `MultipleOf(16)`. Its metadata holds `block_table`, `seq_lens`, `query_start_loc` and `slot_mapping` (vLLM main branch, checked on 2026-10-15).
- **FlashInfer.** It stores the page table in a compressed-row format with an index pointer per request and a `last_page_len` per request. The KV length of request $i$ is `page_size * (len(page_indices[i]) - 1) + last_page_len[i]`, and `last_page_len` must be greater than zero and at most `page_size`.
- **The original vLLM kernel.** The vLLM design page (now marked "a historical document") says that "each warp processes the calculation between one query token and key tokens of one entire block". A warp is a group of 32 GPU threads.

> [!note] Two sources, two block-size limits
> The upstream `flash_attn_with_kvcache` docstring requires a page size that is a multiple of 256. vLLM's FlashAttention backend accepts multiples of 16, and vLLM's `CacheConfig` sets `DEFAULT_BLOCK_SIZE` to 16 when no block size is given (main branch, checked on 2026-10-15). The paper's choice of block size is on [paper page 08](/notes/papers/llm-serving/2023-pagedattention/08-implementation). So the kernels that vLLM calls do not have the upstream limit of 256. These notes did not check the kernel source for the reason.

Why paging stays efficient: inside one block, the keys of $B$ tokens lie next to each other. So the kernel reads them with wide, contiguous loads. The block table adds one small lookup per block, not per number. Interpretation of these notes: with a block size of 16 and $d_h = 128$ in BF16, one block of one KV head holds $16 \times 128 \times 2 = 4{,}096$ bytes of keys. That is large enough for efficient reads.

## 12. FlashAttention-2, -3 and -4

| Version | Hardware target | Main changes (as the papers state them) | Reported result |
|---|---|---|---|
| FlashAttention (Dao et al., 2022) | A100 | Tiling, online softmax, recomputation in the backward pass, kernel fusion | 3× faster GPT-2 training (sequence 1K), 15% faster BERT-large than the MLPerf 1.1 record |
| FlashAttention-2 (Dao, 2023) | A100 | Fewer non-matmul FLOPs (unscaled output, store only logsumexp), parallelism over the sequence for one head, Q split across 4 warps instead of K and V | about 2× faster than FlashAttention, 50 to 73% of the A100's peak FLOP/s |
| FlashAttention-3 (Shah et al., 2024) | H100 | Warp specialization with asynchronous Tensor Cores and TMA, interleaved matmul and softmax, FP8 with block quantization and incoherent processing | 1.5 to 2.0× faster than FlashAttention-2, up to 740 TFLOPs/s in FP16 (75% utilization), close to 1.2 PFLOPs/s in FP8 |
| FlashAttention-4 (Zadouri et al., March 2026) | B200 (also Hopper) | Fully asynchronous MMA and larger tiles, software-emulated exponential, conditional softmax rescaling, tensor memory and 2-CTA MMA in the backward pass, written in CuTe-DSL in Python | up to 1.3× faster than cuDNN 9.13 and 2.7× faster than Triton, up to 1613 TFLOPs/s (71% utilization) in BF16 |

Three ideas from this table are worth knowing in detail:

1. **Non-matmul FLOPs are expensive.** FlashAttention-2: the A100 has "312 TFLOPs/s of FP16/BF16 matmul" but "only 19.5 TFLOPs/s of non-matmul FP32", so "each non-matmul FLOP is 16× more expensive than a matmul FLOP". That is why it divides by $\ell$ only once at the end.
2. **The exponential becomes the bottleneck.** FlashAttention-3: "the H100 SXM5 GPU has 989 TFLOPS of FP16 matmul but only 3.9 TFLOPS of special functions such as exponential". A softmax needs one exponential per score, so the kernel overlaps the exponentials of one tile with the matrix products of another.
3. **Conditional rescaling.** FlashAttention-4 rescales the state only when the new maximum exceeds the old one by more than a threshold $\tau$. The paper sets $\tau = \log_2 256 = 8$, in the base-2 exponent that the kernel uses. If the maximum grows by less, the kernel keeps the old maximum. Interpretation of these notes: the result stays exact, because $\tilde o$ and $\ell$ use the same (old) maximum, so it cancels in $\tilde o / \ell$. The terms $2^{s - m}$ then stay below $2^8 = 256$, which is safe in FP32.

Which version runs in practice changes with the engine and the GPU. vLLM's documentation (main branch, checked on 2026-10-15) states: "Default is FA4 on SM100+ (Blackwell), FA3 on SM90 (Hopper), FA2 otherwise." A backend can be chosen with `vllm serve <model> --attention-backend FLASH_ATTN`. Other vLLM backends exist, for example FlashInfer and Triton ([part 04 L10](/notes/ai/llm-systems/04-inference/l10-serving-engines)).

## 13. FlashAttention in PyTorch

PyTorch 2.14's `F.scaled_dot_product_attention` picks one of several implementations: "FlashAttention-2", "Memory-Efficient Attention", and "A PyTorch implementation defined in C++". The enum `torch.nn.attention.SDPBackend` in PyTorch 2.14 has the members `MATH`, `FLASH_ATTENTION`, `EFFICIENT_ATTENTION`, `CUDNN_ATTENTION` and `OVERRIDEABLE` (read in these notes from an installed PyTorch 2.14.1). To choose one, the docs recommend the context manager `sdpa_kernel`: "The context manager is the preferred mechanism." Optimized kernels run only on CUDA.

```python
import torch
import torch.nn.functional as F
from torch.nn.attention import SDPBackend, sdpa_kernel

torch.manual_seed(0)
q = torch.randn(1, 32, 1024, 128)           # [B, H, T, dh]
k = torch.randn(1, 8, 1024, 128)            # 8 KV heads (GQA)
v = torch.randn(1, 8, 1024, 128)

with sdpa_kernel([SDPBackend.MATH]):        # plain C++ path, runs on a CPU
    out = F.scaled_dot_product_attention(q, k, v, is_causal=True, enable_gqa=True)
print(out.shape)                            # torch.Size([1, 32, 1024, 128])

# Reference: repeat the KV heads and compute softmax(QK^T / sqrt(dh) + mask) V
kr, vr = k.repeat_interleave(4, dim=1), v.repeat_interleave(4, dim=1)
s = q @ kr.transpose(-2, -1) / 128 ** 0.5
s = s.masked_fill(torch.ones(1024, 1024, dtype=torch.bool).triu(1), float("-inf"))
ref = s.softmax(-1) @ vr
print((out - ref).abs().max())              # about 1e-6 in float32
```

On a CUDA GPU with BF16 tensors, `sdpa_kernel([SDPBackend.FLASH_ATTENTION])` forces the FlashAttention-2 kernel. The docs state that a warning explains why, if the fused kernel cannot run on the given inputs.

### Exercises

Write these in the notebook folder `llm-systems/` of the lab `C:\Users\ASohi\Downloads\AI\agent-harness-lab`.

1. **Online softmax for one row.** Write `online_attention_row(q, K, V, tile)` that walks over the keys in tiles and keeps $m$, $\ell$ and $\tilde o$.
   - Acceptance test: for the toy row of "down", tiles of 1, 2, 3 and 4 keys all give $[1.6034, 2.3302]$.
   - Hint 1: start with `m = -inf`, `l = 0`, `acc = zeros`.
   - Hint 2: multiply the old `l` and `acc` by `exp(m - m_new)` before you add the new tile.
2. **Tiled attention for a whole matrix.** Write `flash_attention(Q, K, V, Br, Bc, causal)` that returns $O$ and the logsumexp $L$.
   - Acceptance test: take random $Q$, $K$, $V$ with $T = 100$ and $d_h = 16$. For the tile sizes (16, 16), (7, 13) and (1, 1), the result equals the plain formula to within $10^{-12}$. $L$ equals `log(sum(exp(scores)))` per row.
   - Hint 1: keep one $m$, $\ell$ and accumulator per row of the query tile.
   - Hint 2: for causal masking, skip tiles with `j0 > last row`, and mask inside diagonal tiles.
3. **Merge partial results.** Write `partial(q, K, V)` that returns $(m, \ell, \tilde o)$ for a chunk and `merge(a, b)` that combines two chunks.
   - Acceptance test: chunks {the, cat} and {sat, down} merge to $[1.6034, 2.3302]$, and `merge(a, b)` equals `merge(b, a)`.
   - Hint 1: the merged maximum is the larger of the two.
   - Hint 2: scale each chunk's $\ell$ and $\tilde o$ by $e^{m_{chunk} - m}$.
4. **Paged decode.** Store the 4 toy tokens in a pool of 8 blocks of size 2 with the block table $[5, 2]$, then write `paged_decode`.
   - Acceptance test: the output for "down" is $[1.6034, 2.3302]$, for "sat" with `seq_len = 3` it is $[1.7160, 2.1400]$, and the slots of the four tokens are $[10, 11, 4, 5]$.
   - Hint 1: slot = physical block × B + offset.
   - Hint 2: the last block may be only partly filled.
5. **Count the bytes.** For one head with $T = 32{,}768$, $d_h = 128$, BF16, compute the HBM traffic of standard attention and the memory of one score matrix.
   - Acceptance test: your numbers match the formulas of sections 4.2 and 5.2 computed in Python.
   - Hint 1: $4T^2 + 4Td_h$ elements, 2 bytes each.
   - Hint 2: one score matrix has $T^2$ entries.

```check
{
  "question": "Exercise 1: show a reference solution.",
  "hint": "The rescale factor is exp(old max - new max).",
  "answer": "```python\nimport numpy as np\n\ndef online_attention_row(q, K, V, tile):\n    m, l, acc = -np.inf, 0.0, np.zeros(V.shape[1])\n    for j0 in range(0, len(K), tile):\n        s = K[j0:j0 + tile] @ q / np.sqrt(len(q))      # scores of this tile\n        m_new = max(m, s.max())\n        alpha = np.exp(m - m_new)                       # 0.0 on the first tile\n        p = np.exp(s - m_new)\n        l = alpha * l + p.sum()\n        acc = alpha * acc + p @ V[j0:j0 + tile]\n        m = m_new\n    return acc / l\n\nq = np.array([1., 2.])\nK = np.array([[1, 0], [0, 2], [0, 1], [1, 1.]])\nV = np.array([[2, 3], [2, 2], [1, 2], [1, 3.]])\nfor t in (1, 2, 3, 4):\n    print(t, online_attention_row(q, K, V, t).round(4))   # [1.6034 2.3302] each time\n```\n\nWith `tile = 1`, the maximum changes once: from 0.7071 to 2.8284 at \"cat\", with $\\alpha = e^{-2.1213} = 0.1199$."
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "hint": "Compare O and L with a plain implementation on the same inputs.",
  "answer": "Use the `flash_attention` function of section 7.2. Test it:\n\n```python\nimport numpy as np\n\ndef reference(Q, K, V):\n    T = len(Q)\n    S = Q @ K.T / np.sqrt(Q.shape[1])\n    S = S + np.triu(np.full((T, T), -np.inf), 1)\n    lse = np.log(np.exp(S - S.max(1, keepdims=True)).sum(1)) + S.max(1)\n    P = np.exp(S - lse[:, None])\n    return P @ V, lse\n\nrng = np.random.default_rng(0)\nQ, K, V = rng.normal(size=(3, 100, 16))\nO_ref, L_ref = reference(Q, K, V)\nfor br, bc in [(16, 16), (7, 13), (1, 1)]:\n    O, L = flash_attention(Q, K, V, br, bc)\n    assert np.allclose(O, O_ref, atol=1e-12) and np.allclose(L, L_ref, atol=1e-12)\nprint(\"ok\")\n```\n\nThe maximum differences are about $10^{-15}$: floating-point rounding only. The tile sizes do not need to divide $T$ or match each other."
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "hint": "Merging is the online-softmax update with a whole chunk as the tile.",
  "answer": "```python\nimport numpy as np\n\ndef partial(q, K, V):\n    s = K @ q / np.sqrt(len(q))\n    m = s.max()\n    p = np.exp(s - m)\n    return m, p.sum(), p @ V                    # (max, sum, unnormalized output)\n\ndef merge(a, b):\n    (ma, la, oa), (mb, lb, ob) = a, b\n    m = max(ma, mb)\n    fa, fb = np.exp(ma - m), np.exp(mb - m)\n    return m, fa * la + fb * lb, fa * oa + fb * ob\n\nq = np.array([1., 2.])\nK = np.array([[1, 0], [0, 2], [0, 1], [1, 1.]])\nV = np.array([[2, 3], [2, 2], [1, 2], [1, 3.]])\nA, B = partial(q, K[:2], V[:2]), partial(q, K[2:], V[2:])\nm, l, o = merge(A, B)\nprint((o / l).round(4))                         # [1.6034 2.3302]\nm2, l2, o2 = merge(B, A)\nassert np.allclose(o / l, o2 / l2)\n```\n\nChunk A has $m_A = 2.8284$, chunk B has $m_B = 2.1213$, so chunk B is scaled by $e^{-0.7071} = 0.4931$ and chunk A by 1."
}
```

```check
{
  "question": "Exercise 4: show a reference solution.",
  "hint": "Read only the n = min(B, seq_len - j * B) filled slots of the last block.",
  "answer": "Use `paged_decode` and the pool set-up of section 11.2. Then check the slots:\n\n```python\nB, block_table = 2, [5, 2]\nprint([block_table[t // B] * B + t % B for t in range(4)])   # [10, 11, 4, 5]\n```\n\nThe row of \"sat\" uses $q = [0, 1]$ and `seq_len = 3`: logical block 0 (physical 5) has 2 filled slots, logical block 1 (physical 2) has 1. The result $[1.7160, 2.1400]$ equals the dense result of L3."
}
```

```check
{
  "question": "Exercise 5: show a reference solution.",
  "hint": "Write the formula in elements first, then multiply by 2 bytes.",
  "answer": "```python\nT, dh = 32768, 128\nstd = (4 * T * T + 4 * T * dh) * 2          # bytes per head\nprint(std / 2**30)                          # 8.03125 GiB\nprint(T * T * 2 / 2**30)                    # 2.0 GiB for one score matrix\n```\n\nStandard attention moves $4 \\times 32{,}768^2 \\times 2 = 8$ GiB for $S$ and $P$, plus $4 \\times 32{,}768 \\times 128 \\times 2 = 32$ MiB for $Q$, $K$, $V$, $O$: about 8.03 GiB per head and layer. One score matrix is 2 GiB. For 32 heads × 32 layers the traffic would be about 8,224 GiB."
}
```


## 14. Common mistakes

1. **"FlashAttention approximates attention."** It is exact. The online softmax gives the same result as the plain formula, up to floating-point rounding. The paper's block-sparse variant is the approximate one.
2. **"FlashAttention reduces the FLOPs."** The forward pass does the same $O(T^2 d)$ FLOPs. The backward pass does more because of recomputation: 75.2 versus 66.6 GFLOPs in the paper's GPT-2 example. It is faster because it moves far fewer bytes.
3. **"FlashAttention makes attention linear."** The arithmetic stays quadratic in $T$. Only the extra memory becomes linear: one logsumexp per row instead of a $T \times T$ matrix.
4. **"FlashAttention shrinks the KV cache."** The KV cache is the input of attention, not its intermediate. FlashAttention removes $S$ and $P$. The cache stays at 128 KiB per token for Llama-3.1-8B.
5. **"The online softmax needs the maximum first."** It starts with any partial maximum and rescales the old state by $e^{m_{old} - m_{new}}$ when a larger score arrives.
6. **"Tiles must be processed left to right."** The merge is order-independent. Flash-Decoding processes chunks in parallel and merges them with the logsumexp.
7. **"FlashAttention is fast for decode by default."** With one query per sequence and a small batch, there is little parallel work. Split-KV kernels (Flash-Decoding) fix this, and decode attention stays memory-bound because it must read the whole KV cache.
8. **"A paged KV cache needs a different attention formula."** The formula is the same. The kernel only computes addresses through the block table and merges blocks with the online softmax.

## 15. One-minute explanation

Attention costs $4T^2 d$ FLOPs per layer, and a plain kernel also stores the $T \times T$ score and probability matrices in HBM. At 8K tokens it moves 512 MiB per head and layer for them, so it is memory-bound. At 128K tokens, one score matrix alone would need 32 GiB. FlashAttention cuts Q, K and V into tiles that fit in SRAM and loops over the key tiles for each query tile. It uses the online softmax: a running maximum, a running sum and an unnormalized output, rescaled by $e^{m_{old} - m_{new}}$ when the maximum grows. The result is exactly the softmax result, so FlashAttention is exact, and its extra memory is one logsumexp per row. The FLOPs do not drop, but HBM traffic does: 40.3 GB versus 4.4 GB in the paper's GPT-2 test, and 7.3 ms versus 41.7 ms. FlashAttention-2, -3 and -4 adapt the same idea to A100, H100 and Blackwell GPUs. Flash-Decoding splits the keys of one sequence for decode and merges the chunks with the logsumexp. With PagedAttention, the kernel reads each KV block through the block table and merges the blocks with the same online softmax.

## 16. Check questions

```check
{
  "question": "Interview follow-up: is FlashAttention an approximation? Prove your answer for the online softmax update.",
  "hint": "Write what l and the accumulator must equal after each tile.",
  "answer": "No, it is exact (up to floating-point rounding). Proof sketch by induction over tiles. Claim: after each tile, $\\ell = \\sum_j e^{s_j - m}$ and $\\tilde o = \\sum_j e^{s_j - m} v_j$ over all keys seen so far, where $m$ is the current maximum.\n\n- Start: no keys, $\\ell = 0$, $\\tilde o = 0$, $m = -\\infty$. The claim holds.\n- Step: a new tile arrives, $m_{new} = \\max(m, \\max s_{tile})$. Every old term must become $e^{s_j - m_{new}} = e^{s_j - m}\\, e^{m - m_{new}}$. Multiplying the old $\\ell$ and $\\tilde o$ by $\\alpha = e^{m - m_{new}}$ does this. Adding $e^{s_j - m_{new}}$ and $e^{s_j - m_{new}} v_j$ for the new keys completes the sums. The claim holds.\n\nAt the end, $\\tilde o / \\ell = \\sum_j \\frac{e^{s_j - m}}{\\sum_k e^{s_k - m}} v_j = \\sum_j \\mathrm{softmax}(s)_j\\, v_j$. The toy row of \"down\" gives $[1.6034, 2.3302]$ both ways."
}
```

```check
{
  "question": "Interview follow-up: why is FlashAttention faster if it does the same (or more) FLOPs?",
  "hint": "Compare the bytes moved with the FLOPs, and use the ridge point.",
  "answer": "Because the plain kernel is limited by memory traffic, not by arithmetic. It writes $S$ and $P$ ($T \\times T$ each) to HBM and reads them back: $4T^2$ elements per head. For Llama-3.1-8B at 8K tokens that is 520 MiB per head and layer, about 167 ms of HBM time for a whole prefill versus about 36 ms of matmul time. Its arithmetic intensity is about 63 FLOPs/byte, below the H100 ridge point of about 295.\n\nFlashAttention keeps the tiles of $S$ and $P$ in SRAM and fuses scale, mask, softmax and the $PV$ product into one kernel, so only $Q$, $K$, $V$, $O$ (plus repeated tile reads of $K$ and $V$) cross HBM. The paper measures 40.3 GB versus 4.4 GB of HBM traffic and 41.7 ms versus 7.3 ms, with 66.6 versus 75.2 GFLOPs. Fewer bytes, slightly more FLOPs, much less time."
}
```

```check
{
  "question": "Interview follow-up: how much memory does attention need with FlashAttention for one head at T = 131,072 tokens? And what memory does it NOT remove?",
  "hint": "One number per row versus T x T numbers per head.",
  "answer": "Extra memory: the logsumexp vector, one 32-bit float per query row: $131{,}072 \\times 4 = 524{,}288$ bytes = 512 KiB. Plus fixed-size tiles in SRAM. The plain kernel would need $131{,}072^2 \\times 2$ bytes = 32 GiB for $S$ alone in BF16.\n\nFlashAttention does not remove the inputs and outputs: $Q$, $K$, $V$, $O$ ($O(T d_h)$ each), and in inference it does not remove the KV cache. For Llama-3.1-8B, the cache at 128K tokens is $131{,}072 \\times 128$ KiB = 16 GiB per sequence. That linear memory is what PagedAttention manages."
}
```

```check
{
  "question": "Compute the memory of one T x T score matrix in BF16 for T = 8,192 and T = 131,072. How many such matrices would one layer of Llama-3.1-8B need at the same time if all heads were computed together?",
  "hint": "T^2 entries times 2 bytes.",
  "answer": "- $T = 8{,}192$: $8{,}192^2 \\times 2 = 134{,}217{,}728$ bytes = 128 MiB.\n- $T = 131{,}072$: $131{,}072^2 \\times 2 = 34{,}359{,}738{,}368$ bytes = 32 GiB.\n\nOne layer has 32 query heads, so 32 score matrices: 4 GiB at 8K and 1 TiB at 128K, and the same again for $P$. GQA does not help here: there are still 32 query heads, each with its own scores."
}
```

```check
{
  "question": "Interview follow-up: in decode, what does Flash-Decoding change, and why is decode attention memory-bound even with FlashAttention?",
  "hint": "Count the FLOPs per byte of one key and one value.",
  "answer": "In decode, each sequence has one query. FlashAttention parallelizes over the batch and the query length, so with a small batch it leaves most of the GPU idle (\"less than 1% of the GPU\" at batch size 1, according to the Flash-Decoding post). Flash-Decoding splits the keys and values of one sequence into chunks, computes each chunk in parallel with its logsumexp, then merges the chunks with the logsumexp weights, the same formula as the online softmax.\n\nDecode attention is memory-bound because every cached key and value must be read for one query. One query head does about $4 d_h$ FLOPs per key-value pair, and the pair takes $4 d_h$ bytes in BF16: about 1 FLOP per byte. With GQA, the 4 query heads of a group can share one read: about 4 FLOPs per byte. Batching does not raise this, since each sequence reads its own cache. The H100 ridge point is about 295 FLOPs per byte."
}
```

```check
{
  "question": "Interview follow-up: how does an attention kernel read a paged KV cache? Use block size 16 and a token at position 37 with the block table [7, 3, 12, 9].",
  "hint": "slot = block_table[t // B] * B + t % B.",
  "answer": "Logical block $= \\lfloor 37 / 16 \\rfloor = 2$, offset $= 37 \\bmod 16 = 5$. Physical block $=$ `block_table[2]` $= 12$. Slot $= 12 \\times 16 + 5 = 197$.\n\nThe kernel loops over the logical blocks $0, 1, 2$ of the sequence (positions 0 to 37 need 3 blocks; the last block has $38 - 32 = 6$ filled slots). For each block it reads the physical block number from the block table, loads the keys and values of that block (contiguous inside the block), computes the scores, and merges the block into the running $m$, $\\ell$ and $\\tilde o$ with the online softmax. The result equals dense attention. In vLLM, new keys and values are written to their slots with `reshape_and_cache_flash(..., slot_mapping, ...)`, and the attention call receives `block_table` and the sequence lengths."
}
```

```check
{
  "question": "Interview follow-up: what changed in FlashAttention-2, -3 and -4? Give one idea and one number for each.",
  "hint": "A100, H100, Blackwell: what became the new bottleneck each time?",
  "answer": "- **FlashAttention-2 (2023, A100):** fewer non-matmul FLOPs (keep the output unscaled and divide once; store only the logsumexp), parallelize one head over the sequence, split Q (not K and V) across warps. About 2× faster than FlashAttention, 50 to 73% of the A100 peak.\n- **FlashAttention-3 (2024, H100):** warp specialization with asynchronous Tensor Cores and TMA, overlap of softmax and matmul, FP8 with block quantization and incoherent processing. 1.5 to 2.0× faster than FlashAttention-2, up to 740 TFLOPs/s in FP16 (75% utilization). Reason: the H100 has 989 TFLOPS of matmul but only 3.9 TFLOPS for exponentials.\n- **FlashAttention-4 (March 2026, Blackwell):** fully asynchronous MMA with larger tiles, software-emulated exponential, conditional softmax rescaling (rescale only when the maximum grows by more than $\\tau = 8$ in base 2), written in CuTe-DSL. Up to 1613 TFLOPs/s on B200 (71% utilization), up to 1.3× faster than cuDNN 9.13.\n\nvLLM's docs (checked on 2026-10-15): \"Default is FA4 on SM100+ (Blackwell), FA3 on SM90 (Hopper), FA2 otherwise.\""
}
```

```check
{
  "question": "In the reverse-order example, why is the old state multiplied by 0.4931, and what would go wrong without it?",
  "hint": "Old terms were computed against a smaller maximum.",
  "answer": "The old state was computed with the maximum $m = 2.1213$: $\\ell = e^{1.4142 - 2.1213} + e^{0} = 1.4931$. When tile 1 brings the score 2.8284, the new maximum is 2.8284, and every old term must be $e^{s - 2.8284}$ instead of $e^{s - 2.1213}$. The factor is $e^{2.1213 - 2.8284} = e^{-0.7071} = 0.4931$.\n\nWithout it, the sum would be $1.4931 + 0.1199 + 1 = 2.6130$ and the output $([1.4931, 3.9861] + [0.2397, 0.3596] + [2, 2]) / 2.6130 = [1.4286, 2.4286]$: wrong, because the old terms would be too large by the factor $e^{0.7071} = 2.0281$."
}
```


## 17. Links

- Previous: [L6: The transformer block, end to end](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block)
- Next part: [part 03 L1: Why the KV cache exists](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists)
- The softmax and the toy numbers: [L3: Scaled dot-product attention, step by step](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) and [L4: Causal masking and generation](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation)
- HBM, SRAM and the roofline: [part 01 L5: GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) and [part 04 L3: Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)
- The KV cache that FlashAttention does not shrink: [part 03 L3: The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) and [part 03 L6: Shrinking the KV cache](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache)
- The paper: [04 PagedAttention: the algorithm](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm), [05 The KV cache manager and block tables](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager), [08 Implementation: the vLLM system and its kernels](/notes/papers/llm-serving/2023-pagedattention/08-implementation), [10 Limits and later work](/notes/papers/llm-serving/2023-pagedattention/10-limits-and-later-work)
- Engines and backends: [part 04 L10: Serving engines](/notes/ai/llm-systems/04-inference/l10-serving-engines)
- Older lesson: [Attention, the KV cache and the cost of length](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length)

### Sources

- Dao, Fu, Ermon, Rudra and Ré, "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness", NeurIPS 2022 (Algorithm 0, Algorithm 1, Theorems 1 and 2, Proposition 3, Figure 2): https://arxiv.org/abs/2205.14135
- Dao, "FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning", 2023: https://arxiv.org/abs/2307.08691
- Shah et al., "FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision", 2024: https://arxiv.org/abs/2407.08608
- Zadouri et al., "FlashAttention-4: Algorithm and Kernel Pipelining Co-Design for Asymmetric Hardware Scaling", arXiv 2603.05451, March 2026: https://arxiv.org/abs/2603.05451
- Milakov and Gimelshein, "Online normalizer calculation for softmax", 2018: https://arxiv.org/abs/1805.02867
- Dao, Haziza, Massa and Sizov, "Flash-Decoding for long-context inference", October 2023: https://crfm.stanford.edu/2023/10/12/flashdecoding.html
- FlashAttention repository and README (`flash_attn_with_kvcache`, changelog): https://github.com/Dao-AILab/flash-attention
- vLLM FlashAttention backend, `vllm/v1/attention/backends/flash_attn.py`: https://github.com/vllm-project/vllm/blob/main/vllm/v1/attention/backends/flash_attn.py
- vLLM attention backends design doc (source file): https://github.com/vllm-project/vllm/blob/main/docs/design/attention_backends.md
- vLLM paged attention design page (historical): https://docs.vllm.ai/en/latest/design/paged_attention.html
- FlashInfer, KV-cache layout tutorial: https://docs.flashinfer.ai/tutorials/kv_layout.html
- PyTorch 2.14, `scaled_dot_product_attention`: https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html
- NVIDIA Hopper tuning guide (228 KB shared memory per SM, 50 MB L2): https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html
- NVIDIA H100 product page (3.35 TB/s, BF16 1,979 TFLOPS with sparsity): https://www.nvidia.com/en-us/data-center/h100/
- Vaswani et al., "Attention Is All You Need", 2017, Table 1: https://arxiv.org/abs/1706.03762

All sources checked on 2026-10-15.
