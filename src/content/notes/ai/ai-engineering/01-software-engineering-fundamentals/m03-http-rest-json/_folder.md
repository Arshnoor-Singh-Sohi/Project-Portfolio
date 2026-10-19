---
title: "M3 HTTP, REST and JSON"
order: 3
summary: "How a request and a response look on the wire, which failed calls you may retry, where each value travels, how to design a clean API, and how to inspect one."
---

Every model provider API, every MCP server over HTTP and every service that you build in this level speaks HTTP. This module teaches HTTP from the bytes on the wire up. After it, you can read unknown API documentation, build requests by hand, read what comes back, and design a sensible REST API yourself.

**Outcome:** You can read unknown API documentation, build requests by hand, interpret what comes back, and design a sensible REST API yourself.

**Before this module:** [M1 Python foundations](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations), especially [1.3 data structures](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l3-core-data-structures) and [1.7 JSON and environment variables](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l7-files-paths-env-and-json). The async client in 3.5 uses [2.6 asyncio](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l6-asyncio-and-the-event-loop).

| Code | Lesson | Core idea | Exercise runs in | Status |
|---|---|---|---|---|
| 3.1 | [The HTTP request-response cycle](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m03-http-rest-json/l1-the-request-response-cycle) | DNS, TCP and TLS open a connection. A request line, headers and a body go out. A status line, headers and a body come back. | Local practice project | not started |
| 3.2 | [Methods, status codes, idempotency and safe retries](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m03-http-rest-json/l2-methods-status-codes-and-retries) | Retry only transient errors, and only when a repeat cannot harm. Use backoff, jitter and Retry-After. | Local practice project | not started |
| 3.3 | [Headers, parameters, bodies, cookies and auth](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m03-http-rest-json/l3-headers-parameters-bodies-and-auth) | Each value has a place. Secrets go in headers, never in URLs, browser code or Git. | Local practice project | not started |
| 3.4 | [JSON and REST resource design](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m03-http-rest-json/l4-json-and-rest-design) | JSON round trips change tuples and keys. REST uses nouns, standard methods, pages and one error shape. | Local practice project or browser lab | not started |
| 3.5 | [Inspecting APIs with curl and httpx](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m03-http-rest-json/l5-inspecting-apis-with-curl-and-httpx) | curl shows the raw exchange. httpx adds timeouts, status checks and MockTransport for tests. | Local practice project | not started |

**Next module:** [M4 FastAPI services](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services).
