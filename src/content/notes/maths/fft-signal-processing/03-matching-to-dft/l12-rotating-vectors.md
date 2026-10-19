---
title: "L12: Rotating vectors"
order: 6
summary: "Each DFT term is an arrow. Adding complex numbers places the arrows tip to tail, so reinforcement, cancellation and phase become a picture."
status: not-started
tags: [dft, complex-plane, vectors, phase]
---

## 1. The question this idea answers

Lesson [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula) computed each bin with a table of numbers. The tables gave X[1] = 4, X[3] = 0 and X[2] = −2i. But a table does not show **why** the terms of bin 1 reinforce and the terms of bin 3 cancel.

This lesson draws the same sums as a picture. Each term is an arrow in the complex plane. To add the terms, place the arrows tip to tail. The end of the chain is X[k]. With the picture you can:

1. See reinforcement: the arrows point the same way, and the chain goes far.
2. See cancellation: the arrows point in all directions, and the chain returns to its start.
3. See phase: the direction of the chain's end gives the phase of X[k].

## 2. Mental model

> [!analogy] A walk with N steps
> Each term is one step of a walk: a direction and a length. X[k] is the place where the walk ends, measured from the start. If most steps go the same way, you end far from the start. If the steps go evenly in all directions, you end where you started.
>
> **Where it stops working:** a real walk has a path that matters. A sum depends only on the end point: the order of the steps does not change it. Also, a step can have a negative length. Then you walk backwards, opposite to the direction of the probe.

## 3. Terms

| Term | Plain meaning |
|---|---|
| complex plane | A plane with the real part on the horizontal axis and the imaginary part on the vertical axis. A complex number is a point or an arrow from 0. |
| term arrow | The arrow of one term $x[n]\, e^{-i 2\pi k n/N}$. |
| probe arrow | The arrow of one probe value $e^{-i 2\pi k n/N}$. It has length 1. It gives the direction. |
| tip to tail | A method to add arrows: start each arrow at the tip of the arrow before it. |
| chain | All N term arrows, placed tip to tail. It starts at 0 and ends at X[k]. |
| position | The point that the chain reaches after a number of terms: the sum of the terms so far. |

## 4. Adding complex numbers is adding arrows

A complex number $a + bi$ is an arrow from 0 to the point (a, b) ([F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)). To add two complex numbers, add their real parts and their imaginary parts:

$$
(a + bi) + (c + di) = (a + c) + (b + d)\,i
$$

In the picture, this is tip to tail. Start the second arrow at the tip of the first arrow. The tip of the second arrow is now at (a + c, b + d).

> [!example] The first two terms of bin 1
> The terms are 1 (an arrow of length 1 to the right) and $0.85 - 0.85i$ (an arrow to the lower right).
>
> 1. Start at 0. The first arrow ends at 1.
> 2. Start the second arrow at 1. It ends at $1 + 0.85 - 0.85i = 1.85 - 0.85i$.
>
> The sum of the two terms is the tip of the second arrow: $1.85 - 0.85i$.

## 5. Each term as an arrow

A term is $x[n] \cdot e^{-i 2\pi k n/N}$. It has two parts with two different jobs:

1. **The probe gives the direction.** The probe arrow has length 1 and the angle $-360° \cdot kn/N$.
2. **The sample gives the length and the sign.** The term arrow is the probe arrow, stretched by $\lvert x[n] \rvert$.
3. **A negative sample turns the arrow by 180°.** Then the term points opposite to its probe arrow.
4. **A zero sample gives no arrow.** It adds nothing to the chain.

> [!example] The term at n = 3 of bin 1
> 1. Probe direction: $-45° \times 3 = -135°$. The probe arrow points to the lower left.
> 2. Sample: x[3] = −1.21. It is negative, so the term points opposite: −135° + 180° = 45°, to the upper right.
> 3. Length: 1.21. So the term is $1.21 \times (\cos 45° + i \sin 45°) = 0.85 + 0.85i$.
>
> The table of L11 gives the same term: $(-1.21) \times (-0.71 - 0.71i) = 0.85 + 0.85i$.

> [!note] Rounding on this page
> The tables show two decimals, as the course video does: $1/\sqrt{2} = 0.7071\dots$ shows as 0.71, and $\sqrt{2} = 1.4142\dots$ shows as 1.41. Each position comes from the exact terms. So a position can differ by 0.01 from a sum of rounded terms. For example, 1.85 + 0.85 = 2.70, but the exact position is 2.7071, which rounds to 2.71.

## 6. Bin k = 1: reinforcement

The probe turns one full circle clockwise over the 8 samples, 45° at each step.

| n | x[n] | probe direction | term x[n]·probe | arrow length | position after this term |
|---|---|---|---|---|---|
| 0 | 1.00 | 0° | $1$ | 1.00 | $1$ |
| 1 | 1.21 | −45° | $0.85 - 0.85i$ | 1.21 | $1.85 - 0.85i$ |
| 2 | 0.00 | −90° | $0$ | 0.00 | $1.85 - 0.85i$ |
| 3 | −1.21 | −135° | $0.85 + 0.85i$ | 1.21 | $2.71$ |
| 4 | −1.00 | 180° | $1$ | 1.00 | $3.71$ |
| 5 | −0.21 | 135° | $0.15 - 0.15i$ | 0.21 | $3.85 - 0.15i$ |
| 6 | 0.00 | 90° | $0$ | 0.00 | $3.85 - 0.15i$ |
| 7 | 0.21 | 45° | $0.15 + 0.15i$ | 0.21 | $4$ |

The table gives each direction between −180° and 180°. For example, −225° and 135° are the same direction.

Follow the chain:

1. n = 0: one step of length 1 to the right. Position 1.
2. n = 1: a step to the lower right. Position $1.85 - 0.85i$.
3. n = 2: x[2] = 0, so no step.
4. n = 3: x[3] is negative, so this step points opposite to its probe: to the upper right. Position 2.71, back on the real axis.
5. n = 4: x[4] = −1 and the probe is −1, so the step points to the right. Position 3.71.
6. n = 5 and n = 7: two short steps, one down and one up. Position 4.

Every step moves to the right. The up and down movements cancel in pairs. So the chain ends at **X[1] = 4**, on the real axis: phase 0°.

## 7. Bin k = 3: cancellation

The probe turns three full circles clockwise over the 8 samples, 3 × 45° = 135° at each step.

| n | x[n] | probe direction | term x[n]·probe | arrow length | position after this term |
|---|---|---|---|---|---|
| 0 | 1.00 | 0° | $1$ | 1.00 | $1$ |
| 1 | 1.21 | −135° | $-0.85 - 0.85i$ | 1.21 | $0.15 - 0.85i$ |
| 2 | 0.00 | 90° | $0$ | 0.00 | $0.15 - 0.85i$ |
| 3 | −1.21 | −45° | $-0.85 + 0.85i$ | 1.21 | $-0.71$ |
| 4 | −1.00 | 180° | $1$ | 1.00 | $0.29$ |
| 5 | −0.21 | 45° | $-0.15 - 0.15i$ | 0.21 | $0.15 - 0.15i$ |
| 6 | 0.00 | −90° | $0$ | 0.00 | $0.15 - 0.15i$ |
| 7 | 0.21 | 135° | $-0.15 + 0.15i$ | 0.21 | $0$ |

The steps now point in all directions: right, lower left, upper left, right, and two short steps. The chain makes a closed loop. It ends at 0, its start. So **X[3] = 0**.

![Two chains of term arrows on the complex plane. For k = 1 the arrows move right and reach 4. For k = 3 the arrows form a closed loop that ends at 0. Below each chain, the 8 gold probe directions on the unit circle.](/notes/media/fft-signal-processing/figures/l12-tip-to-tail-k1-k3.svg)

The figure draws every arrow from the tables. The k = 3 panel uses a larger scale, so read its axis numbers.

## 8. Bin k = 2: the phase

The probe turns two full circles over the 8 samples, 2 × 45° = 90° at each step. So the probe directions are right, down, left, up, and then they repeat.

| n | x[n] | probe direction | term x[n]·probe | arrow length | position after this term |
|---|---|---|---|---|---|
| 0 | 1.00 | 0° | $1$ | 1.00 | $1$ |
| 1 | 1.21 | −90° | $-1.21i$ | 1.21 | $1 - 1.21i$ |
| 2 | 0.00 | 180° | $0$ | 0.00 | $1 - 1.21i$ |
| 3 | −1.21 | 90° | $-1.21i$ | 1.21 | $1 - 2.41i$ |
| 4 | −1.00 | 0° | $-1$ | 1.00 | $-2.41i$ |
| 5 | −0.21 | −90° | $0.21i$ | 0.21 | $-2.21i$ |
| 6 | 0.00 | 180° | $0$ | 0.00 | $-2.21i$ |
| 7 | 0.21 | 90° | $0.21i$ | 0.21 | $-2i$ |

1. n = 0: a step of 1 to the right.
2. n = 1 and n = 3: two long steps of 1.21 down. (At n = 3 the sample is negative, so the "up" probe becomes a "down" step.)
3. n = 4: a step of 1 to the left. It cancels the step of n = 0.
4. n = 5 and n = 7: two short steps of 0.21 up.

The chain ends at **X[2] = −2i**: 2 units straight down. The real steps cancel. The down steps (2 × 1.21 = 2.41) are larger than the up steps (2 × 0.21 = 0.41), and 2.41 − 0.41 = 2.

The direction of the end, −90°, is the phase of X[2]. It records that this wave is a sine (L10). The length, 2, records the amplitude: 0.5 × 8/2 = 2.

> [!note] A detail in the video
> At 1:12 the video says that the terms of bin 2 all point down. Two terms point down, two short terms point up, and two terms are horizontal and cancel. The **end** of the chain points straight down.

## 9. Why a matching probe aligns the arrows

The chain picture has a simple explanation. Take the cosine part of the teaching signal and the probe of bin 1, with $\theta_n = 2\pi n/8$. Euler's formula ([F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)) splits the cosine into two rotating parts:

$$
\cos\theta_n \cdot e^{-i\theta_n} = \tfrac{1}{2}\left(e^{i\theta_n} + e^{-i\theta_n}\right) e^{-i\theta_n} = \tfrac{1}{2} + \tfrac{1}{2}e^{-i 2\theta_n}
$$

1. **The fixed part.** The first part is $\tfrac{1}{2}$ at every sample: the same arrow 8 times. These arrows stack in a straight line and give 8 × ½ = 4.
2. **The spinning part.** The second part turns 2 full circles over the 8 samples. Its 8 arrows spread evenly around the circle and sum to 0 ([F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)).

The sine part of the signal gives only spinning parts against the k = 1 probe, so it adds 0. In bin 3, every part spins, so the whole chain returns to 0.

> [!key] What every bin does
> Each term arrow is a fixed part plus spinning parts. The probe "stops" the rotation of the wave that has its own frequency. That wave gives a fixed arrow, and its N copies add in a straight line. Every other wave keeps spinning, and its arrows cancel. Alignment gives a long chain. A mismatch closes the chain into a loop.

## 10. The length of the chain is not the sum of the lengths

The 8 term arrows of bin 1 have the lengths 1, 1.21, 0, 1.21, 1, 0.21, 0, 0.21. Their total length is 4.83 (exactly $2 + 2\sqrt{2} = 4.8284$). But $\lvert X[1] \rvert = 4$.

The difference comes from the directions. Some arrows point down and some point up, so part of their length cancels. The end of a chain can never be farther from the start than the total length of the arrows. It equals the total length only when all arrows point in exactly the same direction.

## 11. Graphs

The chain for k = 2, as a path of positions from 0. The path goes right, down, down, left, then up a little. It ends straight below the start:

```plot
{
  "title": "k = 2: the path of the chain from 0 (ink). The end point X[2] = −2i (gold).",
  "xAxis": {"label": "real part", "domain": [-1.5, 2.5]},
  "yAxis": {"label": "imaginary part", "domain": [-3, 1]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 0.0], [1.0, 0.0], [1.0, -1.2071], [1.0, -1.2071], [1.0, -2.4142], [0.0, -2.4142], [0.0, -2.2071], [0.0, -2.2071], [0.0, -2.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.0], [1.0, -1.2071], [1.0, -1.2071], [1.0, -2.4142], [0.0, -2.4142], [0.0, -2.2071], [0.0, -2.2071], [0.0, -2.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[0, -2]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true}
  ]
}
```

## 12. Video

Watch the k = 1 probe arrows (orange in the video), then the term arrows (white) placed tip to tail. Note the term of n = 3.

```video
{
  "src": "/notes/media/fft-signal-processing/course/07_The_Rotating_Vector_Picture.mp4",
  "start": "0:00",
  "end": "0:38",
  "caption": "Bin 1: scale each probe arrow by its sample, then place the terms tip to tail. X[1] = 4."
}
```

Watch bin 3. The probe arrows jump by 135°, and the chain closes.

```video
{
  "src": "/notes/media/fft-signal-processing/course/07_The_Rotating_Vector_Picture.mp4",
  "start": "0:38",
  "end": "0:58",
  "caption": "Bin 3: the terms point in all directions, and the path returns to the start."
}
```

Watch bin 2. The probe arrows jump by 90°, and the chain ends straight down.

```video
{
  "src": "/notes/media/fft-signal-processing/course/07_The_Rotating_Vector_Picture.mp4",
  "start": "0:58",
  "end": "1:20",
  "caption": "Bin 2: the chain ends at −2i. The direction −90° records that the wave is a sine."
}
```

Watch the summary of what every bin does.

```video
{
  "src": "/notes/media/fft-signal-processing/course/07_The_Rotating_Vector_Picture.mp4",
  "start": "1:20",
  "end": "1:30",
  "caption": "Each bin measures the whole signal against one frequency pattern."
}
```

## 13. Code

Write the function `chain(x, k)`.

1. Input: a sequence x of N samples and a bin k.
2. Output: a complex NumPy array of N + 1 positions. Position 0 is 0. Position m is the sum of the first m terms.
3. Then plot the chain for k = 1, 2 and 3 in the complex plane, with real parts on the horizontal axis.

The plot of a list of complex positions z is one matplotlib call:

```python
plt.plot(z.real, z.imag, "o-")
```

Acceptance tests, with the teaching signal `x`:

1. `len(chain(x, 1)) == 9` and `chain(x, 1)[0] == 0` are True.
2. `np.isclose(chain(x, 1)[-1], 4)`, `np.isclose(chain(x, 3)[-1], 0, atol=1e-12)` and `np.isclose(chain(x, 2)[-1], -2j)` are True.
3. For every k from 0 to 7: `np.isclose(chain(x, k)[-1], np.fft.fft(x)[k])` is True.
4. The total length of the arrows of bin 1 is about 4.83: the sum of `abs(np.diff(chain(x, 1)))` is close to `2 + 2 * np.sqrt(2)`.
5. Shuffle the order of the terms at random. The end point does not change.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors)

```check
{
  "question": "Stuck on `chain`? Use the hint first.",
  "hint": "Compute the N terms first. A running sum of a list gives all the positions.",
  "answer": "Idea: make the N terms x[n]·exp(−2πi·k·n/N). Then compute the running sum (NumPy has a function for a cumulative sum). Put a 0 in front of the result, so that the chain starts at the origin."
}
```

## 14. Common mistakes

1. **The probe arrow and the term arrow mixed.** The probe gives only the direction. The sample gives the length and the sign.
2. **A negative sample drawn along its probe.** A negative sample turns the term by 180°: it points opposite to its probe arrow.
3. **Lengths added instead of arrows.** $\lvert X[k] \rvert$ is not the sum of the arrow lengths. For bin 1 the lengths sum to 4.83, but $\lvert X[1] \rvert = 4$.
4. **"The order of the terms matters."** The end point of the chain does not depend on the order. Only the drawing changes.
5. **A short end arrow read as "small signal".** X[3] = 0 means no 3-cycle wave. The teaching signal itself is not small.

## 15. One-minute explanation

Each term of a DFT bin is a complex number, so it is an arrow in the complex plane. The probe gives the direction of the arrow, and the sample gives its length and sign: a negative sample flips the arrow. Adding complex numbers means placing the arrows tip to tail. The end of the chain is X[k]. For bin 1 of the teaching signal, the arrows keep pointing to the right, so they reinforce and the chain reaches 4. For bin 3, the arrows point in all directions and the chain returns to its start: X[3] = 0. For bin 2, the chain ends 2 units straight down: X[2] = −2i. That direction, −90°, is the phase, and it says that the wave is a sine. Alignment reinforces. Mismatch cancels.

## 16. Check questions

```check
{
  "question": "What does 'tip to tail' mean? Use it to add 2 + i and 1 − 3i.",
  "hint": "Start the second arrow at the tip of the first one.",
  "answer": "Tip to tail: start each arrow at the tip of the arrow before it. The end of the last arrow is the sum. 2 + i ends at (2, 1). Start 1 − 3i there: it ends at (2 + 1, 1 − 3) = (3, −2). So the sum is 3 − 2i."
}
```

```check
{
  "question": "Four terms are 1, i, −1 and −i. Place them tip to tail. Where does the chain end?",
  "hint": "Right, up, left, down.",
  "answer": "1 goes to (1, 0). i goes up to (1, 1). −1 goes left to (0, 1). −i goes down to (0, 0). The chain ends at its start, so the sum is 0: complete cancellation."
}
```

```check
{
  "question": "N = 8. Every term points along +1 and has length 0.5. What is X?",
  "hint": "All arrows point in exactly the same direction.",
  "answer": "The arrows form one straight line: 8 × 0.5 = 4. So X = 4, with phase 0°."
}
```

```check
{
  "question": "In bin 1 of the teaching signal, the probe arrow of n = 3 points to −135°. Why does the term arrow of n = 3 point to +45°?",
  "hint": "Check the sign of x[3].",
  "answer": "x[3] = −1.21 is negative. Multiplying by a negative number turns the arrow by 180°. So the term points to −135° + 180° = 45°, opposite to its probe arrow, with length 1.21. The term is 0.85 + 0.85i."
}
```

```check
{
  "question": "The 8 term arrows of bin 1 have a total length of 4.83. Why is |X[1]| only 4?",
  "hint": "Compare the directions of the arrows.",
  "answer": "The arrows do not all point in the same direction. The arrows of n = 1 and n = 5 point down, and the arrows of n = 3 and n = 7 point up. Their vertical parts cancel. Only the horizontal parts add, and they sum to 4. The end of a chain reaches the total length only when all the arrows are parallel."
}
```

```check
{
  "question": "Predict where the chain of bin 6 of the teaching signal ends. Explain with the mirror rule.",
  "hint": "Bin 6 is the mirror of bin 2: X[N − k] is the conjugate of X[k].",
  "answer": "X[6] = conj(X[2]) = conj(−2i) = 2i. The chain ends 2 units straight up: the mirror image of the chain of bin 2 across the real axis. Its phase is +90°."
}
```

## 17. Links

- Previous lesson: [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)
- Next lesson: [L13: The inverse DFT](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft)
- Part: [03 Matching to DFT](/notes/maths/fft-signal-processing/03-matching-to-dft)
- Math tools: [F5: Complex numbers](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers), [F6: Euler's formula](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula), [F7: Roots of unity](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)
- The phase: [L10: The complex probe](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe)
- The mirror: [L24: The mirror](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
