---
title: "L7: Cost math: from GPU hours to cost per token"
order: 7
summary: "Turn a GPU price per hour into a price per million tokens, and back. The formula and its units, verified example prices for an 8-GPU H100 VM, tokens per second from the bandwidth bound, input vs output tokens, utilization, the break-even throughput against an API, reserved, spot and batch discounts, and caching."
status: not-started
tags: [cost, pricing, gpu, throughput, break-even, caching, cloud-hosting]
---

## 1. The question this idea answers

An interviewer asks: "Your company wants Llama 70B. Would you self-host it on H100s or call an API? Show me the numbers."

The two options are priced in different units:

- A cloud GPU is priced **per hour**. You pay while it runs, busy or idle.
- An API is priced **per million tokens**. You pay only for what you send and receive.

To compare them, you need one conversion: from USD per GPU-hour to USD per million tokens. The conversion needs a throughput, in tokens per second. And throughput depends on the batch size, the model, the GPU and how busy you keep it. This lesson builds the conversion step by step, with prices checked on 2026-10-15.

## 2. Mental model

> [!analogy] A rented car and a taxi
> A rented car costs a fixed amount per hour. Your cost per kilometer is the hourly price divided by the kilometers you drive in that hour. Drive fast all day, and each kilometer is cheap. Leave the car parked 70% of the day, and each kilometer costs more than three times as much.
>
> A taxi charges per kilometer. You pay nothing while you wait. A taxi company keeps its cars full all day, so its price per kilometer can be lower than your own rented car.
>
> **Where it stops working:** a token is not a kilometer. Output tokens cost far more GPU time than input tokens. And a GPU is more like a bus than a car. More passengers per trip (a larger batch) make each seat cheaper, but every trip gets slower.

## 3. Terms

| Term | Plain meaning |
|---|---|
| GPU-hour | One GPU used for one hour. Cloud VMs are priced per VM-hour, and a VM can hold 1 or 8 GPUs. |
| on-demand price | The list price per hour, with no commitment. You can stop at any time. |
| reservation | A 1-year or 3-year commitment for a lower hourly price. You pay even when you do not use it. |
| spot capacity | Spare capacity at a large discount. The cloud can take it back with short notice. |
| MTok | One million tokens. API prices are in USD per MTok. |
| throughput | Tokens produced or processed per second by one replica or one VM. |
| operating point | The batch size and context length at which you run the server. It sets both throughput and latency. |
| TPOT | Time per output token for one sequence. In a decode step, every sequence in the batch receives one token. |
| prefill | The forward pass over the prompt. It is limited by arithmetic (compute-bound). |
| decode | The steps that produce output tokens one by one. They are limited by memory reads (memory-bound). |
| bandwidth bound | The highest decode throughput that the memory bandwidth allows. Real servers reach only part of it. |
| MFU | Model FLOPs utilization: the share of the GPU's peak arithmetic that the model really uses. |
| utilization | In this lesson: the share of paid hours in which the GPUs do useful work at the operating point. |
| break-even throughput | The steady tokens per second at which self-hosting costs the same as an API. |
| batch API | An API mode that accepts jobs and returns results within hours, at a discount. |
| cache read price | The price of input tokens that the provider reads from its prompt cache. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. The core formula

### 4.1 Derivation with units

Start from a price per hour and a steady throughput:

1. An hour has 3,600 seconds. So the price per second is $\frac{\text{USD per hour}}{3600}$.
2. In one second the server produces $r$ tokens. So the price per token is $\frac{\text{USD per hour}}{3600 \times r}$.
3. A million tokens cost $10^6$ times that.

$$
\text{USD per MTok} = \frac{\text{USD per hour}}{r \times 3600} \times 10^6
$$

Check the units: $\frac{\text{USD/h}}{(\text{tokens/s}) \times (\text{s/h})} = \frac{\text{USD}}{\text{token}}$. Then multiply by $10^6$ tokens per MTok.

The formula also runs backwards. For a target price per MTok, the needed throughput is $r = \frac{\text{USD per hour}}{\text{USD per MTok} \times 3600} \times 10^6$.

> [!example] Worked example: one 8-GPU VM at 10,000 tokens per second
> Price: USD 98.32 per hour. Throughput: $r = 10{,}000$ tokens per second.
>
> 1. Tokens per hour: $10{,}000 \times 3{,}600 = 36{,}000{,}000$.
> 2. Price per token: $98.32 / 36{,}000{,}000 = 2.731 \times 10^{-6}$ USD.
> 3. Price per MTok: $2.731 \times 10^{-6} \times 10^6 \approx$ **USD 2.73**.

![Alt text: USD 98.32 per hour becomes USD 2.73 per million tokens after division by 3,600 seconds and 10,000 tokens per second](/notes/media/llm-systems/figures/05-7-gpu-hour-to-token.svg)

```video
{"src": "/notes/media/llm-systems/manim/m25-gpu-hour-to-cost-per-token.mp4", "caption": "From USD 98.32 per hour to USD per million tokens: the units cancel, then batch size and utilization move the result."}
```

### 4.2 Real prices for the formula

The Azure Retail Prices API is a public price list. For the VM `Standard_ND96isr_H100_v5` in the region `eastus`, it returns these Linux prices (checked on 2026-10-15). The VM has 8 NVIDIA H100 80 GB GPUs with NVLink 4.0.

| Price type | Number in the API | USD per hour | Discount vs on-demand |
|---|---|---|---|
| On-demand (Consumption) | 98.32 per hour | 98.32 | 0% |
| 1-year reservation | 551,221 | about 62.92 | about 36% |
| 3-year reservation | 1,134,310 | about 43.16 | about 56% |
| Spot | 18.169536 per hour | about 18.17 | about 81.5% |

The API lists the reservation numbers with the unit "1 Hour", and its docs do not say what the number covers. Interpretation of these notes: it is the total price for the whole term, because USD 551,221 per hour is not plausible. So $551{,}221 / 8{,}760 \approx 62.92$ per hour for 1 year and $1{,}134{,}310 / 26{,}280 \approx 43.16$ per hour for 3 years.

Per GPU, the on-demand price is $98.32 / 8 = 12.29$ USD per GPU-hour. You cannot rent one GPU of this VM, but you can run 8 replicas of a small model on it, one per GPU.

A second check: Google's Agent Platform (formerly Vertex AI) lists the H100 80 GB GPU for online prediction at USD 11.2660332 per hour in us-central1. Machine vCPU and memory are charged on top (Agent Platform pricing page, checked on 2026-10-15).

> [!trap] Prices are examples with a date
> Cloud prices change by region, by date and by contract. Every price in this lesson is an example checked on 2026-10-15. Recompute with your own price before any decision.

## 5. Finding the tokens per second

### 5.1 Decode is limited by memory reads

In one decode step, the GPU reads every weight once and the KV cache of every sequence in the batch ([part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)). The step produces one token for each of the $B$ sequences. With memory bandwidth $BW$, weight bytes $W$, average context $\bar{L}$ tokens and KV bytes per token $kv$:

$$
t_{\text{step}} \approx \frac{W + B \cdot \bar{L} \cdot kv}{BW}, \qquad r_{\text{decode}} \approx \frac{B}{t_{\text{step}}}
$$

$t_{\text{step}}$ is also the TPOT that each user sees. This is an upper bound. It ignores compute time, kernel launch gaps, sampling and scheduling ([part 01 L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth)).

> [!example] Worked example: Llama-3.1-8B on one H100 at an average context of 2,048 tokens
> Inputs: $W = 8.03 \times 10^9 \times 2 = 16.06$ GB (BF16). $kv = 131{,}072$ bytes per token ([part 03 L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)). $BW = 3.35$ TB/s. Price USD 12.29 per GPU-hour.
>
> For $B = 64$:
>
> 1. KV bytes read: $64 \times 2{,}048 \times 131{,}072 = 17.18$ GB.
> 2. Bytes per step: $16.06 + 17.18 = 33.24$ GB.
> 3. Step time: $33.24 \times 10^9 / 3.35 \times 10^{12} = 9.92$ ms. That is the TPOT.
> 4. Throughput: $64 / 0.00992 \approx 6{,}450$ tokens per second.
> 5. Cost: $12.29 / (6{,}450 \times 3{,}600) \times 10^6 \approx$ USD 0.529 per MTok.
>
> Compute check: $2 \times 8.03 \times 10^9 \times 64 = 1.03$ TFLOP per step, or 1.04 ms at 989 TFLOPS. That is far below 9.92 ms, so the step is indeed memory-bound.

The same calculation for other batch sizes, from the program in Exercise 2:

| Batch $B$ | TPOT (ms) | Tokens per second | USD per MTok at the bound | USD per MTok at 50% of the bound |
|---|---|---|---|---|
| 1 | 4.87 | 205 | 16.64 | 33.28 |
| 8 | 5.44 | 1,472 | 2.32 | 4.64 |
| 32 | 7.36 | 4,349 | 0.785 | 1.57 |
| 64 | 9.92 | 6,450 | 0.529 | 1.06 |
| 128 | 15.05 | 8,505 | 0.401 | 0.803 |

From batch 1 to batch 128, the cost per token falls about 41 times. The TPOT grows only about 3.1 times. That is the economic reason for continuous batching ([part 04 L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)).

The batch size has limits. The KV cache must fit: at $B = 128$ it holds $128 \times 2{,}048 \times 131{,}072$ bytes = 32 GiB, which fits beside 16 GB of weights on 80 GB. And the TPOT must meet the SLO.

Real servers do not reach the bound. In this lesson, **50% of the bound** is a planning assumption, not a measurement. Measure your own number with a benchmark ([part 04 L2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)).

```plot
{
  "title": "USD per million output tokens vs batch size, Llama-3.1-8B on one H100 at USD 12.29 per hour: bandwidth bound (red), 50% of the bound (blue)",
  "xAxis": {"label": "batch size B", "domain": [0, 135]},
  "yAxis": {"label": "USD per MTok", "domain": [0, 18]},
  "disableZoom": true,
  "data": [
    {"points": [[1, 16.64], [8, 2.319], [32, 0.785], [64, 0.529], [128, 0.401]], "fnType": "points", "graphType": "polyline", "color": "#C81D25"},
    {"points": [[1, 16.64], [8, 2.319], [32, 0.785], [64, 0.529], [128, 0.401]], "fnType": "points", "graphType": "scatter", "color": "#C81D25"},
    {"points": [[8, 4.639], [32, 1.57], [64, 1.059], [128, 0.803]], "fnType": "points", "graphType": "polyline", "color": "#1E6091"},
    {"points": [[8, 4.639], [32, 1.57], [64, 1.059], [128, 0.803]], "fnType": "points", "graphType": "scatter", "color": "#1E6091"}
  ]
}
```

The blue curve omits $B = 1$ (USD 33.28) to keep the scale readable.

### 5.2 Prefill is limited by arithmetic

Prefill processes all prompt tokens of a request in parallel. A forward pass costs about $2N$ FLOPs per token for a model with $N$ parameters ([part 02 L7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention)). So:

$$
r_{\text{prefill}} \approx \frac{\text{MFU} \times \text{peak FLOPS}}{2N}
$$

> [!example] Worked example: the price of an input token for Llama-3.1-8B
> Assume an MFU of 50% (an assumption for planning). Peak: 989 TFLOPS dense BF16.
>
> 1. FLOPs per token: $2 \times 8.03 \times 10^9 = 16.06$ GFLOP.
> 2. Throughput: $0.5 \times 989 \times 10^{12} / 16.06 \times 10^9 \approx 30{,}791$ tokens per second.
> 3. Cost: $12.29 / (30{,}791 \times 3{,}600) \times 10^6 \approx$ USD 0.111 per MTok.
>
> Compare with the output cost at $B = 64$ and 50% of the bound: USD 1.06 per MTok. An output token costs about $1.06 / 0.111 \approx 9.5$ times an input token here.

This ratio explains a pattern of API prices: output tokens usually cost more than input tokens. Claude Sonnet 5.5 costs USD 2 per MTok input and USD 10 per MTok output, a factor of 5 (Anthropic pricing page, checked on 2026-10-15). The exact factor is a business choice. Azure prices Llama 3.3 70B (Global) at USD 0.71 per MTok for both input and output.

The $2N$ rule ignores attention FLOPs, which grow with the square of the prompt length. For prompts of tens of thousands of tokens, prefill costs more per token ([part 02 L7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention)).

### 5.3 The cost of one request

A request uses replica time for its prompt and for its output tokens. With per-replica rates at the operating point:

$$
\text{GPU-seconds} \approx \frac{P}{r_{\text{prefill}}} + \frac{O}{r_{\text{decode}}}, \qquad \text{cost} = \text{GPU-seconds} \times \frac{\text{USD per hour}}{3600}
$$

$P$ is the number of prompt tokens and $O$ the number of output tokens. $r_{\text{decode}}$ is the total output rate of the replica, shared by all sequences in the batch.

> [!example] Worked example: 2,000 prompt tokens and 400 output tokens on Llama-3.1-8B
> Rates: $r_{\text{prefill}} = 30{,}791$ and $r_{\text{decode}} = 6{,}450 / 2 = 3{,}225$ tokens per second (50% of the bound at $B = 64$).
>
> 1. Prefill: $2{,}000 / 30{,}791 = 0.065$ s.
> 2. Decode: $400 / 3{,}225 = 0.124$ s.
> 3. Total: $0.189$ GPU-seconds. Price per second: $12.29 / 3{,}600 = 0.003414$ USD.
> 4. Cost: $0.189 \times 0.003414 \approx$ USD 0.00065 per request.
>
> The prompt is 83% of the tokens but only 34% of the GPU time.

### 5.4 Long contexts raise the price of every output token

The KV term $B \cdot \bar{L} \cdot kv$ grows with the context. A longer context makes each step read more bytes. It also limits the batch, because the KV cache must fit in memory.

> [!example] Worked example: Llama-3.1-8B on one H100 at three context lengths
> Assume about 60 GB of the 80 GB are free for the KV cache after 16 GB of weights and runtime overhead ([L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus)). The batch is 64, or the largest batch that fits.
>
> | Average context $\bar{L}$ | Largest batch in 60 GB | Batch used | Step (ms) | Tokens per second (bound) | USD per MTok (bound) |
> |---|---|---|---|---|---|
> | 2,048 | 223 | 64 | 9.92 | 6,450 | 0.529 |
> | 8,192 | 55 | 55 | 22.42 | 2,453 | 1.39 |
> | 32,768 | 13 | 13 | 21.46 | 606 | 5.64 |
>
> For 32,768 tokens: $60 \times 10^9 / (32{,}768 \times 131{,}072) = 13.97$, so at most 13 sequences. The step reads $16.06 + 13 \times 32{,}768 \times 131{,}072 / 10^9 = 16.06 + 55.83 = 71.89$ GB, which takes 21.46 ms. Throughput $13 / 0.02146 \approx 606$ tokens per second.
>
> A context 16 times longer makes each output token about 10.6 times more expensive at the bound.

This is one reason why RAG systems and agents care about context size ([context engineering L6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation)). It is also why KV cache compression and grouped-query attention matter for cost ([part 03 L6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache)).

## 6. Utilization: the hidden multiplier

The formula assumes the server runs at the operating point every second you pay for. Real traffic has a daily curve. If the GPUs do useful work only a share $u$ of the paid time:

$$
\text{effective USD per MTok} = \frac{\text{USD per MTok at full load}}{u}
$$

> [!example] Worked example: a daily traffic curve
> Load as a share of peak capacity, hour by hour:
>
> - 0.05 for 7 night hours, then 0.4 for 1 hour,
> - 0.9 for 9 working hours,
> - 0.4 for 4 evening hours, then 0.05 for 3 late hours.
>
> 1. Sum: $7(0.05) + 0.4 + 9(0.9) + 4(0.4) + 3(0.05) = 0.35 + 0.4 + 8.1 + 1.6 + 0.15 = 10.6$.
> 2. Average utilization: $u = 10.6 / 24 \approx 0.442$.
> 3. Effective cost with fixed capacity: $1.06 / 0.442 \approx$ USD 2.40 per MTok, instead of USD 1.06.

```plot
{
  "title": "Effective USD per MTok vs utilization u, for USD 1.06 per MTok at full load (blue)",
  "xAxis": {"label": "utilization u", "domain": [0.05, 1]},
  "yAxis": {"label": "USD per MTok", "domain": [0, 12]},
  "disableZoom": true,
  "data": [
    {"fn": "1.06/x", "color": "#1E6091"}
  ]
}
```

Ways to raise $u$:

- **Autoscaling** removes idle replicas ([L5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing)). It is limited by cold starts and by the smallest unit, one replica.
- **Fill idle hours** with batch work: evaluations, embeddings, offline summaries.
- **Share a pool**: serve several applications, or several LoRA adapters of one base model, on the same replicas.
- **Pick a smaller unit** for low traffic: a single smaller GPU instead of an 8-GPU VM ([L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus)).

## 7. API vs self-hosting: the break-even

### 7.1 The break-even throughput

Set the self-hosted price per MTok equal to the API price $p$ and solve for the throughput:

$$
r_{\text{break-even}} = \frac{\text{USD per hour}}{p \times 3600} \times 10^6
$$

If your deployment cannot sustain this throughput, every month, the API is cheaper.

> [!example] Worked example: Llama 70B on one ND96isr H100 v5 vs an API
> API: Llama 3.3 70B on Microsoft Foundry, Global deployment, USD 0.71 per MTok for input and for output. The Azure Retail Prices API shows the meters "Llama 3.3 70B Inp glbl Tokens" and "Llama 3.3 70B Outp glbl Tokens" at USD 0.00071 per 1K tokens (eastus, checked on 2026-10-15).
>
> | VM price | USD per hour | Break-even tokens per second |
> |---|---|---|
> | on-demand | 98.32 | $98.32 / (0.71 \times 3{,}600) \times 10^6 \approx 38{,}466$ |
> | 1-year reservation | 62.92 | about 24,618 |
> | 3-year reservation | 43.16 | about 16,887 |
> | spot | 18.17 | about 7,109 |

### 7.2 What the VM can produce

Llama 3.3 70B is derived from Llama 3.1 70B, and its model card lists Llama-3.1-70B as the base model. This lesson uses the Llama-3.1-70B shapes: 80 layers, 8 KV heads and head dimension 128. That gives 327,680 bytes of KV cache per token. The model has about 70.6B parameters. With tensor parallelism over 8 GPUs ([part 04 L8](/notes/ai/llm-systems/04-inference/l8-parallelism)), the aggregate bandwidth is $8 \times 3.35 = 26.8$ TB/s.

> [!example] Worked example: the decode bound for 70B on 8 H100s, context 2,048
> BF16 weights: $70.6 \times 10^9 \times 2 = 141.2$ GB. At $B = 256$:
>
> 1. KV bytes: $256 \times 2{,}048 \times 327{,}680 = 171.8$ GB.
> 2. Step: $(141.2 + 171.8) \times 10^9 / 26.8 \times 10^{12} = 11.68$ ms.
> 3. Bound: $256 / 0.01168 \approx 21{,}920$ tokens per second.
>
> With FP8 weights (70.6 GB, [part 04 L7](/notes/ai/llm-systems/04-inference/l7-quantization)): step 9.04 ms, bound about 28,304 tokens per second.
>
> Memory check: $141.2 + 171.8 = 313$ GB fits in $8 \times 80 = 640$ GB. Compute check: $2 \times 70.6 \times 10^9 \times 256 = 36.1$ TFLOP per step, or 4.57 ms at $8 \times 989$ TFLOPS. Below 11.68 ms, so memory-bound.

![Alt text: bars compare the break-even throughput for four VM prices with the decode throughput that one 8-GPU H100 VM can reach for Llama 70B](/notes/media/llm-systems/figures/05-7-break-even.svg)

Now compare. At 50% of the bound, the VM produces about 10,960 tokens per second in BF16 and 14,152 in FP8.

- **On-demand** needs 38,466. At this operating point even the FP8 bound (28,304) is too low. Larger batches with an FP8 KV cache can raise the bound. But a real server reaches only part of it, and only in hours that traffic fills.
- **3-year reservation** needs 16,887. Only a near-bound FP8 server at full utilization reaches it.
- **Spot** needs 7,109, which a well-run server reaches. But spot capacity can disappear at any time.

Interpretation of these notes: for a popular open model that a large provider sells per token, self-hosting rarely wins on price alone. The provider batches traffic from many customers, runs near full utilization and buys GPUs at volume. Self-hosting wins for other reasons:

- data must stay in your network or region,
- you serve fine-tuned or custom weights that no API offers,
- you need isolated, predictable latency,
- the volume is very high and steady, with committed discounts and quantization.

### 7.3 The monthly view

One VM for a month costs $98.32 \times 730 \approx$ USD 71,774 (730 hours is an average month). At USD 0.71 per MTok, that money buys about **101 billion** API tokens per month. That is the same as 38,466 tokens per second, every second of the month.

> [!example] Worked example: a real workload of 60 million tokens per day
> A team sends 50 million input tokens and 10 million output tokens per day.
>
> 1. API (Llama 3.3 70B, Global): $60 \times 0.71 =$ USD 42.60 per day, about USD 1,278 per 30 days.
> 2. One on-demand VM: $98.32 \times 24 =$ USD 2,359.68 per day, about USD 70,790 per 30 days.
> 3. Ratio: about 55 times. The VM would be almost idle: 10 million output tokens per day is about 116 tokens per second on average.
>
> For comparison only, Claude Sonnet 5.5 at USD 2 input and USD 10 output per MTok costs $50 \times 2 + 10 \times 10 =$ USD 200 per day without caching. It is a different and larger model, so this is not a like-for-like price comparison.

Hidden costs push self-hosting further up: engineers on call, a second replica for redundancy, storage, egress, observability and failed requests. Interpretation of these notes: count at least one spare replica in any self-hosted plan ([L8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations)).

## 8. Discounts and how they change the math

### 8.1 Commitments: reservations and committed use

A reservation lowers the hourly price in exchange for a term. The ND96isr H100 v5 example gives about 36% off for 1 year and about 56% off for 3 years. AWS and Google Cloud offer similar commitment programs. A commitment only pays if you use the capacity for the whole term, so it multiplies the risk of low utilization. The provisioned throughput products of managed platforms are commitments of the same kind ([L6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms)).

### 8.2 Spot capacity

Spot capacity is about 81.5% cheaper in the example. The cloud can reclaim it at short notice. It fits:

- offline batch jobs that can restart,
- extra replicas behind an on-demand base, if the router stops sending traffic to a reclaimed replica quickly ([L5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing)).

A model load takes minutes ([L3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading)). Frequent reclaims waste that time.

### 8.3 Batch APIs and service tiers

Several APIs give 50% off for work that can wait (all checked on 2026-10-15):

- Amazon Bedrock offers select models "for batch inference at a 50% lower price compared to on-demand inference pricing".
- Microsoft Foundry's Global Batch has "50% less cost than Global Standard" with a "24-hour target turnaround".
- The Anthropic Message Batches API gives "a 50% discount on both input and output tokens".

Bedrock also has service tiers. For several providers its price page says: "Priority tier pricing is at 75% premium to Standard tier pricing" and "Flex tier pricing is at 50% discount to Standard tier pricing".

### 8.4 Caching

**Provider prompt caching** lowers the price of repeated input ([context engineering L7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching), [LLM APIs L2](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops)). For Claude Sonnet 5.5: input USD 2.00, cache hits USD 0.10, 5-minute cache writes USD 2.50, 1-hour writes USD 4.00 per MTok.

> [!example] Worked example: the blended input price at a cache hit rate
> Let $h$ be the share of input tokens read from cache. Ignore writes first.
>
> $$
> \text{blended} = (1 - h) \times 2.00 + h \times 0.10
> $$
>
> - $h = 0.5$: $1.00 + 0.05 = 1.05$ USD per MTok.
> - $h = 0.8$: $0.40 + 0.08 = 0.48$ USD per MTok, 76% less than USD 2.00.
> - $h = 0.9$: $0.20 + 0.09 = 0.29$ USD per MTok.
>
> With 80% hits and 10% 5-minute writes: $0.1 \times 2.00 + 0.8 \times 0.10 + 0.1 \times 2.50 = 0.20 + 0.08 + 0.25 = 0.53$ USD per MTok.

**Self-hosted prefix caching** has no price list. A cache hit skips prefill for the cached blocks ([part 04 L9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)). It lowers the prefill share of GPU-seconds in section 5.3 and the TTFT. It does not change the decode cost. In the request example, a full hit on the 2,000-token prompt saves at most 0.065 of 0.189 GPU-seconds, about 34%.

## 9. A checklist for any cost question

1. **Unit price.** USD per hour for the VM, or USD per MTok for input and for output. Write the date and region.
2. **Throughput at the operating point.** From a benchmark, or from the bandwidth bound times an efficiency you state.
3. **Input and output separately.** Prefill and decode have different rates.
4. **Utilization.** The average load as a share of paid capacity.
5. **Discounts.** Reservation, spot, batch, caching.
6. **Redundancy and people.** At least N+1 replicas, and the team that runs them.
7. **Compare like with like.** The same model, or models of the same quality on your evaluation set.

## 10. Exercises

Write your code in the lab folder `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, in the notebook folder `llm-systems/`.

1. **The converter.** Write `usd_per_mtok(usd_per_hour, tokens_per_s)` and its inverse. Acceptance test: `usd_per_mtok(98.32, 10_000)` is about 2.731, and the inverse of 2.731 gives about 10,000.
   - Hint 1: an hour has 3,600 seconds.
   - Hint 2: the inverse divides the hourly price by the price per MTok.
2. **The bandwidth table.** Reproduce the table of section 5.1 for Llama-3.1-8B. Then compute it for Llama-3.1-70B on 8 GPUs at $B = 64, 128, 256$. Acceptance test: 6,450 tokens per second at $B = 64$ for 8B, and 21,920 at $B = 256$ for 70B in BF16.
   - Hint 1: the KV term is $B \times \bar{L} \times kv$.
   - Hint 2: for 70B with TP=8, use 8 times the bandwidth of one GPU.
3. **Break-even.** Compute the break-even throughput for four VM prices and an API price of USD 0.71 per MTok. Acceptance test: about 38,466 tokens per second on-demand and about 7,109 on spot.
   - Hint 1: solve the core formula for $r$.
   - Hint 2: the reservation numbers in the price API are term totals.
4. **Blended cache price.** Write `blended_input_price(base, hit_price, hit_rate, write_price, write_rate)`. Acceptance test: 0.48 at 80% hits, and 0.53 with 10% writes at USD 2.50.
   - Hint 1: the three shares must add to 1.
   - Hint 2: misses pay the base price.
5. **A daily curve.** Encode the 24-hour load of section 6 and compute $u$ and the effective price. Acceptance test: $u \approx 0.442$ and about USD 2.40 per MTok.
   - Hint 1: use a list of 24 floats.
   - Hint 2: the effective price divides by $u$.

## 11. Common mistakes

1. **"An H100 costs USD 12 per hour, so 1 million tokens cost about USD 12."** The hour holds many tokens. Divide by the tokens produced in that hour: at 3,225 tokens per second, USD 12.29 per hour gives USD 1.06 per MTok.
2. **"Cost per token is a property of the model and the GPU."** It depends on the batch size, the context length and the utilization. For Llama-3.1-8B it varies about 41 times between batch 1 and batch 128.
3. **"Input and output tokens cost the same GPU time."** Prefill is compute-bound and parallel. Decode is memory-bound and sequential. In the example, an output token costs about 9.5 times an input token.
4. **"The bandwidth bound is the throughput I will get."** It is an upper bound. Real engines reach part of it. Measure your server with a benchmark.
5. **"Self-hosting an open model is always cheaper than an API."** At on-demand prices, one 8-GPU H100 VM must sustain about 38,466 tokens per second to match USD 0.71 per MTok. That is above its bandwidth bound for a 70B model at batch 256 and 2,048 tokens of context.
6. **"A 3-year reservation makes self-hosting cheap."** It lowers the hourly price by about 56%, but you pay for every hour of three years. Low utilization still multiplies the cost.
7. **"Spot capacity is just a cheaper on-demand price."** The cloud can reclaim it. Every reclaim costs a model load of minutes and the requests in progress.
8. **"Prefix caching halves my GPU bill."** It removes prefill work for cached blocks. Decode work stays the same, and decode is often most of the GPU time.

## 12. One-minute explanation

To compare self-hosting with an API, I convert a GPU price per hour to a price per million tokens. The formula is USD per hour divided by tokens per second times 3,600, times one million. So everything depends on the throughput at my operating point. Decode is memory-bound, so each step reads all weights plus every sequence's KV cache. For Llama-3.1-8B on one H100, batch 64 gives a bound of about 6,450 tokens per second with a TPOT of about 10 ms. Prefill is compute-bound and much cheaper per token. Then I divide by utilization, because I pay for idle hours: a daily curve with 44% average load more than doubles the cost. For the break-even, I solve the formula for throughput. A USD 98.32 per hour 8-GPU VM must sustain about 38,000 tokens per second to match an API at USD 0.71 per MTok. That is above the bandwidth bound for a 70B model at batch 256. So self-hosting wins on control, custom weights, data residency or very high steady volume with discounts, rarely on price alone.

## 13. Check questions

```check
{
  "question": "Interview follow-up: \"Derive the cost per million tokens from a GPU price.\" Use USD 12.29 per GPU-hour and 3,225 tokens per second.",
  "hint": "Convert the hourly price to a price per second first.",
  "answer": "Price per second: $12.29 / 3{,}600 = 0.003414$ USD. Price per token: $0.003414 / 3{,}225 = 1.0586 \\times 10^{-6}$ USD. Per million tokens: about **USD 1.06**.\n\nIn one formula: $\\text{USD per MTok} = \\frac{\\text{USD per hour}}{r \\times 3600} \\times 10^6 = \\frac{12.29}{3{,}225 \\times 3{,}600} \\times 10^6 \\approx 1.06$. Units: $\\frac{\\text{USD/h}}{\\text{tokens/s} \\times \\text{s/h}} = \\text{USD/token}$."
}
```

```check
{
  "question": "Interview follow-up: \"Why does a larger batch make tokens cheaper, and what is the price?\" Use the bandwidth model for Llama-3.1-8B on one H100.",
  "hint": "What does a decode step read from memory, and which part grows with B?",
  "answer": "In decode, each step reads all 16.06 GB of weights once, whatever the batch size. A larger batch shares that read among more sequences. At $B = 1$ the step reads 16.33 GB (weights plus one KV cache of 2,048 tokens), takes 4.87 ms and yields 205 tokens per second: USD 16.64 per MTok at USD 12.29 per hour. At $B = 128$ the step reads 50.42 GB, takes 15.05 ms and yields $128 / 0.01505 = 8{,}505$ tokens per second: USD 0.401 per MTok, about 41 times cheaper.\n\nThe price: the step time is the TPOT of every user, and it grows from 4.87 ms to 15.05 ms, about 3.1 times. The KV cache also grows, to 32 GiB at $B = 128$. So the batch size is limited by the TPOT SLO and by KV memory. Beyond the ridge point the step also becomes compute-bound, and the gain stops."
}
```

```check
{
  "question": "Interview follow-up: \"At what volume does self-hosting Llama 70B beat an API at USD 0.71 per MTok?\" Use the ND96isr H100 v5 on-demand price.",
  "hint": "Solve the core formula for the throughput, then compare with the bandwidth bound.",
  "answer": "Break-even throughput: $r = \\frac{98.32}{0.71 \\times 3{,}600} \\times 10^6 \\approx 38{,}466$ tokens per second, sustained every hour you pay for. Per month: $98.32 \\times 730 \\approx$ USD 71,774, which buys about 101 billion API tokens.\n\nCan the VM produce that? The decode bound for 70B with TP=8 at batch 256 and 2,048 tokens of context is about 21,920 tokens per second in BF16 and 28,304 with FP8 weights. Both are below 38,466, and real servers reach only part of the bound. So at this operating point and on-demand prices, the API is cheaper at every volume. Larger batches with an FP8 KV cache raise the bound, so measure before you decide. With a 3-year reservation (about USD 43.16 per hour) the break-even falls to about 16,887 tokens per second, reachable only near the FP8 bound at full utilization. Self-hosting is then justified by control, custom weights, residency or latency isolation, not by price."
}
```

```check
{
  "question": "Why do APIs often charge more for output tokens than for input tokens? Give the GPU-level reason with numbers.",
  "hint": "Compare a compute-bound phase and a memory-bound phase.",
  "answer": "Prefill handles all prompt tokens of a request in parallel, so it is compute-bound and reaches a high token rate: with 50% MFU, about $0.5 \\times 989 \\times 10^{12} / (2 \\times 8.03 \\times 10^9) \\approx 30{,}791$ tokens per second for Llama-3.1-8B on one H100, about USD 0.111 per MTok at USD 12.29 per hour. Decode produces one token per sequence per step and must read all weights each step, so it is memory-bound: about 3,225 tokens per second at batch 64 with 50% of the bound, about USD 1.06 per MTok. So an output token uses about 9.5 times the GPU time. Providers pass a part of this to prices: Claude Sonnet 5.5 is USD 2 input and USD 10 output per MTok. Some providers choose equal prices, as Azure does for Llama 3.3 70B."
}
```

```check
{
  "question": "Your GPUs run at full speed only 30% of the paid hours. The full-load cost is USD 1.06 per MTok. What is the effective cost, and name two ways to improve it.",
  "hint": "Divide by the utilization.",
  "answer": "Effective cost $= 1.06 / 0.3 \\approx$ USD 3.53 per MTok. You pay for 100% of the hours and use 30%.\n\nWays to improve: autoscale replicas with demand (limited by cold starts and the minimum of one replica), fill idle hours with batch work such as evaluations or embeddings, share one pool among several applications or LoRA adapters, or move low traffic to a smaller GPU or to a pay-per-token API."
}
```

```check
{
  "question": "Interview follow-up: \"Your agent resends a 20,000-token prefix on every call. How does caching change the input bill on Claude Sonnet 5.5?\" Assume 90% of input tokens are cache hits and ignore writes.",
  "hint": "Weight the hit price and the normal price by their shares.",
  "answer": "Blended input price: $(1 - 0.9) \\times 2.00 + 0.9 \\times 0.10 = 0.20 + 0.09 = $ USD 0.29 per MTok, against USD 2.00 without caching: about 85.5% less on input. Output tokens are not cached, so the output price of USD 10 per MTok stays. Writes cost extra: a 5-minute write is USD 2.50 and a 1-hour write USD 4.00 per MTok, so a cold start of each cache costs a little more than a normal call.\n\nSelf-hosted, the same effect appears as saved GPU time: a prefix cache hit skips prefill for the cached blocks and lowers TTFT, but decode cost stays."
}
```

```check
{
  "question": "Interview follow-up: \"Reserved, spot or on-demand for an LLM serving fleet?\"",
  "hint": "Match each price type to a part of the daily load curve.",
  "answer": "With the ND96isr H100 v5 example (eastus, checked on 2026-10-15): on-demand USD 98.32 per hour, 1-year reservation about USD 62.92 (36% off), 3-year about USD 43.16 (56% off), spot about USD 18.17 (81.5% off).\n\nA common design: reserve the base load that runs all day, add on-demand replicas for daily peaks (the autoscaler manages these), and use spot only for work that can restart, such as batch jobs or extra replicas behind a router that stops using reclaimed nodes quickly. Reservations are only cheaper if utilization over the whole term is high: at 50% utilization a 36% discount still leaves you paying more per useful token than an on-demand fleet that scales to the load perfectly. Spot reclaims cost a model load of minutes each time."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\ndef usd_per_mtok(usd_per_hour, tokens_per_s):\n    return usd_per_hour / (tokens_per_s * 3600) * 1e6\n\n\ndef tokens_per_s_for(usd_per_hour, usd_per_mtok_target):\n    return usd_per_hour / (usd_per_mtok_target * 3600) * 1e6\n\n\nprint(round(usd_per_mtok(98.32, 10_000), 3))\nprint(round(tokens_per_s_for(98.32, 2.731)))\n```\n\nOutput: `2.731` and `10000`."
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\ndef usd_per_mtok(usd_per_hour, tokens_per_s):\n    \"\"\"Price of one million tokens at a steady throughput.\"\"\"\n    return usd_per_hour / (tokens_per_s * 3600) * 1e6\n\n\ndef decode_bound(batch, ctx, weight_bytes, kv_bytes_per_token, bandwidth):\n    \"\"\"Upper bound for decode: every step reads all weights plus every sequence's KV cache.\"\"\"\n    step = (weight_bytes + batch * ctx * kv_bytes_per_token) / bandwidth   # seconds per step\n    return step, batch / step                                              # TPOT, tokens per second\n\n\nW8 = 8.03e9 * 2           # Llama-3.1-8B weights in BF16, bytes\nKV8 = 131_072             # KV cache per token, bytes (part 03 L3)\nBW = 3.35e12              # H100 SXM HBM3 bandwidth, bytes per second\nGPU_HOUR = 98.32 / 8      # one GPU of an ND96isr H100 v5 VM, USD\n\nprint(\" B   TPOT ms   tokens/s   USD/MTok (bound)   USD/MTok (50%)\")\nfor b in (1, 8, 32, 64, 128):\n    step, tps = decode_bound(b, 2048, W8, KV8, BW)\n    print(f\"{b:3d} {step * 1e3:9.2f} {tps:10.0f} {usd_per_mtok(GPU_HOUR, tps):18.3f} {usd_per_mtok(GPU_HOUR, tps / 2):16.3f}\")\n```\n\nOutput:\n\n```text\n B   TPOT ms   tokens/s   USD/MTok (bound)   USD/MTok (50%)\n  1      4.87        205             16.640           33.280\n  8      5.44       1472              2.319            4.639\n 32      7.36       4349              0.785            1.570\n 64      9.92       6450              0.529            1.059\n128     15.05       8505              0.401            0.803\n```\n\nFor 70B, call `decode_bound(b, 2048, 70.6e9 * 2, 327_680, 8 * 3.35e12)`: $B = 256$ gives a step of 11.68 ms and about 21,920 tokens per second."
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\ndef breakeven_tps(usd_per_hour, api_usd_per_mtok):\n    \"\"\"Steady tokens per second at which self-hosting costs the same as the API.\"\"\"\n    return usd_per_hour / (api_usd_per_mtok * 3600) * 1e6\n\n\nAPI = 0.71                                  # USD per MTok, Llama 3.3 70B, Global, input and output\nprices = {\"on-demand\": 98.32, \"1-year reserved\": 551_221 / 8760,\n          \"3-year reserved\": 1_134_310 / (3 * 8760), \"spot\": 18.169536}\nfor name, p in prices.items():\n    print(f\"{name:16s} USD {p:6.2f}/h  break-even {breakeven_tps(p, API):8.0f} tokens/s\")\n\nmonth = 98.32 * 730\nprint(f\"one VM for a month: USD {month:,.0f} = {month / API / 1e3:.1f} billion API tokens\")\n```\n\nOutput:\n\n```text\non-demand        USD  98.32/h  break-even    38466 tokens/s\n1-year reserved  USD  62.92/h  break-even    24618 tokens/s\n3-year reserved  USD  43.16/h  break-even    16887 tokens/s\nspot             USD  18.17/h  break-even     7109 tokens/s\none VM for a month: USD 71,774 = 101.1 billion API tokens\n```"
}
```

```check
{
  "question": "Exercise 4: show a reference solution.",
  "answer": "```python\ndef blended_input_price(base, hit_price, hit_rate, write_price=None, write_rate=0.0):\n    \"\"\"Average USD per MTok of input when a share of tokens is read from cache.\"\"\"\n    write_price = base if write_price is None else write_price\n    miss_rate = 1.0 - hit_rate - write_rate\n    return miss_rate * base + hit_rate * hit_price + write_rate * write_price\n\n\nfor h in (0.0, 0.5, 0.8, 0.9):\n    print(h, round(blended_input_price(2.00, 0.10, h), 3))\nprint(\"80% hits, 10% 5-minute writes:\", round(blended_input_price(2.00, 0.10, 0.8, 2.50, 0.1), 3))\n```\n\nOutput:\n\n```text\n0.0 2.0\n0.5 1.05\n0.8 0.48\n0.9 0.29\n80% hits, 10% 5-minute writes: 0.53\n```"
}
```

```check
{
  "question": "Exercise 5: show a reference solution.",
  "answer": "```python\n# Load as a share of peak capacity, for each hour of one day (24 values).\nload = [0.05] * 7 + [0.4] + [0.9] * 9 + [0.4] * 4 + [0.05] * 3\nu = sum(load) / len(load)\nfull_load_cost = 1.06                     # USD per MTok at the operating point (bandwidth model, 50%)\nprint(f\"average utilization {u:.3f}, cost {full_load_cost / u:.2f} USD per MTok\")\n```\n\nOutput: `average utilization 0.442, cost 2.40 USD per MTok`."
}
```

## 14. Links

- Previous: [L6: Managed platforms](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms)
- Next: [L8: Production operations](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations)
- GPU memory and instance types: [L2: Sizing GPUs for a model](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus)
- Who manages what in each hosting option: [L1: Ways to host a model](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model)
- Memory-bound decode and the roofline: [part 04 L3: Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)
- Batching: [part 04 L4: Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)
- FP8 weights: [part 04 L7: Quantization](/notes/ai/llm-systems/04-inference/l7-quantization)
- KV bytes per token: [part 03 L3: The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)
- Bandwidth and FLOPS of an H100: [part 01 L5: GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth)
- Provider caching: [context engineering L7: Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) and [context engineering L6: The cost of a conversation](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation)
- Formula sheet: [Formula and numbers sheet](/notes/ai/llm-systems/08-interview-drills/l5-formula-sheet)
- Interview drill: [Drill: inference and cloud hosting](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud)

### Sources

- Azure Retail Prices API, `armSkuName eq 'Standard_ND96isr_H100_v5'` and `contains(productName, 'Llama')` in eastus: https://prices.azure.com/api/retail/prices (checked on 2026-10-15)
- Azure Retail Prices REST API documentation: https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices (checked on 2026-10-15)
- Microsoft, ND H100 v5 sizes series (8 H100 80 GB GPUs, NVLink 4.0): https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ndh100v5-series (checked on 2026-10-15)
- Google Cloud, Agent Platform pricing (prediction GPU prices, us-central1): https://cloud.google.com/products/gemini-enterprise-agent-platform/pricing (checked on 2026-10-15)
- Anthropic, Claude pricing (Sonnet 5.5, cache prices, Batch API discount): https://platform.claude.com/docs/en/about-claude/pricing (checked on 2026-10-15)
- Amazon Bedrock pricing (batch discount, Priority and Flex tier footnotes): https://aws.amazon.com/bedrock/pricing/ (checked on 2026-10-15)
- Microsoft Foundry, deployment types (Global Batch): https://learn.microsoft.com/azure/foundry/foundry-models/concepts/deployment-types (checked on 2026-10-15)
- Meta, Llama 3.3 70B Instruct model card (base model Llama-3.1-70B): https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct (checked on 2026-10-15)
- NVIDIA H100 product page (3.35 TB/s, BF16 throughput): https://www.nvidia.com/en-us/data-center/h100/ (checked on 2026-10-15)
