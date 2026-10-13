---
title: "L2: WRITE: scratchpads, memories, files"
order: 2
summary: "WRITE saves context outside the window. Lifespan and audience decide where: a scratchpad for this run, a memory for this user, a file for the team. Write too little and the agent forgets. Write too much and later retrieval drowns in noise."
status: not-started
tags: [write-and-rag, write, scratchpad, memory, notes, offloading]
---

## 1. The question this idea answers

An agent works for two hours on a refactor. At step 40, it chooses a design that it rejected at step 10, because the reason for the rejection is no longer in its window. The next day, a new session asks the user the same preference question again.

Both failures have one cause: the agent learned something, but did not save it outside the window. The window is temporary. Each call starts again from what the application sends (lesson [1.3](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call)). So where should an agent save what it learns, in which form, and how much?

## 2. Mental model

> [!analogy] Three kinds of notes in an office
> - A **sticky note** on the desk: "phone the supplier again, step 3 of 5 done". It helps with the current task and goes in the bin afterwards. This is a **scratchpad**.
> - A **client file**: "Ms Rao prefers email, allergic to nuts". It is about one person and stays for months. This is a **memory**.
> - The **company handbook**: rules and decisions that every employee reads. It is shared and lasts for years. This is a **file**.
>
> **Where it stops working:** in an office, a person sees the sticky note on the desk. An agent sees a note only if a later step reads it into the window. A note that no step reads has no effect. Also, an agent can write a wrong note with full confidence, and the error then returns on every later read.

## 3. Terms

| Term | Plain meaning |
|---|---|
| scratchpad | Working notes of one agent run: the plan, the progress and the decisions. They keep the run focused, and they lose their value when the run ends. |
| long-term memory | Information about a user or a task that an application keeps across sessions, for example a user preference. |
| file (artifact) | A durable document that people and agents share, for example `CLAUDE.md`, a design record or a generated report. |
| lifespan | How long a saved item stays useful: minutes for a scratchpad, months for a memory, years for a file. |
| audience | Who reads a saved item later: this run, this user's sessions, or a whole team and its agents. |
| structured note-taking | Writing notes in a fixed form, with headings such as objective, progress and decisions, so that a later step can find and update one part. |
| over-writing | Saving too much, "just in case". It adds noise and stale facts that a later retrieval can return. |
| under-writing | Saving too little. A later step or session must find the information again, or it makes a different decision. |
| offloading | Saving a large result, for example a tool output, to storage and keeping only a short reference to it in the window. |
| reference | A short pointer to stored content, such as a file path, a URL or an ID. It stays in the window in place of the content. |
| memory poisoning | Untrusted or wrong text that an agent saves to memory, so that it returns to the window on later calls. |

## 4. Method and math

### 4.1 Why WRITE exists

Without WRITE, three kinds of knowledge are lost:

1. **Within a run.** When the history grows, an application must compress it (Part 7). A decision that lived only in the old turns disappears with them.
2. **Between sessions.** Each new session starts with an empty history. Facts about the user are gone.
3. **Between people and agents.** A decision that one agent made is invisible to the next agent and to the team.

Lance Martin's definition says what WRITE is for: "Writing context means saving it outside the context window to help an agent perform a task." WRITE alone does nothing for the model. A saved item helps only when a later SELECT returns it to the window. So every WRITE decision is also a decision about a future SELECT.

### 4.2 Three places to write: lifespan and audience

| Kind | Lifespan (rule of thumb) | Audience | Example | Where it lives | How it returns to the window |
|---|---|---|---|---|---|
| Scratchpad | Minutes to hours | This agent run | Plan, to-do list, progress, decisions | A field in the agent state, or a file such as `NOTES.md` | The agent reads it at each step, or after a compression |
| Memory | Hours to months | This user, across sessions | "Prefers metric units" | A memory store or a database table keyed by user | Retrieval at the start of a session or on each turn (Part 8) |
| File | Months to permanent | A team, a project, other agents | `CLAUDE.md`, `AGENTS.md`, design records, reports, code | A repository or a shared drive | Loaded at the start (rules files, lesson 3.5) or read on demand |

The lifespans come from the handbook (Session 3, §2.1 to §2.3). They are rules of thumb, not limits. A scratchpad of a two-day migration lives for two days.

Memories reach the store in two ways. A person can say "remember this", or the system can extract facts by itself. Lance Martin's post says that ChatGPT, Cursor and Windsurf "all have mechanisms to auto-generate long-term memories based on user-agent interactions". Product features change often, so check the current docs before you depend on one. Part 8 covers memory extraction, scoring and deletion.

Files have the widest audience. A person can read and correct them, and version control keeps their history. The `00-progress` folder of this subject is a small example: a session log and a list of mistakes that each new study session reads.

### 4.3 The write decision

The handbook (Session 3, §2.4) gives four questions: "Will I need this again in 5 minutes?", "in the next session?", "Will other agents or humans need this?" and "Is this a one-time lookup I am using right now?". The flowchart below keeps those questions and adds two checks that come first.

```mermaid
flowchart TD
    A[New information during a task] --> B{Can it be fetched again exactly and cheaply?}
    B -- yes --> N1[Do not write. Keep a reference if needed.]
    B -- no --> C{Is it verified, and allowed to store?}
    C -- no --> N2[Do not write it, or mark it unverified with its source]
    C -- yes --> D{Will other people or agents need it?}
    D -- yes --> F[File: shared and versioned]
    D -- no --> E{Will this user need it in a later session?}
    E -- yes --> M[Memory: keyed by user]
    E -- no --> G{Will this run need it after the window changes?}
    G -- yes --> S[Scratchpad: notes or a state field]
    G -- no --> N3[Do not write]
    style F fill:#2D6A4F,color:#fff
    style M fill:#2D6A4F,color:#fff
    style S fill:#2D6A4F,color:#fff
```

The first check stops waste. A database row or a web page that the agent can fetch again in one call does not need a copy. A reference is enough. The second check stops the spread of errors and of personal data that the user did not agree to store.

### 4.4 The write decision as a cost comparison

The flowchart hides a simple trade-off. A write pays when the expected cost of missing the information is larger than the cost of saving it:

$$
p \cdot C_{\text{miss}} > C_{\text{write}} + C_{\text{noise}}
$$

The symbols mean:

- $p$ is the probability that a later step or session needs the information.
- $C_{\text{miss}}$ is the cost when it is needed but was not saved: the tokens to find it again, or the cost of a wrong decision.
- $C_{\text{write}}$ is the cost to write and store it: the tokens of the write and the storage.
- $C_{\text{noise}}$ is the harm to later retrieval: one more item that can return as a distractor or as a stale fact.

> [!example] Worked example: two candidates for a write
> The agent of lesson [1.6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation) spends 3,200 tokens on each step. The probabilities below are assumptions. In practice, estimate them from logs.
>
> **Candidate 1: a design decision.** "Use RS256, not HS256, because other services must verify tokens without the secret." Without a note, the agent may explore the question again for about 20 steps: $20 \times 3{,}200 = 64{,}000$ tokens. With $p = 0.5$, the expected miss cost is $0.5 \times 64{,}000 = 32{,}000$ tokens. The note costs about 60 tokens. **Write it.**
>
> **Candidate 2: a one-off search result of 3,000 tokens.** Assume $p = 0.05$. A new search costs 3,200 tokens. The expected miss cost is $0.05 \times 3{,}200 = 160$ tokens. A copy in long-term memory costs 3,000 tokens of storage, and it can return as a distractor on unrelated questions. **Do not write it to memory.** Keep at most a reference for this run.

The model is simple, but it gives the right instinct. Decisions and their reasons are cheap to write and expensive to lose. Raw data is expensive to keep and cheap to fetch again.

### 4.5 Over-writing and under-writing

The handbook (Session 3, §2.4) names the two most common mistakes. Over-writing is first: saving everything "just in case". Under-writing is second: not saving critical decisions.

| | Over-writing | Under-writing |
|---|---|---|
| Symptom | Retrieval returns old or unrelated memories. Answers use an outdated preference. Storage grows without limit. | The agent repeats work, reverses earlier decisions, or asks the user the same question again. |
| Why it hurts | Each extra item is a possible distractor or stale fact in a later window (lesson [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects)). | The information is gone, so the agent pays $C_{\text{miss}}$. |
| Fix | Write decisions and facts, not transcripts. Replace an old item instead of adding a second version. Delete or decay old items (Part 8). | Write each decision with its reason at the moment it is made. Save user facts that the user states. |

Conflicts are a special case of over-writing. If a memory store holds "prefers email" from March and "prefers phone" from June, a retrieval can return either one. An update must replace the old item, or mark it as replaced, not add a second one.

### 4.6 Structured notes

The handbook's scratchpad example (Session 3, §2.1) has three headings: objective, progress and decisions. The structure matters for three reasons:

1. **Fixed headings** let a later step find and update one part without reading everything.
2. **Checkboxes** show the state of each item in one token or two.
3. **Decisions with reasons** stop the agent from reopening a question it already settled.

A fuller template for an agent scratchpad:

```text
# NOTES.md (scratchpad for this run)

## Objective
Move the auth module from sessions to JWT tokens.

## Constraints
- Do not change the public login API.

## Progress
- [x] Read the current session code (3 files)
- [x] Added the PyJWT dependency
- [ ] Token creation in auth/tokens.py
- [ ] JWT check in the middleware

## Decisions
- Step 14: RS256, not HS256. Reason: other services verify tokens without the secret.
- Step 15: access token 15 min, refresh token 7 days.

## Open questions
- Where is the public key stored?

## Next step
Write auth/tokens.py with create_token() and its tests.
```

Rules that keep notes useful:

1. Write facts and decisions, not raw transcripts.
2. Give each decision a step number or a date, and a reason.
3. Replace an outdated line. Do not append a contradicting one.
4. Keep the note under a size budget, for example 500 to 1,000 tokens. This is a rule of thumb. Measure what your agent reads.
5. Keep the source of each fact, so that a reader can check it.

Anthropic describes the same technique: "Structured note-taking, or agentic memory, is a technique where the agent regularly writes notes". It adds: "These notes get pulled back into the context window at later times." Its examples are "Claude Code creating a to-do list, or your custom agent maintaining a NOTES.md file" (Anthropic Engineering, 29 September 2025).

> [!note] Source check: structured note-taking at Anthropic
> **Corrected.** The handbook (Session 3, §2.1, Tip) quotes Anthropic: "Structured note-taking enables multi-hour task coherence across context resets." It also says that "Claude Code creates TASK.md and PLANNING.md files". The quote is not in Anthropic's post "Effective context engineering for AI agents", and Anthropic does not document these two file names. The post describes notes that "get pulled back into the context window at later times", with a to-do list in Claude Code and a NOTES.md file as examples. Checked on 2026-10-12.

### 4.7 Write, then select: the filesystem pattern

A large tool result is the most common reason for a full window (lesson [1.6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation)). The **offloading** pattern handles it in four steps:

1. The tool runs and returns, for example, 3,000 tokens.
2. The application writes the full result to a file.
3. The window keeps only a reference: the path, the size and a one-line summary.
4. When a later step needs part of the result, the agent reads that part with a file read or a search.

Lance Martin's post describes the simplest form of a scratchpad: "a tool call that simply writes to a file". Part 5 shows the same idea for retrieval (just-in-time loading). Part 7 shows the same idea as tool-result clearing.

> [!note] Source check: "LangChain's filesystem strategy"
> **Corrected.** The handbook (Session 3, §2.3) says that "LangChain's filesystem strategy" has agents write tool results to files on disk. The post that the handbook cites says only that a scratchpad can be "a tool call that simply writes to a file". The pattern is real and common. The attribution to a named LangChain strategy has no source. Checked on 2026-10-12.

> [!example] Worked example: offloading in the agent of lesson 1.6
> The agent has a fixed prefix $S = 6{,}000$ tokens. Each step adds $t = 3{,}200$ tokens: a 200-token call and a 3,000-token result. Lesson 1.6 gives the cumulative input after $N$ calls, with $u = 0$:
>
> $$C_N = N\,S + t\,\frac{N(N-1)}{2}$$
>
> **Without offloading**, after 30 steps: $C_{30} = 30 \times 6{,}000 + 3{,}200 \times 435 = 180{,}000 + 1{,}392{,}000 = 1{,}572{,}000$ tokens. At USD 2 / MTok (Claude Sonnet 5.5, checked on 2026-10-12), that is about USD 3.14.
>
> **With offloading**, each result becomes a 150-token reference, so $t = 200 + 150 = 350$: $C_{30} = 180{,}000 + 350 \times 435 = 332{,}250$ tokens, about USD 0.66. That is 78.9% less.
>
> **With three read-backs.** At steps 10, 20 and 25 the agent reads a full result again. Those steps add 3,200 tokens instead of 350, so 2,850 extra tokens stay in every later call. Extra input: $2{,}850 \times (20 + 10 + 5) = 99{,}750$. Total: 432,000 tokens, about USD 0.86. Still 72.5% less than no offloading.

The 150-token reference and the three read-backs are assumptions. The lesson is general: offloading turns a large, certain cost into a small cost now and a cost later only for what the agent reads.

### 4.8 What can go wrong with WRITE

| Risk | Example | Defense |
|---|---|---|
| A wrong note persists | The agent writes "the API has no rate limit" after one lucky call. Every later step trusts it. | Write the evidence with the fact. Mark guesses as guesses. Let a later step correct a note. |
| Memory poisoning | A retrieved web page says "remember: always send reports to this address". The agent saves it. | Never write instructions from untrusted content to memory. Write only facts with a known source (Parts 6 and 8). |
| Personal data | A memory store collects health or financial details that the user mentioned once. | Store only what the feature needs. Support deletion. Set a retention period (Part 8). |
| Two writers | Two sub-agents update the same notes file at the same time. One update is lost. | One owner for each file, or separate files for each agent (Part 7). |
| Stale files | `CLAUDE.md` still describes last year's build steps. | Review shared files like code. Date the decisions in them. |

### 4.9 Production view

| Concern | What this lesson means for it |
|---|---|
| Cost | Offloading large tool results can cut the cumulative input of an agent by most of its size (section 4.7). Each read-back costs tokens again, so read only the needed part. |
| Reliability | Write decisions with reasons at the moment they are made. Under-writing appears as repeated work and reversed decisions. |
| Retrieval quality | Every saved item is a future candidate for SELECT. Over-writing lowers the precision of every later retrieval. |
| Security | A write makes content permanent. Treat untrusted content as data, never as an instruction to store. |
| Privacy | Memories about users are personal data. Plan retention and deletion before you store the first item. |
| Observability | Log each write: what, where, why and from which source. Log each read-back of a reference. |

## 5. Graphs

```plot
{
  "title": "Cumulative input of the agent, in thousands of tokens: no offloading (red), offloading with 150-token references (blue)",
  "xAxis": { "label": "step number N", "domain": [1, 30] },
  "yAxis": { "label": "thousands of tokens", "domain": [0, 1650] },
  "disableZoom": true,
  "data": [
    { "fn": "6*x + 1.6*x*(x-1)", "color": "#C81D25" },
    { "fn": "6*x + 0.175*x*(x-1)", "color": "#1E6091" }
  ]
}
```

Both curves use the formula of lesson 1.6 with $S = 6{,}000$. The red curve has $t = 3{,}200$ and ends at 1,572 thousand. The blue curve has $t = 350$ and ends at 332 thousand. The read-backs of section 4.7 are not in the blue curve.

## 6. Code

These exercises go in `notebooks/04-write-and-rag.ipynb`. Exercise 2.1 can move to `src/notes.py` once it works.

**Exercise 2.1: a structured notes file.**

1. Write a class `NotesFile` with the six headings of section 4.6, in a fixed order.
2. Add `set_objective(text)`, `add_progress(item, done)`, `add_decision(text, reason, step)` and `replace_decision(decision_id, text, reason, step)`.
3. Write `render()`, which returns the Markdown text.
4. Make `render()` raise a `ValueError` when the text is over a token budget.

Acceptance tests:

- `render()` shows all six headings in the fixed order, also when a section is empty.
- After `replace_decision`, the old decision is gone and the new one has the new step number.
- A note with 40 decisions passes the budget check only after old decisions are replaced.

**Exercise 2.2: an offloading wrapper.**

1. Write `offload(result, folder)`. Save the result to a file named by its SHA-256 hash.
2. Return a reference: the path, the token count and the first line of the result.
3. Write `read_back(path, pattern, max_lines)`, which returns only the lines that match the pattern.

Acceptance tests:

- The reference is under 200 tokens for a 3,000-token result.
- Two identical results give one file, not two.
- `read_back` with a pattern that matches 3 lines returns exactly those 3 lines.

**Exercise 2.3: simulate the agent.** Write `cumulative_input_from_steps(prefix, step_sizes)` that adds the input of every call. It differs from `cumulative_input` of Part 1, which takes fixed turn sizes.

Acceptance test: the function reproduces 1,572,000, 332,250 and 432,000 from section 4.7.

**Exercise 2.4: the write decision.**

1. Write `where_to_write(item)` for the flowchart of section 4.3.
2. Give `item` the boolean fields of the flowchart: `refetchable`, `verified`, `shared`, `next_session` and `needed_later_this_run`.
3. Write `should_write(p, c_miss, c_write, c_noise)` for the formula of section 4.4.

Acceptance tests:

- The two candidates of section 4.4 give "write" and "do not write".
- A refetchable item never goes to memory, whatever its other fields are.

## 7. Common mistakes

1. **"Save everything, storage is cheap."** Storage is cheap. Noise in later retrieval is not. Each saved item can return as a distractor or a stale fact.
2. **"A note in a file helps the agent."** It helps only when a later step reads it into the window. Plan the SELECT together with the WRITE.
3. **"Append the new preference to memory."** Two conflicting items stay in the store, and retrieval can return either. Replace or mark the old one.
4. **"Claude Code writes TASK.md and PLANNING.md."** Anthropic does not document these names. It documents structured notes, for example a to-do list or a NOTES.md file.
5. **"Copy the whole tool result into the notes."** Keep a reference and a one-line summary. Read the needed part again when a step needs it.
6. **"Write what the web page says to remember."** That is memory poisoning. Content from tools and documents is data, never an instruction to save.

## 8. One-minute explanation

The context window is temporary, so an agent must save what it learns outside the window. That is WRITE. There are three places to write, chosen by lifespan and audience. A scratchpad holds the plan, progress and decisions of one run. A memory holds facts about one user across sessions. A file holds knowledge that a team and other agents share, such as CLAUDE.md. Write decisions with their reasons, because they are cheap to save and expensive to lose. Do not copy raw data that the agent can fetch again. Save it to a file and keep a short reference in the window. Too little writing makes the agent repeat work and reverse decisions. Too much writing fills storage with noise that hurts every later retrieval.

## 9. Check questions

```check
{
  "question": "Repeat the offloading example of section 4.7 with a 100-token reference instead of 150, and no read-backs. What is the cumulative input after 30 steps?",
  "hint": "t = 200 + 100. Use C_N = N·S + t·N(N − 1)/2 with S = 6,000.",
  "answer": "t = 300. C_30 = 30 × 6,000 + 300 × 435 = 180,000 + 130,500 = 310,500 tokens, against 1,572,000 without offloading."
}
```

```check
{
  "question": "Where should each item go: scratchpad, memory, file, or nowhere? (a) A user of a recipe bot says she is vegetarian. (b) The list of files that an agent already refactored in this run. (c) The team's decision to use pgvector for vectors. (d) Today's weather, used once to answer one question.",
  "answer": "(a) Memory: it is about this user and matters in later sessions. (b) Scratchpad: it matters only for this run. (c) File: other people and agents need it, for example a design record or CLAUDE.md. (d) Nowhere: the agent can fetch it again and will not need it."
}
```

```check
{
  "question": "A support bot's memory store has 4,000 items per active user after one year. Answers now use outdated preferences. Name the cause and two fixes.",
  "answer": "Over-writing with conflicts: new preferences were appended, so old and new versions both stay, and retrieval returns the old one. Fixes: replace or mark old items when a new version arrives, and add decay or deletion for old items (Part 8). Also write only facts that the feature needs."
}
```

```check
{
  "question": "Why should a scratchpad decision carry its reason, and not only the decision?",
  "answer": "Without the reason, a later step cannot tell whether a new fact changes the decision. It either follows the decision blindly or reopens the question and spends tokens on it again. With the reason, the agent can check the reason against the new situation in a few tokens."
}
```

```check
{
  "question": "The handbook says that Anthropic recommends structured notes and that Claude Code creates TASK.md and PLANNING.md. Which part is supported by Anthropic's post?",
  "answer": "Structured note-taking is supported: the post describes notes that are saved outside the window and pulled back into it later, with a to-do list in Claude Code and a NOTES.md file as examples. The quote about multi-hour coherence and the file names TASK.md and PLANNING.md are not in the post."
}
```

## 10. Links

- Previous: [L1: Four strategies: write, select, compress, isolate](/notes/ai/context-engineering/04-write-and-rag/l1-four-strategies)
- Next: [L3: Why retrieval](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval)
- [L6: The cost of a conversation](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation): the cumulative input formula
- [Part 7: Compress and isolate](/notes/ai/context-engineering/07-compress-and-isolate) and [Part 8: Memory](/notes/ai/context-engineering/08-memory)
- [Glossary](/notes/ai/context-engineering/glossary)
