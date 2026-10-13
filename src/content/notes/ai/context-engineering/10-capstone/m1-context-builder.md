---
title: "M1: Context builder"
order: 2
summary: "A provider-neutral message model, adapters to the Anthropic and OpenAI formats, a context builder with six slots, a token budget with an output reserve, a cache-friendly order, token counting with calibration, a log of every call, and the ResearchSession skeleton."
status: not-started
tags: [capstone, context-builder, token-budget, adapters, prompt-caching]
---

## 1. Goal

M1 builds the one function that every later milestone calls: **assemble the request for the next model call**. In production terms, this is where the six elements of context become one request. It is also where the system can prove three things on every call:

1. The request fits the budget, with room for the full output.
2. Every token belongs to a named slot, so it can be counted, logged and audited.
3. The stable part of the request comes first, so that prompt caching can reuse it.

M1 also builds the `ResearchSession` skeleton from the INITIAL.md of M0. After M1, the session answers questions with no retrieval, and every call is logged.

## 2. Builds on

- [Lesson 1.3: The chat API call](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call): stateless calls, roles, stop reasons, the format adapter of exercise 3.4.
- [Lesson 1.2: Tokens and tokenizers](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers): `tiktoken` is only an estimate for Claude.
- [Lesson 1.7: Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching): exact prefix, breakpoints, minimum length.
- [Lesson 2.3: The six elements of context](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context): the slots and where each one goes in a request.
- [Lesson 3.3: Structure, delimiters and order](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order): tags around data, cache-friendly order.
- [Lesson 5.6: Retrieval budgets and chunk order](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order): pack by rank, skip and do not stop.
- [Lesson 6.2: The tool-call loop](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop): the message shapes of tool calls and results.
- [Lesson 7.6: Token budgets](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets): ceilings, and a reserve of at least `max_tokens`.
- [Lesson 9.8: Observability, cost and latency](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency): what to record on every call.

## 3. Spec

### 3.1 The neutral message model

Module `src/research_assistant/llm/messages.py`. The application keeps all history in this format. Only the adapters know a provider format (lesson 1.3).

```python
Role = Literal["user", "assistant"]

@dataclass(frozen=True)
class TextBlock:
    """Plain text from the user or the model."""
    text: str

@dataclass(frozen=True)
class ToolCall:
    """A request from the model to run one tool. `id` links the call to its result."""
    id: str
    name: str
    arguments: dict[str, Any]

@dataclass(frozen=True)
class ToolResult:
    """The application's answer to one ToolCall. It always travels in a user message."""
    call_id: str
    content: str
    is_error: bool = False

Block = TextBlock | ToolCall | ToolResult

@dataclass(frozen=True)
class Message:
    """One entry of the history. System text is never a Message."""
    role: Role
    blocks: tuple[Block, ...]
    meta: Mapping[str, str] = field(default_factory=dict)   # for example {"sources": "S1,S3"}

@dataclass(frozen=True)
class SystemPart:
    """One block of system text. Stable parts form the cacheable prefix."""
    name: str          # "rules", "session_state" or "summary"
    text: str
    stable: bool

@dataclass(frozen=True)
class ToolSpec:
    """A provider-neutral tool definition."""
    name: str
    description: str
    input_schema: dict[str, Any]   # JSON Schema of the arguments
```

### 3.2 The adapters

Module `src/research_assistant/llm/adapters.py`. The field names below were checked on 2026-10-12 (lessons 1.3 and 6.2).

```python
def to_anthropic(ctx: AssembledContext, *, model: str, max_tokens: int) -> dict[str, Any]:
    """Return a Messages API request body.
    - `system` is a list of text blocks in slot order. A `cache_control` marker
      ends the last stable part. No message has the role `system`.
    - `tools` holds name, description and input_schema for each ToolSpec.
    - ToolCall becomes a `tool_use` block (id, name, input) in an assistant message.
    - ToolResult becomes a `tool_result` block (tool_use_id, content, is_error)
      in a user message. Tool results come first in their user message, and the
      results of parallel calls share one user message.
    """
    ...

def to_openai_chat(ctx: AssembledContext, *, model: str, max_output_tokens: int) -> dict[str, Any]:
    """Return a Chat Completions request body.
    - The first message has the role `developer` and holds all system parts in order.
    - `tools` holds {"type": "function", "function": {name, description, parameters}}.
    - ToolCall becomes an assistant message with `tool_calls`. Each has id,
      type "function", and function.name and function.arguments (a JSON string).
    - ToolResult becomes a message with the role `tool` and `tool_call_id`.
    - Use the output-limit field that the current OpenAI docs name.
    """
    ...

def from_anthropic(body: Mapping[str, Any]) -> LLMResponse: ...
def from_openai_chat(body: Mapping[str, Any]) -> LLMResponse: ...
```

### 3.3 The client and the usage record

Module `src/research_assistant/llm/client.py`. It is the only module that imports a provider SDK.

```python
StopReason = Literal["end_turn", "max_tokens", "tool_use", "refusal",
                     "context_exceeded", "other"]

@dataclass(frozen=True)
class Usage:
    input_tokens: int                 # uncached input, as the provider reports it
    output_tokens: int
    cache_read_input_tokens: int = 0
    cache_write_input_tokens: int = 0

    def total_input(self) -> int:
        """All input that the model read: uncached + cache read + cache write."""
        ...

@dataclass(frozen=True)
class LLMResponse:
    message: Message
    stop_reason: StopReason
    usage: Usage
    raw: Mapping[str, Any]            # the provider's response, kept for audits

class LLMClient(Protocol):
    provider: str                     # "anthropic", "openai" or "fake"

    def complete(self, ctx: AssembledContext, *, model: str, max_tokens: int,
                 tool_choice: Literal["auto", "none"] = "auto") -> LLMResponse:
        """Send one request. Retry rate limits, server errors and timeouts with
        exponential backoff and jitter, at most 3 attempts. Then raise
        LLMUnavailableError. Never retry a 400 error."""
        ...

class FakeLLMClient:
    """Returns scripted responses in order and records every request.
    Its usage numbers come from the token counter, so budget tests are exact."""
    def __init__(self, script: Sequence[LLMResponse | Exception], counter: TokenCounter) -> None: ...
```

Map the seven Anthropic stop reasons of lesson 1.3 to `StopReason`. Map OpenAI's values from its current docs. Do not offer `tool_choice` values that force a tool. On Claude Opus 5.5 and Sonnet 5.5, `any` and `tool` return a 400 error (checked on 2026-10-12).

### 3.4 Token counting

Module `src/research_assistant/llm/tokens.py`.

```python
class TokenCounter(Protocol):
    name: str
    def count_text(self, text: str) -> int: ...
    def count_request(self, system: Sequence[SystemPart], tools: Sequence[ToolSpec],
                      messages: Sequence[Message]) -> int:
        """Estimated input tokens of the full request, including message overhead."""
        ...

class TiktokenCounter:
    """Local estimate with o200k_base. Free and offline, but not a Claude count."""

class Calibrator:
    """Learns the ratio between the provider's usage and the local estimate."""
    def observe(self, estimated: int, actual: int) -> None: ...
    def factor(self) -> float:
        """The 95th percentile of actual / estimated over the last 50 calls.
        1.0 before 10 observations."""
        ...
```

The budget uses $\lceil c \cdot \hat{n} \rceil$, where $\hat{n}$ is the local estimate and $c$ is the calibration factor. The provider can count tokens that your text does not show, for example the formatting of tool definitions. The calibration absorbs them.

### 3.5 Slots, budget and builder

Modules `src/research_assistant/context/budget.py` and `context/builder.py`. The six slots follow lesson 2.3. Tool results count in the history slot, and the log reports them as a separate number.

```python
class Slot(StrEnum):
    SYSTEM = "system"         # system rules
    TOOLS = "tools"           # tool definitions only
    MEMORY = "memory"         # session state, pinned facts, summary, retrieved memories
    HISTORY = "history"       # earlier turns, tool calls and tool results
    KNOWLEDGE = "knowledge"   # retrieved chunks for this call
    USER = "user"             # the new question

@dataclass(frozen=True)
class Budget:
    total: int                     # input plus output reserve
    max_output: int                # sent as max_tokens
    safety: int                    # buffer for estimation error
    ceilings: Mapping[Slot, int]   # input ceiling of each slot

    def reserve(self) -> int:
        """max_output + safety."""
        ...
    def input_allowance(self) -> int:
        """total - reserve()."""
        ...
    def validate(self) -> None:
        """Raise BudgetConfigError if a ceiling is negative, if the ceilings sum to
        more than input_allowance(), or if reserve() >= total."""
        ...

@dataclass(frozen=True)
class KnowledgeItem:
    source_id: str      # "S1", "S2", ... from the session's SourceRegistry
    chunk_id: str
    doc_id: str
    section: str
    updated: str | None
    text: str
    rank: int

@dataclass(frozen=True)
class MemoryItem:
    key: str
    text: str
    score: float
    pinned: bool = False

@dataclass(frozen=True)
class DropRecord:
    slot: Slot
    item_id: str
    tokens: int
    reason: str

@dataclass(frozen=True)
class AssembledContext:
    system: tuple[SystemPart, ...]
    tools: tuple[ToolSpec, ...]
    messages: tuple[Message, ...]
    slot_tokens: Mapping[Slot, int]
    tool_result_tokens: int          # the part of HISTORY that is tool results
    input_tokens: int                # calibrated estimate of the whole request
    budget: Budget
    dropped: tuple[DropRecord, ...]
    context_version: str             # short hash of rules, tool specs and builder settings

class ContextBuilder:
    def __init__(self, budget: Budget, counter: TokenCounter, calibrator: Calibrator, *,
                 chunk_order: Literal["rank", "edges"] = "rank") -> None: ...

    def build(self, *, rules: str, session_state: str, summary: str | None,
              tools: Sequence[ToolSpec], memories: Sequence[MemoryItem],
              history: Sequence[Message], knowledge: Sequence[KnowledgeItem],
              question: str) -> AssembledContext:
        """Assemble one request in cache-friendly order and enforce the budget.
        SYSTEM or TOOLS over the ceiling: raise BudgetConfigError (a deploy bug).
        USER over the ceiling: raise InputTooLongError (tell the user).
        KNOWLEDGE: pack by rank. Skip an item that does not fit, then try the next.
        MEMORY: pinned items first, then by score. Skip what does not fit.
        HISTORY: drop the oldest whole turns at a safe split point. M4 replaces
        this with clearing and compaction.
        Record every removal in `dropped`. Guarantee input_tokens + reserve <= total."""
        ...

class SourceRegistry:
    """Gives each chunk_id one stable source ID ("S1", "S2", ...) for the whole session."""
    def source_id(self, chunk_id: str) -> str: ...
```

### 3.6 The order of the request

The order follows lessons 1.7 and 3.3: content that changes least goes first.

| Position | Content | Field (Anthropic) | Changes |
|---|---|---|---|
| 1 | Tool definitions | `tools` | On a deploy |
| 2 | System rules, ending with the cache breakpoint | `system`, part 1 | On a deploy |
| 3 | Session state: topic, pinned facts | `system`, part 2 | Once per session |
| 4 | Rolling summary (from M4) | `system`, part 3 | At each compaction |
| 5 | History: earlier turns, tool pairs | `messages` | One turn per call |
| 6 | Retrieved memories, sources, then the question | last `user` message | Every call |

The last user message has three tagged blocks, with the question last:

```text
<memories>
- [M2] (2026-09-30) The user wants sources from 2025 or later.
</memories>
<sources>
<source id="S1" doc="05-retrieval-quality/l2-hybrid-search-and-rrf" section="4.3 Reciprocal Rank Fusion" updated="2026-10-12">
...chunk text...
</source>
</sources>
<question>
Which constant does RRF use, and what does it change?
</question>
```

After the turn, the history keeps the question and the list of source IDs in `meta`, not the source text. The source text returns only through a new retrieval or a tool call.

### 3.7 Configuration and constraints

Module `src/research_assistant/config.py` reads environment variables. No other module reads `os.environ`.

| Variable | Default | Meaning |
|---|---|---|
| `RA_PROVIDER` | `fake` | `fake`, `anthropic` or `openai` |
| `RA_MODEL` | none | The model ID. Required unless the provider is `fake`. |
| `RA_CONTEXT_BUDGET` | 32000 | $B_{tot}$: input plus the output reserve |
| `RA_MAX_OUTPUT_TOKENS` | 2000 | $m_{out}$, sent as `max_tokens` |
| `RA_BUDGET_SAFETY` | 1000 | $\beta$, the buffer for estimation error |
| `RA_CHUNK_ORDER` | `rank` | `rank` or `edges` (lesson 5.6) |
| `RA_DATA_DIR` | `./data` | Root of the corpus, index, memory, summaries and traces |

Default ceilings, in tokens: SYSTEM 2,000, TOOLS 1,000, MEMORY 2,000, HISTORY 17,000, KNOWLEDGE 6,000, USER 1,000.

> [!example] Worked example: the default budget
> - Reserve: $R = m_{out} + \beta = 2{,}000 + 1{,}000 = 3{,}000$ tokens.
> - Input allowance: $B_{in} = B_{tot} - R = 32{,}000 - 3{,}000 = 29{,}000$ tokens.
> - Sum of the ceilings: $2{,}000 + 1{,}000 + 2{,}000 + 17{,}000 + 6{,}000 + 1{,}000 = 29{,}000$. The budget is valid.
>
> Why 32,000 tokens on models with a 1M window? Lesson 1.5 shows accuracy losses far below the window limit. A short input is also cheaper and faster. The value is a starting point. M6 measures whether a larger budget helps, and M7 defends the final value.

> [!example] Worked example: skip, do not stop
> The KNOWLEDGE ceiling is 6,000 tokens. Four chunks arrive in rank order with 3,000, 4,000, 1,500 and 1,000 tokens.
>
> - Rank 1: $3{,}000 \le 6{,}000$, packed. Used: 3,000.
> - Rank 2: $3{,}000 + 4{,}000 = 7{,}000 > 6{,}000$, skipped and recorded in `dropped`.
> - Rank 3: $3{,}000 + 1{,}500 = 4{,}500$, packed.
> - Rank 4: $4{,}500 + 1{,}000 = 5{,}500$, packed.
>
> A builder that stops at the first chunk that does not fit sends only 3,000 tokens and loses ranks 3 and 4.

Further constraints:

1. The rules text must not contain a date, a time, a session ID or a user name. A test enforces it, because such a value breaks the cache on every call (lesson 1.7).
2. The cached prefix (tools plus rules) must reach the minimum cacheable length: 512 tokens on Claude Sonnet 5.5 and Haiku 5.5 (checked on 2026-10-12). A shorter prefix is not cached, and there is no error.
3. The call log writes one JSON line per model call to `data/traces/calls.jsonl`. The full request body goes to a separate file, because it holds user text. Both stay out of git.

The call log line:

```json
{"ts": "2026-10-12T09:14:03Z", "session_id": "rs-7f3a", "call_id": "c-0004",
 "context_version": "a91c04e2b7d1", "provider": "anthropic", "model": "<model id>",
 "max_tokens": 2000, "slot_tokens": {"system": 1450, "tools": 610, "memory": 320,
 "history": 5200, "knowledge": 1830, "user": 40}, "tool_result_tokens": 1900,
 "estimated_input_tokens": 9450, "calibration_factor": 1.08,
 "usage": {"input_tokens": 410, "output_tokens": 380, "cache_read_input_tokens": 8900,
 "cache_write_input_tokens": 0}, "stop_reason": "end_turn", "latency_ms": 2310,
 "dropped": [], "request_file": "data/traces/requests/c-0004.json"}
```

The numbers in this example are illustrative. The field names are the contract.

### 3.8 The ResearchSession skeleton

Module `src/research_assistant/session.py`. It implements the interface of M0, section 3.4, with these limits for now:

- `__init__` validates the inputs and raises the errors of the M0 edge-case table. Document loading arrives in M2.
- `ask` builds the context with an empty KNOWLEDGE slot, calls the model once, and returns an `Answer`.
- `compress`, `save_summary` and `close` raise `NotImplementedError` until M4 and M5.

```python
@dataclass(frozen=True)
class Answer:
    text: str
    cited_sources: tuple[str, ...]
    invalid_citations: tuple[str, ...]
    truncated: bool
    refused: bool
    usage: Usage
    call_ids: tuple[str, ...]
```

## 4. Acceptance tests

1. `test_budget_default`: the default budget gives a reserve of 3,000 and an input allowance of 29,000. Ceilings that sum to 29,001 raise `BudgetConfigError`.
2. `test_anthropic_shape`: the body has a top-level `system` list and no message with the role `system`. The last stable part carries `cache_control`.
3. `test_openai_shape`: the first message has the role `developer`.
4. `test_tool_pair_round_trip`: a ToolCall and its ToolResult keep the same ID in both formats. On Anthropic, the `tool_result` block comes first in its user message. On OpenAI, `json.loads(arguments)` returns the original dictionary.
5. `test_prefix_is_stable`: two builds that differ only in the question give identical serialized `tools` and `system`, and identical messages up to the last user message.
6. `test_rules_have_no_volatile_values`: the rules text matches no date, time or ID pattern.
7. `test_budget_never_exceeded`: 200 random inputs with large histories, chunks and memories. Every result satisfies `input_tokens + reserve <= total`, and `dropped` explains every removed item.
8. `test_knowledge_skip_not_stop`: the four chunks of the worked example pack ranks 1, 3 and 4 and drop rank 2.
9. `test_history_drop_keeps_pairs`: after the builder drops old turns, every `ToolResult` has its `ToolCall` and the kept part starts with a user text message.
10. `test_calibration_factor`: 50 pairs with the ratios 1.00, 1.01, up to 1.49 give a factor of 1.4655 (the default linear percentile of NumPy). Fewer than 10 pairs give 1.0.
11. `test_call_log`: each call writes one line with every field of section 3.7. The six slot numbers sum to the estimated input, minus the documented per-message overhead.
12. `test_session_edge_cases`: an empty list raises `EmptyCorpusError`. Two missing paths appear in one `DocumentNotFoundError` message.
13. `test_failed_call_not_committed`: when the fake client raises `LLMUnavailableError`, the history is unchanged.
14. `test_max_tokens_truncated`: a scripted `max_tokens` stop gives `Answer.truncated == True`.
15. (optional, costs money) `test_live_cache_read`: two real calls with the same prefix within 5 minutes. The second reports `cache_read_input_tokens > 0`.

## 5. Measurements to record

Record these in `notebooks/capstone-m1.ipynb`:

- **Slot table per call** for a 10-question session. Columns: call number, the six slot counts and tool-result tokens. Then estimated input, actual input from `usage` and their ratio. Then cache read, cache write, stop reason and latency.
- **Calibration curve:** the ratio of actual to estimated input for each call, and the factor after each call.
- **Cacheable share:** tokens before the last breakpoint divided by the total input, for each call. Compare it with the cache hit rate that the provider reports.
- **Adapter size:** the same context serialized for Anthropic and for OpenAI, with the input tokens that each provider reports.

## 6. Production review

This works. Would you deploy it?

| Concern | Check before you deploy | Evidence to show |
|---|---|---|
| Latency | Token counting is local and adds no network call to a request. | Builder time per call, p95 |
| Cost | The cacheable prefix is stable across calls and above the minimum length. | Cacheable share and cache hit rate per call |
| Reliability | Every stop reason has a branch. Retries cover only safe errors. A failed call changes no state. | Tests 13 and 14, and the retry log |
| Security | No key in any log. Request files with user text stay out of git, and they have a retention rule. | A secret scan of `data/traces/`, the `.gitignore` |
| Observability | Every call has a context version, the slot counts and the provider's raw usage. | Three log lines from a real session |

## 7. Stretch goals

1. Add a Gemini adapter (lesson 1.3: `system_instruction`, the roles `user` and `model`). The same tests must pass.
2. Add an adapter for the OpenAI Responses API. Remember the trap of lesson 1.3: `instructions` apply only to the current request.
3. Add a CLI command `context` that prints the slot table of the next call as a bar. Draw it relative to the total budget, not to the tokens in use (lesson 9.2, section 4.7).
4. Replace the random inputs of test 7 with property-based tests that search for a request that breaks the budget.

## 8. Check questions

```check
{
  "question": "You raise RA_MAX_OUTPUT_TOKENS to 4,000 and keep the other defaults. What is the input allowance, and is the budget still valid? What would you change?",
  "hint": "R = m_out + β. The ceilings still sum to 29,000.",
  "answer": "R = 4,000 + 1,000 = 5,000, so B_in = 32,000 − 5,000 = 27,000. The ceilings sum to 29,000, which is more than 27,000, so validate() raises BudgetConfigError. Lower the HISTORY ceiling from 17,000 to 15,000, or raise the total budget to 34,000, and record the reason."
}
```

```check
{
  "question": "Why do the sources for this call go into the last user message and not into the system prompt?",
  "answer": "They change on every call. In the system prompt, they would change the prefix near the top, so the cache would miss for everything after them: the summary and the whole history. In the last user message, the tools, rules, session state and history stay a stable prefix. Lesson 5.6 also supports the layout: long material before the question, and the question last."
}
```

```check
{
  "question": "Each turn retrieves 5 chunks of about 250 tokens with their labels. How many history tokens do 10 turns add if the history keeps the source text? What share of the 17,000-token history ceiling is that? What does the spec do instead?",
  "answer": "5 × 250 × 10 = 12,500 tokens, which is about 73.5% of 17,000, before any question, answer or tool result. The spec keeps only the question and the source IDs in the history. The text returns only through a new retrieval or a tool call, so the history grows by the questions and answers, not by old sources."
}
```

## 9. Links

- Previous: [M0: Scaffold](/notes/ai/context-engineering/10-capstone/m0-scaffold)
- Next: [M2: Retrieval](/notes/ai/context-engineering/10-capstone/m2-retrieval)
- Overview: [Capstone overview](/notes/ai/context-engineering/10-capstone/capstone-overview)
- [Lesson 1.3: The chat API call](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call)
- [Lesson 1.7: Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)
- [Lesson 7.6: Token budgets](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets)
- [Glossary](/notes/ai/context-engineering/glossary)
