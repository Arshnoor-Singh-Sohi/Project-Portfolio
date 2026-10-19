---
title: "L17: The butterfly"
order: 4
summary: "One combining step: rotate O[k] by the twiddle, then add and subtract. Trace k = 0 to 3 with real numbers and get all 8 outputs."
status: not-started
tags: [fft, butterfly, twiddle-factor, complex-multiplication]
---

## 1. The question this idea answers

Lesson [L16](/notes/maths/fft-signal-processing/04-fft/l16-two-facts) gave the pair formula:

$$
X[k] = E[k] + W_8^{k}\, O[k] \qquad X[k+4] = E[k] - W_8^{k}\, O[k], \qquad k = 0, 1, 2, 3.
$$

What does one combining step look like when you compute it with real numbers? How much does it cost? This lesson traces all four steps for the teaching signal and gets all 8 outputs. The step has a name: the **butterfly**. Every FFT is a network of butterflies (lesson L18).

## 2. Mental model

> [!analogy] A balance point
> Put E[k] at the center of a seesaw. The twiddle product t sits at a distance on one side. The two outputs sit at equal distances on the two sides of E[k]: $X[k] = E[k] + t$ and $X[k+4] = E[k] - t$. So E[k] is exactly the midpoint of the two outputs.
>
> **Where it stops working:** a seesaw is a line. The values are complex, so the two outputs sit opposite each other in a plane, not on a line. Also, a seesaw has nothing like the twiddle. Before the balance step, the butterfly turns O[k] by an angle.

## 3. Terms

| Term | Plain meaning |
|---|---|
| butterfly | One combining step: two inputs, one twiddle multiplication, one sum and one difference, two outputs. Its drawing looks like an X, or like the wings of a butterfly. |
| top input | The input that goes straight to the sum and the difference. Here: E[k]. |
| bottom input | The input that the twiddle multiplies first. Here: O[k]. |
| twiddle product t | $t = W_N^{k}\, O[k]$: the bottom input after its rotation. |
| sum output | $E[k] + t$. Here: X[k]. |
| difference output | $E[k] - t$. Here: X[k + N/2]. |
| trivial twiddle | A twiddle of 1, −1, i or −i. It only swaps or negates the real and imaginary parts, so it needs no real multiplication. |

> [!note] Rounding on this page
> $1/\sqrt{2} = 0.70710\ldots$ and $\sqrt{2} = 1.41421\ldots$. The text and the course round them to 0.71 and 1.41. The exact forms $W_8^1 = \tfrac{1}{\sqrt2}(1 - i)$ and $O[1] = \sqrt2\,(1 + i)$ give exact products.

## 4. The butterfly recipe

The inputs are E[k], O[k] and the twiddle $W_N^k$. The butterfly does three steps:

1. **Rotate.** Compute $t = W_N^{k}\, O[k]$. This is the only multiplication.
2. **Add.** Compute the sum output $E[k] + t$.
3. **Subtract.** Compute the difference output $E[k] - t$.

The cost is 1 complex multiplication, 1 complex addition and 1 complex subtraction. The result is 2 outputs.

### 4.1 Two ways to multiply complex numbers

Step 1 multiplies two complex numbers. Lesson [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) gives two methods.

1. **Parts.** $(a + bi)(c + di) = (ac - bd) + (ad + bc)\,i$, because $i^2 = -1$.
2. **Length and angle.** Multiply the lengths and add the angles.

Every twiddle has length 1. So a twiddle never changes the length of O[k]. It only turns O[k] by its angle. $W_8^k$ turns by $-45° \cdot k$, so clockwise.

## 5. Trace the four butterflies

The inputs come from lesson [L15](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split): E = [0, 2, 0, 2] and O = [0, 1.41 + 1.41i, 2, 1.41 − 1.41i].

### 5.1 k = 0

> [!example] Worked example: k = 0
> 1. Rotate: $W_8^0 = 1$ and O[0] = 0. So $t = 1 \cdot 0 = 0$.
> 2. Add: X[0] = E[0] + t = 0 + 0 = 0.
> 3. Subtract: X[4] = E[0] − t = 0 − 0 = 0.

### 5.2 k = 1

> [!example] Worked example: k = 1
> **1. Rotate.** $W_8^1 = 0.71 - 0.71i$ and $O[1] = 1.41 + 1.41i$. Use the parts method with $a = \tfrac{1}{\sqrt2}$, $b = -\tfrac{1}{\sqrt2}$, $c = \sqrt2$, $d = \sqrt2$:
>
> - Real part: $ac - bd = \tfrac{1}{\sqrt2}\sqrt2 - \left(-\tfrac{1}{\sqrt2}\right)\sqrt2 = 1 + 1 = 2$.
> - Imaginary part: $ad + bc = \tfrac{1}{\sqrt2}\sqrt2 + \left(-\tfrac{1}{\sqrt2}\right)\sqrt2 = 1 - 1 = 0$.
>
> So $t = 2$ exactly. The angle method gives the same: O[1] has length 2 and angle +45°. The twiddle turns it by −45°. The result has length 2 and angle 0°, which is the real number 2.
>
> **2. Add.** X[1] = E[1] + t = 2 + 2 = 4.
>
> **3. Subtract.** X[5] = E[1] − t = 2 − 2 = 0.

With the rounded values, the real part is $0.71 \times 1.41 + 0.71 \times 1.41 = 2.0022$. The small error of 0.0022 comes only from rounding. The exact product is 2.

![Alt text: the k = 1 butterfly, where the twiddle turns O[1] = 1.41 + 1.41i into 2, giving X[1] = 4 and X[5] = 0](/notes/media/fft-signal-processing/figures/l17-butterfly-k1.svg)

### 5.3 k = 2

> [!example] Worked example: k = 2
> **1. Rotate.** $W_8^2 = -i$ and O[2] = 2. So $t = (-i) \cdot 2 = -2i$. A multiplication by −i is a quarter turn clockwise: the point 2 on the real axis moves to −2i.
>
> **2. Add.** X[2] = E[2] + t = 0 + (−2i) = −2i.
>
> **3. Subtract.** X[6] = E[2] − t = 0 − (−2i) = 2i.

A twiddle of −i needs no real multiplication. For any value, $(c + di)(-i) = -ci - di^2 = d - ci$. So the butterfly swaps the two parts and changes one sign.

### 5.4 k = 3

> [!example] Worked example: k = 3
> **1. Rotate.** $W_8^3 = -0.71 - 0.71i$ and $O[3] = 1.41 - 1.41i$. Use $a = -\tfrac{1}{\sqrt2}$, $b = -\tfrac{1}{\sqrt2}$, $c = \sqrt2$, $d = -\sqrt2$:
>
> - Real part: $ac - bd = -1 - (+1) = -2$.
> - Imaginary part: $ad + bc = (+1) + (-1) = 0$.
>
> So $t = -2$. Angle check: O[3] has angle −45°, the twiddle adds −135°, and the result has angle −180°. Length 2 at −180° is −2.
>
> **2. Add.** X[3] = E[3] + t = 2 + (−2) = 0.
>
> **3. Subtract.** X[7] = E[3] − t = 2 − (−2) = 4.

### 5.5 All outputs

| k | E[k] | O[k] | $W_8^k$ | $t = W_8^k O[k]$ | X[k] = E[k] + t | X[k+4] = E[k] − t |
|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 1 | 0 | X[0] = 0 | X[4] = 0 |
| 1 | 2 | 1.41 + 1.41i | 0.71 − 0.71i | 2 | X[1] = 4 | X[5] = 0 |
| 2 | 0 | 2 | −i | −2i | X[2] = −2i | X[6] = 2i |
| 3 | 2 | 1.41 − 1.41i | −0.71 − 0.71i | −2 | X[3] = 0 | X[7] = 4 |

In natural order, **X = [0, 4, −2i, 0, 0, 0, 2i, 4]**. The direct DFT of lesson [L14](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft) and `np.fft.fft` give the same values.

The values have a meaning. The cosine part of the signal has amplitude 1 and puts 4 into bins 1 and 7. The sine part has amplitude 0.5 and puts −2i into bin 2 and 2i into bin 6. Lesson [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) explains how to read these numbers.

> [!key] One butterfly
> Two inputs, one twiddle multiplication, one sum and one difference, two outputs. Four butterflies combine E and O into all 8 values of X with only 4 twiddle multiplications.

### 5.6 What the four butterflies cost

The four butterflies of this lesson need 4 complex multiplications, 4 additions and 4 subtractions. Two of the twiddles are trivial: $W_8^0 = 1$ and $W_8^2 = -i$. So only k = 1 and k = 3 need real multiplications. The course counts all 4, because the general count uses N/2 multiplications for each combining step.

A useful check follows from the recipe. Add the two outputs: $X[k] + X[k+4] = 2E[k]$. Subtract them: $X[k] - X[k+4] = 2t$. For k = 1: 4 + 0 = 4 = 2 × 2, and 4 − 0 = 4 = 2 × 2.

## 6. Graphs

For k = 1, the twiddle (gold) turns O[1] (purple) clockwise by 45°. The result t = 2 (ink) lies on the real axis. Its length is still 2.

```plot
{
  "title": "k = 1: O[1] (purple), W₈¹ (gold), t = 2 (ink)",
  "xAxis": {"label": "real part", "domain": [-1.2, 3.2]},
  "yAxis": {"label": "imaginary part", "domain": [-1.0, 1.8]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 0.0], [1.4142, 1.4142]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true},
    {"points": [[1.4142, 1.4142]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true},
    {"points": [[0.0, 0.0], [0.7071, -0.7071]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.7071, -0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 0.0], [2.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[2.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

For k = 2, the twiddle −i turns O[2] = 2 by a quarter turn to t = −2i. The sum output is X[2] = −2i (ink). The difference output is X[6] = 2i (red). The two outputs sit opposite each other around E[2] = 0.

```plot
{
  "title": "k = 2: O[2] (purple), t = X[2] (ink), X[6] (red)",
  "xAxis": {"label": "real part", "domain": [-3.75, 3.75]},
  "yAxis": {"label": "imaginary part", "domain": [-2.4, 2.4]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 0.0], [2.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true},
    {"points": [[2.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true},
    {"points": [[0.0, 0.0], [0.0, -2.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, -2.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [0.0, 2.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[0.0, 2.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true}
  ]
}
```

All 8 outputs in natural order. The real parts come from the cosine part of the signal. The imaginary parts come from the sine part.

```plot
{
  "title": "X[k]: real part (ink), imaginary part (red)",
  "xAxis": {"label": "bin k", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "value", "domain": [-2.6, 4.6]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 0.0], [1.0, 4.0], [2.0, 0.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 0.0], [7.0, 4.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 4.0], [2.0, 0.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 0.0], [7.0, 4.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.0], [2.0, -2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 2.0], [7.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.0], [2.0, -2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 2.0], [7.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true}
  ]
}
```

## 7. Video

The first clip traces the k = 1 butterfly with real numbers: rotate, add, subtract.

```video
{
  "src": "/notes/media/fft-signal-processing/course/09_The_FFT_Butterfly_Algorithm.mp4",
  "start": "1:19",
  "end": "1:46",
  "caption": "k = 1: rotate O[1] by −45° to get 2, then X[1] = 4 and X[5] = 0."
}
```

The second clip names the X-shaped pattern and repeats it for k = 2.

```video
{
  "src": "/notes/media/fft-signal-processing/course/09_The_FFT_Butterfly_Algorithm.mp4",
  "start": "1:46",
  "end": "2:01",
  "caption": "The butterfly: two inputs, one twiddle multiplication, a sum and a difference. k = 2 gives −2i and 2i."
}
```

## 8. Code

Build these in a lab.

1. **One butterfly.** Write `butterfly(e, o, w)`. It returns the pair `(sum output, difference output)`. It does exactly one multiplication.
2. **The combining step.** Write `combine(E, O)`. E and O have the same length h. The function returns X of length N = 2h. It applies one butterfly for each k from 0 to h − 1, with the twiddle $W_N^k$.
3. **The count.** Add a counter to `combine` for the twiddle multiplications.

Acceptance tests:

- `butterfly(2, 1.4142135623730951 + 1.4142135623730951j, w)` with $w = W_8^1$ is close to `(4, 0)`.
- `butterfly(0, 2, -1j)` is close to `(-2j, 2j)`.
- Use E = [0, 2, 0, 2] and O = [0, √2 + √2j, 2, √2 − √2j]. Then `combine(E, O)` is close to [0, 4, −2j, 0, 0, 0, 2j, 4].
- For random x with N = 16 and N = 1024, `combine(np.fft.fft(x[0::2]), np.fft.fft(x[1::2]))` is close to `np.fft.fft(x)`.
- The counter gives N/2: 4 for N = 8, 512 for N = 1024.
- For every k, `X[k] + X[k + h]` is close to `2 * E[k]`.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/04-fft/l17-the-butterfly)

```check
{
  "question": "Hint for `combine(E, O)`: which twiddle does bin k use, and where do the two outputs go?",
  "hint": "Hint level 1 (idea): the twiddle uses the full length N = 2h, not h. The sum goes to position k, the difference to position k + h.",
  "answer": "Hint level 2 (pseudocode): h = length of E, N = 2h, X = complex array of length N. For k = 0 .. h − 1: w = exp(−i·2π·k/N), (X[k], X[k + h]) = butterfly(E[k], O[k], w). Return X."
}
```

## 9. Common mistakes

1. **Subtract O[k] instead of t.** The difference output is $E[k] - W_N^k O[k]$. Rotate first, then subtract.
2. **Two sign changes.** Use $+W_8^k$ with a minus sign, or $W_8^{k+4}$ with a plus sign. Do not use $W_8^{k+4}$ with a minus sign.
3. **A sign error in the parts method.** The real part is $ac - bd$, with a minus sign. The imaginary part is $ad + bc$.
4. **Two multiplications in one butterfly.** Compute t once and use it twice.
5. **"Rounding gives 2.0022, so the FFT is approximate."** The exact product is 2. Only the rounded display has the error.

## 10. One-minute explanation

A butterfly joins two half-size DFTs. Its inputs are E[k] and O[k], and it turns O[k] by the twiddle $W_N^k$: this is its only multiplication. Then it adds the result to E[k] to get X[k], and subtracts it from E[k] to get X[k + N/2]. For k = 1, the twiddle turns 1.41 + 1.41i by −45° to exactly 2, so X[1] = 4 and X[5] = 0. Four butterflies give all 8 outputs, and they match the direct DFT. One multiplication gives two outputs.

## 11. Check questions

```check
{
  "question": "What are the inputs and the outputs of a butterfly, and which operations does it do?",
  "hint": "Count the inputs, the multiplications and the outputs.",
  "answer": "Two inputs (E[k] and O[k]) and a twiddle $W_N^k$. One multiplication $t = W_N^k O[k]$, one addition $E[k] + t$, one subtraction $E[k] - t$. Two outputs: X[k] and X[k + N/2]."
}
```

```check
{
  "question": "A butterfly has E = 1 + i, O = 2 and the twiddle $W_8^1 = 0.71 - 0.71i$. Compute t and both outputs. Round to two decimals.",
  "hint": "A real O only scales the twiddle: t = 2 × (0.71 − 0.71i).",
  "answer": "t = 2(0.71 − 0.71i) = 1.41 − 1.41i. Sum: (1 + i) + (1.41 − 1.41i) = 2.41 − 0.41i. Difference: (1 + i) − (1.41 − 1.41i) = −0.41 + 2.41i."
}
```

```check
{
  "question": "A 4-point FFT has a butterfly with E[1] = 3, O[1] = 1 + 2i and the twiddle $W_4^1 = -i$. Compute X[1] and X[3].",
  "hint": "$(c + di)(-i) = d - ci$.",
  "answer": "t = (1 + 2i)(−i) = −i − 2i² = 2 − i. X[1] = 3 + (2 − i) = 5 − i. X[3] = 3 − (2 − i) = 1 + i."
}
```

```check
{
  "question": "For the teaching signal, X[5] is exactly 0. Explain why with the butterfly numbers.",
  "hint": "Compare t with E[1].",
  "answer": "For k = 1, the twiddle turns O[1] = √2(1 + i) to t = 2 exactly. E[1] is also 2. The difference output is E[1] − t = 2 − 2 = 0. In the plane, the arrow chain goes from 0 to 2 and back to 0."
}
```

```check
{
  "question": "Why does a twiddle of −i need no real multiplication, but $W_8^1$ does?",
  "hint": "Multiply a general value c + di by −i.",
  "answer": "$(c + di)(-i) = d - ci$: the result only swaps the parts and changes one sign. $W_8^1 = \\tfrac{1}{\\sqrt2}(1 - i)$ has the factor $1/\\sqrt2$, so the parts method needs real multiplications."
}
```

## 12. Links

- Previous: [L16: Two facts that make the FFT fast](/notes/maths/fft-signal-processing/04-fft/l16-two-facts)
- Next: [L18: Recursion and the network](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network)
- Complex multiplication: [F5: Complex numbers](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)
- Arrows tip to tail: [L12: Rotating vectors](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors)
- Reading the outputs: [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)
- [04 FFT](/notes/maths/fft-signal-processing/04-fft)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
