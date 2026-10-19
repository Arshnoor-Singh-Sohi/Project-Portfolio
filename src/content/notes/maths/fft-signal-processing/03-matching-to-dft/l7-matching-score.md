---
title: "L7: The matching score"
order: 1
summary: "Multiply the signal and a candidate wave point by point, then add. The result is one number that tells how well the candidate matches the samples."
status: not-started
tags: [dft, matching, probe, inner-product]
---

## 1. The question this idea answers

A recording is a list of numbers. Lesson [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) showed how a sample rate changes a signal into this list. Lesson [L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains) said that the same signal also has a frequency description: which waves are inside it, and how strong each wave is.

So the question is: **which frequencies are inside a list of numbers?**

The list does not tell us directly. Each sample holds the sum of all the waves at one instant. We need a tool that reads the frequency description from the samples.

This lesson builds the first part of that tool. We pick one candidate wave and compute one number. The number tells how well the candidate matches the samples. The DFT ([L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)) uses this same tool once for each candidate frequency.

## 2. Mental model

> [!analogy] Two people answer the same quiz
> Two people answer eight yes-or-no questions. Write "yes" as +1 and "no" as −1. For each question, multiply the two answers. The same answers give +1. Different answers give −1. Then add the eight results.
>
> If the two people think alike, most results are +1, and the total is large. If they answer independently, the +1 results and the −1 results cancel, and the total is near 0.
>
> **Where it stops working:** a sample is not only +1 or −1. A large sample counts more than a small sample, so the size matters, not only the sign. Also, a total of 0 does not mean that the signal is empty. It means only that the signal does not agree with this one candidate. Lesson L8 shows a wave that hides from one candidate.

## 3. Terms

| Term | Plain meaning |
|---|---|
| teaching signal | The 8-sample signal of this part: $x[n] = \cos(2\pi n/8) + 0.5\sin(2\pi \cdot 2n/8)$. We built it, so we know the answer. |
| probe | A candidate wave that we compare with the signal. It has the same number of samples as the signal. |
| probe frequency $k$ | The number of full cycles that the probe makes over the N samples. |
| product | The result of one multiplication: $x[n] \cdot p[n]$ at one sample number n. |
| matching score | Multiply the signal and the probe point by point, then add the N products. The result is one number. |
| reinforcement | Most products have the same sign, so the sum grows. |
| cancellation | The positive products and the negative products have the same total size, so the sum is 0. |
| inner product | The name that mathematicians use for the matching score. For lists of real numbers, it is the dot product ([F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product)). |

## 4. Multiply point by point, then add

These are the symbols:

- $N$ is the number of samples. In this part, N = 8.
- $n$ is the sample number. It goes from 0 to N − 1.
- $x[n]$ is sample n of the signal.
- $p[n]$ is sample n of the probe.

The matching score is:

$$
\text{score} = \sum_{n=0}^{N-1} x[n]\, p[n] = x[0]\,p[0] + x[1]\,p[1] + \dots + x[N-1]\,p[N-1]
$$

Read the Σ as a for-loop ([F3](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation)). Start at n = 0. Compute one product and add it to a running total. Stop after n = N − 1.

To compute a matching score:

1. Put the two lists side by side. They must have the same length N.
2. At each sample number n, multiply the two values. This gives N products.
3. Add the N products. The total is the matching score.

> [!example] A two-sample example
> Let a = [1, 2] and b = [3, −1].
>
> 1. Products: 1 × 3 = 3 and 2 × (−1) = −2.
> 2. Score: 3 + (−2) = 1.

### Why multiplication is the right operation

The sign of a product tells whether the two values agree:

| x[n] | p[n] | product | meaning |
|---|---|---|---|
| positive | positive | positive | agree |
| negative | negative | positive | agree |
| positive | negative | negative | disagree |
| negative | positive | negative | disagree |
| 0 | any value | 0 | no vote |

The size of a product grows with the size of each value. So each product is a vote for agreement or disagreement, with a weight. The sum collects the votes of all N samples.

## 5. The teaching signal

This part uses one signal for every example:

$$
x[n] = \cos\left(\frac{2\pi n}{8}\right) + 0.5\,\sin\left(\frac{2\pi \cdot 2n}{8}\right), \qquad n = 0, 1, \dots, 7
$$

1. The first part is a cosine with amplitude 1. It makes 1 cycle over the 8 samples.
2. The second part is a sine with amplitude 0.5. It makes 2 cycles over the 8 samples.

We built the signal, so we know what a good tool must find: a 1-cycle part and a 2-cycle part, and nothing else.

To compute each sample, change the angles into degrees. The angle $2\pi n/8$ radians equals $45° \cdot n$. The angle $2\pi \cdot 2n/8$ radians equals $90° \cdot n$.

| n | angle 2πn/8 | cos(2πn/8) | angle 2π·2n/8 | 0.5·sin(2π·2n/8) | x[n] (exact) | x[n] (rounded) |
|---|---|---|---|---|---|---|
| 0 | 0° | 1.00 | 0° | 0.00 | 1 | 1.00 |
| 1 | 45° | 0.71 | 90° | 0.50 | (1+√2)/2 | 1.21 |
| 2 | 90° | 0.00 | 180° | 0.00 | 0 | 0.00 |
| 3 | 135° | −0.71 | 270° | −0.50 | −(1+√2)/2 | −1.21 |
| 4 | 180° | −1.00 | 360° | 0.00 | −1 | −1.00 |
| 5 | 225° | −0.71 | 450° | 0.50 | (1−√2)/2 | −0.21 |
| 6 | 270° | 0.00 | 540° | 0.00 | 0 | 0.00 |
| 7 | 315° | 0.71 | 630° | −0.50 | (√2−1)/2 | 0.21 |

> [!example] Sample n = 1, step by step
> 1. First angle: $2\pi \cdot 1/8 = \pi/4$ rad = 45°. So $\cos 45° = 1/\sqrt{2} = 0.7071\dots$
> 2. Second angle: $2\pi \cdot 2 \cdot 1/8 = \pi/2$ rad = 90°. So $\sin 90° = 1$, and $0.5 \times 1 = 0.5$.
> 3. Add: $x[1] = 0.7071\dots + 0.5 = 1.2071\dots$ This is exactly $(1 + \sqrt{2})/2$.

> [!note] Rounding on this page
> The tables show values rounded to two decimals, as the course video does. So $1/\sqrt{2} = 0.7071\dots$ shows as 0.71, and $\sqrt{2} = 1.4142\dots$ shows as 1.41. Every table value comes from the exact numbers. We round only at the end.

So, rounded to two decimals, x = [1, 1.21, 0, −1.21, −1, −0.21, 0, 0.21].

## 6. Score against a matching probe (k = 1)

Take a probe that we expect to match: a cosine that makes 1 cycle over the 8 samples.

$$
p[n] = \cos\left(\frac{2\pi \cdot 1 \cdot n}{8}\right)
$$

| n | x[n] | p[n] = cos(2π·1·n/8) | product x[n]·p[n] | sign of the product |
|---|---|---|---|---|
| 0 | 1.00 | 1.00 | 1.00 | + |
| 1 | 1.21 | 0.71 | 0.85 | + |
| 2 | 0.00 | 0.00 | 0.00 | 0 |
| 3 | −1.21 | −0.71 | 0.85 | + |
| 4 | −1.00 | −1.00 | 1.00 | + |
| 5 | −0.21 | −0.71 | 0.15 | + |
| 6 | 0.00 | 0.00 | 0.00 | 0 |
| 7 | 0.21 | 0.71 | 0.15 | + |
| **sum** | | | **4** | |

Add the products: 1 + 0.85 + 0 + 0.85 + 1 + 0.15 + 0 + 0.15 = 4.

Every product is positive or zero. At each sample where both values are not zero, the signal and the probe have the same sign. For example, at n = 3, x[3] = −1.21 and p[3] = −0.71. Two negative values give a positive product: +0.85.

> [!example] The score is exactly 4
> The exact products are 1, $(2+\sqrt{2})/4$, 0, $(2+\sqrt{2})/4$, 1, $(2-\sqrt{2})/4$, 0 and $(2-\sqrt{2})/4$.
>
> 1. The two products equal to 1 give 2.
> 2. The four other products give $\frac{(2+\sqrt{2}) + (2+\sqrt{2}) + (2-\sqrt{2}) + (2-\sqrt{2})}{4} = \frac{8}{4} = 2$.
> 3. Total: 2 + 2 = 4, exactly. The $\sqrt{2}$ terms cancel.

> [!trap] Multiply exact values, then round
> With the rounded values, 1.21 × 0.71 = 0.8591. This rounds to 0.86, but the table shows 0.85. The exact product is $\frac{1+\sqrt{2}}{2} \times \frac{1}{\sqrt{2}} = \frac{2+\sqrt{2}}{4} = 0.8536$, and this rounds to 0.85. Rounded inputs carry a small error into the product. Use exact values or four decimals when the last digit matters.

## 7. Score against a probe that does not match (k = 3)

Now take a cosine that makes 3 cycles over the 8 samples. The signal has no 3-cycle part.

$$
p[n] = \cos\left(\frac{2\pi \cdot 3 \cdot n}{8}\right)
$$

| n | x[n] | p[n] = cos(2π·3·n/8) | product x[n]·p[n] | sign of the product |
|---|---|---|---|---|
| 0 | 1.00 | 1.00 | 1.00 | + |
| 1 | 1.21 | −0.71 | −0.85 | − |
| 2 | 0.00 | 0.00 | 0.00 | 0 |
| 3 | −1.21 | 0.71 | −0.85 | − |
| 4 | −1.00 | −1.00 | 1.00 | + |
| 5 | −0.21 | 0.71 | −0.15 | − |
| 6 | 0.00 | 0.00 | 0.00 | 0 |
| 7 | 0.21 | −0.71 | −0.15 | − |
| **sum** | | | **0** | |

1. Positive products: 1 + 1 = 2.
2. Negative products: −0.85 − 0.85 − 0.15 − 0.15 = −2.
3. Score: 2 + (−2) = 0.

The probe changes sign faster than the signal. At some samples they agree, and at other samples they disagree. Here the agreements and the disagreements have exactly the same total size. This is cancellation.

> [!key] Reinforcement and cancellation
> A matching probe has the same sign as the signal at almost every sample. The products are mostly positive. They reinforce, and the score is large. A probe that does not match agrees at some samples and disagrees at others. The products cancel, and the score is 0. Lesson L8 shows why the cancellation is exact.

## 8. Three properties of the score

### Every sample contributes

The score uses all N products. So it describes the whole list of samples, not one instant. A frequency coefficient ([L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)) is a matching score. So a frequency coefficient also summarizes all N samples.

### The score of a sum is the sum of the scores

The teaching signal is a cosine part plus a sine part. You can score each part alone, then add the two scores. This is true because $(a[n] + b[n])\,p[n] = a[n]\,p[n] + b[n]\,p[n]$ at every n. Then the sum over n keeps the two parts apart.

| n | cosine part | sine part | p[n] (k = 1) | cosine part × p[n] | sine part × p[n] |
|---|---|---|---|---|---|
| 0 | 1.00 | 0.00 | 1.00 | 1.00 | 0.00 |
| 1 | 0.71 | 0.50 | 0.71 | 0.50 | 0.35 |
| 2 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 3 | −0.71 | −0.50 | −0.71 | 0.50 | 0.35 |
| 4 | −1.00 | 0.00 | −1.00 | 1.00 | 0.00 |
| 5 | −0.71 | 0.50 | −0.71 | 0.50 | −0.35 |
| 6 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 7 | 0.71 | −0.50 | 0.71 | 0.50 | −0.35 |
| **sum** | | | | **4** | **0** |

The cosine part scores 4. The sine part scores 0. The total is 4 + 0 = 4, the same as in section 6. Mathematicians say that the score is **linear**. Lesson L8 uses this property to explain every score of a sweep.

### The score has no fixed scale

The score grows with the amplitude and with N.

1. Double the signal: 2·x against the same probe gives 2 × 4 = 8.
2. Use more samples: a 1-cycle cosine with N = 16 samples scores 8 against its own probe, not 4.

For a cosine with amplitude 1 and its own probe, the score is N/2. Lesson L11 uses this fact to change a score into an amplitude.

## 9. The name: inner product

Mathematicians call the multiply-and-add operation the **inner product**. For two lists of real numbers, it is the same as the **dot product** of two vectors ([F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product)):

$$
x \cdot p = \sum_{n=0}^{N-1} x[n]\, p[n]
$$

These notes keep the name "matching score" for the operation on signals. Lesson [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality) uses the vector view: a list of 8 samples is a vector with 8 coordinates.

## 10. Graphs

The graphs show the samples as dots. The lines only join the dots to help the eye.

The signal and the k = 1 probe have the same sign at every sample where both are not zero:

```plot
{
  "title": "Teaching signal x[n] (blue) and the k = 1 cosine probe (gold)",
  "xAxis": {"label": "sample number n", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "value", "domain": [-1.6, 1.6]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 1.0], [1.0, 1.2071], [2.0, 0.0], [3.0, -1.2071], [4.0, -1.0], [5.0, -0.2071], [6.0, 0.0], [7.0, 0.2071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 1.2071], [2.0, 0.0], [3.0, -1.2071], [4.0, -1.0], [5.0, -0.2071], [6.0, 0.0], [7.0, 0.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 0.7071], [2.0, 0.0], [3.0, -0.7071], [4.0, -1.0], [5.0, -0.7071], [6.0, 0.0], [7.0, 0.7071]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 0.7071], [2.0, 0.0], [3.0, -0.7071], [4.0, -1.0], [5.0, -0.7071], [6.0, 0.0], [7.0, 0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true}
  ]
}
```

So every product is 0 or positive:

```plot
{
  "title": "Products x[n]·p[n] for the k = 1 probe (ink). All are 0 or positive. Sum = 4.",
  "xAxis": {"label": "sample number n", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "product", "domain": [-1.2, 1.2]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 1.0], [1.0, 0.8536], [2.0, 0.0], [3.0, 0.8536], [4.0, 1.0], [5.0, 0.1464], [6.0, 0.0], [7.0, 0.1464]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[-0.5, 0], [7.5, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true}
  ]
}
```

The k = 3 probe changes sign three times as often:

```plot
{
  "title": "Teaching signal x[n] (blue) and the k = 3 cosine probe (gold)",
  "xAxis": {"label": "sample number n", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "value", "domain": [-1.6, 1.6]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 1.0], [1.0, 1.2071], [2.0, 0.0], [3.0, -1.2071], [4.0, -1.0], [5.0, -0.2071], [6.0, 0.0], [7.0, 0.2071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 1.2071], [2.0, 0.0], [3.0, -1.2071], [4.0, -1.0], [5.0, -0.2071], [6.0, 0.0], [7.0, 0.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, -0.7071], [2.0, 0.0], [3.0, 0.7071], [4.0, -1.0], [5.0, 0.7071], [6.0, 0.0], [7.0, -0.7071]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, -0.7071], [2.0, 0.0], [3.0, 0.7071], [4.0, -1.0], [5.0, 0.7071], [6.0, 0.0], [7.0, -0.7071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true}
  ]
}
```

Its products have both signs, and they cancel:

```plot
{
  "title": "Products for the k = 3 probe: positive or zero (ink), negative (red). They cancel to 0.",
  "xAxis": {"label": "sample number n", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "product", "domain": [-1.2, 1.2]},
  "disableZoom": true,
  "data": [
    {"points": [[0, 1.0], [2, 0.0], [4, 1.0], [6, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[1, -0.8536], [3, -0.8536], [5, -0.1464], [7, -0.1464]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true},
    {"points": [[-0.5, 0], [7.5, 0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true}
  ]
}
```

## 11. Video

Watch the 8 samples appear, then the probe: a cosine with exactly 1 cycle over the 8 samples.

```video
{
  "src": "/notes/media/fft-signal-processing/course/03_Fourier_Analysis_as_Matching.mp4",
  "start": "0:00",
  "end": "0:19",
  "caption": "Eight samples of the signal, and a cosine probe with 1 cycle."
}
```

Watch the products appear one at a time. The video shows positive products in green. The score is 4.

```video
{
  "src": "/notes/media/fft-signal-processing/course/03_Fourier_Analysis_as_Matching.mp4",
  "start": "0:19",
  "end": "0:33",
  "caption": "Multiply point by point, then add: the score is 4."
}
```

## 12. Code

Write the function `matching_score(x, probe)`.

1. Inputs: two sequences of real numbers with the same length.
2. Output: one float, the matching score.
3. Use a for-loop over n. Do not call `np.dot` or `sum(a * b)` inside the function.
4. Raise `ValueError` when the two lengths are different.

Make the teaching signal with these two lines:

```python
n = np.arange(8)
x = np.cos(2 * np.pi * n / 8) + 0.5 * np.sin(2 * np.pi * 2 * n / 8)
```

Acceptance tests:

1. `matching_score([1, 2], [3, -1]) == 1` is True.
2. `matching_score([], []) == 0` is True.
3. `np.isclose(matching_score(x, np.cos(2 * np.pi * 1 * n / 8)), 4)` is True.
4. `np.isclose(matching_score(x, np.cos(2 * np.pi * 3 * n / 8)), 0, atol=1e-12)` is True.
5. For 5 random pairs `a`, `b` of length 16, `np.isclose(matching_score(a, b), np.dot(a, b))` is True.
6. For random `a`, `b`, `p` of length 8, the score of `a + b` equals the score of `a` plus the score of `b` (use `np.isclose`).
7. `matching_score([1, 2, 3], [1, 2])` raises `ValueError`.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/03-matching-to-dft/l7-matching-score)

```check
{
  "question": "Stuck on `matching_score`? Use the hint first.",
  "hint": "Start a running total at 0. Visit each sample number n once. At each n, add one product to the total.",
  "answer": "Idea: check the two lengths first. Then loop over n from 0 to N − 1 and add x[n] × probe[n] to the total. Return the total. An empty list gives a loop with no steps, so the total stays 0."
}
```

## 13. Common mistakes

1. **A coefficient from one sample.** A matching score uses every sample. One product at one n says almost nothing about a frequency.
2. **"Score 0 means no signal."** Score 0 means no agreement with this probe only. The teaching signal is not zero, but its k = 3 score is 0.
3. **Rounding before multiplying.** 1.21 × 0.71 gives 0.86, but the true product is 0.8536. Multiply exact values, then round.
4. **Lists that are out of step.** The two lists must have the same length, and x[n] must meet p[n] at the same n. A shift of one sample changes the score.
5. **Comparing raw scores across different N or amplitudes.** The score grows with the amplitude and with N. Compare raw scores only for the same N. Lesson L11 shows how to change a score into an amplitude.

## 14. One-minute explanation

To learn whether a frequency is inside a list of samples, make a probe: a cosine with that frequency and the same number of samples. Multiply the signal and the probe at each sample, then add all the products. That sum is the matching score. Where the two waves have the same sign, the product is positive. If the probe matches a part of the signal, the signs agree almost everywhere, so the products reinforce and the score is large. If the probe does not match, the signs agree at some samples and disagree at others, so the products cancel and the score is 0. For the teaching signal, the 1-cycle probe scores 4 and the 3-cycle probe scores 0. Mathematicians call this operation the inner product, or the dot product.

## 15. Check questions

```check
{
  "question": "In your own words, how do you compute a matching score? What does a large score tell you, and what does a score of 0 tell you?",
  "hint": "Two operations, in a fixed order.",
  "answer": "Multiply the signal and the probe point by point, then add the N products. A large score means that the signal and the probe have the same sign at most samples: the probe matches a part of the signal. A score of 0 means that the agreements and the disagreements cancel: no part of the signal agrees with this probe. It does not mean that the signal is empty."
}
```

```check
{
  "question": "a = [2, −1, 0, 3] and b = [1, 1, −2, 1]. Compute the matching score by hand.",
  "hint": "Four products, then one sum.",
  "answer": "Products: 2 × 1 = 2, (−1) × 1 = −1, 0 × (−2) = 0, 3 × 1 = 3. Score: 2 − 1 + 0 + 3 = 4."
}
```

```check
{
  "question": "The teaching signal is x = [1, 1.21, 0, −1.21, −1, −0.21, 0, 0.21]. Score it against the constant probe p = [1, 1, 1, 1, 1, 1, 1, 1], the probe with k = 0. What does the result mean?",
  "hint": "When every probe value is 1, each product is just the sample.",
  "answer": "The score is the plain sum of the samples: 1 + 1.21 + 0 − 1.21 − 1 − 0.21 + 0 + 0.21 = 0. The signal has no constant part: its average is 0. Both of its waves complete whole cycles, so their samples add to 0."
}
```

```check
{
  "question": "Why is the score of the teaching signal against the 3-cycle cosine probe exactly 0, and not only small?",
  "hint": "Add the positive products and the negative products separately.",
  "answer": "The probe changes sign faster than the signal. The positive products are 1 and 1, a total of 2. The negative products are −0.8536, −0.8536, −0.1464 and −0.1464, a total of exactly −2. So the positive and negative parts have the same total size, and they cancel. Lesson L8 shows the general reason. The product of two whole-cycle waves with different frequencies is a sum of whole-cycle waves. Each of these waves sums to 0."
}
```

```check
{
  "question": "A new signal y = [2, 0, −2, 0, 2, 0, −2, 0] makes 2 cycles in 8 samples. Compute its score against the 2-cycle cosine probe [1, 0, −1, 0, 1, 0, −1, 0]. Then compute its score against the 1-cycle cosine probe [1, 0.71, 0, −0.71, −1, −0.71, 0, 0.71].",
  "hint": "Many products are 0 because one of the two values is 0.",
  "answer": "2-cycle probe: 2 × 1 + (−2) × (−1) + 2 × 1 + (−2) × (−1) = 2 + 2 + 2 + 2 = 8. This is amplitude 2 × N/2 = 2 × 4. 1-cycle probe: 2 × 1 + (−2) × 0 + 2 × (−1) + (−2) × 0 = 2 + 0 − 2 + 0 = 0 (the other products are 0 because y is 0 there). The probe with the matching frequency reinforces, and the other probe cancels."
}
```

```check
{
  "question": "You double every sample of a signal. What happens to every matching score? Why?",
  "hint": "Start with one product.",
  "answer": "Every score doubles. Each product changes from x[n]·p[n] to 2·x[n]·p[n], so the sum of the products also doubles. For the teaching signal and the k = 1 probe, the score changes from 4 to 8. So a raw score depends on the amplitude, and also on N."
}
```

## 16. Links

- Previous lesson: [L6: Samples](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples)
- Next lesson: [L8: Sweep and cancellation](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation)
- Part: [03 Matching to DFT](/notes/maths/fft-signal-processing/03-matching-to-dft)
- Math tools: [F3: Σ notation](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation), [F4: Vectors and the dot product](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product)
- Later use: [L9: Basis and orthogonality](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality), [L11: The DFT formula](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
