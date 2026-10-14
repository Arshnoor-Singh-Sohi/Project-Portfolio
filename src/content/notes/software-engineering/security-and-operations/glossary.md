---
title: "Glossary"
order: 2
summary: "Every term in Security and Operations, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| 401 | The HTTP status for "no valid authentication". | [1.1](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity) |
| app authorization | The app acts with its own service principal. All users share its permissions. | [1.2](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy) |
| attribute | A key and a value on a span, for example `gen_ai.usage.input_tokens = 18200`. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| authentication | Proving who the caller is. | [1.1](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity) |
| authorization | Deciding whether the known caller may do the requested action. | [1.1](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity) |
| bearer token | A token in the `Authorization: Bearer <token>` header. Whoever holds it can use it. | [1.1](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity) |
| claim | One field in a JWT payload, for example `sub` (subject), `aud` (audience), `iss` (issuer), `exp` (expiry time). | [1.1](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity) |
| collector | A service that receives telemetry and forwards it to storage. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| credential | Something that proves identity, for example a signed token. | [1.1](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity) |
| direct access | A request that reaches the app without passing the proxy. | [1.2](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy) |
| exporter | The component that sends finished spans to a backend. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| fail closed | When the identity is missing, the app refuses the request. | [1.2](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy) |
| forwarded header | A header that the proxy adds to a request before it forwards it, for example `X-Forwarded-Email`. | [1.2](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy) |
| header spoofing | A client sends a header with the same name as a forwarded header, to fake a value. | [1.2](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy) |
| identity | The user id that the server uses for authorization, for example `sub` or an email. | [1.1](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity) |
| identity provider (IdP) | The service that authenticates users and issues tokens. | [1.1](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity) |
| JWT | JSON Web Token: a header, a set of claims and a signature, each base64url-encoded and joined by dots. | [1.1](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity) |
| OTLP | The OpenTelemetry Protocol, used to send spans, metrics and logs to a collector. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| pseudonymous id | An id that links records of one user without naming the user, for example a salted hash. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| reverse proxy | A server in front of the app. Clients connect to it, and it forwards each request to the app. | [1.2](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy) |
| root span | The first span of a trace. It has no parent. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| scope | A limit on what a token allows, for example "read SQL warehouses". | [1.2](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy) |
| self time | A span's duration minus the durations of its child spans. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| self-asserted identity | An identity that the client states in the request and nobody verified. | [1.1](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity) |
| service principal | A non-human identity in Databricks. Each app has its own. | [1.2](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy) |
| signature check | Proof, with the issuer's public key, that the issuer made the token and nobody changed it. | [1.1](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity) |
| span | One unit of work with a name, a start time, an end time and a parent. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| span event | A time-stamped note inside a span, like a structured log line. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| span status | Unset, Error or Ok. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| strip | The proxy removes every client-supplied copy of a header before it adds its own. | [1.2](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy) |
| trace | The record of one request through the system, made of linked spans. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| trace context | The trace id and the parent span id, passed between processes. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| `traceparent` | The W3C header and environment variable that carry the trace context. | [2.1](/notes/software-engineering/security-and-operations/02-observability/l1-tracing-agents) |
| trusted hop | A network source that the app trusts to set forwarded headers, for example the proxy's address. | [1.2](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy) |
| trusted proxy | A component under your control, in front of the app, that writes identity headers. | [1.1](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity) |
| user authorization | The app acts with the user's identity, through the user's forwarded access token. Also called on-behalf-of-user authorization. | [1.2](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy) |
| `X-Forwarded-For` | A header that holds the client's address as seen by each proxy. | [1.2](/notes/software-engineering/security-and-operations/01-access-control/l2-identity-headers-behind-a-proxy) |
