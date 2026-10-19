---
title: "L16: Two facts that make the FFT fast"
order: 3
summary: "E and O repeat with period N/2, and the twiddle for k + N/2 is minus the twiddle for k. Together they give X[k+4] = E[k] − W_8^k·O[k]."
status: not-started
tags: [fft, periodicity, twiddle-factor, butterfly]
---

## 1. The question this idea answers

Lesson [L15](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split) derived $X[k] = E[k] + W_8^k\, O[k]$. The formula holds for every k from 0 to 7. But E and O are 4-point DFTs, and lesson L15 computed them only for k = 0 to 3. What are E[4] to E[7] and O[4] to O[7]? And what are the twiddle factors $W_8^4$ to $W_8^7$?

Two facts answer both questions. They also cut the work: one twiddle product gives two outputs. Without these facts, the split of lesson L15 is not faster than the direct DFT.

## 2. Mental model

> [!analogy] A four-hour clock and a compass needle
> Fact 1 is a clock with only 4 positions. After 4 steps, the hand is back at its start. So bin k + 4 of a 4-point DFT shows the same value as bin k.
>
> Fact 2 is a compass needle that turns in eighth turns. Four more eighth turns point the needle in the opposite direction. So the twiddle for k + 4 is the twiddle for k, reversed.
>
> **Where it stops working:** the clock and the needle have different periods. E and O repeat after 4 bins. The twiddle repeats only after 8 bins: after 4 bins it changes sign. So X itself does not repeat after 4 bins.

## 3. Terms

| Term | Plain meaning |
|---|---|
| periodic | A list is periodic with period P when the value at k + P equals the value at k, for every k. |
| period of E and O | N/2. A DFT of N/2 points repeats after N/2 bins: $E[k + N/2] = E[k]$. |
| half turn | A turn of 180°. In the complex plane, a half turn is a multiplication by −1. |
| sign flip of the twiddle | $W_N^{k + N/2} = -W_N^{k}$: the twiddle for k + N/2 is the negative of the twiddle for k. |
| pair formula | $X[k] = E[k] + W_N^k O[k]$ and $X[k + N/2] = E[k] - W_N^k O[k]$, for k = 0 to N/2 − 1. |
| twiddle product | The product $W_N^k\, O[k]$. The pair formula uses it twice. |

> [!note] Rounding on this page
> $1/\sqrt{2} = 0.70710\ldots$ and $\sqrt{2} = 1.41421\ldots$. The text and the course round them to 0.71 and 1.41.

## 4. Fact 1: E and O repeat with period 4

### 4.1 The proof

Start from the definition of E at bin k + 4:

$$
E[k+4] = \sum_{m=0}^{3} x[2m]\, W_4^{m(k+4)}.
$$

1. Expand the exponent: $m(k + 4) = mk + 4m$.
2. Split the power: $W_4^{mk + 4m} = W_4^{mk}\, W_4^{4m}$.
3. Group the second factor: $W_4^{4m} = \left(W_4^{4}\right)^{m}$.
4. Four quarter turns make one full turn: $W_4^4 = e^{-i2\pi} = 1$. So $W_4^{4m} = 1^m = 1$.

| m | 4m | $W_4^{4m}$ |
|---|---|---|
| 0 | 0 | 1 |
| 1 | 4 | 1 |
| 2 | 8 | 1 |
| 3 | 12 | 1 |

Every extra factor is 1. So

$$
E[k+4] = \sum_{m=0}^{3} x[2m]\, W_4^{mk} \cdot 1 = E[k].
$$

The same steps work for O, because O uses the same powers of $W_4$. So $O[k+4] = O[k]$.

In words: the probe of bin k + 4 makes extra full turns. Sample m gets m extra full turns. A full turn changes nothing, so the probe lands on the same values.

### 4.2 Check with numbers

> [!example] Worked example: E[5] and O[5] straight from the definition
> **E[5].** Lesson L15 found $E[k] = 1 - W_4^{2k}$ for the even half [1, 0, −1, 0]. For k = 5: 2k = 10 and 10 mod 4 = 2. So $E[5] = 1 - W_4^{2} = 1 - (-1) = 2$. This equals E[1] = 2.
>
> **O[5].** The powers are $W_4^{5m}$. For m = 0, 1, 2, 3, the exponents 5m are 0, 5, 10, 15. Their remainders mod 4 are 0, 1, 2, 3. These are the same powers as for k = 1. So O[5] = O[1] = 1.41 + 1.41i.

The full lists for k = 0 to 7:

| k | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| E[k] | 0 | 2 | 0 | 2 | 0 | 2 | 0 | 2 |
| O[k] | 0 | 1.41 + 1.41i | 2 | 1.41 − 1.41i | 0 | 1.41 + 1.41i | 2 | 1.41 − 1.41i |

For any even N, the same proof gives $E[k + N/2] = E[k]$ and $O[k + N/2] = O[k]$. The key step is $W_{N/2}^{N/2} = 1$.

## 5. Fact 2: the twiddle changes sign after half a circle

### 5.1 The proof

1. Split the power: $W_8^{k+4} = W_8^{k}\, W_8^{4}$.
2. Four eighth turns make half a turn: $W_8^4 = e^{-i2\pi \cdot 4/8} = e^{-i\pi}$.
3. Euler's formula gives $e^{-i\pi} = \cos\pi - i\sin\pi = -1 - 0i = -1$.

So

$$
W_8^{k+4} = -\,W_8^{k}.
$$

### 5.2 Check with numbers

| k | $W_8^{k}$ (rounded) | $W_8^{k+4}$ (rounded) | sum |
|---|---|---|---|
| 0 | 1 | −1 | 0 |
| 1 | 0.71 − 0.71i | −0.71 + 0.71i | 0 |
| 2 | −i | i | 0 |
| 3 | −0.71 − 0.71i | 0.71 + 0.71i | 0 |

Each pair adds to 0, so each value in the third column is the negative of the value in the second column. On the unit circle, the two points sit exactly opposite each other.

For any even N, $W_N^{N/2} = e^{-i\pi} = -1$. So $W_N^{k + N/2} = -W_N^{k}$.

> [!trap] The twiddle has period 8, not 4
> $W_8^{5} \neq W_8^{1}$. $W_8^5 = -W_8^1$. The twiddle returns to its start only after 8 steps: $W_8^{k+8} = W_8^k$.

## 6. Together: one multiplication, two outputs

Write the split formula of lesson L15 at bin k + 4, for k = 0 to 3:

$$
X[k+4] = E[k+4] + W_8^{k+4}\, O[k+4].
$$

1. Fact 1 replaces E[k + 4] by E[k] and O[k + 4] by O[k].
2. Fact 2 replaces $W_8^{k+4}$ by $-W_8^{k}$.

$$
X[k+4] = E[k] + \left(-W_8^{k}\right) O[k] = E[k] - W_8^{k}\, O[k].
$$

> [!key] The pair formula
> For k = 0, 1, 2, 3:
> $$
> X[k] = E[k] + W_8^{k}\, O[k] \qquad X[k+4] = E[k] - W_8^{k}\, O[k]
> $$
> Both outputs use the same twiddle product $W_8^k O[k]$. One multiplication gives two outputs.

> [!example] Worked example: the pairs k = 1 and k = 2
> **k = 1.** Lesson L15 computed $W_8^1 O[1] = 2$ exactly. So X[1] = 2 + 2 = 4 and X[5] = 2 − 2 = 0.
>
> **k = 2.** $W_8^2 = -i$ and O[2] = 2. So $W_8^2 O[2] = -2i$. Then X[2] = 0 + (−2i) = −2i and X[6] = 0 − (−2i) = 2i.
>
> The direct DFT gives X = [0, 4, −2i, 0, 0, 0, 2i, 4]. All four values match.

The pair formula is the same pattern that lesson [L14](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft) found in the probe table. There, row k + 4 equals row k at the even columns and has the opposite sign at the odd columns. The even columns build E. The odd columns build $W_8^k O$.

> [!trap] X does not repeat with period 4
> E and O repeat, but X does not. X[1] = 4 and X[5] = 0. The term $W_8^k O[k]$ enters X[k] with a plus sign and X[k + 4] with a minus sign.

## 7. How much work do the two facts save?

Count the complex multiplications for N = 8. A direct 4-point DFT costs 4 × 4 = 16.

| Method | Multiplications for N = 8 |
|---|---|
| Direct DFT (lesson L14) | 8 × 8 = 64 |
| Split, but E and O computed for k = 0 to 7, and 8 twiddle products | 2 × (8 × 4) + 8 = 72 |
| Split with fact 1: E and O for k = 0 to 3 only, 8 twiddle products | 2 × 16 + 8 = 40 |
| Split with facts 1 and 2: 4 twiddle products, each used twice | 2 × 16 + 4 = 36 |
| Split again and again (lesson L18) | 12 |

The split alone costs more than the direct DFT. Fact 1 halves the work of E and O. Fact 2 halves the number of twiddle products. For a general even N, one split with both facts costs $2 (N/2)^2 + N/2 = N^2/2 + N/2$ multiplications. This is about half of $N^2$. Lesson [L18](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network) applies the split again inside E and O.

## 8. Graphs

The gold dots are $W_8^0$ to $W_8^3$. The red dots are $W_8^4$ to $W_8^7$. Each red dot sits opposite its gold partner. The lines mark the pair $W_8^1$ and $W_8^5$.

```plot
{
  "title": "W₈⁰ to W₈³ (gold) and W₈⁴ to W₈⁷ (red)",
  "xAxis": {"label": "real part", "domain": [-2.05, 2.05]},
  "yAxis": {"label": "imaginary part", "domain": [-1.3, 1.3]},
  "disableZoom": true,
  "data": [
    {"points": [[1.0, 0.0], [0.9962, 0.0872], [0.9848, 0.1736], [0.9659, 0.2588], [0.9397, 0.342], [0.9063, 0.4226], [0.866, 0.5], [0.8192, 0.5736], [0.766, 0.6428], [0.7071, 0.7071], [0.6428, 0.766], [0.5736, 0.8192], [0.5, 0.866], [0.4226, 0.9063], [0.342, 0.9397], [0.2588, 0.9659], [0.1736, 0.9848], [0.0872, 0.9962], [0.0, 1.0], [-0.0872, 0.9962], [-0.1736, 0.9848], [-0.2588, 0.9659], [-0.342, 0.9397], [-0.4226, 0.9063], [-0.5, 0.866], [-0.5736, 0.8192], [-0.6428, 0.766], [-0.7071, 0.7071], [-0.766, 0.6428], [-0.8192, 0.5736], [-0.866, 0.5], [-0.9063, 0.4226], [-0.9397, 0.342], [-0.9659, 0.2588], [-0.9848, 0.1736], [-0.9962, 0.0872], [-1.0, 0.0], [-0.9962, -0.0872], [-0.9848, -0.1736], [-0.9659, -0.2588], [-0.9397, -0.342], [-0.9063, -0.4226], [-0.866, -0.5], [-0.8192, -0.5736], [-0.766, -0.6428], [-0.7071, -0.7071], [-0.6428, -0.766], [-0.5736, -0.8192], [-0.5, -0.866], [-0.4226, -0.9063], [-0.342, -0.9397], [-0.2588, -0.9659], [-0.1736, -0.9848], [-0.0872, -0.9962], [0.0, -1.0], [0.0872, -0.9962], [0.1736, -0.9848], [0.2588, -0.9659], [0.342, -0.9397], [0.4226, -0.9063], [0.5, -0.866], [0.5736, -0.8192], [0.6428, -0.766], [0.7071, -0.7071], [0.766, -0.6428], [0.8192, -0.5736], [0.866, -0.5], [0.9063, -0.4226], [0.9397, -0.342], [0.9659, -0.2588], [0.9848, -0.1736], [0.9962, -0.0872], [1.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[1.0, 0.0], [0.7071, -0.7071], [0.0, -1.0], [-0.7071, -0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[-1.0, 0.0], [-0.7071, 0.7071], [0.0, 1.0], [0.7071, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true},
    {"points": [[0.0, 0.0], [0.7071, -0.7071]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.7071, -0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 0.0], [-0.7071, 0.7071]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[-0.7071, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true}
  ]
}
```

E[k] and the real part of O[k] repeat every 4 bins.

```plot
{
  "title": "E[k] (ink) and real part of O[k] (purple)",
  "xAxis": {"label": "bin k", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "value", "domain": [-0.5, 2.5]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 0.0], [1.0, 2.0], [2.0, 0.0], [3.0, 2.0], [4.0, 0.0], [5.0, 2.0], [6.0, 0.0], [7.0, 2.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 2.0], [2.0, 0.0], [3.0, 2.0], [4.0, 0.0], [5.0, 2.0], [6.0, 0.0], [7.0, 2.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 1.4142], [2.0, 2.0], [3.0, 1.4142], [4.0, 0.0], [5.0, 1.4142], [6.0, 2.0], [7.0, 1.4142]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 1.4142], [2.0, 2.0], [3.0, 1.4142], [4.0, 0.0], [5.0, 1.4142], [6.0, 2.0], [7.0, 1.4142]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true}
  ]
}
```

## 9. Video

The clip starts with the cost of the two half-size DFTs. Then it shows fact 1, fact 2, and the result: one multiplication, two outputs.

```video
{
  "src": "/notes/media/fft-signal-processing/course/09_The_FFT_Butterfly_Algorithm.mp4",
  "start": "0:50",
  "end": "1:19",
  "caption": "Two half-size DFTs cost 32 multiplications. Two facts let one twiddle product give two outputs."
}
```

## 10. Code

Build these in a lab. Use your `my_dft(x)` from lesson L11.

1. **A DFT at any bin.** Write `dft_at(x, k)`. It evaluates $\sum_n x[n]\, e^{-i2\pi kn/N}$ for any whole number k, also for k ≥ N.
2. **Test fact 1.** For a random x with N = 16, compare `dft_at(x, k)` with `dft_at(x, k + 16)` for k = 0 to 15. Then do the same for its even half with k and k + 8.
3. **Test fact 2.** Write `twiddle(N, k)` that returns $e^{-i2\pi k/N}$. Test that `twiddle(N, k + N//2)` is close to `-twiddle(N, k)`.
4. **One split with both facts.** Write `fft_one_split(x)`. It computes E and O with `my_dft`, then fills all N outputs with the pair formula. It also returns the number of complex multiplications.

Acceptance tests:

- In task 2, every pair agrees: `np.allclose` is True.
- In task 3, the test passes for N = 8, 16 and 1024, and for every k from 0 to N/2 − 1.
- `fft_one_split(x)` is close to `np.fft.fft(x)` for random x with N = 8, 16 and 64.
- For the teaching signal, `fft_one_split(x)` is close to [0, 4, −2j, 0, 0, 0, 2j, 4].
- The multiplication count is $N^2/2 + N/2$: 36 for N = 8, 136 for N = 16, 2,080 for N = 64.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/04-fft/l16-two-facts)

```check
{
  "question": "Hint for `fft_one_split(x)`: how do you fill the second half of the output?",
  "hint": "Hint level 1 (idea): compute each twiddle product once and store it. Then use it with a plus sign and with a minus sign.",
  "answer": "Hint level 2 (pseudocode): E = my_dft(even half), O = my_dft(odd half), h = N/2. For k = 0 .. h − 1: t = twiddle(N, k)·O[k] (one multiplication), X[k] = E[k] + t, X[k + h] = E[k] − t. The count is the work of the two my_dft calls (2·h·h) plus h twiddle products."
}
```

## 11. Common mistakes

1. **"X repeats like E."** E and O repeat with period N/2. X does not, because the twiddle term changes sign.
2. **"The twiddle repeats with period 4."** For N = 8, the twiddle repeats with period 8. After 4 steps it changes sign.
3. **A second twiddle product for X[k + 4].** $W_8^{k+4} O[k+4] = -W_8^k O[k]$. Reuse the first product and subtract it.
4. **The wrong half-turn power.** The half turn is $W_N^{N/2} = -1$, not $W_N^{N} = 1$ (a full turn).
5. **"The split alone makes the DFT fast."** Without the two facts, one split costs 72 multiplications for N = 8, more than 64.

## 12. One-minute explanation

After the even–odd split, $X[k] = E[k] + W_8^k O[k]$, with E and O of 4 points. Fact 1: a 4-point DFT repeats after 4 bins, because the probe of bin k + 4 only adds full turns. So E[k + 4] = E[k] and O[k + 4] = O[k]. Fact 2: four more eighth turns are half a circle, so the twiddle for k + 4 is minus the twiddle for k. Together they give $X[k+4] = E[k] - W_8^k O[k]$. So the FFT computes each twiddle product once and uses it for two outputs, once with a plus sign and once with a minus sign.

## 13. Check questions

```check
{
  "question": "State the two facts of this lesson for a general even N.",
  "hint": "One fact is about E and O. The other is about the twiddle.",
  "answer": "Fact 1: E and O are DFTs of N/2 points, so they repeat with period N/2: $E[k + N/2] = E[k]$ and $O[k + N/2] = O[k]$. Fact 2: $W_N^{k + N/2} = -W_N^{k}$, because $W_N^{N/2} = e^{-i\\pi} = -1$ (half a turn)."
}
```

```check
{
  "question": "E[0] = 0 and O[0] = 0. What are X[0] and X[4]?",
  "hint": "Use the pair formula with k = 0 and $W_8^0 = 1$.",
  "answer": "$X[0] = E[0] + W_8^0 O[0] = 0 + 1 \\cdot 0 = 0$. $X[4] = E[0] - W_8^0 O[0] = 0 - 0 = 0$. Both are 0."
}
```

```check
{
  "question": "E[3] = 2, O[3] = 1.41 − 1.41i and $W_8^3 = -0.71 - 0.71i$. Compute $W_8^3 O[3]$, then X[3] and X[7].",
  "hint": "Use the exact forms $W_8^3 = -\\frac{1}{\\sqrt2}(1 + i)$ and $O[3] = \\sqrt2\\,(1 - i)$.",
  "answer": "$W_8^3 O[3] = -\\frac{1}{\\sqrt2}(1+i)\\cdot\\sqrt2\\,(1-i) = -(1+i)(1-i) = -(1 - i^2) = -2$. So $X[3] = 2 + (-2) = 0$ and $X[7] = 2 - (-2) = 4$."
}
```

```check
{
  "question": "E repeats with period 4, but X[1] = 4 and X[5] = 0. Why does X not repeat?",
  "hint": "Compare the twiddle factors of bin 1 and bin 5.",
  "answer": "X[k] = E[k] + (twiddle)·O[k]. E and O repeat, but the twiddle for bin 5 is $W_8^5 = -W_8^1$. So the term $W_8^1 O[1] = 2$ enters X[1] with a plus sign (2 + 2 = 4) and X[5] with a minus sign (2 − 2 = 0)."
}
```

```check
{
  "question": "N = 16. Use fact 2 to find $W_{16}^{10}$ from $W_{16}^{2} = 0.71 - 0.71i$. Then count the multiplications of one split with both facts.",
  "hint": "N/2 = 8, and 10 = 2 + 8.",
  "answer": "$W_{16}^{10} = W_{16}^{2 + 8} = -W_{16}^{2} = -0.71 + 0.71i$. One split: two 8-point DFTs cost 2 × 64 = 128, plus 8 twiddle products. Total 136, against 256 for the direct DFT."
}
```

## 14. Links

- Previous: [L15: The even–odd split](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split)
- Next: [L17: The butterfly](/notes/maths/fft-signal-processing/04-fft/l17-the-butterfly)
- The sign pattern in the probe table: [L14: The cost of the direct DFT](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft)
- Half and full turns: [F7: Roots of unity](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)
- Euler's formula: [F6: Euler's formula](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)
- [04 FFT](/notes/maths/fft-signal-processing/04-fft)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
