---
title: "Session log"
order: 1
summary: "What happened in each session, newest first."
status: in-progress
---

## Session 1: 2026-10-11

**Topic:** course plan, notes system, diagnostic, lesson L2.

### Decisions

- Explanations use short sentences and simple words, with full technical depth.
- Notes live in this `/notes` section of the portfolio. Claude writes them during the sessions.
- The tree: Maths → FFT and Signal Processing → one folder for each part. Other areas get their own top-level folders.
- Lesson pages hold only the explanation. Mistakes stay in `00 Progress`.
- Every question that I ask goes into the "Questions and answers" section of its lesson page.
- `NOTES_PROTOCOL.md` in the repository root holds the teaching and notes rules for every subject.
- Course videos play inside the notes. Claude Code makes only the new Manim videos.
- Chat Claude replies first, then updates the notes in the same turn.

### Diagnostic

| # | Question | My answer | Result |
|---|---|---|---|
| 1 | I record my voice for one second. What does the computer store? | "The bytes or the voice is stored as bits." | True, but it describes storage, not meaning. Every file is bits. |
| 2 | The bits store a list of numbers. What does one number describe? | "Maybe how high the pitch was." | Not correct. One number is one sample: the microphone measurement at one instant. See [Mistakes](/notes/maths/fft-signal-processing/00-progress/mistakes). |
| 3 | Lists A = [0, 1, 0, −1, 0, 1, 0, −1] and B = [0, 0.71, 1, 0.71, 0, −0.71, −1, −0.71]. Which comes from the higher pitch? | "A because how high the wave go is the length of pitch." | Correct choice, wrong reason. Both lists have the same height. A repeats every 4 samples, B every 8. See [Mistakes](/notes/maths/fft-signal-processing/00-progress/mistakes). |
| 4 | C = [0, 1.42, 2, 1.42, 0, −1.42, −2, −1.42] is B doubled. Compare A and C: higher pitch, larger amplitude, with reasons. | "A has higher pitch B has higher amplitude." | Pitch: correct, no reason. Amplitude: named B, but the question compared A and C. B has the same highest value as A. No reasons given. Reasons requested. |
| 4b | Give the reasons for question 4, with the numbers. | "Reason is that the value for C was higher as compared to A but for A the values were between -1 to 1 but reach faster as compared to C." | Amplitude: passes. C reaches 2, A reaches 1. Pitch: close, not exact. "Reach faster" does not say what A reaches. The exact rule: A repeats every 4 samples, C every 8. |
| 5 | A and D = [1, 0.71, 0, −0.71, −1, −0.71, 0, 0.71]: which has the higher pitch? | "Both of them have same pitch as number of oscilations per one cycle or second are same ?" | Not correct. A makes 2 cycles in 8 samples, D makes 1. Gap found: no method yet to count cycles in a list. Lesson L2 started. |

### L2 progress

| Step | What happened |
|---|---|
| My question | "HOw will I know what is the length of sample and how to measure" |
| Answer given | A sample has no length. The time step Δt is the gap between samples, and the data gives it. Two methods: period in samples × Δt, or cycles ÷ duration. Worked example: A over 2 s gives 1 Hz. The answer is in the [L2 page](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency), section 10. |
| Next | G with Method 1, checked with Method 2. |

### Open

- [L2: Period and frequency](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency): check question with list G.
