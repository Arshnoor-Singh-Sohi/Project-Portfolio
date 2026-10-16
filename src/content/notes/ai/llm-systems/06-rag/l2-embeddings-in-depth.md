---
title: "L2: Embeddings in depth"
order: 2
summary: "How an embedding model turns text into one vector: encoder, pooling and normalization, with every shape. How contrastive training with in-batch negatives and a temperature makes a question land near its answer, with the InfoNCE loss computed by hand. Bi-encoders and cross-encoders, storage, Matryoshka embeddings, prefixes, and how to choose a model."
status: not-started
tags: [rag, embeddings, contrastive-learning, infonce, matryoshka, bi-encoder]
---

## 1. The question this idea answers

Dense retrieval rests on one promise. The vector of the question "Can I return an opened laptop?" must be close to the vector of the chunk "Opened laptops: refund within 30 days". The two texts share almost no words. So what machine produces such vectors, and what training makes the promise true?

An interviewer will dig at every layer of this. What exactly goes in and comes out, with shapes? Why mean pooling and not the first token? What loss trains the model, and what does the temperature do? Why can the document vectors be computed in advance, and when is that a weakness? How many bytes does an index of 10 million vectors need? This lesson answers each question down to the formula and the code.

## 2. Mental model

> [!analogy] A map drawn from notes about neighbors
> A cartographer gets millions of notes such as "this question and this answer belong together". She must place every text as a point on a map. Her rule: put each pair close together, and put texts from different pairs far apart. After millions of notes, texts with the same meaning sit in the same neighborhood, even when their words differ.
>
> An embedding model is that cartographer, and a vector is a position on the map. Contrastive training is the rule "pull pairs together, push the others apart".
>
> **Where it stops working:** the map has hundreds or thousands of directions, not two, and no single direction means a human topic. The map also reflects only the notes it learned from. If the notes never paired "not allowed" against "allowed", the two sentences can sit side by side. Similar position means "similar in the way of the training pairs", not "logically equivalent".

## 3. Terms

| Term | Plain meaning |
|---|---|
| embedding | A fixed-length vector of numbers that represents a text. |
| embedding model | A neural network that maps a text to an embedding. Most are transformer encoders. |
| hidden state | The vector that a transformer layer outputs for one token position. The last layer gives a matrix $H$ of shape $[T, d]$. |
| bidirectional attention | Attention without a causal mask: each token can attend to every token, before and after it. Encoders such as BERT use it. |
| pooling | The step that turns the $T$ token vectors of $H$ into one vector. Common methods: the [CLS] token, the mean, the last token. |
| attention mask | A 0/1 vector that marks real tokens (1) and padding (0) in a batch. |
| L2 normalization | Dividing a vector by its length, so that its length becomes 1. |
| cosine similarity | The dot product of two vectors divided by the product of their lengths. For unit vectors it equals the dot product. |
| bi-encoder | A model that encodes the query and the document separately. Document vectors can be computed once and stored. |
| cross-encoder | A model that reads the query and one document together and outputs one relevance score. |
| contrastive learning | Training that pulls the vectors of matching pairs together and pushes non-matching vectors apart. |
| positive | The text that matches a query in a training pair. |
| negative | A text that does not match the query. |
| in-batch negatives | Using the positives of the other pairs in the same training batch as negatives. |
| hard negative | A negative that looks relevant but is not, for example a close BM25 match. |
| InfoNCE | The contrastive loss: cross-entropy over one positive and many negatives, with similarities divided by a temperature. |
| temperature $\tau$ | The number that divides the similarities before the softmax. A small $\tau$ makes the softmax sharp. |
| Matryoshka embedding | An embedding trained so that its first $m$ values are also a good, shorter embedding. |
| asymmetric model | A model that encodes queries and documents differently, often with a prefix such as "query: ". |
| MTEB | The Massive Text Embedding Benchmark and its leaderboard. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. From text to one vector

### 4.1 The pipeline and its shapes

An embedding model is a transformer with a different ending. A chat model ends with the LM head, which predicts the next token (lesson [From text to vectors and back](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors)). An embedding model ends with pooling and normalization, which output one vector for the whole text.

```mermaid
flowchart LR
    A["text"] --> B["tokenizer: T token IDs"]
    B --> C["embedding table lookup: [T, d]"]
    C --> D["L transformer layers: H of shape [T, d]"]
    D --> E["pooling: [d]"]
    E --> F["L2 normalize: e with length 1"]
    style A fill:#1E6091,color:#fff
    style D fill:#B8860B,color:#fff
```

For `sentence-transformers/all-MiniLM-L6-v2`, the model card states: 384 dimensions, mean pooling, L2 normalization in the example code, 22.7M parameters, and truncation after 256 word pieces. The base model name, MiniLM-L6-H384, encodes 6 layers and a hidden size of 384. So a 20-token sentence becomes $H$ of shape $[20, 384]$, then one vector of shape $[384]$.

A batch adds one dimension. A batch of $B$ texts, padded to the longest one with $T$ tokens, gives $H$ of shape $[B, T, d]$ and an attention mask of shape $[B, T]$. The output is $[B, d]$. Lesson [Tensors, shapes and batches](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) explains padding.

### 4.2 Bidirectional or causal attention decides the pooling

The choice of pooling follows from which tokens each position can see.

- **Encoders** such as BERT use bidirectional attention. No causal mask applies, so every position has seen the whole text after the first layer (compare lesson [Causal masking and generation](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation)). Any position, or the mean of all positions, can summarize the text.
- **Decoder-based** embedding models keep the causal mask of a chat model. Position $t$ has seen only tokens $1$ to $t$. Only the **last** token has seen everything. So these models use last-token pooling.

| Pooling | What it takes | Example model (from its model card) |
|---|---|---|
| [CLS] pooling | The hidden state of the first token, a special [CLS] token | `BAAI/bge-large-en-v1.5`: `model_output[0][:, 0]`, 1,024 dimensions |
| Mean pooling | The average of the hidden states of the real tokens | `all-MiniLM-L6-v2` (384 dimensions), E5 models ("average pooling") |
| Last-token pooling | The hidden state of the last real token | `Qwen/Qwen3-Embedding-8B`: a decoder, 4,096 dimensions, `last_token_pool` |

> [!example] Worked example: three poolings and the padding bug
> A text has 3 real tokens and one padding position. $d = 4$. The last-layer hidden states are:
>
> | Position | Hidden state | Mask |
> |---|---|---|
> | 1 ([CLS]) | $[1, 2, 0, 1]$ | 1 |
> | 2 | $[3, 0, 1, 1]$ | 1 |
> | 3 | $[2, 1, 2, 0]$ | 1 |
> | 4 (padding) | $[9, 9, 9, 9]$ | 0 |
>
> - **[CLS]:** $[1, 2, 0, 1]$. Its length is $\sqrt{1 + 4 + 0 + 1} = 2.4495$, so the unit vector is $[0.4082, 0.8165, 0, 0.4082]$.
> - **Mean of real tokens:** $([1,2,0,1] + [3,0,1,1] + [2,1,2,0]) / 3 = [6, 3, 3, 2] / 3 = [2, 1, 1, 0.6667]$. Length 2.5386. Unit vector $[0.7878, 0.3939, 0.3939, 0.2626]$.
> - **Last real token:** $[2, 1, 2, 0]$. Length 3. Unit vector $[0.6667, 0.3333, 0.6667, 0]$.
> - **Bug: mean of all 4 positions:** $[15, 12, 12, 11] / 4 = [3.75, 3, 3, 2.75]$. The padding values entered the average.
>
> The correct and the buggy mean have a cosine of 0.9595. That looks close, but the error depends on how much padding a text gets. The same sentence then gets different vectors in different batches.

```python
import numpy as np

H = np.array([[1., 2., 0., 1.],     # hidden state of token 1 ([CLS] in a BERT-style model)
              [3., 0., 1., 1.],     # token 2
              [2., 1., 2., 0.],     # token 3 (the last real token)
              [9., 9., 9., 9.]])    # padding position: garbage values
mask = np.array([1, 1, 1, 0])       # attention mask: 1 = real token, 0 = padding

cls_vec = H[0]
mean_vec = (H * mask[:, None]).sum(axis=0) / mask.sum()   # average real tokens only
last_vec = H[mask.sum() - 1]                               # last real token
wrong_mean = H.mean(axis=0)                                # bug: averages the padding too

def l2_normalize(v):
    return v / np.linalg.norm(v)

for name, v in [("cls", cls_vec), ("mean", mean_vec), ("last", last_vec), ("wrong", wrong_mean)]:
    print(f"{name:5s} {np.round(v, 4)} -> unit {np.round(l2_normalize(v), 4)}")
```

Output:

```text
cls   [1. 2. 0. 1.] -> unit [0.4082 0.8165 0.     0.4082]
mean  [2.     1.     1.     0.6667] -> unit [0.7878 0.3939 0.3939 0.2626]
last  [2. 1. 2. 0.] -> unit [0.6667 0.3333 0.6667 0.    ]
wrong [3.75 3.   3.   2.75] -> unit [0.5957 0.4766 0.4766 0.4369]
```

- `H * mask[:, None]` sets the padding rows to zero. `mask[:, None]` has shape $[T, 1]$ and broadcasts over the $d$ columns.
- `/ mask.sum()` divides by the number of real tokens, 3, not by $T = 4$.
- `H[mask.sum() - 1]` assumes right padding. With left padding, the last real token is at position $T - 1$. The Qwen3-Embedding code handles both cases for this reason.

### 4.3 Normalization

Most embedding models return unit vectors, or their model card normalizes them in the example code. For unit vectors, the dot product equals the cosine, and the squared L2 distance equals $2 - 2\cos$ (derived in lesson [Vectors and dot products](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products)). So all three metrics give the same ranking. An index can then use the fastest one, the dot product.

Some retrievers use raw dot products on vectors that are not normalized. DPR, the retriever of the original RAG paper, scores with $E_Q(q)^\top E_P(p)$ and takes the [CLS] output, "so d = 768". The search problem is then **maximum inner product search** (MIPS), not nearest-neighbor search. Use the metric that the model was trained with.

## 5. How an embedding model learns

### 5.1 Why a pretrained language model is not enough

A pretrained BERT already outputs hidden states. Why not average them and stop there? Reimers and Gurevych tested this in the Sentence-BERT paper (2019). They wrote that this common practice "yields rather bad sentence embeddings, often worse than averaging GloVe embeddings". On their semantic similarity tests, averaged BERT embeddings reached an average correlation of only 54.81.

Pretraining teaches the model to predict tokens. It does not teach it to place a question near its answer. The training objective of section 5.3 adds exactly that.

### 5.2 Training data: pairs

The data is a list of pairs $(q_i, p_i)$: a query and a passage that matches it. Examples: a search query and the clicked page, a question and its accepted answer, a title and its body text. The E5 authors built about 270M such pairs ("CCPairs") after filtering a pool of about 1.3B. `all-MiniLM-L6-v2` was trained on over 1 billion sentence pairs, according to its model card.

No pair says which texts do **not** match. The batch itself supplies the negatives (section 5.6).

### 5.3 The InfoNCE loss

A batch has $B$ pairs. Encode every query and every passage, normalize, and compute all $B \times B$ cosine similarities:

$$
S_{ij} = \cos\big(E(q_i), E(p_j)\big)
$$

Row $i$ holds the scores of query $i$ against every passage of the batch. Its positive is $p_i$, on the diagonal. The other $B - 1$ passages are its negatives. The loss for query $i$ is a softmax cross-entropy over the row, with the diagonal as the correct class:

$$
\mathcal{L}_i = -\log \frac{\exp(S_{ii} / \tau)}{\sum_{j=1}^{B} \exp(S_{ij} / \tau)}, \qquad \mathcal{L} = \frac{1}{B} \sum_{i=1}^{B} \mathcal{L}_i
$$

The symbols mean:

- $E$ is the encoder, including pooling and normalization.
- $S_{ij}$ is a cosine similarity, between $-1$ and $1$.
- $\tau$ is the temperature, a positive number such as 0.05.
- The fraction is the probability that the model gives to the correct passage among the $B$ candidates.
- $\mathcal{L}$ is the mean over the batch.

The name is from van den Oord, Li and Vinyals ("Representation Learning with Contrastive Predictive Coding", 2018): "a loss based on NCE, which we will call InfoNCE". The sentence-transformers library (version 6.1.0) implements it as `MultipleNegativesRankingLoss`. Its docstring says the default configuration "is also known as the InfoNCE loss, SimCSE loss, cross-entropy loss with in-batch negatives".

![Alt text: three queries and three passages form a 3 by 3 cosine matrix with the positives on the diagonal and a hard negative at q3 and p2](/notes/media/llm-systems/figures/06-2-contrastive-training.svg)

> [!example] Worked example: InfoNCE for a batch of 3
> The cosine matrix of the figure:
>
> $$
> S = \begin{bmatrix} 0.80 & 0.30 & 0.20 \\ 0.25 & 0.70 & 0.40 \\ 0.10 & 0.55 & 0.60 \end{bmatrix}
> $$
>
> **With $\tau = 1$.** Row 1: $e^{0.80} = 2.2255$, $e^{0.30} = 1.3499$, $e^{0.20} = 1.2214$. The sum is 4.7968, so $p_{11} = 2.2255 / 4.7968 = 0.4640$ and $\mathcal{L}_1 = -\ln 0.4640 = 0.7679$. In the same way, $p_{22} = 0.4204$ ($\mathcal{L}_2 = 0.8664$) and $p_{33} = 0.3910$ ($\mathcal{L}_3 = 0.9391$). The mean loss is 0.8578.
>
> **With $\tau = 0.05$.** Divide by 0.05, which multiplies by 20. Row 3 becomes $[2, 11, 12]$. Subtract the maximum 12: $[-10, -1, 0]$. Then $p_{33} = 1 / (e^{-10} + e^{-1} + 1) = 1 / 1.3679 = 0.7310$, so $\mathcal{L}_3 = 0.3133$. Rows 1 and 2 give $p_{11} = 0.9999$ and $p_{22} = 0.9974$, with losses 0.0001 and 0.0026. The mean loss is 0.1053.
>
> At $\tau = 1$ every row looks equally bad, because the softmax cannot separate scores that differ by less than 1. At $\tau = 0.05$, rows 1 and 2 are almost solved. Almost all the loss is in row 3, where the hard negative 0.55 is close to the positive 0.60.

The same computation in PyTorch:

```python
import torch
import torch.nn.functional as F

# cosine similarities: row i = query i, column j = passage j; passage i is the positive of query i
S = torch.tensor([[0.80, 0.30, 0.20],
                  [0.25, 0.70, 0.40],
                  [0.10, 0.55, 0.60]])

for tau in (1.0, 0.05):
    logits = S / tau                                   # temperature scaling
    labels = torch.arange(S.shape[0])                  # the diagonal holds the positives
    loss = F.cross_entropy(logits, labels)             # mean of -log softmax(row)[i]
    manual = (-(logits.diagonal() - torch.logsumexp(logits, dim=1))).mean()
    print(f"tau={tau}: loss={loss.item():.4f} manual={manual.item():.4f}")
    print("  row probabilities:", torch.softmax(logits, dim=1).diagonal().numpy().round(4))
```

Output:

```text
tau=1.0: loss=0.8578 manual=0.8578
  row probabilities: [0.464  0.4204 0.391 ]
tau=0.05: loss=0.1053 manual=0.1053
  row probabilities: [0.9999 0.9974 0.731 ]
```

- `labels = torch.arange(B)` says "the correct class of row $i$ is column $i$". This one line is the whole in-batch negatives trick.
- `F.cross_entropy(logits, labels)` computes $-\log \text{softmax}$ of the correct column and averages the rows.
- `manual` shows the same value as $\text{logsumexp}(\text{row}) - S_{ii}/\tau$. The log-sum-exp form subtracts the maximum inside, so large logits do not overflow.

### 5.4 The gradient: where the push goes

Differentiate $\mathcal{L}_i = -S_{ii}/\tau + \log \sum_j \exp(S_{ij}/\tau)$ with respect to one score:

$$
\frac{\partial \mathcal{L}_i}{\partial S_{ij}} = \frac{p_{ij} - \mathbb{1}[i = j]}{\tau}, \qquad p_{ij} = \frac{\exp(S_{ij}/\tau)}{\sum_{k} \exp(S_{ik}/\tau)}
$$

The symbols mean:

- $p_{ij}$ is the softmax probability of passage $j$ in row $i$.
- $\mathbb{1}[i = j]$ is 1 on the diagonal and 0 elsewhere.

Gradient descent moves each score against its gradient. So the positive score rises by an amount proportional to $(1 - p_{ii})/\tau$. Each negative score falls by an amount proportional to $p_{ij}/\tau$. A negative with a high probability gets a large push. An easy negative with $p_{ij} \approx 0$ gets almost none.

> [!example] Worked example: the gradient of row 3 at $\tau = 0.05$
> $p_{31} = 0.00003$, $p_{32} = 0.2689$, $p_{33} = 0.7310$.
>
> - Positive: $(0.7310 - 1) / 0.05 = -5.379$. Descent raises $S_{33}$.
> - Hard negative $p_2$: $0.2689 / 0.05 = 5.379$. Descent lowers $S_{32}$ strongly.
> - Easy negative $p_1$: $0.00003 / 0.05 \approx 0.0007$. Almost no change.
>
> Row 1 is already solved: its positive gets only $(0.9999 - 1)/0.05 \approx -0.001$. A small temperature makes the loss spend its effort on the hard cases.

### 5.5 The temperature, with a lower bound on the loss

Cosines lie between $-1$ and $1$. Without a temperature, the logits can differ by at most 2. So the softmax can never become sharp, and the loss has a floor.

Take the best realistic case: every positive has cosine 1 and every negative has cosine 0 (orthogonal). Then:

$$
\mathcal{L}_{\min} = -\log \frac{e^{1/\tau}}{e^{1/\tau} + (B - 1)\, e^{0}} = \log\big(1 + (B - 1)\, e^{-1/\tau}\big)
$$

> [!example] Worked example: the floor for a batch of 1,024
> - $\tau = 1$: $\log(1 + 1{,}023 \times e^{-1}) = \log(1 + 376.34) = \log 377.34 = 5.933$.
> - $\tau = 0.1$: $\log(1 + 1{,}023 \times e^{-10}) = 0.0454$.
> - $\tau = 0.05$: $\log(1 + 1{,}023 \times e^{-20}) \approx 2.1 \times 10^{-6}$.
>
> At $\tau = 1$, even a perfect model has a loss near 5.9, and the gradient keeps pushing all vectors forever. A small temperature lets the loss reach zero when the geometry is right.

Values in use: E5 states "τ is set to 0.01 in our experiments by default". In sentence-transformers 6.1.0, `MultipleNegativesRankingLoss` has `scale: float = 20.0`, and its docstring says "`scale=20.0` is equivalent to `temperature=0.05`". A temperature that is too small makes the gradients large and training unstable. Some models learn $\tau$ as a parameter instead.

### 5.6 Batch size and hard negatives

Each query gets $B - 1$ in-batch negatives at almost no cost, because the matrix $S$ is one matrix product. DPR describes it: the $B$ question vectors $Q$ and passage vectors $P$ give the $B \times B$ score matrix $S = QP^\top$, so "there are B − 1 negative passages for each question". Its best model used a batch size of 128 "and one additional BM25 negative passage per question". E5 used a batch size of 32,768 "to increase the number of negatives".

Why do more negatives help? Random negatives are mostly easy. The more of them the model sees, the more likely the batch contains a few close ones, and those carry the gradient (section 5.4). The CPC paper also gives a formal reason. The loss bounds the mutual information of the pair: $I \ge \log N - \mathcal{L}_N$, where $N$ is the number of candidates. So a larger $N$ allows a tighter bound. For $N = 32{,}768$, $\log N = 10.40$ nats.

**Hard negatives** are mined on purpose. Typical sources are the top BM25 results that are not the positive, or the top results of an earlier model version. With hard negatives, the score matrix has shape $[B, 2B]$: $B$ positives and $B$ hard negatives as columns. Exercise 3 builds it.

> [!trap] False negatives
> An in-batch "negative" can be relevant. Two users ask the same question in different words, and both pairs land in one batch. The loss then pushes apart two texts that should be close. Mined hard negatives have the same risk: the "close BM25 match that is not the positive" is sometimes a second correct answer. Remove duplicates from batches, and filter mined negatives that score as high as the positive.

### 5.7 The usual recipe

The E5 paper shows the common two-stage recipe:

1. **Weakly supervised contrastive pre-training** on hundreds of millions of noisy pairs, with very large batches and in-batch negatives.
2. **Supervised fine-tuning** on smaller labeled datasets, with mined hard negatives.

Other details from the E5 paper: average pooling, the "query: " and "passage: " prefixes (section 9), and $\tau = 0.01$.

## 6. Bi-encoder and cross-encoder

![Alt text: a bi-encoder encodes query and document separately and compares two vectors, while a cross-encoder reads both together and outputs one score](/notes/media/llm-systems/figures/06-2-bi-vs-cross-encoder.svg)

| | Bi-encoder | Cross-encoder |
|---|---|---|
| Input | One text at a time | Query and document together: `[CLS] query [SEP] document [SEP]` |
| Output | One vector per text | One relevance score per pair |
| Where query and document meet | Only in the final dot product | In every attention layer |
| Work per query over $N$ documents | 1 encoder pass and $N$ dot products | $N$ full encoder passes |
| Can store document results in advance | Yes: the index | No |
| Role | First-stage retrieval | Reranking a short candidate list (lesson [L5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking)) |

> [!example] Worked example: why a cross-encoder cannot search a corpus
> Take $N = 1{,}000{,}000$ chunks and $d = 1{,}024$.
>
> - **Bi-encoder:** one query pass, then $10^6 \times 1{,}024 = 1.024 \times 10^9$ multiply-adds for exact search. An index reduces even that (lesson [L4](/notes/ai/llm-systems/06-rag/l4-vector-indexes)).
> - **Cross-encoder:** $10^6$ full model passes for every query.
>
> The Sentence-BERT paper measured the same effect for finding the most similar pair among 10,000 sentences: "65 hours with BERT / RoBERTa" against "about 5 seconds with SBERT".

The price of the bi-encoder's speed is compression. The document vector is fixed before any query exists. A detail that matters only for one query, such as a negation, a date or a version number, can be lost in the pooled vector. That is why production pipelines retrieve wide with a bi-encoder and rerank the short list with a cross-encoder.

## 7. Dimensions and storage

Each value of a vector is usually a 32-bit float: 4 bytes (lesson [Numbers in memory](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory)). A 1,024-dimensional vector needs $1{,}024 \times 4 = 4{,}096$ bytes: 4 KiB, or about 4.1 KB.

```python
BYTES = {"float32": 4, "float16": 2, "int8": 1, "binary": 1 / 8}

def index_bytes(n_vectors, dim, dtype="float32"):
    """Raw vector bytes only. Graph links, IDs, text and metadata come on top."""
    return n_vectors * dim * BYTES[dtype]

for dtype in BYTES:
    per = index_bytes(1, 1024, dtype)
    print(f"{dtype:8s} {per:7.0f} B/vector  1M: {index_bytes(10**6, 1024, dtype) / 1e9:6.3f} GB"
          f"  100M: {index_bytes(10**8, 1024, dtype) / 1e9:7.1f} GB")
```

Output:

```text
float32     4096 B/vector  1M:  4.096 GB  100M:   409.6 GB
float16     2048 B/vector  1M:  2.048 GB  100M:   204.8 GB
int8        1024 B/vector  1M:  1.024 GB  100M:   102.4 GB
binary       128 B/vector  1M:  0.128 GB  100M:    12.8 GB
```

These are raw vector bytes only. A graph index adds links per vector, and the database stores the chunk text and metadata as well (lesson [L4](/notes/ai/llm-systems/06-rag/l4-vector-indexes)). Two limits matter in practice. pgvector indexes the `vector` type "up to 2,000 dimensions" and `halfvec` "up to 4,000 dimensions" (README, version 0.8.7). And every query compares against these bytes, so more dimensions mean more memory traffic per query.

## 8. Matryoshka embeddings

A Matryoshka doll holds smaller dolls inside it. Kusupati et al. (NeurIPS 2022, arXiv 2205.13147) train embeddings the same way: the first $m$ values of the vector are also a good embedding by themselves. The loss is a sum of the normal loss, computed on several prefixes:

$$
\mathcal{L}_{\text{MRL}} = \sum_{m \in \mathcal{M}} c_m \, \mathcal{L}\big(z_{1:m}\big)
$$

The symbols mean:

- $z$ is the full embedding and $z_{1:m}$ its first $m$ values.
- $\mathcal{M}$ is the set of nested sizes. For a 768-dimensional BERT-Base, the paper uses $\{12, 24, 48, 96, 192, 384, 768\}$, halving each time.
- $c_m$ is the weight of each size. The paper sets "all the importance scales, $c_m = 1$".
- $\mathcal{L}$ is the task loss. For retrieval models it is the contrastive loss of section 5.3.

The paper reports "up to 14× smaller embedding size for ImageNet-1K classification at the same level of accuracy". In sentence-transformers, the loss wraps another loss, for example `losses.MatryoshkaLoss(model, loss, [768, 512, 256, 128, 64])`. Providers expose it as an option. OpenAI's `text-embedding-3` models accept a `dimensions` parameter (lesson [Embeddings and similarity](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity)). `Qwen3-Embedding-8B` "supports user-defined output dimensions ranging from 32 to 4096".

When you cut a vector yourself, **normalize it again**:

```python
import numpy as np

def truncate(v, m):
    """Keep the first m dimensions of a Matryoshka embedding, then normalize again."""
    head = np.asarray(v, dtype=np.float64)[..., :m]
    return head / np.linalg.norm(head, axis=-1, keepdims=True)

v = np.array([0.6, 0.48, 0.64])
w = np.array([0.48, 0.6, 0.64])
print("full cosine      :", round(float(v @ w), 4))
print("raw prefix dot   :", round(float(v[:2] @ w[:2]), 4))
print("normalized prefix:", round(float(truncate(v, 2) @ truncate(w, 2)), 4))
```

Output:

```text
full cosine      : 0.9856
raw prefix dot   : 0.576
normalized prefix: 0.9756
```

The first two values of a unit vector have a length below 1 (here 0.768). The raw dot product of the prefixes, 0.576, is no longer a cosine. After normalization, the cosine of the prefixes is 0.9756, close to the full value 0.9856. With a cosine-based loss such as `MultipleNegativesRankingLoss`, training compares normalized prefixes, so the index must do the same. A model trained without the Matryoshka loss usually loses more quality when you cut it, so measure it.

## 9. Asymmetric models: prefixes and instructions

A query is short and asks. A document is long and states. Some models encode the two sides differently, and you must tell them which side a text is on.

| Model | Rule from its model card or paper | Effect of forgetting it |
|---|---|---|
| E5 (`intfloat/e5-*`) | Add "query: " to queries and "passage: " to passages. The paper: "Such an asymmetric design turns out to be important for some retrieval tasks". | No error. Lower quality. |
| `BAAI/bge-large-en-v1.5` | Add "Represent this sentence for searching relevant passages: " to queries only. The card says that for v1.5, "No instruction only has a slight degradation in retrieval performance". | A small drop. |
| `Qwen/Qwen3-Embedding-8B` | Queries: `Instruct: {task}\nQuery:{query}`. Documents: "No need to add instruction for retrieval documents". The card reports gains of 1% to 5% from the instruction. | A measurable drop. |

For symmetric tasks, such as finding duplicate questions, use the query form on both sides. The E5 appendix applies "query: " to all questions for Quora duplicate retrieval.

> [!trap] The prefix is part of the model version
> An index built with "passage: " and queried without "query: " still returns results with normal-looking scores. The quality drop is silent. Store the prefixes with the index metadata, next to the model name and dimension (lesson [The RAG pipeline](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline)).

## 10. Choosing a model

### 10.1 MTEB and its current form

The Massive Text Embedding Benchmark (Muennighoff et al., 2022) spans "8 embedding tasks covering a total of 58 datasets and 112 languages". Its main finding: no single method was best on all tasks. MMTEB, the multilingual extension (arXiv 2502.13595), covers over 500 tasks in more than 250 languages. The leaderboard is a Hugging Face space (`mteb/leaderboard`) with several named benchmarks, for example `MTEB(eng, v2)`.

The retrieval part changed in 2025. Hugging Face introduced RTEB on 1 October 2025, as a beta in "the new Retrieval section on the MTEB leaderboard". The post explains why: models are tuned on public test sets, and "a gap emerges between their reported scores and their actual performance on new, unseen data". RTEB mixes open datasets with private ones that the MTEB maintainers evaluate. Its default metric is NDCG@10. A large drop from the open to the private datasets signals overfitting.

### 10.2 A selection procedure

| Criterion | Question |
|---|---|
| Retrieval quality on your data | Do your questions find their passages? Only your labeled set answers this ([L8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag)). |
| Input limit | Do your chunks fit, counted with the model's own tokenizer ([L3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion))? |
| Dimension and Matryoshka support | How many bytes per vector? Can you shorten it? Does it fit the index limits? |
| Languages and domain | Code, legal text, other languages? |
| Hosting | API (data leaves your network) or self-hosted (you need a GPU or CPU budget). |
| Cost to re-embed | A model change means embedding the whole corpus again. |
| Latency | One query embedding per request, on your hardware or over the network. |

1. Shortlist about three models from the leaderboard and your constraints. Prefer the retrieval scores, and check RTEB for the open-to-private gap.
2. Embed your corpus with each one. Run 50 to 200 labeled questions.
3. Compare recall@k and nDCG@10, the bytes per vector, and the query latency.
4. Record the winner's name, version, dimension, prefixes and normalization with the index.

### Exercises

1. **Masked mean pooling.** Write `mean_pool(H, mask)` for a batch: `H` of shape $[B, T, d]$ and `mask` of shape $[B, T]$.
   - Acceptance test: the result equals the mean of the real tokens, and it does not change when you change the values at padding positions.
   - Hint 1: multiply by `mask[..., None]` before the sum.
   - Hint 2: divide by the count of real tokens per row, and guard against a count of 0.
2. **InfoNCE from scratch.** Write `info_nce(q, p, tau, symmetric=False)` with the log-sum-exp form. Add a symmetric option that also scores each passage against all queries.
   - Acceptance test: the result equals `F.cross_entropy` on the scaled cosine matrix. The loss with `p = q` is lower than with random `p`.
   - Hint 1: normalize both inputs first.
   - Hint 2: the passage-to-query direction uses the columns of $S$: `logsumexp(S, dim=0)`.
3. **Hard negatives.** Extend the loss to take one hard negative per query. The score matrix must have shape $[B, 2B]$.
   - Acceptance test: the shape is `(4, 8)` for $B = 4$, and hard negatives near the query give a higher loss than random negatives.
   - Hint 1: concatenate the positives and the negatives along the first axis.
   - Hint 2: the labels are still `arange(B)`, because the positives are the first $B$ columns.
4. **Storage and truncation.** Write `plan(n_vectors, dims, bytes_per_value)` and `truncate(v, m)`.
   - Acceptance test: 10 million 1,024-dimensional float32 vectors need 40.96 GB. Every truncated vector has length 1.
   - Hint 1: bytes = vectors × dimensions × bytes per value.
   - Hint 2: normalize along the last axis with `keepdims=True`.

## 11. Common mistakes

1. **"Any LLM's hidden states make good embeddings."** Without contrastive training, averaged BERT states scored worse than averaged GloVe vectors in the Sentence-BERT paper. The training objective makes the geometry.
2. **"Mean pooling is the mean over all positions."** It is the mean over real tokens. Including padding makes the vector depend on the batch.
3. **"The temperature is a minor setting."** At $\tau = 1$ with 1,024 candidates, the loss cannot drop below about 5.93 even for perfect vectors. A small $\tau$ also decides which negatives get the gradient.
4. **"In-batch negatives are true negatives."** Some are relevant: false negatives. Remove duplicates and filter mined negatives.
5. **"A cross-encoder is a better embedding model."** It outputs a score for a pair, not a vector. Nothing can be stored in advance, so it can only rerank a short list.
6. **"Cut a Matryoshka vector and use it as it is."** Normalize the prefix again, or the dot product is no longer a cosine.
7. **"The prefix is optional decoration."** A missing "query: " or instruction lowers quality silently. Store it with the index.
8. **"The top MTEB model is the best for us."** Leaderboards average many tasks, and public sets can be overfit. RTEB exists for this reason. Test on your own questions.

## 12. One-minute explanation

An embedding model is a transformer encoder that ends with pooling instead of a language-model head. Pooling turns the token hidden states into one vector: the [CLS] token, the mean of the real tokens, or the last token for decoder models. Then the vector is normalized, so the dot product equals the cosine. Contrastive training on query and passage pairs creates the geometry. For a batch of B pairs, we compute the B by B cosine matrix. A softmax cross-entropy on each row, with the diagonal as the correct class, is InfoNCE. The other passages in the batch are free negatives, and mined hard negatives make the task harder. The temperature, for example 0.05 or 0.01, sharpens the softmax so the loss can reach zero and focuses the gradient on hard negatives. This bi-encoder computes document vectors once, which makes search fast, while a cross-encoder reads each pair together and only reranks. A 1,024-dimensional float32 vector costs 4 KiB, and Matryoshka training lets us cut it to a shorter prefix and normalize again.

## 13. Check questions

```check
{
  "question": "What are the input and output shapes of a bi-encoder for a batch of 8 texts padded to 64 tokens, with hidden size 1,024? Where does pooling happen?",
  "answer": "Token IDs: [8, 64]. Attention mask: [8, 64]. Last-layer hidden states H: [8, 64, 1024]. Pooling reduces the token axis: [8, 1024]. Normalization keeps the shape [8, 1024] and makes each row length 1."
}
```

```check
{
  "question": "Why do decoder-based embedding models such as Qwen3-Embedding use last-token pooling, while BERT-style encoders can use mean or [CLS] pooling?",
  "hint": "Which tokens can each position see?",
  "answer": "A decoder keeps the causal mask, so position t has attended only to tokens 1 to t. Only the last token has seen the whole text, so its hidden state is the only position that summarizes everything. An encoder has bidirectional attention, so every position has seen the whole text, and the mean or the [CLS] state can summarize it."
}
```

```check
{
  "question": "Interview follow-up: write the InfoNCE loss for one query and derive its gradient with respect to a negative score. What does the gradient say about easy and hard negatives?",
  "hint": "Differentiate the log-sum-exp term.",
  "answer": "$\\mathcal{L}_i = -S_{ii}/\\tau + \\log \\sum_j \\exp(S_{ij}/\\tau)$. For $j \\ne i$: $\\partial \\mathcal{L}_i / \\partial S_{ij} = p_{ij}/\\tau$, where $p_{ij}$ is the softmax probability of passage $j$. For the positive: $(p_{ii} - 1)/\\tau$. An easy negative has $p_{ij} \\approx 0$ and gets almost no push. A hard negative has a large $p_{ij}$ and gets most of the push. In the worked example at $\\tau = 0.05$, the hard negative 0.55 got a gradient of 5.38, the easy negative about 0.0007."
}
```

```check
{
  "question": "Interview follow-up: compute the InfoNCE loss of the row [0.9, 0.2, 0.1] (positive first) at τ = 0.1. Then explain what happens to the loss floor at τ = 1 for a batch of 1,024.",
  "hint": "Use the subtract-the-maximum trick.",
  "answer": "Scaled row: [9, 2, 1]. Subtract 9: [0, −7, −8]. Sum of exponentials: 1 + 0.000912 + 0.000335 = 1.001247. p = 1/1.001247 = 0.99875, loss = −ln(0.99875) = 0.00125. At τ = 1 with positives at cosine 1 and negatives at 0, the loss floor is ln(1 + 1,023 × e^{−1}) = ln(377.34) = 5.93. Cosines span only 2 units, so without a small temperature the softmax cannot become sharp."
}
```

```check
{
  "question": "Interview follow-up: how many bytes does an index of 50 million 768-dimensional float32 vectors need for the raw vectors? What changes with float16, and with a 256-dimensional Matryoshka prefix in float16?",
  "answer": "Float32: 50,000,000 × 768 × 4 = 153,600,000,000 bytes = 153.6 GB (about 143 GiB). Float16: half, 76.8 GB. A 256-dimensional prefix in float16: 50,000,000 × 256 × 2 = 25.6 GB. Graph links, IDs, text and metadata come on top. Quality of the prefix must be measured, and the prefix must be normalized again."
}
```

```check
{
  "question": "Interview follow-up: why is a large batch good for contrastive training, and what risk grows with it?",
  "answer": "Each query gets B − 1 in-batch negatives from one matrix product, so a larger batch gives more negatives at almost no extra cost. More candidates make it likely that some are close, and those carry the gradient. The CPC bound I ≥ log N − L_N also tightens with N. The risk is false negatives: with more texts per batch, two relevant texts for the same query land in one batch more often, and the loss pushes them apart. E5 used 32,768. DPR used 128 with one BM25 hard negative per question."
}
```

```check
{
  "question": "A team indexes with E5 using 'passage: ' and queries without any prefix. Nothing crashes. What happens, and how do you prevent it?",
  "answer": "The query vectors are in the wrong part of the space for this asymmetric model, so quality drops silently: scores look normal but rankings are worse. Prevent it by storing the model name, version, dimension, normalization and both prefixes in the index metadata and checking them in the query code. Add a retrieval test with known answers to CI."
}
```

```check
{
  "question": "Interview follow-up: what is RTEB, and why did the MTEB maintainers add it?",
  "answer": "RTEB is a retrieval benchmark introduced by Hugging Face on 1 October 2025 as part of the Retrieval section of the MTEB leaderboard. It combines open datasets with private datasets that the maintainers evaluate. It exists because models were tuned on public test sets, so reported scores overstate performance on unseen data. Its default metric is NDCG@10, and a large drop from open to private datasets signals overfitting."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\nimport numpy as np\n\ndef mean_pool(H, mask):\n    \"\"\"H: [B, T, d] hidden states. mask: [B, T] with 1 for real tokens.\"\"\"\n    m = mask[..., None].astype(H.dtype)             # [B, T, 1]\n    summed = (H * m).sum(axis=1)                     # [B, d]\n    counts = np.clip(m.sum(axis=1), 1e-9, None)      # [B, 1], avoid division by zero\n    return summed / counts\n\nrng = np.random.default_rng(0)\nH = rng.normal(size=(2, 5, 4))\nmask = np.array([[1, 1, 1, 0, 0], [1, 1, 1, 1, 1]])\nout = mean_pool(H, mask)\nassert np.allclose(out[0], H[0, :3].mean(axis=0))   # padding ignored\nH2 = H.copy(); H2[0, 3:] = 1e6                       # change only the padding values\nassert np.allclose(mean_pool(H2, mask)[0], out[0])   # result unchanged\nprint(out.shape, \"ok\")\n```"
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\nimport torch\nimport torch.nn.functional as F\n\ndef info_nce(q, p, tau=0.05, symmetric=False):\n    \"\"\"q, p: [B, d] raw embeddings; p[i] is the positive of q[i].\"\"\"\n    q = F.normalize(q, dim=-1)\n    p = F.normalize(p, dim=-1)\n    S = q @ p.T / tau                                # [B, B] cosine / tau\n    diag = S.diagonal()\n    loss_q = (torch.logsumexp(S, dim=1) - diag).mean()   # query -> passages\n    if not symmetric:\n        return loss_q\n    loss_p = (torch.logsumexp(S, dim=0) - diag).mean()   # passage -> queries\n    return (loss_q + loss_p) / 2\n\ntorch.manual_seed(0)\nq, p = torch.randn(8, 16), torch.randn(8, 16)\nlabels = torch.arange(8)\nref = F.cross_entropy(F.normalize(q, dim=-1) @ F.normalize(p, dim=-1).T / 0.05, labels)\nassert torch.allclose(info_nce(q, p), ref)\nassert info_nce(q, q.clone()) < info_nce(q, p)       # perfect positives give a lower loss\nprint(round(info_nce(q, p).item(), 4), round(info_nce(q, p, symmetric=True).item(), 4))\n```"
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\nimport torch\nimport torch.nn.functional as F\n\ndef info_nce_hard(q, pos, neg, tau=0.05):\n    \"\"\"q, pos, neg: [B, d]. Each query has its positive, all other positives,\n    and all B hard negatives as candidates: B - 1 + B negatives per query.\"\"\"\n    q, pos, neg = (F.normalize(x, dim=-1) for x in (q, pos, neg))\n    cands = torch.cat([pos, neg], dim=0)             # [2B, d]\n    S = q @ cands.T / tau                            # [B, 2B]\n    return F.cross_entropy(S, torch.arange(q.shape[0])), S.shape\n\ntorch.manual_seed(1)\nq = torch.randn(4, 32)\npos = q + 0.1 * torch.randn(4, 32)                   # close to the query\neasy = torch.randn(4, 32)                            # unrelated\nhard = q + 0.3 * torch.randn(4, 32)                  # close, but not the positive\nl_easy, shape = info_nce_hard(q, pos, easy)\nl_hard, _ = info_nce_hard(q, pos, hard)\nassert shape == (4, 8) and l_hard > l_easy\nprint(shape, round(l_easy.item(), 4), round(l_hard.item(), 4))\n```\n\nWith B = 4, each query has 3 in-batch negatives and 4 hard negatives (its own and the other queries' ones): 7 negatives in total."
}
```

```check
{
  "question": "Exercise 4: show a reference solution.",
  "answer": "```python\nimport numpy as np\n\ndef truncate(v, m):\n    head = np.asarray(v, dtype=np.float64)[..., :m]\n    return head / np.linalg.norm(head, axis=-1, keepdims=True)\n\ndef plan(n_vectors, dims, bytes_per_value):\n    return {m: n_vectors * m * bytes_per_value for m in dims}\n\nrng = np.random.default_rng(0)\nX = rng.normal(size=(1000, 1024))\nX /= np.linalg.norm(X, axis=1, keepdims=True)\nT = truncate(X, 256)\nassert np.allclose(np.linalg.norm(T, axis=1), 1.0)\nsizes = plan(10_000_000, [1024, 512, 256], 4)\nassert sizes[1024] == 40_960_000_000 and sizes[256] == 10_240_000_000\nprint({m: f\"{b / 1e9:.2f} GB\" for m, b in sizes.items()})\n```"
}
```

## 14. Links

- Previous: [L1: Why RAG](/notes/ai/llm-systems/06-rag/l1-why-rag)
- Next: [L3: Chunking and ingestion](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion)
- Related: [Vectors and dot products](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products), [Scaled dot-product attention](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention), [The transformer block](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block)
- Related: [Embeddings and similarity](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) in the context engineering course
- Next steps: [L4: Vector indexes](/notes/ai/llm-systems/06-rag/l4-vector-indexes) and [L5: Hybrid search and reranking](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking)
- Drill: [Drill: RAG](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag)

### Sources

- Reimers and Gurevych, "Sentence-BERT", EMNLP-IJCNLP 2019: https://arxiv.org/abs/1908.10084 (checked on 2026-10-15)
- Karpukhin et al., "Dense Passage Retrieval for Open-Domain Question Answering", 2020: https://arxiv.org/abs/2004.04906 (checked on 2026-10-15)
- Wang et al., "Text Embeddings by Weakly-Supervised Contrastive Pre-training" (E5): https://arxiv.org/abs/2212.03533 (checked on 2026-10-15)
- van den Oord, Li and Vinyals, "Representation Learning with Contrastive Predictive Coding", 2018: https://arxiv.org/abs/1807.03748 (checked on 2026-10-15)
- Kusupati et al., "Matryoshka Representation Learning", NeurIPS 2022: https://arxiv.org/abs/2205.13147 (checked on 2026-10-15)
- Muennighoff et al., "MTEB: Massive Text Embedding Benchmark": https://arxiv.org/abs/2210.07316 and the MTEB repository https://github.com/embeddings-benchmark/mteb (checked on 2026-10-15)
- Hugging Face, "Introducing RTEB: A New Standard for Retrieval Evaluation", 1 October 2025: https://huggingface.co/blog/rteb (checked on 2026-10-15)
- Model cards: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2, https://huggingface.co/BAAI/bge-large-en-v1.5, https://huggingface.co/Qwen/Qwen3-Embedding-8B (checked on 2026-10-15)
- sentence-transformers 6.1.0 source, `MultipleNegativesRankingLoss` and `MatryoshkaLoss` (PyPI package, checked on 2026-10-15)
- pgvector README, version 0.8.7: https://github.com/pgvector/pgvector (checked on 2026-10-15)
