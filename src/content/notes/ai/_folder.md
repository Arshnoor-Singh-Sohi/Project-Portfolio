---
title: "AI"
order: 2
summary: "AI engineering: LLM systems, context, agents and evaluation."
---

Each subject in this area has its own folder.

| Subject | Goal |
|---|---|
| [LLM Context Engineering](/notes/ai/context-engineering) | Design, build, measure and defend the context layer of a production LLM application or agent. |
| [LLM APIs and Message Formats](/notes/ai/llm-apis) | Read and write raw model requests and responses: content blocks, tool calls, streaming, thinking, two formats. |
| [Claude Agent SDK](/notes/ai/claude-agent-sdk) | Explain and control everything between query() and the final ResultMessage. |
| [LangChain and LangGraph](/notes/ai/langchain-langgraph) | Use create_agent, middleware, summarization, context editing and checkpointers without losing stored messages. |
| [Conversation State and Chat History](/notes/ai/conversation-state) | Decide where conversation state lives, and store chat history so that nothing is lost. |
| [Evaluating AI Systems](/notes/ai/evaluation) | Design tests that prove a claim about an AI system and cannot pass by accident. |
| [LLM Systems Deep Dive](/notes/ai/llm-systems) | Explain, derive and defend attention, the KV cache, PagedAttention, inference, cloud hosting, RAG and MCP at whiteboard depth. |

## Priority path: agent harness foundations

These 16 lessons build on each other. Study them in this order. Each one is in its own subject folder.

| Step | Lesson | Subject |
|---|---|---|
| 1 | [Messages and content blocks](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks) | LLM APIs |
| 2 | [tool_use and tool_result](/notes/ai/llm-apis/01-messages-api/l2-tool-use-and-tool-result) | LLM APIs |
| 3 | [What the SDK is](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is) | Claude Agent SDK |
| 4 | [The agent loop](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop) | Claude Agent SDK |
| 5 | [query() vs ClaudeSDKClient](/notes/ai/claude-agent-sdk/01-foundations/l3-query-vs-claudesdkclient) | Claude Agent SDK |
| 6 | [What a session is](/notes/ai/claude-agent-sdk/04-sessions/l1-what-a-session-is) | Claude Agent SDK |
| 7 | [resume, continue and fork](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork) | Claude Agent SDK |
| 8 | [Session files on temporary disks](/notes/ai/claude-agent-sdk/04-sessions/l3-session-files-on-temporary-disks) | Claude Agent SDK |
| 9 | [System prompts and snapshot](/notes/ai/claude-agent-sdk/05-prompts-and-input/l1-system-prompts-and-snapshot) | Claude Agent SDK |
| 10 | [Three copies of a conversation](/notes/ai/conversation-state/01-where-state-lives/l1-three-copies-of-a-conversation) | Conversation State |
| 11 | [Transient vs persistent context](/notes/ai/conversation-state/01-where-state-lives/l2-transient-vs-persistent-context) | Conversation State |
| 12 | [Tables, keys and constraints](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints) | PostgreSQL |
| 13 | [Column types](/notes/databases/postgres/01-relational-basics/l2-column-types) | PostgreSQL |
| 14 | [Indexes](/notes/databases/postgres/01-relational-basics/l3-indexes) | PostgreSQL |
| 15 | [Transactions](/notes/databases/postgres/02-transactions/l1-transactions) | PostgreSQL |
| 16 | [Chats, messages and parts](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts) | Conversation State |

Background lessons in [LLM Context Engineering](/notes/ai/context-engineering) that the path links to: [The chat API call](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) and [Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching).

## After the priority path: the other "Now" lessons

Every lesson of the nine subjects is now written. These 23 lessons have the stage code "Now". Study them next, in this order. The other lessons follow the stage codes in each part table: A, B, D and E when that step of the project starts, then Later, then Know only.

| Step | Lesson | Subject |
|---|---|---|
| 17 | [The API sets the format, not the model](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format) | LLM APIs |
| 18 | [Stream events](/notes/ai/llm-apis/02-streaming-and-thinking/l1-stream-events) | LLM APIs |
| 19 | [Thinking blocks and signatures](/notes/ai/llm-apis/02-streaming-and-thinking/l2-thinking-blocks-and-signatures) | LLM APIs |
| 20 | [ClaudeAgentOptions](/notes/ai/claude-agent-sdk/02-options-and-messages/l1-claude-agent-options) | Claude Agent SDK |
| 21 | [Message and block types](/notes/ai/claude-agent-sdk/02-options-and-messages/l2-message-and-block-types) | Claude Agent SDK |
| 22 | [The event loop and coroutines](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines) | Python |
| 23 | [Async generators](/notes/software-engineering/python/01-asyncio/l2-async-generators) | Python |
| 24 | [Sync code calling async code](/notes/software-engineering/python/01-asyncio/l3-sync-code-calling-async-code) | Python |
| 25 | [In-process MCP tools](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) | Claude Agent SDK |
| 26 | [Streaming input mode](/notes/ai/claude-agent-sdk/05-prompts-and-input/l2-streaming-input-mode) | Claude Agent SDK |
| 27 | [Window size and auto-compaction](/notes/ai/claude-agent-sdk/06-context-window/l1-window-size-and-auto-compaction) | Claude Agent SDK |
| 28 | [FastAPI StreamingResponse and SSE](/notes/software-engineering/python/02-web-streaming/l1-fastapi-streaming-response-and-sse) | Python |
| 29 | [Databricks Apps](/notes/platforms/databricks/01-apps/l1-databricks-apps) | Databricks |
| 30 | [CLI profiles](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) | Databricks |
| 31 | [Claude on Microsoft Foundry](/notes/ai/llm-apis/04-providers-and-caching/l1-claude-on-microsoft-foundry) | LLM APIs |
| 32 | [Unity Catalog service credentials](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) | Databricks |
| 33 | [Databricks MCP servers](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) | Databricks |
| 34 | [Genie One MCP](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) | Databricks |
| 35 | [uv and pyproject.toml](/notes/software-engineering/python/03-tooling/l1-uv-and-pyproject) | Python |
| 36 | [pytest fixtures and monkeypatch](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch) | Python |
| 37 | [Fake model vs real model](/notes/ai/evaluation/01-test-design/l1-fake-model-vs-real-model) | Evaluation |
| 38 | [Random data, controls and strict scoring](/notes/ai/evaluation/01-test-design/l2-random-data-controls-strict-scoring) | Evaluation |
| 39 | [Independent audit](/notes/ai/evaluation/01-test-design/l3-independent-audit) | Evaluation |

Steps 22 to 24 come before step 25 because an in-process tool shares the event loop of your Python process.

## Interview track: LLM systems

[LLM Systems Deep Dive](/notes/ai/llm-systems) prepares a deep-dive technical interview in 1 to 2 weeks. It has its own order, separate from the priority path above: the 12-day plan in its [course plan](/notes/ai/llm-systems/course-plan). Days 1 to 5 cover the core interview chain: attention, the KV cache, the PagedAttention paper and the changes in MCP.

Start with these 5 lessons. They open day 1 of the plan.

| Step | Lesson | Part |
|---|---|---|
| 1 | [Vectors and dot products](/notes/ai/llm-systems/01-math-and-hardware/l1-vectors-and-dot-products) | 01 Math and hardware |
| 2 | [Matrices and matrix multiplication](/notes/ai/llm-systems/01-math-and-hardware/l2-matrices-and-matrix-multiplication) | 01 Math and hardware |
| 3 | [Tensors, shapes and batches](/notes/ai/llm-systems/01-math-and-hardware/l3-tensors-shapes-and-batches) | 01 Math and hardware |
| 4 | [Numbers in memory: FP32, BF16, FP8, INT4](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory) | 01 Math and hardware |
| 5 | [GPUs, memory and bandwidth](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth) | 01 Math and hardware |
