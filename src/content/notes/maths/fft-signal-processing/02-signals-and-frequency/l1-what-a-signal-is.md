---
title: "L1: What a signal is"
order: 1
summary: "A signal is a value that changes over time. Simple waves add point by point, and the course asks how to un-mix the sum."
status: not-started
tags: [signals, sine-wave, components, mixture]
---

## 1. The question this idea answers

You speak into a microphone. The computer receives one long list of numbers. What does each number describe? And if your voice is a mixture of many simple waves, how do we find those waves again?

This lesson gives the first answer. A **signal** is a value that changes over time. One value describes one instant only. Many simple waves can add into one signal, point by point. The whole course answers one question: given only the sum, which simple waves made it?

You need [F1: Reading graphs](/notes/maths/fft-signal-processing/01-math-foundations/f1-graphs) for the value-against-time pictures on this page. The next lesson, [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency), measures how fast a wave repeats.

## 2. Mental model

> [!analogy] A pen on a moving paper strip
> A pen moves only up and down. A strip of paper moves under the pen at a constant speed. The pen draws a line. The height of the line at each place is the value at that instant. This line is the signal.
>
> Now three hands push the same pen at the same time. Each hand moves up and down at its own speed. The pen moves by the sum of the three pushes. The paper shows only the total. You cannot see the three hands in the line.
>
> **Where it stops working:** a pen draws a value at every instant. A computer stores the value only at equal time steps (lesson L6). Also, real hands can push in any pattern. In this course, each "hand" is a pure sine wave with one frequency, one amplitude and one phase.

## 3. Terms

| Term | Plain meaning |
|---|---|
| signal | A quantity that changes over time, for example air pressure at a microphone or the voltage of the microphone. |
| time ($t$) | The instant at which we read the signal, in seconds. $t = 0$ is the start of the recording. |
| $x(t)$ | "The value of the signal $x$ at time $t$." It is not $x$ multiplied by $t$. |
| continuous signal | A signal that has a value at every instant, for example the real air pressure. |
| sine wave | The simplest smooth oscillation. It repeats the same shape again and again. Its formula is $A\sin(2\pi f t + \varphi)$. |
| component | One simple wave inside a mixture. |
| composite signal | A signal that is a sum of several components. |
| point-by-point addition | At each instant, add the values of the components. The result is the value of the sum at that instant. |
| Fourier analysis | The method that finds the components of a signal: their frequencies, amplitudes and phases. |
| FFT | Fast Fourier transform. A fast method to compute the result of Fourier analysis from samples. Part 04 explains it. |

## 4. A signal is a value at each instant

A signal has one value at each instant. We write the value as $x(t)$. Read it aloud as "x at t". The letter $x$ is the name of the signal. The letter $t$ is the time in seconds.

The value has a unit. Air pressure has the unit pascal (Pa). A microphone voltage has the unit volt (V). Inside a computer, code often scales the values into numbers from −1 to 1 (lesson L6).

> [!example] Worked example: read a 2 Hz sine at five instants
> Take $x(t) = \sin(2\pi \cdot 2t)$. This is the 2 Hz wave of lesson L2. To get a value, put a time into the formula. The number inside the sine is an angle in radians.
>
> | $t$ (s) | Angle $2\pi \cdot 2 \cdot t$ | $x(t)$ |
> |---|---|---|
> | 0 | 0 | 0 |
> | 0.125 | $\pi/2$ | 1 |
> | 0.25 | $\pi$ | 0 |
> | 0.375 | $3\pi/2$ | −1 |
> | 0.5 | $2\pi$ | 0 |
>
> Each row is one instant and one number. The wave makes one full cycle from $t = 0$ to $t = 0.5$ s.

### One value tells you nothing about the pattern

One value is a snapshot of one instant. It does not tell the frequency, the amplitude or the pitch. These describe the **pattern** of many values. The table below shows three different waves. Each wave has the value 1 at one instant.

| Wave | Frequency | Amplitude | Instant | Value |
|---|---|---|---|---|
| $\sin(2\pi \cdot 2t)$ | 2 Hz | 1 | $t = 0.125$ s | $\sin(\pi/2) = 1$ |
| $\sin(2\pi \cdot 6t)$ | 6 Hz | 1 | $t = 1/24$ s | $\sin(\pi/2) = 1$ |
| $2\sin(2\pi \cdot 1t)$ | 1 Hz | 2 | $t = 1/12$ s | $2\sin(\pi/6) = 2 \times 0.5 = 1$ |

The value 1 appears in a 1 Hz, a 2 Hz and a 6 Hz wave. It appears with amplitude 1 and with amplitude 2. So the value 1 alone cannot tell you which wave you have.

> [!key] One value, one instant
> A value of a signal describes one instant only. Frequency (L2), amplitude (L3) and phase (L4) describe how a series of values changes over time. You need many values to measure them.

## 5. Where a voice signal comes from

A voice signal starts as a change of air pressure. These steps change it into numbers:

1. Your voice pushes the air. The air pressure becomes a little higher, then a little lower, again and again.
2. A microphone has a thin membrane. The pressure changes move the membrane.
3. The microphone changes the movement into a voltage. The voltage follows the pressure. This voltage is the signal $x(t)$.
4. A converter measures the voltage at equal time steps. It stores each measurement as a number. Lesson L6 explains this step.

```mermaid
flowchart LR
    A[Voice] --> B["Air pressure"]
    B --> C[Microphone]
    C --> D["Voltage x(t)"]
    D --> E["Converter (L6)"]
    E --> F["Numbers x[n]"]
```

Normal air pressure is about 101,325 Pa. A sound changes the pressure by a very small fraction of this value. The microphone responds only to the change. So we draw the signal around 0: above 0 means "higher than normal", below 0 means "lower than normal".

> [!note] Continuous signal and samples
> The air pressure has a value at every instant. This is a continuous signal $x(t)$. The computer keeps only the values at equal time steps. These values are the samples $x[n]$. Round brackets hold a time. Square brackets hold a sample number. Lesson L6 shows that a signal is not the same as its samples.

## 6. Add waves point by point

To add two signals, add their values at each instant:

$$
s(t) = a(t) + b(t) \quad \text{for every instant } t
$$

For example, at one instant wave $a$ has the value 0.5 and wave $b$ has the value −0.2. The sum at that instant is $0.5 + (-0.2) = 0.3$.

> [!example] Worked example: the teaching signal of this course
> The course uses $x[n] = \cos(2\pi n/8) + 0.5\sin(2\pi \cdot 2n/8)$ with $n = 0, 1, \dots, 7$. Here $n$ counts 8 equally spaced instants. The first component makes 1 cycle in the 8 instants. The second makes 2 cycles and has half the height.
>
> | $n$ | $\cos(2\pi n/8)$ | $0.5\sin(2\pi \cdot 2n/8)$ | Sum |
> |---|---|---|---|
> | 0 | 1 | 0 | 1 |
> | 1 | 0.71 | 0.5 | 1.21 |
> | 2 | 0 | 0 | 0 |
> | 3 | −0.71 | −0.5 | −1.21 |
> | 4 | −1 | 0 | −1 |
> | 5 | −0.71 | 0.5 | −0.21 |
> | 6 | 0 | 0 | 0 |
> | 7 | 0.71 | −0.5 | 0.21 |
>
> Row 1 in detail: $\cos(2\pi/8) = \cos(\pi/4) = 1/\sqrt{2} \approx 0.7071$. Next, $0.5\sin(2\pi \cdot 2/8) = 0.5\sin(\pi/2) = 0.5$. The sum is $0.7071 + 0.5 = 1.2071$, or 1.21 after rounding to two decimals.

> [!note] Rounded values
> On this page, 0.71 is $1/\sqrt{2} \approx 0.7071$ rounded to two decimals. The sums use the unrounded values, then round.

### What addition does, and what it does not do

1. **The values add.** At each instant, the sum is the total of the component values.
2. **The frequencies do not add.** A 1-cycle wave plus a 2-cycle wave is not a 3-cycle wave. The sum above repeats every 8 instants, the same as its slowest component. Each component keeps its own frequency inside the sum.
3. **Values can cancel.** At $n = 2$ both components are 0. At $n = 5$, −0.71 and 0.5 cancel in part, and the sum is only −0.21.

> [!trap] The sum is not a new kind of wave
> The sum looks like a new, irregular wave. It is not. It is only the components, added at each instant. Nothing else happens in the addition.

## 7. The mystery signal and the un-mixing question

Chapter 1 of the course builds this signal from three sine waves:

$$
x(t) = 1.0\sin(2\pi \cdot 6t) + 0.6\sin(2\pi \cdot 14t) + 0.4\sin(2\pi \cdot 24t), \qquad 0 \le t < 0.5 \text{ s}
$$

| Component | Frequency $f$ | Amplitude $A$ | Period $T = 1/f$ | Cycles in 0.5 s |
|---|---|---|---|---|
| 1 | 6 Hz | 1.0 | 0.1667 s | 3 |
| 2 | 14 Hz | 0.6 | 0.0714 s | 7 |
| 3 | 24 Hz | 0.4 | 0.0417 s | 12 |

### The sum at five instants

To get one value of the sum, compute each component at that instant. Then add the three values. The table rounds the values to four decimals.

| $t$ (s) | $1.0\sin(2\pi \cdot 6t)$ | $0.6\sin(2\pi \cdot 14t)$ | $0.4\sin(2\pi \cdot 24t)$ | $x(t)$ |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 |
| 0.01 | 0.3681 | 0.4623 | 0.3992 | 1.2296 |
| 1/24 | 1 | −0.3 | 0 | 0.7 |
| 0.1 | −0.5878 | 0.3527 | 0.2351 | 0 |
| 0.125 | −1 | −0.6 | 0 | −1.6 |

> [!example] Worked example: $t = 1/24$ s, exactly
> 1. 6 Hz: the angle is $2\pi \cdot 6 \cdot \frac{1}{24} = \frac{\pi}{2}$. So $1.0\sin(\pi/2) = 1$.
> 2. 14 Hz: the angle is $2\pi \cdot 14 \cdot \frac{1}{24} = \frac{7\pi}{6}$. So $0.6\sin(7\pi/6) = 0.6 \times (-0.5) = -0.3$.
> 3. 24 Hz: the angle is $2\pi \cdot 24 \cdot \frac{1}{24} = 2\pi$. So $0.4\sin(2\pi) = 0$.
> 4. Add: $1 + (-0.3) + 0 = 0.7$.

At $t = 0.1$ s the three values cancel exactly: $-0.5878 + 0.3527 + 0.2351 = 0$. The sum is 0, but all three components are present at that instant.

### The sum does not show its parts

The amplitudes add to $1.0 + 0.6 + 0.4 = 2.0$. But the largest value of the sum is only about 1.81, at about $t = 0.381$ s. The three tops never happen at the same instant. So you cannot read the amplitudes from the height of the sum.

The sum repeats every 0.5 s. The reason: 0.5 s holds a whole number of cycles of each component (3, 7 and 12). Inside those 0.5 s, the shape has no simple pattern that shows 6, 14 or 24 Hz.

### The question of the whole course

Suppose you receive only the mixture. You do not know the recipe. Can you find the components again? For each component you want three numbers:

1. Which frequency? (lesson L2)
2. How strong: which amplitude? (lesson L3)
3. How shifted: which phase? (lesson L4)

**Fourier analysis** answers this question. The DFT computes the answer from a list of samples (lesson L11). The **FFT** computes the same answer much faster (part 04). Lesson L23 returns to this exact signal and reads 6, 14 and 24 Hz from its spectrum.

```mermaid
flowchart LR
    A["Mixture x(t)"] --> B["Samples x[n] (L6)"]
    B --> C["Matching score (L7)"]
    C --> D["DFT (L11)"]
    D --> E["FFT (part 04)"]
    E --> F["6, 14, 24 Hz (L23)"]
```

> [!key] The un-mixing question
> A composite signal is its components added point by point. Fourier analysis finds the frequency, amplitude and phase of each component from the sum alone.

### Why a voice agent needs this

Speech is a mixture too. A vowel holds many components at the same time. A speech recognizer does not read the raw values one by one. It measures how strong each frequency is in short pieces of the signal (lessons L34 to L36). That measurement is Fourier analysis.

## 8. Graphs

The first graph shows the three components. Each one is a simple, regular wave.

```plot
{
  "title": "Components: 6 Hz, A = 1.0 (ink), 14 Hz, A = 0.6 (purple), 24 Hz, A = 0.4 (gold)",
  "xAxis": { "label": "time (s)", "domain": [0, 0.5] },
  "yAxis": { "label": "value", "domain": [-2.2, 2.2] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(37.699*x)", "color": "#100D12" },
    { "fn": "0.6*sin(87.965*x)", "color": "#6A4C93" },
    { "fn": "0.4*sin(150.796*x)", "color": "#B8860B" }
  ]
}
```

The second graph builds the sum in two steps. First 6 Hz alone, then 6 Hz plus 14 Hz.

```plot
{
  "title": "6 Hz alone (ink) and 6 Hz + 14 Hz (purple)",
  "xAxis": { "label": "time (s)", "domain": [0, 0.5] },
  "yAxis": { "label": "value", "domain": [-2.2, 2.2] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(37.699*x)", "color": "#100D12" },
    { "fn": "sin(37.699*x)+0.6*sin(87.965*x)", "color": "#6A4C93" }
  ]
}
```

The third graph shows the full mystery signal. A receiver has only this blue curve.

```plot
{
  "title": "The mystery signal x(t) (blue): the sum of all three components",
  "xAxis": { "label": "time (s)", "domain": [0, 0.5] },
  "yAxis": { "label": "value", "domain": [-2.2, 2.2] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(37.699*x)+0.6*sin(87.965*x)+0.4*sin(150.796*x)", "color": "#1E6091" }
  ]
}
```

The last graph shows the point-by-point addition of the teaching signal at its 8 instants. Each blue dot is the ink dot plus the purple dot at the same $n$. The lines only join the dots to help the eye.

```plot
{
  "title": "cos(2πn/8) (ink) + 0.5·sin(2π·2n/8) (purple) = sum (blue)",
  "xAxis": { "label": "instant n", "domain": [-0.5, 7.5] },
  "yAxis": { "label": "value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 1], [1, 0.7071], [2, 0], [3, -0.7071], [4, -1], [5, -0.7071], [6, 0], [7, 0.7071]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[0, 1], [1, 0.7071], [2, 0], [3, -0.7071], [4, -1], [5, -0.7071], [6, 0], [7, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true },
    { "points": [[0, 0], [1, 0.5], [2, 0], [3, -0.5], [4, 0], [5, 0.5], [6, 0], [7, -0.5]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true },
    { "points": [[0, 0], [1, 0.5], [2, 0], [3, -0.5], [4, 0], [5, 0.5], [6, 0], [7, -0.5]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true },
    { "points": [[0, 1], [1, 1.2071], [2, 0], [3, -1.2071], [4, -1], [5, -0.2071], [6, 0], [7, 0.2071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 1], [1, 1.2071], [2, 0], [3, -1.2071], [4, -1], [5, -0.2071], [6, 0], [7, 0.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true }
  ]
}
```

## 9. Video

Watch the definition of a signal and the first simple wave.

```video
{
  "src": "/notes/media/fft-signal-processing/course/01_The_Mystery_of_a_Signal.mp4",
  "start": "0:00",
  "end": "0:15",
  "caption": "A signal is a quantity that changes over time. The first component is one sine wave."
}
```

Watch how each new component adds to the curve, instant by instant.

```video
{
  "src": "/notes/media/fft-signal-processing/course/01_The_Mystery_of_a_Signal.mp4",
  "start": "0:15",
  "end": "0:29",
  "caption": "A faster, smaller wave and then a third wave add to the first, point by point."
}
```

Listen for the three things the course wants to recover: frequency, strength and shift.

```video
{
  "src": "/notes/media/fft-signal-processing/course/01_The_Mystery_of_a_Signal.mp4",
  "start": "0:29",
  "end": "0:47",
  "caption": "The un-mixing question. Fourier analysis answers it, and the FFT computes the answer fast."
}
```

## 10. Code

Build the mystery signal yourself in NumPy. Then write point-by-point addition with a loop.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is)

### Exercise 1: the mystery signal

Write `mystery(fs, N)`. It returns two arrays: the times `t` and the values `x` of the mystery signal at those times. Use the sample rate `fs` and the number of values `N`. The times are $t = n / f_s$ for $n = 0, 1, \dots, N-1$. This line makes the sample numbers:

```python
n = np.arange(N)   # 0, 1, ..., N-1
```

Acceptance tests, with `t, x = mystery(128, 64)`:

1. `x.shape == (64,)` is True.
2. `t[1] == 1/128` and `t[-1] == 0.4921875` are True. The last value comes one time step before 0.5 s.
3. `abs(x[0]) < 1e-12` is True. All three components start at 0.
4. `np.isclose(x[16], -1.6)` is True. Sample 16 is at $t = 0.125$ s, the last row of the table in section 7.
5. `np.isclose(x[1], 1.0405, atol=1e-4)` is True.
6. `np.max(np.abs(x)) < 2.0` is True.

### Exercise 2: point-by-point addition

Write `add_point_by_point(a, b)` with a `for` loop. Do not use `a + b` on whole arrays. If the lengths differ, raise a `ValueError`.

Acceptance tests:

1. For the two components of the teaching signal, the result matches `np.asarray(a) + np.asarray(b)` (use `np.allclose`).
2. `add_point_by_point([0.5], [-0.2])` gives `[0.3]` (use `np.allclose`).
3. `add_point_by_point([1, 2], [1])` raises `ValueError`.

```check
{
  "question": "Stuck on Exercise 1? Reveal a hint.",
  "hint": "Build the times first. Every component uses the same times.",
  "answer": "Make `t` from `n` and `fs`. Each component is its amplitude times `np.sin(2 * np.pi * f * t)`. Add the three arrays. NumPy adds arrays point by point, the same rule as section 6."
}
```

## 11. Common mistakes

1. **One value tells the pitch.** One value describes one instant. Pitch follows the frequency, and the frequency needs the pattern of many values.
2. **Frequencies add.** A 6 Hz wave plus a 14 Hz wave is not a 20 Hz wave. The values add. Each component keeps its own frequency.
3. **The sum is a new kind of wave.** The sum is only the components, added at each instant.
4. **The highest value of the sum equals the sum of the amplitudes.** The tops of the components do not meet at the same instant. The mystery signal reaches only about 1.81, not 2.0.
5. **$x(t)$ means $x$ times $t$.** $x(t)$ is the value of the signal $x$ at the time $t$.
6. **A value of 0 means silence.** At $t = 0.1$ s the mystery signal is 0, but all three components are present. They cancel only at that instant.

## 12. One-minute explanation

A signal is a quantity that changes over time, for example the air pressure at a microphone or the microphone voltage. We write its value at time $t$ as $x(t)$. One value describes one instant only, so it cannot tell the frequency or the pitch. Simple sine waves can add into one signal: at every instant, you add their values. The frequencies do not add. Each component keeps its own frequency inside the sum. The mystery signal of the course is a 6 Hz, a 14 Hz and a 24 Hz sine with amplitudes 1.0, 0.6 and 0.4. Its shape hides the three components. The whole course answers one question: from the sum alone, find the frequency, amplitude and phase of each component. Fourier analysis answers it, and the FFT computes the answer fast.

## 13. Check questions

```check
{
  "question": "What is a signal? Give two signals that exist in a voice call before the computer stores any number.",
  "hint": "Follow the sound from the mouth to the microphone.",
  "answer": "A signal is a quantity that changes over time. Two examples: the air pressure at the microphone, and the voltage that the microphone makes. Both have a value at every instant."
}
```

```check
{
  "question": "Compute the mystery signal $x(t) = 1.0\\sin(2\\pi \\cdot 6t) + 0.6\\sin(2\\pi \\cdot 14t) + 0.4\\sin(2\\pi \\cdot 24t)$ at $t = 1/12$ s. Show each component.",
  "hint": "Compute each angle $2\\pi f t$ first. Then use $\\sin(\\pi/3) \\approx 0.8660$.",
  "answer": "6 Hz: angle $2\\pi \\cdot 6/12 = \\pi$, so $1.0\\sin(\\pi) = 0$. 14 Hz: angle $2\\pi \\cdot 14/12 = 7\\pi/3 = 2\\pi + \\pi/3$, so $0.6\\sin(\\pi/3) = 0.6 \\times 0.8660 = 0.5196$. 24 Hz: angle $2\\pi \\cdot 24/12 = 4\\pi$, so $0.4\\sin(4\\pi) = 0$. Sum: $0 + 0.5196 + 0 = 0.5196$, about 0.52."
}
```

```check
{
  "question": "A recording holds the value 1 at one instant. Why can this one value not tell you the pitch of the sound?",
  "hint": "Find two waves with different frequencies that both have the value 1 at some instant.",
  "answer": "One value describes one instant only. Pitch follows the frequency, and the frequency describes how the values repeat over time. For example, $\\sin(2\\pi \\cdot 2t)$ is 1 at $t = 0.125$ s, and $\\sin(2\\pi \\cdot 6t)$ is 1 at $t = 1/24$ s. Two different frequencies give the same value. You need many values to count the cycles."
}
```

```check
{
  "question": "At one instant, wave a has the value 0.5 and wave b has the value −0.2. What is the value of a + b at that instant?",
  "hint": "Add the values at the same instant.",
  "answer": "$0.5 + (-0.2) = 0.3$."
}
```

```check
{
  "question": "A new signal is $y(t) = 2\\sin(2\\pi \\cdot 3t) + 0.5\\sin(2\\pi \\cdot 10t)$. (a) What answer must Fourier analysis give for y? (b) Is y a 13 Hz wave? (c) Compute $y(1/12)$.",
  "hint": "List the frequency, amplitude and phase of each component. For (c), the angles are $\\pi/2$ and $5\\pi/3$.",
  "answer": "(a) Two components: 3 Hz with amplitude 2, and 10 Hz with amplitude 0.5. Both have phase 0 on a sine. (b) No. The values add, not the frequencies. y holds a 3 Hz and a 10 Hz component. (c) $2\\sin(2\\pi \\cdot 3/12) = 2\\sin(\\pi/2) = 2$. $0.5\\sin(2\\pi \\cdot 10/12) = 0.5\\sin(5\\pi/3) = 0.5 \\times (-0.8660) = -0.4330$. Sum: $2 - 0.4330 = 1.5670$."
}
```

## 14. Links

- Previous in the story: [F1: Reading graphs](/notes/maths/fft-signal-processing/01-math-foundations/f1-graphs)
- Next: [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency)
- Amplitude: [L3: Amplitude](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude)
- Phase: [L4: Phase](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase)
- The recipe of the mystery signal: [L5: Two domains](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains)
- What the computer stores: [L6: Samples](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples)
- The answer for the mystery signal: [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)
- [02 Signals and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
