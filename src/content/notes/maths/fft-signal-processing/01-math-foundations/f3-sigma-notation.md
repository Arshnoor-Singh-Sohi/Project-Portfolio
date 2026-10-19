---
title: "F3: Σ notation"
order: 3
summary: "How to read a Σ sum as a for-loop: index, bounds, number of terms, the rules for constants and splits, and the sum of a cosine over full cycles."
status: not-started
tags: [math, sums, sigma, foundations]
---

## 1. The question this idea answers

The two most important formulas of this subject start with the symbol Σ:

$$
\text{score} = \sum_{n=0}^{N-1} x[n]\,p[n] \qquad X[k] = \sum_{n=0}^{N-1} x[n]\, e^{-i 2\pi k n / N}
$$

The first is the matching score of [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score). The second is the DFT of [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula). How do you read Σ? Which rules let you change a sum without a change of its value? The FFT starts with one such rule. [L15](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split) splits one sum into a sum over the even $n$ and a sum over the odd $n$.

The previous lesson, [F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle), gave the values of cos and sin. This lesson adds them.

## 2. Mental model

> [!analogy] A shop receipt
> A receipt has one line for each item and a total at the bottom. Σ is the instruction "write the lines, then give the total". The index $n$ is the line number. The formula after Σ tells you what to write on line $n$.
>
> **Where it stops working:** a receipt lists items that already exist. A Σ makes each line from a formula and the line number. Also, some sums in later lessons have no last line, for example the Fourier series of [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series). A receipt always ends.

## 3. Terms

| Term | Plain meaning |
|---|---|
| sum | The result of an addition of many numbers. |
| term | One of the numbers that a sum adds. |
| Σ (sigma) | The capital Greek letter S. In math it means "add all the terms". |
| index | The counter of the sum, for example $n$. It takes each whole number from the lower bound to the upper bound. |
| lower bound | The first value of the index. It stands below Σ. |
| upper bound | The last value of the index. It stands above Σ. The sum includes this value. |
| number of terms | Upper bound − lower bound + 1. |
| constant | A quantity that does not change when the index changes. |
| change of index | A new name and a new formula for the index, for example $n = 2m$. It gives the same terms with a new count. |
| empty sum | A sum with no terms, because the upper bound is below the lower bound. Its value is 0. |

## 4. Read Σ as a for-loop

The general sum looks like this:

$$
\sum_{n=a}^{b} f(n) = f(a) + f(a+1) + \dots + f(b)
$$

Read it from the bottom, then the top, then the right:

1. Below Σ: the index $n$ starts at the lower bound $a$.
2. Above Σ: the index stops at the upper bound $b$. The sum includes the term for $b$.
3. Right of Σ: the formula $f(n)$ gives the term for each $n$.
4. Add all the terms.

In Python, the same sum is a loop:

```python
total = 0
for n in range(a, b + 1):    # b + 1, because range() stops before its end value
    total += f(n)
```

> [!trap] The upper bound of `range`
> `range(a, b)` stops at $b - 1$. The sum $\sum_{n=a}^{b}$ includes $b$. So the loop needs `range(a, b + 1)`. The DFT sum $\sum_{n=0}^{N-1}$ becomes `range(0, N)`, which is `range(N)`.

### The number of terms

The number of terms is $b - a + 1$. The "+ 1" counts the first term.

| Sum | Terms | Number of terms |
|---|---|---|
| $\sum_{n=0}^{N-1}$ | $n = 0, 1, \dots, N-1$ | $(N-1) - 0 + 1 = N$ |
| $\sum_{n=1}^{4}$ | $n = 1, 2, 3, 4$ | $4 - 1 + 1 = 4$ |
| $\sum_{n=3}^{7}$ | $n = 3, 4, 5, 6, 7$ | $7 - 3 + 1 = 5$ |
| $\sum_{n=0}^{7}$ | $n = 0, \dots, 7$ | 8 |

### Examples with numbers

> [!example] Three small sums
> $\sum_{n=1}^{4} n = 1 + 2 + 3 + 4 = 10$
>
> $\sum_{n=0}^{3} n^2 = 0 + 1 + 4 + 9 = 14$
>
> $\sum_{n=0}^{3} 2^n = 1 + 2 + 4 + 8 = 15$

> [!example] The sum of the teaching signal
> The teaching signal is x = [1, 1.21, 0, −1.21, −1, −0.21, 0, 0.21], rounded to two decimals ([F1](/notes/maths/fft-signal-processing/01-math-foundations/f1-graphs)).
>
> $\sum_{n=0}^{7} x[n] = 1 + 1.21 + 0 - 1.21 - 1 - 0.21 + 0 + 0.21 = 0$
>
> The exact sum is also 0. Section 7 shows why.

### The name of the index does not matter

$\sum_{n=0}^{7} x[n]$ and $\sum_{m=0}^{7} x[m]$ are the same sum. The index exists only inside the sum. Outside the sum it has no value. So the result of $\sum_{n=0}^{N-1} x[n]\,p[n]$ does not depend on $n$. It depends only on the lists $x$ and $p$, and on $N$.

### The empty sum

If the upper bound is below the lower bound, the sum has no terms. Its value is 0. For example, $\sum_{n=0}^{-1} x[n] = 0$. This is the sum for an empty list ($N = 0$). The loop `for n in range(0)` runs zero times, and `total` stays 0.

## 5. Rules that keep the value

Each rule below comes from the ordinary rules of addition and multiplication. No rule changes the value of the sum.

### Rule 1: the sum of a constant

If every term is the same constant $c$, the sum is the number of terms times $c$:

$$
\sum_{n=0}^{N-1} c = \underbrace{c + c + \dots + c}_{N \text{ terms}} = N c
$$

For example, $\sum_{n=0}^{7} 1 = 8$, and $\sum_{n=0}^{7} 0.5 = 4$. The DFT of a list of eight ones gives $X[0] = 8$ for this reason ([L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)).

### Rule 2: move a constant factor outside

$$
\sum_{n=0}^{N-1} c\, a[n] = c \sum_{n=0}^{N-1} a[n]
$$

Why the rule holds: $c\,a_0 + c\,a_1 = c\,(a_0 + a_1)$. This is the distributive law. It holds for any number of terms.

> [!trap] Only a true constant can move
> The factor must not depend on the index. In the DFT, $e^{-i 2\pi k n/N}$ contains $n$, so it must stay inside. $k$ does not change inside one sum, so a factor that depends only on $k$ can move outside. [L15](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split) moves the twiddle factor $W_8^k$ outside for this reason.

### Rule 3: split a sum of two parts

$$
\sum_{n=0}^{N-1} \big(a[n] + b[n]\big) = \sum_{n=0}^{N-1} a[n] + \sum_{n=0}^{N-1} b[n]
$$

Why the rule holds: addition does not depend on the order. So you can add all the $a$ terms first, then all the $b$ terms.

> [!example] Rules 2 and 3 on the matching score
> The teaching signal is $x[n] = c_1[n] + 0.5\,s_2[n]$, with $c_1[n] = \cos(2\pi n/8)$ and $s_2[n] = \sin(2\pi \cdot 2n/8)$. The matching score with the probe $c_1$ is:
>
> $$\sum_{n=0}^{7} x[n]\,c_1[n] = \sum_{n=0}^{7} c_1[n]^2 + 0.5 \sum_{n=0}^{7} s_2[n]\,c_1[n]$$
>
> 1. The squares $c_1[n]^2$ are 1, 0.5, 0, 0.5, 1, 0.5, 0, 0.5. Their sum is exactly 4.
> 2. The products $s_2[n]\,c_1[n]$ are 0, 0.71, 0, 0.71, 0, −0.71, 0, −0.71. Their sum is exactly 0. Here 0.71 is $\sqrt{2}/2 \approx 0.7071$, rounded as in the course. The course also rounds $\sqrt{2} \approx 1.4142$ to 1.41.
> 3. So the score is 4 + 0.5 × 0 = 4. This is the score of the course for k = 1 ([L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score)).
>
> The score of a mixture is the sum of the scores of its parts. [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) uses this fact.

> [!trap] A sum of products is not a product of sums
> Take a = [1, 2] and b = [3, −1].
>
> $\sum a[n]\,b[n] = 1 \cdot 3 + 2 \cdot (-1) = 1$.
>
> $\left(\sum a[n]\right)\left(\sum b[n]\right) = 3 \times 2 = 6$.
>
> The matching score is the first one: multiply point by point, then add.

## 6. Change of index: the even–odd split

A change of index gives the terms a new count. The terms stay the same. The FFT uses one change of index: split the samples into the even ones and the odd ones.

Every $n$ from 0 to 7 is either even or odd:

1. An even $n$ is $n = 2m$. For $m = 0, 1, 2, 3$, this gives $n = 0, 2, 4, 6$.
2. An odd $n$ is $n = 2m + 1$. For $m = 0, 1, 2, 3$, this gives $n = 1, 3, 5, 7$.

Each $n$ appears in exactly one of the two lists, exactly once. So the two smaller sums together hold every term of the big sum:

$$
\sum_{n=0}^{7} a[n] = \sum_{m=0}^{3} a[2m] + \sum_{m=0}^{3} a[2m+1]
$$

For any even $N$:

$$
\sum_{n=0}^{N-1} a[n] = \sum_{m=0}^{N/2-1} a[2m] + \sum_{m=0}^{N/2-1} a[2m+1]
$$

> [!example] The split with numbers
> Take $a[n] = n^2$ for $n$ = 0 to 7: the list is 0, 1, 4, 9, 16, 25, 36, 49.
>
> 1. The full sum: 0 + 1 + 4 + 9 + 16 + 25 + 36 + 49 = 140.
> 2. Even $n$ (0, 2, 4, 6): 0 + 4 + 16 + 36 = 56.
> 3. Odd $n$ (1, 3, 5, 7): 1 + 9 + 25 + 49 = 84.
> 4. Check: 56 + 84 = 140.

> [!key] The split changes nothing yet
> The even–odd split gives the same 8 terms in two groups. The value of the sum is the same. The FFT saves work only in the next step, when each group becomes a smaller DFT ([L15](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split), [L16](/notes/maths/fft-signal-processing/04-fft/l16-two-facts)).

## 7. The sum of a cosine over full cycles

This sum explains why a probe that does not match gives a score of 0. Take $N = 8$ and a cosine with $k$ cycles in the 8 samples:

$$
S_k = \sum_{n=0}^{7} \cos\!\left(\frac{2\pi k n}{8}\right)
$$

For $k = 1$, the angle grows by 45° per sample ([F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle)):

| $n$ | Angle | $\cos$ (4 decimals) | Running total |
|---|---|---|---|
| 0 | 0° | 1 | 1 |
| 1 | 45° | 0.7071 | 1.7071 |
| 2 | 90° | 0 | 1.7071 |
| 3 | 135° | −0.7071 | 1 |
| 4 | 180° | −1 | 0 |
| 5 | 225° | −0.7071 | −0.7071 |
| 6 | 270° | 0 | −0.7071 |
| 7 | 315° | 0.7071 | 0 |

So $S_1 = 0$ exactly. Python gives the other values:

| $k$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| $S_k$ | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 |

```plot
{
  "title": "k = 1 probe values cos(2πn/8) (gold) and their running total (ink): the total returns to 0 at n = 7",
  "xAxis": { "label": "sample number n", "domain": [-0.5, 7.5] },
  "yAxis": { "label": "value", "domain": [-1.5, 2] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 1], [1, 0.7071], [2, 0], [3, -0.7071], [4, -1], [5, -0.7071], [6, 0], [7, 0.7071]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true },
    { "points": [[0, 1], [1, 0.7071], [2, 0], [3, -0.7071], [4, -1], [5, -0.7071], [6, 0], [7, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true },
    { "points": [[0, 1], [1, 1.7071], [2, 1.7071], [3, 1], [4, 0], [5, -0.7071], [6, -0.7071], [7, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[0, 1], [1, 1.7071], [2, 1.7071], [3, 1], [4, 0], [5, -0.7071], [6, -0.7071], [7, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true }
  ]
}
```

### Why the terms cancel in pairs

Use the half-turn rule of F2: $\cos(\theta + \pi) = -\cos\theta$.

1. For $k = 1$, samples $n$ and $n + 4$ are 4 × 45° = 180° apart. So their cosines are opposite. The pairs (0, 4), (1, 5), (2, 6), (3, 7) each add to 0.
2. For $k = 3$, samples $n$ and $n + 4$ are 4 × 135° = 540° apart. That is 360° + 180°: a half turn again. The same pairs cancel.
3. For $k = 2$, samples $n$ and $n + 2$ are 2 × 90° = 180° apart. The pairs (0, 2), (1, 3), (4, 6), (5, 7) cancel.
4. For $k = 0$ and $k = 8$, every angle is a whole number of turns. Every cosine is 1, so the sum is 8 (Rule 1).

> [!key] The full-cycle rule
> $\sum_{n=0}^{N-1} \cos(2\pi k n/N)$ is $N$ when $k$ is a whole multiple of $N$ (including $k = 0$). For every other whole number $k$, it is exactly 0. The sine sum $\sum_{n=0}^{N-1} \sin(2\pi k n/N)$ is 0 for every whole number $k$.

This lesson shows the rule with numbers for $N = 8$. [F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity) proves it for every $N$. [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) and [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality) use it to explain why a non-matching probe scores 0.

## 8. A list of sums

The DFT is not one sum. It is one sum for each bin $k$:

$$
X[k] = \sum_{n=0}^{N-1} x[n]\, e^{-i 2\pi k n / N}, \qquad k = 0, 1, \dots, N-1
$$

In code, this is a loop over $k$ with a loop over $n$ inside. $k$ stays the same while $n$ takes all its values.

| Loop | Runs | Work |
|---|---|---|
| outer: $k$ = 0 to $N-1$ | $N$ times | one sum per run |
| inner: $n$ = 0 to $N-1$ | $N$ times per $k$ | one multiplication per run |

The total is $N \times N = N^2$ multiplications. For $N$ = 8, that is 64. [L14](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft) counts this cost, and the FFT reduces it.

> [!note] Sums with no last term
> The Fourier series of [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) uses $\sum_{k=1}^{\infty}$. The symbol ∞ means the terms never end. A computer always stops after a finite number of terms. L28 shows what this costs.

## 9. Code

Build Σ as a function. Do not use `sum()`, `np.sum()` or any other built-in sum inside your functions.

1. Write `my_sum(f, a, b)`. It returns $\sum_{n=a}^{b} f(n)$ for a Python function `f`. It returns 0 when `b < a`.
2. Write `even_odd_sums(a)`. It returns the pair `(sum of a[0], a[2], ..., sum of a[1], a[3], ...)` for a list of any length.
3. Compute $S_k = \sum_{n=0}^{7} \cos(2\pi k n/8)$ for k = 0 to 8 with `my_sum`.

Acceptance tests:

- `my_sum(lambda n: n, 1, 4) == 10` is True.
- `my_sum(lambda n: n**2, 0, 7) == 140` is True.
- `my_sum(lambda n: n, 5, 4) == 0` is True (the empty sum).
- `even_odd_sums([n**2 for n in range(8)]) == (56, 84)` is True.
- For 5 random lists `a` of even length, `np.isclose(sum(even_odd_sums(a)), np.sum(a))` is True. Here the test may use `sum`, but your function may not.
- Your values of $S_k$ for k = 0 to 8 are `[8, 0, 0, 0, 0, 0, 0, 0, 8]` within `1e-12`.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/01-math-foundations/f3-sigma-notation)

```check
{
  "question": "Stuck on `even_odd_sums`?",
  "hint": "The parity of an index is its remainder after division by 2. Python writes it `n % 2`.",
  "answer": "Keep two totals, both 0 at the start. Loop over every index n of the list. Add a[n] to the even total when n % 2 == 0, and to the odd total otherwise. Return the two totals."
}
```

## 10. Common mistakes

1. **One term too few or too many.** $\sum_{n=0}^{N-1}$ has $N$ terms. In Python it is `range(N)`, not `range(N - 1)` or `range(N + 1)`.
2. **A product of sums instead of a sum of products.** $\sum a[n]\,b[n]$ multiplies first, then adds.
3. **A factor that depends on the index moved outside.** Only a factor without $n$ can move outside a sum over $n$.
4. **The full-cycle rule used for $k = 0$.** For $k = 0$ every cosine is 1, so the sum is $N$, not 0.
5. **The index used outside the sum.** After the sum, $n$ has no value. The result depends only on the other symbols, for example $k$ and $N$.

## 11. One-minute explanation

Σ means "add all the terms", and it is a for-loop from the lower bound to the upper bound, both included, so $\sum_{n=0}^{N-1}$ has $N$ terms. A constant factor can move outside the sum, and a sum of two parts can split into two sums. A sum of products is not the product of two sums. Any sum over $n$ splits into a sum over the even $n$ plus a sum over the odd $n$, with no change of value. The FFT starts with this split. A cosine with $k$ full cycles adds to 0 over the $N$ samples, unless $k$ is 0 or a multiple of $N$.

## 12. Check questions

```check
{
  "question": "How many terms does $\\sum_{n=2}^{9} f(n)$ have?",
  "hint": "Upper bound − lower bound + 1.",
  "answer": "9 − 2 + 1 = 8 terms: n = 2, 3, 4, 5, 6, 7, 8, 9."
}
```

```check
{
  "question": "Compute $\\sum_{n=0}^{3} (2n + 1)$ by hand.",
  "hint": "Write each term for n = 0, 1, 2, 3 first.",
  "answer": "The terms are 1, 3, 5, 7. The sum is 1 + 3 + 5 + 7 = 16."
}
```

```check
{
  "question": "Why is $\\sum_{n=0}^{7} 0.5\\, s[n]\\, p[n] = 0.5 \\sum_{n=0}^{7} s[n]\\, p[n]$ correct? Would the same move be correct for the factor $\\cos(2\\pi n/8)$?",
  "hint": "Ask whether the factor changes when n changes.",
  "answer": "0.5 does not depend on n. By the distributive law, $0.5 a_0 + 0.5 a_1 + \\dots = 0.5 (a_0 + a_1 + \\dots)$. The factor $\\cos(2\\pi n/8)$ changes with n, so it must stay inside the sum."
}
```

```check
{
  "question": "Take N = 4. Compute $\\sum_{n=0}^{3} \\cos(2\\pi k n/4)$ for k = 0, 1 and 2. Write every term.",
  "hint": "The angle step is $2\\pi k/4$, which is k × 90°.",
  "answer": "k = 0: 1 + 1 + 1 + 1 = 4. k = 1 (angles 0°, 90°, 180°, 270°): 1 + 0 − 1 + 0 = 0. k = 2 (angles 0°, 180°, 360°, 540°): 1 − 1 + 1 − 1 = 0. This agrees with the full-cycle rule: N for k = 0, otherwise 0."
}
```

```check
{
  "question": "Take a = [3, 1, 4, 1, 5, 9, 2, 6]. Compute the even sum, the odd sum and the full sum. Check the split.",
  "hint": "Even sum: a[0] + a[2] + a[4] + a[6].",
  "answer": "Even: 3 + 4 + 5 + 2 = 14. Odd: 1 + 1 + 9 + 6 = 17. Full: 3 + 1 + 4 + 1 + 5 + 9 + 2 + 6 = 31. Check: 14 + 17 = 31."
}
```

```check
{
  "question": "Take a = [1, 2] and b = [3, −1]. Compute $\\sum a[n] b[n]$ and $(\\sum a[n])(\\sum b[n])$. Which one is the matching score?",
  "hint": "The matching score multiplies point by point first.",
  "answer": "$\\sum a[n] b[n] = 1 \\cdot 3 + 2 \\cdot (-1) = 1$. $(\\sum a)(\\sum b) = 3 \\times 2 = 6$. The matching score is the first one: 1."
}
```

## 13. Links

- Previous lesson: [F2: Radians and the unit circle](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle)
- Next lesson: [F4: Vectors and the dot product](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product)
- Used in: [L7: The matching score](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score), [L8: Sweep and cancellation](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation), [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula), [L14: The cost of the direct DFT](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft), [L15: The even–odd split](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split)
- The proof of the full-cycle rule: [F7: Roots of unity](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)
- [01 Math foundations](/notes/maths/fft-signal-processing/01-math-foundations)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
