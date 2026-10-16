---
title: "01 Math and hardware"
order: 11
summary: "Vectors, matrices, tensors, number formats and GPUs: the tools behind every later formula, and why memory bandwidth limits token generation."
---

This part answers one question: what does a GPU really do when it runs a model? It defines vectors, matrices, tensors and number formats from zero. Then it shows why memory bandwidth, not arithmetic, limits token generation. Part 02 uses these tools to build attention.

| Code | Lesson | Core idea | Priority | Status |
|---|---|---|---|---|
| L1 | [Vectors and dot products](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) | The dot product turns two vectors into one match score. | Support | not started |
| L2 | [Matrices and matrix multiplication](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) | Each entry of a matrix product is one dot product, and $(m \times k)(k \times n)$ costs $2mkn$ FLOPs. | Support | not started |
| L3 | [Tensors, shapes and batches](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) | One shape language for the guide, and one layer's KV cache as two tensors $[B, H_{kv}, T, d_h]$. | Core | not started |
| L4 | [Numbers in memory: FP32, BF16, FP8, INT4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) | The bytes per number set the model size and the KV cache size: 2 in BF16, 1 in FP8. | Core | not started |
| L5 | [GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) | Decode reads every weight for each token, so memory bandwidth sets its speed, not FLOPs. | Core | not started |
