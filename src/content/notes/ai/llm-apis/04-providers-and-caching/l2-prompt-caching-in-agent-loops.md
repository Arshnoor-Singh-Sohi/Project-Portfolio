---
title: "L2: Prompt caching in agent loops"
order: 2
summary: "An agent loop sends almost the same input on every model call, so most input tokens become cache reads. A formula for the cache-read share from prefix size, number of calls and new tokens per call, worked examples that give 74% and 91%, the cost with current multipliers, 5-minute versus 1-hour lifetimes in a chat with human pauses, what breaks the cache in agents, and how to read the usage fields."
status: not-started
tags: [prompt-caching, agent-loop, cost, ttl, usage, foundry]
---

## 1. The question this idea answers

A team reads the usage of its agent service on Claude Sonnet 5. Across runs, 74% to 91% of all input tokens are `cache_read_input_tokens`. Three questions follow:

1. Why is the share so high, when every user message is new?
2. Why does it vary between 74% and 91%, and what number should a healthy run have?
3. What makes it drop, and what does a drop cost?

The answer starts with the shape of an agent loop. Each model call sends the full input of the previous call plus a little more. Prompt caching ([context engineering L7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)) makes that repeated part cheap. This lesson converts that idea into a formula, computes real numbers, and lists the events that break the cache inside an agent.

## 2. Mental model

> [!analogy] A train that grows by one wagon per stop
> An inspector checks a train at every station. At each stop the train gets one new wagon at the end. Suppose every older wagon is exactly the same as at the last station. Then the inspector checks only the new wagon and stamps the rest as "seen". Checking a seen wagon is cheap. Checking a new wagon costs a little extra, because the inspector also files a record of it.
>
> An agent loop is this train. Each model call is a station. The tools and the system prompt are the locomotive. The history is the old wagons. The new tool call and tool result are the new wagon.
>
> **Where it stops working:** the inspector's records expire after 5 minutes without a visit. If the train waits longer, for example while a user reads the answer, every wagon is checked again at full price. And if one wagon near the front changes, every wagon behind it counts as new, even if it did not change.

## 3. Terms

| Term | Plain meaning |
|---|---|
| model call | One request to the Messages API. An agent run makes several. |
| agent run | All model calls that answer one user message, until a final answer. |
| prefix | The start of the input, in the order tools, system, messages. |
| cache write | Input tokens stored in the cache on this call. Field: `cache_creation_input_tokens`. |
| cache read | Input tokens reused from the cache. Field: `cache_read_input_tokens`. |
| uncached input | Input tokens after the last cache breakpoint. Field: `input_tokens`. |
| cache-read share | Cache reads divided by all input tokens of a call or a run. |
| cold start | A run whose first call finds nothing of the conversation in the cache. |
| warm start | A run whose first call finds the previous run's input in the cache. |
| time to live (TTL) | How long a cache entry lives without use: 5 minutes by default, or 1 hour. |
| invalidation | A change early in the input that makes the cached prefix useless from that point on. |
| automatic caching | One top-level `cache_control` that moves the breakpoint to the last cacheable block on every call. |

## 4. Method and math

### 4.1 Why an agent loop reuses its prefix

The Claude Code caching page says (checked on 2026-10-13): "On a normal turn, the prefix is the entire previous request and only the latest exchange is new." In an agent loop this holds for every call:

```mermaid
flowchart LR
    C1["Call 1: tools + system + history + user message"] --> C2["Call 2: all of call 1 + tool_use + tool_result"]
    C2 --> C3["Call 3: all of call 2 + tool_use + tool_result"]
    C3 --> C4["Call 4: all of call 3 + tool_use + tool_result"]
    style C1 fill:#B8860B,color:#fff
    style C2 fill:#2D6A4F,color:#fff
    style C3 fill:#2D6A4F,color:#fff
    style C4 fill:#2D6A4F,color:#fff
```

With automatic caching, or with the breakpoints that Claude Code places, each call writes its new part to the cache. The next call reads everything that the previous call sent. The Agent SDK cost page says: "The Agent SDK automatically uses prompt caching to reduce costs on repeated content. You do not need to configure caching yourself."

### 4.2 A formula for the cache-read share

Use three numbers for one run:

- $P$: the input tokens of call 1 (tools, system prompt, earlier history, new user message).
- $d$: the new tokens that each later call adds (the previous call's tool call plus its tool result).
- $N$: the number of model calls in the run.

Call $j$ sends $I_j = P + (j-1)\,d$ input tokens. In a **cold start**, call 1 reads nothing. Every later call reads the full input of the call before it, $I_{j-1}$. Sum over the run:

$$
\sum_{j=1}^{N} I_j = N P + d\,\frac{N(N-1)}{2}
\qquad
\sum_{j=2}^{N} I_{j-1} = (N-1) P + d\,\frac{(N-1)(N-2)}{2}
$$

So the cache-read share of a cold run is:

$$
\text{share}_{\text{cold}} = \frac{(N-1)\left(P + d\,\frac{N-2}{2}\right)}{N\left(P + d\,\frac{N-1}{2}\right)}
$$

When $P$ is much larger than $d$, the share approaches $\frac{N-1}{N}$. One call of the $N$ calls is a full write, and each of the other calls is almost a full read.

> [!key] The number of calls sets the ceiling
> In a cold run, the cache-read share can never exceed $\frac{N-1}{N}$: 75% for 4 calls, 90% for 10 calls, 95% for 20 calls. A large prefix brings the share close to this ceiling. Many new tokens per call pull it below.

### 4.3 Worked examples: where 74% and 91% come from

> [!example] Worked example 1: a short cold run gives 74%
> $P = 30{,}000$ (tools 9,000 + system 3,000 + history 17,900 + user message 100), $d = 1{,}000$, $N = 4$. Nothing of this input is in the cache, for example on a quiet service after a long pause.
>
> | Call | Input | Read | Written |
> |---|---|---|---|
> | 1 | 30,000 | 0 | 30,000 |
> | 2 | 31,000 | 30,000 | 1,000 |
> | 3 | 32,000 | 31,000 | 1,000 |
> | 4 | 33,000 | 32,000 | 1,000 |
> | Sum | 126,000 | 93,000 | 33,000 |
>
> Share = 93,000 / 126,000 = 0.738, so about **74%**. The formula gives the same: $\frac{3 \times (30{,}000 + 1{,}000)}{4 \times (30{,}000 + 1{,}500)} = \frac{93{,}000}{126{,}000}$.

> [!example] Worked example 2: a longer cold run gives 91%
> Same $P = 30{,}000$ and $d = 1{,}000$, but the agent needs $N = 13$ calls.
>
> - All input: $13 \times 30{,}000 + 1{,}000 \times \frac{13 \times 12}{2} = 390{,}000 + 78{,}000 = 468{,}000$.
> - Reads: $12 \times 30{,}000 + 1{,}000 \times \frac{12 \times 11}{2} = 360{,}000 + 66{,}000 = 426{,}000$.
> - Share = 426,000 / 468,000 = 0.910, so **91%**.

So the range 74% to 91% needs no special cause. Short runs sit near 74%, and long runs near 91%. This grid was computed in the sandbox for cold runs:

| Calls $N$ | $P/d = 5$ | $P/d = 10$ | $P/d = 30$ | $P/d = 100$ | Ceiling $\frac{N-1}{N}$ |
|---|---|---|---|---|---|
| 2 | 0.455 | 0.476 | 0.492 | 0.498 | 0.500 |
| 4 | 0.692 | 0.717 | 0.738 | 0.746 | 0.750 |
| 8 | 0.824 | 0.843 | 0.862 | 0.871 | 0.875 |
| 13 | 0.881 | 0.894 | 0.910 | 0.919 | 0.923 |
| 20 | 0.917 | 0.926 | 0.938 | 0.946 | 0.950 |

> [!example] Worked example 3: a warm start gives 97.5%
> The user sends the next message 2 minutes later, inside the 5-minute TTL. The last call of example 1 sent 33,000 tokens. The final answer (400 tokens) and the new user message (100 tokens) are new. So call 1 now sends 33,500 and reads 33,000.
>
> | Call | Input | Read | Written |
> |---|---|---|---|
> | 1 | 33,500 | 33,000 | 500 |
> | 2 | 34,500 | 33,500 | 1,000 |
> | 3 | 35,500 | 34,500 | 1,000 |
> | 4 | 36,500 | 35,500 | 1,000 |
> | Sum | 140,000 | 136,500 | 3,500 |
>
> Share = 136,500 / 140,000 = 0.975. A warm start has no full write, so it can pass the cold ceiling.

So a healthy service shows a range, not one number. A share near $\frac{N-1}{N}$ means cold starts. A share above it means warm starts. A share far below $\frac{N-1}{N}$ means that something invalidates the cache inside a run (section 4.6).

### 4.4 The cost

For one run, with $w$ the write multiplier and $r$ the read multiplier:

$$
\text{input cost} = \text{price} \times \left(1.0 \times \texttt{input\_tokens} + w \times \texttt{cache\_creation\_input\_tokens} + r \times \texttt{cache\_read\_input\_tokens}\right)
$$

| Model (checked on 2026-10-13) | Base input per MTok | $w$, 5 minutes | $w$, 1 hour | $r$ |
|---|---|---|---|---|
| Claude Sonnet 5 | USD 2 | 1.25 | 2 | 0.1 |
| Claude Sonnet 5.5 | USD 2 | 1.25 | 2 | 0.05 |
| Claude Opus 5.5 | USD 4 | 1.25 | 2 | 0.05 |
| Claude Fable 5.1 | USD 10 | 1.25 | 2 | 0.025 |

> [!example] Worked example 4: the cost of example 1 on Sonnet 5
> Reads 93,000, writes 33,000, uncached input near 0 (the breakpoint is on the last block).
>
> - Token units: $93{,}000 \times 0.1 + 33{,}000 \times 1.25 = 9{,}300 + 41{,}250 = 50{,}550$.
> - Cost: $50{,}550 \times 2 / 10^6 = 0.1011$ USD.
> - Without caching: $126{,}000 \times 2 / 10^6 = 0.252$ USD.
>
> On Sonnet 5.5, with $r = 0.05$: $(4{,}650 + 41{,}250) \times 2 / 10^6 = 0.0918$ USD. The writes are now 90% of the input bill, so the cold first call dominates the cost.

### 4.5 Five minutes or one hour in a chat with pauses

Inside one agent run, calls follow each other within seconds, so a 5-minute TTL is enough. The gap that matters is the human pause between two user messages. The API docs say: "By default, the cache has a 5-minute lifetime. The cache is refreshed for no additional cost each time the cached content is used. The lifetime is measured from the start of the request that writes or reads the cache entry".

> [!example] Worked example 5: message 2 after a 10-minute pause
> A chat on Sonnet 5. Tools and system prompt: $S = 12{,}000$ tokens, identical for all chats, so other traffic keeps them warm. Each run makes 4 calls with $d = 1{,}500$. Message 1 ended with a last call of 16,600 tokens. Message 2 starts with $P = 17{,}100$.
>
> **5-minute TTL.** The chat's own entries expired. Call 1 reads only $S$:
>
> - Call 1: read 12,000, write 17,100 − 12,000 = 5,100.
> - Calls 2 to 4: read 17,100 + 18,600 + 20,100 = 55,800, write 3 × 1,500 = 4,500.
> - Cost: $(67{,}800 \times 0.1 + 9{,}600 \times 1.25) \times 2 / 10^6 = (6{,}780 + 12{,}000) \times 2 / 10^6 = 0.03756$ USD.
>
> **1-hour TTL.** The entries survive. Call 1 reads 16,600 and writes 500. All writes cost $w = 2$:
>
> - Reads 16,600 + 55,800 = 72,400. Writes 500 + 4,500 = 5,000.
> - Cost: $(7{,}240 + 10{,}000) \times 2 / 10^6 = 0.03448$ USD.

The saving grows with the history, because a cold start must write the whole history again. The sandbox simulated a chat of 5 messages with these numbers:

| Policy and pauses | Cache-read share | Input cost, 5 messages |
|---|---|---|
| No caching | 0% | 0.9740 USD |
| 5-minute TTL, 10-minute pauses | 85.0% | 0.2653 USD |
| 1-hour TTL, 10-minute pauses | 94.9% | 0.1909 USD |
| 5-minute TTL, 2-minute pauses | 94.9% | 0.1540 USD |

Over these 5 messages, the 1-hour TTL wins when users pause longer than 5 minutes. It loses when they answer quickly, because every write costs 2 instead of 1.25. It also costs more on the first message of every chat, for the same reason.

How to choose it in the Agent SDK: the cost page says that your own turns "use a 5-minute TTL by default when you authenticate with an API key or run on Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry, or Claude Platform on AWS." To change it, set `CLAUDE_CODE_PROMPT_CACHE_TTL=1h` for the main conversation, or `ENABLE_PROMPT_CACHING_1H=1` for all requests, through `options.env`. The per-bucket variables need Claude Code v2.1.242 or later. The bundled CLI of SDK 0.2.165 is 2.1.296.

### 4.6 What breaks the cache in an agent

The API docs list what invalidates which part of the cache. The Claude Code page adds the agent-specific causes. Both were checked on 2026-10-13.

| Event | What is invalidated | How it happens in an agent service |
|---|---|---|
| The tool list changes | Everything: tools come first | An MCP server connects late, a tool is added or removed between calls, or the list order changes. On a Foundry deployment hosted on Azure, Claude Code sends every MCP tool definition in every request, with no deferred loading, once it detects that the deployment rejects tool search, so a server change invalidates the cache. |
| The system prompt changes | System and messages | Per-turn data in the system prompt, a different `append` text with `snapshot` off, an SDK upgrade, or per-user dynamic sections ([Agent SDK L5.1](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot)) |
| Thinking settings change | Messages always. Tools and system on some models. | Switching between adaptive and disabled, or changing the budget. The thinking page: "Treat any thinking or top-level effort change as starting the cache over." |
| Effort changes | Messages always. Tools and system on some models. | A per-request effort choice. Claude Code keeps the cache on effort changes only for Opus 5.5, Sonnet 5.5, Haiku 5.5 and Fable 5.1 "with an API key or a Claude subscription". |
| The model changes | Everything: "each model has its own cache" | A fallback model, or a cheaper model for some turns |
| Dynamic text early in the input | Everything after it | A timestamp, a request id or a user name in the system prompt or the first message |
| `tool_choice` or images change | Messages | Forcing a tool on one call, or removing old images |
| Compaction | The conversation layer | Claude Code replaces the history with a summary, by design |
| A gateway removes `cache_control` | Everything bills as uncached | Claude Code page: "your entire conversation history bills as uncached input on every turn" |

Two more rules matter in agents. First, on Opus 4.5 and later, Sonnet 4.6 and later and Haiku 5.5, thinking blocks of earlier turns stay in the cached prefix. So return them unchanged to keep the cache valid ([lesson 2.2](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures)). Second, the lookback window is 20 blocks. The docs add that "a run of consecutive tool_use blocks counts as one position, and so does a run of consecutive tool_result blocks". So parallel tool calls do not move the previous entry beyond the window.

> [!trap] Each instance can build its own prefix
> The Claude Code page says that the cache "is effectively scoped to one machine and directory", because the system prompt embeds memory paths and the conversation "opens with an announcement of the working directory, platform, shell, and OS version". If two app instances use different working directories or settings, they cannot share cache entries, even for the same static prompt. Keep the working directory and the settings identical on every instance.

### 4.7 How to read the usage fields

Per call, the API returns three input fields. The prompt-caching page defines them:

| Field | Definition (quoted) |
|---|---|
| `cache_creation_input_tokens` | "Number of tokens written to the cache when creating a new entry." |
| `cache_read_input_tokens` | "Number of tokens retrieved from the cache for this request." |
| `input_tokens` | "Number of input tokens which were not read from or used to create a cache (that is, tokens after the last cache breakpoint)." |
| `cache_creation.ephemeral_5m_input_tokens` and `ephemeral_1h_input_tokens` | The writes by TTL. Their sum equals `cache_creation_input_tokens`. |

$$
\text{total input} = \texttt{input\_tokens} + \texttt{cache\_creation\_input\_tokens} + \texttt{cache\_read\_input\_tokens}
\qquad
\text{share} = \frac{\texttt{cache\_read\_input\_tokens}}{\text{total input}}
$$

In the Agent SDK, three places hold usage ([Agent SDK L7.2](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields)):

| Place | Scope | Rule from the cost page |
|---|---|---|
| `AssistantMessage.usage` | One model call | Several messages of one call share a `message_id`: "deduplicate by ID to avoid double-counting". The values "are accurate for input and cache tokens", but "Per-step `output_tokens` is a placeholder". |
| `ResultMessage.usage` | The main loop of one `query()` | Cumulative. It excludes subagents: "Counts only the top-level agent loop". |
| `ResultMessage.model_usage` | The whole run, by model | Includes subagents, with `cacheReadInputTokens` and `cacheCreationInputTokens` |

To see the per-call pattern of section 4.3, read the deduplicated `AssistantMessage.usage` values in order. A healthy run shows one large write on call 1 (cold) or a small one (warm), then small writes and growing reads. The Claude Code page gives the rule of thumb: "If creation stays high turn after turn, something is changing in your prefix."

### 4.8 Production view

| Concern | What to do |
|---|---|
| Cost | Track the cache-read share per run and per call. Compare it with $\frac{N-1}{N}$ for the run's call count. |
| Alerts | Alert when `cache_creation_input_tokens` stays high after call 1 of a run. That means an invalidation inside the loop. |
| Layout | Keep tools, their order and the system prompt identical for all users and all calls. Put per-turn data in the user message. |
| Settings | Choose model, thinking mode and effort once per chat. Do not change them between calls. |
| TTL | Measure the pause between user messages. Use the 1-hour TTL when many pauses exceed 5 minutes and histories are long. |
| Rebuilds | A Flow 2 rebuild is a cold start for the history part. Expect a share near $\frac{N-1}{N}$, and keep the rebuilt history short. |
| Accounting | Deduplicate per-call usage by `message_id`. Use `model_usage` when subagents run. |

## 5. Video

```video
{
  "src": "/notes/media/llm-apis/manim/m03-agent-loop-cache-share.mp4",
  "caption": "Each call of an agent loop resends the previous input, so most input becomes cache reads: 74% for a cold run of 4 calls, 91% for 13 calls, and a reset after a long pause."
}
```

## 6. Code

These exercises go in `llm-apis/09-cache-in-loops.ipynb`. Exercises 2.1 to 2.3 need no API key.

**Exercise 2.1: the share simulator.** Write `simulate_run(P, d, N, warm_read=0)`. It returns a list of `(input, read, written)` per call.

Acceptance tests:

- `P=30_000, d=1_000, N=4` gives a share of 0.738 (rounded to 3 places).
- `N=13` with the same values gives 0.910.
- The warm run of worked example 3 gives 0.975.
- Your closed formula of section 4.2 matches the simulation for every row of the grid.

**Exercise 2.2: the cost function.** Write `input_cost(reads, writes, uncached, price, w, r)`.

Acceptance tests:

- Worked example 4 gives 0.1011 USD on Sonnet 5 and 0.0918 USD on Sonnet 5.5.
- With `w=1, r=1` the cost equals the cost without caching.

**Exercise 2.3: a chat with pauses.** Simulate 5 messages with the values of worked example 5. Add a parameter for the pause and the TTL.

Acceptance tests:

- Your totals match the table of section 4.5 to 4 decimal places.
- Find the smallest number of messages for which the 1-hour TTL is cheaper than the 5-minute TTL with 10-minute pauses. Explain why it depends on the history size.

**Exercise 2.4 (calls the model): read a real run.** Run one Agent SDK `query()` that makes at least 3 tool calls. Collect the `usage` of each `AssistantMessage`, deduplicated by `message_id`.

Acceptance tests:

- Print a table of input, read and written tokens per call.
- Compute the run's share and compare it with $\frac{N-1}{N}$. Explain the difference in two sentences.

## 7. Common mistakes

1. **"A high cache share means the users repeat themselves."** It comes from the loop: every call resends the previous input.
2. **Expecting a share above $\frac{N-1}{N}$ on a cold run.** The first call writes everything. Only warm starts pass the ceiling.
3. **Reading only `input_tokens`.** It holds only the tokens after the last breakpoint. Add the cache fields.
4. **Changing effort or thinking per call.** It invalidates at least the message cache.
5. **A timestamp at the top of the system prompt.** It invalidates everything on every call.
6. **Using the 1-hour TTL everywhere.** Writes cost 2 instead of 1.25. It pays only when pauses exceed 5 minutes.
7. **Summing `AssistantMessage.usage` without deduplication.** Messages of one call share an id and the same usage.

## 8. One-minute explanation

An agent loop calls the model several times for one user message. Each call sends the full input of the previous call plus the new tool call and tool result. With prompt caching, the repeated part costs a tenth of the input price on Sonnet 5, and the new part costs 1.25 times. In a cold run of $N$ calls, the first call writes everything, so the cache-read share approaches $\frac{N-1}{N}$. With a 30,000-token prefix and 1,000 new tokens per call, that gives 74% for 4 calls and 91% for 13 calls. A warm start goes higher, but the cache lives only 5 minutes after its last use, so a longer pause forces a cold start. For long chats with long pauses, the 1-hour TTL can be cheaper. A new tool list, a changed system prompt, another model, new thinking or effort settings, or dynamic text near the top breaks the cache. Read all three input fields of `usage`, and in the Agent SDK deduplicate per-call usage by message id.

## 9. Check questions

```check
{
  "question": "A cold agent run makes 5 calls with P = 40,000 and d = 2,000. Compute the cache-read share.",
  "hint": "Reads = (N−1)P + d(N−1)(N−2)/2, total = NP + dN(N−1)/2.",
  "answer": "Reads = 4 × 40,000 + 2,000 × (4 × 3 / 2) = 160,000 + 12,000 = 172,000. Total = 5 × 40,000 + 2,000 × (5 × 4 / 2) = 200,000 + 20,000 = 220,000. Share = 172,000 / 220,000 ≈ 0.782, so about 78%, below the ceiling of 4/5 = 80%."
}
```

```check
{
  "question": "A dashboard shows that cache_creation_input_tokens is about 30,000 on every call of a 6-call run, not only on call 1. What does this mean, and what do you check first?",
  "answer": "The prefix changes on every call, so each call writes almost the full input again. Something early in the input is not stable. Check the tool list and its order, the system prompt for dynamic text such as timestamps, and whether thinking, effort or the model changes between calls."
}
```

```check
{
  "question": "Users of a chat service often pause 10 to 20 minutes between messages, and chats grow to 60,000 tokens. The service runs the Agent SDK on Foundry with defaults. Which TTL does it use, and what would you change?",
  "answer": "On Foundry with defaults, the main conversation uses the 5-minute TTL. After each long pause, the first call must write the whole history again at 1.25 times the input price. With long histories, the 1-hour TTL is likely cheaper even though writes cost 2 times: set CLAUDE_CODE_PROMPT_CACHE_TTL=1h in options.env. Measure the pause distribution and compare the costs before you switch."
}
```

```check
{
  "question": "A run on Sonnet 5 reports reads 93,000, writes 33,000 and uncached input 0. Compute the input cost at USD 2 per million input tokens, and the cost without caching.",
  "answer": "With caching: (93,000 × 0.1 + 33,000 × 1.25) × 2 / 1,000,000 = (9,300 + 41,250) × 2 / 1,000,000 = 0.1011 USD. Without caching: 126,000 × 2 / 1,000,000 = 0.252 USD."
}
```

## 10. Links

- Previous: [L1: Claude on Microsoft Foundry](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry)
- The basics: [Context engineering L7: Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)
- Why the system prompt must stay static: [Agent SDK L5.1: System prompts and snapshot](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot)
- Usage fields in the SDK: [Agent SDK L7.2: Cost and usage fields](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields)
- Thinking and the cache: [L2.2: Thinking blocks and signatures](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures)
- [Glossary](/notes/ai/llm-apis/glossary)
