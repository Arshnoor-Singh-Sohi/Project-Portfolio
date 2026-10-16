---
title: "L4: Numbers in memory: FP32, BF16, FP8, INT4"
order: 4
summary: "Bits, bytes, KB versus KiB, integers and floating point from first principles. The bit layouts, ranges and precision of FP32, FP16, BF16, FP8 (E4M3 and E5M2) and FP4, integers with a scale factor, model size math (Llama-3.1-8B is about 16 GB in BF16), overflow, underflow and why BF16 is the default for LLM inference."
status: not-started
tags: [math, floating-point, bf16, fp8, int4, quantization, memory]
---

## 1. The question this idea answers

"How large is the KV cache?" "Why does an 8B model need about 16 GB?" "What does an FP8 KV cache change?" These interview questions share one hidden factor: **how many bytes does one number take?** The KV cache formula of [part 03](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) ends with a factor $s$, the bytes per element. Model size, GPU memory, bandwidth and speed all depend on it.

Fewer bytes per number means less memory and faster memory reads. But fewer bytes also means fewer representable values. Then large numbers can overflow, small numbers can vanish and every result gets rounded. This lesson explains how computers store numbers, bit by bit, so that you can reason about these trade-offs with exact numbers.

## 2. Mental model

> [!analogy] A calculator display with a fixed number of boxes
> A scientific calculator shows $6.02 \times 10^{23}$. It has a few boxes for the digits (6.02) and a few boxes for the power of ten (23). The power boxes decide the **range**: how large or how small a number can be. The digit boxes decide the **precision**: how many significant digits survive. A floating-point format is the same idea in base 2. FP32, BF16 and FP8 differ only in how many boxes they give to each part.
>
> **Where it stops working:** a computer uses base 2, so "0.1" has no exact binary form, the same way 1/3 has no exact decimal form. The first binary digit is always 1 for normal numbers, so the computer does not store it. And the gap between two neighboring values doubles at every power of 2. Precision is relative, not absolute.

## 3. Terms

| Term | Plain meaning |
|---|---|
| bit | One binary digit: 0 or 1. |
| byte | 8 bits. Memory addresses count bytes. |
| KB, MB, GB | Decimal units: $10^3$, $10^6$, $10^9$ bytes. |
| KiB, MiB, GiB | Binary units: $2^{10} = 1024$, $2^{20}$, $2^{30}$ bytes. |
| integer format (INT8, INT4) | A whole number stored in 8 or 4 bits. |
| two's complement | The usual way to store negative integers: the top bit has a negative place value. |
| floating-point format | A number stored as a sign, an exponent and a mantissa. |
| sign bit | The bit that says positive (0) or negative (1). |
| exponent and bias | The bits that store the power of 2. The stored value minus a fixed bias gives the real power. |
| mantissa (fraction) | The bits after the binary point of the significant digits. |
| normal and subnormal number | A normal number has a hidden leading 1. A subnormal number fills the gap near zero with a leading 0. |
| machine epsilon | The gap between 1 and the next larger representable number. It measures relative precision. |
| range | The span from the smallest to the largest representable magnitude. |
| overflow | A result too large for the format. It becomes infinity, NaN or the maximum value. |
| underflow | A result too small for the format. It becomes a subnormal number or zero. |
| NaN | "Not a number": the result of an undefined operation, such as $0/0$. |
| scale factor | A number that maps real values into the small range of a low-precision format and back. |
| quantization | Storing values in a format with fewer bits, usually with scale factors. |
| dtype | The name of a number format in code, for example `torch.bfloat16`. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. Bits and bytes

A **bit** is 0 or 1. A group of $n$ bits has $2^n$ patterns: 2 patterns for 1 bit, 16 for 4 bits, 256 for 8 bits. A **byte** is 8 bits. Memory hands out space in bytes, and every address names one byte.

In binary, each position is worth a power of 2, from right to left: 1, 2, 4, 8, 16, 32, 64, 128.

> [!example] Worked example: read one byte
> $01000001_2 = 0 \cdot 128 + 1 \cdot 64 + 0 \cdot 32 + 0 \cdot 16 + 0 \cdot 8 + 0 \cdot 4 + 0 \cdot 2 + 1 \cdot 1 = 65$
>
> The small 2 marks a binary number. One hexadecimal digit stands in for 4 bits, so this byte is `0x41` (4 = 0100, 1 = 0001).

## 5. KB versus KiB, GB versus GiB

Two unit systems exist, and LLM numbers use both. NIST lists the binary prefixes that the IEC approved in December 1998: kibi (Ki) $= 2^{10}$, mebi (Mi) $= 2^{20}$, gibi (Gi) $= 2^{30}$, tebi (Ti) $= 2^{40}$.

| Decimal unit | Bytes | Binary unit | Bytes | Ratio |
|---|---|---|---|---|
| 1 KB | 1,000 | 1 KiB | 1,024 | 1.024 |
| 1 MB | 1,000,000 | 1 MiB | 1,048,576 | 1.049 |
| 1 GB | 1,000,000,000 | 1 GiB | 1,073,741,824 | 1.074 |
| 1 TB | $10^{12}$ | 1 TiB | $2^{40} \approx 1.0995 \times 10^{12}$ | 1.100 |

> [!example] Worked example: the same quantity in both units
> - Llama-3.1-8B in BF16 holds $8{,}030{,}261{,}248 \times 2 = 16{,}060{,}522{,}496$ bytes: about 16.06 GB, or about 14.96 GiB.
> - Its KV cache per token is $131{,}072$ bytes: exactly 128 KiB, or about 131.1 KB.
> - A GPU sold as "80 GB" holds, if the number is decimal, $80 \times 10^9 / 2^{30} \approx 74.5$ GiB.

**The convention of this guide.** Sizes built from powers of 2 (KV cache blocks, per-token cache sizes, tensor sizes) use KiB, MiB and GiB. Model weights follow the habit of model cards and use GB. Bandwidth and FLOP/s are always decimal: 3.35 TB/s means $3.35 \times 10^{12}$ bytes per second. Each number in this guide says its unit. Check the unit of every tool and datasheet that you read.

## 6. Integers

An **unsigned** integer with $n$ bits stores $0$ to $2^n - 1$. A **signed** integer uses **two's complement**: the top bit has the place value $-2^{n-1}$ instead of $+2^{n-1}$. So:

| Format | Bits | Range |
|---|---|---|
| UINT8 | 8 | 0 to 255 |
| INT8 | 8 | −128 to 127 |
| INT4 | 4 | −8 to 7 |
| INT32 | 32 | −2,147,483,648 to 2,147,483,647 |

> [!example] Worked example: −3 in INT4 and the wrap-around
> - $-3$ in 4 bits is $1101_2$: $-8 + 4 + 0 + 1 = -3$.
> - In INT8 it is $11111101_2$: $-128 + 64 + 32 + 16 + 8 + 4 + 0 + 1 = -3$.
> - Integers do not saturate by default. In NumPy, `np.int8(127) + np.int8(1)` gives $-128$. The pattern $01111111$ plus 1 is $10000000$, which is $-128$.

Integers have equal spacing: the gap between neighbors is always 1. That is good for counting and bad for numbers that span many sizes. Neural network values span many sizes, so models compute in floating point and use integers only together with a scale factor (section 11).

## 7. Floating point from first principles

### 7.1 Scientific notation in base 2

Decimal scientific notation writes $6.5 = 6.5 \times 10^0$, with one nonzero digit before the point. Binary does the same with powers of 2. In binary, $6.5 = 110.1_2$ ($4 + 2 + 0.5$). Move the point two places to the left:

$$
6.5 = 1.101_2 \times 2^2
$$

The first digit of a nonzero binary number in this form is always 1. So the format does not store it: it is the **hidden bit**. A normal floating-point number is:

$$
x = (-1)^{s} \times (1.f)_2 \times 2^{\,e - \text{bias}}
$$

The symbols mean:

- $s$ is the sign bit: 0 for positive, 1 for negative.
- $f$ is the stored mantissa (fraction): the bits after the binary point.
- $e$ is the stored exponent field, read as an unsigned integer.
- bias is a fixed number per format, so that negative powers need no sign. It is 127 for FP32 and BF16, 15 for FP16 and 7 for FP8 E4M3.

### 7.2 Worked example: encode 6.5 in FP32

FP32 has 1 sign bit, 8 exponent bits and 23 mantissa bits, with bias 127.

> [!example] Worked example: 6.5 as FP32 bits
> 1. Sign: positive, so $s = 0$.
> 2. Binary: $6.5 = 1.101_2 \times 2^2$.
> 3. Exponent field: $e = 2 + 127 = 129 = 10000001_2$.
> 4. Mantissa: the bits after the point, $101$, then 20 zeros: $10100000000000000000000$.
> 5. All 32 bits: `0 10000001 10100000000000000000000`, which is `0x40D00000`.
>
> Decode to check: $(1 + 0.5 + 0.125) \times 2^{129 - 127} = 1.625 \times 4 = 6.5$. Python's `struct` module prints the same bits.

The same value in the other formats (computed with PyTorch 2.14 in these notes):

| Format | Bits of 6.5 | Stored value |
|---|---|---|
| FP32 | `0 10000001 10100000000000000000000` | 6.5 |
| BF16 | `0 10000001 1010000` | 6.5 |
| FP16 | `0 10001 1010000000` | 6.5 (exponent $2 + 15 = 17$) |
| FP8 E4M3 | `0 1001 101` | 6.5 (exponent $2 + 7 = 9$) |
| FP8 E5M2 | `0 10001 10` | 6.0 (only 2 mantissa bits: $1.10_2 \times 4 = 6$) |

Compare the BF16 row with the FP32 row: it is exactly the first 16 bits. Section 9 uses this fact.

### 7.3 Special values

The smallest and the largest exponent fields are reserved. FP32 and FP16 are IEEE 754 formats. BF16 and FP8 E5M2 follow the same conventions:

- **Exponent field all zeros:** zero (mantissa 0) or a **subnormal** number $(-1)^s \times (0.f)_2 \times 2^{1 - \text{bias}}$. Subnormals fill the gap between zero and the smallest normal number.
- **Exponent field all ones:** infinity (mantissa 0) or NaN (any other mantissa).

FP8 E4M3 breaks this rule on purpose. The FP8 paper (Micikevicius et al., 2022) says that E4M3 represents no infinities and uses only one mantissa pattern for NaN. That frees the top exponent for ordinary numbers and raises the maximum to 448 (section 8.2).

### 7.4 Precision: the gaps between numbers

With $m$ mantissa bits, there are $2^m$ evenly spaced values between two neighboring powers of 2. Between 1 and 2, the gap is $2^{-m}$: the **machine epsilon**. Between 256 and 512 the gap is $256 \times 2^{-m}$. The gap doubles at every power of 2.

> [!example] Worked example: 256 + 1 in BF16
> BF16 has $m = 7$, so between 256 and 512 the gap is $256 \times 2^{-7} = 2$. The neighbors of 257 are 256 and 258, and 257 is exactly halfway. Round-to-nearest-even picks 256 (its last mantissa bit is 0).
>
> So in BF16, $256 + 1 = 256$. PyTorch 2.14 confirms it: `torch.tensor(256., dtype=torch.bfloat16) + 1` gives 256. In FP16 ($m = 10$), the gap at 2048 is 2, so 2049 rounds to 2048.

The relative precision of a format is about $\log_{10}(2^{m+1})$ decimal digits. That is about 7.2 for FP32, 3.3 for FP16, 2.4 for BF16 and 1.2 for FP8 E4M3.

> [!example] Worked example: 0.1, 1/3 and pi in five formats (PyTorch 2.14, round to nearest)
> | Value | FP32 | FP16 | BF16 | FP8 E4M3 | FP8 E5M2 |
> |---|---|---|---|---|---|
> | 0.1 | 0.10000000149 | 0.0999755859 | 0.1000976563 | 0.1015625 | 0.09375 |
> | 1/3 | 0.3333333433 | 0.3332519531 | 0.3339843750 | 0.34375 | 0.3125 |
> | 3.14159265 | 3.1415927410 | 3.140625 | 3.140625 | 3.25 | 3.0 |
>
> BF16 keeps about 2 to 3 correct digits. FP8 keeps about 1.

## 8. The formats side by side

### 8.1 Bit layouts and limits

| Format | Sign, exponent, mantissa bits | Bias | Max | Min normal | Min subnormal | Epsilon |
|---|---|---|---|---|---|---|
| FP32 | 1, 8, 23 | 127 | $\approx 3.40 \times 10^{38}$ | $\approx 1.18 \times 10^{-38}$ | $2^{-149} \approx 1.4 \times 10^{-45}$ | $2^{-23} \approx 1.19 \times 10^{-7}$ |
| FP16 | 1, 5, 10 | 15 | 65,504 | $2^{-14} \approx 6.10 \times 10^{-5}$ | $2^{-24} \approx 5.96 \times 10^{-8}$ | $2^{-10} \approx 9.77 \times 10^{-4}$ |
| BF16 | 1, 8, 7 | 127 | $\approx 3.39 \times 10^{38}$ | $\approx 1.18 \times 10^{-38}$ | $2^{-133} \approx 9.2 \times 10^{-41}$ | $2^{-7} = 0.0078125$ |
| FP8 E4M3 | 1, 4, 3 | 7 | 448 | $2^{-6} = 0.015625$ | $2^{-9} \approx 0.00195$ | $2^{-3} = 0.125$ |
| FP8 E5M2 | 1, 5, 2 | 15 | 57,344 | $2^{-14} \approx 6.10 \times 10^{-5}$ | $2^{-16} \approx 1.53 \times 10^{-5}$ | $2^{-2} = 0.25$ |
| FP4 E2M1 | 1, 2, 1 | 1 | 6.0 | 1.0 | 0.5 | $2^{-1} = 0.5$ |

Sources: `torch.finfo` in PyTorch 2.14 gives max, min normal and epsilon of the first five rows. Table 1 of the FP8 paper confirms both FP8 rows. Table 5 of the OCP Microscaling Formats (MX) v1.0 specification gives FP4 E2M1. The minimum subnormals are $2^{1 - \text{bias} - m}$, computed in these notes.

![Alt text: the sign, exponent and mantissa fields of six formats, filled with the bits of 6.5 or its nearest value](/notes/media/llm-systems/figures/01-4-float-bit-layouts.svg)

### 8.2 The origin of the maximum values

> [!example] Worked example: derive three maxima
> - **FP16:** the largest normal exponent field is $11110_2 = 30$, so the power is $30 - 15 = 15$. The largest mantissa is all ones: $1.1111111111_2 = 2 - 2^{-10}$. Max $= (2 - 2^{-10}) \times 2^{15} = 65{,}504$.
> - **BF16:** exponent field $254$, power $254 - 127 = 127$, mantissa $2 - 2^{-7}$. Max $= (2 - 2^{-7}) \times 2^{127} \approx 3.39 \times 10^{38}$. Almost the same as FP32's $(2 - 2^{-23}) \times 2^{127} \approx 3.40 \times 10^{38}$.
> - **FP8 E4M3:** no infinities, so the exponent field $1111_2 = 15$ holds ordinary numbers, power $15 - 7 = 8$. The pattern `S.1111.111` is NaN, so the largest mantissa is $1.110_2 = 1.75$. Max $= 1.75 \times 2^8 = 448$. The FP8 paper's Table 1 gives exactly "S.1111.110 = 1.75 × 2^8 = 448".

**What happens above the maximum?** In these notes, PyTorch 2.14 converted 500 to FP8 E4M3 as 448 (it saturated), and 60,000 to E5M2 as 57,344. Other libraries and hardware paths can return NaN or infinity instead. Real FP8 code therefore always scales values into range first (section 10).

## 9. BF16 versus FP16, and why BF16 is the default

BF16 and FP16 both use 16 bits. They split them differently:

- FP16: 5 exponent bits and 10 mantissa bits. More precision, small range (max 65,504).
- BF16: 8 exponent bits and 7 mantissa bits. Less precision, the full FP32 range.

The format was conceived at Google Brain, which gave it its name (the "b"). A 2019 Google Cloud blog post says: "Bfloat16 is a custom 16-bit floating point format for machine learning that's comprised of one sign bit, eight exponent bits, and seven mantissa bits." It adds: "the dynamic range of bfloat16 is identical to that of FP32".

> [!example] Worked example: overflow and underflow in FP16 but not in BF16 (PyTorch 2.14)
> - **Overflow:** $300 \times 300 = 90{,}000$. In FP16 the result is `inf`, because 90,000 is above 65,504. In BF16 the result is 90,112: rounded (the gap near 90,000 is 512), but finite.
> - **Underflow:** $10^{-8}$ in FP16 becomes 0, because it is below the smallest subnormal ($\approx 5.96 \times 10^{-8}$). In BF16 it becomes about $1.0012 \times 10^{-8}$.

Five reasons make BF16 the default format for LLM inference:

1. **Range.** Activations of large models can have large outliers. BF16 cannot overflow where FP32 does not. The Google post says that BF16, "unlike FP16, which typically requires special handling via techniques such as loss scaling", "comes close to being a drop-in replacement for FP32".
2. **The weights are released in BF16.** The config of Llama-3.1-8B sets `torch_dtype` to `bfloat16`. Serving the weights as they were trained avoids a conversion.
3. **Half the memory of FP32.** It uses 2 bytes instead of 4 per number. So the weights, the KV cache and the bytes read per decode step all halve.
4. **Fast hardware.** Tensor Cores run BF16 matrix multiplications at full rate. An H100 SXM lists 1,979 TFLOPS BF16 with sparsity, about 989 TFLOPS dense, against 67 TFLOPS for plain FP32 (NVIDIA H100 page). [L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) explains Tensor Cores.
5. **Cheap conversion.** A BF16 value is the top 16 bits of the FP32 value (rounded). Conversion needs no exponent arithmetic.

### 9.1 Why sums still use FP32

Low precision is fine for storing numbers, but dangerous for **adding many of them**. A running sum grows. Once the sum is large, the gap between neighboring values becomes larger than the numbers you add, and the additions disappear.

> [!example] Worked example: add 0.01 ten thousand times (measured in these notes, PyTorch 2.14)
> | Accumulator format | Result | Correct result |
> |---|---|---|
> | FP32 | 100.0030 | 100 |
> | FP16 | 32.0 | 100 |
> | BF16 | 4.0 | 100 |
>
> Why BF16 stops at 4: between 4 and 8 the BF16 gap is $4 \times 2^{-7} = 0.03125$. Adding 0.01 moves less than half a gap (0.015625), so the sum rounds back to 4 every time.

This is why hardware and kernels keep sums in higher precision. NVIDIA's "GPU Performance Background User's Guide" says: "Tensor Cores can compute and accumulate products in higher precision than the inputs." A BF16 matrix multiplication reads BF16 inputs and adds the products in FP32. It rounds the result to BF16 once, at the end. Interpretation of these notes: when you see "the model runs in BF16", read it as "it stores and moves BF16, and it adds in FP32 where it matters".

## 10. FP8: two formats and a scale

FP8 halves the bytes again. The FP8 paper (Micikevicius et al., arXiv 2209.05433, 2022) defines two formats and says: "The recommended use of FP8 encodings is E4M3 for weight and activation tensors, and E5M2 for gradient tensors."

- **E4M3:** more precision (3 mantissa bits), range up to 448. Good for weights, activations and the KV cache at inference.
- **E5M2:** more range (up to 57,344), less precision. Good for gradients in training, whose sizes vary widely.

A range of 448 is far too small for raw activations, so FP8 always comes with a **scale factor**. The simplest scheme stores one scale per tensor:

$$
s = \frac{\max \lvert x \rvert}{448}, \qquad x_{fp8} = \mathrm{fp8}\!\left(\frac{x}{s}\right), \qquad \hat{x} = s \cdot x_{fp8}
$$

The H100 lists 3,958 TFLOPS FP8 with sparsity, about 1,979 dense: twice its BF16 rate. An **FP8 KV cache** stores keys and values in one byte instead of two. For Llama-3.1-8B that cuts the cache from $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes (128 KiB) to $65{,}536$ bytes (64 KiB) per token. Twice as many tokens fit in the same memory. [L6 of part 03](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) and [L7 of part 04](/notes/ai/llm-systems/04-inference/l7-quantization) cover the accuracy side.

## 11. Integers with a scale factor: INT8 and INT4

Integers with a scale factor are the basis of most weight quantization. The **symmetric absmax** scheme works like this, for $b$ bits with $q_{max} = 2^{b-1} - 1$ (127 for INT8, 7 for INT4):

$$
s = \frac{\max_i \lvert x_i \rvert}{q_{max}}, \qquad q_i = \mathrm{round}\!\left(\frac{x_i}{s}\right), \qquad \hat{x}_i = s \cdot q_i
$$

The symbols mean: $s$ is the scale factor (one floating-point number) and $q_i$ is the stored integer. $\hat{x}_i$ is the value that the model uses after **dequantization**. The rounding error of each value is at most $s/2$.

> [!example] Worked example: quantize four weights to INT8 and to INT4
> Weights $x = [0.3, -0.8, 1.9, -0.05]$. The largest magnitude is 1.9.
>
> **INT8:** $s = 1.9 / 127 \approx 0.014961$.
>
> - $x / s = [20.053, -53.474, 127.0, -3.342]$, rounded: $q = [20, -53, 127, -3]$.
> - $\hat{x} = q \cdot s = [0.2992, -0.7929, 1.9, -0.0449]$.
> - Largest error: $0.0071$, below $s/2 \approx 0.0075$.
>
> **INT4:** $s = 1.9 / 7 \approx 0.27143$.
>
> - $x / s = [1.105, -2.947, 7.0, -0.184]$, rounded: $q = [1, -3, 7, 0]$.
> - $\hat{x} = [0.2714, -0.8143, 1.9, 0.0]$.
> - The small weight $-0.05$ became exactly 0. Largest error: $0.05$.

**One outlier ruins the scale.** Add the weight 40.0 to the same INT8 group. Now $s = 40/127 \approx 0.315$, and the weight $-0.05$ becomes 0, $0.3$ becomes 0.315 and $1.9$ becomes 1.8898. All small weights lose precision because of one large value. The fix is **per-group scales**: one scale for each small group of weights, for example 32 or 128 neighbors. A group of 128 INT4 weights with one FP16 scale costs $4 + 16/128 = 4.125$ bits per weight.

New hardware formats build the same idea in. The OCP MX v1.0 specification defines MXFP4: FP4 E2M1 elements in blocks of 32 with one shared E8M0 (power-of-two) scale, so $4 + 8/32 = 4.25$ bits per value. NVIDIA's NVFP4 uses blocks of 16 with an FP8 E4M3 scale, which NVIDIA's blog describes as "4.5 bits per value", plus one FP32 scale per tensor. The values of E2M1 are only $0, \pm 0.5, \pm 1, \pm 1.5, \pm 2, \pm 3, \pm 4, \pm 6$. [L7 of part 04](/notes/ai/llm-systems/04-inference/l7-quantization) covers GPTQ, AWQ and the effects on quality.

## 12. Model size math

$$
\text{weight bytes} = \text{number of parameters} \times \text{bytes per parameter}
$$

| Format | Bytes per parameter | Llama-3.1-8B (8,030,261,248 parameters) | Llama-3.1-70B (70,553,706,496 parameters) |
|---|---|---|---|
| FP32 | 4 | 32.12 GB (29.92 GiB) | 282.2 GB |
| BF16 | 2 | 16.06 GB (14.96 GiB) | 141.1 GB (131.4 GiB) |
| FP8 | 1 | 8.03 GB | 70.6 GB |
| INT4 (no scales) | 0.5 | 4.02 GB | 35.3 GB |
| INT4 with one FP16 scale per 128 weights | 0.515625 | 4.14 GB | 36.4 GB |

The parameter counts use the official configs, as computed in [L2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication).

> [!example] Worked example: does it fit?
> - Llama-3.1-8B in BF16 (16.06 GB) fits on one 24 GB GPU, with about 8 GB left for the KV cache and the framework.
> - Llama-3.1-70B in BF16 (141.1 GB) does not fit on one 80 GB H100. It needs at least two, and the KV cache needs more. In FP8 (70.6 GB) it fits on one H200 with 141 GB, with room for the cache.
>
> [L2 of part 05](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) does the full memory budget.

The same factor $s$ (bytes per element) appears in the KV cache: $s = 2$ for a BF16 cache, $s = 1$ for an FP8 cache.

## 13. Overflow and underflow inside an LLM

Two places in the forward pass need care:

1. **Softmax.** It computes $e^{z}$. The largest FP32 value is about $3.40 \times 10^{38}$, and $\ln(3.40 \times 10^{38}) \approx 88.7$. So $e^{89}$ is infinity in FP32. In FP16 the limit is $\ln(65504) \approx 11.1$: $e^{12}$ is already infinity, and $e^{11} \approx 59{,}872$ still fits. The fix is to subtract the largest score from every score before the exponential. The result does not change, and every exponent becomes at most 0 ([L3 of part 02](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) shows it with the toy numbers).
2. **Tiny probabilities.** The probability of an unlikely token can be smaller than the smallest subnormal. It underflows to 0, and its logarithm becomes $-\infty$. That is why libraries compute log-probabilities directly with a "log-softmax" instead of taking the logarithm of a softmax.

> [!key] The main idea of this lesson
> A floating-point number is a sign, an exponent and a mantissa. Exponent bits give range, mantissa bits give precision. BF16 keeps the 8 exponent bits of FP32 and only 7 mantissa bits, so it has FP32's range with about 2 to 3 decimal digits. That makes it safe and fast for LLM inference, with sums in FP32. FP8 E4M3 (max 448) and INT8 or INT4 need scale factors. The bytes per number set the model size: 8.03 billion parameters × 2 bytes ≈ 16.06 GB. They also set the factor $s$ of the KV cache formula.

## 14. Code

### 14.1 Inspect the bits

```python
import struct
import torch

def fp32_bits(x):
    (u,) = struct.unpack(">I", struct.pack(">f", x))   # the 32 bits as one integer
    b = f"{u:032b}"
    return b[0], b[1:9], b[9:]                         # sign, exponent, mantissa

print(fp32_bits(6.5))      # ('0', '10000001', '10100000000000000000000')

bf = torch.tensor([6.5], dtype=torch.bfloat16).view(torch.int16).item() & 0xFFFF
print(f"{bf:016b}")        # 0100000011010000: the first 16 bits of the FP32 pattern

for dt in (torch.float32, torch.float16, torch.bfloat16, torch.float8_e4m3fn, torch.float8_e5m2):
    f = torch.finfo(dt)
    print(dt, f.bits, f.max, f.tiny, f.eps)
```

What each important line does:

- `struct.pack(">f", x)` writes the FP32 bytes of `x`. `struct.unpack(">I", ...)` reads the same 4 bytes as an unsigned integer, so you can print the bits.
- `.view(torch.int16)` reinterprets the 2 bytes of a BF16 value as a 16-bit integer, without any conversion. The mask `& 0xFFFF` removes the negative sign that a signed integer could show.
- `torch.finfo` gives the limits of each format: `max`, `tiny` (the smallest normal number) and `eps` (machine epsilon). The printed values match the table of section 8.1.

### 14.2 Absmax quantization

```python
import numpy as np

def quantize(x, bits):
    qmax = 2 ** (bits - 1) - 1
    s = np.abs(x).max() / qmax
    q = np.clip(np.round(x / s), -qmax - 1, qmax).astype(np.int8)
    return q, s

x = np.array([0.3, -0.8, 1.9, -0.05])
for bits in (8, 4):
    q, s = quantize(x, bits)
    print(bits, q, np.round(q * s, 4))
# 8 [ 20 -53 127  -3] [ 0.2992 -0.7929  1.9    -0.0449]
# 4 [ 1 -3  7  0] [ 0.2714 -0.8143  1.9     0.    ]
```

The `np.clip` keeps every integer inside its range. With absmax scaling only rounding can reach the edge, but other scale choices need the clip. INT4 values are stored here in an `int8` array. Real kernels pack two INT4 values into one byte.

### 14.3 Exercises

Write these in `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, notebook folder `llm-systems/`, file `04-numbers.ipynb`.

1. **Decode FP32 by hand.** Write `decode_fp32(sign, exp_bits, mant_bits)` that rebuilds the value from the three bit strings, for normal numbers and for subnormal numbers.
   - Acceptance test: it returns 6.5 for the fields of 6.5 and $-0.15625$ for the fields of `0xBE200000`. It returns `2**-149` for the smallest subnormal (exponent all zeros, mantissa `000...001`).
   - Hint 1: for a normal number, the value is $(1 + \text{mantissa}/2^{23}) \times 2^{e - 127}$.
   - Hint 2: for a subnormal number there is no hidden 1, and the power is fixed at $1 - 127 = -126$.
2. **BF16 by truncation versus rounding.** Write `bf16_truncate(x)` (keep the top 16 bits of the FP32 pattern) and `bf16_round(x)` (round to nearest, ties to even). Compare both with `torch.tensor(x).bfloat16()` for 0.1, 1/3 and pi.
   - Acceptance test: `bf16_round` agrees with PyTorch on all three. `bf16_truncate` disagrees on at least one (for 1/3 it gives 0.33203125, PyTorch gives 0.333984375).
   - Hint 1: rounding adds `0x7FFF + ((u >> 16) & 1)` to the 32-bit pattern `u` before it drops the low 16 bits.
   - Hint 2: rebuild a float from 16 bits by shifting them left by 16 and unpacking as FP32.
3. **Per-tensor versus per-group INT4.** Draw 4,096 weights from a normal distribution with standard deviation 0.02 (seed 0) and set one weight to 1.0. Quantize to INT4 with one scale for all weights, then with one scale per group of 128.
   - Acceptance test: the mean absolute error with group scales is at least 5 times smaller than with one scale. (The reference solution measures about 6.7 times.)
   - Hint 1: reshape the weights to $[32, 128]$ and compute one scale per row.
   - Hint 2: `np.abs(x).max(axis=1, keepdims=True)` gives the per-group maxima as a column.

## 15. Common mistakes

1. **"GB and GiB are the same."** 1 GiB $= 1{,}073{,}741{,}824$ bytes, about 7.4% more than 1 GB. On a 16 GB model the difference is more than 1 GiB.
2. **"BF16 is more precise than FP16 because it is newer."** BF16 is less precise (7 mantissa bits against 10). It wins on range (8 exponent bits against 5).
3. **"Floats are evenly spaced."** The gap doubles at every power of 2. In BF16, $256 + 1 = 256$.
4. **"A BF16 model does all its arithmetic in BF16."** It stores and moves BF16. Tensor Cores add the products in FP32 and round once at the end.
5. **"FP8 is just BF16 with fewer bits."** FP8 E4M3 has a maximum of 448. It only works with scale factors, and it uses its own rules for special values.
6. **"Quantization error is the same for every weight."** With one scale per tensor, one outlier makes the scale large and pushes small weights to zero. Per-group scales fix most of this.
7. **"INT4 means exactly 4 bits per weight."** The scales cost extra: for example 4.125 bits with one FP16 scale per 128 weights, 4.25 for MXFP4 and 4.5 for NVFP4.

## 16. One-minute explanation

A bit is 0 or 1, a byte is 8 bits, and memory is counted in bytes. A KiB is 1,024 bytes and a KB is 1,000. Integers in two's complement have even spacing, for example −128 to 127 for INT8. A floating-point number stores a sign, an exponent and a mantissa, like scientific notation in base 2 with a hidden leading 1. The exponent bits give the range and the mantissa bits give the precision, so the gaps between values double at every power of two. FP32 has 8 exponent and 23 mantissa bits. FP16 has 5 and 10, so it overflows above 65,504. BF16 has 8 and 7, so it keeps the FP32 range with about two to three decimal digits. That is why BF16 is the default for LLM inference, while sums inside matrix multiplications stay in FP32. FP8 E4M3 has a maximum of 448 and INT4 has only 16 values, so both need scale factors, ideally one per small group. Model size is parameters times bytes, so Llama-3.1-8B is about 16 GB in BF16. An FP8 KV cache halves its 128 KiB per token to 64 KiB.

## 17. Check questions

```check
{
  "question": "Convert (a) 16,060,522,496 bytes to GB and to GiB and (b) 128 KiB to bytes and to KB. (c) Why is 8,192 tokens × 128 KiB exactly 1 GiB?",
  "answer": "(a) $16{,}060{,}522{,}496 / 10^9 \\approx 16.06$ GB and $/ 2^{30} \\approx 14.96$ GiB. (b) $128 \\times 1024 = 131{,}072$ bytes $\\approx 131.1$ KB. (c) $8192 = 2^{13}$ and $128$ KiB $= 2^{17}$ bytes, so the product is $2^{30}$ bytes $= 1$ GiB exactly. Powers of 2 multiply cleanly in binary units."
}
```

```check
{
  "question": "Interview follow-up: why do LLMs use BF16 rather than FP16 for inference, when FP16 has more precision? Give two numeric examples.",
  "hint": "Compare the exponent bits.",
  "answer": "BF16 has 8 exponent bits like FP32, so the same range (max $\\approx 3.39 \\times 10^{38}$). FP16 has only 5 exponent bits (max 65,504, smallest subnormal $\\approx 5.96 \\times 10^{-8}$). Examples: $300 \\times 300 = 90{,}000$ is infinity in FP16 but 90,112 in BF16. $10^{-8}$ is 0 in FP16 but about $1.0012 \\times 10^{-8}$ in BF16. Neural networks are more sensitive to range than to precision (the Google TPU post says so), and BF16 needs no loss scaling. Also, models are released in BF16 (Llama-3.1-8B config `torch_dtype: bfloat16`). Conversion from FP32 is a truncation with rounding. Tensor Cores run BF16 at the same rate as FP16. The lost precision is handled by FP32 accumulation inside matrix multiplications."
}
```

```check
{
  "question": "Interview follow-up: derive the maximum value of FP8 E4M3. Why is it 448 and not 240, and why does it need a scale factor?",
  "answer": "E4M3 has bias 7. Under IEEE rules, the top exponent field 1111 would be reserved for infinity and NaN. Then the largest normal exponent field would be $1110_2 = 14$, the power $14 - 7 = 7$, and the maximum $1.875 \\times 2^7 = 240$. The FP8 paper instead drops infinities and keeps only one NaN pattern (`S.1111.111`). So exponent field 15 holds normal numbers (power 8), and the largest allowed mantissa is $1.110_2 = 1.75$. Max $= 1.75 \\times 2^8 = 448$. Activations and weights can exceed 448 or be far smaller than its smallest normal (0.015625). So FP8 tensors store $x/s$ with a scale $s$, for example $\\max\\lvert x \\rvert / 448$, and multiply by $s$ when used."
}
```

```check
{
  "question": "Interview follow-up: quantize $x = [0.3, -0.8, 1.9, -0.05]$ to INT4 with absmax scaling. Give the scale, the integers, the dequantized values and the largest error. Then explain what one outlier of 40.0 in the same group would do.",
  "answer": "$q_{max} = 7$, so $s = 1.9 / 7 \\approx 0.2714$. $x/s = [1.105, -2.947, 7.0, -0.184]$, rounded $q = [1, -3, 7, 0]$. Dequantized: $[0.2714, -0.8143, 1.9, 0.0]$. Largest error: 0.05 (the weight $-0.05$ became 0), within the bound $s/2 \\approx 0.136$. With an outlier of 40.0, $s = 40/7 \\approx 5.71$, and every other weight rounds to 0. Per-group scales (for example one scale per 128 weights) limit the damage to one group. Methods such as AWQ and GPTQ go further (part 04 L7)."
}
```

```check
{
  "question": "Interview follow-up: how much memory do the weights of Llama-3.1-70B need in BF16, FP8 and INT4 with one FP16 scale per 128 weights? Which configuration fits on one H100 80 GB, on one H200 141 GB?",
  "answer": "70,553,706,496 parameters. BF16: $\\times 2 \\approx 141.1$ GB. FP8: $\\approx 70.6$ GB. INT4 with group scales: $\\times 4.125/8 \\approx 36.4$ GB. On one H100 80 GB: BF16 does not fit. FP8 fits for the weights alone but leaves only about 9 GB for the KV cache and the runtime, which is very tight. INT4 fits with room. On one H200 141 GB: BF16 (141.1 GB) does not fit, because nothing would be left for the cache. FP8 fits with about 70 GB for the cache."
}
```

```check
{
  "question": "In BF16, what is $256 + 1$? Use this to explain why matrix multiplications accumulate in FP32.",
  "answer": "BF16 has 7 mantissa bits, so between 256 and 512 the gap is $256 \\times 2^{-7} = 2$. 257 is halfway between 256 and 258, and round-to-nearest-even gives 256. So $256 + 1 = 256$. A dot product of length 4,096 adds 4,096 products. Once the running sum is large, small products vanish in the same way. In these notes, adding 0.01 ten thousand times gave 4.0 in BF16, 32.0 in FP16 and 100.003 in FP32. So Tensor Cores take BF16 inputs but add the products in FP32 and round once at the end."
}
```

```check
{
  "question": "What is the KV cache per token of Llama-3.1-8B in BF16 and in FP8? How many tokens fit in 40 GiB in each case?",
  "answer": "BF16: $2 \\times 32 \\times 8 \\times 128 \\times 2 = 131{,}072$ bytes $= 128$ KiB. FP8: $65{,}536$ bytes $= 64$ KiB. In 40 GiB $= 40 \\times 2^{30}$ bytes: BF16 holds $40 \\times 2^{30} / 2^{17} = 327{,}680$ tokens, FP8 holds $655{,}360$ tokens. Halving $s$ doubles the number of cached tokens, and so the batch size at a given context length."
}
```

```check
{
  "question": "Exercise 1: show a reference solution",
  "answer": "```python\nimport struct\n\ndef decode_fp32(sign, exp_bits, mant_bits):\n    s = -1.0 if sign == \"1\" else 1.0\n    e = int(exp_bits, 2)\n    m = int(mant_bits, 2)\n    if e == 255:\n        return s * float(\"inf\") if m == 0 else float(\"nan\")\n    if e == 0:                                   # zero or subnormal: no hidden 1\n        return s * (m / 2**23) * 2.0 ** (1 - 127)\n    return s * (1 + m / 2**23) * 2.0 ** (e - 127)\n\ndef fields(x):\n    (u,) = struct.unpack(\">I\", struct.pack(\">f\", x))\n    b = f\"{u:032b}\"\n    return b[0], b[1:9], b[9:]\n\nprint(decode_fp32(*fields(6.5)))                     # 6.5\n(u,) = struct.unpack(\">I\", bytes.fromhex(\"BE200000\"))\nb = f\"{u:032b}\"\nprint(decode_fp32(b[0], b[1:9], b[9:]))              # -0.15625\nprint(decode_fp32(\"0\", \"0\" * 8, \"0\" * 22 + \"1\") == 2**-149)   # True\n```\n\nThe subnormal branch uses the fixed power $1 - 127 = -126$ and no hidden 1. That gives $2^{-23} \\times 2^{-126} = 2^{-149}$ for the smallest one."
}
```

```check
{
  "question": "Exercise 2: show a reference solution",
  "answer": "```python\nimport struct\nimport math\nimport torch\n\ndef f32_to_u32(x):\n    return struct.unpack(\">I\", struct.pack(\">f\", x))[0]\n\ndef u16_to_f32(h):\n    return struct.unpack(\">f\", struct.pack(\">I\", h << 16))[0]\n\ndef bf16_truncate(x):\n    return u16_to_f32(f32_to_u32(x) >> 16)\n\ndef bf16_round(x):                                # round to nearest, ties to even\n    u = f32_to_u32(x)\n    u += 0x7FFF + ((u >> 16) & 1)\n    return u16_to_f32((u >> 16) & 0xFFFF)\n\nfor x in (0.1, 1 / 3, math.pi):\n    ref = torch.tensor(x).bfloat16().item()\n    print(x, bf16_truncate(x), bf16_round(x), ref, bf16_round(x) == ref)\n# 1/3: truncate 0.33203125, round 0.333984375, torch 0.333984375\n```\n\nAdding `0x7FFF` rounds up whenever the dropped 16 bits are more than half. The extra `(u >> 16) & 1` breaks exact ties toward an even last bit. (NaN handling is omitted.)"
}
```

```check
{
  "question": "Exercise 3: show a reference solution",
  "answer": "```python\nimport numpy as np\n\nrng = np.random.default_rng(0)\nw = rng.normal(0, 0.02, 4096)\nw[123] = 1.0                                        # one outlier\n\ndef int4(x, axis=None):\n    s = np.abs(x).max(axis=axis, keepdims=axis is not None) / 7\n    return np.clip(np.round(x / s), -8, 7) * s\n\nerr_tensor = np.abs(int4(w) - w).mean()\ng = w.reshape(32, 128)\nerr_group = np.abs(int4(g, axis=1) - g).mean()\nprint(round(err_tensor, 5), round(err_group, 5), round(err_tensor / err_group, 1))\n```\n\nWith one scale, $s = 1/7 \\approx 0.143$, so almost every weight (standard deviation 0.02) rounds to 0, and the error is about the mean magnitude of the weights. With 32 groups, only the group with the outlier suffers. The other 31 groups get a scale of about 0.01."
}
```

## 18. Links

- Previous: [L3: Tensors, shapes and batches](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches)
- Next: [L5: GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth)
- [L3 of part 03: The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula): where the bytes per element $s$ enters
- [L6 of part 03: Shrinking the KV cache](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache): FP8 and INT4 caches
- [L7 of part 04: Quantization](/notes/ai/llm-systems/04-inference/l7-quantization): GPTQ, AWQ, FP8 W8A8, FP4
- [L2 of part 05: Sizing GPUs for a model](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus): the full memory budget
- Paper: [01 Background: virtual memory and paging](/notes/papers/llm-serving/2023-pagedattention/01-background-virtual-memory-and-paging): bytes, addresses and pages
- [Glossary](/notes/ai/llm-systems/glossary)

### Sources

- NIST, "Prefixes for binary multiples": https://physics.nist.gov/cuu/Units/binary.html (checked on 2026-10-15)
- Micikevicius et al., "FP8 Formats for Deep Learning", arXiv 2209.05433, Table 1 and the recommended use of E4M3 and E5M2: https://arxiv.org/abs/2209.05433 (checked on 2026-10-15)
- Wang and Kanwar, "BFloat16: The secret to high performance on Cloud TPUs", Google Cloud blog, 23 August 2019: https://cloud.google.com/blog/products/ai-machine-learning/bfloat16-the-secret-to-high-performance-on-cloud-tpus (checked on 2026-10-15)
- Open Compute Project, "OCP Microscaling Formats (MX) Specification v1.0", Tables 1 and 5: https://www.opencompute.org/documents/ocp-microscaling-formats-mx-v1-0-spec-final-pdf (checked on 2026-10-15)
- NVIDIA, "Introducing NVFP4 for Efficient and Accurate Low-Precision Inference", 24 June 2025: https://developer.nvidia.com/blog/introducing-nvfp4-for-efficient-and-accurate-low-precision-inference/ (checked on 2026-10-15)
- NVIDIA H100 product page (BF16, FP8 and FP32 rates, sparsity footnote): https://www.nvidia.com/en-us/data-center/h100/ (checked on 2026-10-15)
- NVIDIA, "GPU Performance Background User's Guide" (accumulation in higher precision): https://docs.nvidia.com/deeplearning/performance/dl-performance-gpu-background/index.html (checked on 2026-10-15)
- Llama 3.1 8B config (`torch_dtype` bfloat16) as mirrored on Hugging Face: https://huggingface.co/unsloth/Meta-Llama-3.1-8B/blob/main/config.json (checked on 2026-10-15)
- PyTorch 2.14 `torch.finfo` and dtype conversions, run in these notes.
