---
title: "Glossary"
order: 2
summary: "Every term in Conversation State and Chat History, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| authorization | The decision whether a known caller may do a requested action. | [3.1](/notes/ai/conversation-state/03-lifecycle/l1-ownership-checks) |
| autovacuum | A PostgreSQL background process that runs `VACUUM` and `ANALYZE` when tables change enough. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| backfill | A job that copies existing old data into the target store. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| batch | A small group of rows deleted in one short transaction. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| BOLA | Broken object level authorization: an endpoint takes an object id and does not check that the caller may use that object. | [3.1](/notes/ai/conversation-state/03-lifecycle/l1-ownership-checks) |
| cascade | `ON DELETE CASCADE`: deleting a chat also deletes its messages, through a trigger. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| chat | One conversation, with an owner. One row in `chats`. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| checkpoint | A saved snapshot of a LangGraph agent's state, keyed by a thread id. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| checksum | A short hash of the content. Equal content gives an equal checksum. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| converter | A function that turns stored rows into the input format of one harness. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| cutover | The moment the service starts to use the target store. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| dead row version | An old row version left by `UPDATE` or `DELETE`. Other transactions may still need it. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| defense in depth | Two or more independent checks, so that one mistake does not open access. | [3.1](/notes/ai/conversation-state/03-lifecycle/l1-ownership-checks) |
| deletion record | A log row that says which chat was deleted, when, and from which copies, with no chat content. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| delimiter | A marker, such as an XML-style tag, that shows where one kind of content starts and ends. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| derived copy | A copy built from another copy. It can be rebuilt. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| destructive | It removes information that cannot be rebuilt from the same copy. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| deterministic id | An id computed from the source key, the same on every run, for example a version 5 uuid. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| display part | A piece of an answer that the user saw: text, a chart, a table, a tool status line. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| drift | The copies become different from each other over time. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| dual-write | During the move, the service writes each new turn to both stores. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| enumeration | Trying many ids to find objects that exist. | [3.1](/notes/ai/conversation-state/03-lifecycle/l1-ownership-checks) |
| existence leak | A response that tells the caller that an object exists, even when the caller may not read it. | [3.1](/notes/ai/conversation-state/03-lifecycle/l1-ownership-checks) |
| fail closed | When a check cannot run, the system denies access. | [3.1](/notes/ai/conversation-state/03-lifecycle/l1-ownership-checks) |
| feature flag | A setting that switches a code path without a new deployment. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| Flow 1 | The harness still has its own state for the chat. The service sends only the new user message. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| Flow 2 | The harness has no state for the chat. The service rebuilds the earlier turns from the store and sends them with the new message. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| hard delete | The row is removed with `DELETE`. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| harness | The code that runs the agent loop: the Claude Agent SDK with its CLI, or a LangChain agent. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| harness state | The copy of the conversation that the harness keeps for the model: a session file, or a checkpoint. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| `HumanMessage`, `AIMessage`, `ToolMessage` | The LangChain message classes for a user message, a model message and a tool result. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| idempotency key | An id that the client makes before the first attempt, so that a retry does not write twice. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| idempotent | Running it twice gives the same result as running it once. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| IDOR | Insecure direct object reference: an older name for the same flaw. | [3.1](/notes/ai/conversation-state/03-lifecycle/l1-ownership-checks) |
| indirect prompt injection | Prompt injection that arrives through content from an outside source, such as a tool output or a file. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| life-cycle context | What happens between model and tool calls: summarization, guardrails, logging. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| mapping | The rules that turn one old record into messages with parts. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| message | One user message or one assistant answer, as the user saw it. One row in `messages`. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| model context | Everything that goes into one model call: instructions, messages, tools, model choice, response format. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| model input | The full request body of one model call: system prompt, tools and messages. It exists for one call. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| model message | A message in a provider format for a model call, with content blocks. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| newest-first trimming | Keep whole turns from the newest one backward until the next turn does not fit the budget. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| object-level authorization | An authorization check for one specific object, for example one chat. | [3.1](/notes/ai/conversation-state/03-lifecycle/l1-ownership-checks) |
| one-time cutover | Stop writes, backfill, verify, switch, all in one maintenance window. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| owner | The user who owns a chat. Stored in `chats.owner_id`. | [3.1](/notes/ai/conversation-state/03-lifecycle/l1-ownership-checks) |
| part | One typed item inside a message: text, reasoning, a tool step, a chart, a file. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| part type | The `type` field of a part. It decides the other fields. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| persistent change | A change to the saved state. It affects every later call. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| policy | One RLS rule, for example "a row is visible when `owner_id` equals the current user". | [3.1](/notes/ai/conversation-state/03-lifecycle/l1-ownership-checks) |
| prompt injection | Text in the model input that tries to change the model's instructions. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| purge | The later hard delete of soft-deleted rows. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| read-fallback | The service reads the target store first, and reads (and copies) from the source store when a chat is missing. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| reconciliation | Comparing source and target, chat by chat, and listing every difference. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| reducer | The function that merges an update into a state field. For messages, `add_messages`. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| restore window | How far back a database backup can restore. Deleted data is still in it until the window passes. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| retention period | The time that data stays, for example 180 days after the last activity. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| retention policy | A written rule: which data stays for how long, and what happens after that time. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| rollback plan | The tested steps to return to the source store. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| row-level security (RLS) | A PostgreSQL feature: policies on a table decide which rows a role can read or change. | [3.1](/notes/ai/conversation-state/03-lifecycle/l1-ownership-checks) |
| runtime context | Fixed configuration for one run, for example the user id or a database connection. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| safe cut | A cut of the history that never separates a tool call from its result. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| saved state | The state that the harness keeps between calls and turns: LangGraph state, or the Claude SDK session file. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| `seq` | The number of a message inside its chat: 1, 2, 3, and so on. It defines the order. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| soft delete | The row stays, with a mark such as `deleted_at`. Every read hides marked rows. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| source of truth | The copy that wins when two copies disagree. All other copies are built from it. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| source store | Where the old chats are now: Delta tables or LangGraph checkpoints. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| stable message id | A message id that the converter computes the same way on every run, so a second send replaces instead of appending. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| store | Long-term memory that lives across conversations. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| table bloat | Space in a table file that holds no live rows. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| target store | The new `chats` and `messages` tables. | [3.3](/notes/ai/conversation-state/03-lifecycle/l3-moving-old-chats) |
| text transcript | The earlier turns written as plain text inside one new user prompt. The Claude Agent SDK harness uses it in Flow 2. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| token budget | The largest number of input tokens that the rebuilt history may use. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| tool context | What tools can read and write: state, store, runtime context. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| tool part | One part that holds a tool call and its result (or its error) together. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| tool part state | The stage of a tool part: `input-available` (called, no result yet), `output-available` (result), `output-error` (failed). | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| `tool_calls` | The list on an `AIMessage` that holds each tool call as a name, arguments and an id. | [2.2](/notes/ai/conversation-state/02-chat-history-model/l2-from-stored-parts-to-model-input) |
| transient change | A change to the model input of one call. The saved state stays the same. | [1.2](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) |
| turn | One user message and the assistant answer to it: two rows. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| UI message | A message in the format for display, with parts. | [2.1](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) |
| user transcript | The messages that the user typed and the answers that the user saw, stored by the application. | [1.1](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) |
| `VACUUM` | Removes dead row versions and marks their space for reuse. The file does not shrink. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| `VACUUM FULL` | Writes a new, compact copy of the table. It needs an exclusive lock. | [3.2](/notes/ai/conversation-state/03-lifecycle/l2-retention-and-deletion) |
| verified identity | The user id that the server takes from a checked token or a trusted proxy, never from the request body or the URL. | [3.1](/notes/ai/conversation-state/03-lifecycle/l1-ownership-checks) |
