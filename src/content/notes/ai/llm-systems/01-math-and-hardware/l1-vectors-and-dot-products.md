---
title: "L1: Vectors and dot products"
order: 1
summary: "A vector is a list of numbers and an arrow. The dot product turns two vectors into one match score. This lesson derives its geometric meaning, compares dot product, cosine and distance on the toy attention vectors, and shows why attention and retrieval both use it."
status: not-started
tags: [math, vectors, dot-product, cosine-similarity, attention, embeddings]
---

## 1. The question this idea answers

A language model reads "the cat sat" and must write the next word. Inside the model, the word "down" must decide how much each earlier word matters to it. A retrieval system has a similar problem. It must decide which of 10,000 text chunks best matches a question.

Both problems need one number that says "how well do these two things match?". The model stores every word and every chunk as a list of numbers. So the real question is: how do you turn two lists of numbers into one match score?

The answer is the **dot product**. Attention computes one dot product for every pair of a query and a key, in every head of every layer. Vector search computes one dot product (or a close relative) for every stored chunk. If an interviewer asks "what is attention?", the first honest sentence is "a weighted average, with weights from dot products". This lesson builds the dot product from zero, so that every later formula in this guide rests on solid ground.

## 2. Mental model

> [!analogy] Two shoppers compare their ratings
> Two shoppers rate the same four features of a phone, from −2 (hate) to +2 (love). To get one agreement score, multiply the two ratings of each feature, then add the four products. When both shoppers love the same feature, that product is large and positive. When one loves a feature and the other hates it, that product is negative. When one shopper does not care (rating 0), that feature adds nothing. The sum is the dot product of the two rating lists.
>
> **Where it stops working:** a shopper who gives extreme ratings to everything gets large scores with everybody. The dot product grows with the size of the numbers, not only with agreement. Cosine similarity removes that effect (section 6). Also, the "features" of a model's vectors have no human names. They are directions that training produced.

## 3. Terms

| Term | Plain meaning |
|---|---|
| scalar | One single number, for example 3 or −0.5. |
| vector | An ordered list of numbers, for example $[1, 0, 1, 0]$. Also an arrow from the origin to that point. |
| component | One number inside a vector. $a_i$ is component $i$ of vector $a$. |
| dimension | The number of components of a vector. $[1, 0, 1, 0]$ has dimension 4. |
| row vector | A vector written as one row. This guide writes token vectors as row vectors. |
| norm (L2 norm, length) | The length of the arrow: the square root of the sum of the squared components. Written $\lVert a \rVert$. |
| unit vector | A vector with norm 1. |
| normalization | Division of a vector by its norm. The result is a unit vector with the same direction. |
| dot product | The sum of the products of matching components. One number. Written $a \cdot b$. |
| angle | The opening between two arrows that start at the same point. Written $\theta$. |
| cosine similarity | The dot product divided by the product of the two norms. It equals $\cos\theta$ and ranges from −1 to 1. |
| orthogonal | At a right angle. Two vectors are orthogonal when their dot product is 0. |
| projection | The "shadow" of one vector on the line of another vector. |
| Euclidean distance | The straight-line distance between the tips of two arrows: $\lVert a - b \rVert$. |
| embedding | A vector that a model computes to represent a token or a text. |
| query vector and key vector | In attention, the vector that asks (query) and the vector that answers (key). Their dot product is the attention score. |
| FLOP | One floating-point operation: one addition or one multiplication. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. A vector is a list of numbers and an arrow

### 4.1 The list view

A **vector** is an ordered list of numbers. The order matters: $[1, 2]$ and $[2, 1]$ are different vectors. Each number is a **component**. The number of components is the **dimension**.

$$
a = [a_1, a_2, \ldots, a_d]
$$

The symbols mean:

- $a$ is the vector.
- $a_i$ is component number $i$. Math counts from 1. Python and NumPy count from 0, so $a_1$ is `a[0]` in code.
- $d$ is the dimension.

This guide uses one small running example for attention. Four tokens ("the", "cat", "sat", "down") each have a vector with $d_{model} = 4$ components:

```text
x_the  = [1, 0, 1, 0]
x_cat  = [0, 1, 0, 1]
x_sat  = [1, 1, 0, 0]
x_down = [0, 1, 1, 0]
```

A real model uses much longer vectors. Llama-3.1-8B gives each token a vector of 4,096 components. The ideas are the same, only the length changes.

### 4.2 The arrow view

In two dimensions, the vector $[3, 4]$ is an arrow from the origin $(0, 0)$ to the point $(3, 4)$. It goes 3 units right and 4 units up. In three dimensions, an arrow needs three numbers. In 4,096 dimensions you cannot draw the arrow, but the algebra works the same way. Every rule in this lesson is true in any dimension.

Two operations work component by component:

- **Addition:** $[1, 0, 1, 0] + [0, 1, 0, 1] = [1, 1, 1, 1]$. As arrows: put the second arrow at the tip of the first.
- **Scaling:** $2 \times [1, 2] = [2, 4]$. As an arrow: the same direction, twice as long. A negative number turns the arrow around.

> [!note] Why addition matters later
> A transformer layer adds its result to its input vector (the "residual connection" of [L6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block)). Attention also outputs a weighted sum of value vectors: scaling, then addition.

### 4.3 Length: the norm

The length of an arrow is its **norm**. In two dimensions, the arrow $[3, 4]$ is the long side of a right triangle with sides 3 and 4. Pythagoras gives its length: $\sqrt{3^2 + 4^2} = \sqrt{25} = 5$. The same rule works in any dimension:

$$
\lVert a \rVert = \sqrt{a_1^2 + a_2^2 + \cdots + a_d^2} = \sqrt{\sum_{i=1}^{d} a_i^2}
$$

> [!example] Worked example: the norms of the toy token vectors
> - $\lVert x_{the} \rVert = \sqrt{1^2 + 0^2 + 1^2 + 0^2} = \sqrt{2} \approx 1.4142$
> - $\lVert x_{cat} \rVert = \sqrt{0 + 1 + 0 + 1} = \sqrt{2} \approx 1.4142$
> - $\lVert x_{sat} \rVert = \sqrt{1 + 1 + 0 + 0} = \sqrt{2} \approx 1.4142$
> - $\lVert x_{down} \rVert = \sqrt{0 + 1 + 1 + 0} = \sqrt{2} \approx 1.4142$
>
> All four toy vectors have the same length. So any difference in their dot products comes only from their directions.

A **unit vector** has norm 1. **Normalization** divides every component by the norm:

$$
\hat{a} = \frac{a}{\lVert a \rVert}
$$

For example, $\hat{x}_{the} = [1, 0, 1, 0] / \sqrt{2} \approx [0.7071, 0, 0.7071, 0]$. The zero vector $[0, 0, 0, 0]$ has norm 0. You cannot normalize it, because division by 0 is not defined. Code must handle this case (exercise 1).

## 5. The dot product

### 5.1 The computation

The **dot product** multiplies matching components and adds the products:

$$
a \cdot b = a_1 b_1 + a_2 b_2 + \cdots + a_d b_d = \sum_{i=1}^{d} a_i b_i
$$

Both vectors must have the same dimension. The result is one scalar, not a vector.

> [!example] Worked example: dot products of the toy token vectors
> - $x_{the} \cdot x_{sat} = 1 \cdot 1 + 0 \cdot 1 + 1 \cdot 0 + 0 \cdot 0 = 1$
> - $x_{the} \cdot x_{cat} = 1 \cdot 0 + 0 \cdot 1 + 1 \cdot 0 + 0 \cdot 1 = 0$
> - $x_{sat} \cdot x_{down} = 1 \cdot 0 + 1 \cdot 1 + 0 \cdot 1 + 0 \cdot 0 = 1$
> - $x_{the} \cdot x_{the} = 1 + 0 + 1 + 0 = 2$
>
> The full table of the six pairs, computed with NumPy:
>
> | Pair | Dot product | Cosine | Angle |
> |---|---|---|---|
> | the, cat | 0 | 0 | 90° |
> | the, sat | 1 | 0.5 | 60° |
> | the, down | 1 | 0.5 | 60° |
> | cat, sat | 1 | 0.5 | 60° |
> | cat, down | 1 | 0.5 | 60° |
> | sat, down | 1 | 0.5 | 60° |
>
> "the" and "cat" share no component, so their dot product is 0. Every other pair shares exactly one component.

The toy token vectors are not yet used for attention scores. Attention first multiplies each token vector by learned matrices to get a query, a key and a value ([L2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) shows how). The dot products that matter for attention are between a **query vector** and the **key vectors**. Section 6.3 uses them.

### 5.2 Rules of the dot product

These rules follow directly from the definition. Each one appears later in the guide.

| Rule | Formula | Why it matters later |
|---|---|---|
| Order does not matter | $a \cdot b = b \cdot a$ | The score of query $i$ with key $j$ has one value. |
| Self dot product is the squared norm | $a \cdot a = \lVert a \rVert^2$ | Norms and distances use dot products. |
| Scaling passes through | $(c\,a) \cdot b = c\,(a \cdot b)$ | Dividing scores by $\sqrt{d_k}$ is the same as dividing the query by $\sqrt{d_k}$. |
| Addition passes through | $a \cdot (b + c) = a \cdot b + a \cdot c$ | Section 6.2 expands $\lVert a - b \rVert^2$ with it. |
| Zero means orthogonal | $a \cdot b = 0$ | A query ignores keys at a right angle to it. |

### 5.3 The geometric meaning, derived

The computation is simple. Its meaning is the important part:

$$
a \cdot b = \lVert a \rVert \, \lVert b \rVert \cos\theta
$$

Here $\theta$ is the angle between the two arrows. The formula says: the dot product is large when the arrows are long **and** point in similar directions. You do not need to remember it. You can derive it in three steps.

**Step 1: the law of cosines from Pythagoras.** Draw arrows $a$ and $b$ from the origin, with the angle $\theta$ between them. Write $A = \lVert a \rVert$ and $B = \lVert b \rVert$. The third side of the triangle goes from the tip of $b$ to the tip of $a$. That side is the vector $a - b$. Drop a perpendicular from the tip of $b$ onto the line of $a$. It meets the line at distance $B\cos\theta$ from the origin, and its height is $B\sin\theta$. Now examine the right triangle between that foot and the tip of $a$. Its sides are $A - B\cos\theta$ and $B\sin\theta$. Pythagoras gives:

$$
\lVert a - b \rVert^2 = (A - B\cos\theta)^2 + (B\sin\theta)^2 = A^2 - 2AB\cos\theta + B^2(\cos^2\theta + \sin^2\theta)
$$

Because $\cos^2\theta + \sin^2\theta = 1$, this is the **law of cosines**:

$$
\lVert a - b \rVert^2 = A^2 + B^2 - 2AB\cos\theta
$$

**Step 2: expand the same quantity with the dot product rules.** Use the rules of section 5.2:

$$
\lVert a - b \rVert^2 = (a - b) \cdot (a - b) = a \cdot a - 2\, a \cdot b + b \cdot b = A^2 + B^2 - 2\, a \cdot b
$$

**Step 3: compare.** Both lines describe the same number. The terms $A^2$ and $B^2$ cancel, so $-2\, a \cdot b = -2AB\cos\theta$, and:

$$
a \cdot b = \lVert a \rVert \, \lVert b \rVert \cos\theta
$$

> [!example] Worked example: check the derivation with the query of "down"
> Section 6.3 uses the query $q = [1, 2]$ and the key $k = [0, 2]$.
>
> - Directly: $q \cdot k = 1 \cdot 0 + 2 \cdot 2 = 4$.
> - Norms: $\lVert q \rVert = \sqrt{1 + 4} = \sqrt{5} \approx 2.2361$ and $\lVert k \rVert = 2$.
> - So $\cos\theta = 4 / (2.2361 \times 2) \approx 0.8944$, which gives $\theta \approx 26.57°$.
> - Law of cosines: $\lVert q - k \rVert^2 = 5 + 4 - 2 \times 4 = 1$. Directly: $q - k = [1, 0]$, and $1^2 + 0^2 = 1$. Both agree.

The sign of the dot product tells you the angle:

| Dot product | Angle | Meaning |
|---|---|---|
| Positive | Less than 90° | The arrows point roughly the same way. |
| Zero | Exactly 90° | Orthogonal: no shared direction. |
| Negative | More than 90° | The arrows point roughly in opposite directions. |

### 5.4 The projection picture

There is a second way to read $\lVert a \rVert \, \lVert b \rVert \cos\theta$. The quantity $\lVert b \rVert \cos\theta$ is the signed length of the **projection** of $b$ on the line of $a$. Picture it as the shadow of $b$ when light falls at a right angle onto $a$. So:

$$
a \cdot b = \lVert a \rVert \times (\text{signed length of the shadow of } b \text{ on } a)
$$

If $a$ is a unit vector, the dot product **is** the shadow length. This is how to think of a query: a unit query measures "how far does each key reach in my direction".

![Alt text: the angle and the shadow of one arrow on another, and the query of down with four keys and their scores](/notes/media/llm-systems/figures/01-1-dot-product-geometry.svg)

```plot
{
  "title": "Dot product of two arrows with lengths 1 and 2 (blue) and their cosine similarity (red), as the angle grows from 0 to 180 degrees",
  "xAxis": { "label": "angle in degrees", "domain": [0, 180] },
  "yAxis": { "label": "value", "domain": [-2.2, 2.2] },
  "disableZoom": true,
  "data": [
    { "fn": "2*cos(x*0.0174533)", "color": "#1E6091" },
    { "fn": "cos(x*0.0174533)", "color": "#C81D25" }
  ]
}
```

Both curves cross zero at 90°. The blue curve is twice the red curve, because the lengths multiply the cosine. A longer arrow makes the dot product larger, but it does not change the cosine.

```video
{"src": "/notes/media/llm-systems/manim/m01-dot-product-alignment.mp4", "caption": "A key arrow turns around a fixed query arrow, and the dot product and the cosine change with the angle, then the key grows longer and only the dot product changes."}
```

## 6. Cosine similarity and distance

### 6.1 Cosine similarity

Divide the dot product by both norms, and only the angle remains:

$$
\cos(a, b) = \frac{a \cdot b}{\lVert a \rVert \, \lVert b \rVert}
$$

The **cosine similarity** is 1 for the same direction, 0 for a right angle and −1 for opposite directions. Length has no effect: $\cos(2a, b) = \cos(a, b)$. It is not defined if either vector is the zero vector.

For unit vectors, both norms are 1, so the cosine **equals** the dot product. That is why many embedding models return unit vectors. Then a fast dot product gives the cosine directly.

### 6.2 Euclidean distance and the key identity

The **Euclidean distance** is the length of the difference vector: $\lVert a - b \rVert$. Section 5.3 already expanded its square:

$$
\lVert a - b \rVert^2 = \lVert a \rVert^2 + \lVert b \rVert^2 - 2\, a \cdot b
$$

For unit vectors, $\lVert a \rVert = \lVert b \rVert = 1$ and $a \cdot b = \cos\theta$. So:

$$
\lVert a - b \rVert^2 = 2 - 2\cos\theta
$$

This identity is a classic interview question. It says that for unit vectors, a larger cosine always means a smaller distance. So the dot product, the cosine and the Euclidean distance give **the same ranking** for unit vectors.

> [!example] Worked example: from distance to cosine
> A vector store with unit vectors reports a squared distance of 0.2 for the best chunk.
>
> - $0.2 = 2 - 2\cos\theta$, so $\cos\theta = (2 - 0.2)/2 = 0.9$.
> - A squared distance of 1.0 gives $\cos\theta = 0.5$, so an angle of 60°.
> - A squared distance of 2.0 gives $\cos\theta = 0$: orthogonal.

### 6.3 Three measures, three rankings

The measures disagree when vectors have different lengths. The toy attention example shows this. At the decode step for "down", the query vector is $q_4 = [1, 2]$. The four key vectors are the keys of "the", "cat", "sat" (from the cache) and "down" itself ([L4 of part 02](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) derives them):

```text
q_4    = [1, 2]
k_the  = [1, 0]
k_cat  = [0, 2]
k_sat  = [0, 1]
k_down = [1, 1]
```

> [!example] Worked example: score the four keys three ways
> Norms: $\lVert q_4 \rVert = \sqrt{5} \approx 2.2361$. Key norms: 1, 2, 1 and $\sqrt{2} \approx 1.4142$.
>
> | Key | Dot product $q_4 \cdot k$ | Cosine | Angle | Distance $\lVert q_4 - k \rVert$ |
> |---|---|---|---|---|
> | the $[1, 0]$ | $1 \cdot 1 + 2 \cdot 0 = 1$ | $1/(2.2361 \times 1) = 0.4472$ | 63.43° | 2.0 |
> | cat $[0, 2]$ | $0 + 4 = 4$ | $4/(2.2361 \times 2) = 0.8944$ | 26.57° | 1.0 |
> | sat $[0, 1]$ | $0 + 2 = 2$ | $2/(2.2361 \times 1) = 0.8944$ | 26.57° | 1.4142 |
> | down $[1, 1]$ | $1 + 2 = 3$ | $3/(2.2361 \times 1.4142) = 0.9487$ | 18.43° | 1.0 |
>
> - The **dot product** ranks cat (4) first, then down (3), sat (2), the (1).
> - The **cosine** ranks down (0.9487) first. Cat and sat tie at 0.8944, because $[0, 2]$ and $[0, 1]$ point in the same direction.
> - The **distance** ranks cat and down first (both 1.0), then sat, then the.
>
> The raw scores $[1, 4, 2, 3]$ are exactly the attention scores of "down" before scaling. Attention uses the dot product. So "cat" gets the largest weight (0.5388 after scaling and softmax), although the key of "down" points closest to the query.

Why does the key of "cat" win? Its arrow is twice as long as the key of "sat", in the same direction. The dot product rewards length. In attention, this is a feature. A key with a large norm acts like a loud voice. A query with a large norm makes the softmax sharper. In retrieval, the same effect is usually unwanted, so retrieval normalizes the vectors.

### 6.4 Which measure, when

| Measure | Uses length? | Range | Typical use |
|---|---|---|---|
| Dot product | Yes | Any real number | Attention scores. Retrieval with unit vectors or with models trained for the dot product. |
| Cosine similarity | No | −1 to 1 | Embedding search. Comparison of directions only. |
| Euclidean distance | Yes | 0 or more | Some vector indexes (L2 indexes). For unit vectors it ranks like cosine. |

The rule for retrieval is simple: learn whether your embedding model returns unit vectors. If it does, all three measures give the same ranking. If it does not, use the measure that the model card recommends. The older lesson [Embeddings and similarity](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) gives provider details, and [L2 of part 06](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) goes deeper.

## 7. Dot products in high dimensions

Real query and key vectors have 64 or 128 components per head. High dimensions change the typical size of a dot product.

**Statement from the source.** Vaswani et al. (2017), footnote 4, assume that the components of $q$ and $k$ are independent random variables with mean 0 and variance 1. Then $q \cdot k$ has mean 0 and variance $d_k$.

**The derivation.** Each product $q_i k_i$ has mean $E[q_i]E[k_i] = 0$. Its variance is $E[q_i^2 k_i^2] = E[q_i^2]E[k_i^2] = 1 \times 1 = 1$. The $d_k$ products are independent, so their variances add: the sum has variance $d_k$. Its standard deviation is $\sqrt{d_k}$.

> [!example] Worked example: measured with NumPy (10,000 random pairs, seed 0)
> | $d$ | Standard deviation of $q \cdot k$ | $\sqrt{d}$ | Standard deviation of the cosine | $1/\sqrt{d}$ |
> |---|---|---|---|---|
> | 2 | 1.423 | 1.414 | 0.7046 | 0.7071 |
> | 16 | 4.008 | 4.000 | 0.2498 | 0.2500 |
> | 128 | 11.430 | 11.314 | 0.0891 | 0.0884 |
> | 4,096 | 64.195 | 64.000 | 0.0157 | 0.0156 |
>
> The measured values match the theory within about 1%.

Two consequences follow:

1. **Raw dot products grow like $\sqrt{d_k}$.** With $d_k = 128$, typical scores are about ±11. Softmax of numbers that large puts almost all the weight on one key. That is why attention divides the scores by $\sqrt{d_k}$: the scaled scores have a standard deviation near 1 again. [L3 of part 02](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) shows the softmax saturation with numbers.
2. **Random directions are almost orthogonal.** In 4,096 dimensions, the cosine of two random vectors is almost always close to 0 (standard deviation 0.0156). So a cosine of 0.3 between two embeddings is already a strong signal, not a weak one.

## 8. Why attention and embeddings both use dot products

The dot product is not the only possible match score. Systems use it for four reasons.

1. **It is a good match score.** It is large when two vectors share direction, and it can be negative. Section 5.3 proves this.
2. **It is cheap.** One dot product of length $d$ costs $d$ multiplications and $d - 1$ additions (section 9).
3. **Many dot products form one matrix multiplication.** The scores of every query against every key are the matrix $QK^\top$. GPUs compute matrix multiplications very fast ([L2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) and [L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth)).
4. **It is easy to learn.** The dot product is linear in each input. Training can change $W_Q$ and $W_K$ to make a query point toward the keys it needs. Gradients flow through it without problems.

| System | Score | Normalized? |
|---|---|---|
| Attention (Vaswani et al., 2017) | $q \cdot k / \sqrt{d_k}$ | No. Length carries information. Some recent models normalize $q$ and $k$ first: the Gemma 3 report states "we replace the soft-capping of Gemma 2 with QK-norm". |
| Embedding retrieval | $\cos(q, d)$, or $q \cdot d$ on unit vectors | Usually yes. |
| Next-token logits | $h \cdot e_{token}$ for every token of the vocabulary | No. The final hidden state $h$ is compared with one weight vector per token ([L1 of part 02](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors)). |

So one operation appears three times in an LLM system: to score keys, to score documents, and to score the next token.

## 9. The cost of a dot product

**Arithmetic.** A dot product of length $d$ needs $d$ multiplications and $d - 1$ additions. The convention in this guide counts one multiplication plus one addition as 2 **FLOPs** (floating-point operations). So a dot product costs about $2d$ FLOPs. For $d = 4{,}096$: 4,096 multiplications and 4,095 additions, about 8,192 FLOPs.

**Memory.** The computer must also read both vectors from memory. In BF16, each number takes 2 bytes ([L4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory)). So two vectors of length $d$ take $4d$ bytes.

> [!example] Worked example: FLOPs per byte of one dot product
> Two BF16 vectors with $d = 128$ (one head of Llama-3.1-8B):
>
> - FLOPs: about $2 \times 128 = 256$.
> - Bytes read: $2 \times 128 \times 2 = 512$.
> - Ratio: $256 / 512 = 0.5$ FLOPs per byte.

Half a FLOP for each byte is very little work per byte. [L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) shows that an H100 needs about 295 FLOPs per byte to keep its arithmetic units busy. So a lone dot product waits for memory almost all the time. This is the first hint of why the decode phase of an LLM is limited by memory, not by arithmetic.

> [!key] The main idea of this lesson
> The dot product $a \cdot b = \sum_i a_i b_i = \lVert a \rVert \lVert b \rVert \cos\theta$ is one number that grows with alignment and with length. Cosine similarity removes the length. For unit vectors, dot product, cosine and squared distance ($2 - 2\cos\theta$) give the same ranking. Attention uses the raw dot product, scaled by $1/\sqrt{d_k}$ because random dot products have variance $d_k$.

## 10. Code

### 10.1 The operations in NumPy

```python
import numpy as np

q = np.array([1.0, 2.0])                    # query of "down"
K = np.array([[1.0, 0.0],                   # key of "the"
              [0.0, 2.0],                   # key of "cat"
              [0.0, 1.0],                   # key of "sat"
              [1.0, 1.0]])                  # key of "down"

dots = K @ q                                # one dot product per row of K
norms = np.linalg.norm(K, axis=1)           # the norm of each key
cos = dots / (np.linalg.norm(q) * norms)    # cosine similarity
dist = np.linalg.norm(q - K, axis=1)        # Euclidean distance (q broadcasts over rows)

print(dots)                 # [1. 4. 2. 3.]
print(np.round(cos, 4))     # [0.4472 0.8944 0.8944 0.9487]
print(np.round(dist, 4))    # [2.     1.     1.4142 1.    ]
```

What each important line does:

- `K @ q`: the `@` operator multiplies the 4×2 matrix `K` by the vector `q`. Each output is the dot product of one row of `K` with `q`. [L2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) explains this rule.
- `np.linalg.norm(K, axis=1)`: the norm of each row. `axis=1` means "along the components of each row". Without `axis`, NumPy returns one norm of the whole matrix.
- `q - K`: NumPy subtracts `q` from every row of `K`. This is broadcasting ([L3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches)).
- The printed values match the table of section 6.3.

### 10.2 The same thing without NumPy

```python
import math

def dot(a, b):
    if len(a) != len(b):
        raise ValueError("vectors must have the same dimension")
    total = 0.0
    for x, y in zip(a, b):
        total += x * y          # one multiplication and one addition
    return total

def norm(a):
    return math.sqrt(dot(a, a))  # the self dot product is the squared norm

print(dot([1, 0, 1, 0], [1, 1, 0, 0]))   # 1.0  (the, sat)
print(round(norm([0, 1, 1, 0]), 4))      # 1.4142  (down)
```

The loop makes the cost visible: one multiplication and one addition per component, so about $2d$ FLOPs. The length check matters. NumPy would raise an error for different lengths, but `zip` alone would silently ignore the extra components.

### 10.3 Exercises

Write these in your lab folder `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, notebook folder `llm-systems/`, file `01-vectors.ipynb`.

1. **Similarity functions from zero.** With plain Python (no NumPy), write `dot`, `norm`, `cosine` and `sq_dist`. Reproduce the table of section 6.3.
   - Acceptance test: your four functions print the dot products `[1, 4, 2, 3]`, the cosines `[0.4472, 0.8944, 0.8944, 0.9487]` and the distances `[2.0, 1.0, 1.4142, 1.0]`. `cosine([0, 0], [1, 2])` raises `ValueError`.
   - Hint 1: `cosine` needs both norms. Test for a zero norm before you divide.
   - Hint 2: `sq_dist(a, b)` can reuse `dot`: it is `dot(d, d)` for the difference vector `d`.
2. **The identity, tested.** Draw 1,000 random pairs of vectors with 384 components. Check $\lVert a - b \rVert^2 = \lVert a \rVert^2 + \lVert b \rVert^2 - 2\,a \cdot b$ for each pair. Then normalize both vectors and check $\lVert \hat{a} - \hat{b} \rVert^2 = 2 - 2\cos\theta$.
   - Acceptance test: the largest absolute error of each identity is below $10^{-9}$.
   - Hint 1: `np.random.default_rng(0).standard_normal((1000, 384))` gives 1,000 random rows.
   - Hint 2: compute row-wise with `axis=1` instead of a Python loop.
3. **Why $\sqrt{d_k}$.** For $d$ = 16, 128 and 4,096, draw 10,000 random pairs with independent standard normal components. Measure the standard deviation of the dot product, then of the dot product divided by $\sqrt{d}$.
   - Acceptance test: the first value is within 5% of $\sqrt{d}$. The second is within 5% of 1.
   - Hint 1: the dot products of many pairs at once are `(a * b).sum(axis=1)`.
   - Hint 2: `np.std` gives the standard deviation.

## 11. Common mistakes

1. **"The dot product measures only the angle."** It measures the angle and both lengths: $\lVert a \rVert \lVert b \rVert \cos\theta$. Only the cosine similarity ignores length. In section 6.3, the key of "cat" wins the dot product only because it is twice as long as the key of "sat".
2. **"Cosine, dot product and distance can give different rankings, so I must always choose carefully."** For unit vectors they always give the same ranking, because $\lVert a - b \rVert^2 = 2 - 2\cos\theta$. The choice matters only when lengths vary.
3. **"A dot product of 0 means the vectors are unrelated in meaning."** It means the vectors are orthogonal in this space. Whether that means "unrelated" depends on how the model learned the space.
4. **"Attention uses cosine similarity."** Standard attention uses the raw dot product divided by $\sqrt{d_k}$. Lengths of queries and keys carry information. Some models add a normalization of $q$ and $k$ (QK-norm), but that is a design choice of those models.
5. **"Dividing by $\sqrt{d_k}$ normalizes the vectors."** It does not change any direction or ranking. It divides every score by the same constant to keep the softmax out of saturation.
6. **"You can normalize any vector."** The zero vector has norm 0 and cannot be normalized. Code that computes a cosine must test for it.
7. **"Python and math use the same index."** Math writes $a_1$ for the first component. NumPy writes `a[0]`.

## 12. One-minute explanation

A vector is an ordered list of numbers, and you can picture it as an arrow from the origin. Its length, the norm, is the square root of the sum of its squared components. The dot product multiplies matching components and adds the products, so it gives one number. The law of cosines proves that the dot product equals the two lengths times the cosine of the angle between the arrows. So it is large when two vectors are long and point the same way, zero when they are orthogonal, and negative when they point apart. Cosine similarity divides by the two lengths and keeps only the angle. For unit vectors, the squared distance is two minus two times the cosine, so all three measures rank the same way. Attention scores every key with a dot product against the query, divided by the square root of the head dimension. The reason is that random dot products have a variance equal to the dimension. Retrieval scores chunks with the cosine of embeddings. A dot product of length $d$ costs about $2d$ FLOPs, and many of them together form one matrix multiplication, which a GPU runs very fast.

## 13. Check questions

```check
{
  "question": "Compute the dot product and the cosine similarity of $x_{cat} = [0, 1, 0, 1]$ and $x_{down} = [0, 1, 1, 0]$. What is the angle between them?",
  "hint": "Both vectors have norm $\\sqrt{2}$.",
  "answer": "Dot product: $0 \\cdot 0 + 1 \\cdot 1 + 0 \\cdot 1 + 1 \\cdot 0 = 1$. Cosine: $1 / (\\sqrt{2} \\times \\sqrt{2}) = 1/2 = 0.5$. The angle is $\\arccos(0.5) = 60°$."
}
```

```check
{
  "question": "For the query $q_4 = [1, 2]$, the dot product ranks the key of \"cat\" $[0, 2]$ above the key of \"down\" $[1, 1]$, but the cosine ranks \"down\" first. Explain the difference with numbers.",
  "answer": "Dot products: $q_4 \\cdot k_{cat} = 4$ and $q_4 \\cdot k_{down} = 3$. Cosines: $4 / (\\sqrt{5} \\times 2) = 0.8944$ and $3 / (\\sqrt{5} \\times \\sqrt{2}) = 0.9487$. The key of \"down\" points closer to the query (18.43° against 26.57°). The key of \"cat\" has norm 2, the key of \"down\" has norm $\\sqrt{2} \\approx 1.414$. The dot product multiplies the cosine by both norms, so the longer key wins. Attention uses the dot product, so \"cat\" receives the largest weight."
}
```

```check
{
  "question": "Interview follow-up: derive $a \\cdot b = \\lVert a \\rVert \\lVert b \\rVert \\cos\\theta$ on a whiteboard. Which two expansions of $\\lVert a - b \\rVert^2$ do you compare?",
  "hint": "One expansion uses geometry (the law of cosines), the other uses the dot product rules.",
  "answer": "1. Geometry: in the triangle with sides $a$, $b$ and $a - b$, drop a perpendicular from the tip of $b$ onto the line of $a$. Pythagoras gives $\\lVert a - b \\rVert^2 = (A - B\\cos\\theta)^2 + (B\\sin\\theta)^2 = A^2 + B^2 - 2AB\\cos\\theta$, with $A = \\lVert a \\rVert$, $B = \\lVert b \\rVert$.\n2. Algebra: $\\lVert a - b \\rVert^2 = (a-b)\\cdot(a-b) = a\\cdot a - 2\\,a\\cdot b + b \\cdot b = A^2 + B^2 - 2\\,a \\cdot b$.\n3. The two right sides are equal, so $a \\cdot b = AB\\cos\\theta$.\n\nA deeper follow-up: \"why is it true in 4,096 dimensions?\" Two vectors from the origin always lie in one flat plane, so the triangle argument works inside that plane. The algebraic expansion needs no picture at all."
}
```

```check
{
  "question": "Interview follow-up: show that $\\lVert a - b \\rVert^2 = 2 - 2\\cos\\theta$ for unit vectors. A vector index returns squared L2 distances 0.10, 0.50 and 1.20 for three chunks. Convert them to cosines. Does the ranking change if you sort by cosine instead?",
  "answer": "Expand: $\\lVert a - b \\rVert^2 = \\lVert a \\rVert^2 + \\lVert b \\rVert^2 - 2\\,a \\cdot b$. For unit vectors the norms are 1 and $a \\cdot b = \\cos\\theta$, so the result is $2 - 2\\cos\\theta$.\n\nCosines: $\\cos\\theta = 1 - D/2$.\n- 0.10 gives 0.95.\n- 0.50 gives 0.75.\n- 1.20 gives 0.40.\n\nThe ranking does not change. The smallest distance always has the largest cosine, because $D$ falls when $\\cos\\theta$ rises. This is only true for unit vectors. If the vectors have different norms, the two measures can disagree."
}
```

```check
{
  "question": "Interview follow-up: why does attention divide $q \\cdot k$ by $\\sqrt{d_k}$ and not by $d_k$? Give the variance argument and the numbers for $d_k = 128$.",
  "hint": "Compute the variance of a sum of $d_k$ independent products.",
  "answer": "Assume the components of $q$ and $k$ are independent, with mean 0 and variance 1 (the assumption of Vaswani et al., footnote 4). Each product $q_i k_i$ has mean 0 and variance $E[q_i^2]E[k_i^2] = 1$. The sum of $d_k$ independent products has variance $d_k$, so its standard deviation is $\\sqrt{d_k}$. For $d_k = 128$ that is about 11.31, so raw scores spread over roughly ±11 and softmax saturates. Dividing by $\\sqrt{d_k}$ brings the standard deviation back to 1. Dividing by $d_k$ would bring it to $1/\\sqrt{d_k} \\approx 0.088$. Then all scores are close to 0, the softmax weights become almost uniform, and the model can hardly prefer one key. The goal is unit variance, and $\\sqrt{d_k}$ is the factor that gives it."
}
```

```check
{
  "question": "Interview follow-up: why does standard attention use the raw dot product instead of the cosine similarity? Name one argument about information and one about cost.",
  "answer": "Information: the norms carry signal. A query with a large norm makes the softmax sharper (more confident). A key with a large norm gets more attention from many queries. Cosine would remove both effects. Cost: the scores of all queries against all keys are one matrix multiplication $QK^\\top$, which GPUs run at full speed. Cosine needs extra norm computations and divisions. Note that some recent models do normalize $q$ and $k$ (QK-norm, for example Gemma 3) to make training stable. That is a design choice, not standard attention."
}
```

```check
{
  "question": "How many FLOPs does a dot product of two vectors with 128 components cost, and how many bytes must be read in BF16? What is the ratio?",
  "answer": "128 multiplications and 127 additions, so about $2 \\times 128 = 256$ FLOPs (255 exactly). Bytes: $2 \\times 128$ numbers $\\times$ 2 bytes $= 512$ bytes. Ratio: $256/512 = 0.5$ FLOPs per byte. A GPU such as the H100 needs about 295 FLOPs per byte to keep its arithmetic busy. So a single dot product is limited by memory reads (see L5)."
}
```

```check
{
  "question": "Exercise 1: show a reference solution",
  "answer": "```python\nimport math\n\ndef dot(a, b):\n    if len(a) != len(b):\n        raise ValueError(\"vectors must have the same dimension\")\n    return sum(x * y for x, y in zip(a, b))\n\ndef norm(a):\n    return math.sqrt(dot(a, a))\n\ndef cosine(a, b):\n    na, nb = norm(a), norm(b)\n    if na == 0 or nb == 0:\n        raise ValueError(\"cosine is not defined for a zero vector\")\n    return dot(a, b) / (na * nb)\n\ndef sq_dist(a, b):\n    d = [x - y for x, y in zip(a, b)]\n    return dot(d, d)\n\nq = [1, 2]\nkeys = [[1, 0], [0, 2], [0, 1], [1, 1]]\nprint([dot(q, k) for k in keys])                           # [1, 4, 2, 3]\nprint([round(cosine(q, k), 4) for k in keys])              # [0.4472, 0.8944, 0.8944, 0.9487]\nprint([round(math.sqrt(sq_dist(q, k)), 4) for k in keys])  # [2.0, 1.0, 1.4142, 1.0]\ntry:\n    cosine([0, 0], [1, 2])\nexcept ValueError as e:\n    print(\"ValueError:\", e)\n```\n\nThe zero test comes before the division. `sq_dist` returns the squared distance, so the last print takes the square root to compare with the table."
}
```

```check
{
  "question": "Exercise 2: show a reference solution",
  "answer": "```python\nimport numpy as np\n\nrng = np.random.default_rng(0)\na = rng.standard_normal((1000, 384))\nb = rng.standard_normal((1000, 384))\n\nlhs = ((a - b) ** 2).sum(axis=1)\nrhs = (a * a).sum(axis=1) + (b * b).sum(axis=1) - 2 * (a * b).sum(axis=1)\nprint(np.abs(lhs - rhs).max() < 1e-9)          # True\n\nah = a / np.linalg.norm(a, axis=1, keepdims=True)\nbh = b / np.linalg.norm(b, axis=1, keepdims=True)\ncos = (ah * bh).sum(axis=1)\nprint(np.abs(((ah - bh) ** 2).sum(axis=1) - (2 - 2 * cos)).max() < 1e-9)   # True\n```\n\n`keepdims=True` keeps the norms as a column of shape (1000, 1), so the division broadcasts over the 384 components of each row."
}
```

```check
{
  "question": "Exercise 3: show a reference solution",
  "answer": "```python\nimport numpy as np\n\nrng = np.random.default_rng(1)\nfor d in (16, 128, 4096):\n    q = rng.standard_normal((10_000, d))\n    k = rng.standard_normal((10_000, d))\n    s = (q * k).sum(axis=1)\n    raw, scaled = s.std(), (s / np.sqrt(d)).std()\n    print(d, round(raw, 2), round(np.sqrt(d), 2), round(scaled, 3))\n    assert abs(raw / np.sqrt(d) - 1) < 0.05 and abs(scaled - 1) < 0.05\n```\n\nThe raw standard deviation follows $\\sqrt{d}$. After division by $\\sqrt{d}$ it stays near 1 for every $d$. That is exactly what the scaling in attention achieves."
}
```

## 14. Links

- Next: [L2: Matrices and matrix multiplication](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication)
- [L3 of part 02: Scaled dot-product attention, step by step](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention): the dot product inside attention, and the $\sqrt{d_k}$ scaling with numbers
- [L4 of part 02: Causal masking and generation](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation): where the decode scores $[1, 4, 2, 3]$ are computed
- [L2 of part 06: Embeddings in depth](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth): how embedding models learn their vectors
- [L5: GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth): why 0.5 FLOPs per byte is a problem
- Older lesson: [Embeddings and similarity](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity)
- [Glossary](/notes/ai/llm-systems/glossary)

### Sources

- Vaswani et al., "Attention Is All You Need", NeurIPS 2017, arXiv 1706.03762, footnote 4 on the variance of $q \cdot k$: https://arxiv.org/abs/1706.03762 (checked on 2026-10-15)
- Gemma Team, "Gemma 3 Technical Report", arXiv 2503.19786, section 2 on QK-norm: https://arxiv.org/abs/2503.19786 (checked on 2026-10-15)
- NumPy documentation, `numpy.linalg.norm` and `numpy.matmul`: https://numpy.org/doc/stable/reference/generated/numpy.linalg.norm.html (checked on 2026-10-15)
- All numbers in the worked examples were computed in these notes with NumPy 2.5.
