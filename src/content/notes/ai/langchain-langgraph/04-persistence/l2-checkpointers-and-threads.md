---
title: "L2: Checkpointers and threads"
order: 2
summary: "A checkpointer saves a snapshot of the graph state after every super-step, keyed by thread_id. get_state, get_state_history, update_state and the three durability modes, an InMemorySaver demo, PostgresSaver on PostgreSQL 16 with its four tables, the Databricks CheckpointSaver on Lakebase, and why a checkpoint is the harness state, not the chat history."
status: not-started
tags: [langgraph, checkpointer, threads, postgres, lakebase, persistence]
---

## 1. The question this idea answers

An agent answers a question about plant downtime. The user asks a follow-up a minute later, and the request reaches a different instance of the service. How does the agent know the earlier messages? And if the process crashes in the middle of a long tool loop, what is lost?

LangGraph answers with a **checkpointer**: an object that saves the graph state after every super-step, under a **thread id**. The next call with the same thread id starts from the saved state. This lesson shows exactly what is saved and when, with real runs on `InMemorySaver` and on PostgreSQL 16. It ends with the most important limit: a checkpoint is the harness's working copy, not the chat history that the user saw.

## 2. Mental model

> [!analogy] Save points in a game, one save list per player
> A game saves automatically after every level. Each player has a separate list of saves. Loading the newest save continues the game. Older saves stay in the list, so you can return to any of them.
>
> A level is a super-step. A player is a thread. A save is a checkpoint.
>
> **Where it stops working:** a game save is the player's own record. A checkpoint is the agent's working state. After a summarization, the newest checkpoint holds a summary, not the messages that the user saw. And the save list grows with every step until you delete the thread.

## 3. Terms

| Term | Plain meaning |
|---|---|
| checkpointer | An object that saves and loads checkpoints, for example `InMemorySaver` or `PostgresSaver`. |
| checkpoint | A snapshot of the graph state, saved at each super-step. |
| thread | All the checkpoints that share one thread id: one conversation of the harness. |
| `thread_id` | The key in `config["configurable"]` that selects the thread. |
| `checkpoint_id` | The id of one checkpoint. A config with it selects an older checkpoint. |
| `StateSnapshot` | The object that `get_state` returns: values, next nodes, config, metadata, time, parent and tasks. |
| `get_state_history` | Returns all checkpoints of a thread, newest first. |
| `update_state` | Writes a new checkpoint with changed values, as if a node had returned them. |
| `as_node` | The argument of `update_state` that names the node the update counts as. |
| durability | When checkpoints are written: `"exit"`, `"async"` or `"sync"`. |
| `PostgresSaver` | The checkpointer that stores checkpoints in PostgreSQL tables. |
| `setup()` | The method that creates or migrates the checkpointer's tables. |
| `CheckpointSaver` | The Databricks class: a `PostgresSaver` that uses a Lakebase connection pool. |
| `delete_thread` | Deletes every checkpoint and write of one thread. |

## 4. Method and math

### 4.1 Definitions

From the LangGraph checkpointers page (checked on 2026-10-13):

> "A checkpoint is a snapshot of the graph state saved at each super-step"
>
> "A thread is a unique ID or thread identifier assigned to each checkpoint saved by a checkpointer."

You compile the graph with a checkpointer and pass the thread id in the config of each call:

```python
saver = InMemorySaver()
graph = builder.compile(checkpointer=saver)
cfg = {"configurable": {"thread_id": "chat-42"}}
graph.invoke(inp, cfg)
```

`create_agent(..., checkpointer=saver)` does the same for an agent.

### 4.2 One run, five checkpoints

The test uses the graph of [L4.1](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers): `plan`, then `query_plant_3` and `query_plant_7` in parallel, then `answer`. After one run, `get_state_history(cfg)` returned five checkpoints, newest first (real output, ids shortened):

| step | source | next | status | rows | messages |
|---|---|---|---|---|---|
| 3 | loop | `()` | answered | 2 | 2 |
| 2 | loop | `('answer',)` | planned | 2 | 1 |
| 1 | loop | `('query_plant_3', 'query_plant_7')` | planned | 0 | 1 |
| 0 | loop | `('plan',)` | new | 0 | 1 |
| -1 | input | `('__start__',)` | none | 0 | 0 |

> [!example] Worked example: why five
> 1. Step −1, source `input`: the empty checkpoint before the input is applied.
> 2. Step 0: after the input is applied. `next` is `plan`.
> 3. Step 1: after `plan`.
> 4. Step 2: after `query_plant_3` and `query_plant_7`. They share one super-step, so they share one checkpoint.
> 5. Step 3: after `answer`. `next` is empty, so the run is complete.
>
> The docs give the same rule for `START -> A -> B -> END`: "there will be exactly 4 checkpoints". Two nodes there, three super-steps of nodes here, so 4 and 5.

Each checkpoint links to its parent. `next` says which nodes would run if you continued from it.

### 4.3 Threads

A second run with a new user message on the same thread continued from the newest checkpoint. The thread then had 10 checkpoints. A run on another thread id starts empty:

```text
chat-42 checkpoints now: 10 messages: ['h1', 'ans', 'h2'] rows: ['plant 3: 95 min', 'plant 7: 40 min', 'plant 3: 95 min', 'plant 7: 40 min']
chat-43 before any run: values = {} checkpoints: 0
```

Two details of this output are traps:

1. **`rows` has four items.** The key uses `operator.add`, and the checkpoint keeps the value between runs. Every turn appends again. A key that should hold only this turn's data needs a replace reducer, or a reset with `Overwrite`.
2. **There are three messages, not four.** The test node `answer` gives every answer the fixed id `"ans"`. So `add_messages` replaced the first answer in place, at index 1, before `h2`. Real models give each message a new id. Never use fixed ids for new messages.

### 4.4 get_state and update_state

`get_state(cfg)` returns the newest `StateSnapshot`. The docs list its fields: `values`, `next`, `config`, `metadata`, `created_at`, `parent_config` and `tasks` (checked on 2026-10-13). The docs say that `metadata` contains `source`, `writes` and `step`. In this run, the metadata keys were `['parents', 'source', 'step']`, with no `writes`. The code follows the installed version: do not depend on `writes`.

`update_state` writes a new checkpoint. The docs: "This creates a new checkpoint with the updated values — it does not modify the original checkpoint." The update goes through the reducers, as a node update would:

```python
graph.update_state(cfg, {"status": "reviewed",
                         "messages": [AIMessage("Note: plant 9 has no sensor.", id="note")]},
                   as_node="answer")
```

```text
metadata: {'source': 'update', 'step': 9} status: reviewed messages: ['h1', 'ans', 'h2', 'note']
```

`as_node` controls which node the update counts as. That decides which node runs next if you continue the graph.

### 4.5 Durability

The three modes, from the docs (checked on 2026-10-13):

| Mode | Docs | Checkpoints saved in the test run |
|---|---|---|
| `"exit"` | "LangGraph persists changes only when graph execution exits." It warns that "you cannot recover from system failures (like process crashes) mid-execution." | 1 |
| `"async"` | "LangGraph persists changes asynchronously while the next step executes." Small risk of a lost checkpoint on a crash. | 5 |
| `"sync"` | "LangGraph persists changes synchronously before the next step starts." | 5 |

The default is `"async"`: the docstring of `stream` in langgraph 1.2.14 says that durability "defaults to `"async"`". You pass the mode per call: `graph.invoke(inp, cfg, durability="sync")`.

### 4.6 PostgresSaver on PostgreSQL 16

The test ran against a local PostgreSQL 16.15 server with langgraph-checkpoint-postgres 3.1.3 (checked on 2026-10-13):

```python
from langgraph.checkpoint.postgres import PostgresSaver

DB_URI = "postgresql://postgres@/lcb?host=/var/tmp/pgtest&port=5433"
with PostgresSaver.from_conn_string(DB_URI) as saver:
    saver.setup()                      # creates or migrates the tables
    graph = builder.compile(checkpointer=saver)
    graph.invoke(inp, {"configurable": {"thread_id": "chat-42"}})
```

`from_conn_string` is a context manager. It opens one connection with `autocommit=True, prepare_threshold=0, row_factory=dict_row` (installed source). `setup()` runs a list of migrations and records each version in `checkpoint_migrations`. It created four tables:

| Table | Columns (type) | Primary key |
|---|---|---|
| `checkpoints` | `thread_id` text, `checkpoint_ns` text default `''`, `checkpoint_id` text, `parent_checkpoint_id` text, `type` text, `checkpoint` jsonb, `metadata` jsonb default `'{}'` | `thread_id, checkpoint_ns, checkpoint_id` |
| `checkpoint_blobs` | `thread_id`, `checkpoint_ns`, `channel`, `version`, `type` (text), `blob` bytea | `thread_id, checkpoint_ns, channel, version` |
| `checkpoint_writes` | `thread_id`, `checkpoint_ns`, `checkpoint_id`, `task_id` (text), `idx` integer, `channel`, `type` (text), `blob` bytea, `task_path` text default `''` | `thread_id, checkpoint_ns, checkpoint_id, task_id, idx` |
| `checkpoint_migrations` | `v` integer | `v` |

The migration versions were 0 to 9. Besides the primary keys, `setup()` created one index on `thread_id` in each of the three data tables.

After one run of the four-node graph, the tables held 5 checkpoints, 7 blobs and 13 writes:

```text
('chat-42', '1f1c70a5-bc32', '', -1, 'input')
('chat-42', '1f1c70a5-bc3d', '1f1c70a5-bc32', 0, 'loop')
('chat-42', '1f1c70a5-bc3f', '1f1c70a5-bc3d', 1, 'loop')
('chat-42', '1f1c70a5-bc48', '1f1c70a5-bc3f', 2, 'loop')
('chat-42', '1f1c70a5-bc4b', '1f1c70a5-bc48', 3, 'loop')
```

The columns are `thread_id`, `checkpoint_id` (shortened), `parent_checkpoint_id`, and `step` and `source` from the `metadata` JSONB. The `checkpoint` JSONB has the keys `channel_values`, `channel_versions`, `id`, `ts`, `updated_channels`, `v` and `versions_seen`. In the last checkpoint, `channel_values` held only `{'status': 'answered'}`. The lists `messages` and `rows` were in `checkpoint_blobs` as `msgpack` bytes, one row per channel version. `checkpoint_writes` holds the update of each task. The checkpointers page explains why: "if another node in the same super-step fails, the successful nodes' writes are already durable and don't need to be re-run on resume."

> [!trap] Manual connections need autocommit
> One migration runs `CREATE INDEX CONCURRENTLY`. A test passed a default psycopg connection (`autocommit=False`) to `PostgresSaver(conn).setup()`. It failed with `ActiveSqlTransaction: CREATE INDEX CONCURRENTLY cannot run inside a transaction block`. The package README says that manual connections need `autocommit=True` and `row_factory=dict_row`. In 3.1.3 the saver also sets `dict_row` on its own cursors, so only autocommit broke in the test. Follow the README anyway.

The README also has a security note: "Set `LANGGRAPH_STRICT_MSGPACK=true` or pass an explicit `allowed_msgpack_modules` list when creating your checkpointer." It says that this prevents "code execution if the database is compromised".

### 4.7 The Databricks CheckpointSaver on Lakebase

On Databricks, the checkpoint tables can live in Lakebase, the managed PostgreSQL service ([What Lakebase is](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is)). `databricks-langchain` 0.21.0 ships a subclass (wheel source, shortened with `...`, checked on 2026-10-13):

```python
class CheckpointSaver(PostgresSaver):
    """LangGraph PostgresSaver using a Lakebase connection pool."""

    def __init__(self, *, instance_name=None, autoscaling_endpoint=None, project=None,
                 branch=None, workspace_client=None, schema=None, **pool_kwargs):
        ...
        self._lakebase = LakebasePool(instance_name=instance_name, ..., schema=schema, **dict(pool_kwargs))
        super().__init__(self._lakebase.pool)

    def setup(self) -> None:
        LakebaseClient.create_schema(self._lakebase)
        super().setup()
```

| Fact | Source |
|---|---|
| It needs `databricks-langchain[memory]`. Without it, the constructor raises `ImportError`. | `checkpoint.py` |
| `instance_name` selects a Provisioned instance. `autoscaling_endpoint`, or `project` and `branch`, select Autoscaling. The two modes are mutually exclusive. | `databricks-ai-bridge` 0.22.0, `lakebase.py` |
| `setup()` first creates the schema (when `schema` is given), then runs the normal migrations. | `checkpoint.py` |
| The pool connections use `autocommit=True` and `dict_row`, with `min_size` 1, `max_size` 10, `timeout` 30 seconds by default. | `databricks-ai-bridge` 0.22.0, `lakebase.py` |
| The pool mints a database token and caches it for 15 minutes. | `databricks-ai-bridge` 0.22.0 |
| The Model Serving docs use `with CheckpointSaver(instance_name=LAKEBASE_INSTANCE_NAME) as checkpointer:` and pass the thread id as `"custom_inputs": {"thread_id": thread_id}`. | "Agent memory (Model Serving)", last updated Oct 9, 2026 |

`AsyncCheckpointSaver` exists too. Its docstring says "Checkpoint tables are created automatically when entering the context manager", but its `__aenter__` in 0.21.0 only opens the pool. I could not confirm that opening the pool creates the tables. Call `setup()` yourself. The connection pool itself is the topic of [LakebasePool](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool).

### 4.8 A checkpoint is the harness state, not the chat history

A checkpoint is **copy 2** of [the three copies](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation). The test that proves it ran `create_agent` with `SummarizationMiddleware(trigger=("messages", 6), keep=("messages", 2))` and `PostgresSaver` on a 7-message input. The history of the thread:

```text
latest state: ['SUMMARY', 'r2', 'q3', 'a-last']
  step= 2 source=loop  next=() messages=['SUMMARY', 'r2', 'q3', 'a-last']
  step= 1 source=loop  next=('model',) messages=['SUMMARY', 'r2', 'q3']
  step= 0 source=loop  next=('SummarizationMiddleware.before_model',) messages=['q0', 'r0', 'q1', 'r1', 'q2', 'r2', 'q3']
  step=-1 source=input next=('__start__',) messages=[]
after delete_thread: checkpoints = 0
```

Three facts follow:

1. The newest checkpoint, the one that `get_state` and the next turn use, holds a summary in place of `q0` to `r1`.
2. The old messages still exist in the step 0 checkpoint. They stay in the database until the thread is deleted. The checkpoint tables grow with every super-step of every turn.
3. `delete_thread` removed all of it. A thread is disposable working state.

> [!key] Store the chat yourself, keep checkpoints as a cache
> The checkpointer stores what the harness needs to continue: summaries, tool results, internal keys. It is not the record of what the user saw. Store the user transcript in your own tables from the event stream ([Chats, messages and parts](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts)). If a thread is lost or deleted, rebuild the harness state from your transcript.

### 4.9 Production view

| Concern | What to do |
|---|---|
| Choice | `InMemorySaver` for tests ("for experimentation" in the docs). `PostgresSaver`, or `CheckpointSaver` on Lakebase, for a service with several instances. |
| Setup | Run `setup()` once at deploy time, not on every request. Use `autocommit=True` for manual connections. |
| Durability | Keep `"async"` for normal turns. Use `"sync"` when a crash in the middle of a long tool loop must lose nothing. |
| Storage | Every super-step writes a checkpoint. Delete threads with `delete_thread` under a retention rule. |
| Security | Set `LANGGRAPH_STRICT_MSGPACK=true` or `allowed_msgpack_modules`. Protect the tables like chat data. |
| Data model | Never read the chat history from checkpoints. They hold summaries and harness keys. |
| Per-turn keys | Do not use `operator.add` for data that belongs to one turn. It accumulates across turns. |

## 5. Video

```video
{
  "src": "/notes/media/langchain-langgraph/manim/m04-checkpoints-per-super-step.mp4",
  "caption": "A checkpoint after every super-step, one chain per thread, and why the newest checkpoint after a summary is not the chat history."
}
```

## 6. Code

These exercises go in `langchain-langgraph/10-checkpointers.ipynb`. They need no API key. Use your local PostgreSQL server for exercise 2.2.

**Exercise 2.1: count the checkpoints.** Compile the graph of L4.1 with `InMemorySaver` and run it once.

Acceptance tests:

- `get_state_history` returns five snapshots, with steps 3, 2, 1, 0 and −1 in that order.
- With `durability="exit"`, `saver.list(cfg)` returns one checkpoint.
- A second thread id returns `{}` from `get_state`.

**Exercise 2.2: read the tables.** Use `PostgresSaver.from_conn_string` and `setup()` on a new database. Run the graph once.

Acceptance tests:

- `information_schema.tables` lists the four tables of section 4.6.
- A SQL query on `checkpoints` returns five rows, and `metadata->>'step'` gives −1 to 3.
- You can explain why `channel_values` in the JSONB holds `status` but not `messages`.

**Exercise 2.3: summary versus transcript.** Run `create_agent` with summarization and a checkpointer for three turns. Keep your own transcript list from the events.

Acceptance tests:

- The newest checkpoint holds a summary message, and the transcript holds no summary.
- An older checkpoint still holds the original messages until `delete_thread`.
- After `delete_thread`, the transcript is unchanged.

## 7. Common mistakes

1. **"One checkpoint per turn."** There is one per super-step, plus an input checkpoint.
2. **Reading the chat history from `get_state`.** After summarization it holds a summary. Store your own transcript.
3. **Calling `setup()` with a default psycopg connection.** `CREATE INDEX CONCURRENTLY` fails inside a transaction. Use `autocommit=True`.
4. **`operator.add` for per-turn data.** The value grows on every turn of the thread.
5. **Fixed message ids in nodes.** The second answer replaces the first one in place.
6. **No retention.** Checkpoints of old super-steps stay until the thread is deleted.

## 8. One-minute explanation

A checkpointer saves the graph state after every super-step, plus an input checkpoint, under the `thread_id` that you pass in `config["configurable"]`. The next call with the same thread id continues from the newest checkpoint, and another thread id starts empty. `get_state` returns the newest snapshot, `get_state_history` returns all of them newest first, and `update_state` writes a new checkpoint through the reducers. The durability mode decides when checkpoints are written: only at exit, in the background, or before each next step. `PostgresSaver` stores them in four tables that `setup()` creates, and on Databricks, `CheckpointSaver` does the same in Lakebase through a connection pool. A checkpoint is the harness's working state: after summarization the newest one holds a summary, and old checkpoints still hold old messages. So the application must store the user transcript itself and treat threads as disposable.

## 9. Check questions

```check
{
  "question": "A graph runs START -> retrieve -> (score_a, score_b in parallel) -> answer -> END with a checkpointer. How many checkpoints does one run write with durability \"async\"? And with \"exit\"?",
  "answer": "Five with async. There is the input checkpoint (step -1) and the checkpoint after the input is applied (step 0). Then there is one per super-step: retrieve, the parallel pair together, and answer. With exit, only the final checkpoint is written, so one."
}
```

```check
{
  "question": "Your agent uses SummarizationMiddleware and PostgresSaver. A product manager wants the chat page to read the history from get_state. What goes wrong?",
  "answer": "After a summarization, the newest checkpoint holds a summary HumanMessage in place of the old messages. The chat page would show the summary as a user message and lose the earlier turns. The page must read the application's own transcript, stored from the event stream."
}
```

```check
{
  "question": "PostgresSaver(conn).setup() fails with ActiveSqlTransaction. What is the cause and the fix?",
  "answer": "The connection was opened with the psycopg default autocommit=False, so setup runs inside a transaction. One migration runs CREATE INDEX CONCURRENTLY, which cannot run inside a transaction block. Open the connection with autocommit=True and row_factory=dict_row, or use PostgresSaver.from_conn_string."
}
```

```check
{
  "question": "A state key rows uses operator.add. After three turns in the same thread it holds rows from all three turns. Why, and what are two fixes?",
  "answer": "The checkpoint keeps the value between runs, and operator.add appends each new update to it. Fix 1: use a key with no reducer, so each update replaces the value. Fix 2: reset the key at the start of a turn with Overwrite."
}
```

## 10. Links

- Previous: [L1: State and reducers](/notes/ai/langchain-langgraph/04-persistence/l1-state-and-reducers)
- Next part: [L5.1: Stream modes and get_stream_writer](/notes/ai/langchain-langgraph/05-streaming/l1-stream-modes-and-stream-writer)
- Copy 2 is not copy 1: [Three copies of a conversation](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation)
- Lakebase: [What Lakebase is](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is)
- Transactions and autocommit: [Transactions](/notes/databases/postgres/02-transactions/l1-transactions)
- [Glossary](/notes/ai/langchain-langgraph/glossary)
