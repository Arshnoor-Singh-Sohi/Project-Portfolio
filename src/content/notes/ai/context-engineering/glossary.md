---
title: "Glossary"
order: 2
summary: "Every term in this subject, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.


## 0–9

| Term | Plain meaning | First seen |
|---|---|---|
| 40-40-20 model | A budget rule from the handbook: 40% task context, 40% working memory, 20% reserve. | [7.6](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets) |

## A

| Term | Plain meaning | First seen |
|---|---|---|
| A2A (Agent2Agent) | An open protocol, created by Google, for communication between agents. MCP connects an agent to tools. A2A connects agents to agents. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| A/B test | An experiment that sends two prompt versions to two random groups of real users and compares the results. | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| ablation study | An experiment that removes one part at a time and measures the change in quality. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| abstention | The model says that the context does not contain the answer, instead of guessing. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| access path | The steps that bring a memory from its store into the request: a copy, a key lookup or a search. | [8.4](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers) |
| ACE (agentic context engineering) | A framework by Zhang et al. (2025) in which an agent improves its own context, a playbook, from its successes and failures, with no weight updates. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |
| actionable error | An error message that names the field, the expected value, the received value and a valid example, so the model can fix the call. | [6.3](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs) |
| `additionalProperties` | The JSON Schema keyword that controls extra keys. The value `false` forbids keys that are not in `properties`. | [6.3](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs) |
| adversarial test | A test input that tries on purpose to make the model break a rule. | [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt) |
| agent | An application that calls a model in a loop. The model picks an action, a tool runs it, and the result returns to the context for the next step. | [2.1](/notes/ai/context-engineering/02-paradigm-shift/l1-from-prompts-to-context-engineering) |
| Agent Card | A2A's JSON document that describes an agent's identity, endpoint, capabilities, skills and authentication needs. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| agent harness | The program around the model that reads files, builds each request, runs tools and loops, for example Claude Code, Codex or Cursor. | [3.5](/notes/ai/context-engineering/03-system-layer/l5-rules-files) |
| agent team | A Claude Code feature: a lead session and teammate sessions, each with its own context window, a shared task list and direct messages. | [7.8](/notes/ai/context-engineering/07-compress-and-isolate/l8-isolation-patterns) |
| Agentic AI Foundation (AAIF) | A Linux Foundation body, announced on 2025-12-09, that stewards open agent projects such as MCP and AGENTS.md. | [3.5](/notes/ai/context-engineering/03-system-layer/l5-rules-files) |
| agentic engineering | The handbook's name for its fourth "era": building agent systems on top of context engineering. It is not an established technical term. | [2.1](/notes/ai/context-engineering/02-paradigm-shift/l1-from-prompts-to-context-engineering) |
| agentic RAG | RAG where the model decides whether to search, what to search for, and whether to search again, by calling a retrieval tool. | [5.7](/notes/ai/context-engineering/05-retrieval-quality/l7-just-in-time-retrieval) |
| AGENTS.md | An open, plain-Markdown format for instructions to coding agents, read by many tools and stewarded by the Agentic AI Foundation. | [3.5](/notes/ai/context-engineering/03-system-layer/l5-rules-files) |
| aggregation | Returning a computed summary (counts, sums, top items) instead of the raw rows. | [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) |
| altitude (of an instruction) | How specific an instruction is: from vague guidance to an exact script. | [3.2](/notes/ai/context-engineering/03-system-layer/l2-the-right-altitude) |
| always-loaded file | A file that the application puts into the context on every call, such as CLAUDE.md or AGENTS.md. | [5.7](/notes/ai/context-engineering/05-retrieval-quality/l7-just-in-time-retrieval) |
| analyzer | The steps that turn raw text into terms: split, lowercase, and optionally remove stop words and stem. The same analyzer must run on documents and queries. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| ANN recall | The share of the true $k$ nearest neighbors that an approximate index returns. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| answer relevancy | How well an answer addresses the question. RAGAS measures it from questions that an LLM generates from the answer. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| anti-pattern | A common design that looks reasonable but causes failures. | [9.9](/notes/ai/context-engineering/09-production/l9-seven-anti-patterns) |
| append-only history | A conversation history where new content is added at the end and old content never changes. It keeps the cached prefix valid. | [3.6](/notes/ai/context-engineering/03-system-layer/l6-the-context-stack) |
| approximate nearest neighbor search (ANN) | k-NN search that compares the query with only part of the stored vectors. It is faster and can miss some true neighbors. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| argument substitution | Claude Code replaces placeholders such as `$ARGUMENTS` in a command or skill with the text that you typed after the command name. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| argument validation | The application checks the model's arguments against the schema and business rules before it runs the tool. | [6.3](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs) |
| assistant prefill | Output priming done through the API: the application sends a final assistant message that the model must continue. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| associative retrieval | Finding memories by following links between them, for example the same entity or the same ticket. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| atomic prompt (atom) | The smallest complete prompt: a task, its constraints and an output format, with no examples. | [3.7](/notes/ai/context-engineering/03-system-layer/l7-atomic-and-molecular-prompts) |
| atomic write | A write that either completes fully or leaves the old data unchanged, so that a crash never leaves a half-written file. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| attention weight | The share of attention that one token gives to another. The weights of one query add up to 1. | [1.4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) |
| audience | Who reads a saved item later: this run, this user's sessions, or a whole team and its agents. | [4.2](/notes/ai/context-engineering/04-write-and-rag/l2-write-scratchpads-memories-files) |
| audit rating | One of three values for each element: missing (absent), inadequate (present but too weak), adequate (fine for this task). | [2.6](/notes/ai/context-engineering/02-paradigm-shift/l6-the-context-audit) |
| augmented LLM | A model with retrieval, tools and memory. Anthropic calls it the building block of workflows and agents. | [6.6](/notes/ai/context-engineering/06-tools-and-mcp/l6-execution-patterns-and-react) |
| authority level | What the bot may decide alone, and what needs a human. | [2.6](/notes/ai/context-engineering/02-paradigm-shift/l6-the-context-audit) |
| auto memory | Notes that Claude Code writes for itself in a per-project MEMORY.md file and loads in later sessions. | [9.2](/notes/ai/context-engineering/09-production/l2-the-project-files) |
| autoregressive generation | The model adds each new token to the sequence and then predicts the token after it. It repeats this until it stops. | [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) |
| avgdl | The average document length in terms, over the whole collection. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |

## B

| Term | Plain meaning | First seen |
|---|---|---|
| $b$ | The BM25 parameter that controls how strongly a long document is penalized, from 0 (no penalty) to 1 (full penalty). | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| background compaction | A compaction that runs after the reply is sent and before the next turn arrives, so the user does not wait for it. | [7.5](/notes/ai/context-engineering/07-compress-and-isolate/l5-when-to-compress) |
| bag of words | A model of text that keeps only which words appear and how often, not their order. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| base-level activation | In the ACT-R theory of cognition, a number for how available a memory is. It rises with each use and falls as a power of the time since each use. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| Batch API | A provider interface that runs many requests without a time guarantee, at a lower price. | [9.8](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency) |
| bi-encoder | An embedding model that encodes each text alone, so that document vectors can be computed once and stored. | [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| BM25 | A ranking function that scores a document by the query terms it contains, with IDF weights, term-frequency saturation and length normalization. "Okapi BM25" is its full name. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| break packing | Packing that stops at the first chunk that does not fit. | [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) |
| brevity bias | The tendency of prompt optimization to collapse toward short, generic prompts that lose domain detail. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |
| brittle instruction | An instruction that scripts exact triggers and exact replies, so it fails on inputs that it does not list. | [3.2](/notes/ai/context-engineering/03-system-layer/l2-the-right-altitude) |
| broken intermediate state | A point during a change where the code does not import, build or pass tests, because a dependency is not written yet. | [9.3](/notes/ai/context-engineering/09-production/l3-the-prp-workflow) |
| budget ceiling | The largest share that a slot may use. It is a limit, not a target to fill. | [7.6](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets) |
| budget split | The planned division of the window between instructions, history, retrieved chunks, the question and the output. | [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) |
| buffer | The list of the most recent turns that the agent sends word for word on every call. It is the hot layer. | [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent) |
| build-time context | The context that a coding agent reads while it writes your software, for example CLAUDE.md and a spec. | [9.1](/notes/ai/context-engineering/09-production/l1-context-is-the-product) |
| business rule | A requirement that comes from the domain, not from the code style, for example "count only completed orders". | [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches) |
| busy timeout | The time that a SQLite connection waits for a lock before it raises SQLITE_BUSY. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| byte-level BPE | BPE that starts from the 256 possible byte values, so it can encode any text. | [1.2](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers) |
| byte-pair encoding (BPE) | A method that builds a vocabulary by merging the most frequent pair of symbols, again and again. | [1.2](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers) |

## C

| Term | Plain meaning | First seen |
|---|---|---|
| cache breakpoint | A marker that says "cache the input up to here" (Anthropic: `cache_control`). | [1.7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) |
| cache hit rate | The share of input tokens that came from the cache. | [1.7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) |
| cache miss | The prefix does not match, or the cache expired. The tokens are processed at the normal price. | [1.7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) |
| cache read (cache hit) | A later call that reuses the stored prefix. It costs much less than normal input. | [1.7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) |
| cache write | The first call that stores a prefix. It can cost more than normal input. | [1.7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) |
| cache-friendly order | An order of the prompt parts where content that never changes comes first and content that changes on every call comes last. | [3.3](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order) |
| call ID | The identifier that pairs a tool call with its result: `tool_use_id` (Anthropic), `tool_call_id` (OpenAI Chat Completions), `call_id` (OpenAI Responses), `id` (Gemini). | [6.2](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop) |
| candidate set | The chunks that the first stage returns for the reranker to score, for example the top 50. | [5.3](/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers) |
| candidate set $R$ | The chunks that MMR may choose from, for example the top 20 of a similarity search. | [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) |
| causal mask | The rule that a token can use only earlier tokens and itself, never later ones. | [1.4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) |
| ceiling effect | A score that reaches its maximum early, so it cannot show further improvement. | [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches) |
| centroid | The mean of a group of vectors. It stands for the whole group in a fast first comparison. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| chain of command | OpenAI's name, in its Model Spec, for the ranked list of instruction sources. | [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt) |
| chain-of-thought (CoT) | Writing out intermediate reasoning steps before the final answer. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| chance agreement ($p_e$) | The share of agreement expected if each rater labels at random with its own label frequencies. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| checkpointer | In LangGraph, a component that saves the state of one conversation thread so that it can continue later. | [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent) |
| chunk | One piece of a document, small enough to embed and to place in a prompt. A RAG system retrieves chunks, not whole documents. | [4.4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) |
| chunk order | The sequence of the retrieved chunks in the window. | [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) |
| chunk overlap | The number of characters or tokens that the end of one chunk shares with the start of the next one. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| chunk size | The largest length of one chunk. Its unit (characters or tokens) depends on the splitter. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| chunking | Splitting documents into smaller pieces before embedding them. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| CI job | One unit of work in a continuous integration system, for example a GitHub Actions job. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| CI secret | A value, such as an API key, that the CI system stores encrypted and passes to jobs. It never goes into the repository. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| circuit breaker | A wrapper that counts failures of a call and, after a threshold, makes further calls fail at once without running them. | [7.9](/notes/ai/context-engineering/07-compress-and-isolate/l9-contract-first-design) |
| citation | A reference in an answer to the document or chunk that supports a statement. | [4.3](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval) |
| clarifying question | A question that the application asks the user before it retrieves, because the query has several likely meanings. | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |
| `claude_desktop_config.json` | The file where Claude Desktop reads its local MCP servers: a command, arguments and an environment for each one. | [6.8](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) |
| CLAUDE.local.md | A personal, project-level rules file for Claude Code that stays out of version control. | [3.5](/notes/ai/context-engineering/03-system-layer/l5-rules-files) |
| CLAUDE.md | The rules file of Claude Code. It can exist at several levels: managed policy, user, project and local. | [3.5](/notes/ai/context-engineering/03-system-layer/l5-rules-files) |
| `clear_at_least` | A context-editing parameter: the minimum number of tokens that one clearing must free, or the API skips the clearing. | [7.3](/notes/ai/context-engineering/07-compress-and-isolate/l3-tool-result-clearing) |
| closed-book | A test of the model with no documents at all. It measures what the weights know. | [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) |
| CoALA | Cognitive Architectures for Language Agents: a 2023 framework by Sumers, Yao, Narasimhan and Griffiths that names the memory types of LLM agents. | [8.2](/notes/ai/context-engineering/08-memory/l2-three-kinds-of-memory) |
| code action | An agent action written as executable code instead of a JSON tool call. CodeAct is the paper that studied this. | [7.8](/notes/ai/context-engineering/07-compress-and-isolate/l8-isolation-patterns) |
| Cohen's kappa ($\kappa$) | A measure of agreement between two raters that removes the agreement expected by chance. 1 is perfect, 0 is chance level. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| ColBERT | The late-interaction retriever of Khattab and Zaharia (SIGIR 2020). | [5.3](/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers) |
| cold tier | Persistent memory that reaches the window only through a query: a filter plus a keyword or vector search. | [8.4](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers) |
| collection | Chroma's name for a named set of chunks, embeddings and metadata with one distance metric. | [4.4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) |
| common token bias | The tendency of a model to prefer outputs made of tokens that are common in its training data. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| community summary | In GraphRAG, an LLM-written summary of a group of closely connected entities. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| compaction | Replacing the older part of a conversation with a summary and continuing in a smaller context. | [7.2](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction) |
| compaction block | The Anthropic API content block that holds a server-written summary. Later requests drop everything before it. | [7.2](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction) |
| compaction trigger | The condition that starts a compaction, for example "the next input is above 150,000 tokens". | [7.2](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction) |
| COMPRESS | A context strategy: keep only the tokens that the task needs, for example by summarizing, trimming or clearing content that is already in the window. | [4.1](/notes/ai/context-engineering/04-write-and-rag/l1-four-strategies) |
| compression ratio | Tokens before compression divided by tokens after it. A ratio of 16 means 16 times fewer tokens. | [7.1](/notes/ai/context-engineering/07-compress-and-isolate/l1-why-compress) |
| compression trigger | The rule that starts compression, for example every N turns or when the buffer passes a token limit. | [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent) |
| compute-bound | Limited by arithmetic speed. Prefill is usually compute-bound. | [1.4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) |
| condensed summary | The short result that a sub-agent returns instead of its full working context. | [7.7](/notes/ai/context-engineering/07-compress-and-isolate/l7-isolate-one-window-is-not-enough) |
| conditional execution | A step that chooses the next tool from the input, for example by the intent of the request. | [6.6](/notes/ai/context-engineering/06-tools-and-mcp/l6-execution-patterns-and-react) |
| confirmation gate | A rule in the application that a human must approve a tool call before it runs. | [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) |
| confused deputy | An attack in which a server with its own authority is tricked into using that authority for a party that should not have it. | [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) |
| consolidation | Replacing several narrow rules with one broader rule that covers them all. | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| Constitutional AI (CAI) | Anthropic's training method that uses a written list of principles and AI feedback to make a model harmless. | [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt) |
| constrained decoding | A decoding method that allows only the tokens that keep the output valid under a schema or grammar. | [6.3](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs) |
| content hash | A short fingerprint of a document's text, for example SHA-256. It changes when the text changes. | [4.4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) |
| context artifact | One file of the context layer, for example CLAUDE.md, a spec or a tool description. | [9.1](/notes/ai/context-engineering/09-production/l1-context-is-the-product) |
| context as code | The practice of keeping context artifacts in version control, with review, tests and release rules, like application code. | [9.1](/notes/ai/context-engineering/09-production/l1-context-is-the-product) |
| context assembly | The step that builds the request for one call from the system prompt, facts, summary, recent turns and the new message. | [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent) |
| context audit | A diagnosis of a failing interaction that checks each of the six elements for what is missing or inadequate. | [2.6](/notes/ai/context-engineering/02-paradigm-shift/l6-the-context-audit) |
| context budget | The maximum number of input tokens that a design allows on one call. It is a design choice and is often far below the window size. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| context bullet | One item of an ACE playbook, with a unique ID and helpful and harmful counters. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |
| context collapse | A sudden loss of detail when an LLM rewrites a long context in full, often with a drop in accuracy. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |
| context compression | Any method that reduces the tokens in the window and tries to keep the information that later steps need. | [7.1](/notes/ai/context-engineering/07-compress-and-isolate/l1-why-compress) |
| context coverage | The share of the facts and actions that a task needs which are present in the window or available as tools. | [2.1](/notes/ai/context-engineering/02-paradigm-shift/l1-from-prompts-to-context-engineering) |
| context editing | An Anthropic API feature that clears old tool results or thinking blocks on the server before the prompt reaches the model. | [7.3](/notes/ai/context-engineering/07-compress-and-isolate/l3-tool-result-clearing) |
| context element | One of six kinds of information that together form the input of a call. Each token of the input belongs to one element. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| context engineering | Choosing which tokens go into the context window, in which order and in which format, on every call. | [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) |
| context isolation | Splitting the work of a task across several context windows, so that each window holds only what its part of the work needs. | [7.7](/notes/ai/context-engineering/07-compress-and-isolate/l7-isolate-one-window-is-not-enough) |
| context layer | All the text that an application or a coding agent puts into the model's window by design. Examples: system prompt, tool definitions, rules files, specs and examples. | [9.1](/notes/ai/context-engineering/09-production/l1-context-is-the-product) |
| context overload | The anti-pattern of putting more into the window than the task needs, so that key content is lost among the rest. | [9.9](/notes/ai/context-engineering/09-production/l9-seven-anti-patterns) |
| context precision | A RAGAS metric that is high when the relevant chunks are at the top of the retrieved list. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| context recall | The share of the claims in a reference answer that the retrieved context supports. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| context rot | The name that Chroma's July 2025 report uses for the length effect. | [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) |
| context stack | A design model that sorts the context of an agent into layers by how long each layer stays valid. | [3.6](/notes/ai/context-engineering/03-system-layer/l6-the-context-stack) |
| context stuffing | Putting every possibly relevant item into the window and hoping that the model finds what matters. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| context to assemble | The ordered list of files that the agent must read before it writes code. | [9.3](/notes/ai/context-engineering/09-production/l3-the-prp-workflow) |
| context version ID | A short hash of all context artifacts that one call used. It identifies the exact context version in logs and traces. | [9.1](/notes/ai/context-engineering/09-production/l1-context-is-the-product) |
| context window | All the tokens that a model can process in one call. The input and the output share it. | [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) |
| contextual BM25 | The sparse half of contextual retrieval: index the chunk with its context prefix in BM25. | [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) |
| contextual calibration | A correction that measures a model's bias on a content-free input and then adjusts its output probabilities. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| contextual chunk header | Text added in front of a chunk before embedding, for example the document title and the section path, so that the chunk carries its context. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| contextual chunk prefix | A short text before a chunk that says where the chunk comes from and what it is about. | [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) |
| contextual embeddings | The dense half of contextual retrieval: embed the chunk with its context prefix. | [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) |
| contextual retrieval | Anthropic's method: an LLM writes a short context for each chunk. That context goes before the chunk in the embedding index and in the BM25 index. | [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) |
| contract | A written, machine-checkable definition of an interface between agents: endpoints, field names, types, formats, errors and limits. | [7.9](/notes/ai/context-engineering/07-compress-and-isolate/l9-contract-first-design) |
| contract-first design | Writing every shared contract before any agent starts to build, and validating against it at the end. | [7.9](/notes/ai/context-engineering/07-compress-and-isolate/l9-contract-first-design) |
| contrastive training | Training that makes the vectors of matching pairs more similar, and the vectors of non-matching texts less similar. | [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| conversation bloat | Old turns that no longer matter stay in the window. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| conversation history | The earlier user messages and model replies of this conversation, including earlier tool calls. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| cosine distance | One minus the cosine similarity. Chroma uses it when a collection's space is "cosine". | [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| cosine similarity | A measure of how closely two vectors point in the same direction, from −1 to 1. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| cost per conversation | The sum of the cost of all calls in one conversation or agent task. | [9.8](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency) |
| CoT example | A demonstration that shows the input, the reasoning steps and the final answer. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| critical element | An element without which the task is not solvable. Fix critical elements first. | [2.6](/notes/ai/context-engineering/02-paradigm-shift/l6-the-context-audit) |
| cross-encoder | A model that reads the query and one document together in one input and outputs one relevance score. Nothing can be stored in advance. | [5.3](/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers) |
| cross-lingual retrieval | Retrieval where the query and the documents are in different languages. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| cross-session memory | Memory that survives the end of a session and comes back in a later session, for example stored facts about a user. | [8.1](/notes/ai/context-engineering/08-memory/l1-stateless-models-stateful-apps) |
| cumulative input | The sum of the input tokens of all calls in a conversation. | [1.6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation) |
| Curator | The ACE role that turns the lessons into small, structured updates to the playbook. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |

## D

| Term | Plain meaning | First seen |
|---|---|---|
| data loss prevention (DLP) | Automatic checks that find and remove sensitive data, such as card numbers or keys, before data leaves a system. | [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) |
| DCG | Discounted cumulative gain: the sum of the relevance gains of the results, each divided by a discount that grows with the rank. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| death by a thousand instructions | Shopify's name for a system prompt that grows into many special cases and conflicting rules, one set for each tool. | [6.5](/notes/ai/context-engineering/06-tools-and-mcp/l5-many-tools) |
| decay | A rule that lowers the weight of a memory, or removes it, as time passes. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| decision cycle | In the CoALA framework, one loop of an agent: read the situation, choose an action, act. | [8.2](/notes/ai/context-engineering/08-memory/l2-three-kinds-of-memory) |
| decision procedure | An instruction with a trigger, a first action, a fallback and an exit, so the model knows what to do in common and unusual cases. | [3.2](/notes/ai/context-engineering/03-system-layer/l2-the-right-altitude) |
| declarative memory | The psychology term for memory of facts and events (semantic plus episodic), as opposed to procedural memory of skills. | [8.2](/notes/ai/context-engineering/08-memory/l2-three-kinds-of-memory) |
| decode | The second phase of a call. The model writes output tokens one at a time. | [1.4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) |
| `default` | A JSON Schema annotation that documents a default value. Validators do not insert it, so the application must apply it. | [6.3](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs) |
| defense in depth | Several independent layers of protection, so that one failed layer does not cause harm. | [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) |
| deferred loading | Anthropic's `defer_loading: true`: a tool's definition is sent in the request but enters the model's context only when a search finds it. | [6.5](/notes/ai/context-engineering/06-tools-and-mcp/l5-many-tools) |
| deletion (pruning) | Removing content from the window without keeping its meaning in another form. | [7.1](/notes/ai/context-engineering/07-compress-and-isolate/l1-why-compress) |
| delimiter | A marker that shows where a part of the prompt starts or ends, for example an XML tag or a Markdown header. | [3.3](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order) |
| delta update | A small change to a context, such as new items or counter changes, that is merged into it instead of a full rewrite. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |
| demonstration (shot) | One example input with its desired output, placed in the prompt. | [3.7](/notes/ai/context-engineering/03-system-layer/l7-atomic-and-molecular-prompts) |
| demotion | Moving a memory to a slower tier, for example folding an old turn into the summary. | [8.4](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers) |
| dense retrieval | Retrieval that compares embedding vectors, where every slot holds a number (Part 4). | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| detail level | One of several prepared versions of the same item at different sizes, for example 10, 30, 200 and 2,000 tokens. | [7.4](/notes/ai/context-engineering/07-compress-and-isolate/l4-priority-trimming-and-hierarchical-compression) |
| developer message | OpenAI's name for system-level instructions on newer models. It ranks above user messages. | [1.3](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) |
| direct prompt injection | A prompt injection that comes from the user's own message. | [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) |
| distractor | Text that looks relevant but does not answer the question. | [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) |
| document frequency, $n(q)$ | How many documents in the collection contain term $q$ at least once. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| dot product | The sum of the products of matching values of two vectors. It depends on both the angle between the vectors and their lengths. | [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| drift | A slow change in queries, documents or models that lowers quality over time. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| dry run | A preview of a tool call that shows what would happen without doing it. | [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) |
| dynamic budgeting | Adjusting the budget of each slot on each call, from measured and estimated sizes. | [7.6](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets) |
| Dynamic Cheatsheet | A method by Suzgun et al. (2025) in which a black-box model keeps and rewrites a memory of strategies and code at test time. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |
| dynamic selection | Choosing the examples for each call from a library, usually by similarity to the new input. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| dynamic tool results | The outputs of tools during the task, for example search results, test output and API responses. | [3.6](/notes/ai/context-engineering/03-system-layer/l6-the-context-stack) |

## E

| Term | Plain meaning | First seen |
|---|---|---|
| eager loading | Putting all possibly useful content into the context window before the model starts. | [5.7](/notes/ai/context-engineering/05-retrieval-quality/l7-just-in-time-retrieval) |
| effective context length | The longest input where a model still performs above a set level. It is often shorter than the advertised window. | [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) |
| effort level | The Claude Code setting that controls how much reasoning the model does: low, medium, high, xhigh or max, depending on the model. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| ef_search | The size of the candidate list during an HNSW query. A larger value gives higher recall and slower queries. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| elicitation | The MCP client feature through which a server asks the user for input during a request. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| embedding | A vector of numbers that represents the meaning of a text, so that similar texts get similar vectors. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| embedding inversion | Recovering the original text from its embedding vector. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| embedding model | A neural network that turns a text into an embedding of fixed length. | [4.4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) |
| embedding retrieval | Finding memories whose embedding vectors are close to the query's vector, usually by cosine similarity. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| encoding | A named tokenizer with its vocabulary and merge rules, for example `o200k_base`. | [1.2](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers) |
| engineered context | A call where several elements work together: system instructions, retrieved knowledge and the user input. | [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches) |
| engineered prompt | A request that states the requirements in detail, but still gives only the user input element. | [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches) |
| entropy | Shannon's measure of the average information per symbol of a source, in bits. It is the lower limit for lossless compression of that source. | [7.1](/notes/ai/context-engineering/07-compress-and-isolate/l1-why-compress) |
| `enum` | The JSON Schema keyword that lists every allowed value of a field. | [6.3](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs) |
| episodic memory | Long-term memory of specific past events, each with a time and a context. Example: "On 18 February the user asked about the enterprise plan." | [8.2](/notes/ai/context-engineering/08-memory/l2-three-kinds-of-memory) |
| error contract | The agreed shape of a failure response, so that the receiver can handle errors by code. | [7.9](/notes/ai/context-engineering/07-compress-and-isolate/l9-contract-first-design) |
| escalation | Handing a conversation to a human, with a summary of the case. | [2.6](/notes/ai/context-engineering/02-paradigm-shift/l6-the-context-audit) |
| escaping | Changing special characters in inserted data so that they cannot act as markup, for example `<` becomes `&lt;`. | [3.3](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order) |
| Euclidean distance (L2 distance) | The straight-line distance between the ends of two vectors. | [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| eval suite | The full set of test cases that every prompt version must pass before release. | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| eval threshold | The minimum score that a change must reach to pass the gate. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| evaluation (eval) | A repeatable measurement of a system's outputs on a fixed set of cases, with a score. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| event trigger | A compression that starts at a point in the task, such as a used tool result, a handoff or the end of a phase. | [7.5](/notes/ai/context-engineering/07-compress-and-isolate/l5-when-to-compress) |
| exact match | A score that compares the output with the expected value after normalization, such as lower case and no extra spaces. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| exact search | k-NN search that compares the query with every stored vector. It always returns the true nearest neighbors. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| example file | A real code file in `examples/` that shows the structure new code must copy. It is a structural template, not documentation. | [9.2](/notes/ai/context-engineering/09-production/l2-the-project-files) |
| example library | A stored set of curated examples, with their inputs, outputs and metadata, for dynamic selection. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| examples folder | A folder of reference code and input-output pairs that show the agent the patterns to copy. | [3.6](/notes/ai/context-engineering/03-system-layer/l6-the-context-stack) |
| excessive agency | An agent that has more functions, permissions or autonomy than its task needs, so a manipulated model can do real damage (OWASP LLM06:2025). | [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) |
| `exclude_tools` | A context-editing parameter: tools whose results are never cleared. | [7.3](/notes/ai/context-engineering/07-compress-and-isolate/l3-tool-result-clearing) |
| executable test | A test that runs the generated code on known inputs and compares the result with the expected output. | [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches) |
| exfiltration | Sending private data out of the system to an attacker. | [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) |
| exit code | The number a command returns when it ends. 0 means success. Any other value means failure. | [9.4](/notes/ai/context-engineering/09-production/l4-validation-loops) |
| exponential backoff | A retry rule in which the wait doubles after each failed attempt, up to a maximum. | [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) |
| exponential decay | A decay rule that multiplies a score by the same factor in each time unit. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| extended thinking | A model feature where the model writes reasoning tokens before its answer. They count as output tokens. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| external context | MemGPT's name for everything outside the window: recall storage (the full message history) and archival storage. | [2.2](/notes/ai/context-engineering/02-paradigm-shift/l2-the-llm-os-model) |
| external storage | Any place outside the context window that holds information: a file, a database, a vector index or a memory store. | [4.1](/notes/ai/context-engineering/04-write-and-rag/l1-four-strategies) |
| extraction prompt | The prompt that asks a model to turn conversation turns into structured facts. | [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent) |

## F

| Term | Plain meaning | First seen |
|---|---|---|
| fact history | A record of every earlier value of a fact, with the time when each value was valid. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| fact store | The persistent store of extracted facts about a user or task, searched on each message. It is the cold layer. | [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent) |
| fail fast | Stop at the first failed check, so that later, slower checks do not run on broken code. | [9.4](/notes/ai/context-engineering/09-production/l4-validation-loops) |
| failure mode | A repeatable way in which the model gets a task wrong, for example "invents a return policy". | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| faithfulness | The share of the claims in an answer that the retrieved context supports. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| fallback | The action that a decision procedure takes when the first action fails or does not fit. | [3.2](/notes/ai/context-engineering/03-system-layer/l2-the-right-altitude) |
| feature spec | A short document that says what to build, with references, examples and edge cases. In the PRP template it is the file `INITIAL.md`. | [3.6](/notes/ai/context-engineering/03-system-layer/l6-the-context-stack) |
| `fetch_k` | In LangChain, the number of candidates that the vector store returns before MMR selects from them. | [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) |
| few-shot prompting | Asking the model to do a task with a small number of demonstrations in the prompt. | [3.7](/notes/ai/context-engineering/03-system-layer/l7-atomic-and-molecular-prompts) |
| file (artifact) | A durable document that people and agents share, for example `CLAUDE.md`, a design record or a generated report. | [4.2](/notes/ai/context-engineering/04-write-and-rag/l2-write-scratchpads-memories-files) |
| fine-tuning | More training of a model on new examples. It changes the weights, not the context. | [4.1](/notes/ai/context-engineering/04-write-and-rag/l1-four-strategies) |
| first-stage retrieval | The fast search over the whole corpus that returns a candidate set, for example dense, BM25 or hybrid retrieval. | [5.3](/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers) |
| fixed prefix ($S$) | The tokens sent on every call: system prompt, tool definitions and other fixed content. | [1.6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation) |
| fixed-size chunking | Cutting text every N characters or tokens, without regard to sentences or sections. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| fixture | A small, fixed input file built to test one behavior, with a known correct result. | [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches) |
| flaky test | A test that sometimes passes and sometimes fails with the same prompt, because sampling is random. | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| forbidden element | A claim that a correct answer must not contain, for example a common hallucination. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| forced tool use | A `tool_choice` value that makes the model call a tool, or one named tool, instead of writing text. | [6.2](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop) |
| format pollution | The model copies the format of earlier turns when the task now needs another format. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| formatter check | A run of a code formatter that reports unformatted files without changing them, for example `prettier --check`. | [9.4](/notes/ai/context-engineering/09-production/l4-validation-loops) |
| freshness | How current the information is that the model uses for an answer. | [4.3](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval) |
| frontmatter | A YAML block between two `---` lines at the top of a Markdown file. It holds settings such as `description`. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| full suite | The complete set of evaluation cases. It runs on merge, on a schedule and before releases. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| full-context prompting | Putting the whole knowledge base into the prompt on every call, without retrieval. | [4.3](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval) |
| full-history replay | The simplest memory strategy: the application sends every earlier turn of the session again on every call. | [8.1](/notes/ai/context-engineering/08-memory/l1-stateless-models-stateful-apps) |

## G

| Term | Plain meaning | First seen |
|---|---|---|
| GenAI semantic conventions | The OpenTelemetry conventions for model calls, tool calls and agents, with attribute names that start with `gen_ai.` | [9.8](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency) |
| generalization gap | The pass rate on planned inputs minus the pass rate on unplanned inputs. | [3.2](/notes/ai/context-engineering/03-system-layer/l2-the-right-altitude) |
| Generator | The ACE role that solves tasks with the current playbook and produces reasoning trajectories. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |
| glob | A file-name pattern with wildcards, for example `src/api/**/*.py`. | [3.5](/notes/ai/context-engineering/03-system-layer/l5-rules-files) |
| global question | A question about a whole corpus, such as "What are the main themes?", whose answer is in no single chunk. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| graded relevance | Relevance labels with levels, for example 0 (not relevant), 1 (partly relevant), 2 (fully answers). | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| gradient update | A change to a model's weights during training. In-context learning makes none. | [3.7](/notes/ai/context-engineering/03-system-layer/l7-atomic-and-molecular-prompts) |
| GraphRAG | Microsoft's method that uses an LLM to build an entity graph and community summaries. It answers questions about a whole corpus (Edge et al., 2024). | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| greedy algorithm | An algorithm that makes the best choice at each step and never changes an earlier choice. | [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) |
| ground truth set (GTX) | A set of test cases from the real distribution of use, with answers or criteria that human experts checked. Shopify's name for its evaluation sets. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| grounded answer | An answer that the documents in the window support. | [4.3](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval) |
| grouped-query attention (GQA) | A design where several query heads share one key head and one value head. It makes the KV cache smaller. | [1.4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) |
| grow-and-refine | The ACE step that adds new bullets, updates counters, and removes duplicate bullets by embedding similarity. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |
| GRPO | Group Relative Policy Optimization, a reinforcement-learning method that Shopify used to train its model. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |

## H

| Term | Plain meaning | First seen |
|---|---|---|
| half-life | The time after which a decaying score has fallen to half of its starting value. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| hallucination | A confident statement that the weights and the window do not support. | [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) |
| handoff | In the OpenAI Agents SDK, a transfer of control from one agent to another. By default, the new agent sees the whole earlier conversation. | [7.8](/notes/ai/context-engineering/07-compress-and-isolate/l8-isolation-patterns) |
| hardcoded context | A fact written into a prompt as fixed text, such as a price or a policy, that goes stale when the real fact changes. | [9.9](/notes/ai/context-engineering/09-production/l9-seven-anti-patterns) |
| heuristic | A rule of judgment that applies to a class of situations, not to one exact case. | [3.2](/notes/ai/context-engineering/03-system-layer/l2-the-right-altitude) |
| hierarchical chunking | Keeping chunks at several levels, for example small child chunks for search and their larger parent sections for the prompt. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| hierarchical compression | Compression that keeps a different share of each item, by importance tier, instead of keeping or removing it whole. | [7.4](/notes/ai/context-engineering/07-compress-and-isolate/l4-priority-trimming-and-hierarchical-compression) |
| high-signal tokens | Tokens that change the answer toward the desired outcome. Anthropic's principle asks for the smallest set of them. | [2.1](/notes/ai/context-engineering/02-paradigm-shift/l1-from-prompts-to-context-engineering) |
| hit rate@k | The share of questions with at least one relevant chunk in the top $k$. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| HNSW | Hierarchical navigable small world: an ANN index that links each vector to near neighbors in a stack of graph layers. A search moves greedily from the top layer down. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| hook | A user-defined shell command that the harness runs at a fixed point, for example before a tool call. It can block the action. | [3.5](/notes/ai/context-engineering/03-system-layer/l5-rules-files) |
| hook event | A named lifecycle point where hooks run, for example `PreToolUse` or `Stop`. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| host | The AI application that the user runs, for example Claude Desktop, an IDE or your agent. It creates and manages MCP clients. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| hot tier | Memory that the application sends on every call without a lookup: core rules, pinned facts and the recent turns. | [8.4](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers) |
| hybrid retrieval | Running a dense retriever and a sparse retriever for the same query and merging their results into one list. | [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) |
| hybrid strategy | Loading some content up front for speed and leaving the rest for the model to load on demand. | [5.7](/notes/ai/context-engineering/05-retrieval-quality/l7-just-in-time-retrieval) |
| HyDE | Hypothetical Document Embeddings: an LLM writes a hypothetical answer, and the system retrieves real documents that are similar to it (Gao et al., 2023). | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |
| hypothetical document | The text that the LLM writes in HyDE. It is used only as a search key, never as a source of facts. | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |
| hysteresis | Using a target below the trigger, so that the system does not switch on and off at every step. | [7.5](/notes/ai/context-engineering/07-compress-and-isolate/l5-when-to-compress) |

## I

| Term | Plain meaning | First seen |
|---|---|---|
| idempotency key | A unique value sent with a request so that the server can detect a repeat and return the first result instead of acting again. | [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) |
| idempotent | An operation that has the same effect when it runs once or many times with the same input. | [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) |
| identity (role) | The part of a system prompt that says who the model is for this application: its job, its expertise and its tone. | [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt) |
| implementation blueprint | The exact files to create or change, their order and the key logic of each. | [9.3](/notes/ai/context-engineering/09-production/l3-the-prp-workflow) |
| implicit decision | A choice that an action makes without stating it, for example a style or an assumption inside generated code. | [7.7](/notes/ai/context-engineering/07-compress-and-isolate/l7-isolate-one-window-is-not-enough) |
| import (in CLAUDE.md) | A line `@path/to/file` that loads another file into context together with the CLAUDE.md. | [9.2](/notes/ai/context-engineering/09-production/l2-the-project-files) |
| import (`@path`) | A line in CLAUDE.md that inserts the text of another file. | [3.5](/notes/ai/context-engineering/03-system-layer/l5-rules-files) |
| importance score | A number that says how much a memory matters, independent of the current query. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| in-context learning (ICL) | A model doing a new task from instructions and demonstrations in its input, with no change to its weights. | [3.7](/notes/ai/context-engineering/03-system-layer/l7-atomic-and-molecular-prompts) |
| incremental sync | Updating an index by processing only new, changed and deleted documents. | [4.4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) |
| indexing phase | The offline part of a RAG pipeline: ingest, chunk, embed and store. It runs before the queries, and again when documents change. | [4.4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) |
| indirect prompt injection | A prompt injection hidden in external content that the model reads, such as a web page, a file, an email or a tool result. | [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) |
| inference call | One request to the model and its one response. | [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) |
| inference time | The time when a trained model runs to answer a request. Context engineering works at inference time. | [4.1](/notes/ai/context-engineering/04-write-and-rag/l1-four-strategies) |
| information retention ratio (IRR) | Key facts that can still be recovered after compression, divided by key facts before compression. | [7.10](/notes/ai/context-engineering/07-compress-and-isolate/l10-measure-compression) |
| ingestion | Loading raw documents, converting them to clean text and attaching metadata. | [4.4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) |
| INITIAL.md | A feature spec for the current task. It is replaced for each new feature. | [9.2](/notes/ai/context-engineering/09-production/l2-the-project-files) |
| input distribution | The kind of inputs that a task receives: their topic, length and style. | [3.7](/notes/ai/context-engineering/03-system-layer/l7-atomic-and-molecular-prompts) |
| input (prompt) | The tokens that the application sends to the model on one call. | [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) |
| input-output pair | A demonstration that shows one input and its desired output, with no reasoning in between. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| instruction chain | The rules files from several directory levels, joined in order from the root to the working directory. | [3.5](/notes/ai/context-engineering/03-system-layer/l5-rules-files) |
| instruction conflict | Two rules in the same context that ask for different actions on the same input. | [9.9](/notes/ai/context-engineering/09-production/l9-seven-anti-patterns) |
| instruction drift | Contradictory instructions collect in the window, for example "answer in JSON" and later "answer in Markdown". | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| instruction hierarchy | A trained behavior: when instructions conflict, the model follows the source with more authority, for example the developer over the user. | [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt) |
| instruction registry | A version-controlled list of every instruction rule, with its owner, its purpose and the rules it interacts with. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| integration test | A test that runs several parts together, for example the real service called through HTTP. | [9.4](/notes/ai/context-engineering/09-production/l4-validation-loops) |
| interaction effect | The effect of two parts together differs from the sum of their separate effects. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| invariant | A requirement that must hold exactly in every case, for example a legal limit or a security rule. | [3.2](/notes/ai/context-engineering/03-system-layer/l2-the-right-altitude) |
| inverse document frequency (IDF) | A weight that is high for rare terms and close to 0 for terms that almost every document contains. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| inverted file index (IVF) | An ANN index that groups the vectors into cells around centroids and searches only the cells nearest to the query. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| inverted index | A map from each term to the list of documents that contain it, with the count in each document. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| inverted U | A curve that rises to one peak and then falls. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| `isError` | The MCP field in a tool result that marks the result as a tool error. Anthropic uses `is_error` in a `tool_result` block. | [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) |
| ISOLATE | A context strategy: split the context across separate windows, for example across sub-agents, so that each window holds one focused part of the task. | [4.1](/notes/ai/context-engineering/04-write-and-rag/l1-four-strategies) |
| iterative retrieval | Retrieval in several rounds, where each round uses what the earlier rounds found. | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |

## J

| Term | Plain meaning | First seen |
|---|---|---|
| jitter | A random part of the wait time. It stops many clients from retrying at the same moment. | [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) |
| JSON Schema | A standard JSON format that describes the allowed shape of JSON data: types, fields, required fields and allowed values. | [6.3](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs) |
| JSON-RPC 2.0 | A small standard for remote procedure calls in JSON: requests with an ID, responses with the same ID, and notifications with no ID. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| just-in-time instructions (JIT instructions) | Guidance for a tool that the tool returns together with its data, at the moment the model needs it, instead of in the system prompt. | [6.5](/notes/ai/context-engineering/06-tools-and-mcp/l5-many-tools) |
| just-in-time (JIT) instruction | Guidance that the application returns together with a tool's result, so that it enters the context only when that tool runs. | [9.9](/notes/ai/context-engineering/09-production/l9-seven-anti-patterns) |
| just-in-time (JIT) retrieval | The model keeps references to content and loads the content with tools only when a step needs it. | [5.7](/notes/ai/context-engineering/05-retrieval-quality/l7-just-in-time-retrieval) |

## K

| Term | Plain meaning | First seen |
|---|---|---|
| $k_1$ | The BM25 parameter that controls how fast extra repeats of a term stop adding to the score. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| keep window | The most recent turns that compaction keeps verbatim. | [7.2](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction) |
| kernel process | In Karpathy's version, the role of the LLM itself: the central process that coordinates memory, tools and input and output. | [2.2](/notes/ai/context-engineering/02-paradigm-shift/l2-the-llm-os-model) |
| key files | The files that the agent must read before it changes anything in an area. | [9.2](/notes/ai/context-engineering/09-production/l2-the-project-files) |
| key-fact block | A short, structured list of the facts of this conversation, kept up to date by the application. | [2.6](/notes/ai/context-engineering/02-paradigm-shift/l6-the-context-audit) |
| key-fact checklist | A list of facts from the original content, written before compression, used to measure IRR. | [7.10](/notes/ai/context-engineering/07-compress-and-isolate/l10-measure-compression) |
| key-value extraction | A memory strategy that uses an LLM to pull discrete facts from the conversation into structured fields, such as JSON keys. | [8.5](/notes/ai/context-engineering/08-memory/l5-five-management-strategies) |
| k-means | A clustering method that places a chosen number of centroids and assigns each vector to its nearest centroid, in repeated rounds. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| knapsack problem | The problem of choosing items with sizes and values so that the total value is highest and the total size stays within a limit. | [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) |
| k-nearest-neighbor search (k-NN) | Finding the $k$ stored vectors that are nearest to a query vector. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| knowledge base | The set of documents that a RAG system can retrieve from, for example manuals, policies and articles. | [4.3](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval) |
| knowledge conflict | The window says one thing and the weights say another. Which one the model follows is not predictable. | [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches) |
| knowledge graph | A store of facts as nodes (entities) and edges (relationships) that a query can traverse. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| knowledge section | Background facts in a system prompt that every call needs and that the weights do not hold, for example the company's stack or policy. | [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt) |
| known risk | A trap identified during planning, with its likelihood and a mitigation. | [9.3](/notes/ai/context-engineering/09-production/l3-the-prp-workflow) |
| k-shot | A prompt with exactly k demonstrations, for example 3-shot. | [3.7](/notes/ai/context-engineering/03-system-layer/l7-atomic-and-molecular-prompts) |
| KV cache | The stored keys and values of all earlier tokens. Decode reads it instead of recomputing it. | [1.4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) |

## L

| Term | Plain meaning | First seen |
|---|---|---|
| L2 norm | The length of a vector: the square root of the sum of its squared values. | [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| label space | The set of possible outputs of a classification task, for example POSITIVE, NEGATIVE and NEUTRAL. | [3.7](/notes/ai/context-engineering/03-system-layer/l7-atomic-and-molecular-prompts) |
| labeled set | A fixed set of test questions, each with the IDs of the chunks that answer it and often a reference answer. Also called a golden set. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| $\lambda$ (lambda) | The MMR weight between relevance and diversity, from 0 to 1. 1 gives the plain relevance ranking. 0 gives maximal diversity. | [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) |
| `lambda_mult` | LangChain's name for $\lambda$ in MMR search. | [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) |
| last known good (LKG) | The most recent version that passed the full suite and worked in production. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| last-write-wins | A conflict rule: a new value replaces the old one, and the old value is lost. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| late interaction | A design that stores one vector per document token and compares query tokens with document tokens only at query time. | [5.3](/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers) |
| latency budget | The maximum time that a step may add to a request, set by design. | [8.4](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers) |
| learned retrieval | Ranking memories with a model trained on usage data, such as which injected memories the agent used. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| least privilege | Each tool and each credential gets only the permissions that its task needs. | [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) |
| length effect | Accuracy drops when the input gets **longer**, even when the task stays the same. | [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) |
| lethal trifecta | Simon Willison's name for an agent that combines access to private data, exposure to untrusted content and the ability to communicate externally. | [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) |
| level of detail | How much of a source enters the window: the full text, an extract, a summary or only a pointer. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| lexical retrieval | Retrieval that matches the exact words (terms) of the query against the words of the documents. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| lifespan | How long a saved item stays useful: minutes for a scratchpad, months for a memory, years for a file. | [4.2](/notes/ai/context-engineering/04-write-and-rag/l2-write-scratchpads-memories-files) |
| lifespan (of a layer) | How long the content of a layer stays valid before it must change. | [3.6](/notes/ai/context-engineering/03-system-layer/l6-the-context-stack) |
| lightweight identifier | A short reference such as a file path, a query or a link, which a tool can resolve to the full content later. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| linear growth | Growth by the same amount at each step. | [1.6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation) |
| linter | A tool that finds likely bugs and style problems by rules. Examples: Ruff for Python, ESLint for JavaScript and TypeScript. | [9.4](/notes/ai/context-engineering/09-production/l4-validation-loops) |
| LLM OS | Karpathy's analogy (2023) that treats a language model as the core of a new operating system, with the context window as RAM. | [2.2](/notes/ai/context-engineering/02-paradigm-shift/l2-the-llm-os-model) |
| LLM-as-judge | Using an LLM to grade answers or to check claims against context. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| LOCOMO | A benchmark of long multi-session conversations with questions about earlier sessions, used to compare memory systems. | [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent) |
| long-term memory | Information about a user or a task that an application keeps across sessions, for example a user preference. | [4.2](/notes/ai/context-engineering/04-write-and-rag/l2-write-scratchpads-memories-files) |
| loop guard | A rule in the orchestration code that stops an agent loop: a maximum number of iterations, a token budget, or a repeated-call check. | [6.6](/notes/ai/context-engineering/06-tools-and-mcp/l6-execution-patterns-and-react) |
| lossless compression | Compression that removes only redundancy, so the original can be rebuilt exactly. | [7.1](/notes/ai/context-engineering/07-compress-and-isolate/l1-why-compress) |
| lossy compression | Compression that removes some information, so the original cannot be rebuilt exactly. | [7.1](/notes/ai/context-engineering/07-compress-and-isolate/l1-why-compress) |
| lost in the middle | The position effect found by Liu et al.: accuracy is highest at the start or end, and lowest in the middle. | [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) |

## M

| Term | Plain meaning | First seen |
|---|---|---|
| main context | MemGPT's name for the content inside the window: system instructions, working context and a queue of recent messages. | [2.2](/notes/ai/context-engineering/02-paradigm-shift/l2-the-llm-os-model) |
| majority label bias | The tendency of a model to predict the label that appears most often in the examples. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| managed policy file | A rules file that an organization installs on a machine, so that it applies to every user of that machine. | [3.5](/notes/ai/context-engineering/03-system-layer/l5-rules-files) |
| manifest | A table that records, for each source document, its hash, its chunk IDs and when it was indexed. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| many-shot in-context learning | In-context learning with hundreds or thousands of examples in the prompt. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| marginal gain per token | The accuracy gain from one added item, divided by its token count. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| marginal relevance | The value that one more chunk adds, given the chunks already chosen. | [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) |
| Markdown header | A line such as `# Rules` that starts a section. The section ends at the next header. | [3.3](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order) |
| match rate | The share of cases in a GTX that pass. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| Matryoshka representation learning (MRL) | Training an embedding model so that the first part of each vector is itself a usable, shorter embedding. | [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| Maximal Marginal Relevance (MMR) | A selection method that adds chunks one at a time. Each time, it chooses the chunk with the best balance of relevance to the query and difference from the chunks already chosen. | [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) |
| MaxSim | The ColBERT score: for each query token, take its highest similarity with any document token, then add these maximums. | [5.3](/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers) |
| `max_tokens` | The largest number of output tokens that the application allows on one call. | [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) |
| MCP client | A connector inside the host. Each client holds a 1:1 connection with one MCP server. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| MCP Inspector | A developer tool that connects to an MCP server, lists its tools, resources and prompts, and calls them by hand. | [6.8](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) |
| MCP Python SDK | The official Python package `mcp` for MCP servers and clients. Version 2 is the current line. | [6.8](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) |
| MCP scope (Claude Code) | Where Claude Code stores an MCP server entry: `local` (default), `project` (shared `.mcp.json`) or `user` (all projects). | [6.8](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) |
| MCP server | A program that offers tools, resources or prompts to clients over MCP. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| `MCPServer` | The high-level server class of the Python SDK v2. It was called `FastMCP` in v1. | [6.8](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) |
| MemGPT | A 2023 research system (Packer et al.) that manages an LLM's window like an operating system manages memory, with the model calling memory functions. | [2.2](/notes/ai/context-engineering/02-paradigm-shift/l2-the-llm-os-model) |
| memory budget | The maximum number of tokens that the application allows for injected memories on one call. | [8.1](/notes/ai/context-engineering/08-memory/l1-stateless-models-stateful-apps) |
| memory confidence | A label from the extraction model that says how sure it is about a fact. It is not a measured probability. | [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent) |
| memory hallucination | A false memory: the model refers to a past event that did not happen, or extraction stores a fact that the user did not state. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| memory injection | The step that puts selected memories into the input of a call, for example into the system prompt or the last user message. | [8.1](/notes/ai/context-engineering/08-memory/l1-stateless-models-stateful-apps) |
| memory leak | Memory that a program keeps but no longer needs. In the analogy: old tokens that the application keeps sending. | [2.2](/notes/ai/context-engineering/02-paradigm-shift/l2-the-llm-os-model) |
| memory (LLM application) | Information from past interactions that the application stores and selects into the context of later calls. The model itself stores nothing between calls. | [8.1](/notes/ai/context-engineering/08-memory/l1-stateless-models-stateful-apps) |
| memory miss | An event in which the user refers to something from the past and the system has no matching memory. | [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent) |
| memory poisoning | Untrusted or wrong text that an agent saves to memory, so that it returns to the window on later calls. | [4.2](/notes/ai/context-engineering/04-write-and-rag/l2-write-scratchpads-memories-files) |
| memory precision | The share of injected memories that were relevant to the call. | [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent) |
| memory protection | An operating-system guarantee that one program cannot read or change another program's memory. The context window has no such guarantee. | [2.2](/notes/ai/context-engineering/02-paradigm-shift/l2-the-llm-os-model) |
| memory stream | In Generative Agents, the full list of an agent's memories, each with a creation time and a last-access time. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| memory tier | A class of memory storage defined by how memories reach the context window and how long they live. | [8.4](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers) |
| memory tool | A tool that lets the model itself read and write memory files or blocks, for example Anthropic's `memory` tool. | [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent) |
| memory-bound | Limited by memory-read speed. Decode is usually memory-bound. | [1.4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) |
| merge rule | One learned step of BPE: "replace the pair A, B with the new symbol AB". | [1.2](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers) |
| messages array | The ordered list of turns that the application sends: who said what, in order. | [1.3](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) |
| metadata | Fields stored with each chunk, such as the source file, the section, the date and the access group. | [4.4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) |
| metadata enrichment | Adding the title, section heading and other metadata to the chunk text at indexing time, so that the search can match them. | [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) |
| metadata filter | A condition on stored fields, for example a tenant ID or a date, that a result must meet. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| minimal prompt | The shortest prompt that states the task, used as the starting point for iteration. | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| minimum detectable effect | The smallest real difference that a test is designed to detect. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| minimum viable context | The smallest context that gives a correct answer on a test set. You start there and add content only when a measurement justifies it. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| min-max normalization | Score normalization that maps the lowest score of a list to 0 and the highest to 1. | [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) |
| misbehaving agent | An agent that completes a task wrongly and sounds confident, so no error appears. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| missing examples | The anti-pattern of giving no example of the expected output or code pattern, so the model invents one. | [9.9](/notes/ai/context-engineering/09-production/l9-seven-anti-patterns) |
| mock tool | A fake tool implementation that returns fixed results, so a replay is repeatable and costs nothing outside the model call. | [2.6](/notes/ai/context-engineering/02-paradigm-shift/l6-the-context-audit) |
| Model Context Protocol (MCP) | An open protocol that standardizes how AI applications connect to servers that offer tools, resources and prompts. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| model routing | Sending each request to the cheapest model that can handle it, with a rule or a classifier. | [9.8](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency) |
| molecular prompt (molecule) | A prompt with four parts: an instruction, examples, context for this request and the new input. | [3.7](/notes/ai/context-engineering/03-system-layer/l7-atomic-and-molecular-prompts) |
| MRR | Mean reciprocal rank: the average of the reciprocal ranks over all questions. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| MTEB | The Massive Text Embedding Benchmark: a public set of tasks and a leaderboard for comparing embedding models. | [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| MTok | One million tokens. Prices are in USD per MTok. | [1.6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation) |
| multi-agent system | A system in which several model instances, each with its own context, work on one task. | [7.7](/notes/ai/context-engineering/07-compress-and-isolate/l7-isolate-one-window-is-not-enough) |
| multi-hop question | A question whose answer needs two or more facts, where finding one fact needs another fact first. | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |
| multimodal RAG | RAG over content that is not plain text, such as images, tables, audio or video. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| multi-query retrieval | An LLM writes several variants of the query. The system retrieves for each variant and merges the results. | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |
| multi-tenancy | One system that serves several customers (tenants), each of whom must see only their own data. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| multi-tenant RAG | One RAG system that serves several customers or groups, each of which may see only its own documents. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |

## N

| Term | Plain meaning | First seen |
|---|---|---|
| namespacing | Giving related tools a common prefix by service or resource, for example `asana_search` and `jira_search`. | [6.3](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs) |
| nDCG | Normalized DCG: the DCG divided by the DCG of the ideal order, so the best possible value is 1. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| near-duplicate | A chunk whose text or embedding is almost the same as another chunk. | [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) |
| needle in a haystack (NIAH) | A test that hides one fact (the needle) in long filler text (the haystack) and asks for it. | [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) |
| next-token prediction | The model computes a probability for every token in its vocabulary. The next token comes from that distribution. | [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) |
| nlist | The number of cells in an IVF index. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| node input schema | The part of the state that one LangGraph node receives. By default, it is the whole state schema. | [7.8](/notes/ai/context-engineering/07-compress-and-isolate/l8-isolation-patterns) |
| non-parametric memory | Knowledge stored outside the model, for example in a document index, and read at inference time. | [4.3](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval) |
| normalization | Dividing a vector by its length, so that it becomes a unit vector with the same direction. | [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| normalized IRR | Facts recovered from the compressed context divided by facts recovered from the full context. | [7.10](/notes/ai/context-engineering/07-compress-and-isolate/l10-measure-compression) |
| notification | A JSON-RPC message with no ID. The receiver must not reply to it. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| nprobe | The number of cells that an IVF search scans for one query. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |

## O

| Term | Plain meaning | First seen |
|---|---|---|
| observation | The result of an action, added to the context before the next thought. | [6.6](/notes/ai/context-engineering/06-tools-and-mcp/l6-execution-patterns-and-react) |
| observed agreement ($p_o$) | The share of items on which two raters give the same label. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| offline adaptation | Improving the playbook on a training set before deployment, sometimes with ground-truth labels. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |
| offloading | Saving a large result, for example a tool output, to storage and keeping only a short reference to it in the window. | [4.2](/notes/ai/context-engineering/04-write-and-rag/l2-write-scratchpads-memories-files) |
| online adaptation | Improving the playbook during use, task by task, from the outcomes the agent sees. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |
| OpenTelemetry (OTel) | An open standard and toolset for traces, metrics and logs, supported by most observability tools. | [9.8](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency) |
| oracle context | The correct chunks, given to the model by hand, to test generation without retrieval errors. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| orchestration code | The application code that sends requests to the model, runs the tools that the model asks for, and sends the results back. | [6.1](/notes/ai/context-engineering/06-tools-and-mcp/l1-tools-are-context) |
| orchestrator (lead agent) | The agent that plans a task, delegates parts of it to sub-agents, and combines their results. | [7.7](/notes/ai/context-engineering/07-compress-and-isolate/l7-isolate-one-window-is-not-enough) |
| orchestrator-worker pattern | A workflow in which a central model breaks a task into parts, delegates them to workers, and combines the results. | [7.7](/notes/ai/context-engineering/07-compress-and-isolate/l7-isolate-one-window-is-not-enough) |
| ordinal scale | A scale whose values have an order but no fixed distance between them, such as a 1–5 rating. | [7.10](/notes/ai/context-engineering/07-compress-and-isolate/l10-measure-compression) |
| `os.path.commonpath` | A Python function that returns the longest common folder path of several paths, by whole path parts. | [6.8](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) |
| output (completion) | The tokens that the model writes on that call. | [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) |
| output format | The part of a prompt that sets the structure of every answer, for example the fields, their order and the length. | [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt) |
| output priming | Writing the first part of the desired output so that the model continues it. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| output reserve | The part of the window kept free for the model's answer, set by `max_tokens`. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| override statement | A sentence in a system prompt that says its rules take priority over any user request to the contrary. | [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt) |
| over-writing | Saving too much, "just in case". It adds noise and stale facts that a later retrieval can return. | [4.2](/notes/ai/context-engineering/04-write-and-rag/l2-write-scratchpads-memories-files) |

## P

| Term | Plain meaning | First seen |
|---|---|---|
| packing | Choosing which ranked chunks go into the retrieval budget. | [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) |
| pagination | Returning a large result one page at a time, with the total count and a way to ask for the next page. | [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) |
| paging | Moving data between slow storage and fast memory when it is needed. In an LLM application: loading content into the window for a call. | [2.2](/notes/ai/context-engineering/02-paradigm-shift/l2-the-llm-os-model) |
| parallel execution | Independent tool calls that run at the same time. The total tool time is the time of the slowest call. | [6.6](/notes/ai/context-engineering/06-tools-and-mcp/l6-execution-patterns-and-react) |
| parallel tool calls | Several tool calls in one model response. The application can run them at the same time and return all the results together. | [6.2](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop) |
| parametric knowledge | What the model knows from its weights, from training. | [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches) |
| parametric memory | Knowledge stored in the weights of a model. Training writes it. | [4.3](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval) |
| parent document | The larger unit that a child chunk belongs to, for example a section or a page. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| parent-child retrieval | Retrieval that matches small child chunks but returns the larger parent chunk or document that contains them. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| Pareto front | The designs that no other design beats on both success and cost at the same time. | [7.10](/notes/ai/context-engineering/07-compress-and-isolate/l10-measure-compression) |
| pass rate | The share of test runs whose output passes its check. | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| path traversal | An attack that uses `..`, absolute paths or links in a file path to read files outside the allowed folder. | [6.8](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) |
| path-scoped rule | A rule that loads only when the agent works on files that match a pattern. | [3.5](/notes/ai/context-engineering/03-system-layer/l5-rules-files) |
| payback point | The number of later calls after which a compaction has saved more than it cost. | [7.2](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction) |
| pending content | Content that the agent has not acted on yet. Examples: a plan before it runs, a diff before it is applied, a number before it is used. | [7.1](/notes/ai/context-engineering/07-compress-and-isolate/l1-why-compress) |
| per-call input | The input tokens of one call. | [1.6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation) |
| percentile (p95) | The value below which 95% of the measurements fall. The p95 latency shows the slow tail that the mean hides. | [9.8](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency) |
| permanent error | An error that a retry with the same input cannot fix, for example "not found" or "permission denied". | [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) |
| pinned memory | A memory that the application keeps in the hot tier for the whole session, whatever the current topic. | [8.4](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers) |
| placeholder note | The short text that replaces a cleared tool result. A good note states the key outcome and how to fetch the data again. | [7.3](/notes/ai/context-engineering/07-compress-and-isolate/l3-tool-result-clearing) |
| plan mode | A Claude Code mode in which Claude reads files and proposes a plan, but makes no edits until you approve. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| planned input | A test input that the prompt author had in mind when writing the instructions. | [3.2](/notes/ai/context-engineering/03-system-layer/l2-the-right-altitude) |
| playbook | An evolving context of strategies, rules and known pitfalls that an agent reads before it works on a task. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |
| policy as code | Computing a policy decision in deterministic code, usually behind a tool, instead of asking the model to reason it out. | [2.6](/notes/ai/context-engineering/02-paradigm-shift/l6-the-context-audit) |
| policy precedence | The rule that says which policy rule wins, or how rules combine, when several apply. | [2.6](/notes/ai/context-engineering/02-paradigm-shift/l6-the-context-audit) |
| position bias | A judge prefers an answer because of its place in the prompt, for example the first of two. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| position effect | Accuracy changes with **where** the relevant information is in the input, with the length fixed. | [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) |
| post-filter | A filter that removes disallowed documents after the search has returned its results. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| post-filtering | Running the vector search first and dropping the results that fail the filter afterwards. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| posting list | The list of documents for one term in an inverted index. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| power law | A relation of the form $y = a x^k$. For positive $x$ it only rises or only falls, so it has no peak. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| power-law decay | Decay in which a value falls as a power of time, such as $t^{-0.5}$. It falls fast at first and then very slowly. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| `PRAGMA query_only` | A SQLite setting that makes a connection refuse every statement that changes the database. | [6.8](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) |
| Precision@k | The share of the top $k$ results that are relevant. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| prefill | The first phase of a call. The model processes all input tokens in parallel and stores their keys and values. | [1.4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) |
| pre-filter | A filter that limits the search to allowed documents before or during the vector search. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| pre-filtering | Restricting the search to the vectors that pass the filter, before or during the vector search. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| prefix | The start of the input, from the first token up to a chosen point. | [1.7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) |
| preservation ratio | The share of an item's tokens that hierarchical compression keeps, for example 100%, 50%, 10% or 0%. | [7.4](/notes/ai/context-engineering/07-compress-and-isolate/l4-priority-trimming-and-hierarchical-compression) |
| PreToolUse hook | A hook that runs before a tool call. With exit code 2 it blocks the call. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| primacy effect | Better use of information at the start of the input. | [3.3](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order) |
| priority ladder | The order of actions when a call is over budget. Remove or compress P3, then compress P2, then touch P1 only in an emergency. Never touch P0. | [7.4](/notes/ai/context-engineering/07-compress-and-isolate/l4-priority-trimming-and-hierarchical-compression) |
| priority level | A label from P0 (never remove) to P3 (remove first) that decides the order in which content is removed or compressed. | [7.4](/notes/ai/context-engineering/07-compress-and-isolate/l4-priority-trimming-and-hierarchical-compression) |
| priority pruning | A memory strategy that gives each message or memory an importance score and drops the lowest scores first. | [8.5](/notes/ai/context-engineering/08-memory/l5-five-management-strategies) |
| private state channel | A state key that some LangGraph nodes declare for their own use, outside the graph's public input and output. | [7.8](/notes/ai/context-engineering/07-compress-and-isolate/l8-isolation-patterns) |
| privileged instruction | An instruction from a source with high authority, such as the system or developer message. | [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt) |
| procedural memory | Long-term memory of how to act: rules, skills, routines and playbooks. Example: "Always include unit tests when you write code." | [8.2](/notes/ai/context-engineering/08-memory/l2-three-kinds-of-memory) |
| progressive disclosure | Showing content in levels, from a list to a summary to the full text, so that the model loads detail only where it needs it. | [5.7](/notes/ai/context-engineering/05-retrieval-quality/l7-just-in-time-retrieval) |
| project scope | A file in the repository's `.claude/` folder. It applies to everyone who works in that repository. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| promotion | Moving a memory to a faster tier, for example loading a stored fact into the current session. | [8.4](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers) |
| prompt bloat | Too many tokens of instructions or tool definitions in the input, which raises cost and can lower accuracy. | [5.7](/notes/ai/context-engineering/05-retrieval-quality/l7-just-in-time-retrieval) |
| prompt caching | The provider stores the processed form of a prompt prefix and reuses it on a later call with the same prefix. | [1.7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) |
| prompt engineering | The craft of writing the text of one instruction or question so that a model does the task well. | [2.1](/notes/ai/context-engineering/02-paradigm-shift/l1-from-prompts-to-context-engineering) |
| prompt injection | Text in the input that tries to change the model's behavior against the developer's intent. It can come from the user (direct) or from documents and tool results (indirect). | [2.2](/notes/ai/context-engineering/02-paradigm-shift/l2-the-llm-os-model) |
| prompt optimizer | A tool that searches for better prompt text or examples against a metric, for example DSPy. | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| prompt template | A fixed prompt text with named slots that the application fills on each request. | [3.3](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order) |
| prompt version | A fixed, named copy of a prompt, stored so that every call can be traced to the exact text it used. | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| provenance | Where a piece of context came from: the source, its version and the date that someone checked it. | [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches) |
| proxy metric | A measurable quantity that represents a quality that you cannot measure directly. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| PRP (Product Requirements Prompt) | A detailed implementation blueprint for one feature, written for an AI agent: goal, context, tasks and validation steps. | [3.6](/notes/ai/context-engineering/03-system-layer/l6-the-context-stack) |
| pull request (PR) | A proposed change to a git repository that other people review before it merges. | [9.1](/notes/ai/context-engineering/09-production/l1-context-is-the-product) |
| pyramid model | A budget rule from the handbook with five tiers: core instructions, critical context, history, auxiliary context, reserve. | [7.6](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets) |

## Q

| Term | Plain meaning | First seen |
|---|---|---|
| quadratic growth | Growth with the square of the number of steps. | [1.6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation) |
| quality curve | A picture of answer quality against the amount of context: it rises, peaks and then falls. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| query decomposition | Splitting a complex question into simpler sub-questions and retrieving for each one. | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |
| query drift | A transformed query that no longer means what the user asked. | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |
| query, key, value (Q, K, V) | Three vectors that each token produces. A query is compared with the keys of other tokens. The scores weight their values. | [1.4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) |
| query phase | The online part of a RAG pipeline: embed the query, retrieve, rerank and generate. It runs on every query. | [4.4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) |
| query rewriting | An LLM turns the latest message, plus the conversation history, into one complete search query. | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |
| query transformation | Any change to the user's query before retrieval, made to get better search results. | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |
| query variant | One of the alternative phrasings in multi-query retrieval. | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |

## R

| Term | Plain meaning | First seen |
|---|---|---|
| RAG-Fusion | Multi-query retrieval with Reciprocal Rank Fusion as the merge step (Rackauckas, 2024). | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |
| rank fusion | Merging several ranked lists by using the positions of the documents, not their scores. | [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) |
| rank, $r(d)$ | The position of document $d$ in one ranked list, starting at 1 for the top result. | [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) |
| RAPTOR | A method that recursively clusters and summarizes chunks into a tree, and retrieves across all levels of the tree (Sarthi et al., ICLR 2024). | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| ReAct | A method in which the model alternates reasoning steps and actions, and reads the result of each action before the next step (Yao et al.). | [6.6](/notes/ai/context-engineering/06-tools-and-mcp/l6-execution-patterns-and-react) |
| read path | The part of a memory or retrieval system that selects stored items and puts them into the context of a call. | [8.1](/notes/ai/context-engineering/08-memory/l1-stateless-models-stateful-apps) |
| read-only connection | A database connection that cannot write. In SQLite, open the file with the URI option `mode=ro`. | [6.8](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) |
| read-your-writes | The guarantee that a read returns a value that the same user wrote just before. | [8.4](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers) |
| recall ceiling | The limit that the first stage sets: if a relevant chunk is not in the candidate set, reranking cannot recover it. | [5.3](/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers) |
| Recall@k | The share of the relevant chunks of a question that appear in the top $k$ results. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| recency bias | The tendency of a model to repeat answers that appear near the end of the prompt. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| recency effect | Better use of information at the end of the input. | [3.3](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order) |
| recency score | A number that falls as time passes since a memory was last used. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| reciprocal rank | 1 divided by the rank of the first relevant result, or 0 if no result is relevant. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| Reciprocal Rank Fusion (RRF) | A rank-fusion method that gives each document the sum of $1/(k + r)$ over all lists where it appears. | [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) |
| recoverable compression | Lossy compression where the removed content can be fetched again, for example by running the same tool call. | [7.1](/notes/ai/context-engineering/07-compress-and-isolate/l1-why-compress) |
| recursive execution | A loop that calls the same kind of tool again with a refined input, until a condition or a maximum depth is reached. | [6.6](/notes/ai/context-engineering/06-tools-and-mcp/l6-execution-patterns-and-react) |
| recursive splitting | Splitting with an ordered list of separators, for example paragraphs, then lines, then words. The next separator is used only for pieces that are still too long. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| redundancy | Several retrieved chunks carry the same information, so they use tokens without adding facts. | [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) |
| reference | A short pointer to stored content, such as a file path, a URL or an ID. It stays in the window in place of the content. | [4.2](/notes/ai/context-engineering/04-write-and-rag/l2-write-scratchpads-memories-files) |
| reflection (Generative Agents) | A step that asks the model to write higher-level conclusions from recent memories and stores them as new memories. | [8.2](/notes/ai/context-engineering/08-memory/l2-three-kinds-of-memory) |
| Reflector | The ACE role that reads trajectories and outcomes and distills concrete lessons from successes and errors. | [8.7](/notes/ai/context-engineering/08-memory/l7-ace-self-improving-context) |
| regression | A test that passed with the old prompt version and fails with the new one. | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| regression list | The cases that passed on the base version and fail on the new version. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| relevance label | The judgment that a chunk is relevant to a question, either yes/no or a grade. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| relevance score | A number that says how well a memory matches the current query. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| removal unit | A group of items that must be kept or removed together, for example a tool call and its result. | [7.4](/notes/ai/context-engineering/07-compress-and-isolate/l4-priority-trimming-and-hierarchical-compression) |
| replay | Running the same user turns again against a changed context, to compare the answers. | [2.6](/notes/ai/context-engineering/02-paradigm-shift/l6-the-context-audit) |
| `required` | The JSON Schema keyword that lists the properties that must be present. Properties are optional by default. | [6.3](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs) |
| required element | A fact or phrase that a correct answer must contain, often written as a pattern with alternatives. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| required status check | A CI check that must pass before a pull request can merge into a protected branch. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| reranker | The model that does the reranking, usually a cross-encoder. | [5.3](/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers) |
| reranking | A second scoring step that reorders the retrieved candidates with a slower, more exact model. | [4.4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) |
| reserve | Tokens kept free on a call: room for the output plus a safety buffer. | [7.6](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets) |
| residual compression | The ColBERTv2 method that stores each token vector as a nearby centroid plus a small, compressed difference. | [5.3](/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers) |
| response quality per token (RQPT) | The handbook's ratio of a quality score (1–5 or a judge score) to the tokens used for that response. | [7.10](/notes/ai/context-engineering/07-compress-and-isolate/l10-measure-compression) |
| retention score | The share of test questions about earlier facts that the model still answers correctly from the compressed context. | [8.5](/notes/ai/context-engineering/08-memory/l5-five-management-strategies) |
| retrieval failure rate | The share of relevant documents that are not in the top $k$ results. It equals 1 − Recall@k. | [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) |
| retrieval tool | A tool that the model can call to search a knowledge base, for example `search_docs(query, k)`. | [5.7](/notes/ai/context-engineering/05-retrieval-quality/l7-just-in-time-retrieval) |
| retrieval-augmented generation (RAG) | A design where the application retrieves relevant documents for each query and puts them into the context window, so that the model answers from them. | [4.3](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval) |
| retrieved knowledge | Documents, records or search results that the application fetches and places in the window for this request. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| retrieve-once RAG | The classic pipeline: one retrieval with the user's question, then one model call. | [5.7](/notes/ai/context-engineering/05-retrieval-quality/l7-just-in-time-retrieval) |
| retriever | The part of a RAG system that finds the relevant documents or chunks for a query. | [4.3](/notes/ai/context-engineering/04-write-and-rag/l3-why-retrieval) |
| retry with backoff | Repeating a failed call after a wait that grows with each attempt. | [7.9](/notes/ai/context-engineering/07-compress-and-isolate/l9-contract-first-design) |
| review gate | A step where a human must approve an artifact before the next phase starts. | [9.3](/notes/ai/context-engineering/09-production/l3-the-prp-workflow) |
| reward hacking | A system raises its score by a shortcut that does not do the task. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| right to erasure | The right of a person under GDPR Article 17 to have their personal data deleted on certain grounds. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| RLHF | Reinforcement learning from human feedback: training that moves a model toward the answers that human raters prefer. | [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt) |
| role | The label of a message: `user`, `assistant`, and on some APIs `system`, `developer` or `tool`. | [1.3](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) |
| rollback | Switching production back to an earlier version, usually the last known good one. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| rolling summarization | A memory strategy that keeps one running summary of older turns and updates it with an LLM call as turns leave the window. | [8.5](/notes/ai/context-engineering/08-memory/l5-five-management-strategies) |
| rolling summary | One summary that is updated at each compaction. It includes the previous summary and the turns since then. | [7.2](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction) |
| routing | A first step, by rules or a small model, that chooses a group of tools or a sub-agent for the request. | [6.5](/notes/ai/context-engineering/06-tools-and-mcp/l5-many-tools) |
| row-level security | A database feature, for example in PostgreSQL, that filters rows by a policy on every query, whatever the application code asks for. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| RRF constant $k$ | The number added to every rank in RRF. A larger $k$ makes the top ranks count less compared with lower ranks. | [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) |
| rubric | A list of criteria with points, used to score an output. | [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches) |
| rule ablation | Removing one rule at a time and running the eval suite again, to measure what each rule contributes. | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| rule (constraint) | An instruction that says what the model must do or must not do. | [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt) |
| rules file | A Markdown file in a repository or a user folder that an agent tool loads into the model's context. It tells the model the project's conventions. | [3.5](/notes/ai/context-engineering/03-system-layer/l5-rules-files) |
| run | LangSmith's name for a span: "A run represents a single unit of work". | [9.8](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency) |
| run-time context | The context that the model inside your product reads on each user call, for example the system prompt and tool results. | [9.1](/notes/ai/context-engineering/09-production/l1-context-is-the-product) |

## S

| Term | Plain meaning | First seen |
|---|---|---|
| safe split point | A place in the message list where a cut does not separate a tool call from its result and does not break the role order. | [7.2](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction) |
| sandbox | An isolated execution environment, such as a container or a small virtual machine, where agent-written code runs. | [7.8](/notes/ai/context-engineering/07-compress-and-isolate/l8-isolation-patterns) |
| sandbox isolation | Keeping large objects, such as data frames, inside a sandbox and sending only short text results into the context window. | [7.8](/notes/ai/context-engineering/07-compress-and-isolate/l8-isolation-patterns) |
| schema validation | Checking a piece of data against a schema, and rejecting it with a list of errors if it does not match. | [7.9](/notes/ai/context-engineering/07-compress-and-isolate/l9-contract-first-design) |
| score normalization | Rescaling the scores of one retriever to a common range, for example 0 to 1, before they are combined. | [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) |
| scratchpad | A place where an agent writes notes or a plan during a task, so that later steps can use them. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| search unit | Cohere's billing unit for reranking: one query with up to 100 documents. | [5.3](/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers) |
| security boundary | The line between what the model writes (a request) and what the application executes (an action). The application decides what crosses it. | [6.2](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop) |
| SELECT | A context strategy: pull relevant information from outside the context window into it. | [4.1](/notes/ai/context-engineering/04-write-and-rag/l1-four-strategies) |
| selected set $S$ | The chunks that MMR has already chosen. | [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) |
| self-attention | The layer where each token computes how much to use every other visible token. | [1.4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) |
| self-enhancement bias | A judge prefers answers that its own model family wrote. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| semantic chunking | Cutting where the topic changes, which an embedding model or an LLM detects. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| semantic conventions | Standard names for span attributes, so that different tools read the same data the same way. | [9.8](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency) |
| semantic memory | Long-term memory of facts and knowledge without the event in which they were learned. Example: "The user's team uses AWS." | [8.2](/notes/ai/context-engineering/08-memory/l2-three-kinds-of-memory) |
| semantic prior | What a model already associates with a word or a label from training, for example that "positive" means good. | [3.7](/notes/ai/context-engineering/03-system-layer/l7-atomic-and-molecular-prompts) |
| semantic similarity | A score from the cosine similarity of the embeddings of two texts. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| semantic versioning | Version numbers in the form major.minor.patch, where each part says how large the change is. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| sentence-aware chunking | Cutting only between sentences, and filling each chunk with whole sentences up to the size limit. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| separator | A string where a splitter may cut, for example a blank line. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| sequential execution | Tool calls that run one after another, because each call needs the result of the one before. | [6.6](/notes/ai/context-engineering/06-tools-and-mcp/l6-execution-patterns-and-react) |
| server primitive | One of the three things a server offers: tools (model-controlled), resources (application-controlled) and prompts (user-controlled). | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| `server/discover` | The 2026-07-28 method that returns a server's capabilities and instructions. A client may call it first. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| server-side conversation state | A provider feature that stores earlier turns, so the application can send only the new turn. | [1.3](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) |
| session | One continuous conversation or task run. A new session starts with an empty message list. | [8.1](/notes/ai/context-engineering/08-memory/l1-stateless-models-stateful-apps) |
| session cache | Fast storage for one user's session data, such as process memory or Redis, usually with an expiry time. | [8.4](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers) |
| shadow mode | Running a new pipeline next to the production pipeline on real traffic, logging its results, and not showing them to users. | [5.8](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval) |
| shared contract | An agreed interface, for example an API schema, that two services or two PRPs both follow. | [9.3](/notes/ai/context-engineering/09-production/l3-the-prp-workflow) |
| side effect | A change in the world that a tool makes, for example a sent email, a new record or a deleted file. | [6.1](/notes/ai/context-engineering/06-tools-and-mcp/l1-tools-are-context) |
| similarity threshold | A minimum similarity, or a maximum distance, that a chunk must meet to be used. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| single-threaded agent | One agent that does all steps of a task in one continuous context. | [7.7](/notes/ai/context-engineering/07-compress-and-isolate/l7-isolate-one-window-is-not-enough) |
| skill | A folder with a `SKILL.md` file that defines a workflow. It creates the command `/name`, and Claude can also use it when its description matches the task. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| skip packing | Packing that skips a chunk that does not fit and tries the next one. | [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) |
| slash command | A workflow that you start by typing `/name` in Claude Code. Its file holds instructions that Claude reads as a prompt. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| slot (placeholder) | A named gap in a prompt template, for example `{{company_name}}`, that the application replaces with a value. | [3.3](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order) |
| smoke suite | A small, fast set of evaluation cases that runs on every pull request to catch large breaks. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| solvability test | The question "with only what is in the window and the available tools, could a competent person do this task?" If the answer is no, the failure is a context problem. | [2.1](/notes/ai/context-engineering/02-paradigm-shift/l1-from-prompts-to-context-engineering) |
| source label | A short tag around each chunk, with an ID and its source, so that the model can name the source of a fact. | [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) |
| span | One timed unit of work inside a trace, such as one model call or one tool call, with attributes. | [9.8](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency) |
| span attribute | A key and a value stored on a span, for example `gen_ai.usage.output_tokens` = 450. | [9.8](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency) |
| sparse retrieval | Another name for lexical retrieval. A document is a vector with one slot for each word of the vocabulary, and almost all slots are 0. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| spec revision | A version of the MCP specification, named by its release date, for example 2026-07-28. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| special token | A token with a control job, for example the end of a turn. Users do not type it. | [1.2](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers) |
| specialization | A narrower rule that refines a general default for one tool or case, instead of contradicting it. | [9.9](/notes/ai/context-engineering/09-production/l9-seven-anti-patterns) |
| specification (spec) | A written description of what to build, with requirements that a reader can check one by one. | [9.1](/notes/ai/context-engineering/09-production/l1-context-is-the-product) |
| specificity test | The question "Could the agent misinterpret this requirement?" asked for each requirement, until the answer is no. | [9.2](/notes/ai/context-engineering/09-production/l2-the-project-files) |
| SQLite authorizer | A callback, set with `connection.set_authorizer()`, that SQLite calls for each action of a statement. It can deny actions such as `ATTACH` or `PRAGMA`. | [6.8](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) |
| SQLITE_BUSY | The SQLite error code for "database is locked": another connection holds the write lock. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| squared L2 distance | The Euclidean distance squared. It is Chroma's default distance. | [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| stability tier | A label for how long a memory should stay useful: eternal, stable, evolving or experimental. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| stale context | Old, wrong or conflicting text in the window, for example an old tool result or an instruction that a later turn replaced. | [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) |
| standalone query | A query that makes sense without the conversation history. | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |
| standard error (SE) | A measure of how much an accuracy measured on a sample of questions would vary from sample to sample. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| state and memory | Facts about the user, the task or the session that the application keeps outside the model and loads when needed. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| state schema | The typed definition of the shared state of a LangGraph graph: its keys and their types. | [7.8](/notes/ai/context-engineering/07-compress-and-isolate/l8-isolation-patterns) |
| stateless | The server keeps no memory of earlier calls. Each call must carry everything that the model needs. | [1.3](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) |
| static check | A check that reads the code without running it, such as a type check or a lint. | [9.4](/notes/ai/context-engineering/09-production/l4-validation-loops) |
| static selection | Using the same examples on every call. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| statistical power | The probability that a test detects a real difference of a given size. 80% is a common choice. | [9.7](/notes/ai/context-engineering/09-production/l7-evals-in-ci-and-versioning) |
| stdio transport | The host starts the server as a subprocess and exchanges newline-delimited messages over its standard input and output. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| stemming | Cutting a word to a common root, so that "validated" and "validation" can match. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| Stop hook | A hook that runs when Claude is about to end its turn. With exit code 2 it makes Claude continue. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| stop reason | The field in a response that says why the model stopped writing. | [1.3](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) |
| stop word | A very frequent word such as "the" or "is" that some analyzers remove. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| storage factor | The total size of all chunks divided by the size of the original text. Overlap makes it larger than 1. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| Streamable HTTP | The HTTP transport of MCP: one endpoint that accepts POST and replies with one JSON object or a stream of events for that request. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| strict mode | A tool setting (`strict: true`) that applies constrained decoding to the tool's arguments. | [6.3](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs) |
| stride | The distance between the starts of two neighboring chunks: chunk size minus overlap. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| structural chunking | Cutting at the structure of the document: sections, headers, paragraphs, code blocks. Recursive splitting is the common method. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| structured intake | Asking for required fields, such as the order number, at the start of a conversation. | [2.6](/notes/ai/context-engineering/02-paradigm-shift/l6-the-context-audit) |
| structured note-taking | Writing notes in a fixed form, with headings such as objective, progress and decisions, so that a later step can find and update one part. | [4.2](/notes/ai/context-engineering/04-write-and-rag/l2-write-scratchpads-memories-files) |
| structured outputs | An API feature that forces the model's output to match a given JSON schema. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| structured summary | A summary with fixed sections, such as decisions, constraints, open items and exact identifiers. | [7.2](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction) |
| sub-agent | A model call or agent loop with its own context window. A main agent starts it for one sub-task, and it returns a short result. | [4.1](/notes/ai/context-engineering/04-write-and-rag/l1-four-strategies) |
| subagent | A separate Claude instance with its own context window, system prompt and tool permissions. The main session gives it a task and gets back a result. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| sub-agent delegation | Starting a sub-agent with a focused task in a fresh context window and receiving only its result. | [7.8](/notes/ai/context-engineering/07-compress-and-isolate/l8-isolation-patterns) |
| subgraph | A LangGraph graph used as one node of another graph, with its own state and its own checkpoints. | [7.8](/notes/ai/context-engineering/07-compress-and-isolate/l8-isolation-patterns) |
| substring scorer | A scorer that gives points when certain text fragments appear anywhere in the output. | [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches) |
| success criteria | A checklist of statements that a test or a person can verify, one by one. | [9.3](/notes/ai/context-engineering/09-production/l3-the-prp-workflow) |
| success rate | Successful tasks divided by attempted tasks. | [7.10](/notes/ai/context-engineering/07-compress-and-isolate/l10-measure-compression) |
| summary drift | The loss or distortion of facts when a summary is summarized again at each compaction. | [7.2](/notes/ai/context-engineering/07-compress-and-isolate/l2-summarization-and-compaction) |
| summary tree | The tree of RAPTOR: leaf chunks at the bottom, summaries of clusters above them, and broader summaries above those. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| supersedes field | A field in an extracted fact that names the earlier fact which the new one replaces. | [8.5](/notes/ai/context-engineering/08-memory/l5-five-management-strategies) |
| suppression directive | A comment that tells a checker to ignore a line or a test, such as `# type: ignore` or `@ts-ignore`. | [9.4](/notes/ai/context-engineering/09-production/l4-validation-loops) |
| sweet spot | The amount and kind of context where quality is highest for a given task and model. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| symbolic link (symlink) | A file-system entry that points to another file or folder, possibly outside the current folder. | [6.8](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) |
| system call | A request from a program to the operating system to do something that the program cannot do itself. In the analogy: a tool call. | [2.2](/notes/ai/context-engineering/02-paradigm-shift/l2-the-llm-os-model) |
| system instructions | Text from the developer that defines the model's role, rules, tone and limits for the whole conversation. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| system prompt | Instructions from the developer that apply to the whole conversation. On the Anthropic API it is the top-level `system` field. | [1.3](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) |

## T

| Term | Plain meaning | First seen |
|---|---|---|
| target level | The utilization that compression aims for, for example 60%. It is below the trigger threshold. | [7.5](/notes/ai/context-engineering/07-compress-and-isolate/l5-when-to-compress) |
| targeted rule | One instruction added to fix one observed failure mode. | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| task | The part of a prompt that says what to do, for example "summarize" or "classify". | [3.7](/notes/ai/context-engineering/03-system-layer/l7-atomic-and-molecular-prompts) |
| task completion rate (TCR) | The handbook's name for successful tasks divided by total tokens. It is an efficiency ratio, not a rate of success. | [7.10](/notes/ai/context-engineering/07-compress-and-isolate/l10-measure-compression) |
| task context | The content that defines the task: system prompt, tool definitions, retrieved documents, few-shot examples. | [7.6](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets) |
| temperature | A setting that controls how random the choice of the next token is. Near 0, the most probable token wins almost every time. | [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) |
| temporal retrieval | Finding memories by time, for example the most recent ones first. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| tenant | One customer organization of a multi-customer (SaaS) application, with its own settings and data. | [3.3](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order) |
| tenant isolation | The guarantee that one user's or one customer's data never reaches another user or customer. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| term | One unit that the index stores, usually a word after lowercasing and other clean-up. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| term frequency, $f(q, D)$ | How many times term $q$ appears in document $D$. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |
| test case | One input, with a rubric or an expected result, that checks one behavior. | [3.4](/notes/ai/context-engineering/03-system-layer/l4-start-minimal-then-add) |
| text retrieval | Finding memories that share words with the query, with keyword or fuzzy matching. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| $\text{Sim}_1$ | In MMR, the similarity between a candidate chunk and the query. | [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) |
| $\text{Sim}_2$ | In MMR, the similarity between two chunks. | [5.5](/notes/ai/context-engineering/05-retrieval-quality/l5-diversity-with-mmr) |
| thought | A reasoning step in ReAct. It does not change the environment. | [6.6](/notes/ai/context-engineering/06-tools-and-mcp/l6-execution-patterns-and-react) |
| thrashing | Compression that runs again and again because the context is full again right after each pass. | [7.5](/notes/ai/context-engineering/07-compress-and-isolate/l5-when-to-compress) |
| tiered response | A first result with a summary, and a second tool that returns the details of one item. | [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) |
| time to first token (TTFT) | The delay from the request to the first output token. Prefill is most of it. | [1.4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length) |
| time to live (TTL) | How long a stored prefix stays available. | [1.7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) |
| timeout | The longest time that the application waits for a tool before it stops the call. | [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) |
| token | The unit of text that a model reads and writes. A token is often a word or a part of a word (lesson [L2](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers)). | [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) |
| token budget | The largest number of tokens that one part of the input may use on a call. | [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) |
| token ID | The integer that stands for one token. The model sees only these integers. | [1.2](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers) |
| token passthrough | An MCP server that accepts a token issued for another service and forwards it. The MCP spec forbids it. | [6.9](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) |
| token savings | The share of tokens removed: 1 minus (tokens after ÷ tokens before). | [7.1](/notes/ai/context-engineering/07-compress-and-isolate/l1-why-compress) |
| token unit | A cost measure: tokens multiplied by their price multiplier. One normal input token is 1 unit. On Sonnet 5.5, a cache read is 0.05 units and a 5-minute cache write is 1.25 units. | [8.8](/notes/ai/context-engineering/08-memory/l8-three-layer-memory-agent) |
| tokenizer | The program that converts text into a list of token IDs, and back. | [1.2](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers) |
| tokens per success | Total tokens divided by successful tasks. It is the inverse of TCR. | [7.10](/notes/ai/context-engineering/07-compress-and-isolate/l10-measure-compression) |
| tool | A function that the application runs for the model, for example an API call, a database query, a calculation or an action. | [6.1](/notes/ai/context-engineering/06-tools-and-mcp/l1-tools-are-context) |
| tool call | A structured request from the model to run one tool with given arguments. The model writes it, and the application runs it. | [6.1](/notes/ai/context-engineering/06-tools-and-mcp/l1-tools-are-context) |
| tool definition | The name, the description and the parameter schema of one tool. The application sends it to the model in the request. | [6.1](/notes/ai/context-engineering/06-tools-and-mcp/l1-tools-are-context) |
| tool definitions | The names, descriptions and input schemas of the functions that the model may ask the application to run. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| tool lifecycle | The five stages of one tool use: describe, decide, call, return, reason. Reason can lead back to decide. | [6.2](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop) |
| tool recall@k | The share of test requests for which every needed tool is among the top $k$ tools that retrieval returns. | [6.5](/notes/ai/context-engineering/06-tools-and-mcp/l5-many-tools) |
| tool result | The output of a tool that the application sends back to the model. It enters the window as new context. | [6.1](/notes/ai/context-engineering/06-tools-and-mcp/l1-tools-are-context) |
| tool result accumulation | Results of old tool calls stay in the window after their step. | [2.4](/notes/ai/context-engineering/02-paradigm-shift/l4-the-quality-curve) |
| tool results | The output of a tool run, which the application returns to the model. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| tool retrieval | Retrieving only the tool descriptions that fit the current request, instead of sending all tool definitions on every call. | [5.7](/notes/ai/context-engineering/05-retrieval-quality/l7-just-in-time-retrieval) |
| tool search tool | A tool that the model can call to search a large tool catalog and load matching tools. | [6.5](/notes/ai/context-engineering/06-tools-and-mcp/l5-many-tools) |
| tool section | The part of a system prompt that says when and how to use the available tools. The callable tool definitions go in a separate API field. | [3.1](/notes/ai/context-engineering/03-system-layer/l1-five-parts-of-a-system-prompt) |
| tool use (function calling) | The model asks the application to run a tool, and then uses the result. Anthropic says "tool use". OpenAI and Google say "function calling". | [6.1](/notes/ai/context-engineering/06-tools-and-mcp/l1-tools-are-context) |
| tool-call pair | A model's tool call and the tool result that answers it. The two must stay together in the history. | [8.5](/notes/ai/context-engineering/08-memory/l5-five-management-strategies) |
| `tool_call_id` | The field of an OpenAI Chat Completions `tool` message that names the tool call it answers. The Responses API uses `call_id`. | [7.3](/notes/ai/context-engineering/07-compress-and-isolate/l3-tool-result-clearing) |
| `tool_choice` | A request setting that controls whether the model may, must or must not call a tool, or which tool it must call. | [6.2](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop) |
| tool-count zones | Shopify's three ranges of tool count (0–20, 20–50, 50+), each with its own typical problems. | [6.5](/notes/ai/context-engineering/06-tools-and-mcp/l5-many-tools) |
| `tool_result` block | The Anthropic content block in which the application returns a tool's output. It names the `tool_use_id` of the call that it answers. | [6.2](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop) |
| tool-result clearing | Replacing the content of an already-used tool result with a short note. The tool call and its ID stay in the history. | [7.3](/notes/ai/context-engineering/07-compress-and-isolate/l3-tool-result-clearing) |
| `tool_use` block | The Anthropic content block in which the model asks for a tool. It has an `id`, a `name` and an `input` object. | [6.2](/notes/ai/context-engineering/06-tools-and-mcp/l2-the-tool-call-loop) |
| `tool_use_id` | The field of an Anthropic `tool_result` block that names the `tool_use` block it answers. | [7.3](/notes/ai/context-engineering/07-compress-and-isolate/l3-tool-result-clearing) |
| topic chunking | A memory strategy that groups turns by topic, summarizes each group, and retrieves the group that matches the question. The handbook calls it semantic chunking. | [8.5](/notes/ai/context-engineering/08-memory/l5-five-management-strategies) |
| top-k | The k items with the highest scores. | [3.8](/notes/ai/context-engineering/03-system-layer/l8-few-shot-examples) |
| top-k retrieval | Returning the $k$ chunks whose embeddings are nearest to the query embedding. | [4.4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) |
| trace | The full record of one request or one agent task, made of nested spans. | [9.8](/notes/ai/context-engineering/09-production/l8-observability-cost-and-latency) |
| trajectory | The full sequence of thoughts, actions and observations of one task. | [6.6](/notes/ai/context-engineering/06-tools-and-mcp/l6-execution-patterns-and-react) |
| transient error | An error that can pass on its own, for example a timeout, a rate limit or a server overload. A retry can succeed. | [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) |
| transport | The channel that carries the JSON-RPC messages: stdio or Streamable HTTP. | [6.7](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol) |
| trigger threshold | The utilization at which compression starts, for example 80%. | [7.5](/notes/ai/context-engineering/07-compress-and-isolate/l5-when-to-compress) |
| triple | One fact in a knowledge graph, in the form subject, predicate, object. For example: Alice, manages, Bob. | [5.9](/notes/ai/context-engineering/05-retrieval-quality/l9-beyond-basic-rag) |
| truncation | Cutting an input at a model's input limit. An embedding model ignores the text after the limit, usually without an error. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| truncation note | A field in a cut result that says that it is cut, how much is missing and how to get more. | [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors) |
| TTL decay | A decay rule that archives or deletes a memory when the time since its last access passes a fixed limit. | [8.3](/notes/ai/context-engineering/08-memory/l3-retrieval-scoring-and-decay) |
| turn | One user message and the model's reply to it. | [1.3](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) |
| turn growth ($t$) | The tokens that one turn adds to the history: the user message plus the reply. | [1.6](/notes/ai/context-engineering/01-foundations/l6-the-cost-of-a-conversation) |
| two-pass assembly | Building the context twice: the first pass estimates sizes and decides cuts, the second builds and counts exactly. | [7.6](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets) |
| type checker | A tool that finds type errors without running the code. Examples: mypy for Python, `tsc` for TypeScript. | [9.4](/notes/ai/context-engineering/09-production/l4-validation-loops) |

## U

| Term | Plain meaning | First seen |
|---|---|---|
| U-curve | The shape of accuracy against position in that study: high, low, then high again. | [1.5](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects) |
| ultrathink | A keyword in a prompt. Claude Code adds an in-context instruction to reason more on that turn. It does not change the effort level. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| under-writing | Saving too little. A later step or session must find the information again, or it makes a different decision. | [4.2](/notes/ai/context-engineering/04-write-and-rag/l2-write-scratchpads-memories-files) |
| union-dedup merge | A merge of several result lists that keeps every chunk once and has no ranking rule of its own. | [5.4](/notes/ai/context-engineering/05-retrieval-quality/l4-query-transformation) |
| UNIQUE constraint | A database rule that no two rows may have the same values in the named columns. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| unit test | A test of one function or class in isolation, with fakes for slow or external parts. | [9.4](/notes/ai/context-engineering/09-production/l4-validation-loops) |
| unit vector | A vector with length 1. | [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| unplanned input | A test input that the prompt author did not have in mind, for example a paraphrase, a new entity or two requests in one. | [3.2](/notes/ai/context-engineering/03-system-layer/l2-the-right-altitude) |
| untrusted data | Text in the prompt that the developer did not write, for example a user's email, a web page or a tool result. | [3.3](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order) |
| UPSERT | One SQL statement that inserts a row, or updates the existing row when the insert would break a uniqueness rule. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| usable window | The window size minus the output reserve (at least `max_tokens`). Only this part can hold input. | [7.5](/notes/ai/context-engineering/07-compress-and-isolate/l5-when-to-compress) |
| usage | The field in a response with the billed token counts. | [1.3](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call) |
| user input | The current request of the user on this call. | [2.3](/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context) |
| user scope | A file in `~/.claude/`. It applies to you in all projects. | [9.5](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks) |
| utilization | The input tokens of a call divided by the token budget, as a percentage. | [7.5](/notes/ai/context-engineering/07-compress-and-isolate/l5-when-to-compress) |

## V

| Term | Plain meaning | First seen |
|---|---|---|
| vague instruction | An instruction too general to change the model's behavior, for example "be professional". | [3.2](/notes/ai/context-engineering/03-system-layer/l2-the-right-altitude) |
| validation checkpoint | One level of checks in a PRP: an exact command and the expected result. | [9.3](/notes/ai/context-engineering/09-production/l3-the-prp-workflow) |
| validation loop | A set of commands, such as linters and tests, that the agent runs after each step and must pass before it continues. | [3.6](/notes/ai/context-engineering/03-system-layer/l6-the-context-stack) |
| value density | The value of a chunk divided by its size in tokens. | [5.6](/notes/ai/context-engineering/05-retrieval-quality/l6-retrieval-budgets-and-order) |
| vector database | A service that stores vectors with their text and metadata, keeps them on disk, updates and deletes them, filters them and serves queries. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| vector dimension | The number of values in an embedding, for example 384 or 1,536. Every embedding of one model has the same dimension. | [4.6](/notes/ai/context-engineering/04-write-and-rag/l6-embeddings-and-similarity) |
| vector index | A data structure that stores embeddings and finds the ones nearest to a query vector. A vector database holds one or more. | [4.4](/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline) |
| vector library | Code that builds and searches vector indexes inside one program, for example FAISS. It has no storage service, access control or API of its own. | [4.7](/notes/ai/context-engineering/04-write-and-rag/l7-vector-search) |
| verbosity bias | A judge prefers a longer answer that is not better. | [9.6](/notes/ai/context-engineering/09-production/l6-evaluation) |
| verification question | A specific question that the orchestrator asks to check that a sub-agent's summary is consistent. | [7.9](/notes/ai/context-engineering/07-compress-and-isolate/l9-contract-first-design) |
| vibe coding | Karpathy's name (February 2025) for coding where you accept what the AI writes without reading it closely. | [2.1](/notes/ai/context-engineering/02-paradigm-shift/l1-from-prompts-to-context-engineering) |
| vibe prompt | A short request that states only the goal, with no requirements or context. | [2.5](/notes/ai/context-engineering/02-paradigm-shift/l5-same-task-three-approaches) |
| visual review | A person examines a running user interface to check layout, behavior and accessibility. | [9.4](/notes/ai/context-engineering/09-production/l4-validation-loops) |
| vocabulary | The fixed set of all tokens that a tokenizer knows. Each token has a number: its token ID. | [1.2](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers) |
| vocabulary mismatch | The query and the relevant document use different words for the same idea, so lexical retrieval finds no match. | [5.1](/notes/ai/context-engineering/05-retrieval-quality/l1-bm25) |

## W

| Term | Plain meaning | First seen |
|---|---|---|
| warm tier | Session memory that the application keeps in fast storage and fetches by key without a search, for example the rolling summary. | [8.4](/notes/ai/context-engineering/08-memory/l4-hot-warm-and-cold-tiers) |
| weighted IRR | IRR in which each fact counts by an importance weight. | [7.10](/notes/ai/context-engineering/07-compress-and-isolate/l10-measure-compression) |
| weighted RRF | RRF with a weight for each list, so that one retriever counts more than the other. | [5.2](/notes/ai/context-engineering/05-retrieval-quality/l2-hybrid-search-and-rrf) |
| weights (parameters) | The numbers that training sets inside the model. They hold general knowledge up to the training cutoff. They do not change during a call. | [1.1](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context) |
| windowing | A memory strategy that keeps only the last N turns of the history and drops everything older. | [8.5](/notes/ai/context-engineering/08-memory/l5-five-management-strategies) |
| within-session memory | Memory that keeps continuity inside one session, for example the recent turns and a running summary. | [8.1](/notes/ai/context-engineering/08-memory/l1-stateless-models-stateful-apps) |
| word piece | A token of the WordPiece tokenizer that BERT-family models such as all-MiniLM-L6-v2 use. Its count differs from a tiktoken count. | [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking) |
| workflow | Anthropic's term for a system in which code paths fixed in advance orchestrate the model and the tools. | [6.6](/notes/ai/context-engineering/06-tools-and-mcp/l6-execution-patterns-and-react) |
| working memory | The content that grows during the task: history, tool results, scratchpad, agent state. | [7.6](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets) |
| WRITE | A context strategy: save information outside the context window, so that a later step or a later call can use it. | [4.1](/notes/ai/context-engineering/04-write-and-rag/l1-four-strategies) |
| write path | The part of a memory system that decides what to store, in which form, and when to update or delete it. | [8.1](/notes/ai/context-engineering/08-memory/l1-stateless-models-stateful-apps) |
| write-ahead logging (WAL) | A SQLite journal mode in which readers do not block the writer and the writer does not block readers. There is still only one writer at a time. | [8.6](/notes/ai/context-engineering/08-memory/l6-persistent-memory) |
| WSCI | This course's short name for the four context strategies: write, select, compress, isolate. | [4.1](/notes/ai/context-engineering/04-write-and-rag/l1-four-strategies) |

## X

| Term | Plain meaning | First seen |
|---|---|---|
| XML tag | A pair of labels such as `<rules>` and `</rules>` around a part of the prompt. It marks both the start and the end. | [3.3](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order) |

## Z

| Term | Plain meaning | First seen |
|---|---|---|
| zero-shot prompting | Asking the model to do a task with instructions only, with no demonstrations. | [3.7](/notes/ai/context-engineering/03-system-layer/l7-atomic-and-molecular-prompts) |
