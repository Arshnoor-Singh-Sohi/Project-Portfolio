---
title: "Mistakes"
order: 2
summary: "Every mistake, its correction, and whether it still happens."
---

> [!note]
> Status values: **open** means not tested again yet. **fixed** means correct on a later test. **repeat** means the same mistake happened again.

| Date | Where | My mistake | Correction | Status |
|---|---|---|---|---|
| 2026-10-11 | Diagnostic Q2 | I said one stored number describes the pitch. | One number is one **sample**: the microphone measurement at one instant. Pitch depends on how fast the values repeat, so it needs many samples. | open |
| 2026-10-11 | Diagnostic Q3 | I chose A (correct), but I said the reason is how high the wave goes. | Both lists have the same height: highest 1, lowest −1. Height is **amplitude**. Pitch follows how fast the pattern repeats: A repeats every 4 samples, B every 8 samples. | fixed (Q4: used height only for amplitude) |
| 2026-10-11 | Diagnostic Q4 | I wrote "B has higher amplitude" when the question compared A and C. I gave no reasons. | B and A have the same highest value (1). C has the highest value 2, so C has the larger amplitude. Each answer needs its evidence from the numbers. | fixed (Q4b: named C and gave reasons) |
| 2026-10-11 | Diagnostic Q4b | My pitch reason was that A values "reach faster". | "Reach faster" does not say what A reaches. Pitch follows how often the pattern repeats. Count the samples in one full repeat: A needs 4, C needs 8. | open |
| 2026-10-11 | Diagnostic Q5 | I said A and D have the same pitch, because the "oscillations per one cycle or second" are the same. | A repeats every 4 samples: 2 cycles in 8 samples. D repeats every 8 samples: 1 cycle. One oscillation is one cycle, so the correct phrase is "cycles per second". Where a wave starts (phase) does not change its frequency. | open |
