---
title: "Session log"
order: 1
summary: "What happened in each session, newest first."
status: in-progress
---

## Session 1: 2026-10-15

**Topic:** the subject was created for an interview in 1 to 2 weeks.

### My request

> "I need to really master those concepts in as much detail as possible. Please plan out everything build an extensive study guide in note no matter how many images videos you need I dont care explain them from first principles anything which is required to master those concepts has to be added in the notes Use easy langauge so I can really understand those concepts."

The request followed a friend's account of a deep-dive interview. The interview was about MCP, PagedAttention, the KV cache, RAG, cloud hosting and inference.

### Decisions

| Question | My choice |
|---|---|
| When is your interview, or when could a similar deep-dive interview happen? | "Within 1–2 weeks" |
| How should I hand the guide to you while I build it? | "All at once" |

- One new subject, `ai/llm-systems/`, with 8 parts: math and hardware, attention, the KV cache, inference, cloud hosting, RAG, MCP and interview drills.
- The paper has its own folder in the Papers area, in a new topic `llm-serving/`: [PagedAttention (2023)](/notes/papers/llm-serving/2023-pagedattention). Parts 03 and 04 link to its pages.
- Older lessons are linked, not repeated. A new lesson explains a detail briefly and links the older lesson for more.
- Every lesson starts from zero background and goes down to formulas, byte counts, message fields and code.
- All pages share running examples: the toy attention example, Llama-3.1-8B and Llama-3.1-70B, and the H100 SXM. The [subject page](/notes/ai/llm-systems) lists them.
- The part tables have a Priority column, Core or Support, instead of project stage codes. This subject prepares an interview, not a project.
- The [course plan](/notes/ai/llm-systems/course-plan) has a 12-day study plan. Days 1 to 5 cover the core interview chain.
- Media: 98 SVG figures in the lessons, and 43 planned videos (38 for the subject, 5 for the paper). The [media queue](/notes/ai/llm-systems/00-progress/media-queue) lists them.

### Findings to remember

- **The vLLM memory default.** `gpu_memory_utilization` is 0.92 in vLLM 0.31.0, not 0.9. The default was 0.9 up to vLLM 0.19.0 and is 0.92 from vLLM 0.20.0, so old tutorials say 0.9. See [Sizing GPUs for a model](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus). The paper's vLLM v0.2.0 used 0.90 ([05 The KV cache manager and block tables](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager)).
- **The bytes of one decode step.** A decode step of Llama-3.1-8B reads about 15.0 GB of weights, not 16 GB. It reads only one row of the 1.05 GB embedding table. The tighter bound is about 4.48 ms and about 223 tokens per second, against the standard 4.8 ms and 208. See [GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) and [Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode).
- **Decode attention intensity.** In BF16 it is $H / H_{kv}$ FLOPs per byte: 4 for Llama-3.1-8B, and 1 for multi-head attention. It does not depend on the batch size or the context length. See [Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode).
- **The paper's units.** The paper's "800 KB" per token of OPT-13B is exactly 800 KiB (819,200 bytes). Its "1.6 GB" for 2,048 tokens is 1.5625 GiB. See [The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula) and [03 The question](/notes/papers/llm-serving/2023-pagedattention/03-the-question).
- **Gated Llama configs.** The official Llama-3.1 repositories on Hugging Face are gated: a download needs an access token ([Containers and model loading](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading)). So the lessons take the config values from Table 3 of the Llama 3 paper ([The KV cache size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)). They also use Meta's reference code ([From text to vectors and back](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors)). The Hugging Face model API gives the parameter counts ([Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode)).
- **MCP Python SDK 2.3.0 against the specification.** Measured in the lessons on 2026-10-15:
  - An unknown tool name gives a result with `isError: true`, not the -32602 error that the spec shows ([Tools in depth](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth)).
  - A missing required prompt argument gives -32603. The spec says that a server SHOULD use -32602 ([Resources and prompts](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts)).
  - The SDK validates arguments with Pydantic in lax mode. It accepted `"2"` and `true` for an `int` and ignored extra keys. So it accepts more than its published schema allows ([JSON Schema for tool arguments](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments)).
- **Product names that changed in 2026.** Google renamed Vertex AI to Gemini Enterprise Agent Platform on 22 April 2026. Azure AI Foundry is now Microsoft Foundry. Databricks' AI Gateway for serving endpoints is now marked legacy, and Unity Gateway is the current governance layer. See [Managed platforms](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms). Databricks Vector Search is now Databricks AI Search ([Production RAG architecture](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture)).

### Open

- Diagnostic: not started.
- Videos: not made yet. All 43 are "planned" in the [media queue](/notes/ai/llm-systems/00-progress/media-queue).
