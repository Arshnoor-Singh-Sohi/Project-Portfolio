---
title: "Glossary"
order: 2
summary: "Every term in this subject, with a plain meaning. A term is added when a lesson defines it."
---

Every term in this subject, with a plain meaning. The terms are in groups, one group for each part, in the order of the lessons. "First seen" links to the lesson that defines the term.

## Diagnostic and L2

| Term | Plain meaning | First seen |
|---|---|---|
| signal | A quantity that changes over time, for example air pressure or a voltage. | Course plan |
| sample | One measured value of a signal at one instant. A recording is a list of samples. | Diagnostic Q2 |
| pitch | How high a sound seems to a listener. For a simple tone, pitch follows the frequency. | Diagnostic Q2 |
| frequency | How many times a pattern repeats in one second. Full lesson: [L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency). | Diagnostic Q3 |
| amplitude | The height of the swing of a wave. Full lesson: [L3](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude). | Diagnostic Q3 |
| loudness | How strong a sound seems to a listener. It depends mainly on amplitude. The ear also hears some frequencies as louder than others. | Diagnostic Q3 |
| cycle | One full trip of a wave. It starts at a value and returns to the same value, moving in the same direction. One oscillation is one cycle. | [L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency) |
| period (T) | The time for one cycle. In a list of samples, you can also count it in samples. $T = 1/f$. | [L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency) |
| hertz (Hz) | The unit of frequency. 1 Hz is one cycle per second. | [L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency) |
| phase | Where a wave is in its cycle at the start. It does not change the frequency. Full lesson: [L4](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase). | Diagnostic Q5 |
| time step (Δt) | The time between two neighboring samples. A sample itself has no length. | [L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency) |
| sample rate ($f_s$) | The number of samples in one second. $\Delta t = 1/f_s$. Speech recognition often uses 16,000. | [L2](/notes/maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency) |

## 01 Math foundations

| Term | Plain meaning | First seen |
|---|---|---|
| axis | A number line on the edge of a graph. The horizontal axis usually shows time, the vertical axis the value. | [F1](/notes/maths/fft-signal-processing/01-math-foundations/f1-graphs) |
| tick label | A number on an axis. Read values from the tick labels, not from the size of the picture. | [F1](/notes/maths/fft-signal-processing/01-math-foundations/f1-graphs) |
| continuous curve | A graph with a value at every instant, like the signal $x(t)$. | [F1](/notes/maths/fft-signal-processing/01-math-foundations/f1-graphs) |
| dot plot | A graph of a list of samples $x[n]$. It has values only at the samples. Lines between the dots are not data. | [F1](/notes/maths/fft-signal-processing/01-math-foundations/f1-graphs) |
| peak | A point higher than its two neighbors: the top of a wave. | [F1](/notes/maths/fft-signal-processing/01-math-foundations/f1-graphs) |
| trough | A point lower than its two neighbors: the bottom of a wave. | [F1](/notes/maths/fft-signal-processing/01-math-foundations/f1-graphs) |
| center line | The value that a wave swings around. Amplitude = (peak − trough)/2. | [F1](/notes/maths/fft-signal-processing/01-math-foundations/f1-graphs) |
| radian | A unit of angle. On a circle of radius 1, the angle in radians equals the distance along the edge. One turn is $2\pi$ radians. | [F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle) |
| π (pi) | The edge length of a circle divided by its diameter, about 3.14159. A half turn is π radians. | [F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle) |
| unit circle | The circle with radius 1 and its center at the origin. | [F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle) |
| cosine (cos θ) | The horizontal coordinate of the point at angle θ on the unit circle. | [F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle) |
| sine (sin θ) | The vertical coordinate of the point at angle θ on the unit circle. | [F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle) |
| counter-clockwise | The direction opposite to the hands of a clock. A positive angle turns counter-clockwise. | [F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle) |
| angular frequency (ω) | The angle per second of a turning point: $\omega = 2\pi f$, in radians per second. | [F2](/notes/maths/fft-signal-processing/01-math-foundations/f2-radians-and-the-unit-circle) |
| Σ (sigma) | The sign for "add all the terms". Read it as a for-loop from the lower bound to the upper bound, both included. | [F3](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation) |
| index | The counter of a sum, for example $n$. It exists only inside the sum. | [F3](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation) |
| term | One of the numbers that a sum adds. $\sum_{n=a}^{b}$ has $b - a + 1$ terms. | [F3](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation) |
| empty sum | A sum with no terms. Its value is 0. | [F3](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation) |
| change of index | A new name and formula for the index, for example $n = 2m$, that gives the same terms. The even–odd split uses it. | [F3](/notes/maths/fft-signal-processing/01-math-foundations/f3-sigma-notation) |
| vector | A list of $N$ numbers, seen as an arrow in $N$ dimensions. A list of samples is a vector. | [F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product) |
| dot product | Multiply two vectors coordinate by coordinate, then add. Also called the inner product. It equals $\lvert a \rvert \lvert b \rvert \cos\theta$. | [F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product) |
| length of a vector ($\lvert a \rvert$) | $\sqrt{a \cdot a}$: the length of the arrow. Also called the norm. | [F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product) |
| orthogonal | Two vectors with dot product 0. In a plane, they are perpendicular. | [F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product) |
| unit vector | A vector with length 1. | [F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product) |
| basis | A set of reference directions. Every vector is a sum of amounts of them. | [F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product) |
| coordinate | The amount of one basis direction in a vector. For an orthogonal basis, it is $(v \cdot u)/(u \cdot u)$. | [F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product) |
| orthonormal basis | A basis of unit vectors that are all orthogonal to each other. Each coordinate is one dot product. | [F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product) |
| time basis | The basis of spikes [1, 0, 0, …], [0, 1, 0, …], … Its coordinates are the sample values. | [F4](/notes/maths/fft-signal-processing/01-math-foundations/f4-vectors-and-the-dot-product) |
| imaginary unit ($i$) | A number with $i^2 = -1$. The course writes $i$, not $j$. | [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) |
| complex number | A number $a + bi$ with a real part $a$ and an imaginary part $b$. Draw it as an arrow to the point $(a, b)$. | [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) |
| real part, imaginary part | The two ordinary numbers $a$ and $b$ of $a + bi$. The imaginary part does not include the $i$. | [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) |
| complex plane | A plane with the real part on the horizontal axis and the imaginary part on the vertical axis. | [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) |
| magnitude ($\lvert z \rvert$) | The length of the arrow of a complex number: $\sqrt{a^2 + b^2}$. | [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) |
| phase of a complex number ($\arg z$) | The angle of the arrow from the positive real axis, counter-clockwise positive. Compute it with atan2. | [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) |
| polar form | $z = r(\cos\theta + i\sin\theta) = r\,e^{i\theta}$, with magnitude $r$ and phase θ. | [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) |
| conjugate ($\overline{z}$) | $a - bi$: the mirror image of $a + bi$ across the real axis. $z\overline{z} = \lvert z \rvert^2$. | [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) |
| atan2 | The function `atan2(b, a)` that gives the phase of $a + bi$ in the correct quarter, from −180° to 180°. | [F5](/notes/maths/fft-signal-processing/01-math-foundations/f5-complex-numbers) |
| e (Euler's number) | The number $e \approx 2.71828$, the base of the exponential function. | [F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula) |
| derivative | The rate of change of a quantity. For a moving point, its velocity. | [F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula) |
| factorial ($n!$) | The product $1 \cdot 2 \cdots n$, with $0! = 1$. | [F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula) |
| Taylor series | A function written as an endless sum of powers, with the coefficient (n-th derivative at 0)/n!. | [F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula) |
| Euler's formula | $e^{i\theta} = \cos\theta + i\sin\theta$: the point at angle θ on the unit circle. Multiplication by it turns by θ. | [F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula) |
| counter-rotating arrows | Two arrows that turn at the same speed in opposite directions. A real cosine is two such arrows of half length. | [F6](/notes/maths/fft-signal-processing/01-math-foundations/f6-eulers-formula) |
| root of unity | A complex number $z$ with $z^N = 1$. The $N$ roots sit at equal steps of $2\pi/N$ on the unit circle and add to 0. | [F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity) |
| twiddle factor ($W_N^k$) | The root of unity $e^{-i 2\pi k/N}$: $k$ steps of $1/N$ of a turn, clockwise. It turns O[k] before it joins E[k]. | [F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity) |
| geometric series | A sum $1 + r + \dots + r^{N-1}$ with a fixed ratio $r$. For $r \ne 1$ it equals $(r^N - 1)/(r - 1)$. | [F7](/notes/maths/fft-signal-processing/01-math-foundations/f7-roots-of-unity) |
| modulo ($n \bmod N$) | The remainder of $n$ after division by $N$, from 0 to $N - 1$. $12 \bmod 8 = 4$. | [F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary) |
| clock arithmetic | Arithmetic that keeps only $n \bmod N$. Exponents of $W_N$ work this way. | [F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary) |
| power of two | A number $2^m$: 1, 2, 4, 8, 16, … A radix-2 FFT needs $N = 2^m$. | [F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary) |
| log₂ | $\log_2 N = m$ when $2^m = N$: the number of halvings from $N$ to 1. $\log_2 1024 = 10$. | [F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary) |
| binary | Numbers written with the digits 0 and 1, with place values 1, 2, 4, 8, … $6 = 110_2$. | [F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary) |
| bit | One binary digit: 0 or 1. The last bit tells if a number is even or odd. | [F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary) |
| bit reversal | Write $n$ with $\log_2 N$ bits, read the bits backwards, and read the result as a number. | [F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary) |
| bit-reversed order | The list of bit-reversed sample numbers: 0, 4, 2, 6, 1, 5, 3, 7 for $N = 8$. The input order of the FFT network. | [F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary) |
| radix-2 | An FFT that splits every problem into 2 equal halves. It needs $N$ to be a power of two. | [F8](/notes/maths/fft-signal-processing/01-math-foundations/f8-clock-arithmetic-log-binary) |

## 02 Signals and frequency

| Term | Plain meaning | First seen |
|---|---|---|
| $x(t)$ | The value of the signal $x$ at the time $t$. It is not $x$ multiplied by $t$. | [L1](/notes/maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is) |
| continuous signal | A signal that has a value at every instant, for example the real air pressure. | [L1](/notes/maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is) |
| sine wave | The simplest smooth oscillation, $A\sin(2\pi f t + \varphi)$. It repeats the same shape again and again. | [L1](/notes/maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is) |
| component | One simple wave inside a mixture. | [L1](/notes/maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is) |
| composite signal | A signal that is a sum of several components. | [L1](/notes/maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is) |
| point-by-point addition | At each instant, add the values of the components. The frequencies do not add. | [L1](/notes/maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is) |
| Fourier analysis | The method that finds the components of a signal: their frequencies, amplitudes and phases. | [L1](/notes/maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is) |
| FFT | Fast Fourier transform. A fast method to compute the DFT. Full lessons: part 04. | [L1](/notes/maths/fft-signal-processing/02-signals-and-frequency/l1-what-a-signal-is) |
| peak-to-peak | The highest value minus the lowest value. For a sine wave, it is $2A$. | [L3](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude) |
| gain | A number that multiplies every value of a signal. A volume knob sets a gain. | [L3](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude) |
| RMS | Root mean square: square each value, take the mean, take the square root. For a sine over whole cycles, it is $A/\sqrt{2}$. | [L3](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude) |
| decibel (dB) | A log unit that compares two amplitudes: $20\log_{10}(A_2/A_1)$. Double the amplitude gives about +6.02 dB. | [L3](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude) |
| full scale | The largest value that the storage can hold. 16-bit audio holds −32,768 to 32,767. | [L3](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude) |
| clipping | The storage keeps the limit for every value beyond full scale. The true values are lost, and new frequencies appear. | [L3](/notes/maths/fft-signal-processing/02-signals-and-frequency/l3-amplitude) |
| angle of the wave | The number inside the sine, $2\pi f t + \varphi$. The frequency sets how fast it grows. The phase sets where it starts. | [L4](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase) |
| time shift ($t_0$) | The time by which a phase moves a wave: $t_0 = \varphi/(2\pi f)$. A positive value means earlier. | [L4](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase) |
| quarter cycle | One quarter of a full cycle: $\pi/2$ radians, or 90°. | [L4](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase) |
| cosine wave | $A\cos(2\pi f t + \varphi)$. It is a sine wave with $\pi/2$ more phase. | [L4](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase) |
| reference wave | The wave that we measure a phase from. Chapter 2 uses a sine. The DFT uses a cosine, so a pure sine reports −90°. | [L4](/notes/maths/fft-signal-processing/02-signals-and-frequency/l4-phase) |
| time domain | A description of a signal as its value at each instant. | [L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains) |
| frequency domain | A description of a signal as the amplitude and the phase of each frequency in it. | [L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains) |
| spectrum | The frequency-domain description of a signal. The DFT computes it from samples. | [L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains) |
| amplitude spectrum | The amplitude of each frequency, often drawn as bars against frequency. | [L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains) |
| phase spectrum | The phase of each frequency. Without it, you cannot rebuild the signal. | [L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains) |
| synthesis | The change from the frequency domain to the time domain: build each component and add. | [L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains) |
| analysis | The change from the time domain to the frequency domain: find the components of a signal. | [L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains) |
| transform | A fixed rule that changes one description of a signal into the other. The DFT is a transform. | [L5](/notes/maths/fft-signal-processing/02-signals-and-frequency/l5-two-domains) |
| sampling | Reading a continuous signal at equal time steps and keeping only those values. | [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) |
| sample number ($n$) | The position of a sample in the list: 0, 1, 2, and so on. Always a whole number. | [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) |
| $x[n]$ | The value of sample $n$: $x[n] = x(n/f_s)$. Square brackets hold a sample number, round brackets hold a time. | [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) |
| sample time ($t_n$) | The instant of sample $n$: $t_n = n\,\Delta t = n/f_s$. | [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) |
| converter (ADC) | Analog-to-digital converter. It measures the microphone voltage at each sample time and stores it as an integer. | [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) |
| quantization | Rounding each sample to the nearest value that the storage can hold. | [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) |
| bit depth | The number of bits for one sample. 16 bits give 65,536 possible integers. | [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) |
| 16-bit PCM | Plain storage of samples as 16-bit integers, from −32,768 to 32,767, 2 bytes each. | [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) |
| Nyquist frequency | Half the sample rate, $f_s/2$. Every component must be strictly below it. | [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) |
| aliasing | A component above $f_s/2$ gives the same samples as a lower frequency. Full lesson: L26. | [L6](/notes/maths/fft-signal-processing/02-signals-and-frequency/l6-samples) |

## 03 Matching to DFT

| Term | Plain meaning | First seen |
|---|---|---|
| teaching signal | The 8-sample signal of part 03: $x[n] = \cos(2\pi n/8) + 0.5\sin(2\pi \cdot 2n/8)$. Its spectrum is X = [0, 4, −2i, 0, 0, 0, 2i, 4]. | [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score) |
| probe | A candidate wave that we compare with the signal. It has the same number of samples as the signal. | [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score) |
| probe frequency ($k$) | The number of full cycles that a probe makes over the N samples. | [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score) |
| matching score | Multiply the signal and a probe point by point, then add the N products. One number that tells how well the probe matches. | [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score) |
| inner product | The name that mathematicians use for the matching score. For lists of real numbers, it is the dot product. | [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score) |
| reinforcement | Most products of a score have the same sign, so the sum grows. It happens when the probe matches a part of the signal. | [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score) |
| cancellation | The positive and negative products of a score have the same total size, so the sum is 0. | [L7](/notes/maths/fft-signal-processing/03-matching-to-dft/l7-matching-score) |
| sweep | Compute the matching score for every probe frequency k = 0, 1, …, N − 1. | [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) |
| cosine probe ($c_k$) | The probe $c_k[n] = \cos(2\pi k n/N)$. It is blind to a sine at its own frequency. | [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) |
| sine probe ($s_k$) | The probe $s_k[n] = \sin(2\pi k n/N)$. It finds the sine part that the cosine probe misses. | [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) |
| cosine score ($C[k]$) | The matching score of the signal against the cosine probe of bin k. It is the real part of X[k]. | [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) |
| sine score ($S[k]$) | The matching score of the signal against the sine probe of bin k. Minus this score is the imaginary part of X[k]. | [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) |
| whole-cycle wave | A wave that makes a whole number of cycles over the N samples. Its N samples sum to 0 unless its number of cycles is 0 or a multiple of N. | [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) |
| product-to-sum rule | $\cos a \cos b = \tfrac{1}{2}\cos(a-b) + \tfrac{1}{2}\cos(a+b)$. It explains why probes that do not match score exactly 0. | [L8](/notes/maths/fft-signal-processing/03-matching-to-dft/l8-sweep-and-cancellation) |
| unit impulse ($\delta_m$) | The list that is 1 at sample m and 0 at every other sample. | [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality) |
| frequency basis | A basis of whole-cycle waves: real cosine and sine patterns, or the complex DFT patterns. | [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality) |
| squared length | The dot product of a vector with itself. N/2 for a real cosine or sine pattern with 0 < k < N/2, and N for a complex DFT pattern. | [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality) |
| DFT pattern ($e_k$) | The complex list $e_k[n] = e^{i 2\pi k n/N}$. The N patterns are orthogonal, and the coordinates of a signal along them are X[k]/N. | [L9](/notes/maths/fft-signal-processing/03-matching-to-dft/l9-basis-and-orthogonality) |
| complex probe | The probe $e^{-i 2\pi k n/N} = \cos(2\pi k n/N) - i\sin(2\pi k n/N)$. It computes the cosine score and the sine score in one sum. | [L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe) |
| phase of X[k] | The angle of the arrow of X[k]. It tells where in its cycle the wave starts, measured from a cosine. A pure sine gives −90°. | [L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe) |
| power ($\lvert X[k] \rvert^2$) | The squared magnitude. It is a different quantity from the magnitude. | [L10](/notes/maths/fft-signal-processing/03-matching-to-dft/l10-the-complex-probe) |
| DFT | Discrete Fourier Transform: $X[k] = \sum_{n=0}^{N-1} x[n]\, e^{-i 2\pi k n/N}$, with no 1/N. Same as numpy.fft.fft. | [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula) |
| bin ($k$) | One output position of the DFT. Its probe makes k cycles over the N samples. | [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula) |
| coefficient ($X[k]$) | The complex score of bin k. | [L11](/notes/maths/fft-signal-processing/03-matching-to-dft/l11-the-dft-formula) |
| tip to tail | A method to add arrows: start each arrow at the tip of the arrow before it. The end of the chain is the sum. | [L12](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors) |
| chain | The N term arrows of one bin, placed tip to tail. It starts at 0 and ends at X[k]. | [L12](/notes/maths/fft-signal-processing/03-matching-to-dft/l12-rotating-vectors) |
| inverse DFT | $x[n] = \frac{1}{N}\sum_{k=0}^{N-1} X[k]\, e^{+i 2\pi k n/N}$. It rebuilds the samples from the coefficients. Same as numpy.fft.ifft. | [L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft) |
| round trip | A forward DFT followed by an inverse DFT. It returns the original samples, apart from floating-point error. | [L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft) |
| conjugate pair | Two bins k and N − k of a real signal. Their coefficients are conjugates, and together they rebuild one real wave. | [L13](/notes/maths/fft-signal-processing/03-matching-to-dft/l13-inverse-dft) |

## 04 FFT

| Term | Plain meaning | First seen |
|---|---|---|
| direct DFT | The DFT computed straight from its formula: N products for each of the N bins, so $N^2$ complex multiplications. | [L14](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft) |
| complex multiplication | The product of two complex numbers: $(a+bi)(c+di) = (ac-bd) + (ad+bc)i$. It needs 4 real multiplications and 2 real additions. | [L14](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft) |
| operation count | The number of arithmetic operations that a method needs. It is not a time measurement. | [L14](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft) |
| probe table | The N × N table of probe values of the DFT. Row k, column n holds $W_N^{kn}$. It holds only N different values. | [L14](/notes/maths/fft-signal-processing/04-fft/l14-cost-of-the-direct-dft) |
| even samples, odd samples | The samples with an even index, $x[2m]$, and with an odd index, $x[2m+1]$. The FFT splits the signal into these two halves. | [L15](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split) |
| half-size DFT | A DFT of N/2 points, for example the 4-point DFT of the even samples when N = 8. | [L15](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split) |
| E[k] | The DFT of the even samples: $E[k] = \sum_m x[2m]\, W_{N/2}^{mk}$. | [L15](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split) |
| O[k] | The DFT of the odd samples: $O[k] = \sum_m x[2m+1]\, W_{N/2}^{mk}$. | [L15](/notes/maths/fft-signal-processing/04-fft/l15-even-odd-split) |
| periodic | A list is periodic with period P when the value at k + P equals the value at k. E and O are periodic with period N/2. | [L16](/notes/maths/fft-signal-processing/04-fft/l16-two-facts) |
| pair formula | $X[k] = E[k] + W_N^k O[k]$ and $X[k+N/2] = E[k] - W_N^k O[k]$, for k = 0 to N/2 − 1. One twiddle product gives two outputs. | [L16](/notes/maths/fft-signal-processing/04-fft/l16-two-facts) |
| twiddle product | The product $t = W_N^k O[k]$. The butterfly computes it once and uses it twice. | [L16](/notes/maths/fft-signal-processing/04-fft/l16-two-facts) |
| butterfly | One combining step: two inputs, one twiddle multiplication, one sum and one difference, two outputs. | [L17](/notes/maths/fft-signal-processing/04-fft/l17-the-butterfly) |
| trivial twiddle | A twiddle of 1, −1, i or −i. It only swaps or negates the real and imaginary parts, so it needs no real multiplication. | [L17](/notes/maths/fft-signal-processing/04-fft/l17-the-butterfly) |
| recursion | A method that solves a problem with smaller copies of the same problem. | [L18](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network) |
| base case | The smallest problem of a recursion, with a direct answer. For the FFT: a 1-point DFT is the sample itself. | [L18](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network) |
| stage | One column of butterflies in the FFT network. Stage s builds DFTs of $2^s$ points. An N-point FFT has $\log_2 N$ stages of N/2 butterflies. | [L18](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network) |
| network | The diagram of all FFT stages: which values each butterfly reads and writes, and which twiddle it uses. Also called a signal-flow graph. | [L18](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network) |
| natural order | The order 0, 1, 2, ..., N − 1. The radix-2 network of this subject gives its outputs in natural order. | [L18](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network) |
| radix-2 decimation in time | The FFT variant of this subject. It splits the samples (time) into even and odd halves again and again. Inputs in bit-reversed order, outputs in natural order. | [L18](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network) |
| span | The distance between the two rows of a butterfly: 1, 2, 4, ... in stages 1, 2, 3, ... | [L18](/notes/maths/fft-signal-processing/04-fft/l18-recursion-and-the-network) |
| call tree | The diagram of all calls of a recursive function. The recursive FFT makes 2N − 1 calls in $\log_2 N + 1$ levels. | [L19](/notes/maths/fft-signal-processing/04-fft/l19-recursive-fft-code) |
| overhead | Time that a program spends on work outside the arithmetic, for example function calls and new arrays. The operation count does not include it. | [L19](/notes/maths/fft-signal-processing/04-fft/l19-recursive-fft-code) |
| in place | A method that writes its results into the same array that holds its inputs, with no second array of size N. | [L20](/notes/maths/fft-signal-processing/04-fft/l20-iterative-fft-and-bugs) |
| bit-reversal permutation | The first step of the iterative FFT: swap a[i] and a[rev(i)] once for each pair, so that the values stand in bit-reversed order. | [L20](/notes/maths/fft-signal-processing/04-fft/l20-iterative-fft-and-bugs) |
| block size | The size M of the DFTs that one stage of the iterative FFT builds: 2, 4, ..., N. Its butterflies use $W_M^j$. | [L20](/notes/maths/fft-signal-processing/04-fft/l20-iterative-fft-and-bugs) |
| twiddle step | The jump through a table of $W_N^m$ values. A stage with block size M uses every (N/M)-th entry. | [L20](/notes/maths/fft-signal-processing/04-fft/l20-iterative-fft-and-bugs) |
| recurrence | A formula that gives the cost of a problem of size N from the cost of smaller problems, for example $T(N) = 2T(N/2) + cN$. | [L21](/notes/maths/fft-signal-processing/04-fft/l21-why-it-is-fast) |
| O(N log N) | "Grows like N log N": for large N, the work is at most a constant times $N\log N$. | [L21](/notes/maths/fft-signal-processing/04-fft/l21-why-it-is-fast) |
| speed-up ratio | The direct count divided by the FFT count, for example $N^2 / ((N/2)\log_2 N) = 204.8$ for N = 1024. | [L21](/notes/maths/fft-signal-processing/04-fft/l21-why-it-is-fast) |
| floating-point number | The way a computer stores a real number. NumPy's default `float64` holds about 16 significant decimal digits. | [L21](/notes/maths/fft-signal-processing/04-fft/l21-why-it-is-fast) |
| rounding error | The small error that a floating-point operation can add. The FFT and the direct DFT differ only by rounding errors. | [L21](/notes/maths/fft-signal-processing/04-fft/l21-why-it-is-fast) |
| radix | The size of the small DFTs that one stage of an FFT combines: 2 for radix 2, 4 for radix 4. | [L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts) |
| Cooley–Tukey FFT | The family of FFTs that split a DFT of size $N = N_1 N_2$ into DFTs of sizes $N_1$ and $N_2$, with twiddles between them. | [L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts) |
| split-radix FFT | An FFT for N a power of 2 that uses radix 2 for the even samples and radix 4 for the odd samples. It needs fewer flops than radix 2. | [L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts) |
| mixed radix | An FFT that uses different radixes in different stages, for example radix 2 and radix 5 for N = 400. | [L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts) |
| Rader's algorithm | An FFT for a prime N. It reorders the samples and changes the DFT into a convolution of length N − 1. | [L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts) |
| Bluestein's algorithm | An FFT for any N, also called the chirp-z method. It changes the DFT into a convolution and computes it with power-of-2 FFTs. | [L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts) |
| real-input FFT (`rfft`) | An FFT for real samples. It returns only the N // 2 + 1 bins that the mirror does not repeat, at about half the cost. | [L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts) |
| flop | One real addition or one real multiplication, counted in operation counts. | [L22](/notes/maths/fft-signal-processing/04-fft/l22-other-ffts) |

## 05 Reading spectra

| Term | Plain meaning | First seen |
|---|---|---|
| window | The finite stretch of N samples that one DFT uses. It lasts $N/f_s$ seconds. | [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) |
| fits the window | A sinusoid fits the window when it makes a whole number of cycles in the N samples. | [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) |
| bin frequency ($f_k$) | The frequency in hertz of bin $k$: $f_k = k f_s / N$. | [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) |
| bin spacing ($\Delta f$) | The step in hertz from one bin to the next: $\Delta f = f_s / N$, which is 1 / (window length). | [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) |
| magnitude spectrum | A plot of $\lvert X[k] \rvert$ for every bin $k$. | [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) |
| DC component | The constant part of a signal, which is its average. Bin 0 holds it: the DC value is $X[0]/N$. | [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) |
| Nyquist bin | Bin $k = N/2$, for an even N. Its frequency is $f_s/2$. There, $A = \lvert X[N/2] \rvert / N$. | [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) |
| normalization | The scale factor that a library applies to the DFT: none, $1/N$ or $1/\sqrt{N}$. NumPy applies none to the forward FFT by default. | [L23](/notes/maths/fft-signal-processing/05-reading-spectra/l23-hertz-and-amplitude) |
| mirror bin | Bin $N - k$, the partner of bin $k$. | [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror) |
| conjugate symmetry | For real input, $X[N-k] = \overline{X[k]}$: the same magnitude and the opposite phase. Another name is Hermitian symmetry. | [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror) |
| negative frequency | The frequency of an arrow that turns clockwise. For $N/2 < k < N$, bin $k$ holds $(k - N) f_s / N$. | [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror) |
| one-sided spectrum | Bins 0 to $N/2$ only. For real input, they hold all the information. `np.fft.rfft` returns them. | [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror) |
| `np.fft.fftfreq` | A NumPy function that gives the frequency label of each bin of the full FFT. Its argument `d` is the time step $1/f_s$. | [L24](/notes/maths/fft-signal-processing/05-reading-spectra/l24-the-mirror) |
| spectral leakage | Energy of one tone that spreads into many bins. It happens when the tone does not fit the window. | [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) |
| periodic extension | The signal that the DFT assumes: the window repeated again and again, every N samples. | [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) |
| kink | A point where the periodic extension changes its value or its direction suddenly. A kink causes leakage. | [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) |
| window function ($w[n]$) | A list of N weights that multiplies the samples before the DFT. | [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) |
| rectangular window | The window function $w[n] = 1$ for every $n$. It is the same as no window function. | [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) |
| Hann window | The window function $w[n] = 0.5 - 0.5\cos(2\pi n / N)$ (periodic form). The symmetric form divides by $N - 1$. | [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) |
| main lobe | The central hump of the spectrum of one tone. Rectangular window: 2 bins wide. Hann window: 4 bins wide. | [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) |
| side lobe | A smaller hump next to the main lobe. The first side lobe is about −13.3 dB (rectangular) or about −31.5 dB (Hann). | [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) |
| coherent gain | The average value of a window function, $\frac{1}{N}\sum w[n]$. It is exactly 0.5 for the periodic Hann window. | [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) |
| scalloping loss | The drop of the peak magnitude when a tone falls between two bins. | [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) |
| zero padding | Zeros added to the end of the samples before the FFT. It gives more points on the same curve, not more resolution. | [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) |
| frequency resolution | The smallest gap between two tones that the spectrum can show as two separate peaks. A longer window gives finer resolution. | [L25](/notes/maths/fft-signal-processing/05-reading-spectra/l25-leakage-and-windows) |
| alias | The lower frequency that a high frequency imitates in the samples. | [L26](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing) |
| apparent frequency ($f_a$) | The frequency that the samples and the DFT show, between 0 and $f_s/2$. With $r = f \bmod f_s$: $f_a = r$ if $r \le f_s/2$, else $f_s - r$. | [L26](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing) |
| folding | The rule that maps every frequency into the range 0 to $f_s/2$, like a paper strip folded at every multiple of $f_s/2$. | [L26](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing) |
| low-pass filter | A filter that passes low frequencies and blocks high frequencies. | [L26](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing) |
| anti-aliasing filter | A low-pass filter before sampling. It removes the content at and above $f_s/2$. | [L26](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing) |
| resampling | A change of the sample rate of a digital signal, for example from 48 kHz to 16 kHz. It needs a low-pass filter first. | [L26](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing) |
| sampling theorem | If a signal has content only below $f_s/2$, its samples fully determine it. Another name is the Nyquist–Shannon theorem. | [L26](/notes/maths/fft-signal-processing/05-reading-spectra/l26-aliasing) |

## 06 Fourier family and duality

| Term | Plain meaning | First seen |
|---|---|---|
| periodic signal | A signal with $x(t + T) = x(t)$ for every $t$. It repeats with period $T$. | [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) |
| fundamental frequency ($f_0$, $F_0$) | The repeat rate of a periodic signal: $f_0 = 1/T$. In voiced speech, $F_0$ is the repeat rate of the vocal-fold pulses. | [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) |
| harmonic | A sine or a cosine at a whole-number multiple $k f_0$ of the fundamental frequency. It makes $k$ cycles in one period. | [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) |
| integral | The limit of a sum of thin strips (height × width) as the width goes to 0. The signed area under a curve. | [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) |
| Fourier series | A periodic signal written as a constant plus a sum of harmonics: $x(t) = \sum_k c_k e^{i 2\pi k t/T}$. | [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) |
| Fourier coefficient ($a_k$, $b_k$, $c_k$) | The amount of one harmonic in a periodic signal. $c_k = \frac{1}{T}\int_0^T x(t) e^{-i 2\pi k t/T} dt$. | [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) |
| constant term ($a_0$) | The average value of a signal over one period. Engineers also call it the DC term. | [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) |
| partial sum ($S_M$) | A Fourier series stopped after $M$ terms. | [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) |
| square wave | A signal that is +1 for the first half of each period and −1 for the second half. | [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) |
| Gibbs phenomenon | The overshoot of a partial sum next to a jump. As the number of terms grows, it approaches about 9% of the jump (0.0895 × jump). It does not go to 0. | [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) |
| band-limited signal | A signal with no content above some highest frequency. | [L28](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l28-fourier-series) |
| non-periodic signal | A signal that does not repeat, for example one pulse. | [L29](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l29-fourier-transform) |
| Fourier transform ($X(f)$) | $X(f) = \int x(t) e^{-i 2\pi f t} dt$. The matching score of a signal with the complex probe at every frequency. | [L29](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l29-fourier-transform) |
| inverse Fourier transform | $x(t) = \int X(f) e^{i 2\pi f t} df$. It rebuilds the signal from $X(f)$. | [L29](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l29-fourier-transform) |
| spectral density | An amount per hertz. The Fourier transform $X(f)$ is a density, not an amount at one frequency. | [L29](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l29-fourier-transform) |
| rectangular pulse | A signal that is 1 for $\lvert t \rvert < \tau/2$ and 0 outside. $\tau$ is the pulse width. | [L29](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l29-fourier-transform) |
| sinc function | $\mathrm{sinc}(u) = \sin(\pi u)/(\pi u)$, with $\mathrm{sinc}(0) = 1$. NumPy's `np.sinc` uses this definition. | [L29](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l29-fourier-transform) |
| Gaussian | The bell curve $e^{-\pi t^2}$. Its Fourier transform is the same curve, $e^{-\pi f^2}$. | [L29](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l29-fourier-transform) |
| transform pair | A signal and its transform, written $x(t) \leftrightarrow X(f)$. | [L29](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l29-fourier-transform) |
| discrete | Defined only at separate, equally spaced points: samples in time, or bins in frequency. | [L30](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l30-the-four-members) |
| continuous | Defined at every point of an axis. | [L30](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l30-the-four-members) |
| line spectrum | A discrete spectrum: separate values at separate frequencies, as in a Fourier series. | [L30](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l30-the-four-members) |
| DTFT (discrete-time Fourier transform) | The spectrum of a list of samples that does not repeat: $X(f) = \sum_n x[n] e^{-i 2\pi f n/f_s}$. It repeats every $f_s$. | [L30](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l30-the-four-members) |
| geometric sum | $\sum_{n=0}^{M-1} r^n = (1 - r^M)/(1 - r)$ for $r \ne 1$. | [L30](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l30-the-four-members) |
| Fourier family | The four transforms: Fourier series, Fourier transform, DTFT and DFT. Discrete in one domain means periodic in the other. | [L30](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l30-the-four-members) |
| circular shift | A shift of a DFT input where the samples that leave one end enter at the other end (`np.roll`). | [L31](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l31-duality-pairs) |
| linear phase | A phase that changes in proportion to the frequency. A time shift makes a linear phase. | [L31](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l31-duality-pairs) |
| scaling | A squeeze or a stretch of the time axis: $x(at) \leftrightarrow \frac{1}{\lvert a \rvert}X(f/a)$. | [L31](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l31-duality-pairs) |
| duality | The forward and inverse transforms have the same form, so every pair also works with time and frequency swapped. | [L31](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l31-duality-pairs) |
| modulation | A multiplication of a signal by a carrier. It moves the spectrum to the carrier frequency. | [L31](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l31-duality-pairs) |
| carrier | The high-frequency cosine in modulation, at frequency $f_c$. | [L31](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l31-duality-pairs) |
| sideband | A copy of a signal spectrum next to the carrier frequency. | [L31](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l31-duality-pairs) |
| time reversal | Playing a signal backwards. For a real signal, it changes the spectrum to its conjugate. | [L31](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l31-duality-pairs) |
| Parseval's theorem | The energy of a signal is the same in both domains: $\sum \lvert x[n] \rvert^2 = \frac{1}{N}\sum \lvert X[k] \rvert^2$. | [L31](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l31-duality-pairs) |
| filter | A system that changes a signal, for example to remove noise. | [L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem) |
| impulse response ($h[n]$) | The output of a filter when the input is a unit impulse. | [L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem) |
| LTI system | A linear, time-invariant system. Its output is the convolution of the input with its impulse response. | [L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem) |
| convolution ($x * h$) | $y[n] = \sum_m x[m] h[n - m]$: flip, shift, multiply, add. The output of an LTI system. | [L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem) |
| circular convolution ($x \circledast h$) | Convolution of two lists of length $N$ where the indices wrap modulo $N$. Its DFT is $X[k]H[k]$. | [L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem) |
| moving average | A filter that replaces each sample by the average of $M$ neighbors. A low-pass filter. | [L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem) |
| frequency response ($H[k]$, $H(f)$) | The transform of the impulse response. It tells how much a filter scales and rotates each frequency. | [L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem) |
| FIR filter | A filter with a finite impulse response of $M$ values (taps). | [L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem) |
| overlap-add | A method that convolves a long signal block by block and adds the overlapping tails. | [L32](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l32-convolution-theorem) |
| window duration ($D$) | The length of one frame in seconds: $D = N/f_s$. The bin spacing is $1/D$. | [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty) |
| time resolution | The shortest time detail that a spectrum can follow. It is about one window duration. | [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty) |
| time spread ($\sigma_t$), frequency spread ($\sigma_f$) | The standard deviations of $\lvert x(t) \rvert^2$ over time and of $\lvert X(f) \rvert^2$ over frequency. | [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty) |
| Gabor limit | $\sigma_t \sigma_f \ge 1/(4\pi)$ for every signal. Only the Gaussian reaches it. | [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty) |
| Cauchy–Schwarz inequality | A dot product is never larger than the product of the two lengths. | [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty) |
| formant | A broad peak in the spectrum of speech, made by a resonance of the vocal tract. | [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty) |
| wideband spectrogram | A spectrogram with a short window (about 5 ms). It shows pulses and formants, but no single harmonics. | [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty) |
| narrowband spectrogram | A spectrogram with a long window (about 30 ms). It shows single harmonics, but blurs fast changes. | [L33](/notes/maths/fft-signal-processing/06-fourier-family-and-duality/l33-uncertainty) |

## 07 Speech time–frequency

| Term | Plain meaning | First seen |
|---|---|---|
| frame | A short piece of the signal that the STFT analyzes at one time. Speech often uses 400 samples (25 ms at 16 kHz). | [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram) |
| window length ($N$, `n_fft`) | The number of samples in one frame. It sets the bin spacing $f_s/N$. | [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram) |
| hop (hop length, $H$) | The number of samples from the start of one frame to the start of the next frame. Speech often uses 160 samples (10 ms). | [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram) |
| overlap | The samples that two neighbor frames share: $N - H$. 240 samples (60%) for $N$ = 400 and $H$ = 160. | [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram) |
| frame rate | The number of frames in one second: $f_s/H$. 100 frames per second for a 10 ms hop. | [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram) |
| STFT (short-time Fourier transform) | A window and one FFT for each frame. The result is a grid $X[k, m]$ of bins against frames. | [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram) |
| spectrogram | A picture of the STFT: time across, frequency up, power as a color. | [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram) |
| center padding | $N/2$ extra samples on each side of the signal, so that frame $m$ has its center at sample $m H$. | [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram) |
| chirp | A tone whose frequency changes with time. A linear chirp changes by the same number of hertz in each second. | [L34](/notes/maths/fft-signal-processing/07-speech-time-frequency/l34-stft-and-spectrogram) |
| inverse STFT (ISTFT) | The operation that rebuilds a signal from an STFT grid. | [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft) |
| window sum | The sum of all shifted copies of the window at one sample: $\sum_m w[t - mH]$. | [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft) |
| COLA condition | Constant overlap-add: the window sum has the same value at every sample. The periodic Hann window meets it at $H = N/2$ and $H = N/4$. | [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft) |
| periodic Hann window | $w[n] = 0.5 - 0.5\cos(2\pi n/N)$. The default of `torch.hann_window` and of `scipy.signal.get_window("hann", N)`. | [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft) |
| symmetric Hann window | $w[n] = 0.5 - 0.5\cos(2\pi n/(N-1))$, with 0 at both ends. `np.hanning` gives it. | [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft) |
| weighted overlap-add (WOLA) | Overlap-add after a second multiplication of each frame by the window. | [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft) |
| least-squares ISTFT | Weighted overlap-add, then a division by the sum of the squared windows. PyTorch and librosa use it. | [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft) |
| NOLA condition | Nonzero overlap-add: the sum of the squared windows is never 0 inside the signal. The ISTFT needs it. | [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft) |
| consistent STFT | A grid that is the STFT of some signal. A changed grid is usually not consistent. | [L35](/notes/maths/fft-signal-processing/07-speech-time-frequency/l35-inverse-stft) |
| semitone | One piano step. 12 semitones double the frequency. | [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel) |
| mel scale | A pitch scale from listening tests. About linear below 1000 Hz and about logarithmic above. | [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel) |
| HTK mel formula | $m = 2595 \log_{10}(1 + f/700)$. About 1000 mel at 1000 Hz. The default of torchaudio `MelSpectrogram`. | [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel) |
| Slaney mel formula | 3 mel per 200 Hz below 1000 Hz, logarithmic above. 15 mel at 1000 Hz. The default of librosa and the scale of Whisper. | [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel) |
| filterbank | A set of filters. Each filter gives one number from one spectrum. | [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel) |
| triangle filter | A weight curve that rises in a straight line from 0 to 1, then falls to 0. | [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel) |
| edge points | The $n_{\text{mels}} + 2$ frequencies where the mel triangles start, peak and stop. | [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel) |
| Slaney normalization | A factor $2/(\text{width in Hz})$ on each triangle, so that every triangle has area 1. | [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel) |
| mel spectrogram | The mel filterbank applied to every frame of a power spectrogram. Shape $n_{\text{mels}} \times T$. | [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel) |
| log-mel spectrogram | The log of the mel spectrogram, with a floor. Whisper reads 80 (or 128) log-mel values per 10 ms. | [L36](/notes/maths/fft-signal-processing/07-speech-time-frequency/l36-mel-and-log-mel) |
| spectral envelope | The smooth curve over the tops of the harmonics. | [L37](/notes/maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch) |
| source-filter model | Speech as a source (pulses or noise) shaped by a filter (the vocal tract). | [L37](/notes/maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch) |
| DCT-II | A transform with real cosines only. It matches a list of $M$ numbers against $M$ cosines. | [L37](/notes/maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch) |
| MFCC | Mel-frequency cepstral coefficients: the DCT-II of the log-mel values of one frame, usually the first 13. | [L37](/notes/maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch) |
| cepstrum | The inverse FFT of the log magnitude spectrum. A pitch period shows as a peak. | [L37](/notes/maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch) |
| quefrency | The index of the cepstrum, measured in samples. | [L37](/notes/maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch) |
| autocorrelation ($r[\tau]$) | The matching score of a frame with a copy of itself, shifted by $\tau$ samples. It peaks at the period. | [L37](/notes/maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch) |
| lag ($\tau$) | The shift, in samples, between a frame and its copy. | [L37](/notes/maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch) |
| parabolic interpolation | A parabola through a peak and its two neighbors. Its top gives the peak position between two whole lags or bins. | [L37](/notes/maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch) |
| octave error | A pitch estimate at half or double the true $f_0$. | [L37](/notes/maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch) |
| YIN | A pitch method with squared differences, a normalization and a threshold (de Cheveigné and Kawahara, 2002). | [L37](/notes/maths/fft-signal-processing/07-speech-time-frequency/l37-mfcc-and-pitch) |

## 08 Voice agents

| Term | Plain meaning | First seen |
|---|---|---|
| voice agent | A program that listens to speech, decides what to say, and answers with speech. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| cascade | A pipeline of separate models: speech-to-text, then a language model, then text-to-speech. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| DAC (digital-to-analog converter) | The chip that changes samples into a voltage for the speaker. It is the reverse of the ADC. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| VAD (voice activity detection) | A block that marks each frame as speech or not speech. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| turn | One stretch of talk by one speaker. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| turn detection | Deciding that the user has finished a turn, so that the agent can answer. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| end-of-speech timeout | The silence time that a turn detector waits before it declares the end of the turn. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| barge-in | The user starts to speak while the agent speaks. The agent must stop and listen. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| acoustic echo | The agent's own voice, which travels from the speaker through the room into the microphone. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| echo canceller (AEC) | A block that estimates the acoustic echo from the played signal and subtracts it from the microphone signal. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| STT (speech-to-text) | A model that changes speech into text. Also called speech recognition. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| LLM (large language model) | A model that reads text tokens and writes text tokens. It computes no FFT. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| TTS (text-to-speech) | A model that changes text into a speech waveform. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| streaming | Processing each frame soon after it arrives, before the input ends. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| batch processing | Processing the whole input after it ends. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| speech-to-speech model | One model that reads audio and writes audio, with no text step between separate models. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| full duplex | Both sides can talk at the same time, and the system hears both. | [L38](/notes/maths/fft-signal-processing/08-voice-agents/l38-pipeline-map) |
| front end | The fixed signal-processing code that changes samples into features before a neural network. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| feature | A number that a model reads, for example one value of a log-mel spectrogram. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| encoder | The part of a network that reads the features and makes one vector for each time position. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| chunk | The fixed piece of audio that a model reads at once. Whisper's chunk is 30 s. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| padding | Adding values at the end (or at both ends) of a list to reach a required length. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| trimming | Cutting a list to a required length. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| reflect padding | Center padding with a mirror copy of the samples next to the edge, without the edge sample. The default of `torch.stft`. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| power spectrogram | The table of $\lvert X[m,k] \rvert^2$ for every frame and bin. Whisper's mel step reads it. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| mel filter matrix | The table of mel filter weights: one row for each mel band, one column for each FFT bin. Whisper's is 80 × 201. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| dynamic range | The ratio between the loudest and the quietest value that a representation keeps. Whisper keeps 80 dB. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| clamp | Replacing every value below a limit by the limit. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| stride | The step of a convolution. Stride 2 halves the length. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| positional embedding | A table of vectors, one for each time position, that an encoder adds to its input. Its size fixes the input length. | [L39](/notes/maths/fft-signal-processing/08-voice-agents/l39-speech-to-text-front-end) |
| enhancement | Processing that makes speech cleaner, for example noise suppression and echo cancellation. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| noise suppression | Reducing background noise in a signal, with no copy of the noise to compare with. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| SNR (signal-to-noise ratio) | Signal power divided by noise power. In decibels: $10\log_{10}(P_S/P_D)$. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| noise power estimate ($\lambda[k]$) | The average of $\lvert Y[m,k] \rvert^2$ over frames that hold only noise, for each bin $k$. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| a priori SNR ($\xi$) | The SNR of one bin: speech power divided by noise power in that bin. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| spectral mask | The table of gains $G[m,k]$, one real gain from 0 to 1 for each time-frequency bin. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| spectral subtraction | Subtracting the noise power estimate from the power of each bin (Boll, 1979). | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| Wiener gain | The gain $\xi/(1+\xi)$. It gives the smallest mean squared error for a real gain. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| oracle mask | A mask computed from the clean speech and the noise separately. It exists only in experiments, as an upper limit. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| gain floor | The smallest allowed gain of a mask, for example 0.1 (−20 dB). | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| musical noise | Short, isolated tones that remain after a mask removes most of the noise. They sound like random whistles. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| band gain | One gain for a group of neighboring bins, as in RNNoise. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| adaptive filter | A filter that changes its coefficients while it runs, to reduce an error. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| echo path | The impulse response from the speaker to the microphone, through the room. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| double talk | The user and the agent talk at the same time. It is the hard case for an echo canceller. | [L40](/notes/maths/fft-signal-processing/08-voice-agents/l40-enhancement) |
| acoustic model | The part of a TTS system that changes text into a mel spectrogram. | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| vocoder | The part of a TTS system that changes a mel spectrogram (or other features) into samples. | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| neural vocoder | A vocoder that is a trained neural network, for example HiFi-GAN. | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| phase retrieval | Finding phases that fit a given set of STFT magnitudes. | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| Griffin-Lim algorithm | An iteration that alternates the inverse STFT and the STFT, and restores the target magnitude after every step (Griffin and Lim, 1984). | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| spectral convergence | $\lVert\, \lvert Y \rvert - A \,\rVert / \lVert A \rVert$: how far the STFT magnitude of a result is from the target magnitude $A$. | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| pseudo-inverse | The matrix that gives the least-squares solution of a system with no exact solution. NumPy: `np.linalg.pinv`. | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| GAN (generative adversarial network) | Two networks trained against each other: a generator makes samples, and a discriminator tries to tell them from real ones. | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| neural audio codec | A pair of networks that compresses audio into a few discrete numbers per frame and rebuilds the audio from them. | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| codebook | A list of vectors. A quantizer replaces a vector by the index of the nearest entry. | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| residual vector quantization (RVQ) | Quantization in stages. Each stage codes the error that the stages before it left. | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| audio token | One codebook index from a neural audio codec. | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| bitrate | The number of bits per second that a representation needs. | [L41](/notes/maths/fft-signal-processing/08-voice-agents/l41-text-to-speech-back-end) |
| latency | The time between a cause and its effect, for example between a sound and the output that reacts to it. | [L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency) |
| response latency | The time from the end of the user's speech to the first sound of the agent. | [L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency) |
| response offset | The time from the end of one person's turn to the start of the next turn. A negative offset is an overlap. | [L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency) |
| algorithmic latency | The delay that a method needs even on an infinitely fast computer, because it must wait for samples. A frame step costs one window length. | [L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency) |
| processing latency | The delay from computing: the time that the hardware needs to run the method. | [L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency) |
| lookahead | Future samples or frames that a block needs before it can give its output for the present. | [L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency) |
| real-time factor (RTF) | Processing time divided by the duration of the audio. RTF < 1 is faster than real time. | [L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency) |
| time to first token (TTFT) | The time from the request to the first output token of an LLM. | [L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency) |
| time to first audio | The time from the input text to the first output samples of a TTS system. | [L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency) |
| latency budget | A table that splits the response latency into the parts of each block. | [L42](/notes/maths/fft-signal-processing/08-voice-agents/l42-latency) |
| acceptance test | A test that decides whether a function meets its specification. | [Capstone](/notes/maths/fft-signal-processing/08-voice-agents/capstone-audio-front-end) |
| reference implementation | A trusted program that computes the same quantity, for example `librosa.stft`. | [Capstone](/notes/maths/fft-signal-processing/08-voice-agents/capstone-audio-front-end) |
| absolute tolerance | The largest allowed difference $\lvert a - b \rvert$ between a result and its reference. | [Capstone](/notes/maths/fft-signal-processing/08-voice-agents/capstone-audio-front-end) |
| relative tolerance | The largest allowed difference as a share of the size of the reference: $\lvert a - b \rvert \le r \lvert b \rvert$. | [Capstone](/notes/maths/fft-signal-processing/08-voice-agents/capstone-audio-front-end) |
| float32, float64 | Floating-point numbers with about 7 and about 16 significant decimal digits. | [Capstone](/notes/maths/fft-signal-processing/08-voice-agents/capstone-audio-front-end) |
| fixture | Test data that many tests share, for example a 440 Hz tone. | [Capstone](/notes/maths/fft-signal-processing/08-voice-agents/capstone-audio-front-end) |
