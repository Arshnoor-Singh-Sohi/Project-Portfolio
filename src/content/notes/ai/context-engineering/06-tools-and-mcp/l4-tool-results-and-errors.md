---
title: "L4: Tool results and errors"
order: 4
summary: "A tool result should be the smallest text that answers the question. Pagination, aggregation, truncation notes, errors with a suggestion, the error flag, timeouts, retries with backoff, idempotency and logging."
status: not-started
tags: [tools, tool-results, errors, retries, idempotency]
---

## 1. The question this idea answers

A database tool can return 10,000 rows. A file tool can return a 50-page document. A network call can fail with a stack trace. Whatever the tool returns goes into the window and stays there (lesson [6.1](/notes/ai/context-engineering/06-tools-and-mcp/l1-tools-are-context)).

So what should a good result contain? When a tool fails, what should the model see, and who should retry? And what happens when a retry repeats an action such as a payment?

## 2. Mental model

> [!analogy] A good research assistant
> You send an assistant to the archive. A poor assistant comes back with 10,000 photocopies. A good assistant says: "There are 10,000 orders, with total revenue of USD 2.3M. Here are the 20 newest. Tell me if you want them filtered by status."
>
> When the archive is closed, the poor assistant says "Error 503". The good assistant says: "The archive is closed until 9:00. The online catalogue has yesterday's copy. Shall I use that?"
>
> **Where it stops working:** a person who calls a shop twice to order one chair knows not to order two chairs. A program that retries after a timeout does not know whether the first order went through. For actions with side effects, the retry design must prevent duplicates (section 4.8).

## 3. Terms

| Term | Plain meaning |
|---|---|
| pagination | Returning a large result one page at a time, with the total count and a way to ask for the next page. |
| aggregation | Returning a computed summary (counts, sums, top items) instead of the raw rows. |
| truncation note | A field in a cut result that says that it is cut, how much is missing and how to get more. |
| tiered response | A first result with a summary, and a second tool that returns the details of one item. |
| `isError` | The MCP field in a tool result that marks the result as a tool error. Anthropic uses `is_error` in a `tool_result` block. |
| transient error | An error that can pass on its own, for example a timeout, a rate limit or a server overload. A retry can succeed. |
| permanent error | An error that a retry with the same input cannot fix, for example "not found" or "permission denied". |
| timeout | The longest time that the application waits for a tool before it stops the call. |
| exponential backoff | A retry rule in which the wait doubles after each failed attempt, up to a maximum. |
| jitter | A random part of the wait time. It stops many clients from retrying at the same moment. |
| idempotent | An operation that has the same effect when it runs once or many times with the same input. |
| idempotency key | A unique value sent with a request so that the server can detect a repeat and return the first result instead of acting again. |

## 4. Method and math

### 4.1 Four ways to make a result small

The FAQ (Q31) says: "Never return 10,000 rows to the LLM." It gives four methods. All four work on the server side, before the result reaches the window.

| Method | What the tool returns | Example |
|---|---|---|
| Pagination | One page, the total and the next offset | 20 orders of 10,000, `next_offset` = 20 |
| Aggregation | A computed summary | "10,000 orders found. Total revenue: USD 2.3M." |
| Filtering | Fewer rows, because the model sends filter parameters | Only orders with status "failed" in the last 7 days |
| Tiered response | A summary, plus a second tool for one item | `search_orders` returns IDs and totals. `get_order` returns one full order. |

> [!example] Worked example: 10,000 orders
> One order row with 6 short fields is about 45 to 50 tokens in compact JSON with `o200k_base`. This example uses 50.
>
> - All rows: $10{,}000 \times 50 = 500{,}000$ tokens. This is larger than a 200,000-token window and half of a 1,000,000-token window.
> - One page of 20 rows: $20 \times 50 = 1{,}000$ tokens.
> - The aggregation line "10,000 orders found. Total revenue: USD 2.3M." is 16 tokens.
>
> Pagination alone is not enough here. To read all rows, the model needs $\lceil 10{,}000 / 20 \rceil = 500$ pages, which is 500 tool calls. So the tool must also offer filters and aggregates. Pagination is for the case where the model needs a few pages, not all of them.

A paginated result tells the model everything that it needs for the next step:

```json
{
  "total": 10000,
  "returned": 20,
  "offset": 0,
  "next_offset": 20,
  "summary": { "total_revenue_usd": 2300000, "by_status": { "shipped": 8120, "pending": 1650, "failed": 230 } },
  "rows": [ { "order_id": "ORD-100000", "customer": "Priya Raman", "date": "2026-02-18", "status": "shipped", "total": 89.97 } ],
  "note": "Showing 20 of 10,000. Add a status or date filter, or call again with offset=20."
}
```

### 4.2 Never cut silently

If a tool must cut a result, the result must say so. The handbook's `read_file` exercise (§9.2) returns `{path, size, content, truncated}` with content cut at 2,000 characters. That is a good pattern: the model sees `truncated: true` and the full size, so it knows that it has only part of the file.

A silent cut is worse than no result. The model reads the first 2,000 characters and answers as if it saw the whole file. It cannot know what it missed.

Anthropic's guide "Writing effective tools for agents" (11 September 2025) gives three more rules for result size:

1. Use pagination, range selection, filtering and truncation, with sensible default values.
2. Offer a `response_format` parameter with "concise" and "detailed" options.
3. Return meaningful fields, for example names rather than UUIDs.

Claude Code limits MCP tool output to 25,000 tokens by default and warns above 10,000 tokens (checked on 2026-10-12). Design your tools to stay far below such limits.

### 4.3 Text for the model, data for the application

Since the 2025-06-18 revision, an MCP tool can declare an `outputSchema` and return `structuredContent` next to the text `content`. In the 2026-07-28 revision, `structuredContent` can be any JSON value. This splits two audiences:

| Field | Reader | Use |
|---|---|---|
| `content` | The model | A short, clear text: the summary and the note |
| `structuredContent` | The application | Typed data for a user interface, a chart or a later step |

Only what the host puts into the window costs window tokens. A host can show the structured data to the user without sending all of it to the model.

### 4.4 Kinds of errors, and who handles each

| Kind | Example | Who acts | What the model sees |
|---|---|---|---|
| Invalid arguments | `date` = "next Tuesday" | The model fixes the call | An actionable error (lesson [6.3](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs)) |
| Not found | `report.md` does not exist | The model chooses another input | The error and a list of valid inputs |
| Transient | Timeout, rate limit, HTTP 503 | The orchestration code retries first | Nothing while the retries run. If they all fail: the error and an alternative |
| Permission denied | The user may not read this table | The model stops and tells the user | A clear refusal with no workaround |
| Bug in the tool | An unexpected exception | The developer | A short message. The full stack trace goes to the log, not the window |

The last row matters for security too. A stack trace can hold file paths, SQL text or secrets. Keep it in the log.

### 4.5 The error format and the error flag

The handbook (§6.3) contrasts a good and a bad error:

```json
{ "error": "File not found: report.md", "suggestion": "Available files: ['data.csv', 'readme.md', 'notes.txt']" }
```

```json
{ "error": "FileNotFoundError" }
```

The first error tells the model what failed and what to do next. The second error gives the model nothing to act on. The FAQ (Q17) shows the same idea for a transient error: "Database connection timed out after 5 seconds... Try the cached_results tool instead."

The error also needs a **flag**, so that the model and the host know that the call failed:

- **Anthropic:** `"is_error": true` in the `tool_result` block (lesson [6.2](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop)).
- **MCP:** `"isError": true` in the tool result. The schema says: "Any errors that originate from the tool SHOULD be reported inside the result object, with `isError` set to true, _not_ as an MCP protocol-level error". If `isError` is missing, it counts as false.

An MCP tool error then looks like this:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "complete",
    "content": [ { "type": "text", "text": "Error: file not found: report.md. Available files: data.csv, readme.md, notes.txt" } ],
    "isError": true
  }
}
```

A JSON-RPC `error` response is for protocol problems, such as an unknown tool name or a malformed request. The host may never show such an error to the model. So a tool error sent as a protocol error takes away the model's chance to correct itself.

> [!note] Source check: tool errors in MCP
> **Corrected.** The handbook (§6.3, §9.2) asks for structured errors but does not say how an MCP server marks them. The MCP schema says that tool errors go inside the result with `isError: true`, not as protocol-level errors. Source: MCP specification 2026-07-28, `schema.ts`, `CallToolResult`, checked on 2026-10-12.

### 4.6 Timeouts

Every external call needs a timeout. Without one, a hung tool hangs the whole agent. The FAQ (Q17) suggests 3 to 5 seconds for APIs and 10 to 30 seconds for database queries. This is a rule of thumb. Measure the latency of each tool, and set its timeout above its normal slow case, for example its 99th percentile. Then check that the sum of the timeouts in one turn still fits the user's patience.

### 4.7 Retries with exponential backoff

Retry only transient errors. Wait longer after each failure:

$$
w_k = \min\left(c,\; b \cdot 2^{k}\right)
$$

The symbols mean:

- $w_k$ is the wait before retry number $k + 1$, for $k = 0, 1, 2, \ldots$
- $b$ is the base wait, for example 0.5 seconds.
- $c$ is the cap, the longest single wait.

With jitter, the actual wait is a random value between 0 and $w_k$. Its mean is $w_k / 2$.

If each attempt fails with probability $f$, and the failures are independent, then $n$ attempts all fail with probability $f^n$. The chance of success within $n$ attempts is:

$$
P_n = 1 - f^{n}
$$

> [!example] Worked example: five retries
> Take $b = 0.5$ s and $c = 8$ s.
>
> - Waits: $w_0 = 0.5$, $w_1 = 1$, $w_2 = 2$, $w_3 = 4$, $w_4 = 8$ seconds.
> - Total wait for five retries: $0.5 + 1 + 2 + 4 + 8 = 15.5$ seconds. With full jitter, the expected wait is half: 7.75 seconds.
> - With $f = 0.2$ and $n = 4$ attempts: $P_4 = 1 - 0.2^4 = 1 - 0.0016 = 0.9984$.
>
> The independence assumption is often false. During an outage, every attempt fails. So cap the attempts, and stop when the total time budget is gone.

Two rules keep retries safe:

1. The orchestration code retries transient errors. The model does not need to see each attempt, so the retries cost no window tokens.
2. Retry an action with side effects only when the action is idempotent (section 4.8).

### 4.8 Idempotency: the retry that pays twice

A tool `charge_card` times out. Did the charge happen? The application cannot know. A retry may charge the card a second time.

> [!example] Worked example: an idempotency key
> 1. The orchestration code makes a key for the tool call, for example from the call ID: `key = "toolu_01A..."`.
> 2. It sends the charge with the key. The request times out, but the payment server records the charge under that key.
> 3. The code retries with the **same** key. The server finds the key, does not charge again and returns the first result.
>
> Result: one charge, even with two requests.

Three design rules follow:

1. Prefer idempotent operations: `set_status(order, "shipped")` is idempotent, `toggle_status(order)` is not.
2. For actions that are not idempotent, send an idempotency key that the server checks.
3. If neither is possible, do not retry automatically. Report the uncertain state to the model and the user.

MCP has a tool annotation `idempotentHint` with the default `false`. It is only a hint for the host. The spec says that clients must treat annotations as untrusted unless they come from a trusted server (lesson [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection)). The hint does not make a tool idempotent.

### 4.9 Log every call

The FAQ (Q17, Q21) says to log all tool calls and results. A useful log record for each call has these fields:

| Field | Why |
|---|---|
| Conversation ID and call ID | Join the call to its trace and its result |
| Tool name and arguments | Reproduce the call. Remove secrets and personal data first. |
| Result size in tokens | Find tools whose results grow |
| Latency and timeout flag | Find slow tools and tune timeouts |
| Error kind and retry count | Find flaky tools and wrong error handling |

Part 9 turns these records into traces and dashboards.

### 4.10 Production view

| Concern | What this lesson means for it |
|---|---|
| Cost | Small results lower the cost of every later call. Aggregate and filter on the server. |
| Latency | Timeouts bound the worst case. Retries add wait time, so set a total time budget for each turn. |
| Reliability | Retry transient errors with backoff and jitter. Return permanent errors to the model with a suggestion. |
| Correctness | Never cut a result silently. Use idempotency keys for actions with side effects. |
| Security | Keep stack traces and internal details in the log, not in the window. |
| Observability | Log the call ID, tool, arguments, result tokens, latency, error kind and retry count for every call. |

## 5. Graphs

```plot
{
  "title": "Backoff wait before each retry, base 0.5 s, cap 8 s (blue)",
  "xAxis": { "label": "retry index k", "domain": [-0.5, 6.5] },
  "yAxis": { "label": "wait (seconds)", "domain": [0, 9] },
  "disableZoom": true,
  "data": [
    { "points": [[0, 0.5], [1, 1], [2, 2], [3, 4], [4, 8], [5, 8], [6, 8]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[0, 0.5], [1, 1], [2, 2], [3, 4], [4, 8], [5, 8], [6, 8]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true }
  ]
}
```

The wait doubles from 0.5 to 8 seconds, then stays at the cap.

## 6. Code

These exercises go in `notebooks/06-tools-and-mcp.ipynb`. Reusable code goes in `src/tool_results.py`. They use `sqlite3` only, so they cost nothing.

**Exercise 4.1: a paginated, aggregated tool.**

1. Create a SQLite table `orders` with 10,000 synthetic rows: ID, customer, date, status, total.
2. Write `search_orders(status=None, date_from=None, limit=20, offset=0, mode="concise")`.
3. In "concise" mode, return the total, the counts by status, the total revenue and the first `limit` rows with 4 fields. In "detailed" mode, return all fields of the rows.
4. Add a `note` field that says how to get more.

Acceptance tests:

- `total` is 10,000 with no filter, and `next_offset` is 20.
- `limit=500` is reduced to the maximum page size of 50, and the note says so.
- The concise result of the first page is under 1,500 tokens with `o200k_base`.
- The last page has `next_offset` equal to `null`.

**Exercise 4.2: an error formatter.** Write `to_tool_error(exc, context)` that maps exceptions to `{"error", "suggestion"}` and an error flag.

Acceptance tests:

- `FileNotFoundError` gives a suggestion that lists the available files.
- `TimeoutError` gives a suggestion that names an alternative tool.
- A `KeyError` from a bug gives a short message, and the stack trace goes only to the log.
- The function returns `is_error` = `True` for every case.

**Exercise 4.3: retries and idempotency.**

1. Write `retry(call, max_attempts, base, cap, jitter, sleep)` that retries only exceptions of a "transient" class. Pass `sleep` as a function, so that tests run fast.
2. Write a fake payment server with `charge(amount, key)`. It records charges by key and times out on the first request.
3. Call `charge` through `retry` with one key.

Acceptance tests:

- With `base=0.5`, `cap=8`, `max_attempts=5` and no jitter, a call that always fails records the waits 0.5, 1, 2, 4 seconds.
- A permanent error is raised at once, with no retry.
- After the timeout and the retry, the server holds exactly one charge.
- Without a key, the same scenario gives two charges. Print both cases.

## 7. Common mistakes

1. **"Return everything, and let the model filter."** Each extra token is read and billed on every later call. Filter and aggregate in the tool.
2. **"Pagination solves large results."** 10,000 rows in pages of 20 is 500 calls. The model needs filters and aggregates.
3. **"Cut the text at 2,000 characters and return it."** Without a truncation note, the model answers as if it saw everything.
4. **"Raise the tool error as a protocol error."** In MCP, tool errors go in the result with `isError: true`, so the model can read them.
5. **"Retry every error."** Retry only transient errors. A "not found" error stays "not found".
6. **"Retries are always safe."** A retried payment can pay twice. Use idempotent operations or idempotency keys.

## 8. One-minute explanation

A tool result goes into the window and stays there, so it should be the smallest text that answers the question. Return one page with the total count, a summary instead of raw rows, and filters so the model can ask for less. If you must cut a result, say so in the result. Errors should name what failed and what to do next, and carry an error flag. In MCP, that flag is `isError: true` inside the result, not a protocol error. The orchestration code retries transient errors with exponential backoff and jitter, and the model never sees those attempts. Permanent errors go back to the model with a suggestion. Actions with side effects need idempotency keys, so a retry does not pay twice. Log every call with its size, latency and error.

## 9. Check questions

```check
{
  "question": "A tool returns customer rows of about 45 tokens each. A query matches 3,000 rows. How many tokens is the full result? How many tokens is a page of 25 rows? How many pages would the model need to read everything?",
  "hint": "Multiply, then divide and round up.",
  "answer": "Full result: 3,000 × 45 = 135,000 tokens. One page: 25 × 45 = 1,125 tokens. Pages: 3,000 / 25 = 120 pages, so 120 tool calls. The tool should offer filters or an aggregate instead."
}
```

```check
{
  "question": "Backoff uses b = 0.25 s and c = 4 s. List the waits for k = 0 to 5. What is the total wait without jitter?",
  "hint": "w_k = min(c, b · 2^k).",
  "answer": "0.25, 0.5, 1, 2, 4, 4 seconds. Total: 0.25 + 0.5 + 1 + 2 + 4 + 4 = 11.75 seconds."
}
```

```check
{
  "question": "Each attempt of a tool fails with probability 0.3, independently. What is the chance of success within 3 attempts? Why can the real number be lower?",
  "answer": "P = 1 − 0.3³ = 1 − 0.027 = 0.973. The real number can be lower because failures are often not independent. During an outage, every attempt fails."
}
```

```check
{
  "question": "An MCP server reports a missing file as a JSON-RPC error response. The agent stops instead of asking for another file. Explain the cause and the fix.",
  "answer": "A JSON-RPC error is a protocol error, and the host may not show it to the model. So the model never reads the error and cannot correct itself. The fix: return a normal result with isError: true and a text such as \"File not found: report.md. Available files: data.csv, readme.md\"."
}
```

```check
{
  "question": "A create_ticket tool times out. The orchestration code retries, and the user later finds two identical tickets. Name two design fixes.",
  "answer": "1. Send an idempotency key, for example the call ID, and let the ticket server return the first ticket when it sees the same key again. 2. If the server cannot check keys, do not retry automatically. Search for a ticket with the same content first, or report the uncertain state to the user."
}
```

## 10. Links

- Previous: [L3: Tool schemas and structured outputs](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs)
- Next: [L5: Many tools](/notes/ai/context-engineering/06-tools-and-mcp/l5-many-tools)
- [L1: Tools are context](/notes/ai/context-engineering/06-tools-and-mcp/l1-tools-are-context): why result size matters on every later call
- [Lesson 7.3: Tool-result clearing](/notes/ai/context-engineering/07-compress-and-isolate/l3-tool-result-clearing)
- [Glossary](/notes/ai/context-engineering/glossary)
