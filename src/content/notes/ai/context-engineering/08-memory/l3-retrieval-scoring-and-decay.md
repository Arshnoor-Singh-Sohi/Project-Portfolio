---
title: "L3: Retrieval, scoring and decay"
order: 3
summary: "Five ways to find stored memories, the Generative Agents score (recency, importance and relevance with exact constants), two decay models with half-life math, stability tiers, and ACT-R activation as background."
status: not-started
tags: [memory, retrieval, scoring, decay, half-life, generative-agents]
---

## 1. The question this idea answers

A user has 5,000 stored memories. The memory budget allows about 20 of them on one call (lesson [8.1](/notes/ai/context-engineering/08-memory/l1-stateless-models-stateful-apps)). Which 20?

A second question follows from the first. Three months ago the user wrote: "I am working on a deadline this Friday." The handbook (Session 6, FAQ Q6) says that such a fact is "not just stale; it is actively misleading". When should a memory stop counting, and when should it stop being found at all? This lesson gives exact formulas for both questions.

## 2. Mental model

> [!analogy] A librarian who prepares a reader's desk
> Each morning a librarian puts 20 books on a reader's desk. She asks three questions about each book. Did the reader use it recently? Is it an important book? Is it about today's topic? A book that scores well on the three questions together goes on the desk. Books that nobody opens for a long time go to the basement.
>
> **Where it stops working:** the librarian judges importance with years of experience. An LLM assigns importance with one prompt, and the number can change between runs. Also, the librarian's scores are absolute. The scores below are **relative** to the other candidates, so one new book can change every score.

## 3. Terms

| Term | Plain meaning |
|---|---|
| text retrieval | Finding memories that share words with the query, with keyword or fuzzy matching. |
| embedding retrieval | Finding memories whose embedding vectors are close to the query's vector, usually by cosine similarity. |
| temporal retrieval | Finding memories by time, for example the most recent ones first. |
| associative retrieval | Finding memories by following links between them, for example the same entity or the same ticket. |
| learned retrieval | Ranking memories with a model trained on usage data, such as which injected memories the agent used. |
| recency score | A number that falls as time passes since a memory was last used. |
| importance score | A number that says how much a memory matters, independent of the current query. |
| relevance score | A number that says how well a memory matches the current query. |
| min-max normalization | Rescaling a set of values to the range 0 to 1: the smallest becomes 0 and the largest becomes 1. |
| memory stream | In Generative Agents, the full list of an agent's memories, each with a creation time and a last-access time. |
| decay | A rule that lowers the weight of a memory, or removes it, as time passes. |
| TTL decay | A decay rule that archives or deletes a memory when the time since its last access passes a fixed limit. |
| exponential decay | A decay rule that multiplies a score by the same factor in each time unit. |
| half-life | The time after which a decaying score has fallen to half of its starting value. |
| stability tier | A label for how long a memory should stay useful: eternal, stable, evolving or experimental. |
| base-level activation | In the ACT-R theory of cognition, a number for how available a memory is. It rises with each use and falls as a power of the time since each use. |
| power-law decay | Decay in which a value falls as a power of time, such as $t^{-0.5}$. It falls fast at first and then very slowly. |

## 4. Method and math

### 4.1 Five ways to find memories

The handbook (Session 6, §2.2, Table 1) lists five retrieval methods:

| Method | How it works | Best for | Cost (handbook) | Where this subject teaches it |
|---|---|---|---|---|
| Text similarity | Keyword or fuzzy match | Exact recall: "what did they say about X?" | Low | [5.1: BM25](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| Semantic embeddings | Vector similarity | Conceptual recall: "anything related to auth?" | Medium | [4.6: Embeddings](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| Temporal proximity | Recent first, decay with time | Session continuity and recency | Low | This lesson |
| Associative chains | Follow links between related items | Moving across topics | Medium | Graph memory (Mem0g), lesson 8.8 |
| Learned patterns | A model ranks items from usage data | Large production systems | High | Not taught here. It needs logs such as memory precision (lesson 8.8). |

The table caption says that the methods are "ordered by implementation complexity". The cost column does not follow that order: it reads Low, Medium, Low, Medium, High. Treat the order as loose.

The handbook's tip is a rule of thumb: "start with temporal retrieval", add embeddings "when conversations go beyond 20 turns", and add associative retrieval "when you need cross-session memory". Measure on your own data before you add a method. In practice, most systems combine methods, as the score in the next section does.

### 4.2 The Generative Agents score

Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023, arXiv 2304.03442), keep each agent's memories in a **memory stream**. To retrieve, they score every memory $m$ with three components and sum them:

$$
\text{score}(m) = \alpha_{rec}\,\widehat{\text{rec}}(m) + \alpha_{imp}\,\widehat{\text{imp}}(m) + \alpha_{rel}\,\widehat{\text{rel}}(m)
$$

$$
\text{rec}(m) = 0.995^{\,h}, \qquad \widehat{x}(m) = \frac{x(m) - \min x}{\max x - \min x}
$$

The symbols mean:

- $\text{rec}(m)$ is the recency of memory $m$. The paper says: "Our decay factor is 0.995."
- $h$ is the number of sandbox game hours since the memory was **last retrieved**, not since it was created.
- $\text{imp}(m)$ is the importance: an integer from 1 to 10 that the LLM assigns when the memory is created. The prompt says that "1 is purely mundane".
- $\text{rel}(m)$ is the relevance: the cosine similarity between the memory's embedding and the query's embedding.
- $\widehat{x}$ is the min-max normalized value of a component. The minimum and maximum are taken over the candidate memories.
- $\alpha_{rec}$, $\alpha_{imp}$ and $\alpha_{rel}$ are weights. The paper says: "In our implementation, all αs are set to 1."

The top-scoring memories that fit the window go into the prompt.

> [!example] Worked example: three memories for one query
> The query is "Which database did we pick for the inventory service?" The cosine values are assumed for the example. A real embedding model gives other values.
>
> **Step 1: raw values.**
>
> | Memory | Text | Hours since last retrieval | Importance | Cosine |
> |---|---|---|---|---|
> | m1 | "We chose PostgreSQL over MongoDB for the inventory service." | 72 | 8 | 0.82 |
> | m2 | "Thanks, that makes sense." | 1 | 1 | 0.35 |
> | m3 | "The analytics pipeline uses MongoDB." | 500 | 6 | 0.71 |
>
> **Step 2: recency.** $0.995^{72} = 0.6970$, $0.995^{1} = 0.9950$, $0.995^{500} = 0.0816$.
>
> **Step 3: normalize each column.**
>
> - Recency: min 0.0816, max 0.9950, range 0.9134. m1: $(0.6970 - 0.0816) / 0.9134 = 0.6738$. m2: 1. m3: 0.
> - Importance: min 1, max 8, range 7. m1: 1. m2: 0. m3: $(6 - 1)/7 = 0.7143$.
> - Relevance: min 0.35, max 0.82, range 0.47. m1: 1. m2: 0. m3: $(0.71 - 0.35)/0.47 = 0.7660$.
>
> **Step 4: sum with all weights equal to 1.**
>
> | Memory | Recency | Importance | Relevance | Score |
> |---|---|---|---|---|
> | m1 | 0.6738 | 1.0000 | 1.0000 | **2.6738** |
> | m2 | 1.0000 | 0.0000 | 0.0000 | 1.0000 |
> | m3 | 0.0000 | 0.7143 | 0.7660 | 1.4802 |
>
> The ranking is m1, m3, m2. The filler message m2 is the most recent, but importance and relevance keep it last.

Four properties of this score matter in production:

1. **Recency resets on retrieval.** A memory that the agent uses stays fresh. So the store must update the last-access time on every read. The handbook's SQLite code does not do this (lesson [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory)). This rule also creates a feedback loop: a memory that wins once becomes recent and can win again. Some systems refresh recency only when the answer actually uses the memory.
2. **Scores are relative.** Remove m2 from the example, and each column has only two values. Every normalized value is then 0 or 1: m1 scores 3 and m3 scores 0. One candidate more or less changes every score.
3. **One candidate breaks the formula.** With one candidate, $\max x = \min x$ and the division is by zero. Define the normalized value as 1 in that case.
4. **The weights are a choice.** Equal weights worked for the paper's simulation. For a support agent, relevance may need more weight. Tune the weights on a labeled set of queries.

The paper also uses the importance scores to trigger **reflection** (lesson [8.2](/notes/ai/context-engineering/08-memory/l2-three-kinds-of-memory)). The handbook never cites this paper. Its "priority pruning" and the FAQ's composite of recency, frequency and importance (Session 6, FAQ Q9) follow the same idea.

### 4.3 Two decay models in the handbook

The handbook gives two different decay rules for the same four tiers.

**Model A, time to live (lecture, Listing 5).** A background job checks the time since the last access of each memory. When it passes the tier's limit, the job archives or deletes the memory:

| Tier | Limit |
|---|---|
| Eternal | None |
| Stable | 90 days |
| Evolving | 14 days |
| Experimental | 24 hours |

**Model B, exponential score (FAQ Q15).** The score falls by the same factor in each time unit. The system prunes a memory when its score falls below 0.1:

$$
s(t) = s_0 \, r^{\,t}
$$

The symbols mean:

- $s_0$ is the starting score, and $s(t)$ is the score after time $t$.
- $r$ is the factor per time unit: 1.0 for eternal, 0.95 per week for stable, 0.90 per day for evolving. Experimental memories are deleted after 24 hours.

To find when a score reaches a fraction $x$ of its start, solve $r^{t} = x$ for $t$:

$$
t_x = \frac{\ln x}{\ln r}, \qquad t_{1/2} = \frac{\ln 0.5}{\ln r}
$$

> [!example] Worked example: when does each model remove a memory?
> **Stable tier,** $r = 0.95$ per week, $\ln 0.95 = -0.051293$:
>
> - Half-life: $0.693147 / 0.051293 = 13.51$ weeks, about 94.6 days.
> - Time to reach 0.1: $2.302585 / 0.051293 = 44.89$ weeks, about 314 days.
> - Score at the 90-day TTL: $0.95^{90/7} = 0.517$.
>
> **Evolving tier,** $r = 0.90$ per day, $\ln 0.90 = -0.105361$:
>
> - Half-life: $0.693147 / 0.105361 = 6.58$ days.
> - Time to reach 0.1: $2.302585 / 0.105361 = 21.85$ days.
> - Score at the 14-day TTL: $0.9^{14} = 0.229$.
>
> So model A removes a stable memory at 90 days, when model B still gives it more than half of its score. Model B removes it only after about 314 days. For evolving memories, model A removes at 14 days and model B at about 22 days.

| Tier | Model A removes at | Model B score at that time | Model B removes at (score 0.1) |
|---|---|---|---|
| Eternal | Never | 1.0 | Never |
| Stable | 90 days | 0.517 | 44.9 weeks (about 314 days) |
| Evolving | 14 days | 0.229 | 21.9 days |
| Experimental | 24 hours | Deleted | 24 hours |

> [!note] Source check: two decay models that disagree
> **Corrected.** The lecture (Session 6, Listing 5) uses fixed limits since the last access: 90 days, 14 days and 24 hours. The FAQ (Q15) uses exponential scores of $0.95^{\text{weeks}}$ and $0.90^{\text{days}}$ with pruning below 0.1. They remove memories at different times: about 314 days against 90 for stable, and about 22 days against 14 for evolving. FAQ Q27 says that at 10% per day, decisions are at "25% relevance" after two weeks. The exact value is $0.9^{14} = 22.9\%$. Source: the arithmetic above, computed with Python's `math.log`.

The FAQ does not say whether $t$ counts from creation or from the last access. Only its experimental rule names a start: `created_at`. Count from the **last access**, as Generative Agents does. Then a memory that the agent keeps using does not decay.

### 4.4 Use both models, for two different jobs

The two models answer different questions:

| Question | Tool | Why |
|---|---|---|
| How much should this memory count in today's ranking? | A soft score, such as model B, multiplied into the retrieval score | A fading score still lets a very relevant old memory win |
| Should this memory still be searchable at all? | A hard rule, such as model A, run by a nightly job | Old items cost storage and search time, and some must leave by policy |

The handbook's FAQ (Q15) combines the decayed score with vector similarity "ensuring that a highly relevant but old memory can still surface". That is the soft job. The lecture's background process is the hard job. A good design uses both and logs every archive action.

### 4.5 Stability tiers

The handbook (Session 6, §4.1, Table 4) defines four tiers:

| Tier | Decay (handbook) | Examples |
|---|---|---|
| Eternal | Never | Name, core language preference, basic project type |
| Stable | Months | Project conventions, team standards, architectural decisions |
| Evolving | Days to weeks | Current task, recent decisions, active blockers |
| Experimental | Hours | Hypotheses, temporary debugging notes |

The handbook's tip: set the tier when you create the memory. Explicit statements ("My name is Alice") are eternal. Inferred preferences ("The user seems to prefer short responses") are evolving. You can also ask an LLM: "Is this a permanent fact or a temporary note?"

FAQ Q27 lists three failure modes of a wrong configuration:

1. **Too fast.** Project decisions in the evolving tier fall to 0.229 after two weeks, before the user returns to them. The agent then asks the user to confirm choices again. Fix: put decisions in the stable tier.
2. **Too slow.** "Deadline this Friday" from six months ago still appears. Fix: faster decay for task context.
3. **Wrong tier.** An eternal item that should change, or an experimental note that should stay. Fix: a regular pass that changes tiers based on actual access patterns.

> [!trap] Eternal does not mean undeletable
> "Eternal" means that the item never **decays**. A user can still ask for erasure, and the law can require it (lesson [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory)). Decay rules and deletion rules are separate code paths.

### 4.6 Background: ACT-R base-level activation

The handbook (Session 6, FAQ Q43) compares its decay model with ACT-R, a cognitive architecture from psychology. In ACT-R, the base-level activation of a memory chunk $i$ is:

$$
B_i = \ln\Big(\sum_{j=1}^{n} t_j^{-d}\Big)
$$

The symbols mean:

- $n$ is the number of times the chunk was used.
- $t_j$ is the time since the $j$-th use.
- $d$ is the decay parameter. The default is 0.5: "0.5 has emerged as the default value for the time-based decay parameter d" (Taatgen, Lebiere and Anderson, "Modeling paradigms in ACT-R").

> [!example] Worked example: frequency and recency together
> Time in hours, $d = 0.5$:
>
> - Used at 1, 10 and 100 hours ago: $1 + 0.3162 + 0.1 = 1.4162$, so $B = \ln 1.4162 = 0.348$.
> - Used once, 1 hour ago: $B = \ln 1 = 0$.
> - Used once, 100 hours ago: $B = \ln 0.1 = -2.303$.
>
> Each use adds a term, so a chunk used three times beats a chunk used once at the same latest time. A change of time unit, for example seconds instead of hours, shifts every $B$ by the same constant. The ranking does not change.

ACT-R decay is a **power law**, not an exponential. A single use gives $t^{-0.5}$: 0.1 after 100 hours, and still 0.01 after 10,000 hours. The Generative Agents recency $0.995^{h}$ is 0.1 after about 459 hours, but only about $1.7 \times 10^{-22}$ after 10,000 hours. So a power law keeps a long tail of old but once-frequent memories, and an exponential forgets them almost completely.

FAQ Q43 also says that "Research groups at Stanford and DeepMind" use ACT-R equations for memory scoring. This claim could not be verified, so do not repeat it.

### 4.7 Production view

| Concern | What this lesson means for it |
|---|---|
| Quality | Rank by a combined score, not by similarity alone. Recency and importance stop old or trivial items from winning. |
| Correctness | Update the last-access time on every read. Without it, recency and TTL decay measure the wrong thing. |
| Tuning | Fit the weights and decay rates on labeled queries from real logs. The paper's equal weights are a start, not a law. |
| Cost | Importance scoring needs one LLM call per new memory. Use a cheap model, and score at write time, not at read time. |
| Observability | Log the three components of the score for every injected memory, so that you can see why it won. |

## 5. Graphs

```plot
{
  "title": "Evolving tier: exponential score 0.9^days (red), TTL availability with a 14-day limit (blue), pruning threshold 0.1 (gold)",
  "xAxis": { "label": "days since last access", "domain": [0, 30] },
  "yAxis": { "label": "score or availability", "domain": [0, 1.05] },
  "disableZoom": true,
  "data": [
    { "fn": "0.9^x", "color": "#C81D25" },
    { "points": [[0, 1], [14, 1], [14, 0], [30, 0]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[14, 1], [14, 0]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true },
    { "fn": "0.1", "color": "#B8860B", "skipTip": true }
  ]
}
```

The blue step is availability under the TTL rule: 1 while the memory is searchable, 0 after the job archives it at day 14. The red curve crosses the gold line at about day 21.9.

```plot
{
  "title": "Stable tier: exponential score 0.95^weeks (red), TTL availability with a 90-day limit (blue), pruning threshold 0.1 (gold)",
  "xAxis": { "label": "days since last access", "domain": [0, 360] },
  "yAxis": { "label": "score or availability", "domain": [0, 1.05] },
  "disableZoom": true,
  "data": [
    { "fn": "0.95^(x/7)", "color": "#C81D25" },
    { "points": [[0, 1], [90, 1], [90, 0], [360, 0]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true },
    { "points": [[90, 1], [90, 0]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true },
    { "fn": "0.1", "color": "#B8860B", "skipTip": true }
  ]
}
```

At day 90 the red curve is still at 0.517, but the blue rule already archived the memory. The red curve reaches the gold line at about day 314.

## 6. Code

These exercises go in `notebooks/08-memory.ipynb`. Use `sentence-transformers` with `all-MiniLM-L6-v2` for embeddings, so that they cost nothing.

**Exercise 3.1: the Generative Agents scorer.**

1. Write `recency(hours, factor=0.995)`, `minmax(values)` and `ga_scores(memories, query_vec, now)`.
2. `minmax` returns 1.0 for every value when all values are equal.
3. Each memory has `last_retrieved`, `importance` and `embedding`.

Acceptance tests:

- With the three memories of section 4.2 and the given cosine values, the scores are 2.6738, 1.0000 and 1.4802 (to four decimals).
- With one candidate, the function returns a score and does not divide by zero.
- After `retrieve()` returns a memory, its `last_retrieved` equals `now`.

**Exercise 3.2: the two decay models.**

1. Write `ttl_alive(tier, days_since_access)` for model A and `exp_score(tier, days_since_access)` for model B.
2. Write `time_to(x, r)` that returns $\ln x / \ln r$.

Acceptance tests:

- `time_to(0.1, 0.95)` returns 44.89 (weeks) and `time_to(0.1, 0.90)` returns 21.85 (days).
- `exp_score("stable", 90)` returns 0.517 and `ttl_alive("stable", 90.5)` returns `False`.
- Plot both models for each tier and compare with section 5.

**Exercise 3.3: which retrieval method wins?**

1. Write 40 synthetic memories for one user over 60 days, and 12 queries with the correct memory marked.
2. Rank with BM25 (`rank_bm25`), with embeddings, with recency only, and with the combined score.

Acceptance tests:

- A table of hit@3 for the four methods.
- Two queries where recency alone fails, and two where embeddings alone fail, each with the reason.

## 7. Common mistakes

1. **"Rank memories by similarity only."** Old and trivial items then win. Add recency and importance, as Generative Agents does.
2. **"Recency counts from creation."** In Generative Agents it counts from the last retrieval, so the store must record reads.
3. **"A normalized score of 1.0 means a good memory."** Min-max scores are relative to the current candidates. The best of three bad memories still gets 1.0.
4. **"The TTL model and the exponential model are the same thing."** They remove memories at different times: 90 days against about 314 for the stable tier.
5. **"Eternal memories never leave."** They never decay, but erasure requests and retention policies still apply.

## 8. One-minute explanation

A memory store is much larger than one call's budget, so the system must rank. Generative Agents ranks each memory by three parts: recency, importance and relevance. Recency is 0.995 to the power of the hours since the memory was last retrieved. Importance is a 1-to-10 rating from the model when the memory is written. Relevance is the cosine similarity with the query. Each part is rescaled to 0 to 1 across the candidates, and the three are added with equal weights. Decay handles time. A soft exponential score lowers old memories in the ranking. A hard time limit removes them from search. The handbook's two decay models disagree: at 0.95 per week a stable memory reaches 0.1 after about 45 weeks, not 90 days. Always update the access time when you read a memory.

## 9. Check questions

```check
{
  "question": "A score decays by a factor of 0.8 per day. What is its half-life, and when does it reach 0.1?",
  "hint": "t_x = ln x / ln r.",
  "answer": "Half-life: ln 0.5 / ln 0.8 = −0.6931 / −0.2231 ≈ 3.11 days. Time to 0.1: ln 0.1 / ln 0.8 = −2.3026 / −0.2231 ≈ 10.32 days."
}
```

```check
{
  "question": "An evolving memory was last accessed 20 days ago. Is it still searchable under the lecture's TTL rule? What is its score under the FAQ's exponential rule?",
  "answer": "Under the TTL rule it was archived at 14 days, so it is not searchable. Under the exponential rule its score is 0.9^20 ≈ 0.122, which is still above the 0.1 threshold, so it is still searchable."
}
```

```check
{
  "question": "In the worked example of section 4.2, you remove the filler memory m2. What happens to the normalized scores of m1 and m3, and why is this a problem?",
  "answer": "With two candidates, each column has one minimum and one maximum, so every normalized value is 0 or 1. m1 gets 1 + 1 + 1 = 3 and m3 gets 0. The differences between them look larger than they are. Min-max scores depend on which candidates you compare."
}
```

```check
{
  "question": "A chunk in ACT-R was used 4 hours and 16 hours ago. With d = 0.5, what is its base-level activation?",
  "hint": "B = ln(sum of t^(−d)).",
  "answer": "4^(−0.5) = 0.5 and 16^(−0.5) = 0.25. The sum is 0.75, and B = ln 0.75 ≈ −0.288."
}
```

```check
{
  "question": "A support bot keeps mentioning \"your deadline this Friday\" to a user who set that deadline six months ago. Name two likely causes in the memory design and one fix for each.",
  "answer": "Cause 1: the fact was stored in a tier that never decays, or decays too slowly. Fix: put task deadlines in the evolving or experimental tier. Cause 2: the store updates the access time when the memory is injected, so each injection keeps it fresh. Fix: refresh recency only when the agent actually uses the memory, or add an expiry date to facts with a date in them."
}
```

## 10. Links

- Previous: [L2: Three kinds of memory](/notes/ai/context-engineering/08-memory/l2-three-kinds-of-memory)
- Next: [L4: Hot, warm and cold tiers](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers)
- [4.6: Embeddings and similarity](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) and [5.1: BM25](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25)
- [L6: Persistent memory](/notes/ai/context-engineering/08-memory/l6-persistent-memory): access tracking in the store
- [Glossary](/notes/ai/context-engineering/glossary)
