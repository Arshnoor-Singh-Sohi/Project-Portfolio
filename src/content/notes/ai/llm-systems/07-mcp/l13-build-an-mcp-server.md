---
title: "L13: Build an MCP server and client"
order: 13
summary: "A complete orders server with the MCP Python SDK 2.3.0: tools from typed functions with the generated inputSchema and outputSchema, a resource, a prompt, tool errors, a stdio client and raw JSON lines, the MCP Inspector CLI, Streamable HTTP with real request and response headers, two replicas behind a round-robin balancer, and the host configuration for Claude Desktop and Claude Code. Every output is real."
status: not-started
tags: [mcp, python-sdk, mcpserver, inspector, streamable-http, stateless, claude-desktop, claude-code]
---

## 1. The question this idea answers

Lessons L1 to L12 described the protocol: messages, fields, versions, auth. An interviewer who hears all that will ask: "Have you built one? Show me how a Python function becomes a tool. What does the schema look like? What is on the wire? How do you deploy it behind a load balancer?"

This lesson builds a small but complete server and a client with the official MCP Python SDK, version 2.3.0, and runs them. It shows each step with real output. You will see the generated JSON Schema, the raw JSON lines over stdio and the HTTP headers over Streamable HTTP. You will also see the errors, the Inspector, and a stateless deployment with two replicas. It then connects the server to a host.

Lesson [L8 of context engineering](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server) built a research server with SQL and file guards. This lesson goes deeper into the protocol side: schemas, transports, eras and deployment.

## 2. Mental model

> [!analogy] A translator in front of a kitchen
> You write ordinary Python functions: the recipes. The SDK stands at the door as a translator. It reads each recipe's name, its instructions (the docstring) and its ingredient list (the type hints). Then it prints a menu in the MCP language (`tools/list`). When an order arrives in JSON, the translator checks it against the menu, calls your function, and turns the result back into JSON. The same kitchen can serve through a back door (stdio, one host) or a street window (HTTP, many clients).
>
> **Where it stops working:** the translator copies only what you wrote. A vague docstring becomes a vague tool description that the model reads. A missing type hint becomes a missing constraint. And the translator does not make the kitchen safe: input checks beyond the schema, permissions and secrets stay your job.

## 3. Terms

| Term | Plain meaning |
|---|---|
| `mcp` | The official MCP Python SDK package on PyPI. Version 2.3.0 on 2026-10-15. |
| `MCPServer` | The high-level server class of SDK v2. It was called `FastMCP` in v1. |
| decorator | A Python line such as `@mcp.tool()` above a function that registers the function. |
| type hint | The declared type of a parameter, for example `order_id: str`. The SDK turns it into JSON Schema. |
| Pydantic | The Python library that validates data against types. The SDK uses it to build schemas and check arguments. |
| `Annotated` and `Field` | Typing helpers that attach constraints and descriptions to a parameter, for example a regex pattern. |
| `Context` | An object that the SDK passes to a tool for progress, logging and other request-scoped actions. |
| `ToolError` | The SDK exception for an expected tool failure. Its message reaches the model as a result with `isError: true`. |
| `Client` | The high-level client class of SDK v2. It connects to a URL, a subprocess or an in-process server. |
| `StdioServerParameters` | The command and arguments that a client uses to start a stdio server. |
| MCP Inspector | The reference developer tool for MCP servers, with a web, a CLI and a terminal client. |
| replica | One of several identical server processes behind a load balancer. |
| round robin | A load-balancing rule that sends each new request to the next replica in turn. |
| sticky session | A load-balancer rule that always sends one client's requests to the same replica. |
| dual-era server | A server that answers both the 2026-07-28 per-request protocol and the older `initialize` handshake. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. Install the SDK, and know which version you have

Facts from PyPI and the SDK README, checked on 2026-10-15:

| Item | Value |
|---|---|
| Current release | `mcp` 2.3.0, released 2026-10-02 |
| v2 line | 2.0.0 on 2026-07-28, the day of spec revision 2026-07-28 |
| v1 line | Still maintained, latest 1.30.0 (2026-09-07). The README says to pin `mcp>=1.28,<2` until you migrate. |
| Protocol support | The README: v2 supports the 2026-07-28 specification and every earlier revision |
| Python | PyPI metadata: `Requires-Python >=3.10` |
| Install | `uv add "mcp[cli]"` or `pip install "mcp[cli]"`. The `cli` extra adds the `mcp` command. |

```bash
pip install "mcp[cli]"
mcp version
```

```text
MCP version 2.3.0
```

The most important import change between the lines: v1 code that imports `FastMCP` fails in v2. The real error in these notes:

```text
ModuleNotFoundError: No module named 'mcp.server.fastmcp'. This is mcp 2.x, where FastMCP was renamed to MCPServer (from mcp.server.mcpserver import MCPServer) and other APIs changed; see the migration guide at https://py.sdk.modelcontextprotocol.io/v2/migration/#fastmcp-renamed-to-mcpserver or pin 'mcp<2' to keep running v1 code.
```

`from mcp.server import MCPServer` and `from mcp.server.mcpserver import MCPServer` both work in 2.3.0.

## 5. The server

```python
"""orders_server.py: a small MCP server with tools, a resource and a prompt."""
import logging
from typing import Annotated, Literal

from pydantic import BaseModel, Field

from mcp.server import MCPServer
from mcp.server.mcpserver import Context
from mcp.server.mcpserver.exceptions import ResourceNotFoundError, ToolError

logger = logging.getLogger("orders")          # logging writes to stderr, never stdout

ORDERS = {
    "PO-1001": {"order_id": "PO-1001", "product": "Bagels", "quantity": 1200, "status": "released"},
    "PO-1002": {"order_id": "PO-1002", "product": "Croissants", "quantity": 800, "status": "completed"},
    "PO-1003": {"order_id": "PO-1003", "product": "Muffins", "quantity": 500, "status": "released"},
}

mcp = MCPServer("orders-demo", instructions="Read-only access to production orders.")


class Order(BaseModel):
    """One production order."""
    order_id: str
    product: str
    quantity: int = Field(ge=0, description="Units to produce")
    status: Literal["released", "completed", "cancelled"]


@mcp.tool()
def get_order(
    order_id: Annotated[str, Field(pattern=r"^PO-\d{4}$", description="Order ID, for example PO-1001")],
) -> Order:
    """Return one production order by its ID."""
    if order_id not in ORDERS:
        raise ToolError(f"Unknown order {order_id}. Known IDs: {', '.join(ORDERS)}")
    return Order(**ORDERS[order_id])


@mcp.tool()
async def count_orders(
    status: Literal["released", "completed", "cancelled"],
    ctx: Context,
) -> int:
    """Count the orders that have one status."""
    await ctx.report_progress(1, 2, "scanning orders")
    n = sum(1 for o in ORDERS.values() if o["status"] == status)
    await ctx.report_progress(2, 2, "done")
    return n


@mcp.resource("orders://catalog")
def catalog() -> str:
    """The list of products that the plant makes."""
    return "Bagels, Croissants, Muffins"


@mcp.resource("orders://{order_id}")
def order_resource(order_id: str) -> str:
    """One order as a text block."""
    if order_id not in ORDERS:
        raise ResourceNotFoundError(f"No order {order_id}")
    o = ORDERS[order_id]
    return f"{o['order_id']}: {o['quantity']} x {o['product']} ({o['status']})"


@mcp.prompt()
def summarize_order(order_id: str) -> str:
    """Ask the model for a one-paragraph summary of an order."""
    return f"Call get_order with order_id={order_id}, then summarize the order in one paragraph."


if __name__ == "__main__":
    mcp.run()          # no argument: stdio
```

The important lines:

- `MCPServer("orders-demo", instructions=...)`: the server name and the natural-language `instructions` that `server/discover` returns to the host.
- `@mcp.tool()`: registers the function as a tool. The parentheses are required. The SDK raises `TypeError` for a bare `@mcp.tool`.
- `Annotated[str, Field(pattern=..., description=...)]`: the type is `str`. The `Field` adds a JSON Schema `pattern` and a `description` that the model reads.
- `-> Order`: a Pydantic return type. The SDK builds an `outputSchema` from it and returns the value as `structuredContent`.
- `raise ToolError(...)`: an expected failure. The model receives the message.
- `ctx: Context`: the SDK injects it. It never appears in the schema.
- `@mcp.resource("orders://{order_id}")`: a resource template. The `{order_id}` part becomes a function argument.
- `@mcp.prompt()`: a prompt that returns one user message.
- `mcp.run()` under `if __name__ == "__main__":`: stdio by default. The SDK docs say that transport options go to `run()`, not to the constructor, and that tools import the file first, so the guard matters.

## 6. From a Python function to a JSON Schema

```video
{"src": "/notes/media/llm-systems/manim/m38-function-to-tool-schema.mp4", "caption": "How the SDK turns a function name, a docstring and type hints into the name, description, inputSchema and outputSchema of a tool."}
```

This script prints what the server will send in `tools/list`:

```python
import asyncio, json
from orders_server import mcp

async def main():
    for tool in await mcp.list_tools():
        print("==", tool.name)
        print(json.dumps(tool.model_dump(by_alias=True, exclude_none=True), indent=2))

asyncio.run(main())
```

Real output for `get_order` (whitespace compacted):

```json
{
  "name": "get_order",
  "description": "Return one production order by its ID.",
  "inputSchema": {
    "properties": {
      "order_id": {
        "description": "Order ID, for example PO-1001",
        "pattern": "^PO-\\d{4}$",
        "title": "Order Id",
        "type": "string"
      }
    },
    "required": ["order_id"],
    "title": "get_orderArguments",
    "type": "object"
  },
  "outputSchema": {
    "description": "One production order.",
    "properties": {
      "order_id": {"title": "Order Id", "type": "string"},
      "product": {"title": "Product", "type": "string"},
      "quantity": {"description": "Units to produce", "minimum": 0, "title": "Quantity", "type": "integer"},
      "status": {"enum": ["released", "completed", "cancelled"], "title": "Status", "type": "string"}
    },
    "required": ["order_id", "product", "quantity", "status"],
    "title": "Order",
    "type": "object"
  }
}
```

For `count_orders`, the `Literal` parameter became `"enum": ["released", "completed", "cancelled"]`, `ctx` disappeared, and the `int` return type became an `outputSchema` titled `count_ordersOutput` with one required integer property, `result`.

![Alt text: the get_order function and its tools/list entry, with numbered markers that connect each Python element to its schema field.](/notes/media/llm-systems/figures/07-13-code-to-schema.svg)

| Python | JSON Schema in the tool | Seen in the output |
|---|---|---|
| function name `get_order` | `name` | `"name": "get_order"` |
| docstring | `description` | the first docstring line |
| parameter type `str` | `"type": "string"` | yes |
| `Literal["released", ...]` | `enum` | in `count_orders` |
| `Field(pattern=..., description=...)` | `pattern`, `description` | yes |
| `Field(ge=0)` | `minimum: 0` | in the output schema |
| no default value | listed in `required` | `["order_id"]` |
| a default value | not required, plus `default` | Exercise 1 |
| `X \| None` | `anyOf` with `{"type": "null"}` | Exercise 1 |
| `ctx: Context` | nothing | absent |
| Pydantic return type | `outputSchema` from the model | `"title": "Order"` |
| `int` return type | an object that wraps the value in `result` | `count_ordersOutput` |

Two observations, measured in these notes. First, the SDK adds `title` keys (`"Order Id"`, `"get_orderArguments"`). They are harmless JSON Schema annotations, but they cost tokens in the model's context. Second, a primitive return type such as `int` becomes `{"result": ...}`, because the SDK wraps non-object outputs in an object. A client then reads `structuredContent["result"]`.

The MCP spec requires `inputSchema` to be a valid JSON Schema object. Since 2026-07-28 it may use any JSON Schema 2020-12 keyword (SEP-2106). Lesson [L7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) teaches each keyword.

## 7. Errors that the model can read

Three calls, three outcomes. Real output of two extra calls with the stdio client of section 8, `call_tool("get_order", {"order_id": "PO-9999"})` and `call_tool("get_order", {"order_id": "1001"})`:

```text
unknown order: True | Error executing tool get_order: Unknown order PO-9999. Known IDs: PO-1001, PO-1002, PO-1003
invalid argument: True | Error executing tool get_order: 1 validation error for get_orderArguments
order_id
  String should match pattern '^PO-\d{4}$' [type=string_pattern_mismatch, input_value='1001', input_type=str]
```

1. **`ToolError` raised by your code** returns `isError: true` with your message. The model learns the valid IDs and can retry.
2. **Arguments that fail the schema** also return `isError: true`, with the Pydantic validation message. This matches the rule since 2025-11-25 (SEP-1303): input validation errors are tool execution errors, so the model can correct itself.
3. **Any other exception** (a bug, a `KeyError`) is treated as a crash. Measured in these notes: when `get_order` raised a plain `ValueError`, the model saw only `Error executing tool get_order`, and the traceback went to the server log on stderr. The SDK source explains why: "the exception's own text stays on the server". A crash message may contain internal details that the model, and an attacker who controls it, should not see.

Protocol errors are different: an unknown tool name or a missing `_meta` gets a JSON-RPC `error`, not a result ([L10](/notes/ai/llm-systems/07-mcp/l10-utilities-and-errors)).

## 8. The client over stdio

```python
"""client_stdio.py: start orders_server.py as a subprocess and use it."""
import asyncio
import sys

from mcp import Client, StdioServerParameters


async def on_progress(progress: float, total: float | None, message: str | None) -> None:
    print(f"  progress {progress}/{total}: {message}")


async def main() -> None:
    params = StdioServerParameters(command=sys.executable, args=["orders_server.py"])
    async with Client(params) as client:
        print("protocol version:", client.protocol_version)
        print("server info:", client.server_info.name if client.server_info else None)

        tools = await client.list_tools()
        print("tools:", [t.name for t in tools.tools])

        result = await client.call_tool("get_order", {"order_id": "PO-1001"})
        print("isError:", result.is_error)
        print("structuredContent:", result.structured_content)

        n = await client.call_tool("count_orders", {"status": "released"}, progress_callback=on_progress)
        print("count_orders structuredContent:", n.structured_content)

        res = await client.read_resource("orders://PO-1002")
        print("resource text:", res.contents[0].text)

        prompt = await client.get_prompt("summarize_order", {"order_id": "PO-1003"})
        print("prompt message:", prompt.messages[0].role, "|", prompt.messages[0].content.text)


asyncio.run(main())
```

Real output:

```text
protocol version: 2026-07-28
server info: orders-demo
tools: ['get_order', 'count_orders']
isError: False
structuredContent: {'order_id': 'PO-1001', 'product': 'Bagels', 'quantity': 1200, 'status': 'released'}
  progress 1.0/2.0: scanning orders
  progress 2.0/2.0: done
count_orders structuredContent: {'result': 2}
resource text: PO-1002: 800 x Croissants (completed)
prompt message: user | Call get_order with order_id=PO-1003, then summarize the order in one paragraph.
```

What happened under the hood:

- `Client(params)` started `orders_server.py` as a subprocess and connected to its stdin and stdout.
- The default `mode="auto"` probed with `server/discover`, found a modern server, and adopted 2026-07-28. With `mode="legacy"` it would send `initialize` instead.
- Each method call became one JSON-RPC request with the required `_meta`.
- The tool's result arrived both as `structuredContent` and as JSON text in `content`. The spec says that a tool which returns structured content SHOULD also return the serialized JSON in a text block.

### 8.1 The same conversation as raw JSON lines

The stdio transport is newline-delimited JSON. A script can write one line to the server's stdin and read one line from its stdout. Real exchange in these notes (`>>>` is sent, `<<<` is received):

```text
>>> {"jsonrpc": "2.0", "id": 1, "method": "server/discover", "params": {"_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {}, "io.modelcontextprotocol/clientInfo": {"name": "raw-client", "version": "0.1.0"}}}}
<<< {"jsonrpc":"2.0","id":1,"result":{"cacheScope":"private","capabilities":{"prompts":{"listChanged":true},"resources":{"listChanged":true,"subscribe":true},"tools":{"listChanged":true}},"instructions":"Read-only access to production orders.","resultType":"complete","supportedVersions":["2026-07-28"],"ttlMs":0,"_meta":{"io.modelcontextprotocol/serverInfo":{"name":"orders-demo","version":""}}}}
>>> {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_order", "arguments": {"order_id": "PO-1002"}, "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {}, "io.modelcontextprotocol/clientInfo": {"name": "raw-client", "version": "0.1.0"}}}}
<<< {"jsonrpc":"2.0","id":2,"result":{"content":[{"text":"{\n  \"order_id\": \"PO-1002\",\n  \"product\": \"Croissants\",\n  \"quantity\": 800,\n  \"status\": \"completed\"\n}","type":"text"}],"isError":false,"resultType":"complete","structuredContent":{"order_id":"PO-1002","product":"Croissants","quantity":800,"status":"completed"},"_meta":{"io.modelcontextprotocol/serverInfo":{"name":"orders-demo","version":""}}}}
```

Every 2026-07-28 element is visible. `_meta` carries the version and capabilities. `server/discover` returns `supportedVersions`. Results carry `resultType: "complete"`, `serverInfo` in their `_meta`, and the cache hints `ttlMs` and `cacheScope`. The SDK's defaults are `ttlMs: 0` (immediately stale) and `cacheScope: "private"`. Exercise 3 changes them.

> [!trap] Never print to stdout in a stdio server
> stdout carries the protocol. The SDK docs say that while serving, the SDK redirects output that is flushed to stdout over to stderr. But output flushed before serving begins, or a `print()` still buffered at exit, can still reach the wire and corrupt it. Use the `logging` module, which writes to stderr.

## 9. Test with the MCP Inspector

The Inspector is one npm package, `@modelcontextprotocol/inspector`, with three clients: web (default), `--cli` and `--tui`. It needs Node 22.19.0 or newer. The npm `latest` tag was 2.11.0 on 2026-10-15. Commands from the official Inspector docs:

| Goal | Command |
|---|---|
| Web UI with a stdio server | `npx @modelcontextprotocol/inspector python orders_server.py` |
| Web UI through the SDK | `uv run mcp dev orders_server.py` |
| CLI: list tools | `npx @modelcontextprotocol/inspector --cli python orders_server.py --method tools/list` |
| CLI: call a tool | `... --method tools/call --tool-name get_order --tool-arg order_id=PO-1002` |
| A remote server | `npx @modelcontextprotocol/inspector --cli https://host/mcp --transport http --method tools/list` |

Real CLI result in these notes (`--format json`):

```json
{"result":{"content":[{"type":"text","text":"{\n  \"order_id\": \"PO-1002\",\n  \"product\": \"Croissants\",\n  \"quantity\": 800,\n  \"status\": \"completed\"\n}"}],"structuredContent":{"order_id":"PO-1002","product":"Croissants","quantity":800,"status":"completed"},"isError":false}}
```

For the unknown order `PO-9999`, the CLI printed the `isError: true` result, exited with code `5`, and wrote one JSON line to stderr:

```json
{"error":{"code":"tool_is_error","message":"Tool 'get_order' returned isError:true."}}
```

Exit code 5 means "Tool error" in the Inspector docs. So a CI job can run `--method tools/call` and fail on a tool error. `tools/list --strict` checks schema portability and exits with code 6 on a serious problem. It exited with `0` for this server.

## 10. Streamable HTTP

### 10.1 Run it

```python
"""http_server.py: serve the same server over Streamable HTTP."""
import sys

from orders_server import mcp

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    stateless = "--stateless" in sys.argv          # read only for legacy (2025) clients
    mcp.run(transport="streamable-http", host="127.0.0.1", port=port, stateless_http=stateless)
```

The SDK serves the MCP endpoint at `/mcp` by default (`streamable_http_path`). Other options of `run()` in 2.3.0 are `json_response`, `stateless_http`, `event_store`, `retry_interval` and `transport_security`. Three have defaults worth knowing: `max_request_body_size` is 4 MiB, `session_idle_timeout` is 1800 s and `max_sessions` is 10,000. The last two apply only to legacy sessions. The same can run without a script: `mcp run orders_server.py --transport streamable-http`.

### 10.2 A real request and response

The request below shows the headers that the test set with `curl`. curl also added `User-Agent` and `Content-Length`.

```http
POST /mcp HTTP/1.1
Host: 127.0.0.1:8801
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: get_order

{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_order","arguments":{"order_id":"PO-1001"},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{},"io.modelcontextprotocol/clientInfo":{"name":"curl","version":"8"}}}}
```

Real response (the `date` and `server` headers are omitted):

```http
HTTP/1.1 200 OK
content-type: application/json
content-length: 407

{"jsonrpc":"2.0","id":1,"result":{"content":[{"text":"{\n  \"order_id\": \"PO-1001\",\n  \"product\": \"Bagels\",\n  \"quantity\": 1200,\n  \"status\": \"released\"\n}","type":"text"}],"isError":false,"resultType":"complete","structuredContent":{"order_id":"PO-1001","product":"Bagels","quantity":1200,"status":"released"},"_meta":{"io.modelcontextprotocol/serverInfo":{"name":"orders-demo","version":""}}}}
```

The request has every element of [L4](/notes/ai/llm-systems/07-mcp/l4-transports). It is one POST to one endpoint, with an `Accept` header that lists both types. `MCP-Protocol-Version` equals the `_meta` value. The `Mcp-Method` and `Mcp-Name` headers let a gateway route without parsing the body. The server chose a plain JSON response for this short call.

### 10.3 Real failures

| Request | Status | Body (real) |
|---|---|---|
| `Mcp-Name: count_orders`, body calls `get_order` | 400 | `{"code":-32020,"message":"mcp-name header does not match the request body's 'name' parameter"}` |
| `Mcp-Name` header missing | 400 | the same -32020 error |
| Version `1900-01-01` | 400 | `{"code":-32022,"message":"Unsupported protocol version","data":{"supported":["2026-07-28"],"requested":"1900-01-01"}}` |
| GET with `MCP-Protocol-Version: 2026-07-28` | 405 | empty, header `allow: POST` |

The spec says that a server which supports only 2026-07-28 SHOULD answer an old client's GET or DELETE with `405 Method Not Allowed`. This dual-era server did the same for a GET that carried a modern version header.

## 11. Stateless behind a load balancer

### 11.1 The experiment

Two replicas of the same server ran on ports 8801 and 8802. A 31-line toy load balancer (Starlette and httpx) on port 8800 forwarded each request to the next replica in turn, with no sticky sessions. A client called `get_order` three times through the balancer, once in each era.

```python
"""client_lb.py: call the server through the round-robin balancer."""
import asyncio
import sys

from mcp import Client

URL = "http://127.0.0.1:8800/mcp"


async def run(mode: str) -> None:
    print(f"--- mode={mode}")
    try:
        async with Client(URL, mode=mode) as client:
            print("protocol version:", client.protocol_version)
            for i in range(3):
                r = await client.call_tool("get_order", {"order_id": "PO-1003"})
                print(f"call {i + 1}:", r.structured_content["status"])
    except Exception as exc:  # show what breaks
        while isinstance(exc, ExceptionGroup):
            exc = exc.exceptions[0]
        print("FAILED:", type(exc).__name__, "-", exc)


asyncio.run(run(sys.argv[1]))
```

Real output with `python client_lb.py 2026-07-28`, and the balancer's log:

```text
--- mode=2026-07-28
protocol version: 2026-07-28
call 1: released
call 2: released
call 3: released

      tools/call -> http://127.0.0.1:8801 -> 200
      tools/list -> http://127.0.0.1:8802 -> 200
      tools/call -> http://127.0.0.1:8801 -> 200
      tools/call -> http://127.0.0.1:8802 -> 200
```

Real output with `python client_lb.py legacy`, servers started without `--stateless`:

```text
--- mode=legacy
protocol version: 2025-11-25
FAILED: MCPError - Session not found
```

The legacy client sent `initialize` to replica A, which created a session in its own memory and returned an `Mcp-Session-Id`. The next request went to replica B, which had never seen that session. B answered `404` with `{"jsonrpc":"2.0","id":null,"error":{"code":-32600,"message":"Session not found"}}` (seen in a raw request in these notes). The modern client never had a session, so either replica could serve every request.

![Alt text: a client, a round-robin balancer and two replicas, with the modern and legacy results and the state that replicas still share.](/notes/media/llm-systems/figures/07-13-two-replicas.svg)

### 11.2 What `stateless_http=True` does in SDK v2

With both replicas restarted with `--stateless`, the legacy client also succeeded: `protocol version: 2025-11-25`, then three `released` (measured). The flag makes the SDK create a fresh transport for each legacy request, with no session tracking.

The SDK source and deploy docs add the details:

- The modern path does not read the flag. A request whose `MCP-Protocol-Version` header is a modern version goes straight to the stateless handler.
- For legacy clients, the cost of `stateless_http=True` is the loss of server-to-client requests over the session (sampling, elicitation) and of resumability.
- Without the flag, legacy clients need sticky sessions, or follow-up requests get 404.

### 11.3 What still needs sharing across replicas

A stateless protocol does not mean a stateless system. The SDK deploy docs name three things:

| Need | Why | What to do |
|---|---|---|
| MRTR `requestState` | By default each process signs `requestState` with a random key made at startup. A retry that lands on another replica fails with -32602, "Invalid or expired requestState". | Give every replica the same `RequestStateSecurity(keys=[...])` secret (at least 32 bytes) and the same server name, which is the audience claim. |
| `subscriptions/listen` | A change published on replica A must reach listen streams that are open on replica B. | Give every replica the same `SubscriptionBus`. The SDK ships only an in-process bus, so implement its two-method protocol over Redis, NATS or similar. |
| Application state | Baskets, jobs, drafts | Store them in a shared database under server-minted handles, bound to the authenticated user ([L11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security)). |

Two more deploy rules from the same page. By default `streamable_http_app()` accepts only requests whose `Host` header is localhost, so a real hostname needs `TransportSecuritySettings(allowed_hosts=[...], allowed_origins=[...])`. Behind a TLS-terminating proxy, run uvicorn with `--proxy-headers` and `--forwarded-allow-ips`. To scale on one machine, use `uvicorn --workers N`: the SDK has no `workers=` option.

## 12. Connect the server to a host

### 12.1 Claude Desktop

Claude Desktop reads `claude_desktop_config.json`: `%APPDATA%\Claude\claude_desktop_config.json` on Windows and `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS. Each entry under `mcpServers` has a `command`, `args` and an optional `env`. The MCP docs say to use absolute paths and to quit and restart the app after each edit. Server stderr goes to `mcp-server-SERVERNAME.log` in `%APPDATA%\Claude\logs` (Windows) or `~/Library/Logs/Claude` (macOS).

The SDK can write the entry: `mcp install orders_server.py --name orders-demo`. Real result in these notes, with the two absolute paths shortened to `<...>`:

```json
{
  "mcpServers": {
    "orders-demo": {
      "command": "<...>/uv",
      "args": ["run", "--frozen", "--with", "mcp[cli]==2.3.0", "mcp", "run", "<...>/orders_server.py"]
    }
  }
}
```

The SDK pins `mcp[cli]` to the running version (`==2.3.0`), so `uv run` builds the same environment that you tested. On Windows, write each backslash in a JSON path as `\\`.

### 12.2 Claude Code

Commands from the Claude Code docs, checked on 2026-10-15:

```bash
# a local stdio server: everything after -- is the command
claude mcp add --transport stdio orders-demo -- uv run --with "mcp[cli]" mcp run C:/path/to/orders_server.py

# a remote Streamable HTTP server
claude mcp add --transport http orders-demo https://mcp.example.com/mcp

# share it with the team in .mcp.json at the project root
claude mcp add --transport http orders-demo --scope project https://mcp.example.com/mcp
```

There are three scopes. `local` is the default: stored in `~/.claude.json`, for this project only. `project` is stored in `.mcp.json`, shared through version control, and approved by each user before use. `user` is stored in `~/.claude.json` and applies to all projects. `--env KEY=value` passes environment variables to a stdio server. Inside Claude Code, `/mcp` shows the server status and handles authentication for remote servers.

## 13. Production checklist

| Area | Check |
|---|---|
| Version | Pin `mcp` (for example `mcp>=2.3,<3`). Test against hosts that still speak 2025-11-25. |
| Schemas | Read the generated `inputSchema` once. Add `description` to every parameter. Use `Literal` for closed sets. |
| Errors | Raise `ToolError` with a message that helps the model. Let crashes stay generic. |
| stdio | No `print()`. Log to stderr. |
| HTTP | Set `allowed_hosts` and `allowed_origins`. Add authorization ([L11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security)). |
| Scale | Round robin is fine for 2026-07-28 clients. Share the `requestState` key, the subscription bus and application state. Use `stateless_http=True` or sticky sessions for legacy clients. |
| Caching | Set `cache_hints` for lists that rarely change. Keep tool order deterministic. |
| Tests | Use `Client(mcp)` in-process in pytest. Use the Inspector CLI in CI. |

### Exercises

These go in `C:\Users\ASohi\Downloads\AI\agent-harness-lab`, notebook folder `llm-systems/`, with the server file next to the notebook.

1. **A tool with optional arguments.** Add `list_orders(status=None, limit=10)` that returns a list of `Order`. `status` is one of the three statuses or `None`. `limit` is an integer from 1 to 50. Acceptance test: the generated schema of `limit` has `minimum` 1, `maximum` 50 and `default` 10. `required` is empty. The output schema wraps an array in `result`. A call with `limit: 0` returns `isError: true`. Hint 1: `Annotated[int, Field(ge=1, le=50, description=...)] = 10`. Hint 2: `Literal[...] | None = None`.
2. **Tests without a subprocess.** Write five pytest tests with `Client(mcp)`. Test a valid order, a pattern violation and an unknown order whose message lists the known IDs. Also test the resource `orders://PO-1002` and the `pattern` in the schema. Acceptance test: `python -m pytest -q` prints `5 passed`. Hint 1: an in-process `Client` needs no network and no process. Hint 2: wrap each coroutine in `asyncio.run`.
3. **Cache hints.** Make `tools/list` cacheable for 5 minutes by any client. Acceptance test: the result has `ttlMs` 300000 and `cacheScope` `"public"`. Hint 1: `MCPServer(..., cache_hints={...})` with `CacheHint` from `mcp.server`. Hint 2: create the client with `cache=None`, so you see the server's values and not a cached copy.

## 14. Common mistakes

1. **"`from mcp.server.fastmcp import FastMCP` is the current API."** That is v1. In v2 it raises `ModuleNotFoundError`. Use `MCPServer`.
2. **"`@mcp.tool` without parentheses works."** The SDK raises `TypeError`. Write `@mcp.tool()`.
3. **"Any exception message reaches the model."** Only `ToolError` (and validation errors). Other exceptions show a generic message and stay in the server log.
4. **"`ctx: Context` is a tool argument that the model must fill."** The SDK injects it and leaves it out of the schema.
5. **"A function that returns `int` produces `structuredContent: 2`."** SDK 2.3.0 wraps it: `{"result": 2}`.
6. **"Round robin breaks MCP."** Only for legacy sessions. 2026-07-28 requests work on any replica. MRTR state needs a shared signing key, and subscriptions need a shared bus.
7. **"`stateless_http=True` is required for 2026-07-28."** The modern path ignores the flag. It only changes how legacy clients are served.
8. **"A relative path in `claude_desktop_config.json` is fine."** Use absolute paths, and restart the app after each edit.

## 15. One-minute explanation

With the MCP Python SDK 2.3.0, you create an `MCPServer` and decorate plain functions with `@mcp.tool()`, `@mcp.resource()` and `@mcp.prompt()`. The SDK turns the function name, docstring and type hints into the tool's name, description and JSON Schema. `Annotated` with `Field` adds patterns and descriptions, and a Pydantic return type becomes the `outputSchema` and the `structuredContent`. Expected failures are raised as `ToolError` and reach the model as `isError: true`, while crashes stay generic. `mcp.run()` serves stdio, and `mcp.run(transport="streamable-http")` serves one `/mcp` endpoint. The `Client` class connects to a subprocess, a URL or an in-process server, and in auto mode it probes `server/discover`. I tested it with the Inspector CLI, which exits with code 5 on a tool error. Behind a plain round-robin balancer, 2026-07-28 clients worked on two replicas, while a legacy client failed with "Session not found" until I enabled `stateless_http`. For a host, the server goes into `claude_desktop_config.json` with absolute paths, or into Claude Code with `claude mcp add`.

## 16. Check questions

```check
{
  "question": "Write the parameter declaration that makes the SDK generate this property, and say whether it is required: `\"region\": {\"type\": \"string\", \"enum\": [\"EU\", \"US\"], \"description\": \"Plant region\", \"default\": \"EU\"}`.",
  "hint": "Literal for the enum, Field for the description, a default value for the default.",
  "answer": "`region: Annotated[Literal[\"EU\", \"US\"], Field(description=\"Plant region\")] = \"EU\"`. Because the parameter has a default value, it is not listed in `required`, and the schema gets `\"default\": \"EU\"`. The SDK also adds `\"title\": \"Region\"`."
}
```

```check
{
  "question": "A tool raises `KeyError('PO-9999')` on an unknown ID. What does the model see, and how do you change the code so the model can recover?",
  "answer": "SDK 2.3.0 treats any exception other than `ToolError`, `ResourceError` or `MCPError` as a crash. The model sees only `Error executing tool get_order`, with `isError: true`, and the traceback goes to the server log on stderr. Raise `ToolError(\"Unknown order PO-9999. Known IDs: PO-1001, PO-1002, PO-1003\")` instead. Then the result text carries the reason and the valid IDs, and the model can retry with a correct ID. This follows the spec's rule that tool execution errors belong in the result, so the model can self-correct."
}
```

```check
{
  "question": "Interview follow-up: You deploy the server as three replicas behind a round-robin load balancer with no sticky sessions. Which clients work, which fail, and what must the replicas share?",
  "answer": "Clients that speak 2026-07-28 work: every request carries its version and capabilities in `_meta`, so any replica can answer. Measured: three calls through a toy balancer alternated between two replicas and all succeeded. Legacy clients (2025-11-25 and earlier) fail without `stateless_http=True`, because `initialize` creates a session in one replica's memory. Measured: the next request reached the other replica and got 404 `Session not found`. With `stateless_http=True`, legacy clients work too, but they lose server-to-client requests over the session and resumability. The replicas must still share: the `RequestStateSecurity` keys and the same server name for MRTR `requestState`, a `SubscriptionBus` for `subscriptions/listen`, and a database for application state behind server-minted handles."
}
```

```check
{
  "question": "Interview follow-up: Show the exact HTTP request line and headers that a 2026-07-28 client sends to call `get_order` over Streamable HTTP. What happens if `Mcp-Name` says `count_orders`?",
  "answer": "```http\nPOST /mcp HTTP/1.1\nContent-Type: application/json\nAccept: application/json, text/event-stream\nMCP-Protocol-Version: 2026-07-28\nMcp-Method: tools/call\nMcp-Name: get_order\n```\nThe body is the JSON-RPC request with `params.name`, `params.arguments` and `params._meta` (protocol version, client capabilities, client info). If `Mcp-Name` says `count_orders` while the body says `get_order`, the server MUST reject it with `400 Bad Request` and JSON-RPC error -32020 HeaderMismatch. The real SDK 2.3.0 message was \"mcp-name header does not match the request body's 'name' parameter\". The rule exists because a gateway may route on the header while the server executes the body."
}
```

```check
{
  "question": "Interview follow-up: Why does SDK 2.3.0 return `{\"result\": 2}` as `structuredContent` for a tool annotated `-> int`, and what does the `outputSchema` look like?",
  "answer": "The SDK wraps a non-object return type in an object, so that `structuredContent` and its schema stay objects for every tool. The generated `outputSchema` is `{\"properties\": {\"result\": {\"title\": \"Result\", \"type\": \"integer\"}}, \"required\": [\"result\"], \"title\": \"count_ordersOutput\", \"type\": \"object\"}` (real output). Since 2026-07-28 (SEP-2106) the spec allows `structuredContent` to be any JSON value, so the wrapping is an SDK design choice. A client reads `structuredContent[\"result\"]`."
}
```

```check
{
  "question": "Your stdio server works when you run it by hand, but Claude Desktop shows no tools. The config is `{\"command\": \"python\", \"args\": [\"orders_server.py\"]}`. Give three causes and where you check each.",
  "answer": "1. The relative path `orders_server.py` does not resolve, because Claude Desktop does not start the process in your project folder. The MCP docs require absolute paths. 2. The bare `python` may be another interpreter without `mcp` installed. Use an absolute path to the interpreter or to `uv`, or let `mcp install` write the entry, which pins `mcp[cli]==2.3.0`. 3. Something prints to stdout before the server starts, which corrupts the JSON stream. Check the server's stderr in `mcp-server-orders-demo.log` in `%APPDATA%\\Claude\\logs` (Windows) or `~/Library/Logs/Claude` (macOS), and fully restart the app after each config change."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "Real output: the `limit` schema `{\"default\": 10, \"description\": \"Maximum number of orders\", \"maximum\": 50, \"minimum\": 1, \"title\": \"Limit\", \"type\": \"integer\"}`, then `required: []`, `output type: array`, the one released order inside `result`, and `True` for `limit: 0`. The `status` parameter becomes `anyOf` with an enum branch and `{\"type\": \"null\"}`, plus `\"default\": null`.\n\n```python\nimport asyncio\nimport json\nfrom typing import Annotated, Literal\n\nfrom pydantic import BaseModel, Field\n\nfrom mcp import Client\nfrom mcp.server import MCPServer\n\nORDERS = [\n    {\"order_id\": \"PO-1001\", \"product\": \"Bagels\", \"quantity\": 1200, \"status\": \"released\"},\n    {\"order_id\": \"PO-1002\", \"product\": \"Croissants\", \"quantity\": 800, \"status\": \"completed\"},\n    {\"order_id\": \"PO-1003\", \"product\": \"Muffins\", \"quantity\": 500, \"status\": \"released\"},\n]\n\nmcp = MCPServer(\"orders-demo\")\n\n\nclass Order(BaseModel):\n    order_id: str\n    product: str\n    quantity: int\n    status: Literal[\"released\", \"completed\", \"cancelled\"]\n\n\n@mcp.tool()\ndef list_orders(\n    status: Literal[\"released\", \"completed\", \"cancelled\"] | None = None,\n    limit: Annotated[int, Field(ge=1, le=50, description=\"Maximum number of orders\")] = 10,\n) -> list[Order]:\n    \"\"\"List orders, optionally filtered by status.\"\"\"\n    rows = [o for o in ORDERS if status is None or o[\"status\"] == status]\n    return [Order(**o) for o in rows[:limit]]\n\n\nasync def main() -> None:\n    tool = (await mcp.list_tools())[0]\n    print(json.dumps(tool.input_schema[\"properties\"][\"limit\"]))\n    print(\"required:\", tool.input_schema.get(\"required\", []))\n    print(\"output type:\", tool.output_schema[\"properties\"][\"result\"][\"type\"])\n    async with Client(mcp) as client:\n        r = await client.call_tool(\"list_orders\", {\"status\": \"released\", \"limit\": 1})\n        print(r.structured_content)\n        bad = await client.call_tool(\"list_orders\", {\"limit\": 0})\n        print(bad.is_error)\n\n\nasyncio.run(main())\n```"
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "Real output of `python -m pytest -q`: `5 passed`. The file sits next to `orders_server.py`.\n\n```python\n\"\"\"test_orders_server.py: run with  python -m pytest -q\"\"\"\nimport asyncio\n\nfrom mcp import Client\n\nfrom orders_server import mcp\n\n\ndef run(coro):\n    return asyncio.run(coro)\n\n\nasync def call(name, args):\n    async with Client(mcp) as client:\n        return await client.call_tool(name, args)\n\n\ndef test_get_order_ok():\n    r = run(call(\"get_order\", {\"order_id\": \"PO-1001\"}))\n    assert r.is_error is False\n    assert r.structured_content == {\"order_id\": \"PO-1001\", \"product\": \"Bagels\",\n                                    \"quantity\": 1200, \"status\": \"released\"}\n\n\ndef test_bad_pattern_is_tool_error():\n    r = run(call(\"get_order\", {\"order_id\": \"1001\"}))\n    assert r.is_error is True\n    assert \"pattern\" in r.content[0].text\n\n\ndef test_unknown_order_names_known_ids():\n    r = run(call(\"get_order\", {\"order_id\": \"PO-9999\"}))\n    assert r.is_error is True\n    assert \"PO-1001\" in r.content[0].text\n\n\ndef test_resource_and_prompt():\n    async def go():\n        async with Client(mcp) as client:\n            res = await client.read_resource(\"orders://PO-1002\")\n            prompt = await client.get_prompt(\"summarize_order\", {\"order_id\": \"PO-1003\"})\n            return res.contents[0].text, prompt.messages[0].content.text\n    text, prompt_text = run(go())\n    assert text == \"PO-1002: 800 x Croissants (completed)\"\n    assert \"PO-1003\" in prompt_text\n\n\ndef test_schema_has_pattern():\n    tools = {t.name: t for t in run(mcp.list_tools())}\n    assert tools[\"get_order\"].input_schema[\"properties\"][\"order_id\"][\"pattern\"] == r\"^PO-\\d{4}$\"\n```"
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "Real output: `300000 public`.\n\n```python\nimport asyncio\n\nfrom mcp import Client\nfrom mcp.server import CacheHint, MCPServer\n\nmcp = MCPServer(\n    \"orders-demo\",\n    cache_hints={\"tools/list\": CacheHint(ttl_ms=300_000, scope=\"public\")},\n)\n\n\n@mcp.tool()\ndef get_status() -> str:\n    \"\"\"Return a fixed status.\"\"\"\n    return \"ok\"\n\n\nasync def main() -> None:\n    async with Client(mcp, cache=None) as client:     # no client cache: see the server's hints\n        result = await client.list_tools()\n        print(result.ttl_ms, result.cache_scope)\n\n\nasyncio.run(main())\n```"
}
```

## 17. Links

- Previous: [L12: What is new: the version history](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history)
- Next part: [Drill: MCP](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp)
- [L4: Transports: stdio and Streamable HTTP](/notes/ai/llm-systems/07-mcp/l4-transports)
- [L5: Stateful vs stateless MCP](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless)
- [L6: Tools in depth](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth) and [L7: JSON Schema for tool arguments](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments)
- [L8: Resources and prompts](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts)
- [L5: Autoscaling and routing](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing): load balancers and replicas in general
- [Build an MCP server (context engineering)](/notes/ai/context-engineering/06-tools-and-mcp/l8-build-an-mcp-server): SQL and file guards
- [In-process MCP tools](/notes/ai/claude-agent-sdk/03-custom-tools/l1-in-process-mcp-tools) and [Databricks MCP servers](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers)

### Sources

All checked on 2026-10-15.

- [PyPI: mcp](https://pypi.org/project/mcp/), [MCP Python SDK repository](https://github.com/modelcontextprotocol/python-sdk), SDK docs: [Running your server](https://py.sdk.modelcontextprotocol.io/run/), [Deploy and scale](https://py.sdk.modelcontextprotocol.io/run/deploy/)
- MCP docs: [MCP Inspector](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector), [Inspector CLI](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector/cli), [Connect to local MCP servers](https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-local-servers)
- MCP specification 2026-07-28: [Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools), [Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http), [Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)
- npm: `@modelcontextprotocol/inspector` dist-tags (`latest` 2.11.0)
- All program outputs on this page: measured in these notes with `mcp` 2.3.0, Python 3.13 and Node 22.22
