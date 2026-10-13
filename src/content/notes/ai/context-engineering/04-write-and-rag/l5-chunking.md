---
title: "L5: Chunking"
order: 5
summary: "Chunking cuts documents into pieces before embedding. Five strategies, the difference between characters and tokens, the exact cost of overlap, the input limit of the embedding model, and a debug exercise on the handbook's own chunkers."
status: not-started
tags: [write-and-rag, rag, chunking, overlap, tokens]
---

## 1. The question this idea answers

Stage 2 of the RAG pipeline cuts each document into chunks (lesson [L4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline)). How large should a chunk be? Where should a cut go? How much should neighboring chunks overlap?

The handbook calls chunking "the single highest-leverage tuning parameter in RAG" (Session 3, §5). Its own default has a unit error that changes the chunk size by a factor of about 4. Its recommended chunk size does not fit its own embedding model. This lesson builds chunking from first principles, so that I can find such errors myself.

## 2. Mental model

> [!analogy] Cutting a book into index cards
> A librarian cuts a book into index cards and files each card under one subject line.
>
> - A **card that is too big** covers several topics, so its subject line is vague. It also takes a lot of space when someone copies it into a report.
> - A **card that is too small** holds half an idea. "This setting must be off" means nothing without the card before it.
> - **Overlap** repeats the last lines of each card at the top of the next one. A sentence on the border is then whole on at least one card.
>
> **Where it stops working:** in RAG, a card's "subject line" is one vector. The embedding model computes it from the whole card. No person chooses it. And the embedding model may read only the first part of a long card. Everything after its input limit is silently ignored.

## 3. Terms

| Term | Plain meaning |
|---|---|
| chunking | Splitting documents into smaller pieces before embedding them. |
| chunk size | The largest length of one chunk. Its unit (characters or tokens) depends on the splitter. |
| chunk overlap | The number of characters or tokens that the end of one chunk shares with the start of the next one. |
| stride | The distance between the starts of two neighboring chunks: chunk size minus overlap. |
| fixed-size chunking | Cutting text every N characters or tokens, without regard to sentences or sections. |
| sentence-aware chunking | Cutting only between sentences, and filling each chunk with whole sentences up to the size limit. |
| semantic chunking | Cutting where the topic changes, which an embedding model or an LLM detects. |
| structural chunking | Cutting at the structure of the document: sections, headers, paragraphs, code blocks. Recursive splitting is the common method. |
| recursive splitting | Splitting with an ordered list of separators, for example paragraphs, then lines, then words. The next separator is used only for pieces that are still too long. |
| hierarchical chunking | Keeping chunks at several levels, for example small child chunks for search and their larger parent sections for the prompt. |
| separator | A string where a splitter may cut, for example a blank line. |
| truncation | Cutting an input at a model's input limit. An embedding model ignores the text after the limit, usually without an error. |
| word piece | A token of the WordPiece tokenizer that BERT-family models such as all-MiniLM-L6-v2 use. Its count differs from a tiktoken count. |
| contextual chunk header | Text added in front of a chunk before embedding, for example the document title and the section path, so that the chunk carries its context. |
| storage factor | The total size of all chunks divided by the size of the original text. Overlap makes it larger than 1. |

## 4. Method and math

### 4.1 Why split documents at all

There are three reasons, and each one sets a limit on the chunk size.

**Reason 1: the input limit.** An embedding model reads at most a fixed number of tokens (section 4.6). Text after the limit does not reach the vector.

**Reason 2: one vector cannot hold many topics.** The handbook FAQ (Session 3, Q7) says that one vector for a 50-page document "becomes a blurry average that matches many queries loosely but none precisely". Many sentence-embedding models build the text vector by averaging token vectors (mean pooling). A simple model shows the size of the effect.

Assume an idealized document that covers $k$ topics equally. Topic $j$ has a unit vector $e_j$, and the topic vectors are orthogonal. The document vector is their normalized average, and a question about topic 1 has the vector $e_1$:

$$
d = \frac{e_1 + e_2 + \cdots + e_k}{\sqrt{k}}, \qquad \cos(e_1, d) = \frac{e_1 \cdot d}{\lVert e_1 \rVert\,\lVert d \rVert} = \frac{1/\sqrt{k}}{1 \cdot 1} = \frac{1}{\sqrt{k}}
$$

The symbols mean:

- $k$ is the number of topics in the document.
- $e_j$ is the unit vector of topic $j$. Orthogonal means $e_i \cdot e_j = 0$ for $i \ne j$.
- $\lVert x \rVert$ is the length of vector $x$. The sum of $k$ orthogonal unit vectors has length $\sqrt{k}$, so $d$ has length 1.
- $\cos$ is the cosine similarity (lesson [L6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity)).

> [!example] Worked example: how blurry is the average?
> | Topics in the text, $k$ | Similarity to a question on one topic, $1/\sqrt{k}$ |
> |---|---|
> | 1 (a focused chunk) | 1.000 |
> | 4 | 0.500 |
> | 10 | 0.316 |
> | 50 | 0.141 |
>
> A 50-topic document scores 0.14 for a question that one of its pages answers exactly. A focused chunk on that topic scores 1.0. Real models do not average this simply, and real topics are not orthogonal. The direction of the effect holds: mixing topics makes the vector less similar to each one.

**Reason 3: the prompt budget.** Retrieved chunks go into the window. The handbook (Session 3, §5.5, Tip) gives the arithmetic. Three chunks of 2,000 tokens use 6,000 tokens. Three chunks of 500 tokens use 1,500.

So chunks must be small enough for the model's input limit, focused enough for a sharp vector, and cheap enough for the prompt. They must also be large enough to make sense alone.

### 4.2 Five strategies

| Strategy | How it cuts | Good for | Main failure |
|---|---|---|---|
| Fixed-size | Every N characters or tokens, with overlap | Logs, uniform text, a baseline | Cuts mid-sentence and mid-word |
| Sentence-aware | Between sentences, filling each chunk to the limit | Prose and articles | Breaks at abbreviations, and a very long sentence becomes one oversized chunk |
| Semantic | Where an embedding model or an LLM sees a topic change | Mixed documents without clear structure | Costs a model call or many embeddings at indexing time |
| Structural (recursive) | At headers, paragraphs, lines, code blocks | Markdown, HTML, code, wikis, API references | Needs a document with real structure |
| Hierarchical | Several levels: child chunks inside parent sections | Large knowledge bases with both overview and detail questions | More storage and more pipeline code |

The table follows the handbook (Session 3, §5.1). The handbook FAQ (Session 3, Q13) adds a judgment: sentence-aware chunking is "the best default for unstructured text", structural chunking is "ideal when your documents have clear headers", and fixed-size is "rarely the best choice for production". Treat this as a rule of thumb and test it on your corpus.

### 4.3 Characters or tokens?

The most common chunking bug is a unit error. The facts below were checked on 2026-10-12 in the source code and docs of `langchain-text-splitters` 1.1.3.

| Fact | Value |
|---|---|
| Import | `from langchain_text_splitters import RecursiveCharacterTextSplitter` (package `langchain-text-splitters`) |
| Defaults of the base class | `chunk_size=4000`, `chunk_overlap=200`, `length_function=len`, `strip_whitespace=True` |
| Default separators of the recursive splitter | `["\n\n", "\n", " ", ""]` |
| Unit of `chunk_size` | **Characters**, because `length_function=len` counts characters |
| Token-based versions | `from_tiktoken_encoder(encoding_name=..., chunk_size=..., chunk_overlap=...)` and `from_huggingface_tokenizer(tokenizer, ...)` |

So `RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)` makes chunks of up to 500 **characters**. For English text, one token is about 4 characters (OpenAI's rule of thumb, lesson [1.2](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers)). Measured values for plain English are about 4 to 5 characters per token. So 500 characters are about 100 to 125 tokens.

Count with the tokenizer of the **embedding model**, because its input limit is what matters. OpenAI's `text-embedding-3` models use the `cl100k_base` encoding, so `from_tiktoken_encoder(encoding_name="cl100k_base")` counts exactly. `all-MiniLM-L6-v2` uses its own word-piece tokenizer, so pass that tokenizer to `from_huggingface_tokenizer`.

> [!note] Source check: chunk_size counts characters
> **Corrected.** The handbook (Session 3, §5.4, §5.5, §10.1.2) uses `RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)` and treats it as 500 tokens. Examples are "At 500 tokens per chunk" (§5.5, Tip) and "4–5 chunks × 500" (§8.1). The splitter counts characters by default, so 500 is about 125 tokens of English. The handbook also writes "512–1024 tokens (≈1500–3000 characters)" (§5.5). That implies 2.9 characters per token. At 4 characters per token, it is about 2,000 to 4,000 characters. Its table (§5.1) says that fixed-size chunking splits "every N tokens", but its code (§5.2) slices characters. Source: langchain-text-splitters source and docs, checked on 2026-10-12.

> [!note] Source check: the separator list and the import
> **Corrected.** The handbook (Session 3, §5.4) shows `separators=["\n\n", "\n", ". ", " ", ""]` as "the recommended default". The library default is `["\n\n", "\n", " ", ""]`. The `". "` entry is custom, and with the default `keep_separator=True` it goes to the **start** of the next chunk. The handbook also imports `from langchain.text_splitter import RecursiveCharacterTextSplitter`. Install `langchain-text-splitters` and import from `langchain_text_splitters` instead. A LangChain forum thread reports that the old import fails in LangChain 1.x. Checked on 2026-10-12.

> [!example] Worked example: what the custom separator does
> A run of the handbook's separator list with `chunk_size=120` and `chunk_overlap=20` on a short text, in `langchain-text-splitters` 1.1.3 on 2026-10-12, gave these first two chunks:
>
> - `The authentication module uses JWT tokens for secure session management. Tokens expire after 15 minutes`
> - `. Refresh tokens last 7 days. The middleware validates every request. Dr. Smith wrote the design, e.g`
>
> The second chunk starts with ". ". The period after "minutes" moved from the end of the first chunk to the start of the second. With `keep_separator="end"`, the period stays at the end of the first chunk. But the second chunk still ends after "e.g.", in the middle of a sentence. The `". "` separator cannot tell an abbreviation such as "e.g." or "Dr." from the end of a sentence.

### 4.4 Overlap: the exact cost and the exact benefit

Use these symbols:

- $L$ is the length of the document, in tokens.
- $C$ is the chunk size and $O$ is the overlap, in tokens, with $0 \le O < C$.
- $s = C - O$ is the stride.
- $o = O / C$ is the overlap ratio.

**The number of chunks.** The first chunk starts at 0, and each next chunk starts $s$ tokens later. The last chunk is the first one that reaches the end of the document:

$$
n = \left\lceil \frac{L - O}{C - O} \right\rceil \quad \text{for } L > C, \qquad n = 1 \text{ for } L \le C
$$

**The storage factor.** For $L$ much larger than $C$, $n \approx L / s$, so the chunks hold about $n\,C$ tokens in total:

$$
\frac{n\,C}{L} \approx \frac{C}{C - O} = \frac{1}{1 - o}
$$

Storage, embedding cost and indexing time all grow by this factor.

**The guarantee.** Any span of at most $O + 1$ tokens lies whole inside at least one chunk. Take the last chunk that starts at or before the first token of the span, at position $a$. That chunk starts after $a - s$, so it ends after $a - s + C = a + O$. A longer span can be cut. A brute-force check over all small $L$, $C$ and $O$ confirms the count formula and the guarantee.

> [!example] Worked example: 15% overlap on 100,000 tokens
> $L = 100{,}000$, $C = 512$, and 15% overlap gives $O = 77$ (0.15 × 512 = 76.8). The stride is $s = 435$.
>
> - Chunks: $n = \lceil (100{,}000 - 77) / 435 \rceil = \lceil 229.7 \rceil = 230$.
> - The last chunk starts at $229 \times 435 = 99{,}615$ and holds 385 tokens.
> - Stored tokens: $229 \times 512 + 385 = 117{,}633$. That is 1.176 times the text, or 17.6% more.
> - The formula gives $1 / (1 - 77/512) = 1.177$.
>
> The overlap protects any idea of up to 78 tokens: about one to three sentences. A 300-token explanation that crosses a boundary is still cut.

| Overlap ratio $o$ | Storage factor $1/(1-o)$ | Extra storage |
|---|---|---|
| 10% | 1.111 | 11.1% |
| 15% | 1.176 | 17.6% |
| 20% | 1.250 | 25.0% |
| 50% | 2.000 | 100% |

> [!note] Source check: "storage grows by about the overlap percentage"
> **Corrected.** The handbook FAQ (Session 3, Q11) says that overlap increases storage "by approximately the overlap percentage". The exact factor is $1/(1-o)$. At 15% overlap the increase is 17.6%, close to 15%. At 50% overlap it is 100%, not 50%. OpenAI's file search uses 800-token chunks with a 400-token overlap by default (lesson 4.4), so it stores every token about twice. The FAQ's other number is right: 15% of 512 tokens is about 77 tokens.

Overlap is a cheap guard for short ideas on a boundary. It does not keep a long idea together. Structure-aware splitting (section 4.5) does that better.

### 4.5 Structure-aware splitting

A recursive splitter tries its separators in order. With the default list, it first cuts at blank lines (paragraphs). Only a paragraph that is still too long is cut at line breaks, then at spaces, and as a last step at single characters. So most chunks end at a paragraph boundary.

Other structures need their own rules:

| Content | Rule |
|---|---|
| Markdown | Split at headers first. `MarkdownHeaderTextSplitter` does this. Keep the header path with each chunk. |
| Code | Keep a function or a class in one chunk. `RecursiveCharacterTextSplitter.from_language(...)` uses separators for each programming language. |
| Tables | Convert HTML or CSV tables to Markdown before chunking (handbook FAQ, Session 3, Q18). Keep a small table whole. For a long table, repeat the header row in each chunk. |
| Images | Let a vision model write a text description, and embed the description (handbook FAQ, Session 3, Q18). |

A chunk often loses its context when it leaves its document. "The limit is 30 days" does not say which limit. A **contextual chunk header** restores the context. The simple form adds the document title and the section path before the chunk text, for example "Returns policy > Laptops > Opened items". The handbook FAQ (Session 3, Q21) calls this "one of the highest-ROI improvements you can make to a RAG pipeline".

Anthropic's "Introducing Contextual Retrieval" (19 September 2024) tests a stronger form. An LLM writes a short context for each chunk, "usually 50-100 tokens", and the system embeds it with the chunk. In Anthropic's tests, this alone lowered the top-20 retrieval failure rate from 5.7% to 3.7%, a 35% reduction. They generated the contexts with Claude 3 Haiku and prompt caching, for a one-time cost of USD 1.02 per million document tokens. This is a vendor benchmark on the vendor's datasets. Part 5 covers the other half of that study, which adds keyword search and a reranker.

### 4.6 The embedding model's input limit

| Model | Input limit (checked on 2026-10-12) |
|---|---|
| `sentence-transformers/all-MiniLM-L6-v2` (Chroma's default) | 256 word pieces. Training used sequences of up to 128 tokens. |
| `intfloat/e5-large-v2` | 512 tokens |
| OpenAI `text-embedding-3-small` and `text-embedding-3-large` | 8,192 tokens |
| Voyage 4 models | 32K tokens |
| Cohere `embed-v4.0` | 128K tokens |

The MiniLM model card says: "By default, input text longer than 256 word pieces is truncated." There is no error and no warning in the result. The vector simply describes the first part of the chunk.

> [!note] Source check: chunk sizes and the default embedding model
> **Corrected.** The handbook recommends "512–1024 tokens" per chunk (Session 3, §5.5) and uses Chroma's default model, all-MiniLM-L6-v2 (§6.2). That model truncates input after 256 word pieces. A 512-token chunk is embedded about half, and a 1,024-token chunk about one quarter, depending on how the two tokenizers count. The text after the limit can never match a query. Use chunks within the model's limit, measured with its own tokenizer. Or use a model with a longer limit. Source: all-MiniLM-L6-v2 model card, checked on 2026-10-12.

The handbook's **code**, with 500 characters, gives chunks of about 100 to 125 tokens. Those fit MiniLM well. So the code works, and the stated defaults do not. Two errors cancel each other here, which is a good reason to measure instead of trusting either one.

A long input limit does not make long chunks good. A 30,000-token chunk fits in a Voyage 4 model. But its vector is a blurry average (section 4.1), and it costs 30,000 tokens of prompt when retrieved.

### 4.7 Choosing chunk size and overlap

The handbook gives two rules of thumb:

- Session 3, §5.5: 512 to 1,024 tokens, with 10% to 20% overlap.
- Session 3, FAQ Q31: small chunks (128 to 256 tokens) give "high retrieval precision, but low recall and context". Large chunks (1,024 to 2,048 tokens) give "more context per hit, but lower precision".

Both are starting points. The right size depends on three things. These are the length of a typical answer in your documents, the input limit of your embedding model and your prompt budget. Measure it:

1. Write 30 to 50 questions. For each one, mark the **passage** in the source that answers it, as a character span. Do not mark chunk IDs, because the chunk boundaries change with the chunk size.
2. For each candidate size, rebuild the index and count a hit when a retrieved chunk overlaps the marked passage.
3. Compare the hit rate in the top $k$ (Recall@k, Part 5) and the prompt tokens per query.
4. Keep the smallest size that reaches your target hit rate.

**Parent-child chunking** removes part of the trade-off. Index small child chunks for sharp vectors, but put their larger parent section into the prompt. The handbook FAQ (Session 3, Q31) calls this hierarchical chunking. LangChain's `ParentDocumentRetriever` describes it as: "Retrieve small chunks then retrieve their parent documents." Part 5 covers it.

### 4.8 Production view

| Concern | What this lesson means for it |
|---|---|
| Correctness | Keep every chunk within the embedding model's input limit, counted with that model's tokenizer. Truncation gives no error. |
| Retrieval quality | Cut at structure, add a contextual header, and measure chunk sizes on labeled passages. |
| Cost | Overlap multiplies storage and embedding cost by $1/(1-o)$. Chunk size times $k$ is the prompt cost of each query. |
| Maintenance | A new chunk size means a full re-chunk and re-embed. Version the chunking settings with the index. |
| Observability | Store each chunk's source, character offsets and header path. A citation then points to the exact place in the document. |

## 5. Graphs

```plot
{
  "title": "Storage factor of overlap: exact 1/(1 − o) (red) and the handbook's estimate 1 + o (gold)",
  "xAxis": { "label": "overlap ratio o", "domain": [0, 0.6] },
  "yAxis": { "label": "stored tokens ÷ original tokens", "domain": [1, 2.6] },
  "disableZoom": true,
  "data": [
    { "fn": "1/(1-x)", "color": "#C81D25" },
    { "fn": "1+x", "color": "#B8860B" }
  ]
}
```

The two lines are close below 20% overlap. At $o = 0.5$, the red line is at 2.0 and the gold line is at 1.5.

## 6. Code

These exercises go in `notebooks/04-write-and-rag.ipynb`. Exercise 5.1 then moves to `src/rag/chunking.py` with its tests in `tests/`.

**Exercise 5.1: a token chunker from first principles.**

1. Write `chunk_spans(n_tokens, size, overlap)`, which returns a list of `(start, end)` token positions.
2. Raise a `ValueError` unless `size > 0` and `0 <= overlap < size`.
3. Stop as soon as a chunk reaches the end of the text.
4. Write `chunk_text(text, size, overlap, encode, decode)` on top of it, with any tokenizer.

Acceptance tests:

- For 1,000 random triples, the number of spans equals the formula of section 4.4.
- `chunk_spans(950, 500, 50)` returns 2 spans, not 3.
- No span lies completely inside the span before it.
- Every window of `overlap + 1` positions lies inside at least one span.

**Exercise 5.2: characters against tokens.**

1. Take a 20,000-character English text.
2. Split it with `RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)`.
3. Split it again with `from_tiktoken_encoder(encoding_name="cl100k_base", chunk_size=500, chunk_overlap=50)`.
4. For both, print the chunk count and the smallest, mean and largest chunk length in `cl100k_base` tokens.

Acceptance tests:

- Every character-based chunk has at most 500 characters, and their mean length is far below 500 tokens.
- Over the whole text, the ratio of characters to `cl100k_base` tokens is between 3.5 and 5.5.
- No token-based chunk is longer than 500 tokens.

**Debug exercise 5.3: the handbook's chunkers.** The handbook (Session 3, §5.2 and §5.3) gives these two functions. Find at least three problems in `fixed_size_chunk` and four in `sentence_chunk`. For each problem, write an input that shows it and a test that fails. Then fix the code. The answers are in the check questions.

```python
def fixed_size_chunk(text, chunk_size=500, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks
# Problem: "...JWT tokens for sec" | "cure session management..."
#                                  ^-- mid-word split!

def sentence_chunk(text, max_chunk_size=500):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current = [], ""
    for sent in sentences:
        if len(current) + len(sent) > max_chunk_size and current:
            chunks.append(current.strip())
            current = sent
        else:
            current += " " + sent
    if current.strip():
        chunks.append(current.strip())
    return chunks
```

**Exercise 5.4: a chunk-size sweep with a local model.**

1. Use `sentence-transformers` with `all-MiniLM-L6-v2`. It runs locally and costs nothing.
2. Use the Part 1 lessons as the corpus. Write 20 questions and mark the answer passage of each as a character span.
3. Chunk with the model's own tokenizer at 64, 128, 256 and 512 tokens, with 15% overlap.
4. For each size, measure the share of questions whose passage overlaps a chunk in the top 3.

Acceptance tests:

- A table with four rows: size, hit rate in the top 3, mean prompt tokens for 3 chunks.
- One sentence that explains the result at 512 tokens with the input limit of section 4.6.

## 7. Common mistakes

1. **"`chunk_size=500` means 500 tokens."** In `RecursiveCharacterTextSplitter` it means 500 characters, about 100 to 125 tokens of English. Use a token-based constructor when you mean tokens.
2. **"A larger embedding limit allows larger chunks."** A long chunk still gives a blurry vector and an expensive prompt. The limit is a ceiling, not a target.
3. **"Overlap keeps ideas together."** It protects only spans of up to $O + 1$ tokens. Long ideas need structure-aware splitting.
4. **"20% overlap costs 20% more storage."** It costs 25%. At 50% overlap, it costs 100%.
5. **"Count chunk tokens with tiktoken."** Count with the embedding model's own tokenizer. MiniLM's word pieces are not `cl100k_base` tokens.
6. **"Label the correct chunk ID for each test question."** Chunk IDs change when the chunk size changes. Label the answer passage in the source text.

## 8. One-minute explanation

Before embedding, a RAG system cuts documents into chunks. Chunks must be small enough for the embedding model's input limit, because text after the limit is silently ignored. They must be focused, because one vector for many topics is a blurry average. And they must be cheap, because every retrieved chunk goes into the prompt. Cut at structure: headers, paragraphs and code blocks, with a recursive splitter. Check the unit: LangChain's chunk_size counts characters by default, so 500 means about 125 tokens. Overlap repeats the end of each chunk at the start of the next one. It protects short ideas on a boundary and multiplies storage by one over one minus the overlap ratio. The handbook's sizes are starting points, so measure chunk sizes on labeled passages from your own documents.

## 9. Check questions

```check
{
  "question": "Debug exercise 5.3, part 1: name three problems in fixed_size_chunk, with an input that shows each one.",
  "hint": "Try a 950-character text with the defaults. Try chunk_size = 50 and overlap = 50. Then read the comment with overlap in mind.",
  "answer": "1. A redundant tail chunk: the loop continues while start < len(text), even after a chunk reached the end. 950 characters with 500/50 give chunks [0:500], [450:950] and [900:950], and the third holds only text that is already in the second. Fix: stop after a chunk whose end reaches len(text). 2. An endless loop: when overlap ≥ chunk_size, start stays the same (50/50) or decreases. Fix: raise ValueError unless chunk_size > 0 and 0 ≤ overlap < chunk_size. 3. The comment ignores the overlap: the next chunk starts 50 characters earlier, so it holds the whole word 'secure', and 'sec' + 'cure' would not even spell it. The cut still happens, at other places. Also, the function counts characters, while the handbook's table says tokens."
}
```

```check
{
  "question": "Debug exercise 5.3, part 2: name four problems in sentence_chunk, with an input that shows each one.",
  "hint": "Try 'Dr. Smith wrote it, e.g. the key plan.' Try one sentence of 1,000 characters. Try sentences of 60, 50 and 50 characters with max_chunk_size = 100.",
  "answer": "1. No overlap: an idea across two chunks has no whole copy. 2. Oversized chunks: a 1,000-character sentence becomes one 1,000-character chunk with the limit 500, and the embedding model may truncate it. 3. Wrong sentence ends: the regex splits after abbreviations, so 'Dr. Smith wrote it, e.g. the key plan.' becomes 'Dr.', 'Smith wrote it, e.g.' and 'the key plan.'. 4. The joining space is not counted: sentences of 60, 50 and 50 characters with the limit 100 give chunks of 60 and 101 characters. The first chunk also counts a leading space. And it measures characters, not tokens."
}
```

```check
{
  "question": "A corpus has 2,000,000 tokens. You use 1,000-token chunks with 200 tokens of overlap. How many chunks do you get, how many tokens do they hold, and what does embedding them cost at USD 0.02 / MTok?",
  "hint": "Stride = 800. n = ⌈(L − O)/(C − O)⌉. The storage factor is 1/(1 − o).",
  "answer": "n = ⌈(2,000,000 − 200) / 800⌉ = ⌈2,499.75⌉ = 2,500 chunks. The factor is 1/(1 − 0.2) = 1.25, so the chunks hold about 2,500,000 tokens (exactly 2,499,800, because the last chunk is shorter). Embedding cost: 2.5 × 0.02 ≈ USD 0.05."
}
```

```check
{
  "question": "With 512-token chunks and a 50-token overlap, is a 40-token sentence on a chunk boundary always whole in some chunk? Is a 120-token definition?",
  "answer": "Any span of at most O + 1 = 51 tokens lies whole inside at least one chunk, so the 40-token sentence is safe. A 120-token definition is longer than 51 tokens, so a boundary can cut it. Structure-aware splitting or a larger overlap is needed for it."
}
```

```check
{
  "question": "A team uses Chroma's default embedding model and 1,000-token chunks. Retrieval finds facts from the start of chunks but almost never from their second half. What is the likely cause, and two fixes?",
  "answer": "Truncation: all-MiniLM-L6-v2 ignores input after 256 word pieces, so the second half of each chunk never reaches the vector. Fixes: chunk to at most 256 word pieces (ideally near 128) counted with the model's own tokenizer, or switch to an embedding model with a longer input limit, then re-embed."
}
```

```check
{
  "question": "The handbook says '512–1024 tokens (≈1500–3000 characters)'. What characters-per-token ratio does that imply, and what is a better estimate for English?",
  "answer": "1,500 / 512 ≈ 2.9 characters per token. For English, about 4 characters per token is the usual rule (measured values are about 4 to 5), so 512 to 1,024 tokens are about 2,000 to 4,000 characters. Better still, count with the embedding model's tokenizer."
}
```

## 10. Links

- Previous: [L4: The RAG pipeline](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline)
- Next: [L6: Embeddings and similarity](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity)
- [L2: Tokens and tokenizers](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers): characters per token
- [Part 5: Retrieval quality](/notes/ai/context-engineering/05-retrieval-quality): parent-child retrieval, contextual retrieval and Recall@k
- [Glossary](/notes/ai/context-engineering/glossary)
