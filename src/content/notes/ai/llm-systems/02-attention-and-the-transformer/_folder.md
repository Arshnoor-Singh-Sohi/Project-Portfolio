---
title: "02 Attention and the transformer"
order: 12
summary: "From text to vectors, scaled dot-product attention by hand, the causal mask, multi-head attention, the Llama block and FlashAttention."
---

This part answers "what is attention?" down to every shape and number. It builds scaled dot-product attention on the toy example, then adds the causal mask, many heads and the full Llama block. It ends with the cost of attention and FlashAttention. Lesson L4 shows that past keys and values never change, and part 03 builds the KV cache on that fact.

| Code | Lesson | Core idea | Priority | Status |
|---|---|---|---|---|
| L1 | [From text to vectors and back](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) | Text becomes token IDs, IDs become vectors, and the last vector becomes 128,256 logits. | Support | not started |
| L2 | [Why attention exists](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) | Attention lets each token read every other token directly, as a soft dictionary lookup. | Support | not started |
| L3 | [Scaled dot-product attention, step by step](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) | $\mathrm{softmax}(QK^\top / \sqrt{d_k})V$ by hand on the toy example, and why the scale is $\sqrt{d_k}$. | Core | not started |
| L4 | [Causal masking and generation](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) | The causal mask hides later tokens, and the keys and values of earlier tokens never change. | Core | not started |
| L5 | [Multi-head attention](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) | Many small heads read the same tokens in different ways, at the cost of one big head. | Core | not started |
| L6 | [The transformer block, end to end](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) | RMSNorm, attention with RoPE, residual additions and a SwiGLU MLP, 32 times, give 8.03B parameters. | Core | not started |
| L7 | [The cost of attention and FlashAttention](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) | FlashAttention gives the exact same output with far fewer memory reads, because it never stores the $T \times T$ matrix. | Core | not started |
