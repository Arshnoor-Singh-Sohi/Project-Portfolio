---
title: "L1: psycopg 3 basics"
order: 1
summary: "How Python talks to PostgreSQL with psycopg 3: connect, conn.execute and cursors, parameters with %s and %(name)s, a real SQL injection on a test table, Jsonb, dict_row, transactions and autocommit, the error classes by SQLSTATE, and AsyncConnection in brief. Every example ran against PostgreSQL 16 with psycopg 3.3.6."
status: not-started
tags: [postgres, psycopg, python, parameters, sql-injection, jsonb, transactions, errors]
---

## 1. The question this idea answers

An agent backend must save chat turns, read a user's chat list and record stock moves from Python. Each of these needs the same five things. Open a session with the database. Send SQL with values from the request. Read rows as Python objects. Decide where each transaction starts and ends. React to each kind of error in the right way.

The driver does this work. In Python the current driver is **psycopg 3** (package `psycopg`, version 3.3.6, checked on 2026-10-13). This lesson shows each of the five things with real output, and one bug that every engineer must recognize: SQL built with Python string formatting.

## 2. Mental model

> [!analogy] A printed form with blank fields
> The SQL text is a printed form: "Show the chats of owner ____." The values are what the clerk writes in the blank. The clerk at the database reads the printed text as the instruction, and reads whatever is in the blank only as data. A value can never change the instruction.
>
> String formatting is different. It writes the value into the printed text before the form reaches the clerk. A value such as `x' OR '1'='1` then becomes part of the instruction: "Show the chats of owner x, or of everyone."
>
> **Where it stops working:** a blank can hold only a value. It cannot hold a table name, a column name or a keyword. For those parts, psycopg has a separate tool, the `psycopg.sql` module, which quotes names safely.

## 3. Terms

| Term | Plain meaning |
|---|---|
| driver | The library that speaks the PostgreSQL network protocol for a programming language. |
| connection | One open session with the server. The server runs one backend process for it. |
| conninfo | The connection string, as keywords (`host=... dbname=...`) or as a URI (`postgresql://...`). |
| cursor | The object that sends one query and holds its result rows. |
| placeholder | A marker in the SQL text where a value goes: `%s` or `%(name)s` in psycopg. |
| parameter | A value that the driver sends separately from the SQL text. |
| server-side binding | The server receives the SQL with `$1`, `$2` markers and the values separately, and joins them itself. |
| SQL injection | An attack in which a value changes the meaning of the SQL, because the code put the value into the SQL text. |
| adaptation | The conversion between Python objects and PostgreSQL values, in both directions. |
| `Jsonb` | The psycopg wrapper that tells the driver to send a Python object as `jsonb`. |
| row factory | The function that decides the Python shape of each row: tuple, dict, named tuple. |
| transaction status | The state of the connection: `IDLE`, `INTRANS` (in a transaction) or `INERROR` (in a failed transaction). |
| idle in transaction | A server state: the session has an open transaction and waits for the client. |
| SQLSTATE | The five-character error code that the server sends with every error, for example `23505`. |
| `AsyncConnection` | The `asyncio` version of the connection. Its methods are coroutines that you `await`. |

## 4. Method and math

### 4.1 Install and connect

The install docs (checked on 2026-10-13) give: `pip install "psycopg[binary]"`. "This will install a self-contained package with all the libraries needed."

`psycopg.connect()` has this signature in 3.3.6:

```text
connect(conninfo='', *, autocommit=False, prepare_threshold=5, context=None,
        row_factory=None, cursor_factory=None, **kwargs)
```

The `conninfo` can be keywords or a URI. Extra keyword arguments, such as `password=...`, are added to it.

```python
DSN = "host=/var/tmp/pgtest port=5433 user=postgres dbname=pg"   # keywords, Unix socket
URI = "postgresql://postgres@127.0.0.1:5433/pg"                  # the same server as a URI

conn = psycopg.connect(DSN)
print(type(conn).__name__, conn.autocommit, conn.info.transaction_status.name)
```

```text
Connection False IDLE
```

### 4.2 conn.execute and cursors

The usage page describes the cursor: it can "send commands to the database using methods such as `execute()` and `executemany()`" and "retrieve data ... using methods such as `fetchone()`, `fetchmany()`, `fetchall()`". The `Connection.execute()` shortcut is "equivalent to creating a cursor, calling its `execute()` method, and returning it."

```python
cur = conn.execute(
    "INSERT INTO plants (code, name) VALUES (%s, %s), (%s, %s) RETURNING plant_id",
    ("BRA", "Brampton", "MIS", "Mississauga"))
print(type(cur).__name__, cur.fetchall(), cur.rowcount, conn.info.transaction_status.name)
conn.commit()
```

```text
Cursor [(1,), (2,)] 2 INTRANS
```

The insert left the connection `INTRANS`. Section 4.7 explains why. Use `conn.execute()` for one statement. Use `with conn.cursor() as cur:` when you run several statements and fetch rows step by step, or when you need `executemany()`. In the test, `cur.executemany(..., [(1, d, 5), (1, d, 6), (1, d, 7)])` gave `rowcount` 3.

> [!note] One connection runs one query at a time
> The concurrency page: "`Connection` objects *are thread-safe*", but "`Cursor` objects *are not thread-safe*". Also: "only one cursor at time will be able to run a query on the same connection". All cursors of one connection share one transaction. For parallel work, use several connections, usually from a pool ([L2](/notes/databases/postgres/03-python-driver/l2-connection-pools)).

### 4.3 Parameters

The params page: pass values "by using `%s` placeholders in the SQL statement, and passing a sequence of values as the second argument". "Named arguments are supported too using `%(name)s` placeholders in the query and specifying the values into a mapping."

```python
conn.execute(
    """INSERT INTO shipments (plant_id, shipped_on, quantity, status)
       VALUES (%(plant)s, %(day)s, %(qty)s, 'shipped'), (%(plant)s, %(day)s, %(qty)s, 'planned')""",
    {"plant": 2, "day": datetime.date(2026, 10, 12), "qty": 15})
```

Named placeholders let one value appear in several places. The test also ran the wrong forms that the docs warn about. These are the real errors:

| Call | Result |
|---|---|
| `conn.execute("SELECT %s", "bar")` | `TypeError: query parameters should be a sequence or a mapping, got str` |
| `conn.execute("SELECT %s", ("bar"))` | The same `TypeError`. `("bar")` is a string, not a tuple. |
| `conn.execute("SELECT %s", ("bar",))` | `[('bar',)]` |
| `conn.execute("SELECT %d", (10,))` | `ProgrammingError: only '%s', '%b', '%t' are allowed as placeholders, got '%d'` |
| `conn.execute("SELECT '%s'", ("x",))` | `IndeterminateDatatype: could not determine data type of parameter $1` |

A literal `%` in a query with parameters must be written `%%`.

**What the server receives.** The docs: "the parameters will not be really merged to the query: query and the parameters are sent to the server separately". The test confirmed it. While a parameterized query ran, `pg_stat_activity` showed this text for it:

```text
SELECT chat_id, title FROM chat_owners_demo, pg_sleep(1) WHERE owner_id = $1
```

The value never appears in the SQL text. The server reads `$1` as data, whatever it contains.

### 4.4 Why string formatting is wrong: a real injection

The test table holds four chats of three owners. One function builds the SQL with an f-string. The other passes a parameter.

```python
def list_chats_wrong(conn, owner):
    return conn.execute(f"SELECT chat_id, owner_id, title FROM chat_owners_demo WHERE owner_id = '{owner}'").fetchall()

def list_chats_right(conn, owner):
    return conn.execute("SELECT chat_id, owner_id, title FROM chat_owners_demo WHERE owner_id = %s", (owner,)).fetchall()
```

| Input `owner` | f-string version | Parameter version |
|---|---|---|
| `ana` | Ana's 2 chats | Ana's 2 chats |
| `x' OR '1'='1` | **All 4 chats**, also Ben's "Payroll questions" | `[]` |
| `O'Brien` | `SyntaxError: syntax error at or near "Brien"` | `[]` |
| `x'; DELETE FROM chat_owners_demo; --` | `[]`, and the table now has **0 rows** | `[]` |

The second row is a data leak. The f-string produced `WHERE owner_id = 'x' OR '1'='1'`, which is true for every row. The fourth row is data loss. The f-string produced two statements. A query with no parameters goes to the server with the simple query protocol, and the psycopg source (`_cursor_base.py`) says why it uses that protocol: "it can execute more than one statement in a single query." The server ran both statements.

With parameters, two statements in one call are refused. The docs show the error: `cannot insert multiple commands into a prepared statement`. The test got the same text.

> [!trap] Model output is untrusted input
> In an agent, values often come from a model: a tool argument such as a plant code or a date. A model can be tricked by text in a document or a web page. Treat every tool argument like a form field from the internet: parameters only, never formatting.

**Names are not values.** A placeholder cannot replace a table name, a column name or a `SET` value. The docs show `SET TimeZone TO %s` failing, and the test got the same `syntax error at or near "$1"` for `SET lock_timeout = %s`. Use the tools that the docs name:

- For names: `sql.SQL("INSERT INTO {} VALUES (%s)").format(sql.Identifier("numbers"))`.
- For settings: `SELECT set_config('lock_timeout', %s, false)`, which takes a normal parameter.

### 4.5 Types in and out

psycopg converts common types in both directions. The test read one shipment row:

| PostgreSQL type | Python object in the test |
|---|---|
| `date` | `datetime.date(2026, 10, 12)` |
| `timestamptz` | `datetime.datetime` with `tzinfo` = `America/New_York`, the session time zone |
| `uuid` | `uuid.UUID` |
| `jsonb` | `list` or `dict` |

JSON needs a wrapper on the way in. The adaptation page: "Psycopg requires you to wrap the object to dump as JSON into a wrapper: either `psycopg.types.json.Json` or `Jsonb`."

```python
from psycopg.types.json import Jsonb

parts = [{"type": "text", "text": "How many orders shipped on 2026-10-11?"}]
conn.execute("INSERT INTO messages (id, chat_id, seq, role, parts) VALUES (%s, %s, 1, 'user', %s)",
             (uuid.uuid4(), chat_id, Jsonb(parts)))
```

| Value passed for a `jsonb` column | Result |
|---|---|
| `Jsonb(parts)` | Stored. A read returns a Python `list` of `dict`. |
| `parts` (a list of dicts, no wrapper) | `ProgrammingError: cannot adapt type 'dict' using placeholder '%s' (format: AUTO)` |
| `["a", "b"]` (a list of strings, no wrapper) | psycopg sends a PostgreSQL array: `invalid input syntax for type json` |

### 4.6 Row factories

By default, a row is a tuple. A row factory changes this. The docs example runs `SELECT 10 AS foo, 'hello' AS bar` on a cursor with `row_factory=dict_row` and gets `{'foo': 10, 'bar': 'hello'}`.

```python
from psycopg.rows import dict_row

with conn.cursor(row_factory=dict_row) as cur:
    print(cur.execute("SELECT code, name FROM plants ORDER BY plant_id").fetchall())
```

```text
[{'code': 'BRA', 'name': 'Brampton'}, {'code': 'MIS', 'name': 'Mississauga'}]
```

You can also pass `row_factory=dict_row` to `connect()` for every cursor of the connection. Dict rows are a good shape for JSON responses and for tool results.

### 4.7 Transactions and autocommit

L1 of Part 2 showed the rule: "by default, any database operation will start a new transaction". The test watched the server side with `pg_stat_activity`:

| Step | `conn.info.transaction_status` | Server `state` |
|---|---|---|
| Default connection, after `SELECT 1` | `INTRANS` | `idle in transaction` |
| After `conn.commit()` | `IDLE` | `idle` |
| `autocommit=True`, after `SELECT 1` | `IDLE` | `idle` |
| `autocommit=True`, inside `with conn.transaction():` after a statement | `INTRANS` | `idle in transaction` |
| After that block | `IDLE`, and `tx.status` = `COMMITTED` | `idle` |

The docs warn: "By default even a simple `SELECT` will start a transaction: in long-running programs, if no further action is taken, the session will remain *idle in transaction*, an undesirable condition for several reasons (locks are held by the session, tables bloat...)."

The docs also give a preference that "several experienced developers" share: use a connection block, use an autocommit connection, and "use `with conn.transaction()` blocks to manage transactions only where needed."

> [!key] Autocommit plus explicit transaction blocks
> For a service, open connections with `autocommit=True`. Wrap each group of writes that must succeed together in `with conn.transaction():`. Then no read leaves a transaction open by accident, and every transaction has a visible start and end in the code.

### 4.8 Errors

Every psycopg exception derives from `psycopg.Error`. Server errors also get a class for their SQLSTATE: "Psycopg exposes a different class for each SQLSTATE value". Each class is "a subclass of one of the standard DB-API exception", so `except psycopg.IntegrityError` also catches all the constraint errors.

| Class in `psycopg.errors` | SQLSTATE | DB-API base | Message in the test |
|---|---|---|---|
| `UniqueViolation` | `23505` | `IntegrityError` | `duplicate key value violates unique constraint "plants_code_key"` |
| `ForeignKeyViolation` | `23503` | `IntegrityError` | `insert or update on table "shipments" violates foreign key constraint "shipments_plant_id_fkey"` |
| `CheckViolation` | `23514` | `IntegrityError` | `new row for relation "shipments" violates check constraint "shipments_quantity_check"` |
| `NotNullViolation` | `23502` | `IntegrityError` | `null value in column "name" of relation "plants" violates not-null constraint` |
| `UndefinedTable` | `42P01` | `ProgrammingError` | `relation "no_such_table" does not exist` |
| `SerializationFailure` | `40001` | `OperationalError` | ([Part 2, L2](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts)) |

The exception carries the details in `e.diag`. For the duplicate plant, the test printed four fields: `sqlstate 23505`, `constraint_name plants_code_key`, `table_name plants` and `message_detail Key (code)=(BRA) already exists.` Use `constraint_name` to turn a database error into a clear application error, such as "plant code already exists".

On a default connection, the failed insert left the status `INERROR`. The next statement failed with `InFailedSqlTransaction: current transaction is aborted, commands ignored until end of transaction block`. Only `conn.rollback()` made the connection usable again. A `with conn.transaction():` block does this rollback for you when the exception leaves the block.

`psycopg.errors.lookup()` finds a class by code or by name: `lookup("23505")` and `lookup("UNIQUE_VIOLATION")` both returned `UniqueViolation`.

### 4.9 AsyncConnection in brief

An `asyncio` service, such as a FastAPI app, uses `AsyncConnection` ([event loop](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines)). The docs: "in order to use them you will only have to scatter the `await` keyword here and there." `connect()` is a coroutine, so the block needs `async with await`:

```python
async def count_shipments(plant_code: str) -> dict:
    async with await psycopg.AsyncConnection.connect(DSN, row_factory=dict_row) as aconn:
        cur = await aconn.execute(
            """SELECT %(code)s AS plant, count(s.*) AS shipments
                 FROM plants p LEFT JOIN shipments s USING (plant_id), pg_sleep(0.5)
                WHERE p.code = %(code)s""", {"code": plant_code})
        return await cur.fetchone()

rows = await asyncio.gather(count_shipments("BRA"), count_shipments("MIS"))
```

```text
[{'plant': 'BRA', 'shipments': 4}, {'plant': 'MIS', 'shipments': 2}] 0.51 s
```

Two connections ran two 0.5 s queries in 0.51 s. A second test ran four 0.5 s queries as four tasks on **one** `AsyncConnection`: 2.00 s. The docs say why: tasks on one connection "will have their access to the connection serialized". Concurrency needs several connections.

> [!note] Windows
> The async page: "On Windows, Psycopg is not compatible with the default `ProactorEventLoop`. Please use a different loop, for instance the `SelectorEventLoop`."

### 4.10 Production view

| Concern | What to do |
|---|---|
| Security | Parameters for every value. `psycopg.sql.Identifier` for names. Never f-strings, `%` or `+` on SQL text. |
| Transactions | `autocommit=True` plus `with conn.transaction():` around each group of writes. |
| Locks and bloat | Watch for `idle in transaction` sessions in `pg_stat_activity`. |
| Errors | Catch specific classes (`UniqueViolation`, `SerializationFailure`). Map `diag.constraint_name` to clear messages. |
| JSON | Wrap with `Jsonb`. A read returns Python lists and dicts. |
| Concurrency | One connection runs one query at a time. Use a pool for parallel requests. |
| Connect cost | Each `connect()` opens a new server process. A service reuses connections through a pool ([L2](/notes/databases/postgres/03-python-driver/l2-connection-pools)). |

## 5. Code

Put the work in `postgres/06-psycopg.ipynb`, with your local PostgreSQL 16 server.

**Exercise 1.1: a safe chat list.** Use the `chats` table of [Chats, messages and parts](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts). Write `list_chats(conn, owner_id)` that returns a list of dicts with `id`, `title` and `updated_at`, newest first.

Acceptance tests:

- The input `x' OR '1'='1` returns `[]`, and so does `O'Brien` when no such owner exists.
- After a call with `x'; DELETE FROM chats; --`, the row count of `chats` is unchanged.
- Each row is a `dict`, and `updated_at` has a `tzinfo`.

**Exercise 1.2: parts round trip.** Write `save_message(conn, chat_id, seq, role, parts)` and `load_messages(conn, chat_id)`.

Acceptance tests:

- The loaded `parts` equal the saved Python list, element by element and in order.
- Passing `parts` without `Jsonb` inside your function is impossible: the function wraps it.

**Exercise 1.3: errors to meaning.** Write `create_plant(conn, code, name)` that raises your own `PlantCodeTaken` for a duplicate code, and lets every other error pass through.

Acceptance tests:

- A duplicate code raises `PlantCodeTaken`, and the check uses `diag.constraint_name`.
- After the error, the same connection runs `SELECT 1` with no `InFailedSqlTransaction`.

**Exercise 1.4: find the open transaction.** Write a test helper that returns the server `state` of a connection from `pg_stat_activity`.

Acceptance test: a default connection after one `SELECT` reports `idle in transaction`, and an autocommit connection reports `idle`.

## 6. Common mistakes

1. **Building SQL with f-strings.** A value becomes code. Use `%s` parameters.
2. **Quoting the placeholder: `'%s'`.** The driver handles quoting. Write `%s` with no quotes.
3. **One value without a tuple: `(value)`.** Write `(value,)` or `[value]`.
4. **Passing a dict or a list of dicts for `jsonb` without `Jsonb`.** psycopg cannot adapt it.
5. **Forgetting that a SELECT opens a transaction.** The session stays `idle in transaction`. Use autocommit plus `conn.transaction()` blocks.
6. **Using the connection after an error without a rollback.** Every statement fails with `InFailedSqlTransaction` until `rollback()`.
7. **Many asyncio tasks on one AsyncConnection for speed.** Its queries run one at a time. Use several connections.

## 7. One-minute explanation

psycopg 3 is the PostgreSQL driver for Python. `psycopg.connect()` opens one session, and `conn.execute()` creates a cursor, runs one statement and returns the cursor for `fetchone()` or `fetchall()`. Values always go as parameters, `%s` with a tuple or `%(name)s` with a dict. psycopg sends the SQL with `$1` markers and the values separately, so a value can never change the statement. With an f-string, the input `x' OR '1'='1` returned every user's chats in the test, and a second input deleted the whole table. Wrap JSON with `Jsonb`, and use `dict_row` to receive rows as dicts. By default even a `SELECT` opens a transaction that stays open until you commit, so a service should use `autocommit=True` with `with conn.transaction():` around grouped writes. Errors come as classes per SQLSTATE, such as `UniqueViolation`, with details in `e.diag`, and an error inside a transaction requires a rollback. `AsyncConnection` gives the same API with `await`, but one connection still runs one query at a time.

## 8. Check questions

```check
{
  "question": "A tool function runs conn.execute(f\"SELECT * FROM shipments WHERE plant_code = '{code}'\"), where code comes from the model's tool call. Name two concrete things that can go wrong, and the fix.",
  "answer": "First, a value such as x' OR '1'='1 makes the WHERE clause true for every row, so the tool returns data that it should not return. Second, a value with a quote such as O'Brien breaks the SQL with a syntax error, and a value such as x'; DELETE FROM shipments; -- can run a second statement, because psycopg sends a query without parameters as plain text. The fix is conn.execute(\"SELECT * FROM shipments WHERE plant_code = %s\", (code,))."
}
```

```check
{
  "question": "A default psycopg connection runs one SELECT in a long-running worker and then waits for the next job. What does pg_stat_activity show for it, and why does it matter?",
  "answer": "It shows idle in transaction, because with autocommit=False even a SELECT starts a transaction that stays open until commit or rollback. An open transaction can hold locks and keeps old row versions alive, which makes tables bloat. Use autocommit=True, or end the transaction quickly."
}
```

```check
{
  "question": "Why does conn.execute(\"INSERT INTO messages (..., parts) VALUES (..., %s)\", (..., parts)) fail when parts is a Python list of dicts, and what is the fix?",
  "answer": "psycopg adapts a Python list as a PostgreSQL array and then cannot adapt its dict elements, so it raises ProgrammingError: cannot adapt type 'dict'. It cannot guess that the list is JSON. Wrap it: Jsonb(parts) from psycopg.types.json."
}
```

```check
{
  "question": "An insert raises UniqueViolation on a default connection, and the code catches the exception and runs the next query on the same connection. What happens, and how do you avoid it?",
  "answer": "The next query fails with InFailedSqlTransaction: current transaction is aborted, commands ignored until end of transaction block, because the failed statement aborted the transaction. Call conn.rollback() first, or run the insert inside with conn.transaction(): so that the block runs ROLLBACK automatically when the exception leaves it."
}
```

## 9. Links

- Previous: [Part 2, L2: Isolation and upserts](/notes/databases/postgres/02-transactions/l2-isolation-and-upserts)
- Next: [L2: Connection pools](/notes/databases/postgres/03-python-driver/l2-connection-pools)
- The tables used here: [Chats, messages and parts](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts)
- Untrusted tool input: [tool_use and tool_result](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result)
- [Glossary](/notes/databases/postgres/glossary)
