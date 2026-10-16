---
title: "Media queue"
order: 4
summary: "Every planned video of this subject and of the PagedAttention paper, the misunderstanding that each video fixes, the page that shows it, and the SVG figures per part."
---

Status values:

- **planned**: the page already has the `video` block, but the video file does not exist yet.
- **rendered**: the video file exists in its output folder.
- **in lesson**: the file exists and the page shows it.

## Subject videos

Output folder: `public/notes/media/llm-systems/manim/`. 38 videos.

| File | Video | Misunderstanding it fixes | Page | Status |
|---|---|---|---|---|
| `m01-dot-product-alignment.mp4` | The dot product as alignment | "The dot product measures only the angle, so a longer key can never beat a better-aligned key." | [01 L1](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) | planned |
| `m02-matmul-many-dot-products.mp4` | Matrix multiplication is many dot products | "Matrix multiplication is a block operation unrelated to dot products, and it costs m·k·n operations." | [01 L2](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) | planned |
| `m03-roofline.mp4` | The roofline: memory-bound versus compute-bound | "A GPU with more TFLOPS always generates tokens faster." | [01 L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) | planned |
| `m04-attention-soft-lookup.mp4` | Attention as a soft lookup, with the toy numbers | "Attention picks the single most relevant token, like a dictionary lookup that returns one value." | [02 L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) | planned |
| `m05-causal-mask-and-decode.mp4` | The causal mask and one decode step | "Each new token recomputes the keys and values of all earlier tokens, and the causal mask hides the prompt from the answer." | [02 L4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation) | planned |
| `m06-why-scale-by-sqrt-dk.mp4` | Why attention divides by the square root of d_k | "The 1/sqrt(d_k) factor is a cosmetic constant, or it only prevents overflow." | [02 L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) | planned |
| `m07-multi-head-split-concat.mp4` | Multi-head attention: split, attend, concatenate | "Each head sees only a slice of each token, and more heads cost more compute." | [02 L5](/notes/ai/llm-systems/02-attention-and-the-transformer/l5-multi-head-attention) | planned |
| `m08-transformer-block-data-flow.mp4` | One token through one transformer block | "A layer replaces the hidden state, and the position of a token is added once at the input." | [02 L6](/notes/ai/llm-systems/02-attention-and-the-transformer/l6-the-transformer-block) | planned |
| `m09-online-softmax-over-tiles.mp4` | The online softmax over tiles | "FlashAttention approximates attention, and softmax needs the whole row of scores at once." | [02 L7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention) | planned |
| `m10-recompute-vs-cache.mp4` | The same decode step: recompute everything vs read the KV cache | "The KV cache is an approximation, or past keys and values change when a new token arrives." | [03 L1](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists) | planned |
| `m11-prefill-then-decode.mp4` | Prefill then decode: one big compute-bound pass, then many memory-bound steps | "Decode is slow because it does a lot of arithmetic, and batching makes decode compute-bound." | [03 L2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) | planned |
| `m12-cache-filling-gpu-memory.mp4` | The KV cache filling GPU memory | "Once the weights fit on the GPU, memory is no longer a problem, and the cache is small next to the model." | [03 L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) | planned |
| `m13-the-cache-append-in-code.mp4` | The KV cache append, line by line | "The KV cache is a complicated system." | [03 L4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) | planned |
| `m14-gqa-head-sharing.mp4` | Grouped-query attention: query heads share KV heads | "GQA reduces the number of attention patterns." | [03 L5](/notes/ai/llm-systems/03-kv-cache/l5-mha-mqa-gqa-and-mla) | planned |
| `m15-sliding-window-and-attention-sinks.mp4` | Sliding windows and attention sinks | "You can keep only the most recent tokens of any model's cache." | [03 L6](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache) | planned |
| `m16-life-of-a-request.mp4` | The life of a request | "An LLM server handles a request like one function call, so the prompt is the slow part." | [04 L1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) | planned |
| `m17-static-vs-continuous-batching.mp4` | Static vs continuous batching | "Batching means grouping requests once and running the group to the end." | [04 L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) | planned |
| `m18-batch-size-on-the-roofline.mp4` | Batch size on the roofline | "LLM decoding is compute-bound, so each request added to a batch makes each step proportionally slower." | [04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) | planned |
| `m19-speculative-decoding.mp4` | Speculative decoding: draft, verify, accept, reject | "Speculative decoding works only for greedy decoding, or it changes the output distribution." | [04 L6](/notes/ai/llm-systems/04-inference/l6-speculative-decoding) | planned |
| `m20-tensor-parallelism.mp4` | Tensor parallelism: split every matrix, sum twice per layer | "Tensor parallelism gives each GPU different layers, or it needs communication after every matrix multiply." | [04 L8](/notes/ai/llm-systems/04-inference/l8-parallelism) | planned |
| `m21-prefix-cache-hit.mp4` | A prefix cache hit through block hashes | "Prefix caching reuses any repeated text, at any position and of any length." | [04 L9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse) | planned |
| `m22-gpu-memory-budget.mp4` | The GPU memory budget: from 80 GiB to KV cache blocks | "GPU memory minus the weights is the KV cache, and gpu_memory_utilization is the share reserved for the cache." | [05 L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) | planned |
| `m23-cold-start-timeline.mp4` | Why a new replica takes minutes: the cold-start timeline | "A new replica serves traffic as soon as its container starts." | [05 L3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) | planned |
| `m24-autoscaling-on-queue-depth.mp4` | Autoscaling on queue depth | "The autoscaler adds GPU capacity within seconds, and queue depth alone can size the fleet." | [05 L5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) | planned |
| `m25-gpu-hour-to-cost-per-token.mp4` | From GPU hour to cost per token | "The hourly price of a GPU fixes its cost per token, so cheaper GPUs always mean cheaper tokens." | [05 L7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) | planned |
| `m26-hnsw-greedy-search.mp4` | HNSW search: down the layers, and why ef matters | "HNSW greedy search always finds the true nearest neighbor, so efSearch only changes the speed." | [06 L4](/notes/ai/llm-systems/06-rag/l4-vector-indexes) | planned |
| `m27-reciprocal-rank-fusion.mp4` | Reciprocal rank fusion, step by step | "You can merge dense and BM25 results by adding their scores, or RRF is a fixed formula with no choices." | [06 L5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking) | planned |
| `m28-ndcg-step-by-step.mp4` | Computing nDCG@5 step by step | "nDCG is a black-box score, and the ideal list uses only the retrieved documents." | [06 L8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag) | planned |
| `m29-production-rag-data-flow.mp4` | The production RAG data flow | "Production RAG is a model call behind a vector search, and permissions can filter the results afterwards." | [06 L9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture) | planned |
| `m30-mcp-roles-and-one-tool-call.mp4` | MCP roles and one tool call, end to end | "The model connects to the MCP server and calls the tool itself." | [07 L1](/notes/ai/llm-systems/07-mcp/l1-why-mcp) | planned |
| `m31-session-behind-load-balancer.mp4` | A 2025-11-25 session behind a load balancer, and stateless requests | "A load balancer can send each request of a 2025-11-25 session to any server replica." | [07 L5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) | planned |
| `m32-handshake-vs-self-describing-requests.mp4` | The initialize handshake against self-describing requests | "A 2025-11-25 tools/call carries the protocol version and the client capabilities, like a 2026-07-28 request." | [07 L3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) | planned |
| `m33-tool-call-validated-against-schema.mp4` | A tool call validated against its JSON Schema | "Valid JSON arguments are correct arguments, and keywords such as default and format are enforced automatically." | [07 L7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) | planned |
| `m34-mrtr-retry-flow.mp4` | The MRTR retry flow | "In 2026-07-28 the server pauses the tool call and waits on an open connection for the user's answer." | [07 L9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) | planned |
| `m35-old-elicitation-vs-mrtr.mp4` | Old elicitation over a session vs new MRTR | "Asking the user in the middle of a call works the same behind any load balancer in both revisions." | [07 L9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) | planned |
| `m36-oauth-discovery-flow.mp4` | From a 401 to a bearer call: MCP authorization discovery | "The MCP client already knows the authorization server, and any valid company token works on any MCP server." | [07 L11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) | planned |
| `m37-version-timeline.mp4` | Five MCP revisions on one time axis | "MCP still starts every connection with initialize and a session, and every small change gets a new version." | [07 L12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) | planned |
| `m38-function-to-tool-schema.mp4` | From a Python function to an MCP tool schema | "The model sees the Python code of the tool, or every tool needs a hand-written JSON Schema." | [07 L13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) | planned |

## Paper videos

Output folder: `public/notes/media/papers/2023-pagedattention/manim/`. 5 videos. The paper pages are in the [PagedAttention (2023)](/notes/papers/llm-serving/2023-pagedattention) folder.

| File | Video | Misunderstanding it fixes | Page | Status |
|---|---|---|---|---|
| `p01-contiguous-allocation-waste.mp4` | Contiguous allocation and its three kinds of waste | "The KV memory of earlier systems held mostly useful data, and a known output length would remove the waste." | [Paper 03](/notes/papers/llm-serving/2023-pagedattention/03-the-question) | planned |
| `p02-attention-block-by-block.mp4` | Attention computed block by block | "Attention over scattered blocks is an approximation, or each block can normalize its own softmax." | [Paper 04](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm) | planned |
| `p03-block-table-filling.mp4` | The block table fills step by step | "vLLM reserves memory for the maximum length, or keeps the KV cache of a request in one contiguous piece." | [Paper 05](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager) | planned |
| `p04-copy-on-write.mp4` | Copy-on-write for parallel sampling | "Each sample needs its own full copy of the prompt's KV cache, or copy-on-write copies the whole sequence." | [Paper 06](/notes/papers/llm-serving/2023-pagedattention/06-decoding-scenarios-and-sharing) | planned |
| `p05-slower-kernel-higher-throughput.mp4` | Why a slower attention kernel gives 2 to 4 times the throughput | "PagedAttention makes the attention computation faster." | [Paper 09](/notes/papers/llm-serving/2023-pagedattention/09-results) | planned |

## Figures

All subject figures are SVG files in `public/notes/media/llm-systems/figures/`. Each name starts with the part and the lesson, for example `03-3-kv-size-formula.svg` belongs to part 03, L3.

| Part | SVG figures | Status |
|---|---|---|
| [01 Math and hardware](/notes/ai/llm-systems/01-math-and-hardware) | 6 | in lesson |
| [02 Attention and the transformer](/notes/ai/llm-systems/02-attention-and-the-transformer) | 13 | in lesson |
| [03 The KV cache](/notes/ai/llm-systems/03-kv-cache) | 13 | in lesson |
| [04 Inference](/notes/ai/llm-systems/04-inference) | 17 | in lesson |
| [05 Cloud hosting](/notes/ai/llm-systems/05-cloud-hosting) | 13 | in lesson |
| [06 RAG](/notes/ai/llm-systems/06-rag) | 13 | in lesson |
| [07 MCP](/notes/ai/llm-systems/07-mcp) | 23 | in lesson |
| [08 Interview drills](/notes/ai/llm-systems/08-interview-drills) | 2 | in lesson |
| **Total** | **100** | |

The figures of the paper are in `public/notes/media/papers/2023-pagedattention/figures/`. The [paper card](/notes/papers/llm-serving/2023-pagedattention) lists each one with the page that uses it.
