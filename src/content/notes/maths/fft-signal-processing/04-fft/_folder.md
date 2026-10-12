---
title: "04 FFT"
order: 14
summary: "The radix-2 FFT: the even–odd split, the butterfly, the full network, and the code."
---

| Code | Lesson | Core idea | Course video | Status |
|---|---|---|---|---|
| L14 | Cost of the direct DFT | N² multiplications, but only N different W values | ch 8, full | not started |
| L15 | Even–odd split, N = 4 | Input: the 4 odd samples of the teaching signal. Output: O[k] from chapter 9. | none | not started |
| L16 | Two facts | E and O repeat with period N/2. $W^{k+N/2} = -W^k$. | ch 9, 0:41–1:19 | not started |
| L17 | The butterfly | Trace k = 1, 2, 3 with real numbers. | ch 9, 1:19–2:01 | not started |
| L18 | Recursion and the network | Bit reversal and all 3 stages | ch 9, 2:01–3:30 | not started |
| L19 | Recursive FFT code | Write `fft_recursive(x)`. | none | not started |
| L20 | Iterative FFT and bugs | In-place FFT. Fix 3 buggy versions. | none | not started |
| L21 | Why it is fast | $T(N) = 2T(N/2) + cN$ gives $N \log_2 N$. | ch 10, full | not started |
| L22 | Other FFTs | Overview: other radixes, sizes that are not a power of 2, real-input FFT | none | not started |
