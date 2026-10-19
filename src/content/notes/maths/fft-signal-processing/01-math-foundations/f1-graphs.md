---
title: "F1: Reading graphs"
order: 1
summary: "How to read a value-against-time graph: axes, units, one point, the period, the height, a curve against a list of dots, and scale traps."
status: not-started
tags: [math, graphs, foundations]
---

## 1. The question this idea answers

Every lesson in this subject shows a signal as a graph. So you must read a graph quickly and exactly. What does one point on a graph mean? How do you read the period and the height of a wave from its graph? When does a graph trick the eye?

The FFT story uses this skill in these lessons:

1. [L1](/notes/maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is) draws a signal as a curve and adds two curves point by point.
2. [L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency) reads the period from a curve and from a list of dots.
3. [L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains) draws a second kind of graph: the strength of each frequency.
4. [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) separates a curve from its list of dots.
5. [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) reads hertz and amplitude from a spectrum graph.

This is the first lesson of the subject. The next lesson, [F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle), explains the angle inside $\sin(2\pi f t)$.

## 2. Mental model

> [!analogy] A temperature log
> A nurse measures the temperature of a patient every hour and writes it in a table. A graph draws the same table as a picture. The bottom edge shows the clock time. The side edge shows the thermometer reading. Each row of the table becomes one dot.
>
> **Where it stops working:** a temperature changes slowly, so a line between two readings is a fair guess. A sound wave can change fast between two samples. Then the line between two dots can be wrong. A computer stores only the dots (lesson L6).

## 3. Terms

| Term | Plain meaning |
|---|---|
| graph | A picture of the relation between two quantities. |
| axis | A number line on the edge of a graph. A graph has a horizontal axis and a vertical axis. |
| horizontal axis | The axis along the bottom. In this subject it usually shows the time $t$ or the sample number $n$. |
| vertical axis | The axis on the left side. It usually shows the value of the signal. |
| unit | The measure of a quantity, for example seconds (s), milliseconds (ms) or hertz (Hz). |
| tick label | A number next to a small mark on an axis. Read values from the tick labels, not from the size of the picture. |
| point | One pair of values $(t, y)$. It means "at time $t$, the value is $y$". |
| continuous curve | A graph with a value at every instant. The signal $x(t)$ is a continuous curve. |
| dot plot | A graph of a list of samples. It has a value only at each sample. The list $x[n]$ is a dot plot. |
| center line | The value that a wave swings around. For $\sin(2\pi f t)$ the center line is 0. |
| peak | A point higher than its two neighbors. The top of a wave. |
| trough | A point lower than its two neighbors. The bottom of a wave. |
| scale | The size of one unit on an axis. Two graphs of the same data can use different scales. |

## 4. Axes, units and one point

A graph has two axes. Each axis is a number line with a unit. In this subject, the horizontal axis usually shows the time $t$ in seconds. The vertical axis shows the value of the signal, for example a microphone voltage.

Take the wave $y = \sin(2\pi \cdot 2t)$. Here $t$ is the time in seconds. [F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle) explains the sine and the $2\pi$. For now, treat the formula as a machine: put in a time, and get a value.

| Time $t$ (s) | Value $y$ | Point |
|---|---|---|
| 0 | 0 | (0, 0) |
| 0.125 | 1 | (0.125, 1) |
| 0.25 | 0 | (0.25, 0) |
| 0.375 | −1 | (0.375, −1) |
| 0.5 | 0 | (0.5, 0) |
| 0.625 | 1 | (0.625, 1) |
| 0.75 | 0 | (0.75, 0) |
| 0.875 | −1 | (0.875, −1) |

All eight values are exact. `np.sin(2 * np.pi * 2 * t)` gives the same values, with tiny rounding errors near $10^{-16}$.

> [!key] One point is one sentence
> Read the point (0.125, 1) as "at time t = 0.125 s, the value is 1". The first number is always the horizontal position. The second number is always the vertical position.

```plot
{
  "title": "The 2 Hz wave (blue) and the eight points of the table (ink dots)",
  "xAxis": { "label": "time t (s)", "domain": [0, 1] },
  "yAxis": { "label": "value y", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(12.566*x)", "color": "#1E6091" },
    { "points": [[0, 0], [0.125, 1], [0.25, 0], [0.375, -1], [0.5, 0], [0.625, 1], [0.75, 0], [0.875, -1]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true }
  ]
}
```

### Read a value from a graph

1. Find the time on the horizontal axis.
2. Move straight up or straight down to the curve.
3. Move straight across to the vertical axis.
4. Read the value from the tick labels.

### Read the times of one value

The reverse question has more than one answer. The value 1 occurs at t = 0.125 s and again at t = 0.625 s. A wave repeats, so one value occurs at many times. A time gives one value. A value does not give one time.

## 5. Read the period and the height

### The period

The period $T$ is the time for one cycle ([L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency)). On a graph, use two neighboring peaks. A peak is a point higher than its two neighbors.

1. Find one peak. Read its time.
2. Find the next peak to the right. Read its time.
3. Subtract the first time from the second time. The result is $T$.
4. Compute the frequency $f = 1/T$.

> [!example] The 2 Hz wave
> The peaks are at t = 0.125 s and t = 0.625 s. So $T$ = 0.625 − 0.125 = 0.5 s. Then $f$ = 1/0.5 = 2 Hz.
>
> Two upward zero crossings give the same result. The wave crosses 0 upward at t = 0 and at t = 0.5 s. So $T$ = 0.5 s again.

> [!example] The 6 Hz wave
> A sine wave reaches its first peak after a quarter of its period. For $\sin(2\pi \cdot 6t)$, $T$ = 1/6 s. So the first peak is at (1/6)/4 = 1/24 s, about 0.0417 s. The next peak is at 1/24 + 1/6 = 5/24 s, about 0.2083 s.
>
> On the graph you read about 0.042 s and 0.208 s. The difference is about 0.167 s. So $f$ = 1/0.167, about 6 Hz. The exact values are $T$ = 1/6 s and $f$ = 6 Hz.

> [!trap] Peak to trough is half a cycle
> For the 2 Hz wave, the peak at 0.125 s and the trough at 0.375 s are 0.25 s apart. That is $T/2$, not $T$. Always compare two points with the same value and the same direction.

```plot
{
  "title": "2 Hz (blue) and 6 Hz (ink) over one second: 2 peaks and 6 peaks",
  "xAxis": { "label": "time t (s)", "domain": [0, 1] },
  "yAxis": { "label": "value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(12.566*x)", "color": "#1E6091" },
    { "fn": "sin(37.699*x)", "color": "#100D12" }
  ]
}
```

### The height

A wave swings around a center line. For $\sin(2\pi f t)$ the center line is 0. The amplitude $A$ is the distance from the center line to a peak ([L3](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude)).

$$
A = \frac{\text{peak value} - \text{trough value}}{2}
$$

This formula works for any center line. It does not need the center line first.

| Wave | Peak value | Trough value | Amplitude $A$ | Center line |
|---|---|---|---|---|
| $\sin(2\pi \cdot 2t)$ | 1 | −1 | (1 − (−1))/2 = 1 | 0 |
| $0.6\sin(2\pi \cdot 14t)$ | 0.6 | −0.6 | (0.6 − (−0.6))/2 = 0.6 | 0 |
| $0.5 + \sin(2\pi \cdot 2t)$ | 1.5 | −0.5 | (1.5 − (−0.5))/2 = 1 | 0.5 |

> [!trap] The peak value is not always the amplitude
> The wave $0.5 + \sin(2\pi \cdot 2t)$ has its peak at 1.5. Its amplitude is 1, not 1.5. The extra 0.5 moves the whole wave up. It does not make the swing larger.

The second row is one part of the spectrum signal of the course: 14 Hz with amplitude 0.6. Its period is 1/14 s, about 0.0714 s.

## 6. A continuous curve and a list of dots

The signal $x(t)$ has round brackets. It has a value at every instant $t$. The list $x[n]$ has square brackets. It has a value only at whole numbers $n = 0, 1, 2, \dots$

A computer measures the curve at equal time steps. With a sample rate $f_s$ of 16 samples per second, the time step is $\Delta t$ = 1/16 = 0.0625 s. Sample $n$ is the value of the curve at time $n \Delta t$:

$$
x[n] = x(n \, \Delta t) = \sin\!\left(2\pi \cdot 2 \cdot \frac{n}{16}\right)
$$

| $n$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| time $n \Delta t$ (s) | 0 | 0.0625 | 0.125 | 0.1875 | 0.25 | 0.3125 | 0.375 | 0.4375 |
| $x[n]$ | 0 | 0.71 | 1 | 0.71 | 0 | −0.71 | −1 | −0.71 |

Samples 8 to 15 repeat the same eight values. The table shows 0.71, rounded to two decimals. The exact value is $\sqrt{2}/2 \approx 0.7071$ ([F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle)). The course also rounds $\sqrt{2} \approx 1.4142$ to 1.41.

```plot
{
  "title": "16 samples (blue dots) of the 2 Hz wave (ink curve), time axis in seconds",
  "xAxis": { "label": "time t (s)", "domain": [-0.05, 1] },
  "yAxis": { "label": "value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(12.566*x)", "color": "#100D12" },
    { "points": [[0, 0], [0.0625, 0.7071], [0.125, 1], [0.1875, 0.7071], [0.25, 0], [0.3125, -0.7071], [0.375, -1], [0.4375, -0.7071], [0.5, 0], [0.5625, 0.7071], [0.625, 1], [0.6875, 0.7071], [0.75, 0], [0.8125, -0.7071], [0.875, -1], [0.9375, -0.7071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0], [0.0625, 0.7071], [0.125, 1], [0.1875, 0.7071], [0.25, 0], [0.3125, -0.7071], [0.375, -1], [0.4375, -0.7071], [0.5, 0], [0.5625, 0.7071], [0.625, 1], [0.6875, 0.7071], [0.75, 0], [0.8125, -0.7071], [0.875, -1], [0.9375, -0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true }
  ]
}
```

The same dots often appear with the sample number $n$ on the horizontal axis. Then the axis has no time unit.

```plot
{
  "title": "The same 16 samples (blue), horizontal axis in sample numbers",
  "xAxis": { "label": "sample number n", "domain": [-0.5, 15.5] },
  "yAxis": { "label": "x[n]", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0], [1, 0.7071], [2, 1], [3, 0.7071], [4, 0], [5, -0.7071], [6, -1], [7, -0.7071], [8, 0], [9, 0.7071], [10, 1], [11, 0.7071], [12, 0], [13, -0.7071], [14, -1], [15, -0.7071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0], [1, 0.7071], [2, 1], [3, 0.7071], [4, 0], [5, -0.7071], [6, -1], [7, -0.7071], [8, 0], [9, 0.7071], [10, 1], [11, 0.7071], [12, 0], [13, -0.7071], [14, -1], [15, -0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true }
  ]
}
```

> [!example] The period from the dots
> The peaks are at $n$ = 2 and $n$ = 10. So the period is 8 samples. With $\Delta t$ = 0.0625 s, $T$ = 8 × 0.0625 = 0.5 s. The curve gave the same result: 0.5 s.

> [!trap] The lines between the dots are not data
> The lines only help the eye. The computer stores only the dots. Other curves pass through the same dots. For example, an 18 Hz sine sampled 16 times per second gives exactly these 16 values. Lesson [L26](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing) explains this effect.

### The teaching signal as dots

Most lessons in parts 03 and 04 use one list of 8 samples:

$$
x[n] = \cos\!\left(\frac{2\pi n}{8}\right) + 0.5\sin\!\left(\frac{2\pi \cdot 2n}{8}\right), \quad n = 0, \dots, 7
$$

```plot
{
  "title": "The teaching signal x[n] (blue): 8 samples, no time unit",
  "xAxis": { "label": "sample number n", "domain": [-0.5, 7.5] },
  "yAxis": { "label": "x[n]", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 1], [1, 1.2071], [2, 0], [3, -1.2071], [4, -1], [5, -0.2071], [6, 0], [7, 0.2071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 1], [1, 1.2071], [2, 0], [3, -1.2071], [4, -1], [5, -0.2071], [6, 0], [7, 0.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true }
  ]
}
```

Read the list from the graph: x = [1, 1.21, 0, −1.21, −1, −0.21, 0, 0.21], rounded to two decimals. The largest sample is $x[1] \approx 1.21$. The smallest sample is $x[3] \approx -1.21$. The graph has no time unit. So the graph alone does not give a frequency in hertz.

## 7. Scale traps

A graph can trick the eye. Read the tick labels and the units every time.

### Trap 1: a different vertical scale

The next graph shows the same 2 Hz wave, but the vertical axis goes from −4 to 4. The wave looks smaller. Its amplitude is still 1, because the peaks are still at the tick value 1.

```plot
{
  "title": "The same 2 Hz wave (blue) with a vertical axis from -4 to 4: it looks small, but A is still 1",
  "xAxis": { "label": "time t (s)", "domain": [0, 1] },
  "yAxis": { "label": "value", "domain": [-4, 4] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(12.566*x)", "color": "#1E6091" }
  ]
}
```

### Trap 2: an axis that does not start at 0

The next graph shows two peaks. The blue wave has amplitude 1.0. The ink wave has amplitude 1.1. The vertical axis starts at 0.8, not at 0.

```plot
{
  "title": "Peaks of 1.0 (blue) and 1.1 (ink). The vertical axis starts at 0.8, so the gap looks large",
  "xAxis": { "label": "time t (s)", "domain": [0.07, 0.18] },
  "yAxis": { "label": "value", "domain": [0.8, 1.15] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(12.566*x)", "color": "#1E6091" },
    { "fn": "1.1*sin(12.566*x)", "color": "#100D12" }
  ]
}
```

> [!example] How large is the trick?
> In the picture, the blue peak is 1.0 − 0.8 = 0.2 above the bottom edge. The ink peak is 1.1 − 0.8 = 0.3 above it. So the ink peak looks 0.3/0.2 = 1.5 times as tall. The true ratio is 1.1/1.0 = 1.1.

### Trap 3: different units on the time axis

The next graph shows a 6 Hz wave, with the time in milliseconds. One second is 1000 ms.

```plot
{
  "title": "A 6 Hz wave (blue) with time in milliseconds: peaks about 166.7 ms apart",
  "xAxis": { "label": "time t (ms)", "domain": [0, 500] },
  "yAxis": { "label": "value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "fn": "sin(0.037699*x)", "color": "#1E6091" }
  ]
}
```

> [!example] Change the unit first
> The peaks are about 166.7 ms apart. So $T$ = 166.7 ms = 0.1667 s, and $f$ = 1/0.1667 = 6 Hz (rounded). If you use 166.7 as seconds, you get $f$ = 1/166.7, about 0.006 Hz. That answer is wrong by a factor of 1000.

### Trap 4: sample numbers are not seconds

A dot plot can show the sample number $n$ or the time $n \Delta t$. A period of 8 samples is not a period of 8 seconds. You need the time step $\Delta t$ to change samples into seconds ([L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency)).

### Trap 5: not every graph shows the signal value

Later graphs put the frequency on the horizontal axis and the strength of each frequency on the vertical axis ([L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains)). A peak on that graph is a strong frequency. It is not the top of a wave. Some later graphs also use a log scale ([L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel)). On a log scale, equal steps on the axis are not equal steps of the value.

## 8. Video and pictures

This clip does not teach graph reading. Use it as practice: pause on each wave, and read its period from two neighboring peaks.

```video
{
  "src": "/notes/media/fft-signal-processing/course/02_What_Frequency_Means.mp4",
  "start": "0:05",
  "end": "0:20",
  "caption": "A 2 Hz wave and a 6 Hz wave in the same second. Read the period of each from its peaks."
}
```

## 9. Code

Build two small functions that read a graph for you. Use NumPy. Make the time axis with one line:

```python
t = np.arange(N) / fs   # the time of each sample, in seconds
```

1. Write `period_from_peaks(t, x)`. A peak is a sample that is larger than both of its neighbors. Return the mean time between neighboring peaks, in seconds.
2. Write `height(x)`. Return (largest value − smallest value) / 2.
3. Plot the 16 samples of section 6 as dots joined by lines, with the time in seconds on the horizontal axis.

Acceptance tests, with `fs = 1000` and `N = 1000`:

- `abs(period_from_peaks(t, np.sin(2*np.pi*2*t)) - 0.5) < 0.002` is True.
- `abs(period_from_peaks(t, np.sin(2*np.pi*6*t)) - 1/6) < 0.002` is True.
- `abs(height(0.6*np.sin(2*np.pi*14*t)) - 0.6) < 1e-3` is True.
- `abs(height(0.5 + np.sin(2*np.pi*2*t)) - 1) < 1e-3` is True.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/01-math-foundations/f1-graphs)

```check
{
  "question": "Stuck on `period_from_peaks`?",
  "hint": "Loop over the inner samples i = 1 to len(x) − 2. Compare x[i] with x[i − 1] and with x[i + 1].",
  "answer": "Keep the time t[i] of every sample that is larger than both neighbors. Then take the differences between neighboring peak times (NumPy has `np.diff`), and return their mean. The first and the last sample have only one neighbor, so skip them."
}
```

## 10. Common mistakes

1. **The point read in the wrong order.** In $(t, y)$, the first number is the horizontal position (time). The second number is the value.
2. **Peak to trough as the period.** That distance is half a cycle. Use two neighboring peaks.
3. **The peak value as the amplitude.** This is correct only when the center line is 0. Use (peak − trough)/2.
4. **The size of the picture as the value.** Read the tick labels. The scale can change, and the axis may not start at 0.
5. **Milliseconds read as seconds.** Change the unit before you compute $f = 1/T$.
6. **The lines between dots as data.** A dot plot holds values only at the samples.

## 11. One-minute explanation

A graph is a table drawn as a picture, and each point $(t, y)$ says: at time $t$, the value is $y$. The period is the time between two neighboring peaks, and the frequency is one over the period. The amplitude is the peak value minus the trough value, divided by 2. A signal $x(t)$ is a continuous curve with a value at every instant. Its samples $x[n]$ are only dots, and the lines between the dots are not data. Before you read any number, check the units and the tick labels, because the scale can trick the eye.

## 12. Check questions

```check
{
  "question": "A graph of a signal contains the point (0.25, −0.6). The time is in seconds. Say what the point means in one sentence.",
  "hint": "The first number is the horizontal position.",
  "answer": "At time t = 0.25 s, the value of the signal is −0.6."
}
```

```check
{
  "question": "A wave has neighboring peaks at t = 0.05 s and t = 0.15 s. Its peaks are at 0.8 and its troughs at −0.8. Find the period, the frequency and the amplitude.",
  "hint": "Period: subtract the times of two neighboring peaks. Amplitude: (peak − trough)/2.",
  "answer": "$T$ = 0.15 − 0.05 = 0.1 s. $f$ = 1/0.1 = 10 Hz. $A$ = (0.8 − (−0.8))/2 = 1.6/2 = 0.8."
}
```

```check
{
  "question": "Why can a dot plot not tell you the value of the signal halfway between two samples?",
  "hint": "Think about what the computer stores, and about other curves through the same dots.",
  "answer": "The computer stores only the samples. Many different curves pass through the same dots. For example, a 2 Hz sine and an 18 Hz sine, both sampled 16 times per second, give exactly the same 16 values. The line between two dots only helps the eye."
}
```

```check
{
  "question": "A graph shows time in milliseconds. A wave crosses 0 upward at t = 2.5 ms and again at t = 7.5 ms. What is its frequency?",
  "hint": "Two upward zero crossings are one cycle apart. Change milliseconds into seconds first.",
  "answer": "$T$ = 7.5 − 2.5 = 5 ms = 0.005 s. $f$ = 1/0.005 = 200 Hz."
}
```

```check
{
  "question": "A vertical axis starts at 0.8. Peak A is at 1.0 and peak B is at 1.2. How many times taller does B look? How many times larger is B really?",
  "hint": "In the picture, each height starts at the bottom edge, 0.8.",
  "answer": "In the picture: (1.2 − 0.8)/(1.0 − 0.8) = 0.4/0.2 = 2 times. In reality: 1.2/1.0 = 1.2 times."
}
```

```check
{
  "question": "A dot plot with sample numbers on the horizontal axis shows peaks at n = 3 and n = 13. The sample rate is 50 samples per second. What is the period in seconds, and what is the frequency?",
  "hint": "First the period in samples. Then multiply by the time step 1/f_s.",
  "answer": "Period: 13 − 3 = 10 samples. $\\Delta t$ = 1/50 = 0.02 s. $T$ = 10 × 0.02 = 0.2 s. $f$ = 1/0.2 = 5 Hz."
}
```

## 13. Links

- Next lesson: [F2: Radians and the unit circle](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle)
- Used in: [L1: What a signal is](/notes/maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is), [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency), [L3: Amplitude](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude), [L6: Samples](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples)
- Later graphs: [L5: Two domains](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains), [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude), [L26: Aliasing](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing)
- [01 Math foundations](/notes/maths/fft-signal-processing/01-math-foundations)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
