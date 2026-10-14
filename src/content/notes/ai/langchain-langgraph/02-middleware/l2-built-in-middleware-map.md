---
title: "L2: The built-in middleware map"
order: 2
summary: "Every built-in middleware of langchain 1.4.5 with its hook, parameters and use, grouped as use, maybe later and not needed. Model and tool call limits compared with the recursion limit on a fake model, retry backoff math and the hidden retries of the HTTP client, the order trap between retry and fallback, PII strategies, and the cost of an LLM tool selector."
status: not-started
tags: [langchain, middleware, limits, retries, fallback, pii]
---

## 1. The question this idea answers

langchain 1.4.5 ships 16 middleware classes (checked on 2026-10-13). An agent backend for production data questions needs some of them on day one, some later, and some never.

For each class you use, the details decide the behavior. Does a limit stop the run cleanly, or does it crash it? Does a retry also retry a request that can never succeed? Does a fallback model ever run? Does PII redaction change only the model input, or also the saved history? This lesson gives the map, then tests the classes that matter most with a fake model.

## 2. Mental model

> [!analogy] A workshop toolbox
> A toolbox holds tools for daily work, tools for special jobs, and tools for another trade. A good mechanic knows all of them by name, uses the daily ones well, and leaves the others in the box.
>
> **Where it stops working:** tools in a box do not change each other. Middleware do. A retry layer placed inside a fallback layer can hide every failure from the fallback, so the fallback never runs. With middleware, the order in the list is part of the behavior.

## 3. Terms

| Term | Plain meaning |
|---|---|
| built-in middleware | A middleware class in `langchain.agents.middleware`. |
| run limit | A limit for one invocation of the agent. |
| thread limit | A limit for one conversation thread across invocations. It needs a checkpointer. |
| `exit_behavior` | What a limit middleware does at the limit: end the run cleanly, raise an error, or continue. |
| retry | A new attempt of a failed model or tool call. |
| backoff | A wait before a retry that grows with each attempt. |
| jitter | A random change of the wait, here plus or minus 25%, so that clients do not retry at the same moment. |
| `retry_on` | The rule that decides which exceptions get a retry. |
| `on_failure` | What a retry middleware does after the last failed attempt. |
| fallback model | A second model that the agent calls when the first model raises an exception. |
| PII | Personally identifiable information, for example an email address. |
| redaction strategy | How PII is handled: `block`, `redact`, `mask` or `hash`. |
| tool selector | A middleware that asks a model which tools to offer before each main model call. |

## 4. Method and math

### 4.1 The map

All classes come from `langchain.agents.middleware` in langchain 1.4.5. The hooks come from the source. The groups are a recommendation for an agent that answers production data questions through Databricks tools.

| Class | Hooks | Use | Group |
|---|---|---|---|
| `ModelCallLimitMiddleware` | `before_model`, `after_model` | Stop after N model calls | use |
| `ToolCallLimitMiddleware` | `after_model` | Stop or block after N tool calls | use |
| `ModelRetryMiddleware` | `wrap_model_call` | Retry failed model calls with backoff | use |
| `ToolRetryMiddleware` | `wrap_tool_call` | Retry failed tool calls with backoff | use |
| `ToolErrorMiddleware` | `wrap_tool_call` | Turn chosen tool exceptions into error `ToolMessage` objects | use |
| `SummarizationMiddleware` | `before_model` | Replace old messages with a summary | use, [Part 3](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) |
| `ContextEditingMiddleware` | `wrap_model_call` | Clear old tool outputs in the model input | use, [Part 3](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) |
| `ModelFallbackMiddleware` | `wrap_model_call` | Call other models when the first one fails | maybe later |
| `PIIMiddleware` | `before_model`, `after_model` | Detect and handle PII | maybe later |
| `LLMToolSelectorMiddleware` | `wrap_model_call` | Offer only some tools to each call | maybe later |
| `LLMToolEmulator` | `wrap_tool_call` | Let a model invent tool results, for tests | maybe later |
| `HumanInTheLoopMiddleware` | `after_model`, `wrap_tool_call` | Pause for human approval of tool calls | not needed |
| `TodoListMiddleware` | `wrap_model_call`, `after_model` | Give the model a `write_todos` planning tool | not needed |
| `FilesystemFileSearchMiddleware` | adds tools | Glob and grep over a local folder | not needed |
| `ShellToolMiddleware` | `before_agent`, `after_agent` | A persistent shell tool | not needed |
| `ProviderToolSearchMiddleware` | `wrap_model_call` | Provider-side tool search | not needed |

The docs page "Built-in middleware" also lists Filesystem, Subagent and Rubric grading. Those come from the separate `deepagents` package, not from `langchain`.

### 4.2 Three ways to stop a loop

| Mechanism | Counts | Checks in | At the limit | What the user sees |
|---|---|---|---|---|
| Recursion limit | super-steps | the graph loop | raises `GraphRecursionError` | no answer |
| `ModelCallLimitMiddleware` | model calls | `before_model` | `"end"`: adds an `AIMessage` and jumps to the end. `"error"`: raises. | a limit message |
| `ToolCallLimitMiddleware` | tool calls, all or one tool | `after_model` | `"continue"`: error `ToolMessage` for blocked calls. `"end"`: error messages and a final `AIMessage`. `"error"`: raises. | depends on `exit_behavior` |

The test model asks for the same tool on every call, so the run never stops by itself. The real results:

```text
ModelCallLimit(run_limit=3, end): model calls = 3 | last: Model call limits exceeded: run limit (3/3) | msgs: 8
ModelCallLimit(error): ModelCallLimitExceededError - Model call limits exceeded: run limit (3/3) | model calls = 3
ToolCallLimit(run_limit=2, continue) + recursion_limit=20: GraphRecursionError | model calls = 9
ToolCallLimit(run_limit=2, end): model calls = 3
     AIMessage ''
     ToolMessage 'Tool call limit exceeded. Do not make additional tool calls.' error
     AIMessage 'Tool call limit reached: run limit exceeded (3/2 calls).'
```

Read the four lines:

1. The model call limit ended the run cleanly after exactly 3 calls. The 8 messages are the question, 3 pairs of tool call and result, and the limit message.
2. With `exit_behavior="error"` the same limit raised `ModelCallLimitExceededError`.
3. With `"continue"`, the tool limit only told the model to stop. A model that ignores the message keeps calling, and the recursion limit crashed the run after 9 model calls.
4. With `"end"`, the tool limit added an error result for the blocked call, so every tool call keeps its result, and then a final message.

> [!trap] "continue" depends on the model
> `ToolCallLimitMiddleware` defaults to `exit_behavior="continue"`. It blocks the tool, but the model decides when to stop. Combine it with a `ModelCallLimitMiddleware`, which always stops.

The source details that explain the numbers:

- `ModelCallLimitMiddleware.before_model` blocks when `count >= limit`. `after_model` adds 1 to both counters. So `run_limit=3` allows exactly 3 calls.
- `ToolCallLimitMiddleware` blocks a call when `count + 1 > limit`. Blocked calls count toward the run count, not the thread count. `run_limit` greater than `thread_limit` raises `ValueError`.
- The thread counter is a normal state key, so it survives between runs only with a checkpointer. The run counter is an `UntrackedValue`.

A real test with `ModelCallLimitMiddleware(thread_limit=2)`, `InMemorySaver` and one `thread_id`:

```text
thread_limit=2 run 1: A1
thread_limit=2 run 2: A2
thread_limit=2 run 3: Model call limits exceeded: thread limit (2/2)
```

### 4.3 Retries and backoff

`ModelRetryMiddleware` (langchain 1.4.5) has these defaults: `max_retries=2`, `retry_on=default_retry_on`, `on_failure="continue"`, `backoff_factor=2.0`, `initial_delay=1.0`, `max_delay=60.0`, `jitter=True`. `ToolRetryMiddleware` has the same parameters plus `tools`, a list that limits which tools it retries.

The delay before retry number $n$ (counted from 0) comes from `calculate_delay` in `_retry.py`:

$$
d_n = \min(\text{initial\_delay} \cdot \text{backoff\_factor}^{\,n},\ \text{max\_delay})
$$

With jitter, the code adds a random value between $-0.25\,d_n$ and $+0.25\,d_n$.

> [!example] Worked example: the default schedule and a long one
> Defaults: `max_retries = 2`, so 3 attempts.
>
> 1. Attempt 1 fails. $d_0 = 1.0 \cdot 2^0 = 1.0$ s, with jitter 0.75 to 1.25 s.
> 2. Attempt 2 fails. $d_1 = 1.0 \cdot 2^1 = 2.0$ s, with jitter 1.5 to 2.5 s.
> 3. Attempt 3 fails. No more retries. `on_failure` runs.
>
> Total wait: $1.0 + 2.0 = 3.0$ s, between 2.25 and 3.75 s with jitter.
>
> With `max_retries = 7`: the delays are 1, 2, 4, 8, 16, 32, then $\min(64, 60) = 60$. Total: $1 + 2 + 4 + 8 + 16 + 32 + 60 = 123$ s, about 2 minutes for one model call.

The default `retry_on` is `default_retry_on`. Its code: a `ModelError` is retried only when `is_retryable` is true. Any other `Exception` is retried. `ChatDatabricks` raises the `openai` exceptions directly, not `ModelError` subclasses. So every error of that client is retried, also a 400.

The `openai` client inside `ChatDatabricks` has its own retries: 2 by default, for 408, 409, 429 and 5xx responses ([ChatDatabricks](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks)). A fake endpoint counted the HTTP requests with `ModelRetryMiddleware(initial_delay=0.0)`:

```text
HTTP 400: requests sent = 3, seconds = 0.1
   final message: "Model call failed after 3 attempts with BadRequestError: Error code: 400 - {'error_code': 'BAD_REQUEST', 'message': 'simulated'}"
HTTP 500: requests sent = 9, seconds = 4.2
   final message: "Model call failed after 3 attempts with InternalServerError: Error code: 500 - {'error_code': 'BAD_REQUEST', 'message': 'simulated'}"
```

For the 500: 3 middleware attempts × 3 HTTP attempts each = 9 requests. For the 400: the `openai` client does not retry, but the middleware does: 3 requests that can never succeed.

> [!trap] The default on_failure writes the error into the chat
> With `on_failure="continue"`, the middleware returns an `AIMessage` whose text is the error, as in the output above. That message enters the state, the stream and the user transcript. Set `on_failure="error"` and handle the exception in your service, or pass a callable that returns a short, safe text.

A safer configuration for `ChatDatabricks`, as a sketch:

```python
import openai
ModelRetryMiddleware(
    max_retries=2,
    retry_on=(openai.RateLimitError, openai.APITimeoutError, openai.InternalServerError),
    on_failure="error",
)
```

`ToolRetryMiddleware` with defaults retried a failing tool 3 times. The real final result was a `ToolMessage` with `status="error"` and the text `"Tool 'get_downtime' failed after 3 attempts with TimeoutError: warehouse query timed out. Please try again."` Without any middleware, the same tool exception left the agent: `TimeoutError warehouse query timed out`. The tools node catches only argument validation errors by default.

### 4.4 Fallback models and the order trap

`ModelFallbackMiddleware(first_model, *additional_models)` calls the handler with the primary model. If it raises, it calls the handler again with each fallback model in order. If all fail, it raises the last exception. It reacts only to exceptions.

A test combined a failing primary model with a working backup, in both orders:

```text
retry_outer: primary calls=1 backup calls=1 answer='Answer from the backup model.'
fallback_outer: primary calls=3 backup calls=0 answer='Model call failed after 3 attempts with TimeoutError: endpoint timed out'
```

In `fallback_outer`, the retry layer is inside. After 3 failures, its `on_failure="continue"` returned a normal `AIMessage`. The fallback layer saw a success and never called the backup.

> [!trap] Put the retry layer outside the fallback, or make it raise
> `middleware=[retry, fallback]` works: the fallback runs inside each retry attempt. `middleware=[fallback, retry]` works only with `on_failure="error"` on the retry layer.

### 4.5 PIIMiddleware

`PIIMiddleware(pii_type, *, strategy="redact", detector=None, apply_to_input=True, apply_to_output=False, apply_to_tool_results=False)`. Built-in types: `email`, `credit_card` (Luhn check), `ip`, `mac_address`, `url`. A custom type needs a `detector`: a regex string or a function.

The real results for the question "Send the downtime report for plant 3 to ana.silva@example.com":

```text
redact state HumanMessage: Send the downtime report for plant 3 to [REDACTED_EMAIL]
mask   state HumanMessage: Send the downtime report for plant 3 to ana.silva@****.com
hash   state HumanMessage: Send the downtime report for plant 3 to <email_hash:7bda2560>
block  PIIDetectionError: Detected 1 instance(s) of email in text content
```

The input check runs in `before_model` and returns a state update. So the change is persistent: the agent state no longer holds the original user text.

> [!trap] Output redaction does not clean a messages stream
> With `apply_to_output=True`, the final state held `Contact [REDACTED_EMAIL] for the report.` But a client that read `stream_mode="messages"` received `Contact ana.silva@example.com for the report.` The source says the stream transformer covers `astream_events(version="v3")` and `run.messages`. It did not clean the classic `messages` stream in this test.

### 4.6 LLMToolSelectorMiddleware: what it costs

`LLMToolSelectorMiddleware(*, model=None, system_prompt=..., max_tools=None, always_include=None, max_retries=1, on_parsing_failure="error")`. It runs in `wrap_model_call`, so it runs before every main model call. The source shows the selection request. It holds the selector's system prompt and the last `HumanMessage` only. A structured output schema lists the tool names and descriptions. `model=None` uses the agent's own model.

Three costs follow from the code:

1. One extra model call before each main model call. An answer with 3 main calls makes 6 calls.
2. The selection sees only the last user message, not the tool results. On the second main call, it still chooses tools from the first question alone.
3. The tool list of the main call can change between calls. Tools come first in the prompt cache order, and a change of tools invalidates the cache ([prompt caching in agent loops](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops)).

> [!example] Worked example: when does selection pay?
> Assume 40 tools with about 150 tokens each, so 6,000 tokens of tool definitions. Assume `max_tools=5` and 3 main calls per answer. Assume the selection input is 3,000 tokens. These numbers are assumptions for the arithmetic.
>
> 1. Tool tokens removed from each main call: $35 \times 150 = 5{,}250$.
> 2. Removed for the answer: $3 \times 5{,}250 = 15{,}750$.
> 3. Added by the selection calls: $3 \times 3{,}000 = 9{,}000$, plus their output tokens.
>
> Without caching, the selector saves about 6,750 input tokens. Now assume the provider caches the full tool list, read at 0.1 of the base input price (the Anthropic API rate for most models). The removed tokens are then worth about $15{,}750 \times 0.1 = 1{,}575$ base tokens. Then the 9,000 selection tokens cost more than they save, and each answer waits for 3 extra sequential calls.

### 4.7 The not-needed group

| Class | Why not needed here |
|---|---|
| `HumanInTheLoopMiddleware` | The data tools only read. Approval needs interrupts, a checkpointer and an approval UI. |
| `TodoListMiddleware` | Adds a `write_todos` tool and a long system prompt. Data questions need few steps. |
| `FilesystemFileSearchMiddleware` | Searches a local folder (`root_path`). The data lives in Databricks, not on the app disk. |
| `ShellToolMiddleware` | Gives the model a shell. A large security risk with no use for data questions. |
| `ProviderToolSearchMiddleware` | Works only with providers `anthropic` and `openai`. With `ChatDatabricks` the real error was: `ValueError: ProviderToolSearchMiddleware requires a provider with server-side tool search, but got 'databricks'; supported providers: anthropic, openai` |

> [!key] Limits stop, retries repeat, order decides
> Use `ModelCallLimitMiddleware` for a clean stop, and keep the recursion limit only as a crash guard. Narrow `retry_on` to errors that can succeed on a second try, and count the retries of the HTTP client too. Put the retry layer outside a fallback layer. Every built-in middleware is an ordinary hook, so the rules of [L1](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks) apply: persistent or transient, and the order in the list.

### 4.8 Production view

| Concern | What to do |
|---|---|
| Reliability | `ModelCallLimitMiddleware(run_limit=...)` with `exit_behavior="end"` on every agent. |
| Cost | Count HTTP requests per model call in a test. Middleware retries multiply client retries. |
| Latency | Sum the backoff schedule. Keep the worst case below your request timeout. |
| User transcript | Never let `on_failure="continue"` text reach the stored chat as a real answer. |
| Security | Redact PII before the model call if needed, and filter the stream separately. |
| Testing | Test each limit with a fake model that never stops. |

## 5. Code

These exercises go in `langchain-langgraph/05-built-in-middleware.ipynb`. They need no API key.

**Exercise 5.1: a runaway model.** Write a fake model that always asks for the same tool. Run it with no limit and `recursion_limit=10`, then with `ModelCallLimitMiddleware(run_limit=3)`.

Acceptance tests:

- Without middleware, the run raises `GraphRecursionError`.
- With the middleware, the run returns normally, and the last message contains "Model call limits exceeded".
- Every tool call in the final state has a `ToolMessage`.

**Exercise 5.2: count the real requests.** With a local fake endpoint that always returns HTTP 500, count the requests of one agent run for three settings of `ModelRetryMiddleware` and the `ChatDatabricks` `max_retries` field.

Acceptance tests:

- Defaults on both layers give 9 requests.
- `max_retries=0` on `ChatDatabricks` gives 3 requests.
- A `retry_on` tuple without `openai.InternalServerError` gives 3 requests, all from the client, and the run raises `InternalServerError`.

**Exercise 5.3: the order trap.** Reproduce section 4.4 with your own failing and backup models.

Acceptance tests:

- `[retry, fallback]` returns the backup answer.
- `[fallback, retry]` returns the error text with default settings.
- `[fallback, retry]` with `on_failure="error"` on the retry returns the backup answer.

## 6. Common mistakes

1. **Using the recursion limit as the normal stop.** It raises an error and gives no answer. Use a model call limit.
2. **Trusting `exit_behavior="continue"` to stop a loop.** It only tells the model to stop.
3. **Keeping the default `retry_on` with `ChatDatabricks`.** It retries 400 errors that cannot pass.
4. **Forgetting the HTTP client's own retries.** The middleware and the client multiply.
5. **Putting the fallback outside a retry layer with `on_failure="continue"`.** The fallback never runs.
6. **Calling PII output redaction a stream filter.** The classic messages stream still carried the raw email.

## 7. One-minute explanation

langchain 1.4.5 ships 16 middleware classes, and each one is an ordinary hook. For a production data agent, the daily ones are the limits, the retries, tool error handling, and the context tools of Part 3. A model call limit stops the run cleanly with a message. The recursion limit crashes it, and a tool call limit with "continue" only asks the model to stop. Retries wait 1 s, then 2 s, and the wait doubles to a maximum of 60 s with 25% jitter. The default `retry_on` also retries errors that can never pass. The HTTP client inside `ChatDatabricks` retries again, so 3 attempts became 9 requests in a test. The default `on_failure` writes the error into the chat as an answer. A fallback reacts only to exceptions, so the retry layer must be outside it or must raise. PII middleware changes the saved state but did not clean the messages stream, and a tool selector adds one model call before every main call.

## 8. Check questions

```check
{
  "question": "An agent uses ToolCallLimitMiddleware(run_limit=2) with default settings and no other limit. The model keeps asking for tools. What happens, and what do you add?",
  "hint": "What is the default exit_behavior?",
  "answer": "The default is continue. Blocked calls get an error ToolMessage, but the model can keep calling until the recursion limit raises GraphRecursionError, which gave 9 model calls with recursion_limit 20 in the test. Add ModelCallLimitMiddleware with a run_limit and exit_behavior end, or use exit_behavior end on the tool limit."
}
```

```check
{
  "question": "ModelRetryMiddleware has max_retries = 4, initial_delay = 1.0, backoff_factor = 2.0, max_delay = 5.0 and no jitter. List the delays and the total wait.",
  "answer": "d0 = 1.0, d1 = 2.0, d2 = 4.0, d3 = min(8.0, 5.0) = 5.0. Total = 1 + 2 + 4 + 5 = 12 s for 5 attempts."
}
```

```check
{
  "question": "Why did a test with HTTP 500 and default settings send 9 requests for one model call through ChatDatabricks?",
  "answer": "ModelRetryMiddleware makes 3 attempts (1 + max_retries 2). Inside each attempt, the openai client of ChatDatabricks retries a 5xx response 2 times, so 3 HTTP requests per attempt. 3 x 3 = 9."
}
```

```check
{
  "question": "middleware=[ModelFallbackMiddleware(backup), ModelRetryMiddleware()]. The primary model always raises a timeout error. Does the backup ever run? Explain with the hook order.",
  "answer": "No. The fallback is outermost, the retry is inside it. The retry layer catches the 3 timeouts and, with on_failure continue, returns an AIMessage with the error text. The fallback sees a normal response, not an exception, so it never calls the backup."
}
```

## 9. Links

- Previous: [L1: The middleware hooks](/notes/ai/langchain-langgraph/02-middleware/l1-the-middleware-hooks)
- Next part: [SummarizationMiddleware](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware)
- What the recursion limit counts: [create_agent](/notes/ai/langchain-langgraph/01-foundations/l2-create-agent)
- The client retries: [ChatDatabricks](/notes/ai/langchain-langgraph/01-foundations/l3-chatdatabricks)
- [Glossary](/notes/ai/langchain-langgraph/glossary)
