---
title: "L10: The complex probe"
order: 4
summary: "One complex probe e^(−iθ) = cos θ − i sin θ computes the cosine score and the sine score in one sum. Its magnitude says how much, and its angle says the phase."
status: not-started
tags: [dft, complex-numbers, euler, magnitude, phase]
---

## 1. The question this idea answers

Lesson [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) showed that one frequency needs two probes. The cosine probe at k = 2 scored 0, and the sine probe found the hidden sine with score 2. So each frequency needs two sweeps, two tables and two numbers.

Lesson [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality) showed that the DFT patterns are complex, and that their coordinates use a probe with a minus sign: $e^{-i 2\pi k n/N}$.

This lesson answers three questions:

1. How can **one** complex probe compute both scores at once?
2. How do we read the complex result as "how much" and "where in the cycle"?
3. Why does the probe have a minus sign, and what changes if we flip it?

## 2. Mental model

> [!analogy] A spinning point and two shadows
> A point travels around a circle. A lamp in front of it throws a shadow on a wall: the shadow moves from side to side as a cosine. A lamp above it throws a shadow on the floor: that shadow moves as a sine. One spinning point carries both waves at the same time. A complex probe is this spinning point, sampled at N instants.
>
> **Where it stops working:** shadows are only positions. Complex numbers also multiply, and the multiplication rule keeps the two parts apart when a real sample scales them ([F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)). That rule, not the picture, lets one complex sum compute both scores.

## 3. Terms

| Term | Plain meaning |
|---|---|
| complex probe | The probe $e^{-i 2\pi k n/N} = \cos(2\pi k n/N) - i\sin(2\pi k n/N)$. It holds the cosine probe and the sine probe in one list. |
| complex score | The matching score of the signal against the complex probe. For bin k it is the DFT coefficient X[k]. |
| real part | The part a of a complex number a + bi. Here it is the cosine score. |
| imaginary part | The part b of a complex number a + bi. Here it is minus the sine score. |
| magnitude $\lvert X \rvert$ | The length of the arrow of X: $\sqrt{a^2 + b^2}$. It tells how much of the frequency is present. |
| phase of X | The angle of the arrow of X, from the positive real axis. It tells where in its cycle the wave starts, compared with a cosine. |
| clockwise | The direction of $e^{-i\theta}$ as θ grows. The forward DFT uses this direction. |
| power $\lvert X \rvert^2$ | The squared magnitude. It is a different quantity from the magnitude. |

## 4. From two probes to one

Recall the two scores of L8, with the angle $\theta_n = 2\pi k n/N$:

$$
C[k] = \sum_{n=0}^{N-1} x[n] \cos\theta_n \qquad S[k] = \sum_{n=0}^{N-1} x[n] \sin\theta_n
$$

We want both numbers from one sum. Euler's formula ([F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)) gives a point on the unit circle that holds a cosine and a sine:

$$
e^{-i\theta} = \cos\theta - i\sin\theta
$$

Now use this point as the probe. Follow these steps:

1. Multiply one real sample by the probe. A real number scales both parts and does not mix them:
$$
x[n]\, e^{-i\theta_n} = x[n]\cos\theta_n - i\, x[n]\sin\theta_n
$$
2. Add over all n. A sum of complex numbers adds the real parts and the imaginary parts separately:
$$
\sum_{n=0}^{N-1} x[n]\, e^{-i\theta_n} = \sum_{n=0}^{N-1} x[n]\cos\theta_n \; - \; i \sum_{n=0}^{N-1} x[n]\sin\theta_n
$$
3. Recognize the two sums:
$$
\sum_{n=0}^{N-1} x[n]\, e^{-i 2\pi k n/N} = C[k] - i\, S[k]
$$

> [!key] One complex sum runs both probes
> Complex score = (cosine score) − i·(sine score). The real part is the cosine score. The imaginary part is **minus** the sine score.

Step 1 needs a real sample. For a complex signal, the parts mix, but the sum is still the correct DFT. This part uses only real signals.

## 5. Worked example: k = 2

The angle at sample n is $\theta_n = 2\pi \cdot 2n/8 = 90° \cdot n$. So the probe values are 1, −i, −1, i, and then they repeat.

| n | angle θ = 2π·2n/8 | x[n] | cos θ | sin θ | x[n]·cos θ | x[n]·sin θ | probe $e^{-i\theta}$ | x[n]·$e^{-i\theta}$ |
|---|---|---|---|---|---|---|---|---|
| 0 | 0° | 1.00 | 1 | 0 | 1.00 | 0.00 | $1$ | $1$ |
| 1 | 90° | 1.21 | 0 | 1 | 0.00 | 1.21 | $-i$ | $-1.21i$ |
| 2 | 180° | 0.00 | −1 | 0 | 0.00 | 0.00 | $-1$ | $0$ |
| 3 | 270° | −1.21 | 0 | −1 | 0.00 | 1.21 | $i$ | $-1.21i$ |
| 4 | 360° | −1.00 | 1 | 0 | −1.00 | 0.00 | $1$ | $-1$ |
| 5 | 450° | −0.21 | 0 | 1 | 0.00 | −0.21 | $-i$ | $0.21i$ |
| 6 | 540° | 0.00 | −1 | 0 | 0.00 | 0.00 | $-1$ | $0$ |
| 7 | 630° | 0.21 | 0 | −1 | 0.00 | −0.21 | $i$ | $0.21i$ |
| **sum** | | | | | **0** | **2** | | **$-2i$** |

Read the three sums in the last row:

1. Cosine score: 1 + 0 + 0 + 0 − 1 + 0 + 0 + 0 = 0. This is the 0 that puzzled us in L8.
2. Sine score: 1.21 + 1.21 − 0.21 − 0.21 = 2.
3. Complex score: $1 - 1.21i - 1.21i - 1 + 0.21i + 0.21i = 0 - 2i$.

So $X[2] = C[2] - i\,S[2] = 0 - i \cdot 2 = -2i$. The complex probe keeps the 2-cycle sine that the cosine probe missed.

Two terms of the complex sum are real: 1 at n = 0 and −1 at n = 4. They cancel. The other non-zero terms are imaginary.

> [!note] Rounding on this page
> The tables show two decimals, as the course video does: $1/\sqrt{2} = 0.7071\dots$ shows as 0.71, and $\sqrt{2} = 1.4142\dots$ shows as 1.41. The sums come from exact values. For example, 1.21 + 1.21 − 0.21 − 0.21 = 2 is exact, because $\frac{1+\sqrt{2}}{2} \cdot 2 - \frac{\sqrt{2}-1}{2} \cdot 2 = 2$.

The same method for k = 1 gives C[1] = 4 and S[1] = 0 (L8). So $X[1] = 4 - i \cdot 0 = 4$.

## 6. Read a complex score: magnitude and phase

A complex number $z = a + bi$ is a point in the plane ([F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)). You can describe it in two ways:

1. **Real and imaginary parts:** a and b.
2. **Magnitude and phase:** the length $\lvert z \rvert = \sqrt{a^2 + b^2}$, and the angle from the positive real axis.

One formula joins the two descriptions: $z = \lvert z \rvert\, e^{i \cdot \text{phase}}$.

> [!example] The point of the video: z = 1.41 + 1.41i
> 1. Magnitude: $\sqrt{1.41^2 + 1.41^2} = \sqrt{1.9881 + 1.9881} = 1.994$. With the exact value $\sqrt{2}$: $\sqrt{2 + 2} = 2$.
> 2. Phase: a and b are equal and positive, so the point is halfway between the real axis and the imaginary axis: 45°.
> 3. So $z = 2\, e^{i \cdot 45°}$.

For the two scores of the teaching signal:

| score | a | b | magnitude | phase |
|---|---|---|---|---|
| X[1] = 4 | 4 | 0 | 4 | 0° (along the positive real axis) |
| X[2] = −2i | 0 | −2 | 2 | −90° (straight down) |

### What the magnitude and the phase mean

Take one wave at bin k with amplitude A and phase φ: $A\cos(\theta_n + \varphi)$. L8 found its two scores, for 0 < k < N/2:

$$
C[k] = A\cos\varphi \cdot \frac{N}{2} \qquad S[k] = -A\sin\varphi \cdot \frac{N}{2}
$$

Put them into the complex score:

$$
X[k] = C[k] - i\,S[k] = \frac{AN}{2}\left(\cos\varphi + i\sin\varphi\right) = \frac{AN}{2}\, e^{i\varphi}
$$

1. **Magnitude** $\lvert X[k] \rvert = AN/2$. It depends only on the amplitude. It tells how much of the frequency is present.
2. **Phase** of X[k] = φ. It tells where in its cycle the wave starts, compared with a cosine.

The table shows four waves at k = 2 with N = 8, computed with NumPy. All have amplitude 0.5.

| wave | φ | C[2] | S[2] | X[2] | $\lvert X[2] \rvert$ | phase of X[2] |
|---|---|---|---|---|---|---|
| $0.5\cos\theta_n$ | 0° | 2 | 0 | $2$ | 2 | 0° |
| $0.5\sin\theta_n$ | −90° | 0 | 2 | $-2i$ | 2 | −90° |
| $0.5\cos(\theta_n - 45°)$ | −45° | 1.41 | 1.41 | $1.41 - 1.41i$ | 2 | −45° |
| $-0.5\sin\theta_n$ | +90° | 0 | −2 | $2i$ | 2 | +90° |

The magnitude is 2 in every row: the same amount of wave. Only the direction of the arrow changes.

> [!trap] The DFT measures phase from a cosine
> Chapter 2 of the course measures phase on a sine: $A\sin(2\pi f t + \varphi)$. The DFT measures phase on a cosine. So the DFT reports a pure sine as −90°, because $\sin\theta = \cos(\theta - 90°)$. Both descriptions are correct. They use different reference waves.

> [!trap] One frequency, not two
> The real part and the imaginary part are two views of one wave. They are not two frequencies. X[2] = −2i says: one 2-cycle wave, amplitude 0.5, that starts a quarter cycle behind a cosine.

> [!trap] Magnitude and power are different
> The magnitude is $\lvert X \rvert$. The power is $\lvert X \rvert^2$. For X[2] = −2i, the magnitude is 2 and the power is 4. Do not mix them in a plot or a formula.

## 7. Why the minus sign

### The direction of the probe

As θ grows, $e^{+i\theta}$ turns counterclockwise and $e^{-i\theta}$ turns clockwise. For k = 1 and N = 8, the probe values are:

| n | angle | probe $e^{-i 2\pi n/8}$ |
|---|---|---|
| 0 | 0° | $1$ |
| 1 | −45° | $0.71 - 0.71i$ |
| 2 | −90° | $-i$ |
| 3 | −135° | $-0.71 - 0.71i$ |
| 4 | −180° | $-1$ |
| 5 | −225° | $-0.71 + 0.71i$ |
| 6 | −270° | $i$ |
| 7 | −315° | $0.71 + 0.71i$ |

From 1 the probe goes down to $-i$, then to −1, then up to $i$. That is clockwise. The graph in section 8 shows the 8 points.

### Two reasons for the minus sign

1. **It is a convention.** The official documentation of NumPy, MATLAB and FFTW puts the minus sign in the forward transform. The inverse transform has the plus sign and the 1/N.
2. **It comes from the dot product.** L9 showed that the DFT patterns $e^{+i 2\pi k n/N}$ turn counterclockwise. A complex dot product conjugates the pattern. The conjugate of $e^{+i\theta}$ is $e^{-i\theta}$. So "the coordinate along a counterclockwise pattern" needs a clockwise probe.

> [!note] Sources checked
> NumPy defines $A_k = \sum_{m} a_m \exp\{-2\pi i\, mk/n\}$ for the forward transform, with the 1/n only in the inverse (default `norm="backward"`). MATLAB uses $W_n = e^{(-2\pi i)/n}$ in `fft`. FFTW says that `FFTW_FORWARD` has the sign −1 in the exponent, and that FFTW does not normalize. Sources: numpy.org (Discrete Fourier Transform, numpy.fft), mathworks.com (fft reference page), fftw.org (The 1d Discrete Fourier Transform).

### What changes if you flip the sign

Suppose a library uses $e^{+i\theta}$ in the forward transform. Call its result X'[k].

1. With a plus sign, the sum gives $C[k] + i\,S[k]$ instead of $C[k] - i\,S[k]$.
2. For a real signal, this is the conjugate: $X'[k] = \overline{X[k]}$.
3. It is also the score of bin N − k: $X'[k] = X[N-k]$. A plus-sign probe at k has the same samples as a minus-sign probe at N − k.

For the teaching signal, X'[2] = +2i and X'[6] = −2i. The magnitudes stay the same. The phases change sign: the sine now reads +90° instead of −90°. No information is lost. But you must use the inverse that matches the forward transform, and you must know the convention before you read a phase.

## 8. Graphs

The 8 values of the k = 1 probe lie on the unit circle, 45° apart. From n = 0 at 1, they turn clockwise:

```plot
{
  "title": "Unit circle (ink). The 8 probe values e^(−i2π·1·n/8) for k = 1 (gold), from n = 0 at 1, turning clockwise.",
  "xAxis": {"label": "real part", "domain": [-1.6, 1.6]},
  "yAxis": {"label": "imaginary part", "domain": [-1.4, 1.4]},
  "disableZoom": true,
  "data": [
    {"points": [[1.0, 0.0], [0.9962, 0.0872], [0.9848, 0.1736], [0.9659, 0.2588], [0.9397, 0.342], [0.9063, 0.4226], [0.866, 0.5], [0.8192, 0.5736], [0.766, 0.6428], [0.7071, 0.7071], [0.6428, 0.766], [0.5736, 0.8192], [0.5, 0.866], [0.4226, 0.9063], [0.342, 0.9397], [0.2588, 0.9659], [0.1736, 0.9848], [0.0872, 0.9962], [0.0, 1.0], [-0.0872, 0.9962], [-0.1736, 0.9848], [-0.2588, 0.9659], [-0.342, 0.9397], [-0.4226, 0.9063], [-0.5, 0.866], [-0.5736, 0.8192], [-0.6428, 0.766], [-0.7071, 0.7071], [-0.766, 0.6428], [-0.8192, 0.5736], [-0.866, 0.5], [-0.9063, 0.4226], [-0.9397, 0.342], [-0.9659, 0.2588], [-0.9848, 0.1736], [-0.9962, 0.0872], [-1.0, 0.0], [-0.9962, -0.0872], [-0.9848, -0.1736], [-0.9659, -0.2588], [-0.9397, -0.342], [-0.9063, -0.4226], [-0.866, -0.5], [-0.8192, -0.5736], [-0.766, -0.6428], [-0.7071, -0.7071], [-0.6428, -0.766], [-0.5736, -0.8192], [-0.5, -0.866], [-0.4226, -0.9063], [-0.342, -0.9397], [-0.2588, -0.9659], [-0.1736, -0.9848], [-0.0872, -0.9962], [0.0, -1.0], [0.0872, -0.9962], [0.1736, -0.9848], [0.2588, -0.9659], [0.342, -0.9397], [0.4226, -0.9063], [0.5, -0.866], [0.5736, -0.8192], [0.6428, -0.766], [0.7071, -0.7071], [0.766, -0.6428], [0.8192, -0.5736], [0.866, -0.5], [0.9063, -0.4226], [0.9397, -0.342], [0.9659, -0.2588], [0.9848, -0.1736], [0.9962, -0.0872], [1.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[1.0, 0.0], [0.7071, -0.7071], [0.0, -1.0], [-0.7071, -0.7071], [-1.0, 0.0], [-0.7071, 0.7071], [0.0, 1.0], [0.7071, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true}
  ]
}
```

The two non-zero scores in the lower half of the spectrum, as points in the complex plane. X[1] points along the real axis (phase 0°). X[2] points straight down (phase −90°):

```plot
{
  "title": "The complex plane: X[1] = 4 (gold point) and X[2] = −2i (ink point), with arrows from 0",
  "xAxis": {"label": "real part", "domain": [-1, 5]},
  "yAxis": {"label": "imaginary part", "domain": [-3, 3]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 0], [4, 0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[4, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[0, 0], [0, -2]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0, -2]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

## 9. Video

Watch a complex number as a point, then a point that travels around the unit circle. Note the two shadows.

```video
{
  "src": "/notes/media/fft-signal-processing/course/05_Why_Complex_Numbers.mp4",
  "start": "0:00",
  "end": "0:26",
  "caption": "A complex number is a point. A rotating point casts a cosine shadow and a sine shadow."
}
```

Watch Euler's formula, and the change of direction when the sign becomes minus.

```video
{
  "src": "/notes/media/fft-signal-processing/course/05_Why_Complex_Numbers.mp4",
  "start": "0:26",
  "end": "0:45",
  "caption": "Euler's formula names the rotating point. With a minus sign the point turns clockwise."
}
```

Watch the two ways to read a coefficient: real and imaginary parts, or magnitude and phase.

```video
{
  "src": "/notes/media/fft-signal-processing/course/05_Why_Complex_Numbers.mp4",
  "start": "0:45",
  "end": "1:00",
  "caption": "Magnitude says how much of a frequency is present. Phase says where its cycle starts."
}
```

Watch one complex sum run both probes, and the result for k = 2.

```video
{
  "src": "/notes/media/fft-signal-processing/course/05_Why_Complex_Numbers.mp4",
  "start": "1:00",
  "end": "1:19",
  "caption": "Real part = cosine score, imaginary part = minus the sine score. X[2] = −2i points straight down."
}
```

## 10. Code

Write the function `complex_score(x, k)`. It returns $\sum_n x[n]\, e^{-i 2\pi k n/N}$ as one complex number. Use a for-loop over n. NumPy writes the imaginary unit as `1j`, for example:

```python
probe_value = np.exp(-1j * 2 * np.pi * k * n / N)
```

Acceptance tests, with the teaching signal `x` of L7 and your sweeps of L8:

1. `np.isclose(complex_score(x, 1), 4)` is True.
2. `np.isclose(complex_score(x, 2), -2j)` is True.
3. For a random real `r` of length 16 and every k: `np.isclose(complex_score(r, k), cosine_sweep(r)[k] - 1j * sine_sweep(r)[k])` is True.
4. `np.isclose(abs(complex_score(x, 2)), 2)` and `np.isclose(np.degrees(np.angle(complex_score(x, 2))), -90)` are True.
5. For `y = 0.5 * np.cos(2 * np.pi * 2 * n / 8 - np.pi / 4)`: the magnitude of `complex_score(y, 2)` is 2, and its phase is −45°.
6. Write `complex_score_plus(x, k)` with $e^{+i\theta}$. For a random real `r`, it equals `np.conj(complex_score(r, k))` and also `complex_score(r, (N - k) % N)`.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe)

```check
{
  "question": "Stuck on the phase test? Use the hint first.",
  "hint": "NumPy gives the angle of a complex number in radians, between −π and π.",
  "answer": "Idea: `np.angle(z)` returns the phase in radians. Convert it to degrees with `np.degrees`. For z = −2i, the angle is −π/2 rad = −90°. The magnitude is `abs(z)`."
}
```

## 11. Common mistakes

1. **The imaginary part as a second frequency.** The real part and the imaginary part describe one wave. Together they give its phase.
2. **The imaginary part as the sine score.** The imaginary part is **minus** the sine score: X[2] = 0 − i·2, so the imaginary part is −2.
3. **Magnitude and power mixed.** $\lvert X \rvert$ is the magnitude. $\lvert X \rvert^2$ is the power.
4. **Phase measured from a sine.** The DFT measures phase from a cosine. A pure sine shows as −90°.
5. **Two sign conventions mixed.** A forward transform with $e^{+i\theta}$ gives conjugated values for a real signal. Use the matching inverse, and check the convention before you read a phase.
6. **Degrees inside `np.exp`.** NumPy works in radians. Write the angle as $2\pi k n/N$, not as 45·n.

## 12. One-minute explanation

L8 needed a cosine probe and a sine probe for each frequency. Euler's formula says that $e^{-i\theta} = \cos\theta - i\sin\theta$: one point on the unit circle holds a cosine and a sine. So we use this complex number as the probe. A real sample scales both parts, and a complex sum adds the real parts and the imaginary parts separately. So one sum gives the cosine score as the real part and minus the sine score as the imaginary part. For the teaching signal at k = 2, the cosine score is 0 and the sine score is 2, so X[2] = −2i. We read a complex score as a magnitude and a phase. The magnitude, 2, says how much of the frequency is present. The phase, −90°, says that the wave is a sine. The minus sign makes the probe turn clockwise. It is the convention of NumPy, MATLAB and FFTW.

## 13. Check questions

```check
{
  "question": "What is $e^{i\\pi/2}$? Where is it on the unit circle?",
  "hint": "Use Euler's formula with θ = 90°.",
  "answer": "$e^{i\\pi/2} = \\cos 90° + i \\sin 90° = 0 + i \\cdot 1 = i$. It is the point at the top of the unit circle."
}
```

```check
{
  "question": "A bin has cosine score 3 and sine score 0. What is X? What are its magnitude and its phase?",
  "hint": "X = C − i·S.",
  "answer": "X = 3 − i·0 = 3. Magnitude 3, phase 0°. The wave at this bin is a pure cosine."
}
```

```check
{
  "question": "Find the magnitude and the phase of z = 3 + 4i.",
  "hint": "Magnitude: √(a² + b²). Phase: the angle whose tangent is b/a, in the correct quarter of the plane.",
  "answer": "Magnitude: √(3² + 4²) = √(9 + 16) = √25 = 5. Phase: a and b are positive, so the angle is between 0° and 90°. The angle with tan = 4/3 is about 53.13°."
}
```

```check
{
  "question": "Why does one complex sum give both the cosine score and the sine score? Explain each step.",
  "hint": "Start from Euler's formula for the probe, then multiply by a real sample.",
  "answer": "Euler's formula gives the probe $e^{-i\\theta_n} = \\cos\\theta_n - i\\sin\\theta_n$. A real sample x[n] scales both parts: $x[n]\\cos\\theta_n - i\\,x[n]\\sin\\theta_n$. A sum of complex numbers adds the real parts and the imaginary parts separately. So the real part of the sum is the cosine score and the imaginary part is minus the sine score."
}
```

```check
{
  "question": "N = 8. A bin k = 2 has cosine score 0 and sine score −2. Find X[2], its magnitude, its phase, the amplitude A and the wave.",
  "hint": "X[k] = (AN/2)·e^{iφ} for 0 < k < N/2.",
  "answer": "X[2] = 0 − i·(−2) = 2i. Magnitude 2, phase +90°. AN/2 = 2, so A = 2 × 2/8 = 0.5. The wave is 0.5·cos(θ + 90°) = −0.5·sin θ, with θ = 2π·2n/8."
}
```

```check
{
  "question": "A library puts the plus sign in its forward transform. What does it report for bins 1, 2, 6 and 7 of the teaching signal?",
  "hint": "For a real signal, the flipped sign conjugates every coefficient.",
  "answer": "The usual result is X[1] = 4, X[2] = −2i, X[6] = 2i, X[7] = 4. The flipped sign conjugates each one: 4, 2i, −2i, 4. The magnitudes are the same. The phases change sign, so the sine at bin 2 now reads +90°."
}
```

## 14. Links

- Previous lesson: [L9: Basis and orthogonality](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality)
- Next lesson: [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)
- Part: [03 Matching to DFT](/notes/maths/fft-signal-processing/03-matching-to-dft)
- Math tools: [F5: Complex numbers](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers), [F6: Euler's formula](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)
- Phase: [L4: Phase](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase)
- The two scores: [L8: Sweep and cancellation](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
