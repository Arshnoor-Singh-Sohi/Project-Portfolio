---
title: "Hard questions: Tools and MCP"
order: 99
summary: "Tricky, skeptical and interview questions on tool use, schemas, many tools, agents, MCP and tool security, with full answers."
status: not-started
tags: [tools, mcp, interview, review]
---

Answer each question aloud first. Then read the answer. The lesson code after each question shows where the idea comes from.

## 1. I have one application with three tools. Is MCP worth it?

Usually not (lesson 6.7, handbook FAQ Q34). With one application, plain function calling is simpler: write three functions, write their schemas, and run the loop of lesson 6.2. MCP adds a separate process, a protocol version to track and one more place for bugs.

MCP pays when one of three things is true:

1. **Reuse.** Several applications need the same tools. The FAQ (Q48) example: five applications that need your CRM integration.
2. **Team boundaries.** One team owns the tools and other teams use them. The protocol is the contract.
3. **The ecosystem.** Existing servers save you integration work.

A cheap middle path: keep the tool logic in plain functions with tests, as in lesson 6.8. Wrapping them in an `MCPServer` later is then a small step.

## 2. What does MCP add that plain Python functions do not?

Beyond reuse (question 1), MCP adds four technical things (lesson 6.7):

1. **Discovery.** A host lists tools at run time with `tools/list`. A server can announce changes with `notifications/tools/list_changed`, on a `subscriptions/listen` stream that the client opens.
2. **Process isolation.** A stdio server runs as its own process and reads its credentials from its environment. The model never sees them, and the host only passes them at launch.
3. **Standard transports and authorization.** stdio for local servers, Streamable HTTP with an OAuth 2.1-based framework for remote ones.
4. **More than tools.** Resources that the application attaches, and prompts that the user picks.

The costs are real too: an extra process, protocol revisions (2026-07-28 removed the handshake), and network latency for remote servers.

## 3. Why not let the model write code and run it, instead of calling tools?

The handbook (FAQ Q5) compares tool use to a vending machine and code generation to a blank check. With tools, the model can only call functions that you listed, with arguments that you validate. With generated code, the model can do anything that the run time allows. So tool use gives a clear security boundary, predictable behavior and validation (lesson 6.2).

The picture is not that simple today. Anthropic's programmatic tool calling lets the model call tools from code inside a sandboxed code-execution tool. Intermediate results then stay out of the window, and Anthropic reports a 37% drop in average token use on complex research tasks (lesson 6.6). The tools are still the unit of permission: the code can only call tools that opt in. So the real choice is not "tools or code". It is "which actions does the sandbox allow, and who checks them".

## 4. When should I not use tools?

The FAQ (Q16) lists three cases (lesson 6.1). The answer is already in the weights or the window. The task is a simple transformation, such as format, translate or summarize. Or the task is a one-off calculation that reasoning can handle. Each tool call costs at least one more model call, more input tokens and more latency.

But the lecture's own example, 7,823 × 4,519, shows the limit of the third case. A model can reason to 35,352,137, but not with certainty. So the rule is: use a tool when exactness, live data, private data or a side effect matters. Skip it when a rough answer is enough. A fourth reason to skip a tool: every tool that reads external content adds an injection surface (lesson 6.9).

## 5. One flexible tool or many specific tools?

The FAQ (Q23) says: start with specific tools, and add one guarded, read-only flexible tool for edge cases. A flexible `query_database(sql)` gives the model the most power and the most risk. Specific tools such as `get_customer_by_id` validate their inputs and are easier to choose.

Two warnings. First, the FAQ's claim that "Shopify's research suggests that 10–15 well-designed specific tools outperform one or two flexible tools" is not in the Shopify post (lesson 6.5). Second, "specific" should mean specific to a **task**, not to an API endpoint. Anthropic's guide "Writing effective tools for agents" warns against wrapping each endpoint, and suggests task-level tools such as `schedule_event`. Note also that the handbook's own exercise uses a raw `query_papers(sql)` tool. Lesson 6.8 keeps it to teach the read-only guard, and adds a specific `search_papers` tool next to it.

## 6. When does a tool-using LLM become an agent?

When the model controls the flow (lesson 6.6, FAQ Q26). If the code fixes the steps (classify, then call tool A, then answer), it is a pipeline with tools. If the model decides which tools to call, in what order and when to stop, it is an agent.

Anthropic's "Building effective agents" uses the same line. Workflows use "predefined code paths". Agents "dynamically direct their own processes and tool usage". Its advice is to find "the simplest solution possible". Autonomy is a spectrum, and errors compound. With 95% success per step and independent failures, a 10-step task succeeds only about 60% of the time.

## 7. Can't the model just work out which tool to use, without careful schemas?

Without a definition, the tool does not exist for the model. It can only call what it sees in the window (lessons 6.1 and 6.3). With a vague definition, the model guesses.

The FAQ (Q49) says that well-designed schemas give "85–95% tool selection accuracy" and vague ones "40–60%". These numbers have no source. Use them as an illustration, not as evidence. There is sourced evidence that what the model sees about tools changes accuracy a lot. Anthropic reports that tool search raised accuracy from 49% to 74% for Opus 4 and from 79.5% to 88.1% for Opus 4.5. It also reports that tool use examples raised accuracy from 72% to 90% on complex parameters. Measure your own selection accuracy on a labeled set.

## 8. Can I use MCP with OpenAI or Google models?

Yes (lesson 6.7, FAQ Q38). MCP connects the **application** to the servers, not the model. The host reads the MCP tool definitions and converts them into its model's format (lesson 6.3). That is `input_schema` for Anthropic, `parameters` for OpenAI (in strict form when needed) and `functionDeclarations` for Gemini.

The providers also support MCP directly. OpenAI adopted MCP in its Agents SDK on 2025-03-26 and added remote MCP servers to the Responses API on 2025-05-21. Its Apps SDK (2025-10-06) builds on MCP. Google announced its intent on 2025-04-09, and the Gemini SDKs now have built-in MCP support, which the docs call experimental and tools-only.

## 9. My company has strict data-governance rules. How can an agent use internal data safely?

Treat the MCP server as the enforcement point (FAQ Q50, lesson 6.9):

1. **Least privilege.** Each server has a read-only role with access to only the tables or folders that it needs.
2. **Masking in the server.** Redact personal data before the result leaves the server. The model, the logs and any attacker then see only the masked data.
3. **DLP on results.** Scan results for card numbers, national ID numbers and keys.
4. **Small results.** Aggregate and filter on the server (lesson 6.4). Data that never enters the window cannot leak from it.
5. **No trifecta.** An agent that reads internal data must not also read untrusted content and send messages out without a gate.
6. **On-premises models** for the most sensitive data.

## 10. If I use strict mode, can I delete my validation and retry code?

No (lesson 6.3). The FAQ (Q41) says that strict mode "removes the need for retry logic around JSON parsing failures entirely". Strict mode guarantees the shape of the arguments. It does not guarantee that a date exists, that a number is in range, or that the model chose the right tool. An output can still be cut at `max_tokens`, and a refusal is not a tool call. Anthropic's strict mode also does not support numeric or string-length constraints, so your code must check them. Keep validation, return actionable errors, and cap the retries.

## 11. Does MCP make my tools secure?

No (lessons 6.7 and 6.9). The handbook (§5.5) lists "built-in permission boundaries" as a reason why MCP won. The spec says the opposite: MCP "cannot enforce these security principles at the protocol level". Hosts must obtain explicit user consent before they invoke a tool. Tool annotations such as `readOnlyHint` are hints, untrusted unless the server is trusted. Servers must validate inputs, must not accept tokens issued for other services, and should use the smallest scopes. Security lives in your host and your server.

## 12. Just-in-time instructions put instructions inside tool results. Isn't that prompt injection by design?

It uses the same mechanism (lessons 6.5 and 6.9). The model follows instructions in tool results, and that is why JIT instructions work. It is also why indirect injection works. The difference is trust. JIT instructions come from your own tools, in a fixed field, written by your team. Injected text comes from content that an outsider controls.

So two rules follow. Accept instructions only from your own trusted tools. And design as if the model may obey instructions in **any** tool result: limit permissions, gate side effects and avoid the lethal trifecta. You cannot reliably filter out every instruction-like text, so do not depend on a filter.

## 13. My model has a 1M-token window. Why not send all 200 tools on every call?

Four reasons (lesson 6.5):

1. **Tokens.** With Anthropic's measured average of about 948 tokens per tool, 200 tools are about $200 \times 948 = 189{,}600$ tokens on every call.
2. **Cost and latency.** Those tokens are billed and processed on every call. Caching lowers the price, but not the processing of a cache miss or the window use.
3. **Selection.** Anthropic's docs say that tool choice "degrades once you exceed 30–50 available tools". OpenAI suggests fewer than 20 functions at the start of a turn. Shopify's post describes unclear boundaries from 20 tools on.
4. **Length effects.** More text in the window lowers accuracy (lesson 1.5).

Use routing, tool retrieval or a tool search tool with deferred loading. Then the model sees a few relevant tools and can search for more.

## 14. Check questions

```check
{
  "question": "An agent loads 120 tools with an average definition of 500 tokens. Tool search with deferred loading leaves 6 tools of the same size in the context, plus a 400-token search tool. How many definition tokens does each call save?",
  "hint": "Compare n × d before and after.",
  "answer": "Before: 120 × 500 = 60,000 tokens. After: 6 × 500 + 400 = 3,400 tokens. Savings: 56,600 tokens on each call."
}
```

```check
{
  "question": "A team says: \"We use MCP, so our tools are secure, and strict mode means we need no validation.\" Correct both claims.",
  "answer": "MCP cannot enforce security at the protocol level. The host must get consent, and servers must validate inputs and use least privilege. Strict mode only guarantees the shape of the arguments. Wrong values, wrong tools, cut outputs and refusals still happen, so validation and actionable errors stay."
}
```

```check
{
  "question": "Your company has one internal chatbot with four tools. A second team now wants the same four tools in their IDE assistant, and a third team plans a support agent. What do you recommend, and why?",
  "answer": "Move the tools into one MCP server, owned by the team that owns the data. Three hosts now need the same tools, so N + M beats N × M, and the server becomes the contract and the enforcement point for permissions and masking. Keep the logic in plain, tested functions inside the server."
}
```

## 15. Links

- Part overview: [06 Tools and MCP](/notes/ai/context-engineering/06-tools-and-mcp)
- [L9: Tool security and prompt injection](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection)
- [Sources and corrections](/notes/ai/context-engineering/sources-and-corrections)
- [Glossary](/notes/ai/context-engineering/glossary)
