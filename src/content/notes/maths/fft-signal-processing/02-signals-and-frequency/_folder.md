---
title: "02 Signals and frequency"
order: 12
summary: "Signals, period, frequency, amplitude, phase, the two domains, and samples."
---

This part builds the words and the pictures that every later part uses.

| Code | Lesson | Core idea | Course video | Status |
|---|---|---|---|---|
| L1 | What a signal is | A value that changes over time. Waves add point by point. | ch 1, 0:00–0:47 | not started |
| L2 | [Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency) | $f = 1/T$. Count the cycles in a list of samples. | ch 2, 0:00–0:20 | in progress |
| L3 | Amplitude | Height. It changes strength, not speed. | ch 2, 0:20–0:29 | not started |
| L4 | Phase | The position in the cycle at t = 0 | ch 2, 0:29–0:43 | not started |
| L5 | Two domains | The time domain and the frequency domain describe one signal. | ch 2, 0:43–0:58 | not started |
| L6 | Samples | $x[n] = x(n/f_s)$. A signal is not the same as its samples. | none | not started |

> [!note]
> L2 started before L1. The diagnostic showed that counting cycles was the first gap.

> [!trap] Phase reference
> Chapter 2 measures phase on a sine: $A\sin(2\pi f t + \varphi)$. The DFT measures phase from a cosine. So the DFT reports a pure sine as phase −90°. Both are correct. They use different reference waves.
