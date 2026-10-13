---
title: "L3: Tool-result clearing"
order: 3
summary: "After the model has used a tool result, replace its content with a short note and keep the IDs and the message structure. One of the safest compressions, with large savings, and a trade-off with prompt caching."
status: not-started
tags: [compress, tool-result-clearing, context-editing, prompt-caching]
---

## 1. The question this idea answers

At step 3, an agent ran a product search. The tool returned 2,000 tokens of JSON. The model read it and answered. At step 20, those 2,000 tokens are still in the window, and every call sends them again (lesson [1.6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation)). Can I remove them? How do I do it without breaking the API format? How much does it save? And does the provider do it for me?

## 2. Mental model

> [!analogy] Returning a reference book
> You borrow a thick reference book from a library. You read it, copy the one figure that you need into your notebook, and return the book. Your desk stays clear. If you need the book again, you borrow it again.
>
> **Where it stops working:** three limits. First, do not return the book before you have read it: a result that the model has not used yet is pending content. Second, the library copy can change, so a second fetch may give different data. Third, your note must say which book and which page, or you cannot find it again. A cleared result needs a note that names the tool call that produced it.

## 3. Terms

| Term | Plain meaning |
|---|---|
| tool-result clearing | Replacing the content of an already-used tool result with a short note. The tool call and its ID stay in the history. |
| placeholder note | The short text that replaces a cleared tool result. A good note states the key outcome and how to fetch the data again. |
| `tool_use_id` | The field of an Anthropic `tool_result` block that names the `tool_use` block it answers. |
| `tool_call_id` | The field of an OpenAI Chat Completions `tool` message that names the tool call it answers. The Responses API uses `call_id`. |
| context editing | An Anthropic API feature that clears old tool results or thinking blocks on the server before the prompt reaches the model. |
| `clear_at_least` | A context-editing parameter: the minimum number of tokens that one clearing must free, or the API skips the clearing. |
| `exclude_tools` | A context-editing parameter: tools whose results are never cleared. |

## 4. Method and math

### 4.1 Why clearing is safe after use

A tool result has a short life. The model reads it, takes what it needs, and acts: it answers the user or calls the next tool. After that, the raw result is stale context (lesson [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects)). Clearing it is recoverable compression (lesson [7.1](/notes/ai/context-engineering/07-compress-and-isolate/l1-why-compress)): the agent can run the same call again if it needs the data.

Three conditions make a clearing safe:

1. **The model has acted on the result.** An assistant message comes after it.
2. **The note keeps the outcome.** For example: "15 laptops under USD 1,000. Top match: ThinkPad X1 Carbon at USD 999.99."
3. **The note says how to fetch it again.** For example: "Call `search_products` with the same arguments to see all 15 records."

> [!note] Source check: "the safest, lightest-touch form of compaction"
> **Corrected.** The handbook (Session 5, §3.2, Listing 2 and FAQ Q7) quotes Anthropic as calling tool-result clearing "the safest, lightest-touch form of compaction". The post says "one of the safest lightest touch forms of compaction". FAQ Q38 also says that "Building Effective Agents" (19 December 2024) makes clearing the primary technique. That post does not mention clearing. Its topics are workflow and agent patterns. Sources: Anthropic Engineering, "Effective context engineering for AI agents" (29 September 2025) and "Building effective agents".

### 4.2 The savings arithmetic

> [!example] Worked example: one result (Session 5, §3.2)
> A search returns 15 product records with 20 fields each: about 2,000 tokens. The note has about 20 tokens.
>
> Savings $= 1 - 20/2{,}000 = 99\%$ for that block.

The handbook then counts a coding session: 20 tool calls with an average of 1,500 tokens each give $20 \times 1{,}500 = 30{,}000$ tokens of results. That is 15% of a 200K window and 3% of a 1M window. But the share of the window hides the real cost: each result is sent again on **every later call**.

Define an agent with $N$ tool results. Result $j$ arrives after call $j$, so it is part of calls $j+1$ to $N+1$. It appears $N + 1 - j$ times. The total appearances are:

$$
\sum_{j=1}^{N} (N + 1 - j) = \frac{N(N+1)}{2}
$$

The symbols mean:

- $N$ is the number of tool results in the session.
- $j$ is the step at which a result arrives.

> [!example] Worked example: 20 results of 1,500 tokens
> $N = 20$, so the results appear $\frac{20 \times 21}{2} = 210$ times across 21 calls.
>
> - **No clearing:** $1{,}500 \times 210 = 315{,}000$ input tokens of tool results.
> - **Clearing after use:** each result is sent in full once (on the call right after it), then as a 20-token note. $1{,}500 \times 20 + 20 \times (210 - 20) = 30{,}000 + 3{,}800 = 33{,}800$ tokens.
> - **Savings:** $1 - 33{,}800 / 315{,}000 \approx 89\%$. At USD 2 / MTok without caching: 0.63 USD against about 0.068 USD.

The per-call input shows the same effect. Take a fixed prefix of 6,000 tokens, a 200-token tool call and a 1,500-token result per step. Without clearing, call $k$ sends $6{,}000 + 1{,}700\,(k-1)$ tokens. With clearing, it sends $6{,}000 + 220\,(k-1) + 1{,}480$, because only the latest result is in full. At call 21 that is 40,000 tokens against 11,880.

### 4.3 Keep the IDs and the structure

A tool result is not free text. It is a typed block that points to a tool call by ID (lesson [6.2](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop)). Clearing must change only the **content** of the result.

**Anthropic Messages API.** Before clearing:

```json
[
  {"role": "assistant", "content": [
    {"type": "tool_use", "id": "toolu_01A", "name": "search_products",
     "input": {"category": "laptops", "max_price": 1000}}]},
  {"role": "user", "content": [
    {"type": "tool_result", "tool_use_id": "toolu_01A",
     "content": "[{\"sku\": \"TP-X1C\", \"price\": 999.99, ... 15 records ...}]"}]}
]
```

After clearing, only the `content` string of the `tool_result` changes:

```json
{"type": "tool_result", "tool_use_id": "toolu_01A",
 "content": "[cleared] 15 laptops under USD 1,000. Top match: ThinkPad X1 Carbon, USD 999.99. Call search_products with the same input to see all records."}
```

**OpenAI.** Chat Completions puts the result in a `tool` message with a `tool_call_id`. The Responses API uses a `function_call_output` item with a `call_id`. Keep the ID field and replace only `content` or `output`:

```json
{"role": "tool", "tool_call_id": "call_abc", "content": "[cleared] 15 laptops ..."}
{"type": "function_call_output", "call_id": "call_abc", "output": "[cleared] 15 laptops ..."}
```

Four details matter:

1. **Parallel calls.** On Anthropic, one user message can hold several `tool_result` blocks, one per parallel call. Clear each block on its own. Do not replace the whole message.
2. **Error results.** Keep `is_error: true` on a cleared error result, so that the history still shows that the call failed.
3. **Inputs.** The tool call's `input` stays by default. It tells the model what it asked for. A very large input, such as a file to write, can also be cleared.
4. **Copies.** Edit a deep copy of the message, not the caller's list. A shallow `list.copy()` shares the nested dictionaries.

### 4.4 Let the provider do it (checked on 2026-10-12)

**Anthropic context editing.** Beta header `context-management-2025-06-27`. You add a strategy of type `clear_tool_uses_20250919` to `context_management.edits`. The docs say: "Context editing is applied server-side before the prompt reaches Claude. Your client application maintains the full, unmodified conversation history."

| Parameter | Default | Meaning |
|---|---|---|
| `trigger` | 100,000 input tokens | When clearing starts. The unit is `input_tokens` or `tool_uses`. |
| `keep` | 3 tool uses | The most recent tool use and result pairs that stay in full. |
| `clear_at_least` | none | The minimum tokens one clearing must free. Otherwise it is skipped. Use it to decide whether clearing is worth breaking the cache. |
| `exclude_tools` | none | Tools whose results are never cleared, for example a memory tool. |
| `clear_tool_inputs` | false | Whether the tool-call inputs are also cleared. |

The API clears the oldest results first and puts placeholder text in their place. A second strategy, `clear_thinking_20251015`, clears old thinking blocks. Context editing launched in beta on 29 September 2025. The launch article reports that memory plus context editing "improved performance by 39% over baseline", and context editing alone by 29%. In a 100-turn web-search evaluation, it reported "reducing token consumption by 84%".

The Anthropic docs now rank server-side compaction (lesson [7.2](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction)) as the primary strategy, and context editing as the finer-grained option.

**LangChain.** `ContextEditingMiddleware` with `ClearToolUsesEdit` does the same on the client, with any provider. Its placeholder is `[cleared]`.

**Claude Code.** As the context fills, "It clears older tool outputs first, then summarizes the conversation if needed."

### 4.5 The trade-off with prompt caching

Clearing changes the history. Prompt caching needs an exact prefix (lesson [1.7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)). So a clearing invalidates the cache from the earliest cleared block onward. The Anthropic docs say context editing "Invalidates cached prompt prefixes when content is cleared."

Count the cost of one clearing in token units. It frees $F$ tokens. $A$ tokens come after the earliest cleared block and must be written to the cache again.

$$
n \ge \frac{w\,A - r\,(A + F)}{r\,F}
$$

The symbols mean:

- $n$ is the number of later calls needed before the clearing recovers its cost.
- $F$ is the number of tokens that the clearing frees.
- $A$ is the number of tokens after the edit point that must be written again.
- $w$ and $r$ are the cache-write and cache-read multipliers.

> [!example] Worked example: is this clearing worth it?
> - $F = 30{,}000$, $A = 40{,}000$, $w = 1.25$, $r = 0.05$ (Sonnet 5.5): $n \ge (50{,}000 - 3{,}500)/1{,}500 = 31$ calls.
> - Same, with $r = 0.1$ (most Claude models): $n \ge (50{,}000 - 7{,}000)/3{,}000 \approx 14.3$, so 15 calls.
> - $F = 30{,}000$, $A = 10{,}000$, $r = 0.1$: $n \ge (12{,}500 - 4{,}000)/3{,}000 \approx 2.8$, so 3 calls.
>
> On cost alone, a clearing pays when it frees many tokens compared with what it forces you to rewrite. That is why `clear_at_least` exists. Clear in batches, not one result at a time.

Two reasons still favor clearing when the cost case is weak. Stale results hurt quality (lesson 1.5). And without clearing, the history reaches the window limit sooner, which forces a compaction that also breaks the cache.

### 4.6 Reasoning traces and images

The handbook (Session 5, FAQ Q44) applies the same idea to reasoning. After a decision, it replaces 5,000 to 10,000 tokens of step-by-step reasoning with a line such as "Analyzed 3 options (X, Y, Z). Chose Y because of criteria A and B." Three caveats:

1. **Thinking blocks are provider objects.** Do not rewrite them by hand. On Anthropic, use the `clear_thinking_20251015` strategy. On other providers, read the docs on how earlier reasoning is carried.
2. **Decisions that may change.** If the agent may revisit a decision, keep more of the reasoning, or write it to a memory store (Part 8).
3. **Images.** A processed screenshot can be replaced by a text description, for example "Error dialog: database connection timeout on port 5432". A 1,000 × 1,000 pixel image costs 1,296 tokens on Claude (lesson [1.2](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers)).

### 4.7 Production view

| Concern | What this lesson means for it |
|---|---|
| Reliability | Change only the content. Keep `tool_use_id`, `tool_call_id` or `call_id`, the block type and `is_error`. Validate the pairs after every edit. |
| Cost | Clearing removes the quadratic re-send of tool results. With caching, clear in batches that free enough tokens. |
| Quality | Clearing removes stale data. A note that keeps the key outcome prevents a needless second call. |
| Security | Clearing also removes injected text in old results from the window. Keep the raw result in your logs for audit. |
| Observability | Log every clearing: tool name, ID, tokens freed, note text. The client keeps the full history when the server clears. |

## 5. Graphs

```plot
{
  "title": "Input of call k in thousands of tokens: no clearing (red), clearing after use (blue). Prefix 6,000, call 200, result 1,500 per step",
  "xAxis": { "label": "call number k", "domain": [2, 21] },
  "yAxis": { "label": "thousands of tokens", "domain": [0, 42] },
  "disableZoom": true,
  "data": [
    { "fn": "6 + 1.7*(x-1)", "color": "#C81D25" },
    { "fn": "7.48 + 0.22*(x-1)", "color": "#1E6091" }
  ]
}
```

Both lines start at call 2, the first call with a tool result. At call 21, the red line is at 40.0 thousand and the blue line at 11.88 thousand. The slope of the blue line is the 200-token call plus the 20-token note.

## 6. Code

These exercises go in `notebooks/07-compress-and-isolate.ipynb`. Put the clearing functions in `src/compress/clearing.py`.

**Exercise 3.1: clear by ID, in two formats.**

1. Write `clear_anthropic(messages, tool_use_id, note)` that finds the `tool_result` block with that ID and replaces only its `content`.
2. Write `clear_openai_chat(messages, tool_call_id, note)` for `tool` messages.
3. Both functions return a new list and never change the input list.

Acceptance tests:

- After clearing, every ID and every block type is unchanged.
- In a user message with three parallel results, clearing one leaves the other two unchanged.
- The input list is unchanged after the call (compare with a deep copy).
- An unknown ID raises a `KeyError`.

**Exercise 3.2: a clearing policy.**

1. Write `clear_old_results(messages, keep=3, exclude=(), min_free=0, count_tokens=...)`. It clears every used result except the newest `keep`, skips tools in `exclude`, and does nothing if it would free fewer than `min_free` tokens.
2. Build a synthetic session of 20 tool steps with 1,500-token results. Count the input of every call with and without the policy.

Acceptance tests:

- The total tool-result tokens match 315,000 and 33,800 from section 4.2, for `keep=1` and 20-token notes.
- A result with no assistant message after it is never cleared.

**Exercise 3.3: a cache-aware decision.**

1. Write `calls_to_recover(F, A, w, r)` that returns the smallest whole number of later calls that satisfies the formula of section 4.5.
2. Write `worth_clearing(F, A, w, r, expected_calls)` that returns `True` only if the session has at least that many calls left.

Acceptance tests:

- `calls_to_recover` returns 31, 15 and 3 for the three cases of section 4.5.
- `worth_clearing(30_000, 40_000, 1.25, 0.05, 10)` returns `False`.

**Exercise 3.4 (optional, costs money): context editing on the real API.** Send a session with 10 large tool results. Use the `clear_tool_uses_20250919` strategy with a low trigger. Print the usage of each call and compare it with the same session without the strategy.

Acceptance test: a table of the input tokens per call, with and without the strategy, and the call at which the first clearing occurs.

**Debug exercise: the handbook's clearing function (Session 5, Listing 2).** Find the problems and write a fix.

```python
def clear_tool_result(messages, tool_call_index, summary):
    """This is the 'safest, lightest-touch form of compaction' (Anthropic)."""
    new_messages = messages.copy()
    original = new_messages[tool_call_index]
    new_messages[tool_call_index] = {
        "role": original["role"],
        "content": f"[Tool result summary: {summary}]"
    }
    return new_messages
```

The answer is in the check questions.

## 7. Common mistakes

1. **"Replace the tool-result message with a text message."** The `tool_result` block and its ID disappear. The next call fails. Change only the content.
2. **"Clear every result as soon as it arrives."** The model has not used it yet. Clear only after an assistant message follows it.
3. **"Clearing always saves money."** With caching, each clearing forces a cache rewrite. Clear in batches and use `clear_at_least`.
4. **"The note can be empty."** An empty note forces the model to guess or to repeat the call. Keep the key outcome and the way to fetch the data again.
5. **"Clearing thinking blocks by hand is the same as clearing tool results."** Thinking blocks are provider objects. Use the provider's own strategy.

## 8. One-minute explanation

A tool result is useful for one step. The model reads it and acts, and after that it is stale data that every later call sends again. Tool-result clearing replaces its content with a short note: the key outcome and how to fetch the data again. It is one of the safest compressions, because the model already used the result and the agent can run the call again. Change only the content and keep the IDs, or the API rejects the next call. Without clearing, 20 results of 1,500 tokens add 315,000 input tokens over a session. With clearing, they add about 34,000. Anthropic's context editing and LangChain's middleware do this for you. With prompt caching, each clearing breaks the cache after the edit point. So clear in batches that free enough tokens.

## 9. Check questions

```check
{
  "question": "An agent makes 30 tool calls. Each result has 1,000 tokens, and each note has 25 tokens. Each result is sent in full on the next call only. How many result tokens are sent in total, with and without clearing?",
  "hint": "The results appear N(N + 1)/2 times in total.",
  "answer": "Appearances: 30 × 31 / 2 = 465. Without clearing: 1,000 × 465 = 465,000 tokens. With clearing: 1,000 × 30 + 25 × (465 − 30) = 30,000 + 10,875 = 40,875 tokens. Savings ≈ 91%."
}
```

```check
{
  "question": "A clearing frees F = 50,000 tokens. The history after the earliest cleared block has A = 20,000 tokens. Cache write 1.25, read 0.1. After how many later calls does the clearing recover its cost?",
  "hint": "n ≥ (w·A − r·(A + F)) / (r·F).",
  "answer": "n ≥ (1.25 × 20,000 − 0.1 × 70,000) / (0.1 × 50,000) = (25,000 − 7,000) / 5,000 = 3.6. So after 4 later calls."
}
```

```check
{
  "question": "On the Anthropic API, a user message holds three tool_result blocks from parallel calls. A function replaces that whole message with {\"role\": \"user\", \"content\": \"[summary]\"}. What breaks?",
  "answer": "All three tool_result blocks and their tool_use_id fields disappear. The previous assistant message still holds three tool_use blocks that now have no results, so the API rejects the next request. The fix clears the content of each tool_result block and keeps the blocks and IDs."
}
```

```check
{
  "question": "Why does Anthropic's context-editing strategy have an exclude_tools parameter? Give an example of a tool that you would exclude.",
  "answer": "Some tool results stay useful for the whole task, so clearing them would remove needed context. A memory tool is a good example: its results hold notes that the agent wrote on purpose. A tool that returns the current plan or a configuration that later steps read is another."
}
```

```check
{
  "question": "Debug exercise: list the problems in the handbook's clear_tool_result (Session 5, Listing 2).",
  "answer": "1. It replaces the whole message with plain text, so the tool_result block type and its tool_use_id (Anthropic) or tool_call_id (OpenAI) disappear, and the next call fails. 2. It clears every block in that message, including other parallel results and any text. 3. It addresses the result by list index, which shifts after other edits. Address it by tool ID. 4. It does not check that the model has used the result: an assistant message must follow it. 5. It drops is_error. 6. The docstring misquotes Anthropic: the post says \"one of the safest\". The shallow messages.copy() is safe here only because the function replaces the element. A fix that edits the nested block must deep-copy the message first."
}
```

## 10. Links

- Previous: [L2: Summarization and compaction](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction)
- Next: [L4: Priority trimming and hierarchical compression](/notes/ai/context-engineering/07-compress-and-isolate/l4-priority-trimming-and-hierarchical-compression)
- [6.2: The tool-call loop](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop) and [6.4: Tool results and errors](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors)
- [1.7: Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)
- [Glossary](/notes/ai/context-engineering/glossary)
