---
title: "L8: Resources and prompts"
order: 8
summary: "The two other server primitives. Resources: the Resource object, resources/list, resources/read, URI templates (RFC 6570), errors, and change notifications with resources/subscribe (2025-11-25) and subscriptions/listen (2026-07-28). Prompts: prompts/list, prompts/get with string arguments, the returned messages, and completion/complete. How to choose between a tool, a resource and a prompt."
status: not-started
tags: [mcp, resources, prompts, uri-templates, completion, subscriptions]
---

## 1. The question this idea answers

Tools let the model act ([L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth)). But much of what a server offers is not an action. A database schema, a file, a customer summary: these are data that the application may want to attach. A "review this order" template is a text that the user wants to start with. MCP has two more server primitives for these cases: **resources** and **prompts**.

An interviewer asks: "What is the difference between a tool, a resource and a prompt? Who decides when each is used? What are the fields? How does a client learn that a resource changed, and what changed in 2026?" This lesson answers at the level of single fields, for both revisions.

## 2. Mental model

> [!analogy] A library with three counters
> The **staff counter** does jobs on request: "find all books by this author". You ask, they act. These are **tools**, and the model decides when to ask.
>
> The **shelves** hold books with call numbers. The librarian (the **host**) takes the books that fit your project and puts them on your desk. Some call numbers are patterns, such as "all books in aisle {n}". These are **resources** and **resource templates**. The application decides what goes on the desk.
>
> The **request forms** at the entrance are ready-made letters: "Request an interlibrary loan for {title}". You pick one and fill the blanks. These are **prompts**, and the user decides.
>
> **Where it stops working:** in a library, reading a book never changes it. An MCP server's `resources/read` is just code, and nothing in the protocol stops it from having side effects or high cost. Also, the control labels describe the intended design, not a rule that the protocol enforces. A host may let the model choose resources, and the spec allows "automatic context inclusion, based on heuristics or the AI model's selection".

## 3. Terms

| Term | Plain meaning |
|---|---|
| resource | Data that a server offers under a URI, such as a file or a table schema. |
| `Resource` object | The description of one resource in a list: `uri`, `name` and optional fields. |
| URI | A string that names a resource, such as `orders://schema` or `file:///project/README.md` (RFC 3986). |
| resource template | A pattern of URIs with variables, such as `orders://customers/{customer_id}/summary` (RFC 6570). |
| `resources/read` | The request that returns the contents of one URI, as text or as base64 `blob`. |
| `TextResourceContents` | One content item with `uri`, `text` and optional `mimeType`. |
| `BlobResourceContents` | One content item with `uri`, base64 `blob` and optional `mimeType`. |
| `subscriptions/listen` | The 2026-07-28 request that opens a long-lived stream of opted-in change notifications. |
| `resources/subscribe` | The 2025-11-25 request that subscribed to one URI on the session. Removed in 2026-07-28. |
| prompt | A template of messages that a server offers and a user picks. |
| `PromptArgument` | One named blank of a prompt: `name`, optional `title`, `description` and `required`. |
| `prompts/get` | The request that renders a prompt with string arguments and returns `messages`. |
| `PromptMessage` | One message of a rendered prompt: a `role` (`user` or `assistant`) and one content block. |
| completion | Suggestions for an argument value while the user types: `completion/complete`. |
| application-driven | The host decides which resources enter the model context. |
| user-controlled | The user decides when a prompt is used. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. Who controls each primitive

| Primitive | Control (spec wording) | Methods in 2026-07-28 | Typical user interface |
|---|---|---|---|
| Tools | "model-controlled" | `tools/list`, `tools/call` | The model calls them. The host may ask for confirmation. |
| Resources | "application-driven" | `resources/list`, `resources/templates/list`, `resources/read`, `subscriptions/listen` | A picker, a tree, a search box, or automatic inclusion |
| Prompts | "user-controlled" | `prompts/list`, `prompts/get`, `completion/complete` | Slash commands |

> [!key] The control column is the whole idea
> The server offers all three primitives. The difference is **who decides when each one is used**: the model for tools, the application for resources, the user for prompts. The prompts page says it exactly: "This refers to who decides when the prompt is used, not who authors its content. Prompt content is defined by the server."

![Alt text: three columns for tools, resources and prompts with who controls each one, its methods and an example](/notes/media/llm-systems/figures/07-8-three-primitives.svg)

## 5. Resources

### 5.1 The capability

A server with resources **MUST** declare `resources` in its capabilities (`initialize` result in 2025-11-25, `server/discover` result in 2026-07-28). Two optional features: `subscribe` (per-resource update notifications) and `listChanged` (list change notifications). For example `{"resources": {"subscribe": true, "listChanged": true}}`, or `{"resources": {}}` for neither.

Revision 2026-07-28 adds the same rule as for tools: the set returned by `resources/list` "**MUST NOT** vary per-connection or as a side effect of other requests on the connection", but "**MAY** vary by the authorization presented on the request".

### 5.2 The `Resource` object

| Field | Required | Meaning |
|---|---|---|
| `uri` | yes | The ID of the resource. Any scheme. The server decides how to interpret it. |
| `name` | yes | A name for programs. Used for display if `title` is absent. |
| `title` | no | A display name for people. |
| `description` | no | What the resource is. The schema calls it a hint to the model. |
| `mimeType` | no | The media type, if known, such as `text/plain` or `application/json`. |
| `size` | no | The raw size in bytes, "before base64 encoding or any tokenization". Hosts use it to show sizes and estimate context use. |
| `annotations` | no | `audience`, `priority` (0 to 1) and `lastModified` (ISO 8601). |
| `icons` | no | Icons for a user interface (same `Icon` type as tools). |
| `_meta` | no | Metadata with namespaced keys. |

A complete resource, valid against the 2026-07-28 schema:

```json
{
  "uri": "orders://schema",
  "name": "orders_schema",
  "title": "Orders table schema",
  "description": "Columns and types of the orders table. Read it before you write a query.",
  "mimeType": "text/plain",
  "size": 82,
  "annotations": {"audience": ["assistant"], "priority": 0.8, "lastModified": "2026-10-01T09:00:00Z"},
  "_meta": {"com.example/owner": "orders-team"}
}
```

The `size` of 82 bytes is the length of the schema text that the server of section 8 returns. The `annotations` say: this resource is meant for the model (`audience: ["assistant"]`), it is important (`priority: 0.8`), and it changed on 1 October 2026. A host can use them to decide what to put into a limited context window.

### 5.3 `resources/list`

The request is like `tools/list`: optional `cursor`, and the required `_meta` in 2026-07-28. The result has `resources`, optional `nextCursor`, and in 2026-07-28 `ttlMs`, `cacheScope` and `resultType`. A schema of a shared database is the same for every user, so the example server could answer with `"ttlMs": 3600000` (one hour) and `"cacheScope": "public"`.

### 5.4 `resources/read`

The request has one resource-specific parameter, `uri`. In 2026-07-28 it may also carry `inputResponses` and `requestState` on an MRTR retry ([L9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots)).

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "orders://customers/CUS-0042/summary",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {"name": "orders-agent", "version": "1.4.0"}
    }
  }
}
```

The result has `contents`, an array of `TextResourceContents` or `BlobResourceContents`, plus `ttlMs` and `cacheScope` in 2026-07-28:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "resultType": "complete",
    "contents": [
      {
        "uri": "orders://customers/CUS-0042/summary",
        "mimeType": "application/json",
        "text": "{\"customer_id\": \"CUS-0042\", \"orders\": 12, \"total_cents\": 104450}"
      }
    ],
    "ttlMs": 60000,
    "cacheScope": "private"
  }
}
```

This summary belongs to one customer, so `cacheScope` is `"private"`: a shared gateway must not serve it to another user. A binary item uses `blob` instead of `text`:

```json
{"uri": "orders://invoices/ORD-1001.pdf", "mimeType": "application/pdf", "blob": "JVBERi0xLjcK"}
```

Four more rules (2026-07-28):

1. A server **MAY** return several items for one read, for example the files of a directory.
2. A server **MAY** answer with an `InputRequiredResult` when it needs input first.
3. If the scheme is `https://`, the client may fetch the resource directly from the web. Servers **SHOULD** use `https://` only when the client can do that without the server.
4. Each content item carries its own `uri`. When a directory is read, each file in the result has its own URI.

### 5.5 Resource templates and RFC 6570

`resources/templates/list` returns `resourceTemplates`. A `ResourceTemplate` has `uriTemplate` (required), `name` (required), and optional `title`, `description`, `mimeType`, `annotations`, `icons` and `_meta`. The schema says `mimeType` "should only be included if all resources matching this template have the same type".

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "resultType": "complete",
    "resourceTemplates": [
      {
        "uriTemplate": "orders://customers/{customer_id}/summary",
        "name": "customer_summary",
        "title": "Customer order summary",
        "description": "Order count and total for one customer.",
        "mimeType": "application/json"
      }
    ],
    "ttlMs": 3600000,
    "cacheScope": "public"
  }
}
```

A URI template follows RFC 6570. A variable in braces is replaced by a value. The operator after the opening brace decides how the value is encoded:

| Expression | RFC 6570 name | Encoding |
|---|---|---|
| `{var}` | simple expansion | Percent-encodes every character outside the unreserved set, including `/`, `?` and space. |
| `{+var}` | reserved expansion | Keeps reserved characters such as `/`. |
| `{#var}` | fragment expansion | Like `+`, with a leading `#`. |
| `{?a,b}` | form-style query | Builds `?a=...&b=...`. |
| `{/var}`, `{.var}`, `{;var}`, `{&var}` | path segment, label, path parameter, query continuation | Each adds its own separator. |
| `{var:3}`, `{var*}` | prefix and explode modifiers | First 3 characters, or one item per list element. |

> [!example] Worked example: expanding and matching templates
> Measured with the URI template module of the Python SDK 2.3.0 (`mcp.shared.uri_template`):
>
> 1. `orders://customers/{customer_id}/summary` with `CUS-0042` gives `orders://customers/CUS-0042/summary`.
> 2. The same template with `CUS 42/x` gives `orders://customers/CUS%2042%2Fx/summary`. The space becomes `%20` and the slash becomes `%2F`, because simple expansion encodes every character outside the unreserved set.
> 3. `file:///{+path}` with `docs/a b.md` gives `file:///docs/a%20b.md`. The slash stays, the space is encoded.
> 4. `orders://search{?status,limit}` with `shipped` and `5` gives `orders://search?status=shipped&limit=5`.
>
> Matching works backwards. The server matches `orders://customers/CUS%2042%2Fx/summary` against the template and gets `{"customer_id": "CUS 42/x"}`. The value is **decoded**, so a `%2F` in the URI becomes a real `/` in the variable.

That last step is the security trap. A client can send `orders://customers/..%2F..%2Fetc%2Fpasswd/summary`, and the variable becomes `../../etc/passwd`. If the server builds a file path from it, it reads a file outside its folder. The 2026-07-28 resources page says that servers **MUST** validate all resource URIs. For `file://` resources, they **MUST** sanitize file paths to prevent directory traversal. Measured in these notes: the SDK's template matcher rejected that URI (it answered -32602), but it accepted `a%2F..%2Fb`, which decodes to `a/../b` and stays inside. An allow-list pattern for the variable is the strongest guard (Exercise 1). The older lesson [Build an MCP server](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) shows the `realpath` and `commonpath` check for file paths.

Template arguments can be auto-completed with `completion/complete` (section 7).

### 5.6 URI schemes

| Scheme | Meaning in the spec |
|---|---|
| `https://` | A web resource. Use it only when the client can fetch it directly. |
| `file://` | Resources that behave like a file system. They do not have to be real files. Directories may use the MIME type `inode/directory`. |
| `git://` | Git version control integration. |
| custom, such as `orders://` | Allowed. It **MUST** follow RFC 3986. |

### 5.7 Errors

In 2026-07-28, a missing resource gives a JSON-RPC error with code -32602 (Invalid Params). Other internal errors **SHOULD** use -32603:

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "error": {
    "code": -32602,
    "message": "Resource not found",
    "data": {"uri": "orders://customers/CUS-9999/summary"}
  }
}
```

Revision 2025-11-25 used -32002 for "Resource not found". Revision 2026-07-28 changed it to -32602 "to align with JSON-RPC specification". Clients **SHOULD** still accept -32002 from older servers, and the code stays reserved: it will never get another meaning. A server **MUST NOT** answer a missing resource with an empty `contents` array, because that is ambiguous: it could mean "exists but is empty".

### 5.8 Change notifications

Two kinds of change exist: the **list** changed (a resource was added or removed), or **one resource's content** changed.

**Revision 2025-11-25 (stateful).** The list notification `notifications/resources/list_changed` could arrive at any time on the session. For one resource, the client sent `resources/subscribe` with a `uri`, the server answered with an empty result, and later sent `notifications/resources/updated` on the same session. `resources/unsubscribe` ended it:

```json
{"jsonrpc": "2.0", "id": 5, "method": "resources/subscribe", "params": {"uri": "orders://schema"}}
{"jsonrpc": "2.0", "id": 5, "result": {}}
{"jsonrpc": "2.0", "method": "notifications/resources/updated", "params": {"uri": "orders://schema"}}
```

**Revision 2026-07-28 (stateless).** `resources/subscribe` and `resources/unsubscribe` are removed. The client opens one long-lived request, `subscriptions/listen`, with a filter of the notification types it wants. The server **MUST NOT** send types that the client did not request. The four filter fields are `toolsListChanged`, `promptsListChanged`, `resourcesListChanged` (booleans) and `resourceSubscriptions` (an array of URIs).

The listen request:

```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "method": "subscriptions/listen",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {"name": "orders-agent", "version": "1.4.0"}
    },
    "notifications": {
      "toolsListChanged": true,
      "resourcesListChanged": true,
      "resourceSubscriptions": ["orders://schema"]
    }
  }
}
```

Then the acknowledgment, one update and the graceful end, one message per line:

```json
{"jsonrpc": "2.0", "method": "notifications/subscriptions/acknowledged", "params": {"_meta": {"io.modelcontextprotocol/subscriptionId": 9}, "notifications": {"resourcesListChanged": true, "resourceSubscriptions": ["orders://schema"]}}}
{"jsonrpc": "2.0", "method": "notifications/resources/updated", "params": {"_meta": {"io.modelcontextprotocol/subscriptionId": 9}, "uri": "orders://schema"}}
{"jsonrpc": "2.0", "id": 9, "result": {"resultType": "complete", "_meta": {"io.modelcontextprotocol/subscriptionId": 9}}}
```

Read the trace carefully:

1. The acknowledgment **MUST** be the first message of the subscription. Its `notifications` field lists the subset that the server agreed to honor. Here the server dropped `toolsListChanged`, for example because it has no changing tools. The client **SHOULD** compare it with what it asked for.
2. Every notification on the stream carries `_meta["io.modelcontextprotocol/subscriptionId"]`, equal to the JSON-RPC `id` of the listen request (here 9). On stdio, where all messages share one channel, clients **MUST** use it to match notifications to subscriptions.
3. The update says only *that* the resource changed. The client sends `resources/read` again to get the new content.
4. The server ends the subscription gracefully with a normal result for request 9. The client ends it by closing the SSE stream on HTTP, or with `notifications/cancelled` for request 9 on stdio. After a stdio reconnect, the client **MUST** send `subscriptions/listen` again, because "the server holds no subscription state across reconnections".

Request-scoped notifications such as `notifications/progress` do not use this stream. They travel on the response stream of their own request ([L10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors)).

### 5.9 Caching resources

`resources/list`, `resources/templates/list` and `resources/read` results carry `ttlMs` and `cacheScope` in 2026-07-28 ([L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) has the full rules). The caching page gives a rule of thumb. Use `"public"` for lists that are identical for all users. Use `"private"` for `resources/read` results that depend on the user. A notification for a cached item makes it stale at once. The cache key is the method plus the parameters that affect the result, for example the `uri` of a read.

## 6. Prompts

### 6.1 The capability and the `Prompt` object

A server with prompts declares `{"prompts": {"listChanged": true}}`, or `{"prompts": {}}`. A `Prompt` has these fields (2026-07-28, the same in 2025-11-25):

| Field | Required | Meaning |
|---|---|---|
| `name` | yes | The ID used in `prompts/get`. |
| `title` | no | A display name. |
| `description` | no | What the prompt provides. |
| `arguments` | no | An array of `PromptArgument`: `name` (required), `title`, `description`, `required` (boolean). |
| `icons` | no | Icons, for example for a slash command menu. |
| `_meta` | no | Metadata. |

```json
{
  "name": "explain_order",
  "title": "Explain an order",
  "description": "Explain the status of one order in plain words for a chosen audience.",
  "arguments": [
    {"name": "order_id", "description": "Order ID, format ORD-NNNN.", "required": true},
    {
      "name": "audience",
      "title": "Audience",
      "description": "customer, support agent or finance",
      "required": false
    }
  ],
  "icons": [{"src": "https://example.com/explain.svg", "mimeType": "image/svg+xml", "sizes": ["any"]}]
}
```

`prompts/list` works like the other lists: cursor pagination, and `ttlMs`, `cacheScope` and `resultType` in 2026-07-28.

### 6.2 `prompts/get`: the request

The parameters are `name` and `arguments`. The type of `arguments` is a map from string to **string**: `{ [key: string]: string }`. A prompt argument is never a number or an object. In 2026-07-28 the request also carries `_meta`, and on an MRTR retry `inputResponses` and `requestState`.

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "prompts/get",
  "params": {
    "name": "explain_order",
    "arguments": {"order_id": "ORD-1001", "audience": "customer"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {"name": "orders-agent", "version": "1.4.0"}
    }
  }
}
```

### 6.3 `prompts/get`: the result

The result has an optional `description` and a required `messages` array. Each `PromptMessage` has a `role`, `"user"` or `"assistant"`, and **one** `content` block. The block can be text, image, audio, a `resource_link` or an embedded `resource`, the same types as tool results. There is no `system` role. The host decides where the messages go. A common choice is to add them to the conversation as if the user had written them.

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "complete",
    "description": "Explain order ORD-1001 to a customer",
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Explain the status of order ORD-1001 to a customer. Use short sentences."
        }
      },
      {
        "role": "user",
        "content": {
          "type": "resource",
          "resource": {
            "uri": "orders://orders/ORD-1001",
            "mimeType": "application/json",
            "text": "{\"order_id\": \"ORD-1001\", \"status\": \"shipped\", \"carrier\": \"UPS\"}"
          }
        }
      }
    ]
  }
}
```

The second message embeds the order as a resource, so the model gets the data without a separate tool call. Unlike the list results, `GetPromptResult` carries no `ttlMs` and no `cacheScope`. It is rendered from this request's arguments, and the server may return an `InputRequiredResult` instead.

### 6.4 Errors

The prompts page says that servers **SHOULD** return -32602 (Invalid params) for an invalid prompt name and for missing required arguments. Internal errors get -32603.

## 7. Completion: suggestions while the user types

`completion/complete` gives suggestions for an argument of a prompt or a resource template. The server declares `{"completions": {}}`. The request has `ref`, `argument` and an optional `context`:

| Field | Meaning |
|---|---|
| `ref` | `{"type": "ref/prompt", "name": ...}` or `{"type": "ref/resource", "uri": ...}`, where `uri` can be a URI template. |
| `argument` | `{"name": ..., "value": ...}`: the argument and what the user has typed so far. |
| `context.arguments` | Values that the user already chose for other arguments. |

```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "completion/complete",
  "params": {
    "ref": {"type": "ref/resource", "uri": "orders://customers/{customer_id}/summary"},
    "argument": {"name": "customer_id", "value": "CUS-00"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {"name": "orders-agent", "version": "1.4.0"}
    }
  }
}
```

The result has `completion.values` (at most 100 strings, sorted by relevance), an optional `total` and an optional `hasMore`:

```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "result": {
    "resultType": "complete",
    "completion": {"values": ["CUS-0001", "CUS-0007", "CUS-0042"], "total": 37, "hasMore": true}
  }
}
```

The spec asks servers to rate limit completion requests and clients to debounce them, because a request can go out on every key press. Completion must not leak data: a completion for `customer_id` must return only IDs that this user may see.

## 8. A real server: measured output

These notes ran this server, built with the Python SDK 2.3.0, over stdio and sent raw JSON-RPC requests:

```python
from mcp.server import MCPServer
from mcp.types import Completion, PromptReference

mcp = MCPServer("orders-docs")

@mcp.resource("orders://schema", name="orders_schema", title="Orders table schema",
              description="Columns of the orders table", mime_type="text/plain")
def orders_schema() -> str:
    return "order_id TEXT, customer_id TEXT, status TEXT, total_cents INTEGER, created_at TEXT"

@mcp.resource("orders://customers/{customer_id}/summary", name="customer_summary",
              description="One customer's order summary", mime_type="application/json")
def customer_summary(customer_id: str) -> str:
    return '{"customer_id": "%s", "orders": 12}' % customer_id

@mcp.prompt(title="Explain an order")
def explain_order(order_id: str, audience: str = "customer") -> str:
    """Explain the status of one order in plain words."""
    return f"Explain the status of order {order_id} to a {audience}."

@mcp.completion()
async def complete(ref, argument, context):
    if isinstance(ref, PromptReference) and argument.name == "audience":
        options = ["customer", "support agent", "finance"]
        return Completion(values=[o for o in options if o.startswith(argument.value)], has_more=False)
    return None

if __name__ == "__main__":
    mcp.run()
```

Three results, with the `_meta` of each result removed. A `prompts/get` with `order_id` only, the same request with no arguments, and a completion for `audience` starting with `fi`:

```json
{"jsonrpc": "2.0", "id": 7, "result": {"description": "Explain the status of one order in plain words.", "messages": [{"content": {"text": "Explain the status of order ORD-1001 to a customer.", "type": "text"}, "role": "user"}], "resultType": "complete"}}
{"jsonrpc": "2.0", "id": 8, "error": {"code": -32603, "message": "Internal server error"}}
{"jsonrpc": "2.0", "id": 9, "result": {"completion": {"hasMore": false, "values": ["finance"]}, "resultType": "complete"}}
```

What the measured output shows:

1. The decorators turn the function into a prompt. The parameter `audience` has a default, so it became `"required": false`. The SDK sent no argument descriptions, because the code gave none.
2. The rendered prompt is one `user` message with the function's return value as text.
3. A missing required argument gave -32603 "Internal server error". The spec says a server **SHOULD** use -32602 here. Measured on 2026-10-15, the SDK 2.3.0 deviates from that SHOULD.
4. The resource template read worked, and the SDK answered every list and read with `ttlMs: 0` and `cacheScope: "private"`: no caching unless the server sets it.

## 9. Tool, resource or prompt?

| Situation | Primitive | Why |
|---|---|---|
| The model must search, compute or change something | Tool | Only the model knows when it needs the action. |
| Data the user or the host attaches, such as a file, a schema or a ticket | Resource | The host controls size and caching, and can refresh on change. |
| A large or slow-changing dataset that the model sometimes needs | Resource, plus a small search tool | The tool returns a few matches with `resource_link` blocks. The host reads full items only when needed. |
| A workflow that the user starts: "summarize this order", "draft a refund email" | Prompt | The user picks it, and the server ships good wording. |
| A per-request secret or a confirmation | Neither: MRTR elicitation | See [L9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots). |

Interpretation of these notes: many hosts support tools better than resources and prompts. If a host only shows tools to the model, a read-only tool such as `get_order_schema` may be the practical choice. Check what your target hosts support.

## 10. What changed: 2025-11-25 to 2026-07-28

| Topic | 2025-11-25 | 2026-07-28 |
|---|---|---|
| Per-resource updates | `resources/subscribe`, `resources/unsubscribe` on the session | `subscriptions/listen` with `resourceSubscriptions` |
| List changes | sent at any time on the session | only on a `subscriptions/listen` stream that asked for them |
| Notification correlation | none needed | `_meta["io.modelcontextprotocol/subscriptionId"]` |
| Resource not found | -32002 | -32602 (clients still accept -32002) |
| Empty `contents` for a missing resource | not specified | MUST NOT |
| List and read results | no caching fields | `ttlMs` and `cacheScope` required |
| `resources/read`, `prompts/get` | always a final result | may return `InputRequiredResult` (MRTR) |
| Set of resources and prompts | not specified per connection | MUST NOT vary per connection |
| `file://` paths | general validation rule | MUST sanitize against directory traversal |

### Exercises

Put your code in `C:\Users\ASohi\Downloads\AI\agent-harness-lab\llm-systems\mcp_resources.ipynb`.

1. **A safe template resolver.** Write `resolve(uri)` for the template `orders://customers/{customer_id}/summary`. It returns the decoded customer ID, or raises `ValueError` for an unknown URI or an invalid ID.
   - Acceptance test: `orders://customers/CUS-0042/summary` gives `CUS-0042`. These raise `ValueError`: `orders://customers/..%2F..%2Fetc%2Fpasswd/summary`, `orders://customers/CUS-0042%2F..%2F..%2Fx/summary` and `orders://customers/CUS-0042/summary/extra`.
   - Hint 1: decode with `urllib.parse.unquote` before you check.
   - Hint 2: an allow-list regular expression for the ID beats a list of bad strings.
2. **From a prompt to model messages.** Write `prompt_to_anthropic(result)` that turns a `prompts/get` result into Anthropic Messages API messages. Text stays text. An embedded text resource becomes a text block that names its URI. A `resource_link` becomes a short text line. An image becomes an image block with a base64 source. Consecutive messages with the same role merge into one message.
   - Acceptance test: the result of section 6.3 gives one `user` message with two text blocks, and the second block contains `orders://orders/ORD-1001`.
   - Hint 1: each `PromptMessage` has exactly one content block.
   - Hint 2: compare the role with the role of the last message that you built.

## 11. Common mistakes

1. **"Resources are just tools that read data."** The difference is control. The host decides which resources enter the context. The model decides which tools to call.
2. **"Prompt arguments can be any JSON."** `prompts/get` arguments are a map from string to string. Convert numbers and dates to strings.
3. **"A missing resource returns an empty `contents` array."** That is forbidden in 2026-07-28. Return -32602, and accept -32002 from older servers.
4. **"`resources/subscribe` still exists."** It was removed in 2026-07-28. Use `subscriptions/listen` with `resourceSubscriptions`.
5. **"An update notification contains the new content."** It contains only the URI. The client reads the resource again.
6. **"A template variable is safe because it came from a URI."** Matching decodes `%2F` into `/`. Validate every variable with an allow-list.
7. **"Prompts become the system prompt."** A prompt returns `user` and `assistant` messages. The host decides where they go.

## 12. One-minute explanation

Besides tools, an MCP server offers resources and prompts, and the difference is who decides when each is used. Tools are model-controlled, resources are application-driven, and prompts are user-controlled. A resource is data under a URI. `resources/list` lists them, `resources/templates/list` gives RFC 6570 URI templates, and `resources/read` returns text or base64 blob contents. A missing resource gives error -32602 in 2026-07-28, where 2025-11-25 used -32002. For changes, 2025-11-25 used `resources/subscribe` on the session. In 2026-07-28 the client opens `subscriptions/listen` with a filter, the server acknowledges the subset it supports, and it tags each notification with the subscription ID. A prompt is a template with string arguments. `prompts/get` returns `user` and `assistant` messages, and `completion/complete` suggests argument values while the user types. Template variables are decoded from the URI, so the server must validate them against path traversal.

## 13. Check questions

```check
{
  "question": "Name the three server primitives, say who controls each one, and give the methods of each in 2026-07-28.",
  "answer": "Tools are model-controlled: the model decides to call them (`tools/list`, `tools/call`). Resources are application-driven: the host decides which data to attach (`resources/list`, `resources/templates/list`, `resources/read`, and change notifications through `subscriptions/listen`). Prompts are user-controlled: the user picks them, for example as slash commands (`prompts/list`, `prompts/get`, with `completion/complete` for argument suggestions). The spec adds that \"user-controlled\" for prompts \"refers to who decides when the prompt is used, not who authors its content\"."
}
```

```check
{
  "question": "A `resources/read` request asks for a URI that does not exist. What must the server return in 2026-07-28, what did 2025-11-25 use, and why is an empty `contents` array not allowed?",
  "answer": "In 2026-07-28 the server MUST return a JSON-RPC error with code -32602 (Invalid Params), optionally with `data.uri`. Revision 2025-11-25 used -32002, and clients SHOULD still accept -32002 from older servers. The code -32002 stays reserved and is never reused. An empty `contents` array is forbidden for a missing resource because it is ambiguous: it could mean that the resource exists and is empty."
}
```

```check
{
  "question": "Interview follow-up: how does a client learn that `orders://schema` changed, in 2025-11-25 and in 2026-07-28? Write the 2026 messages.",
  "hint": "Which method replaced resources/subscribe?",
  "answer": "In 2025-11-25 the client sent `resources/subscribe` with `{\"uri\": \"orders://schema\"}` on its session, and the server later sent `notifications/resources/updated` with that URI on the same session. `resources/unsubscribe` ended it. In 2026-07-28 there is no session, and both methods are gone. The client sends a long-lived `subscriptions/listen` request with `params.notifications.resourceSubscriptions: [\"orders://schema\"]`. The server first sends `notifications/subscriptions/acknowledged` with the subset it agreed to honor. Later it sends `notifications/resources/updated` with `params.uri`. Its `_meta[\"io.modelcontextprotocol/subscriptionId\"]` equals the JSON-RPC id of the listen request. The client then sends `resources/read` again. The server can end the stream gracefully with a normal result for the listen request. The client ends it by closing the SSE stream on HTTP, or with `notifications/cancelled` on stdio."
}
```

```check
{
  "question": "Interview follow-up: a server exposes the template `file:///{path}` and reads files from disk. A client sends `resources/read` with `file:///..%2F..%2Fetc%2Fpasswd`. What happens, and what must the server do?",
  "hint": "Decode first, then check.",
  "answer": "A template matcher decodes percent-encoding, so the variable `path` becomes `../../etc/passwd`. If the server joins it with its base folder, it reads a file outside the folder. The 2026-07-28 resources page says that servers MUST validate all resource URIs. For `file://` resources they MUST sanitize file paths to prevent directory traversal. The fix: resolve the real path and check that it stays inside the base folder. Compare whole path components, not a string prefix. Reject absolute paths and NUL bytes. Measured in these notes on a similar `orders://` template: the Python SDK 2.3.0 template matcher rejected `..%2F..%2Fetc%2Fpasswd` with -32602. It accepted `a%2F..%2Fb`, which decodes to `a/../b` and stays inside. So the SDK check helps, but the server still owns the file-system check."
}
```

```check
{
  "question": "Interview follow-up: why is `prompts/get` not cacheable in 2026-07-28 while `prompts/list` is? Which list-style results carry `ttlMs` and `cacheScope`?",
  "answer": "A prompt list is metadata that changes rarely, so `ListPromptsResult` extends `CacheableResult` and carries `ttlMs` and `cacheScope`. A `prompts/get` result is the prompt rendered with this request's arguments. The server may also return an `InputRequiredResult` instead. So `GetPromptResult` is a plain `Result` with no caching hints. The cacheable results are `server/discover`, `tools/list`, `prompts/list`, `resources/list`, `resources/templates/list` and `resources/read`. Interim `input_required` results and results of an MRTR retry are never cached."
}
```

```check
{
  "question": "A user types `/explain_order` and starts to type the `audience` argument: `fi`. Write the `completion/complete` request and a valid result. What limits does the result have?",
  "answer": "Request params: `{\"ref\": {\"type\": \"ref/prompt\", \"name\": \"explain_order\"}, \"argument\": {\"name\": \"audience\", \"value\": \"fi\"}}`, plus the required `_meta`. If `order_id` is already chosen, the client adds `\"context\": {\"arguments\": {\"order_id\": \"ORD-1001\"}}`. Result: `{\"resultType\": \"complete\", \"completion\": {\"values\": [\"finance\"], \"hasMore\": false}}`, which is what the SDK server in these notes returned. `values` has at most 100 items. `total` is optional and may be larger than the number of values. `hasMore` says that more options exist. The server must declare the `completions` capability."
}
```

```check
{
  "question": "Interview follow-up: you have a 2 MB product catalog that the model sometimes needs. Do you expose it as a tool, a resource or a prompt? Defend the choice.",
  "answer": "As a resource, plus a small search tool. The catalog is data, and resources are application-driven. The host can show it in a picker and attach only the parts the user selects. It can cache it with `ttlMs` and `cacheScope`, and refresh it when `notifications/resources/updated` arrives. A tool that returns 2 MB would put the whole catalog into the model input on every call. A prompt is a user-picked template, not a data store. For model-driven lookups, add a tool such as `search_products(query, limit)`. It returns a few matches with `resource_link` blocks, and the host reads a full item only when needed."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\nimport re\nfrom urllib.parse import unquote\n\nTEMPLATE = re.compile(r\"^orders://customers/([^/]+)/summary$\")\nCUSTOMER_ID = re.compile(r\"^CUS-[0-9]{4}$\")\n\ndef resolve(uri: str) -> str:\n    \"\"\"Return the customer ID for a summary URI, or raise ValueError.\"\"\"\n    m = TEMPLATE.match(uri)\n    if not m:\n        raise ValueError(f\"unknown resource: {uri}\")\n    customer_id = unquote(m.group(1))                # decode %2F, %20, ...\n    if not CUSTOMER_ID.match(customer_id):            # allow-list, not a block-list\n        raise ValueError(f\"invalid customer_id: {customer_id!r}\")\n    return customer_id\n```\n\nThe three attacks fail (measured):\n\n```text\norders://customers/..%2F..%2Fetc%2Fpasswd/summary -> ValueError: invalid customer_id: '../../etc/passwd'\norders://customers/CUS-0042%2F..%2F..%2Fx/summary -> ValueError: invalid customer_id: 'CUS-0042/../../x'\norders://customers/CUS-0042/summary/extra -> ValueError: unknown resource: orders://customers/CUS-0042/summary/extra\n```\n\nThe allow-list pattern `^CUS-[0-9]{4}$` makes traversal impossible, because neither `/` nor `.` can appear in an ID."
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\ndef prompt_to_anthropic(result: dict) -> list[dict]:\n    \"\"\"Turn a prompts/get result into Anthropic Messages API messages.\"\"\"\n    messages = []\n    for m in result[\"messages\"]:\n        c = m[\"content\"]\n        if c[\"type\"] == \"text\":\n            block = {\"type\": \"text\", \"text\": c[\"text\"]}\n        elif c[\"type\"] == \"image\":\n            block = {\"type\": \"image\", \"source\": {\"type\": \"base64\", \"media_type\": c[\"mimeType\"], \"data\": c[\"data\"]}}\n        elif c[\"type\"] == \"resource\" and \"text\" in c[\"resource\"]:\n            block = {\"type\": \"text\", \"text\": f\"<resource uri=\\\"{c['resource']['uri']}\\\">\\n{c['resource']['text']}\\n</resource>\"}\n        elif c[\"type\"] == \"resource_link\":\n            block = {\"type\": \"text\", \"text\": f\"[resource link] {c['name']}: {c['uri']}\"}\n        else:\n            raise ValueError(f\"unsupported content: {c['type']}\")\n        if messages and messages[-1][\"role\"] == m[\"role\"]:\n            messages[-1][\"content\"].append(block)       # merge consecutive messages of one role\n        else:\n            messages.append({\"role\": m[\"role\"], \"content\": [block]})\n    return messages\n```\n\nOutput for the `prompts/get` result of section 6.3 (measured): one user message with two content blocks, because the two prompt messages have the same role.\n\n```json\n[\n  {\n    \"role\": \"user\",\n    \"content\": [\n      {\n        \"type\": \"text\",\n        \"text\": \"Explain the status of order ORD-1001 to a customer. Use short sentences.\"\n      },\n      {\n        \"type\": \"text\",\n        \"text\": \"<resource uri=\\\"orders://orders/ORD-1001\\\">\\n{\\\"order_id\\\": \\\"ORD-1001\\\", \\\"status\\\": \\\"shipped\\\", \\\"carrier\\\": \\\"UPS\\\"}\\n</resource>\"\n      }\n    ]\n  }\n]\n```"
}
```

## 14. Links

- Previous: [L7: JSON Schema for tool arguments](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments)
- Next: [L9: Asking the client for input: MRTR, elicitation, sampling and roots](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots)
- [L1: Why MCP exists](/notes/ai/llm-systems/07-mcp/l1-why-mcp): the three primitives in context
- [L5: Stateful vs stateless MCP](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless): why sessions and subscriptions changed
- [L10: Utilities and errors](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors): pagination, cancellation and the error code table
- [L13: Build an MCP server and client](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server)
- Older lesson: [MCP: the protocol](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol)

### Sources

All checked on 2026-10-15.

- MCP specification 2026-07-28, Resources: https://modelcontextprotocol.io/specification/2026-07-28/server/resources
- MCP specification 2025-11-25, Resources: https://modelcontextprotocol.io/specification/2025-11-25/server/resources
- MCP specification 2026-07-28, Prompts: https://modelcontextprotocol.io/specification/2026-07-28/server/prompts
- MCP specification 2026-07-28, Completion: https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/completion
- MCP specification 2026-07-28, Subscriptions: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions
- MCP specification 2026-07-28, Caching: https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching
- MCP specification 2026-07-28, Key Changes: https://modelcontextprotocol.io/specification/2026-07-28/changelog
- MCP `schema.ts` and `schema.json`: https://github.com/modelcontextprotocol/modelcontextprotocol/tree/main/schema
- RFC 6570 (URI Template): https://www.rfc-editor.org/rfc/rfc6570 and RFC 3986 (URI): https://www.rfc-editor.org/rfc/rfc3986
- MCP Python SDK 2.3.0 on PyPI: https://pypi.org/project/mcp/
