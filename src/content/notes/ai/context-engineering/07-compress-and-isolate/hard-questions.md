---
title: "Hard questions: Compress and isolate"
order: 99
summary: "Tricky, skeptical and interview questions on compaction, tool-result clearing, triggers, budgets, multi-agent isolation, contracts and compression metrics, with full answers."
status: not-started
tags: [compress, isolate, interview, review]
---

Answer each question aloud first. Then read the answer. The lesson code after each question shows where the idea comes from.

## 1. Windows hold 1M tokens now. Do I still need compression?

Yes, for three reasons that a larger window does not remove (lessons 7.1 and 7.5):

1. **Cost.** Without compression, the cumulative input of a conversation grows with the square of the turns (lesson 1.6). The handbook's FAQ (Q48) gives an example at GPT-4o's price of USD 2.50 per million input tokens. A call with 128,000 tokens costs 0.32 USD. A call compressed to 20,000 tokens costs 0.05 USD. That is 6.4 times less, on every later call.
2. **Quality.** Accuracy drops with absolute input length, long before the window is full (lesson 1.5). A 1M window lets the history grow into exactly that range.
3. **Latency.** Prefill must process every input token before the first output token.

Prompt caching changes point 1: with caching, old tokens are cheap, and compaction may not recover its own cost (lesson 7.2). Points 2 and 3 remain. So with caching, compression is mainly a quality and latency tool.

## 2. Is multi-agent architecture just added complexity?

Sometimes it is. The answer depends on the task (lesson 7.7).

**For:** Anthropic's multi-agent research system beat single-agent Claude Opus 4 by 90.2% on an internal research evaluation. Sub-agents explore in parallel and return condensed summaries. The handbook's FAQ (Q49) adds that focused prompts beat one prompt that tries to cover four checklists.

**Against:** the same Anthropic post calls multi-agent systems a poor fit when agents must share context or depend on each other, as in most coding. Cognition's two principles explain why: share full context and traces, because actions carry implicit decisions that conflict. Shopify's engineering post says: "Avoid multi-agent architectures early".

**Rule:** isolate reading work with independent parts (search, research, review). Keep coupled writing work in one agent, or write contracts first (lesson 7.9). And remember that multi-agent systems used about 15 times the tokens of chat in Anthropic's measurement, against about 4 times for single agents.

## 3. Will very large windows make compression obsolete?

No (FAQ Q50). Three reasons:

1. **Compute.** Prefill attention compares each token with every earlier token, so its work grows with the square of the length (lesson 1.4). Sparse attention designs such as Longformer and BigBird scale linearly, but they change the model, not the price per token that you pay.
2. **Quality.** The length effect is measured on current long-context models (Chroma, RULER, NoLiMa in lesson 1.5). A larger window does not remove it. The handbook's example, Gemini 1.5 Pro with 2M tokens, is out of date: Google retired that model on 29 September 2025.
3. **Economics.** If 50,000 curated tokens give the same answer as 10 million, the curated call is 200 times cheaper to bill.

The handbook's analogy holds: computers have large disks, and engineers still use caches, paging and memory management.

## 4. The handbook says that compressing 10,000 tokens to 1,000 cuts attention cost by 100 times. Is that right?

Partly (FAQ Q42 and lesson 1.4). With the causal mask, one attention head in one layer scores $n(n+1)/2$ pairs. For 10,000 tokens that is 50,005,000 pairs. For 1,000 tokens it is 500,500. The ratio is about 99.9. So the attention part of prefill is about 100 times smaller.

But the other parts scale differently:

- The feed-forward layers cost the same per token, so they are 10 times smaller.
- During decode, each new token reads 10 times fewer cached keys.
- The bill is per token, so it is 10 times smaller.

So the call is between 10 and 100 times cheaper in compute, and 10 times cheaper on the invoice.

## 5. How do prompt caching and compression interact?

They solve different problems, and they conflict at one point (FAQ Q25, lessons 1.7 and 7.2).

- **Caching** lowers the price and the time to first token of a repeated prefix. It does not change what the model reads.
- **Compression** removes tokens from the window. It changes what the model reads.
- **The conflict:** a summary or a cleared tool result rewrites the history, so the cache after the edit point is invalid. The new part must be written again at 1.25 times the input price.

In the worked example of lesson 7.2, a compaction on Sonnet 5.5 recovers its cost after 1.4 calls without caching. With caching and a Sonnet summarizer, it needs 35 calls. Three practical rules follow:

- Keep a cache breakpoint at the end of the system prompt.
- Compress in batches.
- Use `clear_at_least`, so that each clearing frees enough tokens to justify the rewrite (lesson 7.3).

## 6. When does compression hurt more than it helps?

When it removes information that a later step needs (FAQ Q32). The main cases:

1. **Pending content.** A plan before it runs, a diff before it is applied, an exact number before it is used (lesson 7.1).
2. **A cut summary.** The summary call stopped at `max_tokens`, and the open items at the end are missing (lesson 7.2).
3. **Summary drift.** Each compaction summarizes the last summary, and the summary loses facts one pass at a time (lesson 7.10).
4. **A broken message list.** A cut that separates a tool call from its result makes the next call fail (lesson 7.2).
5. **A lost critical fact.** A compression with 90% retention can still drop the one constraint that matters (lesson 7.10).
6. **A cache rewrite that never recovers its cost,** in a short session with caching (question 5).

## 7. What does a multi-agent code review really cost compared with a single agent?

Use the handbook's Exercise 5B (lesson 7.7). Four agents each read 30,000 tokens of code plus a 500-token prompt and a 1,000-token checklist: 126,000 input tokens. With outputs, the total is about 130,000. A single agent reads about 34,500 tokens and writes about 1,000. The ratio is about 3.7 times.

Take Claude Sonnet 5.5 prices: USD 2 / 10 per MTok (checked on 2026-10-12). FAQ Q27 rounds each agent's input to about 33,000 tokens, so 132,000 in total. With about 4,000 output tokens, the multi-agent review costs about 0.30 USD. The single agent has 35,000 input and about 1,000 output tokens: about 0.08 USD. The handbook (FAQ Q27) used Sonnet 4 at USD 3 and got 0.40 against 0.10 USD. Sonnet 4 was retired on 15 June 2026.

Parallel agents cut the wall-clock time to that of the slowest agent. FAQ Q27 argues that one missed vulnerability costs far more than 0.30 USD. That is true only if the multi-agent review actually finds more. Measure the recall of both designs on reviews with known bugs.

## 8. How do agents share state without breaking isolation?

Share conclusions, not working notes (FAQ Q28, lesson 7.9).

- **Relay through the orchestrator.** The research agent returns a summary. The orchestrator adds it to the code agent's input.
- **A shared store with a schema.** A file or a database whose shape is a contract. Anthropic's research system passes "lightweight references" to files. Claude Code agent teams use a shared task list and messages (lesson 7.8).
- **LangGraph subgraphs.** Call each agent's subgraph inside a node and transform the state in and out. Each agent then keeps a private message history (lesson 7.8).

Never pass raw working context. It holds dead ends, stale results and possibly injected text.

## 9. How do I build isolation without a framework?

With plain Python (FAQ Q29, lesson 7.8):

1. Each sub-agent is an async function: focused input, its own system prompt and context, one or more model calls, a result validated with Pydantic.
2. The orchestrator runs them with `asyncio.gather(..., return_exceptions=True)`.
3. Each call has a timeout. A semaphore limits calls in flight.
4. Failed validations get one retry with the errors in the prompt. A circuit breaker stops calls to an agent that keeps failing (lesson 7.9).
5. Every agent logs its tokens, time and status.

Adopt a framework when you need persistence, human-in-the-loop steps or complex routing. Know what it does by default: a LangGraph node sees the full state, and an OpenAI Agents SDK handoff passes the whole conversation.

## 10. How does Claude Code compress its context?

From the current docs (checked on 2026-10-12, lesson 7.2):

- Auto-compact runs when the conversation reaches the model's context limit: about 967K tokens on 1M models. You can set it from 100K to 1M.
- It clears older tool outputs first, then summarizes the conversation if needed.
- After compaction, it injects the root CLAUDE.md, auto memory and the plan-mode plan again, and reads up to five recently modified files again.
- `/compact <instructions>` tells the summary what to keep.

The handbook says "95%" (FAQ Q24). No current doc or changelog entry says this. The changelog shows a **warning** threshold that moved from 60% to 80%. The handbook's claim that Claude Code keeps its plan "via CLAUDE.md files" is also wrong: CLAUDE.md holds instructions that you write.

## 11. Which compression technique should run first?

The safest one (FAQ Q12, lesson 7.5): clear used tool results, then summarize old turns, then trim P3 content, then compress P2. Claude Code uses the same order: tool outputs first, then a summary. Run all steps in one pass, so that the cache breaks once.

On the Anthropic API, the docs now call server-side compaction "the primary strategy" for long-running conversations, with context editing as the finer-grained option. That does not change the order of safety. It changes who runs the summary.

## 12. Can a cheaper model do the compression?

Usually yes, but test it (FAQ Q19, lesson 7.5). Take a summary call with 8,000 input and 500 output tokens. It costs 0.00105 USD on Claude Haiku 5.5 and 0.021 USD on Sonnet 5.5, a factor of 20 (checked on 2026-10-12). For Sonnet 4.6 and Haiku 4.5, the factor is only 3. The handbook's Haiku price of USD 0.25 / 1.25 belongs to Claude 3 Haiku, retired on 20 April 2026.

Two cautions. Haiku 5.5 charges USD 0.50 / 2.50 for prompts above 100K tokens, so compact before the history passes that size. And a cheap summarizer can drop facts that a stronger one keeps. Run the retention harness of lesson 7.10 on both before you switch.

## 13. The handbook says Shopify uses a "PRP (Prompt, RAG, Plan)" workflow with domain sub-agents. Is that right?

No (FAQ Q26). Shopify's engineering post on its Sidekick agent (Andrew McNamara, 26 August 2025) covers the tool-count problem, just-in-time instructions, LLM judges, user simulation and GRPO training. It does not mention "PRP" or "Prompt, RAG, Plan". It does not describe domain sub-agents or a 10K-token orchestrator. One of its principles says the opposite: "Avoid multi-agent architectures early".

"PRP" in context-engineering templates means "Product Requirements Prompts". Rasmus Widing introduced the idea, and Cole Medin's template made it popular (lesson [9.3](/notes/ai/context-engineering/09-production/l3-the-prp-workflow)).

## 14. Check questions

```check
{
  "question": "A team uses prompt caching on Sonnet 5.5 and adds compaction to save money in 15-turn sessions. Their bill increases. Explain why, with the payback idea of lesson 7.2.",
  "hint": "With caching, how much does one old token cost on each later call? What does a summary do to the cache?",
  "answer": "With caching, old tokens cost only 0.05 times the input price on each later call, so removing them saves little per call. The summary call costs money, and the summary rewrites the history, so the summary and the keep window must be written to the cache again at 1.25 times. In the worked example, payback needs about 35 later calls with a Sonnet summarizer, far more than a 15-turn session has. Compaction there is a quality tool, not a cost tool."
}
```

```check
{
  "question": "Name the two principles from Cognition's \"Don't Build Multi-Agents\", and the kind of task where Anthropic says multi-agent systems are a poor fit.",
  "answer": "1. Share context, and share full agent traces, not just individual messages. 2. Actions carry implicit decisions, and conflicting decisions carry bad results. Anthropic says multi-agent systems are a poor fit for domains where all agents must share the same context or that involve many dependencies between agents, such as most coding."
}
```

```check
{
  "question": "A trimmer reports 92% IRR after compression, yet the agent now breaks a budget limit that the user set in turn 3. Give two reasons why IRR missed this, and two changes to the measurement.",
  "answer": "Reasons: IRR counts all facts the same, so losing one critical constraint barely moves the number. And the checklist may not include the budget, or it was written after reading the summary. Changes: weight the facts and report critical-fact retention separately, with a 100% target for constraints. Write the checklist from the original before compression, and quiz the model with only the compressed context."
}
```

## 15. Links

- Part overview: [07 Compress and isolate](/notes/ai/context-engineering/07-compress-and-isolate)
- [L1: Why compress](/notes/ai/context-engineering/07-compress-and-isolate/l1-why-compress)
- [L7: ISOLATE: one window is not enough](/notes/ai/context-engineering/07-compress-and-isolate/l7-isolate-one-window-is-not-enough)
- [Glossary](/notes/ai/context-engineering/glossary)
