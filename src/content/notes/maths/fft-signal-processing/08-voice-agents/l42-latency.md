---
title: "L42: Latency"
order: 5
summary: "Where the time goes in a voice agent, why a frame-based step waits one window length, the three-way trade between frame size, frequency resolution and delay, and a worked latency budget."
status: not-started
tags: [latency, frames, uncertainty, turn-taking, budget, streaming]
---

## 1. The question this idea answers

In a conversation between people, the answer often starts within a fraction of a second. A study of 10 languages measured a mean gap of 208 ms after yes/no questions. A simple voice agent often needs more than a second. Where does the time go? Which part of the delay comes from the frames and the FFT, and which part comes from other blocks?

Each lesson before this one added a block with a frame size. These blocks are the log-mel front end ([L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end)), the noise suppressor and the echo canceller ([L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement)), and the vocoder ([L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end)). This lesson sums their delays. It also connects the frame size to the uncertainty trade of [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty).

> [!note] Source for the human numbers
> Stivers et al., "Universals and cultural variation in turn-taking in conversation", PNAS 106(26):10587–10592, 2009 (full text on PubMed Central, read on 2026-10-19). The study measured the response offset after polar (yes/no) questions in 10 languages. The mean offset for the full data set is +208 ms. The overall mode is 0 ms, and the overall median is +100 ms. Each language has its mode between 0 and +200 ms. The language means range from +7 ms (Japanese) to +469 ms (Danish).

## 2. Mental model

> [!analogy] A table-tennis rally
> The ball crosses the table. A good player moves before the ball arrives, because she reads where it will land. The time between the opponent's hit and her return is short, because she prepares during the flight.
>
> **Where it stops working:** a table-tennis player sees the ball all the time. A voice agent hears the user, but it cannot see the end of the turn coming. It must infer the end from silence or from the words. A wrong guess interrupts the user. Also, part of the agent's delay is not slow work. A frame-based block must wait for its samples, and no faster computer removes that wait.

## 3. Terms

| Term | Plain meaning |
|---|---|
| latency | The time between a cause and its effect, for example between a sound and the output that reacts to it. |
| response latency | The time from the end of the user's speech to the first sound of the agent. |
| response offset | The same time between two people: from the end of one turn to the start of the next. A negative offset is an overlap. |
| algorithmic latency | The delay that a method needs even on an infinitely fast computer, because it must wait for samples. |
| processing latency | The delay from computing: the time that the hardware needs to run the method. |
| lookahead | Future samples or frames that a block needs before it can give its output for the present. |
| real-time factor (RTF) | Processing time divided by the duration of the audio. RTF < 1 is faster than real time. |
| time to first token (TTFT) | The time from the request to the first output token of the LLM. |
| time to first audio | The time from the input text to the first output samples of the TTS system. |
| latency budget | A table that splits the response latency into the parts of each block. |

> [!note] Numbers on this page
> Python computed every number on this page. Section 8 marks every budget number as an assumption. A Python simulation checked the delay formula of section 4.2.

## 4. Two kinds of delay

Each block adds two kinds of delay:

1. **Algorithmic latency.** The block must wait for samples. A frame of 320 samples at 16 kHz cannot start before its last sample arrives, 20 ms after its first sample. A faster computer does not change this.
2. **Processing latency.** The block computes. A faster computer, a smaller model or a better algorithm reduces it. The FFT reduces it: $N \log_2 N$ instead of $N^2$ ([L21](/notes/maths/fft-signal-processing/04-fft/l21-why-it-is-fast)).

The network and the audio buffers add a third part, which is neither: transport time.

### 4.1 An analysis step: features from a frame

A feature extractor, such as the log-mel front end, makes one output for each frame. The output for a frame of $L$ samples is ready when the last sample arrives. So the first sample of the frame waits $L / f_s$ seconds.

> [!example] Whisper's frames
> A Whisper frame has $L$ = 400 samples, 25 ms. With center padding, frame $t$ covers the samples $160t - 200$ to $160t + 199$. Its middle is sample $160t$. The frame is complete 200 time steps after its middle ([L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency): $N$ samples cover $N$ time steps). That is a lookahead of 200 / 16,000 = 12.5 ms past the middle of the frame.
>
> This 12.5 ms is small. The large delay of Whisper is not the frame. It is the encoder, which reads a full 30 s window ([L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end)).

### 4.2 An STFT step that rebuilds audio: delay = window length

A noise suppressor ([L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement)) takes the STFT, applies gains, and rebuilds samples with overlap-add ([L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft)). In real time, it works in blocks of $H$ new samples (the hop). Each new block completes one new frame of $L$ samples.

Follow one sample through the process:

1. **Wait for the block.** The sample arrives somewhere in a block of $H$ samples. The block is complete only when its last sample arrives. The first sample of a block waits $H$ samples.
2. **Wait for the other frames.** Overlap-add needs every frame that covers the sample. Take a window of $L$ and a hop of $H$. The last frame that covers a sample ends $L - H$ samples after the block that holds it.
3. **Add the two waits:** $H + (L - H) = L$.

$$
\text{algorithmic latency of an STFT step with overlap-add} = L \text{ samples} = \frac{L}{f_s} \text{ seconds}
$$

The hop $H$ cancels. A smaller hop gives more frames per second, but the same delay.

> [!example] Checked by simulation
> A streaming loop took blocks of $H$ samples and kept the last $L$ samples. It applied a square-root periodic Hann window, the FFT, a gain of 1, the inverse FFT and the window again. Then it overlap-added the frames. The output was exactly the input, delayed:
>
> | $L$ | $H$ | Delay between the output index and the input index | Plus the wait for one block | Total delay |
> |---|---|---|---|---|
> | 8 | 4 | 4 | 4 | 8 = $L$ |
> | 320 | 160 | 160 | 160 | 320 = $L$ (20 ms at 16 kHz) |
> | 512 | 128 | 384 | 128 | 512 = $L$ (32 ms at 16 kHz) |

> [!key] A frame-based step waits one window length
> The algorithmic latency of a frame step is the window length $L/f_s$, plus any lookahead. A 20 ms window costs 20 ms. Only a shorter window reduces it.

### 4.3 Lookahead

Some blocks need future frames. A model that reads 2 future frames with a hop of 10 ms adds 2 × 10 = 20 ms. A streaming speech-to-text model that needs a chunk of future audio adds that chunk. A Griffin-Lim vocoder ([L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end)) that iterates over the whole utterance needs all of it: its lookahead is the full length of the reply.

> [!note] Codec frames are frames too
> The Moshi README gives "a theoretical latency of 160ms (80ms for the frame size of Mimi + 80ms of acoustic delay)". The 80 ms frame is the window-length wait of section 4.2, at the scale of a codec ([L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end)).

## 5. The three-way trade

A frame of $L$ samples at sample rate $f_s$ has two properties:

1. **Duration:** $T_{\text{frame}} = L / f_s$. Section 4 showed that this is also the algorithmic latency.
2. **Bin spacing:** $\Delta f = f_s / L$ ([L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)).

Multiply them:

$$
\Delta f \cdot T_{\text{frame}} = \frac{f_s}{L} \cdot \frac{L}{f_s} = 1 \quad \text{(exactly)}
$$

So you cannot make both small. Finer frequency resolution costs a longer frame, and a longer frame costs more delay and blurs fast changes in time. This is the uncertainty trade of [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty), with latency as a third cost.

| $L$ (at 16 kHz) | $T_{\text{frame}}$ = latency | $\Delta f$ | $\Delta f \cdot T_{\text{frame}}$ |
|---|---|---|---|
| 160 | 10 ms | 100 Hz | 1 |
| 320 | 20 ms | 50 Hz | 1 |
| 400 | 25 ms | 40 Hz | 1 |
| 512 | 32 ms | 31.25 Hz | 1 |
| 1,024 | 64 ms | 15.625 Hz | 1 |
| 2,048 | 128 ms | 7.8125 Hz | 1 |

The sample rate cancels: at any $f_s$, a 25 ms frame has 40 Hz bins.

> [!example] The spectrum signal of the course
> The spectrum signal has sines at 6, 14 and 24 Hz, with $f_s$ = 128 Hz.
>
> 1. With $N$ = 64 samples: $\Delta f$ = 128 / 64 = 2 Hz. The three sines sit exactly on bins 3, 7 and 12. But the frame lasts 64 / 128 = 0.5 s.
> 2. With $N$ = 16 samples: the frame lasts only 0.125 s. But $\Delta f$ = 8 Hz. Now 6 Hz is bin 0.75 and 14 Hz is bin 1.75. Neither fits a bin, so both leak ([L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)).
>
> To see low frequencies clearly, you must wait for a long frame.

> [!example] Harmonics of a voice
> A voice with $f_0$ = 100 Hz has harmonics 100 Hz apart ([L37](/notes/maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch)). A 10 ms frame gives 100 Hz bins: one bin per harmonic, and the Hann main lobe is wider than that ([L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows)). So the harmonics merge. A 25 ms frame gives 40 Hz bins: 2.5 bins per harmonic step. A 64 ms frame gives 15.625 Hz bins: 6.4 bins per step, at a cost of 64 ms of delay.

## 6. The end-of-speech timeout

The turn detector of [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) waits for a silence before it declares the end of the turn. This wait is pure algorithmic latency: the agent must observe the silence before it can act.

Two sourced settings show the range:

1. The Silero VAD helper code uses `min_silence_duration_ms = 100` by default.
2. The example configuration of the OpenAI Realtime VAD guide uses `silence_duration_ms` = 500.

Compare these with the human numbers of section 1. The human mode is 0 ms and the median is +100 ms. A rule "wait for $T$ ms of silence" always adds at least $T$ ms. So a pure silence timeout cannot reach the most common human gap. To answer faster, a system must predict the end of the turn before the silence is long. The OpenAI guide describes a "semantic VAD" that "uses a semantic classifier to detect when the user has finished speaking". That is one way.

> [!trap] The timeout cannot be shorter than the pauses
> [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) showed a toy utterance with a 150 ms pause. A 100 ms timeout ended the turn inside the pause. The lower limit of a silence timeout is the length of the user's normal pauses, not the speed of the computer.

## 7. Processing latency

The other blocks compute. Their delays depend on the model, the hardware and the design:

1. **Speech-to-text.** A streaming model works during the speech. At the end, only the last chunk remains ([L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map), section 6). A Whisper-style model processes a padded 30 s window after the end of the speech.
2. **LLM.** The time to first token depends on the model size, the prompt length and the server load. The agent can start the TTS before the LLM finishes, for example after the first sentence.
3. **TTS.** The time to first audio depends on the acoustic model and the vocoder. A vocoder that works frame by frame can start after the first mel frames. Griffin-Lim over the whole utterance cannot.
4. **Network.** ITU-T Recommendation G.114 (05/2003) says that with one-way delays below 150 ms, "most applications, both speech and non-speech, will experience essentially transparent interactivity". It recommends not to exceed 400 ms one-way for general network planning.

> [!example] Real-time factor of a vocoder
> The HiFi-GAN abstract reports 22.05 kHz audio "167.9 times faster than real-time on a single V100 GPU". So RTF = 1 / 167.9 = 0.006 (rounded). One second of audio takes about 6 ms of GPU time. The small CPU version runs "13.4 times faster than real-time": RTF = 1 / 13.4 = 0.075 (rounded), about 75 ms for 1 s of audio.

> [!note] Why this page gives no vendor latencies
> The time to first token or first audio of a commercial service changes with the model version, the region and the load. This page does not state such numbers as facts. Measure them in your own system.

## 8. A worked latency budget

The table splits the response latency of two imagined systems. **Every number in it is an assumption for teaching, not a measurement of a real product.** The 500 ms timeout copies the OpenAI example value. The 20 ms capture frame matches the WebRTC VAD frame sizes of [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map).

| Part | Kind | Budget A: simple cascade | Budget B: tuned cascade |
|---|---|---|---|
| capture buffer (one frame) | algorithmic | 20 ms (assumption) | 20 ms (assumption) |
| network, user to server | transport | 50 ms (assumption) | 50 ms (assumption) |
| turn detection | algorithmic | 500 ms silence timeout (assumption) | 200 ms with a turn classifier (assumption) |
| STT final text after the end of speech | processing | 150 ms, batch (assumption) | 50 ms, streaming (assumption) |
| LLM time to first token | processing | 300 ms (assumption) | 200 ms (assumption) |
| TTS time to first audio | processing | 150 ms (assumption) | 100 ms, streaming (assumption) |
| network, server to user | transport | 50 ms (assumption) | 50 ms (assumption) |
| playback buffer | transport | 20 ms (assumption) | 20 ms (assumption) |
| **total** | | **1,240 ms** | **690 ms** |

Add the parts of budget A: $20 + 50 + 500 + 150 + 300 + 150 + 50 + 20 = 1{,}240$ ms. Budget B: $20 + 50 + 200 + 50 + 200 + 100 + 50 + 20 = 690$ ms.

![Two stacked bars on a time axis from 0 to 1,300 ms. Budget A totals 1,240 ms and its largest part is a 500 ms VAD timeout. Budget B totals 690 ms. A red dashed line marks the human mean gap of 208 ms.](/notes/media/fft-signal-processing/figures/l42-latency-budget.svg)

Read the budgets in four steps:

1. **The biggest item in A is waiting, not computing.** The timeout is 500 / 1,240 = 40.3 % of the total.
2. **B cuts the waits and streams.** It saves 1,240 − 690 = 550 ms. The turn classifier saves 300 ms. Streaming STT and TTS save 100 + 50 = 150 ms. A faster LLM saves 100 ms.
3. **B is still slow by human standards.** 690 / 208 = 3.3 times the human mean of 208 ms.
4. **The frame sizes are small items.** The 20 ms capture frame is 1.6 % of budget A. A 25 ms log-mel frame or a 20 ms noise-suppressor window is also small. They matter when everything else is already fast.

> [!key] Measure first, then cut the largest wait
> In budgets like these, the turn detector and the model times are much larger than the frame sizes. The FFT ideas still set a hard floor: each frame-based step costs at least its window length.

## 9. Graphs

Bin spacing against frame length (gold). The dots are the table rows of section 5. The product of the two axes is always 1000 (Hz × ms).

```plot
{
  "title": "Bin spacing (Hz) against frame length (ms): 1000 / x (gold), table values (blue dots)",
  "xAxis": { "label": "frame length = algorithmic latency (ms)", "domain": [0, 135] },
  "yAxis": { "label": "bin spacing (Hz)", "domain": [0, 110] },
  "disableZoom": true,
  "data": [
    { "fn": "1000/x", "color": "#B8860B", "range": [9, 135] },
    { "points": [[10, 100], [20, 50], [25, 40], [32, 31.25], [64, 15.625], [128, 7.8125]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true }
  ]
}
```

An impulse through the streaming STFT loop of section 4.2, with $L$ = 320 and $H$ = 160 at 16 kHz. The axis counts real time in samples. Blue: the input impulse at sample 100. Ink: the output impulse, 320 samples later. That is 160 samples of overlap wait plus 160 samples of block wait.

```plot
{
  "title": "Input impulse at n = 100 (blue) and output impulse at n = 420 (ink): delay L = 320",
  "xAxis": { "label": "sample n", "domain": [0, 500] },
  "yAxis": { "label": "value", "domain": [-0.2, 1.2] },
  "disableZoom": true,
  "data": [
    { "points": [[100, 0], [100, 1]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[100, 1]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true },
    { "points": [[420, 0], [420, 1]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[420, 1]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#100D12", "skipTip": true }
  ]
}
```

## 10. Code

Measure the delay of a streaming STFT step yourself. Write a class `StreamingOLA(L, H)` with one method, `process_block(block)`. The method takes exactly $H$ new samples and returns exactly $H$ output samples. Inside, it does five steps:

1. Keep the last $L$ input samples in a buffer.
2. Multiply the buffer by the analysis window $w_a[n] = \sqrt{0.5 - 0.5\cos(2\pi n/L)}$.
3. Take the real FFT, multiply every bin by a gain (1 for this test), and take the inverse real FFT.
4. Multiply by the same window again, and divide by the constant overlap-add sum of $w_a^2$ (1 for $H = L/2$, 2 for $H = L/4$).
5. Add the frame into an accumulator. Return the oldest $H$ values, which are now complete, and shift the accumulator.

Also write `bin_spacing_hz(L, fs)` and `frame_latency_ms(L, fs)`.

Acceptance tests:

- Feed 40 blocks of random samples. For $(L, H)$ = (8, 4), (320, 160) and (512, 128), the output array equals the input array delayed by $L - H$ positions, within 1e-9. Adding the wait for one block gives a total delay of $L$ samples.
- An impulse at input sample 100 appears at output position $100 + L - H$.
- `bin_spacing_hz(L, fs) * frame_latency_ms(L, fs) == 1000` for 5 random pairs of $L$ and $f_s$, within 1e-9.

[Open a lab for this lesson](/labs/new?note=maths/fft-signal-processing/08-voice-agents/l42-latency)

```check
{
  "question": "Your output equals the input only at the start, then drifts. What is the usual cause?",
  "hint": "Print the accumulator after each block.",
  "answer": "The accumulator does not shift. After you return the oldest H values, move the rest H places to the front and put H zeros at the end. Another cause: the buffer keeps more or fewer than L samples."
}
```

```check
{
  "question": "Why is the output index delay L − H, but the real delay L?",
  "hint": "When can the first output block play?",
  "answer": "The output block number b is ready only when input block b is complete. Then it starts to play. So output index j plays H samples after input index j arrives, at the earliest. The index delay L − H plus this block wait H gives L."
}
```

## 11. Common mistakes

1. **"A faster computer removes the frame delay."** The frame delay is algorithmic. The block must wait for its samples.
2. **"A smaller hop reduces the delay."** For an STFT step with overlap-add, the delay is the window length $L$. The hop changes the number of frames per second.
3. **"Short frames are always better."** They cost frequency resolution: $\Delta f \cdot T_{\text{frame}} = 1$.
4. **"The response latency is the LLM time."** The turn detector, STT, TTS, network and buffers all add time. In budget A, the timeout alone is larger than the LLM time.
5. **"A 100 ms timeout gives a 100 ms response."** The timeout is only one item in the sum.
6. **Vendor numbers as facts.** Service latencies change. Measure them in your system and mark them with a date.

## 12. One-minute explanation

A voice agent's response latency is the time from the end of the user's speech to the agent's first sound. People reply fast: in a 10-language study, the mean gap was 208 ms and the most common gap was 0 ms. Each block of the agent adds two kinds of delay. Algorithmic latency is waiting for samples. A frame-based step waits one window length, and an STFT step with overlap-add delays its output by exactly its window length. Processing latency is computing: the STT, the LLM and the TTS models. The frame size sets a three-way trade, because bin spacing times frame duration is exactly 1, so finer frequency resolution means more delay. In a simple cascade, the largest item is usually the silence timeout of the turn detector, not the FFT frames. So we stream the models, predict the end of the turn, and keep every window short enough.

## 13. Check questions

```check
{
  "question": "Name the two kinds of delay in a block, and give one example of each from a voice agent.",
  "hint": "One kind disappears on an infinitely fast computer.",
  "answer": "Algorithmic latency: waiting for samples, for example a 20 ms window, a lookahead frame or a 500 ms silence timeout. Processing latency: computing, for example the LLM's time to first token or the vocoder's run time."
}
```

```check
{
  "question": "A noise suppressor at 16 kHz uses L = 640 and H = 320. Compute the bin spacing, the frame duration, their product, and the algorithmic latency of the suppressor.",
  "hint": "Δf = f_s / L. T = L / f_s. An STFT step with overlap-add delays by L.",
  "answer": "Δf = 16,000 / 640 = 25 Hz. T = 640 / 16,000 = 0.04 s = 40 ms. Product: 25 × 0.04 = 1. Latency: L = 640 samples = 40 ms. The hop does not change it."
}
```

```check
{
  "question": "Why can a pure silence timeout not match the most common human response gap?",
  "hint": "Compare the timeout with the human mode.",
  "answer": "A silence timeout of T ms waits at least T ms after the speech ends before it acts. The most common human gap (the mode) is 0 ms, and the median is 100 ms. The timeout also cannot be shorter than the user's normal pauses, or the agent interrupts. So the agent must predict the end of the turn, for example with a semantic classifier."
}
```

```check
{
  "question": "The spectrum signal has sines at 6 and 14 Hz, sampled at f_s = 128 Hz. You want each sine exactly on a bin. What is the shortest frame that works, and what is its latency?",
  "hint": "Both 6 and 14 must be whole multiples of Δf = 128 / N, and N should be a power of 2 for a radix-2 FFT.",
  "answer": "Δf must divide 6 and 14, so Δf can be 2 Hz (or 1 Hz). Δf = 2 Hz needs N = 128 / 2 = 64 samples. Its latency is 64 / 128 = 0.5 s. With N = 32, Δf = 4 Hz, and 6 Hz is bin 1.5, so it leaks."
}
```

```check
{
  "question": "In budget A (1,240 ms), you replace the 500 ms timeout by a 200 ms turn classifier and change nothing else. What is the new total, and what share of it is the LLM time of 300 ms?",
  "hint": "Subtract the saving, then divide.",
  "answer": "New total: 1,240 − 500 + 200 = 940 ms. LLM share: 300 / 940 = 0.319, about 32 %. The LLM is now the largest single item."
}
```

## 14. Links

- Previous: [L41: The text-to-speech back end](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end)
- Next: [Capstone: An audio front end from scratch](/notes/maths/fft-signal-processing/08-voice-agents/capstone-audio-front-end)
- [L33: Uncertainty](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty)
- [L35: The inverse STFT](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft)
- [L23: Hertz and amplitude](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude)
- [L38: The voice-agent pipeline](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map)
- [08 Voice agents](/notes/maths/fft-signal-processing/08-voice-agents)
