---
title: "L6: Speculative decoding"
order: 6
summary: "A small draft proposes several tokens and the big model checks all of them in one forward pass. A randomized accept-or-resample rule keeps the output distribution exactly equal to the big model's. The lesson proves the rule, derives the expected tokens per step (1 − α^(γ+1)) / (1 − α), computes speedups, compares draft sources (draft model, n-gram, Medusa, EAGLE, MTP) and shows when speculation stops paying."
status: not-started
tags: [inference, speculative-decoding, decoding, latency, rejection-sampling, eagle, mtp, vllm]
---

## 1. The question this idea answers

Decoding produces one token per forward pass. Each pass must read every weight of the model from GPU memory. For Llama-3.1-8B on one H100 at batch size 1, that is about 16 GB of reads for one token. The arithmetic of that token takes about 0.3% of the time. The rest of the time, the compute units wait for memory ([L3: Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)).

So the question is: **can one read of the weights produce more than one token, without changing what the model would say?**

Speculative decoding answers yes. A cheap **draft** guesses the next few tokens. The big **target model** checks all the guesses in one forward pass. A special accept-or-resample rule decides how many guesses to keep. The rule guarantees that the final text has exactly the same probability distribution as normal sampling from the target model. Leviathan, Kalman and Matias (ICML 2023, arXiv 2211.17192) and Chen et al. at DeepMind (arXiv 2302.01318, February 2023) published the method at about the same time.

An interviewer usually asks four things. Why does it work at all? What is the acceptance rule, and why is it exact? What speedup can you expect? When does it **not** help? This lesson covers all four, plus the draft methods that engines use today.

## 2. Mental model

> [!analogy] A junior writer and a senior editor
> A senior editor writes slowly, but she can read a whole sentence as fast as one word. A junior writer is fast but less skilled. The junior drafts the next four words. The editor reads all four at once and checks them from left to right. She keeps each word that she could have written herself, using a fair coin with the right bias. At the first word she rejects, she writes her own word there and throws away the rest of the draft. So every round gives at least one word in her style, and often several.
>
> **Where it stops working:** the editor's coin is the key. She does not simply keep "words she likes". She keeps a word with probability $\min(1, p/q)$, and she replaces a rejected word in a specific way. Only that rule makes the final text statistically identical to her own writing. Also, the editor's "free" reading of extra words is only free while she is waiting anyway. When she is busy with many other documents (a large batch), each extra word costs her real time.

## 3. Terms

| Term | Plain meaning |
|---|---|
| target model | The large model whose output we want. Its next-token distribution is $p$. |
| draft (draft model) | A cheap source of guesses. Its next-token distribution is $q$. It can be a small model, extra heads, or a text lookup. |
| draft tokens | The tokens the draft proposes in one step. |
| speculation length $\gamma$ | The number of draft tokens per step. vLLM calls it `num_speculative_tokens`. |
| verification pass | One forward pass of the target model over the prefix plus all draft tokens. It returns $\gamma + 1$ distributions. |
| acceptance probability $\beta$ | The probability that one draft token is accepted in one context. $\beta = \sum_x \min(p(x), q(x))$. |
| acceptance rate $\alpha$ | The average of $\beta$ over contexts: $\alpha = E[\beta]$. |
| rejection sampling | A method to draw samples from one distribution using proposals from another and a random accept test. |
| residual distribution | The distribution used after a rejection: $\mathrm{norm}(\max(0, p - q))$. |
| correction token | The token sampled from the residual distribution at the first rejected position. |
| bonus token | The extra token sampled from the target's last distribution when all draft tokens are accepted. |
| tokens per step | The number of tokens one verification pass produces. The expectation is $(1-\alpha^{\gamma+1})/(1-\alpha)$. |
| cost coefficient $c$ | The time of one draft forward pass divided by the time of one target forward pass. |
| lossless | The output distribution equals the target model's distribution. Speculative sampling is lossless in exact arithmetic. |
| n-gram (prompt lookup) drafting | Drafting by copying the tokens that followed an earlier match of the last few tokens in the prompt or the output. No model needed. |
| Medusa heads | Extra output heads on the target model that predict tokens 2, 3, ... positions ahead. |
| EAGLE | A small draft head that reads the target model's hidden features. EAGLE-2 and EAGLE-3 are later versions. |
| multi-token prediction (MTP) | Extra modules trained with the model to predict a later token. DeepSeek-V3 uses one MTP module, and engines use it as a draft. |
| token tree | Several candidate continuations checked in one pass with a special attention mask. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. Why one-token decoding wastes the GPU

### 4.1 The numbers for Llama-3.1-8B on one H100

A decode step at batch size 1 multiplies one token vector by every weight matrix. It must read all weights once. Use the hardware numbers of [L5: GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth): about 3.35 TB/s of HBM bandwidth and about 989 TFLOPS dense BF16.

> [!example] Worked example: one decode step, one sequence
> 1. Weight bytes: $8.03 \times 10^9 \text{ parameters} \times 2 \text{ bytes} \approx 16.06 \times 10^9$ bytes.
> 2. Time to read them: $16.06 \times 10^9 / 3.35 \times 10^{12} \approx 4.79$ ms.
> 3. FLOPs for one token: about $2 \times 8.03 \times 10^9 \approx 16.06 \times 10^9$ FLOPs (one multiply and one add per weight, [L2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication)).
> 4. Time for that arithmetic at peak: $16.06 \times 10^9 / 989 \times 10^{12} \approx 16.2$ µs.
> 5. Share of the step that does arithmetic: $16.2 \text{ µs} / 4.79 \text{ ms} \approx 0.34\%$.
>
> These are ideal roofline numbers. They ignore the KV cache reads, which are small for a short context.

### 4.2 Checking 5 tokens costs about the same as producing 1

Now feed 5 tokens through the target in one pass instead of 1. The weights are still read once. The arithmetic grows 5 times: $5 \times 16.2 \approx 81$ µs. That is still far below the 4.79 ms of memory reads. So, in this memory-bound regime, one pass over 5 tokens takes about as long as one pass over 1 token.

> [!key] The core idea
> In the memory-bound decode regime, the target model can **score** $\gamma + 1$ positions for about the price of one. The only hard part is to know *which* tokens to score. A draft supplies them, and a careful accept rule keeps the output exact.

The target cannot simply **generate** 5 tokens in one pass. Token 2 depends on token 1, which is not known before the pass. But suppose somebody guesses tokens 1 to 4. Then the target computes its distributions for positions 1 to 5 in parallel. Causal attention lets each position see only the guesses before it ([L4: Causal masking and generation](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation)).

## 5. The algorithm

### 5.1 One speculative step

The paper's Algorithm 1 (Leviathan et al.) has these steps. Here $p_i$ is the target's distribution at draft position $i$, and $q_i$ is the draft's distribution there.

1. **Draft.** For $i = 1$ to $\gamma$: compute $q_i$ from the prefix plus the earlier drafts $x_1 \dots x_{i-1}$. Sample $x_i \sim q_i$.
2. **Verify.** Run the target once on the prefix plus $x_1 \dots x_\gamma$. Read out $p_1, \dots, p_{\gamma+1}$.
3. **Accept or reject, left to right.** For each $i$, draw $r_i$ uniform in $[0, 1)$. Accept $x_i$ if $r_i < p_i(x_i) / q_i(x_i)$. Stop at the first rejection. Call $n$ the number of accepted drafts.
4. **Add one target token.** If $n < \gamma$, sample a correction token from $\mathrm{norm}(\max(0, p_{n+1} - q_{n+1}))$. If $n = \gamma$, sample a bonus token from $p_{\gamma+1}$.
5. **Return** $x_1 \dots x_n$ plus that one token: between $1$ and $\gamma + 1$ new tokens.

![Alt text: a draft proposes four tokens, one target pass scores five positions, two drafts pass, the third fails, and the target adds a correction token](/notes/media/llm-systems/figures/04-6-draft-and-verify.svg)

```video
{"src": "/notes/media/llm-systems/manim/m19-speculative-decoding.mp4", "caption": "A draft proposes four tokens, one target pass scores them, two are accepted, one is rejected and replaced, and the last one is discarded."}
```

### 5.2 The greedy case first

With temperature 0, the target always takes the most likely token (greedy decoding, [L5: Sampling and structured output](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output)). The rule becomes simple: accept draft $x_i$ if it equals $\arg\max p_i$. At the first mismatch, output $\arg\max p_i$ instead and stop.

> [!example] Worked example: greedy verification
> Prefix: "the cat sat on the". Drafts: "mat", ".", "It", "slept".
>
> | Position | Draft | Target argmax | Result |
> |---|---|---|---|
> | 1 | mat | mat | accept |
> | 2 | . | . | accept |
> | 3 | It | The | reject, output "The" |
> | 4 | slept | (not used) | discarded |
>
> Output of the step: "mat", ".", "The". That is exactly what greedy decoding of the target would produce, in one target pass instead of three.

In the greedy case the proof is obvious. Every kept token is the target's argmax given the tokens before it.

### 5.3 The sampling case: the accept rule

With sampling, "keep the draft if the target agrees" is not enough. The target does not have one answer. It has a distribution. The rule must make the kept token follow $p$ exactly.

The rule for one position:

1. The draft proposes $x \sim q$.
2. Accept $x$ with probability $\min\left(1, \dfrac{p(x)}{q(x)}\right)$.
3. If rejected, sample from the **residual distribution**

$$
p'(x) = \frac{\max(0,\ p(x) - q(x))}{\sum_{y} \max(0,\ p(y) - q(y))}
$$

Read the rule in words. If the draft is less confident than the target in $x$ ($q(x) \le p(x)$), always accept. If the draft over-proposes $x$ ($q(x) > p(x)$), accept only the fraction $p(x)/q(x)$ of the time. The residual puts the missing probability back on tokens that the draft under-proposed.

> [!example] Worked example: the cat sat on the ...
> Four candidate words. Target $p$ and draft $q$:
>
> | Word | $p$ | $q$ | $\min(p, q)$ | accept prob. $\min(1, p/q)$ | $\max(0, p - q)$ |
> |---|---|---|---|---|---|
> | mat | 0.40 | 0.20 | 0.20 | 1 | 0.20 |
> | rug | 0.30 | 0.50 | 0.30 | 0.6 | 0 |
> | sofa | 0.20 | 0.10 | 0.10 | 1 | 0.10 |
> | bed | 0.10 | 0.20 | 0.10 | 0.5 | 0 |
> | sum | 1.00 | 1.00 | **0.70** | | **0.30** |
>
> 1. Acceptance probability: $\beta = \sum \min(p, q) = 0.70$. Rejection probability: $1 - \beta = 0.30$.
> 2. Residual: $(0.20, 0, 0.10, 0) / 0.30 = (2/3, 0, 1/3, 0)$.
> 3. Final probability of "mat": accepted path $q \cdot 1 = 0.20$, plus rejected path $0.30 \times 2/3 = 0.20$. Total $0.40 = p(\text{mat})$.
> 4. "rug": $0.50 \times 0.6 = 0.30$, plus $0.30 \times 0 = 0$. Total $0.30 = p(\text{rug})$.
> 5. "sofa": $0.10 \times 1 + 0.30 \times 1/3 = 0.20 = p(\text{sofa})$.
> 6. "bed": $0.20 \times 0.5 + 0 = 0.10 = p(\text{bed})$.
>
> Every word comes out with exactly the target's probability.

The same check by simulation, measured in these notes:

```python
import numpy as np

vocab = ["mat", "rug", "sofa", "bed"]
p = np.array([0.40, 0.30, 0.20, 0.10])   # target model
q = np.array([0.20, 0.50, 0.10, 0.20])   # draft model

def one_position(rng):
    x = rng.choice(4, p=q)                    # 1. the draft proposes x ~ q
    if rng.random() < min(1.0, p[x] / q[x]):  # 2. accept with min(1, p/q)
        return x
    residual = np.maximum(p - q, 0.0)         # 3. else resample from
    residual /= residual.sum()                #    norm(max(0, p - q))
    return rng.choice(4, p=residual)

rng = np.random.default_rng(0)
n = 200_000
counts = np.bincount([one_position(rng) for _ in range(n)], minlength=4)
print("beta = sum(min(p, q)) =", np.minimum(p, q).sum())
print("residual =", np.maximum(p - q, 0) / np.maximum(p - q, 0).sum())
for word, target, freq in zip(vocab, p, counts / n):
    print(f"{word:5s} target {target:.2f}  observed {freq:.4f}")
```

Output:

```text
beta = sum(min(p, q)) = 0.7
residual = [0.66666667 0.         0.33333333 0.        ]
mat   target 0.40  observed 0.4001
rug   target 0.30  observed 0.2998
sofa  target 0.20  observed 0.2005
bed   target 0.10  observed 0.0996
```

Line by line: `rng.choice(4, p=q)` is the draft's sample. The `if` line is the accept test with a uniform random number. `np.maximum(p - q, 0.0)` and the division build the residual. The frequencies over 200,000 runs match $p$ to about three decimals.

### 5.4 The proof in four lines

This is the proof in Appendix A.1 of Leviathan et al. Fix any token $x'$. There are two ways to output it.

1. Accepted path: the draft proposes $x'$, and the test accepts it.

$$
P(\text{accept},\ x') = q(x') \cdot \min\left(1, \frac{p(x')}{q(x')}\right) = \min(p(x'), q(x'))
$$

2. Rejected path: some draft token is rejected, which happens with probability $1 - \beta$, and then the residual gives $x'$.

$$
P(\text{reject},\ x') = (1 - \beta) \cdot \frac{\max(0, p(x') - q(x'))}{1 - \beta} = p(x') - \min(p(x'), q(x'))
$$

The middle step uses one fact: the residual's normalizer equals $1 - \beta$. Proof of that fact: $\sum_y \max(0, p(y) - q(y)) = \sum_y (p(y) - \min(p(y), q(y))) = 1 - \beta$.

3. Add the two paths:

$$
P(x') = \min(p(x'), q(x')) + p(x') - \min(p(x'), q(x')) = p(x')
$$

4. For several drafts, apply the same argument at each position, conditioned on the accepted tokens before it. Position $i$ uses $p_i$ and $q_i$ computed on the same prefix, so each emitted token follows the target's conditional distribution. The bonus token comes straight from $p_{\gamma+1}$.

> [!key] What the proof needs
> The proof needs only two things: the draft's real probability $q(x)$ of the proposed token, and the target's full distribution $p$ at that position. It does **not** need the draft to be good. A bad draft is never wrong, only slow.

### 5.5 A draft that does not sample: one-hot $q$

Many drafts pick their single best token instead of sampling. Then $q$ is a one-hot distribution: $q(x_d) = 1$ for the drafted token and $0$ elsewhere. The rule still works:

1. Accept $x_d$ with probability $\min(1, p(x_d)/1) = p(x_d)$.
2. Otherwise sample from $\max(0, p - q)$ normalized. That is $p$ with $x_d$ removed, renormalized.

In the example, a one-hot draft proposes "rug". It is accepted with probability 0.30. Otherwise the target samples from mat, sofa, bed with probabilities $0.4/0.7$, $0.2/0.7$, $0.1/0.7$. Then $P(\text{mat}) = 0.7 \times 0.4/0.7 = 0.40$. The output is still exactly $p$.

vLLM 0.31.0 uses this by default. Its `draft_sample_method` defaults to `"greedy"`. The source code describes it like this: "the draft probabilities are treated as one-hot during rejection sampling". The option `"probabilistic"` samples from the draft and uses the full draft logits instead (checked in the vLLM 0.31.0 source on 2026-10-15).

### 5.6 What happens to the KV cache of rejected tokens

The verification pass appends keys and values for all $\gamma$ drafts to the KV cache ([L4: Implementing a KV cache](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache)). After the accept test, the entries of rejected positions are wrong for the future. The engine does not need to erase them. It moves the sequence length back, and the next step writes over those slots. In vLLM 0.31.0 the scheduler does exactly this: "Rejections roll back num_computed_tokens" (source comment, checked on 2026-10-15). With a paged cache, a block that holds only rejected tokens simply returns to use.

The draft model has its own KV cache too, if it is a transformer. It rolls back in the same way.

### 5.7 The whole loop on toy models

The next program builds two fake "models": each returns a fixed random distribution over 4 tokens for each context. It runs full speculative steps with $\gamma = 3$ and compares the two-token continuations with plain target sampling.

```python
import numpy as np
from collections import Counter
from functools import lru_cache

V = 4  # a vocabulary of 4 tokens: 0, 1, 2, 3

def toy_model(seed):
    """A fake language model: a fixed distribution for each context."""
    @lru_cache(maxsize=None)
    def cached(context):
        h = abs(hash((seed, context))) % (2**32)
        logits = np.random.default_rng(h).normal(size=V) * 1.5
        e = np.exp(logits - logits.max())
        return e / e.sum()
    return lambda context: cached(tuple(context))

target = toy_model(seed=1)   # p: the big model
draft = toy_model(seed=2)    # q: the small model (it disagrees often)

def speculative_step(prefix, gamma, rng):
    # 1. Draft gamma tokens one by one with the small model.
    ctx, drafted, qs = list(prefix), [], []
    for _ in range(gamma):
        q = draft(ctx)
        x = rng.choice(V, p=q)
        drafted.append(x); qs.append(q); ctx.append(x)
    # 2. One target pass gives gamma + 1 distributions (simulated here).
    ps = [target(list(prefix) + drafted[:i]) for i in range(gamma + 1)]
    # 3. Accept left to right. Stop at the first rejection.
    out = []
    for i, x in enumerate(drafted):
        if rng.random() < min(1.0, ps[i][x] / qs[i][x]):
            out.append(x)
            continue
        residual = np.maximum(ps[i] - qs[i], 0.0)
        out.append(rng.choice(V, p=residual / residual.sum()))
        return out                      # correction token, then stop
    out.append(rng.choice(V, p=ps[gamma]))  # all accepted: bonus token
    return out

def generate(prefix, n_tokens, gamma, rng):
    seq, steps = list(prefix), 0
    while len(seq) - len(prefix) < n_tokens:
        seq += speculative_step(seq, gamma, rng)
        steps += 1
    return tuple(seq[len(prefix):len(prefix) + n_tokens]), steps

def plain(prefix, n_tokens, rng):
    seq = list(prefix)
    for _ in range(n_tokens):
        seq.append(rng.choice(V, p=target(seq)))
    return tuple(seq[len(prefix):])

rng = np.random.default_rng(0)
N, prefix = 40_000, [0]
spec = [generate(prefix, 2, gamma=3, rng=rng) for _ in range(N)]
base = Counter(plain(prefix, 2, rng) for _ in range(N))
spec_counts = Counter(s for s, _ in spec)
worst = max(abs(spec_counts[k] - base[k]) / N for k in set(base) | set(spec_counts))
print("largest gap between the two frequency tables:", round(worst, 4))
print("mean target passes for 2 tokens:", np.mean([st for _, st in spec]))
```

Output (measured in these notes):

```text
largest gap between the two frequency tables: 0.0031
mean target passes for 2 tokens: 1.32265
```

The two frequency tables agree to within sampling noise. Plain decoding needs 2 target passes for 2 tokens. Speculation needed about 1.32 on average, with a draft that often disagrees with the target.

The important lines:

- `ps = [target(list(prefix) + drafted[:i]) ...]`: the target's distribution at position $i$ is computed **on the drafted prefix**. In a real engine one forward pass computes all of them.
- `return out` after a correction token: once a draft fails, everything after it is conditioned on a wrong token, so it is thrown away.
- `out.append(rng.choice(V, p=ps[gamma]))`: the bonus token when every draft passes.

## 6. How many tokens per step, and how much faster

### 6.1 Derive the expected tokens per step

Assume each draft token is accepted with the same probability $\alpha$, independently. This is the simplifying assumption of the paper. A step stops at the first rejection, and it always adds one target token.

- The step yields at least 1 token (the correction or the bonus).
- It yields at least 2 tokens if draft 1 is accepted: probability $\alpha$.
- At least 3 if drafts 1 and 2 are accepted: $\alpha^2$.
- At least $\gamma + 1$ if all $\gamma$ are accepted: $\alpha^\gamma$.

For a count $N$, $E[N] = \sum_{k \ge 1} P(N \ge k)$. So

$$
E[\text{tokens per step}] = 1 + \alpha + \alpha^2 + \dots + \alpha^{\gamma} = \frac{1 - \alpha^{\gamma + 1}}{1 - \alpha}
$$

The last step is the sum of a geometric series. This is Equation 1 of Leviathan et al.

> [!example] Worked example: $\alpha = 0.8$, $\gamma = 4$
> $E = (1 - 0.8^5) / (1 - 0.8) = (1 - 0.32768) / 0.2 = 0.67232 / 0.2 = 3.3616$ tokens per target pass. Check with the sum: $1 + 0.8 + 0.64 + 0.512 + 0.4096 = 3.3616$.

Computed in these notes:

| $\alpha$ (row), $\gamma$ (column) | 1 | 2 | 3 | 4 | 5 | 6 | 8 | limit ($\gamma \to \infty$) |
|---|---|---|---|---|---|---|---|---|
| 0.5 | 1.50 | 1.75 | 1.88 | 1.94 | 1.97 | 1.98 | 2.00 | 2 |
| 0.6 | 1.60 | 1.96 | 2.18 | 2.31 | 2.38 | 2.43 | 2.48 | 2.5 |
| 0.7 | 1.70 | 2.19 | 2.53 | 2.77 | 2.94 | 3.06 | 3.20 | 3.33 |
| 0.8 | 1.80 | 2.44 | 2.95 | 3.36 | 3.69 | 3.95 | 4.33 | 5 |
| 0.9 | 1.90 | 2.71 | 3.44 | 4.10 | 4.69 | 5.22 | 6.13 | 10 |

The limit is $1/(1 - \alpha)$. Long drafts help only when $\alpha$ is high. With $\alpha = 0.5$, even infinite drafts give at most 2 tokens per step.

```plot
{
  "title": "Expected tokens per target pass vs speculation length: alpha 0.9 (red), 0.8 (blue), 0.7 (gold), 0.6 (purple)",
  "xAxis": { "label": "speculation length gamma", "domain": [0, 10] },
  "yAxis": { "label": "tokens per target pass", "domain": [0, 7] },
  "disableZoom": true,
  "data": [
    { "fn": "(1 - 0.9^(x+1)) / 0.1", "color": "#C81D25" },
    { "fn": "(1 - 0.8^(x+1)) / 0.2", "color": "#1E6091" },
    { "fn": "(1 - 0.7^(x+1)) / 0.3", "color": "#B8860B" },
    { "fn": "(1 - 0.6^(x+1)) / 0.4", "color": "#6A4C93" }
  ]
}
```

### 6.2 What $\alpha$ means and how to measure it

Theorem 3.5 of the paper shows that the acceptance probability in one context is $\beta = \sum_x \min(p(x), q(x))$. This equals $1 - D_{TV}(p, q)$, where $D_{TV}$ is the total variation distance between the two distributions. So $\alpha$ measures how similar the draft and the target are on your traffic. In the cat example, $\beta = 0.70$.

$\alpha$ is not a property of the draft alone. It changes with the task, the prompt and the temperature. The paper's Table 3 (T5-XXL target, English-to-German translation, T5-small draft) reports $\alpha = 0.75$ at temperature 0 and $0.62$ at temperature 1. A unigram draft gave only $0.08$ and $0.07$.

In a live engine, measure it from counters. vLLM exports `vllm:spec_decode_num_drafts`, `vllm:spec_decode_num_draft_tokens` and `vllm:spec_decode_num_accepted_tokens` (names from the vLLM 0.31.0 source, checked on 2026-10-15). Two useful ratios:

$$
\text{draft acceptance rate} = \frac{\text{accepted tokens}}{\text{draft tokens}} \qquad \text{mean acceptance length} = 1 + \frac{\text{accepted tokens}}{\text{drafts}}
$$

The "1 +" counts the token that the target always adds. The mean acceptance length is the measured tokens per step.

### 6.3 The speedup formula

Tokens per step is not the speedup, because drafting costs time. Let $c$ be the time of one draft pass divided by the time of one target pass. One step costs $\gamma$ draft passes plus one target pass, so its time is $(\gamma c + 1)$ target-pass units. Theorem 3.8 of the paper gives the walltime improvement factor:

$$
\text{speedup} = \frac{1 - \alpha^{\gamma + 1}}{(1 - \alpha)(\gamma c + 1)}
$$

This assumes that one target pass over $\gamma + 1$ tokens costs the same as over 1 token (the memory-bound argument of section 4).

> [!example] Worked example: speedup and the best $\gamma$
> $\alpha = 0.8$, $\gamma = 4$, $c = 0.05$: speedup $= 3.3616 / (4 \times 0.05 + 1) = 3.3616 / 1.2 \approx 2.80$.
>
> Each extra draft token adds $c$ to the cost but adds less and less to the numerator. Searching $\gamma$ from 1 to 20 (computed in these notes):
>
> | $\alpha$ | $c$ | best $\gamma$ | speedup |
> |---|---|---|---|
> | 0.8 | 0.05 | 8 | 3.09 |
> | 0.7 | 0.1 | 4 | 1.98 |
> | 0.6 | 0.2 | 2 | 1.40 |
>
> A better draft (higher $\alpha$) wants longer drafts. A more expensive draft (higher $c$) wants shorter drafts.

Corollary 3.9 of the paper: if $\alpha > c$, some $\gamma$ gives a real improvement. For $\gamma = 1$ the factor is at least $(1 + \alpha)/(1 + c)$.

The paper's headline result: 2X to 3X faster than the standard T5X implementation for T5-XXL (11B), "with identical outputs" (batch size 1). For example, translation at temperature 0 with $\gamma = 7$ and $\alpha = 0.75$ ran 3.4X faster. Chen et al. report a 2-2.5x decoding speedup for Chinchilla 70B.

### 6.4 The hidden cost: more total arithmetic

Speculation wastes work on rejected drafts. Theorem 3.11 of the paper gives the factor of increase in total arithmetic operations. Here $\hat{c}$ is the draft's operations per token divided by the target's:

$$
\text{operations factor} = \frac{(1 - \alpha)(\gamma \hat{c} + \gamma + 1)}{1 - \alpha^{\gamma + 1}}
$$

With $\alpha = 0.8$, $\gamma = 4$, $\hat{c} = 0.05$: $0.2 \times 5.2 / 0.67232 \approx 1.55$. The GPU does about 55% more arithmetic to make the same tokens. When arithmetic is free (memory-bound), nobody cares. When arithmetic is the bottleneck, this is the price (section 8).

## 7. Sources of draft tokens

### 7.1 A separate draft model

The original design. A small model from the same family drafts, for example a 1B model for an 8B target. It must use the **same tokenizer**, because the accept test compares token IDs. It costs extra GPU memory for its weights and its own KV cache. In the memory-bound regime, $c$ is close to the draft's weight bytes divided by the target's weight bytes (interpretation of these notes). vLLM: `"method": "draft_model"`.

### 7.2 N-gram (prompt lookup) drafting

No model at all. Take the last $n$ tokens of the sequence. Search the earlier text for the same $n$ tokens. Propose the tokens that followed that earlier match. vLLM's `ngram` proposer finds "the longest n-gram which matches the suffix of the given tokens" with a length between `prompt_lookup_min` and `prompt_lookup_max`, then extracts the next $k$ tokens (source docstring, vLLM 0.31.0).

This works very well when the output copies the input: code edits, summaries that quote, RAG answers, JSON that repeats field names. It costs almost nothing ($c \approx 0$). It fails on free-form text, where matches are rare. Suffix decoding (`"method": "suffix"`) extends the idea with suffix trees built from the prompt and from earlier responses.

### 7.3 Medusa heads

Medusa (Cai et al., arXiv 2401.10774, January 2024) adds extra decoding heads on top of the target's last hidden state. Head $k$ predicts the token $k + 1$ positions ahead. There is no separate model. The heads propose several candidates per position, and **tree attention** checks many candidate continuations in one pass. The abstract reports over 2.2x speedup for Medusa-1, with heads trained on a frozen backbone and quality unchanged. It reports 2.3-3.6x for Medusa-2, with heads trained jointly with the backbone.

### 7.4 EAGLE, EAGLE-2 and EAGLE-3

EAGLE (Li et al., arXiv 2401.15077, January 2024) is a small draft head that works on **features**, not just tokens. It predicts the target's next second-to-top-layer feature vector from the current features plus the token sequence shifted one step ahead. Then the target's own LM head turns the predicted feature into token probabilities. The abstract reports a 2.7x-3.5x latency speedup on LLaMA2-Chat 70B, with the output distribution preserved.

EAGLE-2 (arXiv 2406.16858, June 2024) makes the draft tree **dynamic**. The draft's confidence scores approximate acceptance rates, so the tree grows where acceptance is likely. Reported speedups: 3.05x-4.26x, which the authors describe as 20%-40% faster than EAGLE-1.

EAGLE-3 (arXiv 2503.01840, March 2025) drops feature prediction and predicts tokens directly. It fuses features from several layers of the target (low, middle and high) instead of only the top one. A training technique called "training-time test" lets the draft benefit from more training data. Reported: up to 6.5x speedup, about 1.4x over EAGLE-2, and 1.38x higher throughput at batch size 64 in SGLang.

### 7.5 Multi-token prediction (MTP)

DeepSeek-V3 (arXiv 2412.19437) trains the model with a multi-token prediction objective. With depth $D = 1$, "besides the exact next token, each token will predict one additional token". Each MTP module has a shared embedding layer, a shared output head, one transformer block and a projection matrix. At inference the modules can be discarded, or repurposed "for speculative decoding". A later DeepSeek paper (arXiv 2505.09343, Section 2.3.3) states an acceptance rate of 80% to 90% for the second token, which "increases the generation TPS by 1.8x". The advantage: the draft is trained together with the target, so it matches the target well and costs no separate model.

### 7.6 Token trees in one paragraph

A linear draft proposes one chain. A tree drafts several alternatives at each position. For example: the top 2 candidates for position 1, and the top 2 for position 2 after each of them. The target checks the whole tree in one pass. The trick is the attention mask. Each tree node may attend only to the prefix and to its own ancestors in the tree. It may not attend to its siblings. The engine then keeps the longest accepted path. Trees raise the expected tokens per step, at the cost of more positions per verification pass.

### 7.7 Comparison

| Draft source | Extra model weights | Training needed | Typical strength | Typical weakness |
|---|---|---|---|---|
| Draft model | Yes, a small model | No, if a family model exists | General text | Memory for a second model, $c$ not tiny |
| N-gram / prompt lookup | No | No | Outputs that copy the input | Weak on free-form text |
| Suffix decoding | No | No | Repetitive and agentic outputs | Needs repeated patterns |
| Medusa heads | Small heads | Yes, train heads | No second model | Heads to train for each model, tree verification needed |
| EAGLE / EAGLE-3 | Small draft head | Yes, per target model | High acceptance on general text | A head per target model |
| MTP | Ships with the model | Done in pre-training | Very high acceptance | Only for models trained with MTP |

## 8. When speculative decoding does not help

### 8.1 Large batches make verification expensive

The free-verification argument of section 4 holds only while the target is memory-bound. A decode step with batch size $B$ processes $B$ tokens. With speculation it processes $B(\gamma + 1)$ tokens. The ridge point of an H100 is about 295 FLOPs per byte ([L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)), which for a BF16 linear layer means about 295 tokens per step. Above that, more tokens per step cost proportionally more time.

> [!example] Worked example: an idealized model of the crossover
> Model: Llama-3.1-8B on one H100, $\alpha = 0.7$, $\gamma = 4$, a free draft ($c = 0$, for example n-gram), linear layers only, peak FLOPs.
>
> - Step time without speculation: $\max(2PB/F,\ W/\mathrm{BW})$ with $P = 8.03 \times 10^9$, $W = 2P$ bytes, $F = 989$ TFLOPS, $\mathrm{BW} = 3.35$ TB/s.
> - Step time with speculation: $\max(2PB(\gamma+1)/F,\ W/\mathrm{BW})$, and each step yields $E = 2.773$ tokens per sequence.
> - Speculation stays memory-bound while $B(\gamma + 1) \le 295$, so up to $B \approx 59$. There it gives the full $2.77\times$.
> - Without speculation the step stays memory-bound up to $B \approx 295$.
> - Between the two, the speculative step grows with $B$ while the plain step does not. They break even at $B = 2.773 \times 295 / 5 \approx 164$.
> - Above $B \approx 295$, both are compute-bound, and speculation gives $E/(\gamma + 1) = 2.773 / 5 \approx 0.55$ of the plain throughput: a 45% **loss**.
>
> All values computed in these notes. Real kernels do not reach peak FLOPs, attention and drafts cost time, so the real crossover comes at a smaller batch.

```plot
{
  "title": "Idealized roofline model, Llama-3.1-8B on one H100, alpha 0.7, gamma 4: output tokens per second in thousands, plain decoding (blue) vs speculative decoding (red)",
  "xAxis": { "label": "batch size B (sequences)", "domain": [0, 520] },
  "yAxis": { "label": "thousand output tokens per second", "domain": [0, 70] },
  "disableZoom": true,
  "data": [
    { "points": [[1, 0.21], [16, 3.34], [32, 6.67], [59, 12.31], [96, 20.02], [128, 26.7], [164, 34.21], [200, 41.72], [256, 53.4], [295, 61.53], [384, 61.58], [512, 61.58]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[1, 0.21], [16, 3.34], [32, 6.67], [59, 12.31], [96, 20.02], [128, 26.7], [164, 34.21], [200, 41.72], [256, 53.4], [295, 61.53], [384, 61.58], [512, 61.58]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true },
    { "points": [[1, 0.58], [16, 9.26], [32, 18.51], [59, 34.13], [96, 34.15], [128, 34.15], [164, 34.15], [200, 34.15], [256, 34.15], [295, 34.15], [384, 34.15], [512, 34.15]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[1, 0.58], [16, 9.26], [32, 18.51], [59, 34.13], [96, 34.15], [128, 34.15], [164, 34.15], [200, 34.15], [256, 34.15], [295, 34.15], [384, 34.15], [512, 34.15]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true }
  ]
}
```

So speculative decoding is mainly a **latency** tool for low and medium load. The vLLM docs say the same: it helps for "medium-to-low QPS (queries per second), memory-bound" workloads (checked on 2026-10-15). Engines therefore adapt: vLLM 0.31.0 has a `num_speculative_tokens_per_batch_size` schedule that picks $\gamma$ by batch size, and its docs list "Dynamic Speculative Decoding" for fluctuating load.

### 8.2 Other reasons it fails

1. **Low acceptance.** High temperature, creative writing, a draft trained on other data, or a different language all lower $\alpha$. With $\alpha = 0.5$, the ceiling is 2 tokens per step.
2. **An expensive draft.** If $c$ approaches $\alpha$, Corollary 3.9 says there may be no gain at all.
3. **Memory.** A draft model and its KV cache take memory that the target's KV cache could use. That lowers the maximum batch.
4. **Long prefill-heavy traffic.** Speculation accelerates only the decode phase. It does nothing for time to first token.

## 9. Speculative decoding in vLLM

vLLM configures speculation with one JSON argument. These examples follow the vLLM docs (checked on 2026-10-15). The model names in angle brackets are placeholders.

```bash
# A separate draft model
vllm serve <target-model> \
  --speculative-config '{"method": "draft_model", "model": "<draft-model>", "num_speculative_tokens": 5}'

# N-gram drafting from the prompt and the output so far
vllm serve <target-model> \
  --speculative-config '{"method": "ngram", "num_speculative_tokens": 4, "prompt_lookup_min": 2, "prompt_lookup_max": 5}'

# A model with built-in MTP weights (the docs use XiaomiMiMo/MiMo-7B-Base)
vllm serve XiaomiMiMo/MiMo-7B-Base \
  --speculative-config '{"method": "mtp", "num_speculative_tokens": 1}'
```

The EAGLE-3 example in the docs passes `"method": "eagle3"` with the draft head `RedHatAI/Llama-3.1-8B-Instruct-speculator.eagle3` and `"num_speculative_tokens": 2`.

Facts to know, all checked in the vLLM 0.31.0 source or docs on 2026-10-15:

| Item | Value |
|---|---|
| `method` values | `ngram`, `ngram_gpu`, `medusa`, `mlp_speculator`, `draft_model`, `suffix`, `custom_class`, `eagle`, `eagle3`, `mtp` and model-specific MTP names, `dflash`, `dspark` |
| Rejection sampler | `rejection_sample_method`: `standard` (default), `synthetic`, `block` |
| Draft sampling | `draft_sample_method`: `greedy` (default, one-hot $q$) or `probabilistic` |
| Implementation note | The sampler's docstring says it "strictly follows the algorithm described in https://arxiv.org/abs/2211.17192" |
| Lossless statement | "theoretically lossless up to the precision limits of hardware numerics" |
| Caveats in the docs | batch size changes "may cause variations in logprobs and output probabilities", and logprobs are not guaranteed stable |

> [!trap] "Lossless" has a precise meaning
> Lossless means the **distribution** is the same as the target's. It does not mean the same random sample. With sampling, two runs differ anyway. With greedy decoding the text should be identical in exact arithmetic. In practice, a verification pass over 5 tokens uses different kernel shapes than a pass over 1 token. So floating-point rounding can differ in the last bits. That can flip a near-tie between two tokens. See the batch invariance discussion in [L5: Sampling and structured output](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output).

### 9.1 Exercises

Lab folder: `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, notebook folder `llm-systems/`, notebook `l6-speculative-decoding.ipynb`.

1. **Greedy speculative decoding.** Write a toy target model (logits from a fixed random function of the last 3 tokens) and a noisy draft. Implement greedy speculative decoding with $\gamma = 4$.
   - Acceptance test: for 50 generated tokens, the output is identical to plain greedy decoding of the target, and it uses fewer than 50 target passes.
   - Hint 1: the target's choice at draft position $i$ is the argmax of the target on the prefix plus the first $i - 1$ drafts.
   - Hint 2: at the first mismatch, append the target's token and end the step.
2. **The best speculation length.** Write `best_gamma(alpha, c)` that searches $\gamma$ from 1 to 20 with the speedup formula of section 6.3.
   - Acceptance test: $(\alpha, c) = (0.8, 0.05)$ gives $\gamma = 8$ and a speedup of about 3.09.
   - Hint 1: write `expected_tokens(alpha, gamma)` first.
   - Hint 2: `max(range(1, 21), key=...)` returns the best $\gamma$.
3. **Distribution check.** Using the code of section 5.7, add a draft that is a one-hot distribution (its argmax). Show that the two-token frequency table still matches plain target sampling.
   - Acceptance test: the largest gap between the two frequency tables is below 0.01 with 40,000 samples.
   - Hint 1: a one-hot $q$ has $q(x_d) = 1$, so the accept probability is $p(x_d)$.
   - Hint 2: the residual is $p$ with the drafted token set to zero, renormalized.

## 10. Common mistakes

1. **"Speculative decoding approximates the big model."** No. With the accept-or-resample rule, the output distribution equals the target's exactly (up to floating-point effects). Only the speed depends on the draft.
2. **"Accept the draft token if the target's top token agrees."** That is correct only for greedy decoding. For sampling, accept with probability $\min(1, p/q)$ and resample from $\mathrm{norm}(\max(0, p - q))$. A plain "agree" test changes the distribution.
3. **"After a rejection, sample the replacement from $p$."** Sampling from $p$ double-counts the tokens the draft already proposed. Sample the replacement from the residual.
4. **"The speedup equals the tokens per step."** The draft costs time: divide by $(\gamma c + 1)$. And verification is only nearly free while the target is memory-bound.
5. **"Longer drafts are always better."** The expected tokens saturate at $1/(1 - \alpha)$, while the draft cost grows linearly in $\gamma$.
6. **"Speculation always raises throughput."** At large batch sizes the target is compute-bound, rejected drafts waste real FLOPs, and throughput can drop.
7. **"Any small model can be a draft."** The draft must share the target's tokenizer and vocabulary for token-level checking, unless the engine supports a mapping between vocabularies. vLLM 0.31.0 has `use_heterogeneous_vocab` for that case, only with greedy draft sampling.
8. **"Speculation reduces time to first token."** It accelerates decoding only. Prefill is unchanged.

## 11. One-minute explanation

Decoding is memory-bound: each step reads all the weights to make one token, so the compute units are mostly idle. Speculative decoding uses that idle compute. A cheap draft, such as a small model, an n-gram lookup, EAGLE heads or MTP modules, proposes $\gamma$ tokens. The target model scores all of them in one forward pass, which costs about the same as one normal step. Drafts are accepted left to right with probability $\min(1, p/q)$. At the first rejection, the target samples a correction token from the normalized residual $\max(0, p - q)$, and if all pass it adds a bonus token. A four-line proof shows that every emitted token follows the target's distribution exactly, so the method is lossless. With acceptance rate $\alpha$, a step yields $(1 - \alpha^{\gamma+1})/(1 - \alpha)$ tokens on average, and the speedup divides that by $(\gamma c + 1)$. It shines at low and medium load. At large batch sizes the target becomes compute-bound, the wasted verification work costs real time, and the gain can turn into a loss.

## 12. Check questions

```check
{
  "question": "Why can the target model check 5 draft tokens in about the same time as it produces 1 normal token?",
  "hint": "Compare the bytes read with the FLOPs done in one decode step at batch size 1.",
  "answer": "At batch size 1, a decode step must read every weight once. For Llama-3.1-8B on an H100 that is about 16 GB, or about 4.79 ms at 3.35 TB/s. The arithmetic for one token is about 16 GFLOPs, or about 16 µs at 989 TFLOPS. Five tokens need about 81 µs of arithmetic, which still hides under the 4.79 ms of memory reads. The weights are read once for all 5 positions, so the pass costs about the same. This holds only while the step stays memory-bound."
}
```

```check
{
  "question": "A draft proposes a token with $q(x) = 0.5$ where the target has $p(x) = 0.3$. With what probability is it accepted? What if $q(x) = 0.1$ and $p(x) = 0.3$?",
  "answer": "Accept probability is $\\min(1, p/q)$.\n\n- $q = 0.5$, $p = 0.3$: $0.3 / 0.5 = 0.6$. The draft over-proposes this token, so it is accepted 60% of the time.\n- $q = 0.1$, $p = 0.3$: $0.3 / 0.1 = 3$, capped at 1. The token is always accepted. The missing $0.3 - 0.1 = 0.2$ of probability returns through the residual distribution, after rejections of other tokens."
}
```

```check
{
  "question": "Interview follow-up: derive the expected number of tokens one speculative step produces, with $\\gamma$ drafts and an acceptance rate $\\alpha$.",
  "hint": "Use $E[N] = \\sum_{k \\ge 1} P(N \\ge k)$ and assume independent acceptances.",
  "answer": "A step always adds one target token (correction or bonus). It adds a second token only if draft 1 is accepted, a third only if drafts 1 and 2 are accepted, and so on.\n\n- $P(N \\ge 1) = 1$\n- $P(N \\ge 2) = \\alpha$\n- $P(N \\ge k) = \\alpha^{k-1}$ for $k \\le \\gamma + 1$, and 0 above.\n\nSo $E[N] = 1 + \\alpha + \\dots + \\alpha^{\\gamma} = \\dfrac{1 - \\alpha^{\\gamma+1}}{1 - \\alpha}$, a finite geometric series. As $\\gamma \\to \\infty$ it tends to $1/(1-\\alpha)$. Example: $\\alpha = 0.8$, $\\gamma = 4$ gives 3.36. The independence assumption is a simplification. Real acceptances are correlated (easy passages accept many tokens in a row)."
}
```

```check
{
  "question": "Interview follow-up: prove that speculative sampling outputs each token with exactly the target probability $p(x')$.",
  "hint": "Split into the accepted path and the rejected path. What is the normalizer of the residual?",
  "answer": "1. Accepted path: $q(x') \\cdot \\min(1, p(x')/q(x')) = \\min(p(x'), q(x'))$.\n2. The acceptance probability over all proposals is $\\beta = \\sum_x \\min(p(x), q(x))$. The residual normalizer is $\\sum_x \\max(0, p(x) - q(x)) = \\sum_x (p(x) - \\min(p(x), q(x))) = 1 - \\beta$.\n3. Rejected path: $(1 - \\beta) \\cdot \\max(0, p(x') - q(x')) / (1 - \\beta) = p(x') - \\min(p(x'), q(x'))$.\n4. Sum: $\\min(p, q) + p - \\min(p, q) = p(x')$.\n\nFor several drafts, apply this at each position, conditioned on the accepted prefix, with $p_i$ and $q_i$ computed on that prefix. The proof never uses the quality of the draft, so any draft, even a one-hot one, keeps the output exact."
}
```

```check
{
  "question": "Interview follow-up: the speculative decoding paper reports a 3.4X speedup for translation at temperature 0 with $\\gamma = 7$ and $\\alpha = 0.75$. What cost coefficient $c$ does the speedup formula imply? The same table reports 2.6X at temperature 1 with $\\alpha = 0.62$. What do you notice?",
  "hint": "Speedup $= E / (\\gamma c + 1)$ with $E = (1 - \\alpha^{\\gamma+1})/(1 - \\alpha)$.",
  "answer": "Temperature 0: $E = (1 - 0.75^8)/0.25 = (1 - 0.1001)/0.25 \\approx 3.600$. Then $3.4 = 3.600/(7c + 1)$ gives $7c + 1 \\approx 1.0587$, so $c \\approx 0.0084$. That fits the paper's remark that $c$ was below 0.05 and often close to 0.\n\nTemperature 1: $E = (1 - 0.62^8)/0.38 \\approx 2.574$, which is already below the reported 2.6X even with $c = 0$. The formula assumes independent acceptances with one average $\\alpha$. Real acceptances vary by context and are correlated, so measured speedups can differ from the formula. (Computed in these notes from the paper's Table 2 values.)"
}
```

```check
{
  "question": "Interview follow-up: you serve Llama-3.1-8B on one H100 at batch size 256 with n-gram speculation, $\\gamma = 4$, $\\alpha = 0.7$. Throughput dropped. Explain with numbers.",
  "hint": "How many tokens does one verification step process? Compare with the ridge point of about 295.",
  "answer": "Without speculation a decode step processes 256 tokens. That is just below the H100 ridge of about 295 tokens per step for BF16 weights, so it is still about memory-bound. With $\\gamma = 4$ each sequence sends $\\gamma + 1 = 5$ positions: $256 \\times 5 = 1280$ tokens per step. That is far above the ridge, so the step is compute-bound and takes about 5 times the arithmetic. Each step yields only $E = (1 - 0.7^5)/0.3 \\approx 2.77$ tokens per sequence. In the idealized model, throughput becomes about $2.77/5 \\approx 0.55$ of a pure compute-bound plain step, and the break-even batch is about $2.77 \\times 295 / 5 \\approx 164$. Fixes: lower $\\gamma$ at high load (vLLM's `num_speculative_tokens_per_batch_size`), or disable speculation above some batch size."
}
```

```check
{
  "question": "What happens to the KV cache entries that the verification pass wrote for rejected draft tokens?",
  "answer": "They are now wrong for the future, but the engine does not erase them. It moves the sequence length back to the last accepted position, and the next step overwrites those slots. In vLLM 0.31.0 the scheduler subtracts the rejected count from `num_computed_tokens` (\"Rejections roll back num_computed_tokens\"). A draft model with its own KV cache rolls back the same way."
}
```

```check
{
  "question": "Interview follow-up: DeepSeek-V3 has one MTP module, so $\\gamma = 1$. A DeepSeek paper reports 80% to 90% acceptance for the second token and 1.8x generation TPS. Is that consistent with the formula?",
  "answer": "With $\\gamma = 1$, $E = 1 + \\alpha$. For $\\alpha = 0.8$ to $0.9$: 1.8 to 1.9 tokens per target pass. If the MTP module is cheap ($c$ near 0) and the step stays memory-bound, the speedup is close to $E$, so 1.8x is consistent. MTP gives high acceptance because the module is trained together with the model. Its limit is $\\gamma$: with only one module, the best possible step yields 2 tokens. (Check computed in these notes.)"
}
```

```check
{
  "question": "Name three draft sources and the situation where each one is the best choice.",
  "answer": "1. **N-gram / prompt lookup**: outputs that copy the input, such as code edits, quoting summaries and RAG answers. No model, $c \\approx 0$.\n2. **EAGLE-3 head**: general chat and reasoning on a popular model that has a trained head. High acceptance, small extra memory.\n3. **MTP**: models trained with MTP modules, such as DeepSeek-V3. The draft ships with the model and matches it well.\n\nA separate small draft model is the fallback when a family model with the same tokenizer exists and no head is available."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\nimport numpy as np\nfrom functools import lru_cache\n\nV = 50\n\ndef toy_model(seed):\n    @lru_cache(maxsize=None)\n    def cached(context):\n        h = abs(hash((seed, context[-3:]))) % (2**32)   # looks at the last 3 tokens\n        return np.random.default_rng(h).normal(size=V)  # logits\n    return lambda context: cached(tuple(context))\n\ntarget, draft = toy_model(1), toy_model(1)\ndraft_noisy = lambda ctx: draft(ctx) + np.random.default_rng(len(ctx)).normal(size=V) * 0.8\n\ndef greedy_target(prefix, n):\n    seq = list(prefix)\n    for _ in range(n):\n        seq.append(int(np.argmax(target(seq))))\n    return seq[len(prefix):]\n\ndef greedy_speculative(prefix, n, gamma):\n    seq, passes = list(prefix), 0\n    while len(seq) - len(prefix) < n:\n        ctx, drafted = list(seq), []\n        for _ in range(gamma):                      # draft gamma tokens greedily\n            x = int(np.argmax(draft_noisy(ctx)))\n            drafted.append(x); ctx.append(x)\n        passes += 1                                 # one target pass checks all\n        for i in range(gamma + 1):\n            best = int(np.argmax(target(seq)))      # target's choice at this position\n            seq.append(best)\n            if i == gamma or drafted[i] != best:    # mismatch: keep the target token, stop\n                break\n    return seq[len(prefix):len(prefix) + n], passes\n\nref = greedy_target([1, 2, 3], 50)\nout, passes = greedy_speculative([1, 2, 3], 50, gamma=4)\nprint(\"identical:\", out == ref, \"| target passes:\", passes, \"instead of 50\")\n```\n\nOutput: `identical: True | target passes: 31 instead of 50`."
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\ndef expected_tokens(alpha, gamma):\n    return (1 - alpha ** (gamma + 1)) / (1 - alpha)\n\ndef speedup(alpha, gamma, c):\n    return expected_tokens(alpha, gamma) / (gamma * c + 1)\n\ndef best_gamma(alpha, c, max_gamma=20):\n    g = max(range(1, max_gamma + 1), key=lambda g: speedup(alpha, g, c))\n    return g, speedup(alpha, g, c)\n\nfor alpha, c in [(0.8, 0.05), (0.7, 0.1), (0.6, 0.2)]:\n    g, s = best_gamma(alpha, c)\n    print(f\"alpha={alpha} c={c}: best gamma={g}, speedup={s:.2f}\")\n```\n\nOutput:\n\n```text\nalpha=0.8 c=0.05: best gamma=8, speedup=3.09\nalpha=0.7 c=0.1: best gamma=4, speedup=1.98\nalpha=0.6 c=0.2: best gamma=2, speedup=1.40\n```"
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\nimport numpy as np\nfrom collections import Counter\nfrom functools import lru_cache\n\nV = 4\n\ndef toy_model(seed):\n    @lru_cache(maxsize=None)\n    def cached(context):\n        h = abs(hash((seed, context))) % (2**32)\n        logits = np.random.default_rng(h).normal(size=V) * 1.5\n        e = np.exp(logits - logits.max())\n        return e / e.sum()\n    return lambda context: cached(tuple(context))\n\ntarget, draft = toy_model(1), toy_model(2)\n\ndef one_hot_draft(context):\n    q = np.zeros(V)\n    q[int(np.argmax(draft(context)))] = 1.0   # the draft picks its best token\n    return q\n\ndef speculative_step(prefix, gamma, rng):\n    ctx, drafted, qs = list(prefix), [], []\n    for _ in range(gamma):\n        q = one_hot_draft(ctx)\n        x = int(np.argmax(q))\n        drafted.append(x); qs.append(q); ctx.append(x)\n    ps = [target(list(prefix) + drafted[:i]) for i in range(gamma + 1)]\n    out = []\n    for i, x in enumerate(drafted):\n        if rng.random() < min(1.0, ps[i][x] / qs[i][x]):   # = p(x) for a one-hot q\n            out.append(x)\n            continue\n        residual = np.maximum(ps[i] - qs[i], 0.0)          # p with x removed\n        out.append(rng.choice(V, p=residual / residual.sum()))\n        return out\n    out.append(rng.choice(V, p=ps[gamma]))\n    return out\n\ndef generate(prefix, n, gamma, rng):\n    seq = list(prefix)\n    while len(seq) - len(prefix) < n:\n        seq += speculative_step(seq, gamma, rng)\n    return tuple(seq[len(prefix):len(prefix) + n])\n\ndef plain(prefix, n, rng):\n    seq = list(prefix)\n    for _ in range(n):\n        seq.append(rng.choice(V, p=target(seq)))\n    return tuple(seq[len(prefix):])\n\nrng = np.random.default_rng(0)\nN = 40_000\na = Counter(generate([0], 2, 3, rng) for _ in range(N))\nb = Counter(plain([0], 2, rng) for _ in range(N))\ngap = max(abs(a[k] - b[k]) / N for k in set(a) | set(b))\nprint(\"largest gap:\", round(gap, 4), \"| passes test:\", gap < 0.01)\n```\n\nOutput: `largest gap: 0.0033 | passes test: True`."
}
```

## 13. Links

- Previous: [L5: Sampling and structured output](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output)
- Next: [L7: Quantization](/notes/ai/llm-systems/04-inference/l7-quantization)
- Why decode is memory-bound: [L3: Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) and [L2: Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode)
- Batching, which competes with speculation for the same idle compute: [L4: Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)
- Sampling basics: [02 Background: decoding, greedy, temperature, sampling](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/02-background-decoding-greedy-temperature-sampling)
- Engines that implement it: [L10: Serving engines](/notes/ai/llm-systems/04-inference/l10-serving-engines)
- Interview drill: [L2: Drill: inference and cloud hosting](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud)

### Sources

All checked on 2026-10-15.

- Leviathan, Kalman, Matias. "Fast Inference from Transformers via Speculative Decoding." ICML 2023. https://arxiv.org/abs/2211.17192
- Chen, Borgeaud, Irving, Lespiau, Sifre, Jumper. "Accelerating Large Language Model Decoding with Speculative Sampling." https://arxiv.org/abs/2302.01318
- Cai et al. "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads." https://arxiv.org/abs/2401.10774
- Li, Wei, Zhang, Zhang. "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty." https://arxiv.org/abs/2401.15077
- Li et al. "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees." https://arxiv.org/abs/2406.16858
- Li et al. "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test." https://arxiv.org/abs/2503.01840
- DeepSeek-AI. "DeepSeek-V3 Technical Report." https://arxiv.org/abs/2412.19437
- DeepSeek-AI. "Insights into DeepSeek-V3: Scaling Challenges and Reflections on Hardware for AI Architectures." https://arxiv.org/abs/2505.09343
- vLLM docs, Speculative Decoding: https://docs.vllm.ai/en/latest/features/speculative_decoding/ (and the EAGLE and MTP subpages)
- vLLM 0.31.0 source (PyPI wheel): `vllm/config/speculative.py`, `vllm/v1/sample/rejection_sampler.py`, `vllm/v1/spec_decode/ngram_proposer.py`, `vllm/v1/core/sched/scheduler.py`
