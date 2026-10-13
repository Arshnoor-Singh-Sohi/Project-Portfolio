---
title: "Hard questions: Retrieval quality"
order: 99
summary: "Tricky, skeptical and interview questions on BM25, hybrid search and RRF, rerankers, query transformation, MMR, budgets, just-in-time retrieval, evaluation and advanced RAG, with full answers."
status: not-started
tags: [retrieval, interview, review]
---

Answer each question aloud first. Then read the answer. The lesson code after each question shows where the idea comes from.

## 1. Embeddings capture meaning. Why would a modern system still use BM25, a keyword formula from decades ago?

Because embeddings and BM25 fail on different queries (lesson 5.1). An embedding compresses a whole chunk into one vector. An exact code such as "TS-999" or "4012" is a small part of that meaning. Anthropic's contextual-retrieval post uses exactly this example: a query for "Error code TS-999". In BM25, a code that appears in one document has a very high IDF, so the match dominates the score. In the worked example of lesson 5.1, the rare term "4012" contributed more than 7 times as much as the common term "error". BM25 is also cheap: no model, no GPU, and an index that updates by insert. The reverse also holds: BM25 fails on paraphrase, where dense retrieval is strong. So the answer is not "BM25 or embeddings" but both, fused (lesson 5.2).

## 2. The handbook calls RRF "parameter-free". Is there anything to tune?

Yes (lesson 5.2). RRF has one constant, $k$, and it changes the ranking. With $k = 0$, a document at rank 1 in one list beats a document at rank 5 in both lists ($1.0$ against $0.4$). With $k = 60$, the order flips ($0.0164$ against $0.0308$). In general, a document at rank $r$ in both lists beats a first place in one list when $r < k + 2$. Cormack et al. fixed $k = 60$ "during a pilot investigation", and it works well as a default. You can also tune list weights (weighted RRF) and the depth of each input list. So RRF needs little tuning, but it is not free of parameters.

## 3. Our hybrid search is worse than BM25 alone on product-code queries. How can a fusion be worse than one of its inputs?

Fusion adds the votes of both retrievers (lesson 5.2). On a code query, BM25 ranks the exact match first, and the dense retriever ranks it nowhere. Meanwhile, several generic chunks appear at moderate ranks in **both** lists. With $k = 60$, agreement wins: a chunk at rank 10 in both lists scores $2/70 = 0.0286$, more than the exact match's $1/61 = 0.0164$. Fixes: give BM25 a higher weight, or route queries that look like codes to BM25 first. You can also rerank the fused list with a cross-encoder that sees the exact code. Measure each fix on labeled code queries.

## 4. A cross-encoder is more accurate than a bi-encoder. Why not use it for the whole search?

Because it needs one full model pass for every (query, chunk) pair, at query time (lesson 5.3). Nothing can be computed in advance, since the score exists only after the query arrives. The Sentence-BERT paper measured the extreme case: the most similar pair among 10,000 sentences. It takes about 65 hours with a BERT cross-encoder and about 5 seconds with Sentence-BERT. For search, 1,000,000 chunks at 1,800 pairs per second is about 556 seconds per query. So the cross-encoder only reranks a candidate set, for example 50 to 150 chunks, that a fast first stage found.

## 5. We added a reranker and the answers did not improve. What do you check?

Four things (lessons 5.3 and 5.8).

1. **The recall ceiling.** The reranker only reorders the candidates. If Recall@50 of the first stage is low, the relevant chunk never reaches the reranker. Measure Recall@$N$ first.
2. **Retrieval was not the problem.** Give the model the oracle chunks. If the answers are still wrong, the failure is in generation.
3. **The final $k$ already held the answer.** Suppose that the relevant chunk was at rank 3 of 5 before reranking. A move to rank 1 may not change the answer.
4. **The model and the domain.** A reranker trained on web search data can be weak on your domain. Compare its ranking with your labels.

The handbook's "10–25% improvement" has no source. Expect a gain only where your measurements show room for one.

## 6. HyDE asks the model to write an answer that may be false. Is that not dangerous?

Only if the hypothetical answer reaches the model as context (lesson 5.4). In HyDE, the generated text is a **search key**. It answers "what does an answer look like?", and its embedding finds real documents with that shape. The HyDE paper itself says that the generated document "is unreal and may contain false details". That is acceptable as long as only the retrieved real documents go into the window. The real risks are different: the LLM may not know private jargon, so the hypothetical answer describes the wrong thing and retrieves wrong documents. And the extra call adds latency, because it writes a paragraph of output before retrieval can start.

## 7. "MMR with λ = 0.5 gives half relevance and half diversity." Correct?

No (lesson 5.5). $\lambda$ weights two terms in a subtraction, and its effect depends on the actual similarity values. In the worked example of lesson 5.5, the selection changed at $\lambda = 0.4$, $0.663$ and $0.833$. Any $\lambda$ above 0.833 gave the plain relevance ranking, and $\lambda = 0.5$ removed the near-duplicate. With other data, the same $\lambda$ can behave very differently. Also, MMR is a greedy loop: after each pick, the redundancy of every remaining candidate is recomputed against the chunks already chosen. The handbook's formula omits the $\arg\max$ and this loop.

## 8. The handbook allocates 60% of the window to retrieved context. With a 1,000,000-token window, should we send 600,000 tokens of chunks?

No (lesson 5.6). The 15/60/15/10 split is a rule of thumb for a small window, and the handbook's own FAQ calls it "a starting heuristic". On a large window, the retrieval budget is a **limit**, not a target. Lesson 1.5 showed that accuracy can drop with length, and that 20 documents with the answer in the middle scored below no documents at all. Lesson 1.6 showed that every input token is billed on every call. Send the chunks that pass a relevance threshold, up to a planned cap. Also, a percentage split gets the fixed parts wrong: the output reserve must be at least `max_tokens`, whatever the window size.

## 9. We told the model "Cite sources", but its citations are often wrong or invented. Why?

Examine what the model can see (lesson 5.6). The handbook's Listing 4 joins the chunks with `---` and gives no source names or IDs, then asks the model to cite sources. The model cannot cite what is not in the window, so it invents names. The fix has two parts. First, wrap each chunk in a label with an ID and its metadata, and ask for citations by ID. Second, check every citation in code after the call: an ID that is not in the context is an invented citation. Track the rate of invented citations as a quality signal.

## 10. Anthropic says just-in-time retrieval beats eager loading. Should every agent load everything through tools?

Anthropic does not say that (lesson 5.7). Its article describes JIT, names the cost ("runtime exploration is slower than retrieving pre-computed data"), and says that the most effective agents "might employ a hybrid strategy". The handbook's quote "Start by providing the agent with a lightweight set of identifiers and let the agent decide what to read" is not in the article. The cost model of lesson 5.7 shows why a hybrid makes sense. JIT keeps each call short, but each read is another call that resends the history. In that model, JIT used 22% of the eager tokens with 3 reads and more than eager from 9 reads. Load the small, always-needed context up front, and use tools for the rest.

## 11. Our RAGAS faithfulness is 0.95. Are our answers correct?

Not necessarily (lesson 5.8). Faithfulness is the share of answer claims that the **retrieved context** supports. If retrieval returns an outdated policy, an answer that follows it faithfully scores high and is still wrong. Faithfulness also says nothing about missing information: an answer can be faithful and incomplete. And the score comes from an LLM judge that can make mistakes. Pair faithfulness with retrieval metrics against labels (Recall@k) and with correctness against reference answers. Also check a sample of the judge's verdicts by hand.

## 12. Windows now hold a million tokens. Is retrieval quality still worth this much work?

Yes, for most production systems (lessons 5.2, 5.6 and 1.5). The handbook's FAQ (Q49) gives the right frame. Long context fits small, curated document sets. RAG fits knowledge that is too large, too dynamic or too costly to send in full. Anthropic gives a concrete limit: for a knowledge base under about 200,000 tokens, "you can just include the entire knowledge base in the prompt", with prompt caching. Above that, three costs grow with every call: input tokens, time to first token, and the length effect on accuracy. Retrieval quality decides whether the few thousand tokens that you do send hold the answer. Part 4 compares the options in [Why retrieval](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval).

## 13. The labs use four Markdown files. Does any of this transfer to millions of documents?

The concepts transfer, but some numbers and failure modes change (lessons 5.1, 5.8 and 5.9). Four things become harder at scale:

1. **Near-duplicates and distractors.** A tiny corpus has few near-duplicates and few distractors. A large one has many, so MMR, reranking and metadata filters matter more.
2. **Approximate search.** Vector indexes such as HNSW trade exactness for speed, and filters can interact badly with them (Part 4, [Vector search](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search)).
3. **Operations.** Incremental sync, deletes, tenant isolation and drift monitoring do not exist in a lab, and they decide correctness in production.
4. **Cost.** Contextual retrieval or GraphRAG cost little on four files and a lot on millions.

The FAQ (Q50) also says that "Notion, Stripe, and Shopify all started their RAG systems with prototypes on small corpora". It gives no source, so do not repeat it as a fact.

## 14. Relationships matter in our domain. Should we build GraphRAG?

Ask first which questions fail today (lesson 5.9). GraphRAG targets **global** questions about a whole corpus, such as "What are the main themes in these interviews?", with pre-generated community summaries. Its graph needs many LLM calls to build and ongoing upkeep. If your failing questions join two or three specific facts ("Who manages someone on Project X?"), a knowledge graph of triples answers them exactly and cheaply, once the triples exist. An agent with a search tool can also answer them by searching twice, with no graph. Start from the failures in your labeled set, try the cheapest fix that targets them, and measure.

## 15. Check questions

```check
{
  "question": "With k = 60, a chunk is rank 10 in both the dense and the BM25 list. Another chunk is rank 1 in BM25 only. Which ranks higher after RRF? What is the smallest rank in both lists at which the first chunk would no longer beat the second?",
  "hint": "Compare 2/(k + r) with 1/(k + 1).",
  "answer": "Rank 10 in both: 2/70 = 0.028571. Rank 1 in one: 1/61 = 0.016393. The chunk in both lists ranks higher. It stops winning when 2/(60 + r) ≤ 1/61, which means r ≥ 62. At r = 62 the two tie."
}
```

```check
{
  "question": "A pipeline retrieves the top 20, reranks them with a cross-encoder, and keeps 5. Recall@20 of the first stage is 0.74. A colleague expects the reranker to raise the final Recall@5 to 0.85. Is that possible?",
  "answer": "No. The reranker only reorders the 20 candidates, so the final Recall@5 cannot exceed the first-stage Recall@20 of 0.74. To pass 0.74, raise the first-stage recall: a deeper candidate set, hybrid search, query rewriting or better chunks."
}
```

```check
{
  "question": "Budget 2,000 tokens. Ranked chunks (relevance, tokens): A (0.9, 1,200), B (0.8, 1,000), C (0.7, 500), D (0.4, 300). Compare break packing and skip packing.",
  "answer": "Break: A (1,200). B would give 2,200, so the loop stops. Result: A only, 1,200 tokens, relevance 0.9. Skip: A (1,200), skip B, C (1,700), D (2,000). Result: A, C, D, 2,000 tokens, relevance 2.0. Skip packing keeps every chunk that break packing keeps and adds two more."
}
```

## 16. Links

- Part overview: [05 Retrieval quality](/notes/ai/context-engineering/05-retrieval-quality)
- Previous part: [04 Write and RAG](/notes/ai/context-engineering/04-write-and-rag)
- [Glossary](/notes/ai/context-engineering/glossary)
