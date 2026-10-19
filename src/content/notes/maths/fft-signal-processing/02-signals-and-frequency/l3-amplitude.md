---
title: "L3: Amplitude"
order: 3
summary: "Amplitude is the height of the swing. It scales every value, it does not change the period, and it gives the peak, the RMS and the level in decibels."
status: not-started
tags: [signals, amplitude, rms, decibels, clipping]
---

## 1. The question this idea answers

Two sounds can repeat at the same speed, but one is louder. [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency) measured how fast a wave repeats. Which number measures how strong it is? And how does that number show in a list of samples?

That number is the **amplitude**. The FFT story needs it, because a spectrum reports how strong each frequency is (lesson L23). A voice agent also needs it. It must know when the signal is too weak to hear and when it is too strong to store.

## 2. Mental model

> [!analogy] A child on a swing
> Push a swing gently, and it swings low. Push it hard, and it swings high. But the time for one full swing stays about the same. The height of the swing is the amplitude. The time for one swing is the period.
>
> **Where it stops working:** a real swing slowly loses height, and a very high swing takes a little longer. A sine wave keeps the same amplitude for all time, and its period does not depend on the amplitude at all. Also, the height of a swing is a distance. The amplitude of a signal has the unit of the signal: pascals, volts, or a plain number in a computer.

## 3. Terms

| Term | Plain meaning |
|---|---|
| amplitude ($A$) | The height of the swing of a sine wave, from 0 to its top. It is never negative. |
| peak | The largest distance from 0 that the values reach. For a sine wave, the peak is $A$. |
| peak-to-peak | The distance from the lowest value to the highest value. For a sine wave, it is $2A$. |
| gain | A number that multiplies every value of a signal. A volume knob sets a gain. |
| mean | The sum of the values divided by the number of values. |
| RMS | Root mean square. Square each value, take the mean, then take the square root. For a sine wave over whole cycles, RMS $= A/\sqrt{2}$. |
| decibel (dB) | A unit that compares two amplitudes on a log scale: $20\log_{10}(A_2/A_1)$. |
| full scale | The largest value that the storage can hold. For 16-bit audio, the range is −32,768 to 32,767. |
| clipping | The storage keeps the limit for every value beyond full scale. The tops of the wave become flat. |

## 4. Amplitude in the formula

One pure oscillation has the formula

$$
x(t) = A \sin(2\pi f t + \varphi)
$$

Each symbol has one job:

1. $A$ is the amplitude. It sets the height.
2. $f$ is the frequency in hertz. It sets how fast the wave repeats (lesson L2).
3. $\varphi$ is the phase in radians. It sets where the cycle starts (lesson L4). On this page, $\varphi = 0$.

The sine of any angle lies between −1 and +1. Multiply by $A$, and the values lie between $-A$ and $+A$. So $A$ is the top of the wave, and $-A$ is the bottom.

> [!example] Worked example: three amplitudes at the same five angles
> | Angle $2\pi f t$ | $\sin$ | $A = 0.5$ | $A = 1$ | $A = 2$ |
> |---|---|---|---|---|
> | 0 | 0 | 0 | 0 | 0 |
> | $\pi/2$ (a quarter cycle) | 1 | 0.5 | 1 | 2 |
> | $\pi$ (a half cycle) | 0 | 0 | 0 | 0 |
> | $3\pi/2$ (three quarters) | −1 | −0.5 | −1 | −2 |
> | $2\pi$ (one full cycle) | 0 | 0 | 0 | 0 |
>
> Every column has its top at the same angle and its zeros at the same angles. Only the size of the values changes.

## 5. Amplitude scales every value

Take list B from lesson L2. It is one cycle of a sine in 8 samples: $B[n] = \sin(2\pi n/8)$. Now multiply every sample by 2, and then by 0.5.

| $n$ | $B[n]$ | $2B[n]$ | $0.5B[n]$ |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 1 | 0.71 | 1.41 | 0.35 |
| 2 | 1 | 2 | 0.5 |
| 3 | 0.71 | 1.41 | 0.35 |
| 4 | 0 | 0 | 0 |
| 5 | −0.71 | −1.41 | −0.35 |
| 6 | −1 | −2 | −0.5 |
| 7 | −0.71 | −1.41 | −0.35 |

> [!note] Rounded values
> On this page, 0.71 is $1/\sqrt{2} \approx 0.7071$ and 1.41 is $\sqrt{2} \approx 1.4142$, both rounded to two decimals. Every calculation uses the exact values.

These things stay the same:

1. The zeros stay at $n = 0$ and $n = 4$.
2. The top stays at $n = 2$, and the bottom stays at $n = 6$.
3. The sign of each sample stays the same.

Only the size of each value changes. The list $2B$ is the same wave as B, twice as high.

> [!key] Amplitude changes size, not timing
> A gain multiplies every value by the same number. The tops, the zeros and the bottoms stay at the same instants. A volume knob does exactly this.

### A mixture scales the same way

The mystery signal of lesson L1 has three components with amplitudes 1.0, 0.6 and 0.4. Multiply the whole signal by 0.5. Every value becomes half as large. So every component becomes half as large: the amplitudes become 0.5, 0.3 and 0.2. The frequencies stay 6, 14 and 24 Hz.

### A negative factor is a flip

Multiply a sine by −1, and every value changes sign. The tops become bottoms. This is the same wave moved by half a cycle:

$$
-\sin\theta = \sin(\theta + \pi)
$$

Check with $\theta = 0.3$: $-\sin(0.3) = -0.2955$ and $\sin(0.3 + \pi) = -0.2955$. So we keep $A \ge 0$ by convention. A minus sign goes into the phase (lesson L4) as $\pi$.

## 6. Amplitude does not change the period

The period $T$ is the time for one cycle (lesson L2). Move the time forward by $T = 1/f$, and see what happens to the angle:

$$
A\sin\big(2\pi f (t + T)\big) = A\sin(2\pi f t + 2\pi f T) = A\sin(2\pi f t + 2\pi) = A\sin(2\pi f t)
$$

The step $2\pi f T = 2\pi$ uses $fT = 1$. The last step uses one fact: the sine repeats after a full turn of $2\pi$. The amplitude $A$ is in front of the sine in every line. It never enters the angle. So $T = 1/f$ for every value of $A$.

> [!example] Worked example: A = 1 and A = 3 at f = 2 Hz
> | $t$ (s) | $\sin(2\pi \cdot 2t)$ | $3\sin(2\pi \cdot 2t)$ |
> |---|---|---|
> | 0 | 0 | 0 |
> | 0.125 | 1 | 3 |
> | 0.25 | 0 | 0 |
> | 0.375 | −1 | −3 |
> | 0.5 | 0 | 0 |
> | 0.625 | 1 | 3 |
>
> Both waves reach the top at $t = 0.125$ s and again at $t = 0.625$ s. So both have the period $0.625 - 0.125 = 0.5$ s, and the frequency $1/0.5 = 2$ Hz. The amplitude 3 changed only the height.

The same holds in samples. Use the counting method of lesson L2 on B and on $2B$. Each list starts at 0, moving up. Neither list returns to 0, moving up, inside its 8 samples. So both lists hold 1 cycle in 8 samples. List A of lesson L2 has the same amplitude as B, but A repeats every 4 samples. The height alone never tells the speed.

> [!trap] A taller wave is not a faster wave
> Height and speed are two separate numbers. Read the amplitude from the top value. Read the frequency from the count of samples in one cycle.

## 7. Peak, peak-to-peak and RMS

### Peak and peak-to-peak

The **peak** is the largest distance from 0. The **peak-to-peak** value is the highest value minus the lowest value. For a sine wave:

$$
\text{peak} = A \qquad \text{peak-to-peak} = A - (-A) = 2A
$$

For $2B$: the peak is 2. The peak-to-peak value is $2 - (-2) = 4$.

For a mixture, the peak is not the sum of the amplitudes. The mystery signal has amplitudes that add to 2.0, but its peak is only about 1.81 (lesson L1). Samples can also miss the true top. The 64 samples of the mystery signal at $f_s$ = 128 Hz reach only about 1.79, at sample 49.

### RMS: one number for the strength of all values

The plain mean of a sine wave over whole cycles is 0. The positive half and the negative half cancel. For B: $0 + 0.71 + 1 + 0.71 + 0 - 0.71 - 1 - 0.71 = 0$. So the mean cannot measure strength.

The RMS removes the signs first. It has three steps, in the reverse order of its name:

1. **Square** each value. A square is never negative.
2. Take the **mean** of the squares.
3. Take the square **root** of that mean. This returns to the unit of the signal.

$$
\text{RMS} = \sqrt{\frac{1}{N}\sum_{n=0}^{N-1} x[n]^2}
$$

The Σ sign means "add the terms for $n = 0$ to $N-1$" ([F3: Σ notation](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation)).

> [!example] Worked example: the RMS of 2B
> 1. The values are $0, \sqrt{2}, 2, \sqrt{2}, 0, -\sqrt{2}, -2, -\sqrt{2}$.
> 2. The squares are $0, 2, 4, 2, 0, 2, 4, 2$. They add to 16.
> 3. The mean of the squares is $16 / 8 = 2$.
> 4. The RMS is $\sqrt{2} \approx 1.41$.
>
> Compare with $A/\sqrt{2} = 2/\sqrt{2} = \sqrt{2}$. The two results are exactly equal.

> [!example] Worked example: the RMS of list A
> A = [0, 1, 0, −1, 0, 1, 0, −1]. The squares are [0, 1, 0, 1, 0, 1, 0, 1]. They add to 4. The mean is $4/8 = 0.5$. The RMS is $\sqrt{0.5} \approx 0.7071 = 1/\sqrt{2}$. Again RMS $= A/\sqrt{2}$, with $A = 1$.

### Why a sine wave gives exactly $A/\sqrt{2}$

1. For every angle, $\sin^2\theta + \cos^2\theta = 1$.
2. The cosine is the sine moved by a quarter cycle (lesson L4). So over whole cycles, $\sin^2$ and $\cos^2$ have the same mean.
3. Two equal means that add to 1 are each $1/2$. So the mean of $\sin^2$ over whole cycles is $1/2$.
4. The mean of $A^2\sin^2$ is then $A^2/2$. Its square root is $A/\sqrt{2} \approx 0.7071\,A$.

This result has two conditions:

- **Whole cycles.** Over 0.3 s of a 1 Hz sine with $A = 1$, the mean of $\sin^2$ is about 0.5780. The RMS is about 0.7602, not 0.7071.
- **A sine shape.** The clipped list [0, 1, 1, 1, 0, −1, −1, −1] in section 9 has peak 1, but its RMS is $\sqrt{6/8} \approx 0.8660$.

### The RMS of a mixture

For components with different frequencies, over whole cycles of each, the squares of the RMS values add:

$$
\text{RMS}^2 = \frac{A_1^2}{2} + \frac{A_2^2}{2} + \frac{A_3^2}{2}
$$

For the mystery signal: $\frac{1.0^2 + 0.6^2 + 0.4^2}{2} = \frac{1 + 0.36 + 0.16}{2} = 0.76$. So the RMS is $\sqrt{0.76} \approx 0.8718$. The RMS of its 64 samples gives the same number. Why do the squares simply add? The square of a sum also holds products of two different components. Over whole cycles, the mean of each such product is 0, because different frequencies are orthogonal ([L9: Basis and orthogonality](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality)).

> [!note] Why squares?
> The power that a signal delivers grows with the square of its value. For a voltage $V$ across a resistor $R$, the power is $V^2/R$. So the RMS measures the strength that matters for energy. A simple speech detector can compare the RMS of short pieces of audio with a threshold.

## 8. Loudness and decibels

**Loudness** is how strong a sound seems to a listener. It depends mainly on the amplitude. The ear also hears some frequencies as louder than others at the same amplitude. Audio tools compare amplitudes as ratios, on a log scale. The unit is the **decibel** (dB):

$$
L = 20\log_{10}\frac{A_2}{A_1} \ \text{dB}
$$

Here $A_1$ is the reference amplitude and $A_2$ is the amplitude that you compare with it. Use these steps:

1. Divide: ratio $= A_2 / A_1$.
2. Take $\log_{10}$ of the ratio.
3. Multiply by 20.

> [!example] Worked example: double the amplitude
> 1. Ratio $= 2$.
> 2. $\log_{10} 2 \approx 0.30103$.
> 3. $20 \times 0.30103 = 6.0206$, or about +6.02 dB.

| Amplitude ratio $A_2/A_1$ | Level in dB |
|---|---|
| 10 | +20 |
| 4 | +12.04 |
| 2 | +6.02 |
| 1 | 0 |
| $1/\sqrt{2} \approx 0.7071$ | −3.01 |
| 0.5 | −6.02 |
| 0.25 | −12.04 |
| 0.1 | −20 |

Two rules follow from the log:

1. **Gains in a chain add in dB.** Double, then double again, is ×4. In dB: $6.02 + 6.02 = 12.04$.
2. **A smaller amplitude gives a negative level.** The 14 Hz component of the mystery signal (0.6) is $20\log_{10}(0.6) \approx -4.44$ dB against the 6 Hz component (1.0). The 24 Hz component (0.4) is about −7.96 dB.

> [!trap] 20 for amplitude, 10 for power
> The basic decibel compares two powers: $10\log_{10}(P_2/P_1)$. Power grows with the square of amplitude. So $10\log_{10}(A_2^2/A_1^2) = 20\log_{10}(A_2/A_1)$. Double the power: +3.01 dB. Double the amplitude: +6.02 dB.

A decibel value always compares with a reference. "dB SPL" uses a reference air pressure. "dBFS" uses the full scale of the storage. Check which reference a tool uses before you compare two numbers.

## 9. Clipping

Storage has a fixed range. 16-bit audio stores integers from −32,768 to 32,767 (lesson L6). Floating-point audio often uses the range −1 to 1. If a value is outside the range, the storage keeps the limit instead. This is **clipping**.

> [!example] Worked example: A = 1.5 in a range of −1 to 1
> | $n$ | $1.5\sin(2\pi n/8)$ | Stored value |
> |---|---|---|
> | 0 | 0 | 0 |
> | 1 | 1.06 | 1 |
> | 2 | 1.5 | 1 |
> | 3 | 1.06 | 1 |
> | 4 | 0 | 0 |
> | 5 | −1.06 | −1 |
> | 6 | −1.5 | −1 |
> | 7 | −1.06 | −1 |
>
> Six of the eight samples hit the limit. The top and the bottom become flat. The stored list no longer has a sine shape.

The same happens with integers. A sine with amplitude 40,000 in 16-bit storage gives the stored list [0, 28284, 32767, 28284, 0, −28284, −32768, −28284].

Clipping changes more than the height. It adds new components that were not in the sound. Clip a 4 Hz sine with $A = 1.5$ at ±1. The result holds a new component at 12 Hz (amplitude about 0.18), and smaller ones at 20 Hz, 28 Hz and more. These are odd multiples of 4 Hz. A listener hears them as distortion. A speech recognizer receives frequencies that the speaker did not make.

> [!key] Clipping loses information
> The stored list holds only the limit. The true values above the limit are gone. A later gain cannot restore them. Keep the peak below full scale when you record.

## 10. Preview: what the DFT reports

Later, the DFT measures each component of a signal (lesson L11). For a sine with amplitude $A$ and a whole number of cycles in $N$ samples, the DFT reports the number $A \cdot N/2$, not $A$. For the mystery signal with $N = 64$:

| Component | $A$ | $A \cdot N/2$ |
|---|---|---|
| 6 Hz | 1.0 | 32 |
| 14 Hz | 0.6 | 19.2 |
| 24 Hz | 0.4 | 12.8 |

To get the amplitude back, compute $A = 2 \times (\text{reported value}) / N$. For example, $2 \times 19.2 / 64 = 0.6$. Lesson L23 explains this rule and its exceptions.

## 11. Graphs

The first graph shows one frequency with three amplitudes. The zeros of all three curves fall at the same instants.

```plot
{
  "title": "2 Hz with A = 0.5 (ink), A = 1 (blue), A = 2 (purple)",
  "xAxis": { "label": "time (s)", "domain": [0, 1] },
  "yAxis": { "label": "value", "domain": [-2.5, 2.5] },
  "disableZoom": true,
  "data": [
    { "fn": "0.5*sin(12.566*x)", "color": "#100D12" },
    { "fn": "sin(12.566*x)", "color": "#1E6091" },
    { "fn": "2*sin(12.566*x)", "color": "#6A4C93" }
  ]
}
```

The second graph shows the samples of B and $2B$. Each purple dot is twice the blue dot at the same $n$. The lines only join the dots to help the eye.

```plot
{
  "title": "B (blue) and 2B (purple): the same timing, twice the height",
  "xAxis": { "label": "sample number n", "domain": [-0.5, 7.5] },
  "yAxis": { "label": "sample value", "domain": [-2.5, 2.5] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0], [1, 0.7071], [2, 1], [3, 0.7071], [4, 0], [5, -0.7071], [6, -1], [7, -0.7071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0], [1, 0.7071], [2, 1], [3, 0.7071], [4, 0], [5, -0.7071], [6, -1], [7, -0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0], [1, 1.4142], [2, 2], [3, 1.4142], [4, 0], [5, -1.4142], [6, -2], [7, -1.4142]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true },
    { "points": [[0, 0], [1, 1.4142], [2, 2], [3, 1.4142], [4, 0], [5, -1.4142], [6, -2], [7, -1.4142]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true }
  ]
}
```

The third graph shows the peak and the RMS of one wave. The RMS line sits at $2/\sqrt{2} \approx 1.41$, below the peak.

```plot
{
  "title": "2·sin(2π·2t) (blue), peak 2 (ink), RMS 1.41 (gold)",
  "xAxis": { "label": "time (s)", "domain": [0, 1] },
  "yAxis": { "label": "value", "domain": [-2.5, 2.5] },
  "disableZoom": true,
  "data": [
    { "fn": "2*sin(12.566*x)", "color": "#1E6091" },
    { "fn": "2", "color": "#100D12" },
    { "fn": "1.4142", "color": "#B8860B" }
  ]
}
```

The fourth graph shows why the mean of $\sin^2$ is 1/2. The squared wave swings between 0 and 1, evenly around 0.5.

```plot
{
  "title": "sin²(2π·2t) (purple) and its mean 0.5 (ink)",
  "xAxis": { "label": "time (s)", "domain": [0, 1] },
  "yAxis": { "label": "value", "domain": [-0.2, 1.2] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(12.566*x)^2", "color": "#6A4C93" },
    { "fn": "0.5", "color": "#100D12" }
  ]
}
```

The last graph shows clipping. The ink curve is the true wave. The red curve is what storage with a limit of ±1 keeps.

```plot
{
  "title": "1.5·sin(2π·1t) (ink) and the stored values with a limit of ±1 (red)",
  "xAxis": { "label": "time (s)", "domain": [0, 1] },
  "yAxis": { "label": "value", "domain": [-2, 2] },
  "disableZoom": true,
  "data": [
    { "fn": "1.5*sin(6.2832*x)", "color": "#100D12" },
    { "points": [[0.0, 0.0], [0.02, 0.188], [0.04, 0.373], [0.06, 0.5522], [0.08, 0.7226], [0.1, 0.8817], [0.1161, 1], [0.3839, 1], [0.4, 0.8817], [0.42, 0.7226], [0.44, 0.5522], [0.46, 0.373], [0.48, 0.188], [0.5, 0.0], [0.52, -0.188], [0.54, -0.373], [0.56, -0.5522], [0.58, -0.7226], [0.6, -0.8817], [0.6161, -1], [0.8839, -1], [0.9, -0.8817], [0.92, -0.7226], [0.94, -0.5522], [0.96, -0.373], [0.98, -0.188], [1.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true }
  ]
}
```

## 12. Video

Watch how a change of amplitude stretches the wave up and down. Count the cycles before and after the change.

```video
{
  "src": "/notes/media/fft-signal-processing/course/02_What_Frequency_Means.mp4",
  "start": "0:20",
  "end": "0:29",
  "caption": "Amplitude is the height. A new amplitude stretches the wave but keeps its frequency."
}
```

## 13. Code

Write five small functions. Test each one against the hand results on this page.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude)

1. `peak(x)`: the largest absolute value.
2. `peak_to_peak(x)`: the highest value minus the lowest value.
3. `rms(x)`: the three steps of section 7. Do not call a ready-made RMS function.
4. `db(ratio)`: the level in dB of an amplitude ratio.
5. `count_at_limit(x, limit)`: the number of values whose absolute value equals the limit.

This line makes the stored list of section 9. It is the only NumPy call you need for clipping:

```python
stored = np.clip(1.5 * np.sin(2 * np.pi * n / 8), -1.0, 1.0)
```

Acceptance tests, with `n = np.arange(8)` and `C = 2 * np.sin(2 * np.pi * n / 8)`:

1. `np.isclose(peak(C), 2)` and `np.isclose(peak_to_peak(C), 4)` are True.
2. `np.isclose(rms(C), 2 / np.sqrt(2))` is True.
3. For the 64 samples of the mystery signal ($f_s$ = 128 Hz), `np.isclose(rms(x), np.sqrt(0.76))` is True.
4. For `t = np.arange(1000) / 1000` and `y = 3 * np.sin(2 * np.pi * 2 * t)`, `np.isclose(rms(y), 3 / np.sqrt(2))` is True.
5. `np.isclose(db(2), 6.0206, atol=1e-4)` and `np.isclose(db(0.1), -20)` are True.
6. `count_at_limit(stored, 1.0) == 6` is True.
7. `np.isclose(rms(0.5 * y), 0.5 * rms(y))` is True. A gain of 0.5 halves the RMS, and `db(0.5)` is about −6.02.

```check
{
  "question": "Stuck on `rms`? Reveal a hint.",
  "hint": "Follow the name from right to left: square, mean, root.",
  "answer": "Square the array (NumPy squares each value). Take the mean of the squared array. Take the square root of that one number. For 2B, the steps give 16/8 = 2, then $\\sqrt{2}$."
}
```

## 14. Common mistakes

1. **Amplitude for frequency.** The amplitude is the height. The frequency is how fast the wave repeats. A taller wave is not a faster wave.
2. **Peak-to-peak for amplitude.** For a sine, peak-to-peak is $2A$. The amplitude is the distance from 0 to the top.
3. **The mean for the strength.** The mean of a sine over whole cycles is 0. Use the RMS.
4. **$A/\sqrt{2}$ for every signal.** It holds for a sine over whole cycles. A clipped wave or a part of a cycle gives a different RMS.
5. **10 log for amplitudes.** Use $20\log_{10}$ for an amplitude ratio and $10\log_{10}$ for a power ratio.
6. **The peak of a mixture is the sum of the amplitudes.** The tops of the components do not meet at one instant.
7. **Clipping only makes the sound quieter.** Clipping removes the true values and adds new frequencies.

## 15. One-minute explanation

The amplitude $A$ is the height of a sine wave, from 0 to its top. In $A\sin(2\pi f t + \varphi)$, it multiplies every value by the same number. So it changes the size of the values, but the tops and zeros stay at the same instants. The period $1/f$ does not contain $A$, so the amplitude never changes the frequency. The peak of a sine is $A$, and its peak-to-peak value is $2A$. The RMS squares the values, takes the mean and then the square root. For a sine over whole cycles it is $A/\sqrt{2}$. To compare two amplitudes, use decibels: $20\log_{10}$ of the ratio. Double the amplitude, and the level grows by about 6.02 dB. If the amplitude exceeds the range of the storage, the tops clip. Clipping loses the true values and adds new frequencies.

## 16. Check questions

```check
{
  "question": "A sine wave has a peak-to-peak value of 3. What is its amplitude? What is its peak?",
  "hint": "Peak-to-peak runs from the bottom $-A$ to the top $+A$.",
  "answer": "Peak-to-peak $= 2A = 3$, so $A = 1.5$. The peak of a sine equals its amplitude: 1.5."
}
```

```check
{
  "question": "Compute the RMS of the list [0, 3, 0, −3] by hand. Compare it with $A/\\sqrt{2}$.",
  "hint": "Square, mean, root.",
  "answer": "Squares: 0, 9, 0, 9. Sum: 18. Mean: $18/4 = 4.5$. RMS: $\\sqrt{4.5} \\approx 2.1213$. The list is one cycle of a sine with $A = 3$, and $3/\\sqrt{2} \\approx 2.1213$. The two results are equal."
}
```

```check
{
  "question": "Why does a change of amplitude never change the period of a sine wave?",
  "hint": "Find where $A$ appears in $A\\sin(2\\pi f t)$, and what one cycle needs.",
  "answer": "One cycle ends when the angle $2\\pi f t$ grows by $2\\pi$. That needs a time $T = 1/f$. The amplitude stands outside the sine. It multiplies the result but never enters the angle. So $T = 1/f$ for every $A$. Example: $\\sin(2\\pi \\cdot 2t)$ and $3\\sin(2\\pi \\cdot 2t)$ both reach the top at 0.125 s and 0.625 s, so both have $T = 0.5$ s."
}
```

```check
{
  "question": "A speech recording reaches a peak of 0.25 in a range of −1 to 1. (a) How many dB below full scale is the peak? (b) Which gain changes the peak to 0.5, and how many dB is that gain?",
  "hint": "Use $20\\log_{10}$ of the amplitude ratio. $\\log_{10} 0.25 \\approx -0.60206$.",
  "answer": "(a) $20\\log_{10}(0.25/1) = 20 \\times (-0.60206) \\approx -12.04$ dB. (b) The gain is $0.5/0.25 = 2$. In dB: $20\\log_{10} 2 \\approx +6.02$ dB. The new peak is at about $-12.04 + 6.02 = -6.02$ dB."
}
```

```check
{
  "question": "A 16-bit recorder receives a sine with amplitude 40,000. What does it store at the top of each cycle? Name two effects of this.",
  "hint": "16-bit storage holds integers from −32,768 to 32,767.",
  "answer": "It stores 32,767 at the top and −32,768 at the bottom. The values beyond the limit become flat tops. Effect 1: the storage loses the true values, and a later gain cannot restore them. Effect 2: the flat tops add new frequency components (odd multiples of the sine frequency), which sound like distortion."
}
```

```check
{
  "question": "The DFT of the 64 mystery samples reports the value 12.8 for the 24 Hz component. Which amplitude does this give?",
  "hint": "The DFT reports $A \\cdot N/2$.",
  "answer": "$A = 2 \\times 12.8 / 64 = 25.6/64 = 0.4$. This matches the recipe of the mystery signal."
}
```

## 17. Links

- Previous: [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency)
- Next: [L4: Phase](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase)
- The mystery signal: [L1: What a signal is](/notes/maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is)
- 16-bit storage: [L6: Samples](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples)
- Σ notation: [F3: Σ notation](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation)
- Why the cross terms cancel: [L9: Basis and orthogonality](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality)
- Amplitudes from the DFT: [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)
- [02 Signals and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
