---
title: "L3: trim_messages and RemoveMessage"
order: 3
summary: "trim_messages returns a shorter copy of a message list with no model call. RemoveMessage tells the add_messages reducer to delete a message from the state by id. Every trim_messages parameter with real runs, where each call is transient or persistent, the exact reducer semantics including the ValueError for an unknown id, and the safe-cut rule for tool pairs."
status: not-started
tags: [langchain, trim-messages, remove-message, add-messages, reducers, context-management]
---

## 1. The question this idea answers

Summarization costs a model call. Context editing clears only tool results. Often you want something simpler: keep the newest part of the history that fits a budget, and drop the rest. LangChain gives you two separate tools for this:

1. `trim_messages`, a pure function. It takes a list and returns a shorter list. It changes nothing else.
2. `RemoveMessage`, an instruction. It means nothing alone. When a node returns it, the `add_messages` reducer deletes a message from the state.

Where you call them decides what happens. Inside `wrap_model_call`, trimming is transient. In `before_model` with `RemoveMessage`, the deletion is persistent. In both places, a bad cut can separate a tool call from its result and make the next request invalid. This lesson runs every parameter and shows the exact rules.

## 2. Mental model

> [!analogy] A photocopier and an archive clerk
> `trim_messages` is a photocopier. You give it the folder and a page budget, and it returns a copy of the last pages that fit. The folder itself is unchanged.
>
> `RemoveMessage` is a slip that you give to the archive clerk: "remove page 17". The clerk is the `add_messages` reducer. A slip that says `REMOVE_ALL_MESSAGES` means "empty the folder, then file the pages that follow this slip".
>
> **Where it stops working:** a photocopier does not care what the pages say. `trim_messages` with no options will happily start the copy at a tool result whose call it did not copy. And the clerk is strict: a slip for a page that is not in the folder causes an error, not a shrug.

## 3. Terms

| Term | Plain meaning |
|---|---|
| `trim_messages` | A function in `langchain_core.messages` that returns the messages that fit a token budget. |
| `max_tokens` | The budget of `trim_messages`, in the unit of the token counter. |
| `token_counter` | The function that measures the list: `len` counts messages, `"approximate"` estimates tokens, a chat model uses its own counter. |
| `strategy` | `"last"` keeps the newest messages. `"first"` keeps the oldest messages. |
| `start_on` | With `"last"`: drop messages from the front of the result until the first one has this type. |
| `end_on` | Drop messages from the end until the last one has this type. |
| `include_system` | With `"last"`: keep a `SystemMessage` at index 0 and count it against the budget. |
| `allow_partial` | Allow a message to be cut inside its text, at a split point. |
| `text_splitter` | The function that splits text for `allow_partial`. The default splits on newlines. |
| `RemoveMessage` | A message of type `"remove"` that names an id. The reducer deletes that message. |
| `REMOVE_ALL_MESSAGES` | The id `"__remove_all__"`. The reducer drops every message before this `RemoveMessage`. |
| `add_messages` | The reducer of the `messages` key. It merges a list of updates into the state by message id. |
| orphan | A tool result whose tool call is not in the list, or a tool call with no result. |
| safe cut | A cut at the start of a real user message, so that no tool pair is split. |

## 4. Method and math

### 4.1 The signature

Condensed from the installed source (`langchain_core/messages/utils.py`, langchain-core 1.6.10, checked on 2026-10-13). The comments are added:

```python
def trim_messages(
    messages, *, max_tokens: int,
    token_counter,                 # callable, chat model, or "approximate"
    strategy: Literal["first", "last"] = "last",
    allow_partial: bool = False,
    end_on=None, start_on=None,    # a type name, a class, or a list of them
    include_system: bool = False,
    text_splitter=None,
) -> list[BaseMessage]
```

The docstring recommends a valid chat history: start with a `HumanMessage`, or a `SystemMessage` and then a `HumanMessage`. To achieve it, it says: "set `start_on='human'`". It also recommends `strategy='last'` and `include_system=True`.

### 4.2 Runs with token_counter=len

With `token_counter=len`, the unit is "messages", so the cuts are easy to read. The test list has ten messages:

```text
S:s H:h1 A:a1 T:t1 A:a2 H:h3 A:a3 T:t2 A:a4 H:h5
```

`a1` calls `c1` and `t1` answers it. `a3` calls `c2` and `t2` answers it. Real results with `strategy="last"`:

| Arguments | Result | Valid? |
|---|---|---|
| `max_tokens=3` | `T:t2 A:a4 H:h5` | No. `t2` is an orphan. |
| `max_tokens=3, start_on="human"` | `H:h5` | Yes, but only one message is left. |
| `max_tokens=4` | `A:a3 T:t2 A:a4 H:h5` | Pairs are valid, but the list starts with an AI message. |
| `max_tokens=5` | `H:h3 A:a3 T:t2 A:a4 H:h5` | Yes. |
| `max_tokens=5, start_on="human", include_system=True` | `S:s H:h5` | Yes, but the system message uses 1 of the 5. |
| `max_tokens=6, start_on="human", include_system=True` | `S:s H:h3 A:a3 T:t2 A:a4 H:h5` | Yes. |

How `start_on` works in the source: `strategy="last"` reverses the list, keeps what fits, and then applies `start_on` as an `end_on` on the reversed list. So it removes messages from the front of the result until the first one has the wanted type. It never adds messages back.

> [!trap] start_on can drop most of the budget
> In row 5, the budget allowed `A:a3 T:t2 A:a4 H:h5` after the system message. `start_on="human"` then removed three of them. The result fits the budget easily, but it lost the previous answer and its data. Check the result length, not only the budget.

### 4.3 strategy="first" and end_on

`strategy="first"` keeps the oldest messages. It is useful for a fixed prefix, not for chat history. Real results:

```text
{'max_tokens': 3}: S:s H:h1 A:a1
{'max_tokens': 3, 'end_on': 'human'}: S:s H:h1
{'max_tokens': 4, 'end_on': ('human', 'ai')}: S:s H:h1 A:a1
```

The first and third rows end on `A:a1`, a tool call with no result: an orphan call. Only `end_on="human"` gave a valid list. `start_on` and `include_system` are allowed only with `"last"`:

```text
ValueError: start_on parameter is only valid with strategy='last'
```

### 4.4 Runs with token_counter="approximate"

The string `"approximate"` selects `count_tokens_approximately`: $\lceil \text{characters} / 4 \rceil + 3$ per message ([L1, section 4.5](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware)). The counts of the test list:

| s | h1 | a1 | t1 | a2 | h3 | a3 | t2 | a4 | h5 | total |
|---|---|---|---|---|---|---|---|---|---|---|
| 12 | 9 | 25 | 6 | 8 | 7 | 25 | 6 | 8 | 8 | 114 |

> [!example] Worked example: max_tokens=60, start_on="human", include_system=True
> 1. The system message is set aside: 60 − 12 = 48 tokens remain.
> 2. From the end: h5 8 (total 8), a4 8 (16), t2 6 (22), a3 25 (47).
> 3. h3 7 would give 54 > 48, so the kept part is `a3 t2 a4 h5`.
> 4. `start_on="human"` removes `a3`, `t2` and `a4` from the front.
> 5. Result: `S:s H:h5`, 12 + 8 = **20** tokens. The run printed `S:s H:h5 -> 20`.

### 4.5 allow_partial

With `allow_partial=True` and `strategy="last"`, a message that does not fit can keep its last lines. The default splitter cuts at newlines. The test message was `"line 1\nline 2\nline 3\nline 4\nline 5"`, 13 approximate tokens:

```text
max_tokens=8: ['line 4\nline 5']
max_tokens=10: ['line 3\nline 4\nline 5']
max_tokens=12: ['line 2\nline 3\nline 4\nline 5']
allow_partial=False, max_tokens=10: []
```

> [!trap] trim_messages can return an empty list
> When the newest message alone is larger than `max_tokens` and `allow_partial` is false, the result is `[]`. A model call with no messages fails. Check for an empty result, or make sure that the budget is larger than any single message.

The test also confirmed that `trim_messages` does not change its input: the list compared equal before and after a call. It is a pure function.

### 4.6 Where you call it decides the kind of change

The same trim, called in two places of a `create_agent` agent, with a checkpointer (real output):

```python
@wrap_model_call
def trim_view(request, handler):
    kept = trim_messages(request.messages, token_counter=len, max_tokens=5,
                         strategy="last", start_on="human")
    return handler(request.override(messages=kept))

@before_model
def trim_state(state, runtime):
    kept = trim_messages(state["messages"], token_counter=len, max_tokens=5,
                         strategy="last", start_on="human")
    if len(kept) == len(state["messages"]):
        return None
    return {"messages": [RemoveMessage(id=REMOVE_ALL_MESSAGES), *kept]}
```

```text
wrap_model_call: model saw    S:None H:h3 A:a3 T:t2 A:a4 H:h5
wrap_model_call: state after  H:h1 A:a1 T:t1 A:a2 H:h3 A:a3 T:t2 A:a4 H:h5 A:ans
before_model: model saw       S:None H:h3 A:a3 T:t2 A:a4 H:h5
before_model: state after     H:h3 A:a3 T:t2 A:a4 H:h5 A:ans
```

The model saw the same input in both cases. The state differs: the wrap-style trim left all messages in place (transient), and the node-style trim deleted four of them (persistent). Use the two-question test of [Transient vs persistent context](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) on every trim.

`S:None` is the system prompt of `create_agent`. It is not in the state and not in `request.messages`. The model node adds it in front of the messages. So `include_system=True` has no effect inside these hooks.

> [!trap] The docs example is named trim_messages but is not trim_messages
> The short-term memory page has a `@before_model` function named `trim_messages` (checked on 2026-10-13). It keeps the first message, plus `messages[-3:]` or `messages[-4:]` by the parity of the length. It does not call the utility. With a parallel tool call, the parity rule produced this list in a test: `human h0, tool t3 (call c2), ai a4, tool t5`. The call `c2` was in a removed AI message, so `t3` is an orphan.

### 4.7 RemoveMessage and the add_messages reducer

The reducer is in `langgraph/graph/message.py` (langgraph 1.2.14). These are the core lines:

```python
for idx, m in enumerate(right):
    if m.id is None:
        m.id = str(uuid.uuid4())
    if isinstance(m, RemoveMessage) and m.id == REMOVE_ALL_MESSAGES:
        remove_all_idx = idx

if remove_all_idx is not None:
    return right[remove_all_idx + 1 :]

merged = left.copy()
merged_by_id = {m.id: i for i, m in enumerate(merged)}
ids_to_remove = set()
for m in right:
    if (existing_idx := merged_by_id.get(m.id)) is not None:
        if isinstance(m, RemoveMessage):
            ids_to_remove.add(m.id)
        else:
            ids_to_remove.discard(m.id)
            merged[existing_idx] = m
    else:
        if isinstance(m, RemoveMessage):
            raise ValueError(
                f"Attempting to delete a message with an ID that doesn't exist ('{m.id}')"
            )
        merged_by_id[m.id] = len(merged)
        merged.append(m)
merged = [m for m in merged if m.id not in ids_to_remove]
```

The test called `add_messages(left, right)` directly, with `left = [("1","a"), ("2","b"), ("3","c")]` as (id, content) pairs:

| `right` | Result |
|---|---|
| `[AIMessage("d", id="4")]` | `1 a, 2 b, 3 c, 4 d`: a new id appends |
| `[AIMessage("B2", id="2")]` | `1 a, 2 B2, 3 c`: the same id replaces in place |
| `[RemoveMessage(id="2")]` | `1 a, 3 c` |
| `[RemoveMessage(id=REMOVE_ALL_MESSAGES), HumanMessage("x", id="9")]` | `9 x` |
| `[HumanMessage("x", id="8"), RemoveMessage(id=REMOVE_ALL_MESSAGES), HumanMessage("y", id="9")]` | `9 y`: messages before the marker are dropped too |
| `[RemoveMessage(id=REMOVE_ALL_MESSAGES)]` | `[]` |
| `[RemoveMessage(id="2"), AIMessage("B3", id="2")]` | `1 a, 2 B3, 3 c`: a later write with the same id cancels the removal |
| `[RemoveMessage(id="99")]` | `ValueError: Attempting to delete a message with an ID that doesn't exist ('99')` |

Two more facts from the test. Messages with no id get a uuid from the reducer, for example `3725d19f-...`. And `REMOVE_ALL_MESSAGES` returns everything after the marker without any check. With `[RemoveMessage(id=REMOVE_ALL_MESSAGES), RemoveMessage(id="x")]`, the state became `[RemoveMessage(id='x')]`: a remove instruction stored as a message.

> [!key] A deletion is an update that the reducer interprets
> `RemoveMessage` does nothing by itself. It works only on a state key whose reducer is `add_messages`, and only when a node returns it as an update. By id it deletes one message and fails loudly on an unknown id. With `REMOVE_ALL_MESSAGES` it replaces the whole list with what follows the marker.

> [!trap] Unknown ids stop the run
> A test ran two parallel nodes that both returned `RemoveMessage(id="m1")`. The reducer applied the first removal, then raised `ValueError: Attempting to delete a message with an ID that doesn't exist ('m1')` for the second. The same happens when a hook removes ids that it kept from an earlier turn. Build `RemoveMessage` objects only from `state["messages"]` of the same call, and let only one node remove a given message.

### 4.8 The safe-cut rule for tool pairs

Every cut, transient or persistent, must keep each tool call with its results ([tool_use and tool_result, section 4.6](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result)). The rules for these two tools:

| Situation | Risk | Rule |
|---|---|---|
| `strategy="last"` with no `start_on` | The result can start with a tool result whose call was cut: an orphan | Always pass `start_on="human"` |
| `strategy="first"` | The result can end with a tool call whose results were cut | Pass `end_on="human"`, or do not use `"first"` for chat history |
| `RemoveMessage` by id | Removing an AI message with tool calls and keeping its tool messages | Remove whole turns: from a user message up to the next user message |
| Your own slicing, for example by parity | Any of the above | Validate the result with a pairing check before you return it |

`start_on="human"` is a strong rule for chat history. The cut lands at a user message. In a LangChain list, tool results are separate `ToolMessage` objects, so a user message never holds them. So no orphan can start the list. The price is a shorter result.

### 4.9 Production view

| Concern | What to do |
|---|---|
| Correctness | Use `strategy="last"` and `start_on="human"`. Check the result for orphans in tests. |
| Empty results | Guard against `[]`. Keep at least the newest user message. |
| Transient or persistent | Trim in `wrap_model_call` when the state must keep everything. Use `RemoveMessage` in `before_model` only when old messages are truly not needed. |
| Errors | Build `RemoveMessage` ids from the current state only. An unknown id raises `ValueError`. |
| Token accuracy | `len` and `"approximate"` are estimates. Keep a margin below the real window. |
| Data safety | Persistent removal changes the harness state only. The user transcript is stored by the application. |

## 5. Code

These exercises go in `langchain-langgraph/08-trim-and-remove.ipynb`. They need no API key.

**Exercise 3.1: predict, then run.** Write the ten-message list of section 4.2. For each row of the table, write your prediction first, then run `trim_messages`.

Acceptance tests:

- Your predictions and the runs agree for all six rows, or your notebook explains each difference.
- You add one case where `strategy="last"` without `start_on` starts with a tool result.

**Exercise 3.2: a pairing guard.** Write `assert_no_orphans(messages)` for LangChain messages. It fails when a `ToolMessage` has no earlier `AIMessage` call with its id. It also fails when an `AIMessage` call has no later `ToolMessage`, except in the last AI message.

Acceptance tests:

- It passes for every `start_on="human"` result of section 4.2.
- It fails for `T:t2 A:a4 H:h5` and for the parity example of section 4.6.

**Exercise 3.3: the reducer table.** Call `add_messages` directly for each row of the table in section 4.7.

Acceptance tests:

- Every result matches the table, including the `ValueError` text.
- You add one case of your own and explain it from the source lines.

**Exercise 3.4: transient and persistent trimming.** Build an agent with a fake model and a checkpointer. Add the two hooks of section 4.6, one at a time.

Acceptance tests:

- In both cases, the fake model receives the same messages.
- With the wrap hook, the state keeps all messages. With the node hook, it keeps only the trimmed ones.

## 6. Common mistakes

1. **`strategy="last"` without `start_on`.** The result can start with an orphan tool result.
2. **Trusting the budget only.** `start_on` and `include_system` can leave far fewer messages than the budget allows.
3. **No guard for an empty result.** With `allow_partial=False`, one large message gives `[]`.
4. **Thinking `RemoveMessage` deletes by itself.** It works only as an update through `add_messages`.
5. **Removing an id that is already gone.** The reducer raises `ValueError`.
6. **Copying the docs example for trimming.** It slices by parity, which can split a parallel tool call.

## 7. One-minute explanation

`trim_messages` is a pure function that returns the newest messages (strategy last) or the oldest messages (strategy first) that fit `max_tokens`. The counter is `len`, the approximate counter, or a model. `start_on="human"` then removes messages from the front until a user message is first. This prevents orphan tool results but can leave very few messages. `include_system` keeps a leading system message and counts it, and `allow_partial` can keep the last lines of a long message. `RemoveMessage` is different: it is an update that the `add_messages` reducer applies. The reducer deletes the message with that id, raises `ValueError` for an unknown id, and drops everything before a `REMOVE_ALL_MESSAGES` marker. Trimming inside `wrap_model_call` is transient, and returning `RemoveMessage` from `before_model` is persistent. Every cut must keep tool calls and tool results together.

## 8. Check questions

```check
{
  "question": "trim_messages(msgs, token_counter=len, max_tokens=3, strategy=\"last\") on S h1 a1 t1 a2 h3 a3 t2 a4 h5 returns t2 a4 h5. What is wrong, and which argument fixes it? What is the result then?",
  "answer": "t2 is a tool result whose call is in a3, which was cut, so t2 is an orphan and the request would be invalid. start_on=\"human\" fixes it: it removes messages from the front until a human message is first. The result is only h5."
}
```

```check
{
  "question": "A before_model hook returns {\"messages\": [RemoveMessage(id=\"m7\")]} but another middleware already removed m7 in an earlier node of the same model call. What happens?",
  "answer": "The add_messages reducer searches the current state for m7, does not find it, and raises ValueError: Attempting to delete a message with an ID that doesn't exist ('m7'). The run stops. Build RemoveMessage ids only from the state that the hook receives."
}
```

```check
{
  "question": "The same trim_messages call runs once in wrap_model_call with request.override and once in before_model returning RemoveMessage(REMOVE_ALL_MESSAGES) plus the kept messages. What is the same and what differs after one turn?",
  "answer": "The model input is the same in both cases. The state differs: with wrap_model_call the state keeps every message and the trim runs again on the next call (transient). With before_model the reducer replaces the state with the kept messages, so the next turn starts from the shorter list (persistent)."
}
```

```check
{
  "question": "Why does start_on=\"human\" guarantee that a trimmed LangChain list does not start with an orphan tool result?",
  "answer": "In LangChain, tool results are separate ToolMessage objects, not blocks inside a human message. So a list that starts with a HumanMessage starts with a real user message. Every ToolMessage after it in the result belongs to an AIMessage that is also in the result, because strategy last keeps a contiguous tail."
}
```

## 9. Links

- Previous: [L2: ContextEditingMiddleware](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware)
- Next part: [L4.1: State and reducers](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers)
- The safe-cut rule: [tool_use and tool_result](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result)
- Transient and persistent changes: [Transient vs persistent context](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context)
- LangChain message classes: [L1.1: LangChain messages](/notes/ai/langchain-langgraph/01-foundations/l1-langchain-messages)
- [Glossary](/notes/ai/langchain-langgraph/glossary)
