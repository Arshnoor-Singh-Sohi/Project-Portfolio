---
title: "01 Foundations"
order: 11
summary: "How a model reads its context: tokens, the API call, attention cost, position and length effects, conversation cost, prompt caching."
---

The handbook assumes these ideas. Every later part depends on them. The diagnostic decides which lessons need a full session.

| Code | Lesson | Core idea | Handbook | Status |
|---|---|---|---|---|
| L1 | [What a model does with context](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) | The model predicts the next token from the window only. Input and output share the window. | S1 Q6 | not started |
| L2 | [Tokens and tokenizers](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers) | BPE in short. Characters per token for prose, code and other scripts. Image tokens. | S1 §3.1, Q12 | not started |
| L3 | [The chat API call](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) | Each call is stateless. The app sends the full messages array again. | S1 Q16, Q24 · S6 §1 | not started |
| L4 | [Attention, the KV cache and the cost of length](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) | n² pairs in prefill. Linear work for each output token. | S1 Q11 · S5 Q42 | not started |
| L5 | [Position and length effects](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) | Lost in the middle, context rot, stale context: three causes, three fixes. | S1 §3.2 | not started |
| L6 | [The cost of a conversation](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation) | Cost per call is linear in the turn number. Total cost is quadratic. | S5 §2.1 | not started |
| L7 | [Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) | Prefix match, write premium, read discount. Static content first. | S1 Q31 · S5 Q25 · S7 Q15 | not started |

Interview practice: [Hard questions](/notes/ai/context-engineering/01-foundations/hard-questions).
