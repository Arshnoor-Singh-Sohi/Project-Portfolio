---
title: "L26: Aliasing"
order: 4
summary: "A 7 Hz cosine sampled at 8 Hz gives the same samples as a 1 Hz cosine. Frequencies above fs/2 fold into the range 0 to fs/2, so filter before you sample."
status: not-started
tags: [sampling, aliasing, nyquist, anti-aliasing, resampling]
---

## 1. The question this idea answers

Lesson [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) said that a signal is not the same as its samples: $x[n] = x(n / f_s)$. The FFT sees only the samples. Everything between two samples is gone before the FFT starts.

Lesson [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror) found a strange fact. At $f_s$ = 128 Hz, a 122 Hz arrow and a −6 Hz arrow give the same samples. Lesson [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) showed one limit of the window. This lesson shows a second limit, and it comes from the sampling itself.

This lesson answers three questions:

1. Can two different waves give exactly the same samples?
2. Which frequency does the DFT report then?
3. How does a real system, for example a speech system at 16 kHz, prevent the problem?

## 2. Mental model

> [!analogy] A turning wheel in a film
> A film camera takes a fixed number of pictures in each second. A car wheel that turns fast can look slow, still, or even backward in the film. Between two pictures the wheel turns almost a full turn. The film shows only the small step that remains.
>
> **Where it stops working:** a viewer's eye guesses a smooth motion between the pictures. Sampling makes no guess. The samples of the two frequencies are exactly equal, not only similar. Also, the backward look of the wheel is a direction. A real cosine has no direction (lesson L24), so only a sine shows the reversal, as a sign flip.

## 3. Terms

| Term | Plain meaning |
|---|---|
| aliasing | A frequency above $f_s/2$ gives the same samples as a lower frequency. After sampling, no method can separate the two. |
| alias | The lower frequency that a high frequency imitates in the samples. |
| Nyquist frequency | $f_s/2$, half of the sample rate. The samples can show frequencies below it without aliasing. |
| apparent frequency ($f_a$) | The frequency that the samples and the DFT show. It is between 0 and $f_s/2$. |
| folding | The rule that maps every frequency into the range 0 to $f_s/2$, like a paper strip folded at every multiple of $f_s/2$. |
| low-pass filter | A filter that passes low frequencies and blocks high frequencies. |
| anti-aliasing filter | A low-pass filter before sampling. It removes the content at and above $f_s/2$. |
| resampling | A change of the sample rate of a digital signal, for example from 48 kHz to 16 kHz. |
| sampling theorem | If a signal has content only below $f_s/2$, its samples fully determine it. Another name is the Nyquist–Shannon theorem. |

## 4. Two cosines, one list of samples

Let $f_s$ = 8 Hz, so the time step is $\Delta t$ = 1/8 = 0.125 s. Compare two cosines:

$$
x_7[n] = \cos\left(2\pi \cdot 7 \cdot \frac{n}{8}\right) \qquad x_1[n] = \cos\left(2\pi \cdot 1 \cdot \frac{n}{8}\right)
$$

| $n$ | $t$ (s) | Angle of the 7 Hz wave | $x_7[n]$ | $x_1[n]$ |
|---|---|---|---|---|
| 0 | 0 | 0 | 1 | 1 |
| 1 | 0.125 | 1.75π | 0.71 | 0.71 |
| 2 | 0.25 | 3.5π | 0 | 0 |
| 3 | 0.375 | 5.25π | −0.71 | −0.71 |
| 4 | 0.5 | 7π | −1 | −1 |
| 5 | 0.625 | 8.75π | −0.71 | −0.71 |
| 6 | 0.75 | 10.5π | 0 | 0 |
| 7 | 0.875 | 12.25π | 0.71 | 0.71 |
| 8 | 1.0 | 14π | 1 | 1 |

The value 0.71 is $1/\sqrt{2} = 0.7071$, rounded to two decimals. The two columns are exactly equal, not only close. Check one row by hand. At $n$ = 3, the angle is 5.25π. Remove two full turns (4π) to get 1.25π = 225°, and $\cos 225° = -0.71$.

**Proof for every $n$.**

1. Split the angle: $2\pi \cdot 7n/8 = 2\pi \cdot 8n/8 - 2\pi n/8 = 2\pi n - 2\pi n/8$.
2. $n$ is a whole number, and the cosine repeats every $2\pi$. So $\cos(2\pi n - \alpha) = \cos(-\alpha)$.
3. The cosine is even: $\cos(-\alpha) = \cos\alpha$.
4. So $x_7[n] = \cos(2\pi n/8) = x_1[n]$ for every whole number $n$.

Between the samples, the two waves are very different. At $t$ = 0.0625 s, the 7 Hz wave is $\cos(157.5°) = -0.92$, and the 1 Hz wave is $\cos(22.5°) = 0.92$. The samples do not see this instant.

```plot
{
  "title": "7 Hz (red) and 1 Hz (blue) cosines: same samples (ink)",
  "xAxis": {"label": "time (s)", "domain": [-0.02, 1.02]},
  "yAxis": {"label": "value", "domain": [-1.4, 1.4]},
  "disableZoom": true,
  "data": [
    {"fn": "cos(43.982*x)", "color": "#C81D25"},
    {"fn": "cos(6.2832*x)", "color": "#1E6091"},
    {"points": [[0, 1], [0.125, 0.7071], [0.25, 0], [0.375, -0.7071], [0.5, -1], [0.625, -0.7071], [0.75, 0], [0.875, 0.7071], [1, 1]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0, 1], [0.125, 0.7071], [0.25, 0], [0.375, -0.7071], [0.5, -1], [0.625, -0.7071], [0.75, 0], [0.875, 0.7071], [1, 1]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

> [!example] The DFT cannot see the difference
> Take N = 8 samples ($n$ = 0 to 7, a 1 s window). Both cosines give the same DFT: $X = [0, 4, 0, 0, 0, 0, 0, 4]$. With lesson L23, bin 1 is 1 × 8 / 8 = 1 Hz, and $A$ = 2 × 4 / 8 = 1. So the DFT reports a 1 Hz cosine with amplitude 1. It cannot know that the input was 7 Hz.

> [!key] Aliasing
> After sampling at $f_s$, a frequency above $f_s/2$ gives exactly the same samples as a frequency between 0 and $f_s/2$. No computation on the samples can separate them.

## 5. The Nyquist frequency

### 5.1 Count the turn in each time step

Think of each frequency as an arrow (lesson [F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)). In one time step, an arrow of frequency $f$ turns by $360° \times f / f_s$.

1. At $f_s$ = 8 Hz, a 1 Hz arrow turns 360° × 1/8 = 45° in each step.
2. A 7 Hz arrow turns 360° × 7/8 = 315° in each step.
3. A turn of 315° counter-clockwise ends at the same place as a turn of 45° clockwise, because 315° − 360° = −45°.

So at each sample, the 7 Hz arrow is exactly where a −1 Hz arrow is. A cosine holds a $+f$ arrow and a $-f$ arrow in equal amounts (lesson L24). So the 7 Hz cosine holds arrows at +7 Hz and −7 Hz, and they land where the −1 Hz and +1 Hz arrows land. The result is a 1 Hz cosine.

![Left: a 1 Hz arrow sampled at 8 Hz moves +45° per sample. Right: a 7 Hz arrow moves +315° per sample, which lands at −45°. The real parts of the two arrows are equal at every sample, and the imaginary parts have opposite signs.](/notes/media/fft-signal-processing/figures/l26-seven-hz-looks-like-one-hz.svg)

### 5.2 The limit is half a turn

A turn of more than 180° in one step looks the same as a smaller turn in the other direction. The turn is exactly 180° when $f = f_s / 2$. So $f_s / 2$ is the limit. This is the Nyquist frequency.

| Sample rate $f_s$ | Nyquist frequency $f_s/2$ |
|---|---|
| 8 Hz | 4 Hz |
| 128 Hz | 64 Hz (bin 32 of the spectrum signal) |
| 16,000 Hz | 8,000 Hz |

At exactly $f_s/2$, the arrow turns 180° in each step. A cosine then gives $(-1)^n$, and a sine gives 0 at every sample (lesson [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude), section 6.2). So the content must stay below $f_s/2$, not at it.

> [!note] The sampling theorem
> If a signal has content only below $f_s/2$, its samples fully determine it. This is the sampling theorem, also called the Nyquist–Shannon theorem. This lesson uses it without a proof. Part 06 shows the reason: sampling in time makes the spectrum repeat every $f_s$ (lesson [L30](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l30-the-four-members)).

## 6. The folding rule

Use these steps to find the apparent frequency $f_a$ of any frequency $f$:

1. Compute the remainder $r = f \bmod f_s$. This removes all whole multiples of $f_s$.
2. If $r \le f_s/2$, then $f_a = r$. The phase stays the same.
3. If $r > f_s/2$, then $f_a = f_s - r$. The phase changes its sign.

| True $f$ | $r = f \bmod 8$ | $f_a$ | Phase |
|---|---|---|---|
| 1 Hz | 1 | 1 Hz | same |
| 3 Hz | 3 | 3 Hz | same |
| 4 Hz | 4 | 4 Hz | Nyquist: only the cosine part stays |
| 5 Hz | 5 | 8 − 5 = 3 Hz | sign flips |
| 7 Hz | 7 | 8 − 7 = 1 Hz | sign flips |
| 8 Hz | 0 | 0 Hz | same (a constant) |
| 9 Hz | 1 | 1 Hz | same |
| 12 Hz | 4 | 4 Hz | Nyquist: only the cosine part stays |
| 15 Hz | 7 | 8 − 7 = 1 Hz | sign flips |

More examples with other sample rates:

1. $f_s$ = 64 Hz, $f$ = 40 Hz: $r$ = 40 > 32, so $f_a$ = 64 − 40 = 24 Hz.
2. $f_s$ = 128 Hz, $f$ = 100 Hz: $r$ = 100 > 64, so $f_a$ = 128 − 100 = 28 Hz.
3. $f_s$ = 16,000 Hz, $f$ = 10,000 Hz: $r$ = 10,000 > 8,000, so $f_a$ = 6,000 Hz.

The name "folding" comes from a picture. Mark the frequency axis at 0, 4, 8, 12, 16 Hz, and so on. Fold it like a paper strip at each mark. Every frequency lands on the first piece, from 0 to 4 Hz.

```plot
{
  "title": "Folding at fs = 8 Hz (ink). Red stems: 5, 7, 9, 12, 15 Hz",
  "xAxis": {"label": "true frequency (Hz)", "domain": [-0.5, 20.5]},
  "yAxis": {"label": "apparent frequency (Hz)", "domain": [-0.5, 5]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 0], [4, 4], [8, 0], [12, 4], [16, 0], [20, 4]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[5, 0], [5, 3]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[7, 0], [7, 1]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[9, 0], [9, 1]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[12, 0], [12, 4]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[15, 0], [15, 1]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[5, 3], [7, 1], [9, 1], [12, 4], [15, 1]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true}
  ]
}
```

> [!trap] Subtract the sample rate only once
> The rule "$f_a = f - f_s$" is not general. For $f$ = 15 Hz at $f_s$ = 8 Hz, it gives 7 Hz, but 7 Hz is above the Nyquist frequency. The full rule gives $r$ = 7, then $f_a$ = 8 − 7 = 1 Hz.

## 7. Why a sine flips its sign

### 7.1 The 7 Hz sine

1. $\sin(2\pi \cdot 7n/8) = \sin(2\pi n - 2\pi n/8)$.
2. The sine repeats every $2\pi$, so this equals $\sin(-2\pi n/8)$.
3. The sine is odd: $\sin(-\alpha) = -\sin\alpha$.
4. So $\sin(2\pi \cdot 7n/8) = -\sin(2\pi n/8)$.

| $n$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| $\sin(2\pi \cdot 7n/8)$ | 0 | −0.71 | −1 | −0.71 | 0 | 0.71 | 1 | 0.71 |
| $\sin(2\pi \cdot 1n/8)$ | 0 | 0.71 | 1 | 0.71 | 0 | −0.71 | −1 | −0.71 |

The 7 Hz sine gives the samples of a 1 Hz sine, upside down. The figure in section 5.1 shows the reason. The imaginary part of an arrow is its sine. The 7 Hz arrow is the mirror image of the 1 Hz arrow, so its imaginary part has the opposite sign.

```plot
{
  "title": "7 Hz sine (red), sin(2πt) (blue), −sin(2πt) (ink)",
  "xAxis": {"label": "time (s)", "domain": [-0.02, 1.02]},
  "yAxis": {"label": "value", "domain": [-1.4, 1.4]},
  "disableZoom": true,
  "data": [
    {"fn": "sin(43.982*x)", "color": "#C81D25"},
    {"fn": "sin(6.2832*x)", "color": "#1E6091"},
    {"fn": "-sin(6.2832*x)", "color": "#100D12"},
    {"points": [[0, 0], [0.125, -0.7071], [0.25, -1], [0.375, -0.7071], [0.5, 0], [0.625, 0.7071], [0.75, 1], [0.875, 0.7071], [1, 0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[0, 0], [0.125, -0.7071], [0.25, -1], [0.375, -0.7071], [0.5, 0], [0.625, 0.7071], [0.75, 1], [0.875, 0.7071], [1, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true}
  ]
}
```

### 7.2 The general rule

Let $x[n] = A\cos(2\pi f n / f_s + \varphi)$, with $f = m f_s + r$ for a whole number $m$, and $r > f_s/2$. Let $f_a = f_s - r$.

1. The angle is $2\pi f n / f_s + \varphi = 2\pi m n + 2\pi r n / f_s + \varphi$.
2. Replace $r$ with $f_s - f_a$: $2\pi r n / f_s = 2\pi n - 2\pi f_a n / f_s$.
3. Remove the whole turns $2\pi m n$ and $2\pi n$. The angle becomes $-2\pi f_a n / f_s + \varphi$.
4. The cosine is even, so $\cos(-2\pi f_a n / f_s + \varphi) = \cos(2\pi f_a n / f_s - \varphi)$.

So $x[n] = A\cos(2\pi f_a n / f_s - \varphi)$: the same amplitude, the apparent frequency, and the opposite phase. A sine has $\varphi = -90°$, and its alias has $+90°$. That is $A\cos(\alpha + 90°) = -A\sin\alpha$, the sign flip.

> [!example] The DFT shows the flip
> N = 8 samples at $f_s$ = 8 Hz.
>
> - The 1 Hz sine gives $X[1] = -4i$: phase −90°.
> - The 7 Hz sine gives $X[1] = +4i$: phase +90°.
>
> This is the mirror of lesson L24. A 7 Hz component belongs in bin 7, which is bin −1. Bin 1 holds the conjugate of its value.

## 8. Prevent aliasing before sampling

After sampling, $x_7[n] = x_1[n]$ exactly. No algorithm can know which wave was there. So the protection must come before the sampling.

1. A microphone gives a continuous voltage.
2. An analog low-pass filter removes the content at and above $f_s/2$. This is the anti-aliasing filter.
3. The analog-to-digital converter measures the filtered voltage $f_s$ times in each second.

Real filters do not change from "pass" to "block" at one exact frequency. They need a transition band between the two. So a real system keeps a margin below $f_s/2$.

> [!example] Speech at 16 kHz
> Many speech models take audio at $f_s$ = 16,000 Hz. Whisper is one example: its audio code sets `SAMPLE_RATE = 16000`. The Nyquist frequency is 8,000 Hz. So a 16 kHz recording can hold content only below 8 kHz. Content above 8 kHz must go before the sampling. If it does not, a 10 kHz whistle appears at 16,000 − 10,000 = 6,000 Hz, inside the speech band.

> [!note] Source
> The Whisper source code, `whisper/audio.py`, sets `SAMPLE_RATE = 16000`, `N_FFT = 400` and `HOP_LENGTH = 160`.

## 9. Resampling needs a filter

Suppose a recording has $f_s$ = 48,000 Hz and a model needs 16,000 Hz. The simple idea is to keep every third sample. In NumPy, that is `x[::3]`. But this is a new sampling at 16 kHz, with a new Nyquist frequency of 8 kHz. All content from 8 kHz to 24 kHz folds into 0 to 8 kHz.

> [!example] Two tones, two methods
> Let the 48 kHz recording hold a 1 kHz tone and a 10 kHz tone, each with amplitude 1, for 0.1 s (4,800 samples). Both methods give 1,600 samples at 16 kHz. The amplitudes come from $2\lvert X[k] \rvert / N$:
>
> | Method | 1 kHz | 6 kHz |
> |---|---|---|
> | `x[::3]` (no filter) | 1.00 | 1.00 (a false tone) |
> | `scipy.signal.resample_poly(x, 1, 3)` | 1.00 | below 0.01 |
>
> The 10 kHz tone is above the new Nyquist frequency. With no filter, it folds to 16 − 10 = 6 kHz.

The correct order is: low-pass filter first, below the new Nyquist frequency, then keep every third sample. Library functions do both steps:

```python
y16 = scipy.signal.resample_poly(y48, up=1, down=3)
```

> [!note] Source
> The SciPy documentation of `scipy.signal.resample_poly` (version 1.18) says that it applies "a zero-phase low-pass FIR filter". Its default window for the filter design is a Kaiser window with the value 5.0.

## 10. Code

Build two functions in a lab:

1. `apparent_frequency(f, fs)` returns `(f_a, flipped)`. `f_a` is the apparent frequency, and `flipped` is True when the phase changes its sign.
2. `naive_downsample(x, m)` keeps every `m`-th sample.

Acceptance tests:

1. `apparent_frequency(7, 8) == (1, True)`, `apparent_frequency(9, 8) == (1, False)`, `apparent_frequency(3, 8) == (3, False)`, and `apparent_frequency(16, 8) == (0, False)`.
2. `apparent_frequency(40, 64) == (24, True)` and `apparent_frequency(10000, 16000) == (6000, True)`.
3. With `fs = 64` and N = 64, for every whole `f` from 0 to 200, the peak bin of `np.abs(np.fft.rfft(np.cos(2 * np.pi * f * np.arange(64) / 64)))` equals `apparent_frequency(f, 64)[0]`.
4. With `fs = 8` and N = 8, the phase of `np.fft.fft(np.sin(2 * np.pi * f * np.arange(8) / 8))[1]` is −90° for `f = 1` and `f = 9`, and +90° for `f = 7` and `f = 15`.
5. For the two-tone signal of section 9, `naive_downsample(x, 3)` shows an amplitude above 0.9 at 6 kHz, and `scipy.signal.resample_poly(x, 1, 3)` shows less than 0.01 there.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/05-reading-spectra/l26-aliasing)

Then use the [FFT explorer lab](/labs/new?template=fft-explorer). Set frequency 2 to 40 Hz with $f_s$ = 64 Hz and N = 64. The peak appears at 24 Hz, which is 64 − 40.

```check
{
  "question": "Stuck on `apparent_frequency`? Use the hints in order.",
  "hint": "Hint 1: Python has the remainder operator `%`. Compare the remainder with `fs / 2`.",
  "answer": "Hint 2 (idea): compute `r = f % fs`. If `r` is larger than `fs / 2`, the apparent frequency is `fs - r` and the phase flips. Otherwise the apparent frequency is `r` and the phase does not flip."
}
```

## 11. Common mistakes

1. **Aliasing expected to show in the FFT.** The samples are exactly the same as the samples of the alias. The FFT reports the alias, with no warning.
2. **A frequency above $f_s/2$ expected to disappear.** It does not disappear. It appears at a wrong, lower frequency.
3. **Downsampling by dropping samples.** `x[::3]` folds all content above the new Nyquist frequency. Filter first, or use a resampling function.
4. **The sample rate subtracted only once.** Use the remainder $f \bmod f_s$, then fold.
5. **The sign flip forgotten.** For $r > f_s/2$, the alias has the opposite phase. A sine becomes a negative sine.
6. **Sampling at exactly two times the highest frequency.** A sine at exactly $f_s/2$ gives 0 at every sample. Keep the content below $f_s/2$, with a margin.
7. **Two "Nyquist" terms mixed.** The Nyquist frequency is $f_s/2$, a property of the sampling. Some texts use "Nyquist rate" for two times the highest frequency of a signal. Keep the two apart.

## 12. One-minute explanation

Sampling keeps only the values at the sample times. In one time step, an arrow of frequency $f$ turns $360° \times f/f_s$. A turn of more than half a circle looks exactly like a smaller turn in the other direction. So every frequency above $f_s/2$, the Nyquist frequency, gives the same samples as a frequency below it. At 8 Hz, a 7 Hz cosine and a 1 Hz cosine give identical samples. A 7 Hz sine gives the samples of a 1 Hz sine with the opposite sign. To find the alias, take $r = f \bmod f_s$, and if $r > f_s/2$, use $f_s - r$. After sampling, nothing can separate the two waves. So a low-pass filter must remove the high content before sampling, and before every downsampling.

## 13. Check questions

```check
{
  "question": "A speech system samples at 16,000 Hz. What is its Nyquist frequency? With no anti-aliasing filter, where does a 10,000 Hz tone appear?",
  "hint": "Fold the frequency with $f_s - r$.",
  "answer": "Nyquist frequency: 16000 / 2 = 8000 Hz. $r$ = 10000 mod 16000 = 10000, which is above 8000. So $f_a$ = 16000 − 10000 = 6000 Hz, with the opposite phase."
}
```

```check
{
  "question": "$f_s$ = 10 Hz. Find the apparent frequency of a 13 Hz cosine. Then find the apparent frequency of a 9 Hz sine. Write its samples as a formula with the alias frequency.",
  "hint": "Compute the remainder first, then compare it with 5 Hz.",
  "answer": "13 Hz: $r$ = 13 mod 10 = 3, and 3 ≤ 5, so 3 Hz with the same phase. 9 Hz: $r$ = 9, and 9 > 5, so $f_a$ = 10 − 9 = 1 Hz and the phase flips. The samples are $\\sin(2\\pi \\cdot 9n/10) = -\\sin(2\\pi \\cdot 1n/10)$."
}
```

```check
{
  "question": "Why can no algorithm remove aliasing after the sampling?",
  "hint": "Compare the two lists of samples in section 4.",
  "answer": "After sampling, the 7 Hz cosine and the 1 Hz cosine give exactly the same numbers. An algorithm sees only these numbers. So it has no information that can tell it which wave was there. The high content must go before the sampling, with an anti-aliasing filter."
}
```

```check
{
  "question": "$f_s$ = 128 Hz and N = 64. The input is a 100 Hz cosine with no anti-aliasing filter. Which bin shows a peak below N/2, and which frequency does the DFT report?",
  "hint": "Fold first, then use the bin spacing of L23.",
  "answer": "$r$ = 100, which is above 64, so $f_a$ = 128 − 100 = 28 Hz. The bin spacing is 128 / 64 = 2 Hz, so the peak is at bin 28 / 2 = 14. The DFT reports 28 Hz. The mirror peak is at bin 64 − 14 = 50."
}
```

```check
{
  "question": "You downsample a 48 kHz recording to 16 kHz with `x[::3]` and no filter. The recording holds an 11 kHz tone. Where does it appear? How do you prevent this?",
  "hint": "The new sample rate is 16 kHz.",
  "answer": "New Nyquist frequency: 8 kHz. $r$ = 11000 mod 16000 = 11000, which is above 8000. So $f_a$ = 16000 − 11000 = 5000 Hz, a false 5 kHz tone. Prevent it with a low-pass filter below 8 kHz before you keep every third sample, for example with `scipy.signal.resample_poly(x, 1, 3)`."
}
```

```check
{
  "question": "$f_s$ = 8 Hz. Compute the first four samples ($n$ = 0 to 3) of $\\cos(2\\pi \\cdot 9n/8)$. Which wave gives the same samples?",
  "hint": "$9n/8 = n + n/8$.",
  "answer": "$\\cos(2\\pi \\cdot 9n/8) = \\cos(2\\pi n + 2\\pi n/8) = \\cos(2\\pi n/8)$. The samples are 1, 0.71, 0, −0.71 (0.71 is $1/\\sqrt{2}$, rounded). The 1 Hz cosine gives the same samples. Here $r$ = 1 ≤ 4, so the phase does not flip."
}
```

## 14. Links

- Previous lesson: [L25: Leakage and windows](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)
- Next lesson: [L27: The final gate](/notes/maths/fft-signal-processing/05-reading-spectra/l27-final-gate)
- Part folder: [05 Reading spectra](/notes/maths/fft-signal-processing/05-reading-spectra)
- [L6: Samples](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples): a signal is not the same as its samples
- [F6: Euler's formula](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula): a frequency as a turning arrow
- [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude): the Nyquist bin
- [L24: The mirror](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror): negative frequencies and the conjugate
- [L30: The four members of the family](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l30-the-four-members): why sampling makes the spectrum repeat
- [L39: The speech-to-text front end](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end): 16 kHz audio in a real model
- [Glossary](/notes/maths/fft-signal-processing/glossary)
