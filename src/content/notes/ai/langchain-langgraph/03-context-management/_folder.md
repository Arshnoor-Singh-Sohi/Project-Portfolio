---
title: "03 Context management"
order: 13
summary: "Tools that make the model input smaller, and which of them change the saved state."
---

This part applies the transient and persistent distinction to LangChain's tools.

| Code | Lesson | Core idea | Stage | Status |
|---|---|---|---|---|
| L1 | SummarizationMiddleware | Persistent. It replaces old messages with a summary in the state. | E | planned |
| L2 | ContextEditingMiddleware | Transient. It clears old tool outputs in the model input only. | E | planned |
| L3 | trim_messages and RemoveMessage | Cut by tokens with no model call. Delete from the state by id. | E | planned |
