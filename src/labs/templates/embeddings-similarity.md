---
title: "Embeddings and similarity search"
summary: "Compare vectors with dot product, cosine and distance, then build a brute-force nearest-neighbour search."
collection: "AI"
tags: [embeddings, vector-search, rag]
packages: [numpy, matplotlib]
level: "Beginner"
order: 30
objectives:
  - "Explain the difference between dot product, cosine similarity and Euclidean distance."
  - "Write cosine similarity and handle the zero vector."
  - "Show that for unit vectors, squared distance = 2 − 2 · cosine."
  - "Write a top-k search and explain its cost."
---
# Embeddings and similarity search

An **embedding** is a list of numbers that stands for the meaning of a text, an image or a sound. Texts with similar meaning get vectors that point in similar directions. A search engine then finds the stored vectors that are nearest to the vector of the question.

This lab uses small vectors that you can see. The same code works for 1,536 dimensions.

## 1. Three ways to compare two vectors

Move the controls. Vector **a** stays fixed. Vector **b** turns and gets longer or shorter.

```python
import numpy as np
import matplotlib.pyplot as plt

angle_deg = 40.0  # @param {type:"slider", min:0, max:180, step:5, label:"angle between a and b (degrees)"}
length_b = 1.0    # @param {type:"slider", min:0.1, max:3, step:0.1, label:"length of b"}

a = np.array([1.0, 0.0])
theta = np.radians(angle_deg)
b = length_b * np.array([np.cos(theta), np.sin(theta)])

dot = float(a @ b)
cos = dot / (np.linalg.norm(a) * np.linalg.norm(b))
dist = float(np.linalg.norm(a - b))

fig, ax = plt.subplots(figsize=(4.5, 4.5))
for v, name, color in [(a, "a", "#C81D25"), (b, "b", "#1E6091")]:
    ax.annotate("", xy=v, xytext=(0, 0), arrowprops=dict(arrowstyle="->", color=color, lw=2))
    ax.text(*(v * 1.08), name, color=color, fontsize=13)
ax.set(xlim=(-3.2, 3.2), ylim=(-0.5, 3.2), aspect="equal", title="two vectors")
ax.grid(alpha=0.3)
print(f"dot product   a · b = {dot:7.3f}   (changes with length)")
print(f"cosine        cos   = {cos:7.3f}   (direction only, -1 .. 1)")
print(f"distance  |a - b|   = {dist:7.3f}   (0 means the same point)")
```

```check
{
  "question": "Keep the angle at 40 degrees and change only the length of b. Which of the three numbers stays the same? Why?",
  "hint": "Cosine divides by both lengths.",
  "answer": "The cosine stays the same: it measures only the direction. The dot product grows with the length, and the distance changes too. That is why cosine is the usual score when vector lengths do not carry meaning."
}
```

## 2. Write cosine similarity

```python
def cosine_similarity(a, b):
    """Cosine of the angle between vectors a and b. Raise ValueError for a zero vector."""
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    # TODO
    raise NotImplementedError("Write cosine_similarity(a, b)")
```

```python
import lab

lab.check("same direction", cosine_similarity([1, 2, 3], [2, 4, 6]), 1.0)
lab.check("opposite direction", cosine_similarity([1, 0], [-3, 0]), -1.0)
lab.check("at a right angle", cosine_similarity([1, 0], [0, 5]), 0.0, tol=1e-12)
try:
    cosine_similarity([0, 0], [1, 1])
    lab.check("a zero vector raises ValueError", "no error", "ValueError")
except ValueError:
    lab.check("a zero vector raises ValueError", True)
```

## 3. Distance and cosine are linked

For **unit vectors** (length 1): $\lVert a - b \rVert^2 = 2 - 2\cos(a, b)$. So for normalised embeddings, the nearest by distance is also the most similar by cosine. Check it on random vectors with your function.

```python
rng = np.random.default_rng(7)
u = rng.standard_normal(64); u /= np.linalg.norm(u)
v = rng.standard_normal(64); v /= np.linalg.norm(v)
lab.check("|u - v|^2 = 2 - 2 cos(u, v)", float(np.sum((u - v) ** 2)), 2 - 2 * cosine_similarity(u, v), tol=1e-12)
```

## 4. Top-k search

`top_k(query, vectors, k)` returns the indices of the `k` rows of `vectors` with the highest cosine similarity to `query`, best first. Use NumPy on the whole matrix at once (no Python loop over rows).

```python
def top_k(query, vectors, k):
    """Indices of the k rows most similar to query (cosine), best first."""
    query = np.asarray(query, dtype=float)
    vectors = np.asarray(vectors, dtype=float)
    # TODO
    raise NotImplementedError("Write top_k(query, vectors, k)")
```

```check
{
  "question": "Stuck on `top_k`?",
  "hint": "Normalise every row and the query. Then one matrix product gives all the cosines.",
  "answer": "`unit = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)`; `q = query / np.linalg.norm(query)`; `scores = unit @ q`; `return np.argsort(-scores)[:k]`."
}
```

```python
M = rng.standard_normal((1000, 32))
q = M[42] + 0.01 * rng.standard_normal(32)
lab.check("finds the near copy first", int(top_k(q, M, 1)[0]), 42)
lab.check("returns k results", len(top_k(q, M, 5)), 5)
brute = np.argsort([-cosine_similarity(q, row) for row in M])[:5]
lab.check("same answer as a slow loop", list(top_k(q, M, 5)), list(brute))
```

## 5. Search sentences

A tiny "embedding": count the words of each sentence (a bag of words). Real embedding models capture meaning far better, but the search code is the same. Change the query.

```python
query = "how does attention weigh tokens"  # @param {type:"string"}

sentences = [
    "attention weighs every token by how well its key matches the query",
    "the fft turns samples into frequencies",
    "a window reduces spectral leakage in the fft",
    "the kv cache stores keys and values of earlier tokens",
    "cosine similarity compares the direction of two vectors",
    "a vector database finds the nearest embeddings quickly",
    "gradient descent moves the weights against the gradient",
]
vocab = sorted({w for s in sentences for w in s.split()})


def embed(text):
    words = text.lower().split()
    return np.array([words.count(w) for w in vocab], dtype=float)


vectors = np.array([embed(s) for s in sentences])
qv = embed(query)
if not qv.any():
    print("None of the query words is in the vocabulary. Try other words.")
else:
    for rank, i in enumerate(top_k(qv, vectors, 3), start=1):
        print(f"{rank}. {cosine_similarity(qv, vectors[i]):.3f}  {sentences[i]}")
```

## Observations

1. Which query words did the bag of words miss, that a real embedding model would understand?
2. Your `top_k` looks at every vector. How many multiplications for 1 million vectors of 1,536 numbers? Why do vector databases use approximate search (for example HNSW)?
