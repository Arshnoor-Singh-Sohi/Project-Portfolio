---
title: "L25: Leakage and windows"
order: 3
summary: "A tone that does not fit the window leaks into many bins. A Hann window reduces the leakage. Zero padding gives more points, not more resolution."
status: not-started
tags: [spectrum, leakage, window, hann, zero-padding, resolution]
---

## 1. The question this idea answers

Lessons [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) and [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror) used the spectrum signal. Each of its components fits the window: 3, 7 and 12 whole cycles in 0.5 s. So every other bin was zero. Real signals do not adapt to our window. They rarely make a whole number of cycles in it.

Take a 7 Hz sine with the same N = 64 and $f_s$ = 128 Hz. It makes 7 × 0.5 = 3.5 cycles in the window. Lesson L23 gives its bin number: $k$ = 7 × 64 / 128 = 3.5. No bin has the number 3.5.

This lesson answers four questions:

1. What does the FFT show for this tone?
2. Why does it show that?
3. How does a window function reduce the problem, and what does it cost?
4. Does zero padding help?

## 2. Mental model

> [!analogy] A loop with a click at the seam
> Music software can play a short clip again and again in a loop. If the clip ends at a different point of its wave than where it starts, you hear a click at each seam. The DFT always treats the window as one turn of such a loop. A click contains many frequencies, so the spectrum shows many frequencies. A window function fades the clip in and out, so the seam joins at zero, and the click becomes much smaller.
>
> **Where it stops working:** the fade also changes the clip in the middle. It makes each peak wider and lower. Also, the DFT does not hear anything. Leakage is exact arithmetic: the matching scores with the bin patterns no longer cancel.

## 3. Terms

| Term | Plain meaning |
|---|---|
| spectral leakage | Energy of one tone that spreads into many bins. It happens when the tone does not fit the window. |
| periodic extension | The signal that the DFT assumes: the window repeated again and again, every N samples. |
| kink | A point where the periodic extension changes its value or its direction suddenly. |
| window function ($w[n]$) | A list of N weights. You multiply the samples by it before the DFT. |
| rectangular window | The window function $w[n] = 1$ for every $n$. It is the same as no window function. |
| Hann window | The window function $w[n] = 0.5 - 0.5\cos(2\pi n / N)$. It is 0 at the start and 1 in the middle. |
| main lobe | The central hump of the spectrum of one tone. |
| side lobe | A smaller hump next to the main lobe. The side lobes carry the far leakage. |
| decibel (dB) | A log scale for ratios. For magnitudes, the level is $20\log_{10}(\text{ratio})$. |
| coherent gain | The average value of a window function, $\frac{1}{N}\sum w[n]$. It scales every peak. |
| scalloping loss | The drop of the peak magnitude when a tone falls between two bins. |
| zero padding | Zeros added to the end of the samples before the FFT. |
| frequency resolution | The smallest gap between two tones that the spectrum can show as two separate peaks. |

## 4. A tone that does not fit the window

Let $x[n] = \sin(2\pi \cdot 7n/128)$ for $n = 0, \dots, 63$. This is the leakage example of the course. The FFT gives these magnitudes (no window function):

| Bin $k$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 32 |
|---|---|---|---|---|---|---|---|---|---|---|
| $f_k$ (Hz) | 0 | 2 | 4 | 6 | 8 | 10 | 12 | 14 | 16 | 64 |
| $\lvert X[k] \rvert$ | 5.76 | 6.28 | 8.59 | 21.88 | 19.07 | 5.65 | 3.06 | 2.00 | 1.44 | 0.17 |
| dB below the peak | −11.6 | −10.8 | −8.1 | 0 | −1.2 | −11.8 | −17.1 | −20.8 | −23.7 | −42.0 |

A sine with amplitude 1 that fits the window gives 32 in one bin and 0 in every other bin. This sine gives a different picture:

1. The largest bin is 21.88 at bin 3 (6 Hz), not 32.
2. Bin 4 (8 Hz) is almost as large: 19.07. The tone sits between these two bins.
3. No bin is zero. One percent of the peak is 0.219. Bins 0 to 22 are above it: 23 of the 33 bins of the one-sided spectrum.

> [!key] Leakage
> A tone that does not fit the window spreads its energy into many bins. The DFT is still exact. The spreading is the correct DFT of these 64 samples.

## 5. Why: the DFT repeats the window

### 5.1 The periodic extension

The inverse DFT ([L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft)) builds $x[n]$ from the patterns $e^{i 2\pi k n / N}$. Each pattern returns to its start after N samples:

$$
e^{i 2\pi k (n + N) / N} = e^{i 2\pi k n / N} \cdot e^{i 2\pi k} = e^{i 2\pi k n / N}
$$

because $e^{i 2\pi k} = 1$ for a whole number $k$. A sum of such patterns also repeats every N samples. So the DFT describes the signal $x[n + N] = x[n]$: the window, repeated forever. This is the periodic extension.

### 5.2 Where the kink is

- **The 6 Hz sine makes 3 cycles.** The end of the window flows into the start of the next copy. The periodic extension is a smooth 6 Hz sine.
- **The 7 Hz sine makes 3.5 cycles.** At the end of the window, the true wave reaches $\sin(7\pi) = 0$ and moves down. The next copy starts at $x[0] = 0$ and moves up. The value is the same, but the direction is opposite. Lesson [L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency) said that one full cycle needs the same value and the same direction. Here only half of that is true.

The samples near the seam show the corner:

| $n$ | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 |
|---|---|---|---|---|---|---|---|---|
| True 7 Hz wave | 0.98 | 0.86 | 0.63 | 0.34 | 0 | −0.34 | −0.63 | −0.86 |
| Periodic extension | 0.98 | 0.86 | 0.63 | 0.34 | 0 | 0.34 | 0.63 | 0.86 |

The extension falls to 0 and then rises again. The true wave continues down. The course draws this corner in red and calls it a kink.

```plot
{
  "title": "Window (blue), DFT repeat (red), true 7 Hz wave (ink)",
  "xAxis": {"label": "sample number n", "domain": [-2, 130]},
  "yAxis": {"label": "value", "domain": [-1.5, 1.5]},
  "disableZoom": true,
  "data": [
    {"fn": "sin(0.34361*x)", "color": "#100D12"},
    {"points": [[0, 0], [1, 0.3369], [2, 0.6344], [3, 0.8577], [4, 0.9808], [5, 0.9892], [6, 0.8819], [7, 0.6716], [8, 0.3827], [9, 0.0491], [10, -0.2903], [11, -0.5957], [12, -0.8315], [13, -0.97], [14, -0.9952], [15, -0.904], [16, -0.7071], [17, -0.4276], [18, -0.098], [19, 0.243], [20, 0.5556], [21, 0.8032], [22, 0.9569], [23, 0.9988], [24, 0.9239], [25, 0.741], [26, 0.4714], [27, 0.1467], [28, -0.1951], [29, -0.5141], [30, -0.773], [31, -0.9415], [32, -1], [33, -0.9415], [34, -0.773], [35, -0.5141], [36, -0.1951], [37, 0.1467], [38, 0.4714], [39, 0.741], [40, 0.9239], [41, 0.9988], [42, 0.9569], [43, 0.8032], [44, 0.5556], [45, 0.243], [46, -0.098], [47, -0.4276], [48, -0.7071], [49, -0.904], [50, -0.9952], [51, -0.97], [52, -0.8315], [53, -0.5957], [54, -0.2903], [55, 0.0491], [56, 0.3827], [57, 0.6716], [58, 0.8819], [59, 0.9892], [60, 0.9808], [61, 0.8577], [62, 0.6344], [63, 0.3369]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0, 0], [1, 0.3369], [2, 0.6344], [3, 0.8577], [4, 0.9808], [5, 0.9892], [6, 0.8819], [7, 0.6716], [8, 0.3827], [9, 0.0491], [10, -0.2903], [11, -0.5957], [12, -0.8315], [13, -0.97], [14, -0.9952], [15, -0.904], [16, -0.7071], [17, -0.4276], [18, -0.098], [19, 0.243], [20, 0.5556], [21, 0.8032], [22, 0.9569], [23, 0.9988], [24, 0.9239], [25, 0.741], [26, 0.4714], [27, 0.1467], [28, -0.1951], [29, -0.5141], [30, -0.773], [31, -0.9415], [32, -1], [33, -0.9415], [34, -0.773], [35, -0.5141], [36, -0.1951], [37, 0.1467], [38, 0.4714], [39, 0.741], [40, 0.9239], [41, 0.9988], [42, 0.9569], [43, 0.8032], [44, 0.5556], [45, 0.243], [46, -0.098], [47, -0.4276], [48, -0.7071], [49, -0.904], [50, -0.9952], [51, -0.97], [52, -0.8315], [53, -0.5957], [54, -0.2903], [55, 0.0491], [56, 0.3827], [57, 0.6716], [58, 0.8819], [59, 0.9892], [60, 0.9808], [61, 0.8577], [62, 0.6344], [63, 0.3369]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true},
    {"points": [[63, 0.3369], [64, 0], [65, 0.3369], [66, 0.6344], [67, 0.8577], [68, 0.9808], [69, 0.9892], [70, 0.8819], [71, 0.6716], [72, 0.3827], [73, 0.0491], [74, -0.2903], [75, -0.5957], [76, -0.8315], [77, -0.97], [78, -0.9952], [79, -0.904], [80, -0.7071], [81, -0.4276], [82, -0.098], [83, 0.243], [84, 0.5556], [85, 0.8032], [86, 0.9569], [87, 0.9988], [88, 0.9239], [89, 0.741], [90, 0.4714], [91, 0.1467], [92, -0.1951], [93, -0.5141], [94, -0.773], [95, -0.9415], [96, -1], [97, -0.9415], [98, -0.773], [99, -0.5141], [100, -0.1951], [101, 0.1467], [102, 0.4714], [103, 0.741], [104, 0.9239], [105, 0.9988], [106, 0.9569], [107, 0.8032], [108, 0.5556], [109, 0.243], [110, -0.098], [111, -0.4276], [112, -0.7071], [113, -0.904], [114, -0.9952], [115, -0.97], [116, -0.8315], [117, -0.5957], [118, -0.2903], [119, 0.0491], [120, 0.3827], [121, 0.6716], [122, 0.8819], [123, 0.9892], [124, 0.9808], [125, 0.8577], [126, 0.6344], [127, 0.3369]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[64, 0], [65, 0.3369], [66, 0.6344], [67, 0.8577], [68, 0.9808], [69, 0.9892], [70, 0.8819], [71, 0.6716], [72, 0.3827], [73, 0.0491], [74, -0.2903], [75, -0.5957], [76, -0.8315], [77, -0.97], [78, -0.9952], [79, -0.904], [80, -0.7071], [81, -0.4276], [82, -0.098], [83, 0.243], [84, 0.5556], [85, 0.8032], [86, 0.9569], [87, 0.9988], [88, 0.9239], [89, 0.741], [90, 0.4714], [91, 0.1467], [92, -0.1951], [93, -0.5141], [94, -0.773], [95, -0.9415], [96, -1], [97, -0.9415], [98, -0.773], [99, -0.5141], [100, -0.1951], [101, 0.1467], [102, 0.4714], [103, 0.741], [104, 0.9239], [105, 0.9988], [106, 0.9569], [107, 0.8032], [108, 0.5556], [109, 0.243], [110, -0.098], [111, -0.4276], [112, -0.7071], [113, -0.904], [114, -0.9952], [115, -0.97], [116, -0.8315], [117, -0.5957], [118, -0.2903], [119, 0.0491], [120, 0.3827], [121, 0.6716], [122, 0.8819], [123, 0.9892], [124, 0.9808], [125, 0.8577], [126, 0.6344], [127, 0.3369]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true}
  ]
}
```

```plot
{
  "title": "The seam at n = 64: repeat (red) against true wave (ink)",
  "xAxis": {"label": "sample number n", "domain": [56, 72]},
  "yAxis": {"label": "value", "domain": [-1.2, 1.2]},
  "disableZoom": true,
  "data": [
    {"fn": "sin(0.34361*x)", "color": "#100D12"},
    {"points": [[56, 0.3827], [57, 0.6716], [58, 0.8819], [59, 0.9892], [60, 0.9808], [61, 0.8577], [62, 0.6344], [63, 0.3369]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[56, 0.3827], [57, 0.6716], [58, 0.8819], [59, 0.9892], [60, 0.9808], [61, 0.8577], [62, 0.6344], [63, 0.3369]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true},
    {"points": [[63, 0.3369], [64, 0], [65, 0.3369], [66, 0.6344], [67, 0.8577], [68, 0.9808], [69, 0.9892], [70, 0.8819], [71, 0.6716], [72, 0.3827]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[64, 0], [65, 0.3369], [66, 0.6344], [67, 0.8577], [68, 0.9808], [69, 0.9892], [70, 0.8819], [71, 0.6716], [72, 0.3827]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true}
  ]
}
```

### 5.3 Why a kink spreads energy

A sine of one frequency is smooth everywhere. A corner is not smooth. Only a sum of many sines can build a corner, and the sharper the corner, the more high frequencies it needs. Lesson [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) shows this with Fourier series. So the DFT must use many bins to describe this periodic extension.

The matching score gives the same answer. Lesson [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality) showed that two patterns with whole numbers of cycles are orthogonal: their products cancel. A 3.5-cycle sine is not a whole-cycle pattern. So its products with the probe of bin 10 do not cancel, and $\lvert X[10] \rvert$ = 0.87, not 0.

> [!key] The spectrum depends on the window, not only on the signal
> The DFT describes the window repeated forever. Clean peaks need components that fit the window exactly. That is the special case. Real signals usually leak.

## 6. The Hann window

### 6.1 The idea

Multiply the samples by a window function $w[n]$ that goes smoothly to 0 at both edges. Then the windowed signal $x[n] \cdot w[n]$ starts near 0 and ends near 0, and it is flat at both edges. So the copies of the periodic extension join with no corner.

### 6.2 The formula: periodic and symmetric

The **periodic** Hann window is:

$$
w[n] = 0.5 - 0.5\cos\left(\frac{2\pi n}{N}\right), \qquad n = 0, 1, \dots, N-1
$$

For N = 64:

1. $w[0] = 0.5 - 0.5\cos 0 = 0.5 - 0.5 = 0$.
2. $w[16] = 0.5 - 0.5\cos(\pi/2) = 0.5 - 0 = 0.5$.
3. $w[32] = 0.5 - 0.5\cos\pi = 0.5 + 0.5 = 1$.
4. $w[48] = 0.5$, and $w[63] = 0.5 - 0.5\cos(2\pi \cdot 63/64) = 0.0024$.

The next sample, $w[64]$, would be 0 again. So the periodic Hann window is exactly one cycle of a raised cosine, and its own repeat is smooth.

The **symmetric** Hann window divides by $N - 1$ instead of N:

$$
w[n] = 0.5 - 0.5\cos\left(\frac{2\pi n}{N-1}\right), \qquad n = 0, 1, \dots, N-1
$$

It is 0 at both $n = 0$ and $n = N-1$. For N = 64, its largest value is 0.99938, at $n$ = 31 and $n$ = 32.

| Call | Form |
|---|---|
| `np.hanning(M)` | symmetric. The NumPy documentation gives the formula with $M - 1$. |
| `scipy.signal.get_window("hann", N)` | periodic. The default is `fftbins=True`. |
| `scipy.signal.windows.hann(M)` | symmetric. The default is `sym=True`. Use `sym=False` for the periodic form. |
| `torch.hann_window(N)` | periodic. The default is `periodic=True`. |

> [!note] Sources and the choice of form
> The SciPy documentation (version 1.18) describes `sym=True` with the words "generates a symmetric window, for use in filter design". It describes `sym=False` with the words "generates a periodic window for use in spectral analysis". The NumPy documentation of `numpy.hanning` gives the symmetric formula. The PyTorch documentation (checked for version 2.3) gives `periodic=True` as the default. The Whisper source code (`whisper/audio.py`) calls `torch.hann_window(N_FFT)` with `N_FFT = 400`.

> [!trap] The FFT explorer lab uses the symmetric form
> The template calls `np.hanning(N)`. For N = 64 the difference from the periodic form is small, but it is not zero. For example, the coherent gain is 0.4922 instead of 0.5.

### 6.3 The result

Multiply the 3.5-cycle sine by the periodic Hann window, then run the FFT:

| Bin $k$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 32 |
|---|---|---|---|---|---|---|---|---|---|---|
| $\lvert X_w[k] \rvert$ | 0.26 | 0.45 | 2.75 | 13.56 | 13.59 | 2.71 | 0.38 | 0.12 | 0.06 | 0.0002 |
| dB below the peak | −34.4 | −29.7 | −13.9 | 0.0 | 0 | −14.0 | −31.0 | −40.7 | −47.8 | −96.0 |

1. One percent of the new peak is 0.136. Only bins 0 to 6 are above it: 7 bins instead of 23.
2. At 20 Hz (bin 10), the level is −28.0 dB with no window function and −58.1 dB with the Hann window.
3. At 64 Hz (bin 32), the level is −42.0 dB with no window function and −96.0 dB with the Hann window.

```plot
{
  "title": "3.5-cycle sine in dB: rectangular (red), Hann (ink)",
  "xAxis": {"label": "frequency (Hz)", "domain": [-2, 66]},
  "yAxis": {"label": "level (dB)", "domain": [-100, 5]},
  "disableZoom": true,
  "data": [
    {"points": [[0, -11.5883], [2, -10.8416], [4, -8.1265], [6, 0], [8, -1.1937], [10, -11.7599], [12, -17.0854], [14, -20.7854], [16, -23.6522], [18, -25.9987], [20, -27.9828], [22, -29.6964], [24, -31.1978], [26, -32.5268], [28, -33.7117], [30, -34.7737], [32, -35.7285], [34, -36.5887], [36, -37.3641], [38, -38.0627], [40, -38.6909], [42, -39.2542], [44, -39.7568], [46, -40.2025], [48, -40.5943], [50, -40.9347], [52, -41.2259], [54, -41.4696], [56, -41.6672], [58, -41.8198], [60, -41.9282], [62, -41.9931], [64, -42.0146]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[0, -11.5883], [2, -10.8416], [4, -8.1265], [6, 0], [8, -1.1937], [10, -11.7599], [12, -17.0854], [14, -20.7854], [16, -23.6522], [18, -25.9987], [20, -27.9828], [22, -29.6964], [24, -31.1978], [26, -32.5268], [28, -33.7117], [30, -34.7737], [32, -35.7285], [34, -36.5887], [36, -37.3641], [38, -38.0627], [40, -38.6909], [42, -39.2542], [44, -39.7568], [46, -40.2025], [48, -40.5943], [50, -40.9347], [52, -41.2259], [54, -41.4696], [56, -41.6672], [58, -41.8198], [60, -41.9282], [62, -41.9931], [64, -42.0146]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true},
    {"points": [[0, -34.4115], [2, -29.6641], [4, -13.8866], [6, -0.02], [8, 0], [10, -14.0141], [12, -31.0244], [14, -40.7339], [16, -47.7909], [18, -53.4036], [20, -58.0931], [22, -62.1356], [24, -65.6963], [26, -68.8821], [28, -71.7658], [30, -74.3996], [32, -76.8212], [34, -79.0589], [36, -81.1339], [38, -83.0617], [40, -84.8537], [42, -86.5173], [44, -88.0571], [46, -89.4745], [48, -90.7685], [50, -91.9358], [52, -92.971], [54, -93.8672], [56, -94.6163], [58, -95.21], [60, -95.6406], [62, -95.9018], [64, -95.9894]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0, -34.4115], [2, -29.6641], [4, -13.8866], [6, -0.02], [8, 0], [10, -14.0141], [12, -31.0244], [14, -40.7339], [16, -47.7909], [18, -53.4036], [20, -58.0931], [22, -62.1356], [24, -65.6963], [26, -68.8821], [28, -71.7658], [30, -74.3996], [32, -76.8212], [34, -79.0589], [36, -81.1339], [38, -83.0617], [40, -84.8537], [42, -86.5173], [44, -88.0571], [46, -89.4745], [48, -90.7685], [50, -91.9358], [52, -92.971], [54, -93.8672], [56, -94.6163], [58, -95.21], [60, -95.6406], [62, -95.9018], [64, -95.9894]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

```plot
{
  "title": "Hann window (ink) and windowed sine x[n]·w[n] (blue)",
  "xAxis": {"label": "sample number n", "domain": [-1, 65]},
  "yAxis": {"label": "value", "domain": [-1.2, 1.2]},
  "disableZoom": true,
  "data": [
    {"fn": "0.5-0.5*cos(0.098175*x)", "color": "#100D12"},
    {"points": [[0, 0], [1, 0.0008], [2, 0.0061], [3, 0.0185], [4, 0.0373], [5, 0.0584], [6, 0.0743], [7, 0.0762], [8, 0.056], [9, 0.009], [10, -0.0645], [11, -0.1574], [12, -0.2566], [13, -0.3442], [14, -0.4005], [15, -0.4077], [16, -0.3536], [17, -0.2347], [18, -0.0586], [19, 0.1568], [20, 0.3841], [21, 0.5909], [22, 0.7443], [23, 0.8162], [24, 0.7886], [25, 0.6569], [26, 0.4317], [27, 0.1381], [28, -0.1877], [29, -0.503], [30, -0.7656], [31, -0.9393], [32, -1], [33, -0.9393], [34, -0.7656], [35, -0.503], [36, -0.1877], [37, 0.1381], [38, 0.4317], [39, 0.6569], [40, 0.7886], [41, 0.8162], [42, 0.7443], [43, 0.5909], [44, 0.3841], [45, 0.1568], [46, -0.0586], [47, -0.2347], [48, -0.3536], [49, -0.4077], [50, -0.4005], [51, -0.3442], [52, -0.2566], [53, -0.1574], [54, -0.0645], [55, 0.009], [56, 0.056], [57, 0.0762], [58, 0.0743], [59, 0.0584], [60, 0.0373], [61, 0.0185], [62, 0.0061], [63, 0.0008]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0, 0], [1, 0.0008], [2, 0.0061], [3, 0.0185], [4, 0.0373], [5, 0.0584], [6, 0.0743], [7, 0.0762], [8, 0.056], [9, 0.009], [10, -0.0645], [11, -0.1574], [12, -0.2566], [13, -0.3442], [14, -0.4005], [15, -0.4077], [16, -0.3536], [17, -0.2347], [18, -0.0586], [19, 0.1568], [20, 0.3841], [21, 0.5909], [22, 0.7443], [23, 0.8162], [24, 0.7886], [25, 0.6569], [26, 0.4317], [27, 0.1381], [28, -0.1877], [29, -0.503], [30, -0.7656], [31, -0.9393], [32, -1], [33, -0.9393], [34, -0.7656], [35, -0.503], [36, -0.1877], [37, 0.1381], [38, 0.4317], [39, 0.6569], [40, 0.7886], [41, 0.8162], [42, 0.7443], [43, 0.5909], [44, 0.3841], [45, 0.1568], [46, -0.0586], [47, -0.2347], [48, -0.3536], [49, -0.4077], [50, -0.4005], [51, -0.3442], [52, -0.2566], [53, -0.1574], [54, -0.0645], [55, 0.009], [56, 0.056], [57, 0.0762], [58, 0.0743], [59, 0.0584], [60, 0.0373], [61, 0.0185], [62, 0.0061], [63, 0.0008]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true}
  ]
}
```

## 7. Main lobe and side lobes

The spectrum of one tone has a main lobe and side lobes. Their shape belongs to the window function, not to the tone. These values come from a computation with N = 64 and a 1024 times longer FFT (zero padding, section 9), so the curve is smooth:

| Window function | First zero of the main lobe | Main lobe width, zero to zero | First side lobe | Level 10.5 bins from the peak |
|---|---|---|---|---|
| Rectangular | ±1 bin | 2 bins | about −13.3 dB | −30.0 dB |
| Hann (periodic) | ±2 bins | 4 bins | about −31.5 dB | −71.2 dB |

Read the decibel values like this:

1. −20 dB is 1/10 of the peak magnitude. −40 dB is 1/100, which is 1%.
2. −13.3 dB is $10^{-13.3/20}$ = 0.22, so about 22% of the peak.
3. −31.5 dB is $10^{-31.5/20}$ = 0.027, so about 2.7% of the peak.

> [!key] A window function is a trade
> The Hann window makes the side lobes much lower, so far leakage drops. But it makes the main lobe two times wider. Two tones close together become harder to separate. No window function wins on both.

## 8. Correct the amplitude: coherent gain

### 8.1 Why the peak drops

Every weight of the Hann window is 1 or less. So the windowed samples are smaller, and every peak drops. Euler's formula shows the exact effect. Write the periodic Hann window as three arrows:

$$
w[n] = 0.5 - 0.25\,e^{i 2\pi n / N} - 0.25\,e^{-i 2\pi n / N}
$$

Multiply a tone that fits bin $k_0$ by $w[n]$. Each arrow of $w[n]$ moves the tone by 0 or by 1 bin. So the tone appears in three bins:

1. Bin $k_0$, with the weight 0.5.
2. Bin $k_0 + 1$, with the weight −0.25.
3. Bin $k_0 - 1$, with the weight −0.25.

> [!example] The spectrum signal with a Hann window
> Without a window, the peaks are 32, 19.2 and 12.8. With the periodic Hann window, the FFT gives:
>
> | Bins | Magnitudes |
> |---|---|
> | 2, 3, 4 | 8, 16, 8 |
> | 6, 7, 8 | 4.8, 9.6, 4.8 |
> | 11, 12, 13 | 3.2, 6.4, 3.2 |
>
> For bin 3: 0.5 × 32 = 16 and 0.25 × 32 = 8. Even a tone that fits the window now covers three bins.

### 8.2 The coherent gain

The coherent gain is the average weight:

$$
G = \frac{1}{N}\sum_{n=0}^{N-1} w[n]
$$

For the periodic Hann window:

1. $\sum w[n] = 0.5 N - 0.5\sum_{n=0}^{N-1}\cos(2\pi n / N)$.
2. The cosine terms make one full cycle, so they add to 0 (lesson L23, section 5.2).
3. So $\sum w[n] = 0.5 N$, and $G = 0.5$ exactly.

For the symmetric `np.hanning(64)`, the sum is 31.5, so $G$ = 31.5 / 64 = 0.4922.

Correct the amplitude with the sum of the weights:

$$
A = \frac{2\lvert X_w[k] \rvert}{\sum w[n]}
$$

For the periodic Hann window, $\sum w[n] = N/2$, so $A = 4\lvert X_w[k] \rvert / N$. For the rectangular window, $\sum w[n] = N$, and the formula is the rule of L23.

> [!example] Correct the spectrum signal
> $\sum w[n]$ = 32 for N = 64.
>
> - Bin 3: 2 × 16 / 32 = 1.0.
> - Bin 7: 2 × 9.6 / 32 = 0.6.
> - Bin 12: 2 × 6.4 / 32 = 0.4.

### 8.3 Scalloping loss

The 3.5-cycle sine has $A$ = 1. The largest bin does not give 1:

1. No window function: 2 × 21.88 / 64 = 0.68.
2. Periodic Hann: 2 × 13.59 / 32 = 0.85.

The tone sits half a bin from its two nearest bins, so no bin catches its full peak. This drop is the scalloping loss. For a tone exactly half a bin away, the theory gives −3.92 dB (a factor 0.64) for the rectangular window. For the Hann window, it gives −1.42 dB (a factor 0.85). The value 0.68 differs a little from 0.64. The leakage of the mirror arrow at −7 Hz adds to the same bins.

## 9. Zero padding: more points, not more resolution

### 9.1 What zero padding does

Zero padding adds zeros to the end of the samples before the FFT. NumPy does it with the argument `n`:

```python
X = np.fft.rfft(x, n=1024)   # x has 64 samples. NumPy adds 960 zeros.
```

The NumPy documentation says that a larger `n` pads the input with zeros. Now the bins are $f_s / 1024$ = 0.125 Hz apart instead of 2 Hz. But the samples still cover only 0.5 s. The zeros carry no information about the signal. So the padded FFT shows more points of the same smooth curve. Lesson [L30](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l30-the-four-members) names this curve: the DTFT of the windowed samples.

### 9.2 Two tones 1 Hz apart in a 0.5 s window

Let $y[n] = \sin(2\pi \cdot 10 n/128) + \sin(2\pi \cdot 11 n/128)$, with $f_s$ = 128 Hz. The values below use the amplitude scale $2\lvert X \rvert / N$, with N the number of real samples.

1. **0.5 s window, N = 64, no padding.** The bins at 8, 10, 12 and 14 Hz give 0.24, 1.20, 0.61 and 0.19. There is one peak at 10 Hz.
2. **The same 64 samples, padded to 1024.** The curve rises to one hump. Its top is at 10.5 Hz, with the value 1.27. At 10 Hz the value is 1.20, and at 11 Hz it is 1.17. There is no dip between the tones. The two tones appear as one peak.
3. **2 s window, N = 256, no padding.** The bins are 0.5 Hz apart. The bins at 10 Hz and 11 Hz both give 1.00. The bin at 10.5 Hz gives 0. There are two clear peaks.

```plot
{
  "title": "0.5 s window: 64-point DFT (blue), padded to 1024 (ink)",
  "xAxis": {"label": "frequency (Hz)", "domain": [4, 17]},
  "yAxis": {"label": "2·|X|/N", "domain": [-0.05, 1.4]},
  "disableZoom": true,
  "data": [
    {"points": [[4, 0.1306], [4.125, 0.1326], [4.25, 0.1363], [4.375, 0.1412], [4.5, 0.147], [4.625, 0.153], [4.75, 0.1588], [4.875, 0.1636], [5, 0.1672], [5.125, 0.1692], [5.25, 0.1696], [5.375, 0.1685], [5.5, 0.1663], [5.625, 0.1637], [5.75, 0.1614], [5.875, 0.1605], [6, 0.1619], [6.125, 0.1664], [6.25, 0.1742], [6.375, 0.1849], [6.5, 0.1976], [6.625, 0.2113], [6.75, 0.2249], [6.875, 0.2371], [7, 0.2471], [7.125, 0.254], [7.25, 0.2574], [7.375, 0.2572], [7.5, 0.2537], [7.625, 0.248], [7.75, 0.2421], [7.875, 0.2391], [8, 0.2429], [8.125, 0.2575], [8.25, 0.2854], [8.375, 0.3268], [8.5, 0.3802], [8.625, 0.4432], [8.75, 0.5136], [8.875, 0.5891], [9, 0.6675], [9.125, 0.7472], [9.25, 0.8261], [9.375, 0.9028], [9.5, 0.9756], [9.625, 1.043], [9.75, 1.1037], [9.875, 1.1565], [10, 1.2004], [10.125, 1.2345], [10.25, 1.2582], [10.375, 1.271], [10.5, 1.2727], [10.625, 1.2632], [10.75, 1.2427], [10.875, 1.2117], [11, 1.1708], [11.125, 1.1207], [11.25, 1.0624], [11.375, 0.9971], [11.5, 0.926], [11.625, 0.8504], [11.75, 0.7719], [11.875, 0.6918], [12, 0.6118], [12.125, 0.5335], [12.25, 0.4586], [12.375, 0.3887], [12.5, 0.326], [12.625, 0.2726], [12.75, 0.2306], [12.875, 0.2021], [13, 0.1871], [13.125, 0.1835], [13.25, 0.1867], [13.375, 0.1926], [13.5, 0.198], [13.625, 0.201], [13.75, 0.2007], [13.875, 0.1968], [14, 0.1896], [14.125, 0.1796], [14.25, 0.1675], [14.375, 0.1541], [14.5, 0.1405], [14.625, 0.1278], [14.75, 0.1171], [14.875, 0.1092], [15, 0.1045], [15.125, 0.1029], [15.25, 0.1036], [15.375, 0.1055], [15.5, 0.1077], [15.625, 0.1094], [15.75, 0.1099], [15.875, 0.109], [16, 0.1067], [16.125, 0.1029], [16.25, 0.0981], [16.375, 0.0925], [16.5, 0.0866], [16.625, 0.0809], [16.75, 0.076], [16.875, 0.0723], [17, 0.07]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[4, 0.1306], [6, 0.1619], [8, 0.2429], [10, 1.2004], [12, 0.6118], [14, 0.1896], [16, 0.1067]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[4, 0.1306], [6, 0.1619], [8, 0.2429], [10, 1.2004], [12, 0.6118], [14, 0.1896], [16, 0.1067]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true}
  ]
}
```

```plot
{
  "title": "2 s window: 256-point DFT (blue), padded to 4096 (ink)",
  "xAxis": {"label": "frequency (Hz)", "domain": [8, 13]},
  "yAxis": {"label": "2·|X|/N", "domain": [-0.05, 1.4]},
  "disableZoom": true,
  "data": [
    {"points": [[8, 0], [8.0312, 0.0293], [8.0625, 0.0582], [8.0938, 0.0856], [8.125, 0.1103], [8.1562, 0.1314], [8.1875, 0.1479], [8.2188, 0.1591], [8.25, 0.1644], [8.2812, 0.1635], [8.3125, 0.1562], [8.3438, 0.1426], [8.375, 0.1231], [8.4062, 0.0982], [8.4375, 0.0687], [8.4688, 0.0356], [8.5, 0], [8.5312, 0.0367], [8.5625, 0.0732], [8.5938, 0.1081], [8.625, 0.14], [8.6562, 0.1676], [8.6875, 0.1897], [8.7188, 0.2052], [8.75, 0.2132], [8.7812, 0.2133], [8.8125, 0.205], [8.8438, 0.1884], [8.875, 0.1637], [8.9062, 0.1314], [8.9375, 0.0926], [8.9688, 0.0483], [9, 0], [9.0312, 0.0507], [9.0625, 0.1021], [9.0938, 0.1522], [9.125, 0.1992], [9.1562, 0.241], [9.1875, 0.2758], [9.2188, 0.3019], [9.25, 0.3179], [9.2812, 0.3225], [9.3125, 0.3146], [9.3438, 0.2938], [9.375, 0.2597], [9.4062, 0.2125], [9.4375, 0.1528], [9.4688, 0.0816], [9.5, 0], [9.5312, 0.0902], [9.5625, 0.1871], [9.5938, 0.2886], [9.625, 0.3922], [9.6562, 0.4955], [9.6875, 0.5959], [9.7188, 0.691], [9.75, 0.7783], [9.7812, 0.8557], [9.8125, 0.9213], [9.8438, 0.9733], [9.875, 1.0104], [9.9062, 1.0319], [9.9375, 1.0373], [9.9688, 1.0265], [10, 1], [10.0312, 0.9588], [10.0625, 0.9041], [10.0938, 0.8378], [10.125, 0.7617], [10.1562, 0.6784], [10.1875, 0.5903], [10.2188, 0.5], [10.25, 0.4104], [10.2812, 0.3241], [10.3125, 0.2438], [10.3438, 0.1717], [10.375, 0.1102], [10.4062, 0.061], [10.4375, 0.0256], [10.4688, 0.0051], [10.5, 0], [10.5312, 0.0105], [10.5625, 0.0362], [10.5938, 0.0764], [10.625, 0.1297], [10.6562, 0.1947], [10.6875, 0.2693], [10.7188, 0.3512], [10.75, 0.438], [10.7812, 0.5271], [10.8125, 0.6158], [10.8438, 0.7014], [10.875, 0.7813], [10.9062, 0.8531], [10.9375, 0.9147], [10.9688, 0.9642], [11, 1], [11.0312, 1.0211], [11.0625, 1.0267], [11.0938, 1.0166], [11.125, 0.9909], [11.1562, 0.9503], [11.1875, 0.8957], [11.2188, 0.8286], [11.25, 0.7507], [11.2812, 0.6638], [11.3125, 0.5703], [11.3438, 0.4725], [11.375, 0.3726], [11.4062, 0.2732], [11.4375, 0.1766], [11.4688, 0.0848], [11.5, 0], [11.5312, 0.0762], [11.5625, 0.1423], [11.5938, 0.1972], [11.625, 0.2401], [11.6562, 0.2707], [11.6875, 0.289], [11.7188, 0.2953], [11.75, 0.2902], [11.7812, 0.2748], [11.8125, 0.2502], [11.8438, 0.2179], [11.875, 0.1795], [11.9062, 0.1368], [11.9375, 0.0915], [11.9688, 0.0453], [12, 0], [12.0312, 0.0429], [12.0625, 0.082], [12.0938, 0.116], [12.125, 0.144], [12.1562, 0.1653], [12.1875, 0.1793], [12.2188, 0.186], [12.25, 0.1854], [12.2812, 0.1779], [12.3125, 0.164], [12.3438, 0.1445], [12.375, 0.1204], [12.4062, 0.0927], [12.4375, 0.0626], [12.4688, 0.0313], [12.5, 0], [12.5312, 0.0301], [12.5625, 0.058], [12.5938, 0.0827], [12.625, 0.1034], [12.6562, 0.1194], [12.6875, 0.1304], [12.7188, 0.1361], [12.75, 0.1365], [12.7812, 0.1317], [12.8125, 0.1221], [12.8438, 0.1081], [12.875, 0.0905], [12.9062, 0.07], [12.9375, 0.0475], [12.9688, 0.0239], [13, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[8, 0], [8.5, 0], [9, 0], [9.5, 0], [10, 1], [10.5, 0], [11, 1], [11.5, 0], [12, 0], [12.5, 0], [13, 0]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[8, 0], [8.5, 0], [9, 0], [9.5, 0], [10, 1], [10.5, 0], [11, 1], [11.5, 0], [12, 0], [12.5, 0], [13, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true}
  ]
}
```

Why does padding fail? The width of the main lobe depends on the window length $T = N / f_s$, not on the FFT length. For the rectangular window, the main lobe is 2 bins wide, zero to zero. That is $2 / T$ = 4 Hz for $T$ = 0.5 s. Two tones 1 Hz apart sit inside one main lobe, and padding only draws that lobe in more detail. A 2 s window makes the main lobe 1 Hz wide, zero to zero, so the tones separate.

> [!key] Resolution comes from the window length
> To separate two close tones, record a longer window. Zero padding gives more points on the same curve. It does not give more resolution.

### 9.3 What zero padding is good for

1. A smoother picture of the spectrum.
2. A better estimate of the location of one isolated peak.
3. An FFT length that is a power of 2, for the radix-2 FFT of part 04.
4. Linear convolution with the FFT (lesson [L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem)).

## 10. Video and pictures

Watch the 3.5-cycle sinusoid. It sits between bins 3 and 4, and its energy leaks.

```video
{
  "src": "/notes/media/fft-signal-processing/course/11_Reading_the_Frequency_Spectrum.mp4",
  "start": "1:04",
  "end": "1:12",
  "caption": "3.5 cycles in the window: no single bin fits, and the energy leaks."
}
```

Watch the periodic extension and its red kink. The last caption states the main idea of this lesson.

```video
{
  "src": "/notes/media/fft-signal-processing/course/11_Reading_the_Frequency_Spectrum.mp4",
  "start": "1:12",
  "end": "1:30",
  "caption": "The DFT repeats the window. The kink spreads energy. A few clean peaks is the special case."
}
```

## 11. Code

Build these functions in a lab:

1. `hann(N, periodic=True)` returns the Hann window from the formula. Do not call `np.hanning` or SciPy inside it.
2. `leak_count(x, w)` returns the number of `rfft` bins of `x * w` whose magnitude is larger than 1% of the largest magnitude.
3. `windowed_amplitude(x, w, k)` returns the corrected amplitude of bin `k`: $2\lvert X_w[k] \rvert / \sum w[n]$.

Acceptance tests:

1. `np.allclose(hann(64, periodic=False), np.hanning(64))` is True.
2. `np.allclose(hann(64), scipy.signal.get_window("hann", 64))` is True, and `np.isclose(hann(64).sum(), 32)` is True.
3. For the 3.5-cycle sine, `leak_count(x, np.ones(64)) == 23` and `leak_count(x, hann(64)) == 7`.
4. For the spectrum signal, `leak_count(x, np.ones(64)) == 3`.
5. For the spectrum signal with `hann(64)`, the corrected amplitudes of bins 3, 7 and 12 are close to 1.0, 0.6 and 0.4.
6. Zero padding: make the two tones at 10 Hz and 11 Hz with N = 64, and compute `np.fft.rfft(y, n=1024)`. Its value at 10.5 Hz is larger than its values at 10 Hz and at 11 Hz (no dip). With N = 256, the value at 10.5 Hz is smaller than both (a dip).

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)

Then use the [FFT explorer lab](/labs/new?template=fft-explorer):

1. Set frequency 1 to 5.5 Hz, with $f_s$ = 64 Hz and N = 64. The peak spreads into the bins near it.
2. Set the window control to `hann`. The far bins drop, and the peak gets wider.
3. Read the height of the Hann peak. The template does not correct the coherent gain, so the peak is about half as high.

```check
{
  "question": "Stuck on `hann` or on `windowed_amplitude`? Use the hints in order.",
  "hint": "Hint 1: `hann` needs `np.arange(N)` and one cosine. The only difference between the two forms is the number under $2\\pi n$.",
  "answer": "Hint 2 (idea): the periodic form divides by N, and the symmetric form divides by N − 1. For `windowed_amplitude`, compute the FFT of `x * w` and take the magnitude of bin `k`. Multiply it by 2, and divide by the sum of the weights, not by N."
}
```

## 12. Common mistakes

1. **Clean peaks expected for every signal.** Clean peaks need components that fit the window exactly. Real signals usually leak.
2. **Leakage read as noise or as an FFT bug.** Leakage is the exact DFT of the window. The FFT and the direct DFT give the same leakage.
3. **No correction for the coherent gain.** With a Hann window, divide by $\sum w[n] = N/2$, not by N. Otherwise every amplitude is half the true value.
4. **Zero padding used to separate close tones.** Padding adds points on the same curve. Only a longer window narrows the main lobe.
5. **Periodic and symmetric Hann mixed.** `np.hanning` is symmetric. `scipy.signal.get_window("hann", N)` is periodic. Know which one your code uses.
6. **One bin read as the amplitude of a tone between bins.** The scalloping loss can be up to 3.92 dB with no window function. Use a window function and check the neighbors.
7. **A window function expected to remove leakage.** It reduces the far leakage and widens the main lobe. Some leakage stays.

## 13. One-minute explanation

The DFT treats the window as one period of a signal that repeats forever. If a tone makes a whole number of cycles in the window, the copies join smoothly, and the tone sits in one bin. If it makes 3.5 cycles, the copies join with a kink. A kink needs many frequencies, so the energy leaks into many bins: 23 of 33 bins for the course example. A Hann window fades the samples to zero at both edges, so the seam has no kink. The far leakage drops: the first side lobe falls from about −13 dB to about −31 dB. But the main lobe is two times wider, and the peak is half as high. Correct the amplitude with the sum of the weights. Zero padding draws more points of the same curve. Only a longer window gives finer resolution.

## 14. Check questions

```check
{
  "question": "What is spectral leakage, and when does it happen?",
  "hint": "Think of the periodic extension.",
  "answer": "Leakage is the energy of one tone that spreads into many bins. It happens when the tone does not make a whole number of cycles in the window. Then the periodic extension of the window has a kink, and a kink needs many frequencies."
}
```

```check
{
  "question": "$f_s$ = 128 Hz and N = 64. Where does a 9 Hz sine sit on the bin axis? Which two bins hold the largest magnitudes?",
  "hint": "$k = f \\cdot N / f_s$.",
  "answer": "$k$ = 9 × 64 / 128 = 4.5. The sine sits halfway between bin 4 (8 Hz) and bin 5 (10 Hz). These two bins hold the largest magnitudes: 21.50 and 19.37. It makes 9 × 0.5 = 4.5 cycles in the window, so it leaks."
}
```

```check
{
  "question": "You multiply the spectrum signal by the periodic Hann window (N = 64). Bin 7 shows $\\lvert X_w[7] \\rvert$ = 9.6. What is the amplitude? What do bins 6 and 8 show?",
  "hint": "$\\sum w[n] = N/2$ for the periodic Hann window.",
  "answer": "$\\sum w[n]$ = 32. $A$ = 2 × 9.6 / 32 = 0.6. Bins 6 and 8 each show 0.25 × 19.2 = 4.8, because the Hann window moves a quarter of the original peak into each neighbor."
}
```

```check
{
  "question": "Two tones at 10 Hz and 11 Hz sit in a 0.5 s window. You pad the 64 samples to 4096 points. Why do you still see one hump?",
  "hint": "Which number sets the width of the main lobe?",
  "answer": "The main lobe width depends on the window length, not on the FFT length. With 0.5 s and no window function, the main lobe is 2 / 0.5 = 4 Hz wide, zero to zero. Both tones sit inside it. Padding draws the same curve with more points. To separate the tones, record a longer window, for example 2 s."
}
```

```check
{
  "question": "A speech model takes frames of 25 ms at 16,000 Hz. How many samples does one frame hold? What is the bin spacing? If you pad each frame to 512 samples, what is the new bin spacing, and does the resolution change?",
  "hint": "N = duration × sample rate.",
  "answer": "N = 0.025 × 16000 = 400 samples. Bin spacing: 16000 / 400 = 40 Hz. Padded to 512: 16000 / 512 = 31.25 Hz. The resolution does not change. The frame still lasts 25 ms, so the main lobe keeps the same width."
}
```

```check
{
  "question": "Why does the Hann window reduce the far leakage?",
  "hint": "Examine the seam of the periodic extension.",
  "answer": "The Hann window goes smoothly to 0 at both edges, and it is flat there. So the windowed samples start and end near 0, and the copies of the periodic extension join with no kink. A smooth join needs few high frequencies, so the side lobes are much lower: about −31.5 dB instead of about −13.3 dB."
}
```

```check
{
  "question": "A side lobe is at −40 dB. What fraction of the peak magnitude is it?",
  "hint": "Level in dB = $20\\log_{10}(\\text{ratio})$.",
  "answer": "ratio = $10^{-40/20} = 10^{-2}$ = 0.01, so 1% of the peak magnitude."
}
```

## 15. Links

- Previous lesson: [L24: The mirror](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)
- Next lesson: [L26: Aliasing](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing)
- Part folder: [05 Reading spectra](/notes/maths/fft-signal-processing/05-reading-spectra)
- [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency): a full cycle needs the same value and the same direction
- [L9: Basis and orthogonality](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality): why whole-cycle patterns cancel
- [L13: The inverse DFT](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft): why the DFT repeats every N samples
- [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude): the amplitude rule that the coherent gain changes
- [L28: Fourier series](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series): a corner needs many sines
- [L33: Uncertainty](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty): window length against resolution
- [L34: The STFT and the spectrogram](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram): a window function on every frame
- [Glossary](/notes/maths/fft-signal-processing/glossary)
