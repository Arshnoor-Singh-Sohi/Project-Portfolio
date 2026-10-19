---
title: "Retrieval for RAG: BM25 and rank fusion"
summary: "Write BM25 keyword scoring and reciprocal rank fusion, then compare keyword, vector and hybrid rankings on a small corpus."
collection: "AI"
tags: [rag, retrieval, bm25, hybrid-search]
packages: [numpy]
level: "Intermediate"
order: 50
objectives:
  - "Write BM25 and explain what IDF, k1 and b do."
  - "Write reciprocal rank fusion (RRF) and explain why it fuses ranks, not scores."
  - "Compare keyword, vector and hybrid rankings on the same questions."
---
# Retrieval for RAG: BM25 and rank fusion

A RAG system first **retrieves** a few chunks, then gives them to the model. If retrieval misses the right chunk, the model cannot answer well. Two common retrievers:

- **Keyword search (BM25)** finds exact words, names and codes well.
- **Vector search** finds similar meaning with different words.

**Hybrid search** runs both and fuses the two ranked lists. In this lab you write BM25 and the fusion step.

## 1. The corpus

```python
import math
import re
from collections import Counter

import numpy as np

docs = [
    "The FFT computes the discrete Fourier transform in N log N time.",
    "Spectral leakage spreads a peak into nearby FFT bins; a Hann window reduces it.",
    "Attention compares each query with every key and mixes the values.",
    "The KV cache stores the keys and values of earlier tokens, so decoding does not recompute them.",
    "PagedAttention stores the KV cache in fixed-size blocks, like virtual memory pages.",
    "BM25 ranks documents by term frequency, inverse document frequency and length.",
    "Reciprocal rank fusion adds 1 / (k + rank) from each ranked list.",
    "MCP servers expose tools, resources and prompts to a client over JSON-RPC.",
]


def tokenize(text):
    return re.findall(r"[a-z0-9]+", text.lower())


doc_tokens = [tokenize(d) for d in docs]
print(len(docs), "documents. Average length:", sum(map(len, doc_tokens)) / len(docs), "tokens.")
```

## 2. BM25

For a query with terms $t$ and a document $d$:

$$
\text{score}(d) = \sum_{t \in q} \text{IDF}(t) \cdot \frac{f(t, d)\,(k_1 + 1)}{f(t, d) + k_1 \left(1 - b + b \frac{|d|}{\text{avgdl}}\right)}
\qquad
\text{IDF}(t) = \ln\!\left(\frac{N - n_t + 0.5}{n_t + 0.5} + 1\right)
$$

- $f(t, d)$: how many times $t$ is in $d$. $|d|$: the length of $d$. avgdl: the average length.
- $N$: the number of documents. $n_t$: how many documents contain $t$.
- $k_1$ limits how much repeating a word helps. $b$ controls the length normalisation.

```python
def bm25_scores(query_tokens, doc_tokens, k1=1.5, b=0.75):
    """Return a list with one BM25 score for each document."""
    # TODO
    raise NotImplementedError("Write bm25_scores(query_tokens, doc_tokens, k1, b)")
```

```check
{
  "question": "Stuck on BM25? Build it in this order.",
  "hint": "Compute N and avgdl once. Then for each query term: n_t (documents that contain it) and its IDF. Then loop over the documents.",
  "answer": "For each document d: `tf = Counter(d)`; `score = 0`; for each term t of the query: `f = tf[t]`; `score += idf[t] * f * (k1 + 1) / (f + k1 * (1 - b + b * len(d) / avgdl))`. Append `score`."
}
```

```python
import lab

tiny = [["the", "cat", "sat"], ["the", "dog", "sat", "down"], ["a", "cat", "and", "a", "dog"]]
lab.check("scores on a tiny corpus", np.array(bm25_scores(["cat", "sat"], tiny)), np.array([1.05916, 0.47000, 0.42248]), tol=1e-4)
lab.check("b = 0 ignores length", np.array(bm25_scores(["dog"], tiny, k1=1.2, b=0.0)), np.array([0.0, 0.47000, 0.47000]), tol=1e-4)
lab.check("a word in no document scores 0", bm25_scores(["zebra"], tiny), [0.0, 0.0, 0.0])
```

## 3. Reciprocal rank fusion

The two retrievers give scores on different scales (BM25 can be 7.3, cosine is at most 1), so adding the scores is wrong. RRF uses only the **rank** (1 = best) of each document in each list:

$$
\text{RRF}(d) = \sum_{\text{lists}} \frac{1}{k + \text{rank}(d)} \qquad (k = 60 \text{ is usual})
$$

A document that is missing from a list gets nothing from that list.

```python
def rrf(rankings, k=60):
    """rankings: a list of ranked lists of document ids (best first).
    Return a list of (doc_id, score), best first."""
    # TODO
    raise NotImplementedError("Write rrf(rankings, k)")
```

```python
fused = rrf([["a", "b", "c"], ["c", "x", "a"]])
lab.check("rank 1 and rank 3 give 1/61 + 1/63", dict(fused)["a"], 1 / 61 + 1 / 63)
lab.check("worked example: 1/61 + 1/63 = 0.0323", round(1 / 61 + 1 / 63, 4), 0.0323)
lab.check("best first", fused[0][0], "a")
lab.check("a document in one list only", dict(fused)["x"], 1 / 62)
lab.check("every document appears once", sorted(d for d, _ in fused), ["a", "b", "c", "x"])
```

## 4. Compare the rankings

The "vector" retriever here is TF-IDF cosine, a stand-in for an embedding model (it is given, so you can focus on BM25 and RRF). Change the query and the BM25 settings.

```python
question = "how does the kv cache store keys"  # @param {type:"string"}
k1 = 1.5    # @param {type:"slider", min:0, max:3, step:0.1}
b = 0.75    # @param {type:"slider", min:0, max:1, step:0.05}
top = 3     # @param {type:"slider", min:1, max:8, step:1}

vocab = sorted({t for d in doc_tokens for t in d})
df = Counter(t for d in doc_tokens for t in set(d))
idf = np.array([math.log(len(docs) / df[t]) + 1 for t in vocab])


def tfidf(tokens):
    counts = Counter(tokens)
    v = np.array([counts[t] for t in vocab], dtype=float) * idf
    n = np.linalg.norm(v)
    return v / n if n else v


q = tokenize(question)
keyword = np.argsort(-np.array(bm25_scores(q, doc_tokens, k1, b)), kind="stable")
vector = np.argsort(-(np.array([tfidf(d) for d in doc_tokens]) @ tfidf(q)), kind="stable")
hybrid = [doc for doc, _ in rrf([list(keyword), list(vector)])]

for name, ranking in [("BM25", keyword), ("vector", vector), ("hybrid (RRF)", hybrid)]:
    print(f"\n{name}")
    for rank, i in enumerate(ranking[:top], start=1):
        print(f"  {rank}. [{i}] {docs[i]}")
```

## Observations

1. Find a question where BM25 and the vector ranking disagree. Which one is better, and why?
2. What does $b = 0$ change? Which documents move?
3. Why is RRF safer than adding a BM25 score and a cosine score?
