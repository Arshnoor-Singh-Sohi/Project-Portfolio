---
title: "L2: Cost and usage fields"
order: 2
summary: "usage counts only the main loop, model_usage counts the whole tree by model, and total_cost_usd is a client-side estimate at list price. How to compute a cost by hand from current prices, why a resumed session reports the session's total, what changes when Microsoft Foundry bills you, how to log the cost of each answer in PostgreSQL, and how max_budget_usd stops a run."
status: not-started
tags: [agent-sdk, cost, usage, model-usage, budget, foundry]
---

## 1. The question this idea answers

A team wants four numbers: the cost of each answer, of each chat, of each user per month, and a hard limit for a runaway answer. The `ResultMessage` seems to have everything: `usage`, `model_usage` and `total_cost_usd`.

Then the questions start. Why is the cost computed from `usage` half of `total_cost_usd`? Why does the third answer of a chat cost more than the whole chat so far? Why does the monthly sum not match the Azure invoice? And why did a run with `max_budget_usd=0.50` cost USD 0.69?

Each question has an exact answer in the docs and the source. This lesson collects them, with every price checked on the official pricing page.

## 2. Mental model

> [!analogy] A taxi meter and the monthly invoice
> A taxi has a meter. The meter multiplies distance by a price table that was loaded into the meter when it was built. At the end of the month, the taxi company sends an invoice from its own records, with your negotiated discount.
>
> `total_cost_usd` is the meter. The invoice from Anthropic, or from Azure for Microsoft Foundry, is the bill. `usage` is a meter that counts only the main car. `model_usage` counts the whole convoy, including the cars of the subagents.
>
> **Where it stops working:** a taxi meter starts at zero for each ride. When you resume a session, this meter continues from the session's earlier total. So the meter shows the cost of the trip so far, not of this ride.

## 3. Terms

| Term | Plain meaning |
|---|---|
| `usage` | A dict on `ResultMessage` with the token counts of the main agent loop only. |
| `model_usage` | A dict on `ResultMessage` that maps each model name to its token counts and estimated cost, for the whole tree of calls. |
| `ModelUsage` | One entry of `model_usage`, with camelCase keys such as `inputTokens` and `costUSD`. |
| `total_cost_usd` | The estimated cost of the run in US dollars, including subagents. |
| `input_tokens` | Input tokens that were neither written to nor read from the prompt cache. |
| `cache_creation_input_tokens` | Input tokens written to the prompt cache, at a higher price. |
| `cache_read_input_tokens` | Input tokens read from the prompt cache, at a lower price. |
| list price | The public per-token price on the pricing page. |
| client-side estimate | A cost that the CLI computes from token counts and a price table built into it. |
| per-step usage | The `usage` of each `AssistantMessage`: one model response. |
| `max_budget_usd` | An option that stops the run when the estimated cost reaches a value. |
| CCU | Claude Consumption Unit: the unit in which Microsoft Foundry bills Claude, USD 0.01 each. |
| data residency multiplier | A 1.1 factor on all token prices for US-only inference. |

## 4. Method and math

### 4.1 Four places that hold usage

| Field | Scope | Subagents | Source (checked on 2026-10-13) |
|---|---|---|---|
| `AssistantMessage.usage` with `message_id` | One model response | Their messages carry a `parent_tool_use_id` | Cost-tracking page |
| `ResultMessage.usage` | The main loop of this run | Excluded | Python reference: "covers the main agent loop only and excludes subagent and other nested or auxiliary model calls" |
| `ResultMessage.model_usage` | All calls of the query pipeline, per model | Included | Python reference: "the main loop, subagents, and internal calls such as compaction and Workflow agents" |
| `ResultMessage.total_cost_usd` | The whole run, in USD | Included | Cost-tracking page |

The Python reference adds one exclusion: "Helper calls outside that pipeline, such as the permission classifier and token-counting requests, are excluded from `model_usage`."

The `ModelUsage` type in `types.py` (SDK 0.2.165) has these keys: `inputTokens`, `outputTokens`, `cacheReadInputTokens`, `cacheCreationInputTokens`, `webSearchRequests`, `costUSD`, `contextWindow`, `maxOutputTokens`, and the optional `canonicalModel` and `provider`. The `provider` values include `'foundry'`. In Python, `usage`, `model_usage` and `total_cost_usd` are all `Optional`, so check for `None`.

> [!trap] Per-step output tokens are a placeholder
> The cost-tracking page: "Per-step `output_tokens` is a placeholder, so read output tokens from the result message." Claude Code builds each assistant message from the usage reported at `message_start`, before the response was generated. Several messages of one response also share one `message_id` and one usage. Count each `message_id` once, and take output tokens from the result.

### 4.2 The cost formula

The total input of one request is the sum of three fields ([LLM APIs, prompt caching](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops)):

$$
\text{total input} = I + W + R
$$

with $I$ = `input_tokens`, $W$ = `cache_creation_input_tokens`, $R$ = `cache_read_input_tokens`. With $O$ = `output_tokens` and prices $p$ in USD per million tokens:

$$
\text{cost} = \frac{I \cdot p_{\text{in}} + W \cdot p_{\text{write}} + R \cdot p_{\text{read}} + O \cdot p_{\text{out}}}{10^6}
$$

Prices from the pricing page, USD per million tokens (checked on 2026-10-13):

| Model | Input | 5-minute cache write | 1-hour cache write | Cache read | Output |
|---|---|---|---|---|---|
| Claude Sonnet 5 | 2.00 | 2.50 | 4.00 | 0.20 | 10.00 |
| Claude Sonnet 5.5 | 2.00 | 2.50 | 4.00 | 0.10 | 10.00 |
| Claude Opus 5.5 | 4.00 | 5.00 | 8.00 | 0.20 | 20.00 |
| Claude Haiku 5.5, prompt up to 100,000 tokens | 0.10 | 0.125 | 0.20 | 0.01 | 0.50 |
| Claude Haiku 5.5, prompt over 100,000 tokens | 0.50 | 0.625 | 1.00 | 0.05 | 2.50 |

Two rules from the same page. The 1M window has standard pricing on these models: "A 900k-token request is billed at the same per-token rate as a 9k-token request." Haiku 5.5 is the exception, and "A request's prompt length counts all of its input tokens, including cache reads and cache writes."

Claude Code writes the cache with a 5-minute lifetime by default when it uses an API key or Microsoft Foundry. With `ENABLE_PROMPT_CACHING_1H`, it uses the 1-hour price.

### 4.3 Worked example: usage against model_usage

A data question runs on Sonnet 5. The main agent sends one plant query to a subagent on the same model. The run's result holds these values (an example for this lesson, not a measurement):

```json
{
  "usage": {"input_tokens": 6200, "cache_creation_input_tokens": 18400,
            "cache_read_input_tokens": 412000, "output_tokens": 3100},
  "model_usage": {"claude-sonnet-5": {"inputTokens": 8200, "cacheCreationInputTokens": 63400,
                                      "cacheReadInputTokens": 592000, "outputTokens": 4600,
                                      "costUSD": 0.3393}},
  "total_cost_usd": 0.3393
}
```

> [!example] Worked example: the cost by hand
> **From `model_usage`, the whole tree:**
> - input: 8,200 × 2.00 = 16,400 → USD 0.0164
> - cache write: 63,400 × 2.50 = 158,500 → USD 0.1585
> - cache read: 592,000 × 0.20 = 118,400 → USD 0.1184
> - output: 4,600 × 10.00 = 46,000 → USD 0.0460
> - total: 339,300 / 10⁶ = **USD 0.3393**. It matches `total_cost_usd`.
>
> **From `usage`, the main loop only:**
> - 6,200 × 2.00 + 18,400 × 2.50 + 412,000 × 0.20 + 3,100 × 10.00
> - = 12,400 + 46,000 + 82,400 + 31,000 = 171,800 → **USD 0.1718**
>
> **The gap:** 0.3393 − 0.1718 = USD 0.1675, the subagent's cost. That is 49.4% of the answer. A cost report built on `usage` would show half of the real number.
>
> **With 1-hour cache writes** the writes cost 63,400 × 4.00 / 10⁶ = USD 0.2536 instead of 0.1585, and the total becomes **USD 0.4344**.
>
> The arithmetic was checked with a Python script in the sandbox.

> [!key] Account from model_usage, check against total_cost_usd
> `usage` undercounts as soon as a subagent or a compaction runs. The cost-tracking page says: "Where you have the choice, account from `total_cost_usd` or `modelUsage` rather than `usage`."

### 4.4 total_cost_usd is an estimate

The cost-tracking page has a warning (checked on 2026-10-13):

> "The `total_cost_usd` and `costUSD` fields are client-side estimates, not authoritative billing data. The SDK computes them locally from a price table bundled at build time, unless a `modelPricing` table is in effect. They can drift from what you are actually billed when:
>
> - pricing changes
> - the installed SDK version does not recognize a model
> - billing rules apply that the client cannot model"

And: "Do not bill end users or trigger financial decisions from these fields." Two details matter:

1. **Data residency.** The pricing page: US-only inference "incurs a 1.1x multiplier on all token pricing categories". The SDK applies the multiplier when a response's usage reports `inference_geo: "us"`.
2. **Contract rates.** A `modelPricing` table in managed settings makes Claude Code report at contract rates. The costs page: "The setting changes what Claude Code reports, not what Anthropic charges."

The docs also describe a `costBasis` key on each model entry (`list`, `managed` or `unknown`), which needs Claude Code 2.1.246 or later. The Python `ModelUsage` type does not declare it. The value passes from the CLI unchanged, so read it with `.get("costBasis")`.

### 4.5 When Microsoft Foundry bills you

The pricing page describes Microsoft Foundry (checked on 2026-10-13). Azure bills Claude in Claude Consumption Units at USD 0.01 per CCU, "converted from token costs at standard per-model rates, with negotiated discounts applied as fewer CCUs metered." The page also says that the US Data Zone Standard deployment type "is equivalent to `inference_geo: "us"` on the Claude API and applies the same 1.1x pricing multiplier."

The costs page adds: "On Amazon Bedrock, Google Cloud's Agent Platform, and Microsoft Foundry, Claude Code is billed per token to your cloud account... Claude Code does not send metrics from your cloud back to Anthropic".

> [!example] Worked example: the answer of section 4.3 on Foundry
> - At list price: USD 0.3393 / 0.01 = **33.93 CCU**.
> - In a US Data Zone deployment: 0.3393 × 1.1 = USD 0.37323 = **37.32 CCU**.
> - With a negotiated discount, Azure meters fewer CCUs. Your contract gives the factor.
>
> The estimate in `total_cost_usd` is 0.3393 in both deployments, unless the response reports `inference_geo: "us"`. Whether a Foundry response reports that field is not confirmed. Compare a month of estimates with the Azure invoice once, and record the factor.

### 4.6 A resumed session reports the session's total

The cost-tracking page (checked on 2026-10-13):

> "Calls that resume the same session: Claude Code saves the session's totals to its transcript when the process exits normally and restores them when a later call resumes or forks the session. Each result already includes the session's earlier spend. Read the latest result for the session total; summing results double-counts the restored spend. Before v2.1.277, a session that you resumed through the SDK or `claude -p` started its totals at zero".

SDK 0.2.165 bundles CLI 2.1.296, so the new rule applies. A service that resumes per message (Flow 1) must subtract. A service that starts a new session (Flow 2) gets a fresh total ([Sessions L3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks)).

This table logs the raw values. It ran on PostgreSQL 16:

```sql
CREATE TABLE answer_costs (
    answer_id        uuid PRIMARY KEY,
    chat_id          uuid NOT NULL,
    session_id       uuid NOT NULL,
    created_at       timestamptz NOT NULL,
    subtype          text NOT NULL,
    terminal_reason  text,
    session_cost_usd numeric(12, 6),      -- total_cost_usd as reported
    model_usage      jsonb NOT NULL        -- ResultMessage.model_usage as reported
);
```

Three answers of one chat were inserted: two in session `5b3f...` (the second one resumed it), then one in a new session `e0c1...` after a restart. The cost of each answer is the reported total minus the previous total of the same session:

```sql
SELECT answer_id, session_id, session_cost_usd,
       session_cost_usd - lag(session_cost_usd, 1, 0) OVER w AS answer_cost_usd
FROM answer_costs
WINDOW w AS (PARTITION BY session_id ORDER BY created_at)
ORDER BY created_at;
```

```text
              answer_id               |              session_id              | session_cost_usd | answer_cost_usd
--------------------------------------+--------------------------------------+------------------+-----------------
 00000000-0000-0000-0000-0000000000a1 | 5b3f2c1a-8d4e-4f6b-9a7c-2e1d0f9b8a6c |         0.339300 |        0.339300
 00000000-0000-0000-0000-0000000000a2 | 5b3f2c1a-8d4e-4f6b-9a7c-2e1d0f9b8a6c |         0.483800 |        0.144500
 00000000-0000-0000-0000-0000000000a3 | e0c1d2b3-4a5f-4e6d-8c7b-9a0f1e2d3c4b |         0.151950 |        0.151950
```

The cost of the chat is the last total of each session, summed over its sessions:

```sql
SELECT chat_id, sum(last_total) AS chat_cost_usd
FROM (SELECT DISTINCT ON (session_id) chat_id, session_id, session_cost_usd AS last_total
      FROM answer_costs ORDER BY session_id, created_at DESC) s
GROUP BY chat_id;
```

```text
               chat_id                | chat_cost_usd
--------------------------------------+---------------
 00000000-0000-0000-0000-00000000c001 |      0.635750
```

A naive `sum(session_cost_usd)` would give 0.3393 + 0.4838 + 0.15195 = 0.97505, which double-counts 0.3393.

> [!trap] A crash can report zero
> The agent-loop page: after a session crash, "the final result is an `error_during_execution` whose cost fields may be zeroed". Then the subtraction gives a negative answer cost. Store the row, but exclude zero totals from the `lag` input, and flag the answer for review.

### 4.7 Budgets with max_budget_usd

The facts, from the agent-loop and cost-tracking pages (checked on 2026-10-13):

| Rule | Quote |
|---|---|
| When the check runs | "Claude Code compares spend with the `max_budget_usd` / `maxBudgetUsd` cap after model responses arrive" |
| Overshoot | "Spend can therefore pass the cap by up to the cost of that one response, plus anything that subagents still running at that moment spend before they stop." |
| Subagents | "The budget cap covers subagents: their spend counts toward the total. Once spend reaches the cap, spawning another subagent fails with `Budget limit reached`" |
| Resumed sessions | It "counts only the call's own spend: totals restored from a resumed session don't count against it" |
| Result | Subtype `error_max_budget_usd`. "`usage` leaves out the response that crossed the budget, while `total_cost_usd` and `modelUsage` include it." |

> [!example] Worked example: the overshoot
> `max_budget_usd = 0.50`. After four responses the estimate is USD 0.47, below the cap. The fifth response reads a large tool result and costs USD 0.22. The check runs after it: 0.47 + 0.22 = 0.69, which is at or above 0.50, so the loop stops.
>
> - Final `total_cost_usd`: 0.69.
> - Overshoot: 0.69 − 0.50 = USD 0.19, which is 38% above the cap.
>
> So the cap is a stop signal, not a guarantee. Set it below your real limit by the cost of one large response.

A per-chat or per-user budget cannot use `max_budget_usd` alone, because each call counts only its own spend. Keep the running totals in your database (section 4.6), and pass the remaining amount as `max_budget_usd` on each call.

### 4.8 Production view

| Concern | What to do |
|---|---|
| Accuracy | Log `model_usage` and `total_cost_usd`, not `usage`. Treat both as estimates. |
| Resume | Store the reported total. Compute each answer's cost as the difference within its session. |
| Billing | Reconcile with the Azure invoice for Foundry, or with the Usage and Cost API for the Anthropic API. Never bill users from the estimate. |
| Budgets | Use `max_budget_usd` with headroom for one response. Keep chat and user totals in your database. |
| Observability | Log `contextWindow` and `provider` from `model_usage`. A wrong window or provider appears there first. |
| Crashes | Detect zero totals after `error_during_execution`, and flag them. |

## 5. Code

These exercises go in `claude-agent-sdk/16-cost-and-usage.ipynb`. Exercises 2.1, 2.2 and 2.3 need no API key.

**Exercise 2.1: a cost function.** Write `cost_from_model_usage(model_usage, prices)` that returns the cost per model and the total. `prices` maps a model name to its five prices.

Acceptance tests:

- The `model_usage` of section 4.3 gives USD 0.3393.
- The `usage` of section 4.3, converted to the same shape, gives USD 0.1718.
- A model that is missing from `prices` raises `KeyError` with the model name. It never prices it as zero.

**Exercise 2.2: deduplicate per-step usage.** Write `main_loop_input(messages)` that sums `input_tokens`, `cache_creation_input_tokens` and `cache_read_input_tokens` over `AssistantMessage` objects, counting each `message_id` once and skipping messages with a `parent_tool_use_id`.

Acceptance tests:

- Three messages with the same `message_id` count once.
- A message with `parent_tool_use_id` set is not counted.
- The function never reads `output_tokens`.

**Exercise 2.3: the cost table.** Create `answer_costs` in a local database and insert the three rows of section 4.6. Add a fourth row in session `5b3f...` with a zero total after a crash.

Acceptance tests:

- Your per-answer query gives 0.3393, 0.1445 and 0.15195 for the first three rows.
- The crash row does not produce a negative answer cost, and a second query lists it as "needs review".

**Exercise 2.4: a live budget.** Run a task that needs many tool calls with `max_budget_usd=0.05`.

Acceptance tests:

- You print the subtype `error_max_budget_usd`, `total_cost_usd` and the overshoot in percent.
- You resume the session with a higher budget and finish the task. You explain why the second call's `total_cost_usd` includes the first call's spend.

## 6. Common mistakes

1. **Computing cost from `usage`.** It excludes subagents and compaction. Use `model_usage`.
2. **Summing `total_cost_usd` over the answers of a resumed session.** Each result already contains the session's earlier spend.
3. **Reading output tokens per step.** Per-step `output_tokens` is a placeholder. Read them from the result.
4. **Billing users from `total_cost_usd`.** It is a client-side estimate at list price.
5. **Expecting the Azure invoice to match the estimate.** Foundry bills CCUs, with discounts and the 1.1 data-zone factor.
6. **Treating `max_budget_usd` as a hard ceiling.** The last response and running subagents can pass it.

## 7. One-minute explanation

The `ResultMessage` has three cost fields. `usage` holds the token counts of the main loop only, so it misses subagents and compaction. `model_usage` holds the counts and an estimated cost per model for the whole tree, and `total_cost_usd` holds the estimated total. The cost of a request is input tokens, cache writes, cache reads and output tokens, each times its price: on Sonnet 5 that is USD 2.00, 2.50, 0.20 and 10.00 per million. All these costs are client-side estimates at list price. On Microsoft Foundry the real bill comes from Azure in CCUs of one cent each, with discounts and a 1.1 factor for US data zones. A resumed session reports the session's running total, so the cost of one answer is the difference to the previous result of that session. `max_budget_usd` stops a run after the response that reaches the cap, so the spend can pass the cap by one response. It also counts only the current call.

## 8. Check questions

```check
{
  "question": "A result has usage with 400,000 cache-read tokens and model_usage with 900,000 cache-read tokens for the same model. Is that a bug? What explains the difference?",
  "answer": "No. usage covers only the main agent loop. model_usage covers every call of the query pipeline: subagents, compaction and Workflow agents too. The 500,000 extra cache-read tokens came from those calls. Use model_usage for cost accounting."
}
```

```check
{
  "question": "Compute the cost on Sonnet 5 of a response with input_tokens 1,000, cache_creation_input_tokens 20,000, cache_read_input_tokens 300,000 and output_tokens 2,000, with 5-minute cache writes.",
  "hint": "Prices per million: 2.00, 2.50, 0.20, 10.00.",
  "answer": "1,000 × 2.00 + 20,000 × 2.50 + 300,000 × 0.20 + 2,000 × 10.00 = 2,000 + 50,000 + 60,000 + 20,000 = 132,000. Divided by 1,000,000: USD 0.132."
}
```

```check
{
  "question": "A chat resumes its session for each message. The results show total_cost_usd 0.20, 0.35 and 0.61. What did the third answer cost, and what did the chat cost?",
  "answer": "Each result includes the session's earlier spend. The third answer cost 0.61 − 0.35 = USD 0.26. The chat cost is the last total, USD 0.61, not 0.20 + 0.35 + 0.61 = 1.16."
}
```

```check
{
  "question": "A service on Microsoft Foundry, in a US Data Zone Standard deployment, logs total_cost_usd = 1.00 for a day. Why can the Azure meter show a different number, and in which direction can each reason move it?",
  "answer": "Azure bills CCUs at USD 0.01 at standard per-model rates. The US data zone adds a 1.1 multiplier, which raises the bill to about 110 CCU if the estimate did not include it. A negotiated discount lowers the number of CCUs metered. The estimate can also drift if prices changed or the CLI does not know the model. Reconcile with the invoice."
}
```

## 9. Links

- Previous: [L1: SDK errors](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors)
- Next in the priority path: [Hooks and subagents L1: Hooks](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks)
- Cache prices and breakpoints: [LLM APIs: Prompt caching in agent loops](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops)
- The Foundry endpoint: [LLM APIs: Claude on Microsoft Foundry](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry)
- Budgets on resume: [Sessions L2: resume, continue and fork](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork)
- [Glossary](/notes/ai/claude-agent-sdk/glossary)
