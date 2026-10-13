---
title: "06 Tools and MCP"
order: 16
summary: "The tool-call loop, tool schemas, results and errors, many tools, ReAct, the MCP protocol, an MCP server and tool security."
---

This part follows handbook Session 4. Tool design is context design: every tool result enters the window.

| Code | Lesson | Core idea | Handbook | Status |
|---|---|---|---|---|
| L1 | [Tools are context](/notes/ai/context-engineering/06-tools-and-mcp/l1-tools-are-context) | Every tool result uses the window. | S4 §1 | not started |
| L2 | [The tool-call loop](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop) | The model asks. The app runs the tool. | S4 §2 | not started |
| L3 | [Tool schemas and structured outputs](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs) | JSON Schema, design rules, strict mode. | S4 §3 | not started |
| L4 | [Tool results and errors](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) | Small results. Errors with a suggestion. | S4 FAQ | not started |
| L5 | [Many tools](/notes/ai/context-engineering/06-tools-and-mcp/l5-many-tools) | Tool count scale, just-in-time instructions, tool retrieval. | S4 §4 | not started |
| L6 | [Execution patterns and ReAct](/notes/ai/context-engineering/06-tools-and-mcp/l6-execution-patterns-and-react) | Four patterns. Thought, action, observation. Loop guards. | S4 §7–8 | not started |
| L7 | [MCP: the protocol](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) | Host, client, server, JSON-RPC, transports, primitives. | S4 §5 | not started |
| L8 | [Build an MCP server](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) | The current SDK, the Inspector, client configuration. | S4 §6 | not started |
| L9 | [Tool security and prompt injection](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) | The security boundary and defense in depth. | S4 §6.3 | not started |

Interview practice: [Hard questions](/notes/ai/context-engineering/06-tools-and-mcp/hard-questions).
