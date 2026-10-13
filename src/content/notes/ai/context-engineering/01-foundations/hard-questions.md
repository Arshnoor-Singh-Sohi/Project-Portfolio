---
title: "Hard questions: Foundations"
order: 99
summary: "Tricky, skeptical and interview questions on tokens, the API call, attention cost, long-context effects, conversation cost and prompt caching, with full answers."
status: not-started
tags: [foundations, interview, review]
---

Answer each question aloud first. Then read the answer. The lesson code after each question shows where the idea comes from.

## 1. Windows will soon hold 10 million tokens. Will context engineering stop mattering?

No. A larger window removes one limit, but three problems remain (lessons 1.4 to 1.6):

1. **Cost.** Each call bills every input token. A conversation's total input grows with the square of the number of turns.
2. **Latency.** Prefill must process every input token before the first output token.
3. **Quality.** Accuracy drops with length (Chroma, RULER, NoLiMa) and depends on position (Liu et al.).

So a larger window gives more room for mistakes. The job moves from "make it fit" to "choose the highest-signal tokens".

## 2. If billing is linear, why should I care that attention is quadratic?

Three reasons (lesson 1.4). First, latency: the time to first token grows with the input, and the attention part of prefill grows faster than linearly. Second, capacity: for a self-hosted model, the KV cache of a long input holds GPU memory, so fewer requests fit at the same time. Third, some providers charge a higher rate above a long-context limit. The flat bill hides the physics, but the physics still sets latency and capacity.

## 3. Does OpenAI's `previous_response_id` make long conversations cheaper?

No (lesson 1.3). OpenAI's guide says that "all previous input tokens for responses in the chain are billed as input tokens". The feature moves the storage of the history to the server. The model still reads the whole history on every call. Prompt caching, not server-side state, is what lowers the price of the repeated part.

## 4. What is the difference between the KV cache and prompt caching?

The **KV cache** lives inside one call (lesson 1.4). Prefill fills it, and decode reads it, so the model does not recompute old keys and values for each new output token. **Prompt caching** keeps the KV cache of a prefix after the call ends. A later call with the same prefix can then skip that prefill (lesson 1.7). The first saves work within a call. The second saves work across calls.

## 5. Why can a provider cache a prefix but not the middle of a prompt?

In causal attention, the keys and values of token $i$ depend on tokens $1$ to $i$ only (lessons 1.4 and 1.7). So the processed form of a prefix is the same whenever the prefix is the same. A block in the middle has different keys and values if anything before it changed. So only an exact prefix can be reused.

## 6. Is "lost in the middle" solved in current models?

Not as a general rule (lesson 1.5). Newer models show weaker position effects on some tests. But Chroma (2025) found drops with length across 18 models. NoLiMa (2025) found that 11 of 13 models fell below half of their short-input score at 32K tokens. Measure position and length effects on your own model and task. Do not trust the advertised window.

## 7. A team says: "Our model gets 100% on needle-in-a-haystack at 1M tokens, so we can dump all documents into the prompt." What do you answer?

A plain needle test checks lexical retrieval: the question and the needle share words (lesson 1.5). Real questions need reasoning across documents, with distractors and different wording. Also, 1M tokens on every call costs money and adds latency (lessons 1.4 and 1.6). Ask for an evaluation on real questions at the real input size, against a design that retrieves only the relevant parts.

## 8. Why do output tokens cost about five times as much as input tokens?

Providers do not publish the reason. The mechanism of lesson 1.4 gives a likely explanation. Prefill handles all input tokens in one parallel pass, which uses the GPU well. Decode needs one full pass for each output token, and each pass reads the weights and the KV cache from memory. So one output token takes much more GPU time than one input token.

## 9. Does prompt caching reduce context rot?

No (lesson 1.7). Caching changes how the provider processes and bills the prefix. The model still reads every cached token, so the window is just as full. Only removal, retrieval of less content, compression or isolation reduce the length effect.

## 10. "One token is about four characters." When does this rule break?

It is a rule for plain English on OpenAI-style tokenizers (lesson 1.2). It breaks for code, JSON, long numbers and IDs, and text in non-Latin scripts, which all use more tokens per character. It also differs between model families: Claude 4.7 and later produce about 30% more tokens than earlier Claude models for the same text. For budgets, count with the real tokenizer or the `usage` field.

## 11. An agent's cost per task doubled after a release, but the prompt and the traffic did not change. Where do you look first?

Look at the cache hit rate (lesson 1.7). A small change near the top of the prompt can invalidate every cache. Typical causes are a new timestamp or ID in the system prompt, a reordered tool list, or a changed tool description. Then look at the history size: a tool that returns a larger result makes the quadratic term grow (lesson 1.6).

## 12. Check questions

```check
{
  "question": "Name the three effects that make a model miss a fact that is in its window, and one fix for each.",
  "answer": "Position (lost in the middle): put key facts at the start or end, and long documents before the question. Length (context rot): send fewer tokens with retrieval, compression or isolation. Stale context: remove or replace old and conflicting content."
}
```

```check
{
  "question": "A conversation has S = 3,000, u = 100 and a = 400. What is the cumulative input after 20 calls?",
  "hint": "C_N = N(S + u) + t·N(N − 1)/2, with t = u + a.",
  "answer": "t = 500. C_20 = 20 × 3,100 + 500 × 190 = 62,000 + 95,000 = 157,000 tokens."
}
```

```check
{
  "question": "Why must the system prompt not contain the current date and time in its first line, if the application uses prompt caching?",
  "answer": "Caching needs an exact prefix from the first token. A value that changes on every call makes the prefix differ at the start, so nothing after it can come from the cache."
}
```

## 13. Links

- Part overview: [01 Foundations](/notes/ai/context-engineering/01-foundations)
- [Glossary](/notes/ai/context-engineering/glossary)
