---
title: "6.4 Connecting Python and FastAPI to PostgreSQL"
order: 4
summary: "Connect with psycopg 3, pass values as parameters, group changes in transactions, reuse connections with a pool, and lend one connection to each FastAPI request."
status: not-started
tags: [postgresql, psycopg, sql-injection, transactions, connection-pool, fastapi]
---

## 1. The question this idea answers

Lessons 6.1 to 6.3 ran SQL by hand in `psql`. Your FastAPI service must run the same SQL from Python, for every request. Five questions follow:

1. Where does the program find the database address and password, without a secret in the code?
2. How does a value from the user (a title, an id) get into the SQL safely?
3. How do two changes happen "both or neither"?
4. How does the service avoid a new connection for every request?
5. How does each request get a connection, and return it even when the request fails?

This lesson answers each one with psycopg 3, the current PostgreSQL driver for Python, and measures the answers.

## 2. Mental model

> [!analogy] Phone lines to the database
> A **connection** is an open phone line to the database server. Opening a line takes time: dial, wait, prove who you are. A **transaction** is one call in which nothing counts until you say "confirm" (commit). If you hang up without "confirm", the server forgets the call (rollback). A **pool** is a desk with a few lines that stay open. Each request borrows a line, uses it, and returns it.
>
> **Where it stops working:** a phone line has no memory of the last caller. A database connection does. It can hold an open transaction and session settings. If one request returns a line in the middle of a transaction, the next request inherits that transaction. The pool prevents this. It ends any open transaction when a connection returns to the pool.

## 3. Terms

| Term | Plain meaning |
|---|---|
| driver | A library that speaks the network protocol of the database. psycopg is the driver for PostgreSQL. |
| psycopg 3 | The current PostgreSQL driver for Python. The package name is `psycopg`. |
| connection | An open session with the database server. It has its own transaction state. |
| connection string | One string with the address, user, password and database name, for example `postgresql://user:password@host:5432/notes`. |
| cursor | The object that runs a statement and holds its result rows. `conn.execute()` makes one for you. |
| placeholder | A marker such as `%s` in the SQL text where the driver puts a value. |
| query parameter | A value that you pass next to the SQL text, not inside it. The driver sends it separately. |
| SQL injection | An attack where user input changes the meaning of a SQL statement. |
| transaction | A group of statements that the database applies completely or not at all. |
| commit | Make the changes of the current transaction permanent. |
| rollback | Discard the changes of the current transaction. |
| connection pool | A set of open connections that many requests share. |
| row factory | A psycopg setting that chooses the type of each result row, for example a dict. |
| ORM | Object-relational mapper: a library that maps Python classes to tables, for example SQLAlchemy or SQLModel. |

## 4. How it works

The outputs come from a sandbox run on 2026-10-19: PostgreSQL 16.15, psycopg 3.3.6, psycopg-pool 3.3.3, FastAPI 0.149.0. The data is the seed set of [6.2](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql/l2-sql-queries).

### 4.1 The connection string comes from the environment

```python
import os

DATABASE_URL = os.environ["DATABASE_URL"]   # for example postgresql://notes_app:secret@localhost:5432/notes
```

- The string holds a password, so it never goes into the source code or into Git ([7.3](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m07-git/l3-history-gitignore-readme-and-review)).
- `os.environ["DATABASE_URL"]` raises `KeyError` at start when the variable is missing. That is good: the service stops at once with a clear error, not later with a confusing one ([1.7](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l7-files-paths-env-and-json)).
- The parts of the URL: `postgresql://` is the scheme, `notes_app` the user and `secret` the password. `localhost:5432` is the host and the port (5432 is the default). `notes` is the database name.

### 4.2 Connect and run a query

```python
import psycopg
from psycopg.rows import dict_row

with psycopg.connect(DATABASE_URL, row_factory=dict_row) as conn:
    rows = conn.execute(
        "SELECT id, title FROM notes WHERE user_id = %s ORDER BY created_at DESC LIMIT %s",
        (2, 2),
    ).fetchall()
    print(rows)
```

```text
[{'id': 9, 'title': 'Freezer alarm'}, {'id': 7, 'title': 'Label error'}]
```

1. `psycopg.connect(...)` opens a connection. The psycopg docs say that it "creates a new database session and returns a new `Connection` instance" (checked on 2026-10-19).
2. `row_factory=dict_row` makes each row a dict. Without it, each row is a tuple such as `(9, 'Freezer alarm')`.
3. `conn.execute(sql, params)` makes a cursor and runs the statement. The SQL text has two `%s` placeholders. The tuple `(2, 2)` holds the two values, in order.
4. `.fetchall()` returns all result rows as a list. `.fetchone()` returns one row or `None`.

### 4.3 Parameters stop SQL injection

A user sends the "email" `x' OR '1'='1`. The run compared two ways to put it into a query:

```python
evil = "x' OR '1'='1"
unsafe_sql = f"SELECT count(*) FROM users WHERE email = '{evil}'"      # NEVER DO THIS
conn.execute(unsafe_sql)
conn.execute("SELECT count(*) FROM users WHERE email = %s", (evil,))   # the safe way
```

```text
unsafe SQL text: SELECT count(*) FROM users WHERE email = 'x' OR '1'='1'
unsafe result: 4 rows match
safe result:   0 rows match
```

The f-string pasted the input into the SQL text. The quote character in the input ended the string, and `OR '1'='1'` became part of the condition. The condition was true for all 4 users. A login check written this way lets anyone in. With a parameter, the driver sends the value separately from the SQL text. The database treats the whole input as one email address, and no user has it.

The psycopg documentation has a page "Passing parameters to SQL queries" (checked on 2026-10-19). One of its sections has the title "**Never** use `%` or `+` to merge values into queries". Its example carries the code comment "NEVER DO THIS".

> [!trap] Three details of psycopg parameters
> 1. The placeholder is always `%s`, also for numbers and dates. Do not write `%d`.
> 2. The parameters must be a sequence. One value needs a one-element tuple with a comma: `(evil,)`. The value `(evil)` is only a string in brackets.
> 3. Parameters hold **values**, never table or column names. For a name that must change at run time, use `psycopg.sql.Identifier`, and accept only names from a fixed list.

> [!key] Why this matters for AI systems
> An NL2SQL agent or a tool that builds SQL from model output faces the same attack. The model output is untrusted input. Pass values as parameters. Give the database user only the rights it needs. Never run raw SQL text from a model on a writable connection.

### 4.4 Transactions: both changes or none

A transaction groups statements. The database applies all of them, or none of them. The run inserted two notes in one transaction. The second insert used a user id that does not exist:

```python
with psycopg.connect(DATABASE_URL) as conn:
    with conn.transaction():
        conn.execute("INSERT INTO notes (user_id, title) VALUES (%s, %s)", (1, "part one"))
        conn.execute("INSERT INTO notes (user_id, title) VALUES (%s, %s)", (99, "part two"))
```

```text
error: ForeignKeyViolation - insert or update on table "notes" violates foreign key constraint "notes_user_id_fkey"
notes before: 10 after: 10
```

The first insert succeeded, but the error in the second one caused a rollback of the whole transaction. The table still had 10 notes. Without the transaction block, "part one" could stay without "part two".

psycopg also commits for you at the end of a connection block. The docs (checked on 2026-10-19) say:

- "When the block is exited, if there is a transaction open, it will be committed."
- "If an exception is raised within the block the transaction is rolled back."
- "In both cases the connection is closed."

The run checked the opposite case too. A connection that inserted a row and then closed without a commit and without a `with` block lost the row: a count afterwards returned 0. A connection in a `with` block committed its row: the count returned 1.

[Transactions](/notes/databases/postgres/02-transactions/l1-transactions) explains what a transaction guarantees in depth.

### 4.5 A connection pool

Each new connection costs time: a network connection, often TLS, and a login. The run timed 50 queries each way, over a local Unix socket with no TLS:

```text
new connection per query: 4.56 ms | pooled connection: 0.14 ms (local Unix socket, no TLS)
```

A pool keeps connections open and lends them out. Over a real network with TLS, the gap is larger. A pool also limits how many connections the service opens. The database server has a fixed maximum, and each connection uses memory on the server.

```python
from psycopg_pool import ConnectionPool

pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=5, open=True)
with pool.connection() as conn:    # borrow a connection
    conn.execute("SELECT 1")
# here the connection is back in the pool
```

`pool.connection()` behaves like `psycopg.connect()` in a `with` block: it commits on success and does a rollback on an exception. Then it returns the connection to the pool instead of closing it. [Connection pools](/notes/databases/postgres/03-python-driver/l2-connection-pools) covers sizing and timeouts.

### 4.6 One connection per request in FastAPI

The service opens the pool once, at start, in the lifespan ([4.3](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l3-dependencies-lifespan-config-and-middleware)). A dependency with `yield` lends one connection to each request:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=5, open=True,
                                    kwargs={"row_factory": dict_row})
    yield
    app.state.pool.close()

app = FastAPI(lifespan=lifespan)

def get_conn(request: Request) -> Iterator[psycopg.Connection]:
    with request.app.state.pool.connection() as conn:   # commit on success, rollback on error
        yield conn

Conn = Annotated[psycopg.Connection, Depends(get_conn)]

@app.get("/users/{user_id}/notes")
def list_notes(user_id: int, conn: Conn, limit: int = 5):
    user = conn.execute("SELECT id FROM users WHERE id = %s", (user_id,)).fetchone()
    if user is None:
        raise HTTPException(status_code=404, detail="user not found")
    return conn.execute(
        "SELECT id, title FROM notes WHERE user_id = %s ORDER BY created_at DESC LIMIT %s",
        (user_id, limit),
    ).fetchall()
```

The run called the endpoint twice with `TestClient` and logged each step of the pool and the dependency:

```text
200 [{'id': 9, 'title': 'Freezer alarm'}, {'id': 7, 'title': 'Label error'}]
404 {'detail': 'user not found'}
['pool opened', 'connection lent', 'connection returned', 'connection lent', 'connection returned', 'pool closed']
```

A second run checked the error path. An endpoint inserted a note and then raised `HTTPException(status_code=400)`. The response was 400, and a count afterwards found 0 rows with that title. The exception reached the `with` block of the dependency, so the pool did a rollback, and the insert disappeared.

```mermaid
sequenceDiagram
    participant C as Client
    participant F as FastAPI
    participant D as get_conn dependency
    participant P as Pool
    participant DB as PostgreSQL
    C->>F: GET /users/2/notes
    F->>D: run until yield
    D->>P: pool.connection()
    P-->>D: an open connection
    D-->>F: yield conn
    F->>DB: SELECT ... WHERE user_id = 2
    DB-->>F: rows
    F-->>C: 200 and JSON
    F->>D: resume after yield
    D->>P: commit, give the connection back
```

> [!trap] Code after yield does not run when the endpoint raises
> In the first version of the test, the log line "connection returned" came after the `with` block. On the 404 path that line did not run, because the exception from the endpoint passes through the dependency at the `yield`. The connection still returned to the pool, because the `with` block of the pool handles the exception. Put cleanup in a `with` block or a `finally` block, never in plain lines after `yield`.

> [!trap] A sync driver inside async def blocks the event loop
> The endpoint above uses `def`, so FastAPI runs it in a worker thread, and the blocking psycopg calls do not stop other requests ([4.4](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l4-def-vs-async-def-endpoints)). Do not call a sync `Connection` from an `async def` endpoint. For `async def`, use psycopg's async API: `psycopg.AsyncConnection` and `psycopg_pool.AsyncConnectionPool`, with `await`.

### 4.7 Raw SQL or an ORM

An ORM maps Python classes to tables and writes most SQL for you. The FastAPI tutorial "SQL (Relational) Databases" uses SQLModel, which is built on SQLAlchemy and Pydantic (from the roadmap research, 2026-10-18). An ORM saves code in a large app. It also hides the SQL, and the SQL decides the speed ([6.3](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql/l3-indexes-and-explain)). In this level, write the SQL by hand. When you later use an ORM, you can read the SQL that it makes and judge it.

### 4.8 The same skills on a managed platform

Managed PostgreSQL services run the server for you. You still connect with a connection string, pass parameters and use transactions. In Databricks, Lakebase is a managed PostgreSQL that apps reach with `psql` or any PostgreSQL driver (from the roadmap research of 2026-10-18, Databricks documentation). The code of this lesson works there with a different connection string and a different way to get the password. [Databricks Apps](/notes/platforms/databricks/01-apps/l1-databricks-apps) shows the app side.

## 5. Code walkthrough

The dependency `get_conn` is short, but each line carries one rule:

| Line | What it does | Data in and out | What breaks without it |
|---|---|---|---|
| `def get_conn(request: Request) -> Iterator[psycopg.Connection]:` | A generator function that FastAPI uses as a dependency. | In: the request. Out: one connection, through `yield`. | Without the `Request` parameter, the function cannot reach the pool in `app.state`. |
| `with request.app.state.pool.connection() as conn:` | Borrows a connection from the pool that the lifespan made. | In: the pool. Out: an open connection. | A new connection per request costs time and can exceed the server's connection limit. |
| `yield conn` | Gives the connection to the endpoint and pauses here until the response is ready. | The endpoint receives `conn`. | With `return` instead of `yield`, the `with` block ends before the endpoint runs, and the connection is already back in the pool. |
| end of the `with` block | Commits on success, does a rollback on an exception, returns the connection to the pool. | Out: nothing. The pool gets the connection. | Without it, a failed request can leave an open transaction on a shared connection. |
| `Conn = Annotated[psycopg.Connection, Depends(get_conn)]` | A reusable type for "a connection from the dependency". | | Each endpoint must repeat `Depends(get_conn)`. |

The endpoint uses `%s` placeholders for both values, checks for a missing user and returns 404, and uses `ORDER BY` with `LIMIT` ([6.2](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql/l2-sql-queries)).

## 6. Exercises

Runs in: your local practice project, with a local PostgreSQL and the FastAPI app of module 4. Hints come in three levels in chat: idea, pseudocode, partial code.

**Exercise 6.4a: a repository module.** Write `repository.py` with four functions that take a connection: `create_note`, `get_note`, `list_notes(user_id, limit)` and `delete_note`. Use only `%s` placeholders.

Acceptance tests (pytest):

- `create_note` returns the new row with its `id`, with `RETURNING`.
- `get_note` returns `None` for an id that does not exist.
- A test calls `list_notes` with the "user id" `"1 OR 1=1"` and gets an error or zero rows, never all notes.
- A text search for the email `x' OR '1'='1` matches 0 users.

**Exercise 6.4b: the notes API on PostgreSQL.** Replace the in-memory store of your module 4 notes API with PostgreSQL. Open a pool in the lifespan and lend one connection per request.

Acceptance tests:

- A note that you create still exists after you stop and start the server.
- `GET /notes/{id}` for a missing id returns 404 in your error shape.
- An endpoint that inserts and then fails a later check leaves no row behind.
- Without `DATABASE_URL`, the service stops at start with one clear log line.
- `grep` over the repository finds no password and no connection string.

## 7. Common mistakes

1. **An f-string or `+` to put values into SQL.** This is SQL injection. Use `%s` and a parameter tuple.
2. **`(value)` instead of `(value,)`** for one parameter. psycopg then receives a string, not a tuple.
3. **`%d` or `'%s'` with quotes** in the SQL text. The placeholder is always a bare `%s`. The driver adds the quotes.
4. **A new connection for every query.** It costs milliseconds each time and can exceed the server's limit. Use a pool.
5. **Two related changes without a transaction.** A failure between them leaves half the change.
6. **Cleanup after `yield` without `with` or `finally`.** It does not run when the endpoint raises.
7. **A sync driver in an `async def` endpoint.** It blocks the event loop. Use `def`, or the async API.
8. **The connection string in the code or in Git.** Read it from the environment.

## 8. One-minute explanation

psycopg 3 connects Python to PostgreSQL. The connection string comes from an environment variable, so no password lives in the code. You run SQL with `conn.execute(sql, params)`, where the SQL text holds `%s` placeholders and the values travel separately. That stops SQL injection: in the sandbox, an f-string query with the input `x' OR '1'='1` matched all 4 users, and the parameter version matched none. A transaction applies a group of statements completely or not at all, and psycopg's `with` block commits on success and does a rollback on an exception. Opening a connection costs time (4.56 ms against 0.14 ms from a pool on a local socket), so a service keeps a pool. In FastAPI, the lifespan opens the pool. A dependency with `yield` lends one connection to each request inside a `with` block. So the connection always returns to the pool, and a failed request leaves no half-written data.

## 9. Check questions

```check
{
  "question": "The input `x' OR '1'='1` arrives as an email. Why does `f\"SELECT * FROM users WHERE email = '{email}'\"` match every user, while `conn.execute(\"SELECT * FROM users WHERE email = %s\", (email,))` matches none?",
  "answer": "The f-string pastes the input into the SQL text. The quote in the input closes the string literal, and OR '1'='1' becomes part of the WHERE condition, which is then true for every row. With a parameter, the driver sends the SQL text and the value separately. The database treats the whole input as one value of email, and no user has that email."
}
```

```check
{
  "question": "A request handler runs two INSERT statements on a pooled connection. The second fails. What is in the table afterwards if the handler uses the get_conn dependency of this lesson, and why?",
  "hint": "What does the with block of pool.connection() do on an exception?",
  "answer": "Neither row. Both inserts run in the same transaction on the borrowed connection. The exception passes through the dependency at the yield, and the with block of pool.connection() does a rollback of the transaction before it returns the connection to the pool. The sandbox run showed 0 rows for an insert followed by an HTTPException."
}
```

```check
{
  "question": "Why does a FastAPI service create the connection pool in the lifespan and not inside each request?",
  "answer": "Opening a connection costs a network round trip, often TLS, and a login (4.56 ms per query against 0.14 ms with a pool in the sandbox, on a local socket). One shared pool also limits the total number of connections to the database server. A pool created per request would open new connections every time and never reuse them."
}
```

```check
{
  "question": "A teammate moves the line app.state.pool.close() out of the lifespan and calls conn.close() at the end of every endpoint instead. Name one problem.",
  "answer": "A connection from pool.connection() belongs to the pool. Closing it by hand destroys a pooled connection, so the pool must open new ones and loses its benefit. The endpoint also skips the commit or rollback logic of the with block if it closes early, and an exception before the close leaks the connection. Let the with block in the dependency return the connection, and close the pool once at shutdown."
}
```

## 10. Links

- Previous: [6.3 Indexes and EXPLAIN ANALYZE](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql/l3-indexes-and-explain)
- Next module: [M7 Git and collaboration](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m07-git)
- Deeper: [psycopg basics](/notes/databases/postgres/03-python-driver/l1-psycopg-basics), [Connection pools](/notes/databases/postgres/03-python-driver/l2-connection-pools), [Transactions](/notes/databases/postgres/02-transactions/l1-transactions), [Isolation and upserts](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts)
- FastAPI side: [4.3 Dependencies, lifespan, settings and middleware](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l3-dependencies-lifespan-config-and-middleware), [4.4 def vs async def endpoints](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l4-def-vs-async-def-endpoints)
- Sources (checked on 2026-10-19): psycopg 3 "Basic module usage", https://www.psycopg.org/psycopg3/docs/basic/usage.html, and "Passing parameters to SQL queries", https://www.psycopg.org/psycopg3/docs/basic/params.html
- [Glossary](/notes/ai/ai-engineering/glossary)
