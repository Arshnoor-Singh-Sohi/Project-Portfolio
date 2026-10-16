---
title: "L1: The life of a request"
order: 1
summary: "Follow one chat request from the client to the GPU and back: the HTTP call, the chat template, tokenization, the waiting queue, the scheduler, prefill, the decode loop, sampling, incremental detokenization, server-sent events and stop conditions. Where each millisecond goes, and how vLLM V1 divides this work across processes."
status: not-started
tags: [inference, serving, vllm, streaming, sse, tokenization, scheduler, request-lifecycle]
---

## 1. The question this idea answers

You send a prompt to an LLM endpoint. A moment later, words appear one by one. What happens in between?

A typical interviewer starts with "walk me through a request". Then he asks deeper questions.

Where does tokenization run? Who decides which requests use the GPU in this step? Why is the first token slow and the next tokens fast? How does streaming work on the wire? Who notices that the answer is complete? What happens when the user closes the browser tab?

The core problem is this: one answer needs hundreds of forward passes of the model, one per output token. The GPU must serve many users at the same time. So an LLM server is not a function that returns an answer. It is a loop that runs one step at a time, and each step serves every active request a little. This lesson follows one request through that loop.

## 2. Mental model

> [!analogy] A conveyor-belt kitchen
> A restaurant has one very large cooking line. Each lap of the line takes a few milliseconds. On every lap, each seated guest gets exactly one new bite.
>
> A host (the API server) takes each order, translates it into the kitchen's codes (tokenization) and carries every bite to the table at once (streaming). A head chef (the scheduler) decides before each lap who sits at the line. A guest leaves when the meal ends. Then a waiting guest takes the seat.
>
> The first lap for a new guest is long, because the kitchen must read the whole order first (prefill). Later laps are short (decode). Each seated guest also keeps a growing tray of notes on the counter (the KV cache). Counter space, not seats, usually limits how many guests can sit.
>
> **Where it stops working:** in a real kitchen, the next bite does not depend on the bites before it. In an LLM, each new token depends on all earlier tokens, so a request can never skip ahead. Also, a guest's meal ends at an unknown moment: the model decides when to stop.

## 3. Terms

| Term | Plain meaning |
|---|---|
| request | One call from a client: a prompt plus settings such as `max_tokens` and `temperature`. |
| API gateway | A front server that terminates TLS, checks the API key, applies rate limits and chooses a replica. |
| OpenAI-compatible API | An HTTP interface with the same paths and JSON fields as OpenAI's API, for example `POST /v1/chat/completions`. vLLM, SGLang and others offer it. |
| chat template | A text pattern that turns a list of chat messages into one prompt string with special tokens. Each model has its own template. |
| token ID | An integer that names one entry of the model's vocabulary. Llama-3.1-8B has 128,256 entries. |
| API server process | In vLLM V1, the process that handles HTTP, tokenization, detokenization and streaming. |
| engine core | In vLLM V1, the process that runs the scheduler, owns the KV cache and drives the GPU workers. |
| scheduler | The code that decides, before each step, which requests run and how many tokens each one processes. |
| step | One forward pass of the model over the current batch. Also called an iteration. Each running request gets at most one new token per step (without speculative decoding). |
| prefill | The first phase of a request. The model processes all prompt tokens, in one or more steps, and writes their keys and values to the KV cache. |
| decode | The second phase: one new token per step, which reads the whole KV cache. |
| sampling | Choosing the next token ID from the model's scores (logits). See [L5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output). |
| detokenization | Turning token IDs back into text. Incremental detokenization does it piece by piece while tokens arrive. |
| server-sent events (SSE) | A way for an HTTP server to send many small messages over one open response. Each message is a `data:` line followed by an empty line. |
| stop condition | A rule that ends generation: an end-of-sequence token, a stop string, a stop token ID or a length limit. |
| finish reason | The field that tells the client why generation ended, for example `stop` or `length`. |
| ZeroMQ (ZMQ) | A messaging library. vLLM V1 uses it to pass requests and outputs between its processes. |
| abort | Removal of a request before it finishes, for example when the client disconnects. Its KV cache blocks become free. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. The request on the wire

### 4.1 What the client sends

The client sends one HTTP POST request with a JSON body. This example asks for a streamed answer:

```http
POST /v1/chat/completions HTTP/1.1
Host: llm.example.internal
Authorization: Bearer sk-example
Content-Type: application/json
Accept: text/event-stream
```

```json
{
  "model": "meta-llama/Llama-3.1-8B-Instruct",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is the capital of France?"}
  ],
  "max_tokens": 200,
  "temperature": 0.7,
  "stream": true,
  "stream_options": {"include_usage": true}
}
```

- `messages` is the conversation. The server does not remember earlier calls, so the client sends the whole history each time. [The chat API call](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) explains this in detail.
- `max_tokens` limits the number of output tokens.
- `stream: true` asks for server-sent events instead of one JSON answer at the end.
- `stream_options.include_usage` asks for a last chunk with the token counts.

### 4.2 What the server sends back

The server answers with `Content-Type: text/event-stream` and keeps the response open. Each event is one line that starts with `data: `, then an empty line. The format is plain text, so a client can read it with any HTTP library. This is a shortened example:

```text
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1760500000,"model":"meta-llama/Llama-3.1-8B-Instruct","choices":[{"index":0,"delta":{"role":"assistant","content":""},"logprobs":null,"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1760500000,"model":"meta-llama/Llama-3.1-8B-Instruct","choices":[{"index":0,"delta":{"content":"The"},"logprobs":null,"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1760500000,"model":"meta-llama/Llama-3.1-8B-Instruct","choices":[{"index":0,"delta":{"content":" capital"},"logprobs":null,"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1760500000,"model":"meta-llama/Llama-3.1-8B-Instruct","choices":[{"index":0,"delta":{},"logprobs":null,"finish_reason":"stop","stop_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1760500000,"model":"meta-llama/Llama-3.1-8B-Instruct","choices":[],"usage":{"prompt_tokens":36,"completion_tokens":9,"total_tokens":45}}

data: [DONE]

```

- Each `delta` holds only the new text, not the full answer so far.
- The chunk with a non-null `finish_reason` closes the choice. `stop_reason` is a vLLM field that is not in the OpenAI specification. It names the stop string or stop token ID that fired, or it is null for the end-of-sequence token.
- The line `data: [DONE]` ends the stream. It is not JSON. In vLLM 0.31.0, the chat handler writes exactly `data: [DONE]` followed by two newlines (source: `vllm/entrypoints/openai/chat_completion/serving.py`, checked on 2026-10-15).

[Stream events](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) compares this format with the Anthropic event format. The MCP lesson on [transports](/notes/ai/llm-systems/07-mcp/l4-transports) explains SSE fields such as `id:` and `event:`.

## 5. Inside the server: the processes of vLLM V1

> [!key] One loop, three kinds of process
> vLLM V1 divides a server into three kinds of process. The API server process handles HTTP, text in and text out. The engine core process runs the scheduling loop and owns the KV cache. One GPU worker process per GPU runs the forward passes. ZeroMQ carries messages between them.

![Alt text: the request path from the client through the gateway, the API server, the engine core and the GPU worker, and the SSE stream back](/notes/media/llm-systems/figures/04-1-request-path.svg)

The vLLM architecture page describes these processes (docs.vllm.ai, "Architecture Overview", checked on 2026-10-15):

| Process | What it does, in the words of the docs | How many |
|---|---|---|
| API server | Handles HTTP requests and input processing, including tokenization. Streams results back to clients. | 1 by default. With data parallelism, one per data-parallel rank, or the value of `--api-server-count`. |
| Engine core | "runs the scheduler, manages KV cache, and coordinates model execution across GPU workers". It runs a busy loop. | One per data-parallel rank. |
| GPU worker | "Each GPU is managed by a dedicated worker process." It loads weights and runs the forward passes. | One per GPU: $DP \times PP \times TP$. |
| DP coordinator | Balances load across data-parallel ranks. | 1, only when data parallelism is above 1. |

The docs give the total as $A + DP + N$ processes, plus 1 when $DP > 1$. Here $A$ is the number of API servers and $N = DP \times PP \times TP$ is the number of workers. Example from the docs: tensor parallelism 4 on one node gives $1 + 1 + 4 = 6$ processes. ([L8](/notes/ai/llm-systems/04-inference/l8-parallelism) explains TP, PP and DP.)

Why separate processes? Python runs one thread of Python code at a time in a process. Tokenization, detokenization and HTTP streaming need CPU time. If they run in the same process as the scheduling loop, the GPU waits for them. The vLLM V1 announcement (January 2025) says that V1 isolates an `EngineCore` loop "that focuses exclusively on the scheduler and model executor". It lists "tokenization, multimodal input processing, de-tokenization, and request streaming" as the CPU tasks that now overlap with the core loop.

In the vLLM 0.31.0 source, the API server side object `AsyncLLM` holds an `InputProcessor` (tokenization) and an `OutputProcessor` (detokenization and stop strings). The engine core checks the end-of-sequence token, stop token IDs and length limits. This division matters for the stop conditions in section 8.

## 6. The request, step by step

### 6.1 In the API server: from JSON to token IDs

1. **Validate.** The server parses the JSON into a typed object. A wrong type or an unknown model gives an HTTP 400 or 404 error before any GPU work.
2. **Apply the chat template.** The server turns `messages` into one string. For the Llama 3 family, the result has this shape (simplified: the `chat_template` field of the model's tokenizer files defines the exact text):

```text
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a helpful assistant.<|eot_id|><|start_header_id|>user<|end_header_id|>

What is the capital of France?<|eot_id|><|start_header_id|>assistant<|end_header_id|>

```

The template ends with the header of an assistant turn. So the most likely next tokens are the start of an answer. [L1 of part 02](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors) shows how token IDs become vectors.

3. **Tokenize.** The tokenizer turns the string into token IDs. [Tokens and tokenizers](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers) explains how. Special markers such as `<|eot_id|>` become single IDs.
4. **Check the length.** If the prompt is longer than `max_model_len`, the server rejects it. If the client omitted `max_tokens`, vLLM 0.31.0 takes the smallest of several limits. They include `max_model_len` minus the prompt length and a default from the model's generation config (function `get_max_tokens`, checked on 2026-10-15).
5. **Send the request to the engine core.** The API server sends the request (token IDs plus sampling settings) over ZMQ. The engine core puts it into the **waiting queue**.

### 6.2 In the engine core: the scheduling loop

The engine core repeats one loop. Each pass of the loop is one **step**:

1. **Schedule.** The scheduler fills a token budget (`max_num_batched_tokens`). Running requests come first: each decode needs 1 token of budget. Then waiting requests join: each new prompt needs as many tokens as it has, or a chunk of them. For every scheduled token, the KV cache manager must find a free slot in a block of 16 tokens (the default block size). It also checks the prefix cache: blocks that another request already computed can be reused. If memory is short, the scheduler preempts a running request. [L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) explains all of this.
2. **Execute.** The engine core sends the batch to the GPU workers. They run one forward pass over all scheduled tokens of all requests together.
3. **Sample.** For each request that needs a new token, the workers compute logits only for its last position. The vLLM model runner selects these rows with `hidden_states[logits_indices]` before the LM head. A 2,000-token prompt therefore needs one row of logits, not 2,000. Then the sampler picks one token ID per request ([L5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output)).
4. **Update.** The engine core appends each new token to its request. It checks the stop conditions that work on token IDs (section 8). It sends the new token IDs back to the API server.

The vLLM source describes the scheduler like this: "There's no 'decoding phase' nor 'prefill phase' in the scheduler. Each request just has the num_computed_tokens and num_tokens_with_spec." In each step, the scheduler assigns tokens so that `num_computed_tokens` moves toward the number of known tokens. A new prompt has many tokens to compute. A decoding request has one.

> [!note] Prefill and decode inside one step
> Since chunked prefill became the default in V1, one step can hold decode tokens of some requests and prompt tokens of others. The GPU sees one flat list of tokens. [Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) explains the two phases themselves.

### 6.3 Back in the API server: from token IDs to text

1. **Detokenize incrementally.** The `OutputProcessor` turns the new IDs into new text (section 6.4).
2. **Check stop strings.** It searches the new text for any stop string. If one appears, it cuts the text and tells the engine core to abort the request.
3. **Stream.** It writes one SSE chunk with the new text. With the default `stream_interval` of 1, vLLM sends text after every token. A larger value sends fewer, larger chunks and reduces CPU work.
4. **Finish.** When the request ends, the API server sends the chunk with `finish_reason`, an optional usage chunk, then `data: [DONE]`. The engine core frees the request's KV cache blocks. Blocks that hold full prompt prefixes can stay in the prefix cache for later requests ([L9](/notes/ai/llm-systems/04-inference/l9-prefix-caching-and-kv-reuse)).

### 6.4 Why detokenization must be incremental

Many tokenizers work on bytes, not on characters. One character can need several tokens. "é" is two bytes in UTF-8. An emoji is four bytes. If a token holds only the first byte of a character, it cannot become text alone.

```python
import codecs

# Byte-level tokens: each token is a short byte string. The emoji needs 4 bytes.
tokens = [b"Caf", b"\xc3", b"\xa9 ", b"\xf0\x9f", b"\x98\x80", b"!"]
print("text:", b"".join(tokens).decode("utf-8"))

# Wrong: decode each token alone
print([t.decode("utf-8", errors="replace") for t in tokens])

# Right: an incremental decoder keeps incomplete bytes until they form a character
dec = codecs.getincrementaldecoder("utf-8")()
print([dec.decode(t) for t in tokens])
```

Output:

```text
text: Café 😀!
['Caf', '�', '� ', '�', '��', '!']
['Caf', '', 'é ', '', '😀', '!']
```

- The first list shows the bug: each half of a character becomes the replacement character "�". A client that streams this shows garbage.
- The incremental decoder returns an empty string while a character is incomplete. It returns the full character when the last byte arrives.
- Real detokenizers have a second problem. Some tokenizers decode a token with or without a leading space depending on the tokens before it. So vLLM's slow path decodes a short window of recent tokens and emits only the new, stable part. It keeps two offsets for this, `prefix_offset` and `read_offset`. The fast path uses `DecodeStream` from the Hugging Face `tokenizers` library (vLLM 0.31.0 source, `vllm/v1/engine/detokenizer.py`, checked on 2026-10-15).

### 6.5 Why stop strings need a hold-back buffer

A stop string such as `"###"` can arrive across several tokens: `"#"` in one token and `"##"` in the next. If the server streams `"#"` at once, the client sees text that should never appear. So vLLM holds back the last characters. Its detokenizer sets the buffer to `max(len(s) for s in self.stop) - 1` characters when stop strings must be excluded from the output. This sketch shows the idea:

```python
def stream(pieces, stop):
    hold = len(stop) - 1
    text, sent = "", 0
    for piece in pieces:
        text += piece
        cut = text.find(stop)
        if cut != -1:                      # stop string found: truncate and finish
            yield text[sent:cut]
            return
        safe_end = max(sent, len(text) - hold)
        yield text[sent:safe_end]
        sent = safe_end
    yield text[sent:]

print(list(stream(["The answer", " is 42", "\n#", "## more"], "###")))
```

Output:

```text
['The answ', 'er is ', '42', '\n']
```

- `hold = 2`, so the last two characters of the text never leave early.
- The third piece makes the text end with `"\n#"`. Only `"42"` is safe to send.
- The fourth piece completes `"###"`. The stream sends `"\n"` and stops. The client never saw a `"#"`.
- The cost: the client sees each character up to `hold` tokens later. With long stop strings, streaming looks slightly less smooth.

## 7. Where the time goes

![Alt text: a timeline of one request with a TTFT of about 75.5 ms and an end-to-end latency of about 1,046 ms](/notes/media/llm-systems/figures/04-1-request-timeline.svg)

> [!example] Worked example: one request on an idle server
> Setup: Llama-3.1-8B-Instruct in BF16 on one H100 SXM. The prompt has 2,000 tokens after the chat template. The answer has 200 tokens. No other request is running. Assumptions of this example, not measurements: the network takes 20 ms in each direction, and the chat template plus tokenization take 2 ms.
>
> Hardware numbers from the NVIDIA H100 datasheet: 3.35 TB/s memory bandwidth and 1,979 TFLOPS BF16 "with sparsity", so about 989.5 TFLOPS dense. Model numbers: about 8.03 billion parameters, so about $8.03 \times 10^9 \times 2 = 16.06$ GB of weights. The KV cache needs 131,072 bytes (128 KiB) per token ([the size formula](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)).
>
> **Step 1: network in.** 20 ms (assumed).
>
> **Step 2: template and tokenization.** 2 ms (assumed). The clock is now at 22 ms.
>
> **Step 3: queue.** The server is idle, so the wait is 0 ms.
>
> **Step 4: prefill.** The matrix multiplications need about $2 \times \text{parameters} \times \text{tokens} = 2 \times 8.03 \times 10^9 \times 2000 = 3.212 \times 10^{13}$ FLOPs. Causal attention adds about $2 \times T^2 \times d \times L = 2 \times 2000^2 \times 4096 \times 32 = 1.049 \times 10^{12}$ FLOPs. The total is about $3.317 \times 10^{13}$ FLOPs. At 989.5 TFLOPS, the ideal time is $3.317 \times 10^{13} / 9.895 \times 10^{14} = 0.0335$ s, so about 33.5 ms. Prefill ends at about $22 + 33.5 = 55.5$ ms and gives the first token.
>
> **Step 5: first token back.** 20 ms of network. The client sees the first token at about $55.5 + 20 = 75.5$ ms. This is the **TTFT** (time to first token, [L2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)).
>
> **Step 6: decode.** Each decode step must read all weights once: $16.06 \times 10^9 / 3.35 \times 10^{12} = 4.794$ ms. It also reads the KV cache: at 2,000 tokens, $2000 \times 131{,}072 = 262{,}144{,}000$ bytes, about 0.078 ms more. The cache grows by one token per step. Over the 199 decode steps (tokens 2 to 200), the sum is about 970.4 ms, an average of about 4.876 ms per step.
>
> **Step 7: end-to-end.** The last token reaches the client at about $75.5 + 970.4 = 1{,}045.9$ ms, so about 1.05 s.

What this example teaches:

- **Prefill is short but heavy.** It moves 2,000 tokens through the model in about 33.5 ms, but it uses the full compute of the GPU.
- **Decode dominates the total.** 199 steps of about 4.9 ms take about 93% of the 1.05 s. Each step does little arithmetic but reads 16 GB of weights. [L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound) explains why.
- **These are lower bounds.** Real kernels do not reach peak compute or peak bandwidth. If prefill runs at 50% of peak compute (an assumption), it takes about 67 ms instead of 33.5 ms.
- **Load changes everything.** On a busy server, the request first waits in the queue. Each decode step also serves other requests, so it takes longer than 4.9 ms. A long prompt of another user can delay this request's next token. [L4](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling) shows how chunked prefill limits that delay.

```video
{
  "src": "/notes/media/llm-systems/manim/m16-life-of-a-request.mp4",
  "caption": "One chat request travels from the client through tokenization, the waiting queue, prefill and the decode loop, and returns as a stream of server-sent events."
}
```

## 8. Stop conditions

Generation stops when the first of these rules fires. The table also shows which vLLM 0.31.0 process checks each rule (sources: `vllm/v1/core/sched/utils.py` function `check_stop`, `vllm/v1/engine/detokenizer.py`, `vllm/sampling_params.py`, checked on 2026-10-15).

| Rule | Setting | Checked in | `finish_reason` |
|---|---|---|---|
| The model emits an end-of-sequence token | from the model's config, for example the IDs 128001, 128008 and 128009 of Llama-3.1-8B-Instruct | engine core | `stop` |
| The model emits a listed token ID | `stop_token_ids` | engine core | `stop` (and `stop_reason` = the ID) |
| The text contains a stop string | `stop` | API server, after detokenization | `stop` (and `stop_reason` = the string) |
| The answer reaches its length limit | `max_tokens` | engine core | `length` |
| Prompt plus answer reach the context limit | `max_model_len` of the server | engine core | `length` |

Three settings change these rules:

- `min_tokens`: before this many tokens exist, the end-of-sequence token and the stop token IDs cannot be generated. A logits processor masks them ([L5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output)).
- `ignore_eos`: the model may emit the end-of-sequence token and continue. Benchmarks use it to force a fixed output length.
- `include_stop_str_in_output`: keeps the stop string in the returned text. The default is `false`.

> [!trap] The `length` finish reason is a warning
> `finish_reason: "length"` means that the answer was cut, not completed. A cut JSON object is invalid JSON. A cut tool call cannot run. Always check `finish_reason` before you trust the output. [The chat API call](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) shows the same check for hosted APIs.

## 9. Production notes

- **Client disconnects.** vLLM wraps its route handlers with a `with_cancellation` decorator. When the HTTP connection closes, the handler task is cancelled. `AsyncLLM.abort` then removes the request from the `OutputProcessor` and from the engine core. Its KV cache blocks return to the free pool. Without this, a closed browser tab would keep consuming GPU time.
- **Admission control.** vLLM 0.31.0 has `max_num_queued_reqs`. When the number of waiting plus running requests reaches it, new requests get HTTP 503 "so the client can retry on another instance" (scheduler config docstring). The default is no limit. Without a limit, the queue can grow until every request misses its latency target.
- **Async scheduling.** In vLLM 0.31.0, `async_scheduling` is enabled by default unless an option conflicts with it. The scheduler prepares the next step while the GPU still runs the current one. The config docstring says it "helps to avoid gaps in GPU utilization".
- **Timeouts and retries.** A generation can take tens of seconds. Gateways and load balancers often have idle timeouts. A stream that sends nothing for a long time, for example during a very long prefill, can be closed by a proxy. The SSE standard suggests that authors send a comment line (a line that starts with `:`) "every 15 seconds or so" to keep such connections open. [Production operations](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) covers timeouts, retries and health checks.
- **Health and metrics.** The server exposes Prometheus metrics such as `vllm:num_requests_waiting` and `vllm:time_to_first_token_seconds`. [Autoscaling and routing](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) uses them.

### What changed recently

- **vLLM V1 (alpha announced on 2025-01-27).** The engine core became a separate process. The scheduler stopped treating prefill and decode as separate phases. Chunked prefill and prefix caching became defaults.
- **More API servers.** `--api-server-count` lets several API server processes share the tokenization and streaming work. The architecture docs say each API server "connects to **all** engine cores via ZMQ in a many-to-many topology".
- **Queue limits and async scheduling by default** (section 9) are present in vLLM 0.31.0, released on 2026-10-05 (PyPI, checked on 2026-10-15). These notes did not trace the release that introduced each one.

### Exercises

Lab folder: `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, notebook folder `llm-systems/`.

1. **Parse an SSE stream.** Write `parse_sse(chunks)`. It takes a list of byte strings: network reads that can split anywhere, even inside a line. It returns the full answer text and the `finish_reason`. Acceptance test: the bytes of the stream in section 4.2, split into pieces of 7 bytes, give `"The capital"` and `"stop"`.
   - Hint 1: keep a buffer. An event ends only at an empty line (`\n\n`).
   - Hint 2: skip events whose data is `[DONE]`. Skip chunks with an empty `choices` list.
2. **Several stop strings.** Extend the `stream` function of section 6.5 to accept a list of stop strings. It must stop at the stop string that ends first in the text. Acceptance test: pieces `["ab", "cXY", "Zd"]` with stops `["XYZ", "cX"]` give `["", "ab"]` (the stop string `"cX"` completes first).
   - Hint 1: the hold-back length is the longest stop string minus 1.
   - Hint 2: after each piece, search every stop string and keep the match with the smallest end position.
3. **Time a long request.** Use the method of section 7 for Llama-3.1-8B on one H100. The prompt has 8,000 tokens and the answer 500 tokens. The network takes 20 ms each way and tokenization 5 ms. Acceptance test: TTFT and end-to-end latency within 1% of the reference values in the hidden solution.
   - Hint 1: attention FLOPs grow with $T^2$. Include them.
   - Hint 2: the KV cache read per step grows from 8,001 to 8,499 tokens.

## 10. Common mistakes

1. **"The model receives my messages as JSON."** The model receives one sequence of token IDs. The chat template turns the messages into one string with special tokens first.
2. **"Streaming makes generation faster."** Streaming changes only when the client sees the text. The total GPU time is the same. Streaming improves perceived latency.
3. **"Decoding a token always gives a piece of text."** A byte-level token can hold part of a character. Correct streaming needs an incremental detokenizer that waits for complete characters.
4. **"The GPU checks stop strings."** In vLLM V1 the engine core checks token-level rules (end-of-sequence token, stop token IDs, length). The API server checks stop strings on the detokenized text.
5. **"Prefill is the slow part of a request."** Prefill sets the TTFT, but decode usually takes most of the end-to-end time: hundreds of steps, each bound by memory bandwidth.
6. **"When the user closes the tab, generation stops by itself."** It stops only if the server notices the disconnect and aborts the request. vLLM does this with its cancellation wrapper.
7. **"Without `max_tokens`, the answer is short."** In vLLM's server, the default can be the whole remaining context: `max_model_len` minus the prompt length.

## 11. One-minute explanation

A request arrives as an HTTP POST with JSON messages. The API server validates it, applies the chat template, tokenizes it and passes the IDs to the engine core's waiting queue. Before every step, the scheduler chooses which requests run and how many tokens each processes, within a token budget and the free KV blocks. The GPU workers run one forward pass over all scheduled tokens. The sampler then picks one new token per request from the logits of its last position. The first step for a request is prefill: it processes the whole prompt, fills the KV cache and gives the first token. Every later step is a decode step that adds one token and is limited by memory bandwidth. The engine core checks the end-of-sequence token and the length limits. The API server detokenizes incrementally, checks stop strings and streams each new piece as a server-sent event. At the end it sends the finish reason and `data: [DONE]`, and the KV cache blocks return to the pool.

## 12. Check questions

```check
{
  "question": "In vLLM V1, which process tokenizes the prompt, which process decides what runs in the next step, and which process runs the forward pass?",
  "hint": "There are three kinds of process. One handles text, one handles the loop, one handles the GPU.",
  "answer": "- The **API server process** validates the HTTP request, applies the chat template, tokenizes, detokenizes, checks stop strings and streams SSE chunks.\n- The **engine core process** owns the waiting queue, the scheduler and the KV cache manager. It decides which requests run in each step and how many tokens each processes. It checks the end-of-sequence token, stop token IDs and length limits.\n- One **GPU worker process** per GPU runs the forward pass and the sampler.\n\nThey talk over ZeroMQ. The split lets CPU work (tokenization, detokenization, streaming) overlap with the GPU loop."
}
```

```check
{
  "question": "Why can a server not turn each new token into text on its own and stream that text at once?",
  "hint": "Think about UTF-8 and about leading spaces.",
  "answer": "Two reasons.\n\n1. **Partial characters.** Byte-level tokenizers can split one character across tokens. \"é\" is 2 bytes and an emoji is 4 bytes in UTF-8. A token with only the first byte decodes to the replacement character \"�\". An incremental detokenizer waits until the character is complete.\n2. **Context-dependent spacing.** Some tokenizers decode a token with or without a leading space depending on the earlier tokens. vLLM's slow path decodes a short window of recent tokens and emits only the new stable text, with two offsets `prefix_offset` and `read_offset`. The fast path uses `DecodeStream` from the `tokenizers` library."
}
```

```check
{
  "question": "A user closes the browser tab after 10 tokens of a planned 1,000-token answer. What happens inside vLLM, and why does it matter for other users?",
  "hint": "Think about who notices the closed connection, and about the GPU memory that the request still uses.",
  "answer": "The HTTP connection closes. vLLM's `with_cancellation` wrapper notices the disconnect and cancels the handler task. `AsyncLLM.abort` removes the request from the `OutputProcessor` and from the engine core. The scheduler stops scheduling it, and its KV cache blocks return to the free pool.\n\nIt matters because a running request uses a batch slot and KV cache memory in every step. Without the abort, the server would compute 990 tokens nobody reads. That memory and compute would be missing for other requests, so their queue time and latency would grow."
}
```

```check
{
  "question": "Interview follow-up: use the idealized method of section 7 for a 4,000-token prompt and 100 output tokens. Keep the rest: Llama-3.1-8B in BF16 on one H100, network 20 ms each way, tokenization 2 ms. Compute the prefill time, the TTFT and the end-to-end latency.",
  "hint": "Prefill FLOPs are $2PT$ plus $2T^2dL$. Each decode step reads the weights plus the KV cache of all earlier tokens.",
  "answer": "**Prefill.** Linear layers: $2 \\times 8.03 \\times 10^9 \\times 4000 = 6.424 \\times 10^{13}$ FLOPs. Attention: $2 \\times 4000^2 \\times 4096 \\times 32 = 4.194 \\times 10^{12}$ FLOPs. Total $6.844 \\times 10^{13}$ FLOPs. At $9.895 \\times 10^{14}$ FLOP/s: about 69.2 ms.\n\n**TTFT.** $20 + 2 + 69.2 + 20 = 111.2$ ms.\n\n**Decode.** 99 steps. Each reads 16.06 GB of weights (4.794 ms) plus about $4050 \\times 131{,}072$ bytes of KV cache (about 0.158 ms). The average step is about 4.953 ms. The sum is about 490.3 ms.\n\n**End-to-end.** $111.2 + 490.3 \\approx 601.5$ ms.\n\nCompared with section 7, a prompt twice as long doubles the linear prefill work and quadruples the attention part. The decode steps get slightly slower because each one reads a larger KV cache."
}
```

```check
{
  "question": "Interview follow-up: vLLM computes logits only for the last position of each prompt. For a 2,000-token prompt of Llama-3.1-8B, how much compute and memory does this save?",
  "hint": "The LM head is a $4096 \\times 128{,}256$ matrix. Logits are usually kept in FP32 for sampling.",
  "answer": "The LM head multiplies a 4,096-wide hidden state by a $4096 \\times 128{,}256$ matrix. That costs $2 \\times 4096 \\times 128{,}256 = 1.0507 \\times 10^9$ FLOPs per position.\n\n- Skipping 1,999 positions saves $1999 \\times 1.0507 \\times 10^9 \\approx 2.10 \\times 10^{12}$ FLOPs, about 6.3% of the whole prefill ($3.317 \\times 10^{13}$ FLOPs).\n- It also avoids a logits tensor of $2000 \\times 128{,}256$ values. In FP32 that is $2000 \\times 128{,}256 \\times 4 = 1{,}026{,}048{,}000$ bytes, about 1.03 GB, that would be written and then discarded.\n\nOnly the last position predicts the next token. The hidden states of the other positions matter only through their keys and values, which the attention layers already wrote to the KV cache. The vLLM model runner selects the rows with `hidden_states[logits_indices]` before `compute_logits`. (Exception: a client that asks for `prompt_logprobs` needs logits for prompt positions too.)"
}
```

```check
{
  "question": "Interview follow-up: who checks stop strings in vLLM V1, and how does the server avoid streaming the first characters of a stop string? What does that cost?",
  "hint": "Stop strings are text, not token IDs. Think about a stop string that spans two tokens.",
  "answer": "The API server checks stop strings, because they are defined on text and only the API server has the detokenized text. The engine core checks only token-level rules: the end-of-sequence token, `stop_token_ids`, `max_tokens` and `max_model_len`.\n\nA stop string can arrive across several tokens, so the detokenizer holds back the last `max(len(s) for s in stop) - 1` characters while it streams, when `include_stop_str_in_output` is false. Text leaves the server only when no stop string can still start inside it. When a stop string appears, the server cuts the text at its start and aborts the request in the engine core. It sends `finish_reason: \"stop\"` with `stop_reason` set to the string.\n\nCost: the client sees each character slightly later (up to the hold-back length). Also the engine core may already have run one more step before the abort arrives, so a little GPU work is wasted."
}
```

```check
{
  "question": "Interview follow-up: what did vLLM V1 change in the path of a request, and why does a separate engine core process help throughput?",
  "hint": "The V1 announcement is from January 2025. Think about Python, the CPU and the GPU.",
  "answer": "V1 (announced on 2025-01-27) changed four things on the request path:\n\n1. **An isolated engine core.** The scheduler and model executor run in their own busy loop in a separate process. The API server process does tokenization, detokenization and streaming. ZeroMQ connects them.\n2. **One unified scheduler.** It does not separate prefill and decode. Each request has `num_computed_tokens`, and each step assigns tokens so that it catches up. Chunked prefill, prefix caching and speculative decoding fit the same rule.\n3. **Defaults.** Chunked prefill and prefix caching are enabled by default when the model supports them.\n4. **Less CPU overhead per step**, for example the persistent batch that \"caches the input tensors and only applies the diffs to them at each step\".\n\nWhy the separate process helps: Python runs one thread of Python code at a time per process. Decode steps take only a few milliseconds, so CPU work between steps can leave the GPU idle. Moving text work to another process lets it overlap with GPU execution. In vLLM 0.31.0, async scheduling also prepares the next step while the current one runs."
}
```

```check
{
  "question": "Exercise 1: show a reference solution for `parse_sse`.",
  "hint": "Split the buffer at `\\n\\n`. Join the `data:` lines of one event.",
  "answer": "```python\nimport json\n\ndef parse_sse(chunks):\n    buf, text, finish = b\"\", [], None\n    for chunk in chunks:\n        buf += chunk\n        while b\"\\n\\n\" in buf:                       # one complete event\n            event, buf = buf.split(b\"\\n\\n\", 1)\n            data = \"\\n\".join(line[len(\"data: \"):] for line in event.decode(\"utf-8\").split(\"\\n\")\n                             if line.startswith(\"data: \"))\n            if not data or data == \"[DONE]\":\n                continue\n            obj = json.loads(data)\n            for choice in obj.get(\"choices\", []):\n                text.append(choice.get(\"delta\", {}).get(\"content\") or \"\")\n                if choice.get(\"finish_reason\"):\n                    finish = choice[\"finish_reason\"]\n    return \"\".join(text), finish\n```\n\n- The buffer holds bytes, not text. A 7-byte read can end in the middle of a multi-byte character, so decode only complete events.\n- An event ends at an empty line. Several `data:` lines of one event join with a newline, as the SSE standard says.\n- `[DONE]` is not JSON, so skip it before `json.loads`.\n- The usage chunk has an empty `choices` list, so the inner loop does nothing for it."
}
```

```check
{
  "question": "Exercise 2: show a reference solution for stop strings with a list of stops.",
  "hint": "Hold back the longest stop string minus 1 characters. Choose the match that ends first.",
  "answer": "```python\ndef stream_multi(pieces, stops):\n    hold = max(len(s) for s in stops) - 1\n    text, sent = \"\", 0\n    for piece in pieces:\n        text += piece\n        best = None                                  # (end, start) of the earliest finished stop string\n        for s in stops:\n            i = text.find(s)\n            if i != -1 and (best is None or i + len(s) < best[0]):\n                best = (i + len(s), i)\n        if best is not None:\n            yield text[sent:best[1]]\n            return\n        safe_end = max(sent, len(text) - hold)\n        yield text[sent:safe_end]\n        sent = safe_end\n    yield text[sent:]\n\nassert list(stream_multi([\"ab\", \"cXY\", \"Zd\"], [\"XYZ\", \"cX\"])) == [\"\", \"ab\"]\n```\n\nThe first piece `\"ab\"` is shorter than the hold-back of 2, so nothing leaves. After `\"cXY\"`, the text is `\"abcXY\"`. `\"cX\"` ends at position 4, `\"XYZ\"` is not complete yet. So the stream sends `\"ab\"` and stops. vLLM's `check_stop_strings` uses the same rule: when several stop strings match, \"the stop string that completes earliest in the text is selected\"."
}
```

```check
{
  "question": "Exercise 3: show a reference solution for the 8,000-token request.",
  "hint": "Reuse the model of section 7 with $T = 8000$ and 500 output tokens.",
  "answer": "```python\nP = 8030261248; W = 2 * P; BW = 3.35e12; PEAK = 989.5e12; KV = 131072; d = 4096; L = 32\nT, n_out = 8000, 500\nprefill = (2 * P * T + 2 * T * T * d * L) / PEAK\ndecode = sum((W + (T + i) * KV) / BW for i in range(1, n_out))\nttft = 0.020 + 0.005 + prefill + 0.020\ne2e = ttft + decode\nprint(f\"prefill {prefill*1e3:.1f} ms, TTFT {ttft*1e3:.1f} ms, decode {decode*1e3:.1f} ms, E2E {e2e*1e3:.1f} ms\")\n```\n\nOutput: `prefill 146.8 ms, TTFT 191.8 ms, decode 2553.4 ms, E2E 2745.2 ms`.\n\n- Attention is now about 12% of the prefill FLOPs ($1.68 \\times 10^{13}$ of $1.45 \\times 10^{14}$), because it grows with $T^2$.\n- Each decode step reads about 1.05 GB of KV cache on top of 16.06 GB of weights. So the average step is about 5.12 ms instead of 4.88 ms."
}
```

## 13. Links

- Next lesson: [L2: Latency and throughput metrics](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)
- Previous part: [L6: Shrinking the KV cache](/notes/ai/llm-systems/03-kv-cache/l6-shrinking-the-kv-cache)
- Related: [Prefill and decode](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode), [Compute-bound vs memory-bound](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound), [Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling), [Sampling and structured output](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output), [Serving engines](/notes/ai/llm-systems/04-inference/l10-serving-engines), [Containers and model loading](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading)
- Older notes: [The chat API call](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call), [Tokens and tokenizers](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers), [Stream events](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events)
- Paper: [The vLLM system and its kernels](/notes/papers/llm-serving/2023-pagedattention/08-implementation)

### Sources

- vLLM, "Architecture Overview": https://docs.vllm.ai/en/latest/design/arch_overview/ (checked on 2026-10-15)
- vLLM blog, "vLLM V1: A Major Upgrade to vLLM's Core Architecture" (2025-01-27): https://vllm.ai/blog/2025-01-27-v1-alpha-release (checked on 2026-10-15)
- vLLM 0.31.0 source code (sdist from PyPI, released 2026-10-05): `vllm/v1/core/sched/scheduler.py`, `vllm/v1/core/sched/utils.py`, `vllm/v1/engine/detokenizer.py`, `vllm/v1/engine/async_llm.py`, `vllm/sampling_params.py`, `vllm/config/scheduler.py`, `vllm/entrypoints/serve/utils/api_utils.py`, `vllm/entrypoints/openai/chat_completion/serving.py` and `protocol.py`: https://pypi.org/project/vllm/0.31.0/ (checked on 2026-10-15)
- vLLM, "Metrics" design doc (request intervals): https://docs.vllm.ai/en/latest/design/metrics/ (checked on 2026-10-15)
- NVIDIA H100 product page and specifications: https://www.nvidia.com/en-eu/data-center/h100 (checked on 2026-10-15)
- Llama-3.1-8B-Instruct model card (GQA, 128k context, 8B parameters): https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct. Its `config.json` lists `eos_token_id` [128001, 128008, 128009] and `tie_word_embeddings` false (checked in a copy of the config on 2026-10-15).
- WHATWG HTML Living Standard, "Server-sent events": https://html.spec.whatwg.org/multipage/server-sent-events.html (checked on 2026-10-15)
