---
title: "L37: MFCC and pitch"
order: 4
summary: "Optional. MFCCs are the DCT of the log-mel energies and keep the smooth envelope. Pitch (f0) is the repeat period of the waveform: autocorrelation, cepstrum and YIN."
status: not-started
tags: [mfcc, dct, cepstrum, pitch, autocorrelation, yin, optional]
---

> [!note] Optional lesson
> This lesson is optional in the part table. Whisper reads log-mel features ([L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel)), not MFCCs. Study it for older speech systems, for pitch, and for one more use of the FFT.

## 1. The question this idea answers

The log-mel curve of one voiced frame holds two kinds of information at once. The smooth shape over the whole curve tells which vowel it is. The fast ripple at low frequencies tells the pitch of the voice. [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel) showed both in one graph.

This lesson separates them. MFCCs keep the smooth shape in about 13 numbers. Pitch estimation finds the repeat period of the waveform directly. Both use ideas from earlier parts: the matching score, the DCT as a cosine basis, and correlation through the FFT ([L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem)).

## 2. Mental model

> [!analogy] A buzzer inside a tube
> The vocal folds are a buzzer. They open and close about 150 times per second and make a sound with harmonics at 150, 300, 450 Hz and so on. The vocal tract is a tube that makes some of these harmonics strong and others weak. The buzzer sets the pitch. The shape of the tube sets the vowel.
>
> **Where it stops working:** a real buzzer is not perfectly regular, so the harmonics are not a perfect comb. Many sounds have no buzz at all: "s" and "f" are noise from the mouth. Then there is no pitch to find, and the separation does not apply.

## 3. Terms

| Term | Plain meaning |
|---|---|
| fundamental frequency ($f_0$) | The repeat rate of a voiced sound, in hertz. Listeners hear it as the pitch. |
| harmonic | A component at a whole multiple of $f_0$: $f_0, 2f_0, 3f_0, \dots$ |
| formant | A peak of the smooth spectral shape that the vocal tract makes. |
| spectral envelope | The smooth curve over the tops of the harmonics. |
| source-filter model | Speech = a source (pulses or noise) shaped by a filter (the vocal tract). |
| DCT-II | A transform with real cosines only. It matches a list of $M$ numbers against $M$ cosines. |
| MFCC | Mel-frequency cepstral coefficients: the DCT-II of the log-mel energies of one frame, usually the first 13. |
| cepstrum | The inverse FFT of the log magnitude spectrum. Its index is the quefrency, in samples. |
| autocorrelation ($r[\tau]$) | The matching score of a frame with a copy of itself, shifted by $\tau$ samples. |
| lag ($\tau$) | The shift, in samples, between the frame and its copy. |
| parabolic interpolation | A parabola through a peak and its two neighbors. Its top gives the peak position between two whole lags. |
| octave error | A pitch estimate at half or double the true $f_0$. |
| YIN | A pitch method that uses squared differences, a normalization and a threshold (de Cheveigné and Kawahara, 2002). |

## 4. The source-filter idea

The vocal folds let air through in short pulses, $f_0$ times per second. A signal that repeats with the frequency $f_0$ is a sum of harmonics at $f_0, 2f_0, 3f_0, \dots$ ([L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series)). The vocal tract then makes each harmonic stronger or weaker. The amplitude of harmonic $h$ is the value of the tract response at its frequency $h f_0$.

In the spectrum, this is a product: (source comb) × (tract envelope). The log changes a product into a sum:

$$
\log \lvert S(f) \rvert = \log \lvert \text{source}(f) \rvert + \log \lvert \text{tract}(f) \rvert
$$

So in the log spectrum, the pitch ripple and the envelope add. A sum is easier to separate than a product.

### 4.1 The test vowel

These notes use one synthetic vowel for all numbers. At $f_s$ = 16,000 Hz:

$$
x[n] = \sum_{h=1}^{53} A(150h)\, \cos\!\left(\frac{2\pi \cdot 150h \cdot n}{16{,}000}\right)
$$

$$
A(f) = \frac{1}{1 + \left(\frac{f - 700}{100}\right)^2} + \frac{0.5}{1 + \left(\frac{f - 1200}{120}\right)^2} + \frac{0.2}{1 + \left(\frac{f - 2600}{200}\right)^2}
$$

- $f_0$ = 150 Hz. The last harmonic is $53 \times 150 = 7950$ Hz, below 8000 Hz.
- $A(f)$ has three formant-like peaks: near 700 Hz, 1200 Hz and 2600 Hz.
- The first ten amplitudes (rounded) are 0.040, 0.069, 0.152, 0.521, 0.836, 0.272, 0.274, 0.542, 0.223 and 0.091. Harmonic 5 (750 Hz) is the strongest.
- The analysis frame is 400 samples (25 ms), from sample 1000 to sample 1399.

## 5. MFCC: the DCT of the log-mel energies

### 5.1 The steps

1. Compute the log-mel energies of one frame: $L[0], \dots, L[M-1]$, for $M$ mel filters (L36).
2. Apply the DCT-II to this list of $M$ numbers.
3. Keep the first coefficients, usually 13.

### 5.2 The DCT-II

For $q = 0 \dots M-1$:

$$
c[q] = s_q \sum_{j=0}^{M-1} L[j] \cos\!\left(\frac{\pi q (2j + 1)}{2M}\right), \qquad s_0 = \sqrt{\tfrac{1}{M}}, \quad s_q = \sqrt{\tfrac{2}{M}} \text{ for } q \ge 1
$$

Each $c[q]$ is a matching score ([L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score)) of the log-mel curve with one cosine across the bands. The cosine number $q$ makes $q$ half cycles across the $M$ bands. The factors $s_q$ make the cosines an orthonormal basis ([L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality)). This is the `norm="ortho"` option of `scipy.fft.dct` and the default of `librosa.feature.mfcc`.

What the first coefficients mean:

- $c[0] = \sqrt{M} \times (\text{mean of } L)$: the overall level of the frame.
- $c[1]$: the tilt. It is large when the low bands are stronger than the high bands.
- Larger $q$: faster patterns of rise and fall across the bands.

> [!example] A DCT-II by hand: $M$ = 4, $L = [2, 4, 3, 1]$
> The cosines $\cos(\pi q(2j+1)/8)$ for $j$ = 0, 1, 2, 3 (rounded to four decimals, with $\cos(\pi/4) = 1/\sqrt{2} \approx 0.7071$):
>
> | $q$ | $j$ = 0 | $j$ = 1 | $j$ = 2 | $j$ = 3 | Sum with $L$ | $s_q$ | $c[q]$ |
> |---|---|---|---|---|---|---|---|
> | 0 | 1 | 1 | 1 | 1 | $2 + 4 + 3 + 1 = 10$ | 0.5 | 5.0 |
> | 1 | 0.9239 | 0.3827 | −0.3827 | −0.9239 | 1.3066 | 0.7071 | 0.9239 |
> | 2 | 0.7071 | −0.7071 | −0.7071 | 0.7071 | −2.8284 | 0.7071 | −2.0 |
> | 3 | 0.3827 | −0.9239 | 0.9239 | −0.3827 | −0.5412 | 0.7071 | −0.3827 |
>
> Row $q$ = 1 in full: $2(0.9239) + 4(0.3827) + 3(-0.3827) + 1(-0.9239) = 1.8478 + 1.5307 - 1.1481 - 0.9239 = 1.3066$. Then $0.7071 \times 1.3066 = 0.9239$.
>
> Check: $c[0] = \sqrt{4} \times 2.5 = 5$, because the mean of $L$ is 2.5.

### 5.3 Why keep only about 13

**The smooth envelope lives in the low coefficients.** The envelope changes slowly from band to band, so it matches the slow cosines (small $q$). The harmonic ripple changes from band to band, so it matches the fast cosines (large $q$).

> [!example] The test vowel with 80 Whisper-style filters
> - The 80 log-mel values ($\log_{10}$) of the frame lie between −4.40 and 2.12.
> - The orthonormal DCT keeps the sum of squares ([L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality)). The first 13 coefficients hold 93.4% of the sum of squares of all 80.
> - Set coefficients 13 to 79 to 0 and invert the DCT. The result is the smooth gold curve in section 7. The ripple below 2000 Hz is gone, and the two formant peaks stay (near 780 Hz and 1270 Hz in the smooth curve).

**The coefficients are much less correlated than the bands.** Neighbor mel filters overlap, and a smooth envelope moves neighbor bands together. These notes made 3000 random synthetic vowel frames ($f_0$ from 90 to 250 Hz, random formant positions) with 40 mel filters:

| Features | Mean correlation of neighbors |
|---|---|
| 40 log-mel values | 0.92 |
| first 13 MFCCs | 0.22 (absolute value) |

Older statistical recognizers often modeled each feature with its own variance and no cross terms. Less correlated features suited such models better.

> [!note] How many coefficients do libraries keep?
> - torchaudio `torchaudio.compliance.kaldi.mfcc` (Kaldi-compatible): `num_ceps=13` "(including C0)", with `num_mel_bins=23`, `frame_length=25.0` ms and `frame_shift=10.0` ms by default (torchaudio 2.8 documentation).
> - librosa `librosa.feature.mfcc`: `n_mfcc=20`, `dct_type=2`, `norm="ortho"` by default (librosa documentation). It expects a log-power mel spectrogram in decibels, for example from `librosa.power_to_db`.
> - The DCT is linear. MFCCs from decibel values ($10 \log_{10}$) are exactly 10 times the MFCCs from $\log_{10}$ values.

> [!key] Modern neural models skip the DCT
> Whisper computes "an 80-channel log-magnitude Mel spectrogram" and gives it to its encoder (Whisper paper, section 2.2, and `whisper/audio.py`). The Hugging Face documentation of Wav2Vec2 says that it "accepts a float array corresponding to the raw waveform of the speech signal". Neither of these two models uses MFCCs.

## 6. Pitch

### 6.1 What we look for

The test vowel repeats every $f_s/f_0 = 16{,}000/150 = 106.67$ samples, that is, 6.67 ms. A pitch method looks for this repeat period $P$ and returns $f_0 = f_s/P$.

Speech pitch usually lies in a limited range. With a search range of 50 Hz to 400 Hz at 16 kHz, the period lies between $16{,}000/400 = 40$ and $16{,}000/50 = 320$ samples. A 25 ms frame (400 samples) holds 3.75 periods of a 150 Hz voice.

### 6.2 Autocorrelation

The autocorrelation of a frame $x[0], \dots, x[N-1]$ at lag $\tau$ is

$$
r[\tau] = \sum_{n=0}^{N-1-\tau} x[n]\, x[n + \tau]
$$

It is the matching score of the frame with a copy of itself, shifted by $\tau$ samples. At $\tau = 0$ the copy matches perfectly, and $r[0]$ is the energy of the frame. When $\tau$ equals the period, each pulse of the copy falls on a pulse of the frame, so $r[\tau]$ has a high peak. Divide by $r[0]$ to get values from −1 to 1.

> [!example] The test vowel frame (400 samples)
> The local maxima of $r[\tau]/r[0]$, from small lags upward:
>
> | Lag $\tau$ | 24 | 42 | 65 | 82 | 107 | 131 |
> |---|---|---|---|---|---|---|
> | $r[\tau]/r[0]$ | 0.423 | 0.300 | 0.278 | 0.361 | 0.738 | 0.305 |
>
> 1. The first local maximum, at lag 24, is not the pitch. $16{,}000/24 = 667$ Hz is close to the strongest formant: the waveform rings near 700 Hz inside each period.
> 2. Search only the lags 40 to 320. The largest value there is 0.738 at lag 107.
> 3. Integer estimate: $f_0 = 16{,}000/107 = 149.53$ Hz. The true period, 106.67, lies between two whole lags.

> [!trap] The first peak is not always the pitch
> Formants make smaller peaks at short lags. Search only the lags of the expected pitch range, and pick the largest peak there.

### 6.3 Parabolic interpolation

The true peak lies between the lags. Fit a parabola through three points: $(-1, a)$, $(0, b)$ and $(1, c)$, where $b$ is the largest value and $a$, $c$ are its neighbors.

1. A parabola $p(u) = b + \beta u + \gamma u^2$ has the value $b$ at $u = 0$, for any $\beta$ and $\gamma$.
2. At $u = 1$: $b + \beta + \gamma = c$. At $u = -1$: $b - \beta + \gamma = a$.
3. Subtract the two equations: $2\beta = c - a$, so $\beta = (c - a)/2$. Add them: $2b + 2\gamma = a + c$, so $\gamma = (a - 2b + c)/2$.
4. The top of the parabola is where its slope $\beta + 2\gamma u$ is 0: $u^* = -\beta/(2\gamma) = \dfrac{a - c}{2(a - 2b + c)}$.

> [!example] The vowel peak
> $a = r[106]/r[0] = 0.7162$, $b = 0.7375$, $c = r[108]/r[0] = 0.6356$.
>
> 1. $a - c = 0.0806$.
> 2. $a - 2b + c = 0.7162 - 1.4750 + 0.6356 = -0.1232$.
> 3. $u^* = 0.0806 / (2 \times -0.1232) = -0.327$.
> 4. Period: $107 - 0.327 = 106.673$ samples. $f_0 = 16{,}000/106.673 = 149.99$ Hz.
>
> The true value is 150 Hz. The interpolation removed almost all of the 0.47 Hz error of the integer lag.

### 6.4 Autocorrelation with the FFT

The direct sum costs about $N^2/2$ multiplications for all lags. The FFT is faster. Autocorrelation is a convolution of the frame with its reversed copy, so the convolution theorem ([L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem)) applies:

1. Pad the frame with zeros to length $2N$ (here 800).
2. Compute $X$ = FFT of the padded frame.
3. Compute the inverse FFT of $\lvert X \rvert^2$. Its first $N$ values are $r[0], \dots, r[N-1]$.

For the vowel frame, this matches the direct sum within $8.5 \times 10^{-14}$.

> [!trap] Without the zero padding the correlation is circular
> Without padding, the end of the shifted copy wraps to the start of the frame. Then the value at lag 107 is 0.799 instead of 0.738. The padding of $N$ zeros stops the wrap.

> [!trap] Two more pitch errors
> - **Octave error.** The autocorrelation also peaks near two periods: $r[213]/r[0] = 0.485$ for the vowel. When the first period is weak, the peak at two periods can win, and the estimate falls to half: 75 Hz.
> - **Lean toward small lags.** The sum at lag $\tau$ has only $N - \tau$ terms, so the values fall as $\tau$ grows. For a pure 220 Hz cosine, a 400-sample frame gives 222.49 Hz, an 800-sample frame gives 221.12 Hz, and a 1600-sample frame gives 220.53 Hz. The vowel has a sharp peak, so its error is much smaller.

### 6.5 The cepstrum, in short

The cepstrum of a frame is

$$
c[q] = \text{IFFT}\big(\log \lvert \text{FFT}(w[n]\,x[n]) \rvert\big)[q]
$$

The index $q$ is the quefrency, measured in samples. The log spectrum of a voiced frame has one peak at every harmonic. So it has a ripple with one cycle each 150 Hz, that is, each $150/40 = 3.75$ bins. The inverse FFT finds this ripple as a peak at quefrency $400/3.75 = 106.67$ samples, the period.

Take the vowel frame with a 400-sample Hann window. The largest cepstrum value in the range 40 to 320 is at $q$ = 107, so $f_0 = 16{,}000/107 = 149.53$ Hz. The low quefrencies hold the smooth envelope.

MFCCs follow the same idea with two changes: the mel filterbank before the log, and a DCT instead of the inverse FFT. "Keep the first 13" means "keep the low quefrencies", which is the envelope.

### 6.6 YIN, in short

YIN (de Cheveigné and Kawahara, 2002) replaces the product with a squared difference:

$$
d(\tau) = \sum_{n=0}^{W-1} \big(x[n] - x[n + \tau]\big)^2
$$

A good period gives a small difference. Then:

1. Normalize: $d'(0) = 1$ and $d'(\tau) = d(\tau) \Big/ \left(\frac{1}{\tau}\sum_{j=1}^{\tau} d(j)\right)$. This divides by the mean of the earlier values, so small lags do not win by default.
2. Take the first lag where $d'(\tau)$ falls below a threshold, for example 0.1. Then move to the local minimum after it.
3. Refine with parabolic interpolation, as in section 6.3.

> [!example] YIN on the vowel ($W$ = 400)
> - $d'(\tau)$ first falls below 0.1 at $\tau$ = 106. The local minimum is at 107, with $d'(107) = 0.0100$.
> - Parabolic interpolation gives 106.671 samples, so $f_0 = 149.99$ Hz.
> - Near the formant lag ($\tau$ = 20 to 25), $d'$ stays between 0.52 and 0.74. So the threshold of 0.1 does not pick the formant.
> - `librosa.yin(x, fmin=50, fmax=400, sr=16000, frame_length=800, hop_length=160)` gives a median of 150.00 Hz on the 1 s vowel (checked with librosa 1.0.0).

Noise-like sounds ("s", "f") have no period. Then no lag gives a small $d'$, and a pitch tracker reports "unvoiced" instead of a number.

## 7. Graphs

```plot
{
  "title": "The test vowel frame, every second sample (blue): tall pulses repeat every 106.67 samples",
  "xAxis": { "label": "sample in frame n", "domain": [0, 400] },
  "yAxis": { "label": "x[n]", "domain": [-2.5, 4.5] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0.322], [2, 0.412], [4, 0.248], [6, -0.01], [8, -0.122], [10, -0.108], [12, -0.08], [14, -0.075], [16, -0.097], [18, -0.124], [20, -0.068], [22, 0.157], [24, 0.385], [26, 0.376], [28, 0.16], [30, -0.244], [32, -0.745], [34, -0.838], [36, -0.425], [38, 0.055], [40, 0.605], [42, 0.977], [44, 0.598], [46, 0.162], [48, 0.16], [50, -0.179], [52, -0.384], [54, -0.216], [56, -1.143], [58, -1.958], [60, -0.967], [62, -0.146], [64, 1.031], [66, 3.651], [68, 2.845], [70, 0.404], [72, -0.322], [74, -1.408], [76, -1.888], [78, -0.704], [80, -0.215], [82, -0.401], [84, -0.02], [86, 0.161], [88, 0.243], [90, 0.792], [92, 0.923], [94, 0.408], [96, -0.103], [98, -0.59], [100, -0.879], [102, -0.595], [104, -0.085], [106, 0.249], [108, 0.407], [110, 0.327], [112, 0.067], [114, -0.105], [116, -0.119], [118, -0.088], [120, -0.074], [122, -0.088], [124, -0.119], [126, -0.105], [128, 0.067], [130, 0.327], [132, 0.407], [134, 0.249], [136, -0.085], [138, -0.595], [140, -0.879], [142, -0.59], [144, -0.103], [146, 0.408], [148, 0.923], [150, 0.792], [152, 0.243], [154, 0.161], [156, -0.02], [158, -0.401], [160, -0.215], [162, -0.704], [164, -1.888], [166, -1.408], [168, -0.322], [170, 0.404], [172, 2.845], [174, 3.651], [176, 1.031], [178, -0.146], [180, -0.967], [182, -1.958], [184, -1.143], [186, -0.216], [188, -0.384], [190, -0.179], [192, 0.16], [194, 0.162], [196, 0.598], [198, 0.977], [200, 0.605], [202, 0.055], [204, -0.425], [206, -0.838], [208, -0.745], [210, -0.244], [212, 0.16], [214, 0.376], [216, 0.385], [218, 0.157], [220, -0.068], [222, -0.124], [224, -0.097], [226, -0.075], [228, -0.08], [230, -0.108], [232, -0.122], [234, -0.01], [236, 0.248], [238, 0.412], [240, 0.322], [242, 0.05], [244, -0.42], [246, -0.846], [248, -0.735], [250, -0.261], [252, 0.223], [254, 0.788], [256, 0.931], [258, 0.398], [260, 0.145], [262, 0.103], [264, -0.324], [266, -0.3], [268, -0.375], [270, -1.583], [272, -1.778], [274, -0.584], [276, 0.046], [278, 1.892], [280, 3.978], [282, 1.892], [284, 0.046], [286, -0.584], [288, -1.778], [290, -1.583], [292, -0.375], [294, -0.3], [296, -0.324], [298, 0.103], [300, 0.145], [302, 0.398], [304, 0.931], [306, 0.788], [308, 0.223], [310, -0.261], [312, -0.735], [314, -0.846], [316, -0.42], [318, 0.05], [320, 0.322], [322, 0.412], [324, 0.248], [326, -0.01], [328, -0.122], [330, -0.108], [332, -0.08], [334, -0.075], [336, -0.097], [338, -0.124], [340, -0.068], [342, 0.157], [344, 0.385], [346, 0.376], [348, 0.16], [350, -0.244], [352, -0.745], [354, -0.838], [356, -0.425], [358, 0.055], [360, 0.605], [362, 0.977], [364, 0.598], [366, 0.162], [368, 0.16], [370, -0.179], [372, -0.384], [374, -0.216], [376, -1.143], [378, -1.958], [380, -0.967], [382, -0.146], [384, 1.031], [386, 3.651], [388, 2.845], [390, 0.404], [392, -0.322], [394, -1.408], [396, -1.888], [398, -0.704]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0.322], [2, 0.412], [4, 0.248], [6, -0.01], [8, -0.122], [10, -0.108], [12, -0.08], [14, -0.075], [16, -0.097], [18, -0.124], [20, -0.068], [22, 0.157], [24, 0.385], [26, 0.376], [28, 0.16], [30, -0.244], [32, -0.745], [34, -0.838], [36, -0.425], [38, 0.055], [40, 0.605], [42, 0.977], [44, 0.598], [46, 0.162], [48, 0.16], [50, -0.179], [52, -0.384], [54, -0.216], [56, -1.143], [58, -1.958], [60, -0.967], [62, -0.146], [64, 1.031], [66, 3.651], [68, 2.845], [70, 0.404], [72, -0.322], [74, -1.408], [76, -1.888], [78, -0.704], [80, -0.215], [82, -0.401], [84, -0.02], [86, 0.161], [88, 0.243], [90, 0.792], [92, 0.923], [94, 0.408], [96, -0.103], [98, -0.59], [100, -0.879], [102, -0.595], [104, -0.085], [106, 0.249], [108, 0.407], [110, 0.327], [112, 0.067], [114, -0.105], [116, -0.119], [118, -0.088], [120, -0.074], [122, -0.088], [124, -0.119], [126, -0.105], [128, 0.067], [130, 0.327], [132, 0.407], [134, 0.249], [136, -0.085], [138, -0.595], [140, -0.879], [142, -0.59], [144, -0.103], [146, 0.408], [148, 0.923], [150, 0.792], [152, 0.243], [154, 0.161], [156, -0.02], [158, -0.401], [160, -0.215], [162, -0.704], [164, -1.888], [166, -1.408], [168, -0.322], [170, 0.404], [172, 2.845], [174, 3.651], [176, 1.031], [178, -0.146], [180, -0.967], [182, -1.958], [184, -1.143], [186, -0.216], [188, -0.384], [190, -0.179], [192, 0.16], [194, 0.162], [196, 0.598], [198, 0.977], [200, 0.605], [202, 0.055], [204, -0.425], [206, -0.838], [208, -0.745], [210, -0.244], [212, 0.16], [214, 0.376], [216, 0.385], [218, 0.157], [220, -0.068], [222, -0.124], [224, -0.097], [226, -0.075], [228, -0.08], [230, -0.108], [232, -0.122], [234, -0.01], [236, 0.248], [238, 0.412], [240, 0.322], [242, 0.05], [244, -0.42], [246, -0.846], [248, -0.735], [250, -0.261], [252, 0.223], [254, 0.788], [256, 0.931], [258, 0.398], [260, 0.145], [262, 0.103], [264, -0.324], [266, -0.3], [268, -0.375], [270, -1.583], [272, -1.778], [274, -0.584], [276, 0.046], [278, 1.892], [280, 3.978], [282, 1.892], [284, 0.046], [286, -0.584], [288, -1.778], [290, -1.583], [292, -0.375], [294, -0.3], [296, -0.324], [298, 0.103], [300, 0.145], [302, 0.398], [304, 0.931], [306, 0.788], [308, 0.223], [310, -0.261], [312, -0.735], [314, -0.846], [316, -0.42], [318, 0.05], [320, 0.322], [322, 0.412], [324, 0.248], [326, -0.01], [328, -0.122], [330, -0.108], [332, -0.08], [334, -0.075], [336, -0.097], [338, -0.124], [340, -0.068], [342, 0.157], [344, 0.385], [346, 0.376], [348, 0.16], [350, -0.244], [352, -0.745], [354, -0.838], [356, -0.425], [358, 0.055], [360, 0.605], [362, 0.977], [364, 0.598], [366, 0.162], [368, 0.16], [370, -0.179], [372, -0.384], [374, -0.216], [376, -1.143], [378, -1.958], [380, -0.967], [382, -0.146], [384, 1.031], [386, 3.651], [388, 2.845], [390, 0.404], [392, -0.322], [394, -1.408], [396, -1.888], [398, -0.704]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true }
  ]
}
```

The tall pulses sit near $n$ = 67, 173, 280 and 387: one pulse every 106.67 samples. Between two pulses, the waveform rings with a period of about 23 samples, the 700 Hz formant.

```plot
{"title": "Autocorrelation r[τ]/r[0] of the vowel frame (blue). Gold dot: pitch peak at lag 107. Red dot: formant peak at lag 24 (a trap).", "xAxis": {"label": "lag τ (samples)", "domain": [0, 320]}, "yAxis": {"label": "r[τ] / r[0]", "domain": [-1, 1.1]}, "disableZoom": true, "data": [{"points": [[0, 1.0], [1, 0.915], [2, 0.697], [3, 0.426], [4, 0.168], [5, -0.061], [6, -0.274], [7, -0.472], [8, -0.622], [9, -0.678], [10, -0.622], [11, -0.491], [12, -0.347], [13, -0.238], [14, -0.169], [15, -0.113], [16, -0.044], [17, 0.037], [18, 0.111], [19, 0.163], [20, 0.201], [21, 0.247], [22, 0.311], [23, 0.381], [24, 0.423], [25, 0.411], [26, 0.336], [27, 0.217], [28, 0.077], [29, -0.066], [30, -0.202], [31, -0.326], [32, -0.421], [33, -0.466], [34, -0.445], [35, -0.362], [36, -0.235], [37, -0.093], [38, 0.042], [39, 0.155], [40, 0.239], [41, 0.288], [42, 0.3], [43, 0.271], [44, 0.211], [45, 0.133], [46, 0.055], [47, -0.01], [48, -0.057], [49, -0.086], [50, -0.101], [51, -0.107], [52, -0.11], [53, -0.11], [54, -0.11], [55, -0.108], [56, -0.104], [57, -0.095], [58, -0.076], [59, -0.043], [60, 0.007], [61, 0.073], [62, 0.148], [63, 0.217], [64, 0.264], [65, 0.278], [66, 0.254], [67, 0.197], [68, 0.11], [69, 0.001], [70, -0.122], [71, -0.245], [72, -0.347], [73, -0.403], [74, -0.401], [75, -0.344], [76, -0.25], [77, -0.137], [78, -0.016], [79, 0.106], [80, 0.223], [81, 0.314], [82, 0.361], [83, 0.354], [84, 0.305], [85, 0.241], [86, 0.187], [87, 0.148], [88, 0.11], [89, 0.058], [90, -0.008], [91, -0.071], [92, -0.119], [93, -0.158], [94, -0.213], [95, -0.301], [96, -0.408], [97, -0.49], [98, -0.503], [99, -0.433], [100, -0.303], [101, -0.149], [102, 0.013], [103, 0.189], [104, 0.387], [105, 0.581], [106, 0.716], [107, 0.738], [108, 0.636], [109, 0.453], [110, 0.25], [111, 0.065], [112, -0.1], [113, -0.256], [114, -0.396], [115, -0.486], [116, -0.499], [117, -0.433], [118, -0.326], [119, -0.224], [120, -0.153], [121, -0.106], [122, -0.062], [123, -0.008], [124, 0.051], [125, 0.099], [126, 0.13], [127, 0.156], [128, 0.192], [129, 0.24], [130, 0.286], [131, 0.305], [132, 0.28], [133, 0.214], [134, 0.122], [135, 0.021], [136, -0.08], [137, -0.176], [138, -0.259], [139, -0.316], [140, -0.333], [141, -0.302], [142, -0.231], [143, -0.135], [144, -0.033], [145, 0.058], [146, 0.133], [147, 0.185], [148, 0.211], [149, 0.209], [150, 0.181], [151, 0.133], [152, 0.076], [153, 0.023], [154, -0.02], [155, -0.048], [156, -0.065], [157, -0.073], [158, -0.077], [159, -0.078], [160, -0.078], [161, -0.077], [162, -0.076], [163, -0.072], [164, -0.063], [165, -0.047], [166, -0.02], [167, 0.019], [168, 0.067], [169, 0.119], [170, 0.162], [171, 0.188], [172, 0.189], [173, 0.164], [174, 0.117], [175, 0.052], [176, -0.026], [177, -0.11], [178, -0.19], [179, -0.25], [180, -0.275], [181, -0.261], [182, -0.213], [183, -0.144], [184, -0.066], [185, 0.016], [186, 0.098], [187, 0.171], [188, 0.224], [189, 0.243], [190, 0.227], [191, 0.189], [192, 0.147], [193, 0.115], [194, 0.09], [195, 0.062], [196, 0.024], [197, -0.021], [198, -0.059], [199, -0.088], [200, -0.115], [201, -0.157], [202, -0.221], [203, -0.29], [204, -0.331], [205, -0.321], [206, -0.26], [207, -0.166], [208, -0.063], [209, 0.045], [210, 0.166], [211, 0.298], [212, 0.418], [213, 0.485], [214, 0.471], [215, 0.381], [216, 0.252], [217, 0.121], [218, 0.004], [219, -0.102], [220, -0.202], [221, -0.285], [222, -0.328], [223, -0.317], [224, -0.261], [225, -0.187], [226, -0.124], [227, -0.082], [228, -0.053], [229, -0.022], [230, 0.014], [231, 0.048], [232, 0.073], [233, 0.089], [234, 0.104], [235, 0.126], [236, 0.155], [237, 0.178], [238, 0.181], [239, 0.157], [240, 0.111], [241, 0.053], [242, -0.008], [243, -0.068], [244, -0.123], [245, -0.169], [246, -0.196], [247, -0.196], [248, -0.169], [249, -0.12], [250, -0.06], [251, -0.001], [252, 0.051], [253, 0.091], [254, 0.117], [255, 0.127], [256, 0.12], [257, 0.099], [258, 0.068], [259, 0.034], [260, 0.005], [261, -0.018], [262, -0.032], [263, -0.04], [264, -0.044], [265, -0.045], [266, -0.045], [267, -0.045], [268, -0.045], [269, -0.043], [270, -0.04], [271, -0.034], [272, -0.022], [273, -0.005], [274, 0.018], [275, 0.046], [276, 0.074], [277, 0.095], [278, 0.105], [279, 0.1], [280, 0.082], [281, 0.053], [282, 0.015], [283, -0.027], [284, -0.071], [285, -0.11], [286, -0.135], [287, -0.141], [288, -0.128], [289, -0.098], [290, -0.061], [291, -0.02], [292, 0.022], [293, 0.062], [294, 0.096], [295, 0.117], [296, 0.121], [297, 0.108], [298, 0.087], [299, 0.067], [300, 0.052], [301, 0.039], [302, 0.024], [303, 0.003], [304, -0.018], [305, -0.035], [306, -0.047], [307, -0.061], [308, -0.085], [309, -0.118], [310, -0.148], [311, -0.161], [312, -0.147], [313, -0.111], [314, -0.064], [315, -0.013], [316, 0.04], [317, 0.1], [318, 0.163], [319, 0.215], [320, 0.235]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true}, {"points": [[107, 0.738]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true}, {"points": [[24, 0.423]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true}]}
```

The gold peak at lag 107 is the pitch. The red peak at lag 24 comes from the formant ringing. The smaller peak near lag 213 is two periods: a possible octave error.

```plot
{
  "title": "Log-mel of the vowel frame (blue, 80 bands) and its reconstruction from the first 13 MFCCs (gold)",
  "xAxis": { "label": "filter center frequency (Hz)", "domain": [0, 8000] },
  "yAxis": { "label": "log10 of mel energy", "domain": [-5, 3] },
  "disableZoom": true,
  "data": [
    { "points": [[37.0, -4.399], [74.0, -2.883], [112.0, -0.804], [149.0, -0.497], [186.0, -0.841], [223.0, -1.425], [261.0, -0.336], [298.0, -0.068], [335.0, -0.251], [372.0, -0.711], [410.0, 0.185], [447.0, 0.697], [484.0, 0.42], [521.0, -1.729], [559.0, 1.245], [596.0, 1.816], [633.0, 1.363], [670.0, 0.596], [708.0, 1.77], [745.0, 2.12], [782.0, 1.906], [819.0, 0.983], [857.0, 0.753], [894.0, 1.122], [931.0, 1.009], [968.0, -0.11], [1006.0, 0.605], [1045.0, 1.211], [1086.0, 0.863], [1128.0, 0.691], [1173.0, 1.58], [1219.0, 1.664], [1266.0, 0.835], [1316.0, 0.746], [1367.0, 0.916], [1421.0, -0.218], [1476.0, 0.1], [1534.0, -0.074], [1594.0, -0.764], [1657.0, -0.368], [1722.0, -1.009], [1789.0, -0.628], [1859.0, -1.058], [1932.0, -0.761], [2008.0, -1.045], [2086.0, -0.628], [2168.0, -0.813], [2253.0, -0.323], [2341.0, -0.107], [2433.0, 0.124], [2528.0, 0.631], [2627.0, 0.417], [2730.0, 0.444], [2836.0, -0.093], [2947.0, -0.564], [3063.0, -0.857], [3183.0, -1.171], [3307.0, -1.473], [3437.0, -1.712], [3571.0, -1.964], [3711.0, -2.133], [3857.0, -2.312], [4008.0, -2.472], [4164.0, -2.62], [4327.0, -2.758], [4497.0, -2.89], [4673.0, -3.016], [4856.0, -3.155], [5046.0, -3.271], [5244.0, -3.342], [5449.0, -3.493], [5662.0, -3.581], [5884.0, -3.678], [6114.0, -3.78], [6354.0, -3.89], [6602.0, -3.954], [6861.0, -4.071], [7129.0, -4.159], [7409.0, -4.244], [7699.0, -4.33]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[37.0, -4.399], [74.0, -2.883], [112.0, -0.804], [149.0, -0.497], [186.0, -0.841], [223.0, -1.425], [261.0, -0.336], [298.0, -0.068], [335.0, -0.251], [372.0, -0.711], [410.0, 0.185], [447.0, 0.697], [484.0, 0.42], [521.0, -1.729], [559.0, 1.245], [596.0, 1.816], [633.0, 1.363], [670.0, 0.596], [708.0, 1.77], [745.0, 2.12], [782.0, 1.906], [819.0, 0.983], [857.0, 0.753], [894.0, 1.122], [931.0, 1.009], [968.0, -0.11], [1006.0, 0.605], [1045.0, 1.211], [1086.0, 0.863], [1128.0, 0.691], [1173.0, 1.58], [1219.0, 1.664], [1266.0, 0.835], [1316.0, 0.746], [1367.0, 0.916], [1421.0, -0.218], [1476.0, 0.1], [1534.0, -0.074], [1594.0, -0.764], [1657.0, -0.368], [1722.0, -1.009], [1789.0, -0.628], [1859.0, -1.058], [1932.0, -0.761], [2008.0, -1.045], [2086.0, -0.628], [2168.0, -0.813], [2253.0, -0.323], [2341.0, -0.107], [2433.0, 0.124], [2528.0, 0.631], [2627.0, 0.417], [2730.0, 0.444], [2836.0, -0.093], [2947.0, -0.564], [3063.0, -0.857], [3183.0, -1.171], [3307.0, -1.473], [3437.0, -1.712], [3571.0, -1.964], [3711.0, -2.133], [3857.0, -2.312], [4008.0, -2.472], [4164.0, -2.62], [4327.0, -2.758], [4497.0, -2.89], [4673.0, -3.016], [4856.0, -3.155], [5046.0, -3.271], [5244.0, -3.342], [5449.0, -3.493], [5662.0, -3.581], [5884.0, -3.678], [6114.0, -3.78], [6354.0, -3.89], [6602.0, -3.954], [6861.0, -4.071], [7129.0, -4.159], [7409.0, -4.244], [7699.0, -4.33]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true },
    { "points": [[37.0, -2.498], [74.0, -2.359], [112.0, -2.101], [149.0, -1.756], [186.0, -1.368], [223.0, -0.979], [261.0, -0.629], [298.0, -0.34], [335.0, -0.123], [372.0, 0.029], [410.0, 0.138], [447.0, 0.228], [484.0, 0.327], [521.0, 0.455], [559.0, 0.621], [596.0, 0.82], [633.0, 1.034], [670.0, 1.236], [708.0, 1.398], [745.0, 1.494], [782.0, 1.51], [819.0, 1.444], [857.0, 1.309], [894.0, 1.134], [931.0, 0.95], [968.0, 0.794], [1006.0, 0.693], [1045.0, 0.663], [1086.0, 0.705], [1128.0, 0.799], [1173.0, 0.917], [1219.0, 1.018], [1266.0, 1.064], [1316.0, 1.024], [1367.0, 0.879], [1421.0, 0.63], [1476.0, 0.297], [1534.0, -0.086], [1594.0, -0.471], [1657.0, -0.812], [1722.0, -1.066], [1789.0, -1.202], [1859.0, -1.208], [1932.0, -1.09], [2008.0, -0.873], [2086.0, -0.595], [2168.0, -0.299], [2253.0, -0.03], [2341.0, 0.173], [2433.0, 0.286], [2528.0, 0.297], [2627.0, 0.206], [2730.0, 0.029], [2836.0, -0.214], [2947.0, -0.497], [3063.0, -0.797], [3183.0, -1.095], [3307.0, -1.377], [3437.0, -1.638], [3571.0, -1.877], [3711.0, -2.095], [3857.0, -2.296], [4008.0, -2.482], [4164.0, -2.654], [4327.0, -2.813], [4497.0, -2.955], [4673.0, -3.08], [4856.0, -3.188], [5046.0, -3.28], [5244.0, -3.363], [5449.0, -3.443], [5662.0, -3.528], [5884.0, -3.622], [6114.0, -3.73], [6354.0, -3.849], [6602.0, -3.974], [6861.0, -4.095], [7129.0, -4.201], [7409.0, -4.28], [7699.0, -4.322]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true }
  ]
}
```

The gold curve keeps the envelope: peaks near 780 Hz and 1270 Hz, a smaller rise near 2530 Hz, and the fall toward 8000 Hz. It loses the ripple of the single harmonics. So 13 numbers describe "which vowel", and they do not describe the pitch.

## 8. Code

Use your `log_mel` from L36. Do not call `scipy.fft.dct`, `librosa.feature.mfcc` or `librosa.yin` inside your functions.

**Exercise 1.** Write `dct2_ortho(L)` from the formula of section 5.2, for a 1-D array. Then write `mfcc(logmel, n_mfcc=13)`: apply `dct2_ortho` to each column of a log-mel array (shape `(n_mels, n_frames)`) and keep the first `n_mfcc` rows.

Acceptance tests:

1. `dct2_ortho(np.array([2.0, 4.0, 3.0, 1.0]))` gives `[5.0, 0.9239, -2.0, -0.3827]` within $10^{-4}$.
2. For a random array of shape `(80, 101)`, `mfcc(A, 13)` equals `scipy.fft.dct(A, type=2, norm="ortho", axis=0)[:13]` within $10^{-9}$.
3. Reference on your own computer, librosa: with `D = librosa.power_to_db(mel)` for a mel power spectrogram `mel`, `mfcc(D, 13)` equals `librosa.feature.mfcc(S=D, n_mfcc=13)` within $10^{-4}$.

**Exercise 2.** Write `autocorr(frame)` with the FFT and zero padding to `2 * len(frame)` (section 6.4). Return the lags 0 to `len(frame) - 1`.

Acceptance test: for 5 random frames of 400 samples, `autocorr(f)` equals `np.correlate(f, f, mode="full")[len(f) - 1:]` within $10^{-9}$.

**Exercise 3.** Write `pitch_autocorr(frame, sr, fmin=50, fmax=400)`: normalize by $r[0]$, find the largest value in the lag range `sr // fmax` to `sr // fmin`, and refine it with parabolic interpolation.

Build the test vowel of section 4.1 yourself, with $f_0$ as a parameter and all harmonics below 8000 Hz. Acceptance tests with the frame `x[1000:1400]` and `sr = 16000`:

1. $f_0$ = 150 Hz: the result is $149.99 \pm 0.05$ Hz.
2. $f_0$ = 100 Hz and $f_0$ = 200 Hz: the result is within 0.05 Hz of the true value.
3. A frame of zeros: the function returns `None`, not an error.

**Exercise 4 (optional).** Write `yin(frame, sr, fmin=50, fmax=400, threshold=0.1)` from section 6.6. Reference on your own computer: run both on the 1 s vowel and compare the medians. The librosa call is `librosa.yin(x, fmin=50, fmax=400, sr=16000, frame_length=800, hop_length=160)`, and its median is 150.00 Hz with librosa 1.0.0.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch)

```check
{
  "question": "Hint for Exercise 3: my function returns 667 Hz for the 150 Hz vowel. What is wrong?",
  "hint": "Which lag gives 667 Hz? Is it inside your search range?",
  "answer": "16,000 / 667 = 24 samples. Your search starts too early, or it takes the first local maximum. The peak at lag 24 comes from the 700 Hz formant. Search only from sr // fmax = 40 to sr // fmin = 320, and take the largest value there: lag 107."
}
```

## 9. Common mistakes

1. **The first autocorrelation peak as the pitch.** Formants make peaks at short lags. Search only the lags of the pitch range.
2. **Circular autocorrelation.** An FFT without zero padding wraps the shifted copy around the frame. Pad to $2N$.
3. **A DCT without the orthonormal factors.** `scipy.fft.dct(L, type=2)` without `norm="ortho"` gives other values: 20, 2.6131, −5.6569, −1.0824 for $L = [2, 4, 3, 1]$. Use the same normalization as the reference.
4. **MFCCs from different log units.** MFCCs from decibels are 10 times the MFCCs from $\log_{10}$. Compare like with like.
5. **Pitch in unvoiced frames.** "s" and "f" have no period. A pitch method needs a rule that says "no pitch".
6. **MFCCs as the input of every modern model.** Whisper reads log-mel, and Wav2Vec2 reads the raw waveform.

## 10. One-minute explanation

Speech is a source shaped by a filter. The vocal folds make harmonics at $f_0$, and the vocal tract makes a smooth envelope with formant peaks. In the log spectrum, the two parts add. MFCCs take the DCT-II of the log-mel values of a frame. Each coefficient is a matching score against one cosine across the bands. The first 13 coefficients keep the smooth envelope (the vowel) and drop the fast ripple (the pitch). They are also much less correlated than the bands. For pitch, autocorrelation matches the frame with shifted copies of itself. The largest peak in the pitch range, here lag 107, gives the period. A parabola through three points refines it to 106.67 samples, so $f_0$ = 150 Hz. Watch for formant peaks at short lags and octave errors at two periods. Whisper skips MFCCs and reads log-mel directly.

## 11. Check questions

```check
{
  "question": "Compute the orthonormal DCT-II of L = [1, 1, 1, 1]. What does the result tell you?",
  "hint": "Each cosine with q ≥ 1 makes whole half cycles across the bands. What is its sum?",
  "answer": "c[0] = 0.5 × (1 + 1 + 1 + 1) = 2. For q = 1, 2, 3 the cosine values add to 0 (for q = 1: 0.9239 + 0.3827 − 0.3827 − 0.9239 = 0). So c = [2, 0, 0, 0]. A flat log-mel curve has only a level (c[0] = √4 × mean = 2 × 1) and no shape."
}
```

```check
{
  "question": "A voice has f0 = 200 Hz, sampled at 16 kHz. At which lag do you expect the autocorrelation peak? At which lag is the octave-error peak? What f0 does the octave error give?",
  "hint": "Period in samples = f_s / f0.",
  "answer": "Period: 16,000 / 200 = 80 samples, so the peak is at lag 80. Two periods: lag 160. A peak picked at 160 gives 16,000 / 160 = 100 Hz, half the true pitch."
}
```

```check
{
  "question": "The three autocorrelation values around a peak are a = 0.60, b = 0.80 (at lag 64), c = 0.70. Where is the interpolated peak, and what is f0 at 16 kHz?",
  "hint": "u* = (a − c) / (2(a − 2b + c)).",
  "answer": "a − c = −0.10. a − 2b + c = 0.60 − 1.60 + 0.70 = −0.30. u* = −0.10 / (2 × −0.30) = 0.1667. Peak at 64.17 samples. f0 = 16,000 / 64.17 = 249.35 Hz."
}
```

```check
{
  "question": "Why do the first 13 MFCCs describe the vowel but not the pitch?",
  "hint": "Think about how fast each part changes from band to band.",
  "answer": "The vowel is the smooth envelope. It changes slowly across the bands, so it matches the slow cosines (small q). The pitch shows as a ripple from harmonic to harmonic. It changes fast across the narrow low bands, so it matches fast cosines (large q). Keeping q = 0 to 12 keeps the envelope and drops the ripple."
}
```

```check
{
  "question": "Your pitch tracker gives 75 Hz in some frames of a voice that is clearly near 150 Hz. Name the error and one fix.",
  "hint": "Compare 75 with 150.",
  "answer": "An octave error: the tracker picked the peak at two periods (lag about 213 instead of 107). Fix 1: prefer the smallest lag whose peak is close to the largest one. Fix 2: use YIN with its threshold on d′. Fix 3: smooth the pitch over neighbor frames, and reject sudden jumps by a factor of 2."
}
```

## 12. Links

- Previous: [L36: Mel and log-mel](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel)
- Next: [L38: The voice-agent pipeline](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map)
- [L7: The matching score](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score)
- [L9: Basis and orthogonality](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality)
- [L28: Fourier series](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series)
- [L32: The convolution theorem](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem)
- [L39: The speech-to-text front end](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end)
- [07 Speech time–frequency](/notes/maths/fft-signal-processing/07-speech-time-frequency)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
