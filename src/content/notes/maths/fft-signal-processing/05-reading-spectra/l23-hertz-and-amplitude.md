---
title: "L23: Hertz and amplitude"
order: 1
summary: "Change a bin number into hertz with f = k·fs/N, and a magnitude into an amplitude with A = 2·|X[k]|/N."
status: not-started
tags: [spectrum, bins, hertz, amplitude, phase, normalization]
---

## 1. The question this idea answers

Chapter 1 of the course asked three questions about a mixed signal. Which frequencies does it contain? How strong is each one? How is each one shifted? Part 04 gave a fast way to compute the DFT, and lesson [L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts) closed that part.

Now run the FFT on the spectrum signal: 64 samples of $1.0\sin(2\pi \cdot 6t) + 0.6\sin(2\pi \cdot 14t) + 0.4\sin(2\pi \cdot 24t)$ at $f_s$ = 128 Hz. The FFT returns 64 complex numbers, $X[0]$ to $X[63]$. The output has no hertz and no amplitudes. It holds only bin numbers and complex values.

This lesson answers two questions:

1. Which frequency in hertz does bin $k$ hold?
2. Which amplitude does the magnitude $\lvert X[k] \rvert$ give?

Lesson [L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency) gave the first half of the idea. A list of samples gives a period in samples, and the time step changes it into seconds. Here the same idea changes bins into hertz.

## 2. Mental model

> [!analogy] A ruler with marks but no units
> The FFT gives a ruler with numbered marks 0, 1, 2, and so on, but with no unit. The sample rate prints the unit on the ruler. With $f_s$ = 128 Hz and N = 64, each mark is 2 Hz. So a peak at mark 3 is a 6 Hz component.
>
> The height of each peak also needs a unit. The DFT adds N products and does not divide, so the height grows with N. Divide the height by N/2 to get the amplitude.
>
> **Where it stops working:** a real ruler has a value at every point. The DFT has marks only at whole multiples of $f_s/N$. A tone between two marks does not sit on one mark, and its energy spreads to many marks (lesson L25). Also, two marks (bin 0 and bin N/2) use a different height rule.

## 3. Terms

| Term | Plain meaning |
|---|---|
| window | The finite stretch of N samples that one DFT uses. It lasts $N/f_s$ seconds. |
| fits the window | A sinusoid fits the window when it makes a whole number of cycles in the N samples. |
| bin frequency ($f_k$) | The frequency in hertz of bin $k$. $f_k = k f_s / N$. |
| bin spacing ($\Delta f$) | The step in hertz from one bin to the next. $\Delta f = f_s / N$. |
| magnitude spectrum | A plot of $\lvert X[k] \rvert$ for every bin $k$. |
| amplitude spectrum | A plot of the amplitude that each bin gives, for example $2\lvert X[k] \rvert / N$. |
| DC component | The constant part of a signal, which is its average. Bin 0 holds it. DC means "direct current". |
| Nyquist bin | Bin $k = N/2$, for an even N. Its frequency is $f_s/2$, the highest frequency that the samples can show. |
| normalization | The scale factor that a library applies to the DFT: none, $1/N$ or $1/\sqrt{N}$. |

## 4. From bin to hertz

### 4.1 The probe of bin k makes k cycles in the window

Lesson [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula) defined the probe of bin $k$ as $e^{-i 2\pi k n / N}$. Its angle is $2\pi k n / N$. When $n$ goes from 0 to $N$, the angle goes from 0 to $2\pi k$. So the probe turns $k$ full circles over the window. In other words, the probe of bin $k$ makes exactly $k$ cycles in the window.

### 4.2 How long the window lasts

The time step is $\Delta t = 1/f_s$. N samples cover N time steps (the convention of lesson L2). So the window lasts:

$$
N \cdot \Delta t = \frac{N}{f_s}
$$

For the spectrum signal, the window lasts 64 / 128 = 0.5 s.

### 4.3 Cycles per second

Frequency is the number of cycles divided by the duration (lesson L2). The probe of bin $k$ makes $k$ cycles in $N/f_s$ seconds. So:

$$
f_k = \frac{k}{N / f_s} = k \cdot \frac{f_s}{N}
$$

The step from one bin to the next is the bin spacing:

$$
\Delta f = \frac{f_s}{N} = \frac{1}{\text{window length in seconds}}
$$

> [!example] The spectrum signal
> N = 64 and $f_s$ = 128 Hz. So $\Delta f$ = 128 / 64 = 2 Hz.
>
> | Bin $k$ | Cycles of the probe in 0.5 s | $f_k = k \times 2$ Hz |
> |---|---|---|
> | 3 | 3 | 6 Hz |
> | 7 | 7 | 14 Hz |
> | 12 | 12 | 24 Hz |
>
> Check with lesson L2: a 6 Hz wave makes 6 × 0.5 = 3 cycles in 0.5 s. Bin 3 makes 3 cycles. The two numbers agree.

> [!example] Bin 20 with $f_s$ = 1000 Hz and N = 500
> 1. Compute the bin spacing: $\Delta f$ = 1000 / 500 = 2 Hz.
> 2. Multiply: $f_{20}$ = 20 × 2 = 40 Hz.
> 3. Check: the window lasts 500 / 1000 = 0.5 s. A 40 Hz wave makes 40 × 0.5 = 20 cycles in it. Bin 20 makes 20 cycles. The numbers agree.

### 4.4 The reverse question: which bin holds a frequency?

Solve $f = k f_s / N$ for $k$:

$$
k = \frac{f \cdot N}{f_s} = \frac{f}{\Delta f}
$$

For the 24 Hz component: $k$ = 24 × 64 / 128 = 12. For a 7 Hz tone: $k$ = 7 × 64 / 128 = 3.5. No bin has the number 3.5. So a 7 Hz tone does not fit the window, and lesson [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) shows what happens to it.

> [!key] The bin spacing depends only on the window length
> $\Delta f = 1 / (\text{window length})$. A 0.5 s window always gives 2 Hz. For example, $f_s$ = 256 Hz with N = 128 also lasts 0.5 s, so it also gives 2 Hz. More samples in the same time give bins up to a higher frequency, not closer bins. Lesson [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty) uses the same rule: a 25 ms window gives 40 Hz.

> [!trap] The bin number is not the frequency in hertz
> Bin 12 is 24 Hz here, not 12 Hz. The bin number equals the hertz value only when the window lasts exactly 1 s, which means $f_s = N$. The FFT explorer lab starts with $f_s$ = 64 Hz and N = 64. So in that lab, bin 5 is 5 Hz. This coincidence hides the rule.

The graph shows the magnitude of bins 0 to 32 on a hertz axis. Lesson [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror) explains bins 33 to 63.

```plot
{
  "title": "Magnitude (ink) of bins 0 to 32 on a hertz axis",
  "xAxis": {"label": "frequency (Hz) = k · 2", "domain": [-2, 66]},
  "yAxis": {"label": "magnitude |X[k]|", "domain": [-2, 36]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 0], [2, 0], [4, 0], [6, 0], [6, 32], [6, 0], [8, 0], [10, 0], [12, 0], [14, 0], [14, 19.2], [14, 0], [16, 0], [18, 0], [20, 0], [22, 0], [24, 0], [24, 12.8], [24, 0], [26, 0], [28, 0], [30, 0], [32, 0], [34, 0], [36, 0], [38, 0], [40, 0], [42, 0], [44, 0], [46, 0], [48, 0], [50, 0], [52, 0], [54, 0], [56, 0], [58, 0], [60, 0], [62, 0], [64, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0, 0], [2, 0], [4, 0], [6, 32], [8, 0], [10, 0], [12, 0], [14, 19.2], [16, 0], [18, 0], [20, 0], [22, 0], [24, 12.8], [26, 0], [28, 0], [30, 0], [32, 0], [34, 0], [36, 0], [38, 0], [40, 0], [42, 0], [44, 0], [46, 0], [48, 0], [50, 0], [52, 0], [54, 0], [56, 0], [58, 0], [60, 0], [62, 0], [64, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

All bins except 3, 7 and 12 are zero up to rounding. The largest of them is about $1.7 \times 10^{-14}$. They are zero only because each component fits the window exactly.

## 5. From magnitude to amplitude

### 5.1 The result

For a sinusoid with amplitude $A$ that fits the window, at a bin $k$ with $0 < k < N/2$:

$$
\lvert X[k] \rvert = A \cdot \frac{N}{2}
$$

So the magnitude grows with N. The same 1.0 sine gives 32 with N = 64 and 64 with N = 128.

### 5.2 Why the factor is N/2

Take a cosine with amplitude $A$ and phase $\varphi$ that makes $k_0$ cycles in the window. Let $0 < k_0 < N/2$. Write its angle at sample $n$ as $\theta_n = 2\pi k_0 n / N$:

$$
x[n] = A\cos(\theta_n + \varphi)
$$

1. **Write the cosine as two arrows.** Euler's formula ([F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)) gives $\cos\alpha = \frac{1}{2}e^{i\alpha} + \frac{1}{2}e^{-i\alpha}$. So:

$$
x[n] = \frac{A}{2}e^{i(\theta_n + \varphi)} + \frac{A}{2}e^{-i(\theta_n + \varphi)}
$$

2. **Multiply each arrow by the probe of bin $k_0$.** The probe is $e^{-i\theta_n}$.
   - First arrow: $\frac{A}{2}e^{i\varphi} e^{i\theta_n} e^{-i\theta_n} = \frac{A}{2}e^{i\varphi}$. The two rotations cancel. Every term is the same constant.
   - Second arrow: $\frac{A}{2}e^{-i\varphi} e^{-2i\theta_n}$. This term still turns. It makes $2k_0$ cycles over the window.
3. **Add the N terms.**
   - First arrow: N equal terms give $N \cdot \frac{A}{2}e^{i\varphi}$.
   - Second arrow: the terms $e^{-2i\theta_n} = e^{-i 2\pi (2k_0) n / N}$ are points that turn $2k_0$ full circles. They add to 0 when $2k_0$ is not a multiple of N (see the note below). Here $0 < 2k_0 < N$, so the sum is 0.
4. **Read the result.**

$$
X[k_0] = \frac{A N}{2} e^{i\varphi}
$$

The magnitude is $AN/2$. The phase is $\varphi$. Solve for the amplitude:

$$
A = \frac{2\lvert X[k] \rvert}{N} \qquad (0 < k < N/2)
$$

> [!note] Why the turning terms add to 0
> Let $r = e^{-i 2\pi m / N}$, with $m$ a whole number. The sum $\sum_{n=0}^{N-1} r^n$ is a geometric series, so it equals $\frac{1 - r^N}{1 - r}$. Here $r^N = e^{-i 2\pi m} = 1$, so the top is 0. When $m$ is not a multiple of N, $r \ne 1$, so the bottom is not 0. So the sum is exactly 0. Lesson [F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity) shows the same fact with points on the unit circle.

> [!key] Magnitude is not amplitude
> With the DFT of NumPy, $A = 2\lvert X[k] \rvert / N$ for $0 < k < N/2$. A real sinusoid gives half of its amplitude to bin $k$. The other half goes to the mirror bin $N - k$ (lesson L24). The factor 2 puts the two halves together.

> [!example] The spectrum signal
> | Bin | $f_k$ | $\lvert X[k] \rvert$ | $A = 2\lvert X[k] \rvert / 64$ |
> |---|---|---|---|
> | 3 | 6 Hz | 32 | 2 × 32 / 64 = 1.0 |
> | 7 | 14 Hz | 19.2 | 2 × 19.2 / 64 = 0.6 |
> | 12 | 24 Hz | 12.8 | 2 × 12.8 / 64 = 0.4 |
>
> These are exactly the amplitudes of the recipe in chapter 1.

> [!example] The teaching signal
> $x[n] = \cos(2\pi n/8) + 0.5\sin(2\pi \cdot 2n/8)$ with N = 8 gives $X[1] = 4$ and $X[2] = -2i$ (lesson L11).
>
> - Bin 1: $A$ = 2 × 4 / 8 = 1. This is the cosine.
> - Bin 2: $\lvert X[2] \rvert$ = 2, so $A$ = 2 × 2 / 8 = 0.5. This is the sine.

```plot
{
  "title": "Amplitude 2·|X[k]|/N (ink): 1.0, 0.6 and 0.4 again",
  "xAxis": {"label": "frequency (Hz)", "domain": [-2, 66]},
  "yAxis": {"label": "amplitude A", "domain": [-0.1, 1.2]},
  "disableZoom": true,
  "data": [
    {"points": [[2, 0], [4, 0], [6, 0], [6, 1], [6, 0], [8, 0], [10, 0], [12, 0], [14, 0], [14, 0.6], [14, 0], [16, 0], [18, 0], [20, 0], [22, 0], [24, 0], [24, 0.4], [24, 0], [26, 0], [28, 0], [30, 0], [32, 0], [34, 0], [36, 0], [38, 0], [40, 0], [42, 0], [44, 0], [46, 0], [48, 0], [50, 0], [52, 0], [54, 0], [56, 0], [58, 0], [60, 0], [62, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[2, 0], [4, 0], [6, 1], [8, 0], [10, 0], [12, 0], [14, 0.6], [16, 0], [18, 0], [20, 0], [22, 0], [24, 0.4], [26, 0], [28, 0], [30, 0], [32, 0], [34, 0], [36, 0], [38, 0], [40, 0], [42, 0], [44, 0], [46, 0], [48, 0], [50, 0], [52, 0], [54, 0], [56, 0], [58, 0], [60, 0], [62, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

## 6. Two exceptions: bin 0 and bin N/2

### 6.1 Bin 0 holds the DC component

Let $x[n] = c$ for every $n$. The probe of bin 0 is $e^{0} = 1$. So $X[0] = \sum c = N c$, and:

$$
c = \frac{X[0]}{N}
$$

There is no factor 2. A constant does not split into two arrows. In the derivation of section 5.2, $k_0 = 0$ makes $2k_0 = 0$, a multiple of N. So the second sum is N, not 0. Both halves land in bin 0.

### 6.2 Bin N/2 holds the fastest wave

For an even N, bin $N/2$ has the angle $\theta_n = 2\pi (N/2) n / N = \pi n$. So its cosine is $\cos(\pi n) = (-1)^n$: 1, −1, 1, −1, and so on. This wave makes one cycle in every 2 samples. Its frequency is $(N/2) \cdot f_s / N = f_s / 2$. For the spectrum signal, bin 32 is 64 Hz.

Here $2k_0 = N$, a multiple of N. So the second sum in step 3 is N, not 0. Then:

$$
X[N/2] = \frac{AN}{2}\left(e^{i\varphi} + e^{-i\varphi}\right) = A N \cos\varphi
$$

1. For a cosine ($\varphi = 0$): $X[N/2] = AN$. So $A = \lvert X[N/2] \rvert / N$.
2. For a sine ($\varphi = -90°$): $\cos(-90°) = 0$, so $X[N/2] = 0$. All samples $\sin(\pi n)$ are 0. The samples cannot show a sine at $f_s/2$.

> [!example] DC and Nyquist with numbers
> Let $x[n] = 0.3 + 0.5\cos(\pi n)$ with N = 64.
>
> - $X[0]$ = 64 × 0.3 = 19.2. So the DC component is 19.2 / 64 = 0.3.
> - $X[32]$ = 64 × 0.5 = 32. So $A$ = 32 / 64 = 0.5.
>
> The rule $2\lvert X[k] \rvert / N$ gives 0.6 and 1.0 here. Both are two times too large.

> [!trap] The same magnitude, two different amplitudes
> $\lvert X[32] \rvert$ = 32 in this example. $\lvert X[3] \rvert$ = 32 in the spectrum signal. But the amplitudes are 0.5 and 1.0. Always check the bin number before you choose the formula.

```plot
{
  "title": "0.3 + 0.5·cos(πn): bin 0 = 19.2, bin 32 = 32 (ink)",
  "xAxis": {"label": "bin k", "domain": [-1, 33]},
  "yAxis": {"label": "magnitude |X[k]|", "domain": [-2, 36]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 0], [0, 19.2], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 0], [20, 0], [21, 0], [22, 0], [23, 0], [24, 0], [25, 0], [26, 0], [27, 0], [28, 0], [29, 0], [30, 0], [31, 0], [32, 0], [32, 32], [32, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0, 19.2], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 0], [20, 0], [21, 0], [22, 0], [23, 0], [24, 0], [25, 0], [26, 0], [27, 0], [28, 0], [29, 0], [30, 0], [31, 0], [32, 32]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

## 7. The phase of each peak

Step 4 of section 5.2 gave $X[k_0] = \frac{AN}{2}e^{i\varphi}$. So the phase of $X[k_0]$ is $\varphi$, the phase of the component. The DFT measures this phase from a cosine.

A sine is a cosine that starts a quarter cycle later: $A\sin\alpha = A\cos(\alpha - \pi/2)$. So a sine has $\varphi = -\pi/2 = -90°$, and:

$$
X[k_0] = \frac{AN}{2}e^{-i\pi/2} = -i \cdot \frac{AN}{2}
$$

For the spectrum signal, the FFT gives $X[3] = -32i$, $X[7] = -19.2i$ and $X[12] = -12.8i$. All three phases are −90°. So all three components are sines that start at 0 and rise. This matches the recipe in chapter 1.

> [!example] A cosine with a phase of 30°
> Let $x[n] = 0.8\cos(2\pi \cdot 5n/64 + 30°)$ with N = 64. The derivation predicts $X[5] = 0.8 \times 32 \times e^{i30°} = 25.6\,e^{i30°}$.
>
> 1. Real part: 25.6 × cos 30° = 25.6 × 0.8660 = 22.17.
> 2. Imaginary part: 25.6 × sin 30° = 25.6 × 0.5 = 12.80.
> 3. So $X[5] = 22.17 + 12.80i$ (rounded to two decimals). The FFT gives the same value.
>
> Now read it back:
>
> 1. Magnitude: $\lvert X[5] \rvert = \sqrt{22.17^2 + 12.80^2} = \sqrt{491.51 + 163.84} = \sqrt{655.35} = 25.60$ (rounded to two decimals).
> 2. Amplitude: $A$ = 2 × 25.6 / 64 = 0.8.
> 3. Phase: $\arctan(12.80 / 22.17) = \arctan(0.5774) = 30°$.

> [!trap] The phase of an empty bin
> At an empty bin, $\lvert X[k] \rvert$ is about $10^{-14}$. This value is rounding error. `np.angle` still returns an angle for it, but that angle has no meaning. Read the phase only at a bin with a clear peak.

> [!trap] Two phase references
> Chapter 2 measures phase on a sine, $A\sin(2\pi f t + \varphi)$. The DFT measures phase from a cosine. So a sine with phase 0 in chapter 2 shows −90° in the DFT. Both are correct. They use different reference waves. The [02 Signals and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency) folder has the same note.

## 8. The full recipe and the normalization check

Use these steps to read any spectrum of a real signal:

1. Find the normalization of your library.
2. Compute $X$ with the FFT.
3. Compute the bin spacing $\Delta f = f_s / N$.
4. For each peak bin $k$ with $0 < k < N/2$: $f = k \Delta f$, $A = 2\lvert X[k] \rvert / N$, and the phase is the angle of $X[k]$.
5. For bin 0: the DC component is $X[0] / N$.
6. For bin $N/2$: $A = \lvert X[N/2] \rvert / N$.

NumPy has three normalization options. The formula in step 4 changes with the option.

| `norm` | Scale of the forward FFT | Amplitude for $0 < k < N/2$ |
|---|---|---|
| `"backward"` (default) | none | $2\lvert X[k] \rvert / N$ |
| `"ortho"` | $1/\sqrt{N}$ | $2\lvert X[k] \rvert / \sqrt{N}$ |
| `"forward"` | $1/N$ | $2\lvert X[k] \rvert$ |

For example, with `"forward"` the FFT divides by N. So $X_{\text{forward}}[k] = X[k] / N$, and $2\lvert X[k] \rvert / N = 2\lvert X_{\text{forward}}[k] \rvert$.

> [!note] Source
> The NumPy documentation for `numpy.fft` (section "Normalization") states the three options. The default `"backward"` leaves the forward transform unscaled and scales the inverse by $1/n$.

> [!trap] The FFT explorer lab plots |X| / N
> The lab template plots `np.abs(X) / N`. So a sine with amplitude 1 gives a peak of 0.5 in that lab, not 1. Multiply the height by 2 to read the amplitude.

## 9. Video and pictures

Watch how the course changes the bins 3, 7 and 12 into hertz.

```video
{
  "src": "/notes/media/fft-signal-processing/course/11_Reading_the_Frequency_Spectrum.mp4",
  "start": "0:38",
  "end": "0:47",
  "caption": "Bins become hertz only with a sample rate: f_k = k·fs/N, 2 Hz apart here."
}
```

Watch the magnitudes 32, 19.2 and 12.8 change back into 1.0, 0.6 and 0.4. The clip also warns about other normalizations.

```video
{
  "src": "/notes/media/fft-signal-processing/course/11_Reading_the_Frequency_Spectrum.mp4",
  "start": "0:47",
  "end": "1:04",
  "caption": "Magnitude is not amplitude: |X[k]| = A·N/2, and bins 0 and N/2 have no factor 2."
}
```

The input of this lesson is the list of 64 samples below.

```plot
{
  "title": "Spectrum signal: 64 samples (blue) over 0.5 s",
  "xAxis": {"label": "time (s)", "domain": [-0.01, 0.51]},
  "yAxis": {"label": "sample value", "domain": [-2, 2]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 0], [0.0078, 1.0405], [0.0156, 1.4269], [0.0234, 1.1491], [0.0312, 0.7535], [0.0391, 0.6679], [0.0469, 0.7647], [0.0547, 0.6544], [0.0625, 0.2828], [0.0703, 0.043], [0.0781, 0.2456], [0.0859, 0.6292], [0.0938, 0.5716], [0.1016, -0.1985], [0.1094, -1.2314], [0.1172, -1.7903], [0.125, -1.6], [0.1328, -1.0512], [0.1406, -0.6657], [0.1484, -0.5046], [0.1562, -0.2284], [0.1641, 0.3231], [0.1719, 0.8113], [0.1797, 0.7821], [0.1875, 0.2828], [0.1953, -0.0847], [0.2031, 0.1991], [0.2109, 0.9741], [0.2188, 1.5535], [0.2266, 1.4552], [0.2344, 0.8612], [0.2422, 0.3014], [0.25, 0], [0.2578, -0.3014], [0.2656, -0.8612], [0.2734, -1.4552], [0.2812, -1.5535], [0.2891, -0.9741], [0.2969, -0.1991], [0.3047, 0.0847], [0.3125, -0.2828], [0.3203, -0.7821], [0.3281, -0.8113], [0.3359, -0.3231], [0.3438, 0.2284], [0.3516, 0.5046], [0.3594, 0.6657], [0.3672, 1.0512], [0.375, 1.6], [0.3828, 1.7903], [0.3906, 1.2314], [0.3984, 0.1985], [0.4062, -0.5716], [0.4141, -0.6292], [0.4219, -0.2456], [0.4297, -0.043], [0.4375, -0.2828], [0.4453, -0.6544], [0.4531, -0.7647], [0.4609, -0.6679], [0.4688, -0.7535], [0.4766, -1.1491], [0.4844, -1.4269], [0.4922, -1.0405]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0, 0], [0.0078, 1.0405], [0.0156, 1.4269], [0.0234, 1.1491], [0.0312, 0.7535], [0.0391, 0.6679], [0.0469, 0.7647], [0.0547, 0.6544], [0.0625, 0.2828], [0.0703, 0.043], [0.0781, 0.2456], [0.0859, 0.6292], [0.0938, 0.5716], [0.1016, -0.1985], [0.1094, -1.2314], [0.1172, -1.7903], [0.125, -1.6], [0.1328, -1.0512], [0.1406, -0.6657], [0.1484, -0.5046], [0.1562, -0.2284], [0.1641, 0.3231], [0.1719, 0.8113], [0.1797, 0.7821], [0.1875, 0.2828], [0.1953, -0.0847], [0.2031, 0.1991], [0.2109, 0.9741], [0.2188, 1.5535], [0.2266, 1.4552], [0.2344, 0.8612], [0.2422, 0.3014], [0.25, 0], [0.2578, -0.3014], [0.2656, -0.8612], [0.2734, -1.4552], [0.2812, -1.5535], [0.2891, -0.9741], [0.2969, -0.1991], [0.3047, 0.0847], [0.3125, -0.2828], [0.3203, -0.7821], [0.3281, -0.8113], [0.3359, -0.3231], [0.3438, 0.2284], [0.3516, 0.5046], [0.3594, 0.6657], [0.3672, 1.0512], [0.375, 1.6], [0.3828, 1.7903], [0.3906, 1.2314], [0.3984, 0.1985], [0.4062, -0.5716], [0.4141, -0.6292], [0.4219, -0.2456], [0.4297, -0.043], [0.4375, -0.2828], [0.4453, -0.6544], [0.4531, -0.7647], [0.4609, -0.6679], [0.4688, -0.7535], [0.4766, -1.1491], [0.4844, -1.4269], [0.4922, -1.0405]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true}
  ]
}
```

## 10. Code

Build two functions in a lab. Do not use `np.fft.fftfreq` inside them.

1. `bin_to_hz(k, fs, N)` returns the frequency in hertz of bin `k`.
2. `read_peaks(x, fs, threshold=0.01)` returns a list of `(frequency_hz, amplitude, phase_deg)`, one tuple for each bin from 0 to N/2 whose amplitude is larger than `threshold`. Use the correct rule for bins 0 and N/2.

You can compute $X$ with your own FFT from lesson L19, or with this NumPy call:

```python
X = np.fft.fft(x)
```

Acceptance tests:

1. `bin_to_hz(20, 1000, 500) == 40.0` and `bin_to_hz(12, 128, 64) == 24.0`.
2. For the spectrum signal (N = 64, `fs = 128`), the frequencies are `[6, 14, 24]`. The amplitudes match `[1.0, 0.6, 0.4]` with `np.allclose`. The phases match `[-90, -90, -90]` with `np.allclose`.
3. For `x = 0.3 + 0.5 * np.cos(np.pi * np.arange(64))` with `fs = 128`, the result holds `(0, 0.3, 0)` and `(64, 0.5, 0)`, up to rounding.
4. For `x = 0.8 * np.cos(2 * np.pi * 5 * np.arange(64) / 64 + np.pi / 6)` with `fs = 64`, the result is one tuple close to `(5.0, 0.8, 30.0)`.
5. A signal of 64 zeros gives an empty list.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)

Then try the [FFT explorer lab](/labs/new?template=fft-explorer):

1. Set the sample rate to 128 Hz and N to 64. Set frequency 1 to 6 Hz and frequency 2 to 14 Hz.
2. Read the peak heights. The lab plots $\lvert X \rvert / N$, so expect 0.5 and 0.25 for the amplitudes 1 and 0.5.
3. Set N to 128. The peaks stay at 6 Hz and 14 Hz, and the heights stay the same. The bin spacing changes from 2 Hz to 1 Hz.

```check
{
  "question": "Stuck on `read_peaks`? Use the hints in order.",
  "hint": "Hint 1: loop over the bins 0 to N/2 only. For each bin, compute the frequency. Then pick one of three amplitude rules: bin 0, bin N/2, or any other bin.",
  "answer": "Hint 2 (idea): bin 0 and bin N/2 divide by N. All other bins divide by N/2. The phase is `np.degrees(np.angle(X[k]))`. Keep a bin only when its amplitude is larger than the threshold. Then the phase of an empty bin never appears."
}
```

## 11. Common mistakes

1. **The bin number read as hertz.** Multiply the bin number by $f_s/N$.
2. **The magnitude read as the amplitude.** With NumPy, divide by $N/2$: $A = 2\lvert X[k] \rvert / N$.
3. **The factor 2 at bin 0 or bin N/2.** These two bins have no mirror partner. Divide by N.
4. **No check of the normalization.** Libraries scale by 1, $1/N$ or $1/\sqrt{N}$. Read the documentation first.
5. **The phase read at an empty bin.** At an empty bin the angle is rounding noise. Read the phase only at a clear peak.
6. **The window length computed as $(N-1)/f_s$.** N samples cover N time steps. The window lasts $N/f_s$.
7. **Power used as magnitude.** $\lvert X[k] \rvert^2$ is power. The amplitude formula uses $\lvert X[k] \rvert$.

## 12. One-minute explanation

The FFT gives bin numbers and complex values, but no hertz and no amplitudes. The probe of bin $k$ makes $k$ cycles in the window, and the window lasts $N/f_s$ seconds. So bin $k$ is $k f_s / N$ hertz, and neighboring bins are $f_s/N$ apart. For the spectrum signal, the bins are 2 Hz apart, so bins 3, 7 and 12 are 6, 14 and 24 Hz. The DFT adds N products and does not divide, and a real sinusoid puts half of its amplitude in a mirror bin. So the magnitude is $A \cdot N/2$, and $A = 2\lvert X[k] \rvert / N$. Bin 0 and bin $N/2$ have no mirror partner, so there $A = \lvert X[k] \rvert / N$. The phase of $X[k]$ is the phase of the component, measured from a cosine.

## 13. Check questions

```check
{
  "question": "Write the formula that changes bin $k$ into hertz, and the formula that changes $\\lvert X[k] \\rvert$ into an amplitude. For which bins does the amplitude formula not apply?",
  "hint": "The probe of bin $k$ makes $k$ cycles in a window of $N/f_s$ seconds.",
  "answer": "$f_k = k f_s / N$. $A = 2\\lvert X[k] \\rvert / N$ for $0 < k < N/2$, with the default NumPy DFT. It does not apply at bin 0 and at bin $N/2$. There the rule is $\\lvert X[k] \\rvert / N$, because these bins have no mirror partner."
}
```

```check
{
  "question": "N = 64 and $f_s$ = 128 Hz. A peak sits at bin 7 with $\\lvert X[7] \\rvert = 19.2$. Which frequency and which amplitude does it show?",
  "hint": "First compute the bin spacing. Then divide the magnitude by N/2.",
  "answer": "Bin spacing: 128 / 64 = 2 Hz. Frequency: 7 × 2 = 14 Hz. Amplitude: 2 × 19.2 / 64 = 38.4 / 64 = 0.6."
}
```

```check
{
  "question": "N = 64. A sinusoid that fits the window gives $\\lvert X[k] \\rvert = 16$ at a bin between 0 and 32. What is its amplitude?",
  "hint": "$\\lvert X[k] \\rvert = A \\cdot N / 2$.",
  "answer": "$A = 2 \\times 16 / 64 = 32 / 64 = 0.5$."
}
```

```check
{
  "question": "$f_s$ = 1000 Hz and N = 500. Which frequency does bin 20 hold?",
  "hint": "Bin spacing first.",
  "answer": "Bin spacing: 1000 / 500 = 2 Hz. Bin 20: 20 × 2 = 40 Hz. Check: the window lasts 0.5 s, and 40 Hz makes 20 cycles in 0.5 s."
}
```

```check
{
  "question": "Why does a cosine at bin $N/2$ give $\\lvert X[N/2] \\rvert = A \\cdot N$ and not $A \\cdot N/2$?",
  "hint": "Write the cosine as two arrows. Where does each arrow land?",
  "answer": "A cosine is two arrows of length $A/2$ that turn in opposite directions. At most bins, the probe catches only one arrow, and the other arrow adds to 0. At bin $N/2$ the probe is $(-1)^n$, a real wave, so the probe catches both arrows. The second sum is $\\sum e^{-i 2\\pi n} = N$, not 0. So $X[N/2] = AN\\cos\\varphi$, and for a cosine ($\\varphi = 0$) the magnitude is $AN$."
}
```

```check
{
  "question": "A speech system uses $f_s$ = 16,000 Hz and N = 512. What is the bin spacing? Which bin holds a 1000 Hz tone? Which frequency does bin 100 hold?",
  "hint": "$\\Delta f = f_s / N$ and $k = f / \\Delta f$.",
  "answer": "Bin spacing: 16000 / 512 = 31.25 Hz. A 1000 Hz tone: $k$ = 1000 / 31.25 = 32. It is a whole number, so the tone fits the window. Bin 100: 100 × 31.25 = 3125 Hz."
}
```

```check
{
  "question": "N = 40, and the only peak below N/2 is $X[5] = -10 + 0i$. What are the amplitude and the phase of the component? Write the component as a formula in $n$.",
  "hint": "$-10 = 10\\,e^{i\\pi}$.",
  "answer": "$\\lvert X[5] \\rvert = 10$, so $A = 2 \\times 10 / 40 = 0.5$. The phase is 180° ($\\pi$). The component is $0.5\\cos(2\\pi \\cdot 5n/40 + \\pi) = -0.5\\cos(2\\pi \\cdot 5n/40)$: a cosine that starts at its lowest point."
}
```

## 14. Links

- Previous lesson: [L22: Other FFTs](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts)
- Next lesson: [L24: The mirror](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)
- Part folder: [05 Reading spectra](/notes/maths/fft-signal-processing/05-reading-spectra)
- [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency): the time step and the window length
- [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula): the probe of bin $k$
- [F6: Euler's formula](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula) and [F7: Roots of unity](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity): the two tools of the derivation
- [L25: Leakage and windows](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows): a tone that does not fit the window
- [L33: Uncertainty](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty): window length against bin spacing
- [Glossary](/notes/maths/fft-signal-processing/glossary)
