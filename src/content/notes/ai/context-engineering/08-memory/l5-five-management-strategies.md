---
title: "L5: Five management strategies"
order: 5
summary: "Windowing, rolling summarization, key-value extraction, priority pruning and topic chunking: how each one works, how to implement it safely, why the handbook's savings numbers disagree, and how to measure retention."
status: not-started
tags: [memory, windowing, summarization, extraction, pruning, retention]
---

## 1. The question this idea answers

A technical conversation reaches 50 turns and about 8,000 tokens. The next call cannot send all of it forever. The cost grows on every call (lesson [1.6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation)), and long inputs lose accuracy (lesson [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects)).

The handbook (Session 6, §3) gives five strategies to shrink the history. Each one keeps different information and loses different information. This lesson explains each strategy and shows the bugs in the handbook's code. It then gives a way to measure which strategy keeps the facts that matter for your task.

## 2. Mental model

> [!analogy] Moving into a smaller flat
> You must fit a large house into a small flat. You have five options:
>
> 1. Keep only what you bought last month (**windowing**).
> 2. Write one page that describes everything else (**rolling summary**).
> 3. Keep a labeled list of key items, such as "sofa: grey, 2 m" (**key-value extraction**).
> 4. Rate every item from 1 to 5 and keep only the 4s and 5s (**priority pruning**).
> 5. Pack by room, so that you open only the kitchen box when you cook (**topic chunking**).
>
> **Where it stops working:** a page about furniture does not change the furniture. A summary of a conversation can change the meaning of what was said. Also, the person who rates the items is an LLM, and its ratings can change from one run to the next. Real systems combine several options.

## 3. Terms

| Term | Plain meaning |
|---|---|
| windowing | A memory strategy that keeps only the last N turns of the history and drops everything older. |
| tool-call pair | A model's tool call and the tool result that answers it. The two must stay together in the history. |
| rolling summarization | A memory strategy that keeps one running summary of older turns and updates it with an LLM call as turns leave the window. |
| summary drift | The loss or change of details when a summary is summarized again and again. |
| key-value extraction | A memory strategy that uses an LLM to pull discrete facts from the conversation into structured fields, such as JSON keys. |
| supersedes field | A field in an extracted fact that names the earlier fact which the new one replaces. |
| priority pruning | A memory strategy that gives each message or memory an importance score and drops the lowest scores first. |
| topic chunking | A memory strategy that groups turns by topic, summarizes each group, and retrieves the group that matches the question. The handbook calls it semantic chunking. |
| token savings | The share of tokens that a strategy removes: one minus the tokens after, divided by the tokens before. |
| retention score | The share of test questions about earlier facts that the model still answers correctly from the compressed context. |

## 4. Method and math

### 4.1 Two numbers for every strategy

Judge each strategy by two numbers, measured on the same conversation:

$$
\text{savings} = 1 - \frac{T_{after}}{T_{before}}, \qquad \text{retention} = \frac{\text{correct answers}}{\text{test questions}}
$$

The symbols mean:

- $T_{before}$ is the number of tokens of the full history.
- $T_{after}$ is the number of tokens that the strategy sends instead.
- The test questions ask about facts from the conversation, for example "Which database did the user choose?"

A third number is the extra cost: the LLM calls that the strategy needs, and the latency that they add.

### 4.2 Strategy 1: windowing

The handbook's Listing 1 is one line: `return messages[-window_size:]`. It calls windowing the "Hello World" of memory management, with one "fatal flaw: amnesia". A user's name from turn 1 "is gone by turn 15".

A correct window follows three rules:

1. **Count turns, not messages.** A turn is a user message plus everything until the next user message: the reply, tool calls and tool results. The handbook's text says "last N turns", but its code slices messages.
2. **Keep tool-call pairs whole.** A cut can leave a tool result whose call is gone. On the Anthropic API, each `tool_result` block must answer a `tool_use` block in the message before it (lesson [6.2](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop)).
3. **Start the window at a user message.** Then the model sees a question before each answer.

With turns of equal size, windowing $K$ of $N$ turns saves $1 - K/N$. Its retention is near zero for anything older than the window.

### 4.3 Strategy 2: rolling summarization

The handbook's Listing 2 asks the model to update the summary: "Write a concise summary preserving all key facts, decisions, and preferences. Keep it under 200 words." It runs at temperature 0 with `max_tokens=300`. The handbook calls this "spending tokens now to save tokens later".

> [!example] Worked example: the handbook's turn-15 diagram
> At turn 15, turns 1 to 10 (about 3,000 tokens) become a 300-token summary. Turns 11 to 15 stay verbatim. Assume 300 tokens for each recent turn.
>
> - Savings on the compressed part: $1 - 300 / 3{,}000 = 90\%$.
> - Before: $3{,}000 + 5 \times 300 = 4{,}500$ tokens. After: $300 + 1{,}500 = 1{,}800$ tokens.
> - Savings on the whole history: $1 - 1{,}800 / 4{,}500 = 60\%$.
>
> The same compression gives 90% or 60%, depending on what you count.

The savings also depend on the length of the conversation. With $N$ turns of $t$ tokens, a summary of $s$ tokens and $K$ recent turns kept verbatim:

$$
\text{savings}(N) = 1 - \frac{s + K\,t}{N\,t}
$$

> [!example] Worked example: one strategy, three savings
> $t = 160$ tokens (the handbook's 50 turns of about 8,000 tokens), $s = 500$, $K = 5$:
>
> - $N = 20$: $1 - (500 + 800) / 3{,}200 = 59.4\%$.
> - $N = 50$: $1 - 1{,}300 / 8{,}000 = 83.8\%$.
> - $N = 100$: $1 - 1{,}300 / 16{,}000 = 91.9\%$.
> - Summary only ($K = 0$) at $N = 50$: $1 - 500 / 8{,}000 = 93.8\%$.

The handbook's Table 3 gives "70–85%" for summarization, and its Table 6 gives "92–95%" for a rolling summary. Table 6's 400–600 tokens out of 8,000 match the summary alone. Table 3 matches a summary plus recent turns at a medium length. Neither number is a property of the strategy.

> [!note] Source check: summarization savings
> **Corrected.** The handbook gives summarization savings of 70–85% (Session 6, §3.6, Table 3) and 92–95% (§7, Table 6). Savings depend on the conversation length, the summary size and the number of verbatim turns kept. With $t = 160$, $s = 500$ and $K = 5$, savings are 59% at 20 turns and 92% at 100 turns. State the parameters with any savings number.

**Summary drift.** The handbook warns: "After five rounds of re-summarization, details can shift or disappear entirely." Its fix: "facts anchor the truth while summaries carry the narrative". In other words, extract facts to a separate store, so that a lost detail in the summary is still in the fact store. Lesson [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) shows the extreme case, context collapse. Lesson [7.2](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction) covers summary prompts in depth.

### 4.4 Strategy 3: key-value extraction

The handbook (Session 6, §3.3) turns a 50-turn conversation into this JSON:

```json
{
    "user_name": "Alice",
    "preferred_language": "Python",
    "project_type": "REST API",
    "framework": "FastAPI",
    "database": "PostgreSQL",
    "orm": "SQLAlchemy",
    "deployment": "Docker on AWS ECS",
    "team_size": 4,
    "deadline": "March 2026",
    "auth_method": "JWT with 15-min expiry",
    "known_issues": ["CORS not configured", "No rate limiting"],
    "decisions": ["REST over GraphQL", "Redis for caching"]
}
```

The handbook says: "That is roughly 400 tokens: a 95% reduction."

> [!example] Worked example: count the tokens
> In the layout above, the JSON has 126 tokens with the `o200k_base` tokenizer and 124 with `cl100k_base`. As compact JSON with no spaces, it has 89 and 85 tokens.
>
> Savings against 8,000 tokens: $1 - 126 / 8{,}000 = 98.4\%$.

> [!note] Source check: "roughly 400 tokens"
> **Corrected.** The handbook (Session 6, §3.3) says that the JSON is "roughly 400 tokens". Counted with `o200k_base`, it is 126 tokens in the shown layout and 89 tokens compact. So the reduction is about 98%, larger than the handbook's 95%. Counted with the `gpt-tokenizer` package, which implements OpenAI's encodings.

The strength of this strategy is precision: each fact is a field that code can query, update and persist. The handbook names its weakness: "You know what was decided but not why". For decisions that people will question later, store a short `reason` field or a link to the episodic record.

**Parse the output safely.** Listing 3 calls `json.loads(response)` on the raw model text. That fails when the model wraps the JSON in a Markdown fence or adds a sentence. A safe pipeline:

1. Prefer structured outputs or a tool schema, so that the API returns valid JSON (lesson [6.3](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs)).
2. Otherwise, remove code fences and take the text from the first `{` to its matching `}`.
3. Parse it, then validate the fields and types against a schema, for example with Pydantic.
4. On failure, retry once and include the error message in the prompt.
5. If it still fails, store nothing and log the raw output.

**Updates with a supersedes field.** The FAQ (Q18) gives each extracted fact these fields: `category`, `key`, `value`, `confidence` and `supersedes`. Example: "I have been using React for about 5 years" gives `experience_years: 5`. A later "actually 6 years" gives a new fact with `supersedes: "experience_years"`. The store then updates one key instead of keeping two conflicting values. Lesson [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) shows how to keep the history of the change.

### 4.5 Strategy 4: priority pruning

The handbook (Session 6, §3.4) scores every message from 1 to 5 and drops low scores:

| Message | Score | Action at threshold 4 |
|---|---|---|
| "Hi there!" | 1 | Prune |
| "I'm building an inventory management app" | 5 | Keep |
| "Sure, let me think about that..." | 1 | Prune |
| "Use JWT tokens with refresh flow" | 5 | Keep |
| "Ok thanks" | 1 | Prune |
| "The token expiry should be 15 minutes" | 4 | Keep |
| "That makes sense" | 1 | Prune |
| "We decided on PostgreSQL over MongoDB" | 5 | Keep |

The lecture scores **messages in the window**. The FAQ (Q9) applies the same name to **stored memories**, scored by recency, frequency and importance (lesson [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay)). These are two different uses.

The handbook admits that "scoring can be unreliable". Four concrete reasons:

1. **The score is a model's judgment.** It can change between runs, models and prompt versions.
2. **The scorer sees a fragment.** Listing 4 shows only the first 100 characters of each message.
3. **A short message can carry a decision.** "That makes sense" after a proposal is the user's acceptance. Without it, the history shows a proposal but not its approval.
4. **Pruning breaks structure.** It can remove one side of a tool-call pair, or leave two assistant messages in a row.

A safer design has four rules. Never prune the last $K$ turns. Prune whole turns only. Keep any turn that a deterministic rule marks, such as one with a number, a name, code or a word like "decided". Log what you prune.

### 4.6 Strategy 5: topic chunking

The handbook (Session 6, §3.5) groups 25 turns by topic and compresses each group:

| Topic | Turns | Compressed group |
|---|---|---|
| Auth | 1, 3, 7, 12 | "Chose JWT auth with 15-min access tokens, refresh via httpOnly cookies, bcrypt for hashing, rate limiting on login." |
| Database | 2, 4, 5, 8 | "PostgreSQL with Prisma ORM, 10 tables designed, JSONB for flexible metadata fields." |
| Deployment | 6, 9, 10, 11 | "Docker + AWS ECS Fargate, RDS for database, ElastiCache Redis, GitHub Actions CI/CD." |

Each group gets its own summary **and** its own embedding (FAQ Q10). A later question about login finds the auth group, even if it came 50 turns ago. The handbook calls this "semantic chunking". Session 3 uses the same name for splitting documents (lesson [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking)). This subject says **topic chunking** to keep the two apart.

Topic detection has three common methods: an LLM labels each turn, turn embeddings are clustered, or keyword rules assign topics. Each method fails on turns that mix two topics, and on new topics that appear late. The handbook's cost is "one call for topic detection + one call per group".

### 4.7 The comparison table, with honest notes

The handbook's Table 3, with a column that states the problems:

| Strategy | Savings | Retention | LLM calls | Complexity | Note |
|---|---|---|---|---|---|
| Windowing | Varies | Low | 0 | Trivial | Savings are $1 - K/N$. |
| Summarization | 70–85% | Medium | 1 per N turns | Low | Table 6 says 92–95%. Both depend on $N$, $K$ and $s$ (section 4.3). |
| Key-value extraction | 90–95% | Low–Medium | 1 total | Medium | Table 6 says 95–97%. The handbook's own JSON gives about 98%. In a running system, extraction runs after every turn or every few turns. |
| Priority pruning | 50–70% | Medium–High | 1 total | Medium | Table 6 gives 55–60%. New messages need new scores. |
| Topic chunking | 75–90% | High | 2–3 total | High | One detection call plus one call per group is 4 calls for 3 groups. |
| Combined | 85–95% | High | 3–5 total | High | Depends on the mix. |

The handbook gives no dataset and no method for its retention ranges. Treat all of these numbers as rules of thumb. Measure savings and retention on your own conversations (section 4.8).

### 4.8 Measure retention

The handbook (Session 6, §7) gives the method: write test questions with expected keywords, ask them against the compressed context, and count the correct answers. Its examples: "What database did the user choose?" expects "PostgreSQL". "What is the deployment target?" expects "AWS ECS". "What auth method was selected?" expects "JWT".

The FAQ (Q17) adds a 20-turn stress test. It places facts early, refers to them later, adds a contradiction ("actually, we switched to MySQL"), returns to an old topic, and adds long digressions. It scores four things:

| Metric | Question it answers |
|---|---|
| Recall | Can the system surface a fact when asked? |
| Consistency | Does it return the latest version of a contradicted fact? |
| Relevance | Does it avoid injecting irrelevant memories? |
| Efficiency | How many tokens does it use to keep memory? |

The FAQ reports recall at turn 20: 40–50% for windowing, 70–80% with a summary added, and 85–95% for its full memory class. These are lab results without a published dataset, so reproduce them before you trust them.

> [!trap] Keyword checks give false results
> A keyword check marks "We did not choose PostgreSQL" as correct, because the keyword is present. It marks "Postgres" as wrong, because the keyword is absent. After a contradiction, the old keyword must count as **wrong**. Use a list of aliases and a negation check, or an LLM judge with a rubric. Check the judge against 20 answers that you labeled by hand.

> [!example] Worked example: one point on the savings–retention chart
> A 50-turn conversation has 8,000 tokens. A summary plus 5 recent turns sends 1,300 tokens. Of 12 test questions, the model answers 9 correctly.
>
> - Savings: $1 - 1{,}300 / 8{,}000 = 83.75\%$.
> - Retention: $9 / 12 = 75\%$.
>
> Plot one such point for each strategy. The best strategy for your task is the one with the highest retention at an acceptable savings.

### 4.9 Which strategy for which use case

The handbook's recommendations (Session 6, §3.6), with the reason for each:

| Use case | Handbook's recommendation | Why it fits |
|---|---|---|
| Simple chatbot | Windowing, N = 10–20 | Each exchange is mostly independent. |
| Customer support | Key-value extraction plus summarization | Account facts are exact. The case story needs a narrative. |
| Coding assistant | Topic chunking plus priority pruning | Long threads return to old topics, with much filler. |
| Research agent | All five combined | Many topics, long sessions, many sources. |
| Personal assistant | Key-value, summarization and persistence | Facts must survive across sessions. |
| Multi-session tutor | Episodic, semantic and procedural tiers | It needs past lessons, the learner's level, and teaching rules. |

The handbook's key takeaway is a good default: start with windowing plus summarization, then add extraction when facts must survive across sessions.

### 4.10 Production view

| Concern | What this lesson means for it |
|---|---|
| Quality | Measure retention with test questions, including contradictions. Savings alone say nothing about quality. |
| Cost | Summaries and extraction add LLM calls. Use a cheap model, and run them outside the user's request when you can. |
| Caching | A summary update rewrites the prefix, so the prompt cache after it is lost (lesson [1.7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)). Update the summary every few turns, not on every turn. |
| Reliability | Parse extraction output with a schema. Never let a parse failure delete stored facts. |
| Observability | Log every compression: what went in, what came out, and which turns were dropped. |

## 5. Graphs

```plot
{
  "title": "Token savings against conversation length N: windowing with 5 turns (red), summary plus 5 recent turns (blue), summary only (purple)",
  "xAxis": { "label": "turns in the conversation N", "domain": [10, 100] },
  "yAxis": { "label": "token savings (share)", "domain": [0, 1] },
  "disableZoom": true,
  "data": [
    { "fn": "1 - 5/x", "color": "#C81D25" },
    { "fn": "1 - 8.125/x", "color": "#1E6091" },
    { "fn": "1 - 3.125/x", "color": "#6A4C93" }
  ]
}
```

The curves use $t = 160$ tokens per turn and a 500-token summary. The blue curve passes 59% at 20 turns, 84% at 50 turns and 92% at 100 turns. So one strategy covers both of the handbook's ranges.

## 6. Code

These exercises go in `notebooks/08-memory.ipynb`. Use a stub LLM where a step needs one, so that the tests cost nothing.

**Exercise 5.1: windowing by turns.**

1. Write `window_turns(messages, k)`. A turn starts at a user message that is not a tool result.
2. Return the messages of the last `k` turns.

Acceptance tests:

- `k=0` returns an empty list. `k` larger than the number of turns returns all messages.
- The result never starts with an assistant message or a tool result.
- A tool call and its result are never separated.

**Exercise 5.2: measure summary drift.**

1. Write a 30-turn conversation that contains 10 seeded facts, such as "the batch size is 512".
2. Summarize it in five rounds. Each round summarizes the previous summary plus 6 new turns.
3. After each round, count how many seeded facts are still present.

Acceptance test: a table of surviving facts per round, and the first fact that disappears.

**Exercise 5.3: a safe key-value extractor.**

1. Write `parse_facts(text)` that follows the five steps of section 4.4.
2. Validate each fact against a Pydantic model with `category`, `key`, `value`, `confidence` and `supersedes`.

Acceptance tests:

- Plain JSON, JSON in a fence, and JSON after a sentence all parse.
- Invalid JSON returns an empty list and logs the raw text. It never raises.
- A fact with `supersedes` replaces the old value of that key.

**Exercise 5.4: priority pruning that keeps structure.** Write a heuristic scorer with no LLM. It gives a high score to turns with numbers, names, code or decision words. Prune at a threshold, but never prune the last 4 turns, and prune whole turns only.

Acceptance test: on the eight messages of section 4.5, the result keeps the four decisions and the turn structure stays valid.

**Exercise 5.5: topic chunks.** Embed the 25 turns of a synthetic conversation with `all-MiniLM-L6-v2`. Cluster them with agglomerative clustering and a distance threshold. Route five questions to the nearest group.

Acceptance test: at least four of the five questions reach the correct group.

**Debug exercise: Listings 1, 3 and 4.** These excerpts come from the handbook (Session 6, §3). Find at least six bugs or risks. Write a test that shows each one. The answer is in the check questions.

```python
# Listing 1
def windowed_context(messages: list, window_size: int = 10) -> list:
    return messages[-window_size:]

# Listing 3 (end)
    response = call_llm(EXTRACTION_PROMPT.format(conversation=conversation), temperature=0.0)
    return json.loads(response)

# Listing 4 (parsing and pruning)
    numbered = "\n".join(f"{i+1}. [{m['role']}]: {m['content'][:100]}" for i, m in enumerate(messages))
    ...
    for line in response.strip().split("\n"):
        parts = line.split("|")
        if len(parts) == 2:
            idx = int(parts[0].strip()) - 1
            score = int(parts[1].strip())
            scores[idx] = score
    return [(messages[i], scores.get(i, 3)) for i in range(len(messages))]

def prune_by_priority(messages: list, threshold: int = 4) -> list:
    scored = score_importance(messages)
    return [msg for msg, score in scored if score >= threshold]
```

## 7. Common mistakes

1. **"Windowing keeps the last N turns."** Listing 1 keeps the last N **messages**, which can split a turn or a tool-call pair.
2. **"Summarization saves 70–85%."** Savings depend on the length, the summary size and the verbatim turns kept. The same design gives 59% or 92%.
3. **"`json.loads` on the model's answer is enough."** Models often wrap JSON in fences or prose. Use structured outputs or a parse-and-validate pipeline.
4. **"A message scored 1 is safe to drop."** "That makes sense" can be the acceptance of a decision.
5. **"A keyword match measures retention."** It counts negations as correct and synonyms as wrong, and it misses contradictions.

## 8. One-minute explanation

Five strategies shrink a long conversation. Windowing keeps the last N turns and forgets the rest, so it must count whole turns and keep tool calls with their results. Rolling summarization keeps one running summary, but repeated summaries drift, so pair it with a fact store. Key-value extraction keeps exact facts as JSON fields. It is very compact but loses the reasons, and its output needs safe parsing. Priority pruning drops low-scored messages, but the scores come from a model and can drop a short decision like "that makes sense". Topic chunking groups turns by topic so that a later question finds the right group. Savings numbers depend on the conversation length, so the handbook's 70–85% and 92–95% are both possible. Always measure retention with test questions, including a contradiction.

## 9. Check questions

```check
{
  "question": "A conversation has 40 turns of 150 tokens. You keep a 450-token summary and the last 6 turns verbatim. What are the token savings?",
  "hint": "savings = 1 − (s + K·t) / (N·t).",
  "answer": "Before: 40 × 150 = 6,000 tokens. After: 450 + 6 × 150 = 1,350 tokens. Savings: 1 − 1,350 / 6,000 = 77.5%."
}
```

```check
{
  "question": "The handbook gives summarization savings of 70–85% in one table and 92–95% in another. How can both be right?",
  "answer": "Savings depend on what you count and on the conversation length. A 400–600-token summary alone against 8,000 tokens saves 92–95%. A summary plus several verbatim recent turns saves less, and the share grows with the number of turns: with 160-token turns, a 500-token summary and 5 recent turns, it is 59% at 20 turns and 84% at 50 turns."
}
```

```check
{
  "question": "Debug exercise, part 1: name the bugs in Listings 1 and 3.",
  "answer": "Listing 1: (a) window_size = 0 returns the whole list, because messages[-0:] equals messages[0:]. (b) It counts messages, not turns, so the window can start with an assistant message. (c) It can cut a tool call from its tool result. Listing 3: (d) json.loads fails when the model wraps the JSON in a ```json fence or adds a sentence before it. (e) There is no schema check, no retry and no fallback, so one bad answer raises an exception."
}
```

```check
{
  "question": "Debug exercise, part 2: name the bugs in Listing 4.",
  "answer": "(a) int() raises ValueError on a line such as \"2 | 4 (decision)\" or on a header line \"index|score\", and one bad line stops the whole function. (b) Lines in another format, such as \"2. 4\", are skipped without a warning. (c) A message with no parsed score gets the default 3, and prune_by_priority then drops it at threshold 4. So a parse failure silently deletes messages. (d) The scorer sees only the first 100 characters of each message. (e) The index is never checked. If the model numbers from 0, each score lands on the message before the one it rates. (f) Pruning single messages breaks turns and tool-call pairs."
}
```

```check
{
  "question": "Your retention test asks \"Which database does the project use?\" and expects the keyword \"PostgreSQL\". At turn 12 the user said they switched to MySQL. The answer is \"PostgreSQL\". How does a keyword check score it, and what is the fix?",
  "answer": "The keyword check scores it as correct, because the keyword is present. But the correct answer is MySQL, so this is a consistency failure. Write the expected answer as the latest value, mark the old value as wrong, and use aliases and a negation check, or an LLM judge that you checked against hand labels."
}
```

## 10. Links

- Previous: [L4: Hot, warm and cold tiers](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers)
- Next: [L6: Persistent memory](/notes/ai/context-engineering/08-memory/l6-persistent-memory)
- [7.2: Summarization and compaction](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction) and [7.10: Measure compression](/notes/ai/context-engineering/07-compress-and-isolate/l10-measure-compression)
- [6.3: Tool schemas and structured outputs](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs)
- [Glossary](/notes/ai/context-engineering/glossary)
