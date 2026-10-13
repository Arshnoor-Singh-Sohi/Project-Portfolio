---
title: "07 Compress and isolate"
order: 17
summary: "Compaction, tool-result clearing, trimming, triggers, budgets, sub-agents, isolation patterns, contracts and compression metrics."
---

This part follows handbook Session 5. It covers what to do when the window fills up.

| Code | Lesson | Core idea | Handbook | Status |
|---|---|---|---|---|
| L1 | [Why compress](/notes/ai/context-engineering/07-compress-and-isolate/l1-why-compress) | Cost and quality. Compression vs deletion. | S5 §1–2 | not started |
| L2 | [Summarization and compaction](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction) | A rolling summary with a token trigger. | S5 §3.1 | not started |
| L3 | [Tool-result clearing](/notes/ai/context-engineering/07-compress-and-isolate/l3-tool-result-clearing) | Clear old results and keep the IDs. | S5 §3.2 | not started |
| L4 | [Priority trimming and hierarchical compression](/notes/ai/context-engineering/07-compress-and-isolate/l4-priority-trimming-and-hierarchical-compression) | P0–P3 and graded detail. | S5 §3.3–4.1 | not started |
| L5 | [When to compress](/notes/ai/context-engineering/07-compress-and-isolate/l5-when-to-compress) | Triggers at 80%, not 95%. | S5 §4 | not started |
| L6 | [Token budgets](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets) | 40-40-20, the pyramid, dynamic budgets. | S5 §7 | not started |
| L7 | [ISOLATE: one window is not enough](/notes/ai/context-engineering/07-compress-and-isolate/l7-isolate-one-window-is-not-enough) | Orchestrator and sub-agents. Evidence for and against. | S5 §5 | not started |
| L8 | [Isolation patterns](/notes/ai/context-engineering/07-compress-and-isolate/l8-isolation-patterns) | Sub-agent, sandbox, state schema, agent teams. | S5 §5.3 | not started |
| L9 | [Contract-first design](/notes/ai/context-engineering/07-compress-and-isolate/l9-contract-first-design) | Contracts before agents. | S5 §6 | not started |
| L10 | [Measure compression](/notes/ai/context-engineering/07-compress-and-isolate/l10-measure-compression) | TCR, IRR, RQPT and how they can be gamed. | S5 §8 | not started |

Interview practice: [Hard questions](/notes/ai/context-engineering/07-compress-and-isolate/hard-questions).
