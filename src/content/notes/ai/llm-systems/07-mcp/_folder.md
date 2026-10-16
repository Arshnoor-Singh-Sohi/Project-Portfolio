---
title: "07 MCP"
order: 17
summary: "Why MCP, JSON-RPC, the stateful 2025-11-25 and the stateless 2026-07-28 protocol, transports, tools, JSON Schema, resources and prompts, MRTR, utilities, authorization, version history and a working server."
---

This part answers three interview questions down to single JSON fields. What is MCP? What is new? What is the difference between stateful and stateless? It teaches both revisions: 2025-11-25, stateful with `initialize` and sessions, and 2026-07-28, stateless. Lessons L6 and L7 cover the tool arguments and their JSON Schema. Drill [08 L4](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp) rehearses it.

| Code | Lesson | Core idea | Priority | Status |
|---|---|---|---|---|
| L1 | [Why MCP exists](/notes/ai/llm-systems/07-mcp/l1-why-mcp) | One protocol between hosts and servers turns $N \times M$ integrations into $N + M$. | Core | not started |
| L2 | [JSON-RPC 2.0 from zero](/notes/ai/llm-systems/07-mcp/l2-json-rpc) | Every MCP message is a JSON-RPC request, result, error or notification. | Support | not started |
| L3 | [The stateful protocol (2025-11-25)](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol) | In 2025-11-25, an `initialize` handshake fixes the version and the capabilities for the whole session. | Core | not started |
| L4 | [Transports: stdio and Streamable HTTP](/notes/ai/llm-systems/07-mcp/l4-transports) | stdio and Streamable HTTP carry the messages. 2026-07-28 removed sessions, the GET stream and resumability. | Support | not started |
| L5 | [Stateful vs stateless MCP](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) | In 2026-07-28 every request carries its version and capabilities, so any replica can serve it. | Core | not started |
| L6 | [Tools in depth](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) | Every field of a tool, of `tools/list` and `tools/call`, and of the result, in both revisions. | Core | not started |
| L7 | [JSON Schema for tool arguments](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) | The `inputSchema` is a JSON Schema 2020-12 contract, and each keyword has an exact meaning. | Core | not started |
| L8 | [Resources and prompts](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts) | Resources are data that the application attaches. Prompts are templates that the user chooses. | Support | not started |
| L9 | [Asking the client for input: MRTR, elicitation, sampling and roots](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots) | In 2026-07-28 a server asks for input by returning `input_required`, and the client retries with the answers. | Core | not started |
| L10 | [Utilities: progress, cancellation, pagination, errors](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors) | `_meta`, progress, cancellation, pagination and the error codes that every request shares. | Support | not started |
| L11 | [Authorization and security](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) | A remote server is an OAuth 2.1 resource server: discovery from a 401, PKCE, and tokens for one audience. | Core | not started |
| L12 | [What is new: the version history](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) | Five revisions from 2024-11-05 to 2026-07-28, and the reasons for the stateless core. | Core | not started |
| L13 | [Build an MCP server and client](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) | A typed Python function becomes a tool with a generated schema, served over stdio and HTTP. | Core | not started |
