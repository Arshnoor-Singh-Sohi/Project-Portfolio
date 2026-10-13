---
title: "L6: Embeddings and similarity"
order: 6
summary: "An embedding turns a text into a vector, and retrieval ranks chunks by how close their vectors are to the query vector. Dot product, cosine and distance, with the exact identity that makes them agree on unit vectors. How models learn similarity, how many dimensions to keep, and how to choose and change a model."
status: not-started
tags: [write-and-rag, embeddings, cosine-similarity, vectors, matryoshka]
---

## 1. The question this idea answers

The retriever compares a question with 10,000 chunks and says that chunk 4,211 is the closest. What does "closest" mean, in numbers? The handbook mentions cosine similarity, Euclidean distance, dot product and "distance scores". Do they give different answers? And which embedding model should produce the vectors in the first place?

## 2. Mental model

> [!analogy] Arrows in a space of meanings
> Picture every text as an arrow from a common origin. Texts with similar meaning point in similar directions. The **cosine** of the angle between two arrows measures how similar they are: 1 for the same direction, 0 for a right angle.
>
> **Where it stops working:** the space has hundreds or thousands of directions, not three. No single direction means a human topic such as "sports". The space comes from training. So "similar" means "similar in the way the training data paired texts", for example a question with the passage that answers it. It is not logical equivalence. "Returns are allowed after 30 days" and "Returns are not allowed after 30 days" share almost all their words, and they can get close vectors.

## 3. Terms

| Term | Plain meaning |
|---|---|
| vector dimension | The number of values in an embedding, for example 384 or 1,536. Every embedding of one model has the same dimension. |
| dot product | The sum of the products of matching values of two vectors. It depends on both the angle between the vectors and their lengths. |
| L2 norm | The length of a vector: the square root of the sum of its squared values. |
| unit vector | A vector with length 1. |
| normalization | Dividing a vector by its length, so that it becomes a unit vector with the same direction. |
| cosine similarity | The dot product of two vectors divided by the product of their lengths. It measures only the angle, from −1 to 1. |
| cosine distance | One minus the cosine similarity. Chroma uses it when a collection's space is "cosine". |
| Euclidean distance (L2 distance) | The straight-line distance between the ends of two vectors. |
| squared L2 distance | The Euclidean distance squared. It is Chroma's default distance. |
| bi-encoder | An embedding model that encodes each text alone, so that document vectors can be computed once and stored. |
| contrastive training | Training that makes the vectors of matching pairs more similar, and the vectors of non-matching texts less similar. |
| Matryoshka representation learning (MRL) | Training an embedding model so that the first part of each vector is itself a usable, shorter embedding. |
| MTEB | The Massive Text Embedding Benchmark: a public set of tasks and a leaderboard for comparing embedding models. |

## 4. Method and math

### 4.1 From text to vector

An embedding model has four steps:

1. Its tokenizer turns the text into tokens. Each model has its own tokenizer and its own input limit (lesson [L5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking)).
2. A transformer computes one vector for each token, in context.
3. A pooling step combines the token vectors into one vector. Averaging them (mean pooling) is common.
4. Some models normalize the result to length 1.

The output always has the same length, whatever the length of the input. Common sizes:

| Model | Default dimension (checked on 2026-10-12) |
|---|---|
| `sentence-transformers/all-MiniLM-L6-v2` | 384 |
| `intfloat/e5-large-v2` | 1,024 |
| Voyage 4 models | 1,024 (256, 512 and 2,048 also available) |
| OpenAI `text-embedding-3-small` | 1,536 |
| Cohere `embed-v4.0` | 1,536 (256, 512 and 1,024 also available) |
| OpenAI `text-embedding-3-large` | 3,072 |
| `Qwen/Qwen3-Embedding-8B` | 4,096 |

> [!note] Source check: "typically 768 to 3072 floats"
> **Corrected.** The handbook FAQ (Session 3, Q3) says that an embedding is "typically 768 to 3072 floats". The workshop's own default model, all-MiniLM-L6-v2, has 384. Common sizes range from 384 to 4,096 (Qwen3-Embedding-8B), and many current models let you shorten the vector (section 4.6). Source: the model cards and provider docs, checked on 2026-10-12.

### 4.2 Dot product, length and cosine

For two vectors $\mathbf{a}$ and $\mathbf{b}$ with $d$ values each:

$$
\mathbf{a} \cdot \mathbf{b} = \sum_{i=1}^{d} a_i\, b_i, \qquad \lVert \mathbf{a} \rVert = \sqrt{\mathbf{a} \cdot \mathbf{a}}, \qquad \cos(\mathbf{a}, \mathbf{b}) = \frac{\mathbf{a} \cdot \mathbf{b}}{\lVert \mathbf{a} \rVert\, \lVert \mathbf{b} \rVert}
$$

The symbols mean:

- $a_i$ and $b_i$ are the values at position $i$.
- $d$ is the vector dimension.
- $\mathbf{a} \cdot \mathbf{b}$ is the dot product.
- $\lVert \mathbf{a} \rVert$ is the L2 norm, the length of $\mathbf{a}$.
- $\cos(\mathbf{a}, \mathbf{b})$ is the cosine similarity, from $-1$ (opposite directions) through 0 (a right angle) to 1 (the same direction).

> [!example] Worked example: three vectors in three dimensions
> Take $\mathbf{a} = (1, 2, 2)$, $\mathbf{b} = (2, 1, 2)$ and $\mathbf{c} = (2, -2, 1)$.
>
> - Lengths: $\lVert \mathbf{a} \rVert = \sqrt{1 + 4 + 4} = 3$. In the same way, $\lVert \mathbf{b} \rVert = 3$ and $\lVert \mathbf{c} \rVert = 3$.
> - $\mathbf{a} \cdot \mathbf{b} = 1 \cdot 2 + 2 \cdot 1 + 2 \cdot 2 = 8$, so $\cos(\mathbf{a}, \mathbf{b}) = 8 / (3 \times 3) = 0.889$.
> - $\mathbf{a} \cdot \mathbf{c} = 2 - 4 + 2 = 0$, so $\cos(\mathbf{a}, \mathbf{c}) = 0$.
>
> If $\mathbf{a}$ is a query, $\mathbf{b}$ is a close match, and $\mathbf{c}$ is unrelated.

### 4.3 Distance, and why it agrees with cosine on unit vectors

The Euclidean distance compares the ends of the arrows, not the angle. Expand its square:

$$
\lVert \mathbf{a} - \mathbf{b} \rVert^2 = (\mathbf{a} - \mathbf{b}) \cdot (\mathbf{a} - \mathbf{b}) = \lVert \mathbf{a} \rVert^2 + \lVert \mathbf{b} \rVert^2 - 2\, \mathbf{a} \cdot \mathbf{b}
$$

For unit vectors, $\lVert \mathbf{a} \rVert = \lVert \mathbf{b} \rVert = 1$ and $\mathbf{a} \cdot \mathbf{b} = \cos(\mathbf{a}, \mathbf{b})$. So:

$$
\lVert \mathbf{a} - \mathbf{b} \rVert^2 = 2 - 2\cos(\mathbf{a}, \mathbf{b})
$$

The squared distance falls when the cosine rises. So for unit vectors, cosine similarity, dot product and L2 distance always give **the same ranking**. The FAISS docs state the same identity for normalized vectors: "$\| x - y \|^2 = 2 - 2 \times \langle x, y \rangle$".

> [!example] Worked example: a numeric check
> Normalize $\mathbf{a}$ and $\mathbf{b}$ from section 4.2: $\hat{\mathbf{a}} = (1/3, 2/3, 2/3)$ and $\hat{\mathbf{b}} = (2/3, 1/3, 2/3)$.
>
> - Direct: $\hat{\mathbf{a}} - \hat{\mathbf{b}} = (-1/3, 1/3, 0)$, so $\lVert \hat{\mathbf{a}} - \hat{\mathbf{b}} \rVert^2 = 1/9 + 1/9 + 0 = 2/9 \approx 0.222$.
> - Identity: $2 - 2 \times 8/9 = 2/9 \approx 0.222$.
>
> A Chroma 1.5.9 collection with the default space returned the distance 0.2222 for this pair (checked on 2026-10-12). A collection with `"space": "cosine"` returned $1 - 8/9 = 0.1111$.

Chroma offers three distance functions. All three give "lower is closer":

| Chroma space | Distance $D$ | For unit vectors |
|---|---|---|
| `l2` (the default) | $\sum_i (a_i - b_i)^2$, squared L2 | $2 - 2\cos$, from 0 to 4 |
| `cosine` | $1 - \cos(\mathbf{a}, \mathbf{b})$ | $1 - \cos$, from 0 to 2 |
| `ip` | $1 - \mathbf{a} \cdot \mathbf{b}$ | $1 - \cos$, from 0 to 2 |

OpenAI says: "OpenAI API embedding outputs are L2-normalized to length 1 by default". For such vectors, the choice of metric changes the numbers but not the ranking. FAISS uses this fact: to search by cosine, normalize the vectors and use its inner-product metric.

### 4.4 When the measures disagree

The measures disagree when vectors have different lengths.

> [!example] Worked example: one query, two chunks, two rankings
> Query $\mathbf{q} = (1, 2, 2)$. Chunk 1 is $\mathbf{d}_1 = (2, 1, 2)$ with length 3. Chunk 2 is $\mathbf{d}_2 = (4, 0, 4)$ with length $\sqrt{32} \approx 5.66$.
>
> | Measure | Chunk 1 | Chunk 2 | Winner |
> |---|---|---|---|
> | Dot product | 8 | 12 | Chunk 2 |
> | Cosine | $8/9 = 0.889$ | $12/(3 \times 5.66) = 0.707$ | Chunk 1 |
> | Squared L2 | $1 + 1 + 0 = 2$ | $9 + 4 + 4 = 17$ | Chunk 1 |
>
> The dot product prefers chunk 2 only because chunk 2 is a longer vector. Its direction is further from the query.

So the rule is: **know whether your model's vectors are normalized**. Compute the length of a few hundred vectors. If they are all 1, any of the three metrics is fine. If they vary, use the metric that the model card recommends. If the card says cosine, either use cosine or normalize every vector and use the dot product.

> [!note] Source check: why cosine is "preferred"
> **Corrected.** The handbook FAQ (Session 3, Q6) says that cosine is preferred because "embedding models often produce vectors of varying magnitudes depending on text length". Whether length carries information depends on the model. OpenAI's embeddings all have length 1. For unit vectors, $\lVert \mathbf{a} - \mathbf{b} \rVert^2 = 2 - 2\cos$, so L2, dot product and cosine give identical rankings. The FAQ's last sentence is the correct part: for normalized embeddings the rankings are the same. Sources: OpenAI embeddings FAQ and FAISS docs, checked on 2026-10-12.

> [!note] Source check: "a distance of 0.9 means poor retrieval"
> **Corrected.** The handbook (Session 3, §10.1.3, Tip) says: "If the top chunk has a distance of 0.9, the retrieval is likely poor." It does not name the metric. Chroma's default distance is squared L2. For unit vectors, $D = 0.9$ means $\cos = 1 - 0.9/2 = 0.55$. In a cosine collection, $D = 0.9$ means $\cos = 0.1$. Whether 0.55 is "poor" depends on the model, because each model spreads its scores differently. Calibrate thresholds on your own evaluation set (lesson [L7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search)). Source: Chroma docs, checked on 2026-10-12.

### 4.5 How an embedding model learns similarity

**Bi-encoders.** Reimers and Gurevych introduced Sentence-BERT (EMNLP-IJCNLP 2019, arXiv 1908.10084). It uses "siamese and triplet network structures to derive semantically meaningful sentence embeddings that can be compared using cosine-similarity". The model encodes each text alone. So document vectors can be computed once, stored and searched.

The alternative reads both texts together. That is more accurate, but it needs one model run for every pair. For 10,000 sentences there are $10{,}000 \times 9{,}999 / 2 = 49{,}995{,}000$ pairs. The paper reports that finding the most similar pair falls "from 65 hours with BERT / RoBERTa to about 5 seconds with SBERT". Part 5 uses the slower pair model, the cross-encoder, to rerank a short list.

**Contrastive training.** A bi-encoder learns from pairs that should match, for example a question and the passage that answers it. Training makes the two vectors of a pair more similar. It makes the question's vector less similar to other passages, for example the other passages in the same training batch. Passages that look relevant but do not answer the question are especially useful negatives.

This explains what "similar" means for a given model: similar in the way its training pairs were similar. A model trained on question-and-answer pairs puts a question near its answer, even when they share few words.

**Asymmetric inputs.** Some models expect a marker that says whether a text is a query or a document. `intfloat/e5-large-v2` needs `"query: "` before queries and `"passage: "` before documents. A missing marker gives no error, only worse results.

You can also fine-tune an embedding model on your own pairs. The handbook FAQ (Session 3, Q32) gives a gain of "5–15%" for this, without a source. Measure it on your evaluation set before you pay for it.

### 4.6 Dimensions, storage and Matryoshka truncation

Each value of a vector is usually a 32-bit float: 4 bytes.

| Dimension | Bytes per vector | 1 million vectors |
|---|---|---|
| 384 | 1,536 | 1.5 GB |
| 1,024 | 4,096 | 4.1 GB |
| 1,536 | 6,144 | 6.1 GB |
| 3,072 | 12,288 | 12.3 GB |

The index adds more memory on top of the raw vectors (lesson 4.7). More dimensions also make each comparison slower.

**Matryoshka representation learning** (Kusupati et al., NeurIPS 2022, arXiv 2205.13147) changes the training. The first $m$ values of each vector become a good embedding by themselves. The paper says that MRL "learns coarse-to-fine representations that are at least as accurate and rich" as smaller embeddings trained on their own. OpenAI's `text-embedding-3` models support this through the `dimensions` parameter, which accepts any value up to the full size. OpenAI reports that `text-embedding-3-large` shortened to 256 dimensions still beats the older `text-embedding-ada-002` at 1,536 dimensions on MTEB.

If you shorten a vector yourself, **normalize it again**. The first $m$ values of a unit vector have a length below 1.

> [!example] Worked example: truncate, then normalize
> Two unit vectors: $\mathbf{v} = (0.6, 0.48, 0.64)$ and $\mathbf{w} = (0.48, 0.6, 0.64)$. Their full cosine is $0.288 + 0.288 + 0.4096 = 0.9856$.
>
> Keep the first 2 values: $\mathbf{v}' = (0.6, 0.48)$ and $\mathbf{w}' = (0.48, 0.6)$.
>
> - Each has length $\sqrt{0.36 + 0.2304} = \sqrt{0.5904} \approx 0.768$.
> - The dot product is $0.288 + 0.288 = 0.576$.
> - The cosine is $0.576 / 0.5904 \approx 0.976$.
>
> An index that uses the dot product on these vectors reports 0.576, as if the texts were far apart. After normalization it reports 0.976, close to the full value. Different vectors lose different amounts of length when you cut them, so without normalization the ranking can change too.

> [!note] Source check: Matryoshka sizes and quality
> **Corrected.** The handbook FAQ (Session 3, Q40) says that you "can request 256, 512, 1024, or the full 1536/3072 dimensions". The `dimensions` parameter accepts any value up to the maximum. The FAQ also says that 512-dimensional `text-embedding-3-small` vectors "retain roughly 96% of the quality". OpenAI publishes no such number. Its published result is that 3-large at 256 dimensions beats ada-002 at 1,536 on MTEB. The FAQ's storage figure is right: 512 of 1,536 dimensions is one third. Source: OpenAI embedding docs and announcement, checked on 2026-10-12.

### 4.7 Choosing a model

| Criterion | Question to ask |
|---|---|
| Quality on your data | Does it find the right passages for your questions? Only your evaluation set answers this. |
| Input limit | Do your chunks fit, counted with its tokenizer (lesson 4.5)? |
| Dimension | How much memory and storage will the index need? Can you shorten the vectors? |
| Price | What does it cost per million tokens, for the first index and for every re-index? |
| Privacy | May the text leave your network? If not, you need a model that runs on your own hardware. |
| Latency | An API call adds a network round trip to every query. A local model needs hardware. |
| Languages | Does it support the languages of your documents and your users? |

Prices and limits, checked on 2026-10-12:

| Model | USD / MTok | Dimension | Input limit |
|---|---|---|---|
| OpenAI `text-embedding-3-small` | 0.02 | 1,536 | 8,192 |
| OpenAI `text-embedding-3-large` | 0.13 | 3,072 | 8,192 |
| `voyage-4-lite` | 0.02 | 1,024 | 32K |
| `voyage-4` | 0.06 | 1,024 | 32K |
| `voyage-4-large` | 0.12 | 1,024 | 32K |
| Open-weight models, for example `all-MiniLM-L6-v2`, `e5-large-v2`, `Qwen3-Embedding-8B` | No API fee. You pay for the hardware. | 384 to 4,096 | 256 for MiniLM, 512 for E5 |

Voyage gives the first 200 million tokens free. For multilingual text, Cohere says its `embed-multilingual-v3.0` "supports over 100 languages". OpenAI gives no language count. It reports MIRACL multilingual scores of 44.0 for 3-small and 54.9 for 3-large.

**MTEB as a shortlist, not an answer.** MMTEB, the current multilingual version, covers "over 500 quality-controlled evaluation tasks across 250+ languages" (Enevoldsen et al., arXiv 2502.13595). The model card of the open-weight `Qwen3-Embedding-8B` gives it 70.58 on MTEB multilingual, first place on 5 June 2025. The same table gives `text-embedding-3-large` 58.93. Use the leaderboard with three caveats:

1. The ranking changes from month to month.
2. The average covers many tasks that differ from yours.
3. The largest models are slow and need large GPUs.

Pick three candidates from the leaderboard and your constraints. Then test them on your own questions.

> [!note] Source check: the handbook's model table and MTEB claims
> **Corrected.** The handbook (Session 3, §6.2) lists `voyage-3`. Voyage now lists it under "Older models". The current family is `voyage-4-lite`, `voyage-4` and `voyage-4-large`. The handbook FAQ (Session 3, Q20 and Q34) recommends "Cohere embed-v3". Cohere's docs now list `embed-v4.0`, and also `embed-v5.0-pro` and `embed-v5.0-fast`. The FAQ (Q36) says that top open-source models are "within 1–3% of OpenAI on the MTEB leaderboard". Open models now score higher: 70.58 for Qwen3-Embedding-8B against 58.93 for text-embedding-3-large on MTEB multilingual (mid-2025). The handbook (§6.2) calls text-embedding-3-small "the best cost/quality balance". That is a judgment: voyage-4-lite has the same price. Sources: Voyage and Cohere docs, Qwen3-Embedding-8B model card, checked on 2026-10-12.

### 4.8 Cost of embedding, and the cost of changing the model

Embedding is cheap in money. OpenAI estimates about 62,500 pages per dollar for `text-embedding-3-small`, at about 800 tokens per page.

> [!example] Worked example: a 10,000-page knowledge base
> At 800 tokens per page, 10,000 pages are 8,000,000 tokens.
>
> - `text-embedding-3-small`: $8 \times 0.02 = $ USD 0.16.
> - `text-embedding-3-large`: $8 \times 0.13 = $ USD 1.04.
>
> At 500 to 1,000 tokens per page, the small model costs USD 0.10 to 0.20. Overlap multiplies these numbers by $1/(1-o)$ (lesson 4.5).

> [!note] Source check: "a few dollars" for 10,000 pages
> **Corrected.** The handbook FAQ (Session 3, Q9) says that embedding "a 10,000-page knowledge base might cost a few dollars total" with text-embedding-3-small. At OpenAI's own estimate of 800 tokens per page, it costs about USD 0.16, which is about 20 times less. Source: OpenAI embeddings guide and prices, checked on 2026-10-12.

A change of model is expensive in other ways. Vectors from two models live in different coordinate systems (lesson [L4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline)), so the whole corpus must be embedded again. The handbook FAQ (Session 3, Q20) gives the right warning: "Switching embedding models later requires re-embedding your entire corpus". The real costs are:

1. Time and rate limits to re-embed millions of chunks.
2. A second index during the migration, because queries must keep working.
3. An evaluation that proves the new model is better on your questions.

The handbook FAQ (Session 3, Q30) describes "shadow mode". Build the new index next to the old one and run queries on both. Compare the results offline, and switch only when the new index wins. Store the model name and version with every index, so that no query ever mixes the two.

### 4.9 Production view

| Concern | What this lesson means for it |
|---|---|
| Correctness | Check whether the vectors are normalized. Use the metric that the model was trained for. Renormalize after truncation. |
| Retrieval quality | Choose the model on your own evaluation set. Use the model's query and document prefixes. |
| Cost | Embedding a corpus is cheap. Storage and memory grow with the dimension. Shortened vectors can cut both. |
| Latency | An API model adds a network call to each query. A local model needs a CPU or GPU budget. |
| Privacy | Text sent to an embedding API leaves your network. Sensitive corpora may need a self-hosted model. |
| Change management | A model change means a full re-embed and a second index. Version every index with its model. |

## 5. Graphs

```plot
{
  "title": "Distance against cosine similarity for unit vectors: squared L2 = 2 − 2cos (red), cosine distance = 1 − cos (blue)",
  "xAxis": { "label": "cosine similarity", "domain": [-1, 1] },
  "yAxis": { "label": "distance", "domain": [0, 4] },
  "disableZoom": true,
  "data": [
    { "fn": "2-2*x", "color": "#C81D25" },
    { "fn": "1-x", "color": "#1E6091" }
  ]
}
```

Both lines fall when the cosine rises, so both give the same ranking as the cosine. Use the red line to read Chroma's default distance: 0.9 on the red line is a cosine of 0.55.

## 6. Code

These exercises go in `notebooks/04-write-and-rag.ipynb`. Exercises 6.1 to 6.3 run locally and cost nothing.

**Exercise 6.1: similarity from first principles.**

1. With NumPy only, write `dot`, `norm`, `normalize`, `cosine`, `l2` and `sq_l2`.
2. Reproduce every number in the worked examples of sections 4.2, 4.3 and 4.4.
3. Draw 1,000 random pairs of unit vectors with 384 dimensions. Check the identity of section 4.3 on each pair.

Acceptance tests:

- The largest error of the identity is below 1e-9.
- `normalize` of a zero vector raises a `ValueError`.

**Exercise 6.2: a real model.**

1. Load `all-MiniLM-L6-v2` with `sentence-transformers`.
2. Embed eight sentences: two pairs with the same meaning and different words, one pair that differs only by "not", and two unrelated sentences.
3. Print the shape, the length of each vector and the cosine matrix.
4. Make a text longer than 256 word pieces. Embed it alone, and again with one more sentence at its end.

Acceptance tests:

- The shape is (8, 384).
- A sentence in the notebook states whether the vectors have length 1.
- The two long texts have a cosine above 0.999, which shows truncation.
- A sentence in the notebook reports the cosine of the "not" pair.

**Exercise 6.3: truncation and normalization.**

1. Embed 1,000 chunks and 20 questions with the model of Exercise 6.2.
2. Keep the first 128 values of each vector.
3. Rank by dot product without normalization, and again after normalization.
4. For each query, compare the top 10 with the top 10 of the full vectors.

Acceptance test: a table with the mean overlap of the top 10 for both methods. Note that MiniLM was not trained with MRL, so the loss is larger than for an MRL model.

**Exercise 6.4: a wrong space.**

1. Index the chunks of Exercise 4.1 with their correct vectors.
2. Answer 20 labeled questions with correct query vectors.
3. Answer them again with the values of each query vector in a shuffled order. This simulates a different model with the same dimension.

Acceptance test: the hit rate in the top 5 falls to about the rate of a random pick.

**Exercise 6.5 (optional, costs money): shortened OpenAI vectors.** Embed your corpus with `text-embedding-3-small` at 256, 512 and 1,536 dimensions. Measure the hit rate in the top 5 on your questions. Estimate the cost first.

Acceptance test: a table of the dimension, the hit rate in the top 5 and the bytes per vector.

## 7. Common mistakes

1. **"Cosine is always better than distance."** For unit vectors, cosine, dot product and L2 distance give the same ranking. The choice matters only when lengths vary.
2. **"A Chroma distance of 0.9 is bad."** It depends on the metric and the model. With the default squared L2 on unit vectors, 0.9 is a cosine of 0.55.
3. **"Truncated Matryoshka vectors can go straight into the index."** Normalize them again, or a dot-product index gives wrong scores.
4. **"Similar vectors mean the same meaning."** They mean similar in the way of the training pairs. A sentence and its negation can be close.
5. **"The top model on MTEB is the best model for us."** MTEB is an average over many tasks. Shortlist from it, then test on your own questions.
6. **"We can switch embedding models with a config change."** Every stored vector must be computed again, and the old and new vectors must never be compared.

## 8. One-minute explanation

An embedding model turns a text into a vector of fixed length, for example 384 or 1,536 numbers. It learns from pairs that should match, such as a question and its answer, so related texts get vectors that point in similar directions. Cosine similarity measures the angle between two vectors. The dot product also grows with their lengths, and the distance measures how far apart their ends are. For unit vectors, the squared distance equals two minus two times the cosine. So all three give the same ranking. Many models, including OpenAI's, return unit vectors. If you shorten a vector, normalize it again. Choose a model on your own questions, using MTEB only as a shortlist, and weigh price, privacy and the input limit. A new model means embedding the whole corpus again.

## 9. Check questions

```check
{
  "question": "Compute the cosine similarity of (3, 4, 0) and (4, 3, 0). Then compute the squared L2 distance of their unit vectors, directly and with the identity.",
  "hint": "Both vectors have length 5.",
  "answer": "Dot product 12 + 12 + 0 = 24, so cos = 24 / 25 = 0.96. Unit vectors: (0.6, 0.8, 0) and (0.8, 0.6, 0). Directly: (−0.2)² + 0.2² + 0 = 0.08. Identity: 2 − 2 × 0.96 = 0.08."
}
```

```check
{
  "question": "A Chroma collection with the default space returns a distance of 0.5 for the top chunk. The model returns unit vectors. What is the cosine similarity? What distance would a collection with space 'cosine' return for the same pair?",
  "answer": "The default is squared L2, so 0.5 = 2 − 2cos, which gives cos = 0.75. A cosine collection returns 1 − cos = 0.25."
}
```

```check
{
  "question": "In the example of section 4.4, the dot product ranks chunk 2 first and the cosine ranks chunk 1 first. Why? When is it safe to rank by dot product?",
  "answer": "Chunk 2 has a longer vector (length 5.66 against 3), and the dot product grows with length. Its direction is further from the query (cos 0.707 against 0.889). Ranking by dot product is safe when all vectors are normalized, because then the dot product equals the cosine, or when the model was trained for the dot product."
}
```

```check
{
  "question": "A team shortens 1,536-dimensional text-embedding-3-small vectors to 512 by cutting them themselves, and stores them in a dot-product index. What fraction of the storage do they save? What must they add?",
  "answer": "512 / 1,536 = 1/3, so they save two thirds of the vector storage. The first 512 values of a unit vector have a length below 1, so they must normalize each shortened vector again. Otherwise the dot product is not a cosine. They should also check the hit rate on their own questions, because the quality loss depends on the data."
}
```

```check
{
  "question": "The handbook FAQ says that cosine is preferred because vector magnitudes vary with text length. What is wrong with this reason?",
  "answer": "It depends on the model. OpenAI's embeddings, for example, all have length 1, so magnitudes do not vary. For unit vectors the squared L2 distance equals 2 − 2cos, so L2, dot product and cosine give the same ranking. The real rule is: check whether your vectors are normalized, and use the metric that the model was trained for."
}
```

```check
{
  "question": "What does it cost to embed a 10,000-page knowledge base with text-embedding-3-small at USD 0.02 / MTok, at 800 tokens per page? And with text-embedding-3-large at USD 0.13 / MTok?",
  "answer": "10,000 × 800 = 8,000,000 tokens. Small: 8 × 0.02 = USD 0.16. Large: 8 × 0.13 = USD 1.04. The handbook's 'a few dollars' is about 20 times too high for the small model."
}
```

## 10. Links

- Previous: [L5: Chunking](/notes/ai/context-engineering/04-write-and-rag/l5-chunking)
- Next: [L7: Vector search](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search)
- [L4: The RAG pipeline](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline): the same model for the index and the query
- [Part 5: Retrieval quality](/notes/ai/context-engineering/05-retrieval-quality): cross-encoders and evaluation
- [Glossary](/notes/ai/context-engineering/glossary)
