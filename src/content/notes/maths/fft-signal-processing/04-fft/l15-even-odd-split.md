---
title: "L15: The even–odd split"
order: 2
summary: "Split the 8 samples into even and odd halves, compute both 4-point DFTs by hand, and derive X[k] = E[k] + W_8^k·O[k]."
status: not-started
tags: [fft, even-odd-split, twiddle-factor, derivation]
---

## 1. The question this idea answers

Lesson [L14](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft) counted 64 multiplications for an 8-point DFT. It also found shared work: rows k and k + 4 of the probe table use the same products. How do we organize the sum so that this shared work appears?

The FFT starts with one simple move. It sorts the 8 samples into two groups: the samples with an even index and the samples with an odd index. Each group is a 4-sample signal. The claim of this lesson: the two 4-point DFTs build the 8-point DFT.

This lesson first computes both 4-point DFTs by hand. Then it derives the formula that joins them.

## 2. Mental model

> [!analogy] Two piles of cards
> Deal 8 cards into two piles: cards 0, 2, 4, 6 on the left and cards 1, 3, 5, 7 on the right. Each pile is a smaller job. Two small jobs are easier than one big job, so you solve each pile alone and then join the answers.
>
> **Where it stops working:** cards have no time. Samples do. The odd pile starts one time step after the even pile. So its answer has the wrong phase, and you must turn it by a rotation before you add it. That rotation is the twiddle factor.

## 3. Terms

| Term | Plain meaning |
|---|---|
| even samples | The samples with an even index: x[0], x[2], x[4], x[6]. Write them as $x[2m]$ with m = 0 to 3. |
| odd samples | The samples with an odd index: x[1], x[3], x[5], x[7]. Write them as $x[2m+1]$ with m = 0 to 3. |
| half-size DFT | A DFT of N/2 samples. For N = 8, it is a 4-point DFT. |
| $W_4$ | $e^{-i2\pi/4} = -i$: one clockwise quarter turn. The step of a 4-point DFT. |
| E[k] | The 4-point DFT of the even samples: $E[k] = \sum_{m=0}^{3} x[2m]\, W_4^{mk}$. |
| O[k] | The 4-point DFT of the odd samples: $O[k] = \sum_{m=0}^{3} x[2m+1]\, W_4^{mk}$. |
| twiddle factor | $W_N^k = e^{-i2\pi k/N}$. It turns O[k] before O[k] joins E[k]. |
| regroup | Change the order of the terms of a sum. The sum stays the same. |

> [!note] Rounding on this page
> $1/\sqrt{2} = 0.70710\ldots$ and $\sqrt{2} = 1.41421\ldots$. Tables show four decimals (0.7071, 1.4142). The text and the course round them to 0.71 and 1.41.

## 4. Sort the samples

The teaching signal is $x[n] = \cos(2\pi n/8) + 0.5\sin(2\pi \cdot 2n/8)$ with N = 8. Lesson L14 computed its 8 samples.

| n | x[n] exactly | x[n] (4 decimals) | group | new index m |
|---|---|---|---|---|
| 0 | 1 | 1 | even | 0 |
| 1 | $1/\sqrt{2} + 1/2$ | 1.2071 | odd | 0 |
| 2 | 0 | 0 | even | 1 |
| 3 | $-1/\sqrt{2} - 1/2$ | −1.2071 | odd | 1 |
| 4 | −1 | −1 | even | 2 |
| 5 | $-1/\sqrt{2} + 1/2$ | −0.2071 | odd | 2 |
| 6 | 0 | 0 | even | 3 |
| 7 | $1/\sqrt{2} - 1/2$ | 0.2071 | odd | 3 |

So the even half is e = [1, 0, −1, 0]. The odd half is o = [1.2071, −1.2071, −0.2071, 0.2071]. For the even half, n = 2m. For the odd half, n = 2m + 1.

## 5. The 4-point DFT of each half

### 5.1 The step of a 4-point DFT

A 4-point DFT uses $W_4 = e^{-i2\pi/4}$. This is a quarter turn clockwise. By Euler's formula, $W_4 = \cos(\pi/2) - i\sin(\pi/2) = 0 - i = -i$. Its powers are exact:

| power | $W_4^{0}$ | $W_4^{1}$ | $W_4^{2}$ | $W_4^{3}$ | $W_4^{4}$ |
|---|---|---|---|---|---|
| value | 1 | −i | −1 | i | 1 |

Four quarter turns make a full turn, so $W_4^4 = 1$. A larger exponent uses its remainder mod 4, as in lesson L14. For example, $W_4^{6} = W_4^{2} = -1$ and $W_4^{9} = W_4^{1} = -i$.

### 5.2 O[k]: the odd half

$$
O[k] = \sum_{m=0}^{3} o[m]\, W_4^{mk} = o[0] + o[1]\,W_4^{k} + o[2]\,W_4^{2k} + o[3]\,W_4^{3k}.
$$

Each table row is one term. The column "mk mod 4" gives the power of $W_4$.

> [!example] Worked example: O[0], O[1], O[2], O[3] with o = [1.2071, −1.2071, −0.2071, 0.2071]
> **k = 0.** Every power is $W_4^0 = 1$. So $O[0] = 1.2071 - 1.2071 - 0.2071 + 0.2071 = 0$.
>
> **k = 1.**
>
> | m | o[m] | mk mod 4 | $W_4^{mk}$ | term |
> |---|---|---|---|---|
> | 0 | 1.2071 | 0 | 1 | 1.2071 |
> | 1 | −1.2071 | 1 | −i | 1.2071i |
> | 2 | −0.2071 | 2 | −1 | 0.2071 |
> | 3 | 0.2071 | 3 | i | 0.2071i |
>
> Real parts: 1.2071 + 0.2071 = 1.4142. Imaginary parts: 1.2071 + 0.2071 = 1.4142. So $O[1] = 1.4142 + 1.4142i \approx 1.41 + 1.41i$.
>
> **k = 2.**
>
> | m | o[m] | mk mod 4 | $W_4^{mk}$ | term |
> |---|---|---|---|---|
> | 0 | 1.2071 | 0 | 1 | 1.2071 |
> | 1 | −1.2071 | 2 | −1 | 1.2071 |
> | 2 | −0.2071 | 0 | 1 | −0.2071 |
> | 3 | 0.2071 | 2 | −1 | −0.2071 |
>
> So $O[2] = 1.2071 + 1.2071 - 0.2071 - 0.2071 = 2$.
>
> **k = 3.**
>
> | m | o[m] | mk mod 4 | $W_4^{mk}$ | term |
> |---|---|---|---|---|
> | 0 | 1.2071 | 0 | 1 | 1.2071 |
> | 1 | −1.2071 | 3 | i | −1.2071i |
> | 2 | −0.2071 | 2 | −1 | 0.2071 |
> | 3 | 0.2071 | 1 | −i | −0.2071i |
>
> So $O[3] = 1.4142 - 1.4142i \approx 1.41 - 1.41i$.
>
> Result: **O = [0, 1.41 + 1.41i, 2, 1.41 − 1.41i]**.

The decimals hide exact values. Use the exact samples for O[1]:

1. Real part: $o[0] - o[2] = \left(\tfrac{1}{\sqrt2} + \tfrac12\right) - \left(-\tfrac{1}{\sqrt2} + \tfrac12\right) = \tfrac{2}{\sqrt2} = \sqrt2$.
2. Imaginary part: $-o[1] + o[3] = \left(\tfrac{1}{\sqrt2} + \tfrac12\right) + \left(\tfrac{1}{\sqrt2} - \tfrac12\right) = \sqrt2$.

So $O[1] = \sqrt{2} + \sqrt{2}\,i$ exactly. Its length is $\sqrt{2 + 2} = 2$ and its angle is +45°. Lesson L17 uses this fact.

### 5.3 E[k]: the even half

The even half is e = [1, 0, −1, 0]. Two samples are 0, so only m = 0 and m = 2 add a term:

$$
E[k] = 1 \cdot W_4^{0} + (-1)\cdot W_4^{2k} = 1 - W_4^{2k}.
$$

> [!example] Worked example: E[0] to E[3]
> | k | 2k mod 4 | $W_4^{2k}$ | $E[k] = 1 - W_4^{2k}$ |
> |---|---|---|---|
> | 0 | 0 | 1 | 0 |
> | 1 | 2 | −1 | 2 |
> | 2 | 0 | 1 | 0 |
> | 3 | 2 | −1 | 2 |
>
> Result: **E = [0, 2, 0, 2]**. All four values are exact.

These are the values in chapter 9 of the course. Two 4-point DFTs cost 2 × 16 = 32 multiplications. But they give only 4 values each, and X has 8 values. The next section joins them.

## 6. Derive the split

Start from the 8-point DFT with $W_8 = e^{-i2\pi/8}$ (lesson L14):

$$
X[k] = \sum_{n=0}^{7} x[n]\, W_8^{kn}.
$$

**Step 1: regroup the terms.** Every n from 0 to 7 is even or odd. Write each even n as 2m and each odd n as 2m + 1, with m = 0 to 3. Each n appears exactly once, and the order of addition does not change a sum. So

$$
X[k] = \sum_{m=0}^{3} x[2m]\, W_8^{2mk} + \sum_{m=0}^{3} x[2m+1]\, W_8^{(2m+1)k}.
$$

Nothing has changed yet. These are the same 8 terms in a new order.

**Step 2: split the odd exponent.** The rule $W^{a+b} = W^a W^b$ holds for powers of one number. So $W_8^{(2m+1)k} = W_8^{2mk + k} = W_8^{2mk}\, W_8^{k}$.

**Step 3: move the twiddle outside.** The factor $W_8^k$ does not depend on m. It is the same in all 4 odd terms. The distributive law $ab + ac = a(b + c)$ moves it outside the sum:

$$
\sum_{m=0}^{3} x[2m+1]\, W_8^{2mk}\, W_8^{k} = W_8^{k} \sum_{m=0}^{3} x[2m+1]\, W_8^{2mk}.
$$

**Step 4: two eighth turns make a quarter turn.**

$$
W_8^{2} = e^{-i2\pi \cdot 2/8} = e^{-i2\pi/4} = W_4.
$$

So $W_8^{2mk} = \left(W_8^{2}\right)^{mk} = W_4^{mk}$. Both sums now use the step of a 4-point DFT.

**Step 5: name the two sums.**

$$
X[k] = \underbrace{\sum_{m=0}^{3} x[2m]\, W_4^{mk}}_{E[k]} \; + \; W_8^{k} \underbrace{\sum_{m=0}^{3} x[2m+1]\, W_4^{mk}}_{O[k]}.
$$

> [!key] The even–odd split
> $$
> X[k] = E[k] + W_8^{k}\, O[k]
> $$
> X[k] is the DFT of the even half plus the DFT of the odd half turned by the twiddle factor $W_8^k$. For any even N: $X[k] = E[k] + W_N^{k}\, O[k]$, with E and O of size N/2.

> [!trap] $W_8^2 = W_4$, but $W_8 \neq W_4$
> $W_8$ is an eighth turn (−45°). $W_4$ is a quarter turn (−90°). Only two eighth turns make one quarter turn.

### 6.1 Check the formula with numbers

> [!example] Worked example: X[0] and X[1]
> - k = 0: $W_8^0 = 1$. So $X[0] = E[0] + O[0] = 0 + 0 = 0$.
> - k = 1: $W_8^1 = 0.71 - 0.71i$. So $X[1] = E[1] + W_8^1\, O[1] = 2 + (0.71 - 0.71i)(1.41 + 1.41i)$.
>
> Use the exact forms: $W_8^1 = \tfrac{1}{\sqrt2}(1 - i)$ and $O[1] = \sqrt2\,(1 + i)$. Then
>
> $$
> W_8^1\, O[1] = (1 - i)(1 + i) = 1 + i - i - i^2 = 1 + 1 = 2.
> $$
>
> So X[1] = 2 + 2 = 4. The direct DFT of lesson L14 also gave X[1] = 4.

The products of the direct method show the same split. In the X[1] table of lesson L14, the even columns add to 1 + 0 + 1 + 0 = 2. This is E[1]. The odd columns add to (0.8536 − 0.8536i) + (0.8536 + 0.8536i) + (0.1464 − 0.1464i) + (0.1464 + 0.1464i) = 2. This is $W_8^1\,O[1]$.

> [!trap] Do not forget the twiddle factor
> Without the twiddle, the odd half has the wrong phase. $E[1] + O[1] = 2 + 1.41 + 1.41i = 3.41 + 1.41i$. The correct value is $E[1] + W_8^1\,O[1] = 4$.

The formula holds for every k from 0 to 7. But this lesson computed E[k] and O[k] only for k = 0 to 3. Lesson L16 shows what E[k] and O[k] are for k = 4 to 7.

## 7. Graphs

The blue curve is the teaching signal. The ink dots are the even samples. The purple dots are the odd samples.

```plot
{
  "title": "Signal (blue), even samples (ink), odd samples (purple)",
  "xAxis": {"label": "sample number n", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "x[n]", "domain": [-1.6, 1.6]},
  "disableZoom": true,
  "data": [
    {"fn": "cos(0.7854*x) + 0.5*sin(1.5708*x)", "color": "#1E6091"},
    {"points": [[0.0, 1.0], [2.0, 0.0], [4.0, -1.0], [6.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[1.0, 1.2071], [3.0, -1.2071], [5.0, -0.2071], [7.0, 0.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true}
  ]
}
```

After the split, each half is a 4-sample signal with its own index m.

```plot
{
  "title": "The two halves as 4-sample signals: even (ink) and odd (purple)",
  "xAxis": {"label": "new index m", "domain": [-0.5, 3.5]},
  "yAxis": {"label": "sample value", "domain": [-1.6, 1.6]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 1.0], [1.0, 0.0], [2.0, -1.0], [3.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 0.0], [2.0, -1.0], [3.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 1.2071], [1.0, -1.2071], [2.0, -0.2071], [3.0, 0.2071]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true},
    {"points": [[0.0, 1.2071], [1.0, -1.2071], [2.0, -0.2071], [3.0, 0.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true}
  ]
}
```

O[1] is the sum of 4 terms. Draw them as arrows, tip to tail (lesson [L12](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors)). The terms are 1.2071, 1.2071i, 0.2071 and 0.2071i. The chain ends at 1.41 + 1.41i.

```plot
{
  "title": "O[1]: 4 terms tip to tail (purple), sum (ink)",
  "xAxis": {"label": "real part", "domain": [-0.5, 2.5]},
  "yAxis": {"label": "imaginary part", "domain": [-0.2, 1.7]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 0.0], [1.2071, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true},
    {"points": [[1.2071, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true},
    {"points": [[1.2071, 0.0], [1.2071, 1.2071]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true},
    {"points": [[1.2071, 1.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true},
    {"points": [[1.2071, 1.2071], [1.4142, 1.2071]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true},
    {"points": [[1.4142, 1.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true},
    {"points": [[1.4142, 1.2071], [1.4142, 1.4142]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true},
    {"points": [[1.4142, 1.4142]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true},
    {"points": [[0.0, 0.0], [1.4142, 1.4142]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[1.4142, 1.4142]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

## 8. Video

The first clip sorts the samples and states the claim. It also introduces the short name $W_N$.

```video
{
  "src": "/notes/media/fft-signal-processing/course/09_The_FFT_Butterfly_Algorithm.mp4",
  "start": "0:00",
  "end": "0:24",
  "caption": "Sort the 8 samples into even and odd. Claim: two 4-point DFTs build the 8-point DFT."
}
```

The second clip does the algebra of section 6. Pause at the boxed result $X[k] = E[k] + W_8^k O[k]$.

```video
{
  "src": "/notes/media/fft-signal-processing/course/09_The_FFT_Butterfly_Algorithm.mp4",
  "start": "0:24",
  "end": "0:50",
  "caption": "Regroup the sum, use W8² = W4, and name E[k] and O[k]."
}
```

## 9. Code

Build these in a lab. Use your `my_dft(x)` from lesson L11 for the half-size DFTs.

1. **The split.** Write `split_even_odd(x)`. It returns the two halves `(even, odd)`.
2. **The first half of X.** Write `combine_first_half(x)`. It computes E and O with `my_dft`, then returns $X[k] = E[k] + W_N^k\, O[k]$ for k = 0 to N/2 − 1 only.
3. **The regrouped sum.** For the teaching signal and k = 1, add the even terms of the direct DFT. Then add its odd terms. Compare the two sums with E[1] and $W_8^1 O[1]$.

Acceptance tests:

- `split_even_odd([0, 1, 2, 3, 4, 5, 6, 7])` gives `([0, 2, 4, 6], [1, 3, 5, 7])`.
- For the teaching signal, `my_dft(even)` is close to [0, 2, 0, 2], and `my_dft(odd)` is close to [0, 1.4142+1.4142j, 2, 1.4142−1.4142j].
- For the teaching signal, `combine_first_half(x)` is close to [0, 4, −2j, 0].
- For random x with N = 16 and N = 64, `np.allclose(combine_first_half(x), np.fft.fft(x)[:N//2])` is True.
- In task 3, the even sum is close to 2 and the odd sum is close to 2.

NumPy slices with a step give the two halves:

```python
x[0::2]   # start at 0, take every second sample
x[1::2]   # start at 1, take every second sample
```

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/04-fft/l15-even-odd-split)

```check
{
  "question": "Hint for `combine_first_half(x)`: what are the steps?",
  "hint": "Hint level 1 (idea): two half-size DFTs, then one twiddle factor for each k from 0 to N/2 − 1.",
  "answer": "Hint level 2 (pseudocode): N = length of x. E = my_dft(even half). O = my_dft(odd half). For k = 0 .. N/2 − 1: w = exp(−i·2π·k/N), result[k] = E[k] + w·O[k]. Return result. Note: the twiddle uses N, not N/2."
}
```

## 10. Common mistakes

1. **No twiddle factor.** $E[k] + O[k]$ is wrong. The odd half starts one time step later, so it needs $W_8^k$.
2. **$W_8 = W_4$.** Only $W_8^2 = W_4$. One eighth turn is not one quarter turn.
3. **The twiddle of the half size.** The twiddle is $W_N^k$ of the full size N, not $W_{N/2}^k$.
4. **"The split changes the DFT."** Step 1 only regroups the same 8 terms. The result is exactly the same DFT.
5. **"E and O are 8 values long."** A 4-point DFT gives 4 values: k = 0 to 3. Lesson L16 explains k = 4 to 7.

## 11. One-minute explanation

The FFT starts with a sort: the samples with an even index form one half, and the samples with an odd index form the other. Each half has a 4-point DFT: E[k] for the even half and O[k] for the odd half. To join them, regroup the 8-point DFT sum into even terms and odd terms, and move the common factor $W_8^k$ out of the odd sum. Two eighth turns make a quarter turn, so $W_8^2 = W_4$, and both sums become 4-point DFTs. The result is $X[k] = E[k] + W_8^k O[k]$. The twiddle factor fixes the phase of the odd half, which starts one time step later.

## 12. Check questions

```check
{
  "question": "Why is $W_8^2 = W_4$? Answer in words and with the exponent.",
  "hint": "$W_8$ is an eighth turn. What do two eighth turns make?",
  "answer": "Two eighth turns make one quarter turn. With the exponent: $W_8^2 = e^{-i2\\pi \\cdot 2/8} = e^{-i2\\pi/4} = W_4 = -i$."
}
```

```check
{
  "question": "Compute O[2] for the teaching signal by hand. The odd samples are o = [1.2071, −1.2071, −0.2071, 0.2071].",
  "hint": "For k = 2, the powers $W_4^{2m}$ are 1, −1, 1, −1.",
  "answer": "$O[2] = 1.2071\\cdot 1 + (-1.2071)(-1) + (-0.2071)\\cdot 1 + 0.2071\\cdot(-1) = 1.2071 + 1.2071 - 0.2071 - 0.2071 = 2$."
}
```

```check
{
  "question": "In the derivation, why can $W_8^k$ move outside the odd sum, but $W_8^{2mk}$ cannot?",
  "hint": "Which one changes when m changes?",
  "answer": "The sum runs over m. $W_8^k$ does not contain m, so it is the same in all 4 terms, and the distributive law moves it outside. $W_8^{2mk}$ changes with m, so it must stay inside the sum."
}
```

```check
{
  "question": "x = [1, 0, 0, 0, 0, 1, 0, 0] (N = 8). Find E[1] and O[1] by hand. Then compute $X[1] = E[1] + W_8^1 O[1]$. Round to two decimals.",
  "hint": "Even half [1, 0, 0, 0]. Odd half [x1, x3, x5, x7] = [0, 0, 1, 0]. Use $W_4^{2} = -1$.",
  "answer": "E[k] = 1 for every k, so E[1] = 1. O[k] = $1 \\cdot W_4^{2k}$, so O[1] = $W_4^2 = -1$. Then $X[1] = 1 + (0.71 - 0.71i)(-1) = 1 - 0.71 + 0.71i = 0.29 + 0.71i$. Check with the direct DFT: $X[1] = x[0] + x[5]\\,W_8^{5} = 1 + (-0.71 + 0.71i) = 0.29 + 0.71i$."
}
```

```check
{
  "question": "N = 16. Write the split formula for X[k]. What size are E and O? Which power of $W_{16}$ equals $W_8$?",
  "hint": "Replace 8 by 16 in every step of the derivation.",
  "answer": "$X[k] = E[k] + W_{16}^{k}\\,O[k]$. E and O are 8-point DFTs of the 8 even and the 8 odd samples. $W_{16}^2 = e^{-i2\\pi \\cdot 2/16} = e^{-i2\\pi/8} = W_8$."
}
```

## 13. Links

- Previous: [L14: The cost of the direct DFT](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft)
- Next: [L16: Two facts that make the FFT fast](/notes/maths/fft-signal-processing/04-fft/l16-two-facts)
- The formula that this lesson splits: [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)
- Arrows tip to tail: [L12: Rotating vectors](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors)
- Powers of $W_N$: [F7: Roots of unity](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)
- [04 FFT](/notes/maths/fft-signal-processing/04-fft)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
