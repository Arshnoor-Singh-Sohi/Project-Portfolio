---
title: "06 RAG"
order: 16
summary: "Why RAG, embeddings, chunking, vector indexes, hybrid search and reranking, query-side techniques, grounding, evaluation and production architecture."
---

This part answers "explain RAG" at production depth. It explains why retrieval helps, how embeddings and vector indexes work, and how to fuse and rerank results. Then it covers grounded answers with citations, evaluation, and a production design. Drill [08 L3](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag) rehearses it.

| Code | Lesson | Core idea | Priority | Status |
|---|---|---|---|---|
| L1 | [Why RAG](/notes/ai/llm-systems/06-rag/l1-why-rag) | Retrieval puts current, private and citable text into the context window for each question. | Core | not started |
| L2 | [Embeddings in depth](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) | A contrastively trained encoder places a question and its answer at nearby vectors. | Core | not started |
| L3 | [Chunking and ingestion](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) | Parsing, chunk size, metadata and incremental updates decide what the retriever can ever find. | Support | not started |
| L4 | [Vector indexes: flat, IVF, HNSW and PQ](/notes/ai/llm-systems/06-rag/l4-vector-indexes) | IVF, HNSW and PQ skip or compress most vectors, and trade recall for speed and memory. | Core | not started |
| L5 | [Hybrid search and reranking](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) | Fuse BM25 and dense ranks with RRF, then let a cross-encoder order the best candidates. | Support | not started |
| L6 | [Query-side techniques and agentic RAG](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) | Rewrite, split or route the query before the search, or let a model run several searches. | Support | not started |
| L7 | [Generation, grounding and citations](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) | Labeled chunks, cite-or-abstain rules and citation checks in code keep the answer grounded. | Support | not started |
| L8 | [Evaluating RAG](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) | Ranking metrics measure retrieval, grounding metrics measure generation, and isolation finds the broken part. | Core | not started |
| L9 | [Production RAG architecture](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) | Ingestion, permissions at query time, caches, a latency budget and monitoring around the pipeline. | Core | not started |
