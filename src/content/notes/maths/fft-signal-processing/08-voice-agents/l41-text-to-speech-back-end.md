---
title: "L41: The text-to-speech back end"
order: 4
summary: "Why changing a mel spectrogram into a waveform needs a phase, how Griffin-Lim finds one step by step, and where neural vocoders and neural audio codec tokens fit."
status: not-started
tags: [tts, vocoder, griffin-lim, phase, hifi-gan, codec, rvq]
---

## 1. The question this idea answers

The agent has the text of its answer. Now it must speak. Many TTS systems first predict a mel spectrogram, a table of band energies over time ([L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel)). But the inverse STFT of [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft) needs complex STFT values: a magnitude and a phase for every bin. The mel spectrogram has neither the phase nor all the bins. How does a system rebuild the samples?

[L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) kept the noisy phase, because it had one. Here no phase exists at all. This is the last FFT block of the pipeline in [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map).

## 2. Mental model

> [!analogy] Sheet music and a musician
> A mel spectrogram is like sheet music. It says which notes sound, how loud, and when. It does not say the exact air pressure at each instant. A musician (the vocoder) must play the notes. Griffin-Lim is a musician who plays a guess, records it, compares the recording with the sheet, corrects the loudness of every note, and plays again.
>
> **Where it stops working:** a real musician knows how a voice or a violin sounds. Griffin-Lim knows nothing about voices. It only makes the frames agree with each other. So its output can sound rough or "phasey". A neural vocoder learns from real voices what the missing details usually are.

## 3. Terms

| Term | Plain meaning |
|---|---|
| acoustic model | The part of a TTS system that changes text into a mel spectrogram. |
| vocoder | The part of a TTS system that changes a mel spectrogram (or other features) into samples. |
| neural vocoder | A vocoder that is a trained neural network, for example HiFi-GAN. |
| phase retrieval | Finding phases that fit a given set of magnitudes. |
| consistent STFT | A table of complex values that is the STFT of some real signal ([L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft)). Overlapping frames make most tables inconsistent. |
| Griffin-Lim algorithm | An iteration that alternates the inverse STFT and the STFT, and restores the target magnitude after every step. |
| spectral convergence | $\lVert\, \lvert Y \rvert - A \,\rVert / \lVert A \rVert$: how far the STFT magnitude of a result is from the target magnitude $A$. |
| pseudo-inverse | The matrix that gives the least-squares solution of a system with no exact solution. NumPy: `np.linalg.pinv`. |
| GAN (generative adversarial network) | Two networks trained against each other: a generator makes samples and a discriminator tries to tell them from real ones. |
| neural audio codec | A network pair that compresses audio into a few discrete numbers per frame (an encoder) and rebuilds the audio (a decoder). |
| codebook | A list of vectors. A quantizer replaces a vector by the index of the nearest codebook entry. |
| residual vector quantization (RVQ) | Quantization in stages. Each stage codes the error that the stages before it left. |
| audio token | One codebook index from a neural audio codec. |
| bitrate | The number of bits per second that a representation needs. |

> [!note] Numbers on this page
> Python computed every number on this page. The Griffin-Lim demo uses a fixed signal and the random seed 0. "About" marks a rounded value.

## 4. From text to samples

A common TTS design has two stages:

1. **Acoustic model:** text → mel spectrogram (frames × mel bands).
2. **Vocoder:** mel spectrogram → samples.

Two published systems show the design:

| System | Stage 2 | STFT settings | Source |
|---|---|---|---|
| Tacotron (2017) | Griffin-Lim on a predicted spectrogram | Hann window, 50 ms frames, 12.5 ms hop, 2048-point FFT, 24 kHz | arXiv 1703.10135 |
| Tacotron 2 (2017) | a modified WaveNet vocoder on mel spectrograms | not shown here | arXiv 1712.05884 |

> [!note] Sources
> - Wang et al., "Tacotron: Towards End-to-End Speech Synthesis", arXiv 1703.10135. It says: "We use the Griffin-Lim algorithm (Griffin & Lim, 1984) to synthesize waveform from the predicted spectrogram."
> - Shen et al., "Natural TTS Synthesis by Conditioning WaveNet on Mel Spectrogram Predictions", arXiv 1712.05884. Its abstract describes a network that "maps character embeddings to mel-scale spectrograms". A "modified WaveNet model acting as a vocoder" follows it.
> - Both read on 2026-10-19.

> [!example] Tacotron's frame numbers
> At 24,000 samples per second, a 50 ms frame holds 0.050 × 24,000 = 1,200 samples. The hop is 0.0125 × 24,000 = 300 samples. The 2048-point FFT pads each 1,200-sample frame with 848 zeros. The bins are then 24,000 / 2,048 = 11.72 Hz apart (rounded).

## 5. What the mel spectrogram loses

Count the real numbers in one frame of 512 samples.

1. **The samples:** 512 real numbers.
2. **The real FFT:** 257 complex values. Bin 0 and bin 256 are real for a real signal ([L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)). So the FFT holds $257 + 255 = 512$ real numbers: 257 magnitudes and 255 phases. The FFT keeps all the information.
3. **The magnitude:** 257 numbers. The 255 phases are gone.
4. **The mel spectrogram:** 80 numbers. The mel matrix maps 257 numbers to 80. Its rank is 80, so 257 − 80 = 177 directions are gone.

So a vocoder must create 255 phases and fill 177 missing directions in every frame.

### 5.1 How much does the mel step lose?

A simple first step toward the magnitude is the pseudo-inverse of the mel matrix $M$ (80 × 257). It gives the magnitude $\hat A$ whose mel values match with the least squared error. Set negative values to 0, because a magnitude cannot be negative. The error depends on the signal:

| Signal (16 kHz, $L$ = 512) | Relative error of $\hat A$ |
|---|---|
| 300 Hz tone | 0.012 |
| harmonic tone, 180 → 240 Hz | 0.067 |
| white noise | 0.352 |
| 3,000 Hz tone | 0.712 |

> [!example] Why the 3,000 Hz tone fails
> Near 3,000 Hz, one mel band spans about 7 FFT bins (2,836 to 3,063 Hz is 226 Hz, and 226 / 31.25 ≈ 7.2). The band stores one number for all 7 bins. So the pseudo-inverse spreads the tone over the band. The true peak of 64 at 3,000 Hz becomes a broad hill with a peak of 25.01 at 2,969 Hz. At 300 Hz the bands are narrow, so the same step works well.

> [!key] Two losses, two fixes
> The mel step loses detail across frequency. The magnitude step loses the phase. A neural vocoder learns to fix both. Griffin-Lim fixes only the phase, so it needs a good magnitude first.

## 6. Why a random phase does not work

Take the true magnitude $A[m,k]$, give every bin a random phase, and compute the inverse STFT. The frames overlap (here by 75 %). Each output sample is a weighted average of several frames. With random phases, those frames disagree. The average cancels parts of them.

So the result $x$ does not have the magnitude $A$. Compute the STFT of $x$ again. In the demo below, its magnitude differs from $A$ by a spectral convergence of 0.6711. A table of complex values with overlapping frames is usually not the STFT of any signal. It is **inconsistent**.

## 7. Griffin-Lim step by step

Griffin and Lim (1984) proposed this iteration. Its abstract states that each iteration decreases the squared error between the STFT magnitude of the estimate and the target magnitude.

> [!note] Source
> D. Griffin and J. Lim, "Signal estimation from modified short-time Fourier transform", IEEE Transactions on Acoustics, Speech, and Signal Processing, vol. 32, no. 2, pp. 236–243, 1984 (IEEE Xplore abstract, and the Aalto speech-processing book page on Griffin-Lim).

Input: a target magnitude $A[m,k]$, a window, a hop. Output: samples $x[n]$.

1. **Start.** Choose phases $\varphi^{0}[m,k]$: random, or all zero.
2. **Combine.** Make the complex table $X^{i} = A \cdot e^{\,i\varphi^{i}}$. It has the right magnitude and probably wrong phases.
3. **Inverse STFT.** Compute $x^{i} = \text{ISTFT}(X^{i})$ with the weighted overlap-add of [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft). This is the signal whose STFT is closest to $X^{i}$ in the least-squares sense.
4. **STFT.** Compute $Y^{i} = \text{STFT}(x^{i})$. This table is consistent, because it comes from a real signal. Its magnitude is not exactly $A$.
5. **Keep the phase, drop the magnitude.** Set $\varphi^{i+1} = \angle Y^{i}$.
6. **Measure.** Spectral convergence: $SC^{i} = \lVert\, \lvert Y^{i} \rvert - A \,\rVert_F \,/\, \lVert A \rVert_F$. Here $\lVert \cdot \rVert_F$ is the square root of the sum of all squared values.
7. **Repeat** from step 2 until $SC$ stops falling, or for a fixed number of steps.

The algorithm moves between two sets. Step 2 forces the right magnitude. Steps 3 and 4 force consistency. Each round trip moves the estimate closer to a table that satisfies both.

### 7.1 The demo and its convergence numbers

Signal: $f_s$ = 16,000 Hz, 0.5 s. The fundamental glides from 180 to 240 Hz, with harmonics 1 to 5 and amplitudes 0.3 × (1, 1/2, 1/3, 1/4, 1/5). STFT: periodic Hann, 512 samples, hop 128 (75 % overlap): 67 frames × 257 bins. Target: the true magnitude $A = \lvert \text{STFT}(x) \rvert$.

| Iteration | $SC$, random start (seed 0) | $SC$ in dB | $SC$, zero-phase start | Waveform SNR against the original |
|---|---|---|---|---|
| 0 | 0.6711 | −3.5 | 0.9176 | −1.36 dB |
| 1 | 0.4080 | −7.8 | 0.6790 | −3.44 dB |
| 2 | 0.3479 | −9.2 | 0.4865 | −3.70 dB |
| 5 | 0.2805 | −11.0 | 0.3315 | −3.99 dB |
| 10 | 0.2383 | −12.5 | 0.2763 | −4.23 dB |
| 20 | 0.1680 | −15.5 | 0.1971 | −4.62 dB |
| 50 | 0.0935 | −20.6 | 0.1435 | −4.97 dB |
| 100 | 0.0715 | −22.9 | 0.0901 | −5.08 dB |
| 200 | 0.0525 | −25.6 | 0.0569 | −5.15 dB |

The $SC$ in dB is $20\log_{10} SC$. For example, $20\log_{10} 0.0935 = -20.6$.

Read the table in four steps:

1. **It converges, but slowly.** The first step gives the largest gain. After that, each halving of $SC$ costs many more steps. In this run, $SC$ never increased between two steps.
2. **The start matters.** Other random seeds gave $SC$ = 0.1254, 0.1114 and 0.0783 after 100 steps. The iteration stops in different local minima.
3. **The waveform does not match.** The waveform SNR is negative even when $SC$ is small. For example, $-x$ has exactly the same magnitude as $x$ ($SC$ = 0). But its waveform SNR is $10\log_{10}\left(\sum x^2 / \sum (2x)^2\right) = 10\log_{10}(1/4) = -6.02$ dB. The ear does not hear a global sign change. So measure $SC$, not the waveform SNR.
4. **The true phase is perfect.** With the true phases, the inverse STFT rebuilds $x$ with an SNR of 314 dB, near the floating-point limit.

> [!note] Tacotron's practice
> The Tacotron paper reports that Griffin-Lim "converges after 50 iterations (in fact, about 30 iterations seems to be enough)". It also raised the predicted magnitudes "by a power of 1.2 before feeding to Griffin-Lim", which "reduces artifacts".

### 7.2 Mel → magnitude → Griffin-Lim

Now start from the mel spectrogram, as a TTS system must. Use the pseudo-inverse magnitude $\hat A$ of section 5.1 (error 0.0668) as the target. After 100 Griffin-Lim steps, the result has $SC$ = 0.0831 against the true magnitude. The mel step and the phase step both add error.

### 7.3 The cost

One iteration needs one inverse STFT and one STFT: 2 × 67 = 134 FFTs of 512 points. 100 iterations need 13,400 FFTs for 0.5 s of audio. One 512-point FFT costs about $512 \log_2 512 = 4{,}608$ operations ([L21](/notes/maths/fft-signal-processing/04-fft/l21-why-it-is-fast)). So 100 iterations cost about 62 million operations. In this form, the iteration needs all frames of the utterance before it ends, which adds delay ([L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency)).

## 8. Neural vocoders

A neural vocoder learns the map from mel frames to samples. HiFi-GAN is one published example.

| Property | Value | Source |
|---|---|---|
| Paper | Kong, Kim and Bae, "HiFi-GAN: Generative Adversarial Networks for Efficient and High Fidelity Speech Synthesis", 2020 | arXiv 2010.05646 |
| Speed | "22.05 kHz high-fidelity audio 167.9 times faster than real-time on a single V100 GPU". A small version is "13.4 times faster than real-time on CPU". | abstract |
| Input | 80 mel bands, `n_fft` 1024, hop 256, window 1024, 22,050 Hz | `config_v1.json` in the jik876/hifi-gan repository |
| Generator | transposed 1-D convolutions with upsample rates 8, 8, 2, 2 | `models.py`, `config_v1.json` |
| Discriminators | a multi-period discriminator and a multi-scale discriminator | `models.py` |
| Training loss | includes an L1 distance between the mel spectrograms of real and generated audio, with weight 45 | `train.py` |

> [!example] One mel frame becomes 256 samples
> The upsample rates multiply: $8 \times 8 \times 2 \times 2 = 256$. This equals the hop of 256 samples. So each mel frame becomes exactly 256 samples: $256 / 22{,}050 = 11.61$ ms of audio (rounded).
>
> "167.9 times faster than real time" means 1 s of audio takes $1/167.9 = 0.006$ s on that GPU (rounded).

Where is the FFT? The generator uses no FFT. It makes samples with convolutions. The FFT appears in training: the mel loss computes the STFT and the mel spectrogram of the generated audio and compares them with the target. The network learns phases that make realistic waveforms, not phases from a formula.

## 9. Neural audio codec tokens

A neural audio codec has an encoder that changes audio frames into vectors. A quantizer then changes each vector into a few codebook indices: the audio tokens. A decoder rebuilds the samples from the tokens. Speech-to-speech models such as Moshi ([L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map)) read and write these tokens instead of text.

### 9.1 Residual vector quantization by hand

> [!example] Two stages, two bits each
> Quantize the vector $v = [0.9, -0.4]$.
>
> 1. **Stage 1** codebook: $[1,0], [0,1], [-1,0], [0,-1]$. The nearest entry is $[1, 0]$ (index 0). The residual is $v - [1,0] = [-0.1, -0.4]$. Its length is $\sqrt{0.01 + 0.16} = 0.4123$.
> 2. **Stage 2** codebook: the same four vectors times 0.25. The residual $[-0.1, -0.4]$ is nearest to $[0, -0.25]$ (index 3). The new residual is $[-0.1, -0.15]$. Its length is $\sqrt{0.01 + 0.0225} = 0.1803$.
>
> The tokens are (0, 3). The decoder adds $[1, 0] + [0, -0.25] = [1, -0.25]$. Each stage costs 2 bits (4 entries), so the vector costs 4 bits. More stages give a smaller error and a higher bitrate.

### 9.2 Three codecs

| Codec | Sample rate | Token frames per second | Quantizer | Bitrate | Source |
|---|---|---|---|---|---|
| SoundStream (2021) | 24 kHz | not used here | residual vector quantizer | 3 to 18 kbps | arXiv 2107.03312 |
| EnCodec (2022) | 24 kHz (mono model) | 75 | RVQ, 1024 entries per codebook | 1.5, 3, 6, 12 or 24 kbps | arXiv 2210.13438, facebookresearch/encodec |
| Mimi (2024) | 24 kHz | 12.5 | 8 quantizers of 2048 entries | 1.1 kbps | arXiv 2410.00037, kyutai-labs/moshi |

> [!example] Check the bitrates
> 1. **EnCodec.** The encoder strides are $8 \times 5 \times 4 \times 2 = 320$ samples, so 24,000 / 320 = 75 frames per second. A codebook of 1,024 entries costs $\log_2 1024 = 10$ bits. The README says that 6 kbps uses 8 codebooks: $75 \times 8 \times 10 = 6{,}000$ bits per second.
> 2. **Mimi.** A codebook of 2,048 entries costs 11 bits. Eight of them per frame cost 88 bits. At 12.5 frames per second: $12.5 \times 88 = 1{,}100$ bits per second. One frame covers 24,000 / 12.5 = 1,920 samples = 80 ms.
> 3. **Against raw audio.** 24 kHz, 16-bit samples need 384,000 bits per second. Mimi needs $384{,}000 / 1{,}100 = 349$ times fewer (rounded).

> [!note] Sources
> - Zeghidour et al., "SoundStream: An End-to-End Neural Audio Codec", arXiv 2107.03312.
> - Défossez et al., "High Fidelity Neural Audio Compression", arXiv 2210.13438, plus `encodec/model.py`, `encodec/modules/seanet.py` and the README of facebookresearch/encodec.
> - Défossez et al., "Moshi", arXiv 2410.00037. It says: "We use Q = 8 quantizers, each with a codebook size of NA = 2048". It also gives "12.5 frames per second" and "1.1kbps". It says that "Mimi is causal and can be used in a streaming fashion".
> - All read on 2026-10-19.

Where is the FFT? The codec encoders and decoders are neural networks that read and write samples. The EnCodec abstract mentions training with "a single multiscale spectrogram adversary", so spectrograms, and so the FFT, appear in training.

## 10. Graphs

Griffin-Lim convergence in dB, from the table of section 7.1. Gold: random start. Ink: zero-phase start.

```plot
{
  "title": "Spectral convergence in dB over iterations: random start (gold), zero-phase start (ink)",
  "xAxis": { "label": "iteration", "domain": [-5, 205] },
  "yAxis": { "label": "20 log10 SC (dB)", "domain": [-28, 0] },
  "disableZoom": true,
  "data": [
    { "points": [[0, -3.5], [1, -7.8], [2, -9.2], [5, -11.0], [10, -12.5], [20, -15.5], [50, -20.6], [100, -22.9], [200, -25.6]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0, -3.5], [1, -7.8], [2, -9.2], [5, -11.0], [10, -12.5], [20, -15.5], [50, -20.6], [100, -22.9], [200, -25.6]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true },
    { "points": [[0, -0.75], [1, -3.4], [2, -6.3], [5, -9.6], [10, -11.2], [20, -14.1], [50, -16.9], [100, -20.9], [200, -24.9]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[0, -0.75], [1, -3.4], [2, -6.3], [5, -9.6], [10, -11.2], [20, -14.1], [50, -16.9], [100, -20.9], [200, -24.9]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true }
  ]
}
```

A 3,000 Hz tone in one frame. Blue: the true magnitude. Red: the magnitude rebuilt from 80 mel bands with the pseudo-inverse. The mel band spreads the tone over about 9 bins.

```plot
{
  "title": "True magnitude (blue) and magnitude rebuilt from the mel spectrogram (red), 3,000 Hz tone",
  "xAxis": { "label": "frequency (Hz)", "domain": [2600, 3520] },
  "yAxis": { "label": "magnitude", "domain": [-3, 70] },
  "disableZoom": true,
  "data": [
    { "points": [[2625.0, 0.0], [2656.2, 0.0], [2687.5, 0.0], [2718.8, 0.0], [2750.0, 0.0], [2781.2, 0.0], [2812.5, 0.0], [2843.8, 0.0], [2875.0, 0.0], [2906.2, 0.0], [2937.5, 0.0], [2968.8, 32.0], [3000.0, 64.0], [3031.2, 32.0], [3062.5, 0.0], [3093.8, 0.0], [3125.0, 0.0], [3156.2, 0.0], [3187.5, 0.0], [3218.8, 0.0], [3250.0, 0.0], [3281.2, 0.0], [3312.5, 0.0], [3343.8, 0.0], [3375.0, 0.0], [3406.2, 0.0], [3437.5, 0.0], [3468.8, 0.0], [3500.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[2625.0, 0.0], [2656.2, 0.0], [2687.5, 0.0], [2718.8, 0.0], [2750.0, 0.0], [2781.2, 0.0], [2812.5, 0.0], [2843.8, 0.0], [2875.0, 0.0], [2906.2, 0.0], [2937.5, 0.0], [2968.8, 32.0], [3000.0, 64.0], [3031.2, 32.0], [3062.5, 0.0], [3093.8, 0.0], [3125.0, 0.0], [3156.2, 0.0], [3187.5, 0.0], [3218.8, 0.0], [3250.0, 0.0], [3281.2, 0.0], [3312.5, 0.0], [3343.8, 0.0], [3375.0, 0.0], [3406.2, 0.0], [3437.5, 0.0], [3468.8, 0.0], [3500.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true },
    { "points": [[2625.0, 0.0], [2656.2, 0.22], [2687.5, 1.02], [2718.8, 1.82], [2750.0, 0.26], [2781.2, 0.0], [2812.5, 0.0], [2843.8, 0.0], [2875.0, 4.41], [2906.2, 14.05], [2937.5, 23.69], [2968.8, 25.01], [3000.0, 22.45], [3031.2, 19.88], [3062.5, 17.32], [3093.8, 11.73], [3125.0, 6.1], [3156.2, 0.47], [3187.5, 0.0], [3218.8, 0.0], [3250.0, 0.0], [3281.2, 0.0], [3312.5, 1.05], [3343.8, 0.72], [3375.0, 0.38], [3406.2, 0.05], [3437.5, 0.0], [3468.8, 0.0], [3500.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[2625.0, 0.0], [2656.2, 0.22], [2687.5, 1.02], [2718.8, 1.82], [2750.0, 0.26], [2781.2, 0.0], [2812.5, 0.0], [2843.8, 0.0], [2875.0, 4.41], [2906.2, 14.05], [2937.5, 23.69], [2968.8, 25.01], [3000.0, 22.45], [3031.2, 19.88], [3062.5, 17.32], [3093.8, 11.73], [3125.0, 6.1], [3156.2, 0.47], [3187.5, 0.0], [3218.8, 0.0], [3250.0, 0.0], [3281.2, 0.0], [3312.5, 1.05], [3343.8, 0.72], [3375.0, 0.38], [3406.2, 0.05], [3437.5, 0.0], [3468.8, 0.0], [3500.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true }
  ]
}
```

## 11. Code

Write Griffin-Lim and test it on the demo signal of section 7.1. You can reuse `stft` and `istft` from the L40 exercise, with $L$ = 512 and $H$ = 128.

1. `spectral_convergence(Y_mag, A)` returns $\lVert Y - A \rVert_F / \lVert A \rVert_F$.
2. `griffin_lim(A, n_iter, init="random", seed=0)` follows the seven steps of section 7. It returns the samples and the list of $SC$ values, one per iteration.
3. `mel_to_magnitude(mel, M)` returns `np.maximum(mel @ np.linalg.pinv(M).T, 0)` for a mel table of shape (frames, bands).

Build the demo signal: 8,000 samples at 16 kHz, $f_0$ from 180 to 240 Hz on a straight line in time. Use the phase $\phi[n] = 2\pi \sum_{j \le n} f_0[j] / f_s$, and $x = 0.3\sum_{h=1}^{5} \sin(h\,\phi)/h$.

Acceptance tests:

- The $SC$ list never increases by more than 1e-9 from one step to the next, over 50 steps.
- $SC$ after 50 steps is below 0.2. (Seed 0 gave 0.0935. Twenty seeds gave values from 0.076 to 0.156.)
- With the true phases as the start, $SC$ is below 1e-10 after one step.
- `spectral_convergence(np.abs(stft(-x)), np.abs(stft(x)))` is exactly 0.
- `mel_to_magnitude` on a 300 Hz tone, with an 80-band Slaney mel matrix for $L$ = 512, has a relative error below 0.05.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end)

```check
{
  "question": "Stuck on griffin_lim?",
  "hint": "Keep only the phase as the state of the loop. The magnitude never changes: it is always A.",
  "answer": "phase = exp(2πi·random), or all ones. In each loop: x = istft(A·phase), then Y = stft(x), then record SC(|Y|, A), then phase = exp(i·angle(Y)). The angle avoids a division by |Y| = 0. Return x and the SC list."
}
```

## 12. Common mistakes

1. **"The mel spectrogram is invertible."** It maps 257 numbers to 80. Many magnitudes give the same mel values.
2. **"A random phase is fine for a magnitude."** Overlapping frames with random phases cancel each other. The result has the wrong magnitude.
3. **Measuring Griffin-Lim with the waveform SNR.** The magnitude ignores a global sign and other phase changes that the ear does not hear. Use the spectral convergence.
4. **"Griffin-Lim finds the original phase."** It finds a consistent phase. Different starts give different results.
5. **"Neural vocoders run an FFT."** HiFi-GAN's generator uses convolutions only. The FFT appears in its training loss.
6. **"An audio token is a sample."** One Mimi frame of tokens covers 1,920 samples (80 ms), coded with 8 indices.

## 13. One-minute explanation

A TTS system usually predicts a mel spectrogram first, then a vocoder makes samples. The inverse STFT needs a magnitude and a phase for every bin, but the mel spectrogram has only 80 band values and no phase. Griffin-Lim invents a phase. It starts with any phase, computes the inverse STFT and then the STFT again, keeps the new phase, restores the target magnitude, and repeats. Each round makes the overlapping frames agree better, and the magnitude error does not grow. It converges slowly and can stop in a local minimum, and its output can sound rougher than real speech. Neural vocoders such as HiFi-GAN learn the map from mel frames to samples with convolutions. They use the FFT only in their training loss. Neural audio codecs go one step further. They change audio into a few codebook indices per frame, and speech-to-speech models read and write these like text tokens.

## 14. Check questions

```check
{
  "question": "One frame has 1,024 real samples. How many real numbers does its real FFT hold, and how many are phases? How many numbers does an 80-band mel frame keep?",
  "hint": "The real FFT gives N/2 + 1 bins. Bin 0 and bin N/2 are real.",
  "answer": "1,024 / 2 + 1 = 513 bins. 511 of them are complex (a magnitude and a phase) and 2 are real. Real numbers: 513 magnitudes + 511 phases = 1,024. The mel frame keeps 80 numbers. It drops all 511 phases and 513 − 80 = 433 directions of the magnitude."
}
```

```check
{
  "question": "Write the Griffin-Lim loop as numbered steps. Which step forces the right magnitude, and which steps force consistency?",
  "hint": "Two sets: tables with magnitude A, and tables that are the STFT of a real signal.",
  "answer": "1. Start with a phase φ. 2. X = A·e^(iφ). 3. x = ISTFT(X). 4. Y = STFT(x). 5. φ = angle(Y). 6. Measure SC. 7. Repeat. Step 2 forces the magnitude A. Steps 3 and 4 force consistency, because Y is the STFT of a real signal."
}
```

```check
{
  "question": "Griffin-Lim reaches SC = 0.05, but the waveform SNR against the original is −5 dB. Is the method broken?",
  "hint": "Compare x and −x.",
  "answer": "No. Many waveforms share one STFT magnitude: −x has exactly the same magnitude as x, and other phase changes also keep it. The ear does not hear these differences, but the waveform SNR punishes them. SC measures what the method controls: the magnitude."
}
```

```check
{
  "question": "A codec runs at 24 kHz with 75 token frames per second and codebooks of 1,024 entries. How many samples does one frame cover? What bitrate do 4 codebooks give?",
  "hint": "Samples per frame = sample rate / frame rate. Bits per codebook = log₂(entries).",
  "answer": "24,000 / 75 = 320 samples per frame (13.3 ms, rounded). Each codebook costs log₂ 1024 = 10 bits. 4 codebooks: 75 × 4 × 10 = 3,000 bits per second = 3 kbps. This matches EnCodec's 3 kbps setting."
}
```

```check
{
  "question": "HiFi-GAN's config uses hop 256 and upsample rates 8, 8, 2, 2 at 22,050 Hz. Another config uses hop 300. Which upsample rates could work, and why must their product equal the hop?",
  "hint": "Each mel frame must become exactly one hop of samples.",
  "answer": "The generator changes each mel frame into (product of the upsample rates) samples. The mel frames are one hop apart in the audio. So the product must equal the hop. Otherwise the audio has the wrong length and timing. For hop 300: for example 5 × 5 × 4 × 3 = 300, or 10 × 5 × 3 × 2 = 300."
}
```

## 15. Links

- Previous: [L40: Enhancement](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement)
- Next: [L42: Latency](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency)
- [L35: The inverse STFT](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft)
- [L36: Mel and log-mel](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel)
- [L24: The mirror](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)
- [L38: The voice-agent pipeline](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map)
- [08 Voice agents](/notes/maths/fft-signal-processing/08-voice-agents)
