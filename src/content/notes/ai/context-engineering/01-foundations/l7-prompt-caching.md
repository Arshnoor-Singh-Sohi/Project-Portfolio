---
title: "L7: Prompt caching"
order: 7
summary: "Providers can reuse the processed form of a repeated prompt prefix. Reads are much cheaper and faster, writes cost a little more, and one changed token invalidates everything after it. So stable content goes first."
status: not-started
tags: [foundations, prompt-caching, cost, latency]
---

## 1. The question this idea answers

Every call sends the same system prompt and tool definitions, and most of the same history (lesson [L6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation)). The model processed those tokens on the last call. Can the provider reuse that work, so that I pay less and wait less?

Yes. This is **prompt caching**. It has strict rules, and the layout of the context decides whether it works.

## 2. Mental model

> [!analogy] A bookmark in a long book
> You read the first 200 pages of a book yesterday. Today you get the same book with 10 new pages at the end. If the first 200 pages are **exactly** the same, you jump to your bookmark and read only the new pages.
>
> **Where it stops working:**
> - If one word on page 3 changed, the bookmark is useless from page 3 on. The match must be exact from the first token.
> - The bookmark expires after a few minutes without use.
> - Placing the bookmark costs a little extra the first time.
> - The model still "has" all 210 pages in its window. Caching saves processing, not window space.

## 3. Terms

| Term | Plain meaning |
|---|---|
| prompt caching | The provider stores the processed form of a prompt prefix and reuses it on a later call with the same prefix. |
| prefix | The start of the input, from the first token up to a chosen point. |
| cache write | The first call that stores a prefix. It can cost more than normal input. |
| cache read (cache hit) | A later call that reuses the stored prefix. It costs much less than normal input. |
| cache miss | The prefix does not match, or the cache expired. The tokens are processed at the normal price. |
| time to live (TTL) | How long a stored prefix stays available. |
| cache breakpoint | A marker that says "cache the input up to here" (Anthropic: `cache_control`). |
| cache hit rate | The share of input tokens that came from the cache. |

## 4. Method and math

### 4.1 What the provider stores

Lesson [L4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) showed that prefill computes the keys and values of every input token. In causal attention, the keys and values of token $i$ depend only on tokens $1$ to $i$. So if two calls start with the same tokens, those keys and values are identical. The provider can store them and skip that part of prefill on the next call.

This is why the match must be on a **prefix**, and why it must be **exact**. One changed token at position $j$ changes the keys and values of every token after $j$.

```mermaid
flowchart LR
    A[Tool definitions] --> B[System prompt] --> C[Long reference document] --> D[Turns 1 to 9] --> E[New user message]
    style A fill:#2A9D8F,color:#fff
    style B fill:#6A4C93,color:#fff
    style C fill:#B8860B,color:#fff
    style D fill:#8A8A8A,color:#fff
    style E fill:#1E6091,color:#fff
```

On the next turn, blocks A to D are the same, so they come from the cache. Only the new turn is processed at the full price. If block B changes, blocks B, C and D are all processed again.

### 4.2 Anthropic: explicit breakpoints

All values below were checked on 2026-10-12 in the Anthropic prompt-caching and pricing docs.

| Rule | Value |
|---|---|
| How to turn it on | Put `"cache_control": {"type": "ephemeral"}` on a content block. Or put one `cache_control` at the top level of the request: the API then moves the breakpoint forward as the conversation grows (automatic caching). |
| Order of the prefix | Tools, then system, then messages. |
| Number of breakpoints | Up to 4. |
| Lifetime | 5 minutes by default. Each hit refreshes it at no cost. A 1-hour lifetime is available with `"ttl": "1h"`. |
| Minimum size | 512 tokens on the newest models (for example Opus 5.5, Sonnet 5.5, Haiku 5.5). Some older models need 1,024, 2,048 or 4,096. A shorter prefix is not cached, and there is no error. |
| Exact match | "Cache hits require 100% identical prompt segments, including all text and images up to and including the block marked with cache control." |
| Usage fields | `cache_creation_input_tokens` (written), `cache_read_input_tokens` (read), `input_tokens` (after the last breakpoint). |

Prices are multiples of the normal input price:

| Operation | Multiplier |
|---|---|
| Cache write, 5-minute lifetime | 1.25 × |
| Cache write, 1-hour lifetime | 2 × |
| Cache read | 0.1 × on most models. 0.05 × on Opus 5.5 and Sonnet 5.5. 0.025 × on Fable 5.1 and Mythos 5.1. |

> [!example] A request with one breakpoint on the system prompt
> ```json
> {
>   "model": "<model id>",
>   "max_tokens": 1024,
>   "system": [
>     { "type": "text", "text": "<a 6,000-token policy manual>", "cache_control": { "type": "ephemeral" } }
>   ],
>   "messages": [ { "role": "user", "content": "Can I return an opened laptop?" } ]
> }
> ```
> The first call writes 6,000 tokens to the cache. A second call within 5 minutes with the same tools and system text reads them from the cache.

Changes that invalidate the cache, from the docs:

- A change to the tool definitions invalidates everything.
- Turning web search or citations on or off invalidates the system and message parts.
- A change to `tool_choice`, to the images, or to the thinking settings invalidates the message part.

### 4.3 OpenAI: automatic caching

| Rule | Value (checked on 2026-10-12) |
|---|---|
| How to turn it on | It is on by default. |
| Minimum size | 1,024 tokens for GPT-5.6 and later. |
| Discount on cached input | Up to 95%. |
| Cache write | GPT-5.6 and later bill cache writes at 1.25 × the normal input rate. Earlier models have no write charge. |
| Lifetime | GPT-5.6 and later: 30 minutes. Earlier models: "in memory" (minutes) or an extended 24-hour option. |
| Exact match | "Cache reuse requires the entire rendered prefix to match." |
| Usage field | `usage.input_tokens_details.cached_tokens` |

The `prompt_cache_key` parameter can help route similar requests to the same cache. It does not guarantee a hit.

### 4.4 Gemini

Gemini 2.5 and newer models have **implicit caching**, which is on by default. The minimum prefix is 2,048 or 4,096 tokens, by model. **Explicit caching** lets you create a cache object with a lifetime (1 hour by default) and pay a storage fee per hour. In the current price table, a cached token costs 10% of a normal input token (checked on 2026-10-12).

> [!note] Source check: "90% on Anthropic, 50% on OpenAI"
> **Corrected.** The handbook (Session 1, FAQ Q31) says that cached tokens are "90% cheaper on Anthropic and 50% cheaper on OpenAI". On Anthropic, reads are 90%, 95% or 97.5% cheaper, by model, and **writes cost more**: 1.25 × or 2 ×. On OpenAI, 50% was the GPT-4o rate. Current models discount cached input by up to 95%, and GPT-5.6 and later charge 1.25 × for writes.

### 4.5 When does caching pay?

Let $w$ be the write multiplier and $r$ the read multiplier. A prefix is used $n$ times within its lifetime.

- Without caching, the cost is $n$ (in units of the prefix's normal price).
- With caching, the cost is $w + (n-1)\,r$.

Caching is cheaper when $w + (n-1)r < n$. Solve for $n$:

$$
n > \frac{w - r}{1 - r}
$$

> [!example] Worked example: break-even
> - 5-minute write ($w = 1.25$), read $r = 0.1$: $\frac{1.25 - 0.1}{1 - 0.1} = \frac{1.15}{0.9} \approx 1.28$. Caching pays from the **second** use.
> - 1-hour write ($w = 2$), read $r = 0.1$: $\frac{1.9}{0.9} \approx 2.11$. Caching pays from the **third** use.
>
> Check the first case with $n = 2$: uncached cost 2.0, cached cost $1.25 + 0.1 = 1.35$.

Use the 1-hour lifetime only when two conditions are true. Calls with the same prefix are more than 5 minutes apart. The prefix is used at least 3 times.

### 4.6 The conversation from lesson 1.6, with caching

With automatic caching, call $k$ reads the input of call $k-1$ from the cache and writes the new part. The new part is one turn, $t$ tokens. In units of tokens:

$$
\text{cached input cost} = w\,(S+u) + r\,C_{N-1} + w\,t\,(N-1)
$$

Here $C_{N-1}$ is the cumulative input of the first $N-1$ calls (lesson 1.6). The first term is the first write. The second term reads all earlier inputs. The third term writes one new turn on each later call.

> [!example] Worked example: 50 turns on Claude Sonnet 5.5
> $S = 2{,}000$, $u = 100$, $a = 300$, $t = 400$, $w = 1.25$, $r = 0.05$, input USD 2 / MTok, output USD 10 / MTok.
>
> - $C_{49} = 49 \times 2{,}100 + 400 \times \frac{49 \times 48}{2} = 102{,}900 + 470{,}400 = 573{,}300$.
> - Input in token units: $1.25 \times 2{,}100 + 0.05 \times 573{,}300 + 1.25 \times 400 \times 49 = 2{,}625 + 28{,}665 + 24{,}500 = 55{,}790$.
> - Input cost: $55{,}790 \times 2 / 10^6 \approx 0.112$ USD. Output cost: $50 \times 300 \times 10 / 10^6 = 0.15$ USD.
> - Total: about **0.26 USD**, against **1.34 USD** without caching.
>
> This assumes that every call comes within 5 minutes of the one before. A user who pauses for 10 minutes causes a cache miss.

Output is never cached. In this example the output (0.15 USD) is now more than half of the bill.

### 4.7 Layout rules

1. **Stable content first, changing content last.** Order: tool definitions, system prompt, long reference documents, history, new message.
2. **No changing values near the top.** A timestamp, a request ID or the user's name in the first lines changes on every call. It invalidates the whole cache. Put such values at the end.
3. **Keep the tool list stable and in a fixed order.** A new tool or a reordered list invalidates everything after it.
4. **Keep per-tool guidance out of the system prompt when it changes often.** Part 6 shows "just-in-time instructions" inside tool results. This keeps the system prompt stable.
5. **Know the trade-off with compression.** A summary rewrites the old history, so the cache after that point is lost. Part 7 shows how to balance the two.

### 4.8 What caching does not do

Caching changes the **price** and the **time to first token**. It does not change what the model reads. The cached tokens are still in the window, and they still count toward the window limit. So caching does not fix the position effect, the length effect or stale context (lesson [L5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects)).

### 4.9 Production view

| Concern | What caching means for it |
|---|---|
| Cost | Track the cache hit rate: cache reads ÷ (cache reads + cache writes + uncached input). A sudden drop means that something near the top of the prompt started to change. |
| Latency | A long cached prefix gives a faster time to first token. |
| Traffic pattern | A 5-minute lifetime suits chat. Batch jobs with long gaps may need the 1-hour option, or no caching. |
| Change control | A small edit to the system prompt or a tool description invalidates every cache. Deploy such changes on purpose and watch the cost. |
| Pre-warming | Anthropic allows `max_tokens: 0` to write a cache without output, for example before a burst of traffic. |

## 5. Graphs

```plot
{
  "title": "Cost of n uses of one prefix: no caching (red), 5-minute cache (blue), 1-hour cache (gold), read rate 0.1",
  "xAxis": { "label": "number of uses n", "domain": [1, 8] },
  "yAxis": { "label": "cost in units of one normal read", "domain": [0, 8] },
  "disableZoom": true,
  "data": [
    { "fn": "x", "color": "#C81D25" },
    { "fn": "1.25 + 0.1*(x-1)", "color": "#1E6091" },
    { "fn": "2 + 0.1*(x-1)", "color": "#B8860B" }
  ]
}
```

The blue line falls below the red line between $n = 1$ and $n = 2$. The gold line falls below it between $n = 2$ and $n = 3$.

## 6. Video

```video
{
  "src": "/notes/media/context-engineering/manim/m04-prefix-cache.mp4",
  "caption": "A prefix cache in three cases: a hit, a miss and an invalidation."
}
```

## 7. Code

These exercises go in `notebooks/01-foundations.ipynb`.

**Exercise 7.1: a cache-layout checker.**

1. Represent a request as an ordered list of blocks: tools, system, documents, history, new message.
2. Write `first_change(prev_blocks, next_blocks)` that returns the index of the first block that differs. Compare hashes of the block text.
3. Write `cacheable_tokens(prev_blocks, next_blocks, token_counts)` that sums the tokens before the first change.

Acceptance tests:

- Two requests that differ only in the last block give the index of the last block.
- A request with a timestamp in the system block gives index 1, so almost nothing is cacheable.

**Exercise 7.2: a cost simulator with gaps.** Extend `conversation_cost` from lesson 1.6 with $w$, $r$ and a list of gaps between calls in minutes. A gap longer than the lifetime causes a full write. Reproduce the 0.26 USD result, then add one 10-minute pause at turn 25.

**Exercise 7.3 (optional, costs a little): see the cache on a real call.** Use a system prompt above the minimum size, with a `cache_control` breakpoint. Send the same request twice. Print the usage fields of both responses.

Acceptance test: the first response shows `cache_creation_input_tokens` > 0. The second shows `cache_read_input_tokens` > 0.

## 8. Common mistakes

1. **"Caching works if the same text appears anywhere."** It works only for an exact **prefix**.
2. **"Cache writes are free."** On Anthropic they cost 1.25 × or 2 ×. On OpenAI GPT-5.6 and later they cost 1.25 ×.
3. **A timestamp at the top of the system prompt.** It invalidates the cache on every call.
4. **"Caching reduces context rot."** The model still reads every cached token. Only cost and time to first token change.
5. **"A short prompt is cached too."** Below the minimum size, the provider does not cache it, and it gives no error.

## 9. One-minute explanation

When two calls start with the same tokens, the model computes the same keys and values for that start. Prompt caching lets the provider store them and reuse them on the next call. Reads cost far less than normal input, often a tenth or less, and the first token comes sooner. The first write can cost more: 1.25 times for a 5-minute lifetime on Anthropic. The match must be exact from the very first token. So stable content goes first: tools, system prompt, reference documents, then history, then the new message. Never put a timestamp at the top. Caching does not shrink the window, so it does not fix length or position problems. It fixes cost and latency.

## 10. Check questions

```check
{
  "question": "A 1-hour cache write costs 2 times the input price, and a read costs 0.05 times. From how many uses does caching pay?",
  "hint": "n > (w − r) / (1 − r).",
  "answer": "(2 − 0.05) / (1 − 0.05) = 1.95 / 0.95 ≈ 2.05. So caching pays from the third use. Check n = 3: uncached 3.0, cached 2 + 2 × 0.05 = 2.1."
}
```

```check
{
  "question": "A team puts \"Current time: 14:03:22\" as the first line of the system prompt. Their cache hit rate is near zero. Why, and what is the fix?",
  "answer": "The time changes on every call, so the prefix differs from the first block and nothing after it can match. Move the time to the end of the input, for example into the new user message."
}
```

```check
{
  "question": "A call reports cache_read_input_tokens = 18,000, cache_creation_input_tokens = 1,200 and input_tokens = 300. What is the cache hit rate of this call?",
  "answer": "18,000 / (18,000 + 1,200 + 300) = 18,000 / 19,500 ≈ 92%."
}
```

```check
{
  "question": "Does prompt caching let a team send a longer context without the length effect of lesson 1.5? Explain.",
  "answer": "No. Caching changes how the provider processes and bills the prefix. The model still reads every token in the window, so the length effect, the position effect and stale context are the same."
}
```

## 11. Links

- Previous: [L6: The cost of a conversation](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation)
- [L4: Attention, the KV cache and the cost of length](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length): why a prefix can be reused
- Part overview: [01 Foundations](/notes/ai/context-engineering/01-foundations)
- [Glossary](/notes/ai/context-engineering/glossary)
