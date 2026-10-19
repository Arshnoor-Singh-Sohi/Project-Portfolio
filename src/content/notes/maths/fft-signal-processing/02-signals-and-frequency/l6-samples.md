---
title: "L6: Samples"
order: 6
summary: "A computer keeps a signal only as samples: x[n] = x(n/fs). Each sample is one number for one instant, stored as an integer, and many curves fit the same samples."
status: not-started
tags: [signals, samples, sampling, quantization, nyquist]
---

## 1. The question this idea answers

Lessons L1 to L5 used a signal with a value at every instant. A computer has finite memory. It cannot keep a value for every instant. So what exactly does it keep? What does one stored number mean? And what does the computer lose?

This lesson answers these questions. It closes part 02. From part 03 on, every method works only with a list of samples. The previous lesson is [L5: Two domains](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains). The time step and the sample rate come from [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency).

## 2. Mental model

> [!analogy] A camera that takes one photo at equal time steps
> A camera points at a moving swing. It takes one photo every 0.125 s. Each photo shows where the swing is at one instant. The camera keeps the photos, and nothing between them. The photos are the samples. The time between two photos is the time step.
>
> **Where it stops working:** a real photo needs a short exposure, so it covers a small piece of time. A sample covers no time at all. It is one value at one instant. Also, a person who sees the photos imagines the motion between them. A computer adds nothing between the samples. It holds only the numbers.

## 3. Terms

| Term | Plain meaning |
|---|---|
| sampling | Reading a continuous signal at equal time steps and keeping only those values. |
| sample number ($n$) | The position of a sample in the list: 0, 1, 2, and so on. It is always a whole number. |
| $x[n]$ | The value of sample $n$. Square brackets hold a sample number. Round brackets, as in $x(t)$, hold a time. |
| sample time ($t_n$) | The instant of sample $n$: $t_n = n \, \Delta t = n / f_s$. |
| converter (ADC) | Analog-to-digital converter. The part that measures the microphone voltage at each sample time and stores it as an integer. |
| quantization | Rounding each sample to the nearest value that the storage can hold. |
| bit depth | The number of bits for one sample. 16 bits give 65,536 possible integers. |
| 16-bit PCM | Plain storage of samples as 16-bit integers, from −32,768 to 32,767. PCM means pulse-code modulation. |
| Nyquist frequency | Half the sample rate: $f_s/2$. Every component must be below it. |
| aliasing | A component above $f_s/2$ gives the same samples as a lower frequency. Full lesson: L26. |

## 4. The sampling rule

Sampling reads the continuous signal $x(t)$ at equal time steps $\Delta t = 1/f_s$:

$$
x[n] = x(n \, \Delta t) = x\!\left(\frac{n}{f_s}\right), \qquad n = 0, 1, \dots, N-1
$$

Use these steps:

1. Choose the sample rate $f_s$. Compute the time step $\Delta t = 1/f_s$.
2. For each sample number $n$, compute the sample time $t_n = n/f_s$.
3. Read the signal at that time: $x[n] = x(t_n)$.

The sample number $n$ is always a whole number. So $x[2]$ exists, but $x[2.5]$ does not. The time $t$ can be any number. So $x(0.3125)$ exists: it is the value of the continuous signal at 0.3125 s.

## 5. Worked example: a 2 Hz sine at $f_s$ = 8 Hz

> [!example] Sample $x(t) = \sin(2\pi \cdot 2t)$ with $f_s$ = 8 Hz and $N = 8$
> The time step is $\Delta t = 1/8 = 0.125$ s.
>
> | $n$ | $t_n = n/8$ (s) | Angle $2\pi \cdot 2 \cdot t_n$ | $x[n]$ |
> |---|---|---|---|
> | 0 | 0 | 0 | 0 |
> | 1 | 0.125 | $\pi/2$ | 1 |
> | 2 | 0.25 | $\pi$ | 0 |
> | 3 | 0.375 | $3\pi/2$ | −1 |
> | 4 | 0.5 | $2\pi$ | 0 |
> | 5 | 0.625 | $5\pi/2$ | 1 |
> | 6 | 0.75 | $3\pi$ | 0 |
> | 7 | 0.875 | $7\pi/2$ | −1 |
>
> The list is [0, 1, 0, −1, 0, 1, 0, −1]. This is list A of lesson L2.

Check the result with Method 1 of lesson L2:

1. The period is 4 samples (from $n = 0$ to $n = 4$: value 0, moving up).
2. $T = 4 \times 0.125 = 0.5$ s.
3. $f = 1/0.5 = 2$ Hz. This is the frequency that we sampled.

> [!trap] The list alone does not give the frequency
> The list [0, 1, 0, −1, 0, 1, 0, −1] at $f_s$ = 8 Hz is a 2 Hz wave. The same list at $f_s$ = 4 Hz covers 2 s, and it is a 1 Hz wave. So the sample rate must travel with the samples. A WAV file stores $f_s$ in its header.

> [!note] Floating-point zeros
> In code, `np.sin(np.pi)` gives about 1.22e-16, not 0. A computer stores most numbers with a small rounding error. Compare samples with `np.isclose` or `np.allclose`, not with `==`.

## 6. What one sample means

One sample is the value of the signal at one instant. For a microphone, it is the voltage at that instant, scaled into a number. The voltage follows the air pressure (lesson L1). So a sample says: "at this instant, the pressure was this far above or below normal."

A sample is **not** the pitch, the loudness or the frequency. Those describe how many samples change together. Two examples show this:

1. **The value 1.** In lesson L1, the value 1 appears in a 1 Hz, a 2 Hz and a 6 Hz wave. One sample with the value 1 fits all three.
2. **The value 0.** List A has the value 0 at $n = 0, 2, 4, 6$. Yet A is a full-strength wave. A silent signal also has the value 0 at every sample. One sample of 0 cannot tell silence from a loud wave.

| To find... | You need... | Lesson |
|---|---|---|
| the frequency | the samples of at least one cycle, and $f_s$ | L2 |
| the amplitude | the largest values over at least one cycle | L3 |
| the phase | where the cycle starts, against a reference wave | L4 |
| the loudness | the RMS over a stretch of samples | L3 |

> [!key] One sample, one instant
> A sample is one number: the scaled value of the signal at one instant. Frequency, amplitude, phase and loudness are properties of many samples together.

## 7. Dots, not a curve

The computer keeps only the dots. Between two dots, the list holds nothing. The graphs on these pages join the dots with lines only to help the eye. Those lines are not stored.

A sample has no length. The time step $\Delta t$ is the gap between two neighboring samples. Lesson L2 uses one convention: $N$ samples cover $N \, \Delta t$ seconds. For the example above:

1. The last sample, $n = 7$, is at $t = 0.875$ s.
2. The list covers $8 \times 0.125 = 1$ s. The last time step runs from 0.875 s to the place of the next sample, 1 s.

The mystery signal follows the same convention. Its 64 samples at $f_s$ = 128 Hz end at $t = 63/128 = 0.4921875$ s, and they cover $64/128 = 0.5$ s.

![Alt text: a 2 Hz signal, its 8 samples, their 16-bit integers, and the bytes that a file stores for them](/notes/media/fft-signal-processing/figures/l6-from-signal-to-bytes.svg)

The figure uses the amplitude 0.5, so every integer stays inside the 16-bit range. Section 9 explains each step after the samples.

## 8. Real numbers for speech

Speech recognition often uses $f_s$ = 16,000 samples per second:

$$
\Delta t = \frac{1}{16{,}000} \text{ s} = 0.0625 \text{ ms} = 62.5 \ \mu\text{s}
$$

| Stretch of audio | Number of samples at 16 kHz |
|---|---|
| 1 s | 16,000 |
| 25 ms | 400 |
| 20 ms | 320 |
| 10 ms | 160 |

Each count is $f_s \times$ duration. For example, $16{,}000 \times 0.025 = 400$.

| Sample rate | Where it is common | Highest frequency kept ($f_s/2$) |
|---|---|---|
| 8,000 Hz | classic telephone audio | 4,000 Hz |
| 16,000 Hz | speech recognition | 8,000 Hz |
| 44,100 Hz | CD audio | 22,050 Hz |
| 48,000 Hz | video and many recording devices | 24,000 Hz |

Section 11 explains the last column.

## 9. Quantization: from a value to an integer

The converter measures the voltage at each sample time. It cannot keep every digit. It rounds the value to the nearest integer that the bit depth allows. This rounding is **quantization**.

### 16-bit PCM

16 bits give $2^{16} = 65{,}536$ integers: from −32,768 to 32,767. Code often scales samples into the range −1 to 1. One common convention changes between the two scales like this:

$$
\text{integer} = \text{round}(\text{value} \times 32{,}768) \qquad \text{value} = \frac{\text{integer}}{32{,}768}
$$

The top integer is 32,767, so a value of exactly 1.0 must clip to 32,767 (lesson L3). Some tools use 32,767 as the factor instead. Check the convention of your tool.

| Value | Value × 32,768 | Stored integer | Back to a value | Error |
|---|---|---|---|---|
| 0.5 | 16,384 | 16,384 | 0.5 | 0 |
| 0.25 | 8,192 | 8,192 | 0.25 | 0 |
| 0.3 | 9,830.4 | 9,830 | 0.29998779 | about −0.0000122 |
| $1/\sqrt{2} \approx 0.70710678$ | 23,170.475 | 23,170 | 0.70709229 | about −0.0000145 |
| −1.0 | −32,768 | −32,768 | −1.0 | 0 |

One integer step is $1/32{,}768 \approx 0.0000305$. Rounding moves a value by at most half a step, about 0.0000153. This error is very small, but it is never exactly zero for most values.

> [!example] Worked example: a coarse grid shows the idea
> Suppose the storage could keep only multiples of 0.25. Sample a 2 Hz sine at $f_s$ = 32 Hz. Round each sample to the nearest multiple of 0.25.
>
> | $n$ | $x[n]$ | Stored | Error |
> |---|---|---|---|
> | 0 | 0 | 0 | 0 |
> | 1 | 0.3827 | 0.5 | 0.1173 |
> | 2 | 0.7071 | 0.75 | 0.0429 |
> | 3 | 0.9239 | 1 | 0.0761 |
> | 4 | 1 | 1 | 0 |
>
> The largest error is 0.1173. It stays below half a step, 0.125. A 16-bit step is 8,192 times smaller than 0.25, so the same errors become tiny.

### From integers to bytes

One byte holds 8 bits. So one 16-bit sample needs 2 bytes. A WAV file stores the low byte first. For example, 16,384 is 4000 in hexadecimal, and the file stores the two bytes `00 40`. The file stores the integer −16,384 as `00 C0`.

The amount of audio data per second is

$$
\text{bytes per second} = f_s \times \text{bytes per sample} \times \text{channels}
$$

> [!example] Worked example: bytes per second
> 1. Speech, 16 kHz, 16-bit, mono (1 channel): $16{,}000 \times 2 \times 1 = 32{,}000$ bytes per second. That is $32{,}000 \times 8 = 256{,}000$ bits per second. One minute is $32{,}000 \times 60 = 1{,}920{,}000$ bytes.
> 2. CD audio, 44.1 kHz, 16-bit, stereo (2 channels): $44{,}100 \times 2 \times 2 = 176{,}400$ bytes per second.

A WAV file adds a short header before the samples. The simplest header has 44 bytes. It holds facts such as $f_s$, the bit depth and the number of channels.

> [!note] Source: SciPy and the telephone standard
> The SciPy documentation for `scipy.io.wavfile.read` lists 16-bit PCM as the NumPy type `int16`, from −32768 to +32767. A test with SciPy 1.18.1 gave the same type. The telephone standard G.711 samples at 8,000 Hz with 8 bits per sample on a non-linear scale: 64 kbit/s. It passes the band from 300 to 3,400 Hz.

So, what does a computer store for one second of your voice? It stores bytes. Each pair of bytes is one integer. Each integer is one sample: the scaled microphone value at one instant. At 16 kHz, one second holds 16,000 of them.

## 10. A signal is not the same as its samples

Many different curves pass through the same dots. Sample a 1 Hz cosine and a 7 Hz cosine at $f_s$ = 8 Hz:

| $n$ | $t_n$ (s) | $\cos(2\pi \cdot 1 \cdot t_n)$ | $\cos(2\pi \cdot 7 \cdot t_n)$ |
|---|---|---|---|
| 0 | 0 | 1 | 1 |
| 1 | 0.125 | 0.71 | 0.71 |
| 2 | 0.25 | 0 | 0 |
| 3 | 0.375 | −0.71 | −0.71 |
| 4 | 0.5 | −1 | −1 |
| 5 | 0.625 | −0.71 | −0.71 |
| 6 | 0.75 | 0 | 0 |
| 7 | 0.875 | 0.71 | 0.71 |

> [!note] Rounded values
> On this page, 0.71 is $1/\sqrt{2} \approx 0.7071$ rounded to two decimals.

The two columns are identical. They are list D of lesson L2. Here is the reason, step by step:

1. $\cos(2\pi \cdot 7n/8) = \cos(2\pi n - 2\pi n/8)$, because $7/8 = 1 - 1/8$.
2. For a whole number $n$, $2\pi n$ is a whole number of turns. Subtracting whole turns does not change a cosine. So $\cos(2\pi n - 2\pi n/8) = \cos(-2\pi n/8)$.
3. The cosine gives the same value for $\theta$ and $-\theta$. So $\cos(-2\pi n/8) = \cos(2\pi n/8)$, the 1 Hz cosine.

Check $n = 1$ with numbers: $\cos(2\pi \cdot 7/8) = \cos(7\pi/4) \approx 0.7071$, and $\cos(2\pi/8) = \cos(\pi/4) \approx 0.7071$.

From the dots alone, you cannot tell the 1 Hz cosine from the 7 Hz cosine. This is **aliasing**: the 7 Hz component appears as 1 Hz. Lesson L26 explains it in full.

> [!example] Worked example: a wave that disappears
> Sample a 4 Hz sine at $f_s$ = 8 Hz: $x[n] = \sin(2\pi \cdot 4n/8) = \sin(\pi n)$. For every whole number $n$, $\sin(\pi n) = 0$. So all samples are 0. The samples look like silence, but the wave was there.
>
> A 4 Hz cosine at the same $f_s$ gives $\cos(\pi n)$ = [1, −1, 1, −1, ...]. At exactly $f_s/2$, the result depends on the phase. So $f_s/2$ itself is not safe.

## 11. The Nyquist rule

This lesson states the rule without proof. Lesson L26 shows what happens when you break it.

> [!key] The Nyquist rule
> A component with frequency $f$ keeps its identity in the samples only if
> $$
> f < \frac{f_s}{2}
> $$
> The number $f_s/2$ is the Nyquist frequency. Every component must be strictly below it.

Apply the rule to the examples on this page:

| Signal | $f_s$ | $f_s/2$ | Result |
|---|---|---|---|
| 2 Hz sine | 8 Hz | 4 Hz | $2 < 4$: safe |
| 1 Hz cosine | 8 Hz | 4 Hz | $1 < 4$: safe |
| 7 Hz cosine | 8 Hz | 4 Hz | $7 > 4$: appears as 1 Hz |
| 4 Hz sine | 8 Hz | 4 Hz | $4 = 4$: not safe, all samples are 0 |
| mystery signal, highest component 24 Hz | 128 Hz | 64 Hz | $24 < 64$: safe |
| speech up to 8,000 Hz | 16,000 Hz | 8,000 Hz | components must be below 8,000 Hz |

The rule also has a positive side. If every component is below $f_s/2$, the samples hold all the information of the curve. In theory, you can rebuild the curve exactly between the dots. Real converters protect this condition: a filter before the converter removes the components above $f_s/2$.

## 12. Graphs

The first graph shows a curve and its samples. The computer keeps only the blue dots. The blue lines only join the dots.

```plot
{
  "title": "x(t) = sin(2π·2t) (ink) and its samples at fs = 8 Hz (blue)",
  "xAxis": { "label": "time (s)", "domain": [0, 1] },
  "yAxis": { "label": "value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(12.566*x)", "color": "#100D12" },
    { "points": [[0, 0], [0.125, 1], [0.25, 0], [0.375, -1], [0.5, 0], [0.625, 1], [0.75, 0], [0.875, -1]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0], [0.125, 1], [0.25, 0], [0.375, -1], [0.5, 0], [0.625, 1], [0.75, 0], [0.875, -1]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true }
  ]
}
```

The second graph shows two different curves through the same 8 dots.

```plot
{
  "title": "cos(2π·1t) (blue) and cos(2π·7t) (red) share the same samples at fs = 8 Hz (ink)",
  "xAxis": { "label": "time (s)", "domain": [0, 1] },
  "yAxis": { "label": "value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "fn": "cos(6.2832*x)", "color": "#1E6091" },
    { "fn": "cos(43.982*x)", "color": "#C81D25" },
    { "points": [[0, 1], [0.125, 0.7071], [0.25, 0], [0.375, -0.7071], [0.5, -1], [0.625, -0.7071], [0.75, 0], [0.875, 0.7071]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[0, 1], [0.125, 0.7071], [0.25, 0], [0.375, -0.7071], [0.5, -1], [0.625, -0.7071], [0.75, 0], [0.875, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true }
  ]
}
```

The third graph shows a 4 Hz sine that gives only zeros at $f_s$ = 8 Hz.

```plot
{
  "title": "sin(2π·4t) (red) sampled at fs = 8 Hz: every sample is 0 (ink)",
  "xAxis": { "label": "time (s)", "domain": [0, 1] },
  "yAxis": { "label": "value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(25.133*x)", "color": "#C81D25" },
    { "points": [[0, 0], [0.125, 0], [0.25, 0], [0.375, 0], [0.5, 0], [0.625, 0], [0.75, 0], [0.875, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[0, 0], [0.125, 0], [0.25, 0], [0.375, 0], [0.5, 0], [0.625, 0], [0.75, 0], [0.875, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true }
  ]
}
```

The last graph shows quantization on a coarse grid with step 0.25. Each red dot is the blue dot rounded to the nearest multiple of 0.25.

```plot
{
  "title": "Samples of a 2 Hz sine at fs = 32 Hz (blue) and stored on a 0.25 grid (red)",
  "xAxis": { "label": "time (s)", "domain": [0, 0.5] },
  "yAxis": { "label": "value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "points": [[0.0, 0.0], [0.03125, 0.3827], [0.0625, 0.7071], [0.09375, 0.9239], [0.125, 1.0], [0.15625, 0.9239], [0.1875, 0.7071], [0.21875, 0.3827], [0.25, 0.0], [0.28125, -0.3827], [0.3125, -0.7071], [0.34375, -0.9239], [0.375, -1.0], [0.40625, -0.9239], [0.4375, -0.7071], [0.46875, -0.3827]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0.0, 0.0], [0.03125, 0.3827], [0.0625, 0.7071], [0.09375, 0.9239], [0.125, 1.0], [0.15625, 0.9239], [0.1875, 0.7071], [0.21875, 0.3827], [0.25, 0.0], [0.28125, -0.3827], [0.3125, -0.7071], [0.34375, -0.9239], [0.375, -1.0], [0.40625, -0.9239], [0.4375, -0.7071], [0.46875, -0.3827]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true },
    { "points": [[0.0, 0.0], [0.03125, 0.5], [0.0625, 0.75], [0.09375, 1.0], [0.125, 1.0], [0.15625, 1.0], [0.1875, 0.75], [0.21875, 0.5], [0.25, 0.0], [0.28125, -0.5], [0.3125, -0.75], [0.34375, -1.0], [0.375, -1.0], [0.40625, -1.0], [0.4375, -0.75], [0.46875, -0.5]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[0.0, 0.0], [0.03125, 0.5], [0.0625, 0.75], [0.09375, 1.0], [0.125, 1.0], [0.15625, 1.0], [0.1875, 0.75], [0.21875, 0.5], [0.25, 0.0], [0.28125, -0.5], [0.3125, -0.75], [0.34375, -1.0], [0.375, -1.0], [0.40625, -1.0], [0.4375, -0.75], [0.46875, -0.5]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true }
  ]
}
```

## 13. Code

Write a sampler, a 16-bit converter and an aliasing test.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/02-signals-and-frequency/l6-samples)

### Exercise 1: sample a sine and print the table

Write `sample(f, fs, N, A=1.0, phi=0.0)`. It returns three arrays: `n`, `t` and `x`, with $x[n] = A\sin(2\pi f t_n + \varphi)$. Then print the table of section 5: one row per sample, with $n$, $t_n$ and $x[n]$.

Acceptance tests, with `n, t, x = sample(2, 8, 8)`:

1. `x.shape == (8,)` and `np.isclose(t[1], 0.125)` are True.
2. `np.allclose(x, [0, 1, 0, -1, 0, 1, 0, -1])` is True.
3. With `sample(2, 16, 16)`, the first four values are close to `[0, 0.7071, 1, 0.7071]` (use `atol=1e-4`).
4. With `sample(6, 128, 64)`, the last time is `0.4921875`.

### Exercise 2: 16-bit integers and bytes

Write `to_int16(x)`: multiply by 32,768, round, clip to the 16-bit range, and return an array of type `np.int16`. Write `bytes_per_second(fs, bits, channels)`.

Acceptance tests:

1. `to_int16(np.array([0.5, -0.5, 0.25]))` equals `[16384, -16384, 8192]`.
2. `to_int16(np.array([1.0]))` equals `[32767]`, and `to_int16(np.array([-1.0]))` equals `[-32768]`.
3. `to_int16(np.array([0.3])).dtype == np.int16` is True.
4. `bytes_per_second(16000, 16, 1) == 32000` and `bytes_per_second(44100, 16, 2) == 176400` are True.
5. `to_int16(np.array([0.5])).tobytes()` equals `b'\x00\x40'` on a little-endian computer.

### Exercise 3: two curves, one list of samples

Sample $\cos(2\pi \cdot 1t)$ and $\cos(2\pi \cdot 7t)$. Your `sample` function makes sines. Pass `phi=np.pi / 2` to get a cosine, because $\cos\theta = \sin(\theta + \pi/2)$ (lesson L4). Acceptance tests:

1. At $f_s$ = 8 Hz and $N = 8$, the two lists are equal (`np.allclose` is True).
2. At $f_s$ = 16 Hz and $N = 16$, the two lists differ (`np.allclose` is False). Explain why with $f_s/2$.
3. A 4 Hz sine at $f_s$ = 8 Hz gives only zeros (`np.allclose(x, 0)` is True).

```check
{
  "question": "Stuck on `to_int16`? Reveal a hint.",
  "hint": "Do the three steps in order: scale, round, clip. Change the type last.",
  "answer": "Multiply the array by 32768. Round to the nearest whole number. Clip the result to the range −32768 to 32767, so that 1.0 becomes 32767. Only then change the type to `np.int16`. If you change the type before you clip, 32768 does not fit and gives a wrong value."
}
```

## 14. Common mistakes

1. **One sample tells the pitch.** A sample is the value at one instant. Pitch follows the frequency, and the frequency needs many samples and $f_s$.
2. **A sample has a length.** A sample is an instant. The time step $\Delta t$ is the gap between two samples.
3. **The computer stores the lines between the dots.** It stores only the dots. Plots join them to help the eye.
4. **The list alone gives the frequency.** You also need $f_s$. The same list is 2 Hz at 8 Hz and 1 Hz at 4 Hz.
5. **A sample of 0 means silence.** A loud wave has the value 0 twice in each cycle.
6. **Sampling at exactly $2f$ is enough.** The rule is $f < f_s/2$, strictly. A 4 Hz sine at 8 Hz gives only zeros.
7. **16-bit means 16 levels.** 16 bits give $2^{16} = 65{,}536$ integers.
8. **Bytes for bits.** 16 kHz mono 16-bit audio is 32,000 bytes per second, which is 256,000 bits per second.

## 15. One-minute explanation

A computer cannot keep a value for every instant. It reads the signal at equal time steps and keeps those values: the samples. The rule is $x[n] = x(n/f_s)$, where $n$ is the sample number and $f_s$ is the sample rate. For a microphone, one sample is the voltage at one instant, scaled into a number. It is not the pitch or the loudness: those need many samples. A sample has no length, and the computer stores nothing between two samples. In 16-bit PCM, each sample is an integer from −32,768 to 32,767, stored in 2 bytes. At 16 kHz mono, that is 32,000 bytes per second. A signal is not the same as its samples: a 1 Hz and a 7 Hz cosine give the same samples at 8 Hz. To avoid this, every component must be below $f_s/2$, the Nyquist frequency.

## 16. Check questions

```check
{
  "question": "A 16-bit voice recording at $f_s$ = 16 kHz holds the integer 16,384 at sample 1,000. What does this one number describe? What does it not describe?",
  "hint": "Ask what one instant can tell you.",
  "answer": "It is the scaled microphone value at one instant: $16{,}384/32{,}768 = 0.5$, half of full scale, above the normal pressure. At $f_s$ = 16 kHz, sample 1,000 is at $t = 1{,}000/16{,}000 = 0.0625$ s. It does not describe the pitch, the frequency, the amplitude or the loudness. Those need many samples."
}
```

```check
{
  "question": "Sample $x(t) = \\sin(2\\pi \\cdot 1t)$ at $f_s$ = 4 Hz with $N = 4$. Give $\\Delta t$, every $t_n$ and every $x[n]$.",
  "hint": "$t_n = n/f_s$. Then compute the angle $2\\pi t_n$.",
  "answer": "$\\Delta t = 1/4 = 0.25$ s. $t_n$ = 0, 0.25, 0.5, 0.75 s. Angles: 0, $\\pi/2$, $\\pi$, $3\\pi/2$. Values: $x[n]$ = [0, 1, 0, −1]. The 4 samples cover 1 s and hold 1 cycle, so $f = 1$ Hz."
}
```

```check
{
  "question": "How many bytes does 2 s of 16 kHz, 16-bit, mono audio need, without the header? How many samples is that?",
  "hint": "bytes per second = $f_s$ × bytes per sample × channels.",
  "answer": "Samples: $16{,}000 \\times 2 = 32{,}000$. Bytes per second: $16{,}000 \\times 2 \\times 1 = 32{,}000$. For 2 s: $32{,}000 \\times 2 = 64{,}000$ bytes."
}
```

```check
{
  "question": "Why can one sample not tell you the frequency of a sound, even with $f_s$ known?",
  "hint": "Find two waves of different frequency with the same value at some instant.",
  "answer": "The frequency counts how many cycles happen in one second. One sample is one value at one instant, so it shows no cycle at all. For example, $\\sin(2\\pi \\cdot 2t)$ is 1 at $t = 0.125$ s and $\\sin(2\\pi \\cdot 6t)$ is 1 at $t = 1/24$ s. To count cycles, you need the samples of at least one cycle (lesson L2)."
}
```

```check
{
  "question": "A system samples at $f_s$ = 16 kHz. A 9 kHz whistle reaches the converter with no filter before it. Is this safe? What does the rule predict?",
  "hint": "Compare the frequency with $f_s/2$.",
  "answer": "Not safe. $f_s/2 = 8$ kHz, and $9 > 8$. The 9 kHz component does not keep its identity in the samples. It appears as a lower frequency. Lesson L26 shows that it appears at $16 - 9 = 7$ kHz. A filter before the converter must remove it."
}
```

```check
{
  "question": "Show that $\\cos(2\\pi \\cdot 9t)$ and $\\cos(2\\pi \\cdot 1t)$ give the same samples at $f_s$ = 8 Hz. Check $n = 1$ with numbers.",
  "hint": "$9/8 = 1 + 1/8$. A whole number of turns does not change a cosine.",
  "answer": "$\\cos(2\\pi \\cdot 9n/8) = \\cos(2\\pi n + 2\\pi n/8)$. For a whole number $n$, $2\\pi n$ is whole turns, so this equals $\\cos(2\\pi n/8)$, the 1 Hz cosine. For $n = 1$: $\\cos(9\\pi/4) = \\cos(2\\pi + \\pi/4) = \\cos(\\pi/4) \\approx 0.7071$, and $\\cos(2\\pi/8) = \\cos(\\pi/4) \\approx 0.7071$. The rule agrees: $9 > f_s/2 = 4$."
}
```

## 17. Links

- Previous: [L5: Two domains](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains)
- Next: [L7: The matching score](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score)
- Time step and sample rate: [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency)
- What a value means: [L1: What a signal is](/notes/maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is)
- Clipping and full scale: [L3: Amplitude](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude)
- Aliasing in full: [L26: Aliasing](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing)
- Short pieces of 400 samples: [L34: The STFT and the spectrogram](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram)
- [02 Signals and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
