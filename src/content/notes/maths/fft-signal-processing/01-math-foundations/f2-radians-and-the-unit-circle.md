---
title: "F2: Radians and the unit circle"
order: 2
summary: "Why angles use radians, why one turn is 2π, and why sin and cos are the coordinates of a point on the unit circle."
status: not-started
tags: [math, radians, unit-circle, trigonometry, foundations]
---

## 1. The question this idea answers

Every wave formula in this subject contains $2\pi$, for example $\sin(2\pi f t)$. Why $2\pi$? What does the sine of a number mean? Why does $\sin(2\pi f t)$ make exactly $f$ cycles in one second?

The answer is a point that travels around a circle. The FFT story uses this picture again and again:

1. [L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency) and [L4](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase) use $\sin(2\pi f t + \varphi)$. The phase $\varphi$ is an angle in radians.
2. [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) and [F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula) write the point on the circle as one complex number.
3. [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula) uses probes that turn by $2\pi k/N$ at each sample.
4. [F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity) and [L16](/notes/maths/fft-signal-processing/04-fft/l16-two-facts) use the 8 points of this lesson as the twiddle factors.

The previous lesson, [F1](/notes/maths/fft-signal-processing/01-math-foundations/f1-graphs), showed how to read a wave on a graph. This lesson explains where the wave comes from.

## 2. Mental model

> [!analogy] A string around a wheel
> Take a wheel with a radius of 1 meter. Wrap a string along its rim, from a start mark. The length of string on the rim measures the angle. One meter of string is one radian. The full rim needs $2\pi \approx 6.2832$ meters of string, so one full turn is $2\pi$ radians.
>
> **Where it stops working:** on a wheel with a radius of 2 meters, one meter of string is only half a radian. The string length equals the angle only when the radius is 1. Also, a string cannot cover the rim twice without a mess, but an angle can grow past $2\pi$ with no problem. The point then makes a second turn.

## 3. Terms

| Term | Plain meaning |
|---|---|
| angle | The amount of turn between two directions. |
| degree (°) | A unit of angle. One full turn is 360°. |
| arc | A part of the edge of a circle. |
| arc length | The length of an arc, measured along the curve. |
| radius | The distance from the center of a circle to its edge. |
| π (pi) | The length of the edge of any circle divided by its diameter. $\pi \approx 3.14159$. It is a number, not an angle. |
| radian | A unit of angle. An angle of 1 radian cuts an arc whose length equals the radius. One full turn is $2\pi$ radians. |
| unit circle | The circle with radius 1 and its center at the origin (0, 0). |
| counter-clockwise | The direction of turn opposite to the hands of a clock. A positive angle turns counter-clockwise. |
| cosine (cos θ) | The x-coordinate (horizontal position) of the point at angle θ on the unit circle. |
| sine (sin θ) | The y-coordinate (vertical position) of the point at angle θ on the unit circle. |
| quarter | One of the four parts of the plane between the axes: 0° to 90°, 90° to 180°, 180° to 270°, 270° to 360°. |
| angular frequency (ω) | The angle per second of a turning point: $\omega = 2\pi f$, in radians per second. |

## 4. Degrees and radians

### Degrees

People divide one full turn into 360 equal parts. Each part is one degree. The number 360 is a historical choice. Nothing in a circle makes 360 special.

### Radians

A radian measures the angle with a length. Draw a circle with radius $r$. An angle $\theta$ at the center cuts an arc of the edge. The arc length $s$ grows with the angle and with the radius. Radians make this relation exact:

$$
\theta \ (\text{in radians}) = \frac{s}{r} \qquad \text{so} \qquad s = r\,\theta
$$

The edge of the full circle has the length $2\pi r$. This is the definition of $\pi$: the edge length is $\pi$ times the diameter $2r$. So one full turn is:

$$
\theta_{\text{full turn}} = \frac{2\pi r}{r} = 2\pi \text{ radians} \approx 6.2832
$$

The radius cancels. So the angle in radians does not depend on the size of the circle. A radian has no unit, because it is a length divided by a length.

On the unit circle, $r = 1$. Then $s = \theta$: the angle in radians equals the distance that the point travels along the edge.

> [!key] One turn is 2π
> One full turn is $2\pi$ radians, a half turn is $\pi$, and a quarter turn is $\pi/2$. Every $2\pi$ in a wave formula means "one full turn".

### Why the FFT story uses radians

1. On the unit circle, the angle equals the distance along the edge. No extra factor appears.
2. $2\pi f t$ is then a count of turns times $2\pi$. Section 7 uses this.
3. The rules of calculus for sine and cosine are simple only in radians. [F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula) needs these rules.
4. NumPy, Python's `math` module and every DSP library expect radians.

### Convert between degrees and radians

360° is the same angle as $2\pi$ radians. Divide both sides by 360, then by $2\pi$:

$$
1° = \frac{2\pi}{360} = \frac{\pi}{180} \approx 0.017453 \text{ rad} \qquad 1 \text{ rad} = \frac{180°}{\pi} \approx 57.2958°
$$

So: radians = degrees × π/180, and degrees = radians × 180/π.

> [!example] Convert 30° and 1 radian
> 30° × π/180 = π/6 ≈ 0.5236 rad.
>
> 1 rad × 180/π ≈ 57.30°. One radian is a little less than one sixth of a turn.

The FFT with N = 8 uses steps of one eighth of a turn. Memorize this table:

| Degrees | Fraction of a turn | Radians (exact) | Radians (4 decimals) |
|---|---|---|---|
| 0° | 0 | 0 | 0 |
| 45° | 1/8 | π/4 | 0.7854 |
| 90° | 1/4 | π/2 | 1.5708 |
| 135° | 3/8 | 3π/4 | 2.3562 |
| 180° | 1/2 | π | 3.1416 |
| 225° | 5/8 | 5π/4 | 3.9270 |
| 270° | 3/4 | 3π/2 | 4.7124 |
| 315° | 7/8 | 7π/4 | 5.4978 |
| 360° | 1 | 2π | 6.2832 |

## 5. The unit circle: cos and sin as coordinates

Draw the unit circle: radius 1, center at the origin (0, 0). Start at the point (1, 0) on the right. Turn counter-clockwise by the angle $\theta$. You arrive at a point $P$ on the circle.

> [!key] The definition of cos and sin
> The point at angle $\theta$ on the unit circle is $P = (\cos\theta, \sin\theta)$. The cosine is the horizontal coordinate. The sine is the vertical coordinate.

The distance from the origin to $P$ is the radius 1. The horizontal leg $\cos\theta$, the vertical leg $\sin\theta$ and the radius make a right triangle. The theorem of Pythagoras gives:

$$
\cos^2\theta + \sin^2\theta = 1
$$

This is true for every angle. Here $\cos^2\theta$ means $(\cos\theta)^2$.

### Exact values at 45°

At 45°, the point is halfway between the two axes. So its two coordinates are equal: $x = y$. Use this in the theorem of Pythagoras:

1. $x^2 + x^2 = 1$, so $2x^2 = 1$.
2. $x^2 = 1/2$, so $x = 1/\sqrt{2}$. The point is in the first quarter, so $x$ is positive.
3. Multiply the top and the bottom by $\sqrt{2}$: $x = \sqrt{2}/(\sqrt{2}\cdot\sqrt{2}) = \sqrt{2}/2$.

So $\cos 45° = \sin 45° = \sqrt{2}/2 \approx 0.7071$ exactly. The course and these notes show it as 0.71, rounded to two decimals. In the same way, $\sqrt{2} \approx 1.4142$ shows as 1.41.

![Alt text: the unit circle with 8 points at multiples of 45 degrees, each with its angle and its rounded (cos, sin) coordinates](/notes/media/fft-signal-processing/figures/f2-unit-circle.svg)

| θ | Point (exact) | Point (rounded) |
|---|---|---|
| 0 | (1, 0) | (1, 0) |
| π/4 | (√2/2, √2/2) | (0.71, 0.71) |
| π/2 | (0, 1) | (0, 1) |
| 3π/4 | (−√2/2, √2/2) | (−0.71, 0.71) |
| π | (−1, 0) | (−1, 0) |
| 5π/4 | (−√2/2, −√2/2) | (−0.71, −0.71) |
| 3π/2 | (0, −1) | (0, −1) |
| 7π/4 | (√2/2, −√2/2) | (0.71, −0.71) |

### Signs in each quarter

The sign of each coordinate comes from the side of the axis where the point is.

| Quarter | Angles | cos θ | sin θ | Example |
|---|---|---|---|---|
| 1 | 0° to 90° | + | + | 45°: (0.71, 0.71) |
| 2 | 90° to 180° | − | + | 135°: (−0.71, 0.71) |
| 3 | 180° to 270° | − | − | 225°: (−0.71, −0.71) |
| 4 | 270° to 360° | + | − | 315°: (0.71, −0.71) |

## 6. Turns: negative, more than one, half and quarter

### Negative angles turn clockwise

A negative angle turns clockwise from (1, 0). The point at $-\theta$ is the mirror image of the point at $\theta$ across the horizontal axis. The mirror keeps $x$ and changes the sign of $y$:

$$
\cos(-\theta) = \cos\theta \qquad \sin(-\theta) = -\sin\theta
$$

> [!example] −45° and 315°
> −45° turns one eighth of a turn clockwise. The point is (0.71, −0.71). The angle 315° arrives at the same point counter-clockwise. The two angles differ by exactly 360°.

The forward DFT uses clockwise turns. [F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula) and [F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity) use this rule.

### More than one turn

An angle can grow past $2\pi$. The angle $\theta + 2\pi$ makes one more full turn and arrives at the same point. So:

$$
\cos(\theta + 2\pi) = \cos\theta \qquad \sin(\theta + 2\pi) = \sin\theta
$$

This is why a sine wave repeats. The period of $\sin\theta$ is $2\pi$ radians.

### A half turn gives the opposite point

The angle $\theta + \pi$ adds a half turn. The point moves to the opposite side of the circle, through the center. Both coordinates change sign:

$$
\cos(\theta + \pi) = -\cos\theta \qquad \sin(\theta + \pi) = -\sin\theta
$$

For example, 45° gives (0.71, 0.71), and 225° gives (−0.71, −0.71). [F3](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation) uses this rule to make sums cancel. [L16](/notes/maths/fft-signal-processing/04-fft/l16-two-facts) uses it to save half the work of the FFT.

### A quarter turn changes sine into cosine

Turn the point $P = (x, y)$ by a quarter turn counter-clockwise. The right triangle under $P$ turns with it. The horizontal leg becomes vertical, and the vertical leg becomes horizontal and points left. So the new point is $(-y, x)$. Its vertical coordinate is the old $x$:

$$
\sin(\theta + \pi/2) = \cos\theta
$$

Check it in the table: $\sin(\pi/2) = 1 = \cos 0$, and $\sin(3\pi/4) = 0.71 = \cos(\pi/4)$. [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) proves the rule $(x, y) \to (-y, x)$ with algebra, for every angle. This rule is the reason for the phase shift of $\pi/2$ in [L4](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase).

## 7. From the circle to a wave

Let the angle $\theta$ grow from 0 to $2\pi$. The point travels once around the circle. Draw its vertical coordinate $\sin\theta$ against $\theta$. You get one cycle of the sine wave. Its horizontal coordinate $\cos\theta$ gives one cycle of the cosine wave.

```plot
{
  "title": "cos θ (blue) and sin θ (gold) for one turn, θ from 0 to 2π = 6.2832. Dots: the 8 points at multiples of π/4",
  "xAxis": { "label": "angle θ (radians)", "domain": [0, 6.2832] },
  "yAxis": { "label": "coordinate", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "fn": "cos(x)", "color": "#1E6091" },
    { "fn": "sin(x)", "color": "#B8860B" },
    { "points": [[0, 1], [0.7854, 0.7071], [1.5708, 0], [2.3562, -0.7071], [3.1416, -1], [3.927, -0.7071], [4.7124, 0], [5.4978, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0], [0.7854, 0.7071], [1.5708, 1], [2.3562, 0.7071], [3.1416, 0], [3.927, -0.7071], [4.7124, -1], [5.4978, -0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true }
  ]
}
```

Read the gold dots: 0, 0.71, 1, 0.71, 0, −0.71, −1, −0.71. This is list B of [L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency). The blue dots, 1, 0.71, 0, −0.71, −1, −0.71, 0, 0.71, are list D. Both lists are the 8 points of the circle, read on one axis.

### Why sin(2πft) makes f turns per second

Replace the fixed angle with an angle that grows with time:

$$
\theta(t) = 2\pi f \, t
$$

1. At $t = 0$, the angle is 0.
2. In one second, the angle grows by $2\pi f$. That is $f$ full turns.
3. Each full turn is one cycle of the wave. So the wave makes $f$ cycles in one second. This is the frequency $f$ in hertz.
4. One cycle ends when $\theta = 2\pi$. So $2\pi f T = 2\pi$, and $T = 1/f$. This is the period.

> [!example] The 2 Hz wave of F1
> For $f$ = 2 Hz, $\theta(t) = 2\pi \cdot 2 \cdot t = 4\pi t$.
>
> | t (s) | 0 | 0.125 | 0.25 | 0.375 | 0.5 |
> |---|---|---|---|---|---|
> | θ = 4πt | 0 | π/2 | π | 3π/2 | 2π |
> | sin θ | 0 | 1 | 0 | −1 | 0 |
>
> These are the values of the F1 table. At t = 0.5 s the point completes one turn. So $T$ = 0.5 s and $f$ = 2 Hz.

The number $\omega = 2\pi f$ is the angular frequency: the angle per second. For 2 Hz, $\omega = 4\pi \approx 12.566$ rad/s. This is the number inside the graph formula `sin(12.566*x)` in F1.

### The angle step between samples

At sample $n$, the time is $t = n\,\Delta t = n / f_s$. So the angle is $2\pi f n / f_s$. Between two neighboring samples, the angle grows by the same step, $2\pi f / f_s$.

> [!example] The teaching signal
> The first part of the teaching signal is $\cos(2\pi n / 8)$. The angle step is $2\pi/8 = \pi/4$, which is 45°. So the 8 samples are the 8 points of the figure, read on the horizontal axis, one point per sample.
>
> The second part is $0.5\sin(2\pi \cdot 2n/8)$. Its angle step is $2 \cdot 45° = 90°$. It makes 2 turns in 8 samples.

A probe with $k$ cycles in $N$ samples has the angle step $2\pi k / N$ ([L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)). For $N$ = 8 and $k$ = 3, the step is 135°. The angles are 0°, 135°, 270°, 405° = 45° + 360°, and so on. The point visits all 8 points, in a different order. [F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity) and [F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary) explain this order.

### Phase is a start angle

The full wave formula is $A\sin(2\pi f t + \varphi)$. The phase $\varphi$ is the angle of the point at $t = 0$, in radians. A phase of $\pi/2$ is a quarter turn. Section 6 showed that $\sin(\theta + \pi/2) = \cos\theta$. So $\sin(2\pi f t + \pi/2) = \cos(2\pi f t)$: the same wave, with a start one quarter cycle earlier ([L4](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase)).

## 8. Video and pictures

Watch a point travel around the circle of radius 1. Its shadow on the horizontal axis traces a cosine, and its shadow on the vertical axis traces a sine. The video calls the axes "real" and "imaginary". [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) explains these names.

```video
{
  "src": "/notes/media/fft-signal-processing/course/05_Why_Complex_Numbers.mp4",
  "start": "0:11",
  "end": "0:26",
  "caption": "A point travels around the unit circle. Its two shadows trace a cosine and a sine."
}
```

## 9. Code

Build the unit circle in Python. Use only `math` or NumPy functions for sine and cosine.

1. Write `deg_to_rad(d)` and `rad_to_deg(r)`. Do not use `np.deg2rad` or `np.rad2deg` inside them.
2. Write `circle_point(theta)`. It returns the pair `(x, y)` of the point at angle `theta` (radians) on the unit circle.
3. Print a table of the 8 points at `k * np.pi / 4`, for k = 0 to 7, rounded to 2 decimals.
4. Run `np.sin(90)`. Write one comment that explains the result.

Acceptance tests:

- `np.allclose([deg_to_rad(d) for d in (0, 45, 90, 180, 360)], np.deg2rad([0, 45, 90, 180, 360]))` is True.
- `np.allclose(rad_to_deg(np.pi / 4), 45)` is True.
- `np.allclose(circle_point(3 * np.pi / 4), (-0.7071, 0.7071), atol=1e-4)` is True.
- For 100 random angles, `abs(x**2 + y**2 - 1) < 1e-12`.
- The y-values of your 8 points, rounded to 2 decimals, equal list B of L2: `[0, 0.71, 1, 0.71, 0, -0.71, -1, -0.71]`.
- For 100 random angles, `abs(np.sin(theta + 2 * np.pi) - np.sin(theta)) < 1e-12`.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle)

```check
{
  "question": "Stuck on `deg_to_rad` or on the table?",
  "hint": "One full turn is 360° and also 2π radians. So one degree is 2π/360 radians.",
  "answer": "Multiply the degrees by π/180. For the table, loop over k = 0 to 7, compute θ = kπ/4, and print k, θ, cos θ and sin θ. Use `round(value, 2)`. A value like −0.0 is only zero with a sign from rounding."
}
```

## 10. Common mistakes

1. **Degrees in a function that expects radians.** `np.sin(90)` gives about 0.894, not 1. NumPy reads 90 as 90 radians, about 14.3 turns. Use `np.sin(np.pi / 2)`.
2. **π as an angle unit.** π is a number, about 3.14159. "π radians" is a half turn. "π degrees" is a very small angle.
3. **sin and cos swapped.** The cosine is the horizontal coordinate. The sine is the vertical coordinate. At θ = 0 the point is (1, 0), so cos 0 = 1 and sin 0 = 0.
4. **The 2π missing in a wave formula.** $\sin(f t)$ makes $f/(2\pi)$ cycles per second, not $f$. The $2\pi$ changes "turns" into radians.
5. **0.71 as an exact value.** The exact value is $\sqrt{2}/2 \approx 0.70711$. With 0.71, products such as 1.41 × 0.71 give 1.0011, not exactly 1.
6. **The wrong direction for a negative angle.** A negative angle turns clockwise.

## 11. One-minute explanation

An angle in radians is the distance that a point travels along the edge of a circle with radius 1. One full turn is $2\pi$ radians, because the edge of that circle has length $2\pi$. The point at angle θ on this unit circle has the coordinates (cos θ, sin θ): cosine is horizontal, sine is vertical. A half turn adds π and changes the sign of both coordinates, and a full turn adds $2\pi$ and changes nothing. In $\sin(2\pi f t)$, the angle grows by $2\pi f$ each second, so the point makes $f$ turns per second, and the wave has $f$ cycles per second. With N = 8 samples per cycle, the point jumps by 45° per sample, so the samples are the 8 points at multiples of π/4.

## 12. Check questions

```check
{
  "question": "How many radians is one full turn? How many is half a turn? Give the exact values and 4 decimals.",
  "hint": "The edge of the unit circle has the length 2π.",
  "answer": "One full turn: $2\\pi \\approx 6.2832$ rad. Half a turn: $\\pi \\approx 3.1416$ rad."
}
```

```check
{
  "question": "Convert 135° to radians. Then give the point on the unit circle at 135°, exact and rounded, with the correct signs.",
  "hint": "135° is in the second quarter. There, cos is negative and sin is positive.",
  "answer": "135 × π/180 = 3π/4 ≈ 2.3562 rad. The point is $(-\\sqrt{2}/2, \\sqrt{2}/2) \\approx (-0.71, 0.71)$. It is the mirror image of the 45° point across the vertical axis."
}
```

```check
{
  "question": "Why does $\\sin(2\\pi \\cdot 5t)$ make exactly 5 cycles in one second?",
  "hint": "Find how much the angle grows in one second. Then count the full turns.",
  "answer": "The angle is $2\\pi \\cdot 5t$. From t = 0 to t = 1 s, it grows from 0 to $10\\pi$. One full turn is $2\\pi$, so $10\\pi$ is 5 turns. Each turn of the point is one cycle of the wave. So the wave makes 5 cycles: f = 5 Hz."
}
```

```check
{
  "question": "A probe is $\\cos(2\\pi \\cdot 3n/8)$ for n = 0 to 7. What is the angle step per sample, in radians and in degrees? Which angles (between 0° and 360°) does the point visit?",
  "hint": "The step is $2\\pi k/N$. When an angle passes 360°, subtract 360°.",
  "answer": "Step: $2\\pi \\cdot 3/8 = 3\\pi/4 \\approx 2.3562$ rad = 135°. Angles: 0°, 135°, 270°, 405° − 360° = 45°, 180°, 315°, 450° − 360° = 90°, 225°. The point visits all 8 points, each one once, in a different order."
}
```

```check
{
  "question": "Give the point on the unit circle at θ = −3π/4. Which positive angle gives the same point?",
  "hint": "A negative angle turns clockwise. Add 2π to get a positive angle for the same point.",
  "answer": "−3π/4 is 135° clockwise. The point is $(-\\sqrt{2}/2, -\\sqrt{2}/2) \\approx (-0.71, -0.71)$. The same point: −3π/4 + 2π = 5π/4 (225°)."
}
```

```check
{
  "question": "A colleague writes `np.sin(90)` and gets 0.894. What went wrong, and what is the correct call for the sine of 90°?",
  "hint": "Which unit does NumPy expect?",
  "answer": "NumPy reads the input in radians. 90 rad is about 14.3 turns, and its sine is about 0.894. For 90°, use `np.sin(np.pi / 2)` or `np.sin(np.deg2rad(90))`. Both give 1."
}
```

## 13. Links

- Previous lesson: [F1: Reading graphs](/notes/maths/fft-signal-processing/01-math-foundations/f1-graphs)
- Next lesson: [F3: Σ notation](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation)
- Used in: [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency), [L4: Phase](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase), [F5: Complex numbers](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers), [F6: Euler's formula](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula), [F7: Roots of unity](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity), [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)
- [01 Math foundations](/notes/maths/fft-signal-processing/01-math-foundations)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
