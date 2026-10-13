---
title: "Hard questions: Paradigm shift"
order: 99
summary: "Tricky, skeptical and interview questions on what context engineering is, where the term came from, the LLM OS model, the six elements, the quality curve, wrong context and the context audit, with full answers."
status: not-started
tags: [paradigm-shift, interview, review]
---

Answer each question aloud first. Then read the answer. The lesson code in each answer shows where the idea is taught.

## 1. Is context engineering just good prompt engineering with a fancier name?

The worry is fair: many AI terms are rebrands. The test is whether the work changes (lesson 2.1).

- **Prompt engineering** decides the words of an instruction, mostly once, at design time.
- **Context engineering** decides which facts, tools, history and state enter each call, at run time, in code.

The two produce different artifacts. Prompt engineering produces a template. Context engineering produces retrieval pipelines, tool schemas, history policies, memory stores, token budgets and evaluations. The handbook's analogy (FAQ Q49) is good: writing SQL queries against designing a database architecture. Prompt craft still matters, but as one skill inside the larger job. The history supports the distinction: practitioners who built agents needed a word for it. Walden Yan called it "effectively the #1 job of engineers building AI agents" (12 June 2025).

## 2. Will smarter models make context engineering obsolete?

No, for the information problem. A model can use only its weights and its window (lesson 1.1). Your customer's order, today's policy and last week's incident are in neither, unless your code puts them in the window. A smarter model does not change that.

Some of the **wording** work may shrink. Anthropic writes that "the exact formatting of prompts is likely becoming less important as models become more capable". At the same time, more capable models run longer tasks with more steps. Each step needs a new context decision, so the total amount of context engineering grows.

One warning for interviews. The handbook says that "Karpathy and others have explicitly argued" that the importance of context engineering is rising (FAQ Q44). It gives no source. Do not repeat it as a fact.

## 3. Windows now hold a million tokens or more. Why not send everything?

Three costs remain (lessons 1.4 to 1.6, 2.4):

1. **Money.** Every input token is billed on every call. On Claude Sonnet 5.5 (USD 2 / MTok input, checked on 2026-10-12), a 1,000,000-token input costs 2 USD per call. At 100,000 calls a day, that is 200,000 USD a day.
2. **Latency.** Prefill must process every input token before the first output token.
3. **Quality.** Accuracy drops with length and depends on position. Liu et al. measured 20 documents scoring below no documents when the answer sat in the middle.

Correct the handbook if an interviewer quotes it (FAQ Q50). Its "USD 6–20 per 2M-token call" contradicts its own price table. 2M tokens at the table's USD 1.25 / MTok cost USD 2.50. Even double that rate gives USD 5. Gemini 1.5 Pro was retired on 29 September 2025. Google reports about 99% recall on single-needle tests, and the drops appear on harder multi-needle tasks. The "30–60 seconds" has no source.

## 4. Are context engineering, fine-tuning and RAG competing approaches?

No. They work on different layers (handbook FAQ Q34 and Q45).

| Approach | What it changes | Best for |
|---|---|---|
| Pre-training | The weights, once | General knowledge and language |
| Fine-tuning | The weights, for your domain | Stable behavior on every request: format, tone, domain style |
| Context engineering | The window, on each call | Request-specific and changing facts: user data, current documents, recent events |
| RAG | One technique inside context engineering | Element 4, retrieved knowledge |

A fine-tuned model still needs the user's question, the relevant documents and the tool definitions in its window. The handbook's advice is sound: exhaust context engineering before you fine-tune, because it is faster to change and needs no training data. One trade-off is real: fine-tuning can move stable instructions into the weights and so shorten every prompt. Measure both options on the same evaluation set. Part 4 covers RAG ([04 Write and RAG](/notes/ai/context-engineering/04-write-and-rag)).

## 5. Is MCP the same as context engineering?

No (handbook FAQ Q41). MCP is a protocol. It standardizes how an application discovers and calls tools and reads resources from servers. It launched on 25 November 2024. It serves element 5 and part of element 4.

MCP does not decide which tools this step needs, or how large a tool result may be. It does not decide what to keep in the history or what to store in memory. It can even make context worse: each connected server adds tool definitions, and they are input tokens on every call. Anthropic names bloated tool sets as one of the most common failures and recommends "a minimal viable set of tools". Part 6 covers MCP ([06 Tools and MCP](/notes/ai/context-engineering/06-tools-and-mcp)).

## 6. Agents or context engineering: which is the prerequisite?

Context engineering (handbook FAQ Q23). An agent is a loop: observe, let the model decide, run a tool, update the state, repeat. Before each model call, the application assembles a new window. So an agent makes hundreds of context decisions per task.

Agent failures are mostly context failures: a tool call to a tool that does not exist, forgetting what was already done, or a loop. Lesson 2.2 shows the "memory leak" with numbers. The agent has a 6,000-token prefix and adds 3,200 tokens per step. At call 62 its input no longer fits into a 200,000-token window.

## 7. Does context engineering apply to open-source models?

Yes (handbook FAQ Q22). The mechanism is the same: tokens in a window. Some practical work moves to you when you host the model yourself:

- The chat template and its special tokens (lesson 1.2) must match the model.
- Tool-calling formats differ between model families.
- Some models have smaller windows.
- The KV cache memory of long inputs is your cost (lesson 1.4).

One difference helps: with open weights, you can read the attention weights, which closed APIs never return. Behavioral tests still answer the engineering question more directly (lesson 2.4). The handbook says context engineering is "arguably more important with smaller open-source models". Treat that as a **rule of thumb** and measure it.

## 8. How do you explain context engineering to a non-technical manager?

Use the handbook's consultant analogy (FAQ Q21). You hire a brilliant consultant. You can give a one-line brief, or a full onboarding package: documents, the org chart, past projects, database access and a clear definition of success. The consultant's intelligence is the same. The result is not.

Then add one concrete case. The TechStore bot lost a USD 2,400 customer because it had no policy document and no tools. The model was not the problem (lesson 2.6).

Avoid one line from the handbook. It says that Shopify's CEO "told his entire company that context engineering is the most important skill". His company memo (7 April 2025) is about using AI reflexively. His June 2025 post calls context engineering "the core skill". The handbook merges the two.

## 9. "Three leaders independently coined context engineering in June 2025." True?

No (lesson 2.1).

- Dex Horthy's "12-factor agents" had "Own your context window" in April 2025.
- Walden Yan wrote "At the core of reliability is Context Engineering" on 12 June 2025.
- Tobi Lütke posted on 19 June.
- Harrison Chase's post of 23 June says that his definition "builds upon" Lütke, Ankur Goyal and Yan.
- Karpathy's post of 25 June opens with "+1 for “context engineering” over “prompt engineering”."

It was a term that spread fast through linked posts, not convergent evolution. It also means that Karpathy did not coin it.

## 10. Is the six-row LLM OS table Karpathy's? Where does the analogy cause security bugs?

Only half of it (lesson 2.2). Karpathy calls the LLM the kernel process (September and November 2023) or the processor (his November 2023 spec sheet). The context window is RAM, and an embeddings store is the file system. The handbook adds three rows: system calls = MCP (MCP came a year later), applications = agents, and kernel = system prompt, which conflicts with Karpathy's own mapping.

The dangerous gap is memory protection. An operating system keeps program data from becoming kernel code. In the window, every token is part of one sequence, and the model can follow any text as an instruction. The priority of the system prompt is trained, not enforced. So a retrieved web page or a tool result can carry a prompt injection (Part 6).

## 11. The handbook says there are "exactly six" elements. Can you break the taxonomy?

Partly (lesson 2.3). Several things need a decision:

- Few-shot examples: file them under system instructions.
- The model's earlier replies and thinking blocks: conversation history.
- An image: user input if the user sent it, retrieved knowledge if the application fetched it.
- The output reserve: not an element, but it shares the window.

Element 5 also hides two different things: static tool definitions and dynamic tool results. So treat the six elements as a taxonomy for audits and budgets, a **rule of thumb**. The useful rule is that every token must belong to exactly one element. Otherwise you cannot budget or audit it.

## 12. "Context quality follows a power law, and the sweet spot is around 50K tokens." How do you respond?

Two corrections (lesson 2.4). First, a power law $y = a x^k$ only rises or only falls for $x > 0$. The handbook's curve peaks and falls, so it is an inverted U. Second, the handbook's axis numbers are illustrative. It gives no measurement.

The position of the peak depends on how fast useful facts saturate and how much each extra token harms. Both depend on the task, the content and the model. So find the peak by measurement: start from a minimum viable context and add items, or start full and ablate one element at a time. Use enough distinct questions. With 50 questions at 80% accuracy, the 95% interval is about ±11 points.

## 13. Your retrieval finds exactly the right document, and the bot still writes confident, wrong code. What do you check?

The document itself (lesson 2.5). Retrieval quality and content quality are different things. The handbook's own demo shows it: its retrieved "API reference" says that `check_deliverability` defaults to False and that the function returns `EmailInfo`. In email-validator 2.3.0 the default is True, and the result is a `ValidatedEmail`. A model that follows this context writes `from email_validator import EmailInfo`, which raises `ImportError`.

The model cannot reliably catch such errors: when the window and the weights disagree, you cannot predict which one wins. So every document needs provenance (source, version, date checked), and API references should be generated from the installed code, not written by hand.

## 14. Check questions

```check
{
  "question": "A team sends a 1,000,000-token context on every call, 50,000 calls a day, on Claude Sonnet 5.5 (USD 2 / MTok input). What is the daily input cost? Name two other costs that the bill does not show.",
  "hint": "Tokens per day = tokens per call × calls. Divide by one million, then multiply by the price.",
  "answer": "1,000,000 × 50,000 = 50 billion tokens = 50,000 MTok. 50,000 × 2 = 100,000 USD a day. The bill does not show the latency of prefilling a million tokens before the first output token, or the quality loss from length and position effects."
}
```

```check
{
  "question": "Which of the six elements does each technique serve: RAG, MCP, conversation summarization, a long-term memory store, few-shot examples?",
  "answer": "RAG: element 4, retrieved knowledge. MCP: element 5, tool definitions and results, and partly element 4 through resources. Conversation summarization: element 3, history. A long-term memory store: element 6, state and memory. Few-shot examples: element 1, system instructions."
}
```

```check
{
  "question": "Quote Gartner's prediction of 26 August 2025 correctly, and say which part of the handbook's version is not Gartner's.",
  "answer": "\"Forty percent of enterprise applications will be integrated with task-specific AI agents by the end of 2026\", up from less than 5% in 2025. The handbook's Key Takeaway 5 drops \"task-specific\", and its sentence \"The bottleneck is not model capability. It is context engineering\" is its own opinion, not Gartner's."
}
```

## 15. Links

- Part overview: [02 Paradigm shift](/notes/ai/context-engineering/02-paradigm-shift)
- Previous part's questions: [Hard questions: Foundations](/notes/ai/context-engineering/01-foundations/hard-questions)
- [Glossary](/notes/ai/context-engineering/glossary)
