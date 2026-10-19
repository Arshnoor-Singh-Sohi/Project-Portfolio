---
title: "L34: The STFT and the spectrogram"
order: 1
summary: "Cut a signal into short overlapping frames, window each frame, run one FFT for each frame, and stack the spectra into a spectrogram."
status: not-started
tags: [stft, spectrogram, frame, hop, window, speech]
---

## 1. The question this idea answers

One FFT of a whole recording tells which frequencies are in it. It does not tell when they occur. Speech changes all the time: the spectrum of one sound is different from the spectrum of the next sound. A speech recognizer needs both answers: which frequencies, and at which time.

Lesson [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty) showed the price of a short piece of signal: a 25 ms window gives bins 40 Hz apart. This lesson pays that price on purpose. It cuts the signal into short frames, runs one FFT for each frame, and puts the spectra side by side. The result is a picture of frequency against time: the spectrogram.

## 2. Mental model

> [!analogy] A strip of photos
> A camera takes one photo every 10 ms. Each photo has an exposure of 25 ms, so neighbor photos share part of their exposure. Each photo shows the spectrum of one short frame. Put the photos in a row, and you see how the sound changes.
>
> **Where it stops working:** a sharp photo shows one instant. A frame spectrum mixes everything inside its 25 ms, and its frequency grid has steps of 40 Hz. The window also spreads each peak into its neighbor bins. So each "photo" has a blur in time and a blur in frequency, and no setting removes both blurs.

## 3. Terms

| Term | Plain meaning |
|---|---|
| frame | A short piece of the signal, here 400 samples (25 ms). The STFT analyzes one frame at a time. |
| window length ($N$, `n_fft`) | The number of samples in one frame. In this lesson it is also the FFT size. |
| hop (hop length, $H$) | The number of samples from the start of one frame to the start of the next frame. Here 160 samples (10 ms). |
| overlap | The samples that two neighbor frames share: $N - H$. Here 240 samples, which is 60% of a frame. |
| frame rate | The number of frames in one second: $f_s / H$. Here 100 frames per second. |
| STFT (short-time Fourier transform) | A window and one FFT for each frame. The result is a grid of coefficients $X[k, m]$: bin $k$, frame $m$. |
| spectrogram | A picture of the STFT: time on the horizontal axis, frequency on the vertical axis, power as a color. |
| power | The square of the magnitude: $\lvert X[k,m] \rvert^2$. |
| decibel (dB) | A log unit for power: $10 \log_{10}(\text{power})$. Each +10 dB means 10 times more power. |
| center padding | $N/2$ extra samples on each side of the signal, so that the center of frame $m$ is at sample $m \cdot H$. |
| chirp | A tone whose frequency changes with time. A linear chirp changes by the same number of hertz in each second. |

## 4. One FFT of a whole recording loses the time

Take a linear chirp at $f_s$ = 16,000 Hz: a tone that rises from 200 Hz to 4000 Hz in 1 s. Then play the same samples backwards: the tone falls from 4000 Hz to 200 Hz. The two sounds are clearly different. Their magnitude spectra are the same.

### 4.1 The proof

Let $x[n]$ be the chirp, with $n = 0 \dots N-1$ and $N$ = 16,000. The reversed signal is $x_r[n] = x[N-1-n]$. Its DFT is

$$
X_r[k] = \sum_{n=0}^{N-1} x[N-1-n]\, e^{-i 2\pi k n / N}
$$

1. Put $p = N-1-n$. When $n$ runs from 0 to $N-1$, $p$ runs from $N-1$ to 0. So the sum covers the same terms, and $n = N-1-p$.
2. Substitute: $X_r[k] = \sum_{p=0}^{N-1} x[p]\, e^{-i 2\pi k (N-1-p) / N}$.
3. Split the exponent: $X_r[k] = e^{-i 2\pi k (N-1)/N} \sum_{p=0}^{N-1} x[p]\, e^{+i 2\pi k p / N}$.
4. The samples are real. So the sum in step 3 is the conjugate of $X[k]$: $\sum_p x[p]\, e^{+i 2\pi k p/N} = \overline{X[k]}$.
5. The first factor is a rotation. Its magnitude is exactly 1.

So $\lvert X_r[k] \rvert = 1 \cdot \lvert \overline{X[k]} \rvert = \lvert X[k] \rvert$ for every bin $k$.

> [!example] The numbers for the chirp
> - $N$ = 16,000 samples. The bins are $f_s/N$ = 1 Hz apart. `rfft` gives 8001 bins (0 Hz to 8000 Hz).
> - 99.6% of the power lies between 200 Hz and 4000 Hz. So the spectrum says "200 to 4000 Hz". It does not say "rising".
> - The largest difference between the two magnitude spectra is $1.4 \times 10^{-13}$. The largest magnitude is about 152. So the difference is only rounding.

> [!key] The time order is in the phases
> The magnitude spectrum of a whole recording tells which frequencies occur. Only the phases hold the order in time, spread over all bins. To see time, analyze short pieces.

## 5. Frames, window and hop

The short-time Fourier transform (STFT) does these steps:

1. Choose a window length $N$ (samples in one frame) and a hop $H$ (samples between frame starts).
2. Cut frame $m$: the samples $x[mH], x[mH+1], \dots, x[mH+N-1]$.
3. Multiply the frame by a window $w[n]$, point by point. A window is a list of $N$ weights that fade the frame edges to zero ([L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)).
4. Run one FFT on the windowed frame.
5. Keep bins $k = 0 \dots N/2$. The other bins are the mirror ([L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)).
6. Compute the power $\lvert X[k,m] \rvert^2$ and, for a picture, the decibels.
7. Put the column of frame $m$ at position $m$ in a grid.

### 5.1 The standard speech settings

Speech systems often use $f_s$ = 16,000 Hz, a 25 ms window and a 10 ms hop.

- Window length: $N = 0.025 \text{ s} \times 16{,}000 \text{ Hz} = 400$ samples.
- Hop: $H = 0.010 \text{ s} \times 16{,}000 \text{ Hz} = 160$ samples.
- Frame rate: $16{,}000 / 160 = 100$ frames per second.
- Overlap: $400 - 160 = 240$ samples. That is $240/400 = 60\%$ of a frame.

Why about 25 ms? A common assumption in speech processing is that the spectrum stays about the same for 20 to 30 ms. A 25 ms frame also holds 3.75 periods of a 150 Hz voice ($0.025 \times 150 = 3.75$). So each frame sees several cycles of the voice.

> [!note] Sources for the settings
> - The Whisper paper (Radford et al., 2022, section 2.2) re-samples all audio to 16,000 Hz. It computes "an 80-channel log-magnitude Mel spectrogram" on 25 ms windows with a stride of 10 ms.
> - `whisper/audio.py` on GitHub (openai/whisper): `SAMPLE_RATE = 16000`, `N_FFT = 400`, `HOP_LENGTH = 160`.
> - The Kaldi-compatible MFCC function in torchaudio (`torchaudio.compliance.kaldi.mfcc`) has the defaults `frame_length=25.0` ms and `frame_shift=10.0` ms.

### 5.2 The first frames

| Frame $m$ | First sample $mH$ | Last sample $mH + 399$ | Start (ms) | End (ms) |
|---|---|---|---|---|
| 0 | 0 | 399 | 0 | 25 |
| 1 | 160 | 559 | 10 | 35 |
| 2 | 320 | 719 | 20 | 45 |
| 3 | 480 | 879 | 30 | 55 |

Each frame starts 160 samples after the previous one. Frames 0 and 1 share the samples 160 to 399: 240 samples. Frames 0 and 2 share the samples 320 to 399: 80 samples. Frames 0 and 3 share no samples, because frame 3 starts at 480.

![Alt text: a speech-like waveform with three overlapping 400-sample Hann windows that start 160 samples apart, with the hop and the 240-sample overlap marked.](/notes/media/fft-signal-processing/figures/l34-frames-window-hop.svg)

## 6. How many frames?

### 6.1 Without padding

Frame $m$ starts at sample $mH$ and ends at sample $mH + N - 1$. It fits inside a signal of $L$ samples when its last sample exists:

$$
mH + N - 1 \le L - 1 \quad\Longleftrightarrow\quad m \le \frac{L - N}{H}
$$

The frame number $m$ is a whole number. So the largest $m$ is $\lfloor (L-N)/H \rfloor$. The symbol $\lfloor \cdot \rfloor$ (floor) means "the largest whole number that is not more than the value". The frames are $m = 0, 1, \dots$ up to that value, so we add 1 for frame 0:

$$
T = 1 + \left\lfloor \frac{L - N}{H} \right\rfloor \qquad (L \ge N)
$$

> [!example] One second of audio without padding
> $L$ = 16,000, $N$ = 400, $H$ = 160.
>
> 1. $(L - N)/H = 15{,}600 / 160 = 97.5$.
> 2. Take the floor: 97.
> 3. Add 1: $T$ = 98 frames.
>
> The last frame is $m$ = 97. It starts at $97 \times 160 = 15{,}520$ and ends at 15,919. The last 80 samples (15,920 to 15,999) are in no frame.

> [!trap] Not L / H
> $16{,}000 / 160 = 100$ is the wrong count without padding. It forgets that the last frame needs 400 samples, not 160.

### 6.2 With center padding

Many libraries add $N/2$ samples to each side of the signal first. This is center padding. Then the center of frame $m$ is at sample $mH$ of the original signal, at the time $mH/f_s$.

> [!example] One second of audio with center padding
> 1. Pad: $N/2 = 200$ samples on each side. The padded length is $16{,}000 + 2 \times 200 = 16{,}400$.
> 2. Count frames in the padded signal: $1 + \lfloor (16{,}400 - 400)/160 \rfloor = 1 + \lfloor 100 \rfloor = 101$.
> 3. The center of frame 0 is at $t$ = 0 s. The center of frame 100 is at $100 \times 10$ ms = 1.000 s.

For an even $N$, the padding adds $2 \cdot N/2 = N$ samples. So $(L + N - N)/H = L/H$, and the count is

$$
T = 1 + \left\lfloor \frac{L}{H} \right\rfloor \qquad \text{(center padding, even } N\text{)}
$$

For $L$ = 16,000: $1 + 100 = 101$ frames. For an odd $N$ the padding adds only $N - 1$ samples. For example, $N$ = 401 gives 100 frames, not 101 (checked with librosa).

### 6.3 What goes into the padding

The padding samples need values. Two choices are common:

- **Zeros** (`pad_mode="constant"`): the signal starts and stops suddenly.
- **Reflection** (`pad_mode="reflect"`): the padding is a mirror copy of the first and last samples.

Only the frames that touch the padding change. For 1 s of audio, those are frames 0, 1, 99 and 100. Frame 1 covers the original samples −40 to 359, so it touches the left padding. Frame 2 covers 120 to 519, so it does not.

> [!note] Library defaults (checked against the official sources)
> - PyTorch `torch.stft` (docstring in `torch/functional.py`): `center=True` and `pad_mode="reflect"` by default. The frame count is `1 + L // hop_length` for `center=True` and `1 + (L - n_fft) // hop_length` otherwise. The output has `(n_fft // 2) + 1` frequencies when `onesided=True`.
> - librosa `librosa.stft` (librosa documentation): `center=True` and `pad_mode="constant"` by default, so it pads with zeros. The output shape is `(1 + n_fft/2, n_frames)`. These notes checked the counts 98 and 101 with librosa 1.0.0.
> - So the two libraries give different values in the edge frames unless you set the same `pad_mode`. A test with PyTorch 2.14.1 and librosa 1.0.0 showed exactly this: with `pad_mode="constant"` the two STFTs agree within $1.5 \times 10^{-14}$. With the defaults, frames 0, 1, 99 and 100 differ.

> [!trap] Two libraries, two edges
> You compare your STFT with `torch.stft` and with `librosa.stft`. If the pad modes differ, the first two and the last two frames do not match. Set the pad mode, then compare.

## 7. One FFT for each frame

### 7.1 The formula

The symbols:

- $x[n]$: the signal, after any padding.
- $w[n]$: the window, with $N$ weights.
- $N$: the window length. $H$: the hop.
- $m$: the frame number. $k$: the bin.

The STFT is

$$
X[k, m] = \sum_{n=0}^{N-1} w[n]\, x[mH + n]\, e^{-i 2\pi k n / N}
$$

This is the DFT of [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula), applied to the windowed frame $w[n]\,x[mH+n]$. The index $n$ counts from the start of the frame, not from the start of the signal. PyTorch documents the same expression for `torch.stft`.

### 7.2 Which bins to keep

The samples are real. So bin $N-k$ is the conjugate of bin $k$ ([L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)). Keep $k = 0 \dots N/2$: that is $N/2 + 1 = 201$ bins for $N$ = 400. NumPy `np.fft.rfft` returns exactly these bins.

Bin $k$ is at $f_k = k f_s / N = k \times 40$ Hz ([L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)). Bin 200 is at 8000 Hz, the highest frequency that 16,000 samples per second can hold ([L26](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing)).

### 7.3 The window

Whisper, librosa and torchaudio use the periodic Hann window by default:

$$
w[n] = 0.5 - 0.5 \cos\!\left(\frac{2\pi n}{N}\right), \qquad n = 0 \dots N-1
$$

It divides by $N$, not by $N - 1$. Lesson [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft) shows why this choice matters. `torch.hann_window(400)` gives this window (its default is `periodic=True`). For `window="hann"`, librosa calls `scipy.signal.get_window`, and that function also gives the periodic form by default.

### 7.4 A worked frame

> [!example] A 1000 Hz sine in one frame
> Take $x[n] = \sin(2\pi \cdot 1000 \cdot n / 16{,}000)$, amplitude $A$ = 1, and one frame of $N$ = 400 samples.
>
> 1. The frame lasts 0.025 s. It holds $1000 \times 0.025 = 25$ cycles. So the tone sits exactly on bin 25 ($25 \times 40$ = 1000 Hz).
> 2. With no window, $\lvert X[25] \rvert = A N / 2 = 200$ ([L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)).
> 3. With the Hann window, the sum of the weights replaces $N$. The cosine part of $w[n]$ adds to zero over its full cycle, so $\sum_n w[n] = 0.5 \times 400 = 200$.
> 4. So $\lvert X[25] \rvert = A \cdot 200 / 2 = 100$.
> 5. The window spreads the peak into the two neighbor bins: $\lvert X[24] \rvert = \lvert X[26] \rvert = 50$. All other bins are 0 (within rounding).

### 7.5 Power and decibels

The power of bin $k$ in frame $m$ is $P[k,m] = \lvert X[k,m] \rvert^2$. The decibel value is

$$
P_{\text{dB}}[k,m] = 10 \log_{10} P[k,m]
$$

For the 1000 Hz frame: $P[25] = 100^2 = 10{,}000$, so $10 \log_{10} 10{,}000 = 10 \times 4 = 40$ dB. The neighbors have $50^2 = 2500$, so $10 \log_{10} 2500 = 33.98$ dB (rounded to two decimals).

Why 10 and not 20? The decibel is a unit for power. Power is magnitude squared, and $\log_{10}(a^2) = 2 \log_{10} a$. So $10 \log_{10} \lvert X \rvert^2 = 20 \log_{10} \lvert X \rvert$. Use 10 with power and 20 with magnitude. Both give 40 dB for this bin.

A bin can have power 0, and $\log_{10} 0$ is $-\infty$. So code adds a floor: $10 \log_{10} \max(P, 10^{-10})$. The floor $10^{-10}$ gives at least −100 dB. `librosa.power_to_db` uses `amin=1e-10` by default.

> [!trap] dB values are relative
> 40 dB here means "power 10,000 in the units of this FFT". Another FFT scaling (for example a division by $N$) moves every value by the same number of dB. Compare dB values only from the same pipeline.

## 8. The shape of the result

The STFT returns a grid with one row for each kept bin and one column for each frame:

$$
\text{shape} = (N/2 + 1) \times T
$$

| Audio | Padding | $T$ | Shape |
|---|---|---|---|
| 1 s, 16,000 samples | none | 98 | 201 × 98 |
| 1 s, 16,000 samples | center | 101 | 201 × 101 |
| 30 s, 480,000 samples | center | 3001 | 201 × 3001 |

For 1 s with center padding, the grid holds $201 \times 101 = 20{,}301$ complex numbers. Whisper removes the last frame of its STFT (`stft[..., :-1]` in `whisper/audio.py`). So a 30 s piece gives 3000 frames, the value of `N_FRAMES` in the same file. Lesson [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) reads that code.

> [!trap] Rows or columns?
> `torch.stft` and `librosa.stft` return (frequency, frame). Your own code may build an array of frames with shape (frame, sample). Then `np.fft.rfft(frames, axis=1)` gives (frame, bin). Transpose it before you compare.

## 9. Time and frequency resolution

Three numbers describe a spectrogram:

1. **Column step** = $H / f_s$ = 160 / 16,000 = 10 ms. The hop sets it.
2. **Column width in time** = $N / f_s$ = 400 / 16,000 = 25 ms. Each column mixes everything inside its frame.
3. **Bin spacing** = $f_s / N$ = 16,000 / 400 = 40 Hz. The window length sets it. With a Hann window, a pure tone fills a main lobe of 4 bins from zero to zero: 160 Hz.

| Window | $N$ at 16 kHz | Bin spacing $f_s/N$ | Bins kept $N/2+1$ |
|---|---|---|---|
| 10 ms | 160 | 100 Hz | 81 |
| 20 ms | 320 | 50 Hz | 161 |
| 25 ms | 400 | 40 Hz | 201 |
| 32 ms | 512 | 31.25 Hz | 257 |
| 50 ms | 800 | 20 Hz | 401 |
| 64 ms | 1024 | 15.625 Hz | 513 |

A longer window gives finer frequency steps and a wider time blur. This is the uncertainty trade-off of [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty).

> [!key] The hop does not sharpen the frequencies
> A smaller hop gives more columns per second. Each column still covers $N$ samples, so its frequency spacing stays $f_s/N$. Only the window length changes the frequency resolution.

The length 400 is not a power of 2. FFT libraries also handle such sizes, with other factorizations ([L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts)).

## 10. The spectrogram of a chirp

The chirp of section 4 has the frequency $f(t) = 200 + 3800\,t$ Hz at time $t$ seconds. The center of frame $m$ is at $t = m \times 0.01$ s. So the expected peak in frame $m$ is at $f(t)/40$ bins.

| Frame $m$ | Center $t$ | Expected $f(t)$ | Expected bin | Loudest bin | Loudest bin in Hz |
|---|---|---|---|---|---|
| 20 | 0.20 s | 960 Hz | 24.00 | 24 | 960 Hz |
| 25 | 0.25 s | 1150 Hz | 28.75 | 29 | 1160 Hz |
| 50 | 0.50 s | 2100 Hz | 52.50 | 52 and 53 (equal power) | 2080 and 2120 Hz |
| 75 | 0.75 s | 3050 Hz | 76.25 | 76 | 3040 Hz |
| 95 | 0.95 s | 3810 Hz | 95.25 | 95 | 3800 Hz |

In every frame, the loudest bin is within 20 Hz of the expected frequency. 20 Hz is half the bin spacing. In frame 50 the expected frequency is halfway between two bins, so the two bins have the same power. Inside one frame the chirp also moves by $3800 \times 0.025 = 95$ Hz, more than two bins. This is one more reason for the width of the line.

![Alt text: a spectrogram of a chirp. A dark line rises from 200 Hz at 0 s to 4000 Hz at 1 s, on a dashed gold line.](/notes/media/fft-signal-processing/figures/l34-chirp-spectrogram.svg)

The first and the last column show a vertical smear. The zero padding makes the chirp start and stop suddenly, and a sudden start spreads power over many bins ([L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)).

## 11. Graphs

```plot
{
  "title": "Chirp: expected frequency (gold line) and the loudest bin of every 5th frame (blue dots)",
  "xAxis": { "label": "time (s)", "domain": [-0.05, 1.05] },
  "yAxis": { "label": "frequency (Hz)", "domain": [0, 4500] },
  "disableZoom": true,
  "data": [
    { "fn": "200 + 3800*x", "color": "#B8860B" },
    { "points": [[0.0, 200], [0.05, 400], [0.1, 600], [0.15, 760], [0.2, 960], [0.25, 1160], [0.3, 1360], [0.35, 1520], [0.4, 1720], [0.45, 1920], [0.5, 2120], [0.55, 2280], [0.6, 2480], [0.65, 2680], [0.7, 2880], [0.75, 3040], [0.8, 3240], [0.85, 3440], [0.9, 3640], [0.95, 3800], [1.0, 4000]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0.0, 200], [0.05, 400], [0.1, 600], [0.15, 760], [0.2, 960], [0.25, 1160], [0.3, 1360], [0.35, 1520], [0.4, 1720], [0.45, 1920], [0.5, 2120], [0.55, 2280], [0.6, 2480], [0.65, 2680], [0.7, 2880], [0.75, 3040], [0.8, 3240], [0.85, 3440], [0.9, 3640], [0.95, 3800], [1.0, 4000]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true }
  ]
}
```

The blue dots stay on a 40 Hz grid. They step around the gold line by at most 20 Hz.

```plot
{
  "title": "One column: frame 50 (t = 0.50 s) of the chirp in dB (blue), every second bin",
  "xAxis": { "label": "frequency (Hz)", "domain": [0, 8000] },
  "yAxis": { "label": "power (dB)", "domain": [-100, 50] },
  "disableZoom": true,
  "data": [
    { "points": [[0, -67.5], [80, -67.4], [160, -67.2], [240, -66.8], [320, -66.2], [400, -65.5], [480, -64.7], [560, -63.7], [640, -62.6], [720, -61.3], [800, -60.0], [880, -58.4], [960, -56.8], [1040, -55.0], [1120, -53.0], [1200, -50.8], [1280, -48.4], [1360, -45.7], [1440, -42.6], [1520, -39.2], [1600, -35.2], [1680, -30.5], [1760, -24.6], [1840, -16.8], [1920, -5.2], [2000, 14.9], [2080, 38.4], [2160, 28.0], [2240, 3.4], [2320, -11.7], [2400, -21.0], [2480, -27.7], [2560, -33.0], [2640, -37.3], [2720, -41.0], [2800, -44.3], [2880, -47.2], [2960, -49.7], [3040, -52.1], [3120, -54.3], [3200, -56.3], [3280, -58.1], [3360, -59.8], [3440, -61.5], [3520, -63.0], [3600, -64.4], [3680, -65.8], [3760, -67.1], [3840, -68.4], [3920, -69.6], [4000, -70.7], [4080, -71.8], [4160, -72.8], [4240, -73.8], [4320, -74.8], [4400, -75.7], [4480, -76.7], [4560, -77.5], [4640, -78.4], [4720, -79.2], [4800, -80.0], [4880, -80.8], [4960, -81.5], [5040, -82.2], [5120, -82.9], [5200, -83.6], [5280, -84.3], [5360, -84.9], [5440, -85.5], [5520, -86.2], [5600, -86.7], [5680, -87.3], [5760, -87.9], [5840, -88.4], [5920, -88.9], [6000, -89.5], [6080, -89.9], [6160, -90.4], [6240, -90.9], [6320, -91.3], [6400, -91.8], [6480, -92.2], [6560, -92.6], [6640, -92.9], [6720, -93.3], [6800, -93.6], [6880, -94.0], [6960, -94.3], [7040, -94.5], [7120, -94.8], [7200, -95.1], [7280, -95.3], [7360, -95.5], [7440, -95.7], [7520, -95.8], [7600, -96.0], [7680, -96.1], [7760, -96.1], [7840, -96.2], [7920, -96.2], [8000, -96.3]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, -67.5], [80, -67.4], [160, -67.2], [240, -66.8], [320, -66.2], [400, -65.5], [480, -64.7], [560, -63.7], [640, -62.6], [720, -61.3], [800, -60.0], [880, -58.4], [960, -56.8], [1040, -55.0], [1120, -53.0], [1200, -50.8], [1280, -48.4], [1360, -45.7], [1440, -42.6], [1520, -39.2], [1600, -35.2], [1680, -30.5], [1760, -24.6], [1840, -16.8], [1920, -5.2], [2000, 14.9], [2080, 38.4], [2160, 28.0], [2240, 3.4], [2320, -11.7], [2400, -21.0], [2480, -27.7], [2560, -33.0], [2640, -37.3], [2720, -41.0], [2800, -44.3], [2880, -47.2], [2960, -49.7], [3040, -52.1], [3120, -54.3], [3200, -56.3], [3280, -58.1], [3360, -59.8], [3440, -61.5], [3520, -63.0], [3600, -64.4], [3680, -65.8], [3760, -67.1], [3840, -68.4], [3920, -69.6], [4000, -70.7], [4080, -71.8], [4160, -72.8], [4240, -73.8], [4320, -74.8], [4400, -75.7], [4480, -76.7], [4560, -77.5], [4640, -78.4], [4720, -79.2], [4800, -80.0], [4880, -80.8], [4960, -81.5], [5040, -82.2], [5120, -82.9], [5200, -83.6], [5280, -84.3], [5360, -84.9], [5440, -85.5], [5520, -86.2], [5600, -86.7], [5680, -87.3], [5760, -87.9], [5840, -88.4], [5920, -88.9], [6000, -89.5], [6080, -89.9], [6160, -90.4], [6240, -90.9], [6320, -91.3], [6400, -91.8], [6480, -92.2], [6560, -92.6], [6640, -92.9], [6720, -93.3], [6800, -93.6], [6880, -94.0], [6960, -94.3], [7040, -94.5], [7120, -94.8], [7200, -95.1], [7280, -95.3], [7360, -95.5], [7440, -95.7], [7520, -95.8], [7600, -96.0], [7680, -96.1], [7760, -96.1], [7840, -96.2], [7920, -96.2], [8000, -96.3]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true }
  ]
}
```

This is one column of the heat map, turned on its side. The peak is near 2100 Hz at about 38 dB. The skirts fall to about −96 dB at 8000 Hz. Without the log, the skirts would be invisible: a drop of 60 dB is a factor of a million in power.

## 12. Code

Build the STFT in two steps. Do not call a library STFT inside your functions. Use `np.fft.rfft` for the FFT of each frame.

**Exercise 1.** Write `frame_signal(x, n_fft, hop)`. It returns a 2-D array of shape `(n_frames, n_fft)` with no padding. Row `m` holds `x[m*hop : m*hop + n_fft]`.

Acceptance tests:

1. `x = np.arange(16000.0)`: the shape is `(98, 400)`.
2. Row 1 equals `x[160:560]`, and the last row starts with the value 15520.
3. A signal of 400 samples gives shape `(1, 400)`. A signal of 399 samples gives shape `(0, 400)`.

**Exercise 2.** Write `stft(x, n_fft=400, hop=160)`. Pad `n_fft // 2` zeros on each side, cut frames with `frame_signal`, multiply each frame by the periodic Hann window, and run `np.fft.rfft`. Return a complex array of shape `(n_fft//2 + 1, n_frames)`.

Acceptance tests, with `x = np.random.default_rng(0).standard_normal(16000)`:

1. The shape is `(201, 101)`.
2. Reference in the browser lab, SciPy: `ref = scipy.signal.stft(x, fs=16000, window="hann", nperseg=400, noverlap=240, boundary="zeros", padded=False)[2] * 200`. Then `np.max(np.abs(S - ref)) < 1e-6`. SciPy divides by the sum of the window weights (200), so the test multiplies by 200.
3. Reference on your own computer, librosa: `np.max(np.abs(S - librosa.stft(x, n_fft=400, hop_length=160))) < 1e-6`. This uses the librosa defaults `center=True` and `pad_mode="constant"`. These notes checked it with librosa 1.0.0. librosa may not load in the browser lab.
4. Reference with PyTorch: `torch.stft(torch.from_numpy(x), 400, 160, window=torch.hann_window(400, dtype=torch.float64), pad_mode="constant", return_complex=True)`. The default `pad_mode="reflect"` changes frames 0, 1, 99 and 100. These notes checked both cases with PyTorch 2.14.1.

**Exercise 3.** Write `power_db(S, floor=1e-10)`. It returns $10 \log_{10} \max(\lvert S \rvert^2, \text{floor})$. Test it on the 1000 Hz frame of section 7.4: bin 25 gives 40.0 dB, and bins 24 and 26 give 33.98 dB.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram)

[FFT explorer lab](/labs/new?template=fft-explorer)

```check
{
  "question": "Hint for Exercise 2: my shape is (101, 201), and the values do not match. What is wrong?",
  "hint": "Look at the axis of your FFT and at the order of the two axes.",
  "answer": "The frames array has shape (frames, samples). An FFT along axis 1 gives (frames, bins) = (101, 201). Transpose the result to (bins, frames) = (201, 101). If the values still differ, check the window: the periodic Hann window divides by N = 400, not by N − 1 = 399."
}
```

## 13. Common mistakes

1. **Frame count = L / H.** Without padding, the count is $1 + \lfloor (L-N)/H \rfloor$. With center padding and an even $N$, it is $1 + \lfloor L/H \rfloor$.
2. **A smaller hop for better frequency resolution.** The hop sets the number of columns per second. Only the window length $N$ sets the bin spacing $f_s/N$.
3. **20 log10 of power.** Use $10 \log_{10}$ for power and $20 \log_{10}$ for magnitude. Both give the same dB value.
4. **Different pad modes.** PyTorch pads by reflection by default, and librosa pads with zeros. The edge frames differ.
5. **The symmetric Hann window.** `np.hanning(400)` divides by 399. Library STFTs use the periodic window, which divides by 400.
6. **Transposed output.** Libraries return (bin, frame). An FFT over an array of frames gives (frame, bin).
7. **The log of zero.** A silent bin gives $-\infty$ dB. Add a floor, for example $10^{-10}$.

## 14. One-minute explanation

One FFT of a whole recording tells which frequencies are present, but not when, because the time order hides in the phases. The STFT fixes this. It cuts the signal into short frames, for speech 400 samples (25 ms at 16 kHz), with a new frame every 160 samples (10 ms). It multiplies each frame by a Hann window, runs one FFT, and keeps the 201 non-mirror bins. It squares the magnitudes to get power and takes $10 \log_{10}$ to get decibels. The columns side by side make the spectrogram: 100 columns per second, 201 rows, 40 Hz per row. The window length sets the frequency spacing, and the hop sets only the number of columns. One second gives 98 frames without padding and 101 frames with center padding.

## 15. Check questions

```check
{
  "question": "At 16 kHz, what are the window length and the hop in samples for a 25 ms window and a 10 ms hop? How many frames per second does this give?",
  "hint": "Multiply each duration by the sample rate.",
  "answer": "Window: 0.025 × 16,000 = 400 samples. Hop: 0.010 × 16,000 = 160 samples. Frames per second: 16,000 / 160 = 100."
}
```

```check
{
  "question": "A clip has L = 8000 samples (0.5 s at 16 kHz). Use N = 400 and H = 160. How many frames do you get without padding, and with center padding? What is the shape of the STFT with center padding?",
  "hint": "Without padding: 1 + floor((L − N)/H). With center padding and an even N: 1 + floor(L/H).",
  "answer": "Without padding: (8000 − 400)/160 = 47.5, the floor is 47, add 1: 48 frames. With center padding: 8000/160 = 50, add 1: 51 frames. Shape: (400/2 + 1) × 51 = 201 × 51."
}
```

```check
{
  "question": "A frame holds a 1000 Hz sine with amplitude 1, N = 400, f_s = 16,000 Hz, periodic Hann window. Bin 25 has |X| = 100. What is its power in dB? What is the dB value of a bin with one quarter of that power?",
  "hint": "Power = |X|². dB = 10 log10(power).",
  "answer": "Power = 100² = 10,000. 10 log10(10,000) = 40 dB. One quarter: 2500, and 10 log10(2500) = 33.98 dB. A factor of 1/4 in power is −6.02 dB."
}
```

```check
{
  "question": "Why does a hop of 80 samples instead of 160 not separate two tones that are 30 Hz apart, with N = 400 at 16 kHz?",
  "hint": "Which number sets the bin spacing?",
  "answer": "The bin spacing is f_s/N = 16,000/400 = 40 Hz, and the Hann main lobe is 4 bins (160 Hz) wide. The hop changes only the number of frames per second (200 instead of 100). Each frame still covers 400 samples, so the frequency resolution stays the same. To separate the tones, use a longer window, for example N = 1600 (10 Hz bins) or more."
}
```

```check
{
  "question": "A recording has f_s = 48,000 Hz. You keep 25 ms windows and a 10 ms hop. Give N, H, the number of kept bins, the bin spacing, and the number of frames for 2 s with center padding.",
  "hint": "Recompute each number from the durations. The bin spacing is f_s/N.",
  "answer": "N = 0.025 × 48,000 = 1200. H = 0.010 × 48,000 = 480. Kept bins: 1200/2 + 1 = 601. Bin spacing: 48,000/1200 = 40 Hz, the same as at 16 kHz, because the window is still 25 ms long. L = 96,000, so the frames are 1 + 96,000/480 = 1 + 200 = 201."
}
```

```check
{
  "question": "The spectrum signal of the course has sines at 6, 14 and 24 Hz, with f_s = 128 Hz and N = 64 samples (0.5 s). You make an STFT with 16-sample frames, a hop of 8 and no padding. How many frames do you get? What is the bin spacing? Can one frame show three separate peaks?",
  "hint": "Frames: 1 + floor((L − N)/H). Bin spacing: f_s/N. Compare the tone spacing with the Hann main lobe of 4 bins.",
  "answer": "Frames: 1 + floor((64 − 16)/8) = 1 + 6 = 7. Bin spacing: 128/16 = 8 Hz, so the bins are at 0, 8, 16, 24, ... Hz. The tones 6 Hz and 14 Hz are only 1 bin apart, and the Hann main lobe is 4 bins (32 Hz) wide. So no: one frame shows one broad hump. In frame 3 the magnitudes are 5.27 at 8 Hz, 2.82 at 16 Hz, 0.94 at 24 Hz and 0.82 at 32 Hz. The FFT of all 64 samples (bins 2 Hz apart) separates the three tones."
}
```

```check
{
  "question": "Why do a rising chirp and the same chirp played backwards have the same magnitude spectrum?",
  "hint": "Write the DFT of x[N − 1 − n] and substitute p = N − 1 − n.",
  "answer": "The substitution gives X_r[k] = e^{−i2πk(N−1)/N} · conj(X[k]) for real samples. The first factor has magnitude 1, and a conjugate has the same magnitude. So |X_r[k]| = |X[k]| for every k. The time order lives only in the phases."
}
```

## 16. Links

- Previous: [L33: Uncertainty](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty)
- Next: [L35: The inverse STFT](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft)
- [L25: Leakage and windows](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)
- [L24: The mirror](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)
- [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)
- [L36: Mel and log-mel](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel)
- [L39: The speech-to-text front end](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end)
- [L42: Latency](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency)
- [07 Speech time–frequency](/notes/maths/fft-signal-processing/07-speech-time-frequency)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
