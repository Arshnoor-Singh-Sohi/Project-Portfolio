---
title: "F5: Complex numbers"
order: 5
summary: "A complex number is one number with two parts, drawn as an arrow. Multiplication scales the arrow and turns it."
status: not-started
tags: [math, complex-numbers, rotation, foundations]
---

## 1. The question this idea answers

A cosine probe cannot see a sine part of a signal. In the course, the cosine score at $k = 2$ is 0, but the sine score is 2 ([L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation)). So each frequency needs two scores. Can one number hold both scores, and still obey the rules of arithmetic?

A complex number does this. It also gives the FFT its main tool: multiplication by a complex number turns an arrow. The FFT story uses complex numbers in these lessons:

1. [L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe): one complex score holds the cosine score and the sine score.
2. [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula) and [L12](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors): each DFT term is an arrow, and the coefficient $X[k]$ is their sum.
3. [L17](/notes/maths/fft-signal-processing/04-fft/l17-the-butterfly): the butterfly multiplies $1.41 + 1.41i$ by $0.71 - 0.71i$ and gets 2. Section 9 of this lesson does exactly this product.
4. [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror): the mirror of the spectrum uses the conjugate.

The previous lesson, [F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product), treated a list as an arrow. This lesson treats one number as an arrow in a plane.

## 2. Mental model

> [!analogy] An arrow on a map, and an instruction to a robot
> A complex number is an arrow on a map: the east part is the real part, and the north part is the imaginary part. Multiplication by a complex number is an instruction to a robot that holds an arrow: "turn by this angle, then stretch by this factor".
>
> **Where it stops working:** on a map you cannot multiply two places. With complex numbers you can, and the result is a new arrow. Also, the word "imaginary" does not mean "not real" or "not useful". The imaginary part is a normal number on the second axis.

## 3. Terms

| Term | Plain meaning |
|---|---|
| imaginary unit ($i$) | A new number with $i^2 = -1$. No ordinary number has this property. |
| complex number | A number $z = a + bi$, where $a$ and $b$ are ordinary (real) numbers. |
| real part ($\operatorname{Re} z$) | The number $a$ in $a + bi$. |
| imaginary part ($\operatorname{Im} z$) | The number $b$ in $a + bi$. It is a real number. It does not include the $i$. |
| complex plane | A plane with the real part on the horizontal axis and the imaginary part on the vertical axis. |
| real axis | The horizontal axis of the complex plane. |
| imaginary axis | The vertical axis of the complex plane. |
| magnitude ($\lvert z \rvert$) | The length of the arrow: $\sqrt{a^2 + b^2}$. |
| phase ($\arg z$) | The direction of the arrow: its angle from the positive real axis, counter-clockwise positive. |
| polar form | $z = r(\cos\theta + i\sin\theta)$, with the magnitude $r$ and the phase $\theta$. |
| conjugate ($\overline{z}$) | $a - bi$: the mirror image of $z$ across the real axis. |
| atan2 | A function `atan2(b, a)` that gives the phase of $a + bi$ in the correct quarter. |

## 4. Why complex numbers

Two facts make complex numbers the right tool for the DFT:

1. **One number, two parts.** A complex number has a real part and an imaginary part. [L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe) puts the cosine score in the real part and the sine score in the imaginary part: $X[k] = (\text{cosine score}) - i\,(\text{sine score})$.
2. **Multiplication turns.** Multiplication by a complex number of length 1 turns an arrow and keeps its length. The probe of the DFT is such a turning number ([F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)). The FFT combines its two halves with one turn per pair ([L17](/notes/maths/fft-signal-processing/04-fft/l17-the-butterfly)).

A pair of numbers $(a, b)$ could hold two scores. But a plain pair has no multiplication rule that turns arrows. The complex numbers add exactly this rule.

## 5. The imaginary unit and the complex plane

### i² = −1

Every ordinary number squared is 0 or positive: $3^2 = 9$ and $(-3)^2 = 9$. So no ordinary number squares to −1. Mathematicians add one new number $i$ with this single rule:

$$
i^2 = -1
$$

All other rules of arithmetic stay the same: you can add, subtract, multiply, and expand brackets as usual.

The powers of $i$ repeat with a cycle of 4:

| Power | $i^0$ | $i^1$ | $i^2$ | $i^3$ | $i^4$ | $i^5$ |
|---|---|---|---|---|---|---|
| Value | 1 | $i$ | −1 | $-i$ | 1 | $i$ |
| Why | by definition | by definition | the rule | $i^2 \cdot i = -i$ | $i^2 \cdot i^2 = (-1)(-1)$ | $i^4 \cdot i$ |

[F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary) explains this kind of repeat as clock arithmetic: $i^n$ depends only on $n$ mod 4.

### Complex numbers as points and arrows

A complex number is $z = a + bi$. Both $a$ and $b$ are ordinary numbers.

| $z$ | Real part $a$ | Imaginary part $b$ |
|---|---|---|
| $3 + 4i$ | 3 | 4 |
| $1.41 + 1.41i$ | 1.41 | 1.41 |
| $-2i$ | 0 | −2 |
| $4$ | 4 | 0 |

Draw $z$ as the point $(a, b)$ in the complex plane, or as an arrow from the origin to that point. An ordinary number is a complex number with $b = 0$. It lies on the real axis.

### Add and subtract: part by part

Add the real parts. Add the imaginary parts.

$$
(3 + 4i) + (1 - 2i) = (3 + 1) + (4 - 2)i = 4 + 2i
$$

$$
(3 + 4i) - (1 - 2i) = (3 - 1) + (4 + 2)i = 2 + 6i
$$

As arrows, addition is tip to tail: put the second arrow at the tip of the first. This is the same rule as for vectors in [F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product). [L12](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors) adds the 8 terms of a DFT coefficient this way.

## 6. Multiply

### Step by step

Expand the brackets like ordinary algebra. Then replace $i^2$ with −1:

$$
(a + bi)(c + di) = ac + adi + bci + bd\,i^2 = (ac - bd) + (ad + bc)\,i
$$

> [!example] (3 + 4i)(1 − 2i)
> 1. Expand: $3 \cdot 1 + 3 \cdot (-2i) + 4i \cdot 1 + 4i \cdot (-2i) = 3 - 6i + 4i - 8i^2$.
> 2. Replace $i^2$: $-8i^2 = -8(-1) = +8$.
> 3. Collect: real part $3 + 8 = 11$, imaginary part $-6 + 4 = -2$.
> 4. Result: $11 - 2i$.

### Multiply by an ordinary number: scale

$2 \cdot (1 + i) = 2 + 2i$. The arrow keeps its direction and becomes twice as long.

### Multiply by i: a quarter turn counter-clockwise

$$
i\,(a + bi) = ai + b\,i^2 = -b + ai
$$

The point $(a, b)$ moves to $(-b, a)$. This is a quarter turn counter-clockwise ([F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle), section 6). The length does not change: $\sqrt{(-b)^2 + a^2} = \sqrt{a^2 + b^2}$.

> [!example] i(3 + 4i)
> $i(3 + 4i) = 3i + 4i^2 = -4 + 3i$. Check with F4: $[3, 4] \cdot [-4, 3] = -12 + 12 = 0$, so the two arrows are perpendicular. Both have length 5.

### Multiply by −i: a quarter turn clockwise

$$
-i\,(a + bi) = -ai - b\,i^2 = b - ai
$$

The point $(a, b)$ moves to $(b, -a)$: a quarter turn clockwise. For example, $-i \cdot 2 = -2i$. The course uses this in the butterfly for $k = 2$: $W_8^2 = -i$, and $-i \cdot O[2] = -i \cdot 2 = -2i$ ([L17](/notes/maths/fft-signal-processing/04-fft/l17-the-butterfly)).

### Any multiplication: scale and rotate

> [!key] Multiplication = scale and rotate
> $$\lvert zw \rvert = \lvert z \rvert\,\lvert w \rvert \qquad \arg(zw) = \arg z + \arg w$$
> The magnitudes multiply. The phases add.

Why it is true. Let $w = c + di$. Expand only the second number:

$$
z\,w = z\,(c + di) = c \cdot z + d \cdot (iz)
$$

1. $c \cdot z$ is the arrow $z$, scaled by the ordinary number $c$.
2. $iz$ is the arrow $z$ turned by a quarter turn. It has the same length as $z$.
3. So $zw$ is "$c$ steps along $z$, plus $d$ steps along $iz$".
4. Compare with $w$ itself: $w = c \cdot 1 + d \cdot i$ is "$c$ steps along 1, plus $d$ steps along $i$".
5. The pair ($z$, $iz$) is the pair (1, $i$), turned by the phase of $z$ and scaled by $\lvert z \rvert$. So $zw$ is the arrow $w$, turned by the phase of $z$ and scaled by $\lvert z \rvert$.

![Alt text: the product of z = 2 + i and w = 1 + i, built from z and iz, with the angles 26.57° and 45° that add to 71.57°](/notes/media/fft-signal-processing/figures/f5-multiply-scale-rotate.svg)

> [!example] (2 + i)(1 + i) in both ways
> Algebra: $(2 + i)(1 + i) = 2 + 2i + i + i^2 = 2 + 3i - 1 = 1 + 3i$.
>
> Scale and rotate:
> 1. $\lvert 2 + i \rvert = \sqrt{5} \approx 2.236$, with the phase $\approx 26.57°$.
> 2. $\lvert 1 + i \rvert = \sqrt{2} \approx 1.414$, with the phase $45°$.
> 3. Product: magnitude $\sqrt{5}\sqrt{2} = \sqrt{10} \approx 3.162$, phase $26.57° + 45° = 71.57°$.
> 4. Check: $\lvert 1 + 3i \rvert = \sqrt{1 + 9} = \sqrt{10}$, and the phase of $1 + 3i$ is about 71.57°.

### A result for free: the angle-sum rules

Take two arrows of length 1: $\cos\alpha + i\sin\alpha$ and $\cos\beta + i\sin\beta$. Multiply them in two ways.

1. Algebra: $(\cos\alpha\cos\beta - \sin\alpha\sin\beta) + i\,(\sin\alpha\cos\beta + \cos\alpha\sin\beta)$.
2. Scale and rotate: length $1 \cdot 1 = 1$, phase $\alpha + \beta$, so $\cos(\alpha + \beta) + i\sin(\alpha + \beta)$.

The real parts are equal, and the imaginary parts are equal:

$$
\cos(\alpha + \beta) = \cos\alpha\cos\beta - \sin\alpha\sin\beta \qquad \sin(\alpha + \beta) = \sin\alpha\cos\beta + \cos\alpha\sin\beta
$$

Check with α = 30° and β = 45°: $0.8660 \cdot 0.7071 - 0.5 \cdot 0.7071 = 0.6124 - 0.3536 = 0.2588 = \cos 75°$.

## 7. Magnitude, phase and polar form

### Magnitude

The magnitude is the length of the arrow. Pythagoras gives:

$$
\lvert a + bi \rvert = \sqrt{a^2 + b^2}
$$

For example, $\lvert 3 + 4i \rvert = \sqrt{9 + 16} = \sqrt{25} = 5$.

### Phase

The phase is the angle of the arrow, from the positive real axis, counter-clockwise positive. On a circle of radius $r = \lvert z \rvert$, the point at angle θ is $(r\cos\theta, r\sin\theta)$ ([F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle)). So $a = r\cos\theta$ and $b = r\sin\theta$, and $\tan\theta = b/a$.

> [!trap] atan(b/a) loses the quarter
> Take $z = -1 - i$. Then $b/a = (-1)/(-1) = 1$, and $\arctan(1) = 45°$. But $-1 - i$ points down and to the left. Its phase is −135° (the same direction as 225°). The division $b/a$ removes the two minus signs, so the quarter is lost. Also, $b/a$ has no value when $a = 0$.
>
> Use `atan2(b, a)`. It reads both signs and returns the phase between −180° and 180°. Note the order: the imaginary part comes first.

| $z$ | `atan(b/a)` | `atan2(b, a)` | Correct direction |
|---|---|---|---|
| $3 + 4i$ | 53.13° | 53.13° | first quarter |
| $-3 + 4i$ | −53.13° (wrong) | 126.87° | second quarter |
| $-1 - i$ | 45° (wrong) | −135° | third quarter |
| $-2i$ | no value | −90° | straight down |
| $-1$ | 0° (wrong) | 180° | straight left |

For a negative real number, `atan2` can also print −180°. This happens when the imaginary part is the value −0.0. Both answers name the same direction. In Python, `cmath.phase(z)` and `np.angle(z)` give the phase in radians with the same rule.

### Polar form

The magnitude and the phase describe $z$ completely:

$$
z = r\,(\cos\theta + i\sin\theta), \qquad r = \lvert z \rvert, \quad \theta = \arg z
$$

> [!example] Two numbers from the course
> $1.41 + 1.41i$: $r = \sqrt{1.41^2 + 1.41^2} \approx 1.994$, which is about 2. The value 1.41 is $\sqrt{2} \approx 1.4142$ rounded, and with the exact $\sqrt{2}$ the magnitude is exactly 2. The phase is 45°. So $z \approx 2(\cos 45° + i \sin 45°)$.
>
> $X[2] = -2i$ ([L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)): magnitude 2, phase −90°. The arrow points straight down.

The course rounds $1/\sqrt{2} \approx 0.7071$ to 0.71 and $\sqrt{2} \approx 1.4142$ to 1.41. This page uses the same rounding.

[F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula) writes the polar form in a short way: $z = r\,e^{i\theta}$.

## 8. The conjugate

The conjugate of $z = a + bi$ is $\overline{z} = a - bi$. It is the mirror image of $z$ across the real axis. It has the same magnitude and the opposite phase.

The product of a number and its conjugate is always an ordinary, non-negative number:

$$
z\,\overline{z} = (a + bi)(a - bi) = a^2 - abi + abi - b^2 i^2 = a^2 + b^2 = \lvert z \rvert^2
$$

For example, $(3 + 4i)(3 - 4i) = 9 + 16 = 25 = 5^2$. Scale and rotate gives the same result: the phases $+53.13°$ and $-53.13°$ add to 0, and the magnitudes give $5 \times 5$.

The conjugate also gives division. Multiply the top and the bottom by $\overline{z}$:

$$
\frac{1}{z} = \frac{\overline{z}}{z\,\overline{z}} = \frac{\overline{z}}{\lvert z \rvert^2} \qquad \text{for example} \qquad \frac{1}{3 + 4i} = \frac{3 - 4i}{25} = 0.12 - 0.16i
$$

The conjugate returns in these lessons:

1. [L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe): the matching score of complex lists uses the conjugate of the probe.
2. [L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft): the inverse DFT turns the other way.
3. [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror): for a real signal, $X[N-k] = \overline{X[k]}$.

## 9. Worked example: the butterfly product

> [!example] (1.41 + 1.41i)(0.71 − 0.71i)
> **Step by step, with the rounded values.** Here $a = 1.41$, $b = 1.41$, $c = 0.71$, $d = -0.71$.
>
> | Part | Computation | Value |
> |---|---|---|
> | $ac$ | 1.41 × 0.71 | 1.0011 |
> | $bd$ | 1.41 × (−0.71) | −1.0011 |
> | $ad$ | 1.41 × (−0.71) | −1.0011 |
> | $bc$ | 1.41 × 0.71 | 1.0011 |
> | real part $ac - bd$ | 1.0011 − (−1.0011) | 2.0022 |
> | imaginary part $ad + bc$ | −1.0011 + 1.0011 | 0 |
>
> So the product is about $2.0022$, which is 2 within the rounding.
>
> **With exact values.** $1.41 + 1.41i$ is $\sqrt{2}(1 + i)$, and $0.71 - 0.71i$ is $(1 - i)/\sqrt{2}$. So:
>
> $$\sqrt{2}(1 + i) \cdot \frac{1 - i}{\sqrt{2}} = (1 + i)(1 - i) = 1 - i + i - i^2 = 1 + 1 = 2$$
>
> The product is exactly 2.
>
> **As scale and rotate.** The first number has magnitude 2 and phase 45°. The second has magnitude 1 and phase −45°. So the product has magnitude 2 × 1 = 2 and phase 45° − 45° = 0°. That is the number 2 on the real axis.

The second number has magnitude 1, so it only turns the first number by 45° clockwise. In the FFT, this second number is the twiddle factor $W_8^1$ ([F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)), and the first is $O[1]$ ([L17](/notes/maths/fft-signal-processing/04-fft/l17-the-butterfly)).

```plot
{
  "title": "O[1] = 1.41 + 1.41i (blue), twiddle 0.71 - 0.71i (gold), product = 2 (ink): a turn of 45° clockwise",
  "xAxis": { "label": "real part", "domain": [-0.5, 2.5] },
  "yAxis": { "label": "imaginary part", "domain": [-1, 1.8] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0], [1.41, 1.41]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[1.41, 1.41]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0], [0.71, -0.71]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0.71, -0.71]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true },
    { "points": [[0, 0], [2, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[2, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true }
  ]
}
```

## 10. Video and pictures

Watch the first clip for the picture of a complex number: a point with a real coordinate and an imaginary coordinate.

```video
{
  "src": "/notes/media/fft-signal-processing/course/05_Why_Complex_Numbers.mp4",
  "start": "0:03",
  "end": "0:11",
  "caption": "A complex number z = a + bi is a point: a along the real axis, b along the imaginary axis."
}
```

Watch the second clip for the two ways to read one complex number: real and imaginary parts, or magnitude and phase.

```video
{
  "src": "/notes/media/fft-signal-processing/course/05_Why_Complex_Numbers.mp4",
  "start": "0:45",
  "end": "0:52",
  "caption": "A complex coefficient read as real and imaginary parts, or as magnitude and phase."
}
```

The third clip is a preview of the FFT. Look for the turn of $1.41 + 1.41i$ by −45° that gives exactly 2: the worked example of section 9.

```video
{
  "src": "/notes/media/fft-signal-processing/course/09_The_FFT_Butterfly_Algorithm.mp4",
  "start": "1:19",
  "end": "1:34",
  "caption": "The twiddle factor turns O[1] = 1.41 + 1.41i by 45° clockwise and gives 2."
}
```

## 11. Code

Build complex arithmetic from ordinary numbers. Do not use Python's `complex` type or `1j` inside your functions. You may use them in the tests.

1. Write `cmul(a, b, c, d)`. It returns the pair `(real, imag)` of $(a + bi)(c + di)$.
2. Write `mag_phase(a, b)`. It returns the magnitude and the phase in degrees. Use `math.sqrt` and `math.atan2`.
3. Write `conj(a, b)`. It returns the pair of the conjugate.

Acceptance tests:

- For 5 random pairs, `cmul(a, b, c, d)` equals `((a + b*1j) * (c + d*1j)).real` and `.imag` within `1e-12`.
- `cmul(3, 4, 1, -2) == (11, -2)` is True.
- `mag_phase(3, 4)` is about `(5, 53.13)`. `mag_phase(-1, -1)` is about `(1.4142, -135)`. `mag_phase(0, -2)` is `(2, -90)`.
- For 5 random `z`, the phase of `cmul(0, 1, a, b)` minus the phase of `(a, b)` is 90° or −270°.
- For 5 random `(a, b)`, `cmul(a, b, *conj(a, b))` has imaginary part 0 and real part `a**2 + b**2`.
- `cmul(1.41, 1.41, 0.71, -0.71)` is about `(2.0022, 0)`. With `math.sqrt(2)` and `1 / math.sqrt(2)` it is `(2, 0)` within `1e-12`.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)

```check
{
  "question": "Stuck on `cmul`?",
  "hint": "Expand $(a + bi)(c + di)$ into four products, then use $i^2 = -1$.",
  "answer": "The real part collects the two products without i, and the product of the two i terms, which changes sign because $i^2 = -1$. The imaginary part collects the two mixed products. So the real part is ac − bd and the imaginary part is ad + bc."
}
```

## 12. Common mistakes

1. **$i^2 = 1$.** The definition is $i^2 = -1$. So $i \cdot i = -1$ and $(-i)(-i) = -1$ too.
2. **The imaginary part with the $i$.** The imaginary part of $3 + 4i$ is 4, an ordinary number. It is not $4i$.
3. **Multiplication part by part.** $(a + bi)(c + di)$ is not $ac + bd\,i$. Expand all four products.
4. **The phase from `atan(b/a)`.** It loses the quarter. Use `atan2(b, a)`, with the imaginary part first.
5. **Magnitudes added in a product.** In a product the magnitudes multiply and the phases add. In a sum, neither rule holds: add the parts.
6. **The imaginary part as a second frequency.** The real and the imaginary part of $X[k]$ are two views of one oscillation at one frequency. Together they give its phase.
7. **The conjugate with the wrong sign.** The conjugate changes only the sign of the imaginary part.

## 13. One-minute explanation

A complex number $a + bi$ has a real part $a$ and an imaginary part $b$, with the one new rule $i^2 = -1$. Draw it as an arrow to the point $(a, b)$, and add part by part, which is tip to tail. Multiply by expanding the brackets: $(a + bi)(c + di) = (ac - bd) + (ad + bc)i$. In pictures, the magnitudes multiply and the phases add. So multiplication by $i$ is a quarter turn, and multiplication by a number of length 1 is a pure turn. That is why one multiplication by $0.71 - 0.71i$ turns $1.41 + 1.41i$ by 45° clockwise and gives 2.

## 14. Check questions

```check
{
  "question": "What are $i^2$, $i^3$ and $i^4$?",
  "hint": "Start from $i^2 = -1$ and multiply by i each time.",
  "answer": "$i^2 = -1$. $i^3 = i^2 \\cdot i = -i$. $i^4 = i^2 \\cdot i^2 = (-1)(-1) = 1$."
}
```

```check
{
  "question": "Compute $(2 + 3i)(1 - i)$ by hand. Show every step.",
  "hint": "Four products, then replace $i^2$ with −1.",
  "answer": "$2 \\cdot 1 + 2 \\cdot (-i) + 3i \\cdot 1 + 3i \\cdot (-i) = 2 - 2i + 3i - 3i^2 = 2 + i + 3 = 5 + i$."
}
```

```check
{
  "question": "Find the magnitude and the phase of $z = 3 + 4i$.",
  "hint": "Magnitude: Pythagoras. Phase: atan2(4, 3).",
  "answer": "$\\lvert z \\rvert = \\sqrt{9 + 16} = 5$. Phase = atan2(4, 3) ≈ 53.13° (about 53°). The arrow is in the first quarter."
}
```

```check
{
  "question": "Why does multiplication by i turn every arrow by a quarter turn counter-clockwise?",
  "hint": "Compute $i(a + bi)$ and compare the points.",
  "answer": "$i(a + bi) = ai + bi^2 = -b + ai$. So the point $(a, b)$ goes to $(-b, a)$. The dot product $[a, b] \\cdot [-b, a] = -ab + ab = 0$, so the new arrow is perpendicular to the old one. The length $\\sqrt{b^2 + a^2}$ is the same. For (1, 0) the result is (0, 1), so the turn is counter-clockwise."
}
```

```check
{
  "question": "A colleague computes the phase of $-3 + 4i$ as $\\arctan(4/(-3)) = -53.13°$. What is wrong, and what is the correct phase?",
  "hint": "Find the quarter of the point (−3, 4) first.",
  "answer": "The point (−3, 4) is in the second quarter: left and up. The division 4/(−3) loses this. The correct phase is atan2(4, −3) ≈ 126.87°, which is 180° − 53.13°."
}
```

```check
{
  "question": "The FFT of the course computes $W_8^3 \\cdot O[3] = (-0.71 - 0.71i)(1.41 - 1.41i)$. Compute it with scale and rotate, then check with exact values.",
  "hint": "Find the magnitude and the phase of each factor.",
  "answer": "The first factor has magnitude 1 and phase −135°. The second has magnitude 2 and phase −45°. Product: magnitude 1 × 2 = 2, phase −135° − 45° = −180°. That is the number −2. Exact check: $-\\frac{1 + i}{\\sqrt{2}} \\cdot \\sqrt{2}(1 - i) = -(1 + i)(1 - i) = -(1 - i^2) = -2$."
}
```

```check
{
  "question": "Compute $(3 + 4i)\\,\\overline{(3 + 4i)}$. Why is the result an ordinary number?",
  "hint": "The conjugate is $3 - 4i$.",
  "answer": "$(3 + 4i)(3 - 4i) = 9 - 12i + 12i - 16i^2 = 9 + 16 = 25$. The two mixed products cancel, and $-16i^2 = +16$. In pictures, the phases +53.13° and −53.13° add to 0, so the result lies on the real axis. Its value is $\\lvert z \\rvert^2 = 5^2$."
}
```

## 15. Links

- Previous lesson: [F4: Vectors and the dot product](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product)
- Next lesson: [F6: Euler's formula](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)
- Used in: [L10: The complex probe](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe), [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula), [L12: Rotating vectors](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors), [L17: The butterfly](/notes/maths/fft-signal-processing/04-fft/l17-the-butterfly), [L24: The mirror](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)
- [01 Math foundations](/notes/maths/fft-signal-processing/01-math-foundations)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
