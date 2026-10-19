---
title: "L31: Duality pairs"
order: 4
summary: "Each operation in time has a partner in frequency: shift and phase rotation, narrow and wide, rectangle and sinc, modulation and frequency shift."
status: not-started
tags: [duality, shift-theorem, scaling, modulation, parseval]
---

## 1. The question this idea answers

L29 found two transform pairs: a rectangle gives a sinc, and a Gaussian gives a Gaussian. To get each one, we solved an integral. Most of the time you do not need a new integral. You change a known signal: you delay it, squeeze it, multiply it by a cosine, or play it backwards. What happens to its spectrum?

Each operation in time has one partner operation in frequency. These partners are the duality pairs. With them you predict a spectrum without a computation. They also explain facts that you already saw. Examples are the phase of $X[k]$ (L10), the mirror (L24), the sign pattern from a wrong time origin (L29) and the shape of leakage (L25).

## 2. Mental model

> [!analogy] A two-language dictionary
> Time and frequency are two languages that describe the same signal (L5). Each action in the time language has one translation in the frequency language. "Delay" translates to "rotate each phase". "Squeeze" translates to "stretch". "Multiply by a cosine" translates to "move to the cosine frequency".
>
> **Where it stops working:** a dictionary translates word for word, and back again in the same way. One important action does not translate into the same action. A multiplication in time becomes a convolution in frequency, not a multiplication. Lesson L32 covers that pair.

## 3. Terms

| Term | Plain meaning |
|---|---|
| time shift | A delay of the whole signal by $t_0$ seconds, or by $n_0$ samples. |
| circular shift | A shift of a DFT input where the samples that leave one end enter at the other end (`np.roll`). |
| linear phase | A phase that changes in proportion to the frequency. A time shift makes a linear phase. |
| scaling | A squeeze or a stretch of the time axis: $x(at)$. |
| duality | The forward and inverse transforms have the same form. So every pair also works with time and frequency swapped. |
| modulation | A multiplication of a signal by a carrier, for example $\cos(2\pi f_c t)$. |
| carrier | The high-frequency cosine in modulation. $f_c$ is its frequency. |
| sideband | A copy of the signal spectrum next to the carrier frequency. |
| time reversal | Playing a signal backwards: $x(-t)$, or $x[(-n) \bmod N]$ for a DFT input. |
| Parseval's theorem | The energy of a signal is the same in both domains. |

## 4. Shift in time ↔ rotation of the phase

### 4.1 The DFT form

Shift the DFT input circularly by $n_0$ samples: $y[n] = x[(n - n_0) \bmod N]$. In NumPy this is `y = np.roll(x, n0)`. Sample $x[0]$ moves to position $n_0$, and the last samples enter at the front.

$$
y[n] = x[(n - n_0) \bmod N] \quad \Longleftrightarrow \quad Y[k] = e^{-i 2\pi k n_0/N}\, X[k]
$$

The proof is a change of the counting variable:

1. $Y[k] = \sum_{n=0}^{N-1} x[(n - n_0) \bmod N]\, e^{-i 2\pi k n/N}$.
2. Write $m = (n - n_0) \bmod N$. When $n$ takes the values $0 \dots N-1$, $m$ takes the same values in a different order.
3. The probe repeats every $N$ samples. So $e^{-i 2\pi k n/N} = e^{-i 2\pi k (m + n_0)/N} = e^{-i 2\pi k n_0/N}\, e^{-i 2\pi k m/N}$.
4. The first factor does not depend on $m$. Write it in front of the sum: $Y[k] = e^{-i 2\pi k n_0/N} \sum_m x[m]\, e^{-i 2\pi k m/N} = e^{-i 2\pi k n_0/N}\, X[k]$.

The factor has magnitude 1. So the shift does not change any magnitude $\lvert X[k] \rvert$. It only rotates each coefficient by the angle $-2\pi k n_0/N$. The angle grows in proportion to $k$: this is a linear phase.

**Why higher bins rotate more.** A delay of $n_0$ samples delays every component by the same time. During that time, bin $k$ makes $k n_0/N$ cycles. So its phase falls behind by $2\pi k n_0/N$. A fast component makes more cycles during the delay.

### 4.2 Check with the teaching signal

The teaching signal is $x[n] = \cos(2\pi n/8) + 0.5\sin(2\pi \cdot 2n/8)$, with $X[1] = 4$, $X[2] = -2i$, $X[6] = 2i$, $X[7] = 4$ (L11).

```plot
{
  "title": "x[n] (blue) and np.roll(x, 1) (gold)",
  "xAxis": {"label": "sample number n", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "value", "domain": [-1.6, 1.6]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 1], [1, 1.2071], [2, 0], [3, -1.2071], [4, -1], [5, -0.2071], [6, 0], [7, 0.2071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0, 1], [1, 1.2071], [2, 0], [3, -1.2071], [4, -1], [5, -0.2071], [6, 0], [7, 0.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true},
    {"points": [[0, 0.2071], [1, 1], [2, 1.2071], [3, 0], [4, -1.2071], [5, -1], [6, -0.2071], [7, 0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0, 0.2071], [1, 1], [2, 1.2071], [3, 0], [4, -1.2071], [5, -1], [6, -0.2071], [7, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true}
  ]
}
```

> [!example] Shift by one sample: $n_0 = 1$, N = 8
> The factor for bin $k$ is $e^{-i 2\pi k/8} = e^{-i k\pi/4}$.
>
> - Bin 1: $Y[1] = 4\, e^{-i\pi/4} = 4(0.7071 - 0.7071i) = 2.8284 - 2.8284i$.
> - Bin 2: $Y[2] = -2i \cdot e^{-i\pi/2} = -2i \cdot (-i) = 2i^2 = -2$.
>
> `np.fft.fft(np.roll(x, 1))` gives exactly these values. The magnitudes stay 4 and 2. This page rounds the decimals, for example $1/\sqrt{2} \approx 0.7071$ (the course writes 0.71).

| Shift $n_0$ | $Y[1]$ | Phase of $Y[1]$ | $Y[2]$ | Phase of $Y[2]$ | $\lvert Y[1] \rvert$, $\lvert Y[2] \rvert$ |
|---|---|---|---|---|---|
| 0 | 4 | 0° | $-2i$ | −90° | 4, 2 |
| 1 | $2.8284 - 2.8284i$ | −45° | $-2$ | −180° | 4, 2 |
| 2 | $-4i$ | −90° | $2i$ | −270° (same as +90°) | 4, 2 |
| 3 | $-2.8284 - 2.8284i$ | −135° | 2 | −360° (same as 0°) | 4, 2 |

Each shift by one sample turns bin 1 by −45° and bin 2 by −90°. Bin 2 turns twice as fast, because it has twice the frequency. The mirror bins follow the same line: for $n_0 = 1$, bin 6 turns by +90° and bin 7 by +45°. One full turn is 360°, so these angles equal −270° and −315°, which is −45° × 6 and −45° × 7.

```plot
{
  "title": "Phase change −45k degrees (ink), measured (gold)",
  "xAxis": {"label": "bin k", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "phase change (degrees)", "domain": [-360, 30]},
  "disableZoom": true,
  "data": [
    {"fn": "-45*x", "color": "#100D12"},
    {"points": [[1, 0], [1, -45], [1, 0], [2, 0], [2, -90], [2, 0], [6, 0], [6, -270], [6, 0], [7, 0], [7, -315], [7, 0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[1, -45], [2, -90], [6, -270], [7, -315]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true}
  ]
}
```

### 4.3 The continuous form

$$
x(t - t_0) \quad \Longleftrightarrow \quad e^{-i 2\pi f t_0}\, X(f)
$$

The proof: put $u = t - t_0$ in the integral. Then $e^{-i 2\pi f t} = e^{-i 2\pi f (u + t_0)}$, and you can write the factor $e^{-i 2\pi f t_0}$ in front of the integral.

> [!example] The sign pattern from L29
> In L29, the FFT treated the sample at −8 s as $t = 0$. That is a shift with $t_0 = -8$ s. At the bin frequencies $f_k = k/16$ Hz, the factor is $e^{-i 2\pi (k/16)(-8)} = e^{i\pi k} = (-1)^k$. This is exactly the alternating sign that L29 showed.

> [!trap] A real delay is not circular
> `np.roll` moves the last samples to the front. A real delay brings new samples into the window, and the old ones leave. Then the formula holds only approximately. It is exact for a signal that is periodic with period $N$, or for a signal with zeros at both ends of the window.

## 5. Narrow in time ↔ wide in frequency

### 5.1 The scaling pair

Squeeze a signal by a factor $a$: $y(t) = x(at)$. With $a = 2$, everything happens twice as fast, and the signal lasts half as long.

$$
x(at) \quad \Longleftrightarrow \quad \frac{1}{\lvert a \rvert}\, X\!\left(\frac{f}{a}\right)
$$

The proof for $a > 0$:

1. $Y(f) = \int x(at)\, e^{-i 2\pi f t}\, dt$.
2. Put $u = at$. Then $t = u/a$ and $dt = du/a$.
3. $Y(f) = \frac{1}{a}\int x(u)\, e^{-i 2\pi (f/a) u}\, du = \frac{1}{a}\, X(f/a)$.

For $a < 0$ the limits of the integral change places, and the factor becomes $1/\lvert a \rvert$.

Read the result for $a = 2$:

1. **$X(f/2)$**: the value that was at 1 Hz is now at 2 Hz. The spectrum stretches to twice the width.
2. **$\frac{1}{2}$**: the spectrum gets half as high. The squeezed signal has half the area, so $Y(0) = X(0)/2$.

> [!example] A rectangle squeezed and stretched
> The rectangle of width 1 s has $X(f) = \mathrm{sinc}(f)$, with its first zero at 1 Hz (L29).
>
> - $a = 2$: the width becomes 0.5 s. The prediction is $\frac{1}{2}\mathrm{sinc}(f/2)$: value 0.5 at 0 Hz, first zero at 2 Hz. A numeric integral gives 0.50000 at 0 Hz, 0.45016 at 0.5 Hz and 0.00000 at 2 Hz. All match.
> - $a = 0.5$: the width becomes 2 s. The prediction is $2\,\mathrm{sinc}(2f)$: value 2 at 0 Hz, first zero at 0.5 Hz. The integral gives 2.00000 and 0.00000.

> [!key] Narrow in time ↔ wide in frequency
> Squeeze a signal, and its spectrum gets wider by the same factor. You cannot make both narrow. Lesson L33 turns this rule into an exact limit.

**An example you can hear.** Play a recording at twice the speed by simple resampling. The recording lasts half as long, and every frequency doubles. So the pitch rises by one octave.

### 5.2 Gaussian ↔ Gaussian, with a width

Use scaling on the pair $e^{-\pi t^2} \leftrightarrow e^{-\pi f^2}$ of L29. A Gaussian of width $a$ is $e^{-\pi (t/a)^2}$, which is $x(t/a)$. The scaling pair with factor $1/a$ gives:

$$
e^{-\pi (t/a)^2} \quad \Longleftrightarrow \quad a\, e^{-\pi (a f)^2}
$$

A Gaussian with width $a$ in time has width $1/a$ in frequency. The product of the two widths is always 1.

| a | $X(0)$ | $X(0.25)$ | $X(0.5)$ |
|---|---|---|---|
| 2 (wide in time) | 2 | 0.911876 | 0.086428 |
| 0.5 (narrow in time) | 0.5 | 0.476049 | 0.410862 |

A numeric integral in Python gives the same six decimals for each value.

```plot
{
  "title": "a = 2: x(t) (blue) and X(f) (ink)",
  "xAxis": {"label": "t (s) for blue, f (Hz) for ink", "domain": [-3, 3]},
  "yAxis": {"label": "value", "domain": [-0.1, 2.2]},
  "disableZoom": true,
  "data": [
    {"fn": "exp(-3.1416*(x/2)^2)", "color": "#1E6091"},
    {"fn": "2*exp(-3.1416*(2*x)^2)", "color": "#100D12"}
  ]
}
```

```plot
{
  "title": "a = 0.5: x(t) (blue) and X(f) (ink)",
  "xAxis": {"label": "t (s) for blue, f (Hz) for ink", "domain": [-3, 3]},
  "yAxis": {"label": "value", "domain": [-0.1, 1.2]},
  "disableZoom": true,
  "data": [
    {"fn": "exp(-3.1416*(x/0.5)^2)", "color": "#1E6091"},
    {"fn": "0.5*exp(-3.1416*(0.5*x)^2)", "color": "#100D12"}
  ]
}
```

> [!note] Scaling and samples
> Exact scaling exists only in continuous time. To squeeze a list of samples, you must drop samples. Then high frequencies can fold onto low ones (L26).

## 6. Rectangle ↔ sinc, in both directions

### 6.1 The duality rule

Compare the two formulas of L29:

$$
X(f) = \int x(t)\, e^{-i 2\pi f t}\, dt \qquad x(t) = \int X(f)\, e^{+i 2\pi f t}\, df
$$

They differ only in the sign of the exponent. So every pair also works in the other direction:

$$
\text{if } x(t) \leftrightarrow X(f), \text{ then } X(t) \leftrightarrow x(-f)
$$

The proof: write the inverse formula. Replace $t$ with $-f$ and the integration letter $f$ with $t$. The result is $x(-f) = \int X(t)\, e^{-i 2\pi f t}\, dt$. This is the forward transform of the signal $X(t)$.

### 6.2 A sinc in time gives a rectangle in frequency

The rectangle of width 1 gives $\mathrm{sinc}(f)$. So by duality, $\mathrm{sinc}(t)$ gives a rectangle of height 1 from −0.5 Hz to 0.5 Hz. The rectangle is even, so $x(-f) = x(f)$.

This pair describes the ideal low-pass filter. Its frequency response keeps every frequency below 0.5 Hz, unchanged, and removes every frequency above. Its time signal is the sinc, which never ends in either direction. So no real filter is ideal. Real filters cut the sinc to a finite length.

> [!example] Check with the FFT
> Sample $\mathrm{sinc}(t)$ with $\Delta t$ = 1/16 s from −128 s to 128 s ($N$ = 4096). Compute $\Delta t$ · FFT, with $t = 0$ at index 0 (L29).
>
> | f (Hz) | 0 | 0.25 | 0.5 | 0.55 | 1.0 |
> |---|---|---|---|---|---|
> | $\Delta t$ · FFT | 0.9984 | 0.9979 | 0.4996 | −0.0074 | 0.0005 |
> | Ideal rectangle | 1 | 1 | 0.5 (edge) | 0 | 0 |
>
> The largest value is 1.0899, just inside the edge. The cut at ±128 s keeps only part of the sinc. In L28, a finite sum kept only part of the harmonics. Both cuts give a ripple of about 9% of the jump. The jump here is 1, and the overshoot is 0.0899.

```plot
{
  "title": "Δt·FFT of sinc(t) (gold) and the rectangle (ink)",
  "xAxis": {"label": "frequency f (Hz)", "domain": [-1.5, 1.5]},
  "yAxis": {"label": "X(f)", "domain": [-0.2, 1.3]},
  "disableZoom": true,
  "data": [
    {"points": [[-1.5, 0], [-0.5, 0], [-0.5, 1], [0.5, 1], [0.5, 0], [1.5, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[-1.4961, -0.0002], [-1.4883, -0.0002], [-1.4805, -0.0002], [-1.4727, -0.0002], [-1.4648, -0.0002], [-1.457, -0.0002], [-1.4492, -0.0002], [-1.4414, -0.0002], [-1.4336, -0.0002], [-1.4258, -0.0002], [-1.418, -0.0002], [-1.4102, -0.0002], [-1.4023, -0.0002], [-1.3945, -0.0002], [-1.3867, -0.0002], [-1.3789, -0.0002], [-1.3711, -0.0002], [-1.3633, -0.0003], [-1.3555, -0.0003], [-1.3477, -0.0003], [-1.3398, -0.0003], [-1.332, -0.0003], [-1.3242, -0.0003], [-1.3164, -0.0003], [-1.3086, -0.0003], [-1.3008, -0.0003], [-1.293, -0.0003], [-1.2852, -0.0003], [-1.2773, -0.0003], [-1.2695, -0.0003], [-1.2617, -0.0003], [-1.2539, -0.0003], [-1.2461, -0.0003], [-1.2383, -0.0003], [-1.2305, -0.0003], [-1.2227, -0.0003], [-1.2148, -0.0003], [-1.207, -0.0003], [-1.1992, -0.0003], [-1.1914, -0.0003], [-1.1836, -0.0003], [-1.1758, -0.0004], [-1.168, -0.0004], [-1.1602, -0.0004], [-1.1523, -0.0004], [-1.1445, -0.0004], [-1.1367, -0.0004], [-1.1289, -0.0004], [-1.1211, -0.0004], [-1.1133, -0.0004], [-1.1055, -0.0004], [-1.0977, -0.0004], [-1.0898, -0.0004], [-1.082, -0.0004], [-1.0742, -0.0004], [-1.0664, -0.0005], [-1.0586, -0.0005], [-1.0508, -0.0005], [-1.043, -0.0005], [-1.0352, -0.0005], [-1.0273, -0.0005], [-1.0195, -0.0005], [-1.0117, -0.0005], [-1.0039, -0.0005], [-0.9961, -0.0005], [-0.9883, -0.0005], [-0.9805, -0.0006], [-0.9727, -0.0006], [-0.9648, -0.0006], [-0.957, -0.0006], [-0.9492, -0.0006], [-0.9414, -0.0006], [-0.9336, -0.0006], [-0.9258, -0.0007], [-0.918, -0.0007], [-0.9102, -0.0007], [-0.9023, -0.0007], [-0.8945, -0.0007], [-0.8867, -0.0007], [-0.8789, -0.0008], [-0.8711, -0.0008], [-0.8633, -0.0008], [-0.8555, -0.0008], [-0.8477, -0.0008], [-0.8398, -0.0009], [-0.832, -0.0009], [-0.8242, -0.0009], [-0.8164, -0.001], [-0.8086, -0.001], [-0.8008, -0.001], [-0.793, -0.001], [-0.7852, -0.0011], [-0.7773, -0.0011], [-0.7695, -0.0012], [-0.7617, -0.0012], [-0.7539, -0.0012], [-0.7461, -0.0013], [-0.7383, -0.0013], [-0.7305, -0.0014], [-0.7227, -0.0015], [-0.7148, -0.0015], [-0.707, -0.0016], [-0.6992, -0.0017], [-0.6914, -0.0017], [-0.6836, -0.0018], [-0.6758, -0.0019], [-0.668, -0.002], [-0.6602, -0.0021], [-0.6523, -0.0023], [-0.6445, -0.0024], [-0.6367, -0.0026], [-0.6289, -0.0027], [-0.6211, -0.0029], [-0.6133, -0.0031], [-0.6055, -0.0034], [-0.5977, -0.0037], [-0.5898, -0.004], [-0.582, -0.0045], [-0.5742, -0.005], [-0.5664, -0.0056], [-0.5586, -0.0064], [-0.5508, -0.0074], [-0.543, -0.0088], [-0.5352, -0.0109], [-0.5273, -0.014], [-0.5195, -0.0197], [-0.5117, -0.0327], [-0.5039, -0.0891], [-0.4961, 1.0899], [-0.4883, 1.0335], [-0.4805, 1.0205], [-0.4727, 1.0148], [-0.4648, 1.0116], [-0.457, 1.0096], [-0.4492, 1.0082], [-0.4414, 1.0072], [-0.4336, 1.0064], [-0.4258, 1.0058], [-0.418, 1.0052], [-0.4102, 1.0048], [-0.4023, 1.0045], [-0.3945, 1.0042], [-0.3867, 1.0039], [-0.3789, 1.0037], [-0.3711, 1.0035], [-0.3633, 1.0033], [-0.3555, 1.0032], [-0.3477, 1.0031], [-0.3398, 1.0029], [-0.332, 1.0028], [-0.3242, 1.0027], [-0.3164, 1.0026], [-0.3086, 1.0026], [-0.3008, 1.0025], [-0.293, 1.0024], [-0.2852, 1.0023], [-0.2773, 1.0023], [-0.2695, 1.0022], [-0.2617, 1.0022], [-0.2539, 1.0021], [-0.2461, 1.0021], [-0.2383, 1.002], [-0.2305, 1.002], [-0.2227, 1.002], [-0.2148, 1.0019], [-0.207, 1.0019], [-0.1992, 1.0019], [-0.1914, 1.0018], [-0.1836, 1.0018], [-0.1758, 1.0018], [-0.168, 1.0018], [-0.1602, 1.0018], [-0.1523, 1.0017], [-0.1445, 1.0017], [-0.1367, 1.0017], [-0.1289, 1.0017], [-0.1211, 1.0017], [-0.1133, 1.0017], [-0.1055, 1.0017], [-0.0977, 1.0016], [-0.0898, 1.0016], [-0.082, 1.0016], [-0.0742, 1.0016], [-0.0664, 1.0016], [-0.0586, 1.0016], [-0.0508, 1.0016], [-0.043, 1.0016], [-0.0352, 1.0016], [-0.0273, 1.0016], [-0.0195, 1.0016], [-0.0117, 1.0016], [-0.0039, 1.0016], [0.0039, 1.0016], [0.0117, 1.0016], [0.0195, 1.0016], [0.0273, 1.0016], [0.0352, 1.0016], [0.043, 1.0016], [0.0508, 1.0016], [0.0586, 1.0016], [0.0664, 1.0016], [0.0742, 1.0016], [0.082, 1.0016], [0.0898, 1.0016], [0.0977, 1.0016], [0.1055, 1.0017], [0.1133, 1.0017], [0.1211, 1.0017], [0.1289, 1.0017], [0.1367, 1.0017], [0.1445, 1.0017], [0.1523, 1.0017], [0.1602, 1.0018], [0.168, 1.0018], [0.1758, 1.0018], [0.1836, 1.0018], [0.1914, 1.0018], [0.1992, 1.0019], [0.207, 1.0019], [0.2148, 1.0019], [0.2227, 1.002], [0.2305, 1.002], [0.2383, 1.002], [0.2461, 1.0021], [0.2539, 1.0021], [0.2617, 1.0022], [0.2695, 1.0022], [0.2773, 1.0023], [0.2852, 1.0023], [0.293, 1.0024], [0.3008, 1.0025], [0.3086, 1.0026], [0.3164, 1.0026], [0.3242, 1.0027], [0.332, 1.0028], [0.3398, 1.0029], [0.3477, 1.0031], [0.3555, 1.0032], [0.3633, 1.0033], [0.3711, 1.0035], [0.3789, 1.0037], [0.3867, 1.0039], [0.3945, 1.0042], [0.4023, 1.0045], [0.4102, 1.0048], [0.418, 1.0052], [0.4258, 1.0058], [0.4336, 1.0064], [0.4414, 1.0072], [0.4492, 1.0082], [0.457, 1.0096], [0.4648, 1.0116], [0.4727, 1.0148], [0.4805, 1.0205], [0.4883, 1.0335], [0.4961, 1.0899], [0.5039, -0.0891], [0.5117, -0.0327], [0.5195, -0.0197], [0.5273, -0.014], [0.5352, -0.0109], [0.543, -0.0088], [0.5508, -0.0074], [0.5586, -0.0064], [0.5664, -0.0056], [0.5742, -0.005], [0.582, -0.0045], [0.5898, -0.004], [0.5977, -0.0037], [0.6055, -0.0034], [0.6133, -0.0031], [0.6211, -0.0029], [0.6289, -0.0027], [0.6367, -0.0026], [0.6445, -0.0024], [0.6523, -0.0023], [0.6602, -0.0021], [0.668, -0.002], [0.6758, -0.0019], [0.6836, -0.0018], [0.6914, -0.0017], [0.6992, -0.0017], [0.707, -0.0016], [0.7148, -0.0015], [0.7227, -0.0015], [0.7305, -0.0014], [0.7383, -0.0013], [0.7461, -0.0013], [0.7539, -0.0012], [0.7617, -0.0012], [0.7695, -0.0012], [0.7773, -0.0011], [0.7852, -0.0011], [0.793, -0.001], [0.8008, -0.001], [0.8086, -0.001], [0.8164, -0.001], [0.8242, -0.0009], [0.832, -0.0009], [0.8398, -0.0009], [0.8477, -0.0008], [0.8555, -0.0008], [0.8633, -0.0008], [0.8711, -0.0008], [0.8789, -0.0008], [0.8867, -0.0007], [0.8945, -0.0007], [0.9023, -0.0007], [0.9102, -0.0007], [0.918, -0.0007], [0.9258, -0.0007], [0.9336, -0.0006], [0.9414, -0.0006], [0.9492, -0.0006], [0.957, -0.0006], [0.9648, -0.0006], [0.9727, -0.0006], [0.9805, -0.0006], [0.9883, -0.0005], [0.9961, -0.0005], [1.0039, -0.0005], [1.0117, -0.0005], [1.0195, -0.0005], [1.0273, -0.0005], [1.0352, -0.0005], [1.043, -0.0005], [1.0508, -0.0005], [1.0586, -0.0005], [1.0664, -0.0005], [1.0742, -0.0004], [1.082, -0.0004], [1.0898, -0.0004], [1.0977, -0.0004], [1.1055, -0.0004], [1.1133, -0.0004], [1.1211, -0.0004], [1.1289, -0.0004], [1.1367, -0.0004], [1.1445, -0.0004], [1.1523, -0.0004], [1.1602, -0.0004], [1.168, -0.0004], [1.1758, -0.0004], [1.1836, -0.0003], [1.1914, -0.0003], [1.1992, -0.0003], [1.207, -0.0003], [1.2148, -0.0003], [1.2227, -0.0003], [1.2305, -0.0003], [1.2383, -0.0003], [1.2461, -0.0003], [1.2539, -0.0003], [1.2617, -0.0003], [1.2695, -0.0003], [1.2773, -0.0003], [1.2852, -0.0003], [1.293, -0.0003], [1.3008, -0.0003], [1.3086, -0.0003], [1.3164, -0.0003], [1.3242, -0.0003], [1.332, -0.0003], [1.3398, -0.0003], [1.3477, -0.0003], [1.3555, -0.0003], [1.3633, -0.0003], [1.3711, -0.0002], [1.3789, -0.0002], [1.3867, -0.0002], [1.3945, -0.0002], [1.4023, -0.0002], [1.4102, -0.0002], [1.418, -0.0002], [1.4258, -0.0002], [1.4336, -0.0002], [1.4414, -0.0002], [1.4492, -0.0002], [1.457, -0.0002], [1.4648, -0.0002], [1.4727, -0.0002], [1.4805, -0.0002], [1.4883, -0.0002], [1.4961, -0.0002]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true}
  ]
}
```

## 7. Multiply by a cosine ↔ shift in frequency

### 7.1 The modulation pair

Multiply a signal by a complex rotation at frequency $f_c$:

$$
x(t)\, e^{i 2\pi f_c t} \quad \Longleftrightarrow \quad X(f - f_c)
$$

The proof: $\int x(t)\, e^{i 2\pi f_c t}\, e^{-i 2\pi f t}\, dt = \int x(t)\, e^{-i 2\pi (f - f_c) t}\, dt = X(f - f_c)$.

This pair is the dual of section 4. A shift in time rotates the phase in frequency. A rotation in time shifts the spectrum in frequency.

A real cosine is two rotations: $\cos(2\pi f_c t) = \frac{1}{2}e^{i 2\pi f_c t} + \frac{1}{2}e^{-i 2\pi f_c t}$. So it makes two shifted copies, each with half the size:

$$
x(t)\cos(2\pi f_c t) \quad \Longleftrightarrow \quad \tfrac{1}{2} X(f - f_c) + \tfrac{1}{2} X(f + f_c)
$$

This is the mirror of L24 again. A real signal has a spectrum at $+f$ and at $-f$. In the DFT, the copy at $-f_c$ appears in the upper half of the bins.

### 7.2 Check with the DFT

Use $N$ = 64 and $f_s$ = 128 Hz, as in the course spectrum signal. So bin $k$ is at $2k$ Hz. Take a slow signal $b[n] = 1 + 0.5\cos(2\pi \cdot 2n/64)$: a constant plus a 4 Hz cosine. Multiply it by the carrier $\cos(2\pi \cdot 16n/64)$ at 32 Hz.

| | Nonzero bins | Values | In hertz |
|---|---|---|---|
| $B[k]$ before | 0, 2, 62 | 64, 16, 16 | 0 Hz, ±4 Hz |
| $Y[k]$ after | 14, 16, 18 | 8, 32, 8 | 28, 32, 36 Hz |
| | 46, 48, 50 | 8, 32, 8 | −36, −32, −28 Hz |

Python confirms $Y[k] = \frac{1}{2}B[k - 16] + \frac{1}{2}B[k + 16]$ for all 64 bins (indices mod 64). For example, $Y[16] = \frac{1}{2}B[0] = 32$, and $Y[18] = \frac{1}{2}B[2] = 8$.

The amplitudes (L23) tell the same story: $2 \times 32/64 = 1.0$ at 32 Hz, and $2 \times 8/64 = 0.25$ at 28 Hz and at 36 Hz. A product rule from trigonometry gives the same result: $0.5\cos A\cos B = 0.25\cos(A - B) + 0.25\cos(A + B)$.

```plot
{
  "title": "|B[k]|/N before the multiplication (blue)",
  "xAxis": {"label": "bin k", "domain": [-1, 64]},
  "yAxis": {"label": "|B[k]| / N", "domain": [-0.05, 1.1]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 1], [1, 0], [2, 0.25], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 0], [20, 0], [21, 0], [22, 0], [23, 0], [24, 0], [25, 0], [26, 0], [27, 0], [28, 0], [29, 0], [30, 0], [31, 0], [32, 0], [33, 0], [34, 0], [35, 0], [36, 0], [37, 0], [38, 0], [39, 0], [40, 0], [41, 0], [42, 0], [43, 0], [44, 0], [45, 0], [46, 0], [47, 0], [48, 0], [49, 0], [50, 0], [51, 0], [52, 0], [53, 0], [54, 0], [55, 0], [56, 0], [57, 0], [58, 0], [59, 0], [60, 0], [61, 0], [62, 0.25], [63, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true},
    {"points": [[0, 0], [0, 1]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[2, 0], [2, 0.25]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[62, 0], [62, 0.25]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true}
  ]
}
```

```plot
{
  "title": "|Y[k]|/N after the multiplication (gold)",
  "xAxis": {"label": "bin k", "domain": [-1, 64]},
  "yAxis": {"label": "|Y[k]| / N", "domain": [-0.05, 1.1]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0.125], [15, 0], [16, 0.5], [17, 0], [18, 0.125], [19, 0], [20, 0], [21, 0], [22, 0], [23, 0], [24, 0], [25, 0], [26, 0], [27, 0], [28, 0], [29, 0], [30, 0], [31, 0], [32, 0], [33, 0], [34, 0], [35, 0], [36, 0], [37, 0], [38, 0], [39, 0], [40, 0], [41, 0], [42, 0], [43, 0], [44, 0], [45, 0], [46, 0.125], [47, 0], [48, 0.5], [49, 0], [50, 0.125], [51, 0], [52, 0], [53, 0], [54, 0], [55, 0], [56, 0], [57, 0], [58, 0], [59, 0], [60, 0], [61, 0], [62, 0], [63, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[14, 0], [14, 0.125]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[16, 0], [16, 0.5]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[18, 0], [18, 0.125]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[46, 0], [46, 0.125]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[48, 0], [48, 0.5]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[50, 0], [50, 0.125]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true}
  ]
}
```

### 7.3 Where modulation appears

1. **AM radio.** A station sends $(1 + m\, s(t))\cos(2\pi f_c t)$, where $s(t)$ is the audio and $m$ is a number between 0 and 1. The constant 1 gives a spike at the carrier. The audio gives two sidebands. With a carrier at 1000 kHz and audio up to 5 kHz, the signal fills 995 to 1005 kHz.
2. **Windows and leakage.** A frame of a tone is the tone multiplied by a window (L25). By this pair, the spectrum of the frame is the window spectrum, moved to the tone frequency. So every peak in a spectrogram has the shape of the window spectrum. Lesson L33 uses this fact.

> [!note] Source
> FCC rules, 47 CFR § 73.14: the AM broadcast band in the USA extends from 535 to 1705 kHz. The carrier frequencies start at 540 kHz and increase in 10 kHz steps to 1700 kHz.

## 8. Time reversal ↔ conjugate

$$
x(-t) \quad \Longleftrightarrow \quad X(-f) = \overline{X(f)} \quad (\text{real } x)
$$

The first step is the scaling pair with $a = -1$. The second step is the mirror of L24: for a real signal, $X(-f) = \overline{X(f)}$. So playing a real signal backwards keeps every magnitude and changes the sign of every phase.

The DFT form is $y[n] = x[(-n) \bmod N] \Leftrightarrow Y[k] = X[(-k) \bmod N] = \overline{X[k]}$. The proof: put $m = (-n) \bmod N$ in the DFT sum. The probe becomes $e^{+i 2\pi k m/N}$, which is the probe of bin $-k$.

> [!example] The teaching signal backwards
> In NumPy, `np.roll(x[::-1], 1)` gives $x[(-n) \bmod N]$: the order $x[0], x[7], x[6], \dots, x[1]$. The result is $[1, 0.2071, 0, -0.2071, -1, -1.2071, 0, 1.2071]$.
>
> Its DFT has $Y[1] = 4$ and $Y[2] = +2i$. The original had $X[1] = 4$ and $X[2] = -2i$. So $Y = \overline{X}$. The cosine part is even, so it does not change. The sine part is odd, so it changes sign.

## 9. Two more pairs for later lessons

### 9.1 Energy is the same in both domains

$$
\sum_{n=0}^{N-1} \lvert x[n] \rvert^2 = \frac{1}{N}\sum_{k=0}^{N-1} \lvert X[k] \rvert^2
\qquad
\int \lvert x(t) \rvert^2\, dt = \int \lvert X(f) \rvert^2\, df
$$

This is Parseval's theorem. The proof for the DFT:

1. Write $\lvert X[k] \rvert^2 = X[k]\, \overline{X[k]} = \sum_n \sum_m x[n]\, \overline{x[m]}\, e^{-i 2\pi k (n - m)/N}$.
2. Add over $k$. The sum $\sum_k e^{-i 2\pi k (n - m)/N}$ is $N$ when $n = m$, and 0 otherwise (L9).
3. Only the terms with $n = m$ remain: $\sum_k \lvert X[k] \rvert^2 = N \sum_n \lvert x[n] \rvert^2$.

Check with the teaching signal: $\sum x[n]^2 = 5$, and $\frac{1}{8}(4^2 + 2^2 + 2^2 + 4^2) = 40/8 = 5$.

### 9.2 Slope in time ↔ multiply by $i 2\pi f$

$$
x'(t) \quad \Longleftrightarrow \quad i 2\pi f\, X(f)
$$

The proof: take the derivative of the inverse formula $x(t) = \int X(f)\, e^{i 2\pi f t}\, df$ with respect to $t$. Inside the integral, the derivative of $e^{i 2\pi f t}$ is $i 2\pi f\, e^{i 2\pi f t}$. So $x'(t)$ is the inverse transform of $i 2\pi f\, X(f)$.

Check with the Gaussian: the transform of $-2\pi t\, e^{-\pi t^2}$ at $f$ = 0.5 Hz is $1.432372i$ by a numeric integral. The pair predicts $i 2\pi (0.5)\, e^{-\pi/4} = i\pi \times 0.455938 = 1.432372i$.

The factor $f$ makes high frequencies bigger. So a signal with sharp corners has a large slope, and its spectrum has a lot of high-frequency content.

## 10. The table of pairs

| Time | Frequency | DFT form |
|---|---|---|
| $x(t - t_0)$ | $e^{-i 2\pi f t_0} X(f)$ | `np.roll(x, n0)` ↔ $e^{-i 2\pi k n_0/N} X[k]$ |
| $x(at)$ | $\frac{1}{\lvert a \rvert} X(f/a)$ | no exact form |
| rectangle, width $\tau$ | $\tau\,\mathrm{sinc}(f\tau)$ | a block of ones ↔ a sinc-like curve (L30) |
| $\mathrm{sinc}(t)$ | rectangle, −0.5 to 0.5 Hz | ideal low-pass filter |
| $e^{-\pi (t/a)^2}$ | $a\, e^{-\pi (af)^2}$ | close for a long, fine grid (L29) |
| $x(t)\, e^{i 2\pi f_c t}$ | $X(f - f_c)$ | $x[n] e^{i 2\pi k_c n/N}$ ↔ $X[k - k_c]$ |
| $x(t)\cos(2\pi f_c t)$ | $\frac{1}{2}X(f - f_c) + \frac{1}{2}X(f + f_c)$ | two copies, one in the mirror half |
| $x(-t)$, real $x$ | $\overline{X(f)}$ | `np.roll(x[::-1], 1)` ↔ $\overline{X[k]}$ |
| $x'(t)$ | $i 2\pi f\, X(f)$ | approximate only |
| energy $\int \lvert x \rvert^2 dt$ | energy $\int \lvert X \rvert^2 df$ | $\sum \lvert x \rvert^2 = \frac{1}{N}\sum \lvert X \rvert^2$ |

The most important pair is not in this table: convolution in time ↔ multiplication in frequency. It is the subject of L32.

## 11. Code

Write one test function for each pair, in a lab. Each function returns the largest error between the prediction and `np.fft.fft`.

1. `shift_error(x, n0)`: compare `fft(np.roll(x, n0))` with $e^{-i 2\pi k n_0/N}$ times `fft(x)`.
2. `modulation_error(x, kc)`: compare `fft(x * cos(2π kc n/N))` with $\frac{1}{2}X[k - k_c] + \frac{1}{2}X[k + k_c]$.
3. `reversal_error(x)`: compare `fft(np.roll(x[::-1], 1))` with `np.conj(fft(x))` for a real `x`.
4. `parseval_error(x)`: compare $\sum \lvert x \rvert^2$ with $\frac{1}{N}\sum \lvert X \rvert^2$.

Acceptance tests:

- All four errors are below $10^{-12}$ for the teaching signal and for 5 random real inputs with `N = 64`.
- `shift_error` is below $10^{-12}$ for every `n0` from 0 to 7 with the teaching signal.
- `np.abs(fft(np.roll(x, 3)))` equals `np.abs(fft(x))`.
- For a complex random input, `reversal_error` is NOT small. Explain why in a text cell.

```check
{
  "question": "Hint for `modulation_error`: how do you write $X[k - k_c]$ for every k at once?",
  "hint": "The indices wrap modulo N. Which NumPy function moves an array circularly?",
  "answer": "`np.roll(X, kc)` gives the array whose entry k is $X[(k - k_c) \\bmod N]$. `np.roll(X, -kc)` gives $X[(k + k_c) \\bmod N]$. The prediction is half of the first plus half of the second."
}
```

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/06-fourier-family-and-duality/l31-duality-pairs)

## 12. Common mistakes

1. **A shift changes the magnitudes.** It does not. A shift only rotates each $X[k]$. The magnitude spectrum of a delayed signal is the same.
2. **The wrong sign of the phase.** A delay ($n_0 > 0$) gives the factor $e^{-i 2\pi k n_0/N}$, with a minus sign. `np.roll(x, 1)` is a delay by one sample.
3. **A squeeze squeezes the spectrum.** It stretches the spectrum. Narrow in time is wide in frequency.
4. **No $1/\lvert a \rvert$.** The squeezed signal has less area, so its spectrum is lower.
5. **One copy after a cosine.** A real cosine is two rotations, so it makes two half-size copies: at $+f_c$ and at $-f_c$.
6. **Reversal gives a negative spectrum.** Reversal of a real signal gives the conjugate spectrum. The magnitudes stay, and the phases change sign.

## 13. One-minute explanation

Every change to a signal in time has a partner change in frequency. If I delay a signal, each coefficient rotates by an angle that grows with the frequency, and no magnitude changes. If I squeeze a signal by a factor $a$, its spectrum stretches by $a$ and gets $a$ times lower. So a narrow signal has a wide spectrum. A rectangle gives a sinc, and by duality a sinc gives a rectangle, which is the ideal low-pass filter. A Gaussian of width $a$ gives a Gaussian of width $1/a$. If I multiply by a cosine, the spectrum moves to plus and minus the cosine frequency, with half the size. This explains AM radio and the shape of every windowed peak. If I play a real signal backwards, the spectrum becomes its conjugate. And the energy is the same in both domains.

## 14. Check questions

```check
{
  "question": "A signal is delayed by 5 samples (circularly). What happens to $\\lvert X[k] \\rvert$ and to the phase of $X[k]$?",
  "hint": "Find the magnitude of the factor $e^{-i 2\\pi k n_0/N}$.",
  "answer": "The magnitudes do not change, because the factor has magnitude 1. The phase of bin k changes by $-2\\pi k \\cdot 5/N$ radians. The change grows in proportion to k (linear phase)."
}
```

```check
{
  "question": "N = 8 and $X[1] = 4$, $X[2] = -2i$ (the teaching signal). Compute $Y[1]$ and $Y[2]$ for `np.roll(x, 2)`.",
  "hint": "The factor for bin k is $e^{-i 2\\pi k \\cdot 2/8} = e^{-i k\\pi/2}$.",
  "answer": "Bin 1: $e^{-i\\pi/2} = -i$, so $Y[1] = 4 \\cdot (-i) = -4i$. Bin 2: $e^{-i\\pi} = -1$, so $Y[2] = -2i \\cdot (-1) = 2i$. The magnitudes stay 4 and 2."
}
```

```check
{
  "question": "Why does a narrow pulse have a wide spectrum? Answer with the scaling pair, and then with the matching score.",
  "hint": "For the second answer: which probes give a score of almost 0 on a very short pulse?",
  "answer": "Scaling: $x(at) \\leftrightarrow \\frac{1}{\\lvert a \\rvert}X(f/a)$. A squeeze by $a$ moves every spectral value from $f$ to $af$, so the spectrum gets $a$ times wider. Matching score: a probe cancels on the pulse only when it makes about one full cycle or more inside the pulse. For a pulse of width $\\tau$ that needs $f \\ge 1/\\tau$. A short pulse needs a high frequency before any cancellation starts, so many frequencies get a large score."
}
```

```check
{
  "question": "A 300 Hz tone with amplitude 1 is multiplied by $\\cos(2\\pi \\cdot 1000 t)$. Which frequencies does the result contain, with which amplitudes?",
  "hint": "Use $\\cos A \\cos B = \\frac{1}{2}\\cos(A - B) + \\frac{1}{2}\\cos(A + B)$, or the modulation pair.",
  "answer": "The 300 Hz spectrum moves to $1000 \\pm 300$ Hz. The result is $0.5\\cos(2\\pi \\cdot 700 t) + 0.5\\cos(2\\pi \\cdot 1300 t)$: 700 Hz and 1300 Hz, each with amplitude 0.5. No energy stays at 300 Hz or at 1000 Hz."
}
```

```check
{
  "question": "A recording plays at 1.5 times its speed (simple resampling). A vowel had its first harmonic at 120 Hz. Where is it now? What happens to the length of a 0.6 s word?",
  "hint": "Use the scaling pair with a = 1.5.",
  "answer": "$x(1.5t) \\leftrightarrow \\frac{1}{1.5}X(f/1.5)$. A value at 120 Hz moves to $1.5 \\times 120 = 180$ Hz. The word lasts $0.6/1.5 = 0.4$ s."
}
```

## 15. Links

- Previous lesson: [L30: The four members of the family](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l30-the-four-members)
- Next lesson: [L32: The convolution theorem](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem)
- Part folder: [06 Fourier family and duality](/notes/maths/fft-signal-processing/06-fourier-family-and-duality)
- Two domains: [L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains)
- The phase of a coefficient: [L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe)
- The mirror: [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)
- Windows: [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)
- The Gibbs ripple: [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series)
- The pairs from integrals: [L29](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l29-fourier-transform)
- Narrow and wide as a limit: [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
