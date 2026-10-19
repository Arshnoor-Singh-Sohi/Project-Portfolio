---
title: "L4: Phase"
order: 4
summary: "Phase is where a wave is in its cycle at t = 0. It shifts the wave in time and never changes its frequency. The DFT measures it from a cosine."
status: not-started
tags: [signals, phase, radians, sine, cosine]
---

## 1. The question this idea answers

Two waves can have the same frequency and the same amplitude, and still be different. One starts at 0 and moves up. The other starts at its top. [L3: Amplitude](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude) and [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency) cannot tell them apart. Which number describes the difference?

That number is the **phase**. It is the third number of a pure oscillation, after frequency and amplitude. The FFT story needs it: the DFT reports a phase for every frequency (lesson L11), and you cannot rebuild a signal without it (lesson L5).

## 2. Mental model

> [!analogy] Two runners on a circular track
> Two runners run at the same speed on the same circular track. One runner starts a quarter lap ahead. Both runners need the same time for one lap. So they have the same frequency. The head start is the phase.
>
> The runner with the head start reaches every point of the track earlier. On a graph against time, its wave sits to the **left**.
>
> **Where it stops working:** on a track, a head start of 1.25 laps is more than a head start of 0.25 laps. For a wave, they are the same phase. Phase repeats after one full cycle, so only the fraction of a lap counts.

## 3. Terms

| Term | Plain meaning |
|---|---|
| phase ($\varphi$) | Where the wave is in its cycle at $t = 0$. It is an angle, in radians or degrees. |
| angle of the wave | The number inside the sine: $2\pi f t + \varphi$. It grows with time. |
| radian | The unit of angle in math and in code. One full cycle is $2\pi$ radians. |
| degree | A unit of angle. One full cycle is 360°. |
| time shift ($t_0$) | The time by which a phase moves a wave: $t_0 = \varphi / (2\pi f)$. Positive $t_0$ means earlier. |
| quarter cycle | One quarter of a full cycle: $\pi/2$ radians, or 90°. |
| cosine wave | $A\cos(2\pi f t + \varphi)$. It is a sine wave with $\pi/2$ more phase. |
| reference wave | The wave that we measure a phase from. Chapter 2 of the course uses a sine. The DFT uses a cosine. |

## 4. The angle inside the sine

One pure oscillation is

$$
x(t) = A\sin(\underbrace{2\pi f t + \varphi}_{\text{angle}})
$$

The angle has two parts. They do two different jobs:

1. $2\pi f t$ grows with time. Each second, it grows by $2\pi f$ radians. That is $f$ full cycles. So **the frequency is how fast the angle grows**.
2. $\varphi$ is a fixed number. At $t = 0$, the first part is 0, so the angle is $\varphi$. So **the phase is where the angle starts**.

You can picture the angle as a point that turns around a circle ([F2: Radians and the unit circle](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle)). The height of the point is the sine of the angle. The phase is the start position of the point. The frequency is the number of turns in each second.

![Alt text: three start angles on a circle, 0, π/2 and π, and the three 2 Hz waves that start from them](/notes/media/fft-signal-processing/figures/l4-phase-start-angle.svg)

> [!example] Worked example: the angle of a 2 Hz wave with $\varphi = \pi/2$
> | $t$ (s) | $2\pi \cdot 2 \cdot t$ | Angle $2\pi \cdot 2t + \pi/2$ | $\sin(\text{angle})$ |
> |---|---|---|---|
> | 0 | 0 | $\pi/2$ | 1 |
> | 0.125 | $\pi/2$ | $\pi$ | 0 |
> | 0.25 | $\pi$ | $3\pi/2$ | −1 |
> | 0.375 | $3\pi/2$ | $2\pi$ | 0 |
> | 0.5 | $2\pi$ | $2\pi + \pi/2$ | 1 |
>
> At $t = 0.5$ s, the angle has grown by exactly $2\pi$. The wave is back at its start: value 1, at the top. So one cycle still takes 0.5 s. The phase changed the start, not the time for one cycle.

## 5. Radians, degrees and cycles

Code and formulas use radians. People often say degrees. A third way is the fraction of a cycle.

| Radians | Degrees | Fraction of a cycle |
|---|---|---|
| 0 | 0° | 0 |
| $\pi/6 \approx 0.5236$ | 30° | 1/12 |
| $\pi/4 \approx 0.7854$ | 45° | 1/8 |
| $\pi/2 \approx 1.5708$ | 90° | 1/4 |
| $\pi \approx 3.1416$ | 180° | 1/2 |
| $3\pi/2 \approx 4.7124$ | 270° | 3/4 |
| $2\pi \approx 6.2832$ | 360° | 1 |

To change units, use these rules:

$$
\text{degrees} = \text{radians} \times \frac{180}{\pi} \qquad \text{fraction of a cycle} = \frac{\varphi}{2\pi}
$$

For example, 1 radian $= 180/\pi \approx 57.30°$.

### A phase repeats after $2\pi$

Add $2\pi$ to the phase, and the angle makes one extra full turn. The sine gives the same value. So $\varphi$ and $\varphi + 2\pi$ describe the same wave. For example, $5\pi/2 = 2\pi + \pi/2$ is the same phase as $\pi/2$. Also $3\pi/2$ (270°) is the same phase as $-\pi/2$ (−90°).

So we usually give a phase between $-\pi$ and $\pi$, which is −180° to 180°. NumPy uses the same range for `np.angle`.

> [!trap] Degrees inside `np.sin`
> `np.sin` reads its input as radians. `np.sin(90)` gives about 0.894, not 1. Write `np.sin(np.pi / 2)`, or change degrees first with `np.radians(90)`.

## 6. Same frequency, different phase

### At five instants

All four waves below have $f = 2$ Hz and $A = 1$. Only the phase differs.

| $t$ (s) | $\varphi = 0$ | $\varphi = \pi/2$ | $\varphi = \pi$ | $\varphi = -\pi/2$ |
|---|---|---|---|---|
| 0 | 0 | 1 | 0 | −1 |
| 0.125 | 1 | 0 | −1 | 0 |
| 0.25 | 0 | −1 | 0 | 1 |
| 0.375 | −1 | 0 | 1 | 0 |
| 0.5 | 0 | 1 | 0 | −1 |

Every column holds the values 0, 1, 0, −1 in a different order. Every column returns to its start value at $t = 0.5$ s. So every wave has the period 0.5 s and the frequency 2 Hz. The phases $0$ and $\pi$ both start at 0. The first moves up, and the second moves down.

### In a list of samples

Take 8 samples of a 1 Hz wave over 1 second, with $\varphi = 0$ and with $\varphi = \pi/2$:

| $n$ | B: $\sin(2\pi n/8)$ | D: $\sin(2\pi n/8 + \pi/2)$ |
|---|---|---|
| 0 | 0 | 1 |
| 1 | 0.71 | 0.71 |
| 2 | 1 | 0 |
| 3 | 0.71 | −0.71 |
| 4 | 0 | −1 |
| 5 | −0.71 | −0.71 |
| 6 | −1 | 0 |
| 7 | −0.71 | 0.71 |

> [!note] Rounded values
> On this page, 0.71 is $1/\sqrt{2} \approx 0.7071$ rounded to two decimals.

D holds the same values as B, two samples earlier: $D[n] = B[n + 2]$. For example, $D[0] = B[2] = 1$ and $D[1] = B[3] = 0.71$. At the end of the list, the pattern continues into the next cycle: $D[6] = B[8] = B[0] = 0$. Two samples out of 8 is a quarter cycle, and a quarter cycle is $\pi/2$.

### The start does not tell the speed

Compare D with list A of lesson L2: A = [0, 1, 0, −1, 0, 1, 0, −1]. D reaches its top at $n = 0$. A reaches its top only at $n = 1$. But count the samples in one cycle:

1. A starts at 0, moving up. It is at 0, moving up, again at $n = 4$. So one cycle takes 4 samples.
2. D starts at 1, the top. The top does not return inside the list. One cycle takes 8 samples.

So A is twice as fast as D. D reaches the top first only because of its phase.

> [!key] Phase is a start position, not a speed
> The phase sets where the cycle starts. The frequency sets how many samples one cycle takes. A change of phase never changes that count.

## 7. Phase as a time shift

Take $2\pi f$ out of the angle as a common factor:

$$
2\pi f t + \varphi = 2\pi f \left(t + \frac{\varphi}{2\pi f}\right)
$$

Call the new number $t_0$:

$$
t_0 = \frac{\varphi}{2\pi f}
$$

So $A\sin(2\pi f t + \varphi) = A\sin\big(2\pi f (t + t_0)\big)$. The shifted wave at time $t$ has the value that the $\varphi = 0$ wave has at the later time $t + t_0$.

### The sign rule

1. $\varphi > 0$ gives $t_0 > 0$. The wave reaches every point $t_0$ seconds **earlier**. On the graph, it sits $t_0$ to the **left**.
2. $\varphi < 0$ gives $t_0 < 0$. The wave reaches every point $\lvert t_0 \rvert$ seconds **later**. On the graph, it sits to the **right**.

> [!example] Worked example: f = 2 Hz, φ = +π/2 and φ = −π/2
> 1. $t_0 = \dfrac{\pi/2}{2\pi \cdot 2} = \dfrac{\pi/2}{4\pi} = \dfrac{1}{8} = 0.125$ s.
> 2. The $\varphi = 0$ wave reaches its top at $t = 0.125$ s.
> 3. The $\varphi = +\pi/2$ wave reaches its top at $t = 0$: 0.125 s **earlier**. Check: $\sin(0 + \pi/2) = 1$.
> 4. The $\varphi = -\pi/2$ wave has $t_0 = -0.125$ s. It reaches its top at $t = 0.25$ s: 0.125 s **later**. Check: $\sin(2\pi \cdot 2 \cdot 0.25 - \pi/2) = \sin(\pi - \pi/2) = \sin(\pi/2) = 1$.

> [!trap] Plus means earlier, and left
> A plus sign inside the sine moves the graph to the left, not to the right. Check the sign rule with one value, for example the instant of the first top.

### One phase, many time shifts

A phase is a fraction of a cycle. So the time shift also equals that fraction of the period:

$$
t_0 = \frac{\varphi}{2\pi} \times T
$$

The same phase gives a different time shift at each frequency. For $\varphi = \pi/2$, a quarter cycle:

| Frequency | Period $T$ | Time shift $t_0 = T/4$ |
|---|---|---|
| 2 Hz | 0.5 s | 0.125 s |
| 6 Hz | 0.1667 s | 0.0417 s |
| 100 Hz | 10 ms | 2.5 ms |
| 1000 Hz | 1 ms | 0.25 ms |

The reverse is also true. A delay of $d$ seconds gives a phase of $-2\pi f d$ at each frequency $f$. A delay of 1 ms gives −36° at 100 Hz, −180° at 500 Hz and −360° at 1000 Hz. A delay of one full period looks the same as no delay at all.

## 8. Sine and cosine are the same wave

The cosine is the sine with a quarter cycle more phase:

$$
\cos\theta = \sin\left(\theta + \frac{\pi}{2}\right)
$$

| $\theta$ | $\cos\theta$ | $\sin(\theta + \pi/2)$ |
|---|---|---|
| 0 | 1 | 1 |
| $\pi/6$ | 0.8660 | 0.8660 |
| $\pi/4$ | 0.7071 | 0.7071 |
| $\pi/3$ | 0.5 | 0.5 |
| 1 | 0.5403 | 0.5403 |

The sine reaches its top at $\theta = \pi/2$. The cosine reaches its top at $\theta = 0$, a quarter cycle earlier. So list D of section 6 is a 1 Hz cosine: $D[n] = \cos(2\pi n/8)$.

Two more rules come from the same idea:

1. $\sin\theta = \cos(\theta - \pi/2)$. A sine is a cosine with a quarter cycle less phase.
2. $-\sin\theta = \sin(\theta + \pi)$. A minus sign is half a cycle of phase (lesson L3).

> [!example] Worked example: a flipped list
> E = [0, −0.71, −1, −0.71, 0, 0.71, 1, 0.71] is B with every sign changed. So $E[n] = -\sin(2\pi n/8) = \sin(2\pi n/8 + \pi)$. E has the same frequency (1 cycle in 8 samples) and the same amplitude (1) as B. Its phase is $\pi$, or 180°.

## 9. Phase in a mixture

For one wave alone, the phase only moves the wave in time. In a mixture, each component has its own phase. A change of one phase changes the shape of the sum.

Take the mystery signal of lesson L1. Change only the phase of the 14 Hz component, from 0 to $\pi/2$:

| Property | All phases 0 | 14 Hz phase $\pi/2$ |
|---|---|---|
| Frequencies | 6, 14, 24 Hz | 6, 14, 24 Hz |
| Amplitudes | 1.0, 0.6, 0.4 | 1.0, 0.6, 0.4 |
| Value at $t = 0$ | 0 | $0.6\sin(\pi/2) = 0.6$ |
| Largest value | about 1.81 | about 1.92 |

The frequencies and the amplitudes are the same. The two signals are different. So a list of frequencies and amplitudes alone cannot rebuild a signal. You also need the phase of each component (lesson L5).

> [!note] Phase in speech systems
> Many speech recognizers keep only the strength of each frequency and drop the phase (lesson L36). To make a sound from strengths alone, for example in text-to-speech, a system must estimate or generate the phases (lesson L41).

## 10. The DFT measures phase from a cosine

Chapter 2 of the course measures phase on a sine: $A\sin(2\pi f t + \varphi)$. The DFT compares the signal with cosines and sines, and it reports the phase on a **cosine**. Write the same wave as a cosine. Use rule 1 of section 8:

$$
A\sin(2\pi f t + \varphi) = A\cos\left(2\pi f t + \varphi - \frac{\pi}{2}\right)
$$

So the phase on a cosine is $\varphi_{\cos} = \varphi - \pi/2$. The DFT reports $\varphi_{\cos}$.

| Wave | Phase on a sine | Phase that the DFT reports |
|---|---|---|
| $\sin(2\pi f t)$ | 0° | −90° |
| $\sin(2\pi f t + \pi/4)$ | 45° | −45° |
| $\cos(2\pi f t)$ | 90° | 0° |
| $-\sin(2\pi f t)$ | 180° | 90° |

> [!trap] A pure sine reports −90°
> The DFT of a pure sine reports the phase −90°. Both numbers are correct. Chapter 2 uses a sine as the reference wave, and the DFT uses a cosine. Always ask: phase measured from which wave?

> [!example] Worked example: the teaching signal
> The teaching signal is $x[n] = \cos(2\pi n/8) + 0.5\sin(2\pi \cdot 2n/8)$, with $N = 8$. NumPy gives $X[1] = 4$ and $X[2] = -2i$ (lesson L11 explains these numbers).
>
> 1. $X[1] = 4$ is a positive real number. Its phase is 0°. The 1-cycle component is a cosine.
> 2. $X[2] = -2i$ points straight down in the complex plane. Its phase is −90°. The 2-cycle component is a sine.
>
> The three components of the mystery signal are all sines. So the DFT reports −90° for each of them (lesson L23).

## 11. Graphs

The first graph shows one frequency with three phases. All three curves make 2 cycles in 1 second.

```plot
{
  "title": "2 Hz with φ = 0 (blue), φ = π/2 (ink), φ = π (purple)",
  "xAxis": { "label": "time (s)", "domain": [0, 1] },
  "yAxis": { "label": "value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(12.566*x)", "color": "#1E6091" },
    { "fn": "sin(12.566*x+1.5708)", "color": "#100D12" },
    { "fn": "sin(12.566*x+3.1416)", "color": "#6A4C93" }
  ]
}
```

The second graph shows the sign rule. The ink curve ($+\pi/2$) sits 0.125 s to the left of the blue curve. The red curve ($-\pi/2$) sits 0.125 s to the right.

```plot
{
  "title": "2 Hz with φ = 0 (blue), φ = +π/2 (ink, earlier), φ = −π/2 (red, later)",
  "xAxis": { "label": "time (s)", "domain": [0, 0.5] },
  "yAxis": { "label": "value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(12.566*x)", "color": "#1E6091" },
    { "fn": "sin(12.566*x+1.5708)", "color": "#100D12" },
    { "fn": "sin(12.566*x-1.5708)", "color": "#C81D25" }
  ]
}
```

The third graph shows lists B and D as dots. D is B, two samples earlier. The lines only join the dots to help the eye.

```plot
{
  "title": "B, φ = 0 (blue) and D, φ = π/2 (ink): 8 samples of the same 1 Hz wave",
  "xAxis": { "label": "sample number n", "domain": [-0.5, 7.5] },
  "yAxis": { "label": "sample value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0], [1, 0.7071], [2, 1], [3, 0.7071], [4, 0], [5, -0.7071], [6, -1], [7, -0.7071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0], [1, 0.7071], [2, 1], [3, 0.7071], [4, 0], [5, -0.7071], [6, -1], [7, -0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true },
    { "points": [[0, 1], [1, 0.7071], [2, 0], [3, -0.7071], [4, -1], [5, -0.7071], [6, 0], [7, 0.7071]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[0, 1], [1, 0.7071], [2, 0], [3, -0.7071], [4, -1], [5, -0.7071], [6, 0], [7, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true }
  ]
}
```

## 12. Video

Watch the phase shift. The amplitude and the frequency stay the same, and the wave slides a quarter cycle.

```video
{
  "src": "/notes/media/fft-signal-processing/course/02_What_Frequency_Means.mp4",
  "start": "0:29",
  "end": "0:36",
  "caption": "Phase is where the wave is in its cycle at time zero. The shift here is a quarter cycle."
}
```

Watch the summary of one pure oscillation. Name the three numbers before the narration names them.

```video
{
  "src": "/notes/media/fft-signal-processing/course/02_What_Frequency_Means.mp4",
  "start": "0:36",
  "end": "0:43",
  "caption": "Three numbers describe one pure oscillation: amplitude, frequency and phase."
}
```

## 13. Code

Write four small functions, then run one DFT experiment.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/02-signals-and-frequency/l4-phase)

1. `wave(A, f, phi, t)`: the values of $A\sin(2\pi f t + \varphi)$ at the times `t`.
2. `time_shift(phi, f)`: the time shift $t_0$ in seconds.
3. `to_degrees(phi)`: radians to degrees. Do not call `np.degrees`.
4. `wrap_phase(phi)`: the same phase, moved into the range $-\pi < \varphi \le \pi$.

Acceptance tests, with `t = np.linspace(0, 1, 101)`:

1. `np.allclose(wave(1, 2, np.pi / 2, t), np.cos(2 * np.pi * 2 * t))` is True.
2. `np.isclose(time_shift(np.pi / 2, 2), 0.125)` and `np.isclose(time_shift(np.pi / 2, 100), 0.0025)` are True.
3. `np.allclose(wave(1, 2, np.pi / 2, t), wave(1, 2, 0, t + time_shift(np.pi / 2, 2)))` is True.
4. `np.isclose(to_degrees(np.pi / 2), 90)` is True.
5. `np.isclose(wrap_phase(5 * np.pi / 2), np.pi / 2)` and `np.isclose(wrap_phase(3 * np.pi / 2), -np.pi / 2)` are True.

**DFT experiment.** These lines compute the DFT phase of one sine cycle in 8 samples:

```python
X = np.fft.fft(np.sin(2 * np.pi * np.arange(8) / 8))
print(np.angle(X[1], deg=True))
```

Before you run it, write your prediction. Then change the wave to a sine with phase $\pi/4$, and to a cosine. Predict each result first. Compare all three with the table in section 10.

```check
{
  "question": "Stuck on `wrap_phase`? Reveal a hint.",
  "hint": "Adding or removing whole turns of $2\\pi$ does not change the wave.",
  "answer": "Remove as many whole turns of $2\\pi$ as you need to reach the range. One way: shift the phase by $\\pi$, take the remainder after division by $2\\pi$, then shift back by $\\pi$. Test the edge case $\\varphi = \\pi$ by hand, because the range includes $\\pi$ but not $-\\pi$."
}
```

## 14. Common mistakes

1. **Phase is a second frequency.** The phase is a start position. It does not change the number of cycles in one second.
2. **The wave that reaches its top first is faster.** The first top shows the phase. Count the samples in one cycle to compare speeds.
3. **A positive phase moves the wave to the right.** A positive phase moves it to the left: every point comes earlier.
4. **One phase means one time shift.** The time shift is $\varphi/(2\pi f)$. The same phase gives a smaller shift at a higher frequency.
5. **Degrees inside `np.sin`.** NumPy uses radians. Change degrees to radians first.
6. **0 and $2\pi$ are different phases.** They describe the same wave.
7. **The DFT phase of a pure sine is 0.** The DFT measures from a cosine. A pure sine reports −90°.

## 15. One-minute explanation

The phase $\varphi$ tells where a wave is in its cycle at $t = 0$. In $A\sin(2\pi f t + \varphi)$, the angle grows by $2\pi f$ every second. That growth is the frequency. The phase is only the start angle. So two waves with the same frequency and amplitude but different phases have the same shape and speed, shifted in time. The shift is $t_0 = \varphi/(2\pi f)$, and a positive phase means earlier, to the left on a graph. A phase repeats after $2\pi$, so we give it between −180° and 180°. A cosine is a sine with 90° more phase. That matters for the DFT: it measures phase from a cosine, so a pure sine reports −90°. In a mixture, the phases change the shape of the sum. So you need them to rebuild a signal.

## 16. Check questions

```check
{
  "question": "What does the phase of a wave describe? Which units do we use for it?",
  "hint": "Think of the start position on the circle.",
  "answer": "The phase describes where the wave is in its cycle at $t = 0$: the start angle. We give it in radians (a full cycle is $2\\pi$) or in degrees (a full cycle is 360°). It does not change the frequency or the amplitude."
}
```

```check
{
  "question": "A 5 Hz wave has the phase $\\varphi = \\pi/2$. Compute its time shift $t_0$. Is the wave earlier or later than the wave with $\\varphi = 0$? What is its value at $t = 0$ if $A = 3$?",
  "hint": "$t_0 = \\varphi / (2\\pi f)$.",
  "answer": "$t_0 = \\dfrac{\\pi/2}{2\\pi \\cdot 5} = \\dfrac{\\pi/2}{10\\pi} = \\dfrac{1}{20} = 0.05$ s. The phase is positive, so the wave is 0.05 s earlier (to the left on a graph). Check with the period: $T = 0.2$ s, and a quarter of 0.2 s is 0.05 s. At $t = 0$: $3\\sin(\\pi/2) = 3$, the top."
}
```

```check
{
  "question": "Why can we say that a sine and a cosine of the same frequency are the same wave?",
  "hint": "Compare where each one has its top.",
  "answer": "$\\cos\\theta = \\sin(\\theta + \\pi/2)$ for every angle. So a cosine is a sine with $\\pi/2$ more phase. It has the same frequency, the same amplitude and the same shape. It is only a quarter cycle earlier: the cosine has its top at $\\theta = 0$, the sine at $\\theta = \\pi/2$. Check: $\\cos(\\pi/3) = 0.5$ and $\\sin(\\pi/3 + \\pi/2) = \\sin(5\\pi/6) = 0.5$."
}
```

```check
{
  "question": "E = [0, −0.71, −1, −0.71, 0, 0.71, 1, 0.71] and B = [0, 0.71, 1, 0.71, 0, −0.71, −1, −0.71]. Do E and B have the same frequency? What is the phase of E on a sine?",
  "hint": "Count the samples in one cycle of each. Then compare the signs.",
  "answer": "Yes. Each list makes 1 cycle in 8 samples. Every value of E is the value of B with the sign changed. $-\\sin\\theta = \\sin(\\theta + \\pi)$, so the phase of E is $\\pi$, or 180°. The phase changed. The frequency and the amplitude did not."
}
```

```check
{
  "question": "A 250 Hz tone arrives 2 ms late. Which phase does the delay give at 250 Hz? What happens to every value of the tone?",
  "hint": "A delay $d$ gives the phase $-2\\pi f d$.",
  "answer": "$-2\\pi \\cdot 250 \\cdot 0.002 = -\\pi$, or −180°. The period is $1/250 = 4$ ms, so 2 ms is half a cycle. A phase of $-\\pi$ is the same as $+\\pi$, and $\\sin(\\theta - \\pi) = -\\sin\\theta$. So every value changes sign: the tops become bottoms."
}
```

```check
{
  "question": "The DFT of $3\\cos(2\\pi \\cdot 50t)$, sampled over whole cycles, reports which phase? What does chapter 2 call the phase of the same wave?",
  "hint": "Chapter 2 measures from a sine. The DFT measures from a cosine.",
  "answer": "The DFT measures from a cosine, and the wave is a cosine with no shift. So it reports 0°. Chapter 2 writes $3\\cos(2\\pi \\cdot 50t) = 3\\sin(2\\pi \\cdot 50t + \\pi/2)$, so its phase is $\\pi/2$, or 90°. The difference of 90° comes only from the reference wave."
}
```

## 17. Links

- Previous: [L3: Amplitude](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude)
- Next: [L5: Two domains](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains)
- Counting cycles: [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency)
- Angles on a circle: [F2: Radians and the unit circle](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle)
- Phase from a complex number: [F5: Complex numbers](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)
- The DFT phase: [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)
- Phases of the mystery signal: [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)
- [02 Signals and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
