---
title: "03 Context management"
order: 13
summary: "Tools that make the model input smaller, and which of them change the saved state."
---

This part applies the transient and persistent distinction to LangChain's tools.

| Code | Lesson | Core idea | Stage | Status |
|---|---|---|---|---|
| L1 | [SummarizationMiddleware](/notes/ai/langchain-langgraph/03-context-management/l1-summarization-middleware) | Persistent. It replaces old messages with a summary in the state. | E | not started |
| L2 | [ContextEditingMiddleware](/notes/ai/langchain-langgraph/03-context-management/l2-context-editing-middleware) | Transient. It clears old tool outputs in the model input only. | E | not started |
| L3 | [trim_messages and RemoveMessage](/notes/ai/langchain-langgraph/03-context-management/l3-trim-and-remove-messages) | Cut by tokens with no model call. Delete from the state by id. | E | not started |
