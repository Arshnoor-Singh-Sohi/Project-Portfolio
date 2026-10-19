---
title: "L40: Enhancement"
order: 3
summary: "Noise suppression with a gain for every time-frequency bin: spectral subtraction, the Wiener gain SNR/(1+SNR), musical noise, band gains, why the noisy phase stays, and an overview of frequency-domain echo cancellation."
status: not-started
tags: [enhancement, noise-suppression, wiener, spectral-subtraction, echo-cancellation, stft]
---

## 1. The question this idea answers

The microphone hears your voice plus the fan, the street and the agent's own echo. The STT model and the VAD work worse on this mix. Can we remove the noise before they see it?

[L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) placed two blocks before the VAD: the echo canceller and the noise suppressor. This lesson explains how they work. The main tool is the STFT ([L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram)) and its inverse ([L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft)). The echo canceller also uses the convolution theorem ([L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem)). The lesson before this one, [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end), showed the features that the STT model reads. Enhancement cleans the samples before those features.

## 2. Mental model

> [!analogy] A mixing desk with one fader for every bin
> Picture a mixing desk with 257 faders, one for each frequency bin. A hand moves all faders again for every frame, 62.5 times per second. Where noise is louder than speech, the hand lowers the fader. Where speech is louder, it leaves the fader near the top.
>
> **Where it stops working:** a fader changes the whole bin. When speech and noise share one bin, the fader lowers both of them. Also, a fader changes only the level. It cannot repair the phase of the bin.

## 3. Terms

| Term | Plain meaning |
|---|---|
| enhancement | Processing that makes speech cleaner, for example noise suppression and echo cancellation. |
| noise suppression | Reducing background noise in a signal, with no copy of the noise to compare with. |
| SNR (signal-to-noise ratio) | Signal power divided by noise power. In decibels: $10\log_{10}(P_S/P_D)$. |
| noise power estimate $\lambda[k]$ | The average of $\lvert Y[m,k] \rvert^2$ over frames that hold only noise, for each bin $k$. |
| a priori SNR $\xi$ | The SNR of one bin: speech power divided by noise power in that bin. |
| gain $G[m,k]$ | Here: a real number from 0 to 1 that multiplies one STFT value. A gain in general multiplies a signal ([L3](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude)). |
| spectral mask | The table of all gains $G[m,k]$, one for each time-frequency bin. |
| spectral subtraction | Subtracting the noise power estimate from the power of each bin. |
| Wiener gain | The gain $\xi/(1+\xi)$. It gives the smallest mean squared error for a real gain. |
| oracle mask | A mask computed from the clean speech and the noise separately. It exists only in experiments, as an upper limit. |
| gain floor | The smallest allowed gain, for example 0.1. |
| musical noise | Short, isolated tones that remain after a mask removes most of the noise. They sound like random whistles. |
| band gain | One gain for a group of neighboring bins, as in RNNoise. |
| adaptive filter | A filter that changes its coefficients while it runs, to reduce an error. |
| echo path | The impulse response from the speaker to the microphone, through the room. |
| double talk | Both people talk at the same time: the user and the agent. |

> [!note] Numbers on this page
> Python computed every number on this page. The experiment uses one fixed noise signal (seed 0). A number with "about" is a rounded value.

## 4. The model: noisy bins and real gains

The microphone gives $y[n] = s[n] + d[n]$: speech $s$ plus noise $d$. Take the STFT of each side. The STFT is a sum of products, so it is linear ([L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula), [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram)). So for every frame $m$ and bin $k$:

$$
Y[m,k] = S[m,k] + D[m,k]
$$

A noise suppressor of this kind does three steps:

1. Compute the STFT $Y[m,k]$ of the noisy signal.
2. Multiply every value by a real gain: $\hat S[m,k] = G[m,k]\, Y[m,k]$, with $0 \le G \le 1$.
3. Compute the inverse STFT of $\hat S$ with overlap-add ([L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft)).

The whole method is the choice of $G$. A good $G$ is near 1 where speech dominates and near 0 where noise dominates.

> [!key] A real gain keeps the noisy phase
> $G$ is real and not negative. Multiplying a complex number by a positive real number changes its length, not its angle ([F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)). So $\hat S[m,k]$ has the phase of $Y[m,k]$, the noisy phase. Section 8 shows why this is usually acceptable.

## 5. Spectral subtraction

Spectral subtraction is an early form of this idea. Boll (1979) measured the noise spectrum during non-speech activity and subtracted it from the speech spectrum.

> [!note] Source
> S. F. Boll, "Suppression of acoustic noise in speech using spectral subtraction", 1979. Checked: University of Utah technical report UTEC-CSc-79-102 (collections.lib.utah.edu).

The method in four steps:

1. Find frames with no speech, for example the first 0.25 s before the user talks. The VAD of [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) can mark them.
2. For each bin $k$, average the power over those frames: $\lambda[k] = \text{mean}_m \lvert Y[m,k] \rvert^2$.
3. Subtract: $\lvert \hat S[m,k] \rvert^2 = \max(\lvert Y[m,k] \rvert^2 - \lambda[k],\ 0)$. The max stops a negative power.
4. Write this as a gain on $Y$:

$$
G_{SS}[m,k] = \sqrt{\max\left(1 - \frac{\lambda[k]}{\lvert Y[m,k] \rvert^2},\ 0\right)}
$$

> [!example] One bin by hand
> A bin has $\lvert Y \rvert^2 = 5$ and the noise estimate is $\lambda = 1$.
>
> $G_{SS} = \sqrt{1 - 1/5} = \sqrt{0.8} = 0.894$ (rounded). The output power is $0.894^2 \times 5 = 0.8 \times 5 = 4$, which is $5 - 1$ as step 3 says.

> [!example] What the noise estimate should be
> White noise with standard deviation $\sigma = 0.25$ has power $\sigma^2 = 0.0625$ per sample. A window $w$ scales the expected bin power by $\sum_n w[n]^2$. For a periodic Hann window of 512 samples, $\sum w^2 = 3 \times 512 / 8 = 192$. So the expected noise power per bin is $0.0625 \times 192 = 12.0$. The experiment below measured 12.10 from 14 noise-only frames.

## 6. The Wiener gain

Spectral subtraction is a recipe. Can we instead find the best real gain? Define "best" as the smallest mean squared error between the true $S$ and the estimate $GY$.

Use two assumptions: $S$ and $D$ have mean 0, and they are uncorrelated. Write $P_S = E\lvert S \rvert^2$ and $P_D = E\lvert D \rvert^2$. Here $E$ means the average over many frames.

1. The error power is $J(G) = E\lvert S - GY \rvert^2$.
2. Expand $\lvert a \rvert^2 = a\,\overline{a}$: $J = E\lvert S \rvert^2 - G\,E[S\overline{Y} + \overline{S}Y] + G^2 E\lvert Y \rvert^2$.
3. Use $Y = S + D$. Then $E[S\overline{Y}] = E\lvert S \rvert^2 + E[S\overline{D}] = P_S + 0$. The same holds for its conjugate. So the middle term is $2G P_S$.
4. Also $E\lvert Y \rvert^2 = P_S + P_D$, because the cross terms average to 0.
5. So $J(G) = P_S - 2GP_S + G^2(P_S + P_D)$. This is a parabola in $G$.
6. Set the derivative to zero: $-2P_S + 2G(P_S + P_D) = 0$.
7. Solve:

$$
G_W = \frac{P_S}{P_S + P_D} = \frac{\xi}{1 + \xi}, \qquad \xi = \frac{P_S}{P_D}
$$

The last step divides the top and the bottom by $P_D$. $\xi$ is the a priori SNR of the bin.

| $\xi$ | $\xi$ in dB | $G_W = \xi/(1+\xi)$ |
|---|---|---|
| 0.1 | −10 | 0.091 |
| 1 | 0 | 0.5 |
| 4 | 6.02 | 0.8 |
| 10 | 10 | 0.909 |

> [!example] Wiener against subtraction for one bin
> Take $\xi = 4$. Then $G_W = 4/5 = 0.8$.
>
> If the noisy power equals its average, $\lvert Y \rvert^2 = \lambda(1 + \xi)$, then $G_{SS} = \sqrt{1 - 1/(1+\xi)} = \sqrt{\xi/(1+\xi)} = \sqrt{G_W}$. For $\xi = 4$: $\sqrt{0.8} = 0.894$, the same value as in section 5. So spectral subtraction keeps more of a bin than the Wiener gain. The difference is largest at low SNR.

The true $\xi$ is unknown, because $P_S$ is unknown. A simple estimate is $\hat\xi = \max(\lvert Y \rvert^2/\lambda - 1,\ 0)$. This estimate jumps from frame to frame. Smoothing it over time is a common fix, which this page does not show.

## 7. Musical noise

Examine a bin that holds only noise. Its power $\lvert D \rvert^2$ changes randomly from frame to frame. For Gaussian noise, $\lvert D \rvert^2$ follows an exponential distribution with mean $\lambda$. The chance that one value is above $a$ is $e^{-a/\lambda}$.

Spectral subtraction keeps a noise-only bin when $\lvert D \rvert^2 > \lambda$. The chance is $e^{-1} = 0.368$ (rounded). So about 37 % of the noise-only bins survive, at random places in the time-frequency plane. Each survivor is a short tone at one frequency. Together they sound like random whistles: musical noise.

> [!example] Measured
> In the experiment below, 37.5 % of the bins in the noise-only frames kept a gain above 0. This agrees with $e^{-1}$.

Three common fixes:

1. **A gain floor.** Never go below, for example, $G = 0.1$ (−20 dB). The residual noise stays as a quiet, smooth background instead of isolated tones.
2. **Smoothing** of $\hat\xi$ or $G$ over time and frequency.
3. **Band gains.** One gain for a group of bins, as RNNoise does (section 9).

## 8. The experiment: a noisy tone

Clean signal: 0.25 s of silence, then a 500 Hz tone with amplitude 0.5 for 0.75 s, at $f_s$ = 16,000 Hz. Noise: white Gaussian, $\sigma = 0.25$, seed 0. STFT: periodic Hann, 512 samples (32 ms), hop 256. That gives 257 bins, 31.25 Hz apart, so 500 Hz sits exactly on bin 16. The noise estimate uses the 14 frames that lie fully inside the first 0.25 s.

$$
\text{SNR (dB)} = 10\log_{10}\frac{\sum_n s[n]^2}{\sum_n (\hat s[n] - s[n])^2}
$$

| Method | Output SNR | Change |
|---|---|---|
| noisy input | 1.78 dB | |
| spectral subtraction | 6.51 dB | +4.72 dB |
| Wiener gain, estimated $\hat\xi$ | 8.66 dB | +6.87 dB |
| Wiener gain with floor 0.1 | 8.47 dB | +6.68 dB |
| oracle Wiener mask | 22.64 dB | +20.85 dB |
| clean magnitude with the noisy phase | 24.91 dB | +23.13 dB |

Read the table in four steps:

1. Both simple masks help. The Wiener gain beats subtraction by about 2 dB, as the derivation of section 6 suggests.
2. The floor costs only 0.19 dB of SNR. In return, every noise-only bin keeps at least 0.1, so the isolated tones disappear into a smooth background.
3. The oracle mask uses the clean signal, so it is not a real method. It shows how much a better estimate of $\xi$ could win. RNNoise (section 9) is one neural suppressor that estimates a mask of this kind.
4. The last row keeps the exact clean magnitude but the noisy phase. Even a perfect magnitude stops at 24.91 dB here. This is the price of the noisy phase.

### 8.1 Why the noisy phase is usually acceptable

In bin 16 (the tone), the speech is much stronger than the noise: the median local SNR is 27.3 dB. There, the noisy phase differs from the clean phase by only 1.93° on average. In bin 100, which holds only noise, the phase error is 1.53 radians (88°). But the mask sets that bin close to 0, so its wrong phase barely matters.

> [!key] Where the phase matters, it is good. Where it is bad, the gain hides it.
> High-SNR bins have an accurate noisy phase. Low-SNR bins get a small gain. So a mask method estimates only the gain and keeps the noisy phase. Methods that also correct the phase exist, but they need more than a real gain.

## 9. Band gains: RNNoise

RNNoise is a real-time noise suppressor by Jean-Marc Valin. It combines the STFT method of this page with a small recurrent neural network.

| Property | Value in the paper |
|---|---|
| Sample rate | 48 kHz ("full-band") |
| Frames | 20 ms windows with 50 % overlap (10 ms offset) |
| Window | the same Vorbis window for analysis and synthesis |
| Bands | 22 bands that approximate the Bark scale, as in the Opus codec |
| Network output | one gain from 0 to 1 for each band, "the square root of the ideal ratio mask" |
| Gain per bin | interpolated from the band gains with the triangular band weights |
| Extra step | a pitch comb filter that removes noise between the harmonics of the voice |
| Inputs | 42 features |
| Cost | about 1.3 % of one x86 core for a non-vectorized C version |

> [!note] Source
> J.-M. Valin, "A Hybrid DSP/Deep Learning Approach to Real-Time Full-Band Speech Enhancement", arXiv 1709.08243 (version 3, 2018). Read on 2026-10-19.

Why bands instead of bins? A 20 ms window at 48 kHz holds 960 samples. A real FFT of that size gives 481 bins. A network that predicts 22 numbers is much smaller than one that predicts 481. The bands also smooth the gain over frequency. That makes isolated single-bin survivors, the cause of musical noise, less likely. The bands play the same role as the mel bands of [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel): few bands, narrow at low frequencies and wide at high frequencies.

The paper calls the gain "the square root of the ideal ratio mask". The ideal ratio mask is a power ratio, like the oracle Wiener mask of section 8. Its square root changes a power ratio into a gain on the amplitude.

## 10. Echo cancellation in the frequency domain (overview)

[L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) modeled the echo as a convolution: $m[n] = u[n] + (h * p)[n] + \text{noise}$. The agent knows $p[n]$, the signal it plays. An adaptive filter learns $\hat h$ and subtracts $\hat h * p$. It changes $\hat h$ a little after each frame, in the direction that makes the remaining error smaller.

The filter must be long. The Speex documentation suggests a filter length of 100 to 500 ms. At 16 kHz, 250 ms is 4,000 coefficients.

> [!example] The cost of a long filter
> 1. **Direct convolution.** Each output sample needs 4,000 multiplications. At 16,000 samples per second, that is 4,000 × 16,000 = 64,000,000 multiplications per second.
> 2. **In the frequency domain.** The convolution theorem changes convolution into one product per bin ([L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem)). A Speex-style canceller with frames of 320 samples (20 ms) uses an FFT size of 2 × 320 = 640 and $\lceil 4000/320 \rceil = 13$ blocks of the filter.
> 3. **Rough count for the filtering only.** Two FFTs of 640 points cost about $2 \times 640 \log_2 640 \approx 11{,}900$ operations. The 13 blocks need $13 \times 321 = 4{,}173$ complex products. That is about 16,100 operations per 320 samples, or about 50 per sample instead of 4,000.

Why 13 blocks and not one big FFT? One block of 4,000 samples would make the canceller wait 250 ms for each block. With 320-sample frames, it waits 20 ms ([L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency)). This split of a long filter into short blocks is the "multidelay block frequency domain" (MDF) idea.

> [!note] Source
> speexdsp on GitHub (xiph/speexdsp). `libspeexdsp/mdf.c` says that the canceller "is based on the MDF algorithm" of Soo and Pang (IEEE Trans. ASSP, 1990). The code sets the FFT size to 2 × `frame_size` and the block count to `(filter_length+frame_size-1)/frame_size`. `include/speex/speex_echo.h` suggests 10–20 ms frames and 100–500 ms filters. Note: $640 = 2^7 \times 5$, not a power of 2 ([L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts)).

**Double talk** is the hard case. When the user and the agent talk at the same time, the user's voice looks like a large error. A careless filter then changes $\hat h$ to cancel the user. The Speex comments say that it has no explicit double-talk detector. Instead, it varies its learning rate continuously, with the method of Valin (2007).

## 11. Graphs

The Wiener gain (gold) and the spectral-subtraction gain (ink) against the a priori SNR in dB. The ink curve is the square root of the gold curve, so it stays higher.

```plot
{
  "title": "Wiener gain (gold) and spectral-subtraction gain (ink) against SNR in dB",
  "xAxis": { "label": "a priori SNR (dB)", "domain": [-20, 20] },
  "yAxis": { "label": "gain G", "domain": [0, 1.05] },
  "disableZoom": true,
  "data": [
    { "fn": "exp(0.23026*x)/(1+exp(0.23026*x))", "color": "#B8860B" },
    { "fn": "sqrt(exp(0.23026*x)/(1+exp(0.23026*x)))", "color": "#100D12" }
  ]
}
```

The chance that a noise-only bin is above $a$ times its mean power (red). At $a = 1$ the chance is $e^{-1} = 0.368$: the share of bins that spectral subtraction keeps.

```plot
{
  "title": "Chance that noise power exceeds a times its mean: exp(-a) (red), with the point a = 1 (ink)",
  "xAxis": { "label": "a", "domain": [0, 4] },
  "yAxis": { "label": "chance", "domain": [0, 1.05] },
  "disableZoom": true,
  "data": [
    { "fn": "exp(-x)", "color": "#C81D25" },
    { "points": [[1, 0.368]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true }
  ]
}
```

One frame (frame 28, inside the tone) from 0 to 1,250 Hz. Blue: the noisy input. Ink: after the Wiener gain with floor 0.1. The tone at 500 Hz keeps its level. The noise bins drop by up to 20 dB.

```plot
{
  "title": "One frame in dB: noisy input (blue) and after the Wiener mask (ink)",
  "xAxis": { "label": "frequency (Hz)", "domain": [0, 1250] },
  "yAxis": { "label": "magnitude (dB)", "domain": [-25, 40] },
  "disableZoom": true,
  "data": [
    { "points": [[0.0, 11.6], [31.25, 12.6], [62.5, 5.2], [93.75, 11.5], [125.0, 13.3], [156.25, 19.1], [187.5, 12.5], [218.75, 14.9], [250.0, 16.3], [281.25, 12.4], [312.5, 7.7], [343.75, 7.8], [375.0, 16.7], [406.25, 10.9], [437.5, -0.9], [468.75, 30.2], [500.0, 36.0], [531.25, 30.4], [562.5, 14.7], [593.75, 3.9], [625.0, 7.8], [656.25, 7.5], [687.5, 9.4], [718.75, 12.2], [750.0, 14.4], [781.25, 14.3], [812.5, 12.3], [843.75, 8.7], [875.0, 12.2], [906.25, 13.0], [937.5, 15.2], [968.75, 12.6], [1000.0, 13.9], [1031.25, 15.0], [1062.5, 10.5], [1093.75, -1.6], [1125.0, 6.4], [1156.25, 2.0], [1187.5, 9.8], [1218.75, 7.8], [1250.0, 10.2]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0.0, -8.4], [31.25, 6.6], [62.5, -14.8], [93.75, -1.7], [125.0, 9.3], [156.25, 17.7], [187.5, 5.4], [218.75, 12.6], [250.0, 12.8], [281.25, -2.6], [312.5, -12.3], [343.75, -12.2], [375.0, 14.4], [406.25, -9.1], [437.5, -20.9], [468.75, 30.1], [500.0, 36.0], [531.25, 30.3], [562.5, 12.8], [593.75, -16.1], [625.0, -12.2], [656.25, -12.5], [687.5, -10.6], [718.75, 1.6], [750.0, 8.3], [781.25, 7.5], [812.5, 3.6], [843.75, -11.3], [875.0, -2.3], [906.25, -7.0], [937.5, 9.4], [968.75, 0.2], [1000.0, 3.1], [1031.25, 9.7], [1062.5, -7.6], [1093.75, -21.6], [1125.0, -13.6], [1156.25, -18.0], [1187.5, -10.2], [1218.75, -12.2], [1250.0, 0.6]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true }
  ]
}
```

The gains of the same frame (gold dots). Bins 15 to 17 (469 to 531 Hz) get gains above 0.98. Some noise bins still get gains near 0.8, because their noise power is high in this frame by chance.

```plot
{
  "title": "Wiener gain with floor 0.1 for each bin of frame 28 (gold)",
  "xAxis": { "label": "frequency (Hz)", "domain": [0, 1250] },
  "yAxis": { "label": "gain G", "domain": [0, 1.05] },
  "disableZoom": true,
  "data": [
    { "points": [[0.0, 0.1], [31.25, 0.503], [62.5, 0.1], [93.75, 0.219], [125.0, 0.635], [156.25, 0.854], [187.5, 0.443], [218.75, 0.769], [250.0, 0.671], [281.25, 0.179], [312.5, 0.1], [343.75, 0.1], [375.0, 0.775], [406.25, 0.1], [437.5, 0.1], [468.75, 0.99], [500.0, 0.996], [531.25, 0.985], [562.5, 0.8], [593.75, 0.1], [625.0, 0.1], [656.25, 0.1], [687.5, 0.1], [718.75, 0.295], [750.0, 0.496], [781.25, 0.456], [812.5, 0.368], [843.75, 0.1], [875.0, 0.189], [906.25, 0.1], [937.5, 0.516], [968.75, 0.241], [1000.0, 0.29], [1031.25, 0.544], [1062.5, 0.124], [1093.75, 0.1], [1125.0, 0.1], [1156.25, 0.1], [1187.5, 0.1], [1218.75, 0.1], [1250.0, 0.333]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0.0, 0.1], [31.25, 0.503], [62.5, 0.1], [93.75, 0.219], [125.0, 0.635], [156.25, 0.854], [187.5, 0.443], [218.75, 0.769], [250.0, 0.671], [281.25, 0.179], [312.5, 0.1], [343.75, 0.1], [375.0, 0.775], [406.25, 0.1], [437.5, 0.1], [468.75, 0.99], [500.0, 0.996], [531.25, 0.985], [562.5, 0.8], [593.75, 0.1], [625.0, 0.1], [656.25, 0.1], [687.5, 0.1], [718.75, 0.295], [750.0, 0.496], [781.25, 0.456], [812.5, 0.368], [843.75, 0.1], [875.0, 0.189], [906.25, 0.1], [937.5, 0.516], [968.75, 0.241], [1000.0, 0.29], [1031.25, 0.544], [1062.5, 0.124], [1093.75, 0.1], [1125.0, 0.1], [1156.25, 0.1], [1187.5, 0.1], [1218.75, 0.1], [1250.0, 0.333]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true }
  ]
}
```

## 12. Code

Repeat the experiment of section 8 with your own code. Write these functions:

1. `stft(x, L, H)`: pad $L$ zeros on both sides, cut frames with hop $H$, multiply by the periodic Hann window, and take the real FFT. Return an array of shape (frames, $L/2+1$).
2. `istft(X, L, H, length)`: inverse real FFT of each frame, multiply by the window, overlap-add, divide by the overlap-add of $w^2$, and remove the padding ([L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft)).
3. `ss_gain(P, lam)` and `wiener_gain(P, lam, floor=0.0)`: the gains of sections 5 and 6, with $\hat\xi = \max(P/\lambda - 1, 0)$.
4. `snr_db(ref, est)`: the formula of section 8.

Build the signal exactly as section 8 says. Use `0.25 * np.random.default_rng(0).standard_normal(16000)` for the noise. Use $L = 512$, $H = 256$, and the frames that lie fully inside the first 4,000 samples for $\lambda$.

Acceptance tests:

- Round trip: `np.max(np.abs(istft(stft(y, 512, 256), 512, 256, len(y)) - y)) < 1e-10`.
- The mean of $\lambda[k]$ over all bins is within 5 % of 12.0.
- Spectral subtraction improves the SNR by at least 4 dB. The Wiener gain improves it by at least 6 dB, with floor 0 and with floor 0.1.
- In the noise-only frames, the share of bins with `ss_gain > 0` lies between 0.30 and 0.45.
- The phase test: where $G > 0$, `np.allclose(np.angle(G * Y), np.angle(Y))` is True.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/08-voice-agents/l40-enhancement)

```check
{
  "question": "Your output SNR is about −35 dB, far worse than the input. What is the likely cause?",
  "hint": "Test the round trip with G = 1 first.",
  "answer": "The STFT did not pad the signal. Then the first and the last samples are not covered by enough frames, and the overlap-add cannot rebuild them. The output has the wrong values (often zeros) at the edges. Pad L samples on both sides before framing, and remove them after the inverse."
}
```

```check
{
  "question": "Stuck on wiener_gain?",
  "hint": "Work on whole arrays. P has shape (frames, bins). lam has shape (bins,).",
  "answer": "xi = max(P / lam − 1, 0), with broadcasting over the frames. G = xi / (1 + xi). Then G = max(G, floor). Every step works element by element on the arrays."
}
```

## 13. Common mistakes

1. **A complex or negative gain.** A noise suppressor of this kind uses a real gain from 0 to 1. A negative gain flips the phase by 180°.
2. **Subtracting magnitudes and powers in a mixed way.** Pick one: subtract powers and take a square root for the gain, as in section 5.
3. **A noise estimate from frames with speech.** Then $\lambda$ is too high, and the method removes speech.
4. **"Musical noise means the gain is too low."** Musical noise comes from random noise-only bins that survive the mask. A floor or smoothing reduces it.
5. **"The oracle mask is a method."** It needs the clean signal. It shows the upper limit of mask methods.
6. **"The echo canceller is a noise suppressor with a better model."** It has a reference signal and subtracts an estimate of a known signal. A noise suppressor has no reference.
7. **One huge FFT block for a long echo filter.** It adds a delay of the whole filter length. Split the filter into short blocks.

## 14. One-minute explanation

A noise suppressor works on the STFT. Because the STFT is linear, every bin of the noisy signal is speech plus noise. We multiply every bin by a real gain from 0 to 1 and then take the inverse STFT. Spectral subtraction estimates the noise power in each bin from frames without speech and subtracts it. The Wiener gain, SNR/(1 + SNR), is the real gain with the smallest mean squared error. Random noise-only bins that survive the mask sound like whistles. This is musical noise, so real systems add a gain floor, smoothing or band gains like RNNoise. The gain is real, so the output keeps the noisy phase. That is acceptable, because high-SNR bins have an accurate phase and low-SNR bins get a small gain. An echo canceller instead knows the played signal. It learns the room's impulse response with an adaptive filter, in short FFT blocks to keep the delay small.

## 15. Check questions

```check
{
  "question": "Why does a mask method keep the noisy phase?",
  "hint": "What does a positive real factor do to a complex number?",
  "answer": "The gain G is real and not negative. G·Y has length G·|Y| and the same angle as Y. So the output phase is the phase of the noisy bin Y."
}
```

```check
{
  "question": "A bin has a priori SNR ξ = 3. Compute the Wiener gain and the spectral-subtraction gain, assuming |Y|² = λ(1 + ξ). Which one removes more?",
  "hint": "G_W = ξ/(1 + ξ). G_SS = √(1 − λ/|Y|²).",
  "answer": "G_W = 3/4 = 0.75. |Y|² = 4λ, so G_SS = √(1 − 1/4) = √0.75 = 0.866 (rounded). The Wiener gain is smaller, so it removes more. G_SS = √G_W in general under this assumption."
}
```

```check
{
  "question": "Derive the Wiener gain. Start from J(G) = E|S − GY|² with Y = S + D, and S, D uncorrelated with mean 0.",
  "hint": "Expand, use E[S·conj(D)] = 0, and set dJ/dG = 0.",
  "answer": "J = E|S|² − G·E[S·conj(Y) + conj(S)·Y] + G²·E|Y|². With Y = S + D: E[S·conj(Y)] = P_S, so the middle term is 2G·P_S. E|Y|² = P_S + P_D. So J = P_S − 2G·P_S + G²(P_S + P_D). dJ/dG = −2P_S + 2G(P_S + P_D) = 0 gives G = P_S/(P_S + P_D) = ξ/(1 + ξ)."
}
```

```check
{
  "question": "Spectral subtraction runs on pure Gaussian noise with an exact noise estimate λ. About what share of the bins keeps a gain above 0? What does this sound like?",
  "hint": "A bin survives when its power is above λ. Use the exponential distribution.",
  "answer": "P(|D|² > λ) = e^(−λ/λ) = e^(−1) = 0.368 (rounded). So about 37 % of the bins survive, at random times and frequencies. Each survivor is a short tone, so the residual sounds like random whistles: musical noise."
}
```

```check
{
  "question": "An echo canceller at 16 kHz needs a 400 ms filter and uses 10 ms frames, Speex-style. How many coefficients does the filter have? What FFT size and how many blocks? Is the FFT size a power of 2?",
  "hint": "Coefficients = filter time × sample rate. FFT size = 2 × frame size. Blocks = ceiling of filter length / frame size.",
  "answer": "Coefficients: 0.4 × 16,000 = 6,400. Frame: 0.01 × 16,000 = 160 samples. FFT size: 2 × 160 = 320. Blocks: ⌈6,400 / 160⌉ = 40. 320 = 2⁶ × 5, so it is not a power of 2. The FFT library must handle a mixed radix (L22)."
}
```

## 16. Links

- Previous: [L39: The speech-to-text front end](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end)
- Next: [L41: The text-to-speech back end](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end)
- [L34: The STFT and the spectrogram](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram)
- [L35: The inverse STFT](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft)
- [L32: The convolution theorem](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem)
- [L36: Mel and log-mel](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel)
- [L42: Latency](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency)
- [08 Voice agents](/notes/maths/fft-signal-processing/08-voice-agents)
