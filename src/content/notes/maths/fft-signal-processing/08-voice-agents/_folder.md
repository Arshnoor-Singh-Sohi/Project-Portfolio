---
title: "08 Voice agents"
order: 18
summary: "Where the FFT ideas live in a voice agent, and the capstone project."
---

| Code | Lesson | Core idea | Course video | Status |
|---|---|---|---|---|
| L38 | Pipeline map | Microphone → frames → voice detection → speech-to-text → LLM → text-to-speech → speaker | none | not started |
| L39 | Speech-to-text front end | Read real log-mel feature code. To confirm in the source: Whisper uses 25 ms frames of 16 kHz audio (400 samples, not a power of 2). | none | not started |
| L40 | Enhancement | Spectral masks, noise suppression and echo cancellation (overview) | none | not started |
| L41 | Text-to-speech back end | Mel to waveform needs phase. Griffin-Lim. Vocoders. | none | not started |
| L42 | Latency | Frame size, frequency resolution and latency trade against each other. | none | not started |

**Capstone:** an audio front-end package written from scratch. It reads a WAV file, makes frames, applies a window, runs my FFT and computes log-mel features. Tests compare it with a reference library.
