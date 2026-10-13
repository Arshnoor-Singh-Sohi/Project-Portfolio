---
title: "M2: Retrieval"
order: 3
summary: "A document loader, a structure-aware token-based chunker, local embeddings, BM25, RRF fusion, an optional reranker, source labels for citations, incremental re-indexing by content hash, and an evaluation of Recall@5 and MRR on the ground truth set."
status: not-started
tags: [capstone, retrieval, chunking, bm25, rrf, evaluation]
---

## 1. Goal

M2 fills the KNOWLEDGE slot. After M2, `ResearchSession` loads its documents and keeps an index in sync with them. It retrieves the best chunks for each question and sends them with labels that the model can cite.

In production terms, retrieval decides most of the answer quality: the model cannot use a fact that never reaches the window. So M2 ends with a number, not with a demo. Recall@5 and MRR on the answerable cases of the ground truth set must pass a gate. Each retrieval mode gets its own row in the result table.

## 2. Builds on

- [Lesson 4.4: The RAG pipeline](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline): indexing and query phases, one embedding model for both.
- [Lesson 4.5: Chunking](/notes/ai/context-engineering/04-write-and-rag/l5-chunking): structure-aware splitting, tokens and characters, the input limit of the embedding model.
- [Lesson 4.6: Embeddings and similarity](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity): unit vectors, cosine as a dot product.
- [Lesson 4.7: Vector search](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search): exact search, filters inside the query.
- [Lesson 5.1: Keyword search and BM25](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25): the formula, `rank_bm25` and its IDF.
- [Lesson 5.2: Hybrid search and RRF](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf): fusion by ranks, $k = 60$, deep lists.
- [Lesson 5.3: Rerankers](/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers): a cross-encoder on the fused candidates.
- [Lesson 5.6: Retrieval budgets and chunk order](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order): source labels and the citation check.
- [Lesson 5.8: Measure retrieval and answers](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval): Recall@k and MRR.
- [Lesson 5.9: Beyond basic RAG](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag): incremental sync by hash.

## 3. Spec

### 3.1 Modules

| Module | Job |
|---|---|
| `retrieval/loader.py` | Read `.md` and `.txt` files, clean them, hash them |
| `retrieval/chunker.py` | Split documents into chunks with header paths and character spans |
| `retrieval/embed.py` | Local embeddings, unit length |
| `retrieval/bm25.py` | The tokenizer and the BM25 index |
| `retrieval/fusion.py` | RRF with a fixed tie-break |
| `retrieval/rerank.py` | The optional cross-encoder |
| `retrieval/index.py` | Storage, the manifest and incremental sync |
| `retrieval/retriever.py` | The four search modes behind one interface |
| `retrieval/citations.py` | Source labels and the citation check |
| `scripts/eval_retrieval.py` | Recall@5 and MRR for every mode |

### 3.2 Loader and chunker

```python
@dataclass(frozen=True)
class Document:
    doc_id: str          # path relative to the corpus root, "/" separators, no extension
    title: str           # from the front matter, or the first "# " heading, or the file name
    text: str            # front matter removed, line endings normalized to "\n"
    sha256: str          # hash of `text`, so a changed line ending is not a change
    updated: str | None  # ISO date from the front matter, else None
    path: Path

def load_documents(paths: Sequence[Path], *, root: Path) -> list[Document]:
    """Raise DocumentNotFoundError that names every missing path, and
    UnsupportedFormatError for other extensions. Every real path must lie
    inside `root` (realpath, then commonpath). Remove duplicate paths."""
    ...

@dataclass(frozen=True)
class Chunk:
    chunk_id: str        # f"{doc_id}#{n:04d}", in document order
    doc_id: str
    section: str         # header path, for example "4. Method and math > 4.3 Reciprocal Rank Fusion"
    text: str            # the chunk body
    index_text: str      # f"{title} > {section}: {text}", used by both indexes
    start_char: int      # span in Document.text
    end_char: int
    n_tokens: int        # tokens of index_text, counted with the embedding model's tokenizer

def chunk_document(doc: Document, *, count_tokens: Callable[[str], int],
                   max_tokens: int = 240, overlap_tokens: int = 0) -> list[Chunk]:
    """Split at Markdown headers first, then at blank lines, then at sentence ends.
    Keep a fenced code block or a table whole when it fits. Split a longer table
    by rows, and repeat its header row in each part. No index_text exceeds max_tokens."""
    ...
```

The `index_text` prefix is the free form of a contextual chunk header (lesson 4.5, section 4.5). It costs no model call.

### 3.3 Embeddings, BM25, fusion and reranking

| Part | Requirement (checked on 2026-10-12) |
|---|---|
| Embedding model | `sentence-transformers/all-MiniLM-L6-v2`: 384 dimensions. It truncates input after 256 word pieces, with no error. So `max_tokens = 240`, counted with this model's own tokenizer, leaves room for its special tokens. |
| Vectors | Normalize every vector to length 1. Then the dot product equals the cosine (lesson 4.6). |
| Vector search | Exact search with one matrix product. About 3,000 chunks × 384 dimensions × 4 bytes is about 4.6 MB, so no approximate index is needed (lesson 4.7). |
| BM25 | `rank_bm25.BM25Okapi` with its defaults ($k_1 = 1.5$, $b = 0.75$), or your own implementation from lesson 5.1. Tokenizer: lower case. A token is a run of letters and digits. A `-`, `_` or `.` inside a run keeps it whole, so `o200k_base` and `gpt-4o` stay one token. |
| Fusion | RRF with $k = 60$ over the top 50 of each retriever. Tie-break: the better single rank, then the chunk ID. |
| Reranker | Optional: `cross-encoder/ms-marco-MiniLM-L6-v2` on the fused top 20 |
| Output | The top 5 chunks, packed into the KNOWLEDGE slot by the M1 builder |

```python
Mode = Literal["dense", "bm25", "hybrid", "hybrid_rerank"]

@dataclass(frozen=True)
class RetrievedChunk:
    chunk: Chunk
    rank: int                         # 1-based rank in the final list
    ranks: Mapping[str, int | None]   # rank in each input list: "dense", "bm25", "rerank"
    score: float                      # RRF or reranker score

class Retriever:
    def __init__(self, index: Index, embedder: Embedder, *, depth: int = 50,
                 rrf_k: int = 60, reranker: Reranker | None = None) -> None: ...

    def search(self, query: str, *, k: int = 5, mode: Mode = "hybrid",
               doc_ids: Collection[str] | None = None) -> list[RetrievedChunk]:
        """Return the top k chunks. `doc_ids` restricts the search to the session's
        documents. The filter runs inside both searches, before ranking."""
        ...
```

### 3.4 Index and incremental sync

The index lives in `data/index/`: `chunks.sqlite` for chunk text and metadata, `vectors.npy` for the matrix, and `manifest.json`. Each write goes to a temporary file first, then `os.replace`.

```json
{
  "schema_version": 1,
  "embed_model": "sentence-transformers/all-MiniLM-L6-v2",
  "embed_dim": 384,
  "chunker_version": "md-headers-v1:max240:overlap0",
  "docs": {
    "05-retrieval-quality/l2-hybrid-search-and-rrf": {
      "sha256": "9b1e...",
      "chunk_ids": ["05-retrieval-quality/l2-hybrid-search-and-rrf#0000"],
      "indexed_at": "2026-10-12T09:00:00Z"
    }
  }
}
```

```python
@dataclass(frozen=True)
class SyncReport:
    added: tuple[str, ...]
    changed: tuple[str, ...]
    deleted: tuple[str, ...]
    unchanged: int
    chunks_embedded: int
    full_rebuild: bool

class Index:
    @classmethod
    def open(cls, path: Path) -> "Index": ...

    def sync(self, docs: Sequence[Document], *, chunker: Chunker, embedder: Embedder) -> SyncReport:
        """New doc: chunk, embed, insert. Changed hash: delete its old chunks, then
        insert the new ones. Doc missing from `docs`: delete its chunks. Same hash: skip.
        A different embedding model or chunker version: full rebuild.
        Rebuild BM25 from all stored chunk texts after any change."""
        ...
```

BM25 needs a rebuild after every change because its IDF depends on the whole corpus. Embeddings need no rebuild, because each vector depends only on its own chunk.

### 3.5 Labels and the citation check

```python
def format_sources(items: Sequence[KnowledgeItem]) -> str:
    """One <source id="S1" doc="..." section="..." updated="..."> block per item.
    Escape quotes in attributes and any closing </source> text inside a chunk."""
    ...

@dataclass(frozen=True)
class CitationReport:
    cited: tuple[str, ...]      # IDs in the answer, for example "S3"
    invalid: tuple[str, ...]    # cited IDs that were not in the context
    uncited: bool               # sources were given, but the answer cites none

def check_citations(answer: str, allowed: Collection[str]) -> CitationReport: ...
```

Source IDs come from the `SourceRegistry` of M1, so one chunk keeps one ID for the whole session. The label tags of one source cost about 46 tokens with `o200k_base` for a typical document path and section (counted on 2026-10-12). They count inside the KNOWLEDGE ceiling.

### 3.6 Retrieval evaluation

A chunk is **relevant** to a case under two conditions. It comes from the evidence document, and its span overlaps the evidence quote by at least 50% of the quote's length. The quote's span is its position in `Document.text`. This rule survives any change of the chunker (lesson 4.5, section 4.7).

$$
\text{Recall@5}(q) = \frac{\lvert \{ e \in E_q : e \text{ overlaps a top-5 chunk} \} \rvert}{\lvert E_q \rvert} \qquad \text{MRR} = \frac{1}{\lvert Q \rvert} \sum_{q \in Q} \frac{1}{\text{rank}_q}
$$

The symbols mean:

- $E_q$ is the set of evidence items of case $q$.
- $Q$ is the set of answerable cases. Unanswerable cases have no evidence and are left out.
- $\text{rank}_q$ is the rank of the first relevant chunk. If no chunk in the top 5 is relevant, $1/\text{rank}_q = 0$.

> [!example] Worked example: the overlap rule
> An evidence quote has the span 1,200 to 1,260 in its document: 60 characters.
>
> - Chunk A covers 1,000 to 1,230. The overlap is $1{,}230 - 1{,}200 = 30$ characters, which is 50% of 60. Relevant.
> - Chunk B covers 1,235 to 1,500. The overlap is $1{,}260 - 1{,}235 = 25$ characters, about 42%. Not relevant by itself.
>
> If the top 5 holds chunk A at rank 2, this case has Recall@5 = 1 and a reciprocal rank of 0.5.

```python
@dataclass(frozen=True)
class RetrievalReport:
    mode: Mode
    k: int
    recall_at_k: float
    mrr: float
    per_case: Mapping[str, tuple[float, float]]   # case id -> (recall, reciprocal rank)
    latency_ms_p50: float
    latency_ms_p95: float

def evaluate_retrieval(cases: Sequence[Case], retriever: Retriever, *,
                       mode: Mode, k: int = 5) -> RetrievalReport: ...
```

### 3.7 Integration into the session

1. `ResearchSession.__init__` loads the documents and calls `Index.sync`. The `SyncReport` goes to the log.
2. `ask` retrieves the top 5 chunks for the question, restricted to the session's documents, and passes them to the builder as `KnowledgeItem` objects.
3. The answer goes through `check_citations`. `Answer.invalid_citations` holds the invalid IDs.

Constraints: the default mode is the mode that wins your evaluation, not the mode that you expect to win. Retrieval adds no paid call.

## 4. Acceptance tests

1. `test_loader_line_endings`: the same file with CRLF and with LF line endings gives the same `sha256`.
2. `test_loader_root`: a path that resolves outside the corpus root raises an error, also through `..` and through a symbolic link.
3. `test_chunks_within_limit`: for the whole corpus, every `index_text` has at most 240 tokens by the embedding model's tokenizer. No input reaches the model's maximum sequence length.
4. `test_code_block_whole`: a fenced code block of 150 tokens stays in one chunk.
5. `test_table_split`: a 60-row table splits into parts, and each part starts with the header row.
6. `test_spans_cover_text`: with no overlap, the chunk spans of a document cover every character of its text that is not whitespace.
7. `test_rrf_lesson_lists`: the two lists of lesson 5.2, section 4.2, give C1, C3, C4, C7, C12, C9, C20, with a top score of 0.032266.
8. `test_sync_incremental`: after the first sync, a change in one document embeds only that document's chunks and deletes its old chunk IDs. A deleted document loses all its chunks. A new embedding model name forces a full rebuild.
9. `test_filter_inside_search`: with `doc_ids` set to one document, all 5 results come from it, even when other documents score higher.
10. `test_citations`: an answer that cites `[S1]` and `[S9]` with only S1 to S5 in the context reports `S9` as invalid.
11. `test_retrieval_gate`: on the answerable cases of `gtx.jsonl`, the default mode reaches Recall@5 ≥ 0.80 and MRR ≥ 0.60. Two runs give identical numbers.
12. `test_session_knowledge_slot`: the first `ask` of a session sends at most 6,000 KNOWLEDGE tokens, each chunk inside a `<source>` label.

## 5. Measurements to record

Record these in `notebooks/capstone-m2.ipynb`:

- **Mode table.** One row per mode: dense, BM25, hybrid, hybrid with reranker. Columns: Recall@5, MRR, Precision@5, p50 and p95 search latency in milliseconds.
- **Query-type split.** The same four rows, with Recall@5 for the `keyword` cases and for the `paraphrase` cases as separate columns. Do not assume that hybrid wins. Report what you measured (lesson 5.2).
- **Index table.** Columns: documents, chunks, mean and maximum chunk tokens, time of a full build, and time of a sync with one changed document.
- **Failure list.** One row for every case with Recall@5 below 1. Columns: the case ID and the rank of the evidence chunk in each input list, or "absent". The last column is your diagnosis: chunking, vocabulary or a missing document.

## 6. Production review

This works. Would you deploy it?

| Concern | Check before you deploy | Evidence to show |
|---|---|---|
| Latency | Query embedding, two searches and fusion stay small next to the model call. The reranker adds a measurable cost. | The latency columns of the mode table |
| Cost | No paid call in retrieval. A full re-embed costs only local compute time. | The index table |
| Reliability | Index writes are atomic. A model or chunker change forces a rebuild, so the query and the index never use different embedding models. | Tests 8 and the manifest |
| Security | Paths stay inside the corpus root. Chunk text is data: a document that contains instructions stays inside its `<source>` label. | Test 2 and one injected test document |
| Observability | Each search logs the query, the chunk IDs and their rank in each input list. Then a missing chunk can be traced to one retriever. | One log line for a failed case |

## 7. Stretch goals

1. **Contextual retrieval with an LLM prefix** (lesson 5.2, section 4.7). Estimate the cost first. Claude Haiku 5.5 costs USD 0.10 / MTok input and USD 0.50 / MTok output. A cache write costs USD 0.125 / MTok and a cache read USD 0.01 / MTok (checked on 2026-10-12). Take 82 documents of about 5,750 tokens and about 29 chunks each. Each chunk call reads the cached document and sends 300 new tokens. Each writes 75 output tokens. The whole corpus costs about 0.36 USD, if each document's calls run within the cache lifetime. Then measure the gain in Recall@5.
2. **Query rewriting.** Rewrite a follow-up question with the history before the search (lesson 5.4). Add 5 follow-up cases to the evaluation set.
3. **Diversity.** Add MMR as a fifth mode (lesson 5.5). Measure the redundancy of the top 5: the mean pairwise cosine of its chunks.
4. **PDF documents.** Add a PDF loader and 10 public papers that the notes cite. Check that the loader keeps headings, so the chunker can use them.

## 8. Check questions

```check
{
  "question": "A chunk's index_text has 300 word pieces with the MiniLM tokenizer. What happens when you embed it, and why does no test fail by itself?",
  "answer": "The model truncates the input after 256 word pieces and gives no error. The vector describes only the first part of the chunk, so a query about the last part cannot match it. Nothing fails, because the result is a normal vector. That is why test 3 checks the token count of every chunk with the model's own tokenizer."
}
```

```check
{
  "question": "One document of 82 changes. Why does the sync re-embed only that document's chunks, but rebuild BM25 for the whole corpus?",
  "hint": "Which quantities in each method depend on other documents?",
  "answer": "An embedding depends only on its own chunk text, so the other vectors stay valid. BM25 uses IDF, which depends on the number of chunks N and on the number of chunks n(q) that contain each term. The changed document changes n(q) for its terms, and can change N. So every BM25 score in the corpus can change. At a few thousand chunks, the rebuild is cheap."
}
```

```check
{
  "question": "Why does the ground truth set label relevance with evidence quotes and character spans, not with chunk IDs?",
  "answer": "Chunk IDs depend on the chunker. A change of max_tokens or of the splitting rules renumbers the chunks and moves their boundaries, so labels by chunk ID become wrong. A quote and its span in the document stay valid. The overlap rule then decides which chunk contains the evidence, whatever the chunker does. So you can compare chunkers with the same labels."
}
```

## 9. Links

- Previous: [M1: Context builder](/notes/ai/context-engineering/10-capstone/m1-context-builder)
- Next: [M3: Tools and MCP](/notes/ai/context-engineering/10-capstone/m3-tools-and-mcp)
- Overview: [Capstone overview](/notes/ai/context-engineering/10-capstone/capstone-overview)
- [Lesson 5.2: Hybrid search and RRF](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf)
- [Lesson 5.8: Measure retrieval and answers](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval)
- Research track: [E8: Context precision and recall](/notes/ai/context-engineering/11-research-track/e8-context-precision-recall)
- [Glossary](/notes/ai/context-engineering/glossary)
