---
title: "L1: Ownership checks"
order: 1
summary: "A chat id is not a password. Every read and write of a chat, a message or a harness state must filter by the owner taken from the verified identity. Broken object level authorization (OWASP API1:2023), the SQL patterns, the client-chosen id trap, session and thread ids, 404 vs 403, tests that prove another user's chat is unreachable, and row-level security as a second layer. Every query ran on PostgreSQL 16."
status: not-started
tags: [conversation-state, security, authorization, bola, postgres, row-level-security]
---

## 1. The question this idea answers

A chat id travels everywhere. It is in the URL of the chat page, the browser history, the server logs, a screenshot in a team channel and a support ticket. So assume that other people can learn a chat id.

Now a request arrives: "show chat `a11ce000-...`". The service knows who sent the request. Does it also check that this person owns that chat? If one endpoint forgets, any user who knows an id can read another user's questions about costs, margins or staff. They can also write into the chat, rename it or delete it.

This lesson lists every place in a chat service where an id reaches the database. It gives the SQL pattern for each one, and tests that prove another user's chat is unreachable.

## 2. Mental model

> [!analogy] A room number and a key card
> A hotel room number is printed on the door. Anybody in the corridor can read it. The number names the room. It does not open it. The key card opens it, and the lock checks the card every time.
>
> A chat id is the room number. The owner check is the lock. The verified identity of the request is the key card.
>
> **Where it stops working:** a hotel door checks the card by itself, on every entry. In a service, each endpoint must run the check itself. A single endpoint that skips it is an open door, and the other locks do not help. And the key card must come from the front desk. An identity that the client simply states is a card that the guest printed at home ([self-asserted identity](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity)).

## 3. Terms

| Term | Plain meaning |
|---|---|
| authorization | The decision whether a known caller may do a requested action. |
| object-level authorization | An authorization check for one specific object, for example one chat. |
| BOLA | Broken object level authorization: an endpoint takes an object id and does not check that the caller may use that object. |
| IDOR | Insecure direct object reference: an older name for the same flaw. |
| owner | The user who owns a chat. Stored in `chats.owner_id`. |
| verified identity | The user id that the server takes from a checked token or a trusted proxy, never from the request body or the URL. |
| existence leak | A response that tells the caller that an object exists, even when the caller may not read it. |
| enumeration | Trying many ids to find objects that exist. |
| fail closed | When a check cannot run, the system denies access. |
| row-level security (RLS) | A PostgreSQL feature: policies on a table decide which rows a role can read or change. |
| policy | One RLS rule, for example "a row is visible when `owner_id` equals the current user". |
| defense in depth | Two or more independent checks, so that one mistake does not open access. |

## 4. Method and math

### 4.1 What OWASP says

The OWASP API Security Top 10 2023 puts this flaw first: "API1:2023 Broken Object Level Authorization" (checked on 2026-10-13). The page states the rule:

> "Every API endpoint that receives an ID of an object, and performs any action on the object, should implement object-level authorization checks."

It also warns about a check that looks correct but is not enough:

> "Comparing the user ID of the current session (e.g. by extracting it from the JWT token) with the vulnerable ID parameter isn't a sufficient solution to solve Broken Object Level Authorization (BOLA)."

In other words, the check must ask whether this user may act on **this object**. A match between the token's user id and a user id parameter is a different question.

Two of its prevention items:

1. "Use the authorization mechanism to check if the logged-in user has access to perform the requested action on the record in every function that uses an input from the client to access a record in the database."
2. "Prefer the use of random and unpredictable values as GUIDs for records' IDs."

The OWASP Authorization Cheat Sheet adds the limit of item 2: random or hidden ids are "generally not sufficient by itself". Random uuids make guessing hard. They do nothing against an id that leaked.

> [!key] A chat id is a name, not a password
> Random ids reduce guessing. Only an owner check on every request, with the owner from the verified identity, protects a chat.

### 4.2 Every place where an id reaches the database

A chat service touches more objects than "chats". Each row of this table needs its own check.

| Action | Id from the client | Owner check |
|---|---|---|
| List my chats | none | `WHERE owner_id = $owner` |
| Read one chat | chat id | Join `chats` and filter `owner_id` |
| Send a message (save a turn) | chat id | `UPDATE chats ... WHERE id = $chat AND owner_id = $owner RETURNING last_seq` ([L2.1, section 4.5](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts)) |
| Rename or delete a chat | chat id | `WHERE id = $chat AND owner_id = $owner`, then check the row count |
| Feedback on one answer | message id | The message's chat must belong to the owner |
| Create a chat with a client-made id | chat id | Insert, then check that the row is yours (section 4.4) |
| Resume the SDK session | none, if done right | Read `session_id` from the owned chat row |
| Continue a LangGraph thread | none, if done right | Derive `thread_id` from the owned chat id |
| Export or share a chat | chat id | Same as read, plus a separate share rule |

### 4.3 The SQL patterns

The tests used the `chats` and `messages` tables of [L2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts), with one chat for `alice@example.com` and one for `bob@example.com`.

**Read.** Join the chat row and filter by the owner in the same query:

```sql
SELECT m.seq, m.role, m.parts
  FROM messages m
  JOIN chats c ON c.id = m.chat_id
 WHERE c.id = $chat_id AND c.owner_id = $owner_id
 ORDER BY m.seq;
```

Zero rows means "no such chat for this owner". The service answers 404 (section 4.6).

**Write.** The save transaction already checks the owner in its first statement. If the `UPDATE` returns no row, the code ends the transaction with `ROLLBACK` and answers 404.

**Rename and delete.** One statement, then read the row count:

```sql
DELETE FROM chats WHERE id = $chat_id AND owner_id = $owner_id;   -- DELETE 0 means: not yours, or no such chat
```

**Feedback on a message.** The client sends a message id. The check must reach the chat:

```sql
UPDATE messages
   SET metadata = metadata || '{"feedback": "up"}'::jsonb
 WHERE id = $message_id
   AND chat_id IN (SELECT id FROM chats WHERE owner_id = $owner_id);
```

> [!trap] Two queries with a gap
> A pattern like "first `SELECT owner_id`, compare in Python, then `UPDATE ... WHERE id = $chat`" works until someone edits one query and not the other. Put the owner filter into the statement that does the work. Then the check and the action cannot drift apart.

### 4.4 The client-chosen id trap

[L2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) lets the client make the chat id before the first save, for safe retries. A "create if missing" step then often looks like this:

```sql
INSERT INTO chats (id, owner_id, title)
VALUES ('a11ce000-0000-4000-8000-000000000001', 'bob@example.com', 'mine now?')
ON CONFLICT (id) DO NOTHING;
```

The test ran it as Bob, with Alice's chat id. The result was `INSERT 0 0`, and the same statement with `RETURNING id` returned 0 rows. Alice's row did not change. That part is correct.

The danger is the next line of code. If the service now inserts Bob's messages into chat `a11ce000-...` because "the chat exists", Bob writes into Alice's chat. The rule: after the insert, the save must still pass the owner check. With the `UPDATE ... WHERE owner_id` of the save transaction, it does: it returns no row, and the save stops.

### 4.5 Session ids and thread ids are object ids too

The harness state is another copy of the same chat ([three copies](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation)). Neither harness knows about owners:

- The Claude Agent SDK resumes whatever session id it receives in `resume`.
- A LangGraph checkpointer loads the state for the `thread_id` in the config. `get_tuple(config)` takes no user at all.

So a client that can send a `session_id` or a `thread_id` can load another user's harness state. That state holds all its tool outputs, and the owner check of the chat tables never runs.

| Wrong | Right |
|---|---|
| The browser sends `thread_id` and the service passes it to the agent | The browser sends the chat id. The service checks the owner, then uses the chat id as the `thread_id`. |
| The browser sends `session_id` for resume | The service reads `chats.session_id` from the owned row. |

### 4.6 404 or 403?

RFC 9110 (HTTP Semantics) defines both codes (checked on 2026-10-13):

> 403: "The 403 (Forbidden) status code indicates that the server understood the request but refuses to fulfill it."
>
> "An origin server that wishes to "hide" the current existence of a forbidden target resource MAY instead respond with a status code of 404 (Not Found)."
>
> 404: "the origin server did not find a current representation for the target resource or is not willing to disclose that one exists."

| Answer for "not your chat" | Strength | Weakness |
|---|---|---|
| 403 | Clear for the caller and in client logs | An existence leak: the caller learns that the id is a real chat, which helps enumeration |
| 404, the same as a missing chat | No existence leak. One code path for "missing" and "not yours". | Support staff cannot tell the two cases apart from the response. Log the real reason on the server. |

Use 404 for chats of other users. Use 403 only when the caller may know that the object exists. An example: a chat shared with them as read-only, when they try to write. The test compared Bob's request for Alice's chat with Bob's request for a random id: both returned `404` with the body `{"detail":"Chat not found"}`.

> [!note] 401 is a different case
> No identity, or an invalid token, is 401, not 404. RFC 9110 says that a server that sends 401 "MUST send a WWW-Authenticate header field". The test app sends `WWW-Authenticate: Bearer`.

### 4.7 Tests that prove another user's chat is unreachable

A security check needs a test that fails when someone removes it. The test suite of the demo service had six tests, built with FastAPI's `TestClient` and real rows. All six passed. Two of them:

```python
def test_body_user_id_cannot_write():
    r = client.post(f"/chats/{ALICE_CHAT}/messages",
                    json={"user_id": "alice@example.com", "text": "x"},
                    headers=auth("bob@example.com"))
    assert r.status_code == 404 and count(ALICE_CHAT) == 2

def test_404_is_same_for_missing_and_foreign():
    a = client.get(f"/chats/{ALICE_CHAT}", headers=auth("bob@example.com"))
    b = client.get(f"/chats/{uuid.uuid4()}", headers=auth("bob@example.com"))
    assert (a.status_code, a.json()) == (b.status_code, b.json())
```

Each test checks two things: the status code, and that the data did not change. A write test that checks only the status code passes even when the write happened.

The full test plan is a matrix: every endpoint of section 4.2, times three callers.

| Caller | Expected |
|---|---|
| The owner | 200, and the action happens |
| Another user with a valid identity | 404, and no row changes |
| No identity or an invalid token | 401, and no row changes |

### 4.8 Row-level security as a second layer

The application connects to the database as one role for all users. The Databricks Apps page on Lakebase resources says that the Postgres role name "matches the service principal's client ID", and that the service principal receives `CONNECT` and `CREATE` on the database (checked on 2026-10-13). So the database cannot tell users apart by itself. PostgreSQL row-level security can, if the application passes the user for each transaction. The PostgreSQL 16 docs say: "If no policy exists for the table, a default-deny policy is used, meaning that no rows are visible or can be modified."

The test enabled RLS on `chats` with this policy:

```sql
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY chats_owner ON chats
    USING (owner_id = current_setting('app.user_id', true));
```

The results, as a non-owner role:

| Step | Result |
|---|---|
| `SELECT count(*) FROM chats` with no user set | 0. `current_setting(..., true)` returns null, so no row matches: fail closed. |
| `BEGIN`, `set_config('app.user_id', 'bob@example.com', true)`, `SELECT` | Only Bob's chat |
| The same `SELECT` after `COMMIT` | 0. The third argument `true` makes the setting local to the transaction. |
| As Bob, `UPDATE chats SET title = 'x' WHERE id = <Alice's id>` | `UPDATE 0` |

> [!trap] The table owner bypasses the policy
> The docs: "Table owners normally bypass row security as well, though a table owner can choose to be subject to row security with ALTER TABLE ... FORCE ROW LEVEL SECURITY." The test confirmed it: as the table owner, with `app.user_id` set to Bob, `count(*)` returned 2. After `FORCE ROW LEVEL SECURITY` it returned 1. An app whose service principal created its own tables on Lakebase owns them, so this trap applies directly. Superusers and roles with `BYPASSRLS` always bypass RLS.

> [!trap] Session settings leak through a pool
> A plain `SET app.user_id = ...` lasts for the whole database session. A pool lends that session to the next request, which may belong to another user ([connection pools](/notes/databases/postgres/03-python-driver/l2-connection-pools)). Use `set_config(..., true)` inside the transaction.

RLS is the second layer. The `WHERE owner_id` filters stay in every query. Then a mistake in one layer is caught by the other.

### 4.9 Production view

| Concern | What to do |
|---|---|
| Security | Filter by the owner from the verified identity in every statement that takes an id. Include messages, sessions and threads. |
| Leaks | Answer 404 for both "missing" and "not yours", with the same body. |
| Testing | Run the owner, other user and no-identity matrix for every endpoint. Check that data did not change. |
| Observability | Log each denied access with the user, the id and the endpoint. Many 404s on different ids from one user suggest enumeration. |
| Defense in depth | Add RLS with transaction-local settings. Use `FORCE ROW LEVEL SECURITY` if the service role owns the tables. |
| Performance | The owner filter uses the primary key or `(owner_id, updated_at DESC)`. It adds no extra query. |

## 5. Code

These exercises go in `conversation-state/05-ownership.ipynb`, with your local PostgreSQL 16 server and the tables of [L2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts).

**Exercise 1.1: the endpoint inventory.** List every function of your own practice chat service that receives an id from the client. For each one, write the SQL with the owner filter.

Acceptance tests:

- The list includes message ids, session ids and thread ids, not only chat ids.
- No statement in the list uses an id without an owner filter or a join to an owned chat.

**Exercise 1.2: the matrix test.** Build a small FastAPI service with read, save, rename, delete and feedback. Write the test matrix of section 4.7.

Acceptance tests:

- For every endpoint, another user gets 404 and the rows do not change.
- Without a token, every endpoint returns 401 with a `WWW-Authenticate` header.
- When you delete the owner filter from one query, at least one test fails.

**Exercise 1.3: the client-chosen id.** Write `create_or_continue(conn, owner, chat_id, user_parts, assistant_parts)`.

Acceptance tests:

- A new id creates the chat and saves the turn.
- Another user's existing id saves nothing and raises your `ChatNotFound` error.
- A retry with the owner's id and the same message ids saves nothing twice.

**Exercise 1.4: RLS behind a pool.** Add the policy of section 4.8 and use a `psycopg_pool.ConnectionPool` with `max_size=1`.

Acceptance tests:

- Request A sets Bob for its transaction. Request B on the same pooled connection, with no user set, sees 0 rows.
- As the table owner, the policy applies only after `FORCE ROW LEVEL SECURITY`.

## 6. Common mistakes

1. **"The ids are random uuids, so nobody can find them."** Ids leak through URLs, logs and screenshots. Check the owner.
2. **An owner check that compares two values from the request.** OWASP calls this not sufficient. The owner must come from the verified identity and the check must use the stored object.
3. **Checking chats but not messages, sessions or threads.** Every id that reaches the database or the harness needs a check.
4. **Trusting "the chat exists" after `INSERT ... ON CONFLICT DO NOTHING`.** It may exist for another user.
5. **403 for chats of other users.** It confirms that the id exists. Use 404.
6. **Tests that check only status codes.** Also check that the rows did not change.
7. **RLS with a session-level `SET` behind a pool, or with the table owner as the app role.** Use transaction-local settings and `FORCE ROW LEVEL SECURITY`.

## 7. One-minute explanation

A chat id is a name, not a password: it appears in URLs, logs and screenshots, so other people learn it. OWASP ranks the missing check first in its 2023 API list, as broken object level authorization. Every endpoint that receives an object id must check that this caller may act on this object. In a chat service, every statement that takes a chat id, a message id, a session id or a thread id filters by the owner. The owner comes from the verified identity, never from the request. Put the filter in the statement that does the work, and read the row count. Treat a client-made chat id with care, because "it already exists" can mean "it exists for someone else". Answer 404 for both missing and foreign chats, so that the response does not confirm that an id exists. Prove it with a matrix test: owner, other user and no identity for every endpoint, and check that the data did not change. Row-level security can be a second layer, with transaction-local settings and with care for the table owner, who bypasses policies by default.

## 8. Check questions

```check
{
  "question": "An endpoint receives a message id and stores a thumbs-up on it with UPDATE messages SET metadata = ... WHERE id = $message_id. The chat endpoints all check the owner. What is the flaw, and what is the fixed statement?",
  "answer": "The message endpoint has no object-level check. Any user who knows a message id can change another user's message. Fix: add the owner condition through the chat, for example UPDATE messages SET metadata = ... WHERE id = $message_id AND chat_id IN (SELECT id FROM chats WHERE owner_id = $owner_id), with the owner from the verified identity. Answer 404 when zero rows change."
}
```

```check
{
  "question": "The browser sends {\"thread_id\": \"...\", \"text\": \"...\"} and the service calls agent.invoke with that thread_id. Why is this a broken object level authorization flaw even if the chats table is never read?",
  "hint": "What does the checkpointer know about users?",
  "answer": "The checkpointer loads the state for any thread_id in the config. It has no owner concept. So a user who sends another user's thread_id continues that user's thread and sees its messages and tool outputs in the model context. The service must accept only a chat id, check its owner, and then use the owned chat id as the thread_id."
}
```

```check
{
  "question": "Give one reason to answer 404 instead of 403 when a user asks for another user's chat, and one cost of that choice. Quote what RFC 9110 allows.",
  "answer": "404 hides whether the id exists, so the response does not help enumeration. RFC 9110 says an origin server that wishes to hide the current existence of a forbidden target resource MAY instead respond with 404. The cost: the response cannot tell the caller or support staff whether the chat is missing or forbidden. So the server must log the real reason."
}
```

```check
{
  "question": "A team adds RLS with a policy on owner_id = current_setting('app.user_id', true), but every user still sees every chat. The app role ran the migrations. What is the most likely cause, and what is the fix?",
  "answer": "The app role owns the table, and table owners bypass row security by default. Fix: ALTER TABLE chats FORCE ROW LEVEL SECURITY, or use a separate non-owner role for the app. Also check that the role is not a superuser and has no BYPASSRLS attribute."
}
```

## 9. Links

- Previous part: [L2.2: From stored parts to model input](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input)
- Next: [L2: Retention and deletion](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion)
- Where the owner comes from: [Self-asserted identity](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity)
- Identity in Databricks Apps: [Identity headers behind a proxy](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy)
- The save transaction: [Chats, messages and parts](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts)
- [Glossary](/notes/ai/conversation-state/glossary)
