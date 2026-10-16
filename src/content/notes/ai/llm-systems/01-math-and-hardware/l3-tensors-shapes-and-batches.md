---
title: "L3: Tensors, shapes and batches"
order: 3
summary: "A tensor is an array with any number of axes. This lesson fixes the shape notation of the guide (B, T, d, H, H_kv, d_h, L), splits a hidden state into heads step by step, explains row-major memory, strides and contiguity, broadcasting, batched matrix multiplication, how a cache grows by concatenation, and padding with masks."
status: not-started
tags: [math, tensors, shapes, pytorch, memory-layout, batching]
---

## 1. The question this idea answers

A real model never processes one token vector at a time. It processes many sequences, many tokens, many heads and many layers together. The code of every LLM is full of lines such as `q.view(B, T, H, d_h).transpose(1, 2)`. The KV cache of one layer is a block of numbers with the shape $[B, H_{kv}, T, d_h]$.

An interviewer who asks "how is the KV cache implemented?" expects you to say its shape, explain each axis, and compute its size in bytes. You also need to know why a cache grows, why `.contiguous()` exists, and why batches of different lengths waste memory. All of this is the language of **tensors** and **shapes**. This lesson teaches that language.

## 2. Mental model

> [!analogy] A long tape folded into boxes
> Picture memory as one long tape of numbered cells. A tensor is a way to fold that tape into nested boxes: 2 sequences, each with 3 tokens, each with 4 numbers. The **shape** $[2, 3, 4]$ says how many boxes sit at each level. The **strides** say how many cells to move along the tape to reach the next box at each level. That is 12 cells to the next sequence, 4 cells to the next token and 1 cell to the next number. Many operations only change the folding instructions and never touch the tape.
>
> **Where it stops working:** a real tape has no boxes at all. The same cells can be read with two different foldings at the same time (a "view"). Some foldings jump around the tape instead of reading it in order. Then the GPU reads memory less efficiently, and some operations refuse to work until you copy the data into a fresh, in-order tape (section 7).

## 3. Terms

| Term | Plain meaning |
|---|---|
| tensor | An array of numbers with any number of axes. A scalar, a vector and a matrix are tensors with 0, 1 and 2 axes. |
| axis (dimension) | One direction of a tensor. Axis 0 is the first. In code, `dim=-1` means the last axis. |
| rank (ndim) | The number of axes. A tensor of shape $[2, 3, 4]$ has rank 3. This is not the "rank" of linear algebra. |
| shape | The size of every axis, for example $[B, T, d]$. |
| element | One number in a tensor. The number of elements is the product of the shape. |
| dtype | The number format of the elements, for example BF16 (2 bytes each) ([L4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory)). |
| batch | A group of independent sequences processed together. Its size is $B$. |
| reshape (view) | A change of shape that keeps the elements in the same order. |
| transpose (permute) | A change of the order of the axes. It changes which elements are neighbors. |
| row-major order | The memory order in which the last axis changes fastest. NumPy and PyTorch use it by default. |
| stride | The number of elements to skip in memory to move one step along an axis. |
| contiguous | Stored in plain row-major order with no gaps, so the strides follow from the shape. |
| broadcasting | The rule that lets an operation combine tensors of different shapes by repeating size-1 axes. |
| batched matrix multiplication | Many independent matrix multiplications in one call, one for each index of the leading axes. |
| concatenation | Joining tensors end to end along one axis. A dynamic cache grows this way. |
| padding | Filler tokens that make sequences of different lengths fit one rectangular tensor. |
| attention mask | A tensor that marks which positions are real and which are padding (or future tokens). |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. Rank and shape

A **tensor** generalizes the vector and the matrix to any number of axes.

| Rank | Name | Example shape | Example in an LLM |
|---|---|---|---|
| 0 | scalar | $[\,]$ | The temperature 0.7 |
| 1 | vector | $[4096]$ | One token's hidden state |
| 2 | matrix | $[4096, 1024]$ | The weight of $W_K$ in Llama-3.1-8B |
| 3 | 3-D tensor | $[B, T, d]$ | Hidden states of a batch |
| 4 | 4-D tensor | $[B, H, T, d_h]$ | Queries split into heads. One layer's key cache. |
| 5 | 5-D tensor | $[B, H_{kv}, 4, T, d_h]$ | Keys expanded for grouped-query attention (section 9) |
| 6 | 6-D tensor | $[L, 2, B, H_{kv}, T, d_h]$ | The K and V caches of all layers stored as one block |

The number of **elements** is the product of the shape. A tensor of shape $[2, 3, 4]$ has $2 \times 3 \times 4 = 24$ elements. Its size in bytes is the number of elements times the bytes per element.

> [!trap] Two meanings of "rank"
> In tensor code, "rank" (or `ndim`) counts axes. In linear algebra, the rank of a matrix counts its independent rows. A $4096 \times 4096$ weight matrix has tensor rank 2. Its linear-algebra rank can be anything up to 4,096. LoRA uses the second meaning.

## 5. The shape notation of this guide

Every lesson of this guide uses the same letters.

| Symbol | Meaning | Llama-3.1-8B |
|---|---|---|
| $B$ | Batch size: number of sequences processed together | Depends on the server load |
| $T$ | Sequence length: number of tokens (prompt plus generated so far) | Up to 131,072 |
| $d$ | Model width: the size of one hidden state (also $d_{model}$) | 4,096 |
| $H$ | Number of query heads | 32 |
| $H_{kv}$ | Number of key-value heads | 8 |
| $d_h$ | Head dimension: the size of one head's query, key or value | 128 |
| $L$ | Number of layers | 32 |
| $V$ | Vocabulary size | 128,256 |
| $d_{ff}$ | MLP intermediate size | 14,336 |

Note that $H \cdot d_h = 32 \times 128 = 4096 = d$ for Llama-3.1-8B. Many models have this property, but not all.

The main tensors of one forward pass then have these shapes:

| Tensor | Shape | Notes |
|---|---|---|
| Token IDs | $[B, T]$ | Integers |
| Hidden states | $[B, T, d]$ | One vector per token |
| Queries after the head split | $[B, H, T, d_h]$ | 32 heads |
| Keys and values after the head split | $[B, H_{kv}, T, d_h]$ | 8 heads (grouped-query attention) |
| Attention scores | $[B, H, T, T]$ | One score per pair of tokens per head |
| Attention output before $W_O$ | $[B, T, H \cdot d_h]$ | Heads joined again |
| Logits | $[B, T, V]$ | One score per vocabulary token |
| KV cache of one layer | two tensors $[B, H_{kv}, T, d_h]$ | One for keys, one for values |

## 6. The head split, step by step

Multi-head attention splits each hidden state into $H$ pieces of $d_h$ numbers. Each piece goes to its own head ([L5 of part 02](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) explains why). In shapes:

$$
[B, T, d] \xrightarrow{\text{view}} [B, T, H, d_h] \xrightarrow{\text{transpose axes 1 and 2}} [B, H, T, d_h]
$$

1. The **view** cuts the last axis of $d$ numbers into $H$ groups of $d_h$. It moves no data.
2. The **transpose** swaps the token axis and the head axis. Now each head sees its own $[T, d_h]$ matrix, which attention needs.

Hugging Face Transformers writes exactly these two steps in `LlamaAttention.forward`:

```python
import torch

B, T, d, head_dim = 2, 5, 4096, 128
hidden_states = torch.randn(B, T, d)
q_proj = torch.nn.Linear(4096, 32 * 128, bias=False)
k_proj = torch.nn.Linear(4096, 8 * 128, bias=False)

# The next three lines are quoted from LlamaAttention.forward in
# transformers/models/llama/modeling_llama.py (main branch). The source writes
# self.head_dim, self.q_proj and self.k_proj.
input_shape = hidden_states.shape[:-1]
hidden_shape = (*input_shape, -1, head_dim)
query_states = q_proj(hidden_states).view(hidden_shape).transpose(1, 2)
key_states = k_proj(hidden_states).view(hidden_shape).transpose(1, 2)

print(query_states.shape)   # torch.Size([2, 32, 5, 128])
print(key_states.shape)     # torch.Size([2, 8, 5, 128])
```

Here `input_shape` is $(B, T)$, so `hidden_shape` is $(B, T, -1, d_h)$. The `-1` tells PyTorch to compute the number of heads itself: $4096 / 128 = 32$ for queries and $1024 / 128 = 8$ for keys and values.

> [!example] Worked example: split three tokens into two heads
> Take $B = 1$, $T = 3$, $d = 4$, $H = 2$, so $d_h = 2$. To see where each number goes, give the tokens easy values:
>
> ```text
> x (shape [1, 3, 4]):
>   token 1: [10, 11, 12, 13]
>   token 2: [20, 21, 22, 23]
>   token 3: [30, 31, 32, 33]
> ```
>
> **Correct:** `x.view(1, 3, 2, 2).transpose(1, 2)` gives shape $[1, 2, 3, 2]$:
>
> - Head 0: $[10, 11]$, $[20, 21]$, $[30, 31]$: the first two numbers of every token.
> - Head 1: $[12, 13]$, $[22, 23]$, $[32, 33]$: the last two numbers of every token.
>
> **Wrong:** `x.view(1, 2, 3, 2)` also has shape $[1, 2, 3, 2]$, but it gives:
>
> - "Head 0": $[10, 11]$, $[12, 13]$, $[20, 21]$
> - "Head 1": $[22, 23]$, $[30, 31]$, $[32, 33]$
>
> The wrong version mixes token 1 and token 2 inside one "head". No error appears, because the shape is right. Only the values are wrong.

![Alt text: the head split of the toy numbers in three shapes, and the memory tape in row-major order](/notes/media/llm-systems/figures/01-3-head-split-shapes.svg)

After attention, the model reverses the steps: transpose back to $[B, T, H, d_h]$, then reshape to $[B, T, H \cdot d_h]$. Hugging Face writes `attn_output = attn_output.reshape(*input_shape, -1).contiguous()`, then applies `self.o_proj`. Section 7 explains why the transpose makes a `.contiguous()` or a `reshape` necessary there.

## 7. Memory layout: row-major order, strides and contiguity

### 7.1 Row-major order

Memory is one long line of cells. A tensor of shape $[2, 3, 4]$ must be laid out on that line. **Row-major order** puts the last axis next to each other, then the second-to-last, and so on. For `torch.arange(24).reshape(2, 3, 4)` the memory holds 0, 1, 2, ..., 23 in order. Element $[i, j, k]$ sits at position

$$
\text{offset}(i, j, k) = i \cdot (3 \cdot 4) + j \cdot 4 + k \cdot 1
$$

### 7.2 Strides

The multipliers $(12, 4, 1)$ are the **strides**: how many elements to skip for one step along each axis. PyTorch reports strides in elements. NumPy reports them in bytes, so the same float32 array has strides $(48, 16, 4)$ in NumPy.

A **transpose** does not move data. It only swaps the strides. That is why it is instant, even on a tensor of gigabytes.

```python
import torch

t = torch.arange(24).reshape(2, 3, 4)
print(t.shape, t.stride(), t.is_contiguous())   # torch.Size([2, 3, 4]) (12, 4, 1) True

u = t.transpose(0, 1)                            # swap axes 0 and 1
print(u.shape, u.stride(), u.is_contiguous())   # torch.Size([3, 2, 4]) (4, 12, 1) False
print(u.data_ptr() == t.data_ptr())             # True: same memory, new folding
```

A tensor is **contiguous** when its strides are exactly the row-major strides of its shape. For shape $[3, 2, 4]$ those would be $(8, 4, 1)$. The transposed tensor has $(4, 12, 1)$, so it is not contiguous. Walking through `u` in index order jumps back and forth on the tape.

### 7.3 Why `.contiguous()` exists

A `view` can only re-fold memory that is already in a compatible order. The PyTorch documentation states the condition: each new dimension must be a subspace of an original dimension, or span only original dimensions that satisfy $\text{stride}[i] = \text{stride}[i+1] \times \text{size}[i+1]$. Otherwise, the docs say, a view is not possible "without copying it", for example with `contiguous()`.

```python
import torch

t = torch.arange(24).reshape(2, 3, 4)
u = t.transpose(0, 1)
try:
    u.view(6, 4)
except RuntimeError as e:
    print(e)
# view size is not compatible with input tensor's size and stride (at least one dimension
# spans across two contiguous subspaces). Use .reshape(...) instead.

print(u.contiguous().stride())        # (8, 4, 1): a fresh copy in row-major order
print(u.contiguous().view(6, 4).shape)  # torch.Size([6, 4])
print(u.reshape(6, 4).shape)          # torch.Size([6, 4]): reshape copies when it must
```

The three tools compare as follows:

| Call | Copies data? | Fails on a non-contiguous tensor? |
|---|---|---|
| `x.view(shape)` | Never | Yes, when the strides do not allow the new shape |
| `x.contiguous()` | Only if `x` is not contiguous | Never |
| `x.reshape(shape)` | Only when a view is impossible | Never |

**Why the layout matters for speed.** The CUDA C++ Best Practices Guide states that global memory loads "by threads of a warp are coalesced by the device into as few as possible transactions". When thread $k$ reads word $k$, a warp of 32 threads reads one block of neighboring bytes. With a stride of 2, the guide says, "half the elements in the transaction are not used". So kernels want the axis they read most to be contiguous. Interpretation of these notes: this is why engineers choose the layouts of caches with care. The layout $[B, H_{kv}, T, d_h]$ keeps the $d_h$ numbers of one head and one token next to each other. ([L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) explains warps.)

**The cost.** `.contiguous()` on a non-contiguous tensor reads and writes every element once. For a $[1, 8192, 4096]$ BF16 tensor that is 64 MiB read plus 64 MiB written. It is cheap compared with a matrix multiplication, but not free.

## 8. Broadcasting

**Broadcasting** lets you combine tensors of different shapes without writing loops. NumPy and PyTorch apply the same three rules:

1. Align the shapes from the right (the last axis first).
2. Two sizes are compatible if they are equal or if one of them is 1.
3. A missing axis on the left counts as size 1. A size-1 axis repeats to match the other tensor, without a copy in memory.

| Operation | Shapes | Result |
|---|---|---|
| Add a bias to every token | $[B, T, d] + [d]$ | $[B, T, d]$ |
| Divide scores by $\sqrt{d_h}$ | $[B, H, T, T] / [\,]$ | $[B, H, T, T]$ |
| Add a causal mask to scores | $[B, H, T, T] + [T, T]$ | $[B, H, T, T]$ |
| Add a padding mask over keys | $[B, H, T, T] + [B, 1, 1, T]$ | $[B, H, T, T]$ |
| Subtract a query from every key ([L1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products)) | $[4, 2] - [2]$ | $[4, 2]$ |

A size mismatch that no rule can fix raises an error. PyTorch says, for $[2, 5, 4096] + [4095]$: `The size of tensor a (4096) must match the size of tensor b (4095) at non-singleton dimension 2`. "Non-singleton" means "not of size 1".

> [!trap] Broadcasting can hide a bug
> A $[T]$ vector added to $[T, T]$ scores repeats along the rows, not along the columns. If you meant "one value per query row", you needed shape $[T, 1]$. The code runs in both cases and gives different numbers. Write the shapes in a comment next to every broadcast.

## 9. Batched matrix multiplication

The `@` operator works on tensors with more than two axes. It treats the last two axes as matrices and every leading axis as a batch of independent problems. The leading axes must match or broadcast.

$$
[B, H, T, d_h] \ @ \ [B, H, d_h, T] = [B, H, T, T]
$$

This one line computes the score matrix $QK^\top$ of every head of every sequence. The FLOPs are the number of matrices times $2mkn$: $B \cdot H \cdot 2 \cdot T \cdot d_h \cdot T$.

> [!example] Worked example: how large is the score tensor?
> Llama-3.1-8B, $B = 1$, $H = 32$, $T = 8192$, one layer:
>
> - Elements: $32 \times 8192 \times 8192 = 2{,}147{,}483{,}648$.
> - In BF16 (2 bytes each): $4{,}294{,}967{,}296$ bytes $= 4$ GiB, for one layer.
> - FLOPs of $QK^\top$: $32 \times 2 \times 8192 \times 128 \times 8192 \approx 549.8$ GFLOP.
>
> An H100 has 80 GB. Storing this tensor for every layer is impossible. FlashAttention computes attention without ever storing the full score tensor ([L7 of part 02](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention)).

**Grouped-query attention needs a broadcast.** The keys have $H_{kv} = 8$ heads, the queries $H = 32$. Each key head serves a group of $32 / 8 = 4$ query heads. Hugging Face's `repeat_kv` function inserts a new axis and expands it:

```python
import torch

# repeat_kv, quoted from transformers/models/llama/modeling_llama.py
# (main branch). The docstring is omitted.
def repeat_kv(hidden_states: torch.Tensor, n_rep: int) -> torch.Tensor:
    batch, num_key_value_heads, slen, head_dim = hidden_states.shape
    if n_rep == 1:
        return hidden_states
    hidden_states = hidden_states[:, :, None, :, :].expand(batch, num_key_value_heads, n_rep, slen, head_dim)
    return hidden_states.reshape(batch, num_key_value_heads * n_rep, slen, head_dim)

K = torch.randn(2, 8, 5, 128)              # [B, H_kv, T, d_h]
K32 = repeat_kv(K, 4)
print(K32.shape)                           # torch.Size([2, 32, 5, 128])
print(torch.equal(K32[:, 0], K32[:, 3]))   # True: query heads 0 to 3 share KV head 0
print(torch.equal(K32[:, 3], K32[:, 4]))   # False: head 4 uses KV head 1
```

`expand` repeats the size-1 axis without a copy (stride 0). The final `reshape` produces $[B, 32, T, d_h]$, and it copies, because the expanded tensor is not contiguous. The cache itself stores only the 8 heads. [L5 of part 03](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) covers GQA in depth.

## 10. Concatenation along the time axis: how a cache grows

During generation, each new token adds one key and one value per KV head in every layer. The simplest cache **concatenates** them along the time axis (axis 2 of $[B, H_{kv}, T, d_h]$):

$$
[B, H_{kv}, T, d_h] \ \Vert \ [B, H_{kv}, 1, d_h] \rightarrow [B, H_{kv}, T+1, d_h]
$$

> [!example] Worked example: the toy key cache grows by one row
> After "the cat sat", the key cache of the single head holds $K = [[1, 0], [0, 2], [0, 1]]$, shape $[1, 1, 3, 2]$. The decode step for "down" computes $k_4 = [1, 1]$, shape $[1, 1, 1, 2]$.
>
> ```python
> import torch
> K_cache = torch.tensor([[1., 0.], [0., 2.], [0., 1.]]).view(1, 1, 3, 2)
> k_new = torch.tensor([1., 1.]).view(1, 1, 1, 2)
> K_cache = torch.cat([K_cache, k_new], dim=2)
> print(K_cache.shape, K_cache[0, 0].tolist())
> # torch.Size([1, 1, 4, 2]) [[1.0, 0.0], [0.0, 2.0], [0.0, 1.0], [1.0, 1.0]]
> ```
>
> The first three rows did not change. Only a row was added.

**The hidden cost of concatenation.** `torch.cat` allocates a new tensor and copies the whole old cache into it at every step. The work per step grows with $T$, so the total copy work grows with $T^2$.

> [!example] Worked example: copy traffic of a concatenating cache (computed in these notes)
> Llama-3.1-8B stores $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes of K and V per token over all layers. Take a 1,000-token prompt and generate 1,000 tokens.
>
> - Step $t$ writes a new cache of $1000 + t$ tokens.
> - Total written: $\sum_{t=1}^{1000} (1000 + t) = 1{,}000{,}000 + 500{,}500 = 1{,}500{,}500$ token-copies.
> - Bytes: $1{,}500{,}500 \times 131{,}072 \approx 196.7$ GB written, and about as much read.
> - The final cache is only $2000 \times 131{,}072 \approx 262$ MB. The copies move about 750 times that.
> - At 3.35 TB/s (H100), about 393 GB of traffic costs about 0.12 s. The same 1,000 steps spend roughly 4.8 s on reading weights, so the copies add about 2.5%.
> - During each copy, the old and the new tensor both occupy memory.

Serving systems avoid this. A **static cache** allocates $[B, H_{kv}, T_{max}, d_h]$ once and writes each new key at its position index: `K_cache[:, :, pos] = k_new`. A **paged cache** (vLLM) stores the cache in fixed-size blocks and adds a new block only when the last one is full. [L4 of part 03](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) builds both designs, and the paper page [04 PagedAttention: the algorithm](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm) explains the blocks.

## 11. Padding and masks for sequences of different lengths

A tensor is a rectangle. Three prompts with 5, 3 and 2 tokens do not form a rectangle. The classic fix is **padding**. Add filler tokens until every row has the same length. Then pass an **attention mask** that marks the real tokens with 1 and the filler with 0.

```text
input_ids (right padding, P = pad token)    attention_mask
[ t t t t t ]                               [ 1 1 1 1 1 ]
[ t t t P P ]                               [ 1 1 1 0 0 ]
[ t t P P P ]                               [ 1 1 0 0 0 ]
```

The model must never attend to a pad token. So before the softmax, the code adds $-\infty$ to every score whose key is a pad position. With shape $[B, 1, 1, T]$, that mask broadcasts over all heads and all query rows (section 8).

> [!example] Worked example: the waste of padding
> - Lengths 5, 3, 2 padded to 5: $3 \times 5 = 15$ slots, 10 real tokens. $5 / 15 \approx 33\%$ of the compute and memory goes to pad tokens.
> - Lengths 2000, 500, 100 padded to 2000: 6,000 slots, 2,600 real. $3400 / 6000 \approx 57\%$ waste.

**Left or right padding?** For generation, the new token goes after the last real token of each row. With right padding, pad tokens would sit between the prompt and the new text. The Hugging Face text generation guide (Transformers 5.17 docs) says to set the padding side to `"left"` "because a LLM is not trained to continue generation from padding tokens". [L4 of part 03](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) shows how padding interacts with the cache and the position index.

**Interpretation of these notes:** padding is the reason why simple batching wastes memory. The KV cache makes the waste worse, because padded positions also reserve cache space. Serving engines therefore batch requests one decode step at a time and give each request its own cache blocks. Then no request pays for the length of another request ([L4 of part 04](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) and the paper page [03 The question](/notes/papers/llm-serving/2023-pagedattention/03-the-question)).

## 12. The size of a tensor, and the KV formula from its shape

Size in bytes = number of elements × bytes per element. Apply it to the cache of one layer, then to the whole model, and the KV cache formula appears by itself.

> [!example] Worked example: the KV cache of Llama-3.1-8B from its shape
> One layer, $B = 1$, $T = 8192$, BF16 (2 bytes):
>
> - Key tensor $[1, 8, 8192, 128]$: $8 \times 8192 \times 128 = 8{,}388{,}608$ elements, $16{,}777{,}216$ bytes $= 16$ MiB.
> - Value tensor: the same, 16 MiB. Keys plus values: 32 MiB per layer.
> - 32 layers: $32 \times 32$ MiB $= 1024$ MiB $= 1$ GiB.
>
> Per token: $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes $= 128$ KiB. This is the formula $2 \times L \times H_{kv} \times d_h \times s$ per token, where $s$ is the bytes per element. [L3 of part 03](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) derives it factor by factor.

> [!key] The main idea of this lesson
> A tensor is memory plus a shape plus strides. View and transpose only change the shape and strides. The head split is `view` to $[B, T, H, d_h]$, then `transpose(1, 2)` to $[B, H, T, d_h]$. A transposed tensor is not contiguous, so `view` fails on it and `reshape` or `.contiguous()` must copy. The KV cache of one layer is two tensors $[B, H_{kv}, T, d_h]$. Its size in bytes is its element count times the bytes per element. Concatenation grows a cache but copies it every step, and padding wastes slots.

## 13. Code exercises

Write these in `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, notebook folder `llm-systems/`, file `03-tensors.ipynb`.

### Exercises

1. **Split and merge heads.** Write `split_heads(x, n_heads)` for $[B, T, d] \to [B, H, T, d_h]$ and `merge_heads(y)` for the reverse.
   - Acceptance test: for `x = torch.randn(2, 5, 4096)` and 32 heads, `split_heads` returns shape $[2, 32, 5, 128]$. `merge_heads(split_heads(x, 32))` equals `x` exactly. Head 1, token 0 of the result equals `x[:, 0, 128:256]`.
   - Hint 1: the split is a view followed by a transpose of axes 1 and 2.
   - Hint 2: the merge needs `reshape` (or `.contiguous().view`), because the transposed tensor is not contiguous.
2. **Strides by hand.** Write `row_major_strides(shape)` that returns the strides of a contiguous tensor, and `is_contiguous(shape, strides)`.
   - Acceptance test: `row_major_strides((2, 3, 4))` is `(12, 4, 1)`. Your `is_contiguous` agrees with PyTorch's `is_contiguous()` for `t`, `t.transpose(0, 1)` and `t.transpose(0, 1).contiguous()`.
   - Hint 1: the last stride is 1. Each earlier stride is the next stride times the next size.
   - Hint 2: ignore axes of size 1 when you compare, because their stride never matters. For the three test tensors, a plain comparison is enough.
3. **Two caches, one result.** Build a concatenating cache and a preallocated cache for one layer with shape $[1, 8, T, 128]$. Feed both the same 50 random key vectors.
   - Acceptance test: after 50 steps both hold the same $[1, 8, 50, 128]$ data (`torch.equal` on the first 50 positions). Count the elements that `torch.cat` copied in total. It equals $8 \times 128 \times (1 + 2 + \cdots + 50) = 1{,}305{,}600$.
   - Hint 1: the preallocated cache is `torch.zeros(1, 8, T_max, 128)` plus a position counter.
   - Hint 2: at step $t$, `torch.cat` writes a new tensor of $t$ tokens.

## 14. Common mistakes

1. **"`x.view(B, H, T, d_h)` splits heads."** It gives the right shape and the wrong values: it mixes tokens. The correct split is `view(B, T, H, d_h)` followed by `transpose(1, 2)`.
2. **"`transpose` copies the data."** It only swaps strides. The copy happens later, in `.contiguous()` or `reshape`, and only if needed.
3. **"`view` and `reshape` are the same."** `view` never copies and fails when the strides do not allow it. `reshape` copies when it must.
4. **"Broadcasting is always safe."** It silently repeats size-1 axes. A $[T]$ mask where $[T, 1]$ was needed runs without error and gives wrong results.
5. **"The KV cache has one entry per token."** It has one key vector and one value vector per token, per KV head, per layer: $2 \times L \times H_{kv}$ vectors of length $d_h$ per token.
6. **"Concatenating to a cache costs only the new row."** `torch.cat` copies the whole cache every step. Preallocated and paged caches avoid that.
7. **"Padding only wastes compute."** Padded positions also take KV cache memory. That waste limits how many requests fit on a GPU.

## 15. One-minute explanation

A tensor is an array with any number of axes, described by its shape, its dtype and its strides. This guide writes $B$ for the batch, $T$ for tokens and $d$ for the model width. It writes $H$ and $H_{kv}$ for query and KV heads, $d_h$ for the head dimension and $L$ for layers. Attention splits hidden states $[B, T, d]$ with a view into $[B, T, H, d_h]$ and a transpose into $[B, H, T, d_h]$, so each head gets its own matrix. Memory is stored in row-major order, and the strides say how far to jump for each axis. A transpose only swaps strides, so the result is not contiguous, and a later view must copy it with `.contiguous()` or `reshape`. Broadcasting repeats size-1 axes, which is how one mask covers all heads and all sequences. Batched matrix multiplication computes $QK^\top$ for every head at once, with a score tensor of shape $[B, H, T, T]$. The KV cache of a layer is two tensors $[B, H_{kv}, T, d_h]$, which gives 128 KiB per token for Llama-3.1-8B in BF16. A naive cache grows by concatenation and copies itself every step, and padding to the longest sequence wastes both compute and cache memory.

## 16. Check questions

```check
{
  "question": "Take Llama-3.1-8B with $B = 4$ sequences of $T = 1000$ tokens. Give five shapes: the hidden states, the queries and the keys after the head split, the attention scores of one layer, and the logits.",
  "answer": "- Hidden states: $[4, 1000, 4096]$.\n- Queries: $[4, 32, 1000, 128]$.\n- Keys (and values): $[4, 8, 1000, 128]$, because there are 8 KV heads.\n- Scores: $[4, 32, 1000, 1000]$, one per query head (the 8 KV heads are shared by groups of 4 query heads).\n- Logits: $[4, 1000, 128256]$. During generation only the last position's logits are needed: $[4, 128256]$."
}
```

```check
{
  "question": "A colleague writes `q = q_proj(x).view(B, H, T, d_h)` instead of `.view(B, T, H, d_h).transpose(1, 2)`. The code runs and the model outputs nonsense. Explain exactly what goes wrong, using the toy tokens $[10, 11, 12, 13]$, $[20, 21, 22, 23]$, $[30, 31, 32, 33]$ with $H = 2$, $d_h = 2$.",
  "answer": "`view` keeps the memory order and only re-folds it. Memory holds 10, 11, 12, 13, 20, 21, ... in order. `view(1, 2, 3, 2)` cuts this tape into 2 blocks of 3 rows of 2: \"head 0\" gets $[10, 11]$, $[12, 13]$, $[20, 21]$ and \"head 1\" gets $[22, 23]$, $[30, 31]$, $[32, 33]$. So the rows of a \"head\" are not tokens anymore: head 0 holds both halves of token 1 and half of token 2. The correct `view(1, 3, 2, 2)` keeps tokens as rows and cuts each token into 2 heads. The `transpose(1, 2)` then puts the head axis first. The shapes of both versions are identical, so only a value test catches the bug."
}
```

```check
{
  "question": "Interview follow-up: why does `x.transpose(1, 2).view(B, T, d)` raise an error, while `x.transpose(1, 2).reshape(B, T, d)` works? What does each cost?",
  "hint": "Think about strides. A transpose swaps strides and moves no data.",
  "answer": "`transpose` swaps two strides, so the tensor is no longer in row-major order (not contiguous). `view` can only re-fold memory whose strides satisfy $\\text{stride}[i] = \\text{stride}[i+1] \\times \\text{size}[i+1]$ across the merged axes. Here the merged axes $H$ and $d_h$ are not neighbors in memory, so PyTorch raises \"view size is not compatible with input tensor's size and stride\". `reshape` checks the same condition, and when a view is impossible it copies the data into a new contiguous tensor (like `.contiguous().view(...)`). Cost: the transpose and a successful view are free (metadata only). The copy reads and writes every element once, for example 64 MiB plus 64 MiB for a $[1, 8192, 4096]$ BF16 tensor."
}
```

```check
{
  "question": "Scores have shape $[B, H, T, T]$. Which mask shape broadcasts correctly for (a) a causal mask that is the same for every sequence and head? Which one for (b) a padding mask that hides key positions per sequence? What goes wrong with a padding mask of shape $[B, T]$?",
  "answer": "(a) $[T, T]$: aligned from the right, it matches the last two axes and repeats over $B$ and $H$. (b) $[B, 1, 1, T]$: one value per sequence and per key column, repeated over heads and over query rows. A mask of shape $[B, T]$ aligns, from the right, with the last two axes $[T, T]$ of the scores. So its axis $B$ is matched with the query axis $T$. That raises an error if $B \\neq T$ and $B \\neq 1$. It happens to work if $B = 1$, because the single row repeats over all query rows. It is silently wrong if $B = T$, because the mask of sequence $i$ then lands on query row $i$ of every sequence. Always reshape it to $[B, 1, 1, T]$."
}
```

```check
{
  "question": "Interview follow-up: compute the KV cache size of Llama-3.1-8B in BF16 from the shapes of the cache tensors. Use a batch of 4 sequences of 8,192 tokens. Give the per-layer key tensor, the whole model, and the per-token size.",
  "answer": "Per layer, the key tensor is $[4, 8, 8192, 128]$: $4 \\times 8 \\times 8192 \\times 128 = 33{,}554{,}432$ elements, times 2 bytes $= 64$ MiB. Keys plus values: 128 MiB per layer. 32 layers: $4096$ MiB $= 4$ GiB. Per token: $2 \\times 32 \\times 8 \\times 128 \\times 2 = 131{,}072$ bytes $= 128$ KiB, and $4 \\times 8192 \\times 128$ KiB $= 4$ GiB agrees."
}
```

```check
{
  "question": "Interview follow-up: why do serving engines not grow the KV cache with `torch.cat`? Give the asymptotic cost and one number.",
  "answer": "`torch.cat` allocates a new tensor and copies the whole existing cache at every step. At step $t$ it writes $t$ tokens, so after $n$ steps it has written $n(n+1)/2$ token-copies. The cost grows with $n^2$, while the useful data grows with $n$. For Llama-3.1-8B (128 KiB per token), a 1,000-token prompt plus 1,000 generated tokens writes about 196.7 GB, about 750 times the final 262 MB cache. Each copy also needs the old and the new tensor in memory at the same time. Engines preallocate (static cache: write at the position index) or allocate fixed-size blocks on demand (paged cache, vLLM)."
}
```

```check
{
  "question": "In grouped-query attention with $H = 32$ and $H_{kv} = 8$, how does the code compute $QK^\\top$ when $Q$ is $[B, 32, T, d_h]$ and $K$ is $[B, 8, T, d_h]$? Does the cache store 32 or 8 heads?",
  "answer": "Each KV head serves $32/8 = 4$ query heads. One way (Hugging Face `repeat_kv`) inserts an axis, expands it to 4 without copying, and reshapes to $[B, 32, T, d_h]$, which copies. Another way reshapes the queries to $[B, 8, 4, T, d_h]$ and broadcasts the keys as $[B, 8, 1, d_h, T]$. Either way the cache stores only the 8 KV heads. That is the point of GQA: a cache 4 times smaller than with 32 KV heads."
}
```

```check
{
  "question": "Exercise 1: show a reference solution",
  "answer": "```python\nimport torch\n\ndef split_heads(x, n_heads):\n    B, T, d = x.shape\n    return x.view(B, T, n_heads, d // n_heads).transpose(1, 2)   # [B, H, T, d_h]\n\ndef merge_heads(y):\n    B, H, T, dh = y.shape\n    return y.transpose(1, 2).reshape(B, T, H * dh)                # copies: not contiguous\n\nx = torch.randn(2, 5, 4096)\nh = split_heads(x, 32)\nprint(h.shape)                                     # torch.Size([2, 32, 5, 128])\nprint(torch.equal(merge_heads(h), x))              # True\nprint(torch.equal(h[:, 1, 0], x[:, 0, 128:256]))   # True: head 1 = numbers 128 to 255\n```\n\n`split_heads` moves no data. `merge_heads` must copy, because after the transpose the tensor is not contiguous, so `view` would fail."
}
```

```check
{
  "question": "Exercise 2: show a reference solution",
  "answer": "```python\nimport torch\n\ndef row_major_strides(shape):\n    strides = [1] * len(shape)\n    for i in range(len(shape) - 2, -1, -1):\n        strides[i] = strides[i + 1] * shape[i + 1]\n    return tuple(strides)\n\ndef is_contiguous(shape, strides):\n    return tuple(strides) == row_major_strides(shape)\n\nt = torch.arange(24).reshape(2, 3, 4)\nprint(row_major_strides((2, 3, 4)))                  # (12, 4, 1)\nfor x in (t, t.transpose(0, 1), t.transpose(0, 1).contiguous()):\n    print(is_contiguous(x.shape, x.stride()), x.is_contiguous())\n# True True / False False / True True\n```\n\nPyTorch's own test also ignores axes of size 1 (their stride can be anything). The simple comparison is enough for these three tensors."
}
```

```check
{
  "question": "Exercise 3: show a reference solution",
  "answer": "```python\nimport torch\n\ntorch.manual_seed(0)\nsteps, T_max = 50, 64\nkeys = [torch.randn(1, 8, 1, 128) for _ in range(steps)]\n\n# 1. Concatenating cache\ncat_cache, copied = torch.zeros(1, 8, 0, 128), 0\nfor k in keys:\n    cat_cache = torch.cat([cat_cache, k], dim=2)   # allocates and writes a new tensor\n    copied += cat_cache.numel()\n\n# 2. Preallocated cache\nstatic_cache, pos = torch.zeros(1, 8, T_max, 128), 0\nfor k in keys:\n    static_cache[:, :, pos] = k[:, :, 0]           # writes one position only\n    pos += 1\n\nprint(torch.equal(cat_cache, static_cache[:, :, :pos]))   # True\nprint(copied, 8 * 128 * sum(range(1, steps + 1)))         # 1305600 1305600\n```\n\nThe preallocated cache writes only $8 \\times 128 = 1{,}024$ elements per step. The concatenating cache writes $1{,}024 \\times t$ at step $t$, so its total grows with the square of the number of steps."
}
```

## 17. Links

- Previous: [L2: Matrices and matrix multiplication](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication)
- Next: [L4: Numbers in memory: FP32, BF16, FP8, INT4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory)
- [L5 of part 02: Multi-head attention](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention): why the head split exists
- [L3 of part 03: The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula): the formula behind section 12
- [L4 of part 03: Implementing a KV cache](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache): dynamic, static and paged caches in code
- [L4 of part 04: Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling): how servers avoid padding
- Paper: [04 PagedAttention: the algorithm](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm)
- [Glossary](/notes/ai/llm-systems/glossary)

### Sources

- PyTorch 2.14, `torch.Tensor.view` docstring (the stride condition and the advice to use `contiguous()` or `reshape()`): https://docs.pytorch.org/docs/2.14/generated/torch.Tensor.view.html (checked on 2026-10-15)
- Hugging Face Transformers, `modeling_llama.py` on the main branch (`view(hidden_shape).transpose(1, 2)`, `repeat_kv`, `reshape(*input_shape, -1).contiguous()`): https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py (checked on 2026-10-15)
- Hugging Face Transformers 5.17 docs, "Text generation" (left padding): https://huggingface.co/docs/transformers/llm_tutorial (checked on 2026-10-15)
- NVIDIA, CUDA C++ Best Practices Guide, section "Coalesced Access to Global Memory": https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html (checked on 2026-10-15)
- All shapes, strides and error messages in this lesson were produced by running the code with PyTorch 2.14.1 in these notes.
