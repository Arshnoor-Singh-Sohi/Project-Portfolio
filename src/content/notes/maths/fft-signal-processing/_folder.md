---
title: "FFT and Signal Processing"
order: 1
summary: "From one simple wave to the FFT, the Fourier family, spectrograms and voice agents."
---

## Goal

Understand the FFT well enough to explain it, implement it, and use it in voice-agent systems. The path also covers Fourier series, the Fourier transform and time–frequency duality.

## Finish line

I master the subject when all 10 items are true, with no notes and no AI.

- [ ] Explain a signal, its samples, frequency, amplitude and phase with a drawing.
- [ ] Compute a 4-point DFT by hand.
- [ ] Compute a 4-point FFT by hand, and show that it gives the same answer.
- [ ] Derive $X[k] = E[k] + W^k O[k]$ on paper, and explain each step.
- [ ] Write a direct DFT and a radix-2 FFT in an empty notebook. Both match `numpy.fft.fft`.
- [ ] Convert bins to hertz and magnitudes to amplitudes. Explain leakage and aliasing.
- [ ] Explain the Fourier family (Fourier series, Fourier transform, DTFT, DFT) and the rule that connects them.
- [ ] State the convolution theorem and use it to filter a signal.
- [ ] Make a spectrogram of my own voice from scratch, and explain every parameter.
- [ ] Draw a voice-agent pipeline, and show each place where these ideas appear.

## Folders

| Folder | Content |
|---|---|
| [00 Progress](/notes/maths/fft-signal-processing/00-progress) | Session log, mistakes and weak areas |
| [Course plan](/notes/maths/fft-signal-processing/course-plan) | The map of all parts, and how each session works |
| [Glossary](/notes/maths/fft-signal-processing/glossary) | Every term, with a plain meaning |
| [01 Math foundations](/notes/maths/fft-signal-processing/01-math-foundations) | Radians, sums, dot product, complex numbers, Euler's formula, roots of unity |
| [02 Signals and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency) | Signals, period, frequency, amplitude, phase, samples |
| [03 Matching to DFT](/notes/maths/fft-signal-processing/03-matching-to-dft) | Matching score, basis, the DFT, the inverse DFT |
| [04 FFT](/notes/maths/fft-signal-processing/04-fft) | Even–odd split, butterfly, recursion, the FFT in code |
| [05 Reading spectra](/notes/maths/fft-signal-processing/05-reading-spectra) | Hertz, amplitude, mirror, leakage, windows, aliasing |
| [06 Fourier family and duality](/notes/maths/fft-signal-processing/06-fourier-family-and-duality) | Fourier series, Fourier transform, duality, convolution, uncertainty |
| [07 Speech time–frequency](/notes/maths/fft-signal-processing/07-speech-time-frequency) | STFT, spectrogram, mel features |
| [08 Voice agents](/notes/maths/fft-signal-processing/08-voice-agents) | The voice-agent pipeline and the capstone |

## Sources

- Course videos and course notes: `C:\Users\ASohi\Downloads\FFT_Study_Course` (12 chapters, 16:31 in total).
- Video copies for these notes: `/notes/media/fft-signal-processing/course/`.

## Conventions

These conventions come from the course. Every note and every new animation uses them.

| Color | Meaning |
|---|---|
| Blue | The input signal x[n] or x(t) |
| Orange | A probe (candidate oscillation). Later, the twiddle factor. |
| Yellow | A Fourier coefficient X[k] |
| Green | Even-indexed samples and E[k]. Also positive products. |
| Purple | Odd-indexed samples and O[k] |
| Red | Negative products, or a warning |
| Teal and pink | Real part and imaginary part |

- Forward DFT: $X[k] = \sum_{n=0}^{N-1} x[n]\, e^{-i 2\pi k n / N}$. It does not divide by N. `numpy.fft.fft` uses the same convention.
- Twiddle factor: $W_N^k = e^{-i 2\pi k / N}$.
- FFT variant: radix-2 decimation in time. Inputs in bit-reversed order. Outputs in natural order.
- Teaching signal (chapters 3 to 9): $x[n] = \cos(2\pi n/8) + 0.5\sin(2\pi \cdot 2n/8)$, with N = 8.
- Spectrum signal (chapters 1, 2, 11): sines at 6, 14 and 24 Hz, amplitudes 1.0, 0.6 and 0.4. N = 64, $f_s$ = 128 Hz.
