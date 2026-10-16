---
title: "L7: Quantization"
order: 7
summary: "Quantization stores weights (and sometimes activations and the KV cache) in 8 or 4 bits with a scale factor. The lesson derives the absmax and zero-point formulas with worked numbers, shows why the granularity of the scales matters, explains weight-only versus W8A8, SmoothQuant, GPTQ and AWQ with runnable demos, covers FP8 on Hopper and NVFP4/MXFP4 on Blackwell, computes the memory and decode-speed effects for Llama-3.1-8B and 70B, and opens the safetensors, GPTQ/AWQ and GGUF file formats."
status: not-started
tags: [inference, quantization, int8, int4, fp8, fp4, gptq, awq, smoothquant, safetensors, gguf]
---

## 1. The question this idea answers

Two numbers from earlier lessons create the problem.

1. Llama-3.1-70B in BF16 needs about 141 GB for its weights. One H100 has 80 GB. The model does not fit.
2. Decode is memory-bound ([L3: Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)). Each decode step reads every weight. Fewer bytes per weight means a faster step.

So the question is: **can we store each weight in 8 or 4 bits instead of 16, and keep the model's quality?**

That is **quantization**. It maps each real number to a small integer code plus a shared scale factor. The idea is old. The hard part in LLMs is a few very large values (outliers) that break simple schemes. This lesson builds the formulas from zero and shows why outliers matter. Then it explains the methods an interviewer will name: per-channel and per-group scales, weight-only versus W8A8, SmoothQuant, GPTQ, AWQ, FP8 and FP4.

## 2. Mental model

> [!analogy] A ruler with only 16 marks
> You must record lengths with a ruler that has only 16 marks. You may choose where the ruler starts and how far apart the marks are. That choice is the **scale** (and the **zero-point**). Each length is recorded as "the nearest mark", a number from 0 to 15. To read a length back, multiply the mark number by the spacing. If all lengths are between 0 and 3 cm, put the marks 0.2 cm apart, and the error is small. If one length is 300 cm, the marks must be 20 cm apart, and every small length rounds to mark 0.
>
> The fix is to use **several rulers**: one per row of a table, or one per group of 128 numbers. Each ruler fits its own numbers.
>
> **Where it stops working:** for weights, you know every number in advance and can choose the rulers carefully. Activations change with every input, so their ruler must be chosen on the fly or from samples. And not every number matters equally: an error in a weight that meets a large activation hurts the output much more. Good methods (GPTQ, AWQ) use that fact.

## 3. Terms

| Term | Plain meaning |
|---|---|
| quantization | Storing numbers as low-bit codes plus a scale, to save memory and bandwidth. |
| dequantization | Turning the codes back into real numbers: code times scale (minus a zero-point). |
| scale $s$ | The real-number size of one step between two neighboring codes. |
| zero-point $z$ | The integer code that represents the real value 0 in asymmetric quantization. |
| symmetric (absmax) quantization | Codes centered on 0, scale from the largest absolute value. |
| asymmetric (zero-point) quantization | Codes cover the range from the minimum to the maximum, with a zero-point. |
| granularity | How many numbers share one scale: per-tensor, per-channel, per-group, per-token, per-block. |
| outlier | A value much larger than the others. It forces a large scale on its whole group. |
| weight-only quantization (W4A16, W8A16) | Weights in low bits, activations in 16 bits. The kernel dequantizes weights before the multiply. |
| weight and activation quantization (W8A8) | Both inputs of the matrix multiply in 8 bits, so the GPU can use INT8 or FP8 Tensor Cores. |
| calibration data | A small set of example inputs used to measure activations when choosing scales. |
| post-training quantization (PTQ) | Quantizing a trained model without further training. GPTQ, AWQ and SmoothQuant are PTQ. |
| quantization-aware training (QAT) | Training with quantization in the loop, so the model learns to tolerate it. |
| GPTQ | A PTQ method that quantizes weights one column at a time and corrects the remaining weights to cancel the error. |
| AWQ | Activation-aware weight quantization: scale up the weights that meet large activations before rounding. |
| SmoothQuant | Moves outlier difficulty from activations to weights with a per-channel rescaling, enabling W8A8. |
| FP8 (E4M3, E5M2) | 8-bit floating-point formats with 4 or 5 exponent bits. |
| NVFP4, MXFP4 | 4-bit floating-point formats (E2M1) with a shared scale per block of 16 or 32 values. |
| safetensors | A file format for tensors: a JSON header plus raw bytes, with no executable code. |
| GGUF | The single-file model format of llama.cpp, with metadata and block-quantized tensors. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. The formats you choose from

[L4: Numbers in memory](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) explains bits, integers and floating point. Here is the short version for quantization. The FP8 and BF16 limits are the values of `torch.finfo` in PyTorch 2.14 (measured in these notes).

| Format | Bits | Distinct values | Largest magnitude | Notes |
|---|---|---|---|---|
| BF16 | 16 | 65,536 | about $3.39 \times 10^{38}$ | The normal inference format. |
| FP8 E4M3 (`float8_e4m3fn`) | 8 | 256 bit patterns | 448 | More precision, less range. Used for weights and activations. |
| FP8 E5M2 | 8 | 256 bit patterns | 57,344 | More range, less precision. |
| INT8 | 8 | 256 | 127 (range −128 to 127) | Needs a scale. |
| FP4 E2M1 | 4 | 16 bit patterns | 6 | Magnitudes 0, 0.5, 1, 1.5, 2, 3, 4, 6. Needs a block scale. |
| INT4 | 4 | 16 | 7 (range −8 to 7) | Needs a scale. Unsigned UINT4 is 0 to 15. |

The FP4 magnitudes follow from the bit layout: 1 sign bit, 2 exponent bits, 1 mantissa bit. Exponent code 0 gives the subnormals 0 and 0.5. Codes 1, 2, 3 give $\{1, 1.5\}$, $\{2, 3\}$, $\{4, 6\}$ (derived in these notes).

> [!key] Integer codes have equal steps, floating-point codes do not
> INT8 and INT4 codes are evenly spaced. FP8 and FP4 codes are dense near 0 and sparse far away. Neural network weights cluster near 0 with a few large values, so floating-point codes often fit them better at the same bit count.

## 5. The two basic formulas

### 5.1 Symmetric (absmax) quantization

Choose the scale so that the largest absolute value maps to the largest code $q_{max} = 2^{b-1} - 1$ (127 for 8 bits, 7 for 4 bits):

$$
s = \frac{\max_i \lvert x_i \rvert}{q_{max}}, \qquad q_i = \mathrm{clamp}\left(\mathrm{round}\left(\frac{x_i}{s}\right), -q_{max}, q_{max}\right), \qquad \hat{x}_i = s \cdot q_i
$$

This is Equation 1 of the SmoothQuant paper with $N = 8$: $\Delta = \max(\lvert X \rvert) / (2^{N-1} - 1)$. Some papers divide by $2^{N-1}$ instead (AWQ writes $\Delta = \max(\lvert w \rvert)/2^{N-1}$). The idea is the same.

> [!example] Worked example: INT8 absmax
> $x = [0.52, -1.30, 3.10, 0.02, -2.60, 0.95]$.
>
> 1. $\max \lvert x \rvert = 3.10$, so $s = 3.10 / 127 \approx 0.024409$.
> 2. $x / s = [21.30, -53.26, 127, 0.82, -106.52, 38.92]$, rounded: $q = [21, -53, 127, 1, -107, 39]$.
> 3. $\hat{x} = q \cdot s = [0.5126, -1.2937, 3.1000, 0.0244, -2.6118, 0.9520]$.
> 4. Errors: $[0.0074, -0.0063, 0, -0.0044, 0.0118, -0.0020]$. The largest is $0.0118$, below the bound $s/2 \approx 0.0122$.
>
> Storage: 6 bytes of codes plus one scale, instead of 12 bytes in BF16.

Rounding to the nearest code makes each error at most $s/2$. So the error of every number in a group depends on the **largest** number in that group. That single fact explains most of quantization research.

### 5.2 Asymmetric (zero-point) quantization

Activations after some functions are mostly positive, so a symmetric range wastes half the codes. Asymmetric quantization maps $[\min x, \max x]$ to $[0, 2^b - 1]$:

$$
s = \frac{\max x - \min x}{2^b - 1}, \qquad z = \mathrm{round}\left(\frac{-\min x}{s}\right), \qquad q_i = \mathrm{clamp}\left(\mathrm{round}\left(\frac{x_i}{s}\right) + z, 0, 2^b - 1\right), \qquad \hat{x}_i = s\,(q_i - z)
$$

> [!example] Worked example: the same data in 4 bits, two ways
> $x = [-0.40, 0.10, 0.90, 1.50, 2.40, 3.10]$.
>
> **Symmetric INT4:** $s = 3.10 / 7 \approx 0.4429$. Codes $[-1, 0, 2, 3, 5, 7]$. Values back: $[-0.443, 0, 0.886, 1.329, 2.214, 3.100]$. Mean squared error 0.01265.
>
> **Asymmetric UINT4:** $s = (3.10 - (-0.40)) / 15 \approx 0.2333$. $z = \mathrm{round}(0.40 / 0.2333) = \mathrm{round}(1.714) = 2$. Codes $[0, 2, 6, 8, 12, 15]$. Values back: $[-0.467, 0, 0.933, 1.400, 2.333, 3.033]$. Mean squared error 0.00574.
>
> The asymmetric version has steps half as large, because it does not reserve codes for negative values down to −3.10 that never occur. The error is less than half.

The code that produced these numbers:

```python
import numpy as np

def absmax_quant(x, bits):
    qmax = 2 ** (bits - 1) - 1                 # 127 for INT8, 7 for INT4
    scale = np.abs(x).max() / qmax
    q = np.clip(np.round(x / scale), -qmax, qmax).astype(np.int32)
    return q, scale

def zero_point_quant(x, bits):
    qmax = 2 ** bits - 1                       # 255 for UINT8, 15 for UINT4
    scale = (x.max() - x.min()) / qmax
    zero = int(np.round(-x.min() / scale))
    q = np.clip(np.round(x / scale) + zero, 0, qmax).astype(np.int32)
    return q, scale, zero

x = np.array([-0.40, 0.10, 0.90, 1.50, 2.40, 3.10])

q, s = absmax_quant(x, bits=4)
x_hat = q * s
print("absmax INT4  scale", round(s, 4), "q", q, "x_hat", np.round(x_hat, 3),
      "MSE", round(float(np.mean((x - x_hat) ** 2)), 5))

q, s, z = zero_point_quant(x, bits=4)
x_hat = (q - z) * s
print("zero-pt UINT4 scale", round(s, 4), "zero", z, "q", q, "x_hat", np.round(x_hat, 3),
      "MSE", round(float(np.mean((x - x_hat) ** 2)), 5))
```

Output (measured in these notes):

```text
absmax INT4  scale 0.4429 q [-1  0  2  3  5  7] x_hat [-0.443  0.     0.886  1.329  2.214  3.1  ] MSE 0.01265
zero-pt UINT4 scale 0.2333 zero 2 q [ 0  2  6  8 12 15] x_hat [-0.467  0.     0.933  1.4    2.333  3.033] MSE 0.00574
```

The important lines: `np.clip(np.round(x / scale), ...)` is the whole quantizer. `q * s` and `(q - z) * s` are the dequantizers. The cost of asymmetric codes is one more stored number per group ($z$) and one more subtraction in the kernel.

## 6. Granularity: how many numbers share a scale

### 6.1 The four common choices

A weight matrix $W$ of a linear layer $y = xW$ has shape $[d_{in}, d_{out}]$. In the PyTorch storage of [L2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) each row of the stored weight is one **output channel**. The choices:

1. **Per-tensor**: one scale for the whole matrix.
2. **Per-channel**: one scale per output channel.
3. **Per-group**: one scale per group of $g$ consecutive weights inside an output channel, for example $g = 128$. The GPTQ paper defines grouping as "applying independent quantization to groups of g consecutive weights". The AWQ paper states: "We used a group size of 128 throughout the work."
4. **Per-token** (activations): one scale per row of the activation matrix, that is, per token.

![Alt text: three weight grids with one red outlier cell, scaled per tensor, per row and per group, with the measured errors below](/notes/media/llm-systems/figures/04-7-quantization-granularity.svg)

### 6.2 Measure it

```python
import numpy as np

def quant_dequant(w, bits=4):
    """Symmetric absmax quantization of one block, then back to floats."""
    qmax = 2 ** (bits - 1) - 1
    scale = np.abs(w).max() / qmax
    return np.clip(np.round(w / scale), -qmax, qmax) * scale

rng = np.random.default_rng(0)
W = rng.normal(0, 0.02, size=(8, 256))   # 8 output channels x 256 inputs
W[3, 17] = 0.5                             # one outlier weight

per_tensor = quant_dequant(W)
per_channel = np.vstack([quant_dequant(row) for row in W])
per_group = np.vstack([np.concatenate([quant_dequant(row[g:g + 64])
                                       for g in range(0, 256, 64)]) for row in W])

for name, W_hat in [("per-tensor", per_tensor), ("per-channel", per_channel),
                    ("per-group 64", per_group)]:
    err = np.mean((W - W_hat) ** 2)
    zeros = np.mean(W_hat == 0)
    print(f"{name:13s} MSE {err:.2e}   weights rounded to 0: {zeros:.0%}")
```

Output (measured in these notes):

```text
per-tensor    MSE 3.17e-04   weights rounded to 0: 93%
per-channel   MSE 3.70e-05   weights rounded to 0: 26%
per-group 64  MSE 1.24e-05   weights rounded to 0: 17%
```

With one scale for the whole matrix, the single outlier of 0.5 sets $s = 0.5/7 \approx 0.071$. Typical weights of size 0.02 are below $s/2$, so 93% of them become 0. The layer is destroyed. Per-channel scales confine the damage to one row. Per-group scales confine it to 64 weights.

### 6.3 The price of small groups

Each scale is stored too. With 4-bit codes and one FP16 scale per group of $g$ weights:

$$
\text{bits per weight} = 4 + \frac{16}{g}
$$

| Scheme | Bits per weight | Source |
|---|---|---|
| INT4, FP16 scale per 128 | $4 + 16/128 = 4.125$ | computed in these notes |
| INT4, FP16 scale and 4-bit zero per 128 | $4 + 20/128 = 4.156$ | computed in these notes |
| GGUF Q4_0: 32 weights, one FP16 scale | $4 + 16/32 = 4.5$ | computed from the block layout |
| GGUF Q4_K | 4.5 | Hugging Face GGUF docs |
| MXFP4: 32 values, one 8-bit power-of-two scale | $4 + 8/32 = 4.25$ | computed in these notes |
| NVFP4: 16 values, one FP8 E4M3 scale | 4.5 ("4.5 bits per value") | NVIDIA blog, June 2025 |

The GPTQ paper puts numbers on this trade-off for 175B models: "group-size 1024 (≈ 0.02 extra bits)" and "group-size 128 (≈ 0.15 extra bits)", each with a further drop in perplexity.

## 7. Weight-only versus weights and activations

### 7.1 Two different goals

| | Weight-only (W4A16, W8A16) | Weights and activations (W8A8: INT8 or FP8) |
|---|---|---|
| What is low-bit | Weights only | Both inputs of the matrix multiply |
| How the multiply runs | The kernel dequantizes weights to BF16 in fast on-chip memory, then multiplies in BF16 | The Tensor Cores multiply 8-bit by 8-bit directly |
| What it accelerates | Memory-bound work: decode at small batch | Compute-bound work too: prefill and large-batch decode |
| Typical methods | GPTQ, AWQ, GGUF quants | SmoothQuant INT8, FP8 W8A8 |
| H100 peak math | BF16: about 989 TFLOPS dense | FP8 and INT8: 3,958 with sparsity in the datasheet, so about 1,979 dense |

The H100 datasheet lists "3,958 teraFLOPS" for FP8 and "1,979 teraFLOPS" for BF16, both "with sparsity" (checked on 2026-10-15). Dense numbers are half. So W8A8 doubles the peak arithmetic rate, while W4A16 does not change it at all.

### 7.2 Why scales must sit on the outside of the sum

A matrix multiply computes $Y_{ij} = \sum_k X_{ik} W_{kj}$. Here $i$ is a token, $k$ an input channel, $j$ an output channel. Quantize $X$ with one scale per token, $s^x_i$, and $W$ with one scale per output channel, $s^w_j$:

$$
Y_{ij} \approx \sum_k (s^x_i\, X^q_{ik})(s^w_j\, W^q_{kj}) = s^x_i\, s^w_j \sum_k X^q_{ik} W^q_{kj}
$$

Both scales leave the sum. The GPU computes the integer sum $\sum_k X^q_{ik} W^q_{kj}$ with fast 8-bit Tensor Cores and multiplies by two numbers at the end.

Now try a scale per **input** channel $k$ for the activations, $s^x_k$. It sits inside the sum: $\sum_k s^x_k X^q_{ik} W_{kj}$. The integer matrix multiply cannot apply a different factor to each term. So per-input-channel activation scales do not work with fast kernels.

> [!key] The outlier problem of W8A8
> LLM activations have outliers in a few fixed **input channels**. SmoothQuant states that "The scale of outliers in activations is ∼ 100× larger than most of the activation values" and that "Outliers persist in fixed channels." Per-token scales cannot isolate a channel, and per-channel activation scales do not fit the kernel. So the outlier channel ruins the activation scale of every token.

### 7.3 SmoothQuant: move the difficulty into the weights

SmoothQuant (Xiao et al., arXiv 2211.10438) uses an exact rewrite. For any positive vector $s$ over input channels:

$$
Y = X W = (X\, \mathrm{diag}(s)^{-1}) \cdot (\mathrm{diag}(s)\, W) = \hat{X} \hat{W}
$$

Dividing input channel $j$ of $X$ by $s_j$ and multiplying row $j$ of $W$ by $s_j$ changes nothing in exact arithmetic. Choose (Equation 4 of the paper):

$$
s_j = \frac{\max(\lvert X_j \rvert)^{\alpha}}{\max(\lvert W_j \rvert)^{1 - \alpha}}
$$

$\alpha$ is the migration strength. The paper says "α = 0.5 is a well-balanced point to evenly split the quantization difficulty" for OPT and BLOOM, uses 0.75 for GLM-130B, and 0.6 to 0.9 for other families. The division by $s$ can be folded into the previous layer (for example a normalization), so it costs nothing at runtime.

```python
import numpy as np

def q8(t):
    """Per-tensor symmetric INT8 quantize then dequantize."""
    s = np.abs(t).max() / 127
    return np.clip(np.round(t / s), -127, 127) * s

rng = np.random.default_rng(0)
X = rng.normal(0, 1, size=(16, 4))          # 16 tokens, 4 input channels
X[:, 2] *= 60                               # channel 2 is an outlier channel
W = rng.normal(0, 0.1, size=(4, 3))         # 4 inputs -> 3 outputs
Y = X @ W

alpha = 0.5
s = np.abs(X).max(axis=0) ** alpha / np.abs(W).max(axis=1) ** (1 - alpha)
X_s, W_s = X / s, W * s[:, None]            # X diag(s)^-1 and diag(s) W

print("max |X_j| before:", np.round(np.abs(X).max(axis=0), 2))
print("max |X_j| after: ", np.round(np.abs(X_s).max(axis=0), 2))
print("same product:", np.allclose(X_s @ W_s, Y))
for name, (a, b) in {"plain W8A8   ": (X, W), "smoothed W8A8": (X_s, W_s)}.items():
    err = np.abs(q8(a) @ q8(b) - Y).mean() / np.abs(Y).mean()
    print(name, "relative output error", round(float(err), 4))
```

Output (measured in these notes):

```text
max |X_j| before: [  2.33   1.51 104.36   1.96]
max |X_j| after:  [0.61 0.58 3.24 0.6 ]
same product: True
plain W8A8    relative output error 0.0154
smoothed W8A8 relative output error 0.0071
```

The outlier channel drops from 104 to about 3. The product is unchanged. The W8A8 output error falls by more than half. The paper reports "up to 1.56x speedup and 2x memory reduction" with negligible accuracy loss.

## 8. Smarter weight quantization: GPTQ and AWQ

Round-to-nearest treats every weight as equally important. It is not. A weight that multiplies a large activation contributes more to the output. Both methods below use a small calibration set to measure that.

### 8.1 GPTQ: quantize one column, then repair the rest

GPTQ (Frantar et al., ICLR 2023, arXiv 2210.17323) minimizes the output error of each layer on calibration inputs $X$, not the weight error:

$$
\arg\min_{\hat{W}} \lVert W X - \hat{W} X \rVert_2^2
$$

The paper writes the layer as $WX$ with weights times inputs. For one output row, this loss has the Hessian $H = 2 X X^\top$ over the input dimension. The method extends Optimal Brain Quantization (OBQ). Quantize one weight $w_q$. Then update all weights not yet quantized (the set $F$) to absorb the error (Equation 2 of the paper):

$$
\delta_F = -\frac{w_q - \mathrm{quant}(w_q)}{[H_F^{-1}]_{qq}} \cdot (H_F^{-1})_{:,q}
$$

In words: if input channels $q$ and $r$ are correlated, an error in $w_q$ can be cancelled by a small change in $w_r$. $H^{-1}$ says how much.

GPTQ makes this fast enough for 175B models with three ideas from the paper:

1. **Same order for all rows.** Quantize the columns in one fixed order, so every row shares the same $H_F^{-1}$.
2. **Lazy batch updates.** Process "B = 128 columns at a time" and apply the big update only after each block.
3. **Cholesky reformulation.** Precompute what is needed from $H^{-1}$ with a Cholesky decomposition, plus mild dampening, for numerical stability.

```python
import numpy as np

def quantize(w, scale, qmax=7):
    return np.clip(np.round(w / scale), -qmax, qmax) * scale

def gptq_row(w, H, scale):
    """Quantize one weight row (one output channel) column by column.
    After each column, push its rounding error onto the columns not yet done."""
    w = w.copy()
    Hinv = np.linalg.inv(H)
    out = np.zeros_like(w)
    for i in range(len(w)):
        out[i] = quantize(w[i], scale)
        err = (w[i] - out[i]) / Hinv[i, i]
        w[i + 1:] -= err * Hinv[i, i + 1:]          # OBQ update of the rest
        Hinv = Hinv - np.outer(Hinv[:, i], Hinv[i, :]) / Hinv[i, i]  # remove column i
    return out

rng = np.random.default_rng(0)
d, n = 64, 512
A = rng.normal(size=(d, d)) / np.sqrt(d)
X = rng.normal(size=(n, d)) @ A                 # correlated calibration inputs
H = 2 * X.T @ X + 1e-2 * np.eye(d)              # Hessian of the layer loss, with damping
W = rng.normal(0, 0.05, size=(4, d))            # 4 output channels (rows)

scales = np.abs(W).max(axis=1) / 7              # INT4, per output channel
W_rtn = np.vstack([quantize(W[r], scales[r]) for r in range(4)])
W_gptq = np.vstack([gptq_row(W[r], H, scales[r]) for r in range(4)])

for name, Wq in [("round to nearest", W_rtn), ("GPTQ", W_gptq)]:
    loss = np.sum((X @ W.T - X @ Wq.T) ** 2)    # ||W X - W_hat X||^2 on the calibration set
    print(f"{name:17s} output error {loss:9.2f}")
```

Output (measured in these notes):

```text
round to nearest  output error      2.95
GPTQ              output error      1.60
```

Same codes, same scales, same 4 bits: the output error falls by about 46% because later columns cancel earlier rounding errors. The important lines: `Hinv[i, i + 1:]` holds how the remaining columns can compensate column `i`. The `np.outer` line removes column `i` from the inverse Hessian (one step of Gaussian elimination). The damping term `1e-2 * np.eye(d)` keeps $H$ invertible.

Reported in the abstract (paraphrased): GPTQ quantizes 175-billion-parameter models in about four GPU hours. It reaches 3 or 4 bits per weight with negligible accuracy loss. End-to-end speedups over FP16 are about 3.25x on A100 and 4.5x on A6000.

### 8.2 AWQ: protect the salient channels by scaling them

AWQ (Lin et al., arXiv 2306.00978, MLSys 2024 Best Paper) starts from an observation. Keeping only 0.1% to 1% of weight channels in FP16 recovers most of the quality. The condition: choose the channels by activation magnitude, not by weight magnitude. Mixed precision is slow on hardware, so AWQ protects those channels in a different way: it scales them.

Multiply a salient weight $w$ by $s > 1$ and divide its input $x$ by $s$. The product $wx$ is unchanged. The paper's error analysis: the rounding error of $Q(w \cdot s) \cdot x / s$ relative to $Q(w) \cdot x$ has the ratio

$$
\frac{\Delta'}{\Delta} \cdot \frac{1}{s}
$$

If scaling one channel barely changes the group's maximum ($\Delta' \approx \Delta$), the error on that channel shrinks by about $1/s$. AWQ searches the scales as $s = s_X^{\alpha}$, where $s_X$ is the average activation magnitude per channel, with "a grid size of 20" for $\alpha$ in $[0, 1]$. No backpropagation, no reconstruction. The paper uses INT4 and INT3 with group size 128.

### 8.3 Which to use

| | Round-to-nearest | GPTQ | AWQ | SmoothQuant | FP8 W8A8 |
|---|---|---|---|---|---|
| What it quantizes | Weights | Weights | Weights | Weights and activations | Weights and activations |
| Calibration data | No | Yes | Yes | Yes | Optional (dynamic activation scales need none) |
| Typical bits | 8 or 4 | 4 or 3 | 4 or 3 | 8 | 8 |
| Main gain | Memory | Memory, decode speed | Memory, decode speed | Prefill and large-batch speed | Speed and memory |

Interpretation of these notes: on H100-class GPUs, FP8 W8A8 is the first choice when the model fits. It is close to lossless and accelerates both phases. INT4 weight-only (GPTQ or AWQ) is the choice when memory is the limit, for example a 70B model on one GPU.

## 9. FP8 and FP4

### 9.1 FP8 on Hopper

An H100 has FP8 Tensor Cores. E4M3 (max 448) has more mantissa bits, so it suits weights and activations. E5M2 (max 57,344) has more range. Both need a scale, because the largest weight or activation must map near the format's maximum.

vLLM's online FP8 quantization changed recently. In vLLM 0.31.0, the plain `--quantization fp8` loads only checkpoints that are already FP8. For a BF16 checkpoint it raises: "The `fp8` quantization method no longer supports online quantization. Please use `--quantization fp8_per_tensor` instead." The docs describe the online schemes. `fp8_per_tensor` gives "FP8 E4M3 weights and activations, each with an fp32 per-tensor scale". `fp8_per_block` uses "fp32 scales per 128x128 block" for weights and per 1x128 block for activations. "Weights are converted during model loading and activations are dynamically scaled during each forward pass" (all checked on 2026-10-15).

### 9.2 FP4 on Blackwell: NVFP4 and MXFP4

Four bits leave only 8 magnitudes, so the block scale does most of the work.

| | MXFP4 (OCP microscaling) | NVFP4 (NVIDIA) |
|---|---|---|
| Element | E2M1 | E2M1 |
| Block size | 32 values | 16 values |
| Block scale | 8-bit power of two (E8M0) | FP8 E4M3 |
| Second scale | none | one FP32 scale per tensor |
| Bits per value | 4.25 (computed) | 4.5 (NVIDIA) |

The NVIDIA blog (June 24, 2025) states that NVFP4 "applies a fine-grained E4M3 scaling factor to each 16-value micro-block", uses "a second-level FP32 scalar applied per tensor", and reduces the memory footprint "by approximately 3.5x relative to FP16" and about 1.8x relative to FP8. It reports "1% or less accuracy degradation" on key language tasks for DeepSeek-R1-0528 when moving from FP8 to NVFP4. A power-of-two scale (MXFP4) can only double or halve. An E4M3 scale (NVFP4) can take values in between, so it fits each block more tightly.

> [!example] Worked example: one NVFP4 micro-block
> A block of 16 weights has largest magnitude 0.11.
>
> 1. Block scale: map 0.11 to the largest code 6: $0.11 / 6 \approx 0.018333$.
> 2. Store the scale in FP8 E4M3. The nearest E4M3 value is $0.017578125$.
> 3. Divide each weight by $0.017578125$ and round to the nearest of $\pm\{0, 0.5, 1, 1.5, 2, 3, 4, 6\}$. The largest weight gives $0.11 / 0.017578 \approx 6.26$, which rounds to 6.
> 4. Storage: 16 four-bit codes (8 bytes) plus 1 scale byte: $4 + 8/16 = 4.5$ bits per weight.
>
> Measured in these notes: the largest dequantization error in this block is about 0.0045.

```python
import numpy as np
import torch

E2M1 = np.array([0, 0.5, 1, 1.5, 2, 3, 4, 6])        # magnitudes an FP4 E2M1 value can take

def round_e2m1(v):
    """Round each value to the nearest signed E2M1 number."""
    idx = np.abs(np.abs(v)[:, None] - E2M1[None, :]).argmin(axis=1)
    return np.sign(v) * E2M1[idx]

rng = np.random.default_rng(1)
block = np.round(rng.normal(0, 0.03, 16), 4)          # one micro-block of 16 weights
block[5] = 0.11                                       # its largest value

scale = np.abs(block).max() / 6                       # map the block max to 6
scale_fp8 = float(torch.tensor(scale).to(torch.float8_e4m3fn).float())  # stored as FP8 E4M3
codes = round_e2m1(block / scale_fp8)                 # 16 four-bit codes
deq = codes * scale_fp8

print("scale", round(scale, 6), "-> as E4M3", scale_fp8)
print("codes", codes)
print("max abs error", round(float(np.abs(block - deq).max()), 4),
      "| bits per weight", 4 + 8 / 16)
```

Output (measured in these notes):

```text
scale 0.018333 -> as E4M3 0.017578125
codes [ 0.5  1.5  0.5 -2.   1.5  6.  -1.   1.   0.5  0.5  0.   1.  -1.5 -0.5
 -1.   1. ]
max abs error 0.0045 | bits per weight 4.5
```

### 9.3 Quantizing the KV cache

The same ideas apply to the KV cache, which is often larger than the weights at long context ([L3: The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)). FP8 halves it. In vLLM it is `--kv-cache-dtype` (default `auto`, the model's type). The 0.31.0 choices include `fp8` (an alias of `fp8_e4m3`), `fp8_e5m2`, per-token-head INT8, INT4 and FP8 variants, and NVFP4 (checked on 2026-10-15). Details, KIVI and other methods: [L6: Shrinking the KV cache](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache).

## 10. What quantization buys: memory, speed, quality

### 10.1 Memory and decode time

Computed in these notes. Parameter counts: Llama-3.1-8B about 8.03B, Llama-3.1-70B about 70.55B (from the model configs and the Llama 3 paper, Table 3). Many quantized checkpoints keep the embedding table and the LM head in BF16, so the table shows that case. Decode time is the ideal batch-1 weight read at 3.35 TB/s on one H100.

| Format | 8B weights | 8B decode step | 70B weights | 70B decode step |
|---|---|---|---|---|
| BF16 | about 16.1 GB | about 4.8 ms | about 141 GB | needs 2 or more GPUs |
| FP8 (embeddings in BF16) | about 9.1 GB | about 2.7 ms | about 72.7 GB | about 21.7 ms, but no room for a KV cache on 80 GB |
| INT4, group 128 (embeddings in BF16) | about 5.7 GB | about 1.7 ms | about 39.5 GB | about 11.8 ms |
| NVFP4 (embeddings in BF16) | about 6.0 GB | about 1.8 ms | about 42.7 GB | about 12.8 ms |

Three lessons from the table:

1. The decode speedup follows the byte count, because decode is memory-bound. INT4 is about 2.8 times faster than BF16 for the 8B model in this ideal model, not 4 times, because the BF16 embeddings stay.
2. Llama-3.1-70B in INT4 fits on one 80 GB GPU with about 40 GB left for the KV cache, activations and other overhead. In BF16 it needs tensor parallelism ([L8: Parallelism](/notes/ai/llm-systems/04-inference/l8-parallelism)).
3. Weight-only INT4 does not accelerate prefill, which is compute-bound. The kernel must also dequantize, so a large-batch prefill can even be slower than BF16 (interpretation of these notes).

### 10.2 Quality

There is no universal number. The sources state:

- GPTQ: 3 or 4 bits with negligible accuracy loss compared with the uncompressed baseline, on 175B models (abstract, paraphrased).
- SmoothQuant: W8A8 with negligible accuracy loss across OPT, BLOOM, GLM, Llama and other families (abstract, paraphrased).
- NVFP4: 1% or less degradation for DeepSeek-R1-0528 from FP8.

Interpretation of these notes: larger models tolerate quantization better than small ones. 8-bit is close to lossless for most models. 4-bit needs a good method (GPTQ, AWQ, NVFP4 with calibration) and an evaluation on **your** task. Perplexity can hide failures in long reasoning, code or rare languages.

## 11. File formats

### 11.1 safetensors

The safetensors README defines the format: "8 bytes: `N`, an unsigned little-endian 64-bit integer, containing the size of the header". Then "N bytes: a JSON UTF-8 string representing the header". Each tensor entry has `dtype`, `shape` and `data_offsets`, which "point to the tensor data relative to the beginning of the byte buffer". The rest of the file is the byte buffer. The motivation: PyTorch's default `pickle` format is "Unsafe, runs arbitrary code". A safetensors file holds only JSON and raw bytes, so loading it cannot run code. The header is limited to 100MB.

The next program writes a safetensors file by hand from the spec, then reads the header back:

```python
import json, struct
import numpy as np

def save(path, tensors):
    header, offset, blobs = {}, 0, []
    for name, t in tensors.items():
        raw = np.ascontiguousarray(t).tobytes()
        header[name] = {"dtype": {"float32": "F32", "int32": "I32"}[str(t.dtype)],
                        "shape": list(t.shape), "data_offsets": [offset, offset + len(raw)]}
        blobs.append(raw)
        offset += len(raw)
    h = json.dumps(header).encode("utf-8")
    with open(path, "wb") as f:
        f.write(struct.pack("<Q", len(h)))   # 8 bytes: little-endian unsigned 64-bit header size
        f.write(h)                           # the JSON header
        f.write(b"".join(blobs))             # the raw tensor bytes, no Python code anywhere

def read_header(path):
    with open(path, "rb") as f:
        n = struct.unpack("<Q", f.read(8))[0]
        return n, json.loads(f.read(n))

save("tiny.safetensors", {"layer0.weight": np.ones((2, 3), np.float32),
                          "layer0.qweight": np.arange(4, dtype=np.int32)})
n, header = read_header("tiny.safetensors")
print("header bytes:", n)
print(header)
```

Output (measured in these notes):

```text
header bytes: 153
{'layer0.weight': {'dtype': 'F32', 'shape': [2, 3], 'data_offsets': [0, 24]}, 'layer0.qweight': {'dtype': 'I32', 'shape': [4], 'data_offsets': [24, 40]}}
```

The official `safetensors` Python library loads this hand-made file correctly (tested in these notes). The offsets show the layout: 6 float32 values take bytes 0 to 24 of the buffer, and 4 int32 values take bytes 24 to 40.

### 11.2 GPTQ and AWQ checkpoints

A GPTQ or AWQ checkpoint is usually a set of safetensors files. Each quantized linear layer stores packed integer weights `qweight`, packed zero-points `qzeros` and the `scales` (names from the vLLM 0.31.0 loaders, checked on 2026-10-15). The `quantization_config` in `config.json` says how to read them. vLLM's GPTQ parser reads `bits`, `group_size`, `desc_act` and `sym`. Its AWQ parser reads `w_bit` or `bits`, `q_group_size` or `group_size`, and `zero_point`.

"Packed" means several 4-bit codes share one 32-bit integer:

```python
import numpy as np

def pack_int4(q):
    """Pack 8 unsigned 4-bit values (0..15) into one uint32, lowest nibble first."""
    q = q.astype(np.uint32).reshape(-1, 8)
    shifts = np.arange(8, dtype=np.uint32) * 4          # 0, 4, 8, ..., 28
    return np.bitwise_or.reduce(q << shifts, axis=1)

def unpack_int4(packed):
    shifts = np.arange(8, dtype=np.uint32) * 4
    return ((packed[:, None] >> shifts) & 0xF).reshape(-1)

q = np.array([3, 15, 0, 7, 8, 1, 12, 5, 9, 9, 2, 14, 6, 0, 11, 4])
packed = pack_int4(q)
print([hex(v) for v in packed])
print("round trip ok:", np.array_equal(unpack_int4(packed), q))
print("bytes: int32 per value", q.size * 4, "-> packed", packed.nbytes)
```

Output (measured in these notes):

```text
['0x5c1870f3', '0x4b06e299']
round trip ok: True
bytes: int32 per value 64 -> packed 8
```

Read the first hex word from the right. The lowest 4 bits `3` hold the first code. The next nibbles hold `f` = 15, `0`, `7`, `8`, `1`, `c` = 12 and `5`. Real formats differ in the order of the nibbles. vLLM notes that "AWQ packs qweight along the output dim with a non-standard bit order" and converts it at load time.

Newer checkpoints for vLLM often use the **compressed-tensors** format of the LLM Compressor project, and NVIDIA's Model Optimizer produces FP8 and NVFP4 checkpoints. vLLM 0.31.0 lists `compressed-tensors`, `modelopt` and `modelopt_fp4` among its quantization methods (checked on 2026-10-15).

### 11.3 GGUF

GGUF is the format of llama.cpp and the tools built on it, such as Ollama. The Hugging Face docs describe it as "a binary format that is optimized for quick loading and saving of models", and unlike tensor-only formats, "GGUF encodes both the tensors and a standardized set of metadata" (tokenizer, architecture, chat template). Its quantization types are block formats (Hugging Face docs, checked on 2026-10-15):

| Type | Definition from the docs |
|---|---|
| Q8_0 | 8-bit round-to-nearest, blocks of 32 weights, `w = q * block_scale`. Legacy. |
| Q4_0 | 4-bit round-to-nearest, blocks of 32 weights, `w = q * block_scale`. Legacy. |
| Q4_K | 4-bit, super-blocks of 8 blocks of 32 weights, 6-bit block scales and minimums, 4.5 bits per weight. |
| Q5_K | 5-bit, same structure, 5.5 bits per weight. |
| Q6_K | 6-bit, super-blocks of 16 blocks of 16 weights, 8-bit block scales, 6.5625 bits per weight. |
| Q2_K | 2-bit, super-blocks of 16 blocks of 16 weights, 4-bit block scales and minimums, 2.625 bits per weight. |

Names such as `Q4_K_M` in a file name mean a mix of K-types chosen per tensor (interpretation of these notes from the naming convention).

### 11.4 Exercises

Notebook: `C:\Users\ASohi\Downloads\AI\agent-harness-lab\llm-systems\l7-quantization.ipynb`.

1. **A per-group quantizer.** Write `quantize_groups(W, bits, group)` that returns codes and scales for symmetric quantization with groups along each row, and `dequantize(codes, scales, group)`.
   - Acceptance test: use the 8 × 256 matrix with one outlier of section 6.2. Group 64 at 4 bits gives an MSE of about $1.24 \times 10^{-5}$, and the codes stay in $[-7, 7]$.
   - Hint 1: reshape each row to `[n_groups, group]` and take the max over the last axis.
   - Hint 2: `np.repeat(scales, group, axis=-1)` expands the scales back.
2. **Bits per weight.** Write `bits_per_weight(code_bits, group, scale_bits, zero_bits=0)`.
   - Acceptance test: INT4 with FP16 scales and group 128 gives 4.125. NVFP4 (4-bit codes, 8-bit scale, group 16) gives 4.5. MXFP4 gives 4.25.
   - Hint 1: the overhead is the metadata bits divided by the group size.
   - Hint 2: zero-points are metadata too.
3. **Read a real header.** Download any small safetensors model file. Read only the first $8 + N$ bytes and print each tensor name, dtype and shape, without any library except `json` and `struct`.
   - Acceptance test: the listed shapes match the model's config (for example the embedding shape is vocabulary size by hidden size).
   - Hint 1: `struct.unpack("<Q", f.read(8))[0]` gives $N$.
   - Hint 2: skip the `__metadata__` key, which holds only strings.

## 12. Common mistakes

1. **"4-bit quantization makes everything 4 times faster."** It reduces weight bytes. That accelerates memory-bound decode, by less than 4 times if some tensors stay in 16 bits. It does not accelerate compute-bound prefill, because the multiply still runs in BF16.
2. **"One scale per tensor is fine."** One outlier then forces a huge step, and most weights round to 0. Use per-channel or per-group scales.
3. **"Quantize activations per input channel to handle outliers."** Those scales sit inside the sum of the matrix multiply, so fast integer kernels cannot use them. That is why SmoothQuant moves the outliers into the weights instead.
4. **"GPTQ just rounds each weight carefully."** It changes the not-yet-quantized weights to compensate the rounding error, using the inverse Hessian $H^{-1}$ with $H = 2XX^\top$ from calibration inputs.
5. **"AWQ keeps 1% of weights in FP16."** That was the observation. The method instead scales the salient channels up before rounding, so all weights stay in low bits.
6. **"FP8 E5M2 is better because it has more range."** For inference weights and activations, E4M3 is the usual choice because it has more precision. Scales handle the range.
7. **"`--quantization fp8` quantizes my BF16 model on the fly."** In vLLM 0.31.0 that raises an error. Use `fp8_per_tensor` or `fp8_per_block`, or load an FP8 checkpoint.
8. **"Loading a .bin checkpoint is as safe as loading safetensors."** A pickle file can run code at load time. Safetensors cannot.

## 13. One-minute explanation

Quantization stores each number as a small integer code plus a shared scale, $\hat{x} = s \cdot q$, with $s = \max \lvert x \rvert / 127$ for symmetric INT8, or a zero-point for asymmetric ranges. Each rounding error is at most half a step, so the largest value in a group sets the error of the whole group. That is why outliers matter, and why we use per-channel or per-group scales. One FP16 scale per 128 weights costs only 0.125 extra bits. Weight-only methods such as GPTQ and AWQ cut memory and accelerate memory-bound decode. GPTQ repairs rounding errors with second-order information from calibration data, and AWQ scales up the channels that meet large activations. W8A8 methods quantize activations too, so FP8 or INT8 Tensor Cores double the peak math. Activation outliers live in fixed channels, so SmoothQuant moves them into the weights with an exact rescaling. On Blackwell, NVFP4 uses 16-value blocks with an FP8 scale at 4.5 bits per value. For Llama-3.1-70B, INT4 shrinks 141 GB to about 40 GB, so it fits on one 80 GB GPU.

## 14. Check questions

```check
{
  "question": "Quantize $x = [0.9, -2.4, 1.3]$ to INT8 with absmax. Give the scale, the codes, the values back and the errors.",
  "hint": "$s = \\max\\lvert x \\rvert / 127$.",
  "answer": "1. $s = 2.4 / 127 \\approx 0.018898$.\n2. $x / s = [47.625, -127, 68.79]$, rounded: $q = [48, -127, 69]$.\n3. $\\hat{x} = q \\cdot s \\approx [0.9071, -2.4000, 1.3039]$.\n4. Errors: about $[-0.0071, 0, -0.0039]$, both below $s/2 \\approx 0.0094$."
}
```

```check
{
  "question": "Why does one outlier hurt a per-tensor INT4 scale so badly? Use the numbers of the granularity demo.",
  "answer": "Rounding error is at most half a step, and the step is set by the largest value. With an outlier of 0.5, the INT4 step is $0.5/7 \\approx 0.071$. Typical weights of about 0.02 are below half a step (0.036), so they all round to 0. The demo measured 93% of weights rounded to 0 and an MSE of $3.17 \\times 10^{-4}$. Per-channel scales gave $3.70 \\times 10^{-5}$ and per-group-64 scales $1.24 \\times 10^{-5}$, because the outlier then sets the step only for its own row or group."
}
```

```check
{
  "question": "Interview follow-up: in a W8A8 matrix multiply, why can the activation scale be per token but not per input channel? Derive it.",
  "hint": "Write $Y_{ij} = \\sum_k X_{ik} W_{kj}$ and place each scale.",
  "answer": "$Y_{ij} = \\sum_k X_{ik} W_{kj}$, with $i$ a token, $k$ an input channel and $j$ an output channel.\n\nPer-token activation scale $s^x_i$ and per-output-channel weight scale $s^w_j$: $Y_{ij} \\approx \\sum_k s^x_i X^q_{ik}\\, s^w_j W^q_{kj} = s^x_i s^w_j \\sum_k X^q_{ik} W^q_{kj}$. Both scales leave the sum, so the GPU runs a pure INT8 or FP8 matrix multiply and rescales the result.\n\nPer-input-channel scale $s^x_k$: $\\sum_k s^x_k X^q_{ik} W^q_{kj}$. The factor depends on $k$, the summation index, so it cannot leave the sum. The integer kernel would need a different multiplier inside every term. That is why LLM activation outliers, which sit in fixed input channels, are hard, and why SmoothQuant moves them into the weights."
}
```

```check
{
  "question": "Interview follow-up: SmoothQuant with $\\alpha = 0.5$. Input channel $j$ has $\\max\\lvert X_j \\rvert = 100$ and $\\max\\lvert W_j \\rvert = 0.04$. Compute $s_j$ and the new maxima. Why is the result exact?",
  "answer": "$s_j = 100^{0.5} / 0.04^{0.5} = 10 / 0.2 = 50$.\n\n- New activation max: $100 / 50 = 2$.\n- New weight max: $0.04 \\times 50 = 2$.\n\nWith $\\alpha = 0.5$ both become $\\sqrt{100 \\times 0.04} = 2$: the difficulty is split evenly. The result is exact because $X W = (X\\,\\mathrm{diag}(s)^{-1})(\\mathrm{diag}(s)\\,W)$. Dividing channel $j$ of the input by $s_j$ and multiplying row $j$ of the weight by $s_j$ cancel in every product $X_{ij} W_{jk}$. The division can be folded into the previous layer, so it is free at runtime."
}
```

```check
{
  "question": "Interview follow-up: explain GPTQ in three sentences, then say what the matrix $H$ is and why calibration data is needed.",
  "answer": "GPTQ quantizes a layer column by column in a fixed order. After it rounds column $q$, it updates every column not yet quantized by $\\delta_F = -\\frac{w_q - \\mathrm{quant}(w_q)}{[H_F^{-1}]_{qq}} (H_F^{-1})_{:,q}$, so correlated inputs cancel the rounding error. Lazy batches of 128 columns and a Cholesky form of $H^{-1}$ make it fast enough for 175B models.\n\n$H = 2XX^\\top$ is the Hessian of the layer's output error $\\lVert WX - \\hat{W}X \\rVert^2$ with respect to one weight row. $X$ holds the layer's inputs on calibration examples. Without data there is no $X$, so the method could not know which input directions matter and how input channels correlate."
}
```

```check
{
  "question": "Interview follow-up: a team switches a prefill-heavy batch job (long documents, short answers) from BF16 to INT4 weight-only and sees no speedup. Explain.",
  "answer": "Prefill processes thousands of tokens per forward pass, so it is compute-bound ([L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)). Weight-only INT4 reduces the bytes read, which helps only memory-bound work such as small-batch decode. The multiply still runs in BF16 after dequantization, so the FLOP rate does not change, and the dequantization adds work. For compute-bound work, use W8A8 (FP8 on H100), which runs on 8-bit Tensor Cores with about twice the peak FLOPs of BF16."
}
```

```check
{
  "question": "Interview follow-up: compare NVFP4 and MXFP4. Why does NVFP4 use an FP8 scale and a block of 16?",
  "answer": "Both store E2M1 elements: 8 magnitudes from 0 to 6. MXFP4 shares one 8-bit power-of-two scale (E8M0) across 32 values: $4 + 8/32 = 4.25$ bits. NVFP4 shares one FP8 E4M3 scale across 16 values, plus one FP32 scale per tensor: 4.5 bits per value (NVIDIA).\n\nA power-of-two scale can only double or halve, so the block maximum often lands far below 6 and codes are wasted. An E4M3 scale can take in-between values and fits each block tightly. A smaller block means one outlier spoils only 16 values, not 32. The per-tensor FP32 scale keeps the block scales inside the E4M3 range. NVIDIA reports 1% or less degradation for DeepSeek-R1-0528 going from FP8 to NVFP4."
}
```

```check
{
  "question": "Interview follow-up: can Llama-3.1-70B run on one H100 80 GB? Answer for BF16, FP8 and INT4, with the decode step time at batch 1.",
  "answer": "Parameters: about 70.55B. Computed in these notes, with embeddings and LM head kept in BF16:\n\n| Format | Weights | Ideal decode step at 3.35 TB/s |\n|---|---|---|\n| BF16 | about 141 GB | does not fit |\n| FP8 | about 72.7 GB | about 21.7 ms, but almost no memory is left for the KV cache |\n| INT4, group 128 | about 39.5 GB | about 11.8 ms, with about 40 GB left for KV cache and overhead |\n\nSo INT4 is the practical single-GPU option. FP8 needs two GPUs or an H200 141 GB. BF16 needs at least two 80 GB GPUs, in practice TP=4 for a useful KV cache ([L8](/notes/ai/llm-systems/04-inference/l8-parallelism))."
}
```

```check
{
  "question": "Why is safetensors safer than a PyTorch pickle checkpoint, and what are its first bytes?",
  "answer": "A pickle file can contain instructions that run arbitrary Python code when it is loaded. The safetensors README calls pickle \"Unsafe, runs arbitrary code\". A safetensors file holds only data. First come 8 bytes with the header size $N$, an unsigned little-endian 64-bit integer. Then $N$ bytes of JSON give each tensor's `dtype`, `shape` and `data_offsets`. Then the raw tensor bytes follow. Loading it parses JSON and copies bytes, so it cannot run code. The format also allows lazy, zero-copy loading of single tensors."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\nimport numpy as np\n\ndef quantize_groups(W, bits=4, group=64):\n    qmax = 2 ** (bits - 1) - 1\n    rows, cols = W.shape\n    Wg = W.reshape(rows, cols // group, group)              # [rows, n_groups, group]\n    scales = np.abs(Wg).max(axis=-1) / qmax                 # [rows, n_groups]\n    codes = np.clip(np.round(Wg / scales[..., None]), -qmax, qmax).astype(np.int8)\n    return codes.reshape(rows, cols), scales\n\ndef dequantize(codes, scales, group=64):\n    return codes * np.repeat(scales, group, axis=-1)\n\nrng = np.random.default_rng(0)\nW = rng.normal(0, 0.02, size=(8, 256))\nW[3, 17] = 0.5\ncodes, scales = quantize_groups(W, bits=4, group=64)\nW_hat = dequantize(codes, scales, group=64)\nprint(\"MSE\", f\"{np.mean((W - W_hat) ** 2):.2e}\", \"| codes in range:\", codes.min(), codes.max())\n```\n\nOutput: `MSE 1.24e-05 | codes in range: -7 7`."
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\ndef bits_per_weight(code_bits, group, scale_bits, zero_bits=0):\n    return code_bits + (scale_bits + zero_bits) / group\n\nprint(\"INT4 + FP16 scale, group 128:\", bits_per_weight(4, 128, 16))\nprint(\"NVFP4 (FP8 scale, group 16): \", bits_per_weight(4, 16, 8))\nprint(\"MXFP4 (E8M0 scale, group 32):\", bits_per_weight(4, 32, 8))\nprint(\"INT4 + FP16 scale + 4-bit zero, group 128:\", bits_per_weight(4, 128, 16, 4))\n```\n\nOutput:\n\n```text\nINT4 + FP16 scale, group 128: 4.125\nNVFP4 (FP8 scale, group 16):  4.5\nMXFP4 (E8M0 scale, group 32): 4.25\nINT4 + FP16 scale + 4-bit zero, group 128: 4.15625\n```"
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\nimport json, struct, sys\n\ndef list_tensors(path):\n    with open(path, \"rb\") as f:\n        n = struct.unpack(\"<Q\", f.read(8))[0]     # header length N\n        header = json.loads(f.read(n))            # read only the header, not the weights\n    for name, info in header.items():\n        if name == \"__metadata__\":\n            continue\n        print(f\"{name:40s} {info['dtype']:5s} {info['shape']}\")\n\nif __name__ == \"__main__\":\n    list_tensors(sys.argv[1])\n```\n\nRun it as `python list_tensors.py model.safetensors`. On the hand-made file of section 11.1 it prints:\n\n```text\nlayer0.weight                            F32   [2, 3]\nlayer0.qweight                           I32   [4]\n```\n\nIt reads only $8 + N$ bytes, so it is instant even for a 5 GB file."
}
```

## 15. Links

- Previous: [L6: Speculative decoding](/notes/ai/llm-systems/04-inference/l6-speculative-decoding)
- Next: [L8: Parallelism: tensor, pipeline, data and expert](/notes/ai/llm-systems/04-inference/l8-parallelism)
- Bits, bytes and floating point: [L4: Numbers in memory: FP32, BF16, FP8, INT4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory)
- Why fewer bytes accelerate decode: [L3: Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)
- KV cache quantization: [L6: Shrinking the KV cache](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache)
- GPU memory budgets in the cloud: [L2: Sizing GPUs for a model](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus)
- Supply-chain safety of model files: [L8: Production operations](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations)

### Sources

All checked on 2026-10-15.

- Frantar, Ashkboos, Hoefler, Alistarh. "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers." ICLR 2023. https://arxiv.org/abs/2210.17323
- Lin et al. "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration." MLSys 2024. https://arxiv.org/abs/2306.00978
- Xiao, Lin, Seznec, Wu, Demouth, Han. "SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models." https://arxiv.org/abs/2211.10438
- NVIDIA Technical Blog. "Introducing NVFP4 for Efficient and Accurate Low-Precision Inference." June 24, 2025. https://developer.nvidia.com/blog/introducing-nvfp4-for-efficient-and-accurate-low-precision-inference
- NVIDIA H100 datasheet page: https://www.nvidia.com/en-us/data-center/h100/
- Meta. "The Llama 3 Herd of Models," Table 3. https://arxiv.org/abs/2407.21783
- safetensors README: https://github.com/huggingface/safetensors
- Hugging Face Hub docs, GGUF: https://huggingface.co/docs/hub/gguf
- vLLM docs, Quantization and Online Quantization: https://docs.vllm.ai/en/latest/features/quantization/ and https://docs.vllm.ai/en/latest/features/quantization/online/
- vLLM 0.31.0 source (PyPI wheel): `vllm/model_executor/layers/quantization/__init__.py`, `fp8.py`, `auto_gptq.py`, `auto_awq.py`, `vllm/config/cache.py`
- PyTorch 2.14 `torch.finfo` for the FP8 and BF16 limits (measured in these notes)
