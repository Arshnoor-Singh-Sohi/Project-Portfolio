---
title: "01 Messages API"
order: 11
summary: "The request and response of the Anthropic Messages API: content blocks, roles, tool calls and the format rule."
---

This part covers the shape of one request and one response. Every later subject depends on it.

| Code | Lesson | Core idea | Stage | Status |
|---|---|---|---|---|
| L1 | [Messages and content blocks](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) | A message is a role and a list of typed blocks. | Now | not started |
| L2 | [tool_use and tool_result](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) | Every tool call gets one result, by id, in the next user message. | Now | not started |
| L3 | The API sets the format, not the model | One model can speak two formats. The endpoint decides. | Now | planned |
