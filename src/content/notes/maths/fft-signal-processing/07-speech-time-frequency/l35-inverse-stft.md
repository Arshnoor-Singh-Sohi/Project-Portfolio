---
title: "L35: The inverse STFT"
order: 2
summary: "Rebuild a signal from its STFT with overlap-add: the COLA condition, the periodic Hann window, the window-sum division, and why a changed STFT gives artifacts."
status: not-started
tags: [istft, overlap-add, cola, window, reconstruction]
---

## 1. The question this idea answers

Lesson [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram) changed a signal into a grid $X[k, m]$: one FFT for each frame. Many voice systems change this grid and then need sound again. A noise suppressor makes noisy bins smaller ([L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement)). A text-to-speech system makes a grid and must play it ([L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end)).

The inverse DFT of [L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft) returns one frame exactly. But the frames overlap. With $N$ = 400 and $H$ = 160, most samples sit in two or three frames, each time with a different window weight. How do we join the frames into one signal, with no error?

## 2. Mental model

> [!analogy] Tiles of a photo with faded edges
> You cut a photo into overlapping tiles. Each tile fades to white at its edges (the window). To rebuild the photo, place each tile at its old position and add the tiles. Where the tiles overlap, the brightness adds. If the fades always add to the same brightness, one division restores the photo. If not, divide each point by the sum of the fades at that point.
>
> **Where it stops working:** an unchanged set of tiles always fits together. If you edit each tile alone, two tiles can disagree in their shared area. Then no single photo matches all the edited tiles. The rebuild gives the best compromise, not your edits.

## 3. Terms

| Term | Plain meaning |
|---|---|
| inverse STFT (ISTFT) | The operation that rebuilds a signal from an STFT grid. |
| overlap-add (OLA) | Place each frame at its start sample again and add all frames. |
| window sum | The sum of all shifted copies of the window at sample $t$: $\sum_m w[t - mH]$. |
| COLA condition | Constant overlap-add: the window sum has the same value at every sample. |
| periodic Hann window | $w[n] = 0.5 - 0.5\cos(2\pi n/N)$. One full cosine cycle over $N + 1$ points, with the last point removed. |
| symmetric Hann window | $w[n] = 0.5 - 0.5\cos(2\pi n/(N-1))$. Both end points are 0. `np.hanning` gives this form. |
| weighted overlap-add (WOLA) | Overlap-add after a second multiplication of each frame by the window. |
| least-squares ISTFT | The ISTFT of PyTorch and librosa: weighted overlap-add, then a division by the sum of the squared windows. |
| NOLA condition | Nonzero overlap-add: the sum of the squared windows is never 0 inside the signal. |
| consistent STFT | A grid that is the STFT of some signal. A changed grid is usually not consistent. |

## 4. Step 1: undo the FFT of each frame

The STFT of frame $m$ is the DFT of the windowed frame (L34):

$$
X[k, m] = \sum_{n=0}^{N-1} w[n]\, x[mH + n]\, e^{-i 2\pi k n / N}
$$

The inverse DFT of column $m$ returns the windowed frame exactly ([L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft)):

$$
y_m[n] = \frac{1}{N} \sum_{k=0}^{N-1} X[k, m]\, e^{+i 2\pi k n / N} = w[n]\, x[mH + n], \qquad n = 0 \dots N-1
$$

The STFT keeps only the bins $0 \dots N/2$. The mirror rule ([L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)) gives the other bins: $X[N-k, m] = \overline{X[k,m]}$. `np.fft.irfft(column, n=N)` adds the mirror bins and runs the inverse DFT in one call. Give it `n=N`, because 201 bins can come from $N$ = 400 or from $N$ = 401.

> [!key] The FFT part is easy
> The inverse FFT returns each column exactly. The difficult part is the window: each frame returns multiplied by $w[n]$, and the frames overlap.

## 5. Step 2: overlap-add and the window sum

Place each frame at its start sample $mH$ again and add:

$$
s[t] = \sum_m y_m[t - mH]
$$

The sum uses only the frames that contain sample $t$, that is, $0 \le t - mH \le N - 1$. Substitute $y_m[n] = w[n]\, x[mH + n]$ with $n = t - mH$. Then $mH + n = t$, so every term holds the same sample $x[t]$:

$$
s[t] = \sum_m w[t - mH]\, x[t] = x[t] \cdot e[t], \qquad e[t] = \sum_m w[t - mH]
$$

The number $e[t]$ is the window sum at sample $t$. It depends only on the window and the hop, not on the signal.

> [!example] A small case: $N$ = 8, $H$ = 4, periodic Hann
> The periodic Hann window for $N$ = 8 is $w[n] = 0.5 - 0.5\cos(2\pi n/8)$. With $\cos(\pi/4) = 1/\sqrt{2} \approx 0.7071$, the values (rounded to four decimals) are:
>
> | $n$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
> |---|---|---|---|---|---|---|---|---|
> | $w[n]$ | 0 | 0.1464 | 0.5 | 0.8536 | 1 | 0.8536 | 0.5 | 0.1464 |
>
> Frame 0 covers $t$ = 0 to 7. Frame 1 covers $t$ = 4 to 11. So sample $t$ = 5 is in frame 0 at position $n$ = 5 and in frame 1 at position $n$ = 1.
>
> $e[5] = w[5] + w[1] = 0.8536 + 0.1464 = 1$.
>
> The same holds for $t$ = 4, 6 and 7: $1 + 0 = 1$, $0.5 + 0.5 = 1$, $0.1464 + 0.8536 = 1$. So $s[t] = x[t]$ in the overlap.

## 6. The COLA condition

If $e[t] = C$ for every sample $t$, with the same constant $C$, then

$$
x[t] = \frac{s[t]}{C}
$$

This is the constant overlap-add (COLA) condition. The window and the hop together satisfy it, or not.

### 6.1 Why the periodic Hann window satisfies it at $H = N/2$

Take a sample in the overlap of two neighbor frames. It sits at position $n + N/2$ in the first frame and at position $n$ in the second, with $n$ from 0 to $N/2 - 1$. Add its two weights:

1. $w[n] + w[n + N/2] = 0.5 - 0.5\cos\!\left(\frac{2\pi n}{N}\right) + 0.5 - 0.5\cos\!\left(\frac{2\pi n}{N} + \pi\right)$.
2. The shift of $N/2$ samples adds $\frac{2\pi (N/2)}{N} = \pi$ to the angle: half a turn.
3. Half a turn flips the sign: $\cos(\theta + \pi) = -\cos\theta$ ([F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle)).
4. So $w[n] + w[n + N/2] = 1 - 0.5\cos\theta + 0.5\cos\theta = 1$, exactly.

For $H = N/4$, four frames overlap. Two pairs of half-turn partners give $1 + 1 = 2$. So $e[t] = 2$ at every sample.

### 6.2 Why the symmetric Hann window does not quite satisfy it

The symmetric window divides by $N - 1$. For $N$ = 8 it divides by 7:

| $n$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| symmetric $w[n]$ | 0 | 0.1883 | 0.6113 | 0.9505 | 0.9505 | 0.6113 | 0.1883 | 0 |

With $H$ = 4, the window sums are $w[0] + w[4] = 0.9505$, $w[1] + w[5] = 0.7995$, $w[2] + w[6] = 0.7995$ and $w[3] + w[7] = 0.9505$ (sums from the unrounded values). The sum changes with $t$. The reason: a shift of 4 samples turns the cosine by $2\pi \cdot 4/7$, which is $4/7$ of a turn, not half a turn. So the two cosines do not cancel.

### 6.3 The numbers for $N$ = 400

| Hop $H$ | Window | Smallest window sum | Largest window sum | COLA? |
|---|---|---|---|---|
| 200 ($N/2$) | periodic Hann | 1.000000 | 1.000000 | yes, $C$ = 1 |
| 200 ($N/2$) | symmetric Hann | 0.996063 | 0.999985 | no, about 0.4% ripple |
| 100 ($N/4$) | periodic Hann | 2.000000 | 2.000000 | yes, $C$ = 2 |
| 100 ($N/4$) | symmetric Hann | 1.994444 | 1.996048 | no |
| 160 | periodic Hann | 1.190983 | 1.309017 | no |

> [!key] Periodic Hann for the STFT
> The periodic Hann window gives an exact constant window sum at $H = N/2$ and $H = N/4$. `torch.hann_window` and `scipy.signal.get_window("hann", N)` give the periodic form by default. The PyTorch documentation says that this form is "ready to be used as a periodic window with functions like torch.stft".

> [!trap] The speech hop is not COLA for Hann
> With $N$ = 400 and $H$ = 160, $N/H = 2.5$ is not a whole number. The window sum moves between 1.191 and 1.309. A division by one constant leaves a ripple of about ±5% on the signal. The next section removes it.

## 7. Divide by the window sum at each sample

The relation $s[t] = x[t] \cdot e[t]$ holds for any hop. So divide sample by sample:

$$
x[t] = \frac{s[t]}{e[t]} \qquad \text{when } e[t] \neq 0
$$

This needs no COLA condition. It needs only $e[t] \neq 0$. With $H$ = 160, the smallest window sum is 1.191, so every division is safe inside the signal.

> [!example] One sample with $H$ = 160
> Sample $t$ = 400 lies in frame 1 (position 240), frame 2 (position 80) and not in frame 0 (which ends at 399).
>
> 1. $w[240] = 0.5 - 0.5\cos(2\pi \cdot 240/400) = 0.5 - 0.5\cos(1.2\pi) = 0.5 + 0.5 \times 0.8090 = 0.9045$.
> 2. $w[80] = 0.5 - 0.5\cos(2\pi \cdot 80/400) = 0.5 - 0.5\cos(0.4\pi) = 0.5 - 0.5 \times 0.3090 = 0.3455$.
> 3. $e[400] = 0.9045 + 0.3455 = 1.25$.
>
> So $s[400] = 1.25 \cdot x[400]$, and $x[400] = s[400]/1.25$. (Cosines rounded to four decimals.)

## 8. Weighted overlap-add: the least-squares ISTFT

PyTorch and librosa do one more step. They multiply each inverse frame by the window a second time, overlap-add, and divide by the sum of the squared windows:

$$
\hat{x}[t] = \frac{\sum_m w[t - mH]\; y_m[t - mH]}{\sum_m w^2[t - mH]}
$$

For an unchanged STFT, $y_m[n] = w[n]\, x[mH + n]$. The numerator becomes $x[t] \sum_m w^2[t - mH]$, and the division gives $\hat{x}[t] = x[t]$ exactly. So this formula also gives perfect reconstruction.

### 8.1 Why multiply by the window again?

After a change to the grid, an inverse frame $y_m[n]$ no longer fades to zero at its edges. Added as it is, each frame edge can make a small jump: a click every hop. The second window fades each frame edge to zero before the addition.

### 8.2 Why this formula is the best fit

Suppose the frames $y_m$ come from a changed grid. We want the signal $\hat{x}$ whose windowed frames are as close as possible to the $y_m$. "Close" means a small sum of squared differences:

$$
E = \sum_m \sum_{n=0}^{N-1} \left( y_m[n] - w[n]\, \hat{x}[mH + n] \right)^2
$$

1. Each unknown sample $\hat{x}[t]$ appears only in the terms with $mH + n = t$, that is, $n = t - mH$.
2. Collect those terms: $E_t = \sum_m \left( y_m[t - mH] - w[t - mH]\, \hat{x}[t] \right)^2$. The other terms do not contain $\hat{x}[t]$.
3. Write $z = \hat{x}[t]$, $a = \sum_m w^2[t - mH]$ and $b = \sum_m w[t - mH]\, y_m[t - mH]$. Expand the squares: $E_t = a z^2 - 2bz + c$, where $c$ does not contain $z$.
4. Complete the square: $a z^2 - 2bz + c = a\,(z - b/a)^2 + c - b^2/a$.
5. With $a > 0$, the first term is never negative, and it is 0 only at $z = b/a$. So $E_t$ is smallest at $z = b/a$.

So $\hat{x}[t] = b/a$, the formula above. Griffin and Lim published this least-squares estimate in 1984.

> [!note] Sources for the library ISTFT
> - PyTorch `torch.istft` docstring (`torch/functional.py`): it "should return the least squares estimation of the original signal", it checks the NOLA condition $\sum_t \lvert w \rvert^2[n - t \times \text{hop\_length}] \neq 0$, and it cites D. W. Griffin and J. S. Lim, "Signal estimation from modified short-time Fourier transform", IEEE Trans. ASSP, 1984. The C++ code (`aten/src/ATen/native/SpectralOps.cpp`) multiplies each frame by the window, overlap-adds, and divides by the overlap-add of the squared window.
> - librosa `librosa.istft` documentation: it minimizes the mean squared error, and it normalizes each sample "by the sum of squared window".

### 8.3 The squared window sum for speech settings

With $N$ = 400 and $H$ = 160, the sum of the squared periodic Hann windows moves between 0.8568 and 1.0182. It is not constant, but it is never close to 0. So the division is safe. With $H = N/4$ = 100, the squared sum is exactly 1.5 at every sample.

## 9. The edges and the length

### 9.1 The NOLA condition at the edges

The first sample of the signal sits only in frame 0, at position $n$ = 0. The Hann window has $w[0] = 0$. Without padding, the squared window sum at $t$ = 0 is $0^2 = 0$. The formula divides by 0, so the ISTFT cannot restore sample 0. The NOLA condition fails there.

> [!example] What the libraries do at a zero window sum
> - With `center=False`, librosa returns 0 for the first sample. In a test, the true first sample was 0.0012. librosa divides only where the window sum is above a tiny number.
> - PyTorch `torch.istft` raises an error when the smallest window sum is below $10^{-11}$ (the check `window_envelop.abs().min().lt(1e-11)` in `SpectralOps.cpp`). With `center=False` and a Hann window, PyTorch 2.14.1 raised this error in a test.

Center padding (L34) solves the problem. The real signal starts 200 samples into the padded signal. There, the squared window sum for $H$ = 160 is 1.0091, not 0.

### 9.2 The length

The STFT does not store the signal length. With center padding, the ISTFT returns $(T - 1) H$ samples by default.

- $L$ = 16,000: $T$ = 101, and $(101 - 1) \times 160 = 16{,}000$. The length is right.
- $L$ = 16,050: $T = 1 + \lfloor 16{,}050/160 \rfloor = 1 + 100 = 101$. The default length is again 16,000, so the last 50 samples are missing.

Pass the length: `librosa.istft(S, hop_length=160, n_fft=400, length=16050)` or `torch.istft(..., length=16050)`. Both libraries then return exactly 16,050 samples.

## 10. The perfect-reconstruction check

A test of an STFT and ISTFT pair:

1. Make a random signal, for example 16,000 samples from `np.random.default_rng(7).standard_normal(16000)`.
2. Compute the STFT with $N$ = 400, $H$ = 160, the periodic Hann window and center padding.
3. Compute the ISTFT with the same settings and the original length.
4. Compute the largest absolute error.

These notes ran the test with librosa 1.0.0 and with a NumPy implementation of section 8. Both gave a largest error of $1.8 \times 10^{-15}$. That is floating-point rounding: about 8 times the spacing of floating-point numbers near 1 ($2.2 \times 10^{-16}$).

> [!key] An unchanged STFT is lossless
> With a window that satisfies NOLA, enough padding and the right length, the ISTFT returns the signal to within rounding. The STFT loses no information. All the trouble comes from changes to the grid.

## 11. When you change the STFT

A grid of $201 \times 101$ complex numbers has many more numbers than the 16,000 samples of the signal. So most grids are not the STFT of any signal. Such a grid is not consistent. After a change, the ISTFT gives the signal whose STFT is closest in the least-squares sense (section 8.2). Its STFT is not your changed grid.

> [!example] A mask that does not stay
> Take 1 s of random noise. In frames 40 to 60 only, set every bin above 2000 Hz (bins 51 to 200) to 0. Run the ISTFT, then the STFT again.
>
> - The power above 2000 Hz in frames 40 to 60 was 461,369. After the round trip it is 3140, that is, 21.7 dB lower. It is not zero.
> - The new grid differs from the changed grid by 5.0% (ratio of the two norms).
>
> The cause: frames 39 and 61 still hold high frequencies, and they share samples with frames 40 and 60. Through the overlap, part of that power returns into frames 40 to 60.

> [!example] Random phases break a pure tone
> Take a 1000 Hz sine. Keep every magnitude, but give each bin a random phase. Run the ISTFT, then the STFT again. The numbers below come from one random seed. Other seeds give other values, but always a large change.
>
> - Bin 25 in frame 50 had magnitude 100. After the round trip it has 46.2.
> - Over the whole grid, the magnitudes differ by 59%.
>
> The overlapping frames now hold the same tone at different phases. In the overlap they cancel in part ([L12](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors)).

Two consequences for voice systems:

1. An enhancement system that changes magnitudes can leave sounds that it did not want, because the overlap returns power or cancels it ([L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement)).
2. A system that knows only magnitudes must estimate the phases. The Griffin–Lim method repeats ISTFT and STFT to find phases that fit the magnitudes ([L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end)).

> [!trap] A frame-by-frame filter is a circular convolution
> A multiplication of one frame spectrum by a filter is a circular convolution of the frame ([L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem)). The end of the filtered frame can wrap to its start. This is one more source of artifacts. Zero padding of each frame before its FFT avoids the wrap, if the padding is at least the filter length minus 1.

## 12. Graphs

```plot
{
  "title": "N = 8, H = 4: periodic Hann frames at 0 (gold), 4 (purple), 8 (gold) and their sum (ink)",
  "xAxis": { "label": "sample t", "domain": [-0.5, 15.5] },
  "yAxis": { "label": "weight", "domain": [-0.1, 1.3] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0.0], [1, 0.1464], [2, 0.5], [3, 0.8536], [4, 1.0], [5, 0.8536], [6, 0.5], [7, 0.1464]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0, 0.0], [1, 0.1464], [2, 0.5], [3, 0.8536], [4, 1.0], [5, 0.8536], [6, 0.5], [7, 0.1464]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true },
    { "points": [[4, 0.0], [5, 0.1464], [6, 0.5], [7, 0.8536], [8, 1.0], [9, 0.8536], [10, 0.5], [11, 0.1464]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true },
    { "points": [[4, 0.0], [5, 0.1464], [6, 0.5], [7, 0.8536], [8, 1.0], [9, 0.8536], [10, 0.5], [11, 0.1464]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true },
    { "points": [[8, 0.0], [9, 0.1464], [10, 0.5], [11, 0.8536], [12, 1.0], [13, 0.8536], [14, 0.5], [15, 0.1464]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[8, 0.0], [9, 0.1464], [10, 0.5], [11, 0.8536], [12, 1.0], [13, 0.8536], [14, 0.5], [15, 0.1464]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true },
    { "points": [[0, 0.0], [1, 0.1464], [2, 0.5], [3, 0.8536], [4, 1.0], [5, 1.0], [6, 1.0], [7, 1.0], [8, 1.0], [9, 1.0], [10, 1.0], [11, 1.0], [12, 1.0], [13, 0.8536], [14, 0.5], [15, 0.1464]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[0, 0.0], [1, 0.1464], [2, 0.5], [3, 0.8536], [4, 1.0], [5, 1.0], [6, 1.0], [7, 1.0], [8, 1.0], [9, 1.0], [10, 1.0], [11, 1.0], [12, 1.0], [13, 0.8536], [14, 0.5], [15, 0.1464]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true }
  ]
}
```

Between $t$ = 4 and $t$ = 12 the ink sum is exactly 1. Below 4 and above 12 only one frame covers the samples, so the sum falls. More frames at the ends, or center padding, move these edges outside the signal.

```plot
{
  "title": "N = 8, H = 4: the window sum of the symmetric Hann window (red) is not constant",
  "xAxis": { "label": "sample t", "domain": [-0.5, 15.5] },
  "yAxis": { "label": "window sum", "domain": [-0.1, 1.3] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0.0], [1, 0.1883], [2, 0.6113], [3, 0.9505], [4, 0.9505], [5, 0.7995], [6, 0.7995], [7, 0.9505], [8, 0.9505], [9, 0.7995], [10, 0.7995], [11, 0.9505], [12, 0.9505], [13, 0.6113], [14, 0.1883], [15, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 0.0], [1, 0.1883], [2, 0.6113], [3, 0.9505], [4, 0.9505], [5, 0.7995], [6, 0.7995], [7, 0.9505], [8, 0.9505], [9, 0.7995], [10, 0.7995], [11, 0.9505], [12, 0.9505], [13, 0.6113], [14, 0.1883], [15, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true }
  ]
}
```

```plot
{
  "title": "N = 400, H = 200: three periodic Hann frames (gold) add to exactly 1 (ink). Symmetric Hann sum (red) dips to 0.9961.",
  "xAxis": { "label": "sample t", "domain": [800, 1200] },
  "yAxis": { "label": "weight", "domain": [-0.05, 1.15] },
  "disableZoom": true,
  "data": [
    { "points": [[800, 1.0], [808, 0.9961], [816, 0.9843], [824, 0.9649], [832, 0.9382], [840, 0.9045], [848, 0.8645], [856, 0.8187], [864, 0.7679], [872, 0.7129], [880, 0.6545], [888, 0.5937], [896, 0.5314], [904, 0.4686], [912, 0.4063], [920, 0.3455], [928, 0.2871], [936, 0.2321], [944, 0.1813], [952, 0.1355], [960, 0.0955], [968, 0.0618], [976, 0.0351], [984, 0.0157], [992, 0.0039], [1000, 0.0], [1008, 0.0], [1200, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[800, 0.0], [808, 0.0039], [816, 0.0157], [824, 0.0351], [832, 0.0618], [840, 0.0955], [848, 0.1355], [856, 0.1813], [864, 0.2321], [872, 0.2871], [880, 0.3455], [888, 0.4063], [896, 0.4686], [904, 0.5314], [912, 0.5937], [920, 0.6545], [928, 0.7129], [936, 0.7679], [944, 0.8187], [952, 0.8645], [960, 0.9045], [968, 0.9382], [976, 0.9649], [984, 0.9843], [992, 0.9961], [1000, 1.0], [1008, 0.9961], [1016, 0.9843], [1024, 0.9649], [1032, 0.9382], [1040, 0.9045], [1048, 0.8645], [1056, 0.8187], [1064, 0.7679], [1072, 0.7129], [1080, 0.6545], [1088, 0.5937], [1096, 0.5314], [1104, 0.4686], [1112, 0.4063], [1120, 0.3455], [1128, 0.2871], [1136, 0.2321], [1144, 0.1813], [1152, 0.1355], [1160, 0.0955], [1168, 0.0618], [1176, 0.0351], [1184, 0.0157], [1192, 0.0039], [1200, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[800, 0.0], [1000, 0.0], [1008, 0.0039], [1016, 0.0157], [1024, 0.0351], [1032, 0.0618], [1040, 0.0955], [1048, 0.1355], [1056, 0.1813], [1064, 0.2321], [1072, 0.2871], [1080, 0.3455], [1088, 0.4063], [1096, 0.4686], [1104, 0.5314], [1112, 0.5937], [1120, 0.6545], [1128, 0.7129], [1136, 0.7679], [1144, 0.8187], [1152, 0.8645], [1160, 0.9045], [1168, 0.9382], [1176, 0.9649], [1184, 0.9843], [1192, 0.9961], [1200, 1.0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[800, 1.0], [1200, 1.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[800, 1.0], [808, 0.9995], [816, 0.999], [824, 0.9985], [832, 0.9981], [840, 0.9977], [848, 0.9973], [856, 0.997], [864, 0.9967], [872, 0.9964], [880, 0.9962], [888, 0.9961], [896, 0.9961], [904, 0.9961], [912, 0.9961], [920, 0.9963], [928, 0.9965], [936, 0.9967], [944, 0.997], [952, 0.9973], [960, 0.9977], [968, 0.9981], [976, 0.9986], [984, 0.9991], [992, 0.9996], [1000, 1.0], [1008, 0.9995], [1016, 0.999], [1024, 0.9985], [1032, 0.9981], [1040, 0.9977], [1048, 0.9973], [1056, 0.997], [1064, 0.9967], [1072, 0.9964], [1080, 0.9962], [1088, 0.9961], [1096, 0.9961], [1104, 0.9961], [1112, 0.9961], [1120, 0.9963], [1128, 0.9965], [1136, 0.9967], [1144, 0.997], [1152, 0.9973], [1160, 0.9977], [1168, 0.9981], [1176, 0.9986], [1184, 0.9991], [1192, 0.9996], [1200, 1.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true }
  ]
}
```

The red dip is small: 0.4%. It is still a gain error that repeats every 200 samples, that is, 80 times per second at 16 kHz.

```plot
{
  "title": "N = 400, H = 160 (speech settings): window sum (red) and squared window sum (purple). Neither is constant.",
  "xAxis": { "label": "sample t", "domain": [800, 1200] },
  "yAxis": { "label": "sum", "domain": [0.7, 1.4] },
  "disableZoom": true,
  "data": [
    { "points": [[800, 1.25], [808, 1.2292], [816, 1.2127], [824, 1.2007], [832, 1.1934], [840, 1.191], [848, 1.1934], [856, 1.2007], [864, 1.2127], [872, 1.2292], [880, 1.25], [888, 1.2708], [896, 1.2873], [904, 1.2993], [912, 1.3066], [920, 1.309], [928, 1.3066], [936, 1.2993], [944, 1.2873], [952, 1.2708], [960, 1.25], [968, 1.2292], [976, 1.2127], [984, 1.2007], [992, 1.1934], [1000, 1.191], [1008, 1.1934], [1016, 1.2007], [1024, 1.2127], [1032, 1.2292], [1040, 1.25], [1048, 1.2708], [1056, 1.2873], [1064, 1.2993], [1072, 1.3066], [1080, 1.309], [1088, 1.3066], [1096, 1.2993], [1104, 1.2873], [1112, 1.2708], [1120, 1.25], [1128, 1.2292], [1136, 1.2127], [1144, 1.2007], [1152, 1.1934], [1160, 1.191], [1168, 1.1934], [1176, 1.2007], [1184, 1.2127], [1192, 1.2292], [1200, 1.25]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[800, 0.9375], [808, 0.9626], [816, 0.9851], [824, 1.0029], [832, 1.0143], [840, 1.0182], [848, 1.0143], [856, 1.0029], [864, 0.9851], [872, 0.9626], [880, 0.9375], [888, 0.9124], [896, 0.8899], [904, 0.8721], [912, 0.8607], [920, 0.8568], [928, 0.8607], [936, 0.8721], [944, 0.8899], [952, 0.9124], [960, 0.9375], [968, 0.9626], [976, 0.9851], [984, 1.0029], [992, 1.0143], [1000, 1.0182], [1008, 1.0143], [1016, 1.0029], [1024, 0.9851], [1032, 0.9626], [1040, 0.9375], [1048, 0.9124], [1056, 0.8899], [1064, 0.8721], [1072, 0.8607], [1080, 0.8568], [1088, 0.8607], [1096, 0.8721], [1104, 0.8899], [1112, 0.9124], [1120, 0.9375], [1128, 0.9626], [1136, 0.9851], [1144, 1.0029], [1152, 1.0143], [1160, 1.0182], [1168, 1.0143], [1176, 1.0029], [1184, 0.9851], [1192, 0.9626], [1200, 0.9375]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true }
  ]
}
```

Both curves repeat every 160 samples, the hop. The library ISTFT divides by the purple curve, sample by sample. So the ripple does not reach the output.

## 13. Code

Use the `stft` function from the L34 exercise. Do not call a library ISTFT inside your functions.

**Exercise 1.** Write `window_sum(w, hop, n_frames)`. It overlap-adds `n_frames` copies of the window `w`, each `hop` samples after the previous one, and returns the sum.

Acceptance tests (look only at the middle part, away from the first and last frame):

1. Periodic Hann, $N$ = 400, hop 200: every value in the middle is 1 within $10^{-12}$.
2. Symmetric Hann (`np.hanning(400)`), hop 200: the middle values are between 0.99606 and 0.99999.
3. Periodic Hann squared (`w**2`), hop 160: the middle values are between 0.85676 and 1.01824.

**Exercise 2.** Write `istft(S, n_fft=400, hop=160, length=None)`. Use weighted overlap-add (section 8):

1. Run `np.fft.irfft(..., n=n_fft)` on each column.
2. Multiply each frame by the periodic Hann window a second time.
3. Overlap-add the frames, and overlap-add the squared windows.
4. Divide the first sum by the second sum.
5. Remove the `n_fft // 2` padding samples at each end, and apply `length`.

Acceptance tests:

1. Round trip: for 5 random signals with lengths 16,000, 16,050, 8,000, 4,321 and 400, `np.max(np.abs(istft(stft(x), length=len(x)) - x)) < 1e-6`.
2. Without `length`, a signal of 16,050 samples returns only 16,000 samples.
3. Reference on your own computer, librosa: `np.max(np.abs(istft(S, length=L) - librosa.istft(S, hop_length=160, n_fft=400, length=L))) < 1e-6`, with `S = librosa.stft(x, n_fft=400, hop_length=160)`. These notes checked librosa 1.0.0.
4. Reference with PyTorch: `torch.istft(torch.from_numpy(S), 400, 160, window=torch.hann_window(400, dtype=torch.float64), length=L)`. These notes checked the round trip with PyTorch 2.14.1: the largest error was $1.8 \times 10^{-15}$.

**Exercise 3.** Repeat the mask experiment of section 11 with your own functions. Print the power above 2000 Hz in frames 40 to 60 before and after the round trip. Expect a drop of about 21.7 dB for `np.random.default_rng(7).standard_normal(16000)`, not an infinite drop. Other random signals give other values.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft)

```check
{
  "question": "Hint for Exercise 2: the middle of my output is right, but the first 200 samples are wrong. Why?",
  "hint": "Where does the real signal start in the padded signal?",
  "answer": "The STFT padded n_fft // 2 = 200 samples on the left. After the overlap-add, the real signal starts at index 200 of the output. Remove the first 200 samples, and remove the padding at the end too. Also divide by the squared window sum of the padded length, then cut both arrays at the same places."
}
```

## 14. Common mistakes

1. **Division by a constant for any hop.** A division by one constant needs the COLA condition. With $N$ = 400 and $H$ = 160, divide by the window sum sample by sample.
2. **The symmetric Hann window.** `np.hanning(N)` divides by $N - 1$. Its window sum is not constant. Use the periodic form for STFT work.
3. **The wrong division after a second window.** Two window multiplications need a division by the sum of $w^2$, not by the sum of $w$.
4. **No padding at the edges.** Without padding, $w[0] = 0$ makes the window sum 0 at sample 0. Center padding keeps the window sum away from 0 inside the signal.
5. **A lost length.** The STFT does not store the length. Pass `length` to the ISTFT, or the last samples can disappear.
6. **"The ISTFT keeps my change exactly."** A changed grid is usually not consistent. The ISTFT gives the closest signal, and its STFT differs from the changed grid.
7. **`irfft` without `n`.** 201 bins can come from $N$ = 400 or $N$ = 401. Give `n=400`.

## 15. One-minute explanation

The ISTFT has two steps. First, an inverse FFT of each column returns each windowed frame exactly. Second, overlap-add places each frame at its start again and adds the frames. Each sample then holds itself times the window sum at that sample. If the window sum is constant, one division finishes the job: the periodic Hann window at a hop of $N/2$ gives exactly 1. For other hops, for example 160 with $N$ = 400, divide by the window sum sample by sample. PyTorch and librosa multiply each frame by the window again and divide by the sum of the squared windows. This is the least-squares answer, and it fades frame edges after a change. The ISTFT restores an unchanged STFT to within $10^{-15}$. A changed STFT is usually not the STFT of any signal, so the result never matches the change exactly.

## 16. Check questions

```check
{
  "question": "Write the periodic Hann window for N = 4. Show that the window sum with H = 2 is 1 at every sample of the overlap.",
  "hint": "w[n] = 0.5 − 0.5 cos(2πn/4) for n = 0, 1, 2, 3.",
  "answer": "w = [0.5 − 0.5·1, 0.5 − 0.5·0, 0.5 − 0.5·(−1), 0.5 − 0.5·0] = [0, 0.5, 1, 0.5]. With H = 2, sample positions n and n + 2 overlap: w[0] + w[2] = 0 + 1 = 1 and w[1] + w[3] = 0.5 + 0.5 = 1. So the window sum is 1."
}
```

```check
{
  "question": "With N = 400 and H = 160, sample t = 480 lies in which frames, at which positions? Compute the window sum e[480] for the periodic Hann window.",
  "hint": "Frame m covers t = 160m to 160m + 399. The position is n = t − 160m. Use cos(1.6π) = 0.3090 and cos(0.8π) = −0.8090.",
  "answer": "Frame 1 (160 to 559): n = 320. Frame 2 (320 to 719): n = 160. Frame 3 (480 to 879): n = 0. Frame 0 ends at 399. w[320] = 0.5 − 0.5 cos(1.6π) = 0.5 − 0.5 × 0.3090 = 0.3455. w[160] = 0.5 − 0.5 cos(0.8π) = 0.5 + 0.5 × 0.8090 = 0.9045. w[0] = 0. So e[480] = 0.3455 + 0.9045 + 0 = 1.25."
}
```

```check
{
  "question": "Why does the symmetric Hann window not give a constant window sum at H = N/2?",
  "hint": "Compare the shift of N/2 samples with the period of its cosine.",
  "answer": "The symmetric window uses cos(2πn/(N − 1)). A shift of N/2 samples turns the angle by 2π(N/2)/(N − 1), which is a little more than half a turn. So cos(θ + shift) is not exactly −cos θ, and the two cosines do not cancel. For N = 8 the sums are 0.9505 and 0.7995. For N = 400 the ripple is about 0.4%."
}
```

```check
{
  "question": "You set every bin above 4 kHz to zero in all frames of an STFT, then run the ISTFT. Is the STFT of the result exactly zero above 4 kHz? Explain.",
  "hint": "Think about frame edges and the second window, and about consistency.",
  "answer": "Not exactly. The new STFT multiplies the result by the window again, and the window spreads each component into its neighbor bins (leakage, L25). So the sharp edge at 4 kHz leaks. In a test with np.random.default_rng(7).standard_normal(16000), the power above 4 kHz fell by 28.5 dB, not to zero (the 2 frames at each end left out). Most of the rest sits just above the edge: bin 101 lost only 8.6 dB, and bin 110 lost 72 dB. The new grid differs from the changed grid by 5.4%."
}
```

```check
{
  "question": "A text-to-speech model gives you only the magnitudes |X[k, m]|. You set all phases to 0 and run the ISTFT. What goes wrong, and which lesson handles it?",
  "hint": "Look at the random-phase example in section 11.",
  "answer": "The phases decide how neighbor frames add in their overlap. Wrong phases make the overlapping frames cancel or add in the wrong places, so the magnitudes of the result differ from the target. In the random-phase test, a magnitude of 100 became 46.2. A method must estimate the phases, for example Griffin–Lim (L41), which repeats ISTFT and STFT."
}
```

## 17. Links

- Previous: [L34: The STFT and the spectrogram](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram)
- Next: [L36: Mel and log-mel](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel)
- [L13: The inverse DFT](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft)
- [L25: Leakage and windows](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)
- [L32: The convolution theorem](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem)
- [L40: Enhancement](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement)
- [L41: The text-to-speech back end](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end)
- [07 Speech time–frequency](/notes/maths/fft-signal-processing/07-speech-time-frequency)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
