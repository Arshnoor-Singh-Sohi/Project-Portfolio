---
title: "Glossary"
order: 2
summary: "Every term of LLM Systems Deep Dive, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 3.2 is Part 3, Lesson 2. The terms of the PagedAttention paper are in the [Papers glossary](/notes/papers/glossary).

| Term | Plain meaning | First seen |
|---|---|---|
| abort | Removal of a request before it finishes, for example when the client disconnects. Its KV cache blocks become free. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| absorption | Merging an up-projection into another matrix in advance, so that the full keys and values are never computed. | [3.5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| abstention | The answer says that the context does not contain the information, instead of guessing. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| `Accept` | The request header that lists the response formats that the client can read. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| acceptance probability $\beta$ | The probability that one draft token is accepted in one context. $\beta = \sum_x \min(p(x), q(x))$. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| acceptance rate $\alpha$ | The average of $\beta$ over contexts: $\alpha = E[\beta]$. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| access control list (ACL) | The list of users or groups that may read a document. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| access token | A short-lived credential that the client sends as `Authorization: Bearer <token>`. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| activations | Temporary tensors of one forward pass. Their peak grows with the number of tokens in one step. | [5.2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) |
| active retrieval | Retrieval that the system triggers during generation, for example when the model is unsure of its next sentence. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| ADC (asymmetric distance computation) | Distance between an exact query and a PQ-coded vector, computed with a lookup table. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| additive attention | The attention of Bahdanau et al. (2015). A small neural network computes each score. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| additive mask $M$ | A matrix added to the scores: 0 where reading is allowed, $-\infty$ where it is blocked. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| admission control | Rejecting new requests when the server is too full, so that accepted requests still meet their latency targets. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| AEAD | Authenticated encryption, such as AES-GCM: it hides data and detects any change to it. | [7.9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) |
| Agentic AI Foundation (AAIF) | A directed fund under the Linux Foundation. MCP has been one of its projects since 2025-12-09. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| agentic RAG | RAG where the model decides whether to search, what to search for, and when to stop, by calling a retrieval tool in a loop. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| alignment | Which input tokens matter for one output token. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| all-gather | Every GPU gives a piece, and every GPU receives all pieces joined together. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| all-reduce | A collective operation: every GPU gives a vector, and every GPU receives the sum of all vectors. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| all-to-all | Every GPU sends a different piece to every other GPU. Used to route tokens to experts. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| analyzer | The steps that turn text into terms: split, lowercase, and optionally stem. Documents and queries must use the same one. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| angle | The opening between two arrows that start at the same point. Written $\theta$. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| ANN | Approximate nearest-neighbor search: faster than exact search, with a measured recall. | [8.3](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag) |
| ANN recall@k | The share of the true $k$ nearest neighbors that the index returns. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| `Annotated` and `Field` | Typing helpers that attach constraints and descriptions to a parameter, for example a regex pattern. | [7.13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) |
| annotation | A keyword that only describes, such as `description`, `title`, `default` or `examples`. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| annotations | Hints about a tool's behavior, such as `readOnlyHint`. Untrusted unless the server is trusted. | [8.4](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp) |
| answer correctness | How well the answer matches a reference answer. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| answer relevance | How well the answer addresses the question, whether or not it is correct. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| API gateway | A front server that terminates TLS, checks the API key, applies rate limits and chooses a replica. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| API server | The process that receives HTTP requests, tokenizes, and streams results back. | [4.10](/notes/ai/llm-systems/04-inference/l10-serving-engines) |
| API server process | In vLLM V1, the process that handles HTTP, tokenization, detokenization and streaming. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| append | Write the K and V vectors of new tokens into the next free slots. | [3.4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) |
| application state | What the server's business logic remembers: a shopping cart, a browser, a database transaction. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| application-driven | The host decides which resources enter the model context. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| applicator | A keyword that applies subschemas: `properties`, `items`, `allOf`, `anyOf`, `oneOf`, `not`, `if`. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| approximate nearest neighbor (ANN) search | Search that compares the query with only part of the vectors. It is faster and can miss true neighbors. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| argmax-invariant | A processing step that can never change which token has the highest logit. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| arithmetic intensity | FLOPs divided by the bytes that must move to and from memory. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| assertion | A keyword that can make an instance invalid, such as `required` or `pattern`. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| assumption | A value that you choose and say aloud before you compute, for example $u = 0.92$. | [8.6](/notes/ai/llm-systems/08-interview-drills/l6-mock-interview) |
| asymmetric (zero-point) quantization | Codes cover the range from the minimum to the maximum, with a zero-point. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| asymmetric model | A model that encodes queries and documents differently, often with a prefix such as "query: ". | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| attention backend | The kernel library that computes attention over the paged KV cache, such as FlashAttention or FlashInfer. | [4.10](/notes/ai/llm-systems/04-inference/l10-serving-engines) |
| attention mask | A tensor that marks which positions are real and which are padding (or future tokens). | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| attention mask (Hugging Face) | A $[B, T]$ matrix with 1 for real tokens and 0 for padding. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| attention mask (padding mask) | A list of 1s and 0s per sequence. A 0 marks a pad slot that no query may see. | [3.4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) |
| attention matrix $P$ | The matrix of attention weights after the softmax, shape $[T, T]$. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| attention pattern | The $T \times T$ matrix of weights of one head. Row $i$ shows how token $i$ spreads its attention. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| attention sink | An early token that receives a large share of attention, whatever its content. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| attention weight | The share of one value in the weighted average. The weights of one query sum to 1. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| audience | The resource for which a token was issued. The `aud` claim in a JWT. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| authentication | Proving who is calling. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| authorization | Deciding what the caller may do. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| authorization code | A one-time code that the AS gives the client through the browser. The client trades it for tokens. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| authorization server (AS) | The service that authenticates the user, asks for consent and issues tokens. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| autoregressive generation | Generate one token, append it to the input, and run the model again for the next token. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| autoregressive property | The rule that position $i$ depends only on positions $1$ to $i$. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| autoscaler | A control loop that changes the number of replicas from a measured signal. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| average precision (AP) | The average of precision@i over the ranks $i$ where a relevant document appears, divided by the number of relevant documents. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| AWQ | Activation-aware weight quantization: scale up the weights that meet large activations before rounding. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| axis (dimension) | One direction of a tensor. Axis 0 is the first. In code, `dim=-1` means the last axis. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| $B$ | The number of sequences in the batch. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| backwards compatible | A change that old implementations can ignore without breaking. | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| bandwidth | How many bytes per second can move between two places, for example 3.35 TB/s from HBM. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| bandwidth bound | The highest decode throughput that the memory bandwidth allows. Real servers reach only part of it. | [5.7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) |
| bandwidth utilization | Achieved bytes per second divided by peak bandwidth. The memory-side twin of MFU. | [4.3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) |
| batch | A group of independent sequences processed together. Its size is $B$. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| batch API | An API mode that accepts jobs and returns results within hours, at a discount. | [5.7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) |
| batch inference | Jobs that finish within hours, usually at a 50% discount. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| batch invariance | The property that a request's numbers do not depend on which other requests share its batch. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| batch size | The number of sequences that run together in one decode step, written $B$. | [4.3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) |
| batched matrix multiplication | Many independent matrix multiplications in one call, one for each index of the leading axes. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| benchmark client | A program that sends requests at a chosen rate and measures latency and throughput, such as `vllm bench serve`. | [4.10](/notes/ai/llm-systems/04-inference/l10-serving-engines) |
| BF16, FP16 | 16-bit number formats: 2 bytes per number. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| bi-encoder | A model that encodes the query and the document separately. Document vectors can be computed once and stored. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| bias | The learned vector $b$ that a linear layer adds after the multiplication. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| bidirectional attention | Attention without a causal mask: each token can attend to every token, before and after it. Encoders such as BERT use it. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| bit | One binary digit: 0 or 1. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| `BlobResourceContents` | One content item with `uri`, base64 `blob` and optional `mimeType`. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| block | In vLLM, a fixed group of token slots in the KV cache. The default block size is 16 tokens. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| block hash | A fingerprint of one block: a hash of (parent block hash, the block's token IDs, extra keys). | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| block table | A per-sequence list that maps logical KV blocks to physical blocks in GPU memory (PagedAttention). | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| blue-green deployment | Two complete environments. Traffic switches from the old (blue) to the new (green) at once. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| blue-green index | Two indexes side by side: the current one serves traffic while the new one is built and tested, then an alias switches. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| BM25 | The standard lexical ranking function: IDF weights, saturating term frequency and length normalization. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| bonus token | The extra token sampled from the target's last distribution when all draft tokens are accepted. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| boolean mask | A matrix of true and false values. In PyTorch `scaled_dot_product_attention`, true means "may read". | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| bottleneck vector | In early seq2seq models, the one fixed-size vector that had to hold the whole input sentence. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| break-even throughput | The steady tokens per second at which self-hosting costs the same as an API. | [5.7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) |
| breaking change | A change that makes old implementations fail or behave wrongly. | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| bridge sentence | Your first sentence that links a new question to what you said before. | [8.6](/notes/ai/llm-systems/08-interview-drills/l6-mock-interview) |
| broadcasting | The rule that lets an operation combine tensors of different shapes by repeating size-1 axes. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| burn rate | How fast the service spends its error budget, relative to the SLO. A burn rate of 1 spends the budget in exactly one period. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| burstiness | In `vllm bench serve`, a number that makes arrivals more clustered (below 1) or more regular (above 1). | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| byte | 8 bits. Memory addresses count bytes. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| bytes per token | The KV cache memory that one token holds over all layers. | [8.5](/notes/ai/llm-systems/08-interview-drills/l5-formula-sheet) |
| cache hit | A block hash found in the cache. Its KV values are reused and not recomputed. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| cache layer | The part of the cache for one transformer layer: one K tensor and one V tensor. | [3.4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) |
| cache read price | The price of input tokens that the provider reads from its prompt cache. | [5.7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) |
| cache salt | A secret string mixed into the first block hash so that only requests with the same salt can share blocks. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| cache-aware routing | Sending a request to the server replica that most likely holds its prefix in cache. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| `cacheScope` | `"public"` or `"private"`. It says whether a shared cache may reuse a result across users. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| calibration data | A small set of example inputs used to measure activations when choosing scales. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| `CallToolResult` | The result of `tools/call`: `content`, optional `structuredContent`, optional `isError`, and `resultType` in 2026-07-28. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| canary | A new version that receives a small share of real traffic first. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| cancellation | A signal that the client no longer wants the result of a request. | [7.10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) |
| capability | A declared feature, for example "this server offers tools". Each side uses only the features that the other side declared. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| capability negotiation | Each side declares its capabilities in the handshake, and both sides use only declared features. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| causal mask | The matrix that blocks every query from the keys of later tokens. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| change data capture (CDC) | Reading the inserts, updates and deletes of a data source as a stream of change records. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| changelog | The official list of changes of one revision, with PR or SEP numbers. | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| chat template | A text pattern that turns a list of chat messages into one prompt string with special tokens. Each model has its own template. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| chunk | One piece of a document that is embedded and retrieved as a unit. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| chunk size $C$ | The maximum length of a chunk, in tokens unless stated otherwise. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| chunked prefill | Splitting a long prompt into pieces and prefilling one piece per step. | [3.2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) |
| circuit breaker | A switch in the client that stops calls to a failing dependency for a while. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| citation | A reference in the answer, such as `[S2]`, to the source label that supports a claim. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| citation precision | The share of citations that are needed to support their statement. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| citation recall | The share of answer statements that are fully supported by their own citations. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| client | The application that wants access. In MCP, the MCP client inside the host. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| client feature | Something a client offers to servers: elicitation, and in older or deprecated form, sampling and roots. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| Client ID Metadata Document (CIMD) | A JSON document at an HTTPS URL. The URL itself is the client's `client_id`. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| closed model | A model whose weights the developer does not publish. You can use it only through an API. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| closed object | An object schema with `additionalProperties: false`. Unknown keys are invalid. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| cloud provider | A company that rents computers, storage and networks in its data centers, for example AWS, Azure or Google Cloud. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| cluster | A group of machines that Kubernetes manages as one system. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| codebook | The list of $k^*$ centroids of one sub-vector space. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| Cohen's kappa | Agreement between two raters, corrected for the agreement expected by chance. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| cold start | The time from "start a replica" to "the replica serves requests". | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| column-parallel linear | A linear layer whose weight columns (outputs) are split over GPUs. Each GPU produces a slice of the output. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| community summary | In GraphRAG, an LLM-written summary of a group of closely connected entities in a graph built from the corpus. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| completion | Suggestions for an argument value while the user types: `completion/complete`. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| component | One number inside a vector. $a_i$ is component $i$ of vector $a$. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| compute-bound | Limited by arithmetic speed, not by memory traffic. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| concatenate | Put the head outputs side by side again: $[B, H, T, d_h] \to [B, T, H \cdot d_h]$. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| concatenation | Joining tensors end to end along one axis. A dynamic cache grows this way. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| concurrency | The number of requests inside the system at one moment: waiting plus running. | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| condensation | Rewriting the latest chat message plus the history into one standalone search query. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| conformance tests | Automated test scenarios that check an SDK against the specification. | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| confused deputy | A trusted service that an attacker tricks into using its own authority for the attacker. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| connector | A component that reads documents and their permissions from one source system, such as a wiki or a file share. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| consistent hashing | A way to map keys to replicas so that adding a replica moves only a small share of the keys. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| constrained decoding | Sampling where a mask removes every token that would break a required format. Also called structured output or guided decoding. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| content block | One item of `content`: text, image, audio, a resource link or an embedded resource. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| content hash | A fingerprint of a text, for example SHA-256. It changes when the text changes. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| `Content-Type` | The header that names the format of a body, for example `application/json` or `text/event-stream`. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| context | The other tokens around a token. They decide its meaning. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| context assembly | Choosing, labeling, ordering and packing the retrieved chunks into the prompt. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| context length | The number of tokens whose keys and values a sequence has in the KV cache. | [4.3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) |
| context parallelism | The sequence (time) dimension is split over GPUs, for long prompts or a large KV cache. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| context recall | The share of the reference answer's claims that the retrieved context supports. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| contextual knowledge | Facts given to the model in the context window for this call, such as retrieved chunks. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| contextual representation | A hidden state of a token that also carries information from its context. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| contextual retrieval | Adding a short, LLM-written context to each chunk before embedding and keyword indexing. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| contiguous | Stored in plain row-major order with no gaps, so the strides follow from the shape. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| continuous batching | Decide the batch again at every step: finished requests leave and waiting requests join. Also called iteration-level scheduling or in-flight batching. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| contrastive learning | Training that pulls the vectors of matching pairs together and pushes non-matching vectors apart. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| control plane | The programs that store the desired state and act on it: the API server, the scheduler and the controllers. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| conversation state | The messages, tool calls and tool results of a chat. The host keeps it. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| convex combination | Fusion by a weighted sum of normalized scores: $\alpha \cdot \text{dense} + (1 - \alpha) \cdot \text{lexical}$. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| core maintainers | The group that steers the specification and approves SEPs. | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| correction token | The token sampled from the residual distribution at the first rejected position. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| cosine similarity | The dot product divided by the product of the two norms. It equals $\cos\theta$ and ranges from −1 to 1. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| cost coefficient $c$ | The time of one draft forward pass divided by the time of one target forward pass. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| CPU | The general-purpose processor: a few strong cores, built to finish one task fast. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| cross-attention | Attention where the model computes the queries from one sequence, and the keys and values from another. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| cross-encoder | A model that reads the query and one document together and outputs one relevance score. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| cross-entropy loss | The average of $-\ln p$ of the true next token over all positions. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| cross-layer attention (CLA) | An architecture where adjacent layers share one set of keys and values. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| CUDA graph | A recorded sequence of GPU kernel launches that can be replayed with one call. It removes CPU launch overhead in decode. | [4.10](/notes/ai/llm-systems/04-inference/l10-serving-engines) |
| CUDA graph capture | Recording the kernel launches of common batch sizes so that decode can replay them with little CPU work. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| CUDA toolkit | NVIDIA's libraries and compiler for GPU programs. The serving image contains its runtime parts. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| cursor | An opaque string that names a position in a list. The client sends it back to get the next page. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| custom metric, external metric | Metrics that are not CPU or memory. The HPA reads them from the APIs `custom.metrics.k8s.io` and `external.metrics.k8s.io`. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| Custom Model Import | A Bedrock feature that serves your own weights of a supported architecture, billed per minute of active model copies. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| Custom Model Unit (CMU) | The billing unit of Custom Model Import. Larger models need more CMUs per copy. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| $d$ | The model width: the length of each hidden state. The paper writes $d_{model}$. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| $d_h$ | The head dimension: the number of entries in one key vector or one value vector. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| $d_k$ | The length of each query vector and each key vector in one head. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| $d_v$ | The length of each value vector in one head. In Llama, $d_k = d_v = d_h = 128$. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| DaemonSet | An object that runs one copy of a Pod on every node (or on every matching node). | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| data parallelism (DP) | Several full copies (replicas) of the model. Each serves different requests. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| data poisoning | Placing crafted documents in the corpus so that retrieval returns them for chosen questions. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| data residency | A rule that data must stay inside a named country or area. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| data zone | A Microsoft-defined area for processing: US, EU or Asia Pacific. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| datamarking | A spotlighting method that inserts a special marker between the words of untrusted text. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| DCG | Discounted cumulative gain: the sum of each result's gain divided by a discount that grows with its rank. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| decode | The second phase: one new token per step, which reads the whole KV cache. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| decode step | One forward pass for one new token. It computes one query, one key and one value per layer and head. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| decoder | The part of a model that generates the output tokens one at a time. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| decorator | A Python line such as `@mcp.tool()` above a function that registers the function. | [7.13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) |
| decoupled RoPE key $k^R$ | A small extra key in MLA that carries the RoPE rotation. All heads share it. It has $d_h^R$ numbers (64 in DeepSeek-V2 and V3). | [3.5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| deep dive | An interview that follows one topic down several levels instead of asking a list of unrelated questions. | [8.6](/notes/ai/llm-systems/08-interview-drills/l6-mock-interview) |
| `$defs` | A place inside a schema for named subschemas that other parts reuse. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| dense retrieval | Retrieval by embedding similarity (lessons [L2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) and [L4](/notes/ai/llm-systems/06-rag/l4-vector-indexes)). | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| Deployment | An object that keeps a number of identical Pods running and replaces them step by step on an update. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| deployment type | Microsoft Foundry's choice of billing and data-processing area, for example Global Standard or Data Zone Provisioned. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| deprecation window | The minimum time a Deprecated feature must keep working: at least 12 months. | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| dequantization | Turning the codes back into real numbers: code times scale (minus a zero-point). | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| detokenization | Turning token IDs back into text. Incremental detokenization does it piece by piece while tokens arrive. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| device plugin | A program on each node that tells Kubernetes which special devices, such as GPUs, the node has. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| dialect | A version of JSON Schema, named by a URI in `$schema`. MCP's default dialect is 2020-12. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| digest | A `sha256:` name for one exact image. Unlike a tag, it cannot change. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| dimension | The number of components of a vector. $[1, 0, 1, 0]$ has dimension 4. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| disaggregated serving | Running prefill and decode on different GPU pools and moving the KV cache between them. | [4.10](/notes/ai/llm-systems/04-inference/l10-serving-engines) |
| disaggregation | Prefill and decode run on different GPUs, and the KV cache moves between them. | [8.2](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud) |
| DiskANN | A graph index designed to keep the full vectors on an SSD and only compressed codes in memory. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| DNS rebinding | An attack in which a web page makes the browser send requests to a server on your own machine. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| dot product | The sum of the products of matching components. One number. Written $a \cdot b$. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| down-projection $W^{DKV}$ | The matrix that maps a hidden state to the latent vector. | [3.5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| draft (draft model) | A cheap source of guesses. Its next-token distribution is $q$. It can be a small model, extra heads, or a text lookup. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| draft tokens | The tokens the draft proposes in one step. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| Draft, Current, Final | Revision states: in progress, the one to use (may still get compatible changes), and frozen. | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| dtype | The number format of the elements, for example BF16 (2 bytes each) ([L4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory)). | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| dual-era | An implementation that speaks both 2025-11-25 (with `initialize`) and 2026-07-28 (stateless). | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| dual-era server | A server that answers both the 2026-07-28 per-request protocol and the older `initialize` handshake. | [7.13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) |
| dynamic batching | Wait a short time to collect requests into a batch before running it. It fixes arrival times, not different lengths. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| dynamic cache | A cache that grows by concatenation. Each step makes a new, longer tensor. | [3.4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) |
| EAGLE | A small draft head that reads the target model's hidden features. EAGLE-2 and EAGLE-3 are later versions. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| earliest removal | The first revision released on or after the end of the deprecation window. | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| `efConstruction` | The candidate list size while HNSW inserts a node. Larger gives a better graph and a slower build. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| `efSearch` | The candidate list size during an HNSW query. Larger gives higher recall and slower queries. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| element | One number in a tensor. The number of elements is the product of the shape. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| elicitation | A server asks the user for input through the client, with a form or a URL. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| `ElicitResult` | The client's answer to an elicitation: `action` (`accept`, `decline`, `cancel`) and `content` for an accepted form. | [7.9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) |
| embedding | A vector that a model computes to represent a token or a text. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| embedding lookup | Copy the row of $E$ that belongs to a token ID. No multiplication happens. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| embedding model | A neural network that maps a text to an embedding. Most are transformer encoders. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| embedding model version | The exact model, version, dimensions and input format that produced the vectors of an index. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| embedding table | A matrix $E$ of shape $[V, d]$. Row $i$ is the learned vector of token ID $i$. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| encoder | The part of a model that reads the input text and makes hidden states for it. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| end-to-end latency | The total time of a request: $\mathrm{TTFT} + \mathrm{TPOT} \times (n - 1)$ for $n$ output tokens. | [3.2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) |
| end-to-end latency (E2E) | From sending the request to receiving the last token. | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| endpoint | A URL that accepts inference requests. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| Endpoint Picker (EPP) | The scheduler of the Kubernetes Inference Gateway. It scores replicas and picks one for each request. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| engine core | In vLLM V1, the process that runs the scheduler, owns the KV cache and drives the GPU workers. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| entry | One number in a matrix. $A_{ij}$ is the entry in row $i$ and column $j$. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| entry point | The node where an HNSW search starts: a node in the top layer. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| epsilon $\epsilon$ | A small number added before a square root to avoid division by zero. Llama-3.1 uses $10^{-5}$. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| error budget | The share of events that may fail: 100% minus the SLO. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| error code | An integer that names the kind of failure, for example -32601 "Method not found". | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| error object | The failure part of a response, with an integer `code`, a string `message` and optional `data`. | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| Euclidean distance | The straight-line distance between the tips of two arrows: $\lVert a - b \rVert$. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| evaluation set | A fixed set of test questions with labels: relevant documents, a reference answer, and the question type. Also called a golden dataset. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| eviction | Removing tokens from the cache during generation. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| exact attention | Gives the same result as the formula, up to floating-point rounding. FlashAttention is exact. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| expert parallelism (EP) | The experts of an MoE layer live on different GPUs, and tokens travel to them. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| explicit state handle | A server-minted ID, such as `basket_id`, that a tool returns and later tools take as an argument. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| exponent and bias | The bits that store the power of 2. The stored value minus a fixed bias gives the real power. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| exponential backoff | Waiting longer before each new retry, for example 0.5 s, 1 s, 2 s, 4 s. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| exposure bias | The difference between training on true prefixes and generating from the model's own outputs. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| extension | An optional, opt-in feature outside the core protocol, for example Tasks or MCP Apps. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| external model | A Databricks serving endpoint that forwards requests to a model hosted by another provider. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| extra keys | Other inputs that change the KV values: a LoRA adapter, an image, a cache salt, prompt embeddings. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| failover | Sending traffic to another replica, region or provider when the first one fails. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| faithfulness | The share of the answer's claims that the retrieved context supports. Also called groundedness. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| fallback | A second way to answer when the first fails: another region, provider or model. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| FCFS | First come, first served: the default scheduling policy of vLLM. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| feature lifecycle | The states Active, Deprecated and Removed of a single feature (SEP-2596). | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| fine-tuning | Further training of a model on new examples. It changes the weights. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| finish reason | The field that tells the client why generation ended, for example `stop` or `length`. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| finite-state machine (FSM) | A machine with a fixed set of states and transitions. It can check regular expressions. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| fixed cost | A cost that does not change with traffic, for example a GPU rented by the hour. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| Flash-Decoding (split-KV) | For decode, split the keys and values of one sequence into chunks, process the chunks in parallel, then merge the results. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| FlashAttention | An exact attention kernel that keeps tiles of the scores in on-chip SRAM and never writes the $T \times T$ matrix to HBM. | [8.1](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention) |
| flat index (exact search) | An index that compares the query with every stored vector. It always returns the true k-NN. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| floating-point format | A number stored as a sign, an exponent and a mantissa. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| FLOP | One floating-point operation: one addition or one multiplication. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| FLOP/s | Floating-point operations per second: the arithmetic speed of a chip. | [3.2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) |
| FLOP/s, TFLOPS | Floating-point operations per second. 1 TFLOPS $= 10^{12}$ FLOP/s. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| FLOPs (count) | The number of floating-point operations that a computation needs. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| form mode | Elicitation with a small JSON Schema. The client shows a form and returns the data. | [7.9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) |
| format checker | A validator option that makes `format` an assertion. Without it, `format` is only an annotation. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| forward compatibility | NVIDIA's `cuda-compat` package. It lets a newer CUDA run on an older driver, on supported GPUs. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| Foundation Model APIs | Databricks-hosted open models, served pay-per-token or with provisioned throughput. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| FP8 | An 8-bit number format: 1 byte per number. It needs a scale factor to keep values in range. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| FP8 (E4M3, E5M2) | 8-bit floating-point formats with 4 or 5 exponent bits. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| FP8 E4M3, E5M2 | 8-bit floating-point formats: 4 exponent bits and 3 mantissa bits, or 5 and 2. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| framing | The rule that says where one message ends. stdio uses a newline. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| free block queue | The list of blocks that no request uses, in eviction order. Cached blocks stay in it with their content until reused. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| frequency penalty | Subtracts `frequency_penalty` × (count of the token in the output so far) from its logit. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| freshness lag | The time between a change in the source and the moment that the change is searchable. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| full block | A block whose 16 token slots are all filled. Only full blocks get a hash in vLLM's standard case. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| fusion | Merging several ranked lists into one. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| gate, up, down projections | The three MLP matrices of Llama: $W_{gate}$ and $W_{up}$ ($4096 \to 14336$) and $W_{down}$ ($14336 \to 4096$). | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| GEMM | "General matrix-matrix multiplication", the standard name of $C = AB$ in numerical libraries. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| GEMV | "General matrix-vector multiplication": a matrix times one vector. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| generation stall | Sarathi-Serve's name for a pause in a request's decoding while a prefill runs in between. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| generator | The language model that writes the answer from the query and the retrieved passages. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| GGUF | The single-file model format of llama.cpp, with metadata and block-quantized tensors. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| goodput | The rate of requests that meet the SLO. DistServe defines it per GPU, at a target SLO attainment such as 90%. | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| GPTQ | A PTQ method that quantizes weights one column at a time and corrects the remaining weights to cancel the error. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| GPU | A processor with thousands of simple arithmetic units, built to finish many identical tasks per second. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| GPU instance | A VM type with GPUs attached, for example AWS `p5.48xlarge` with 8 H100 GPUs. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| GPU memory | The memory on the GPU board (HBM or GDDR). Weights and the KV cache must be here during inference. | [5.2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) |
| GPU-hour | One GPU used for one hour. Cloud VMs are priced per VM-hour, and a VM can hold 1 or 8 GPUs. | [5.7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) |
| `gpu_memory_utilization` | The vLLM setting for the fraction of GPU memory that one engine may use. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| GQA | Grouped-query attention: groups of query heads share one KV head. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| GQA group size | Query heads per KV head: $g = H / H_{kv}$. 4 for Llama-3.1-8B, 8 for Llama-3.1-70B. | [4.3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) |
| graceful degradation | Giving a reduced but useful service under overload, instead of failing completely. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| graceful shutdown | Stopping a server so that requests in progress finish (drain) before the process exits. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| graded relevance | Relevance labels with levels, for example 0 (not relevant) to 3 (fully answers). | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| granularity | How many numbers share one scale: per-tensor, per-channel, per-group, per-token, per-block. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| greedy decoding | Always choose the token with the highest logit. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| groundedness | The share of the answer's claims that the context supports. RAGAS calls it faithfulness. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| grounding | Making an answer depend on given source text, so that each claim can be checked against that text. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| group size $G$ | The number of query heads that share one KV head: $G = H / H_{kv}$. | [3.5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| grouped-query attention (GQA) | A design where a group of query heads shares one KV head. Llama-3.1-8B has 8 KV heads for 32 query heads. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| GSU | Generative AI scale unit: Google's unit for ordering Provisioned Throughput. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| $H$ | The number of query heads in one layer. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| $H_{kv}$ | The number of KV heads in one layer. Equal to $H$ in MHA, smaller in GQA, 1 in MQA. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| hallucination | Fluent model output that no source supports, for example an invented policy or citation. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| handle | An ID that a server returns from one tool and accepts in later calls, so that state survives without a session. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| hard negative | A negative that looks relevant but is not, for example a close BM25 match. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| hash chain | The sequence of block hashes of one request. Each hash includes the one before it, so a hash identifies the whole prefix up to that block. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| HBM | High Bandwidth Memory: the GPU's main memory, stacked next to the chip. 80 GB on an H100 SXM. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| head | One independent copy of scaled dot-product attention, with its own query, key and value projections. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| head dimension $d_h$ | The length of one head's query, key and value vectors. Usually $d_h = d/H$. L3 calls it $d_k$. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| header path | The list of headings above a chunk, for example "Returns policy > Laptops". | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| health endpoint | An HTTP path that reports whether the server works. vLLM's is `GET /health`. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| heavy hitter | A token with a large accumulated attention score (the term of the H2O paper). | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| hidden state | The vector of one token at one point inside the model. All hidden states of a sequence form a matrix of shape $[T, d]$. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| hit rate | Cached prompt tokens divided by all prompt tokens. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| hit rate@k | 1 if at least one relevant document is in the top $k$, else 0, averaged over questions. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| HMAC | A keyed hash that detects any change to data without hiding it. | [7.9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) |
| HNSW | Hierarchical navigable small world: a graph index with several layers, searched greedily from the top layer down. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| hook | The last words of an answer that invite the next question. | [8.6](/notes/ai/llm-systems/08-interview-drills/l6-mock-interview) |
| Horizontal Pod Autoscaler (HPA) | The Kubernetes controller that sets the replica count of a Deployment from metrics. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| host | The AI application that the user runs, for example a chat app, an IDE or your own agent. It creates and manages MCP clients. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| HPA | The Kubernetes Horizontal Pod Autoscaler: $\lceil \text{current} \times \text{metric}/\text{target} \rceil$ replicas. | [8.2](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud) |
| HTTP header | A `Name: value` line in a request or response. Header names are case-insensitive. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| HTTP request | A method (POST, GET, DELETE), a path, headers and an optional body, sent from a client to a server. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| Hugging Face Hub | A public registry of models and datasets. Gated models need an access token. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| hybrid retrieval | Running dense and lexical retrieval for the same query and merging the results. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| HyDE | Hypothetical Document Embeddings: an LLM writes fake answer documents, and the system searches with their averaged embedding. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| `id` | The number or string that ties a response to its request. MCP forbids `null`. | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| IDCG | The DCG of the ideal ranking: all judged relevant documents sorted by grade. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| idempotent | An operation that has the same effect if it runs once or twice. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| IDF | Inverse document frequency: a weight that is high for rare terms and near zero for common ones. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| image layer | One set of file changes inside an image. Layers download and unpack separately. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| `Implementation` | The identity object: `name`, `version`, and optional `title`, `description`, `icons`, `websiteUrl`. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| in-batch negatives | Using the positives of the other pairs in the same training batch as negatives. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| incremental sync | Updating the index by processing only new, changed and deleted documents. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| index alias | A stable name, such as `docs-current`, that refers to one physical index version and can be switched. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| indexing pipeline | The offline part of RAG: parse, chunk, embed and store documents. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| indirect prompt injection | Prompt injection that arrives inside external content, such as a web page, a file or a retrieved chunk. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| inference component | A SageMaker AI object that places one model on an endpoint with its own resources and scaling. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| inference engine | The program that loads the weights and serves requests with batching and a KV cache, for example vLLM. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| inference profile | A Bedrock resource that names a model and the regions to which requests can go. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| InferencePool | A resource of the Gateway API Inference Extension: a group of model server Pods behind an endpoint picker. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| InfoNCE | The contrastive loss: cross-entropy over one positive and many negatives, with similarities divided by a temperature. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| ingestion | The offline process that turns source files into indexed chunks: connect, parse, clean, chunk, enrich, deduplicate, embed, write. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| `initialize` | The first request of a connection. The client sends its protocol version, capabilities and identity. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| `InitializeResult` | The server's answer to `initialize`: the chosen protocol version, the server capabilities, the server identity and optional instructions. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| inner dimension | The shared size $k$ in $(m \times k)(k \times n)$. It must match. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| `inputRequests` | A map from a server-chosen key to an elicitation, sampling or roots request object. | [7.9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) |
| `InputRequiredResult` | A result with `resultType: "input_required"`, optional `inputRequests` and optional `requestState`. | [7.9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) |
| `inputResponses` | A map from the same keys to the client's results, sent in the retry. | [7.9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) |
| `inputSchema` | The JSON Schema that the `arguments` of a call must match. Its root must have `"type": "object"`. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| instance | The JSON value that is checked, for example the `arguments` of a tool call. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| instance type | A cloud VM size with a fixed number and model of GPUs, for example `p5.48xlarge`. | [5.2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) |
| `instructions` | Optional text from the server that tells the host how to use it, for example in the system prompt. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| integer format (INT8, INT4) | A whole number stored in 8 or 4 bits. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| inverted index | A map from each term to the list of documents that contain it, with counts. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| IO-aware | Designed to minimize reads and writes between memory levels, not only FLOPs. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| `isError` | A boolean in the result. `true` means that the tool ran and failed. If it is absent, it counts as `false`. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| issuer | The identifier URL of an authorization server. The `iss` value. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| iteration-level scheduling | Orca's name for continuous batching: the scheduler runs "only a single iteration of the model on the batch" at a time. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| ITL | Inter-token latency. The gap between two consecutive streamed outputs of one request. | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| IVF | An index that clusters vectors with k-means and scans only the `nprobe` nearest clusters. | [8.3](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag) |
| IVF (inverted file index) | An index that groups vectors into cells around centroids and scans only the cells nearest to the query. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| Jaccard similarity | The size of the intersection of two sets divided by the size of their union. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| Jacobian | The table of all partial derivatives of the outputs of a function with respect to its inputs. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| jitter | A random part of the wait, so that many clients do not retry at the same moment. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| JSON | JavaScript Object Notation: a text format for data with four primitive types and two structured types. | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| JSON array | An ordered list of values in brackets, for example `[1, 2, 3]`. | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| JSON object | An unordered set of name-value pairs in braces, for example `{"plant": "B"}`. | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| JSON Pointer | A path into a JSON document, such as `/$defs/money` (RFC 6901). | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| JSON Schema | A JSON document that describes which JSON values are allowed. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| JSON-RPC 2.0 | The small message standard that MCP uses: requests with an ID, responses with the same ID, and notifications with no ID (lesson [L2](/notes/ai/llm-systems/07-mcp/l2-json-rpc)). | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| k-means | A clustering method. Assign each vector to its nearest centroid (a group's mean vector), move each centroid to the mean of its vectors, repeat. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| k-nearest neighbors (k-NN) | The $k$ stored vectors closest to a query vector. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| $k_1$, $b$ | BM25 parameters for term-frequency saturation and length normalization. Lucene uses 1.2 and 0.75. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| KB, MB, GB | Decimal units: $10^3$, $10^6$, $10^9$ bytes. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| KEDA | Kubernetes Event-driven Autoscaling. It feeds external metrics to an HPA and can scale a workload to zero. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| kernel | A function that runs on the GPU. One kernel launch starts a grid of thread blocks. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| kernel fusion | Doing several steps in one kernel, so the data between the steps never returns to HBM. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| key | The vector that says "this is what I contain". Queries are compared with keys. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| keyword | One property of a schema, such as `type` or `maximum`. Each keyword checks one thing or adds one note. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| KiB, MiB, GiB | Binary units: $2^{10} = 1024$, $2^{20}$, $2^{30}$ bytes. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| knowledge conflict | A disagreement between two sources, or between a source and the model's parametric knowledge. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| knowledge cutoff | The date after which the training data has no information. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| Kubernetes | Open-source software that runs containers on a group of machines and keeps them running. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| KV block | A fixed-size piece of the KV cache: the keys and values of 16 tokens (vLLM's default), for all layers. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| KV cache | The stored keys and values of all earlier tokens, per layer and head. Decode steps read it. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| KV cache block | A fixed group of token slots in the paged KV cache. The default block size in vLLM is 16 tokens. | [5.2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) |
| KV cache memory | Keys and values of all tokens of all running requests, in every layer. | [5.2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) |
| KV cache usage | The fraction of KV cache blocks in use. In vLLM: `vllm:kv_cache_usage_perc`, where 1 means 100%. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| KV head | One set of key and value projections. In MHA, each query head has its own KV head. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| KV offloading | Moving KV blocks from GPU memory to CPU memory, disk or a remote store, to reuse them later. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| KV transfer | Moving a request's KV cache from a prefill instance to a decode instance. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| $L$ | The number of layers. Each layer has its own keys and values. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| L2 cache | On-chip memory shared by all SMs. 50 MB on an H100 SXM. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| L2 normalization | Dividing a vector by its length, so that its length becomes 1. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| label, selector | A key-value tag on an object, and a filter that chooses objects by their labels. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| Language Server Protocol (LSP) | A protocol between code editors and language servers. MCP took its inspiration from it. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| `Last-Event-ID` | The header that resumes an SSE stream after the last event the client received. Removed in 2026-07-28. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| late interaction | Storing one vector per document token and comparing query tokens with document tokens at query time. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| latency | The delay before the first byte of a request arrives. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| latency budget | The planned share of the total response time for each stage of the read path. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| latent vector $c^{KV}$ | The compressed vector of one token in MLA. It has $d_c$ numbers. DeepSeek-V2 and V3 use $d_c = 512$. | [3.5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| lax coercion | Pydantic's default behavior of converting input, for example the string `"7"` to the integer 7. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| layer | One transformer block: attention plus an MLP. Llama-3.1-8B has $L = 32$ layers. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| LayerNorm | A normalization that subtracts the mean and divides by the standard deviation, then multiplies by a learned gain. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| LeaderWorkerSet | A Kubernetes API that deploys a group of Pods (a leader and workers) as one unit, for multi-node inference. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| learned positional embedding | A trained table with one vector per position, added to the input (GPT-2). | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| least outstanding requests | A routing rule: send the request to the replica with the fewest requests in progress. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| left padding | Padding placed before the real tokens. Generation with decoder-only models needs it. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| legacy, modern, dual-era | Handshake revisions (2025-11-25 and earlier), per-request revisions (2026-07-28 and later), and implementations that speak both. | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| level | The depth of a question: 1 definition, 2 mechanism, 3 formula and numbers, 4 implementation, 5 scale, limits and recent changes. | [8.1](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention) |
| lexical (sparse) retrieval | Retrieval by exact terms, with an inverted index. A document is a sparse vector over the vocabulary. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| lifecycle | The three phases of an MCP connection in 2025-11-25: initialization, operation, shutdown. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| linear layer | A neural network layer that computes $y = xW + b$. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| linear map | A function $f(x) = xW$. It keeps sums and scalings: $f(ax + by) = af(x) + bf(y)$. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| `listChanged` | A sub-capability: the server sends a notification when its list of tools, prompts or resources changes. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| listwise reranking | An LLM reads several candidates at once and outputs their order. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| Little's law | $L = \lambda W$: average concurrency equals arrival rate times average time in the system. | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| LLM-as-a-judge | Using an LLM with a rubric to grade answers or to check claims. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| LM head | The last linear layer. It converts a hidden state of $d$ values into $V$ logits. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| LMI container | Large Model Inference container: AWS images that run vLLM or TensorRT-LLM on SageMaker AI. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| load balancer | A component that spreads incoming requests over replicas. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| local layer, global layer | A layer with a sliding window, and a layer with full attention. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| local minimum | A node whose neighbors are all farther from the query than itself, but which is not the true nearest node. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| log level | One of eight syslog severities from `debug` to `emergency` (RFC 5424). | [7.10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) |
| logit | The raw score of one vocabulary token for the next position. Any real number. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| logit bias | A number added to the logit of a chosen token ID. A large negative bias bans the token. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| logprob | The natural logarithm of a token's probability. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| logsumexp $L$ | $L = m + \log \ell = \log \sum_j e^{s_j}$. One number per row, kept for the backward pass. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| long-context prompting | Putting a whole knowledge base into the prompt on every call, with no retrieval. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| lossless | The output is exactly the same as with the full cache. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| lossy | The output can change, because information was rounded or removed. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| LRU (least recently used) | The eviction rule: take the block that was used the longest time ago. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| LSTM | Long short-term memory. An RNN with gates that help it keep information for more steps. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| `M` | The number of links that each new HNSW node gets per layer. Layer 0 allows up to $2M$. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| machine epsilon | The gap between 1 and the next larger representable number. It measures relative precision. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| managed compute | The platform runs a model on GPUs that only you use. You pay per GPU hour. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| manifest | A table with one row per source document: its content hash, version, chunk IDs and the time it was indexed. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| mantissa (fraction) | The bits after the binary point of the significant digits. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| marginalization | Summing a probability over all values of a hidden choice, here: which passage the answer used. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| matrix | A rectangular table of numbers with rows and columns. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| matrix multiplication (matrix-matrix product) | $C = AB$: entry $C_{ij}$ is the dot product of row $i$ of $A$ and column $j$ of $B$. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| matrix-matrix product | Many input rows multiplied by one weight matrix at once. Each weight is used once per row. | [3.2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) |
| matrix-vector product | A matrix times a vector. Each output number is one dot product. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| Matryoshka embedding | An embedding trained so that its first $m$ values are also a good, shorter embedding. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| `max_model_len` | The longest request (prompt plus output tokens) that the server accepts. | [5.2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) |
| `max_num_batched_tokens` | The largest number of tokens that one engine step processes. It also sets the size of the memory profiling run. | [5.2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) |
| `max_num_seqs` | The maximum number of requests in one step in vLLM. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| MaxSim | ColBERT's score: for each query token, the best similarity with any document token, summed over query tokens. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| `mcp` | The official MCP Python SDK package on PyPI. Version 2.3.0 on 2026-10-15. | [7.13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) |
| MCP client | A connector inside the host. Each client talks to exactly one MCP server. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| MCP endpoint | The single HTTP path of an MCP server, for example `https://example.com/mcp`. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| MCP Inspector | The reference developer tool for MCP servers, with a web, a CLI and a terminal client. | [7.13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) |
| MCP server | A program that offers tools, resources or prompts to clients over MCP. It can be a local process or a remote service. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| `Mcp-Method`, `Mcp-Name` | The 2026-07-28 headers that copy the method and the tool, prompt or resource name from the body. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| `MCP-Protocol-Version` | The HTTP header with the protocol revision of a request. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| `Mcp-Session-Id` | The 2025-11-25 HTTP header that carries the session ID. Removed in 2026-07-28. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| `MCPServer` | The high-level server class of SDK v2. It was called `FastMCP` in v1. | [7.13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) |
| mean pooling | Averaging the key (or value) projection matrices of the heads in a group into one matrix. | [3.5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| Medusa heads | Extra output heads on the target model that predict tokens 2, 3, ... positions ahead. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| memory bandwidth | Bytes per second that move between HBM and the compute units. About 3.35 TB/s on an H100 SXM. | [3.2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) |
| memory traffic | The bytes that move between HBM and the compute units. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| memory-bound | Limited by memory traffic, not by arithmetic. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| memory-bound, compute-bound | Limited by bytes per second, or limited by FLOPs per second. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| `_meta` | A reserved object inside params and results for protocol metadata. In 2026-07-28 every request needs it. | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| meta-schema | The schema that every schema of a dialect must match. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| metadata | Fields stored with each chunk: source, section, page, dates, version, access list, hashes. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| method | The name of the operation, for example `tools/call`. | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| MFU | Model FLOPs utilization: achieved useful FLOP/s divided by peak FLOP/s. | [4.3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) |
| MHA | Multi-head attention: every query head has its own KV head. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| micro-batch | A slice of the batch that moves through the pipeline as one unit. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| min-max normalization | Rescaling the scores of one list so that its lowest is 0 and its highest is 1. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| min-p | Keep only tokens whose probability is at least `min_p` times the top probability. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| MinHash | A short signature of a set. The share of equal signature positions estimates the Jaccard similarity. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| minor version compatibility | A CUDA rule: an application built with CUDA 13.x runs on any driver of version 580 or newer. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| mixture of experts (MoE) | A layer with many MLPs (experts). A router sends each token to a few of them. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| MLA | Multi-head latent attention: the cache stores one compressed latent vector and one small RoPE key per token and layer. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| MLP (feed-forward network) | The per-token sub-layer: two or three weight matrices with a nonlinear function between them. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| mock interview | A full practice interview with a timer, a script and a score. | [8.6](/notes/ai/llm-systems/08-interview-drills/l6-mock-interview) |
| Model Context Protocol (MCP) | An open protocol that standardizes how AI applications connect to programs that offer tools, data and prompt templates. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| Model Garden | The model catalog of Google's Agent Platform. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| model runner | The part of a worker that prepares inputs and calls the model for one step. | [4.10](/notes/ai/llm-systems/04-inference/l10-serving-engines) |
| model supply chain | Every step from the model author to your GPU: files, containers, signatures and their checks. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| model unit (MU) | Amazon Bedrock's unit of provisioned throughput: a fixed number of input and output tokens per minute. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| model width $d$ | The number of values in each token vector inside the model. For Llama-3.1-8B, $d = 4{,}096$. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| MQA | Multi-query attention: $H_{kv} = 1$. | [3.5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| MRR | Mean reciprocal rank: the average reciprocal rank over the questions. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| MRTR | Multi Round-Trip Requests: the server returns `input_required`, and the client retries with `inputResponses`. | [8.4](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp) |
| MTEB | The Massive Text Embedding Benchmark and its leaderboard. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| MTok | One million tokens. API prices are in USD per MTok. | [5.7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) |
| Multi Round-Trip Request (MRTR) | The 2026-07-28 pattern: the server returns a request for input, and the client retries the original request with the answers. | [7.9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) |
| Multi Round-Trip Requests (MRTR) | The 2026-07-28 pattern: the server returns `input_required` with `inputRequests`, and the client retries with `inputResponses`. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| multi-head attention (MHA) | Attention with $H$ heads, where each head has its own keys and values. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| multi-hop question | A question whose answer needs two or more facts, where finding one fact needs another fact first. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| multi-query attention (MQA) | GQA with only one KV head for all query heads. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| multi-query retrieval | Writing several variants of the query, retrieving for each variant, and fusing the result lists. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| multi-token prediction (MTP) | Extra modules trained with the model to predict a later token. DeepSeek-V3 uses one MTP module, and engines use it as a draft. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| N × M problem | The cost of writing one custom integration for every pair of N applications and M services. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| n-gram (prompt lookup) drafting | Drafting by copying the tokens that followed an earlier match of the last few tokens in the prompt or the output. No model needed. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| NaN | "Not a number": the result of an undefined operation, such as $0/0$. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| NCCL | NVIDIA Collective Communications Library: the standard library for all-reduce and other collectives on NVIDIA GPUs. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| nDCG | DCG divided by IDCG, so 1 is a perfect ranking. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| negative | A text that does not match the query. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| next-token prediction | The training task: at each position, predict the token that follows. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| `nlist` | The number of IVF cells. pgvector calls it `lists`. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| `nn.Linear` | The PyTorch layer that computes $y = x W^\top + b$. It stores its weight with the shape [out, in]. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| node | One machine (a VM) in the cluster. The `kubelet` agent on it starts and stops containers. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| node pool | A group of identical nodes, for example all `g6e.xlarge` machines. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| non-parametric memory | Knowledge stored outside the model, for example in a document index. You can change it at any time. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| non-torch memory | GPU memory that PyTorch does not track, for example the CUDA context and NCCL communication buffers. | [5.2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) |
| norm (L2 norm, length) | The length of the arrow: the square root of the sum of the squared components. Written $\lVert a \rVert$. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| normal and subnormal number | A normal number has a hidden leading 1. A subnormal number fills the gap near zero with a leading 0. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| normalization | Division of a vector by its norm. The result is a unit vector with the same direction. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| notification | A request without an `id`. The receiver never answers it. | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| `notifications/initialized` | The notification that the client sends after the `InitializeResult`, to say "ready for normal operation". | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| `notifications/progress` | The notification that carries `progressToken`, `progress`, an optional `total` and an optional `message`. | [7.10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) |
| `nprobe` | The number of cells that an IVF query scans. pgvector calls it `ivfflat.probes`. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| number of heads $H$ | How many heads run in parallel in one layer. Llama-3.1-8B has $H = 32$. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| NVFP4, MXFP4 | 4-bit floating-point formats (E2M1) with a shared scale per block of 16 or 32 values. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| NVIDIA Container Toolkit | Host software that makes the GPUs and the driver libraries visible inside a container. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| NVIDIA driver | Kernel software on the host that controls the GPU. It is not inside the container. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| `nvidia.com/gpu` | The resource name that the NVIDIA device plugin advertises. A Pod requests GPUs with it. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| NVLink | NVIDIA's fast GPU-to-GPU link inside a server. 900 GB/s on the H100 SXM datasheet. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| NVLink, PCIe | Links between GPUs (NVLink) and between a GPU and the CPU (PCIe). | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| OAuth 2.1 | A framework for giving a client limited access to a resource, with tokens instead of passwords. MCP uses the IETF draft `draft-ietf-oauth-v2-1-13`. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| object storage | A cloud service that stores files as objects: Amazon S3, Azure Blob Storage, Google Cloud Storage. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| observation window | In SnapKV, the last tokens of the prompt, whose attention selects the tokens to keep. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| OCR | Optical character recognition: turning an image of text into characters. Scanned pages need it. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| offloading | Moving cache data from GPU memory to CPU memory or disk, and back when needed. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| on-demand price | The list price per hour, with no commitment. You can stop at any time. | [5.7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) |
| online signal | A quality measurement taken from live traffic, such as feedback or the rate of empty results. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| online softmax | A way to compute softmax in one pass over the inputs, with a running maximum and a running sum. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| opaque | The client must not parse, build or change the value. Only the server knows its format. | [7.10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) |
| open-weight model | A model whose weights you can download and run yourself, for example Llama-3.1-8B. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| OpenAI-compatible API | An HTTP interface with the same paths and JSON fields as OpenAI's API, for example `POST /v1/chat/completions`. vLLM, SGLang and others offer it. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| operating point | The batch size and context length at which you run the server. It sets both throughput and latency. | [5.7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) |
| oracle context | The correct chunks, given to the generator by hand, to test generation without retrieval errors. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| `Origin` | A request header that browsers send with the site that started the request. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| orthogonal | At a right angle. Two vectors are orthogonal when their dot product is 0. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| outlier | A value much larger than the others. It forces a large scale on its whole group. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| output $O$ | The weighted averages of the values: $O = PV$, shape $[T, d_v]$. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| output projection $W_O$ | The learned $[H d_h, d]$ matrix that mixes the concatenated head outputs into one update of the hidden state. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| `outputSchema` | An optional JSON Schema for the `structuredContent` of the result. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| overflow | A result too large for the format. It becomes infinity, NaN or the maximum value. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| overlap $O$ | The number of tokens that the end of one chunk shares with the start of the next. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| padding | Filler tokens that make sequences of different lengths fit one rectangular tensor. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| PagedAttention | Attention that reads the KV cache from fixed-size blocks through a block table (Kwon et al., SOSP 2023). | [8.1](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention) |
| pagination | Returning a long list in several pages. | [7.10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) |
| parameter | One learned number of a model. Weights and biases are parameters. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| parametric knowledge | Facts stored in the model's weights during training. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| parametric memory | Knowledge stored in the weights (parameters) of a model. Only training can change it. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| params | The inputs of a method. In MCP they are always a JSON object (named parameters). | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| parent-child retrieval | Searching small child chunks but returning their larger parent section to the model. Also called small-to-big. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| parser | Code that extracts text and structure from a file format such as PDF or HTML. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| passage (chunk) | A short piece of a document, the unit that the retriever returns. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| `past_key_values` | The argument and output field that carries the cache object in Hugging Face `transformers`. | [3.4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) |
| path length | The number of steps that information needs to travel from one token to another inside a layer. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| pay-per-token | Billing by the number of input and output tokens. No requests means no cost. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| PCIe | The general expansion bus between GPU and CPU. 128 GB/s (Gen5) on the H100 datasheet. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| per-channel quantization | One scale (and zero-point) for each channel, computed over many tokens. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| per-token quantization | One scale (and zero-point) for each token, computed over its channels. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| percentile | P90 is the value below which 90% of the measurements fall. P50 is the median. | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| permutation equivariance | Reordering the input rows reorders the output rows in the same way, and changes nothing else. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| PersistentVolumeClaim (PVC) | A request for storage that outlives a Pod, for example a shared model cache. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| pickle | Python's object serialization format. Loading a pickle can run any function. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| `ping` | A request with no params that checks that the other side still answers. Removed in 2026-07-28. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| pipe | A one-way byte channel between two processes, managed by the operating system. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| pipeline bubble | Time when a pipeline stage has no work, at the start and the end of a batch. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| pipeline parallelism (PP) | The layers are split into stages on different GPUs. Activations travel from stage to stage. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| pivot | A jump from the current topic to a neighboring topic. | [8.1](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention) |
| PKCE | Proof Key for Code Exchange (RFC 7636). The client proves at the token step that it started the flow. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| Pod | The smallest unit that Kubernetes schedules: one or more containers that share a network address and volumes. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| Poisson process | Random arrivals where the gaps between requests are independent and exponentially distributed. | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| pooling | The step that turns the $T$ token vectors of $H$ into one vector. Common methods: the [CLS] token, the mean, the last token. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| position id | The position of a token in its own sequence (0, 1, 2, ...). RoPE uses it to rotate queries and keys. | [3.4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) |
| position IDs | The position number of each token. RoPE uses it to rotate queries and keys. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| positional encoding | Information about the position of each token. Attention needs it because it ignores order. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| positive | The text that matches a query in a training pair. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| post-filtering | Removing disallowed chunks after the search returned its top $k$. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| post-norm | The normalization is applied after the residual addition. The original transformer used it. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| post-training quantization (PTQ) | Quantizing a trained model without further training. GPTQ, AWQ and SmoothQuant are PTQ. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| PQ | Product quantization: each vector stored as one byte per sub-vector. | [8.3](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag) |
| pre-filter | A permission or metadata filter applied inside the search, not after it. | [8.3](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag) |
| pre-filtering | Applying the permission filter inside the search, so that only allowed chunks can enter the top $k$. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| pre-filtering, post-filtering | Applying a metadata filter before or during the vector search, or after it. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| pre-norm | The normalization is applied to the input of each sub-layer, inside the residual branch. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| precision@k | The share of the top $k$ results that are relevant. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| preemption | Removing a running request to free KV cache memory. It later resumes. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| prefill | The first forward pass over the whole prompt. It computes the keys and values of all prompt tokens. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| prefill-decode disaggregation | Running prefill and decode on different GPUs or machines, and sending the KV cache between them. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| prefix | The start of a token sequence, from token 0 up to some position. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| prefix caching | Keeping the KV cache of earlier requests and reusing it for a later request with the same prefix. vLLM calls its version automatic prefix caching (APC). | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| prefix sharing | Several requests use the same cached blocks for an identical prefix. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| prefix-aware routing | A routing rule that prefers the replica whose KV cache already holds the longest prefix of the prompt. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| presence penalty | Subtracts `presence_penalty` once from the logit of every token that appears in the output so far. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| priority tier | A pay-per-token option at a higher price that gets served first under load. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| PRM | Protected Resource Metadata (RFC 9728): the document that names a server's authorization servers. | [8.4](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp) |
| probe | A check that the kubelet runs on a container: startup, readiness or liveness. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| process | A running program with its own memory. The host starts the stdio server as a child process. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| product quantization (PQ) | Compression that splits a vector into $m$ sub-vectors and stores, for each, the ID of its nearest centroid. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| progress token | A string or integer that the client puts in `_meta.progressToken` to ask for progress notifications for one request. | [7.10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) |
| projection | The "shadow" of one vector on the line of another vector. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| prompt | A template of messages that a server offers and a user picks. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| prompt (MCP prompt) | A message template that a server offers and that the user picks, for example a slash command. Prompts are user-controlled. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| prompt caching (provider) | The API product of model providers that bills reused prefix tokens at a lower price. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| prompt injection | Input that changes the model's behavior in a way that the developer did not intend (OWASP LLM01:2025). | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| `PromptArgument` | One named blank of a prompt: `name`, optional `title`, `description` and `required`. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| `PromptMessage` | One message of a rendered prompt: a `role` (`user` or `assistant`) and one content block. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| `prompts/get` | The request that renders a prompt with string arguments and returns `messages`. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| Protected Resource Metadata (PRM) | A JSON document (RFC 9728) in which a resource server names its authorization servers. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| protocol error | A JSON-RPC `error` response, for example code -32602 for an unknown tool. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| protocol state | What the protocol itself remembers: version, capabilities, subscriptions, pending server requests. In 2025-11-25 it lives in the session. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| protocol version | A revision name such as `"2025-11-25"`. Both sides must speak the same one in a session. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| provisioned throughput | Serving capacity reserved for your model and billed by time or by capacity unit, used or not. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| PTU | Provisioned throughput unit: Microsoft Foundry's unit of reserved model capacity, billed per PTU per hour. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| pushdown automaton (PDA) | A state machine plus a stack. It can check nested structures such as JSON objects inside arrays. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| Pydantic | The Python library that validates data against types. The SDK uses it to build schemas and check arguments. | [7.13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) |
| quantization | Storing values in a format with fewer bits, usually with scale factors. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| quantization scale | The number $s$ that maps a real value to an integer code and back. | [8.5](/notes/ai/llm-systems/08-interview-drills/l5-formula-sheet) |
| quantization-aware training (QAT) | Training with quantization in the loop, so the model learns to tolerate it. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| query | The vector that asks "what do I need?". It belongs to the token that reads. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| query decomposition | Splitting a question into sub-questions and retrieving for each one. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| query drift | A rewritten query that no longer means what the user asked, for example because it dropped a constraint. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| query head | One of the $H$ heads that produce queries. Each query head computes its own attention pattern. | [3.5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| query pipeline | The online part of RAG: process the question, retrieve, rerank, assemble the prompt and generate. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| query routing | Choosing where a query goes: which index, which tool, or no retrieval at all. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| query transformation | Any change to the user's text before retrieval, made to get better search results. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| query vector and key vector | In attention, the vector that asks (query) and the vector that answers (key). Their dot product is the attention score. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| query, key, value | Three vectors that attention computes from each hidden state. A query is compared with keys. The scores weight the values. | [3.1](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists) |
| question chain | A sequence of questions in which each question takes a word from the previous answer and goes one level deeper. | [8.1](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention) |
| queue depth | The number of requests that wait for a batch slot. In vLLM: `vllm:num_requests_waiting`. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| queue time | The time a request waits in the waiting queue before its first step. It is part of TTFT. | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| race condition | Two events whose order nobody controls, for example a cancellation and the final result crossing each other. | [7.10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) |
| radix tree | A tree whose edges are labeled with runs of tokens. SGLang stores its prefix cache in one. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| RadixAttention | SGLang's prefix-caching system built on a radix tree, from the SGLang paper. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| range | The span from the smallest to the largest representable magnitude. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| rank | The number of one GPU process in a group: 0, 1, 2, ... | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| rank (ndim) | The number of axes. A tensor of shape $[2, 3, 4]$ has rank 3. This is not the "rank" of linear algebra. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| re-embedding | Computing new vectors for the whole corpus with a new embedding model. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| read path | The pipeline that answers one query: authentication, retrieval, reranking, generation, checks. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| reading order | The order in which a human reads the text of a page. A PDF does not store it. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| real-time endpoint | A SageMaker AI endpoint on instances that you choose. You pay per instance-hour. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| recall ceiling | The first stage limits the reranker: a document that the first stage did not return cannot reach the final list. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| recall@k | The share of all relevant documents that appear in the top $k$. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| reciprocal rank | 1 divided by the rank of the first relevant result, or 0 if there is none. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| reciprocal rank fusion (RRF) | Fusion that gives each document $\sum 1/(k + \text{rank})$ over the lists that contain it. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| recomputation | Computing the attention matrix again in the backward pass instead of storing it. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| recovery | The steps that turn "I don't know" into a useful answer. | [8.6](/notes/ai/llm-systems/08-interview-drills/l6-mock-interview) |
| recurrent neural network (RNN) | A network that reads tokens one at a time and keeps one hidden state that it updates at each step. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| recursive splitting | Splitting with an ordered list of separators, for example paragraphs, then lines, then sentences, then words. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| redirect URI | The address where the AS sends the browser back with the code. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| reduce-scatter | Every GPU gives a vector, and each GPU receives the sum of one slice. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| `$ref` | A keyword that applies another schema, found by a URI such as `#/$defs/money`. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| reference count | The number of running requests that use a block. A block with reference count 0 can be evicted. | [4.9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) |
| reflection token | In Self-RAG, a special output token that says whether to retrieve, whether a passage is relevant, and whether the output is supported. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| refresh token | A longer-lived credential that buys a new access token without the user. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| region | A geographic area where a cloud provider has data centers, for example an EU region. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| register | The fastest storage, private to one thread. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| rejection sampling | A method to draw samples from one distribution using proposals from another and a random accept test. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| relevance judgment | A label that says how relevant one document is to one question. A set of them is called qrels. | [6.8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) |
| remote procedure call (RPC) | Calling a function that runs in another process or on another machine, by sending its name and inputs as a message. | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| repetition penalty | Pushes down the logits of tokens that appear in the prompt or the output so far. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| replay | Sending an old, valid message again to repeat its effect. | [7.9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) |
| replica | One running copy of the model server. Here: one Kubernetes pod with vLLM and its GPUs. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| replica (server instance) | One running copy of a server program. Several replicas serve the same endpoint. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| representation subspace | The small $d_h$-dimensional space that one head projects into. Each head compares tokens in its own subspace. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| request | One call from a client: a prompt plus settings such as `max_tokens` and `temperature`. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| request rate | Requests that arrive per second, written $\lambda$ (lambda). | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| `requestState` | An opaque string that the server puts into an `input_required` result and the client echoes in the retry. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| reranker | A slower, more accurate model that rescores a short candidate list. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| reservation | A 1-year or 3-year commitment for a lower hourly price. You pay even when you do not use it. | [5.7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) |
| reserved prefix | A `_meta` key prefix that only the MCP specification may define. Any prefix whose second label is `modelcontextprotocol` or `mcp`. | [7.10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) |
| reshape (view) | A change of shape that keeps the elements in the same order. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| residual connection | The rule $x \leftarrow x + F(x)$: a sub-layer adds its output to its input instead of replacing it. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| residual distribution | The distribution used after a rejection: $\mathrm{norm}(\max(0, p - q))$. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| residual stream | The sequence of hidden states that the residual connections carry from layer to layer. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| resource | Data that a server offers, named by a URI, for example a file or a database schema. Resources are application-controlled. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| resource indicator | The `resource` parameter (RFC 8707) that tells the AS which server the token is for. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| `Resource` object | The description of one resource in a list: `uri`, `name` and optional fields. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| resource owner | The user who owns the data and approves access. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| resource server (RS) | The service that holds the data and accepts tokens. In MCP, the MCP server. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| resource template | A pattern of URIs with variables, such as `orders://customers/{customer_id}/summary` (RFC 6570). | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| `resources/read` | The request that returns the contents of one URI, as text or as base64 `blob`. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| `resources/subscribe` | The 2025-11-25 request that subscribed to one URI on the session. Removed in 2026-07-28. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| response | The answer to a request: either a result or an error, with the same `id` as the request. | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| result | The success part of a response. In MCP it is always a JSON object. | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| `resultType` | The 2026-07-28 result field: `"complete"` or `"input_required"`. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| retrieval drift | A slow change in what retrieval returns, caused by new queries, new documents or new models. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| retrieval evaluator | In CRAG, a small model that scores how relevant each retrieved document is to the question. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| retrieval tool | A tool with a JSON Schema, such as `search_docs(query, k)`, that the model can call. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| retrieval-augmented generation (RAG) | A design where a search step finds relevant text for each question, and the model generates its answer with that text in its context window. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| retriever | The component that finds the passages most relevant to a query. | [6.1](/notes/ai/llm-systems/06-rag/l1-why-rag) |
| retry | Sending a failed request again. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| revision (protocol version) | One dated edition of the MCP specification, named `YYYY-MM-DD`. | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| ridge point | The intensity where the memory limit and the compute limit meet: peak FLOP/s divided by bandwidth. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| right padding | Padding placed after the real tokens. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| ring buffer | A fixed array where token $p$ goes to slot $p \bmod W$, so the newest token overwrites the oldest. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| RMSNorm | A normalization that only divides by the root mean square of the vector, then multiplies by a learned gain $g$. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| roofline | The bound $\text{attainable FLOP/s} = \min(\text{peak FLOP/s}, \ I \times \text{bandwidth})$. | [4.3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) |
| roofline model | A chart of the attainable FLOP/s as a function of arithmetic intensity. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| roots | The folders or files that the client tells the server it may use. Deprecated in 2026-07-28. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| RoPE | Rotary position embedding: rotate each pair of query and key dimensions by an angle proportional to the position. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| RoPE base $\theta$ | The constant that sets the rotation speeds. Llama 3 uses 500,000. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| round robin | A load-balancing rule that sends each new request to the next replica in turn. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| router | The component that picks a replica for each request. It is also called a load balancer. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| row vector | A vector written as one row. This guide writes token vectors as row vectors. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| row-major order | The memory order in which the last axis changes fastest. NumPy and PyTorch use it by default. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| row-parallel linear | A linear layer whose weight rows (inputs) are split. Each GPU produces a partial sum of the full output. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| RRF | Reciprocal rank fusion: $\sum 1/(k + \text{rank})$ over the lists that contain a document. | [8.3](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag) |
| rubric | A written scale that turns an answer into a score from 0 to 4. | [8.6](/notes/ai/llm-systems/08-interview-drills/l6-mock-interview) |
| running max $m$ | The largest score seen so far in a row. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| running sum $\ell$ | The sum of $e^{s - m}$ over the scores seen so far in a row. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| $s$ | Bytes per stored number: 2 for BF16, 1 for FP8. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| safetensors | A file format for tensors: a JSON header plus raw bytes, with no executable code. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| sampling | Choose the next token at random, with the probabilities of the softmax. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| saturation | A softmax with one weight near 1 and all others near 0. Its gradients are close to zero. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| saving factor | How many times smaller the cache is than with MHA: $H / H_{kv}$ for GQA and MQA. | [3.5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| scalar | One single number, for example 3 or −0.5. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| scale | The number that maps stored small numbers back to real values: real value $\approx$ stored value $\times$ scale. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| scale factor | A number that maps real values into the small range of a low-precision format and back. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| scale $s$ | The real-number size of one step between two neighboring codes. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| scale to zero | Remove the last replica when there is no traffic. The first new request then waits for a cold start. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| ScaledObject | The KEDA resource that names a target Deployment and its triggers. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| scaling | The division of every score by $\sqrt{d_k}$. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| scheduler | The code that decides, before each step, which requests run and how many tokens each one processes. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| scope | A named permission inside a token, for example `files:read`. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| score | The dot product of one query with one key. A high score means a good match. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| score matrix $S$ | All scores of a sequence: $S = QK^\top$, shape $[T, T]$. Row $i$ belongs to query $i$. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| SDK tier | The support level of an official SDK: Tier 1 (full), Tier 2 (working toward full), Tier 3 (experimental). | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| Secret | An object that holds sensitive values, such as an access token, and gives them to Pods. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| security trimming | Removing the documents that a user may not read from search results, with a filter on the user's groups. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| seed | A number that fixes the random draws of one request. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| selective batching | Orca's technique: batch the token-wise operations of all requests, but run attention separately for each request. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| selectivity | The share of vectors that pass a filter. | [6.4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) |
| self-attention | Attention where the model computes the queries, keys and values all from the same sequence. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| self-describing request | A request that carries its own protocol version and client capabilities in `_meta`. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| self-hosting | You run the inference engine on GPU machines that you control. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| self-review | The check of a recorded mock against a fixed list, after the mock. | [8.6](/notes/ai/llm-systems/08-interview-drills/l6-mock-interview) |
| semantic cache | A cache that returns a stored answer when a new query's embedding is close enough to a cached query's embedding. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| semantic chunking | Cutting where the meaning changes, detected from the embedding distance between neighboring sentences. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| semantic conventions | Agreed attribute and metric names in OpenTelemetry, so that tools understand each other's data. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| SEP | Specification Enhancement Proposal: the document that proposes a change to MCP, for example SEP-2575 "Make MCP Stateless". | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| sequence-to-sequence (seq2seq) | An encoder-decoder model that maps an input sequence to an output sequence, for example for translation. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| server | The program that offers tools, resources and prompts. | [8.4](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp) |
| server primitive | One of the three kinds of things a server offers: tools, resources and prompts. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| server-initiated request | A JSON-RPC request that the server sends to the client: `sampling/createMessage`, `elicitation/create`, `roots/list` or `ping`. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| server-sent events (SSE) | A way for an HTTP server to send many small messages over one open response. Each message is a `data:` line followed by an empty line. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| `server/discover` | The 2026-07-28 method that returns the server's supported versions, capabilities and identity. Optional for clients. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| Service | A stable name and virtual address that forwards traffic to the ready Pods with matching labels. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| serving engine (inference engine) | The software that turns model weights and GPUs into an API: batching, KV cache, kernels, sampling, streaming. | [4.10](/notes/ai/llm-systems/04-inference/l10-serving-engines) |
| session | The logically related interactions between one client and one server, from initialization to shutdown. The server keeps their shared state. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| session affinity | A routing rule: send all requests of one session to the same replica. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| shadow traffic | A copy of real requests sent to a new version whose responses are ignored. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| shape | The number of rows and columns, written $m \times n$ ("m by n"). | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| shared memory (`/dev/shm`) | A memory-backed file system that processes use to exchange data. PyTorch uses it between processes. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| shared responsibility | The split of jobs between the provider and you, for example who updates the GPU driver. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| shared session store | A database or cache that all replicas use to read and write session data. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| shingle | A sequence of $w$ consecutive words. A text becomes a set of shingles. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| sign bit | The bit that says positive (0) or negative (1). | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| SiLU (Swish) | The function $\mathrm{SiLU}(z) = z \cdot \sigma(z)$, where $\sigma$ is the logistic sigmoid. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| sinusoidal encoding | Fixed sine and cosine vectors added to the input embeddings (original transformer). | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| SLI | Service level indicator: a measured ratio of good events to all events, for example requests with TTFT below 1 s. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| sliding window | Reranking a long list with an LLM in overlapping windows, from the back to the front. | [6.5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) |
| sliding-window attention | Each token attends only to the last $W$ tokens, so older entries can be deleted. | [3.3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) |
| sliding-window attention (SWA) | Each token attends only to the last $W$ tokens. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| SLO | Service level objective. A target such as "TTFT at most 500 ms and TPOT at most 50 ms". | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| SLO (service level objective) | A latency target, for example "time to first token at most 500 ms for 99% of requests". | [4.10](/notes/ai/llm-systems/04-inference/l10-serving-engines) |
| SLO attainment | The fraction of requests that meet the SLO. | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| slot | One position along the time axis of a cache tensor. One slot holds the key (or value) vectors of one token. | [3.4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) |
| slot mapping | The index of the physical slot where a new token's key and value are written: physical block × block size + offset. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| SmoothQuant | Moves outlier difficulty from activations to weights with a per-channel rescaling, enabling W8A8. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| softmax | The function that converts logits into probabilities that are positive and sum to 1. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| source label | A tag around a chunk with a short ID and metadata, so that the model can cite it. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| span, trace | A span is one timed operation. A trace is the tree of spans of one request. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| spec revision | A version of the MCP specification, named by its release date, for example 2025-11-25 or 2026-07-28. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| speculation length $\gamma$ | The number of draft tokens per step. vLLM calls it `num_speculative_tokens`. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| speculative decoding | A draft proposes tokens, and the target model verifies them in one pass, exactly. | [8.2](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud) |
| spillover | A Foundry feature that sends overflow from a provisioned deployment to a standard deployment. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| split heads | A reshape and a transpose that change $[B, T, d]$ into $[B, H, T, d_h]$, so that each head gets its own slice. | [2.5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) |
| spot capacity | Spare capacity at a large discount. The cloud can take it back with short notice. | [5.7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) |
| spotlighting | A family of prompt transformations that mark untrusted text, so that the model treats it as data. | [6.7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) |
| SRAM (shared memory) | Small, fast memory inside each streaming multiprocessor (SM) of a GPU. 228 KB per SM on an H100. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| SRAM, shared memory | Small, very fast memory on the chip, inside each SM. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| stabilization window | A time window. Before it removes replicas, the HPA takes the highest recommendation in this window. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| stall-free batching | Sarathi-Serve's policy: schedule all decodes first, then fill the rest of the budget with prefill chunks. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| standalone query | A query that makes sense without the conversation history. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| standard streams | Three byte channels that every process has: stdin (0), stdout (1) and stderr (2). | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| state | Data that a party remembers between two messages and that changes how it handles the next message. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| stateful protocol | A protocol in which the meaning of a message depends on earlier messages, for example on a handshake. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| stateless protocol | A protocol in which "all the information needed to process a request is contained in the request itself" (2026-07-28). | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| static batching | Form a batch, run it until every request in it has finished, then form the next batch. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| static cache | A cache that reserves space for a maximum length once and writes new tokens at a slot index. | [3.4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) |
| static embedding | The fixed vector of a token ID from the embedding table. It is the same in every sentence. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| status code | The three-digit result of an HTTP request, for example 200, 202, 400, 404, 405. | [7.4](/notes/ai/llm-systems/07-mcp/l4-transports) |
| `StdioServerParameters` | The command and arguments that a client uses to start a stdio server. | [7.13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) |
| step | One forward pass of the model over the current batch. Also called an iteration. Each running request gets at most one new token per step (without speculative decoding). | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| step budget | The largest number of loop steps or tool calls that an agent may make for one question. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| step time | The time of one forward pass over the batch. During decode, it is the TPOT of every running request. | [4.3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) |
| step-back question | A more general question about the concept behind the user's question, asked first to retrieve background facts. | [6.6](/notes/ai/llm-systems/06-rag/l6-query-side-techniques) |
| sticky session | A load-balancer rule that always sends one client's requests to the same replica. | [7.13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) |
| sticky session (session affinity) | A load-balancer rule that sends all requests of one session to the same replica. | [7.5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) |
| stop condition | A rule that ends generation: an end-of-sequence token, a stop string, a stop token ID or a length limit. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
| stop token | A special token that ends generation, for example `<\|eot_id\|>` in Llama 3.1. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| Streamable HTTP | The HTTP transport: one endpoint, a POST per message, a JSON or SSE answer. | [8.4](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp) |
| streaming multiprocessor (SM) | One of the many processor blocks of an NVIDIA GPU. An H100 SXM has 132. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| StreamingLLM | A method that keeps a few sink tokens plus a window of recent tokens. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| strict mode | A model provider setting that forces tool arguments to match a schema through constrained decoding. It supports only part of JSON Schema. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| stride | The number of elements to skip in memory to move one step along an axis. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| stride $S$ | The distance between the starts of neighboring chunks: $S = C - O$. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| structure-aware chunking | Cutting at the structure of the document, such as headings, sections, table rows or functions. | [6.3](/notes/ai/llm-systems/06-rag/l3-chunking-and-ingestion) |
| `structuredContent` | Typed JSON data in a result, for programs. Since 2026-07-28 it can be any JSON value. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| `subscribe` | A sub-capability of resources: the client may subscribe to changes of one resource. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| `subscriptions/listen` | The 2026-07-28 request that opens a long-lived stream of opted-in change notifications. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| swapping | A way to resume a preempted request: copy its KV cache to CPU memory and copy it back later. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| SwiGLU | An MLP where a SiLU "gate" multiplies a second linear "up" projection element by element. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| symmetric (absmax) quantization | Codes centered on 0, scale from the largest absolute value. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| $T$ | The number of tokens in the sequence. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| tail latency | The slow end of the distribution, for example P99. It describes the worst experiences that still happen often. | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| taint, toleration | A taint on a node repels Pods. A toleration on a Pod allows it to run on a tainted node. | [5.4](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) |
| target model | The large model whose output we want. Its next-token distribution is $p$. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| task | A durable handle for long work. The client polls it instead of keeping a request open. | [7.10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) |
| teacher forcing | Training with the true previous tokens as input, not with the model's own outputs. | [2.4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) |
| temperature | A number that divides the logits before the softmax. Below 1 it sharpens the distribution. Above 1 it flattens it. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| temperature $\tau$ | The number that divides the similarities before the softmax. A small $\tau$ makes the softmax sharp. | [6.2](/notes/ai/llm-systems/06-rag/l2-embeddings-in-depth) |
| tenant | One customer or organization whose data must stay separate from all others. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| tensor | An array of numbers with any number of axes. A scalar, a vector and a matrix are tensors with 0, 1 and 2 axes. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| Tensor Core | A unit inside an SM that does a small matrix multiply-accumulate in one step. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| tensor parallelism | Every weight matrix is split over GPUs, with two all-reduces per layer. | [8.2](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud) |
| tensor parallelism (TP) | Each weight matrix is split over GPUs. All GPUs work on every token. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| `TextResourceContents` | One content item with `uri`, `text` and optional `mimeType`. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| thread | One sequence of instructions. A GPU runs many thousands at once. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| thread block | A group of threads that run on one SM and can share its fast memory. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| throughput | The amount of work per second for the whole service: requests per second or tokens per second. | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| tied embeddings | The LM head reuses the embedding table as its weight matrix. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| tile (block) | A small rectangular piece of a matrix that fits in SRAM. | [2.7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) |
| timebox | The fixed minutes for one section of the interview. | [8.6](/notes/ai/llm-systems/08-interview-drills/l6-mock-interview) |
| timeout | The longest time a caller waits before it stops waiting. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| token | A piece of text that the model reads as one unit: a word, a part of a word, a byte or a control symbol. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| token bucket | A rate limiter: a bucket refills at a fixed rate, and each request takes tokens from it. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| token budget | The maximum number of tokens in one step. In vLLM, `max_num_batched_tokens`. | [4.4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) |
| token ID | The integer that represents one token. The model sees only these integers. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| token mask | A list of allowed tokens for this step, often stored as a bitmask with 1 bit per vocabulary entry. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| token pass | In these notes: one token position processed once through all layers. | [3.1](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists) |
| token passthrough | Accepting a token that was issued for another service, and forwarding it. Forbidden in MCP. | [7.11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) |
| token tree | Several candidate continuations checked in one pass with a special attention mask. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| tokenizer | The program that converts text into token IDs, and token IDs back into text. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| tokens per step | The number of tokens one verification pass produces. The expectation is $(1-\alpha^{\gamma+1})/(1-\alpha)$. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| tolerance | The HPA dead band. If the metric is within 10% of the target, the HPA does nothing. | [5.5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) |
| tool | A function that a server offers and that the model may ask to call. Tools are model-controlled. | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| tool annotations | Hints about behavior: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` and `title`. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| tool execution error | A normal result with `isError: true` and a text that explains the failure. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| `Tool` object | The JSON object that describes one tool in a `tools/list` result: `name`, `inputSchema` and optional fields. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| `ToolError` | The SDK exception for an expected tool failure. Its message reaches the model as a result with `isError: true`. | [7.13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) |
| `tools/call` | The request that runs one tool with `name` and `arguments`. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| `tools/list` | The request that returns the tools of a server, one page at a time. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| top-k | Keep only the $k$ highest logits. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| top-p (nucleus) | Keep the smallest set of top tokens whose probabilities sum to at least $p$. | [4.5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output) |
| `torch.compile` | PyTorch's compiler. vLLM uses it to fuse operations into faster kernels at startup. | [5.3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) |
| TPOT | Time per output token after the first. It is close to the time of one decode step. | [3.2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) |
| trace context | The W3C `traceparent`, `tracestate` and `baggage` values that link spans of one distributed trace. | [7.10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) |
| transformer block (layer) | One repeated unit: an attention sub-layer and an MLP sub-layer, each with a normalization and a residual connection. | [2.6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) |
| transition | The interviewer's sentence that moves from one topic to the next. | [8.6](/notes/ai/llm-systems/08-interview-drills/l6-mock-interview) |
| transport | The channel that carries MCP messages: stdio for a local process, or Streamable HTTP for a remote server (lesson [L4](/notes/ai/llm-systems/07-mcp/l4-transports)). | [7.1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) |
| transpose | The matrix with rows and columns swapped. Written $A^\top$. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| transpose (permute) | A change of the order of the axes. It changes which elements are neighbors. | [1.3](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) |
| trap question | A question with a common wrong answer that sounds right. | [8.1](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention) |
| TTFT | Time to first token: from the arrival of a request to the first output token. Prefill is most of it. | [3.2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) |
| `ttlMs` | A freshness hint in milliseconds on list results in 2026-07-28. The client may reuse the result that long. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| `ttlMs` and `cacheScope` | Caching hints on list and read results: freshness time in milliseconds, and who may share the cached copy. | [7.10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) |
| two's complement | The usual way to store negative integers: the top bit has a negative place value. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| type hint | The declared type of a parameter, for example `order_id: str`. The SDK turns it into JSON Schema. | [7.13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) |
| underflow | A result too small for the format. It becomes a subnormal number or zero. | [1.4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) |
| unit vector | A vector with norm 1. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| Unity Gateway | The Databricks governance layer for model services, agents and MCP servers: rate limits, guardrails, usage tracking. | [5.6](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) |
| up-projection $W^{UK}$, $W^{UV}$ | The matrices that map the latent vector back to the keys and the values of each head. | [3.5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| uptraining | Converting a trained MHA checkpoint to MQA or GQA, then training it for a short time. | [3.5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) |
| URI | A string that names a resource, such as `orders://schema` or `file:///project/README.md` (RFC 3986). | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| URL mode | Elicitation that sends the user to a web page, for secrets and third-party login. The data never passes through the client. | [7.9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) |
| USD per MTok | The price of one million tokens. | [8.5](/notes/ai/llm-systems/08-interview-drills/l5-formula-sheet) |
| `use_cache` | The Hugging Face flag that enables or disables the cache. | [3.4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) |
| user-controlled | The user decides when a prompt is used. | [7.8](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) |
| UTF-8 | The byte encoding of text that MCP requires. One character takes one to four bytes. | [7.2](/notes/ai/llm-systems/07-mcp/l2-json-rpc) |
| utility | A cross-cutting MCP feature that many requests use: progress, cancellation, pagination, logging, completion. | [7.10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) |
| utilization | The fraction of time a resource is busy, written $\rho$ (rho). | [4.2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics) |
| validator | A program that checks an instance against a schema and reports errors. | [7.7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) |
| value | The vector that a token delivers when it is read. Outputs are weighted averages of values. | [2.2](/notes/ai/llm-systems/02-attention-and-the-transformer/l2-why-attention) |
| variable cost | A cost that grows with traffic, for example a price per token. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| vector | An ordered list of numbers, for example $[1, 0, 1, 0]$. Also an arrow from the origin to that point. | [1.1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) |
| verification pass | One forward pass of the target model over the prefix plus all draft tokens. It returns $\gamma + 1$ distributions. | [4.6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) |
| version negotiation | The rule set that picks one protocol version for the session. | [7.3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) |
| virtual machine (VM) | A computer that the cloud creates in software on a physical server. You rent it by time. | [5.1](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) |
| vocabulary | The fixed set of all tokens. Its size is $V$. For Llama-3.1-8B, $V = 128{,}256$. | [2.1](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) |
| $W_Q$, $W_K$, $W_V$ | The learned projection matrices. They map hidden states to queries, keys and values. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| warp | A group of 32 threads that run the same instruction at the same time. | [1.5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) |
| weight and activation quantization (W8A8) | Both inputs of the matrix multiply in 8 bits, so the GPU can use INT8 or FP8 Tensor Cores. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| weight matrix | The learned matrix $W$ of a linear layer. | [1.2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) |
| weight-only quantization (W4A16, W8A16) | Weights in low bits, activations in 16 bits. The kernel dequantizes weights before the multiply. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| weights memory | Parameters × bytes per parameter. | [5.2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) |
| worker | A process that drives one GPU: it loads its weight shard and runs the forward pass. | [4.10](/notes/ai/llm-systems/04-inference/l10-serving-engines) |
| working group | A group that builds a concrete deliverable, for example a SEP or an implementation. | [7.12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) |
| world size | The number of GPU processes in a group. | [4.8](/notes/ai/llm-systems/04-inference/l8-parallelism) |
| write index | The number of slots already written in a static cache. The next token goes to this slot. | [3.4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) |
| write path | The pipeline that brings documents into the index: connectors, parsing, chunking, embedding, indexing. | [6.9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) |
| $X$ | The input matrix of one attention layer: one hidden state per row, shape $[T, d]$. | [2.3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) |
| `x-mcp-header` | A 2026-07-28 annotation inside a property schema. The client copies that argument into an HTTP header. | [7.6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) |
| Xid error | An error report from the NVIDIA driver about a GPU problem. | [5.8](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) |
| zero-point | An offset used by asymmetric quantization, so that the stored range can start at the minimum value. | [3.6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) |
| zero-point $z$ | The integer code that represents the real value 0 in asymmetric quantization. | [4.7](/notes/ai/llm-systems/04-inference/l7-quantization) |
| ZeroMQ (ZMQ) | A messaging library. vLLM V1 uses it to pass requests and outputs between its processes. | [4.1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) |
