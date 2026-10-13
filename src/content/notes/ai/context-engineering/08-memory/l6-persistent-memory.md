---
title: "L6: Persistent memory"
order: 6
summary: "A memory store that survives restarts, many processes and many users: atomic JSON writes, a correct SQLite schema with UPSERT and access tracking, WAL, a decay job, conflict history, isolation enforced in the database, cascading deletion under GDPR Article 17, and defenses against false memories."
status: not-started
tags: [memory, persistence, sqlite, isolation, gdpr, security]
---

## 1. The question this idea answers

Lessons 8.3 to 8.5 decide **what** to remember. This lesson decides **how** to keep it safely. A memory store in production must survive five events:

1. A crash during a write.
2. Two processes that write at the same time.
3. A user who corrects a fact.
4. A second user who must never see the first user's data.
5. A request to delete everything.

The handbook's code (Session 6, §4.2) works for one user in a notebook. It fails on each of these points. This lesson shows why, and what a correct store looks like.

## 2. Mental model

> [!analogy] A bank's customer records
> A bank keeps one account per customer. Every change goes into a ledger, so that the bank can show the old balance and the new one. A teller can open only the account of the customer at the desk. When a customer closes the account and asks for erasure, every copy must go: the branch file, the archive box and the scanned copy.
>
> **Where it stops working:** trained staff write bank records. An LLM writes memory rows, and it can write a fact that the user never said. Also, a memory store keeps a second copy of every text as an embedding vector. That copy looks like numbers, but it can leak the text (section 4.7).

## 3. Terms

| Term | Plain meaning |
|---|---|
| atomic write | A write that either completes fully or leaves the old data unchanged, so that a crash never leaves a half-written file. |
| UPSERT | One SQL statement that inserts a row, or updates the existing row when the insert would break a uniqueness rule. |
| UNIQUE constraint | A database rule that no two rows may have the same values in the named columns. |
| write-ahead logging (WAL) | A SQLite journal mode in which readers do not block the writer and the writer does not block readers. There is still only one writer at a time. |
| SQLITE_BUSY | The SQLite error code for "database is locked": another connection holds the write lock. |
| busy timeout | The time that a SQLite connection waits for a lock before it raises SQLITE_BUSY. |
| last-write-wins | A conflict rule: a new value replaces the old one, and the old value is lost. |
| fact history | A record of every earlier value of a fact, with the time when each value was valid. |
| tenant isolation | The guarantee that one user's or one customer's data never reaches another user or customer. |
| row-level security | A database feature, for example in PostgreSQL, that filters rows by a policy on every query, whatever the application code asks for. |
| pre-filtering | Applying a metadata filter, such as the user ID, before or during a vector search. |
| post-filtering | Applying a metadata filter after the vector search has picked its top results. |
| right to erasure | The right of a person under GDPR Article 17 to have their personal data deleted on certain grounds. |
| embedding inversion | Recovering the original text from its embedding vector. |
| memory hallucination | A false memory: the model refers to a past event that did not happen, or extraction stores a fact that the user did not state. |
| memory poisoning | An attack that makes the system store a false or harmful memory, for example through text in a retrieved document. |

## 4. Method and math

### 4.1 Three levels of storage

| Level | Use it for | Writers at the same time | Isolation | Search |
|---|---|---|---|---|
| JSON file | A prototype with one user | One | One file per user, by convention | Load all, filter in Python |
| SQLite | One machine, few processes | One writer, many readers with WAL | A `user_id` column on every row | SQL, plus a separate vector index |
| PostgreSQL or a managed database | Many processes and many users | Many | Row-level security in the database | SQL, plus pgvector or a vector database |

The handbook's advice (Session 6, §4.2) is sound: JSON for prototypes, SQLite for single-user work, and "PostgreSQL or a dedicated database service" for production multi-user systems.

### 4.2 A JSON file, done right

The handbook's Listing 6 saves the facts and the summary at the end of a session and loads them at the start. It has two bugs and one design gap:

1. It calls `datetime.now()` but imports only `timedelta` in another listing. The first save raises `NameError`.
2. `write_text` overwrites the file in place. A crash during the write leaves a cut file. The next `json.loads` fails, and all memory is lost.
3. One file holds one memory. A second user overwrites the first.

An atomic write follows four steps:

1. Write the new content to a temporary file **in the same folder**.
2. Flush it and call `os.fsync` on it, so that the bytes reach the disk.
3. Rename the temporary file over the target with `os.replace`. Python documents this rename as atomic on POSIX systems. On Windows, test it on your file system.
4. Keep the previous version as a backup, and fall back to it when a load fails.

Also store a `version` field and check it on load. A file from an older schema then raises a clear error instead of a `KeyError`.

### 4.3 SQLite, done right

The handbook's Listing 7 claims to support "querying by tier, access tracking, and multiple users". Its schema has no `user_id` column. It also has several other defects, which the debug exercise covers. A correct schema has these columns and rules:

| Column or rule | Definition | Why |
|---|---|---|
| `user_id` | TEXT, NOT NULL | Every query filters on it. |
| `key`, `value` | TEXT, NOT NULL | The fact's name and its current value. |
| `kind` | TEXT, CHECK in episodic, semantic, procedural | Different kinds have different rules (lesson [8.2](/notes/ai/context-engineering/08-memory/l2-three-kinds-of-memory)). |
| `tier` | TEXT, NOT NULL, CHECK in the four stability tiers | The decay rules (lesson [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay)). |
| `source` | TEXT | "explicit" or "inferred", and the ID of the source turn |
| `created_at`, `updated_at` | TEXT, NOT NULL | When the fact appeared and when it last changed |
| `last_accessed` | TEXT, NOT NULL, set to `created_at` on insert | No NULL values in the recency sort |
| `access_count` | INTEGER, NOT NULL, default 0 | Counts reads, not writes |
| UNIQUE (`user_id`, `key`) | Table constraint | One current value per key and user. It is also the conflict target for UPSERT. |
| Index on (`user_id`, `last_accessed`) | Index | Fast recency queries for one user |

**UPSERT instead of SELECT-then-INSERT.** SQLite has supported UPSERT since version 3.24.0 (2018-06-04). The general form from the SQLite documentation is:

```sql
INSERT INTO t (a, b) VALUES (?, ?)
ON CONFLICT (a) DO UPDATE SET b = excluded.b;
```

The conflict target must be a uniqueness constraint. The prefix `excluded.` names the row that the INSERT tried to add.

> [!example] Worked example: the race in SELECT-then-INSERT
> Two processes store the same fact for the same user at the same time, with no UNIQUE constraint:
>
> | Step | Process A | Process B |
> |---|---|---|
> | 1 | SELECT the key "lang": no row | |
> | 2 | | SELECT the key "lang": no row |
> | 3 | INSERT "Python 3.11" | |
> | 4 | | INSERT "Python 3.12" |
>
> The table now has two rows for one key, and retrieval can return either value. With UNIQUE (`user_id`, `key`) and an UPSERT, step 4 updates the row instead, in one statement.

**Track access on read.** The decay rule of the lecture (§4.1) archives a memory that was not "accessed within its decay window". Listing 7 updates `last_accessed` and `access_count` only when it **writes** a fact. Retrieval never updates them, so the rule cannot work. Update both fields for the rows that a retrieval returns, in the same transaction or in a small batch.

**NULL in the sort.** Listing 7 inserts new rows with `last_accessed` empty (NULL). SQLite sorts NULL as smaller than any value, so `ORDER BY last_accessed DESC` puts every new fact last. With `LIMIT 20`, new facts can fall out of the results. This was checked with SQLite 3.45.1.

**Concurrency.** The handbook warns of "database is locked" errors with several processes. The SQLite documentation explains why: "SQLite only supports one writer at a time." Three measures help:

1. `PRAGMA journal_mode=WAL;` lets readers and the writer work at the same time. The setting persists in the file. WAL does not work over a network file system.
2. A busy timeout makes a writer wait for the lock instead of failing at once. Python's `sqlite3` waits 5 seconds by default.
3. `BEGIN IMMEDIATE` takes the write lock at the start of a transaction, so that a read-then-write transaction does not fail halfway.

WAL still allows only one writer. For many writers, move to PostgreSQL.

### 4.4 The decay and archival job

A nightly job applies the decay rules of lesson 8.3:

1. Select the rows that are not eternal and whose TTL passed, or whose decayed score is below the threshold.
2. Move them to an archive table with the reason and the time. Delete experimental notes instead of archiving them.
3. Remove or mark their vectors in the search index, so that search and SQL agree.
4. Write one log line per run: rows checked, archived and deleted.

Once a month, a second pass reviews tiers by access pattern. An eternal fact that changed three times is not eternal. An evolving fact that users ask about every week may be stable (Session 6, FAQ Q27).

### 4.5 Conflicts: last-write-wins or history

The FAQ (Session 6, Q16) gives three cases:

| Case | Example | Rule |
|---|---|---|
| Correction | "I use Python 3.12" after "I use Python 3.11" | Replace the current value, and keep the old one in the history |
| Addition | "I also use Go" | Store a new fact next to the old one |
| Context-dependent | "I like short responses" and later "explain that in more detail" | Store both, each with its context. They are not a contradiction. |

The FAQ says that production systems "typically use an LLM call" to classify an update into these cases. The Mem0 paper (Chhikara et al., 2025) uses the same idea with four operations: ADD, UPDATE, DELETE and NOOP. In its words: "The LLM itself determines which of four distinct operations to execute."

> [!example] Worked example: why history matters
> The user says "I use Python 3.11" in May and "we moved to 3.12" in September. Then the user asks: "Which version did I use before the move?"
>
> - **Last-write-wins:** the table has one row, `python_version = 3.12`. The old value is gone, so the agent cannot answer.
> - **History:** the current table has `3.12`. A history table has `3.11`, valid from May to September. The agent answers 3.11.
>
> Keep the current value in the main table with its UNIQUE constraint. Copy the old value into a history table on every update.

### 4.6 Isolation between users

The FAQ (Session 6, Q22) states the rule: tag every memory with `user_id`, and "filter by user_id before performing similarity search". It adds: "Never rely on the LLM to filter memories; it might leak information across users."

Post-filtering fails in two ways:

1. **Missing results.** The search picks the global top $k$ first. If none of them belong to the user, the filter leaves nothing. The pgvector documentation describes this for approximate indexes: the filter runs after the index scan, so a query can return fewer rows. Its iterative index scans (version 0.8 and later) reduce the problem (lesson [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search)).
2. **Leaks.** If one code path forgets the filter, another user's memory reaches the prompt. The model may then quote it.

> [!example] Worked example: post-filtering one user's memories
> A store holds 100,000 vectors. One user owns 10 of them. A query asks for the top 5, and the filter runs afterwards.
>
> The result keeps only those of the user's memories that rank among the 5 nearest of all 100,000 vectors. Often that is none, and the result is empty. A user who asks about a common topic, such as "my Python version", competes with thousands of similar memories from other users. With pre-filtering, the search runs only over the user's 10 vectors and returns 5 of them.

Enforce the filter in the database, not only in the application:

```mermaid
flowchart LR
    A[Request] --> B[Authenticate: get user_id]
    B --> C[Open a DB session for this user]
    C --> D[Row-level security policy]
    D --> E[Filtered vector search]
    E --> F[Top k memories of this user only]
    style D fill:#C81D25,color:#fff
    style F fill:#2D6A4F,color:#fff
```

The FAQ names two ways: row-level security in PostgreSQL, or a separate collection per user in the vector database. Enterprise systems add team, organization and tenant scopes on top.

### 4.7 Deletion and GDPR Article 17

GDPR Article 17(1) says: "The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay". The article lists six grounds, for example withdrawn consent or data that is no longer necessary. Article 17(3) lists exceptions, for example legal obligations and legal claims. In California, the CCPA (Civil Code §1798.105) gives a similar right: "You may request that businesses delete personal information they collected from you". This is not legal advice. Check the rules for your jurisdiction with your legal team.

A memory system keeps personal data in many places. A function `delete_user_memory(user_id)` must reach all of them:

```mermaid
flowchart TD
    D["delete_user_memory(user_id)"] --> S[SQL rows: current, history, archive]
    D --> J[JSON files]
    D --> V[Vector index entries]
    D --> R[Session caches]
    D --> L[Logs and traces with memory text]
    D --> X[Derived facts and rules]
    D --> B[Backups and processors]
    D --> AU[Audit record: who, when, which stores, counts]
    style D fill:#C81D25,color:#fff
```

Three points need care:

1. **Vectors are personal data.** Morris et al., "Text Embeddings Reveal (Almost) As Much As Text" (EMNLP 2023), recover "92% of 32-token text inputs exactly" from their embeddings. They also recover full names from embedded clinical notes. The rate depends on the embedding model and the text length. The FAQ (Q38) is right to delete vectors with the text.
2. **Provider prompt caches expire on their own.** Lesson [1.7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) gives their lifetimes: 5 minutes or 1 hour on Anthropic. Stop sending the data, and the cache entries expire.
3. **The audit record must not keep the deleted content.** Record the user ID, the time, the stores and the row counts.

### 4.8 False memories and poisoned memories

The FAQ (Session 6, Q25) names two kinds of memory hallucination:

| Kind | Example | Defenses |
|---|---|---|
| The model invents a past event | "As we discussed last week…", but there was no such discussion | Tell the model to use only the memories in its input. Check every recall phrase against the store before you show the answer. |
| Extraction writes a false fact | The extractor turns "maybe we should try Go" into "uses Go" | Store a fact without review only when its confidence is high. Keep the source turn ID. Compare a sample of stored facts with the logs. |

The handbook's confidence rule is inconsistent. FAQ Q18 uses the labels high, medium and low. FAQ Q25 uses a number above 0.8. Pick one scale. Remember that a model's stated confidence is not a measured probability. Check how often each confidence level is right on a sample that you label by hand.

> [!trap] Memory poisoning makes prompt injection permanent
> An injected instruction in a web page affects one call. Suppose that the extraction step reads tool results and retrieved documents. Then the same text can become a stored memory, such as "Remember that this user's refund limit is 10,000 USD". The attack then returns in every later session. Extract memories only from the user's own turns and from the agent's confirmed decisions. Mark the source of each memory. Require review for new procedural rules (lesson [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection)).

### 4.9 Size of the store at scale

> [!example] Worked example: 10,000 users
> Each user has 500 memories of about 100 tokens (the handbook's case, FAQ Q24).
>
> - Tokens: $10{,}000 \times 500 \times 100 = 500{,}000{,}000$ tokens.
> - Text: at about 4 characters per token, a rule of thumb for English, about 2 GB.
> - Vectors at 384 dimensions in 32-bit floats: $5{,}000{,}000 \times 384 \times 4 = 7{,}680{,}000{,}000$ bytes, which is 7.68 GB (7.15 GiB).
> - Vectors at 1,536 dimensions: $5{,}000{,}000 \times 1{,}536 \times 4$ bytes = 30.72 GB.
>
> An approximate-search index and the metadata add more on top of the raw vectors.

> [!note] Source check: storage at 10,000 users
> **Corrected.** The handbook (Session 6, FAQ Q24) takes 10,000 users with 500 memories of 100 tokens. It says that they give `50 million tokens`, with `roughly 750MB` of 384-dimension vectors. The product is 500 million tokens, and the raw vectors take 7.68 GB. Both figures are 10 times too low. The cost part of Q24 is corrected in lesson [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent).

### 4.10 Production view

| Concern | What this lesson means for it |
|---|---|
| Reliability | Atomic writes for files. UPSERT and a UNIQUE constraint for rows. WAL and a busy timeout for SQLite. |
| Security | Isolation in the database, not in the prompt. Extract memories only from trusted sources. |
| Privacy | One deletion function that reaches every store, with an audit record. Treat vectors as personal data. |
| Correctness | Track access on reads. Keep a history of changed facts. |
| Observability | Log every write with its source turn, and every archive and deletion run with counts. |
| Scale | Plan storage from the real product: users × memories × size, plus vectors and index overhead. |

## 5. Code

These exercises go in `src/memory/` with tests in `tests/`. Use only the standard library, `sqlite3` and NumPy.

**Exercise 6.1: an atomic JSON store.**

1. Write `save_memory(path, data)` and `load_memory(path)` with the four steps of section 4.2.
2. Add a `version` field and a backup file.

Acceptance tests:

- A test that raises an exception in the middle of `save_memory` leaves the old file readable.
- A cut file makes `load_memory` fall back to the backup.

**Exercise 6.2: a correct SQLite store.**

1. Create the schema of section 4.3, with UNIQUE (`user_id`, `key`) and the index.
2. Write `store(user_id, key, value, ...)` as one UPSERT, and `retrieve(user_id, limit)` that updates the access fields of the rows it returns.
3. Enable WAL and set a busy timeout.

Acceptance tests:

- Two stores of the same key for the same user leave one row with the second value.
- The same key for two users gives two rows.
- A new fact appears in `retrieve(user_id, 20)` before older facts that were never read.
- After a retrieval, `access_count` grows by 1 for each returned row.

**Exercise 6.3: fact history.** Add a history table. On every update, copy the old value with its validity period.

Acceptance test: after "3.11" then "3.12", a query for the earlier value returns 3.11.

**Exercise 6.4: the decay job.** Write `run_decay(db, now)` with the four steps of section 4.4.

Acceptance test: a fixture with one row per tier, each 100 days old, leaves only the eternal row searchable. The log line shows the counts.

**Exercise 6.5: an isolation test.** Store 1,000 memories for 100 users in a NumPy index. Implement a post-filter search and a pre-filter search.

Acceptance tests:

- For a user with 5 memories, the post-filter top 5 often returns fewer than 5 results. The pre-filter search always returns 5.
- No search ever returns another user's memory.

**Exercise 6.6: cascading deletion.** Write `delete_user_memory(user_id)`. It removes the user's data from the JSON files, the SQLite tables and the vector index. It then writes one audit record.

Acceptance test: after deletion, a search of every store finds nothing for that user, and the audit record holds counts but no memory text.

**Debug exercise: Listings 6, 7 and 9.** These excerpts come from the handbook (Session 6, §4.2 and §6.3). Find at least eight bugs or risks. Write a test that shows each one. The answer is in the check questions.

```python
# Listing 6
import json
from pathlib import Path
MEMORY_FILE = Path("agent_memory.json")

def save_memory(facts: dict, summary: str):
    memory = {"facts": facts, "summary": summary,
              "last_updated": datetime.now().isoformat(), "version": 1}
    MEMORY_FILE.write_text(json.dumps(memory, indent=2))

# Listing 7
db.execute("""CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL, value TEXT NOT NULL,
    tier TEXT DEFAULT 'evolving', created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_accessed TEXT, access_count INTEGER DEFAULT 0)""")

def store_memory(db, key, value, tier="evolving"):
    existing = db.execute("SELECT id FROM memories WHERE key = ?", (key,)).fetchone()
    if existing:
        db.execute("UPDATE memories SET value = ?, last_accessed = CURRENT_TIMESTAMP, "
                   "access_count = access_count + 1 WHERE key = ?", (value, key))
    else:
        db.execute("INSERT INTO memories (key, value, tier) VALUES (?, ?, ?)", (key, value, tier))
    db.commit()

def retrieve_memories(db, tier=None, limit=20):
    query = "SELECT key, value, tier FROM memories"
    ...
    query += " ORDER BY last_accessed DESC LIMIT ?"

# Listing 9
for line in response.strip().split("\n"):
    fact = line.strip().lstrip("- ").lstrip("* ")
    if fact and len(fact) > 5:
        self.store_fact(fact, source_turn=self.turn_count)
```

## 6. Common mistakes

1. **"`write_text` is a safe save."** A crash during the write leaves a cut file. Use a temporary file and an atomic rename.
2. **"SELECT first, then INSERT or UPDATE."** Two processes can both see no row. Use a UNIQUE constraint and one UPSERT.
3. **"The vector store filters by user later."** Post-filtering loses results and invites leaks. Filter first, and enforce it in the database.
4. **"Deleting the rows deletes the user."** Vectors, caches, logs, derived facts, backups and processors also hold the data.
5. **"Extract memories from everything the agent reads."** Text from documents and tools can poison memory. Extract from the user's turns and confirmed decisions.

## 7. One-minute explanation

A persistent memory store must survive crashes, parallel writes, corrections, many users and deletion requests. Save files with a temporary file and an atomic rename, so that a crash never cuts the file. In SQL, give every row a user ID, make the pair of user and key unique, and write with one UPSERT. Update the access time on every read, or decay rules cannot work. SQLite allows one writer at a time. WAL lets readers work during a write, and PostgreSQL handles many writers. Keep a history of changed facts, so that the agent can answer what was true before. Filter by user before the vector search, and enforce it in the database. A deletion request must reach the rows, vectors, caches, logs, derived facts and backups, because embeddings can be turned back into text.

## 8. Check questions

```check
{
  "question": "Debug exercise, part 1: name the problems in Listing 6.",
  "answer": "(a) datetime is never imported, so the first save raises NameError. (b) write_text overwrites the file in place. A crash during the write leaves a cut file, and the next load fails with a JSON error, so all memory is lost. Use a temporary file, fsync and os.replace. (c) One fixed file name serves all users, so a second user overwrites the first. (d) load_memory does not check the version field, so a file from an older schema fails with a KeyError."
}
```

```check
{
  "question": "Debug exercise, part 2: name the problems in Listing 7.",
  "answer": "(a) No user_id column, although the text claims multi-user support. Two users with the key \"name\" overwrite each other. (b) key is not UNIQUE, so two processes can insert two rows for one key, and the UPDATE then changes both. (c) INSERT leaves last_accessed NULL, and ORDER BY last_accessed DESC puts NULL rows last, so new facts can fall outside LIMIT 20. (d) Retrieval never updates last_accessed or access_count, so the rule \"not accessed within its decay window\" cannot work. (e) access_count counts writes, not reads. (f) An update never changes the tier. (g) There is no decay job, and SELECT-then-INSERT has a race."
}
```

```check
{
  "question": "Debug exercise, part 3: name the problems in Listing 9.",
  "answer": "(a) lstrip(\"- \") removes a set of characters, not a prefix. \"-5 degrees is the minimum\" becomes \"5 degrees is the minimum\", and \"*args are allowed\" becomes \"args are allowed\". (b) Numbered lines such as \"1. User likes Python\" keep their number. (c) A preamble line such as \"Here are the key facts:\" passes the length check and is stored as a fact. (d) There is no de-duplication and no conflict check, so repeated or contradicting facts pile up. (e) It calls llm_call, while the other listings call call_llm."
}
```

```check
{
  "question": "A store has 2,000,000 memories with 768-dimension vectors in 32-bit floats. How large are the raw vectors?",
  "hint": "count × dimensions × 4 bytes.",
  "answer": "2,000,000 × 768 × 4 = 6,144,000,000 bytes ≈ 6.14 GB (about 5.72 GiB), before index overhead and metadata."
}
```

```check
{
  "question": "A user asks a support bot about \"my Python version\" and gets no memories back, although the store holds the fact. The code searches the top 5 vectors of the whole store and then filters by user_id. Explain the failure and the fix.",
  "answer": "Post-filtering: the global top 5 were memories of other users with similar text, so the user filter removed all of them. Fix: filter by user_id before or during the search, for example with a per-user collection, a filtered index or row-level security, so that the search ranks only this user's memories."
}
```

```check
{
  "question": "A user invokes the right to erasure. The team deletes the user's rows in the memories table. Name four other places that may still hold the user's data.",
  "answer": "Any four of: the vector index entries, the history and archive tables, JSON files, session caches such as Redis, logs and traces that contain memory text, derived facts or rules that came from the user's episodes, backups, and processors such as a hosted vector database."
}
```

## 9. Links

- Previous: [L5: Five management strategies](/notes/ai/context-engineering/08-memory/l5-five-management-strategies)
- Next: [L7: Self-improving context: ACE](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context)
- [4.7: Vector search](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search): filtered approximate search
- [6.9: Tool security and prompt injection](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection)
- [Glossary](/notes/ai/context-engineering/glossary)
