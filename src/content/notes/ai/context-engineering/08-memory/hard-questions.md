---
title: "Hard questions: Memory"
order: 99
summary: "Tricky, skeptical and interview questions on LLM memory: huge windows, build against buy, databases, compression, the three meanings of KV, deletion, cold start, multi-agent scopes, caching, self-managed memory, ACE claims, native memory and false memories."
status: not-started
tags: [memory, interview, review]
---

Answer each question aloud first. Then read the answer. The lesson code after each idea shows where it comes from.

## 1. Context windows will soon hold 10 million tokens. Will memory systems become unnecessary?

No. The handbook (Session 6, FAQ Q48) puts it in one line: "This is curation, not capacity." Four reasons:

1. **Cost.** Ten million input tokens at USD 2 / MTok (Claude Sonnet 5.5, checked on 2026-10-12) cost USD 20 per call. Even at the cached read rate of 0.05 times, one call costs USD 1 (lesson 1.7). That is dollars per message.
2. **Quality.** Accuracy falls with length and depends on position (lesson 1.5). Chroma tested a conversational-memory benchmark. Every model did much better with a focused prompt of about 300 tokens than with the full prompt of about 113,000 tokens.
3. **Continuity.** The window resets on every call. Facts from last month must still live in a store and be selected for each call (lesson 8.1).
4. **Control.** Isolation between users, deletion and audit are properties of a store, not of a window (lesson 8.6).

A larger window moves the limit. It does not remove the need to choose what goes in.

## 2. Isn't a custom memory system over-engineering? Why not use Mem0, or ChatGPT's memory?

Often a product is the right call. The FAQ (Q49) says that a product gets you "80% of the way with 5% of the effort" for basic preference recall. That figure is an estimate, not a measurement. ChatGPT's memory is a feature of the ChatGPT app. It does not give your own API application a memory store.

The FAQ names three cases in which you build your own or extend a product. You must exclude some kinds of data from storage. You need your own decay or lifecycle. Or several agents need separate scopes (lesson 8.8). Also check the evidence. In the Mem0 paper's own LOCOMO test, full context scored 72.90 on the judge metric and Mem0 66.88. Mem0 was much faster and cheaper per query, but less accurate. Whatever you choose, you still own isolation, the memory budget, deletion and evaluation.

## 3. Are we just reinventing databases?

Partly, and that is fine. At the storage level, memories are rows (FAQ Q50). A memory system adds an intelligence layer on top of the database:

| Layer | Plain database | Memory system |
|---|---|---|
| Write | Your code writes known columns | Extraction turns free conversation into facts, with conflicts and supersedes (lessons 8.5, 8.6) |
| Read | Exact queries on known keys | Ranking by relevance, recency and importance under a token budget (lesson 8.3) |
| Time | Rows stay until deleted | Decay, archival and access tracking (lessons 8.3, 8.6) |
| Use | Results go to code | Results go into a prompt, in a chosen position (lesson 8.8) |

The FAQ compares it to "a file system and a search engine". Build the memory layer on a proven database, such as PostgreSQL with pgvector.

## 4. Compression and memory both shrink context. Are they the same thing?

No. They are "two sides of the same coin" (FAQ Q20). Compression decides what stays in **this** window. Memory decides what survives **into later** sessions and how it comes back. In a pipeline, the session summary becomes an episodic memory, and the extracted facts become semantic memories (lesson 8.1). The FAQ states both failure cases. Compression without memory starts every session from scratch. Memory without compression lets the current session degrade as it grows.

## 5. The KV cache, prompt caching and key-value extraction all mention "KV". How are they related?

They share letters, not a mechanism (FAQ Q40):

1. The **KV cache** holds the attention keys and values of earlier tokens inside one call, so that decode does not recompute them (lesson 1.4).
2. **Prompt caching** keeps the KV cache of a prompt prefix after the call ends. A later call with the same prefix then skips that work (lesson 1.7).
3. **Key-value extraction** stores facts as named fields in your own database, such as `database: PostgreSQL` (lesson 8.5).

Memory decides **what** enters the context. Caching makes it cheaper to send the same content again. A memory block that changes on every call works against caching, so place it near the end.

## 6. A user asks you to delete everything you know about them. What must happen?

GDPR Article 17 gives a right to erasure "without undue delay" on six grounds, with exceptions. The CCPA gives Californians a similar right (lesson 8.6). Technically, one function must reach every copy:

1. Current, history and archive rows in SQL, and any JSON files.
2. Vector index entries. Embeddings are personal data: Morris et al. (EMNLP 2023) recover 92% of 32-token inputs exactly from their embeddings.
3. Session caches, and logs and traces that contain memory text.
4. Facts and rules derived from the user's episodes.
5. Backups and processors, such as a hosted vector database.

Provider prompt caches expire after their lifetime. Write an audit record with counts and times, but not the deleted content. An "eternal" tier means no decay, not exemption from deletion. This is engineering advice, not legal advice.

## 7. A new user has no memory at all. How do you avoid a generic first session?

The FAQ (Q29) gives three methods, and suggests combining them:

1. **Onboarding:** ask 3 to 5 key questions in the first session and store the answers.
2. **Aggressive extraction:** one message such as "Help me build a REST API in Python with FastAPI and PostgreSQL" gives 4 to 5 facts.
3. **Archetype profiles:** start from the closest default profile, such as "senior engineer", and refine it.

Two cautions. Store archetype guesses as inferred facts in a decaying tier, because they are assumptions about the user. And ask only for data that the product needs.

## 8. A research agent, a code agent and an orchestrator share one memory store. How do you scope it?

Give each agent its own namespace, plus a shared one (FAQ Q26). For example, `memory.research.episodic` for past searches, `memory.code.procedural` for coding rules, and `memory.shared.semantic` for user preferences and project constraints. Store all of them in one database, and filter by namespace on every read.

Three rules make it safe:

1. Each agent reads its own namespace and the shared one. The code agent does not need the research agent's search history. It would only pollute the code agent's context.
2. Writes to the shared namespace need a stricter path, because every agent will trust them. Review new shared procedural rules.
3. Enforce the scopes in the database, like user isolation (lesson 8.6). A prompt that says "use only your memories" is not a control.

## 9. Does prompt caching make memory injection "nearly free"?

No (FAQ Q37 overstates it). Cached reads are cheap: 0.1 times the input price on most Claude models, 0.05 times on Sonnet 5.5 and Opus 5.5 (checked on 2026-10-12). But four facts limit the effect (lesson 1.7):

1. A cache write costs 1.25 times the input price for a 5-minute lifetime, or 2 times for 1 hour.
2. The default lifetime is 5 minutes, so the cache is usually cold when a user returns the next day.
3. The match is on the prefix. A memory block that changes breaks the cache for everything after it.
4. A prefix below the minimum size, 512 tokens on the newest Claude models, is not cached.

Lesson 8.8 shows the other side. Inside one active session with no pauses, cheap cache reads make full-history replay cheaper than a three-layer agent, at 20 turns and at 100. Pauses that let the cache expire can reverse this at 100 turns. The main value of memory is continuity, bounded context and control.

## 10. Should the model manage its own memory, or should the application?

Both designs exist. In MemGPT and Letta, the model edits memory blocks and searches recall and archival storage through tools. In Anthropic's memory tool, the model asks for file operations under `/memories`, and your code runs them (lesson 8.8). In the three-layer agent, code decides when to extract and what to inject.

| | Model-managed | Application-managed |
|---|---|---|
| Strength | Flexible: the model decides what matters, while it works | Predictable, testable and auditable |
| Weakness | The FAQ (Q34): "you are trusting the LLM to make good memory management decisions" | Fixed rules can miss what matters |
| Extra cost | Tool calls and their tokens | Extraction calls |
| Security | Validate every path and payload | Fewer moving parts |

A good hybrid: the model proposes memory writes, and the application enforces the user scope, the budget, validation and deletion.

## 11. The handbook says ACE is "exactly what" Claude, Cursor and ChatGPT memory do. Is it?

No. No vendor documents ACE-style playbooks (lesson 8.7). The two ideas also differ. ACE improves a **procedural** playbook for a task type from outcome signals, with a Generator, a Reflector, a Curator and delta updates. Consumer memory features keep facts and chat history about a **user**. ACE's real results are specific: on AppWorld, ReAct with ACE (offline, with ground-truth labels) scored 59.4 against 42.4 for ReAct alone. The handbook's table values and its coding row are not in the paper.

## 12. Will models with built-in memory, such as RETRO or Memorizing Transformers, make application memory obsolete?

Not for the problems that this part solves (FAQ Q45, Q47). RETRO (DeepMind, ICML 2022) retrieves from a database of 2 trillion tokens and matches GPT-3 on the Pile with 25 times fewer parameters. Memorizing Transformers (Google, ICLR 2022) add a kNN lookup into a memory of past keys and values, and perplexity improves up to 262K memory tokens. These methods give a model access to more text. They do not give per-user isolation, deletion on request, inspection of what is stored, or business rules such as "never store health data". Those stay at the application layer. The FAQ's "3–5 years minimum" is a forecast, not evidence.

## 13. Your agent says "as we discussed last week", but there was no such discussion. Diagnose it.

This is memory hallucination (FAQ Q25, lesson 8.6). There are two possible causes:

1. **The model invented it.** No memory in the request supports the claim. Check the logged request. Fix: tell the model to refer only to memories in its input, and check recall phrases against the store before the answer goes out.
2. **The store holds a false memory.** Extraction wrote a fact that the user never stated, or text from a tool result became a memory. Check the source turn ID of the memory. Fix: store a fact without review only when its confidence is high. Extract only from the user's turns, and audit a sample of the store against the logs.

Without logs of the injected memories and their sources, you cannot tell the two causes apart. Log both.

## 14. Check questions

```check
{
  "question": "A team says: \"Our model now has a 1M-token window, so we will put all past conversations of a user into every call.\" Give three reasons against this plan.",
  "answer": "Cost: every call bills all those tokens again, and long histories make calls expensive even with cache reads. Quality: accuracy drops with length and position, and a focused prompt often beats a full one. Control: the store still needs selection, isolation between users, and deletion. The window does not provide them."
}
```

```check
{
  "question": "Name three places, other than the main memories table, that a deletion request must reach, and explain why vectors are among them.",
  "answer": "Any three of: vector index entries, history and archive tables, session caches, logs and traces, derived facts and rules, backups and processors. Vectors must go because embeddings can be inverted: Morris et al. recovered 92% of 32-token inputs exactly from their embeddings."
}
```

```check
{
  "question": "Explain the difference between the KV cache, prompt caching and key-value extraction in one sentence each.",
  "answer": "The KV cache stores attention keys and values of earlier tokens inside one call. Prompt caching keeps that processed prefix across calls so that a repeated prefix is cheaper and faster. Key-value extraction stores facts from a conversation as named fields in the application's own database."
}
```

## 15. Links

- Part overview: [08 Memory](/notes/ai/context-engineering/08-memory)
- [L1: Stateless models, stateful apps](/notes/ai/context-engineering/08-memory/l1-stateless-models-stateful-apps) to [L8: Build a three-layer memory agent](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent)
- [Hard questions: Foundations](/notes/ai/context-engineering/01-foundations/hard-questions)
- [Glossary](/notes/ai/context-engineering/glossary)
