---
title: "L1: Claude on Microsoft Foundry"
order: 1
summary: "How Claude runs behind Microsoft Foundry: resources and deployments, the endpoint URL, API keys versus Entra ID bearer tokens with the scope https://ai.azure.com/.default, token lifetime and refresh, the AnthropicFoundry client, deployment name versus model id, unsupported features, the two support ids, the Claude Code environment variables for the Agent SDK, and keyless tokens from Databricks."
status: not-started
tags: [foundry, azure, entra-id, authentication, agent-sdk, deployment]
---

## 1. The question this idea answers

An agent backend runs in Databricks Apps. It calls Claude Sonnet 5, and the company buys Claude through Microsoft Foundry on Azure. To make the first call, the team must answer six practical questions:

1. Which URL does the request go to?
2. What goes into the `model` field: the model id or something else?
3. How does the request prove who it is: an API key or a token?
4. Why does a call that worked at 09:00 fail with HTTP 401 at 10:05?
5. How do you configure the Claude Agent SDK, which runs the Claude Code CLI, for Foundry?
6. Which Claude features do not work on Foundry?

Each wrong answer produces a clear error, but the error often names the symptom, not the cause. This lesson gives the exact facts from the Anthropic, Microsoft and Claude Code docs, all checked on 2026-10-13. It adds tests of the official Python clients in the sandbox.

## 2. Mental model

> [!analogy] An office building with a security desk
> The Foundry **resource** is a building. It holds the billing and security settings. The **deployments** are rooms inside it, each with one Claude model. Your request goes to the building's address and names a room.
>
> You can enter in two ways. An **API key** is a permanent key card: it opens the building until someone replaces it. An **Entra ID token** is a visitor badge from the company security office. It names the building it is valid for (the **scope**), and it expires after about an hour.
>
> **Where it stops working:** a real visitor badge for the wrong building is easy to see. A token for the wrong scope looks like any other long string, and the error only says that access failed. And the room name is your choice. A room called "sonnet5-prod" can hold any model, so the name in your request does not prove which model answers.

## 3. Terms

| Term | Plain meaning |
|---|---|
| Microsoft Foundry | Microsoft's Azure service for AI models. It offers Claude through an Anthropic-compatible endpoint. |
| resource | The top level in Foundry. It "contain[s] your security and billing configuration". |
| deployment | One model instance inside a resource. You call a deployment, not a model. |
| deployment name | The name of a deployment. It is the value of the `model` field in your requests. |
| hosting option | Where inference for a deployment runs: hosted on Azure or hosted on Anthropic. |
| base URL | `https://{resource}.services.ai.azure.com/anthropic/`. Paths such as `v1/messages` follow it. |
| API key | A long-lived secret from the Foundry portal, sent in the `api-key` or `x-api-key` header. |
| Microsoft Entra ID | Azure's identity service. It issues access tokens to users, service principals and managed identities. |
| access token | A short-lived string from Entra ID, sent as `Authorization: Bearer <token>`. |
| scope | The service a token is for. For Claude on Foundry: `https://ai.azure.com/.default`. |
| token provider | A function that returns a valid token on each call and refreshes it before it expires. |
| `DefaultAzureCredential` | An `azure-identity` class that tries several ways to get Azure credentials, for example a managed identity or an `az login` session. |
| RBAC role | An Azure permission set, for example Foundry User or Cognitive Services User. |
| request ids | The response headers `request-id` (Anthropic) and `apim-request-id` (Azure API Management) that support teams need. |

## 4. Method and math

### 4.1 Resources and deployments

The Anthropic Foundry page says: "Foundry uses a two-level hierarchy: **resources** contain your security and billing configuration, while **deployments** are the model instances you call through the API."

Each deployment also has a hosting option:

| | Hosted on Azure | Hosted on Anthropic |
|---|---|---|
| Where inference runs | "Anthropic-operated service running on Azure infrastructure" | "Anthropic-operated service running on Anthropic infrastructure" |
| Models | "The latest models in the Opus, Sonnet, and Haiku families" | "All Claude models available on Microsoft Foundry" |
| Deployment types | Global Standard, US Data Zone Standard | Global Standard |

The model table lists Claude Sonnet 5 with the default deployment name `claude-sonnet-5`, available with both hosting options. It also says: "Claude Sonnet 5.5 supports only Global Standard deployments." For deployments hosted on Azure, "prompts and completions remain within Azure".

### 4.2 The endpoint URL

Both the Anthropic page and the Microsoft page give the same form:

```text
Base URL:   https://{resource}.services.ai.azure.com/anthropic
Messages:   https://{resource}.services.ai.azure.com/anthropic/v1/messages
```

The wire format is the Anthropic Messages shape ([lesson 1.3](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format)). The sandbox built an `AnthropicFoundry` client with `resource="analytics-ai-prod"` and a mock HTTP transport. The real request URL was:

```text
https://analytics-ai-prod.services.ai.azure.com/anthropic/v1/messages
```

### 4.3 Deployment name, not model id

The Anthropic page: "The deployment name you choose becomes the value you pass in the `model` parameter of your API requests." And: "By default, deployment names match the model IDs ... However, you can create custom deployments with different names ... Use the deployment name (not necessarily the model ID) in your API requests."

> [!example] Worked example: two deployments of one model
> A resource has two deployments of Claude Sonnet 5:
>
> | Deployment name | Purpose | `model` field in the request |
> |---|---|---|
> | `claude-sonnet-5` | default name | `"claude-sonnet-5"` |
> | `sonnet5-prod` | a separate rate limit for production | `"sonnet5-prod"` |
>
> A request with `"model": "claude-sonnet-5"` reaches the first deployment, not the second. The documented error for a wrong name is `Model not found` or `Deployment not found`.

> [!trap] A custom deployment name hides the model from Claude Code
> The Claude Code Foundry page says that Claude Code "reads the model from the deployment name in your model variables". For a name that it cannot match, "Claude Code assumes a 200K window unless you declare a different one." So a deployment named `sonnet5-prod` runs with a 200K window in Claude Code, although Sonnet 5 has 1M. Name the deployment with the model id, or map it with `modelOverrides` in `settings.json`, for example `{"modelOverrides": {"claude-sonnet-5": "sonnet5-prod"}}`.

### 4.4 Authentication with an API key

The key comes from the Foundry portal. The page says: "Use either the `api-key` or `x-api-key` header in your requests, or provide it to the SDK."

The Python client reads `ANTHROPIC_FOUNDRY_API_KEY` when you do not pass `api_key`. In the sandbox test with `api_key="KEY123"`, the client sent both headers:

```text
auth headers: {'x-api-key': 'KEY123', 'api-key': 'KEY123'}
```

The source comment of `anthropic` 1.13.0 (`lib/foundry.py`) explains why: "The endpoint authenticates with `x-api-key`; `api-key` is also sent for backwards compatibility."

### 4.5 Authentication with an Entra ID token

With Entra ID, the request carries `Authorization: Bearer {TOKEN}`. The documented Python example:

```python
from anthropic import AnthropicFoundry
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://ai.azure.com/.default"
)

client = AnthropicFoundry(
    resource="example-resource",
    azure_ad_token_provider=token_provider,
)
```

| Fact (checked on 2026-10-13) | Source |
|---|---|
| Scope: `https://ai.azure.com/.default` | Both the Anthropic page and the Microsoft page. The Microsoft troubleshooting table: "For Entra ID, confirm you use scope `https://ai.azure.com/.default`." |
| Roles: "Foundry User (formerly Azure AI User) or Cognitive Services User" | Anthropic page. A missing role gives `403 Forbidden`. |
| Lifetime: "Tokens typically expire after 1 hour." | Anthropic page, troubleshooting section |
| Some models accept only tokens: "Claude Mythos 5-1, Mythos 5, and Mythos Preview support Microsoft Entra ID authentication only." | Microsoft page |
| `api_key` and `azure_ad_token_provider` cannot be combined | `anthropic` source: "The `api_key` and `azure_ad_token_provider` arguments are mutually exclusive" |

> [!note] Why the old scope appears in so many examples
> Many Azure samples use the scope `https://cognitiveservices.azure.com/.default`. It even appears in the docstring example of `get_bearer_token_provider` in `azure-identity` 1.26.0. That scope belongs to the older Azure AI services and Azure OpenAI samples, and an older Microsoft page about Claude used it too. Both current Claude pages use `https://ai.azure.com/.default`. Whether Foundry still accepts a token for the old scope is not confirmed. Use the documented scope.

### 4.6 Token lifetime and refresh

A token expires after about an hour. Two designs handle this in different ways.

**Design A: a token provider.** The `AnthropicFoundry` docstring says that the provider "will be invoked on every request". The provider from `get_bearer_token_provider` caches the token and asks Entra ID for a new one only near expiry. The `azure-core` 1.41.0 source sets `DEFAULT_REFRESH_WINDOW_SECONDS = 300  # 5 minutes`. The sandbox tested this with a fake credential:

```text
lifetime 3600 s: tokens ['tok1', 'tok1', 'tok1'], credential calls 1, scopes ('https://ai.azure.com/.default',)
lifetime 200 s: tokens ['tok1', 'tok2', 'tok3'], credential calls 3, scopes ('https://ai.azure.com/.default',)
```

With a lifetime of one hour, three requests reused one token. With a lifetime of 200 seconds, which is inside the 300-second window, every request got a new token. In the mock test of section 4.2, the client called the provider once per request: `provider calls after 2 requests: 2`.

**Design B: a fixed token string.** Code gets one token at startup and sends it forever. It works for about an hour, then every call fails with `401 Unauthorized`.

> [!example] Worked example: the 10:05 failure
> A service starts at 09:02 and fetches one token. Its lifetime is 60 minutes, so it expires near 10:02.
>
> | Time | Design A (provider) | Design B (fixed string) |
> |---|---|---|
> | 09:02 | token 1 fetched | token 1 fetched |
> | 09:58 | 4 minutes left, inside the 5-minute window: token 2 fetched | token 1 sent |
> | 10:05 | token 2 sent, valid | token 1 sent, expired: HTTP 401 |
>
> The fix for design B is design A. Use a provider, never a token string stored in a global variable.

### 4.7 The Claude Agent SDK on Foundry

The Agent SDK runs the Claude Code CLI, and the CLI reads Foundry settings from environment variables. The Claude Code Foundry page lists them (checked on 2026-10-13):

| Variable | Meaning |
|---|---|
| `CLAUDE_CODE_USE_FOUNDRY=1` | "Enable Microsoft Foundry integration" |
| `ANTHROPIC_FOUNDRY_RESOURCE` | The resource name alone, "such as `my-resource`". Claude Code refuses "a URL or host name" here. |
| `ANTHROPIC_FOUNDRY_BASE_URL` | The alternative: the full base URL, `https://{resource}.services.ai.azure.com/anthropic` |
| `ANTHROPIC_FOUNDRY_API_KEY` | Authentication with a key |
| `ANTHROPIC_FOUNDRY_AUTH_TOKEN` | An Entra ID token that "another process ... has already obtained". It is sent "on every request as the `Authorization: Bearer` header". Requires Claude Code v2.1.203 or later. |
| neither key nor token | Claude Code "uses the Azure SDK default credential chain", for example an `az login` session or a managed identity |
| `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Deployment names for the model aliases. "Pin specific model versions for every deployment." |

The precedence: "`ANTHROPIC_FOUNDRY_AUTH_TOKEN` takes precedence over `ANTHROPIC_FOUNDRY_API_KEY` and over the default credential chain." Two defaults surprise many teams. "Without `ANTHROPIC_DEFAULT_OPUS_MODEL`, the `opus` alias on Microsoft Foundry resolves to Opus 4.6." And background tasks such as session titles use the primary model on Foundry, "because not every account has a Haiku deployment".

In the SDK, pass these variables in `options.env`, which is "merged on top of the inherited process environment" ([Agent SDK L1.1](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is)). This is a sketch. It was not run against a real resource.

```python
from claude_agent_sdk import ClaudeAgentOptions, query

def foundry_options(token: str) -> ClaudeAgentOptions:
    return ClaudeAgentOptions(
        model="claude-sonnet-5",                 # the deployment name
        env={
            "CLAUDE_CODE_USE_FOUNDRY": "1",
            "ANTHROPIC_FOUNDRY_RESOURCE": "analytics-ai-prod",
            "ANTHROPIC_FOUNDRY_AUTH_TOKEN": token,  # fresh for each query()
            "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5",
        },
    )
```

> [!trap] A token in the environment does not refresh
> `ANTHROPIC_FOUNDRY_AUTH_TOKEN` is a fixed string for the life of the CLI process: design B of section 4.6. Each `query()` call starts a new CLI process, so fetch a fresh token for each call from a token provider. Also make sure that the token lives longer than the longest agent run. A token with 10 minutes left can expire in the middle of a long tool loop.

To check the result, run `/status` in an interactive Claude Code session. The page says: "The API provider line shows `Microsoft Foundry`". The documented error for a broken credential chain is "Failed to get token from azureADTokenProvider: ChainedTokenCredential authentication failed".

### 4.8 Keyless tokens from Databricks

A service in Databricks Apps should not store an Azure key. Unity Catalog **service credentials** offer another way: "A service credential object in Unity Catalog encapsulates a long-term cloud credential that provides access to an external cloud service". Databricks can then issue a short-lived Azure token for the identity behind that credential.

The Databricks SDK (`databricks-sdk` 0.152.0) exposes this as `WorkspaceClient().credentials.generate_temporary_service_credential(credential_name, azure_options=...)`. The `azure_options.resources` docstring says: "These resources are the scopes that are passed to the token provider". The result has `azure_aad.aad_token` and `expiration_time`, "in epoch milliseconds". The caller "must be a metastore admin or have the metastore privilege `ACCESS` on the service credential".

```python
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.catalog import GenerateTemporaryServiceCredentialAzureOptions

w = WorkspaceClient()
cred = w.credentials.generate_temporary_service_credential(
    credential_name="foundry-claude",
    azure_options=GenerateTemporaryServiceCredentialAzureOptions(
        resources=["https://ai.azure.com/.default"]),
)
token = cred.azure_aad.aad_token          # send as Authorization: Bearer
expires_ms = cred.expiration_time         # cache until shortly before this
```

This is a sketch from the SDK types. It was not run against a workspace. Wrap it in your own token provider that caches the token and refreshes it before `expiration_time`. Pass the provider to `AnthropicFoundry`, or pass a fresh token to the Agent SDK. [Databricks L2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) covers the credential, the managed identity and the grants.

### 4.9 What does not work on Foundry

The Anthropic page lists features that are "Not supported for Claude in Microsoft Foundry" (checked on 2026-10-13): Admin API, Advisor tool, Claude Managed Agents and Compliance API. It also lists the Models API, the Message Batches API, server-side fallback, and the newest computer use and browser use toolsets.

For deployments hosted on Azure it lists more: code execution, Agent Skills, programmatic tool calling and the Files API. Web search and web fetch work only up to the versions `web_search_20250305` and `web_fetch_20250910`. "Requests that use these features against a deployment hosted on Azure return a `400 Bad Request` error by design."

| Other difference | Effect |
|---|---|
| Rate-limit headers | "Foundry does not include Anthropic's standard rate limit headers". Use Azure monitoring. |
| The Python client | In the sandbox, `AnthropicFoundry(...).models` and `.messages.batches` both returned `None`. |
| Mid-conversation system messages | Foundry is not in the documented platform list ([lesson 1.1](/notes/ai/llm-apis/01-messages-api/l1-messages-and-content-blocks)). |
| Claude Code | "Claude Code detects deployments hosted on Azure and automatically adapts its feature set." |

### 4.10 Support ids

The page says: "When contacting support, provide both the `request-id` and `apim-request-id` (Azure API Management) values". The Python client exposes the first as `message._request_id`. For the second, read the raw response headers. The sandbox mock test printed both:

```python
raw = client.messages.with_raw_response.create(model="sonnet5-prod", max_tokens=16,
                                               messages=[{"role": "user", "content": "hi"}])
msg = raw.parse()
print(msg._request_id, raw.headers.get("apim-request-id"))
```

```text
request-id: req_abc apim-request-id: 11111111-2222-3333-4444-555555555555
```

The values come from the mock server. A real response carries real ids. Log both on every call, next to your own chat id and turn id.

### 4.11 Production view

| Concern | What to do |
|---|---|
| Security | Prefer Entra ID tokens from a managed identity or a Databricks service credential. Store no API key in the app. |
| Reliability | Use a token provider that refreshes, never a fixed token string. Give each Agent SDK `query()` a fresh token that outlives the run. |
| Correctness | Use deployment names that equal the model ids, or declare `modelOverrides`, so Claude Code knows the window. |
| Configuration | Set `ANTHROPIC_FOUNDRY_RESOURCE` to the name only. Pin `ANTHROPIC_DEFAULT_*_MODEL` to deployment names. |
| Features | Check the unsupported list before you use batches, the Files API or new server tools. |
| Observability | Log `request-id` and `apim-request-id` for every call. Use Azure monitoring for rate limits. |
| Cost | Foundry bills in Claude Consumption Units at USD 0.01 each, converted from standard per-model rates. US Data Zone deployments apply a 1.1 multiplier. |

## 5. Code

These exercises go in `llm-apis/08-foundry.ipynb`. Exercises 1.1 and 1.2 need no Azure access.

**Exercise 1.1: build the URL.** Write `foundry_messages_url(resource=None, base_url=None)`.

Acceptance tests:

- `resource="analytics-ai-prod"` gives `https://analytics-ai-prod.services.ai.azure.com/anthropic/v1/messages`.
- Both arguments, or neither, raise `ValueError`.
- A resource value that contains `.` or `://` raises `ValueError`, as Claude Code does.

**Exercise 1.2: a caching token provider.** Write `make_provider(fetch, clock, refresh_window=300)`. `fetch()` returns `(token, expires_at_seconds)`. `clock()` returns the current time. Inject both, so the tests need no real time.

Acceptance tests:

- Three calls with a token that expires in 3,600 seconds call `fetch` once.
- A call at 3,301 seconds after the fetch calls `fetch` again.
- A token that expires in 200 seconds is refreshed on every call.

**Exercise 1.3 (needs Foundry access): two ways in.** Call your deployment once with an API key and once with `DefaultAzureCredential` and the documented scope.

Acceptance tests:

- Both calls return a message. Print `request-id` and `apim-request-id` for each.
- A call with the deployment name changed by one letter returns the documented not-found error. Record its exact text.

**Exercise 1.4 (needs Foundry access): the SDK on Foundry.** Build `ClaudeAgentOptions` from section 4.7 with a fresh token, and run one `query()`.

Acceptance test: the `SystemMessage` with subtype `init` shows your deployment name as `model`, and the run ends with a `ResultMessage` of subtype `success`.

## 6. Common mistakes

1. **Putting the model id in `model` when the deployment has a custom name.** Foundry routes by deployment name.
2. **A token for `https://cognitiveservices.azure.com/.default`.** The Claude pages document `https://ai.azure.com/.default`.
3. **One token fetched at startup.** It expires after about an hour. Use a provider that refreshes.
4. **A URL in `ANTHROPIC_FOUNDRY_RESOURCE`.** Claude Code accepts the name only. Use `ANTHROPIC_FOUNDRY_BASE_URL` for a URL.
5. **Unpinned model aliases in Claude Code.** On Foundry, `opus` resolves to Opus 4.6 without `ANTHROPIC_DEFAULT_OPUS_MODEL`.
6. **Expecting Anthropic rate-limit headers.** Foundry does not send them.
7. **Logging only one support id.** Support needs both `request-id` and `apim-request-id`.

## 7. One-minute explanation

On Microsoft Foundry, a resource holds billing and security, and deployments inside it are the models that you call. Requests go to `https://{resource}.services.ai.azure.com/anthropic/v1/messages` in the Anthropic Messages shape, and the `model` field holds the deployment name, which can differ from the model id. You authenticate with an API key in the `x-api-key` or `api-key` header, or with an Entra ID bearer token for the scope `https://ai.azure.com/.default`. Tokens expire after about an hour, so use a token provider that refreshes before expiry, never a fixed string. The `AnthropicFoundry` client takes either a key or a provider, and calls the provider on every request. The Agent SDK reaches Foundry through Claude Code variables: `CLAUDE_CODE_USE_FOUNDRY=1`, the resource name, and a key or a token. Without either, it uses the default Azure credential chain. Pin the model aliases to deployment names. Some features, such as batches and the Models API, do not exist on Foundry, and Foundry sends no Anthropic rate-limit headers. For support, log both `request-id` and `apim-request-id`.

## 8. Check questions

```check
{
  "question": "A request to Foundry fails with Deployment not found. The code sends model = \"claude-sonnet-5\". The portal shows one deployment named sonnet5-prod. What is wrong, and what is the fix?",
  "answer": "Foundry routes by deployment name, and the request names a deployment that does not exist. Send model = \"sonnet5-prod\". For Claude Code, also map the name with modelOverrides or rename the deployment to the model id, or Claude Code assumes a 200K window."
}
```

```check
{
  "question": "A service fetches one Entra ID token at startup and works for an hour. Then every call returns 401. Explain, and give the fix with the azure-identity API.",
  "answer": "The token expired. Tokens typically expire after one hour, and the service never fetched a new one. Use get_bearer_token_provider(DefaultAzureCredential(), \"https://ai.azure.com/.default\") and pass the provider to AnthropicFoundry as azure_ad_token_provider. The client calls it on every request, and the provider refreshes the token when less than 5 minutes remain."
}
```

```check
{
  "question": "Which environment variables make the Claude Agent SDK call a Foundry resource named analytics-ai-prod with a token that your app fetched? What is one risk of this setup?",
  "answer": "CLAUDE_CODE_USE_FOUNDRY=1, ANTHROPIC_FOUNDRY_RESOURCE=analytics-ai-prod and ANTHROPIC_FOUNDRY_AUTH_TOKEN=<token>, passed in options.env, plus pinned model variables such as ANTHROPIC_DEFAULT_SONNET_MODEL. The risk: the token is a fixed string for the CLI process, so it does not refresh. Fetch a fresh token for each query() and make sure it outlives the longest run."
}
```

```check
{
  "question": "A teammate copies a sample that uses the scope https://cognitiveservices.azure.com/.default for Claude on Foundry. What do you tell them, and where does that scope come from?",
  "answer": "Use https://ai.azure.com/.default, which both the Anthropic and the Microsoft Claude pages document. The old scope comes from Azure AI services and Azure OpenAI samples, older pages, and even the docstring example of get_bearer_token_provider. Whether Foundry accepts it for Claude is not confirmed, so do not depend on it."
}
```

## 9. Links

- Previous part: [L3.2: Converting between formats](/notes/ai/llm-apis/03-openai-format/l2-converting-between-formats)
- Next: [L2: Prompt caching in agent loops](/notes/ai/llm-apis/04-providers-and-caching/l2-prompt-caching-in-agent-loops)
- The wire format: [L1.3: The API sets the format, not the model](/notes/ai/llm-apis/01-messages-api/l3-the-api-sets-the-format)
- The `options.env` rule: [Agent SDK L1.1: What the SDK is](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is)
- Keyless tokens: [Databricks L2.2: Unity Catalog service credentials](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials)
- Secrets in apps: [Databricks L1.2: App resources and secrets](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets)
- [Glossary](/notes/ai/llm-apis/glossary)
