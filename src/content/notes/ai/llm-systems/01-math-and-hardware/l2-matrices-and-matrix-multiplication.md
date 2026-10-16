---
title: "L2: Matrices and matrix multiplication"
order: 2
summary: "A matrix is a table of numbers and a function that maps vectors to vectors. Matrix multiplication is many dot products at once, with the shape rule (m × k)(k × n) = (m × n) and a cost of 2mkn FLOPs. The lesson computes the toy attention projections by hand and counts the parameters and FLOPs of Llama-3.1-8B."
status: not-started
tags: [math, matrices, matrix-multiplication, flops, linear-layer, parameters]
---

## 1. The question this idea answers

Attention needs a query, a key and a value for every token. In Llama-3.1-8B each token vector has 4,096 numbers, and a prompt can have thousands of tokens. Each of the 32 layers computes new queries, keys and values from those vectors. How do you write "do the same computation for every token" in one short formula? And how do you count the cost, so that you can answer "how many FLOPs does one token need?" in an interview?

The answer is the **matrix** and **matrix multiplication**. A matrix holds the learned numbers of a layer. One matrix multiplication computes the outputs for all tokens at once. Almost all the arithmetic of an LLM is matrix multiplication. So its shape rule and its cost formula explain the speed, the memory traffic and the price of inference.

This lesson builds on [L1: Vectors and dot products](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products). Every entry of a matrix product is one dot product.

## 2. Mental model

> [!analogy] A bank of detectors
> Picture a matrix $W$ as a row of detectors, one per column. Each column is a pattern. When a token vector $x$ arrives, every detector computes the dot product of $x$ with its own pattern and reports one number. The output vector $xW$ is the list of all detector reports. A matrix with 2 columns turns any 4-number vector into 2 reports. A matrix with 4,096 columns gives 4,096 reports. A second matrix multiplication sends the same detectors over many tokens: one row of reports per token.
>
> **Where it stops working:** the detectors are not designed by people. Training sets their patterns, and most columns have no human meaning. Also, a matrix is more than a list of detectors. It is a function that turns, stretches and squeezes the whole space of vectors (section 7).

## 3. Terms

| Term | Plain meaning |
|---|---|
| matrix | A rectangular table of numbers with rows and columns. |
| shape | The number of rows and columns, written $m \times n$ ("m by n"). |
| entry | One number in a matrix. $A_{ij}$ is the entry in row $i$ and column $j$. |
| transpose | The matrix with rows and columns swapped. Written $A^\top$. |
| matrix-vector product | A matrix times a vector. Each output number is one dot product. |
| matrix multiplication (matrix-matrix product) | $C = AB$: entry $C_{ij}$ is the dot product of row $i$ of $A$ and column $j$ of $B$. |
| inner dimension | The shared size $k$ in $(m \times k)(k \times n)$. It must match. |
| linear map | A function $f(x) = xW$. It keeps sums and scalings: $f(ax + by) = af(x) + bf(y)$. |
| linear layer | A neural network layer that computes $y = xW + b$. |
| weight matrix | The learned matrix $W$ of a linear layer. |
| bias | The learned vector $b$ that a linear layer adds after the multiplication. |
| parameter | One learned number of a model. Weights and biases are parameters. |
| FLOP | One floating-point operation: one addition or one multiplication. |
| FLOPs (count) | The number of floating-point operations that a computation needs. |
| GEMM | "General matrix-matrix multiplication", the standard name of $C = AB$ in numerical libraries. |
| GEMV | "General matrix-vector multiplication": a matrix times one vector. |
| arithmetic intensity | FLOPs divided by the bytes that must move to and from memory. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. A matrix is a table of numbers

### 4.1 Shape and entries

A **matrix** is a table of numbers. Its **shape** $m \times n$ gives $m$ rows and $n$ columns. The **entry** $A_{ij}$ sits in row $i$, column $j$. The toy attention example uses three weight matrices of shape $4 \times 2$:

```text
W_Q = [[0, 0],      W_K = [[0, 0],      W_V = [[1, 1],
       [0, 1],             [0, 1],             [0, 1],
       [1, 1],             [1, 0],             [1, 2],
       [0, 0]]             [0, 1]]             [2, 1]]
```

For example, $(W_Q)_{32} = 1$ (row 3, column 2) and $(W_V)_{41} = 2$ (row 4, column 1). In NumPy these are `W_Q[2, 1]` and `W_V[3, 0]`, because NumPy counts from 0.

Stack the token vectors of [L1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) as rows, and you get a matrix too. The first three tokens ("the", "cat", "sat") form the input matrix $X$ of shape $3 \times 4$:

$$
X = \begin{bmatrix} 1 & 0 & 1 & 0 \\ 0 & 1 & 0 & 1 \\ 1 & 1 & 0 & 0 \end{bmatrix}
$$

So "one row per token" is the convention of this guide. A vector of $d$ numbers is a matrix of shape $1 \times d$: a **row vector**.

### 4.2 The transpose

The **transpose** $A^\top$ swaps rows and columns: $(A^\top)_{ij} = A_{ji}$. A matrix of shape $m \times n$ becomes $n \times m$.

$$
W_K = \begin{bmatrix} 0 & 0 \\ 0 & 1 \\ 1 & 0 \\ 0 & 1 \end{bmatrix}
\qquad
W_K^\top = \begin{bmatrix} 0 & 0 & 1 & 0 \\ 0 & 1 & 0 & 1 \end{bmatrix}
$$

The transpose appears in the attention formula $\mathrm{softmax}(QK^\top/\sqrt{d_k})V$. It turns the keys into columns, so that each query row meets each key column in one dot product (section 6.4).

## 5. Matrix times vector

Take one token vector $x$ (shape $1 \times 4$) and $W_Q$ (shape $4 \times 2$). The product $xW_Q$ has shape $1 \times 2$. There are two ways to read it, and both are useful.

### 5.1 View 1: one dot product per column

Output number $j$ is the dot product of $x$ with column $j$ of the matrix:

$$
(xW)_j = \sum_{i=1}^{4} x_i W_{ij}
$$

> [!example] Worked example: the query of "the", column by column
> $x_{the} = [1, 0, 1, 0]$. The columns of $W_Q$ are $[0, 0, 1, 0]$ and $[0, 1, 1, 0]$.
>
> - Column 1: $1 \cdot 0 + 0 \cdot 0 + 1 \cdot 1 + 0 \cdot 0 = 1$
> - Column 2: $1 \cdot 0 + 0 \cdot 1 + 1 \cdot 1 + 0 \cdot 0 = 1$
>
> So $q_{the} = [1, 1]$. This is the detector view of section 2.

### 5.2 View 2: a weighted sum of rows

Group the same sum by $i$ instead of $j$. Then the output is a weighted sum of the **rows** of $W$. The components of $x$ are the weights.

$$
xW = x_1 \cdot (\text{row } 1) + x_2 \cdot (\text{row } 2) + \cdots + x_d \cdot (\text{row } d)
$$

> [!example] Worked example: the query of "the", row by row
> $x_{the} = [1, 0, 1, 0]$ selects rows 1 and 3 of $W_Q$ with weight 1:
>
> $q_{the} = 1 \cdot [0, 0] + 0 \cdot [0, 1] + 1 \cdot [1, 1] + 0 \cdot [0, 0] = [1, 1]$
>
> Same result, fewer steps, because the toy vectors contain only 0 and 1.

The row view explains the **embedding lookup** of [L1 of part 02](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors). A "one-hot" vector has a 1 at position $i$ and 0 elsewhere. A one-hot vector times the embedding matrix selects exactly row $i$. Real code skips the multiplication and reads row $i$ directly, which is much cheaper.

## 6. Matrix times matrix

### 6.1 The shape rule

$$
(m \times k) \cdot (k \times n) = (m \times n)
$$

The **inner dimensions** ($k$ and $k$) must be equal. They disappear in the result. The outer dimensions ($m$ and $n$) give the result's shape. For attention: $X$ is $3 \times 4$ and $W_Q$ is $4 \times 2$, so $Q = XW_Q$ is $3 \times 2$. One row of queries for each token.

> [!trap] Check the shapes before you compute
> $(3 \times 4)(3 \times 2)$ is not defined, because $4 \neq 3$. NumPy says: `ValueError: matmul: Input operand 1 has a mismatch in its core dimension 0, with gufunc signature (n?,k),(k,m?)->(n?,m?) (size 3 is different from 4)`. Read it as "the inner sizes 4 and 3 do not match".

### 6.2 Every entry is a dot product

$$
C_{ij} = \sum_{p=1}^{k} A_{ip} B_{pj}
$$

In words: entry $(i, j)$ of $C = AB$ is the dot product of **row $i$ of $A$** with **column $j$ of $B$**. A product of shape $m \times n$ therefore contains $m \cdot n$ dot products of length $k$.

![Alt text: X times W_Q as a grid of dot products, with one row, one column and their output entry highlighted](/notes/media/llm-systems/figures/01-2-matmul-as-dot-products.svg)

### 6.3 Worked example: $Q = XW_Q$ by hand

> [!example] Worked example: the queries of the first three tokens
> $X$ has rows $x_{the} = [1, 0, 1, 0]$, $x_{cat} = [0, 1, 0, 1]$, $x_{sat} = [1, 1, 0, 0]$. The columns of $W_Q$ are $c_1 = [0, 0, 1, 0]$ and $c_2 = [0, 1, 1, 0]$.
>
> | Entry | Row · column | Arithmetic | Value |
> |---|---|---|---|
> | $Q_{11}$ | $x_{the} \cdot c_1$ | $1 \cdot 0 + 0 \cdot 0 + 1 \cdot 1 + 0 \cdot 0$ | 1 |
> | $Q_{12}$ | $x_{the} \cdot c_2$ | $1 \cdot 0 + 0 \cdot 1 + 1 \cdot 1 + 0 \cdot 0$ | 1 |
> | $Q_{21}$ | $x_{cat} \cdot c_1$ | $0 \cdot 0 + 1 \cdot 0 + 0 \cdot 1 + 1 \cdot 0$ | 0 |
> | $Q_{22}$ | $x_{cat} \cdot c_2$ | $0 \cdot 0 + 1 \cdot 1 + 0 \cdot 1 + 1 \cdot 0$ | 1 |
> | $Q_{31}$ | $x_{sat} \cdot c_1$ | $1 \cdot 0 + 1 \cdot 0 + 0 \cdot 1 + 0 \cdot 0$ | 0 |
> | $Q_{32}$ | $x_{sat} \cdot c_2$ | $1 \cdot 0 + 1 \cdot 1 + 0 \cdot 1 + 0 \cdot 0$ | 1 |
>
> So $Q = [[1, 1], [0, 1], [0, 1]]$.

The keys and values follow the same way. The row view of section 5.2 makes this fast. "the" selects rows 1 and 3, "cat" selects rows 2 and 4, and "sat" selects rows 1 and 2.

> [!example] Worked example: keys and values by the row view
> - $k_{the} = [0, 0] + [1, 0] = [1, 0]$, $k_{cat} = [0, 1] + [0, 1] = [0, 2]$, $k_{sat} = [0, 0] + [0, 1] = [0, 1]$
> - $v_{the} = [1, 1] + [1, 2] = [2, 3]$, $v_{cat} = [0, 1] + [2, 1] = [2, 2]$, $v_{sat} = [1, 1] + [0, 1] = [1, 2]$
>
> So $K = [[1, 0], [0, 2], [0, 1]]$ and $V = [[2, 3], [2, 2], [1, 2]]$. For the fourth token, $x_{down} = [0, 1, 1, 0]$ selects rows 2 and 3: $q_4 = [1, 2]$, $k_4 = [1, 1]$, $v_4 = [1, 3]$.

### 6.4 The score matrix $QK^\top$

$Q$ is $3 \times 2$ and $K^\top$ is $2 \times 3$, so $QK^\top$ is $3 \times 3$. Entry $(i, j)$ is the dot product of query $i$ with key $j$: the raw attention score.

> [!example] Worked example: all nine scores in one product
> Row "the" uses $q = [1, 1]$: with $k_{the} = [1, 0]$ the score is 1, with $k_{cat} = [0, 2]$ it is 2, with $k_{sat} = [0, 1]$ it is 1.
>
> $$
> QK^\top = \begin{bmatrix} 1 & 2 & 1 \\ 0 & 2 & 1 \\ 0 & 2 & 1 \end{bmatrix}
> $$
>
> Rows "cat" and "sat" are equal because their queries are equal ($[0, 1]$). One matrix multiplication computed nine dot products. [L3 of part 02](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) continues with the scaling, the mask and the softmax.

### 6.5 Each output row depends only on its own input row

Look again at $C_{ij} = \sum_p A_{ip} B_{pj}$. Row $i$ of the result uses row $i$ of $A$ and nothing else from $A$. So in $K = XW_K$, the key of "the" depends only on $x_{the}$ and $W_K$.

When "down" arrives as a new row of $X$, the rows of "the", "cat" and "sat" in $K$ and $V$ do not change. They are the same numbers as before. This simple fact is the seed of the KV cache: why compute them again? [L1 of part 03](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists) proves the full statement for all layers of a causal model.

### 6.6 Three rules you must know

| Rule | Statement | Consequence |
|---|---|---|
| Not commutative | In general $AB \neq BA$. Often $BA$ is not even defined. | Write the factors in the right order. $XW_Q$ and $W_QX$ are different things. |
| Associative | $(AB)C = A(BC)$ | You may choose the order of computation. The cost can differ by a factor of thousands (section 9.4). |
| Transpose of a product | $(AB)^\top = B^\top A^\top$ | It converts between the row-vector convention and the column-vector convention. |

The proof of the transpose rule takes one line, entry by entry:

$$
\big((AB)^\top\big)_{ij} = (AB)_{ji} = \sum_p A_{jp} B_{pi} = \sum_p (B^\top)_{ip} (A^\top)_{pj} = (B^\top A^\top)_{ij}
$$

## 7. A matrix as a function

A matrix is also a function. $f(x) = xW$ takes a vector and returns a vector. Such a function is a **linear map**: it keeps sums and scalings,

$$
f(a\,x + b\,y) = a\,f(x) + b\,f(y)
$$

for any vectors $x, y$ and numbers $a, b$. The proof uses the distributive rule of the dot product from [L1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products).

> [!example] Worked example: a rotation in two dimensions
> Take $W = \begin{bmatrix} 0 & 1 \\ -1 & 0 \end{bmatrix}$.
>
> - $[1, 0]\,W = [1 \cdot 0 + 0 \cdot (-1),\ 1 \cdot 1 + 0 \cdot 0] = [0, 1]$
> - $[0, 1]\,W = [0 \cdot 0 + 1 \cdot (-1),\ 0 \cdot 1 + 1 \cdot 0] = [-1, 0]$
>
> Every arrow turns by 90° counterclockwise, and no length changes. The rows of $W$ are where the two basic arrows $[1, 0]$ and $[0, 1]$ land.

**Composition is multiplication.** Apply $W_1$, then $W_2$: $(xW_1)W_2 = x(W_1W_2)$. So two linear layers in a row equal one linear layer with the matrix $W_1W_2$. Stacking them adds no power. That is why every neural network puts a non-linear function between linear layers. The MLP of a Llama block applies the SiLU function and a gate between its matrices ([L6 of part 02](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block)).

## 8. The linear layer

### 8.1 Definition and parameter count

A **linear layer** computes

$$
y = xW + b
$$

The symbols mean:

- $x$ is the input row vector, shape $1 \times d_{in}$. For $T$ tokens at once, $X$ has shape $T \times d_{in}$.
- $W$ is the **weight matrix**, shape $d_{in} \times d_{out}$.
- $b$ is the **bias** vector, shape $1 \times d_{out}$. For $T$ tokens, the same $b$ is added to every row ([L3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) calls this broadcasting).
- $y$ is the output, shape $1 \times d_{out}$ (or $T \times d_{out}$).

The number of **parameters** is $d_{in} \cdot d_{out} + d_{out}$. Llama models use no bias in attention and MLP layers (the config sets `attention_bias` and `mlp_bias` to false), so their layers have exactly $d_{in} \cdot d_{out}$ parameters.

### 8.2 How PyTorch stores the weight

PyTorch's `torch.nn.Linear` documentation states that the module applies "y = xA^T + b" and that the weight has "shape (out_features, in_features)". So PyTorch stores the transpose of the $W$ in this guide. The math is identical: $xA^\top = xW$ with $W = A^\top$.

```python
import torch

lin = torch.nn.Linear(4096, 1024, bias=False)   # like the k_proj of Llama-3.1-8B
print(lin.weight.shape)                         # torch.Size([1024, 4096])  -> (out, in)
x = torch.randn(1, 5, 4096)                     # 1 sequence, 5 tokens, 4096 numbers each
print(lin(x).shape)                             # torch.Size([1, 5, 1024])
print(torch.allclose(lin(x), x @ lin.weight.T)) # True: the layer computes x times the transpose
```

What each important line does:

- `torch.nn.Linear(4096, 1024, bias=False)` creates a weight with $4096 \times 1024 = 4{,}194{,}304$ parameters.
- `lin.weight.shape` prints `[1024, 4096]`: out first, in second. When you read a checkpoint, a tensor named `k_proj.weight` with shape `[1024, 4096]` means 4,096 inputs and 1,024 outputs.
- `lin(x)` works on any number of leading axes. Only the last axis must equal `in_features`.
- `x @ lin.weight.T` shows the exact operation: a matrix multiplication by the transpose.

### 8.3 Worked example: the parameters of Llama-3.1-8B from its shapes

The config of Llama-3.1-8B (`config.json` on Hugging Face) gives these sizes: hidden size $d = 4096$, 32 layers, 32 query heads and 8 KV heads. The head dimension is 128, the MLP intermediate size is 14,336 and the vocabulary has 128,256 tokens. The input and output embeddings are untied (two separate tables). With these numbers, every weight matrix has a known shape.

> [!example] Worked example: count the parameters (computed in these notes)
> **Attention projections in one layer** (no bias):
>
> - $W_Q$: $4096 \times (32 \times 128) = 4096 \times 4096 = 16{,}777{,}216$
> - $W_K$: $4096 \times (8 \times 128) = 4096 \times 1024 = 4{,}194{,}304$
> - $W_V$: same as $W_K$, $4{,}194{,}304$
> - $W_O$: $4096 \times 4096 = 16{,}777{,}216$
> - Sum: $41{,}943{,}040$
>
> **MLP in one layer:** three matrices (gate, up, down) of $4096 \times 14336$: $3 \times 58{,}720{,}256 = 176{,}160{,}768$.
>
> **Two RMSNorm weight vectors** per layer: $2 \times 4096 = 8{,}192$.
>
> **One layer:** $41{,}943{,}040 + 176{,}160{,}768 + 8{,}192 = 218{,}112{,}000$. **32 layers:** $6{,}979{,}584{,}000$.
>
> **Embedding table** $128256 \times 4096 = 525{,}336{,}576$. **Output head** (untied): another $525{,}336{,}576$. **Final norm:** $4{,}096$.
>
> **Total:** $6{,}979{,}584{,}000 + 2 \times 525{,}336{,}576 + 4{,}096 = 8{,}030{,}261{,}248$, so about 8.03 billion.

The MLP holds about 81% of each layer's parameters ($176.2 / 218.1$). [L6 of part 02](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) explains what each of these matrices does.

## 9. Counting FLOPs

### 9.1 The formula $2mkn$

Each entry of $C = AB$ with shapes $(m \times k)(k \times n)$ is a dot product of length $k$: $k$ multiplications and $k - 1$ additions. There are $mn$ entries. The usual convention counts a multiplication plus an addition as 2 FLOPs, so:

$$
\text{FLOPs}(AB) \approx 2mkn
$$

The exact count is $mn(2k - 1)$. For large $k$ the difference does not matter. Hardware also works this way: a "fused multiply-add" instruction does $a \cdot b + c$ in one step, and datasheets count it as 2 FLOPs.

> [!example] Worked example: the toy projection
> $Q = XW_Q$ with $(3 \times 4)(4 \times 2)$: exactly $3 \cdot 2 \cdot (4 + 3) = 42$ operations. The formula gives $2 \cdot 3 \cdot 4 \cdot 2 = 48$. The formula slightly overcounts small products.

### 9.2 Worked example: one layer of Llama-3.1-8B for a 2,000-token prompt

> [!example] Worked example: FLOPs of the projections and the MLP (computed in these notes)
> $m = 2000$ tokens. Each line is $2mkn$.
>
> - $W_Q$: $2 \times 2000 \times 4096 \times 4096 \approx 67.1$ GFLOP
> - $W_K$ and $W_V$: $2 \times 2000 \times 4096 \times 1024 \approx 16.8$ GFLOP each
> - $W_O$: $\approx 67.1$ GFLOP
> - MLP: $3 \times 2 \times 2000 \times 4096 \times 14336 \approx 704.6$ GFLOP
> - One layer: $\approx 872.4$ GFLOP. 32 layers: $\approx 27.9$ TFLOP.
>
> One GFLOP is $10^9$ FLOPs. One TFLOP is $10^{12}$ FLOPs.

### 9.3 Why a forward pass costs about 2 × parameters per token

In a linear layer, each weight takes part in exactly one multiplication and one addition per token. So one token through a matrix with $P$ entries costs $2P$ FLOPs. Add all matrices, and one token costs about

$$
\text{FLOPs per token} \approx 2 \times (\text{number of parameters})
$$

For Llama-3.1-8B that is about $2 \times 8.03 \times 10^9 \approx 16.1$ GFLOP per token. Two refinements matter in a deep interview:

1. The embedding table is a lookup, not a multiplication. Without its 525M parameters, the matrix work is about $2 \times 7.50 \times 10^9 \approx 15.0$ GFLOP per token.
2. The formula omits the attention scores $QK^\top$ and the weighted sum with $V$. They have no parameters, and they grow with the context length $T$: about $4 \cdot T \cdot d$ FLOPs per token per layer ([L6 of part 02](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) derives it). At $T = 8192$ in all 32 layers, this term adds about $4 \times 8192 \times 4096 \times 32 \approx 4.3$ GFLOP per token.

### 9.4 The order of multiplication changes the cost

Associativity says $(xA)B = x(AB)$. The results are equal. The costs are not.

> [!example] Worked example: one vector and two square matrices
> $x$ is $1 \times 4096$. $A$ and $B$ are $4096 \times 4096$.
>
> - $(xA)B$: two matrix-vector products, $2 \times (2 \times 1 \times 4096 \times 4096) \approx 67.1$ million FLOPs.
> - $x(AB)$: first a full matrix product, $2 \times 4096^3 \approx 137.4$ billion FLOPs, then one matrix-vector product.
>
> The second order costs about 2,000 times more ($137.5 \times 10^9 / 67.1 \times 10^6 \approx 2049$). Libraries do not reorder your products for you.

The same idea appears in multi-head latent attention. There, a model can merge two weight matrices ahead of time to save work at inference ([L5 of part 03](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) describes this "absorption" trick).

## 10. Bytes moved: matrix-vector versus matrix-matrix

FLOPs are only half of the cost. The numbers must also travel from memory to the arithmetic units. Count the bytes of a linear layer with $m$ input rows, in BF16 (2 bytes per number):

- Read the input: $m \cdot k$ numbers. Read the weights: $k \cdot n$ numbers. Write the output: $m \cdot n$ numbers.
- Bytes: $2(mk + kn + mn)$. FLOPs: $2mkn$.

The ratio is the **arithmetic intensity**:

$$
I = \frac{2mkn}{2(mk + kn + mn)}
$$

When $m$ is much smaller than $k$ and $n$, the weight term $kn$ dominates the bytes, and $I \approx m$.

> [!example] Worked example: intensity of a 4096 × 4096 layer in BF16 (computed in these notes)
> | Rows $m$ (tokens in the batch) | Operation type | Arithmetic intensity (FLOPs per byte) |
> |---|---|---|
> | 1 | GEMV | 1.0 |
> | 8 | GEMM | 7.97 |
> | 64 | GEMM | 62.06 |
> | 512 | GEMM | 409.6 |
> | 4,096 | GEMM | 1,365.3 |
>
> NVIDIA's "GPU Performance Background User's Guide" lists a linear layer with 1,024 inputs and 4,096 outputs. It gives 1 FLOP per byte at batch size 1 and 315 FLOPs per byte at batch size 512. The formula above gives 1.0 and 315.08 for those shapes.

This table is the most important bridge in Part 01. A matrix-vector product reads every weight and uses it once. A matrix-matrix product with $m$ rows reuses each weight $m$ times. The decode phase of an LLM processes one new token per sequence, so it is a GEMV unless many sequences share the step. [L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) shows that a GPU needs hundreds of FLOPs per byte to use its arithmetic. That is why batching and the roofline matter so much ([L3 of part 04](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)).

> [!key] The main idea of this lesson
> Matrix multiplication $(m \times k)(k \times n) = (m \times n)$ computes $mn$ dot products of length $k$ and costs about $2mkn$ FLOPs. A linear layer $y = xW + b$ has $d_{in} d_{out} + d_{out}$ parameters, and a token costs about 2 FLOPs per parameter. Row $i$ of the output depends only on row $i$ of the input, which is why old keys and values never change. A matrix-vector product reads every weight for only 2 FLOPs each, so its intensity is about 1 FLOP per byte in BF16.

```video
{"src": "/notes/media/llm-systems/manim/m02-matmul-many-dot-products.mp4", "caption": "The product X times W_Q is built entry by entry, each entry one dot product of a row of X with a column of W_Q."}
```

## 11. Code

### 11.1 NumPy

```python
import numpy as np

X = np.array([[1, 0, 1, 0],    # the
              [0, 1, 0, 1],    # cat
              [1, 1, 0, 0]])   # sat
W_Q = np.array([[0, 0], [0, 1], [1, 1], [0, 0]])
W_K = np.array([[0, 0], [0, 1], [1, 0], [0, 1]])
W_V = np.array([[1, 1], [0, 1], [1, 2], [2, 1]])

Q, K, V = X @ W_Q, X @ W_K, X @ W_V
print(Q.shape, K.shape, V.shape)   # (3, 2) (3, 2) (3, 2)
print(Q.tolist())                  # [[1, 1], [0, 1], [0, 1]]
print(K.tolist())                  # [[1, 0], [0, 2], [0, 1]]
print(V.tolist())                  # [[2, 3], [2, 2], [1, 2]]
print((Q @ K.T).tolist())          # [[1, 2, 1], [0, 2, 1], [0, 2, 1]]

x_down = np.array([0, 1, 1, 0])
print(x_down @ W_Q, x_down @ W_K, x_down @ W_V)   # [1 2] [1 1] [1 3]
```

What each important line does:

- `X @ W_Q`: the `@` operator is matrix multiplication (`np.matmul`). Shapes $(3, 4)$ and $(4, 2)$ give $(3, 2)$.
- `K.T`: the transpose. $(3, 2)$ becomes $(2, 3)$, so `Q @ K.T` is $(3, 2)(2, 3) = (3, 3)$.
- `x_down @ W_Q`: a 1-D array of length 4 times a $(4, 2)$ matrix gives a 1-D array of length 2. NumPy treats a 1-D left operand as a row vector.
- `*` is NOT matrix multiplication in NumPy. `A * B` multiplies matching entries (it needs equal or broadcastable shapes).

### 11.2 Exercises

Write these in `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, notebook folder `llm-systems/`, file `02-matrices.ipynb`.

1. **Matrix multiplication with three loops.** Write `matmul(A, B)` with plain Python lists and three nested loops. Count the multiplications and additions it performs.
   - Acceptance test: for random shapes $(5 \times 7)(7 \times 3)$ your result equals `np.array(A) @ np.array(B)` within $10^{-9}$. Your counter reports $5 \cdot 3 \cdot 7 = 105$ multiplications and $5 \cdot 3 \cdot 6 = 90$ additions. A shape mismatch raises `ValueError`.
   - Hint 1: the outer two loops choose the entry $(i, j)$. The inner loop is a dot product.
   - Hint 2: start each entry's running sum with the first product, so that $k$ products need $k - 1$ additions.
2. **Count Llama-3.1-8B.** Write `count_params(cfg)` that takes a dictionary with `hidden_size`, `num_hidden_layers`, `num_attention_heads`, `num_key_value_heads`, `head_dim`, `intermediate_size`, `vocab_size` and `tie_word_embeddings`.
   - Acceptance test: it returns 8,030,261,248 for Llama-3.1-8B. With `hidden_size` 8192, 80 layers, 64 heads, 8 KV heads, head dim 128, intermediate size 28,672 (the Llama-3.1-70B config) it returns 70,553,706,496.
   - Hint 1: write one line per matrix of section 8.3.
   - Hint 2: tied embeddings mean one table instead of two.
3. **Two layers collapse into one.** Draw random $W_1$ ($8 \times 16$) and $W_2$ ($16 \times 4$). Show that $(xW_1)W_2$ equals $x(W_1W_2)$ for 100 random $x$. Then insert `np.maximum(0, ...)` between the layers and show that no single $8 \times 4$ matrix reproduces the result.
   - Acceptance test: `np.allclose` is true without the non-linearity. With it, the best least-squares $8 \times 4$ matrix (`np.linalg.lstsq`) leaves a residual above $10^{-3}$.
   - Hint 1: stack the 100 vectors as a $100 \times 8$ matrix.
   - Hint 2: `np.linalg.lstsq(Xs, Ys, rcond=None)[0]` finds the best single matrix.

## 12. Common mistakes

1. **"`A * B` multiplies matrices."** In NumPy and PyTorch, `*` multiplies matching entries. Matrix multiplication is `@` (or `np.matmul`, `torch.matmul`).
2. **"$AB = BA$."** Matrix multiplication is not commutative. Often only one order is even defined.
3. **"A `Linear(4096, 1024)` weight has shape `[4096, 1024]`."** PyTorch stores `(out_features, in_features)`, so the shape is `[1024, 4096]`, and the layer computes $xW^\top$.
4. **"A matrix multiplication costs $mkn$ FLOPs."** It costs about $2mkn$: one multiplication and one addition per term.
5. **"FLOPs per token $\approx 2 \times$ parameters is exact."** It omits the attention-score work, which grows with context length, and it counts the embedding lookup as if it were a multiplication.
6. **"The order of a chain of products does not matter."** The result is the same, but the cost can differ by a factor of thousands.
7. **"Two linear layers are more powerful than one."** Without a non-linear function between them, they equal one linear layer with matrix $W_1W_2$.

## 13. One-minute explanation

A matrix is a table of numbers with a shape, rows by columns, and it is also a linear function from vectors to vectors. When you multiply an $m \times k$ matrix by a $k \times n$ matrix, the inner sizes must match and the result is $m \times n$. Every entry of the result is a dot product of a row of the first matrix with a column of the second. So the cost is $m \times n$ dot products of length $k$, about $2mkn$ FLOPs. A linear layer computes $y = xW + b$, and it has input size times output size parameters, plus the bias. Because each weight does one multiply-add per token, a forward pass costs about two FLOPs per parameter per token, about 16 GFLOP for Llama-3.1-8B. Row $i$ of the output depends only on row $i$ of the input. So the keys and values of old tokens never change when a new token arrives. A matrix-vector product reads every weight to do only two FLOPs with it, so its arithmetic intensity is about 1 FLOP per byte in BF16. A batch of $m$ rows reuses each weight $m$ times, and that reuse is why batching makes GPUs efficient.

## 14. Check questions

```check
{
  "question": "Give the shape of each product, or say why it is not defined. (a) $(3 \\times 4)(4 \\times 2)$, (b) $(5 \\times 4)(5 \\times 2)$, (c) $Q K^\\top$ with $Q$ and $K$ both $T \\times 128$, (d) $K^\\top Q$ with the same $Q$ and $K$.",
  "answer": "(a) $3 \\times 2$. (b) Not defined: the inner sizes 4 and 5 differ. (c) $(T \\times 128)(128 \\times T) = T \\times T$, one score per pair of tokens. (d) $(128 \\times T)(T \\times 128) = 128 \\times 128$. It is defined, but it is a different object: it mixes all tokens into a $128 \\times 128$ matrix and is not the attention score matrix."
}
```

```check
{
  "question": "Compute $v_{down} = x_{down} W_V$ with $x_{down} = [0, 1, 1, 0]$ and $W_V = [[1, 1], [0, 1], [1, 2], [2, 1]]$, once with the column view and once with the row view.",
  "answer": "Column view: column 1 of $W_V$ is $[1, 0, 1, 2]$, so $0 \\cdot 1 + 1 \\cdot 0 + 1 \\cdot 1 + 0 \\cdot 2 = 1$. Column 2 is $[1, 1, 2, 1]$, so $0 + 1 + 2 + 0 = 3$. Row view: $x_{down}$ selects rows 2 and 3, so $[0, 1] + [1, 2] = [1, 3]$. Both give $v_{down} = [1, 3]$."
}
```

```check
{
  "question": "Interview follow-up: how many FLOPs do the $W_Q$, $W_K$, $W_V$ and $W_O$ projections of one Llama-3.1-8B layer need for a 2,000-token prompt? How does that compare with the MLP of the same layer?",
  "hint": "Use $2mkn$ with $m = 2000$. $W_K$ and $W_V$ map 4096 to 1024 because of grouped-query attention.",
  "answer": "- $W_Q$: $2 \\times 2000 \\times 4096 \\times 4096 \\approx 67.1$ GFLOP.\n- $W_K$, $W_V$: $2 \\times 2000 \\times 4096 \\times 1024 \\approx 16.8$ GFLOP each.\n- $W_O$: $\\approx 67.1$ GFLOP.\n- Sum: $\\approx 167.8$ GFLOP.\n\nMLP: $3 \\times 2 \\times 2000 \\times 4096 \\times 14336 \\approx 704.6$ GFLOP, about 4.2 times the attention projections. Over 32 layers the projections and MLPs need about 27.9 TFLOP. The attention-score work ($QK^\\top$ and the weighted sum with $V$) comes on top and grows with the square of the prompt length."
}
```

```check
{
  "question": "Interview follow-up: why does a forward pass cost about $2 \\times$ (number of parameters) FLOPs per token? Name two things that this rule ignores, with numbers for Llama-3.1-8B.",
  "answer": "In a linear layer each weight takes part in one multiplication and one addition per token. So a matrix with $P$ weights costs $2P$ FLOPs per token. Summed over all matrices: about $2 \\times 8.03 \\times 10^9 \\approx 16.1$ GFLOP per token.\n\nIt ignores:\n1. The attention scores and the weighted sum with $V$. They have no parameters and cost about $4 T d$ FLOPs per token per layer. At $T = 8192$ over 32 layers that is about 4.3 GFLOP per token, and it grows with $T$.\n2. The embedding lookup. It reads one row and does no multiplication, so its 525M parameters cost no FLOPs. The matrix work is closer to $2 \\times 7.50 \\times 10^9 \\approx 15.0$ GFLOP.\n\nIt also ignores small element-wise work: norms, activations, softmax."
}
```

```check
{
  "question": "Interview follow-up: a checkpoint contains `model.layers.0.self_attn.k_proj.weight` with shape `[1024, 4096]`. What are the input and output sizes, how many parameters does it hold, and what does PyTorch compute with it? Why is the output 1,024 and not 4,096?",
  "answer": "PyTorch stores `nn.Linear` weights as (out_features, in_features). So the layer maps 4,096 inputs to 1,024 outputs. It holds $1024 \\times 4096 = 4{,}194{,}304$ parameters (Llama has no bias). It computes $y = x W^\\top$, where $W$ is the stored tensor. The output is 1,024 because Llama-3.1-8B uses grouped-query attention: 8 KV heads of 128 numbers each, $8 \\times 128 = 1024$. The query projection keeps 32 heads, $32 \\times 128 = 4096$."
}
```

```check
{
  "question": "Interview follow-up: derive the arithmetic intensity of a BF16 linear layer with $m$ input rows, $k$ inputs and $n$ outputs. Show that it is about $m$ when $m$ is small. What is it for one token through a $4096 \\times 4096$ layer, and for 64 tokens?",
  "answer": "FLOPs: $2mkn$. Bytes: read $mk$ inputs and $kn$ weights, write $mn$ outputs, each 2 bytes: $2(mk + kn + mn)$. Intensity: $I = mkn/(mk + kn + mn)$. If $m \\ll k$ and $m \\ll n$, the weight term $kn$ dominates the denominator, so $I \\approx mkn/kn = m$. For $m = 1$: $4096^2/(4096 + 4096^2 + 4096) \\approx 1.0$ FLOP per byte. For $m = 64$: about 62.1 FLOPs per byte. The weights are the expensive bytes, and each extra row reuses them for free."
}
```

```check
{
  "question": "Why do the rows of \"the\", \"cat\" and \"sat\" in $K = XW_K$ stay the same when the row of \"down\" is added to $X$? What does this mean for generation?",
  "answer": "Entry $(i, j)$ of $XW_K$ is the dot product of row $i$ of $X$ with column $j$ of $W_K$. Row $i$ of the result uses only row $i$ of $X$. Adding a new row to $X$ adds a new row to $K$ and changes nothing else. For generation this means the keys and values of earlier tokens can be stored and reused. That stored data is the KV cache. (In a multi-layer causal model the same holds for every layer, because each hidden state depends only on earlier positions. Part 03 L1 proves it.)"
}
```

```check
{
  "question": "Exercise 1: show a reference solution",
  "answer": "```python\nimport numpy as np\n\ndef matmul(A, B):\n    m, k = len(A), len(A[0])\n    if len(B) != k:\n        raise ValueError(f\"inner dimensions differ: {k} and {len(B)}\")\n    n = len(B[0])\n    mults = adds = 0\n    C = [[0.0] * n for _ in range(m)]\n    for i in range(m):\n        for j in range(n):\n            s = A[i][0] * B[0][j]\n            mults += 1\n            for p in range(1, k):\n                s += A[i][p] * B[p][j]\n                mults += 1\n                adds += 1\n            C[i][j] = s\n    return C, mults, adds\n\nrng = np.random.default_rng(0)\nA, B = rng.standard_normal((5, 7)), rng.standard_normal((7, 3))\nC, mults, adds = matmul(A.tolist(), B.tolist())\nprint(np.abs(np.array(C) - A @ B).max() < 1e-9, mults, adds)   # True 105 90\ntry:\n    matmul(A.tolist(), A.tolist())\nexcept ValueError as e:\n    print(\"ValueError:\", e)\n```\n\nThe innermost loop is one dot product. Starting the sum with the first product gives exactly $k - 1$ additions per entry, so $mn(k-1)$ additions in total."
}
```

```check
{
  "question": "Exercise 2: show a reference solution",
  "answer": "```python\ndef count_params(cfg):\n    d, L = cfg[\"hidden_size\"], cfg[\"num_hidden_layers\"]\n    H, Hkv, dh = cfg[\"num_attention_heads\"], cfg[\"num_key_value_heads\"], cfg[\"head_dim\"]\n    ff, V = cfg[\"intermediate_size\"], cfg[\"vocab_size\"]\n    attn = d * H * dh + 2 * d * Hkv * dh + H * dh * d   # W_Q, W_K, W_V, W_O\n    mlp = 3 * d * ff                                    # gate, up, down\n    norms = 2 * d                                       # two RMSNorm weights\n    tables = V * d if cfg[\"tie_word_embeddings\"] else 2 * V * d\n    return L * (attn + mlp + norms) + tables + d        # + final norm\n\nllama8 = dict(hidden_size=4096, num_hidden_layers=32, num_attention_heads=32,\n              num_key_value_heads=8, head_dim=128, intermediate_size=14336,\n              vocab_size=128256, tie_word_embeddings=False)\nllama70 = dict(llama8, hidden_size=8192, num_hidden_layers=80,\n               num_attention_heads=64, intermediate_size=28672)\nprint(count_params(llama8))    # 8030261248\nprint(count_params(llama70))   # 70553706496\n```\n\nThe 70B config keeps 8 KV heads and head dimension 128, so `dict(llama8, ...)` only changes four fields."
}
```

```check
{
  "question": "Exercise 3: show a reference solution",
  "answer": "```python\nimport numpy as np\n\nrng = np.random.default_rng(0)\nW1, W2 = rng.standard_normal((8, 16)), rng.standard_normal((16, 4))\nXs = rng.standard_normal((100, 8))\n\nprint(np.allclose((Xs @ W1) @ W2, Xs @ (W1 @ W2)))     # True: one 8x4 matrix is enough\n\nYs = np.maximum(0, Xs @ W1) @ W2                        # ReLU between the layers\nW_best = np.linalg.lstsq(Xs, Ys, rcond=None)[0]         # best single 8x4 matrix\nresidual = np.abs(Xs @ W_best - Ys).mean()\nprint(residual > 1e-3, round(residual, 3))\n```\n\nWithout the non-linearity, $W_1W_2$ reproduces the two layers exactly. With ReLU, even the best single matrix leaves a large error, so the two layers now compute something a single linear layer cannot."
}
```

## 15. Links

- Previous: [L1: Vectors and dot products](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products)
- Next: [L3: Tensors, shapes and batches](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches)
- [L3 of part 02: Scaled dot-product attention, step by step](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention): the full toy attention computation
- [L6 of part 02: The transformer block, end to end](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block): every matrix of a Llama block and the FLOPs per token
- [L1 of part 03: Why the KV cache exists](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists): the proof that old keys and values never change
- [L3 of part 04: Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound): intensity and batch size in a real server
- [L5: GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth): why an intensity of 1 wastes a GPU
- [Glossary](/notes/ai/llm-systems/glossary)

### Sources

- PyTorch 2.14 documentation, `torch.nn.Linear` (formula "y = xA^T + b", weight "of shape (out_features, in_features)"): https://docs.pytorch.org/docs/2.14/generated/torch.nn.Linear.html (checked on 2026-10-15)
- Meta Llama 3.1 8B config as mirrored on Hugging Face (hidden size 4096, 32 layers, 32 heads, 8 KV heads, head dim 128, intermediate size 14336, vocabulary 128256, untied embeddings, no attention or MLP bias): https://huggingface.co/unsloth/Meta-Llama-3.1-8B/blob/main/config.json and the model card https://huggingface.co/meta-llama/Llama-3.1-8B (checked on 2026-10-15)
- Llama 3.1 70B config as mirrored on Hugging Face (hidden size 8192, 80 layers, 64 heads, 8 KV heads, intermediate size 28672): https://huggingface.co/unsloth/Meta-Llama-3.1-70B/blob/main/config.json (checked on 2026-10-15)
- NVIDIA, "GPU Performance Background User's Guide", Table 1 (linear layer intensity 1 and 315 FLOPs per byte): https://docs.nvidia.com/deeplearning/performance/dl-performance-gpu-background/index.html (checked on 2026-10-15)
- All parameter counts, FLOP counts and intensities in the worked examples were computed in these notes with Python.
