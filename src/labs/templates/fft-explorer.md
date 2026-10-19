---
title: "FFT explorer: from samples to a spectrum"
summary: "Make a signal, look at its spectrum, then write the DFT yourself and test it against NumPy."
collection: "Maths"
tags: [fft, signal-processing, numpy]
packages: [numpy, matplotlib]
level: "Beginner"
order: 10
objectives:
  - "Compute the frequency in Hz of FFT bin k from fs and N."
  - "Write the DFT with loops or one matrix, and match np.fft.fft."
  - "Explain spectral leakage, and what a window does to it."
  - "Explain aliasing with the Nyquist frequency fs / 2."
---
# FFT explorer

A digital signal is a list of numbers: one number for each sample. The FFT changes this list into a list of frequencies. Each frequency has a size (the magnitude) and a phase.

In this lab you:

1. Make a signal from two sine waves and some noise.
2. Look at its spectrum, and change the controls.
3. Write the DFT yourself, and test it against `np.fft.fft`.

Run a cell with **Shift + Enter**. When you move a control above a cell, the cell runs again.

## 1. A signal and its spectrum

```python
import numpy as np
import matplotlib.pyplot as plt

fs = 64          # @param {type:"slider", min:16, max:256, step:16, label:"sample rate fs (Hz)"}
N = 64           # @param {type:"slider", min:16, max:512, step:16, label:"number of samples N"}
f1 = 5.0         # @param {type:"slider", min:0, max:40, step:0.5, label:"frequency 1 (Hz)"}
f2 = 12.0        # @param {type:"slider", min:0, max:40, step:0.5, label:"frequency 2 (Hz)"}
noise = 0.0      # @param {type:"slider", min:0, max:1, step:0.05}
window = "none"  # @param ["none", "hann", "hamming"]

t = np.arange(N) / fs                       # the time of each sample, in seconds
x = np.sin(2 * np.pi * f1 * t) + 0.5 * np.sin(2 * np.pi * f2 * t)
x = x + noise * np.random.default_rng(0).standard_normal(N)

w = {"none": np.ones(N), "hann": np.hanning(N), "hamming": np.hamming(N)}[window]
X = np.fft.rfft(x * w)
freqs = np.fft.rfftfreq(N, d=1 / fs)        # the frequency of each bin, in Hz

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8, 5.5))
ax1.plot(t, x, marker=".", linewidth=1)
ax1.set(title="Signal (time domain)", xlabel="time (s)", ylabel="value")
ax2.stem(freqs, np.abs(X) / N)
ax2.set(title="Magnitude spectrum", xlabel="frequency (Hz)", ylabel="|X| / N")
fig.tight_layout()

print(f"Bin spacing fs / N = {fs / N:.3f} Hz.  Highest frequency fs / 2 = {fs / 2:.1f} Hz.")
```

Try these changes. Write what you see in the Observations cell at the end.

1. Set **frequency 1** to 5.5 Hz. The peak spreads into the bins near it. This is **spectral leakage**: 5.5 Hz is not a whole number of cycles in the window.
2. Keep 5.5 Hz and set **window** to `hann`. The spread gets smaller far from the peak, and the peak gets wider.
3. Set **frequency 2** to 40 Hz with fs = 64 Hz. Where does the peak appear? Compare it with fs − 40.

```check
{
  "question": "fs = 64 Hz and N = 64. Which bin holds a 5 Hz sine wave? Which bin holds 5 Hz when N = 128?",
  "hint": "The bins are fs / N apart. Bin k is at k · fs / N Hz.",
  "answer": "N = 64: bin spacing 1 Hz, so k = 5. N = 128: bin spacing 0.5 Hz, so k = 10."
}
```

## 2. Write the DFT yourself

The discrete Fourier transform of $x[0], \dots, x[N-1]$ is

$$
X[k] = \sum_{n=0}^{N-1} x[n] \, e^{-2\pi i k n / N}, \qquad k = 0, \dots, N-1.
$$

Write `dft(x)`. Do not call `np.fft` inside it. A loop is fine: the goal is to understand the formula, not speed.

```python
def dft(x):
    """Return the DFT of the 1-D sequence x as a complex NumPy array of the same length."""
    x = np.asarray(x, dtype=complex)
    N = len(x)
    # TODO: compute X[k] for k = 0 .. N-1 with the formula above.
    raise NotImplementedError("Write dft(x)")
```

```check
{
  "question": "Stuck on `dft`? Use the hints in order.",
  "hint": "Hint 1: make an empty complex array `X` of length N. For each k, add up N terms: `x[n] * exp(-2j*pi*k*n/N)`.",
  "answer": "Hint 2 (pseudocode): `X = zeros(N, complex)`; for k in range(N): for n in range(N): `X[k] += x[n] * exp(-2j*pi*k*n/N)`; return X. Faster version: build the matrix `W[k, n] = exp(-2j*pi*k*n/N)` with `np.outer`, then `X = W @ x`."
}
```

```python
import lab

rng = np.random.default_rng(1)
sample = rng.standard_normal(16)
lab.check("dft matches np.fft.fft", dft(sample), np.fft.fft(sample), tol=1e-9)
lab.check("a constant goes only into bin 0", dft(np.ones(8)), np.array([8, 0, 0, 0, 0, 0, 0, 0]), tol=1e-9)
lab.check("one cosine cycle goes into bins 1 and N-1", np.round(np.abs(dft(np.cos(2 * np.pi * np.arange(8) / 8))), 9), np.array([0, 4, 0, 0, 0, 0, 0, 4.0]))
lab.check("an empty signal gives an empty spectrum", len(dft([])), 0)
```

## 3. Which frequency is bin k?

```python
def bin_frequency(k, fs, N):
    """Return the frequency in Hz of FFT bin k, for sample rate fs and N samples."""
    # TODO
    raise NotImplementedError("Write bin_frequency(k, fs, N)")


lab.check("bin 5, fs = 64, N = 64", bin_frequency(5, 64, 64), 5.0)
lab.check("bin 3, fs = 1000, N = 100", bin_frequency(3, 1000, 100), 30.0)
lab.check("matches np.fft.rfftfreq", np.array([bin_frequency(k, 48, 32) for k in range(17)]), np.fft.rfftfreq(32, d=1 / 48))
```

## 4. Why the FFT exists

Your `dft` does about $N^2$ multiplications. The FFT does about $N \log_2 N$. Run this cell to see the difference grow.

```python
import time

sizes = [32, 64, 128, 256]
slow, fast = [], []
for n in sizes:
    signal = np.random.default_rng(n).standard_normal(n)
    start = time.perf_counter(); dft(signal); slow.append(time.perf_counter() - start)
    start = time.perf_counter(); np.fft.fft(signal); fast.append(time.perf_counter() - start)

plt.figure(figsize=(7, 3.5))
plt.loglog(sizes, slow, "o-", label="your dft")
plt.loglog(sizes, fast, "o-", label="np.fft.fft")
plt.xlabel("N"); plt.ylabel("seconds"); plt.legend(); plt.title("Run time")
for n, s, f in zip(sizes, slow, fast):
    print(f"N = {n:4d}: dft {s * 1000:8.2f} ms, fft {f * 1000:6.3f} ms, ratio {s / max(f, 1e-9):8.0f}x")
```

## Observations

Write in your own words:

1. What is spectral leakage? When does it happen?
2. What does a window change? What does it cost?
3. What happened to a frequency above fs / 2?
