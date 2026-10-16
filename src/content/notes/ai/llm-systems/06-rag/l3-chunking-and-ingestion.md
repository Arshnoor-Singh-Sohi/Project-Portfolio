---
title: "L3: Chunking and ingestion"
order: 3
summary: "How raw PDFs, HTML pages and tables become clean, retrievable chunks with metadata, and how the index stays correct when documents change. Parsing from first principles, chunk size and overlap with an exact boundary-cut formula, recursive, structure-aware and semantic chunking, parent-child retrieval, contextual retrieval, deduplication with MinHash, and incremental updates."
status: not-started
tags: [rag, chunking, ingestion, parsing, deduplication, contextual-retrieval]
---

## 1. The question this idea answers

The retriever can only return what ingestion produced. If a PDF table became a stream of loose numbers, no embedding model can recover it. If a chunk ends in the middle of a rule, the rule has no complete vector anywhere. If an old version of a policy stays in the index, the system cites a rule that no longer exists.

So the questions are: How do raw files become clean text? Where should a cut go, and how big should a chunk be? What metadata must each chunk carry? How do we remove duplicates and keep the index in step with changing documents? An interviewer who asks "how did you build your RAG pipeline" usually means these questions, because most real RAG failures start here.

## 2. Mental model

> [!analogy] The prep station of a kitchen
> A restaurant does not cook from crates. A prep cook unpacks deliveries, removes packaging, cuts ingredients into portions of a useful size and labels every container with its content and date. Old stock leaves the fridge when new stock arrives.
>
> Ingestion is that prep station. Parsing removes the packaging. Chunking cuts portions. Metadata is the label. Deduplication and incremental updates keep the fridge free of copies and expired food.
>
> **Where it stops working:** a cook can taste a portion and see that it makes sense. A chunker cannot. It cuts by rules such as sizes, separators and similarity thresholds. And unlike food, a document can change in place, so the label needs a version.

## 3. Terms

| Term | Plain meaning |
|---|---|
| ingestion | The offline process that turns source files into indexed chunks: connect, parse, clean, chunk, enrich, deduplicate, embed, write. |
| parser | Code that extracts text and structure from a file format such as PDF or HTML. |
| reading order | The order in which a human reads the text of a page. A PDF does not store it. |
| OCR | Optical character recognition: turning an image of text into characters. Scanned pages need it. |
| chunk | One piece of a document that is embedded and retrieved as a unit. |
| chunk size $C$ | The maximum length of a chunk, in tokens unless stated otherwise. |
| overlap $O$ | The number of tokens that the end of one chunk shares with the start of the next. |
| stride $S$ | The distance between the starts of neighboring chunks: $S = C - O$. |
| recursive splitting | Splitting with an ordered list of separators, for example paragraphs, then lines, then sentences, then words. |
| structure-aware chunking | Cutting at the structure of the document, such as headings, sections, table rows or functions. |
| header path | The list of headings above a chunk, for example "Returns policy > Laptops". |
| semantic chunking | Cutting where the meaning changes, detected from the embedding distance between neighboring sentences. |
| parent-child retrieval | Searching small child chunks but returning their larger parent section to the model. Also called small-to-big. |
| contextual retrieval | Adding a short, LLM-written context to each chunk before embedding and keyword indexing. |
| metadata | Fields stored with each chunk: source, section, page, dates, version, access list, hashes. |
| content hash | A fingerprint of a text, for example SHA-256. It changes when the text changes. |
| Jaccard similarity | The size of the intersection of two sets divided by the size of their union. |
| MinHash | A short signature of a set. The share of equal signature positions estimates the Jaccard similarity. |
| shingle | A sequence of $w$ consecutive words. A text becomes a set of shingles. |
| incremental sync | Updating the index by processing only new, changed and deleted documents. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. The ingestion pipeline

```mermaid
flowchart LR
    A["Connect: list files, IDs, ACLs"] --> B["Parse: text + structure"]
    B --> C["Clean: remove boilerplate"]
    C --> D["Chunk: cut + header path"]
    D --> E["Enrich: metadata, context"]
    E --> F["Deduplicate"]
    F --> G["Embed"]
    G --> H[("Write: vector + keyword index")]
    style A fill:#6A4C93,color:#fff
    style G fill:#B8860B,color:#fff
    style H fill:#2D6A4F,color:#fff
```

Each stage has one output that you can inspect: a file list, a text with structure, a list of chunks, a list of vectors. Save these intermediate outputs for a sample of documents. When an answer is wrong, you can then see which stage lost the information.

## 5. Parsing: from files to clean text

### 5.1 What a PDF really contains

A PDF page is a set of drawing instructions, not a text with paragraphs. Its content stream says, in effect, "draw glyph 'R' at position (72, 700) in font F1, then 'e' just right of it". The PDF standard (ISO 32000) defines text-showing operators such as `Tj` and `TJ` and positioning operators such as `Td` and `Tm`. Nothing in the file says "this is a heading" or "this column comes before that one".

A parser must rebuild the text from positions. That produces six classic problems:

| Problem | What goes wrong | Typical fix |
|---|---|---|
| Two columns | Lines from both columns interleave | Layout analysis that finds the column blocks first |
| Headers and footers | "Page 7 of 40" and the company name repeat in every chunk | Remove text that repeats at the same position on most pages |
| Hyphenation | "accesso-" and "ries" become two tokens | Join a word split at a line end |
| Ligatures and fonts | "ﬁ" becomes one odd character, or text extracts as garbage | Unicode normalization (NFKC), or OCR when the font map is broken |
| Tables | Cells become loose numbers in a row of text | A table structure model, then output as Markdown or HTML |
| Scanned pages | No text layer at all | OCR or a vision-language model |

Open-source tools cover these steps at different depths. Examples on PyPI (checked on 2026-10-15): `pymupdf` 1.28.2 for fast text and layout extraction, `docling` 2.139.0, "SDK and CLI for parsing PDF, DOCX, HTML, and more, to a unified document representation", and `unstructured` 0.27.27. Choose by testing them on a sample of your own worst documents.

### 5.2 HTML and wikis

HTML has structure: `<h1>` to `<h6>` headings, `<p>` paragraphs, `<table>`, `<li>`. Keep it. The main job is to remove boilerplate: navigation menus, cookie banners, footers and "related articles" lists that appear on every page. If you keep them, every page shares the same text, and every chunk partly matches every query about navigation words.

### 5.3 Tables

A table answers questions only if each value stays next to its row and column names. Three representations work:

1. **Markdown or HTML table**, kept whole when it is small. The model reads it well.
2. **One row per line, with the header repeated**: "Product: X200 laptop | Return window: 30 days | Fee: 10%". Each row then makes sense alone, so you can chunk by rows.
3. **SQL**, when users ask numeric questions such as sums or rankings over many rows. Retrieval is weak at "the average of 2,000 values". A text-to-SQL tool, for example Databricks Genie, is the better tool ([Genie One MCP](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp)).

> [!example] Worked example: a table row that survives chunking
> Original table: columns "Product", "Return window", "Restocking fee". Row: "X200", "30 days", "10%".
>
> - **Broken parse:** "X200 30 days 10% Z5 14 days 0%". A query for "restocking fee for the Z5" may match this chunk, but the model cannot tell which number belongs to which product.
> - **Row serialization:** "Product: Z5. Return window: 14 days. Restocking fee: 0%." Each fact has its labels, and the chunk answers the query alone.

## 6. Chunk size and overlap

### 6.1 Why chunks at all

Three limits set the chunk size. The embedding model reads at most a fixed number of tokens and silently drops the rest (256 word pieces for `all-MiniLM-L6-v2`). One vector for many topics is a blurred average that matches each topic weakly. And every retrieved chunk costs prompt tokens. The context engineering lesson [Chunking](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) derives the blur factor $1/\sqrt{k}$ for $k$ equal topics, the chunk count and the storage factor. This section uses those results and adds one more.

For a document of $L$ tokens, chunk size $C$ and overlap $O$:

$$
n = \left\lceil \frac{L - O}{C - O} \right\rceil, \qquad \text{storage factor} \approx \frac{C}{C - O} = \frac{1}{1 - O/C}
$$

### 6.2 How often is an idea cut in two?

An idea of $s$ tokens, for example a rule with its condition, is safe only if it lies whole inside some chunk. Chunks start at $0, S, 2S, \dots$ with $S = C - O$, and chunk $j$ covers positions $[jS,\ jS + C)$. Take an idea that starts at a random position $a$. It lies inside chunk $j$ when $jS \le a$ and $a + s \le jS + C$, that is, when a multiple of $S$ falls in the window $[a - (C - s),\ a]$. That window holds $C - s + 1$ whole positions. Out of every $S$ consecutive start positions, $\min(S, C - s + 1)$ are safe. So:

$$
P(\text{cut}) = \max\left(0,\ \frac{s - O - 1}{C - O}\right) \quad \text{for } s \le C, \qquad P(\text{cut}) = 1 \quad \text{for } s > C
$$

The symbols mean:

- $s$ is the length of the idea in tokens.
- $O + 1$ is the longest idea that overlap always protects. This matches the guarantee of the earlier lesson.
- $C - O$ is the stride.

> [!example] Worked example: 512-token chunks with 51 tokens of overlap
> The stride is $S = 512 - 51 = 461$.
>
> | Idea length $s$ | $P(\text{cut}) = (s - 52)/461$ |
> |---|---|
> | 52 tokens | 0 |
> | 100 tokens | $48/461 = 0.104$ |
> | 200 tokens | $148/461 = 0.321$ |
> | 300 tokens | $248/461 = 0.538$ |
>
> These notes checked the formula by brute force over 200,000 start positions: the measured shares were 0.000, 0.104, 0.321 and 0.538. So one in three 200-token explanations is split by fixed-size chunking with 10% overlap. Structure-aware cuts lower this, because they place boundaries between ideas instead of at fixed positions.

### 6.3 The trade-off in numbers

Take a corpus of 10 million tokens, 10% overlap ($O = \operatorname{round}(0.1\,C)$), 1,024-dimensional float32 vectors and $k = 5$ retrieved chunks.

| Chunk size $C$ | Overlap $O$ | Chunks | Stored tokens | Vector bytes | Prompt tokens for 5 chunks |
|---|---|---|---|---|---|
| 128 | 13 | 86,957 | 11,130,428 | 356.2 MB | 640 |
| 256 | 26 | 43,479 | 11,130,428 | 178.1 MB | 1,280 |
| 512 | 51 | 21,692 | 11,106,241 | 88.9 MB | 2,560 |
| 1,024 | 102 | 10,846 | 11,106,190 | 44.4 MB | 5,120 |

Small chunks give sharp vectors, more index entries and a cheap prompt, but each one carries little context. Large chunks carry context and cost prompt tokens, and their vectors blur. No size is right for every corpus. The method of lesson [L8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) decides: label answer passages as character spans, rebuild the index for each candidate size, and compare recall@k and prompt tokens.

> [!key] Count tokens with the embedding model's tokenizer
> A splitter that counts characters makes chunks about four times smaller than the same number in tokens. A chunk longer than the model's limit is truncated without an error. Measure chunk lengths with the tokenizer of the embedding model.

## 7. Splitting algorithms

![Alt text: one returns policy cut by fixed size, by structure with header paths, and into small children inside a parent section](/notes/media/llm-systems/figures/06-3-chunking-strategies.svg)

### 7.1 Recursive splitting

A recursive splitter tries an ordered list of separators. It splits at the first separator and packs the pieces greedily into chunks up to the size limit. Only pieces that are still too long go to the next separator. LangChain's `RecursiveCharacterTextSplitter` uses the default list `["\n\n", "\n", " ", ""]` (lesson [Chunking](/notes/ai/context-engineering/04-write-and-rag/l5-chunking)). Here is the algorithm from scratch, with words as a stand-in for tokens:

```python
def n_tokens(text):
    return len(text.split())          # stand-in tokenizer: count words

def recursive_split(text, max_tokens, separators=("\n\n", "\n", ". ", " ")):
    """Split at the first separator that works, recurse only into pieces that are too long."""
    if n_tokens(text) <= max_tokens:
        return [text]
    if not separators:                 # no separator left: hard cut by words
        words = text.split()
        return [" ".join(words[i:i + max_tokens]) for i in range(0, len(words), max_tokens)]
    sep, rest = separators[0], separators[1:]
    pieces = [p for p in text.split(sep) if p.strip()]
    chunks, current = [], ""
    for piece in pieces:
        candidate = piece if not current else current + sep + piece
        if n_tokens(candidate) <= max_tokens:
            current = candidate        # greedy: keep filling the current chunk
            continue
        if current:
            chunks.append(current)
        if n_tokens(piece) <= max_tokens:
            current = piece
        else:                          # this piece alone is too long: use the next separator
            chunks.extend(recursive_split(piece, max_tokens, rest))
            current = ""
    if current:
        chunks.append(current)
    return chunks

doc = ("Returns policy\n\n"
       "Opened laptops can be returned within 30 days of delivery. A restocking fee of 10% applies. "
       "The laptop must include all accessories.\n\n"
       "Phones can be returned within 14 days. Phones with a cracked screen cannot be returned.\n\n"
       "Refunds go to the original payment method within 5 business days.")
for i, c in enumerate(recursive_split(doc, max_tokens=20)):
    print(i, n_tokens(c), repr(c))
```

Output:

```text
0 2 'Returns policy'
1 16 'Opened laptops can be returned within 30 days of delivery. A restocking fee of 10% applies'
2 6 'The laptop must include all accessories.'
3 15 'Phones can be returned within 14 days. Phones with a cracked screen cannot be returned.'
4 11 'Refunds go to the original payment method within 5 business days.'
```

- `pieces = text.split(sep)` cuts at the strongest boundary first: blank lines between paragraphs.
- The greedy loop fills `current` until the next piece would exceed the limit.
- `recursive_split(piece, max_tokens, rest)` runs only for a paragraph that is too long alone. Here the 22-word laptop paragraph was split at ". ".

The output shows three real defects. Chunk 0 is a lonely heading: two tokens with no content, which still occupies an index slot. Chunk 1 lost its final period, because `split(". ")` consumed the separator. And the laptop rule is split across chunks 1 and 2, so neither chunk holds the whole return condition. Structure-aware chunking fixes the first two, and parent-child retrieval fixes the third.

### 7.2 Structure-aware chunking

Cut at the document's own structure, and carry the structure into each chunk:

| Content | Rule |
|---|---|
| Markdown and HTML | Cut at headings. Never emit a heading alone. Store the header path with each chunk and add it in front of the text before embedding. |
| Code | Keep a function or class together. Cut at definitions, which a parser of the language finds. |
| Tables | Keep small tables whole. Serialize large tables by rows, with the header names in each row (section 5.3). |
| Slides, FAQs, tickets | One slide, one question with its answer, or one ticket with its resolution per chunk. |

The header path matters twice. It adds the missing context to the vector ("Laptops" is not in the sentence "Opened items: 30 days"). And it gives the citation a readable location.

### 7.3 Semantic chunking

Semantic chunking cuts where the topic changes. LangChain's `SemanticChunker` (in `langchain_experimental`) does it in four steps, which the source code shows:

1. Split the text into sentences with the regex `(?<=[.?!])\s+`.
2. Build a window around each sentence: the sentence with `buffer_size` neighbors on each side (default 1). Embed each window.
3. Compute the cosine distance, $1 - \cos$, between each window and the next one.
4. Cut after sentence $i$ when distance $i$ is above a threshold.

The threshold is relative to the document's own distances. The library offers four types with these defaults: `percentile` 95, `standard_deviation` 3, `interquartile` 1.5 and `gradient` 95.

```python
import numpy as np

# cosine distance between sentence i and sentence i + 1 (21 sentences -> 20 distances)
d = np.array([0.08, 0.12, 0.10, 0.41, 0.09, 0.11, 0.07, 0.13, 0.10, 0.48,
              0.12, 0.09, 0.11, 0.35, 0.08, 0.10, 0.12, 0.09, 0.44, 0.11])

q1, q3 = np.percentile(d, [25, 75])
thresholds = {
    "percentile 95": np.percentile(d, 95),
    "standard_deviation 3": d.mean() + 3 * d.std(),
    "interquartile 1.5": d.mean() + 1.5 * (q3 - q1),   # mean + 1.5 IQR, as in the library code
}
for name, th in thresholds.items():
    cuts = np.where(d > th)[0]          # cut after sentence index i (0-based)
    print(f"{name:22s} threshold {th:.4f} -> cut after sentences {cuts.tolist()} -> {len(cuts) + 1} chunks")
```

Output:

```text
percentile 95          threshold 0.4420 -> cut after sentences [9] -> 2 chunks
standard_deviation 3   threshold 0.5553 -> cut after sentences [] -> 1 chunks
interquartile 1.5      threshold 0.2137 -> cut after sentences [3, 9, 13, 18] -> 5 chunks
```

The same 21 sentences give 2, 1 or 5 chunks, depending only on the threshold type. The 95th percentile cuts about 5% of the gaps in **every** document, whatever its content. So a document with four topic changes gets one cut, and a document with none still gets one. The standard deviation rule with 3 found no cut at all, because the four large distances inflate the standard deviation itself. Read the source before you trust a default: the interquartile rule here is the mean plus 1.5 times the IQR, not the textbook $Q_3 + 1.5\,\text{IQR}$.

Cost: one embedding per sentence window at indexing time, plus a size check, because a topic can run for thousands of tokens. Measure semantic chunking against a recursive baseline on labeled questions before you adopt it.

## 8. Parent-child retrieval

Small chunks match precisely. Large chunks answer completely. Parent-child retrieval uses both:

1. Cut each section (the parent) into small children, for example single sentences or 128-token pieces.
2. Embed and index only the children. Each child stores its parent ID.
3. At query time, retrieve the top children, map them to parent IDs, remove duplicate parents, and put the parents into the prompt.

> [!example] Worked example: the token cost of parents
> Children have 128 tokens and parents have 800 tokens. The top 6 children belong to 2 parents.
>
> - Children alone: $6 \times 128 = 768$ tokens.
> - Their parents: $2 \times 800 = 1{,}600$ tokens.
> - If the 6 children belonged to 6 different parents: $6 \times 800 = 4{,}800$ tokens.
>
> Parent-child retrieval can multiply the prompt size several times. Cap the number of parents, and pack them with a token budget (lesson [L7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding)).

A variant, the sentence window, returns each matching sentence with a fixed number of neighbors instead of a whole section.

## 9. Contextual retrieval

A chunk often lacks context that a query needs. Anthropic's example: "The company's revenue grew by 3% over the previous quarter." Which company? Which quarter? Anthropic's "Introducing Contextual Retrieval" (19 September 2024) adds the missing context with an LLM call per chunk. The prompt includes the whole document and the chunk, and asks: "Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk. Answer only with the succinct context and nothing else."

The context, "usually 50-100 tokens", goes in front of the chunk in **both** the embedding index and the BM25 index. The reported results, measured as the top-20 retrieval failure rate ("1 minus recall@20"):

| Configuration | Failure rate | Reduction |
|---|---|---|
| Baseline | 5.7% | |
| Contextual embeddings | 3.7% | 35% |
| Contextual embeddings + contextual BM25 | 2.9% | 49% |
| Both, plus reranking (top 150 to top 20) | 1.9% | 67% |

They generated the contexts with Claude 3 Haiku and prompt caching, for a one-time cost of USD 1.02 per million document tokens. This is a vendor benchmark on the vendor's datasets, so measure it on yours.

> [!example] Worked example: why prompt caching makes it affordable
> A document has 8,000 tokens and 20 chunks of 400 tokens. Each call sends the document, the chunk and about 50 tokens of instructions.
>
> - **Without caching:** $20 \times (8{,}000 + 400 + 50) = 169{,}000$ input tokens for one document.
> - **With caching:** the document is the same prefix in all 20 calls. One call writes it to the cache (8,000 tokens). The other 19 calls read it from the cache ($19 \times 8{,}000 = 152{,}000$ tokens at the cache-read price). Only $20 \times 450 = 9{,}000$ tokens are new.
> - **Output:** about $20 \times 75 = 1{,}500$ tokens.
>
> Cache reads cost a fraction of normal input tokens (lesson [Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)). Inside the serving engine, the shared prefix reuses its KV cache ([Prefix caching](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)). The prompt order matters: the document must come first, so that it forms the shared prefix.

A free first step needs no LLM: prefix each chunk with its document title and header path. It can give part of the same benefit at no cost. Measure both.

## 10. Metadata

Every chunk should carry fields that the query pipeline, the citation step and the operations team need:

| Field | Example | Used for |
|---|---|---|
| `chunk_id` | `returns-policy:0007` | Deterministic upserts, citations, logs |
| `doc_id`, `source_uri` | `returns-policy`, the wiki URL | Deleting all chunks of a document, links in citations |
| `title`, `header_path` | "Returns policy > Laptops" | Contextual prefix, readable citations |
| `page`, `char_start`, `char_end` | 3, 1,204, 1,688 | Exact citation location, evaluation by character spans |
| `updated_at`, `version` | 2026-10-01, v14 | Freshness filters, conflict resolution between versions |
| `acl_groups`, `tenant_id` | `["support-eu"]`, `acme` | Access filters inside the search ([L4](/notes/ai/llm-systems/06-rag/l4-vector-indexes)) |
| `language`, `doc_type` | `de`, `policy` | Routing and filters |
| `content_hash` | SHA-256 of the normalized text | Change detection, exact deduplication |
| `embedding_model`, `chunker_version` | `e5-large-v2`, `md-v3` | Detecting stale vectors after a pipeline change |

Take access lists from the source system at ingestion time, and refresh them when permissions change. Lesson [L9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) covers permission sync in production.

## 11. Deduplication

Duplicates are common: the same page in two wiki spaces, a PDF and its HTML export, a policy pasted into twenty tickets. They hurt retrieval directly. Five copies of one paragraph can fill the top 5, so the other relevant chunks never reach the model. They also waste index space and prompt tokens.

**Exact duplicates.** Normalize the text (lowercase, collapse whitespace), hash it with SHA-256, and keep one chunk per hash.

**Near duplicates.** Represent each text as a set of shingles, the sequences of $w$ consecutive words. Compare sets with the Jaccard similarity:

$$
J(A, B) = \frac{\lvert A \cap B \rvert}{\lvert A \cup B \rvert}
$$

Comparing every pair of large sets is slow. Broder's MinHash ("On the resemblance and containment of documents", 1997) gives a short signature. Apply a random hash function to every shingle and keep the minimum. For one random function, the minima of $A$ and $B$ are equal with probability exactly $J(A, B)$. The smallest hash of the union belongs to both sets exactly when it is a shared shingle. With $k$ independent functions, the share of equal positions estimates $J$, with a standard error of $\sqrt{J(1 - J)/k}$.

```python
import hashlib

def shingles(text, w=3):
    words = text.lower().split()
    return {" ".join(words[i:i + w]) for i in range(len(words) - w + 1)}

def jaccard(a, b):
    return len(a & b) / len(a | b)

def minhash(s, k=128):
    # k different hash functions: salt one strong hash with the function number
    return [min(int(hashlib.sha1(f"{i}:{x}".encode()).hexdigest(), 16) for x in s) for i in range(k)]

a = "the refund window for opened laptops is thirty days from delivery"
b = "the refund window for opened laptops is fourteen days from delivery"
A, B = shingles(a), shingles(b)
sa, sb = minhash(A), minhash(B)
estimate = sum(x == y for x, y in zip(sa, sb)) / len(sa)
print(f"shingles {len(A)} and {len(B)}, shared {len(A & B)}, union {len(A | B)}")
print(f"exact Jaccard {jaccard(A, B):.3f}, MinHash estimate {estimate:.3f}")
```

Output:

```text
shingles 9 and 9, shared 6, union 12
exact Jaccard 0.500, MinHash estimate 0.555
```

The two sentences differ in one word, so 3 of the 9 shingles of each differ: $J = 6/12 = 0.5$. With $k = 128$ the standard error is $\sqrt{0.5 \times 0.5 / 128} = 0.044$, and the estimate 0.555 is about 1.2 standard errors away.

> [!trap] Near duplicates can be conflicting versions
> These two sentences are a 30-day rule and a 14-day rule: two versions of one policy, not harmless copies. Deduplication must not keep a random one. Use the `version` and `updated_at` metadata to keep the current version, and remove the old one at ingestion.

## 12. Incremental updates and versioning

### 12.1 The sync loop

The context engineering lesson [The RAG pipeline](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) gives the seven-step sync with a manifest of content hashes. The rules that matter most:

1. **Deterministic chunk IDs** such as `doc_id:0007`. Running the same ingestion twice must not create copies.
2. **Delete before insert** for a changed document. The new version may have fewer chunks, and an upsert by ID leaves the old extra chunks in the index.
3. **Save the manifest last**, only after all writes succeed. A crash then repeats work instead of losing it.
4. **Propagate deletions.** A document removed at the source must leave the index, or the system keeps citing it.

### 12.2 What forces a full re-index

| Change | Why every vector must change |
|---|---|
| New embedding model or version | Vectors from two models live in different spaces (lesson [L2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth)). |
| New prefix, instruction or dimension | The query side and the document side must match exactly. |
| New chunker or chunk size | Chunk boundaries and IDs change. |
| New contextual prefix prompt | The embedded text changes. |

Build the new index next to the old one, and run the evaluation set on both. Then switch an alias or a configuration value that names the active index. Keep the old index until the new one has served traffic without errors. Lesson [L9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) covers the production side: change data capture, schedules and re-embedding at scale.

### 12.3 Sync on a managed platform

Managed vector stores often offer sync from a table. In Databricks AI Search (formerly Databricks Vector Search), a Delta Sync Index "stays synced" with its source Delta table, and Databricks can compute the embeddings. A Direct Vector Access Index instead requires that "you must manually update the index using the REST API when the embeddings table changes" (docs checked on 2026-10-15). The ingestion questions of this lesson do not disappear on a managed platform. You still decide parsing, chunking, metadata and deduplication before the rows reach the table.

### Exercises

1. **Structure-aware chunker.** Write `markdown_chunks(md, max_tokens)`. Cut at headings and keep the header path. Pack paragraphs greedily inside each section. Split a paragraph by words only when it is too long alone.
   - Acceptance test: no chunk is a heading alone, and every chunk is at most `max_tokens` words. The first chunk of the sample has the header path "Returns policy > Laptops".
   - Hint 1: keep a list `path` and replace its tail when a heading of level $\ell$ arrives: `path[:ℓ-1] + [title]`.
   - Hint 2: flush the collected body lines whenever a new heading starts, and once at the end.
2. **Semantic chunker.** Write `semantic_chunks(sentences, embed, percentile, buffer)`.
   - Acceptance test: a toy embedding maps refund words and VPN words to two directions. With it, the six sample sentences split into a refund chunk and a VPN chunk.
   - Hint 1: normalize the window vectors, then the distance is one minus the dot product of neighbors.
   - Hint 2: distance $i$ belongs to the gap after sentence $i$.
3. **Near-duplicate detector.** Write `near_duplicates(docs, threshold, k)` that finds exact duplicates by hash and near duplicates by MinHash.
   - Acceptance test: a copy in upper case with extra spaces is an exact duplicate. A copy with three added words is a near duplicate. A version with "14 days" instead of "30 days" is not flagged at 0.8.
   - Hint 1: normalize before hashing.
   - Hint 2: one changed word in a 20-word text changes 3 shingles of size 3.
4. **Incremental sync.** Write `sync(docs, manifest, index)` with deterministic IDs and delete-before-insert.
   - Acceptance test: when a document shrinks from 3 chunks to 2, chunk `:0002` disappears. A second run with no changes reports one unchanged document. A removed document loses all its chunks.
   - Hint 1: compare SHA-256 hashes with the manifest.
   - Hint 2: return a new manifest instead of changing the old one, and save it only after all writes.

## 13. Common mistakes

1. **"Parsing is solved, the library handles it."** PDFs store glyph positions, not paragraphs. Two-column layouts, tables and scans break naive extraction. Inspect parsed output for your worst documents.
2. **"Overlap keeps ideas together."** It protects only ideas of up to $O + 1$ tokens. With 512-token chunks and 51 tokens of overlap, about 32% of 200-token ideas are still cut.
3. **"The semantic chunker finds the topic changes."** A percentile threshold cuts a fixed share of gaps in every document. The same text gave 1, 2 or 5 chunks under three threshold types.
4. **"Headings are chunks too."** A heading alone is an empty chunk. Put the header path into the chunks below it.
5. **"Deduplicate by keeping any one copy."** Near duplicates may be conflicting versions. Keep the current version by metadata.
6. **"Upsert by chunk ID updates a document."** A shorter new version leaves stale chunks. Delete all chunks of the document first.
7. **"Access lists can be added later."** Retrieval filters need them in the index from the first day ([L4](/notes/ai/llm-systems/06-rag/l4-vector-indexes)).

## 14. One-minute explanation

Ingestion decides what the retriever can ever find. A PDF stores glyph positions, so the parser rebuilds reading order, keeps tables as labeled rows and runs OCR on scans. Chunks must fit the embedding model's limit, counted with its own tokenizer, and stay focused enough for a sharp vector. Overlap protects only short ideas: with 512-token chunks and 51 tokens of overlap, a 200-token idea is cut a third of the time. So we cut at structure, at headings and paragraphs, and store the header path with each chunk. Parent-child retrieval searches small chunks and returns their whole section. Contextual retrieval adds an LLM-written context to each chunk, and Anthropic reported 49% fewer retrieval failures with contextual embeddings and BM25. Every chunk carries metadata: IDs, header path, offsets, version, access lists and hashes. We remove exact duplicates by hash and near duplicates with MinHash, but keep the current version of conflicting policies. We sync incrementally with delete-before-insert, and we re-index fully when the model, prefix or chunker changes.

## 15. Check questions

```check
{
  "question": "Why can't a PDF parser simply read the text of a page in order?",
  "answer": "A PDF content stream holds drawing instructions: glyphs at positions in fonts, shown with operators such as Tj and TJ and placed with Td or Tm. It has no notion of paragraphs, headings, columns or reading order. The parser must rebuild them from positions, which fails for two-column layouts, tables, repeated headers and footers, and scanned pages without a text layer."
}
```

```check
{
  "question": "Interview follow-up: derive the probability that a fixed-size chunker with chunk size C and overlap O cuts an idea of s tokens, and compute it for C = 1,000, O = 200 and s = 500.",
  "hint": "Count the start positions whose idea fits inside some chunk.",
  "answer": "Chunks start at multiples of the stride S = C − O and cover [jS, jS + C). An idea starting at a lies inside chunk j when a − (C − s) ≤ jS ≤ a. That window holds C − s + 1 positions, so out of every S start positions, min(S, C − s + 1) are safe. P(cut) = max(0, (s − O − 1)/(C − O)) for s ≤ C. Here: (500 − 201)/800 = 299/800 = 0.374. Even 20% overlap cuts about 37% of 500-token ideas."
}
```

```check
{
  "question": "Interview follow-up: a semantic chunker with the 95th-percentile threshold produces one cut in a short FAQ with no topic changes. Explain why, and propose a fix.",
  "answer": "The percentile threshold is relative to the document's own distances. The 95th percentile cuts about 5% of the gaps in every document, so it always cuts something, even when all distances are small. Fixes: use an absolute distance threshold calibrated on labeled boundaries, require a minimum chunk size, or prefer structure-aware cutting for structured documents such as FAQs, where each question with its answer is a natural chunk."
}
```

```check
{
  "question": "Interview follow-up: explain why MinHash works. Two documents have Jaccard similarity 0.8. With k = 256 hash functions, what is the standard error of the estimate?",
  "answer": "For one random hash function, consider the shingle with the smallest hash in the union A ∪ B. Every shingle of the union is equally likely to be that minimum. The minima of A and B are equal exactly when that shingle is in A ∩ B, which has probability |A ∩ B| / |A ∪ B| = J. With k independent functions, the share of equal positions is an average of k Bernoulli(J) trials, with standard error sqrt(J(1 − J)/k) = sqrt(0.8 × 0.2 / 256) = sqrt(0.000625) = 0.025."
}
```

```check
{
  "question": "Anthropic's contextual retrieval reported failure rates of 5.7%, 3.7%, 2.9% and 1.9%. What do these numbers measure, and what is recall@20 in the best configuration?",
  "answer": "They are top-20 retrieval failure rates, defined as 1 minus recall@20: the share of relevant chunks not retrieved in the top 20. The best configuration (contextual embeddings, contextual BM25 and reranking from the top 150 to the top 20) failed 1.9%, so recall@20 was 98.1%. Relative to the 5.7% baseline, that is a 67% reduction. It is a vendor benchmark on vendor datasets."
}
```

```check
{
  "question": "Interview follow-up: your team changes the chunk size from 512 to 384 tokens. List what must happen to the index and why an alias helps.",
  "answer": "Every document must be re-chunked and re-embedded, because chunk boundaries, chunk IDs and vectors all change. Build the new index next to the old one, run the evaluation set on both, compare recall@k, nDCG and prompt tokens, then switch an alias or configuration value that names the active index. The alias makes the switch atomic and the rollback instant. Record the chunker version in the metadata so that stale chunks are detectable."
}
```

```check
{
  "question": "A changed policy now has 10 chunks instead of 12. The sync code upserts chunks by ID. What breaks, and what is the fix?",
  "answer": "The upsert replaces chunks 0 to 9 and leaves the old chunks 10 and 11 in the index. A query can retrieve text that no longer exists in the policy. Fix: delete all chunks with the document's ID first, then insert the new chunks, and save the manifest only after all writes succeed."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\nimport re\n\ndef n_tokens(text):\n    return len(text.split())\n\ndef split_words(text, max_tokens):\n    words = text.split()\n    return [\" \".join(words[i:i + max_tokens]) for i in range(0, len(words), max_tokens)]\n\ndef pack(pieces, max_tokens, sep):\n    \"\"\"Greedy packing of pieces; a piece that is too long is split by words.\"\"\"\n    out, cur = [], \"\"\n    for p in pieces:\n        cand = p if not cur else cur + sep + p\n        if n_tokens(cand) <= max_tokens:\n            cur = cand\n            continue\n        if cur:\n            out.append(cur)\n        if n_tokens(p) <= max_tokens:\n            cur = p\n        else:\n            out.extend(split_words(p, max_tokens))\n            cur = \"\"\n    if cur:\n        out.append(cur)\n    return out\n\ndef markdown_chunks(md, max_tokens):\n    \"\"\"Split at headers, keep the header path, pack paragraphs inside each section.\"\"\"\n    path, body, chunks = [], [], []\n\n    def flush():\n        text = \"\\n\\n\".join(body).strip()\n        if text:\n            prefix = \" > \".join(path)\n            for c in pack([p for p in text.split(\"\\n\\n\") if p.strip()], max_tokens, \"\\n\\n\"):\n                chunks.append({\"header_path\": prefix, \"text\": c})\n        body.clear()\n\n    for line in md.splitlines():\n        m = re.match(r\"^(#{1,6})\\s+(.*)\", line)\n        if m:\n            flush()\n            level = len(m.group(1))\n            path[:] = path[:level - 1] + [m.group(2).strip()]\n        else:\n            body.append(line)\n    flush()\n    return chunks\n\nmd = \"\"\"# Returns policy\n## Laptops\nOpened laptops can be returned within 30 days of delivery. A restocking fee of 10% applies.\n\nThe laptop must include all accessories.\n## Phones\nPhones can be returned within 14 days. Phones with a cracked screen cannot be returned.\n\"\"\"\nchunks = markdown_chunks(md, max_tokens=20)\nfor c in chunks:\n    print(c)\nassert all(c[\"text\"].strip() and not c[\"text\"].startswith(\"#\") for c in chunks)\nassert all(n_tokens(c[\"text\"]) <= 20 for c in chunks)\nassert chunks[0][\"header_path\"] == \"Returns policy > Laptops\"\nassert chunks[-1][\"header_path\"] == \"Returns policy > Phones\"\n```"
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\nimport numpy as np\n\ndef semantic_chunks(sentences, embed, percentile=95, buffer=1):\n    n = len(sentences)\n    if n < 2:\n        return [\" \".join(sentences)]\n    windows = [\" \".join(sentences[max(0, i - buffer): i + buffer + 1]) for i in range(n)]\n    E = np.array([embed(w) for w in windows], dtype=float)\n    E /= np.linalg.norm(E, axis=1, keepdims=True)\n    dist = 1 - (E[:-1] * E[1:]).sum(axis=1)          # distance between neighbors\n    th = np.percentile(dist, percentile)\n    cuts = [i for i, x in enumerate(dist) if x > th]\n    chunks, start = [], 0\n    for i in cuts:\n        chunks.append(\" \".join(sentences[start:i + 1]))\n        start = i + 1\n    chunks.append(\" \".join(sentences[start:]))\n    return chunks\n\nTOPICS = {\"refund\": 0, \"laptop\": 0, \"return\": 0, \"vpn\": 1, \"wifi\": 1, \"router\": 1}\ndef toy_embed(text):\n    v = np.full(2, 0.05)\n    for w in text.lower().replace(\".\", \"\").split():\n        if w in TOPICS:\n            v[TOPICS[w]] += 1\n    return v\n\ns = [\"Refund rules apply to every laptop.\", \"A laptop return needs the receipt.\",\n     \"The refund arrives in five days.\", \"The vpn fails on public wifi.\",\n     \"Restart the router first.\", \"Then reconnect the vpn.\"]\nout = semantic_chunks(s, toy_embed, percentile=80, buffer=0)\nprint(out)\nassert out[0].endswith(\"five days.\") and out[1].startswith(\"The vpn\")\n```"
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\nimport hashlib, itertools, re\n\ndef normalize(text):\n    return re.sub(r\"\\s+\", \" \", text.lower()).strip()\n\ndef shingles(text, w=3):\n    words = normalize(text).split()\n    return {\" \".join(words[i:i + w]) for i in range(max(1, len(words) - w + 1))}\n\ndef signature(text, k=128):\n    s = shingles(text)\n    return [min(int(hashlib.sha1(f\"{i}:{x}\".encode()).hexdigest(), 16) for x in s) for i in range(k)]\n\ndef near_duplicates(docs, threshold=0.8, k=128):\n    \"\"\"docs: {doc_id: text}. Returns pairs whose estimated Jaccard >= threshold.\"\"\"\n    exact = {}\n    for doc_id, text in docs.items():                     # step 1: exact duplicates by hash\n        exact.setdefault(hashlib.sha256(normalize(text).encode()).hexdigest(), []).append(doc_id)\n    sigs = {d: signature(t, k) for d, t in docs.items()}   # step 2: MinHash signatures\n    pairs = []\n    for a, b in itertools.combinations(sorted(docs), 2):\n        est = sum(x == y for x, y in zip(sigs[a], sigs[b])) / k\n        if est >= threshold:\n            pairs.append((a, b, round(est, 3)))\n    return pairs, [ids for ids in exact.values() if len(ids) > 1]\n\nbase = \"Opened laptops can be returned within 30 days of delivery and a restocking fee of 10 percent applies to every return\"\ndocs = {\n    \"a\": base,\n    \"b\": base.upper() + \"   \",                              # same text, different case and spaces\n    \"c\": base + \" in all regions\",                          # a small addition\n    \"d\": base.replace(\"30 days\", \"14 days\"),                # a different policy version\n}\npairs, exact = near_duplicates(docs)\nprint(pairs, exact)\nassert [\"a\", \"b\"] in exact\nassert any(p[:2] == (\"a\", \"c\") for p in pairs)\nassert not any(p[:2] == (\"a\", \"d\") for p in pairs)\n```\n\nOutput: `[('a', 'b', 1.0), ('a', 'c', 0.891), ('b', 'c', 0.891)] [['a', 'b']]`. The 14-day version is not flagged, so a version rule must decide between a and d."
}
```

```check
{
  "question": "Exercise 4: show a reference solution.",
  "answer": "```python\nimport hashlib\n\ndef chunk(text, size=8):\n    words = text.split()\n    return [\" \".join(words[i:i + size]) for i in range(0, len(words), size)]\n\ndef sync(docs, manifest, index):\n    \"\"\"docs: {doc_id: text}. manifest: {doc_id: hash}. index: {chunk_id: (doc_id, text)}.\n    Returns new manifest and counts. Deletes old chunks of a changed document first.\"\"\"\n    counts = {\"new\": 0, \"changed\": 0, \"deleted\": 0, \"unchanged\": 0}\n    new_manifest = {}\n    for doc_id, text in docs.items():\n        h = hashlib.sha256(text.encode()).hexdigest()\n        new_manifest[doc_id] = h\n        if manifest.get(doc_id) == h:\n            counts[\"unchanged\"] += 1\n            continue\n        counts[\"changed\" if doc_id in manifest else \"new\"] += 1\n        for cid in [c for c, (d, _) in index.items() if d == doc_id]:\n            del index[cid]                                   # delete before insert\n        for i, c in enumerate(chunk(text)):\n            index[f\"{doc_id}:{i:04d}\"] = (doc_id, c)         # deterministic chunk IDs\n    for doc_id in set(manifest) - set(docs):\n        counts[\"deleted\"] += 1\n        for cid in [c for c, (d, _) in index.items() if d == doc_id]:\n            del index[cid]\n    return new_manifest, counts\n\nindex, manifest = {}, {}\nv1 = {\"returns\": \" \".join(f\"w{i}\" for i in range(24)), \"vpn\": \"restart the router then reconnect\"}\nmanifest, c1 = sync(v1, manifest, index)\nv2 = {\"returns\": \" \".join(f\"w{i}\" for i in range(10))}       # shorter: 2 chunks instead of 3\nmanifest, c2 = sync(v2, manifest, index)\nprint(c1, c2, sorted(index))\nassert c2 == {\"new\": 0, \"changed\": 1, \"deleted\": 1, \"unchanged\": 0}\nassert sorted(index) == [\"returns:0000\", \"returns:0001\"]     # no stale chunk returns:0002\n_, c3 = sync(v2, manifest, index)\nassert c3[\"unchanged\"] == 1\n```"
}
```

## 16. Links

- Previous: [L2: Embeddings in depth](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth)
- Next: [L4: Vector indexes](/notes/ai/llm-systems/06-rag/l4-vector-indexes)
- Related: [Chunking](/notes/ai/context-engineering/04-write-and-rag/l5-chunking), [The RAG pipeline](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) and [Beyond basic RAG](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) in the context engineering course
- Related: [Prefix caching and KV reuse](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse), [L9: Production RAG architecture](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture)
- Drill: [Drill: RAG](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag)

### Sources

- Anthropic, "Introducing Contextual Retrieval", 19 September 2024: https://www.anthropic.com/news/contextual-retrieval (checked on 2026-10-15)
- LangChain `SemanticChunker` source, `langchain_experimental/text_splitter.py`: https://github.com/langchain-ai/langchain-experimental (checked on 2026-10-15)
- Broder, "On the resemblance and containment of documents", 1997: https://www.cs.princeton.edu/courses/archive/spring13/cos598C/broder97resemblance.pdf (checked on 2026-10-15)
- Databricks AI Search (formerly Databricks Vector Search): https://docs.databricks.com/aws/en/vector-search/vector-search (checked on 2026-10-15)
- PyPI pages of pymupdf, docling and unstructured: https://pypi.org/project/pymupdf/, https://pypi.org/project/docling/, https://pypi.org/project/unstructured/ (checked on 2026-10-15)
- all-MiniLM-L6-v2 model card (input limit of 256 word pieces): https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 (checked on 2026-10-15)
