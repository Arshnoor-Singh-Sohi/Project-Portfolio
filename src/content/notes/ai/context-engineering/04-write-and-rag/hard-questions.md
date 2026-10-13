---
title: "Hard questions: Write and RAG"
order: 99
summary: "Tricky, skeptical and interview questions on the four strategies, WRITE, RAG against long context and fine-tuning, chunking, embeddings and vector search, with full answers."
status: not-started
tags: [write-and-rag, interview, review]
---

Answer each question aloud first. Then read the answer. The lesson code after each idea shows where it comes from.

## 1. Windows now hold a million tokens. Is RAG dead?

No. The large window removes one limit: size, and only for corpora that fit (lesson 4.3). Five other reasons remain:

1. **Cost.** A 500,000-token prompt costs USD 1.00 per query at USD 2 / MTok. A 3,000-token RAG prompt costs USD 0.006. Even with a cache hit on every query, the full prompt costs about 8 times more.
2. **Latency.** Prefill must read every input token before the first output token (lesson 1.4).
3. **Quality.** Accuracy drops with length and depends on position (lesson 1.5).
4. **Access control.** Users with different rights need different content. A retriever filters per user. A full prompt must be built for each group.
5. **Evidence.** RAG gives a small set of chunks that you can log, cite and check.

The "RAG is dead" claim has an honest part. For a small, stable corpus that all users may read, full context with caching can be the better design. Anthropic gives a rule of thumb of 200,000 tokens, about 500 pages. Measure both designs on an evaluation set.

## 2. Why not store one vector for each document?

One vector must describe the whole text. If a document covers $k$ topics, the vector is something like their average, a "blurry average" in the words of the handbook FAQ. Take an idealized model with orthogonal topics. The cosine between a one-topic question and the document is $1/\sqrt{k}$: 0.5 for 4 topics, 0.14 for 50 (lesson 4.5). A focused chunk scores 1.0.

There are two more reasons. The embedding model truncates long inputs, so most of a long document never reaches the vector. And a retrieved document goes into the prompt whole, which costs tokens and adds distractors.

## 3. Cosine similarity or Euclidean distance: which one?

For unit vectors it does not matter for the ranking. The identity $\lVert \mathbf{a} - \mathbf{b} \rVert^2 = 2 - 2\cos(\mathbf{a}, \mathbf{b})$ means that a smaller distance is always a higher cosine (lesson 4.6). OpenAI's embeddings are unit vectors, and many other models normalize too.

It matters when lengths vary. Then the dot product prefers long vectors, and the measures can disagree. The rule: compute the lengths of some of your vectors, and use the metric that the model was trained for. If in doubt, normalize and use cosine. The common claim that cosine wins "because magnitude varies with text length" depends on the model.

## 4. Why must the index and the query use the same embedding model? What if both models have 1,024 dimensions?

Each model learns its own coordinate system. Value 17 of one model has no relation to value 17 of another. So a distance between vectors from two models has no meaning (lesson 4.4).

A dimension mismatch is the safe case: the database rejects the query. Equal dimensions are the dangerous case. `intfloat/e5-large-v2` and `voyage-4` both give 1,024 values. The query runs, the distances look normal, and the results are close to random. "Same model" also means the same version, the same input prefixes (`query:` and `passage:` for E5) and the same vector length. Store these with the index and check them before each query.

## 5. FAISS or a vector database?

FAISS is a library: "a toolkit of indexing methods and related primitives" (lesson 4.7). It builds and searches exact and approximate indexes inside your program, and it is very fast. It does not store text and metadata, handle updates while queries run, filter by metadata, control access, offer an API or make backups.

Use FAISS inside a system that you build, or for research and offline batch work. Use a database (Chroma, pgvector, Qdrant, Pinecone, Weaviate, Milvus) when you need those production features. If your company already runs PostgreSQL, pgvector is often the simplest start.

## 6. How do you choose the chunk size?

Not from a blog post. Three limits set the range (lesson 4.5):

1. **The input limit** of the embedding model, counted with its own tokenizer. All-MiniLM-L6-v2 truncates after 256 word pieces.
2. **Focus.** Smaller chunks give sharper vectors but less context in each hit.
3. **The prompt budget.** $k$ chunks of $C$ tokens cost $k \times C$ tokens on every query.

Inside that range, measure. Label the answer passage of 30 to 50 questions as a character span, not as a chunk ID. Rebuild the index for each candidate size and compare the hit rate in the top $k$ and the prompt tokens. The handbook's "512–1024 tokens with 10–20% overlap" is a starting point. Parent-child chunking removes part of the trade-off: search small chunks, send their parent sections.

## 7. The handbook uses `chunk_size=500`. Five hundred what?

Characters. `RecursiveCharacterTextSplitter` measures length with Python's `len` by default (lesson 4.5). 500 characters of English are about 100 to 125 tokens, not 500 tokens.

The handbook makes two errors that cancel each other. Its stated default, 512 to 1,024 tokens, is too long for its own embedding model, which truncates after 256 word pieces. Its code, at about 125 tokens, fits that model well. To chunk by tokens, use `from_tiktoken_encoder` or `from_huggingface_tokenizer` with the embedding model's tokenizer.

## 8. What does it cost to embed a knowledge base?

Much less than most people think (lesson 4.6). A 10,000-page knowledge base at 800 tokens per page is 8 million tokens. With `text-embedding-3-small` at USD 0.02 / MTok (checked on 2026-10-12), that is USD 0.16. With `text-embedding-3-large` at USD 0.13 / MTok, it is USD 1.04. Overlap multiplies these numbers by $1/(1-o)$: 1.25 for 20% overlap.

The handbook FAQ says "a few dollars", about 20 times too high. The real costs of embeddings are elsewhere. A model change means re-embedding everything and running a second index during the migration. Millions of vectors need storage and memory. An evaluation must prove that a new model is better. Generation, not embedding, is the main cost of each query.

## 9. Our prototype uses Chroma and four Markdown files. What changes for production?

The handbook FAQ's answer is right: the principles stay, the infrastructure changes (lesson 4.7). Concretely:

1. **Ingestion** becomes the hardest part: PDFs, tables, duplicates, access labels, and incremental sync with content hashes (lesson 4.4).
2. **The index** needs settings chosen by measured ANN recall and latency, persistent storage and a rebuild plan.
3. **Filters** for tenants run inside the database query, with tests that prove isolation.
4. **The model** is versioned with the index. A model change is a migration with a shadow index.
5. **Evaluation** runs on every change: retrieval metrics on labeled questions (Part 5).
6. **Monitoring** watches latency percentiles, the trend of top similarity scores, and abstentions.

The handbook gives capacity numbers for Chroma and dedicated databases without a source. Measure your system at your real size.

## 10. Should we fine-tune the model on our documents instead of building RAG?

Usually not for facts (lesson 4.3). Fine-tuning writes knowledge into the weights, which Lewis et al. call parametric memory. Each update needs a new training run. The model cannot cite where a fact came from. You cannot reliably remove one fact after a deletion request. One model serves all users, so per-user access control is impossible.

Fine-tuning is the right tool for behavior: a fixed output format, a tone, a task skill. The two combine well: fine-tune for format, retrieve for facts. The handbook's advice to start with RAG and fine-tune only when needed is a sound rule of thumb.

## 11. Why can't we filter tenants after retrieval?

Two reasons (lesson 4.7). First, empty results. If a tenant owns 1% of a shared index, a top-10 search over all tenants contains on average 0.1 of its chunks. After the filter, about 90% of queries return nothing.

Second, security. The other tenants' chunks already reached your application. One missed check, a log line, a cache or a reranker can send them to the model or to a file. Put the filter inside the database query, and take the tenant ID from the login session. Allow only one search function, with a required tenant argument. Or give each tenant its own collection.

## 12. Is write, select, compress, isolate a complete taxonomy? Where does prompt caching go?

Lance Martin calls them "4 buckets" of common approaches and says that the patterns "are still evolving" (lesson 4.1). He does not claim that the list is complete. The handbook's "exhaustive" is its own claim.

Some techniques are outside the four. Fine-tuning changes the weights, not the window. Prompt caching changes the price and the time to first token, but the model still reads every cached token. So caching is a cost tool, not SELECT. The test: ask which way tokens move. If no tokens enter, leave or shrink the window, the technique is outside the four strategies.

## 13. With a million-token window, an agent can keep everything in its history. Why WRITE at all?

Three reasons (lesson 4.2). First, cost: an agent's cumulative input grows with the square of the number of steps (lesson 1.6). Offloading tool results to files cut the example agent's input by about 79%. Second, quality: old tool results become distractors and stale facts (lesson 1.5). Third, the window ends with the session. A preference or a design decision must survive into the next session, and only WRITE makes that possible.

The opposite failure is real too. Over-writing fills memory with noise that later retrieval returns. Write decisions with their reasons, and keep references to data that the agent can fetch again.

## 14. Check questions

```check
{
  "question": "A 1,000,000-token corpus is chunked with 10% overlap, and again with 50% overlap (as in OpenAI file search's default 800/400). About how many tokens do the chunks hold in each case?",
  "hint": "The storage factor is 1/(1 − o).",
  "answer": "10%: 1/(1 − 0.1) ≈ 1.111, so about 1,111,000 tokens. 50%: 1/(1 − 0.5) = 2, so about 2,000,000 tokens. The handbook's 'about the overlap percentage' is close for 10% but gives 1,500,000 for 50%, which is wrong."
}
```

```check
{
  "question": "A Chroma collection with default settings returns a top distance of 0.9, and the model returns unit vectors. Is the retrieval poor?",
  "answer": "The default metric is squared L2, so 0.9 = 2 − 2cos gives cos = 0.55. Whether 0.55 is poor depends on the model, because each model spreads its scores differently. Calibrate a threshold on labeled relevant and non-relevant pairs for this model and metric."
}
```

```check
{
  "question": "For each case, name the strategy: (a) a sub-agent reads 40 files and returns a 1,000-token summary, (b) an agent saves a 5,000-token API response to disk and keeps the path, (c) a bot loads the user's saved preferences at the start of a session.",
  "answer": "(a) ISOLATE, with COMPRESS of the sub-agent's work into the summary. (b) WRITE, with a reference that allows a later SELECT. (c) SELECT, of memories that an earlier WRITE saved."
}
```

## 15. Links

- Part overview: [04 Write and RAG](/notes/ai/context-engineering/04-write-and-rag)
- First lesson: [L1: Four strategies: write, select, compress, isolate](/notes/ai/context-engineering/04-write-and-rag/l1-four-strategies)
- Next part: [05 Retrieval quality](/notes/ai/context-engineering/05-retrieval-quality)
- [Glossary](/notes/ai/context-engineering/glossary)
