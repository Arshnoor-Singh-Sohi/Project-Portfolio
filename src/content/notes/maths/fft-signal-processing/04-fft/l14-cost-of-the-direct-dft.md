---
title: "L14: The cost of the direct DFT"
order: 1
summary: "Count the work of the direct DFT: N² complex multiplications, from a table that holds only N different probe values."
status: not-started
tags: [dft, fft, cost, operation-count]
---

## 1. The question this idea answers

Lesson [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula) gave the DFT formula. Lesson [L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft) rebuilt the signal from its coefficients. The formula is correct. But how much work does it need?

A speech model computes many spectra each second. For example, Whisper computes one spectrum every 10 ms, so 100 spectra for each second of audio (lesson [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end)). So the cost of one DFT matters.

This lesson counts the work of the direct DFT. It also finds patterns in that work. The direct method does not use these patterns. The FFT uses them, from lesson [L15](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split) on.

## 2. Mental model

> [!analogy] A cashier and a short price list
> A shop sells 64 items. Each item has one of only 8 prices. A slow cashier reads the price list again for every item: 64 times. A smart cashier sees that the same 8 prices repeat again and again.
>
> **Where it stops working:** at the till, one price always gives the same amount. In the DFT, each cell multiplies its probe value by a different sample $x[n]$. So the 8 repeated values alone do not remove a multiplication. The FFT needs a deeper pattern: the even–odd split of lesson L15.

## 3. Terms

| Term | Plain meaning |
|---|---|
| direct DFT | The DFT computed straight from its formula: N products for each of the N bins. |
| complex multiplication | The product of two complex numbers: $(a+bi)(c+di) = (ac-bd) + (ad+bc)i$. It needs 4 real multiplications and 2 real additions. |
| operation count | The number of arithmetic operations that a method needs. It is not a time measurement. |
| $W_N$ | Short name for $e^{-i2\pi/N}$: one clockwise turn of 1/N of a circle. $W_N^{kn}$ is the probe value for bin k and sample n. |
| probe table | The N × N table of probe values. Row k, column n holds $W_N^{kn}$. |
| $kn \bmod N$ | The remainder after you divide kn by N. It tells which of the N probe values sits in a cell. |
| grows like N² | When N doubles, the work becomes 4 times larger. |

> [!note] Rounding on this page
> The exact values $1/\sqrt{2} = 0.70710\ldots$ and $\sqrt{2} = 1.41421\ldots$ appear often. Tables show them to four decimals (0.7071 and 1.4142). The text and the course round them to 0.71 and 1.41.

## 4. The direct DFT as a recipe

The forward DFT from L11 is

$$
X[k] = \sum_{n=0}^{N-1} x[n]\, e^{-i 2\pi k n / N}, \qquad k = 0, 1, \dots, N-1.
$$

Give the one-step turn a short name: $W_N = e^{-i2\pi/N}$. For a whole number $m$, the rule $(e^{i\theta})^m = e^{im\theta}$ holds (lesson [F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)). So $e^{-i2\pi kn/N} = \left(e^{-i2\pi/N}\right)^{kn} = W_N^{kn}$, and the formula becomes

$$
X[k] = \sum_{n=0}^{N-1} x[n]\, W_N^{kn}.
$$

The direct method computes one bin k with these steps:

1. For each n from 0 to N − 1, find the probe value $W_N^{kn}$.
2. Multiply it by $x[n]$. This is one complex multiplication.
3. Add the N products.

### 4.1 The teaching signal

The teaching signal is $x[n] = \cos(2\pi n/8) + 0.5\sin(2\pi \cdot 2n/8)$ with N = 8. Each sample is a cosine part plus a sine part.

| n | cosine part | sine part | x[n] exactly | x[n] (4 decimals) |
|---|---|---|---|---|
| 0 | 1 | 0 | 1 | 1 |
| 1 | $1/\sqrt{2}$ | 0.5 | $1/\sqrt{2} + 1/2$ | 1.2071 |
| 2 | 0 | 0 | 0 | 0 |
| 3 | $-1/\sqrt{2}$ | −0.5 | $-1/\sqrt{2} - 1/2$ | −1.2071 |
| 4 | −1 | 0 | −1 | −1 |
| 5 | $-1/\sqrt{2}$ | 0.5 | $-1/\sqrt{2} + 1/2$ | −0.2071 |
| 6 | 0 | 0 | 0 | 0 |
| 7 | $1/\sqrt{2}$ | −0.5 | $1/\sqrt{2} - 1/2$ | 0.2071 |

### 4.2 One bin costs N multiplications

> [!example] Worked example: X[1] with the direct method
> For k = 1, the probe value in column n is $W_8^{n}$. The table shows every product and the running sum.
>
> | n | x[n] | $W_8^{n}$ | product $x[n]\,W_8^{n}$ | running sum |
> |---|---|---|---|---|
> | 0 | 1 | 1 | 1 | 1 |
> | 1 | 1.2071 | 0.7071 − 0.7071i | 0.8536 − 0.8536i | 1.8536 − 0.8536i |
> | 2 | 0 | −i | 0 | 1.8536 − 0.8536i |
> | 3 | −1.2071 | −0.7071 − 0.7071i | 0.8536 + 0.8536i | 2.7071 |
> | 4 | −1 | −1 | 1 | 3.7071 |
> | 5 | −0.2071 | −0.7071 + 0.7071i | 0.1464 − 0.1464i | 3.8536 − 0.1464i |
> | 6 | 0 | i | 0 | 3.8536 − 0.1464i |
> | 7 | 0.2071 | 0.7071 + 0.7071i | 0.1464 + 0.1464i | 4 |
>
> So X[1] = 4. This one bin needed 8 multiplications and 7 additions.

### 4.3 All bins cost N² multiplications

Each of the N bins needs its own pass over the N samples. No bin reuses a product of another bin. So the direct DFT needs

$$
N \text{ bins} \times N \text{ multiplications per bin} = N^2 \text{ complex multiplications.}
$$

Each bin also adds N products, with N − 1 additions. So the direct DFT also needs $N(N-1)$ complex additions. For N = 8, this gives 64 multiplications and 56 additions.

| N | $N^2$ multiplications | Note |
|---|---|---|
| 8 | 64 | The teaching signal |
| 16 | 256 | Double N: 4 times the work |
| 64 | 4,096 | The spectrum signal of part 05 |
| 400 | 160,000 | One Whisper frame (lesson [L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts)) |
| 1024 | 1,048,576 | About a million |

Why does doubling N multiply the work by 4? Because $(2N)^2 = 4N^2$. From 512 to 1024 samples, the work grows from 262,144 to 1,048,576 multiplications.

> [!trap] A count is not a time
> "N² = 64" counts operations. It does not give seconds. The real time also depends on the computer, the memory and the programming language. Lesson [L21](/notes/maths/fft-signal-processing/04-fft/l21-why-it-is-fast) shows a fast method that is slower than a slow method for small N.

> [!note] What "one multiplication" means here
> This page counts each product $x[n]\,W_N^{kn}$ as one complex multiplication, as the course does. When $x[n]$ is real, the product needs only 2 real multiplications. Also, 20 of the 64 cells hold $W_8^0 = 1$. A multiplication by 1 changes nothing, but the direct method still does it.

## 5. The probe table repeats only N values

Write the probe values as a table. Row k is the bin. Column n is the sample. The cell holds $W_8^{kn}$. The first table shows the exponent kn.

| k | n = 0 | n = 1 | n = 2 | n = 3 | n = 4 | n = 5 | n = 6 | n = 7 |
|---|---|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| 2 | 0 | 2 | 4 | 6 | 8 | 10 | 12 | 14 |
| 3 | 0 | 3 | 6 | 9 | 12 | 15 | 18 | 21 |
| 4 | 0 | 4 | 8 | 12 | 16 | 20 | 24 | 28 |
| 5 | 0 | 5 | 10 | 15 | 20 | 25 | 30 | 35 |
| 6 | 0 | 6 | 12 | 18 | 24 | 30 | 36 | 42 |
| 7 | 0 | 7 | 14 | 21 | 28 | 35 | 42 | 49 |

### 5.1 Why only the remainder matters

$W_8$ is one eighth of a turn. Eight of these steps make one full turn:

$$
W_8^8 = e^{-i2\pi} = \cos 2\pi - i \sin 2\pi = 1.
$$

Now take any exponent kn. Divide it by 8: $kn = 8q + r$, with a whole number $q$ and a remainder $r = kn \bmod 8$ from 0 to 7 (lesson [F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary)). Then

$$
W_8^{kn} = W_8^{8q + r} = \left(W_8^{8}\right)^{q} W_8^{r} = 1^{q}\, W_8^{r} = W_8^{r}.
$$

Each full turn changes nothing. Only the remainder decides the position on the circle.

> [!example] Worked example: two cells
> - k = 3, n = 4: kn = 12 = 8·1 + 4. So $W_8^{12} = W_8^{4} = -1$.
> - k = 7, n = 7: kn = 49 = 8·6 + 1. So $W_8^{49} = W_8^{1} = 0.71 - 0.71i$.

### 5.2 The table of remainders

Replace each exponent by its remainder mod 8:

| k | n = 0 | n = 1 | n = 2 | n = 3 | n = 4 | n = 5 | n = 6 | n = 7 |
|---|---|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| 2 | 0 | 2 | 4 | 6 | 0 | 2 | 4 | 6 |
| 3 | 0 | 3 | 6 | 1 | 4 | 7 | 2 | 5 |
| 4 | 0 | 4 | 0 | 4 | 0 | 4 | 0 | 4 |
| 5 | 0 | 5 | 2 | 7 | 4 | 1 | 6 | 3 |
| 6 | 0 | 6 | 4 | 2 | 0 | 6 | 4 | 2 |
| 7 | 0 | 7 | 6 | 5 | 4 | 3 | 2 | 1 |

The 64 cells hold only 8 different values. The figure draws each cell as a dial. The hand points at the probe value.

![Alt text: an 8 by 8 grid of dials for N = 8, where every dial points at one of only 8 positions](/notes/media/fft-signal-processing/figures/l14-probe-table.svg)

| Remainder m | $W_8^{m}$ (rounded) | Cells that hold it |
|---|---|---|
| 0 | 1 | 20 |
| 1 | 0.71 − 0.71i | 4 |
| 2 | −i | 8 |
| 3 | −0.71 − 0.71i | 4 |
| 4 | −1 | 12 |
| 5 | −0.71 + 0.71i | 4 |
| 6 | i | 8 |
| 7 | 0.71 + 0.71i | 4 |
| total | | 64 |

Why does the value 1 fill 20 cells? Row 0 and column 0 give 8 + 8 − 1 = 15 cells. The products 2·4, 4·2, 4·4, 4·6 and 6·4 are multiples of 8. They give 5 more cells. So 15 + 5 = 20.

The same holds for every N. For N = 1024, the table has 1,048,576 cells but only 1024 different values.

## 6. The structure that the direct DFT ignores

The table has more structure than a short list of values. Compare row 1 and row 5:

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| row 1: remainder | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| row 5: remainder | 0 | 5 | 2 | 7 | 4 | 1 | 6 | 3 |
| difference mod 8 | 0 | 4 | 0 | 4 | 0 | 4 | 0 | 4 |

The even columns agree. The odd columns differ by 4 steps, which is half a turn. Half a turn is a multiplication by $W_8^4 = -1$. The algebra gives the same result for every row k:

$$
W_8^{(k+4)n} = W_8^{kn}\, W_8^{4n} = W_8^{kn} \left(W_8^{4}\right)^{n} = W_8^{kn}\,(-1)^{n}.
$$

So for an even n, row k + 4 equals row k. For an odd n, row k + 4 is the negative of row k.

> [!example] Worked example: X[5] from the products of X[1]
> Use the products from the X[1] table in section 4.2.
>
> 1. Even columns (n = 0, 2, 4, 6): 1 + 0 + 1 + 0 = 2.
> 2. Odd columns (n = 1, 3, 5, 7): (0.8536 − 0.8536i) + (0.8536 + 0.8536i) + (0.1464 − 0.1464i) + (0.1464 + 0.1464i) = 2.
> 3. X[1] = even part + odd part = 2 + 2 = 4.
> 4. Row 5 keeps the even products and negates the odd products. So X[5] = 2 − 2 = 0.
>
> The direct method computes 8 new products for X[5]. It could reuse the 8 products of X[1].

A third pattern hides in the even columns. In row k, the even columns hold $W_8^{k \cdot 2m}$ for m = 0, 1, 2, 3. These are the probe values of a 4-point DFT. Lesson L15 shows why.

> [!key] The waste in the direct DFT
> The direct DFT does N² multiplications. Its table holds only N different values. Rows k and k + N/2 share the same products, with a sign change on the odd columns. The FFT computes this shared work once and reuses it.

## 7. Graphs

The 8 probe values sit on the unit circle, one eighth of a turn apart. The gold line marks $W_8^1$, the first step clockwise.

```plot
{
  "title": "The 8 values W₈ᵐ (gold) on the unit circle (ink)",
  "xAxis": {"label": "real part", "domain": [-2.05, 2.05]},
  "yAxis": {"label": "imaginary part", "domain": [-1.3, 1.3]},
  "disableZoom": true,
  "data": [
    {"points": [[1.0, 0.0], [0.9962, 0.0872], [0.9848, 0.1736], [0.9659, 0.2588], [0.9397, 0.342], [0.9063, 0.4226], [0.866, 0.5], [0.8192, 0.5736], [0.766, 0.6428], [0.7071, 0.7071], [0.6428, 0.766], [0.5736, 0.8192], [0.5, 0.866], [0.4226, 0.9063], [0.342, 0.9397], [0.2588, 0.9659], [0.1736, 0.9848], [0.0872, 0.9962], [0.0, 1.0], [-0.0872, 0.9962], [-0.1736, 0.9848], [-0.2588, 0.9659], [-0.342, 0.9397], [-0.4226, 0.9063], [-0.5, 0.866], [-0.5736, 0.8192], [-0.6428, 0.766], [-0.7071, 0.7071], [-0.766, 0.6428], [-0.8192, 0.5736], [-0.866, 0.5], [-0.9063, 0.4226], [-0.9397, 0.342], [-0.9659, 0.2588], [-0.9848, 0.1736], [-0.9962, 0.0872], [-1.0, 0.0], [-0.9962, -0.0872], [-0.9848, -0.1736], [-0.9659, -0.2588], [-0.9397, -0.342], [-0.9063, -0.4226], [-0.866, -0.5], [-0.8192, -0.5736], [-0.766, -0.6428], [-0.7071, -0.7071], [-0.6428, -0.766], [-0.5736, -0.8192], [-0.5, -0.866], [-0.4226, -0.9063], [-0.342, -0.9397], [-0.2588, -0.9659], [-0.1736, -0.9848], [-0.0872, -0.9962], [0.0, -1.0], [0.0872, -0.9962], [0.1736, -0.9848], [0.2588, -0.9659], [0.342, -0.9397], [0.4226, -0.9063], [0.5, -0.866], [0.5736, -0.8192], [0.6428, -0.766], [0.7071, -0.7071], [0.766, -0.6428], [0.8192, -0.5736], [0.866, -0.5], [0.9063, -0.4226], [0.9397, -0.342], [0.9659, -0.2588], [0.9848, -0.1736], [0.9962, -0.0872], [1.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[1.0, 0.0], [0.7071, -0.7071], [0.0, -1.0], [-0.7071, -0.7071], [-1.0, 0.0], [-0.7071, 0.7071], [0.0, 1.0], [0.7071, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 0.0], [0.7071, -0.7071]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.7071, -0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true}
  ]
}
```

The real parts of row 1 and row 5 show the sign pattern. The dots agree at n = 0, 2, 4, 6 and are opposite at n = 1, 3, 5, 7.

```plot
{
  "title": "Real parts: row 1 (gold) and row 5 (red)",
  "xAxis": {"label": "column n", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "real part of the probe value", "domain": [-1.4, 1.4]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 1.0], [1.0, 0.7071], [2.0, 0.0], [3.0, -0.7071], [4.0, -1.0], [5.0, -0.7071], [6.0, 0.0], [7.0, 0.7071]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 0.7071], [2.0, 0.0], [3.0, -0.7071], [4.0, -1.0], [5.0, -0.7071], [6.0, 0.0], [7.0, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, -0.7071], [2.0, 0.0], [3.0, 0.7071], [4.0, -1.0], [5.0, 0.7071], [6.0, 0.0], [7.0, -0.7071]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, -0.7071], [2.0, 0.0], [3.0, 0.7071], [4.0, -1.0], [5.0, 0.7071], [6.0, 0.0], [7.0, -0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true}
  ]
}
```

The cost grows fast. Each doubling of N multiplies the work by 4.

```plot
{
  "title": "Direct DFT multiplications N² (red)",
  "xAxis": {"label": "N", "domain": [0, 34]},
  "yAxis": {"label": "complex multiplications", "domain": [0, 1100]},
  "disableZoom": true,
  "data": [
    {"points": [[2.0, 4.0], [4.0, 16.0], [8.0, 64.0], [16.0, 256.0], [32.0, 1024.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[2.0, 4.0], [4.0, 16.0], [8.0, 64.0], [16.0, 256.0], [32.0, 1024.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true}
  ]
}
```

## 8. Video

The first clip shows the table of dials and one full pass for X[1]. Count the 8 multiplications, then the 64 for the whole table.

```video
{
  "src": "/notes/media/fft-signal-processing/course/08_The_Cost_of_the_Direct_DFT.mp4",
  "start": "0:00",
  "end": "0:25",
  "caption": "The DFT as a table of dials. One output needs 8 multiplications. All 8 outputs need 64."
}
```

The second clip tints two repeated rotations. Look for the same dial position in many cells.

```video
{
  "src": "/notes/media/fft-signal-processing/course/08_The_Cost_of_the_Direct_DFT.mp4",
  "start": "0:25",
  "end": "0:32",
  "caption": "Only 8 different values fill the 64 cells."
}
```

The third clip shows the growth to about a million operations for N = 1024. It ends with the question that leads to the FFT.

```video
{
  "src": "/notes/media/fft-signal-processing/course/08_The_Cost_of_the_Direct_DFT.mp4",
  "start": "0:32",
  "end": "0:48",
  "caption": "The work grows like N². Can we stop the recomputation of the same values?"
}
```

## 9. Code

Build these in a lab. Use your direct DFT `my_dft(x)` from lesson L11.

1. **The remainder table.** Write `probe_exponents(N)`. It returns an N × N integer array. Row k, column n holds $kn \bmod N$.
2. **A counted DFT.** Write `my_dft_counted(x)`. It returns the pair `(X, count)`, where `count` is the number of complex multiplications.
3. **The sign pattern.** Write `rows_k_and_k_plus_half(N, k)`. It returns two arrays: row k and row k + N/2 of the probe values $W_N^{kn}$.
4. **A timing test.** Time `my_dft` for N = 128, 256 and 512 with `time.perf_counter()`.

Acceptance tests:

- `probe_exponents(8)` equals the remainder table in section 5.2.
- `len(np.unique(probe_exponents(N))) == N` is True for N = 4, 8, 16 and 64.
- For N = 8, the counts of the values 0 to 7 are [20, 4, 8, 4, 12, 4, 8, 4].
- For N = 8, 16 and 64, `count == N * N`, and `np.allclose(X, np.fft.fft(x))` is True for a random x.
- For N = 16 and every k from 0 to 7, the two rows are equal at even n and opposite at odd n.
- In the timing test, each doubling of N multiplies the time by about 4. Small differences are normal.

One NumPy call that helps with the counts:

```python
values, counts = np.unique(T, return_counts=True)
```

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft)

```check
{
  "question": "Hint for `probe_exponents(N)`: how do you make the table without two nested loops?",
  "hint": "Hint level 1 (idea): the cell value is a product of a row number and a column number, then a remainder.",
  "answer": "Hint level 2 (pseudocode): make the column of row numbers 0..N−1 and the row of column numbers 0..N−1. Form their outer product (every row number times every column number). Take the remainder mod N of every cell. A double loop is also correct, only slower."
}
```

```check
{
  "question": "Hint for the sign pattern: how do you test 'equal at even n, opposite at odd n' in one line?",
  "hint": "Hint level 1 (idea): multiply row k by $(-1)^n$ and compare the result with row k + N/2.",
  "answer": "Hint level 2 (pseudocode): make the sign array s[n] = (−1)^n. Test that row k + N/2 is close to s × row k with `np.allclose`. Repeat the test for every k from 0 to N/2 − 1."
}
```

## 10. Common mistakes

1. **"N² seconds."** N² counts operations. The time also depends on the hardware, the memory and the language.
2. **One multiplication for each bin.** Each bin needs N products, so the whole DFT needs N².
3. **"Only 8 values, so only 8 multiplications."** Each cell multiplies its probe value by a different sample. The repeated values alone do not remove work.
4. **A new value for every exponent.** $W_8^{12}$ is not a new value. 12 mod 8 = 4, so $W_8^{12} = W_8^4 = -1$.
5. **"Row k + 4 equals row k."** Only the even columns agree. The odd columns change sign. So X[5] = 0, but X[1] = 4.

## 11. One-minute explanation

The direct DFT computes each bin from scratch: N samples times N probe values, then a sum. So N bins need N² multiplications: 64 for N = 8, about a million for N = 1024. But the probe table holds only N different values, because N steps make one full turn. Rows k and k + N/2 also agree on the even columns and differ only in sign on the odd columns. So X[1] and X[5] share the same products, and the direct method computes them twice. The FFT computes this shared work once.

## 12. Check questions

```check
{
  "question": "How many complex multiplications does the direct DFT need for N = 16? For N = 32?",
  "hint": "Each of the N bins needs N products.",
  "answer": "N = 16: 16 × 16 = 256. N = 32: 32 × 32 = 1,024. The work grows by 4 when N doubles."
}
```

```check
{
  "question": "N = 8. Which probe value sits in row k = 3, column n = 6? Which value sits in row 3, column 4?",
  "hint": "Compute kn, then the remainder mod 8. Use $W_8^2 = -i$ and $W_8^4 = -1$.",
  "answer": "Row 3, column 6: kn = 18 = 8·2 + 2, so $W_8^{18} = W_8^{2} = -i$. Row 3, column 4: kn = 12 = 8·1 + 4, so $W_8^{12} = W_8^{4} = -1$. Each full turn ($W_8^8 = 1$) changes nothing."
}
```

```check
{
  "question": "Why does the N = 8 table hold only 8 different values, although it has 64 cells?",
  "hint": "What is $W_8^8$?",
  "answer": "$W_8^8 = e^{-i2\\pi} = 1$: eight eighth-turns make one full turn. Write $kn = 8q + r$. Then $W_8^{kn} = (W_8^8)^q W_8^r = W_8^r$. The remainder r can only be 0 to 7, so only 8 values appear."
}
```

```check
{
  "question": "N = 6. How many multiplications does the direct DFT need? How many different probe values appear? Which value sits in row 4, column 5? Round to two decimals.",
  "hint": "$W_6 = e^{-i2\\pi/6}$ is one sixth of a turn clockwise (−60°).",
  "answer": "36 multiplications and 6 different values. kn = 20 = 6·3 + 2, so the cell holds $W_6^2 = e^{-i 2\\pi \\cdot 2/6} = \\cos(120°) - i\\sin(120°) = -0.5 - 0.87i$."
}
```

```check
{
  "question": "N = 8. Show that the value in row 5, column 3 is minus the value in row 1, column 3.",
  "hint": "Compute both remainders. Half a turn is $W_8^4 = -1$.",
  "answer": "Row 1: 1·3 = 3, so $W_8^3 = -0.71 - 0.71i$. Row 5: 5·3 = 15 = 8 + 7, so $W_8^7 = 0.71 + 0.71i$. The remainders differ by 4 (half a turn), so $W_8^{7} = W_8^{3} \\cdot W_8^{4} = -W_8^{3}$. Column 3 is odd, so the sign flips."
}
```

## 13. Links

- Previous: [L13: The inverse DFT](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft)
- Next: [L15: The even–odd split](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split)
- The formula: [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)
- The remainder: [F8: Clock arithmetic, log₂ and binary](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary)
- The N values on the circle: [F7: Roots of unity](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)
- The full speed comparison: [L21: Why the FFT is fast](/notes/maths/fft-signal-processing/04-fft/l21-why-it-is-fast)
- [04 FFT](/notes/maths/fft-signal-processing/04-fft)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
