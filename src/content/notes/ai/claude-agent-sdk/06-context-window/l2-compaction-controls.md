---
title: "L2: Compaction controls"
order: 2
summary: "The environment variables that move or disable auto-compaction, how to pass them through options.env, the parsing trap that turns 500k into 100,000, manual /compact, and a PreCompact hook that archives the transcript. Why a team can choose a smaller window, with worked costs for a 120-message chat."
status: not-started
tags: [agent-sdk, compaction, environment-variables, precompact, cost]
---

## 1. The question this idea answers

[L1](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) showed the default: a Sonnet 5 session grows to about 967K tokens, then Claude Code compacts it. A team that runs a chat service often wants a different behavior:

- Compact earlier, because large calls are expensive, slow and less accurate.
- Never compact in a test, so that a test sees the exact conversation.
- Keep a copy of the transcript before each compaction, for audits.
- Compact on purpose at the end of a task, not in the middle of the next one.

All of these are settings of the CLI, not of the SDK. This lesson lists them with their exact rules, shows how to pass them from Python, and gives numbers for the main decision: which window size to use.

## 2. Mental model

> [!analogy] A thermostat with a camera
> The auto-compact window is the setpoint of a thermostat. When the room reaches the setpoint, the cleaner comes and tidies the room (compaction). A lower setpoint means a tidier room, but the cleaner comes more often. A switch can disable the cleaner. A camera (the PreCompact hook) photographs the room just before each visit, so you keep a record of how it looked.
>
> **Where it stops working:** a thermostat costs the same per degree. Here each visit of the cleaner costs a summary request and a cache rebuild, and each visit discards detail that the summary does not keep. A lower setpoint saves on every call, but pays more often for these visits.

## 3. Terms

| Term | Plain meaning |
|---|---|
| auto-compact window | The context size, in tokens, that Claude Code lets the conversation reach before auto-compaction. |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | An environment variable that sets the auto-compact window, from 100,000 to 1,000,000 tokens. |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | An environment variable that sets, in percent, how full the auto-compact window gets before compaction. It can only lower the point. |
| `DISABLE_AUTO_COMPACT` | An environment variable that disables automatic compaction. Manual `/compact` still works. |
| `DISABLE_COMPACT` | An environment variable that disables all compaction, also manual `/compact`. |
| `CLAUDE_CODE_DISABLE_1M_CONTEXT` | An environment variable that holds native-1M models to a 200K window. |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | An environment variable that sets the output limit of most requests. A larger value lowers the compaction point. |
| clamp | To move a value that is outside a range to the nearest end of the range. |
| manual compaction | Compaction that you start by sending `/compact` as a prompt. |
| `PreCompact` hook | A callback that runs before each compaction. It can archive the transcript or block the compaction. |
| `transcript_path` | A field of every hook input: the path of the session file. |
| `verbatim_prompts` | An SDK option that delivers prompts as plain text, with no slash-command dispatch. |

## 4. Method and math

### 4.1 Where the settings live

The settings are environment variables of the CLI process. From Python, put them in `options.env`. The SDK merges `options.env` "on top of the inherited process environment" ([Foundations L1, section 4.5](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is)).

```python
from claude_agent_sdk import ClaudeAgentOptions

options = ClaudeAgentOptions(
    model="claude-sonnet-5",
    env={
        "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "200000",   # a string of plain digits
        "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "80",
    },
)
```

Two rules follow from the architecture:

1. Every value is a string. The `env` field has the type `dict[str, str]`.
2. Each `query()` starts a new CLI process, so each call can use different values. A `ClaudeSDKClient` keeps the values of its process for its whole life.

The model-config page gives the order of precedence for the window (checked on 2026-10-13). `CLAUDE_CODE_AUTO_COMPACT_WINDOW` "takes precedence over the command, the flag, and the setting". For a service, the environment variable is the clearest choice, because it does not depend on which settings files `setting_sources` loads.

### 4.2 CLAUDE_CODE_AUTO_COMPACT_WINDOW and the parsing trap

The env-vars page (checked on 2026-10-13):

> "Set the auto-compact window in tokens, from `100000` to `1000000`. Accepts a plain integer such as `500000` only: a value like `500k` reads as `500` and clamps to the 100K minimum. The effective window is also capped at the model's context window."

The CLI source agrees. In Claude Code 2.1.296 the window logic computes `Math.min(contextWindow, Math.max(1e5, value))`, and the value parser ends with `parseInt(n, 10)`. JavaScript's `parseInt` reads digits until the first non-digit. A run in Node.js in the sandbox:

```text
parseInt("500k", 10)  -> 500
parseInt("1M", 10)    -> 1
min(1000000, max(100000, 500)) -> 100000
```

> [!example] Worked example: five values, two models
> | Value of the variable | Parsed value | Effective window on Sonnet 5 (1M) | Effective window on a 200K model |
> |---|---|---|---|
> | `"500000"` | 500,000 | 500,000 | 200,000 (capped) |
> | `"500k"` | 500 | 100,000 (clamped) | 100,000 (clamped) |
> | `"1M"` | 1 | 100,000 (clamped) | 100,000 (clamped) |
> | `"1500000"` | 1,500,000 | 1,000,000 (capped) | 200,000 (capped) |
> | `"200000"` | 200,000 | 200,000 | 200,000 |
>
> The `"500k"` row is the trap. The team wanted half of the window. The session compacts at 100,000, five times sooner, and there is no error. The `/autocompact` command and the `--autocompact` flag accept `500k`. The environment variable does not.

### 4.3 CLAUDE_AUTOCOMPACT_PCT_OVERRIDE

The env-vars page (checked on 2026-10-13):

> "Set the percentage (1-100) of the auto-compact window at which auto-compaction triggers. Use lower values like `50` to compact earlier; the variable can't raise the threshold, so values above the default percentage are ignored. It applies only in sessions that compact before the model's context limit... Applies to both main conversations and subagents"

| Auto-compact window | `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | Compaction near |
|---|---|---|
| 1,000,000 | `"50"` | 1,000,000 × 0.50 = 500,000 |
| 200,000 | `"50"` | 200,000 × 0.50 = 100,000 |
| 1,000,000 | `"99"` | No change. 99% is above the default point (about 96.7%). |

On a native-1M model the default point is about 967K, which is 96.7% of 1M. The docs do not state the default percentage, so treat 96.7 as an estimate.

### 4.4 Disabling compaction

The env-vars rows for `DISABLE_AUTO_COMPACT` and `DISABLE_COMPACT` could not be read when this lesson was checked. The CLI's own schema (Claude Code 2.1.296) describes both in one sentence: "Whether auto-compact is enabled on the worker (autoCompactEnabled setting + DISABLE_AUTO_COMPACT / DISABLE_COMPACT env; DISABLE_COMPACT also disables manual /compact)."

| Variable | Automatic compaction | Manual `/compact` |
|---|---|---|
| none | on | works |
| `DISABLE_AUTO_COMPACT` | off | works |
| `DISABLE_COMPACT` | off | off |

> [!trap] No compaction means a hard stop
> The model-config page describes the 200K case: "With auto-compaction off, sessions stop at the 200K boundary with the context-limit error instead of compacting." The same is true at any window: when the input reaches the window, the request fails with the context-limit error ("prompt is too long"). Use these variables for tests and for short, single-question runs, never for an open chat.

### 4.5 CLAUDE_CODE_DISABLE_1M_CONTEXT

The env-vars page: "Set to `1` to turn off 1M context window support. Claude Code removes `[1m]` model variants from the model picker and holds models that run with the 1M window by default to a 200K window... Useful for enterprise environments with compliance requirements."

The model-config page adds two consequences:

- "With auto-compaction on, sessions compact at the 200K boundary... Setting the auto-compact window above 200K doesn't lift the hold, because Claude Code caps that window at the model's context window."
- "With auto-compaction off, sessions stop at the 200K boundary with the context-limit error instead of compacting."

So `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` changes the window that Claude Code gives the model. `CLAUDE_CODE_AUTO_COMPACT_WINDOW=200000` changes only the compaction point. Both make sessions compact near 200K. The docs describe the hard stop at 200K only for the first one.

### 4.6 CLAUDE_CODE_MAX_OUTPUT_TOKENS

The env-vars page: "Set the maximum number of output tokens for most requests. Defaults and caps vary by model... Claude Code lowers a value above a model's cap to the cap. For a model ID Claude Code can't resolve to a model it knows, the default is 32000 and the cap is 128000. Increasing this value reduces the effective context window available before auto-compaction triggers."

The reason is section 4.2 of L1: input and output share the window, so space that is kept for output is not available for input. The docs do not give the formula. Raise this value only when answers are really cut by `max_tokens`, and expect earlier compaction when you do.

A related variable, `CLAUDE_CODE_MAX_CONTEXT_TOKENS`, corrects the window that Claude Code assumes for a gateway or custom model id. Its rules depend on how Claude Code resolves the id (model-config page, "Correct the window for a gateway or custom model ID"). For a Microsoft Foundry deployment, naming the deployment with the model id is simpler ([L1, section 4.3](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction)).

### 4.7 Manual compaction with /compact

The agent-loop page (checked on 2026-10-13): "Send `/compact` as a prompt string to trigger compaction on demand. Commands sent this way are ordinary SDK inputs." You can add a focus: `/compact focus on the open downtime question`. The costs page shows the same form for the CLI.

```python
# Between two tasks of the same session, with a ClaudeSDKClient
await client.query("/compact keep the plant ids and the date ranges that the user asked about")
async for message in client.receive_response():
    ...   # expect a SystemMessage with subtype "compact_boundary"
```

Three rules for manual compaction:

1. Confirm it by the `compact_boundary` message, with `trigger == "manual"`. Do not parse the result text.
2. `DISABLE_COMPACT` disables it.
3. `verbatim_prompts=True` disables it too. The option's docstring says that Claude Code then delivers the text "exactly as given: no `@path` file-mention expansion and no slash-command dispatch." So `/compact` reaches the model as plain text.

The agent-loop page also says that a CLAUDE.md section can tell the compactor what to keep: "The compactor reads your CLAUDE.md like any other context". This works only when `setting_sources` loads the project settings.

### 4.8 The PreCompact hook: archive or block

The `PreCompactHookInput` in `types.py` (SDK 0.2.165) has these fields: `hook_event_name` (`"PreCompact"`), `trigger` (`"manual"` or `"auto"`), `custom_instructions` (`str | None`), plus the base fields `session_id`, `transcript_path`, `cwd` and the optional `permission_mode`.

The hooks reference lists `PreCompact` among the events that take a top-level `decision: "block"` with a `reason`. For shell hooks it says that exit code 2 "Blocks compaction". [Hooks L1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks) covers hooks in general.

This sketch archives the session file before each compaction and blocks manual compaction. The two functions ran in the sandbox with a fake input and a small test file.

```python
import shutil, time
from pathlib import Path
import anyio
from claude_agent_sdk import ClaudeAgentOptions, HookMatcher

ARCHIVE = Path("/mnt/archive/transcripts")   # durable storage, not the temporary disk

async def archive_before_compact(input_data, tool_use_id, context):
    src = Path(input_data["transcript_path"])
    stamp = time.strftime("%Y%m%dT%H%M%S")
    dst = ARCHIVE / f"{input_data['session_id']}-{stamp}-{input_data['trigger']}.jsonl"
    await anyio.to_thread.run_sync(shutil.copyfile, src, dst)   # do not block the event loop
    return {}                                                   # {} = compaction continues

async def block_manual_compact(input_data, tool_use_id, context):
    if input_data["trigger"] == "manual":
        return {"decision": "block", "reason": "Manual compaction is disabled in this service."}
    return {}

options = ClaudeAgentOptions(hooks={"PreCompact": [
    HookMatcher(hooks=[archive_before_compact]),
    HookMatcher(hooks=[block_manual_compact]),
]})
```

Output of the sandbox test:

```text
{}
['S1-...-auto.jsonl']
{'decision': 'block', 'reason': 'Manual compaction is disabled in this service.'}
{}
```

> [!trap] Do not block automatic compaction
> A block on an `auto` trigger leaves a conversation that is too large. The next request can fail with the context-limit error, as in section 4.4. The docs do not describe this case for hooks, so treat it as a likely result, and block only `manual` triggers. Also return `{}`, not `None`: a callback that returns `None` makes the SDK send an error response ([Hooks L1](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks)).

Why archive at all, when the session file keeps the old lines? Because the session file is on the local disk of the CLI. On a container with a temporary disk it disappears at the next restart ([Sessions L3](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks)).

### 4.9 Why a team chooses a smaller window

A smaller window has three effects:

| Effect | Larger window (967K) | Smaller window (200K) |
|---|---|---|
| Input per call | Up to 960K tokens | Up to about 200K tokens |
| Number of compactions | Few | Many |
| Detail lost to summaries | Rarely, but at once | Often, a little each time |

> [!example] Worked example: a 120-message chat on Sonnet 5, in two windows
> A simple model, run as a Python script in the sandbox. The chat starts with 30,000 tokens (system prompt and tools). Each user message adds 25,000 tokens (question, tool results, answer) and 2,000 output tokens. A compaction reads the whole context, writes an 8,000-token summary, and leaves 60,000 tokens of context. Prices are those of L1, section 4.8. The sizes are assumptions. The prices are real (checked on 2026-10-13).
>
> | Case | Compactions | Average input per call | Peak input | Total cost |
> |---|---|---|---|---|
> | Window 1M, compaction near 967K, warm cache | 3 | 488,458 | 960,000 | USD 22.29 |
> | Window 200K, warm cache | 23 | 133,708 | 185,000 | USD 18.65 |
> | Window 1M, every message after a pause of more than 5 minutes | 3 | 488,458 | 960,000 | USD 156.37 |
> | Window 200K, every message after such a pause | 23 | 133,708 | 185,000 | USD 54.98 |
>
> How to read it:
>
> 1. With a warm cache, the smaller window saves only 16%: (22.29 − 18.65) / 22.29 = 0.163. Cache reads are cheap, and the 23 compactions cost summaries and cache rebuilds.
> 2. With cold calls, every call writes its whole input to the cache at USD 2.50 per million. The average input is 3.65 times smaller (488,458 / 133,708), so the bill is 2.8 times smaller (156.37 / 54.98).
> 3. One cold call at the peak costs 960,000 × 2.50 / 10⁶ = USD 2.40 in the large window. In the small window it costs 185,000 × 2.50 / 10⁶ = USD 0.46.

A chat service with human users has many pauses longer than 5 minutes. So the cold rows are closer to reality than the warm rows. Latency and quality point the same way: smaller inputs are faster ([Context engineering L4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length)) and give the model fewer chances to miss or confuse a fact ([Context engineering L5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects)).

> [!key] Choose the window from the workload
> A large window fits a task that must see many large documents at once. A chat with many short questions, long pauses and large tool results usually works better with a smaller window, plus small tool results. Measure both on your own traffic: log `compact_boundary`, `duration_api_ms` and the cost of each answer.

### 4.10 Production view

| Concern | What to do |
|---|---|
| Configuration | Set the variables in `options.env` as strings of plain digits. Log the effective window at start: `get_context_usage()["maxTokens"]` or `model_usage[...]["contextWindow"]`. |
| Cost | Price the cold case. A smaller window helps most when users pause longer than the cache lifetime. |
| Reliability | Never disable compaction for open chats. Never block an automatic compaction. |
| Audit | Archive `transcript_path` in a `PreCompact` hook to durable storage. |
| Quality | Compact at task boundaries with a focused `/compact`, and keep tool results small. |
| Tests | Use `DISABLE_COMPACT` in tests that compare exact conversations, with short inputs. |

## 5. Code

These exercises go in `claude-agent-sdk/14-compaction-controls.ipynb`.

**Exercise 2.1: the effective window.** Write `effective_window(env_value, model_window)` that follows the documented rules and the `parseInt` behavior of section 4.2. Return `None` for a value with no leading digits.

Acceptance tests:

- The five rows of the worked example in section 4.2 give the values in the table.
- `effective_window("abc", 1_000_000)` returns `None`.
- `effective_window("  300000 ", 1_000_000)` returns `300000`.

**Exercise 2.2: reproduce the window decision.** Build the chat model of section 4.9 from its description. Do not copy any code.

Acceptance tests:

- Your four totals are within 1% of USD 22.29, 18.65, 156.37 and 54.98.
- Your compaction counts are 3 and 23.
- Add a row for a window of 500,000 and write one sentence about where it sits.

**Exercise 2.3: an archive hook.** Write a `PreCompact` hook that copies the session file to an archive folder. It also writes one JSON line per compaction to an index file: session id, trigger, time, file size.

Acceptance tests:

- A unit test calls the hook with a fake input and a temporary file, and finds the copy and the index line.
- A live run with `"/compact"` as the prompt creates a copy whose name contains `manual`.
- The hook returns `{}` in both cases.

**Exercise 2.4: the slash-command trap.** Resume a session that holds a few exchanges. Send `"/compact"` once with `verbatim_prompts=False`. Fork the same session and send `"/compact"` with `verbatim_prompts=True`.

Acceptance test: you see a `compact_boundary` message only in the first run. Explain the second run in one sentence.

## 6. Common mistakes

1. **Writing `"500k"` in `CLAUDE_CODE_AUTO_COMPACT_WINDOW`.** It reads as 500 and clamps to 100,000. Write `"500000"`.
2. **Expecting a percentage above the default to delay compaction.** `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` can only lower the point.
3. **Disabling compaction in production chats.** The chat later fails with "prompt is too long".
4. **Blocking automatic compaction in a `PreCompact` hook.** Block only manual compaction, if at all.
5. **Sending `/compact` with `verbatim_prompts=True`.** It arrives as plain text, and nothing is compacted.
6. **Choosing the window from warm-cache prices only.** Cold calls dominate a chat with human pauses.

## 7. One-minute explanation

Auto-compaction is controlled by environment variables of the CLI, which you pass from Python in `options.env` as strings. `CLAUDE_CODE_AUTO_COMPACT_WINDOW` sets the window from 100,000 to 1,000,000 tokens, but only as plain digits: `"500k"` reads as 500 and clamps to 100,000. `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` lowers the point as a percentage of that window and cannot raise it. `DISABLE_AUTO_COMPACT` stops automatic compaction, `DISABLE_COMPACT` also stops manual `/compact`, and without compaction a long chat ends with a context-limit error. `CLAUDE_CODE_DISABLE_1M_CONTEXT` holds native-1M models to 200K, and a larger `CLAUDE_CODE_MAX_OUTPUT_TOKENS` moves the compaction point earlier. You compact on purpose by sending `/compact` as the prompt, and a `PreCompact` hook can archive the transcript first. A team often chooses a smaller window because a chat with human pauses makes many cold calls. A cold call pays the cache-write price for its whole input.

## 8. Check questions

```check
{
  "question": "A team sets CLAUDE_CODE_AUTO_COMPACT_WINDOW = \"300k\" for Sonnet 5. At what size do sessions compact, and why?",
  "hint": "How does the CLI read the value?",
  "answer": "Near 100,000 tokens. The variable accepts plain digits only. The parser reads \"300k\" as 300, and the CLI clamps it to the 100,000 minimum. The fix is \"300000\"."
}
```

```check
{
  "question": "What is the difference between DISABLE_AUTO_COMPACT and DISABLE_COMPACT? What happens to a long chat under either one?",
  "answer": "DISABLE_AUTO_COMPACT stops automatic compaction but still allows manual /compact. DISABLE_COMPACT stops both. Under either one, a long chat grows until the input reaches the window, and then the request fails with the context-limit error (prompt is too long)."
}
```

```check
{
  "question": "Use the table of section 4.9. Why does the smaller window save 16% with a warm cache but about 65% with cold calls?",
  "answer": "With a warm cache, most input tokens are cache reads at USD 0.20 per million, so a large context is cheap, and the smaller window pays for 23 compactions. With cold calls, every input token is written at USD 2.50 per million, so the cost is almost proportional to the average input, which is 3.65 times smaller in the 200K window. 54.98 / 156.37 = 0.35, so the saving is about 65%."
}
```

```check
{
  "question": "Write the return value of a PreCompact hook that lets automatic compaction continue but stops manual compaction, and say why it should not stop automatic compaction.",
  "answer": "Return {\"decision\": \"block\", \"reason\": \"...\"} when input_data[\"trigger\"] == \"manual\", and {} otherwise. Blocking an automatic compaction leaves a conversation that is too large for the window, so the next request is likely to fail with the context-limit error."
}
```

## 9. Links

- Previous: [L1: Window size and auto-compaction](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction)
- Next in the priority path: [Errors and cost L1: SDK errors](/notes/ai/claude-agent-sdk/07-errors-and-cost/l1-sdk-errors)
- Where `options.env` goes: [Foundations L1: What the SDK is](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is)
- Hook mechanics: [Hooks L1: Hooks](/notes/ai/claude-agent-sdk/08-hooks-and-subagents/l1-hooks)
- Cache prices: [Context engineering L7: Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)
- [Glossary](/notes/ai/claude-agent-sdk/glossary)
