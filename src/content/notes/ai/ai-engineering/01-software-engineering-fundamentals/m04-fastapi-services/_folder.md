---
title: "M4 FastAPI services"
order: 4
summary: "Build an API that validates every input and output, returns one safe error shape, shares clients through lifespan, picks def or async def on purpose, and is tested automatically."
---

FastAPI turns Python type hints into routes, validation, documentation and tests. This module builds a small service step by step: routes and models, errors, dependencies and lifespan, the choice between `def` and `async def`, and tests. Every AI service in later levels, including the streaming endpoints of module 5, stands on these pieces.

**Outcome:** You can build an API that documents itself, validates every input and output, can be tested automatically, and talks to at least one outside service.

**Before this module:** [M3 HTTP, REST and JSON](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m03-http-rest-json), [1.8 Type annotations and Pydantic](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l8-type-annotations-and-pydantic), and for lesson 4.4 [2.6 asyncio](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l6-asyncio-and-the-event-loop) and [2.7 blocking calls](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations/l7-blocking-calls-and-to-thread).

| Code | Lesson | Core idea | Exercise runs in | Status |
|---|---|---|---|---|
| 4.1 | [Routes, parameters and response models](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l1-routes-parameters-and-response-models) | Type hints declare path, query and body parameters. The response model filters and documents the output. | Local practice project | not started |
| 4.2 | [Validation, status codes and error responses](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l2-validation-and-error-responses) | Three exception handlers give every failure one safe shape. The catch-all logs the trace and hides it. | Local practice project | not started |
| 4.3 | [Dependencies, lifespan, settings and middleware](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l3-dependencies-lifespan-config-and-middleware) | Dependencies give routes their objects and let tests swap them. Lifespan creates shared clients once. | Local practice project | not started |
| 4.4 | [def vs async def endpoints and calling other services](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l4-def-vs-async-def-endpoints) | def runs in a pool of 40 threads. A blocking call in async def stalls every request. Map upstream failures to 502 and 504. | Local practice project | not started |
| 4.5 | [Testing endpoints and OpenAPI docs](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services/l5-testing-and-openapi) | TestClient tests error paths in memory. OpenAPI uses the JSON Schema that LLM tools also use. | Local practice project | not started |

**Next module:** [M5 Streaming, MCP tools and event channels](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m05-streaming-and-agent-events).

The roadmap's M0.3 notebook exercise (the notes API with one error model) is Exercise 4.2.1, and its tests are Exercise 4.5.1. The worked examples in this module use a tasks API, so the exercise stays yours to build.
