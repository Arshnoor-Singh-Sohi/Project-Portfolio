---
title: "F4: Vectors and the dot product"
order: 4
summary: "A list of N numbers is an arrow in N dimensions. The dot product measures how much two arrows point the same way, and it gives coordinates."
status: not-started
tags: [math, vectors, dot-product, orthogonality, foundations]
---

## 1. The question this idea answers

The matching score of [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score) multiplies two lists point by point and adds the products. Why does this number measure how well two patterns match? Why does a probe that does not match give exactly 0? And why does the score, divided by the right number, give the amplitude of a part of the signal?

The answer: a list of numbers is a vector, and the matching score is the dot product of two vectors. The FFT story uses this idea in these lessons:

1. [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score) and [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation): the matching score and its cancellation.
2. [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality): the time basis and the frequency basis, two coordinate systems for one signal.
3. [L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft): the inverse DFT rebuilds the signal from its coordinates.

The previous lesson, [F3](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation), taught the Σ sign. The dot product is one Σ.

## 2. Mental model

> [!analogy] A shadow on a floor
> Hold a stick above a floor in the noon sun. The shadow of the stick shows how much of the stick lies along the floor. A stick parallel to the floor gives its full length. A vertical stick gives no shadow. The dot product of $a$ and $b$ is the length of $a$ times the shadow of $b$ on the direction of $a$.
>
> **Where it stops working:** you can see a shadow only in 2 or 3 dimensions. A list of 8 samples is an arrow in 8 dimensions, and you cannot draw it. The dot product still works with the same formula. Also, for lists of complex numbers ([L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe)), the dot product needs one more step: the conjugate of one list.

## 3. Terms

| Term | Plain meaning |
|---|---|
| vector | A list of $N$ numbers. You can draw it as an arrow from the origin when $N$ is 2 or 3. |
| coordinate | One number of a vector. More generally, the amount of one basis direction in a vector. |
| dimension | The number of coordinates of a vector. A list of 8 samples is a vector in 8 dimensions. |
| dot product ($a \cdot b$) | Multiply two vectors coordinate by coordinate, then add: $\sum_n a[n]\,b[n]$. Also called the inner product. |
| length ($\lvert a \rvert$) | The length of the arrow: $\sqrt{a \cdot a}$. Also called the norm. |
| angle between vectors (θ) | The angle between two arrows. It satisfies $a \cdot b = \lvert a \rvert \lvert b \rvert \cos\theta$. |
| orthogonal | Two vectors are orthogonal when their dot product is 0. In 2 or 3 dimensions, this means perpendicular. |
| unit vector | A vector with length 1. |
| projection | The shadow of one vector on the direction of another vector. |
| basis | A set of reference directions. Every vector is a sum of amounts of them. |
| orthonormal basis | A basis of unit vectors that are all orthogonal to each other. |
| orthogonal basis | A basis of vectors that are all orthogonal to each other, but not always of length 1. |
| time basis | The basis of spikes (unit impulses): $\delta_0 = [1, 0, 0, \dots]$, $\delta_1 = [0, 1, 0, \dots]$, and so on. |

## 4. A list of numbers is an arrow

The vector $v = [3, 2]$ is an arrow from the origin: 3 steps along the horizontal direction, then 2 steps along the vertical direction. The two numbers are its coordinates.

A vector with 3 coordinates is an arrow in space. A vector with 8 coordinates is an arrow in 8 dimensions. Nobody can draw 8 dimensions. But every rule of this lesson uses only the list of numbers, so every rule works in any number of dimensions.

> [!key] A signal is a vector
> The 8 samples of the teaching signal, x = [1, 1.21, 0, −1.21, −1, −0.21, 0, 0.21], are one vector in 8 dimensions. The list shows the values rounded to two decimals.

### Add and scale vectors

Two operations work coordinate by coordinate:

1. **Add:** $[3, 2] + [1, -1] = [3 + 1,\ 2 + (-1)] = [4, 1]$. As arrows: put the second arrow at the tip of the first. This is "tip to tail" ([L12](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors)).
2. **Scale:** $2 \cdot [3, 2] = [6, 4]$. The arrow keeps its direction and becomes twice as long. A negative factor also reverses the direction.

With these two operations, $[3, 2] = 3 \cdot [1, 0] + 2 \cdot [0, 1]$. The vector is 3 of the first direction plus 2 of the second direction.

## 5. The dot product

The dot product multiplies coordinate by coordinate and adds the products:

$$
a \cdot b = \sum_{n=0}^{N-1} a[n]\, b[n]
$$

This is exactly the matching score of L7. The Σ is the one of [F3](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation).

> [!example] Two dot products
> $[1, 2] \cdot [3, -1] = 1 \cdot 3 + 2 \cdot (-1) = 3 - 2 = 1$.
>
> $[3, 2] \cdot [1, 2] = 3 \cdot 1 + 2 \cdot 2 = 3 + 4 = 7$.

A dot product of two vectors with $N$ coordinates needs $N$ multiplications and $N - 1$ additions. The result is one number, not a vector.

### Three rules from the definition

Each rule follows from ordinary arithmetic and from the rules of F3:

1. **Order does not matter:** $a \cdot b = b \cdot a$, because $a[n]\,b[n] = b[n]\,a[n]$.
2. **Split a sum:** $a \cdot (b + c) = a \cdot b + a \cdot c$. This is F3, Rule 3.
3. **Move a factor:** $(s\,a) \cdot b = s\,(a \cdot b)$ for a number $s$. This is F3, Rule 2.

### Length

The length of $a$ comes from the theorem of Pythagoras. In 2 dimensions, $\lvert [3, 2] \rvert = \sqrt{3^2 + 2^2} = \sqrt{13} \approx 3.6056$. In any dimension, the sum of the squares is the dot product of the vector with itself:

$$
\lvert a \rvert = \sqrt{a \cdot a} = \sqrt{\sum_{n} a[n]^2}
$$

> [!example] The length of the teaching signal
> The squares of the 8 samples are 1, 1.4571, 0, 1.4571, 1, 0.0429, 0, 0.0429 (4 decimals). Their sum is exactly 5. So $\lvert x \rvert = \sqrt{5} \approx 2.2361$. Section 8 shows where the 5 comes from.

## 6. The meaning: lengths and an angle

> [!key] The geometric formula
> $$a \cdot b = \lvert a \rvert \, \lvert b \rvert \cos\theta$$
> θ is the angle between the two arrows. So the dot product is large when the arrows point the same way. It is 0 when they are perpendicular, and negative when they point in opposite directions.

### Why the formula is true

Any two arrows from the origin lie in one flat plane, even in 8 dimensions. So a proof in a plane is enough. The proof computes the length of the third side of the triangle (from the tip of $a$ to the tip of $b$) in two ways.

**Way 1: with the dot product rules.** The third side is the vector $b - a$. Use the three rules of section 5:

$$
\lvert b - a \rvert^2 = (b - a)\cdot(b - a) = b \cdot b - b \cdot a - a \cdot b + a \cdot a = \lvert a \rvert^2 + \lvert b \rvert^2 - 2\, a \cdot b
$$

**Way 2: with geometry.** Turn the picture so that $a$ lies along the horizontal axis. The tip of $a$ is at $(\lvert a \rvert, 0)$. The tip of $b$ is at angle θ on a circle of radius $\lvert b \rvert$, so it is at $(\lvert b \rvert \cos\theta,\ \lvert b \rvert \sin\theta)$ ([F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle)). The third side has a horizontal part $\lvert b \rvert\cos\theta - \lvert a \rvert$ and a vertical part $\lvert b \rvert\sin\theta$. Pythagoras gives:

$$
\lvert b - a \rvert^2 = \big(\lvert b \rvert\cos\theta - \lvert a \rvert\big)^2 + \big(\lvert b \rvert\sin\theta\big)^2
$$

Expand the first square and collect the terms with $\lvert b \rvert^2$:

$$
\lvert b - a \rvert^2 = \lvert a \rvert^2 + \lvert b \rvert^2(\cos^2\theta + \sin^2\theta) - 2\lvert a \rvert\lvert b \rvert\cos\theta = \lvert a \rvert^2 + \lvert b \rvert^2 - 2\lvert a \rvert\lvert b \rvert\cos\theta
$$

The last step uses $\cos^2\theta + \sin^2\theta = 1$ from F2. Way 1 and Way 2 give the same length. Compare the two results: $-2\,a \cdot b = -2\lvert a \rvert\lvert b \rvert\cos\theta$. Divide by −2, and the formula follows.

> [!example] Check with a = [3, 2] and b = [1, 2]
> 1. Way 1: $b - a = [-2, 0]$, so $\lvert b - a \rvert^2 = 4$. Also $\lvert a \rvert^2 + \lvert b \rvert^2 - 2\,a\cdot b = 13 + 5 - 2 \cdot 7 = 4$.
> 2. The formula: $\cos\theta = \frac{a \cdot b}{\lvert a \rvert\lvert b \rvert} = \frac{7}{\sqrt{13}\,\sqrt{5}} \approx \frac{7}{8.0623} \approx 0.8682$. So θ ≈ 29.74°.
> 3. Direct check: $a$ points at 33.69° and $b$ at 63.43° from the horizontal axis. The difference is 29.74°.

### What the sign tells

| Angle θ | cos θ | Dot product | Meaning for a probe |
|---|---|---|---|
| 0° | 1 | $\lvert a \rvert\lvert b \rvert$, the largest value | The patterns match. |
| between 0° and 90° | positive | positive | They partly match. |
| 90° | 0 | 0 | No match: orthogonal. |
| between 90° and 180° | negative | negative | They partly match with the opposite sign. |
| 180° | −1 | $-\lvert a \rvert\lvert b \rvert$ | The same pattern, upside down. |

> [!note] The same formula in AI systems
> Embedding search uses $\cos\theta = \frac{a \cdot b}{\lvert a \rvert\lvert b \rvert}$ and calls it cosine similarity. It removes the effect of the lengths and keeps only the angle. The matching score of the DFT does not divide by the lengths. So a louder signal gives a larger score ([L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)).

### Orthogonal vectors

Two vectors are orthogonal when $a \cdot b = 0$. For example, $[1, 2] \cdot [2, -1] = 2 - 2 = 0$. In a plane, these two arrows are perpendicular. In 8 dimensions you cannot see a right angle, so the dot product is the definition.

## 7. Coordinates are dot products

### The shadow on a unit vector

Let $u$ be a unit vector: $\lvert u \rvert = 1$. Then $u \cdot b = \lvert b \rvert \cos\theta$. This is the signed length of the shadow of $b$ on the direction of $u$. So a dot product with a unit vector measures "how much of $b$ points along $u$".

### Coordinates in an orthonormal basis

Let $u_1$ and $u_2$ be two orthogonal unit vectors, and let $v = c_1 u_1 + c_2 u_2$. Take the dot product of both sides with $u_1$:

$$
v \cdot u_1 = c_1\,(u_1 \cdot u_1) + c_2\,(u_2 \cdot u_1) = c_1 \cdot 1 + c_2 \cdot 0 = c_1
$$

1. $u_1 \cdot u_1 = 1$ because $u_1$ is a unit vector.
2. $u_2 \cdot u_1 = 0$ because the two vectors are orthogonal.

So each coordinate is one dot product: $c_1 = v \cdot u_1$ and $c_2 = v \cdot u_2$.

> [!example] The same arrow in a basis turned by 30°
> Turn the usual basis by 30°. With $\cos 30° \approx 0.8660$ and $\sin 30° = 0.5$:
>
> - $u_1 = (\cos 30°, \sin 30°) \approx (0.8660, 0.5)$
> - $u_2 = (-\sin 30°, \cos 30°) \approx (-0.5, 0.8660)$. This is $u_1$ turned by a quarter turn (F2).
> - Check: $u_1 \cdot u_2 = -0.4330 + 0.4330 = 0$. Both lengths are 1.
>
> The coordinates of $v = [3, 2]$:
>
> 1. $c_1 = v \cdot u_1 = 3(0.8660) + 2(0.5) = 2.5981 + 1 = 3.5981 \approx 3.60$.
> 2. $c_2 = v \cdot u_2 = 3(-0.5) + 2(0.8660) = -1.5 + 1.7321 = 0.2321 \approx 0.23$.
>
> Rebuild $v$: $3.5981\,u_1 + 0.2321\,u_2 = (3.1160 - 0.1160,\ 1.7990 + 0.2010) = (3.0, 2.0)$. The arrow did not change. Only its description changed.

```plot
{
  "title": "v = [3, 2] (blue). Usual basis e1, e2 (ink). Basis turned by 30°: u1, u2 (gold)",
  "xAxis": { "label": "first coordinate", "domain": [-1.5, 4] },
  "yAxis": { "label": "second coordinate", "domain": [-0.5, 3] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0], [3, 2]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[3, 2]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0], [1, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[0, 0], [0, 1]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[1, 0], [0, 1]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true },
    { "points": [[0, 0], [0.866, 0.5]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0, 0], [-0.5, 0.866]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0.866, 0.5], [-0.5, 0.866]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true }
  ]
}
```

### Coordinates in an orthogonal basis

The DFT patterns are orthogonal, but their length is not 1. Take $v = c_1 u_1 + c_2 u_2$ with $u_1 \cdot u_2 = 0$, but any lengths. The dot product with $u_1$ now gives $v \cdot u_1 = c_1\,(u_1 \cdot u_1)$. Divide:

$$
c_j = \frac{v \cdot u_j}{u_j \cdot u_j}
$$

> [!trap] The basis must be orthogonal
> Take the basis $u_1 = [1, 0]$ and $u_2 = [1, 1]$. They are not orthogonal: $u_1 \cdot u_2 = 1$. The vector $[3, 2] = 1 \cdot u_1 + 2 \cdot u_2$. But $[3, 2] \cdot u_1 = 3$, not 1. Without orthogonality, a dot product mixes the coordinates.

### The time basis

The time basis has one spike per sample: $\delta_0 = [1, 0, 0, \dots]$, $\delta_1 = [0, 1, 0, \dots]$, and so on. Another name for a spike is unit impulse. The spikes are orthogonal unit vectors. The dot product $x \cdot \delta_n$ picks the single sample $x[n]$. So in the time basis, the coordinates are the sample values themselves ([L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality)).

## 8. The 8-sample example: cosine patterns

Now use vectors with 8 coordinates. Define the patterns with $k$ cycles in 8 samples:

$$
c_k[n] = \cos\!\left(\frac{2\pi k n}{8}\right) \qquad s_k[n] = \sin\!\left(\frac{2\pi k n}{8}\right)
$$

### Different patterns are orthogonal

| $n$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| $c_1[n]$ | 1 | 0.71 | 0 | −0.71 | −1 | −0.71 | 0 | 0.71 |
| $c_2[n]$ | 1 | 0 | −1 | 0 | 1 | 0 | −1 | 0 |
| product | 1 | 0 | 0 | 0 | −1 | 0 | 0 | 0 |

The table rounds $\sqrt{2}/2 \approx 0.7071$ to 0.71, as the course does (and $\sqrt{2} \approx 1.4142$ to 1.41). The sum of the products is $1 - 1 = 0$. So $c_1 \cdot c_2 = 0$: the two patterns are orthogonal. Python confirms that every pair of different patterns among $c_0, c_1, c_2, c_3, s_1, s_2, s_3$ has dot product 0. [F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity) and [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality) prove it.

```plot
{
  "title": "Patterns c1 (gold) and c2 (ink). Their products (red) are +1 at n = 0 and -1 at n = 4, so the sum is 0",
  "xAxis": { "label": "sample number n", "domain": [-0.5, 7.5] },
  "yAxis": { "label": "value", "domain": [-1.5, 1.5] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 1], [1, 0.7071], [2, 0], [3, -0.7071], [4, -1], [5, -0.7071], [6, 0], [7, 0.7071]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0, 1], [1, 0.7071], [2, 0], [3, -0.7071], [4, -1], [5, -0.7071], [6, 0], [7, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true },
    { "points": [[0, 1], [1, 0], [2, -1], [3, 0], [4, 1], [5, 0], [6, -1], [7, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[0, 1], [1, 0], [2, -1], [3, 0], [4, 1], [5, 0], [6, -1], [7, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true },
    { "points": [[0, 1], [1, 0], [2, 0], [3, 0], [4, -1], [5, 0], [6, 0], [7, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true }
  ]
}
```

### The length of a pattern

| $n$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| $c_1[n]^2$ | 1 | 0.5 | 0 | 0.5 | 1 | 0.5 | 0 | 0.5 |

$c_1 \cdot c_1 = 1 + 0.5 + 0 + 0.5 + 1 + 0.5 + 0 + 0.5 = 4$. The value $0.71^2 \approx 0.5$ is exact with $\sqrt{2}/2$: $(\sqrt{2}/2)^2 = 2/4 = 0.5$. So $c_1 \cdot c_1 = 4 = N/2$.

| $k$ | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| $c_k \cdot c_k$ | 8 | 4 | 4 | 4 | 8 |
| $s_k \cdot s_k$ | 0 | 4 | 4 | 4 | 0 |

For $0 < k < N/2$, each pattern has $c_k \cdot c_k = s_k \cdot s_k = N/2$. For $k = 0$ and $k = N/2 = 4$, the cosine is all ±1, so $c_k \cdot c_k = N$. The sine is all zeros there.

### The coordinates of the teaching signal

The teaching signal is $x = c_1 + 0.5\,s_2$. The patterns are orthogonal, so the coordinate rule of section 7 applies:

| Pattern | $x \cdot u$ | $u \cdot u$ | Coordinate $= \frac{x \cdot u}{u \cdot u}$ |
|---|---|---|---|
| $c_1$ | 4 | 4 | 1 |
| $s_2$ | 2 | 4 | 0.5 |
| $c_2$ | 0 | 4 | 0 |
| $c_3$ | 0 | 4 | 0 |

The dot products 4 and 2 are the matching scores of the course. Divided by $N/2 = 4$, they return the amplitudes 1 and 0.5 of the recipe.

> [!key] Fourier analysis is a change of basis
> Dot products with orthogonal patterns give the coordinates of the signal in a frequency basis. The time basis needs 8 numbers to describe the teaching signal. The frequency basis needs 2. The signal is the same arrow ([L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality)). The division by $N/2$ returns in [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) as $A = 2\lvert X[k] \rvert / N$.

The length of section 5 also follows. The parts $c_1$ and $0.5\,s_2$ are orthogonal, so Pythagoras applies in 8 dimensions: $\lvert x \rvert^2 = 1^2 \cdot 4 + 0.5^2 \cdot 4 = 4 + 1 = 5$.

## 9. Video

Watch the 2-D arrow first. The arrow keeps its place when the basis turns. Only its coordinates change: 3 and 2 become 3.60 and 0.23.

```video
{
  "src": "/notes/media/fft-signal-processing/course/04_Basis_Functions.mp4",
  "start": "0:05",
  "end": "0:19",
  "caption": "An arrow with coordinates 3 and 2, then the same arrow in a turned basis. Each coordinate is a dot product."
}
```

Then watch the step to 8 dimensions. A list of 8 samples is a vector with 8 coordinates.

```video
{
  "src": "/notes/media/fft-signal-processing/course/04_Basis_Functions.mp4",
  "start": "0:19",
  "end": "0:25",
  "caption": "A list of 8 samples is a vector too, with 8 coordinates."
}
```

## 10. Code

Build the dot product without NumPy, then use it.

1. Write `dot(a, b)` with a loop. Raise `ValueError` when the lengths differ.
2. Write `norm(a)` with your `dot`.
3. Write `angle_deg(a, b)`. It returns the angle between two vectors in degrees. Use `math.acos` once.
4. Write `coordinate(v, u)`. It returns $\frac{v \cdot u}{u \cdot u}$.

Acceptance tests:

- For 5 random pairs of length 8, `np.isclose(dot(a, b), np.dot(a, b))` is True.
- `dot([1, 2], [3])` raises `ValueError`.
- `np.isclose(angle_deg([3, 2], [1, 2]), 29.74, atol=0.01)` is True, and `np.isclose(angle_deg([1, 2], [2, -1]), 90)` is True.
- With `u1 = [cos 30°, sin 30°]` and `u2 = [-sin 30°, cos 30°]`, the coordinates of `[3, 2]` are about 3.5981 and 0.2321.
- For N = 8, `abs(dot(c_j, c_k)) < 1e-12` for every pair j ≠ k in 0 to 3.
- For N = 8, `dot(c_k, c_k)` is 8, 4, 4, 4 for k = 0, 1, 2, 3.
- For the teaching signal, `coordinate(x, c1)` is 1 and `coordinate(x, s2)` is 0.5, within `1e-12`.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product)

```check
{
  "question": "Stuck on `angle_deg`?",
  "hint": "Start from $a \\cdot b = \\lvert a \\rvert \\lvert b \\rvert \\cos\\theta$ and solve for $\\cos\\theta$.",
  "answer": "Divide the dot product by the product of the two lengths. This gives cos θ. Take `math.acos` of it, which gives radians, and change radians into degrees with × 180/π. Rounding can push cos θ a tiny bit past 1. Clip it to the range −1 to 1 first."
}
```

## 11. Common mistakes

1. **The dot product as a vector.** The result is one number.
2. **Coordinates as dot products in any basis.** This works only for an orthogonal basis. For an orthogonal basis that is not orthonormal, divide by $u \cdot u$.
3. **Dot product 0 as "no signal".** A score of 0 means only "no part along this pattern". The signal can have large parts along other patterns.
4. **$N/2$ for every pattern.** $c_0 \cdot c_0$ and $c_{N/2} \cdot c_{N/2}$ are $N$, not $N/2$.
5. **The length without the square root.** $\lvert a \rvert = \sqrt{a \cdot a}$. The dot product $a \cdot a$ is the squared length.

## 12. One-minute explanation

A list of $N$ numbers is a vector: an arrow in $N$ dimensions. The dot product multiplies two vectors coordinate by coordinate and adds, so it is exactly the matching score. Geometry gives its meaning: $a \cdot b = \lvert a \rvert \lvert b \rvert \cos\theta$, so it is large when the arrows point the same way and 0 when they are orthogonal. If the basis vectors are orthogonal, each coordinate of a vector is a dot product with one basis vector, divided by that vector's squared length. The cosine and sine patterns with different numbers of cycles are orthogonal. So the matching scores of a signal, divided by $N/2$, give the amplitudes of its frequency parts.

## 13. Check questions

```check
{
  "question": "Two vectors have the dot product 0. What does this mean in a plane? What does it mean for a probe and a signal?",
  "hint": "Use $a \\cdot b = \\lvert a \\rvert \\lvert b \\rvert \\cos\\theta$.",
  "answer": "The vectors are orthogonal. In a plane they are perpendicular: cos θ = 0, so θ = 90°. For a probe and a signal, the signal has no part along this probe. It can still have parts along other probes."
}
```

```check
{
  "question": "Compute $[2, -1, 3] \\cdot [4, 0, -2]$.",
  "hint": "Multiply coordinate by coordinate, then add.",
  "answer": "2 · 4 + (−1) · 0 + 3 · (−2) = 8 + 0 − 6 = 2."
}
```

```check
{
  "question": "Find the angle between a = [1, 0] and b = [1, 1].",
  "hint": "First the dot product and the two lengths.",
  "answer": "$a \\cdot b = 1$. $\\lvert a \\rvert = 1$, $\\lvert b \\rvert = \\sqrt{2}$. $\\cos\\theta = 1/\\sqrt{2} \\approx 0.7071$, so θ = 45°."
}
```

```check
{
  "question": "Why does $v \\cdot u_1$ give the coordinate $c_1$ only when the basis is orthonormal? Use $u_1 = [1, 0]$, $u_2 = [1, 1]$ and $v = [3, 2]$ as an example.",
  "hint": "Write $v = c_1 u_1 + c_2 u_2$ and take the dot product with $u_1$.",
  "answer": "$v \\cdot u_1 = c_1 (u_1 \\cdot u_1) + c_2 (u_2 \\cdot u_1)$. The second term disappears only when $u_2 \\cdot u_1 = 0$, and the first equals $c_1$ only when $u_1 \\cdot u_1 = 1$. Here $v = 1 \\cdot u_1 + 2 \\cdot u_2$, so $c_1 = 1$. But $v \\cdot u_1 = 3 = 1 \\cdot 1 + 2 \\cdot 1$: the term of $u_2$ leaks in."
}
```

```check
{
  "question": "Take N = 4, the patterns $c = [1, 0, -1, 0]$ (cosine, k = 1) and $s = [0, 1, 0, -1]$ (sine, k = 1), and the signal x = [2, 1, −2, −1]. Are c and s orthogonal? Find the coordinates of x along c and s. Check your answer.",
  "hint": "Coordinate = $(x \\cdot u)/(u \\cdot u)$.",
  "answer": "$c \\cdot s = 0 + 0 + 0 + 0 = 0$: orthogonal. $c \\cdot c = 2$ and $s \\cdot s = 2$ (this is N/2). $x \\cdot c = 2 + 0 + 2 + 0 = 4$, so the coordinate is 4/2 = 2. $x \\cdot s = 0 + 1 + 0 + 1 = 2$, so the coordinate is 2/2 = 1. Check: $2c + 1s = [2, 1, -2, -1] = x$."
}
```

```check
{
  "question": "The teaching signal is $x = c_1 + 0.5\\,s_2$ with N = 8. Without the 8 samples, find $\\lvert x \\rvert^2$.",
  "hint": "$c_1$ and $s_2$ are orthogonal. Use $c_1 \\cdot c_1 = s_2 \\cdot s_2 = 4$.",
  "answer": "$x \\cdot x = c_1 \\cdot c_1 + 2(0.5)(c_1 \\cdot s_2) + 0.25\\,(s_2 \\cdot s_2) = 4 + 0 + 0.25 \\cdot 4 = 5$. The direct sum of the 8 squares also gives 5."
}
```

## 14. Links

- Previous lesson: [F3: Σ notation](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation)
- Next lesson: [F5: Complex numbers](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)
- Used in: [L7: The matching score](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score), [L8: Sweep and cancellation](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation), [L9: Basis and orthogonality](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality), [L13: The inverse DFT](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft), [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)
- [01 Math foundations](/notes/maths/fft-signal-processing/01-math-foundations)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
