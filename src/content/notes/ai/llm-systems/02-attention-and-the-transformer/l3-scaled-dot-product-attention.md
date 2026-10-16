---
title: "L3: Scaled dot-product attention, step by step"
order: 3
summary: "The formula softmax(QK^T / sqrt(d_k)) V with every shape, the full toy example by hand, the derivation of the square-root scale, why softmax, why separate keys and values, why attention needs positions, its O(T^2 d) cost, and a 10-line NumPy implementation."
status: not-started
tags: [attention, scaled-dot-product, softmax, query-key-value, scaling, complexity, numpy, core]
---

## 1. The question this idea answers

Lesson [L2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) gave the idea: each token compares its query with the keys of other tokens and takes a weighted average of their values. Now you need the exact computation. An interviewer will ask you to write the formula, to name the shape of every matrix, and to explain every symbol.

The usual follow-up questions are precise. Why divide by $\sqrt{d_k}$, and why not by $d_k$? Why a softmax? Why are keys and values different vectors? Does attention know the order of the words? What does it cost for 8,192 tokens? What is the origin of the matrices $W_Q$, $W_K$, $W_V$? This lesson answers each question with a derivation and numbers that you can recompute.

## 2. Mental model

> [!analogy] A search engine that blends its results
> You type a question into a search engine. The engine compares your question with the title of every page. It does not return only the best page. It returns one blended page: each page contributes a share, and pages with better-matching titles get larger shares. In attention, your question is the **query**, the titles are the **keys** and the page contents are the **values**. Every token is a searcher and also a page, at the same time.
>
> **Where it stops working:** the questions, titles and contents are vectors that three learned matrices compute from the same hidden states. The engine also divides every match score by $\sqrt{d_k}$ before it blends, to keep the blend from collapsing onto one page. And the engine does not know where a page is in the text, unless position information is added (section 10).

## 3. Terms

| Term | Plain meaning |
|---|---|
| $X$ | The input matrix of one attention layer: one hidden state per row, shape $[T, d]$. |
| $T$ | The number of tokens in the sequence. |
| $d$ | The model width: the length of each hidden state. The paper writes $d_{model}$. |
| $d_k$ | The length of each query vector and each key vector in one head. |
| $d_v$ | The length of each value vector in one head. In Llama, $d_k = d_v = d_h = 128$. |
| $W_Q$, $W_K$, $W_V$ | The learned projection matrices. They map hidden states to queries, keys and values. |
| projection | A matrix product that maps a vector to another space, for example $q_i = x_i W_Q$. |
| score | The dot product of one query with one key. A high score means a good match. |
| score matrix $S$ | All scores of a sequence: $S = QK^\top$, shape $[T, T]$. Row $i$ belongs to query $i$. |
| scaling | The division of every score by $\sqrt{d_k}$. |
| softmax | The function that changes a row of scores into positive weights that sum to 1. |
| attention matrix $P$ | The matrix of attention weights after the softmax, shape $[T, T]$. |
| output $O$ | The weighted averages of the values: $O = PV$, shape $[T, d_v]$. |
| saturation | A softmax with one weight near 1 and all others near 0. Its gradients are close to zero. |
| Jacobian | The table of all partial derivatives of the outputs of a function with respect to its inputs. |
| permutation equivariance | Reordering the input rows reorders the output rows in the same way, and changes nothing else. |
| logit | A raw score before a softmax. In attention, the scaled scores are the logits of the softmax. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. The formula and its shapes

### 4.1 The formula

Vaswani et al. (2017, §3.2.1, Equation 1) define scaled dot-product attention:

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V
$$

with the three inputs computed from the same hidden states $X$:

$$
Q = X W_Q \qquad K = X W_K \qquad V = X W_V
$$

The same formula for one query row $i$ makes the softmax explicit:

$$
s_{ij} = \frac{q_i \cdot k_j}{\sqrt{d_k}}
\qquad
p_{ij} = \frac{e^{s_{ij}}}{\sum_{m=1}^{T} e^{s_{im}}}
\qquad
o_i = \sum_{j=1}^{T} p_{ij} \, v_j
$$

- $q_i$, $k_j$, $v_j$ are row $i$ of $Q$, row $j$ of $K$ and row $j$ of $V$.
- $s_{ij}$ is the scaled score of query $i$ against key $j$.
- $p_{ij}$ is the attention weight. For each $i$, the weights $p_{i1}, \dots, p_{iT}$ are positive and sum to 1.
- $o_i$ is the output of token $i$: a weighted average of all value vectors.

> [!key] The four operations, in order
> 1. **Project:** $Q = XW_Q$, $K = XW_K$, $V = XW_V$.
> 2. **Score and scale:** $S = QK^\top / \sqrt{d_k}$.
> 3. **Normalize each row:** $P = \mathrm{softmax}(S)$, along the key axis.
> 4. **Mix:** $O = PV$.

### 4.2 Every shape

Lesson [L2 of part 01](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) gives the shape rule $(m \times k)(k \times n) = (m \times n)$. Apply it at each step:

| Quantity | Formula | Shape | Toy | Llama-3.1-8B, one head |
|---|---|---|---|---|
| input | $X$ | $[T, d]$ | $[3, 4]$ | $[T, 4096]$ |
| query projection | $W_Q$ | $[d, d_k]$ | $[4, 2]$ | $[4096, 128]$ |
| key projection | $W_K$ | $[d, d_k]$ | $[4, 2]$ | $[4096, 128]$ |
| value projection | $W_V$ | $[d, d_v]$ | $[4, 2]$ | $[4096, 128]$ |
| queries | $XW_Q$ | $[T, d_k]$ | $[3, 2]$ | $[T, 128]$ |
| keys | $XW_K$ | $[T, d_k]$ | $[3, 2]$ | $[T, 128]$ |
| values | $XW_V$ | $[T, d_v]$ | $[3, 2]$ | $[T, 128]$ |
| scores | $QK^\top / \sqrt{d_k}$ | $[T, T]$ | $[3, 3]$ | $[T, T]$ |
| weights | $\mathrm{softmax}(S)$ | $[T, T]$ | $[3, 3]$ | $[T, T]$ |
| outputs | $PV$ | $[T, d_v]$ | $[3, 2]$ | $[T, 128]$ |

Two facts to remember. First, $QK^\top$ needs $Q$ and $K$ to have the same width $d_k$, because each score is a dot product. $V$ can have a different width $d_v$. Second, the score matrix is $[T, T]$ whatever $d$ is. That square is the cost of attention (section 12).

### 4.3 Shapes with a batch and heads

A real layer runs a batch of $B$ sequences and $H$ heads at the same time. The library reshapes the queries to $[B, H, T, d_h]$ ([part 01 L3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches)). Then the same formula runs on the last two axes:

$$
[B, H, T, d_h] \times [B, H, d_h, T] = [B, H, T, T]
\qquad
[B, H, T, T] \times [B, H, T, d_h] = [B, H, T, d_h]
$$

The PyTorch function `torch.nn.functional.scaled_dot_product_attention` documents exactly these shapes: query $(N, \dots, H_q, L, E)$, key $(N, \dots, H, S, E)$, value $(N, \dots, H, S, E_v)$, output $(N, \dots, H_q, L, E_v)$. Its `scale` argument defaults to $1/\sqrt{E}$. Lesson [L5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) explains the heads.

## 5. The toy example by hand

### 5.1 The inputs

Every attention page of this guide uses the same toy. Four tokens, $d = 4$, one head, $d_k = d_v = 2$. This lesson uses the first three tokens: "the", "cat", "sat".

```text
x_the  = [1, 0, 1, 0]
x_cat  = [0, 1, 0, 1]
x_sat  = [1, 1, 0, 0]

W_Q = [[0,0],[0,1],[1,1],[0,0]]
W_K = [[0,0],[0,1],[1,0],[0,1]]
W_V = [[1,1],[0,1],[1,2],[2,1]]
```

The weights are hand-picked so that the numbers stay small. A trained model has learned weights.

### 5.2 Step 1: the projections

A row vector times a matrix is a weighted sum of the matrix rows. The weights are the entries of the vector.

> [!example] Worked example: the query of "the"
> $x_{the} = [1, 0, 1, 0]$. Take 1 × row 1 + 0 × row 2 + 1 × row 3 + 0 × row 4 of $W_Q$:
>
> $q_{the} = 1 \cdot [0, 0] + 0 \cdot [0, 1] + 1 \cdot [1, 1] + 0 \cdot [0, 0] = [1, 1]$
>
> The same rule for the key and the value of "the":
>
> - $k_{the} = 1 \cdot [0, 0] + 1 \cdot [1, 0] = [1, 0]$ (rows 1 and 3 of $W_K$)
> - $v_{the} = 1 \cdot [1, 1] + 1 \cdot [1, 2] = [2, 3]$ (rows 1 and 3 of $W_V$)

The same computation for all three tokens:

| Token | $x$ | rows used | $q$ | $k$ | $v$ |
|---|---|---|---|---|---|
| the | [1, 0, 1, 0] | 1 and 3 | [1, 1] | [1, 0] | [2, 3] |
| cat | [0, 1, 0, 1] | 2 and 4 | [0, 1] | [0, 2] | [2, 2] |
| sat | [1, 1, 0, 0] | 1 and 2 | [0, 1] | [0, 1] | [1, 2] |

Check one more by hand: $k_{cat}$ = row 2 + row 4 of $W_K$ = $[0, 1] + [0, 1] = [0, 2]$. So:

$$
Q = \begin{bmatrix} 1 & 1 \\ 0 & 1 \\ 0 & 1 \end{bmatrix}
\quad
K = \begin{bmatrix} 1 & 0 \\ 0 & 2 \\ 0 & 1 \end{bmatrix}
\quad
V = \begin{bmatrix} 2 & 3 \\ 2 & 2 \\ 1 & 2 \end{bmatrix}
$$

Note that "cat" and "sat" have the same query $[0, 1]$. Their rows of scores will therefore be equal. Keep this in mind for step 5.

### 5.3 Step 2: the scores

Entry $(i, j)$ of $QK^\top$ is $q_i \cdot k_j$. Row $i$ belongs to the token that reads. Column $j$ belongs to the token that is read.

> [!example] Worked example: the score matrix
> Row "the", $q = [1, 1]$:
>
> - against $k_{the} = [1, 0]$: $1 \cdot 1 + 1 \cdot 0 = 1$
> - against $k_{cat} = [0, 2]$: $1 \cdot 0 + 1 \cdot 2 = 2$
> - against $k_{sat} = [0, 1]$: $1 \cdot 0 + 1 \cdot 1 = 1$
>
> Rows "cat" and "sat", $q = [0, 1]$: the scores are $0$, $2$ and $1$.
>
> $$QK^\top = \begin{bmatrix} 1 & 2 & 1 \\ 0 & 2 & 1 \\ 0 & 2 & 1 \end{bmatrix}$$

The matrix is not symmetric. "the" reading "cat" scores 2, but "cat" reading "the" scores 0. Section 9 explains why this matters.

### 5.4 Step 3: the scaling

Here $d_k = 2$, so divide every score by $\sqrt{2} \approx 1.4142$:

$$
S = \frac{QK^\top}{\sqrt{2}} = \begin{bmatrix} 0.7071 & 1.4142 & 0.7071 \\ 0 & 1.4142 & 0.7071 \\ 0 & 1.4142 & 0.7071 \end{bmatrix}
$$

### 5.5 Step 4: the softmax of each row

The softmax works on each row separately. Each row becomes the attention weights of one query. Real code first subtracts the largest entry of the row. Section 8.2 proves that this does not change the result and explains why it is necessary.

> [!example] Worked example: the softmax of row "sat", with the subtract-the-max trick
> 1. Row: $[0, 1.4142, 0.7071]$. The maximum is $1.4142$.
> 2. Subtract it: $[-1.4142, 0, -0.7071]$.
> 3. Exponentials: $e^{-1.4142} = 0.2431$, $e^{0} = 1$, $e^{-0.7071} = 0.4931$.
> 4. Sum: $0.2431 + 1 + 0.4931 = 1.7362$.
> 5. Divide: $0.2431 / 1.7362 = 0.1400$, $1 / 1.7362 = 0.5760$, $0.4931 / 1.7362 = 0.2840$.
>
> Check without the trick: $e^{0} = 1$, $e^{1.4142} = 4.1133$, $e^{0.7071} = 2.0281$, sum $7.1414$. Then $1 / 7.1414 = 0.1400$, $4.1133 / 7.1414 = 0.5760$, $2.0281 / 7.1414 = 0.2840$. Same weights.

> [!example] Worked example: the softmax of row "the"
> 1. Row: $[0.7071, 1.4142, 0.7071]$. Subtract the maximum $1.4142$: $[-0.7071, 0, -0.7071]$.
> 2. Exponentials: $[0.4931, 1, 0.4931]$. Sum: $1.9861$.
> 3. Weights: $[0.2483, 0.5035, 0.2483]$.

Row "cat" has the same scores as row "sat", so it has the same weights. The attention matrix is:

$$
P = \begin{bmatrix} 0.2483 & 0.5035 & 0.2483 \\ 0.1400 & 0.5760 & 0.2840 \\ 0.1400 & 0.5760 & 0.2840 \end{bmatrix}
$$

Each row sums to 1. Every token gives the largest weight to "cat", because $k_{cat} = [0, 2]$ has the largest second entry and every query has a second entry of 1.

### 5.6 Step 5: the weighted sum

> [!example] Worked example: the output of "sat"
> $o_{sat} = 0.1400 \cdot [2, 3] + 0.5760 \cdot [2, 2] + 0.2840 \cdot [1, 2]$
>
> - First entry: $0.2800 + 1.1520 + 0.2840 = 1.7160$
> - Second entry: $0.4200 + 1.1520 + 0.5680 = 2.1400$
>
> So $o_{sat} = [1.7160, 2.1400]$.

For "the": $0.2483 \cdot [2, 3] + 0.5035 \cdot [2, 2] + 0.2483 \cdot [1, 2] = [1.7517, 2.2483]$. The full result:

$$
O = PV = \begin{bmatrix} 1.7517 & 2.2483 \\ 1.7160 & 2.1400 \\ 1.7160 & 2.1400 \end{bmatrix}
$$

![Alt text: the toy computation from X to Q, K and V, the scores, the weights and the outputs, with every number of this section.](/notes/media/llm-systems/figures/02-3-attention-toy.svg)

### 5.7 The decoder version of the same numbers

The model of this guide is a decoder. A decoder adds a causal mask before the softmax: each token may read only itself and earlier tokens. Lesson [L4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) computes it. Here is only the result, to connect the pages:

| Row | Weights without a mask (this lesson) | Weights with the causal mask (L4) | Output with the causal mask |
|---|---|---|---|
| the | [0.2483, 0.5035, 0.2483] | [1, 0, 0] | [2, 3] |
| cat | [0.1400, 0.5760, 0.2840] | [0.1956, 0.8044, 0] | [2, 2.1956] |
| sat | [0.1400, 0.5760, 0.2840] | [0.1400, 0.5760, 0.2840] | [1.7160, 2.1400] |

Row "sat" is the same in both columns. "sat" is the last token, so the mask hides nothing from it.

```video
{
  "src": "/notes/media/llm-systems/manim/m04-attention-soft-lookup.mp4",
  "caption": "The toy example as a soft lookup: queries meet keys, the softmax makes weights, and the weights mix the values."
}
```

## 6. The code: attention in 10 lines

```python
import numpy as np

def softmax(S):
    S = S - S.max(axis=-1, keepdims=True)       # subtract the row maximum
    E = np.exp(S)                               # every entry is now in (0, 1]
    return E / E.sum(axis=-1, keepdims=True)    # each row sums to 1

def attention(X, W_Q, W_K, W_V):
    Q, K, V = X @ W_Q, X @ W_K, X @ W_V         # [T, d_k], [T, d_k], [T, d_v]
    S = Q @ K.T / np.sqrt(K.shape[-1])          # [T, T] scaled scores
    P = softmax(S)                              # [T, T] attention weights
    return P @ V, P                             # [T, d_v] outputs and the weights

X = np.array([[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]], dtype=float)   # the, cat, sat
W_Q = np.array([[0, 0], [0, 1], [1, 1], [0, 0]], dtype=float)
W_K = np.array([[0, 0], [0, 1], [1, 0], [0, 1]], dtype=float)
W_V = np.array([[1, 1], [0, 1], [1, 2], [2, 1]], dtype=float)

O, P = attention(X, W_Q, W_K, W_V)
print(P.round(4))
print(O.round(4))
```

Line by line:

1. `S.max(axis=-1, keepdims=True)` finds the maximum of each row. `keepdims=True` keeps the shape $[T, 1]$, so broadcasting subtracts it from every entry of its own row.
2. `np.exp(S)` is now safe: every entry is at most 0, so every exponential is at most 1.
3. `E.sum(axis=-1, keepdims=True)` sums each row. The division makes each row sum to 1. The axis must be the **key** axis, the last one.
4. `X @ W_Q` and the two other products are the three projections. One matrix product projects all tokens at the same time.
5. `Q @ K.T` computes all $T \times T$ dot products in one product. `K.shape[-1]` is $d_k$.
6. `P @ V` mixes the values. Row $i$ of the result is $\sum_j p_{ij} v_j$.

The program prints the matrix $P$ and the matrix $O$ of section 5. PyTorch gives the same result:

```python
import torch
import torch.nn.functional as F

X = torch.tensor([[1., 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]])
W_Q = torch.tensor([[0., 0], [0, 1], [1, 1], [0, 0]])
W_K = torch.tensor([[0., 0], [0, 1], [1, 0], [0, 1]])
W_V = torch.tensor([[1., 1], [0, 1], [1, 2], [2, 1]])

Q, K, V = X @ W_Q, X @ W_K, X @ W_V
O = F.scaled_dot_product_attention(Q[None], K[None], V[None])   # add a batch axis
print(O[0])
```

The output is `[[1.7517, 2.2483], [1.7160, 2.1400], [1.7160, 2.1400]]`. Measured in these notes with PyTorch 2.14.1. In real models, the same lines appear. The Meta reference code for Llama 3 computes `torch.matmul(xq, keys.transpose(2, 3)) / math.sqrt(self.head_dim)`. Hugging Face Transformers uses `scaling = head_dim**-0.5`. Both compute the softmax in FP32.

## 7. Why divide by $\sqrt{d_k}$

### 7.1 What the paper says

Vaswani et al. (§3.2.1) write that "for large values of $d_k$, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients". To counteract this, they scale the dot products by $1/\sqrt{d_k}$. Footnote 4 gives the reason for the size. Assume that the components of $q$ and $k$ are independent random variables with mean 0 and variance 1. Then $q \cdot k$ "has mean 0 and variance $d_k$". The next three subsections derive this and show its effect with numbers.

### 7.2 Derivation: the variance of a dot product

Take $q, k \in \mathbb{R}^{d_k}$. Assume that all $2 d_k$ entries are independent, with mean 0 and variance 1. This is the assumption of the paper. Interpretation of these notes: it describes random weights at the start of training better than trained weights. The dot product is a sum of $d_k$ terms:

$$
q \cdot k = \sum_{i=1}^{d_k} q_i k_i
$$

**Mean of one term.** Independence lets you split the expectation: $E[q_i k_i] = E[q_i] \, E[k_i] = 0 \cdot 0 = 0$.

**Variance of one term.** Use $\mathrm{Var}(Z) = E[Z^2] - (E[Z])^2$:

$$
\mathrm{Var}(q_i k_i) = E[q_i^2 k_i^2] - 0^2 = E[q_i^2] \, E[k_i^2] = 1 \cdot 1 = 1
$$

$E[q_i^2] = 1$ because $\mathrm{Var}(q_i) = E[q_i^2] - (E[q_i])^2 = E[q_i^2] - 0 = 1$.

**Variance of the sum.** The $d_k$ terms are independent, so their variances add:

$$
\mathrm{Var}(q \cdot k) = \sum_{i=1}^{d_k} \mathrm{Var}(q_i k_i) = d_k
$$

So the standard deviation of a score is $\sqrt{d_k}$. For $d_k = 128$ it is about 11.31. **Divide by $\sqrt{d_k}$:** $\mathrm{Var}(q \cdot k / \sqrt{d_k}) = d_k / d_k = 1$. A constant $c$ changes a variance by $c^2$, so dividing by $\sqrt{d_k}$ divides the variance by $d_k$. The scaled scores have variance 1 for every head width.

Measured in these notes, with 200,000 random pairs for each width (NumPy, seed 0):

| $d_k$ | Variance of $q \cdot k$ | Variance after dividing by $\sqrt{d_k}$ |
|---|---|---|
| 16 | 16.0 | 0.998 |
| 64 | 63.8 | 0.997 |
| 128 | 128.3 | 1.003 |

### 7.3 What large scores do to the softmax

Softmax depends on the differences between scores. When the scores spread over a range of about $\pm 1$, the softmax gives a blend. When they spread over $\pm 11$, the largest score takes almost all the weight.

> [!example] Worked example: the same four scores, with and without the scale
> Take four scaled scores with a spread of about 1: $z = [1.2, 0.3, -0.5, -1.0]$. Their softmax is $[0.5882, 0.2392, 0.1075, 0.0652]$: a blend.
>
> Without the scale, at $d_k = 128$, the same match quality gives scores that are $\sqrt{128} = 11.31$ times larger: $[13.58, 3.39, -5.66, -11.31]$. Their softmax is about $[0.99996, 0.000038, 0.0000000044, 0.000000000015]$: almost one-hot.

### 7.4 What saturation does to the gradients

Training changes $W_Q$ and $W_K$ through the derivative of the softmax. Write $p = \mathrm{softmax}(z)$. Then $p_i = e^{z_i} / Z$ with $Z = \sum_m e^{z_m}$. The quotient rule gives:

$$
\frac{\partial p_i}{\partial z_j} = \frac{\delta_{ij} e^{z_i} Z - e^{z_i} e^{z_j}}{Z^2} = p_i (\delta_{ij} - p_j)
$$

Here $\delta_{ij}$ is 1 if $i = j$ and 0 otherwise. The table of these values is the **Jacobian** $J = \mathrm{diag}(p) - p p^\top$.

Now examine a saturated $p$, with one weight near 1 and the others near 0:

1. The diagonal entry of the winner is $p_m (1 - p_m) \approx 1 \cdot 0 = 0$.
2. Every entry in the row of a loser contains the factor $p_i \approx 0$.
3. So every entry of $J$ is close to 0. The gradient that reaches the scores is $J^\top$ times the incoming gradient, so it is also close to 0.

> [!example] Worked example: the largest Jacobian entry
> For the blended softmax $[0.5882, 0.2392, 0.1075, 0.0652]$, the largest entry of $J$ is $0.2422$. It is the diagonal entry of the winner: $0.5882 \times (1 - 0.5882)$.
>
> For the saturated softmax, the largest entry is $0.0000378$. The gradient signal is about 6,400 times smaller ($0.2422 / 0.0000378 \approx 6{,}400$).

The largest possible entry is $0.25$, at $p_i = 0.5$. The derivative is largest when the weights are not yet decided.

### 7.5 A simulation over many random queries

The worked example used one row. A simulation shows that it is typical. For each $d_k$, the simulation draws 4,000 random queries and 16 random keys per query, with entries of mean 0 and variance 1. It records the largest attention weight of each row.

```plot
{
  "title": "Average largest weight over 16 random keys: unscaled scores (red) vs scores divided by sqrt(d_k) (blue), simulated, approximate",
  "xAxis": { "label": "log2 of d_k (7 means d_k = 128)", "domain": [-0.3, 8.3] },
  "yAxis": { "label": "average largest attention weight", "domain": [0, 1] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0.2078], [1, 0.3033], [2, 0.4238], [3, 0.5607], [4, 0.6874], [5, 0.7773], [6, 0.8425], [7, 0.8885], [8, 0.9234]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 0.2078], [1, 0.3033], [2, 0.4238], [3, 0.5607], [4, 0.6874], [5, 0.7773], [6, 0.8425], [7, 0.8885], [8, 0.9234]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true },
    { "points": [[0, 0.2078], [1, 0.2263], [2, 0.2333], [3, 0.2395], [4, 0.2447], [5, 0.2441], [6, 0.2463], [7, 0.2442], [8, 0.2453]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0.2078], [1, 0.2263], [2, 0.2333], [3, 0.2395], [4, 0.2447], [5, 0.2441], [6, 0.2463], [7, 0.2442], [8, 0.2453]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true }
  ]
}
```

Measured in these notes (NumPy, seed 0):

| At $d_k = 128$, 16 keys | Unscaled | Scaled |
|---|---|---|
| average largest weight | 0.8885 | 0.2442 |
| rows with a largest weight above 0.99 | 43% | 0% |
| rows with a largest weight above 0.9 | 67% | 0% |
| median size of the Jacobian (Frobenius norm) | 0.039 | 0.304 |

With the scale, the curve stays flat: the behavior of the softmax no longer depends on the head width. Without it, a wider head means a sharper softmax and weaker gradients.

![Alt text: two bar charts of the same four scores. Left, scaled scores give the weights 0.588, 0.239, 0.108 and 0.065 and a largest Jacobian entry of 0.242. Right, unscaled scores at d_k equal to 128 give one weight of almost 1 and a largest Jacobian entry of 0.0000378.](/notes/media/llm-systems/figures/02-3-softmax-saturation.svg)

```video
{
  "src": "/notes/media/llm-systems/manim/m06-why-scale-by-sqrt-dk.mp4",
  "caption": "Dot products grow with the head width, the softmax saturates and its gradients vanish, and the division by the square root of d_k restores a spread of about 1."
}
```

### 7.6 What happens without the scale

1. **Slow training.** $W_Q$ and $W_K$ get almost no gradient while the softmax is saturated. If the entries of $q$ and $k$ have a variance near 1, as the footnote assumes, the model starts with attention that is almost one-hot. The winner is whichever key happens to score highest.
2. **A measured effect in the paper.** Vaswani et al. report that "additive attention outperforms dot product attention without scaling for larger values of $d_k$". With small $d_k$, the two kinds perform similarly.
3. **The model could compensate, in theory.** It could learn a $W_Q$ that is $\sqrt{d_k}$ times smaller. But it starts from the saturated state, where learning is slow. The scale gives it a good starting point for free.

### 7.7 Why $\sqrt{d_k}$ and not $d_k$

Dividing by $d_k$ divides the variance by $d_k^2$. The variance becomes $d_k / d_k^2 = 1/d_k$. For $d_k = 128$ the standard deviation of the scores is $1/\sqrt{128} \approx 0.088$. Measured in these notes: 0.0882. All scores are then almost equal, so every softmax row is almost uniform. Attention starts as a plain average of all values and cannot focus. The goal is a variance of exactly 1, and only $\sqrt{d_k}$ gives that.

> [!note] A known exception: the 1/d scale of muP
> Yang et al. (2022, "Tensor Programs V", the muP method) use "$1/d$ attention instead of $1/\sqrt{d}$". Their reason is a different regime: "during training, q and k will be correlated so $q^\top k$ actually scales like $d$ due to Law of Large Numbers". The $1/\sqrt{d_k}$ argument assumes independent entries, as at the start of training. Interpretation of these notes: both choices aim for scores of a stable size, and they assume different statistics of $q$ and $k$. Llama 3 uses $1/\sqrt{d_k}$.

### 7.8 The scale is a temperature

Dividing every score by $\sqrt{d_k}$ is the same as a softmax temperature $\tau = \sqrt{d_k}$ ([L1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors)). For the toy, $\tau = \sqrt{2} \approx 1.41$. For Llama-3.1-8B, $\tau = \sqrt{128} \approx 11.31$. The temperature is fixed by the architecture and is not a setting at inference.

## 8. Why a softmax

### 8.1 What the softmax gives

| Property | Why attention needs it |
|---|---|
| Every weight is positive | A token cannot "subtract" another token. Each output is a true weighted average. |
| The weights of a row sum to 1 | The output stays inside the range of the values. Its size does not grow with $T$. |
| A larger score gives a larger weight | Better matches always count more. |
| It is smooth | Every score gets a gradient (section 7.4). |
| Large score gaps give almost one-hot weights | The model can still learn sharp, almost hard lookups when they help. |

Two more facts follow from the formula. First, adding the same number to every score of a row changes nothing, because the factor $e^{c}$ cancels in the division. Second, multiplying every score by a constant changes the sharpness. That is why the scale of section 7 matters and a shift does not.

### 8.2 The subtract-the-max trick and number formats

For any constant $m$:

$$
\frac{e^{z_i - m}}{\sum_j e^{z_j - m}} = \frac{e^{-m} e^{z_i}}{e^{-m} \sum_j e^{z_j}} = \frac{e^{z_i}}{\sum_j e^{z_j}}
$$

So you may subtract any number. Choose $m = \max_j z_j$. Then every exponent is at most 0, every exponential is at most 1, and the largest one is exactly 1. The sum is at least 1, so the division is always safe.

Without the trick, large scores overflow ([part 01 L4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory)):

| Format | Largest finite number | $e^{z}$ overflows for $z$ above about |
|---|---|---|
| FP16 | 65,504 | $\ln 65{,}504 \approx 11.09$ |
| BF16 | about $3.39 \times 10^{38}$ | 88.72 |
| FP32 | about $3.40 \times 10^{38}$ | 88.72 |

Measured in these notes with PyTorch: in FP16, $e^{11.0}$ gives 59,872 and $e^{11.1}$ gives `inf`. An unscaled score of 13.58 (section 7.3) already overflows in FP16. Real code takes one more precaution. The Meta reference calls `F.softmax(scores.float(), dim=-1)`, and Hugging Face passes `dtype=torch.float32` to the softmax. The scores are computed in BF16, but the softmax runs in FP32.

> [!trap] A row with every score at minus infinity
> If every score of a row is $-\infty$, the maximum is $-\infty$ and $-\infty - (-\infty)$ is NaN. The plain softmax then returns NaN. This happens with masks ([L4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation)), not in unmasked attention.

## 9. Why three different projections

### 9.1 Why keys and values are different

The key decides **how much** a token is read. The value decides **what** the token delivers. These are different jobs.

In the toy, "cat" has the key $[0, 2]$, so every query with a positive second entry matches it strongly. But its value is $[2, 2]$. Nothing forces the value to resemble the key. Interpretation of these notes: a trained model can, for example, make a token easy to find by its grammatical role and then deliver its meaning. If $K = V$, the content of a token would have to equal its "address", and both jobs would compete for the same $d_k$ numbers. Bahdanau attention used one vector for both jobs. The Transformer separated them.

### 9.2 Why queries and keys are different

The score $q_i \cdot k_j$ is a bilinear form:

$$
q_i \cdot k_j = x_i W_Q (x_j W_K)^\top = x_i \, (W_Q W_K^\top) \, x_j^\top
$$

The matrix $M = W_Q W_K^\top$ has shape $[d, d]$ and rank at most $d_k$. It is not symmetric in general. So "token $i$ needs token $j$" can be true while "token $j$ needs token $i$" is false. In the toy, "the" reading "cat" scores 2, but "cat" reading "the" scores 0.

If $W_Q = W_K$, then $M$ is symmetric and every score matrix is symmetric. Also, the score of a token with itself, $\lVert x_i W_Q \rVert^2$, could never be negative. A token could not learn to avoid itself. Separate matrices remove both limits.

## 10. Attention has no sense of order

### 10.1 The claim

Reorder the input tokens. Self-attention without a mask returns the same output rows, in the new order. Nothing else changes. This property is **permutation equivariance**.

### 10.2 The proof

Write the reordering as a permutation matrix $\Pi$: the rows of $\Pi X$ are the rows of $X$ in a new order. Then:

1. $Q' = \Pi X W_Q = \Pi Q$, and in the same way $K' = \Pi K$ and $V' = \Pi V$.
2. $S' = Q' K'^\top / \sqrt{d_k} = \Pi \, S \, \Pi^\top$. The rows and the columns of $S$ are reordered in the same way.
3. A row-wise softmax does not care about the order of the entries in a row. So $P' = \Pi \, P \, \Pi^\top$.
4. $O' = P' V' = \Pi P \Pi^\top \Pi V = \Pi P V = \Pi O$, because $\Pi^\top \Pi = I$.

So $O' = \Pi O$: the same outputs, reordered.

```python
import numpy as np

def softmax(S):
    S = S - S.max(axis=-1, keepdims=True)
    E = np.exp(S)
    return E / E.sum(axis=-1, keepdims=True)

def attention(X, W_Q, W_K, W_V):
    Q, K, V = X @ W_Q, X @ W_K, X @ W_V
    return softmax(Q @ K.T / np.sqrt(K.shape[-1])) @ V

X = np.array([[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]], dtype=float)   # the, cat, sat
W_Q = np.array([[0, 0], [0, 1], [1, 1], [0, 0]], dtype=float)
W_K = np.array([[0, 0], [0, 1], [1, 0], [0, 1]], dtype=float)
W_V = np.array([[1, 1], [0, 1], [1, 2], [2, 1]], dtype=float)

perm = [1, 0, 2]                                   # "cat the sat"
O = attention(X, W_Q, W_K, W_V)
O_perm = attention(X[perm], W_Q, W_K, W_V)
print(O.round(4))
print(O_perm.round(4))
assert np.allclose(O_perm, O[perm])                # same rows, new order
```

"the cat sat" gives the rows $[1.7517, 2.2483]$, $[1.716, 2.14]$, $[1.716, 2.14]$. "cat the sat" gives $[1.716, 2.14]$, $[1.7517, 2.2483]$, $[1.716, 2.14]$. The output of "the" is the same vector in both orders.

### 10.3 What follows

"dog bites man" and "man bites dog" contain the same tokens. Without position information, each token would get the same output in both sentences. So every transformer adds position information. The original Transformer added a position vector to each input. Llama rotates each query and key by an angle that depends on the position (RoPE, [L6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block)).

The causal mask of a decoder also breaks the symmetry partly, because token 1 sees one token and token 100 sees 100. Haviv et al. (Findings of EMNLP 2022) report that causal language models without explicit positional encodings are "still competitive with standard models", and suggest that the mask lets the model infer positions. Llama still uses RoPE.

## 11. The attention matrix of a sequence

The matrix $P = \mathrm{softmax}(QK^\top / \sqrt{d_k})$ is the **attention matrix** of one head in one layer. It has shape $[T, T]$.

| Part of $P$ | Meaning | Toy example |
|---|---|---|
| row $i$ | How token $i$ divides its reading over all tokens. It sums to 1. | row "sat": [0.1400, 0.5760, 0.2840] |
| column $j$ | How much each token reads token $j$. It does not need to sum to 1. | column "cat": [0.5035, 0.5760, 0.5760], sum 1.6555 |
| diagonal entry $p_{ii}$ | How much token $i$ reads itself. | "the": 0.2483 |

Llama-3.1-8B has 32 layers and 32 query heads, so one forward pass makes $32 \times 32 = 1{,}024$ such matrices for each sequence. Plots of $P$ are called attention maps.

> [!trap] Softmax over the wrong axis
> The softmax must run over the **keys** (the last axis, `dim=-1`). A softmax over axis 0 makes each **column** sum to 1. The code runs without an error. But the weights of each output then do not sum to 1, and token $i$ uses information that belongs to other queries. Always test `P.sum(axis=-1)` against 1.

## 12. The cost: $O(T^2 d)$

### 12.1 Count the operations of one head

A matrix product $(m \times k)(k \times n)$ costs $2mkn$ FLOPs: one multiply and one add per term ([part 01 L2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication)).

| Step | FLOPs | Toy ($T = 3$, $d = 4$, $d_k = d_v = 2$) |
|---|---|---|
| projections $XW_Q$, $XW_K$, $XW_V$ | $3 \times 2 T d d_k$ | $3 \times 2 \times 3 \times 4 \times 2 = 144$ |
| scores $QK^\top$ | $2 T^2 d_k$ | $2 \times 9 \times 2 = 36$ |
| softmax | a few operations per score: about $T^2$ times a small constant | small |
| mix $PV$ | $2 T^2 d_v$ | $36$ |
| memory for $S$ and $P$ | $T^2$ numbers each | 9 each |

The projections grow with $T$. The scores and the mix grow with $T^2$. Over all heads, $H \cdot d_k = d$, so the $T^2$ part of a layer costs about $4 T^2 d$ FLOPs. This is the $O(n^2 \cdot d)$ of Table 1 in the paper.

### 12.2 Llama-3.1-8B, one layer, 8,192 tokens

> [!example] Worked example: when does the square win?
> One layer has $d = 4{,}096$, 32 query heads and 8 KV heads of width 128. Take $T = 8{,}192$ and no causal mask.
>
> 1. Scores and mix over all heads: $4 T^2 d = 4 \times 8{,}192^2 \times 4{,}096 \approx 1.10 \times 10^{12}$ FLOPs.
> 2. The four projections $W_Q$, $W_K$, $W_V$, $W_O$: $2T \times (2 \times 4{,}096^2 + 2 \times 4{,}096 \times 1{,}024) \approx 0.69 \times 10^{12}$ FLOPs.
> 3. The two are equal when $4 T^2 d = 2T \times 41{,}943{,}040$, so at $T = 41{,}943{,}040 / (2 \times 4{,}096) = 5{,}120$.
>
> Above about 5,120 tokens, the pairwise part of attention costs more than all the projections of the layer. A causal mask skips about half of the pairs. Then the two costs are equal at about 10,240 tokens.

### 12.3 Memory of the score matrix

One head at $T = 8{,}192$ has $8{,}192^2 = 67{,}108{,}864$ scores: 128 MiB in BF16. At $T = 131{,}072$ there are about $1.72 \times 10^{10}$ scores: 32 GiB in BF16, for one head of one layer. Nobody stores that. FlashAttention computes the same result in tiles and never writes the full matrix to GPU memory ([L7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention)). It does not reduce the FLOPs.

## 13. The origin of $W_Q$, $W_K$ and $W_V$

Nobody designs them. They are parameters, like every other weight:

1. **Start.** Training fills them with small random numbers.
2. **Forward pass.** The model predicts each next token of the training text.
3. **Loss.** The cross-entropy compares the predictions with the true next tokens.
4. **Backward pass.** Backpropagation computes the gradient of the loss with respect to every weight. The gradient reaches $W_Q$ and $W_K$ through the softmax and the scores, and $W_V$ through the weighted sum.
5. **Update.** The optimizer changes every weight a little. The steps repeat over a very large text corpus.

In Llama-3.1-8B, each layer has its own matrices. $W_Q$ has the shape $[4096, 4096]$ (32 heads of 128). $W_K$ and $W_V$ have the shape $[4096, 1024]$ (8 heads of 128). Hugging Face stores them as `q_proj`, `k_proj` and `v_proj`, with the weight shapes $[4096, 4096]$, $[1024, 4096]$ and $[1024, 4096]$, because `nn.Linear` stores $[out, in]$. After training, the weights are fixed. Inference only reads them.

### Exercises

Work in `C:\Users\ASohi\Downloads\AI\agent-harness-lab\llm-systems\02-l3-attention.ipynb`. Write each function with this page closed.

1. **Attention from an empty file.** Write `softmax(S)` and `attention(X, W_Q, W_K, W_V)`.
   - Acceptance test: for the toy, every row of $P$ sums to 1 and $O$ equals `[[1.7517, 2.2483], [1.716, 2.14], [1.716, 2.14]]` to 4 decimals. The result equals `torch.nn.functional.scaled_dot_product_attention` on the same $Q$, $K$, $V$.
   - Hint 1: four operations: project, score and scale, softmax per row, mix.
   - Hint 2: `keepdims=True` in the max and the sum keeps the shapes compatible.
2. **Measure the scale.** Measure the variance of $q \cdot k$ for $d_k$ in 16, 64, 128 and 256. Then measure the share of rows whose largest weight is above 0.99, with 16 random keys and $d_k = 128$, with and without the scale.
   - Acceptance test: each variance is within 5% of $d_k$, and within 5% of 1 after the scale. The share is above 0.3 without the scale and exactly 0 with it.
   - Hint 1: `rng.standard_normal((N, d_k))` gives $N$ random vectors.
   - Hint 2: `(q * k).sum(axis=1)` gives $N$ dot products at once.
3. **Prove equivariance numerically.** Use random $X$ of shape $[6, 8]$, random weights and a random permutation.
   - Acceptance test: `attention(X[perm])` equals `attention(X)[perm]`.
   - Hint 1: `rng.permutation(T)` gives a random order.
   - Hint 2: compare with `np.allclose`, not with `==`.
4. **A batch axis.** Write `attention_batched(Q, K, V)` for $Q, K$ of shape $[B, T, d_k]$ and $V$ of shape $[B, T, d_v]$.
   - Acceptance test: the output has shape $[B, T, d_v]$ and equals a loop over the batch.
   - Hint 1: `K.swapaxes(-1, -2)` transposes the last two axes.
   - Hint 2: the `@` operator multiplies the last two axes and keeps the leading axes.

## 14. Common mistakes

1. **"The scale is $1/d_k$."** It is $1/\sqrt{d_k}$. Dividing by $d_k$ gives scores with a variance of $1/d_k$ and an almost uniform softmax.
2. **"The scale exists to avoid overflow."** Overflow is handled by subtracting the maximum. The scale exists to keep the softmax out of saturation, so that the gradients stay useful.
3. **"The softmax runs over the queries."** It runs over the keys: each row of $S$, `dim=-1`. Each row of $P$ sums to 1.
4. **"Attention selects one token."** It returns a weighted average of all values. In the toy, "the" gives about 25%, 50% and 25%.
5. **"Keys and values are the same vectors."** Two different matrices compute them. In the toy, $k_{cat} = [0, 2]$ but $v_{cat} = [2, 2]$.
6. **"The score matrix is symmetric."** $q_i \cdot k_j$ differs from $q_j \cdot k_i$ in general. In the toy, 2 against 0.
7. **"Attention knows the word order."** Without position information it is permutation equivariant. "dog bites man" and "man bites dog" would give each token the same output.
8. **"$d_v$ must equal $d_k$."** Only $Q$ and $K$ must share a width. Llama uses equal widths by choice.
9. **"The cost of attention is only the projections."** The scores and the mix grow with $T^2$. In Llama-3.1-8B they cost more than all four projections above about 5,120 tokens.

## 15. One-minute explanation

Attention computes, for each token, a weighted average of the other tokens' information. Each hidden state is projected three times with learned matrices: a query $Q = XW_Q$, a key $K = XW_K$ and a value $V = XW_V$. The scores are all dot products $QK^\top$, a $T \times T$ matrix, divided by $\sqrt{d_k}$. A softmax over each row changes the scores into weights that are positive and sum to 1. The output is the weights times $V$. The square root is there because a dot product of random vectors with unit-variance entries has variance $d_k$. Without the division, a 128-wide head gives scores with a spread of about 11, the softmax becomes almost one-hot, and its gradients vanish. Keys and values are separate so that "how much to read a token" and "what it delivers" can differ. Attention alone ignores order, so models add positions, for example with RoPE. The cost is $O(T^2 d)$ compute and a $T \times T$ score matrix per head, which FlashAttention avoids storing.

## 16. Check questions

```check
{
  "question": "Write the attention formula. Then give the shape of $Q$, $K$, $V$, $QK^\\top$, the weights and the output for $T = 5$ tokens, $d = 8$, $d_k = 4$ and $d_v = 3$.",
  "hint": "Apply $(m \\times k)(k \\times n) = (m \\times n)$ at each step.",
  "answer": "$\\mathrm{Attention}(Q, K, V) = \\mathrm{softmax}(QK^\\top / \\sqrt{d_k}) V$ with $Q = XW_Q$, $K = XW_K$, $V = XW_V$.\n\n| Quantity | Shape |\n|---|---|\n| $X$ | $[5, 8]$ |\n| $W_Q$, $W_K$ | $[8, 4]$ |\n| $W_V$ | $[8, 3]$ |\n| $Q$, $K$ | $[5, 4]$ |\n| $V$ | $[5, 3]$ |\n| $QK^\\top$ and the weights | $[5, 5]$ |\n| output | $[5, 3]$ |\n\nThe scale is $1/\\sqrt{4} = 0.5$."
}
```

```check
{
  "question": "A new query $q = [2, 0]$ reads the three toy keys $[1, 0]$, $[0, 2]$, $[0, 1]$ with the values $[2, 3]$, $[2, 2]$, $[1, 2]$. Compute the weights and the output by hand, with $d_k = 2$.",
  "hint": "Scores first, then divide by $\\sqrt{2}$, subtract the maximum, exponentiate, normalize, mix.",
  "answer": "Dot products: $2, 0, 0$. Scaled: $[1.4142, 0, 0]$. Subtract the maximum: $[0, -1.4142, -1.4142]$. Exponentials: $[1, 0.2431, 0.2431]$, sum $1.4862$. Weights: $[0.6728, 0.1636, 0.1636]$. Output: $0.6728 \\cdot [2, 3] + 0.1636 \\cdot [2, 2] + 0.1636 \\cdot [1, 2] = [1.8364, 2.6728]$. This query matches the key of \"the\", so \"the\" gets the largest weight."
}
```

```check
{
  "question": "Interview follow-up: \"Derive why we divide by $\\sqrt{d_k}$. State your assumptions.\"",
  "hint": "Compute the mean and the variance of $q \\cdot k = \\sum_i q_i k_i$.",
  "answer": "Assume the $2 d_k$ entries of $q$ and $k$ are independent with mean 0 and variance 1 (the assumption of footnote 4 of the paper, roughly true at the start of training).\n\n1. Each term: $E[q_i k_i] = E[q_i] E[k_i] = 0$.\n2. $\\mathrm{Var}(q_i k_i) = E[q_i^2 k_i^2] - 0 = E[q_i^2] E[k_i^2] = 1$.\n3. Independent terms: $\\mathrm{Var}(q \\cdot k) = \\sum_{i=1}^{d_k} 1 = d_k$. The standard deviation is $\\sqrt{d_k}$, about 11.3 for $d_k = 128$.\n4. $\\mathrm{Var}(q \\cdot k / \\sqrt{d_k}) = d_k / d_k = 1$.\n\nWhy it matters: with a spread of about 11, the largest score dominates, the softmax becomes almost one-hot, and its Jacobian $\\mathrm{diag}(p) - pp^\\top$ is almost zero. Then $W_Q$ and $W_K$ get almost no gradient. Dividing by $\\sqrt{d_k}$ keeps the spread near 1 for every head width."
}
```

```check
{
  "question": "Interview follow-up: \"Why not divide by $d_k$? It is simpler.\"",
  "hint": "What variance would the scores then have?",
  "answer": "Dividing by $d_k$ divides the variance by $d_k^2$: $d_k / d_k^2 = 1/d_k$. For $d_k = 128$ the standard deviation is about $0.088$. All scores of a row are then almost equal, so the softmax is almost uniform and every output starts as the plain average of all values. The model could learn larger weights to compensate, but the purpose of the scale is to start every head at variance 1, and only $\\sqrt{d_k}$ does that. Advanced point: muP (Yang et al., 2022) does use $1/d$, because during training $q$ and $k$ become correlated and their dot product grows like $d$, not like $\\sqrt{d}$. Llama 3 uses $1/\\sqrt{d_k}$."
}
```

```check
{
  "question": "Interview follow-up: \"What happens if two keys in the sequence are equal? And if a key-value pair appears twice?\"",
  "hint": "Equal keys give equal scores for every query.",
  "answer": "Equal keys give equal scores for every query, so they always get equal weights. No query can tell the two tokens apart by their keys. If their values differ, the output mixes both values with the same weight. If the key and the value are both duplicated, the pair acts like one token whose score is $\\ln 2 \\approx 0.693$ higher: $2e^{s} = e^{s + \\ln 2}$. Example with $q = [0, 1]$, keys $[1, 0]$, $[0, 2]$, $[0, 2]$: the weights are $[0.1084, 0.4458, 0.4458]$. With only the two distinct keys and $\\ln 2$ added to the second score, the weights are $[0.1084, 0.8916]$, and $0.8916 = 2 \\times 0.4458$. Interpretation of these notes: this is one way in which repeated text in a prompt can pull attention toward itself."
}
```

```check
{
  "question": "What output does a query of $[0, 0]$ give for the toy keys and values? What does a query of $[0, 100]$ give?",
  "hint": "All scores equal gives a uniform softmax. Huge score gaps give an almost one-hot softmax.",
  "answer": "Query $[0, 0]$: all scores are 0, so the weights are $[1/3, 1/3, 1/3]$ and the output is the mean of the values: $[5/3, 7/3] \\approx [1.6667, 2.3333]$. Query $[0, 100]$: the scaled scores are $[0, 141.4, 70.7]$, the weight of \"cat\" is 1 to many decimals, and the output is $v_{cat} = [2, 2]$. So the length of the query acts like an inverse temperature: a long query makes attention a hard lookup."
}
```

```check
{
  "question": "Interview follow-up: \"What is the attention matrix of a sequence? What are its shape and its properties, and how many does Llama-3.1-8B make per forward pass?\"",
  "hint": "Rows, columns, sums, and layers times heads.",
  "answer": "It is $P = \\mathrm{softmax}(QK^\\top / \\sqrt{d_k})$ for one head in one layer, shape $[T, T]$. Row $i$ is how token $i$ divides its reading: all entries are positive (or exactly 0 under a mask) and the row sums to 1. Columns need not sum to 1: a column shows how much each token reads token $j$. It is not symmetric. In a decoder it is lower triangular (L4). Llama-3.1-8B has 32 layers and 32 query heads, so $32 \\times 32 = 1024$ such matrices per sequence and forward pass. At $T = 8192$ one matrix holds $8192^2 \\approx 67$ million entries, 128 MiB in BF16. FlashAttention never stores them in full."
}
```

```check
{
  "question": "Interview follow-up: \"Where do $W_Q$, $W_K$ and $W_V$ come from, and what are their shapes in Llama-3.1-8B?\"",
  "answer": "They are learned parameters. Training starts them with small random numbers and changes them by gradient descent on the next-token cross-entropy loss. The gradient reaches $W_Q$ and $W_K$ through the softmax (which is why it must not saturate) and $W_V$ through the weighted sum. Each of the 32 layers has its own three matrices. Shapes in the math convention $[d, \\text{out}]$: $W_Q$ $[4096, 4096]$ (32 heads of 128), $W_K$ and $W_V$ $[4096, 1024]$ (8 KV heads of 128). In Hugging Face they are `q_proj`, `k_proj`, `v_proj`, with `nn.Linear` weight shapes $[4096, 4096]$, $[1024, 4096]$, $[1024, 4096]$. At inference they are fixed."
}
```

```check
{
  "question": "Why does every real softmax subtract the maximum first? Give the number at which $e^{z}$ overflows in FP16.",
  "hint": "The largest finite FP16 number is 65,504.",
  "answer": "Because $e^{z}$ overflows for large $z$, and the result does not change: $e^{z_i - m} / \\sum_j e^{z_j - m} = e^{z_i} / \\sum_j e^{z_j}$ for any $m$. In FP16, $e^{z}$ overflows above $\\ln 65504 \\approx 11.09$: measured, $e^{11.0}$ gives 59,872 and $e^{11.1}$ gives `inf`. After subtracting the maximum, every exponent is at most 0, the largest exponential is exactly 1, and the sum is at least 1. Llama code also runs the softmax in FP32 (`scores.float()` in the Meta code, `dtype=torch.float32` in Hugging Face), whose limit is about 88.72."
}
```

```check
{
  "question": "What would change if a model used one matrix for queries and keys ($W_Q = W_K$)?",
  "hint": "Write the score as $x_i W_Q W_K^\\top x_j^\\top$.",
  "answer": "The score matrix $x_i W W^\\top x_j^\\top$ would be symmetric: token $i$ would always score token $j$ exactly as high as $j$ scores $i$. Real relations are often one-way (a pronoun needs its noun, the noun does not need the pronoun). Also the self-score $\\lVert x_i W \\rVert^2$ could never be negative, so a token could not learn to ignore itself. With separate matrices, $W_Q W_K^\\top$ is a general (not symmetric) matrix of rank at most $d_k$. The toy shows the asymmetry: \"the\" reading \"cat\" scores 2, \"cat\" reading \"the\" scores 0."
}
```

```check
{
  "question": "Interview follow-up: \"For one layer of Llama-3.1-8B at 32,768 tokens, compare the FLOPs of the attention scores and mix with the FLOPs of the four projections.\"",
  "hint": "Scores and mix: $4T^2 d$. Projections: $2T \\times 41{,}943{,}040$.",
  "answer": "Scores and mix: $4 \\times 32768^2 \\times 4096 \\approx 1.76 \\times 10^{13}$ FLOPs. Projections $W_Q$, $W_K$, $W_V$, $W_O$: $2 \\times 32768 \\times 41{,}943{,}040 \\approx 2.75 \\times 10^{12}$ FLOPs. Ratio: $6.4$, which equals $T / 5120$. A causal mask halves the pairwise part, so the ratio is about 3.2 in a decoder. At long context, the pairwise part of attention dominates the layer, and its memory traffic is what FlashAttention reduces (L7)."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\nimport numpy as np\nimport torch\nimport torch.nn.functional as F\n\ndef softmax(S):\n    S = S - S.max(axis=-1, keepdims=True)\n    E = np.exp(S)\n    return E / E.sum(axis=-1, keepdims=True)\n\ndef attention(X, W_Q, W_K, W_V):\n    Q, K, V = X @ W_Q, X @ W_K, X @ W_V\n    P = softmax(Q @ K.T / np.sqrt(K.shape[-1]))\n    return P @ V, P\n\nX = np.array([[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]], dtype=float)\nW_Q = np.array([[0, 0], [0, 1], [1, 1], [0, 0]], dtype=float)\nW_K = np.array([[0, 0], [0, 1], [1, 0], [0, 1]], dtype=float)\nW_V = np.array([[1, 1], [0, 1], [1, 2], [2, 1]], dtype=float)\n\nO, P = attention(X, W_Q, W_K, W_V)\nassert np.allclose(P.sum(axis=1), 1.0)\nassert np.allclose(O, [[1.7517, 2.2483], [1.716, 2.14], [1.716, 2.14]], atol=1e-4)\n\nt = lambda a: torch.tensor(a, dtype=torch.float64)[None]   # add a batch axis\nO_ref = F.scaled_dot_product_attention(t(X @ W_Q), t(X @ W_K), t(X @ W_V))[0].numpy()\nassert np.allclose(O, O_ref)\nprint(\"all tests pass\")\n```\n\nThe script prints `all tests pass`."
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\nimport numpy as np\n\ndef softmax(S):\n    S = S - S.max(axis=-1, keepdims=True)\n    E = np.exp(S)\n    return E / E.sum(axis=-1, keepdims=True)\n\nrng = np.random.default_rng(0)\nfor d_k in [16, 64, 128, 256]:\n    q = rng.standard_normal((100_000, d_k))\n    k = rng.standard_normal((100_000, d_k))\n    s = (q * k).sum(axis=1)\n    assert abs(s.var() / d_k - 1) < 0.05                 # variance close to d_k\n    assert abs((s / np.sqrt(d_k)).var() - 1) < 0.05      # scaled variance close to 1\n    print(d_k, round(s.var(), 1))\n\nd_k, T, N = 128, 16, 4000                                # 4,000 queries, 16 keys each\nq = rng.standard_normal((N, 1, d_k))\nK = rng.standard_normal((N, T, d_k))\nS = (q * K).sum(axis=-1)                                 # [N, T] raw scores\nfrac_raw = (softmax(S).max(axis=-1) > 0.99).mean()\nfrac_scaled = (softmax(S / np.sqrt(d_k)).max(axis=-1) > 0.99).mean()\nprint(frac_raw, frac_scaled)\nassert frac_raw > 0.3 and frac_scaled == 0.0\n```\n\nMeasured output: variances 16.0, 63.8, 128.1 and 256.8, then `0.4525 0.0`."
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\nimport numpy as np\n\ndef softmax(S):\n    S = S - S.max(axis=-1, keepdims=True)\n    E = np.exp(S)\n    return E / E.sum(axis=-1, keepdims=True)\n\ndef attention(X, W_Q, W_K, W_V):\n    Q, K, V = X @ W_Q, X @ W_K, X @ W_V\n    return softmax(Q @ K.T / np.sqrt(K.shape[-1])) @ V\n\nrng = np.random.default_rng(1)\nT, d, d_k = 6, 8, 4\nX = rng.standard_normal((T, d))\nW_Q, W_K, W_V = (rng.standard_normal((d, d_k)) for _ in range(3))\nperm = rng.permutation(T)\nassert np.allclose(attention(X[perm], W_Q, W_K, W_V), attention(X, W_Q, W_K, W_V)[perm])\nprint(\"equivariant for permutation\", perm)\n```"
}
```

```check
{
  "question": "Exercise 4: show a reference solution.",
  "answer": "```python\nimport numpy as np\n\ndef softmax(S):\n    S = S - S.max(axis=-1, keepdims=True)\n    E = np.exp(S)\n    return E / E.sum(axis=-1, keepdims=True)\n\ndef attention_batched(Q, K, V):\n    # Q, K: [B, T, d_k], V: [B, T, d_v]\n    S = Q @ K.swapaxes(-1, -2) / np.sqrt(Q.shape[-1])   # [B, T, T]\n    return softmax(S) @ V                                # [B, T, d_v]\n\nrng = np.random.default_rng(2)\nB, T, d_k, d_v = 3, 5, 4, 2\nQ, K = rng.standard_normal((B, T, d_k)), rng.standard_normal((B, T, d_k))\nV = rng.standard_normal((B, T, d_v))\nout = attention_batched(Q, K, V)\nloop = np.stack([softmax(Q[b] @ K[b].T / np.sqrt(d_k)) @ V[b] for b in range(B)])\nassert out.shape == (B, T, d_v) and np.allclose(out, loop)\nprint(out.shape)\n```\n\nThe script prints `(3, 5, 2)`."
}
```

## 17. Links

- Previous: [L2: Why attention exists](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention)
- Next: [L4: Causal masking and generation](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation)
- [L5: Multi-head attention](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention): many heads of this formula in parallel
- [L6: The transformer block, end to end](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block): RoPE and the rest of the layer
- [L7: The cost of attention and FlashAttention](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention)
- [Part 01 L1: Vectors and dot products](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) and [Part 01 L2: Matrices and matrix multiplication](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication)
- [Part 03 L1: Why the KV cache exists](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists)
- [PagedAttention: the algorithm](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm): the same formula, computed block by block
- [Attention and position](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position)
- [Drill: from attention to PagedAttention](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention)

### Sources

- Vaswani et al., "Attention Is All You Need", NIPS 2017, §3.2.1 (Equation 1, footnote 4), §3.5 and Table 1: https://arxiv.org/abs/1706.03762 (checked on 2026-10-15)
- Yang et al., "Tensor Programs V: Tuning Large Neural Networks via Zero-Shot Hyperparameter Transfer", 2022, Definition 4.1 and footnote 8: https://arxiv.org/abs/2203.03466 (checked on 2026-10-15)
- Haviv, Ram, Press, Izsak, Levy, "Transformer Language Models without Positional Encodings Still Learn Positional Information", Findings of EMNLP 2022: https://arxiv.org/abs/2203.16634 (checked on 2026-10-15)
- PyTorch 2.14 documentation, `torch.nn.functional.scaled_dot_product_attention`: https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html (checked on 2026-10-15)
- Meta reference code, `models/llama3/model.py` (`Attention.forward`): https://github.com/meta-llama/llama-models (checked on 2026-10-15)
- Hugging Face Transformers, `modeling_llama.py` (`eager_attention_forward`, `scaling = head_dim**-0.5`): https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py (checked on 2026-10-15)
- Llama Team, "The Llama 3 Herd of Models", 2024, Table 3: https://arxiv.org/abs/2407.21783 (checked on 2026-10-15)
