---
title: "F7: Roots of unity"
order: 7
summary: "The N equally spaced points on the unit circle. The twiddle factor W_N = e^{-i2π/N}, its powers, the rules that the FFT uses, and why all N roots add to 0."
status: not-started
tags: [math, roots-of-unity, twiddle-factor, complex-numbers, foundations]
---

## 1. The question this idea answers

The DFT multiplies each sample by the probe value $e^{-i 2\pi k n / N}$ ([L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)). For $N = 8$, there are 64 pairs of $k$ and $n$. But the probe takes only 8 different values. Which 8 values? Which rules connect them? The FFT is fast because of these rules.

The 8 values are the 8th roots of unity. The FFT story uses them in these lessons:

1. [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) and [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality): a probe that does not match gives 0, because the roots add to 0.
2. [L14](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft): the direct DFT needs $N^2$ multiplications, but it uses only $N$ different probe values.
3. [L15](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split): $W_8^2 = W_4$ changes the two halves of the sum into two 4-point DFTs.
4. [L16](/notes/maths/fft-signal-processing/04-fft/l16-two-facts) and [L17](/notes/maths/fft-signal-processing/04-fft/l17-the-butterfly): $W_N^{k + N/2} = -W_N^k$ gives two outputs from one multiplication.

The previous lesson, [F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula), showed that $e^{-i\theta}$ is a clockwise turn by θ. This lesson takes equal turns of $2\pi/N$.

## 2. Mental model

> [!analogy] A clock with N ticks
> Draw a clock with $N$ equally spaced ticks, and put tick 0 at the 3 o'clock position. $W_N$ is the instruction "move one tick clockwise". $W_N^k$ means "move $k$ ticks". After $N$ ticks, the hand is back at tick 0.
>
> **Where it stops working:** a real clock has 12 ticks and starts at the top. Here $N$ can be any whole number, and tick 0 is on the right. Also, the ticks go clockwise only because of the course convention. Many math books step counter-clockwise instead (section 5).

## 3. Terms

| Term | Plain meaning |
|---|---|
| unity | The number 1. |
| N-th root of unity | A complex number $z$ with $z^N = 1$. There are exactly $N$ of them. They sit at equal steps on the unit circle. |
| twiddle factor ($W_N^k$) | The root of unity $e^{-i 2\pi k / N}$: $k$ steps of $1/N$ of a turn, clockwise. |
| $W_N$ | The first twiddle factor $W_N^1 = e^{-i 2\pi/N}$: one step clockwise. |
| geometric series | A sum $1 + r + r^2 + \dots + r^{N-1}$, where each term is the previous term times the same ratio $r$. |
| ratio | The fixed factor $r$ between neighboring terms of a geometric series. |
| convention | A choice that the course makes and keeps, for example the minus sign in $W_N$. |

## 4. What a root of unity is

A number $z$ is an $N$-th root of unity when $z^N = 1$.

> [!example] Small cases
> - $N = 2$: $1^2 = 1$ and $(-1)^2 = 1$. The roots are 1 and −1.
> - $N = 4$: the roots are 1, $-i$, −1 and $i$. For example, $(-i)^4 = \big((-i)^2\big)^2 = (-1)^2 = 1$.

### Where all the roots are

Write $z = r\,e^{i\theta}$ ([F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)). Multiplication multiplies the magnitudes and adds the phases ([F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)). So $z^N = r^N e^{iN\theta}$. For $z^N = 1$:

1. **The magnitude:** $r^N = 1$, and $r$ is a positive length, so $r = 1$. Every root is on the unit circle.
2. **The phase:** $N\theta$ must point at 1, so $N\theta$ is a whole number of turns: $N\theta = 2\pi k$. So $\theta = 2\pi k / N$.
3. **How many:** $k = 0, 1, \dots, N-1$ give $N$ different points. $k = N$ gives $\theta = 2\pi$, the same point as $k = 0$.

So the $N$-th roots of unity are $N$ points at equal steps of $2\pi/N$ around the unit circle, starting at 1.

## 5. The twiddle factor W_N

The course names one step clockwise:

$$
W_N = e^{-i 2\pi / N} \qquad W_N^k = \left(e^{-i 2\pi / N}\right)^k = e^{-i 2\pi k / N}
$$

The step in the middle is the exponent rule of F6: $k$ equal steps add their angles. So $W_N^k$ is $k$ steps of $1/N$ of a turn, clockwise.

> [!key] The course uses the clockwise convention
> $W_N = e^{-i 2\pi/N}$ has a minus sign. So its powers step clockwise. The forward DFT of the course, and of NumPy, MATLAB and FFTW, uses this sign. With it, the DFT reads $X[k] = \sum_{n} x[n]\, W_N^{kn}$.

> [!trap] The other convention
> Many math books use $\omega_N = e^{+i 2\pi/N}$, which steps counter-clockwise. It gives the same $N$ points in the opposite order: $\omega_N^k = W_N^{-k} = W_N^{N-k} = \overline{W_N^k}$. A formula that mixes the two conventions swaps bins $k$ and $N - k$. Check the sign before you copy a formula.

### The table for N = 8

One step is $2\pi/8$ = 45° clockwise. The course rounds $\sqrt{2}/2 \approx 0.7071$ to 0.71, and $\sqrt{2} \approx 1.4142$ to 1.41.

| $k$ | Angle | $W_8^k$ (exact) | $W_8^k$ (rounded) |
|---|---|---|---|
| 0 | 0° | 1 | 1 |
| 1 | −45° | $\frac{\sqrt{2}}{2} - \frac{\sqrt{2}}{2}i$ | 0.71 − 0.71i |
| 2 | −90° | $-i$ | $-i$ |
| 3 | −135° | $-\frac{\sqrt{2}}{2} - \frac{\sqrt{2}}{2}i$ | −0.71 − 0.71i |
| 4 | −180° | −1 | −1 |
| 5 | −225° | $-\frac{\sqrt{2}}{2} + \frac{\sqrt{2}}{2}i$ | −0.71 + 0.71i |
| 6 | −270° | $i$ | $i$ |
| 7 | −315° | $\frac{\sqrt{2}}{2} + \frac{\sqrt{2}}{2}i$ | 0.71 + 0.71i |

Each value comes from $\cos\theta - i\sin\theta$ with θ = 45° × k (F6). For example, $W_8^3 = \cos 135° - i \sin 135° = -0.71 - 0.71i$. These are the 8 probe values of the course for $k = 1$ ([L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)).

![Alt text: the unit circle with the 8 twiddle factors W_8^0 to W_8^7, which step 45 degrees clockwise from 1, each with its rounded value](/notes/media/fft-signal-processing/figures/f7-twiddle-circle.svg)

## 6. The rules of the powers

### Rule 1: N steps make a full turn

$$
W_N^N = e^{-i 2\pi N / N} = e^{-i 2\pi} = 1
$$

For example, $W_8^8 = 1$: eight steps of 45° make 360°.

### Rule 2: the powers repeat with period N

Any exponent $a$ is $a = qN + r$, with a whole number $q$ and a remainder $r$ from 0 to $N - 1$. Then:

$$
W_N^{a} = W_N^{qN + r} = \left(W_N^N\right)^q \cdot W_N^{r} = 1^q \cdot W_N^r = W_N^r
$$

So only the remainder matters. [F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary) calls this remainder $a \bmod N$.

> [!example] Exponents that wrap
> - $W_8^9 = W_8^{8 + 1} = W_8^1 \approx 0.71 - 0.71i$. One more full turn changes nothing.
> - $W_8^{12} = W_8^{8 + 4} = W_8^4 = -1$.
> - $W_8^{-1} = W_8^{-8 + 7} = W_8^7$. One step counter-clockwise reaches the same point as seven steps clockwise.
> - In the DFT, $k = 3$ and $n = 5$ give $W_8^{15} = W_8^{8 + 7} = W_8^7$.

So the 64 exponents $kn$ of an 8-point DFT give only 8 different probe values. [L14](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft) uses this fact.

The power $k$ sets the size of the jump. With $k = 3$, the point jumps 135° per sample. The exponents $3n \bmod 8$ for $n = 0, \dots, 7$ are 0, 3, 6, 1, 4, 7, 2, 5. So the probe visits all 8 points, each once.

```plot
{
  "title": "Powers W_8^{3n}, n = 0 to 8 (gold): each jump is 135° clockwise, and the path visits all 8 points once",
  "xAxis": { "label": "real part", "domain": [-1.6, 1.6] },
  "yAxis": { "label": "imaginary part", "domain": [-1.3, 1.3] },
  "disableZoom": true,
  "data": [
    { "points": [[1, 0], [-0.7071, -0.7071], [0, 1], [0.7071, -0.7071], [-1, 0], [0.7071, 0.7071], [0, -1], [-0.7071, 0.7071], [1, 0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[1, 0], [-0.7071, -0.7071], [0, 1], [0.7071, -0.7071], [-1, 0], [0.7071, 0.7071], [0, -1], [-0.7071, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true }
  ]
}
```

### Rule 3: two small steps make one big step

$$
W_8^2 = e^{-i 2\pi \cdot 2/8} = e^{-i 2\pi/4} = W_4 = -i
$$

Two eighth-turns make one quarter-turn. In general, $W_N^2 = W_{N/2}$ for even $N$, and so $W_N^{2mk} = W_{N/2}^{mk}$. With $k = 2$, the 8-point probe visits only 4 points, each twice: 1, $-i$, −1, $i$, 1, $-i$, −1, $i$. [L15](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split) uses this rule to change the sum over the even samples into a 4-point DFT.

### Rule 4: half a turn changes the sign

$N/2$ steps make half a turn: $W_N^{N/2} = e^{-i\pi} = -1$. So:

$$
W_N^{k + N/2} = W_N^k \cdot W_N^{N/2} = -W_N^k
$$

Check in the table: $W_8^5 = -0.71 + 0.71i = -(0.71 - 0.71i) = -W_8^1$. The point for $k + 4$ is opposite the point for $k$. [L16](/notes/maths/fft-signal-processing/04-fft/l16-two-facts) uses this rule. The butterfly computes $W_N^k\,O[k]$ once, then adds it for $X[k]$ and subtracts it for $X[k + N/2]$ ([L17](/notes/maths/fft-signal-processing/04-fft/l17-the-butterfly)).

## 7. All N roots add to 0

> [!key] The sum of the roots
> For $N \ge 2$: $\displaystyle\sum_{k=0}^{N-1} W_N^k = 0$.

### Proof 1: with numbers, for N = 8

Add the table of section 5, real parts and imaginary parts apart:

| Part | k = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | Sum |
|---|---|---|---|---|---|---|---|---|---|
| real | 1 | 0.7071 | 0 | −0.7071 | −1 | −0.7071 | 0 | 0.7071 | 0 |
| imaginary | 0 | −0.7071 | −1 | −0.7071 | 0 | 0.7071 | 1 | 0.7071 | 0 |

Added tip to tail ([F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)), the 8 arrows make a closed octagon. The path returns to its start, so the sum is 0.

```plot
{
  "title": "The 8 roots W_8^0 to W_8^7 added tip to tail (gold): the path closes, so the sum is 0",
  "xAxis": { "label": "real part", "domain": [-1.5, 2.5] },
  "yAxis": { "label": "imaginary part", "domain": [-2.8, 0.5] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0], [1, 0], [1.7071, -0.7071], [1.7071, -1.7071], [1, -2.4142], [0, -2.4142], [-0.7071, -1.7071], [-0.7071, -0.7071], [0, 0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0, 0], [1, 0], [1.7071, -0.7071], [1.7071, -1.7071], [1, -2.4142], [0, -2.4142], [-0.7071, -1.7071], [-0.7071, -0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true }
  ]
}
```

### Proof 2: with symmetry

**Pairs, for an even N.** Rule 4 says that $W_N^{k + N/2} = -W_N^k$. So the roots form $N/2$ pairs of opposite points, and each pair adds to 0.

**A turn of the whole set, for any N ≥ 2.** Let $S$ be the sum of all $N$ roots. Multiply $S$ by $W_N$:

$$
W_N S = W_N^1 + W_N^2 + \dots + W_N^{N-1} + W_N^N = W_N^1 + \dots + W_N^{N-1} + 1 = S
$$

The last step uses Rule 1: $W_N^N = 1$. So the same set of points, turned by one step, gives the same sum. Then $W_N S - S = 0$, so $(W_N - 1)\,S = 0$. For $N \ge 2$, $W_N \ne 1$. So $S = 0$. In pictures: the only arrow that a turn of $2\pi/N$ leaves unchanged is the zero arrow.

> [!example] An odd N: N = 3
> The roots are 1, $-0.5 - 0.866i$ and $-0.5 + 0.866i$ (angles 0°, −120°, −240°). The real parts add to $1 - 0.5 - 0.5 = 0$. The imaginary parts add to 0. No root has an opposite partner here, but the turn argument still works.

### Proof 3: with the geometric series

Let $S = 1 + r + r^2 + \dots + r^{N-1}$. Multiply by $r$, then subtract:

1. $rS = r + r^2 + \dots + r^{N-1} + r^N$.
2. $rS - S = r^N - 1$. All the middle terms cancel.
3. So $(r - 1)S = r^N - 1$, and for $r \ne 1$: $S = \dfrac{r^N - 1}{r - 1}$.

Check with $r = 2$ and $N = 4$: $1 + 2 + 4 + 8 = 15$, and $(2^4 - 1)/(2 - 1) = 15$.

Now put $r = W_N$. Rule 1 gives $r^N = 1$, so the top is $1 - 1 = 0$. The bottom $W_N - 1$ is not 0 for $N \ge 2$. So $S = 0$.

### The general rule for the DFT

The DFT does not add the roots once. It adds the powers $W_N^{kn}$ for $n = 0, \dots, N-1$. This is a geometric series with the ratio $r = W_N^k$:

$$
\sum_{n=0}^{N-1} W_N^{kn} = \begin{cases} N & \text{if } k \text{ is a whole multiple of } N \\ 0 & \text{otherwise} \end{cases}
$$

1. If $k$ is a multiple of $N$, then $r = W_N^k = 1$ (Rule 2). Every term is 1, and the sum is $N$.
2. Otherwise $r \ne 1$, but $r^N = (W_N^N)^k = 1$. So the geometric series gives 0.

> [!example] k = 2 and k = 4 for N = 8
> $k = 2$: $r = W_8^2 = -i$. The terms are 1, $-i$, −1, $i$, 1, $-i$, −1, $i$. They add to 0.
>
> $k = 4$: $r = W_8^4 = -1$. The terms are 1, −1, 1, −1, 1, −1, 1, −1. They add to 0.

The real part of $W_N^{kn}$ is $\cos(2\pi k n/N)$ (F6). So the real part of this rule is the full-cycle rule of [F3](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation): $\sum_n \cos(2\pi k n/N) = 0$ unless $k$ is a multiple of $N$. F3 showed it with numbers. This section proves it for every $N$. The imaginary part proves that $\sum_n \sin(2\pi k n / N) = 0$ for every whole $k$.

> [!note] Preview: orthogonality
> The same rule shows that two different DFT patterns are orthogonal. The complex dot product of patterns $j$ and $k$ is $\sum_n W_N^{(k - j)n}$ (with the conjugate of [L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe)). It is $N$ for $j = k$ and 0 otherwise. [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality) and [L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft) use this result.

## 8. Video

The first clip names $W_N$: a clockwise turn by $1/N$ of a circle. The probe value is $W_N$ to the power $kn$.

```video
{
  "src": "/notes/media/fft-signal-processing/course/09_The_FFT_Butterfly_Algorithm.mp4",
  "start": "0:16",
  "end": "0:24",
  "caption": "W_N is a clockwise turn by 1/N of a circle, so the probe value is W_N to the power kn."
}
```

The second clip is a preview of Rule 4 in the FFT. Four more eighth-turns are half a circle, so the twiddle factor changes sign.

```video
{
  "src": "/notes/media/fft-signal-processing/course/09_The_FFT_Butterfly_Algorithm.mp4",
  "start": "1:06",
  "end": "1:14",
  "caption": "Four more eighth-turns are half a circle: the twiddle factor for k + 4 is minus the twiddle factor for k."
}
```

## 9. Code

Build the twiddle factors and test their rules.

1. Write `twiddles(N)`. It returns the list $W_N^k$ for $k = 0, \dots, N-1$. Build each value from `math.cos` and `math.sin` with the minus sign of the course.
2. Write `power_sum(N, k)`. It returns $\sum_{n=0}^{N-1} W_N^{kn}$ with a loop.

Acceptance tests:

- For N = 1 to 16, `np.allclose(twiddles(N), np.exp(-2j * np.pi * np.arange(N) / N))` is True.
- For N = 2 to 64, `abs(sum(twiddles(N))) < 1e-12`.
- Multiply `twiddles(8)[1]` by itself 8 times, starting from 1. The result is 1 within `1e-12`.
- For k = 0 to 3, `abs(twiddles(8)[k + 4] + twiddles(8)[k]) < 1e-12` (Rule 4).
- `abs(twiddles(8)[2] - twiddles(4)[1]) < 1e-12` (Rule 3).
- For N = 8 and k = −8 to 16, `power_sum(8, k)` is 8 when `k % 8 == 0`, and its magnitude is below `1e-12` otherwise.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)

```check
{
  "question": "Stuck on `twiddles`?",
  "hint": "Use Euler's formula with a minus sign: $e^{-i\\theta} = \\cos\\theta - i\\sin\\theta$, with $\\theta = 2\\pi k/N$.",
  "answer": "For each k from 0 to N − 1, compute θ = 2πk/N. The real part is cos θ and the imaginary part is −sin θ. Build the complex number with `complex(real, imag)` and append it to a list."
}
```

## 10. Common mistakes

1. **The two conventions mixed.** The course uses $W_N = e^{-i2\pi/N}$ (clockwise). A book with $e^{+i2\pi/N}$ gives the same points in the opposite order. Mixing them swaps bins $k$ and $N - k$.
2. **A twiddle factor that changes length.** Every $W_N^k$ has magnitude exactly 1. Multiplication by it only turns.
3. **The sum rule used for k = 0.** $\sum_n W_N^{0 \cdot n} = N$, not 0. The same holds for every multiple of $N$.
4. **$W^{k + N/2} = W^k$.** Half a turn changes the sign: $W_N^{k+N/2} = -W_N^k$. A full turn changes nothing: $W_N^{k+N} = W_N^k$.
5. **Large exponents computed in full.** Reduce the exponent first: $W_8^{15} = W_8^7$.
6. **$W_8^2 = W_{16}$.** Two eighth-turns are a quarter-turn: $W_8^2 = W_4$. The step gets larger, so $N$ gets smaller.

## 11. One-minute explanation

The $N$-th roots of unity are the $N$ complex numbers with $z^N = 1$, at equal steps of $2\pi/N$ around the unit circle. The course steps clockwise: $W_N = e^{-i2\pi/N}$, and $W_N^k$ is $k$ steps. $N$ steps make a full turn, so the exponents repeat with period $N$. Two eighth-turns make a quarter-turn, so $W_8^2 = W_4$, and half a turn changes the sign, so $W_N^{k+N/2} = -W_N^k$. All $N$ roots add to 0, because a turn of the whole set by one step leaves it unchanged. That is why a probe that does not match gives a score of 0.

## 12. Check questions

```check
{
  "question": "What is $W_8^4$? Why?",
  "hint": "Count the steps of 45°.",
  "answer": "$W_8^4 = e^{-i2\\pi \\cdot 4/8} = e^{-i\\pi} = -1$. Four steps of 45° clockwise make 180°, half a turn, which reaches −1."
}
```

```check
{
  "question": "Compute $W_8^{11}$, exact and rounded.",
  "hint": "Remove full turns first: 11 = 8 + 3.",
  "answer": "$W_8^{11} = W_8^{8} W_8^{3} = W_8^3 = \\cos 135° - i\\sin 135° = -\\frac{\\sqrt{2}}{2} - \\frac{\\sqrt{2}}{2}i \\approx -0.71 - 0.71i$."
}
```

```check
{
  "question": "What is $e^{-i 2\\pi \\cdot 1 \\cdot 2 / 8}$?",
  "hint": "This is $W_8^{1 \\cdot 2}$.",
  "answer": "$W_8^2 = e^{-i\\pi/2} = \\cos(\\pi/2) - i\\sin(\\pi/2) = -i$. Two steps of 45° clockwise reach the bottom of the circle."
}
```

```check
{
  "question": "Explain in your own words why the N roots of unity add to 0, for any N ≥ 2. Do not use the pairs of opposite points.",
  "hint": "Multiply the sum by $W_N$. What happens to the set of points?",
  "answer": "Multiplication by $W_N$ turns every root by one step. Each root moves to the place of the next one, and the last one moves to 1. So the set of points is the same, and the sum S is the same: $W_N S = S$. Then $(W_N - 1) S = 0$. $W_N$ is not 1 when N ≥ 2, so S = 0."
}
```

```check
{
  "question": "Take N = 4. List $W_4^k$ for k = 0 to 3. Check that they add to 0 and that $W_4^{k+2} = -W_4^k$.",
  "hint": "One step is 90° clockwise.",
  "answer": "$W_4^0 = 1$, $W_4^1 = -i$, $W_4^2 = -1$, $W_4^3 = i$. Sum: $1 - i - 1 + i = 0$. $W_4^2 = -1 = -W_4^0$ and $W_4^3 = i = -(-i) = -W_4^1$."
}
```

```check
{
  "question": "Compute $\\sum_{n=0}^{7} W_8^{4n}$ and $\\sum_{n=0}^{7} W_8^{8n}$. Explain the difference.",
  "hint": "Find the ratio $r = W_8^k$ of each geometric series.",
  "answer": "For k = 4: $r = W_8^4 = -1$, so the terms are 1, −1, 1, −1, 1, −1, 1, −1, and the sum is 0. For k = 8: $r = W_8^8 = 1$, so every term is 1, and the sum is 8. The sum is N only when k is a multiple of N."
}
```

## 13. Links

- Previous lesson: [F6: Euler's formula](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)
- Next lesson: [F8: Clock arithmetic, log₂ and binary](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary)
- Used in: [L8: Sweep and cancellation](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation), [L9: Basis and orthogonality](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality), [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula), [L14: The cost of the direct DFT](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft), [L15: The even–odd split](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split), [L16: Two facts that make the FFT fast](/notes/maths/fft-signal-processing/04-fft/l16-two-facts), [L17: The butterfly](/notes/maths/fft-signal-processing/04-fft/l17-the-butterfly)
- [01 Math foundations](/notes/maths/fft-signal-processing/01-math-foundations)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
