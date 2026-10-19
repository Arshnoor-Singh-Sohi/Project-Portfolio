---
title: "L32: The convolution theorem"
order: 5
summary: "Convolution in time equals multiplication in frequency. With zero padding and the FFT, a long filter becomes fast."
status: not-started
tags: [convolution, filtering, zero-padding, overlap-add, fft]
---

## 1. The question this idea answers

A filter changes a signal. A moving average removes noise. A room adds reverb to a voice. An equalizer makes the bass louder. All of these filters do the same operation: convolution. For long signals, direct convolution is slow, as the direct DFT was slow (L14).

The convolution theorem turns convolution into a multiplication of two spectra. The FFT computes the spectra fast. This is the most important pair of the Fourier family, and L31 left it for this lesson. It is also the second item of the finish line: "State the convolution theorem and use it to filter a signal."

## 2. Mental model

> [!analogy] One clap in a hall
> Clap once in a hall. The hall answers with a pattern of echoes. This pattern is the impulse response $h$. Now speak. Your voice is a long row of small claps with different strengths. Each clap starts its own copy of the echo pattern, scaled by its strength. You hear the sum of all copies. This sum is the convolution of your voice with $h$.
>
> **Where it stops working:** the picture assumes a hall that never changes and never distorts. A real loudspeaker distorts at high volume, and a hall changes when people move. Convolution describes only systems that are linear and time-invariant. The picture also hides the flip in the formula. The flip appears when you compute one output at a time (section 4.2).

## 3. Terms

| Term | Plain meaning |
|---|---|
| filter | A system that changes a signal, for example to remove noise. |
| unit impulse ($\delta[n]$) | The list that is 1 at $n = 0$ and 0 everywhere else. One clap. |
| impulse response ($h[n]$) | The output of a filter when the input is a unit impulse. |
| LTI system | A linear, time-invariant system. Linear: a sum in gives the sum of the outputs. Time-invariant: a delayed input gives the same output, delayed. |
| convolution ($x * h$) | $y[n] = \sum_m x[m]\, h[n - m]$. The output of an LTI system with impulse response $h$. Also called linear convolution. |
| circular convolution ($x \circledast h$) | Convolution of two lists of length $N$ where the indices wrap modulo $N$. |
| moving average | A filter that replaces each sample by the average of $M$ neighbors: $h = [\frac{1}{M}, \dots, \frac{1}{M}]$. |
| frequency response ($H[k]$, $H(f)$) | The DFT or the Fourier transform of the impulse response. It tells how much the filter scales and rotates each frequency. |
| FIR filter | A filter with a finite impulse response: $h$ has $M$ nonzero values. $M$ is the number of taps. |
| overlap-add | A method that convolves a long signal block by block and adds the overlapping tails. |

## 4. Convolution from first principles

### 4.1 Why a filter is a convolution

1. Feed one unit impulse into an LTI filter. The output is $h[n]$, by definition.
2. Any input is a sum of scaled, delayed impulses: $x[n] = \sum_m x[m]\, \delta[n - m]$.
3. Time invariance: the impulse at time $m$ gives $h[n - m]$, the same response delayed by $m$.
4. Linearity: the impulse with size $x[m]$ gives $x[m]\, h[n - m]$, and the sum of the inputs gives the sum of the outputs.

$$
y[n] = (x * h)[n] = \sum_m x[m]\, h[n - m]
$$

So $h$ describes the filter completely. If you know the response to one clap, you know the response to every input.

### 4.2 A full hand example

Take $x = [1, 2, 3]$ and $h = [1, 1]$. Read the formula in two ways.

**Way 1: one copy of h for each input sample.** Each $x[m]$ starts a copy of $h$. The copy is delayed by $m$ samples and scaled by $x[m]$. Add the copies.

| | n = 0 | n = 1 | n = 2 | n = 3 |
|---|---|---|---|---|
| $x[0]\, h[n - 0]$ = 1 × [1, 1] from n = 0 | 1 | 1 | 0 | 0 |
| $x[1]\, h[n - 1]$ = 2 × [1, 1] from n = 1 | 0 | 2 | 2 | 0 |
| $x[2]\, h[n - 2]$ = 3 × [1, 1] from n = 2 | 0 | 0 | 3 | 3 |
| $y[n]$ (sum of the column) | 1 | 3 | 5 | 3 |

**Way 2: flip, shift, multiply, add.** Fix one output $n$. As a function of $m$, the term $h[n - m]$ is $h$ flipped and moved to $n$.

1. **Flip** $h$: $h[-m]$ has $h[0]$ at $m = 0$ and $h[1]$ at $m = -1$.
2. **Shift** it by $n$: $h[n - m]$ has $h[0]$ at $m = n$ and $h[1]$ at $m = n - 1$.
3. **Multiply** it with $x[m]$, point by point.
4. **Add** the products. This is a matching score (L7) with the flipped, shifted $h$ as the probe.

| n | Where the flipped h sits | Products | $y[n]$ |
|---|---|---|---|
| 0 | $m = -1, 0$ | $x[0] h[0] = 1 \cdot 1$ | 1 |
| 1 | $m = 0, 1$ | $x[0] h[1] + x[1] h[0] = 1 + 2$ | 3 |
| 2 | $m = 1, 2$ | $x[1] h[1] + x[2] h[0] = 2 + 3$ | 5 |
| 3 | $m = 2, 3$ | $x[2] h[1] = 3$ | 3 |
| 4 | $m = 3, 4$ | no overlap | 0 |

![Alt text: the flip-shift-multiply-add steps for x = [1, 2, 3] and h = [1, 1]. Each row moves the flipped h one step right and gives one output: 1, 3, 5, 3.](/notes/media/fft-signal-processing/figures/l32-flip-shift-multiply-add.svg)

Both ways give $y = [1, 3, 5, 3]$. `np.convolve([1, 2, 3], [1, 1])` gives the same list. The length is $L + M - 1 = 3 + 2 - 1 = 4$, where $L$ and $M$ are the lengths of $x$ and $h$.

```plot
{
  "title": "x (blue), h (gold) and y = x * h (ink)",
  "xAxis": {"label": "n", "domain": [-0.5, 4.5]},
  "yAxis": {"label": "value", "domain": [-0.3, 5.5]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 1], [1, 2], [2, 3]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0, 1], [1, 2], [2, 3]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true},
    {"points": [[0, 1], [1, 1]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0, 1], [1, 1]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[0, 1], [1, 3], [2, 5], [3, 3]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0, 1], [1, 3], [2, 5], [3, 3]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

> [!note] Convolution is polynomial multiplication
> Write $x$ and $h$ as polynomials: $(1 + 2z + 3z^2)(1 + z) = 1 + 3z + 5z^2 + 3z^3$. The coefficients are $[1, 3, 5, 3]$. Each power of $z$ collects the products whose positions add to that power. This is the same bookkeeping as the convolution sum.

> [!trap] Without the flip, it is a different operation
> $\sum_m x[m]\, h[n + m]$ has no flip. It is correlation, not convolution. For a symmetric $h$, such as the moving average, the two give the same values, but at different positions $n$. For other filters the values differ too.

### 4.3 Circular convolution

The DFT treats each list as one period (L30). So the natural convolution for the DFT wraps: an index past the end continues at the start. For two lists of length $N$:

$$
(x \circledast h)[n] = \sum_{m=0}^{N-1} x[m]\, h[(n - m) \bmod N]
$$

> [!example] The same lists, wrapped with N = 3
> Use $x = [1, 2, 3]$ and $h = [1, 1, 0]$.
>
> - $y[0] = x[0]h[0] + x[1]h[2] + x[2]h[1] = 1 + 0 + 3 = 4$.
> - $y[1] = x[0]h[1] + x[1]h[0] + x[2]h[2] = 1 + 2 + 0 = 3$.
> - $y[2] = x[0]h[2] + x[1]h[1] + x[2]h[0] = 0 + 2 + 3 = 5$.
>
> The result is $[4, 3, 5]$, not $[1, 3, 5, 3]$. The last value 3 of the linear result has no place in 3 samples. It wraps to the front and adds to the first value: $1 + 3 = 4$.

With $N = 4$ (pad both lists with zeros), circular convolution gives $[1, 3, 5, 3]$. With $N = 5$, it gives $[1, 3, 5, 3, 0]$. When $N \ge L + M - 1$, nothing wraps, and circular convolution equals linear convolution.

## 5. The theorem

$$
\mathrm{DFT}\{x \circledast h\}[k] = X[k]\; H[k]
\qquad\qquad
(x * h)(t) \;\leftrightarrow\; X(f)\, H(f)
$$

> [!key] The convolution theorem
> Circular convolution in time equals multiplication of the DFTs. For continuous signals, convolution in time equals multiplication of the Fourier transforms.

### 5.1 Why it holds: a short derivation

1. Start from the definition: $Y[k] = \sum_n \sum_m x[m]\, h[(n - m) \bmod N]\, e^{-i 2\pi k n/N}$.
2. Change the order of the sums: $Y[k] = \sum_m x[m] \sum_n h[(n - m) \bmod N]\, e^{-i 2\pi k n/N}$.
3. The inner sum is the DFT of $h$ shifted circularly by $m$. The shift pair of L31 gives $e^{-i 2\pi k m/N}\, H[k]$.
4. So $Y[k] = \sum_m x[m]\, e^{-i 2\pi k m/N}\, H[k] = X[k]\, H[k]$.

### 5.2 Why it holds: what a filter does to one probe

Send one complex probe $e^{i 2\pi k n/N}$ through the filter:

$$
\sum_m h[m]\, e^{i 2\pi k (n - m)/N} = \Big(\sum_m h[m]\, e^{-i 2\pi k m/N}\Big)\, e^{i 2\pi k n/N} = H[k]\, e^{i 2\pi k n/N}
$$

The probe leaves the filter at the same frequency, only multiplied by one complex number $H[k]$. So a filter cannot make new frequencies. It only scales and rotates each one. The inverse DFT (L13) writes $x$ as a sum of these probes. Each probe gets its own factor $H[k]$. So the output spectrum is $X[k]\, H[k]$.

### 5.3 Check by hand with N = 4

Pad to length 4: $x = [1, 2, 3, 0]$ and $h = [1, 1, 0, 0]$. The DFT probe for $N = 4$ takes the values $1, -i, -1, i$ for bin 1.

1. $X = [6,\ -2 - 2i,\ 2,\ -2 + 2i]$. For example, $X[1] = 1 + 2(-i) + 3(-1) + 0 = -2 - 2i$.
2. $H = [2,\ 1 - i,\ 0,\ 1 + i]$. For example, $H[1] = 1 + 1 \cdot (-i) = 1 - i$.
3. Multiply bin by bin: $Y[1] = (-2 - 2i)(1 - i) = -2 + 2i - 2i + 2i^2 = -4$. In the same way, $Y = [12, -4, 0, -4]$.
4. Inverse DFT: $y[n] = \frac{1}{4}\sum_k Y[k]\, e^{i 2\pi k n/4}$.
   - $y[0] = \frac{1}{4}(12 - 4 + 0 - 4) = 1$.
   - $y[1] = \frac{1}{4}(12 + (-4)(i) + 0 + (-4)(-i)) = \frac{12}{4} = 3$.
   - $y[2] = \frac{1}{4}(12 + 4 + 0 + 4) = 5$.
   - $y[3] = \frac{1}{4}(12 + (-4)(-i) + 0 + (-4)(i)) = 3$.

The result is $[1, 3, 5, 3]$, the linear convolution. With length 3 (no padding), the same steps give $[4, 3, 5]$, the wrapped result.

### 5.4 The dual pair: multiplication in time

Duality (L31) swaps the roles: a multiplication in time gives a convolution in frequency. A window is a multiplication in time (L25). So the spectrum of a frame is the true spectrum convolved with the window spectrum. For one tone, this places a copy of the window spectrum at the tone frequency. This is the modulation pair of L31 seen in another way.

## 6. Linear convolution with the FFT

The FFT gives circular convolution. To get linear convolution, make the lists long enough so that nothing wraps.

1. Choose a length $P \ge L + M - 1$. A power of 2 suits the radix-2 FFT (part 04).
2. Pad $x$ and $h$ with zeros to length $P$, and compute both FFTs.
3. Multiply the two spectra bin by bin.
4. Compute the inverse FFT. Keep the first $L + M - 1$ values. Keep the real part, because rounding leaves imaginary parts near $10^{-16}$.

NumPy pads with zeros when you give a length larger than the list:

```python
X = np.fft.fft(x, P)
```

> [!key] Zero padding to L + M − 1
> Circular convolution of length $P$ equals linear convolution when $P \ge L + M - 1$. A shorter $P$ wraps the tail of the result onto its start.

### 6.1 The cost

Direct linear convolution needs about $L \cdot M$ multiplications. The FFT method needs three FFTs of length $P$, at about $\frac{P}{2}\log_2 P$ complex multiplications each (L21), and $P$ products.

| L (signal) | M (filter) | Direct $L \cdot M$ | P | FFT: $3 \cdot \frac{P}{2}\log_2 P + P$ | Ratio |
|---|---|---|---|---|---|
| 200 | 9 | 1,800 | 256 | 3,328 | 0.5 |
| 48,000 | 64 | 3,072,000 | 65,536 | 1,638,400 | 1.9 |
| 4,096 | 4,096 | 16,777,216 | 8,192 | 167,936 | 99.9 |
| 48,000 | 48,000 | 2,304,000,000 | 131,072 | 3,473,408 | 663.3 |

1. For a short filter, the direct method is cheaper. A 9-tap moving average does not need the FFT.
2. For a long filter, the FFT method wins by a large factor. The growth is $L \cdot M$ against about $P \log_2 P$, as $N^2$ against $N \log_2 N$ in L21.
3. One complex multiplication costs about 4 real multiplications. So the true gain is smaller than the ratio in the table, but the growth rates stay the same.

> [!note] Source
> The SciPy documentation (version 1.18.1) describes `scipy.signal.convolve(..., method='auto')`. This default "chooses direct or Fourier method based on an estimate of which is faster". `scipy.signal.fftconvolve` always uses the FFT, and `scipy.signal.oaconvolve` uses overlap-add.

## 7. Example: a moving average, both ways

Make a test signal:

1. A 2 Hz sine, sampled at $f_s$ = 200 Hz for 1 s: $L$ = 200 samples.
2. Add random noise with standard deviation 0.3 (NumPy generator with seed 0).
3. Use a 9-point moving average: $h = [\frac{1}{9}, \dots, \frac{1}{9}]$, $M$ = 9.

Results from Python:

| Method | Output length | Largest difference from `np.convolve` |
|---|---|---|
| `np.convolve(x, h)` (direct) | 208 | 0 |
| FFT with $P$ = 208 | 208 | $4.4 \times 10^{-16}$ |
| FFT with $P$ = 256 | 208 (first 208 kept) | $4.4 \times 10^{-16}$ |
| FFT with $P$ = 200 (too short) | 200 | 0.224 in the first 8 values |

With $P$ = 200, the last 8 values of the true result wrap onto the first 8 values. All other values are still correct.

```plot
{
  "title": "Noisy input (blue) and 9-point average (ink)",
  "xAxis": {"label": "time t (s)", "domain": [0, 1]},
  "yAxis": {"label": "value", "domain": [-2, 2]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 0.038], [0.005, 0.023], [0.01, 0.317], [0.015, 0.219], [0.02, 0.088], [0.025, 0.417], [0.03, 0.759], [0.035, 0.71], [0.04, 0.271], [0.045, 0.156], [0.05, 0.401], [0.055, 0.65], [0.06, -0.013], [0.065, 0.663], [0.07, 0.397], [0.075, 0.589], [0.08, 0.681], [0.085, 0.781], [0.09, 1.028], [0.095, 1.243], [0.1, 0.912], [0.105, 1.379], [0.11, 0.783], [0.115, 1.098], [0.12, 1.269], [0.125, 1.028], [0.13, 0.775], [0.135, 0.716], [0.14, 0.845], [0.145, 1.035], [0.15, 0.648], [0.155, 0.867], [0.16, 0.857], [0.165, 1.039], [0.17, 0.909], [0.175, 0.916], [0.18, 0.574], [0.185, 0.69], [0.19, 0.92], [0.195, 1.085], [0.2, 0.21], [0.205, 0.99], [0.21, 0.886], [0.215, 0.66], [0.22, 0.447], [0.225, 0.215], [0.23, 0.686], [0.235, 0.775], [0.24, 0.666], [0.245, 0.457], [0.25, 0.107], [0.255, -0.425], [0.26, -0.127], [0.265, 0.01], [0.27, -0.635], [0.275, -0.19], [0.28, -0.239], [0.285, -0.217], [0.29, -0.837], [0.295, -0.734], [0.3, -0.719], [0.305, -0.988], [0.31, -0.163], [0.315, -0.878], [0.32, -0.672], [0.325, -0.887], [0.33, -0.369], [0.335, -0.48], [0.34, -0.715], [0.345, -1.591], [0.35, -0.935], [0.355, -0.763], [0.36, -0.681], [0.365, -1.177], [0.37, -0.451], [0.375, -1.396], [0.38, -1.196], [0.385, -0.712], [0.39, -0.968], [0.395, -0.368], [0.4, -0.895], [0.405, -1.12], [0.41, -1.018], [0.415, -1.204], [0.42, -1.228], [0.425, -0.62], [0.43, -0.596], [0.435, -0.341], [0.44, -0.911], [0.445, -0.131], [0.45, -0.674], [0.455, -0.064], [0.46, -0.612], [0.465, -0.646], [0.47, -0.293], [0.475, 0], [0.48, -0.2], [0.485, -0.363], [0.49, -0.528], [0.495, -0.483], [0.5, 0.151], [0.505, 0.36], [0.51, 0.076], [0.515, -0.135], [0.52, 0.511], [0.525, -0.075], [0.53, 0.154], [0.535, 0.612], [0.54, -0.193], [0.545, 0.652], [0.55, 0.413], [0.555, 0.67], [0.56, 0.662], [0.565, 0.79], [0.57, 0.979], [0.575, 0.582], [0.58, 1.271], [0.585, 1.094], [0.59, 1.158], [0.595, 1.279], [0.6, 1.187], [0.605, 1.222], [0.61, 1.005], [0.615, 0.564], [0.62, 0.958], [0.625, 0.769], [0.63, 0.571], [0.635, 1.07], [0.64, 0.812], [0.645, 0.66], [0.65, 0.638], [0.655, 1.01], [0.66, 1.012], [0.665, 1.273], [0.67, 0.84], [0.675, 1.122], [0.68, 1.191], [0.685, 1.074], [0.69, -0.025], [0.695, 1.006], [0.7, 0.69], [0.705, 0.663], [0.71, 0.593], [0.715, 0.541], [0.72, 0.464], [0.725, 0.201], [0.73, -0.322], [0.735, 0.155], [0.74, -0.116], [0.745, 0.387], [0.75, -0.087], [0.755, -0.038], [0.76, -0.38], [0.765, -0.341], [0.77, -0.252], [0.775, -0.755], [0.78, -0.278], [0.785, -0.458], [0.79, -0.837], [0.795, -1.255], [0.8, -0.434], [0.805, -0.727], [0.81, -0.844], [0.815, -0.8], [0.82, -0.226], [0.825, -0.824], [0.83, -0.818], [0.835, -1.322], [0.84, -0.411], [0.845, -0.655], [0.85, -0.631], [0.855, -0.954], [0.86, -0.707], [0.865, -0.881], [0.87, -0.814], [0.875, -1.046], [0.88, -1.44], [0.885, -0.683], [0.89, -1.563], [0.895, -1.041], [0.9, -1.012], [0.905, -1.243], [0.91, -0.721], [0.915, -0.936], [0.92, -0.975], [0.925, -0.653], [0.93, -0.913], [0.935, -0.312], [0.94, -0.579], [0.945, -0.78], [0.95, -1.171], [0.955, -0.928], [0.96, -0.156], [0.965, -0.441], [0.97, -0.453], [0.975, 0.184], [0.98, -0.633], [0.985, -0.363], [0.99, -0.267], [0.995, 0.113]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0, 0.076], [0.005, 0.123], [0.01, 0.207], [0.015, 0.286], [0.02, 0.316], [0.025, 0.329], [0.03, 0.371], [0.035, 0.408], [0.04, 0.382], [0.045, 0.446], [0.05, 0.444], [0.055, 0.425], [0.06, 0.422], [0.065, 0.478], [0.07, 0.575], [0.075, 0.669], [0.08, 0.698], [0.085, 0.853], [0.09, 0.866], [0.095, 0.944], [0.1, 1.019], [0.105, 1.058], [0.11, 1.057], [0.115, 1.022], [0.12, 0.978], [0.125, 0.992], [0.13, 0.911], [0.135, 0.92], [0.14, 0.893], [0.145, 0.868], [0.15, 0.854], [0.155, 0.87], [0.16, 0.854], [0.165, 0.837], [0.17, 0.824], [0.175, 0.873], [0.18, 0.8], [0.185, 0.815], [0.19, 0.798], [0.195, 0.77], [0.2, 0.718], [0.205, 0.678], [0.21, 0.678], [0.215, 0.662], [0.22, 0.615], [0.225, 0.643], [0.23, 0.544], [0.235, 0.399], [0.24, 0.311], [0.245, 0.263], [0.25, 0.168], [0.255, 0.071], [0.26, -0.042], [0.265, -0.14], [0.27, -0.284], [0.275, -0.377], [0.28, -0.41], [0.285, -0.506], [0.29, -0.525], [0.295, -0.552], [0.3, -0.605], [0.305, -0.677], [0.31, -0.694], [0.315, -0.654], [0.32, -0.652], [0.325, -0.749], [0.33, -0.743], [0.335, -0.81], [0.34, -0.788], [0.345, -0.844], [0.35, -0.796], [0.355, -0.91], [0.36, -0.99], [0.365, -0.989], [0.37, -0.92], [0.375, -0.857], [0.38, -0.872], [0.385, -0.92], [0.39, -0.903], [0.395, -0.986], [0.4, -0.967], [0.405, -0.903], [0.41, -0.891], [0.415, -0.821], [0.42, -0.881], [0.425, -0.796], [0.43, -0.747], [0.435, -0.641], [0.44, -0.575], [0.445, -0.51], [0.45, -0.474], [0.455, -0.408], [0.46, -0.392], [0.465, -0.331], [0.47, -0.375], [0.475, -0.354], [0.48, -0.33], [0.485, -0.223], [0.49, -0.142], [0.495, -0.125], [0.5, -0.068], [0.505, -0.054], [0.51, 0.003], [0.515, 0.13], [0.52, 0.162], [0.525, 0.218], [0.53, 0.224], [0.535, 0.29], [0.54, 0.378], [0.545, 0.409], [0.55, 0.526], [0.555, 0.574], [0.56, 0.647], [0.565, 0.79], [0.57, 0.846], [0.575, 0.943], [0.58, 1], [0.585, 1.062], [0.59, 1.086], [0.595, 1.04], [0.6, 1.082], [0.605, 1.026], [0.61, 0.968], [0.615, 0.958], [0.62, 0.906], [0.625, 0.848], [0.63, 0.783], [0.635, 0.783], [0.64, 0.833], [0.645, 0.868], [0.65, 0.876], [0.655, 0.937], [0.66, 0.951], [0.665, 0.98], [0.67, 0.904], [0.675, 0.945], [0.68, 0.909], [0.685, 0.87], [0.69, 0.795], [0.695, 0.762], [0.7, 0.689], [0.705, 0.579], [0.71, 0.423], [0.715, 0.443], [0.72, 0.319], [0.725, 0.285], [0.73, 0.202], [0.735, 0.132], [0.74, 0.029], [0.745, -0.06], [0.75, -0.11], [0.755, -0.158], [0.76, -0.207], [0.765, -0.245], [0.77, -0.381], [0.775, -0.51], [0.78, -0.554], [0.785, -0.593], [0.79, -0.649], [0.795, -0.71], [0.8, -0.651], [0.805, -0.712], [0.81, -0.752], [0.815, -0.806], [0.82, -0.712], [0.825, -0.736], [0.83, -0.726], [0.835, -0.738], [0.84, -0.728], [0.845, -0.8], [0.85, -0.799], [0.855, -0.825], [0.86, -0.838], [0.865, -0.868], [0.87, -0.969], [0.875, -1.014], [0.88, -1.021], [0.885, -1.08], [0.89, -1.063], [0.895, -1.076], [0.9, -1.068], [0.905, -0.981], [0.91, -1.006], [0.915, -0.867], [0.92, -0.816], [0.925, -0.79], [0.93, -0.782], [0.935, -0.805], [0.94, -0.719], [0.945, -0.659], [0.95, -0.637], [0.955, -0.515], [0.96, -0.551], [0.965, -0.527], [0.97, -0.47], [0.975, -0.327], [0.98, -0.224], [0.985, -0.207], [0.99, -0.158], [0.995, -0.107]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true}
  ]
}
```

The ink curve uses the centered ("same") alignment: output $n$ is the average of input samples $n - 4$ to $n + 4$. `np.convolve(x, h, mode='same')` gives this alignment.

**How much noise remains?** The error against the clean sine drops from 0.288 (RMS) to 0.112 (RMS), away from the ends. The average of 9 independent noise values has $\frac{1}{9}$ of the noise power, so $\frac{1}{3}$ of the noise RMS: about 0.1. The sine adds very little. The filter keeps 0.9869 of its 2 Hz amplitude, so the sine error is only about 0.009 (RMS). The rest of the gap comes from chance in this one noise sample.

**Why the moving average is a low-pass filter.** Its frequency response is the DTFT of 9 equal values. L30 computed the same shape for 4 ones:

$$
\lvert H(f) \rvert = \left\lvert \frac{\sin(\pi f M/f_s)}{M \sin(\pi f/f_s)} \right\rvert
$$

The zeros are at multiples of $f_s/M = 200/9 = 22.2$ Hz. Low frequencies pass with a gain near 1. High frequencies get a small gain. So the noise above about 20 Hz drops, and the 2 Hz sine stays.

```plot
{
  "title": "Gain of the 9-point moving average (gold)",
  "xAxis": {"label": "frequency f (Hz)", "domain": [0, 100]},
  "yAxis": {"label": "gain", "domain": [-0.05, 1.1]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 1], [0.2, 0.9999], [0.4, 0.9995], [0.6, 0.9988], [0.8, 0.9979], [1, 0.9967], [1.2, 0.9953], [1.4, 0.9936], [1.6, 0.9916], [1.8, 0.9894], [2, 0.9869], [2.2, 0.9842], [2.4, 0.9812], [2.6, 0.9779], [2.8, 0.9744], [3, 0.9706], [3.2, 0.9666], [3.4, 0.9624], [3.6, 0.9579], [3.8, 0.9532], [4, 0.9482], [4.2, 0.943], [4.4, 0.9375], [4.6, 0.9318], [4.8, 0.9259], [5, 0.9197], [5.2, 0.9133], [5.4, 0.9067], [5.6, 0.8999], [5.8, 0.8929], [6, 0.8856], [6.2, 0.8782], [6.4, 0.8705], [6.6, 0.8626], [6.8, 0.8546], [7, 0.8463], [7.2, 0.8378], [7.4, 0.8292], [7.6, 0.8204], [7.8, 0.8113], [8, 0.8022], [8.2, 0.7928], [8.4, 0.7833], [8.6, 0.7736], [8.8, 0.7637], [9, 0.7537], [9.2, 0.7436], [9.4, 0.7333], [9.6, 0.7228], [9.8, 0.7122], [10, 0.7015], [10.2, 0.6907], [10.4, 0.6797], [10.6, 0.6687], [10.8, 0.6575], [11, 0.6462], [11.2, 0.6348], [11.4, 0.6233], [11.6, 0.6117], [11.8, 0.6], [12, 0.5883], [12.2, 0.5765], [12.4, 0.5646], [12.6, 0.5526], [12.8, 0.5406], [13, 0.5285], [13.2, 0.5164], [13.4, 0.5042], [13.6, 0.492], [13.8, 0.4797], [14, 0.4675], [14.2, 0.4552], [14.4, 0.4428], [14.6, 0.4305], [14.8, 0.4182], [15, 0.4058], [15.2, 0.3935], [15.4, 0.3812], [15.6, 0.3688], [15.8, 0.3565], [16, 0.3443], [16.2, 0.332], [16.4, 0.3198], [16.6, 0.3076], [16.8, 0.2955], [17, 0.2834], [17.2, 0.2714], [17.4, 0.2594], [17.6, 0.2475], [17.8, 0.2356], [18, 0.2239], [18.2, 0.2122], [18.4, 0.2005], [18.6, 0.189], [18.8, 0.1776], [19, 0.1662], [19.2, 0.155], [19.4, 0.1439], [19.6, 0.1328], [19.8, 0.1219], [20, 0.1111], [20.2, 0.1004], [20.4, 0.0899], [20.6, 0.0794], [20.8, 0.0691], [21, 0.059], [21.2, 0.049], [21.4, 0.0391], [21.6, 0.0293], [21.8, 0.0197], [22, 0.0103], [22.2, 0.001], [22.4, 0.0081], [22.6, 0.0171], [22.8, 0.0259], [23, 0.0345], [23.2, 0.043], [23.4, 0.0512], [23.6, 0.0594], [23.8, 0.0673], [24, 0.0751], [24.2, 0.0826], [24.4, 0.09], [24.6, 0.0972], [24.8, 0.1043], [25, 0.1111], [25.2, 0.1178], [25.4, 0.1242], [25.6, 0.1305], [25.8, 0.1365], [26, 0.1424], [26.2, 0.1481], [26.4, 0.1536], [26.6, 0.1589], [26.8, 0.1639], [27, 0.1688], [27.2, 0.1735], [27.4, 0.178], [27.6, 0.1823], [27.8, 0.1863], [28, 0.1902], [28.2, 0.1939], [28.4, 0.1974], [28.6, 0.2007], [28.8, 0.2038], [29, 0.2066], [29.2, 0.2093], [29.4, 0.2118], [29.6, 0.2141], [29.8, 0.2162], [30, 0.2181], [30.2, 0.2198], [30.4, 0.2213], [30.6, 0.2226], [30.8, 0.2237], [31, 0.2247], [31.2, 0.2254], [31.4, 0.226], [31.6, 0.2263], [31.8, 0.2265], [32, 0.2266], [32.2, 0.2264], [32.4, 0.2261], [32.6, 0.2255], [32.8, 0.2249], [33, 0.224], [33.2, 0.223], [33.4, 0.2218], [33.6, 0.2205], [33.8, 0.219], [34, 0.2173], [34.2, 0.2155], [34.4, 0.2135], [34.6, 0.2114], [34.8, 0.2092], [35, 0.2068], [35.2, 0.2042], [35.4, 0.2016], [35.6, 0.1988], [35.8, 0.1959], [36, 0.1928], [36.2, 0.1896], [36.4, 0.1863], [36.6, 0.1829], [36.8, 0.1794], [37, 0.1758], [37.2, 0.1721], [37.4, 0.1682], [37.6, 0.1643], [37.8, 0.1603], [38, 0.1562], [38.2, 0.152], [38.4, 0.1477], [38.6, 0.1434], [38.8, 0.139], [39, 0.1345], [39.2, 0.1299], [39.4, 0.1253], [39.6, 0.1206], [39.8, 0.1159], [40, 0.1111], [40.2, 0.1063], [40.4, 0.1014], [40.6, 0.0965], [40.8, 0.0916], [41, 0.0866], [41.2, 0.0816], [41.4, 0.0766], [41.6, 0.0715], [41.8, 0.0665], [42, 0.0614], [42.2, 0.0563], [42.4, 0.0513], [42.6, 0.0462], [42.8, 0.0411], [43, 0.036], [43.2, 0.031], [43.4, 0.0259], [43.6, 0.0209], [43.8, 0.0159], [44, 0.0109], [44.2, 0.006], [44.4, 0.0011], [44.6, 0.0038], [44.8, 0.0086], [45, 0.0134], [45.2, 0.0182], [45.4, 0.0229], [45.6, 0.0275], [45.8, 0.0321], [46, 0.0367], [46.2, 0.0411], [46.4, 0.0455], [46.6, 0.0499], [46.8, 0.0542], [47, 0.0584], [47.2, 0.0625], [47.4, 0.0665], [47.6, 0.0705], [47.8, 0.0744], [48, 0.0782], [48.2, 0.0819], [48.4, 0.0855], [48.6, 0.0891], [48.8, 0.0925], [49, 0.0959], [49.2, 0.0991], [49.4, 0.1023], [49.6, 0.1053], [49.8, 0.1083], [50, 0.1111], [50.2, 0.1139], [50.4, 0.1165], [50.6, 0.119], [50.8, 0.1214], [51, 0.1237], [51.2, 0.1259], [51.4, 0.128], [51.6, 0.13], [51.8, 0.1318], [52, 0.1336], [52.2, 0.1352], [52.4, 0.1367], [52.6, 0.1381], [52.8, 0.1394], [53, 0.1405], [53.2, 0.1416], [53.4, 0.1425], [53.6, 0.1433], [53.8, 0.144], [54, 0.1446], [54.2, 0.145], [54.4, 0.1454], [54.6, 0.1456], [54.8, 0.1457], [55, 0.1457], [55.2, 0.1455], [55.4, 0.1453], [55.6, 0.145], [55.8, 0.1445], [56, 0.1439], [56.2, 0.1432], [56.4, 0.1424], [56.6, 0.1415], [56.8, 0.1405], [57, 0.1394], [57.2, 0.1382], [57.4, 0.1369], [57.6, 0.1354], [57.8, 0.1339], [58, 0.1323], [58.2, 0.1306], [58.4, 0.1288], [58.6, 0.1269], [58.8, 0.1249], [59, 0.1228], [59.2, 0.1206], [59.4, 0.1184], [59.6, 0.116], [59.8, 0.1136], [60, 0.1111], [60.2, 0.1085], [60.4, 0.1059], [60.6, 0.1032], [60.8, 0.1004], [61, 0.0975], [61.2, 0.0946], [61.4, 0.0916], [61.6, 0.0886], [61.8, 0.0855], [62, 0.0823], [62.2, 0.0791], [62.4, 0.0759], [62.6, 0.0726], [62.8, 0.0692], [63, 0.0659], [63.2, 0.0624], [63.4, 0.059], [63.6, 0.0555], [63.8, 0.052], [64, 0.0484], [64.2, 0.0449], [64.4, 0.0413], [64.6, 0.0377], [64.8, 0.0341], [65, 0.0304], [65.2, 0.0268], [65.4, 0.0231], [65.6, 0.0195], [65.8, 0.0158], [66, 0.0121], [66.2, 0.0085], [66.4, 0.0048], [66.6, 0.0012], [66.8, 0.0024], [67, 0.006], [67.2, 0.0096], [67.4, 0.0132], [67.6, 0.0167], [67.8, 0.0203], [68, 0.0238], [68.2, 0.0272], [68.4, 0.0307], [68.6, 0.0341], [68.8, 0.0374], [69, 0.0407], [69.2, 0.044], [69.4, 0.0472], [69.6, 0.0504], [69.8, 0.0535], [70, 0.0566], [70.2, 0.0596], [70.4, 0.0626], [70.6, 0.0655], [70.8, 0.0684], [71, 0.0711], [71.2, 0.0739], [71.4, 0.0765], [71.6, 0.0791], [71.8, 0.0816], [72, 0.0841], [72.2, 0.0864], [72.4, 0.0887], [72.6, 0.0909], [72.8, 0.0931], [73, 0.0951], [73.2, 0.0971], [73.4, 0.099], [73.6, 0.1008], [73.8, 0.1026], [74, 0.1042], [74.2, 0.1058], [74.4, 0.1072], [74.6, 0.1086], [74.8, 0.1099], [75, 0.1111], [75.2, 0.1122], [75.4, 0.1132], [75.6, 0.1142], [75.8, 0.115], [76, 0.1157], [76.2, 0.1164], [76.4, 0.117], [76.6, 0.1174], [76.8, 0.1178], [77, 0.1181], [77.2, 0.1182], [77.4, 0.1183], [77.6, 0.1183], [77.8, 0.1182], [78, 0.118], [78.2, 0.1177], [78.4, 0.1174], [78.6, 0.1169], [78.8, 0.1163], [79, 0.1157], [79.2, 0.115], [79.4, 0.1141], [79.6, 0.1132], [79.8, 0.1122], [80, 0.1111], [80.2, 0.1099], [80.4, 0.1087], [80.6, 0.1073], [80.8, 0.1059], [81, 0.1044], [81.2, 0.1028], [81.4, 0.1011], [81.6, 0.0994], [81.8, 0.0976], [82, 0.0957], [82.2, 0.0937], [82.4, 0.0917], [82.6, 0.0896], [82.8, 0.0874], [83, 0.0852], [83.2, 0.0829], [83.4, 0.0805], [83.6, 0.0781], [83.8, 0.0757], [84, 0.0731], [84.2, 0.0705], [84.4, 0.0679], [84.6, 0.0652], [84.8, 0.0625], [85, 0.0597], [85.2, 0.0569], [85.4, 0.054], [85.6, 0.0511], [85.8, 0.0482], [86, 0.0452], [86.2, 0.0422], [86.4, 0.0392], [86.6, 0.0361], [86.8, 0.033], [87, 0.0299], [87.2, 0.0268], [87.4, 0.0237], [87.6, 0.0205], [87.8, 0.0174], [88, 0.0142], [88.2, 0.011], [88.4, 0.0078], [88.6, 0.0046], [88.8, 0.0014], [89, 0.0018], [89.2, 0.005], [89.4, 0.0081], [89.6, 0.0113], [89.8, 0.0145], [90, 0.0176], [90.2, 0.0207], [90.4, 0.0238], [90.6, 0.0269], [90.8, 0.03], [91, 0.033], [91.2, 0.036], [91.4, 0.039], [91.6, 0.0419], [91.8, 0.0448], [92, 0.0477], [92.2, 0.0505], [92.4, 0.0533], [92.6, 0.056], [92.8, 0.0587], [93, 0.0614], [93.2, 0.064], [93.4, 0.0665], [93.6, 0.069], [93.8, 0.0714], [94, 0.0738], [94.2, 0.0761], [94.4, 0.0784], [94.6, 0.0806], [94.8, 0.0827], [95, 0.0848], [95.2, 0.0867], [95.4, 0.0887], [95.6, 0.0905], [95.8, 0.0923], [96, 0.094], [96.2, 0.0956], [96.4, 0.0972], [96.6, 0.0987], [96.8, 0.1001], [97, 0.1014], [97.2, 0.1026], [97.4, 0.1038], [97.6, 0.1049], [97.8, 0.1058], [98, 0.1068], [98.2, 0.1076], [98.4, 0.1083], [98.6, 0.109], [98.8, 0.1095], [99, 0.11], [99.2, 0.1104], [99.4, 0.1107], [99.6, 0.1109], [99.8, 0.1111], [100, 0.1111]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true}
  ]
}
```

```plot
{
  "title": "Spectrum: input (blue) and output (ink)",
  "xAxis": {"label": "frequency f (Hz)", "domain": [0, 100]},
  "yAxis": {"label": "2|X[k]|/N", "domain": [-0.02, 1.1]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 0.0092], [1, 0.0442], [2, 0.9974], [3, 0.0344], [4, 0.0341], [5, 0.0454], [6, 0.0402], [7, 0.0422], [8, 0.0874], [9, 0.0621], [10, 0.017], [11, 0.0603], [12, 0.0729], [13, 0.0174], [14, 0.0572], [15, 0.0389], [16, 0.0173], [17, 0.0394], [18, 0.0208], [19, 0.0487], [20, 0.0099], [21, 0.0183], [22, 0.0112], [23, 0.0253], [24, 0.0119], [25, 0.0498], [26, 0.0868], [27, 0.0156], [28, 0.0423], [29, 0.0265], [30, 0.0457], [31, 0.0305], [32, 0.0401], [33, 0.0674], [34, 0.028], [35, 0.0348], [36, 0.0278], [37, 0.0323], [38, 0.0217], [39, 0.0105], [40, 0.0231], [41, 0.061], [42, 0.0384], [43, 0.0745], [44, 0.0275], [45, 0.0239], [46, 0.02], [47, 0.033], [48, 0.0345], [49, 0.0591], [50, 0.0217], [51, 0.0522], [52, 0.0269], [53, 0.0489], [54, 0.0211], [55, 0.0377], [56, 0.067], [57, 0.0389], [58, 0.0167], [59, 0.0358], [60, 0.0176], [61, 0.0317], [62, 0.0156], [63, 0.0176], [64, 0.0239], [65, 0.0086], [66, 0.0461], [67, 0.0607], [68, 0.0698], [69, 0.0246], [70, 0.0224], [71, 0.0049], [72, 0.0321], [73, 0.0225], [74, 0.032], [75, 0.0122], [76, 0.037], [77, 0.0497], [78, 0.0397], [79, 0.0537], [80, 0.0743], [81, 0.0262], [82, 0.048], [83, 0.041], [84, 0.0204], [85, 0.0494], [86, 0.0297], [87, 0.0192], [88, 0.0308], [89, 0.0346], [90, 0.0312], [91, 0.0396], [92, 0.0316], [93, 0.0323], [94, 0.0473], [95, 0.0376], [96, 0.0859], [97, 0.0226], [98, 0.0583], [99, 0.0117], [100, 0.0516]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0, 0.0099], [1, 0.0438], [2, 0.9845], [3, 0.0332], [4, 0.0318], [5, 0.0426], [6, 0.0362], [7, 0.0361], [8, 0.0694], [9, 0.0479], [10, 0.0131], [11, 0.0392], [12, 0.0441], [13, 0.0099], [14, 0.0269], [15, 0.0145], [16, 0.0048], [17, 0.0096], [18, 0.0041], [19, 0.0074], [20, 0.0018], [21, 0.0027], [22, 0.0019], [23, 0.0026], [24, 0.0028], [25, 0.0053], [26, 0.0117], [27, 0.0016], [28, 0.0075], [29, 0.0075], [30, 0.0079], [31, 0.0047], [32, 0.0093], [33, 0.0146], [34, 0.0044], [35, 0.0087], [36, 0.0032], [37, 0.0078], [38, 0.0017], [39, 0.0036], [40, 0.003], [41, 0.0074], [42, 0.0005], [43, 0.0026], [44, 0.002], [45, 0.0019], [46, 0.0027], [47, 0.0013], [48, 0.0011], [49, 0.0063], [50, 0.0041], [51, 0.0063], [52, 0.0017], [53, 0.0059], [54, 0.0013], [55, 0.0042], [56, 0.0094], [57, 0.0055], [58, 0.0024], [59, 0.0037], [60, 0.0036], [61, 0.002], [62, 0.0019], [63, 0.0004], [64, 0.0016], [65, 0.0016], [66, 0.0016], [67, 0.0017], [68, 0.0012], [69, 0.0007], [70, 0.0024], [71, 0.0015], [72, 0.0036], [73, 0.0025], [74, 0.0037], [75, 0.0001], [76, 0.003], [77, 0.0046], [78, 0.0036], [79, 0.0051], [80, 0.0089], [81, 0.0021], [82, 0.0055], [83, 0.0035], [84, 0.0027], [85, 0.0041], [86, 0.0006], [87, 0.0012], [88, 0.0008], [89, 0.0012], [90, 0.0016], [91, 0.0015], [92, 0.0024], [93, 0.0007], [94, 0.0047], [95, 0.0043], [96, 0.0079], [97, 0.0023], [98, 0.0057], [99, 0], [100, 0.0045]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true}
  ]
}
```

## 8. Where convolution appears in audio

1. **Reverb.** A recorded room impulse response can last more than a second. At 48 kHz, 1 s of impulse response is 48,000 taps. Convolution reverb filters a dry voice with it. The table in section 6.1 shows why it must use the FFT.
2. **Filters.** An equalizer, a low-pass filter before a lower sample rate (L26), and a speech band filter are FIR filters. Each one is a convolution.
3. **Streaming with overlap-add.** A live signal never ends, so you cannot take its full FFT. Split it into blocks of $B$ samples. Convolve each block with $h$ by FFT, with $P \ge B + M - 1$. Each block result is $M - 1$ samples longer than the block. Add these tails to the start of the next block result.

> [!example] Overlap-add by hand
> $x = [1, 2, 3, 4, 5, 6, 7, 8]$ and $h = [1, 1]$, with blocks of 4.
>
> - Block 1: $[1, 2, 3, 4] * [1, 1] = [1, 3, 5, 7, 4]$, placed at $n = 0$.
> - Block 2: $[5, 6, 7, 8] * [1, 1] = [5, 11, 13, 15, 8]$, placed at $n = 4$.
> - Add: at $n = 4$ the tail 4 of block 1 meets the start 5 of block 2, so the value is 9.
>
> The result $[1, 3, 5, 7, 9, 11, 13, 15, 8]$ equals `np.convolve(x, h)`.

The same overlap-add idea rebuilds a signal from STFT frames (L35). Voice enhancement and echo cancellation process audio in blocks in the same way (L40). The block length adds delay, which matters for a voice agent (L42).

## 9. Code

Build these functions in a lab. Do not call `np.convolve` inside them.

1. `conv_direct(x, h)`: linear convolution with two loops (flip, shift, multiply, add).
2. `conv_circular(x, h)`: circular convolution of two lists of the same length $N$, with indices modulo $N$.
3. `conv_fft(x, h)`: linear convolution with zero padding to a power of 2 that is at least $L + M - 1$.
4. `overlap_add(x, h, B)`: linear convolution block by block, with `conv_fft` on each block.

Acceptance tests:

- `conv_direct([1, 2, 3], [1, 1])` returns `[1, 3, 5, 3]`.
- `conv_circular([1, 2, 3], [1, 1, 0])` returns `[4, 3, 5]`.
- `np.allclose(conv_fft(x, h), np.convolve(x, h))` is True for 5 random pairs with `L = 1000` and `M = 37`.
- `np.allclose(overlap_add(x, h, 128), np.convolve(x, h))` is True for a random `x` of length 1000 and a random `h` of length 50.
- The FFT of `conv_circular(x, h)` equals `np.fft.fft(x) * np.fft.fft(h)` to $10^{-10}$.

```check
{
  "question": "Hint for `overlap_add`: where does each block result go, and how long is it?",
  "hint": "A block of B samples convolved with M taps gives B + M − 1 samples.",
  "answer": "Make an output array of length L + M − 1, filled with zeros. For the block that starts at sample s, compute its convolution with h (length B + M − 1, or less for the last block). ADD it into the output at positions s to s + B + M − 2. Do not overwrite: the first M − 1 values of each block result must add to the tail of the previous block."
}
```

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem)

## 10. Common mistakes

1. **No zero padding.** `ifft(fft(x) * fft(h, len(x)))` gives a circular result. The tail wraps onto the start. Pad to at least $L + M - 1$.
2. **Padding only to the longer list.** Length $\max(L, M)$ is not enough. The result is $L + M - 1$ samples long.
3. **No flip.** A sum $\sum_m x[m]\, h[n + m]$ is correlation. Convolution flips $h$.
4. **The FFT for every filter.** For a short filter, direct convolution is cheaper.
5. **The wrong output length.** `np.convolve` returns $L + M - 1$ values by default ("full"). Use `mode='same'` for an output of length $L$ that is centered.
6. **A complex output.** After the inverse FFT, real inputs give imaginary parts near $10^{-16}$. Keep the real part.

## 11. One-minute explanation

A linear, time-invariant filter is completely described by its impulse response $h$: its answer to one clap. Every input is a row of scaled claps, so the output is a sum of scaled, delayed copies of $h$. This is convolution. To compute one output, I flip $h$, slide it to that position, multiply it with the input and add. The convolution theorem says that convolution in time is multiplication in frequency. The reason: each frequency goes through the filter unchanged except for one complex factor $H[k]$. The DFT version uses circular convolution, so I pad both signals to at least $L + M - 1$ samples to stop the wrap. Then three FFTs replace about $L \cdot M$ multiplications. This makes long filters such as reverb practical, and overlap-add makes it work on a stream.

## 12. Check questions

```check
{
  "question": "State the convolution theorem for the DFT. Which kind of convolution does it use?",
  "hint": "Think about how the DFT treats its input.",
  "answer": "$\\mathrm{DFT}\\{x \\circledast h\\}[k] = X[k]H[k]$. It uses circular convolution, because the DFT treats each list as one period. For linear convolution, pad both lists to at least $L + M - 1$ samples first."
}
```

```check
{
  "question": "Compute $[2, 3, 4] * [1, -1]$ by hand.",
  "hint": "Use one copy of h for each input sample, then add the columns.",
  "answer": "Copies: $2 \\times [1, -1]$ at n = 0, $3 \\times [1, -1]$ at n = 1, $4 \\times [1, -1]$ at n = 2. Columns: $n = 0$: 2. $n = 1$: $-2 + 3 = 1$. $n = 2$: $-3 + 4 = 1$. $n = 3$: $-4$. Result: $[2, 1, 1, -4]$, length 3 + 2 − 1 = 4. This filter takes the difference of neighbors."
}
```

```check
{
  "question": "Why must the FFT length be at least L + M − 1 for linear convolution?",
  "hint": "How long is the linear result? What does circular convolution do with values beyond the end?",
  "answer": "The linear result has L + M − 1 values. Circular convolution of length P places output n and output n + P in the same slot. So values beyond P wrap to the start and add there. If $P \\ge L + M - 1$, every value has its own slot, and nothing wraps."
}
```

```check
{
  "question": "x = [1, 2] and h = [1, 1]. Compute the linear convolution and the circular convolution with N = 2. Explain the difference.",
  "hint": "The linear result has 3 values. The circular result has only 2 slots.",
  "answer": "Linear: $[1, 3, 2]$. Circular with N = 2: $y[0] = x[0]h[0] + x[1]h[1] = 1 + 2 = 3$ and $y[1] = x[0]h[1] + x[1]h[0] = 1 + 2 = 3$, so $[3, 3]$. The last linear value 2 wrapped to the front: $1 + 2 = 3$."
}
```

```check
{
  "question": "A voice agent adds a 0.5 s room effect to speech at 16 kHz. The speech segment is 2 s long. Estimate the direct cost and the FFT cost with the formulas of section 6.1.",
  "hint": "L = 32,000 and M = 8,000. Find the smallest power of 2 that is at least L + M − 1.",
  "answer": "Direct: $32{,}000 \\times 8{,}000 = 256{,}000{,}000$ multiplications. $L + M - 1 = 39{,}999$, so $P = 65{,}536 = 2^{16}$. FFT: $3 \\times 32{,}768 \\times 16 + 65{,}536 = 1{,}572{,}864 + 65{,}536 = 1{,}638{,}400$ complex multiplications. The ratio is about 156."
}
```

## 13. Links

- Previous lesson: [L31: Duality pairs](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l31-duality-pairs)
- Next lesson: [L33: Uncertainty](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty)
- Part folder: [06 Fourier family and duality](/notes/maths/fft-signal-processing/06-fourier-family-and-duality)
- The matching score: [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score)
- The inverse DFT: [L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft)
- The cost of the direct DFT: [L14](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft)
- Why the FFT is fast: [L21](/notes/maths/fft-signal-processing/04-fft/l21-why-it-is-fast)
- Windows: [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)
- The DFT treats its input as one period: [L30](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l30-the-four-members)
- Overlap-add for frames: [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft)
- Enhancement: [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement)
- Latency: [L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
