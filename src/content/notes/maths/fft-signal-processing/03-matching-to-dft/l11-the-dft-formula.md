---
title: "L11: The DFT formula"
order: 5
summary: "Every symbol of X[k] = Σ x[n]·e^(−i2πkn/N), the full tables for bins 1, 3 and 2 of the teaching signal, all 8 bins, and why a wave with amplitude A gives |X[k]| = A·N/2."
status: not-started
tags: [dft, formula, spectrum, magnitude]
---

## 1. The question this idea answers

Lesson [L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe) built one complex score for one probe frequency k. Lesson [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) showed that we must try every k from 0 to N − 1.

Put the two ideas together, and you have the **Discrete Fourier Transform (DFT)**. This lesson answers four questions:

1. What does each symbol of the formula mean?
2. How do you compute a bin by hand, one row at a time?
3. How does $\lvert X[k] \rvert$ relate to the amplitude of a wave?
4. Why do bins 6 and 7 of the teaching signal have values, when the signal has no 6-cycle or 7-cycle part?

## 2. Mental model

> [!analogy] A piano with the dampers lifted
> Lift the dampers of a piano and sing one note into it. The strings that match your note ring. The other strings stay quiet. The DFT is a row of N strings, one for each bin k. Each string "rings" with the size of its complex score.
>
> **Where it stops working:** a real piano string also rings for notes near its own pitch and for its harmonics. It also rings over time. The DFT compares the whole fixed list of N samples at once. It gives clean answers only for waves that make a whole number of cycles in the N samples. Lesson L25 shows what happens to other waves.

## 3. Terms

| Term | Plain meaning |
|---|---|
| DFT | Discrete Fourier Transform. It changes N samples x[n] into N complex coefficients X[k]. |
| bin k | One output position of the DFT. k is the number of cycles that its probe makes over the N samples. |
| coefficient X[k] | The complex score of bin k. |
| probe value | One value of the complex probe: $e^{-i 2\pi k n/N}$. It is a point on the unit circle. |
| term | One product $x[n]\, e^{-i 2\pi k n/N}$. A bin is the sum of N terms. |
| spectrum | The list of all N coefficients X[0], …, X[N − 1]. |
| magnitude spectrum | The list of the magnitudes $\lvert X[0] \rvert, \dots, \lvert X[N-1] \rvert$. |
| unnormalized | The forward DFT does not divide by N. NumPy uses the same convention. |

## 4. The formula, one symbol at a time

$$
X[k] = \sum_{n=0}^{N-1} x[n]\, e^{-i 2\pi k n / N}, \qquad k = 0, 1, \dots, N-1
$$

| Symbol | Meaning | Teaching signal |
|---|---|---|
| $N$ | The number of samples | 8 |
| $n$ | The sample number: the loop variable of the sum | 0 to 7 |
| $x[n]$ | Sample n of the signal | 1, 1.21, 0, … |
| $k$ | The bin: the number of cycles of the probe over the N samples | 0 to 7 |
| $2\pi$ | One full turn, in radians | |
| $kn/N$ | The number of turns of the probe after n samples | k = 1, n = 2: 2/8 = a quarter turn |
| $-i$ | The probe turns clockwise (L10) | |
| $e^{-i 2\pi k n/N}$ | The probe value: a point on the unit circle at angle $-2\pi k n/N$ | k = 1, n = 2: $e^{-i\pi/2} = -i$ |
| $\sum_{n=0}^{N-1}$ | Add the N terms ([F3](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation)) | |
| $X[k]$ | The complex coefficient of bin k | X[1] = 4 |

**In words:** for each k, multiply every sample by the k-cycle probe, then add.

In degrees, the probe angle is $-360° \cdot kn/N$. For N = 8, it is $-45° \cdot kn$.

The DFT has N bins, and each bin has N terms. So the direct DFT needs N × N = N² complex multiplications. For N = 8 that is 64. Lesson [L14](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft) shows why this cost matters.

> [!note] Rounding on this page
> The tables show values rounded to two decimals, as the course video does. So $1/\sqrt{2} = 0.7071\dots$ shows as 0.71, and $\sqrt{2} = 1.4142\dots$ shows as 1.41. Every value comes from the exact numbers. We round only at the end.

## 5. The probe values for k = 1

For k = 1 the angle at sample n is $-45° \cdot n$. Euler's formula ([F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)) gives each value: $e^{-i\alpha} = \cos\alpha - i\sin\alpha$.

> [!example] The probe value at n = 1
> 1. Angle: $2\pi \cdot 1 \cdot 1/8 = \pi/4$ rad = 45°. The probe uses −45°.
> 2. $e^{-i\pi/4} = \cos 45° - i \sin 45° = 0.7071 - 0.7071i$.
> 3. Rounded: $0.71 - 0.71i$.

The 8 values are 1, $0.71 - 0.71i$, $-i$, $-0.71 - 0.71i$, $-1$, $-0.71 + 0.71i$, $i$, $0.71 + 0.71i$. They are 8 points on the unit circle, 45° apart, in clockwise order.

## 6. Bin k = 1: the terms reinforce

Multiply each sample by its probe value. A real number times a complex number scales both parts ([F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)).

| n | x[n] | probe $e^{-i 2\pi \cdot 1 \cdot n/8}$ | product x[n]·probe |
|---|---|---|---|
| 0 | 1.00 | $1$ | $1$ |
| 1 | 1.21 | $0.71 - 0.71i$ | $0.85 - 0.85i$ |
| 2 | 0.00 | $-i$ | $0$ |
| 3 | −1.21 | $-0.71 - 0.71i$ | $0.85 + 0.85i$ |
| 4 | −1.00 | $-1$ | $1$ |
| 5 | −0.21 | $-0.71 + 0.71i$ | $0.15 - 0.15i$ |
| 6 | 0.00 | $i$ | $0$ |
| 7 | 0.21 | $0.71 + 0.71i$ | $0.15 + 0.15i$ |
| **sum** | | | **X[1] = $4$** |

> [!example] The term at n = 1
> We need $x[1] \cdot e^{-i\pi/4}$.
>
> 1. Exact values: $x[1] = \frac{1+\sqrt{2}}{2}$ and $e^{-i\pi/4} = \frac{\sqrt{2}}{2}(1 - i)$.
> 2. Product: $\frac{1+\sqrt{2}}{2} \cdot \frac{\sqrt{2}}{2} = \frac{\sqrt{2} + 2}{4} = 0.8536$. So the term is $0.8536 - 0.8536i$.
> 3. Rounded: $0.85 - 0.85i$.
>
> With the rounded inputs, $1.21 \times 0.71 = 0.8591$, which rounds to 0.86. The difference comes only from rounding before the multiplication. Python gives $0.8535533905932737 - 0.8535533905932736i$.

Now add the last column. Add the real parts and the imaginary parts separately:

1. Real parts: 1 + 0.85 + 0 + 0.85 + 1 + 0.15 + 0 + 0.15 = 4.
2. Imaginary parts: −0.85 + 0 + 0.85 + 0 − 0.15 + 0 + 0.15 = 0.
3. So X[1] = 4 + 0i = 4.

The imaginary parts cancel in pairs: n = 1 with n = 3, and n = 5 with n = 7. The real parts are all 0 or positive, so they reinforce.

## 7. Bin k = 3: the terms cancel

For k = 3 the angle at sample n is $-135° \cdot n$. So the probe jumps by 135° clockwise at each step, and it makes 3 full turns over the 8 samples.

| n | x[n] | probe $e^{-i 2\pi \cdot 3 \cdot n/8}$ | product x[n]·probe |
|---|---|---|---|
| 0 | 1.00 | $1$ | $1$ |
| 1 | 1.21 | $-0.71 - 0.71i$ | $-0.85 - 0.85i$ |
| 2 | 0.00 | $i$ | $0$ |
| 3 | −1.21 | $0.71 - 0.71i$ | $-0.85 + 0.85i$ |
| 4 | −1.00 | $-1$ | $1$ |
| 5 | −0.21 | $0.71 + 0.71i$ | $-0.15 - 0.15i$ |
| 6 | 0.00 | $-i$ | $0$ |
| 7 | 0.21 | $-0.71 + 0.71i$ | $-0.15 + 0.15i$ |
| **sum** | | | **X[3] = $0$** |

1. Real parts: 1 − 0.85 + 0 − 0.85 + 1 − 0.15 + 0 − 0.15 = 0.
2. Imaginary parts: −0.85 + 0 + 0.85 + 0 − 0.15 + 0 + 0.15 = 0.
3. So X[3] = 0. No 3-cycle wave is present.

## 8. Bin k = 2: the hidden sine

For k = 2 the angle at sample n is $-90° \cdot n$. So the probe values are 1, −i, −1, i, and then they repeat.

| n | x[n] | probe $e^{-i 2\pi \cdot 2 \cdot n/8}$ | product x[n]·probe |
|---|---|---|---|
| 0 | 1.00 | $1$ | $1$ |
| 1 | 1.21 | $-i$ | $-1.21i$ |
| 2 | 0.00 | $-1$ | $0$ |
| 3 | −1.21 | $i$ | $-1.21i$ |
| 4 | −1.00 | $1$ | $-1$ |
| 5 | −0.21 | $-i$ | $0.21i$ |
| 6 | 0.00 | $-1$ | $0$ |
| 7 | 0.21 | $i$ | $0.21i$ |
| **sum** | | | **X[2] = $-2i$** |

1. Real parts: 1 + 0 + 0 + 0 − 1 + 0 + 0 + 0 = 0.
2. Imaginary parts: −1.21 − 1.21 + 0.21 + 0.21 = −2.
3. So X[2] = 0 − 2i = −2i. Magnitude 2, phase −90°.

This is the 2-cycle sine that the cosine probe missed in L8. The phase −90° says that it is a sine (L10).

> [!note] A detail in the video
> At 1:08 the video says that every term of bin 2 is purely imaginary. Two terms are real: 1 at n = 0 and −1 at n = 4. They cancel. So the **sum** is purely imaginary, but not every term.

## 9. All 8 bins

The same method for every k gives the full spectrum. NumPy (`np.fft.fft`) gives the same values.

| k | X[k] | $\lvert X[k] \rvert$ | phase of X[k] | what it means |
|---|---|---|---|---|
| 0 | $0$ | 0 | not defined (X = 0) | no constant part (the average of x[n] is 0) |
| 1 | $4$ | 4 | 0° | the 1-cycle cosine, A = 1 |
| 2 | $-2i$ | 2 | −90° | the 2-cycle sine, A = 0.5 |
| 3 | $0$ | 0 | not defined (X = 0) | nothing |
| 4 | $0$ | 0 | not defined (X = 0) | nothing |
| 5 | $0$ | 0 | not defined (X = 0) | nothing |
| 6 | $2i$ | 2 | 90° | mirror of bin 2 (L24) |
| 7 | $4$ | 4 | 0° | mirror of bin 1 (L24) |

So X = [0, 4, −2i, 0, 0, 0, 2i, 4].

1. **k = 0.** Every probe value is 1, so X[0] is the plain sum of the samples: 0.
2. **k = 4.** The probe values are 1, −1, 1, −1, … The terms are 1, −1.21, 0, 1.21, −1, 0.21, 0, −0.21. They sum to 0.
3. **k = 5.** The mirror of bin 3, so it is 0 (section 11).
4. **k = 6 and k = 7.** The mirrors of bins 2 and 1 (section 11).

Only the two waves that we put in give values that are not 0: bins 1 and 2. Their mirrors are bins 7 and 6.

## 10. Magnitude = A·N/2

The table shows $\lvert X[1] \rvert = 4$ for the cosine with amplitude 1, and $\lvert X[2] \rvert = 2$ for the sine with amplitude 0.5. In both cases:

$$
\lvert X[k] \rvert = A \cdot \frac{N}{2}
$$

1. Cosine: $1 \times 8/2 = 4$.
2. Sine: $0.5 \times 8/2 = 2$.

### Why the rule is true

Take one wave $A\cos(\theta_n + \varphi)$ with $\theta_n = 2\pi k n/N$. It makes k whole cycles in the N samples, with 0 < k < N/2.

1. Euler's formula gives $\cos\alpha = \frac{1}{2}\left(e^{i\alpha} + e^{-i\alpha}\right)$. So the wave is two rotating parts:
$$
A\cos(\theta_n + \varphi) = \frac{A}{2}e^{i\varphi}\, e^{i\theta_n} + \frac{A}{2}e^{-i\varphi}\, e^{-i\theta_n}
$$
2. Multiply by the probe $e^{-i\theta_n}$. Exponents add when you multiply:
$$
\frac{A}{2}e^{i\varphi} \cdot 1 \;+\; \frac{A}{2}e^{-i\varphi}\, e^{-i 2\theta_n}
$$
3. Add over n. The first part is the same at every sample, so it adds N times: $\frac{A}{2}e^{i\varphi} \cdot N$.
4. The second part turns 2k whole turns over the N samples. Its N values sum to 0 ([F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)), because 2k is not 0 and not a multiple of N.
5. So $X[k] = \frac{AN}{2}e^{i\varphi}$, and $\lvert X[k] \rvert = \frac{AN}{2}$.

To read an amplitude from a bin, reverse the rule: $A = 2\lvert X[k] \rvert / N$. Lesson [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) uses this rule with real units.

> [!trap] Two bins follow a different rule
> At k = 0 and k = N/2, step 4 fails: 2k is 0 or N. Then both parts land in the same bin, and $\lvert X[k] \rvert = A \cdot N$. For example, a constant 1 gives X[0] = 8, and $\cos(\pi n)$ = [1, −1, 1, −1, …] gives X[4] = 8.

> [!trap] The rule needs whole cycles
> The rule $\lvert X[k] \rvert = AN/2$ is exact only when the wave makes a whole number of cycles in the N samples. Otherwise the wave spreads into many bins (L25).

## 11. Why bins 6 and 7 have values

The teaching signal has no 7-cycle part. But X[7] = 4. The reason is step 1 of section 10: a real cosine is two rotating parts.

1. The cosine part $\cos(2\pi n/8)$ is $\tfrac{1}{2}e^{+i 2\pi n/8} + \tfrac{1}{2}e^{-i 2\pi n/8}$.
2. The second rotating part turns clockwise once. At the samples it is equal to a counterclockwise part with 7 cycles: $e^{-i 2\pi n/8} = e^{-i 2\pi n/8} \cdot e^{i 2\pi n} = e^{+i 2\pi \cdot 7n/8}$. The factor $e^{i 2\pi n}$ is 1, because n is a whole number.
3. So the first part lands in bin 1, and the second part lands in bin 7. Each half has the size $\tfrac{1}{2} \times 8 = 4$.

The same argument puts half of the sine into bin 2 and half into bin 6. For every real signal, the two bins of a pair are conjugates: $X[N-k] = \overline{X[k]}$. Here $X[7] = \overline{4} = 4$ and $X[6] = \overline{-2i} = 2i$. Lesson [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror) studies this mirror.

> [!key] What the DFT does
> For each bin k, the DFT multiplies every sample by a k-cycle clockwise probe and adds the N terms. A wave that makes k whole cycles gives $X[k] = \frac{AN}{2}e^{i\varphi}$: the magnitude gives the amplitude, and the angle gives the phase. Every other whole-cycle wave cancels in this bin.

## 12. Graphs

The magnitude spectrum of the teaching signal. Bins 1 and 2 hold the two waves, and bins 7 and 6 hold their mirrors:

```plot
{
  "title": "Magnitude |X[k]| of the teaching signal (ink): 4 at k = 1 and 7, 2 at k = 2 and 6",
  "xAxis": {"label": "bin k", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "|X[k]|", "domain": [-0.5, 5]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 0], [0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[1, 0], [1, 4.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[2, 0], [2, 2.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[3, 0], [3, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[4, 0], [4, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[5, 0], [5, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[6, 0], [6, 2.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[7, 0], [7, 4.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 4.0], [2.0, 2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 2.0], [7.0, 4.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

The real part and the imaginary part of each bin. The cosine shows in the real part (bins 1 and 7). The sine shows in the imaginary part (bins 2 and 6), with opposite signs:

```plot
{
  "title": "Real part of X[k] (gold) and imaginary part of X[k] (ink)",
  "xAxis": {"label": "bin k", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "value", "domain": [-3, 5]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 0.0], [1.0, 4.0], [2.0, 0.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 0.0], [7.0, 4.0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 4.0], [2.0, 0.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 0.0], [7.0, 4.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.0], [2.0, -2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 2.0], [7.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.0], [2.0, -2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 2.0], [7.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

## 13. Video

Watch the formula appear one symbol at a time, then the formula in words.

```video
{
  "src": "/notes/media/fft-signal-processing/course/06_The_Discrete_Fourier_Transform.mp4",
  "start": "0:00",
  "end": "0:30",
  "caption": "Every symbol of the DFT has a plain meaning."
}
```

Watch the part about the minus sign. Moving it to the inverse swaps bins k and −k.

```video
{
  "src": "/notes/media/fft-signal-processing/course/06_The_Discrete_Fourier_Transform.mp4",
  "start": "0:30",
  "end": "0:41",
  "caption": "The minus sign is a convention used by NumPy, MATLAB and FFTW."
}
```

Watch the table for bin 1. Compare each row with the table of section 6.

```video
{
  "src": "/notes/media/fft-signal-processing/course/06_The_Discrete_Fourier_Transform.mp4",
  "start": "0:41",
  "end": "0:59",
  "caption": "Bin 1: multiply each sample by its probe value, then add. X[1] = 4."
}
```

Watch bin 3. The terms cancel completely.

```video
{
  "src": "/notes/media/fft-signal-processing/course/06_The_Discrete_Fourier_Transform.mp4",
  "start": "0:59",
  "end": "1:08",
  "caption": "Bin 3: the same procedure with a 3-cycle probe gives X[3] = 0."
}
```

Watch bin 2. Look for the two real terms that cancel (see the note in section 8).

```video
{
  "src": "/notes/media/fft-signal-processing/course/06_The_Discrete_Fourier_Transform.mp4",
  "start": "1:08",
  "end": "1:18",
  "caption": "Bin 2: the terms add to −2i, with magnitude 2 and phase −90°."
}
```

Watch all 8 bins. Check the rule magnitude = amplitude × N/2.

```video
{
  "src": "/notes/media/fft-signal-processing/course/06_The_Discrete_Fourier_Transform.mp4",
  "start": "1:18",
  "end": "1:26",
  "caption": "All 8 bins: only the two input waves (and their mirrors) are not zero. Magnitude = amplitude × N/2."
}
```

## 14. Code

Write the function `my_dft(x)`.

1. Input: a 1-D sequence of N numbers (real or complex).
2. Output: a complex NumPy array of length N, with X[k] at position k.
3. Use two nested for-loops: the outer loop over k, the inner loop over n. Do not call `np.fft` inside the function.

The probe value is one NumPy call. Use radians:

```python
np.exp(-2j * np.pi * k * n / N)
```

Acceptance tests:

1. For 5 random real inputs with N = 1, 2, 7, 8 and 16: `np.allclose(my_dft(x), np.fft.fft(x))` is True.
2. For a random complex input of length 8: `np.allclose(my_dft(z), np.fft.fft(z))` is True.
3. Teaching signal: `np.allclose(my_dft(x), [0, 4, -2j, 0, 0, 0, 2j, 4])` is True.
4. Amplitude rule: for `m = np.arange(16)`, the magnitude of bin 3 of `2.5 * np.cos(2 * np.pi * 3 * m / 16 + 0.7)` is `2.5 * 16 / 2` = 20, and its phase is 0.7 rad.
5. Mirror: for a random real input of length 16, `X[16 - k]` equals `np.conj(X[k])` for k = 1 to 15.
6. Empty input: `len(my_dft([])) == 0` is True.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula). The [FFT explorer lab](/labs/new?template=fft-explorer) has the same exercise in its section 2, with more tests.

```check
{
  "question": "Stuck on `my_dft`? Use the hints in order.",
  "hint": "Hint 1: the outer loop picks a bin k. The inner loop computes one complex score: the sum of N terms x[n] times the probe value.",
  "answer": "Idea: start with a complex array of N zeros. The outer loop picks one bin k. The inner loop adds the N terms of that bin into position k. Check one bin by hand first: for the teaching signal, X[1] must be 4."
}
```

## 15. Common mistakes

1. **$\lvert X[k] \rvert$ read as the amplitude.** With this convention, divide by N/2: $A = 2\lvert X[k] \rvert / N$. At k = 0 and k = N/2, divide by N.
2. **A 1/N in the forward DFT.** NumPy's `fft` does not divide by N. The 1/N belongs to the inverse (L13).
3. **The plus sign in the forward DFT.** It conjugates the result for a real signal, so every phase changes sign.
4. **Bins 6 and 7 read as extra waves.** For a real signal they are mirrors of bins 2 and 1. They hold no new information.
5. **k and n mixed.** n is the sample number and the loop variable of the sum. k is the bin, fixed for one sum.
6. **Degrees in `np.exp`.** Write the angle in radians: $2\pi k n/N$.
7. **Rounding before multiplying.** 1.21 × 0.71 = 0.8591, but the true term is 0.8536. Keep full precision, then round.

## 16. One-minute explanation

The DFT is the matching experiment with a complex probe, done for every probe frequency. For each bin k from 0 to N − 1, multiply every sample x[n] by the probe value $e^{-i 2\pi k n/N}$. This probe is a point on the unit circle that turns k times clockwise over the N samples. Then add the N terms. The result X[k] is a complex number. For the teaching signal, bin 1 gives 4: its terms reinforce. Bin 3 gives 0: its terms cancel. Bin 2 gives −2i: magnitude 2 and phase −90°, the hidden sine. Take a wave with amplitude A that makes k whole cycles. It gives a magnitude of A·N/2 in bin k, and the same in its mirror bin N − k. That is why bins 7 and 6 repeat bins 1 and 2.

## 17. Check questions

```check
{
  "question": "Say the DFT formula in words, without symbols.",
  "hint": "Two operations for each bin.",
  "answer": "For each bin k, multiply every sample by the probe that makes k clockwise turns over the N samples. Then add all the products. The sum is the complex coefficient of bin k."
}
```

```check
{
  "question": "Compute the probe value $e^{-i 2\\pi \\cdot 1 \\cdot 2/8}$.",
  "hint": "Find the angle in degrees first.",
  "answer": "The angle is 2π·2/8 = π/2 rad = 90°, and the probe uses −90°. So $e^{-i\\pi/2} = \\cos 90° - i \\sin 90° = 0 - i = -i$."
}
```

```check
{
  "question": "Compute the n = 1 term of bin 1 for the teaching signal: x[1] × (0.71 − 0.71i). Explain why the answer is 0.85 − 0.85i and not 0.86 − 0.86i.",
  "hint": "Use the exact values x[1] = (1 + √2)/2 and 1/√2.",
  "answer": "A real number times a complex number scales both parts: x[1]·0.71 − x[1]·0.71i. With exact values, (1 + √2)/2 × 1/√2 = (2 + √2)/4 = 0.8536. So the term is 0.8536 − 0.8536i, which rounds to 0.85 − 0.85i. The rounded inputs give 1.21 × 0.71 = 0.8591, which rounds to 0.86. The error comes from rounding the inputs first."
}
```

```check
{
  "question": "N = 8. A cosine with amplitude A = 2 makes exactly 1 cycle in the 8 samples. What is |X[1]|? What is |X[7]|?",
  "hint": "Use |X[k]| = A·N/2.",
  "answer": "|X[1]| = 2 × 8/2 = 8. The mirror bin has the same magnitude: |X[7]| = 8."
}
```

```check
{
  "question": "Compute the 4-point DFT of x = [1, 0, −1, 0] by hand.",
  "hint": "For N = 4 the probe angle is −90°·k·n. Only x[0] and x[2] are not 0.",
  "answer": "X[k] = 1·1 + (−1)·e^{−iπk}. The value of e^{−iπk} is 1 for even k and −1 for odd k. X[0] = 1 − 1 = 0. X[1] = 1 + 1 = 2. X[2] = 1 − 1 = 0. X[3] = 1 + 1 = 2. So X = [0, 2, 0, 2]. Check: x is a cosine with A = 1 and 1 cycle, so |X[1]| = 1 × 4/2 = 2."
}
```

```check
{
  "question": "Why does the teaching signal have X[7] = 4, although it has no 7-cycle wave?",
  "hint": "Write the cosine as two rotating parts with Euler's formula.",
  "answer": "cos(2πn/8) = ½e^{+i2πn/8} + ½e^{−i2πn/8}. At whole-number n, the clockwise part e^{−i2πn/8} has the same values as the counterclockwise 7-cycle pattern e^{+i2π·7n/8}. So half of the cosine lands in bin 1 and half lands in bin 7. Each half gives ½ × 8 = 4. For a real signal, X[N − k] is always the conjugate of X[k] (L24)."
}
```

```check
{
  "question": "Predict the full DFT of x[n] = 3 + cos(2π·2n/8), N = 8, without a table.",
  "hint": "Use linearity. The constant goes to bin 0 with the rule for k = 0.",
  "answer": "The constant 3 gives X[0] = 3 × 8 = 24 (k = 0 uses A·N). The cosine with A = 1 and 2 cycles gives 1 × 8/2 = 4 in bin 2 and 4 in its mirror bin 6, with phase 0°. All other bins are 0. X = [24, 0, 4, 0, 0, 0, 4, 0]."
}
```

## 18. Links

- Previous lesson: [L10: The complex probe](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe)
- Next lesson: [L12: Rotating vectors](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors)
- Part: [03 Matching to DFT](/notes/maths/fft-signal-processing/03-matching-to-dft)
- Math tools: [F3: Σ notation](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation), [F5: Complex numbers](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers), [F6: Euler's formula](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula), [F7: Roots of unity](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)
- Later: [L13: The inverse DFT](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft), [L14: The cost of the direct DFT](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft), [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude), [L24: The mirror](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror), [L25: Leakage and windows](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
