# Claude Code prompts: LLM Systems Deep Dive (Manim)

43 videos for the subject "LLM Systems Deep Dive" (`src/content/notes/ai/llm-systems/`) and the paper "PagedAttention (2023)" (`src/content/notes/papers/llm-serving/2023-pagedattention/`). Every page already has a `video` block that points to the output path. A video appears in the notes as soon as its file exists.

## How to run

Open a new Claude Code session in `C:\Users\ASohi\Downloads\Project-Portfolio` and paste one line. To make every video:

```text
Read "Claude outputs/llm-systems-manim-prompts.md" and follow its run rules.
```

To make one group only (for example the KV cache videos first):

```text
Read "Claude outputs/llm-systems-manim-prompts.md" and follow its run rules. Make group 3 only.
```

Paste the same line again to continue a stopped run. Finished videos are skipped.

## Run rules (for Claude Code)

1. Run only one Claude Code session on this repository at a time. Two sessions can erase each other's changes.
2. Work through the queue table below in order. If the request names a group, make only the videos of that group.
3. Before each video, check its output path. If the file already exists, skip the video. So a run is safe to repeat, and a stopped run can continue.
4. Make each video with the shared rules and its prompt below. The prompt is the full specification. Use its exact labels and numbers. They come from the lessons and were checked. Values marked "approximate" or "illustrative" keep that mark on screen.
5. After each finished video, add one row to `Claude outputs/llm-systems-manim-report.md`. If that file does not exist, create it with this header:

   ```text
   | Date | File | Duration | Size | Checks |
   |---|---|---|---|---|
   ```

6. Do not edit any file in `src/`, and do not edit this prompt file. Chat Claude reads the report and updates the media queue.
7. At the end, list the videos of the queue that are still missing.

## Queue

| # | Group | Video | Output path | Page |
|---|---|---|---|---|
| 1 | 1. Math and hardware | M01: The dot product as alignment | `public/notes/media/llm-systems/manim/m01-dot-product-alignment.mp4` | L1: Vectors and dot products |
| 2 | 1. Math and hardware | M02: Matrix multiplication is many dot products | `public/notes/media/llm-systems/manim/m02-matmul-many-dot-products.mp4` | L2: Matrices and matrix multiplication |
| 3 | 1. Math and hardware | M03: The roofline: memory-bound versus compute-bound | `public/notes/media/llm-systems/manim/m03-roofline.mp4` | L5: GPUs, memory and bandwidth |
| 4 | 2. Attention and the transformer | M04: Attention as a soft lookup, with the toy numbers | `public/notes/media/llm-systems/manim/m04-attention-soft-lookup.mp4` | L3: Scaled dot-product attention, step by step |
| 5 | 2. Attention and the transformer | M05: The causal mask and one decode step | `public/notes/media/llm-systems/manim/m05-causal-mask-and-decode.mp4` | L4: Causal masking and generation |
| 6 | 2. Attention and the transformer | M06: Why attention divides by the square root of d_k | `public/notes/media/llm-systems/manim/m06-why-scale-by-sqrt-dk.mp4` | L3: Scaled dot-product attention, step by step |
| 7 | 2. Attention and the transformer | M07: Multi-head attention: split, attend, concatenate | `public/notes/media/llm-systems/manim/m07-multi-head-split-concat.mp4` | L5: Multi-head attention |
| 8 | 2. Attention and the transformer | M08: One token through one transformer block | `public/notes/media/llm-systems/manim/m08-transformer-block-data-flow.mp4` | L6: The transformer block, end to end |
| 9 | 2. Attention and the transformer | M09: The online softmax over tiles | `public/notes/media/llm-systems/manim/m09-online-softmax-over-tiles.mp4` | L7: The cost of attention and FlashAttention |
| 10 | 3. The KV cache | M10: The same decode step: recompute everything vs read the KV cache | `public/notes/media/llm-systems/manim/m10-recompute-vs-cache.mp4` | L1: Why the KV cache exists |
| 11 | 3. The KV cache | M11: Prefill then decode: one big compute-bound pass, then many memory-bound steps | `public/notes/media/llm-systems/manim/m11-prefill-then-decode.mp4` | L2: Prefill and decode |
| 12 | 3. The KV cache | M12: The KV cache filling GPU memory | `public/notes/media/llm-systems/manim/m12-cache-filling-gpu-memory.mp4` | L3: The KV cache size formula |
| 13 | 3. The KV cache | M13: The KV cache append, line by line | `public/notes/media/llm-systems/manim/m13-the-cache-append-in-code.mp4` | L4: Implementing a KV cache |
| 14 | 3. The KV cache | M14: Grouped-query attention: query heads share KV heads | `public/notes/media/llm-systems/manim/m14-gqa-head-sharing.mp4` | L5: MHA, MQA, GQA and MLA |
| 15 | 3. The KV cache | M15: Sliding windows and attention sinks | `public/notes/media/llm-systems/manim/m15-sliding-window-and-attention-sinks.mp4` | L6: Shrinking the KV cache |
| 16 | 4. The PagedAttention paper | P01: Contiguous allocation and its three kinds of waste | `public/notes/media/papers/2023-pagedattention/manim/p01-contiguous-allocation-waste.mp4` | 03 The question: where does KV cache memory go? |
| 17 | 4. The PagedAttention paper | P02: Attention computed block by block | `public/notes/media/papers/2023-pagedattention/manim/p02-attention-block-by-block.mp4` | 04 PagedAttention: the algorithm |
| 18 | 4. The PagedAttention paper | P03: The block table fills step by step | `public/notes/media/papers/2023-pagedattention/manim/p03-block-table-filling.mp4` | 05 The KV cache manager and block tables |
| 19 | 4. The PagedAttention paper | P04: Copy-on-write for parallel sampling | `public/notes/media/papers/2023-pagedattention/manim/p04-copy-on-write.mp4` | 06 Sharing: parallel sampling, beam search and shared prefixes |
| 20 | 4. The PagedAttention paper | P05: Why a slower attention kernel gives 2 to 4 times the throughput | `public/notes/media/papers/2023-pagedattention/manim/p05-slower-kernel-higher-throughput.mp4` | 09 Results |
| 21 | 5. Inference | M16: The life of a request | `public/notes/media/llm-systems/manim/m16-life-of-a-request.mp4` | L1: The life of a request |
| 22 | 5. Inference | M17: Static vs continuous batching | `public/notes/media/llm-systems/manim/m17-static-vs-continuous-batching.mp4` | L4: Batching and scheduling |
| 23 | 5. Inference | M18: Batch size on the roofline | `public/notes/media/llm-systems/manim/m18-batch-size-on-the-roofline.mp4` | L3: Compute-bound vs memory-bound |
| 24 | 5. Inference | M19: Speculative decoding: draft, verify, accept, reject | `public/notes/media/llm-systems/manim/m19-speculative-decoding.mp4` | L6: Speculative decoding |
| 25 | 5. Inference | M20: Tensor parallelism: split every matrix, sum twice per layer | `public/notes/media/llm-systems/manim/m20-tensor-parallelism.mp4` | L8: Parallelism: tensor, pipeline, data and expert |
| 26 | 5. Inference | M21: A prefix cache hit through block hashes | `public/notes/media/llm-systems/manim/m21-prefix-cache-hit.mp4` | L9: Prefix caching and KV reuse |
| 27 | 6. Cloud hosting | M22: The GPU memory budget: from 80 GiB to KV cache blocks | `public/notes/media/llm-systems/manim/m22-gpu-memory-budget.mp4` | L2: Sizing GPUs for a model |
| 28 | 6. Cloud hosting | M23: Why a new replica takes minutes: the cold-start timeline | `public/notes/media/llm-systems/manim/m23-cold-start-timeline.mp4` | L3: Containers and model loading |
| 29 | 6. Cloud hosting | M24: Autoscaling on queue depth | `public/notes/media/llm-systems/manim/m24-autoscaling-on-queue-depth.mp4` | L5: Autoscaling and routing |
| 30 | 6. Cloud hosting | M25: From GPU hour to cost per token | `public/notes/media/llm-systems/manim/m25-gpu-hour-to-cost-per-token.mp4` | L7: Cost math: from GPU hours to cost per token |
| 31 | 7. RAG | M26: HNSW search: down the layers, and why ef matters | `public/notes/media/llm-systems/manim/m26-hnsw-greedy-search.mp4` | L4: Vector indexes: flat, IVF, HNSW and PQ |
| 32 | 7. RAG | M27: Reciprocal rank fusion, step by step | `public/notes/media/llm-systems/manim/m27-reciprocal-rank-fusion.mp4` | L5: Hybrid search and reranking |
| 33 | 7. RAG | M28: Computing nDCG@5 step by step | `public/notes/media/llm-systems/manim/m28-ndcg-step-by-step.mp4` | L8: Evaluating RAG |
| 34 | 7. RAG | M29: The production RAG data flow | `public/notes/media/llm-systems/manim/m29-production-rag-data-flow.mp4` | L9: Production RAG architecture |
| 35 | 8. MCP | M30: MCP roles and one tool call, end to end | `public/notes/media/llm-systems/manim/m30-mcp-roles-and-one-tool-call.mp4` | L1: Why MCP exists |
| 36 | 8. MCP | M31: A 2025-11-25 session behind a load balancer, and stateless requests | `public/notes/media/llm-systems/manim/m31-session-behind-load-balancer.mp4` | L5: Stateful vs stateless MCP |
| 37 | 8. MCP | M32: The initialize handshake against self-describing requests | `public/notes/media/llm-systems/manim/m32-handshake-vs-self-describing-requests.mp4` | L3: The stateful protocol (2025-11-25) |
| 38 | 8. MCP | M33: A tool call validated against its JSON Schema | `public/notes/media/llm-systems/manim/m33-tool-call-validated-against-schema.mp4` | L7: JSON Schema for tool arguments |
| 39 | 8. MCP | M34: The MRTR retry flow | `public/notes/media/llm-systems/manim/m34-mrtr-retry-flow.mp4` | L9: Asking the client for input: MRTR, elicitation, sampling and roots |
| 40 | 8. MCP | M35: Old elicitation over a session vs new MRTR | `public/notes/media/llm-systems/manim/m35-old-elicitation-vs-mrtr.mp4` | L9: Asking the client for input: MRTR, elicitation, sampling and roots |
| 41 | 8. MCP | M36: From a 401 to a bearer call: MCP authorization discovery | `public/notes/media/llm-systems/manim/m36-oauth-discovery-flow.mp4` | L11: Authorization and security |
| 42 | 8. MCP | M37: Five MCP revisions on one time axis | `public/notes/media/llm-systems/manim/m37-version-timeline.mp4` | L12: What is new: the version history |
| 43 | 8. MCP | M38: From a Python function to an MCP tool schema | `public/notes/media/llm-systems/manim/m38-function-to-tool-schema.mp4` | L13: Build an MCP server and client |

## Shared rules (apply to every video)

`````text
SHARED RULES (apply to this video)

You make one teaching video with Manim Community Edition for my study notes.

Repository: C:\Users\ASohi\Downloads\Project-Portfolio
- Do not edit any file in src/. The page already has a video block that points to the output path.
- Write the Manim source in C:\Users\ASohi\Downloads\manim-work\llm-systems\ (create it if needed), not inside the repository.
- Save only the final .mp4 at the output path given below. Create the folder if it does not exist.
- Delete the intermediate render folders in manim-work after the final file is copied.

Format
- 1920x1080, 30 fps. Render with: manim -r 1920,1080 --fps 30 ...
- White background #FFFFFF. Main text ink #100D12.
- No audio. All explanation is on-screen text: short phrases, at most 12 words per caption.
- No text smaller than 32 px. Use one clean sans-serif font for all text, and a monospace font for code, JSON, field names, tensor shapes and token strings.
- Use Text, not MathTex or Tex, so the render needs no LaTeX. Write formulas as plain text, for example "softmax(Q K^T / sqrt(d_k)) V" and "2 x L x H_kv x d_h x s".
- One idea per scene. Show the input, then the operation, then the output. Hold the final state of each scene for 2 seconds.
- Total length 45 to 100 seconds.
- Use the exact labels and numbers from the scene list. Do not invent other numbers.
- A value marked "approximate" or "illustrative" in the scene list keeps that word on screen.

Color legend (use it for every element)
- Query vectors, the requesting side (user, MCP client, the query in RAG): blue #1E6091
- Key vectors, compute and hardware (GPU, provider), keys in an index: gold #B8860B
- Value vectors, the serving side (MCP server, retrieved documents): purple #6A4C93
- Stored state (KV cache blocks, session state, an index, a checkpoint): green #2D6A4F
- Waste, error, fragmentation, attack, a costly recomputation: red #C81D25
- Free or unused memory, transient things, faded parts: gray #8A8A8A, dashed outline
- Ordinary text, tensors and arrows: ink #100D12

Checks before you finish
1. Render the video.
2. Extract one frame at the end of each scene with ffmpeg and look at every frame.
3. Fix every overlap, every cut-off label, every spelling error and every wrong number. Render again.
4. Report: the output path, the duration in m:ss, the file size, and one line per scene.
`````

## Prompts

### Group 1: Math and hardware

#### 1. M01: The dot product as alignment

Output: `public/notes/media/llm-systems/manim/m01-dot-product-alignment.mp4`. Page: L1: Vectors and dot products.

`````text
VIDEO: The dot product as alignment
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m01-dot-product-alignment.mp4
MISUNDERSTANDING TO FIX: The dot product measures only the angle between two vectors, so a longer key can never beat a better-aligned key.

Scene 1. A 2-D grid with the origin. Draw the query q = [1, 2] as a blue (#1E6091) arrow. Label it 'q = [1, 2]' and '‖q‖ = √5 ≈ 2.236'. Text and axes in ink (#100D12).

Scene 2. Draw a gold (#B8860B) key arrow k of length 1 along the direction of q. Rotate k slowly from 0° to 180°. Show live values: the angle θ, cos θ and q · k = ‖q‖ ‖k‖ cos θ. At 0° the dot product is 2.236, at 90° it is 0, at 180° it is −2.236. Show the dot product in red (#C81D25) while it is negative.

Scene 3. During the same rotation, draw the shadow of k on the line of q as a thick ink segment. It shrinks to zero at 90° and points backwards after 90°. Caption: 'dot product = ‖q‖ × signed length of the shadow'.

Scene 4. Stop k at θ = 26.57°. Stretch k from length 1 to length 2. The cosine stays at 0.894. The dot product doubles from 2 to 4. Caption: 'length scales the dot product, not the cosine'.

Scene 5. Show the four toy keys in gold: k_the = [1, 0], k_cat = [0, 2], k_sat = [0, 1], k_down = [1, 1], with q = [1, 2] in blue. A table appears: dot products 1, 4, 2, 3 and cosines 0.447, 0.894, 0.894, 0.949. A red box marks 'cat' as the winner by dot product and 'down' as the winner by cosine.

Scene 6. Scale every arrow to length 1, so that all tips land on a gray (#8A8A8A) dashed unit circle. Now dot product = cosine. Show the identity ‖q̂ − k̂‖² = 2 − 2 cos θ with the value for down: 2 − 2 × 0.9487 = 0.1026.

Scene 7. Summary card in ink: 'a · b = Σ aᵢbᵢ = ‖a‖ ‖b‖ cos θ'. Line 2: 'attention: raw dot product divided by √d_k, length matters'. Line 3: 'retrieval: cosine, only direction matters'.
`````

#### 2. M02: Matrix multiplication is many dot products

Output: `public/notes/media/llm-systems/manim/m02-matmul-many-dot-products.mp4`. Page: L2: Matrices and matrix multiplication.

`````text
VIDEO: Matrix multiplication is many dot products
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m02-matmul-many-dot-products.mp4
MISUNDERSTANDING TO FIX: Matrix multiplication is a mysterious block operation unrelated to dot products, and it costs m·k·n operations.

Scene 1. Show X (3 × 4) with rows labeled the, cat, sat: [1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]. Show W_Q (4 × 2): [[0, 0], [0, 1], [1, 1], [0, 0]], and an empty Q (3 × 2). Show the shapes '(3 × 4)(4 × 2) = (3 × 2)'. The two inner 4s glow, then fade: 'inner sizes match and disappear'. All text in ink (#100D12).

Scene 2. Outline row 'the' and column 1 of W_Q in blue (#1E6091). Slide the row over the column. Show the products 1·0, 0·0, 1·1, 0·0 and their sum 1. Write 1 into Q[the, 1].

Scene 3. Repeat faster for the other five entries, one row-column pair each. Q fills to [[1, 1], [0, 1], [0, 1]]. A counter in the corner reads 'dot products: 6, each 4 multiplications and 3 additions'.

Scene 4. Row view: x_down = [0, 1, 1, 0] selects rows 2 and 3 of W_Q, [0, 1] and [1, 1]. The two rows slide down and add to [1, 2] = q_down. Caption: 'a vector times a matrix is a weighted sum of rows'.

Scene 5. Show K = [[1, 0], [0, 2], [0, 1]] in gold (#B8860B). Flip it into K transposed (rows become columns). Fill QK^T = [[1, 2, 1], [0, 2, 1], [0, 2, 1]], lighting each cell as one query-key dot product.

Scene 6. Cost: show the formula 2mkn. For the toy: 2 × 3 × 4 × 2 = 48 FLOPs (exact count 42). Then the real case: the W_Q projection of Llama-3.1-8B on 2,000 tokens, 2 × 2000 × 4096 × 4096 ≈ 67.1 GFLOP.

Scene 7. Weight reuse. A gold block shows one 4096 × 4096 BF16 weight matrix (32 MiB). With 1 input row (a GEMV) the block is read once for about 33.6 MFLOP: intensity about 1 FLOP per byte, marked red (#C81D25). With 64 rows the same single read serves all 64 rows: intensity about 62 FLOPs per byte.
`````

#### 3. M03: The roofline: memory-bound versus compute-bound

Output: `public/notes/media/llm-systems/manim/m03-roofline.mp4`. Page: L5: GPUs, memory and bandwidth.

`````text
VIDEO: The roofline: memory-bound versus compute-bound
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m03-roofline.mp4
MISUNDERSTANDING TO FIX: A GPU with more TFLOPS always generates tokens faster, because decode speed depends on compute.

Scene 1. Two numbers of an H100 SXM appear in gold (#B8860B): dense BF16 peak 989.5 TFLOPS (approximate, half of the 1,979 'with sparsity' value) and HBM bandwidth 3.35 TB/s. Below, in ink (#100D12): one decode token of Llama-3.1-8B needs 16.06 GFLOP and reads 16.06 GB of weights.

Scene 2. Two timers race. The compute timer stops at 16.2 µs. The memory timer stops at 4.79 ms. Caption: 'the step takes the longer one: 4.79 ms, so at most 208.6 tokens per second'. The idle compute time is shaded red (#C81D25).

Scene 3. Build a log-log chart. x: arithmetic intensity in FLOPs per byte, 0.1 to 10,000. y: attainable TFLOPS. Draw the slanted line P = I × 3.35 and the flat roof at 989.5 in gold. They meet at the ridge I* = 989.5 / 3.35 ≈ 295 (dashed vertical line). Label the left region 'memory-bound' in red and the right region 'compute-bound' in ink.

Scene 4. A red dot at I ≈ 1: decode at batch 1, 3.35 TFLOPS, about 0.34% of peak. Animate a linear layer as the batch grows 1, 8, 64, 512: the dot climbs the slope at I ≈ 1, 7.97, 62 and 410. At 512 it reaches the roof and turns ink.

Scene 5. A second red dot for decode attention of Llama-3.1-8B stays fixed at I = H / H_kv = 32 / 8 = 4 (13.4 TFLOPS) while the batch grows. Green (#2D6A4F) KV cache blocks, one stack per sequence, multiply beside it. Caption: 'each sequence reads its own KV cache: no reuse'.

Scene 6. A dot for prefill of 2,000 tokens appears on the roof at I ≈ 2,065 (approximate): compute-bound, about 33.5 ms ideal for 33.2 TFLOP.

Scene 7. Overlay two more GPUs. A100 80 GB SXM as a dashed ink line: slope 2.039 TB/s, roof 312, ridge about 153. H200 SXM: the same roof of 989.5 but a steeper slope of 4.8 TB/s, ridge about 206. The batch-1 decode dot rises from 3.35 to 4.8 TFLOPS: about 1.43 times faster decode with the same TFLOPS. Caption: 'decode speed follows bandwidth'.
`````

### Group 2: Attention and the transformer

#### 4. M04: Attention as a soft lookup, with the toy numbers

Output: `public/notes/media/llm-systems/manim/m04-attention-soft-lookup.mp4`. Page: L3: Scaled dot-product attention, step by step.

`````text
VIDEO: Attention as a soft lookup, with the toy numbers
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m04-attention-soft-lookup.mp4
MISUNDERSTANDING TO FIX: Attention picks the single most relevant token, like a dictionary lookup that returns one value.

Scene 1. Three token boxes in a row: "the", "cat", "sat". Under each box, its key in gold and its value in purple: the k = [1, 0], v = [2, 3]; cat k = [0, 2], v = [2, 2]; sat k = [0, 1], v = [1, 2]. Above, the query of "sat" in blue: q = [0, 1]. Caption: "query, keys, values".

Scene 2. Blue arrows from q to each gold key. Next to each key, the dot product appears step by step: 0*1 + 1*0 = 0, 0*0 + 1*2 = 2, 0*0 + 1*1 = 1. Ink text.

Scene 3. Each score is divided by sqrt(2) = 1.4142. The scores change to 0, 1.4142, 0.7071. Caption: "scale by 1/sqrt(d_k), d_k = 2".

Scene 4. A hard lookup for contrast: the best key ("cat", score 2) lights up and its value [2, 2] is copied out. Then a red cross over it with the caption "hard lookup: one value, no useful gradient". Fade it to gray.

Scene 5. Softmax: three bars grow from 0 to 0.1400 (the), 0.5760 (cat), 0.2840 (sat). A brace shows that they sum to 1. Caption: "weights are positive and sum to 1".

Scene 6. A 2D plane with the three purple value points [2, 3], [2, 2], [1, 2] forming a triangle. Each point is scaled by its weight and the three scaled arrows add tip to tail. The output point [1.7160, 2.1400] appears inside the triangle in purple with a bold outline. Caption: "0.1400 [2, 3] + 0.5760 [2, 2] + 0.2840 [1, 2] = [1.7160, 2.1400]".

Scene 7. The matrix form for all three tokens: Q (blue, [[1, 1], [0, 1], [0, 1]]), K (gold), V (purple), the weight matrix P with rows [0.2483, 0.5035, 0.2483], [0.1400, 0.5760, 0.2840], [0.1400, 0.5760, 0.2840], and the outputs [[1.7517, 2.2483], [1.7160, 2.1400], [1.7160, 2.1400]]. Final caption: "Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V".
`````

#### 5. M05: The causal mask and one decode step

Output: `public/notes/media/llm-systems/manim/m05-causal-mask-and-decode.mp4`. Page: L4: Causal masking and generation.

`````text
VIDEO: The causal mask and one decode step
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m05-causal-mask-and-decode.mp4
MISUNDERSTANDING TO FIX: Each new token makes the model recompute the keys and values of all earlier tokens, and the causal mask hides the prompt from the answer.

Scene 1. A 3 by 3 grid of scaled scores for "the cat sat". Row labels (queries) in blue: the, cat, sat. Column labels (keys) in gold: the, cat, sat. Values: [0.7071, 1.4142, 0.7071], [0, 1.4142, 0.7071], [0, 1.4142, 0.7071].

Scene 2. The mask: the three cells above the diagonal turn red and their numbers change to minus infinity. Caption: "query i may read key j only if j <= i".

Scene 3. Row-wise softmax. The rows become [1, 0, 0], [0.1956, 0.8044, 0], [0.1400, 0.5760, 0.2840]. The red cells show 0. Caption: "exp(-infinity) = 0, each row still sums to 1".

Scene 4. The keys [1, 0], [0, 2], [0, 1] (gold) and the values [2, 3], [2, 2], [1, 2] (purple) move into two stacks with a green outline labeled "KV cache, stored by the prefill".

Scene 5. A new token "down" with x = [0, 1, 1, 0] arrives. It projects once into q4 = [1, 2] (blue), k4 = [1, 1] (gold) and v4 = [1, 3] (purple). k4 and v4 slide into the cache as a fourth row with a dashed gray outline that then turns green. The three old rows do not move or change.

Scene 6. q4 scores the four cached keys: 1, 4, 2, 3. Divide by sqrt(2): 0.7071, 2.8284, 1.4142, 2.1213. Softmax: 0.0646, 0.5388, 0.1310, 0.2657. Mix the values: o4 = [1.6034, 2.3302] in purple. Caption: "no mask needed for the newest token".

Scene 7. For comparison, the full 4 by 4 causal computation appears with the red upper triangle. Its first three rows are highlighted in green and are identical to the prefill rows. Its last row equals [1.6034, 2.3302]. Final caption: "earlier keys and values never change, so the model caches them".
`````

#### 6. M06: Why attention divides by the square root of d_k

Output: `public/notes/media/llm-systems/manim/m06-why-scale-by-sqrt-dk.mp4`. Page: L3: Scaled dot-product attention, step by step.

`````text
VIDEO: Why attention divides by the square root of d_k
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m06-why-scale-by-sqrt-dk.mp4
MISUNDERSTANDING TO FIX: The 1/sqrt(d_k) factor is a cosmetic constant, or it only prevents overflow.

Scene 1. Histograms of the dot product of two random vectors whose entries have mean 0 and variance 1, for d_k = 2, 16 and 128 (ink outlines). The histograms get wider. Labels: standard deviation 1.41, 4 and 11.31. Caption: "variance of q . k = d_k".

Scene 2. The derivation, one line at a time: E[q_i k_i] = 0, Var(q_i k_i) = E[q_i^2] E[k_i^2] = 1, Var(q . k) = d_k, Var(q . k / sqrt(d_k)) = 1.

Scene 3. Four scores with a spread of about 1: 1.2, 0.3, -0.5, -1.0. Their softmax as blue bars: 0.588, 0.239, 0.108, 0.065. Caption: "scaled: a blend".

Scene 4. The same scores times sqrt(128) = 11.31: 13.58, 3.39, -5.66, -11.31. The bars collapse in red to 1.000, 0.00004, 0.000, 0.000. Caption: "unscaled at d_k = 128: almost one-hot".

Scene 5. The softmax derivative dp_i/dz_j = p_i (delta_ij - p_j). Two gradient arrows: the blue one labeled 0.2422 (largest entry, scaled) and a tiny red one labeled 0.0000378 (unscaled). Caption: "about 6,400 times weaker learning signal".

Scene 6. A simulated curve (approximate): average largest weight over 16 random keys against log2(d_k) from 0 to 8. Red points (unscaled) rise from 0.21 to 0.92. Blue points (scaled) stay near 0.24. Caption: "simulated, approximate".

Scene 7. Three options side by side: divide by sqrt(d_k) gives variance 1 (blue, check mark). Divide by d_k gives standard deviation about 0.088 and almost uniform weights (gray). No division gives saturation (red). Final caption: "sqrt(d_k), not d_k".
`````

#### 7. M07: Multi-head attention: split, attend, concatenate

Output: `public/notes/media/llm-systems/manim/m07-multi-head-split-concat.mp4`. Page: L5: Multi-head attention.

`````text
VIDEO: Multi-head attention: split, attend, concatenate
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m07-multi-head-split-concat.mp4
MISUNDERSTANDING TO FIX: Each head sees only a slice of each token, and more heads cost more compute.

Scene 1. Show the toy hidden states X as a 4 x 4 grid in ink, rows labeled the, cat, sat, down: [1,0,1,0], [0,1,0,1], [1,1,0,0], [0,1,1,0]. Caption: 'One head gives each token one weighted average.' Show the row of sat in head 1 with weights [0.1400, 0.5760, 0.2840] blending three value vectors into [1.7160, 2.1400].

Scene 2. Multiply X by W_Q (4 x 4) to get X W_Q = [[1,1,1,0],[0,1,1,0],[0,1,2,0],[1,2,1,0]] in blue #1E6091. Color columns 1-2 dark blue (head 1) and columns 3-4 light blue (head 2). Caption: 'Every head reads all 4 numbers of every token.'

Scene 3. Animate the reshape to [4, 2, 2] and the transpose to [2, 4, 2]: the two column blocks slide apart into Q_1 = [[1,1],[0,1],[0,1],[1,2]] and Q_2 = [[1,0],[1,0],[2,0],[1,0]]. Show K split the same way in gold #B8860B and V in purple #6A4C93.

Scene 4. Run attention per head. Show the weights of the row down as two bar charts: head 1 [0.0646, 0.5388, 0.1310, 0.2657] with its peak on cat, head 2 [0.4486, 0.1091, 0.2212, 0.2212] with its peak on the. Caption: 'Two attention patterns for the same token.'

Scene 5. Show head_1 outputs [[2,3],[2,2.1956],[1.716,2.14],[1.6034,2.3302]] in dark purple and head_2 outputs [[1,0],[0.8044,0.3911],[0.9546,0.2775],[0.6698,0.6605]] in light purple. Transpose back and reshape: they join side by side into Concat [4, 4], for example the row down = [1.6034, 2.3302, 0.6698, 0.6605].

Scene 6. Multiply Concat by W_O = [[1,0,0,1],[0,1,1,0],[1,1,0,0],[0,0,1,1]]. For the token the, show [2,3,1,0] times each column giving y = [3,4,3,2]. Then show the sum form: head 1 part [2,3,3,2] plus head 2 part [1,1,0,0] equals [3,4,3,2].

Scene 7. Scale up to Llama-3.1-8B: [B, T, 4096] -> [B, T, 32, 128] -> [B, 32, T, 128]. Show the FLOP count 8Td^2 + 4T^2 d, the same for 1 head of 4096 or 32 heads of 128. Show 8 KV heads in gold, each shared by a group of 4 query heads in blue. Caption: '41,943,040 attention parameters per layer.'
`````

#### 8. M08: One token through one transformer block

Output: `public/notes/media/llm-systems/manim/m08-transformer-block-data-flow.mp4`. Page: L6: The transformer block, end to end.

`````text
VIDEO: One token through one transformer block
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m08-transformer-block-data-flow.mp4
MISUNDERSTANDING TO FIX: A layer replaces the hidden state, and the position of a token is added once at the input.

Scene 1. Draw the residual stream as a thick vertical ink #100D12 line. A token vector x of shape [1, 4096] rides on it (decode step at position t). Caption: 'Each sub-layer adds a change. It never replaces x.'

Scene 2. A copy of x branches off into RMSNorm. Show the toy example: [1, 0, 1, 0], mean of squares 0.5, RMS 0.7071, output [1.4142, 0, 1.4142, 0]. Then [3, 0, 3, 0] gives the same output. The original x stays on the stream.

Scene 3. The normalized copy is projected: q [1, 4096] -> [32, 1, 128] in blue #1E6091, k and v [1, 1024] -> [8, 1, 128] in gold #B8860B and purple #6A4C93. RoPE rotates each pair of q and k by an angle proportional to t. v is not rotated. Show one 2D pair rotating.

Scene 4. k and v are appended to the KV cache of this layer, a green #2D6A4F box that grows from [8, t, 128] to [8, t+1, 128]. Attention reads all cached keys and values. Each group of 4 query heads shares one KV head. The 32 head outputs concatenate to [1, 4096] and pass through W_O.

Scene 5. The attention result joins the stream at a plus sign: h = x + Attn(RMSNorm(x)). A second copy branches off into RMSNorm 2.

Scene 6. SwiGLU MLP with the toy numbers: gate [2, -1, -2] -> SiLU [1.7616, -0.2689, -0.2384], up [1, 2, 2], product [1.7616, -0.5379, -0.4768], down projection. Real shapes: [1, 4096] -> [1, 14336] -> [1, 4096]. The result joins the stream at the second plus sign: out = h + MLP(RMSNorm(h)).

Scene 7. Stack 32 blocks. Each block has its own green KV cache box, so one token adds 4,096 bytes per layer and 128 KiB in total. After block 32: final RMSNorm, then the LM head gives [1, 128256] logits. Caption: '8,030,261,248 parameters, about 15.0 GFLOPs per token for the weights.'
`````

#### 9. M09: The online softmax over tiles

Output: `public/notes/media/llm-systems/manim/m09-online-softmax-over-tiles.mp4`. Page: L7: The cost of attention and FlashAttention.

`````text
VIDEO: The online softmax over tiles
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m09-online-softmax-over-tiles.mp4
MISUNDERSTANDING TO FIX: FlashAttention approximates attention, and softmax needs the whole row of scores at once.

Scene 1. Show the row of down: scaled scores [0.7071, 2.8284, 1.4142, 2.1213] over the keys the, cat, sat, down, and the values [2,3], [2,2], [1,2], [1,3]. The plain softmax gives weights [0.0646, 0.5388, 0.1310, 0.2657] and output [1.6034, 2.3302]. Caption: 'The plain softmax needs the maximum of the whole row first.'

Scene 2. Draw a large far box HBM and a small near box SRAM. In standard attention, the full score matrix S and the matrix P move to HBM and back as red #C81D25 arrows. Label: '128 MiB each per head at T = 8,192'.

Scene 3. Tile 1 (the, cat) enters SRAM with scores [0.7071, 2.8284]. A sticky note shows m = 2.8284, p = [0.1199, 1], l = 1.1199, unnormalized output [2.2397, 2.3596].

Scene 4. Tile 2 (sat, down) enters with scores [1.4142, 2.1213]. The maximum stays 2.8284, so the rescale factor is 1. p = [0.2431, 0.4931], l = 1.8561, unnormalized output [2.9759, 4.3251]. Divide: [1.6034, 2.3302]. A check mark: equal to the plain result.

Scene 5. Replay with the tiles in reverse order. After tile 2: m = 2.1213, l = 1.4931, output [1.4931, 3.9861]. Tile 1 brings 2.8284: the old note shrinks by the factor e^(-0.7071) = 0.4931 (flash red), then l = 1.8561 and output [2.9759, 4.3251]. The result is again [1.6034, 2.3302].

Scene 6. Zoom out to a grid of query tiles (blue) and key/value tiles (gold). Tiles above the diagonal are gray dashed and skipped. Each query tile sweeps left to right. Only O and the logsumexp L (3.4469 for the row down) go back to HBM. S and P never leave SRAM.

Scene 7. Summary card with the FlashAttention paper's GPT-2 medium numbers: 66.6 vs 75.2 GFLOPs, HBM traffic 40.3 GB vs 4.4 GB, runtime 41.7 ms vs 7.3 ms. Caption: 'Same math, exact result, far fewer bytes.'
`````

### Group 3: The KV cache

#### 10. M10: The same decode step: recompute everything vs read the KV cache

Output: `public/notes/media/llm-systems/manim/m10-recompute-vs-cache.mp4`. Page: L1: Why the KV cache exists.

`````text
VIDEO: The same decode step: recompute everything vs read the KV cache
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m10-recompute-vs-cache.mp4
MISUNDERSTANDING TO FIX: The KV cache is an approximation, or past keys and values change when a new token arrives, so they must be recomputed.

Scene 1. Title card: 'Why the KV cache exists'. Show four token boxes in a row in ink: 'the', 'cat', 'sat', and a faded gray dashed box 'down' that has not arrived yet. Caption: 'Toy model: d = 4, one head, d_h = 2'.

Scene 2. Prefill of 'the cat sat'. Each token row x multiplies W_K and W_V. Show the results appearing as rows: keys in gold [1, 0], [0, 2], [0, 1]; values in purple [2, 3], [2, 2], [1, 2]. Label: 'step 3: 3 keys and 3 values'.

Scene 3. 'down' arrives (x = [0, 1, 1, 0]). Left half of the screen titled 'Without a cache': all four token rows multiply W_K and W_V again. The three old key rows and value rows reappear with exactly the same numbers and flash red with the label 'recomputed, identical'. Counter at the bottom: '12 row projections, 3 new'.

Scene 4. Right half titled 'With a KV cache': the three old key and value rows slide into a green box labeled 'KV cache'. Only 'down' is projected: q4 = [1, 2] in blue, k4 = [1, 1] in gold, v4 = [1, 3] in purple. k4 and v4 append to the bottom of the green box. Counter: '3 row projections'.

Scene 5. Attention for 'down' using the cache: dot products of q4 with the four keys give raw scores [1, 4, 2, 3]; divide by sqrt(2) to get [0.7071, 2.8284, 1.4142, 2.1213]; softmax gives weights [0.0646, 0.5388, 0.1310, 0.2657] drawn as bar heights over the four value rows.

Scene 6. Weighted sum of the value rows gives o4 = [1.6034, 2.3302]. Both halves of the screen show the same o4 with a check mark. Caption: 'Same answer. The cache changes the work, not the result.'

Scene 7. Zoom out to a 32-layer stack: each layer has its own green cache, and each new token appends one entry per layer. Caption: 'Causal mask + per-token operations: past keys and values never change. Llama-3.1-8B stores 128 KiB per token.'
`````

#### 11. M11: Prefill then decode: one big compute-bound pass, then many memory-bound steps

Output: `public/notes/media/llm-systems/manim/m11-prefill-then-decode.mp4`. Page: L2: Prefill and decode.

`````text
VIDEO: Prefill then decode: one big compute-bound pass, then many memory-bound steps
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m11-prefill-then-decode.mp4
MISUNDERSTANDING TO FIX: Decode is slow because it does a lot of arithmetic, and batching makes decode compute-bound.

Scene 1. Title card: 'Prefill and decode'. A GPU drawn in gold with two parts: a large compute block labeled 'about 989 TFLOP/s (BF16, dense)' and an HBM memory block labeled 'HBM, about 3.35 TB/s'. The HBM holds a box 'weights 16.06 GB' (Llama-3.1-8B) and an empty green region 'KV cache'.

Scene 2. Prefill: a matrix of 2,000 prompt rows [1, 2000, 4096] enters. The weights stream once from HBM to the compute block. The compute block stays busy for a long time. Labels: 'about 2.9 × 10^13 FLOPs', 'about 29.3 ms', 'about 1,775 FLOPs per byte: compute-bound'. The green KV cache region fills with 2,000 entries (0.26 GB).

Scene 3. The last position's logits produce token t1 (blue arrow). Caption: 'TTFT is mostly prefill'.

Scene 4. Decode step 1: a single row [1, 1, 4096] enters. The entire 16.06 GB of weights and the whole green cache stream from HBM. The compute block lights up only for a moment. Labels: 'about 1.6 × 10^10 FLOPs', 'about 4.87 ms', 'about 1 FLOP per byte: memory-bound'. One new green entry appends to the cache; token t2 appears.

Scene 5. Repeat three decode steps quickly. Each step: weights stream again, cache grows by one, a token appears. A timeline at the bottom, drawn to scale: one long gold prefill block of 29.3 ms, then short white decode blocks of 4.87 ms each. Bracket labels 'TTFT' and 'TPOT'.

Scene 6. Batching: 64 sequences decode together. The weights stream once for all 64 (thick arrow labeled 'shared'), but 64 separate green caches each stream on their own (64 thin arrows labeled 'not shared'). Labels at context 2,000: 'batch 1: 205 tokens/s', 'batch 64: 6,529 tokens/s (ideal)'.

Scene 7. An intensity axis on a log scale from 0.1 to 10,000 with a dashed ridge at 295. Dots: 'decode batch 1 ≈ 0.98' and 'decode attention = H / H_kv = 4' in red on the left, 'prefill ≈ 1,775' in gold on the right. Caption: 'Batching shares weight reads, not cache reads.'
`````

#### 12. M12: The KV cache filling GPU memory

Output: `public/notes/media/llm-systems/manim/m12-cache-filling-gpu-memory.mp4`. Page: L3: The KV cache size formula.

`````text
VIDEO: The KV cache filling GPU memory
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m12-cache-filling-gpu-memory.mp4
MISUNDERSTANDING TO FIX: Once the model weights fit on the GPU, memory is no longer a problem, and the cache is small compared with the model.

Scene 1. Title card: 'KV bytes = 2 × L × H_kv × d_h × s × T × B'. Each factor appears one by one with its Llama-3.1-8B value: 2 (key and value), 32 layers, 8 KV heads, 128 numbers per head vector, 2 bytes (BF16). The product resolves to '131,072 bytes = 128 KiB per token' in green.

Scene 2. A long horizontal bar for an H100 with 80 GiB (assumed exposed). A dashed gray reserve of 8 GiB at the right end (gpu_memory_utilization 0.90). A dark block 'weights 14.96 GiB' at the left, then a gray dashed block 'other 4 GiB (assumed)'. The rest, 53.04 GiB, is an empty green-outlined region labeled 'KV cache budget'.

Scene 3. Requests arrive as colored labels 'R1', 'R2', ... Each request's cache grows block by block (blocks of 16 tokens, 2 MiB each across all layers). Requests of 8,192 tokens take exactly 1 GiB each. A counter shows requests running: 1, 2, ..., 53.

Scene 4. The green region is full at 53 requests (434,523 tokens). Request 54 arrives and waits in a queue drawn on the side, outlined in red with the label 'no memory: wait or preempt'.

Scene 5. Replay with the same bar but every request reserves the full 131,072-token context (16 GiB each). Only 3 requests fit, and most of their reserved space stays empty and is shaded red as waste. Caption: 'Reserving the maximum length: 3 requests'.

Scene 6. A line chart: cache size in GiB vs cached tokens (0 to 131,072). Blue line for Llama-3.1-8B rising to 16 GiB, purple line for Llama-3.1-70B rising to 40 GiB, and a horizontal ink line at 14.96 GiB for the 8B weights. The blue line crosses the weight line near 122,532 tokens, marked with a dot.

Scene 7. Summary card with three levers drawn as arrows that shrink the bar: 'GQA: fewer KV heads (512 KiB to 128 KiB)', 'FP8 cache: s = 1 (128 KiB to 64 KiB)', 'paged blocks: no reservation waste'. Caption: 'The cache, not the model, sets how many requests fit.'
`````

#### 13. M13: The KV cache append, line by line

Output: `public/notes/media/llm-systems/manim/m13-the-cache-append-in-code.mp4`. Page: L4: Implementing a KV cache.

`````text
VIDEO: The KV cache append, line by line
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m13-the-cache-append-in-code.mp4
MISUNDERSTANDING TO FIX: The KV cache is a complicated system; in fact the core of it is two concatenate lines that append one key row and one value row per layer, and old rows never change.

Scene 1. Show three rows of the toy prompt 'the', 'cat', 'sat' with their keys in gold: K_cache = [[1, 0], [0, 2], [0, 1]], and their values in purple: V_cache = [[2, 3], [2, 2], [1, 2]]. Draw both tables inside one green rounded box labeled 'KV cache, one layer'.

Scene 2. The new token 'down' appears in ink as x_down = [0, 1, 1, 0]. Three arrows multiply it by W_Q, W_K, W_V and produce q4 = [1, 2] in blue, k4 = [1, 1] in gold and v4 = [1, 3] in purple. A caption says: 'Only the new token is projected.'

Scene 3. Show the Python line 'K_cache = np.concatenate([K_cache, k], axis=0)' in a code box. Animate the gold row [1, 1] sliding down into a new fourth row of K_cache. Repeat for the value line and the purple row [1, 3]. The three old rows stay still and get a green check mark with the label 'unchanged'.

Scene 4. The blue query q4 = [1, 2] forms dot products with all four gold key rows. Show the raw scores [1, 4, 2, 3], then divide by sqrt(2) to show [0.7071, 2.8284, 1.4142, 2.1213].

Scene 5. A softmax turns the scores into weights [0.0646, 0.5388, 0.1310, 0.2657], drawn as four bars. Each bar scales its purple value row, and the rows add up to the output o4 = [1.6034, 2.3302] in ink.

Scene 6. Zoom out to a stack of L layers, each with its own green K and V boxes of shape [B, H_kv, T, d_h]. A blue arrow labeled 'decode step' appends one new slot in every layer at the same time. Caption: 'Llama-3.1-8B: 32 layers, 128 KiB per token'.

Scene 7. Split the screen. Left: 'dynamic cache', where torch.cat copies all rows into a longer tensor and the copied rows flash red. Right: 'static cache', a gray dashed buffer of 8 slots where index_copy_ writes 'down' into slot 3 and slots 4 to 7 stay gray and masked. Caption: 'Same output, different memory behavior.'
`````

#### 14. M14: Grouped-query attention: query heads share KV heads

Output: `public/notes/media/llm-systems/manim/m14-gqa-head-sharing.mp4`. Page: L5: MHA, MQA, GQA and MLA.

`````text
VIDEO: Grouped-query attention: query heads share KV heads
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m14-gqa-head-sharing.mp4
MISUNDERSTANDING TO FIX: GQA reduces the number of attention patterns; in fact every query head still computes its own scores, and only the cached keys and values are shared within a group.

Scene 1. Show 8 blue query-head boxes numbered 1 to 8 in a row. Below them, 8 pairs of a gold K box and a purple V box, one pair per query head, connected by straight lines. Title: 'MHA: 8 KV heads'. A green counter shows 'cached per token per layer: 2 x 8 x 128 = 2,048 numbers'.

Scene 2. The 8 KV pairs merge into 2 pairs. Heads 1 to 4 connect to KV head 0 and heads 5 to 8 connect to KV head 1. Title changes to 'GQA: 2 KV heads, group size G = 4'. The counter drops to '2 x 2 x 128 = 512 numbers'.

Scene 3. Highlight query head 3 (index 2 counting from 0). Show the rule 'KV head = floor(h / G)' and compute floor(2 / 4) = 0. The line from head 3 to KV head 0 glows.

Scene 4. Show that each of the 4 query heads in group 0 produces a different row of attention weights over the same 5 cached keys, drawn as 4 different bar charts in blue. Caption: 'Same keys, different queries, different patterns.'

Scene 5. Show memory reads. In red, way 1 copies each KV head 4 times (repeat_kv) and reads 1,280 bytes of keys. In green, way 2 reshapes the queries into groups and reads the 320 bytes of keys once. Both produce the same output, with an equality sign between them.

Scene 6. Collapse to 1 KV pair connected to all 8 query heads. Title: 'MQA: 1 KV head'. Counter: '2 x 128 = 256 numbers'. A small red note: 'lower quality, unstable fine-tuning (GQA paper)'.

Scene 7. Summary table appears: Llama-3.1-8B, 32 query heads, 8 KV heads, 128 KiB per token instead of 512 KiB; Llama-3.1-70B, 64 query heads, 8 KV heads, 320 KiB instead of 2,560 KiB. Caption: 'Saving factor = H / H_kv'.
`````

#### 15. M15: Sliding windows and attention sinks

Output: `public/notes/media/llm-systems/manim/m15-sliding-window-and-attention-sinks.mp4`. Page: L6: Shrinking the KV cache.

`````text
VIDEO: Sliding windows and attention sinks
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m15-sliding-window-and-attention-sinks.mp4
MISUNDERSTANDING TO FIX: You can keep only the most recent tokens of any model's cache; in fact a full-attention model collapses when its first tokens leave, because they act as attention sinks.

Scene 1. Draw a 12 by 12 grid. Rows are query positions q0 to q11 in blue, columns are key positions k0 to k11 in gold. Fill the lower triangle in light gold: full causal attention. Caption: 'cache at token 11: 12 tokens'.

Scene 2. Keep only the last 4 columns visible in each row: a band of width 4 along the diagonal. Cells to the left of the band turn into red outlines. Caption: 'sliding window, W = 4: cache at token 11: 4 tokens'.

Scene 3. Show a ring buffer of 4 green slots. Tokens 0 to 9 arrive one by one, and token p drops into slot p mod 4, overwriting the old one. The final state reads slots [8, 9, 6, 7]. Caption: 'Mistral 7B: W = 4,096, slot = i mod W'.

Scene 4. Show one query's 8 scores [4.0, 0.5, 0.2, 0.8, 0.1, 0.3, 0.6, 0.4] and softmax bars. The first bar, token 0, is tall at 0.834 and colored green with the label 'sink'.

Scene 5. Remove token 0 in red. The other 7 bars grow about 6.03 times to [0.152, 0.112, 0.205, 0.102, 0.124, 0.168, 0.137]. Caption: 'Weights must sum to 1: the surplus moves elsewhere and the output breaks.'

Scene 6. Return to the grid. Columns k0 to k3 stay visible in every row and turn green: 4 sink tokens. The band of 4 recent tokens stays gold. Caption: 'StreamingLLM: 4 sinks + recent window: cache at token 11: 8 tokens'.

Scene 7. Show the cache [tok 0, tok 1, tok 2, tok 3, tok 6, tok 7, tok 8, tok 9] with tokens 4 and 5 gray dashed and labeled 'evicted'. Below the kept tokens, blue labels show positions 0 to 7. Caption in gold: 'keys stored before RoPE, rotated with cache positions each step; the middle is forgotten'.
`````

### Group 4: The PagedAttention paper

#### 16. P01: Contiguous allocation and its three kinds of waste

Output: `public/notes/media/papers/2023-pagedattention/manim/p01-contiguous-allocation-waste.mp4`. Page: 03 The question: where does KV cache memory go?.

`````text
VIDEO: Contiguous allocation and its three kinds of waste
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\papers\2023-pagedattention\manim\p01-contiguous-allocation-waste.mp4
MISUNDERSTANDING TO FIX: That the KV cache memory of earlier serving systems was mostly full of useful data, and that knowing the output length would fix the waste.

Scene 1. A horizontal row of 32 equal slots labeled 'GPU KV cache pool: 32 slots' in ink #100D12, all slots empty with gray #8A8A8A dashed outlines. A caption reads 'Toy rule: each request reserves one contiguous chunk for its maximum length, 12 slots'.

Scene 2. Request A arrives. A thick ink outline grows over slots 0 to 11, labeled 'chunk A: 12 slots'. Three slots fill with green #2D6A4F boxes labeled 'A' (the prompt), then two more green boxes appear one at a time (two generated tokens). Counter: 'A: 5 token states'.

Scene 3. The two slots after A's tokens get a red #C81D25 outline labeled 'reserved: 2 (used later)'. A clock icon shows that they stay blocked now. Then the last 5 slots of chunk A fill solid red, labeled 'internal fragmentation: 5 (never used, A ends at 7 tokens)'.

Scene 4. Slots 12 to 15 appear as a gray #8A8A8A dashed gap labeled 'left by a finished request: 4 slots'. Chunk B (slots 16 to 23, 8 slots) appears with 3 green 'B' tokens, 1 red-outlined reserved slot and 4 solid red internal fragmentation slots. Slots 24 to 31 stay gray dashed, labeled 'free: 8'.

Scene 5. Request C arrives, drawn as a blue #1E6091 bar of 12 slots labeled 'C needs 12 contiguous slots'. It slides over the 4-slot gap (too short, flashes red) and then over the 8-slot free run (too short, flashes red). Text: 'Free: 4 + 8 = 12 slots, longest run 8. C waits.' The 4-slot gap gets the label 'external fragmentation'.

Scene 6. A tally appears: 'token states 8, reserved 3, internal 9, external 4, free 8, total 32'. Then the paper's measured shares appear as stacked bars (exact labels from Figure 2): 'Orca (Max) 20.4% token states', 'Orca (Pow2) 26.8%', 'Orca (Oracle) 38.2%', 'vLLM 96.3%'. The Oracle bar is highlighted with the note 'knows every output length, still 38.2%'.

Scene 7. The same 32 slots regroup into 8 blocks of 4 slots with green outlines. A takes blocks 0 and 3, B takes block 1, C takes block 4, and four blocks stay free. Caption: 'Blocks on demand: no reservation for the maximum, no external gaps, at most B - 1 = 3 empty slots per request'.
`````

#### 17. P02: Attention computed block by block

Output: `public/notes/media/papers/2023-pagedattention/manim/p02-attention-block-by-block.mp4`. Page: 04 PagedAttention: the algorithm.

`````text
VIDEO: Attention computed block by block
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\papers\2023-pagedattention\manim\p02-attention-block-by-block.mp4
MISUNDERSTANDING TO FIX: That attention over keys and values in scattered blocks is an approximation, or that each block can normalize its own softmax.

Scene 1. Four tokens 'the', 'cat', 'sat', 'down' in a row, labeled 'logical view, positions 0 to 3'. Under each token, its key in gold #B8860B and its value in purple #6A4C93: the k=[1,0] v=[2,3], cat k=[0,2] v=[2,2], sat k=[0,1] v=[1,2], down k=[1,1] v=[1,3].

Scene 2. The tokens split into two logical blocks of size B = 2 with dashed outlines: 'logical block 0: the, cat' and 'logical block 1: sat, down'. They fly into a pool of 6 physical blocks drawn as a vertical stack, landing in physical block 4 and physical block 1 (green #2D6A4F outlines). Blocks 0 and 2 are gray filled 'other request', blocks 3 and 5 are gray #8A8A8A dashed 'free'. A small table appears: 'block table: 0 -> 4, 1 -> 1'.

Scene 3. The query of 'down', q4 = [1, 2], appears in blue #1E6091. An arrow from the block table row '0 -> 4' leads it to physical block 4. Dot products appear: q4 . [1,0] = 1, q4 . [0,2] = 4. They divide by sqrt(2) to 0.7071 and 2.8284, then become exponentials 2.0281 and 16.9188. A box shows 'block total 18.9469'.

Scene 4. The query follows the row '1 -> 1' to physical block 1. Scores 2 and 3, scaled 1.4142 and 2.1213, exponentials 4.1133 and 8.3421, 'block total 12.4554'.

Scene 5. The two block totals slide together into one ink #100D12 box: 'denominator = 18.9469 + 12.4554 = 31.4023'. A red #C81D25 crossed-out alternative shows 'each block divides by its own total: wrong', with block 1 alone giving [0.1070, 0.8930].

Scene 6. Weights appear above each token: 0.0646, 0.5388 in block 1 and 0.1310, 0.2657 in block 2. Each block multiplies its purple values: block part 1 = [1.2067, 1.2713], block part 2 = [0.3966, 1.0589]. The parts add to o4 = [1.6034, 2.3302].

Scene 7. A side panel shows normal attention over the contiguous row of four tokens with the same weights [0.0646, 0.5388, 0.1310, 0.2657] and the same output [1.6034, 2.3302]. A checkmark and the caption 'PagedAttention is exact: same arithmetic, grouped by block, read through the block table'.
`````

#### 18. P03: The block table fills step by step

Output: `public/notes/media/papers/2023-pagedattention/manim/p03-block-table-filling.mp4`. Page: 05 The KV cache manager and block tables.

`````text
VIDEO: The block table fills step by step
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\papers\2023-pagedattention\manim\p03-block-table-filling.mp4
MISUNDERSTANDING TO FIX: vLLM reserves memory for the maximum length of a request, or keeps the KV cache of a request in one contiguous piece of memory.

Scene 1. On the right, a column titled 'Physical KV blocks (GPU DRAM)' with nine blocks numbered 0 to 8, each with 4 empty slots drawn with gray #8A8A8A dashed outlines. At the bottom, a row titled 'Free block queue' shows the numbers 7, 1, 3, 5, 2, 0, 4, 6, 8. A caption at the top reads 'Block size B = 4'.

Scene 2. Request A appears on the left as the blue #1E6091 prompt 'Four score and seven years ago our' with the label '7 tokens'. An empty block table with the columns 'Logical', 'Physical' and '# filled' appears in the middle. Text: 'Prefill needs ceil(7 / 4) = 2 blocks'.

Scene 3. The numbers 7 and 1 leave the front of the free queue. The words 'Four', 'score', 'and', 'seven' fly into block 7 and fill it with green #2D6A4F slots. The words 'years', 'ago', 'our' fill three slots of block 1. The fourth slot of block 1 keeps a red #C81D25 dashed outline with the label 'reserved for decoding'. The table shows the rows '0 | 7 | 4' and '1 | 1 | 3'. The model outputs the token 'fathers'.

Scene 4. Decode step 1. The token 'fathers' enters at position 7. An arrow shows the lookup: '7 // 4 = 1', '7 % 4 = 3', 'logical 1 -> physical 1', 'slot = 1 x 4 + 3 = 7'. The KV of 'fathers' fills the free slot of block 1 in green. In the table, '# filled' changes from 3 to 4. The caption says 'No allocation'. The model outputs 'brought'.

Scene 5. Decode step 2. The token 'brought' enters at position 8. The lookup shows '8 // 4 = 2' and a red question mark: logical block 2 does not exist. The number 3 leaves the free queue, and the new row '2 | 3 | 1' appears in the table. The KV of 'brought' fills slot 12 (3 x 4 + 0). Three slots of block 3 stay empty with red dashed outlines and the label 'waste <= B - 1 = 3'.

Scene 6. Request B, 'It was the best of times' (6 tokens), arrives in blue. The numbers 5 and 2 leave the free queue. 'It was the best' fills block 5 and 'of times' fills two slots of block 2. Highlight that the blocks of A (7, 1, 3) and of B (5, 2) are mixed in physical memory and not contiguous. The free queue now shows 0, 4, 6, 8. Note at the bottom: 'Block numbers of request B as read from Figure 7 of the paper'.

Scene 7. Request A finishes. Blocks 7, 1 and 3 turn back to gray dashed outlines, and their numbers move to the end of the free queue: 0, 4, 6, 8, 7, 1, 3. Final caption: 'Allocate on demand, one block at a time. Free at the end. Waste only in the last block.'
`````

#### 19. P04: Copy-on-write for parallel sampling

Output: `public/notes/media/papers/2023-pagedattention/manim/p04-copy-on-write.mp4`. Page: 06 Sharing: parallel sampling, beam search and shared prefixes.

`````text
VIDEO: Copy-on-write for parallel sampling
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\papers\2023-pagedattention\manim\p04-copy-on-write.mp4
MISUNDERSTANDING TO FIX: Each sample of a request needs its own full copy of the prompt's KV cache, or copy-on-write copies the whole sequence.

Scene 1. The blue #1E6091 prompt 'Four score and seven years ago our' (7 tokens) appears with the label 'parallel sampling, n = 2'. A row of nine physical blocks numbered 0 to 8 with gray #8A8A8A dashed outlines appears below. Caption: 'Block size B = 4'.

Scene 2. Prefill stores one copy of the prompt: 'Four score and seven' fills block 7 and 'years ago our' fills three slots of block 1, in green #2D6A4F. Two block tables appear: 'A1: [7, 1]' and 'A2: [7, 1]'. Arrows from both tables go to the same two blocks. Above each block, a counter shows 'ref 2'.

Scene 3. A comparison bar: 'without sharing: 4 blocks' against 'with sharing: 2 blocks'. A formula appears: 'ref count = number of logical blocks that map to this physical block'.

Scene 4. Sample A1 drew 'fathers' and must write its KV into the last slot of its logical block 1. The block manager checks block 1: 'ref 2 > 1' in red #C81D25 with the label 'shared: copy first'. Block 3 leaves the free queue. A red arrow labeled 'copy one block' copies 'years ago our' from block 1 to block 3. A1's table changes to '[7, 3]', block 1 shows 'ref 1', block 3 shows 'ref 1'. 'fathers' fills slot 15 (3 x 4 + 3).

Scene 5. Sample A2 drew 'mothers'. The check shows 'ref 1': no copy. 'mothers' fills the last slot of block 1, slot 7 (1 x 4 + 3). Block 7 still shows 'ref 2'.

Scene 6. Several later steps play quickly: each sample fills new private blocks, while block 7 stays shared for the whole request. A counter shows physical blocks in use: 3 instead of 4 at this point. Caption: 'Only the partly filled block was copied, and only once.'

Scene 7. Summary of the three operations on screen: 'fork = copy the block table, ref + 1 for each block', 'write into a shared last block = copy-on-write of that one block', 'free = ref - 1, return the block at 0'.
`````

#### 20. P05: Why a slower attention kernel gives 2 to 4 times the throughput

Output: `public/notes/media/papers/2023-pagedattention/manim/p05-slower-kernel-higher-throughput.mp4`. Page: 09 Results.

`````text
VIDEO: Why a slower attention kernel gives 2 to 4 times the throughput
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\papers\2023-pagedattention\manim\p05-slower-kernel-higher-throughput.mp4
MISUNDERSTANDING TO FIX: PagedAttention makes the attention computation faster. In fact the paged attention kernel is 20-26% slower; the throughput gain comes from fitting more requests into one batch.

Scene 1. One GPU drawn as a gold outline labeled 'A100 40 GB'. Inside it, an ink block labeled 'OPT-13B weights 26 GB' and a green region labeled 'KV cache 12 GiB = 15,729 slots'. A caption under the green region: 'one slot = one token = 819,200 bytes (800 KiB)'.

Scene 2. Orca (Max). Requests arrive as blue arrows from the left. Each request gets one long row of 2,048 slots in the green region: the first part fills green (about 499 tokens, the ShareGPT mean), the rest of the row is outlined in red and labeled 'reserved, never used'. Rows stack until the region is full. Counter: '15,729 / 2,048 = 7.68, so 7 requests'. The eighth blue arrow waits outside, gray and dashed.

Scene 3. Clear the rows. vLLM paging: the same green region is now a grid of blocks of 16 slots. Blue requests take one block at a time, and blocks of different requests interleave. Only the last block of each request has empty slots, drawn gray and dashed. Counter grows to '30.42 requests on average' with the caption 'Figure 13: OPT-13B, ShareGPT at 2 req/s'. Side label: 'Orca (Oracle) 13.62, Orca (Pow2) 9.81, Orca (Max) 7.00'.

Scene 4. One decode step as a horizontal bar. Most of the bar is ink, labeled 'linear layers: read all weights once'. A gold part is labeled 'attention'. The gold part stretches by 26% and a red label appears: 'paged kernel 20-26% slower (block table reads, branches, variable lengths)'. Under it: 'if attention is 20% of the step (assumed, approximate), the step is about 5.2% slower'.

Scene 5. Two decode steps side by side, almost equal in length. Left step labeled 'Orca (Max): 7 requests, 7 tokens per step'. Right step labeled 'vLLM: about 30 requests, about 30 tokens per step'. A caption: 'decode is memory-bound: the weights are read once per step, whatever the batch'. A ratio appears: '30.42 / 7.00 = about 4.3 times more tokens per step (approximate, before the kernel overhead)'.

Scene 6. A plot titled 'illustration, not paper data'. X axis 'request rate (req/s)' from 0 to 2.2, y axis 'normalized latency (s/token)' from 0 to 1. A red curve for a system with capacity 1.0 req/s and a blue curve for capacity 2.2 req/s, both flat at 0.05 and then rising sharply. A gold horizontal line at 0.25 s/token. Dots where the line crosses the curves: 0.8 req/s (red) and 1.76 req/s (blue). Label: '1.76 / 0.8 = 2.2 times the request rate at the same latency'.

Scene 7. Summary card in ink with three purple bars: 'vs Orca (Oracle) 1.7-2.7x', 'vs Orca (Max) 2.7-8x', 'vs FasterTransformer up to 22x' (ShareGPT, §6.2). Final line: 'memory decides the batch size, and the batch size decides the throughput'. A small red note: 'exception: OPT-175B on Alpaca becomes compute-bound, so the gain is smaller'.
`````

### Group 5: Inference

#### 21. M16: The life of a request

Output: `public/notes/media/llm-systems/manim/m16-life-of-a-request.mp4`. Page: L1: The life of a request.

`````text
VIDEO: The life of a request
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m16-life-of-a-request.mp4
MISUNDERSTANDING TO FIX: An LLM server handles a request like one function call that reads the JSON messages and returns the answer, so the prompt is the slow part.

Scene 1. Left: a blue (#1E6091) box 'Client'. It sends a card 'POST /v1/chat/completions' with two JSON lines: '{"role": "system", ...}' and '{"role": "user", "content": "What is the capital of France?"}'. The card passes an ink (#100D12) box 'Gateway' and reaches a purple (#6A4C93) box 'API server process'. A timer at the top right shows '0 ms', then '20 ms (assumed network)'.

Scene 2. Inside the purple box, the two messages merge into one template string that starts with '<|begin_of_text|><|start_header_id|>system<|end_header_id|>'. A tokenizer turns it into a row of integer boxes. The first box reads '128000', the rest read '...'. Label: '2,000 token IDs'. Timer: '22 ms (template and tokenizer assumed 2 ms)'.

Scene 3. The row of IDs travels along a line labeled 'ZMQ' into an ink box 'Engine core process' and waits in a 'waiting queue' drawn as gray (#8A8A8A) dashed slots. An ink 'scheduler' arrow takes it. A green (#2D6A4F) 'KV cache manager' gives it blocks: label 'ceil(2000 / 16) = 125 blocks of 16 tokens'.

Scene 4. A gold (#B8860B) box 'GPU worker' runs the prefill: 2,000 token columns flow through a stack labeled '32 layers'. Green blocks fill with keys and values. Only the last column continues to 'LM head', then a bar 'logits [128,256]', then 'sampler', which outputs the token ' The'. Timer: '55.5 ms (prefill about 33.5 ms, idealized)'.

Scene 5. The token ID returns to the purple box. An 'incremental detokenizer' turns it into the text 'The'. A chunk 'data: {"choices":[{"delta":{"content":"The"}}]}' flies to the client in 20 ms. The client shows 'The'. A blue bracket from 0 ms to 75.5 ms reads 'TTFT about 75.5 ms (idealized)'.

Scene 6. The decode loop: each step, a gray block '16.06 GB of weights' and the green KV blocks move into the gold GPU box, and one new token comes out. Step counter 'token 2, 3, ..., 200', each step about 4.88 ms. One green slot fills per token, and a new green block appears after every 16 tokens. Each token streams to the client as one small purple chunk.

Scene 7. The model emits the end-of-sequence token. The engine core marks 'finish_reason: stop'. The client receives the last chunk and 'data: [DONE]'. The green blocks turn gray dashed and return to the free pool. Timer: 'about 1,046 ms (idealized)'. Caption: 'decode took about 93% of the time'.
`````

#### 22. M17: Static vs continuous batching

Output: `public/notes/media/llm-systems/manim/m17-static-vs-continuous-batching.mp4`. Page: L4: Batching and scheduling.

`````text
VIDEO: Static vs continuous batching
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m17-static-vs-continuous-batching.mp4
MISUNDERSTANDING TO FIX: Batching means grouping requests once and running the group to the end, so a slot that frees up must wait for the whole batch.

Scene 1. Two horizontal ink (#100D12) lanes labeled 'slot 1' and 'slot 2', with step numbers 0 to 8 above them. A gray (#8A8A8A) dashed waiting queue on the left holds four cards: 'R1: 2 tokens', 'R2: 6 tokens', 'R3: 3 tokens', 'R4: 2 tokens'. Blue (#1E6091) arrows mark arrivals: R1 and R2 at step 0, R3 at step 1, R4 at step 2.

Scene 2. Title 'Static batching'. R1 and R2 board. Step 0 cells are gold (#B8860B) and read 'prefill'. Later cells are purple (#6A4C93). R1 finishes after step 1. Its cells for steps 2 to 5 turn red (#C81D25) dashed with the word 'idle', while R3 and R4 wait in the gray queue.

Scene 3. At step 6, R3 and R4 board together. R4 finishes after step 7, so slot 2 is red 'idle' at step 8. A counter shows '9 steps, slots used 13 of 18 (72%), mean latency 5.5 steps'.

Scene 4. Reset the lanes. Title 'Continuous batching'. Step 0: R1 and R2 prefill (gold). After step 1, R1 leaves and R3 boards at once in step 2 with a gold prefill cell.

Scene 5. After step 4, R3 leaves and R4 boards in step 5. R2 finishes after step 5. Step 6 holds only R4 and one red 'idle' cell. A counter shows '7 steps, slots used 13 of 14 (93%), mean latency 4.25 steps'.

Scene 6. Both Gantt charts side by side with a table: static 9 steps, mean latency 5.5 steps, mean TTFT 3.25 steps; continuous 7 steps, mean latency 4.25 steps, mean TTFT 2.0 steps. Caption: 'the batch is rebuilt at every step'.

Scene 7. New picture, idealized times for Llama-3.1-8B on one H100: 20 purple decode tokens run; a 1,500-token prompt arrives. Top row: one red step of 24.67 ms labeled 'the decodes stall'. Bottom row: four gold-and-purple steps '492 + 20' (8.31 ms) three times and '24 + 20' (6.42 ms). Caption: 'chunked prefill: worst gap 24.67 ms to 8.31 ms, TTFT 24.67 ms to 31.35 ms'.
`````

#### 23. M18: Batch size on the roofline

Output: `public/notes/media/llm-systems/manim/m18-batch-size-on-the-roofline.mp4`. Page: L3: Compute-bound vs memory-bound.

`````text
VIDEO: Batch size on the roofline
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m18-batch-size-on-the-roofline.mp4
MISUNDERSTANDING TO FIX: LLM decoding is compute-bound, so every request added to a batch makes each step proportionally slower.

Scene 1. Draw log-log axes in ink (#100D12): x 'arithmetic intensity (FLOP/byte)' from 0.5 to 4096, y 'attainable TFLOP/s' from 1 to 2000. Draw the H100 roofline in ink: a slope labeled '3.35 TB/s' and a flat roof labeled '989.5 TFLOP/s (dense BF16)'. A dashed vertical line at the ridge: 'about 295 FLOP/byte'.

Scene 2. Left inset: a gray (#8A8A8A) block '16.06 GB of weights' crosses a bridge labeled '3.35 TB/s' in 4.79 ms. One gold (#B8860B) token is computed. On the roofline, a red (#C81D25) dot appears at intensity 1 and 3.35 TFLOP/s. Label: 'batch 1: about 209 tokens/s, 0.34% of peak compute'.

Scene 3. Short contexts. A counter B grows 1, 8, 32, 64, 128, 295. The dot slides up the slope with intensity about B. The inset shows the same weight block shared by B gold tokens, and the step time stays at 4.79 ms. Throughput label: 209, 13,350 (B = 64), about 61,500 tokens/s (B = 295), marked 'idealized'.

Scene 4. B = 512: the dot sits on the flat roof. The step time grows to 8.31 ms and throughput stays at about 61,611 tokens/s. Caption: 'past the ridge, each extra sequence costs compute'.

Scene 5. Now every sequence has 2,000 cached tokens. Green (#2D6A4F) blocks labeled '262 MB per sequence' join the weights on the bridge. Replay B = 64 and B = 213: the dot drops back to intensity about 33 and about 51. Labels: 'B = 64: 9.80 ms per step, 6,529 tokens/s' and 'B = 213: 21.46 ms per step, 9,925 tokens/s (idealized)'.

Scene 6. A green dot labeled 'decode attention, GQA: H / H_kv = 32 / 8 = 4' sits at intensity 4. As B grows, it does not move. Caption: 'each sequence reads its own KV cache, so batching cannot share it'.

Scene 7. A gold dot 'prefill of 2,000 tokens' appears at intensity about 1,012 on the flat roof. Final caption: 'prefill is compute-bound, decode is memory-bound; batching shares the weights, not the KV cache'.
`````

#### 24. M19: Speculative decoding: draft, verify, accept, reject

Output: `public/notes/media/llm-systems/manim/m19-speculative-decoding.mp4`. Page: L6: Speculative decoding.

`````text
VIDEO: Speculative decoding: draft, verify, accept, reject
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m19-speculative-decoding.mp4
MISUNDERSTANDING TO FIX: Speculative decoding keeps a draft token only when the big model would pick the same token, so it either works only for greedy decoding or changes the output distribution.

Scene 1. An H100 box (gold outline) reads 16 GB of Llama-3.1-8B weights to produce ONE token: a memory bar fills in about 4.8 ms while a compute bar shows only about 0.34% busy (the rest gray, dashed). Caption: 'Decode at batch 1 is memory-bound (approximate, ideal roofline).'

Scene 2. Ink token boxes 'the' 'cat' 'sat' 'on' 'the'. A small draft model (blue) proposes four tokens one by one, appearing as blue outlined boxes: 'd1: mat', 'd2: .', 'd3: It', 'd4: slept'. Caption: 'gamma = 4 cheap draft passes'.

Scene 3. One target forward pass (gold block) covers the prefix plus the 4 drafts at once and emits five distributions p1 to p5 above the positions. Caption: 'One pass, the weights are read once, 5 positions scored in parallel.'

Scene 4. Left-to-right tests. d1 'mat': p/q = 0.40/0.20 = 2, so always accepted: the box turns green. d2 '.': p/q = 0.90, random r = 0.35 < 0.90, accepted: green. Label these two values 'illustrative'.

Scene 5. d3 'It': p/q = 0.30, r = 0.62 > 0.30: the box turns red, 'rejected'. d4 'slept' fades to a gray dashed box and disappears: 'never tested, discarded'.

Scene 6. One position in detail with four words mat, rug, sofa, bed: target p = 0.40, 0.30, 0.20, 0.10 (gold bars) and draft q = 0.20, 0.50, 0.10, 0.20 (blue bars). The overlap min(p, q) sums to beta = 0.70. The residual max(0, p - q) = 0.20, 0, 0.10, 0 (purple bars) is normalized to 2/3, 0, 1/3, 0. Then the two paths add up: mat 0.20 + 0.30 x 2/3 = 0.40, rug 0.50 x 0.6 = 0.30, sofa 0.10 + 0.30 x 1/3 = 0.20, bed 0.20 x 0.5 = 0.10, exactly p.

Scene 7. Back to the sequence: green 'mat', green '.', then a purple correction token 'The' sampled from the residual. Caption: '3 tokens for 1 target pass. If all 4 drafts pass, a bonus token from p5 gives 5.' Then the formula E = (1 - alpha^(gamma+1)) / (1 - alpha) with alpha = 0.8, gamma = 4 evaluates to 3.36 tokens per pass.
`````

#### 25. M20: Tensor parallelism: split every matrix, sum twice per layer

Output: `public/notes/media/llm-systems/manim/m20-tensor-parallelism.mp4`. Page: L8: Parallelism: tensor, pipeline, data and expert.

`````text
VIDEO: Tensor parallelism: split every matrix, sum twice per layer
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m20-tensor-parallelism.mp4
MISUNDERSTANDING TO FIX: Tensor parallelism gives each GPU different layers, or it needs communication after every single matrix multiply.

Scene 1. A bar of Llama-3.1-70B weights, about 141 GB in BF16, next to one H100 box of 80 GB (gold). The bar overflows the box; the overflow part is red. Caption: 'Does not fit on one GPU.'

Scene 2. Two GPU boxes (gold), GPU 0 and GPU 1. The input x [T, 8192] (ink) is copied to both. W_gate and W_up are cut by columns: GPU 0 takes columns 0-14335, GPU 1 takes columns 14336-28671. Each GPU applies SiLU and the elementwise product on its own slice. Caption: 'Column-parallel: no communication.'

Scene 3. W_down is cut by rows with the same ranges. Each GPU produces a partial output [T, 8192]. A purple all-reduce bar adds the two partial outputs into the full output on both GPUs. Label: '16 KiB per token = 8192 x 2 bytes'.

Scene 4. Attention: 64 query heads split 32 + 32, the 8 KV heads split 4 + 4. Each GPU holds a green KV cache shard for its own 4 KV heads only. W_O is cut by rows, and a second purple all-reduce sums the outputs. Caption: 'Two all-reduces per layer.'

Scene 5. Counting for TP = 4: 2 all-reduces x 80 layers = 160 per token. A ring of 4 GPUs passes chunks around; each GPU sends 2 x (4 - 1)/4 x 16 KiB = 24 KiB per all-reduce, so 3.75 MiB per token per GPU.

Scene 6. Two pipes: NVLink 900 GB/s and PCIe Gen5 128 GB/s (datasheet totals, both directions). A 2,000-token prefill sends about 7.3 GiB per GPU: about 17.5 ms over NVLink vs about 123 ms over PCIe (approximate, ideal bandwidth). The PCIe bar is red. Caption: 'Keep tensor parallelism inside an NVLink server.'

Scene 7. TP = 16 with only 8 KV heads: each KV head appears on 2 GPUs, the copies glow red ('duplicated'). Then decode context parallelism re-slices the green cache by token ranges instead of heads, and the red copies disappear.
`````

#### 26. M21: A prefix cache hit through block hashes

Output: `public/notes/media/llm-systems/manim/m21-prefix-cache-hit.mp4`. Page: L9: Prefix caching and KV reuse.

`````text
VIDEO: A prefix cache hit through block hashes
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m21-prefix-cache-hit.mp4
MISUNDERSTANDING TO FIX: Prefix caching reuses any repeated text, at any position and of any length.

Scene 1. Request A: 70 token squares (ink) group into four full blocks of 16 (tokens 0-15, 16-31, 32-47, 48-63) and one partial block of 6 (gray dashed, 'no hash'). The first 40 tokens are tinted as 'system prompt'.

Scene 2. A hash chain is computed left to right: h1 = H(seed, t0..15), h2 = H(h1, t16..31), h3 = H(h2, t32..47), h4 = H(h3, t48..63). Each new hash visibly takes the previous hash as an input arrow. The four hashes go into a green table 'hash -> physical block' pointing at green blocks #7, #12, #3, #9 in GPU memory.

Scene 3. Request B: 65 tokens with the same 40-token system prompt. Its h1 is looked up: HIT (green), ref count of block #7 becomes 2. h2: HIT (green), block #12 ref count 2. h3': MISS (red), because tokens 40-47 differ. The lookup stops; h4' stays gray: 'never looked up'.

Scene 4. Caption: '40 shared tokens, but only 2 full blocks = 32 tokens reused.' B prefills tokens 32 to 64 only (33 tokens), and its new blocks appear.

Scene 5. A request that changes only token 0: h1 changes, and a red wave runs through h2, h3, h4: every hash differs, nothing is reused.

Scene 6. A fully cached 64-token prompt: all four hashes hit, but the cap 64 - 1 = 63 rounds down to 48 tokens, so the last block of 16 tokens is recomputed to produce the logits of the last token.

Scene 7. A and B finish. Their blocks slide into a free queue in reverse order, keeping their hashes (green outlines). A new request C hits #7 and #12 and pulls them out of the queue. Later, an unrelated request takes blocks from the head of the queue, and the least recently used cached blocks lose their hashes (fade to gray).
`````

### Group 6: Cloud hosting

#### 27. M22: The GPU memory budget: from 80 GiB to KV cache blocks

Output: `public/notes/media/llm-systems/manim/m22-gpu-memory-budget.mp4`. Page: L2: Sizing GPUs for a model.

`````text
VIDEO: The GPU memory budget: from 80 GiB to KV cache blocks
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m22-gpu-memory-budget.mp4
MISUNDERSTANDING TO FIX: GPU memory minus the weights is the KV cache, and gpu_memory_utilization is the share of memory reserved for the KV cache.

Scene 1. An empty horizontal bar with an ink outline labeled 'One H100: 80 GiB'. Title at the top: 'Where does GPU memory go?'. Show the formula below in ink: 'KV cache = total x gpu_memory_utilization - weights - activations - CUDA graphs - other'.

Scene 2. A gray dashed segment of 6.40 GiB appears at the right end of the bar, labeled 'not requested: 8% (1 - 0.92)'. The remaining part gets the label 'requested: 80 x 0.92 = 73.60 GiB'. A small caption: 'vLLM 0.31.0 default gpu_memory_utilization = 0.92 (0.9 before vLLM 0.20.0)'.

Scene 3. A gold segment grows from the left: 'weights: 8,030,261,248 parameters x 2 bytes = 16.06 GB = 14.96 GiB'. Four small gold file icons labeled 'model-00001 ... model-00004.safetensors' fly into the segment.

Scene 4. A narrow purple segment appears next to the weights: 'activations + CUDA graphs + other: 3.00 GiB (approximate, assumed)'. A caption under it: 'vLLM measures this with a profiling run of max_num_batched_tokens tokens'.

Scene 5. The rest of the requested part turns green and is labeled 'KV cache: 55.64 GiB'. It splits into many small green blocks. Captions appear one by one: '55.64 GiB / 131,072 bytes per token = 455,823 tokens', then '/ 16 tokens per block = 28,488 blocks'.

Scene 6. Blue request cards labeled '4,096 tokens = 256 blocks' arrive from the left and each takes 256 green blocks. A counter counts up to 111. The 112th card stops outside with a red outline and the label 'waits in the queue'.

Scene 7. The same bar for one L4 (22 GiB, as AWS lists it): requested 20.24 GiB, gold weights 14.96 GiB, purple 1.5 GiB (approximate, assumed), green KV cache 3.78 GiB = 30,986 tokens. A blue card labeled '131,072 tokens needs 16 GiB' hits the green part and turns red: 'startup error: To serve at least one request ...'. A final caption: 'fix: --max-model-len 8192'.
`````

#### 28. M23: Why a new replica takes minutes: the cold-start timeline

Output: `public/notes/media/llm-systems/manim/m23-cold-start-timeline.mp4`. Page: L3: Containers and model loading.

`````text
VIDEO: Why a new replica takes minutes: the cold-start timeline
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m23-cold-start-timeline.mp4
MISUNDERSTANDING TO FIX: A new replica can serve traffic as soon as its container starts, so adding replicas fixes a traffic peak at once.

Scene 1. Blue request squares pile up in a queue in front of one purple vLLM replica box. An autoscaler icon says 'add a replica' at 't = 0 s'. A new gray dashed node outline appears, labeled 'new GPU node: time varies, not counted here'. A timeline axis from 0 s to 170 s appears at the bottom.

Scene 2. An ink-outlined bar grows on the timeline from 0 s to 60 s, labeled 'pull image vllm/vllm-openai:v0.31.0, 9.04 GB compressed, at about 150 MB/s (assumed) = about 60 s'. Next to the node, a probe icon repeatedly shows 'GET /health: connection refused'.

Scene 3. A green bar grows from 60 s to 92 s, labeled 'download weights 16.06 GB at about 500 MB/s (assumed) = about 32 s'. Four green safetensors shard icons travel from an object storage box to the node's disk.

Scene 4. A gray bar of 5 s ('engine start') and a gold bar of 16 s ('read weights into GPU at about 1 GB/s from the root disk') follow, from 92 s to 113 s. Gold weights flow from the disk icon into a gold GPU box.

Scene 5. A red bar of 53 s labeled 'torch.compile, about 53 s without a cache (AWS EKS guide, approximate)' grows from 113 s to 166 s. Then a purple bar of 1 s ('memory profiling, KV allocation') and a blue bar of 2 s ('CUDA graph capture') complete the line at about 169 s. The probe icon turns to 'GET /health: 200' and the replica joins the queue's targets.

Scene 6. A second timeline appears below, labeled 'warm replica'. The pull and download bars shrink to 0 s with labels 'image already on the node' and 'weights on local NVMe'. The load bar shrinks to 1 s ('NVMe, about 30 GB/s'), and the red compile bar shrinks to 6 s ('compile cache'). The warm line ends at about 15 s. Both totals are shown: 'cold: about 169 s', 'warm: about 15 s' (approximate).

Scene 7. Three green cache labels point to the removed segments: 'image cache on every GPU node', 'weights cache on local NVMe or a shared volume', 'compile cache per GPU type, TP size, model and PyTorch version'. Final caption: '154 of 169 seconds removed: about 91% (computed estimate)'.
`````

#### 29. M24: Autoscaling on queue depth

Output: `public/notes/media/llm-systems/manim/m24-autoscaling-on-queue-depth.mp4`. Page: L5: Autoscaling and routing.

`````text
VIDEO: Autoscaling on queue depth
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m24-autoscaling-on-queue-depth.mp4
MISUNDERSTANDING TO FIX: The autoscaler adds GPU capacity within seconds, and queue depth alone can size the fleet.

Scene 1. One vLLM replica as a gold box with 64 batch slots drawn as a grid, 38 of them filled. Blue dots (requests) arrive at 4 per second from the left and leave on the right when done. A red waiting stack beside the replica is empty. Label: vllm:num_requests_waiting = 0.

Scene 2. At t = 300 s the arrival rate steps to 12 requests per second. All 64 slots fill and the red waiting stack grows. Label: one full replica completes about 6.76 requests per second (64 slots / 9.47 s, approximate fluid model).

Scene 3. A metrics chain lights up in ink: vLLM /metrics, then Prometheus, then KEDA, then the HPA. Show the worked example: 2 replicas, sum(waiting) = 26, target 5 per replica, desired = ceil(26 / 5) = 6. Show 'every 15 s' and the policy 'max(+100%, +4 pods) per period'.

Scene 4. New pods appear as gray dashed boxes with a progress bar labeled 'GPU node, image, weights, warm-up: 240 s in the simulation'. Meanwhile the red waiting stack keeps growing toward 929, and the HPA raises its target to the maximum of 12 replicas: overshoot.

Scene 5. The new pods turn gold (Ready). The red queue drains to 0. Twelve replicas now share about 114 running requests (12 per second x 9.47 s).

Scene 6. With a queue-only rule, the recommendation drops to 1 because the queue is 0. After the 300 s stabilization window, 11 replicas fade to gray. The queue grows again. A red line plots ready replicas over time: 1, 12, 1, 12, oscillating.

Scene 7. The fix: add a second signal. Running requests with a target of 48 per replica, or Little's law with the arrival rate: L = 12 x 9.47 = about 114, and ceil(114 / 48) = 3. A blue line holds steady at 3 replicas. Final caption: Trigger on the queue, size on demand, keep headroom for the cold start.
`````

#### 30. M25: From GPU hour to cost per token

Output: `public/notes/media/llm-systems/manim/m25-gpu-hour-to-cost-per-token.mp4`. Page: L7: Cost math: from GPU hours to cost per token.

`````text
VIDEO: From GPU hour to cost per token
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m25-gpu-hour-to-cost-per-token.mp4
MISUNDERSTANDING TO FIX: A GPU's cost per token is fixed by its hourly price, so cheaper GPUs always mean cheaper tokens.

Scene 1. A gold box for an 8-GPU H100 VM with the price tag 'USD 98.32 per hour (Azure ND96isr H100 v5, eastus, checked 2026-10-15)'. A clock face shows one hour = 3,600 seconds.

Scene 2. The units cancel step by step: USD 98.32 / 3,600 s = USD 0.02731 per second. Tokens stream out at 10,000 per second, so each token costs USD 0.000002731. Multiply by 1,000,000: USD 2.73 per million tokens (blue result box).

Scene 3. Zoom into one H100 at USD 12.29 per GPU-hour serving Llama-3.1-8B. One decode step reads a gold bar of weights (16.06 GB) and a green bar of KV cache (64 sequences x 2,048 tokens x 128 KiB = 17.18 GB) at 3.35 TB/s. Result: 9.92 ms per step, 64 tokens per step, about 6,450 tokens per second, USD 0.529 per million tokens (bandwidth bound, approximate upper limit).

Scene 4. A batch-size slider moves from 1 to 128. A red curve of cost falls from USD 16.64 to USD 0.401 per million tokens, while a blue curve of TPOT rises from 4.87 ms to 15.05 ms. Label: about 41 times cheaper, about 3.1 times slower per token.

Scene 5. Utilization: 24 bars of a daily load curve, 0.05 at night and 0.9 in working hours. The average u = 0.442 appears. The cost at 50% of the bound, USD 1.06 per million tokens, is divided by 0.442 and becomes about USD 2.40.

Scene 6. Break-even against an API at USD 0.71 per million tokens (purple line). The VM must sustain 38,466 tokens per second on-demand. Gold bars show what the VM can produce for a 70B model: 21,920 tokens per second (BF16 bound) and 28,304 (FP8 bound), both below the line. A 3-year reservation lowers the line to 16,887.

Scene 7. Summary card in ink: USD per MTok = USD per hour / (tokens per second x 3,600) x 1,000,000. Three levers glow: batch size, utilization, discounts (reserved, spot, batch, caching).
`````

### Group 7: RAG

#### 31. M26: HNSW search: down the layers, and why ef matters

Output: `public/notes/media/llm-systems/manim/m26-hnsw-greedy-search.mp4`. Page: L4: Vector indexes: flat, IVF, HNSW and PQ.

`````text
VIDEO: HNSW search: down the layers, and why ef matters
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m26-hnsw-greedy-search.mp4
MISUNDERSTANDING TO FIX: HNSW greedy search always finds the true nearest neighbor, so efSearch only changes speed.

Scene 1. A 2D plane with ten nodes as gold circles labeled A (1,1), B (3,2), C (2,5), D (5,4), E (7,1), F (9,3), G (6,7), H (9,7), I (3,8), J (8,9). A blue dot labeled q appears at (8.5, 7.5). Caption: 'Find the nearest node to q. Numbers are squared distances.' Show the squared distances next to each node: A 98.5, B 60.5, C 48.5, D 24.5, E 44.5, F 20.5, G 6.5, H 0.5, I 30.5, J 2.5.

Scene 2. Stack three copies of the plane as layers: layer 2 holds only A, layer 1 holds A, D, I with edges A-D, D-I, A-I, layer 0 holds all ten nodes. Nodes absent from a layer are small gray dashed circles. Caption: 'Each node gets a random top level: P(level >= j) = M^-j.'

Scene 3. Layer 2: the search starts at the entry point A. A has no neighbors in this layer. An arrow goes down to A in layer 1. Caption: 'Upper layers: greedy walk with ef = 1.'

Scene 4. Layer 1: from A (98.5), a blue arrow moves to D (24.5). D's neighbors A (98.5) and I (30.5) flash and are rejected because they are not closer. An arrow goes down to D in layer 0. Caption: 'Stop when no neighbor is closer. Go down at D.'

Scene 5. Layer 0 with ef = 1: D's neighbors B 60.5, C 48.5, G 6.5, E 44.5, F 20.5 are computed one by one. F (20.5) briefly glows, then fades in red because the one-slot list keeps only G (6.5). A red arrow D to G. G's other neighbor I (30.5) is farther: the search stops at G. Caption: 'Local minimum: G (6.5), but H (0.5) exists. 7 distances computed.'

Scene 6. Replay layer 0 with ef = 2: the result list shows two slots, G (6.5) and F (20.5). F is expanded, its neighbor H (0.5) enters the list in blue, then H's neighbor J (2.5) enters. Blue path D to F to H. Caption: 'ef = 2 keeps F, which leads to H. 9 distances computed.'

Scene 7. A small table: efSearch 16, 32, 64, 128, 256 with measured recall@10 0.724, 0.864, 0.954, 0.978, 0.986 and distances per query 401, 525, 682, 1308, 3173 (FAISS, M = 16, 100,000 synthetic vectors). Caption: 'Larger efSearch: more distances, higher recall. Measure it on your data.'
`````

#### 32. M27: Reciprocal rank fusion, step by step

Output: `public/notes/media/llm-systems/manim/m27-reciprocal-rank-fusion.mp4`. Page: L5: Hybrid search and reranking.

`````text
VIDEO: Reciprocal rank fusion, step by step
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m27-reciprocal-rank-fusion.mp4
MISUNDERSTANDING TO FIX: You can merge dense and BM25 results by adding their scores, or RRF is just a fixed formula with no choices.

Scene 1. A blue query box: 'refund rules for ORD-55871'. Two columns appear. Left, 'Dense (cosine)': C7 0.83, C2 0.81, C9 0.80, C1 0.78, C4 0.74, C5 0.73. Right, 'BM25 (score)': C4 18.2, C3 9.1, C11 8.7, C7 6.0, C8 5.5, C2 2.1. Document IDs in purple.

Scene 2. Raw-score addition: the numbers slide together and the sums appear: C4 18.94, C3 9.10, C11 8.70, C7 6.83, C8 5.50, C2 2.91, C9 0.80, C1 0.78, C5 0.73. A red caption: 'The bigger scale wins: this is just the BM25 order.'

Scene 3. The scores fade to gray. Only rank numbers 1 to 6 remain. The formula appears: RRF(d) = sum over lists of 1 / (60 + rank). Caption: 'Use positions, not scores.'

Scene 4. Purple lines connect C7, C4 and C2, which appear in both lists. Their sums build up: C7 = 1/61 + 1/64 = 0.032018, C4 = 1/65 + 1/61 = 0.031778, C2 = 1/62 + 1/66 = 0.031281.

Scene 5. The single-list documents get one term each: C3 1/62 = 0.016129, C11 1/63 = 0.015873, C9 1/63 = 0.015873, C1 1/64 = 0.015625, C8 1/65 = 0.015385, C5 1/66 = 0.015152. C11 and C9 flash: a tie, broken by a fixed rule.

Scene 6. The fused list sorts itself: C7, C4, C2, C3, C11, C9, C1, C8, C5. Caption: 'Agreement wins: with k = 60, rank r in both lists beats rank 1 in one list while r < 62.' A small plot: red flat line 1/61 and a blue curve 2/(60 + r) crossing at r = 62.

Scene 7. The top of the fused list flows into a gold box 'cross-encoder reranker: 50 candidates, about 28 ms (model card, V100)', then a purple box 'top 5 into the prompt'. Caption: 'The reranker only reorders what fusion passed on.'
`````

#### 33. M28: Computing nDCG@5 step by step

Output: `public/notes/media/llm-systems/manim/m28-ndcg-step-by-step.mp4`. Page: L8: Evaluating RAG.

`````text
VIDEO: Computing nDCG@5 step by step
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m28-ndcg-step-by-step.mp4
MISUNDERSTANDING TO FIX: nDCG is a black-box score, and the ideal list can be built from the retrieved documents only.

Scene 1. Show the question's judged documents as purple cards with grades: D1 = 3, D2 = 2, D3 = 2, D4 = 1. Below, the retrieved top 5 as a vertical list with rank numbers 1 to 5: D7, D3, D1, D9, D4. D7 and D9 are gray cards with grade 0. D2 is not in the list and gets a red outline with the label 'not retrieved'.

Scene 2. Next to each rank, write the discount log2(i + 1): 1.0000, 1.5850, 2.0000, 2.3219, 2.5850. Animate a small curve of 1 / log2(i + 1) falling slowly in ink, with the values 1, 0.6309, 0.5, 0.4307, 0.3869.

Scene 3. For each rank, divide the grade (linear gain) by its discount. Ranks 1 and 4 give 0 and fade to gray. Rank 2: 2 / 1.585 = 1.2619. Rank 3: 3 / 2 = 1.5000. Rank 5: 1 / 2.585 = 0.3869. Each value grows as a purple bar.

Scene 4. Stack the three bars into one total: DCG@5 = 1.2619 + 1.5000 + 0.3869 = 3.1487.

Scene 5. Build the ideal list on the right side from all judged documents sorted by grade: D1 (3), D2 (2), D3 (2), D4 (1). D2 keeps its red outline to show that the missed document stays in the ideal list. Contributions: 3.0000, 1.2619, 1.0000, 0.4307. IDCG@5 = 5.6925.

Scene 6. Divide: nDCG@5 = 3.1487 / 5.6925 = 0.5531, shown large in purple.

Scene 7. Show the bug in red: an ideal list built from the retrieved documents only (grades 3, 2, 1) gives IDCG = 4.7619 and nDCG = 0.6612. A red cross over the bigger number, and the caption: the missed D2 must cost something. End with a small note in gray: exponential gain 2^grade - 1 gives 0.5340 for the same list.
`````

#### 34. M29: The production RAG data flow

Output: `public/notes/media/llm-systems/manim/m29-production-rag-data-flow.mp4`. Page: L9: Production RAG architecture.

`````text
VIDEO: The production RAG data flow
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m29-production-rag-data-flow.mp4
MISUNDERSTANDING TO FIX: Production RAG is a model call with a vector search in front of it, and permissions can be applied to the results afterwards.

Scene 1. Draw the two paths as two horizontal lanes. Top lane labeled 'WRITE PATH' in green: Sources + ACLs (purple), Connectors, Parse, Chunk + metadata, Embed model v2 (gold), and a green cylinder 'Index v2' at the right. Bottom lane labeled 'READ PATH' in blue: User (blue), Gateway + auth, Cache check, Rewrite, Embed query, Hybrid search, Rerank, Assemble, LLM, Checks, Answer.

Scene 2. A document 'refund-policy.md' changes from 30 days to 14 days. A change event travels through Connectors, Parse and Chunk. The chunk gets metadata tags: doc ID, version 4, tenant acme, allowed groups finance and all-staff. A red ghost of the old version-3 chunk is deleted from the index before the new chunk is inserted. A timer shows the freshness lag counting to about 4 minutes, under a 15-minute target line.

Scene 3. User Dana (blue) sends 'What is the refund window for digital products?'. The gateway verifies the token and resolves her groups from the session: finance, all-staff. A label in red: the filter is built here, never by the model.

Scene 4. The cache check computes a key from tenant, groups and index version: miss. The query is embedded with the same model v2 as the index (a small 'v2 = v2' check turns green).

Scene 5. Hybrid search runs ANN and BM25 in parallel inside the index, with the ACL pre-filter: chunks of other groups stay gray and never leave the index. 50 candidates flow out (approximate count), the reranker keeps 8.

Scene 6. The context is assembled with labels S1 to S8 and dates. The LLM (gold) streams the answer with [S1]. The checks box confirms that S1 exists and that '14' appears in S1. A latency bar fills along the bottom: first token at 1,287 ms (example value), under the 2 s target.

Scene 7. The control plane appears below in dashed gray boxes: Evaluation, Tracing, Monitoring, Versions. One trace line connects every stage with span times. End with an alias switch animation: 'docs-current' moves from Index v2 to Index v3 after a blue-green rebuild, and the query embedder switches with it.
`````

### Group 8: MCP

#### 35. M30: MCP roles and one tool call, end to end

Output: `public/notes/media/llm-systems/manim/m30-mcp-roles-and-one-tool-call.mp4`. Page: L1: Why MCP exists.

`````text
VIDEO: MCP roles and one tool call, end to end
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m30-mcp-roles-and-one-tool-call.mp4
MISUNDERSTANDING TO FIX: The model connects to the MCP server and calls the tool itself.

Scene 1. Four labeled boxes appear: 'User' (ink outline), a large 'Host: chat app, IDE or agent' box (ink outline) that contains a small 'MCP client' box (blue #1E6091), a 'Model provider API' box (gold #B8860B) above the host, and an 'MCP server: orders' box (purple #6A4C93) on the right. Caption: 'One host, one client for each server.'

Scene 2. Discovery. A blue arrow labeled 'tools/list' goes from the MCP client to the server. A purple card returns to the host with the text 'count_orders(plant, date)' and the line 'inputSchema: type object, required [plant, date]'. The card stays pinned inside the host.

Scene 3. The user box sends the text 'How many orders did plant B ship yesterday?' to the host. The host sends a gold-outlined envelope to the model provider with two parts: 'messages' and 'tool definitions'. Inside, the label 'inputSchema' turns into 'input_schema / parameters' to show the host translating the format.

Scene 4. The model returns a gold arrow to the host with 'tool call: count_orders, plant B, date 2026-10-14'. A red #C81D25 dashed line tries to go directly from the model to the server and is crossed out. Caption: 'The model never talks to an MCP server.'

Scene 5. The host passes the call to the MCP client. A blue arrow carries the JSON text '{"method": "tools/call", "params": {"name": "count_orders", "arguments": {"plant": "B", "date": "2026-10-14"}}}' to the server. A purple arrow returns '"content": [{"type": "text", "text": "412"}], "isError": false'.

Scene 6. The host sends the tool result to the model (gold arrow). The model answers 'Plant B shipped 412 orders.' The host shows this sentence to the user. The pinned tool card and the client stay in the host the whole time.

Scene 7. Zoom out to a grid of 4 hosts and 6 services. First 24 red lines connect every host to every service, with the label '4 x 6 = 24 custom integrations'. They fade, and 4 blue client dots plus 6 purple server dots appear, with the label '4 + 6 = 10 pieces with MCP'.
`````

#### 36. M31: A 2025-11-25 session behind a load balancer, and stateless requests

Output: `public/notes/media/llm-systems/manim/m31-session-behind-load-balancer.mp4`. Page: L5: Stateful vs stateless MCP.

`````text
VIDEO: A 2025-11-25 session behind a load balancer, and stateless requests
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m31-session-behind-load-balancer.mp4
MISUNDERSTANDING TO FIX: A load balancer could always send each MCP request to any server replica, also with the 2025-11-25 sessions.

Scene 1. A client box (blue #1E6091) on the left, a 'Load balancer' box (ink #100D12) in the middle, and two server boxes on the right labeled 'Replica A (port 18766)' and 'Replica B (port 18767)' (purple #6A4C93). Caption: '2025-11-25: stateful sessions.'

Scene 2. A blue arrow 'POST initialize' goes through the load balancer to replica A. A green #2D6A4F card appears inside replica A: 'session 9fc6...: version 2025-11-25, client capabilities'. A purple arrow returns to the client with the header 'Mcp-Session-Id: 9fc6...'.

Scene 3. A blue arrow 'POST tools/call + Mcp-Session-Id: 9fc6...' goes through the load balancer, which sends it to replica B. Replica B has no green card. A red #C81D25 response returns: '404 {"code": -32600, "message": "Session not found"}'. Caption: 'Measured with two real SDK replicas.'

Scene 4. A tool call lands on replica A, which sends 'elicitation/create (id 1)' back on an SSE stream. A green 'waiting tool call' box glows in replica A. The client's answer, 'POST response to id 1', is routed to replica B (red arrow). Caption: 'A waits, but B has the answer.'

Scene 5. The fix of 2025: the load balancer turns into 'L7, sticky by Mcp-Session-Id' and routes everything for session 9fc6... to A. Then replica A gets a red cross. Its green session card turns gray and dashed with the label 'lost: client must initialize again'.

Scene 6. Caption '2026-07-28: stateless'. The client sends 'POST tools/call' with the headers 'MCP-Protocol-Version: 2026-07-28', 'Mcp-Method: tools/call', 'Mcp-Name: count_orders', and a body field '_meta: protocolVersion 2026-07-28, clientCapabilities {}'. Round robin sends request 1 to A and request 2 to B. Both return purple '200, resultType complete, 412'. No green session cards exist.

Scene 7. A formula appears: 'random routing, k = 4 replicas, r = 3 follow-up requests: (1/4)^3 = 1/64, about 1.6 percent of sessions survive (approximate model)'. Next to it: 'stateless requests: any replica, every time'. Final caption: 'Stateless protocol, application state named by handles.'
`````

#### 37. M32: The initialize handshake against self-describing requests

Output: `public/notes/media/llm-systems/manim/m32-handshake-vs-self-describing-requests.mp4`. Page: L3: The stateful protocol (2025-11-25).

`````text
VIDEO: The initialize handshake against self-describing requests
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m32-handshake-vs-self-describing-requests.mp4
MISUNDERSTANDING TO FIX: A 2025-11-25 tools/call carries the protocol version and the client capabilities, just like a 2026-07-28 request.

Scene 1. The screen splits into two halves: left '2025-11-25', right '2026-07-28'. Each half has a client (blue #1E6091) and a server (purple #6A4C93).

Scene 2. Left: a blue JSON card 'initialize: protocolVersion "2025-11-25", capabilities {"elicitation": {"form": {}}}, clientInfo {"name": "demo-host", "version": "0.1.0"}' flies to the server. The server copies these fields into a green #2D6A4F 'session' card.

Scene 3. Left: a purple card 'result: protocolVersion "2025-11-25", capabilities {"tools": {"listChanged": true}}, serverInfo' returns. Then a dashed blue arrow 'notifications/initialized' goes to the server, with a small gray #8A8A8A label 'no id, no reply'.

Scene 4. Left: a blue card 'tools/call: name count_orders, arguments {plant: B, date: 2026-10-14}' arrives. It has no version and no capabilities. A green line links it to the session card, with the caption 'context comes from the remembered handshake'.

Scene 5. Right: a blue card 'tools/call' arrives with a highlighted block '_meta: io.modelcontextprotocol/protocolVersion "2026-07-28", io.modelcontextprotocol/clientCapabilities {}, io.modelcontextprotocol/clientInfo'. The server shows an empty gray dashed box 'nothing stored'. A purple result returns: 'resultType "complete", content 412, _meta serverInfo'.

Scene 6. Right: a request with protocolVersion '2030-01-01' gets a red #C81D25 error '-32022 Unsupported protocol version, supported ["2026-07-28"]'. The client sends the same request again with '2026-07-28' and gets a purple result.

Scene 7. Bottom bar with the byte counts from the lesson: left 'initialize 158 bytes + initialized 54 bytes once, then 125 bytes per call', right '314 bytes per call, about 190 more, one round trip, any replica'. Caption: 'The handshake moved into every request.'
`````

#### 38. M33: A tool call validated against its JSON Schema

Output: `public/notes/media/llm-systems/manim/m33-tool-call-validated-against-schema.mp4`. Page: L7: JSON Schema for tool arguments.

`````text
VIDEO: A tool call validated against its JSON Schema
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m33-tool-call-validated-against-schema.mp4
MISUNDERSTANDING TO FIX: The model's arguments are correct as long as they are valid JSON, and keywords such as default and format are enforced automatically.

Scene 1. A purple box labeled 'inputSchema (from the server)' shows the search_orders schema line by line: type "object", required ["customer_id"], customer_id pattern ^CUS-[0-9]{4}$, status enum [pending, shipped, cancelled], limit integer minimum 1 maximum 50, additionalProperties false. A last gray line reads 'title, description, default: 20 (annotations)'.

Scene 2. A gold box labeled 'Model' writes the arguments {"customer_id": "CUS-0042", "status": "shipped", "limit": 20}. A blue arrow carries them to a blue box labeled 'Host validator'.

Scene 3. The validator checks one keyword at a time. Each schema line lights up next to the matching value and gets the ink label 'pass': is an object, key present, matches, in the list, 1 <= 20 <= 50, no extra keys. The gray annotation line gets the label 'not checked'.

Scene 4. The model writes a second call {"customer_id": "42", "limit": 500, "limt": 5}. Three schema lines turn red, each with its exact message: '42' does not match '^CUS-[0-9]{4}$'; 500 is greater than the maximum of 50; Additional properties are not allowed ('limt' was unexpected).

Scene 5. The three messages join into one purple result box with isError: true and the text 'customer_id: expected CUS-NNNN, for example CUS-0042'. A gold arrow returns to the model, which writes a fixed call {"customer_id": "CUS-0042", "limit": 50}, and every line shows 'pass'.

Scene 6. A side panel shows format: "date" with the value "2026-02-30". Without a format checker the value passes in gray with the label 'annotation only'. With a format checker it turns red: '2026-02-30' is not a 'date'.

Scene 7. Summary with three ink lines: assertions can fail, annotations never fail; default is not filled in by the validator; the Python SDK accepted "2" for an int while jsonschema rejected it (measured). The schema is the contract, validation enforces it.
`````

#### 39. M34: The MRTR retry flow

Output: `public/notes/media/llm-systems/manim/m34-mrtr-retry-flow.mp4`. Page: L9: Asking the client for input: MRTR, elicitation, sampling and roots.

`````text
VIDEO: The MRTR retry flow
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m34-mrtr-retry-flow.mp4
MISUNDERSTANDING TO FIX: In MCP 2026-07-28 the server still pauses the tool call and waits on an open connection for the user's answer.

Scene 1. A blue box 'Client', an ink box 'Load balancer: round robin', and two purple boxes 'Replica A' and 'Replica B'. The client sends 'tools/call id 1 cancel_order {"order_id": "ORD-1001"}' with the label clientCapabilities {"elicitation": {"form": {}}}. The balancer sends it to Replica A.

Scene 2. Replica A returns a result labeled resultType: "input_required". It holds inputRequests.confirm = elicitation/create with the message 'Cancel order ORD-1001? This cannot be undone.' and a green sealed envelope labeled requestState "v1....". Replica A's memory turns gray and dashed: it keeps nothing.

Scene 3. The client shows a small form with one checkbox 'Confirm'. The user ticks it. The client builds the answer {"action": "accept", "content": {"confirm": true}} under the key confirm.

Scene 4. The client sends a new request: 'tools/call id 2' with the same arguments, inputResponses.confirm and the unchanged green envelope. A label says 'new id, same arguments, state echoed exactly'.

Scene 5. The balancer sends request 2 to Replica B. Replica B opens the green envelope with a green key labeled 'shared key', and three checks pass: seal valid, not expired (ttl 300 s), same order ORD-1001.

Scene 6. Replica B returns resultType: "complete" with the text 'Order ORD-1001 cancelled.' The whole exchange is shown as two complete request and response pairs, with nothing waiting between them.

Scene 7. Two red failure cases: a changed envelope gives error -32602 'Invalid or expired requestState', and a client without the elicitation capability gets error -32021 with requiredCapabilities {"elicitation": {"form": {}}}.
`````

#### 40. M35: Old elicitation over a session vs new MRTR

Output: `public/notes/media/llm-systems/manim/m35-old-elicitation-vs-mrtr.mp4`. Page: L9: Asking the client for input: MRTR, elicitation, sampling and roots.

`````text
VIDEO: Old elicitation over a session vs new MRTR
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m35-old-elicitation-vs-mrtr.mp4
MISUNDERSTANDING TO FIX: Asking the user mid-call works the same behind any load balancer in both MCP revisions.

Scene 1. A split screen. The left half is titled '2025-11-25: server-initiated request', the right half '2026-07-28: Multi Round-Trip Request'. Each half has a blue Client, an ink Load balancer and purple Replicas A and B.

Scene 2. Left: the client sends initialize with capabilities {"elicitation": {"form": {}}}, gets an Mcp-Session-Id, then sends 'tools/call id 2'. The balancer label reads 'sticky by Mcp-Session-Id', and the call reaches Replica A.

Scene 3. Left: Replica A sends its own request 'elicitation/create id 1' to the client on the open stream. Inside A, a green box 'suspended call, waits for id 1' stays lit.

Scene 4. Left: the client's response for id 1 travels as a new POST. With a non-sticky balancer it reaches Replica B, which is gray with the label 'knows nothing of id 1', and a red label 'lost' appears. With the sticky balancer it reaches A, and A returns the result for id 2.

Scene 5. Right: 'tools/call id 1' reaches Replica A, which returns resultType input_required with inputRequests and a green sealed requestState. A's memory empties at once.

Scene 6. Right: the client asks the user and sends 'tools/call id 2' with inputResponses and the same requestState. The balancer label reads 'plain round robin'. Replica B opens the state with the shared key and returns the final result.

Scene 7. A comparison table appears: where the call waits (left: in A's memory, right: nowhere), what the balancer needs (left: sticky sessions, right: any replica plus a shared sealing key), the id of the answer (left: a response to the server's id 1, right: a new client request id 2).
`````

#### 41. M36: From a 401 to a bearer call: MCP authorization discovery

Output: `public/notes/media/llm-systems/manim/m36-oauth-discovery-flow.mp4`. Page: L11: Authorization and security.

`````text
VIDEO: From a 401 to a bearer call: MCP authorization discovery
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m36-oauth-discovery-flow.mp4
MISUNDERSTANDING TO FIX: The MCP client already knows where to log in, and any valid token from the right company works on any MCP server.

Scene 1. Four labelled columns appear: 'MCP client' (blue #1E6091), 'Browser and user' (ink #100D12), 'MCP server (resource server)' (purple #6A4C93), 'Authorization server' (gold #B8860B). A blue arrow 'POST /mcp, no token' goes from client to MCP server. A purple arrow returns '401' with the header text 'WWW-Authenticate: Bearer resource_metadata=".../.well-known/oauth-protected-resource/mcp"'.

Scene 2. The client follows the URL: blue arrow 'GET /.well-known/oauth-protected-resource/mcp'. A purple JSON card slides back: {"resource": "http://127.0.0.1:8810/mcp", "authorization_servers": ["https://auth.example.com"], "scopes_supported": ["orders:read"]}. The 'resource' value is highlighted and compared with the server URL: equal, a check mark appears.

Scene 3. Blue arrow to the gold column: 'GET /.well-known/oauth-authorization-server'. A gold card returns with 'issuer', 'authorization_endpoint', 'token_endpoint' and 'code_challenge_methods_supported: ["S256"]'. The 'issuer' line is compared with the URL that was used: equal, check mark. A red variant flashes briefly: a document from 'attacker.example' that claims 'issuer: https://honest.example' gets a red cross.

Scene 4. PKCE inside the blue client box: 32 random bytes become the verifier 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk', an arrow labelled 'SHA-256, then base64url' produces the challenge 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'. Only the challenge leaves the box. The client also writes 'expected issuer = https://auth.example.com' and a random 'state' into a small green note (stored state, #2D6A4F).

Scene 5. The browser opens '/authorize' with the parameters listed one per line: client_id (an HTTPS URL, a Client ID Metadata Document), code_challenge, code_challenge_method=S256, scope=orders:read, state, resource=https://mcp.example.com/mcp. The user approves. The redirect returns 'code', 'state' and 'iss'. The client compares 'iss' with the stored issuer: check mark.

Scene 6. Blue arrow 'POST /token: code + code_verifier + resource' to the gold column. Inside the gold box, the verifier is hashed again and matched to the stored challenge. A gold token card appears labelled 'access_token, aud = this MCP server'. A red thief icon holding only the 'code' tries the token endpoint and fails, because it has no verifier.

Scene 7. Blue arrow 'POST /mcp + Authorization: Bearer <token>' to the purple server, which checks 'aud = me' and returns '200 OK'. Final split screen: a token whose audience is another service gets '401' (red), and a token without 'orders:read' gets '403 insufficient_scope' (red). Caption: 'The token is bound to one server. Never pass it through.'
`````

#### 42. M37: Five MCP revisions on one time axis

Output: `public/notes/media/llm-systems/manim/m37-version-timeline.mp4`. Page: L12: What is new: the version history.

`````text
VIDEO: Five MCP revisions on one time axis
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m37-version-timeline.mp4
MISUNDERSTANDING TO FIX: MCP still starts every connection with initialize and a session, and a new version number appears for every small change.

Scene 1. A horizontal ink (#100D12) axis from '2024-11-05' to '2026-07-28'. Five dots appear at proportional positions with the gaps written in gray (#8A8A8A): '141 days', '84 days', '160 days', '245 days'. Caption: 'A version is the date of the last breaking change.'

Scene 2. Dot '2024-11-05' expands into a card: 'initialize handshake', 'tools, resources, prompts', 'stdio and HTTP+SSE', 'no authorization'. A small client (blue #1E6091) and server (purple #6A4C93) perform the three-message handshake: initialize, result, notifications/initialized. A green (#2D6A4F) box labelled 'session' appears inside the server.

Scene 3. Dot '2025-03-26': 'OAuth 2.1', 'Streamable HTTP', 'tool annotations', 'JSON-RPC batching'. The two-endpoint HTTP+SSE drawing morphs into one '/mcp' endpoint. A batch (a JSON array of two requests) appears.

Scene 4. Dot '2025-06-18': the batch array is crossed out in red (#C81D25), labelled 'removed'. New labels pop in: 'structuredContent', 'resource server + RFC 9728', 'resource indicators RFC 8707', 'elicitation', 'MCP-Protocol-Version header'.

Scene 5. Dot '2025-11-25': 'experimental tasks', 'URL elicitation', 'sampling with tools', 'Client ID Metadata Documents', 'JSON Schema 2020-12'. A gold (#B8860B) tick above the axis marks 'joins AAIF, 2025-12-09' (an event, not a revision).

Scene 6. Dot '2026-07-28' turns purple. The green session box shatters (red). Each request now carries its own '_meta' badge: 'io.modelcontextprotocol/protocolVersion: 2026-07-28' and 'clientCapabilities'. A load balancer sends three requests to two server replicas in turn, all succeed. Labels: 'server/discover', 'MRTR: input_required, then retry', 'subscriptions/listen', 'Mcp-Method / Mcp-Name headers', 'ttlMs / cacheScope'.

Scene 7. A deprecation shelf under the axis: 'Roots', 'Sampling', 'Logging', 'Dynamic Client Registration' in gray dashed boxes with the label 'Deprecated in 2026-07-28, earliest removal: first revision on or after 2027-07-28'. Final caption: 'Stateless protocol, stateful applications.'
`````

#### 43. M38: From a Python function to an MCP tool schema

Output: `public/notes/media/llm-systems/manim/m38-function-to-tool-schema.mp4`. Page: L13: Build an MCP server and client.

`````text
VIDEO: From a Python function to an MCP tool schema
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\llm-systems\manim\m38-function-to-tool-schema.mp4
MISUNDERSTANDING TO FIX: The model sees the Python code of the tool, or the SDK needs a hand-written JSON Schema for every tool.

Scene 1. A blue (#1E6091) code panel shows the function: '@mcp.tool()', 'def get_order(order_id: Annotated[str, Field(pattern=r"^PO-\d{4}$", description="Order ID, for example PO-1001")]) -> Order:', and the docstring 'Return one production order by its ID.'. An empty purple (#6A4C93) panel on the right is titled 'tools/list entry'.

Scene 2. The function name lifts out of the code and flies right, becoming '"name": "get_order"'. The docstring flies right and becomes '"description": "Return one production order by its ID."'.

Scene 3. The parameter 'order_id: str' becomes '"inputSchema": {"type": "object", "properties": {"order_id": {"type": "string"}}}'. The Field arguments attach to it one by one: '"pattern": "^PO-\\d{4}$"', '"description": "Order ID, for example PO-1001"', and the SDK's own '"title": "Order Id"' in gray (#8A8A8A).

Scene 4. Because the parameter has no default value, the name drops into '"required": ["order_id"]'. A second example parameter 'limit: int = 10' shows the opposite: it gets '"default": 10' and stays out of 'required'.

Scene 5. The return annotation '-> Order' expands into the Pydantic model fields 'order_id', 'product', 'quantity (minimum 0)', 'status (enum released, completed, cancelled)' and becomes '"outputSchema"'. A second function returning 'int' shows the wrapping: '{"result": {"type": "integer"}}'.

Scene 6. A parameter 'ctx: Context' appears in gray and fades out before it reaches the right panel. Caption: 'Injected by the SDK, never in the schema.'

Scene 7. A tools/call request with arguments {"order_id": "1001"} hits the schema. The 'pattern' check fails and turns red (#C81D25), and the result card shows 'isError: true' with the message 'String should match pattern ^PO-\d{4}$'. Then {"order_id": "PO-1001"} passes and returns 'structuredContent' with quantity 1200. Caption: 'The model reads the schema and the error text, never the code.'
`````
