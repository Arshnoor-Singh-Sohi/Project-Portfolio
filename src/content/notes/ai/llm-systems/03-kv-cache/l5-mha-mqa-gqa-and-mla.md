---
title: "L5: MHA, MQA, GQA and MLA"
order: 5
summary: "Four ways to organize the keys and values of attention: one KV head per query head (MHA), one for all (MQA), one per group (GQA), or one compressed latent (MLA). The formulas, the code, the absorption trick, and the cache size of real models."
status: not-started
tags: [kv-cache, attention, gqa, mqa, mla, deepseek, llama]
---

## 1. The question this idea answers

The size formula of [L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) is:

$$
\text{bytes} = 2 \times L \times H_{kv} \times d_h \times T \times B \times s
$$

An engine can change $T$, $B$ and $s$ at run time. The factor $H_{kv} \times d_h$ is different: the architecture of the model fixes it. So the model designer asks: "How few numbers per token can attention store, and still work well?"

Four answers exist, in historical order:

1. **MHA** (multi-head attention, 2017): every query head has its own key head and value head.
2. **MQA** (multi-query attention, Shazeer 2019): all query heads share one key head and one value head.
3. **GQA** (grouped-query attention, Ainslie et al. 2023): query heads form groups, and each group shares one key head and one value head.
4. **MLA** (multi-head latent attention, DeepSeek-V2, 2024): every token stores one small compressed vector. The model rebuilds keys and values from it, or never builds them at all.

An interviewer who asks about the KV cache often continues: "Why does Llama use 8 KV heads?" or "How does DeepSeek make the cache so small?" This lesson answers both, down to the formulas and the code.

## 2. Mental model

> [!analogy] Readers, catalogs and shelves in a library
> Each query head is a reader with a question. Each key head is a catalog that helps a reader find books, and each value head is the shelf with the books. In **MHA**, every reader has a private catalog and a private shelf. In **MQA**, all readers share one catalog and one shelf. In **GQA**, readers sit at tables, and each table shares one catalog and one shelf. In **MLA**, the library stores each book once as a small microfilm (the latent vector). Each reader carries a personal lens that reads the microfilm directly, so nobody prints the full catalog.
>
> **Where it stops working:** in a real model the "catalogs" are learned during training. You cannot remove catalogs from a trained MHA model for free. GQA needs extra training (uptraining) after the conversion, and MLA must be in the architecture from the start of training.

## 3. Terms

| Term | Plain meaning |
|---|---|
| query head | One of the $H$ heads that produce queries. Each query head computes its own attention pattern. |
| KV head | One key head plus one value head. The cache stores one key vector and one value vector per KV head per token. |
| $H_{kv}$ | The number of KV heads per layer. |
| group size $G$ | The number of query heads that share one KV head: $G = H / H_{kv}$. |
| MHA | Multi-head attention: $H_{kv} = H$. |
| MQA | Multi-query attention: $H_{kv} = 1$. |
| GQA | Grouped-query attention: $1 < H_{kv} < H$. GQA-$G$ in the paper means $G$ groups. |
| saving factor | How many times smaller the cache is than with MHA: $H / H_{kv}$ for GQA and MQA. |
| uptraining | Converting a trained MHA checkpoint to MQA or GQA, then training it for a short time. |
| mean pooling | Averaging the key (or value) projection matrices of the heads in a group into one matrix. |
| MLA | Multi-head latent attention: the cache stores a compressed latent vector per token instead of full keys and values. |
| latent vector $c^{KV}$ | The compressed vector of one token in MLA. It has $d_c$ numbers. DeepSeek-V2 and V3 use $d_c = 512$. |
| down-projection $W^{DKV}$ | The matrix that maps a hidden state to the latent vector. |
| up-projection $W^{UK}$, $W^{UV}$ | The matrices that map the latent vector back to the keys and the values of each head. |
| absorption | Merging an up-projection into another matrix in advance, so that the full keys and values are never computed. |
| decoupled RoPE key $k^R$ | A small extra key in MLA that carries the RoPE rotation. All heads share it. It has $d_h^R$ numbers (64 in DeepSeek-V2 and V3). |
| arithmetic intensity | FLOPs per byte read from memory. Low intensity means the step waits for memory. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. The starting point: what MHA caches

### 4.1 The numbers per token

In MHA, each layer has $H$ query heads, $H$ key heads and $H$ value heads, each of size $d_h$. The full derivation is in [Part 02 L5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention). The cache stores the keys and values of every head, so each token adds this many numbers per layer:

$$
2 \times H \times d_h
$$

With the usual choice $H \times d_h = d$ (the model width), this is $2d$ numbers per token per layer.

> [!example] Worked example: Llama-2-7B, an MHA model
> The Llama 2 paper names "increased context length and grouped-query attention (GQA)" as the main changes from Llama 1. Its Table 1 marks GQA only for the 34B and 70B models. The 7B size of Llama 1 has dimension 4096, 32 heads and 32 layers (Llama 1 paper, Table 2). So Llama-2-7B uses MHA with $L = 32$, $H = H_{kv} = 32$ and $d_h = 4096 / 32 = 128$.
>
> - Per token, per layer: $2 \times 32 \times 128 = 8{,}192$ numbers.
> - Per token, 32 layers, BF16 (2 bytes): $8{,}192 \times 32 \times 2 = 524{,}288$ bytes $= 512$ KiB.
> - A batch of 16 sequences with 4,096 tokens each: $524{,}288 \times 4{,}096 \times 16 = 34{,}359{,}738{,}368$ bytes $= 32$ GiB.

### 4.2 Why the cache size is a speed problem

The cache is not only a memory problem. Each decode step must read the whole cache of every sequence (see [L2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode)). Decode is memory-bound, so the time of a step grows with the bytes it reads.

Shazeer (2019) made this exact. For incremental decoding with MHA, the paper derives the ratio of memory access to arithmetic as about

$$
\Theta\!\left(\frac{n}{d} + \frac{1}{b}\right)
$$

where $n$ is the sequence length, $d$ the model width and $b$ the batch size. The $1/b$ term is the cost of the weights: one read of the weights serves the whole batch. The $n/d$ term is the cost of loading the keys and values at every step, and a bigger batch does not reduce it. So at long sequence lengths, the cache read dominates. A smaller cache means a faster decode step, not only more room.

In the worked example above, a decode step at batch 16 must read 32 GiB of cache. Llama-3.1-8B is about the same size but uses GQA with 8 KV heads. At the same $T$ and $B$, its cache is 8 GiB per step.

## 5. MQA: one key head and one value head for all

### 5.1 The idea and the formula

Shazeer, "Fast Transformer Decoding: One Write-Head is All You Need" (2019), keeps $H$ query heads but only one key head and one value head. In the words of the paper, "the keys and values are shared across all of the different attention heads".

$$
\text{numbers per token per layer} = 2 \times 1 \times d_h = 2 d_h
$$

The saving factor is $H$. The paper states that MQA reduces the $n/d$ term of the memory-to-arithmetic ratio "by a factor of h". The new ratio is about $\Theta(1/d + n/(dh) + 1/b)$.

The computation itself barely changes. Each query head still computes its own scores against the shared keys, so the model still has $H$ different attention patterns.

### 5.2 What the paper measured

The experiments use an encoder-decoder model for WMT14 English to German translation. All models have 211 million parameters. To keep the count equal, the MQA model widens the feed-forward layers from 4096 to 5440.

| Model | ln(PPL) dev | BLEU dev | BLEU test, beam 1 / 4 | Decoder time per token, greedy | Decoder time per token, beam 4 |
|---|---|---|---|---|---|
| Multi-head ($h = 8$) | 1.424 | 26.7 | 27.7 / 28.4 | 46 µs | 203 µs |
| Multi-query ($h = 8$) | 1.439 | 26.5 | 27.5 / 28.5 | 3.8 µs | 32 µs |

The times are TPUv2-microseconds per output token, from Table 2 of the paper. Computed in these notes: greedy decoding of the decoder is about $46 / 3.8 \approx 12$ times faster, and beam-4 decoding about $203 / 32 \approx 6.3$ times faster. The paper calls the quality of MQA "slightly worse than the baseline".

### 5.3 The weakness of MQA

One shared head is a strong limit. The GQA paper reports two problems:

1. **Quality.** Uptrained MQA models score lower than MHA (table in section 6.3).
2. **Stability.** Appendix A of the GQA paper states that "multi-query attention can lead to training instability during fine-tuning", in particular on long-input tasks.

A real MQA model: Falcon-7B. Its `config.json` has 71 attention heads, hidden size 4544 (so $d_h = 4544 / 71 = 64$), 32 layers, and multi-query attention enabled. Its cache per token in BF16 is $2 \times 32 \times 1 \times 64 \times 2 = 8{,}192$ bytes $= 8$ KiB.

## 6. GQA: one KV head per group of query heads

### 6.1 Groups, the formula and the mapping

Ainslie et al., "GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints" (2023), divide the $H$ query heads into $H_{kv}$ groups. Each group shares one key head and one value head.

$$
\text{numbers per token per layer} = 2 \times H_{kv} \times d_h, \qquad G = \frac{H}{H_{kv}}, \qquad \text{saving factor} = \frac{H}{H_{kv}}
$$

The paper names both ends: "GQA-1, with a single group and therefore single key and value head, is equivalent to MQA", and "GQA-H, with groups equal to number of heads, is equivalent to MHA."

Query head $h$ (counting from 0) uses KV head $\lfloor h / G \rfloor$. For Llama-3.1-8B, $H = 32$, $H_{kv} = 8$ and $G = 4$. So query heads 0 to 3 use KV head 0, heads 4 to 7 use KV head 1, and so on.

![Alt text: eight query heads share eight, two or one KV heads, or one latent vector in MLA.](/notes/media/llm-systems/figures/03-5-head-sharing.svg)

> [!example] Worked example: the saving of GQA in Llama 3.1
> The Llama 3 paper (Table 3) gives the 8B model 32 layers, 32 attention heads and 8 key/value heads. The 70B model has 80 layers, 64 heads and 8 key/value heads. Both use $d_h = 128$. The paper says the 8 KV heads serve "to improve inference speed and to reduce the size of key-value caches during decoding."
>
> - 8B: $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes $= 128$ KiB per token. With MHA it would be $2 \times 32 \times 32 \times 128 \times 2 = 512$ KiB. Saving factor $32 / 8 = 4$.
> - 70B: $2 \times 80 \times 8 \times 128 \times 2 = 327{,}680$ bytes $= 320$ KiB per token. With MHA it would be $2{,}560$ KiB. Saving factor $64 / 8 = 8$.
>
> The bigger model saves more, because it has more query heads but the same 8 KV heads.

```video
{"src": "/notes/media/llm-systems/manim/m14-gqa-head-sharing.mp4", "caption": "Eight query heads share two KV heads: each group of four reads the same cached keys and values."}
```

### 6.2 Two implementations, one result

The cache stores $H_{kv}$ heads. The attention needs $H$ query heads. There are two ways to connect them:

```python
import numpy as np

rng = np.random.default_rng(0)
B, H, H_KV, T, D_H = 1, 8, 2, 5, 4
G = H // H_KV                                    # 4 query heads per KV head
q = rng.normal(size=(B, H, 1, D_H))              # one decode query per query head
K = rng.normal(size=(B, H_KV, T, D_H))           # the cache holds only H_KV heads
V = rng.normal(size=(B, H_KV, T, D_H))


def softmax(s):
    e = np.exp(s - s.max(-1, keepdims=True))
    return e / e.sum(-1, keepdims=True)


# Way 1: copy each KV head G times, then run ordinary multi-head attention.
K_rep, V_rep = np.repeat(K, G, axis=1), np.repeat(V, G, axis=1)        # [B, H, T, D_H]
out1 = softmax(q @ K_rep.transpose(0, 1, 3, 2) / np.sqrt(D_H)) @ V_rep  # [B, H, 1, D_H]

# Way 2: group the query heads. No copy of K or V.
qg = q.reshape(B, H_KV, G, 1, D_H)               # query head h uses KV head h // G
s = qg @ K[:, :, None].transpose(0, 1, 2, 4, 3) / np.sqrt(D_H)          # [B, H_KV, G, 1, T]
out2 = (softmax(s) @ V[:, :, None]).reshape(B, H, 1, D_H)

assert np.allclose(out1, out2)
print("same output; K bytes read: way 1 =", K_rep.nbytes, ", way 2 =", K.nbytes)
```

Output (measured): `same output; K bytes read: way 1 = 1280 , way 2 = 320`.

Line by line:

1. `np.repeat(K, G, axis=1)` makes head order `[kv0, kv0, kv0, kv0, kv1, ...]`. This is what Hugging Face `repeat_kv` does with `expand` and `reshape`. It is simple, but it builds a tensor $G$ times larger in memory.
2. `q.reshape(B, H_KV, G, 1, D_H)` groups the query heads instead. Query head $h = \text{kv} \cdot G + g$ lands at index `[kv, g]`. This matches the mapping $\lfloor h / G \rfloor$.
3. `K[:, :, None]` adds a group axis of size 1, so NumPy broadcasting reuses each KV head for all $G$ queries of its group. No copy is made.
4. The final `reshape` returns to $[B, H, 1, d_h]$. The assertion proves that both ways give the same numbers.

Way 2 is what a good GPU kernel does. It loads each KV head from memory once and uses it for $G$ query heads. That is the real speed gain of GQA: fewer bytes read per step. PyTorch exposes it as `F.scaled_dot_product_attention(..., enable_gqa=True)`, which [L4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) used.

### 6.3 Uptraining: from an MHA checkpoint to GQA

Training a new model from zero is expensive. The GQA paper converts existing MHA checkpoints in two steps:

1. **Convert.** "The projection matrices for key and value heads are mean pooled into single projection matrices." Each group of heads becomes one head with the average weights. The paper reports that mean pooling worked better than keeping a single head, and that both worked better than random initialization.
2. **Uptrain.** Continue training for "a small proportion α of its original training steps". With $\alpha = 0.05$ (5 % of the original pre-training compute), the paper reports about 600 TPUv3 chip-days for T5-XXL.

Results from Table 1 of the GQA paper (T5 models, average over summarization, translation and question-answering tasks):

| Model | Inference time per sample | Average score |
|---|---|---|
| MHA-Large | 0.37 s | 46.0 |
| MHA-XXL | 1.51 s | 47.2 |
| MQA-XXL (uptrained) | 0.24 s | 46.6 |
| GQA-8-XXL (uptrained) | 0.28 s | 47.1 |

Read the table as an engineer. GQA-8 keeps almost all the quality of MHA-XXL (47.1 vs 47.2) at almost the speed of MQA (0.28 s vs 0.24 s). Computed in these notes: it is about $1.51 / 0.28 \approx 5.4$ times faster than MHA-XXL. The paper chose 8 groups "as a favorable middle ground", and it notes that GQA keeps "the same proportional decrease in bandwidth and capacity as model size increases."

### 6.4 GQA and tensor parallelism

With tensor parallelism, each GPU computes some of the heads (see [Part 04 L8](/notes/ai/llm-systems/04-inference/l8-parallelism)). The KV heads are divided between the GPUs too, so each GPU caches only its own KV heads.

A problem appears when there are more GPUs than KV heads. Llama-3.1-70B has 8 KV heads. On 16 GPUs, each GPU still needs at least one KV head. vLLM 0.31.0 handles this in `QKVParallelLinear`: when `tp_size >= total_num_kv_heads`, each GPU gets one KV head and `num_kv_head_replicas = tp_size / total_num_kv_heads`. So the KV heads are copied, and part of the saving is lost.

### 6.5 What GQA changes in the parameter count

GQA also makes the key and value projections smaller. In Llama-3.1-8B, $W_K$ and $W_V$ each map 4096 numbers to $8 \times 128 = 1024$ numbers, while $W_Q$ and $W_O$ are $4096 \times 4096$. The attention block per layer has $2 \times 4096^2 + 2 \times 4096 \times 1024 = 41{,}943{,}040$ weights, about 41.9M. With MHA it would have $4 \times 4096^2 = 67{,}108{,}864$. Models usually give the saved parameters to the MLP. The MQA paper did this explicitly with a wider feed-forward layer.

## 7. MLA: cache a compressed latent

### 7.1 Low-rank joint compression

DeepSeek-V2 (DeepSeek-AI, 2024) asks a different question. GQA removes heads. MLA keeps all heads, but stores a compressed version of the information from which all keys and values can be rebuilt.

For a token with hidden state $h_t$, the paper defines (equations 9 to 11, written with column vectors):

$$
c_t^{KV} = W^{DKV} h_t, \qquad k_t^{C} = W^{UK} c_t^{KV}, \qquad v_t^{C} = W^{UV} c_t^{KV}
$$

The symbols mean:

- $c_t^{KV}$ is the latent vector with $d_c$ numbers. The paper says $d_c \ll d_h n_h$.
- $W^{DKV}$ is the down-projection from the model width to $d_c$.
- $W^{UK}$ and $W^{UV}$ are the up-projections from $d_c$ to the keys and values of all $n_h$ heads.
- The superscript $C$ means "content": these keys carry no position information (section 7.3).

During inference, only $c_t^{KV}$ needs to be cached. Everything else can be computed from it.

### 7.2 The absorption trick

Rebuilding keys and values from the latent at every step would cost a lot of compute. The paper avoids it: "since $W^{UK}$ can be absorbed into $W^{Q}$, and $W^{UV}$ can be absorbed into $W^{O}$, we even do not need to compute keys and values out for attention."

Here is why, for one head $i$. Write $W^{UK}_i$ for the rows of $W^{UK}$ that make the key of head $i$.

**Keys.** The content score between query $q_{t,i}$ and the key of token $j$ is

$$
q_{t,i}^\top k_{j,i}^C = q_{t,i}^\top \left( W_i^{UK} c_j^{KV} \right) = \left( (W_i^{UK})^\top q_{t,i} \right)^\top c_j^{KV} = \tilde{q}_{t,i}^\top c_j^{KV}
$$

So the query is moved into the latent space once per step: $\tilde{q}_{t,i} = (W_i^{UK})^\top q_{t,i}$, with $d_c$ numbers. Then it is compared with the cached latents directly. Because $q_{t,i}$ is itself a linear function of the hidden state, $(W_i^{UK})^\top$ can be merged with the query projection in advance. That is the meaning of "absorbed into $W^Q$".

**Values.** The output of head $i$ is a weighted sum of values, followed by the output projection:

$$
o_{t,i} = \sum_j p_{t,j} \, W_i^{UV} c_j^{KV} = W_i^{UV} \left( \sum_j p_{t,j} \, c_j^{KV} \right)
$$

Matrix multiplication distributes over the sum. So the code first mixes the latents (a vector of $d_c$ numbers), then applies $W_i^{UV}$ once. Since $W^O$ follows anyway, the product $W^O_i W_i^{UV}$ can be computed in advance: "absorbed into $W^O$".

![Alt text: tokens write a 512-number latent and a 64-number RoPE key into the cache, and each head reads the latents with an absorbed query.](/notes/media/llm-systems/figures/03-5-mla-absorption.svg)

### 7.3 Why RoPE breaks absorption, and the decoupled key

The paper states that "RoPE is incompatible with low-rank KV compression." The reason is the position. With RoPE, the key of token $j$ would be $R_j W_i^{UK} c_j^{KV}$, and the query $R_t q_{t,i}$. The score becomes

$$
q_{t,i}^\top R_t^\top R_j W_i^{UK} c_j^{KV} = q_{t,i}^\top R_{j-t} W_i^{UK} c_j^{KV}
$$

The rotation $R_{j-t}$ sits between the query and $W_i^{UK}$, and it changes with the distance $j - t$. So no single fixed matrix can absorb $W_i^{UK}$. The paper concludes that "we must recompute the keys for all the prefix tokens during inference", which "will significantly hinder the inference efficiency".

The fix is to give position its own small channel (equations 14 to 17):

$$
q_{t}^R = \mathrm{RoPE}(W^{QR} c_t^Q), \qquad k_t^R = \mathrm{RoPE}(W^{KR} h_t)
$$

$$
q_{t,i} = [\,q_{t,i}^C,\ q_{t,i}^R\,], \qquad k_{t,i} = [\,k_{t,i}^C,\ k_t^R\,]
$$

The square brackets join two vectors end to end (concatenation).

1. Each head gets an extra query part $q_{t,i}^R$ with $d_h^R$ numbers.
2. All heads share ONE extra key $k_t^R$ with $d_h^R$ numbers. It is cached after RoPE.
3. The score is the sum of a content part (absorbed, no position) and a position part (small, with RoPE).
4. The softmax scale becomes $1 / \sqrt{d_h + d_h^R}$, because the full query and key have $d_h + d_h^R$ numbers.

$c_t^Q$ in the first equation is a compressed query. The paper also compresses queries, but only "to reduce the activation memory during training". Query compression does not change the cache.

### 7.4 What MLA caches, in numbers

Table 1 of the DeepSeek-V2 paper gives the cache per token, counted in numbers (elements), for $l$ layers:

| Mechanism | KV cache per token | Capability (as the paper states) |
|---|---|---|
| MHA | $2 n_h d_h l$ | Strong |
| GQA | $2 n_g d_h l$ | Moderate |
| MQA | $2 d_h l$ | Weak |
| MLA | $(d_c + d_h^R)\, l \approx \frac{9}{2} d_h l$ | Stronger |

Here $n_g$ is the number of KV groups, which this guide calls $H_{kv}$. For DeepSeek-V2 the paper sets $d_c = 4 d_h$ and $d_h^R = d_h / 2$, with $d_h = 128$. So $d_c = 512$ and $d_h^R = 64$. The paper says MLA needs a cache "equal to GQA with only 2.25 groups, but can achieve stronger performance than MHA".

> [!example] Worked example: the MLA cache of DeepSeek-V2 and DeepSeek-V3
> **Per layer:** $d_c + d_h^R = 512 + 64 = 576$ numbers per token. Check the paper's claim: $576 / 128 = 4.5 = \frac{9}{2}$, and GQA with $n_g$ groups stores $2 n_g \times 128$, so $n_g = 576 / 256 = 2.25$.
>
> **DeepSeek-V2:** 60 layers (paper, section 3.1.2). In BF16: $576 \times 60 \times 2 = 69{,}120$ bytes $= 67.5$ KiB per token.
>
> **DeepSeek-V3:** 61 layers, `kv_lora_rank` 512 and `qk_rope_head_dim` 64 in the official config. In BF16: $576 \times 61 \times 2 = 70{,}272$ bytes $\approx 68.6$ KiB per token. At 131,072 tokens, that is $70{,}272 \times 131{,}072 \approx 8.58$ GiB.
>
> **Compare:** Llama-3.1-70B (GQA, 320 KiB per token) stores about $327{,}680 / 70{,}272 \approx 4.7$ times more per token, although DeepSeek-V3 has 128 query heads.
>
> **Compare with full keys and values:** DeepSeek-V3 has 128 heads, keys of $128 + 64 = 192$ numbers and values of 128 numbers. Caching them would take $128 \times (192 + 128) = 40{,}960$ numbers per token per layer, about 71 times more than 576.

The official DeepSeek-V3 inference code (`inference/model.py`) shows both designs. With `attn_impl = "naive"`, it allocates `k_cache` of shape `[max_batch_size, max_seq_len, n_local_heads, qk_head_dim]` and a matching `v_cache`. With `attn_impl = "absorb"`, the default, it allocates only `kv_cache` of shape `[max_batch_size, max_seq_len, kv_lora_rank]` and `pe_cache` of shape `[max_batch_size, max_seq_len, qk_rope_head_dim]`. In the absorb mode, it stores the latent after an RMSNorm (`self.kv_norm(kv)`).

The paper states two more facts about deployment. DeepSeek-V2 converts its parameters to FP8 and compresses "each element in its KV cache into 6 bits on average". Its headline claims are a KV cache reduced "by 93.3%" and a maximum generation throughput "5.76 times" that of DeepSeek 67B, measured on 8 H800 GPUs. These numbers combine MLA, quantization and other changes, so they are not the effect of MLA alone.

### 7.5 A proof in NumPy: naive and absorbed give the same output

The code below builds a small MLA layer with 4 heads, $d_h = 8$, $d_c = 6$ and $d_h^R = 2$. It computes the attention of the newest token twice: once with rebuilt keys and values, once with absorption.

```python
import numpy as np

rng = np.random.default_rng(0)
D, N_H, D_H, D_C, D_R, T = 32, 4, 8, 6, 2, 5   # model dim, heads, head dim, latent dim, RoPE dim, tokens


def w(*shape):
    return rng.normal(0.0, 0.3, shape)


W_DKV = w(D, D_C)            # down-projection to the latent c
W_UK = w(N_H, D_C, D_H)      # latent -> key, one matrix per head
W_UV = w(N_H, D_C, D_H)      # latent -> value, one matrix per head
W_KR = w(D, D_R)             # hidden -> shared RoPE key
W_Q = w(N_H, D, D_H)         # hidden -> content query, per head
W_QR = w(N_H, D, D_R)        # hidden -> RoPE query, per head
W_O = w(N_H, D_H, D)         # output projection, one slice per head


def rope(x, pos):            # x: [n, 2], one frequency of 1 radian per position
    a = np.asarray(pos, float)[:, None]
    return np.concatenate([x[:, :1] * np.cos(a) - x[:, 1:] * np.sin(a),
                           x[:, :1] * np.sin(a) + x[:, 1:] * np.cos(a)], axis=1)


def softmax(s):
    e = np.exp(s - s.max())
    return e / e.sum()


h = w(T, D)                              # hidden states of 5 tokens in one layer
c = h @ W_DKV                            # [T, D_C]  <- the cache
k_r = rope(h @ W_KR, np.arange(T))       # [T, D_R]  <- the cache (shared by all heads)
x = h[-1:]                               # the newest token makes the query, position T - 1
scale = 1 / np.sqrt(D_H + D_R)

# Naive: rebuild the full key and value of every head from the latent.
naive = 0
for i in range(N_H):
    k_c, v_c = c @ W_UK[i], c @ W_UV[i]                       # [T, D_H] each
    q_c, q_r = x @ W_Q[i], rope(x @ W_QR[i], [T - 1])         # [1, D_H], [1, D_R]
    p = softmax((q_c @ k_c.T + q_r @ k_r.T) * scale)          # [1, T]
    naive = naive + (p @ v_c) @ W_O[i]                        # [1, D]

# Absorbed: never build keys or values.
absorbed = 0
for i in range(N_H):
    q_lat = (x @ W_Q[i]) @ W_UK[i].T                          # [1, D_C]: W_UK moved to the query
    q_r = rope(x @ W_QR[i], [T - 1])
    p = softmax((q_lat @ c.T + q_r @ k_r.T) * scale)          # scores straight from the latents
    absorbed = absorbed + (p @ c) @ (W_UV[i] @ W_O[i])        # W_UV merged into W_O

assert np.allclose(naive, absorbed)
print("same output. Cached numbers per token:", D_C + D_R,
      "| full K and V per token:", N_H * (D_H + D_R) + N_H * D_H)
```

Output (measured): `same output. Cached numbers per token: 8 | full K and V per token: 72`.

The code uses row vectors, so the matrices appear transposed compared with the paper's column-vector equations. The key lines:

1. `c = h @ W_DKV` and `k_r = rope(h @ W_KR, ...)` are the whole cache: $6 + 2 = 8$ numbers per token.
2. `q_lat = (x @ W_Q[i]) @ W_UK[i].T` is the absorbed query $\tilde{q}$. In a real model, `W_Q[i] @ W_UK[i].T` would be one precomputed matrix.
3. `q_lat @ c.T + q_r @ k_r.T` is the score: a content part against the latents plus a position part against the shared RoPE key.
4. `(p @ c) @ (W_UV[i] @ W_O[i])` mixes the latents first, then applies the merged matrix.

### 7.6 What MLA costs

MLA is not free. It moves work from memory to compute. The numbers below are computed in these notes, per cached token, per layer, for one decode step in BF16:

| Design | Bytes read per cached token | FLOPs per query head per cached token | FLOPs per byte |
|---|---|---|---|
| MHA, $d_h = 128$ | 512 per head | $2 \times 128 + 2 \times 128 = 512$ | 1 |
| GQA, $G = 4$ (Llama-3.1-8B) | 512 per KV head, used by 4 query heads | 512 | 4 |
| MLA absorbed, 128 heads (DeepSeek-V3) | $576 \times 2 = 1{,}152$, used by all 128 heads | $2 \times 576 + 2 \times 512 = 2{,}176$ | about 242 |

Interpretation of these notes:

1. Each absorbed head works in $d_c = 512$ dimensions instead of $d_h = 128$. So it does about 4.25 times more arithmetic per cached token than an MHA head.
2. All 128 heads share one cached latent. So the decode attention of MLA has a high arithmetic intensity. The ridge point of an H100 is about 295 FLOPs per byte. So MLA decode attention is close to the compute-bound region, while MHA and GQA decode attention stay deep in the memory-bound region. See [Part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound).
3. With tensor parallelism, each GPU holds fewer heads but must still read the whole latent, so the intensity per GPU drops.
4. During prefill, the many query tokens already make attention compute-bound, so absorption helps less there. The official code offers both a `naive` and an `absorb` mode, and the default is `absorb`.
5. MLA must be part of the model from the start of training. You cannot convert a Llama checkpoint to MLA by mean pooling.

## 8. Real models side by side

Every row below was computed from a source that this page cites. KV bytes are for BF16 (2 bytes per number).

| Model | Attention | $L$ | $H$ | $H_{kv}$ | $d_h$ | KV per token | Saving vs MHA |
|---|---|---|---|---|---|---|---|
| Llama-2-7B | MHA | 32 | 32 | 32 | 128 | 512 KiB | 1 |
| Falcon-7B | MQA | 32 | 71 | 1 | 64 | 8 KiB | 71 |
| Mistral-7B-v0.1 | GQA | 32 | 32 | 8 | 128 | 128 KiB | 4 |
| Llama-3.1-8B | GQA | 32 | 32 | 8 | 128 | 128 KiB | 4 |
| Qwen2.5-7B | GQA | 28 | 28 | 4 | 128 | 56 KiB | 7 |
| Llama-3.1-70B | GQA | 80 | 64 | 8 | 128 | 320 KiB | 8 |
| Llama-3.1-405B | GQA | 126 | 128 | 8 | 128 | 504 KiB | 16 |
| DeepSeek-V2 | MLA | 60 | 128 | latent | 128 | 67.5 KiB | about 57 |
| DeepSeek-V3 | MLA | 61 | 128 | latent | 128 | about 68.6 KiB | about 57 |

Notes on the table:

1. For MLA, the column "Saving vs MHA" compares with an MHA of 128 heads of size 128, as in Table 1 of the DeepSeek-V2 paper. That MHA stores $2 \times 128 \times 128 = 32{,}768$ numbers per layer against 576, so the factor is $32{,}768 / 576 \approx 56.9$.
2. Qwen2.5-7B: its `config.json` gives hidden size 3584 and 28 heads, so $d_h = 3584 / 28 = 128$.
3. Mistral-7B-v0.1 also uses a sliding window of 4,096 tokens. So its cache stops growing at 4,096 tokens per layer. [L6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) explains this.
4. "KV per token" is the full cache per token. For Llama-3.1-8B, the per-token size times the length gives the totals of [L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula).

```plot
{"title": "KV cache of one sequence vs context length, BF16: Llama-2-7B MHA (red), Llama-3.1-8B GQA (blue), DeepSeek-V3 MLA (purple), Falcon-7B MQA (gold)", "xAxis": {"label": "context length in thousands of tokens", "domain": [0, 32]}, "yAxis": {"label": "GiB", "domain": [0, 17]}, "disableZoom": true, "data": [{"fn": "0.5*x", "color": "#C81D25"}, {"fn": "0.125*x", "color": "#1E6091"}, {"fn": "0.0670166*x", "color": "#6A4C93"}, {"fn": "0.0078125*x", "color": "#B8860B"}]}
```

The plot multiplies the per-token size by $1{,}024 x$ tokens. Llama-2-7B was trained with a context of 4,096 tokens, so its line beyond 4K only shows the formula.

## 9. How to choose

| Design | Cache per token per layer | Quality (as reported) | Needs | Used by (examples above) |
|---|---|---|---|---|
| MHA | $2 H d_h$ | The reference | Nothing | Llama-2-7B |
| MQA | $2 d_h$ | Lower, and less stable in fine-tuning | Training or uptraining | Falcon-7B |
| GQA | $2 H_{kv} d_h$ | Close to MHA with 8 groups | Training, or uptraining with about 5 % of the compute | Llama 3.1, Mistral, Qwen2.5 |
| MLA | $d_c + d_h^R$ | Stronger than MHA, according to DeepSeek-V2 | Training from the start, custom kernels | DeepSeek-V2, V3 |

Interpretation of these notes: GQA with 8 KV heads became the common default. It gives most of the saving with almost no quality loss, and it works with standard attention kernels. MLA gives a much smaller cache, but every engine needs special kernels for it.

## 10. Practice

### Exercises

Write your code in `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, notebook folder `llm-systems/`.

1. **GQA without copies.** Write `gqa_decode(q, K, V)` for $q$ of shape $[B, H, 1, d_h]$ and $K, V$ of shape $[B, H_{kv}, T, d_h]$. Do not copy K or V.
   - Acceptance test: the output equals "repeat, then MHA" for $(H, H_{kv})$ = (8, 8), (8, 2), (8, 1) and (32, 8).
   - Hint 1: reshape the queries to $[B, H_{kv}, G, 1, d_h]$.
   - Hint 2: add an axis of size 1 to K and V so that broadcasting reuses them.
2. **Mean pooling for uptraining.** Write `mean_pool_kv_heads(W, n_heads, n_kv_heads, head_dim)` that turns an MHA key projection of shape $[d, H d_h]$ into a GQA projection of shape $[d, H_{kv} d_h]$.
   - Acceptance test: if all heads are equal, the result equals that head in every group. KV head 0 equals the mean of heads 0 to $G - 1$.
   - Hint 1: reshape to $[d, H_{kv}, G, d_h]$.
   - Hint 2: average over the $G$ axis.
3. **An MLA decode loop.** Build an `MLACache` that stores only the latent and the RoPE key. Decode 9 tokens one by one with absorption.
   - Acceptance test: at every step, the absorbed output equals the naive output that rebuilds keys and values from all hidden states.
   - Hint 1: merge `W_UV[i] @ W_O[i]` once, before the loop.
   - Hint 2: rotate the RoPE key with the token's own position when you append it.
4. **A cache calculator.** Write `kv_bytes_per_token(kind, ...)` for MHA, GQA, MQA and MLA.
   - Acceptance test: it reproduces Llama-2-7B (524,288 bytes), Falcon-7B (8,192), Llama-3.1-8B (131,072), Llama-3.1-70B (327,680) and DeepSeek-V3 (70,272).
   - Hint 1: compute the numbers per layer first.
   - Hint 2: MLA has no factor 2, because one latent serves both keys and values.

## 11. Common mistakes

1. **"GQA reduces the number of attention patterns."** No. Every query head still computes its own scores and its own softmax. Only the keys and values are shared.
2. **"GQA saves compute."** Mostly no. The attention FLOPs stay about the same. GQA saves memory and memory traffic, and that is what makes decode faster.
3. **"The saving factor is $H_{kv}$."** No. It is $H / H_{kv}$. Llama-3.1-70B has 8 KV heads and 64 query heads, so its cache is 8 times smaller than MHA.
4. **"You can switch a trained MHA model to GQA by deleting heads."** No. The GQA paper mean-pools the heads and then uptrains with about 5 % of the original compute. Without uptraining, quality drops.
5. **"MLA is a smaller GQA."** No. MLA keeps 128 distinct key and value heads. It stores a shared latent from which all of them can be rebuilt, and with absorption they are never rebuilt.
6. **"MLA can apply RoPE to its compressed keys."** No. RoPE puts a position-dependent rotation between the query and $W^{UK}$, so absorption fails. MLA adds a separate small RoPE key that all heads share.
7. **"MLA's latent stores keys and values separately, so the cache formula has a factor 2."** No. One latent of $d_c$ numbers serves both. The formula is $(d_c + d_h^R)\, l$.
8. **"A smaller cache always means faster decode."** Not for MLA alone. The absorbed attention does more arithmetic per cached byte, so it can become compute-bound.

## 12. One-minute explanation

Every token stores, in every layer, the keys and values of its KV heads, so the cache per token is $2 \times H_{kv} \times d_h$ numbers per layer. Multi-head attention has one KV head per query head, which gives the largest cache. Multi-query attention shares one KV head among all query heads. That shrinks the cache by $H$ times, but it loses some quality and can make fine-tuning unstable. Grouped-query attention is the middle ground: groups of query heads share a KV head. Llama 3.1 uses 8 KV heads, so the 8B model stores 128 KiB per token instead of 512 KiB. You can convert an MHA checkpoint to GQA by mean-pooling the heads of each group and uptraining with about 5 % of the original compute. DeepSeek's multi-head latent attention instead stores one compressed latent of 512 numbers plus a shared 64-number RoPE key per token per layer. Attention is linear in the keys and values, so the up-projections can be absorbed into the query and output projections. Then full keys and values are never built at decode time. RoPE would block that absorption, so MLA carries position in a separate small decoupled key. The result for DeepSeek-V3 is about 68.6 KiB per token in BF16, at the price of more arithmetic per cached byte and custom kernels.

## 13. Check questions

```check
{"question": "Write the KV cache size per token per layer for MHA, MQA, GQA and MLA, and say what each symbol means.", "hint": "MLA has no factor 2.", "answer": "| Design | Numbers per token per layer |\n|---|---|\n| MHA | $2 H d_h$ |\n| MQA | $2 d_h$ |\n| GQA | $2 H_{kv} d_h$ |\n| MLA | $d_c + d_h^R$ |\n\n$H$ = query heads, $H_{kv}$ = KV heads, $d_h$ = head dimension, $d_c$ = size of the latent vector, $d_h^R$ = size of the shared RoPE key. Multiply by the number of layers $L$ and the bytes per number $s$ to get bytes per token. The factor 2 counts keys and values. MLA has none, because one latent serves both."}
```

```check
{"question": "Llama-3.1-8B has 32 query heads and 8 KV heads. Which KV head does query head 13 use, and how many query heads share it?", "hint": "G = H / H_kv. Query head h uses KV head floor(h / G).", "answer": "$G = 32 / 8 = 4$. Query head 13 uses KV head $\\lfloor 13 / 4 \\rfloor = 3$. KV head 3 serves query heads 12, 13, 14 and 15: four query heads."}
```

```check
{"question": "Interview follow-up: GQA does not reduce the attention FLOPs. Why does it still make decode faster?", "hint": "What limits a decode step: arithmetic or memory reads?", "answer": "Decode is memory-bound. Each step must read the weights once and the whole cache of every sequence. The attention arithmetic per cached byte is tiny (about 1 FLOP per byte for MHA in BF16).\n\nGQA cuts the bytes of the cache by $H / H_{kv}$. A good kernel loads each KV head once and uses it for all $G$ query heads of its group, so the bytes read per step fall by the same factor. Shazeer (2019) showed that the memory-to-arithmetic ratio of MHA decoding is about $\\Theta(n/d + 1/b)$, and the $n/d$ term (loading K and V) is the one that sharing reduces. The FLOPs are almost the same, but the step waits less for memory. A smaller cache also lets more sequences fit, so the batch can grow."}
```

```check
{"question": "Interview follow-up: derive the absorption trick of MLA for the keys and for the values.", "hint": "Write k = W_UK c and o = sum of p_j W_UV c_j. Move the matrices.", "answer": "**Keys.** For head $i$, the content key of token $j$ is $k_{j,i} = W_i^{UK} c_j$. The score is\n\n$$\nq_{t,i}^\\top W_i^{UK} c_j = \\left((W_i^{UK})^\\top q_{t,i}\\right)^\\top c_j = \\tilde q_{t,i}^\\top c_j\n$$\n\nSo the query is mapped into the latent space once per step ($d_c$ numbers), and compared with the cached latents directly. Since $q_{t,i}$ is a linear map of the hidden state, $(W_i^{UK})^\\top$ merges with the query projection in advance.\n\n**Values.** $o_{t,i} = \\sum_j p_{t,j} W_i^{UV} c_j = W_i^{UV} \\left(\\sum_j p_{t,j} c_j\\right)$, because matrix multiplication distributes over the sum. Mix the latents first, then apply $W_i^{UV}$. The output projection follows, so $W_i^O W_i^{UV}$ is one precomputed matrix.\n\nResult: the full keys and values of 128 heads are never built at decode time. Only the latents (and the small RoPE key) are read."}
```

```check
{"question": "Interview follow-up: why is RoPE incompatible with MLA's compression, and how does DeepSeek-V2 solve it?", "hint": "Put the rotations into the score and see where they land.", "answer": "With RoPE on the compressed keys, the score of head $i$ is $q_{t,i}^\\top R_t^\\top R_j W_i^{UK} c_j = q_{t,i}^\\top R_{j-t} W_i^{UK} c_j$. The rotation $R_{j-t}$ depends on the distance and sits between the query and $W_i^{UK}$. No fixed matrix can absorb $W_i^{UK}$, so the keys of all earlier tokens would have to be recomputed at every step.\n\nThe fix is decoupled RoPE. Each head gets an extra query part $q_{t,i}^R$, and all heads share one extra key $k_t^R = \\mathrm{RoPE}(W^{KR} h_t)$. The full query and key are concatenations $[q^C; q^R]$ and $[k^C; k^R]$. The score is the content part (no RoPE, absorbable) plus the RoPE part (small). The softmax scale is $1/\\sqrt{d_h + d_h^R}$. The cache stores $c_t$ (512 numbers) and $k_t^R$ (64 numbers) per layer in DeepSeek-V2 and V3."}
```

```check
{"question": "Interview follow-up: compute the KV cache of DeepSeek-V3 and of Llama-3.1-70B for one sequence of 131,072 tokens in BF16. Which is larger, and by how much?", "hint": "DeepSeek-V3: 61 layers, 512 + 64 numbers per layer. Llama-3.1-70B: 80 layers, 8 KV heads, d_h 128.", "answer": "- DeepSeek-V3: $(512 + 64) \\times 61 \\times 2 = 70{,}272$ bytes per token. Times 131,072: $9{,}210{,}691{,}584$ bytes $\\approx 8.58$ GiB.\n- Llama-3.1-70B: $2 \\times 80 \\times 8 \\times 128 \\times 2 = 327{,}680$ bytes per token. Times 131,072: $42{,}949{,}672{,}960$ bytes $= 40$ GiB.\n\nLlama-3.1-70B needs about $327{,}680 / 70{,}272 \\approx 4.7$ times more, although DeepSeek-V3 has 128 query heads and 61 layers."}
```

```check
{"question": "Interview follow-up: you serve Llama-3.1-70B with tensor parallelism on 16 GPUs. What happens to the KV heads, and what does it cost?", "hint": "The model has 8 KV heads.", "answer": "Each GPU needs at least one KV head, but there are only 8 KV heads for 16 GPUs. vLLM 0.31.0 (`QKVParallelLinear`) then gives each GPU one KV head and sets `num_kv_head_replicas = tp_size / total_num_kv_heads = 16 / 8 = 2`. So every KV head is stored on two GPUs. The total cache across the GPUs doubles compared with the minimum, and part of the GQA saving is lost. With 8 GPUs or fewer, the KV heads divide without copies."}
```

```check
{"question": "How was GQA added to existing models without training from zero, and what did it cost?", "hint": "Two steps: convert, then train a little.", "answer": "The GQA paper uptrains MHA checkpoints. Step 1: mean-pool the key and value projection matrices of the heads in each group into one matrix (mean pooling worked better than picking one head or random initialization). Step 2: continue pre-training for $\\alpha = 5\\,\\%$ of the original steps (about 600 TPUv3 chip-days for T5-XXL). The uptrained GQA-8-XXL scored 47.1 vs 47.2 for MHA-XXL, at 0.28 s vs 1.51 s per sample."}
```

```check
{"question": "Interview follow-up: is MLA decode attention memory-bound like MHA? Estimate its arithmetic intensity.", "hint": "Count FLOPs per head per cached token, multiply by the heads that share one latent, divide by the bytes of one latent.", "answer": "Computed in these notes for DeepSeek-V3 in BF16. One cached token per layer: $576 \\times 2 = 1{,}152$ bytes. Per head: the score needs $2 \\times 576 = 1{,}152$ FLOPs, the value mixing $2 \\times 512 = 1{,}024$ FLOPs, total 2,176. All 128 heads read the same latent: $128 \\times 2{,}176 = 278{,}528$ FLOPs. Intensity: $278{,}528 / 1{,}152 \\approx 242$ FLOPs per byte.\n\nFor comparison, MHA is about 1 FLOP per byte and GQA with $G = 4$ about 4. An H100 has a ridge point of about 295 FLOPs per byte. So MLA decode attention (with all heads on one GPU) is close to compute-bound, while MHA and GQA are far into the memory-bound region. With tensor parallelism the heads split across GPUs, and the intensity per GPU falls."}
```

```check
{"question": "Exercise 1: show a reference solution", "answer": "```python\nimport numpy as np\n\n\ndef gqa_decode(q, K, V):\n    \"\"\"q: [B, H, 1, d_h]. K, V: [B, H_kv, T, d_h]. No copy of K or V.\"\"\"\n    B, H, _, d_h = q.shape\n    H_kv = K.shape[1]\n    G = H // H_kv\n    qg = q.reshape(B, H_kv, G, 1, d_h)\n    s = qg @ np.swapaxes(K, -1, -2)[:, :, None] / np.sqrt(d_h)   # [B, H_kv, G, 1, T]\n    s = s - s.max(-1, keepdims=True)\n    p = np.exp(s)\n    p = p / p.sum(-1, keepdims=True)\n    return (p @ V[:, :, None]).reshape(B, H, 1, d_h)\n\n\ndef mha_decode_with_repeat(q, K, V):\n    G = q.shape[1] // K.shape[1]\n    K, V = np.repeat(K, G, axis=1), np.repeat(V, G, axis=1)\n    s = q @ np.swapaxes(K, -1, -2) / np.sqrt(q.shape[-1])\n    p = np.exp(s - s.max(-1, keepdims=True))\n    return (p / p.sum(-1, keepdims=True)) @ V\n\n\nrng = np.random.default_rng(3)\nfor H, H_kv in ((8, 8), (8, 2), (8, 1), (32, 8)):\n    q = rng.normal(size=(2, H, 1, 16))\n    K, V = rng.normal(size=(2, 2, H_kv, 7, 16))\n    assert np.allclose(gqa_decode(q, K, V), mha_decode_with_repeat(q, K, V))\nprint(\"grouped GQA equals repeat-then-MHA for MHA, GQA and MQA shapes\")\n```"}
```

```check
{"question": "Exercise 2: show a reference solution", "answer": "```python\nimport numpy as np\n\n\ndef mean_pool_kv_heads(W, n_heads, n_kv_heads, head_dim):\n    \"\"\"W: [d_model, n_heads * head_dim], a K or V projection of an MHA checkpoint.\n    Returns [d_model, n_kv_heads * head_dim]: each group of heads averaged into one head.\"\"\"\n    d_model = W.shape[0]\n    G = n_heads // n_kv_heads\n    heads = W.reshape(d_model, n_kv_heads, G, head_dim)     # head h = group * G + g\n    return heads.mean(axis=2).reshape(d_model, n_kv_heads * head_dim)\n\n\nrng = np.random.default_rng(0)\nd_model, H, H_kv, d_h = 64, 8, 2, 8\nW_K = rng.normal(size=(d_model, H * d_h))\nW_K_gqa = mean_pool_kv_heads(W_K, H, H_kv, d_h)\nassert W_K_gqa.shape == (64, 16)\n\n# Check 1: if all heads are equal, pooling returns that head for every group.\none_head = rng.normal(size=(d_model, d_h))\nsame = np.tile(one_head, (1, H))\nassert np.allclose(mean_pool_kv_heads(same, H, H_kv, d_h), np.tile(one_head, (1, H_kv)))\n# Check 2: KV head 0 of the result is the mean of heads 0 to 3 of the input.\nassert np.allclose(W_K_gqa[:, :d_h], W_K[:, : 4 * d_h].reshape(d_model, 4, d_h).mean(axis=1))\nprint(\"pooled shape:\", W_K_gqa.shape, \"| KV cache saving factor:\", H // H_kv)\n```"}
```

```check
{"question": "Exercise 3: show a reference solution", "answer": "```python\nimport numpy as np\n\nrng = np.random.default_rng(1)\nD, N_H, D_H, D_C, D_R, T = 32, 4, 8, 6, 2, 9\nW_DKV, W_KR = rng.normal(0, 0.3, (D, D_C)), rng.normal(0, 0.3, (D, D_R))\nW_UK, W_UV = rng.normal(0, 0.3, (N_H, D_C, D_H)), rng.normal(0, 0.3, (N_H, D_C, D_H))\nW_Q, W_QR = rng.normal(0, 0.3, (N_H, D, D_H)), rng.normal(0, 0.3, (N_H, D, D_R))\nW_O = rng.normal(0, 0.3, (N_H, D_H, D))\n\n\ndef rope(x, pos):\n    a = np.asarray(pos, float)[:, None]\n    return np.concatenate([x[:, :1] * np.cos(a) - x[:, 1:] * np.sin(a),\n                           x[:, :1] * np.sin(a) + x[:, 1:] * np.cos(a)], axis=1)\n\n\ndef softmax(s):\n    e = np.exp(s - s.max())\n    return e / e.sum()\n\n\nclass MLACache:\n    def __init__(self):\n        self.c = np.zeros((0, D_C))\n        self.k_r = np.zeros((0, D_R))\n\n    def append(self, h, pos):\n        self.c = np.concatenate([self.c, h @ W_DKV])\n        self.k_r = np.concatenate([self.k_r, rope(h @ W_KR, pos)])\n\n\nW_UV_O = np.einsum(\"icd,ide->ice\", W_UV, W_O)          # merged once, in advance: [N_H, D_C, D]\n\n\ndef decode_absorbed(x, pos, cache):\n    out = 0\n    for i in range(N_H):\n        q_lat = (x @ W_Q[i]) @ W_UK[i].T\n        q_r = rope(x @ W_QR[i], [pos])\n        p = softmax((q_lat @ cache.c.T + q_r @ cache.k_r.T) / np.sqrt(D_H + D_R))\n        out = out + (p @ cache.c) @ W_UV_O[i]\n    return out\n\n\ndef decode_naive(x, pos, h_all):\n    out = 0\n    c = h_all @ W_DKV\n    k_r = rope(h_all @ W_KR, np.arange(len(h_all)))\n    for i in range(N_H):\n        k, v = c @ W_UK[i], c @ W_UV[i]\n        q, q_r = x @ W_Q[i], rope(x @ W_QR[i], [pos])\n        p = softmax((q @ k.T + q_r @ k_r.T) / np.sqrt(D_H + D_R))\n        out = out + (p @ v) @ W_O[i]\n    return out\n\n\nh = rng.normal(size=(T, D))\ncache = MLACache()\nfor t in range(T):                                     # one token per step\n    cache.append(h[t:t + 1], [t])\n    assert np.allclose(decode_absorbed(h[t:t + 1], t, cache), decode_naive(h[t:t + 1], t, h[: t + 1]))\nprint(\"absorbed == naive at all\", T, \"steps; cache per token:\", D_C + D_R, \"numbers\")\n```"}
```

```check
{"question": "Exercise 4: show a reference solution", "answer": "```python\ndef kv_bytes_per_token(kind, n_layers, head_dim=None, n_heads=None, n_kv_heads=None,\n                       d_c=None, d_r=None, bytes_per_elem=2):\n    if kind == \"MHA\":\n        per_layer = 2 * n_heads * head_dim\n    elif kind == \"GQA\":\n        per_layer = 2 * n_kv_heads * head_dim\n    elif kind == \"MQA\":\n        per_layer = 2 * head_dim\n    elif kind == \"MLA\":\n        per_layer = d_c + d_r\n    else:\n        raise ValueError(kind)\n    return per_layer * n_layers * bytes_per_elem\n\n\nassert kv_bytes_per_token(\"MHA\", 32, 128, n_heads=32) == 524_288           # Llama-2-7B\nassert kv_bytes_per_token(\"MQA\", 32, 64) == 8_192                           # Falcon-7B\nassert kv_bytes_per_token(\"GQA\", 32, 128, n_kv_heads=8) == 131_072          # Llama-3.1-8B\nassert kv_bytes_per_token(\"GQA\", 80, 128, n_kv_heads=8) == 327_680          # Llama-3.1-70B\nassert kv_bytes_per_token(\"MLA\", 61, d_c=512, d_r=64) == 70_272             # DeepSeek-V3\nprint(\"all table values reproduced\")\n```"}
```

## 14. Links

- Previous lesson: [L4: Implementing a KV cache](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache)
- Next lesson: [L6: Shrinking the KV cache](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache)
- The size formula: [L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula). Prefill and decode: [L2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode).
- Multi-head attention and its parameter count: [Part 02 L5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention)
- RoPE: [Part 02 L6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block)
- Memory-bound and compute-bound: [Part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound). Tensor parallelism: [Part 04 L8](/notes/ai/llm-systems/04-inference/l8-parallelism).
- Sizing GPUs: [Part 05 L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus)
- Interview drill: [From attention to PagedAttention](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention). Numbers sheet: [Formula sheet](/notes/ai/llm-systems/08-interview-drills/l5-formula-sheet).

### Sources

- Shazeer, "Fast Transformer Decoding: One Write-Head is All You Need", 2019: https://arxiv.org/abs/1911.02150
- Ainslie et al., "GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints", EMNLP 2023: https://arxiv.org/abs/2305.13245
- DeepSeek-AI, "DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model", 2024: https://arxiv.org/abs/2405.04434
- DeepSeek-V3 official config and inference code (`inference/configs/config_671B.json`, `inference/model.py`): https://github.com/deepseek-ai/DeepSeek-V3 and https://huggingface.co/deepseek-ai/DeepSeek-V3 (checked on 2026-10-15)
- Touvron et al., "Llama 2: Open Foundation and Fine-Tuned Chat Models", 2023, Table 1: https://arxiv.org/abs/2307.09288
- Touvron et al., "LLaMA: Open and Efficient Foundation Language Models", 2023, Table 2: https://arxiv.org/abs/2302.13971
- Grattafiori et al., "The Llama 3 Herd of Models", 2024, Table 3: https://arxiv.org/abs/2407.21783
- Jiang et al., "Mistral 7B", 2023, Table 1: https://arxiv.org/abs/2310.06825, and `config.json` of mistralai/Mistral-7B-v0.1: https://huggingface.co/mistralai/Mistral-7B-v0.1 (checked on 2026-10-15)
- `config.json` of Qwen/Qwen2.5-7B-Instruct: https://huggingface.co/Qwen/Qwen2.5-7B-Instruct (checked on 2026-10-15)
- `config.json` of tiiuae/falcon-7b: https://huggingface.co/tiiuae/falcon-7b (checked on 2026-10-15)
- vLLM 0.31.0, `vllm/model_executor/layers/linear.py` (`QKVParallelLinear`): https://github.com/vllm-project/vllm/tree/v0.31.0 (checked on 2026-10-15)
- `transformers` 5.20.0, `repeat_kv` in `models/llama/modeling_llama.py`: https://github.com/huggingface/transformers/tree/v5.20.0 (checked on 2026-10-15)
- NVIDIA H100 specifications: https://www.nvidia.com/en-us/data-center/h100/ (checked on 2026-10-15)
