---
title: "L2: Latency and throughput metrics"
order: 2
summary: "The numbers that describe an LLM service: TTFT, ITL, TPOT and end-to-end latency, three kinds of throughput, percentiles and tail latency, SLOs and goodput, Little's law for capacity, the latency-throughput trade-off, and how vllm bench serve measures all of them."
status: not-started
tags: [inference, metrics, latency, throughput, ttft, tpot, goodput, littles-law, benchmarking]
---

## 1. The question this idea answers

"Is this deployment fast?" has no answer until you say what you measure. An LLM request has two very different phases ([L1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request)). A user waits for the first token, then reads tokens as they stream. An operator pays for GPU hours and wants many tokens per hour. These goals conflict: a bigger batch gives more tokens per second in total, but each user gets tokens more slowly.

So you need precise metrics. An interviewer expects exact definitions of TTFT, TPOT and ITL. He asks why P99 matters more than the mean, what goodput is, and how to size a deployment with Little's law. He also expects you to know how a benchmark produces these numbers, and how it can lie.

## 2. Mental model

> [!analogy] A highway at rush hour
> Throughput is the number of cars that pass a point per hour. Latency is the travel time of one car. With few cars, every car drives fast, but the road is mostly empty. With more cars, the road carries more cars per hour, and each car is a little slower.
>
> Near the capacity of the road, a small increase in traffic creates long queues, and travel time explodes. A traffic engineer sets a target such as "95% of trips under 30 minutes" and asks how many cars per hour the road can carry at that target. That number is goodput.
>
> **Where it stops working:** an LLM server is a strange road. Adding a car to a batch costs almost nothing while decode is limited by memory bandwidth ([L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)). So throughput rises steeply with batch size at first. Also, each request has two travel times, not one: the wait for the first token and the pace of the later tokens.

## 3. Terms

| Term | Plain meaning |
|---|---|
| latency | The time one request or one token takes. Always say which start and end points you mean. |
| throughput | The amount of work per second for the whole service: requests per second or tokens per second. |
| TTFT | Time to first token. From the moment the client sends the request until it receives the first output token. |
| ITL | Inter-token latency. The gap between two consecutive streamed outputs of one request. |
| TPOT | Time per output token. For one request: (end-to-end latency − TTFT) / (output tokens − 1). |
| end-to-end latency (E2E) | From sending the request to receiving the last token. |
| queue time | The time a request waits in the waiting queue before its first step. It is part of TTFT. |
| percentile | P90 is the value below which 90% of the measurements fall. P50 is the median. |
| tail latency | The slow end of the distribution, for example P99. It describes the worst experiences that still happen often. |
| SLO | Service level objective. A target such as "TTFT at most 500 ms and TPOT at most 50 ms". |
| SLO attainment | The fraction of requests that meet the SLO. |
| goodput | The rate of requests that meet the SLO. DistServe defines it per GPU, at a target SLO attainment such as 90%. |
| request rate | Requests that arrive per second, written $\lambda$ (lambda). |
| Poisson process | Random arrivals where the gaps between requests are independent and exponentially distributed. |
| burstiness | In `vllm bench serve`, a number that makes arrivals more clustered (below 1) or more regular (above 1). |
| concurrency | The number of requests inside the system at one moment: waiting plus running. |
| Little's law | $L = \lambda W$: average concurrency equals arrival rate times average time in the system. |
| utilization | The fraction of time a resource is busy, written $\rho$ (rho). |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. Latency: four metrics on one timeline

### 4.1 The definitions

> [!key] Two latencies per request
> A user feels two things: how long until text starts (TTFT), and how fast text then flows (TPOT or ITL). They have different causes. TTFT depends on queue time and prefill, which is compute-bound. TPOT depends on decode, which is memory-bound and grows with batch size.

Take one request. Let $t_0$ be the send time, and let $t_1, t_2, \dots, t_n$ be the arrival times of its $n$ output tokens at the client.

$$
\mathrm{TTFT} = t_1 - t_0
$$

$$
\mathrm{ITL}_i = t_i - t_{i-1} \quad \text{for } i = 2, \dots, n
$$

$$
\mathrm{E2E} = t_n - t_0
$$

$$
\mathrm{TPOT} = \frac{\mathrm{E2E} - \mathrm{TTFT}}{n - 1} = \frac{t_n - t_1}{n - 1}
$$

The vLLM benchmark docs use the same TPOT formula. They say it "is calculated once per request, excluding the first token, and then aggregated across requests". DistServe defines TPOT as "the average time taken to generate a token for each request".

Rearrange the TPOT formula and you get the end-to-end formula:

$$
\mathrm{E2E} = \mathrm{TTFT} + \mathrm{TPOT} \times (n - 1)
$$

This is exact, not an approximation, because TPOT is defined from E2E and TTFT. The $n - 1$ appears because the first token belongs to TTFT. DistServe states the same relation in its first footnote.

### 4.2 ITL and TPOT are not the same

With normal decoding, each streamed output holds one token. Then the ITL values of a request average to its TPOT. With speculative decoding ([L6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding)), one engine step can accept several tokens. The server then streams them in one output. The vLLM docs explain: "ITL records only the gaps between streamed outputs; it does not add zero-duration gaps for tokens in the same output. TPOT instead amortizes the request's decoding time over every output token."

![Alt text: two 5-token requests, one with ITL and TPOT of 40 ms, one with bundled outputs, ITL 40 ms and TPOT 20 ms](/notes/media/llm-systems/figures/04-2-metric-timeline.svg)

> [!example] Worked example: the same 5 tokens, two ways
> **Normal decoding.** Tokens arrive at 100, 140, 180, 220 and 260 ms.
>
> - TTFT = 100 ms.
> - ITL samples: 40, 40, 40, 40 ms. Mean ITL = 40 ms.
> - E2E = 260 ms.
> - TPOT = (260 − 100) / (5 − 1) = 160 / 4 = 40 ms.
> - Check: TTFT + TPOT × 4 = 100 + 160 = 260 ms = E2E.
>
> **Speculative decoding.** Outputs arrive at 100 ms (1 token), 140 ms (1 token) and 180 ms (3 tokens). This is the example of the vLLM docs.
>
> - TTFT = 100 ms.
> - ITL samples: 40 and 40 ms. Mean ITL = 40 ms. The 3 tokens of the last output add no samples.
> - E2E = 180 ms.
> - TPOT = (180 − 100) / (5 − 1) = 80 / 4 = 20 ms.
>
> The user of the second request reads tokens twice as fast on average, but its ITL looks the same. Compare speculative decoding by TPOT or by E2E, not by ITL.

A second difference: the mean ITL over a benchmark weights every gap equally. A request with 1,000 tokens contributes 999 gaps, and a request with 10 tokens contributes 9. The mean TPOT weights every request equally. So mean ITL mostly describes long answers.

### 4.3 Compute the metrics from timestamps

```python
import numpy as np

def request_metrics(t_send, token_times):
    """token_times: arrival time of each output token at the client, in seconds."""
    t = np.asarray(token_times)
    ttft = t[0] - t_send
    e2e = t[-1] - t_send
    itls = np.diff(t)                               # n - 1 gaps
    tpot = (e2e - ttft) / (len(t) - 1) if len(t) > 1 else 0.0
    return ttft, itls, tpot, e2e

ttft, itls, tpot, e2e = request_metrics(0.0, [0.100, 0.140, 0.180, 0.220, 0.260])
print(round(ttft, 3), itls.round(3), round(tpot, 3), round(e2e, 3))
```

Output:

```text
0.1 [0.04 0.04 0.04 0.04] 0.04 0.26
```

- `np.diff` returns the $n - 1$ gaps between neighbors.
- The `if len(t) > 1` guard handles a one-token answer. vLLM's benchmark makes the same choice: "if output_len <= 1, we regard tpot as 0 for goodput".

### 4.4 Where the clock starts

The same name can mean different intervals. Always ask where the measurement happens.

| Measured at | TTFT includes | Example |
|---|---|---|
| The client | network both ways, gateway, tokenization, queue time, prefill | `vllm bench serve` ("measures latency at the benchmark client", vLLM docs) |
| The vLLM server | tokenization, queue time, prefill. Not the network. | Prometheus histogram `vllm:time_to_first_token_seconds`. The metrics design doc says TTFT is computed "relative to when the request was first received by the frontend (`arrival_time`)" and that "`arrival_time` starts when tokenization begins". |
| The engine core | queue time and prefill only | `vllm:request_queue_time_seconds` and `vllm:request_prefill_time_seconds` |

The vLLM metrics design doc also names the intervals that the engine core records. The queue interval runs from `QUEUED` to `SCHEDULED`. The prefill interval runs from `SCHEDULED` to the first `NEW_TOKENS`. Then come the decode interval and the inter-token intervals. A preemption during decode adds to the inter-token, decode and inference intervals ([L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) explains preemption).

| Server metric (vLLM 0.31.0) | Meaning |
|---|---|
| `vllm:time_to_first_token_seconds` | Histogram of TTFT |
| `vllm:inter_token_latency_seconds` | Histogram of the gaps between token outputs |
| `vllm:request_time_per_output_token_seconds` | Histogram of TPOT, one value per request |
| `vllm:e2e_request_latency_seconds` | Histogram of end-to-end latency |
| `vllm:request_queue_time_seconds` | Histogram of the time in the waiting state |
| `vllm:num_requests_running`, `vllm:num_requests_waiting` | Current concurrency, split by state |

## 5. Throughput: three ways to count

Over a benchmark of duration $D$ seconds, with $N$ completed requests, $I$ input tokens in total and $O$ output tokens in total:

$$
\text{request throughput} = \frac{N}{D} \qquad
\text{output token throughput} = \frac{O}{D} \qquad
\text{total token throughput} = \frac{I + O}{D}
$$

`vllm bench serve` computes exactly these three values (`request_throughput`, `output_throughput` and `total_token_throughput` in `vllm/benchmarks/serve.py`).

> [!example] Worked example: check the numbers of the vLLM docs
> The vLLM benchmark docs show this output: 10 successful requests in 5.78 s, with 1,369 input tokens and 2,212 generated tokens. They report 1.73 req/s, 382.89 output tok/s and 619.85 total tok/s.
>
> - Request throughput: $10 / 5.78 = 1.730$ req/s. Matches.
> - Output token throughput: $2212 / 5.78 = 382.70$ tok/s. The docs show 382.89. The rounded duration causes the difference: $2212 / 382.89 = 5.777$ s.
> - Total token throughput: $(1369 + 2212) / 5.78 = 3581 / 5.78 = 619.55$ tok/s. The docs show 619.85, again because the true duration is about 5.777 s.

Which one to report?

- **Output token throughput** is the usual capacity number for chat, because decode dominates the GPU time.
- **Total token throughput** flatters workloads with long prompts. Prefill tokens are cheap per token because prefill is compute-bound and runs many tokens in one step.
- **Request throughput** means nothing without the length distribution. 10 req/s of 100-token answers is far less work than 10 req/s of 2,000-token answers.

> [!trap] A throughput number without its workload is meaningless
> Always report the input length, the output length (or their distributions), the request rate or concurrency, the model, the precision and the hardware. Two benchmarks with different lengths cannot be compared.

### 5.1 Per-user speed vs system speed

During decode, each running request gets one token per step. If a step takes $s$ seconds and $B$ requests run, then:

$$
\text{tokens per second per user} \approx \frac{1}{s} \qquad \text{system output tokens per second} \approx \frac{B}{s}
$$

> [!example] Worked example: batch 1 vs batch 64 (idealized)
> Use the idealized model of [L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) for Llama-3.1-8B on one H100, with 2,000 cached tokens per request.
>
> - Batch 1: a step takes about 4.87 ms. Each user gets $1 / 0.00487 \approx 205$ tok/s. The system makes about 205 tok/s.
> - Batch 64: a step takes about 9.80 ms. Each user gets $1 / 0.0098 \approx 102$ tok/s. The system makes $64 / 0.0098 \approx 6{,}529$ tok/s.
>
> The system speed grows about 32 times. Each user becomes about 2 times slower. This is the latency-throughput trade-off in one line.

## 6. Percentiles and tail latency

### 6.1 Why the mean is not enough

Latency distributions have a long right tail. A few requests wait behind a long prefill, or arrive during a burst, or get preempted. The mean mixes these with the normal case and describes nobody.

> [!example] Worked example: 20 TTFT values
> Sorted TTFT values in ms: 62, 65, 70, 71, 73, 75, 78, 80, 82, 85, 88, 90, 95, 101, 110, 125, 150, 220, 480, 1200.
>
> - **Mean:** the sum is 3,400 ms, so the mean is $3400 / 20 = 170$ ms. Only 3 of the 20 values are above it.
> - **Median (P50):** NumPy's default method interpolates. The position is $0.50 \times (20 - 1) = 9.5$. Between the 10th value (85) and the 11th value (88): $85 + 0.5 \times 3 = 86.5$ ms.
> - **P90:** position $0.90 \times 19 = 17.1$. Between 220 (the 18th value) and 480 (the 19th): $220 + 0.1 \times 260 = 246$ ms.
> - **P99:** position $0.99 \times 19 = 18.81$. Between 480 and 1200: $480 + 0.81 \times 720 = 1063.2$ ms.
>
> The "nearest-rank" method gives other values: P90 = the 18th value = 220 ms, and P99 = the 20th value = 1,200 ms. With 20 samples, P99 is almost the maximum. A stable P99 needs thousands of requests.

`vllm bench serve` uses `np.percentile` with the default method, so it interpolates as above. Its option `--metric-percentiles` has the default `"99"`. The option `--percentile-metrics` has the default `"ttft,tpot,itl"` for generative models (vLLM 0.31.0 source, checked on 2026-10-15).

### 6.2 Why the tail matters more at scale

One user action often triggers several LLM calls: an agent loop, a RAG pipeline with a reranker, a page with several widgets. The action is slow if any call is slow.

> [!example] Worked example: fan-out amplifies the tail
> Assume each call is independently slower than its P99 with probability 0.01. An action makes $N$ calls.
>
> $$
> P(\text{at least one slow call}) = 1 - 0.99^N
> $$
>
> - $N = 1$: 1%.
> - $N = 10$: $1 - 0.99^{10} = 1 - 0.9044 = 0.0956$, about 9.6%.
> - $N = 100$: $1 - 0.99^{100} = 1 - 0.3660 = 0.634$, about 63%.
>
> So an agent that makes 10 sequential calls sees a "P99 event" in almost 1 action of 10. The independence assumption is optimistic: a burst slows many calls together.

## 7. SLOs and goodput

### 7.1 Definitions

An **SLO** sets limits on per-request metrics, for example TTFT ≤ 200 ms and TPOT ≤ 50 ms. A request is **good** only if it meets every limit. DistServe (OSDI 2024) defines:

- **SLO attainment:** "the proportion of requests that meet the SLOs".
- **Goodput:** "the maximum request rate that can be served adhering to the SLO attainment goal (say, 90%)", for each GPU provisioned.

Throughput counts every finished request. Goodput counts only the useful ones. A system can raise throughput by batching more and still lower goodput, because more requests miss the TPOT limit.

### 7.2 Worked example

> [!example] Worked example: throughput 2.5 req/s, goodput 1.5 req/s
> SLO: TTFT ≤ 200 ms and TPOT ≤ 50 ms. Ten requests finish within a 4-second window. Their (TTFT, TPOT) values in ms:
>
> | Request | TTFT | TPOT | Good? |
> |---|---|---|---|
> | 1 | 120 | 30 | yes |
> | 2 | 180 | 35 | yes |
> | 3 | 90 | 42 | yes |
> | 4 | 250 | 28 | no: TTFT |
> | 5 | 140 | 55 | no: TPOT |
> | 6 | 160 | 38 | yes |
> | 7 | 600 | 33 | no: TTFT |
> | 8 | 110 | 47 | yes |
> | 9 | 130 | 51 | no: TPOT |
> | 10 | 170 | 40 | yes |
>
> - Good requests: 1, 2, 3, 6, 8 and 10. That is 6 of 10, so SLO attainment is 60%.
> - Throughput: $10 / 4 = 2.5$ req/s.
> - Goodput in the sense of `vllm bench serve`: $6 / 4 = 1.5$ req/s.
> - DistServe's goodput is a different number: the highest request rate at which attainment stays at or above the goal, for example 90%. This load gives only 60%, so the rate must go down until 9 of 10 requests are good.

In `vllm bench serve`, you pass the SLO as `--goodput ttft:200 tpot:50` (milliseconds). The allowed keys are `ttft`, `tpot` and `e2el`. The code marks a request as good when every listed metric is at or below its limit, then divides the count by the duration (`request_goodput=good_completed / dur_s`).

### 7.3 How to choose SLO values

Interpretation of these notes: derive the numbers from the product, not from the hardware.

- **Chat:** TTFT matters most, because the user stares at an empty box. TPOT only needs to beat reading speed.
- **Code completion inside an editor:** E2E for short outputs matters most.
- **Agents and batch jobs:** E2E of the whole task matters. Individual TTFT matters less.
- **Voice agents:** TTFT of the first sentence decides when speech can start.

## 8. Little's law: from rates to capacity

### 8.1 The law

$$
L = \lambda W
$$

- $L$: the average number of requests in the system (waiting plus running).
- $\lambda$: the average arrival rate, in requests per second.
- $W$: the average time a request spends in the system, in seconds. For an LLM server, this is the average E2E latency.

**Why it holds.** Watch the system for a long time $T$. About $\lambda T$ requests arrive. Each stays $W$ seconds on average. Draw the number of requests inside as a function of time. The area under that curve equals the total time spent inside by all requests: $\lambda T \times W$. The average height of the curve is the area divided by $T$, so $L = \lambda W$.

The proof needs no assumption about the arrival pattern or the service order. It needs a stable system, where arrivals do not exceed capacity in the long run. Little published a proof in 1961 in Operations Research.

![Alt text: 5 requests per second that stay 8 seconds each give 40 requests in the system and need two replicas of 32](/notes/media/llm-systems/figures/04-2-littles-law.svg)

### 8.2 Worked capacity example

> [!example] Worked example: how many replicas?
> Traffic: $\lambda = 5$ requests per second at peak. Assume load tests show an average E2E of $W = 8$ s at the target SLO. Each request has about 2,000 prompt tokens and 400 output tokens.
>
> 1. **Concurrency.** $L = \lambda W = 5 \times 8 = 40$ requests inside the system on average.
> 2. **Replicas.** Assume the same load tests show that one replica meets the SLO with at most 32 concurrent requests. Then you need $\lceil 40 / 32 \rceil = 2$ replicas. Add headroom for bursts and for a failed replica.
> 3. **Output rate.** $5 \times 400 = 2{,}000$ output tokens per second in total, about 1,000 per replica.
> 4. **KV memory check.** Llama-3.1-8B needs 128 KiB per token. A full request holds about $2{,}400 \times 131{,}072 = 314{,}572{,}800$ bytes, about 315 MB. With 20 requests per replica, that is about 6.3 GB. This fits easily on an 80 GB GPU, so memory is not the limit here. Latency is.

Little's law also works backward. Suppose one replica holds at most $L_{\max}$ requests at the SLO, and requests take $W$ seconds. Then the replica can accept at most $\lambda_{\max} = L_{\max} / W$ requests per second. With $L_{\max} = 32$ and $W = 8$ s, that is 4 requests per second. [Autoscaling and routing](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) uses this for capacity planning.

> [!trap] W depends on L
> In an LLM server, more concurrency makes each decode step slower, so $W$ grows with $L$. Little's law does not predict that growth. It only links the three averages at one operating point. Measure $W$ at the load you plan for.

## 9. The latency-throughput trade-off

### 9.1 Inside the GPU: batch size

A bigger batch reads the weights once for more requests, so throughput rises. Each step also reads more KV cache and does more arithmetic, so each step takes longer. The plot uses the idealized model of [L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound): Llama-3.1-8B on one H100 with 2,000 cached tokens per request. The batch sizes are 1, 8, 32, 64, 128 and 213.

```plot
{
  "title": "Idealized model, Llama-3.1-8B on one H100: TPOT in ms (blue) against system output tokens/s, batch 1 to 213",
  "xAxis": {"label": "system output throughput (tokens/s)", "domain": [0, 11000]},
  "yAxis": {"label": "TPOT (ms)", "domain": [0, 25]},
  "disableZoom": true,
  "data": [
    {"points": [[205, 4.87], [1476, 5.42], [4385, 7.3], [6529, 9.8], [8643, 14.81], [9925, 21.46]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[205, 4.87], [1476, 5.42], [4385, 7.3], [6529, 9.8], [8643, 14.81], [9925, 21.46]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true}
  ]
}
```

| Batch size | Step time (ms) | Per-user tok/s | System output tok/s |
|---|---|---|---|
| 1 | 4.87 | 205 | 205 |
| 8 | 5.42 | 185 | 1,476 |
| 32 | 7.30 | 137 | 4,385 |
| 64 | 9.80 | 102 | 6,529 |
| 128 | 14.81 | 68 | 8,643 |
| 213 | 21.46 | 47 | 9,925 |

The curve bends: the first 64 requests multiply throughput by about 32 and only double the step time. The last 85 requests (from 128 to 213) add about 15% throughput and add about 45% to the step time. Where to stop depends on the TPOT limit of the SLO. With TPOT ≤ 10 ms, the limit in this model is a batch of 66 (9.96 ms). A batch of 67 gives 10.04 ms.

### 9.2 Outside the GPU: queueing

Even with a fixed service speed, the waiting time grows sharply as the load approaches capacity. The simplest queueing model (M/M/1: Poisson arrivals, one server, exponential service times) gives a closed formula. With service rate $\mu$ and arrival rate $\lambda$, the mean time in the system is

$$
W = \frac{1}{\mu - \lambda} = \frac{1/\mu}{1 - \rho}, \qquad \rho = \frac{\lambda}{\mu}
$$

So $W$ is the bare service time $1/\mu$ times $1 / (1 - \rho)$:

| Utilization $\rho$ | 0.5 | 0.8 | 0.9 | 0.95 | 0.99 |
|---|---|---|---|---|---|
| $1 / (1 - \rho)$ | 2 | 5 | 10 | 20 | 100 |

```plot
{
  "title": "M/M/1 queue: time in system divided by service time, 1/(1 - rho) (red), against utilization rho",
  "xAxis": {"label": "utilization rho", "domain": [0, 1]},
  "yAxis": {"label": "W / service time", "domain": [0, 26]},
  "disableZoom": true,
  "data": [
    {"points": [[0.0, 1.0], [0.1, 1.111], [0.2, 1.25], [0.3, 1.429], [0.4, 1.667], [0.5, 2.0], [0.6, 2.5], [0.7, 3.333], [0.8, 5.0], [0.85, 6.667], [0.9, 10.0], [0.92, 12.5], [0.94, 16.667], [0.95, 20.0], [0.96, 25.0]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true},
    {"points": [[0.0, 1.0], [0.1, 1.111], [0.2, 1.25], [0.3, 1.429], [0.4, 1.667], [0.5, 2.0], [0.6, 2.5], [0.7, 3.333], [0.8, 5.0], [0.85, 6.667], [0.9, 10.0], [0.92, 12.5], [0.94, 16.667], [0.95, 20.0], [0.96, 25.0]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true}
  ]
}
```

An LLM server is not an M/M/1 queue: it serves a batch at once, and its service time depends on the batch. The shape still holds. Near full capacity, queue time and TTFT explode. Interpretation of these notes: plan replicas so that peak load stays well below the knee. Scale on queue length or TTFT, not on GPU utilization.

## 10. How engines are benchmarked

### 10.1 `vllm bench serve`

vLLM ships a benchmark client in its command line tool. Start a server, then point the client at it. This is the example of the vLLM docs (checked on 2026-10-15):

```bash
vllm serve NousResearch/Hermes-3-Llama-3.1-8B

vllm bench serve \
  --backend vllm \
  --model NousResearch/Hermes-3-Llama-3.1-8B \
  --endpoint /v1/completions \
  --dataset-name sharegpt \
  --dataset-path <your data path>/ShareGPT_V3_unfiltered_cleaned_split.json \
  --num-prompts 10
```

The important options, with their defaults in vLLM 0.31.0 (source `vllm/benchmarks/serve.py` and `vllm/benchmarks/datasets/datasets.py`, checked on 2026-10-15):

| Option | Default | Meaning |
|---|---|---|
| `--request-rate` | `inf` | Requests per second. With `inf`, "all the requests are sent at time 0". |
| `--burstiness` | `1.0` | 1 gives a Poisson process. Other values give gamma-distributed gaps. |
| `--max-concurrency` | none | A cap on requests in flight. The real rate can then fall below `--request-rate`. |
| `--num-prompts` | 1000 | How many requests to send. |
| `--dataset-name` | `random` | Also `sharegpt`, `sonnet`, `hf`, `custom` and others. |
| `--random-input-len` / `--random-output-len` | 1024 / 128 | Token lengths for the random dataset. |
| `--ignore-eos` | off | Forces every request to reach its output length. |
| `--percentile-metrics` | `ttft,tpot,itl` | Which metrics get percentiles. |
| `--metric-percentiles` | `99` | Which percentiles to report, for example `50,90,99`. |
| `--goodput` | none | SLO pairs in ms, for example `ttft:200 tpot:50`. |

The docs show this result block for the example above:

```text
============ Serving Benchmark Result ============
Successful requests:                     10
Benchmark duration (s):                  5.78
Total input tokens:                      1369
Total generated tokens:                  2212
Request throughput (req/s):              1.73
Output token throughput (tok/s):         382.89
Total token throughput (tok/s):          619.85
---------------Time to First Token----------------
Mean TTFT (ms):                          71.54
Median TTFT (ms):                        73.88
P99 TTFT (ms):                           79.49
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          7.91
Median TPOT (ms):                        7.96
P99 TPOT (ms):                           8.03
---------------Inter-token Latency----------------
Mean ITL (ms):                           7.74
Median ITL (ms):                         7.70
P99 ITL (ms):                            8.39
==================================================
```

The docs do not state the GPU of this run. The mean TPOT of 7.91 ms is above the ideal 4.8 ms bound of an 8B model on an H100 ([L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)). That is normal: real kernels do not reach peak bandwidth, and other requests share the steps.

### 10.2 How arrivals are generated

With a finite `--request-rate` $\lambda$, the client draws the gap before each request from a gamma distribution with shape $b$ (the burstiness) and scale $\theta = 1 / (\lambda b)$. The mean gap is $b \theta = 1 / \lambda$ for every $b$. The variance is $b \theta^2 = 1 / (\lambda^2 b)$, so the coefficient of variation (standard deviation divided by mean) is $1 / \sqrt{b}$. With $b = 1$, the gamma distribution becomes the exponential distribution, so arrivals form a Poisson process.

```python
import numpy as np

def arrival_times(n, rate, burstiness=1.0, seed=0):
    """Arrival times like vllm bench serve: gamma intervals with mean 1/rate."""
    rng = np.random.default_rng(seed)
    theta = 1.0 / (rate * burstiness)                  # scale of the gamma distribution
    gaps = rng.gamma(shape=burstiness, scale=theta, size=n)
    return np.cumsum(gaps), gaps

for b in (0.25, 1.0, 4.0):
    t, gaps = arrival_times(100_000, rate=5.0, burstiness=b)
    print(f"burstiness {b}: mean gap {gaps.mean():.4f} s, CV {gaps.std() / gaps.mean():.3f}")
```

Output:

```text
burstiness 0.25: mean gap 0.1999 s, CV 2.013
burstiness 1.0: mean gap 0.1994 s, CV 1.005
burstiness 4.0: mean gap 0.2002 s, CV 0.500
```

- All three runs send 5 requests per second on average.
- With $b = 0.25$, the gaps vary twice as much as in a Poisson process. Requests arrive in clumps, and queues form even at moderate average load.
- vLLM also rescales the gaps so that the total duration equals `num_prompts / request_rate`. Its comment says the raw sum "would have 1-2% gap" from the target otherwise.

### 10.3 Open loop vs closed loop

- **Open loop** (`--request-rate`): requests arrive on a schedule, whether or not the server keeps pace. This models real users. If the server is too slow, the queue grows without limit, and TTFT shows it.
- **Closed loop** (`--max-concurrency` with `--request-rate inf`): a fixed number of clients, each sends its next request when the previous one finishes. The load adapts to the server. This hides overload: TTFT stays fine, and only throughput tells you that the server is saturated.

### 10.4 How a benchmark can lie

1. **Prefix cache hits.** The vLLM docs warn: "Repeating `vllm bench serve` against the same server can reuse prompts left in the prefix cache and inflate throughput." Vary `--seed`, restart the server, or use `vllm bench sweep serve`, which resets caches between runs.
2. **Short outputs.** Without `--ignore-eos`, a model may stop early. Then the run measures fewer decode tokens than you think.
3. **Request rate `inf`.** All requests arrive at once. This measures maximum throughput, not latency under realistic traffic.
4. **No warm-up.** The first requests pay for CUDA graph capture, grammar compilation and empty caches.
5. **Wrong length mix.** A random dataset with 1,024 input and 128 output tokens is not your traffic. Replay real lengths if you can.

For production benchmarking, the vLLM docs now recommend GuideLLM, which they call "an established performance benchmarking framework with live progress updates and automatic report generation" (checked on 2026-10-15).

### Exercises

1. **Metrics from a trace.** Write `summarize(trace)` where `trace` is a list of `(t_send, [token arrival times])`. Return mean and P99 of TTFT, TPOT and ITL, and the E2E of each request. Acceptance test: for the two requests `(0.0, [0.10, 0.14, 0.18, 0.22, 0.26])` and `(0.05, [0.30, 0.31])`, mean TTFT is 0.175 s, mean TPOT is 0.025 s and mean ITL is 0.034 s.
   - Hint 1: TPOT is one value per request, ITL is one value per gap.
   - Hint 2: the second request has one gap of 0.01 s.
2. **Goodput sweep.** Simulate a toy server for 1,000 Poisson arrivals at each rate from 1 to 10 req/s. The server runs at most 64 requests. A request that finds all 64 busy waits for the first free slot. TTFT = wait + 0.1 s. TPOT = 0.02 s × (1 + running / 32), where `running` counts the other requests at its start. Each answer has 200 tokens. Find the highest rate with at least 90% of requests at TTFT ≤ 0.5 s and TPOT ≤ 0.05 s. Acceptance test: your function returns one integer rate, and the attainment at that rate is at least 0.9.
   - Hint 1: keep a heap (priority queue) of finish times. Remove the finished requests before each arrival.
   - Hint 2: a request that starts at time $s$ finishes at $s + 0.1 + 199 \times \mathrm{TPOT}$.
3. **Capacity with Little's law.** A team expects 12 requests per second at peak. Average E2E at the SLO is 6 s. One replica meets the SLO with up to 48 concurrent requests. How many replicas, with one spare for failures? Acceptance test: your answer matches the hidden solution and shows $L$.
   - Hint 1: compute $L$ first.
   - Hint 2: round up, then add the spare.

## 11. Common mistakes

1. **"TPOT and ITL are the same metric."** They agree only when each streamed output holds one token. With speculative decoding or a `stream_interval` above 1, mean ITL can be much larger than TPOT.
2. **"E2E = TTFT + TPOT × n."** The first token belongs to TTFT. The exact relation is E2E = TTFT + TPOT × (n − 1).
3. **"The mean latency describes the user experience."** Latency has a long tail. Report P50 and P99, and use enough requests for a stable P99.
4. **"Higher throughput means a better deployment."** Throughput counts requests that missed the SLO too. Goodput counts only useful requests.
5. **"Server-side TTFT and client-side TTFT are the same."** The vLLM server metric starts when tokenization begins. A client also sees network and gateway time.
6. **"Little's law needs Poisson arrivals."** It holds for any arrival pattern in a stable system. It links averages only.
7. **"A benchmark with request rate `inf` measures latency."** It measures peak throughput with a huge initial queue. Latency numbers from it describe overload.

## 12. One-minute explanation

An LLM request has two latencies. TTFT is the time until the first token: network, tokenization, queue time and prefill. TPOT is the average time per later token, so E2E = TTFT + TPOT × (n − 1) exactly. ITL is the gap between streamed outputs: it equals TPOT with one token per output, but it differs with speculative decoding. Throughput can count requests, output tokens or all tokens per second, and it only means something with the workload's lengths. Because latency has a long tail, I report P50 and P99, and I remember that fan-out makes tail events common. Goodput counts only requests that meet the SLO, for example TTFT under 200 ms and TPOT under 50 ms. For capacity I use Little's law, L = λW: 5 requests per second that stay 8 seconds means 40 in the system. Larger batches raise throughput but slow every user, and near full load the queue makes TTFT explode. I benchmark with Poisson arrivals at several rates, fixed output lengths and no stale prefix cache.

## 13. Check questions

```check
{
  "question": "Define TTFT, ITL and TPOT. Then write end-to-end latency in terms of TTFT and TPOT, and explain the $n - 1$.",
  "hint": "Put the send time and the arrival times of the $n$ tokens on one line.",
  "answer": "With send time $t_0$ and token arrival times $t_1, \\dots, t_n$:\n\n- TTFT $= t_1 - t_0$: network, tokenization, queue time and prefill.\n- ITL$_i = t_i - t_{i-1}$: the gap between two consecutive streamed outputs.\n- TPOT $= (t_n - t_1) / (n - 1) = (\\mathrm{E2E} - \\mathrm{TTFT}) / (n - 1)$: the average time per token after the first.\n\nSo $\\mathrm{E2E} = \\mathrm{TTFT} + \\mathrm{TPOT} \\times (n - 1)$, exactly. The first token is already counted in TTFT, so only $n - 1$ tokens remain for the decode phase."
}
```

```check
{
  "question": "Why do serving teams report P99 latency and not only the mean? An agent makes 20 independent calls per task. How often does a task contain at least one call slower than P99?",
  "hint": "Use $1 - 0.99^N$.",
  "answer": "Latency distributions have a long right tail: queue bursts, long prefills of other users and preemptions slow some requests a lot. The mean mixes the tail with the normal case and describes almost no real request. P50 describes the typical user, P99 the bad experiences that still happen often.\n\nWith 20 independent calls: $1 - 0.99^{20} = 1 - 0.8179 = 0.182$. About 18% of tasks contain at least one call slower than the P99 of a single call. Fan-out turns a \"1 in 100\" event into an almost \"1 in 5\" event. Real calls are often correlated during bursts, so the real effect can be worse."
}
```

```check
{
  "question": "What is the difference between throughput and goodput? Give one way to raise throughput that lowers goodput.",
  "hint": "Goodput only counts requests that meet the SLO.",
  "answer": "Throughput counts every finished request (or token) per second. Goodput counts only the requests that meet every SLO limit, for example TTFT ≤ 200 ms and TPOT ≤ 50 ms. DistServe defines goodput as the maximum request rate per GPU at which SLO attainment stays at or above a goal such as 90%.\n\nExample: raise `max_num_seqs` so that the batch grows from 64 to 200. Each decode step reads more KV cache, so tokens per second rise. But each step takes longer, so TPOT can cross 50 ms for most requests. Throughput goes up and goodput goes down."
}
```

```check
{
  "question": "Interview follow-up: prove Little's law in two sentences. Then use it. A Llama-3.1-70B service receives 3 requests per second. Each stays 12 s on average and ends with about 4,000 tokens of context. Estimate the KV cache memory of the requests in the system.",
  "hint": "The KV cache of Llama-3.1-70B is 320 KiB (327,680 bytes) per token in BF16.",
  "answer": "**Proof.** Over a long time $T$, about $\\lambda T$ requests arrive and each stays $W$ on average, so the area under the \"requests inside\" curve is $\\lambda T W$. The average height of that curve is the area divided by $T$, so $L = \\lambda W$.\n\n**Use.** $L = 3 \\times 12 = 36$ requests inside on average.\n\n**KV memory.** A full request holds $4000 \\times 327{,}680 = 1{,}310{,}720{,}000$ bytes, about 1.31 GB. At the end of their lives, 36 requests would hold $36 \\times 1.31 = 47.2$ GB (about 43.9 GiB). Requests in the middle of their lives hold less, so this is an upper estimate. It still shows that the cache, not only the weights, decides how many GPUs you need."
}
```

```check
{
  "question": "Interview follow-up: with speculative decoding, a request streams 4 outputs. They arrive at 120 ms (1 token), 150 ms (2 tokens), 175 ms (3 tokens) and 210 ms (1 token). Compute TTFT, the mean ITL, TPOT and E2E. Which metric should you use to compare it with normal decoding?",
  "hint": "ITL samples are gaps between outputs, not between tokens. Count all tokens for TPOT.",
  "answer": "- Tokens: $1 + 2 + 3 + 1 = 7$.\n- TTFT = 120 ms. E2E = 210 ms.\n- ITL samples: $150 - 120 = 30$, $175 - 150 = 25$, $210 - 175 = 35$. Mean ITL = $90 / 3 = 30$ ms.\n- TPOT $= (210 - 120) / (7 - 1) = 90 / 6 = 15$ ms.\n\nCompare with TPOT or E2E. ITL ignores the extra tokens in each output, so it makes speculative decoding look twice as slow as it is here."
}
```

```check
{
  "question": "Interview follow-up: what is the difference between an open-loop and a closed-loop benchmark? Why can a closed-loop benchmark hide an overloaded server?",
  "hint": "Who decides when the next request is sent?",
  "answer": "- **Open loop** (`--request-rate` in `vllm bench serve`): requests arrive on a fixed random schedule, like real users. If the server is too slow, the queue grows and TTFT grows with it.\n- **Closed loop** (`--max-concurrency` with request rate `inf`): a fixed number of clients send a new request only when their last one finishes. The server sets the pace.\n\nIn a closed loop, the queue can never grow beyond the client count. When the server is saturated, the clients simply wait longer between requests. TTFT looks fine and only throughput stops rising. In production, users do not wait politely: the arrival rate stays the same and the queue grows. So measure TTFT under open-loop traffic at several request rates."
}
```

```check
{
  "question": "Interview follow-up: an M/M/1 queue has a service time of 2 s. What is the mean time in the system at 90% and at 95% utilization? What does this mean for LLM capacity planning, and where does the model not fit an LLM server?",
  "hint": "$W = (1/\\mu) / (1 - \\rho)$.",
  "answer": "- $\\rho = 0.90$: $W = 2 / 0.10 = 20$ s.\n- $\\rho = 0.95$: $W = 2 / 0.05 = 40$ s.\n\nFive more points of utilization double the time in the system. Near capacity, a small traffic increase creates long queues. So plan replicas for peak traffic with headroom, and autoscale on queue length or TTFT before the knee.\n\nWhere the model does not fit: an LLM server serves a batch of requests at once. Its service time depends on the batch size and on the lengths. Also, requests have very different sizes. The exact numbers do not transfer. The shape, a sharp knee near full load, does."
}
```

```check
{
  "question": "Exercise 1: show a reference solution for `summarize`.",
  "hint": "Collect TPOT per request and ITL per gap in separate lists.",
  "answer": "```python\nimport numpy as np\n\ndef summarize(trace):\n    ttfts, tpots, itls, e2es = [], [], [], []\n    for t_send, times in trace:\n        t = np.asarray(times)\n        ttfts.append(t[0] - t_send)\n        e2es.append(float(t[-1] - t_send))\n        if len(t) > 1:\n            tpots.append((t[-1] - t[0]) / (len(t) - 1))\n            itls.extend(np.diff(t))\n    out = {}\n    for name, xs in ((\"ttft\", ttfts), (\"tpot\", tpots), (\"itl\", itls)):\n        out[name] = (float(np.mean(xs)), float(np.percentile(xs, 99)))\n    out[\"e2e\"] = e2es\n    return out\n\ns = summarize([(0.0, [0.10, 0.14, 0.18, 0.22, 0.26]), (0.05, [0.30, 0.31])])\nprint({k: (round(v[0], 3) if k != \"e2e\" else [round(x, 3) for x in v]) for k, v in s.items()})\n```\n\nOutput: `{'ttft': 0.175, 'tpot': 0.025, 'itl': 0.034, 'e2e': [0.26, 0.26]}`.\n\nMean TPOT averages two values (0.04 and 0.01). Mean ITL averages five gaps (four of 0.04 and one of 0.01), so the long request dominates it."
}
```

```check
{
  "question": "Exercise 2: show a reference solution for the goodput sweep.",
  "hint": "A heap of finish times gives the running count and the first free slot.",
  "answer": "```python\nimport heapq\nimport numpy as np\n\ndef simulate(rate, n=1000, slots=64, out_tokens=200, seed=0):\n    rng = np.random.default_rng(seed)\n    arrivals = np.cumsum(rng.exponential(1.0 / rate, size=n))\n    running, good = [], 0                          # heap of finish times\n    for t in arrivals:\n        while running and running[0] <= t:         # requests that finished before t\n            heapq.heappop(running)\n        start = t\n        if len(running) >= slots:                  # wait for the earliest free slot\n            start = heapq.heappop(running)\n            while running and running[0] <= start:\n                heapq.heappop(running)\n        ttft = (start - t) + 0.1\n        tpot = 0.02 * (1 + len(running) / 32)\n        heapq.heappush(running, start + 0.1 + tpot * (out_tokens - 1))\n        good += (ttft <= 0.5) and (tpot <= 0.05)\n    return good / n\n\ndef best_rate(rates=range(1, 11), goal=0.9):\n    ok = [r for r in rates if simulate(r) >= goal]\n    return max(ok) if ok else None\n\nprint([round(simulate(r), 3) for r in range(1, 11)], best_rate())\n```\n\nOutput: `[1.0, 1.0, 1.0, 1.0, 0.477, 0.14, 0.076, 0.063, 0.059, 0.058] 4`.\n\nAttainment falls from 100% at 4 req/s to 48% at 5 req/s. That cliff is typical. Once the running set is large, TPOT crosses its limit for everyone. The queue then pushes TTFT over its limit too. The goodput of this toy server is 4 req/s, although it finishes more requests per second at higher rates."
}
```

```check
{
  "question": "Exercise 3: show a reference solution for the replica count.",
  "hint": "$L = \\lambda W$.",
  "answer": "$L = \\lambda W = 12 \\times 6 = 72$ requests inside on average.\n\nReplicas for the load: $\\lceil 72 / 48 \\rceil = \\lceil 1.5 \\rceil = 2$.\n\nAdd one spare for a failed replica: 3 replicas.\n\nInterpretation of these notes: also check bursts. With 3 replicas, one failure leaves 2 replicas for 72 requests, so each holds 36, below its limit of 48."
}
```

## 14. Links

- Previous lesson: [L1: The life of a request](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request)
- Next lesson: [L3: Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)
- Related: [Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling), [Speculative decoding](/notes/ai/llm-systems/04-inference/l6-speculative-decoding), [Serving engines](/notes/ai/llm-systems/04-inference/l10-serving-engines), [Autoscaling and routing](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing), [Cost math](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math), [Production operations](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations)
- Paper: [Results of the PagedAttention paper](/notes/papers/llm-serving/2023-pagedattention/09-results) (it uses normalized latency: mean E2E divided by output length)
- Drill: [Inference and cloud hosting](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud)

### Sources

- vLLM, "Benchmark CLI" docs, section "Understanding the Latency Metrics": https://docs.vllm.ai/en/latest/benchmarking/cli/ (checked on 2026-10-15)
- vLLM 0.31.0 source code (PyPI sdist, released 2026-10-05): `vllm/benchmarks/serve.py`, `vllm/benchmarks/datasets/datasets.py`, `vllm/v1/metrics/loggers.py`: https://pypi.org/project/vllm/0.31.0/ (checked on 2026-10-15)
- vLLM, "Metrics" design doc: https://docs.vllm.ai/en/latest/design/metrics/ (checked on 2026-10-15)
- Zhong et al., "DistServe: Disaggregating Prefill and Decoding for Goodput-optimized Large Language Model Serving", OSDI 2024: https://arxiv.org/abs/2401.09670 (checked on 2026-10-15)
- J. D. C. Little, "A Proof for the Queuing Formula: L = λW", Operations Research, 1961: https://doi.org/10.1287/opre.9.3.383 (checked on 2026-10-15)
- J. D. C. Little, "Little's Law as Viewed on Its 50th Anniversary", Operations Research, 2011: https://pubsonline.informs.org/doi/10.1287/opre.1110.0940 (checked on 2026-10-15)
- NVIDIA H100 specifications: https://www.nvidia.com/en-eu/data-center/h100 (checked on 2026-10-15)
