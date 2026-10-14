---
title: "L2: Lakebase as an App resource"
order: 2
summary: "Adding a Lakebase database as a Databricks App resource gives the app a Postgres role named after its service principal, CONNECT and CREATE on the database, and six PG environment variables. It does not give access to tables that other roles own. The exact variables, the grants that the app needs and why, token generation in code, and a connection test. Every SQL result ran on PostgreSQL 16."
status: not-started
tags: [databricks, lakebase, apps, app-resources, postgres-roles, grants, oauth]
---

## 1. The question this idea answers

A chat service runs as a Databricks App and must store chat history in Lakebase. The code must find the database, authenticate, and read and write its tables. It must do so without a password in the source code or in `app.yaml`.

Databricks solves the first part with an **app resource**. You attach the database to the app, and the platform creates a role and injects connection details. But the resource does not solve everything. The app still needs privileges on the schemas and tables it uses, and it still needs a fresh token for every new connection.

This lesson answers five questions. What does adding the resource do? Which environment variables does the app receive? Which Postgres role does the app use, and what may it do? Which grants are still missing? How does the code get a token and prove that the connection works?

## 2. Mental model

> [!analogy] A badge for a records room
> A new employee gets a badge. The badge opens the door of the records room and allows the employee to add new cabinets. The employee owns the cabinets that they add.
>
> The badge does not open the cabinets that other people already placed in the room. Each of those cabinets has its own lock, and only its owner can give out keys.
>
> Adding the Lakebase resource is the badge: the app may connect and create. The existing tables are the locked cabinets: their owner must grant access.
>
> **Where it stops working:** a badge works all day. The app's password is a token that expires after one hour, and Lakebase checks it only when a connection opens ([L1](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is)). So the app must mint a new token for new connections.

## 3. Terms

| Term | Plain meaning |
|---|---|
| app resource | A Databricks object that you attach to an app, so the app's service principal gets access to it. |
| resource key | The name of a resource inside the app. `valueFrom` in `app.yaml` refers to it. |
| Can connect and create | The only permission for a Lakebase app resource. It gives `CONNECT` and `CREATE` on the database. |
| app service principal | The identity of the app. All users of the app share it. |
| client ID | The ID of the app service principal. It is also the name of its Postgres role. |
| PG variables | The environment variables `PGHOST`, `PGUSER` and others. The Postgres client library reads them when the connection string omits a value. |
| owner | The role that created a schema or table. Only the owner (or a member of it) can change, drop or grant it. |
| `USAGE` on a schema | The privilege to find objects inside the schema by name. Without it, every table in the schema is unreachable. |
| `CREATE` on a schema | The privilege to create new tables and other objects inside the schema. |
| table privilege | `SELECT`, `INSERT`, `UPDATE` or `DELETE` on one table. |
| default privileges | Grants that Postgres applies to tables that a role creates in the future. |
| sequence | The number generator behind a `serial` column. It needs its own privilege. |
| connection test | A small query that proves the identity, the database and the privileges of a connection. |

## 4. Method and math

### 4.1 Adding the resource

The release notes of Mar 16, 2026 say: "You can now add Lakebase databases as resources for your Databricks app." The page "Add a Lakebase resource to a Databricks app" (last updated Oct 9, 2026, checked on 2026-10-13) gives the steps:

1. In the **App resources** section, choose **+ Add resource** and then **Database**.
2. Choose the type: "Lakebase Autoscaling" or "Lakebase Provisioned".
3. For Autoscaling, select a project, a branch and a database. For Provisioned, select a database instance and a database.
4. Optionally set a custom resource key. The default key is `postgres` for Autoscaling and `database` for Provisioned.
5. The permission is "Can connect and create". It is the only option.

### 4.2 What the app receives

The same page lists the variables that the platform injects. It adds that they reflect only the first database resource.

| Variable | Docs description |
|---|---|
| `PGAPPNAME` | "App name" |
| `PGDATABASE` | "Name of the database" |
| `PGHOST` | "Host name of the PostgreSQL server" |
| `PGPORT` | "Port for the PostgreSQL server" |
| `PGSSLMODE` | "SSL mode for the connection" |
| `PGUSER` | "Service principal's client ID and role name" |

Every app also receives `DATABRICKS_HOST`, `DATABRICKS_CLIENT_ID` and `DATABRICKS_CLIENT_SECRET` ([Apps L1](/notes/platforms/databricks/01-apps/l1-databricks-apps)). So `PGUSER` and `DATABRICKS_CLIENT_ID` hold the same value.

The variables do not contain the endpoint name, but the credential call needs it ([L1, section 4.5](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is)). `valueFrom` gives it. The environment variables page (last updated Oct 9, 2026) has a table "The following table shows the value that `valueFrom` resolves to for each resource type":

| Resource type | Resolved value | Example |
|---|---|---|
| Lakebase Autoscaling database | Endpoint path | `projects/my-project/branches/main/endpoints/ep123` |
| Lakebase Provisioned database | Host | `postgres-host.example.com` |

So `app.yaml` needs one entry. The variable name `LAKEBASE_ENDPOINT` is a free choice. This block is a sketch from the docs, not tested in a workspace:

```yaml
env:
  - name: LAKEBASE_ENDPOINT
    valueFrom: postgres
```

Why do the `PG` variables help? The Postgres client library reads them for every value that the connection string omits. This sandbox test set five of them, then connected with an empty connection string and only a password:

```python
# PGHOST=/var/tmp/pgtest PGPORT=5433 PGDATABASE=dbxb
# PGUSER=8c01cfb1-62c9-4a09-88a8-e195f4b01b08 PGAPPNAME=chat-app
with psycopg.connect("", password="token-from-sdk") as c:
    print(c.execute("SELECT current_user, current_database(), current_setting(%s)",
                    ("application_name",)).fetchone())
```

```text
('8c01cfb1-62c9-4a09-88a8-e195f4b01b08', 'dbxb', 'chat-app')
```

The local server has no TLS, so the test used `PGSSLMODE=prefer`. In an app, the platform sets `PGSSLMODE`.

### 4.3 The role of the app service principal

The resource page says:

- "Databricks creates a PostgreSQL role in the selected database. The role name matches the service principal's client ID."
- "Databricks grants the service principal `CONNECT` and `CREATE` privileges on the selected database."
- These privileges "let the app create schemas and tables in the database."

A second page, "Using Lakebase with Databricks Apps" (last updated Sep 18, 2026), says it more loosely: Databricks "creates a matching Postgres role for that service principal and grants it full database access." The first page is the specific one. It names exactly two database privileges. Neither page mentions privileges on existing schemas or tables. So check the real privileges with the connection test of section 4.6.

> [!trap] CONNECT and CREATE do not open existing tables
> `CREATE` on a database allows `CREATE SCHEMA`. It does not allow reading a table that another role created. In Postgres 15 and later, it also does not allow creating tables in the `public` schema. Both need separate grants.

Without the resource, you can create the role yourself. The Lakebase tutorial "Connect a custom Databricks app to Lakebase" (last updated Oct 6, 2026) does it with this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS databricks_auth;
SELECT databricks_create_role('<DATABRICKS_CLIENT_ID>', 'SERVICE_PRINCIPAL');
GRANT CONNECT ON DATABASE databricks_postgres TO "<DATABRICKS_CLIENT_ID>";
GRANT CREATE, USAGE ON SCHEMA public TO "<DATABRICKS_CLIENT_ID>";
```

The same tutorial warns: "service principals don't inherit default schema permissions".

### 4.4 The grants that are still missing

Who owns the schema decides which grants you need. Two designs are common.

| | Design A: the app owns its schema | Design B: a migration role owns the schema |
|---|---|---|
| Who runs `CREATE SCHEMA` and `CREATE TABLE` | The app service principal, at deploy time | A separate role: a developer or a deployment service principal |
| App privileges | Everything on its own objects, as owner | Only the grants that you give: `USAGE` and table privileges |
| Can the app drop its tables? | Yes | No |
| Can people read the tables? | Only after the app grants them access | The owner grants them access |

The sandbox reproduced both designs on PostgreSQL 16.15 with a role named like a client ID, `8c01cfb1-62c9-4a09-88a8-e195f4b01b08`. The role had `CONNECT` and `CREATE` on the database, like an app resource gives.

**Design A.** The app role ran these statements:

```text
CREATE TABLE public.t_in_public (id int);
ERROR:  permission denied for schema public

CREATE SCHEMA app_chat;                     -- CREATE SCHEMA
CREATE TABLE app_chat.messages (...);       -- CREATE TABLE
schema owner: 8c01cfb1-62c9-4a09-88a8-e195f4b01b08
table owner:  8c01cfb1-62c9-4a09-88a8-e195f4b01b08
```

Then a developer role tried to read the app's table:

```text
ERROR:  permission denied for schema app_chat
```

**Design B.** A role `dev_owner` created the schema `chat` with the tables `chats` and `messages`. The app role then tried to read, and the owner added grants one step at a time:

| Step | Result for the app role |
|---|---|
| No grants | `ERROR:  permission denied for schema chat` |
| `GRANT USAGE ON SCHEMA chat` | `ERROR:  permission denied for table chats` |
| `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA chat` | Insert and select work |
| Insert into a table with a `serial` column | `ERROR:  permission denied for sequence legacy_id_seq` |
| Insert into a table with `GENERATED ALWAYS AS IDENTITY` | Works with no sequence grant |
| `GRANT USAGE ON ALL SEQUENCES IN SCHEMA chat` | The `serial` insert works |
| `CREATE TABLE chat.app_made (id int)` | `ERROR:  permission denied for schema chat` |
| `DROP TABLE chat.messages` | `ERROR:  must be owner of table messages` |

The full Design B grant script, as the schema owner runs it:

```sql
GRANT USAGE ON SCHEMA chat TO "<client-id>";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA chat TO "<client-id>";
ALTER DEFAULT PRIVILEGES IN SCHEMA chat
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "<client-id>";
-- only if a table uses serial columns:
GRANT USAGE ON ALL SEQUENCES IN SCHEMA chat TO "<client-id>";
```

> [!trap] Default privileges belong to the role that set them
> `ALTER DEFAULT PRIVILEGES` applies to future tables that the role running it creates. In the sandbox, `dev_owner` ran it. A new table that `dev_owner` created was readable by the app at once. A new table that the `postgres` role created in the same schema gave `ERROR:  permission denied for table made_by_admin`. So run all migrations as the same owner role, or run the statement for each creating role.

> [!key] The resource gives a door, not the cabinets
> The app resource gives a role named after the client ID, plus `CONNECT` and `CREATE` on one database. Every schema and table that another role owns needs `USAGE` on the schema and table privileges for the app. Prefer identity columns, so no sequence grants are needed.

> [!example] Worked example: choosing the design for chat history
> A chat service has two tables, `chats` and `messages`. A data team wants to read them for quality reviews. Deployments happen twice a week.
>
> 1. Design A: the app runs its migrations at startup and owns the tables. The data team needs a grant from the app role. A bug in the app could drop a table, because the app is the owner.
> 2. Design B: a deployment service principal owns the schema and runs migrations. The app gets 4 table privileges on 2 tables and `USAGE` on 1 schema. The app cannot drop or alter a table. The data team gets `SELECT` from the same owner.
> 3. Count of grant statements in Design B: 1 schema grant + 1 table grant + 1 default-privileges statement = 3 statements for the app. The data team needs the same 3 kinds of statement, with `SELECT` only.
>
> Design B is the least-privilege choice for production. Design A is simpler for a prototype.

### 4.5 Getting a token in code

Inside an app, `WorkspaceClient()` authenticates as the app service principal from the `DATABRICKS_*` variables ([MCP L1, section 4.3](/notes/platforms/databricks/04-mcp-and-genie/l1-databricks-mcp-servers)). The tutorial says: "When you deploy the app to Databricks, it runs as its service principal and generates tokens for that identity."

This sketch connects with one fresh token. It needs a workspace, so it was not run here. The empty-string connection with `PG` variables was tested in section 4.2.

```python
import os
import psycopg
from databricks.sdk import WorkspaceClient

w = WorkspaceClient()                          # app service principal
ENDPOINT = os.environ["LAKEBASE_ENDPOINT"]     # from valueFrom: postgres

def connect() -> psycopg.Connection:
    token = w.postgres.generate_database_credential(endpoint=ENDPOINT).token
    return psycopg.connect("", password=token)  # PGHOST, PGUSER, ... fill the rest
```

This mints one token per connection. That is correct, but a busy service opens many connections. [L3](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool) puts the same idea into a connection pool with a token cache.

For a Provisioned resource, `valueFrom` gives the host, and the credential call is `w.database.generate_database_credential(request_id=..., instance_names=[...])`, as the `databricks_ai_bridge` source shows (`lakebase.py` lines 337–354, version 0.22.0).

### 4.6 A connection test

Run one query that proves the identity, the database and the privileges that the code needs. This query ran in the sandbox as the app role of Design B:

```sql
SELECT current_user,
       current_database(),
       has_database_privilege(current_database(), 'CREATE') AS db_create,
       has_schema_privilege('chat', 'USAGE')                 AS chat_usage,
       has_schema_privilege('chat', 'CREATE')                AS chat_create,
       has_table_privilege('chat.messages', 'INSERT')        AS msg_insert;
```

```text
             current_user             | current_database | db_create | chat_usage | chat_create | msg_insert
--------------------------------------+------------------+-----------+------------+-------------+------------
 8c01cfb1-62c9-4a09-88a8-e195f4b01b08 | dbxb             | t         | t          | f           | t
```

In an app, compare `current_user` with `PGUSER`, and `current_database()` with `PGDATABASE`. Run the test at startup and log the result. If it fails, the log shows which step failed: token, login or privilege.

> [!trap] A health check can keep the database awake
> A probe that queries the database every minute is activity. With such a probe, the compute never reaches a longer inactivity timeout, so scale to zero never happens ([L1, section 4.3](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is)). Run the database test at startup and on demand, not on every health probe.

### 4.7 The same code on a laptop

The tutorial runs the same app locally. It uses `databricks auth login` and exports the same variables, but with `PGUSER` set to your own email. Your `WorkspaceClient` then uses your CLI profile ([CLI profiles](/notes/platforms/databricks/02-identity-and-auth/l1-cli-profiles)), mints a token for you, and Postgres sees your role. So local tests run with your privileges, not the app's. Test the app's privileges in a deployed test app.

### 4.8 Production view

| Concern | What to do |
|---|---|
| Security | Use Design B in production: the app gets `USAGE` and table privileges, not ownership. |
| Secrets | Keep no password in code or `app.yaml`. Mint tokens with `WorkspaceClient()`. |
| Configuration | Read the endpoint with `valueFrom`. Read the rest from the `PG` variables. |
| Reliability | Run the connection test at startup and fail fast with a clear message. |
| Migrations | Run all migrations as one owner role, so default privileges apply to every new table ([migrations as code](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code)). |
| Cost | Keep database queries out of frequent health probes, or scale to zero never happens. |
| Several databases | The `PG` variables reflect only the first database resource. Use `valueFrom` for any second database. |

## 5. Code

These exercises go in `databricks/10-lakebase-app-resource.ipynb`. Exercise 2.1 needs a workspace. Exercises 2.2 and 2.3 use your local PostgreSQL 16.

**Exercise 2.1: read what the platform gives.** Add a Lakebase Autoscaling resource to a test app, with `LAKEBASE_ENDPOINT` from `valueFrom`. Log the `PG` variables and `LAKEBASE_ENDPOINT`. Never log a token or a secret.

Acceptance tests:

- `PGUSER` equals `DATABRICKS_CLIENT_ID`.
- `LAKEBASE_ENDPOINT` starts with `projects/` and contains `/branches/` and `/endpoints/`.
- You record the value of `PGSSLMODE` and `PGPORT`.

**Exercise 2.2: the grants lab.** On your local server, create a login role named like a client ID. Give it `CONNECT` and `CREATE` on a test database. Create a schema and two tables as a second role. Reproduce every row of the Design B table in section 4.4, then fix each error with the smallest grant.

Acceptance tests:

- Each error message in your notebook matches the table word for word.
- After your grants, the app role can insert into both tables and cannot drop either table.
- A table that the second role creates after `ALTER DEFAULT PRIVILEGES` is readable by the app role with no new grant.

**Exercise 2.3: a connection test function.** Write `check_database(conn, schema, tables)` that runs the query of section 4.6 for every table and returns a dictionary.

Acceptance tests:

- For the app role of exercise 2.2, it reports `msg_insert = true` for both tables.
- For a role with no grants, it reports `chat_usage = false` and raises no exception.
- The function opens no new connection: it uses the one that you pass.

## 6. Common mistakes

1. **"The resource gives the app access to all tables."** It gives `CONNECT` and `CREATE` on the database. Tables owned by other roles need grants.
2. **Hard-coding the endpoint path in `app.yaml`.** Use `valueFrom` with the resource key, so the value follows the resource.
3. **Putting a database token in a secret.** It expires after one hour. Mint it in code.
4. **Forgetting `USAGE` on the schema.** Table grants alone still give "permission denied for schema".
5. **Using `serial` and forgetting the sequence grant.** Use identity columns, or grant `USAGE` on the sequences.
6. **Running migrations as different roles.** Default privileges then cover only some new tables.
7. **Testing privileges only on a laptop.** Locally, Postgres sees your role, not the app's role.

## 7. One-minute explanation

When you add a Lakebase database as an app resource, Databricks creates a Postgres role named after the app service principal's client ID. It grants that role `CONNECT` and `CREATE` on the database, under the only permission "Can connect and create". The app receives `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGSSLMODE` and `PGAPPNAME`, and the Postgres client reads them automatically. For an Autoscaling database, `valueFrom` with the resource key gives the endpoint path, which the credential call needs. In code, `WorkspaceClient()` authenticates as the service principal and mints a one-hour token, which becomes the password of each new connection. The resource does not open tables that other roles own. The app needs `USAGE` on the schema and table privileges, plus sequence privileges for `serial` columns. In production, let a migration role own the schema, and give the app only the privileges it needs. Then prove them with a connection test at startup.

## 8. Check questions

```check
{
  "question": "An app with a Lakebase resource runs SELECT count(*) FROM chat.messages and gets ERROR: permission denied for schema chat. The schema was created by a developer. What is missing, and what is the full fix?",
  "answer": "The app role has no USAGE on the schema chat. The resource gives only CONNECT and CREATE on the database. The schema owner must run GRANT USAGE ON SCHEMA chat to the client ID role, and also grant the table privileges, for example GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA chat, plus ALTER DEFAULT PRIVILEGES for future tables."
}
```

```check
{
  "question": "Which environment variable gives the app the endpoint path that generate_database_credential needs, and how?",
  "answer": "None of the PG variables holds it. You add an env entry in app.yaml with valueFrom set to the resource key, by default postgres for Autoscaling. For a Lakebase Autoscaling database, valueFrom resolves to the endpoint path, for example projects/my-project/branches/main/endpoints/ep123."
}
```

```check
{
  "question": "The app inserts into a table with a serial id and gets permission denied for sequence. Another table with GENERATED ALWAYS AS IDENTITY works. Why the difference?",
  "answer": "A serial column calls nextval on a separate sequence, and that sequence needs its own privilege, such as USAGE. In the sandbox test, an identity column needed no sequence grant: the INSERT privilege on the table was enough. The fix is to grant USAGE on the sequences, or better, to use identity columns."
}
```

```check
{
  "question": "Your app passes its connection test on your laptop but fails after deployment. Give the most likely reason.",
  "answer": "On the laptop, PGUSER is your email and the token is yours, so Postgres checks your privileges. In the deployed app, the role is the service principal's client ID, which has only CONNECT and CREATE on the database plus the grants you gave it. The test must run as the app's role, in a deployed test app."
}
```

## 9. Links

- Previous: [L1: What Lakebase is](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is)
- Next: [L3: LakebasePool](/notes/platforms/databricks/05-lakebase/l3-lakebase-pool)
- Resources in general: [App resources and secrets](/notes/platforms/databricks/01-apps/l2-app-resources-and-secrets)
- The app identity: [Databricks Apps](/notes/platforms/databricks/01-apps/l1-databricks-apps)
- Keys and constraints of the tables: [Tables, keys and constraints](/notes/databases/postgres/01-relational-basics/l1-tables-keys-and-constraints)
- [Glossary](/notes/platforms/databricks/glossary)
