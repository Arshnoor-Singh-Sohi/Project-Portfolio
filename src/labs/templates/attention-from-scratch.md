---
title: "Attention from scratch"
summary: "Build softmax, scaled dot-product attention and a causal mask in NumPy, then look at the attention weights."
collection: "AI"
tags: [attention, transformers, numpy]
packages: [numpy, matplotlib]
level: "Intermediate"
order: 20
objectives:
  - "Write a softmax that does not overflow for large scores."
  - "Write scaled dot-product attention and give the shape of every array."
  - "Explain why the scores are divided by the square root of d_k."
  - "Build a causal mask and explain why a decoder needs it."
---
# Attention from scratch

Attention lets each token collect information from the other tokens.

- Each token makes a **query** $q$: "what am I looking for?"
- Each token makes a **key** $k$: "what do I contain?"
- Each token makes a **value** $v$: "what do I give if you pick me?"

The output for one token is a weighted average of all values. The weights come from how well the query matches each key:

$$
\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V
$$

You build this in three steps: softmax, attention, and the causal mask.

## 1. Softmax and temperature

Softmax changes a list of scores into weights that are positive and add up to 1. Dividing the scores by a temperature $T$ changes how sharp the weights are. Move the control.

```python
import numpy as np
import matplotlib.pyplot as plt

temperature = 1.0  # @param {type:"slider", min:0.1, max:5, step:0.1}

scores = np.array([2.0, 1.0, 0.5, -1.0])
weights = np.exp(scores / temperature) / np.exp(scores / temperature).sum()

plt.figure(figsize=(6, 3))
plt.bar(["the", "cat", "sat", "down"], weights, color="#1E6091")
plt.ylim(0, 1)
plt.title(f"softmax(scores / {temperature})")
print("weights:", np.round(weights, 3), " sum:", weights.sum())
```

```check
{
  "question": "What happens to the weights when the temperature goes to 0? And when it goes to infinity?",
  "hint": "Look at the largest score. Its share grows when T gets small.",
  "answer": "T → 0: all weight goes to the largest score (like argmax). T → ∞: the weights become equal (1/n each). Dividing by √d_k in attention works like a temperature: it stops large dot products from making the softmax too sharp."
}
```

## 2. A softmax that does not overflow

`np.exp(1000)` is `inf`, so the simple formula breaks for large scores. Write `softmax(z, axis=-1)`:

1. It works on the last axis of a 2-D array (one softmax for each row).
2. It gives `[0.5, 0.5]` for `[1000, 1000]`, with no `nan`.

```python
def softmax(z, axis=-1):
    """Softmax along `axis`. Safe for large values."""
    z = np.asarray(z, dtype=float)
    # TODO
    raise NotImplementedError("Write softmax(z, axis)")
```

```check
{
  "question": "Stuck on the overflow?",
  "hint": "softmax(z) = softmax(z - c) for any number c. Which c makes every exponent ≤ 0?",
  "answer": "Subtract the maximum of each row: `z = z - z.max(axis=axis, keepdims=True)`, then `e = np.exp(z)` and `return e / e.sum(axis=axis, keepdims=True)`."
}
```

```python
import lab

lab.check("big equal scores give equal weights", softmax(np.array([1000.0, 1000.0])), np.array([0.5, 0.5]))
rows = softmax(np.array([[1.0, 2.0, 3.0], [-5.0, 0.0, 5.0]]))
lab.check("each row adds up to 1", rows.sum(axis=-1), np.ones(2))
lab.check("same as the simple formula for small values", rows[0], np.exp([1, 2, 3]) / np.exp([1, 2, 3]).sum())
lab.check("no nan values", bool(np.isnan(softmax(np.array([1e6, -1e6, 0.0]))).any()), False)
```

## 3. Scaled dot-product attention

Shapes: `Q` is `(n_q, d_k)`, `K` is `(n_k, d_k)`, `V` is `(n_k, d_v)`. Return `(output, weights)`:

- `weights` has shape `(n_q, n_k)`. Row $i$ tells how much query $i$ uses each key.
- `output` has shape `(n_q, d_v)`.
- `mask` is optional: a boolean array of shape `(n_q, n_k)`. `False` means "this query must not use this key". Give those places a score of `-np.inf` before the softmax.

```python
def attention(Q, K, V, mask=None):
    """Scaled dot-product attention. Returns (output, weights)."""
    Q, K, V = (np.asarray(a, dtype=float) for a in (Q, K, V))
    # TODO
    raise NotImplementedError("Write attention(Q, K, V, mask)")
```

```check
{
  "question": "Stuck on `attention`? Write the shape next to each line.",
  "hint": "scores = Q @ K.T has shape (n_q, n_k). Divide by sqrt(d_k), where d_k = Q.shape[-1].",
  "answer": "`scores = Q @ K.T / np.sqrt(Q.shape[-1])`; if mask is not None: `scores = np.where(mask, scores, -np.inf)`; `weights = softmax(scores, axis=-1)`; `return weights @ V, weights`."
}
```

```python
rng = np.random.default_rng(0)
Q = rng.standard_normal((3, 4)); K = rng.standard_normal((5, 4)); V = rng.standard_normal((5, 2))
out, w = attention(Q, K, V)
lab.check("output shape is (n_q, d_v)", out.shape, (3, 2))
lab.check("weights shape is (n_q, n_k)", w.shape, (3, 5))
lab.check("each weight row adds up to 1", w.sum(axis=1), np.ones(3))
same_keys = np.ones((5, 4))
out_same, _ = attention(Q, same_keys, V)
lab.check("equal keys give the plain mean of V", out_same, np.tile(V.mean(axis=0), (3, 1)))
lab.check("a mask of all False except one key picks that value",
          attention(Q, K, V, mask=np.eye(3, 5, k=2, dtype=bool))[0], V[2:5])
```

## 4. The causal mask

A decoder writes one token at a time, so token $i$ must not look at tokens after it. Write `causal_mask(n)`: a boolean `(n, n)` array that is `True` where key $j \le$ query $i$.

```python
def causal_mask(n):
    """Boolean (n, n) array: True where position j <= i."""
    # TODO
    raise NotImplementedError("Write causal_mask(n)")


lab.check("causal_mask(3)", causal_mask(3), np.array([[True, False, False], [True, True, False], [True, True, True]]))
_, w = attention(Q[:3], K[:3], V[:3], mask=causal_mask(3))
lab.check("no weight on future tokens", np.triu(w, k=1), np.zeros((3, 3)))
lab.check("the first token can only look at itself", w[0], np.array([1.0, 0.0, 0.0]))
```

## 5. Look at the weights

This cell uses your functions. Change the controls and watch the heat map.

```python
tokens = ["the", "cat", "sat", "down"]
seed = 3          # @param {type:"slider", min:0, max:20, step:1}
d_k = 8           # @param {type:"slider", min:1, max:64, step:1}
causal = False    # @param {type:"boolean"}
scale_scores = 1.0  # @param {type:"slider", min:0.1, max:10, step:0.1, label:"multiply the embeddings by"}

r = np.random.default_rng(seed)
X = r.standard_normal((len(tokens), d_k)) * scale_scores
W_q, W_k, W_v = (r.standard_normal((d_k, d_k)) / np.sqrt(d_k) for _ in range(3))
out, w = attention(X @ W_q, X @ W_k, X @ W_v, mask=causal_mask(len(tokens)) if causal else None)

fig, ax = plt.subplots(figsize=(4.5, 4))
im = ax.imshow(w, cmap="Blues", vmin=0, vmax=1)
ax.set_xticks(range(len(tokens)), tokens); ax.set_yticks(range(len(tokens)), tokens)
ax.set_xlabel("key (what is looked at)"); ax.set_ylabel("query (who looks)")
for i in range(len(tokens)):
    for j in range(len(tokens)):
        ax.text(j, i, f"{w[i, j]:.2f}", ha="center", va="center", color="white" if w[i, j] > 0.5 else "black")
fig.colorbar(im, ax=ax, fraction=0.046)
ax.set_title("attention weights")
lab.inspect(out, "output")
```

## Observations

1. What happens to the weights when you multiply the embeddings by 10? Why?
2. Why do we divide by $\sqrt{d_k}$ and not by $d_k$?
3. In your own words: what does one row of the weights matrix mean?
