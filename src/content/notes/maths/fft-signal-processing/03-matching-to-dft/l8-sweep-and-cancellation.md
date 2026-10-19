---
title: "L8: Sweep and cancellation"
order: 2
summary: "Score the signal against every probe frequency k = 0 to 7, prove why the probes that do not match give exactly 0, and see why a cosine probe alone misses a sine."
status: not-started
tags: [dft, matching, sweep, cancellation, phase]
---

## 1. The question this idea answers

Lesson [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score) scored the teaching signal against two probes by hand. The k = 1 probe scored 4, and the k = 3 probe scored 0. But in a real recording we do not know which frequencies to try.

So we try every probe frequency, one after another. This is a **sweep**. The sweep raises three questions:

1. Which probe frequencies k must we try, and when can we stop?
2. Why does a probe that does not match give **exactly** 0, and not only a small number?
3. Can a probe miss a part of the signal that is really there?

The answer to question 3 is yes. That answer leads to complex numbers in lesson L10.

## 2. Mental model

> [!analogy] A radio dial
> Turn the dial of a radio slowly from one end to the other. At each position you hear how strong that station is. Most positions give silence. A few positions give a loud station. A sweep does the same with probe frequencies: most scores are 0, and a few scores are large.
>
> **Where it stops working:** a radio dial turns smoothly, but the DFT uses only N positions: the whole numbers k = 0 to N − 1. Between them the scores are not clean (section 6). Also, a radio hears a station at any timing. One cosine probe does not. It can miss a wave that is a quarter cycle out of step (section 7). So the sweep needs two dials: a cosine probe and a sine probe.

## 3. Terms

| Term | Plain meaning |
|---|---|
| sweep | Compute the matching score for every probe frequency k = 0, 1, …, N − 1, one after another. |
| cosine probe $c_k$ | The probe $c_k[n] = \cos(2\pi k n/N)$. It makes k cycles over the N samples and starts at its top. |
| sine probe $s_k$ | The probe $s_k[n] = \sin(2\pi k n/N)$. It makes k cycles over the N samples and starts at 0, moving up. |
| cosine score $C[k]$ | The matching score of the signal against $c_k$. |
| sine score $S[k]$ | The matching score of the signal against $s_k$. |
| whole-cycle wave | A wave that makes a whole number of cycles over the N samples. Its last sample joins smoothly to its first sample. |
| quarter-cycle shift | A shift of one quarter of a period, that is 90°. A sine is a cosine with a quarter-cycle delay. |
| product-to-sum rule | The identity $\cos a \cos b = \tfrac{1}{2}\cos(a-b) + \tfrac{1}{2}\cos(a+b)$. It changes a product of two waves into a sum of two waves. |

## 4. Which probe frequencies to try

The DFT uses only whole-number probe frequencies: k = 0, 1, 2, …, N − 1. There are two reasons.

1. **A whole number of cycles fits the samples.** A probe with k = 1.5 stops in the middle of a cycle. Section 6 shows that its scores are not clean.
2. **After k = N − 1, the probes repeat.** The probe with k = 8 has $\cos(2\pi \cdot 8 \cdot n/8) = \cos(2\pi n) = 1$ at every sample. That is the same list as the probe with k = 0. With only 8 samples, we cannot distinguish the two probes.

There is a second repeat inside the range. The cosine probe with frequency N − k has the same samples as the cosine probe with frequency k:

$$
\cos\left(\frac{2\pi (N-k) n}{N}\right) = \cos\left(2\pi n - \frac{2\pi k n}{N}\right) = \cos\left(\frac{2\pi k n}{N}\right)
$$

The first step expands the bracket. The second step removes the $2\pi n$, because n is a whole number and a full turn does not change a cosine. The cosine is also symmetric: $\cos(-a) = \cos a$. For the sine probe, the same steps give a minus sign: $s_{N-k} = -s_k$. Lesson [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror) calls this the mirror.

## 5. The cosine sweep

The table shows every product $x[n] \cdot c_k[n]$, and the score in the last column. The table rounds the values to two decimals ($1/\sqrt{2} = 0.7071\dots$ shows as 0.71). The scores come from the exact values.

| k | n = 0 | n = 1 | n = 2 | n = 3 | n = 4 | n = 5 | n = 6 | n = 7 | score |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 1.00 | 1.21 | 0.00 | −1.21 | −1.00 | −0.21 | 0.00 | 0.21 | **0** |
| 1 | 1.00 | 0.85 | 0.00 | 0.85 | 1.00 | 0.15 | 0.00 | 0.15 | **4** |
| 2 | 1.00 | 0.00 | 0.00 | 0.00 | −1.00 | 0.00 | 0.00 | 0.00 | **0** |
| 3 | 1.00 | −0.85 | 0.00 | −0.85 | 1.00 | −0.15 | 0.00 | −0.15 | **0** |
| 4 | 1.00 | −1.21 | 0.00 | 1.21 | −1.00 | 0.21 | 0.00 | −0.21 | **0** |
| 5 | 1.00 | −0.85 | 0.00 | −0.85 | 1.00 | −0.15 | 0.00 | −0.15 | **0** |
| 6 | 1.00 | 0.00 | 0.00 | 0.00 | −1.00 | 0.00 | 0.00 | 0.00 | **0** |
| 7 | 1.00 | 0.85 | 0.00 | 0.85 | 1.00 | 0.15 | 0.00 | 0.15 | **4** |

So the cosine scores are C = [0, 4, 0, 0, 0, 0, 0, 4].

Read the table one row at a time:

1. **k = 0.** The probe is all 1s. So each product is the sample itself, and the score is the sum of the samples: 0. The signal has no constant part.
2. **k = 1.** Every product is 0 or positive. The score is 4. This is the 1-cycle cosine that we put in.
3. **k = 2.** The score is 0. But the signal has a 2-cycle part. Section 7 solves this puzzle.
4. **k = 3, 4, 5.** The products have both signs, and they cancel to 0.
5. **k = 6, 7.** Row 6 is a copy of row 2, and row 7 is a copy of row 1. The probes are the same lists (section 4).

## 6. Why the cancellation is exact

L7 showed that the k = 3 products cancel. This section shows why they cancel **exactly**. The proof has three steps.

### Step 1: a whole-cycle wave sums to 0

Add the 8 samples of a cosine that makes 2 cycles: 1 + 0 − 1 + 0 + 1 + 0 − 1 + 0 = 0. Add the 8 samples of a cosine that makes 4 cycles: 1 − 1 + 1 − 1 + 1 − 1 + 1 − 1 = 0.

The rule: **a whole-cycle cosine or sine with m cycles has N samples that sum to 0. This is true when m is not 0 and not a multiple of N.** Every positive part of the wave has a matching negative part. [F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity) proves the rule in general with roots of unity.

When m = 0 or m is a multiple of N, the cosine is 1 at every sample. Then its N samples sum to N.

### Step 2: the product of two waves is a sum of two waves

Start from the two angle-sum formulas:

$$
\cos(a - b) = \cos a \cos b + \sin a \sin b \qquad \cos(a + b) = \cos a \cos b - \sin a \sin b
$$

Add the two lines. The sine terms cancel:

$$
\cos(a-b) + \cos(a+b) = 2 \cos a \cos b \quad\Rightarrow\quad \cos a \cos b = \tfrac{1}{2}\cos(a-b) + \tfrac{1}{2}\cos(a+b)
$$

> [!example] Check the rule with numbers
> Take a = 45° and b = 135°.
>
> 1. Left side: $\cos 45° \times \cos 135° = 0.7071 \times (-0.7071) = -0.5$.
> 2. Right side: $\tfrac{1}{2}\cos(-90°) + \tfrac{1}{2}\cos(180°) = \tfrac{1}{2}(0) + \tfrac{1}{2}(-1) = -0.5$.
>
> Both sides are −0.5.

### Step 3: apply the two steps to the sweep

Take the cosine part of the signal (1 cycle) and the probe with k = 3. At sample n, the angles are $a = 2\pi \cdot 1 \cdot n/8$ and $b = 2\pi \cdot 3 \cdot n/8$. Then $a - b$ makes −2 cycles and $a + b$ makes 4 cycles. A cosine does not change when its angle changes sign. So:

$$
\cos\left(\frac{2\pi n}{8}\right)\cos\left(\frac{2\pi \cdot 3n}{8}\right) = \tfrac{1}{2}\cos\left(\frac{2\pi \cdot 2n}{8}\right) + \tfrac{1}{2}\cos\left(\frac{2\pi \cdot 4n}{8}\right)
$$

Both halves are whole-cycle waves with 2 and 4 cycles. By step 1, each half sums to 0. So the score is exactly 0.

| n | cos(2π·1·n/8)·cos(2π·3·n/8) | ½·cos(2π·2n/8) | ½·cos(2π·4n/8) | sum of the two halves |
|---|---|---|---|---|
| 0 | 1.00 | 0.50 | 0.50 | 1.00 |
| 1 | −0.50 | 0.00 | −0.50 | −0.50 |
| 2 | 0.00 | −0.50 | 0.50 | 0.00 |
| 3 | −0.50 | 0.00 | −0.50 | −0.50 |
| 4 | 1.00 | 0.50 | 0.50 | 1.00 |
| 5 | −0.50 | 0.00 | −0.50 | −0.50 |
| 6 | 0.00 | −0.50 | 0.50 | 0.00 |
| 7 | −0.50 | 0.00 | −0.50 | −0.50 |
| **sum** | **0** | **0** | **0** | **0** |

Now take the matching case: the cosine part and the probe with k = 1. Then $a - b = 0$, so the first half is $\tfrac{1}{2}\cos 0 = \tfrac{1}{2}$ at every sample:

$$
\cos^2\left(\frac{2\pi n}{8}\right) = \tfrac{1}{2} + \tfrac{1}{2}\cos\left(\frac{2\pi \cdot 2n}{8}\right)
$$

The constant half sums to 8 × ½ = 4. The other half is a 2-cycle wave, so it sums to 0. The score is 4 = N/2.

| n | cos²(2π·1·n/8) | ½ (constant) | ½·cos(2π·2n/8) | sum of the two halves |
|---|---|---|---|---|
| 0 | 1.00 | 0.50 | 0.50 | 1.00 |
| 1 | 0.50 | 0.50 | 0.00 | 0.50 |
| 2 | 0.00 | 0.50 | −0.50 | 0.00 |
| 3 | 0.50 | 0.50 | 0.00 | 0.50 |
| 4 | 1.00 | 0.50 | 0.50 | 1.00 |
| 5 | 0.50 | 0.50 | 0.00 | 0.50 |
| 6 | 0.00 | 0.50 | −0.50 | 0.00 |
| 7 | 0.50 | 0.50 | 0.00 | 0.50 |
| **sum** | **4** | **4** | **0** | **4** |

> [!key] Why a sweep gives clean answers
> Take two whole-cycle waves with j and k cycles. Their product is half a wave with j − k cycles plus half a wave with j + k cycles. A whole-cycle wave sums to 0, unless its number of cycles is 0 or a multiple of N. So the score is 0, unless j = k or j + k = N.

The case j + k = N explains row 7 of the table. The signal part has j = 1 and the probe has k = 7. Then j + k = 8 = N. The "sum wave" makes 8 cycles over 8 samples, so it is 1 at every sample. This half gives N/2 = 4. That is the mirror of section 4.

The same three steps work for the other products. They use two more rules from the same angle-sum formulas: $\sin a \cos b = \tfrac{1}{2}\sin(a+b) + \tfrac{1}{2}\sin(a-b)$ and $\sin a \sin b = \tfrac{1}{2}\cos(a-b) - \tfrac{1}{2}\cos(a+b)$.

### Between the whole numbers

The video slides the probe frequency smoothly from 0 to 4. For a frequency such as k = 1.5, the probe does not make a whole number of cycles. Step 1 fails, and the score is not clean. The graph in section 9 shows the full curve:

1. At the whole numbers, the scores are exactly 0, 4, 0, 0, 0.
2. Between them, the curve is not 0. For example, it is about −0.32 near k = 2.6.
3. The highest point of the curve is about 4.06, near k ≈ 1.07. It is a little away from k = 1.

So only the whole-number probes give clean answers. Lesson [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) shows the same effect from the other side: a signal that does not make whole cycles spreads into many bins.

## 7. The k = 2 puzzle

The teaching signal contains a 2-cycle part: $0.5\sin(2\pi \cdot 2n/8)$. But its cosine score at k = 2 is 0. Two separate effects give this 0.

1. **The 1-cycle cosine part cancels.** Its frequency is different from the probe frequency. By section 6, its score is 0. Row 2 of the sweep table shows its products: 1 at n = 0 and −1 at n = 4.
2. **The 2-cycle sine part is invisible to the cosine probe.** Every product is 0:

| n | 0.5·sin(2π·2n/8) | cos(2π·2n/8) | product |
|---|---|---|---|
| 0 | 0.00 | 1.00 | 0.00 |
| 1 | 0.50 | 0.00 | 0.00 |
| 2 | 0.00 | −1.00 | 0.00 |
| 3 | −0.50 | 0.00 | 0.00 |
| 4 | 0.00 | 1.00 | 0.00 |
| 5 | 0.50 | 0.00 | 0.00 |
| 6 | 0.00 | −1.00 | 0.00 |
| 7 | −0.50 | 0.00 | 0.00 |
| **sum** | | | **0** |

At each sample, one of the two values is 0. The sine is 0 where the cosine has its peaks. The cosine is 0 where the sine has its peaks. The sine is a quarter cycle (90°) behind the cosine.

The rule from section 6 gives the same result for any N: $\sin a \cos a = \tfrac{1}{2}\sin(2a)$. That is a whole-cycle wave with 2k cycles, so it sums to 0.

> [!trap] A cosine probe is blind to a sine at its own frequency
> A cosine score of 0 does not prove that the frequency is absent. The component can be a sine: a quarter cycle out of step with the probe.

## 8. The sine sweep

Now repeat the sweep with the sine probes $s_k[n] = \sin(2\pi k n/8)$:

| k | n = 0 | n = 1 | n = 2 | n = 3 | n = 4 | n = 5 | n = 6 | n = 7 | score |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | **0** |
| 1 | 0.00 | 0.85 | 0.00 | −0.85 | 0.00 | 0.15 | 0.00 | −0.15 | **0** |
| 2 | 0.00 | 1.21 | 0.00 | 1.21 | 0.00 | −0.21 | 0.00 | −0.21 | **2** |
| 3 | 0.00 | 0.85 | 0.00 | −0.85 | 0.00 | 0.15 | 0.00 | −0.15 | **0** |
| 4 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | **0** |
| 5 | 0.00 | −0.85 | 0.00 | 0.85 | 0.00 | −0.15 | 0.00 | 0.15 | **0** |
| 6 | 0.00 | −1.21 | 0.00 | −1.21 | 0.00 | 0.21 | 0.00 | 0.21 | **−2** |
| 7 | 0.00 | −0.85 | 0.00 | 0.85 | 0.00 | −0.15 | 0.00 | 0.15 | **0** |

So the sine scores are S = [0, 0, 2, 0, 0, 0, −2, 0].

1. **k = 2.** The score is 2. The sine probe finds the part that the cosine probe missed. The score is $0.5 \times \sum \sin^2 = 0.5 \times 4 = 2$, that is, amplitude × N/2.
2. **k = 6.** The score is −2, because $s_6 = -s_2$ (section 4).
3. **k = 0 and k = 4.** The sine probe is all zeros: $\sin(0) = 0$ and $\sin(\pi n) = 0$. It cannot detect anything. For these two frequencies, the cosine probe alone is enough.

### Two scores catch a wave at any phase

Any wave at probe frequency k can start at any point of its cycle. Write it as $A\cos(\theta_n + \varphi)$, with $\theta_n = 2\pi k n/N$ and phase $\varphi$ ([L4](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase)). The angle-sum formula splits it into a cosine part and a sine part:

$$
A\cos(\theta_n + \varphi) = A\cos\varphi \cdot \cos\theta_n - A\sin\varphi \cdot \sin\theta_n
$$

The cosine probe sees only the first part, and the sine probe sees only the second part. For 0 < k < N/2, each probe adds a factor N/2:

$$
C[k] = A\cos\varphi \cdot \frac{N}{2} \qquad S[k] = -A\sin\varphi \cdot \frac{N}{2}
$$

These are four waves at k = 2 with N = 8, computed with NumPy. All four have amplitude 0.5. Only the phase changes.

| wave | phase $\varphi$ | C[2] | S[2] |
|---|---|---|---|
| $0.5\cos\theta_n$ | 0° | 2 | 0 |
| $0.5\sin\theta_n = 0.5\cos(\theta_n - 90°)$ | −90° | 0 | 2 |
| $0.5\cos(\theta_n - 45°)$ | −45° | 1.41 | 1.41 |
| $-0.5\cos\theta_n = 0.5\cos(\theta_n + 180°)$ | 180° | −2 | 0 |

A single cosine probe sees 2, 0, 1.41 or −2 for the same amount of wave. The pair (C, S) always holds the full information: $\sqrt{C^2 + S^2} = 2$ in every row. For example, $\sqrt{1.41^2 + 1.41^2} = 2$ when we use the exact value $\sqrt{2}$ for 1.41.

> [!key] One frequency needs two probes
> A cosine probe and a sine probe together catch a wave at any phase. Lesson [L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe) joins the two probes into one complex probe.

## 9. Graphs

The k = 2 cosine probe has its peaks where the 2-cycle sine part is 0. The score is 0:

```plot
{
  "title": "Teaching signal x[n] (blue) and the k = 2 cosine probe (gold). Score 0.",
  "xAxis": {"label": "sample number n", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "value", "domain": [-1.6, 1.6]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 1.0], [1.0, 1.2071], [2.0, 0.0], [3.0, -1.2071], [4.0, -1.0], [5.0, -0.2071], [6.0, 0.0], [7.0, 0.2071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 1.2071], [2.0, 0.0], [3.0, -1.2071], [4.0, -1.0], [5.0, -0.2071], [6.0, 0.0], [7.0, 0.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 0.0], [2.0, -1.0], [3.0, 0.0], [4.0, 1.0], [5.0, 0.0], [6.0, -1.0], [7.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 0.0], [2.0, -1.0], [3.0, 0.0], [4.0, 1.0], [5.0, 0.0], [6.0, -1.0], [7.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true}
  ]
}
```

The k = 2 sine probe has the same sign as the 2-cycle part of the signal. The score is 2:

```plot
{
  "title": "Teaching signal x[n] (blue) and the k = 2 sine probe (gold). Score 2.",
  "xAxis": {"label": "sample number n", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "value", "domain": [-1.6, 1.6]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 1.0], [1.0, 1.2071], [2.0, 0.0], [3.0, -1.2071], [4.0, -1.0], [5.0, -0.2071], [6.0, 0.0], [7.0, 0.2071]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0.0, 1.0], [1.0, 1.2071], [2.0, 0.0], [3.0, -1.2071], [4.0, -1.0], [5.0, -0.2071], [6.0, 0.0], [7.0, 0.2071]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 1.0], [2.0, 0.0], [3.0, -1.0], [4.0, 0.0], [5.0, 1.0], [6.0, 0.0], [7.0, -1.0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 1.0], [2.0, 0.0], [3.0, -1.0], [4.0, 0.0], [5.0, 1.0], [6.0, 0.0], [7.0, -1.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true}
  ]
}
```

The results of both sweeps. Bins 6 and 7 repeat bins 2 and 1, with a sign change for the sine:

```plot
{
  "title": "Sweep results: cosine scores (gold) and sine scores (ink) for k = 0 to 7",
  "xAxis": {"label": "probe frequency k (cycles in 8 samples)", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "score", "domain": [-3, 5]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 0.0], [1.0, 4.0], [2.0, 0.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 0.0], [7.0, 4.0]], "fnType": "points", "graphType": "polyline", "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 4.0], [2.0, 0.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 0.0], [7.0, 4.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.0], [2.0, 2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, -2.0], [7.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.0], [2.0, 2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, -2.0], [7.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

The cosine score for every probe frequency from 0 to 4, as in the video. Only the whole numbers (gold) give clean values:

```plot
{
  "title": "Cosine score for every probe frequency from 0 to 4 (ink). Whole-number k (gold).",
  "xAxis": {"label": "probe frequency k", "domain": [-0.2, 4.2]},
  "yAxis": {"label": "cosine score", "domain": [-1, 5]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 0.0], [0.025, 0.004], [0.05, 0.016], [0.075, 0.0359], [0.1, 0.0638], [0.125, 0.0997], [0.15, 0.1436], [0.175, 0.1955], [0.2, 0.2553], [0.225, 0.323], [0.25, 0.3985], [0.275, 0.4817], [0.3, 0.5726], [0.325, 0.6708], [0.35, 0.7763], [0.375, 0.8887], [0.4, 1.0078], [0.425, 1.133], [0.45, 1.264], [0.475, 1.4003], [0.5, 1.5412], [0.525, 1.6861], [0.55, 1.8344], [0.575, 1.9852], [0.6, 2.1376], [0.625, 2.2908], [0.65, 2.4439], [0.675, 2.5958], [0.7, 2.7456], [0.725, 2.8921], [0.75, 3.0343], [0.775, 3.1712], [0.8, 3.3017], [0.825, 3.4247], [0.85, 3.5393], [0.875, 3.6445], [0.9, 3.7393], [0.925, 3.823], [0.95, 3.8948], [0.975, 3.954], [1.0, 4.0], [1.025, 4.0324], [1.05, 4.0508], [1.075, 4.055], [1.1, 4.0449], [1.125, 4.0205], [1.15, 3.9819], [1.175, 3.9295], [1.2, 3.8635], [1.225, 3.7847], [1.25, 3.6935], [1.275, 3.5907], [1.3, 3.4771], [1.325, 3.3538], [1.35, 3.2216], [1.375, 3.0817], [1.4, 2.9352], [1.425, 2.7833], [1.45, 2.627], [1.475, 2.4677], [1.5, 2.3066], [1.525, 2.1447], [1.55, 1.9832], [1.575, 1.8233], [1.6, 1.6659], [1.625, 1.5121], [1.65, 1.3626], [1.675, 1.2184], [1.7, 1.0802], [1.725, 0.9484], [1.75, 0.8237], [1.775, 0.7064], [1.8, 0.5969], [1.825, 0.4952], [1.85, 0.4015], [1.875, 0.3158], [1.9, 0.238], [1.925, 0.1678], [1.95, 0.105], [1.975, 0.0492], [2.0, 0.0], [2.025, -0.043], [2.05, -0.0803], [2.075, -0.1125], [2.1, -0.1401], [2.125, -0.1636], [2.15, -0.1835], [2.175, -0.2005], [2.2, -0.2149], [2.225, -0.2272], [2.25, -0.2379], [2.275, -0.2473], [2.3, -0.2557], [2.325, -0.2634], [2.35, -0.2706], [2.375, -0.2774], [2.4, -0.2839], [2.425, -0.2902], [2.45, -0.2961], [2.475, -0.3016], [2.5, -0.3066], [2.525, -0.3108], [2.55, -0.3142], [2.575, -0.3164], [2.6, -0.3172], [2.625, -0.3164], [2.65, -0.3136], [2.675, -0.3088], [2.7, -0.3016], [2.725, -0.2918], [2.75, -0.2792], [2.775, -0.2638], [2.8, -0.2455], [2.825, -0.2242], [2.85, -0.1999], [2.875, -0.1727], [2.9, -0.1428], [2.925, -0.1103], [2.95, -0.0754], [2.975, -0.0386], [3.0, 0.0], [3.025, 0.0399], [3.05, 0.0806], [3.075, 0.1217], [3.1, 0.1628], [3.125, 0.2033], [3.15, 0.2427], [3.175, 0.2805], [3.2, 0.3163], [3.225, 0.3496], [3.25, 0.3799], [3.275, 0.4068], [3.3, 0.43], [3.325, 0.4492], [3.35, 0.4641], [3.375, 0.4745], [3.4, 0.4804], [3.425, 0.4817], [3.45, 0.4785], [3.475, 0.4708], [3.5, 0.4588], [3.525, 0.4428], [3.55, 0.4231], [3.575, 0.4001], [3.6, 0.3742], [3.625, 0.3459], [3.65, 0.3157], [3.675, 0.2842], [3.7, 0.2519], [3.725, 0.2194], [3.75, 0.1873], [3.775, 0.1562], [3.8, 0.1267], [3.825, 0.0992], [3.85, 0.0744], [3.875, 0.0525], [3.9, 0.0341], [3.925, 0.0194], [3.95, 0.0087], [3.975, 0.0022], [4.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 4.0], [2.0, 0.0], [3.0, 0.0], [4.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#B8860B", "skipTip": true}
  ]
}
```

## 10. Video

Watch the 3-cycle probe. Its positive and negative products cancel exactly.

```video
{
  "src": "/notes/media/fft-signal-processing/course/03_Fourier_Analysis_as_Matching.mp4",
  "start": "0:33",
  "end": "0:43",
  "caption": "A 3-cycle probe: the products cancel, and the score is 0."
}
```

Watch the sweep. Note where the score is large and where it is 0.

```video
{
  "src": "/notes/media/fft-signal-processing/course/03_Fourier_Analysis_as_Matching.mp4",
  "start": "0:43",
  "end": "0:58",
  "caption": "The probe frequency slides from 0 to 4 cycles. The graph records the score at each frequency."
}
```

Watch the k = 2 puzzle and its solution: the sine probe.

```video
{
  "src": "/notes/media/fft-signal-processing/course/03_Fourier_Analysis_as_Matching.mp4",
  "start": "0:58",
  "end": "1:25",
  "caption": "The cosine probe scores 0 at k = 2. The sine probe scores 2."
}
```

Watch the last part. It names the inner product, and it shows that every sample contributes to the score.

```video
{
  "src": "/notes/media/fft-signal-processing/course/03_Fourier_Analysis_as_Matching.mp4",
  "start": "1:25",
  "end": "1:40",
  "caption": "Multiply-and-add is an inner product. A score summarizes all the samples."
}
```

## 11. Code

Use your `matching_score` from L7. Write two functions:

1. `cosine_sweep(x)` returns a NumPy array of N cosine scores, for k = 0 to N − 1.
2. `sine_sweep(x)` returns a NumPy array of N sine scores, for k = 0 to N − 1.

Acceptance tests, with the teaching signal `x` of L7:

1. `np.allclose(cosine_sweep(x), [0, 4, 0, 0, 0, 0, 0, 4])` is True.
2. `np.allclose(sine_sweep(x), [0, 0, 2, 0, 0, 0, -2, 0])` is True.
3. For a random real `r` of length 16, `cosine_sweep(r)[k]` equals `cosine_sweep(r)[16 - k]` for k = 1 to 15 (use `np.isclose`).
4. For the same `r`, `sine_sweep(r)[k]` equals `-sine_sweep(r)[16 - k]` for k = 1 to 15.
5. For a random real `r` of length 16, `np.allclose(cosine_sweep(r) - 1j * sine_sweep(r), np.fft.fft(r))` is True. Lesson L10 explains this test.

Extra: compute the cosine score for 401 probe frequencies `np.linspace(0, 4, 401)` and plot the curve. Find the k of its highest point. It is near 1.07, not exactly 1.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation)

```check
{
  "question": "Stuck on the sweep functions? Use the hint first.",
  "hint": "Each function is one loop over k. For each k, make the probe with N samples, then call `matching_score`.",
  "answer": "Idea: N = len(x) and n = 0 … N − 1. For each k from 0 to N − 1, make the probe cos(2πkn/N) (or sin for the sine sweep). Store its matching score at position k of a result array. Return the array."
}
```

## 12. Common mistakes

1. **Only cosine probes.** A cosine probe misses a sine at its own frequency. Use a cosine probe and a sine probe for each k.
2. **"A score of 0 means that the frequency is absent."** A cosine score of 0 at k = 2 hides a sine with amplitude 0.5. Check the sine score too.
3. **Probe frequencies that are not whole numbers.** Between the whole numbers the scores do not cancel cleanly. The DFT uses only k = 0 to N − 1.
4. **A sweep past N − 1.** The probe with k = N has the same samples as the probe with k = 0. It adds no information.
5. **Bin 7 as a separate 7-cycle wave.** For a real signal, the score at N − k repeats the score at k. The teaching signal has no 7-cycle part.

## 13. One-minute explanation

We do not know which frequencies a signal holds, so we sweep: we score the signal against probes with k = 0, 1, …, N − 1 cycles. The product of two whole-cycle waves is half a wave at the difference frequency plus half a wave at the sum frequency. A whole-cycle wave sums to 0 over the N samples. So the score is 0 for every probe that does not match, and it is N/2 times the amplitude for the probe that matches. For the teaching signal, the cosine sweep gives 4 at k = 1 and 0 at k = 2, although a 2-cycle sine is present. The cosine probe is blind to a sine at its own frequency, because the two are a quarter cycle apart. The sine sweep finds it: score 2 at k = 2. So each frequency needs two probes, a cosine and a sine.

## 14. Check questions

```check
{
  "question": "What is a sweep? Which probe frequencies does the DFT sweep over for N = 8, and why does it stop there?",
  "hint": "Try the probe with k = 8 at a few samples.",
  "answer": "A sweep computes the matching score for one probe frequency after another. For N = 8 the DFT uses k = 0, 1, …, 7. The probe with k = 8 has cos(2π·8n/8) = cos(2πn) = 1 at every sample, which is the same list as k = 0. So the probes repeat after N − 1."
}
```

```check
{
  "question": "y = [0, 1, 0, −1, 0, 1, 0, −1] is a sine with 2 cycles and amplitude 1. Compute its score against the k = 2 cosine probe [1, 0, −1, 0, 1, 0, −1, 0]. Then compute its score against the k = 2 sine probe [0, 1, 0, −1, 0, 1, 0, −1].",
  "hint": "In the cosine case, one of the two values is 0 at every sample.",
  "answer": "Cosine probe: every product is 0 (y is 0 where the probe is ±1, and the probe is 0 where y is ±1). Score 0. Sine probe: the products are 0, 1, 0, 1, 0, 1, 0, 1. Score 4 = amplitude 1 × N/2."
}
```

```check
{
  "question": "Use the product-to-sum rule to explain why the 1-cycle cosine part of the teaching signal scores 0 against the 3-cycle cosine probe.",
  "hint": "Write cos a · cos b as two halves. Count the cycles of each half.",
  "answer": "cos a · cos b = ½cos(a − b) + ½cos(a + b). With 1 and 3 cycles, the halves make 2 cycles and 4 cycles over the 8 samples. Each is a whole-cycle wave with a number of cycles that is not 0 and not a multiple of 8. So each half sums to 0, and the score is exactly 0."
}
```

```check
{
  "question": "Without a table, predict the cosine sweep and the sine sweep of z[n] = cos(2π·3n/8), N = 8.",
  "hint": "Score 0 unless j = k or j + k = N. The cosine part has j = 3.",
  "answer": "Cosine sweep: 4 at k = 3 (j = k, so N/2 × amplitude 1 = 4) and 4 at k = 5 (j + k = 8). All other cosine scores are 0: C = [0, 0, 0, 4, 0, 4, 0, 0]. Sine sweep: all 0, because z is a pure cosine (phase 0, so S = −A·sin 0 · N/2 = 0)."
}
```

```check
{
  "question": "A signal is w[n] = −2·cos(2π·2n/8). What is its cosine score at k = 2? What does the sign tell you?",
  "hint": "The score is linear. Use the score of cos against itself.",
  "answer": "The score of cos(2π·2n/8) against itself is N/2 = 4. So the score of −2 times it is −2 × 4 = −8. The negative sign says that the wave is upside down compared with the probe: its phase is 180°."
}
```

```check
{
  "question": "A wave at k = 2 with N = 8 has cosine score 1.41 and sine score 1.41. What are its amplitude and its phase?",
  "hint": "Use C = A·cos φ·N/2 and S = −A·sin φ·N/2.",
  "answer": "√(C² + S²) = √(1.41² + 1.41²) = 2 (exactly 2 with √2). So A·N/2 = 2 and A = 2 × 2/8 = 0.5. Then cos φ = 1.41/2 = 0.71 and sin φ = −1.41/2 = −0.71, so φ = −45°. The wave is 0.5·cos(θ − 45°)."
}
```

## 15. Links

- Previous lesson: [L7: The matching score](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score)
- Next lesson: [L9: Basis and orthogonality](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality)
- Part: [03 Matching to DFT](/notes/maths/fft-signal-processing/03-matching-to-dft)
- Phase: [L4: Phase](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase)
- The general proof of step 1: [F7: Roots of unity](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity)
- Later: [L10: The complex probe](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe), [L24: The mirror](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror), [L25: Leakage and windows](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
