---
title: "L13: The inverse DFT"
order: 7
summary: "Rebuild the samples from the coefficients with x[n] = (1/N)·Σ X[k]·e^(+i2πkn/N): why the 1/N, why the plus sign, why the result is real, and the round trip in NumPy."
status: not-started
tags: [dft, inverse-dft, round-trip, basis]
---

## 1. The question this idea answers

The DFT ([L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)) changes 8 samples into 8 coefficients. For the teaching signal:

x = [1, 1.21, 0, −1.21, −1, −0.21, 0, 0.21] → X = [0, 4, −2i, 0, 0, 0, 2i, 4]

Can we return from X to x? If we can, the DFT loses no information. Then we can change a signal in the frequency domain (for example, remove a noise frequency) and return to samples.

Lesson [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality) already gave the idea. The DFT patterns $e_k$ form an orthogonal basis, and X[k]/N are the coordinates of x in that basis. To rebuild x, add the patterns with these amounts. This lesson writes that idea as a formula and computes it by hand.

## 2. Mental model

> [!analogy] A recipe and the cooking
> The spectrum is a recipe: "this much of pattern 1, this much of pattern 2, …". The inverse DFT cooks the recipe again: it mixes the patterns in those amounts, and the result is the original signal.
>
> **Where it stops working:** you cannot reverse cooking, and a recipe uses only positive amounts. You can reverse the DFT exactly, apart from tiny computer rounding. Its amounts are complex numbers: each one also carries a phase.

## 3. Terms

| Term | Plain meaning |
|---|---|
| inverse DFT | The formula that rebuilds the samples from the coefficients: $x[n] = \frac{1}{N}\sum_k X[k]\, e^{+i 2\pi k n/N}$. |
| round trip | A forward DFT followed by an inverse DFT. It returns the original samples. |
| conjugate pair | Two bins k and N − k of a real signal. Their coefficients are conjugates: $X[N-k] = \overline{X[k]}$. |
| floating-point error | The tiny error of computer arithmetic, about $10^{-16}$ for one operation on numbers near 1. |

## 4. The formula

$$
x[n] = \frac{1}{N}\sum_{k=0}^{N-1} X[k]\, e^{+i 2\pi k n / N}, \qquad n = 0, 1, \dots, N-1
$$

Compare it with the forward DFT:

| | forward DFT | inverse DFT |
|---|---|---|
| input | samples x[n] | coefficients X[k] |
| loop variable of the sum | n | k |
| sign in the exponent | minus: clockwise | plus: counterclockwise |
| factor in front | none | 1/N |
| NumPy | `np.fft.fft` | `np.fft.ifft` |

**In words:** for each sample number n, add the N patterns $e_k[n]$, each multiplied by its coefficient X[k]. Then divide by N.

## 5. Why the 1/N

### The view from L9

The coordinate of x along the pattern $e_k$ is the score divided by the squared length. The score is X[k], and the squared length of every complex pattern is N. So the coordinate is X[k]/N, and x is the sum of the patterns with these coordinates:

$$
x[n] = \sum_{k=0}^{N-1} \frac{X[k]}{N}\, e_k[n] = \frac{1}{N}\sum_{k=0}^{N-1} X[k]\, e^{+i 2\pi k n/N}
$$

The forward DFT does not divide by N. So the inverse must do it.

### The view from a round trip

Put the forward formula into the inverse formula. Use m for the sample number inside X[k]. The letter n stays for the sample that we rebuild.

1. Substitute: $\sum_{k} e^{+i 2\pi k n/N} \sum_{m} x[m]\, e^{-i 2\pi k m/N}$.
2. Change the order of the two sums, and join the exponents: $\sum_{m} x[m] \sum_{k} e^{+i 2\pi k (n-m)/N}$.
3. The inner sum adds N points on the unit circle. When m = n, every point is 1, and the sum is N. When m ≠ n, the points spread evenly around the circle, and the sum is 0 ([F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)).
4. So only the term m = n remains: the result is $N \cdot x[n]$.

The forward DFT followed by the sum of step 1 gives N times the samples. Division by N gives the samples back.

> [!example] Without the 1/N
> Rebuild x[0] without the factor: 0 + 4 + (−2i) + 0 + 0 + 0 + 2i + 4 = 8. The true value is x[0] = 1 = 8/8.

## 6. Why the plus sign

1. **The patterns turn counterclockwise.** The basis patterns of L9 are $e_k[n] = e^{+i 2\pi k n/N}$. To rebuild x, add the patterns themselves.
2. **The forward DFT used their conjugates.** The complex dot product conjugates the pattern, so the forward probe is $e^{-i 2\pi k n/N}$ ([L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe)).
3. **The plus sign undoes the minus sign.** For one angle α, $e^{-i\alpha} \cdot e^{+i\alpha} = e^{0} = 1$. Step 3 of the round trip uses exactly this fact when m = n.

If a library puts the plus sign in its forward transform, it puts the minus sign in its inverse. The pair must match.

## 7. Rebuild three samples by hand

Use X = [0, 4, −2i, 0, 0, 0, 2i, 4]. Only bins 1, 2, 6 and 7 are not 0, so only four terms of each sum can be not 0.

> [!note] Rounding on this page
> The tables show two decimals, as the course video does: $\sqrt{2} = 1.4142\dots$ shows as 1.41, and $1/\sqrt{2} = 0.7071\dots$ shows as 0.71. The sums come from the exact values.

### x[0]

At n = 0, every pattern value is $e^0 = 1$.

| k | X[k] | $e^{+i 2\pi k \cdot 0/8}$ | X[k]·$e^{+i 2\pi k \cdot 0/8}$ |
|---|---|---|---|
| 0 | $0$ | $1$ | $0$ |
| 1 | $4$ | $1$ | $4$ |
| 2 | $-2i$ | $1$ | $-2i$ |
| 3 | $0$ | $1$ | $0$ |
| 4 | $0$ | $1$ | $0$ |
| 5 | $0$ | $1$ | $0$ |
| 6 | $2i$ | $1$ | $2i$ |
| 7 | $4$ | $1$ | $4$ |
| **sum** | | | **$8$** |

So $x[0] = \frac{1}{8}(4 - 2i + 2i + 4) = \frac{8}{8} = 1$.

### x[1]

At n = 1, the pattern value of bin k is $e^{+i 2\pi k/8}$: the angle is +45° · k.

| k | X[k] | $e^{+i 2\pi k \cdot 1/8}$ | X[k]·$e^{+i 2\pi k \cdot 1/8}$ |
|---|---|---|---|
| 0 | $0$ | $1$ | $0$ |
| 1 | $4$ | $0.71 + 0.71i$ | $2.83 + 2.83i$ |
| 2 | $-2i$ | $i$ | $2$ |
| 3 | $0$ | $-0.71 + 0.71i$ | $0$ |
| 4 | $0$ | $-1$ | $0$ |
| 5 | $0$ | $-0.71 - 0.71i$ | $0$ |
| 6 | $2i$ | $-i$ | $2$ |
| 7 | $4$ | $0.71 - 0.71i$ | $2.83 - 2.83i$ |
| **sum** | | | **$9.66$** |

Compute the four terms that are not 0:

1. k = 1: $4 \cdot e^{i\pi/4} = 4\left(\tfrac{\sqrt{2}}{2} + \tfrac{\sqrt{2}}{2}i\right) = 2\sqrt{2} + 2\sqrt{2}\,i = 2.83 + 2.83i$.
2. k = 2: $(-2i) \cdot e^{i\pi/2} = (-2i) \cdot i = -2i^2 = 2$, because $i^2 = -1$.
3. k = 6: $(2i) \cdot e^{i 3\pi/2} = (2i) \cdot (-i) = -2i^2 = 2$.
4. k = 7: $4 \cdot e^{i 7\pi/4} = 4\left(\tfrac{\sqrt{2}}{2} - \tfrac{\sqrt{2}}{2}i\right) = 2.83 - 2.83i$.

Add: the imaginary parts cancel, and the real parts give $2\sqrt{2} + 2 + 2 + 2\sqrt{2} = 4 + 4\sqrt{2} = 9.66$. Divide by 8:

$$
x[1] = \frac{4 + 4\sqrt{2}}{8} = \frac{1 + \sqrt{2}}{2} = 1.2071
$$

This is the exact value of x[1] from L7.

### x[2]

At n = 2, the angle is +90° · k, so the pattern values are 1, i, −1, −i, and then they repeat.

| k | X[k] | $e^{+i 2\pi k \cdot 2/8}$ | X[k]·$e^{+i 2\pi k \cdot 2/8}$ |
|---|---|---|---|
| 0 | $0$ | $1$ | $0$ |
| 1 | $4$ | $i$ | $4i$ |
| 2 | $-2i$ | $-1$ | $2i$ |
| 3 | $0$ | $-i$ | $0$ |
| 4 | $0$ | $1$ | $0$ |
| 5 | $0$ | $i$ | $0$ |
| 6 | $2i$ | $-1$ | $-2i$ |
| 7 | $4$ | $-i$ | $-4i$ |
| **sum** | | | **$0$** |

The four terms are 4i, 2i, −2i and −4i. They sum to 0. So x[2] = 0/8 = 0.

## 8. Why the result is real

In general, every coefficient except X[0] and X[4] can be complex, and the patterns are complex. But the rebuilt samples are real. The reason is the conjugate pairs.

1. For a real signal, $X[N-k] = \overline{X[k]}$ (L11, section 11). Here $X[7] = \overline{X[1]} = 4$ and $X[6] = \overline{X[2]} = 2i$.
2. The patterns of a pair are also conjugates: $e_{N-k}[n] = \overline{e_k[n]}$.
3. So the two terms of a pair are conjugates of each other: $X[N-k]\, e_{N-k}[n] = \overline{X[k]\, e_k[n]}$.
4. A complex number plus its conjugate is real: $z + \overline{z} = 2\,\text{Re}(z)$. The imaginary parts cancel.
5. X[0] and X[N/2] are real, and their patterns are real (all 1, or 1, −1, 1, −1, …). So these terms are real too.

Check with the numbers of x[1]: the pair (1, 7) gives $(2.83 + 2.83i) + (2.83 - 2.83i) = 5.66$. The pair (2, 6) gives 2 + 2 = 4. Both are real.

Each pair rebuilds one wave of the signal:

1. Pair (1, 7): $\frac{1}{8}(4\,e_1 + 4\,e_7) = \cos(2\pi n/8)$, the cosine with amplitude 1.
2. Pair (2, 6): $\frac{1}{8}(-2i\,e_2 + 2i\,e_6) = 0.5\sin(2\pi \cdot 2n/8)$, the sine with amplitude 0.5.

> [!trap] Change both bins of a pair
> If you change only one bin of a pair, the result is no longer real. For example, set only X[7] to 0 and invert. NumPy then gives $x[1] = 0.85 + 0.35i$. To remove the 1-cycle cosine, set **both** X[1] and X[7] to 0. Then the inverse gives [0, 0.5, 0, −0.5, 0, 0.5, 0, −0.5]: only the sine remains.

## 9. The round trip in NumPy

NumPy uses the same convention as these notes. `np.fft.fft` has no 1/N, and `np.fft.ifft` has the 1/N and the plus sign. So a round trip returns the samples:

```python
x_back = np.fft.ifft(np.fft.fft(x))
```

For the teaching signal, NumPy gives a largest error of about $2 \times 10^{-16}$. For 1024 random samples, the largest error is about $1.3 \times 10^{-15}$. These errors are floating-point errors, not errors of the method.

Two practical points:

1. `np.fft.ifft` returns a complex array, even for a real result. The imaginary parts are 0 or about $10^{-16}$.
2. Compare with `np.allclose`, not with `==`. Take the real part only after you check that the imaginary parts are tiny.

> [!key] The DFT loses nothing
> The forward DFT gives the N coordinates of the signal in the frequency basis (times N). The inverse DFT adds the N patterns with those coordinates. Because the patterns are orthogonal, the round trip returns the exact samples, apart from floating-point error.

## 10. Graphs

The two conjugate pairs each rebuild one real wave. Their sum is the teaching signal:

```plot
{
  "title": "Bins 1 and 7 rebuild cos(2πn/8) (gold). Bins 2 and 6 rebuild 0.5·sin(2π·2n/8) (ink). Their sum is x[n] (blue).",
  "xAxis": {"label": "sample number n", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "value", "domain": [-1.6, 1.6]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 1.0], [1.0, 0.7071], [2.0, 0.0], [3.0, -0.7071], [4.0, -1.0], [5.0, -0.7071], [6.0, 0.0], [7.0, 0.7071]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 0.7071], [2.0, 0.0], [3.0, -0.7071], [4.0, -1.0], [5.0, -0.7071], [6.0, 0.0], [7.0, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.5], [2.0, 0.0], [3.0, -0.5], [4.0, 0.0], [5.0, 0.5], [6.0, 0.0], [7.0, -0.5]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.5], [2.0, 0.0], [3.0, -0.5], [4.0, 0.0], [5.0, 0.5], [6.0, 0.0], [7.0, -0.5]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 1.2071], [2.0, 0.0], [3.0, -1.2071], [4.0, -1.0], [5.0, -0.2071], [6.0, 0.0], [7.0, 0.2071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 1.2071], [2.0, 0.0], [3.0, -1.2071], [4.0, -1.0], [5.0, -0.2071], [6.0, 0.0], [7.0, 0.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true}
  ]
}
```

## 11. Video

Watch the last part of chapter 4: rebuilding the signal from the patterns is the inverse DFT.

```video
{
  "src": "/notes/media/fft-signal-processing/course/04_Basis_Functions.mp4",
  "start": "1:02",
  "end": "1:10",
  "caption": "Rebuilding the signal from the patterns is the inverse DFT. X[k]/N are the coordinates."
}
```

## 12. Code

Write the function `my_idft(X)`.

1. Input: a 1-D sequence of N complex coefficients.
2. Output: a complex NumPy array of N samples.
3. Use two nested for-loops: the outer loop over n, the inner loop over k. Do not call `np.fft` inside the function.

Acceptance tests, with your `my_dft` from L11:

1. Teaching signal: `np.allclose(my_idft([0, 4, -2j, 0, 0, 0, 2j, 4]), x)` is True.
2. Round trip: for 5 random real inputs of lengths 1, 2, 7, 8 and 16, `np.allclose(my_idft(my_dft(r)), r)` is True.
3. Round trip for a random complex input of length 8 is True too.
4. For a random complex `Z` of length 16: `np.allclose(my_idft(Z), np.fft.ifft(Z))` is True.
5. Real result: for a random real `r`, `np.max(np.abs(my_idft(my_dft(r)).imag)) < 1e-12` is True.
6. One bin: for N = 8, the inverse of the list with 8 at position 1 and 0 elsewhere equals `np.exp(2j * np.pi * np.arange(8) / 8)`. This is the pattern $e_1$.
7. Filter: set X[1] and X[7] of the teaching signal to 0, invert, and check that the result equals `0.5 * np.sin(2 * np.pi * 2 * n / 8)`.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft)

```check
{
  "question": "Stuck on `my_idft`? Use the hint first.",
  "hint": "Compare the inverse formula with the forward formula. Which three things change?",
  "answer": "Idea: the inverse has the same double loop as `my_dft`, with three changes. The outer loop is over n and the inner sum is over k. The exponent has a plus sign. The function divides the result for each n by N."
}
```

## 13. Common mistakes

1. **No 1/N, or 1/N twice.** With NumPy's convention, the 1/N belongs only to the inverse. Without it, the result is N times too large. With 1/N in both directions, it is N times too small.
2. **The wrong sign in the inverse.** With a minus sign in both directions, the round trip reverses the order of the samples. You get x[0], x[N−1], …, x[1]. (Change the sign of the exponent: n becomes −n.)
3. **Only one bin of a pair changed.** The result is complex. Change bin k and bin N − k together.
4. **An exact zero expected for the imaginary part.** Floating-point arithmetic leaves parts near $10^{-16}$. Use `np.allclose`.
5. **The real part taken without a check.** `x.real` hides a bug that makes the imaginary part large. Check the imaginary part first.

## 14. One-minute explanation

The inverse DFT rebuilds the samples from the coefficients: $x[n] = \frac{1}{N}\sum_k X[k]\, e^{+i 2\pi k n/N}$. The DFT patterns are an orthogonal basis, and X[k]/N are the coordinates of the signal in that basis. So we add each pattern times its coordinate. The 1/N is there because the forward DFT does not divide by the squared length N of the patterns. The plus sign is there because the patterns themselves turn counterclockwise, and the forward DFT used their conjugates. For a real signal, the bins come in conjugate pairs, and each pair adds to a real wave. For the teaching signal, bins 1 and 7 rebuild the cosine, and bins 2 and 6 rebuild the sine. A forward DFT followed by an inverse DFT returns the samples, with only floating-point error near $10^{-16}$.

## 15. Check questions

```check
{
  "question": "Write the inverse DFT. Name the two differences from the forward DFT.",
  "hint": "One difference is a factor. The other is a sign.",
  "answer": "$x[n] = \\frac{1}{N}\\sum_{k=0}^{N-1} X[k]\\, e^{+i 2\\pi k n/N}$. Differences: the factor 1/N in front, and the plus sign in the exponent. The sum also runs over k instead of n."
}
```

```check
{
  "question": "Rebuild x[4] of the teaching signal from X = [0, 4, −2i, 0, 0, 0, 2i, 4].",
  "hint": "At n = 4, the pattern value of bin k is $e^{i\\pi k}$, which is 1 for even k and −1 for odd k.",
  "answer": "Terms: k = 1: 4 × (−1) = −4. k = 2: (−2i) × 1 = −2i. k = 6: (2i) × 1 = 2i. k = 7: 4 × (−1) = −4. Sum: −4 − 2i + 2i − 4 = −8. So x[4] = −8/8 = −1, the value from L7."
}
```

```check
{
  "question": "N = 4 and X = [0, 2, 0, 2]. Find x by hand.",
  "hint": "For N = 4 the pattern value of bin k at sample n is $i^{kn}$.",
  "answer": "x[n] = ¼(2·iⁿ + 2·i³ⁿ). n = 0: ¼(2 + 2) = 1. n = 1: ¼(2i + 2(−i)) = 0. n = 2: ¼(2(−1) + 2(−1)) = −1. n = 3: ¼(2(−i) + 2i) = 0. So x = [1, 0, −1, 0], a cosine with 1 cycle. This is the input of the 4-point DFT check question of L11."
}
```

```check
{
  "question": "Why does the inverse DFT need the factor 1/N?",
  "hint": "What is the squared length of a complex DFT pattern?",
  "answer": "Each complex pattern has squared length N (each of its N values has size 1). The coordinate along a pattern is the score divided by the squared length: X[k]/N. The forward DFT gives only the score X[k], so the inverse must divide by N. Without it, the round trip gives N times the samples."
}
```

```check
{
  "question": "The coefficients X[1], X[2], X[6] and X[7] are complex. Why are the rebuilt samples real?",
  "hint": "Look for pairs of bins.",
  "answer": "For a real signal, X[N − k] is the conjugate of X[k]. The pattern of bin N − k is also the conjugate of the pattern of bin k. So the two terms of a pair are conjugates, and their sum is twice the real part. The imaginary parts cancel in each pair."
}
```

```check
{
  "question": "You set X[1] = X[7] = 0 in the spectrum of the teaching signal and invert. What samples does the inverse DFT give? What did you do to the signal?",
  "hint": "Each pair rebuilds one wave.",
  "answer": "Pair (1, 7) rebuilt the cosine. Without it, only pair (2, 6) remains: 0.5·sin(2π·2n/8) = [0, 0.5, 0, −0.5, 0, 0.5, 0, −0.5]. You removed the 1-cycle cosine and kept the 2-cycle sine. This is a filter in the frequency domain."
}
```

## 16. Links

- Previous lesson: [L12: Rotating vectors](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors)
- Next lesson: [L14: The cost of the direct DFT](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft)
- Part: [03 Matching to DFT](/notes/maths/fft-signal-processing/03-matching-to-dft)
- The basis view: [L9: Basis and orthogonality](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality)
- Math tools: [F5: Complex numbers](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers), [F7: Roots of unity](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)
- Later: [L24: The mirror](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror), [L32: The convolution theorem](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem), [L35: The inverse STFT](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
