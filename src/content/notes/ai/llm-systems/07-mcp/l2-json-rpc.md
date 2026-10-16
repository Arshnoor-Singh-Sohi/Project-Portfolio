---
title: "L2: JSON-RPC 2.0 from zero"
order: 2
summary: "JSON from its six types, remote procedure calls, and the four JSON-RPC 2.0 message shapes that every MCP message uses: request, result, error and notification. The id rules in each MCP revision, the error codes and MCP's own range, why batching came and went, and real annotated traces."
status: not-started
tags: [mcp, json-rpc, json, errors, protocol]
---

## 1. The question this idea answers

Two programs must cooperate. The host asks a server "list your tools" and later "run `count_orders` for plant B". The server must know which function to run and with which inputs. The host must know which answer belongs to which question, because several questions can be in flight at once. Both sides must report failures in a form that the other side can read.

All of this travels as plain text. MCP does not invent its own format for it. It uses JSON-RPC 2.0, a small standard from 2010. This lesson builds JSON-RPC from zero. It starts with JSON and the idea of a remote call. Then it covers the four message shapes, the id rules, the error codes and the history of batching in MCP.

## 2. Mental model

> [!analogy] Numbered tickets at a deli counter
> You take a numbered ticket and say "200 grams of cheese, please". The clerk works on several orders at once. When your cheese is ready, the clerk calls your number, not your name, and not in the order people arrived. The ticket number is the JSON-RPC `id`. The order is the `method` with its `params`. The cheese is the `result`. "Sorry, no cheese left" is an `error` with the same number. A shout of "the store closes at six" is a notification: nobody gets a ticket for it, and nobody answers it.
>
> **Where it stops working:** (1) At a deli, the clerk never hands you a ticket. In MCP revision 2025-11-25 the server could also send its own requests to the client, so both sides issued numbers. Revision 2026-07-28 forbids that again. (2) A deli number is reused every day. MCP forbids an id that is still waiting for its answer. (3) A deli clerk can ignore a badly written order. A JSON-RPC server must answer a broken request with a specific error code.

## 3. Terms

| Term | Plain meaning |
|---|---|
| JSON | JavaScript Object Notation: a text format for data with four primitive types and two structured types. |
| JSON object | An unordered set of name-value pairs in braces, for example `{"plant": "B"}`. |
| JSON array | An ordered list of values in brackets, for example `[1, 2, 3]`. |
| UTF-8 | The byte encoding of text that MCP requires. One character takes one to four bytes. |
| remote procedure call (RPC) | Calling a function that runs in another process or on another machine, by sending its name and inputs as a message. |
| JSON-RPC 2.0 | A small standard for RPC with JSON messages. The current text is from 2010-03-26, updated 2013-01-04. |
| request | A message that asks the receiver to run a method. It has an `id` and expects exactly one response. |
| response | The answer to a request: either a result or an error, with the same `id` as the request. |
| result | The success part of a response. In MCP it is always a JSON object. |
| error object | The failure part of a response, with an integer `code`, a string `message` and optional `data`. |
| notification | A request without an `id`. The receiver never answers it. |
| method | The name of the operation, for example `tools/call`. |
| params | The inputs of a method. In MCP they are always a JSON object (named parameters). |
| `id` | The number or string that ties a response to its request. MCP forbids `null`. |
| batch | A JSON array of several messages sent at once. MCP allowed it only in revision 2025-03-26. |
| error code | An integer that names the kind of failure, for example -32601 "Method not found". |
| `_meta` | A reserved object inside params and results for protocol metadata. In 2026-07-28 every request needs it. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. JSON from zero

### 4.1 Six types

The JSON-RPC specification puts it in one sentence: "JSON can represent four primitive types (Strings, Numbers, Booleans, and Null) and two structured types (Objects and Arrays)."

| JSON type | Example | Python type after `json.loads` |
|---|---|---|
| String | `"count_orders"` | `str` |
| Number | `412`, `-32601`, `0.5` | `int` or `float` |
| Boolean | `true`, `false` | `bool` |
| Null | `null` | `None` |
| Object | `{"plant": "B", "date": "2026-10-14"}` | `dict` |
| Array | `["plant", "date"]` | `list` |

Three details matter later:

1. **Object keys are strings.** `{"1": 5}` is valid JSON. `{1: 5}` is not.
2. **Whitespace between tokens does not matter.** A JSON message can be pretty-printed over many lines, or written on one line. The two forms mean the same data.
3. **A newline inside a string is written as two characters, a backslash and `n`.** So any JSON value can be written on one line. The stdio transport depends on this: one message per line (lesson [L4](/notes/ai/llm-systems/07-mcp/l4-transports)).

### 4.2 From characters to bytes

A network or a pipe carries bytes, not characters. MCP says: "JSON-RPC messages **MUST** be UTF-8 encoded". UTF-8 uses one byte for each ASCII character and two to four bytes for other characters.

> [!example] Worked example: characters against bytes
> - `"B"` is 1 character and 1 byte: `0x42`.
> - `"Café"` is 4 characters and 5 bytes, because `é` takes 2 bytes: `0xC3 0xA9`.
> - `"世界"` is 2 characters and 6 bytes: 3 bytes each.
> - The one-line message `{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"count_orders","arguments":{"plant":"B","date":"2026-10-14"}}}` is 125 characters and 125 bytes, because every character is ASCII.
>
> These counts were computed with Python's `len(s)` and `len(s.encode("utf-8"))`.

### 4.3 Python traps when you parse JSON

> [!trap] Two traps in Python
> 1. `bool` is a subclass of `int` in Python. `isinstance(True, int)` is `True`. A check "is the id an integer?" must exclude `bool` explicitly.
> 2. `json.loads("1.0")` returns the float `1.0`. JSON Schema 2020-12 still calls `1.0` an integer. In a test of these notes, the official MCP `schema.json` accepted `"id": 1.0` and rejected `"id": 1.5` and `"id": true`.

## 5. Remote procedure calls from zero

A local function call happens inside one process. The caller jumps into the function, and the function returns its value on the same thread. Nothing can get lost.

A remote procedure call crosses a process boundary. The caller must turn the call into a message, send it, and wait. Four questions appear at once:

1. **Which function?** The message must name it: the `method`.
2. **Which inputs?** The message must carry them: the `params`.
3. **Which answer is mine?** If several calls are in flight, answers can arrive in any order. Each call needs a label: the `id`.
4. **How do I learn about a failure?** The answer must have a standard error form: the `error` object with a `code`.

JSON-RPC 2.0 answers exactly these four questions and nothing else. Its overview says: "JSON-RPC is a stateless, light-weight remote procedure call (RPC) protocol." It also says: "It is transport agnostic". The same messages work over a pipe, a socket or HTTP. MCP adds method names, fields and rules on top, but every MCP message is a valid JSON-RPC 2.0 message.

Note the word "stateless". JSON-RPC itself keeps no memory between calls. MCP revision 2025-11-25 added a stateful lifecycle on top of it (lesson [L3](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol)). Revision 2026-07-28 removed that layer again (lesson [L5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless)).

> [!key] The main idea of sections 4 and 5
> JSON gives the data types. JSON-RPC 2.0 gives four message shapes that answer four questions: which function, which inputs, which answer belongs to which call, and what went wrong. MCP is a set of method names and rules on top of those shapes.

## 6. The four message shapes

![Alt text: the four JSON-RPC message shapes with their fields, where a request gets one response with the same id and a notification gets none.](/notes/media/llm-systems/figures/07-2-json-rpc-message-shapes.svg)

### 6.1 Request

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "count_orders",
    "arguments": { "plant": "B", "date": "2026-10-14" },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

| Field | JSON-RPC 2.0 rule | Extra MCP rule |
|---|---|---|
| `jsonrpc` | The string `"2.0"`, always | Same |
| `id` | "String, Number, or NULL" if included. Null is "discouraged". Numbers "SHOULD NOT contain fractional parts". | "string or integer". "Unlike base JSON-RPC, the ID **MUST NOT** be `null`." |
| `method` | A string. Names that begin with `rpc.` are reserved. | MCP method names, for example `tools/list`, `tools/call`, `server/discover` |
| `params` | Optional. Either an array (by position) or an object (by name). | Always an object (by name). In 2026-07-28, `params._meta` is required on every request. |

### 6.2 Result response

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "resultType": "complete",
    "content": [{ "type": "text", "text": "412" }],
    "isError": false
  }
}
```

- The `id` "MUST be the same as the value of the id member in the Request Object" (JSON-RPC 2.0).
- "Either the result member or error member MUST be included, but both members MUST NOT be included."
- MCP: "The `result` **MAY** follow any JSON object structure". In 2026-07-28 it **MUST** include `resultType`: `"complete"` or `"input_required"`. A client **MUST** treat a missing `resultType` from an older server as `"complete"`.

### 6.3 Error response

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "error": {
    "code": -32601,
    "message": "Method not found",
    "data": "ping"
  }
}
```

| Field | Meaning |
|---|---|
| `code` | "A Number that indicates the error type that occurred." MCP: "Error codes **MUST** be integers." |
| `message` | "A String providing a short description of the error." The MCP schema adds: "SHOULD be limited to a concise single sentence." |
| `data` | Optional. "A Primitive or Structured value that contains additional information about the error." |

The `id` has a special rule. If the receiver could not read the id, for example because the JSON was broken, JSON-RPC 2.0 says the id "MUST be Null". The MCP schema says something different: the error response `id` is optional, and if present it must be a string or an integer.

> [!note] Measured: the null id
> In a test of these notes, the official MCP `schema.json` (2026-07-28) rejected `{"jsonrpc": "2.0", "id": null, "error": {...}}` with the message "None is not of type 'string', 'integer'". It accepted the same message without the `id` key. The Python SDK 2.3.0, served over HTTP, sent `"id": null` for a parse error and for an unknown session. Interpretation of these notes: a client should accept both forms, and a server should omit the id to follow the MCP schema.

### 6.4 Notification

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/cancelled",
  "params": { "requestId": 3, "reason": "User pressed stop" }
}
```

- "A Notification is a Request object without an "id" member."
- "The Server MUST NOT reply to a Notification, including those that are within a batch request." MCP: "The receiver **MUST NOT** send a response."
- So a notification never produces an error message either, even when it is invalid. The MCP cancellation page says: "Invalid cancellation notifications **SHOULD** be ignored".

Who sends which notifications depends on the revision:

| Direction | 2025-11-25 | 2026-07-28 |
|---|---|---|
| Client to server | `notifications/initialized`, `notifications/cancelled`, `notifications/progress`, `notifications/roots/list_changed`, `notifications/tasks/status` | Only `notifications/cancelled`, and only on stdio |
| Server to client | `notifications/progress`, `notifications/message`, the `list_changed` and `resources/updated` notifications, `notifications/elicitation/complete`, `notifications/cancelled`, `notifications/tasks/status` | `notifications/progress`, `notifications/message`, the `list_changed` and `resources/updated` notifications, `notifications/subscriptions/acknowledged`, and `notifications/cancelled` only to end a subscription on stdio |

Source: the `ClientNotification` and `ServerNotification` unions in `schema.ts` of each revision, checked on 2026-10-15.

## 7. IDs in depth

### 7.1 The rules in each revision

| Revision | Rule for a request id (quoted from the base protocol page) |
|---|---|
| JSON-RPC 2.0 | "MUST contain a String, Number, or NULL value if included" |
| 2024-11-05 | "Must include unique ID and method name" |
| 2025-03-26 to 2025-11-25 | "string or integer". "MUST NOT be `null`". "MUST NOT have been previously used by the requestor within the same session." |
| 2026-07-28 | "string or integer". "MUST NOT be `null`". "MUST NOT match the ID of any other request the sender has issued and not yet received a response for." |

Why did the 2026 wording change? Revision 2026-07-28 removed sessions, so "within the same session" no longer had a meaning. SEP-2567 rescoped the rule to requests that are still pending. It adds that this "is what the TypeScript and Python SDKs already do via a monotonically increasing counter per client object". The id only needs to be unique among the requests that wait for an answer, because its only job is correlation.

### 7.2 Correlation in code

This client sends three requests, and the server answers in the order 3, 1, 2. The client still returns each answer to the right caller.

```python
import asyncio, itertools, json

class Client:
    def __init__(self, send):
        self._send = send                      # function that writes one line
        self._ids = itertools.count(1)         # 1, 2, 3, ... never reused while pending
        self._pending = {}                     # id -> Future that waits for the answer

    async def request(self, method, params):
        rid = next(self._ids)
        fut = asyncio.get_running_loop().create_future()
        self._pending[rid] = fut
        self._send(json.dumps({"jsonrpc": "2.0", "id": rid, "method": method, "params": params}))
        return await fut                       # wait until on_line() resolves it

    def on_line(self, line):
        msg = json.loads(line)
        fut = self._pending.pop(msg["id"])     # match by id, not by arrival order
        if "error" in msg:
            fut.set_exception(RuntimeError(msg["error"]["message"]))
        else:
            fut.set_result(msg["result"])
```

Output of the full script in a test of these notes:

```text
sent ids: [1, 2, 3]
arrived id 3
arrived id 1
arrived id 2
results in request order: [{'count': 120}, {'count': 412}, {'count': 7}]
```

How it works, line by line:

- `itertools.count(1)` gives a new integer for each request. This is the monotonic counter that SEP-2567 describes.
- `self._pending` maps each waiting id to an `asyncio.Future`. A future is an object that holds a value that does not exist yet.
- `request()` stores the future, writes the message, and waits on the future.
- `on_line()` reads one response, removes its future from the map with `pop`, and puts the result or the error into it. The waiting `request()` call then resumes.
- `pop` also enforces the 2026 rule: after the answer arrives, the id is free, and no stale entry stays in the map.

### 7.3 Edge cases that interviewers like

1. **`1` and `"1"` are different ids.** One is a number and one is a string. The response must carry "the same" value, so a server must echo the type too.
2. **Retries need new ids.** In the Multi Round-Trip Requests pattern of 2026-07-28, the spec says: "The JSON-RPC `id` **MUST** be different between the initial request and the retry, as they are independent requests."
3. **The same number in both directions (2025-11-25).** The client and the server each issued their own ids. Interpretation of these notes: a client request with id 1 and a server request with id 1 do not clash. A response differs from a request by its fields: it has `result` or `error`, and a request has `method`. Each side matches responses only against its own pending requests.
4. **A broken stream loses the request.** In 2026-07-28 Streamable HTTP, "clients **MUST** re-issue it as a new request with a new request ID".

## 8. Error codes

### 8.1 The JSON-RPC 2.0 codes

JSON-RPC reserves "-32768 to -32000" for pre-defined errors:

| Code | Message | Meaning (quoted) |
|---|---|---|
| -32700 | Parse error | "Invalid JSON was received by the server." |
| -32600 | Invalid Request | "The JSON sent is not a valid Request object." |
| -32601 | Method not found | "The method does not exist / is not available." |
| -32602 | Invalid params | "Invalid method parameter(s)." |
| -32603 | Internal error | "Internal JSON-RPC error." |
| -32000 to -32099 | Server error | "Reserved for implementation-defined server-errors." |

How MCP uses them, from the comments in `schema.ts` (2026-07-28):

- **-32601** also covers a method "gated behind a server capability the server did not advertise (e.g., calling `prompts/list` when the `prompts` capability was not advertised)".
- **-32602** covers several cases. They are an unknown tool name, invalid tool arguments at the protocol level, an unknown prompt, and an invalid or expired pagination cursor. Since 2026-07-28 it also covers an unknown resource and a request without the required `_meta` fields.

### 8.2 MCP's own codes and the range policy

Revision 2026-07-28 split the JSON-RPC server-error range:

| Range or code | Meaning in 2026-07-28 |
|---|---|
| -32000 to -32019 | Legacy, implementation-defined. "New codes **MUST NOT** be allocated in this sub-range". |
| -32020 to -32099 | "reserved for the MCP specification" |
| -32020 | `HeaderMismatch`: HTTP headers do not match the body (lesson L4) |
| -32021 | `MissingRequiredClientCapability`: the request needs a client capability that the client did not declare |
| -32022 | `UnsupportedProtocolVersion`: `data` lists `supported` versions and the `requested` version |
| -32002 | Retired: "resource not found (2025-11-25 and earlier; replaced by `-32602`)". Clients SHOULD still accept it from old servers. |
| -32042 | Retired: "URL elicitation required (2025-11-25 only)" |

During the draft of 2026-07-28 the three new codes had other numbers. The changelog lists the renumbering: `HeaderMismatch` -32001 to -32020, `MissingRequiredClientCapability` -32003 to -32021, `UnsupportedProtocolVersion` -32004 to -32022. Old blog posts or early SDK builds may show the draft numbers.

### 8.3 Protocol errors against tool errors

Not every failure is a JSON-RPC error. The `CallToolResult` comment in the schema says that errors from the tool itself "SHOULD be reported inside the result object, with `isError` set to true, _not_ as an MCP protocol-level error response. Otherwise, the LLM would not be able to see that an error occurred and self-correct."

| Failure | Where it goes | Why |
|---|---|---|
| Broken JSON, unknown method, missing `_meta` | JSON-RPC `error` | The protocol exchange itself failed. The host handles it. |
| Unknown tool name | JSON-RPC `error` (-32602) | The schema puts errors in "_finding_ the tool" here. |
| The database query hit its time limit inside the tool | `result` with `isError: true` | The model reads the text and can try again or choose another path. |
| The model sent a wrong date format | `result` with `isError: true` | Since 2025-11-25, input validation errors are tool execution errors "to enable model self-correction" (SEP-1303). |

Lesson [L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) covers tool results in full.

## 9. Batching: added in 2025-03-26, removed in 2025-06-18

A JSON-RPC batch is an array of messages. The JSON-RPC rules are: "The Server should respond with an Array containing the corresponding Response objects". There are no responses for notifications. Responses "MAY be returned in any order within the Array", so the client matches them by id. An empty array gets one `Invalid Request` error.

MCP's history with batches:

| Revision | Rule |
|---|---|
| 2024-11-05 | The base page does not mention batches. |
| 2025-03-26 | "MCP implementations **MAY** support sending JSON-RPC batches, but **MUST** support receiving JSON-RPC batches." |
| 2025-06-18 | Changelog: "Remove support for JSON-RPC batching" (PR #416). |
| 2025-11-25 and 2026-07-28 | No batches. Streamable HTTP: "The body of the HTTP POST **MUST** be a single JSON-RPC _request_ or _notification_." |

The changelog gives no reason for the removal. Interpretation of these notes: a batch mixes several requests in one HTTP body. That complicates per-request rules that MCP later added, such as per-request cancellation, request-scoped streams, and routing headers that name one method.

> [!note] Measured: what a current server does with a batch
> In a test of these notes, a Python SDK 2.3.0 server over Streamable HTTP answered a one-element batch with HTTP 400 and `{"jsonrpc":"2.0","error":{"code":-32600,"message":"Body must be a single JSON-RPC request or notification object"},"id":null}`. Over stdio, the same server wrote nothing at all for a batch, for broken JSON, and for a request with `"id": null`.

## 10. Annotated traces from a real server

These lines were sent to and received from a small Python SDK 2.3.0 server over stdio in a test of these notes. `>>` marks a line that the client wrote. `<<` marks a line that the server wrote. Long results are trimmed with `...`.

**Revision 2025-11-25 (stateful):**

```text
>> {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"demo-host","version":"0.1.0"}}}
<< {"jsonrpc":"2.0","id":1,"result":{"capabilities":{...},"protocolVersion":"2025-11-25","serverInfo":{"name":"orders","version":""}}}
>> {"jsonrpc":"2.0","method":"notifications/initialized"}
>> {"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"count_orders","arguments":{"plant":"B","date":"2026-10-14"}}}
<< {"jsonrpc":"2.0","id":3,"result":{"content":[{"text":"412","type":"text"}],"isError":false,"structuredContent":{"result":412}}}
>> {"jsonrpc":"2.0","id":4,"method":"ping"}
<< {"jsonrpc":"2.0","id":4,"result":{}}
```

1. Line 1 is a request with id 1. Its answer is the first `<<` line with id 1.
2. Line 3 is a notification: no id, and no answer follows.
3. The `tools/call` result has no `resultType`, because 2025-11-25 did not define it.
4. `ping` returns an empty object `{}`: a valid result with no data.

**Revision 2026-07-28 (stateless):**

```text
>> {"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"count_orders","arguments":{"plant":"B","date":"2026-10-14"},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{},"io.modelcontextprotocol/clientInfo":{"name":"demo-host","version":"0.1.0"}}}}
<< {"jsonrpc":"2.0","id":3,"result":{"content":[{"text":"412","type":"text"}],"isError":false,"resultType":"complete","structuredContent":{"result":412},"_meta":{"io.modelcontextprotocol/serverInfo":{"name":"orders","version":""}}}}
>> {"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"count_orders","arguments":{"plant":"B","date":"2026-10-14"}}}
<< {"jsonrpc":"2.0","id":4,"error":{"code":-32602,"message":"params._meta must be an object carrying the required 'io.modelcontextprotocol/protocolVersion' and 'io.modelcontextprotocol/clientCapabilities' envelope keys"}}
>> {"jsonrpc":"2.0","id":5,"method":"tools/call","params":{...,"_meta":{"io.modelcontextprotocol/protocolVersion":"2030-01-01","io.modelcontextprotocol/clientCapabilities":{}}}}
<< {"jsonrpc":"2.0","id":5,"error":{"code":-32022,"message":"Unsupported protocol version","data":{"supported":["2026-07-28"],"requested":"2030-01-01"}}}
>> {"jsonrpc":"2.0","id":6,"method":"ping","params":{"_meta":{...}}}
<< {"jsonrpc":"2.0","id":6,"error":{"code":-32601,"message":"Method not found","data":"ping"}}
```

1. The first call needs no handshake. Its `_meta` carries the version and the capabilities.
2. The result now has `resultType: "complete"` and the server's identity in `result._meta`.
3. A call without `_meta` is malformed: error -32602, as the spec requires.
4. An unknown version gets -32022 with the `supported` list, so the client can retry.
5. `ping` was removed in 2026-07-28, so it is now an unknown method: -32601.

## 11. Code: a minimal JSON-RPC dispatcher

This dispatcher handles one incoming line under MCP's rules. It shows where each standard error code is produced.

```python
import json

PARSE_ERROR, INVALID_REQUEST, METHOD_NOT_FOUND, INVALID_PARAMS, INTERNAL_ERROR = (
    -32700, -32600, -32601, -32602, -32603)

class InvalidParams(Exception):
    pass

def count_orders(params):
    plant = params.get("plant")
    if not isinstance(plant, str):
        raise InvalidParams("plant must be a string")
    return {"count": {"B": 412}.get(plant, 0)}

METHODS = {"count_orders": count_orders}

def error(id_, code, message, data=None):
    err = {"code": code, "message": message}
    if data is not None:
        err["data"] = data
    resp = {"jsonrpc": "2.0", "error": err}
    if id_ is not None:          # MCP schema: omit an unreadable id (JSON-RPC 2.0 itself says null)
        resp["id"] = id_
    return resp

def handle(line: str):
    """Return the response object for one incoming line, or None for a notification."""
    try:
        msg = json.loads(line)                                   # 1. parse the text
    except json.JSONDecodeError as e:
        return error(None, PARSE_ERROR, "Parse error", str(e))   # id unknown
    if not isinstance(msg, dict):                                # MCP: no batch arrays
        return error(None, INVALID_REQUEST, "Invalid Request", "expected one object")
    if msg.get("jsonrpc") != "2.0" or not isinstance(msg.get("method"), str):
        return error(msg.get("id"), INVALID_REQUEST, "Invalid Request")
    is_notification = "id" not in msg                            # 2. no id: no reply
    if not is_notification and (msg["id"] is None or isinstance(msg["id"], (bool, float, dict, list))):
        return error(None, INVALID_REQUEST, "Invalid Request", "id must be a string or integer")
    params = msg.get("params", {})
    if not isinstance(params, dict):                             # MCP params: by name
        return None if is_notification else error(msg["id"], INVALID_PARAMS, "Invalid params")
    fn = METHODS.get(msg["method"])
    if fn is None:
        return None if is_notification else error(msg["id"], METHOD_NOT_FOUND, "Method not found", msg["method"])
    try:
        result = fn(params)                                      # 3. run the method
    except InvalidParams as e:
        return None if is_notification else error(msg["id"], INVALID_PARAMS, "Invalid params", str(e))
    except Exception:
        return None if is_notification else error(msg["id"], INTERNAL_ERROR, "Internal error")
    return None if is_notification else {"jsonrpc": "2.0", "id": msg["id"], "result": result}
```

Output for seven test lines in a test of these notes:

```text
{"jsonrpc": "2.0", "id": 1, "result": {"count": 412}}
{"jsonrpc": "2.0", "error": {"code": -32602, "message": "Invalid params", "data": "plant must be a string"}, "id": 2}
{"jsonrpc": "2.0", "error": {"code": -32601, "message": "Method not found", "data": "delete_orders"}, "id": 3}
null
{"jsonrpc": "2.0", "error": {"code": -32700, "message": "Parse error", "data": "Expecting value: line 1 column 58 (char 57)"}}
{"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request", "data": "expected one object"}}
{"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request", "data": "id must be a string or integer"}}
```

The important lines:

- **Parse first.** If `json.loads` fails, the dispatcher cannot know the id, so the error has no id.
- **Reject arrays.** MCP has no batches since 2025-06-18, so an array is an invalid request.
- **Decide "notification or request" by the presence of the key `id`, not by its value.** `"id": null` is a request with a forbidden id, not a notification.
- **Never answer a notification.** Every error path returns `None` when `is_notification` is true. The fourth output line, `null`, is the notification.
- **Separate -32602 from -32603.** -32602 means "your inputs are wrong". -32603 means "I failed". A client can fix the first, but not the second.
- **The last `return`** echoes `msg["id"]` unchanged, with its type.

### Exercises

Lab folder: `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, notebook folder `llm-systems/`, notebook `07-mcp-l2.ipynb`.

1. **A message classifier.** Write `classify(msg)` that returns `"request"`, `"notification"`, `"result"` or `"error"` under MCP rules, or raises `ValueError` with the broken rule. Acceptance tests: a batch array, `"id": null`, `"id": 1.5`, `"id": true`, a response with both `result` and `error`, array `params`, and `"jsonrpc": "1.0"` all raise. An error response without an id is valid. Hint 1: decide first between "has `method`" and "is a response". Hint 2: remember that `bool` is an `int` in Python.
2. **Correlation with failures.** Extend the `Client` of section 7.2. Add a timeout per request with `asyncio.wait_for`. On a timeout, remove the id from `_pending` and raise `TimeoutError`. Ignore a response whose id is unknown. Acceptance test: a late answer for a timed-out id does not raise `KeyError`, and `_pending` is empty at the end. Hint 1: use `dict.pop(key, None)`. Hint 2: put the cleanup in a `finally` block.
3. **Write the error responses.** For each input, write the exact response, or write "no response". The inputs: (a) `{"jsonrpc":"2.0","id":9,"method":"tools/lst","params":{}}`, (b) `{"jsonrpc":"2.0","method":"tools/lst"}`, (c) `{"jsonrpc":"2.0","id":9,"method":"tools/call","params":["count_orders"]}`, (d) the text `{"jsonrpc":"2.0",` and nothing else. Acceptance test: each answer names the code and the id handling. Hint 1: a notification never gets a response. Hint 2: what can the server know about the id in (d)?

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```python\ndef _valid_id(v):\n    # MCP: string or integer. bool is a subclass of int in Python, so exclude it.\n    return isinstance(v, str) or (isinstance(v, int) and not isinstance(v, bool))\n\ndef classify(msg):\n    \"\"\"Return 'request', 'notification', 'result' or 'error' under MCP rules.\"\"\"\n    if isinstance(msg, list):\n        raise ValueError(\"batch arrays are not allowed (removed in 2025-06-18)\")\n    if not isinstance(msg, dict):\n        raise ValueError(\"a message must be a JSON object\")\n    if msg.get(\"jsonrpc\") != \"2.0\":\n        raise ValueError('jsonrpc must be the string \"2.0\"')\n    if \"method\" in msg:\n        if \"result\" in msg or \"error\" in msg:\n            raise ValueError(\"a request or notification has no result or error\")\n        if not isinstance(msg[\"method\"], str):\n            raise ValueError(\"method must be a string\")\n        if \"params\" in msg and not isinstance(msg[\"params\"], dict):\n            raise ValueError(\"MCP params must be an object\")\n        if \"id\" not in msg:\n            return \"notification\"\n        if not _valid_id(msg[\"id\"]):\n            raise ValueError(\"request id must be a string or integer, never null\")\n        return \"request\"\n    has_result, has_error = \"result\" in msg, \"error\" in msg\n    if has_result == has_error:\n        raise ValueError(\"a response has exactly one of result and error\")\n    if has_result:\n        if not _valid_id(msg.get(\"id\")):\n            raise ValueError(\"a result response needs the id of its request\")\n        if not isinstance(msg[\"result\"], dict):\n            raise ValueError(\"result must be an object\")\n        return \"result\"\n    err = msg[\"error\"]\n    if \"id\" in msg and not _valid_id(msg[\"id\"]):\n        raise ValueError(\"an error id must be a string or integer, or be omitted\")\n    if not (isinstance(err, dict) and isinstance(err.get(\"code\"), int)\n            and not isinstance(err.get(\"code\"), bool) and isinstance(err.get(\"message\"), str)):\n        raise ValueError(\"error needs an integer code and a string message\")\n    return \"error\"\n\n# acceptance tests\nok = [\n    ({\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/list\", \"params\": {}}, \"request\"),\n    ({\"jsonrpc\": \"2.0\", \"id\": \"a-7\", \"method\": \"tools/call\"}, \"request\"),\n    ({\"jsonrpc\": \"2.0\", \"method\": \"notifications/cancelled\", \"params\": {\"requestId\": 1}}, \"notification\"),\n    ({\"jsonrpc\": \"2.0\", \"id\": 1, \"result\": {\"resultType\": \"complete\"}}, \"result\"),\n    ({\"jsonrpc\": \"2.0\", \"error\": {\"code\": -32700, \"message\": \"Parse error\"}}, \"error\"),\n]\nbad = [\n    [{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"ping\"}],\n    {\"jsonrpc\": \"2.0\", \"id\": None, \"method\": \"tools/list\"},\n    {\"jsonrpc\": \"2.0\", \"id\": 1.5, \"method\": \"tools/list\"},\n    {\"jsonrpc\": \"2.0\", \"id\": True, \"method\": \"tools/list\"},\n    {\"jsonrpc\": \"2.0\", \"id\": 1, \"result\": {}, \"error\": {\"code\": 1, \"message\": \"x\"}},\n    {\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/list\", \"params\": [1, 2]},\n    {\"jsonrpc\": \"1.0\", \"id\": 1, \"method\": \"tools/list\"},\n    {\"jsonrpc\": \"2.0\", \"id\": None, \"error\": {\"code\": -32700, \"message\": \"Parse error\"}},\n]\nfor m, want in ok:\n    assert classify(m) == want, (m, want)\nfor m in bad:\n    try:\n        classify(m)\n        raise AssertionError(f\"accepted {m}\")\n    except ValueError as e:\n        print(\"rejected:\", e)\nprint(\"all tests pass\")\n```\n\nRunning it prints the eight rejection reasons and `all tests pass`. The order of the checks matters: first the shape (object, not array), then `jsonrpc`, then the split between messages with `method` and responses. The `_valid_id` helper excludes `bool` because `True` is an `int` in Python."
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\nimport asyncio, itertools, json\n\nclass Client:\n    def __init__(self, send, timeout_s=5.0):\n        self._send = send\n        self._ids = itertools.count(1)\n        self._pending = {}\n        self._timeout_s = timeout_s\n\n    async def request(self, method, params):\n        rid = next(self._ids)\n        fut = asyncio.get_running_loop().create_future()\n        self._pending[rid] = fut\n        self._send(json.dumps({\"jsonrpc\": \"2.0\", \"id\": rid, \"method\": method, \"params\": params}))\n        try:\n            return await asyncio.wait_for(fut, self._timeout_s)\n        finally:\n            self._pending.pop(rid, None)      # always free the id: answer, error or timeout\n\n    def on_line(self, line):\n        msg = json.loads(line)\n        fut = self._pending.pop(msg.get(\"id\"), None)\n        if fut is None or fut.done():\n            return                             # unknown or late answer: ignore it\n        if \"error\" in msg:\n            fut.set_exception(RuntimeError(msg[\"error\"][\"message\"]))\n        else:\n            fut.set_result(msg[\"result\"])\n\nasync def main():\n    client = Client(lambda line: None, timeout_s=0.05)\n    try:\n        await client.request(\"count_orders\", {\"plant\": \"B\"})\n    except TimeoutError:\n        print(\"request 1 timed out\")\n    client.on_line('{\"jsonrpc\":\"2.0\",\"id\":1,\"result\":{\"count\":412}}')   # late answer\n    print(\"pending after late answer:\", client._pending)\n\nasyncio.run(main())\n```\n\nOutput in a test of these notes:\n\n```text\nrequest 1 timed out\npending after late answer: {}\n```\n\nThe `finally` block frees the id after an answer, an error or a timeout. So the 2026-07-28 rule holds (no id may repeat while pending), and the map does not grow. `on_line` uses `pop(..., None)`, so a late answer for a timed-out id is ignored instead of raising `KeyError`. In real MCP code the client should also cancel the abandoned request: close the response stream on Streamable HTTP, or send `notifications/cancelled` on stdio."
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "(a) A request with an unknown method: `{\"jsonrpc\":\"2.0\",\"id\":9,\"error\":{\"code\":-32601,\"message\":\"Method not found\",\"data\":\"tools/lst\"}}`. (b) No response: it has no id, so it is a notification, and nobody answers a notification, even an invalid one. (c) `{\"jsonrpc\":\"2.0\",\"id\":9,\"error\":{\"code\":-32602,\"message\":\"Invalid params\"}}`, because MCP params must be an object. (d) The text is not valid JSON, so the server cannot read an id: `{\"jsonrpc\":\"2.0\",\"error\":{\"code\":-32700,\"message\":\"Parse error\"}}`. JSON-RPC 2.0 would put `\"id\": null` here. The MCP schema makes the id optional and does not allow null, so omit it. Over stdio, the Python SDK 2.3.0 wrote nothing at all for broken JSON in a test of these notes."
}
```

## 12. Common mistakes

1. **"A message without a response is a failed request."** A notification has no id and never gets a response, by design. A request always gets exactly one response.
2. **"`id: null` is fine, JSON-RPC allows it."** JSON-RPC 2.0 discourages it. MCP forbids it: "the ID **MUST NOT** be `null`".
3. **"Responses arrive in the order of the requests."** They can arrive in any order. Match them by id.
4. **"A tool failure is a JSON-RPC error."** Errors inside a tool go into the result with `isError: true`, so the model can read them and correct itself. JSON-RPC errors are for protocol failures.
5. **"MCP supports batches."** Only revision 2025-03-26 did. Revision 2025-06-18 removed them.
6. **"Resource not found is -32002."** It was, up to 2025-11-25. Revision 2026-07-28 uses -32602 and forbids -32002 for new messages.
7. **"`params` can be an array."** JSON-RPC allows arrays. MCP params are always an object.

## 13. One-minute explanation

Every MCP message is a JSON-RPC 2.0 message, encoded as UTF-8 JSON. There are four shapes. A request has `jsonrpc` "2.0", an `id`, a `method` and usually `params`. A result response has the same `id` and a `result` object. An error response has an `error` object with an integer `code`, a short `message` and optional `data`. A notification is a request without an `id`, and nobody ever answers it. MCP adds rules. The id must be a string or an integer and never null. Params are always an object. In 2026-07-28 an id may not repeat while it still waits for an answer. The standard codes are -32700 parse error, -32600 invalid request, -32601 method not found, -32602 invalid params and -32603 internal error. MCP reserves -32020 to -32099 for its own codes, for example -32022 for an unsupported protocol version. Tool failures are not JSON-RPC errors: they go into the result with `isError` true, so the model can see them. MCP allowed JSON-RPC batches only in revision 2025-03-26 and removed them in 2025-06-18.

## 14. Check questions

```check
{
  "question": "Classify these three messages and say which one must not get a reply: (a) {\"jsonrpc\":\"2.0\",\"id\":5,\"method\":\"tools/call\",\"params\":{...}}, (b) {\"jsonrpc\":\"2.0\",\"method\":\"notifications/tools/list_changed\"}, (c) {\"jsonrpc\":\"2.0\",\"id\":5,\"result\":{\"resultType\":\"complete\",...}}.",
  "answer": "(a) is a request, because it has a `method` and an `id`. (b) is a notification, because it has a `method` and no `id`. It must not get a reply. (c) is the result response to request 5: it has the same `id` and a `result` object."
}
```

```check
{
  "question": "Name the five standard JSON-RPC error codes and give one MCP situation for each.",
  "answer": "| Code | Name | MCP situation |\n|---|---|---|\n| -32700 | Parse error | A line on stdio or an HTTP body that is not valid JSON |\n| -32600 | Invalid Request | A batch array, `\"id\": null`, or a missing `method` |\n| -32601 | Method not found | `ping` sent to a 2026-07-28 server, or `prompts/list` to a server without the `prompts` capability |\n| -32602 | Invalid params | An unknown tool name, a request without the required `_meta`, an expired cursor, or (since 2026-07-28) an unknown resource |\n| -32603 | Internal error | An unexpected crash inside the server while it handles the request |"
}
```

```check
{
  "question": "Interview follow-up: how did the request id rule change from 2025-11-25 to 2026-07-28, and why?",
  "hint": "What does \"session\" mean after 2026-07-28?",
  "answer": "2025-11-25: the id \"MUST NOT have been previously used by the requestor within the same session\". 2026-07-28: the id \"MUST NOT match the ID of any other request the sender has issued and not yet received a response for\". Both revisions require a string or integer and forbid `null`. The reason: 2026-07-28 removed sessions (SEP-2567), so \"within the same session\" had no meaning. SEP-2567 rescoped the rule to pending requests, because the id only exists to match a response to its request. It notes that the TypeScript and Python SDKs already use a monotonically increasing counter per client object, which satisfies both wordings. A related rule: an MRTR retry is a new request, so it MUST use a different id from the first attempt."
}
```

```check
{
  "question": "Interview follow-up: a server receives the bytes {\"jsonrpc\":\"2.0\",\"id\":4,\"method\" and nothing more. What exactly should it send back, and is there any disagreement between standards?",
  "answer": "The bytes are not valid JSON, so this is a parse error, code -32700. The server cannot read the id. JSON-RPC 2.0 says the id \"MUST be Null\" in this case. The MCP schema says the error response `id` is optional and, if present, a string or integer. So an MCP-conformant reply omits the id: `{\"jsonrpc\":\"2.0\",\"error\":{\"code\":-32700,\"message\":\"Parse error\"}}`. In a test of these notes, the official 2026-07-28 `schema.json` rejected the `\"id\": null` form. The Python SDK 2.3.0 over HTTP sent `\"id\": null` with HTTP 400. Over stdio the same SDK sent nothing. A robust client accepts both forms and treats them as \"not tied to any pending request\"."
}
```

```check
{
  "question": "Interview follow-up: does MCP support JSON-RPC batching? Give the history and what a current server does with a batch.",
  "answer": "Revision 2024-11-05 did not mention batches. Revision 2025-03-26 added them: implementations \"MAY support sending JSON-RPC batches, but MUST support receiving\" them. Revision 2025-06-18 removed them (\"Remove support for JSON-RPC batching\", PR #416). Since then a Streamable HTTP POST body \"MUST be a single JSON-RPC request or notification\". The changelog gives no reason. Interpretation of these notes: batches clash with per-request mechanisms of MCP. Examples are one response stream per request, per-request cancellation and routing headers that name one method. Measured in a test of these notes: the Python SDK 2.3.0 answered a batch over HTTP with 400 and -32600. Over stdio it ignored the batch."
}
```

```check
{
  "question": "Interview follow-up: the model calls count_orders with date \"14/10/2026\" but the tool expects YYYY-MM-DD. Should the server answer with a JSON-RPC error -32602 or with a result? Why?",
  "answer": "With a result that has `isError: true` and a text that explains the problem, for example \"date must be YYYY-MM-DD, got 14/10/2026\". The schema says errors that originate from the tool \"SHOULD be reported inside the result object, with `isError` set to true, _not_ as an MCP protocol-level error response. Otherwise, the LLM would not be able to see that an error occurred and self-correct.\" Revision 2025-11-25 made this explicit for input validation errors (SEP-1303, \"to enable model self-correction\"). A JSON-RPC error goes to the host, which usually does not show it to the model. Errors in finding the tool, such as an unknown tool name, stay protocol errors (-32602)."
}
```

```check
{
  "question": "Interview follow-up: a client sends \"id\": 1.0. Python parses it as a float. Is the message valid MCP? What should the response id be?",
  "answer": "The MCP schema types the id as \"string or integer\". JSON Schema 2020-12 counts a number with a zero fractional part as an integer. In a test of these notes, the official 2026-07-28 `schema.json` accepted `\"id\": 1.0` and rejected `\"id\": 1.5`. JSON-RPC 2.0 also says numbers \"SHOULD NOT contain fractional parts\". So `1.0` is valid but a bad idea. The response must carry \"the same\" id. A careful server echoes the parsed value unchanged. A client that compares ids as strings could then fail to match `1.0` with `1`. The safe practice is to send ids as plain integers or strings only."
}
```

## 15. Links

- Previous: [L1: Why MCP exists](/notes/ai/llm-systems/07-mcp/l1-why-mcp)
- Next: [L3: The stateful protocol (2025-11-25)](/notes/ai/llm-systems/07-mcp/l3-the-stateful-protocol)
- Error codes and utilities in depth: [L10: Utilities: progress, cancellation, pagination, errors](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors)
- Tool results and `isError`: [L6: Tools in depth](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth)
- Older lessons: [6.4 Tool results and errors](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors), [6.7 MCP: the protocol](/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol)
- Async futures: [Event loop and coroutines](/notes/software-engineering/python/01-asyncio/l1-event-loop-and-coroutines)

### Sources

- JSON-RPC 2.0 Specification (origin date 2010-03-26, updated 2013-01-04). https://www.jsonrpc.org/specification (checked on 2026-10-15)
- MCP specification 2026-07-28, Base Protocol overview, error codes, cancellation, changelog. https://modelcontextprotocol.io/specification/2026-07-28/basic (checked on 2026-10-15)
- MCP specification 2025-11-25, 2025-06-18, 2025-03-26 and 2024-11-05, base protocol pages and changelogs. https://modelcontextprotocol.io/specification/2025-11-25/basic (checked on 2026-10-15)
- MCP `schema.ts` and `schema.json` for 2025-11-25 and 2026-07-28. https://github.com/modelcontextprotocol/modelcontextprotocol/tree/main/schema (checked on 2026-10-15)
- SEP-2567 "Sessionless MCP via Explicit State Handles" (id rule rescoping). https://modelcontextprotocol.io/seps/2567-sessionless-mcp (checked on 2026-10-15)
- MCP Python SDK 2.3.0 (traces and batch behavior measured in a test of these notes). https://pypi.org/project/mcp/ (checked on 2026-10-15)
