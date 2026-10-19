---
title: "L20: Iterative FFT and bugs"
order: 7
summary: "Compute the network of L18 in one array, stage by stage, with no recursion. Then find the bug in three broken versions from their symptoms."
status: not-started
tags: [fft, iterative, in-place, debugging, testing]
---

## 1. The question this idea answers

The recursive FFT of lesson [L19](/notes/maths/fft-signal-processing/04-fft/l19-recursive-fft-code) is a direct copy of the math. But it makes 2N − 1 function calls and a new array at every level. Real FFT code computes the network of lesson [L18](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network) directly: one array, a reorder, then one stage after another. This is the **iterative in-place FFT**.

The second question of this lesson is about bugs. An FFT can run with no error and still give wrong values. Simple test inputs often hide the bug. How do you find the wrong line from the symptom? This lesson gives three broken versions. Each one has one bug, and each bug leaves its own fingerprint in the output.

## 2. Mental model

> [!analogy] A shelf of 8 boxes
> Put the 8 values in 8 boxes on one shelf. First, swap some boxes, so that the values stand in bit-reversed order. Then work in rounds. In each round, take pairs of boxes, compute the sum and the difference, and put the two results into the same two boxes.
>
> **Where it stops working:** on a real shelf, you can keep the old contents of a box in your hand while you fill it. In memory, a write replaces the old value at once. So the code must save the top value before it writes the new top value.

## 3. Terms

| Term | Plain meaning |
|---|---|
| iterative | Done with loops, not with a function that calls itself. |
| in place | The method writes its results into the same array that holds its inputs. It needs no second array of size N. |
| bit-reversal permutation | The first step of the iterative FFT: swap the values so that row i holds the sample with index rev(i). |
| rev(i) | The index i with its $\log_2 N$ bits in reverse order. For N = 8: rev(1) = 4, rev(3) = 6. |
| block size | The size M of the DFTs that a stage builds: 2, 4, 8, ..., N. In code, often `size`. |
| half | M/2: the distance between the two rows of a butterfly in the stage. |
| twiddle step | The jump through a table of $W_N^m$ values. A stage with block size M uses every (N/M)-th entry. |
| symptom | What you see in the output when a bug is present, for example "the odd bins are wrong". |
| reference | A trusted result to compare against. Here: `np.fft.fft`. |

> [!note] Rounding on this page
> $1/\sqrt{2} = 0.70710\ldots$ and $\sqrt{2} = 1.41421\ldots$. This page rounds the outputs to two decimals.

## 4. The plan of the iterative FFT

The input is a list of N values, with N a power of 2.

1. **Copy.** Copy the input into a complex array a. The input itself stays unchanged.
2. **Reorder.** For each i from 0 to N − 1, find j = rev(i). If i < j, swap a[i] and a[j].
3. **Stages.** For the block sizes M = 2, 4, 8, ..., N:
   1. Let h = M/2.
   2. For each block start s = 0, M, 2M, ... up to N − M:
   3. For each j from 0 to h − 1: take the twiddle $w = W_M^{j} = e^{-i2\pi j/M}$. Save top = a[s + j]. Compute bottom = w · a[s + j + h]. Write a[s + j] = top + bottom and a[s + j + h] = top − bottom.
4. **Return** the array a. It holds X[0] to X[N − 1] in natural order.

### 4.1 Why the swap needs i < j

rev is its own inverse: rev(rev(i)) = i. So the indices form pairs, for example 1 and 4. The loop meets each pair twice, once at i = 1 and once at i = 4. A second swap undoes the first one. The rule i < j makes exactly one swap for each pair. An index with rev(i) = i, for example 2 = 010, stays in place.

| N | swaps (i, rev(i)) with i < rev(i) | number of swaps |
|---|---|---|
| 8 | (1, 4), (3, 6) | 2 |
| 16 | (1, 8), (2, 4), (3, 12), (5, 10), (7, 14), (11, 13) | 6 |

After the two swaps for N = 8, the array holds [x0, x4, x2, x6, x1, x5, x3, x7]. This is the input column of the network in lesson L18.

### 4.2 The loops follow the network

| stage | block size M | h | block starts s | row pairs (s + j, s + j + h) | twiddles $W_M^j$ |
|---|---|---|---|---|---|
| 1 | 2 | 1 | 0, 2, 4, 6 | (0,1), (2,3), (4,5), (6,7) | $W_2^0 = 1$ |
| 2 | 4 | 2 | 0, 4 | (0,2), (1,3), (4,6), (5,7) | $W_4^0 = 1$, $W_4^1 = -i$ |
| 3 | 8 | 4 | 0 | (0,4), (1,5), (2,6), (3,7) | $W_8^0$ to $W_8^3$ |

Each row of this table is one stage of the figure in lesson L18. The loop over s walks through the blocks. The loop over j walks through the butterflies inside one block.

### 4.3 Why in place is safe

In one stage, each butterfly reads two cells and writes the same two cells. No other butterfly of the same stage reads those cells. So a write can never destroy a value that another butterfly of this stage still needs. The only danger is inside one butterfly: the second write needs the old top value. So save it first.

The method needs one array of N values. The recursive version of lesson L19 makes a new array at each of its 2N − 1 calls.

### 4.4 The twiddle step

Fast libraries compute the twiddles $W_N^m$ for m = 0 to N/2 − 1 once, in a table. A stage with block size M needs $W_M^j$. This relation connects the two:

$$
W_M^{j} = e^{-i2\pi j/M} = e^{-i2\pi\, j (N/M)/N} = W_N^{\,j \cdot (N/M)}.
$$

So the stage reads every (N/M)-th entry of the table. For N = 8: stage 1 (M = 2) uses step 4, stage 2 (M = 4) uses step 2, stage 3 (M = 8) uses step 1. A wrong step is a common bug (version C below).

## 5. A method to find a bug

Do not guess. Follow these steps.

1. **Observe.** Compare your output with `np.fft.fft` for one input. Print both.
2. **Reproduce small.** Find the smallest N that fails: test N = 1, 2, 4, 8, 16.
3. **Read the pattern.** Which bins are wrong? Are the magnitudes right and only the phases wrong? Is the output a known transform of something else?
4. **Make a hypothesis.** Name one line that can cause this pattern.
5. **Test the hypothesis.** Use a special input that shows the effect of that one line.
6. **Fix and verify.** Change one line. Run every test again, for all sizes.

### 5.1 Simple inputs hide bugs

The table shows which test input finds which bug of section 7. "hidden" means that the broken version gives the correct output for that input.

| test input | version A | version B | version C |
|---|---|---|---|
| all ones, N = 8 | hidden | hidden | hidden |
| impulse at n = 0, N = 8 | hidden | hidden | hidden |
| impulse at n = 1, N = 8 | found | found | hidden |
| cosine $\cos(2\pi n/8)$ | hidden | found | found |
| random values, N = 1 or N = 2 | hidden | hidden | hidden |
| random values, N = 4 | found | found | hidden |
| random values, N = 8 | found | found | found |

> [!key] Test with random values and several sizes
> A constant, an impulse at 0 and N ≤ 2 pass all three broken versions. Always test random input for N = 8 or more, against `np.fft.fft`, and compare the complex values, not only the magnitudes.

## 6. Code: write your own version first

Write `fft_iterative(x)` from the plan in section 4. Do this before you read section 7.

Acceptance tests:

1. For N = 1, 2, 8, 64 and 1024, with random x, `np.allclose(fft_iterative(x), np.fft.fft(x))` is True.
2. For random x with N = 1024, `np.allclose(fft_iterative(x), fft_recursive(x))` is True.
3. For the teaching signal, `fft_iterative(x)` is close to [0, 4, −2j, 0, 0, 0, 2j, 4].
4. After the call, the input array still holds its old values.
5. Bad lengths (0, 3, 6, 12) raise `ValueError`.
6. Write a test helper `check_fft(f)` that runs f on random input for N = 1, 2, 4, 8, 16 and 1024. It prints one line for each N: "ok" or "FAIL". Use it on your function and on versions A, B and C below.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/04-fft/l20-iterative-fft-and-bugs)

```check
{
  "question": "Hint for `fft_iterative(x)`: how do I organize the three loops of the stages?",
  "hint": "Hint level 1 (idea): the outer loop doubles the block size. The middle loop jumps from block to block. The inner loop walks through the butterflies inside one block.",
  "answer": "Hint level 2 (pseudocode):\n\n1. M ← 2.\n2. While M ≤ N: h ← M/2.\n3. For each block start s in 0, M, 2M, ... below N:\n4. For j in 0 .. h − 1: w ← exp(−i·2π·j/M).\n5. top ← a[s + j]. bottom ← w·a[s + j + h].\n6. a[s + j] ← top + bottom. a[s + j + h] ← top − bottom.\n7. After all blocks: M ← 2M."
}
```

```check
{
  "question": "Hint for the reorder step: how do I get rev(i)?",
  "hint": "Hint level 1 (idea): write i as a binary string with exactly $\\log_2 N$ digits, reverse the string, and read it as a binary number.",
  "answer": "Hint level 2 (pseudocode): bits ← log₂N. For i in 0 .. N − 1: j ← (i as a binary string of length bits, reversed, read in base 2). If i < j: swap a[i] and a[j]. For N = 1 there are 0 bits, and nothing moves."
}
```

## 7. Three broken versions

Each version below runs with no error. Each version has exactly one bug. The versions skip the length check to stay short. They assume `import numpy as np`. In the code, `size` is the block size M, `half` is h, and `start` is the block start s.

For each version: run it on the teaching signal and on your `check_fft`. Read the symptom. Find the line. Fix it with one change. Then run all tests again.

### 7.1 Version A

```python
def fft_iterative_a(x):
    a = np.array(x, dtype=complex)      # a copy: the input stays unchanged
    N = len(a)
    bits = N.bit_length() - 1           # log2(N) when N is a power of 2
    # put the samples in bit-reversed order
    for i in range(N):
        j = int(format(i, f"0{bits}b")[::-1], 2) if bits > 0 else 0
        if i < j:
            a[i], a[j] = a[j], a[i]
    # the stages: block sizes 2, 4, ..., N
    size = 2
    while size <= N:
        half = size // 2
        for start in range(0, N, size):
            for j in range(half):
                w = np.exp(2j * np.pi * j / size)
                top = a[start + j]
                bottom = w * a[start + j + half]
                a[start + j] = top + bottom
                a[start + j + half] = top - bottom
        size *= 2
    return a
```

**Symptom.** For the teaching signal, version A returns [0, 4, 2i, 0, 0, 0, −2i, 4]. The correct output is [0, 4, −2i, 0, 0, 0, 2i, 4]. The magnitudes are all correct: 0, 4, 2, 0, 0, 0, 2, 4. Only the imaginary parts have the wrong sign. A test that compares only magnitudes passes. A cosine input also passes, because its spectrum is real.

For a real input, the output of version A equals `np.conj(np.fft.fft(x))`. It also equals `8 * np.fft.ifft(x)` for N = 8.

```check
{
  "question": "Version A: find the bug. Which line can turn every output into its complex conjugate?",
  "hint": "Feed an impulse at n = 1. The correct output is $W_8^k$, which turns clockwise as k grows. Which way does the output of version A turn?",
  "answer": "The output of the impulse turns counterclockwise: 1, 0.71 + 0.71i, i, ... So every twiddle turns the wrong way. The twiddle must be $e^{-i2\\pi j/M}$, with a minus sign in the exponent. Version A uses a plus sign, so it computes the inverse transform without the 1/N. Fix: the sign of the exponent in the twiddle line."
}
```

### 7.2 Version B

```python
def fft_iterative_b(x):
    a = np.array(x, dtype=complex)      # a copy: the input stays unchanged
    N = len(a)
    # the stages: block sizes 2, 4, ..., N
    size = 2
    while size <= N:
        half = size // 2
        for start in range(0, N, size):
            for j in range(half):
                w = np.exp(-2j * np.pi * j / size)
                top = a[start + j]
                bottom = w * a[start + j + half]
                a[start + j] = top + bottom
                a[start + j + half] = top - bottom
        size *= 2
    return a
```

**Symptom.** For the teaching signal, version B returns [0, −0.62 − 0.5i, 3.41 + 1.41i, 0.21 + 1.91i, 2, 0.21 − 1.91i, 3.41 − 1.41i, −0.62 + 0.5i]. Almost every bin is wrong. But a constant input, an impulse at n = 0, and any input with N = 1 or N = 2 pass.

The output of version B equals `np.fft.fft(x[[0, 4, 2, 6, 1, 5, 3, 7]])`: the correct DFT of the samples in a shuffled order.

```check
{
  "question": "Version B: find the bug. Why does a constant input pass, but an impulse at n = 1 fail?",
  "hint": "Feed an impulse at n = 1. The output is [1, −1, 1, −1, 1, −1, 1, −1]. Which impulse has this DFT?",
  "answer": "[1, −1, 1, −1, ...] is the DFT of an impulse at n = 4, because $W_8^{4k} = (-1)^k$. So the stages treat x[1] as if it were x[4]. The stages expect the input in bit-reversed order, and version B never reorders it. A constant looks the same in any order, so it hides the bug. Fix: add the bit-reversal permutation before the stages, with one swap for each pair i < rev(i)."
}
```

### 7.3 Version C

```python
def fft_iterative_c(x):
    a = np.array(x, dtype=complex)      # a copy: the input stays unchanged
    N = len(a)
    bits = N.bit_length() - 1           # log2(N) when N is a power of 2
    # put the samples in bit-reversed order
    for i in range(N):
        j = int(format(i, f"0{bits}b")[::-1], 2) if bits > 0 else 0
        if i < j:
            a[i], a[j] = a[j], a[i]
    # the stages: block sizes 2, 4, ..., N
    size = 2
    while size <= N:
        half = size // 2
        for start in range(0, N, size):
            for j in range(half):
                w = np.exp(-2j * np.pi * j / N)
                top = a[start + j]
                bottom = w * a[start + j + half]
                a[start + j] = top + bottom
                a[start + j + half] = top - bottom
        size *= 2
    return a
```

**Symptom.** For the teaching signal, version C returns [0, 3 + 0.41i, −2i, −0.41 − i, 0, 1 − 0.41i, 2i, 4.41 + i]. The even bins 0, 2, 4, 6 are correct. The odd bins 1, 3, 5, 7 are wrong. Random input for N = 1, 2 and 4 passes. Random input for N = 8 fails. For N = 16, only the bins 0, 4, 8 and 12 are correct.

```check
{
  "question": "Version C: find the bug. Why do N = 2 and N = 4 pass, and why are only the odd bins wrong for N = 8?",
  "hint": "Which stage uses the wrong twiddle? Check the last stage first: there the block size M equals N.",
  "answer": "The twiddle line uses N where it must use the block size M (the variable `size`). In the last stage M = N, so that stage is correct. For N ≤ 4, the earlier stages use only j = 0, and $e^{0} = 1$ is correct for any size. For N = 8, stage 2 uses $W_8^1$ instead of $W_4^1 = -i$ at j = 1. Those butterflies write E[1], E[3], O[1] and O[3], and only the odd bins use these values. In the language of section 4.4, the twiddle step is 1 in every stage. Fix: use the block size in the twiddle exponent."
}
```

> [!trap] One passing test proves little
> Version C passes every test with N = 4. Version A passes every test with a cosine. Version B passes a constant. A good test set uses random complex values, several sizes up to N = 1024, and a trusted reference.

## 8. Graphs

Version A: the imaginary parts have the right size and the wrong sign. The magnitudes match exactly, so a magnitude plot cannot show this bug.

```plot
{
  "title": "Imaginary part: correct (ink), version A (red)",
  "xAxis": {"label": "bin k", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "imaginary part", "domain": [-2.6, 2.6]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 0.0], [1.0, 0.0], [2.0, -2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 2.0], [7.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.0], [2.0, -2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 2.0], [7.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.0], [2.0, 2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, -2.0], [7.0, 0.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.0], [2.0, 2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, -2.0], [7.0, 0.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true}
  ]
}
```

Versions B and C: the magnitudes are wrong. In version C, the even bins are still correct.

```plot
{
  "title": "Magnitude: correct (ink), B (red), C (purple)",
  "xAxis": {"label": "bin k", "domain": [-0.5, 7.5]},
  "yAxis": {"label": "magnitude", "domain": [-0.3, 5]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 0.0], [1.0, 4.0], [2.0, 2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 2.0], [7.0, 4.0]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 4.0], [2.0, 2.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0], [6.0, 2.0], [7.0, 4.0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.7975], [2.0, 3.6955], [3.0, 1.9254], [4.0, 2.0], [5.0, 1.9254], [6.0, 3.6955], [7.0, 0.7975]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 0.7975], [2.0, 3.6955], [3.0, 1.9254], [4.0, 2.0], [5.0, 1.9254], [6.0, 3.6955], [7.0, 0.7975]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#C81D25", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 3.0285], [2.0, 2.0], [3.0, 1.0824], [4.0, 0.0], [5.0, 1.0824], [6.0, 2.0], [7.0, 4.5261]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true},
    {"points": [[0.0, 0.0], [1.0, 3.0285], [2.0, 2.0], [3.0, 1.0824], [4.0, 0.0], [5.0, 1.0824], [6.0, 2.0], [7.0, 4.5261]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#6A4C93", "skipTip": true}
  ]
}
```

## 9. Video

This clip shows the network that the loops of section 4 compute. Watch the bit-reversed inputs, stage 1 with twiddle 1, stage 2 with E and O, and stage 3.

```video
{
  "src": "/notes/media/fft-signal-processing/course/09_The_FFT_Butterfly_Algorithm.mp4",
  "start": "2:23",
  "end": "3:01",
  "caption": "The network as one computation: bit-reversed inputs, then 3 stages of butterflies, outputs in natural order."
}
```

## 10. Common mistakes

1. **No saved top value.** The code writes the new top value, then uses the overwritten value for the bottom output. Save the top value first.
2. **A second swap for each pair.** A swap for every i undoes itself. Swap only when i < rev(i).
3. **The full size N in the twiddle.** Each stage uses its own block size M (version C).
4. **A plus sign in the twiddle.** The forward DFT turns clockwise: $e^{-i2\pi j/M}$ (version A).
5. **No reorder.** The stages expect bit-reversed input (version B).
6. **Tests with simple inputs only.** Constants, impulses at 0 and N ≤ 4 hide real bugs.

## 11. One-minute explanation

The iterative FFT computes the network of L18 in one array. First it swaps each value at index i with the value at rev(i), once per pair. Then each stage, for block sizes M = 2, 4, ..., N, joins row j and row j + M/2 in a butterfly with the twiddle $e^{-i2\pi j/M}$. The butterfly writes its results into the same two cells, so the method needs no second array. To find a bug, compare the output with `np.fft.fft` on random input for several sizes, and read the pattern of the errors. Conjugated outputs show a wrong twiddle sign, a failing impulse shows a missing reorder, and correct even bins show a wrong twiddle size.

## 12. Check questions

```check
{
  "question": "Name the steps of the iterative in-place FFT in order.",
  "hint": "There is one reorder and then a loop over stages.",
  "answer": "1. Copy the input into a complex array. 2. Reorder: swap a[i] and a[rev(i)] when i < rev(i). 3. For each block size M = 2, 4, ..., N: in each block, join row j and row j + M/2 in a butterfly. Use the twiddle $e^{-i2\\pi j/M}$, and write the results into the same two cells. 4. Return the array, in natural order."
}
```

```check
{
  "question": "List the swaps of the reorder step for N = 16.",
  "hint": "Use 4-bit binary. Swap only when i < rev(i).",
  "answer": "rev(1) = 8, rev(2) = 4, rev(3) = 12, rev(5) = 10, rev(7) = 14, rev(11) = 13. So the swaps are (1, 8), (2, 4), (3, 12), (5, 10), (7, 14), (11, 13): six swaps. The indices 0, 6, 9 and 15 are palindromes in binary (0000, 0110, 1001, 1111) and stay in place."
}
```

```check
{
  "question": "Why does the input of all ones (N = 8) pass all three broken versions?",
  "hint": "Think about the reorder, the sign, and what the stages multiply.",
  "answer": "The correct output is [8, 0, 0, 0, 0, 0, 0, 0]. Reorder: a constant looks the same in any order (version B). Sign: the output is real, and a real number equals its conjugate (version A). Twiddles: after stage 1, every difference is 1 − 1 = 0, so every later twiddle multiplies only zeros (version C)."
}
```

```check
{
  "question": "A colleague's FFT gives the correct magnitude in every bin, but every imaginary part has the wrong sign. Which kind of bug do you check first?",
  "hint": "Which operation keeps the magnitude and flips the sign of the imaginary part?",
  "answer": "The output is the complex conjugate of the correct output. For real input, this is the effect of a twiddle with the wrong sign: $e^{+i2\\pi j/M}$ instead of $e^{-i2\\pi j/M}$. Check the sign of the exponent first."
}
```

```check
{
  "question": "With version C and N = 16, only the bins 0, 4, 8 and 12 are correct. Explain why these bins survive.",
  "hint": "Which twiddles are correct in the wrong stages? Which values do the bins 0, 4, 8 and 12 use?",
  "answer": "In every stage, the butterflies with j = 0 use $e^{0} = 1$, which is correct. The last stage (M = 16) is fully correct. The bins 0, 4, 8 and 12 come from E[0], E[4], O[0] and O[4] of the 8-point DFTs. In each smaller DFT, these values come only from butterflies with j = 0. So no wrong twiddle reaches them."
}
```

## 13. Links

- Previous: [L19: Recursive FFT code](/notes/maths/fft-signal-processing/04-fft/l19-recursive-fft-code)
- Next: [L21: Why the FFT is fast](/notes/maths/fft-signal-processing/04-fft/l21-why-it-is-fast)
- The network that the loops compute: [L18: Recursion and the network](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network)
- The butterfly: [L17: The butterfly](/notes/maths/fft-signal-processing/04-fft/l17-the-butterfly)
- [04 FFT](/notes/maths/fft-signal-processing/04-fft)
- [Glossary](/notes/maths/fft-signal-processing/glossary)
