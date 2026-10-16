---
title: "L4: Causal masking and generation"
order: 4
summary: "Why a decoder must not see later tokens, how the causal mask adds minus infinity before the softmax, the toy example row by row, training with teacher forcing, generation one token at a time with the exact decode step for the token 'down', and padding masks for batches."
status: not-started
tags: [attention, causal-mask, teacher-forcing, generation, decode, padding, kv-cache]
---

## 1. The question this idea answers

A language model learns one task: predict the next token from the tokens before it. In training, the whole sentence is known. If position 2 can read position 3, it can copy the answer. Then training is easy and useless, because at generation time position 3 does not exist yet.

So two questions follow. First: **how does attention stop a token from reading later tokens**, while training still processes all positions at the same time? Second: **what exactly happens when the model generates one new token**? The answer to the second question shows why the keys and values of earlier tokens never change. That fact is the foundation of the KV cache, and of PagedAttention.

## 2. Mental model

> [!analogy] A sheet of paper that covers the rest of the page
> A student reads a sentence with a sheet of paper over it. The sheet covers every word to the right of the current word. The student must guess the next word from the visible words only. Then the sheet moves one word to the right. In training, many students sit side by side, one per position, each with a sheet at their own position. They all work at the same time.
>
> **Where it stops working:** the model does not move a sheet. It computes all scores and then sets the scores of later tokens to minus infinity before the softmax. The cover also applies in every layer, not only at the input. And during generation there is no sheet at all for the newest token: it may read every earlier token.

## 3. Terms

| Term | Plain meaning |
|---|---|
| decoder | A model, or a part of one, that generates tokens from left to right. Llama is a decoder-only model. |
| autoregressive property | The rule that position $i$ depends only on positions $1$ to $i$. |
| causal mask | The matrix that blocks every query from the keys of later tokens. |
| additive mask $M$ | A matrix added to the scores: 0 where reading is allowed, $-\infty$ where it is blocked. |
| boolean mask | A matrix of true and false values. In PyTorch `scaled_dot_product_attention`, true means "may read". |
| next-token prediction | The training task: at each position, predict the token that follows. |
| teacher forcing | Training with the true previous tokens as input, not with the model's own outputs. |
| cross-entropy loss | The average of $-\ln p$ of the true next token over all positions. |
| exposure bias | The difference between training on true prefixes and generating from the model's own outputs. |
| prefill | The first forward pass over the whole prompt. It computes the keys and values of all prompt tokens. |
| decode step | One forward pass for one new token. It computes one query, one key and one value per layer and head. |
| KV cache | The stored keys and values of all earlier tokens, per layer and head. Decode steps read it. |
| padding | Filler tokens that make sequences of different lengths fit into one rectangular batch. |
| attention mask (Hugging Face) | A $[B, T]$ matrix with 1 for real tokens and 0 for padding. |
| left padding | Padding placed before the real tokens. Generation with decoder-only models needs it. |
| right padding | Padding placed after the real tokens. |
| position IDs | The position number of each token. RoPE uses it to rotate queries and keys. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. Why a decoder must not see later tokens

### 4.1 The leak, with numbers

Lesson [L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) computed attention without a mask. In that result, the row of "the" had the weights $[0.2483, 0.5035, 0.2483]$. So "cat" had a weight of 50.35% in the output of "the".

Now remember the task. The output at "the" must predict the next token, and the next token is "cat". Without a mask, the input of position 1 already contains its own answer. Training would teach the model to copy from the right. At generation time, nothing is on the right, and the model would fail.

### 4.2 The rule

Vaswani et al. (2017, §3.2.3) state the rule: "We need to prevent leftward information flow in the decoder to preserve the auto-regressive property." Information may move from earlier positions to later ones, never back. In the same section they write that self-attention in the decoder lets each position attend to "all positions in the decoder up to and including that position".

In matrix terms: query $i$ may read key $j$ only if $j \le i$.

| | Reads earlier tokens | Reads itself | Reads later tokens | Used by |
|---|---|---|---|---|
| causal (decoder) self-attention | yes | yes | no | Llama, GPT-style models |
| bidirectional (encoder) self-attention | yes | yes | yes | BERT-style encoders, the encoder of the original Transformer |

## 5. The causal mask

### 5.1 The formula

Add a mask matrix $M$ to the scaled scores, before the softmax:

$$
P = \mathrm{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}} + M\right)
\qquad
M_{ij} = \begin{cases} 0 & \text{if } j \le i \\ -\infty & \text{if } j > i \end{cases}
$$

For four tokens:

$$
M = \begin{bmatrix} 0 & -\infty & -\infty & -\infty \\ 0 & 0 & -\infty & -\infty \\ 0 & 0 & 0 & -\infty \\ 0 & 0 & 0 & 0 \end{bmatrix}
$$

The paper implements it by "masking out (setting to $-\infty$)" all values of the softmax input that belong to illegal connections.

### 5.2 Why minus infinity, and why before the softmax

1. $s + (-\infty) = -\infty$ for any finite score $s$.
2. $e^{-\infty} = 0$. So a blocked key gets the weight 0 exactly.
3. The softmax divides by the sum over the **allowed** keys only. So each row still sums to 1.

You could also apply the softmax first, set the blocked weights to 0, and divide by the new sum. The result is the same. For row "cat" of L3: the unmasked weights are $[0.1400, 0.5760, 0.2840]$. Remove the third: $[0.1400, 0.5760]$, sum $0.7160$. Divide: $[0.1956, 0.8044]$. That is the masked result of section 6. But the additive mask needs no second division. So implementations mask before the softmax. Fast kernels go further: FlashAttention-2 (§3.1.1) skips the computation of every block that lies completely above the diagonal.

> [!trap] Setting weights to zero without dividing again
> If you set the blocked weights to 0 after the softmax and stop there, row "cat" becomes $[0.1400, 0.5760, 0]$. It sums to $0.7160$, not to 1. The output is then too small, and it is no longer a weighted average.

### 5.3 The mask in real code

| Code | How it builds the mask | Value for a blocked entry |
|---|---|---|
| Meta reference (`model.py`) | `torch.triu(torch.full((seqlen, seqlen), float("-inf")), diagonal=1)` | $-\infty$ |
| PyTorch `scaled_dot_product_attention` | `is_causal=True`, or a boolean `attn_mask` where true means that the element takes part in attention | $-\infty$ inside the reference implementation |
| Hugging Face Transformers (`masking_utils.py`) | `causal_mask_function` returns `kv_idx <= q_idx`. For eager attention the boolean mask becomes a float mask. | `torch.finfo(dtype).min`, the smallest finite number |

`torch.triu(..., diagonal=1)` keeps the entries above the main diagonal and sets the others to 0. So the $-\infty$ values sit exactly at $j > i$. Every layer applies the same mask. One unmasked layer would be enough to leak later tokens into earlier positions.

## 6. The toy example, row by row

The prompt is "the cat sat". The queries, keys and values are those of [L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention):

$$
Q = \begin{bmatrix} 1 & 1 \\ 0 & 1 \\ 0 & 1 \end{bmatrix}
\quad
K = \begin{bmatrix} 1 & 0 \\ 0 & 2 \\ 0 & 1 \end{bmatrix}
\quad
V = \begin{bmatrix} 2 & 3 \\ 2 & 2 \\ 1 & 2 \end{bmatrix}
\quad
\frac{QK^\top}{\sqrt{2}} = \begin{bmatrix} 0.7071 & 1.4142 & 0.7071 \\ 0 & 1.4142 & 0.7071 \\ 0 & 1.4142 & 0.7071 \end{bmatrix}
$$

Add the mask:

$$
\frac{QK^\top}{\sqrt{2}} + M = \begin{bmatrix} 0.7071 & -\infty & -\infty \\ 0 & 1.4142 & -\infty \\ 0 & 1.4142 & 0.7071 \end{bmatrix}
$$

> [!example] Worked example: row "the"
> 1. Allowed scores: only $0.7071$ (itself).
> 2. Subtract the maximum: $[0, -\infty, -\infty]$. Exponentials: $[1, 0, 0]$. Sum: 1.
> 3. Weights: $[1, 0, 0]$.
> 4. Output: $1 \cdot v_{the} = [2, 3]$.
>
> The first token can read only itself. Its attention output is always its own value vector.

> [!example] Worked example: row "cat"
> 1. Scores: $[0, 1.4142, -\infty]$. The maximum is $1.4142$.
> 2. Subtract it: $[-1.4142, 0, -\infty]$.
> 3. Exponentials: $[0.2431, 1, 0]$. Sum: $1.2431$.
> 4. Weights: $0.2431 / 1.2431 = 0.1956$ and $1 / 1.2431 = 0.8044$, and 0.
> 5. Output: $0.1956 \cdot [2, 3] + 0.8044 \cdot [2, 2] = [0.3911 + 1.6089, \; 0.5867 + 1.6089] = [2, 2.1956]$.

> [!example] Worked example: row "sat"
> No entry of this row is masked, because "sat" is the last token. The result is the one of L3: weights $[0.1400, 0.5760, 0.2840]$ and output $[1.7160, 2.1400]$.

The result for the prefill of "the cat sat":

$$
P = \begin{bmatrix} 1 & 0 & 0 \\ 0.1956 & 0.8044 & 0 \\ 0.1400 & 0.5760 & 0.2840 \end{bmatrix}
\qquad
O = \begin{bmatrix} 2 & 3 \\ 2 & 2.1956 \\ 1.7160 & 2.1400 \end{bmatrix}
$$

| Row | Without the mask (L3) | With the causal mask | Changed? |
|---|---|---|---|
| the | [1.7517, 2.2483] | [2, 3] | yes |
| cat | [1.7160, 2.1400] | [2, 2.1956] | yes |
| sat | [1.7160, 2.1400] | [1.7160, 2.1400] | no |

The matrix $P$ is lower triangular. Each row sums to 1. With the mask, "cat" and "sat" no longer have the same output, although their queries are equal: "cat" sees two tokens and "sat" sees three.

![Alt text: two four-by-four grids. Left, the mask with zeros on and below the diagonal and minus infinity above it. Right, the causal attention weights of "the cat sat down" with zeros above the diagonal.](/notes/media/llm-systems/figures/02-4-causal-mask.svg)

```python
import numpy as np

def softmax(S):
    S = S - S.max(axis=-1, keepdims=True)
    E = np.exp(S)
    return E / E.sum(axis=-1, keepdims=True)

def causal_attention(X, W_Q, W_K, W_V):
    Q, K, V = X @ W_Q, X @ W_K, X @ W_V
    T = X.shape[0]
    S = Q @ K.T / np.sqrt(K.shape[-1])                   # [T, T] scaled scores
    M = np.triu(np.full((T, T), -np.inf), k=1)           # -inf above the diagonal
    P = softmax(S + M)                                   # masked weights
    return P @ V, P, K, V

X = np.array([[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]], dtype=float)   # the, cat, sat
W_Q = np.array([[0, 0], [0, 1], [1, 1], [0, 0]], dtype=float)
W_K = np.array([[0, 0], [0, 1], [1, 0], [0, 1]], dtype=float)
W_V = np.array([[1, 1], [0, 1], [1, 2], [2, 1]], dtype=float)

O, P, K, V = causal_attention(X, W_Q, W_K, W_V)
print(P.round(4))
print(O.round(4))
```

The only new line compared with L3 is the mask `M`. `np.triu(..., k=1)` keeps the $-\infty$ values strictly above the diagonal. The first row has exactly one finite score, so the maximum is finite and the softmax is safe.

## 7. Training: all positions at the same time

### 7.1 Teacher forcing

Take the training text "the cat sat down". Shift it by one position to get the inputs and the targets:

| Position | Input token | Visible tokens | Target (the next token) |
|---|---|---|---|
| 1 | the | the | cat |
| 2 | cat | the, cat | sat |
| 3 | sat | the, cat, sat | down |

Vaswani et al. (§3.1) describe the same construction. The mask, "combined with fact that the output embeddings are offset by one position", ensures that the predictions for position $i$ depend only on known outputs at positions less than $i$.

One forward pass with the causal mask computes the predictions of all three positions at the same time. Each position sees only its allowed prefix. So one pass gives three training examples. A sequence of 8,192 tokens gives 8,191 training examples in one pass: every position except the last has a next token. This method is **teacher forcing**: every position reads the true earlier tokens, not tokens that the model generated.

### 7.2 The loss

$$
\mathcal{L} = -\frac{1}{N} \sum_{t=1}^{N} \ln p_\theta(x_{t+1} \mid x_1, \dots, x_t)
$$

- $p_\theta(x_{t+1} \mid x_1, \dots, x_t)$ is the probability that the model gives to the true next token at position $t$.
- $N$ is the number of predicted positions.
- The loss is small when the model gives high probabilities to the true tokens.

> [!example] Worked example: the loss of three positions
> Assume that the model gives these probabilities to the true next tokens: $p(\text{cat}) = 0.5$, $p(\text{sat}) = 0.25$, $p(\text{down}) = 0.3484$. The first two numbers are invented. The third is the toy value of [L1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors).
>
> 1. $-\ln 0.5 = 0.6931$
> 2. $-\ln 0.25 = 1.3863$
> 3. $-\ln 0.3484 = 1.0544$
> 4. Mean: $(0.6931 + 1.3863 + 1.0544) / 3 = 1.0446$.

The page [Training: cross-entropy and distillation](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/03-background-training-cross-entropy-and-distillation) explains the cross-entropy loss from zero.

> [!note] Exposure bias
> In training, each position reads true earlier tokens. In generation, the model reads its own earlier outputs, which can contain errors. This difference is called exposure bias. Interpretation of these notes: it is one reason why a model can drift after an early mistake.

## 8. Generation: one token at a time

### 8.1 Prefill

Generation starts with the prompt "the cat sat". The model runs causal attention over the three prompt tokens in one pass, in every layer. This pass is the **prefill**. It gives the output rows of section 6. The last row passes through the rest of the model to the LM head, and the model chooses the next token. In this toy, assume that it chooses "down".

The prefill also produced the keys and values of "the", "cat" and "sat", in every layer. Keep them:

$$
K_{cache} = \begin{bmatrix} 1 & 0 \\ 0 & 2 \\ 0 & 1 \end{bmatrix}
\qquad
V_{cache} = \begin{bmatrix} 2 & 3 \\ 2 & 2 \\ 1 & 2 \end{bmatrix}
$$

### 8.2 The decode step for "down"

The new token has $x_{down} = [0, 1, 1, 0]$. Only this one token needs projections.

> [!example] Worked example: the decode step for "down"
> **Step 1: project the new token.** $x_{down}$ uses rows 2 and 3 of each matrix.
>
> - $q_4 = [0, 1] + [1, 1] = [1, 2]$
> - $k_4 = [0, 1] + [1, 0] = [1, 1]$
> - $v_4 = [0, 1] + [1, 2] = [1, 3]$
>
> **Step 2: append.** $K = [k_{the}; k_{cat}; k_{sat}; k_4]$ and $V = [v_{the}; v_{cat}; v_{sat}; v_4]$. Four rows each.
>
> **Step 3: raw scores** of $q_4 = [1, 2]$ against the four keys:
>
> - $k_{the} = [1, 0]$: $1$
> - $k_{cat} = [0, 2]$: $4$
> - $k_{sat} = [0, 1]$: $2$
> - $k_4 = [1, 1]$: $3$
>
> **Step 4: scale** by $\sqrt{2}$: $[0.7071, 2.8284, 1.4142, 2.1213]$.
>
> **Step 5: mask.** None. "down" is the newest token, so every key is earlier or itself. The mask row is all zeros.
>
> **Step 6: softmax.** Subtract the maximum $2.8284$: $[-2.1213, 0, -1.4142, -0.7071]$. Exponentials: $[0.1199, 1, 0.2431, 0.4931]$. Sum: $1.8561$. Weights: $[0.0646, 0.5388, 0.1310, 0.2657]$.
>
> **Step 7: mix.** With the unrounded weights $[0.064585, 0.538776, 0.130985, 0.265654]$:
>
> - First entry: $0.12917 + 1.07755 + 0.13099 + 0.26565 = 1.60336$
> - Second entry: $0.19376 + 1.07755 + 0.26197 + 0.79696 = 2.33024$
>
> So $o_4 = [1.6034, 2.3302]$. The weights rounded to 4 decimals sum to $1.0001$ and give $[1.6035, 2.3305]$. That small difference is only rounding.

```python
import numpy as np

def softmax(z):
    z = z - z.max(axis=-1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)

W_Q = np.array([[0, 0], [0, 1], [1, 1], [0, 0]], dtype=float)
W_K = np.array([[0, 0], [0, 1], [1, 0], [0, 1]], dtype=float)
W_V = np.array([[1, 1], [0, 1], [1, 2], [2, 1]], dtype=float)
X3 = np.array([[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]], dtype=float)  # the, cat, sat
x_down = np.array([0, 1, 1, 0], dtype=float)

# Prefill stored these keys and values. They do not change later.
K_cache, V_cache = X3 @ W_K, X3 @ W_V                   # [3, 2] each

# Decode step for "down": project ONE token.
q4, k4, v4 = x_down @ W_Q, x_down @ W_K, x_down @ W_V  # [2] each
K_all = np.vstack([K_cache, k4])                        # [4, 2]: append the new key
V_all = np.vstack([V_cache, v4])                        # [4, 2]: append the new value
w = softmax(K_all @ q4 / np.sqrt(2))                    # [4] weights, no mask needed
o4 = w @ V_all                                          # [2] output of "down"
print(q4, k4, v4, (K_all @ q4).round(4), w.round(4), o4.round(4))

# Check: full causal attention over all four tokens gives the same last row.
X4 = np.vstack([X3, x_down])
Q, K, V = X4 @ W_Q, X4 @ W_K, X4 @ W_V
M = np.triu(np.full((4, 4), -np.inf), k=1)
O_full = softmax(Q @ K.T / np.sqrt(2) + M) @ V
assert np.allclose(O_full[3], o4)                       # same output for "down"
assert np.allclose(K[:3], K_cache) and np.allclose(V[:3], V_cache)   # old rows unchanged
print(O_full.round(4))
```

The important lines:

1. `x_down @ W_Q` and the two other products project **one** token. The prefill does not run again.
2. `np.vstack([K_cache, k4])` appends one row. This is the whole idea of a KV cache in two lines ([part 03 L4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache)).
3. `K_all @ q4` computes four scores. The newest query needs no mask.
4. The two `assert` lines prove the two facts of section 8.3.

![Alt text: the decode step for "down". The new query in blue meets three stored keys and one new key in gold, which gives four weights. The weights mix three stored values and one new value in purple into the output 1.6034, 2.3302.](/notes/media/llm-systems/figures/02-4-decode-step.svg)

```video
{
  "src": "/notes/media/llm-systems/manim/m05-causal-mask-and-decode.mp4",
  "caption": "The causal mask fills the upper triangle with minus infinity, then one decode step for \"down\" reuses the stored keys and values of the three earlier tokens."
}
```

### 8.3 The two facts behind the KV cache

The full $4 \times 4$ causal computation gives:

$$
P_4 = \begin{bmatrix} 1 & 0 & 0 & 0 \\ 0.1956 & 0.8044 & 0 & 0 \\ 0.1400 & 0.5760 & 0.2840 & 0 \\ 0.0646 & 0.5388 & 0.1310 & 0.2657 \end{bmatrix}
\qquad
O_4 = \begin{bmatrix} 2 & 3 \\ 2 & 2.1956 \\ 1.7160 & 2.1400 \\ 1.6034 & 2.3302 \end{bmatrix}
$$

> [!key] Two facts that the toy proves
> 1. **The last row equals the decode step.** Recomputing everything gives exactly $o_4 = [1.6034, 2.3302]$, the same as the decode step with stored keys and values.
> 2. **Nothing about earlier tokens changes.** The keys, the values and even the outputs of "the", "cat" and "sat" stay the same when "down" arrives. The mask guarantees it: no earlier row can read the new column.
>
> So the model never needs to recompute the keys and values of earlier tokens. It stores them once, in every layer, and appends one row per new token. That store is the **KV cache**.

Why is this true in every layer, not only in the first one? A short induction:

1. **Layer 1.** $k_j = x_j W_K$ depends only on the hidden state of token $j$, which is its embedding (and its position).
2. **Layer $\ell$ to layer $\ell + 1$.** Assume that the hidden state of position $j$ after layer $\ell$ depends only on tokens $1$ to $j$. Its attention output in the next layer reads keys and values at positions $1$ to $j$ only, because of the mask. The MLP and the norms work on position $j$ alone. So the hidden state of position $j$ after layer $\ell + 1$ also depends only on tokens $1$ to $j$.
3. So a new token at position $T + 1$ changes no hidden state, no key and no value at positions $1$ to $T$, in any layer.

[Part 03 L1](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists) gives the full argument and counts the saved work. [Part 03 L2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) explains why prefill and decode stress the GPU in different ways.

Why does the cache hold keys and values, but no queries? A query is used only by its own token, at its own step. Only the newest token computes outputs in a decode step, so only its query is needed. Old queries are never read again.

### 8.4 The mask when the cache already holds tokens

Sometimes a step adds several new tokens at once, for example a long prompt in chunks. The new queries must then read all cached keys and the earlier new keys. The Meta reference code builds this mask:

```python
mask = torch.full((seqlen, seqlen), float("-inf"), device=tokens.device)
mask = torch.triu(mask, diagonal=1)
mask = torch.hstack([torch.zeros((seqlen, start_pos), device=tokens.device), mask]).type_as(h)
```

`start_pos` is the number of cached tokens, and `seqlen` is the number of new tokens. The mask has the shape $[seqlen, start\_pos + seqlen]$. Its first `start_pos` columns are zeros: every new token may read every cached token. The remaining square is the normal causal mask. Example with 3 cached tokens and 2 new tokens:

$$
M = \begin{bmatrix} 0 & 0 & 0 & 0 & -\infty \\ 0 & 0 & 0 & 0 & 0 \end{bmatrix}
$$

A plain decode step has `seqlen = 1`. The Meta code then builds no mask at all (`mask = None` when `seqlen` is 1).

### 8.5 A real trap: `is_causal=True` in a decode step

> [!trap] PyTorch aligns its causal mask to the top left
> The PyTorch documentation of `scaled_dot_product_attention` says that for a non-square mask, the mask of `is_causal=True` has the form of the upper-left causal bias (`torch.nn.attention.bias.CausalBias`). In a decode step the query matrix has 1 row and the key matrix has $T$ rows. The upper-left alignment lets that single query read only key 1.
>
> Measured in these notes with PyTorch 2.14.1, for the decode step of "down":
>
> | Call | Output |
> |---|---|
> | no mask | [1.6034, 2.3302] (correct) |
> | `is_causal=True` | [2, 3] (wrong: it read only "the") |
> | `attn_mask=causal_lower_right(1, 4)` | [1.6034, 2.3302] (correct) |
>
> For one new token, use no mask. For several new tokens after a cache, use a lower-right causal mask, like the Meta mask of section 8.4.

```python
import torch
import torch.nn.functional as F
from torch.nn.attention.bias import causal_lower_right

q = torch.tensor([[[1., 2.]]])                               # one query: "down", [1, 1, 2]
K = torch.tensor([[[1., 0], [0, 2], [0, 1], [1, 1]]])        # four keys, [1, 4, 2]
V = torch.tensor([[[2., 3], [2, 2], [1, 2], [1, 3]]])        # four values, [1, 4, 2]

print(F.scaled_dot_product_attention(q, K, V))                # no mask: correct
print(F.scaled_dot_product_attention(q, K, V, is_causal=True))   # wrong for decode
print(F.scaled_dot_product_attention(q, K, V, attn_mask=causal_lower_right(1, 4)))
```

## 9. Padding masks for batches

### 9.1 Why padding exists

A GPU processes a batch as one rectangular tensor $[B, T]$. Real prompts have different lengths. Simple implementations therefore fill the short ones with padding tokens. Take two prompts: A = "the cat sat" (3 tokens) and B = "the cat" (2 tokens).

| | Position 1 | Position 2 | Position 3 | attention mask |
|---|---|---|---|---|
| A | the | cat | sat | [1, 1, 1] |
| B, right padding | the | cat | PAD | [1, 1, 0] |
| B, left padding | PAD | the | cat | [0, 1, 1] |

The attention mask of Hugging Face marks real tokens with 1 and padding with 0. The model must never read a padding key. So the final mask combines two rules with a logical AND:

$$
\text{allowed}_{b,i,j} = (j \le i) \ \text{and} \ (\text{attention\_mask}_{b,j} = 1)
$$

Hugging Face builds it in the same way: `causal_mask_function` and `padding_mask_function` (which returns `padding_mask[batch_idx, kv_idx]`) are combined with `and_masks`.

### 9.2 Left padding for generation

Generation appends the new token at the end of each row and reads the logits of the last position. With right padding, the last position of B is a padding token. Its logits do not describe the next token of "the cat".

The Hugging Face text generation guide says: "LLMs aren't trained to continue generation from padding tokens, which means the `padding_side()` parameter needs to be set to the left of the input." Its `generate()` code also logs a warning when it detects right padding. The warning reads: "A decoder-only architecture is being used, but right-padding was detected! For correct generation results, please set `padding_side='left'` when initializing the tokenizer." (Transformers source on GitHub, checked on 2026-10-15.)

### 9.3 Position IDs with left padding

With left padding, "the" sits at index 1 of row B. But it is the first real token, so its position must be 0. Otherwise RoPE rotates it as if it were the second token. Hugging Face computes the position IDs from the attention mask:

```python
position_ids = attention_mask.long().cumsum(-1) - 1
position_ids = position_ids.masked_fill(attention_mask == 0, 0)
```

For B with left padding, the mask is $[0, 1, 1]$. The cumulative sum is $[0, 1, 2]$. Minus 1 gives $[-1, 0, 1]$. The padding entry becomes 0. Result: $[0, 0, 1]$, so "the" has position 0 and "cat" has position 1.

### 9.4 The padding row itself

With left padding, the padding query of B at index 0 may read only key 0 (causal rule), and key 0 is padding. So every entry of its row is blocked. With $-\infty$ in every entry, the softmax computes $-\infty - (-\infty)$, which is NaN. Three implementations handle it in three ways:

| Implementation | Fully blocked row gives | Measured or source |
|---|---|---|
| plain softmax with $-\infty$ (NumPy or `torch.softmax`) | NaN in every entry | measured in these notes |
| Hugging Face eager attention | equal weights, because every entry is the same smallest finite number | `masking_utils.py` uses `torch.finfo(dtype).min` |
| PyTorch 2.14.1 `scaled_dot_product_attention` with a boolean mask | an output row of zeros | measured in these notes |

The output of a padding row is never used: no real token reads it, and its logits are ignored. But a NaN can still spread into later sums, so the implementation must avoid it.

```python
import numpy as np

def softmax(S):
    S = S - S.max(axis=-1, keepdims=True)
    E = np.exp(S)
    return E / E.sum(axis=-1, keepdims=True)

W_Q = np.array([[0, 0], [0, 1], [1, 1], [0, 0]], dtype=float)
W_K = np.array([[0, 0], [0, 1], [1, 0], [0, 1]], dtype=float)
W_V = np.array([[1, 1], [0, 1], [1, 2], [2, 1]], dtype=float)
the, cat, sat = [1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]
pad = [0, 0, 0, 0]                                    # any vector: the mask hides it

X = np.array([[the, cat, sat],                        # sequence A: 3 real tokens
              [pad, the, cat]], dtype=float)          # sequence B: left-padded
attention_mask = np.array([[1, 1, 1],
                           [0, 1, 1]])                # 1 = real token, 0 = padding

causal = np.tril(np.ones((3, 3), dtype=bool))         # key j <= query i
allowed = causal[None] & (attention_mask[:, None, :] == 1)   # [B, T, T]

Q, K, V = X @ W_Q, X @ W_K, X @ W_V                   # [B, T, 2] each
S = Q @ K.swapaxes(1, 2) / np.sqrt(2)                 # [B, T, T]
S = np.where(allowed, S, np.finfo(S.dtype).min)       # blocked: smallest float
O = softmax(S) @ V                                    # [B, T, 2]

print(O[1].round(4))                                  # row 0 is padding: ignore it
assert np.allclose(O[1, 1:], [[2, 3], [2, 2.19557]], atol=1e-5)

position_ids = attention_mask.cumsum(-1) - 1          # as in Hugging Face generate()
position_ids[attention_mask == 0] = 0
print(position_ids)
```

The real rows of B give $[2, 3]$ and $[2, 2.1956]$: exactly the results of "the cat" without padding (section 6). The padding row gives $[1.3333, 1.6667]$, a meaningless average. The position IDs are `[[0 1 2] [0 0 1]]`.

### 9.5 A third way: no padding in the attention at all

The Meta reference `generate()` places the prompts at the start of a buffer filled with the pad ID. It starts the loop at the length of the **shortest** prompt. All rows then advance one position per step. If a row still has prompt tokens at that position, the code keeps the true prompt token and drops the sampled one: `torch.where(input_text_mask[:, cur_pos], tokens[:, cur_pos], next_token)`. So a model step never reads a padding token, and the model needs only the causal mask. The cost is that the longer prompts finish their prefill one token per step. Serving engines use other designs again, with paged caches ([part 04 L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling), [PagedAttention page 05](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager)).

### Exercises

Work in `C:\Users\ASohi\Downloads\AI\agent-harness-lab\llm-systems\02-l4-causal-mask.ipynb`.

1. **Causal attention.** Write `causal_attention(X, W_Q, W_K, W_V)`.
   - Acceptance test: for the toy prompt, $P$ equals the matrix of section 6 to 4 decimals. Every entry above the diagonal is exactly 0. Every row sums to 1.
   - Hint 1: build the mask with `np.triu(np.full((T, T), -np.inf), k=1)`.
   - Hint 2: add the mask to the scaled scores before the softmax.
2. **Prefill plus one decode step.** Write `prefill(X)`, which returns the outputs and the cache, and `decode_step(x, K_cache, V_cache)`.
   - Acceptance test: the decode output for "down" is $[1.6034, 2.3302]$. It equals the last row of a full causal pass over four tokens, and the first three rows of that pass equal the prefill outputs.
   - Hint 1: the decode step projects one vector and appends one row to each cache.
   - Hint 2: the newest query needs no mask.
3. **The training loss with teacher forcing.** Use the bigram logits table of [L1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) as the "model". Compute the mean cross-entropy of "the cat sat down" over all positions in one vectorized step.
   - Acceptance test: the three losses are about $[0.7711, 0.5943, 0.6273]$ and the mean is about $0.6642$.
   - Hint 1: inputs are `tokens[:-1]`, targets are `tokens[1:]`.
   - Hint 2: use a stable log-softmax: $z - \max z - \ln \sum e^{z - \max z}$.
4. **Padding.** Write `batched_causal_attention(X, attention_mask)` and `position_ids(attention_mask)`.
   - Acceptance test: with left padding and with right padding, the real rows of "the cat" equal $[2, 3]$ and $[2, 2.1956]$. The position IDs for left padding are `[[0, 1, 2], [0, 0, 1]]`. Print whether the last position of each row is a real token.
   - Hint 1: `allowed = causal[None] & (attention_mask[:, None, :] == 1)`.
   - Hint 2: use `np.finfo(dtype).min` for blocked entries, so that a padding row gives no NaN.

## 10. Common mistakes

1. **"The causal mask hides the prompt from the answer."** It hides only **later** tokens. Every answer token reads every prompt token. The page [Attention and position](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) shows this with a long prompt.
2. **"Masking means setting the weights to 0 after the softmax."** The mask adds $-\infty$ **before** the softmax. Zeroing afterwards without a new division leaves rows that do not sum to 1.
3. **"Training generates one token at a time like inference."** With teacher forcing and the mask, one forward pass computes every position of the text at the same time.
4. **"Each decode step needs the causal mask."** A single new token is the last token. Its mask row is all zeros. And `is_causal=True` in PyTorch is wrong for it, because of the upper-left alignment.
5. **"The keys of earlier tokens change when a new token arrives."** They never change in a causal model, in any layer. That is why they can be cached.
6. **"The KV cache should also store queries."** Only the newest token needs a query. Old queries are never read again.
7. **"Right padding is fine for generation."** The last position of a right-padded row is a padding token, so its logits are meaningless. Decoder-only generation needs left padding, the right position IDs, and a padding mask.

## 11. One-minute explanation

A decoder learns to predict the next token, so position $i$ must not read any later position. Otherwise it could copy its own answer during training, and the causal mask prevents this. The mask adds 0 to the scores where key $j \le i$ and $-\infty$ where $j > i$, before the softmax. Since $e^{-\infty} = 0$, later tokens get exactly zero weight, and each row still sums to 1 over the allowed keys. In training, this lets one forward pass compute all positions at the same time with teacher forcing. In generation, the prompt is processed once in the prefill, then each new token takes one decode step. In the toy, the decode step for "down" has the scores $[1, 4, 2, 3]$, the weights $[0.0646, 0.5388, 0.1310, 0.2657]$ and the output $[1.6034, 2.3302]$. Recomputing all four tokens gives the same last row and the same earlier rows. So the keys and values of earlier tokens never change, and the model stores them in the KV cache instead of recomputing them. For batches, a padding mask blocks padding keys, and generation uses left padding with corrected position IDs.

## 12. Check questions

```check
{
  "question": "Write the additive causal mask for 3 tokens. Which entries are blocked, and what is the weight of a blocked key after the softmax?",
  "hint": "Query $i$ may read key $j$ only if $j \\le i$.",
  "answer": "$$M = \\begin{bmatrix} 0 & -\\infty & -\\infty \\\\ 0 & 0 & -\\infty \\\\ 0 & 0 & 0 \\end{bmatrix}$$\n\nThe entries above the main diagonal ($j > i$) are blocked. After the softmax a blocked key has the weight exactly 0, because $e^{-\\infty} = 0$. The allowed weights of each row still sum to 1."
}
```

```check
{
  "question": "With the causal mask, the second token has the query $[1, 0]$. The keys are $k_1 = [1, 0]$ and $k_2 = [0, 2]$ (and $k_3 = [0, 1]$, which is later), the values are $[2, 3]$ and $[2, 2]$. Compute its weights and its output with $d_k = 2$.",
  "hint": "Only keys 1 and 2 are visible.",
  "answer": "Visible scores: $1$ and $0$. Scaled: $[0.7071, 0]$. Subtract the maximum: $[0, -0.7071]$. Exponentials: $[1, 0.4931]$, sum $1.4931$. Weights: $[0.6698, 0.3302]$, and 0 for key 3. Output: $0.6698 \\cdot [2, 3] + 0.3302 \\cdot [2, 2] = [2, 2.6698]$."
}
```

```check
{
  "question": "Interview follow-up: \"Why do we add minus infinity before the softmax? Why not set the weights to zero afterwards? And why does Hugging Face use the smallest finite float instead of minus infinity?\"",
  "hint": "Think about the row sum and about a row where every entry is blocked.",
  "answer": "Adding $-\\infty$ before the softmax gives the blocked keys $e^{-\\infty} = 0$, and the softmax divides by the sum of the allowed keys only, so each row sums to 1 in one step. Setting weights to 0 after the softmax gives the same result only if you divide by the new row sum again. Without that second division the row sums to less than 1 (row \"cat\": 0.7160). The smallest finite float (`torch.finfo(dtype).min`) gives practically the same zero weight, because it is added to small scores. But it avoids NaN in a row where every entry is blocked (for example a padding query with left padding): with $-\\infty$ the softmax computes $-\\infty - (-\\infty) =$ NaN, while equal finite values give equal weights. That output is never used, but a NaN could spread into later sums."
}
```

```check
{
  "question": "Interview follow-up: \"Walk me through one decode step for the token \\\"down\\\" in the toy. Then show that you did not need to recompute anything for the earlier tokens.\"",
  "hint": "$x_{down} = [0, 1, 1, 0]$. Project it, append, score, softmax, mix. Then compare with a full causal pass over four tokens.",
  "answer": "1. Project only the new token: $q_4 = [1, 2]$, $k_4 = [1, 1]$, $v_4 = [1, 3]$.\n2. Append $k_4$ and $v_4$ to the stored keys $[1, 0], [0, 2], [0, 1]$ and values $[2, 3], [2, 2], [1, 2]$.\n3. Raw scores: $[1, 4, 2, 3]$. Scaled by $\\sqrt{2}$: $[0.7071, 2.8284, 1.4142, 2.1213]$.\n4. No mask: the newest token may read everything.\n5. Softmax: $[0.0646, 0.5388, 0.1310, 0.2657]$.\n6. Output: $o_4 = [1.6034, 2.3302]$.\n\nA full causal pass over \"the cat sat down\" gives the same last row, and its first three rows are the prefill outputs $[2, 3]$, $[2, 2.1956]$, $[1.7160, 2.1400]$ unchanged. The keys and values of the earlier tokens are also unchanged, because $k_j = x_j W_K$ depends only on position $j$, and in deeper layers the mask guarantees that position $j$ depends only on tokens $1$ to $j$ (induction over layers). So the model stores them once: the KV cache."
}
```

```check
{
  "question": "Interview follow-up: \"Why is it called a KV cache and not a QKV cache?\"",
  "answer": "A query is used only to compute the output of its own token. In a decode step, only the newest token computes an output, so only its query is needed, and it is computed fresh from the new hidden state. The keys and values of all earlier tokens are read by every later query, in every layer, so they are worth storing. Old queries are never read again. Storing them would cost memory and give nothing."
}
```

```check
{
  "question": "Interview follow-up: \"You implement decode with `F.scaled_dot_product_attention(q, K, V, is_causal=True)`, with one query and 4 cached keys. What goes wrong?\"",
  "hint": "Read how PyTorch aligns a non-square causal mask.",
  "answer": "PyTorch documents that for a non-square mask `is_causal=True` uses the upper-left causal bias. With 1 query and 4 keys, the single query row is aligned with key 1, so it may read only key 1. For the toy decode step this returns $[2, 3]$ (the value of \"the\") instead of $[1.6034, 2.3302]$, measured with PyTorch 2.14.1. There is no error, only wrong text. Fix: for one new token pass no mask. For several new tokens after a cache, use a lower-right causal mask (`torch.nn.attention.bias.causal_lower_right`), or build the mask like the Meta code: zeros for the cached columns, then the causal triangle."
}
```

```check
{
  "question": "The cache holds 2 tokens. A step adds 3 new tokens at once. Write the additive mask and give its shape.",
  "hint": "Zeros for the cached columns, then a causal triangle for the new tokens.",
  "answer": "Shape $[3, 5]$: 3 new queries, $2 + 3 = 5$ keys.\n\n$$M = \\begin{bmatrix} 0 & 0 & 0 & -\\infty & -\\infty \\\\ 0 & 0 & 0 & 0 & -\\infty \\\\ 0 & 0 & 0 & 0 & 0 \\end{bmatrix}$$\n\nEvery new token reads both cached tokens. New token 1 reads itself, new token 2 reads new token 1 and itself, and new token 3 reads all. This is `torch.hstack([zeros(3, 2), triu(full(3, 3, -inf), diagonal=1)])` in the Meta reference code."
}
```

```check
{
  "question": "A batch holds \"the cat sat\" and \"the cat\". Why must a decoder-only model use left padding for generation, and what are the position IDs of the padded row?",
  "hint": "Which logits does generation read? Where does RoPE need position 0?",
  "answer": "Generation reads the logits of the last position and appends the next token at the end. With right padding, the last position of \"the cat\" is a padding token, so its logits do not predict the word after \"cat\". With left padding (`PAD the cat`) the last position is the real token \"cat\". A padding mask must still block the padding key, and the position IDs must start at the first real token: the attention mask $[0, 1, 1]$ gives $\\text{cumsum} - 1 = [-1, 0, 1]$, and the padding entry is set to 0, so the position IDs are $[0, 0, 1]$. \"the\" gets position 0, as in the unpadded prompt."
}
```

```check
{
  "question": "Interview follow-up: \"In training you process every position of a sequence in one pass. Why can't you generate a 500-token answer in one pass? How many forward passes does it take?\"",
  "answer": "Training knows every token, so teacher forcing feeds the true tokens and the causal mask lets all positions compute in parallel. In generation, token $t+1$ does not exist until the model chooses it from the logits at position $t$, so every new token needs the previous one first. A 500-token answer takes 500 forward passes: one prefill over the prompt, which also gives the first output token, and 499 decode steps. Each decode step processes one token per sequence and reads the whole KV cache, which is why decode is memory-bound (part 03 L2)."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\nimport numpy as np\n\ndef softmax(S):\n    S = S - S.max(axis=-1, keepdims=True)\n    E = np.exp(S)\n    return E / E.sum(axis=-1, keepdims=True)\n\ndef causal_attention(X, W_Q, W_K, W_V):\n    Q, K, V = X @ W_Q, X @ W_K, X @ W_V\n    T = X.shape[0]\n    S = Q @ K.T / np.sqrt(K.shape[-1])\n    S = S + np.triu(np.full((T, T), -np.inf), k=1)\n    P = softmax(S)\n    return P @ V, P\n\nX = np.array([[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]], dtype=float)\nW_Q = np.array([[0, 0], [0, 1], [1, 1], [0, 0]], dtype=float)\nW_K = np.array([[0, 0], [0, 1], [1, 0], [0, 1]], dtype=float)\nW_V = np.array([[1, 1], [0, 1], [1, 2], [2, 1]], dtype=float)\n\nO, P = causal_attention(X, W_Q, W_K, W_V)\nassert np.all(P[np.triu_indices(3, k=1)] == 0.0)          # exactly zero above the diagonal\nassert np.allclose(P.sum(axis=1), 1.0)\nassert np.allclose(P, [[1, 0, 0], [0.1956, 0.8044, 0], [0.1400, 0.5760, 0.2840]], atol=1e-4)\nassert np.allclose(O, [[2, 3], [2, 2.1956], [1.716, 2.14]], atol=1e-4)\nprint(\"all tests pass\")\n```\n\nThe script prints `all tests pass`."
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\nimport numpy as np\n\nW_Q = np.array([[0, 0], [0, 1], [1, 1], [0, 0]], dtype=float)\nW_K = np.array([[0, 0], [0, 1], [1, 0], [0, 1]], dtype=float)\nW_V = np.array([[1, 1], [0, 1], [1, 2], [2, 1]], dtype=float)\nd_k = 2\nprojections = 0                                     # count token projections\n\ndef softmax(S):\n    S = S - S.max(axis=-1, keepdims=True)\n    E = np.exp(S)\n    return E / E.sum(axis=-1, keepdims=True)\n\ndef prefill(X):\n    global projections\n    projections += X.shape[0]\n    Q, K, V = X @ W_Q, X @ W_K, X @ W_V\n    T = X.shape[0]\n    S = Q @ K.T / np.sqrt(d_k) + np.triu(np.full((T, T), -np.inf), k=1)\n    return softmax(S) @ V, K, V                     # outputs and the cache\n\ndef decode_step(x, K_cache, V_cache):\n    global projections\n    projections += 1\n    q, k, v = x @ W_Q, x @ W_K, x @ W_V             # one new token only\n    K_cache = np.vstack([K_cache, k])               # append\n    V_cache = np.vstack([V_cache, v])\n    w = softmax(K_cache @ q / np.sqrt(d_k))         # the newest row sees all keys\n    return w @ V_cache, K_cache, V_cache\n\nX3 = np.array([[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]], dtype=float)\nx_down = np.array([0, 1, 1, 0], dtype=float)\n\nO3, K_c, V_c = prefill(X3)\no4, K_c, V_c = decode_step(x_down, K_c, V_c)\nO4_full, _, _ = prefill(np.vstack([X3, x_down]))    # recompute everything once more\nassert np.allclose(o4, [1.6034, 2.3302], atol=1e-4)\nassert np.allclose(O4_full[3], o4) and np.allclose(O4_full[:3], O3)\nprint(o4.round(4), \"projections counted:\", projections)   # 3 + 1 + 4 = 8\n```\n\nOutput: `[1.6034 2.3302] projections counted: 8`. The prefill projects 3 tokens and the decode step 1. The final check projects all 4 again, which is exactly the work that the cache saves."
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\nimport numpy as np\n\nBIGRAM_LOGITS = np.array([\n    [0.0, 2.0, 0.1, 0.0, 1.5, 0.0],\n    [0.0, 0.0, 2.0, 0.5, 0.0, 0.3],\n    [0.2, 0.0, 0.0, 2.0, 0.0, 0.8],\n    [0.5, 0.0, 0.0, 0.0, 0.0, 2.0],\n    [0.0, 0.0, 2.0, 0.5, 0.0, 0.3],\n    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],\n])\n\ndef log_softmax(z):\n    z = z - z.max(axis=-1, keepdims=True)\n    return z - np.log(np.exp(z).sum(axis=-1, keepdims=True))\n\ntokens = np.array([0, 1, 2, 3])            # \"the cat sat down\"\ninputs, targets = tokens[:-1], tokens[1:]  # teacher forcing: shift by one\nlogits = BIGRAM_LOGITS[inputs]             # [3, V]: all positions at once\nlogp = log_softmax(logits)                 # [3, V]\nnll = -logp[np.arange(len(targets)), targets]   # -log p(true next token)\nprint(nll.round(4), nll.mean().round(4))\n```\n\nOutput: `[0.7711 0.5943 0.6273] 0.6642`. All three positions are computed in one vectorized step: that is teacher forcing."
}
```

```check
{
  "question": "Exercise 4: show a reference solution.",
  "answer": "```python\nimport numpy as np\n\ndef softmax(S):\n    S = S - S.max(axis=-1, keepdims=True)\n    E = np.exp(S)\n    return E / E.sum(axis=-1, keepdims=True)\n\nW_Q = np.array([[0, 0], [0, 1], [1, 1], [0, 0]], dtype=float)\nW_K = np.array([[0, 0], [0, 1], [1, 0], [0, 1]], dtype=float)\nW_V = np.array([[1, 1], [0, 1], [1, 2], [2, 1]], dtype=float)\nthe, cat, sat, pad = [1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0], [0, 0, 0, 0]\n\ndef batched_causal_attention(X, attention_mask):\n    B, T, _ = X.shape\n    Q, K, V = X @ W_Q, X @ W_K, X @ W_V\n    S = Q @ K.swapaxes(1, 2) / np.sqrt(2)\n    causal = np.tril(np.ones((T, T), dtype=bool))\n    allowed = causal[None] & (attention_mask[:, None, :] == 1)\n    S = np.where(allowed, S, np.finfo(S.dtype).min)\n    return softmax(S) @ V\n\ndef position_ids(attention_mask):\n    pos = attention_mask.cumsum(-1) - 1\n    pos[attention_mask == 0] = 0\n    return pos\n\nX_left = np.array([[the, cat, sat], [pad, the, cat]], dtype=float)\nm_left = np.array([[1, 1, 1], [0, 1, 1]])\nO_left = batched_causal_attention(X_left, m_left)\nassert np.allclose(O_left[1, 1:], [[2, 3], [2, 2.19557]], atol=1e-5)\nassert position_ids(m_left).tolist() == [[0, 1, 2], [0, 0, 1]]\n\nX_right = np.array([[the, cat, sat], [the, cat, pad]], dtype=float)\nm_right = np.array([[1, 1, 1], [1, 1, 0]])\nO_right = batched_causal_attention(X_right, m_right)\nassert np.allclose(O_right[1, :2], [[2, 3], [2, 2.19557]], atol=1e-5)\nprint(\"last position of B is real with left padding:\", m_left[1, -1] == 1)\nprint(\"last position of B is real with right padding:\", m_right[1, -1] == 1)\n```\n\nOutput: the last position of the padded row is real with left padding (`True`) and padding with right padding (`False`)."
}
```

## 13. Links

- Previous: [L3: Scaled dot-product attention, step by step](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention)
- Next: [L5: Multi-head attention](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention)
- [Part 03 L1: Why the KV cache exists](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists): the full argument and the saved work
- [Part 03 L2: Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode)
- [Part 03 L4: Implementing a KV cache](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache)
- [Part 04 L4: Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)
- [PagedAttention: the algorithm](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm): the decode step for "down", computed block by block
- [Attention and position](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position)
- [Drill: from attention to PagedAttention](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention)

### Sources

- Vaswani et al., "Attention Is All You Need", NIPS 2017, §3.1 and §3.2.3: https://arxiv.org/abs/1706.03762 (checked on 2026-10-15)
- Meta reference code, `models/llama3/model.py` (causal mask with a cache) and `generation.py` (the generation loop): https://github.com/meta-llama/llama-models (checked on 2026-10-15)
- PyTorch 2.14 documentation, `torch.nn.functional.scaled_dot_product_attention` (boolean mask meaning, upper-left causal bias): https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html (checked on 2026-10-15)
- Hugging Face Transformers, `masking_utils.py` (`causal_mask_function`, `padding_mask_function`, `torch.finfo(dtype).min`) and `generation/utils.py` (position IDs, right-padding warning): https://github.com/huggingface/transformers/tree/main/src/transformers (checked on 2026-10-15)
- Hugging Face Transformers docs, "Text generation", padding side, v5.13.0: https://huggingface.co/docs/transformers/llm_tutorial (checked on 2026-10-15)
- Dao, "FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning", 2023, §3.1.1 (causal masking): https://arxiv.org/abs/2307.08691 (checked on 2026-10-15)
