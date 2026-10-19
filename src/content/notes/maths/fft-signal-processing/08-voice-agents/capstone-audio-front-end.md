---
title: "Capstone: An audio front end from scratch"
order: 6
summary: "A specification for a small Python package that reads a WAV file, checks the rate, makes frames, applies a Hann window, runs your own FFT, and computes power and log-mel features that match librosa and Whisper."
status: not-started
tags: [capstone, front-end, fft, stft, log-mel, testing, whisper, librosa]
---

## 1. The question this idea answers

Can you build the speech front end of [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) yourself, with no FFT library? Can you prove that it gives the same numbers as the tools that real voice agents use?

This capstone joins every part of the subject in one program. Samples come from part 02, the DFT from part 03 and your FFT from part 04. Bins in hertz and windows come from part 05. Frames, power and mel come from part 07. The result is a small Python package called `audiofront`. Its tests compare it with NumPy, librosa and Whisper.

This page is a specification. It gives the layout, the function signatures, the tests and the tolerances. It does not give the solution. The lesson before it, [L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency), showed why every frame setting in this package also sets a delay.

## 2. Mental model

> [!analogy] A factory line with an inspector at every station
> Each module is one station: read the file, cut frames, apply the window, run the FFT, apply the mel filters. An inspector (a unit test) checks every station before the part moves on. At the end, a second inspector compares your product with the product of a known factory (librosa or Whisper).
>
> **Where it stops working:** two correct factories never give identical numbers. They round differently (float32 against float64), and they pick different defaults (padding mode, mel scale). So "the same" means "the same within a stated tolerance, with the same settings". Section 6 gives each tolerance and the reason for it.

## 3. Terms

| Term | Plain meaning |
|---|---|
| package | A folder of Python modules that you can install and import, for example `import audiofront`. |
| module | One Python file of the package, for example `fft.py`. |
| function signature | The name, the arguments, their types and the return type of a function. |
| acceptance test | A test that decides whether a function meets its specification. |
| reference implementation | A trusted program that computes the same quantity, for example `librosa.stft`. |
| absolute tolerance | The largest allowed difference $\lvert a - b \rvert$. |
| relative tolerance | The largest allowed difference as a share of the size of the reference: $\lvert a - b \rvert \le r \lvert b \rvert$. |
| float32, float64 | Floating-point numbers with about 7 and about 16 significant decimal digits. |
| fixture | Test data that many tests share, for example a 440 Hz tone. |
| mixed-radix FFT | An FFT that splits $N$ by any factor, not only by 2 ([L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts)). It handles $N$ = 400 = $2^4 \times 5^2$. |

> [!note] Numbers on this page
> Python computed every number on this page. A private trial solution (not published) passed every numeric test of section 6.1 with librosa 0.11.0 and NumPy 2.5. It could not run PyTorch, so the Whisper test of section 6.2 has a wide tolerance for float32.

## 4. The package

### 4.1 Layout

```text
audiofront/
├── pyproject.toml
├── README.md              what each parameter means, and where the package sits in a voice agent
├── src/audiofront/
│   ├── __init__.py
│   ├── wav.py             read a 16-bit PCM WAV file
│   ├── rate.py            check the sample rate (stretch: resample)
│   ├── fft.py             direct DFT, radix-2 FFT, any-length FFT, real FFT
│   ├── windows.py         Hann window, periodic and symmetric
│   ├── frames.py          center padding and framing
│   ├── stft.py            STFT and power spectrogram
│   ├── mel.py             mel scales and the mel filterbank
│   ├── features.py        log-mel, and the exact Whisper recipe
│   └── __main__.py        python -m audiofront input.wav output.npy
└── tests/
    ├── conftest.py        fixtures: tones, a chirp, the spectrum signal
    ├── test_wav.py
    ├── test_fft.py
    ├── test_windows.py
    ├── test_frames_stft.py
    ├── test_mel.py
    └── test_whisper.py
```

### 4.2 Rules

1. Inside `src/audiofront/`, use only Python, NumPy arrays and the standard library. Do not call `np.fft`, SciPy, librosa or PyTorch there.
2. The tests may import any reference library.
3. Every array that represents a spectrum has the shape (bins, frames), as in PyTorch, librosa and Whisper. The exercises of [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) used (frames, bins). Transpose with care.
4. Compute in float64. Accept float32 input and convert it.

### 4.3 Function signatures

These are the stubs. Each body is your work.

```python
# wav.py
def read_wav(path: str) -> tuple[np.ndarray, int]:
    """Read a 16-bit PCM WAV file. Return (samples, sample_rate).
    samples: float64, shape (n,), values = int16 / 32768.0. Stereo: the mean of the two channels.
    Raise ValueError for any sample width other than 2 bytes."""

# rate.py
def check_rate(fs: int, expected: int = 16000) -> None:
    """Raise ValueError with a clear message when fs != expected."""

# fft.py
def dft(x: np.ndarray) -> np.ndarray:
    """Direct DFT from the formula of L11. No 1/N. Complex output of length N."""

def fft_radix2(x: np.ndarray) -> np.ndarray:
    """Radix-2 decimation-in-time FFT (L19 or L20). Raise ValueError if len(x) is not a power of 2."""

def fft(x: np.ndarray) -> np.ndarray:
    """FFT of any length N: radix-2 when N is a power of 2, mixed radix (L22) otherwise,
    and the direct DFT when N is prime."""

def rfft(x: np.ndarray) -> np.ndarray:
    """The first N // 2 + 1 values of fft(x), for real x (L24)."""

# windows.py
def hann(n: int, periodic: bool = True) -> np.ndarray:
    """0.5 - 0.5 cos(2 pi k / d), k = 0..n-1, with d = n (periodic) or d = n - 1 (symmetric)."""

# frames.py
def frame_signal(x: np.ndarray, n_fft: int, hop: int, center: bool = True,
                 pad_mode: str = "reflect") -> np.ndarray:
    """If center: pad n_fft // 2 samples on each side with pad_mode ("reflect" or "constant").
    Return frames with shape (1 + (len(padded) - n_fft) // hop, n_fft)."""

# stft.py
def stft(x: np.ndarray, n_fft: int = 400, hop: int = 160, center: bool = True,
         pad_mode: str = "reflect") -> np.ndarray:
    """Periodic Hann window, then rfft of each frame. Complex output, shape (n_fft // 2 + 1, frames)."""

def power_spectrogram(X: np.ndarray) -> np.ndarray:
    """abs(X) ** 2, same shape as X."""

# mel.py
def hz_to_mel(f, htk: bool = False): ...
def mel_to_hz(m, htk: bool = False): ...

def mel_filterbank(sr: int, n_fft: int, n_mels: int, fmin: float = 0.0, fmax: float | None = None,
                   htk: bool = False, norm: str | None = "slaney") -> np.ndarray:
    """Triangle filters with n_mels + 2 edge points equally spaced in mel (L36).
    Shape (n_mels, n_fft // 2 + 1). fmax defaults to sr / 2."""

# features.py
def log_mel(x: np.ndarray, sr: int = 16000, n_fft: int = 400, hop: int = 160, n_mels: int = 80,
            floor: float = 1e-10) -> np.ndarray:
    """log10 of the mel spectrogram, with values below floor set to floor. Shape (n_mels, frames)."""

def pad_or_trim(x: np.ndarray, length: int = 480000) -> np.ndarray:
    """Pad zeros at the end, or cut the end, to exactly `length` values (L39)."""

def whisper_log_mel(x: np.ndarray, n_mels: int = 80) -> np.ndarray:
    """The exact recipe of whisper/audio.py (L39): drop the last frame, log10, clamp at max - 8,
    then (x + 4) / 4. Shape (n_mels, 1 + len(x) // 160 - 1)."""
```

> [!trap] The defaults of the reference libraries differ
> 1. `librosa.stft` uses `pad_mode="constant"` (zeros) by default. Whisper and `torch.stft` use `"reflect"`. Pass `pad_mode="reflect"` to librosa in the tests.
> 2. `torchaudio.transforms.MelSpectrogram` defaults to `hop_length = win_length // 2` (200 for 400), `mel_scale="htk"` and `norm=None`. Pass `hop_length=160`, `mel_scale="slaney"` and `norm="slaney"` to match Whisper.
> 3. `librosa.filters.mel` returns float32 by default. Whisper's `mel_filters.npz` also holds float32.
> 4. `np.hanning` is the symmetric window. Whisper uses the periodic one.

> [!note] Sources for the defaults
> librosa: `librosa/core/spectrum.py` (`stft`), `librosa/feature/spectral.py` (`melspectrogram`) and `librosa/filters.py` (`mel`), main branch. torchaudio: `src/torchaudio/transforms/_transforms.py`, main branch. The torchaudio README says that the project is in a maintenance phase and that 2.9 removed some features. PyTorch: `torch/functional.py` (`stft`). All read on 2026-10-19.

## 5. Build order

Build and test one station at a time. Each step names the lessons it needs.

1. **`dft` and `fft_radix2`.** Lessons [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula), [L19](/notes/maths/fft-signal-processing/04-fft/l19-recursive-fft-code) and [L20](/notes/maths/fft-signal-processing/04-fft/l20-iterative-fft-and-bugs). First write `test_fft.py` with values that you computed by hand.
2. **`fft` for any length.** Lesson [L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts). Whisper needs $N$ = 400.
3. **`read_wav` and `check_rate`.** Lessons [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) and [L26](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing).
4. **`hann` and `frame_signal`.** Lessons [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) and [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram).
5. **`stft` and `power_spectrogram`.** Lesson [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram).
6. **`mel_filterbank` and `log_mel`.** Lesson [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel).
7. **`whisper_log_mel` and `pad_or_trim`.** Lesson [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end).
8. **The command line and the README.** Record 3 s of your own voice. Run `python -m audiofront voice.wav voice.npy`. Plot the result. Explain every parameter in the README.

Stretch goals, after the core passes:

1. `rate.resample(x, fs_in, fs_out)` with a windowed-sinc low-pass filter ([L26](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing), [L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem)).
2. `stft.istft(X, n_fft, hop, length)` with the least-squares overlap-add of [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft).
3. A counter of complex multiplications inside `fft_radix2`.

## 6. Acceptance tests and tolerances

Write these tests with pytest. "Max diff" means `np.max(np.abs(mine - reference))`.

### 6.1 Core tests

| Test | Reference | Pass when | Why this tolerance |
|---|---|---|---|
| `dft([1, 2, 3, 4])` | your hand calculation (L11) | equals `[10, -2+2j, -2, -2-2j]` within 1e-12 | exact small integers |
| `fft` for $N$ = 1, 2, 4, 8, 64, 400, 401, 480, 1000, 1024, 4096, random input in [−1, 1] | `np.fft.fft` | `np.allclose(mine, ref, rtol=1e-9, atol=1e-9 * N)` | float64 rounding grows with $N$. A trial solution had max diff 2.5e-12 at $N$ = 401 (a prime, so a direct DFT). |
| `fft_radix2(np.ones(6))` | none | raises `ValueError` | 6 is not a power of 2 |
| `rfft` of 400 random samples | `np.fft.rfft` | 201 values, `np.allclose` as above | real input, bins 0 to $N/2$ |
| teaching signal, $N$ = 8 | the hand result of part 03 | $X[1] = 4$, $X[2] = -2i$, $X[6] = 2i$, $X[7] = 4$, other bins 0, within 1e-12 | exact values |
| spectrum signal, $N$ = 64, $f_s$ = 128 | L23 | $2\lvert X[k] \rvert/N$ = 1.0, 0.6, 0.4 at bins 3, 7, 12 (6, 14, 24 Hz) within 1e-12 | the sines fit the window |
| `read_wav` on a 16-bit stereo file | `scipy.io.wavfile.read`, then `/ 32768.0` and the mean of the channels | exact equality (`np.array_equal`) | the same integer division |
| `read_wav` on a 24-bit file | none | raises `ValueError` | unsupported width |
| `check_rate(44100)` | none | raises `ValueError` | Whisper needs 16 kHz |
| `hann(400)` | `scipy.signal.get_window("hann", 400)` | max diff < 1e-15 | the same formula in float64 |
| `hann(400, periodic=False)` | `np.hanning(400)` | max diff < 1e-15 | the same formula |
| `stft(x)` for 2 s of noise, `pad_mode="reflect"` | `librosa.stft(x, n_fft=400, hop_length=160, window="hann", center=True, pad_mode="reflect")` | shape (201, 201), max diff < 1e-9 | float64 on both sides. The trial solution had 1.9e-14. |
| `mel_filterbank(16000, 400, 80)` | `librosa.filters.mel(sr=16000, n_fft=400, n_mels=80)` | max diff < 1e-8 | the reference is float32. The trial had 1.3e-9. |
| `mel_filterbank(16000, 400, 80)` and `(…, 128)` | Whisper's `mel_filters.npz` (`mel_80`, `mel_128`) | max diff < 1e-8 | the same float32 values |
| `mel_filterbank(..., htk=True)` | `librosa.filters.mel(..., htk=True)` | max diff < 1e-8 | the HTK scale |
| `hz_to_mel(1000.0)` | the Slaney scale | 15.0 within 1e-12 | exact |
| mel spectrogram of 2 s of noise | `librosa.feature.melspectrogram(y=x, sr=16000, n_fft=400, hop_length=160, n_mels=80, center=True, pad_mode="reflect", power=2.0)` | `np.allclose(mine, ref, rtol=1e-5, atol=1e-10 * ref.max())` | float32 filter weights. The trial had a relative diff of 5e-8. |
| `whisper_log_mel` of 1 s of $0.5\sin(2\pi \cdot 440\, n/16000)$ | L39 | shape (80, 100). Max 1.4382 and min −0.5618 within 1e-4. | values from the worked example |
| `whisper_log_mel` of 30 s of noise | L39 | shape (80, 3000) | the frame count rule |
| chirp ridge | the formula $f(t) = 100 + 3450\,t$ Hz | for frames 3 to 197, the bin with the most power is within ±1 of $\text{round}(f(t)/40)$ at the frame middle $t = 160m/16000$ | the chirp moves 86 Hz in one 25 ms frame |

### 6.2 Tests on a computer with PyTorch

These tests need `torch` and `openai-whisper`. They do not run in a browser lab. Mark them with `pytest.importorskip("whisper")`.

| Test | Reference | Pass when | Why this tolerance |
|---|---|---|---|
| `whisper_log_mel` of 3 random 5 s signals | `whisper.audio.log_mel_spectrogram(x).numpy()` | max diff < 1e-3 | Whisper computes in float32. A float32 NumPy copy of the recipe differed from float64 by less than 5e-6, so 1e-3 leaves a wide margin. |
| `hann(400)` | `torch.hann_window(400).numpy()` | max diff < 1e-7 | float32 |
| mel spectrogram | `torchaudio.transforms.MelSpectrogram(sample_rate=16000, n_fft=400, hop_length=160, n_mels=80, mel_scale="slaney", norm="slaney")` (optional) | `np.allclose(..., rtol=1e-4)` | float32 |

> [!example] The chirp fixture
> The chirp has $f_s$ = 16,000 Hz, a length of 2 s and amplitude 0.5. Its frequency rises in a straight line from 100 Hz to 7,000 Hz:
>
> $$
> x(t) = 0.5\sin\left(2\pi\left(100\,t + \frac{6900}{2 \times 2}\,t^2\right)\right)
> $$
>
> The frequency at time $t$ is $100 + (6900/2)\,t = 100 + 3450\,t$ Hz. In bins of 40 Hz: $2.5 + 86.25\,t$. `scipy.signal.chirp(t, f0=100, f1=7000, t1=2, method="linear", phi=-90)` gives the same samples (times 0.5). The STFT has $1 + 32{,}000/160 = 201$ frames. The trial solution found the ridge exactly on the expected bin in every inner frame.

## 7. Graphs

The expected ridge of the chirp test, in bins (gold), with the ±1 bin band (ink). Every inner frame of your power spectrogram must have its strongest bin inside the band.

```plot
{
  "title": "Chirp ridge: expected bin 2.5 + 86.25 t (gold), and the ±1 bin band (ink)",
  "xAxis": { "label": "time of the frame middle (s)", "domain": [0, 2] },
  "yAxis": { "label": "bin (40 Hz each)", "domain": [0, 180] },
  "disableZoom": true,
  "data": [
    { "fn": "2.5+86.25*x", "color": "#B8860B" },
    { "fn": "3.5+86.25*x", "color": "#100D12" },
    { "fn": "1.5+86.25*x", "color": "#100D12" }
  ]
}
```

The spectrum signal of the course, as your `fft` must see it: $2\lvert X[k] \rvert / N$ for $N$ = 64 and $f_s$ = 128 Hz. The peaks at 6, 14 and 24 Hz have the amplitudes 1.0, 0.6 and 0.4.

```plot
{
  "title": "Amplitude 2|X[k]|/N of the spectrum signal (blue dots): peaks at 6, 14 and 24 Hz",
  "xAxis": { "label": "frequency (Hz)", "domain": [-1, 33] },
  "yAxis": { "label": "amplitude", "domain": [-0.05, 1.15] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0], [2, 0], [4, 0], [6, 1.0], [8, 0], [10, 0], [12, 0], [14, 0.6], [16, 0], [18, 0], [20, 0], [22, 0], [24, 0.4], [26, 0], [28, 0], [30, 0], [32, 0]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0], [2, 0], [4, 0], [6, 1.0], [8, 0], [10, 0], [12, 0], [14, 0.6], [16, 0], [18, 0], [20, 0], [22, 0], [24, 0.4], [26, 0], [28, 0], [30, 0], [32, 0]], "fnType": "points", "graphType": "scatter", "attr": {"r": 3}, "color": "#1E6091", "skipTip": true }
  ]
}
```

## 8. Code

Start the work in a lab, one station at a time. A browser lab has NumPy and SciPy, and it can fetch Whisper's `mel_filters.npz` from `raw.githubusercontent.com`. The Pyodide package list has neither librosa, numba nor PyTorch, so those references need a computer. So run the core tests that need only NumPy and SciPy in the lab. Then copy the code into the package and run all tests with pytest on a computer.

[Open a lab for this capstone](/labs/new?note=maths/fft-signal-processing/08-voice-agents/capstone-audio-front-end) · [FFT explorer lab](/labs/new?template=fft-explorer)

```check
{
  "question": "Stuck on fft for N = 400?",
  "hint": "Generalize the even–odd split of L15. Split by the smallest prime factor p of N, not always by 2.",
  "answer": "Find p, the smallest prime factor of N. Make p sub-sequences x[r::p] for r = 0 … p−1, and take the FFT of each (length N/p). Combine: X[k] = Σ_r e^(−2πi·r·k/N) · F_r[k mod (N/p)]. When N is prime, use the direct DFT. 400 splits as 2, 2, 2, 2, 5, 5."
}
```

```check
{
  "question": "Your STFT matches librosa in the middle frames but not in the first and last frames. Why?",
  "hint": "Compare the padding on both sides.",
  "answer": "librosa pads with zeros by default (pad_mode = 'constant'). Your code (and Whisper) pads with a mirror copy ('reflect'). Only the frames that touch the padding differ. Pass pad_mode = 'reflect' to librosa."
}
```

```check
{
  "question": "Your mel filterbank is close to librosa's, but every filter is too tall or too flat. What is the usual cause?",
  "hint": "Check the area of each triangle.",
  "answer": "The Slaney normalization is missing or wrong. Multiply each triangle by 2 / (right edge − left edge), with the edges in Hz. Another cause: you used the HTK scale while the reference uses the Slaney scale."
}
```

## 9. Common mistakes

1. **Dividing int16 samples by 32767.** Whisper divides by 32768.0. Use the same constant, or the WAV test fails.
2. **Forgetting the down-mix.** A stereo file has two channels. Take their mean before framing.
3. **The (frames, bins) layout.** The references use (bins, frames). Transposed arrays give shape errors or wrong comparisons.
4. **Zero-padding 400 to 512.** It changes the bins and breaks the 201-column mel matrix.
5. **The librosa padding default.** Pass `pad_mode="reflect"` to librosa when you compare with Whisper-style frames.
6. **The symmetric Hann window.** `np.hanning` divides by $n - 1$. Whisper's window divides by $n$.
7. **Testing with the same formula.** A test that computes the expected value with your own code proves nothing. Use a reference library, a hand calculation or an exact signal.
8. **A tolerance of zero.** Two correct float programs rarely agree to the last bit. Choose a tolerance from the precision of the reference.

## 10. One-minute explanation

The capstone is a small package, `audiofront`, that changes a WAV file into the features a speech model reads. It reads 16-bit samples and scales them to the range −1 to 1. It checks that the rate is 16 kHz. It cuts 25 ms frames every 10 ms with reflect padding and multiplies each frame by a periodic Hann window. Then it runs my own FFT, which handles 400 points with a mixed-radix split. It squares the magnitudes, applies an 80-band Slaney mel filterbank, and takes the log. The Whisper recipe adds the clamp at max − 8 and the (x + 4)/4 scale. Every station has a test against NumPy, SciPy, librosa or Whisper, with a tolerance that matches the precision of the reference.

## 11. Check questions

```check
{
  "question": "Your package reads a 2 s file at 16 kHz. What shape does stft(x) return with n_fft = 400, hop = 160 and center = True? What shape does whisper_log_mel return?",
  "hint": "Frames = 1 + L // hop. Whisper drops the last frame.",
  "answer": "L = 32,000. Frames = 1 + 32,000 / 160 = 201. Bins = 400 / 2 + 1 = 201. So stft returns (201, 201). whisper_log_mel drops one frame: (80, 200)."
}
```

```check
{
  "question": "Why is the tolerance for the Whisper comparison (1e-3) so much larger than for the librosa STFT (1e-9)?",
  "hint": "Which number type does each reference use?",
  "answer": "librosa computes the STFT of float64 input in float64 (complex128), so the two results agree to about 1e-14. Whisper computes in float32, with about 7 significant digits. Its log-mel values differ from a float64 computation by small amounts (below 5e-6 in a NumPy float32 test), so the test allows 1e-3."
}
```

```check
{
  "question": "Compute the DFT of [1, 2, 3, 4] by hand. Use it as the first test of fft.",
  "hint": "X[k] = Σ x[n]·(−i)^(kn) for N = 4.",
  "answer": "X[0] = 1 + 2 + 3 + 4 = 10. X[1] = 1 + 2(−i) + 3(−1) + 4(i) = −2 + 2i. X[2] = 1 − 2 + 3 − 4 = −2. X[3] = 1 + 2(i) + 3(−1) + 4(−i) = −2 − 2i."
}
```

```check
{
  "question": "The chirp test fails only at the first 3 and last 3 frames. Should you change your code?",
  "hint": "What do those frames contain?",
  "answer": "No. The edge frames hold reflect padding: a mirror copy of the chirp, which mixes frequencies from both sides of the edge. Their strongest bin need not follow the formula. The test excludes them for this reason."
}
```

```check
{
  "question": "A teammate passes the mel test against librosa with htk = True, but your Whisper test fails. What is the likely cause?",
  "hint": "Which mel scale does Whisper's file use?",
  "answer": "Whisper's mel_filters.npz holds librosa.filters.mel with the defaults: htk = False (the Slaney scale) and norm = 'slaney'. A filterbank on the HTK scale has different edge frequencies, so the Whisper test fails. Use the Slaney scale for the Whisper recipe."
}
```

## 12. Finish line

The subject's finish line has 10 items ([FFT and Signal Processing](/notes/maths/fft-signal-processing)). The capstone gives evidence for each one. Tick an item only when you can do it with no notes and no AI.

| Finish-line item | Evidence in the capstone |
|---|---|
| 1. Explain a signal, its samples, frequency, amplitude and phase with a drawing. | The README section "From air to samples", with a drawing of `read_wav` and its scale of 1/32768. |
| 2. Compute a 4-point DFT by hand. | The hand values of `dft([1, 2, 3, 4])` in `test_fft.py`. |
| 3. Compute a 4-point FFT by hand, and show that it gives the same answer. | A comment in `test_fft.py` with the even–odd split of [1, 2, 3, 4], and a test that `fft_radix2` gives the same 4 values. |
| 4. Derive $X[k] = E[k] + W^k O[k]$ on paper, and explain each step. | The docstring of `fft_radix2`, and a test of the identity on the teaching signal with $N$ = 8. |
| 5. Write a direct DFT and a radix-2 FFT in an empty notebook. Both match `numpy.fft.fft`. | `dft` and `fft_radix2`, written again in an empty lab, pass the `np.fft.fft` test. |
| 6. Convert bins to hertz and magnitudes to amplitudes. Explain leakage and aliasing. | The spectrum-signal test (1.0, 0.6, 0.4 at 6, 14, 24 Hz). The README explains why `check_rate` refuses 44.1 kHz input and what a wrong rate does to every bin. |
| 7. Explain the Fourier family and the rule that connects them. | A README paragraph: the package computes DFTs of frames, and the DFT samples the DTFT of each windowed frame ([L30](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l30-the-four-members)). |
| 8. State the convolution theorem and use it to filter a signal. | Stretch goal 1: the resampler's low-pass filter, applied with your FFT and tested against `np.convolve`. |
| 9. Make a spectrogram of your own voice from scratch, and explain every parameter. | Build step 8: your voice through `python -m audiofront`, plotted, with every parameter explained in the README. |
| 10. Draw a voice-agent pipeline, and show each place where these ideas appear. | A README figure that places `audiofront` in the pipeline of [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map). |

The checklist:

- [ ] Every core test of section 6.1 passes.
- [ ] Every test of section 6.2 passes on a computer with PyTorch and Whisper.
- [ ] The README explains every parameter of `stft` and `whisper_log_mel` in one or two sentences. This includes the floor, the clamp at max − 8 and the scale $(x + 4)/4$.
- [ ] The README has the pipeline figure and the "From air to samples" section.
- [ ] I recorded my own voice and plotted its log-mel spectrogram from my own code.
- [ ] I can explain every line of the package to another engineer with no notes.

## 13. Links

- Previous: [L42: Latency](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency)
- [L39: The speech-to-text front end](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end)
- [L34: The STFT and the spectrogram](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram)
- [L36: Mel and log-mel](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel)
- [L19: Recursive FFT code](/notes/maths/fft-signal-processing/04-fft/l19-recursive-fft-code) and [L22: Other FFTs](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts)
- [08 Voice agents](/notes/maths/fft-signal-processing/08-voice-agents)
- [FFT and Signal Processing](/notes/maths/fft-signal-processing)
