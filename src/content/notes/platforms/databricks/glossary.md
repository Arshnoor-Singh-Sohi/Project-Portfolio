---
title: "Glossary"
order: 2
summary: "Every term in Databricks Platform, with a plain meaning, in alphabetical order. A term enters when a lesson defines it."
---

The "First seen" column links to the lesson that defines the term, as part.lesson. For example, 1.2 is Part 1, Lesson 2.

| Term | Plain meaning | First seen |
|---|---|---|
| `/logz` | A path on the app URL that shows the current logs of the app. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| `ACCESS` | The Unity Catalog privilege that lets a principal use a service credential. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| access connector | An Azure resource ("Access Connector for Azure Databricks") that connects a managed identity to Databricks. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| app authorization | The app acts as its own service principal, with the same rights for every user. | [2.3](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps) |
| app resource | A declared link from the app to one existing Databricks object, with one permission for the app service principal. | [1.2](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets) |
| app service principal | The identity that Databricks creates for each app. All users of the app share it. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| `app.yaml` | The file at the root of the source code. It sets the start command and extra environment variables. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| `asyncio.run()` | A function that creates a new event loop, runs one coroutine to the end, then closes the loop. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| `asyncio.to_thread()` | A coroutine that runs a blocking function in a worker thread and waits for its result. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| `AsyncLakebasePool` | The async variant. It wraps a psycopg `AsyncConnectionPool`. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| auth type | The name of one authentication method in the SDK, for example `pat`, `oauth-m2m` or `databricks-cli`. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| auto stop | The idle time after which a warehouse stops by itself. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| autocommit | A connection mode in which every statement commits on its own. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| autoscaling | A change of the instance count by the platform, based on load. The Apps docs do not describe it. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
| autoscaling range | The minimum and maximum CU between which a compute changes its size by load. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| branch | A version of the project's data, used like a Git branch. Each branch has its own compute and databases. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| build instance | The instance that receives a new deployment first. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
| bundle | A project with a `databricks.yml` file. The Databricks CLI deploys the resources that it declares. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| Can connect and create | The only permission for a Lakebase app resource. It gives `CONNECT` and `CREATE` on the database. | [5.2](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource) |
| `Can manage` | The permission that a person needs on both the app and the object to add a resource. | [1.2](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets) |
| catalog commits | A Unity Catalog setting for managed tables that allows transactions across several statements and tables. | [5.4](/notes/platforms/databricks/05-lakebase/l4-lakebase-vs-delta) |
| `check` | A pool callback that tests a connection before the pool lends it out. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| client ID | The ID of the app service principal. It is also the name of its Postgres role. | [5.2](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource) |
| `command` | The `app.yaml` key with the start command, written as a list. The platform does not run it in a shell. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| commit (Delta) | One new version of a Delta table: new data files plus one entry in the transaction log. | [5.4](/notes/platforms/databricks/05-lakebase/l4-lakebase-vs-delta) |
| compaction | Rewriting many small files into fewer large ones, for example with `OPTIMIZE`. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| compute | The running Postgres engine of a branch. The primary compute reads and writes. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| compute size | The CPU and memory of the app: Medium, Large or XLarge. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| compute unit (CU) | The size unit of a compute. One CU has about 2 GB of RAM, with CPU and local SSD. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| config source | The place that gave a setting its value: an argument, an environment variable or the profile file. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| `configure` | A pool callback that runs once on each new connection. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| connection class | The class that the pool uses to open each connection. Its `connect` method runs once per new connection. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| connection test | A small query that proves the identity, the database and the privileges of a connection. | [5.2](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource) |
| `ConnectionPool` | The psycopg_pool class that keeps connections open and lends them out. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| consent | The user's one-time approval that the app may act with their token for a set of scopes. | [2.3](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps) |
| container | An isolated runtime that holds the app process, its libraries and its own file system. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| context cost | The tokens that a tool result adds to every later model call while it stays in the history. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| conversation | A thread of questions and answers in Genie. A `conversation_id` names it. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| `CREATE` on a schema | The privilege to create new tables and other objects inside the schema. | [5.2](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource) |
| custom MCP server | Your own MCP server, hosted as a Databricks App. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| database credential | An OAuth token that a program uses as the Postgres password. It expires after one hour. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| Databricks App | A web application that runs as a container service on the Databricks serverless platform. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| Databricks-provided MCP | An MCP server that Databricks hosts in the `system.ai` schema, for example `system.ai.genie_one_mcp`. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| `DATABRICKS_APP_PORT` | The environment variable with the port number on which the app must listen. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| `DATABRICKS_CONFIG_FILE` | The environment variable with a different path for the profile file. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| `DATABRICKS_CONFIG_PROFILE` | The environment variable that names the profile to use. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| `databricks_postgres` | The default database in every project. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| `.databrickscfg` | The profile file. Default path `~/.databrickscfg` on Unix and macOS, `%USERPROFILE%\.databrickscfg` on Windows. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| `DatabricksMCPClient` | The client class in the `databricks-mcp` package. It lists and calls the tools of one server URL. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| deep link | A URL that opens the full conversation in the Databricks UI. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| default privileges | Grants that Postgres applies to tables that a role creates in the future. | [5.2](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource) |
| `DEFAULT` profile | The profile that tools use when no profile is named. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| Delta table | A table stored as Parquet data files plus a transaction log. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| deploy script | A program that creates or changes resources in a workspace, for example an app and its resources. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| deployment | One version of the source code that the platform installs and starts on the app compute. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| `dict_row` | A psycopg row factory that returns each row as a dictionary. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| disposition | How the result returns: `INLINE` in the response, or `EXTERNAL_LINKS` to cloud storage. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| durable store | Storage that survives restarts and that every instance reads, for example Lakebase. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
| endpoint | The stable connection point of a compute. Its resource name has the form `projects/.../branches/.../endpoints/...`. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| `env` | The `app.yaml` key with a list of extra environment variables for the app. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| Environment page | The page of the app in the workspace UI that shows its environment. Values set with `value` appear there in plain text. | [1.2](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets) |
| event loop | The asyncio scheduler. It runs coroutines on one thread and switches between them at each `await`. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| `expiration_time` | The time in epoch milliseconds when a temporary credential expires. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| forwarded header | A header that the proxy adds to a request before it forwards the request. | [2.3](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps) |
| Genie | The Databricks feature that answers data questions in natural language by writing and running SQL. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| Genie Agent | A configured Genie for one data domain: tables, instructions and examples. The docs say: "Genie Agents were formerly known as Genie Spaces." | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| Genie One | The workspace-wide Genie that answers across your data and can route parts of a question to Genie Agents. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| Genie One MCP server | The MCP server `system.ai.genie_one_mcp`. It exposes Genie One as tools. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| Genie Ontology | The governed semantic layer that Genie One uses for business terms, metric definitions and table relationships. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| Git history | Every earlier version of every file in a repository. A deleted line stays in it. | [1.2](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets) |
| horizontal scaling | Running several instances and spreading the requests over them. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
| horizontally scaled app | An app that runs a configured number of instances, 1 to 5, behind one URL. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
| host | The URL of the workspace, for example `https://adb-1234.5.azuredatabricks.net`. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| IdP | Identity provider: the system that authenticates users, for example Microsoft Entra ID. | [2.3](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps) |
| informational constraint | A key that the table declares but does not enforce. | [5.4](/notes/platforms/databricks/05-lakebase/l4-lakebase-vs-delta) |
| instance | One running copy of the app, with its own memory and its own local file system. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
| instance-local state | Data in the memory or on the disk of one instance. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
| key rotation | Replacing a key with a new one and disabling the old one. | [1.2](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets) |
| Lakebase | The managed PostgreSQL database service of Databricks. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| Lakebase Change Data Feed | A Lakebase feature that writes every insert, update and delete of a Postgres table into a Delta table. The official article calls the pattern Lakehouse Sync. | [5.4](/notes/platforms/databricks/05-lakebase/l4-lakebase-vs-delta) |
| Lakebase Provisioned | The original version of Lakebase with fixed-size compute. All instances are now upgraded. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| `LakebasePool` | The sync connection pool class in `databricks_ai_bridge.lakebase`. It wraps a psycopg `ConnectionPool`. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| lease | A database row field that marks a chat as busy until a time. Every instance can read it. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
| least privilege | The rule that an identity gets only the permissions that its task needs. | [1.2](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets) |
| legacy workspace endpoint | An older MCP URL under `/api/2.0/mcp/...` that bypasses Unity Gateway. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| lifespan | The startup and shutdown hook of a web application. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| local file system | The disk inside the app container. Its files are lost when the app restarts. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| managed identity | An Azure identity with no secret that you handle. Azure issues its tokens. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| MCP server | A service that offers tools to an agent through the Model Context Protocol. The agent lists the tools and calls them. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| Microsoft Entra ID | The identity service of Azure. It issues tokens. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| mint | To ask Databricks for a new database credential. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| OAuth M2M | Machine-to-machine OAuth. A service principal uses a client ID and a client secret to get short-lived tokens. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| OAuth scope | A label on an OAuth token that limits what the token can do, for example `ai-gateway`. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| OAuth U2M | User-to-machine OAuth. A person authenticates in a browser, and the CLI stores and renews short-lived tokens. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| OLAP | Large reads that scan, join and aggregate many rows. Reports and dashboards are OLAP. | [5.4](/notes/platforms/databricks/05-lakebase/l4-lakebase-vs-delta) |
| OLTP | Online transaction processing: many small, fast reads and writes of single rows, grouped in transactions. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| OLTP database | A database built for many small transactions, such as PostgreSQL. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| `on_wait_timeout` | What happens when the wait ends first: `CONTINUE` or `CANCEL`. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| optimistic concurrency control | Writers work without locks and check for conflicts only at commit time. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| `OPTIMIZE` | The Delta command that merges small files into larger ones. | [5.4](/notes/platforms/databricks/05-lakebase/l4-lakebase-vs-delta) |
| owner | The role that created a schema or table. Only the owner (or a member of it) can change, drop or grant it. | [5.2](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource) |
| owner key | The value that a chat service stores with each chat to name its owner. | [2.3](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps) |
| PAT | Personal access token. A long-lived secret string that acts as one user. The docs call it legacy. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| PG variables | The environment variables `PGHOST`, `PGUSER` and others. The Postgres client library reads them when the connection string omits a value. | [5.2](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource) |
| plain text | A value written as readable characters in a file, a screen or a log. | [1.2](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets) |
| point read | A read of a few rows found by a key, for example the last 50 messages of one chat. | [5.4](/notes/platforms/databricks/05-lakebase/l4-lakebase-vs-delta) |
| polling | Asking again and again for the state of a slow job until it ends. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| `pool_kwargs` | Extra keyword arguments that `LakebasePool` passes to `ConnectionPool`. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| Postgres role | A database user. A Databricks identity connects as a role with the same name. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| profile | A named section of the file, for example `[prod]`, with a host and authentication fields. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| progress step | One status message that Genie reports while it works. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| project | The top-level container of a Lakebase database: its branches, computes and databases. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| read replica | An extra compute of a branch that only reads. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| rebalancing | The platform moves sessions between instances. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
| refresh margin | The time before expiry when the client asks for a new token. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| resource key | The name of a resource inside the app. `valueFrom` refers to it. | [1.2](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets) |
| resource permission | The permission that the resource grants to the app service principal, for example `Can read` on a secret scope. | [1.2](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets) |
| response | One answer that Genie is producing or has produced. A `response_id` names it. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| reverse proxy | The server in front of the app that receives each request first and forwards it to the app. | [2.3](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps) |
| role assignment | An Azure rule that gives an identity a role on a resource, for example Cognitive Services User. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| routing cookie | The `__Host-databricks-app-router` cookie that keeps a browser on one instance. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
| row lock | A Postgres lock on one changed row. A second writer waits for it instead of failing. | [5.4](/notes/platforms/databricks/05-lakebase/l4-lakebase-vs-delta) |
| running event loop | An event loop that is active on the current thread at this moment. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| scale to zero | The compute stops after a period with no activity and starts again on the next connection. | [5.1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is) |
| scope | The target that a token is for, written as a URL that ends in `/.default`. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| secret | A named value, for example an API key, stored encrypted by Databricks. | [1.2](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets) |
| secret scope | A named collection of secrets. Permissions apply to the whole scope. | [1.2](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets) |
| sequence | The number generator behind a `serial` column. It needs its own privilege. | [5.2](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource) |
| service credential | A Unity Catalog object that wraps a long-term cloud credential for access to external cloud services. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| session affinity | Routing the requests of one session to the same instance. Also called sticky sessions. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
| small files | Many data files far below the target file size. They slow reads. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| SQL warehouse | Databricks compute that runs SQL. Types: serverless, pro and classic. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| standard app | An app without horizontal scaling. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
| Statement Execution API | The REST API that runs one SQL statement on a warehouse and returns its result. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| `statement_id` | The ID of one statement execution. Clients use it to poll and to fetch results. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| stream writer | The LangGraph function that sends custom events to the caller of `stream()` while a node or tool runs. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| streamable HTTP | The MCP transport over HTTP that Databricks servers use. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| synced table | A read copy of a Unity Catalog table inside Lakebase Postgres. | [5.4](/notes/platforms/databricks/05-lakebase/l4-lakebase-vs-delta) |
| system environment | The managed runtime of every app: operating system, Python version and Node.js version. | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| system-assigned identity | A managed identity that belongs to one Azure resource and is deleted with it. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| table privilege | `SELECT`, `INSERT`, `UPDATE` or `DELETE` on one table. | [5.2](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource) |
| temporary service credential | A short-lived token that Unity Catalog issues from a service credential. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| token cache | The stored token and the time it was minted. It is reused until it is older than the cache duration. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| token provider | A function that the Foundry client calls to get a bearer token. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| `token_cache_duration_seconds` | How long the pool reuses one token. Default 900 seconds. | [5.3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) |
| transaction log | The `_delta_log` folder. Each commit adds one JSON file that names the files added and removed. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| truncated result | A result that holds only part of the rows, to protect the context window. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| unified authentication | The shared rules by which the Databricks CLI and SDKs find their settings and credentials. | [2.1](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles) |
| Unity Gateway | The Databricks gateway that receives calls to `system.ai` MCPs and applies grants, policies and tracing. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| `USAGE` on a schema | The privilege to find objects inside the schema by name. Without it, every table in the schema is unreachable. | [5.2](/notes/platforms/databricks/05-lakebase/l2-lakebase-as-an-app-resource) |
| user authorization | The app acts with a token of the signed-in user, within approved scopes. | [2.3](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps) |
| user-assigned identity | A managed identity that exists as its own Azure resource. | [2.2](/notes/platforms/databricks/02-identity-and-auth/l2-uc-service-credentials) |
| `valueFrom` | An `env` field that takes its value from an app resource ([L2](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets)). | [1.1](/notes/platforms/databricks/01-apps/l1-databricks-apps) |
| `wait_timeout` | How long the first call waits for the result: `0s`, or 5 to 50 seconds. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| worker thread | A second thread. It has no running event loop unless code creates one there. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| `WorkspaceClient` | The Databricks SDK object that holds the workspace URL and the credentials. | [4.1](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers) |
| wrapper tool | One tool in your harness that calls several MCP tools in code and returns one result to the model. | [4.2](/notes/platforms/databricks/04-mcp-and-genie/l2-genie-one-mcp) |
| write conflict | A failed commit because another writer changed the same data first. | [5.4](/notes/platforms/databricks/05-lakebase/l4-lakebase-vs-delta) |
| WriteSerializable | The default isolation level of Delta writes on Databricks. | [3.1](/notes/platforms/databricks/03-sql-and-delta/l1-statement-execution-and-delta) |
| `x-forwarded-access-token` | The header with the access token of the user, present when user authorization is on. | [2.3](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps) |
| `X-Forwarded-Email` | "The user email provided by the IdP." | [2.3](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps) |
| `X-Forwarded-Preferred-Username` | "The user name provided by the IdP." | [2.3](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps) |
| `X-Forwarded-User` | "The user identifier provided by the IdP." | [2.3](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps) |
| `X-Request-Id` | "The UUID of the request." | [2.3](/notes/platforms/databricks/02-identity-and-auth/l3-user-identity-in-apps) |
| `X-Routing-Key` | A request header with a stable value. It keeps an API client on one instance. | [1.3](/notes/platforms/databricks/01-apps/l3-app-instances) |
