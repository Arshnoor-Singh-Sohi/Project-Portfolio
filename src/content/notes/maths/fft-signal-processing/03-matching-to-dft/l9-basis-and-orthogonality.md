---
title: "L9: Basis and orthogonality"
order: 3
summary: "A list of N samples is a vector. Samples and frequency coefficients are two sets of coordinates for the same vector, and orthogonality makes each coordinate one simple matching score."
status: not-started
tags: [dft, basis, orthogonality, vectors, coordinates]
---

## 1. The question this idea answers

Lesson [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) swept the teaching signal with cosine and sine probes. Each probe found only its own part of the signal. The 1-cycle cosine part did not leak into the score of the 3-cycle probe.

Two questions remain:

1. **Why** does each score isolate one frequency? A score is one sum over all the samples, and every part of the signal is inside those samples.
2. Can we **rebuild** the signal from the scores, and how?

The answer comes from geometry. A list of N samples is a vector ([F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product)). The probes are a set of reference directions for that vector. The scores are coordinates. When the directions are orthogonal, each coordinate is one matching score, and it does not depend on the other coordinates.

## 2. Mental model

> [!analogy] One place, two street grids
> A city has an old town with north–south streets, and a new town with streets turned by 30°. The same café is "3 blocks east and 2 blocks north" on the old grid. On the new grid it is "3.60 blocks along and 0.23 blocks across". The café does not move. Only its description changes.
>
> **Where it stops working:** a street grid has 2 directions, and you can see that they are perpendicular. A list of 8 samples has 8 directions, and you cannot see them. You check that they are perpendicular with dot products (section 6).

## 3. Terms

| Term | Plain meaning |
|---|---|
| vector | A list of numbers, seen as one arrow. A list of N samples is a vector with N coordinates. |
| basis | A set of reference directions. Every vector is a sum of amounts of these directions, in exactly one way. |
| basis vector | One direction of a basis. |
| coordinate | The amount of one basis vector inside a vector. |
| unit impulse $\delta_m$ | The list that is 1 at sample m and 0 at every other sample. |
| time basis | The N unit impulses. The coordinates of a signal in this basis are its sample values. |
| frequency basis | A basis of whole-cycle waves: cosine and sine patterns, or the complex patterns $e_k$. |
| orthogonal | Two vectors are orthogonal when their dot product is 0. For two arrows in the plane, this means perpendicular. |
| orthogonal basis | A basis in which every pair of different basis vectors is orthogonal. |
| squared length | The dot product of a vector with itself. For the arrow (3, 2) it is 3² + 2² = 13. |
| DFT pattern $e_k$ | The complex list $e_k[n] = e^{i 2\pi k n/N}$. Its real part is a cosine and its imaginary part is a sine, each with k cycles. |

## 4. Coordinates in the plane

Start with an arrow in the plane: v = (3, 2).

The usual basis has two directions: $d_1 = (1, 0)$ along the first axis and $d_2 = (0, 1)$ along the second axis. Then:

$$
v = 3\,d_1 + 2\,d_2
$$

Each coordinate is a dot product with one basis direction:

1. $v \cdot d_1 = 3 \times 1 + 2 \times 0 = 3$.
2. $v \cdot d_2 = 3 \times 0 + 2 \times 1 = 2$.

> [!note] Names of the basis vectors
> The video calls the two axis directions $e_1$ and $e_2$. This part keeps the letter $e_k$ for the DFT patterns of section 8. So it writes $d_1, d_2$ for the axis directions and $\delta_m$ for the spikes, as [F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product) does.

### The same arrow in a turned basis

Turn both directions by 30°. The new directions are:

$$
u_1 = (\cos 30°,\ \sin 30°) = (0.8660,\ 0.5) \qquad u_2 = (-\sin 30°,\ \cos 30°) = (-0.5,\ 0.8660)
$$

Here $\cos 30° = \sqrt{3}/2 = 0.8660\dots$ Both directions have length 1. They are perpendicular: $u_1 \cdot u_2 = 0.8660 \times (-0.5) + 0.5 \times 0.8660 = -0.4330 + 0.4330 = 0$.

Compute the new coordinates with dot products:

1. $v \cdot u_1 = 3 \times 0.8660 + 2 \times 0.5 = 2.5981 + 1 = 3.5981$, about 3.60.
2. $v \cdot u_2 = 3 \times (-0.5) + 2 \times 0.8660 = -1.5 + 1.7321 = 0.2321$, about 0.23.

Check that the new coordinates rebuild the same arrow:

$$
3.5981\,u_1 + 0.2321\,u_2 = (3.1160 - 0.1160,\ 1.7990 + 0.2010) = (3,\ 2)
$$

> [!key] One vector, many descriptions
> The arrow does not change when the basis changes. Only its coordinates change. With perpendicular directions of length 1, each coordinate is one dot product.

## 5. A list of samples is a vector

The teaching signal has 8 samples. Rounded to two decimals:

x = [1, 1.21, 0, −1.21, −1, −0.21, 0, 0.21]

These 8 numbers are the 8 coordinates of one vector. We cannot draw 8 axes, but every rule of section 4 still works. The dot product of two lists is the matching score of [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score).

### The time basis

The **unit impulse** $\delta_m$ is 1 at sample m and 0 at every other sample. For example, $\delta_3 = [0, 0, 0, 1, 0, 0, 0, 0]$. The 8 impulses $\delta_0, \dots, \delta_7$ form the **time basis**. Every signal is a sum of impulses, with the samples as amounts:

$$
x = 1\,\delta_0 + 1.21\,\delta_1 + 0\,\delta_2 - 1.21\,\delta_3 - 1\,\delta_4 - 0.21\,\delta_5 + 0\,\delta_6 + 0.21\,\delta_7
$$

Each coordinate is again a dot product. For example, $x \cdot \delta_3 = x[3] = -1.21$, because only the product at n = 3 is not 0. In the time basis, the coordinates are the sample values. The teaching signal has 8 coordinates here, and 6 of them are not 0 (x[2] = x[6] = 0).

### A frequency basis

Now use whole-cycle waves as the reference directions. For N = 8, these are the real patterns:

$$
c_k[n] = \cos\left(\frac{2\pi k n}{8}\right) \text{ for } k = 0, \dots, 4 \qquad s_k[n] = \sin\left(\frac{2\pi k n}{8}\right) \text{ for } k = 1, 2, 3
$$

| pattern | n = 0 | n = 1 | n = 2 | n = 3 | n = 4 | n = 5 | n = 6 | n = 7 |
|---|---|---|---|---|---|---|---|---|
| $c_0$ | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| $c_1$ | 1.00 | 0.71 | 0.00 | −0.71 | −1.00 | −0.71 | 0.00 | 0.71 |
| $c_2$ | 1.00 | 0.00 | −1.00 | 0.00 | 1.00 | 0.00 | −1.00 | 0.00 |
| $c_3$ | 1.00 | −0.71 | 0.00 | 0.71 | −1.00 | 0.71 | 0.00 | −0.71 |
| $c_4$ | 1.00 | −1.00 | 1.00 | −1.00 | 1.00 | −1.00 | 1.00 | −1.00 |
| $s_1$ | 0.00 | 0.71 | 1.00 | 0.71 | 0.00 | −0.71 | −1.00 | −0.71 |
| $s_2$ | 0.00 | 1.00 | 0.00 | −1.00 | 0.00 | 1.00 | 0.00 | −1.00 |
| $s_3$ | 0.00 | 0.71 | −1.00 | 0.71 | 0.00 | −0.71 | 1.00 | −0.71 |

That is 5 + 3 = 8 patterns, as many as the samples. We do not need more:

1. $c_5$, $c_6$ and $c_7$ are copies of $c_3$, $c_2$ and $c_1$ (L8, section 4).
2. $s_5$, $s_6$ and $s_7$ are $-s_3$, $-s_2$ and $-s_1$.
3. $s_0$ and $s_4$ are all zeros, so they are not directions.

In this basis the teaching signal needs only two non-zero coordinates:

$$
x = 1\,c_1 + 0.5\,s_2
$$

> [!key] Two coordinate systems for one signal
> In the time basis, the coordinates of x are its 8 samples. In the frequency basis, x has two non-zero coordinates: 1 for $c_1$ and 0.5 for $s_2$. The vector is the same. The Fourier transform changes the coordinates from one basis to the other.

This is the precise meaning of the two domains of [L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains).

## 6. Orthogonality of the frequency patterns

Two vectors are **orthogonal** when their dot product is 0. The table shows the dot product of every pair of the 8 real patterns, computed with NumPy:

| · | $c_0$ | $c_1$ | $c_2$ | $c_3$ | $c_4$ | $s_1$ | $s_2$ | $s_3$ |
|---|---|---|---|---|---|---|---|---|
| $c_0$ | **8** | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| $c_1$ | 0 | **4** | 0 | 0 | 0 | 0 | 0 | 0 |
| $c_2$ | 0 | 0 | **4** | 0 | 0 | 0 | 0 | 0 |
| $c_3$ | 0 | 0 | 0 | **4** | 0 | 0 | 0 | 0 |
| $c_4$ | 0 | 0 | 0 | 0 | **8** | 0 | 0 | 0 |
| $s_1$ | 0 | 0 | 0 | 0 | 0 | **4** | 0 | 0 |
| $s_2$ | 0 | 0 | 0 | 0 | 0 | 0 | **4** | 0 |
| $s_3$ | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **4** |

1. **Off the diagonal, every entry is 0.** Every pair of different patterns is orthogonal. This is the product-to-sum rule of L8. A product of two different whole-cycle patterns is a sum of whole-cycle waves. Each of these waves sums to 0.
2. **On the diagonal are the squared lengths.** They are not all the same.

The squared lengths come from the same rule. For $0 < k < N/2$:

$$
c_k \cdot c_k = \sum_{n=0}^{N-1} \cos^2\left(\frac{2\pi k n}{N}\right) = \sum_{n=0}^{N-1} \left(\tfrac{1}{2} + \tfrac{1}{2}\cos\left(\frac{2\pi \cdot 2k \cdot n}{N}\right)\right) = \frac{N}{2} + 0 = \frac{N}{2}
$$

For k = 0 and k = N/2, the doubled frequency 2k is a multiple of N. Then the second half does not cancel. The samples of $c_0$ are all 1. The samples of $c_4$ are 1, −1, 1, −1, and so on. In both cases each square is 1, so the squared length is N = 8.

> [!example] One off-diagonal entry by hand
> $c_1 = [1, 0.71, 0, -0.71, -1, -0.71, 0, 0.71]$ and $c_3 = [1, -0.71, 0, 0.71, -1, 0.71, 0, -0.71]$.
>
> 1. Products: 1, −0.5, 0, −0.5, 1, −0.5, 0, −0.5. (Exactly, $0.7071^2 = 0.5$.)
> 2. Sum: 1 − 0.5 − 0.5 + 1 − 0.5 − 0.5 = 0.
>
> So $c_1$ and $c_3$ are orthogonal.

## 7. How to find a coordinate

Suppose a vector x is a sum of basis vectors $b_0, b_1, \dots, b_{N-1}$ with unknown amounts $a_0, a_1, \dots, a_{N-1}$:

$$
x = a_0\,b_0 + a_1\,b_1 + \dots + a_{N-1}\,b_{N-1}
$$

To find one amount $a_k$:

1. Take the dot product of both sides with $b_k$. The dot product is linear (L7), so it acts on each term:
$$
x \cdot b_k = a_0\,(b_0 \cdot b_k) + \dots + a_k\,(b_k \cdot b_k) + \dots + a_{N-1}\,(b_{N-1} \cdot b_k)
$$
2. In an orthogonal basis, every $b_j \cdot b_k$ with $j \neq k$ is 0. Only one term remains: $x \cdot b_k = a_k\,(b_k \cdot b_k)$.
3. Divide by the squared length:
$$
a_k = \frac{x \cdot b_k}{b_k \cdot b_k}
$$

For the teaching signal, the dot products $x \cdot b_k$ are the cosine and sine scores of L8:

| pattern | x · pattern | pattern · pattern | coordinate = (x · pattern) / (pattern · pattern) |
|---|---|---|---|
| $c_0$ | 0 | 8 | 0 |
| $c_1$ | 4 | 4 | 1 |
| $c_2$ | 0 | 4 | 0 |
| $c_3$ | 0 | 4 | 0 |
| $c_4$ | 0 | 8 | 0 |
| $s_1$ | 0 | 4 | 0 |
| $s_2$ | 2 | 4 | 0.50 |
| $s_3$ | 0 | 4 | 0 |

The coordinates are 1 for $c_1$ and 0.5 for $s_2$. These are exactly the amplitudes that we put into the signal.

> [!key] Coordinate = score divided by squared length
> In an orthogonal basis, each coordinate is one matching score divided by one squared length. It needs no other coordinate. This is why one score isolates one frequency.

| pattern | squared length | divide the score by |
|---|---|---|
| $c_0$ and $c_{N/2}$ | N | N |
| $c_k$ and $s_k$, with $0 < k < N/2$ | N/2 | N/2 |
| complex pattern $e_k$ (section 8) | N | N |

### What goes wrong without orthogonality

Take a basis that is not orthogonal: $b_1 = (1, 0)$ and $b_2 = (1, 1)$. Here $b_1 \cdot b_2 = 1$, not 0.

1. The true coordinates of v = (3, 2) are 1 and 2, because $1\,(1, 0) + 2\,(1, 1) = (3, 2)$.
2. The dot-product method gives $v \cdot b_1 / (b_1 \cdot b_1) = 3/1 = 3$. That is wrong.
3. It gives $v \cdot b_2 / (b_2 \cdot b_2) = 5/2 = 2.5$. That is also wrong.

The $b_2$ part of v leaks into the score of $b_1$, because $b_1$ and $b_2$ overlap. In an orthogonal basis, no part can leak into another score.

> [!trap] The dot-product method needs an orthogonal basis
> "Coordinate = dot product / squared length" is true only when the basis vectors are orthogonal. For any other basis, you must solve all the coordinates together.

## 8. The complex DFT basis

The DFT does not use the real patterns $c_k$ and $s_k$. It uses N complex patterns ([F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula)):

$$
e_k[n] = e^{i 2\pi k n/N} = \cos\left(\frac{2\pi k n}{N}\right) + i \sin\left(\frac{2\pi k n}{N}\right), \qquad k = 0, 1, \dots, N-1
$$

Each pattern holds a cosine and a sine with k cycles in one list. As n grows, the point $e_k[n]$ turns counterclockwise around the unit circle.

### The dot product of complex lists

For complex lists, the dot product takes the conjugate ([F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers)) of the second list:

$$
\langle a, b \rangle = \sum_{n=0}^{N-1} a[n]\, \overline{b[n]}
$$

The conjugate is necessary. A squared length must be a positive real number. With the conjugate, each term is $e_k[n]\,\overline{e_k[n]} = \lvert e_k[n] \rvert^2 = 1$, so $\langle e_1, e_1 \rangle = 8 = N$. Without the conjugate, NumPy gives $\sum e_1[n]^2 = 0$. A pattern with "squared length 0" makes no sense.

### The complex patterns are orthogonal

The table computes $\langle e_1, e_2 \rangle$ for N = 8:

| n | $e_1[n]$ | $e_2[n]$ | $\overline{e_2[n]}$ | $e_1[n] \cdot \overline{e_2[n]}$ |
|---|---|---|---|---|
| 0 | $1$ | $1$ | $1$ | $1$ |
| 1 | $0.71 + 0.71i$ | $i$ | $-i$ | $0.71 - 0.71i$ |
| 2 | $i$ | $-1$ | $-1$ | $-i$ |
| 3 | $-0.71 + 0.71i$ | $-i$ | $i$ | $-0.71 - 0.71i$ |
| 4 | $-1$ | $1$ | $1$ | $-1$ |
| 5 | $-0.71 - 0.71i$ | $i$ | $-i$ | $-0.71 + 0.71i$ |
| 6 | $-i$ | $-1$ | $-1$ | $i$ |
| 7 | $0.71 - 0.71i$ | $-i$ | $i$ | $0.71 + 0.71i$ |
| **sum** | | | | **0** |

The products are the 8 points $e^{-i 2\pi n/8}$, evenly spread around the unit circle. They sum to 0 ([F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)). NumPy checks all 64 pairs: $\langle e_j, e_k \rangle = 8$ when j = k, and 0 when j ≠ k.

### The coordinates are X[k]/N

Use the rule of section 7 with $b_k = e_k$:

$$
a_k = \frac{\langle x, e_k \rangle}{\langle e_k, e_k \rangle} = \frac{1}{N}\sum_{n=0}^{N-1} x[n]\, \overline{e^{i 2\pi k n/N}} = \frac{1}{N}\sum_{n=0}^{N-1} x[n]\, e^{-i 2\pi k n/N}
$$

The last sum is the DFT coefficient X[k] of lesson [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula). So the coordinates of x in the complex basis are X[k]/N. For the teaching signal, X = [0, 4, −2i, 0, 0, 0, 2i, 4]. So the coordinates are [0, 0.5, −0.25i, 0, 0, 0, 0.25i, 0.5].

Note the minus sign in the last sum. The patterns turn counterclockwise ($+i$). The conjugate in the dot product turns them clockwise ($-i$). This is one reason why the forward DFT has a minus sign ([L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe)).

> [!example] The four non-zero coordinates rebuild the signal
> 1. Bins 1 and 7: $e_7 = \overline{e_1}$, so $0.5\,e_1 + 0.5\,e_7 = 0.5\,(e_1 + \overline{e_1}) = \cos(2\pi n/8)$. A complex number plus its conjugate is twice its real part.
> 2. Bins 2 and 6: $e_6 = \overline{e_2}$. Write $e_2 = \cos\theta + i\sin\theta$. Then $-0.25i\,(\cos\theta + i\sin\theta) + 0.25i\,(\cos\theta - i\sin\theta) = 0.25\sin\theta + 0.25\sin\theta = 0.5\sin\theta$.
>
> The sum is $\cos(2\pi n/8) + 0.5\sin(2\pi \cdot 2n/8)$, the teaching signal. Lesson [L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft) writes this rebuild as the inverse DFT.

## 9. Graphs

The arrow v = (3, 2) and two bases. The dot products with $u_1$ and $u_2$ give the new coordinates 3.60 and 0.23:

```plot
{
  "title": "v = (3, 2) (blue). Axis directions d₁, d₂ (gold). Directions turned by 30°: u₁, u₂ (ink).",
  "xAxis": {"label": "first coordinate", "domain": [-1.5, 4]},
  "yAxis": {"label": "second coordinate", "domain": [-0.5, 3]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 0], [3, 2]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[3, 2]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true},
    {"points": [[0, 0], [1, 0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0, 0], [0, 1]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[1, 0], [0, 1]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[0, 0], [0.866, 0.5]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0, 0], [-0.5, 0.866]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.866, 0.5], [-0.5, 0.866]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

A basis vector of the time basis is one spike. A basis vector of the frequency basis has values at all the samples:

```plot
{
  "title": "The unit impulse δ₃ (ink): 1 at n = 3, 0 elsewhere. The cosine pattern c₂ (gold).",
  "xAxis": {"label": "sample number n", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "value", "domain": [-1.5, 1.5]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 0], [1, 0], [2, 0], [3, 1], [4, 0], [5, 0], [6, 0], [7, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0, 0], [1, 0], [2, 0], [3, 1], [4, 0], [5, 0], [6, 0], [7, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 0.0], [2.0, -1.0], [3.0, 0.0], [4.0, 1.0], [5.0, 0.0], [6.0, -1.0], [7.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 0.0], [2.0, -1.0], [3.0, 0.0], [4.0, 1.0], [5.0, 0.0], [6.0, -1.0], [7.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true}
  ]
}
```

The teaching signal is the sum of two frequency patterns with amounts 1 and 0.5:

```plot
{
  "title": "x[n] (blue) = 1·c₁ (gold) + 0.5·s₂ (ink)",
  "xAxis": {"label": "sample number n", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "value", "domain": [-1.6, 1.6]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 1.0], [1.0, 1.2071], [2.0, 0.0], [3.0, -1.2071], [4.0, -1.0], [5.0, -0.2071], [6.0, 0.0], [7.0, 0.2071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 1.2071], [2.0, 0.0], [3.0, -1.2071], [4.0, -1.0], [5.0, -0.2071], [6.0, 0.0], [7.0, 0.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 0.7071], [2.0, 0.0], [3.0, -0.7071], [4.0, -1.0], [5.0, -0.7071], [6.0, 0.0], [7.0, 0.7071]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 0.7071], [2.0, 0.0], [3.0, -0.7071], [4.0, -1.0], [5.0, -0.7071], [6.0, 0.0], [7.0, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.5], [2.0, 0.0], [3.0, -0.5], [4.0, 0.0], [5.0, 0.5], [6.0, 0.0], [7.0, -0.5]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.5], [2.0, 0.0], [3.0, -0.5], [4.0, 0.0], [5.0, 0.5], [6.0, 0.0], [7.0, -0.5]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

## 10. Video

Watch the arrow receive new coordinates in a turned basis. Each coordinate is a dot product.

```video
{
  "src": "/notes/media/fft-signal-processing/course/04_Basis_Functions.mp4",
  "start": "0:00",
  "end": "0:19",
  "caption": "An arrow with coordinates (3, 2), then the same arrow in a basis turned by 30°."
}
```

Watch the 8 samples become a vector. Compare the spikes of the time basis with the waves of the frequency basis.

```video
{
  "src": "/notes/media/fft-signal-processing/course/04_Basis_Functions.mp4",
  "start": "0:19",
  "end": "0:40",
  "caption": "Time basis: spikes. Frequency basis: the signal needs only 1 × cosine + 0.5 × sine."
}
```

Watch the complex DFT patterns. Each one has a cosine real part and a sine imaginary part.

```video
{
  "src": "/notes/media/fft-signal-processing/course/04_Basis_Functions.mp4",
  "start": "0:40",
  "end": "0:55",
  "caption": "Two coordinate systems for the same vector, and the N complex patterns of the DFT."
}
```

Watch the last part: the patterns are orthogonal, and X[k]/N are the coordinates.

```video
{
  "src": "/notes/media/fft-signal-processing/course/04_Basis_Functions.mp4",
  "start": "0:55",
  "end": "1:10",
  "caption": "Orthogonal patterns isolate one frequency. Rebuilding the signal is the inverse DFT."
}
```

## 11. Code

Write two functions.

1. `patterns(N)` returns an N × N complex NumPy array E with `E[k, n]` equal to $e^{i 2\pi k n/N}$.
2. `coordinates(x)` returns the N complex coordinates of x in the DFT basis. Use the rule of section 7, with the complex dot product.

A complex conjugate in NumPy is one call:

```python
np.conj(z)
```

Acceptance tests:

1. For N = 4, 8 and 16: `np.allclose(E @ np.conj(E).T, N * np.eye(N))` is True. This checks every pair of patterns at once.
2. For the teaching signal: `np.allclose(coordinates(x), [0, 0.5, -0.25j, 0, 0, 0, 0.25j, 0.5])` is True.
3. For 5 random real x of length 16: `np.allclose(coordinates(x), np.fft.fft(x) / 16)` is True.
4. Rebuild: `np.allclose(sum(coordinates(x)[k] * E[k] for k in range(N)), x)` is True.
5. Real patterns: build the 8 lists $c_0, \dots, c_4, s_1, s_2, s_3$ as the rows of a matrix R. Check that `R @ R.T` equals the diagonal matrix with 8, 4, 4, 4, 8, 4, 4, 4.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality)

```check
{
  "question": "Stuck on `coordinates(x)`? Use the hint first.",
  "hint": "Coordinate k is a dot product divided by a squared length. For a complex pattern, the dot product conjugates the pattern.",
  "answer": "Idea: for each k, multiply x[n] by the conjugate of e_k[n], add over n, and divide by N (the squared length of every complex pattern). With the matrix E of `patterns(N)`, all N dot products together are one matrix–vector product with the conjugate of E."
}
```

## 12. Common mistakes

1. **"The DFT changes the signal."** The DFT changes only the description: the coordinates. The vector, and so the signal, stays the same.
2. **The dot-product method in a basis that is not orthogonal.** The method gives wrong coordinates there. The DFT works because its patterns are orthogonal.
3. **No division by the squared length.** The scores of L8 are 4 and 2, but the coordinates are 1 and 0.5. Divide by N/2 for real patterns with $0 < k < N/2$, and by N for complex patterns.
4. **No conjugate in a complex dot product.** Without it, the computed squared length of $e_1$ is 0, and the coordinates are wrong.
5. **$c_7$ as a new direction.** For N = 8, $c_7$ has the same samples as $c_1$. A basis of N samples has exactly N directions.

## 13. One-minute explanation

A list of N samples is a vector with N coordinates. In the time basis, the reference directions are single spikes, so the coordinates are the samples themselves. We can also use whole-cycle waves as the reference directions. Then the teaching signal needs only two numbers: 1 times the 1-cycle cosine plus 0.5 times the 2-cycle sine. The two bases describe the same vector. The wave patterns are orthogonal: the dot product of any two different patterns is 0. So if we take the dot product of the signal with one pattern, every other pattern gives 0. The coordinate is that one matching score divided by the squared length of the pattern. For the complex DFT patterns, the squared length is N, so the coordinates are X[k]/N.

## 14. Check questions

```check
{
  "question": "What does orthogonal mean for two lists of samples? Give one orthogonal pair from the real patterns for N = 8.",
  "hint": "It is a statement about one number.",
  "answer": "Two lists are orthogonal when their dot product is 0. Example: c₁ and c₃. Their products are 1, −0.5, 0, −0.5, 1, −0.5, 0, −0.5, and the sum is 0. Any two different patterns in the table of section 6 are orthogonal."
}
```

```check
{
  "question": "The arrow v = (1, 3). Find its coordinates in the basis turned by 30°: u₁ = (0.8660, 0.5) and u₂ = (−0.5, 0.8660).",
  "hint": "Both directions are perpendicular and have length 1, so each coordinate is one dot product.",
  "answer": "v · u₁ = 1 × 0.8660 + 3 × 0.5 = 0.8660 + 1.5 = 2.3660. v · u₂ = 1 × (−0.5) + 3 × 0.8660 = −0.5 + 2.5981 = 2.0981. So v = 2.37·u₁ + 2.10·u₂ (rounded)."
}
```

```check
{
  "question": "N = 4. The patterns are c₁ = [1, 0, −1, 0] and s₁ = [0, 1, 0, −1]. Find the coordinates of y = [3, 1, −3, −1] along c₁ and along s₁. Check your answer.",
  "hint": "Coordinate = (y · pattern) / (pattern · pattern).",
  "answer": "y · c₁ = 3 + 0 + 3 + 0 = 6, and c₁ · c₁ = 2. Coordinate 6/2 = 3. y · s₁ = 0 + 1 + 0 + 1 = 2, and s₁ · s₁ = 2. Coordinate 2/2 = 1. Check: 3·[1, 0, −1, 0] + 1·[0, 1, 0, −1] = [3, 1, −3, −1] = y."
}
```

```check
{
  "question": "Why does the matching score for one frequency not include the parts of the signal at other frequencies?",
  "hint": "Write the signal as a sum of patterns, then take the dot product with one pattern.",
  "answer": "Write $x = a_0 b_0 + a_1 b_1 + \\dots$ and take the dot product with $b_k$. The dot product is linear, so $x \\cdot b_k = a_0 (b_0 \\cdot b_k) + \\dots + a_k (b_k \\cdot b_k) + \\dots$ The patterns are orthogonal, so every term with a different pattern is 0. Only $a_k (b_k \\cdot b_k)$ remains. So the score depends only on the amount of pattern k."
}
```

```check
{
  "question": "How many non-zero numbers describe the teaching signal in the time basis? In the real frequency basis? In the complex DFT basis?",
  "hint": "Count the non-zero coordinates in each basis.",
  "answer": "Time basis: 6 non-zero samples (x[2] = x[6] = 0, so 8 coordinates with 6 non-zero). Real frequency basis: 2 (1 for c₁ and 0.5 for s₂). Complex DFT basis: 4 (bins 1, 2, 6 and 7, with coordinates 0.5, −0.25i, 0.25i and 0.5)."
}
```

```check
{
  "question": "Without the conjugate, a student computes the 'squared length' of e₁ for N = 8 as the sum of e₁[n]². Why does this fail?",
  "hint": "What is e₁[n]² as a pattern?",
  "answer": "$e_1[n]^2 = e^{i 2\\pi \\cdot 2n/8} = e_2[n]$, a whole-cycle pattern with 2 cycles. Its 8 values sum to 0. So the 'squared length' is 0 for a list whose every entry has size 1. With the conjugate, each term is $\\lvert e_1[n] \\rvert^2 = 1$, and the sum is 8 = N, the true squared length."
}
```

## 15. Links

- Previous lesson: [L8: Sweep and cancellation](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation)
- Next lesson: [L10: The complex probe](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe)
- Part: [03 Matching to DFT](/notes/maths/fft-signal-processing/03-matching-to-dft)
- Math tools: [F4: Vectors and the dot product](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product), [F5: Complex numbers](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers), [F6: Euler's formula](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula), [F7: Roots of unity](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)
- Two domains: [L5: Two domains](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains)
- Later: [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula), [L13: The inverse DFT](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
