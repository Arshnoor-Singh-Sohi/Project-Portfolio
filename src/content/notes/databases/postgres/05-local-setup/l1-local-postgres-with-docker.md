---
title: "L1: Local PostgreSQL with Docker"
order: 1
summary: "One command starts a PostgreSQL server for tests: the official postgres:16 image, its environment variables, a port bound to localhost, a named volume, pg_isready health checks, psql connections, init scripts in /docker-entrypoint-initdb.d, a Docker Compose file, matching the major version of production (Lakebase supports 16, 17 and 18), Windows with Docker Desktop and WSL 2, and the EDB installer as the alternative. Docker commands are from the official image docs and were not run in the sandbox. The equivalent SQL and client commands ran on PostgreSQL 16."
status: not-started
tags: [postgres, docker, docker-compose, pg-isready, local-development, wsl2, lakebase]
---

## 1. The question this idea answers

The exercises of this subject, and the tests of a chat store, need a real PostgreSQL server. A fake cannot show a lock queue, a constraint error or a serialization failure. The production database is Lakebase, a managed service that you cannot start on a laptop. So you need a local server that:

1. starts with one command and can be deleted at any time,
2. runs the **same major version** as production,
3. keeps its data between restarts when you want it, and loses it when you want that,
4. tells a test script when it is ready.

The official `postgres` Docker image does all four. This lesson explains each option with quotes from the image documentation and the PostgreSQL docs. Docker cannot run in the sandbox of these notes, so every Docker command below is labeled **not run here**. The SQL, `psql` and `pg_isready` steps ran on a local PostgreSQL 16.15 server.

## 2. Mental model

> [!analogy] A furnished flat from a catalog
> The image is the catalog entry: "PostgreSQL 16, Debian, everything installed". A container is one flat built from that entry. You can build a new flat in seconds and demolish it just as fast. The named volume is a storage unit outside the flat: demolish the flat, build a new one, connect the same storage unit, and your furniture (the data) is still there. The init scripts are a move-in checklist: the builder runs it once, when the storage unit is empty.
>
> **Where it stops working:** the checklist does not run again. If the storage unit already holds data, the builder skips the checklist and every setting for a first start, also a new password. Many "my init script did not run" problems come from an old volume.

## 3. Terms

| Term | Plain meaning |
|---|---|
| image | A read-only package of a program and its files, for example `postgres:16`. |
| tag | The name after the colon. It selects a version: `16`, `16.15`, `16-alpine`. |
| container | One running instance of an image, with its own file system and processes. |
| named volume | Storage that Docker manages and names. It lives on after the container is removed. |
| bind mount | A host folder that appears inside the container. |
| port mapping | `-p host_ip:host_port:container_port`: a host port that forwards to a container port. |
| `PGDATA` | The data directory of the server. In the `postgres:16` image it is `/var/lib/postgresql/data`. |
| init script | A `.sql` or `.sh` file in `/docker-entrypoint-initdb.d` that runs once, on the first start with an empty data directory. |
| `pg_isready` | A PostgreSQL tool that reports whether a server accepts connections, through its exit code. |
| health check | A command that Docker runs again and again to mark a container `healthy` or `unhealthy`. |
| Docker Compose | A tool that starts containers from a YAML file, `compose.yaml`. |
| major version | The first number of a PostgreSQL version, for example 16 in 16.15. Features and the data format change between major versions. |
| WSL 2 | Windows Subsystem for Linux 2: a Linux kernel inside Windows. Docker Desktop on Windows can run its engine there. |

## 4. Method and math

### 4.1 Choose the version: match production

The Databricks docs for Lakebase (page updated on 2026-10-09, checked on 2026-10-13): "Lakebase supports Postgres 16, Postgres 17, and Postgres 18." "Postgres 17 is the default." Also: "Lakebase does not upgrade a project to a new major Postgres version in place", and "Lakebase runs the latest Postgres minor release for each supported major version and updates it for you."

So the local major version must equal the major version of your Lakebase project. Read it from production with `SHOW server_version_num`, and pin the same major tag locally. The local test server of these notes answered:

```text
$ psql "postgresql://postgres@127.0.0.1:5433/pg" -Atc "SHOW server_version" -c "SHOW server_version_num"
16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
160015
```

`160015` means major 16, minor 15. The image tags on 2026-10-13: `16.15` and `16` both select PostgreSQL 16.15, while `latest` selects 18.6.

> [!trap] Never use postgres:latest for tests
> `latest` moved to 18 and will move again. Features differ between major versions: for example, native `uuidv7()` exists only from PostgreSQL 18 ([column types](/notes/databases/postgres/01-relational-basics/l2-column-types)). A test that passes with 18 can fail on a production project that runs 16. Pin the major version: `postgres:16`.

### 4.2 docker run, option by option (not run here)

```bash
docker run --name pg16 \
  -e POSTGRES_PASSWORD=dev-only-password \
  -e POSTGRES_DB=chatdb \
  -p 127.0.0.1:5432:5432 \
  -v pg16data:/var/lib/postgresql/data \
  -d postgres:16
```

| Option | What it does |
|---|---|
| `--name pg16` | A fixed name for later commands, such as `docker logs pg16`. |
| `-e POSTGRES_PASSWORD=...` | The image docs: "This environment variable is required for you to use the PostgreSQL image. It must not be empty or undefined." It sets the superuser password. |
| `-e POSTGRES_DB=chatdb` | "define a different name for the default database". "If it is not specified, then the value of `POSTGRES_USER` will be used." |
| `POSTGRES_USER` (not set here) | Creates that user "with superuser power and a database with the same name". Default: `postgres`. |
| `-p 127.0.0.1:5432:5432` | Host port 5432 on the loopback address only. The Compose reference warns: "If you do not specify a host IP (such as `127.0.0.1`), Docker binds to all interfaces (`0.0.0.0`), bypassing host firewall rules." If another PostgreSQL already uses 5432 on your computer, use `127.0.0.1:5433:5432`. |
| `-v pg16data:/var/lib/postgresql/data` | A named volume at `PGDATA`. The `postgres:16` Dockerfile sets `ENV PGDATA /var/lib/postgresql/data` and `VOLUME /var/lib/postgresql/data`. |
| `-d` | Run in the background. |

> [!trap] The volume path depends on the major version
> The image docs, for PostgreSQL 17 and below: "Mount the data volume at `/var/lib/postgresql/data` and not at `/var/lib/postgresql` because mounts at the latter path WILL NOT PERSIST database data when the container is re-created." For 18 and above, "The defined `VOLUME` was changed in 18 and above to `/var/lib/postgresql`." A wrong path makes Docker create an anonymous volume, and the data is lost on the next `docker rm`.

Two more rules from the image docs:

1. **First start only.** "the Docker specific variables will only have an effect if you start the container with a data directory that is empty; any pre-existing database will be left untouched on container startup." A changed `POSTGRES_PASSWORD` has no effect on an existing volume.
2. **Password auth from outside.** `POSTGRES_HOST_AUTH_METHOD` "If unspecified then `scram-sha-256` password authentication is used (in 14+...)". Inside the container, "a password is not required when connecting from `localhost`", because the image configures `trust` for local connections.

### 4.3 Connect with psql

| From | Command (not run here) |
|---|---|
| The host, with a `psql` client | `psql -h localhost -p 5432 -U postgres -d chatdb` (asks for the password) |
| Inside the container, no password | `docker exec -it pg16 psql -U postgres -d chatdb` |
| Python | `psycopg.connect("postgresql://postgres:dev-only-password@localhost:5432/chatdb")` |

The image docs add a note on `PGPASSWORD`: `POSTGRES_PASSWORD` "has no effect on the `PGPASSWORD` environment variable that may be used by the `psql` client at runtime". Keep the local password in a `.env` file that Git ignores, never in code.

### 4.4 Health checks with pg_isready

The PostgreSQL 16 docs: "`pg_isready` returns `0` to the shell if the server is accepting connections normally, `1` if the server is rejecting connections (for example during startup), `2` if there was no response to the connection attempt, and `3` if no attempt was made". "It is not necessary to supply correct user name, password, or database name values to obtain the server status". The default timeout is 3 seconds. On the local server:

```text
$ pg_isready -h 127.0.0.1 -p 5433 -U postgres ; echo "exit=$?"
127.0.0.1:5433 - accepting connections
exit=0
$ pg_isready -h 127.0.0.1 -p 5499 ; echo "exit=$?"
127.0.0.1:5499 - no response
exit=2
```

**Why a test must wait.** The image docs (Caveats): on the first start, `postgres` creates the default database, and "it will not accept incoming connections during that time. This may cause issues when using automation tools, such as `docker compose`, that start several containers simultaneously."

> [!note] Check over TCP, not over the socket
> The entrypoint script (docker-library/postgres, `docker-entrypoint.sh`) runs the init scripts on a temporary server that "does not listen on external TCP/IP": it starts it with `listen_addresses=''`. So `pg_isready` over the Unix socket inside the container can report ready while init scripts still run, and the server then restarts. `pg_isready -h 127.0.0.1` uses TCP and reports ready only after the final start. This follows from the script source. It was not tested here.

### 4.5 Init scripts

The image docs: "add one or more `*.sql`, `*.sql.gz`, or `*.sh` scripts under `/docker-entrypoint-initdb.d`". The entrypoint "will run any `*.sql` files, run any executable `*.sh` scripts, and source any non-executable `*.sh` scripts". "These initialization files will be executed in sorted name order". And the warning: "scripts in `/docker-entrypoint-initdb.d` are only run if you start the container with a data directory that is empty". The entrypoint source runs each `.sql` file with `psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --no-password --no-psqlrc`, on the database `POSTGRES_DB`.

`ON_ERROR_STOP` decides what a failing file does. The test ran a file whose second `CREATE TABLE` fails, against the local server:

| psql run | Exit code | Rows inserted by the third statement |
|---|---|---|
| Without `-v ON_ERROR_STOP=1` | 0 | 1. psql continued after the error. |
| With `-v ON_ERROR_STOP=1` | 3 | 0. psql stopped at the error. |

So in the container, one bad init file stops the first start. The docs warn about the next step: if "your orchestrator restarts the container with the already initialized data directory, it will not continue on with your scripts." Remove the volume and start again.

Good init scripts create what migrations should not own: roles, extensions, privileges. The test ran these two files against a fresh database `chatdb`, with the same `psql` flags as the entrypoint:

```sql
-- 01-app-role.sql
CREATE ROLE chat_app LOGIN PASSWORD 'dev-only-password';
GRANT CONNECT ON DATABASE chatdb TO chat_app;
GRANT USAGE ON SCHEMA public TO chat_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO chat_app;
```

The second file, `02-schema.sql`, created `chats` and `messages` as in [Chats, messages and parts](/notes/ai/conversation-state/02-chat-history-model/l1-chats-messages-and-parts). Then, connected as `chat_app`, an `INSERT INTO chats ... RETURNING owner_id, title` returned `ana | New chat`, and `CREATE TABLE x (id int)` failed with `permission denied for schema public`. The docs (§5.9.6) explain the second result. They describe a pattern that starts with "ensure that no schemas have public `CREATE` privileges", and say: "In PostgreSQL 15 and later, the default configuration supports this usage pattern."

> [!key] Init scripts for roles, migrations for the schema
> Put roles, extensions and grants in init scripts. Create the tables with the same migrations that production runs ([migrations as code](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code)). A schema that exists twice, once in init scripts and once in migrations, drifts apart.

### 4.6 A Docker Compose file (not run here)

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: dev-only-password
      POSTGRES_DB: chatdb
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./initdb:/docker-entrypoint-initdb.d:ro
    shm_size: 128mb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U postgres -d chatdb"]
      interval: 2s
      timeout: 3s
      retries: 15
volumes:
  pgdata:
```

| Part | Source of the rule |
|---|---|
| `shm_size: 128mb` | The official Compose example sets it, and the image docs: "the default `/dev/shm` size for containers is 64MB". When it is full you get `could not resize shared memory segment`. |
| `healthcheck.test` | Compose reference: a list that starts with `CMD-SHELL` "runs the command configured as a string using the container's default shell". |
| `"127.0.0.1:5432:5432"` | Compose reference: "`HOST:CONTAINER` should always be specified as a (quoted) string". |
| `depends_on` with `condition: service_healthy` | For another service, such as the app, that must wait: the dependency must be "healthy" (as indicated by `healthcheck`) "before starting a dependent service". |

The life cycle commands: `docker compose up -d` starts it, and `docker compose ps` shows the health. `docker compose down` removes containers and networks but keeps the named volume. The reference lists what it removes by default, and named volumes are not in that list. `docker compose down -v` also removes "named volumes declared in the "volumes" section of the Compose file". Use `down -v` when you want a clean first start.

### 4.7 Windows notes

Docker Desktop on Windows can run its engine in WSL 2, the WSL 2 backend. The Docker docs (checked on 2026-10-13): you need "At a minimum WSL version 2.1.5, but ideally the latest version of WSL". The setting "Use WSL 2 based engine" is on by default on systems that support WSL 2.

For bind mounts, such as the `./initdb` folder, the Docker best-practices page says to store "source code and other data that is bind-mounted into Linux containers" in the Linux file system, because "Performance is much higher when files are bind-mounted from the Linux filesystem". It names the pattern to avoid: `docker run -v /mnt/c/users:/users`, since `/mnt/c` is mounted from Windows. A named volume, such as `pgdata`, is managed by Docker and needs no host folder.

For Python on Windows, recall the psycopg rule from [L1 of Part 3](/notes/databases/postgres/03-python-driver/l1-psycopg-basics): `AsyncConnection` is not compatible with the default `ProactorEventLoop`.

### 4.8 The alternative: the EDB installer

The PostgreSQL download page for Windows offers an "Interactive installer by EDB". It includes "The PostgreSQL server", "pgAdmin, a graphical tool for managing and developing your databases" and "StackBuilder". The page notes: "This installer is hosted by EDB and not on the PostgreSQL community servers." The page lists PostgreSQL 16 as tested by EDB on the 64-bit Windows platforms "2022, 2019", and says that the installers "can generally be expected to run on other comparable versions, for example, desktop releases of Windows".

| | Docker container | EDB installer |
|---|---|---|
| Start a clean server | Seconds: remove the volume, start again | Reinstall, or drop and create databases |
| Several major versions side by side | Easy: one container per tag and port | Possible, but each version is a Windows service |
| Match production exactly | Pin the tag, for example `postgres:16` | Pick the installer version by hand |
| Needs | Docker Desktop and WSL 2 | Nothing else |
| GUI tool | Install separately | pgAdmin included |

For tests, the container wins: it is the same on every machine and in CI. The installer is fine for a person who only needs one long-lived server and pgAdmin.

### 4.9 Production view

| Concern | What to do |
|---|---|
| Version match | Pin `postgres:<major>` to the major version of the Lakebase project. Check it in a test with `SHOW server_version_num`. |
| Security | Bind to `127.0.0.1`. Keep passwords in an ignored `.env` file. Use an app role without `CREATE` rights. |
| Data | A named volume at the right path for the major version. `docker compose down -v` for a clean start. |
| Readiness | A health check with `pg_isready -h 127.0.0.1`. Tests wait for `healthy`. |
| Schema | Init scripts for roles and extensions. Migrations for tables, the same as production. |
| CI | The same Compose file or image tag in the CI pipeline, so that tests run against the same version everywhere. |

## 5. Code

Put the files in `postgres/10-local-docker/`: `compose.yaml`, `initdb/`, and a notebook `10-local-docker.ipynb`.

**Exercise 1.1: start, stop, keep.** Start `postgres:16` with a named volume. Create a table and insert one row. Remove the container with `docker rm -f` and start a new one with the same volume.

Acceptance tests:

- `SHOW server_version_num` returns a value from 160000 to 169999.
- The row is still there after the new start.
- `docker logs` of the second start contains `Skipping initialization`.

**Exercise 1.2: Compose with a health check.** Write the `compose.yaml` of section 4.6 with your own init script that creates an app role.

Acceptance tests:

- `docker compose ps` shows the service as `healthy`.
- As the app role, an `INSERT` works and a `CREATE TABLE` fails with `permission denied for schema public`.
- After `docker compose down -v` and `up -d`, the init script runs again.

**Exercise 1.3: a test fixture.** Write a `pytest` session fixture. It waits until `pg_isready -h 127.0.0.1` returns 0, with a limit of 30 s. Then it creates a fresh test database and runs your migration runner from [Part 4, L2](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code) on it.

Acceptance tests:

- Two test runs in a row both start from an empty schema.
- With the container stopped, the fixture fails within about 30 s with a clear message.

**Exercise 1.4: guard the version.** Write a test that compares the local major version with a `PROD_PG_MAJOR` setting.

Acceptance test: the test fails when you start `postgres:17` locally while `PROD_PG_MAJOR=16`.

## 6. Common mistakes

1. **`postgres:latest`.** The major version changes under you. Pin `postgres:16`, or the major version of production.
2. **The volume at `/var/lib/postgresql` for version 16.** Data goes to an anonymous volume and is lost when the container is re-created.
3. **Changing `POSTGRES_PASSWORD` and expecting a new password.** The variables act only on an empty data directory.
4. **"My init script did not run."** The volume already held a database. Remove it with `docker compose down -v`.
5. **`-p 5432:5432` with no host IP.** The port is open on all interfaces. Bind to `127.0.0.1`.
6. **Tests that connect right after `docker run`.** The first start needs time. Wait for `pg_isready` over TCP.
7. **The full schema in init scripts.** It drifts from the migrations. Create tables with migrations.

## 7. One-minute explanation

The official `postgres` Docker image gives a disposable local server with one command. Pin the tag to the major version of production: Lakebase supports 16, 17 and 18, and `latest` is 18 today, so a test on `latest` may pass where production fails. `POSTGRES_PASSWORD` is required, `POSTGRES_DB` names the first database, and these variables act only on the first start with an empty data directory. Map the port as `127.0.0.1:5432:5432` so that it is not open on the network. Put a named volume at `/var/lib/postgresql/data` for version 16, or the data is lost when the container is re-created. Files in `/docker-entrypoint-initdb.d` run once, in name order, with `ON_ERROR_STOP`, so use them for roles and grants and create tables with the real migrations. A health check with `pg_isready -h 127.0.0.1` tells tests when the server accepts connections. On Windows, Docker Desktop can run on WSL 2, and bind-mounted files belong in the Linux file system. The EDB installer is the alternative for one long-lived server with pgAdmin.

## 8. Check questions

```check
{
  "question": "You start postgres:16 with -v pgdata:/var/lib/postgresql/data and POSTGRES_PASSWORD=a. Later you change it to POSTGRES_PASSWORD=b, re-create the container with the same volume, and the new password fails. Why?",
  "answer": "The image applies POSTGRES_PASSWORD and the other Docker variables only when the data directory is empty. The volume already holds a database, so the entrypoint skipped initialization and the old password a is still valid. Change the password with ALTER ROLE, or remove the volume for a clean start."
}
```

```check
{
  "question": "Production runs a Lakebase project on Postgres 16. Your teammate's tests use postgres:latest and pass. Why is that a risk, and what do you change?",
  "answer": "latest is PostgreSQL 18 today (checked on 2026-10-13), and features differ between major versions, for example native uuidv7() exists only from 18. Code tested on 18 can fail on 16. Pin postgres:16 and add a test that checks SHOW server_version_num against the production major version."
}
```

```check
{
  "question": "A team puts CREATE TABLE statements for chats and messages in /docker-entrypoint-initdb.d and also keeps migration files. Name two problems.",
  "answer": "First, the schema exists twice and drifts: a new migration changes production but not the init script, so local tests run on a different schema. Second, init scripts run only on an empty data directory, so an existing local volume never receives later changes. Use init scripts for roles, grants and extensions, and run the migrations to create the tables."
}
```

```check
{
  "question": "What do the exit codes 0, 1 and 2 of pg_isready mean, and why should a container health check use -h 127.0.0.1?",
  "answer": "0: accepting connections. 1: rejecting connections, for example during startup. 2: no response. The image runs the init scripts on a temporary server that listens only on the Unix socket, so a socket check can pass during initialization. A TCP check with -h 127.0.0.1 passes only after the final server starts."
}
```

## 9. Links

- Previous: [Part 4, L2: Migrations as code](/notes/databases/postgres/04-schema-changes/l2-migrations-as-code)
- Production database: [What Lakebase is](/notes/platforms/databricks/05-lakebase/l1-what-lakebase-is)
- Test fixtures: [pytest fixtures and monkeypatch](/notes/software-engineering/python/03-tooling/l2-pytest-fixtures-and-monkeypatch)
- [Glossary](/notes/databases/postgres/glossary)
