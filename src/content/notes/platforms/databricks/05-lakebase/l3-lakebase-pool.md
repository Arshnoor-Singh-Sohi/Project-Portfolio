---
title: "L3: LakebasePool"
order: 3
summary: "LakebasePool from databricks-ai-bridge is a psycopg ConnectionPool with a connection class that puts a cached OAuth token into each new login. How it finds the host and the user, how it mints and caches tokens, every parameter and default with line numbers, the async variant, three traps found by running it, and how it compares with a hand-written psycopg_pool setup."
status: not-started
tags: [databricks, lakebase, connection-pool, psycopg-pool, oauth, databricks-ai-bridge, asyncio]
---

## 1. The question this idea answers

A chat service opens database connections all day. A connection pool keeps them open and lends them out ([connection pools](/notes/databases/postgres/03-python-driver/l2-connection-pools)). Lakebase adds one rule: every new login needs a valid OAuth token, and a token lives one hour ([L1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is)). A pool opens new connections at unpredictable moments: at start, when load grows, when it replaces an old or broken connection. Each of those moments needs a fresh token.

The `databricks-ai-bridge` package ships `LakebasePool`, which solves this for you. This lesson reads its source to answer four questions. How does it build the pool? Where does it get and refresh the token? What are its parameters and defaults? How do you use it correctly in a web service? Every claim below comes from the installed source or from a run in the sandbox.

## 2. Mental model

> [!analogy] Taxis and a gate permit
> A taxi company keeps cars ready at a depot. Each car needs a permit to pass the gate when it leaves. The guard checks the permit only at the gate. A car that is already on the road keeps driving after its permit expires.
>
> The dispatcher keeps one permit in a drawer for 15 minutes and gives a copy to every car that leaves in that time. After 15 minutes, the dispatcher fetches a new permit.
>
> The cars are connections. The gate is the Postgres login. The permit is the OAuth token. The drawer is the token cache of `LakebasePool`.
>
> **Where it stops working:** a car on the road is always usable. A pooled connection can die without notice, for example after a scale-to-zero suspend or a 3-day connection limit. The pool does not notice by default. You must ask it to check each connection before it lends it out.

## 3. Terms

| Term | Plain meaning |
|---|---|
| `LakebasePool` | The sync connection pool class in `databricks_ai_bridge.lakebase`. It wraps a psycopg `ConnectionPool`. |
| `AsyncLakebasePool` | The async variant. It wraps a psycopg `AsyncConnectionPool`. |
| `ConnectionPool` | The psycopg_pool class that keeps connections open and lends them out. |
| connection class | The class that the pool uses to open each connection. Its `connect` method runs once per new connection. |
| token cache | The stored token and the time it was minted. It is reused until it is older than the cache duration. |
| mint | To ask Databricks for a new database credential. |
| `token_cache_duration_seconds` | How long the pool reuses one token. Default 900 seconds. |
| `pool_kwargs` | Extra keyword arguments that `LakebasePool` passes to `ConnectionPool`. |
| `configure` | A pool callback that runs once on each new connection. |
| `check` | A pool callback that tests a connection before the pool lends it out. |
| autocommit | A connection mode in which every statement commits on its own. |
| `dict_row` | A psycopg row factory that returns each row as a dictionary. |
| lifespan | The startup and shutdown hook of a web application. |

## 4. Method and math

### 4.1 Where it lives

The class is in `databricks_ai_bridge/lakebase.py` of `databricks-ai-bridge` 0.22.0 (checked on 2026-10-13). Lines 28–32 export three classes: `AsyncLakebasePool`, `AsyncLakebaseSQLAlchemy` and `LakebasePool`. The module needs psycopg. Lines 17–26 raise an `ImportError` without it, with the message "LakebasePool requires databricks-ai-bridge[memory]. Please install with: pip install databricks-ai-bridge[memory]". The package metadata says that the `memory` extra installs `psycopg[binary,pool]>=3.2.10` and `sqlalchemy[asyncio]>=2.0.0`.

`databricks-langchain` uses the same class. Its `CheckpointSaver` creates its own `LakebasePool` (`checkpoint.py` line 46 in 0.21.0).

### 4.2 Parameters and defaults

The constructor, lines 402–413:

```python
def __init__(self, *, instance_name=None, autoscaling_endpoint=None, project=None,
             branch=None, workspace_client=None,
             token_cache_duration_seconds=DEFAULT_TOKEN_CACHE_DURATION_SECONDS,
             schema=None, **pool_kwargs)
```

| Parameter | Default | Meaning |
|---|---|---|
| `instance_name` | `None` | A Provisioned instance. Excludes the three Autoscaling parameters. |
| `autoscaling_endpoint` | `None` | A full endpoint path, for example the value from `valueFrom` ([L2](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource)). |
| `project`, `branch` | `None` | A project and a branch. The pool searches the branch for its read-write endpoint. |
| `workspace_client` | `WorkspaceClient()` (line 125) | The identity that mints the tokens. |
| `token_cache_duration_seconds` | 900 (line 38: `15 * 60`) | How long one token is reused. |
| `schema` | `None` | If set, each new connection runs `SET search_path TO <schema>, public`. |
| `min_size` (in `pool_kwargs`) | 1 (line 40) | Connections kept open. psycopg_pool's own default is 4. |
| `max_size` (in `pool_kwargs`) | 10 (line 41) | The most connections at once. |
| `timeout` (in `pool_kwargs`) | 30.0 (line 42) | Seconds to wait for a free connection. |
| other `pool_kwargs` | psycopg_pool defaults | For example `max_lifetime` 3600.0, `max_idle` 600.0, `check` `None` (psycopg_pool 3.3.3). |

Fixed values, lines 44–46: `sslmode` `require`, port `5432`, database `databricks_postgres`.

Lines 129–175 validate the mode. `instance_name` with any Autoscaling parameter raises a `ValueError`. So do `autoscaling_endpoint` with `project` or `branch`, and `project` without `branch`. A sandbox run gave: "Both 'project' and 'branch' are required to use a Lakebase autoscaling instance. Please specify both parameters."

> [!trap] Three arguments that look natural and fail
> The base class accepts `database` and `username`, but `LakebasePool.__init__` does not pass them on. They land in `pool_kwargs` and reach `ConnectionPool`. The sandbox run (psycopg_pool 3.3.3):
>
> ```text
> database -> TypeError: ConnectionPool.__init__() got an unexpected keyword argument 'database'
> kwargs -> TypeError: psycopg_pool.pool.ConnectionPool() got multiple values for keyword argument 'kwargs'
> username -> TypeError: ConnectionPool.__init__() got an unexpected keyword argument 'username'
> ```
>
> So `LakebasePool` always connects to `databricks_postgres`, as the user that it infers, with its own connection keyword arguments. If you need another database name, write your own pool (section 4.7).

### 4.3 How it finds the host and the user

The base class resolves the host once, in the constructor, with synchronous SDK calls:

| Mode | Source lines | SDK call | Host taken from |
|---|---|---|---|
| `project` + `branch` | 267–320 | `w.postgres.list_endpoints(parent="projects/{project}/branches/{branch}")` | The first endpoint whose type contains `READ_WRITE`: `status.hosts.host`. It also stores the endpoint name. |
| `autoscaling_endpoint` | 237–265 | `w.postgres.get_endpoint(name=...)` | `status.hosts.host` |
| `instance_name` | 211–235 | `w.database.get_database_instance(name)` | `read_write_dns`, else `read_only_dns` |

The user comes from lines 381–389: `self.workspace_client.current_user.me()` and its `user_name`. If that fails, the constructor raises "Unable to infer username for Lakebase connection." For an app, the role name is the client ID in `PGUSER` ([L2](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource)). The docs do not say that `me().user_name` returns the client ID for a service principal. Check it in your app: compare `pool.username` with `PGUSER`.

### 4.4 How it builds the pool

Lines 427–484 hold the core idea. A connection class whose `connect` puts a token into the password:

```python
429        pool = self
430
431        class RotatingConnection(psycopg.Connection):
432            @classmethod
433            def connect(cls, conninfo: str = "", **kwargs):
434                token = pool._get_token()
435                kwargs["password"] = token
...
445                return super().connect(conninfo, **kwargs)
446
447        default_kwargs: dict[str, object] = {
448            "autocommit": True,
449            "row_factory": dict_row,
450            "keepalives": 1,
451            "keepalives_idle": 30,
452            "keepalives_interval": 10,
453            "keepalives_count": 5,
454        }
...
474        self._pool: ConnectionPool[psycopg.Connection[DictRow]] = ConnectionPool(
475            conninfo=self._conninfo(),
476            kwargs=default_kwargs,
477            min_size=min_size,
478            max_size=max_size,
479            timeout=timeout,
480            open=True,
481            connection_class=RotatingConnection,
482            configure=_configure_fn,
483            **pool_kwargs,
484        )
```

The pool calls `RotatingConnection.connect` each time it opens a connection. So the password is fresh at every login, and never stored in the connection string. Line 480 opens the pool in the constructor. Lines 461–472 build the `configure` callback: it runs `SET search_path` when `schema` is set, then calls your own `configure` if you passed one.

`_conninfo()` (lines 374–379) gives `dbname=... user=... host=... port=5432 sslmode=require`. The password is not in it.

### 4.5 How it gets and refreshes the token

```python
496    def _get_token(self) -> str:
497        """Get cached token or mint a new one if expired (thread-safe)."""
498        with self._cache_lock:
499            if cached_token := self._get_cached_token():
500                return cached_token
501
502            token = self._mint_token()
503            self._cached_token = token
504            self._cache_ts = time.time()
505            return token
```

- `_get_cached_token` (lines 324–330) returns the token while `time.time() - self._cache_ts` is below the cache duration.
- `_mint_token` (lines 332–335) chooses the mode. Autoscaling calls `w.postgres.generate_database_credential(endpoint=self._endpoint_name)` (lines 356–372). Provisioned calls `w.database.generate_database_credential(request_id=str(uuid.uuid4()), instance_names=[self.instance_name])` (lines 337–354).
- `self._cache_lock` is a `threading.Lock` (line 425). Many threads that open connections at once mint only one token.

The comment on lines 36–37 says the 15 minutes are "based on Databricks Lakebase docs". The current authentication page says "OAuth tokens expire after one hour", and its SQLAlchemy example refreshes the token when it is "expiring within 2 minutes". So the 900-second cache is a cautious choice, not a documented limit. It costs at most 4 mints per hour per pool.

The sandbox ran the real `LakebasePool` against the local PostgreSQL 16 server. A fake `WorkspaceClient` returned a socket folder as the host and counted mints. The cache duration was 2 seconds:

```text
conninfo: dbname=databricks_postgres user=postgres host=/tmp/.../sock port=5432 sslmode=require
endpoint: projects/chat-prod/branches/production/endpoints/primary
  mint #1 for projects/chat-prod/branches/production/endpoints/primary
row: {'u': 'postgres', 'db': 'databricks_postgres'} | password sent: fake-oauth-token-001 | autocommit: True
connections in pool: 2 | mints so far: 1
  mint #2 for projects/chat-prod/branches/production/endpoints/primary
passwords of 3 connections held at once: ['fake-oauth-token-001', 'fake-oauth-token-001', 'fake-oauth-token-002']
```

Read it line by line. The pool opened 2 connections in the first second, and both used token 001 from the cache. After 2.5 seconds the cache was old. The test then held 3 connections at once, so the pool opened a third one. Only that new connection minted token 002. The 2 old connections kept token 001 and kept working. On Lakebase this is safe, because "Open connections remain active even after the token expires."

> [!example] Worked example: how old can the token of a new login be?
> Cache duration 900 s. Token lifetime 3,600 s.
>
> 1. The token is minted at t = 0 s.
> 2. The last login that reuses it happens just before t = 900 s.
> 3. At that login, the token is 900 s old and has 3,600 − 900 = 2,700 s left.
>
> So every login uses a token with at least 45 minutes left. The cache can grow to 3,600 − 120 = 3,480 s and still keep the 2-minute margin of the docs' SQLAlchemy example.

### 4.6 Three traps found by running it

**Trap 1: autocommit is on.** Line 448 sets `"autocommit": True`. psycopg's default is `False`, and many examples rely on `with pool.connection()` to commit or roll back the whole block ([transactions](/notes/databases/postgres/02-transactions/l1-transactions)). Here every statement commits on its own. The sandbox ran two inserts, where the second violated `NOT NULL`:

```text
pattern 1 error: NotNullViolation
pattern 1 rows left: {'n': 1}
pattern 2 error: NotNullViolation
pattern 2 rows left: {'n': 0}
```

Pattern 1 was `with pool.connection() as conn:` with two `execute` calls: the first row stayed. Pattern 2 added `conn.transaction()`: nothing stayed. So wrap every group of writes in `with conn.transaction():`.

**Trap 2: no connection check.** `LakebasePool` sets no `check` callback. The sandbox killed both pooled connections with `pg_terminate_backend`, as a stand-in for a suspend or a dropped connection. It is not identical to a real suspend.

```text
[no check] first query after the kill: AdminShutdown: terminating connection due to administrator command
[check=ConnectionPool.check_connection] first query after the kill: {'ok': 1}
```

`check` travels in `pool_kwargs` to `ConnectionPool`. With `check=ConnectionPool.check_connection`, the pool tests each connection before it lends it out. It discards a dead one and opens a new one, with a token from the cache or a new mint.

**Trap 3: the async pool is not open.** `AsyncLakebasePool` creates its pool with `open=False` (line 608). Using it before `await pool.open()` gave:

```text
psycopg_pool.PoolClosed: the pool 'pool-1' is not open yet
```

Use `async with AsyncLakebasePool(...) as pool:` or call `await pool.open()` at startup (lines 650–666).

### 4.7 The async variant and a web service

`AsyncLakebasePool` (lines 521–666) mirrors the sync class with three differences. The lock is an `asyncio.Lock` (line 554). The connection class is a subclass of `psycopg.AsyncConnection` (lines 559–573). Minting runs in a thread, so the slow SDK call does not block the event loop:

```python
634            # Run the sync SDK call in an executor to not block the event loop
635            loop = asyncio.get_running_loop()
636            token = await loop.run_in_executor(None, self._mint_token)
```

In an async web service, use the async pool. The sync pool blocks the event loop thread while it waits for a connection or mints a token. The constructor still makes blocking SDK calls to resolve the host and the user (section 4.3), so create the pool once at startup. This FastAPI app ran in the sandbox against the local server. The sandbox run also passed `workspace_client=` with the fake client, which the listing omits:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    pool = AsyncLakebasePool(
        project="chat-prod", branch="production",
        min_size=1, max_size=5, check=AsyncConnectionPool.check_connection,
    )
    await pool.open()
    app.state.db = pool
    yield
    await pool.close()

app = FastAPI(lifespan=lifespan)

@app.get("/chats/{chat_id}/count")
async def count_messages(chat_id: str, request: Request):
    async with request.app.state.db.connection() as conn:
        cur = await conn.execute("SELECT count(*) AS n FROM turn_demo WHERE id > %s", (0,))
        return {"chat_id": chat_id, **(await cur.fetchone())}
```

The test request returned `{'chat_id': 'c1', 'n': 0}`. The row is a dictionary because of `dict_row`. In an app, pass `autoscaling_endpoint=os.environ["LAKEBASE_ENDPOINT"]` instead of `project` and `branch`, so the endpoint follows the app resource.

> [!example] Worked example: the connection budget
> Assume an app runs 2 instances ([App instances](/notes/platforms/databricks/01-apps/l3-app-instances)) with 2 worker processes each. Each process has one `AsyncLakebasePool` with `max_size=10` and one `CheckpointSaver`, which builds a second `LakebasePool` with the default `max_size=10`.
>
> 1. Pools: 2 instances × 2 processes × 2 pools = 8 pools.
> 2. Most connections: 8 × 10 = 80.
> 3. A compute that autoscales from 0.5 to 4 CU: limit size min(4, 8 × 0.5) = 4 CU, limit 894 ([L1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is)). 80 fits.
> 4. A fixed 0.5 CU compute: limit 105, minus reserved connections. 80 fits, with little room for people and tools.
>
> Count every pool in every process before you choose `max_size`.

### 4.8 Compared with a hand-written psycopg_pool setup

The Lakebase authentication page shows the hand-written version: a `CustomConnection` subclass whose `connect` calls `w.postgres.generate_database_credential(endpoint=endpoint)` and sets `kwargs['password']`, then a `ConnectionPool(conninfo=..., connection_class=CustomConnection, min_size=1, max_size=10, open=True)`. It is the same idea, written by hand.

| | Docs example | `LakebasePool` |
|---|---|---|
| Token per new connection | A new mint every time | Reused for 900 s, one mint at a time behind a lock |
| Host | Copied from the Connect dialog | Resolved from the project, branch or endpoint |
| User | Written in the code | `current_user.me().user_name` |
| Database name | Your choice | Always `databricks_postgres` |
| `autocommit` | psycopg default: `False` | `True` |
| Rows | Tuples | Dictionaries (`dict_row`) |
| TCP keepalives | Not set | Set: idle 30 s, interval 10 s, count 5 |
| `check` | Not set | Not set |
| Async version | Write your own | `AsyncLakebasePool` |

Choose `LakebasePool` when its fixed choices fit: database `databricks_postgres`, inferred user, autocommit. Write your own pool when you need another database, a fixed user name, or psycopg's default transaction mode. Either way, add `check`.

> [!key] A pool whose connect step mints the password
> `LakebasePool` is a normal psycopg `ConnectionPool` with one change: its connection class asks a token cache for the password at every new login. Open connections keep their old token, which is safe because Lakebase checks the token only at login. Add `check=ConnectionPool.check_connection`, wrap writes in `conn.transaction()`, and use the async variant in async code.

### 4.9 Production view

| Concern | What to do |
|---|---|
| Correctness | Wrap every multi-statement write in `with conn.transaction():`. The pool's connections are in autocommit mode. |
| Reliability | Pass `check=ConnectionPool.check_connection` (or the async one). Keep `max_lifetime` below the 3-day connection limit. The default 3,600 s does. |
| Latency | Create the pool once at startup. Keep `min_size` at 1 or more so the first request finds an open connection. |
| Event loop | Use `AsyncLakebasePool` in async code. It mints in a thread and does not block the loop. |
| Capacity | Sum `max_size` over all pools, processes and instances. Compare it with the compute's connection limit. |
| Security | Never log the token. The pool logs only its first 10 and last 5 characters, and only at debug level (lines 436–443). Keep debug logging off in production. |
| Identity | Compare `pool.username` with `PGUSER` at startup. |

## 5. Video

```video
{
  "src": "/notes/media/databricks/manim/m04-lakebase-token-rotation.mp4",
  "caption": "New connections take the cached token or mint a new one. Old connections keep their old token and stay open, because Lakebase checks the token only at login."
}
```

## 6. Code

These exercises go in `databricks/11-lakebase-pool.ipynb`. Exercises 3.1 to 3.3 use your local PostgreSQL 16 and a fake `WorkspaceClient`, with no workspace.

**Exercise 3.1: run LakebasePool locally.** Write a fake `WorkspaceClient` with `postgres.list_endpoints`, `postgres.generate_database_credential` and `current_user.me`. Point the host at a folder with a socket link named `.s.PGSQL.5432`, and create a database `databricks_postgres` on your local server.

Acceptance tests:

- `pool.connection()` returns a connection, and `conn.info.password` equals the fake token.
- With `token_cache_duration_seconds=2`, a connection opened after 3 seconds gets a new token, and an older connection keeps the old one.
- Ten threads that each open a connection at the same moment cause exactly one mint.

**Exercise 3.2: the transaction trap.** With the pool of 3.1, write two inserts where the second one fails, once without and once with `conn.transaction()`.

Acceptance tests:

- Without the block, one row remains.
- With the block, no row remains.

**Exercise 3.3: survive a dropped connection.** Kill the pooled connections with `pg_terminate_backend`. Then run a query through the pool.

Acceptance tests:

- Without `check`, the query raises an `OperationalError` subclass.
- With `check=ConnectionPool.check_connection`, the query succeeds and the pool has opened new connections.

**Exercise 3.4: a real app.** Deploy a test app with a Lakebase resource. Build an `AsyncLakebasePool` from `LAKEBASE_ENDPOINT` in a FastAPI lifespan.

Acceptance tests:

- At startup, the log shows that `pool.username` equals `PGUSER`, or the difference.
- One request writes a chat and a message in one transaction and reads them back.
- After 20 minutes with traffic, the log shows at most 2 mints.

## 7. Common mistakes

1. **"The pool commits my block as one transaction."** Its connections are in autocommit mode. Use `conn.transaction()`.
2. **Passing `database=` or `username=`.** `LakebasePool` does not accept them. They reach `ConnectionPool` and raise `TypeError`.
3. **Using the sync pool in async endpoints.** It blocks the event loop. Use `AsyncLakebasePool`.
4. **Forgetting `await pool.open()`.** The async pool starts closed and raises `PoolClosed`.
5. **No `check` callback.** After a suspend or a dropped connection, the first query on a dead connection fails.
6. **Counting only one pool.** A checkpointer or a store builds its own pool. Count all pools in all processes and instances.

## 8. One-minute explanation

`LakebasePool` in `databricks-ai-bridge` is a psycopg `ConnectionPool` whose connection class mints the password. At construction it resolves the host from the project and branch, the endpoint path or the instance name, and infers the user from `current_user.me()`. Its defaults are `min_size` 1, `max_size` 10, `timeout` 30 seconds, database `databricks_postgres`, port 5432 and `sslmode` `require`. Every time the pool opens a connection, `RotatingConnection.connect` asks a thread-safe cache for a token. The cache returns its token while it is younger than 900 seconds, and else mints a new one with `generate_database_credential`. Old connections keep their old token, which is fine because Lakebase checks tokens only at login. Its connections run in autocommit mode with dictionary rows, so wrap writes in `conn.transaction()`. It sets no `check` callback, so pass `check=ConnectionPool.check_connection`. In async code, use `AsyncLakebasePool`, which mints in a thread and must be opened with `await pool.open()`.

## 9. Check questions

```check
{
  "question": "A pool was created at 10:00 with the default cache. At 10:20 load rises and the pool opens 3 new connections. How many tokens are minted at 10:20, and which token do the old connections use?",
  "hint": "The cache keeps a token for 900 seconds, and the lock serializes minting.",
  "answer": "One token. The token from 10:00 is 20 minutes old, more than the 900-second cache, so the first new connection mints a new token under the lock, and the other two reuse it from the cache. The old connections keep the 10:00 token. They stay open, because Lakebase checks the token only at login."
}
```

```check
{
  "question": "Code runs two INSERT statements inside with pool.connection() as conn: on a LakebasePool. The second one fails. Is the first row saved? Why, and what is the fix?",
  "answer": "Yes. LakebasePool sets autocommit=True on its connections (line 448), so the first INSERT committed on its own. The fix is to wrap both statements in with conn.transaction():, which makes them one all-or-nothing unit."
}
```

```check
{
  "question": "Why does AsyncLakebasePool run _mint_token with run_in_executor instead of calling it directly?",
  "answer": "_mint_token calls the Databricks SDK, which makes a blocking HTTP request. Called directly in a coroutine, it would block the event loop thread and every other request for the length of the call. run_in_executor runs it in a worker thread, and the coroutine awaits the result."
}
```

```check
{
  "question": "When should you write your own psycopg_pool setup instead of using LakebasePool?",
  "answer": "When its fixed choices do not fit: you need a database other than databricks_postgres, a fixed user name instead of the inferred one, or psycopg's default transaction mode instead of autocommit. The docs' example shows the pattern: a connection class whose connect mints a token and sets the password. Add a token cache and a check callback yourself."
}
```

## 10. Links

- Previous: [L2: Lakebase as an App resource](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource)
- Next: [L4: Lakebase vs Delta](/notes/platforms/databricks/05-lakebase/l4-lakebase-vs-delta)
- Pools in general: [Connection pools](/notes/databases/postgres/03-python-driver/l2-connection-pools)
- The psycopg basics: [psycopg basics](/notes/databases/postgres/03-python-driver/l1-psycopg-basics)
- Blocking calls and the loop: [Sync code calling async code](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code)
- Checkpoints on the same pool: [Checkpointers and threads](/notes/ai/langchain-langgraph/04-persistence/l2-checkpointers-and-threads)
- [Glossary](/notes/platforms/databricks/glossary)
