---
title: "L2: Period and frequency"
order: 2
summary: "How to count cycles in a list of samples. Period, frequency, time step and sample rate."
status: in-progress
learned: 2026-10-11
tags: [signals, frequency, period, samples]
---

## 1. The question this idea answers

Two waves can have the same height, but one sounds higher. Which number describes how fast a wave repeats? How do we read that number from a list of samples?

## 2. Mental model

> [!analogy] A runner on a track
> One cycle is one full lap. The period is the time for one lap. The frequency is the number of laps in one second.
>
> **Where it stops working:** a runner passes each point of the track once in each lap. A wave passes most values twice in each cycle: once on the way up and once on the way down. So the counting method also checks the direction.

## 3. Terms

| Term | Plain meaning |
|---|---|
| sample | One value at one instant, like a dot on a timeline. A sample has no length. |
| time step (Δt) | The time between two neighboring samples. |
| sample rate ($f_s$) | The number of samples in one second. $\Delta t = 1/f_s$. |
| cycle | One full trip of the wave. It starts at a value and returns to the same value, with the same direction. One oscillation is one cycle. |
| period (T) | The time for one cycle. In a list of samples, you can also count it in samples. |
| frequency (f) | The number of cycles in one second. |
| hertz (Hz) | The unit of frequency. 1 Hz is one cycle per second. |

## 4. Count the cycles in a list of samples

1. Pick a start sample. Note its value and its direction (up or down).
2. Move right until the same value appears again, with the same direction.
3. Count the steps. That count is the period, in samples.

| List | Start | Same value, same direction again | Period | Cycles in 8 samples |
|---|---|---|---|---|
| A = [0, 1, 0, −1, 0, 1, 0, −1] | n = 0: value 0, moving up | n = 4: value 0, moving up | 4 samples | 2 |
| D = [1, 0.71, 0, −0.71, −1, −0.71, 0, 0.71] | n = 0: value 1, the top | No repeat inside the list. The list ends at 0.71, and the wave rises toward 1 again. | 8 samples | 1 |

> [!trap] Half a cycle
> In A, the value 0 appears again at n = 2. But at n = 2 the wave moves down. So n = 2 is only half a cycle.

> [!trap] The start position does not change the speed
> D starts at its top, and A starts at 0. D reaches its top first, but D is the slower wave. The start position is the phase (lesson L4). The phase does not change the frequency.

The graphs below show the lists as dots. The lines only join the dots to help the eye. The computer stores only the dots.

```plot
{
  "title": "A (red) and B (blue): the same height, a different speed",
  "xAxis": { "label": "sample number n", "domain": [-0.5, 7.5] },
  "yAxis": { "label": "sample value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0], [1, 1], [2, 0], [3, -1], [4, 0], [5, 1], [6, 0], [7, -1]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 0], [1, 1], [2, 0], [3, -1], [4, 0], [5, 1], [6, 0], [7, -1]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 0], [1, 0.71], [2, 1], [3, 0.71], [4, 0], [5, -0.71], [6, -1], [7, -0.71]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0], [1, 0.71], [2, 1], [3, 0.71], [4, 0], [5, -0.71], [6, -1], [7, -0.71]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true }
  ]
}
```

A and B reach the same height: 1 and −1. A repeats every 4 samples. B repeats every 8 samples. So A has the higher frequency. The height is the amplitude (lesson L3). The height does not tell the frequency.

```plot
{
  "title": "A (red) makes 2 cycles. D (blue) makes 1 cycle in the same 8 samples.",
  "xAxis": { "label": "sample number n", "domain": [-0.5, 7.5] },
  "yAxis": { "label": "sample value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0], [1, 1], [2, 0], [3, -1], [4, 0], [5, 1], [6, 0], [7, -1]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 0], [1, 1], [2, 0], [3, -1], [4, 0], [5, 1], [6, 0], [7, -1]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 1], [1, 0.71], [2, 0], [3, -0.71], [4, -1], [5, -0.71], [6, 0], [7, 0.71]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 1], [1, 0.71], [2, 0], [3, -0.71], [4, -1], [5, -0.71], [6, 0], [7, 0.71]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true }
  ]
}
```

## 5. Time step and sample rate

A sample has no length. It is one value at one instant. The gap between two neighboring samples has a length. This gap is the time step $\Delta t$.

You do not measure the time step. The data gives it:

1. An exercise states it, for example "8 samples cover 2 seconds".
2. A real audio file stores the sample rate $f_s$. Speech recognition often uses 16,000 samples per second.

$$
\Delta t = \frac{1}{f_s}
$$

For example, $f_s$ = 16,000 samples per second gives $\Delta t$ = 1/16,000 s = 0.0625 ms.

> [!note] Convention: N samples cover N time steps
> The last time step runs from the last sample to the place of the next sample. So 8 samples over 2 s give $\Delta t$ = 2/8 s, not 2/7 s. The course uses the same convention: 64 samples at 128 Hz cover 0.5 s.

## 6. Formulas

The period and the frequency are inverses:

$$
f = \frac{1}{T} \qquad T = \frac{1}{f}
$$

The number of cycles in a stretch of time:

$$
\text{cycles} = f \times \text{duration}
$$

The period in seconds, from the period in samples:

$$
T = (\text{period in samples}) \times \Delta t
$$

## 7. Two methods to find the frequency

**Method 1: find the period in samples, then change it into seconds.**

1. Count the period in samples.
2. Multiply it by $\Delta t$. This gives $T$ in seconds.
3. Compute $f = 1/T$.

**Method 2: count the cycles in the whole list.**

1. Divide the number of samples by the period in samples. This gives the number of cycles.
2. Divide the number of cycles by the length of the list in seconds.

Use Method 2 to check Method 1.

> [!example] Worked example: A over 2 seconds
> The 8 samples of A cover 2 seconds. So $\Delta t$ = 2 s / 8 = 0.25 s.
>
> - Method 1: the period is 4 samples. $T = 4 \times 0.25 = 1$ s. $f = 1/1 = 1$ Hz.
> - Method 2: 8 / 4 = 2 cycles in 2 s. $f = 2/2 = 1$ Hz.

```plot
{
  "title": "List A when 8 samples cover 2 seconds: one dot every 0.25 s",
  "xAxis": { "label": "time (s)", "domain": [-0.1, 2] },
  "yAxis": { "label": "sample value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0], [0.25, 1], [0.5, 0], [0.75, -1], [1, 0], [1.25, 1], [1.5, 0], [1.75, -1]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 0], [0.25, 1], [0.5, 0], [0.75, -1], [1, 0], [1.25, 1], [1.5, 0], [1.75, -1]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true }
  ]
}
```

> [!example] Worked example: A over 1 second
> The same 8 samples now cover 1 second. So $\Delta t$ = 1/8 s.
>
> - Method 1: $T = 4 \times \frac{1}{8} = 0.5$ s. $f = 1/0.5 = 2$ Hz.
> - Method 2: 2 cycles in 1 s. $f = 2$ Hz.

> [!key] The list alone does not give the frequency
> The list gives the period in samples. The time step changes that into seconds. Chapter 11 uses the same idea to change DFT bins into hertz.

## 8. Video and pictures

```video
{
  "src": "/notes/media/fft-signal-processing/course/02_What_Frequency_Means.mp4",
  "start": "0:00",
  "end": "0:20",
  "caption": "A 2 Hz wave and a 6 Hz wave in the same second."
}
```

```plot
{
  "title": "2 Hz (red) and 6 Hz (blue) over one second",
  "xAxis": { "label": "time (s)", "domain": [0, 1] },
  "yAxis": { "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(12.566*x)" },
    { "fn": "sin(37.699*x)" }
  ]
}
```

The red curve is $\sin(2\pi \cdot 2t)$: 2 cycles in the second. The blue curve is $\sin(2\pi \cdot 6t)$: 6 cycles in the same second. Both curves have the same height.

## 9. Common mistakes

1. **Amplitude for frequency.** The height tells the amplitude. The frequency tells how fast the wave repeats.
2. **Half a cycle for a full cycle.** The value must repeat with the same direction.
3. **The start position for the frequency.** The start position is the phase. It does not change the frequency.
4. **"Oscillations per cycle."** One oscillation is one cycle. Say "cycles per second".
5. **A sample with a length.** A sample is an instant. The time step is the gap between two samples.

## 10. Questions and answers

### How do I know the length of a sample, and how do I measure it?

A sample has no length. It is one value at one instant, like a dot on a timeline. The gap between two neighboring samples has a length. This gap is the time step $\Delta t$.

You do not measure the time step. An exercise states it. A real audio file stores the sample rate $f_s$, and $\Delta t = 1/f_s$.

To get the frequency, use the two methods in section 7. For example, 8 samples of A cover 2 seconds, so $\Delta t$ = 0.25 s. The period is 4 samples, so $T$ = 1 s and $f$ = 1 Hz.

## 11. One-minute explanation

A wave repeats the same shape again and again. One full repeat is a cycle. The time for one cycle is the period. The number of cycles in one second is the frequency, in hertz. For a simple tone, a higher frequency gives a higher pitch. To find the period in a list of samples, start at one sample. Move right until the same value comes back with the same direction. Then multiply the period in samples by the time step. The height of the wave and its start position do not change the frequency.

## 12. Check questions

```check
{
  "question": "These 12 samples cover exactly one second: G = [1, 0.5, −0.5, −1, −0.5, 0.5, 1, 0.5, −0.5, −1, −0.5, 0.5]. How many samples does one cycle take? What is the frequency in hertz?",
  "hint": "G starts at its top. Find the next sample where the top comes back.",
  "answer": "6 samples. The cycle starts at n = 0 (value 1) and ends at n = 6 (value 1 again). 12 samples hold 2 cycles. They cover 1 s, so f = 2 Hz."
}
```

```check
{
  "question": "A 6 Hz wave runs for 0.5 s. How many cycles does it complete?",
  "hint": "cycles = frequency × duration.",
  "answer": "6 × 0.5 = 3 cycles."
}
```

```check
{
  "question": "A wave completes 10 cycles in 2 seconds. What is its frequency?",
  "hint": "The frequency counts the cycles in ONE second.",
  "answer": "10 / 2 = 5 Hz."
}
```

```check
{
  "question": "A = [0, 1, 0, −1, 0, 1, 0, −1] and D = [1, 0.71, 0, −0.71, −1, −0.71, 0, 0.71]. D reaches its top first. Which list has the higher pitch?",
  "hint": "Ignore where each wave starts. Count the samples in one full repeat.",
  "answer": "A. A repeats every 4 samples (2 cycles in 8 samples). D repeats every 8 samples (1 cycle). D reaches the top first only because it has a different start position (phase)."
}
```

```check
{
  "question": "A list of 8 samples covers 2 seconds. What is the time step? What is the sample rate?",
  "hint": "The time step is the length of the list divided by the number of samples.",
  "answer": "Time step: 2 s / 8 = 0.25 s. Sample rate: 1 / 0.25 = 4 samples per second."
}
```

## 13. Links

- [02 Signals and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
- [Course plan](/notes/maths/fft-signal-processing/course-plan)
