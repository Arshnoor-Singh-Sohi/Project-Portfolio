---
title: "Glossary"
order: 2
summary: "Every term in Conversation State and Chat History, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| chat | One conversation, with an owner. One row in `chats`. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| checkpoint | A saved snapshot of a LangGraph agent's state, keyed by a thread id. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| derived copy | A copy built from another copy. It can be rebuilt. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| destructive | It removes information that cannot be rebuilt from the same copy. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| display part | A piece of an answer that the user saw: text, a chart, a table, a tool status line. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| drift | The copies become different from each other over time. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| harness | The code that runs the agent loop: the Claude Agent SDK with its CLI, or a LangChain agent. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| harness state | The copy of the conversation that the harness keeps for the model: a session file, or a checkpoint. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| idempotency key | An id that the client makes before the first attempt, so that a retry does not write twice. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| life-cycle context | What happens between model and tool calls: summarization, guardrails, logging. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| message | One user message or one assistant answer, as the user saw it. One row in `messages`. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| model context | Everything that goes into one model call: instructions, messages, tools, model choice, response format. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| model input | The full request body of one model call: system prompt, tools and messages. It exists for one call. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| model message | A message in a provider format for a model call, with content blocks. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| part | One typed item inside a message: text, reasoning, a tool step, a chart, a file. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| part type | The `type` field of a part. It decides the other fields. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| persistent change | A change to the saved state. It affects every later call. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| reducer | The function that merges an update into a state field. For messages, `add_messages`. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| runtime context | Fixed configuration for one run, for example the user id or a database connection. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| saved state | The state that the harness keeps between calls and turns: LangGraph state, or the Claude SDK session file. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| `seq` | The number of a message inside its chat: 1, 2, 3, and so on. It defines the order. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| source of truth | The copy that wins when two copies disagree. All other copies are built from it. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| store | Long-term memory that lives across conversations. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| tool context | What tools can read and write: state, store, runtime context. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| tool part | One part that holds a tool call and its result (or its error) together. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| tool part state | The stage of a tool part: `input-available` (called, no result yet), `output-available` (result), `output-error` (failed). | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| transient change | A change to the model input of one call. The saved state stays the same. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| turn | One user message and the assistant answer to it: two rows. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| UI message | A message in the format for display, with parts. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| user transcript | The messages that the user typed and the answers that the user saw, stored by the application. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
