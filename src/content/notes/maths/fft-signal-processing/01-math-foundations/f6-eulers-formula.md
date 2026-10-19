---
title: "F6: Euler's formula"
order: 6
summary: "e^{iθ} = cos θ + i sin θ: the point at angle θ on the unit circle. Why it is true, why multiplication by it rotates, and why a cosine is two counter-rotating arrows."
status: not-started
tags: [math, euler, complex-numbers, rotation, foundations]
---

## 1. The question this idea answers

The DFT writes its probe as $e^{-i 2\pi k n / N}$ ([L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)). What does "e to an imaginary power" mean? Ordinary powers mean repeated multiplication, but nobody can multiply $e$ by itself $i$ times.

Euler's formula gives the meaning:

$$
e^{i\theta} = \cos\theta + i\sin\theta
$$

It is the point at angle θ on the unit circle of [F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle), written as one complex number of [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers). The FFT story uses it in these lessons:

1. [L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe): one complex probe holds a cosine probe and a sine probe.
2. [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula) and [L12](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors): the probe is a point that turns clockwise, one step per sample.
3. [F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity): the twiddle factors are powers of one turn $e^{-i2\pi/N}$.
4. [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror): a real cosine is two arrows that turn in opposite directions. This explains the mirror in the spectrum.

The previous lesson, [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers), showed that multiplication scales and rotates. This lesson gives a short name to a pure rotation.

## 2. Mental model

> [!analogy] The hand of a clock with length 1
> $e^{i\theta}$ is the tip of a hand of length 1, turned by the angle θ from the 3 o'clock position. Multiplication by $e^{i\theta}$ turns any arrow by θ and keeps its length. The exponent is only notation for "turn by this angle".
>
> **Where it stops working:** a clock hand turns clockwise. $e^{i\theta}$ turns counter-clockwise for a positive θ, and $e^{-i\theta}$ turns clockwise. Also, the letter $e$ suggests growth: $e^x$ grows fast for a real $x$. With an imaginary exponent, nothing grows. The length stays 1 for every θ.

## 3. Terms

| Term | Plain meaning |
|---|---|
| $e$ (Euler's number) | The number $e \approx 2.71828$. It is the base of the exponential function. |
| exponential function ($e^x$) | The function whose rate of change equals its own value. Its value at 0 is 1. |
| derivative | The rate of change of a quantity when its input grows a little. For a moving point, the derivative is its velocity. |
| factorial ($n!$) | The product $1 \cdot 2 \cdot 3 \cdots n$. By definition $0! = 1$. For example, $4! = 24$. |
| power series | An endless sum $c_0 + c_1 x + c_2 x^2 + c_3 x^3 + \dots$ with fixed numbers $c_n$. |
| Taylor series | The power series of a function, with $c_n = (\text{n-th derivative at } 0)/n!$. |
| Euler's formula | $e^{i\theta} = \cos\theta + i\sin\theta$. |
| complex exponential | A number of the form $r\,e^{i\theta}$: magnitude $r$, phase θ. |
| counter-rotating arrows | Two arrows that turn at the same speed in opposite directions. |

## 4. What the formula says

> [!key] Euler's formula
> $$e^{i\theta} = \cos\theta + i\sin\theta$$
> The real part is $\cos\theta$. The imaginary part is $\sin\theta$. So $e^{i\theta}$ is the point at angle θ on the unit circle, as a complex number.

Two facts follow at once:

1. The magnitude is 1: $\lvert e^{i\theta} \rvert = \sqrt{\cos^2\theta + \sin^2\theta} = 1$ (F2).
2. The phase is θ.

Any complex number with magnitude $r$ and phase θ is $r$ times this point. So the polar form of F5 has a short name:

$$
z = r\,(\cos\theta + i\sin\theta) = r\,e^{i\theta}
$$

For example, $1.41 + 1.41i \approx 2\,e^{i\pi/4}$. The course rounds $\sqrt{2} \approx 1.4142$ to 1.41 and $\sqrt{2}/2 \approx 0.7071$ to 0.71. This page does the same.

### Special values

| θ | $\cos\theta$ | $\sin\theta$ | $e^{i\theta}$ | Position |
|---|---|---|---|---|
| 0 | 1 | 0 | 1 | right |
| π/4 | 0.71 | 0.71 | 0.71 + 0.71i | up and right |
| π/2 | 0 | 1 | $i$ | top |
| π | −1 | 0 | −1 | left |
| 3π/2 | 0 | −1 | $-i$ | bottom |
| 2π | 1 | 0 | 1 | right again |

The row for π gives $e^{i\pi} = -1$. A half turn from 1 reaches −1. Many books write it as $e^{i\pi} + 1 = 0$.

## 5. Why it is true: the series argument

This argument builds $e^x$, $\cos\theta$ and $\sin\theta$ from powers of their input. Then it puts $x = i\theta$ into the series of $e^x$.

### Step 1: the rule for the coefficients

Suppose a function is a power series: $f(x) = c_0 + c_1 x + c_2 x^2 + c_3 x^3 + \dots$ Take the derivative $n$ times, then put $x = 0$:

1. A power below $x^n$ becomes 0 after $n$ derivatives.
2. The term $c_n x^n$ becomes the number $c_n \cdot n!$. Each derivative brings down one factor: $n$, then $n - 1$, and so on to 1.
3. A power above $x^n$ still contains $x$, so it is 0 at $x = 0$.

So the $n$-th derivative at 0 is $c_n \cdot n!$, and $c_n = (\text{n-th derivative at } 0)/n!$. If you know all the derivatives at 0, you know the whole series.

### Step 2: the series of e^x

The exponential function has this property: its derivative is itself, and its value at 0 is $e^0 = 1$. So every derivative at 0 is 1, and $c_n = 1/n!$:

$$
e^x = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \frac{x^4}{4!} + \dots
$$

Check the property term by term. The derivative of $x^n/n!$ is $n x^{n-1}/n! = x^{n-1}/(n-1)!$. So each term becomes the term before it, and the series reproduces itself.

> [!example] The series gives e
> Put $x = 1$. The partial sums are 1, 2, 2.5, 2.66667, 2.70833, 2.71667, 2.71806, 2.71825, 2.71828. They approach $e \approx 2.718281828$.

### Step 3: the series of cos and sin

The point $(\cos\theta, \sin\theta)$ travels along the unit circle with speed 1, because on the unit circle the angle equals the distance traveled (F2). Its velocity is tangent to the circle. So the velocity is the position turned by a quarter turn: $(-\sin\theta, \cos\theta)$ (F2, section 6). This gives the derivatives:

$$
\frac{d}{d\theta}\cos\theta = -\sin\theta \qquad \frac{d}{d\theta}\sin\theta = \cos\theta
$$

These rules need radians. With degrees, an extra factor π/180 appears. Now take the derivatives of cos again and again, and put θ = 0:

| Derivative | 0th | 1st | 2nd | 3rd | 4th | 5th |
|---|---|---|---|---|---|---|
| of cos | cos | −sin | −cos | sin | cos | −sin |
| value at 0 | 1 | 0 | −1 | 0 | 1 | 0 |
| of sin | sin | cos | −sin | −cos | sin | cos |
| value at 0 | 0 | 1 | 0 | −1 | 0 | 1 |

The rule of Step 1 gives the two series:

$$
\cos\theta = 1 - \frac{\theta^2}{2!} + \frac{\theta^4}{4!} - \frac{\theta^6}{6!} + \dots \qquad \sin\theta = \theta - \frac{\theta^3}{3!} + \frac{\theta^5}{5!} - \dots
$$

> [!example] Check the cosine series at θ = π/4 ≈ 0.7854
> The terms are 1, −0.308425, +0.015854, −0.000326, +0.000004. Their sum is 0.7071068, and $\cos(\pi/4) = 0.7071068$ (7 decimals).

These three series equal their functions for every input, real or complex. The numeric checks show it for two inputs. A course in calculus gives the general proof.

### Step 4: put x = iθ into the series of e^x

The powers of $i$ repeat with the cycle 1, $i$, −1, $-i$ (F5). So the powers of $i\theta$ are:

| $n$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| $(i\theta)^n$ | 1 | $i\theta$ | $-\theta^2$ | $-i\theta^3$ | $\theta^4$ | $i\theta^5$ | $-\theta^6$ |
| real or imaginary | real | imaginary | real | imaginary | real | imaginary | real |

Put them into the series of $e^x$, and collect the real terms and the imaginary terms:

$$
e^{i\theta} = \underbrace{\left(1 - \frac{\theta^2}{2!} + \frac{\theta^4}{4!} - \dots\right)}_{\text{the series of } \cos\theta} + i\,\underbrace{\left(\theta - \frac{\theta^3}{3!} + \frac{\theta^5}{5!} - \dots\right)}_{\text{the series of } \sin\theta}
$$

The real part is exactly the cosine series. The imaginary part is exactly the sine series. So $e^{i\theta} = \cos\theta + i\sin\theta$.

> [!example] The partial sums for θ = π/4
> | Terms used | Partial sum (4 decimals) |
> |---|---|
> | 1 | 1 |
> | 2 | 1 + 0.7854i |
> | 3 | 0.6916 + 0.7854i |
> | 4 | 0.6916 + 0.7047i |
> | 5 | 0.7074 + 0.7047i |
> | 6 | 0.7074 + 0.7071i |
> | 7 | 0.7071 + 0.7071i |
>
> The sums approach $\cos(\pi/4) + i\sin(\pi/4) \approx 0.7071 + 0.7071i$. Each new term is a quarter turn from the last one, so the path makes right-angle turns.

```plot
{
  "title": "Partial sums of the series for e^{iπ/4} (gold) close in on the point at 45° on the unit circle (ink arc, blue dot)",
  "xAxis": { "label": "real part", "domain": [0.4, 1.15] },
  "yAxis": { "label": "imaginary part", "domain": [-0.05, 0.9] },
  "disableZoom": true,
  "data": [
    { "points": [[1.0, 0.0], [0.9962, 0.0872], [0.9848, 0.1736], [0.9659, 0.2588], [0.9397, 0.342], [0.9063, 0.4226], [0.866, 0.5], [0.8192, 0.5736], [0.766, 0.6428], [0.7071, 0.7071], [0.6428, 0.766], [0.5736, 0.8192], [0.5, 0.866]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[1, 0], [1, 0.7854], [0.6916, 0.7854], [0.6916, 0.7047], [0.7074, 0.7047], [0.7074, 0.7071], [0.7071, 0.7071]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[1, 0], [1, 0.7854], [0.6916, 0.7854], [0.6916, 0.7047], [0.7074, 0.7047], [0.7074, 0.7071], [0.7071, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true },
    { "points": [[0.7071, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true }
  ]
}
```

## 6. Why it is true: the velocity is a quarter turn of the position

This second argument uses only one property of the exponential function. Let $z(\theta) = e^{i\theta}$, and think of θ as time.

1. **The derivative.** Write $e^{a\theta}$ as the series of Step 2, with $x = a\theta$. The derivative of the term $a^n\theta^n/n!$ is $a \cdot a^{n-1}\theta^{n-1}/(n-1)!$. So the derivative of $e^{a\theta}$ is $a\,e^{a\theta}$, also for a complex number $a$. With $a = i$: $z'(\theta) = i\,z(\theta)$.
2. **The velocity is a quarter turn of the position.** Multiplication by $i$ is a quarter turn counter-clockwise (F5). So the velocity is always perpendicular to the arrow from the origin to the point.
3. **The distance to the origin never changes.** A motion perpendicular to the radius does not move the point nearer or farther. In algebra: $\lvert z \rvert^2 = z\overline{z}$, and its derivative is $z'\overline{z} + z\overline{z'} = iz\overline{z} + z(-i\overline{z}) = 0$.
4. **The start.** $z(0) = e^0 = 1$. So the distance is 1 at the start, and it stays 1. The point travels along the unit circle.
5. **The speed.** $\lvert z' \rvert = \lvert i \rvert\,\lvert z \rvert = 1 \cdot 1 = 1$. After the time θ, the point has traveled the distance θ along the circle, counter-clockwise, because its first velocity is $i$ (straight up).
6. **The result.** On the unit circle, a distance θ from the point 1 is the angle θ in radians (F2). So $z(\theta) = \cos\theta + i\sin\theta$.

> [!note] A check with the circle point
> The point $f(\theta) = \cos\theta + i\sin\theta$ has the derivative $-\sin\theta + i\cos\theta$ (section 5, Step 3). Also $i\,f(\theta) = i\cos\theta + i^2\sin\theta = -\sin\theta + i\cos\theta$. So $f' = i f$ and $f(0) = 1$: the same rule and the same start as $e^{i\theta}$.

## 7. Rotations with exponents

### The exponent rule

Multiply two points of the unit circle. F5 says: the magnitudes multiply ($1 \times 1 = 1$) and the phases add. So:

$$
e^{i\alpha} \cdot e^{i\beta} = e^{i(\alpha + \beta)}
$$

This is the usual rule for exponents, $e^a e^b = e^{a+b}$. The rule "phases add" of F5 and the rule "exponents add" are the same rule. Repeat it $n$ times:

$$
\left(e^{i\theta}\right)^n = e^{in\theta}
$$

> [!example] Two quick uses
> $(e^{i\pi/6})^3 = e^{i3\pi/6} = e^{i\pi/2} = i$. Three turns of 30° make one turn of 90°.
>
> $2e^{i\pi/4} \cdot e^{-i\pi/4} = 2e^{i0} = 2$. This is the butterfly product of F5, section 9, in exponent form.

### Multiplication by e^{iθ} rotates

For any $z = r\,e^{i\varphi}$: $e^{i\theta} \cdot z = r\,e^{i(\varphi + \theta)}$. The magnitude stays $r$, and the phase grows by θ. So multiplication by $e^{i\theta}$ turns any arrow by θ.

### The minus sign turns clockwise

$$
e^{-i\theta} = \cos(-\theta) + i\sin(-\theta) = \cos\theta - i\sin\theta = \overline{e^{i\theta}}
$$

The step in the middle uses the mirror rules of F2. So $e^{-i\theta}$ is the conjugate of $e^{i\theta}$. It turns clockwise by θ.

> [!key] The course uses the clockwise turn
> The forward DFT uses $e^{-i 2\pi k n / N}$: a clockwise turn by $2\pi k/N$ per sample. NumPy, MATLAB and FFTW use the same minus sign in the forward transform.

> [!example] Two clockwise points
> $e^{-i\pi/4} = \cos(\pi/4) - i\sin(\pi/4) \approx 0.71 - 0.71i$. This is the twiddle factor $W_8^1$ of [F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity).
>
> $e^{-i3\pi/4} = \cos(3\pi/4) - i\sin(3\pi/4) \approx -0.71 - 0.71i$.

### A point that turns in time

Let the angle grow with time: $\theta = 2\pi f t$. Then $e^{i 2\pi f t}$ is a point that makes $f$ turns per second, counter-clockwise (F2, section 7). Its real part is $\cos(2\pi f t)$ and its imaginary part is $\sin(2\pi f t)$. One turning point carries a cosine wave and a sine wave at the same time.

With samples, the DFT probe is $e^{-i 2\pi k n / N}$. At each sample, it turns clockwise by $2\pi k/N$. After $N$ samples, it has made $k$ full turns ([L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)).

## 8. A cosine is two counter-rotating arrows

Add and subtract Euler's formula for $+\theta$ and $-\theta$:

1. $e^{i\theta} + e^{-i\theta} = (\cos\theta + i\sin\theta) + (\cos\theta - i\sin\theta) = 2\cos\theta$.
2. $e^{i\theta} - e^{-i\theta} = (\cos\theta + i\sin\theta) - (\cos\theta - i\sin\theta) = 2i\sin\theta$.

Divide the first line by 2 and the second line by $2i$:

$$
\cos\theta = \frac{e^{i\theta} + e^{-i\theta}}{2} \qquad \sin\theta = \frac{e^{i\theta} - e^{-i\theta}}{2i}
$$

> [!example] Check at θ = π/3 (60°)
> $e^{i\pi/3} = 0.5 + 0.8660i$ and $e^{-i\pi/3} = 0.5 - 0.8660i$.
>
> 1. Sum: $1 + 0i$. Divided by 2: 0.5. This is $\cos 60°$.
> 2. Difference: $0 + 1.7321i$. Divided by $2i$: 0.8660. This is $\sin 60°$.

Now let the angle grow with time. A real cosine wave is the sum of two arrows of length 1/2:

$$
\cos(2\pi f t) = \tfrac{1}{2}\,e^{i 2\pi f t} + \tfrac{1}{2}\,e^{-i 2\pi f t}
$$

1. The first arrow turns counter-clockwise, $f$ turns per second.
2. The second arrow turns clockwise at the same speed.
3. At every instant, their imaginary parts are opposite and cancel. Their real parts are equal and add to $\cos(2\pi f t)$.

```plot
{
  "title": "Imaginary part of ½e^{iθ} (gold) and of ½e^{-iθ} (ink) cancel at every θ. The real parts add to cos θ (blue)",
  "xAxis": { "label": "angle θ (radians)", "domain": [0, 6.2832] },
  "yAxis": { "label": "value", "domain": [-1.2, 1.2] },
  "disableZoom": true,
  "data": [
    { "fn": "0.5*sin(x)", "color": "#B8860B" },
    { "fn": "-0.5*sin(x)", "color": "#100D12" },
    { "fn": "cos(x)", "color": "#1E6091" }
  ]
}
```

> [!key] Why a real signal shows two peaks
> A probe that turns in one direction meets only the arrow that turns with it. So the DFT of a real cosine finds one arrow at bin $k$ and the other arrow at bin $N - k$. The teaching signal gives $\lvert X[1] \rvert = \lvert X[7] \rvert = 4$ for this reason. [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror) explains this mirror. [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) uses the factor 1/2 in $A = 2\lvert X[k] \rvert / N$.

> [!note] The same rotation in transformers
> Rotary position embedding (RoPE) uses this rotation. The RoFormer paper (Su et al., 2021, arXiv 2104.09864) shows the 2-D case. RoPE multiplies the query at position $m$ by $e^{im\theta}$, and the key at position $n$ by $e^{in\theta}$. The paper shows that the attention score then contains the factor $e^{i(m-n)\theta}$. So the score depends on the two positions only through the relative position $m - n$. The reason is the exponent rule of section 7.

## 9. Video

Watch a point travel around the circle of radius 1. Its shadows trace a cosine and a sine. Then Euler's formula names the point: $e^{i\theta} = \cos\theta + i\sin\theta$.

```video
{
  "src": "/notes/media/fft-signal-processing/course/05_Why_Complex_Numbers.mp4",
  "start": "0:11",
  "end": "0:37",
  "caption": "A point on the unit circle, its two shadows, and Euler's formula as the name of the point."
}
```

Then watch the minus sign. The point turns the other way: clockwise. The forward DFT uses this direction.

```video
{
  "src": "/notes/media/fft-signal-processing/course/05_Why_Complex_Numbers.mp4",
  "start": "0:37",
  "end": "0:45",
  "caption": "With a minus sign, the point turns clockwise. The forward DFT uses this direction."
}
```

## 10. Code

Check Euler's formula with your own code. Use the `math` and `cmath` modules.

1. Write `euler(theta)`. It returns `complex(math.cos(theta), math.sin(theta))`. This one line is the formula, so you may copy it.
2. Write `exp_series(z, terms)`. It returns the partial sum $\sum_{n=0}^{\text{terms}-1} z^n/n!$ for a complex `z`. Do not call `math.factorial` or `**` inside the loop.
3. Print the partial sums of `exp_series(1j * math.pi / 4, terms)` for terms = 1 to 8. Compare them with the table of section 5.

Acceptance tests:

- For 100 random angles, `abs(euler(t) - cmath.exp(1j * t)) < 1e-12`.
- For 100 random angles, `abs(abs(euler(t)) - 1) < 1e-12`.
- `abs(exp_series(1, 20) - math.e) < 1e-12`.
- `abs(exp_series(1j * math.pi / 4, 20) - euler(math.pi / 4)) < 1e-12`.
- `abs(exp_series(1j * math.pi, 30) + 1) < 1e-12` (this is $e^{i\pi} = -1$).
- For 100 random angles, `abs((euler(t) + euler(-t)) / 2 - math.cos(t)) < 1e-12`.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)

```check
{
  "question": "Stuck on `exp_series` without factorials or powers?",
  "hint": "Compare two neighboring terms: $z^n/n!$ and $z^{n+1}/(n+1)!$. What do you multiply the first by to get the second?",
  "answer": "Each term is the previous term times z / (n + 1). Start with the term 1 and the total 0. In each step, add the term to the total, then update the term with this factor. This avoids huge factorials and repeated powers."
}
```

## 11. Common mistakes

1. **$e^{i\theta}$ grows with θ.** Its magnitude is always 1. Only the direction changes.
2. **The wrong direction for the minus sign.** $e^{-i\theta}$ turns clockwise. The forward DFT uses it.
3. **Degrees in the exponent.** $e^{i\theta}$ needs θ in radians. `cmath.exp(1j * 90)` is not $i$.
4. **$e^{i\theta}$ read as $e^i \cdot \theta$.** The whole product $i\theta$ is the exponent.
5. **The sine formula with 2 instead of $2i$.** $\sin\theta = (e^{i\theta} - e^{-i\theta})/(2i)$. Without the $i$, the result is imaginary.
6. **A real cosine as one arrow.** A real cosine is two arrows of half length that turn in opposite directions. So its DFT has two peaks.

## 12. One-minute explanation

Euler's formula says $e^{i\theta} = \cos\theta + i\sin\theta$: the point at angle θ on the unit circle. In the series of $e^x$ with $x = i\theta$, the real terms form the cosine series and the imaginary terms form the sine series. Also, the velocity of $e^{i\theta}$ is a quarter turn of its position, so the point moves along a circle of radius 1 at speed 1. Exponents add when you multiply, so multiplication by $e^{i\theta}$ turns an arrow by θ, and $e^{-i\theta}$ turns clockwise, as in the DFT probe. A real cosine is two half-length arrows that turn in opposite directions. That is why the spectrum of a real signal has a mirror.

## 13. Check questions

```check
{
  "question": "What is $e^{i\\pi/2}$? Where is it on the unit circle?",
  "hint": "Use $\\cos(\\pi/2)$ and $\\sin(\\pi/2)$.",
  "answer": "$e^{i\\pi/2} = \\cos(\\pi/2) + i\\sin(\\pi/2) = 0 + 1i = i$. It is the top point of the unit circle, a quarter turn counter-clockwise from 1."
}
```

```check
{
  "question": "Compute $e^{-i3\\pi/4}$, exact and rounded to two decimals.",
  "hint": "$e^{-i\\theta} = \\cos\\theta - i\\sin\\theta$.",
  "answer": "$\\cos(3\\pi/4) - i\\sin(3\\pi/4) = -\\frac{\\sqrt{2}}{2} - i\\frac{\\sqrt{2}}{2} \\approx -0.71 - 0.71i$. It is 135° clockwise from 1, in the third quarter."
}
```

```check
{
  "question": "Why is $\\lvert e^{i\\theta} \\rvert = 1$ for every θ, even though $e^x$ grows for a real x?",
  "hint": "Use the magnitude rule of F5 and the Pythagoras rule of F2.",
  "answer": "$\\lvert e^{i\\theta} \\rvert = \\sqrt{\\cos^2\\theta + \\sin^2\\theta} = \\sqrt{1} = 1$. In the velocity picture, the velocity $i\\,e^{i\\theta}$ is always perpendicular to the position, so the distance to the origin never changes. An imaginary exponent turns. Only a real exponent stretches."
}
```

```check
{
  "question": "Compute $(e^{i\\pi/6})^3$ and $(e^{-i\\pi/4})^2$. Use the exponent rule, then name each point.",
  "hint": "$(e^{i\\theta})^n = e^{in\\theta}$.",
  "answer": "$(e^{i\\pi/6})^3 = e^{i\\pi/2} = i$. $(e^{-i\\pi/4})^2 = e^{-i\\pi/2} = -i$. Two clockwise eighth-turns make one clockwise quarter-turn. F7 writes this as $W_8^2 = W_4 = -i$."
}
```

```check
{
  "question": "Write $\\cos(2\\pi \\cdot 3t)$ as two arrows. Give the length of each arrow, its direction of turn and its turns per second.",
  "hint": "$\\cos\\theta = (e^{i\\theta} + e^{-i\\theta})/2$.",
  "answer": "$\\cos(2\\pi \\cdot 3t) = \\frac{1}{2}e^{i2\\pi 3t} + \\frac{1}{2}e^{-i2\\pi 3t}$. Each arrow has length 1/2. The first turns counter-clockwise and the second clockwise, both 3 turns per second. Their imaginary parts cancel at every instant."
}
```

```check
{
  "question": "Use the series of $e^x$ with $x = i\\pi/4$. Compute the first three partial sums by hand (1, 2 and 3 terms).",
  "hint": "$\\pi/4 \\approx 0.7854$. The third term is $(i\\theta)^2/2 = -\\theta^2/2$.",
  "answer": "Term 1: 1. Term 2: $i \\cdot 0.7854$. Term 3: $-0.7854^2/2 \\approx -0.3084$. Partial sums: 1, then $1 + 0.7854i$, then $0.6916 + 0.7854i$. The sums move toward $0.7071 + 0.7071i$."
}
```

## 14. Links

- Previous lesson: [F5: Complex numbers](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)
- Next lesson: [F7: Roots of unity](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)
- Used in: [L10: The complex probe](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe), [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula), [L12: Rotating vectors](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors), [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude), [L24: The mirror](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror)
- Background: [F2: Radians and the unit circle](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle)
- [01 Math foundations](/notes/maths/fft-signal-processing/01-math-foundations)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
