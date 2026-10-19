---
title: "L21: Why the FFT is fast"
order: 8
summary: "Solve T(N) = 2T(N/2) + cN step by step to get N·log₂N, compare the counts with N², and show that the FFT gives the same answer up to rounding."
status: not-started
tags: [fft, complexity, recurrence, rounding, numerical-accuracy]
---

## 1. The question this idea answers

Lesson [L18](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network) counted 12 butterflies for N = 8, against 64 multiplications for the direct DFT. How does this gap grow when N grows? Why is the FFT count exactly $(N/2)\log_2 N$? And is the faster answer as good as the slow one?

This lesson answers the three questions. First it counts the work stage by stage. Then it derives the same count from a recurrence, step by step. Last, it measures the difference between the FFT and the direct DFT for N = 1024.

## 2. Mental model

> [!analogy] Cut a stack of pages in half, again and again
> Take a stack of N pages. Cut it into two halves, then cut each half again, until each pile has one page. Each round of cuts touches every page once, so each round costs about N work. The number of rounds is the number of halvings from N to 1, which is $\log_2 N$. So the total is about $N \log_2 N$.
>
> **Where it stops working:** the FFT does its N work in the butterflies, when it joins the halves again, not in the cuts. Also, the count includes arithmetic only. It ignores memory traffic and the Python overhead of lesson L19, which can dominate the real time.

## 3. Terms

| Term | Plain meaning |
|---|---|
| recurrence | A formula that gives the cost of a problem of size N from the cost of smaller problems. |
| unroll | Replace the cost of the smaller problem by its own formula, again and again, until the base case. |
| level | One layer of the recursion. Level j has $2^j$ problems of size $N/2^j$. |
| $\log_2 N$ | The number of halvings from N to 1. $\log_2 8 = 3$ and $\log_2 1024 = 10$. |
| O(N log N) | "Grows like N log N": for large N, the work is at most a constant times $N\log N$. |
| speed-up ratio | The direct count divided by the FFT count. |
| floating-point number | The way a computer stores a real number: about 16 significant decimal digits in NumPy's default `float64`. |
| rounding error | The small error that each floating-point operation can add, because the exact result has more digits than the format holds. |
| maximum absolute error | The largest $\lvert a_k - b_k \rvert$ over all k, for two arrays a and b. |

## 4. Count the work stage by stage

Lesson L18 found the shape of the network:

1. There are $\log_2 N$ stages, because each stage doubles the DFT size from 1 to N.
2. Each stage has N/2 butterflies, because each butterfly writes 2 of the N values.
3. Each butterfly does 1 complex multiplication, 1 addition and 1 subtraction.

So the radix-2 FFT does

$$
\underbrace{\frac{N}{2} \log_2 N}_{\text{multiplications}} \qquad \text{and} \qquad \underbrace{N \log_2 N}_{\text{additions and subtractions}}.
$$

For N = 8: 4 × 3 = 12 multiplications and 8 × 3 = 24 additions and subtractions.

## 5. The recurrence, step by step

The recursive FFT of lesson [L19](/notes/maths/fft-signal-processing/04-fft/l19-recursive-fft-code) gives the same count by a second route. Let T(N) be the work for a DFT of size N.

$$
T(N) = 2\,T(N/2) + cN, \qquad T(1) = 0.
$$

1. $2\,T(N/2)$: two recursive calls, one on the even half and one on the odd half.
2. $cN$: the combining step. It does N/2 butterflies. Count multiplications with c = 1/2 (one per butterfly). Count additions and subtractions with c = 1 (two per butterfly).
3. $T(1) = 0$: a 1-point DFT is the sample. It needs no arithmetic.

### 5.1 Unroll it

Replace $T(N/2)$ by its own formula, $T(N/2) = 2\,T(N/4) + cN/2$:

$$
T(N) = 2\left[2\,T(N/4) + c\frac{N}{2}\right] + cN = 4\,T(N/4) + 2cN.
$$

Do it again with $T(N/4) = 2\,T(N/8) + cN/4$:

$$
T(N) = 4\left[2\,T(N/8) + c\frac{N}{4}\right] + 2cN = 8\,T(N/8) + 3cN.
$$

A pattern appears. After j steps:

$$
T(N) = 2^{j}\, T\!\left(\frac{N}{2^{j}}\right) + j\,cN.
$$

Stop when the size reaches 1: $N/2^j = 1$, so $2^j = N$ and $j = \log_2 N$. Then

$$
T(N) = N \cdot T(1) + cN\log_2 N = cN\log_2 N.
$$

> [!example] Worked example: the levels for N = 8 (c = 1)
> | level j | problems $2^j$ | size $N/2^j$ | combine work per problem | work in the level |
> |---|---|---|---|---|
> | 0 | 1 | 8 | 8 | 8 |
> | 1 | 2 | 4 | 4 | 8 |
> | 2 | 4 | 2 | 2 | 8 |
> | 3 | 8 | 1 | 0 (base case) | 0 |
>
> Total: 8 + 8 + 8 = 24 = 8 × 3. Every level with a combine step does the same work N. There are $\log_2 8 = 3$ such levels.

### 5.2 Check the result in two ways

**Numbers.** With c = 1/2 (multiplications):

1. $T(2) = 2\,T(1) + 1 = 0 + 1 = 1$.
2. $T(4) = 2\,T(2) + 2 = 2 + 2 = 4$.
3. $T(8) = 2\,T(4) + 4 = 8 + 4 = 12$.

The formula gives $(8/2) \log_2 8 = 4 \times 3 = 12$. The two agree.

**Substitution.** Put $T(N) = cN\log_2 N$ into the right side of the recurrence. Use $\log_2(N/2) = \log_2 N - 1$:

$$
2 \cdot c\,\frac{N}{2}\,\log_2\frac{N}{2} + cN = cN(\log_2 N - 1) + cN = cN\log_2 N.
$$

The right side equals the left side, so the formula solves the recurrence.

> [!key] Why N log N
> Each level of the recursion does about N work in total. Halving N until it reaches 1 takes $\log_2 N$ levels. So the FFT does about $N \log_2 N$ work, against $N^2$ for the direct DFT.

In O notation, the FFT is O(N log N) and the direct DFT is O(N²). The notation drops constant factors, so the base of the logarithm does not matter there: $\log_2 N = \ln N / \ln 2$. The exact counts on this page use $\log_2$.

## 6. The operation counts

The course compares $N^2$ with $N\log_2 N$. The exact number of FFT multiplications is half of $N\log_2 N$.

| N | $\log_2 N$ | direct $N^2$ | FFT $N\log_2 N$ | ratio $N/\log_2 N$ | FFT multiplications $(N/2)\log_2 N$ | ratio $2N/\log_2 N$ |
|---|---|---|---|---|---|---|
| 8 | 3 | 64 | 24 | 2.67 | 12 | 5.33 |
| 16 | 4 | 256 | 64 | 4 | 32 | 8 |
| 64 | 6 | 4,096 | 384 | 10.67 | 192 | 21.33 |
| 1024 | 10 | 1,048,576 | 10,240 | 102.4 | 5,120 | 204.8 |

The ratios divide the two counts. For example, $N^2 / (N\log_2 N) = N/\log_2 N$, and for N = 1024 this is 1024/10 = 102.4.

The ratio grows almost as fast as N. Double N from 1024 to 2048:

1. Direct: $2048^2 = 4{,}194{,}304$, which is 4 times more.
2. FFT: $2048 \times 11 = 22{,}528$ against $1024 \times 10 = 10{,}240$, which is only 2.2 times more. The network gets one more stage.

> [!trap] The counts are not times
> The table counts operations. Real time also depends on memory, caches, the language and the library. One run for these notes compared a direct DFT, written as one NumPy matrix product, with the recursive Python FFT of lesson L19. For N ≤ 256, the direct DFT was faster (for N = 256: about 1.7 ms against 2.1 ms). For N = 1024, the FFT won by about 6 times (about 5.5 ms against 35 ms). The O(N log N) advantage wins only when N is large enough.

## 7. Graphs

Both curves on the same axes, for N from 1 to 64. The dots mark the powers of 2. At N = 64, the direct DFT needs 4,096 multiplications and the FFT needs 192.

```plot
{
  "title": "Multiplications: N² (red) and (N/2)·log₂N (ink)",
  "xAxis": {"label": "N", "domain": [0, 66]},
  "yAxis": {"label": "complex multiplications", "domain": [0, 4200]},
  "disableZoom": true,
  "data": [
    {"points": [[1.0, 1.0], [2.0, 4.0], [3.0, 9.0], [4.0, 16.0], [5.0, 25.0], [6.0, 36.0], [7.0, 49.0], [8.0, 64.0], [9.0, 81.0], [10.0, 100.0], [11.0, 121.0], [12.0, 144.0], [13.0, 169.0], [14.0, 196.0], [15.0, 225.0], [16.0, 256.0], [17.0, 289.0], [18.0, 324.0], [19.0, 361.0], [20.0, 400.0], [21.0, 441.0], [22.0, 484.0], [23.0, 529.0], [24.0, 576.0], [25.0, 625.0], [26.0, 676.0], [27.0, 729.0], [28.0, 784.0], [29.0, 841.0], [30.0, 900.0], [31.0, 961.0], [32.0, 1024.0], [33.0, 1089.0], [34.0, 1156.0], [35.0, 1225.0], [36.0, 1296.0], [37.0, 1369.0], [38.0, 1444.0], [39.0, 1521.0], [40.0, 1600.0], [41.0, 1681.0], [42.0, 1764.0], [43.0, 1849.0], [44.0, 1936.0], [45.0, 2025.0], [46.0, 2116.0], [47.0, 2209.0], [48.0, 2304.0], [49.0, 2401.0], [50.0, 2500.0], [51.0, 2601.0], [52.0, 2704.0], [53.0, 2809.0], [54.0, 2916.0], [55.0, 3025.0], [56.0, 3136.0], [57.0, 3249.0], [58.0, 3364.0], [59.0, 3481.0], [60.0, 3600.0], [61.0, 3721.0], [62.0, 3844.0], [63.0, 3969.0], [64.0, 4096.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[2.0, 4.0], [4.0, 16.0], [8.0, 64.0], [16.0, 256.0], [32.0, 1024.0], [64.0, 4096.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true},
    {"points": [[1.0, 0.0], [2.0, 1.0], [3.0, 2.3774], [4.0, 4.0], [5.0, 5.8048], [6.0, 7.7549], [7.0, 9.8257], [8.0, 12.0], [9.0, 14.2647], [10.0, 16.6096], [11.0, 19.0269], [12.0, 21.5098], [13.0, 24.0529], [14.0, 26.6515], [15.0, 29.3017], [16.0, 32.0], [17.0, 34.7434], [18.0, 37.5293], [19.0, 40.3553], [20.0, 43.2193], [21.0, 46.1193], [22.0, 49.0537], [23.0, 52.021], [24.0, 55.0196], [25.0, 58.0482], [26.0, 61.1057], [27.0, 64.191], [28.0, 67.303], [29.0, 70.4407], [30.0, 73.6034], [31.0, 76.79], [32.0, 80.0], [33.0, 83.2325], [34.0, 86.4869], [35.0, 89.7625], [36.0, 93.0587], [37.0, 96.3749], [38.0, 99.7106], [39.0, 103.0653], [40.0, 106.4386], [41.0, 109.8298], [42.0, 113.2387], [43.0, 116.6647], [44.0, 120.1075], [45.0, 123.5667], [46.0, 127.0419], [47.0, 130.5328], [48.0, 134.0391], [49.0, 137.5604], [50.0, 141.0964], [51.0, 144.6468], [52.0, 148.2114], [53.0, 151.7899], [54.0, 155.382], [55.0, 158.9874], [56.0, 162.6059], [57.0, 166.2374], [58.0, 169.8814], [59.0, 173.538], [60.0, 177.2067], [61.0, 180.8875], [62.0, 184.5801], [63.0, 188.2843], [64.0, 192.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[2.0, 1.0], [4.0, 4.0], [8.0, 12.0], [16.0, 32.0], [32.0, 80.0], [64.0, 192.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

A zoom on the bottom of the same graph. The red curve leaves the window near N = 18, but the ink curve stays below 200.

```plot
{
  "title": "Zoom: N² (red) and (N/2)·log₂N (ink)",
  "xAxis": {"label": "N", "domain": [0, 66]},
  "yAxis": {"label": "complex multiplications", "domain": [0, 320]},
  "disableZoom": true,
  "data": [
    {"points": [[1.0, 1.0], [2.0, 4.0], [3.0, 9.0], [4.0, 16.0], [5.0, 25.0], [6.0, 36.0], [7.0, 49.0], [8.0, 64.0], [9.0, 81.0], [10.0, 100.0], [11.0, 121.0], [12.0, 144.0], [13.0, 169.0], [14.0, 196.0], [15.0, 225.0], [16.0, 256.0], [17.0, 289.0], [18.0, 324.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[2.0, 4.0], [4.0, 16.0], [8.0, 64.0], [16.0, 256.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true},
    {"points": [[1.0, 0.0], [2.0, 1.0], [3.0, 2.3774], [4.0, 4.0], [5.0, 5.8048], [6.0, 7.7549], [7.0, 9.8257], [8.0, 12.0], [9.0, 14.2647], [10.0, 16.6096], [11.0, 19.0269], [12.0, 21.5098], [13.0, 24.0529], [14.0, 26.6515], [15.0, 29.3017], [16.0, 32.0], [17.0, 34.7434], [18.0, 37.5293], [19.0, 40.3553], [20.0, 43.2193], [21.0, 46.1193], [22.0, 49.0537], [23.0, 52.021], [24.0, 55.0196], [25.0, 58.0482], [26.0, 61.1057], [27.0, 64.191], [28.0, 67.303], [29.0, 70.4407], [30.0, 73.6034], [31.0, 76.79], [32.0, 80.0], [33.0, 83.2325], [34.0, 86.4869], [35.0, 89.7625], [36.0, 93.0587], [37.0, 96.3749], [38.0, 99.7106], [39.0, 103.0653], [40.0, 106.4386], [41.0, 109.8298], [42.0, 113.2387], [43.0, 116.6647], [44.0, 120.1075], [45.0, 123.5667], [46.0, 127.0419], [47.0, 130.5328], [48.0, 134.0391], [49.0, 137.5604], [50.0, 141.0964], [51.0, 144.6468], [52.0, 148.2114], [53.0, 151.7899], [54.0, 155.382], [55.0, 158.9874], [56.0, 162.6059], [57.0, 166.2374], [58.0, 169.8814], [59.0, 173.538], [60.0, 177.2067], [61.0, 180.8875], [62.0, 184.5801], [63.0, 188.2843], [64.0, 192.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[2.0, 1.0], [4.0, 4.0], [8.0, 12.0], [16.0, 32.0], [32.0, 80.0], [64.0, 192.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

The speed-up ratio in multiplications, $2N/\log_2 N$. It reaches 204.8 at N = 1024.

```plot
{
  "title": "Speed-up ratio 2N / log₂N (ink)",
  "xAxis": {"label": "N", "domain": [0, 1100]},
  "yAxis": {"label": "ratio", "domain": [0, 220]},
  "disableZoom": true,
  "data": [
    {"points": [[2.0, 4.0], [4.0, 4.0], [8.0, 5.3333], [16.0, 8.0], [32.0, 12.8], [64.0, 21.3333], [128.0, 36.5714], [256.0, 64.0], [512.0, 113.7778], [1024.0, 204.8]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[2.0, 4.0], [4.0, 4.0], [8.0, 5.3333], [16.0, 8.0], [32.0, 12.8], [64.0, 21.3333], [128.0, 36.5714], [256.0, 64.0], [512.0, 113.7778], [1024.0, 204.8]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true}
  ]
}
```

The area picture for N = 1024. The direct DFT fills a square of 1024 × 1024 cells. The FFT work $N\log_2 N$ fills a strip of 1024 × 10 cells: under 1% of the square.

```plot
{
  "title": "N = 1024: direct work (red square), FFT work (ink strip)",
  "xAxis": {"label": "N = 1024 columns", "domain": [-50, 1100]},
  "yAxis": {"label": "rows", "domain": [-50, 1100]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 0.0], [1024.0, 0.0], [1024.0, 1024.0], [0.0, 1024.0], [0.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[0.0, 0.0], [1024.0, 0.0], [1024.0, 10.0], [0.0, 10.0], [0.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true}
  ]
}
```

## 8. Same answer up to rounding

The FFT is not an approximation. Lessons L15 and L16 proved that $X[k] = E[k] + W_N^k O[k]$ is exact. So with exact arithmetic, the FFT and the direct DFT give identical values.

A computer does not use exact arithmetic. A `float64` number holds about 16 significant decimal digits. NumPy's machine epsilon is $2.2 \times 10^{-16}$: the gap between 1 and the next number that the format can store. Each multiplication and each addition can round the last digit. The two methods do different operations in a different order, so their rounding errors differ.

> [!example] Worked example: N = 1024, random input
> The test input is `x = np.random.default_rng(0).standard_normal(1024)`. The direct DFT is a double loop. The FFT is the recursive FFT of lesson L19.
>
> 1. Maximum absolute difference: $\max_k \lvert X_{\text{FFT}}[k] - X_{\text{direct}}[k] \rvert = 2.7 \times 10^{-11}$.
> 2. Largest output: $\max_k \lvert X[k] \rvert = 87.18$.
> 3. Relative difference: $2.7 \times 10^{-11} / 87.18 = 3.1 \times 10^{-13}$.
> 4. Matching significant digits: $\log_{10}(87.18 / 2.7 \times 10^{-11}) = 12.5$, so about 12 digits.
>
> The course video shows the same numbers: a maximum difference of about $2.7 \times 10^{-11}$ and about 12 matching significant digits.

The line that measures the difference:

```python
np.max(np.abs(fft_recursive(x) - my_dft(x)))
```

Which method holds the error? Compare both with a reference of higher precision. The reference is a direct sum in `np.longdouble`, with about 19 digits on the test machine.

| method | maximum absolute error against the reference |
|---|---|
| direct DFT, double loop | $2.7 \times 10^{-11}$ |
| direct DFT, one matrix product | $1.5 \times 10^{-11}$ |
| recursive FFT (lesson L19) | $4.8 \times 10^{-14}$ |
| `np.fft.fft` | $2.3 \times 10^{-14}$ |

In this test, almost all of the difference came from the direct DFT. Each direct output adds 1,024 rounded products. Each FFT output passes through only $\log_2 1024 = 10$ butterfly levels. So the FFT is faster, and here it was also more accurate.

## 9. Video

The first clip compares the shapes of the two computations. Watch the direct graph get 4 times denser when N doubles.

```video
{
  "src": "/notes/media/fft-signal-processing/course/10_Why_the_FFT_Is_Fast.mp4",
  "start": "0:00",
  "end": "0:20",
  "caption": "The direct DFT connects every input to every output. The FFT adds one orderly stage when N doubles."
}
```

The second clip shows the gap at N = 1024 and the area picture.

```video
{
  "src": "/notes/media/fft-signal-processing/course/10_Why_the_FFT_Is_Fast.mp4",
  "start": "0:20",
  "end": "0:34",
  "caption": "About a million operations against about ten thousand. Drawn to scale: a square and a thin strip."
}
```

The third clip explains the recurrence of section 5.

```video
{
  "src": "/notes/media/fft-signal-processing/course/10_Why_the_FFT_Is_Fast.mp4",
  "start": "0:34",
  "end": "0:58",
  "caption": "Two half-size FFTs plus one combining pass of about N work. log₂N levels of N work each."
}
```

The fourth clip runs both methods on 1024 random numbers.

```video
{
  "src": "/notes/media/fft-signal-processing/course/10_Why_the_FFT_Is_Fast.mp4",
  "start": "0:58",
  "end": "1:08",
  "caption": "The two results agree to about 12 significant digits. The difference is rounding, not a different result."
}
```

## 10. Code

Build these in a lab. Use your `my_dft(x)` (loop version) and your `fft_recursive(x)`.

1. **The formulas.** Write `fft_counts(N)`. It returns the direct multiplications $N^2$, the FFT multiplications $(N/2)\log_2 N$ and the FFT additions and subtractions $N\log_2 N$.
2. **Count in the code.** Copy `fft_recursive` to `fft_counted`. Add one counter for twiddle multiplications and one for additions and subtractions.
3. **Accuracy.** For N = 1024 and five random inputs, compute the maximum absolute difference between `fft_recursive(x)` and `my_dft(x)`.
4. **Timing.** Time `my_dft`, `fft_recursive` and `np.fft.fft` for N = 64, 128, 256, 512 and 1024. Plot the times against N on log–log axes.

Acceptance tests:

- `fft_counts(8)` gives (64, 12, 24). `fft_counts(1024)` gives (1048576, 5120, 10240).
- For every N = 2, 4, ..., 1024, the counters of `fft_counted` equal the formulas.
- In task 3, every difference is below $10^{-9}$. Expect a value near $10^{-11}$.
- In task 4, the line of `my_dft` has a slope near 2: double N, about 4 times the time. The line of `fft_recursive` has a slope near 1: double N, a little more than 2 times the time.
- The line of `np.fft.fft` is flatter at these sizes. A fixed cost for each call dominates its few microseconds of work.

One matplotlib call for log–log axes:

```python
plt.loglog(sizes, times, "o-")
```

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/04-fft/l21-why-it-is-fast)

```check
{
  "question": "Hint for `fft_counted`: where do the counters go?",
  "hint": "Hint level 1 (idea): only the combine step does arithmetic. The base case does none.",
  "answer": "Hint level 2 (pseudocode): in the combine step of a call of size N, add N/2 to the multiplication counter, one twiddle product per k. Add N to the addition counter, one sum and one difference per k. Keep the counters outside the function. Or return them with the result, and add the counts of the two recursive calls."
}
```

## 11. Common mistakes

1. **"N² seconds."** Both formulas count operations, not time.
2. **The wrong logarithm.** Use $\log_2$: $\log_2 1024 = 10$. With $\log_{10} 1024 \approx 3$, the count is wrong.
3. **Mixing the two FFT counts.** $N\log_2 N$ counts additions and subtractions (and the course uses it as the "work"). $(N/2)\log_2 N$ counts multiplications.
4. **"The FFT is approximate."** The FFT computes the same DFT. Only the rounding differs, and in the test above the FFT had the smaller error.
5. **"N log N is always faster."** For small N, overhead and memory can decide the time. The count wins for large N.

## 12. One-minute explanation

The FFT has $\log_2 N$ stages of N/2 butterflies, so it needs $(N/2)\log_2 N$ multiplications. The recurrence $T(N) = 2T(N/2) + cN$ gives the same count: every level of the recursion does about N work. Halving N until it reaches 1 takes $\log_2 N$ levels, so the total is about $N\log_2 N$. For N = 1024, that is 10,240 against 1,048,576 for the direct DFT: about 100 times less. Both methods give the same DFT, up to rounding. For 1024 random numbers they agree to about 12 significant digits, and the FFT had the smaller error.

## 13. Check questions

```check
{
  "question": "Compute $N\\log_2 N$ for N = 32. Then compute the ratio $N^2/(N\\log_2 N)$ for N = 64.",
  "hint": "$\\log_2 32 = 5$ and $\\log_2 64 = 6$.",
  "answer": "N = 32: 32 × 5 = 160. N = 64: $64^2 / (64 \\times 6) = 64/6 \\approx 10.7$."
}
```

```check
{
  "question": "Why does the recursion have $\\log_2 N$ levels with work?",
  "hint": "What happens to the size at each level?",
  "answer": "Each level halves the size of the problems. The sizes go N, N/2, N/4, ..., 2, then 1. Halving from N to 1 takes $\\log_2 N$ steps. The levels of size N down to size 2 each do a combine step. The level of size 1 is the base case and does no work."
}
```

```check
{
  "question": "Unroll $T(N) = 2T(N/2) + N/2$ with $T(1) = 0$ for N = 16. Show each step.",
  "hint": "Start from T(2) and work up: T(2), T(4), T(8), T(16).",
  "answer": "T(2) = 2·0 + 1 = 1. T(4) = 2·1 + 2 = 4. T(8) = 2·4 + 4 = 12. T(16) = 2·12 + 8 = 32. The formula gives $(16/2)\\log_2 16 = 8 \\times 4 = 32$."
}
```

```check
{
  "question": "N = 4096. How many multiplications do the direct DFT and the radix-2 FFT need? What is the speed-up ratio?",
  "hint": "$\\log_2 4096 = 12$.",
  "answer": "Direct: $4096^2 = 16{,}777{,}216$. FFT: $(4096/2) \\times 12 = 24{,}576$. Ratio: $16{,}777{,}216 / 24{,}576 \\approx 682.7$, which is also $2N/\\log_2 N = 8192/12$."
}
```

```check
{
  "question": "A colleague says: 'The FFT and my direct DFT differ by $2.7 \\times 10^{-11}$, so the FFT is an approximation.' What do you answer?",
  "hint": "Compare the difference with the size of the outputs and with 16 digits.",
  "answer": "The FFT computes exactly the same DFT. The derivation has no approximation. The difference comes from rounding: `float64` keeps about 16 digits, and the two methods round in different places. With outputs up to 87, a difference of $2.7 \\times 10^{-11}$ means about 12 matching digits. Against a higher-precision reference, the FFT error was $4.8 \\times 10^{-14}$ and the direct error $2.7 \\times 10^{-11}$, so the direct DFT held most of the error."
}
```

## 14. Links

- Previous: [L20: Iterative FFT and bugs](/notes/maths/fft-signal-processing/04-fft/l20-iterative-fft-and-bugs)
- Next: [L22: Other FFTs](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts)
- The N² count: [L14: The cost of the direct DFT](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft)
- The network and its stages: [L18: Recursion and the network](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network)
- Logarithms: [F8: Clock arithmetic, log₂ and binary](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary)
- [04 FFT](/notes/maths/fft-signal-processing/04-fft)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
