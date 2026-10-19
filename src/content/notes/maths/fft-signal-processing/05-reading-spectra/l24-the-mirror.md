---
title: "L24: The mirror"
order: 2
summary: "For real input, X[N−k] is the conjugate of X[k]. Bins above N/2 are negative frequencies and add no new information."
status: not-started
tags: [spectrum, symmetry, conjugate, negative-frequency, rfft]
---

## 1. The question this idea answers

The spectrum signal has three components. But its FFT has six peaks: bins 3, 7 and 12, and also bins 52, 57 and 61. The teaching signal shows the same pattern. Its DFT is $X = [0, 4, -2i, 0, 0, 0, 2i, 4]$, with values at bins 6 and 7. Chapter 6 asked why bins 6 and 7 have values, and left the answer for later.

Lesson [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) read only bins 0 to $N/2$. It said that the factor 2 in $A = 2\lvert X[k] \rvert / N$ comes from a mirror bin. This lesson answers three questions:

1. Why does a real signal give a second, mirrored half?
2. Which frequency does a bin above $N/2$ hold?
3. How does NumPy keep only the useful half?

## 2. Mental model

> [!analogy] A turning wheel seen from the side
> View a turning wheel from the side, along the plane of the wheel. You see one mark move up and down. A wheel that turns clockwise gives the same up-and-down shadow as a wheel that turns counter-clockwise. A real signal is such a shadow. So the DFT describes it with both directions in equal amounts: one arrow at $+f$ and one arrow at $-f$. The two arrows are mirror images across the real axis.
>
> **Where it stops working:** a real wheel turns in one direction only. The two arrows are a description of a real wave, not two objects. Also, a complex signal (for example a radio signal with a real part and an imaginary part) is not a shadow. Its spectrum has no mirror.

## 3. Terms

| Term | Plain meaning |
|---|---|
| mirror bin | Bin $N - k$, the partner of bin $k$. |
| conjugate symmetry | For real input, $X[N-k] = \overline{X[k]}$: the same magnitude and the opposite phase. Another name is Hermitian symmetry. |
| negative frequency | A frequency of an arrow that turns clockwise. For $N/2 < k < N$, bin $k$ holds the frequency $(k - N) f_s / N$. |
| one-sided spectrum | Bins 0 to $N/2$ only. For real input, they hold all the information. |
| `np.fft.rfft` | The NumPy FFT for real input. It returns bins 0 to `N//2`, so `N//2 + 1` values. |
| `np.fft.fftfreq` | A NumPy function that gives the frequency label of each bin of the full FFT. |
| `np.fft.rfftfreq` | The same labels for the bins of `rfft` only. |

This lesson uses the complex conjugate from lesson [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers): $\overline{a + bi} = a - bi$. The conjugate has the same length and the opposite angle. Two rules of the conjugate are important here:

1. The conjugate of a sum is the sum of the conjugates.
2. The conjugate of a product is the product of the conjugates.

## 4. Two arrows make one real cosine

Euler's formula ([F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)) gives $e^{i\alpha} = \cos\alpha + i\sin\alpha$ and $e^{-i\alpha} = \cos\alpha - i\sin\alpha$. Add the two lines and divide by 2:

$$
\cos\alpha = \frac{1}{2}e^{i\alpha} + \frac{1}{2}e^{-i\alpha}
$$

Subtract the two lines and divide by $2i$:

$$
\sin\alpha = \frac{1}{2i}e^{i\alpha} - \frac{1}{2i}e^{-i\alpha}
$$

> [!example] The two arrows at α = 60°
> 1. $\frac{1}{2}e^{i60°} = 0.5 \times (0.5 + 0.8660i) = 0.25 + 0.43i$.
> 2. $\frac{1}{2}e^{-i60°} = 0.5 \times (0.5 - 0.8660i) = 0.25 - 0.43i$.
> 3. Sum: the imaginary parts cancel, and the real parts add to $0.50 + 0i$. This is $\cos 60° = 0.5$.
>
> The value 0.43 shows two decimals only. The cancellation is exact.

When $\alpha$ grows, the first arrow turns counter-clockwise and the second arrow turns clockwise. At every instant the second arrow is the mirror image of the first across the real axis. So their imaginary parts always cancel, and the sum stays on the real axis.

![Left: two arrows of length 0.5 at +60° and −60° add to the real number 0.5, which is cos 60°. Right: the mirror pairs X[3] and X[61] of the spectrum signal, and X[5] and X[59] of a cosine with a 30° phase, are reflections across the real axis.](/notes/media/fft-signal-processing/figures/l24-two-arrows-and-the-mirror.svg)

## 5. Bins above N/2 are negative frequencies

### 5.1 Each bin holds one counter-clockwise pattern

The inverse DFT (lesson [L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft)) builds $x[n]$ from the patterns $e^{+i 2\pi k n / N}$, each with the weight $X[k]/N$. The pattern of bin $k$ is an arrow that turns $k$ times counter-clockwise over the window.

Take a cosine that makes $k_0$ cycles in the window, $\cos(2\pi k_0 n/N)$. Section 4 splits it into two arrows:

1. $\frac{1}{2}e^{+i 2\pi k_0 n / N}$ turns $k_0$ times counter-clockwise. This is the pattern of bin $k_0$.
2. $\frac{1}{2}e^{-i 2\pi k_0 n / N}$ turns $k_0$ times clockwise. No bin from 0 to $N-1$ has a clockwise pattern. So where does this arrow go?

### 5.2 The clockwise arrow lands in bin N − k

For every whole number $n$, $e^{i 2\pi n} = 1$, because $n$ full turns return to the start. Multiply the clockwise arrow by this 1:

$$
e^{-i 2\pi k_0 n / N} = e^{-i 2\pi k_0 n / N} \cdot e^{i 2\pi N n / N} = e^{i 2\pi (N - k_0) n / N}
$$

So at every sample, the clockwise arrow with $k_0$ turns has the same value as the counter-clockwise pattern of bin $N - k_0$. The DFT sees only the samples. So it puts the clockwise arrow in bin $N - k_0$.

| Signal | Component | Its bin $k_0$ | The mirror bin $N - k_0$ |
|---|---|---|---|
| Spectrum signal, N = 64 | 6 Hz sine | 3 | 61 |
| Spectrum signal, N = 64 | 14 Hz sine | 7 | 57 |
| Spectrum signal, N = 64 | 24 Hz sine | 12 | 52 |
| Teaching signal, N = 8 | cosine, 1 cycle | 1 | 7 |
| Teaching signal, N = 8 | sine, 2 cycles | 2 | 6 |

### 5.3 The frequency of a bin above N/2

Bin $k$ with $N/2 < k < N$ holds an arrow that turns $N - k$ times clockwise. A clockwise turn has a negative frequency. So:

$$
f_k = (k - N) \cdot \frac{f_s}{N} \qquad (N/2 < k < N)
$$

| Bin $k$ | $k - N$ | $f_k = (k - N) \times 2$ Hz |
|---|---|---|
| 52 | −12 | −24 Hz |
| 57 | −7 | −14 Hz |
| 61 | −3 | −6 Hz |
| 63 | −1 | −2 Hz |

Why does bin 61 not hold +122 Hz? At $f_s$ = 128 Hz, a 122 Hz arrow turns 122/128 of a circle in each time step: 343.125°. A −6 Hz arrow turns −6/128 of a circle: −16.875°. These two turns end at the same place, because 343.125° − 360° = −16.875°. So the samples cannot tell the two arrows apart. The convention picks the label with the smallest size, −6 Hz. Lesson [L26](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing) returns to this fact.

> [!key] The upper half holds the negative frequencies
> For $N/2 < k < N$, bin $k$ holds the frequency $(k - N) f_s / N$. For real input, these bins repeat the information of bins 1 to $N/2 - 1$.

```plot
{
  "title": "All 64 bins: 0 to 32 (ink), mirror bins 33 to 63 (red)",
  "xAxis": {"label": "bin k", "domain": [-1, 64]},
  "yAxis": {"label": "magnitude |X[k]|", "domain": [-2, 36]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 0], [1, 0], [2, 0], [3, 0], [3, 32], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [7, 19.2], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [12, 12.8], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 0], [20, 0], [21, 0], [22, 0], [23, 0], [24, 0], [25, 0], [26, 0], [27, 0], [28, 0], [29, 0], [30, 0], [31, 0], [32, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0, 0], [1, 0], [2, 0], [3, 32], [4, 0], [5, 0], [6, 0], [7, 19.2], [8, 0], [9, 0], [10, 0], [11, 0], [12, 12.8], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 0], [20, 0], [21, 0], [22, 0], [23, 0], [24, 0], [25, 0], [26, 0], [27, 0], [28, 0], [29, 0], [30, 0], [31, 0], [32, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[33, 0], [34, 0], [35, 0], [36, 0], [37, 0], [38, 0], [39, 0], [40, 0], [41, 0], [42, 0], [43, 0], [44, 0], [45, 0], [46, 0], [47, 0], [48, 0], [49, 0], [50, 0], [51, 0], [52, 0], [52, 12.8], [52, 0], [53, 0], [54, 0], [55, 0], [56, 0], [57, 0], [57, 19.2], [57, 0], [58, 0], [59, 0], [60, 0], [61, 0], [61, 32], [61, 0], [62, 0], [63, 0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[33, 0], [34, 0], [35, 0], [36, 0], [37, 0], [38, 0], [39, 0], [40, 0], [41, 0], [42, 0], [43, 0], [44, 0], [45, 0], [46, 0], [47, 0], [48, 0], [49, 0], [50, 0], [51, 0], [52, 12.8], [53, 0], [54, 0], [55, 0], [56, 0], [57, 19.2], [58, 0], [59, 0], [60, 0], [61, 32], [62, 0], [63, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true}
  ]
}
```

## 6. The mirror rule and its proof

**Claim.** If every sample $x[n]$ is a real number, then for every bin $k$:

$$
X[N-k] = \overline{X[k]}
$$

**Proof.**

1. Write the DFT of bin $N - k$:

$$
X[N-k] = \sum_{n=0}^{N-1} x[n]\, e^{-i 2\pi (N-k) n / N}
$$

2. Split the exponent: $e^{-i 2\pi (N-k) n / N} = e^{-i 2\pi n} \cdot e^{+i 2\pi k n / N}$.
3. $e^{-i 2\pi n} = 1$ for every whole number $n$. So:

$$
X[N-k] = \sum_{n=0}^{N-1} x[n]\, e^{+i 2\pi k n / N}
$$

4. Now take the conjugate of $X[k]$. Use the sum rule, then the product rule:

$$
\overline{X[k]} = \sum_{n=0}^{N-1} \overline{x[n]}\; \overline{e^{-i 2\pi k n / N}}
$$

5. $x[n]$ is real, so $\overline{x[n]} = x[n]$. The conjugate of $e^{-i\alpha}$ is $e^{+i\alpha}$. So:

$$
\overline{X[k]} = \sum_{n=0}^{N-1} x[n]\, e^{+i 2\pi k n / N}
$$

6. The sums in steps 3 and 5 are the same. So $X[N-k] = \overline{X[k]}$.

Step 5 is the only step that needs real input. For complex input, $\overline{x[n]} \ne x[n]$, and the proof fails.

### 6.1 What the rule says

1. **Same magnitude.** $\lvert X[N-k] \rvert = \lvert X[k] \rvert$. So the magnitude spectrum is symmetric.
2. **Opposite phase.** The phase of $X[N-k]$ is minus the phase of $X[k]$.
3. **Bin 0 is real.** For $k = 0$, bin $N - 0 = N$ is bin 0 again (the DFT repeats every N bins). So $X[0] = \overline{X[0]}$, and a number equal to its conjugate is real. Directly: $X[0] = \sum x[n]$, a sum of real numbers.
4. **Bin N/2 is real** (for an even N). $N - N/2 = N/2$, so $X[N/2] = \overline{X[N/2]}$. Directly: $X[N/2] = \sum x[n] (-1)^n$, also a sum of real numbers.

> [!example] The teaching signal, N = 8
> $X = [0, 4, -2i, 0, 0, 0, 2i, 4]$.
>
> - $X[7] = 4$ and $\overline{X[1]} = \overline{4} = 4$. The rule holds.
> - $X[6] = 2i$ and $\overline{X[2]} = \overline{-2i} = 2i$. The rule holds.
> - $X[5] = 0 = \overline{X[3]}$.
> - $X[0] = 0$ and $X[4] = 0$. Both are real.

> [!example] The spectrum signal, N = 64
> | $k$ | $X[k]$ | $N - k$ | $X[N-k]$ | Phases |
> |---|---|---|---|---|
> | 3 | $-32i$ | 61 | $+32i$ | −90° and +90° |
> | 7 | $-19.2i$ | 57 | $+19.2i$ | −90° and +90° |
> | 12 | $-12.8i$ | 52 | $+12.8i$ | −90° and +90° |

> [!example] A cosine with a 30° phase
> Lesson L23 computed $X[5] = 22.17 + 12.80i$ for $0.8\cos(2\pi \cdot 5n/64 + 30°)$. The rule predicts $X[59] = 22.17 - 12.80i$. The FFT gives the same value. Both have magnitude 25.6. The phases are +30° and −30°.

> [!trap] The mirror needs real input
> Let $x[n] = e^{i 2\pi n / 8}$, one counter-clockwise arrow, with N = 8. Then $X[1] = 8$ and $X[7] = 0$. There is no mirror, because this signal is one arrow, not a shadow of two arrows.

## 7. Count the information

The DFT does not make information and does not lose information. A count shows this.

1. The input has N real numbers.
2. The output has N complex numbers, so it looks like 2N real numbers.
3. The mirror fixes half of them:

| Bins | Kind | Real numbers |
|---|---|---|
| 0 | real | 1 |
| $N/2$ | real | 1 |
| 1 to $N/2 - 1$ | complex | $2 \times (N/2 - 1) = N - 2$ |
| $N/2 + 1$ to $N - 1$ | copies of the lower bins | 0 |
| Total | | $1 + 1 + (N - 2) = N$ |

For N = 64: 1 + 1 + 62 = 64. For N = 8: 1 + 1 + 6 = 8. The count of free real numbers out equals the count in.

## 8. The one-sided spectrum in NumPy

For real input, bins 0 to $N/2$ hold everything. NumPy gives them directly:

```python
X = np.fft.rfft(x)                   # bins 0 .. N//2
f = np.fft.rfftfreq(N, d=1 / fs)     # the frequency of each of these bins, in Hz
```

| N | Values from `rfft` | Bins | Nyquist bin |
|---|---|---|---|
| 64 | 64 // 2 + 1 = 33 | 0 to 32 | bin 32, 64 Hz at $f_s$ = 128 Hz |
| 8 | 8 // 2 + 1 = 5 | 0 to 4 | bin 4 |
| 9 | 9 // 2 + 1 = 5 | 0 to 4 | none: an odd N has no bin at $f_s/2$ |

`rfft` removes the mirror bins. It does not double the bins that it keeps. So the amplitude rule of lesson L23 stays the same: $A = 2\lvert X[k] \rvert / N$ for $0 < k < N/2$.

For the full FFT, `np.fft.fftfreq(N, d)` gives the label of every bin. The argument `d` is the time step $1/f_s$, not the sample rate. The labels follow the rule of section 5.3:

| Call | Result |
|---|---|
| `np.fft.fftfreq(8, d=1/8)` | `[0, 1, 2, 3, -4, -3, -2, -1]` |
| `np.fft.fftfreq(64, d=1/128)` | `[0, 2, 4, ..., 62, -64, -62, ..., -2]` |
| `np.fft.rfftfreq(64, d=1/128)` | `[0, 2, 4, ..., 62, 64]` |

> [!trap] Two labels for the Nyquist bin
> `fftfreq` labels bin $N/2$ as $-f_s/2$, for example −64 Hz. `rfftfreq` labels the same bin as $+f_s/2$, for example +64 Hz. Both are correct. The NumPy documentation says that this bin represents both the positive and the negative Nyquist frequency.

`np.fft.fftshift(X)` moves the zero frequency to the center of the array. The graph below uses the `fftfreq` labels in increasing order. The negative half is the mirror of the positive half.

```plot
{
  "title": "fftfreq labels: negative (red), zero and positive (ink)",
  "xAxis": {"label": "frequency (Hz)", "domain": [-68, 66]},
  "yAxis": {"label": "magnitude |X[k]|", "domain": [-2, 36]},
  "disableZoom": true,
  "data": [
    {"points": [[-64, 0], [-62, 0], [-60, 0], [-58, 0], [-56, 0], [-54, 0], [-52, 0], [-50, 0], [-48, 0], [-46, 0], [-44, 0], [-42, 0], [-40, 0], [-38, 0], [-36, 0], [-34, 0], [-32, 0], [-30, 0], [-28, 0], [-26, 0], [-24, 0], [-24, 12.8], [-24, 0], [-22, 0], [-20, 0], [-18, 0], [-16, 0], [-14, 0], [-14, 19.2], [-14, 0], [-12, 0], [-10, 0], [-8, 0], [-6, 0], [-6, 32], [-6, 0], [-4, 0], [-2, 0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[-64, 0], [-62, 0], [-60, 0], [-58, 0], [-56, 0], [-54, 0], [-52, 0], [-50, 0], [-48, 0], [-46, 0], [-44, 0], [-42, 0], [-40, 0], [-38, 0], [-36, 0], [-34, 0], [-32, 0], [-30, 0], [-28, 0], [-26, 0], [-24, 12.8], [-22, 0], [-20, 0], [-18, 0], [-16, 0], [-14, 19.2], [-12, 0], [-10, 0], [-8, 0], [-6, 32], [-4, 0], [-2, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true},
    {"points": [[0, 0], [2, 0], [4, 0], [6, 0], [6, 32], [6, 0], [8, 0], [10, 0], [12, 0], [14, 0], [14, 19.2], [14, 0], [16, 0], [18, 0], [20, 0], [22, 0], [24, 0], [24, 12.8], [24, 0], [26, 0], [28, 0], [30, 0], [32, 0], [34, 0], [36, 0], [38, 0], [40, 0], [42, 0], [44, 0], [46, 0], [48, 0], [50, 0], [52, 0], [54, 0], [56, 0], [58, 0], [60, 0], [62, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0, 0], [2, 0], [4, 0], [6, 32], [8, 0], [10, 0], [12, 0], [14, 19.2], [16, 0], [18, 0], [20, 0], [22, 0], [24, 12.8], [26, 0], [28, 0], [30, 0], [32, 0], [34, 0], [36, 0], [38, 0], [40, 0], [42, 0], [44, 0], [46, 0], [48, 0], [50, 0], [52, 0], [54, 0], [56, 0], [58, 0], [60, 0], [62, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

> [!note] Sources
> The NumPy documentation for `numpy.fft.rfft` gives the output length `n//2 + 1` and states the Hermitian symmetry of real input. The documentation for `numpy.fft.fftfreq` gives the label formula. A real-input FFT uses the mirror to save work. Lesson [L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts) gives the overview.

## 9. Video and pictures

Watch the FFT of the 64 samples. The peaks at bins 3, 7 and 12 appear, and the right half appears too.

```video
{
  "src": "/notes/media/fft-signal-processing/course/11_Reading_the_Frequency_Spectrum.mp4",
  "start": "0:00",
  "end": "0:19",
  "caption": "The FFT of the mystery signal: peaks at bins 3, 7 and 12."
}
```

Watch the mirror and the reason for it: a real cosine is the average of two opposite rotations.

```video
{
  "src": "/notes/media/fft-signal-processing/course/11_Reading_the_Frequency_Spectrum.mp4",
  "start": "0:19",
  "end": "0:38",
  "caption": "X[N−k] is the conjugate of X[k]. Bins above N/2 are the negative frequencies k − N."
}
```

## 10. Code

Build three functions in a lab:

1. `mirror_error(X)` returns the largest value of $\lvert X[(N-k) \bmod N] - \overline{X[k]} \rvert$ over all $k$.
2. `bin_labels(N, fs)` returns the frequency label of every bin of the full FFT, with the rule of section 5.3. Do not call `np.fft.fftfreq` inside it.
3. `one_sided(X, fs)` takes a full FFT output and returns `(freqs, X_half)` for bins 0 to `N//2`.

Acceptance tests:

1. `mirror_error(np.fft.fft(x)) < 1e-9` for the spectrum signal, and for 5 random real inputs of length 16.
2. `mirror_error(np.fft.fft(np.exp(2j * np.pi * np.arange(8) / 8)))` is about 8. A complex input has no mirror.
3. `np.allclose(bin_labels(N, fs), np.fft.fftfreq(N, d=1/fs))` is True for `(8, 8)`, `(64, 128)` and `(9, 9)`.
4. For a random real `x` of length 64 and of length 9, `one_sided(np.fft.fft(x), fs)` matches `np.fft.rfft(x)` and `np.fft.rfftfreq(len(x), d=1/fs)`.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)

In the [FFT explorer lab](/labs/new?template=fft-explorer), the plot uses `rfft`. So it shows only bins 0 to N/2. Change the line `X = np.fft.rfft(x * w)` to the full `np.fft.fft` and plot all N bins. Then find the mirror peaks.

```check
{
  "question": "Stuck on `bin_labels` or `mirror_error`? Use the hints in order.",
  "hint": "Hint 1: `bin_labels` starts with $k f_s / N$ for every bin. Then it changes the label of each bin above the middle with the rule $(k - N) f_s / N$. Find the exact condition for an even N and for an odd N: compare with `fftfreq`.",
  "answer": "Hint 2 (idea): for `mirror_error`, the partner of bin $k$ is bin $(N - k) \\bmod N$, so bin 0 is its own partner. Build the array of partners with an index array, conjugate the original array, and take the largest absolute difference."
}
```

## 11. Common mistakes

1. **The upper bins read as high positive frequencies.** Bin 61 is −6 Hz, not +122 Hz. Use $(k - N) f_s / N$.
2. **The mirror peaks counted as new components.** The spectrum signal has 3 components, not 6. For real input, the upper half repeats the lower half.
3. **The factor 2 removed after `rfft`.** `rfft` drops the mirror bins but does not double the others. Keep $A = 2\lvert X[k] \rvert / N$.
4. **A mirror expected for complex input.** The proof needs $\overline{x[n]} = x[n]$. Complex input has no mirror.
5. **The sample rate passed as `d`.** `d` is the time step $1/f_s$. `fftfreq(64, d=128)` gives wrong, tiny values.
6. **The Nyquist bin given one sign only.** Bin $N/2$ is both $+f_s/2$ and $-f_s/2$. `fftfreq` and `rfftfreq` label it with opposite signs.

## 12. One-minute explanation

A real cosine is the sum of two arrows of half length. One arrow turns counter-clockwise, and the other turns clockwise. They are mirror images across the real axis, so their imaginary parts cancel. The DFT has only counter-clockwise patterns. A clockwise arrow with $k$ turns has the same samples as the pattern of bin $N - k$. So every real component gives a peak at bin $k$ and a mirror peak at bin $N - k$. For real input, $X[N-k]$ is the conjugate of $X[k]$: the same magnitude, the opposite phase. The upper bins are negative frequencies, $(k - N) f_s / N$, and they add no new information. `np.fft.rfft` keeps bins 0 to $N/2$ only.

## 13. Check questions

```check
{
  "question": "State the mirror rule of the DFT. Which condition does it need?",
  "hint": "Which step of the proof uses a property of $x[n]$?",
  "answer": "$X[N-k] = \\overline{X[k]}$ for every $k$. It needs real input: every $x[n]$ is a real number. The proof uses $\\overline{x[n]} = x[n]$, and only real numbers satisfy it."
}
```

```check
{
  "question": "A real signal has N = 16 and $X[3] = 2 - 5i$. What is $X[13]$? What are the magnitudes and the phases of both bins? With $f_s$ = 32 Hz, which frequencies do bins 3 and 13 hold?",
  "hint": "$13 = 16 - 3$.",
  "answer": "$X[13] = \\overline{X[3]} = 2 + 5i$. Both magnitudes are $\\sqrt{2^2 + 5^2} = \\sqrt{29} = 5.39$ (rounded). The phase of $X[3]$ is $-\\arctan(5/2) = -68.2°$, and the phase of $X[13]$ is $+68.2°$. Bin spacing: 32 / 16 = 2 Hz. Bin 3: 3 × 2 = 6 Hz. Bin 13: (13 − 16) × 2 = −6 Hz."
}
```

```check
{
  "question": "Why are $X[0]$ and $X[N/2]$ always real for real input (N even)?",
  "hint": "Find the mirror partner of each bin.",
  "answer": "Bin 0 is its own partner (bin N is bin 0 again), and $N - N/2 = N/2$, so bin $N/2$ is its own partner too. The rule then says $X[0] = \\overline{X[0]}$ and $X[N/2] = \\overline{X[N/2]}$. Only a real number equals its own conjugate. Directly: $X[0] = \\sum x[n]$ and $X[N/2] = \\sum x[n](-1)^n$ are sums of real numbers."
}
```

```check
{
  "question": "The teaching signal (N = 8) has $X[1] = 4$ and $X[2] = -2i$. Without a new computation, give $X[6]$ and $X[7]$. Which frequencies do bins 6 and 7 hold, in cycles per window?",
  "hint": "Use the mirror rule, then the label rule $k - N$.",
  "answer": "$X[7] = \\overline{X[1]} = 4$ and $X[6] = \\overline{X[2]} = 2i$. Bin 7 holds $7 - 8 = -1$ cycle per window, and bin 6 holds $6 - 8 = -2$ cycles per window. They are the clockwise arrows of the cosine and of the sine."
}
```

```check
{
  "question": "A real signal has N = 10 samples. How many values does `np.fft.rfft` return? Which bins? Is there a Nyquist bin? Answer the same questions for N = 11.",
  "hint": "`rfft` returns `N//2 + 1` values.",
  "answer": "N = 10: 10 // 2 + 1 = 6 values, bins 0 to 5. Bin 5 = N/2 is the Nyquist bin. N = 11: 11 // 2 + 1 = 6 values, bins 0 to 5. There is no Nyquist bin, because N/2 = 5.5 is not a whole number."
}
```

```check
{
  "question": "Let $x[n] = e^{i 2\\pi n / 8}$ for N = 8. The FFT gives $X[1] = 8$ and $X[7] = 0$. Why does the mirror rule fail here?",
  "hint": "Is $x[n]$ real?",
  "answer": "$x[n]$ is complex: it is one arrow that turns counter-clockwise. The proof needs $\\overline{x[n]} = x[n]$, which is false here. A real wave is the sum of two mirror arrows. This signal has only one arrow, so only bin 1 is full."
}
```

## 14. Links

- Previous lesson: [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)
- Next lesson: [L25: Leakage and windows](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)
- Part folder: [05 Reading spectra](/notes/maths/fft-signal-processing/05-reading-spectra)
- [F5: Complex numbers](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers): the conjugate
- [F6: Euler's formula](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula): a cosine as two arrows
- [L13: The inverse DFT](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft): each bin holds one counter-clockwise pattern
- [L22: Other FFTs](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts): the real-input FFT
- [L26: Aliasing](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing): why +122 Hz and −6 Hz give the same samples
- [Glossary](/notes/maths/fft-signal-processing/glossary)
